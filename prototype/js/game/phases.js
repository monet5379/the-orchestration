import { PHASE, SCENE } from '../core/constants.js';
import { getBalance } from '../core/balance.js';
import { getPartialResult, resolveRps } from './rps.js';
import { pickInitialChoice, pickTieItem, pickOpponentMask } from '../ai/opponent.js';
import { canChange, spendChange, canBluff, spendBluff, getAdjustDurationMs } from './resources.js';
import { applyPenalty, isDefeated, formatPenalties } from './penalties.js';
import { createMatchState, createInitialState } from './state.js';
import {
  DEFAULT_TIE_ITEMS,
  getItemLabel,
  getInstinctItemReading,
  getInstinctLogMessage,
  didOpponentChange,
  ITEM,
} from './items.js';
import { appendReplayEvent, buildMatchSummary } from './replay.js';
import { applyMaskToCombatant, isMaskInstinctActive, getMaskInstinctLogMessage } from './masks.js';
import { createNextMatchState } from '../scenes/cell.js';

/** @typedef {import('../core/constants.js').Move} Move */

/**
 * @param {object} state
 * @param {string} message
 * @returns {object}
 */
function appendLog(state, message) {
  return { ...state, matchLog: [...state.matchLog, message] };
}

/**
 * @param {object} state
 * @param {object} event
 * @returns {object}
 */
function appendReplay(state, event) {
  return {
    ...state,
    replay: appendReplayEvent(state.replay ?? { events: [], matchStartMs: Date.now() }, {
      turn: state.turn,
      phase: state.phase,
      ...event,
    }),
  };
}

/**
 * @param {object} state
 * @param {string} message
 * @param {object} replayEvent
 * @returns {object}
 */
function appendLogAndReplay(state, message, replayEvent) {
  return appendReplay(appendLog(state, message), replayEvent);
}

/**
 * @param {object} combatant
 * @returns {object}
 */
function resetCombatantChoice(combatant) {
  return { ...combatant, choice: null, finalChoice: null };
}

/**
 * @param {object} combatant
 * @returns {object}
 */
function clearActiveItem(combatant) {
  return { ...combatant, activeItem: null };
}

/**
 * @param {object} combatant
 * @returns {object}
 */
function lockFinalChoice(combatant) {
  return {
    ...combatant,
    finalChoice: combatant.finalChoice ?? combatant.choice,
  };
}

/**
 * @param {object} state
 * @returns {boolean}
 */
function isActiveMatch(state) {
  return state.scene === SCENE.MATCH && state.phase !== PHASE.MATCH_END;
}

/**
 * @param {object} state
 * @param {object} player
 * @param {object} opponent
 * @returns {object}
 */
function advanceToNextTurn(state, player, opponent) {
  const nextTurn = state.turn + 1;
  const nextInitiative =
    state.initiative === 'player' ? 'opponent' : 'player';
  const orderLabel = nextInitiative === 'player' ? '선공' : '후공';
  return appendLogAndReplay(
    {
      ...state,
      phase: PHASE.SELECT,
      turn: nextTurn,
      initiative: nextInitiative,
      partialResult: null,
      lastResolve: null,
      cpuAdjusted: false,
      playerAdjusted: false,
      cpuBluffedThisTurn: false,
      opponentButtonHint: null,
      tieItemsRemaining: [],
      tieLootSelection: null,
      player: resetCombatantChoice(player),
      opponent: resetCombatantChoice(opponent),
    },
    `[턴 ${nextTurn}] SELECT · 이번 수정: ${orderLabel}`,
    { kind: 'select', actor: 'system', payload: { message: 'next turn' } },
  );
}

const OUTCOME_LABEL = {
  win: '승리',
  lose: '패배',
  draw: '무승부',
};

const PARTIAL_LABEL = {
  winner_exists: '승자 있음',
  draw: '무승부',
};

/**
 * CPU ADJUST 확정 시 상대 버튼 힌트를 항상 기록.
 * 본능·가면이 있을 때만 정확 감지 로그를 남긴다.
 * @param {object} state
 * @param {object} opponent
 * @param {boolean} cpuBluffedThisTurn
 * @returns {object}
 */
function applyOpponentButtonHint(state, opponent, cpuBluffedThisTurn) {
  if (state.phase !== PHASE.ADJUST) {
    return { ...state, opponent, cpuBluffedThisTurn };
  }
  if (!state.cpuAdjusted && !cpuBluffedThisTurn) {
    return { ...state, opponent, cpuBluffedThisTurn };
  }

  const reading = getInstinctItemReading(opponent, cpuBluffedThisTurn);
  // 최종 행동 1회 커밋 — 이미 안내가 있으면 덮어쓰지 않음
  if (state.opponentButtonHint) {
    return { ...state, opponent, cpuBluffedThisTurn };
  }

  let next = {
    ...state,
    opponent,
    cpuBluffedThisTurn,
    opponentButtonHint: reading,
  };

  const hasInstinct = state.player.activeItem === ITEM.INSTINCT;
  const hasMaskHint = isMaskInstinctActive(state);
  if (hasInstinct) {
    next = appendLog(next, getInstinctLogMessage(reading));
  } else if (hasMaskHint) {
    next = appendLog(next, getMaskInstinctLogMessage(reading));
  }
  return next;
}

/**
 * @param {object} baseState
 * @returns {object}
 */
function initMatchFromOptions(baseState) {
  const orderLabel = baseState.initiative === 'player' ? '선공' : '후공';
  let state = appendLog(baseState, `[매치] 첫 수정: ${orderLabel}`);
  state = appendLog(state, '[턴 1] SELECT');
  state = appendReplay(state, {
    kind: 'select',
    actor: 'system',
    payload: { message: 'match start' },
  });
  return state;
}

/**
 * @param {object} state
 * @param {{ type: string, move?: Move, itemId?: string, matchState?: object, save?: object, maskId?: string }} action
 * @returns {object}
 */
export function reducePhase(state, action) {
  switch (action.type) {
    case 'START_MATCH': {
      const opponentMaskId = action.opponentMaskId ?? pickOpponentMask([]);
      let fresh = createMatchState({
        opponentMaskId,
        equippedMaskId: action.equippedMaskId ?? null,
      });
      if (fresh.equippedMaskId) {
        fresh = {
          ...fresh,
          player: applyMaskToCombatant(fresh.player, fresh.equippedMaskId),
        };
      }
      return initMatchFromOptions(fresh);
    }

    case 'START_NEXT_MATCH': {
      if (!action.save) return state;
      return initMatchFromOptions(createNextMatchState(action.save));
    }

    case 'RETURN_TO_MENU':
    case 'LEAVE_CELL': {
      return createInitialState();
    }

    case 'FORCE_WIN': {
      if (!isActiveMatch(state)) return state;
      const opponent = {
        ...state.opponent,
        penalties: getBalance().match.maxPenalties,
      };
      const withPenalties = {
        ...state,
        opponent,
        phase: PHASE.MATCH_END,
        scene: SCENE.CELL,
        winner: 'player',
      };
      const next = {
        ...withPenalties,
        pendingCell: {
          opponentMaskId: state.opponentMaskId,
          replay: withPenalties.replay,
          summary: buildMatchSummary(withPenalties),
          persisted: false,
        },
      };
      return appendLogAndReplay(
        next,
        `[MATCH END] victory → cell (force) · CPU ${formatPenalties(opponent)}`,
        {
          kind: 'match_end',
          actor: 'system',
          payload: {
            winner: 'player',
            forced: true,
            opponentPenalties: opponent.penalties,
          },
        },
      );
    }

    case 'FORCE_LOSE': {
      if (!isActiveMatch(state)) return state;
      const player = {
        ...state.player,
        penalties: getBalance().match.maxPenalties,
      };
      return appendLogAndReplay(
        {
          ...state,
          player,
          phase: PHASE.MATCH_END,
          scene: SCENE.GAMEOVER,
          winner: 'opponent',
        },
        `[MATCH END] defeat (force) · player ${formatPenalties(player)}`,
        {
          kind: 'match_end',
          actor: 'system',
          payload: {
            winner: 'opponent',
            forced: true,
            playerPenalties: player.penalties,
          },
        },
      );
    }

    case 'SELECT_MOVE': {
      if (!isActiveMatch(state) || state.phase !== PHASE.SELECT) return state;
      if (!action.move) return state;

      const player = {
        ...state.player,
        choice: action.move,
        finalChoice: null,
      };

      if (state.player.choice === action.move) {
        return { ...state, player };
      }

      return appendLogAndReplay(
        { ...state, player },
        `[PLAYER] ${action.move}`,
        { kind: 'select', actor: 'player', payload: { move: action.move } },
      );
    }

    case 'COMMIT_SELECT': {
      if (!isActiveMatch(state) || state.phase !== PHASE.SELECT) return state;
      if (!state.player.choice) return state;

      const cpuMove = pickInitialChoice(state);
      const partialResult = getPartialResult(state.player.choice, cpuMove);

      return appendLogAndReplay(
        {
          ...state,
          phase: PHASE.REVEAL,
          partialResult,
          cpuAdjusted: false,
          playerAdjusted: false,
          cpuBluffedThisTurn: false,
          opponentButtonHint: null,
          opponent: {
            ...state.opponent,
            choice: cpuMove,
            finalChoice: null,
          },
          player: {
            ...state.player,
            finalChoice: null,
          },
        },
        `[REVEAL] ${PARTIAL_LABEL[partialResult]}`,
        {
          kind: 'reveal',
          actor: 'system',
          payload: { partialResult, playerMove: state.player.choice },
        },
      );
    }

    case 'ENTER_ADJUST': {
      if (!isActiveMatch(state) || state.phase !== PHASE.REVEAL) return state;

      const adjustTimerMs = getAdjustDurationMs(state);
      const timeWarpNote =
        state.player.activeItem === ITEM.TIME_WARP ? ' (+2s 시간 팽창)' : '';

      let next = appendLogAndReplay(
        {
          ...state,
          phase: PHASE.ADJUST,
          adjustTimerMs,
          player: {
            ...state.player,
            finalChoice: state.player.choice,
          },
          opponent: {
            ...state.opponent,
            finalChoice: state.opponent.choice,
          },
        },
        `[ADJUST] ${(adjustTimerMs / 1000).toFixed(0)}초 — 유지·변경·페이크${timeWarpNote}`,
        {
          kind: 'adjust_start',
          actor: 'system',
          payload: { durationMs: adjustTimerMs },
        },
      );

      return next;
    }

    case 'ADJUST_CHANGE': {
      if (!isActiveMatch(state) || state.phase !== PHASE.ADJUST) return state;
      if (state.playerAdjusted) return state;
      if (isWaitingForOpponentAdjust(state)) return state;
      if (!action.move) return state;
      if (!canChange(state.player)) return state;

      const current = state.player.finalChoice ?? state.player.choice;
      if (current === action.move) return state;

      const player = spendChange({
        ...state.player,
        finalChoice: action.move,
      });

      return appendLogAndReplay(
        { ...state, player, playerAdjusted: 'changed' },
        `[ADJUST] player: ${current} → ${action.move} (changed)`,
        {
          kind: 'adjust',
          actor: 'player',
          payload: { from: current, to: action.move },
        },
      );
    }

    case 'ADJUST_CONFIRM': {
      if (!isActiveMatch(state) || state.phase !== PHASE.ADJUST) return state;
      if (state.playerAdjusted) return state;
      if (isWaitingForOpponentAdjust(state)) return state;

      const current = state.player.finalChoice ?? state.player.choice;
      return appendLogAndReplay(
        { ...state, playerAdjusted: 'kept' },
        `[ADJUST] player: ${current} (kept)`,
        { kind: 'adjust', actor: 'player', payload: { kept: true, move: current } },
      );
    }

    case 'ADJUST_BLUFF': {
      if (!isActiveMatch(state) || state.phase !== PHASE.ADJUST) return state;
      if (state.playerAdjusted) return state;
      if (isWaitingForOpponentAdjust(state)) return state;
      if (!canBluff(state.player)) return state;

      const player = spendBluff(state.player);
      return appendLogAndReplay(
        { ...state, player, playerAdjusted: 'bluffed' },
        '[BLUFF] player: fake (패 불변)',
        { kind: 'bluff', actor: 'player', payload: {} },
      );
    }

    case 'CPU_ADJUST': {
      if (!isActiveMatch(state) || state.phase !== PHASE.ADJUST || state.cpuAdjusted) {
        return state;
      }
      if (!action.move && !action.kept) return state;

      if (action.kept) {
        return applyOpponentButtonHint(
          appendLogAndReplay(
            { ...state, cpuAdjusted: true },
            '[ADJUST] cpu: (hidden) kept',
            { kind: 'adjust', actor: 'cpu', hidden: true, payload: { kept: true } },
          ),
          state.opponent,
          state.cpuBluffedThisTurn,
        );
      }

      if (state.cpuBluffedThisTurn || didOpponentChange(state.opponent)) {
        return state;
      }

      const opponent = spendChange({
        ...state.opponent,
        finalChoice: action.move,
      });

      return applyOpponentButtonHint(
        appendLogAndReplay(
          { ...state, opponent, cpuAdjusted: true },
          '[ADJUST] cpu: (hidden) changed',
          {
            kind: 'adjust',
            actor: 'cpu',
            hidden: true,
            payload: { from: state.opponent.finalChoice, to: action.move },
          },
        ),
        opponent,
        state.cpuBluffedThisTurn,
      );
    }

    case 'CPU_BLUFF': {
      if (!isActiveMatch(state) || state.phase !== PHASE.ADJUST) return state;
      if (!canBluff(state.opponent)) return state;
      if (state.cpuBluffedThisTurn) return state;
      if (didOpponentChange(state.opponent)) return state;

      const opponent = spendBluff(state.opponent);
      return applyOpponentButtonHint(
        appendLogAndReplay(
          {
            ...state,
            opponent,
            cpuAdjusted: true,
            cpuBluffedThisTurn: true,
          },
          '[BLUFF] cpu: (hidden) fake',
          { kind: 'bluff', actor: 'cpu', hidden: true, payload: {} },
        ),
        opponent,
        true,
      );
    }

    case 'ADVANCE_TO_RESOLVE': {
      if (!isActiveMatch(state) || state.phase !== PHASE.ADJUST) return state;

      let player = lockFinalChoice(state.player);
      let opponent = lockFinalChoice(state.opponent);
      if (player.activeItem === ITEM.INSTINCT) {
        player = clearActiveItem(player);
      }
      const outcome = resolveRps(player.finalChoice, opponent.finalChoice);

      const next = {
        ...state,
        phase: PHASE.RESOLVE,
        opponentButtonHint: null,
        player,
        opponent,
        lastResolve: {
          outcome,
          playerMove: player.finalChoice,
          opponentMove: opponent.finalChoice,
        },
      };

      return appendLogAndReplay(
        next,
        `[RESOLVE] ${player.finalChoice} vs ${opponent.finalChoice} → ${OUTCOME_LABEL[outcome]}`,
        {
          kind: 'resolve',
          actor: 'system',
          payload: {
            outcome,
            playerMove: player.finalChoice,
            opponentMove: opponent.finalChoice,
          },
        },
      );
    }

    case 'TIE_PICK': {
      if (state.phase !== PHASE.TIE_LOOT || !action.itemId) return state;
      if (!state.tieItemsRemaining?.includes(action.itemId)) return state;

      const player = { ...state.player, activeItem: action.itemId };
      let remaining = state.tieItemsRemaining.filter((id) => id !== action.itemId);

      let opponent = state.opponent;
      const cpuPick = pickTieItem(remaining);
      if (cpuPick) {
        opponent = { ...opponent, activeItem: cpuPick };
        remaining = remaining.filter((id) => id !== cpuPick);
      }

      let next = appendLogAndReplay(
        { ...state, player, opponent, tieItemsRemaining: [] },
        `[TIE LOOT] player: ${getItemLabel(action.itemId)}`,
        {
          kind: 'tie_loot',
          actor: 'player',
          payload: { itemId: action.itemId },
        },
      );

      if (cpuPick) {
        next = appendLogAndReplay(
          next,
          `[TIE LOOT] cpu: ${getItemLabel(cpuPick)} (hidden)`,
          { kind: 'tie_loot', actor: 'cpu', hidden: true, payload: { itemId: cpuPick } },
        );
      }

      if (remaining.length > 0) {
        next = appendLog(next, `[TIE LOOT] table left: ${remaining.map(getItemLabel).join(', ')}`);
      }

      return advanceToNextTurn(next, player, opponent);
    }

    case 'TIE_LOOT_SELECT': {
      if (state.phase !== PHASE.TIE_LOOT || !action.itemId) return state;
      if (!state.tieItemsRemaining?.includes(action.itemId)) return state;
      return { ...state, tieLootSelection: action.itemId };
    }

    case 'COMPLETE_RESOLVE': {
      if (state.phase !== PHASE.RESOLVE || !state.lastResolve) return state;

      const { outcome } = state.lastResolve;
      let player = state.player;
      let opponent = state.opponent;
      let next = { ...state };

      if (outcome === 'lose') {
        player = applyPenalty(player);
        next = appendLogAndReplay(
          next,
          `[PENALTY] player: ${formatPenalties(player)}`,
          { kind: 'penalty', actor: 'player', payload: { penalties: player.penalties } },
        );
      } else if (outcome === 'win') {
        opponent = applyPenalty(opponent);
        next = appendLogAndReplay(
          next,
          `[PENALTY] cpu: ${formatPenalties(opponent)}`,
          { kind: 'penalty', actor: 'cpu', payload: { penalties: opponent.penalties } },
        );
      }

      next = { ...next, player, opponent };

      if (isDefeated(player)) {
        return appendLogAndReplay(
          {
            ...next,
            phase: PHASE.MATCH_END,
            scene: SCENE.GAMEOVER,
            winner: 'opponent',
          },
          '[MATCH END] defeat',
          { kind: 'match_end', actor: 'system', payload: { winner: 'opponent' } },
        );
      }

      if (isDefeated(opponent)) {
        return appendLogAndReplay(
          {
            ...next,
            phase: PHASE.MATCH_END,
            scene: SCENE.CELL,
            winner: 'player',
            pendingCell: {
              opponentMaskId: state.opponentMaskId,
              replay: next.replay,
              summary: buildMatchSummary({ ...next, winner: 'player' }),
              persisted: false,
            },
          },
          '[MATCH END] victory → cell',
          { kind: 'match_end', actor: 'system', payload: { winner: 'player' } },
        );
      }

      if (outcome === 'draw') {
        const tieItemsRemaining = [...DEFAULT_TIE_ITEMS];
        return appendLog(
          {
            ...next,
            phase: PHASE.TIE_LOOT,
            tieItemsRemaining,
            tieLootSelection: tieItemsRemaining[0],
            lastResolve: state.lastResolve,
            opponentButtonHint: null,
            cpuBluffedThisTurn: false,
            player: clearActiveItem(player),
            opponent: clearActiveItem(opponent),
          },
          `[TIE LOOT] ${tieItemsRemaining.map(getItemLabel).join(', ')}`,
        );
      }

      return advanceToNextTurn(
        next,
        clearActiveItem(player),
        clearActiveItem(opponent),
      );
    }

    default:
      return state;
  }
}

/**
 * 후공: 상대 ADJUST 확정 전까지 플레이어 입력 대기
 * @param {object} state
 * @returns {boolean}
 */
export function isWaitingForOpponentAdjust(state) {
  return state.initiative === 'opponent' && !state.cpuAdjusted;
}

/**
 * @param {string} phase
 * @returns {boolean}
 */
export function canSelectMove(phase) {
  return phase === PHASE.SELECT;
}

/**
 * @param {string} phase
 * @param {object} player
 * @param {boolean} [committed]
 * @param {boolean} [waitingForOpponent]
 * @returns {boolean}
 */
export function canAdjustChange(phase, player, committed = false, waitingForOpponent = false) {
  return (
    phase === PHASE.ADJUST &&
    !committed &&
    !waitingForOpponent &&
    canChange(player)
  );
}

/**
 * @param {string} phase
 * @param {object} player
 * @param {boolean} [committed]
 * @param {boolean} [waitingForOpponent]
 * @returns {boolean}
 */
export function canAdjustBluff(phase, player, committed = false, waitingForOpponent = false) {
  return (
    phase === PHASE.ADJUST &&
    !committed &&
    !waitingForOpponent &&
    canBluff(player)
  );
}

/**
 * @param {string} phase
 * @param {boolean} [committed]
 * @param {boolean} [waitingForOpponent]
 * @returns {boolean}
 */
export function canAdjustConfirm(phase, committed = false, waitingForOpponent = false) {
  return phase === PHASE.ADJUST && !committed && !waitingForOpponent;
}

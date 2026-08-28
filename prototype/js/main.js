import { createInitialState } from './game/state.js';
import { reducePhase } from './game/phases.js';
import { PHASE, SCENE } from './core/constants.js';
import {
  REVEAL_DELAY_MS,
  RESOLVE_DELAY_MS,
  SELECT_COMMIT_DELAY_MS,
  ADJUST_DURATION_MS,
  SELECT_DURATION_MS,
} from './core/timing.js';
import { MOVE } from './core/constants.js';
import { planCpuAdjust, maybeBluff, pickOpponentMask } from './ai/opponent.js';
import { didOpponentChange } from './game/items.js';
import { isMatchActive } from './scenes/match.js';
import {
  persistVictory,
  equipMask,
  recordDefeat,
} from './scenes/cell.js';
import { loadOrCreateSave, clearSave, hasSaveProgress } from './core/storage.js';
import { initButtonPanel, getAdjustTimerElement } from './ui/button-panel.js';
import { initTieLootPanel } from './ui/tie-loot-panel.js';
import { initOverlay } from './ui/overlay.js';
import { render, setEquipMaskHandler } from './ui/renderer.js';
import { startAdjustCountdown, stopCountdown } from './ui/countdown.js';
import { preloadAudio, playBluffClick, playMetalClick } from './ui/audio.js';
import { flashPovBluff } from './ui/pov-viewport.js';
import { resetCeilingScreen } from './ui/ceiling-screen.js';
import { initCellScene } from './ui/cell-scene.js';
import { initVhsPlayer } from './ui/vhs-player.js';
import { applyDevModeUi, toggleDevMode } from './ui/dev-mode.js';

/** @type {object} */
let state = createInitialState();

/** @type {object} */
let save = loadOrCreateSave();

/** @type {ReturnType<typeof setTimeout> | null} */
let commitTimer = null;

/** @type {ReturnType<typeof setTimeout>[]} */
const phaseTimers = [];

function clearAllTimers() {
  if (commitTimer) {
    clearTimeout(commitTimer);
    commitTimer = null;
  }
  for (const id of phaseTimers) clearTimeout(id);
  phaseTimers.length = 0;
  stopCountdown();
}

/**
 * @param {ReturnType<typeof setTimeout>} id
 */
function trackTimer(id) {
  phaseTimers.push(id);
}

/**
 * @param {{ type: string, move?: string, kept?: boolean, itemId?: string, save?: object, opponentMaskId?: string, equippedMaskId?: string | null }} action
 */
function dispatch(action) {
  const prevPhase = state.phase;
  const prevScene = state.scene;

  state = reducePhase(state, action);

  if (
    state.scene === SCENE.CELL &&
    state.pendingCell &&
    !state.pendingCell.persisted
  ) {
    const result = persistVictory(save, state);
    save = result.save;
    state = {
      ...state,
      pendingCell: { ...state.pendingCell, persisted: true },
      cellReward: {
        newMaskId: result.newMaskId,
        alreadyOwned: result.alreadyOwned,
      },
    };
  }

  if (
    state.scene === SCENE.GAMEOVER &&
    state.winner === 'opponent' &&
    (action.type === 'COMPLETE_RESOLVE' || action.type === 'FORCE_LOSE')
  ) {
    save = recordDefeat(save);
  }

  render(state, save);

  if (action.type === 'CPU_BLUFF') {
    playBluffClick();
    flashPovBluff();
  }
  if (action.type === 'SELECT_MOVE' && prevPhase === PHASE.SELECT) {
    playMetalClick();
    flashPovBluff();
  }

  if (state.phase === PHASE.MATCH_END || state.scene === SCENE.GAMEOVER) {
    if (
      action.type === 'COMPLETE_RESOLVE' ||
      action.type === 'TIE_PICK' ||
      action.type === 'FORCE_WIN' ||
      action.type === 'FORCE_LOSE'
    ) {
      clearAllTimers();
    }
  }

  if (prevScene === SCENE.CELL && state.scene === SCENE.MATCH) {
    resetCeilingScreen();
  }

  schedulePhaseTransitions(action.type, prevPhase);
}

/**
 * @param {string} lastActionType
 * @param {string} prevPhase
 */
function schedulePhaseTransitions(lastActionType, prevPhase) {
  if (state.phase === PHASE.SELECT && prevPhase !== PHASE.SELECT) {
    beginSelectPhase();
  }

  if (state.phase === PHASE.REVEAL && lastActionType === 'COMMIT_SELECT') {
    trackTimer(
      setTimeout(() => dispatch({ type: 'ENTER_ADJUST' }), REVEAL_DELAY_MS),
    );
  }

  if (state.phase === PHASE.ADJUST && lastActionType === 'ENTER_ADJUST') {
    beginAdjustPhase();
  }

  if (
    state.phase === PHASE.ADJUST &&
    (lastActionType === 'ADJUST_CHANGE' ||
      lastActionType === 'ADJUST_CONFIRM' ||
      lastActionType === 'ADJUST_BLUFF' ||
      lastActionType === 'CPU_ADJUST' ||
      lastActionType === 'CPU_BLUFF')
  ) {
    maybeAdvanceAdjustEarly();
  }

  if (state.phase === PHASE.RESOLVE && lastActionType === 'ADVANCE_TO_RESOLVE') {
    trackTimer(
      setTimeout(() => dispatch({ type: 'COMPLETE_RESOLVE' }), RESOLVE_DELAY_MS),
    );
  }
}

/** 플레이어·상대 모두 ADJUST 결정을 마치면 타이머를 끊고 즉시 RESOLVE */
function maybeAdvanceAdjustEarly() {
  if (!isMatchActive(state) || state.phase !== PHASE.ADJUST) return;
  if (!state.playerAdjusted || !state.cpuAdjusted) return;

  clearAllTimers();
  dispatch({ type: 'ADVANCE_TO_RESOLVE' });
}

function beginSelectPhase() {
  const duration = SELECT_DURATION_MS;
  const buttonPanel = document.getElementById('button-panel');
  const timerEl = buttonPanel ? getAdjustTimerElement(buttonPanel) : null;

  if (timerEl) {
    startAdjustCountdown(
      timerEl,
      duration,
      () => {
        stopCountdown();
        if (isMatchActive(state) && state.phase === PHASE.SELECT) {
          onSelectTimeout();
        }
      },
      '패 선택 남은 시간',
    );
  } else {
    trackTimer(
      setTimeout(() => {
        if (isMatchActive(state) && state.phase === PHASE.SELECT) {
          onSelectTimeout();
        }
      }, duration),
    );
  }
}

function onSelectTimeout() {
  if (commitTimer) {
    clearTimeout(commitTimer);
    commitTimer = null;
  }

  if (!state.player.choice) {
    const moves = [MOVE.ROCK, MOVE.PAPER, MOVE.SCISSORS];
    const move = moves[Math.floor(Math.random() * moves.length)];
    dispatch({ type: 'SELECT_MOVE', move });
  }

  dispatch({ type: 'COMMIT_SELECT' });
}

function beginAdjustPhase() {
  const duration = state.adjustTimerMs ?? ADJUST_DURATION_MS;
  const buttonPanel = document.getElementById('button-panel');
  const timerEl = buttonPanel ? getAdjustTimerElement(buttonPanel) : null;

  if (timerEl) {
    startAdjustCountdown(timerEl, duration, () => {
      stopCountdown();
      if (isMatchActive(state) && state.phase === PHASE.ADJUST) {
        dispatch({ type: 'ADVANCE_TO_RESOLVE' });
      }
    });
  } else {
    trackTimer(
      setTimeout(() => {
        if (isMatchActive(state) && state.phase === PHASE.ADJUST) {
          dispatch({ type: 'ADVANCE_TO_RESOLVE' });
        }
      }, duration),
    );
  }

  const cpuDelay = 1000 + Math.random() * 3000;
  trackTimer(
    setTimeout(() => {
      if (!isMatchActive(state) || state.phase !== PHASE.ADJUST || state.cpuAdjusted) {
        return;
      }

      const plan = planCpuAdjust(state);
      if (plan.changed && plan.move) {
        dispatch({ type: 'CPU_ADJUST', move: plan.move });
      } else {
        dispatch({ type: 'CPU_ADJUST', kept: true });
      }

      if (!isMatchActive(state) || state.phase !== PHASE.ADJUST) {
        return;
      }

      const bluffDelay = 300 + Math.random() * 800;
      trackTimer(
        setTimeout(() => {
          if (!isMatchActive(state) || state.phase !== PHASE.ADJUST) return;
          if (didOpponentChange(state.opponent)) return;
          if (maybeBluff(state)) {
            dispatch({ type: 'CPU_BLUFF' });
          }
        }, bluffDelay),
      );
    }, cpuDelay),
  );
}

/**
 * @param {string} move
 */
function onSelectMove(move) {
  if (!isMatchActive(state)) return;

  if (state.phase === PHASE.SELECT) {
    dispatch({ type: 'SELECT_MOVE', move });

    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(() => {
      commitTimer = null;
      if (isMatchActive(state) && state.phase === PHASE.SELECT) {
        dispatch({ type: 'COMMIT_SELECT' });
      }
    }, SELECT_COMMIT_DELAY_MS);
    return;
  }

  if (state.phase === PHASE.ADJUST) {
    dispatch({ type: 'ADJUST_CHANGE', move });
  }
}

function onConfirmAdjust() {
  if (!isMatchActive(state) || state.phase !== PHASE.ADJUST) return;
  dispatch({ type: 'ADJUST_CONFIRM' });
}

function onBluff() {
  if (!isMatchActive(state) || state.phase !== PHASE.ADJUST) return;
  dispatch({ type: 'ADJUST_BLUFF' });
}

function onTieSelect(itemId) {
  if (state.phase !== PHASE.TIE_LOOT) return;
  dispatch({ type: 'TIE_LOOT_SELECT', itemId });
}

function onTieConfirm() {
  if (state.phase !== PHASE.TIE_LOOT || !state.tieLootSelection) return;
  clearAllTimers();
  dispatch({ type: 'TIE_PICK', itemId: state.tieLootSelection });
}

function returnToTitle() {
  clearAllTimers();
  resetCeilingScreen();
  dispatch({ type: 'RETURN_TO_MENU' });
}

function forceWin() {
  if (!isMatchActive(state)) return;
  clearAllTimers();
  dispatch({ type: 'FORCE_WIN' });
}

function forceLose() {
  if (!isMatchActive(state)) return;
  clearAllTimers();
  dispatch({ type: 'FORCE_LOSE' });
}

function startMatch() {
  clearAllTimers();
  resetCeilingScreen();
  dispatch({
    type: 'START_MATCH',
    opponentMaskId: pickOpponentMask(save.masks.unlocked),
    equippedMaskId: save.masks.equipped,
  });
}

function continueMatch() {
  if (!hasSaveProgress(save)) return;
  startMatch();
}

function newGame() {
  if (hasSaveProgress(save)) {
    const ok = window.confirm(
      '가면과 전적이 모두 삭제됩니다. 새 게임을 시작할까요?',
    );
    if (!ok) return;
  }
  save = clearSave();
  startMatch();
}

function onNextMatch() {
  clearAllTimers();
  resetCeilingScreen();
  dispatch({ type: 'START_NEXT_MATCH', save });
}

function onLeaveCell() {
  clearAllTimers();
  dispatch({ type: 'LEAVE_CELL' });
}

/**
 * @param {string} maskId
 */
function onEquipMask(maskId) {
  save = equipMask(save, maskId);
  render(state, save);
}

async function boot() {
  const buttonPanel = document.getElementById('button-panel');
  const tieLootPanel = document.getElementById('tie-loot-panel');
  const vhsPlayer = document.getElementById('vhs-player');

  // UI 핸들러는 await 전에 등록 — preloadAudio 대기 중 클릭해도 매치 시작 가능
  if (buttonPanel) {
    initButtonPanel(buttonPanel, {
      onSelectMove,
      onConfirm: onConfirmAdjust,
      onBluff,
    });
  }

  if (tieLootPanel) {
    initTieLootPanel(tieLootPanel, {
      onSelect: onTieSelect,
      onConfirm: onTieConfirm,
    });
  }

  initOverlay({
    onContinue: continueMatch,
    onNewGame: newGame,
    onRestart: startMatch,
  });

  initCellScene({
    onNextMatch,
    onLeave: onLeaveCell,
  });

  setEquipMaskHandler(onEquipMask);

  if (vhsPlayer) {
    initVhsPlayer(vhsPlayer, { onBluffSound: playBluffClick });
  }

  const titleBtn = document.getElementById('btn-to-title');
  if (titleBtn) {
    titleBtn.addEventListener('click', (event) => {
      event.preventDefault();
      returnToTitle();
    });
  }

  const devModeBtn = document.getElementById('btn-dev-mode');
  if (devModeBtn) {
    devModeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      toggleDevMode();
    });
  }

  applyDevModeUi();

  const forceWinBtn = document.getElementById('btn-force-win');
  if (forceWinBtn) {
    forceWinBtn.addEventListener('click', (event) => {
      event.preventDefault();
      forceWin();
    });
  }

  const forceLoseBtn = document.getElementById('btn-force-lose');
  if (forceLoseBtn) {
    forceLoseBtn.addEventListener('click', (event) => {
      event.preventDefault();
      forceLose();
    });
  }

  render(state, save);

  void preloadAudio();

  console.log('[Orchestration] v0.1.29 — ADJUST commit-once · early resolve', { state, save });
}

boot();

import { createInitialState } from './game/state.js';
import { reducePhase } from './game/phases.js';
import { PHASE, SCENE } from './core/constants.js';
import {
  REVEAL_DELAY_MS,
  RESOLVE_DELAY_MS,
  SELECT_COMMIT_DELAY_MS,
  COIN_TOSS_MS,
  COIN_RESULT_MS,
} from './core/timing.js';
import { getBalance, loadBalance, formatBalanceMeta } from './core/balance.js';
import { MOVE } from './core/constants.js';
// named export는 해당 모듈과 동기화. 불일치 시 SyntaxError로 boot 전체가 죽고 타이틀이 먹통처럼 보임.
// 개발 중 캐시 재발 방지: run.bat → serve.py(no-store). ?v=는 보조 수단.
import { planCpuAdjustAction, pickOpponentMask } from './ai/opponent.js?v=0.1.36';
import { isMatchActive } from './scenes/match.js';
import {
  persistVictory,
  equipMask,
  recordDefeat,
} from './scenes/cell.js';
import { loadOrCreateSave, clearSave, hasSaveProgress } from './core/storage.js';
import { initButtonPanel, getAdjustTimerElement } from './ui/button-panel.js';
import { initTieLootPanel } from './ui/tie-loot-panel.js';
import { initOverlay, setNewGameConfirmVisible } from './ui/overlay.js?v=0.1.36';
import { render, setEquipMaskHandler } from './ui/renderer.js';
import { startAdjustCountdown, stopCountdown, showOpponentTurnWait } from './ui/countdown.js';
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
  detachCoinSkip();
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
  if (action.type === 'CPU_ADJUST' && action.move) {
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
  // 턴 중 SELECT 재진입만 여기서 부트.
  // 매치 시작(START_*)은 beginCoinCeremony → FINISH_COIN 후 beginSelectPhase.
  if (
    state.phase === PHASE.SELECT &&
    prevPhase !== PHASE.SELECT &&
    lastActionType !== 'START_MATCH' &&
    lastActionType !== 'START_NEXT_MATCH' &&
    lastActionType !== 'FINISH_COIN'
  ) {
    beginSelectPhase();
  }

  if (state.phase === PHASE.REVEAL && lastActionType === 'COMMIT_SELECT') {
    trackTimer(
      setTimeout(() => dispatch({ type: 'ENTER_ADJUST' }), REVEAL_DELAY_MS),
    );
  }

  if (state.phase === PHASE.ADJUST && lastActionType === 'ENTER_ADJUST') {
    if (state.initiative === 'opponent') {
      beginOpponentAdjustTurn();
    } else {
      beginPlayerAdjustTurn();
    }
  }

  if (
    state.phase === PHASE.ADJUST &&
    (lastActionType === 'ADJUST_CHANGE' ||
      lastActionType === 'ADJUST_CONFIRM' ||
      lastActionType === 'ADJUST_BLUFF') &&
    state.initiative === 'player' &&
    state.playerAdjusted &&
    !state.cpuAdjusted
  ) {
    beginCpuAdjustAfterPlayer();
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

  if (
    state.phase === PHASE.ADJUST &&
    (lastActionType === 'CPU_ADJUST' || lastActionType === 'CPU_BLUFF') &&
    state.initiative === 'opponent' &&
    state.cpuAdjusted &&
    !state.playerAdjusted
  ) {
    beginPlayerAdjustTurn();
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
  const duration = getBalance().timers.selectMs;
  const buttonPanel = document.getElementById('button-panel');
  const timerEl = buttonPanel ? getAdjustTimerElement(buttonPanel) : null;

  if (timerEl) {
    startAdjustCountdown(
      timerEl,
      duration,
      () => {
        stopCountdown();
        if (
          isMatchActive(state) &&
          state.phase === PHASE.SELECT &&
          !state.coinPending
        ) {
          onSelectTimeout();
        }
      },
      '패 선택 남은 시간',
    );
  } else {
    trackTimer(
      setTimeout(() => {
        if (
          isMatchActive(state) &&
          state.phase === PHASE.SELECT &&
          !state.coinPending
        ) {
          onSelectTimeout();
        }
      }, duration),
    );
  }
}

/** @type {((event: Event) => void) | null} */
let coinSkipListener = null;

function detachCoinSkip() {
  if (!coinSkipListener) return;
  document.removeEventListener('click', coinSkipListener, true);
  document.removeEventListener('keydown', coinSkipListener, true);
  coinSkipListener = null;
}

function completeCoinAndSelect() {
  detachCoinSkip();
  if (!isMatchActive(state) || !state.coinPending) return;
  dispatch({ type: 'FINISH_COIN' });
  if (state.phase === PHASE.SELECT && !state.coinPending) {
    beginSelectPhase();
  }
}

/**
 * @param {Event} event
 */
function skipCoinCeremony(event) {
  if (!isMatchActive(state) || !state.coinPending) return;
  if (event.type === 'keydown') {
    const key = /** @type {KeyboardEvent} */ (event).key;
    if (key !== ' ' && key !== 'Enter' && key !== 'Escape') return;
    event.preventDefault();
  }
  // 남은 의식 타이머만 취소 (detach는 complete에서)
  if (commitTimer) {
    clearTimeout(commitTimer);
    commitTimer = null;
  }
  for (const id of phaseTimers) clearTimeout(id);
  phaseTimers.length = 0;
  stopCountdown();
  completeCoinAndSelect();
}

function beginCoinCeremony() {
  if (!isMatchActive(state) || !state.coinPending) {
    if (state.phase === PHASE.SELECT) beginSelectPhase();
    return;
  }

  detachCoinSkip();
  coinSkipListener = (event) => skipCoinCeremony(event);
  document.addEventListener('click', coinSkipListener, true);
  document.addEventListener('keydown', coinSkipListener, true);

  trackTimer(
    setTimeout(() => {
      if (!isMatchActive(state) || !state.coinPending) return;
      dispatch({ type: 'REVEAL_COIN' });
      trackTimer(
        setTimeout(() => {
          completeCoinAndSelect();
        }, COIN_RESULT_MS),
      );
    }, COIN_TOSS_MS),
  );
}

function onSelectTimeout() {
  if (commitTimer) {
    clearTimeout(commitTimer);
    commitTimer = null;
  }

  if (state.coinPending) return;

  if (!state.player.choice) {
    const moves = [MOVE.ROCK, MOVE.PAPER, MOVE.SCISSORS];
    const move = moves[Math.floor(Math.random() * moves.length)];
    dispatch({ type: 'SELECT_MOVE', move });
  }

  dispatch({ type: 'COMMIT_SELECT' });
}

/** 후공 진입 · 선공 플레이어 확정 후 — CPU plan + delay 커밋 */
function scheduleCpuAdjustCommit() {
  // 최종 행동(유지|바꾸기|페이크)을 먼저 정한 뒤 한 번만 커밋 → 안내 덮어쓰기 방지
  const plan = planCpuAdjustAction(state);
  const { ai } = getBalance();
  const adjustSpan = ai.adjustDelayMaxMs - ai.adjustDelayMinMs;
  const bluffSpan = ai.bluffDelayMaxMs - ai.bluffDelayMinMs;
  let cpuDelay = ai.adjustDelayMinMs + Math.random() * adjustSpan;
  if (plan.kind === 'bluffed') {
    cpuDelay += ai.bluffDelayMinMs + Math.random() * bluffSpan;
  }

  trackTimer(
    setTimeout(() => {
      if (!isMatchActive(state) || state.phase !== PHASE.ADJUST || state.cpuAdjusted) {
        return;
      }

      if (plan.kind === 'changed') {
        dispatch({ type: 'CPU_ADJUST', move: plan.move });
      } else if (plan.kind === 'bluffed') {
        dispatch({ type: 'CPU_BLUFF' });
      } else {
        dispatch({ type: 'CPU_ADJUST', kept: true });
      }
    }, cpuDelay),
  );
}

function beginOpponentAdjustTurn() {
  const buttonPanel = document.getElementById('button-panel');
  const timerEl = buttonPanel ? getAdjustTimerElement(buttonPanel) : null;
  if (timerEl) {
    showOpponentTurnWait(timerEl);
  } else {
    stopCountdown();
  }

  scheduleCpuAdjustCommit();
}

/** 선공: 플레이어 확정 후 타이머를 끊고 CPU ADJUST */
function beginCpuAdjustAfterPlayer() {
  const buttonPanel = document.getElementById('button-panel');
  const timerEl = buttonPanel ? getAdjustTimerElement(buttonPanel) : null;
  if (timerEl) {
    showOpponentTurnWait(timerEl);
  } else {
    stopCountdown();
  }

  scheduleCpuAdjustCommit();
}

/** 선공 진입 · 후공: 상대 확정 후 — 플레이어 ADJUST 타이머 시작 */
function beginPlayerAdjustTurn() {
  const duration = state.adjustTimerMs ?? getBalance().timers.adjustMs;
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
}

/**
 * @param {string} move
 */
function onSelectMove(move) {
  if (!isMatchActive(state)) return;
  if (state.coinPending) return;

  if (state.phase === PHASE.SELECT) {
    dispatch({ type: 'SELECT_MOVE', move });

    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(() => {
      commitTimer = null;
      if (
        isMatchActive(state) &&
        state.phase === PHASE.SELECT &&
        !state.coinPending
      ) {
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

async function returnToTitle() {
  clearAllTimers();
  resetCeilingScreen();
  await loadBalance();
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
  if (state.phase === PHASE.SELECT) {
    beginCoinCeremony();
  }
}

function continueMatch() {
  if (!hasSaveProgress(save)) return;
  startMatch();
}

function newGame() {
  // window.confirm 대신 인라인 확인 — 일부 환경에서 confirm이 즉시 false가 되어 매치 시작이 막힘
  if (hasSaveProgress(save)) {
    setNewGameConfirmVisible(true);
    return;
  }
  beginFreshGame();
}

function beginFreshGame() {
  setNewGameConfirmVisible(false);
  save = clearSave();
  startMatch();
}

function cancelNewGameConfirm() {
  setNewGameConfirmVisible(false);
}

function onNextMatch() {
  clearAllTimers();
  resetCeilingScreen();
  dispatch({ type: 'START_NEXT_MATCH', save });
  if (state.phase === PHASE.SELECT) {
    beginCoinCeremony();
  }
}

async function onLeaveCell() {
  clearAllTimers();
  await loadBalance();
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
  // 타이틀 진입 전 1회 로드. 매치 중에는 다시 읽지 않음.
  await loadBalance();

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
    onNewGameConfirm: beginFreshGame,
    onNewGameCancel: cancelNewGameConfirm,
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

  console.log('[Orchestration] v0.1.36 — ADJUST coin ceremony + turn alternate', {
    state,
    save,
    balance: formatBalanceMeta(),
  });
}

boot();

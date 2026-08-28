import { PHASE, SCENE, MAX_PENALTIES } from '../core/constants.js';
import { ITEM, getInstinctDisplayHtml } from '../game/items.js';
import { isMaskInstinctActive, getMaskInstinctDisplayHtml } from '../game/masks.js';
import { renderCeilingScreen } from './ceiling-screen.js';
import { renderHud } from './hud.js';
import { setButtonPanelEnabled, MOVE_LABELS } from './button-panel.js';
import { renderTieLootPanel, hideTieLootPanel } from './tie-loot-panel.js';
import { stopCountdown } from './countdown.js';
import { renderOverlay } from './overlay.js';
import { renderPovViewport } from './pov-viewport.js';
import { renderCellScene } from './cell-scene.js';
import { isMatchActive } from '../scenes/match.js';
import { applyDevModeUi } from './dev-mode.js';

const OUTCOME_LABEL = {
  win: '승리',
  lose: '패배',
  draw: '무승부',
};

/** @type {(maskId: string) => void} */
let onEquipMaskHandler = () => {};

/**
 * @param {(maskId: string) => void} handler
 */
export function setEquipMaskHandler(handler) {
  onEquipMaskHandler = handler;
}

/**
 * @param {object} state
 * @param {object} [save]
 */
export function render(state, save) {
  renderOverlay(state, save);

  const matchNav = document.getElementById('match-nav');
  if (matchNav) {
    matchNav.hidden = state.scene !== SCENE.MATCH;
    if (state.scene === SCENE.MATCH) {
      applyDevModeUi();
    }
  }

  if (state.scene === SCENE.CELL && save) {
    renderCellScene(state, save, { onEquip: onEquipMaskHandler });
    return;
  }

  const ceiling = document.getElementById('ceiling-screen');
  const playerDisplay = document.getElementById('player-display');
  const eventLog = document.getElementById('event-log');
  const hud = document.getElementById('pov-hud');
  const buttonPanel = document.getElementById('button-panel');
  const tieLootPanel = document.getElementById('tie-loot-panel');
  const povViewport = document.getElementById('pov-viewport');

  if (state.scene === SCENE.MENU) {
    return;
  }

  if (ceiling) {
    const showPartial =
      state.phase === PHASE.REVEAL || state.phase === PHASE.ADJUST;
    renderCeilingScreen(ceiling, showPartial ? state.partialResult : null);
  }

  if (povViewport) {
    renderPovViewport(povViewport, state);
  }

  if (playerDisplay) {
    const display = renderPlayerDisplay(state);
    playerDisplay.classList.remove(
      'player-display--win',
      'player-display--draw',
      'player-display--lose',
    );

    if (display.html) {
      playerDisplay.innerHTML = display.html;
    } else {
      playerDisplay.textContent = display.text;
    }

    const outcomeClass = getOutcomeDisplayClass(state);
    if (outcomeClass) {
      playerDisplay.classList.add(outcomeClass);
    }
  }

  if (hud) {
    renderHud(
      hud,
      state.player,
      state.opponent,
      state.turn,
      state.phase,
      state.equippedMaskId,
    );
  }

  if (eventLog) {
    renderEventLog(eventLog, state.matchLog);
  }

  if (tieLootPanel) {
    if (state.phase === PHASE.TIE_LOOT && state.tieItemsRemaining?.length) {
      renderTieLootPanel(
        tieLootPanel,
        state.tieItemsRemaining,
        state.tieLootSelection,
      );
    } else {
      hideTieLootPanel(tieLootPanel);
    }
  }

  if (buttonPanel && buttonPanel.dataset.initialized === 'true') {
    const playable = isMatchActive(state) && state.phase !== PHASE.TIE_LOOT;
    if (playable) {
      setButtonPanelEnabled(
        buttonPanel,
        state.phase,
        state.player,
        state.playerAdjusted,
      );
    } else {
      setButtonPanelEnabled(buttonPanel, '__disabled__', state.player);
    }
  }

  if (state.phase !== PHASE.ADJUST && state.phase !== PHASE.SELECT) {
    stopCountdown();
  }
}

/**
 * @param {object} state
 * @returns {boolean}
 */
function isResolveDisplayPhase(state) {
  return (
    state.phase === PHASE.RESOLVE ||
    state.phase === PHASE.MATCH_END ||
    state.scene === SCENE.GAMEOVER
  );
}

/**
 * @param {object} state
 * @returns {string | null}
 */
function getOutcomeDisplayClass(state) {
  if (state.phase === PHASE.TIE_LOOT) {
    return 'player-display--draw';
  }

  if (!isResolveDisplayPhase(state) || !state.lastResolve) {
    return null;
  }

  const { outcome } = state.lastResolve;
  if (outcome === 'win') return 'player-display--win';
  if (outcome === 'draw') return 'player-display--draw';
  if (outcome === 'lose') return 'player-display--lose';
  return null;
}

/**
 * @param {object} state
 * @returns {{ text: string } | { html: string }}
 */
function renderPlayerDisplay(state) {
  if (
    state.player.activeItem === ITEM.RULE_BREAK &&
    (state.phase === PHASE.REVEAL || state.phase === PHASE.ADJUST) &&
    state.opponent.choice
  ) {
    return {
      text: `[규칙 파괴] 상대 초기 패: ${MOVE_LABELS[state.opponent.choice]}`,
    };
  }

  if (state.scene === SCENE.GAMEOVER && state.lastResolve) {
    return formatResolveDisplay(state);
  }

  if (state.phase === PHASE.TIE_LOOT) {
    return { text: '무승부' };
  }

  if (state.phase === PHASE.RESOLVE && state.lastResolve) {
    return formatResolveDisplay(state);
  }

  if (state.phase === PHASE.MATCH_END && state.lastResolve) {
    return formatResolveDisplay(state);
  }

  if (state.phase === PHASE.ADJUST) {
    const initial = state.player.choice;
    const current = state.player.finalChoice ?? initial;
    let statusLine = '';
    if (initial && current !== initial) {
      statusLine = `수정: ${MOVE_LABELS[initial]} → ${MOVE_LABELS[current]}`;
    } else if (current) {
      statusLine = `현재: ${MOVE_LABELS[current]} (유지·변경·페이크)`;
    }

    const maskActive = isMaskInstinctActive(state);
    if (maskActive && state.player.activeItem !== ITEM.INSTINCT) {
      const hint = state.instinctReading
        ? getMaskInstinctDisplayHtml(state.instinctReading)
        : '<span class="instinct-reading instinct-reading--pending">[가면] 감지 중…</span>';
      return { html: `${hint}<br>${statusLine}` };
    }

    if (state.player.activeItem === ITEM.INSTINCT) {
      const hint = state.instinctReading
        ? getInstinctDisplayHtml(state.instinctReading)
        : '<span class="instinct-reading instinct-reading--pending">[본능] 감지 중…</span>';
      return { html: `${hint}<br>${statusLine}` };
    }

    if (statusLine) {
      return { text: statusLine };
    }
  }

  if (state.player.choice) {
    return { text: `선택: ${MOVE_LABELS[state.player.choice]}` };
  }

  if (state.phase === PHASE.SELECT) {
    return { text: '가위 / 바위 / 보 중 선택하세요' };
  }

  return { text: '' };
}

/**
 * @param {object} state
 * @returns {{ text: string } | { html: string }}
 */
function formatResolveDisplay(state) {
  return { text: formatResolveLine(state) };
}

/**
 * @param {object} state
 * @returns {string}
 */
function formatResolveLine(state) {
  const { outcome, playerMove, opponentMove } = state.lastResolve;
  const base = `${MOVE_LABELS[playerMove]} vs ${MOVE_LABELS[opponentMove]} → ${OUTCOME_LABEL[outcome]}`;

  if (outcome === 'draw') {
    return base;
  }

  const projected = state.phase === PHASE.RESOLVE;

  if (outcome === 'lose') {
    const next = projected
      ? state.player.penalties + 1
      : state.player.penalties;
    const suffix = ` · 페널티 +1 (${next}/${MAX_PENALTIES})`;
    const warn =
      next === MAX_PENALTIES - 1 ? ' · 한 번 더 패배하면 종료' : '';
    return base + suffix + warn;
  }

  if (outcome === 'win') {
    const next = projected
      ? state.opponent.penalties + 1
      : state.opponent.penalties;
    return `${base} · CPU 페널티 +1 (${next}/${MAX_PENALTIES})`;
  }

  return base;
}

/**
 * @param {HTMLElement} container
 * @param {string[]} log
 */
function renderEventLog(container, log) {
  if (log.length === 0) {
    container.innerHTML = '<div class="log-entry">— 대기 중 —</div>';
    return;
  }

  container.innerHTML = log
    .slice()
    .reverse()
    .map((entry) => `<div class="log-entry">${entry}</div>`)
    .join('');
}

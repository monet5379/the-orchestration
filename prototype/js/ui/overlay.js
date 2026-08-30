import { SCENE } from '../core/constants.js';
import { formatBalanceMeta } from '../core/balance.js';
import { renderPenaltyPips } from '../game/penalties.js';
import { formatSaveSummary, hasSaveProgress } from '../core/storage.js';

/**
 * 타이틀에 로드된 balance meta.version · 출처 표시
 */
export function updateBalanceMetaUi() {
  const el = document.getElementById('menu-balance-meta');
  if (el) el.textContent = formatBalanceMeta();
}

/**
 * @param {boolean} showConfirm
 * main.js named import — 캐시로 옛 overlay.js가 남으면 "does not provide an export named setNewGameConfirmVisible"
 */
export function setNewGameConfirmVisible(showConfirm) {
  const actions = document.getElementById('menu-actions');
  const confirm = document.getElementById('menu-new-game-confirm');
  if (actions) actions.hidden = showConfirm;
  if (confirm) confirm.hidden = !showConfirm;
}

/**
 * @param {object | null | undefined} save
 */
export function updateMenuButtons(save) {
  const continueBtn = document.getElementById('btn-continue');
  const summary = document.getElementById('menu-save-summary');
  const hasProgress = save ? hasSaveProgress(save) : false;

  if (continueBtn) {
    continueBtn.disabled = !hasProgress;
    continueBtn.title = hasProgress
      ? '저장된 가면·전적으로 매치를 시작합니다.'
      : '저장된 진행이 없습니다.';
  }

  if (summary) {
    if (hasProgress) {
      summary.hidden = false;
      summary.textContent = formatSaveSummary(save);
    } else {
      summary.hidden = true;
      summary.textContent = '';
    }
  }
}

/**
 * @param {object} state
 * @param {object} [save]
 */
export function renderOverlay(state, save) {
  const overlay = document.getElementById('overlay');
  const menuScreen = document.getElementById('menu-screen');
  const gameoverScreen = document.getElementById('gameover-screen');
  const gameRoot = document.getElementById('game-root');
  const cellRoot = document.getElementById('cell-root');

  const inMenu = state.scene === SCENE.MENU;
  const inGameover = state.scene === SCENE.GAMEOVER;
  const inMatch = state.scene === SCENE.MATCH;
  const inCell = state.scene === SCENE.CELL;

  if (overlay) {
    overlay.hidden = inMatch || inCell;
  }

  if (menuScreen) {
    menuScreen.hidden = !inMenu;
    if (inMenu) {
      updateBalanceMetaUi();
      if (save) updateMenuButtons(save);
    }
    if (!inMenu) {
      setNewGameConfirmVisible(false);
    }
  }

  if (gameoverScreen) {
    gameoverScreen.hidden = !inGameover;
    gameoverScreen.classList.remove('gameover-screen--victory', 'gameover-screen--defeat');

    if (inGameover) {
      gameoverScreen.classList.add('gameover-screen--defeat');

      const title = document.getElementById('gameover-title');
      const summary = document.getElementById('gameover-summary');

      if (title) {
        title.textContent = '패배';
      }

      if (summary) {
        const playerPips = renderPenaltyPips(state.player.penalties);
        const cpuPips = renderPenaltyPips(state.opponent.penalties);

        summary.innerHTML = `
          <span class="gameover-headline">페널티 3/3 도달</span>
          <span class="gameover-pips">
            <span class="gameover-pips__row">나 <span class="penalty-pips">${playerPips}</span></span>
            <span class="gameover-pips__row">CPU <span class="penalty-pips">${cpuPips}</span></span>
          </span>
        `;
      }
    }
  }

  if (gameRoot) {
    gameRoot.hidden = inMenu || inCell;
  }

  if (cellRoot) {
    cellRoot.hidden = !inCell;
  }
}

/**
 * @param {{
 *   onContinue: () => void,
 *   onNewGame: () => void,
 *   onNewGameConfirm: () => void,
 *   onNewGameCancel: () => void,
 *   onRestart: () => void,
 * }} handlers
 */
export function initOverlay(handlers) {
  const continueBtn = document.getElementById('btn-continue');
  const newGameBtn = document.getElementById('btn-new-game');
  const newGameYes = document.getElementById('btn-new-game-yes');
  const newGameNo = document.getElementById('btn-new-game-no');
  const restartBtn = document.getElementById('btn-restart');

  if (continueBtn) {
    continueBtn.addEventListener('click', (event) => {
      event.preventDefault();
      if (continueBtn.disabled) return;
      handlers.onContinue();
    });
  }

  if (newGameBtn) {
    newGameBtn.addEventListener('click', (event) => {
      event.preventDefault();
      handlers.onNewGame();
    });
  }

  if (newGameYes) {
    newGameYes.addEventListener('click', (event) => {
      event.preventDefault();
      handlers.onNewGameConfirm();
    });
  }

  if (newGameNo) {
    newGameNo.addEventListener('click', (event) => {
      event.preventDefault();
      handlers.onNewGameCancel();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', (event) => {
      event.preventDefault();
      handlers.onRestart();
    });
  }
}

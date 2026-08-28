import { PHASE } from '../core/constants.js';
import {
  canSelectMove,
  canAdjustChange,
  canAdjustConfirm,
  canAdjustBluff,
} from '../game/phases.js';

/** @typedef {(move: string) => void} MoveHandler */
/** @typedef {() => void} ActionHandler */

const MOVE_LABELS = {
  rock: '바위',
  paper: '보',
  scissors: '가위',
};

const PRESS_MS = 140;

/**
 * @param {HTMLButtonElement} btn
 */
function pulsePress(btn) {
  btn.classList.add('is-pressed');
  setTimeout(() => btn.classList.remove('is-pressed'), PRESS_MS);
}

/**
 * @param {HTMLButtonElement} btn
 * @param {() => void} handler
 */
function bindPress(btn, handler) {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    pulsePress(btn);
    handler();
  });
}

/**
 * @param {HTMLElement} container
 * @param {{ onSelectMove: MoveHandler, onConfirm: ActionHandler, onBluff: ActionHandler }} handlers
 */
export function initButtonPanel(container, handlers) {
  container.innerHTML = '';
  container.dataset.initialized = 'true';
  container.classList.add('panel-chrome');

  const adjustTimer = document.createElement('div');
  adjustTimer.id = 'adjust-timer';
  adjustTimer.className = 'adjust-timer';
  adjustTimer.hidden = true;
  adjustTimer.innerHTML = `
    <div class="adjust-timer__track">
      <div class="adjust-timer__fill"></div>
    </div>
    <span class="adjust-timer__label" aria-live="polite">—</span>
  `;

  const adjustRow = document.createElement('div');
  adjustRow.id = 'adjust-actions';
  adjustRow.className = 'adjust-actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.id = 'btn-confirm';
  confirmBtn.className = 'metal-btn';
  confirmBtn.textContent = '유지';
  bindPress(confirmBtn, () => handlers.onConfirm());
  adjustRow.appendChild(confirmBtn);

  const bluffBtn = document.createElement('button');
  bluffBtn.type = 'button';
  bluffBtn.id = 'btn-bluff';
  bluffBtn.className = 'metal-btn';
  bluffBtn.textContent = '페이크';
  bluffBtn.title = '소리만 내고 패는 바꾸지 않음 (페이크 1 소모)';
  bindPress(bluffBtn, () => handlers.onBluff());
  adjustRow.appendChild(bluffBtn);

  const moveRow = document.createElement('div');
  moveRow.id = 'move-buttons';
  moveRow.className = 'move-buttons';

  for (const id of ['scissors', 'rock', 'paper']) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'move-btn metal-btn';
    btn.textContent = MOVE_LABELS[id];
    btn.dataset.move = id;
    bindPress(btn, () => handlers.onSelectMove(id));
    moveRow.appendChild(btn);
  }

  container.appendChild(adjustTimer);
  container.appendChild(adjustRow);
  container.appendChild(moveRow);
}

/**
 * @param {HTMLElement} container
 * @returns {HTMLElement | null}
 */
export function getAdjustTimerElement(container) {
  return container.querySelector('#adjust-timer');
}

/**
 * @param {HTMLElement} container
 * @param {string} phase
 * @param {object} player
 * @param {false | 'kept' | 'changed' | 'bluffed'} [playerAdjusted]
 */
export function setButtonPanelEnabled(container, phase, player, playerAdjusted = false) {
  const adjustTimer = container.querySelector('#adjust-timer');
  const adjustRow = container.querySelector('#adjust-actions');
  const moveButtons = container.querySelectorAll('.move-btn');
  const confirmBtn = container.querySelector('#btn-confirm');
  const bluffBtn = container.querySelector('#btn-bluff');

  const inSelect = phase === PHASE.SELECT;
  const inAdjust = phase === PHASE.ADJUST;
  const forceDisabled = phase === '__disabled__';
  const committed = Boolean(playerAdjusted);
  const current = player.finalChoice ?? player.choice;

  if (adjustTimer && (forceDisabled || (!inSelect && !inAdjust))) {
    adjustTimer.hidden = true;
  }

  if (adjustRow) {
    adjustRow.hidden = !inAdjust || forceDisabled;
  }

  for (const btn of moveButtons) {
    const showCommit =
      inAdjust && !forceDisabled && committed && btn.dataset.move === current;
    btn.classList.toggle('is-committed', showCommit);

    if (forceDisabled) {
      btn.disabled = true;
    } else if (inSelect) {
      btn.disabled = !canSelectMove(phase);
    } else if (inAdjust) {
      if (committed) {
        btn.disabled = true;
      } else {
        const canChange = canAdjustChange(phase, player, committed);
        btn.disabled = !canChange || btn.dataset.move === current;
      }
    } else {
      btn.disabled = true;
    }
  }

  if (confirmBtn) {
    confirmBtn.disabled = forceDisabled || !canAdjustConfirm(phase, committed);
    confirmBtn.classList.toggle(
      'is-committed',
      inAdjust && !forceDisabled && playerAdjusted === 'kept',
    );
  }

  if (bluffBtn) {
    bluffBtn.disabled = forceDisabled || !canAdjustBluff(phase, player, committed);
    bluffBtn.classList.toggle(
      'is-committed',
      inAdjust && !forceDisabled && playerAdjusted === 'bluffed',
    );
  }
}

export { MOVE_LABELS };

import { PHASE } from '../core/constants.js';
import { getMaskDoodle } from '../game/masks.js';

const FALLBACK_DOODLES = ['☺', '?', '×'];

/** @type {ReturnType<typeof setTimeout> | null} */
let bluffFlashTimer = null;

/**
 * @param {HTMLElement | null} viewport
 * @param {object} state
 */
export function renderPovViewport(viewport, state) {
  if (!viewport) return;

  viewport.dataset.phase = state.phase ?? '';

  const doodle = state.opponentMaskId
    ? getMaskDoodle(state.opponentMaskId)
    : FALLBACK_DOODLES[Math.floor(Math.random() * FALLBACK_DOODLES.length)];

  const opponentView = viewport.querySelector('#opponent-view');
  if (opponentView) {
    const maskChanged = opponentView.dataset.maskId !== (state.opponentMaskId ?? '');

    if (!opponentView.dataset.initialized || maskChanged) {
      opponentView.innerHTML = `
        <div class="opponent-figure">
          <div class="opponent-mask">
            <span class="opponent-mask-doodle" aria-hidden="true">${doodle}</span>
          </div>
          <div class="opponent-shoulders" aria-hidden="true"></div>
        </div>
        <div class="opponent-table-edge" aria-hidden="true"></div>
      `;
      opponentView.dataset.initialized = 'true';
      opponentView.dataset.maskId = state.opponentMaskId ?? '';
    } else {
      const doodleEl = opponentView.querySelector('.opponent-mask-doodle');
      if (doodleEl) {
        doodleEl.textContent = doodle;
      }
    }
  }

  viewport.classList.toggle('is-reveal', state.phase === PHASE.REVEAL);
  viewport.classList.toggle('is-adjust', state.phase === PHASE.ADJUST);
  viewport.classList.toggle('is-resolve', state.phase === PHASE.RESOLVE);
}

/** 상대 페이크·SELECT 입력 시 렌즈 플래시 (플레이어 ADJUST 수정/페이크는 무음·무플래시) */
export function flashPovBluff() {
  const viewport = document.getElementById('pov-viewport');
  if (!viewport) return;

  viewport.classList.add('is-bluff-flash');
  if (bluffFlashTimer) clearTimeout(bluffFlashTimer);
  bluffFlashTimer = setTimeout(() => {
    viewport.classList.remove('is-bluff-flash');
    bluffFlashTimer = null;
  }, 380);
}

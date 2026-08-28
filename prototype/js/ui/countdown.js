/** @typedef {() => void} TickCallback */

const URGENT_THRESHOLD_MS = 2000;
const TICK_MS = 50;

/** @type {number | null} */
let intervalId = null;

/** @type {HTMLElement | null} */
let activeRoot = null;

/**
 * @param {HTMLElement} root
 * @param {number} durationMs
 * @param {number} endAt
 */
function updateGauge(root, durationMs, endAt) {
  const fill = root.querySelector('.adjust-timer__fill');
  const label = root.querySelector('.adjust-timer__label');
  const track = root.querySelector('.adjust-timer__track');

  const remaining = Math.max(0, endAt - Date.now());
  const ratio = durationMs > 0 ? remaining / durationMs : 0;

  if (fill) {
    fill.style.width = `${ratio * 100}%`;
  }

  if (label) {
    label.textContent = `${(remaining / 1000).toFixed(1)}s`;
  }

  if (track) {
    track.setAttribute('aria-valuenow', String(Math.ceil(remaining / 1000)));
    track.setAttribute('aria-valuemax', String(Math.ceil(durationMs / 1000)));
    track.setAttribute('aria-valuemin', '0');
  }

  root.classList.toggle(
    'adjust-timer--urgent',
    remaining > 0 && remaining <= URGENT_THRESHOLD_MS,
  );
}

/**
 * @param {HTMLElement} root
 * @param {number} durationMs
 * @param {TickCallback} onComplete
 * @param {string} [ariaLabel]
 */
export function startAdjustCountdown(root, durationMs, onComplete, ariaLabel = '수정 페이즈 남은 시간') {
  stopCountdown();

  activeRoot = root;

  const track = root.querySelector('.adjust-timer__track');
  if (track) {
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', ariaLabel);
  }

  root.hidden = false;

  const endAt = Date.now() + durationMs;
  updateGauge(root, durationMs, endAt);

  intervalId = window.setInterval(() => {
    const remaining = Math.max(0, endAt - Date.now());
    updateGauge(root, durationMs, endAt);

    if (remaining <= 0) {
      stopCountdown();
      onComplete();
    }
  }, TICK_MS);
}

export function stopCountdown() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (activeRoot) {
    activeRoot.hidden = true;
    activeRoot.classList.remove('adjust-timer--urgent');

    const fill = activeRoot.querySelector('.adjust-timer__fill');
    if (fill) {
      fill.style.width = '0%';
    }

    activeRoot = null;
  }
}

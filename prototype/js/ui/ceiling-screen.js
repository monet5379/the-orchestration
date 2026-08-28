const MESSAGES = {
  winner_exists: '승자 있음',
  draw: '무승부',
};

/** @type {string | null} */
let lastPartialResult = null;

/**
 * @param {HTMLElement} container
 */
function ensureCeilingMarkup(container) {
  if (container.querySelector('.ceiling-monitor')) return;

  container.innerHTML = `
    <div class="ceiling-rail" aria-hidden="true"></div>
    <div class="ceiling-monitor">
      <div class="ceiling-cable" aria-hidden="true"></div>
      <div class="ceiling-monitor-bezel">
        <span class="ceiling-monitor-label">CEILING // RELAY</span>
        <p class="ceiling-message" aria-live="polite"></p>
      </div>
    </div>
  `;
}

/**
 * @param {HTMLElement} container
 */
function hideCeilingScreen(container) {
  container.classList.remove('is-active', 'is-descending');
  container.removeAttribute('data-result');

  const messageEl = container.querySelector('.ceiling-message');
  if (messageEl) {
    messageEl.textContent = '';
  }
}

/**
 * @param {HTMLElement} container
 * @param {'winner_exists' | 'draw' | null} partialResult
 */
export function renderCeilingScreen(container, partialResult) {
  ensureCeilingMarkup(container);

  if (!partialResult) {
    hideCeilingScreen(container);
    lastPartialResult = null;
    return;
  }

  const isNewReveal = partialResult !== lastPartialResult;
  lastPartialResult = partialResult;

  const messageEl = container.querySelector('.ceiling-message');
  if (messageEl) {
    messageEl.textContent = MESSAGES[partialResult] ?? '';
  }

  container.dataset.result = partialResult;
  container.classList.add('is-active');

  if (isNewReveal) {
    container.classList.remove('is-descending');
    void container.offsetWidth;
    container.classList.add('is-descending');
  }
}

/** 매치 재시작 시 애니메이션 상태 초기화 */
export function resetCeilingScreen() {
  lastPartialResult = null;

  const container = document.getElementById('ceiling-screen');
  if (container) {
    hideCeilingScreen(container);
  }
}

import { getItemLabel, ITEM_INFO } from '../game/items.js';

/** @typedef {(itemId: string) => void} SelectHandler */
/** @typedef {() => void} ConfirmHandler */

const PRESS_MS = 140;

/**
 * @param {HTMLElement} container
 * @param {{ onSelect: SelectHandler, onConfirm: ConfirmHandler }} handlers
 */
export function initTieLootPanel(container, handlers) {
  container.dataset.initialized = 'true';
  container.addEventListener('click', (event) => {
    const confirmBtn = event.target.closest('#btn-tie-loot-confirm');
    if (confirmBtn && !confirmBtn.disabled) {
      confirmBtn.classList.add('is-pressed');
      setTimeout(() => confirmBtn.classList.remove('is-pressed'), PRESS_MS);
      handlers.onConfirm();
      return;
    }

    const itemBtn = event.target.closest('[data-item]');
    if (!itemBtn || itemBtn.disabled) return;
    handlers.onSelect(itemBtn.dataset.item);
  });
}

/**
 * @param {HTMLElement} container
 * @param {string[]} available
 * @param {string | null} selectedId
 */
export function renderTieLootPanel(container, available, selectedId) {
  if (!available.length) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const selected =
    selectedId && available.includes(selectedId) ? selectedId : available[0];
  const info = ITEM_INFO[selected];

  container.hidden = false;
  container.classList.add('panel-chrome');
  container.innerHTML = `
    <p class="tie-loot-title">테이블 — 아이템 선택</p>
    <p class="tie-loot-rule">아이템 1개를 획득합니다 · 상대(CPU)는 남은 아이템 중 1개를 가져갑니다</p>
    <div class="tie-loot-buttons">
      ${available
        .map(
          (id) => `
        <button
          type="button"
          class="metal-btn tie-loot-item${id === selected ? ' is-selected' : ''}"
          data-item="${id}"
          aria-pressed="${id === selected}"
        >
          ${getItemLabel(id)}
        </button>`,
        )
        .join('')}
    </div>
    <div class="tie-loot-info" aria-live="polite">
      <p class="tie-loot-info__name">${info?.label ?? selected}</p>
      <p class="tie-loot-info__desc">${info?.desc ?? ''}</p>
    </div>
    <button type="button" id="btn-tie-loot-confirm" class="metal-btn tie-loot-confirm">
      획득
    </button>
  `;
}

export function hideTieLootPanel(container) {
  container.hidden = true;
  container.innerHTML = '';
}

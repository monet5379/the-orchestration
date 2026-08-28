/** v2: cell wall — mask trophy display */

import { ALL_MASK_IDS, MASK_INFO, getMaskLabel } from '../game/masks.js';

/**
 * @param {HTMLElement} container
 * @param {object} save
 * @param {(maskId: string) => void} onEquip
 */
export function renderCellWall(container, save, onEquip) {
  const unlocked = save.masks.unlocked ?? [];
  const equipped = save.masks.equipped;

  if (unlocked.length === 0) {
    container.innerHTML = `
      <p class="cell-wall__empty">아직 획득한 가면이 없습니다.</p>
      <p class="cell-wall__hint">승리하면 상대의 가면을 벽에 걸 수 있습니다.</p>
    `;
    return;
  }

  const tiles = ALL_MASK_IDS.filter((id) => unlocked.includes(id))
    .map((id) => {
      const info = MASK_INFO[id];
      const isEquipped = equipped === id;
      return `
        <button
          type="button"
          class="mask-trophy${isEquipped ? ' mask-trophy--equipped' : ''}"
          data-mask-id="${id}"
          aria-pressed="${isEquipped}"
          title="${info.desc}"
        >
          <span class="mask-trophy__doodle" aria-hidden="true">${info.doodle}</span>
          <span class="mask-trophy__label">${getMaskLabel(id)}</span>
          <span class="mask-trophy__action">${isEquipped ? '장착됨' : '장착'}</span>
        </button>
      `;
    })
    .join('');

  container.innerHTML = `
    <h2 class="cell-wall__title">가면 진열</h2>
    <div class="cell-wall__grid">${tiles}</div>
  `;

  container.querySelectorAll('.mask-trophy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const maskId = btn.getAttribute('data-mask-id');
      if (maskId) onEquip(maskId);
    });
  });
}

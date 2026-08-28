/** v2: cell scene compose */

import { formatRewardMessage } from '../scenes/cell.js';
import { getMaskDoodle, getMaskLabel, MASK_INFO } from '../game/masks.js';
import { renderCellWall } from './cell-wall.js';
import { loadVhsReplay } from './vhs-player.js';

/**
 * @param {HTMLElement} el
 * @param {object} save
 */
function renderEquippedMaskDesc(el, save) {
  const equipped = save.masks?.equipped;
  if (!equipped || !MASK_INFO[equipped]) {
    el.textContent =
      '장착한 가면이 없습니다. 가면을 선택하면 다음 매치에 적용됩니다.';
    el.classList.add('cell-desc--empty');
    return;
  }

  const info = MASK_INFO[equipped];
  el.textContent = `${getMaskDoodle(equipped)} ${getMaskLabel(equipped)} — ${info.desc}`;
  el.classList.remove('cell-desc--empty');
}

/**
 * @param {object} state
 * @param {object} save
 * @param {{ onEquip: (maskId: string) => void }} handlers
 */
export function renderCellScene(state, save, handlers) {
  const cellRoot = document.getElementById('cell-root');
  const wall = document.getElementById('cell-wall');
  const rewardMsg = document.getElementById('cell-reward-msg');
  const maskDesc = document.getElementById('cell-mask-desc');
  const vhsPlayer = document.getElementById('vhs-player');

  if (!cellRoot) return;

  cellRoot.hidden = false;

  if (rewardMsg && state.pendingCell) {
    const { newMaskId, alreadyOwned } = state.cellReward ?? {};
    rewardMsg.textContent = formatRewardMessage(
      save,
      newMaskId ?? state.pendingCell.opponentMaskId,
      alreadyOwned ?? false,
    );
  }

  if (wall) {
    renderCellWall(wall, save, handlers.onEquip);
  }

  if (maskDesc) {
    renderEquippedMaskDesc(maskDesc, save);
  }

  if (vhsPlayer && state.pendingCell?.replay) {
    loadVhsReplay(vhsPlayer, state.pendingCell.replay);
  }
}

/**
 * @param {{ onEquip: (maskId: string) => void, onNextMatch: () => void, onLeave: () => void }} handlers
 */
export function initCellScene(handlers) {
  const nextBtn = document.getElementById('btn-next-match');
  const titleBtn = document.getElementById('btn-cell-title');

  nextBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    handlers.onNextMatch();
  });

  titleBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    handlers.onLeave();
  });
}

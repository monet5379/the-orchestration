import { PHASE_LABEL } from '../core/constants.js';
import {
  formatPenalties,
  renderPenaltyPips,
  isPenaltyWarn,
} from '../game/penalties.js';
import { getItemLabel } from '../game/items.js';
import { getMaskDoodle, getMaskLabel, MASK_INFO } from '../game/masks.js';

/**
 * @param {object} combatant
 * @param {string} label
 * @param {string} tooltip
 * @returns {string}
 */
function renderPenaltyChip(combatant, label, tooltip) {
  const count = combatant.penalties;
  const warn = isPenaltyWarn(count) ? ' penalty-chip--warn' : '';

  return `
    <span class="penalty-chip${warn}" title="${tooltip}">
      <span class="penalty-chip__label">${label}</span>
      <span class="penalty-pips" aria-label="${label} ${formatPenalties(combatant)}">
        ${renderPenaltyPips(count)}
      </span>
    </span>
  `;
}

/**
 * @param {string | null | undefined} equippedMaskId
 * @returns {string}
 */
function renderMaskLine(equippedMaskId) {
  if (!equippedMaskId || !MASK_INFO[equippedMaskId]) {
    return `<span class="hud-chip hud-mask hud-mask--empty" title="독방에서 가면을 장착할 수 있습니다">가면 —</span>`;
  }

  const info = MASK_INFO[equippedMaskId];
  const doodle = getMaskDoodle(equippedMaskId);
  const label = getMaskLabel(equippedMaskId);

  return `<span class="hud-chip hud-mask" title="${info.desc}">가면 <span class="hud-mask__doodle" aria-hidden="true">${doodle}</span> ${label}</span>`;
}

/**
 * @param {HTMLElement} container
 * @param {object} player
 * @param {object} opponent
 * @param {number} turn
 * @param {string} phase
 * @param {string | null | undefined} equippedMaskId
 */
export function renderHud(container, player, opponent, turn, phase, equippedMaskId) {
  const phaseLabel = PHASE_LABEL[phase] ?? phase;
  const itemLine = player.activeItem
    ? `<span class="hud-chip">아이템: ${getItemLabel(player.activeItem)}</span>`
    : '';

  container.innerHTML = `
    <div class="pov-hud__top">
      ${renderPenaltyChip(player, '페널티', '턴 패배 시 +1. 3/3이면 매치 패배.')}
      <span class="hud-chip hud-chip--meta">턴 ${turn} · ${phaseLabel}</span>
      ${renderPenaltyChip(opponent, 'CPU', '상대 3/3이면 승리.')}
    </div>
    <div class="pov-hud__bottom">
      <span class="hud-chip">바꾸기 ${player.resources.changes}</span>
      <span class="hud-chip">페이크 ${player.resources.bluffs}</span>
      ${renderMaskLine(equippedMaskId)}
      ${itemLine}
    </div>
  `;
}

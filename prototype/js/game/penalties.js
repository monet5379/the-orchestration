import { MAX_PENALTIES } from '../core/constants.js';

/**
 * @param {object} combatant
 * @returns {object}
 */
export function applyPenalty(combatant) {
  return {
    ...combatant,
    penalties: combatant.penalties + 1,
  };
}

/**
 * @param {object} combatant
 * @returns {boolean}
 */
export function isDefeated(combatant) {
  return combatant.penalties >= MAX_PENALTIES;
}

/**
 * @param {object} combatant
 * @returns {string}
 */
export function formatPenalties(combatant) {
  return `${combatant.penalties}/${MAX_PENALTIES}`;
}

/**
 * @param {number} count
 * @param {number} [max]
 * @returns {string}
 */
export function renderPenaltyPips(count, max = MAX_PENALTIES) {
  return Array.from({ length: max }, (_, i) => {
    const filled = i < count ? ' pip--filled' : '';
    return `<span class="pip${filled}"></span>`;
  }).join('');
}

/**
 * @param {number} count
 * @param {number} [max]
 * @returns {boolean}
 */
export function isPenaltyWarn(count, max = MAX_PENALTIES) {
  return count === max - 1 && count > 0;
}

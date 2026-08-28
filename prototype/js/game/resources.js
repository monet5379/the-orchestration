import { ADJUST_DURATION_MS } from '../core/constants.js';

/** v1: 수정권, 페이크 블러핑 자원 */

/**
 * @param {object} combatant
 * @returns {boolean}
 */
export function canChange(combatant) {
  return combatant.resources.changes > 0;
}

/**
 * @param {object} combatant
 * @returns {object}
 */
export function spendChange(combatant) {
  return {
    ...combatant,
    resources: {
      ...combatant.resources,
      changes: combatant.resources.changes - 1,
    },
  };
}

/**
 * @param {object} combatant
 * @returns {boolean}
 */
export function canBluff(combatant) {
  return combatant.resources.bluffs > 0;
}

/**
 * @param {object} combatant
 * @returns {object}
 */
export function spendBluff(combatant) {
  return {
    ...combatant,
    resources: {
      ...combatant.resources,
      bluffs: combatant.resources.bluffs - 1,
    },
  };
}

/**
 * @param {object} state
 * @returns {number}
 */
export function getAdjustDurationMs(state) {
  const bonus = state.player.activeItem === 'time_warp' ? 2000 : 0;
  return ADJUST_DURATION_MS + bonus;
}

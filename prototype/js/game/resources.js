import { getBalance } from '../core/balance.js';

/** v1: 바꾸기, 페이크 블러핑 자원 */

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
 * @returns {number}
 */
export function getAdjustDurationMs() {
  return getBalance().timers.adjustMs;
}

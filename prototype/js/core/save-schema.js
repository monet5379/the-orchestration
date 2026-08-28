/** v2: localStorage save schema */

export const SAVE_VERSION = 1;
export const MAX_MATCH_HISTORY = 5;

/**
 * @returns {object}
 */
export function createDefaultSave() {
  return {
    version: SAVE_VERSION,
    masks: { unlocked: [], equipped: null },
    matchHistory: [],
    stats: { wins: 0, losses: 0 },
  };
}

/**
 * @param {object | null} raw
 * @returns {object}
 */
export function normalizeSave(raw) {
  if (!raw || typeof raw !== 'object') {
    return createDefaultSave();
  }

  return {
    version: SAVE_VERSION,
    masks: {
      unlocked: Array.isArray(raw.masks?.unlocked) ? [...raw.masks.unlocked] : [],
      equipped: raw.masks?.equipped ?? null,
    },
    matchHistory: Array.isArray(raw.matchHistory) ? [...raw.matchHistory] : [],
    stats: {
      wins: raw.stats?.wins ?? 0,
      losses: raw.stats?.losses ?? 0,
    },
  };
}

/**
 * @param {object[]} history
 * @param {number} [max]
 * @returns {object[]}
 */
export function trimMatchHistory(history, max = MAX_MATCH_HISTORY) {
  return history.slice(-max);
}

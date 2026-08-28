import { MOVE } from '../core/constants.js';
import { ALL_MASK_IDS } from '../game/masks.js';

/** @typedef {import('../core/constants.js').Move} Move */

const MOVES = [MOVE.ROCK, MOVE.PAPER, MOVE.SCISSORS];

/**
 * @param {object} _state
 * @returns {Move}
 */
export function pickInitialChoice(_state) {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

/**
 * @param {Move} current
 * @returns {Move}
 */
export function pickDifferentMove(current) {
  const options = MOVES.filter((m) => m !== current);
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * @param {object} state
 * @returns {boolean}
 */
export function decideAdjust(state) {
  if (state.partialResult === 'draw') {
    return Math.random() > 0.75;
  }
  return state.partialResult === 'winner_exists' && Math.random() > 0.45;
}

/**
 * @param {object} state
 * @returns {{ changed: boolean, move?: Move }}
 */
export function planCpuAdjust(state) {
  if (!decideAdjust(state)) {
    return { changed: false };
  }
  if (state.opponent.resources.changes <= 0) {
    return { changed: false };
  }

  const current = state.opponent.finalChoice ?? state.opponent.choice;
  if (!current) return { changed: false };

  return { changed: true, move: pickDifferentMove(current) };
}

/**
 * @param {object} state
 * @returns {boolean}
 */
export function maybeBluff(state) {
  if (state.opponent.resources.bluffs <= 0) return false;
  return Math.random() > 0.55;
}

/**
 * @param {string[]} remaining
 * @returns {string | null}
 */
export function pickTieItem(remaining) {
  if (!remaining.length) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}

/**
 * @param {string[]} playerUnlockedIds
 * @returns {string}
 */
export function pickOpponentMask(playerUnlockedIds) {
  const unlocked = playerUnlockedIds ?? [];
  const notOwned = ALL_MASK_IDS.filter((id) => !unlocked.includes(id));
  const pool = notOwned.length > 0 ? notOwned : ALL_MASK_IDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

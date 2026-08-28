import { MOVE } from '../core/constants.js';

/** @typedef {import('../core/constants.js').Move} Move */

/**
 * @param {Move} a
 * @param {Move} b
 * @returns {'win' | 'lose' | 'draw'}
 */
export function resolveRps(a, b) {
  if (a === b) return 'draw';

  const wins = {
    [MOVE.ROCK]: MOVE.SCISSORS,
    [MOVE.PAPER]: MOVE.ROCK,
    [MOVE.SCISSORS]: MOVE.PAPER,
  };

  return wins[a] === b ? 'win' : 'lose';
}

/**
 * @param {Move} playerMove
 * @param {Move} opponentMove
 * @returns {'winner_exists' | 'draw'}
 */
export function getPartialResult(playerMove, opponentMove) {
  return playerMove === opponentMove ? 'draw' : 'winner_exists';
}

import { SCENE, PHASE } from '../core/constants.js';

/**
 * @param {object} state
 * @returns {boolean}
 */
export function isMatchActive(state) {
  return state.scene === SCENE.MATCH && state.phase !== PHASE.MATCH_END;
}

/**
 * @param {object} state
 * @returns {boolean}
 */
export function isMatchOver(state) {
  return state.phase === PHASE.MATCH_END || state.scene === SCENE.GAMEOVER;
}

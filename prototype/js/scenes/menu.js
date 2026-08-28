import { SCENE } from '../core/constants.js';

/**
 * @param {object} state
 * @returns {object}
 */
export function initMenu(state) {
  return { ...state, scene: SCENE.MENU };
}

/**
 * @param {object} state
 * @returns {object}
 */
export function startMatch(state) {
  return { ...state, scene: SCENE.MATCH };
}

/**
 * 1턴 오케스트레이션.
 * TODO: Step 2~3 — SELECT → REVEAL → ADJUST → RESOLVE 흐름 연결
 */

/**
 * @param {object} state
 * @returns {object}
 */
export function startTurn(state) {
  return { ...state, turn: state.turn + 1 };
}

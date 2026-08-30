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
 * ADJUST 최종 행동을 한 번에 결정 (유지 | 바꾸기 | 페이크).
 * 바꾸기와 페이크는 동시에 나오지 않음.
 *
 * main.js가 named import 함 — rename/삭제 시 import도 같이 맞출 것.
 * export 누락 시 모듈 로드 실패 → boot 미실행 → 타이틀 버튼이 먹통처럼 보임.
 * opponent.js를 바꾼 뒤에는 main.js의 import `?v=`도 올리거나, run.bat(serve.py no-store)로 서버를 쓴다.
 *
 * @param {object} state
 * @returns {{ kind: 'kept' } | { kind: 'changed', move: Move } | { kind: 'bluffed' }}
 */
export function planCpuAdjustAction(state) {
  const adjust = planCpuAdjust(state);
  if (adjust.changed && adjust.move) {
    return { kind: 'changed', move: adjust.move };
  }
  if (maybeBluff(state)) {
    return { kind: 'bluffed' };
  }
  return { kind: 'kept' };
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

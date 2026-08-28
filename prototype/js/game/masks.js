/** v2: mask collection and passive abilities */

import { PHASE } from '../core/constants.js';
import { INSTINCT_READING } from './items.js';

/** @enum {string} */
export const MASK = {
  DOODLE_SMILE: 'doodle_smile',
  DOODLE_QUESTION: 'doodle_question',
  DOODLE_CROSS: 'doodle_cross',
};

/** @type {string[]} */
export const ALL_MASK_IDS = [
  MASK.DOODLE_SMILE,
  MASK.DOODLE_QUESTION,
  MASK.DOODLE_CROSS,
];

/** @type {Record<string, { label: string, doodle: string, ability: string, desc: string }>} */
export const MASK_INFO = {
  [MASK.DOODLE_SMILE]: {
    label: '웃는 가면',
    doodle: '☺',
    ability: 'extra_change',
    desc: '매치 시작 시 수정권을 1 추가로 얻습니다.',
  },
  [MASK.DOODLE_QUESTION]: {
    label: '물음 가면',
    doodle: '?',
    ability: 'extra_bluff',
    desc: '매치 시작 시 페이크 자원을 1 추가로 얻습니다.',
  },
  [MASK.DOODLE_CROSS]: {
    label: '엑스 가면',
    doodle: '×',
    ability: 'instinct_hint',
    desc: '첫 수정 페이즈에서 상대의 패 변경 여부를 알려 줍니다.',
  },
};

/**
 * @param {string} maskId
 * @returns {string}
 */
export function getMaskLabel(maskId) {
  return MASK_INFO[maskId]?.label ?? maskId;
}

/**
 * @param {string} maskId
 * @returns {string}
 */
export function getMaskDoodle(maskId) {
  return MASK_INFO[maskId]?.doodle ?? '?';
}

/**
 * @param {object} combatant
 * @param {string | null} maskId
 * @returns {object}
 */
export function applyMaskToCombatant(combatant, maskId) {
  if (!maskId || !MASK_INFO[maskId]) return combatant;

  const ability = MASK_INFO[maskId].ability;
  const resources = { ...combatant.resources };

  if (ability === 'extra_change') {
    resources.changes += 1;
  } else if (ability === 'extra_bluff') {
    resources.bluffs += 1;
  }

  return { ...combatant, resources };
}

/**
 * × 가면 — 1턴 ADJUST에서만 본능과 같은 힌트
 * @param {object} state
 * @returns {boolean}
 */
export function isMaskInstinctActive(state) {
  return (
    state.equippedMaskId === MASK.DOODLE_CROSS &&
    state.turn === 1 &&
    state.phase === PHASE.ADJUST
  );
}

/**
 * @param {'changed' | 'kept'} reading
 * @returns {string}
 */
export function getMaskInstinctLogMessage(reading) {
  return reading === INSTINCT_READING.CHANGED
    ? '[가면] 패를 변경했습니다.'
    : '[가면] 패를 유지합니다.';
}

/**
 * @param {'changed' | 'kept'} reading
 * @returns {string}
 */
export function getMaskInstinctDisplayHtml(reading) {
  const message =
    reading === INSTINCT_READING.CHANGED
      ? '패를 변경했습니다.'
      : '패를 유지합니다.';
  return `<span class="instinct-reading">[가면] ${message}</span>`;
}

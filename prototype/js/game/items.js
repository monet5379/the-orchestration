/** v1: 무승부 유틸리티 아이템 (1턴 룰 왜곡) */

/** @enum {string} */
export const ITEM = {
  INSTINCT: 'instinct',
  TIME_WARP: 'time_warp',
  RULE_BREAK: 'rule_break',
};

/** @type {string[]} */
export const DEFAULT_TIE_ITEMS = [ITEM.INSTINCT, ITEM.TIME_WARP, ITEM.RULE_BREAK];

/** @enum {string} */
export const INSTINCT_READING = {
  CHANGED: 'changed',
  BLUFFED: 'bluffed',
  KEPT: 'kept',
};

/** @type {Record<string, { label: string, desc: string }>} */
export const ITEM_INFO = {
  [ITEM.INSTINCT]: {
    label: '본능',
    desc: '다음 턴 <span class="phase-term">수정 페이즈</span> 중, 상대가 <strong>실제로 패를 변경</strong>했는지 <strong>페이크</strong>를 썼는지 정확히 알려 줍니다.',
  },
  [ITEM.TIME_WARP]: {
    label: '시간 팽창',
    desc: '다음 턴 <span class="phase-term">수정 페이즈</span> 시간이 2초 연장됩니다.',
  },
  [ITEM.RULE_BREAK]: {
    label: '규칙 파괴',
    desc: '다음 턴 <span class="phase-term">상황 공개</span>에서 상대의 초기 패가 공개됩니다.',
  },
};

/**
 * @param {string} itemId
 * @returns {string}
 */
export function getItemLabel(itemId) {
  return ITEM_INFO[itemId]?.label ?? itemId;
}

/**
 * @param {object} opponent
 * @returns {boolean}
 */
export function didOpponentChange(opponent) {
  return opponent.choice !== opponent.finalChoice;
}

/**
 * 수정 페이즈 — 실제 변경 / 페이크 / 유지를 구분
 * @param {object} opponent
 * @param {boolean} cpuBluffedThisTurn
 * @returns {'changed' | 'bluffed' | 'kept'}
 */
export function getInstinctItemReading(opponent, cpuBluffedThisTurn) {
  if (didOpponentChange(opponent)) {
    return INSTINCT_READING.CHANGED;
  }
  if (cpuBluffedThisTurn) {
    return INSTINCT_READING.BLUFFED;
  }
  return INSTINCT_READING.KEPT;
}

/**
 * @param {'changed' | 'bluffed' | 'kept'} reading
 * @returns {string}
 */
export function getInstinctLogMessage(reading) {
  if (reading === INSTINCT_READING.CHANGED) {
    return '[본능] 패를 변경했습니다.';
  }
  if (reading === INSTINCT_READING.BLUFFED) {
    return '[본능] 페이크를 사용했습니다.';
  }
  return '[본능] 패를 유지합니다.';
}

/**
 * @param {'changed' | 'bluffed' | 'kept'} reading
 * @returns {string}
 */
export function getInstinctDisplayHtml(reading) {
  const message =
    reading === INSTINCT_READING.CHANGED
      ? '패를 변경했습니다.'
      : reading === INSTINCT_READING.BLUFFED
        ? '페이크를 사용했습니다.'
        : '패를 유지합니다.';
  return `<span class="instinct-reading">[본능] ${message}</span>`;
}

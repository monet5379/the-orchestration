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
  KEPT: 'kept',
};

/** @type {Record<string, { label: string, desc: string }>} */
export const ITEM_INFO = {
  [ITEM.INSTINCT]: {
    label: '본능',
    desc: '다음 턴 <span class="phase-term">수정 페이즈</span> 중, 상대가 패를 바꿨는지 힌트를 제공합니다. (페이크 연출도 변경으로 감지)',
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
 * @param {object} opponent
 * @param {boolean} cpuBluffedThisTurn
 * @returns {'changed' | 'kept'}
 */
export function getInstinctReading(opponent, cpuBluffedThisTurn) {
  const sensedChange = didOpponentChange(opponent) || cpuBluffedThisTurn;
  return sensedChange ? INSTINCT_READING.CHANGED : INSTINCT_READING.KEPT;
}

/**
 * @param {'changed' | 'kept'} reading
 * @returns {string}
 */
export function getInstinctLogMessage(reading) {
  return reading === INSTINCT_READING.CHANGED
    ? '[본능] 패를 변경했습니다.'
    : '[본능] 패를 유지합니다.';
}

/**
 * @param {'changed' | 'kept'} reading
 * @returns {string}
 */
export function getInstinctDisplayHtml(reading) {
  const message =
    reading === INSTINCT_READING.CHANGED
      ? '패를 변경했습니다.'
      : '패를 유지합니다.';
  return `<span class="instinct-reading">[본능] ${message}</span>`;
}

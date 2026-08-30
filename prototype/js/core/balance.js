/**
 * 기획 조정용 밸런스 수치 (런타임 단위: ms, 확률 0~1).
 * 시트 로드·초 단위 변환은 이후 단계에서 추가한다.
 */
export const BALANCE_DEFAULTS = {
  meta: { version: 1 },
  timers: {
    selectMs: 60000,
    adjustMs: 15000,
    timeWarpBonusMs: 2000,
  },
  match: {
    maxPenalties: 3,
    startChanges: 2,
    startBluffs: 1,
  },
  ai: {
    adjustChanceOnDraw: 0.25,
    adjustChanceWhenWinner: 0.55,
    bluffChance: 0.45,
    adjustDelayMinMs: 1000,
    adjustDelayMaxMs: 4000,
    bluffDelayMinMs: 300,
    bluffDelayMaxMs: 1100,
  },
};

let current = structuredClone(BALANCE_DEFAULTS);

/**
 * @returns {typeof BALANCE_DEFAULTS}
 */
export function getBalance() {
  return current;
}

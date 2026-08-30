/**
 * 기획 조정용 밸런스 수치 (런타임 단위: ms, 확률 0~1).
 * 로드 소스: 로컬 JSON (3단계에서 시트 URL로 교체 가능).
 */

/** 기본 로드 URL — 시트 연동 시 이 값(또는 loadBalance 인자)만 바꾸면 됨 */
export const BALANCE_URL = './data/balance.json';

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

/** @type {typeof BALANCE_DEFAULTS} */
let current = structuredClone(BALANCE_DEFAULTS);

/** @type {'defaults' | 'json'} */
let loadSource = 'defaults';

/**
 * @returns {typeof BALANCE_DEFAULTS}
 */
export function getBalance() {
  return current;
}

/**
 * @returns {'defaults' | 'json'}
 */
export function getBalanceSource() {
  return loadSource;
}

/**
 * 타이틀 확인용 한 줄 (예: balance v1 · json)
 * @returns {string}
 */
export function formatBalanceMeta() {
  return `balance v${current.meta.version} · ${loadSource}`;
}

/**
 * @param {unknown} data
 * @returns {data is typeof BALANCE_DEFAULTS}
 */
function isValidBalance(data) {
  if (!data || typeof data !== 'object') return false;
  const d = /** @type {Record<string, unknown>} */ (data);
  if (!d.meta || typeof d.meta !== 'object') return false;
  if (typeof /** @type {Record<string, unknown>} */ (d.meta).version !== 'number') {
    return false;
  }
  for (const section of ['timers', 'match', 'ai']) {
    const expected = BALANCE_DEFAULTS[/** @type {'timers'|'match'|'ai'} */ (section)];
    const got = d[section];
    if (!got || typeof got !== 'object') return false;
    for (const key of Object.keys(expected)) {
      if (typeof /** @type {Record<string, unknown>} */ (got)[key] !== 'number') {
        return false;
      }
    }
  }
  return true;
}

/**
 * @param {typeof BALANCE_DEFAULTS} data
 * @param {'defaults' | 'json'} source
 */
function applyBalance(data, source) {
  current = structuredClone(data);
  loadSource = source;
}

/**
 * 타이틀/부팅 시에만 호출. 매치 도중에는 읽지 않음.
 * 성공 시 current 교체, 실패 시 기존 값(초기면 BALANCE_DEFAULTS) 유지.
 *
 * @param {string} [url] 로드 URL (기본: 로컬 JSON; 이후 시트 URL)
 * @returns {Promise<{ ok: boolean, source: 'defaults' | 'json' }>}
 */
export async function loadBalance(url = BALANCE_URL) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!isValidBalance(data)) throw new Error('invalid balance shape');
    applyBalance(data, 'json');
    return { ok: true, source: loadSource };
  } catch (err) {
    console.warn('[balance] load failed — keeping', loadSource, err);
    return { ok: false, source: loadSource };
  }
}

/**
 * 기획 조정용 밸런스 수치 (런타임 단위: ms, 확률 0~1).
 * 로드 소스: 구글 시트 게시 CSV → 실패 시 로컬 JSON → defaults.
 * 시트는 초(*Sec)로 두고, 로드/파서에서만 ms로 변환한다.
 */

/** 기본 로드 URL — 공개 게시 CSV (시크릿 아님). loadBalance 인자로 덮어쓸 수 있음 */
export const BALANCE_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDLFmfN09iJUUNMn08J0vQqqYal3qHWFayxAk7BnbjLICy6dJebAvdWakdApwTpGl9ZoXA4NKkHDsF/pub?output=csv';

/** 시트 실패·오프라인용 */
export const BALANCE_FALLBACK_URL = './data/balance.json';

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

/** 시트 flat key → 런타임 nested path (Sec 키는 ms로 변환) */
const SHEET_KEY_MAP = {
  'meta.version': { path: ['meta', 'version'], scale: 1 },
  'timers.selectSec': { path: ['timers', 'selectMs'], scale: 1000 },
  'timers.adjustSec': { path: ['timers', 'adjustMs'], scale: 1000 },
  'timers.timeWarpBonusSec': { path: ['timers', 'timeWarpBonusMs'], scale: 1000 },
  'match.maxPenalties': { path: ['match', 'maxPenalties'], scale: 1 },
  'match.startChanges': { path: ['match', 'startChanges'], scale: 1 },
  'match.startBluffs': { path: ['match', 'startBluffs'], scale: 1 },
  'ai.adjustChanceOnDraw': { path: ['ai', 'adjustChanceOnDraw'], scale: 1 },
  'ai.adjustChanceWhenWinner': { path: ['ai', 'adjustChanceWhenWinner'], scale: 1 },
  'ai.bluffChance': { path: ['ai', 'bluffChance'], scale: 1 },
  'ai.adjustDelayMinSec': { path: ['ai', 'adjustDelayMinMs'], scale: 1000 },
  'ai.adjustDelayMaxSec': { path: ['ai', 'adjustDelayMaxMs'], scale: 1000 },
  'ai.bluffDelayMinSec': { path: ['ai', 'bluffDelayMinMs'], scale: 1000 },
  'ai.bluffDelayMaxSec': { path: ['ai', 'bluffDelayMaxMs'], scale: 1000 },
};

/** @type {typeof BALANCE_DEFAULTS} */
let current = structuredClone(BALANCE_DEFAULTS);

/** @type {'defaults' | 'json' | 'sheet'} */
let loadSource = 'defaults';

/**
 * @returns {typeof BALANCE_DEFAULTS}
 */
export function getBalance() {
  return current;
}

/**
 * @returns {'defaults' | 'json' | 'sheet'}
 */
export function getBalanceSource() {
  return loadSource;
}

/**
 * 타이틀 확인용 한 줄 (예: balance v1 · sheet)
 * @returns {string}
 */
export function formatBalanceMeta() {
  return `balance v${current.meta.version} · ${loadSource}`;
}

/**
 * RFC-style CSV: 쉼표·따옴표 이스케이프.
 * @param {string} text
 * @returns {string[][]}
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, '');

  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      i += 1;
      continue;
    }
    if (ch === '\r') {
      i += 1;
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/**
 * @param {string} csvText
 * @returns {Record<string, number>}
 */
function flatFromCsv(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) throw new Error('empty csv');

  const header = rows[0].map((h) => h.trim());
  const keyIdx = header.indexOf('key');
  const valueIdx = header.indexOf('value');
  if (keyIdx < 0 || valueIdx < 0) throw new Error('csv needs key and value columns');

  /** @type {Record<string, number>} */
  const flat = {};
  for (let r = 1; r < rows.length; r += 1) {
    const cols = rows[r];
    const key = (cols[keyIdx] ?? '').trim();
    if (!key || key.startsWith('#')) continue;
    const raw = (cols[valueIdx] ?? '').trim();
    if (raw === '') continue;
    const num = Number(raw);
    if (Number.isNaN(num)) continue;
    flat[key] = num;
  }
  return flat;
}

/**
 * 시트 flat(초) → 런타임 nested(ms).
 * @param {Record<string, number>} flat
 * @returns {typeof BALANCE_DEFAULTS | null}
 */
function normalizeSheetFlat(flat) {
  const out = structuredClone(BALANCE_DEFAULTS);
  for (const [sheetKey, { path, scale }] of Object.entries(SHEET_KEY_MAP)) {
    if (!(sheetKey in flat)) return null;
    const n = flat[sheetKey] * scale;
    if (typeof n !== 'number' || Number.isNaN(n)) return null;
    let cur = /** @type {Record<string, unknown>} */ (out);
    for (let i = 0; i < path.length - 1; i += 1) {
      cur = /** @type {Record<string, unknown>} */ (cur[path[i]]);
    }
    cur[path[path.length - 1]] = n;
  }
  return out;
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
 * @param {'defaults' | 'json' | 'sheet'} source
 */
function applyBalance(data, source) {
  current = structuredClone(data);
  loadSource = source;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function looksLikeCsvUrl(url) {
  return /[?&]output=csv\b/i.test(url) || /\.csv(\?|$)/i.test(url);
}

/**
 * @param {Response} res
 * @param {string} url
 * @returns {Promise<typeof BALANCE_DEFAULTS>}
 */
async function parseBalanceResponse(res, url) {
  const text = await res.text();
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const asCsv =
    looksLikeCsvUrl(url) ||
    ct.includes('text/csv') ||
    ct.includes('application/csv') ||
    (!ct.includes('json') && text.trimStart().startsWith('key,'));

  if (asCsv) {
    const flat = flatFromCsv(text);
    const nested = normalizeSheetFlat(flat);
    if (!nested || !isValidBalance(nested)) throw new Error('invalid sheet balance');
    return nested;
  }

  const data = JSON.parse(text);
  if (!isValidBalance(data)) throw new Error('invalid balance shape');
  return data;
}

/**
 * @param {string} url
 * @param {'json' | 'sheet'} source
 * @returns {Promise<boolean>}
 */
async function tryLoadFromUrl(url, source) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await parseBalanceResponse(res, url);
  applyBalance(data, source);
  return true;
}

/**
 * 타이틀/부팅 시에만 호출. 매치 도중에는 읽지 않음.
 * 성공 시 current 교체, 실패 시 기존 값(초기면 BALANCE_DEFAULTS) 유지.
 *
 * @param {string} [url] 로드 URL (기본: 게시 CSV)
 * @returns {Promise<{ ok: boolean, source: 'defaults' | 'json' | 'sheet' }>}
 */
export async function loadBalance(url = BALANCE_URL) {
  const primarySource = looksLikeCsvUrl(url) || url === BALANCE_URL ? 'sheet' : 'json';

  try {
    await tryLoadFromUrl(url, primarySource);
    return { ok: true, source: loadSource };
  } catch (err) {
    console.warn('[balance] primary load failed — trying fallback', err);
  }

  if (url !== BALANCE_FALLBACK_URL) {
    try {
      await tryLoadFromUrl(BALANCE_FALLBACK_URL, 'json');
      return { ok: true, source: loadSource };
    } catch (err) {
      console.warn('[balance] fallback load failed — keeping', loadSource, err);
    }
  } else {
    console.warn('[balance] load failed — keeping', loadSource);
  }

  return { ok: false, source: loadSource };
}

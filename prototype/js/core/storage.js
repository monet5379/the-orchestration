/** v2: localStorage 기반 메타 진행 (가면 수집 등) */

import {
  createDefaultSave,
  normalizeSave,
  trimMatchHistory,
  MAX_MATCH_HISTORY,
} from './save-schema.js';

const STORAGE_KEY = 'orchestration-save';

/**
 * @returns {object | null}
 */
export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @returns {object}
 */
export function loadOrCreateSave() {
  return normalizeSave(loadSave());
}

/**
 * @param {object} data
 */
export function saveSave(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * @param {object} data
 */
export function persistSave(data) {
  const normalized = normalizeSave(data);
  normalized.matchHistory = trimMatchHistory(normalized.matchHistory, MAX_MATCH_HISTORY);
  saveSave(normalized);
}

/**
 * @param {object} data
 * @returns {boolean}
 */
export function hasSaveProgress(data) {
  const save = normalizeSave(data);
  return (
    (save.masks.unlocked?.length ?? 0) > 0 ||
    (save.stats?.wins ?? 0) > 0 ||
    (save.stats?.losses ?? 0) > 0
  );
}

/**
 * @param {object} data
 * @returns {string}
 */
export function formatSaveSummary(data) {
  const save = normalizeSave(data);
  const masks = save.masks.unlocked?.length ?? 0;
  const wins = save.stats?.wins ?? 0;
  const losses = save.stats?.losses ?? 0;
  return `가면 ${masks} · 승 ${wins} / 패 ${losses}`;
}

/**
 * @returns {object}
 */
export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return createDefaultSave();
}

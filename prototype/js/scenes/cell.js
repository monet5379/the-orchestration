/** v2: 독방·가면 진열·VHS 리플레이 */

import { SCENE } from '../core/constants.js';
import { persistSave } from '../core/storage.js';
import { trimMatchHistory } from '../core/save-schema.js';
import { createMatchState } from '../game/state.js';
import { applyMaskToCombatant, getMaskLabel, MASK_INFO } from '../game/masks.js';
import { pickOpponentMask } from '../ai/opponent.js';
import { flattenReplay } from '../game/replay.js';

/**
 * @param {object} state
 * @returns {object}
 */
export function enterCell(state) {
  return { ...state, scene: SCENE.CELL };
}

/**
 * @param {object} save
 * @param {object} state
 * @returns {{ save: object, alreadyOwned: boolean, newMaskId: string | null }}
 */
export function persistVictory(save, state) {
  const pending = state.pendingCell;
  if (!pending) return { save, alreadyOwned: false, newMaskId: null };

  const newMaskId = pending.opponentMaskId;
  const alreadyOwned = newMaskId ? save.masks.unlocked.includes(newMaskId) : false;

  if (newMaskId && !alreadyOwned) {
    save.masks.unlocked = [...save.masks.unlocked, newMaskId];
  }

  save.stats.wins += 1;

  const replayEvents = pending.replay ? flattenReplay(pending.replay) : [];
  save.matchHistory = trimMatchHistory([
    ...save.matchHistory,
    {
      id: `m-${Date.now()}`,
      endedAt: pending.summary?.endedAt ?? Date.now(),
      winner: 'player',
      turns: pending.summary?.turns ?? state.turn,
      opponentMaskId: newMaskId,
      replay: replayEvents,
    },
  ]);

  persistSave(save);
  return { save, alreadyOwned, newMaskId };
}

/**
 * @param {object} save
 * @param {string} maskId
 * @returns {object}
 */
export function equipMask(save, maskId) {
  if (!maskId || !save.masks.unlocked.includes(maskId)) {
    return save;
  }
  save.masks.equipped = maskId;
  persistSave(save);
  return save;
}

/**
 * @param {object} save
 * @returns {object}
 */
export function createNextMatchState(save) {
  const opponentMaskId = pickOpponentMask(save.masks.unlocked);
  const equippedMaskId = save.masks.equipped;

  let state = createMatchState({
    opponentMaskId,
    equippedMaskId,
  });

  if (equippedMaskId) {
    state = {
      ...state,
      player: applyMaskToCombatant(state.player, equippedMaskId),
    };
  }

  return state;
}

/**
 * @param {object} save
 * @param {string | null} newMaskId
 * @param {boolean} alreadyOwned
 * @returns {string}
 */
export function formatRewardMessage(save, newMaskId, alreadyOwned) {
  if (!newMaskId || !MASK_INFO[newMaskId]) {
    return '승리 — 독방으로 이송되었습니다.';
  }
  const label = getMaskLabel(newMaskId);
  if (alreadyOwned) {
    return `승리 — ${label}은(는) 이미 보유 중입니다. VHS 테이프를 확인하세요.`;
  }
  return `승리 — ${label} 획득! 벽면에서 [장착] 후 다음 상대에 도전하세요.`;
}

/**
 * @param {object} save
 * @param {object} state
 */
export function recordDefeat(save) {
  save.stats.losses += 1;
  persistSave(save);
  return save;
}

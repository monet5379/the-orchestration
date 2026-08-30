import { PHASE, SCENE } from '../core/constants.js';
import { getBalance } from '../core/balance.js';
import { createReplayState } from './replay.js';

/**
 * @returns {object}
 */
export function createCombatant() {
  const { match } = getBalance();
  return {
    choice: null,
    finalChoice: null,
    resources: { changes: match.startChanges, bluffs: match.startBluffs },
    penalties: 0,
    activeItem: null,
    items: [],
  };
}

/**
 * @returns {object}
 */
export function createInitialState() {
  return {
    scene: SCENE.MENU,
    // MENU ≠ SELECT — 타이틀에서 START_MATCH 시 phase 전환으로 SELECT 부트가 스킵되지 않게 함
    phase: PHASE.MENU,
    turn: 0,
    player: createCombatant(),
    opponent: createCombatant(),
    partialResult: null,
    lastResolve: null,
    cpuAdjusted: false,
    playerAdjusted: false,
    cpuBluffedThisTurn: false,
    /** @type {null | 'kept' | 'changed' | 'bluffed'} 상대 ADJUST 버튼 (진실값; UI는 본능/가면 여부로 위장) */
    opponentButtonHint: null,
    /** @type {'player' | 'opponent'} ADJUST 선공. 0.1.35: 항상 player(선공). 후공 분기는 코드에 유지 */
    initiative: 'player',
    adjustTimerMs: getBalance().timers.adjustMs,
    tieItems: [],
    tieItemsRemaining: [],
    tieLootSelection: null,
    matchLog: [],
    replay: createReplayState(),
    opponentMaskId: null,
    equippedMaskId: null,
    pendingCell: null,
    winner: null,
  };
}

/**
 * @param {{ opponentMaskId?: string | null, equippedMaskId?: string | null }} [options]
 * @returns {object}
 */
export function createMatchState(options = {}) {
  return {
    scene: SCENE.MATCH,
    phase: PHASE.SELECT,
    turn: 1,
    player: createCombatant(),
    opponent: createCombatant(),
    partialResult: null,
    lastResolve: null,
    cpuAdjusted: false,
    playerAdjusted: false,
    cpuBluffedThisTurn: false,
    /** @type {null | 'kept' | 'changed' | 'bluffed'} */
    opponentButtonHint: null,
    /** @type {'player' | 'opponent'} ADJUST 선공. 0.1.35: 항상 player(선공). 후공 분기는 코드에 유지 */
    initiative: 'player',
    adjustTimerMs: getBalance().timers.adjustMs,
    tieItems: [],
    tieItemsRemaining: [],
    tieLootSelection: null,
    matchLog: [],
    replay: createReplayState(),
    opponentMaskId: options.opponentMaskId ?? null,
    equippedMaskId: options.equippedMaskId ?? null,
    pendingCell: null,
    winner: null,
  };
}

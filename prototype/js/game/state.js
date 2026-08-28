import { PHASE, SCENE, ADJUST_DURATION_MS } from '../core/constants.js';
import { createReplayState } from './replay.js';

/**
 * @returns {object}
 */
export function createCombatant() {
  return {
    choice: null,
    finalChoice: null,
    resources: { changes: 2, bluffs: 1 },
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
    phase: PHASE.SELECT,
    turn: 0,
    player: createCombatant(),
    opponent: createCombatant(),
    partialResult: null,
    lastResolve: null,
    cpuAdjusted: false,
    cpuBluffedThisTurn: false,
    instinctReading: null,
    adjustTimerMs: ADJUST_DURATION_MS,
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
    cpuBluffedThisTurn: false,
    instinctReading: null,
    adjustTimerMs: ADJUST_DURATION_MS,
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

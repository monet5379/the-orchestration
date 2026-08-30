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
    /** @type {'player' | 'opponent'} ADJUST 선공. 매치 시작 동전 · 턴마다 교대 (MENU에서는 미사용) */
    initiative: 'player',
    /** 매치 시작 동전 의식 중 — SELECT 입력·타이머 차단 */
    coinPending: false,
    /** 의식 중 결과 문구 노출 여부 */
    coinRevealed: false,
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
    /** @type {'player' | 'opponent'} ADJUST 선공. 0.1.36: 매치 시작 동전 50/50 · 이후 턴마다 교대 */
    initiative: Math.random() < 0.5 ? 'player' : 'opponent',
    /** 매치 시작만 true — 동전 의식 후 FINISH_COIN */
    coinPending: true,
    coinRevealed: false,
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

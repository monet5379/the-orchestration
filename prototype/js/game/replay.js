/** v2: structured match replay for VHS playback */

/**
 * @returns {{ events: object[], matchStartMs: number }}
 */
export function createReplayState() {
  return { events: [], matchStartMs: Date.now() };
}

/**
 * @param {{ events: object[], matchStartMs: number }} replay
 * @param {object} event
 * @returns {{ events: object[], matchStartMs: number }}
 */
export function appendReplayEvent(replay, event) {
  const t = Date.now() - replay.matchStartMs;
  return {
    ...replay,
    events: [...replay.events, { ...event, t }],
  };
}

/**
 * @param {{ events: object[] }} replay
 * @returns {object[]}
 */
export function flattenReplay(replay) {
  if (!replay?.events) return [];
  return [...replay.events].sort((a, b) => a.t - b.t);
}

const KIND_LABEL = {
  select: '패 선택',
  reveal: '상황 공개',
  adjust_start: '수정 시작',
  adjust: '바꾸기',
  bluff: '페이크',
  resolve: '결과',
  penalty: '페널티',
  tie_loot: '아이템',
  match_end: '매치 종료',
};

const ACTOR_LABEL = {
  player: '나',
  cpu: 'CPU',
  system: '시스템',
};

/**
 * @param {object} event
 * @returns {string}
 */
export function formatReplayLine(event) {
  const turn = event.turn ?? '?';
  const kind = KIND_LABEL[event.kind] ?? event.kind;
  const actor = ACTOR_LABEL[event.actor] ?? event.actor;
  const hidden = event.hidden ? ' (hidden)' : '';

  let detail = '';
  if (event.payload?.message) {
    detail = event.payload.message;
  } else if (event.kind === 'bluff') {
    detail = 'fake';
  } else if (event.kind === 'adjust' && event.payload?.kept) {
    detail = 'kept';
  } else if (event.kind === 'adjust' && event.payload?.from && event.payload?.to) {
    detail = `${event.payload.from} → ${event.payload.to}`;
  } else if (event.payload?.move) {
    detail = String(event.payload.move);
  } else if (event.payload?.outcome) {
    detail = event.payload.outcome;
  }

  const detailStr = detail ? ` — ${detail}` : '';
  return `[턴 ${turn} · ${kind}] ${actor}${hidden}${detailStr}`;
}

/**
 * @param {object} state
 * @returns {object}
 */
export function buildMatchSummary(state) {
  return {
    turns: state.turn,
    winner: state.winner,
    opponentMaskId: state.opponentMaskId,
    endedAt: Date.now(),
  };
}

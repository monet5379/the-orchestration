/** @typedef {(payload?: unknown) => void} EventHandler */

/** v1: UI ↔ game 디커플링용 이벤트 버스 */

const listeners = /** @type {Map<string, Set<EventHandler>>} */ (new Map());

/**
 * @param {string} event
 * @param {EventHandler} handler
 */
export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
}

/**
 * @param {string} event
 * @param {unknown} [payload]
 */
export function emit(event, payload) {
  const handlers = listeners.get(event);
  if (!handlers) return;
  for (const handler of handlers) handler(payload);
}

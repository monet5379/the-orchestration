/** v2: VHS replay player — read-only timeline playback */

import { flattenReplay, formatReplayLine } from '../game/replay.js';

/** @type {ReturnType<typeof setInterval> | null} */
let playTimer = null;

/** @type {object[]} */
let events = [];

/** @type {number} */
let currentIndex = 0;

/** @type {boolean} */
let isPlaying = false;

/** @type {(() => void) | null} */
let onBluffSound = null;

/**
 * @param {HTMLElement} root
 * @param {{ onBluffSound?: () => void }} [options]
 */
export function initVhsPlayer(root, options = {}) {
  onBluffSound = options.onBluffSound ?? null;

  const playBtn = root.querySelector('#vhs-play');
  const pauseBtn = root.querySelector('#vhs-pause');
  const rewindBtn = root.querySelector('#vhs-rewind');
  const ffBtn = root.querySelector('#vhs-ff');
  const scrub = root.querySelector('#vhs-scrub');

  playBtn?.addEventListener('click', () => startPlayback(root));
  pauseBtn?.addEventListener('click', () => stopPlayback());
  rewindBtn?.addEventListener('click', () => seekBy(root, -8));
  ffBtn?.addEventListener('click', () => seekBy(root, 8));

  scrub?.addEventListener('input', () => {
    const idx = Number(scrub.value);
    if (!Number.isNaN(idx)) {
      currentIndex = idx;
      renderCurrentFrame(root);
      stopPlayback();
    }
  });
}

/**
 * @param {HTMLElement} root
 * @param {object} replay
 */
export function loadVhsReplay(root, replay) {
  stopPlayback();
  events = flattenReplay(replay);
  currentIndex = 0;

  const scrub = root.querySelector('#vhs-scrub');
  if (scrub) {
    scrub.max = String(Math.max(0, events.length - 1));
    scrub.value = '0';
  }

  renderCurrentFrame(root);
}

/**
 * @param {HTMLElement} root
 */
function renderCurrentFrame(root) {
  const screen = root.querySelector('#vhs-screen');
  if (!screen) return;

  if (events.length === 0) {
    screen.innerHTML = '<p class="vhs-line vhs-line--idle">— 녹화본 없음 —</p>';
    return;
  }

  const visible = events.slice(0, currentIndex + 1);
  const lines = visible.map((ev) => formatReplayLine(ev));

  screen.innerHTML = lines
    .map((line, i) => {
      const isLatest = i === lines.length - 1;
      return `<p class="vhs-line${isLatest ? ' vhs-line--active' : ''}">${escapeHtml(line)}</p>`;
    })
    .join('');

  screen.scrollTop = screen.scrollHeight;

  const scrub = root.querySelector('#vhs-scrub');
  if (scrub) {
    scrub.value = String(currentIndex);
  }
}

/**
 * @param {HTMLElement} root
 */
function startPlayback(root) {
  if (events.length === 0) return;
  stopPlayback();
  isPlaying = true;

  playTimer = setInterval(() => {
    if (currentIndex >= events.length - 1) {
      stopPlayback();
      return;
    }
    currentIndex += 1;
    const ev = events[currentIndex];
    if (ev?.kind === 'bluff' && onBluffSound) {
      onBluffSound();
    }
    renderCurrentFrame(root);
  }, 100);
}

function stopPlayback() {
  isPlaying = false;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

/**
 * @param {HTMLElement} root
 * @param {number} delta
 */
function seekBy(root, delta) {
  if (events.length === 0) return;
  currentIndex = Math.max(0, Math.min(events.length - 1, currentIndex + delta));
  renderCurrentFrame(root);
}

/**
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function destroyVhsPlayer() {
  stopPlayback();
  events = [];
  currentIndex = 0;
}

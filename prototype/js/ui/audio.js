/** 금속 SFX — assets/sfx 우선, 실패 시 Web Audio 합성 */

const SFX_PATHS = {
  metal: 'assets/sfx/metal-click.wav',
  bluff: 'assets/sfx/metal-bluff.wav',
};

/** @type {AudioContext | null} */
let audioContext = null;

/** @type {Record<string, AudioBuffer | null>} */
const buffers = { metal: null, bluff: null };

/** @type {boolean | null} */
let assetsAvailable = null;

function getContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

async function resumeContext() {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/**
 * @param {string} key
 * @param {string} url
 */
async function loadBuffer(key, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.arrayBuffer();
    const ctx = getContext();
    buffers[key] = await ctx.decodeAudioData(data);
  } catch {
    buffers[key] = null;
  }
}

export async function preloadAudio() {
  if (assetsAvailable !== null) return assetsAvailable;

  await Promise.all([
    loadBuffer('metal', SFX_PATHS.metal),
    loadBuffer('bluff', SFX_PATHS.bluff),
  ]);

  assetsAvailable = Boolean(buffers.metal && buffers.bluff);
  return assetsAvailable;
}

/**
 * @param {'metal' | 'bluff'} key
 */
function playAsset(key) {
  const buffer = buffers[key];
  if (!buffer) return false;

  try {
    const ctx = getContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = key === 'bluff' ? 0.85 : 0.9;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    return true;
  } catch {
    return false;
  }
}

function synthMetalClick(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

function synthBluffClick(ctx) {
  synthMetalClick(ctx);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

/**
 * @param {'metal' | 'bluff'} key
 */
async function play(key) {
  try {
    await resumeContext();
    if (assetsAvailable !== false && playAsset(key)) return;
    const ctx = getContext();
    if (key === 'bluff') synthBluffClick(ctx);
    else synthMetalClick(ctx);
  } catch {
    // 오디오 미지원 환경 무시
  }
}

export function playMetalClick() {
  play('metal');
}

export function playBluffClick() {
  play('bluff');
}

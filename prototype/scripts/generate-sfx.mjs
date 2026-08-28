import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'assets', 'sfx');

function writeWav(filePath, samples, sampleRate = 44100) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

function synthMetalClick() {
  const sr = 44100;
  const len = Math.floor(sr * 0.14);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 32);
    const freq = 200 * Math.exp(-t * 10) + 80;
    const tone = Math.sin(2 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * 0.12;
    samples[i] = env * (tone * 0.55 + noise);
  }
  return samples;
}

function synthBluffClick() {
  const sr = 44100;
  const len = Math.floor(sr * 0.2);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 22);
    const freq = 190 * Math.exp(-t * 5);
    let s = env * Math.sin(2 * Math.PI * freq * t) * 0.45;
    if (t < 0.1) s += Math.exp(-t * 40) * Math.sin(2 * Math.PI * 340 * t) * 0.3;
    samples[i] = s;
  }
  return samples;
}

fs.mkdirSync(outDir, { recursive: true });
writeWav(path.join(outDir, 'metal-click.wav'), synthMetalClick());
writeWav(path.join(outDir, 'metal-bluff.wav'), synthBluffClick());
console.log('Generated:', fs.readdirSync(outDir).join(', '));

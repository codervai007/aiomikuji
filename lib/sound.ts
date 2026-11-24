"use client";
// Small synthesized sound effects (no audio files needed).

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

/** Call from a tap handler: browsers only allow audio after a user gesture. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "triangle", gain = 0.18, toFreq?: number) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function rattle(start: number) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 2200;
  const g = ctx.createGain();
  g.gain.value = 0.5;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(ctx.currentTime + start);
}

export const sfx = {
  tap() {
    if (enabled) tone(880, 0, 0.06, "sine", 0.08);
  },
  shake() {
    if (!enabled) return;
    for (let i = 0; i < 7; i++) rattle(i * 0.11);
  },
  pop() {
    if (enabled) tone(320, 0, 0.18, "sine", 0.25, 1100);
  },
  chime() {
    if (!enabled) return;
    [1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.09, 0.9, "triangle", 0.14));
  },
  fanfare() {
    if (!enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.35, "square", 0.07));
    [1047, 1319, 1568, 2093].forEach((f) => tone(f, 0.5, 1.4, "triangle", 0.09));
  },
};

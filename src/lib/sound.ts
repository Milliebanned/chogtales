"use client";

/** Tiny synthesized SFX — no audio files needed. */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
  try {
    localStorage.setItem("cc_sfx", v ? "1" : "0");
  } catch {}
}
export function soundEnabled() {
  try {
    const v = localStorage.getItem("cc_sfx");
    if (v !== null) enabled = v === "1";
  } catch {}
  return enabled;
}

function ac() {
  if (typeof window === "undefined") return null;
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

function noise(c: AudioContext, dur: number) {
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

export function sfx(kind: "pop" | "turn" | "impact" | "feed" | "chime") {
  if (!soundEnabled()) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const g = c.createGain();
  g.connect(c.destination);

  if (kind === "turn") {
    const n = noise(c, 0.35);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(1800, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.3);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    n.connect(f).connect(g);
    n.start(t);
    return;
  }
  if (kind === "impact") {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.35);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.4);
    const n = noise(c, 0.15);
    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.2, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    n.connect(g2).connect(c.destination);
    n.start(t);
    return;
  }
  const o = c.createOscillator();
  o.type = kind === "chime" ? "triangle" : "sine";
  const [a, b, dur] = kind === "pop" ? [520, 880, 0.09] : kind === "feed" ? [660, 990, 0.16] : [880, 1320, 0.5];
  o.frequency.setValueAtTime(a, t);
  o.frequency.exponentialRampToValueAtTime(b, t + dur * 0.6);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  o.start(t);
  o.stop(t + dur);
}

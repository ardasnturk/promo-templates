// Helpers for seamless loops. A loop video is a window of length `loop` onto an
// endless timeline: every item on it repeats every `cycle.total` frames, so the
// frame after the last one is exactly frame 0 again.

export const mod = (a: number, n: number) => ((a % n) + n) % n;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

export const easeIn = (x: number) => {
  const t = clamp01(x);
  return t * t * t;
};

export const easeOut = (x: number) => {
  const t = 1 - clamp01(x);
  return 1 - t * t * t;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Items of different lengths that repeat forever in the same order.
export type Cycle = {
  readonly durations: number[];
  readonly starts: number[];
  readonly total: number;
};

export const makeCycle = (durations: number[]): Cycle => {
  const starts: number[] = [];
  let t = 0;
  for (const d of durations) {
    starts.push(t);
    t += d;
  }
  return {durations, starts, total: t};
};

// Start of item `n` (any integer; item n uses durations[n mod length]).
export const itemStart = (c: Cycle, n: number) => {
  const len = c.durations.length;
  return Math.floor(n / len) * c.total + c.starts[mod(n, len)];
};

// Which item is running at time `g`, and how far into it we are.
export const locate = (c: Cycle, g: number) => {
  const len = c.durations.length;
  const q = Math.floor(g / c.total);
  const r = g - q * c.total;
  let m = len - 1;
  while (c.starts[m] > r) {
    m--;
  }
  return {n: q * len + m, m, local: r - c.starts[m]};
};

export type SoundEvent = {readonly frame: number; readonly src: string; readonly volume: number};

// Places sounds on the loop. A sound that would still be playing at the last
// frame gets a twin that starts before frame 0, so its tail is heard at the
// start of the replay instead of being cut off.
export const loopSounds = (events: SoundEvent[], offset: number, loop: number, soundFrames: number): SoundEvent[] => {
  const out: SoundEvent[] = [];
  for (const e of events) {
    const frame = Math.round(mod(e.frame - offset, loop));
    out.push({...e, frame});
    if (frame + soundFrames > loop) {
      out.push({...e, frame: frame - loop});
    }
  }
  return out.sort((a, b) => a.frame - b.frame);
};

// Mixes a #rrggbb color toward white (amt > 0) or black (amt < 0).
export const shade = (hex: string, amt: number) => {
  const v = parseInt(hex.slice(1), 16);
  const target = amt > 0 ? 255 : 0;
  const a = Math.abs(amt);
  const ch = (shift: number) => Math.round(lerp((v >> shift) & 255, target, a));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

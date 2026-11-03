import {random} from 'remotion';

// Deterministic dendritic snowflake. Only one half-arm (the 0°–30° wedge) is
// simulated; the renderer mirrors it and repeats it six times, giving exact
// 6-fold (dihedral) symmetry. Every branch runs along a hexagonal lattice
// direction (0°, 60°, 120°), so no angles or trig are needed: only
// + − × ÷ and Math.sqrt, so Node, Studio and render agree.

export const R = 460; // final arm length (fills the 920px-wide safe area)
export const GROW = 720; // frames of growth
const SEG = 8; // segment length in px
const HIT = 7; // two branches closer than this stop the newcomer
const CELL = 10;
const MIN_GAP = 18; // px a tip grows before it may fork again
const MAX_DEPTH = 3;
const S3 = Math.sqrt(3);

const DIRS: [number, number][] = [
  [1, 0],
  [0.5, S3 / 2],
  [-0.5, S3 / 2],
];

// Main stem length over time: fast start (arms visible on frame 0), steady later.
const mainLen = (f: number) => {
  const u = (f + 3) / (GROW + 3);
  return R * (0.55 * Math.sqrt(u) + 0.45 * u);
};

// Fork waves: start every 2.4 s and speed up to roughly one per second.
export const waveFrames = (): number[] => {
  const out: number[] = [];
  let f = 20;
  let k = 0;
  while (f < GROW - 20) {
    out.push(f);
    f += Math.max(30, 72 - 4 * k);
    k++;
  }
  return out;
};

export type Simulation = {
  // per segment, interleaved: x1, y1, x2, y2, t0, t1, depth, radius
  seg: Float32Array;
  count: number;
  waves: number[];
  halfFrame: number; // main stem reaches R/2
};

type Tip = {
  id: number;
  parent: number;
  x: number;
  y: number;
  dir: number;
  depth: number;
  speedK: number;
  len: number;
  maxLen: number;
  sinceFork: number;
  sx: number;
  sy: number;
  st: number;
  acc: number;
  alive: boolean;
};

export const simulate = (seed: string): Simulation => {
  const segs: number[] = [];
  const grid = new Map<number, number[]>(); // cell → [x, y, branchId, ...]
  const parentOf: number[] = [];
  const key = (cx: number, cy: number) => cx * 4096 + cy + 2048;
  let rc = 0;
  const rnd = () => random(`${seed}-${rc++}`);

  const tips: Tip[] = [];
  const spawn = (parent: number, x: number, y: number, dir: number, depth: number, f: number, maxLen: number) => {
    const id = tips.length;
    parentOf.push(parent);
    tips.push({
      id,
      parent,
      x,
      y,
      dir,
      depth,
      speedK: depth === 0 ? 1 : (1.05 - depth * 0.1) * (0.85 + rnd() * 0.3),
      len: 0,
      maxLen,
      sinceFork: 0,
      sx: x,
      sy: y,
      st: f,
      acc: 0,
      alive: true,
    });
  };

  const blocked = (t: Tip, x: number, y: number) => {
    if (x * x + y * y > R * R) return true;
    if (y * S3 > x - 4) return t.depth > 0; // wedge edge: meets the mirrored neighbour arm
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const pts = grid.get(key(cx + dx, cy + dy));
        if (!pts) continue;
        for (let i = 0; i < pts.length; i += 3) {
          const b = pts[i + 2];
          if (b === t.id || b === t.parent || parentOf[b] === t.id) continue;
          const ex = pts[i] - x;
          const ey = pts[i + 1] - y;
          if (ex * ex + ey * ey < HIT * HIT) return true;
        }
      }
    }
    return false;
  };

  const addPoint = (x: number, y: number, id: number) => {
    const k = key(Math.floor(x / CELL), Math.floor(y / CELL));
    const arr = grid.get(k);
    if (arr) arr.push(x, y, id);
    else grid.set(k, [x, y, id]);
  };

  const waves = waveFrames();
  const waveSet = new Set(waves);
  let halfFrame = GROW;
  const F0 = -3;
  spawn(-1, 0, 0, 0, 0, F0, R);

  for (let f = F0; f < GROW; f++) {
    const v = mainLen(f + 1) - mainLen(f);
    for (const t of tips) {
      if (!t.alive) continue;
      const dist = v * t.speedK;
      let remaining = dist;
      const [ux, uy] = DIRS[t.dir];
      while (remaining > 1e-9) {
        const step = Math.min(SEG - t.acc, remaining);
        const nx = t.x + ux * step;
        const ny = t.y + uy * step;
        remaining -= step;
        t.acc += step;
        if (t.acc >= SEG - 1e-6) {
          if (blocked(t, nx, ny) || t.len + SEG > t.maxLen) {
            t.alive = false;
            break;
          }
          const t1 = f + 1 - remaining / dist;
          segs.push(t.sx, t.sy, nx, ny, t.st, t1, t.depth, Math.sqrt(nx * nx + ny * ny));
          addPoint(nx, ny, t.id);
          t.len += SEG;
          t.sinceFork += SEG;
          t.sx = nx;
          t.sy = ny;
          t.st = t1;
          t.acc = 0;
        }
        t.x = nx;
        t.y = ny;
      }
      if (t.depth === 0 && t.x >= R / 2 && halfFrame === GROW) halfFrame = f;
    }

    if (waveSet.has(f)) {
      const n = tips.length;
      for (let i = 0; i < n; i++) {
        const t = tips[i];
        if (!t.alive || t.depth >= MAX_DEPTH || t.sinceFork < MIN_GAP) continue;
        const p = t.depth === 0 ? 1 : t.depth === 1 ? 0.85 : 0.6;
        if (rnd() > p) continue;
        let dir = 1;
        if (t.dir === 1) dir = rnd() < 0.78 ? 0 : 2;
        const r = Math.sqrt(t.x * t.x + t.y * t.y);
        const maxLen =
          t.depth === 0 ? (R - r) * (0.35 + rnd() * 0.45) : t.depth === 1 ? 30 + rnd() * 110 : 14 + rnd() * 40;
        // Start the child from the last emitted point so it is attached to drawn stem.
        spawn(t.id, t.sx, t.sy, dir, t.depth + 1, t.st, maxLen);
        t.sinceFork = 0;
      }
    }
  }

  return {seg: Float32Array.from(segs), count: segs.length / 8, waves, halfFrame};
};

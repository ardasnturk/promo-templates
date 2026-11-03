import {random} from 'remotion';

// Deterministic "color territory war": the grid starts split into equal
// territories, one per color, with a ball of that color bouncing inside each.
// A ball passes through cells of its own color; touching a rival cell paints
// it and bounces the ball back. A ball whose center ends up on a rival cell is
// captured. Every REINFORCE frames each surviving color gets one more ball and
// all balls speed up a little, so a stalemate cannot last. Only + − × ÷ and
// Math.sqrt are used so Node, Studio and render agree.
// Coordinates are in cell units: (0,0) is the top-left corner of the grid.

export const BALL_R = 0.3;
const SUBSTEPS = 6;
const SPEED_START = 0.7; // cells per frame
const SPEED_GROWTH = 1.05; // speed multiplier per reinforcement wave
export const REINFORCE = 4 * 30; // frames between reinforcement waves
const MAX_BALLS_PER_COLOR = 20;
const CRUMBLE = 1; // frames between crumbling cells of a ball-less color
const RECOUNT = 30; // frames between ball-count adjustments
const BUDGET_START = 1; // balls per color at the start
const BUDGET_STEP = 3; // extra balls in the shared budget per wave
const JITTER = 0.18; // random nudge to the direction on every paint
const MIN_AXIS = 0.3; // keep directions away from pure horizontal/vertical

export type SimOptions = {
  seed: string;
  colorCount: number;
  gridSize: number;
  maxFrames: number;
};

export type Ball = {x: number; y: number; vx: number; vy: number; c: number; id: number};
export type Capture = {frame: number; x: number; y: number; c: number};
export type Spawn = {frame: number; x: number; y: number; c: number};
export type Elimination = {frame: number; c: number; cell: number};

export type Simulation = {
  frames: number; // simulated frames (winFrame + 1 when finished)
  winFrame: number | null;
  winner: number | null;
  grids: Uint8Array[]; // per frame: color index of every cell
  counts: Uint16Array[]; // per frame: cells per color
  balls: Float32Array[]; // per frame: interleaved x, y, color, id
  paints: number[]; // frames with at least one paint
  captures: Capture[];
  spawns: Spawn[];
  eliminations: Elimination[];
  leadChanges: number[];
};

// Territory layout: 2 colors split left/right, 3–4 use quadrants (3 merges the
// bottom row), 5–6 use vertical strips.
const initialOwner = (cx: number, cy: number, n: number, k: number): number => {
  if (k === 2) {
    return cx < n / 2 ? 0 : 1;
  }
  if (k <= 4) {
    const right = cx >= n / 2 ? 1 : 0;
    const bottom = cy >= n / 2 ? 1 : 0;
    if (k === 3 && bottom) {
      return 2;
    }
    return bottom * 2 + right;
  }
  return Math.floor((cx * k) / n);
};

const unitDir = (seed: string) => {
  for (let tries = 0; ; tries++) {
    const dx = random(`${seed}-dx-${tries}`) - 0.5;
    const dy = random(`${seed}-dy-${tries}`) - 0.5;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.05) {
      continue;
    }
    const ux = dx / len;
    const uy = dy / len;
    if ((ux < 0 ? -ux : ux) > MIN_AXIS && (uy < 0 ? -uy : uy) > MIN_AXIS) {
      return {ux, uy};
    }
  }
};

export const simulate = ({seed, colorCount, gridSize, maxFrames}: SimOptions): Simulation => {
  const n = gridSize;
  const k = colorCount;
  const grid = new Uint8Array(n * n);
  for (let cy = 0; cy < n; cy++) {
    for (let cx = 0; cx < n; cx++) {
      grid[cy * n + cx] = initialOwner(cx, cy, n, k);
    }
  }
  const count = new Uint16Array(k);
  for (let i = 0; i < n * n; i++) {
    count[grid[i]]++;
  }

  let speed = SPEED_START;
  let nextId = 0;
  let balls: Ball[] = [];

  // A random own cell, preferring ones whose neighbours are all own too.
  const pickCell = (c: number, tag: string): number | null => {
    const safe: number[] = [];
    const any: number[] = [];
    for (let cy = 0; cy < n; cy++) {
      for (let cx = 0; cx < n; cx++) {
        const i = cy * n + cx;
        if (grid[i] !== c) {
          continue;
        }
        any.push(i);
        let ok = true;
        for (let oy = -1; oy <= 1 && ok; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const nx = cx + ox;
            const ny = cy + oy;
            if (nx < 0 || ny < 0 || nx >= n || ny >= n || grid[ny * n + nx] !== c) {
              ok = false;
              break;
            }
          }
        }
        if (ok) {
          safe.push(i);
        }
      }
    }
    const pool = safe.length ? safe : any;
    if (!pool.length) {
      return null;
    }
    return pool[Math.floor(random(`${seed}-cell-${tag}`) * pool.length)];
  };

  const addBall = (c: number, cell: number, tag: string) => {
    const {ux, uy} = unitDir(`${seed}-ball-${tag}`);
    const b: Ball = {
      x: (cell % n) + 0.5,
      y: Math.floor(cell / n) + 0.5,
      vx: ux * speed,
      vy: uy * speed,
      c,
      id: nextId++,
    };
    balls.push(b);
    return b;
  };

  // One ball per color, in the middle of its territory.
  for (let c = 0; c < k; c++) {
    let sx = 0;
    let sy = 0;
    let m = 0;
    for (let i = 0; i < n * n; i++) {
      if (grid[i] === c) {
        sx += i % n;
        sy += Math.floor(i / n);
        m++;
      }
    }
    const cx = Math.floor(sx / m);
    const cy = Math.floor(sy / m);
    addBall(c, cy * n + cx, `start-${c}`);
  }

  const grids: Uint8Array[] = [];
  const counts: Uint16Array[] = [];
  const ballFrames: Float32Array[] = [];
  const paints: number[] = [];
  const captures: Capture[] = [];
  const spawns: Spawn[] = [];
  const eliminations: Elimination[] = [];
  const leadChanges: number[] = [];
  let leader = -1;
  let paintCounter = 0;
  let winFrame: number | null = null;
  let winner: number | null = null;

  const record = () => {
    grids.push(grid.slice());
    counts.push(count.slice());
    const arr = new Float32Array(balls.length * 4);
    balls.forEach((b, i) => {
      arr[i * 4] = b.x;
      arr[i * 4 + 1] = b.y;
      arr[i * 4 + 2] = b.c;
      arr[i * 4 + 3] = b.id;
    });
    ballFrames.push(arr);
  };

  const paint = (cell: number, c: number, f: number) => {
    const old = grid[cell];
    grid[cell] = c;
    count[old]--;
    count[c]++;
    paintCounter++;
    if (count[old] === 0) {
      eliminations.push({frame: f, c: old, cell});
    }
  };

  // Steer slightly after a bounce so orbits never become periodic.
  const nudge = (b: Ball) => {
    const j = (random(`${seed}-j-${paintCounter}`) - 0.5) * JITTER;
    let ux = b.vx / speed - b.vy / speed * j;
    let uy = b.vy / speed + b.vx / speed * j;
    let len = Math.sqrt(ux * ux + uy * uy);
    ux /= len;
    uy /= len;
    if ((ux < 0 ? -ux : ux) < MIN_AXIS) {
      ux = ux < 0 ? -MIN_AXIS : MIN_AXIS;
      uy = (uy < 0 ? -1 : 1) * Math.sqrt(1 - MIN_AXIS * MIN_AXIS);
    } else if ((uy < 0 ? -uy : uy) < MIN_AXIS) {
      uy = uy < 0 ? -MIN_AXIS : MIN_AXIS;
      ux = (ux < 0 ? -1 : 1) * Math.sqrt(1 - MIN_AXIS * MIN_AXIS);
    }
    len = Math.sqrt(ux * ux + uy * uy);
    b.vx = (ux / len) * speed;
    b.vy = (uy / len) * speed;
  };

  for (let f = 0; f < maxFrames; f++) {
    // Reinforcements: every REINFORCE frames all balls speed up and the ball
    // budget grows; every RECOUNT frames each color's ball count moves one
    // step towards its share of the budget, so territory buys balls.
    if (f > 0 && f % REINFORCE === 0) {
      speed *= SPEED_GROWTH;
      for (const b of balls) {
        b.vx *= SPEED_GROWTH;
        b.vy *= SPEED_GROWTH;
      }
    }
    if (f > 0 && f % RECOUNT === 0) {
      const budget = k * BUDGET_START + Math.floor(f / REINFORCE) * BUDGET_STEP;
      // Weighted by the cube of territory: a bigger empire gets more than
      // its fair share, which slowly breaks every balance.
      const w = Array.from(count, (m) => m * m * m);
      const sum = w.reduce((a, b) => a + b, 0);
      for (let c = 0; c < k; c++) {
        const want = Math.min(MAX_BALLS_PER_COLOR, Math.floor((w[c] * budget) / sum + 0.5));
        const mine = balls.filter((b) => b.c === c);
        if (mine.length < want) {
          const cell = pickCell(c, `${f}-${c}`);
          if (cell !== null) {
            const b = addBall(c, cell, `r${f}-${c}`);
            spawns.push({frame: f, x: b.x, y: b.y, c});
          }
        } else if (mine.length > want) {
          const out = mine[mine.length - 1];
          balls = balls.filter((b) => b !== out);
          captures.push({frame: f, x: out.x, y: out.y, c});
        }
      }
    }

    const paintedBefore = paintCounter;

    // A color with no balls left crumbles: every CRUMBLE frames a rival
    // neighbour takes one of its border cells.
    if (f % CRUMBLE === 0) {
      for (let c = 0; c < k; c++) {
        if (count[c] === 0 || balls.some((b) => b.c === c)) {
          continue;
        }
        const border: number[] = [];
        const taker: number[] = [];
        for (let i = 0; i < n * n; i++) {
          if (grid[i] !== c) {
            continue;
          }
          const cx = i % n;
          const cy = Math.floor(i / n);
          const nb = [cx > 0 ? i - 1 : -1, cx < n - 1 ? i + 1 : -1, cy > 0 ? i - n : -1, cy < n - 1 ? i + n : -1];
          for (const j of nb) {
            if (j >= 0 && grid[j] !== c) {
              border.push(i);
              taker.push(grid[j]);
              break;
            }
          }
        }
        if (border.length) {
          const pick = Math.floor(random(`${seed}-crumble-${f}-${c}`) * border.length);
          paint(border[pick], taker[pick], f);
        }
      }
    }
    for (let s = 0; s < SUBSTEPS; s++) {
      for (const b of balls) {
        // Horizontal move.
        const nx = b.x + b.vx / SUBSTEPS;
        const px = nx + (b.vx > 0 ? BALL_R : -BALL_R);
        const cy = Math.floor(b.y);
        if (px < 0 || px >= n) {
          b.vx = -b.vx;
        } else {
          const cell = cy * n + Math.floor(px);
          if (grid[cell] !== b.c) {
            paint(cell, b.c, f);
            b.vx = -b.vx;
            nudge(b);
          } else {
            b.x = nx;
          }
        }
        // Vertical move.
        const ny = b.y + b.vy / SUBSTEPS;
        const py = ny + (b.vy > 0 ? BALL_R : -BALL_R);
        const cx = Math.floor(b.x);
        if (py < 0 || py >= n) {
          b.vy = -b.vy;
        } else {
          const cell = Math.floor(py) * n + cx;
          if (grid[cell] !== b.c) {
            paint(cell, b.c, f);
            b.vy = -b.vy;
            nudge(b);
          } else {
            b.y = ny;
          }
        }
      }
      // Captures: a ball standing on a rival cell is out.
      balls = balls.filter((b) => {
        const cell = Math.floor(b.y) * n + Math.floor(b.x);
        if (grid[cell] !== b.c) {
          captures.push({frame: f, x: b.x, y: b.y, c: b.c});
          return false;
        }
        return true;
      });
    }
    if (paintCounter > paintedBefore) {
      paints.push(f);
    }

    // Lead tracking: the leader changes only when a rival strictly passes it.
    let best = 0;
    for (let c = 1; c < k; c++) {
      if (count[c] > count[best]) {
        best = c;
      }
    }
    let tie = false;
    for (let c = 0; c < k; c++) {
      if (c !== best && count[c] === count[best]) {
        tie = true;
      }
    }
    if (!tie && best !== leader && (leader < 0 || count[best] > count[leader])) {
      if (leader >= 0) {
        leadChanges.push(f);
      }
      leader = best;
    }

    record();

    if (count[best] === n * n) {
      winFrame = f;
      winner = best;
      break;
    }
  }

  return {
    frames: grids.length,
    winFrame,
    winner,
    grids,
    counts,
    balls: ballFrames,
    paints,
    captures,
    spawns,
    eliminations,
    leadChanges,
  };
};

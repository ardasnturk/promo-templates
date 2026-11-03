import {random} from 'remotion';

// Deterministic "fill the pine tree": balls are shot from a spawner rail at
// the top of the screen through the opening at the tree's tip and pile up
// inside a stepped outline. The rail grows from 1 to 2 to 4 outlets and the
// flow speeds up. Only + − × ÷ and Math.sqrt are used so Node, Studio and
// render agree.

export const W = 1080;
export const H = 1920;
export const BALL_R = 14;
export const CX = W / 2;

// Right half of the outline, from the right lip of the opening at the tip
// down to the bottom of the trunk. The left half is mirrored.
const RIGHT: [number, number][] = [
  [598, 420],
  [720, 640],
  [650, 640],
  [822, 900],
  [722, 900],
  [902, 1190],
  [792, 1190],
  [972, 1500],
  [612, 1500],
  [612, 1720],
];
export const TIP_Y = RIGHT[0][1];
export const BASE_Y = RIGHT[RIGHT.length - 1][1];
export const TRUNK_TOP = 1500;
// Bottom edge of each tier (garland swags hang just above these).
export const TIERS: {top: number; bottom: number; half: number}[] = [
  {top: 420, bottom: 640, half: 180},
  {top: 640, bottom: 900, half: 282},
  {top: 900, bottom: 1190, half: 362},
  {top: 1190, bottom: 1500, half: 432},
];

// Closed outline (clockwise from the right lip); the last edge, left lip →
// right lip, is the opening and has no wall.
export const OUTLINE: [number, number][] = [
  ...RIGHT,
  ...RIGHT.map(([x, y]) => [W - x, y] as [number, number]).reverse(),
];
// nx, ny: unit normal pointing into the tree.
type Seg = {ax: number; ay: number; bx: number; by: number; nx: number; ny: number};
const WALLS: Seg[] = [];

export const RAIL_Y = 150;
// Outlet positions per phase; every phase starts at a fixed frame.
export const PHASES: {from: number; outlets: number[]}[] = [
  {from: 0, outlets: [CX]},
  {from: 7 * 30, outlets: [CX - 100, CX + 100]},
  {from: 16 * 30, outlets: [CX - 230, CX - 80, CX + 80, CX + 230]},
];

// Balls per second (all outlets together) at video frame f.
const flowRate = (f: number) => {
  if (f < PHASES[1].from) {
    return 20;
  }
  if (f < PHASES[2].from) {
    return 17.5 + ((f - PHASES[1].from) / (PHASES[2].from - PHASES[1].from)) * 3.5;
  }
  const t = (f - PHASES[2].from) / 30;
  return 21 + t * 1.8;
};

export const phaseAt = (f: number) => {
  let p = 0;
  for (let i = 0; i < PHASES.length; i++) {
    if (f >= PHASES[i].from) {
      p = i;
    }
  }
  return p;
};

// Each outlet aims at a point inside the opening (crossing over the center).
export const aimX = (x0: number) => CX - (x0 - CX) * 0.12;

const SUBSTEPS = 6;
const GRAVITY_FRAME = 0.7;
const GRAVITY = GRAVITY_FRAME / (SUBSTEPS * SUBSTEPS);
const WALL_BOUNCE = 0.2;
const BALL_DAMP = 0.62;
const AIR = 0.9995;
const WALL_GAP = BALL_R + 2; // the outline has a 4px stroke
const CELL = BALL_R * 2;
const FREEZE_SPEED = 0.8; // px per frame
const FREEZE_FRAMES = 6;
const FREEZE_OVERLAP = 12; // px
const ITERATIONS = 3;
// The tree counts as full once the frozen pile reaches this far below the
// tip; the balls already inside the tree fill the rest.
const FULL_DEPTH = 70;
const FULL_SPEED = 3; // px per frame; the top is never still while it is being hit
// Simulation starts this many frames before frame 0, so balls are already
// in the air on the first frame and the first ones land within a second.
export const PREROLL = 44;

export type Simulation = {
  totalFrames: number;
  fullFrame: number; // video frame at which the tree is full
  pos: Float32Array[]; // per video frame, interleaved x,y (NaN = not spawned / gone)
  emitFrames: number[]; // video frame each ball leaves its outlet (may be < 0)
  kept: Uint8Array; // 1 = ball ends inside the outline
  finalX: Float32Array;
  finalY: Float32Array;
  seals: {frame: number; top: number; bottom: number}[];
  fillPerSecond: number[]; // kept balls inside the outline, per second
};

export const insideOutline = (px: number, py: number) => {
  let inside = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

for (let i = 0; i < OUTLINE.length - 1; i++) {
  const [ax, ay] = OUTLINE[i];
  const [bx, by] = OUTLINE[i + 1];
  const len = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
  let nx = -(by - ay) / len;
  let ny = (bx - ax) / len;
  if (!insideOutline((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3)) {
    nx = -nx;
    ny = -ny;
  }
  WALLS.push({ax, ay, bx, by, nx, ny});
}

type RunResult = {
  fullFrame: number;
  entered: Int32Array;
  emitFrames: number[];
  pos: Float32Array[];
};

const run = (seed: string, maxFrames: number, maxBalls: number, recordUntil: number): RunResult => {
  const cap = 2000;
  const x = new Float64Array(cap);
  const y = new Float64Array(cap);
  const vx = new Float64Array(cap);
  const vy = new Float64Array(cap);
  const alive = new Uint8Array(cap);
  const entered = new Int32Array(cap).fill(-1);
  // A ball that stays nearly still inside the tree for a few frames freezes
  // and becomes part of the rigid pile, so the stack cannot compress.
  const frozen = new Uint8Array(cap);
  const still = new Int32Array(cap);
  const pen = new Float64Array(cap); // deepest overlap in the frame's last pass
  const emitFrames: number[] = [];
  const pos: Float32Array[] = [];

  const gridW = Math.ceil(W / CELL) + 2;
  const gridH = Math.ceil(H / CELL) + 2;
  const head = new Int32Array(gridW * gridH);
  const next = new Int32Array(cap);

  // Balls that have entered the tree are held inside by one-sided walls
  // (a squeezed ball is always pushed back in); balls still outside see
  // two-sided walls with round ends.
  const collideWalls = (i: number, inside: boolean) => {
    for (const s of WALLS) {
      const ex = s.bx - s.ax;
      const ey = s.by - s.ay;
      const u = ((x[i] - s.ax) * ex + (y[i] - s.ay) * ey) / (ex * ex + ey * ey);
      let nx: number;
      let ny: number;
      let qx: number;
      let qy: number;
      if (inside && u >= 0 && u <= 1) {
        const sd = (x[i] - s.ax) * s.nx + (y[i] - s.ay) * s.ny;
        if (sd >= WALL_GAP || sd < -WALL_GAP * 3) {
          continue;
        }
        nx = s.nx;
        ny = s.ny;
        qx = s.ax + ex * u;
        qy = s.ay + ey * u;
      } else {
        const uc = u < 0 ? 0 : u > 1 ? 1 : u;
        qx = s.ax + ex * uc;
        qy = s.ay + ey * uc;
        const dx = x[i] - qx;
        const dy = y[i] - qy;
        const d2 = dx * dx + dy * dy;
        if (d2 >= WALL_GAP * WALL_GAP || d2 < 1e-9) {
          continue;
        }
        const d = Math.sqrt(d2);
        nx = dx / d;
        ny = dy / d;
      }
      x[i] = qx + nx * WALL_GAP;
      y[i] = qy + ny * WALL_GAP;
      const vn = vx[i] * nx + vy[i] * ny;
      if (vn < 0) {
        vx[i] -= (1 + WALL_BOUNCE) * vn * nx;
        vy[i] -= (1 + WALL_BOUNCE) * vn * ny;
      }
    }
  };

  let n = 0;
  let acc = 0;
  let outletTurn = 0;
  let fullFrame = -1;
  let fullStreak = 0;

  for (let sf = 0; sf < maxFrames + PREROLL; sf++) {
    const f = sf - PREROLL; // video frame

    // Emission.
    if (fullFrame < 0 && n < maxBalls) {
      acc += flowRate(Math.max(0, f)) / 30;
      const outlets = PHASES[phaseAt(Math.max(0, f))].outlets;
      while (acc >= 1 && n < maxBalls && n < cap) {
        acc -= 1;
        const x0 = outlets[outletTurn % outlets.length];
        outletTurn++;
        const k = n++;
        const r1 = random(`${seed}-x-${k}`);
        const r2 = random(`${seed}-v-${k}`);
        x[k] = x0 + (r1 - 0.5) * 6;
        y[k] = RAIL_Y + 34;
        const vy0 = 2;
        // Time (frames) to fall from the nozzle to the tip: vy0·t + g·t²/2 = dy.
        const dy = TIP_Y - y[k];
        const t = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * GRAVITY_FRAME * dy)) / GRAVITY_FRAME;
        vx[k] = (aimX(x0) + (r2 - 0.5) * 30 - x[k]) / t / SUBSTEPS;
        vy[k] = vy0 / SUBSTEPS;
        alive[k] = 1;
        emitFrames.push(f);
      }
    }

    for (let sub = 0; sub < SUBSTEPS; sub++) {
      for (let i = 0; i < n; i++) {
        if (!alive[i] || frozen[i]) {
          continue;
        }
        vy[i] += GRAVITY;
        vx[i] *= AIR;
        vy[i] *= AIR;
        x[i] += vx[i];
        y[i] += vy[i];
      }

      for (let iter = 0; iter < ITERATIONS; iter++) {
        const lastPass = sub === SUBSTEPS - 1 && iter === ITERATIONS - 1;
        if (lastPass) {
          pen.fill(0);
        }
        head.fill(-1);
        for (let i = 0; i < n; i++) {
          if (!alive[i]) {
            continue;
          }
          const gx = Math.floor(x[i] / CELL) + 1;
          const gy = Math.floor(y[i] / CELL) + 1;
          if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) {
            continue;
          }
          const k = gy * gridW + gx;
          next[i] = head[k];
          head[k] = i;
        }
        for (let i = 0; i < n; i++) {
          if (!alive[i]) {
            continue;
          }
          const gx = Math.floor(x[i] / CELL) + 1;
          const gy = Math.floor(y[i] / CELL) + 1;
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              const cx = gx + ox;
              const cy = gy + oy;
              if (cx < 0 || cy < 0 || cx >= gridW || cy >= gridH) {
                continue;
              }
              let j = head[cy * gridW + cx];
              while (j !== -1) {
                // Balls still in the air pass through each other, so the
                // stream stays tight and nothing scatters off the tip.
                if (j > i && !(frozen[i] && frozen[j]) && (entered[i] >= 0 || entered[j] >= 0)) {
                  const dx = x[j] - x[i];
                  const dy = y[j] - y[i];
                  const d2 = dx * dx + dy * dy;
                  const min = BALL_R * 2;
                  if (d2 < min * min && d2 > 1e-9) {
                    const d = Math.sqrt(d2);
                    const nx = dx / d;
                    const ny = dy / d;
                    // A frozen ball does not move; the other one takes the whole push.
                    const wi = frozen[i] ? 0 : frozen[j] ? 1 : 0.5;
                    const wj = 1 - wi;
                    if (lastPass) {
                      pen[i] = Math.max(pen[i], min - d);
                      pen[j] = Math.max(pen[j], min - d);
                    }
                    x[i] -= nx * (min - d) * wi;
                    y[i] -= ny * (min - d) * wi;
                    x[j] += nx * (min - d) * wj;
                    y[j] += ny * (min - d) * wj;
                    const rel = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
                    if (rel < 0) {
                      const imp = rel * BALL_DAMP * 2;
                      vx[i] += nx * imp * wi;
                      vy[i] += ny * imp * wi;
                      vx[j] -= nx * imp * wj;
                      vy[j] -= ny * imp * wj;
                    }
                  }
                }
                j = next[j];
              }
            }
          }
        }

        // Outline walls: inside each iteration so the pile cannot squeeze
        // balls through them.
        for (let i = 0; i < n; i++) {
          if (alive[i] && !frozen[i]) {
            collideWalls(i, entered[i] >= 0 && y[i] > TIP_Y);
          }
        }
      }
      for (let i = 0; i < n; i++) {
        if (y[i] > H + 100 || x[i] < -100 || x[i] > W + 100) {
          alive[i] = 0;
        }
      }
    }

    // Bookkeeping.
    let topSettled = 0;
    for (let i = 0; i < n; i++) {
      if (!alive[i]) {
        continue;
      }
      if (entered[i] < 0 && y[i] > TIP_Y + BALL_R) {
        entered[i] = f;
      }
      const sp2 = (vx[i] * vx[i] + vy[i] * vy[i]) * SUBSTEPS * SUBSTEPS;
      if (!frozen[i]) {
        still[i] = entered[i] >= 0 && sp2 < FREEZE_SPEED * FREEZE_SPEED && pen[i] < FREEZE_OVERLAP ? still[i] + 1 : 0;
        if (still[i] >= FREEZE_FRAMES) {
          frozen[i] = 1;
          vx[i] = 0;
          vy[i] = 0;
        }
      }
      if (entered[i] >= 0 && y[i] > TIP_Y && y[i] < TIP_Y + FULL_DEPTH && sp2 < FULL_SPEED * FULL_SPEED) {
        topSettled++;
      }
    }
    if (fullFrame < 0 && f >= 0) {
      fullStreak = topSettled >= 2 ? fullStreak + 1 : 0;
      if (fullStreak >= 2) {
        fullFrame = f;
      }
    }

    if (f >= 0 && f < recordUntil) {
      const p = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        p[i * 2] = alive[i] ? x[i] : NaN;
        p[i * 2 + 1] = alive[i] ? y[i] : NaN;
      }
      pos.push(p);
    }
    if (recordUntil === 0 && fullFrame >= 0) {
      break;
    }
  }
  return {fullFrame, entered, emitFrames, pos};
};

export const SEAL_ROWS = 16;
// Frames after the tree is full: settle, star drop, light wave, hold.
export const STAR_RELEASE = 18;
export const STAR_FALL = 20;
export const TAIL = 180;

export const simulate = (seed: string, maxFrames = 50 * 30): Simulation => {
  // Pass 1: pour until the pile reaches the tip.
  const first = run(seed, maxFrames, 100000, 0);
  const fullFrame = first.fullFrame < 0 ? maxFrames - TAIL : first.fullFrame;
  // Pass 2: identical up to fullFrame, but only the balls that had already
  // entered the tree are emitted, so nothing is left in the air.
  let maxBalls = 0;
  for (let i = 0; i < first.emitFrames.length; i++) {
    if (first.entered[i] >= 0 && first.entered[i] <= fullFrame) {
      maxBalls = i + 1;
    }
  }
  const totalFrames = fullFrame + TAIL;
  const second = run(seed, totalFrames, maxBalls, totalFrames);
  const pos = second.pos;
  const n = maxBalls;
  const last = pos[pos.length - 1];
  const finalX = new Float32Array(n);
  const finalY = new Float32Array(n);
  const kept = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    finalX[i] = last[i * 2];
    finalY[i] = last[i * 2 + 1];
    kept[i] = Number.isNaN(finalX[i]) ? 0 : insideOutline(finalX[i], finalY[i]) && finalY[i] > TIP_Y ? 1 : 0;
  }
  // A few balls get wedged on top of each other in sharp corners; the later
  // one of such a pair is trimmed with the excess.
  const minGap = BALL_R * 1.3;
  for (let i = 0; i < n; i++) {
    if (!kept[i]) {
      continue;
    }
    for (let j = 0; j < i; j++) {
      const dx = finalX[i] - finalX[j];
      const dy = finalY[i] - finalY[j];
      if (kept[j] && dx * dx + dy * dy < minGap * minGap) {
        kept[i] = 0;
        break;
      }
    }
  }

  // Rows hold the same number of balls (narrow rows near the tip are taller),
  // so seals come at an even pace that speeds up with the flow. A row is
  // sealed when ≥95% of its final balls sit in it, nearly still.
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    if (kept[i]) {
      ys.push(finalY[i]);
    }
  }
  ys.sort((a, b) => b - a);
  const edges = [BASE_Y];
  for (let r = 1; r < SEAL_ROWS; r++) {
    const k = Math.floor((r * ys.length) / SEAL_ROWS);
    edges.push((ys[k - 1] + ys[k]) / 2);
  }
  edges.push(TIP_Y);
  const finalCount = new Array(SEAL_ROWS).fill(0);
  for (const fy of ys) {
    for (let r = 0; r < SEAL_ROWS; r++) {
      if (fy <= edges[r] && fy > edges[r + 1]) {
        finalCount[r]++;
      }
    }
  }
  const seals: Simulation['seals'] = [];
  let row = 0;
  for (let f = 1; f < pos.length && row < SEAL_ROWS; f++) {
    const p = pos[f];
    const q = pos[f - 1];
    const bottom = edges[row];
    const top = edges[row + 1];
    let c = 0;
    for (let i = 0; i * 2 < p.length; i++) {
      const py = p[i * 2 + 1];
      if (py > top && py <= bottom && i * 2 < q.length) {
        const dx = p[i * 2] - q[i * 2];
        const dy = py - q[i * 2 + 1];
        if (dx * dx + dy * dy < 1.5) {
          c++;
        }
      }
    }
    const prev = seals[seals.length - 1];
    if (c >= finalCount[row] * 0.95 && (!prev || f - prev.frame >= 10)) {
      seals.push({frame: f, top, bottom});
      row++;
    } else if (f === fullFrame + STAR_RELEASE - 3) {
      // The last balls are still rocking: seal what is left in one go, just
      // before the star drops.
      seals.push({frame: f, top: TIP_Y, bottom});
      row = SEAL_ROWS;
    }
  }

  const keptTotal = kept.reduce((a, b) => a + b, 0);
  const fillPerSecond: number[] = [];
  for (let f = 0; f < pos.length; f += 30) {
    const p = pos[f];
    let c = 0;
    for (let i = 0; i * 2 < p.length; i++) {
      if (kept[i] && p[i * 2 + 1] > TIP_Y && insideOutline(p[i * 2], p[i * 2 + 1])) {
        c++;
      }
    }
    fillPerSecond.push(c / keptTotal);
  }

  return {
    totalFrames,
    fullFrame,
    pos,
    emitFrames: second.emitFrames,
    kept,
    finalX,
    finalY,
    seals,
    fillPerSecond,
  };
};

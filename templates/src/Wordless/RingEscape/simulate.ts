import {random} from 'remotion';

// Deterministic "escape the rings" elimination: balls bounce inside a stack of
// concentric rotating rings, each with one gap. Crossing an inner ring shatters
// it; slipping out through the outermost ring eliminates the ball. The last
// ball inside wins. Only + − × ÷ and Math.sqrt are used (sine and cosine are
// polynomials) so Node, Studio and render agree.

export const CX = 540;
export const CY = 960;
export const BALL_R = 20;
export const RING_W = 8;
export const RING_R = [125, 190, 255, 320, 385, 450];
export const OUTER_MIN_R = 300;
export const RING_COUNT = RING_R.length;

// Base gap half-angles (radians), inner → outer.
const GAP_HALF = [0.62, 0.3, 0.26, 0.22, 0.2, 0.5];
const GAP_NARROW = 0.3; // share of each gap that closes over the video
const GAP_MIN_PX = BALL_R * 1.3; // a gap never gets narrower than this half-chord
// Pacing: right after an event the gap pinches shut, then slowly opens again
// until the next ball gets through, so an event lands every 2–3 seconds.
const PINCH = 0.6;
const OPEN_MAX = 4;
const OPEN_DELAY = 15; // frames of pinch after an event
const OPEN_FRAMES = 160; // frames from pinched to fully open
const HALF_MAX = 1.1;

const SUBSTEPS = 3;
const SPEED_START = 9;
const SPEED_END = 15;
const SPEED_RAMP = 32 * 30; // frames until full speed
const OUTER_SHRINK = 0.09; // px per frame once the outer ring is the only one left

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;

// Polynomial sine (Taylor to degree 11 after range reduction, error < 1e-7).
export const sinP = (a: number): number => {
  let x = a - TAU * Math.floor((a + Math.PI) / TAU);
  if (x > HALF_PI) {
    x = Math.PI - x;
  } else if (x < -HALF_PI) {
    x = -Math.PI - x;
  }
  const x2 = x * x;
  return x * (1 - (x2 / 6) * (1 - (x2 / 20) * (1 - (x2 / 42) * (1 - (x2 / 72) * (1 - x2 / 110)))));
};
export const cosP = (a: number) => sinP(a + HALF_PI);

export type SimOptions = {
  seed: string;
  ballCount: number;
  maxFrames: number;
};

export type RingBreak = {frame: number; ring: number; ball: number};
export type Escape = {frame: number; ball: number; x: number; y: number; vx: number; vy: number};
export type Bounce = {frame: number; ball: number};

export type Simulation = {
  frames: number; // simulated frames (== winFrame + 1 when finished)
  winFrame: number | null;
  winner: number | null;
  // per frame
  pos: Float32Array[]; // interleaved x,y for every ball (frozen after escape)
  alive: Uint8Array[];
  ringAngle: Float32Array[]; // gap center angle per ring
  ringHalf: Float32Array[]; // gap half-angle per ring
  outerR: number[];
  activeRing: number[]; // innermost unbroken ring
  breaks: RingBreak[];
  escapes: Escape[];
  hits: Bounce[]; // ball–ball collisions (for flashes)
  clicks: number[]; // wall bounce frames, thinned
};

export const simulate = ({seed, ballCount, maxFrames}: SimOptions): Simulation => {
  const n = ballCount;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const alive = new Uint8Array(n).fill(1);
  const lastHit = new Int32Array(n * n).fill(-100);

  // Seeded start: balls packed inside the first ring, already moving.
  for (let i = 0; i < n; i++) {
    let tries = 0;
    for (;;) {
      const px = (random(`${seed}-x-${i}-${tries}`) * 2 - 1) * (RING_R[0] - BALL_R - 6);
      const py = (random(`${seed}-y-${i}-${tries}`) * 2 - 1) * (RING_R[0] - BALL_R - 6);
      tries++;
      if (px * px + py * py > (RING_R[0] - BALL_R - 6) * (RING_R[0] - BALL_R - 6)) {
        continue;
      }
      let ok = true;
      for (let j = 0; j < i; j++) {
        const dx = x[j] - CX - px;
        const dy = y[j] - CY - py;
        if (dx * dx + dy * dy < (BALL_R * 2 + 2) * (BALL_R * 2 + 2)) {
          ok = false;
          break;
        }
      }
      if (ok || tries > 500) {
        x[i] = CX + px;
        y[i] = CY + py;
        break;
      }
    }
    const a = random(`${seed}-dir-${i}`) * TAU;
    vx[i] = cosP(a) * SPEED_START;
    vy[i] = sinP(a) * SPEED_START;
  }

  const angle = new Float64Array(RING_COUNT);
  const omega = new Float64Array(RING_COUNT);
  for (let k = 0; k < RING_COUNT; k++) {
    angle[k] = random(`${seed}-ring-${k}`) * TAU;
    const dir = k % 2 === 0 ? 1 : -1;
    omega[k] = dir * (0.018 + random(`${seed}-omega-${k}`) * 0.022);
  }

  let active = 0;
  let outerR = RING_R[RING_COUNT - 1];
  let left = n;

  const sim: Simulation = {
    frames: maxFrames,
    winFrame: null,
    winner: null,
    pos: [],
    alive: [],
    ringAngle: [],
    ringHalf: [],
    outerR: [],
    activeRing: [],
    breaks: [],
    escapes: [],
    hits: [],
    clicks: [],
  };
  let lastClick = -100;

  const half = new Float64Array(RING_COUNT);
  let lastEvent = -OPEN_DELAY;
  let open = 1;

  for (let f = 0; f < maxFrames; f++) {
    const ramp = f >= SPEED_RAMP ? 1 : f / SPEED_RAMP;
    const target = SPEED_START + (SPEED_END - SPEED_START) * ramp;
    const spin = 1 + ramp;
    if (active === RING_COUNT - 1 && outerR > OUTER_MIN_R) {
      outerR -= OUTER_SHRINK;
    }
    const since = f - lastEvent - OPEN_DELAY;
    const press = since <= 0 ? 0 : since >= OPEN_FRAMES ? 1 : since / OPEN_FRAMES;
    const openTarget = PINCH + (OPEN_MAX - PINCH) * press;
    open += (openTarget - open) * (openTarget < open ? 0.25 : 1);
    for (let k = 0; k < RING_COUNT; k++) {
      const r = k === RING_COUNT - 1 ? outerR : RING_R[k];
      const minHalf = GAP_MIN_PX / r;
      const h = GAP_HALF[k] * (1 - GAP_NARROW * ramp) * (f < 30 && k === 0 ? 1 : open);
      half[k] = h > HALF_MAX ? HALF_MAX : h > minHalf ? h : minHalf;
    }

    for (let sub = 0; sub < SUBSTEPS; sub++) {
      for (let k = active; k < RING_COUNT; k++) {
        angle[k] += (omega[k] * spin) / SUBSTEPS;
      }
      for (let i = 0; i < n; i++) {
        if (alive[i]) {
          x[i] += vx[i] / SUBSTEPS;
          y[i] += vy[i] / SUBSTEPS;
        }
      }

      // Ball–ball collisions (equal mass, elastic).
      for (let i = 0; i < n; i++) {
        if (!alive[i]) {
          continue;
        }
        for (let j = i + 1; j < n; j++) {
          if (!alive[j]) {
            continue;
          }
          const dx = x[j] - x[i];
          const dy = y[j] - y[i];
          const d2 = dx * dx + dy * dy;
          const min = BALL_R * 2;
          if (d2 < min * min && d2 > 1e-9) {
            const d = Math.sqrt(d2);
            const nx = dx / d;
            const ny = dy / d;
            const push = (min - d) * 0.5;
            x[i] -= nx * push;
            y[i] -= ny * push;
            x[j] += nx * push;
            y[j] += ny * push;
            const rel = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
            if (rel < 0) {
              vx[i] += nx * rel;
              vy[i] += ny * rel;
              vx[j] -= nx * rel;
              vy[j] -= ny * rel;
              if (f - lastHit[i * n + j] > 6) {
                sim.hits.push({frame: f, ball: i}, {frame: f, ball: j});
              }
              lastHit[i * n + j] = f;
            }
          }
        }
      }

      // The innermost unbroken ring contains every live ball.
      const R = active === RING_COUNT - 1 ? outerR : RING_R[active];
      const gc = cosP(angle[active]);
      const gs = sinP(angle[active]);
      const hc = cosP(half[active]);
      const hs = sinP(half[active]);
      // Gap end points: angle ± half.
      const ends = [
        [CX + R * (gc * hc - gs * hs), CY + R * (gs * hc + gc * hs)],
        [CX + R * (gc * hc + gs * hs), CY + R * (gs * hc - gc * hs)],
      ];
      for (let i = 0; i < n; i++) {
        if (!alive[i]) {
          continue;
        }
        let dx = x[i] - CX;
        let dy = y[i] - CY;
        let d = Math.sqrt(dx * dx + dy * dy);
        const inGap = d > 1e-6 && (dx * gc + dy * gs) / d > hc;

        // Rounded gap ends act as point obstacles.
        for (const [ex, ey] of ends) {
          const ox = x[i] - ex;
          const oy = y[i] - ey;
          const o2 = ox * ox + oy * oy;
          const min = BALL_R + RING_W / 2;
          if (o2 < min * min && o2 > 1e-9) {
            const od = Math.sqrt(o2);
            const nx = ox / od;
            const ny = oy / od;
            x[i] = ex + nx * min;
            y[i] = ey + ny * min;
            const vn = vx[i] * nx + vy[i] * ny;
            if (vn < 0) {
              vx[i] -= 2 * vn * nx;
              vy[i] -= 2 * vn * ny;
            }
          }
        }
        dx = x[i] - CX;
        dy = y[i] - CY;
        d = Math.sqrt(dx * dx + dy * dy);

        if (inGap) {
          if (d > R) {
            // Crossed the ring.
            lastEvent = f;
            if (active < RING_COUNT - 1) {
              sim.breaks.push({frame: f, ring: active, ball: i});
              active++;
            } else {
              alive[i] = 0;
              left--;
              sim.escapes.push({frame: f, ball: i, x: x[i], y: y[i], vx: vx[i], vy: vy[i]});
            }
            break;
          }
          continue;
        }
        const lim = R - BALL_R - RING_W / 2;
        if (d > lim) {
          const nx = dx / d;
          const ny = dy / d;
          x[i] = CX + nx * lim;
          y[i] = CY + ny * lim;
          const vn = vx[i] * nx + vy[i] * ny;
          if (vn > 0) {
            vx[i] -= 2 * vn * nx;
            vy[i] -= 2 * vn * ny;
            if (f - lastClick >= 8) {
              sim.clicks.push(f);
              lastClick = f;
            }
          }
        }
      }
    }

    // Keep every ball near the target speed so the game never slows down.
    for (let i = 0; i < n; i++) {
      if (!alive[i]) {
        continue;
      }
      const s = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
      if (s > 1e-6) {
        const k = (s + (target - s) * 0.08) / s;
        vx[i] *= k;
        vy[i] *= k;
      }
    }

    const p = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      p[i * 2] = x[i];
      p[i * 2 + 1] = y[i];
    }
    sim.pos.push(p);
    sim.alive.push(alive.slice());
    sim.ringAngle.push(Float32Array.from(angle));
    sim.ringHalf.push(Float32Array.from(half));
    sim.outerR.push(outerR);
    sim.activeRing.push(active);

    if (left === 1) {
      sim.winFrame = f;
      sim.winner = alive.indexOf(1);
      sim.frames = f + 1;
      break;
    }
  }
  return sim;
};

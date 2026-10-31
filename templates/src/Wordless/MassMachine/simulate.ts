import {random} from 'remotion';

// Deterministic "multiplier machine": a pendulum hung from the center of a
// circle sweeps a heavy gray box along the floor, bulldozing the balls up one
// side. Each time the box stops at an end of its swing it "presses": every
// older ball piled next to it doubles and takes the next color. Only
// + − × ÷ and Math.sqrt are used so Node, Studio and render agree.

export const CX = 540;
export const CY = 980;
export const ARENA_R = 470;
export const BALL_R = 9;

export const PIVOT_X = CX;
export const PIVOT_Y = CY;
export const BOX_W = 130;
export const BOX_H = 168;
// The box's outer face touches the wall, so no ball can slip under it.
export const ARM_LEN = ARENA_R - BOX_H / 2 + 2; // pivot → box center
export const ARM_W = 14;
export const SWING_AMP = 1.2; // radians at the extremes
export const SWING_PERIOD = 120; // frames for a full swing; divisible by 4 so stops land on frames

// Static round bumpers in the upper half; round so nothing can pile on them.
export type Bumper = {x: number; y: number; r: number};
export const BUMPERS: Bumper[] = [
  {x: CX - 230, y: CY - 210, r: 36},
  {x: CX + 230, y: CY - 210, r: 36},
  {x: CX, y: CY - 330, r: 26},
];

const SUBSTEPS = 4;
const GRAVITY = 0.55 / (SUBSTEPS * SUBSTEPS);
const WALL_BOUNCE = 0.55;
const BOX_BOUNCE = 0.5;
const BALL_DAMP = 0.75; // share of the approach speed removed in ball–ball hits
// Press: balls whose center is within PRESS_REACH of the box surface double.
export const PRESS_REACH = 180;
const PRESS_WINDOW = 10;
const TWINS = 2; // new balls per pressed ball (×3 in total) // frames around the stop in which the press works
const CELL = BALL_R * 2;

export type SimOptions = {
  seed: string;
  maxBalls: number;
  maxFrames: number;
  tailFrames: number; // frames kept after the cap is reached
};

export type Press = {frame: number; gen: number; count: number};

export type Simulation = {
  totalFrames: number;
  // per frame: interleaved x,y (Float32) and generation (Uint8)
  pos: Float32Array[];
  gen: Uint8Array[];
  angles: number[];
  presses: Press[];
  capFrame: number | null;
};

// Smooth, sin-free oscillation in [-1, 1] with a period of 1.
const oscillate = (t: number): number => {
  const p = t - Math.floor(t);
  const half = p < 0.5 ? p * 2 : (p - 0.5) * 2;
  const s = half * half * (3 - 2 * half); // smoothstep
  return p < 0.5 ? 1 - 2 * s : -1 + 2 * s;
};

// Polynomial sine/cosine for |a| ≤ 1.3 rad (pendulum only, error < 1e-5).
const sinA = (a: number) => {
  const a2 = a * a;
  return a * (1 - (a2 / 6) * (1 - (a2 / 20) * (1 - a2 / 42)));
};
const cosA = (a: number) => {
  const a2 = a * a;
  return 1 - (a2 / 2) * (1 - (a2 / 12) * (1 - (a2 / 30) * (1 - a2 / 56)));
};

// Starts at the bottom; the first stop is a quarter period in.
export const swingAngle = (frame: number) => SWING_AMP * oscillate(frame / SWING_PERIOD + 0.25);
export const isStopFrame = (frame: number) => (frame + SWING_PERIOD / 4) % (SWING_PERIOD / 2) === 0;

export const pendulumPose = (angle: number) => {
  const s = sinA(angle);
  const c = cosA(angle);
  // Down the arm is (s, c) in screen space (y grows downwards).
  return {
    s,
    c,
    boxX: PIVOT_X + s * ARM_LEN,
    boxY: PIVOT_Y + c * ARM_LEN,
  };
};

// Distance from a point to the box surface (negative inside), box-local.
const boxDistance = (px: number, py: number, s: number, c: number, boxX: number, boxY: number) => {
  const rx = px - boxX;
  const ry = py - boxY;
  const lu = rx * c - ry * s;
  const lv = rx * s + ry * c;
  const du = (lu < 0 ? -lu : lu) - BOX_W / 2;
  const dv = (lv < 0 ? -lv : lv) - BOX_H / 2;
  if (du <= 0 && dv <= 0) {
    return du > dv ? du : dv;
  }
  const ou = du > 0 ? du : 0;
  const ov = dv > 0 ? dv : 0;
  return Math.sqrt(ou * ou + ov * ov);
};

export const simulate = ({seed, maxBalls, maxFrames, tailFrames}: SimOptions): Simulation => {
  const cap = maxBalls;
  const x = new Float64Array(cap);
  const y = new Float64Array(cap);
  const vx = new Float64Array(cap);
  const vy = new Float64Array(cap);
  const g = new Uint8Array(cap);

  // The first ball drops from above the first stop and lands on the box
  // just as it arrives, so the opening press happens within the first second.
  const firstStop = pendulumPose(swingAngle(SWING_PERIOD / 4));
  let n = 1;
  x[0] = firstStop.boxX + (random(`${seed}-start`) - 0.5) * 40;
  y[0] = firstStop.boxY - 230;

  const pos: Float32Array[] = [];
  const gens: Uint8Array[] = [];
  const angles: number[] = [];
  const presses: Press[] = [];
  let capFrame: number | null = null;

  const gridW = Math.ceil(1080 / CELL) + 2;
  const gridH = Math.ceil(1920 / CELL) + 2;
  const head = new Int32Array(gridW * gridH);
  const next = new Int32Array(cap);

  let splitCounter = 0;
  let wave = 0;
  let pressUntil = -1;
  let totalFrames = maxFrames;

  for (let f = 0; f < maxFrames; f++) {
    const a0 = swingAngle(f);
    const a1 = swingAngle(f + 1);

    if (isStopFrame(f + PRESS_WINDOW / 2) && capFrame === null) {
      pressUntil = f + PRESS_WINDOW;
      const last = presses[presses.length - 1];
      if (last && last.count === 0) {
        // Nothing was pressed last time: keep the color, retry here.
        last.frame = f;
      } else {
        wave++;
        presses.push({frame: f, gen: wave, count: 0});
      }
    }

    for (let sub = 0; sub < SUBSTEPS; sub++) {
      const t = (sub + 1) / SUBSTEPS;
      const ang = a0 + (a1 - a0) * t;
      const omega = (a1 - a0) / SUBSTEPS; // rad per substep
      const {s, c, boxX, boxY} = pendulumPose(ang);

      for (let i = 0; i < n; i++) {
        vy[i] += GRAVITY;
        x[i] += vx[i];
        y[i] += vy[i];
      }

      // Ball–ball collisions through a uniform grid.
      head.fill(-1);
      for (let i = 0; i < n; i++) {
        const k = (Math.floor(y[i] / CELL) + 1) * gridW + Math.floor(x[i] / CELL) + 1;
        next[i] = head[k];
        head[k] = i;
      }
      for (let i = 0; i < n; i++) {
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
              if (j > i) {
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
                    const imp = rel * BALL_DAMP;
                    vx[i] += nx * imp;
                    vy[i] += ny * imp;
                    vx[j] -= nx * imp;
                    vy[j] -= ny * imp;
                  }
                }
              }
              j = next[j];
            }
          }
        }
      }

      for (let i = 0; i < n; i++) {
        // Static bumpers.
        for (const b of BUMPERS) {
          const dx = x[i] - b.x;
          const dy = y[i] - b.y;
          const d2 = dx * dx + dy * dy;
          const min = BALL_R + b.r;
          if (d2 < min * min && d2 > 1e-9) {
            const d = Math.sqrt(d2);
            const nx = dx / d;
            const ny = dy / d;
            x[i] = b.x + nx * min;
            y[i] = b.y + ny * min;
            const vn = vx[i] * nx + vy[i] * ny;
            if (vn < 0) {
              vx[i] -= (1 + WALL_BOUNCE) * vn * nx;
              vy[i] -= (1 + WALL_BOUNCE) * vn * ny;
            }
          }
        }

        // Pendulum arm (moving capsule from pivot to box top).
        {
          const len = ARM_LEN - BOX_H / 2;
          let u = (x[i] - PIVOT_X) * s + (y[i] - PIVOT_Y) * c;
          u = u < 0 ? 0 : u > len ? len : u;
          const px = PIVOT_X + s * u;
          const py = PIVOT_Y + c * u;
          const dx = x[i] - px;
          const dy = y[i] - py;
          const d2 = dx * dx + dy * dy;
          const min = BALL_R + ARM_W / 2;
          if (d2 < min * min && d2 > 1e-9) {
            const d = Math.sqrt(d2);
            const nx = dx / d;
            const ny = dy / d;
            x[i] = px + nx * min;
            y[i] = py + ny * min;
            // Surface velocity of the arm at that point: ω × r.
            const svx = omega * c * u;
            const svy = -omega * s * u;
            const vn = (vx[i] - svx) * nx + (vy[i] - svy) * ny;
            if (vn < 0) {
              vx[i] -= (1 + BOX_BOUNCE) * vn * nx;
              vy[i] -= (1 + BOX_BOUNCE) * vn * ny;
            }
          }
        }

        // Pendulum box (moving oriented rectangle).
        {
          const rx = x[i] - boxX;
          const ry = y[i] - boxY;
          // Local axes: across = (c, -s), down = (s, c).
          const lu = rx * c - ry * s;
          const lv = rx * s + ry * c;
          const hu = BOX_W / 2;
          const hv = BOX_H / 2;
          const cu = lu < -hu ? -hu : lu > hu ? hu : lu;
          const cv = lv < -hv ? -hv : lv > hv ? hv : lv;
          let du = lu - cu;
          let dv = lv - cv;
          let d2 = du * du + dv * dv;
          let inside = false;
          if (d2 < 1e-9) {
            // Center inside the box: push out through the nearest side face.
            inside = true;
            du = lu < 0 ? -1 : 1;
            dv = 0;
            d2 = 1;
          }
          if (inside || d2 < BALL_R * BALL_R) {
            const d = Math.sqrt(d2);
            const nu = du / d;
            const nv = dv / d;
            const nx = nu * c + nv * s;
            const ny = -nu * s + nv * c;
            const su = inside ? (lu < 0 ? -hu : hu) : cu;
            const qx = boxX + su * c + cv * s;
            const qy = boxY - su * s + cv * c;
            x[i] = qx + nx * BALL_R;
            y[i] = qy + ny * BALL_R;
            const ox = qx - PIVOT_X;
            const oy = qy - PIVOT_Y;
            const svx = omega * oy;
            const svy = -omega * ox;
            const vn = (vx[i] - svx) * nx + (vy[i] - svy) * ny;
            if (vn < 0) {
              vx[i] -= (1 + BOX_BOUNCE) * vn * nx;
              vy[i] -= (1 + BOX_BOUNCE) * vn * ny;
            }
          }
        }

        // Arena wall.
        const dx = x[i] - CX;
        const dy = y[i] - CY;
        const d2 = dx * dx + dy * dy;
        const lim = ARENA_R - BALL_R;
        if (d2 > lim * lim) {
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          x[i] = CX + nx * lim;
          y[i] = CY + ny * lim;
          const vn = vx[i] * nx + vy[i] * ny;
          if (vn > 0) {
            vx[i] -= (1 + WALL_BOUNCE) * vn * nx;
            vy[i] -= (1 + WALL_BOUNCE) * vn * ny;
          }
        }
      }
    }

    // Press: during the stop, older balls near the box double a few at a
    // time so the pile swells instead of exploding in a single frame.
    if (f < pressUntil && capFrame === null) {
      const press = presses[presses.length - 1];
      const {s, c, boxX, boxY} = pendulumPose(a1);
      const budget = Math.max(2, Math.ceil(n / (PRESS_WINDOW - 4)));
      let done = 0;
      const before = n;
      for (let i = 0; i < before && done < budget && n < cap; i++) {
        if (g[i] >= wave || boxDistance(x[i], y[i], s, c, boxX, boxY) > PRESS_REACH) {
          continue;
        }
        g[i] = wave;
        press.count++;
        for (let m = 0; m < TWINS && n < cap; m++) {
          const k = n++;
          const r = random(`${seed}-split-${splitCounter++}`);
          // Twins appear just above, nudged sideways, and drop into the pile.
          const side = m % 2 === 0 ? 1 : -1;
          x[k] = x[i] + side * (0.4 + r * 0.8) * BALL_R * 2;
          y[k] = y[i] - BALL_R * 2 * (1 + m * 0.5);
          vx[k] = vx[i] + side * (0.5 + r * 2);
          vy[k] = vy[i] - 2 - r * 2;
          g[k] = wave;
          press.count++;
        }
        done++;
      }
      if (n >= cap) {
        capFrame = f;
      }
    }

    const p = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      p[i * 2] = x[i];
      p[i * 2 + 1] = y[i];
    }
    pos.push(p);
    gens.push(g.slice(0, n));
    angles.push(a1);

    if (capFrame !== null && f >= capFrame + tailFrames) {
      totalFrames = f + 1;
      break;
    }
  }

  return {totalFrames, pos, gen: gens, angles, presses: presses.filter((p) => p.count > 0), capFrame};
};

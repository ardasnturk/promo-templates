export type BallFrame = {
  x: number;
  y: number;
  r: number;
  bounces: number;
};

export type Simulation = {
  frames: BallFrame[];
  bounceFrames: number[];
  filledAt: number | null;
};

export const ARENA_RADIUS = 430;
const START_RADIUS = 18;
const GROWTH = 5;
const GRAVITY = 0.32; // px per substep²
const SUBSTEPS = 4;
const MIN_SPEED = 9;

// Deterministic physics: a ball inside a circle that grows on every wall hit.
export const simulate = (totalFrames: number): Simulation => {
  let x = 120;
  let y = -150;
  let vx = 5.5;
  let vy = 0;
  let r = START_RADIUS;
  let bounces = 0;
  let filledAt: number | null = null;
  const frames: BallFrame[] = [];
  const bounceFrames: number[] = [];

  for (let f = 0; f < totalFrames; f++) {
    if (filledAt === null) {
      let bouncedThisFrame = false;
      for (let s = 0; s < SUBSTEPS; s++) {
        vy += GRAVITY;
        x += vx;
        y += vy;
        const d = Math.hypot(x, y);
        if (d + r >= ARENA_RADIUS) {
          const nx = x / d;
          const ny = y / d;
          const dot = vx * nx + vy * ny;
          if (dot > 0) {
            vx -= 2 * dot * nx;
            vy -= 2 * dot * ny;
            const speed = Math.hypot(vx, vy);
            if (speed < MIN_SPEED) {
              vx *= MIN_SPEED / speed;
              vy *= MIN_SPEED / speed;
            }
            r += GROWTH;
            bounces++;
            bouncedThisFrame = true;
          }
          const allowed = Math.max(0, ARENA_RADIUS - r);
          x = nx * allowed;
          y = ny * allowed;
          if (r >= ARENA_RADIUS - 4) {
            r = ARENA_RADIUS;
            x = 0;
            y = 0;
            filledAt = f;
            break;
          }
        }
      }
      if (bouncedThisFrame) {
        bounceFrames.push(f);
      }
    }
    frames.push({x, y, r, bounces});
  }

  return {frames, bounceFrames, filledAt};
};

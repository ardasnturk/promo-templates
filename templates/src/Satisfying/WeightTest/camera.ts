// A fixed perspective camera for the weight test scenes. World units are pixels:
// x to the right, y up, z away from the camera; the floor is y = 0.
// This is closed-form animation (no chaotic simulation), so sin/cos are fine.

export const CX = 540;
export const CY = 1000;

const YAW = 0.36;
const PITCH = 0.3;
const DIST = 2400;
const FOCAL = 3300;
const TARGET = {x: 0, y: 470, z: 0};

const cp = Math.cos(PITCH);
const sp = Math.sin(PITCH);
const cyw = Math.cos(YAW);
const syw = Math.sin(YAW);

export const EYE = {
  x: TARGET.x + DIST * syw * cp,
  y: TARGET.y + DIST * sp,
  z: TARGET.z - DIST * cyw * cp,
};

// Forward, right and up axes of the camera.
const F = {x: -syw * cp, y: -sp, z: cyw * cp};
const R = {x: cyw, y: 0, z: syw};
const U = {x: F.y * R.z - F.z * R.y, y: F.z * R.x - F.x * R.z, z: F.x * R.y - F.y * R.x};

export type P2 = readonly [number, number];

// Screen position and camera depth of a world point.
export const project = (x: number, y: number, z: number): [number, number, number] => {
  const dx = x - EYE.x;
  const dy = y - EYE.y;
  const dz = z - EYE.z;
  const depth = dx * F.x + dy * F.y + dz * F.z;
  return [CX + (FOCAL * (dx * R.x + dz * R.z)) / depth, CY - (FOCAL * (dx * U.x + dy * U.y + dz * U.z)) / depth, depth];
};

export const depthOf = (x: number, y: number, z: number) => (x - EYE.x) * F.x + (y - EYE.y) * F.y + (z - EYE.z) * F.z;

// Screen size of a world length at a given depth.
export const scaleAt = (depth: number) => FOCAL / depth;

export const pts = (list: readonly (readonly number[])[]) =>
  list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

// Light from the top left, slightly in front.
export const LIGHT = (() => {
  const l = {x: -0.42, y: 0.84, z: -0.34};
  const n = Math.sqrt(l.x * l.x + l.y * l.y + l.z * l.z);
  return {x: l.x / n, y: l.y / n, z: l.z / n};
})();

// Convex hull of screen points (monotone chain), used for clip outlines.
export const hull = (input: P2[]): P2[] => {
  const p = [...input].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) {
      lower.pop();
    }
    lower.push(q);
  }
  const upper: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) {
      upper.pop();
    }
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

// Weight in kg → power 0…1 (1 kg = 0, 1,000 kg = 1). Heavier weights go above 1.
export const powerOf = (weight: number) => Math.max(0, Math.log10(Math.max(weight, 1)) / 3);

// Frame (inside a round) at which the falling object hits.
export const IMPACT = 10;
export const GRAVITY = 1.7;

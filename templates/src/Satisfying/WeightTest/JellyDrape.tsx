import {useMemo} from 'react';
import {random} from 'remotion';
import {clamp01, smooth} from '../../Loop/loop';
import {depthOf, EYE, GRAVITY, hull, IMPACT, LIGHT, P2, powerOf, project, pts, scaleAt} from './camera';

// A glossy jelly sheet drops on four wooden balls resting in a stone box. Light
// sheets drape and wobble, heavier ones drip into the box, the heaviest push the
// balls down and swallow everything into the box.

const B = 215; // outer half width of the box
const IN = 177; // inner half width
const TOP = 600; // rim height
const FLOOR = 110; // inside floor height
const R = 98; // ball radius
const BX = 95; // ball centre offset
const BY = 650; // ball centre height
const SINK = 0.9 * R; // how far the heaviest weight pushes the balls in
const N = 31; // sheet vertices per side
const SIZE = 660;
const THICK = 5;

const BALLS = [
  [-BX, -BX],
  [BX, -BX],
  [-BX, BX],
  [BX, BX],
] as const;

type Vertex = {
  readonly x0: number;
  readonly z0: number;
  readonly tx: number;
  readonly ty: number;
  readonly tz: number;
  readonly delay: number;
  readonly drip: number;
};

const support = (x: number, z: number) => {
  let h = -Infinity;
  for (const [bx, bz] of BALLS) {
    const d2 = (x - bx) * (x - bx) + (z - bz) * (z - bz);
    if (d2 < R * R) {
      h = Math.max(h, BY + Math.sqrt(R * R - d2));
    }
  }
  return h;
};

const plan = (seed: string, weight: number): Vertex[] => {
  const p = powerOf(weight);
  const b = 0.4 + 0.56 * clamp01(p);
  const a = Math.sqrt(1 - b * b) * 0.7;
  const gapSag = 430 * Math.pow(clamp01((p - 0.38) / 0.62), 1.2);
  const ys: number[] = [];
  const base: {x0: number; z0: number; tx: number; tz: number; l: number}[] = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x0 = -SIZE / 2 + (SIZE * i) / (N - 1);
      const z0 = -SIZE / 2 + (SIZE * j) / (N - 1);
      const h = support(x0, z0);
      if (h > -Infinity) {
        ys.push(h + THICK);
        base.push({x0, z0, tx: x0, tz: z0, l: 0});
        continue;
      }
      // Hang from the nearest ball's edge.
      let best = Infinity;
      let cx = 0;
      let cz = 0;
      for (const [bx, bz] of BALLS) {
        const d = Math.sqrt((x0 - bx) * (x0 - bx) + (z0 - bz) * (z0 - bz));
        if (d < best) {
          best = d;
          cx = bx + ((x0 - bx) * R) / d;
          cz = bz + ((z0 - bz) * R) / d;
        }
      }
      const l = best - R;
      const r = Math.sqrt(x0 * x0 + z0 * z0) || 1;
      ys.push(BY - l * b);
      base.push({x0, z0, tx: cx + (x0 / r) * l * a, tz: cz + (z0 / r) * l * a, l});
    }
  }
  // Relax the heights a little so the sheet bridges between the balls like cloth.
  for (let it = 0; it < 10; it++) {
    const next = [...ys];
    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        const k = j * N + i;
        const avg = (ys[k - 1] + ys[k + 1] + ys[k - N] + ys[k + N]) / 4;
        const h = support(base[k].tx, base[k].tz);
        next[k] = Math.max(h + THICK, ys[k] * 0.5 + avg * 0.5);
      }
    }
    for (let k = 0; k < ys.length; k++) {
      ys[k] = next[k];
    }
  }
  const lobes = 6 + Math.floor(random(`${seed}-lobes`) * 4);
  const phase = random(`${seed}-phase`) * 6.28;
  return base.map((v, k) => {
    const rr = v.x0 * v.x0 + v.z0 * v.z0;
    const sag = gapSag * Math.exp(-rr / (2 * 75 * 75));
    // Drips form smooth lobes around the edge, so the skirt hangs in soft tendrils.
    const lobe = Math.max(0, Math.sin(lobes * Math.atan2(v.z0, v.x0) + phase));
    const drip = (v.l * 0.35 * p + (30 + 380 * Math.pow(clamp01(p), 1.3)) * Math.pow(lobe, 6)) * clamp01(v.l / 160);
    return {
      x0: v.x0,
      z0: v.z0,
      tx: v.tx,
      ty: Math.max(support(v.tx, v.tz) + THICK, ys[k] - sag),
      tz: v.tz,
      delay: v.l * 0.035 + Math.sqrt(rr) * 0.01,
      drip,
    };
  });
};

// Keep a hanging point outside the stone walls (or inside the hole when it went in).
const keepOutOfWalls = (x: number, y: number, z: number, inside: boolean): [number, number, number] => {
  const yy = Math.max(y, inside ? FLOOR + 6 : 2);
  if (yy >= TOP + 4) {
    return [x, yy, z];
  }
  if (inside) {
    const lim = IN - 8;
    return [Math.max(-lim, Math.min(lim, x)), yy, Math.max(-lim, Math.min(lim, z))];
  }
  const lim = B + 7;
  if (Math.abs(x) < lim && Math.abs(z) < lim) {
    if (Math.abs(x) > Math.abs(z)) {
      return [Math.sign(x) * lim, yy, z];
    }
    return [x, yy, Math.sign(z) * lim];
  }
  return [x, yy, z];
};

const STONE_DOTS = Array.from({length: 90}, (_, i) => ({
  x: random(`stone-x-${i}`) * 140,
  y: random(`stone-y-${i}`) * 140,
  r: 1 + random(`stone-r-${i}`) * 3,
  light: random(`stone-l-${i}`) < 0.5,
}));

const JELLY = [214, 18, 32];

const quadColor = (q: number[][]) => {
  // Normal from the diagonals, flipped toward the camera.
  const ax = q[2][0] - q[0][0];
  const ay = q[2][1] - q[0][1];
  const az = q[2][2] - q[0][2];
  const bx = q[3][0] - q[1][0];
  const by = q[3][1] - q[1][1];
  const bz = q[3][2] - q[1][2];
  let nx = ay * bz - az * by;
  let ny = az * bx - ax * bz;
  let nz = ax * by - ay * bx;
  const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  nx /= nl;
  ny /= nl;
  nz /= nl;
  const cx = (q[0][0] + q[2][0]) / 2;
  const cy = (q[0][1] + q[2][1]) / 2;
  const cz = (q[0][2] + q[2][2]) / 2;
  let vx = EYE.x - cx;
  let vy = EYE.y - cy;
  let vz = EYE.z - cz;
  const vl = Math.sqrt(vx * vx + vy * vy + vz * vz);
  vx /= vl;
  vy /= vl;
  vz /= vl;
  let back = 1;
  if (nx * vx + ny * vy + nz * vz < 0) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
    back = 0.8;
  }
  const diff = Math.max(0, nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z);
  let hx = LIGHT.x + vx;
  let hy = LIGHT.y + vy;
  let hz = LIGHT.z + vz;
  const hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
  hx /= hl;
  hy /= hl;
  hz /= hl;
  const spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 60);
  const fres = Math.pow(1 - Math.abs(nx * vx + ny * vy + nz * vz), 3) * 0.12;
  const ch = (c: number) => Math.round(Math.min(255, c * (0.28 + 0.72 * diff) * back + 255 * (spec * 0.75 + fres)));
  return `rgb(${ch(JELLY[0])},${ch(JELLY[1])},${ch(JELLY[2])})`;
};

const Box: React.FC = () => {
  const c = (x: number, y: number, z: number) => {
    const q = project(x, y, z);
    return [q[0], q[1]] as P2;
  };
  const front = [c(-B, 0, -B), c(B, 0, -B), c(B, TOP, -B), c(-B, TOP, -B)];
  const right = [c(B, 0, -B), c(B, 0, B), c(B, TOP, B), c(B, TOP, -B)];
  const outer = [c(-B, TOP, -B), c(B, TOP, -B), c(B, TOP, B), c(-B, TOP, B)];
  const inner = [c(-IN, TOP, -IN), c(IN, TOP, -IN), c(IN, TOP, IN), c(-IN, TOP, IN)];
  const ring = `M${pts(outer)}Z M${pts([...inner].reverse())}Z`;
  return (
    <>
      <defs>
        <pattern id="stone" width={140} height={140} patternUnits="userSpaceOnUse">
          {STONE_DOTS.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={d.light ? 'rgba(255,245,230,0.28)' : 'rgba(40,28,18,0.32)'}
            />
          ))}
        </pattern>
        <linearGradient id="stoneFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E7A63" />
          <stop offset="1" stopColor="#6E5D4B" />
        </linearGradient>
        <linearGradient id="stoneRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6F604E" />
          <stop offset="1" stopColor="#4F4336" />
        </linearGradient>
      </defs>
      <polygon points={pts(front)} fill="url(#stoneFront)" />
      <polygon points={pts(front)} fill="url(#stone)" />
      <polygon points={pts(right)} fill="url(#stoneRight)" />
      <polygon points={pts(right)} fill="url(#stone)" />
      <path d={ring} fill="#A8937A" fillRule="evenodd" />
      <path d={ring} fill="url(#stone)" fillRule="evenodd" />
    </>
  );
};

// The inside of the box, seen through the hole.
const BoxInside: React.FC = () => {
  const c = (x: number, y: number, z: number) => {
    const q = project(x, y, z);
    return [q[0], q[1]] as P2;
  };
  return (
    <>
      <polygon points={pts([c(-IN, FLOOR, IN), c(IN, FLOOR, IN), c(IN, TOP, IN), c(-IN, TOP, IN)])} fill="#4A3D30" />
      <polygon points={pts([c(-IN, FLOOR, -IN), c(-IN, FLOOR, IN), c(-IN, TOP, IN), c(-IN, TOP, -IN)])} fill="#5C4C3C" />
      <polygon points={pts([c(-IN, FLOOR, -IN), c(IN, FLOOR, -IN), c(IN, FLOOR, IN), c(-IN, FLOOR, IN)])} fill="#33291F" />
    </>
  );
};

export const JellyDrape: React.FC<{readonly seed: string; readonly weight: number; readonly t: number}> = ({
  seed,
  weight,
  t,
}) => {
  const p = powerOf(weight);
  const verts = useMemo(() => plan(seed, weight), [seed, weight]);
  const sinkMax = SINK * clamp01((p - 0.78) / 0.22);
  const sink = sinkMax * smooth((t - IMPACT - 3) / 26);
  const pullIn = clamp01((p - 0.82) / 0.18) * smooth((t - IMPACT - 4) / 22);
  const contact = BY + R + THICK;

  // Sheet: flat while falling, then each vertex springs to its drape with a jelly wobble.
  const world = verts.map((v) => {
    if (t < IMPACT) {
      const dt = IMPACT - t;
      return [v.x0, contact + 8 * dt + 0.5 * GRAVITY * dt * dt, v.z0];
    }
    const tau = Math.max(0, t - IMPACT - v.delay);
    const s = 1 - Math.exp(-0.13 * tau) * Math.cos(0.34 * tau);
    const grow = smooth((tau - 5) / 45);
    let x = v.x0 + (v.tx - v.x0) * s;
    let z = v.z0 + (v.tz - v.z0) * s;
    let y = contact + (v.ty - contact) * s - sink - v.drip * grow;
    if (pullIn > 0) {
      const lim = IN - 14;
      x += (Math.max(-lim, Math.min(lim, x)) - x) * pullIn;
      z += (Math.max(-lim, Math.min(lim, z)) - z) * pullIn;
      y -= 30 * pullIn;
    }
    const inside = Math.abs(x) < IN && Math.abs(z) < IN && (y < TOP || pullIn > 0.5);
    return keepOutOfWalls(x, y, z, inside);
  });
  const screen = world.map(([x, y, z]) => project(x, y, z));

  const behind: {d: number; node: React.ReactNode}[] = [];
  // Inside the hole the sheet sorts in layers around the balls (painter's order fails on spheres).
  const ballY = BY - sink - pullIn * 30;
  const inside: {d: number; layer: number; node: React.ReactNode}[] = [];
  const front: {d: number; node: React.ReactNode}[] = [];
  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N - 1; i++) {
      const k = j * N + i;
      const ids = [k, k + 1, k + N + 1, k + N];
      const q = ids.map((id) => world[id]);
      const mx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
      const my = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
      const mz = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
      const fill = quadColor(q);
      const node = (
        <polygon
          key={`q${k}`}
          points={pts(ids.map((id) => screen[id]))}
          fill={fill}
          stroke={fill}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      );
      const item = {d: depthOf(mx, my, mz), node};
      if (my < TOP && Math.abs(mx) < IN + 4 && Math.abs(mz) < IN + 4) {
        inside.push({...item, layer: my < ballY ? 0 : 2});
      } else if (my < TOP + 4 && (mz > B - 20 || mx < -B + 20)) {
        behind.push(item);
      } else {
        front.push(item);
      }
    }
  }

  BALLS.forEach(([bx, bz], i) => {
    const y = ballY;
    const c = project(bx, y, bz);
    const r = R * scaleAt(c[2]);
    inside.push({
      d: depthOf(bx, y, bz),
      layer: 1,
      node: <circle key={`ball${i}`} cx={c[0]} cy={c[1]} r={r} fill="url(#wood)" />,
    });
  });
  const byDepth = (a: {d: number}, b: {d: number}) => b.d - a.d;
  behind.sort(byDepth);
  inside.sort((a, b) => a.layer - b.layer || b.d - a.d);
  front.sort(byDepth);

  // Screen minus the box silhouette, plus the hole: what is in the box shows only through the hole.
  const corners: P2[] = [];
  for (const x of [-B, B]) {
    for (const y of [0, TOP]) {
      for (const z of [-B, B]) {
        const q = project(x, y, z);
        corners.push([q[0], q[1]]);
      }
    }
  }
  const hole = [
    [-IN, -IN],
    [IN, -IN],
    [IN, IN],
    [-IN, IN],
  ].map(([x, z]) => project(x, TOP, z));
  const clip = `M-50,-50 L1130,-50 L1130,1970 L-50,1970Z M${pts(hull(corners))}Z M${pts(hole)}Z`;

  const sh = [
    [-B - 60, -B - 40],
    [B + 60, -B - 40],
    [B + 60, B + 60],
    [-B - 60, B + 60],
  ].map(([x, z]) => project(x, 0, z));

  return (
    <>
      <defs>
        <radialGradient id="wood" cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#C98B58" />
          <stop offset="0.45" stopColor="#94552E" />
          <stop offset="1" stopColor="#4E2712" />
        </radialGradient>
        <clipPath id="boxHole">
          <path d={clip} clipRule="evenodd" />
        </clipPath>
        <filter id="boxShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
      </defs>
      <polygon points={pts(sh)} fill="rgba(40,55,65,0.35)" filter="url(#boxShadow)" />
      {behind.map((it) => it.node)}
      <Box />
      <g clipPath="url(#boxHole)">
        <BoxInside />
        {inside.map((it) => it.node)}
      </g>
      {front.map((it) => it.node)}
    </>
  );
};

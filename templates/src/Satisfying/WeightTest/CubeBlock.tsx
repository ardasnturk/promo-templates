import {useMemo} from 'react';
import {random} from 'remotion';
import {clamp01, easeOut, shade, smooth} from '../../Loop/loop';
import {depthOf, EYE, GRAVITY, IMPACT, P2, powerOf, project, pts, scaleAt} from './camera';

// A tall block made of small cubes; a steel bar drops on it. Light bars rest on
// top, heavier bars crush layers that spray out as loose cubes, the heaviest
// flatten the whole block into a pile.

const S = 34;
const W = 10;
const D = 6;
const H = 22;
const X0 = (-W * S) / 2;
const Z0 = (-D * S) / 2;
const TOP = H * S;
const BAR_LEN = 560;

type Plan = {
  readonly broken: number;
  readonly barR: number;
  readonly barRest: number;
  readonly crushEnd: number;
  readonly bulge: number;
  readonly cubes: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly color: string;
    readonly tone: number;
    readonly tb: number;
    readonly vx: number;
    readonly vy: number;
    readonly vz: number;
    readonly tl: number;
    readonly yl: number;
    readonly shell: boolean;
  }[];
};

const plan = (seed: string, weight: number, palette: readonly string[]): Plan => {
  const p = powerOf(weight);
  const crush = clamp01((p - 0.15) / 0.5);
  const broken = Math.round(crush * H);
  const barR = 11 + 40 * Math.pow(Math.min(p, 1.3), 1.5);
  const energy = 1.2 + 10 * p * p;
  const crushDur = 3 + broken * 0.55;
  const barRest = broken >= H ? barR + 2 * S : TOP - broken * S + barR;
  const keep = H - broken;

  // Ground height field, so loose cubes stack into a pile instead of overlapping.
  const field = new Map<string, number>();
  for (let ix = 0; ix < W; ix++) {
    for (let iz = 0; iz < D; iz++) {
      field.set(`${ix - W / 2},${iz - D / 2}`, keep * S);
    }
  }

  const cubes: Plan['cubes'][number][] = [];
  const flying: {i: number; t0: number}[] = [];
  for (let iy = 0; iy < H; iy++) {
    for (let ix = 0; ix < W; ix++) {
      for (let iz = 0; iz < D; iz++) {
        const r = (k: number) => random(`${seed}-cube-${ix}-${iy}-${iz}-${k}`);
        const x = X0 + ix * S;
        const y = iy * S;
        const z = Z0 + iz * S;
        const color = palette[Math.floor(r(0) * palette.length)];
        const tone = (r(1) - 0.5) * 0.12;
        const shell = ix === 0 || ix === W - 1 || iz === 0 || iz === D - 1 || iy === keep - 1 || iy === H - 1;
        if (iy < keep) {
          cubes.push({x, y, z, color, tone, tb: Infinity, vx: 0, vy: 0, vz: 0, tl: Infinity, yl: 0, shell});
          continue;
        }
        // The bar reaches this layer when its easeOut descent passes the layer top.
        const u = (TOP - (iy + 1) * S) / Math.max(TOP - (keep * S), 1);
        const tb = IMPACT + crushDur * (1 - Math.cbrt(1 - clamp01(u)));
        const ux = (x + S / 2) / ((W * S) / 2) + (r(2) - 0.5) * 0.9;
        const uz = (z + S / 2) / ((D * S) / 2) + (r(3) - 0.5) * 0.9;
        const len = Math.sqrt(ux * ux + uz * uz) || 1;
        const speed = energy * (0.35 + 0.9 * r(4)) * (0.35 + 0.65 * (iy / H));
        cubes.push({
          x,
          y,
          z,
          color,
          tone,
          tb,
          vx: (ux / len) * speed,
          vy: energy * (0.05 + 0.45 * r(5)) * (p > 0.95 ? 1.6 : 1),
          vz: (uz / len) * speed * 0.8,
          tl: 0,
          yl: 0,
          shell: true,
        });
        flying.push({i: cubes.length - 1, t0: tb});
      }
    }
  }

  // Land loose cubes in time order on the height field.
  const fallTime = (y0: number, vy: number, h: number) => {
    const disc = vy * vy + 2 * GRAVITY * (y0 - h);
    return disc <= 0 ? vy / GRAVITY : (vy + Math.sqrt(disc)) / GRAVITY;
  };
  flying.sort((a, b) => {
    const ca = cubes[a.i];
    const cb = cubes[b.i];
    return a.t0 + fallTime(ca.y, ca.vy, 0) - (b.t0 + fallTime(cb.y, cb.vy, 0));
  });
  for (const f of flying) {
    const c = cubes[f.i];
    let t = fallTime(c.y, c.vy, 0);
    const key = () => `${Math.floor((c.x + S / 2 + c.vx * t) / S)},${Math.floor((c.z + S / 2 + c.vz * t) / S)}`;
    const h = field.get(key()) ?? 0;
    t = fallTime(c.y, c.vy, h);
    const k = key();
    const h2 = field.get(k) ?? 0;
    field.set(k, h2 + S * 0.92);
    cubes[f.i] = {...c, tl: t, yl: h2};
  }

  return {broken, barR, barRest, crushEnd: IMPACT + crushDur, bulge: 26 * crush * (1 - crush) * 4, cubes};
};

const FACE_SHADE = {top: 0.16, front: -0.02, right: -0.26, left: -0.14, back: -0.2};

const cubeFaces = (
  x: number,
  y: number,
  z: number,
  s: number,
  color: string,
  tone: number,
  key: string,
  line: number,
) => {
  const c = (dx: number, dy: number, dz: number) => {
    const q = project(x + dx * s, y + dy * s, z + dz * s);
    return [q[0], q[1]] as P2;
  };
  const faces: React.ReactNode[] = [];
  const stroke = `rgba(40,20,8,${line})`;
  const face = (id: string, list: P2[], amt: number) =>
    faces.push(<polygon key={key + id} points={pts(list)} fill={shade(color, amt + tone)} stroke={stroke} strokeWidth={1} />);
  if (EYE.z < z) {
    face('f', [c(0, 0, 0), c(1, 0, 0), c(1, 1, 0), c(0, 1, 0)], FACE_SHADE.front);
  }
  if (EYE.x > x + s) {
    face('r', [c(1, 0, 0), c(1, 0, 1), c(1, 1, 1), c(1, 1, 0)], FACE_SHADE.right);
  } else if (EYE.x < x) {
    face('l', [c(0, 0, 0), c(0, 0, 1), c(0, 1, 1), c(0, 1, 0)], FACE_SHADE.left);
  }
  if (EYE.y > y + s) {
    face('t', [c(0, 1, 0), c(1, 1, 0), c(1, 1, 1), c(0, 1, 1)], FACE_SHADE.top);
  }
  return faces;
};

const Bar: React.FC<{readonly y: number; readonly r: number; readonly tilt: number}> = ({y, r, tilt}) => {
  const half = BAR_LEN / 2 + r * 1.5;
  const a = project(-half, y - tilt, 0);
  const b = project(half, y + tilt, 0);
  const ra = r * scaleAt(a[2]);
  const rb = r * scaleAt(b[2]);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const rm = (ra + rb) / 2;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <>
      <defs>
        <linearGradient
          id="barSteel"
          gradientUnits="userSpaceOnUse"
          x1={mx - nx * rm}
          y1={my - ny * rm}
          x2={mx + nx * rm}
          y2={my + ny * rm}
        >
          <stop offset="0" stopColor="#E8EDF2" />
          <stop offset="0.22" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#9AA3AD" />
          <stop offset="0.8" stopColor="#5D6670" />
          <stop offset="1" stopColor="#3C434B" />
        </linearGradient>
      </defs>
      <polygon
        points={pts([
          [a[0] - nx * ra, a[1] - ny * ra],
          [b[0] - nx * rb, b[1] - ny * rb],
          [b[0] + nx * rb, b[1] + ny * rb],
          [a[0] + nx * ra, a[1] + ny * ra],
        ])}
        fill="url(#barSteel)"
      />
      <ellipse
        cx={b[0]}
        cy={b[1]}
        rx={rb * 0.32}
        ry={rb}
        transform={`rotate(${angle.toFixed(2)} ${b[0].toFixed(1)} ${b[1].toFixed(1)})`}
        fill="#B9C1C9"
        stroke="#7D868F"
        strokeWidth={2}
      />
    </>
  );
};

export const CubeBlock: React.FC<{
  readonly seed: string;
  readonly weight: number;
  readonly t: number;
  readonly palette: readonly string[];
}> = ({seed, weight, t, palette}) => {
  const pl = useMemo(() => plan(seed, weight, palette), [seed, weight, palette]);
  const keep = H - pl.broken;

  // Bar height: free fall, then pushing down through the crushed layers.
  const topRest = TOP + pl.barR;
  let barY: number;
  if (t < IMPACT) {
    const dt = IMPACT - t;
    barY = topRest + 12 * dt + 0.5 * GRAVITY * dt * dt;
  } else if (pl.broken === 0) {
    const a = t - IMPACT;
    barY = topRest + 22 * Math.abs(Math.sin(a * 0.42)) * Math.exp(-a / 4);
  } else {
    barY = topRest - (topRest - pl.barRest) * easeOut((t - IMPACT) / (pl.crushEnd - IMPACT));
  }
  const tilt = pl.broken >= H ? 26 * smooth((t - pl.crushEnd) / 10) : 0;

  const env = smooth((t - IMPACT) / 7) * (1 - 0.45 * smooth((t - IMPACT - 14) / 24));
  const items: {d: number; node: React.ReactNode}[] = [];
  pl.cubes.forEach((c, i) => {
    let {x, y, z} = c;
    if (t < c.tb) {
      if (!c.shell) {
        return;
      }
      if (keep > 0 && pl.bulge > 0) {
        const k = pl.bulge * env * Math.sin((Math.PI * (y + S / 2)) / (keep * S));
        x += ((x + S / 2) / ((W * S) / 2)) * k;
        z += ((z + S / 2) / ((D * S) / 2)) * k * 0.7;
      }
    } else {
      const a = Math.min(t - c.tb, c.tl);
      x += c.vx * a;
      z += c.vz * a;
      y = t - c.tb >= c.tl ? c.yl : y + c.vy * a - 0.5 * GRAVITY * a * a;
    }
    const line = t < c.tb ? 0.32 : 0.45;
    items.push({d: depthOf(x + S / 2, y + S / 2, z + S / 2), node: cubeFaces(x, y, z, S, c.color, c.tone, `c${i}`, line)});
  });
  // Inside the rubble the bar sorts by its axis; resting on top it stays in front of the top layer.
  const barZ = pl.broken > 0 && t > IMPACT ? 0 : Z0 - 1;
  items.push({d: depthOf(0, barY, barZ), node: <Bar key="bar" y={barY} r={pl.barR} tilt={tilt} />});
  items.sort((p, q) => q.d - p.d);

  // Soft contact shadow under the block / pile.
  const spread = 1 + 1.4 * smooth((t - IMPACT) / 30) * clamp01(pl.broken / H);
  const sh = [
    [X0 * spread - 40, Z0 * spread - 30],
    [-X0 * spread + 40, Z0 * spread - 30],
    [-X0 * spread + 40, -Z0 * spread + 40],
    [X0 * spread - 40, -Z0 * spread + 40],
  ].map(([x, z]) => project(x, 0, z));

  return (
    <>
      <defs>
        <filter id="cubeShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      <polygon points={pts(sh)} fill="rgba(40,55,65,0.35)" filter="url(#cubeShadow)" />
      {items.map((it) => it.node)}
    </>
  );
};

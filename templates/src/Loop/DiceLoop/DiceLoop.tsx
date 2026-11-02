import {Audio} from '@remotion/media';
import {useMemo} from 'react';
import {AbsoluteFill, CalculateMetadataFunction, random, Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Counter} from '../Counter';
import {
  easeIn,
  easeOut,
  itemStart,
  lerp,
  locate,
  loopSounds,
  makeCycle,
  mod,
  shade,
  smooth,
  SoundEvent,
} from '../loop';

export const diceLoopSchema = z.object({
  seed: z.string(),
  cutFrames: z.number().int().min(8).max(30),
  topLabel: z.string(),
  bottomLabel: z.string(),
  sound: z.boolean(),
});

type Props = z.infer<typeof diceLoopSchema>;

// Scene in world pixels: x to the right, y up, z away from the camera.
const CELL = 62;
const DEPTH = 6;
const LAYERS = 4;
const DX = 0.72;
const DY = 0.45;
const GROUND = 1310;
const KX = 400;
const GAP = 34;
const BLADE_UP = LAYERS * CELL + 120;
const BLADE_H = 230;
const BOARD_FRONT = -3.4 * CELL;
const BOARD_BACK = (DEPTH + 1.3) * CELL;
// The loop starts a few cuts into the first block, so the first frame is mid-action.
const START_STEP = 4;

const px = (x: number, y: number, zz: number) => `${(x + zz * DX).toFixed(1)},${(GROUND - y - zz * DY).toFixed(1)}`;

type Material = {
  readonly cols: number;
  readonly pick: (y: number, z: number, r: number) => string;
};

const isRind = (y: number, zz: number) => y === 0 || y === LAYERS - 1 || zz === 0 || zz === DEPTH - 1;

const MATERIALS: Material[] = [
  // Cucumber: dark skin all round, pale flesh with seeds in the middle
  {cols: 12, pick: (y, zz, r) => (isRind(y, zz) ? (r < 0.3 ? '#2F6F33' : '#3E8E41') : r < 0.3 ? '#C4E3A4' : '#E6F5D4')},
  // Carrot: orange with a lighter core
  {
    cols: 10,
    pick: (y, zz, r) =>
      isRind(y, zz) ? (r < 0.4 ? '#E2620F' : '#EE7420') : zz > 1 && zz < DEPTH - 2 ? '#FFC27A' : '#FF8F2E',
  },
  // Layered soap with sprinkles on top
  {
    cols: 13,
    pick: (y, _zz, r) => (y === LAYERS - 1 && r < 0.18 ? '#FFFFFF' : ['#F7A8C0', '#FFE08A', '#9FE3C9', '#B9C3F5'][y]),
  },
  // Watermelon: green rind, pale layer, pink flesh with seeds
  {
    cols: 11,
    pick: (y, _zz, r) => (y === 0 ? '#2F6B3A' : y === 1 ? '#EAF5D0' : r < 0.12 ? '#2A2320' : '#FF5D73'),
  },
];

const cycleFor = (cutFrames: number) => makeCycle(MATERIALS.map((m) => m.cols * cutFrames));

const BELT_LENGTHS = MATERIALS.map((m) => m.cols * CELL + GAP);
const BELT_TOTAL = BELT_LENGTHS.reduce((a, b) => a + b, 0);
const beltStart = (n: number) => {
  const len = MATERIALS.length;
  let s = Math.floor(n / len) * BELT_TOTAL;
  for (let i = 0; i < mod(n, len); i++) {
    s += BELT_LENGTHS[i];
  }
  return s;
};

export const calculateDiceLoopMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  return {durationInFrames: cycleFor(props.cutFrames).total};
};

type Cube = {x: number; y: number; z: number; s: number; color: string; diced: number};

const CubeShape: React.FC<{readonly c: Cube}> = ({c}) => {
  const {x, y, z: zz, s, color} = c;
  const stroke = c.diced > 0 ? `rgba(0,0,0,${(0.14 * c.diced).toFixed(2)})` : 'none';
  return (
    <>
      <polygon
        points={`${px(x, y, zz)} ${px(x, y, zz + s)} ${px(x, y + s, zz + s)} ${px(x, y + s, zz)}`}
        fill={color}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <polygon
        points={`${px(x, y, zz)} ${px(x + s, y, zz)} ${px(x + s, y + s, zz)} ${px(x, y + s, zz)}`}
        fill={shade(color, -0.2)}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <polygon
        points={`${px(x, y + s, zz)} ${px(x + s, y + s, zz)} ${px(x + s, y + s, zz + s)} ${px(x, y + s, zz + s)}`}
        fill={shade(color, 0.2)}
        stroke={stroke}
        strokeWidth={1.5}
      />
    </>
  );
};

const Wall: React.FC = () => {
  const bricks = [];
  for (let row = 0; row < 11; row++) {
    for (let col = -1; col < 6; col++) {
      bricks.push(
        <rect
          key={`${row}-${col}`}
          x={col * 240 + (row % 2) * 120}
          y={row * 110}
          width={232}
          height={102}
          rx={6}
          fill={row % 3 === 1 ? '#383A41' : '#34363C'}
        />,
      );
    }
  }
  return (
    <>
      <rect x={0} y={0} width={1080} height={1920} fill="#26272C" />
      {bricks}
    </>
  );
};

const Board: React.FC<{readonly belt: number}> = ({belt}) => {
  const xl = -900;
  const xr = 1800;
  const grain = [];
  for (let i = -10; i < 30; i++) {
    const x = i * 2 * CELL - mod(belt, 2 * CELL);
    grain.push(
      <polyline
        key={i}
        points={`${px(x, 0, BOARD_FRONT)} ${px(x, 0, BOARD_BACK)}`}
        stroke="rgba(120,70,20,0.12)"
        strokeWidth={4}
      />,
    );
  }
  return (
    <>
      <polygon
        points={`${px(xl, 0, BOARD_FRONT)} ${px(xr, 0, BOARD_FRONT)} ${px(xr, 0, BOARD_BACK)} ${px(xl, 0, BOARD_BACK)}`}
        fill="#DDA764"
      />
      {grain}
      <rect x={0} y={GROUND - BOARD_FRONT * DY} width={1080} height={46} fill="#B5793C" />
      <rect x={0} y={GROUND - BOARD_FRONT * DY + 46} width={1080} height={1920} fill="#1E1F23" />
    </>
  );
};

const Blade: React.FC<{readonly yb: number}> = ({yb}) => {
  const z0 = -1.2 * CELL;
  const z1 = (DEPTH + 0.7) * CELL;
  const top = yb + BLADE_H;
  return (
    <>
      <defs>
        <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E939B" />
          <stop offset="0.55" stopColor="#C9CDD3" />
          <stop offset="1" stopColor="#E9ECEF" />
        </linearGradient>
      </defs>
      <polygon
        points={`${px(KX, yb, z0)} ${px(KX, yb, z1)} ${px(KX, top, z1)} ${px(KX, top, z0)}`}
        fill="url(#steel)"
      />
      <polyline points={`${px(KX, yb + 3, z0)} ${px(KX, yb + 3, z1)}`} stroke="#F7F9FB" strokeWidth={6} />
      <polyline points={`${px(KX, top, z0)} ${px(KX, top, z1)}`} stroke="#6E737B" strokeWidth={8} />
    </>
  );
};

const Handle: React.FC<{readonly yb: number}> = ({yb}) => {
  const y = yb + BLADE_H * 0.72;
  return (
    <>
      <polyline
        points={`${px(KX, y, -1.1 * CELL)} ${px(KX, y, -4.2 * CELL)}`}
        stroke="#3B2A20"
        strokeWidth={40}
        strokeLinecap="round"
      />
      <polyline
        points={`${px(KX, y + 8, -1.4 * CELL)} ${px(KX, y + 8, -3.9 * CELL)}`}
        stroke="#5A4232"
        strokeWidth={10}
        strokeLinecap="round"
      />
    </>
  );
};

// Knife height for a cut step: falls, chops at 20 %, rises, waits while the belt moves.
const bladeHeight = (fr: number) => {
  if (fr < 0.2) {
    return BLADE_UP * (1 - easeIn(fr / 0.2));
  }
  return BLADE_UP * easeOut((fr - 0.24) / 0.3);
};

export const DiceLoop: React.FC<Props> = ({seed, cutFrames: K, topLabel, bottomLabel, sound}) => {
  const frame = useCurrentFrame();
  const cycle = useMemo(() => cycleFor(K), [K]);
  const offset = START_STEP * K;
  const g = frame + offset;

  // Per-cube random numbers, keyed by material so every repeat of a block falls the same way.
  const rand = useMemo(
    () =>
      MATERIALS.map((mat, m) =>
        Array.from({length: mat.cols * LAYERS * DEPTH}, (_, i) =>
          Array.from({length: 5}, (__, j) => random(`${seed}-${m}-${i}-${j}`)),
        ),
      ),
    [seed],
  );

  const sounds = useMemo(() => {
    const chops: SoundEvent[] = [];
    const dings: SoundEvent[] = [];
    let i = 0;
    MATERIALS.forEach((mat, m) => {
      for (let k = 0; k < mat.cols; k++) {
        const f = cycle.starts[m] + k * K + 0.2 * K;
        const r = random(`${seed}-snd-${i}`);
        chops.push({
          frame: f,
          src: i % 3 === 2 ? 'https://remotion.media/switch.wav' : 'https://remotion.media/mouse-click.wav',
          volume: 0.35 + r * 0.2,
        });
        if (k === mat.cols - 1) {
          dings.push({frame: f + 2, src: 'https://remotion.media/ding.wav', volume: 0.18});
        }
        i++;
      }
    });
    return [...loopSounds(chops, offset, cycle.total, 15), ...loopSounds(dings, offset, cycle.total, 45)];
  }, [cycle, K, offset, seed]);

  const here = locate(cycle, g);
  const step = Math.floor(here.local / K);
  const fr = (here.local - step * K) / K;
  const cols = MATERIALS[here.m].cols;
  const belt = beltStart(here.n) + step * CELL + smooth((fr - 0.5) / 0.45) * (step === cols - 1 ? CELL + GAP : CELL);
  const yb = bladeHeight(fr);

  const right: Cube[] = [];
  const left: Cube[] = [];
  for (let n = here.n - 3; n <= here.n + 1; n++) {
    const m = mod(n, MATERIALS.length);
    const mat = MATERIALS[m];
    const start = itemStart(cycle, n);
    for (let k = 0; k < mat.cols; k++) {
      const baseX = KX - CELL + beltStart(n) + k * CELL - belt;
      if (baseX > 1250 || baseX < -500) {
        continue;
      }
      const a = g - (start + k * K + 0.2 * K);
      const prevCut = k === 0 || a >= -K;
      for (let y = 0; y < LAYERS; y++) {
        for (let zz = 0; zz < DEPTH; zz++) {
          const r = rand[m][(k * LAYERS + y) * DEPTH + zz];
          const color = mat.pick(y, zz, r[0]);
          if (a < 0) {
            // Solid block: only the faces that can be seen
            if (y === LAYERS - 1 || zz === 0 || prevCut) {
              right.push({x: baseX, y: y * CELL, z: zz * CELL, s: CELL, color, diced: 0});
            }
            continue;
          }
          // Cut: the slice falls apart into cubes that tumble toward the camera
          const diced = smooth(a / 3);
          const s = CELL * (1 - 0.14 * diced);
          const inset = (CELL - s) / 2;
          const p = easeOut((a - r[4] * 4) / 14);
          const lift = y / LAYERS;
          const tx = -(0.15 + r[1] * 0.9) * CELL * (0.4 + lift);
          const ty = (y * 0.32 + r[2] * 0.3) * CELL;
          const tz = (r[3] - 0.72) * CELL * 1.6 * (0.5 + lift);
          const hop = 4 * p * (1 - p) * CELL * 0.45 * r[4];
          left.push({
            x: baseX + inset - smooth(a / 4) * CELL * 0.18 + p * tx,
            y: lerp(y * CELL, ty, p) + hop,
            z: zz * CELL + inset + p * tz,
            s,
            color,
            diced,
          });
        }
      }
    }
  }
  const byDepth = (c1: Cube, c2: Cube) => -c1.x + c1.y - c1.z - (-c2.x + c2.y - c2.z);
  right.sort(byDepth);
  left.sort(byDepth);

  // Counters show the block under the knife; between blocks they hold the last total.
  const cuts = step + (fr >= 0.2 ? 1 : 0);
  const shown = cuts > 0 ? cuts : MATERIALS[mod(here.n - 1, MATERIALS.length)].cols;
  const since = cuts > 0 ? here.local - (cuts - 1) * K - 0.2 * K : here.local + 0.8 * K;

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Wall />
        <Board belt={belt} />
        <polygon
          points={`${px(KX - 14, 0, -0.8 * CELL)} ${px(KX + 10, 0, -0.8 * CELL)} ${px(KX + 10, 0, DEPTH * CELL)} ${px(KX - 14, 0, DEPTH * CELL)}`}
          fill="rgba(60,30,10,0.35)"
          opacity={1 - yb / BLADE_UP}
        />
        {right.map((c, i) => (
          <CubeShape key={`r${i}`} c={c} />
        ))}
        <Blade yb={yb} />
        {left.map((c, i) => (
          <CubeShape key={`l${i}`} c={c} />
        ))}
        <Handle yb={yb} />
      </svg>
      <Counter
        name="Top label"
        value={shown}
        label={topLabel}
        since={since}
        top={150}
        color="#F6F3EE"
        labelColor="#E8A94A"
      />
      <Counter
        name="Bottom label"
        value={shown * LAYERS * DEPTH}
        label={bottomLabel}
        since={since}
        top={1500}
        color="#F6F3EE"
        labelColor="#E8A94A"
      />
      {sound
        ? sounds.map((s) => (
            <Sequence key={`${s.src}-${s.frame}`} from={s.frame} durationInFrames={45} layout="none">
              <Audio src={s.src} volume={s.volume} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};

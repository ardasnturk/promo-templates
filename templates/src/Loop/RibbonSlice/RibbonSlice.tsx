import {Audio} from '@remotion/media';
import {zColor} from '@remotion/zod-types';
import {useMemo} from 'react';
import {AbsoluteFill, CalculateMetadataFunction, random, Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Counter} from '../Counter';
import {easeIn, easeOut, loopSounds, mod, shade, smooth, SoundEvent} from '../loop';

export const ribbonSliceSchema = z.object({
  seed: z.string(),
  sliceFrames: z.number().int().min(10).max(36),
  slicesPerBar: z.number().int().min(6).max(16),
  bars: z.array(z.array(zColor()).min(2).max(8)).min(2),
  label: z.string(),
  sound: z.boolean(),
});

type Props = z.infer<typeof ribbonSliceSchema>;

const TABLE = 1400;
const KX = 620;
const THICK = 44;
const BAR_H = 520;
const GAP = 46;
const OUT_STEP = 215;
const SEGMENTS = 28;
const BLADE_UP = BAR_H + 80;
// The loop starts a few slices into the first bar, so the first frame is mid-action.
const START_STEP = 3;

export const calculateRibbonSliceMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  return {durationInFrames: props.bars.length * props.slicesPerBar * props.sliceFrames};
};

const bladeHeight = (fr: number) => {
  if (fr < 0.2) {
    return BLADE_UP * (1 - easeIn(fr / 0.2));
  }
  return BLADE_UP * easeOut((fr - 0.24) / 0.3);
};

// A cut slice seen edge-on: a striped strip standing on its base that rolls
// up toward the left, tighter at the tip, like a soap curl.
const Curl: React.FC<{readonly x: number; readonly curl: number; readonly colors: string[]}> = ({x, curl, colors}) => {
  const len = BAR_H / SEGMENTS;
  const pts: [number, number][] = [[x + THICK / 2, TABLE]];
  const angles: number[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    angles.push(curl * Math.pow(i / SEGMENTS, 1.6));
  }
  for (let i = 0; i < SEGMENTS; i++) {
    const [px, py] = pts[i];
    const a = (angles[i] + angles[i + 1]) / 2;
    pts.push([px - len * Math.sin(a), py - len * Math.cos(a)]);
  }
  const edge = (i: number, side: number): string => {
    const a = angles[i];
    return `${(pts[i][0] + side * Math.cos(a) * (THICK / 2)).toFixed(1)},${(pts[i][1] - side * Math.sin(a) * (THICK / 2)).toFixed(1)}`;
  };
  const quads = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const color = colors[Math.floor((i * colors.length) / SEGMENTS)];
    quads.push(
      <polygon
        key={i}
        points={`${edge(i, -1)} ${edge(i, 1)} ${edge(i + 1, 1)} ${edge(i + 1, -1)}`}
        fill={color}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />,
    );
  }
  return <g>{quads}</g>;
};

export const RibbonSlice: React.FC<Props> = ({seed, sliceFrames: K, slicesPerBar: NS, bars, label, sound}) => {
  const frame = useCurrentFrame();
  const total = bars.length * NS;
  const loop = total * K;
  const offset = START_STEP * K;
  const g = frame + offset;
  const s = Math.floor(g / K);
  const fr = (g - s * K) / K;
  const move = smooth((fr - 0.5) / 0.45);
  const yb = bladeHeight(fr);

  // Belt position of slice j on the input belt (bars are separated by a gap).
  const posOf = (j: number) => j * THICK + Math.floor(j / NS) * GAP;
  const beltIn = posOf(s) + move * (posOf(s + 1) - posOf(s));
  const stepPos = s + move;
  const colorsOf = (j: number) => bars[Math.floor(mod(j, total) / NS)];

  const sounds = useMemo(() => {
    const cuts: SoundEvent[] = [];
    const dings: SoundEvent[] = [];
    for (let j = 0; j < total; j++) {
      const f = j * K + 0.2 * K;
      cuts.push({
        frame: f,
        src: j % 4 === 3 ? 'https://remotion.media/switch.wav' : 'https://remotion.media/mouse-click.wav',
        volume: 0.3 + random(`${seed}-snd-${j}`) * 0.2,
      });
      if (j % NS === NS - 1) {
        dings.push({frame: f + 4, src: 'https://remotion.media/ding.wav', volume: 0.2});
      }
    }
    return [...loopSounds(cuts, offset, loop, 15), ...loopSounds(dings, offset, loop, 45)];
  }, [total, K, NS, offset, loop, seed]);

  // Uncut bars to the right of the blade
  const barRects = [];
  const firstBar = Math.floor(s / NS);
  for (let b = firstBar; b <= firstBar + 2; b++) {
    const firstUncut = Math.max(b * NS, b === firstBar ? s + (fr >= 0.2 ? 1 : 0) : b * NS);
    const lastSlice = (b + 1) * NS - 1;
    if (firstUncut > lastSlice) {
      continue;
    }
    const x0 = KX - THICK + posOf(firstUncut) - beltIn;
    const x1 = KX + posOf(lastSlice) - beltIn;
    if (x0 > 1100) {
      continue;
    }
    const colors = colorsOf(b * NS);
    const layerH = BAR_H / colors.length;
    barRects.push(
      <g key={b}>
        <rect x={x0 + 8} y={TABLE - BAR_H + 10} width={x1 - x0} height={BAR_H} fill="rgba(90,50,20,0.12)" />
        {colors.map((c, i) => (
          <rect key={i} x={x0} y={TABLE - (i + 1) * layerH} width={x1 - x0} height={layerH + 0.5} fill={c} />
        ))}
        <rect x={x0} y={TABLE - BAR_H} width={x1 - x0} height={10} fill="rgba(255,255,255,0.35)" />
      </g>,
    );
  }

  // Cut slices curl and ride the output belt to the left
  const curls = [];
  for (let j = s - 6; j <= s; j++) {
    const a = g - (j * K + 0.2 * K);
    if (a < 0) {
      continue;
    }
    const x = KX - THICK - (stepPos - j) * OUT_STEP - smooth(a / 5) * 14;
    if (x < -BAR_H) {
      continue;
    }
    const wobble = Math.exp(-a / 9) * Math.sin(a * 0.5) * 0.25;
    const curl = Math.PI * 1.8 * easeOut(a / 24) + wobble * smooth(a / 6);
    curls.push(<Curl key={j} x={x} curl={curl} colors={colorsOf(j)} />);
  }

  const treads = [];
  for (let i = -2; i < 20; i++) {
    const xo = i * 70 - mod(stepPos * OUT_STEP, 70);
    if (xo < KX - 40) {
      treads.push(<rect key={`o${i}`} x={xo} y={TABLE + 18} width={12} height={36} rx={6} fill="rgba(255,255,255,0.18)" />);
    }
    const xi = KX + 10 + i * 70 - mod(beltIn, 70);
    if (xi > KX) {
      treads.push(<rect key={`i${i}`} x={xi} y={TABLE + 18} width={12} height={36} rx={6} fill="rgba(255,255,255,0.18)" />);
    }
  }

  const done = mod(s, NS) + (fr >= 0.2 ? 1 : 0);
  const since = done > 0 ? g - (s * K + 0.2 * K) : g - ((s - 1) * K + 0.2 * K);
  const bladeBottom = TABLE - yb;

  return (
    <AbsoluteFill style={{backgroundColor: '#FBEFE3'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect x={0} y={TABLE + 72} width={1080} height={600} fill="#E9CBA7" />
        <rect x={-40} y={TABLE} width={KX + 30} height={72} rx={30} fill="#7A5C4A" />
        <rect x={KX + 4} y={TABLE} width={600} height={72} rx={30} fill="#6A4E3E" />
        {treads}
        {barRects}
        {curls}
        <rect x={KX - 9} y={bladeBottom - 220} width={18} height={220} fill="#C9CDD3" />
        <rect x={KX - 9} y={bladeBottom - 220} width={6} height={220} fill="#EEF1F4" />
        <rect x={KX - 70} y={bladeBottom - 300} width={140} height={80} rx={26} fill="#E07A5F" />
        <rect x={KX - 52} y={bladeBottom - 288} width={104} height={14} rx={7} fill={shade('#E07A5F', 0.3)} />
      </svg>
      <Counter
        name="Label"
        value={done > 0 ? done : NS}
        label={label}
        since={since}
        top={130}
        color="#3B2A1E"
        labelColor="#E07A5F"
      />
      {sound
        ? sounds.map((e) => (
            <Sequence key={`${e.src}-${e.frame}`} from={e.frame} durationInFrames={45} layout="none">
              <Audio src={e.src} volume={e.volume} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};

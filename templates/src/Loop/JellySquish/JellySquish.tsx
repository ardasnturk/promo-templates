import {Audio} from '@remotion/media';
import {zColor} from '@remotion/zod-types';
import {useMemo} from 'react';
import {AbsoluteFill, CalculateMetadataFunction, random, Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Counter} from '../Counter';
import {easeIn, easeOut, loopSounds, mod, shade, smooth, SoundEvent} from '../loop';

export const jellySquishSchema = z.object({
  seed: z.string(),
  stepFrames: z.number().int().min(16).max(40),
  perFlavor: z.number().int().min(3).max(10),
  flavors: z.array(z.object({name: z.string(), color: zColor()})).min(2),
  sound: z.boolean(),
});

type Props = z.infer<typeof jellySquishSchema>;

const BELT = 1420;
const PX = 540;
const SPACING = 340;
const W0 = 230;
const H0 = 200;
const SQUISH = 0.5 * H0;
const SETTLED = 0.8 * H0;
const PLATE_UP = H0 + 130;
const PLATE_W = 340;
const INK = '#3A2B4A';
// The loop starts mid-batch so the first frame is already busy.
const START_STEP = 2;

export const calculateJellySquishMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  return {durationInFrames: props.flavors.length * props.perFlavor * props.stepFrames};
};

// Plate height above the belt during one step: falls, squishes, rises, waits.
const plateHeight = (fr: number) => {
  if (fr < 0.24) {
    return PLATE_UP - (PLATE_UP - SQUISH) * easeIn(fr / 0.24);
  }
  if (fr < 0.32) {
    return SQUISH;
  }
  return SQUISH + (PLATE_UP - SQUISH) * easeOut((fr - 0.32) / 0.28);
};

const Jelly: React.FC<{
  readonly x: number;
  readonly h: number;
  readonly color: string;
  readonly mood: 'calm' | 'squished' | 'happy';
}> = ({x, h, color, mood}) => {
  const w = (W0 * H0) / h;
  const top = BELT - h;
  const d = `M ${x - w / 2} ${BELT} C ${x - w / 2} ${BELT - h * 0.78} ${x - w * 0.3} ${top} ${x} ${top} C ${x + w * 0.3} ${top} ${x + w / 2} ${BELT - h * 0.78} ${x + w / 2} ${BELT} Z`;
  const ey = BELT - h * 0.5;
  const ex = Math.min(w * 0.19, 46);
  return (
    <g>
      <ellipse cx={x} cy={BELT + 4} rx={w * 0.52} ry={14} fill="rgba(40,20,60,0.18)" />
      <path d={d} fill={color} stroke={shade(color, -0.18)} strokeWidth={5} />
      <ellipse cx={x - w * 0.2} cy={top + h * 0.22} rx={w * 0.11} ry={h * 0.08} fill="white" opacity={0.5} />
      {mood === 'calm' ? (
        <>
          <circle cx={x - ex} cy={ey} r={11} fill={INK} />
          <circle cx={x + ex} cy={ey} r={11} fill={INK} />
          <path d={`M ${x - 16} ${ey + 22} Q ${x} ${ey + 34} ${x + 16} ${ey + 22}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'squished' ? (
        <>
          <path d={`M ${x - ex - 12} ${ey - 10} L ${x - ex + 8} ${ey} L ${x - ex - 12} ${ey + 10}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M ${x + ex + 12} ${ey - 10} L ${x + ex - 8} ${ey} L ${x + ex + 12} ${ey + 10}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={x} cy={ey + 18} rx={11} ry={7} fill={INK} />
        </>
      ) : null}
      {mood === 'happy' ? (
        <>
          <path d={`M ${x - ex - 13} ${ey + 4} Q ${x - ex} ${ey - 14} ${x - ex + 13} ${ey + 4}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d={`M ${x + ex - 13} ${ey + 4} Q ${x + ex} ${ey - 14} ${x + ex + 13} ${ey + 4}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          <ellipse cx={x - ex - 20} cy={ey + 24} rx={16} ry={9} fill="#FF6F9C" opacity={0.55} />
          <ellipse cx={x + ex + 20} cy={ey + 24} rx={16} ry={9} fill="#FF6F9C" opacity={0.55} />
          <path d={`M ${x - 20} ${ey + 20} Q ${x} ${ey + 42} ${x + 20} ${ey + 20} Z`} fill={INK} />
        </>
      ) : null}
    </g>
  );
};

const Sparkles: React.FC<{readonly x: number; readonly t: number; readonly seed: string; readonly color: string}> = ({
  x,
  t,
  seed,
  color,
}) => {
  if (t < 0 || t > 20) {
    return null;
  }
  const p = easeOut(t / 20);
  return (
    <>
      {Array.from({length: 7}, (_, i) => {
        const r = (k: number) => random(`${seed}-${i}-${k}`);
        const dx = (r(0) - 0.5) * 420 * p;
        const dy = -(80 + r(1) * 200) * p;
        const s = (18 + r(2) * 18) * (1 - p * 0.6);
        const cx = x + dx;
        const cy = BELT - SETTLED * 0.6 + dy;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy - s} Q ${cx} ${cy} ${cx + s} ${cy} Q ${cx} ${cy} ${cx} ${cy + s} Q ${cx} ${cy} ${cx - s} ${cy} Q ${cx} ${cy} ${cx} ${cy - s} Z`}
            fill={i % 2 ? '#FFFFFF' : shade(color, 0.35)}
            opacity={1 - p}
          />
        );
      })}
    </>
  );
};

const Press: React.FC<{readonly plate: number}> = ({plate}) => {
  const plateTop = BELT - plate - 44;
  return (
    <>
      <rect x={PX - 22} y={560} width={44} height={plateTop - 560} fill="#B7B3C6" />
      <rect x={PX - 10} y={560} width={8} height={plateTop - 560} fill="#D9D6E4" />
      <rect x={PX - PLATE_W / 2} y={plateTop} width={PLATE_W} height={44} rx={18} fill="#9D97B3" />
      <rect x={PX - PLATE_W / 2 + 14} y={plateTop + 6} width={PLATE_W - 28} height={8} rx={4} fill="#C9C4DA" />
      <rect x={PX - 150} y={470} width={300} height={100} rx={30} fill="#7E7896" />
      <circle cx={PX} cy={520} r={16} fill="#FFD84D" />
    </>
  );
};

export const JellySquish: React.FC<Props> = ({seed, stepFrames: K, perFlavor: B, flavors, sound}) => {
  const frame = useCurrentFrame();
  const total = flavors.length * B;
  const loop = total * K;
  const offset = START_STEP * K;
  const g = frame + offset;
  const s = Math.floor(g / K);
  const fr = (g - s * K) / K;
  const belt = s * SPACING + smooth((fr - 0.55) / 0.43) * SPACING;
  const plate = plateHeight(fr);

  const flavorOf = (j: number) => flavors[Math.floor(mod(j, total) / B)];

  const sounds = useMemo(() => {
    const presses: SoundEvent[] = [];
    const dings: SoundEvent[] = [];
    for (let j = 0; j < total; j++) {
      const f = j * K + 0.22 * K;
      presses.push({
        frame: f,
        src: j % 3 === 1 ? 'https://remotion.media/mouse-click.wav' : 'https://remotion.media/switch.wav',
        volume: 0.35 + random(`${seed}-snd-${j}`) * 0.2,
      });
      if (j % B === B - 1) {
        dings.push({frame: f + 6, src: 'https://remotion.media/ding.wav', volume: 0.22});
      }
    }
    return [...loopSounds(presses, offset, loop, 15), ...loopSounds(dings, offset, loop, 45)];
  }, [total, K, B, offset, loop, seed]);

  const jellies = [];
  const sparkles = [];
  for (let j = s - 3; j <= s + 3; j++) {
    const x = PX + j * SPACING - belt;
    const color = flavorOf(j).color;
    const pressAt = j * K;
    const a = g - pressAt;
    let h: number;
    let mood: 'calm' | 'squished' | 'happy' = 'calm';
    if (a < 0) {
      h = H0 * (1 + 0.03 * Math.sin(a * 0.21));
    } else if (a < 0.32 * K) {
      h = Math.min(H0, plateHeight(a / K));
      mood = h < H0 * 0.8 ? 'squished' : 'calm';
    } else {
      const t = a - 0.32 * K;
      const wobble = SETTLED - (SETTLED - SQUISH) * Math.exp(-t / 6) * Math.cos(t * 0.55);
      h = j === s ? Math.min(plate, wobble) : wobble;
      mood = t < 3 ? 'squished' : 'happy';
      sparkles.push(<Sparkles key={`s${j}`} x={x} t={t - 2} seed={`${seed}-${mod(j, total)}`} color={color} />);
    }
    jellies.push(<Jelly key={j} x={x} h={h} color={color} mood={mood} />);
  }

  const treads = [];
  for (let i = -2; i < 22; i++) {
    const x = i * 60 - mod(belt, 60);
    treads.push(<rect key={i} x={x} y={BELT + 16} width={10} height={40} rx={5} fill="rgba(255,255,255,0.12)" />);
  }

  // Counter: presses done in the current flavor; between flavors it holds the full batch.
  const done = mod(s, B) + (fr >= 0.22 ? 1 : 0);
  const labelFlavor = done > 0 ? flavorOf(s) : flavorOf(s - 1);
  const since = done > 0 ? g - (s * K + 0.22 * K) : g - ((s - 1) * K + 0.22 * K);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFE6EF 0%, #EDE4FF 100%)'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect x={0} y={BELT + 70} width={1080} height={600} fill="#E2D6F5" />
        <rect x={-40} y={BELT} width={1160} height={72} rx={36} fill="#5D5478" />
        {treads}
        <Press plate={plate} />
        {jellies}
        {sparkles}
      </svg>
      <Counter
        name="Flavor label"
        value={done > 0 ? done : B}
        label={labelFlavor.name}
        since={since}
        top={130}
        color="#43355E"
        labelColor={shade(labelFlavor.color, -0.25)}
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

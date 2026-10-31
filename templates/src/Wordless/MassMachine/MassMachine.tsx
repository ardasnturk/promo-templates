import {Audio} from '@remotion/media';
import {useMemo} from 'react';
import {AbsoluteFill, CalculateMetadataFunction, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  ARENA_R,
  ARM_LEN,
  ARM_W,
  BALL_R,
  BOX_H,
  BOX_W,
  CX,
  CY,
  PIVOT_X,
  PIVOT_Y,
  BUMPERS,
  simulate,
} from './simulate';

export const massMachineSchema = z.object({
  seed: z.string(),
  maxBalls: z.number().int().min(50).max(2000),
  sound: z.boolean(),
});

type Props = z.infer<typeof massMachineSchema>;

const FPS = 30;
const MAX_FRAMES = 50 * FPS;
const TAIL = 2 * FPS;

// One color per generation; the starting blue never comes back when it cycles.
const GEN_COLORS = [
  '#3B6CF6',
  '#F5C518',
  '#6CC832',
  '#E14ADB',
  '#22D3EE',
  '#FF8A1F',
  '#F43F5E',
  '#A78BFA',
  '#2DD4A0',
  '#FFFFFF',
  '#FF5FA2',
  '#C6F432',
];
const genColor = (g: number) => (g === 0 ? GEN_COLORS[0] : GEN_COLORS[1 + ((g - 1) % (GEN_COLORS.length - 1))]);

const BG = '#0B0D18';
const METAL = '#9C9EA8';
const METAL_DARK = '#6E7079';
const METAL_EDGE = '#C9CBD3';

const runSim = (p: Props) => simulate({seed: p.seed, maxBalls: p.maxBalls, maxFrames: MAX_FRAMES, tailFrames: TAIL});

export const calculateMassMachineMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  const sim = runSim(props);
  return {durationInFrames: Math.max(15 * FPS, sim.totalFrames)};
};

const Machine: React.FC<{angle: number}> = ({angle}) => {
  const deg = (angle * 180) / Math.PI;
  return (
    <g transform={`rotate(${-deg} ${PIVOT_X} ${PIVOT_Y})`}>
      <rect
        x={PIVOT_X - ARM_W / 2}
        y={PIVOT_Y}
        width={ARM_W}
        height={ARM_LEN - BOX_H / 2}
        rx={ARM_W / 2}
        fill={METAL}
        stroke={METAL_EDGE}
        strokeWidth={2}
      />
      <g transform={`translate(${PIVOT_X} ${PIVOT_Y + ARM_LEN})`}>
        <rect
          x={-BOX_W / 2}
          y={-BOX_H / 2}
          width={BOX_W}
          height={BOX_H}
          rx={10}
          fill={METAL}
          stroke={METAL_EDGE}
          strokeWidth={3}
        />
        {[-40, -14, 12].map((yy) => (
          <rect key={yy} x={-26} y={yy - 8} width={52} height={14} rx={3} fill={METAL_DARK} />
        ))}
        <circle cx={0} cy={BOX_H / 2 - 30} r={10} fill="none" stroke={METAL_DARK} strokeWidth={4} />
      </g>
      <circle cx={PIVOT_X} cy={PIVOT_Y} r={14} fill={METAL_EDGE} stroke={METAL_DARK} strokeWidth={4} />
    </g>
  );
};

export const MassMachine: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const sim = useMemo(() => runSim(props), [props]);
  const f = Math.min(frame, sim.totalFrames - 1);
  const pos = sim.pos[f];
  const gen = sim.gen[f];
  const n = gen.length;

  // The box rim glows in the new color while it presses.
  const press = [...sim.presses].reverse().find((p) => p.frame <= f);
  const flash = press ? interpolate(f - press.frame, [0, 4, 18], [0, 1, 0], {extrapolateRight: 'clamp'}) : 0;
  const flashColor = press ? genColor(press.gen) : '#fff';

  const balls = [];
  for (let i = 0; i < n; i++) {
    balls.push(<circle key={i} cx={pos[i * 2]} cy={pos[i * 2 + 1]} r={BALL_R} fill={genColor(gen[i])} />);
  }

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <clipPath id="arena">
            <circle cx={CX} cy={CY} r={ARENA_R} />
          </clipPath>
        </defs>
        <g clipPath="url(#arena)">
          {BUMPERS.map((b, i) => (
            <g key={i}>
              <circle cx={b.x} cy={b.y} r={b.r} fill={METAL} stroke={METAL_EDGE} strokeWidth={3} />
              <circle cx={b.x} cy={b.y} r={b.r * 0.35} fill={METAL_DARK} />
            </g>
          ))}
          {balls}
          <Machine angle={sim.angles[f]} />
          <g
            transform={`rotate(${(-sim.angles[f] * 180) / Math.PI} ${PIVOT_X} ${PIVOT_Y})`}
            opacity={flash}
          >
            <rect
              x={PIVOT_X - BOX_W / 2 - 4}
              y={PIVOT_Y + ARM_LEN - BOX_H / 2 - 4}
              width={BOX_W + 8}
              height={BOX_H + 8}
              rx={12}
              fill="none"
              stroke={flashColor}
              strokeWidth={6}
            />
          </g>
        </g>
        <circle cx={CX} cy={CY} r={ARENA_R} fill="none" stroke="#D9DBE3" strokeWidth={4} />
      </svg>
      {props.sound
        ? sim.presses.map((p) => (
            <Sequence key={p.frame} from={p.frame} durationInFrames={15} layout="none">
              <Audio src="https://remotion.media/switch.wav" volume={0.45} />
            </Sequence>
          ))
        : null}
      {props.sound && sim.capFrame !== null ? (
        <Sequence from={sim.capFrame} layout="none">
          <Audio src="https://remotion.media/ding.wav" volume={0.5} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

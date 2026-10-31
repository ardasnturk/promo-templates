import {Audio} from '@remotion/media';
import {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fontFamily} from '../fonts';
import {ARENA_RADIUS, simulate} from './simulate';

const TRAIL = 22;
const CENTER_Y = 1020;

const useSimulation = () => {
  const {durationInFrames} = useVideoConfig();
  return useMemo(() => simulate(durationInFrames), [durationInFrames]);
};

const Arena: React.FC = () => {
  const frame = useCurrentFrame();
  const {frames, bounceFrames, filledAt} = useSimulation();

  const lastBounce = [...bounceFrames].reverse().find((b) => b <= frame);
  const flash =
    lastBounce === undefined
      ? 0
      : interpolate(frame - lastBounce, [0, 8], [1, 0], {
          extrapolateRight: 'clamp',
        });

  const current = frames[frame];
  const hue = (current.bounces * 11) % 360;
  const filled = filledAt !== null && frame >= filledAt;
  const pulse = filled
    ? interpolate(frame - (filledAt ?? 0), [0, 6, 20], [1, 1.08, 1], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      })
    : 1;

  const trail = [];
  for (let i = TRAIL; i >= 1; i--) {
    const f = frame - i;
    if (f < 0 || filled) {
      continue;
    }
    const p = frames[f];
    const t = 1 - i / TRAIL;
    trail.push(
      <circle
        key={i}
        cx={p.x}
        cy={p.y}
        r={p.r}
        fill={`hsl(${(p.bounces * 11) % 360} 95% 60%)`}
        opacity={t * 0.35}
      />,
    );
  }

  return (
    <svg
      width={1080}
      height={1080}
      viewBox="-540 -540 1080 1080"
      style={{position: 'absolute', left: 0, top: CENTER_Y - 540, scale: pulse}}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        r={ARENA_RADIUS + 6}
        fill="none"
        stroke={`hsl(${hue} 95% ${55 + flash * 25}%)`}
        strokeWidth={8 + flash * 10}
        filter="url(#glow)"
      />
      {trail}
      <circle
        cx={current.x}
        cy={current.y}
        r={current.r}
        fill={`hsl(${hue} 95% 60%)`}
        stroke="white"
        strokeWidth={4}
        filter="url(#glow)"
      />
    </svg>
  );
};

const Counter: React.FC = () => {
  const frame = useCurrentFrame();
  const {frames, bounceFrames} = useSimulation();
  const lastBounce = [...bounceFrames].reverse().find((b) => b <= frame);
  const pop =
    lastBounce === undefined
      ? 1
      : interpolate(frame - lastBounce, [0, 6], [1.18, 1], {
          extrapolateRight: 'clamp',
        });

  return (
    <div
      style={{
        position: 'absolute',
        top: 1520,
        width: '100%',
        textAlign: 'center',
        fontFamily,
        fontWeight: 900,
        fontSize: 150,
        color: 'white',
        scale: pop,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {frames[frame].bounces}
      <div style={{fontSize: 44, fontWeight: 700, opacity: 0.6}}>bounces</div>
    </div>
  );
};

const BounceSounds: React.FC = () => {
  const {bounceFrames} = useSimulation();
  return (
    <>
      {bounceFrames.map((f) => (
        <Sequence key={f} from={f} durationInFrames={8} layout="none">
          <Audio src="https://remotion.media/mouse-click.wav" volume={0.7} />
        </Sequence>
      ))}
    </>
  );
};

export const BouncingBall: React.FC = () => {
  const {fps} = useVideoConfig();
  const {filledAt} = useSimulation();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{backgroundColor: '#07060f'}}>
      <Interactive.Div
        name="Hook"
        style={{
          position: 'absolute',
          top: 170,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontFamily,
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.1,
          color: 'white',
          opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        It grows with every bounce… Can it fill the circle? 🤔
      </Interactive.Div>
      <Arena />
      <Counter />
      <BounceSounds />
      {filledAt !== null ? (
        <Sequence name="Filled" from={filledAt}>
          <Audio src="https://remotion.media/anime-wow.wav" volume={0.8} />
          <FilledBanner />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const FilledBanner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        top: 1020 - 960,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Interactive.Div
        name="Filled text"
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 150,
          color: '#07060f',
          scale: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.spring({damping: 12}),
            output: 'perceptual-scale',
          }),
          translate: '0px 0px',
        }}
      >
        FILLED!
      </Interactive.Div>
      <Interactive.Div
        name="CTA"
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 56,
          color: '#07060f',
          opacity: interpolate(frame, [1 * fps, 1.5 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        What was your guess? 👇
      </Interactive.Div>
    </AbsoluteFill>
  );
};

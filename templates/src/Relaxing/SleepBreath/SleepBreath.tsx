import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Interactive,
  interpolate,
  random,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {fontFamily} from '../../fonts';

export const sleepBreathSchema = z.object({
  seed: z.string(),
  // 3 rounds would run past the 50 s limit.
  rounds: z.number().int().min(1).max(2),
});

type Props = z.infer<typeof sleepBreathSchema>;

// 4-7-8 breathing: one round. `from`/`to` are the orb scale at the start/end of the phase.
const PHASES = [
  {name: 'Breathe in', seconds: 4, from: 0.5, to: 1},
  {name: 'Hold', seconds: 7, from: 1, to: 1},
  {name: 'Breathe out', seconds: 8, from: 1, to: 0.5},
];
const ROUND = PHASES.reduce((s, p) => s + p.seconds, 0);
const INTRO = 3; // seconds
const OUTRO = 5; // seconds
const FPS = 30;
const REST_SCALE = 0.5;
const SEAM = 1.2; // seconds: CTA crossfades back to the intro label at the end
const ease = Easing.inOut(Easing.sin);
const TAU = Math.PI * 2;

export const calculateSleepBreathMetadata: CalculateMetadataFunction<Props> = ({props}) => ({
  durationInFrames: (INTRO + props.rounds * ROUND + OUTRO) * FPS,
});

const usePhase = (rounds: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps - INTRO;
  const active = t >= 0 && t < rounds * ROUND;
  const round = Math.min(rounds - 1, Math.max(0, Math.floor(t / ROUND)));
  let within = t - round * ROUND;
  let index = 0;
  while (index < PHASES.length - 1 && within >= PHASES[index].seconds) {
    within -= PHASES[index].seconds;
    index++;
  }
  return {active, round, index, phase: PHASES[index], within};
};

// Everything below is periodic with the video length so the platform loop is seamless.
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const hue = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [228, 246, 228], {
    easing: ease,
  });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 42%, hsl(${hue} 48% 20%) 0%, hsl(${hue + 6} 55% 9%) 55%, hsl(${hue + 10} 60% 4%) 100%)`,
      }}
    />
  );
};

const Stars: React.FC<{seed: string}> = ({seed}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = frame / durationInFrames;
  const stars = [];
  for (let i = 0; i < 70; i++) {
    const x = random(`${seed}-sx${i}`) * 1080;
    const y = random(`${seed}-sy${i}`) * 1920;
    const size = 2 + random(`${seed}-ss${i}`) * 4;
    const cycles = 3 + Math.floor(random(`${seed}-sc${i}`) * 5);
    const offset = random(`${seed}-so${i}`) * TAU;
    const twinkle = 0.5 + 0.5 * Math.sin(p * cycles * TAU + offset);
    stars.push(
      <div
        key={`s${i}`}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: '#e6ecff',
          opacity: 0.15 + twinkle * 0.55,
        }}
      />,
    );
  }
  // Slowly rising dust; each speck wraps an integer number of times per video.
  for (let i = 0; i < 24; i++) {
    const x = random(`${seed}-dx${i}`) * 1080;
    const wraps = 1 + Math.floor(random(`${seed}-dw${i}`) * 2);
    const y = (((random(`${seed}-dy${i}`) - p * wraps) % 1) + 1) % 1;
    const size = 5 + random(`${seed}-dz${i}`) * 6;
    const sway = Math.sin(p * 4 * TAU + i) * 18;
    stars.push(
      <div
        key={`d${i}`}
        style={{
          position: 'absolute',
          left: x + sway,
          top: y * 2000 - 40,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: '#a9b8ff',
          opacity: 0.12 + random(`${seed}-do${i}`) * 0.2,
        }}
      />,
    );
  }
  return <AbsoluteFill>{stars}</AbsoluteFill>;
};

const RING = 820;
const STROKE = 10;
const CIRC = Math.PI * (RING - STROKE);

const Orb: React.FC<{rounds: number}> = ({rounds}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {active, phase, within} = usePhase(rounds);
  const scale = active
    ? interpolate(within, [0, phase.seconds], [phase.from, phase.to], {easing: ease})
    : REST_SCALE;
  const progress = active ? within / phase.seconds : 0;
  const ringOpacity = active
    ? interpolate(within, [0, 0.3, phase.seconds - 0.3, phase.seconds], [0, 1, 1, 0])
    : 0;
  const glow = 0.5 + 0.5 * Math.sin((frame / durationInFrames) * 12 * TAU);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', top: -60}}>
      <div
        style={{
          width: 740,
          height: 740,
          borderRadius: 370,
          scale: String(scale),
          background:
            'radial-gradient(circle at 40% 35%, #fdfcf5 0%, #cfd9ff 28%, #6d83e8 65%, rgba(60,80,190,0.25) 100%)',
          boxShadow: `0 0 ${110 + glow * 50}px rgba(150,170,255,0.55)`,
        }}
      />
      <svg width={RING} height={RING} style={{position: 'absolute', rotate: '-90deg'}}>
        <circle
          cx={RING / 2}
          cy={RING / 2}
          r={(RING - STROKE) / 2}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={3}
        />
        <circle
          cx={RING / 2}
          cy={RING / 2}
          r={(RING - STROKE) / 2}
          fill="none"
          stroke="#dfe6ff"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress)}
          opacity={ringOpacity * 0.8}
        />
      </svg>
    </AbsoluteFill>
  );
};

const PhaseLabel: React.FC<{rounds: number}> = ({rounds}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const {active, phase, within, round} = usePhase(rounds);
  const end = (INTRO + rounds * ROUND) * fps;
  // Hidden during the CTA, then back at the very end so the last frame matches frame 0.
  const visible = interpolate(
    frame,
    [end - 1, end, durationInFrames - SEAM * fps, durationInFrames - 1],
    [1, 0, 0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease},
  );
  const count = Math.max(1, Math.ceil(phase.seconds - within));
  const fade = active
    ? interpolate(within, [0, 0.4, phase.seconds - 0.3, phase.seconds], [0.2, 1, 1, 0.2], {
        extrapolateRight: 'clamp',
      })
    : 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: 1390,
        width: '100%',
        textAlign: 'center',
        fontFamily,
        color: 'white',
        opacity: visible,
      }}
    >
      <div style={{opacity: fade}}>
        <div style={{fontWeight: 700, fontSize: 92}}>{active ? phase.name : 'Get comfortable'}</div>
        <div style={{fontWeight: 500, fontSize: 72, opacity: 0.7, marginTop: 6}}>
          {active ? count : 'Relax your jaw'}
        </div>
      </div>
      {active ? (
        <div style={{fontWeight: 500, fontSize: 44, opacity: 0.45, marginTop: 24}}>
          Round {round + 1} of {rounds}
        </div>
      ) : null}
    </div>
  );
};

export const SleepBreath: React.FC<Props> = ({seed, rounds}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const end = (INTRO + rounds * ROUND) * fps;

  return (
    <AbsoluteFill style={{backgroundColor: '#060a1c'}}>
      <Backdrop />
      <Stars seed={seed} />
      <Orb rounds={rounds} />
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
          fontSize: 88,
          lineHeight: 1.1,
          whiteSpace: 'pre-line',
          color: 'white',
        }}
      >
        Can't sleep?{'\n'}Watch this 🌙
      </Interactive.Div>
      <PhaseLabel rounds={rounds} />
      <Sequence name="Outro" from={end} durationInFrames={durationInFrames - end}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  return (
    <Interactive.Div
      name="Save CTA"
      style={{
        position: 'absolute',
        top: 1390,
        left: 80,
        right: 80,
        textAlign: 'center',
        fontFamily,
        fontWeight: 700,
        fontSize: 64,
        lineHeight: 1.25,
        whiteSpace: 'pre-line',
        color: 'white',
        opacity: interpolate(
          frame,
          [0, 0.8 * fps, durationInFrames - SEAM * fps, durationInFrames - 1],
          [0, 1, 1, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease},
        ),
      }}
    >
      May help you drift off 💤{'\n'}Save this for tonight.
    </Interactive.Div>
  );
};

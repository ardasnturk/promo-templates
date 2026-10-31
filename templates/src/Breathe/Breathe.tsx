import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  random,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fontFamily} from '../fonts';

const INTRO = 2; // seconds
const PHASE = 4; // seconds per phase (box breathing 4-4-4-4)
const CYCLES = 2;
const PHASES = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];

const usePhase = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps - INTRO;
  const total = CYCLES * PHASES.length;
  const index = Math.min(total - 1, Math.max(0, Math.floor(t / PHASE)));
  const within = Math.min(PHASE, Math.max(0, t - index * PHASE));
  const active = t >= 0 && t < total * PHASE;
  return {t, index, phase: index % PHASES.length, within, active};
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const hue = interpolate(frame, [0, durationInFrames], [230, 290]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, hsl(${hue} 45% 22%) 0%, hsl(${hue + 20} 50% 8%) 70%)`,
      }}
    />
  );
};

const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = [];
  for (let i = 0; i < 40; i++) {
    const x = random(`px${i}`) * 1080;
    const speed = 0.3 + random(`ps${i}`) * 0.7;
    const y = (((random(`py${i}`) * 1920 - frame * speed) % 1920) + 1920) % 1920;
    const size = 3 + random(`pz${i}`) * 6;
    dots.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x + Math.sin(frame / 40 + i) * 20,
          top: y,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: 'white',
          opacity: 0.15 + random(`po${i}`) * 0.35,
        }}
      />,
    );
  }
  return <AbsoluteFill>{dots}</AbsoluteFill>;
};

const Orb: React.FC = () => {
  const {phase, within, active, t} = usePhase();
  const ease = Easing.inOut(Easing.sin);
  let scale = 0.5;
  if (active) {
    if (phase === 0) {
      scale = interpolate(within, [0, PHASE], [0.5, 1], {easing: ease});
    } else if (phase === 1) {
      scale = 1;
    } else if (phase === 2) {
      scale = interpolate(within, [0, PHASE], [1, 0.5], {easing: ease});
    }
  }
  const glowPulse = 0.6 + 0.4 * Math.sin(t * 2);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          width: 760,
          height: 760,
          borderRadius: 380,
          scale: String(scale),
          background:
            'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.9) 0%, #a5b4fc 30%, #7c3aed 70%, rgba(124,58,237,0.2) 100%)',
          boxShadow: `0 0 ${120 + glowPulse * 80}px rgba(167,139,250,0.7)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: 400,
          border: '3px solid rgba(255,255,255,0.18)',
        }}
      />
    </AbsoluteFill>
  );
};

const PhaseLabel: React.FC = () => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const {phase, within, active} = usePhase();
  const count = Math.max(1, Math.ceil(PHASE - within));
  const fade = active
    ? interpolate(within, [0, 0.4, PHASE - 0.3, PHASE], [0, 1, 1, 0.3], {
        extrapolateRight: 'clamp',
      })
    : interpolate(frame, [0, 1 * fps], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        position: 'absolute',
        top: 1440,
        width: '100%',
        textAlign: 'center',
        fontFamily,
        color: 'white',
        opacity: fade,
      }}
    >
      <div style={{fontWeight: 700, fontSize: 92}}>
        {active ? PHASES[phase] : 'Ready?'}
      </div>
      <div style={{fontWeight: 500, fontSize: 64, opacity: 0.65, marginTop: 10}}>
        {active ? count : 'Relax your shoulders'}
      </div>
    </div>
  );
};

export const Breathe: React.FC = () => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const end = (INTRO + CYCLES * PHASES.length * PHASE) * fps;

  return (
    <AbsoluteFill>
      <Backdrop />
      <Particles />
      <Orb />
      <Interactive.Div
        name="Hook"
        style={{
          position: 'absolute',
          top: 190,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontFamily,
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.1,
          color: 'white',
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Calm down in 30 seconds 🌙
      </Interactive.Div>
      <Sequence name="Breathing labels" durationInFrames={end} layout="none">
        <PhaseLabel />
      </Sequence>
      <Sequence name="Outro" from={end}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Interactive.Div
      name="Save CTA"
      style={{
        position: 'absolute',
        top: 1420,
        left: 80,
        right: 80,
        textAlign: 'center',
        fontFamily,
        fontWeight: 700,
        fontSize: 64,
        lineHeight: 1.25,
        whiteSpace: 'pre-line',
        color: 'white',
        opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      Feel better? 🤍{'\n'}Save it for when you need it.
    </Interactive.Div>
  );
};

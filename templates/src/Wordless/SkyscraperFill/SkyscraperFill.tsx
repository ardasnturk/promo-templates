import {Audio} from '@remotion/media';
import {useMemo} from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  interpolate,
  random,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {
  BALL_R,
  BASE_Y,
  CX,
  OUTLINE,
  PHASES,
  RAIL_Y,
  SPIRE_FALL,
  SPIRE_RELEASE,
  Simulation,
  TIERS,
  TIP_Y,
  aimX,
  phaseAt,
  simulate,
} from './simulate';

export const skyscraperFillSchema = z.object({
  seed: z.string(),
  palette: z.object({
    background: z.string(),
    // Steel pilasters and spandrels, most common first.
    facade: z.array(z.string()).min(1),
    // Dark (unlit) window glass.
    glass: z.string(),
    // Lit window shades.
    lit: z.array(z.string()).min(1),
    // Crown, setback trim and spire.
    trim: z.string(),
    lobby: z.string(),
  }),
  // Share of windows that are lit (0–1).
  litShare: z.number().min(0).max(1),
  sound: z.boolean(),
});

type Props = z.infer<typeof skyscraperFillSchema>;

const LINE = '#8E929C';
const RAIL = '#5E626C';
const RAIL_EDGE = '#A3A7B0';

const runSim = (seed: string) => simulate(seed);

export const calculateSkyscraperFillMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  const sim = runSim(props.seed);
  return {durationInFrames: sim.totalFrames};
};

// Facade grid: window columns every 80 px around the center line, floors
// every 80 px above the lobby.
const COL = 80;
const WIN_HALF_W = 26;
const FLOOR = 80;
const LOBBY = 90;
const WIN_TOP = 62; // window spans floorBottom − WIN_TOP … floorBottom − WIN_BOTTOM
const WIN_BOTTOM = 12;

const tierAt = (y: number) => {
  for (const t of TIERS) {
    if (y >= t.top - 2 && y <= t.bottom + 2) {
      return t;
    }
  }
  return null;
};

// Target picture: every ball already carries the color of the spot it will
// settle in, so the lit facade appears from the bottom up.
const ballColors = (sim: Simulation, p: Props) => {
  const {palette} = p;
  const n = sim.kept.length;
  const colors: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = sim.finalX[i];
    const y = sim.finalY[i];
    if (!sim.kept[i]) {
      colors.push(palette.facade[0]);
      continue;
    }
    const tier = tierAt(y);
    // Crown and the chamfered setbacks are gold trim.
    if (!tier || tier === TIERS[0]) {
      colors.push(palette.trim);
      continue;
    }
    if (y > BASE_Y - LOBBY) {
      colors.push(Math.abs(x - CX) < 70 ? palette.trim : palette.lobby);
      continue;
    }
    const dx = x - CX;
    const col = Math.round((dx - COL / 2) / COL);
    const colX = col * COL + COL / 2;
    const floor = Math.floor((BASE_Y - LOBBY - y) / FLOOR);
    const floorBottom = BASE_Y - LOBBY - floor * FLOOR;
    const inWindow =
      Math.abs(dx - colX) < WIN_HALF_W &&
      Math.abs(colX) + WIN_HALF_W < tier.half - 12 &&
      y > floorBottom - WIN_TOP &&
      y < floorBottom - WIN_BOTTOM;
    if (inWindow) {
      const on = random(`${p.seed}-win-${col}-${floor}`) < p.litShare;
      colors.push(
        on ? palette.lit[Math.floor(random(`${p.seed}-shade-${col}-${floor}`) * palette.lit.length)] : palette.glass,
      );
      continue;
    }
    colors.push(palette.facade[Math.floor(random(`${p.seed}-steel-${i}`) * palette.facade.length)]);
  }
  return colors;
};

const outlinePath = OUTLINE.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');

// Piano-like line: pitched ding notes. Semitones above the base note C.
const BASE_TONE = 0.5;
const tone = (semitones: number) => BASE_TONE * 2 ** (semitones / 12);
// C – G – Am – F, one bar of eight arpeggiated notes per chord.
const CHORDS = [
  [0, 4, 7, 12, 16],
  [-1, 2, 7, 11, 14],
  [0, 4, 9, 12, 16],
  [0, 5, 9, 12, 17],
];
const PATTERN = [0, 1, 2, 3, 4, 3, 2, 1];
const NOTE_STEP = [10, 8, 6]; // frames per note in each pouring phase
const CASCADE = [24, 19, 16, 12, 7, 4, 0];
const FINAL_CHORD = [0, 4, 7, 12];

const Spire: React.FC<{y: number; color: string}> = ({y, color}) => (
  // y is the bottom of the spire's base, which seals the roof opening.
  <g>
    <rect x={CX - 66} y={y - 26} width={132} height={26} rx={6} fill={color} />
    <path d={`M${CX - 44} ${y - 26} L${CX} ${y - 110} L${CX + 44} ${y - 26} Z`} fill={color} />
    <rect x={CX - 4} y={y - 190} width={8} height={90} rx={4} fill={color} />
  </g>
);

const Spawner: React.FC<{frame: number; landFrame: number}> = ({frame, landFrame}) => {
  const phase = phaseAt(frame);
  // The rail lifts away after dropping the spire.
  const lift = interpolate(frame, [landFrame, landFrame + 25], [0, -320], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const nozzles: React.ReactNode[] = [];
  PHASES.forEach((ph, pi) => {
    if (pi > phase) {
      return;
    }
    const next = PHASES[pi + 1];
    // Nozzles slide out from where the previous outlets were.
    const t = interpolate(frame, [ph.from, ph.from + 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.6)),
    });
    const gone = next ? frame >= next.from + 12 : false;
    if (gone) {
      return;
    }
    ph.outlets.forEach((x0, k) => {
      const from = pi === 0 ? x0 : PHASES[pi - 1].outlets[Math.floor((k * PHASES[pi - 1].outlets.length) / ph.outlets.length)];
      const x = from + (x0 - from) * t;
      const dx = aimX(x0) - x0;
      const tilt = (Math.atan2(dx, TIP_Y - RAIL_Y) * 180) / Math.PI;
      nozzles.push(
        <g key={`${pi}-${k}`} transform={`translate(${x} ${RAIL_Y}) rotate(${-tilt})`}>
          <path d="M-22 -6 L22 -6 L13 34 L-13 34 Z" fill={RAIL} stroke={RAIL_EDGE} strokeWidth={3} strokeLinejoin="round" />
        </g>,
      );
    });
  });
  const halfW = interpolate(phase, [0, 1, 2], [70, 170, 300]);
  const prevHalf = interpolate(Math.max(0, phase - 1), [0, 1, 2], [70, 170, 300]);
  const grow = interpolate(frame, [PHASES[phase].from, PHASES[phase].from + 12], [prevHalf, halfW], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <g transform={`translate(0 ${lift})`}>
      <line x1={CX} y1={-10} x2={CX} y2={RAIL_Y - 20} stroke={RAIL_EDGE} strokeWidth={6} />
      {nozzles}
      <rect x={CX - grow} y={RAIL_Y - 26} width={grow * 2} height={26} rx={13} fill={RAIL} stroke={RAIL_EDGE} strokeWidth={3} />
    </g>
  );
};

// Remotion keys an audio asset by src, start and duration, so notes that
// start together (chord voices) need different durations.
const Note: React.FC<{from: number; semitones: number; volume: number; voice?: number}> = ({
  from,
  semitones,
  volume,
  voice = 0,
}) => (
  <Sequence from={from} durationInFrames={60 + voice} layout="none">
    <Audio src="https://remotion.media/ding.wav" volume={volume} toneFrequency={tone(semitones)} />
  </Sequence>
);

const Music: React.FC<{sim: Simulation; release: number; landFrame: number; waveEnd: number}> = ({
  sim,
  release,
  landFrame,
  waveEnd,
}) => {
  const {fps} = useVideoConfig();
  // Arpeggio while pouring; it speeds up as more outlets open.
  const notes: {frame: number; semitones: number; accent: boolean}[] = [];
  for (let c = 0, k = 0; c < release; k++) {
    const chord = CHORDS[Math.floor(k / PATTERN.length) % CHORDS.length];
    notes.push({frame: c, semitones: chord[PATTERN[k % PATTERN.length]], accent: k % PATTERN.length === 0});
    c += NOTE_STEP[phaseAt(c)];
  }
  const cascadeStep = (waveEnd - landFrame) / CASCADE.length;
  return (
    <>
      {notes.map((n) => (
        <Note key={`n${n.frame}`} from={n.frame} semitones={n.semitones} volume={n.accent ? 0.32 : 0.2} />
      ))}
      {sim.milestones.map((m) => (
        <Sequence key={`m${m}`} from={m} durationInFrames={20} layout="none">
          <Audio src="https://remotion.media/switch.wav" volume={0.25} />
        </Sequence>
      ))}
      <Sequence from={release} durationInFrames={fps} layout="none">
        <Audio src="https://remotion.media/whoosh.wav" volume={0.3} />
      </Sequence>
      {/* Chords are rolled one frame per voice, like a pianist's hand. */}
      {FINAL_CHORD.map((s, v) => (
        <Note key={`l${s}`} from={landFrame + v} semitones={s - 12} volume={0.25} voice={v} />
      ))}
      {CASCADE.map((s, k) => (
        <Note key={`c${k}`} from={Math.round(landFrame + 4 + k * cascadeStep)} semitones={s} volume={0.24} />
      ))}
      {FINAL_CHORD.map((s, v) => (
        <Note key={`f${s}`} from={waveEnd + 4 + v} semitones={s} volume={0.26} voice={v} />
      ))}
      <Sequence from={waveEnd + 4} durationInFrames={3 * fps} layout="none">
        <Audio src="https://remotion.media/ding.wav" volume={0.35} />
      </Sequence>
    </>
  );
};

const WAVE_SPEED = 26; // px per frame

export const SkyscraperFill: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const sim = useMemo(() => runSim(props.seed), [props.seed]);
  const colors = useMemo(() => ballColors(sim, props), [sim, props]);
  const f = Math.min(frame, sim.pos.length - 1);
  const pos = sim.pos[f];
  const n = pos.length / 2;
  const {palette} = props;

  const release = sim.fullFrame + SPIRE_RELEASE;
  const landFrame = release + SPIRE_FALL;
  const waveEnd = landFrame + 6 + Math.round((BASE_Y - TIP_Y) / WAVE_SPEED);
  // The spire falls with gravity from the rail and settles with a small bounce.
  const fallT = interpolate(frame, [release, landFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bounce = interpolate(frame, [landFrame, landFrame + 6, landFrame + 12], [0, -14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const spireY = RAIL_Y + 200 + (TIP_Y - RAIL_Y - 200) * fallT * fallT + bounce;

  // After landing: excess balls and the outline fade, the tower grows a
  // touch, and a light wave runs down from the spire.
  const done = interpolate(frame, [landFrame, landFrame + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const towerScale = interpolate(frame, [landFrame, landFrame + 15], [1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const balls: React.ReactNode[] = [];
  const glows: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = pos[i * 2];
    const y = pos[i * 2 + 1];
    if (Number.isNaN(x)) {
      continue;
    }
    const kept = sim.kept[i] === 1;
    const opacity = kept ? 1 : 1 - done;
    if (opacity <= 0) {
      continue;
    }
    const lightAt = landFrame + 6 + (y - TIP_Y) / WAVE_SPEED;
    const lit = kept
      ? interpolate(frame, [lightAt, lightAt + 5, lightAt + 16], [0, 1, 0.3], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
    balls.push(<circle key={i} cx={x} cy={y} r={BALL_R - 0.5} fill={colors[i]} opacity={opacity} />);
    if (lit > 0) {
      balls.push(<circle key={`h${i}`} cx={x} cy={y} r={BALL_R - 0.5} fill="#FFFFFF" opacity={lit * 0.25} />);
      // Only lit windows get a faint halo; steel and glass stay flat.
      if (palette.lit.includes(colors[i])) {
        glows.push(<circle key={`g${i}`} cx={x} cy={y} r={BALL_R * 1.8} fill={colors[i]} opacity={lit * 0.35} />);
      }
    }
  }

  // Sealed floors flash softly.
  const sealFlashes = sim.seals.map((s) => {
    const o = interpolate(frame, [s.frame, s.frame + 3, s.frame + 18], [0, 0.2, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    if (o <= 0) {
      return null;
    }
    return <rect key={s.frame} x={0} y={s.top} width={1080} height={s.bottom - s.top} fill="#FFFFFF" opacity={o} />;
  });

  return (
    <AbsoluteFill style={{backgroundColor: palette.background}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <clipPath id="tower-inside">
            <path d={`${outlinePath} Z`} />
          </clipPath>
        </defs>
        <Spawner frame={frame} landFrame={landFrame} />
        <line x1={120} y1={BASE_Y + 22} x2={960} y2={BASE_Y + 22} stroke={LINE} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
        <g transform={`translate(${CX} ${(TIP_Y + BASE_Y) / 2}) scale(${towerScale}) translate(${-CX} ${-(TIP_Y + BASE_Y) / 2})`}>
          {glows}
          {balls}
          <g clipPath="url(#tower-inside)">{sealFlashes}</g>
          <path
            d={outlinePath}
            fill="none"
            stroke={LINE}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={1 - done}
          />
          {frame >= release ? <Spire y={spireY} color={palette.trim} /> : null}
        </g>
      </svg>
      {props.sound ? <Music sim={sim} release={release} landFrame={landFrame} waveEnd={waveEnd} /> : null}
    </AbsoluteFill>
  );
};

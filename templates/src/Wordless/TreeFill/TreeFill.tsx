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
  STAR_FALL,
  STAR_RELEASE,
  Simulation,
  TIERS,
  TIP_Y,
  TRUNK_TOP,
  aimX,
  phaseAt,
  simulate,
} from './simulate';

export const treeFillSchema = z.object({
  seed: z.string(),
  background: z.string(),
  // Needle shades, most common first.
  greens: z.array(z.string()).min(1),
  garland: z.string(),
  ornaments: z.array(z.string()).min(1),
  trunk: z.string(),
  sound: z.boolean(),
});

type Props = z.infer<typeof treeFillSchema>;

const LINE = '#8E929C';
const RAIL = '#5E626C';
const RAIL_EDGE = '#A3A7B0';

const runSim = (seed: string) => simulate(seed);

export const calculateTreeFillMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  const sim = runSim(props.seed);
  return {durationInFrames: sim.totalFrames};
};

// Target picture: every ball already carries the color of the spot it will
// settle in, so the decorated tree appears from the bottom up.
const ballColors = (sim: Simulation, p: Props) => {
  const n = sim.kept.length;
  const colors: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = sim.finalX[i];
    const y = sim.finalY[i];
    if (!sim.kept[i]) {
      colors.push(p.greens[0]);
      continue;
    }
    if (y > TRUNK_TOP) {
      colors.push(p.trunk);
      continue;
    }
    // Garland: one swag per tier, sagging in the middle.
    let garland = false;
    for (const t of TIERS) {
      if (y > t.top && y < t.bottom) {
        const u = (x - CX) / t.half;
        const swagY = t.bottom - 92 + 44 * (1 - u * u);
        if (Math.abs(y - swagY) < 15) {
          garland = true;
        }
      }
    }
    if (garland) {
      colors.push(p.garland);
      continue;
    }
    const r = random(`${p.seed}-color-${i}`);
    if (r < 0.16) {
      colors.push(p.ornaments[Math.floor((r / 0.16) * p.ornaments.length)]);
      continue;
    }
    colors.push(p.greens[Math.floor(random(`${p.seed}-green-${i}`) * p.greens.length)]);
  }
  return colors;
};

const outlinePath = (() => {
  // Open at the tip: the last point is the left lip, not joined back.
  return OUTLINE.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
})();

const starPoints = (cx: number, cy: number, outer: number, inner: number) => {
  const pts: string[] = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const r = k % 2 === 0 ? outer : inner;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
};

const STAR_Y = TIP_Y - 26;

const Spawner: React.FC<{frame: number; landFrame: number}> = ({frame, landFrame}) => {
  const phase = phaseAt(frame);
  // The rail lifts away after dropping the star.
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

export const TreeFill: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sim = useMemo(() => runSim(props.seed), [props.seed]);
  const colors = useMemo(() => ballColors(sim, props), [sim, props]);
  const f = Math.min(frame, sim.pos.length - 1);
  const pos = sim.pos[f];
  const n = pos.length / 2;

  const release = sim.fullFrame + STAR_RELEASE;
  const landFrame = release + STAR_FALL;
  // Star falls with gravity from the rail and settles with a small bounce.
  const fallT = interpolate(frame, [release, landFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bounce = interpolate(frame, [landFrame, landFrame + 6, landFrame + 12], [0, -14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const starY = RAIL_Y + 10 + (STAR_Y - RAIL_Y - 10) * fallT * fallT + bounce;
  const starVisible = frame >= release;

  // After landing: excess balls fade, outline fades, the tree grows a touch,
  // and a light wave runs down from the star.
  const done = interpolate(frame, [landFrame, landFrame + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const treeScale = interpolate(frame, [landFrame, landFrame + 15], [1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const WAVE_SPEED = 26; // px per frame

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
    const dx = x - CX;
    const dy = y - STAR_Y;
    const lightAt = landFrame + 6 + Math.sqrt(dx * dx + dy * dy) / WAVE_SPEED;
    const lit = kept
      ? interpolate(frame, [lightAt, lightAt + 5, lightAt + 16], [0, 1, 0.35], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
    balls.push(<circle key={i} cx={x} cy={y} r={BALL_R - 0.5} fill={colors[i]} opacity={opacity} />);
    if (lit > 0) {
      balls.push(<circle key={`h${i}`} cx={x} cy={y} r={BALL_R - 0.5} fill="#FFFFFF" opacity={lit * 0.3} />);
      balls.push(<circle key={`s${i}`} cx={x - 4} cy={y - 4} r={3.5} fill="#FFFFFF" opacity={Math.min(1, lit * 1.6)} />);
      // Only ornaments and garland get a faint halo; needles stay flat.
      if (!props.greens.includes(colors[i])) {
        glows.push(<circle key={`g${i}`} cx={x} cy={y} r={BALL_R * 1.9} fill={colors[i]} opacity={lit * 0.3} />);
      }
    }
  }

  // Sealed rows flash softly.
  const sealFlashes = sim.seals.map((s) => {
    const o = interpolate(frame, [s.frame, s.frame + 3, s.frame + 18], [0, 0.22, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    if (o <= 0) {
      return null;
    }
    return <rect key={s.frame} x={0} y={s.top} width={1080} height={s.bottom - s.top} fill="#FFFFFF" opacity={o} />;
  });

  // Soft click rhythm while pouring, faster as more outlets open.
  const clicks: number[] = [];
  for (let c = 0; c < sim.fullFrame; ) {
    clicks.push(c);
    c += [15, 12, 10][phaseAt(c)];
  }

  return (
    <AbsoluteFill style={{backgroundColor: props.background}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <clipPath id="tree-inside">
            <path d={`${outlinePath} Z`} />
          </clipPath>
        </defs>
        <Spawner frame={frame} landFrame={landFrame} />
        <g transform={`translate(${CX} ${(TIP_Y + BASE_Y) / 2}) scale(${treeScale}) translate(${-CX} ${-(TIP_Y + BASE_Y) / 2})`}>
          {glows}
          {balls}
          <g clipPath="url(#tree-inside)">{sealFlashes}</g>
          <path
            d={outlinePath}
            fill="none"
            stroke={LINE}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={1 - done}
          />
          {starVisible ? (
            <polygon points={starPoints(CX, starY, 62, 26)} fill={props.garland} stroke="#FFF4C2" strokeWidth={3} strokeLinejoin="round" />
          ) : null}
        </g>
      </svg>
      {props.sound ? (
        <>
          {clicks.map((c) => (
            <Sequence key={`c${c}`} from={c} durationInFrames={10} layout="none">
              <Audio src="https://remotion.media/mouse-click.wav" volume={0.12} />
            </Sequence>
          ))}
          {PHASES.slice(1).map((ph) => (
            <Sequence key={`p${ph.from}`} from={ph.from} durationInFrames={20} layout="none">
              <Audio src="https://remotion.media/switch.wav" volume={0.4} />
            </Sequence>
          ))}
          {sim.seals.map((s) => (
            <Sequence key={`s${s.frame}`} from={s.frame} durationInFrames={fps} layout="none">
              <Audio src="https://remotion.media/ding.wav" volume={0.18} />
            </Sequence>
          ))}
          <Sequence from={release} durationInFrames={fps} layout="none">
            <Audio src="https://remotion.media/whoosh.wav" volume={0.3} />
          </Sequence>
          <Sequence from={landFrame} layout="none">
            <Audio src="https://remotion.media/ding.wav" volume={0.45} />
          </Sequence>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

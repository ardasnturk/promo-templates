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
import {BALL_R, CX, CY, RING_COUNT, RING_R, RING_W, cosP, simulate, sinP, Simulation} from './simulate';

export const ringEscapeSchema = z.object({
  seed: z.string(),
  colors: z.array(z.string()).min(2).max(12),
  sound: z.boolean(),
});

type Props = z.infer<typeof ringEscapeSchema>;

const FPS = 30;
const MAX_FRAMES = 55 * FPS;
const FINALE = 3 * FPS;
const BG = '#0B0D18';
const OUTLINE = '#05060C';
const RING_ACTIVE = '#E4E6EE';
const RING_IDLE = '#5B5E6C';
const PIECES = 14;
const PIECE_LIFE = 32;
const FADE = 26;

const runSim = (p: Props) => simulate({seed: p.seed, ballCount: p.colors.length, maxFrames: MAX_FRAMES});

export const calculateRingEscapeMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  const sim = runSim(props);
  return {durationInFrames: sim.frames + FINALE};
};

// SVG arc from angle a0 to a1 (clockwise in screen space) on radius r.
const arcPath = (r: number, a0: number, a1: number, ox = 0, oy = 0) => {
  const x0 = CX + ox + r * cosP(a0);
  const y0 = CY + oy + r * sinP(a0);
  const x1 = CX + ox + r * cosP(a1);
  const y1 = CY + oy + r * sinP(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
};

const ringRadius = (sim: Simulation, k: number, f: number) => (k === RING_COUNT - 1 ? sim.outerR[f] : RING_R[k]);

const Shards: React.FC<{sim: Simulation; ring: number; at: number; frame: number; seed: string}> = ({
  sim,
  ring,
  at,
  frame,
  seed,
}) => {
  const t = frame - at;
  if (t < 0 || t > PIECE_LIFE) {
    return null;
  }
  // The finale breaks the outer ring after the simulation ended: use its last state.
  const d = Math.min(at, sim.frames - 1);
  const r = ringRadius(sim, ring, d);
  const a = sim.ringAngle[d][ring];
  const h = sim.ringHalf[d][ring];
  const span = (Math.PI * 2 - h * 2) / PIECES;
  const p = t / PIECE_LIFE;
  const opacity = 1 - p * p;
  return (
    <g opacity={opacity}>
      {Array.from({length: PIECES}, (_, i) => {
        const a0 = a + h + i * span + span * 0.08;
        const a1 = a0 + span * 0.84;
        const mid = (a0 + a1) / 2;
        const speed = 6 + random(`${seed}-shard-${ring}-${i}`) * 8;
        const dist = speed * t * (1 - p * 0.4);
        const ox = cosP(mid) * dist;
        const oy = sinP(mid) * dist;
        const spinDeg = (random(`${seed}-spin-${ring}-${i}`) - 0.5) * 16 * t;
        const mx = CX + ox + r * cosP(mid);
        const my = CY + oy + r * sinP(mid);
        return (
          <path
            key={i}
            d={arcPath(r, a0, a1, ox, oy)}
            transform={`rotate(${spinDeg} ${mx} ${my})`}
            fill="none"
            stroke={t < 3 ? '#FFFFFF' : RING_ACTIVE}
            strokeWidth={RING_W}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

export const RingEscape: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const sim = useMemo(() => runSim(props), [props]);
  const {colors, seed} = props;
  const last = sim.frames - 1;
  const f = Math.min(frame, last);
  const winFrame = sim.winFrame ?? last;
  const winner = sim.winner ?? 0;
  const tWin = frame - winFrame; // > 0 during the finale
  const active = sim.activeRing[f];
  const pos = sim.pos[f];

  // Rings that are still standing.
  const rings = [];
  for (let k = active; k < RING_COUNT; k++) {
    const r = ringRadius(sim, k, f);
    const a = sim.ringAngle[f][k];
    const h = sim.ringHalf[f][k];
    rings.push(
      <path
        key={k}
        d={arcPath(r, a + h, a - h + Math.PI * 2)}
        fill="none"
        stroke={k === active ? RING_ACTIVE : RING_IDLE}
        strokeWidth={RING_W}
        strokeLinecap="round"
      />,
    );
  }
  // In the finale the outer ring shatters too.
  const outerBreak = winFrame + 18;
  const outerGone = frame >= outerBreak;

  const flashing = new Set(sim.hits.filter((h) => h.frame <= f && f - h.frame < 3).map((h) => h.ball));

  const balls = [];
  for (let i = 0; i < colors.length; i++) {
    const esc = sim.escapes.find((e) => e.ball === i);
    if (esc && frame > esc.frame) {
      // Eliminated: drifts out and fades.
      const t = frame - esc.frame;
      if (t > FADE) {
        continue;
      }
      const k = t / FADE;
      balls.push(
        <g key={i} opacity={1 - k}>
          <circle
            cx={esc.x + esc.vx * t}
            cy={esc.y + esc.vy * t}
            r={BALL_R * (1 - 0.5 * k)}
            fill={colors[i]}
            stroke={OUTLINE}
            strokeWidth={3}
          />
          <circle cx={esc.x} cy={esc.y} r={BALL_R + t * 3} fill="none" stroke={colors[i]} strokeWidth={4 * (1 - k)} />
        </g>,
      );
      continue;
    }
    let bx = pos[i * 2];
    let by = pos[i * 2 + 1];
    let r = BALL_R;
    if (i === winner && tWin > 0) {
      const k = interpolate(tWin, [0, 30], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.33, 0, 0.2, 1),
      });
      bx += (CX - bx) * k;
      by += (CY - by) * k;
      r = BALL_R * (1 + 1.6 * k) * (1 + 0.08 * interpolate(tWin % 15, [0, 4, 15], [0, 1, 0]));
    }
    balls.push(
      <circle
        key={i}
        cx={bx}
        cy={by}
        r={r}
        fill={flashing.has(i) ? '#FFFFFF' : colors[i]}
        stroke={OUTLINE}
        strokeWidth={3}
      />,
    );
  }

  // Wordless scoreboard: eliminated colors line up at the bottom.
  const out = sim.escapes.filter((e) => e.frame <= f);
  const dotGap = 56;
  const dotsX = CX - ((colors.length - 1) * dotGap) / 2;
  const dotsY = height - 230;

  const fillR = interpolate(tWin, [34, 62], [0, Math.sqrt(width * width + height * height)], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {outerGone ? null : rings}
        {sim.breaks.map((b) => (
          <Shards key={b.ring} sim={sim} ring={b.ring} at={b.frame} frame={frame} seed={seed} />
        ))}
        <Shards sim={sim} ring={RING_COUNT - 1} at={outerBreak} frame={frame} seed={seed} />
        {balls}
        {Array.from({length: colors.length}, (_, i) => (
          <circle
            key={i}
            cx={dotsX + i * dotGap}
            cy={dotsY}
            r={14}
            fill={out[i] ? colors[out[i].ball] : 'none'}
            stroke={out[i] ? OUTLINE : '#2A2D3A'}
            strokeWidth={3}
          />
        ))}
        {fillR > 0 ? <circle cx={CX} cy={CY} r={fillR} fill={colors[winner]} /> : null}
        {fillR > 0 ? (
          <circle
            cx={CX}
            cy={CY}
            r={BALL_R * 2.6 * (1 + 0.1 * interpolate(tWin % 20, [0, 6, 20], [0, 1, 0]))}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.55}
            strokeWidth={6}
          />
        ) : null}
      </svg>
      {props.sound ? (
        <>
          {sim.clicks.map((c) => (
            <Sequence key={`c${c}`} from={c} durationInFrames={10} layout="none">
              <Audio src="https://remotion.media/mouse-click.wav" volume={0.18} />
            </Sequence>
          ))}
          {sim.breaks.map((b) => (
            <Sequence key={`b${b.ring}`} from={b.frame} durationInFrames={fps} layout="none">
              <Audio src="https://remotion.media/whoosh.wav" volume={0.3} />
            </Sequence>
          ))}
          {sim.escapes.map((e) => (
            <Sequence key={`e${e.ball}`} from={e.frame} durationInFrames={fps * 1.5} layout="none">
              <Audio src="https://remotion.media/ding.wav" volume={0.4} />
            </Sequence>
          ))}
          <Sequence from={outerBreak} durationInFrames={fps} layout="none">
            <Audio src="https://remotion.media/whoosh.wav" volume={0.35} />
          </Sequence>
          <Sequence from={winFrame + 34} durationInFrames={fps * 2} layout="none">
            <Audio src="https://remotion.media/switch.wav" volume={0.4} />
          </Sequence>
          <Sequence from={winFrame + 60} durationInFrames={fps * 2} layout="none">
            <Audio src="https://remotion.media/ding.wav" volume={0.55} />
          </Sequence>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

import {Audio} from '@remotion/media';
import {useMemo} from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {BALL_R, simulate} from './simulate';

export const colorWarSchema = z.object({
  seed: z.string(),
  colors: z.array(z.string()).min(2).max(6),
  gridSize: z.number().int().min(12).max(40),
  sound: z.boolean(),
});

type Props = z.infer<typeof colorWarSchema>;

const FPS = 30;
const MAX_FRAMES = 50 * FPS;
const FINALE = 3 * FPS;
const BG = '#0D0F17';
const FRAME = '#2A2E3D';
const ARENA = 912;
const ARENA_X = (1080 - ARENA) / 2;
const ARENA_Y = 540;
const GAP = 2;
const POP = 5; // frames for a painted cell to grow to full size
const BAR_Y = 300;
const BAR_H = 26;
const CLICK_GAP = 4;

const runSim = (p: Props) =>
  simulate({seed: p.seed, colorCount: p.colors.length, gridSize: p.gridSize, maxFrames: MAX_FRAMES});

export const calculateColorWarMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  const sim = runSim(props);
  return {durationInFrames: sim.frames + FINALE};
};

// Mix a #RRGGBB color towards white.
const tint = (hex: string, k: number) => {
  const v = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((v >> s) & 255) + (255 - ((v >> s) & 255)) * k);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};

export const ColorWar: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const sim = useMemo(() => runSim(props), [props]);
  const {colors, gridSize: n} = props;
  const cell = ARENA / n;
  const last = sim.frames - 1;
  const f = Math.min(frame, last);
  const grid = sim.grids[f];
  const winFrame = sim.winFrame ?? last;
  const tWin = frame - winFrame;

  // Cells: a freshly painted cell pops from small to full size over the old color.
  const cells = [];
  for (let i = 0; i < n * n; i++) {
    const x = ARENA_X + (i % n) * cell + GAP / 2;
    const y = ARENA_Y + Math.floor(i / n) * cell + GAP / 2;
    const s = cell - GAP;
    // Frames since the cell last changed (the grid is frozen after the sim ends).
    let age = -1;
    let from = 0;
    for (let a = 0; frame - (f - a) < POP && f - a - 1 >= 0; a++) {
      if (sim.grids[f - a][i] !== sim.grids[f - a - 1][i]) {
        age = frame - (f - a);
        from = sim.grids[f - a - 1][i];
        break;
      }
    }
    if (age >= 0) {
      const k = interpolate(age, [0, POP - 1], [0.3, 1], {easing: Easing.out(Easing.back(2))});
      const ps = s * k;
      cells.push(
        <g key={i}>
          <rect x={x} y={y} width={s} height={s} rx={4} fill={colors[from]} />
          <rect
            x={x + (s - ps) / 2}
            y={y + (s - ps) / 2}
            width={ps}
            height={ps}
            rx={4}
            fill={age < 1 ? tint(colors[grid[i]], 0.5) : colors[grid[i]]}
          />
        </g>,
      );
    } else {
      cells.push(<rect key={i} x={x} y={y} width={s} height={s} rx={4} fill={colors[grid[i]]} />);
    }
  }

  // Balls fade out during the finale.
  const ballOpacity = interpolate(tWin, [0, 12], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const balls = [];
  const b = sim.balls[f];
  const r = BALL_R * cell * 1.2;
  for (let j = 0; j < b.length; j += 4) {
    const c = b[j + 2];
    balls.push(
      <circle
        key={b[j + 3]}
        cx={ARENA_X + b[j] * cell}
        cy={ARENA_Y + b[j + 1] * cell}
        r={r}
        fill={tint(colors[c], 0.6)}
        stroke="#FFFFFF"
        strokeWidth={2.5}
      />,
    );
  }

  // Rings: spawned balls (outward, light) and removed balls (shrinking).
  const rings = [];
  for (const s of sim.spawns) {
    const t = frame - s.frame;
    if (t >= 0 && t < 14) {
      rings.push(
        <circle
          key={`s${s.frame}-${s.c}`}
          cx={ARENA_X + s.x * cell}
          cy={ARENA_Y + s.y * cell}
          r={r + t * 3}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={1 - t / 14}
          strokeWidth={3}
        />,
      );
    }
  }
  for (const c of sim.captures) {
    const t = frame - c.frame;
    if (t >= 0 && t < 10) {
      rings.push(
        <circle
          key={`c${c.frame}-${c.c}-${c.x}`}
          cx={ARENA_X + c.x * cell}
          cy={ARENA_Y + c.y * cell}
          r={r * (1 - t / 10)}
          fill={tint(colors[c.c], 0.6)}
          stroke="#FFFFFF"
          strokeWidth={2}
          opacity={1 - t / 10}
        />,
      );
    }
  }

  // Elimination: a burst in the lost color from its last cell and a frame flash.
  let flash = 0;
  let flashColor = FRAME;
  for (const e of sim.eliminations) {
    const t = frame - e.frame;
    if (e.frame === sim.winFrame || t < 0 || t > 24) {
      continue;
    }
    const cx = ARENA_X + ((e.cell % n) + 0.5) * cell;
    const cy = ARENA_Y + (Math.floor(e.cell / n) + 0.5) * cell;
    rings.push(
      <circle
        key={`e${e.c}`}
        cx={cx}
        cy={cy}
        r={interpolate(t, [0, 24], [cell * 0.5, cell * 7], {easing: Easing.out(Easing.cubic)})}
        fill="none"
        stroke={colors[e.c]}
        strokeOpacity={1 - t / 24}
        strokeWidth={10 * (1 - t / 24) + 2}
      />,
    );
    const k = interpolate(t, [0, 3, 18], [0, 1, 0], {extrapolateRight: 'clamp'});
    if (k > flash) {
      flash = k;
      flashColor = colors[e.c];
    }
  }

  // Finale: the arena pulses in the winning color.
  const pulse =
    tWin > 0
      ? 1 + 0.035 * interpolate(tWin % 24, [0, 6, 24], [0, 1, 0]) * interpolate(tWin, [0, 72], [1, 0.3], {extrapolateRight: 'clamp'})
      : 1;
  const winGlow = tWin > 0 ? interpolate(tWin, [0, 4, 40], [0, 1, 0.25], {extrapolateRight: 'clamp'}) : 0;

  // Wordless leaderboard: share bar, one segment per surviving color.
  const counts = sim.counts[f];
  const alive = colors.map((_, c) => c).filter((c) => counts[c] > 0);
  const segGap = 6;
  const usable = ARENA - segGap * (alive.length - 1);
  let bx = ARENA_X;
  const segments = alive.map((c) => {
    const w = (counts[c] / (n * n)) * usable;
    const seg = <rect key={c} x={bx} y={BAR_Y} width={w} height={BAR_H} rx={BAR_H / 2} fill={colors[c]} />;
    bx += w + segGap;
    return seg;
  });

  const ox = ARENA_X + ARENA / 2;
  const oy = ARENA_Y + ARENA / 2;

  const clicks = useMemo(() => {
    const out: number[] = [];
    for (const p of sim.paints) {
      if (!out.length || p - out[out.length - 1] >= CLICK_GAP) {
        out.push(p);
      }
    }
    return out;
  }, [sim]);

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id="color-war-arena">
            <rect x={ARENA_X} y={ARENA_Y} width={ARENA} height={ARENA} />
          </clipPath>
        </defs>
        <rect x={ARENA_X} y={BAR_Y} width={ARENA} height={BAR_H} rx={BAR_H / 2} fill="#1A1D29" />
        {segments}
        <g transform={`translate(${ox} ${oy}) scale(${pulse}) translate(${-ox} ${-oy})`}>
          <rect
            x={ARENA_X - 14}
            y={ARENA_Y - 14}
            width={ARENA + 28}
            height={ARENA + 28}
            rx={18}
            fill="none"
            stroke={flash > 0 ? flashColor : FRAME}
            strokeOpacity={flash > 0 ? 0.35 + 0.65 * flash : 1}
            strokeWidth={6}
          />
          {cells}
          {winGlow > 0 ? (
            <rect
              x={ARENA_X - 14}
              y={ARENA_Y - 14}
              width={ARENA + 28}
              height={ARENA + 28}
              rx={18}
              fill="none"
              stroke={tint(colors[sim.winner ?? 0], 0.4)}
              strokeOpacity={winGlow}
              strokeWidth={10}
            />
          ) : null}
          <g opacity={ballOpacity} clipPath="url(#color-war-arena)">
            {balls}
            {rings}
          </g>
        </g>
      </svg>
      {props.sound ? (
        <>
          {clicks.map((c) => (
            <Sequence key={`c${c}`} from={c} durationInFrames={8} layout="none">
              <Audio src="https://remotion.media/mouse-click.wav" volume={0.14} />
            </Sequence>
          ))}
          {sim.eliminations
            .filter((e) => e.frame !== sim.winFrame)
            .map((e) => (
              <Sequence key={`e${e.c}`} from={e.frame} durationInFrames={fps} layout="none">
                <Audio src="https://remotion.media/switch.wav" volume={0.45} />
              </Sequence>
            ))}
          {sim.winFrame !== null ? (
            <Sequence from={sim.winFrame} durationInFrames={fps * 2} layout="none">
              <Audio src="https://remotion.media/ding.wav" volume={0.55} />
            </Sequence>
          ) : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

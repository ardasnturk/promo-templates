import {Audio} from '@remotion/media';
import {useMemo} from 'react';
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
import {buildPuzzle, Puzzle, rowComplete, SIZE} from './solver';

export const fifteenPuzzleSchema = z.object({
  seed: z.string(),
});

type Props = z.infer<typeof fifteenPuzzleSchema>;

export const OUTRO_FRAMES = 150;
const MIN_FRAMES = 15 * 30;

export const calculateFifteenPuzzleMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  return {
    durationInFrames: Math.max(MIN_FRAMES, buildPuzzle(props.seed).totalMoveFrames + OUTRO_FRAMES),
  };
};

const TILE = 196;
const GAP = 14;
const PAD = 22;
const BOARD = SIZE * TILE + (SIZE - 1) * GAP + PAD * 2;
const BOARD_LEFT = (1080 - BOARD) / 2;
const BOARD_TOP = 560;

const BASE = '#4f46e5';
const GREEN = '#22c55e';

const cellX = (cell: number) => PAD + (cell % SIZE) * (TILE + GAP);
const cellY = (cell: number) => PAD + Math.floor(cell / SIZE) * (TILE + GAP);
const goalRow = (tile: number) => Math.floor((tile - 1) / SIZE);

const Tile: React.FC<{
  readonly tile: number;
  readonly x: number;
  readonly y: number;
  readonly green: number;
  readonly scale: number;
}> = ({tile, x, y, green, scale}) => {
  const color = `color-mix(in srgb, ${GREEN} ${Math.round(green * 100)}%, ${BASE})`;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: TILE,
        height: TILE,
        borderRadius: 34,
        scale: String(scale),
        background: `linear-gradient(160deg, color-mix(in srgb, white 22%, ${color}) 0%, ${color} 55%, color-mix(in srgb, black 30%, ${color}) 100%)`,
        boxShadow: `inset 0 -10px 0 rgba(0,0,0,0.22), 0 0 ${Math.round(green * 46)}px color-mix(in srgb, ${GREEN} ${Math.round(green * 90)}%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontWeight: 900,
        fontSize: 104,
        color: 'white',
        textShadow: '0 6px 0 rgba(0,0,0,0.2)',
      }}
    >
      {tile}
    </div>
  );
};

const Board: React.FC<{readonly puzzle: Puzzle}> = ({puzzle}) => {
  const frame = useCurrentFrame();
  const {states, moves, starts, durations, totalMoveFrames} = puzzle;

  let k = 0;
  while (k < moves.length && frame >= starts[k] + durations[k]) {
    k++;
  }
  const state = states[k];
  const active = k < moves.length && frame >= starts[k] ? moves[k] : null;
  const p = active ? (frame - starts[k]) / durations[k] : 0;

  // Row glow blends from the state before the move to the state after it
  const rowGreen = Array.from({length: SIZE}, (_, r) => {
    const before = rowComplete(state, r) ? 1 : 0;
    const after = active ? (rowComplete(states[k + 1], r) ? 1 : 0) : before;
    return interpolate(p, [0.6, 1], [before, after], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  });

  // Whole board pulses once when solved
  const solvedPulse = interpolate(frame, [totalMoveFrames, totalMoveFrames + 8, totalMoveFrames + 24], [1, 1.04, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const tiles: React.ReactNode[] = [];
  state.forEach((tile, cell) => {
    if (tile === 0) {
      return;
    }
    let x = cellX(cell);
    let y = cellY(cell);
    let scale = 1;
    let row = Math.floor(cell / SIZE);
    if (active && active.from === cell) {
      const ease = Easing.inOut(Easing.cubic);
      x = interpolate(p, [0, 0.85], [cellX(active.from), cellX(active.to)], {extrapolateRight: 'clamp', easing: ease});
      y = interpolate(p, [0, 0.85], [cellY(active.from), cellY(active.to)], {extrapolateRight: 'clamp', easing: ease});
      scale = interpolate(p, [0, 0.4, 0.85, 1], [1, 1.07, 1, 1], {extrapolateRight: 'clamp'});
      row = Math.floor((p < 0.5 ? active.from : active.to) / SIZE);
    }
    const green = row === goalRow(tile) ? rowGreen[row] : 0;
    tiles.push(<Tile key={tile} tile={tile} x={x} y={y} green={green} scale={scale} />);
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: BOARD_LEFT,
        top: BOARD_TOP,
        width: BOARD,
        height: BOARD,
        borderRadius: 52,
        background: 'rgba(255,255,255,0.06)',
        border: '4px solid rgba(255,255,255,0.12)',
        scale: String(solvedPulse),
        boxShadow: frame >= totalMoveFrames ? `0 0 90px ${GREEN}88` : '0 30px 80px rgba(0,0,0,0.45)',
      }}
    >
      {Array.from({length: SIZE * SIZE}, (_, cell) => (
        <div
          key={cell}
          style={{
            position: 'absolute',
            left: cellX(cell),
            top: cellY(cell),
            width: TILE,
            height: TILE,
            borderRadius: 34,
            background: 'rgba(0,0,0,0.28)',
          }}
        />
      ))}
      {tiles}
    </div>
  );
};

const MoveCounter: React.FC<{readonly puzzle: Puzzle}> = ({puzzle}) => {
  const frame = useCurrentFrame();
  const done = puzzle.starts.filter((s, i) => frame >= s + puzzle.durations[i]).length;
  const solved = frame >= puzzle.totalMoveFrames;
  return (
    <div
      style={{
        position: 'absolute',
        top: 1470,
        width: '100%',
        textAlign: 'center',
        fontFamily,
        fontWeight: 700,
        fontSize: 56,
        color: solved ? GREEN : 'rgba(255,255,255,0.75)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      Move {done} / {puzzle.moves.length}
    </div>
  );
};

const CONFETTI_COLORS = ['#ff4d6d', '#ffd60a', '#3a86ff', '#22c55e', '#b5179e', '#ffffff'];

const Confetti: React.FC<{readonly seed: string}> = ({seed}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: 90}, (_, i) => {
        const r = (n: number) => random(`${seed}-confetti-${i}-${n}`);
        const t = Math.max(0, frame - r(0) * 12) / 30;
        const x = 540 + (r(1) - 0.5) * 300 + (r(2) - 0.5) * 1500 * t;
        const y = 1100 - (900 + r(3) * 700) * t + 0.5 * 2200 * t * t;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 18 + r(4) * 14,
              height: 10 + r(5) * 8,
              borderRadius: 3,
              background: CONFETTI_COLORS[Math.floor(r(6) * CONFETTI_COLORS.length)],
              rotate: `${(r(7) - 0.5) * 1440 * t}deg`,
              opacity: interpolate(frame, [100, 140], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Outro: React.FC<{readonly seed: string}> = ({seed}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Interactive.Div
        name="Perfect"
        style={{
          position: 'absolute',
          top: 1565,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontFamily,
          fontWeight: 900,
          fontSize: 104,
          color: 'white',
          scale: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.spring({damping: 10}),
            output: 'perceptual-scale',
          }),
        }}
      >
        PERFECT ✨
      </Interactive.Div>
      <Interactive.Div
        name="CTA"
        style={{
          position: 'absolute',
          top: 1710,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontFamily,
          fontWeight: 700,
          fontSize: 52,
          color: 'rgba(255,255,255,0.9)',
          opacity: interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Drop your guess in the comments 👇
      </Interactive.Div>
      <Confetti seed={seed} />
    </AbsoluteFill>
  );
};

export const FifteenPuzzle: React.FC<Props> = ({seed}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const puzzle = useMemo(() => buildPuzzle(seed), [seed]);

  // Frames where at least one row turns green
  const completions = useMemo(() => {
    const out: number[] = [];
    puzzle.moves.forEach((_, k) => {
      for (let r = 0; r < SIZE; r++) {
        if (!rowComplete(puzzle.states[k], r) && rowComplete(puzzle.states[k + 1], r)) {
          out.push(puzzle.starts[k] + puzzle.durations[k]);
          return;
        }
      }
    });
    return out;
  }, [puzzle]);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0f1430 0%, #1d0f3a 100%)'}}>
      <Interactive.Div
        name="Hook"
        style={{
          position: 'absolute',
          top: 150,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontFamily,
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.1,
          color: 'white',
          scale: interpolate(frame, [0, 0.4 * fps], [0.92, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
            output: 'perceptual-scale',
          }),
        }}
      >
        How many moves would it take you? 🤔
      </Interactive.Div>
      <Interactive.Div
        name="Subhook"
        style={{
          position: 'absolute',
          top: 400,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontFamily,
          fontWeight: 500,
          fontSize: 44,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        The A* algorithm finds the shortest path 🤖
      </Interactive.Div>
      <Board puzzle={puzzle} />
      <MoveCounter puzzle={puzzle} />

      {puzzle.starts.map((s, i) => (
        <Sequence key={s} from={s + puzzle.durations[i] - 2} durationInFrames={10} layout="none">
          <Audio src="https://remotion.media/switch.wav" volume={0.5} />
        </Sequence>
      ))}
      {completions.map((f) => (
        <Sequence key={f} from={f} durationInFrames={1 * fps} layout="none">
          <Audio src="https://remotion.media/ding.wav" volume={0.45} />
        </Sequence>
      ))}

      <Sequence name="Outro" from={puzzle.totalMoveFrames}>
        <Outro seed={seed} />
        <Audio src="https://remotion.media/yippee.wav" volume={0.7} />
      </Sequence>
    </AbsoluteFill>
  );
};

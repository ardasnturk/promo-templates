import {Audio} from '@remotion/media';
import {useMemo} from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fontFamily} from '../fonts';
import {buildPuzzle, CAPACITY, COLORS, Puzzle, TUBE_COUNT} from './solver';

type Props = {
  readonly seed: string;
};

export const OUTRO_FRAMES = 90;

export const calculateBallSortMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  return {durationInFrames: buildPuzzle(props.seed).totalMoveFrames + OUTRO_FRAMES};
};

const BALL = 96;
const SLOT = 104;
const TUBE_W = 118;
const GAP = 22;
const TUBE_H = SLOT * CAPACITY + 34;
const TUBES_LEFT = (1080 - (TUBE_COUNT * TUBE_W + (TUBE_COUNT - 1) * GAP)) / 2;
const TUBE_TOP = 760;
const LIFT_Y = TUBE_TOP - 110;

const tubeX = (t: number) => TUBES_LEFT + t * (TUBE_W + GAP) + TUBE_W / 2;
const slotY = (i: number) => TUBE_TOP + TUBE_H - 18 - SLOT * i - SLOT / 2;

const isComplete = (tube: number[]) =>
  tube.length === CAPACITY && tube.every((c) => c === tube[0]);

const Ball: React.FC<{readonly x: number; readonly y: number; readonly color: number}> = ({
  x,
  y,
  color,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - BALL / 2,
      top: y - BALL / 2,
      width: BALL,
      height: BALL,
      borderRadius: BALL / 2,
      background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.75) 0 10%, ${COLORS[color]} 38%, color-mix(in srgb, ${COLORS[color]} 60%, black) 100%)`,
      boxShadow: `0 0 30px ${COLORS[color]}66`,
    }}
  />
);

const Board: React.FC<{readonly puzzle: Puzzle}> = ({puzzle}) => {
  const frame = useCurrentFrame();
  const {states, moves, starts, durations} = puzzle;

  // Which move is active (or the last finished one)
  let k = 0;
  while (k < moves.length && frame >= starts[k] + durations[k]) {
    k++;
  }
  const state = states[k];
  const active = k < moves.length && frame >= starts[k] ? moves[k] : null;

  const balls: React.ReactNode[] = [];
  state.forEach((tube, t) => {
    tube.forEach((color, i) => {
      if (active && t === active.from && i === tube.length - 1) {
        return;
      }
      balls.push(<Ball key={`${t}-${i}`} x={tubeX(t)} y={slotY(i)} color={color} />);
    });
  });

  if (active) {
    const fromTube = state[active.from];
    const color = fromTube[fromTube.length - 1];
    const p = (frame - starts[k]) / durations[k];
    const y0 = slotY(fromTube.length - 1);
    const y1 = slotY(state[active.to].length);
    const ease = Easing.inOut(Easing.cubic);
    let x = tubeX(active.from);
    let y = y0;
    if (p < 0.3) {
      y = interpolate(p, [0, 0.3], [y0, LIFT_Y], {easing: ease});
    } else if (p < 0.65) {
      y = LIFT_Y;
      x = interpolate(p, [0.3, 0.65], [tubeX(active.from), tubeX(active.to)], {easing: ease});
    } else {
      x = tubeX(active.to);
      y = interpolate(p, [0.65, 1], [LIFT_Y, y1], {easing: Easing.in(Easing.quad)});
    }
    balls.push(<Ball key="moving" x={x} y={y} color={color} />);
  }

  return (
    <>
      {state.map((tube, t) => {
        const done = isComplete(states[k][t]) && (!active || active.to !== t);
        return (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: tubeX(t) - TUBE_W / 2,
              top: TUBE_TOP,
              width: TUBE_W,
              height: TUBE_H,
              borderRadius: `16px 16px ${TUBE_W / 2}px ${TUBE_W / 2}px`,
              border: `5px solid ${done ? COLORS[tube[0]] : 'rgba(255,255,255,0.35)'}`,
              borderTop: 'none',
              backgroundColor: 'rgba(255,255,255,0.05)',
              boxShadow: done ? `0 0 50px ${COLORS[tube[0]]}` : 'none',
            }}
          />
        );
      })}
      {balls}
    </>
  );
};

const MoveCounter: React.FC<{readonly puzzle: Puzzle}> = ({puzzle}) => {
  const frame = useCurrentFrame();
  const done = puzzle.starts.filter((s, i) => frame >= s + puzzle.durations[i]).length;
  return (
    <div
      style={{
        position: 'absolute',
        top: 1420,
        width: '100%',
        textAlign: 'center',
        fontFamily,
        fontWeight: 700,
        fontSize: 52,
        color: 'rgba(255,255,255,0.7)',
      }}
    >
      Move {done} / {puzzle.moves.length}
    </div>
  );
};

export const BallSort: React.FC<Props> = ({seed}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const puzzle = useMemo(() => buildPuzzle(seed), [seed]);

  // Frames where a tube becomes complete
  const completions = useMemo(() => {
    const out: number[] = [];
    puzzle.moves.forEach((m, k) => {
      if (isComplete(puzzle.states[k + 1][m.to])) {
        out.push(puzzle.starts[k] + puzzle.durations[k]);
      }
    });
    return out;
  }, [puzzle]);

  return (
    <AbsoluteFill
      style={{background: 'linear-gradient(180deg, #10172a 0%, #1b1035 100%)'}}
    >
      <Interactive.Div
        name="Hook"
        style={{
          position: 'absolute',
          top: 200,
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
        Don't scroll until it's done 😌
      </Interactive.Div>
      <Board puzzle={puzzle} />
      <MoveCounter puzzle={puzzle} />

      {puzzle.starts.map((s, i) => (
        <Sequence key={s} from={s + puzzle.durations[i] - 1} durationInFrames={10} layout="none">
          <Audio src="https://remotion.media/switch.wav" volume={0.5} />
        </Sequence>
      ))}
      {completions.map((f) => (
        <Sequence key={f} from={f} durationInFrames={1 * fps} layout="none">
          <Audio src="https://remotion.media/ding.wav" volume={0.45} />
        </Sequence>
      ))}

      <Sequence name="Outro" from={puzzle.totalMoveFrames}>
        <Outro />
        <Audio src="https://remotion.media/yippee.wav" volume={0.7} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Interactive.Div
      name="Perfect"
      style={{
        position: 'absolute',
        top: 1540,
        width: '100%',
        textAlign: 'center',
        fontFamily,
        fontWeight: 900,
        fontSize: 110,
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
  );
};

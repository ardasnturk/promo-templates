import {random} from 'remotion';

export const SIZE = 4;
export const CELLS = SIZE * SIZE;

export type State = number[]; // row-major cells, 0 = empty, 1..15 = tiles
export type Move = {tile: number; from: number; to: number}; // tile slides from cell → empty cell

const SOLVED: State = Array.from({length: CELLS}, (_, i) => (i + 1) % CELLS);

const neighbors = (cell: number) => {
  const r = Math.floor(cell / SIZE);
  const c = cell % SIZE;
  const out: number[] = [];
  if (r > 0) out.push(cell - SIZE);
  if (r < SIZE - 1) out.push(cell + SIZE);
  if (c > 0) out.push(cell - 1);
  if (c < SIZE - 1) out.push(cell + 1);
  return out;
};

const apply = (s: State, m: Move): State => {
  const next = [...s];
  next[m.to] = m.tile;
  next[m.from] = 0;
  return next;
};

// Random walk from the solved board, so every start is solvable.
const scramble = (seed: string, steps: number): State => {
  let s = [...SOLVED];
  let prev = -1;
  for (let i = 0; i < steps; i++) {
    const empty = s.indexOf(0);
    const options = neighbors(empty).filter((n) => n !== prev);
    const pick = options[Math.floor(random(`${seed}-${i}`) * options.length)];
    prev = empty;
    s = apply(s, {tile: s[pick], from: pick, to: empty});
  }
  return s;
};

// Manhattan distance + linear conflicts (admissible)
const heuristic = (s: State) => {
  let h = 0;
  for (let i = 0; i < CELLS; i++) {
    const t = s[i];
    if (t === 0) continue;
    const goal = t - 1;
    h += Math.abs(Math.floor(i / SIZE) - Math.floor(goal / SIZE)) + Math.abs((i % SIZE) - (goal % SIZE));
  }
  for (let line = 0; line < SIZE; line++) {
    for (let a = 0; a < SIZE; a++) {
      for (let b = a + 1; b < SIZE; b++) {
        // Row conflicts
        const ra = s[line * SIZE + a];
        const rb = s[line * SIZE + b];
        if (ra && rb && Math.floor((ra - 1) / SIZE) === line && Math.floor((rb - 1) / SIZE) === line && ra > rb) {
          h += 2;
        }
        // Column conflicts
        const ca = s[a * SIZE + line];
        const cb = s[b * SIZE + line];
        if (ca && cb && (ca - 1) % SIZE === line && (cb - 1) % SIZE === line && ca > cb) {
          h += 2;
        }
      }
    }
  }
  return h;
};

// IDA* (memory-light A*) for an optimal solution.
const solve = (start: State): Move[] => {
  const path: Move[] = [];
  const s = [...start];
  let bound = heuristic(s);

  const search = (g: number, empty: number, prevEmpty: number): number => {
    const f = g + heuristic(s);
    if (f > bound) return f;
    if (s.every((v, i) => v === SOLVED[i])) return -1;
    let min = Infinity;
    for (const n of neighbors(empty)) {
      if (n === prevEmpty) continue;
      const tile = s[n];
      s[empty] = tile;
      s[n] = 0;
      path.push({tile, from: n, to: empty});
      const r = search(g + 1, n, empty);
      if (r === -1) return -1;
      path.pop();
      s[n] = tile;
      s[empty] = 0;
      if (r < min) min = r;
    }
    return min;
  };

  for (;;) {
    const r = search(0, s.indexOf(0), -1);
    if (r === -1) return path;
    bound = r;
  }
};

export const rowComplete = (s: State, row: number) => {
  for (let c = 0; c < SIZE; c++) {
    const cell = row * SIZE + c;
    if (cell === CELLS - 1) continue; // bottom-right is the empty slot
    if (s[cell] !== cell + 1) return false;
  }
  return true;
};

export const isSolved = (s: State) => s.every((v, i) => v === SOLVED[i]);

export type Puzzle = {
  states: State[]; // states[k] = before move k
  moves: Move[];
  starts: number[]; // frame each move starts
  durations: number[];
  totalMoveFrames: number;
};

export const INTRO_FRAMES = 40;
export const SCRAMBLE_STEPS = 34;

export const buildPuzzle = (seed: string): Puzzle => {
  const start = scramble(seed, SCRAMBLE_STEPS);
  const moves = solve(start);
  const states: State[] = [start];
  moves.forEach((m) => states.push(apply(states[states.length - 1], m)));
  const starts: number[] = [];
  const durations: number[] = [];
  let t = INTRO_FRAMES;
  moves.forEach((_, k) => {
    // Starts calm, speeds up towards the end
    const d = Math.round(22 - (10 * k) / Math.max(1, moves.length - 1));
    starts.push(t);
    durations.push(d);
    t += d;
  });
  return {states, moves, starts, durations, totalMoveFrames: t};
};

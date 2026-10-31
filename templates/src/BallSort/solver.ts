import {random} from 'remotion';

export const COLORS = ['#ff4d6d', '#ffd60a', '#3a86ff', '#2ec4b6', '#b5179e'];
export const CAPACITY = 4;
export const TUBE_COUNT = COLORS.length + 2;

export type State = number[][]; // tubes, bottom → top, values are color indices
export type Move = {from: number; to: number};

const key = (s: State) => s.map((t) => t.join('')).join('|');

const isSolved = (s: State) =>
  s.every((t) => t.length === 0 || (t.length === CAPACITY && t.every((c) => c === t[0])));

const canMove = (s: State, a: number, b: number) => {
  const from = s[a];
  const to = s[b];
  if (a === b || from.length === 0 || to.length === CAPACITY) {
    return false;
  }
  // Pointless: moving a uniform tube into an empty one
  if (to.length === 0 && from.every((c) => c === from[0])) {
    return false;
  }
  return to.length === 0 || to[to.length - 1] === from[from.length - 1];
};

const apply = (s: State, m: Move): State => {
  const next = s.map((t) => [...t]);
  next[m.to].push(next[m.from].pop() as number);
  return next;
};

const scramble = (seed: string): State => {
  const balls: number[] = [];
  COLORS.forEach((_, c) => {
    for (let i = 0; i < CAPACITY; i++) {
      balls.push(c);
    }
  });
  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(random(`${seed}-${i}`) * (i + 1));
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }
  const tubes: State = [];
  for (let t = 0; t < TUBE_COUNT; t++) {
    tubes.push(t < COLORS.length ? balls.slice(t * CAPACITY, (t + 1) * CAPACITY) : []);
  }
  return tubes;
};

// Breadth-first search for the shortest solution.
const solve = (start: State): Move[] | null => {
  const seen = new Set([key(start)]);
  let frontier: {s: State; path: Move[]}[] = [{s: start, path: []}];
  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const {s, path} of frontier) {
      if (isSolved(s)) {
        return path;
      }
      for (let a = 0; a < TUBE_COUNT; a++) {
        for (let b = 0; b < TUBE_COUNT; b++) {
          if (!canMove(s, a, b)) {
            continue;
          }
          const m = {from: a, to: b};
          const n = apply(s, m);
          const k = key(n);
          if (!seen.has(k)) {
            seen.add(k);
            next.push({s: n, path: [...path, m]});
          }
        }
      }
    }
    frontier = next;
  }
  return null;
};

export type Puzzle = {
  states: State[]; // states[k] = before move k
  moves: Move[];
  starts: number[]; // frame each move starts
  durations: number[];
  totalMoveFrames: number;
};

export const INTRO_FRAMES = 25;

export const buildPuzzle = (seed: string): Puzzle => {
  const start = scramble(seed);
  const moves = solve(start) ?? [];
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

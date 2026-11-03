import {simulate} from '../src/Wordless/RingEscape/simulate';

const seeds = process.argv.slice(2).length ? process.argv.slice(2) : Array.from({length: 20}, (_, i) => `rings-${i + 1}`);
for (const seed of seeds) {
  const sim = simulate({seed, ballCount: 8, maxFrames: 60 * 30});
  const events = [...sim.breaks.map((b) => b.frame), ...sim.escapes.map((e) => e.frame)].sort((a, b) => a - b);
  let gap = events[0] ?? 0;
  for (let i = 1; i < events.length; i++) {
    gap = Math.max(gap, events[i] - events[i - 1]);
  }
  console.log(
    seed.padEnd(10),
    'win',
    sim.winner,
    'at',
    sim.winFrame === null ? 'none' : (sim.winFrame / 30).toFixed(1) + 's',
    'first',
    ((events[0] ?? 0) / 30).toFixed(2),
    'maxGap',
    (gap / 30).toFixed(1),
    'breaks',
    sim.breaks.map((b) => (b.frame / 30).toFixed(1)).join(','),
    'out',
    sim.escapes.map((e) => `${e.ball}@${(e.frame / 30).toFixed(1)}`).join(','),
  );
}

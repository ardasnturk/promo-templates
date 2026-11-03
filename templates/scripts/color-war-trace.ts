import {simulate} from '../src/Wordless/ColorWar/simulate';

// Usage: npx tsx scripts/color-war-trace.ts <seed> — cells and balls per color every 2 s.
const sim = simulate({seed: process.argv[2] ?? 'war-1', colorCount: 4, gridSize: 24, maxFrames: 60 * 30});
for (let f = 0; f < sim.frames; f += 60) {
  const bc = [0, 0, 0, 0];
  const b = sim.balls[f];
  for (let i = 0; i < b.length; i += 4) {
    bc[b[i + 2]]++;
  }
  console.log((f / 30).toFixed(0).padStart(3), Array.from(sim.counts[f]).join(' '), '| balls', bc.join(' '));
}
console.log('winner', sim.winner, 'at', sim.winFrame);

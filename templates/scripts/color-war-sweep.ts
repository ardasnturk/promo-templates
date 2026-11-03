import {simulate} from '../src/Wordless/ColorWar/simulate';

// Usage: npx tsx scripts/color-war-sweep.ts [seed...]
const seeds = process.argv.slice(2).length ? process.argv.slice(2) : Array.from({length: 10}, (_, i) => `war-${i + 1}`);
for (const seed of seeds) {
  const sim = simulate({seed, colorCount: 4, gridSize: 24, maxFrames: 60 * 30});
  // Stagnation: longest stretch with no paint.
  let gap = sim.paints[0] ?? 0;
  for (let i = 1; i < sim.paints.length; i++) {
    gap = Math.max(gap, sim.paints[i] - sim.paints[i - 1]);
  }
  // Longest stretch in which no color's share moved by 2% of the grid.
  const total = 24 * 24;
  let still = 0;
  let anchor = 0;
  for (let f = 1; f < sim.frames; f++) {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      if (Math.abs(sim.counts[f][c] - sim.counts[anchor][c]) >= total * 0.02) {
        moved = true;
      }
    }
    if (moved) {
      anchor = f;
    }
    still = Math.max(still, f - anchor);
  }
  // Lead changes where the new leader passes the old one by at least 5 cells.
  let lead = -1;
  let clear = 0;
  for (let f = 0; f < sim.frames; f++) {
    const cnt = sim.counts[f];
    for (let c = 0; c < 4; c++) {
      if (lead < 0 ? cnt[c] >= 149 : c !== lead && cnt[c] >= cnt[lead] + 5) {
        if (lead >= 0) {
          clear++;
        }
        lead = c;
      }
    }
  }
  console.log(
    'clearLeadChanges',
    clear,
    seed.padEnd(8),
    'winner',
    sim.winner,
    'at',
    sim.winFrame === null ? 'none' : (sim.winFrame / 30).toFixed(1) + 's',
    'leadChanges',
    sim.leadChanges.length,
    'firstLead',
    sim.leadChanges.length ? (sim.leadChanges[0] / 30).toFixed(1) + 's' : '-',
    'paintGap',
    (gap / 30).toFixed(2) + 's',
    'still',
    (still / 30).toFixed(1) + 's',
    'out',
    sim.eliminations.map((e) => `${e.c}@${(e.frame / 30).toFixed(1)}`).join(','),
  );
}

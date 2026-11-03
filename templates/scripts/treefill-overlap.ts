import {BALL_R, simulate} from '../src/Wordless/TreeFill/simulate';

// Overlap check: mean and worst nearest-neighbor distance at a few frames.
const sim = simulate(process.argv[2] ?? 'tree-1');
for (const f of [150, 450, 750, sim.totalFrames - 1]) {
  const p = sim.pos[f];
  const n = p.length / 2;
  let sum = 0;
  let worst = 1e9;
  let c = 0;
  for (let i = 0; i < n; i++) {
    if (Number.isNaN(p[i * 2])) continue;
    let best = 1e9;
    for (let j = 0; j < n; j++) {
      if (j === i || Number.isNaN(p[j * 2])) continue;
      const dx = p[i * 2] - p[j * 2];
      const dy = p[i * 2 + 1] - p[j * 2 + 1];
      best = Math.min(best, Math.sqrt(dx * dx + dy * dy));
    }
    if (best < 20) {
      console.log(`  ball ${i} at ${p[i * 2].toFixed(0)},${p[i * 2 + 1].toFixed(0)} nn ${best.toFixed(1)}`);
    }
    sum += best;
    worst = Math.min(worst, best);
    c++;
  }
  console.log(`frame ${f}: balls ${c} meanNN ${(sum / c).toFixed(1)} worstNN ${worst.toFixed(1)} (diameter ${BALL_R * 2})`);
}

import {BALL_R, BASE_Y, insideOutline, simulate, TIP_Y} from '../src/Wordless/TreeFill/simulate';

// Fill ratio per second, seal times and kept / trimmed ball counts.
const seeds = process.argv.slice(2).length ? process.argv.slice(2) : ['tree-1'];
for (const seed of seeds) {
  const t = Date.now();
  const sim = simulate(seed);
  const kept = sim.kept.reduce((a, b) => a + b, 0);
  const firstLand = sim.pos.findIndex((p) => {
    for (let i = 1; i < p.length; i += 2) {
      if (p[i] > 1600) {
        return true;
      }
    }
    return false;
  });
  console.log(
    seed,
    'ms',
    Date.now() - t,
    'balls',
    sim.kept.length,
    'kept',
    kept,
    'trimmed',
    sim.kept.length - kept,
    'full',
    (sim.fullFrame / 30).toFixed(1) + 's',
    'total',
    (sim.totalFrames / 30).toFixed(1) + 's',
    'first ball at trunk bottom frame',
    firstLand,
  );
  console.log('seals (s):', sim.seals.map((s) => (s.frame / 30).toFixed(1)).join(' '));
  console.log(sim.fillPerSecond.map((v, i) => `${i}s:${Math.round(v * 100)}%`).join(' '));
  // Empty cells: sample points at least one ball diameter inside the outline
  // and below the tip; a point is empty if no kept ball covers it.
  let samples = 0;
  let empty = 0;
  let holes = 0;
  for (let y = TIP_Y + 2 * BALL_R; y < BASE_Y; y += 10) {
    for (let x = 0; x < 1080; x += 10) {
      if (!insideOutline(x, y)) continue;
      let nearWall = false;
      for (const [ox, oy] of [[2 * BALL_R, 0], [-2 * BALL_R, 0], [0, 2 * BALL_R], [0, -2 * BALL_R]]) {
        if (!insideOutline(x + ox, y + oy)) nearWall = true;
      }
      if (nearWall) continue;
      samples++;
      let best = 1e9;
      for (let i = 0; i < sim.kept.length; i++) {
        if (!sim.kept[i]) continue;
        const dx = sim.finalX[i] - x;
        const dy = sim.finalY[i] - y;
        best = Math.min(best, dx * dx + dy * dy);
      }
      // Ball radius plus the largest gap a triangular pocket leaves.
      if (Math.sqrt(best) > BALL_R * 1.25) empty++;
      if (Math.sqrt(best) > BALL_R * 2) holes++;
    }
  }
  console.log(`small pockets: ${empty} of ${samples} interior samples; ball-sized holes: ${holes}`);
}

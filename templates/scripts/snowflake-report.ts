import {GROW, simulate} from '../src/Wordless/Snowflake/simulate';

// Growth curve per second: drawn segments (all 12 half-arms) / max radius.
const seeds = process.argv.slice(2).length ? process.argv.slice(2) : ['snow-1'];
for (const seed of seeds) {
  const t = Date.now();
  const sim = simulate(seed);
  console.log(
    seed,
    'half-arm segs',
    sim.count,
    'total drawn',
    sim.count * 12,
    'ms',
    Date.now() - t,
    'half at',
    (sim.halfFrame / 30).toFixed(1) + 's',
  );
  console.log('waves (s):', sim.waves.map((w) => (w / 30).toFixed(1)).join(' '));
  const row: string[] = [];
  for (let s = 0; s <= GROW / 30; s++) {
    let n = 0;
    let rMax = 0;
    for (let i = 0; i < sim.count; i++) {
      if (sim.seg[i * 8 + 5] <= s * 30) {
        n++;
        rMax = Math.max(rMax, sim.seg[i * 8 + 7]);
      }
    }
    row.push(`${s}s:${n * 12}/${rMax.toFixed(0)}`);
  }
  console.log(row.join('  '));
}

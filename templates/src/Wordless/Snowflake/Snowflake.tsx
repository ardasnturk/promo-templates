import {Audio} from '@remotion/media';
import {useEffect, useMemo, useRef} from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {GROW, R, simulate} from './simulate';

export const snowflakeSchema = z.object({
  seed: z.string(),
  background: z.string(),
  // Age gradient, darkest (oldest trunk) → lightest (fresh tips).
  ice: z.array(z.string()).min(2).max(5),
  // Accent tones for the finer side branches (lilac, turquoise).
  accents: z.array(z.string()).min(1).max(2),
  sound: z.boolean(),
});

type Props = z.infer<typeof snowflakeSchema>;

// Finale timeline, relative to the end of growth.
const SETTLE = 12;
const TURN = 48;
const GLINT = 30;
const HOLD = 10;
const COLLAPSE = 36;
const FINALE = SETTLE + TURN + GLINT + HOLD + COLLAPSE;
const AGE = 120; // frames for a fresh tip to settle into its final color
const LEVELS = 10;
const WIDTH = [9, 5.5, 3.5, 2.5];

export const calculateSnowflakeMetadata: CalculateMetadataFunction<Props> = () => ({
  durationInFrames: GROW + FINALE,
});

const hex = (c: string): [number, number, number] => {
  const h = c.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (x) => x + x) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: [number, number, number], b: [number, number, number], k: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;

export const Snowflake: React.FC<Props> = ({seed, background, ice, accents, sound}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const sim = useMemo(() => simulate(seed), [seed]);

  // Final color per depth: trunk → deep ice, then lighter ice, then the accents.
  const depthColor = useMemo(() => {
    const iceRgb = ice.map(hex);
    const acc = accents.map(hex);
    return [iceRgb[0], iceRgb[Math.min(1, iceRgb.length - 2)], acc[0], acc[acc.length - 1]];
  }, [ice, accents]);
  const tipColor = useMemo(() => hex(ice[ice.length - 1]), [ice]);

  const end = GROW + SETTLE;
  const turnK = interpolate(frame, [end, end + TURN], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  const glintStart = end + TURN;
  const glintR = interpolate(frame, [glintStart, glintStart + GLINT], [-60, R + 80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const collapseStart = glintStart + GLINT + HOLD;
  const collapseK = interpolate(frame, [collapseStart, collapseStart + COLLAPSE - 2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.6, 0, 0.4, 1),
  });
  // While collapsing, everything drifts back to the fresh-tip color.
  const whiten = interpolate(collapseK, [0, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // The turn also zooms in until the arm tips touch the screen edges.
  const scale = (1 + 0.16 * turnK) * (1 - collapseK) + collapseK * 0.04;

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const f = Math.min(frame, GROW);
    // Bucket segments by depth × age level so each bucket is one stroke call.
    const paths: Path2D[] = Array.from({length: 4 * LEVELS}, () => new Path2D());
    const glint = new Path2D();
    const {seg, count} = sim;
    for (let i = 0; i < count; i++) {
      const o = i * 8;
      const t0 = seg[o + 4];
      if (t0 > f) continue;
      const t1 = seg[o + 5];
      const k = t1 <= f ? 1 : (f - t0) / (t1 - t0);
      const x1 = seg[o];
      const y1 = seg[o + 1];
      const x2 = x1 + (seg[o + 2] - x1) * k;
      const y2 = y1 + (seg[o + 3] - y1) * k;
      const depth = seg[o + 6];
      const age = Math.max(0, f - t1);
      const level = Math.min(LEVELS - 1, Math.floor((age / AGE) * LEVELS));
      const p = paths[depth * LEVELS + level];
      p.moveTo(x1, y1);
      p.lineTo(x2, y2);
      const dr = glintR - seg[o + 7];
      if (dr > 0 && dr < 70) {
        glint.moveTo(x1, y1);
        glint.lineTo(x2, y2);
      }
    }

    const draw = (p: Path2D) => {
      for (let a = 0; a < 6; a++) {
        ctx.save();
        ctx.rotate((a * Math.PI) / 3);
        ctx.stroke(p);
        ctx.scale(1, -1);
        ctx.stroke(p);
        ctx.restore();
      }
    };

    ctx.translate(width / 2, height / 2);
    ctx.rotate(turnK * Math.PI * 2);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let d = 0; d < 4; d++) {
      ctx.lineWidth = WIDTH[d];
      for (let l = 0; l < LEVELS; l++) {
        const k = 1 - (1 - l / (LEVELS - 1)) * (1 - l / (LEVELS - 1));
        ctx.strokeStyle = mix(tipColor, depthColor[d], k * (1 - whiten));
        draw(paths[d * LEVELS + l]);
      }
    }
    if (glintR > -60 && glintR < R + 80) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 5;
      draw(glint);
    }
    // Seed point at the center.
    ctx.fillStyle = mix(tipColor, depthColor[0], 0.25 * (1 - whiten));
    ctx.beginPath();
    ctx.arc(0, 0, 9 / Math.max(scale, 0.5), 0, Math.PI * 2);
    ctx.fill();

    // Brief star glint on the upper-right arm tip once the light wave arrives.
    const star = interpolate(frame, [glintStart + GLINT - 8, glintStart + GLINT, glintStart + GLINT + 14], [0, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    if (star > 0) {
      ctx.save();
      ctx.translate(R / 2, (-R * Math.sqrt(3)) / 2);
      ctx.fillStyle = `rgba(255,255,255,${star})`;
      const s = 46 * star;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s * 0.6, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s * 0.6, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
      ctx.restore();
    }
  }, [frame, sim, background, width, height, depthColor, tipColor, glintR, glintStart, turnK, scale, whiten]);

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      <canvas ref={canvas} width={width} height={height} />
      {sound ? (
        <>
          {sim.waves.map((w) => (
            <Sequence key={w} from={w} durationInFrames={10} layout="none">
              <Audio src="https://remotion.media/mouse-click.wav" volume={0.16} />
            </Sequence>
          ))}
          <Sequence from={sim.halfFrame} durationInFrames={fps} layout="none">
            <Audio src="https://remotion.media/switch.wav" volume={0.22} />
          </Sequence>
          <Sequence from={end} durationInFrames={fps * 1.5} layout="none">
            <Audio src="https://remotion.media/whoosh.wav" volume={0.22} />
          </Sequence>
          <Sequence from={glintStart + GLINT - 8} durationInFrames={fps * 1.5} layout="none">
            <Audio src="https://remotion.media/ding.wav" volume={0.3} />
          </Sequence>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

import {Audio} from '@remotion/media';
import {AbsoluteFill, CalculateMetadataFunction, interpolate, Interactive, Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {fontFamily} from '../../fonts';
import {IMPACT, powerOf} from './camera';
import {CubeBlock} from './CubeBlock';
import {JellyDrape} from './JellyDrape';

// "What happens when the weight keeps going up?" Each experiment runs once per
// weight, from light to heavy; every round starts from the same fresh setup, so
// the cut from the last round back to the first looks like any other cut.

export const weightTestSchema = z.object({
  seed: z.string(),
  weights: z.array(z.number().positive()).min(2).max(8),
  unit: z.string(),
  experiments: z.array(z.enum(['jelly', 'cubes'])).min(1).max(4),
  roundFrames: z.number().int().min(60).max(150),
  cubeColors: z.array(z.string()).min(1),
  hook: z.string(),
  cta: z.string(),
  sound: z.boolean(),
});

type Props = z.infer<typeof weightTestSchema>;

export const calculateWeightTestMetadata: CalculateMetadataFunction<Props> = ({props}) => {
  return {durationInFrames: props.experiments.length * props.weights.length * props.roundFrames};
};

const clampOpts = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const impactSound = (experiment: string, p: number) => {
  if (p >= 0.95) {
    return {src: 'https://remotion.media/vine-boom.wav', volume: 0.32};
  }
  if (experiment === 'cubes' && p > 0.2) {
    return {src: 'https://remotion.media/bone-crack.wav', volume: 0.18 + 0.2 * p};
  }
  return {src: experiment === 'jelly' ? 'https://remotion.media/switch.wav' : 'https://remotion.media/mouse-click.wav', volume: 0.5};
};

export const WeightTest: React.FC<Props> = ({
  seed,
  weights,
  unit,
  experiments,
  roundFrames,
  cubeColors,
  hook,
  cta,
  sound,
}) => {
  const frame = useCurrentFrame();
  const round = Math.floor(frame / roundFrames);
  const t = frame - round * roundFrames;
  const experiment = experiments[Math.floor(round / weights.length) % experiments.length];
  const weight = weights[round % weights.length];
  const rounds = experiments.length * weights.length;
  const last = round === rounds - 1;

  const pop = interpolate(t, [0, 3, 10], [1.18, 1.25, 1], {...clampOpts, output: 'perceptual-scale'});
  const shake = powerOf(weight) >= 0.95 ? 9 * Math.exp(-Math.max(0, t - IMPACT) / 5) * (t >= IMPACT ? 1 : 0) : 0;
  const sx = shake * Math.sin(t * 2.3);
  const sy = shake * Math.cos(t * 3.1);

  return (
    <AbsoluteFill style={{fontFamily}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <linearGradient id="studio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8FA5B2" />
            <stop offset="0.55" stopColor="#A9BCC6" />
            <stop offset="1" stopColor="#C3D1D8" />
          </linearGradient>
          <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.6" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(20,30,40,0.28)" />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#studio)" />
        <g transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`}>
          {experiment === 'jelly' ? (
            <JellyDrape seed={seed} weight={weight} t={t} />
          ) : (
            <CubeBlock seed={seed} weight={weight} t={t} palette={cubeColors} />
          )}
        </g>
        <rect width={1080} height={1920} fill="url(#vignette)" />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontWeight: 900,
          fontSize: 150,
          lineHeight: 1,
          color: '#FFFFFF',
          textShadow: '0 6px 0 rgba(30,45,60,0.35), 0 0 30px rgba(30,45,60,0.25)',
          scale: pop,
        }}
      >
        {`${weight.toLocaleString('en-US')} ${unit}`}
      </div>
      {round === 0 ? (
        <Interactive.Div
          name="Hook"
          style={{
            position: 'absolute',
            top: 300,
            left: 80,
            right: 80,
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 52,
            lineHeight: 1.15,
            color: '#FFFFFF',
            textShadow: '0 4px 0 rgba(30,45,60,0.35)',
            opacity: interpolate(t, [roundFrames - 14, roundFrames - 2], [1, 0], clampOpts),
          }}
        >
          {hook}
        </Interactive.Div>
      ) : null}
      {last ? (
        <Interactive.Div
          name="CTA"
          style={{
            position: 'absolute',
            top: 300,
            left: 80,
            right: 80,
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 56,
            lineHeight: 1.15,
            color: '#FFFFFF',
            textShadow: '0 4px 0 rgba(30,45,60,0.4)',
            opacity: interpolate(t, [IMPACT + 30, IMPACT + 40], [0, 1], clampOpts),
          }}
        >
          {cta}
        </Interactive.Div>
      ) : null}
      {sound
        ? Array.from({length: rounds}, (_, i) => {
            const ex = experiments[Math.floor(i / weights.length) % experiments.length];
            const s = impactSound(ex, powerOf(weights[i % weights.length]));
            return (
              <Sequence key={i} from={i * roundFrames} durationInFrames={roundFrames} layout="none">
                <Audio src="https://remotion.media/whoosh.wav" volume={0.12} />
                <Sequence from={IMPACT} layout="none">
                  <Audio src={s.src} volume={s.volume} />
                </Sequence>
              </Sequence>
            );
          })
        : null}
    </AbsoluteFill>
  );
};

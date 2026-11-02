import {Interactive, interpolate} from 'remotion';
import {fontFamily} from '../fonts';

// Big number with a small label under it. `since` is the number of frames
// since the value last changed; the number pops when it changes.
export const Counter: React.FC<{
  readonly name: string;
  readonly value: number | string;
  readonly label: string;
  readonly since: number;
  readonly top: number;
  readonly color: string;
  readonly labelColor: string;
}> = ({name, value, label, since, top, color, labelColor}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 80,
        right: 80,
        textAlign: 'center',
        fontFamily,
        fontWeight: 900,
        lineHeight: 1,
      }}
    >
      <div
        style={{
          fontSize: 190,
          color,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 8px 0 rgba(0,0,0,0.22)',
          scale: interpolate(since, [0, 3, 10], [1, 1.12, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
        }}
      >
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </div>
      <Interactive.Div
        name={name}
        style={{marginTop: 14, fontSize: 64, letterSpacing: 3, color: labelColor}}
      >
        {label}
      </Interactive.Div>
    </div>
  );
};

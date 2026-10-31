import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {fontFamily} from '../fonts';

type Props = {
  readonly appearAt: number; // seconds
  readonly side: 'me' | 'them';
  readonly children: React.ReactNode;
};

export const Bubble: React.FC<Props> = ({appearAt, side, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = appearAt * fps;
  if (frame < start) {
    return null;
  }
  const progress = interpolate(frame, [start, start + 0.35 * fps], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.spring({damping: 14}),
  });
  const me = side === 'me';

  return (
    <div
      style={{
        alignSelf: me ? 'flex-end' : 'flex-start',
        maxWidth: 760,
        padding: '26px 36px',
        borderRadius: 44,
        borderBottomRightRadius: me ? 12 : 44,
        borderBottomLeftRadius: me ? 44 : 12,
        backgroundColor: me ? '#2f7bf6' : '#2c2c31',
        color: 'white',
        fontFamily,
        fontWeight: 500,
        fontSize: 46,
        lineHeight: 1.25,
        transformOrigin: me ? 'bottom right' : 'bottom left',
        scale: String(0.6 + 0.4 * progress),
        opacity: Math.min(1, progress * 1.5),
      }}
    >
      {children}
    </div>
  );
};

export const Typing: React.FC<{
  readonly from: number;
  readonly to: number;
}> = ({from, to}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < from * fps || frame >= to * fps) {
    return null;
  }
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        display: 'flex',
        gap: 14,
        padding: '34px 38px',
        borderRadius: 44,
        borderBottomLeftRadius: 12,
        backgroundColor: '#2c2c31',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#9a9aa3',
            translate: `0px ${Math.sin((frame - i * 4) / 4) * 7}px`,
          }}
        />
      ))}
    </div>
  );
};

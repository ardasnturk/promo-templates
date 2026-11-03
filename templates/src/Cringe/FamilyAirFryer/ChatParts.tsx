import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {fontFamily} from '../../fonts';

// Grows the row height while the bubble pops in, so older messages scroll up smoothly.
const Grow: React.FC<{readonly start: number; readonly children: React.ReactNode}> = ({start, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        paddingTop: 22,
        maxHeight: interpolate(frame, [start, start + 0.3 * fps], [0, 420], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        }),
      }}
    >
      {children}
    </div>
  );
};

type BubbleProps = {
  readonly appearAt: number; // seconds
  readonly from?: {readonly name: string; readonly color: string};
  readonly children: React.ReactNode;
};

export const GroupBubble: React.FC<BubbleProps> = ({appearAt, from, children}) => {
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
  const me = !from;

  return (
    <Grow start={start}>
      <div
        style={{
          alignSelf: me ? 'flex-end' : 'flex-start',
          maxWidth: 780,
          padding: from ? '20px 34px 24px' : '24px 34px',
          borderRadius: 40,
          borderBottomRightRadius: me ? 10 : 40,
          borderBottomLeftRadius: me ? 40 : 10,
          backgroundColor: me ? '#6c4dff' : '#24242a',
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
        {from ? (
          <div style={{fontWeight: 700, fontSize: 34, color: from.color, marginBottom: 4}}>{from.name}</div>
        ) : null}
        {children}
      </div>
    </Grow>
  );
};

export const GroupTyping: React.FC<{
  readonly from: number;
  readonly to: number;
  readonly name: string;
  readonly color: string;
}> = ({from, to, name, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < from * fps || frame >= to * fps) {
    return null;
  }
  return (
    <Grow start={from * fps}>
      <div
        style={{
          alignSelf: 'flex-start',
          padding: '18px 36px 30px',
          borderRadius: 40,
          borderBottomLeftRadius: 10,
          backgroundColor: '#24242a',
        }}
      >
        <div style={{fontFamily, fontWeight: 700, fontSize: 34, color, marginBottom: 14}}>{name}</div>
        <div style={{display: 'flex', gap: 14}}>
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
      </div>
    </Grow>
  );
};

export const SeenBy: React.FC<{readonly at: number; readonly children: React.ReactNode}> = ({at, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at * fps) {
    return null;
  }
  return (
    <Grow start={at * fps}>
      <div
        style={{
          alignSelf: 'flex-end',
          marginTop: -10,
          fontFamily,
          fontWeight: 600,
          fontSize: 34,
          color: '#8e8e96',
        }}
      >
        {children}
      </div>
    </Grow>
  );
};

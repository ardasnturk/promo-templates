import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  random,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fontFamily} from '../fonts';
import {Bubble, Typing} from './Bubble';

const REPLY_AT = 14.5;

const Shake: React.FC<{readonly children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - REPLY_AT * fps;
  const amp = t < 0 ? 0 : interpolate(t, [0, 0.6 * fps], [26, 0], {extrapolateRight: 'clamp'});
  const zoom =
    t < 0
      ? 1
      : interpolate(t, [0, 0.25 * fps, 1.2 * fps], [1, 1.08, 1.04], {
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
  return (
    <AbsoluteFill
      style={{
        translate: `${(random(`x${frame}`) - 0.5) * amp}px ${(random(`y${frame}`) - 0.5) * amp}px`,
        scale: String(zoom),
        transformOrigin: '50% 100%',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Seen: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < 8.2 * fps) {
    return null;
  }
  return (
    <div
      style={{
        alignSelf: 'flex-end',
        marginTop: -12,
        fontFamily,
        fontWeight: 500,
        fontSize: 32,
        color: '#8e8e96',
      }}
    >
      Seen 09:12
    </div>
  );
};

const RedFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: 'radial-gradient(circle, transparent 45%, rgba(255,0,40,0.55) 100%)',
        opacity: interpolate(frame, [0, 0.15 * fps, 1.5 * fps], [0, 1, 0.5], {
          extrapolateRight: 'clamp',
        }),
      }}
    />
  );
};

const Ending: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'rgba(0,0,0,0.97)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 50,
        opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {
          extrapolateRight: 'clamp',
        }),
      }}
    >
      <Interactive.Div
        name="Me right now"
        style={{fontFamily, fontWeight: 900, fontSize: 90, color: 'white', textAlign: 'center'}}
      >
        me right now:
      </Interactive.Div>
      <Interactive.Div
        name="Skull"
        style={{
          fontSize: 260,
          rotate: interpolate(frame, [0, 0.2 * fps, 0.4 * fps, 0.6 * fps], ['-12deg', '12deg', '-8deg', '0deg'], {
            extrapolateRight: 'clamp',
          }),
        }}
      >
        💀
      </Interactive.Div>
      <div style={{width: 800}}>
        <Interactive.Div
          name="Resignation"
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 48,
            color: 'white',
            textAlign: 'center',
            marginBottom: 26,
          }}
        >
          Writing resignation letter…
        </Interactive.Div>
        <div style={{height: 34, borderRadius: 17, backgroundColor: '#333'}}>
          <div
            style={{
              height: '100%',
              borderRadius: 17,
              backgroundColor: '#ff3b5c',
              width: `${interpolate(frame, [0.5 * fps, 3.2 * fps], [0, 99], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.quad),
              })}%`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CringeChat: React.FC = () => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Shake>
        {/* Chat header */}
        <div
          style={{
            position: 'absolute',
            top: 360,
            left: 0,
            right: 0,
            height: 150,
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            padding: '0 70px',
            backgroundColor: '#141416',
            borderBottom: '2px solid #222',
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              background: 'linear-gradient(135deg,#8a8f98,#4b4f57)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontFamily,
              fontWeight: 700,
              fontSize: 40,
              color: 'white',
            }}
          >
            MB
          </div>
          <div style={{fontFamily, color: 'white'}}>
            <Interactive.Div name="Contact name" style={{fontWeight: 700, fontSize: 48}}>
              Mr. Brooks (Boss) 👔
            </Interactive.Div>
            <div style={{fontWeight: 500, fontSize: 30, color: '#8e8e96'}}>online</div>
          </div>
        </div>
        {/* Messages */}
        <div
          style={{
            position: 'absolute',
            top: 550,
            left: 60,
            right: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          <Bubble appearAt={0.6} side="me">babe are you awake 🥺</Bubble>
          <Bubble appearAt={2.2} side="me">i really don't wanna go to work today</Bubble>
          <Bubble appearAt={3.8} side="me">boss scheduled ANOTHER early meeting 🙄</Bubble>
          <Bubble appearAt={5.4} side="me">man thinks he's the CEO 😂😂</Bubble>
          <Bubble appearAt={7.0} side="me">should i call in sick and come over 🙈</Bubble>
          <Seen />
          <Typing from={9} to={11.5} />
          <Typing from={12.4} to={REPLY_AT} />
          <Bubble appearAt={REPLY_AT} side="them">
            Meeting is at 10:00. We can discuss your sick day there.
          </Bubble>
        </div>
      </Shake>

      {/* Hook stays on top the whole time */}
      <Interactive.Div
        name="Hook"
        style={{
          position: 'absolute',
          top: 110,
          left: 70,
          right: 70,
          textAlign: 'center',
          fontFamily,
          fontWeight: 900,
          fontSize: 76,
          lineHeight: 1.1,
          color: 'white',
          textShadow: '0 4px 24px rgba(0,0,0,0.8)',
        }}
      >
        The moment I realized who I texted 💀
      </Interactive.Div>

      <Sequence name="Red flash" from={REPLY_AT * fps} durationInFrames={2 * fps}>
        <RedFlash />
      </Sequence>
      <Sequence name="Ending" from={16.5 * fps}>
        <Ending />
      </Sequence>

      <Sequence name="SFX send 1" from={0.6 * fps} durationInFrames={1 * fps} layout="none">
        <Audio src="https://remotion.media/whoosh.wav" volume={0.35} />
      </Sequence>
      <Sequence name="SFX send 2" from={2.2 * fps} durationInFrames={1 * fps} layout="none">
        <Audio src="https://remotion.media/whoosh.wav" volume={0.35} />
      </Sequence>
      <Sequence name="SFX send 3" from={3.8 * fps} durationInFrames={1 * fps} layout="none">
        <Audio src="https://remotion.media/whoosh.wav" volume={0.35} />
      </Sequence>
      <Sequence name="SFX send 4" from={5.4 * fps} durationInFrames={1 * fps} layout="none">
        <Audio src="https://remotion.media/whoosh.wav" volume={0.35} />
      </Sequence>
      <Sequence name="SFX send 5" from={7.0 * fps} durationInFrames={1 * fps} layout="none">
        <Audio src="https://remotion.media/whoosh.wav" volume={0.35} />
      </Sequence>
      <Sequence name="SFX seen" from={8.2 * fps} durationInFrames={1 * fps} layout="none">
        <Audio src="https://remotion.media/record-scratch.wav" volume={0.6} />
      </Sequence>
      <Sequence name="SFX reply" from={REPLY_AT * fps} layout="none">
        <Audio src="https://remotion.media/vine-boom.wav" />
      </Sequence>
      <Sequence name="SFX ending" from={16.5 * fps} layout="none">
        <Audio src="https://remotion.media/spongebob-fail.wav" volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};

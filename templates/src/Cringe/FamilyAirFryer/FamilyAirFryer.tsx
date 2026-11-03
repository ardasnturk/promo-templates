import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fontFamily} from '../../fonts';
import {GroupBubble, GroupTyping, SeenBy} from './ChatParts';

export const FAMILY_AIR_FRYER_DURATION = 33; // seconds

const HOOK_END = 3.0;
const GRANDMA_TYPING: [number, number][] = [
  [16.3, 17.5],
  [17.9, 19.0],
];
const DAD_TYPING: [number, number][] = [
  [22.9, 24.0],
  [24.4, 25.3],
];
const REPLY_AT = 25.3;
const ENDING_AT = 27.6;

// [second, air fryer count] — each step lines up with a message below.
const COUNT_STEPS: [number, number][] = [
  [4.9, 1],
  [7.8, 2],
  [9.2, 3],
  [11.8, 4],
  [13.1, 5],
  [14.3, 7],
  [19.0, 8],
  [20.3, 13],
  [REPLY_AT, 14],
];

const MOM = {name: 'Mom', color: '#ff7aa2'};
const JAKE = {name: 'Cousin Jake', color: '#5fd0ff'};
const MIA = {name: 'Cousin Mia', color: '#b08cff'};
const LINDA = {name: 'Aunt Linda', color: '#ffb347'};
const RAY = {name: 'Uncle Ray', color: '#6be38f'};
const GRANDMA = {name: 'Grandma', color: '#ffd84d'};
const DAD = {name: 'Dad', color: '#ff6b4a'};

const Shake: React.FC<{readonly children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - REPLY_AT * fps;
  const amp = t < 0 ? 0 : interpolate(t, [0, 0.6 * fps], [26, 0], {extrapolateRight: 'clamp'});
  const zoom =
    t < 0
      ? 1
      : interpolate(t, [0, 0.25 * fps, 1.2 * fps], [1, 1.06, 1], {
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
  return (
    <AbsoluteFill
      style={{
        translate: `${Math.sin(frame * 2.1) * amp}px ${Math.cos(frame * 1.7) * amp}px`,
        scale: String(zoom),
        transformOrigin: '50% 100%',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const AirFryerCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let count = 0;
  let stepAt = -10;
  for (const [at, value] of COUNT_STEPS) {
    if (t >= at) {
      count = value;
      stepAt = at;
    }
  }
  const since = frame - stepAt * fps;
  const final = t >= REPLY_AT;
  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          padding: '14px 44px',
          borderRadius: 40,
          backgroundColor: final ? '#ff2d55' : '#1c1c22',
          border: `4px solid ${final ? '#ff8aa0' : '#34343c'}`,
          fontFamily,
          color: 'white',
          scale: String(interpolate(since, [0, 4, 12], [1, 1.18, 1], {extrapolateRight: 'clamp'})),
        }}
      >
        <Interactive.Div name="Counter label" style={{fontWeight: 800, fontSize: 44, lineHeight: 1.05}}>
          AIR FRYERS
          <br />
          INCOMING:
        </Interactive.Div>
        <div
          style={{
            fontWeight: 900,
            fontSize: 110,
            minWidth: 130,
            textAlign: 'center',
            color: final ? 'white' : count > 0 ? '#ffd84d' : '#8e8e96',
          }}
        >
          {count}
        </div>
      </div>
    </div>
  );
};

const HeaderStatus: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const within = (ranges: [number, number][]) => ranges.some(([a, b]) => t >= a && t < b);
  const typing = within(GRANDMA_TYPING) ? 'Grandma' : within(DAD_TYPING) ? 'Dad' : null;
  return (
    <div style={{fontWeight: 600, fontSize: 36, color: typing ? '#6be38f' : '#8e8e96'}}>
      {typing ? `${typing} is typing…` : 'Mom, Dad, Grandma +9'}
    </div>
  );
};

const ChatHeader: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 300,
      left: 0,
      right: 0,
      height: 160,
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      padding: '0 60px',
      backgroundColor: '#121216',
      borderTop: '2px solid #222',
      borderBottom: '2px solid #222',
      fontFamily,
      color: 'white',
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
      <div style={{fontSize: 70, fontWeight: 400, color: '#9b87ff', marginTop: -8}}>‹</div>
      <div
        style={{
          padding: '6px 18px',
          borderRadius: 30,
          backgroundColor: '#ff2d55',
          fontWeight: 800,
          fontSize: 36,
        }}
      >
        47
      </div>
    </div>
    <div
      style={{
        width: 104,
        height: 104,
        borderRadius: 52,
        background: 'linear-gradient(135deg,#ffb347,#ff7aa2)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 56,
      }}
    >
      🏠
    </div>
    <div>
      <Interactive.Div name="Group name" style={{fontWeight: 800, fontSize: 50}}>
        Family 👨‍👩‍👧
      </Interactive.Div>
      <HeaderStatus />
    </div>
  </div>
);

const HookCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'rgba(0,0,0,0.78)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: interpolate(frame, [HOOK_END * fps - 0.3 * fps, HOOK_END * fps], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      <div
        style={{
          width: 920,
          padding: '40px 50px 50px',
          borderRadius: 50,
          backgroundColor: '#1d1d24',
          border: '3px solid #35353f',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          fontFamily,
          color: 'white',
          scale: String(
            interpolate(frame, [0, 0.5 * fps, HOOK_END * fps - 0.3 * fps, HOOK_END * fps], [1, 1.03, 1.03, 0.85], {
              extrapolateRight: 'clamp',
              easing: Easing.inOut(Easing.quad),
            }),
          ),
          translate: interpolate(frame, [HOOK_END * fps - 0.3 * fps, HOOK_END * fps], ['0px 0px', '0px -300px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.in(Easing.cubic),
          }),
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 26,
          }}
        >
          <div style={{fontWeight: 700, fontSize: 44, color: '#b9b9c4'}}>💬 Family 👨‍👩‍👧</div>
          <div style={{fontWeight: 600, fontSize: 36, color: '#8e8e96'}}>now</div>
        </div>
        <Interactive.Div name="Hook" style={{fontWeight: 900, fontSize: 84, lineHeight: 1.1}}>
          <span style={{color: '#ff7aa2'}}>MOM:</span> I bought something for everyone in the Black Friday sale 😇
        </Interactive.Div>
        <div style={{display: 'flex', marginTop: 34}}>
          <Interactive.Div
            name="Unread badge"
            style={{
              padding: '12px 30px',
              borderRadius: 40,
              backgroundColor: '#ff2d55',
              fontWeight: 800,
              fontSize: 48,
              scale: String(
                interpolate(frame % 20, [0, 5, 20], [1, 1.08, 1], {extrapolateRight: 'clamp'}),
              ),
            }}
          >
            47 new messages
          </Interactive.Div>
        </div>
      </div>
    </AbsoluteFill>
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
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        padding: '100px 80px',
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
        name="Emoji"
        style={{
          fontSize: 220,
          lineHeight: 1.1,
          rotate: interpolate(frame, [0, 0.2 * fps, 0.4 * fps, 0.6 * fps], ['-12deg', '12deg', '-8deg', '0deg'], {
            extrapolateRight: 'clamp',
          }),
        }}
      >
        🫠
      </Interactive.Div>
      <div style={{width: 840}}>
        <Interactive.Div
          name="Progress label"
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 48,
            color: 'white',
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          Clearing kitchen counter…
        </Interactive.Div>
        <div style={{height: 34, borderRadius: 17, backgroundColor: '#333'}}>
          <div
            style={{
              height: '100%',
              borderRadius: 17,
              backgroundColor: '#ff3b5c',
              width: `${interpolate(frame, [0.5 * fps, 3 * fps], [0, 7], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.quad),
              })}%`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          marginTop: 40,
          textAlign: 'center',
          opacity: interpolate(frame, [1.4 * fps, 1.8 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          translate: interpolate(frame, [1.4 * fps, 1.8 * fps], ['0px 40px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          }),
        }}
      >
        <Interactive.Div
          name="CTA"
          style={{fontFamily, fontWeight: 900, fontSize: 84, lineHeight: 1.1, color: '#ffd84d'}}
        >
          What would you do with 14 air fryers? 👇
        </Interactive.Div>
        <Interactive.Div
          name="CTA sub"
          style={{fontFamily, fontWeight: 700, fontSize: 56, color: 'white', marginTop: 24}}
        >
          Tag your family.
        </Interactive.Div>
      </div>
    </AbsoluteFill>
  );
};

const Pop: React.FC<{readonly at: number; readonly name: string}> = ({at, name}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence name={name} from={Math.round(at * fps)} durationInFrames={1 * fps} layout="none">
      <Audio src="https://remotion.media/mouse-click.wav" volume={0.7} />
    </Sequence>
  );
};

const Send: React.FC<{readonly at: number; readonly name: string}> = ({at, name}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence name={name} from={Math.round(at * fps)} durationInFrames={1 * fps} layout="none">
      <Audio src="https://remotion.media/whoosh.wav" volume={0.3} />
    </Sequence>
  );
};

export const FamilyAirFryer: React.FC = () => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Shake>
        <ChatHeader />
        {/* Messages: bottom-anchored, new rows push older ones up */}
        <div
          style={{
            position: 'absolute',
            top: 462,
            bottom: 100,
            left: 60,
            right: 60,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              alignSelf: 'center',
              flexShrink: 0,
              padding: '8px 26px',
              borderRadius: 24,
              backgroundColor: '#1c1c22',
              fontFamily,
              fontWeight: 600,
              fontSize: 34,
              color: '#8e8e96',
            }}
          >
            Black Friday · 07:02
          </div>
          <GroupBubble appearAt={3.3} from={MOM}>
            I bought something for everyone in the Black Friday sale 😇
          </GroupBubble>
          <GroupBubble appearAt={4.9} from={MOM}>
            A SUPER DEAL air fryer! One for each of you 🎁
          </GroupBubble>
          <GroupBubble appearAt={6.4}>omg thanks mom ❤️</GroupBubble>
          <GroupBubble appearAt={7.8} from={JAKE}>
            I bought one for everyone too 💀
          </GroupBubble>
          <GroupBubble appearAt={9.2} from={MIA}>
            I bought one for everyone too 💀
          </GroupBubble>
          <GroupBubble appearAt={10.5}>wait.</GroupBubble>
          <GroupBubble appearAt={11.8} from={LINDA}>
            I bought one for everyone too 💀
          </GroupBubble>
          <GroupBubble appearAt={13.1} from={RAY}>
            I bought one for everyone too 💀
          </GroupBubble>
          <GroupBubble appearAt={14.3} from={RAY}>
            the 2-pack was cheaper so… two each 🤷
          </GroupBubble>
          <GroupBubble appearAt={15.4}>guys my kitchen is the size of a fridge</GroupBubble>
          <GroupTyping from={GRANDMA_TYPING[0][0]} to={GRANDMA_TYPING[0][1]} {...GRANDMA} />
          <GroupTyping from={GRANDMA_TYPING[1][0]} to={GRANDMA_TYPING[1][1]} {...GRANDMA} />
          <GroupBubble appearAt={19.0} from={GRANDMA}>
            I bought one for everyone too 💀
          </GroupBubble>
          <GroupBubble appearAt={20.3} from={GRANDMA}>
            and 5 more for the future grandkids 🥰
          </GroupBubble>
          <GroupBubble appearAt={21.5}>DAD. tell me you didn't.</GroupBubble>
          <SeenBy at={22.3}>Seen by Dad</SeenBy>
          <GroupTyping from={DAD_TYPING[0][0]} to={DAD_TYPING[0][1]} {...DAD} />
          <GroupTyping from={DAD_TYPING[1][0]} to={DAD_TYPING[1][1]} {...DAD} />
          <GroupBubble appearAt={REPLY_AT} from={DAD}>
            I ordered one more, the shipping was free 🙃
          </GroupBubble>
        </div>
      </Shake>

      <AirFryerCounter />

      <Sequence name="Hook card" durationInFrames={Math.round(HOOK_END * fps)}>
        <HookCard />
      </Sequence>
      <Sequence name="Red flash" from={Math.round(REPLY_AT * fps)} durationInFrames={2 * fps}>
        <RedFlash />
      </Sequence>
      <Sequence name="Ending" from={Math.round(ENDING_AT * fps)}>
        <Ending />
      </Sequence>

      <Sequence name="SFX notification" durationInFrames={2 * fps} layout="none">
        <Audio src="https://remotion.media/ding.wav" volume={0.7} />
      </Sequence>
      <Pop at={3.3} name="SFX Mom 1" />
      <Pop at={4.9} name="SFX Mom 2" />
      <Send at={6.4} name="SFX me 1" />
      <Pop at={7.8} name="SFX Jake" />
      <Pop at={9.2} name="SFX Mia" />
      <Send at={10.5} name="SFX me 2" />
      <Pop at={11.8} name="SFX Linda" />
      <Pop at={13.1} name="SFX Ray 1" />
      <Pop at={14.3} name="SFX Ray 2" />
      <Send at={15.4} name="SFX me 3" />
      <Pop at={19.0} name="SFX Grandma 1" />
      <Sequence name="SFX Grandma +5" from={Math.round(20.3 * fps)} durationInFrames={2 * fps} layout="none">
        <Audio src="https://remotion.media/ding.wav" volume={0.7} />
      </Sequence>
      <Send at={21.5} name="SFX me 4" />
      <Sequence name="SFX seen" from={Math.round(22.3 * fps)} durationInFrames={1 * fps} layout="none">
        <Audio src="https://remotion.media/record-scratch.wav" volume={0.6} />
      </Sequence>
      <Sequence name="SFX reply" from={Math.round(REPLY_AT * fps)} layout="none">
        <Audio src="https://remotion.media/vine-boom.wav" />
      </Sequence>
      <Sequence name="SFX ending" from={Math.round(ENDING_AT * fps)} layout="none">
        <Audio src="https://remotion.media/spongebob-fail.wav" volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};

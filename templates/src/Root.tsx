import {Composition, Folder} from 'remotion';
import {BouncingBall} from './BouncingBall/BouncingBall';
import {CringeChat} from './CringeChat/CringeChat';
import {FAMILY_AIR_FRYER_DURATION, FamilyAirFryer} from './Cringe/FamilyAirFryer/FamilyAirFryer';
import {Breathe} from './Breathe/Breathe';
import {calculateSleepBreathMetadata, SleepBreath, sleepBreathSchema} from './Relaxing/SleepBreath/SleepBreath';
import {BallSort, calculateBallSortMetadata} from './BallSort/BallSort';
import {
  calculateFifteenPuzzleMetadata,
  FifteenPuzzle,
  fifteenPuzzleSchema,
} from './Satisfying/FifteenPuzzle/FifteenPuzzle';
import {calculateMassMachineMetadata, MassMachine, massMachineSchema} from './Wordless/MassMachine/MassMachine';
import {calculateRingEscapeMetadata, RingEscape, ringEscapeSchema} from './Wordless/RingEscape/RingEscape';
import {calculateSnowflakeMetadata, Snowflake, snowflakeSchema} from './Wordless/Snowflake/Snowflake';
import {calculateTreeFillMetadata, TreeFill, treeFillSchema} from './Wordless/TreeFill/TreeFill';
import {
  calculateSkyscraperFillMetadata,
  SkyscraperFill,
  skyscraperFillSchema,
} from './Wordless/SkyscraperFill/SkyscraperFill';
import {calculateColorWarMetadata, ColorWar, colorWarSchema} from './Wordless/ColorWar/ColorWar';
import {calculateDiceLoopMetadata, DiceLoop, diceLoopSchema} from './Loop/DiceLoop/DiceLoop';
import {calculateJellySquishMetadata, JellySquish, jellySquishSchema} from './Loop/JellySquish/JellySquish';
import {calculateRibbonSliceMetadata, RibbonSlice, ribbonSliceSchema} from './Loop/RibbonSlice/RibbonSlice';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Satisfying">
        <Composition
          id="BouncingBall"
          component={BouncingBall}
          durationInFrames={660}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="BallSort"
          component={BallSort}
          durationInFrames={400}
          fps={30}
          width={1080}
          height={1920}
          calculateMetadata={calculateBallSortMetadata}
          defaultProps={{seed: 'sort-1'}}
        />
        <Composition
          id="FifteenPuzzle"
          component={FifteenPuzzle}
          schema={fifteenPuzzleSchema}
          calculateMetadata={calculateFifteenPuzzleMetadata}
          durationInFrames={666}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{seed: 'fifteen-1'}}
        />
      </Folder>
      <Folder name="Wordless">
        <Composition
          id="MassMachine"
          component={MassMachine}
          schema={massMachineSchema}
          calculateMetadata={calculateMassMachineMetadata}
          durationInFrames={1200}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{seed: 'mass-1', maxBalls: 1500, sound: true}}
        />
        <Composition
          id="RingEscape"
          component={RingEscape}
          schema={ringEscapeSchema}
          calculateMetadata={calculateRingEscapeMetadata}
          durationInFrames={1050}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            seed: 'rings-7',
            colors: ['#FF3B5C', '#FF9F1C', '#FFE14D', '#3DDC84', '#22D3EE', '#3B82F6', '#A855F7', '#FF5FC8'],
            sound: true,
          }}
        />
        <Composition
          id="Snowflake"
          component={Snowflake}
          schema={snowflakeSchema}
          calculateMetadata={calculateSnowflakeMetadata}
          durationInFrames={856}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            seed: 'snow-1',
            background: '#0A1330',
            ice: ['#1F4C8F', '#4C8FD9', '#A9D8FF', '#F4FBFF'],
            accents: ['#B9A4FF', '#4FE3D2'],
            sound: true,
          }}
        />
        <Composition
          id="TreeFill"
          component={TreeFill}
          schema={treeFillSchema}
          calculateMetadata={calculateTreeFillMetadata}
          durationInFrames={1050}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            seed: 'tree-1',
            background: '#0D1117',
            greens: ['#1F9D55', '#2FBF71', '#17804A'],
            garland: '#F4C430',
            ornaments: ['#E63946', '#F5F1E6', '#8C1C3A'],
            trunk: '#8C1C3A',
            sound: true,
          }}
        />
        <Composition
          id="SkyscraperFill"
          component={SkyscraperFill}
          schema={skyscraperFillSchema}
          calculateMetadata={calculateSkyscraperFillMetadata}
          durationInFrames={1068}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            seed: 'sky-1',
            palette: {
              background: '#0B0F1A',
              facade: ['#4A5878', '#404D6B'],
              glass: '#16223F',
              lit: ['#FFD166', '#FFB347', '#FFF1B8'],
              trim: '#E9C46A',
              lobby: '#E07A5F',
            },
            litShare: 0.62,
            sound: true,
          }}
        />
        <Composition
          id="ColorWar"
          component={ColorWar}
          schema={colorWarSchema}
          calculateMetadata={calculateColorWarMetadata}
          durationInFrames={1327}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            seed: 'war-16',
            colors: ['#FF4D6D', '#4D9DFF', '#FFC93C', '#3DDC97'],
            gridSize: 24,
            sound: true,
          }}
        />
      </Folder>
      <Folder name="Loop">
        <Composition
          id="DiceLoop"
          component={DiceLoop}
          schema={diceLoopSchema}
          calculateMetadata={calculateDiceLoopMetadata}
          durationInFrames={690}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{seed: 'dice-1', cutFrames: 15, topLabel: 'CUTS', bottomLabel: 'CUBES', sound: true}}
        />
        <Composition
          id="JellySquish"
          component={JellySquish}
          schema={jellySquishSchema}
          calculateMetadata={calculateJellySquishMetadata}
          durationInFrames={675}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            seed: 'jelly-1',
            stepFrames: 27,
            perFlavor: 5,
            flavors: [
              {name: 'STRAWBERRY', color: '#FF7AA2'},
              {name: 'LEMON', color: '#FFD84D'},
              {name: 'MINT', color: '#5FE0B5'},
              {name: 'BLUEBERRY', color: '#7AA7FF'},
              {name: 'GRAPE', color: '#B08CFF'},
            ],
            sound: true,
          }}
        />
        <Composition
          id="RibbonSlice"
          component={RibbonSlice}
          schema={ribbonSliceSchema}
          calculateMetadata={calculateRibbonSliceMetadata}
          durationInFrames={720}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            seed: 'ribbon-1',
            sliceFrames: 18,
            slicesPerBar: 10,
            bars: [
              ['#F48FB1', '#F8BBD0', '#FFF1C1', '#FFD180', '#B2EBF2', '#80DEEA'],
              ['#A5D6A7', '#C5E1A5', '#FFF59D', '#FFCC80', '#EF9A9A', '#CE93D8'],
              ['#90CAF9', '#B39DDB', '#F48FB1', '#FFAB91', '#FFE082', '#C5E1A5'],
              ['#80CBC4', '#B2DFDB', '#E0F2F1', '#FFCDD2', '#F8BBD0', '#F48FB1'],
            ],
            label: 'SLICES',
            sound: true,
          }}
        />
      </Folder>
      <Folder name="Relaxing">
        <Composition
          id="Breathe"
          component={Breathe}
          durationInFrames={1110}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="SleepBreath"
          component={SleepBreath}
          schema={sleepBreathSchema}
          calculateMetadata={calculateSleepBreathMetadata}
          durationInFrames={1380}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{seed: 'stars-1', rounds: 2}}
        />
      </Folder>
      <Folder name="Cringe">
        <Composition
          id="CringeChat"
          component={CringeChat}
          durationInFrames={600}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="FamilyAirFryer"
          component={FamilyAirFryer}
          durationInFrames={FAMILY_AIR_FRYER_DURATION * 30}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
    </>
  );
};

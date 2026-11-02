import {Composition, Folder} from 'remotion';
import {BouncingBall} from './BouncingBall/BouncingBall';
import {CringeChat} from './CringeChat/CringeChat';
import {Breathe} from './Breathe/Breathe';
import {BallSort, calculateBallSortMetadata} from './BallSort/BallSort';
import {
  calculateFifteenPuzzleMetadata,
  FifteenPuzzle,
  fifteenPuzzleSchema,
} from './Satisfying/FifteenPuzzle/FifteenPuzzle';
import {calculateMassMachineMetadata, MassMachine, massMachineSchema} from './Wordless/MassMachine/MassMachine';
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
      </Folder>
    </>
  );
};

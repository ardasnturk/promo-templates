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

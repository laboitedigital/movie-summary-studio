import React from 'react';
import {Composition} from 'remotion';
import {FPS, W, H} from './theme';
import {TitleCard, titleCardSchema} from './TitleCard';
import {RainbowWipe} from './RainbowWipe';
import {LowerThird, lowerThirdSchema} from './LowerThird';
import {ProsCons, prosConsSchema} from './ProsCons';
import {ScoreDials, scoreDialsSchema} from './ScoreDials';
import {TierBoard, tierBoardSchema} from './TierBoard';
import {PosterPlacement, posterPlacementSchema} from './PosterPlacement';
import {VerdictCard, verdictSchema} from './VerdictCard';
import {Citation, citationSchema} from './Citation';
import {BigStat, bigStatSchema} from './BigStat';
import {Versus, versusSchema} from './Versus';
import {BoardRecap, boardRecapSchema} from './BoardRecap';

const P = (f: string) => `posters/${f}`;
const DEMO_ROWS = [
  {tier: 'S' as const, posters: [P('2018-bumblebee.jpg')]},
  {tier: 'A' as const, posters: [P('2007-transformers.jpg'), P('2011-dark-of-the-moon.jpg')]},
  {tier: 'B' as const, posters: [P('1986-the-transformers-the-movie.jpg'), P('2024-transformers-one.jpg')]},
  {tier: 'C' as const, posters: []},
  {tier: 'D' as const, posters: [P('2009-revenge-of-the-fallen.jpg'), P('2014-age-of-extinction.jpg'), P('2017-the-last-knight.jpg')]},
  {tier: 'F' as const, posters: []},
];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TitleCard" component={TitleCard} durationInFrames={210} fps={FPS} width={W} height={H}
      schema={titleCardSchema} defaultProps={{title: 'THE TRANSFORMERS: THE MOVIE', year: 1986}} />
    <Composition id="RainbowWipe" component={RainbowWipe} durationInFrames={42} fps={FPS} width={W} height={H} />
    <Composition id="LowerThird" component={LowerThird} durationInFrames={300} fps={FPS} width={W} height={H}
      schema={lowerThirdSchema} defaultProps={{label: 'THE MOVIE', year: 1986, tier: 'B' as const}} />
    <Composition id="ProsCons" component={ProsCons} durationInFrames={240} fps={FPS} width={W} height={H}
      schema={prosConsSchema} defaultProps={{
        pros: ["La mort d'Optimus, assumée", 'Une animation encore superbe'],
        cons: ['Le ton part dans tous les sens'],
      }} />
    <Composition id="ScoreDials" component={ScoreDials} durationInFrames={240} fps={FPS} width={W} height={H}
      schema={scoreDialsSchema} defaultProps={{critics: 58, audience: 86}} />
    <Composition id="TierBoard" component={TierBoard} durationInFrames={300} fps={FPS} width={W} height={H}
      schema={tierBoardSchema} defaultProps={{rows: DEMO_ROWS, highlight: 'B' as const, offsetX: 0, transparent: false}} />
    <Composition id="PosterPlacement" component={PosterPlacement} durationInFrames={150} fps={FPS} width={W} height={H}
      schema={posterPlacementSchema} defaultProps={{poster: P('1986-the-transformers-the-movie.jpg'), tier: 'B' as const, slotIndex: 0, offsetX: 0}} />
    <Composition id="VerdictCard" component={VerdictCard} durationInFrames={400} fps={FPS} width={W} height={H}
      schema={verdictSchema} defaultProps={{
        rows: DEMO_ROWS.map((r) => r.tier === 'B' ? {...r, posters: [P('2024-transformers-one.jpg')]} : r),
        poster: P('1986-the-transformers-the-movie.jpg'), tier: 'B' as const, slotIndex: 1, offsetX: 260, zoom: 2.0,
      }} />
    <Composition id="Citation" component={Citation} durationInFrames={270} fps={FPS} width={W} height={H}
      schema={citationSchema} defaultProps={{
        text: 'Un film pour vendre des jouets.', source: 'Le reproche habituel', accent: 'B' as const}} />
    <Composition id="BigStat" component={BigStat} durationInFrames={220} fps={FPS} width={W} height={H}
      schema={bigStatSchema} defaultProps={{value: 80, unit: '', label: 'minutes', countUp: true, color: 'accent' as const}} />
    <Composition id="Versus" component={Versus} durationInFrames={260} fps={FPS} width={W} height={H}
      schema={versusSchema} defaultProps={{
        leftTitle: 'Ennuyeux', rightTitle: 'Incohérent',
        left: ['45 minutes de bataille', 'Aucun enjeu'],
        right: ['La mythologie se réécrit', 'Deux films se contredisent'],
        leftColor: 'D' as const, rightColor: 'S' as const}} />
    <Composition id="BoardRecap" component={BoardRecap} durationInFrames={300} fps={FPS} width={W} height={H}
      schema={boardRecapSchema} defaultProps={{rows: DEMO_ROWS, focus: 'D' as const, zoom: 2.4, offsetX: 0}} />
  </>
);

import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {COLORS} from './theme';
import {BRAND, sec} from './timeline';
import {FontStyles} from './load-fonts';

import {IntroCard} from './components/IntroCard';
import {ChapterCards} from './components/ChapterCard';
import {KeywordPops} from './components/KeywordPop';
import {Highlights} from './components/Highlight';
import {ProgressBar} from './components/ProgressBar';
import {BrandChip} from './components/BrandChip';
import {SubscribeBug} from './components/SubscribeBug';
import {OutroCard} from './components/OutroCard';
import {SceneTransitions} from './components/SceneTransition';

export type HabillageProps = {
  /**
   * Decalage de lecture, en secondes. A 0 on rend la video entiere ; une
   * autre valeur permet de previsualiser un passage precis sans re-encoder
   * tout le film (les overlays restent cales sur le temps absolu).
   */
  offsetSec: number;
};

export const Habillage: React.FC<HabillageProps> = ({offsetSec}) => {
  const localFrame = useCurrentFrame();
  // Temps absolu dans la video source : c'est lui qui pilote tous les overlays.
  const frame = localFrame + sec(offsetSec);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.paper}}>
      <FontStyles />

      <OffthreadVideo
        src={staticFile('source.mp4')}
        startFrom={sec(offsetSec)}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />

      <Highlights frame={frame} />
      <SceneTransitions frame={frame} />
      <ChapterCards frame={frame} />
      <KeywordPops frame={frame} />
      <SubscribeBug frame={frame} />
      <BrandChip frame={frame} />
      <OutroCard frame={frame} />
      <IntroCard frame={frame} />

      {BRAND.showProgressBar ? <ProgressBar frame={frame} /> : null}
    </AbsoluteFill>
  );
};

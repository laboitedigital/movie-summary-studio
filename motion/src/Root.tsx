import React from 'react';
import {Composition} from 'remotion';
import {Habillage} from './Habillage';
import {FPS, HEIGHT, SOURCE_DURATION_IN_FRAMES, WIDTH, sec} from './timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Rendu final : la video source entiere, habillee. */}
      <Composition
        id="Habillage"
        component={Habillage}
        durationInFrames={SOURCE_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{offsetSec: 0}}
      />

      {/*
        Apercus courts pour iterer vite : on change `offsetSec` et la duree
        pour viser n'importe quel passage sans re-encoder les 4 min 28.
      */}
      <Composition
        id="Apercu"
        component={Habillage}
        durationInFrames={sec(12)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{offsetSec: 0}}
      />

      <Composition
        id="ApercuChapitre"
        component={Habillage}
        durationInFrames={sec(10)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{offsetSec: 18}}
      />

      <Composition
        id="ApercuFin"
        component={Habillage}
        durationInFrames={sec(9.5)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{offsetSec: 258.5}}
      />
    </>
  );
};

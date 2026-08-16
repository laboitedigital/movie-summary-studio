import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP} from './theme';
import {Stage, strokeStyle} from './shared';

export const echelleSchema = z.object({
  gros: z.array(z.string()).min(2),   // affiches des autres films
  petit: z.string(),                  // celle qui reduit l echelle
  legende: z.string().default(''),
});

/** Plan 113 : « il reduit l echelle au lieu de l augmenter ».
 *  Les autres films occupent tout le cadre et se chevauchent ; Bumblebee est
 *  petit, net, au centre, et c est le seul qu on lit. La demonstration est
 *  dans les tailles, pas dans un texte. */
export const EchelleFilms: React.FC<z.infer<typeof echelleSchema>> = ({gros, petit, legende}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        {gros.map((p, i) => {
          const e = spring({frame: frame - i * 4, fps, config: SPRING_POP, durationInFrames: 24});
          const n = gros.length;
          const ang = (i / n) * Math.PI * 2;
          const x = Math.cos(ang) * 640, y = Math.sin(ang) * 300;
          return (
            <Img key={i} src={staticFile(p)} style={{
              position: 'absolute', width: 460, borderRadius: 12,
              transform: `translate(${x}px, ${y}px) scale(${e}) rotate(${(i % 2 ? 5 : -5)}deg)`,
              filter: 'brightness(0.45) saturate(0.6)',
              boxShadow: '0 14px 0 rgba(0,0,0,0.5)',
            }} />
          );
        })}
        <Img src={staticFile(petit)} style={{
          position: 'absolute', width: 260, borderRadius: 10,
          transform: `scale(${spring({frame: frame - 22, fps, config: SPRING_POP, durationInFrames: 28})})`,
          border: `6px solid ${COLORS.accent}`,
          boxShadow: '0 0 60px rgba(247,182,50,0.55), 0 16px 0 rgba(0,0,0,0.55)',
        }} />
        {legende ? (
          <div style={{
            position: 'absolute', bottom: 90,
            opacity: interpolate(frame, [40, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          }}>
            <span style={{fontSize: 56, fontWeight: 700, color: COLORS.white, ...strokeStyle(7)}}>
              {legende.toUpperCase()}
            </span>
          </div>
        ) : null}
      </AbsoluteFill>
    </Stage>
  );
};

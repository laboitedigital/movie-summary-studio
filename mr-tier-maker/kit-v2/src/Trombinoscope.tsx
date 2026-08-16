import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, RAINBOW, SPRING_POP} from './theme';
import {Stage, strokeStyle, Pill} from './shared';

export const trombinoscopeSchema = z.object({
  names: z.array(z.string()).min(6),
  cells: z.number().default(8),
});

/** Le gag du plan 013 : huit fiches de robots dont les noms defilent de plus en
 *  plus vite. On ne doit PAS pouvoir les lire — c est exactement le reproche que
 *  la narration fait au film. L acceleration est donc le sujet, pas un effet. */
export const Trombinoscope: React.FC<z.infer<typeof trombinoscopeSchema>> = ({names, cells}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // periode de permutation : 14 frames au debut, 2 a la fin
  const periode = Math.max(2, Math.round(interpolate(
    frame, [0, durationInFrames], [14, 2], {extrapolateRight: 'clamp'})));
  const tick = Math.floor(frame / periode);

  return (
    <Stage>
      <AbsoluteFill style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 34,
        padding: '150px 110px', alignContent: 'center',
      }}>
        {Array.from({length: cells}, (_, i) => {
          const entree = spring({frame: frame - i * 3, fps, config: SPRING_POP, durationInFrames: 20});
          const nom = names[Math.floor(random(`t-${i}-${tick}`) * names.length)];
          const col = RAINBOW[i % RAINBOW.length];
          return (
            <div key={i} style={{transform: `scale(${entree})`, textAlign: 'center'}}>
              <div style={{
                height: 150, borderRadius: 20, background: COLORS.card,
                borderTop: '2px solid rgba(255,255,255,0.22)',
                boxShadow: '0 10px 0 rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{fontSize: 74, fontWeight: 700, color: col, ...strokeStyle(6)}}>?</span>
              </div>
              <Pill bg={col} style={{marginTop: 12, height: 54, justifyContent: 'center', padding: '0 14px'}}>
                <span style={{
                  fontSize: 27, fontWeight: 600, color: COLORS.ink, letterSpacing: 1,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}>{nom.toUpperCase()}</span>
              </Pill>
            </div>
          );
        })}
      </AbsoluteFill>
    </Stage>
  );
};

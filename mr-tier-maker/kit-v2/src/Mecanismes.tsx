import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP, EASE_OUT_EXPO} from './theme';
import {Stage, strokeStyle} from './shared';

export const mecanismesSchema = z.object({
  words: z.array(z.string()).min(2),
  color: z.enum(['S','A','B','C','D','F','accent']).default('A'),
});

const COL = {S: COLORS.tierS, A: COLORS.tierA, B: COLORS.tierB, C: COLORS.tierC,
             D: COLORS.tierD, F: COLORS.tierF, accent: COLORS.accent};

/** Plan 034 : « ce ne sont pas de la magie, ce sont des mecanismes ».
 *  Clip.cafe n a aucun plan de transformation pour ce film — le catalogue est
 *  indexe sur les dialogues. On fait donc la demonstration avec des mots qui
 *  s emboitent : chacun glisse depuis un cote, cale avec un leger depassement,
 *  et pivote de quelques degres comme une piece qui trouve sa place. */
export const Mecanismes: React.FC<z.infer<typeof mecanismesSchema>> = ({words, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const col = COL[color];

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 26}}>
        {words.map((w, i) => {
          const t0 = 8 + i * 22;
          const glisse = spring({frame: frame - t0, fps, config: SPRING_POP, durationInFrames: 30});
          const cote = i % 2 === 0 ? -1 : 1;
          const x = interpolate(glisse, [0, 1], [cote * 1200, 0]);
          // la piece pivote puis s aligne : c est le mouvement d un mecanisme
          const rot = interpolate(glisse, [0, 1], [cote * 9, 0], {easing: EASE_OUT_EXPO});
          return (
            <div key={i} style={{
              transform: `translateX(${x}px) rotate(${rot}deg)`,
              display: 'flex', alignItems: 'center', gap: 22,
            }}>
              <div style={{
                width: 26, height: 96, borderRadius: 8, background: col,
                boxShadow: '0 8px 0 rgba(0,0,0,0.45)',
              }} />
              <span style={{
                fontSize: 132, fontWeight: 700, color: COLORS.white, letterSpacing: 6,
                ...strokeStyle(9),
              }}>{w.toUpperCase()}</span>
            </div>
          );
        })}
      </AbsoluteFill>
    </Stage>
  );
};

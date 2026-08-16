import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP} from './theme';
import {Stage, strokeStyle} from './shared';

export const placeholderSchema = z.object({what: z.string(), shot: z.string()});

/** Carton d attente pour un media non fourni. Volontairement visible : dans une
 *  video de test, un trou signale est plus utile qu un trou masque. */
export const Placeholder: React.FC<z.infer<typeof placeholderSchema>> = ({what, shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: SPRING_POP, durationInFrames: 22});
  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          transform: `scale(${s})`, border: `6px dashed ${COLORS.cardEdge}`, borderRadius: 34,
          padding: '52px 76px', textAlign: 'center', background: 'rgba(22,35,63,0.55)',
        }}>
          <div style={{fontSize: 34, fontWeight: 600, color: COLORS.accent, letterSpacing: 3}}>
            PLAN {shot} — MÉDIA À FOURNIR
          </div>
          <div style={{fontSize: 58, fontWeight: 600, color: '#fff', marginTop: 20, maxWidth: 1200, ...strokeStyle(4)}}>
            {what}
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

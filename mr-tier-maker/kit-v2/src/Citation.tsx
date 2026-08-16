import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP, SPRING_SOFT} from './theme';
import {Stage, strokeStyle} from './shared';
import {fitFontSize} from './fit';

export const citationSchema = z.object({
  text: z.string(),
  source: z.string().optional(),
  accent: z.enum(['S','A','B','C','D','F']).optional(),
});

const ACCENT = {S: COLORS.tierS, A: COLORS.tierA, B: COLORS.tierB,
                C: COLORS.tierC, D: COLORS.tierD, F: COLORS.tierF};

/** Une phrase qui se pose mot a mot. Chaque mot est un noeud a part : le
 *  navigateur gere l espacement et la ligne de base, on n a qu a decaler les
 *  entrees. C etait exactement le point qui cassait en ffmpeg. */
export const Citation: React.FC<z.infer<typeof citationSchema>> = ({text, source, accent}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const words = text.split(' ');
  const bar = accent ? ACCENT[accent] : COLORS.accent;
  const fs = fitFontSize(text, 1240, 72, 48);

  const card = spring({frame, fps, config: SPRING_POP, durationInFrames: 26});
  const out = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          transform: `scale(${card})`, opacity: out,
          maxWidth: 1440, background: COLORS.card, borderRadius: 40,
          borderTop: `2px solid ${COLORS.cardEdge}`, boxShadow: '0 14px 0 rgba(0,0,0,0.45)',
          padding: '54px 66px 54px 78px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 34, top: 40, bottom: 40, width: 12,
            borderRadius: 6, background: bar,
          }} />
          <div style={{display: 'flex', flexWrap: 'wrap', gap: `0 ${fs * 0.28}px`}}>
            {words.map((w, i) => {
              const s = spring({frame: frame - 14 - i * 5, fps, config: SPRING_SOFT, durationInFrames: 18});
              return (
                <span key={i} style={{
                  fontSize: fs, fontWeight: 700, color: '#fff', lineHeight: 1.28,
                  opacity: s, transform: `translateY(${interpolate(s, [0, 1], [22, 0])}px)`,
                  ...strokeStyle(5),
                }}>{w}</span>
              );
            })}
          </div>
        </div>
        {source ? (
          <div style={{
            marginTop: 34, fontSize: 34, fontWeight: 500, color: COLORS.dim, opacity: out *
              spring({frame: frame - 14 - words.length * 5 - 6, fps, config: SPRING_SOFT, durationInFrames: 16}),
          }}>{source}</div>
        ) : null}
      </AbsoluteFill>
    </Stage>
  );
};

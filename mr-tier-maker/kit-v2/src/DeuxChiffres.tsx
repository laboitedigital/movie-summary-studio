import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, EASE_OUT_EXPO, SPRING_POP} from './theme';
import {Stage, strokeStyle} from './shared';

export const deuxChiffresSchema = z.object({
  a: z.object({value: z.number(), label: z.string()}),
  b: z.object({value: z.number(), label: z.string()}),
});

/** Plan 155 : « neuf films, quarante ans ». Rappel du plan 001, qui ouvrait sur
 *  le chiffre 9 — la boucle se ferme. Les deux comptent en meme temps pour que
 *  la figure se lise d un coup, pas en deux temps. */
export const DeuxChiffres: React.FC<z.infer<typeof deuxChiffresSchema>> = ({a, b}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = interpolate(frame, [10, 64], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});

  const bloc = (v: number, lab: string, col: string, delai: number) => {
    const pop = spring({frame: frame - delai, fps, config: SPRING_POP, durationInFrames: 26});
    return (
      <div style={{textAlign: 'center', transform: `scale(${pop})`}}>
        <div style={{
          fontSize: 260, fontWeight: 700, color: col, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums', ...strokeStyle(11),
        }}>{Math.round(v * t)}</div>
        <div style={{
          marginTop: 18, background: col, borderRadius: 999, padding: '12px 38px',
          borderTop: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 10px 0 rgba(0,0,0,0.45)',
        }}>
          <span style={{fontSize: 42, fontWeight: 600, color: COLORS.ink, letterSpacing: 2}}>
            {lab.toUpperCase()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 150}}>
        {bloc(a.value, a.label, COLORS.accent, 6)}
        {bloc(b.value, b.label, COLORS.tierS, 14)}
      </AbsoluteFill>
    </Stage>
  );
};

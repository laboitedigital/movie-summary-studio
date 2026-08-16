import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, EASE_OUT_EXPO, SPRING_POP} from './theme';
import {Stage, strokeStyle} from './shared';

export const bigStatSchema = z.object({
  value: z.number(),
  unit: z.string().default(''),
  label: z.string(),
  countUp: z.boolean().default(true),
  color: z.enum(['S','A','B','C','D','F','accent']).default('accent'),
});

const COL = {S: COLORS.tierS, A: COLORS.tierA, B: COLORS.tierB, C: COLORS.tierC,
             D: COLORS.tierD, F: COLORS.tierF, accent: COLORS.accent};

/** Le chiffre isole : « 80 MINUTES », « 40 TONNES », « 9 FILMS ».
 *  Distinct de ScoreDials, qui est reserve aux pourcentages avec jauge. */
export const BigStat: React.FC<z.infer<typeof bigStatSchema>> = ({value, unit, label, countUp, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const col = COL[color];

  const t = interpolate(frame, [10, 70], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
  const shown = countUp ? Math.round(value * t) : value;

  const pop = spring({frame: frame - 6, fps, config: SPRING_POP, durationInFrames: 26});
  const hit = spring({frame: frame - 70, fps, config: SPRING_POP, durationInFrames: 16});
  const kick = 1 + interpolate(hit, [0, 1], [0.09, 0]) * hit;
  const lab = spring({frame: frame - 78, fps, config: SPRING_POP, durationInFrames: 22});

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          display: 'flex', alignItems: 'baseline', transform: `scale(${pop * kick})`,
        }}>
          <span style={{
            fontSize: 300, fontWeight: 700, color: col, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', ...strokeStyle(12),
          }}>{shown}</span>
          {unit ? (
            <span style={{fontSize: 120, fontWeight: 700, color: col, marginLeft: 22, ...strokeStyle(8)}}>
              {unit}
            </span>
          ) : null}
        </div>
        <div style={{
          marginTop: 26, transform: `scale(${lab})`,
          background: col, borderRadius: 999, padding: '14px 44px',
          borderTop: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 10px 0 rgba(0,0,0,0.45)',
        }}>
          <span style={{fontSize: 46, fontWeight: 600, color: COLORS.ink, letterSpacing: 2}}>
            {label.toUpperCase()}
          </span>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, EASE_OUT_EXPO, SPRING_POP, TIER_COLOR} from './theme';
import {FontFace, FONT, Pill, strokeStyle} from './shared';

export const lowerThirdSchema = z.object({
  label: z.string(), year: z.number(),
  tier: z.enum(['S', 'A', 'B', 'C', 'D', 'F']).optional(),
});

export const LowerThird: React.FC<z.infer<typeof lowerThirdSchema>> = ({label, year, tier}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  // La sortie doit se TERMINER avant la derniere frame. A duration-18 avec 18
  // frames de course, elle finissait pile a la fin : la derniere image gardait
  // un liseré du bandeau, et repeatlast le figeait pour tout le reste du plan.
  // C'est le bandeau de 1986 qui restait a l'ecran a 48 s.
  const out = durationInFrames - 34;
  const bg = tier ? TIER_COLOR[tier] : COLORS.tierS;

  const enter = spring({frame, fps, config: SPRING_POP, durationInFrames: 20});
  const exit = interpolate(frame, [out, out + 26], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
  const x = interpolate(enter, [0, 1], [-900, 0]) - exit * 1150;
  // micro-flottement : vivant sans etre distrayant
  const float = Math.sin((frame / fps) * (Math.PI * 2) / 4) * 3;
  const dot = interpolate(frame, [6, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{fontFamily: FONT, background: 'transparent'}}>
      <FontFace />
      <div style={{position: 'absolute', left: 96, top: 940, transform: `translate(${x}px, ${float}px)`}}>
        <Pill bg={bg} radius={999} style={{padding: '18px 46px'}}>
          <span style={{fontSize: 52, fontWeight: 600, color: '#fff', ...strokeStyle(6), whiteSpace: 'nowrap'}}>
            {label}
          </span>
          <span style={{fontSize: 52, fontWeight: 600, color: '#fff', opacity: dot, margin: '0 18px', ...strokeStyle(6)}}>·</span>
          <span style={{fontSize: 52, fontWeight: 600, color: '#fff', opacity: dot, ...strokeStyle(6)}}>{year}</span>
        </Pill>
      </div>
    </AbsoluteFill>
  );
};

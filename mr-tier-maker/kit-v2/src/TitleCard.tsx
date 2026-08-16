import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, EASE_OUT_EXPO, SPRING_POP} from './theme';
import {Pill, Stage, strokeStyle} from './shared';
import {fitFontSize} from './fit';

export const titleCardSchema = z.object({title: z.string(), year: z.number()});

export const TitleCard: React.FC<z.infer<typeof titleCardSchema>> = ({title, year}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const out = durationInFrames - 30;

  const inX = spring({frame, fps, config: SPRING_POP, durationInFrames: 24});
  const outX = interpolate(frame, [out, out + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
  const barX = interpolate(inX, [0, 1], [-1700, 0]) + outX * 2100;

  const pop = spring({frame: frame - 10, fps, config: SPRING_POP, durationInFrames: 24});
  const yearS = interpolate(pop, [0, 1], [0, 1]);
  const outY = interpolate(frame, [out + 5, out + 27], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});

  const rule = interpolate(frame, [24, 48], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});

  const fs = fitFontSize(title, 1360, 88);

  return (
    <Stage>
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 160}}>
        <div style={{transform: `translateX(${barX}px)`, position: 'relative', width: 'fit-content', maxWidth: 1500}}>
          <Pill bg={COLORS.accent} radius={26} style={{padding: '26px 54px'}}>
            <span style={{fontSize: fs, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap', letterSpacing: -1}}>
              {title}
            </span>
          </Pill>
          <div style={{
            position: 'absolute', left: 4, bottom: -14, height: 5, borderRadius: 3,
            width: `${rule * 100}%`, background: COLORS.accentHi,
          }} />
        </div>

        <div style={{
          marginTop: 40, transformOrigin: 'left center',
          transform: `translateX(${outY * 2100}px) scale(${yearS})`,
        }}>
          <Pill bg={COLORS.card} radius={22} style={{padding: '14px 34px', width: 'fit-content'}}>
            <span style={{fontSize: 52, fontWeight: 600, color: COLORS.accent, ...strokeStyle(0)}}>{year}</span>
          </Pill>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

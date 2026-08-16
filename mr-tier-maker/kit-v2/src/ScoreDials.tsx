import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, EASE_OUT_EXPO, SPRING_POP} from './theme';
import {Stage, strokeStyle} from './shared';

export const scoreDialsSchema = z.object({
  critics: z.number().min(0).max(100), audience: z.number().min(0).max(100).optional(),
});

const colorFor = (v: number) => (v < 40 ? COLORS.tierS : v < 70 ? COLORS.tierB : COLORS.tierC);

const Dial: React.FC<{value: number; label: string; delay: number}> = ({value, label, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // une seule valeur interpolee pilote l arc ET le compteur : ils ne peuvent pas se desynchroniser
  const t = interpolate(frame - delay, [0, 70], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
  const shown = value * t;
  const col = colorFor(value);

  const R = 148, SW = 24, C = 2 * Math.PI * R;
  const pop = spring({frame: frame - delay - 70, fps, config: SPRING_POP, durationInFrames: 18});
  const numScale = 1 + interpolate(pop, [0, 1], [0, 0.08]) * (1 - Math.min(1, Math.max(0, (frame - delay - 88) / 12)));

  const card = spring({frame: frame - delay, fps, config: SPRING_POP, durationInFrames: 24});

  return (
    <div style={{
      width: 420, height: 420, borderRadius: 32, background: COLORS.card,
      borderTop: `2px solid ${COLORS.cardEdge}`, boxShadow: '0 12px 0 rgba(0,0,0,0.45)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${card})`, margin: '0 30px', position: 'relative',
    }}>
      <svg width={420} height={420} style={{position: 'absolute', inset: 0}}>
        <g transform="translate(210,210) rotate(-90)">
          <circle r={R} fill="none" stroke={COLORS.cardEdge} strokeWidth={SW} />
          {Array.from({length: 20}).map((_, i) => {
            const a = (i / 20) * Math.PI * 2;
            const on = i / 20 <= shown / 100;
            return <line key={i}
              x1={Math.cos(a) * (R - 30)} y1={Math.sin(a) * (R - 30)}
              x2={Math.cos(a) * (R - 20)} y2={Math.sin(a) * (R - 20)}
              stroke={on ? col : COLORS.cardEdge} strokeWidth={4} strokeLinecap="round" />;
          })}
          <circle r={R} fill="none" stroke={col} strokeWidth={SW} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)} />
        </g>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 1,
      }}>
        <span style={{
          fontSize: 108, fontWeight: 700, color: col, fontVariantNumeric: 'tabular-nums',
          transform: `scale(${numScale})`, lineHeight: 1, ...strokeStyle(7),
        }}>
          {Math.round(shown)}&nbsp;%
        </span>
        <span style={{
          marginTop: 10, fontSize: 30, fontWeight: 500,
          color: COLORS.white, opacity: 0.72, whiteSpace: 'nowrap',
        }}>{label}</span>
      </div>
    </div>
  );
};

export const ScoreDials: React.FC<z.infer<typeof scoreDialsSchema>> = ({critics, audience}) => (
  <Stage>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}}>
      <Dial value={critics} label="Score critiques" delay={12} />
      {audience !== undefined ? <Dial value={audience} label="Score public" delay={24} /> : null}
    </AbsoluteFill>
  </Stage>
);

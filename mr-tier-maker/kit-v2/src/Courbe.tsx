import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP, EASE_OUT_EXPO} from './theme';
import {Stage, strokeStyle} from './shared';

export const courbeSchema = z.object({
  points: z.array(z.number()).min(3),      // 0 = bas, 1 = haut
  mode: z.enum(['trace', 'effondre']).default('trace'),
  mot: z.string().optional(),
  color: z.enum(['S','A','B','C','D','F','accent']).default('B'),
});

const COL = {S: COLORS.tierS, A: COLORS.tierA, B: COLORS.tierB, C: COLORS.tierC,
             D: COLORS.tierD, F: COLORS.tierF, accent: COLORS.accent};

const VB = {w: 1500, h: 620};

/** Plan 123 : la courbe de qualite, haut / creux / haut. Plan 127 : la meme
 *  courbe qui s effondre sur un seul mot. Les deux partagent le trace pour que
 *  le second lise comme la suite du premier, pas comme un autre graphique. */
export const Courbe: React.FC<z.infer<typeof courbeSchema>> = ({points, mode, mot, color}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const col = COL[color];

  const chute = mode === 'effondre'
    ? interpolate(frame, [6, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO})
    : 0;

  const xy = points.map((p, i) => {
    const x = (i / (points.length - 1)) * VB.w;
    const val = p * (1 - chute);                     // tout retombe au sol
    const y = VB.h - val * VB.h;
    return [x, y] as const;
  });
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // le trace se dessine de gauche a droite
  const avance = mode === 'trace'
    ? interpolate(frame, [8, durationInFrames * 0.75], [0, 1],
        {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO})
    : 1;
  const motPop = spring({frame: frame - 20, fps, config: SPRING_POP, durationInFrames: 24});

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <svg width={VB.w} height={VB.h + 40} viewBox={`0 -20 ${VB.w} ${VB.h + 40}`}>
          <line x1={0} y1={VB.h} x2={VB.w} y2={VB.h} stroke={COLORS.cardEdge} strokeWidth={6} />
          <path d={d} fill="none" stroke="#000" strokeWidth={26}
                strokeLinecap="round" strokeLinejoin="round"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - avance} />
          <path d={d} fill="none" stroke={col} strokeWidth={14}
                strokeLinecap="round" strokeLinejoin="round"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - avance} />
        </svg>
        {mot ? (
          <div style={{
            position: 'absolute', transform: `scale(${motPop})`,
            background: COLORS.tierD, borderRadius: 18, padding: '18px 56px',
            borderTop: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 12px 0 rgba(0,0,0,0.5)',
          }}>
            <span style={{fontSize: 110, fontWeight: 700, color: COLORS.white, letterSpacing: 6, ...strokeStyle(8)}}>
              {mot.toUpperCase()}
            </span>
          </div>
        ) : null}
      </AbsoluteFill>
    </Stage>
  );
};

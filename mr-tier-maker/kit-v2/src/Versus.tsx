import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP, SPRING_SOFT} from './theme';
import {Stage, strokeStyle} from './shared';

export const versusSchema = z.object({
  leftTitle: z.string(), rightTitle: z.string(),
  left: z.array(z.string()).max(4), right: z.array(z.string()).max(4),
  leftColor: z.enum(['S','A','B','C','D','F']).default('D'),
  rightColor: z.enum(['S','A','B','C','D','F']).default('S'),
});

const COL = {S: COLORS.tierS, A: COLORS.tierA, B: COLORS.tierB,
             C: COLORS.tierC, D: COLORS.tierD, F: COLORS.tierF};

const Column: React.FC<{title: string; items: string[]; color: string; from: number; delay: number}> =
({title, items, color, from, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: SPRING_POP, durationInFrames: 28});
  const x = interpolate(s, [0, 1], [from, 0]);
  return (
    <div style={{width: 730, transform: `translateX(${x}px)`}}>
      <div style={{
        background: color, borderRadius: 26, padding: '18px 34px', marginBottom: 24,
        borderTop: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 10px 0 rgba(0,0,0,0.45)',
        textAlign: 'center',
      }}>
        <span style={{fontSize: 46, fontWeight: 700, color: '#fff', letterSpacing: 1, ...strokeStyle(6)}}>
          {title.toUpperCase()}
        </span>
      </div>
      {items.map((it, i) => {
        const si = spring({frame: frame - delay - 14 - i * 8, fps, config: SPRING_SOFT, durationInFrames: 20});
        return (
          <div key={i} style={{
            background: COLORS.bgCard, borderRadius: 20, padding: '20px 30px', marginBottom: 16,
            borderTop: `2px solid ${COLORS.cardEdge}`, boxShadow: '0 8px 0 rgba(0,0,0,0.4)',
            opacity: si, transform: `translateY(${interpolate(si, [0, 1], [26, 0])}px)`,
          }}>
            <span style={{fontSize: 38, fontWeight: 500, color: '#fff'}}>{it}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Comparaison : les deux colonnes entrent par des cotes opposes. C est la
 *  seule famille du kit ou le mouvement porte le sens — l opposition. */
export const Versus: React.FC<z.infer<typeof versusSchema>> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const vs = spring({frame: frame - 20, fps, config: SPRING_POP, durationInFrames: 24});
  return (
    <Stage>
      <AbsoluteFill style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 240,
      }}>
        <Column title={p.leftTitle} items={p.left} color={COL[p.leftColor]} from={-1400} delay={0} />
        <Column title={p.rightTitle} items={p.right} color={COL[p.rightColor]} from={1400} delay={8} />
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <span style={{
          fontSize: 96, fontWeight: 700, color: COLORS.white, opacity: 0.9,
          transform: `scale(${vs}) rotate(${interpolate(vs, [0, 1], [-18, -8])}deg)`,
          ...strokeStyle(10),
        }}>VS</span>
      </AbsoluteFill>
    </Stage>
  );
};

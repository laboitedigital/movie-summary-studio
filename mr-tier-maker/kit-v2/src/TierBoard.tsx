import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_SOFT, SPRING_POP, TIERS, TIER_COLOR, Tier} from './theme';
import {FontFace, FONT, Grain, Stage, strokeStyle} from './shared';

export const tierBoardSchema = z.object({
  rows: z.array(z.object({tier: z.enum(['S','A','B','C','D','F']), posters: z.array(z.string())})),
  highlight: z.enum(['S','A','B','C','D','F']).optional(),
  /** decale le tableau vers la droite pour laisser la place a la mascotte */
  offsetX: z.number().default(0),
  transparent: z.boolean().default(false),
});

export const BOARD = {
  badge: 96, rowH: 128, gap: 18, width: 1520,
  posterW: 84, posterH: 126, posterGap: 10,
};
export const boardTop = (n = 6) => (1080 - (n * BOARD.rowH + (n - 1) * BOARD.gap)) / 2;
export const rowY = (i: number) => boardTop() + i * (BOARD.rowH + BOARD.gap);

export const BoardInner: React.FC<z.infer<typeof tierBoardSchema>> = ({rows, highlight, offsetX}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const left = (1920 - BOARD.width) / 2 + offsetX;
  const byTier = new Map(rows.map((r) => [r.tier, r.posters]));

  return (
    <AbsoluteFill>
      {TIERS.map((t, i) => {
        const s = spring({frame: frame - i * 4, fps, config: SPRING_SOFT, durationInFrames: 30});
        const y = interpolate(s, [0, 1], [160, 0]);
        const badge = spring({frame: frame - i * 4 - 4, fps, config: SPRING_POP, durationInFrames: 22});
        const isHi = highlight === t;
        const pulse = isHi
          ? Math.max(0, Math.sin(interpolate(frame, [60, 120], [0, Math.PI * 2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})))
          : 0;
        const posters = byTier.get(t) ?? [];
        return (
          <div key={t} style={{
            position: 'absolute', left, top: rowY(i), width: BOARD.width, height: BOARD.rowH,
            transform: `translateY(${y}px)`, display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              width: BOARD.badge, height: BOARD.badge, borderRadius: 22, background: TIER_COLOR[t],
              borderTop: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 8px 0 rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${badge})`, flexShrink: 0, zIndex: 2,
            }}>
              {/* lettre blanche, contour noir : c est le seul traitement qui tient
                  sur les six couleurs, du rouge clair au violet fonce */}
              <span style={{fontSize: 74, fontWeight: 700, color: '#fff', lineHeight: 1, ...strokeStyle(8)}}>{t}</span>
            </div>
            <div style={{
              flex: 1, height: BOARD.rowH, marginLeft: 14, borderRadius: 20,
              background: COLORS.bgCard, borderTop: `2px solid ${COLORS.cardEdge}`,
              boxShadow: `0 8px 0 rgba(0,0,0,0.45)${pulse ? `, 0 0 ${40 * pulse}px ${14 * pulse}px ${TIER_COLOR[t]}` : ''}`,
              display: 'flex', alignItems: 'center', paddingLeft: 14, gap: BOARD.posterGap,
            }}>
              {posters.map((p, j) => {
                const ps = spring({frame: frame - 30 - j * 2, fps, config: SPRING_SOFT, durationInFrames: 20});
                return <Img key={j} src={staticFile(p)} style={{
                  width: BOARD.posterW, height: BOARD.posterH, borderRadius: 8, objectFit: 'cover',
                  boxShadow: '0 4px 0 rgba(0,0,0,0.5)',
                  opacity: ps, transform: `scale(${interpolate(ps, [0, 1], [0.9, 1])})`,
                }} />;
              })}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const TierBoard: React.FC<z.infer<typeof tierBoardSchema>> = (p) => {
  if (p.transparent) {
    return (
      <AbsoluteFill style={{fontFamily: FONT, background: 'transparent'}}>
        <FontFace /><BoardInner {...p} />
      </AbsoluteFill>
    );
  }
  return <Stage><BoardInner {...p} /></Stage>;
};

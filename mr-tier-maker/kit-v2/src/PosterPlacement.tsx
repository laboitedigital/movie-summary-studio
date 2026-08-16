import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {EASE_OUT_EXPO, SPRING_POP, TIERS, TIER_COLOR} from './theme';
import {FontFace, FONT} from './shared';
import {BOARD, rowY} from './TierBoard';

export const posterPlacementSchema = z.object({
  poster: z.string(),
  tier: z.enum(['S','A','B','C','D','F']),
  slotIndex: z.number().default(0),
  offsetX: z.number().default(0),
});

/** Le payoff : l affiche arrive en grand, hesite, puis part en courbe se ranger
 *  dans sa case. Fond transparent — se pose sur le TierBoard dans ffmpeg. */
export const PosterPlacement: React.FC<z.infer<typeof posterPlacementSchema>> = ({poster, tier, slotIndex, offsetX}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const i = TIERS.indexOf(tier);
  const left = (1920 - BOARD.width) / 2 + offsetX;

  const target = {
    x: left + BOARD.badge + 14 + 14 + slotIndex * (BOARD.posterW + BOARD.posterGap),
    y: rowY(i) + (BOARD.rowH - BOARD.posterH) / 2,
  };
  const bigH = 560, bigW = bigH * (2 / 3);
  const start = {x: (1920 - bigW) / 2, y: (1080 - bigH) / 2};

  const appear = spring({frame, fps, config: SPRING_POP, durationInFrames: 30});
  const hesitate = interpolate(frame, [30, 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fly = interpolate(frame, [45, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
  const land = spring({frame: frame - 80, fps, config: SPRING_POP, durationInFrames: 20});

  // trajectoire courbe : quadratique avec un sommet au-dessus des deux points
  const ctrl = {x: (start.x + target.x) / 2, y: Math.min(start.y, target.y) - 220};
  const q = (a: number, b: number, c: number, t: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

  const scale = interpolate(fly, [0, 1], [1, BOARD.posterW / bigW]);
  const x = fly === 0 ? start.x : q(start.x, ctrl.x, target.x, fly);
  const y = fly === 0 ? start.y : q(start.y, ctrl.y, target.y, fly);

  const wob = hesitate > 0 && fly === 0 ? Math.sin(hesitate * Math.PI * 4) * 1.5 : 0;
  const rot = interpolate(appear, [0, 1], [-4, 0]) + wob;
  const squash = 1 + interpolate(land, [0, 1], [-0.08, 0]) * (1 - land);

  return (
    <AbsoluteFill style={{fontFamily: FONT, background: 'transparent'}}>
      <FontFace />
      {/* pulsation de la rangee a l atterrissage */}
      {land > 0 ? (
        <div style={{
          position: 'absolute', left, top: rowY(i), width: BOARD.width, height: BOARD.rowH,
          borderRadius: 20, boxShadow: `0 0 ${60 * (1 - land)}px ${18 * (1 - land)}px ${TIER_COLOR[tier]}`,
          opacity: 1 - land,
        }} />
      ) : null}

      <Img src={staticFile(poster)} style={{
        position: 'absolute', left: x, top: y, width: bigW, height: bigH,
        transformOrigin: 'top left',
        transform: `scale(${appear * scale}, ${appear * scale * squash}) rotate(${rot}deg)`,
        borderRadius: 8 / scale, boxShadow: '0 12px 24px rgba(0,0,0,0.6)',
      }} />

      {/* eclat de particules a l impact */}
      {land > 0 && land < 1 ? Array.from({length: 6}).map((_, k) => {
        const a = (k / 6) * Math.PI * 2 + random(`a${k}`);
        const d = 90 * land;
        return <div key={k} style={{
          position: 'absolute', left: target.x + BOARD.posterW / 2 + Math.cos(a) * d,
          top: target.y + BOARD.posterH / 2 + Math.sin(a) * d + 60 * land * land,
          width: 12, height: 12, borderRadius: 6, background: TIER_COLOR[tier], opacity: 1 - land,
        }} />;
      }) : null}
    </AbsoluteFill>
  );
};

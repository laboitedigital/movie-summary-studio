import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {EASE_OUT_EXPO, SPRING_POP, TIERS, TIER_COLOR} from './theme';
import {FontFace, FONT} from './shared';
import {BOARD, BoardInner, rowY} from './TierBoard';

export const verdictTableauSchema = z.object({
  rows: z.array(z.object({tier: z.enum(['S','A','B','C','D','F']), posters: z.array(z.string())})),
  poster: z.string(),
  tier: z.enum(['S','A','B','C','D','F']),
  slotIndex: z.number().default(0),
  offsetX: z.number().default(0),
});

/**
 * Carton verdict, version sobre.
 *
 * Le carton d origine poussait la camera sur une seule rangee et reservait les
 * 880 premiers pixels a la mascotte : on ne voyait plus le tableau, et le
 * classement — qui est le sujet de la chaine — passait au second plan.
 *
 * Ici le tableau ne bouge pas et reste entier du debut a la fin. Toute
 * l animation tient dans l affiche : elle arrive, elle hesite, elle se pose, et
 * sa rangee accuse le coup. Rien d autre ne demande l attention.
 *
 * Fond transparent, aucune video : Chromium ne decode pas le ProRes. Le montage
 * empile fond de chaine -> ce rendu.
 */
export const VerdictTableau: React.FC<z.infer<typeof verdictTableauSchema>> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const i = TIERS.indexOf(p.tier);
  const col = TIER_COLOR[p.tier];
  const left = (1920 - BOARD.width) / 2 + p.offsetX;

  // La case visee, en coordonnees ecran
  const cible = {
    x: left + BOARD.badge + 14 + 14 + p.slotIndex * (BOARD.posterW + BOARD.posterGap),
    y: rowY(i) + (BOARD.rowH - BOARD.posterH) / 2,
  };

  // L affiche arrive au-dessus du tableau, assez grande pour qu on la lise,
  // assez petite pour ne jamais le masquer : 300 px de haut, pas 560.
  const grandH = 300, grandW = grandH * (2 / 3);
  const depart = {x: (1920 - grandW) / 2, y: rowY(0) - grandH - 40};

  const ENTREE = 18, HESITE = 34, VOL = 58, POSE = 92;

  const arrive = spring({frame: frame - ENTREE, fps, config: SPRING_POP, durationInFrames: 26});
  const hesite = interpolate(frame, [HESITE, VOL], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const vol = interpolate(frame, [VOL, POSE], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
  const pose = spring({frame: frame - POSE, fps, config: SPRING_POP, durationInFrames: 18});

  // trajectoire courbe, sommet au-dessus des deux points
  const ctrl = {x: (depart.x + cible.x) / 2, y: Math.min(depart.y, cible.y) - 120};
  const q = (a: number, b: number, c: number, t: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

  const ech = interpolate(vol, [0, 1], [1, BOARD.posterW / grandW]);
  const x = vol === 0 ? depart.x : q(depart.x, ctrl.x, cible.x, vol);
  const y = vol === 0 ? depart.y : q(depart.y, ctrl.y, cible.y, vol);
  // avant de partir, elle oscille legerement : c est ce qui la rend vivante
  const balance = vol === 0 ? Math.sin(hesite * Math.PI * 4) * 1.6 : 0;
  const rot = interpolate(arrive, [0, 1], [-5, 0]) + balance
            + interpolate(vol, [0, 1], [0, 6]) * (1 - vol);

  // la rangee accuse le coup : liseré + petit ressaut vertical
  const choc = spring({frame: frame - POSE, fps,
    config: {damping: 9, stiffness: 240, mass: 0.7}, durationInFrames: 26});
  const kick = interpolate(choc, [0, 0.35, 1], [0, -10, 0]);
  const halo = interpolate(frame, [POSE, POSE + 10, POSE + 46], [0, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{fontFamily: FONT, background: 'transparent'}}>
      <FontFace />
      <AbsoluteFill style={{transform: `translateY(${kick}px)`}}>
        <BoardInner rows={p.rows} offsetX={p.offsetX} transparent />
      </AbsoluteFill>

      {/* le liseré qui signale la rangee touchee, sans la masquer */}
      <div style={{
        position: 'absolute', left: left - 10, top: rowY(i) + kick - 10,
        width: BOARD.width + 20, height: BOARD.rowH + 20,
        border: `6px solid ${col}`, borderRadius: 26,
        boxShadow: `0 0 46px ${col}`, opacity: halo * 0.9, pointerEvents: 'none',
      }} />

      <Img src={staticFile(p.poster)} style={{
        position: 'absolute', left: 0, top: 0,
        width: grandW, height: grandH, borderRadius: 10, objectFit: 'cover',
        transform: `translate(${x}px, ${y}px) scale(${ech * arrive}) rotate(${rot}deg)`,
        transformOrigin: 'top left',
        boxShadow: '0 16px 0 rgba(0,0,0,0.5)',
        outline: `3px solid rgba(0,0,0,0.85)`,
        filter: `drop-shadow(0 0 ${18 * pose}px ${col})`,
      }} />
    </AbsoluteFill>
  );
};

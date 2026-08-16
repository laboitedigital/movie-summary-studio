import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {EASE_OUT_CUBIC, TIERS} from './theme';
import {FontFace, FONT} from './shared';
import {BOARD, BoardInner, rowY} from './TierBoard';
import {PosterPlacement} from './PosterPlacement';

export const verdictSchema = z.object({
  rows: z.array(z.object({tier: z.enum(['S','A','B','C','D','F']), posters: z.array(z.string())})),
  poster: z.string(),
  tier: z.enum(['S','A','B','C','D','F']),
  slotIndex: z.number().default(0),
  /** le tableau est pousse a droite : la mascotte occupe les ~880 premiers pixels */
  offsetX: z.number().default(260),
  zoom: z.number().default(2.0),
});

/**
 * Carton verdict — l element signature de la chaine, absent du brief v2.
 *
 * Fond TRANSPARENT et aucune video ici : Chromium ne decode pas le ProRes, et
 * le detourage de la mascotte est deja resolu dans ffmpeg. Le montage empile
 * donc : fond de chaine -> ce rendu -> mascotte detouree par-dessus.
 *
 * La poussee de camera ne porte que sur le plateau. Zoomer l image entiere
 * agrandirait aussi la mascotte et la sortirait du cadre.
 */
export const VerdictCard: React.FC<z.infer<typeof verdictSchema>> = (p) => {
  const frame = useCurrentFrame();
  const i = TIERS.indexOf(p.tier);

  const IN = 200, HOLD = 90, OUT = 40;
  const t1 = interpolate(frame, [IN, IN + 42], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_CUBIC});
  const t2 = interpolate(frame, [IN + 42 + HOLD, IN + 42 + HOLD + OUT], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_CUBIC});
  const z = 1 + (p.zoom - 1) * (t1 - t2);

  // Origine du zoom.
  //
  // Deux contraintes a satisfaire en meme temps : a pleine echelle, le bord
  // gauche du tableau doit tomber a x=880 (la mascotte occupe tout ce qui est a
  // gauche), et la rangee visee doit etre centree verticalement. Un simple
  // "centrer sur la rangee" ne suffit pas : la pastille du tier finissait
  // derriere la mascotte, et on ne savait plus de quelle rangee il s agissait.
  //
  // Un point O reste fixe sous scale(z) autour de O. On resout donc O pour que
  // les deux points d interet atterrissent ou on veut a z = zoom.
  const MASK_X = 880;
  const left = (1920 - BOARD.width) / 2 + p.offsetX;
  const boardLeft = left - 20;
  const cy = rowY(i) + BOARD.rowH / 2;
  const ox = (MASK_X - boardLeft * p.zoom) / (1 - p.zoom);
  const oy = (540 - cy * p.zoom) / (1 - p.zoom);

  return (
    <AbsoluteFill style={{fontFamily: FONT, background: 'transparent', overflow: 'hidden'}}>
      <FontFace />
      <AbsoluteFill style={{
        transform: `scale(${z})`,
        transformOrigin: `${ox}px ${oy}px`,
      }}>
        <BoardInner rows={p.rows} offsetX={p.offsetX} transparent highlight={undefined} />
        <PosterPlacement poster={p.poster} tier={p.tier} slotIndex={p.slotIndex} offsetX={p.offsetX} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

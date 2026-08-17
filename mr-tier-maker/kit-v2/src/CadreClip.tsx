import React from 'react';
import {AbsoluteFill} from 'remotion';
import {z} from 'zod';
import {COLORS} from './theme';

export const cadreClipSchema = z.object({
  marge: z.number().default(46),
  trait: z.number().default(14),
  rayon: z.number().default(30),
});

/**
 * Le cadre cartoon pose sur les extraits.
 *
 * 95 des 159 plans sont des extraits de films : des images photographiques
 * plein cadre. Sans ce cadre, le vocabulaire de la chaine ne vit que dans les
 * 40 plans motion, et la video ressemble a un montage d extraits ponctue de
 * cartons plutot qu a une chaine cartoon.
 *
 * Le centre est TRANSPARENT : l extrait passe dessous, en ffmpeg. Le tour est
 * rempli par un box-shadow de 9999 px — c est le seul moyen d avoir a la fois
 * un trou a coins arrondis et un fond opaque autour, en une seule couche.
 */
export const CadreClip: React.FC<z.infer<typeof cadreClipSchema>> = ({marge, trait, rayon}) => (
  <AbsoluteFill style={{background: 'transparent'}}>
    <div style={{
      position: 'absolute', left: marge, top: marge, right: marge, bottom: marge,
      border: `${trait}px solid #000`,
      borderRadius: rayon,
      boxShadow: `0 0 0 9999px ${COLORS.bg}, 0 14px 0 rgba(0,0,0,0.55)`,
    }} />
    <div style={{
      position: 'absolute', left: marge + trait, top: marge + trait,
      right: marge + trait, height: 3,
      background: 'rgba(255,255,255,0.20)', borderRadius: 2,
    }} />
  </AbsoluteFill>
);

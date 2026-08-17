import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP, TIER_COLOR} from './theme';
import {FontFace, FONT, strokeStyle} from './shared';

export const memeSchema = z.object({
  /** nom du fichier dans public/poses, sans extension */
  pose: z.enum(['blase', 'hallucine', 'facepalm', 'satisfait', 'cache-yeux']),
  cote: z.enum(['gauche', 'droite']).default('droite'),
  /** hauteur de la pose, en fraction du cadre */
  taille: z.number().min(0.3).max(1).default(0.62),
  /** vide = pas de plaque. La narration dit deja la phrase ; l ecrire une
   *  seconde fois n apprend rien. On ne met du texte que quand il AJOUTE
   *  quelque chose — un chiffre, un mot que la voix ne prononce pas. */
  texte: z.string().default(''),
  couleur: z.enum(['S', 'A', 'B', 'C', 'D', 'F']).default('B'),
});

/**
 * La mascotte reagit, par-dessus le plan en cours.
 *
 * Fond transparent : ffmpeg la pose sur l extrait deja monte, cadre compris.
 * Elle entre par le bord, tient, et ressort par ou elle est venue — elle ne
 * disparait jamais en fondu, ce serait le seul element mou d une charte faite
 * d aplats et de contours durs.
 *
 * Les PNG de public/poses sont DEJA detoures et recadres sur le sujet
 * (colorkey=0x050D23:0.030:0.012, puis crop sur la boite alpha). Remotion ne
 * sait pas incruster une couleur : le detourage se fait en amont, une fois.
 */
export const Meme: React.FC<z.infer<typeof memeSchema>> = ({pose, cote, taille, texte, couleur}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const signe = cote === 'droite' ? 1 : -1;

  const entree = spring({frame: frame - 3, fps, config: SPRING_POP, durationInFrames: 26});
  // sortie sur les 22 dernieres frames, par le meme bord
  const sortie = interpolate(frame, [durationInFrames - 22, durationInFrames - 2], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const dedans = entree * (1 - sortie);
  // hors champ a 0, colle au bord a 1
  const x = interpolate(dedans, [0, 1], [signe * 900, 0]);
  // un leger contre-balancement : elle arrive un peu penchee et se redresse
  const rot = interpolate(dedans, [0, 1], [signe * 9, signe * 2]);
  // respiration, seulement une fois installee
  const flotte = dedans > 0.92 ? Math.sin((frame - 26) / 11) * 6 : 0;

  const hauteur = taille * 1080;

  return (
    <AbsoluteFill style={{fontFamily: FONT, background: 'transparent'}}>
      <FontFace />
      <div style={{
        position: 'absolute', bottom: 0,
        [cote === 'droite' ? 'right' : 'left']: 40,
        transform: `translateX(${x}px) translateY(${flotte}px) rotate(${rot}deg)`,
        transformOrigin: '50% 100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {texte ? (
          <div style={{
            background: TIER_COLOR[couleur], color: COLORS.ink,
            borderRadius: 22, padding: '14px 34px', marginBottom: 18,
            border: '6px solid #000', boxShadow: '0 10px 0 rgba(0,0,0,0.55)',
            fontSize: 56, fontWeight: 600, whiteSpace: 'nowrap',
            transform: `rotate(${-signe * 3}deg)`,
          }}>
            {texte}
          </div>
        ) : null}
        <Img src={staticFile(`poses/${pose}.png`)} style={{
          height: hauteur, width: 'auto', display: 'block',
          // l ombre dure de la charte, pas un flou : les aplats du logo n ont
          // aucune ombre douce
          filter: 'drop-shadow(14px 14px 0 rgba(0,0,0,0.55))',
        }} />
      </div>
    </AbsoluteFill>
  );
};

/** exporte pour le carton de demonstration du kit */
export const MEME_STROKE = strokeStyle(4);

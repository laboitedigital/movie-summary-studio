import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, RAINBOW} from './theme';
import {Stage, strokeStyle} from './shared';

export const commentairesSchema = z.object({
  lignes: z.array(z.string()).min(4),
  vitesse: z.number().default(70),   // pixels par seconde
});

/**
 * Le mur de commentaires negatifs, plan 137.
 *
 * Volontairement PAS une capture d ecran de YouTube : pas de pseudos, pas
 * d avatars reconnaissables, pas d interface imitee. Une capture inventee
 * donnerait de faux commentaires attribues a de vraies personnes, sur un plan
 * qui sert justement a etablir un fait. Ici les bulles ne font que remettre a
 * l ecran les reproches que la narration enonce — c est une illustration, pas
 * une preuve.
 */
export const Commentaires: React.FC<z.infer<typeof commentairesSchema>> = ({lignes, vitesse}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const HAUT = 132;                       // hauteur d une bulle + son espace
  const total = lignes.length * HAUT;
  const y = -((frame / fps) * vitesse) % total;
  const fondu = interpolate(frame, [0, 18, durationInFrames - 18, durationInFrames],
    [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // on dessine la liste deux fois : le defilement boucle sans trou
  const suite = [...lignes, ...lignes];

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', opacity: fondu}}>
        <div style={{
          position: 'relative', width: 1280, height: 1080, overflow: 'hidden',
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
        }}>
          {suite.map((t, i) => (
            <div key={i} style={{
              position: 'absolute', left: 0, top: i * HAUT + y,
              width: '100%', display: 'flex', alignItems: 'center', gap: 22,
            }}>
              {/* pastille neutre : aucun visage, aucun pseudo */}
              <div style={{
                width: 74, height: 74, borderRadius: '50%', flexShrink: 0,
                background: RAINBOW[i % RAINBOW.length],
                border: '4px solid rgba(0,0,0,0.85)',
                boxShadow: '0 6px 0 rgba(0,0,0,0.45)',
              }} />
              <div style={{
                flex: 1, background: COLORS.card, borderRadius: 20, padding: '22px 30px',
                borderTop: '2px solid rgba(255,255,255,0.18)',
                boxShadow: '0 8px 0 rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
              }}>
                <span style={{fontSize: 40, fontWeight: 500, color: COLORS.white}}>{t}</span>
                <span style={{fontSize: 40, color: COLORS.tierS, ...strokeStyle(4)}}>▼</span>
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP, TIER_COLOR} from './theme';
import {FontFace, FONT, strokeStyle} from './shared';

export const flecheSchema = z.object({
  x: z.number(),                 // 0-1, position de la POINTE dans le cadre
  y: z.number(),
  texte: z.string(),
  depuis: z.enum(['gauche', 'droite', 'haut', 'bas']).default('droite'),
  couleur: z.enum(['S','A','B','C','D','F']).default('A'),
});

/**
 * La fleche qui designe un personnage dans un extrait.
 *
 * Coordonnees RELATIVES : la pointe est donnee en fraction du cadre, pas en
 * pixels. Un plan annote reste donc juste si la resolution change, et la meme
 * annotation vaut pour l apercu 720p et le master 1080p.
 *
 * Fond transparent : elle se pose sur l extrait en ffmpeg, par-dessus le cadre.
 */
export const Fleche: React.FC<z.infer<typeof flecheSchema>> = ({x, y, texte, depuis, couleur}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const col = TIER_COLOR[couleur];

  const px = x * 1920, py = y * 1080;
  const L = 300;                                   // longueur de la hampe
  const dir = {gauche: [-1, 0], droite: [1, 0], haut: [0, -1], bas: [0, 1]}[depuis] as number[];
  // la queue part du cote demande ; la pointe reste sur le personnage
  const qx = px + dir[0] * L, qy = py + dir[1] * L;
  const angle = Math.atan2(py - qy, px - qx) * 180 / Math.PI;

  const arrive = spring({frame: frame - 4, fps, config: SPRING_POP, durationInFrames: 24});
  const sortie = interpolate(frame, [durationInFrames - 20, durationInFrames - 4], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const vie = arrive * (1 - sortie);
  // elle respire : sans ca elle a l air collee sur l image
  const pouls = Math.sin((frame - 24) / 9) * 7 * (vie > 0.9 ? 1 : 0);
  const recul = interpolate(vie, [0, 1], [70, 0]) + pouls;

  return (
    <AbsoluteFill style={{fontFamily: FONT, background: 'transparent', opacity: vie}}>
      <FontFace />
      <div style={{
        position: 'absolute', left: qx, top: qy,
        transform: `translate(${dir[0] * recul}px, ${dir[1] * recul}px) rotate(${angle}deg)`,
        transformOrigin: '0 50%',
      }}>
        <svg width={L + 40} height={120} viewBox={`0 -60 ${L + 40} 120`} style={{overflow: 'visible'}}>
          {/* contour noir puis remplissage : le vocabulaire cartoon du kit */}
          {[{w: 34, c: '#000', t: 46}, {w: 18, c: col, t: 30}].map((s, i) => (
            <g key={i}>
              <line x1={0} y1={0} x2={L - s.t} y2={0}
                    stroke={s.c} strokeWidth={s.w} strokeLinecap="round" />
              <polygon points={`${L},0 ${L - s.t},${-s.t * 0.72} ${L - s.t},${s.t * 0.72}`}
                       fill={s.c} />
            </g>
          ))}
        </svg>
      </div>

      <div style={{
        position: 'absolute', left: qx, top: qy,
        transform: `translate(${dir[0] * recul}px, ${dir[1] * recul}px) translate(${dir[0] < 0 ? -10 : -140}px, -110px)`,
        background: col, borderRadius: 16, padding: '12px 30px',
        borderTop: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 8px 0 rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
      }}>
        <span style={{fontSize: 46, fontWeight: 700, color: COLORS.ink, letterSpacing: 1}}>
          {texte.toUpperCase()}
        </span>
      </div>
    </AbsoluteFill>
  );
};

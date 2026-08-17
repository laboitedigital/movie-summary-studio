import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP, TIER_COLOR} from './theme';
import {FontFace, FONT} from './shared';

export const flecheSchema = z.object({
  x: z.number(),                 // 0-1, position de la POINTE dans le cadre
  y: z.number(),
  depuis: z.enum(['gauche', 'droite', 'haut', 'bas']).default('droite'),
  /** blanc par defaut : lisible sur n importe quel plan. La couleur d un tier
   *  reste possible quand l image s y prete — le jaune B sur un plan orange de
   *  1986, lui, se noyait. */
  couleur: z.enum(['blanc','S','A','B','C','D','F']).default('blanc'),
});

/**
 * La fleche qui designe un personnage dans un extrait.
 *
 * Coordonnees RELATIVES : la pointe est donnee en fraction du cadre, pas en
 * pixels. Un plan annote reste donc juste si la resolution change, et la meme
 * annotation vaut pour l apercu 720p et le master 1080p.
 *
 * Fond transparent : elle se pose sur l extrait en ffmpeg, par-dessus le cadre.
 *
 * Pas d etiquette : la narration dit deja le nom du personnage au moment ou la
 * fleche apparait. L ecrire une seconde fois a l ecran encombre l image sans
 * rien apprendre.
 */
export const Fleche: React.FC<z.infer<typeof flecheSchema>> = ({x, y, depuis, couleur}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const col = couleur === 'blanc' ? COLORS.white : TIER_COLOR[couleur];

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

  // Le contour de la fleche. Queue fine (QUEUE), epaississement jusqu a la base
  // de la tete (COL), puis la tete large (AILE). La courbure vient des points
  // de controle des deux quadratiques.
  const TETE = 104, AILE = 62, QUEUE = 9, COL = 23, COURBE = -30;
  const b = L - TETE;
  const pointe = [
    `M0,${-QUEUE}`,
    `Q${b * 0.55},${COURBE - COL * 0.5} ${b},${-COL}`,
    `L${b},${-AILE}`,
    `L${L},0`,
    `L${b},${AILE}`,
    `L${b},${COL}`,
    `Q${b * 0.55},${COURBE + COL * 0.5} 0,${QUEUE}`,
    'Z',
  ].join(' ');

  return (
    <AbsoluteFill style={{fontFamily: FONT, background: 'transparent', opacity: vie}}>
      <FontFace />
      <div style={{
        position: 'absolute', left: qx, top: qy,
        transform: `translate(${dir[0] * recul}px, ${dir[1] * recul}px) rotate(${angle}deg)`,
        transformOrigin: '0 50%',
      }}>
        <svg width={L + 120} height={200} viewBox={`-20 -100 ${L + 140} 200`} style={{overflow: 'visible'}}>
          {/* Une fleche cartoon n est pas un trait avec un triangle au bout :
              elle est FUSELEE — fine a la queue, epaisse a la base de la tete —
              et legerement courbee, comme un trait de marqueur. On dessine donc
              un contour ferme et on le remplit, plutot que de tracer une ligne. */}
          {[{dy: 12, fill: 'rgba(0,0,0,0.45)', stroke: 'none', sw: 0},
            {dy: 0,  fill: col, stroke: '#000', sw: 16}].map((c, i) => (
            <path key={i} transform={`translate(0,${c.dy})`}
                  d={pointe} fill={c.fill}
                  stroke={c.stroke} strokeWidth={c.sw}
                  strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </svg>
      </div>

    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, interpolate, Easing} from 'remotion';
import {COLORS} from '../theme';
import {CHAPTERS, SCENE_CUTS, sec} from '../timeline';

const SWIPE_FRAMES = 11;

/**
 * Les coupes qui portent un chapitre sont deja couvertes par le panneau plein
 * cadre : y ajouter un balayage ferait doublon.
 */
const CHAPTER_CUTS = new Set(CHAPTERS.map((c) => c.at));

/**
 * Micro-transition sur chaque coupe de plan detectee : deux barres diagonales
 * qui balayent le cadre en ~0.35 s. Ca lisse les coupes seches de la source
 * sans jamais masquer longtemps l'image.
 */
export const SceneTransitions: React.FC<{frame: number}> = ({frame}) => {
  const cut = SCENE_CUTS.find((c) => {
    if (CHAPTER_CUTS.has(c)) return false;
    const f = sec(c);
    return frame >= f - 3 && frame <= f + SWIPE_FRAMES;
  });
  if (cut === undefined) return null;

  const local = frame - (sec(cut) - 3);
  const p = interpolate(local, [0, SWIPE_FRAMES + 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const bar = (offset: number, color: string, thickness: number) => {
    const x = interpolate(p, [0, 1], [-140 - offset * 260, 2200 + offset * 120]);
    return (
      <div
        style={{
          position: 'absolute',
          top: -220,
          left: x,
          width: thickness,
          height: 1520,
          background: color,
          transform: 'rotate(14deg)',
          transformOrigin: 'center',
        }}
      />
    );
  };

  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
      {bar(0, COLORS.orange, 26)}
      {bar(0.5, COLORS.ink, 12)}
    </AbsoluteFill>
  );
};

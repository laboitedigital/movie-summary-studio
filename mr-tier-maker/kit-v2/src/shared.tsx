import React from 'react';
import {AbsoluteFill, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, RADIUS} from './theme';

/** Fredoka est une fonte variable : un seul fichier couvre 300 a 700.
 *  On la sert depuis public/ plutot que via le CDN Google, pour que le rendu
 *  ne depende pas du reseau. */
export const FontFace: React.FC = () => (
  <style>{`
    @font-face {
      font-family: 'Fredoka';
      src: url('${staticFile('fonts/Fredoka.woff2')}') format('woff2');
      font-weight: 300 700;
      font-display: block;
    }
  `}</style>
);

export const FONT = "'Fredoka', system-ui, sans-serif";

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{
    background: `radial-gradient(120% 90% at 50% 45%, ${COLORS.bgCard} 0%, ${COLORS.bg} 62%, #04091A 100%)`,
  }} />
);

/** Grain anime : nouvelle graine a chaque frame. Sur un aplat bleu nuit, un
 *  encodage H.264 fait apparaitre des cercles concentriques ; le grain les
 *  dissout. La raison est technique, pas decorative. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.035}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`grain-${frame}`) * 10000);
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`n${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#n${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Aucun ecran opaque n est parfaitement fige : poussee lente sur toute la duree. */
export const PushIn: React.FC<{children: React.ReactNode; to?: number}> = ({children, to = 1.025}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const s = interpolate(frame, [0, durationInFrames], [1, to], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};

export const Stage: React.FC<{children: React.ReactNode; opaque?: boolean}> = ({children, opaque = true}) => (
  <AbsoluteFill style={{fontFamily: FONT, background: opaque ? COLORS.bg : 'transparent'}}>
    <FontFace />
    {opaque ? <><Vignette /><PushIn>{children}</PushIn><Grain /></> : children}
  </AbsoluteFill>
);

/** Contour noir cartoon. paint-order place le trait DERRIERE le remplissage :
 *  sans ca, un contour epais ronge la lettre jusqu a la rendre illisible —
 *  c est exactement le defaut qu avait le kit v1. */
export const strokeStyle = (px: number): React.CSSProperties => ({
  WebkitTextStrokeWidth: px,
  WebkitTextStrokeColor: '#000',
  paintOrder: 'stroke fill',
});

export const Pill: React.FC<{
  bg: string; children: React.ReactNode; style?: React.CSSProperties; radius?: number;
}> = ({bg, children, style, radius = RADIUS}) => (
  <div style={{
    background: bg, borderRadius: radius,
    borderTop: `2px solid rgba(255,255,255,0.22)`,
    boxShadow: '0 10px 0 rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center',
    ...style,
  }}>{children}</div>
);

import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, EASE_OUT_EXPO, RAINBOW, TIERS} from './theme';
import {FontFace, FONT, strokeStyle} from './shared';

/**
 * Transition signature. Le plein couvrant ne dure que quelques frames — c est
 * la que le monteur coupe. Le kit v1 laissait l ecran fige en arc-en-ciel
 * pendant une demi-seconde, ce qui cassait le rythme.
 */
export const RainbowWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const BANDS = RAINBOW.length;
  const bandH = 1080 / BANDS;
  const ANGLE = 12;
  const over = 1920 * Math.tan((ANGLE * Math.PI) / 180) + 220;

  return (
    <AbsoluteFill style={{fontFamily: FONT, background: 'transparent', overflow: 'hidden'}}>
      <FontFace />
      {RAINBOW.map((color, i) => {
        const inStart = i * 2;
        const outStart = 18 + i * 2;
        const enter = interpolate(frame, [inStart, inStart + 20], [-2400, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
        const exit = interpolate(frame, [outStart, outStart + 22], [0, 2400],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
        const x = enter + exit;
        return (
          <div key={i} style={{
            position: 'absolute', left: 0, top: i * bandH - 40,
            width: 1920 + over, height: bandH + 80,
            transform: `translateX(${x}px) rotate(-${ANGLE}deg)`,
            transformOrigin: 'center', background: color,
            borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
            display: 'flex', alignItems: 'center',
          }}>
            {/* la lettre voyage un peu moins vite : parallaxe, signature de chaine */}
            <span style={{
              marginLeft: 300, fontSize: bandH * 1.15, fontWeight: 700, color: '#000',
              opacity: 0.18, transform: `translateX(${-x * 0.15}px)`, ...strokeStyle(0),
            }}>{TIERS[i]}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

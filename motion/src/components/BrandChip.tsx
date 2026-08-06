import React from 'react';
import {interpolate, useVideoConfig} from 'remotion';
import {COLORS, FONTS, SAFE} from '../theme';
import {BRAND, INTRO, OUTRO, sec} from '../timeline';
import {pop} from '../anim';

/** Pastille de marque discrete, en haut a droite, entre l'intro et l'outro. */
export const BrandChip: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  if (!BRAND.handle) return null;

  const start = sec(INTRO.end);
  const end = sec(OUTRO.start);
  if (frame < start || frame > end + 20) return null;

  const appear = pop(frame - start, fps, 18);
  const fade = interpolate(frame, [end, end + 18], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: SAFE.y,
        right: SAFE.x,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 26px',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 999,
        border: `2px solid ${COLORS.ink}`,
        boxShadow: `4px 5px 0 ${COLORS.shadow}`,
        opacity: appear * fade * 0.95,
        transform: `translateY(${(1 - appear) * -24}px)`,
      }}
    >
      <svg width={26} height={20} viewBox="0 0 26 20">
        <rect width={26} height={20} rx={6} fill={COLORS.red} />
        <path d="M10 5.5 L18 10 L10 14.5 Z" fill="#fff" />
      </svg>
      <span
        style={{
          fontFamily: FONTS.display,
          fontWeight: 600,
          fontSize: 28,
          color: COLORS.ink,
          letterSpacing: 1,
        }}
      >
        {BRAND.handle}
      </span>
    </div>
  );
};

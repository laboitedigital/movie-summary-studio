import React from 'react';
import {interpolate, useVideoConfig} from 'remotion';
import {COLORS, FONTS, SAFE} from '../theme';
import {SUBSCRIBE_BUG, sec} from '../timeline';
import {enterExit} from '../anim';

/** Bulle "Abonne-toi" qui pop une seule fois, en bas a droite. */
export const SubscribeBug: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const start = sec(SUBSCRIBE_BUG.at);
  const hold = sec(SUBSCRIBE_BUG.hold);

  const {local, visible, appear, disappear} = enterExit({
    frame,
    start,
    hold,
    fps,
    enter: 20,
    exit: 12,
  });
  if (!visible) return null;

  // Leger balancement apres l'apparition.
  const wiggle = Math.sin(local / 4.5) * interpolate(local, [20, 44], [3.2, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(appear, [0, 1], [0.6, 1]);
  const opacity = appear * (1 - disappear);

  return (
    <div
      style={{
        position: 'absolute',
        right: SAFE.x,
        bottom: 138,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 38px',
        background: COLORS.red,
        borderRadius: 999,
        border: `3px solid ${COLORS.ink}`,
        boxShadow: `8px 10px 0 ${COLORS.shadow}`,
        transform: `scale(${scale}) rotate(${wiggle}deg)`,
        transformOrigin: 'bottom right',
        opacity,
      }}
    >
      <svg width={34} height={34} viewBox="0 0 34 34">
        <circle cx={17} cy={17} r={15} fill="#fff" />
        <path d="M13 9.5 L25 17 L13 24.5 Z" fill={COLORS.red} />
      </svg>
      <span
        style={{
          fontFamily: FONTS.display,
          fontWeight: 800,
          fontSize: 48,
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
      >
        {SUBSCRIBE_BUG.label}
      </span>
    </div>
  );
};

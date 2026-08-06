import React from 'react';
import {interpolate} from 'remotion';
import {COLORS} from '../theme';
import {CHAPTERS, INTRO, SOURCE_DURATION_IN_FRAMES, sec} from '../timeline';

/** Barre de progression fine en bas de cadre + reperes de chapitres. */
export const ProgressBar: React.FC<{frame: number}> = ({frame}) => {
  const pct = interpolate(frame, [0, SOURCE_DURATION_IN_FRAMES], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // La barre n'apparait qu'une fois le carton d'intro retire.
  const reveal = interpolate(
    frame,
    [sec(INTRO.end) - 6, sec(INTRO.end) + 8],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  if (reveal <= 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 10,
        background: 'rgba(31, 42, 68, 0.10)',
        opacity: reveal,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold})`,
        }}
      />

      {CHAPTERS.map((c) => {
        const left = (sec(c.at) / SOURCE_DURATION_IN_FRAMES) * 100;
        const passed = frame >= sec(c.at);
        return (
          <div
            key={c.num}
            style={{
              position: 'absolute',
              left: `${left}%`,
              bottom: 0,
              width: 3,
              height: 10,
              background: passed
                ? 'rgba(255,255,255,0.85)'
                : 'rgba(31, 42, 68, 0.35)',
            }}
          />
        );
      })}

      {/* Tete de lecture */}
      <div
        style={{
          position: 'absolute',
          left: `${pct}%`,
          bottom: -3,
          width: 16,
          height: 16,
          marginLeft: -8,
          borderRadius: '50%',
          background: COLORS.orange,
          border: `3px solid ${COLORS.paper}`,
          boxShadow: `0 2px 6px ${COLORS.shadow}`,
        }}
      />
    </div>
  );
};

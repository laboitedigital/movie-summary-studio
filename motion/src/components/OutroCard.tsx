import React from 'react';
import {interpolate, Easing, useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../theme';
import {OUTRO, HEIGHT, sec} from '../timeline';
import {draw, pop} from '../anim';

/**
 * Panneau de fin : il glisse depuis la droite et occupe un peu moins de la
 * moitie du cadre, pour laisser le plan de fin de la video respirer a gauche.
 */
export const OutroCard: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const start = sec(OUTRO.start);
  if (frame < start - 2) return null;

  const local = frame - start;
  const slide = interpolate(local, [0, 26], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const width = 880;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width,
        height: HEIGHT,
        background: '#F7F9FC',
        borderLeft: `4px solid ${COLORS.ink}`,
        boxShadow: `-14px 0 30px rgba(31,42,68,0.10)`,
        transform: `translateX(${slide * width}px)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 64px',
      }}
    >
      {/* Titre */}
      {OUTRO.title.split('\n').map((line, i) => {
        const p = interpolate(local, [14 + i * 6, 32 + i * 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div key={i} style={{overflow: 'hidden'}}>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 800,
                fontSize: 70,
                lineHeight: 1.1,
                color: COLORS.ink,
                transform: `translateY(${(1 - p) * 110}%)`,
              }}
            >
              {line}
            </div>
          </div>
        );
      })}

      <svg width={420} height={22} style={{marginTop: 10, marginBottom: 34}}>
        <path
          d="M4 14 C 120 4, 280 20, 414 8"
          fill="none"
          stroke={COLORS.orange}
          strokeWidth={8}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={draw(local, 30, 50)}
        />
      </svg>

      {/* Points cles */}
      {OUTRO.lines.map((l, i) => {
        const p = pop(local - (38 + i * 8), fps, 16);
        return (
          <div
            key={l}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 22,
              opacity: p,
              transform: `translateX(${(1 - p) * 40}px)`,
            }}
          >
            <svg width={38} height={38} viewBox="0 0 38 38" style={{flexShrink: 0}}>
              <circle cx={19} cy={19} r={17} fill="none" stroke={COLORS.green} strokeWidth={4} />
              <path
                d="M11 19.5 L17 25 L27 13"
                fill="none"
                stroke={COLORS.green}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 600,
                fontSize: 42,
                color: COLORS.ink,
              }}
            >
              {l}
            </span>
          </div>
        );
      })}

      {/* CTA */}
      <div
        style={{
          marginTop: 30,
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '20px 42px',
          background: COLORS.red,
          borderRadius: 999,
          border: `3px solid ${COLORS.ink}`,
          boxShadow: `8px 10px 0 ${COLORS.shadow}`,
          opacity: pop(local - 66, fps, 18),
          transform: `scale(${interpolate(pop(local - 66, fps, 18), [0, 1], [0.7, 1])})`,
        }}
      >
        <svg width={32} height={32} viewBox="0 0 34 34">
          <circle cx={17} cy={17} r={15} fill="#fff" />
          <path d="M13 9.5 L25 17 L13 24.5 Z" fill={COLORS.red} />
        </svg>
        <span
          style={{
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 40,
            color: '#fff',
          }}
        >
          {OUTRO.cta}
        </span>
      </div>
    </div>
  );
};

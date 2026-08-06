import React from 'react';
import {AbsoluteFill, interpolate, Easing, useVideoConfig} from 'remotion';
import {COLORS, FONTS, SAFE} from '../theme';
import {INTRO, sec} from '../timeline';
import {draw, pop} from '../anim';

/**
 * Carton d'ouverture : le fond de la video source etant blanc, le carton
 * partage le meme blanc et se retire sur un balayage diagonal — la video
 * apparait sans coupure visible.
 */
export const IntroCard: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const start = sec(INTRO.start);
  const end = sec(INTRO.end);
  const local = frame - start;

  if (frame < start - 2 || frame > end + 20) return null;

  const wipeOut = interpolate(frame, [end - 18, end], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const kicker = pop(local - 2, fps, 16);
  const lines = INTRO.title.split('\n');

  return (
    <AbsoluteFill
      style={{
        background: COLORS.paper,
        // Balayage diagonal vers le haut-droit
        clipPath: `polygon(0 0, 100% 0, 100% ${100 - wipeOut}%, 0 ${
          100 - wipeOut * 1.35
        }%)`,
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          paddingLeft: SAFE.x + 40,
          paddingRight: SAFE.x,
        }}
      >
        {/* Kicker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            opacity: kicker,
            transform: `translateX(${(1 - kicker) * -40}px)`,
            marginBottom: 26,
          }}
        >
          <div
            style={{
              width: 54,
              height: 6,
              borderRadius: 3,
              background: COLORS.orange,
            }}
          />
          <span
            style={{
              fontFamily: FONTS.display,
              fontWeight: 600,
              fontSize: 30,
              letterSpacing: 6,
              color: COLORS.orange,
            }}
          >
            {INTRO.kicker}
          </span>
        </div>

        {/* Titre, revele ligne par ligne */}
        {lines.map((line, i) => {
          const p = interpolate(local, [8 + i * 7, 26 + i * 7], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          return (
            <div key={i} style={{overflow: 'hidden', paddingBottom: 6}}>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 800,
                  fontSize: 108,
                  lineHeight: 1.06,
                  color: COLORS.ink,
                  transform: `translateY(${(1 - p) * 110}%)`,
                }}
              >
                {line}
              </div>
            </div>
          );
        })}

        {/* Trait feutre sous le titre */}
        <svg width={760} height={26} style={{marginTop: 6, marginLeft: 4}}>
          <path
            d="M6 17 C 190 5, 420 24, 748 10"
            fill="none"
            stroke={COLORS.orange}
            strokeWidth={9}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={draw(local, 26, 46)}
          />
        </svg>

        {/* Sous-titre */}
        <div
          style={{
            fontFamily: FONTS.hand,
            fontWeight: 700,
            fontSize: 52,
            color: COLORS.inkSoft,
            marginTop: 22,
            opacity: interpolate(local, [34, 48], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {INTRO.subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

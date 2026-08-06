import React from 'react';
import {interpolate, useVideoConfig} from 'remotion';
import {COLORS, FONTS, SAFE} from '../theme';
import {KEYWORDS, sec} from '../timeline';
import {enterExit} from '../anim';

const ACCENTS = {
  orange: COLORS.orange,
  blue: COLORS.blue,
  red: COLORS.red,
  green: COLORS.green,
} as const;

const DEFAULT_HOLD = 3.6;

/**
 * Punchline en bas de cadre : pastille papier + liseré couleur + note
 * manuscrite optionnelle. Le fond blanc opaque garantit la lisibilite
 * quel que soit le plan dessous.
 */
export const KeywordPops: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();

  return (
    <>
      {KEYWORDS.filter((k) => !k.fullscreen).map((k, i) => {
        const start = sec(k.at);
        const hold = sec(k.hold ?? DEFAULT_HOLD);
        const {visible, appear, disappear} = enterExit({
          frame,
          start,
          hold,
          fps,
          enter: 16,
          exit: 12,
        });
        if (!visible) return null;

        const accent = ACCENTS[k.accent ?? 'orange'];
        const scale = interpolate(appear, [0, 1], [0.88, 1]);
        const y = interpolate(appear, [0, 1], [46, 0]) + disappear * 30;
        const opacity = appear * (1 - disappear);
        const top = k.anchor === 'top';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              ...(top ? {top: SAFE.y + 20} : {bottom: 138}),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `translateY(${y}px) scale(${scale})`,
              opacity,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                background: COLORS.paper,
                borderRadius: 999,
                border: `3px solid ${COLORS.ink}`,
                boxShadow: `8px 10px 0 ${COLORS.shadow}`,
                padding: '18px 44px 18px 26px',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: accent,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 800,
                  fontSize: 56,
                  lineHeight: 1.1,
                  color: COLORS.ink,
                  whiteSpace: 'nowrap',
                }}
              >
                {k.text}
              </span>
            </div>

            {k.note ? (
              <div
                style={{
                  fontFamily: FONTS.hand,
                  fontWeight: 700,
                  fontSize: 46,
                  color: accent,
                  marginTop: 10,
                  opacity: interpolate(appear, [0.6, 1], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                  transform: 'rotate(-1.5deg)',
                }}
              >
                {k.note}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

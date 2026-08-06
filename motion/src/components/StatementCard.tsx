import React from 'react';
import {AbsoluteFill, interpolate, Easing, useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../theme';
import {KEYWORDS, STATEMENT_ENTER, STATEMENT_EXIT, STATEMENT_HOLD, sec} from '../timeline';
import {draw, pop} from '../anim';

const ACCENTS = {
  orange: COLORS.orange,
  blue: COLORS.blue,
  red: COLORS.red,
  green: COLORS.green,
} as const;

/**
 * Punchline en plein cadre, mot a mot.
 *
 * Le fond est le meme blanc que celui de la video : l'arrivee se fait donc en
 * douceur, sans rupture de fond, et seul le texte "atterrit". La sortie se
 * fait sur un balayage diagonal, comme le carton d'intro.
 */
export const StatementCards: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const enter = sec(STATEMENT_ENTER);
  const hold = sec(STATEMENT_HOLD);
  const exit = sec(STATEMENT_EXIT);
  const total = enter + hold + exit;

  return (
    <>
      {KEYWORDS.filter((k) => k.fullscreen).map((k, i) => {
        const start = sec(k.at);
        const local = frame - start;
        if (local < 0 || local > total) return null;

        const accent = ACCENTS[k.accent ?? 'orange'];
        const words = k.text.split(' ');

        // Le fond blanc monte vite, puis se retire sur un balayage.
        const bg = interpolate(local, [0, enter * 0.7], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.quad),
        });
        const wipe = interpolate(local, [enter + hold, total], [0, 100], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });

        return (
          <AbsoluteFill
            key={`stmt-${i}`}
            style={{
              background: COLORS.paper,
              opacity: bg,
              clipPath: `polygon(0 0, 100% 0, 100% ${100 - wipe}%, 0 ${
                100 - wipe * 1.3
              }%)`,
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 120px',
            }}
          >
            {/* Barre d'accent qui se deploie au-dessus du texte */}
            <div
              style={{
                width: interpolate(pop(local - 2, fps, 16), [0, 1], [0, 120]),
                height: 10,
                borderRadius: 5,
                background: accent,
                marginBottom: 40,
              }}
            />

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0 26px',
                // Assez large pour que les formules tiennent sur une ligne :
                // la plus longue fait 26 caracteres.
                maxWidth: 1640,
              }}
            >
              {words.map((w, wi) => {
                const p = pop(local - 4 - wi * 3, fps, 18);
                return (
                  <span
                    key={wi}
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 800,
                      fontSize: 102,
                      lineHeight: 1.1,
                      color: COLORS.ink,
                      display: 'inline-block',
                      opacity: p,
                      transform: `translateY(${(1 - p) * 60}px) rotate(${
                        (1 - p) * (wi % 2 ? 2.5 : -2.5)
                      }deg)`,
                    }}
                  >
                    {w}
                  </span>
                );
              })}
            </div>

            {/* Trait au feutre */}
            <svg width={720} height={26} style={{marginTop: 18}}>
              <path
                d="M6 17 C 190 5, 430 24, 712 9"
                fill="none"
                stroke={accent}
                strokeWidth={10}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={draw(local, 4 + words.length * 3, 26 + words.length * 3)}
              />
            </svg>

            {k.note ? (
              <div
                style={{
                  fontFamily: FONTS.hand,
                  fontWeight: 700,
                  fontSize: 60,
                  color: COLORS.inkSoft,
                  marginTop: 26,
                  transform: 'rotate(-1.4deg)',
                  opacity: interpolate(
                    local,
                    [10 + words.length * 3, 24 + words.length * 3],
                    [0, 1],
                    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
                  ),
                }}
              >
                {k.note}
              </div>
            ) : null}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

import React from 'react';
import {AbsoluteFill, interpolate, Easing, useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../theme';
import {CHAPTERS, CHAPTER_ENTER, CHAPTER_EXIT, CHAPTER_HOLD, sec} from '../timeline';
import {draw} from '../anim';

/**
 * Carton de chapitre plein cadre.
 *
 * Le panneau entre par la droite et ressort par la gauche, en biais. Il est
 * cale pour couvrir entierement le cadre AU MOMENT de la coupe de plan : la
 * coupe seche de la video source se produit derriere le panneau, et la sortie
 * revele directement le nouveau plan. On ne voit donc plus la coupe du tout.
 */
const Panel: React.FC<{
  progress: number;
  color: string;
  offset: number;
}> = ({progress, color, offset}) => {
  // progress : 0 = hors cadre a droite, 1 = couvre, 2 = sorti a gauche.
  const x = interpolate(progress, [0, 1, 2], [128 + offset, 0, -128 - offset]);
  return (
    <div
      style={{
        position: 'absolute',
        top: '-12%',
        bottom: '-12%',
        left: '-24%',
        right: '-24%',
        background: color,
        transform: `translateX(${x}%) skewX(-9deg)`,
      }}
    />
  );
};

export const ChapterFullscreens: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const enter = sec(CHAPTER_ENTER);
  const hold = sec(CHAPTER_HOLD);
  const exit = sec(CHAPTER_EXIT);

  return (
    <>
      {CHAPTERS.map((c) => {
        // Le panneau couvre pile au moment de la coupe.
        const start = sec(c.at) - enter;
        const local = frame - start;
        const total = enter + hold + exit;
        if (local < 0 || local > total) return null;

        const progress = interpolate(
          local,
          [0, enter, enter + hold, total],
          [0, 1, 1, 2],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.cubic),
          },
        );

        // Le contenu apparait une fois le cadre couvert, et part avant la sortie.
        const inP = interpolate(local, [enter - 4, enter + 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const outP = interpolate(local, [enter + hold - 6, enter + hold + 4], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.in(Easing.cubic),
        });
        const contentOpacity = inP * (1 - outP);

        return (
          <AbsoluteFill key={c.num} style={{overflow: 'hidden'}}>
            {/* Deux plans decales : l'orange ouvre la voie, l'encre suit. */}
            <Panel progress={progress} color={COLORS.orange} offset={26} />
            <Panel progress={progress} color={COLORS.ink} offset={0} />

            <AbsoluteFill
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                opacity: contentOpacity,
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 56}}>
                {/* Numero geant, en contour */}
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 800,
                    fontSize: 320,
                    lineHeight: 0.82,
                    color: 'transparent',
                    WebkitTextStroke: `5px ${COLORS.orange}`,
                    transform: `translateX(${(1 - inP) * -90}px)`,
                  }}
                >
                  {c.num}
                </div>

                <div
                  style={{
                    transform: `translateX(${(1 - inP) * 70}px)`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 600,
                      fontSize: 26,
                      letterSpacing: 10,
                      color: COLORS.orange,
                      marginBottom: 14,
                    }}
                  >
                    CHAPITRE
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 800,
                      fontSize: 92,
                      lineHeight: 1.04,
                      color: COLORS.paper,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.title}
                  </div>
                  <svg width={560} height={22} style={{marginTop: 10}}>
                    <path
                      d="M5 14 C 150 4, 340 20, 552 8"
                      fill="none"
                      stroke={COLORS.orange}
                      strokeWidth={8}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={draw(local, enter + 2, enter + 20)}
                    />
                  </svg>
                </div>
              </div>
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
    </>
  );
};

import React from 'react';
import {interpolate, useVideoConfig} from 'remotion';
import {COLORS, FONTS, SAFE} from '../theme';
import {CHAPTER_HOLD, CHAPTERS, sec} from '../timeline';
import {enterExit, draw} from '../anim';

/** Carton de chapitre qui glisse depuis la gauche, en bas de cadre. */
export const ChapterCards: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const hold = sec(CHAPTER_HOLD);

  return (
    <>
      {CHAPTERS.map((c) => {
        const start = sec(c.at);
        const {local, visible, appear, disappear} = enterExit({
          frame,
          start,
          hold,
          fps,
          enter: 18,
          exit: 14,
        });
        if (!visible) return null;

        const x = interpolate(appear, [0, 1], [-620, 0]) + disappear * -620;
        const opacity = appear * (1 - disappear);

        return (
          <div
            key={c.num}
            style={{
              position: 'absolute',
              left: SAFE.x,
              bottom: 132,
              display: 'flex',
              alignItems: 'stretch',
              gap: 26,
              padding: '22px 40px 22px 26px',
              background: COLORS.paper,
              borderRadius: 18,
              border: `3px solid ${COLORS.ink}`,
              boxShadow: `10px 12px 0 ${COLORS.shadow}`,
              transform: `translateX(${x}px)`,
              opacity,
            }}
          >
            {/* Numero */}
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 800,
                fontSize: 76,
                lineHeight: 1,
                color: COLORS.orange,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {c.num}
            </div>

            <div
              style={{width: 3, background: 'rgba(31,42,68,0.15)', margin: '4px 0'}}
            />

            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: 4,
                  color: COLORS.inkSoft,
                  marginBottom: 6,
                }}
              >
                CHAPITRE
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 800,
                  fontSize: 54,
                  lineHeight: 1.05,
                  color: COLORS.ink,
                  whiteSpace: 'nowrap',
                }}
              >
                {c.title}
              </div>
              {/* Soulignement feutre */}
              <svg width={420} height={18} style={{marginTop: 4}}>
                <path
                  d="M4 12 C 120 4, 260 16, 414 7"
                  fill="none"
                  stroke={COLORS.orange}
                  strokeWidth={6}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={draw(local, 16, 34)}
                />
              </svg>
            </div>
          </div>
        );
      })}
    </>
  );
};

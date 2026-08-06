import React from 'react';
import {useVideoConfig} from 'remotion';
import {COLORS} from '../theme';
import {HEIGHT, HIGHLIGHTS, WIDTH, sec} from '../timeline';
import {enterExit, draw} from '../anim';

const ACCENTS = {
  orange: COLORS.orange,
  blue: COLORS.blue,
  red: COLORS.red,
  green: COLORS.green,
} as const;

/**
 * Entourage "au feutre" d'une zone du plan : une ellipse legerement
 * irreguliere qui se trace, comme sur un tableau blanc.
 */
export const Highlights: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{position: 'absolute', inset: 0}}
    >
      {HIGHLIGHTS.map((h, i) => {
        const start = sec(h.at);
        const hold = sec(h.hold);
        const {local, visible, disappear} = enterExit({
          frame,
          start,
          hold,
          fps,
          enter: 10,
          exit: 10,
        });
        if (!visible) return null;

        const accent = ACCENTS[h.accent ?? 'orange'];

        // Le plan zoome pendant l'affichage : on interpole le centre pour que
        // l'entourage reste colle a l'element vise.
        const t = Math.min(Math.max(local / hold, 0), 1);
        const cx = h.cx + ((h.cxEnd ?? h.cx) - h.cx) * t;
        const cy = h.cy + ((h.cyEnd ?? h.cy) - h.cy) * t;
        const {rx, ry} = h;
        const d = [
          `M ${cx + rx * 0.28} ${cy - ry * 0.96}`,
          `C ${cx - rx * 0.55} ${cy - ry * 1.12}, ${cx - rx * 1.14} ${cy - ry * 0.42}, ${cx - rx * 0.98} ${cy + ry * 0.3}`,
          `C ${cx - rx * 0.84} ${cy + ry * 1.04}, ${cx + rx * 0.3} ${cy + ry * 1.16}, ${cx + rx * 0.82} ${cy + ry * 0.74}`,
          `C ${cx + rx * 1.2} ${cy + ry * 0.4}, ${cx + rx * 1.12} ${cy - ry * 0.6}, ${cx + rx * 0.36} ${cy - ry * 0.98}`,
          `C ${cx + rx * 0.1} ${cy - ry * 1.06}, ${cx - rx * 0.2} ${cy - ry * 1.02}, ${cx - rx * 0.42} ${cy - ry * 0.86}`,
        ].join(' ');

        return (
          <g key={i} opacity={1 - disappear}>
            <path
              d={d}
              fill="none"
              stroke={accent}
              strokeWidth={9}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={draw(local, 0, 22)}
              style={{filter: `drop-shadow(0 2px 0 rgba(255,255,255,0.9))`}}
            />
          </g>
        );
      })}
    </svg>
  );
};

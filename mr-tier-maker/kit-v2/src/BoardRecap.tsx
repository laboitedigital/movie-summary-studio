import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {EASE_OUT_CUBIC, TIERS} from './theme';
import {Stage} from './shared';
import {BOARD, BoardInner, rowY} from './TierBoard';

export const boardRecapSchema = z.object({
  rows: z.array(z.object({tier: z.enum(['S','A','B','C','D','F']), posters: z.array(z.string())})),
  focus: z.enum(['S','A','B','C','D','F']).optional(),
  zoom: z.number().default(2.4),
  offsetX: z.number().default(0),
});

/**
 * Rappel du tableau, avec poussee de camera sur une rangee.
 *
 * Les affiches font 84 px de large : lisibles sur un ecran, pas sur un
 * telephone. Agrandir les rangees ferait perdre la vue d ensemble, donc la
 * camera pousse dans la rangee dont on parle, tient, puis ressort.
 */
export const BoardRecap: React.FC<z.infer<typeof boardRecapSchema>> = ({rows, focus, zoom, offsetX}) => {
  const frame = useCurrentFrame();
  const i = focus ? TIERS.indexOf(focus) : -1;

  const IN = 70, RISE = 40, HOLD = 110, FALL = 40;
  const t1 = interpolate(frame, [IN, IN + RISE], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_CUBIC});
  const t2 = interpolate(frame, [IN + RISE + HOLD, IN + RISE + HOLD + FALL], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_CUBIC});
  const z = i < 0 ? 1 : 1 + (zoom - 1) * (t1 - t2);

  const left = (1920 - BOARD.width) / 2 + offsetX;
  const cy = i < 0 ? 540 : rowY(i) + BOARD.rowH / 2;
  // point fixe resolu pour que, a pleine echelle, le bord du tableau tombe a
  // x=60 et la rangee soit centree verticalement
  const ox = i < 0 ? 960 : (60 - (left - 20) * zoom) / (1 - zoom);
  const oy = i < 0 ? 540 : (540 - cy * zoom) / (1 - zoom);

  return (
    <Stage>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: `${ox}px ${oy}px`}}>
        <BoardInner rows={rows} offsetX={offsetX} highlight={focus} transparent />
      </AbsoluteFill>
    </Stage>
  );
};

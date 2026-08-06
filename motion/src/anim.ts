import {interpolate, spring, Easing} from 'remotion';

/**
 * Progression d'entree/sortie d'un element affiche entre [start, start+hold].
 * `frame` est absolu (frames depuis le debut de la video source).
 */
export const enterExit = ({
  frame,
  start,
  hold,
  fps,
  enter = 14,
  exit = 12,
}: {
  frame: number;
  start: number;
  hold: number;
  fps: number;
  enter?: number;
  exit?: number;
}) => {
  const local = frame - start;
  const visible = local >= -2 && local <= hold + exit;

  const appear = spring({
    frame: local,
    fps,
    config: {damping: 200, mass: 0.6, stiffness: 110},
    durationInFrames: enter,
  });

  const disappear = interpolate(local, [hold, hold + exit], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  return {local, visible, appear, disappear, opacity: appear * (1 - disappear)};
};

/** Petit overshoot elastique pour les elements qui "poppent". */
export const pop = (frame: number, fps: number, duration = 18) =>
  spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.7, stiffness: 140},
    durationInFrames: duration,
  });

/** Trace progressif d'un trait (stroke-dashoffset). */
export const draw = (local: number, from: number, to: number) =>
  interpolate(local, [from, to], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

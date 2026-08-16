import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, RAINBOW, SPRING_POP, EASE_OUT_EXPO} from './theme';
import {Stage, strokeStyle} from './shared';

export const lignesSchema = z.object({
  lines: z.array(z.string()).min(2),
  mode: z.enum(['empile', 'tombe']).default('empile'),
});

/** Les six intrigues de Revenge of the Fallen.
 *
 *  mode « empile » (plan 048) : elles arrivent l une sur l autre, de plus en
 *  plus serrees, jusqu a se chevaucher. A la fin on ne lit plus rien — c est
 *  le propos, le film a six histoires qui se disputent l ecran.
 *
 *  mode « tombe » (plan 054) : les memes lignes quittent le cadre une par une,
 *  parce que le film jette chaque intrigue des qu elle devient inconfortable. */
export const LignesEmpilees: React.FC<z.infer<typeof lignesSchema>> = ({lines, mode}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const n = lines.length;
  // l interligne se resserre : il faut donc mesurer la pile pour la centrer,
  // sinon elle se colle en haut du cadre et laisse un vide en bas
  const pasDe = (i: number) => interpolate(i, [0, n - 1], [0, 1]) * -46 + 108;
  const hautPile = Array.from({length: n - 1}, (_, i) => pasDe(i)).reduce((a, b) => a + b, 0) + 92;

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'relative', width: 1500, height: hautPile}}>
          {lines.map((l, i) => {
            const col = RAINBOW[i % RAINBOW.length];
            const arrive = spring({frame: frame - 6 - i * 9, fps, config: SPRING_POP, durationInFrames: 26});
            const y = Array.from({length: i}, (_, k) => pasDe(k)).reduce((a, b) => a + b, 0);
            let x = interpolate(arrive, [0, 1], [-1500, 0]);
            let op = arrive;
            let rot = interpolate(arrive, [0, 1], [-4, i % 2 ? 1.5 : -1.5]);

            if (mode === 'tombe') {
              // chacune sort par le bas, dans l ordre, sur la derniere moitie
              const t0 = durationInFrames * 0.25 + i * 16;
              const chute = interpolate(frame, [t0, t0 + 26], [0, 1],
                {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT_EXPO});
              x += 0;
              op = arrive * (1 - chute);
              rot += chute * (i % 2 ? 22 : -22);
              return (
                <Ligne key={i} texte={l} col={col} x={x} y={y + chute * 1400} rot={rot} op={op} />
              );
            }
            return <Ligne key={i} texte={l} col={col} x={x} y={y} rot={rot} op={op} />;
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Ligne: React.FC<{texte: string; col: string; x: number; y: number; rot: number; op: number}> =
({texte, col, x, y, rot, op}) => (
  <div style={{
    position: 'absolute', left: 0, top: y, opacity: op,
    transform: `translateX(${x}px) rotate(${rot}deg)`,
    background: col, borderRadius: 16, padding: '16px 40px',
    borderTop: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 10px 0 rgba(0,0,0,0.45)',
    maxWidth: 1500,
  }}>
    <span style={{fontSize: 54, fontWeight: 600, color: COLORS.ink, whiteSpace: 'nowrap'}}>
      {texte.toUpperCase()}
    </span>
  </div>
);

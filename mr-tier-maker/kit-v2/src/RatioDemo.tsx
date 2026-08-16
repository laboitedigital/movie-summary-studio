import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS} from './theme';
import {Stage, strokeStyle} from './shared';

export const ratioDemoSchema = z.object({
  ratios: z.array(z.number()).min(2),
  labels: z.array(z.string()).default([]),
});

/** Plan 096 : « le ratio d images change litteralement d un plan a l autre ».
 *  Le cadre change de forme A LA COUPE, jamais en fondu — c est justement le
 *  defaut qu on reproche au film. Les bandes noires sont donc franches. */
export const RatioDemo: React.FC<z.infer<typeof ratioDemoSchema>> = ({ratios, labels}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const par = durationInFrames / ratios.length;
  const i = Math.min(ratios.length - 1, Math.floor(frame / par));
  const r = ratios[i];

  // le cadre tient toujours dans 1600x820, quelle que soit sa forme
  const maxW = 1600, maxH = 820;
  const w = Math.min(maxW, maxH * r);
  const h = w / r;
  // petit sursaut a chaque coupe, 6 frames
  const depuis = frame - i * par;
  const kick = interpolate(depuis, [0, 6], [1.03, 1], {extrapolateRight: 'clamp'});

  return (
    <Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          width: w, height: h, transform: `scale(${kick})`,
          background: COLORS.bgCard, borderRadius: 10,
          border: `8px solid ${COLORS.accent}`, boxShadow: '0 14px 0 rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{fontSize: 96, fontWeight: 700, color: COLORS.white, ...strokeStyle(8)}}>
            {labels[i] ?? r.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

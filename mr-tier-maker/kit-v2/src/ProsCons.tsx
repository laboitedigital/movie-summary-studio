import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS, SPRING_POP} from './theme';
import {Pill, Stage, strokeStyle} from './shared';

export const prosConsSchema = z.object({
  pros: z.array(z.string()).max(3), cons: z.array(z.string()).max(3),
});

const Row: React.FC<{text: string; bg: string; sign: string; delay: number; ink: string}> =
({text, bg, sign, delay, ink}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: SPRING_POP, durationInFrames: 26});
  const x = interpolate(s, [0, 1], [-1500, 0]);
  const rot = interpolate(s, [0, 1], [-2, 0]);
  const badge = spring({frame: frame - delay - 4, fps, config: SPRING_POP, durationInFrames: 20});
  return (
    <div style={{transform: `translateX(${x}px) rotate(${rot}deg)`, marginBottom: 26, width: 'fit-content'}}>
      <Pill bg={bg} radius={30} style={{padding: '18px 46px 18px 18px'}}>
        <div style={{
          width: 62, height: 62, borderRadius: 16, marginRight: 26,
          background: 'rgba(0,0,0,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${badge})`,
        }}>
          <span style={{fontSize: 46, fontWeight: 700, color: '#fff'}}>{sign}</span>
        </div>
        <span style={{fontSize: 54, fontWeight: 600, color: ink, whiteSpace: 'nowrap', ...strokeStyle(ink === '#fff' ? 5 : 0)}}>
          {text}
        </span>
      </Pill>
    </div>
  );
};

export const ProsCons: React.FC<z.infer<typeof prosConsSchema>> = ({pros, cons}) => (
  <Stage>
    <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 140}}>
      {pros.map((p, i) => <Row key={`p${i}`} text={p} bg={COLORS.tierC} sign="+" ink={COLORS.ink} delay={i * 10} />)}
      {cons.map((c, i) => <Row key={`c${i}`} text={c} bg={COLORS.tierS} sign="−" ink="#fff" delay={(pros.length + i) * 10 + 6} />)}
    </AbsoluteFill>
  </Stage>
);

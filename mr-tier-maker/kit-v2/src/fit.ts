import {measureText} from '@remotion/layout-utils';
import {FONT} from './shared';

/**
 * Taille de police qui fait tenir un texte dans une largeur donnee.
 *
 * measureText mesure la vraie fonte chargee. Estimer la largeur au nombre de
 * caracteres se trompe de plus de 10 % sur un titre en capitales — c est ce qui
 * faisait deborder le texte de sa pastille dans le kit v1.
 */
export const fitFontSize = (text: string, maxWidth: number, base: number, min = 44) => {
  const w = measureText({text, fontFamily: FONT, fontSize: base, fontWeight: 700}).width;
  if (w <= maxWidth) return base;
  return Math.max(min, Math.floor((base * maxWidth) / w));
};

export const textWidth = (text: string, fontSize: number, fontWeight = 700) =>
  measureText({text, fontFamily: FONT, fontSize, fontWeight}).width;

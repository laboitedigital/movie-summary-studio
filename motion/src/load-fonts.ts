import React from 'react';
import {CAVEAT_700, POPPINS_600, POPPINS_800} from './fonts-inline';

/**
 * Les polices sont declarees en CSS pur, avec les .woff2 embarques en data URI
 * (voir scripts/inline-fonts.mjs).
 *
 * Volontairement SANS delayRender / FontFace : Remotion attend deja
 * `document.fonts.ready` avant de capturer chaque frame (cf. seek-to-frame),
 * donc la garantie est la, sans handle a liberer. Les deux approches a base de
 * delayRender essayees avant (staticFile puis data URI) bloquaient le rendu
 * long : le handle n'etait jamais libere sur les pages ouvertes en cours de
 * route et le rendu s'arretait vers la frame 770.
 */
const CSS = `
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  font-display: block;
  src: url(${POPPINS_600}) format('woff2');
}
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 800;
  font-display: block;
  src: url(${POPPINS_800}) format('woff2');
}
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 700;
  font-display: block;
  src: url(${CAVEAT_700}) format('woff2');
}
`;

export const FontStyles: React.FC = () => {
  return React.createElement('style', {
    dangerouslySetInnerHTML: {__html: CSS},
  });
};

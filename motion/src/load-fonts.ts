import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/**
 * Les .woff2 sont embarques dans public/fonts : le rendu est deterministe et
 * ne depend d'aucun acces reseau a Google Fonts.
 */
export const loadFonts = () => {
  loadFont({
    family: 'Poppins',
    url: staticFile('fonts/Poppins-600.woff2'),
    weight: '600',
    format: 'woff2',
  });
  loadFont({
    family: 'Poppins',
    url: staticFile('fonts/Poppins-800.woff2'),
    weight: '800',
    format: 'woff2',
  });
  loadFont({
    family: 'Caveat',
    url: staticFile('fonts/Caveat-700.woff2'),
    weight: '700',
    format: 'woff2',
  });
};

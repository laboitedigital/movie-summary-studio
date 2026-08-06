import {loadFont} from '@remotion/fonts';
import {CAVEAT_700, POPPINS_600, POPPINS_800} from './fonts-inline';

/**
 * Les polices sont embarquees en data URI (voir scripts/inline-fonts.mjs).
 *
 * Elles ont d'abord ete servies via staticFile(), mais sur un rendu long les
 * pages ouvertes en cours de route voyaient la requete HTTP se bloquer et le
 * delayRender() expirer. En data URI il n'y a plus de requete du tout : le
 * rendu est reproductible et ne depend d'aucun acces reseau.
 */
export const loadFonts = () => {
  loadFont({family: 'Poppins', url: POPPINS_600, weight: '600', format: 'woff2'});
  loadFont({family: 'Poppins', url: POPPINS_800, weight: '800', format: 'woff2'});
  loadFont({family: 'Caveat', url: CAVEAT_700, weight: '700', format: 'woff2'});
};

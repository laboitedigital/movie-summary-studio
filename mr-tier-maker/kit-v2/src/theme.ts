import {Easing} from 'remotion';

/**
 * Jetons de design MR TierMaker.
 *
 * Les six teintes et le fond sont ECHANTILLONNES sur le logo (colonne x=2030 de
 * smug-s-tile.jpg), pas relevés à l'œil. Le fond compte plus que les autres :
 * c'est la couleur exacte derrière la mascotte, et tout raccord non détouré en
 * dépend.
 */
export const COLORS = {
  bg: '#071027',        // fond de la chaîne — mesuré sur le logo
  bgCard: '#0D1730',    // fond des rangées
  card: '#16233F',      // pilules sombres
  cardEdge: '#2A3757',  // liseré haut (biseau)
  tierS: '#E6354F',
  tierA: '#F47025',
  tierB: '#F7B632',
  tierC: '#72AB54',
  tierD: '#3A5DAD',
  tierF: '#7242AA',
  accent: '#F7B632',
  accentHi: '#FFC750',
  white: '#FFFFFF',
  ink: '#0B0B0B',
  dim: '#A8B4C8',
} as const;

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
export const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', 'F'];
export const TIER_COLOR: Record<Tier, string> = {
  S: COLORS.tierS, A: COLORS.tierA, B: COLORS.tierB,
  C: COLORS.tierC, D: COLORS.tierD, F: COLORS.tierF,
};
export const RAINBOW = TIERS.map((t) => TIER_COLOR[t]);

export const FPS = 60;
export const W = 1920;
export const H = 1080;

export const EASE_OUT_EXPO = Easing.out(Easing.exp);
export const EASE_OUT_CUBIC = Easing.out(Easing.cubic);

export const SPRING_POP = {damping: 12, stiffness: 200, mass: 0.8};
export const SPRING_SOFT = {damping: 18, stiffness: 170, mass: 1};

export const RADIUS = 18;

/** Contour noir cartoon + ombre dure. Le contour est en paint-order pour que
 *  le trait passe DERRIERE le remplissage : sinon il ronge la lettre. */
export const stroked = (px = 7): React.CSSProperties => ({
  WebkitTextStrokeWidth: px,
  WebkitTextStrokeColor: '#000',
  paintOrder: 'stroke fill',
  textShadow: '0 6px 0 rgba(0,0,0,0.6)',
});

export const cardStyle: React.CSSProperties = {
  background: COLORS.card,
  borderRadius: RADIUS,
  borderTop: `2px solid ${COLORS.cardEdge}`,
  boxShadow: '0 10px 0 rgba(0,0,0,0.45)',
};

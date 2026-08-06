/**
 * Palette et typo calquees sur le style "whiteboard cartoon" de la video source :
 * fond blanc, trait a l'encre bleu nuit, accents orange / bleu / rouge YouTube.
 */
export const COLORS = {
  paper: '#FFFFFF',
  ink: '#1F2A44',
  inkSoft: '#4A5872',
  orange: '#E8722C',
  blue: '#2F80ED',
  red: '#E03131',
  green: '#5FA855',
  gold: '#F2B705',
  shadow: 'rgba(31, 42, 68, 0.18)',
} as const;

export const FONTS = {
  display: "'Poppins', 'Liberation Sans', sans-serif",
  hand: "'Caveat', 'Liberation Sans', cursive",
} as const;

/** Marge de securite : rien d'important ne doit sortir de cette zone. */
export const SAFE = {
  x: 88,
  y: 64,
} as const;

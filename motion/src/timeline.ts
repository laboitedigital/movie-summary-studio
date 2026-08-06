/**
 * ============================================================================
 *  TIMELINE DE L'HABILLAGE  —  c'est LE fichier a editer
 * ============================================================================
 *
 *  Tous les temps sont en SECONDES (float), convertis en frames par `sec()`.
 *
 *  IMPORTANT — d'ou viennent ces timings :
 *  les 14 coupes de plan ci-dessous ont ete mesurees automatiquement sur la
 *  video source (detection de changement de scene ffmpeg, seuil 0.35) :
 *
 *    18.50  30.97  46.27  82.64  97.47  118.20  131.57
 *    147.07 159.34 177.37 192.50 204.07 237.87  251.21
 *
 *  Les TEXTES, eux, sont deduits de ce qui est VISIBLE a l'ecran dans chaque
 *  plan (schemas, libelles, pictos) et NON de la narration : la transcription
 *  audio n'a pas pu etre faite dans l'environnement de build (huggingface.co
 *  bloque par la politique reseau). Relisez-les et ajustez-les librement —
 *  c'est le seul endroit a modifier.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Duree exacte de la video source (268.07 s -> 8042 frames). */
export const SOURCE_DURATION_IN_FRAMES = 8042;

export const sec = (s: number) => Math.round(s * FPS);

/** Coupes de plan detectees, utilisees pour les micro-transitions. */
export const SCENE_CUTS: number[] = [
  18.5, 30.97, 46.27, 82.64, 97.47, 118.2, 131.57, 147.07, 159.34, 177.37,
  192.5, 204.07, 237.87, 251.21,
];

/* -------------------------------------------------------------------------- */
/*  Carton d'introduction                                                      */
/* -------------------------------------------------------------------------- */

export const INTRO = {
  /** Le carton couvre le debut puis se retire sur un balayage. */
  start: 0.2,
  end: 5.2,
  kicker: 'YOUTUBE MONÉTISATION',
  title: 'Pourquoi les vues\nne font pas le revenu',
  subtitle: 'Ce qui décide vraiment de ce que rapporte une chaîne',
};

/* -------------------------------------------------------------------------- */
/*  Chapitres  (grands blocs narratifs)                                        */
/* -------------------------------------------------------------------------- */

export type Chapter = {
  /** Debut du chapitre en secondes (cale sur une coupe de plan). */
  at: number;
  num: string;
  title: string;
};

export const CHAPTERS: Chapter[] = [
  {at: 18.5, num: '01', title: "D'où vient l'argent"},
  {at: 46.27, num: '02', title: 'Le RPM change tout'},
  {at: 118.2, num: '03', title: 'Où vit ton audience'},
  {at: 159.34, num: '04', title: 'Le temps et la rétention'},
  {at: 204.07, num: '05', title: 'Diversifier les revenus'},
];

/** Duree d'affichage d'un carton chapitre. */
export const CHAPTER_HOLD = 3.4;

/* -------------------------------------------------------------------------- */
/*  Mots-cles / punchlines                                                     */
/* -------------------------------------------------------------------------- */

export type Keyword = {
  at: number;
  hold?: number;
  text: string;
  /** Note manuscrite optionnelle, style feutre. */
  note?: string;
  anchor?: 'bottom' | 'top';
  accent?: 'orange' | 'blue' | 'red' | 'green';
};

export const KEYWORDS: Keyword[] = [
  {
    at: 31.2,
    text: 'Le partage des revenus',
    note: 'la pub est encaissée par YouTube',
    accent: 'red',
  },
  {
    at: 82.9,
    text: 'Les vues ne suffisent pas',
    note: 'peu de vues peut rapporter plus',
    accent: 'orange',
  },
  {
    at: 97.7,
    text: 'Passion ou rentabilité ?',
    accent: 'blue',
  },
  {
    at: 131.8,
    text: 'La géographie change le RPM',
    note: 'même vidéo, pays différents',
    accent: 'blue',
  },
  {
    at: 147.3,
    text: 'Lis tes propres données',
    accent: 'green',
  },
  {
    at: 177.6,
    text: 'La rétention décide',
    note: 'le remplissage tue la courbe',
    accent: 'red',
  },
  {
    at: 192.7,
    text: 'Toutes les niches ne se valent pas',
    accent: 'orange',
  },
  {
    at: 238.1,
    text: 'Vues + Stratégie = Revenus',
    accent: 'green',
  },
];

/* -------------------------------------------------------------------------- */
/*  Surlignage des 3 leviers (plan 204.07 -> 237.87)                           */
/* -------------------------------------------------------------------------- */

export type Highlight = {
  at: number;
  hold: number;
  /** Centre de l'ellipse au debut, en pixels sur la grille 1920x1080. */
  cx: number;
  cy: number;
  /** Centre en fin d'affichage : le plan zoome lentement, l'ellipse suit. */
  cxEnd?: number;
  cyEnd?: number;
  rx: number;
  ry: number;
  accent?: 'orange' | 'blue' | 'red' | 'green';
};

/**
 * Dans le plan 204.07 -> 237.87 la video montre d'abord un camembert des
 * sources de revenus (jusqu'a ~219 s), PUIS trois pictos alignes :
 * AFFILIATE / SPONSORSHIP / DIGITAL PRODUCTS. On entoure ces trois-la au
 * feutre, l'un apres l'autre.
 *
 * Positions relevees directement sur les images (crop 1:1 a t=224 et t=232).
 * Le plan zoome doucement vers la droite, d'ou le couple cx -> cxEnd.
 */
export const HIGHLIGHTS: Highlight[] = [
  {at: 222.5, hold: 3.6, cx: 917, cy: 450, rx: 110, ry: 100, accent: 'orange'},
  {
    at: 226.7,
    hold: 3.6,
    cx: 1269,
    cxEnd: 1288,
    cy: 445,
    rx: 134,
    ry: 96,
    accent: 'blue',
  },
  {
    at: 230.9,
    hold: 4.4,
    cx: 1655,
    cxEnd: 1703,
    cy: 436,
    rx: 104,
    ry: 98,
    accent: 'green',
  },
];

/* -------------------------------------------------------------------------- */
/*  Habillage permanent                                                        */
/* -------------------------------------------------------------------------- */

export const BRAND = {
  /** Bandeau discret en haut a droite. Mettre a '' pour le desactiver. */
  handle: '@tachaine',
  /** Barre de progression en bas de cadre. */
  showProgressBar: true,
};

/** Bulle "Abonne-toi" qui pop une fois, vers la fin. */
export const SUBSCRIBE_BUG = {
  at: 244.0,
  hold: 6.0,
  label: 'Abonne-toi',
};

/* -------------------------------------------------------------------------- */
/*  Carton de fin                                                              */
/* -------------------------------------------------------------------------- */

export const OUTRO = {
  /** Laisse d'abord respirer le plan de l'escalier, puis glisse le panneau. */
  start: 258.5,
  /** Se termine avec la video. */
  end: 268.0,
  title: 'Monétise\nintelligemment',
  lines: ['Choisis ta niche', 'Regarde ton RPM', 'Diversifie tes revenus'],
  cta: 'Abonne-toi pour la suite',
};

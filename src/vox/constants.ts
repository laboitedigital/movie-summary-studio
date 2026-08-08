/**
 * Crime Documentary Paper Engine, ADN verrouillé (Source Material v1.0).
 *
 * Ce fichier est la source de vérité du moteur. Les blocs marqués VERBATIM sont
 * repris mot pour mot du matériau source et ne doivent jamais être reformulés,
 * traduits ou régénérés par un modèle : ils sont concaténés par le code dans
 * chaque prompt pour garantir que les trente images d'une même vidéo restent
 * dans un seul et même univers visuel.
 *
 * Répartition des langues (décision produit) :
 *  - éditorial (idées, script, voix off, mots des vignettes) : français
 *  - prompts d'images et de vidéo : anglais, langue dans laquelle les modèles
 *    de génération comprennent le vocabulaire du collage éditorial
 */

/** Règle maison absolue : aucun tiret cadratin nulle part dans aucune sortie. */
export const NO_EM_DASH_RULE =
  "Règle maison absolue : n'utilise JAMAIS de tiret cadratin (—) ni de tiret demi-cadratin (–), " +
  "dans aucune sortie. Utilise des virgules, des deux-points, des parenthèses ou des traits d'union simples.";

/** Mots par seconde de narration. Verrouillé par le matériau source. */
export const WORDS_PER_SECOND = 2.5;

/** Débit de lecture visé pour la voix off ElevenLabs. */
export const TARGET_WPM = 155;

// ---------------------------------------------------------------------------
// SECTION 5, système de style visuel
// ---------------------------------------------------------------------------

/**
 * VERBATIM. Inséré tel quel dans chaque prompt d'image, entre la scène et le
 * closer. C'est ce bloc qui fait qu'une série de beats se lit comme un seul
 * film et non comme trente images sans rapport.
 */
export const STYLE_BLOCK =
  "hand-cut documentary paper collage on aged newsprint and archival map surfaces, " +
  "black and white halftone photograph cutouts with rough scissor-cut edges and offset accent strokes, " +
  "torn paper edges, masking tape fragments, typewriter caption strips, rubber stamp marks, " +
  "red string and brass pins where the story calls for connections, " +
  "desaturated archival palette of tan, ink black, and halftone gray with ONE hot red signal accent " +
  "and a restrained mustard yellow secondary, condensed bold headline lettering only where a label is specified, " +
  "visible print grain and paper fiber, matte, flat even documentary lighting with soft cutout drop shadows.";

/** VERBATIM. Termine chaque prompt d'image de beat. */
export const CLOSER =
  "Every element must appear physically hand-cut and layered from real paper, with visible cutout edges, " +
  "halftone print texture, and soft shadow separation between layers. The composition stays clean, minimal, " +
  "and editorial with generous negative space. NOT digital illustration, NOT cartoon, NOT 3D render, NOT glossy, " +
  "no gradients, no clutter, no watermark, no logos, no text beyond the specified label. " +
  "Premium documentary collage aesthetic, 16:9, ultra-detailed, 8K.";

/**
 * VERBATIM, variante vignette. Identique au closer, la clause de texte étant
 * ajustée comme l'exige l'état 9.
 */
export const THUMBNAIL_CLOSER = CLOSER.replace(
  "no text beyond the specified label",
  "no text beyond the specified thumbnail words"
);

/** Loi de composition (section 5), rappelée au modèle qui rédige les scènes. */
export const COMPOSITION_LAW = [
  "Un seul élément héros par beat, environ 70 pour cent du poids visuel.",
  "Deux à trois éléments secondaires maximum.",
  "Environ 10 pour cent d'intérêt de fond.",
  "Espace négatif généreux : un cadre éditorial professionnel respire.",
  "Ne jamais décorer : chaque bout de papier, tampon ou ficelle existe parce que la narration le réclame.",
];

/**
 * Loi du texte dans l'image. Les modèles d'image déforment les textes longs,
 * d'où le plafond strict de 4 mots.
 */
export const TEXT_IN_IMAGE_LAW =
  "Par défaut AUCUN texte. Quand un beat porte une date, un nom ou un nombre qui compte, " +
  "UNE seule étiquette de 1 à 4 mots peut apparaître sur une bande de papier, un tampon ou un titre déchiré. " +
  "Ne dépasse jamais 4 mots.";

/**
 * Loi du sujet récurrent. Un figurant, un objet ou un lieu qui revient doit être
 * décrit avec exactement les mêmes mots à chaque apparition.
 */
export const RECURRING_SUBJECT_LAW =
  "Si une silhouette, un objet ou un lieu revient sur plusieurs beats, décris-le avec une formulation " +
  "strictement identique à chaque apparition (même costume, même bandeau de censure, même mallette), " +
  "pour que la série se lise comme un seul film.";

// ---------------------------------------------------------------------------
// SECTION 7, prompt vidéo universel
// ---------------------------------------------------------------------------

/**
 * VERBATIM. Appliqué à l'identique à CHAQUE image générée. L'image fournie est
 * l'image finale : l'animation part de la plaque de fond vide et se construit
 * vers elle, puis se fige en affiche vivante.
 */
export const UNIVERSAL_VIDEO_PROMPT = `Transform the provided image into a 10-second premium editorial documentary paper-collage animation. Preserve the final composition of the provided image exactly. Do not redesign, reposition, resize, or replace any element. The provided image is the FINISHED frame that the animation builds toward.

Style: hand-cut documentary paper collage in motion. Aged newsprint and archival surfaces, halftone photo cutouts, torn edges, tape, stamps, red string, typewriter strips. Every element moves as a rigid physical paper piece. Visible cutout thickness, print grain, soft layered shadows. Stop-motion cadence, stepped easing, 2-3 frame holds, the hand-made "cutting on twos" feel. Never smooth CGI motion.

CAMERA, STRICT: the camera stays completely locked for the entire clip. No zoom, no pan, no tilt, no rotation, no orbit, no dolly, no tracking, no handheld shake, no focus pulls, no reframing, no cuts, no transitions, no morphing, no object replacement, no time skips. One continuous static shot.

0 TO 7 SECONDS, BUILD-ON ASSEMBLY: the frame opens on the EMPTY background plate only: the bare aged-newsprint or archival surface with its stains, grain, and any fixed scaffolding (a map base, a timeline line, a corkboard), with every story element absent. Elements then enter one by one, back to front, in narrative order: background scraps settle first, then the hero cutout slides in with paper drag and a small settle, supporting cutouts drop or pin on with a 2-frame stamp settle, tape presses down, typewriter strips slide in, stamps slap on, red string draws itself from pin to pin, marker underlines and arrows draw themselves last. Each entrance lands with a tiny handcrafted bounce and casts a real layered shadow. No element moves again after it lands. By 7 seconds the frame exactly matches the provided image.

7 TO 10 SECONDS, LIVING PAPER POSTER: everything holds position. Only subtle life remains: paper corners lift a millimeter in a draft, halftone dots shimmer faintly, string tension quivers once, shadows breathe, stamp ink glistens subtly. Nothing changes location, nothing scales, nothing rotates significantly, nothing enters or exits.

AUDIO: no music, no narration, no voices. Only close-up paper ASMR and faint scene-appropriate ambience: paper sliding, cardstock taps, tape press, stamp thud, string zip, pin click, soft room tone. All subtle.

FINAL RULE: the finished clip must feel like a real editorial paper collage assembling itself on a table, then holding as a living poster, matching the provided image exactly from 7 seconds to the end.`;

/** Durée verrouillée d'un clip, en secondes (section 7). */
export const VIDEO_CLIP_SECONDS = 10;

// ---------------------------------------------------------------------------
// SECTION 1, niches (état 1)
// ---------------------------------------------------------------------------

export interface VoxNiche {
  id: string;
  label: string;
  isHouseDefault?: boolean;
}

export const NICHES: VoxNiche[] = [
  { id: "crime", label: "Crime et documentaire", isHouseDefault: true },
  { id: "histoire", label: "Histoire" },
  { id: "argent", label: "Argent et pouvoir" },
  { id: "catastrophes", label: "Catastrophes et survie" },
  { id: "mysteres", label: "Mystères et inexpliqué" },
  { id: "technologie", label: "Technologie" },
  { id: "sport", label: "Sport" },
];

// ---------------------------------------------------------------------------
// SECTION 3, ADN d'écriture Fern
// ---------------------------------------------------------------------------

/** Formes de titres autorisées à l'état 2, adaptées au français. */
export const TITLE_SHAPES = [
  "Comment [événement] s'est déroulé",
  "La traque de [cible]",
  "L'histoire [adjectif] de [sujet]",
  "Pourquoi [lieu] [a fait X]",
  "[Événement] expliqué",
  "L'homme qui [acte impossible] / La femme qui [acte impossible]",
  "Ce qui est vraiment arrivé à [sujet]",
];

/** Les cinq motifs de chute. Chaque script se termine sur l'un d'eux. */
export const CLIFFHANGER_PATTERNS = [
  {
    id: "objet",
    name: "L'OBJET NON RÉSOLU",
    rule: "Terminer sur une chose physique qui existe toujours et contient encore le mystère.",
    example: "Le parachute n'a jamais été retrouvé.",
  },
  {
    id: "saut",
    name: "LE SAUT DANS LE TEMPS DATÉ",
    rule: "Terminer en bondissant vers une date ultérieure qui rouvre l'affaire.",
    example: "Puis, en 1980, un enfant a trouvé l'argent.",
  },
  {
    id: "manquante",
    name: "LA PIÈCE MANQUANTE",
    rule: "Terminer en nommant la seule chose que les enquêteurs n'ont jamais obtenue.",
    example: "Ils avaient sa cravate. Ils n'ont jamais eu son nom.",
  },
  {
    id: "contradiction",
    name: "LA CONTRADICTION SILENCIEUSE",
    rule: "Terminer sur un fait qui sape tout ce qui précède.",
    example: "L'homme du siège 18C n'a jamais existé.",
  },
  {
    id: "prix",
    name: "LA LIGNE DU PRIX",
    rule: "Terminer sur le coût humain ou financier, énoncé à plat.",
    example: "Les tableaux valent toujours un demi-milliard de dollars.",
  },
];

/** Durées proposées à l'état 3, avec la cible de mots et la fourchette de beats. */
export interface VoxDuration {
  seconds: number;
  label: string;
  targetWords: number;
  minBeats: number;
  maxBeats: number;
}

export const DURATIONS: VoxDuration[] = [
  { seconds: 30, label: "30 secondes", targetWords: 75, minBeats: 12, maxBeats: 15 },
  { seconds: 60, label: "1 minute", targetWords: 150, minBeats: 22, maxBeats: 30 },
  { seconds: 120, label: "2 minutes", targetWords: 300, minBeats: 45, maxBeats: 60 },
  { seconds: 180, label: "3 minutes", targetWords: 450, minBeats: 70, maxBeats: 90 },
  { seconds: 300, label: "5 minutes", targetWords: 750, minBeats: 115, maxBeats: 150 },
];

/** Tolérance sur le nombre de mots du script : 5 pour cent. */
export const WORD_COUNT_TOLERANCE = 0.05;

// ---------------------------------------------------------------------------
// SECTION 8, voix off ElevenLabs
// ---------------------------------------------------------------------------

export const VOICE_DIRECTION =
  "Narrateur masculin calme et neutre, registre médian, gravité légère, environ 155 mots par minute, " +
  "pics d'émotion minimaux, lecture documentaire droite.";

/**
 * Réglages ElevenLabs de référence (section 8). L'API attend des valeurs de 0 à 1,
 * le matériau source les exprime sur 100.
 */
export const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.8,
  style: 0.0,
  use_speaker_boost: true,
};

/**
 * Modèle ElevenLabs. eleven_multilingual_v2 est retenu pour le français : c'est
 * celui déjà utilisé par le studio et il tient la prosodie française mieux que
 * les modèles anglophones.
 */
export const VOICE_MODEL_ID = "eleven_multilingual_v2";

/**
 * Longueur d'un lot de voix off, en secondes. Le matériau source impose 20 à 25
 * secondes : au delà, ElevenLabs distord la fin des générations longues.
 */
export const VOICE_BATCH_MIN_SECONDS = 20;
export const VOICE_BATCH_MAX_SECONDS = 25;

// ---------------------------------------------------------------------------
// SECTION 9, ADN des vignettes
// ---------------------------------------------------------------------------

export const THUMBNAIL_LAWS = [
  "Un seul sujet héros dominant en demi-teinte : une silhouette (bandeau de censure noir sur les yeux dès qu'une personne réelle est suggérée), un objet ou un lieu.",
  "Deux éléments de texte maximum, trois mots maximum chacun, énormes, condensés, tout en capitales, tirés de l'accroche de la vidéo.",
  "Un seul dispositif de surlignage rouge ou jaune : cercle au marqueur, boîte de tampon, barre de surlignage ou soulignement.",
  "Base en papier journal vieilli, bords déchirés qui débordent du cadre, accents rouge vif, contraste dur, lisible à 200 pixels de large.",
  "16:9, aucun petit détail, aucun filigrane, aucun logo.",
  "Tout montant en euros ou en dollars sur une carte de type revenus porte toujours les centimes.",
];

/** Nombre de propositions de vignettes produites à l'état 9. */
export const THUMBNAIL_COUNT = 3;

/** Mots d'accroche typiques d'une vignette (tout en capitales, 1 à 3 mots). */
export const THUMBNAIL_WORD_EXAMPLES = ["DISPARU", "EXPOSÉ", "RETROUVÉ", "LE MONTANT", "L'ANNÉE"];

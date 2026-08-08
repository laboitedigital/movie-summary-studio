/**
 * Assemblage des prompts d'images et de vignettes (états 7 et 9).
 *
 * Le modèle ne rédige que la SCÈNE, c'est à dire la composition propre à un
 * beat. Le bloc de style et le closer sont concaténés ici, par le code. C'est
 * la seule façon de tenir la contrainte « inclure verbatim dans chaque prompt »
 * du matériau source : un modèle qui recopie trente fois un paragraphe de 90
 * mots finit toujours par en dériver, et l'unité visuelle de la série se perd.
 */

import {
  STYLE_BLOCK,
  CLOSER,
  THUMBNAIL_CLOSER,
  UNIVERSAL_VIDEO_PROMPT,
} from "./constants.js";
import { stripEmDashes, slugify } from "./sanitize.js";
import type { VoxBeat, VoxImagePrompt, VoxThumbnailPrompt } from "./types.js";

/**
 * Construit le prompt complet d'un beat : scène, puis bloc de style, puis
 * closer, en une seule coulée de prose comme l'exige le format.
 */
export function buildImagePrompt(scene: string): string {
  const cleanScene = stripEmDashes(scene.trim()).replace(/\s+/g, " ").replace(/\.?$/, ".");
  return `${cleanScene} ${STYLE_BLOCK} ${CLOSER}`;
}

/** Même assemblage pour une vignette, avec la clause de texte ajustée. */
export function buildThumbnailPrompt(scene: string): string {
  const cleanScene = stripEmDashes(scene.trim()).replace(/\s+/g, " ").replace(/\.?$/, ".");
  return `${cleanScene} ${STYLE_BLOCK} ${THUMBNAIL_CLOSER}`;
}

/** Associe les scènes rédigées par le modèle aux beats, dans l'ordre. */
export function assembleImagePrompts(beats: VoxBeat[], scenes: string[]): VoxImagePrompt[] {
  return beats.map((beat, i) => {
    const scene = scenes[i] || "";
    return {
      beatIndex: beat.index,
      scene,
      fullPrompt: buildImagePrompt(scene),
    };
  });
}

/**
 * Sérialise les prompts au format d'alimentation en masse (Textify).
 *
 * Le format est strict : un bloc par prompt, des blocs séparés par une seule
 * ligne vide, aucune numérotation, aucun en-tête, aucun commentaire. Chaque
 * bloc est autonome pour pouvoir être lancé indépendamment.
 */
export function serializePromptsFile(prompts: VoxImagePrompt[]): string {
  return prompts.map((p) => p.fullPrompt.trim()).join("\n\n") + "\n";
}

/** Nom du fichier livré à l'état 7 : [sujet-slug]-prompts.txt */
export function promptsFileName(topic: string): string {
  return `${slugify(topic)}-prompts.txt`;
}

/**
 * Le prompt vidéo universel est identique pour tous les beats : c'est
 * exactement ce que demande l'état 8. La fonction existe pour que les appelants
 * n'aient jamais à recomposer la constante à la main.
 */
export function videoPromptFor(_beat: VoxBeat): string {
  return UNIVERSAL_VIDEO_PROMPT;
}

/** Sérialise les vignettes, même format de blocs séparés par une ligne vide. */
export function serializeThumbnailsFile(thumbnails: VoxThumbnailPrompt[]): string {
  return thumbnails.map((t) => t.fullPrompt.trim()).join("\n\n") + "\n";
}

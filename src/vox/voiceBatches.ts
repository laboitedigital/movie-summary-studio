/**
 * Découpage de la narration en lots de voix off (état 5, section 8).
 *
 * Le matériau source impose des lots de 20 à 25 secondes : au delà, ElevenLabs
 * distord la fin des générations longues. Les coupures se font uniquement en fin
 * de phrase, sinon la prosodie repart à froid au milieu d'une proposition et le
 * raccord s'entend au montage.
 */

import {
  WORDS_PER_SECOND,
  VOICE_BATCH_MIN_SECONDS,
  VOICE_BATCH_MAX_SECONDS,
} from "./constants.js";
import { splitIntoSentences, countWords } from "./beats.js";
import type { VoxVoiceBatch } from "./types.js";

const MAX_BATCH_WORDS = Math.floor(VOICE_BATCH_MAX_SECONDS * WORDS_PER_SECOND);
const MIN_BATCH_WORDS = Math.floor(VOICE_BATCH_MIN_SECONDS * WORDS_PER_SECOND);

/**
 * Regroupe les phrases du script en lots de 20 à 25 secondes.
 *
 * Une phrase qui dépasse à elle seule la taille d'un lot est conservée entière :
 * la couper produirait un raccord audible en plein milieu, ce qui coûte plus
 * cher que la légère distorsion d'une génération un peu longue.
 */
export function buildVoiceBatches(script: string): VoxVoiceBatch[] {
  const sentences = splitIntoSentences(script);
  const groups: string[][] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const words = countWords(sentence);

    if (current.length > 0 && currentWords + words > MAX_BATCH_WORDS) {
      groups.push(current);
      current = [];
      currentWords = 0;
    }

    current.push(sentence);
    currentWords += words;
  }

  if (current.length > 0) groups.push(current);

  // Un dernier lot très court se replie sur le précédent, mais seulement si la
  // fusion tient sous le plafond : dépasser 25 secondes pour éviter un lot court
  // réintroduirait exactement la distorsion que le découpage cherche à éviter.
  if (groups.length >= 2) {
    const wordsOf = (group: string[]) => group.reduce((n, s) => n + countWords(s), 0);
    const lastWords = wordsOf(groups[groups.length - 1]);
    const previousWords = wordsOf(groups[groups.length - 2]);

    if (lastWords < MIN_BATCH_WORDS / 2 && lastWords + previousWords <= MAX_BATCH_WORDS) {
      const last = groups.pop()!;
      groups[groups.length - 1].push(...last);
    }
  }

  return groups.map((group, i) => {
    const text = group.join(" ");
    const wordCount = countWords(text);
    return {
      index: i + 1,
      text,
      wordCount,
      estimatedSeconds: Math.round((wordCount / WORDS_PER_SECOND) * 10) / 10,
      audioUrl: null,
      takes: [],
      selectedTake: 0,
      // Le lot d'ouverture porte la vidéo : c'est la prise prioritaire.
      isColdOpen: i === 0,
    };
  });
}

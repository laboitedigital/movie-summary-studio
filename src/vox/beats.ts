/**
 * Découpage en beats visuels (état 6).
 *
 * Le matériau source impose des règles arithmétiques strictes : un beat couvre
 * 2 à 3 secondes de narration, soit 5 à 8 mots à 2,5 mots par seconde, une phrase
 * courte est un beat, une phrase longue se coupe à sa virgule ou à sa césure de
 * proposition naturelle, et les timecodes sont cumulatifs.
 *
 * Ce découpage est fait par le code plutôt que par un modèle : les règles sont
 * arithmétiques, donc un calcul déterministe les respecte toujours, se rejoue à
 * l'identique et ne consomme aucun jeton.
 */

import { WORDS_PER_SECOND, DURATIONS } from "./constants.js";
import type { VoxBeat } from "./types.js";

/** Fourchette de mots par beat, dérivée de 2 à 3 secondes à 2,5 mots par seconde. */
export const MIN_BEAT_WORDS = 5;
export const MAX_BEAT_WORDS = 8;

/**
 * Connecteurs français qui ouvrent une proposition. Couper juste avant l'un
 * d'eux donne une césure naturelle quand aucune virgule n'est disponible.
 */
const CLAUSE_OPENERS = new Set([
  "et", "mais", "puis", "car", "donc", "or", "ni",
  "qui", "que", "quand", "lorsque", "parce", "puisque", "tandis",
  "avant", "après", "pendant", "depuis", "jusqu'à", "dès",
  "ce", "dont", "où", "alors", "ensuite", "enfin", "cependant",
  "pourtant", "sauf", "malgré", "selon", "sans", "pour", "afin",
]);

/** Ponctuation de fin de proposition : une coupure y est toujours préférable. */
const CLAUSE_ENDERS = /[,;:]$/;

/** Compte les mots d'un texte, à la façon dont le fait le calcul de durée. */
export function countWords(text: string): number {
  return tokenize(text).length;
}

/** Durée de lecture d'un texte, en secondes, à 2,5 mots par seconde. */
export function estimateSeconds(text: string): number {
  return countWords(text) / WORDS_PER_SECOND;
}

function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Découpe un bloc de narration continue en phrases.
 *
 * Les abréviations françaises courantes suivies d'un point (M., Mme, etc.) ne
 * doivent pas déclencher une fin de phrase, sans quoi un beat serait coupé au
 * milieu d'un nom propre.
 */
export function splitIntoSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const ABBREVIATIONS = /(?:M|MM|Mme|Mlle|Dr|Pr|St|Ste|no|art|av|env|cf|ex|p|vol|éd)$/i;

  const sentences: string[] = [];
  let current = "";

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    current += char;

    if (char !== "." && char !== "!" && char !== "?") continue;

    // Les points de suspension et les séries de ponctuation se consomment d'un bloc.
    while (i + 1 < normalized.length && /[.!?]/.test(normalized[i + 1])) {
      current += normalized[++i];
    }

    const next = normalized[i + 1];
    if (next !== undefined && next !== " ") continue;

    const withoutPunctuation = current.replace(/[.!?]+$/, "");
    const lastWord = withoutPunctuation.split(/\s+/).pop() || "";
    if (char === "." && ABBREVIATIONS.test(lastWord)) continue;

    // Un point suivi d'une minuscule ne termine pas la phrase (ex. « 24 nov. 1971 »).
    const following = normalized.slice(i + 1).trimStart()[0];
    if (char === "." && following && following === following.toLowerCase() && /[a-zà-ÿ]/.test(following)) {
      continue;
    }

    sentences.push(current.trim());
    current = "";
  }

  if (current.trim()) sentences.push(current.trim());
  return sentences;
}

/** Taille plancher d'un tronçon, pour ne jamais isoler un ou deux mots. */
const MIN_CHUNK_WORDS = 3;

/**
 * Coupe une phrase trop longue, par dichotomie sur ses césures naturelles.
 *
 * On cherche la meilleure coupure autour du milieu de la phrase, puis on
 * recommence sur chaque moitié encore trop longue. Une virgule est la meilleure
 * césure, un connecteur de proposition vient ensuite, et à défaut on coupe au
 * plus près du milieu.
 *
 * Procéder par moitiés successives plutôt qu'en avançant de gauche à droite
 * évite deux défauts : le reliquat d'un ou deux mots en fin de phrase, et la
 * césure qui tombe au milieu d'un groupe verbal parce que le curseur avait déjà
 * consommé son quota de mots.
 */
function splitWords(words: string[]): string[][] {
  if (words.length <= MAX_BEAT_WORDS) return [words];

  const lower = MIN_CHUNK_WORDS;
  const upper = words.length - MIN_CHUNK_WORDS;
  const middle = words.length / 2;

  let bestCut = Math.round(middle);
  let bestScore = -Infinity;

  for (let cut = lower; cut <= upper; cut++) {
    // Distance au milieu, en négatif : la coupure la plus équilibrée gagne.
    let score = -Math.abs(cut - middle);
    if (CLAUSE_ENDERS.test(words[cut - 1])) score += 10;
    else if (CLAUSE_OPENERS.has(stripWord(words[cut]))) score += 6;

    if (score > bestScore) {
      bestScore = score;
      bestCut = cut;
    }
  }

  return [...splitWords(words.slice(0, bestCut)), ...splitWords(words.slice(bestCut))];
}

function splitLongSentence(sentence: string): string[] {
  const words = tokenize(sentence);
  if (words.length <= MAX_BEAT_WORDS) return [sentence.trim()];
  return splitWords(words).map((chunk) => chunk.join(" "));
}

function stripWord(word: string): string {
  return word.toLowerCase().replace(/^[^\wà-ÿ']+|[^\wà-ÿ']+$/g, "");
}

/**
 * Découpe un script complet en beats timecodés.
 *
 * Une phrase courte donne un beat, une phrase longue se coupe à ses césures
 * naturelles, et les timecodes sont cumulés sur le nombre de mots écoulés.
 */
export function buildBeats(script: string): VoxBeat[] {
  const sentences = splitIntoSentences(script);
  const texts: string[] = [];

  for (const sentence of sentences) {
    texts.push(...splitLongSentence(sentence));
  }

  // Un dernier tronçon trop court est absorbé par le beat précédent plutôt que
  // de produire un plan d'un seul mot.
  if (texts.length >= 2) {
    const lastWords = countWords(texts[texts.length - 1]);
    const previousWords = countWords(texts[texts.length - 2]);
    if (lastWords < MIN_BEAT_WORDS && lastWords + previousWords <= MAX_BEAT_WORDS + 2) {
      const merged = `${texts[texts.length - 2]} ${texts[texts.length - 1]}`;
      texts.splice(texts.length - 2, 2, merged);
    }
  }

  const beats: VoxBeat[] = [];
  let elapsedWords = 0;

  for (let i = 0; i < texts.length; i++) {
    const wordCount = countWords(texts[i]);
    beats.push({
      index: i + 1,
      startSeconds: Math.round((elapsedWords / WORDS_PER_SECOND) * 10) / 10,
      text: texts[i],
      wordCount,
    });
    elapsedWords += wordCount;
  }

  return beats;
}

/**
 * Contrôle de cohérence du nombre de beats (section 4).
 *
 * Un écart n'est pas bloquant : il signale que le script est plus dense ou plus
 * aéré que la moyenne, ce que l'utilisateur doit voir avant de lancer des
 * générations d'images facturées.
 */
export function checkBeatCount(
  beatCount: number,
  durationSeconds: number
): { ok: boolean; expected: string; message: string | null } {
  const duration = DURATIONS.find((d) => d.seconds === durationSeconds);
  if (!duration) {
    return { ok: true, expected: "", message: null };
  }

  const expected = `${duration.minBeats} à ${duration.maxBeats}`;
  if (beatCount >= duration.minBeats && beatCount <= duration.maxBeats) {
    return { ok: true, expected, message: null };
  }

  const direction = beatCount < duration.minBeats ? "en dessous de" : "au dessus de";
  return {
    ok: false,
    expected,
    message:
      `${beatCount} beats pour ${duration.label}, ${direction} la fourchette attendue (${expected}). ` +
      `Le script est probablement ${beatCount < duration.minBeats ? "trop court ou fait de phrases trop longues" : "trop long ou trop haché"}.`,
  };
}

/** Formate un timecode en secondes avec une décimale, comme dans le tableau de beats. */
export function formatTimecode(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

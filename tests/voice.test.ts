import { describe, it, expect } from "vitest";
import { buildVoiceBatches } from "../src/vox/voiceBatches.js";
import { countWords, splitIntoSentences } from "../src/vox/beats.js";
import {
  WORDS_PER_SECOND,
  VOICE_BATCH_MAX_SECONDS,
  VOICE_SETTINGS,
} from "../src/vox/constants.js";

/** Script d'environ 300 mots, soit une vidéo de 2 minutes. */
const LONG_SCRIPT = Array.from(
  { length: 30 },
  (_, i) => `Le ${i + 1} mars 1971, un homme est entré dans la banque de la rue Saint Denis.`
).join(" ");

const SHORT_SCRIPT = "Le 24 novembre 1971. Portland. Le parachute n'a jamais été retrouvé.";

describe("buildVoiceBatches", () => {
  it("ne dépasse jamais le plafond de 25 secondes", () => {
    // Au delà, ElevenLabs distord la fin des générations longues : c'est la
    // contrainte qui justifie tout le découpage en lots.
    for (const batch of buildVoiceBatches(LONG_SCRIPT)) {
      expect(batch.estimatedSeconds).toBeLessThanOrEqual(VOICE_BATCH_MAX_SECONDS + 0.05);
    }
  });

  it("reconstitue exactement le script", () => {
    const batches = buildVoiceBatches(LONG_SCRIPT);
    expect(batches.map((b) => b.text).join(" ")).toBe(LONG_SCRIPT.replace(/\s+/g, " ").trim());
  });

  it("coupe uniquement en fin de phrase", () => {
    // Une coupure en milieu de proposition fait repartir la prosodie à froid et
    // le raccord s'entend au montage.
    const sentences = splitIntoSentences(LONG_SCRIPT);
    for (const batch of buildVoiceBatches(LONG_SCRIPT)) {
      for (const sentence of splitIntoSentences(batch.text)) {
        expect(sentences).toContain(sentence);
      }
    }
  });

  it("marque le premier lot comme ouverture à froid, et lui seul", () => {
    const batches = buildVoiceBatches(LONG_SCRIPT);
    expect(batches[0].isColdOpen).toBe(true);
    expect(batches.slice(1).every((b) => !b.isColdOpen)).toBe(true);
  });

  it("ne fusionne pas un lot court si la fusion dépassait le plafond", () => {
    // Régression : la fusion du reliquat réintroduisait des lots de 30 secondes,
    // exactement la distorsion que le découpage cherche à éviter.
    const batches = buildVoiceBatches(LONG_SCRIPT);
    const totalWords = batches.reduce((n, b) => n + b.wordCount, 0);
    expect(totalWords).toBe(countWords(LONG_SCRIPT));
    for (const batch of batches) {
      expect(batch.wordCount / WORDS_PER_SECOND).toBeLessThanOrEqual(VOICE_BATCH_MAX_SECONDS + 0.05);
    }
  });

  it("garde un script court en un seul lot", () => {
    const batches = buildVoiceBatches(SHORT_SCRIPT);
    expect(batches).toHaveLength(1);
    expect(batches[0].isColdOpen).toBe(true);
  });

  it("numérote les lots à partir de 1", () => {
    const batches = buildVoiceBatches(LONG_SCRIPT);
    expect(batches.map((b) => b.index)).toEqual(batches.map((_, i) => i + 1));
  });

  it("part sans prise sélectionnée", () => {
    for (const batch of buildVoiceBatches(LONG_SCRIPT)) {
      expect(batch.audioUrl).toBeNull();
      expect(batch.takes).toEqual([]);
    }
  });
});

describe("réglages de voix du matériau source", () => {
  it("traduit les valeurs sur 100 en valeurs d'API sur 1", () => {
    // Section 8 : stabilité 55, similarité 80, style bas, speaker boost actif.
    expect(VOICE_SETTINGS.stability).toBeCloseTo(0.55);
    expect(VOICE_SETTINGS.similarity_boost).toBeCloseTo(0.8);
    expect(VOICE_SETTINGS.style).toBe(0);
    expect(VOICE_SETTINGS.use_speaker_boost).toBe(true);
  });
});

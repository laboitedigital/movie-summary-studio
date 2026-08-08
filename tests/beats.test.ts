import { describe, it, expect } from "vitest";
import {
  buildBeats,
  splitIntoSentences,
  checkBeatCount,
  countWords,
  formatTimecode,
  MAX_BEAT_WORDS,
} from "../src/vox/beats.js";
import { WORDS_PER_SECOND, DURATIONS } from "../src/vox/constants.js";

/** Script de démonstration du matériau source, transposé en français. */
const COOPER = `Le 24 novembre 1971. Aéroport international de Portland. Un homme en costume sombre paie en liquide un aller simple pour Seattle. Il donne le nom de Dan Cooper. Quelque part au dessus de l'État de Washington, il tend un mot à une hôtesse de l'air. Le mot dit qu'il transporte une bombe. Il exige deux cent mille dollars et quatre parachutes. Cette nuit là, il saute dans une tempête glaciale. Le FBI a cherché pendant quarante cinq ans. Le parachute n'a jamais été retrouvé.`;

describe("splitIntoSentences", () => {
  it("coupe sur la ponctuation forte", () => {
    expect(splitIntoSentences("Un. Deux ! Trois ?")).toEqual(["Un.", "Deux !", "Trois ?"]);
  });

  it("ne coupe pas sur une abréviation française", () => {
    // Sans cette protection, « M. » terminerait une phrase et couperait un nom propre en deux.
    expect(splitIntoSentences("M. Cooper est monté à bord. Il ne redescendra pas.")).toEqual([
      "M. Cooper est monté à bord.",
      "Il ne redescendra pas.",
    ]);
  });

  it("ne coupe pas quand la suite commence en minuscule", () => {
    expect(splitIntoSentences("Le 24 nov. 1971 à Portland.")).toEqual(["Le 24 nov. 1971 à Portland."]);
  });

  it("consomme les points de suspension d'un bloc", () => {
    expect(splitIntoSentences("Il attend... Puis il saute.")).toEqual(["Il attend...", "Puis il saute."]);
  });

  it("renvoie une liste vide sur une entrée vide", () => {
    expect(splitIntoSentences("   ")).toEqual([]);
  });
});

describe("buildBeats", () => {
  const beats = buildBeats(COOPER);

  it("reconstitue exactement le script d'origine", () => {
    // Le tableau de beats affiche « les mots exacts de narration couverts » :
    // toute perte ou duplication ici désynchroniserait l'image et la voix.
    expect(beats.map((b) => b.text).join(" ")).toBe(COOPER.replace(/\s+/g, " ").trim());
  });

  it("ne produit aucun beat au dessus du plafond de mots", () => {
    for (const beat of beats) {
      expect(beat.wordCount).toBeLessThanOrEqual(MAX_BEAT_WORDS);
    }
  });

  it("ne laisse aucun fragment orphelin de moins de trois mots", () => {
    // Un plan d'un ou deux mots ne porte aucune idée visuelle et gaspille une image.
    for (const beat of beats) {
      expect(beat.wordCount).toBeGreaterThanOrEqual(3);
    }
  });

  it("cumule les timecodes à 2,5 mots par seconde", () => {
    let elapsed = 0;
    for (const beat of beats) {
      expect(beat.startSeconds).toBeCloseTo(elapsed / WORDS_PER_SECOND, 1);
      elapsed += beat.wordCount;
    }
  });

  it("numérote les beats à partir de 1, sans trou", () => {
    expect(beats.map((b) => b.index)).toEqual(beats.map((_, i) => i + 1));
  });

  it("respecte la fourchette de beats attendue pour la durée du script", () => {
    // 84 mots, soit un script de 30 secondes : la fourchette est 12 à 15 beats.
    expect(countWords(COOPER)).toBeGreaterThan(70);
    expect(countWords(COOPER)).toBeLessThan(95);
    expect(checkBeatCount(beats.length, 30).ok).toBe(true);
  });

  it("coupe les phrases longues sur leurs césures naturelles", () => {
    const split = buildBeats("Cette nuit là, il saute dans une tempête glaciale.");
    expect(split.map((b) => b.text)).toEqual([
      "Cette nuit là,",
      "il saute dans une tempête glaciale.",
    ]);
  });

  it("préfère un connecteur de proposition quand il n'y a pas de virgule", () => {
    const split = buildBeats("Il exige deux cent mille dollars et quatre parachutes.");
    expect(split.map((b) => b.text)).toEqual([
      "Il exige deux cent mille dollars",
      "et quatre parachutes.",
    ]);
  });

  it("garde une phrase courte en un seul beat", () => {
    const split = buildBeats("Le parachute n'a jamais été retrouvé.");
    expect(split).toHaveLength(1);
  });

  it("gère un script vide sans planter", () => {
    expect(buildBeats("")).toEqual([]);
  });
});

describe("checkBeatCount", () => {
  it("valide un compte dans la fourchette", () => {
    expect(checkBeatCount(25, 60)).toMatchObject({ ok: true, message: null });
  });

  it("signale un compte trop bas sans bloquer", () => {
    const result = checkBeatCount(5, 60);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("en dessous de");
  });

  it("signale un compte trop haut", () => {
    expect(checkBeatCount(200, 60).message).toContain("au dessus de");
  });

  it("reste neutre sur une durée hors catalogue", () => {
    expect(checkBeatCount(42, 999)).toMatchObject({ ok: true, message: null });
  });

  it("couvre toutes les durées proposées", () => {
    for (const duration of DURATIONS) {
      expect(checkBeatCount(duration.minBeats, duration.seconds).ok).toBe(true);
      expect(checkBeatCount(duration.maxBeats, duration.seconds).ok).toBe(true);
      expect(checkBeatCount(duration.minBeats - 1, duration.seconds).ok).toBe(false);
    }
  });
});

describe("formatTimecode", () => {
  it("affiche une décimale", () => {
    expect(formatTimecode(0)).toBe("0.0s");
    expect(formatTimecode(11.24)).toBe("11.2s");
  });
});

import { describe, it, expect } from "vitest";
import { distributeDurations, atempoChain } from "../voxRenderEngine.js";

/**
 * Arithmétique du montage final.
 *
 * C'est le code le plus délicat du moteur : une erreur ici ne plante pas, elle
 * produit une vidéo où l'image dérive progressivement de la voix.
 */

describe("distributeDurations", () => {
  it("répartit la durée d'un lot au prorata des mots de ses beats", () => {
    const beats = [{ wordCount: 4 }, { wordCount: 6 }, { wordCount: 7 }];
    const durations = distributeDurations(beats, [17], [6.426]);

    expect(durations[0]).toBeCloseTo((6.426 * 4) / 17, 3);
    expect(durations[1]).toBeCloseTo((6.426 * 6) / 17, 3);
    expect(durations[2]).toBeCloseTo((6.426 * 7) / 17, 3);
  });

  it("conserve exactement la durée totale de la narration", () => {
    // Sans cette propriété, la vidéo et la voix se décalent d'autant à chaque lot.
    const beats = [{ wordCount: 4 }, { wordCount: 6 }, { wordCount: 7 }, { wordCount: 5 }];
    const durations = distributeDurations(beats, [17, 5], [6.426, 3.135]);

    const total = durations.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(6.426 + 3.135, 5);
  });

  it("rattache chaque beat au lot qui contient son premier mot", () => {
    const beats = [{ wordCount: 4 }, { wordCount: 6 }, { wordCount: 7 }, { wordCount: 5 }];
    const durations = distributeDurations(beats, [17, 5], [10, 2]);

    // Les trois premiers beats appartiennent au lot de 10 secondes, le dernier
    // au lot de 2 secondes.
    expect(durations[0] + durations[1] + durations[2]).toBeCloseTo(10, 5);
    expect(durations[3]).toBeCloseTo(2, 5);
  });

  it("ne descend jamais sous le plancher d'une demi-seconde", () => {
    // Un plan plus court ne se lit pas à l'écran.
    const beats = [{ wordCount: 1 }, { wordCount: 100 }];
    const durations = distributeDurations(beats, [101], [5]);
    expect(durations[0]).toBeGreaterThanOrEqual(0.5);
  });

  it("retombe sur l'estimation théorique sans lot de voix", () => {
    const durations = distributeDurations([{ wordCount: 5 }, { wordCount: 10 }], [], []);
    expect(durations[0]).toBeCloseTo(5 / 2.5, 5);
    expect(durations[1]).toBeCloseTo(10 / 2.5, 5);
  });

  it("gère un lot de voix ne couvrant aucun beat", () => {
    const durations = distributeDurations([{ wordCount: 10 }], [10, 5], [4, 2]);
    expect(durations).toHaveLength(1);
    expect(durations[0]).toBeGreaterThan(0);
  });

  it("répartit uniformément des beats de même longueur", () => {
    const beats = Array.from({ length: 4 }, () => ({ wordCount: 5 }));
    const durations = distributeDurations(beats, [20], [8]);
    for (const d of durations) expect(d).toBeCloseTo(2, 5);
  });
});

describe("atempoChain", () => {
  /** Le produit des facteurs de la chaîne doit redonner le facteur demandé. */
  const product = (chain: string) =>
    chain
      .split(",")
      .map((part) => Number(part.replace("atempo=", "")))
      .reduce((a, b) => a * b, 1);

  it("passe un facteur simple en une seule instance", () => {
    expect(atempoChain(1.5)).toBe("atempo=1.5000");
  });

  it("enchaîne les instances au dessus de 2", () => {
    // atempo n'accepte que 0,5 à 2 par instance : comprimer 7 secondes d'ASMR
    // en 2,4 demande un facteur de 2,9, donc deux instances.
    const chain = atempoChain(2.9);
    expect(chain.split(",").length).toBeGreaterThan(1);
    expect(product(chain)).toBeCloseTo(2.9, 3);
  });

  it("enchaîne aussi pour les facteurs très élevés", () => {
    const chain = atempoChain(10);
    expect(product(chain)).toBeCloseTo(10, 2);
    for (const part of chain.split(",")) {
      const value = Number(part.replace("atempo=", ""));
      expect(value).toBeGreaterThanOrEqual(0.5);
      expect(value).toBeLessThanOrEqual(2);
    }
  });

  it("enchaîne vers le bas sous 0,5", () => {
    const chain = atempoChain(0.2);
    expect(product(chain)).toBeCloseTo(0.2, 3);
    for (const part of chain.split(",")) {
      const value = Number(part.replace("atempo=", ""));
      expect(value).toBeGreaterThanOrEqual(0.5);
      expect(value).toBeLessThanOrEqual(2);
    }
  });

  it("reste neutre à facteur 1", () => {
    expect(product(atempoChain(1))).toBeCloseTo(1, 5);
  });
});

import { describe, it, expect } from "vitest";
import {
  buildImagePrompt,
  buildThumbnailPrompt,
  assembleImagePrompts,
  serializePromptsFile,
  promptsFileName,
} from "../src/vox/promptBuilder.js";
import { stripEmDashes, cleanModelText, slugify } from "../src/vox/sanitize.js";
import { STYLE_BLOCK, CLOSER, THUMBNAIL_CLOSER } from "../src/vox/constants.js";
import { buildBeats } from "../src/vox/beats.js";

const SCENE = "A single torn calendar page dominates the frame as the hero element";

describe("buildImagePrompt", () => {
  it("insère le bloc de style verbatim", () => {
    // C'est la garantie centrale du moteur : les trente images d'une vidéo
    // partagent un bloc de style identique au caractère près.
    expect(buildImagePrompt(SCENE)).toContain(STYLE_BLOCK);
  });

  it("termine par le closer verbatim", () => {
    expect(buildImagePrompt(SCENE).endsWith(CLOSER)).toBe(true);
  });

  it("place la scène en tête", () => {
    expect(buildImagePrompt(SCENE).startsWith(SCENE)).toBe(true);
  });

  it("ponctue la scène si elle ne l'est pas", () => {
    expect(buildImagePrompt("une scène sans point")).toContain("une scène sans point.");
  });

  it("ne double pas un point déjà présent", () => {
    expect(buildImagePrompt("une scène ponctuée.")).not.toContain("ponctuée..");
  });

  it("nettoie les tirets cadratins glissés par le modèle", () => {
    expect(buildImagePrompt("a torn page — pinned to a wall")).not.toMatch(/[—–]/);
  });

  it("normalise les espaces multiples et les retours ligne", () => {
    expect(buildImagePrompt("a  page\n\npinned")).toContain("a page pinned");
  });
});

describe("buildThumbnailPrompt", () => {
  it("utilise la variante vignette du closer", () => {
    const prompt = buildThumbnailPrompt(SCENE);
    expect(prompt).toContain("no text beyond the specified thumbnail words");
    expect(prompt).not.toContain("no text beyond the specified label");
  });

  it("garde le même bloc de style que les images", () => {
    // Les vignettes vivent dans le même univers visuel, poussé plus fort.
    expect(buildThumbnailPrompt(SCENE)).toContain(STYLE_BLOCK);
  });

  it("ne diffère du closer image que sur la clause de texte", () => {
    expect(THUMBNAIL_CLOSER).toBe(
      CLOSER.replace("no text beyond the specified label", "no text beyond the specified thumbnail words")
    );
  });
});

describe("assembleImagePrompts", () => {
  const beats = buildBeats("Le 24 novembre 1971. Portland. Le parachute n'a jamais été retrouvé.");

  it("associe chaque scène à son beat, dans l'ordre", () => {
    const prompts = assembleImagePrompts(beats, ["scene A", "scene B", "scene C"]);
    expect(prompts.map((p) => p.beatIndex)).toEqual([1, 2, 3]);
    expect(prompts[1].scene).toBe("scene B");
  });

  it("produit un prompt complet même si une scène manque", () => {
    // Un modèle qui saute une entrée ne doit pas casser toute la série.
    const prompts = assembleImagePrompts(beats, ["scene A"]);
    expect(prompts).toHaveLength(beats.length);
    expect(prompts[2].scene).toBe("");
    expect(prompts[2].fullPrompt).toContain(STYLE_BLOCK);
  });
});

describe("serializePromptsFile", () => {
  // Trois phrases assez longues pour rester trois beats distincts : des phrases
  // d'un mot seraient légitimement fusionnées par le découpage.
  const prompts = assembleImagePrompts(
    buildBeats("Le 24 novembre 1971. Aéroport international de Portland. Il donne le nom de Dan Cooper."),
    ["scene A", "scene B", "scene C"]
  );
  const file = serializePromptsFile(prompts);

  it("sépare les blocs par une seule ligne vide", () => {
    expect(file).not.toContain("\n\n\n");
    expect(file.trimEnd().split("\n\n")).toHaveLength(3);
  });

  it("n'ajoute ni numérotation ni en-tête", () => {
    // Le fichier alimente une génération en masse : toute ligne parasite
    // deviendrait un prompt.
    for (const line of file.trimEnd().split("\n\n")) {
      expect(line).not.toMatch(/^\s*(\d+[.)]|#|Beat)/i);
    }
  });

  it("rend chaque bloc autonome", () => {
    for (const block of file.trimEnd().split("\n\n")) {
      expect(block).toContain(STYLE_BLOCK);
      expect(block.endsWith(CLOSER)).toBe(true);
    }
  });

  it("se termine par un saut de ligne", () => {
    expect(file.endsWith("\n")).toBe(true);
  });
});

describe("promptsFileName", () => {
  it("suit le gabarit [sujet-slug]-prompts.txt", () => {
    expect(promptsFileName("La traque de Dan Cooper")).toBe("la-traque-de-dan-cooper-prompts.txt");
  });

  it("retire les accents", () => {
    expect(promptsFileName("L'énigme de Créteil")).toBe("l-enigme-de-creteil-prompts.txt");
  });

  it("retombe sur un nom par défaut si le sujet est vide", () => {
    expect(promptsFileName("")).toBe("sujet-prompts.txt");
  });
});

describe("stripEmDashes", () => {
  it("transforme une incise en virgule", () => {
    expect(stripEmDashes("Il a tout perdu — sa maison — en une nuit.")).toBe(
      "Il a tout perdu, sa maison, en une nuit."
    );
  });

  it("transforme un intervalle collé en trait d'union", () => {
    expect(stripEmDashes("1971—1980")).toBe("1971-1980");
  });

  it("traite aussi le tiret demi-cadratin", () => {
    expect(stripEmDashes("1971–1980")).toBe("1971-1980");
  });

  it("laisse un texte propre inchangé", () => {
    const clean = "Le parachute n'a jamais été retrouvé.";
    expect(stripEmDashes(clean)).toBe(clean);
  });
});

describe("cleanModelText", () => {
  it("retire une clôture de bloc de code", () => {
    expect(cleanModelText("```json\nvaleur\n```")).toBe("valeur");
  });

  it("retire des guillemets englobants", () => {
    expect(cleanModelText('"une scène"')).toBe("une scène");
    expect(cleanModelText("« une scène »")).toBe("une scène");
  });

  it("applique la règle des tirets", () => {
    expect(cleanModelText("un texte — avec incise")).not.toMatch(/[—–]/);
  });

  it("gère une entrée vide", () => {
    expect(cleanModelText("")).toBe("");
  });
});

describe("slugify", () => {
  it("plafonne la longueur", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(60);
  });

  it("ne laisse pas de tiret en bord", () => {
    expect(slugify("  Le Sujet !  ")).toBe("le-sujet");
  });
});

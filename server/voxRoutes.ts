/**
 * Routes du moteur Vox (Crime Documentary Paper Engine).
 *
 * Le routeur est construit par injection : le serveur principal détient les
 * clients Gemini, Claude et ElevenLabs, et ne passe ici que deux fonctions.
 * Cela évite un import circulaire avec server.ts et garde la logique du moteur
 * isolée du câblage des fournisseurs.
 */

import express from "express";
import {
  NICHES,
  DURATIONS,
  TITLE_SHAPES,
  CLIFFHANGER_PATTERNS,
  COMPOSITION_LAW,
  TEXT_IN_IMAGE_LAW,
  RECURRING_SUBJECT_LAW,
  THUMBNAIL_LAWS,
  THUMBNAIL_COUNT,
  THUMBNAIL_WORD_EXAMPLES,
  UNIVERSAL_VIDEO_PROMPT,
  VIDEO_CLIP_SECONDS,
  WORD_COUNT_TOLERANCE,
  WORDS_PER_SECOND,
  NO_EM_DASH_RULE,
  VOICE_DIRECTION,
  VOICE_SETTINGS,
} from "../src/vox/constants.js";
import { buildBeats, checkBeatCount, countWords } from "../src/vox/beats.js";
import { buildVoiceBatches } from "../src/vox/voiceBatches.js";
import { cleanModelText, stripEmDashes } from "../src/vox/sanitize.js";
import {
  assembleImagePrompts,
  buildThumbnailPrompt,
  serializePromptsFile,
  promptsFileName,
} from "../src/vox/promptBuilder.js";
import type { VoxBeat, VoxBatchJobStatus, VoxAssetJob } from "../src/vox/types.js";
import * as yapper from "./yapperClient.js";
import { renderVoxDocumentary, type VoxFitMode, type VoxRenderBeat } from "../voxRenderEngine.js";

/** Dépendances fournies par le serveur principal. */
export interface VoxDeps {
  /** Appelle le meilleur modèle de texte disponible et renvoie la réponse brute. */
  generateText(prompt: string, options?: { maxTokens?: number; json?: boolean }): Promise<string>;
  /** Synthétise un lot de narration via ElevenLabs. */
  generateSpeech(text: string, voiceId: string, settings: typeof VOICE_SETTINGS): Promise<Buffer>;
  /** Vrai si une clé ElevenLabs est configurée. */
  hasElevenLabs(): boolean;
}

/** Extrait le premier objet ou tableau JSON d'une réponse de modèle. */
function parseJsonResponse(raw: string): any {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();

  const firstBrace = text.search(/[[{]/);
  if (firstBrace === -1) throw new Error("Le modèle n'a renvoyé aucun JSON exploitable.");

  const opening = text[firstBrace];
  const closing = opening === "[" ? "]" : "}";
  const lastClose = text.lastIndexOf(closing);
  if (lastClose <= firstBrace) throw new Error("Le JSON renvoyé par le modèle est tronqué.");

  return JSON.parse(text.slice(firstBrace, lastClose + 1));
}

/** Travaux de génération Yapper en cours, sondés par le frontend. */
const voxJobs = new Map<string, VoxBatchJobStatus>();

/** Nombre de générations Yapper lancées en parallèle. */
const YAPPER_CONCURRENCY = 4;

export function createVoxRouter(deps: VoxDeps): express.Router {
  const router = express.Router();

  // -------------------------------------------------------------------------
  // Configuration et catalogue
  // -------------------------------------------------------------------------

  router.get("/config", (_req, res) => {
    res.json({
      hasYapper: yapper.isConfigured(),
      hasElevenLabs: deps.hasElevenLabs(),
      niches: NICHES,
      durations: DURATIONS,
      cliffhangerPatterns: CLIFFHANGER_PATTERNS,
      voiceDirection: VOICE_DIRECTION,
      universalVideoPrompt: UNIVERSAL_VIDEO_PROMPT,
      videoClipSeconds: VIDEO_CLIP_SECONDS,
    });
  });

  router.get("/credits", async (_req, res) => {
    try {
      res.json(await yapper.getCredits());
    } catch (error: any) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  router.get("/models", async (_req, res) => {
    try {
      const { data } = await yapper.listModels();
      // Seuls les modèles réellement lançables intéressent le moteur, et pour la
      // vidéo, seuls ceux qui acceptent une image de départ : le prompt vidéo
      // universel anime une image finale déjà générée.
      res.json({
        images: (data || []).filter((m: any) => m.type === "image-generation" && m.startable),
        videos: (data || []).filter(
          (m: any) =>
            m.type === "video-generation" &&
            m.startable &&
            m.capabilities?.supportsStartingFrame
        ),
      });
    } catch (error: any) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  // -------------------------------------------------------------------------
  // ÉTAT 2, dix idées
  // -------------------------------------------------------------------------

  router.post("/ideas", async (req, res) => {
    const { niche } = req.body || {};
    if (!niche) return res.status(400).json({ error: "La niche est requise." });

    const prompt = `Tu es un auteur de documentaires d'élite. Génère exactement 10 idées de vidéos dans la niche : ${niche}.

${NO_EM_DASH_RULE}

RÈGLES ABSOLUES :
1. Deux idées ne peuvent jamais occuper le même sous-territoire. Un seul braquage, une seule disparition, une seule fraude, une seule traque, et ainsi de suite.
2. Les titres sont déclaratifs ou interrogatifs, ponctuation légère, aucun putaclic. Utilise ces formes : ${TITLE_SHAPES.join(" / ")}
3. Chaque idée porte une accroche concrète : une date, un nom, un nombre ou un lieu qui la rend réelle.
4. Les titres sont en français, naturels, sans traduction littérale de l'anglais.
5. Les faits doivent être exacts. N'invente jamais un événement, un nom ou une date.

Réponds uniquement avec ce JSON, rien d'autre :
[{"title": "Le titre en français", "territory": "le sous-territoire en un ou deux mots", "hook": "la date, le nom, le nombre ou le lieu qui ancre l'idée"}]`;

    try {
      const raw = await deps.generateText(prompt, { maxTokens: 3000, json: true });
      const parsed = parseJsonResponse(raw);
      const list = Array.isArray(parsed) ? parsed : parsed.ideas || [];

      const ideas = list.slice(0, 10).map((item: any, i: number) => ({
        index: i + 1,
        title: cleanModelText(String(item.title || "")),
        territory: cleanModelText(String(item.territory || "")),
        hook: cleanModelText(String(item.hook || "")),
      }));

      if (ideas.length === 0) throw new Error("Le modèle n'a renvoyé aucune idée.");
      res.json({ ideas });
    } catch (error: any) {
      console.error("Vox, erreur de génération des idées :", error);
      res.status(500).json({ error: error.message || "Impossible de générer les idées." });
    }
  });

  // -------------------------------------------------------------------------
  // ÉTAT 4, script (style Fern)
  // -------------------------------------------------------------------------

  router.post("/script", async (req, res) => {
    const { topic, durationSeconds } = req.body || {};
    if (!topic) return res.status(400).json({ error: "Le sujet est requis." });

    const duration = DURATIONS.find((d) => d.seconds === Number(durationSeconds));
    if (!duration) {
      return res.status(400).json({
        error: `Durée non prise en charge. Valeurs possibles : ${DURATIONS.map((d) => d.label).join(", ")}.`,
      });
    }

    const patterns = CLIFFHANGER_PATTERNS.map(
      (p) => `${p.name} : ${p.rule} Exemple : « ${p.example} »`
    ).join("\n");

    const buildPrompt = (correction?: string) => `Tu es un auteur de documentaires d'élite. Écris le script de narration complet, en FRANÇAIS, pour le sujet : ${topic}

${NO_EM_DASH_RULE}

CIBLE DE LONGUEUR : environ ${duration.targetWords} mots pour ${duration.label} de narration, à 2,5 mots par seconde. Tu dois tomber à 5 pour cent près de ${duration.targetWords} mots.${correction ? `\n\nCORRECTION : ${correction}` : ""}

RÈGLES D'ÉCRITURE (ADN Fern), toutes obligatoires :
1. Narration continue uniquement. Un seul bloc de prose qui coule. Aucun intertitre, aucun label de chapitre, aucune indication de plan, aucune didascalie visuelle.
2. Ouverture à froid : les 3 à 4 premières phrases (environ 30 à 40 mots) s'ouvrent sur une date précise, un lieu nommé et une petite action concrète. Aucun raclement de gorge, aucun « imaginez », aucune question rhétorique. L'histoire commence à l'intérieur d'un moment. Forme visée : « Le 24 novembre 1971. Aéroport international de Portland. Un homme en costume sombre paie en liquide un aller simple pour Seattle. »
3. Ton calme, précis, documentaire. Surtout des phrases déclaratives courtes, avec une phrase explicative plus longue de temps en temps pour varier le rythme. Le narrateur ne commente jamais, ne s'exclame jamais, ne s'adresse jamais au spectateur. La tension naît de faits placés en séquence, pas d'adjectifs.
4. Les connecteurs temporels et causals portent le récit : puis, au matin, trois jours plus tard, en moins d'une heure, à cause de cela, ce qui signifiait, ce que personne ne savait.
5. Chaque phrase se termine par un point et porte exactement une idée, parce que chaque phrase devient un plan visuel. Une phrase qui ne peut pas être mise en image doit être réécrite.
6. Les faits restent exacts. Quand un détail est contesté, écris autour (« le FBI pensait que », « des témoins ont décrit ») plutôt que d'inventer. N'invente jamais un nom, une date ou un nombre.
7. Retenue absolue face aux drames réels : aucune horreur, aucun gros plan sur la souffrance, aucune moquerie des victimes. La tension vit dans les objets, les documents, les cartes, l'argent, la météo et le temps qui passe.
8. Aucun message de sponsor, aucun appel à s'abonner, aucune formule de fin.
9. Chute obligatoire. La dernière ligne fait 12 mots ou moins et se termine sur un nom commun, un nom propre, une date ou une courte déclarative. Utilise l'un de ces cinq motifs :
${patterns}

Réponds uniquement avec ce JSON, rien d'autre :
{"script": "le bloc de narration continu", "cliffhangerPattern": "le nom du motif de chute utilisé"}`;

    try {
      let scriptText = "";
      let pattern = "";
      let correction: string | undefined;

      // Le respect de la cible de mots est vérifié par le code : c'est une
      // contrainte arithmétique que les modèles ratent régulièrement, et un
      // script hors cible fausse ensuite tout le découpage en beats.
      for (let attempt = 0; attempt < 2; attempt++) {
        const raw = await deps.generateText(buildPrompt(correction), { maxTokens: 4000, json: true });
        const parsed = parseJsonResponse(raw);

        scriptText = stripEmDashes(String(parsed.script || "").trim());
        pattern = cleanModelText(String(parsed.cliffhangerPattern || ""));

        const words = countWords(scriptText);
        const drift = Math.abs(words - duration.targetWords) / duration.targetWords;
        if (drift <= WORD_COUNT_TOLERANCE) break;

        correction =
          `Ta version précédente faisait ${words} mots alors que la cible est ${duration.targetWords} mots. ` +
          `Réécris le script en le ${words > duration.targetWords ? "raccourcissant" : "allongeant"} ` +
          `pour tomber entre ${Math.round(duration.targetWords * (1 - WORD_COUNT_TOLERANCE))} et ` +
          `${Math.round(duration.targetWords * (1 + WORD_COUNT_TOLERANCE))} mots, sans rien perdre de la structure.`;
      }

      if (!scriptText) throw new Error("Le modèle n'a renvoyé aucun script.");

      const actualWords = countWords(scriptText);
      res.json({
        topic,
        text: scriptText,
        targetWords: duration.targetWords,
        actualWords,
        durationSeconds: duration.seconds,
        estimatedSeconds: Math.round((actualWords / WORDS_PER_SECOND) * 10) / 10,
        cliffhangerPattern: pattern,
        withinTolerance:
          Math.abs(actualWords - duration.targetWords) / duration.targetWords <= WORD_COUNT_TOLERANCE,
      });
    } catch (error: any) {
      console.error("Vox, erreur de génération du script :", error);
      res.status(500).json({ error: error.message || "Impossible de générer le script." });
    }
  });

  // -------------------------------------------------------------------------
  // ÉTAT 6, découpage en beats (calcul pur, aucun appel de modèle)
  // -------------------------------------------------------------------------

  router.post("/beats", (req, res) => {
    const { script, durationSeconds } = req.body || {};
    if (!script) return res.status(400).json({ error: "Le script est requis." });

    const beats = buildBeats(String(script));
    res.json({
      beats,
      sanity: checkBeatCount(beats.length, Number(durationSeconds)),
      voiceBatches: buildVoiceBatches(String(script)),
    });
  });

  // -------------------------------------------------------------------------
  // ÉTAT 7, un prompt d'image par beat
  // -------------------------------------------------------------------------

  /** Beats traités par appel de modèle, pour ne pas tronquer les longues sorties. */
  const SCENES_PER_CALL = 12;

  router.post("/image-prompts", async (req, res) => {
    const { topic, script, beats } = req.body || {};
    if (!Array.isArray(beats) || beats.length === 0) {
      return res.status(400).json({ error: "Les beats sont requis." });
    }

    const typedBeats = beats as VoxBeat[];

    const sharedRules = `${NO_EM_DASH_RULE}

Tu es directeur artistique éditorial et ingénieur du collage papier. Pour chaque beat de narration, tu écris la SCÈNE d'un prompt d'image, en ANGLAIS.

MÉTHODE (ne la restitue jamais dans la sortie) : pour chaque beat, trouve l'IDÉE centrale, pas les mots littéraux. Choisis le visuel documentaire le plus fort : un objet, un document, une carte, un fragment de frise chronologique, une silhouette en demi-teinte, un lieu. N'illustre jamais chaque mot. Mets l'idée en image.

LOI DE COMPOSITION :
${COMPOSITION_LAW.map((r) => `- ${r}`).join("\n")}

LOI DU TEXTE DANS L'IMAGE : ${TEXT_IN_IMAGE_LAW}

LOI DU SUJET RÉCURRENT : ${RECURRING_SUBJECT_LAW}

FORMAT DE LA SCÈNE : une seule coulée de prose anglaise décrivant la composition concrète. N'inclus JAMAIS le bloc de style ni le closer : ils sont ajoutés automatiquement par le programme. N'écris pas de numéro, pas de titre, pas de commentaire.

SUJET DE LA VIDÉO : ${topic || "documentaire"}

SCRIPT COMPLET, pour le contexte :
${script || ""}`;

    try {
      const scenes: string[] = [];
      let bible = "";

      for (let start = 0; start < typedBeats.length; start += SCENES_PER_CALL) {
        const chunk = typedBeats.slice(start, start + SCENES_PER_CALL);
        const list = chunk
          .map((b) => `Beat ${b.index} (${b.startSeconds}s) : « ${b.text} »`)
          .join("\n");

        const isFirst = start === 0;
        const prompt = `${sharedRules}
${bible ? `\nBIBLE VISUELLE déjà fixée, réutilise ces formulations MOT POUR MOT dès qu'un de ces sujets réapparaît :\n${bible}\n` : ""}
Écris la scène de chacun de ces ${chunk.length} beats :
${list}

Réponds uniquement avec ce JSON, rien d'autre :
${
  isFirst
    ? `{"bible": ["sujet récurrent 1 : sa description anglaise verrouillée", "..."], "scenes": [{"beat": ${chunk[0].index}, "scene": "the english scene prose"}]}`
    : `{"scenes": [{"beat": ${chunk[0].index}, "scene": "the english scene prose"}]}`
}`;

        const raw = await deps.generateText(prompt, { maxTokens: 8000, json: true });
        const parsed = parseJsonResponse(raw);

        if (isFirst && Array.isArray(parsed.bible)) {
          bible = parsed.bible.map((line: any) => `- ${String(line)}`).join("\n");
        }

        const returned: any[] = Array.isArray(parsed.scenes) ? parsed.scenes : [];

        // On réaligne sur l'index du beat plutôt que sur l'ordre du tableau :
        // un modèle qui saute ou double une entrée décalerait sinon toutes les
        // images suivantes d'un cran.
        for (const beat of chunk) {
          const match = returned.find((s) => Number(s.beat) === beat.index);
          scenes.push(cleanModelText(String(match?.scene || "")));
        }
      }

      const missing = scenes.filter((s) => !s).length;
      const prompts = assembleImagePrompts(typedBeats, scenes);

      res.json({
        prompts,
        missing,
        fileName: promptsFileName(topic || "sujet"),
        fileContent: serializePromptsFile(prompts),
      });
    } catch (error: any) {
      console.error("Vox, erreur de génération des prompts d'images :", error);
      res.status(500).json({ error: error.message || "Impossible de générer les prompts d'images." });
    }
  });

  // -------------------------------------------------------------------------
  // ÉTAT 8, prompt vidéo universel
  // -------------------------------------------------------------------------

  router.get("/video-prompt", (_req, res) => {
    res.json({ prompt: UNIVERSAL_VIDEO_PROMPT, clipSeconds: VIDEO_CLIP_SECONDS });
  });

  // -------------------------------------------------------------------------
  // ÉTAT 9, prompts de vignettes
  // -------------------------------------------------------------------------

  router.post("/thumbnails", async (req, res) => {
    const { topic, script } = req.body || {};

    const prompt = `${NO_EM_DASH_RULE}

Tu es directeur artistique. Produis ${THUMBNAIL_COUNT} propositions de vignettes YouTube pour cette vidéo documentaire.

SUJET : ${topic || "documentaire"}
SCRIPT : ${script || ""}

Les vignettes vivent dans le même univers de collage sur papier journal que la vidéo, mais poussé plus fort : typographie plus grosse, rouge plus vif, contraste plus dur, lisible à 200 pixels de large.

LOIS DES VIGNETTES :
${THUMBNAIL_LAWS.map((r) => `- ${r}`).join("\n")}

Les mots affichés sont en FRANÇAIS, tout en capitales, 3 mots maximum par élément, 2 éléments de texte maximum. Exemples de registre : ${THUMBNAIL_WORD_EXAMPLES.join(", ")}. Choisis des mots tirés de l'accroche réelle de cette vidéo.

La SCÈNE est écrite en ANGLAIS, en une seule coulée de prose, en suivant ce gabarit : un sujet héros dominant en demi-teinte noir et blanc à bords découpés aux ciseaux avec un trait d'accent rouge décalé, un bandeau de censure si une personne est suggérée, posé sur du papier journal vieilli déchiré qui déborde du cadre, un titre en capitales condensées sur une bande arrachée, une seconde étiquette plus petite en boîte de tampon, un cerclage ou soulignement rouge au marqueur autour de l'élément clé, palette tan et encre avec accents rouge vif et moutarde, contraste extrême.

N'inclus JAMAIS le bloc de style ni le closer : ils sont ajoutés par le programme.

Réponds uniquement avec ce JSON, rien d'autre :
{"thumbnails": [{"scene": "the english scene prose", "words": ["MOT", "AUTRE MOT"]}]}`;

    try {
      const raw = await deps.generateText(prompt, { maxTokens: 4000, json: true });
      const parsed = parseJsonResponse(raw);
      const list: any[] = Array.isArray(parsed) ? parsed : parsed.thumbnails || [];

      const thumbnails = list.slice(0, THUMBNAIL_COUNT).map((item: any, i: number) => {
        const scene = cleanModelText(String(item.scene || ""));
        return {
          index: i + 1,
          scene,
          fullPrompt: buildThumbnailPrompt(scene),
          words: Array.isArray(item.words)
            ? item.words.slice(0, 2).map((w: any) => cleanModelText(String(w)).toUpperCase())
            : [],
        };
      });

      if (thumbnails.length === 0) throw new Error("Le modèle n'a renvoyé aucune vignette.");
      res.json({ thumbnails });
    } catch (error: any) {
      console.error("Vox, erreur de génération des vignettes :", error);
      res.status(500).json({ error: error.message || "Impossible de générer les vignettes." });
    }
  });

  // -------------------------------------------------------------------------
  // ÉTAT 5, voix off ElevenLabs
  // -------------------------------------------------------------------------

  router.post("/voice-batches", (req, res) => {
    const { script } = req.body || {};
    if (!script) return res.status(400).json({ error: "Le script est requis." });
    res.json({ batches: buildVoiceBatches(String(script)), direction: VOICE_DIRECTION });
  });

  /**
   * Génère un lot de voix off. Le frontend appelle cette route une fois par lot
   * et peut la rappeler pour produire 2 à 5 prises du même lot, comme l'exigent
   * les règles de production.
   */
  router.post("/voiceover", async (req, res) => {
    const { text, voiceId } = req.body || {};
    if (!text) return res.status(400).json({ error: "Le texte du lot est requis." });
    if (!voiceId) return res.status(400).json({ error: "L'identifiant de voix ElevenLabs est requis." });

    if (!deps.hasElevenLabs()) {
      // Repli documenté par le matériau source : sans outil ElevenLabs, on rend
      // le texte prêt à coller dans l'interface, accompagné de ses réglages.
      return res.status(400).json({
        error: "ELEVENLABS_API_KEY n'est pas configurée.",
        fallback: {
          text: stripEmDashes(String(text)),
          direction: VOICE_DIRECTION,
          settings: VOICE_SETTINGS,
        },
      });
    }

    try {
      const buffer = await deps.generateSpeech(stripEmDashes(String(text)), String(voiceId), VOICE_SETTINGS);
      res.json({ audio: buffer.toString("base64"), mimeType: "audio/mpeg" });
    } catch (error: any) {
      console.error("Vox, erreur de génération de la voix off :", error);
      res.status(500).json({ error: error.message || "Impossible de générer la voix off." });
    }
  });

  // -------------------------------------------------------------------------
  // Génération Yapper, images et vidéos
  // -------------------------------------------------------------------------

  /** Construit l'entrée Yapper d'une image de beat. */
  function imageInput(prompt: string, resolution: string) {
    return { prompt, aspectRatio: "16:9", imageResolution: resolution };
  }

  /** Construit l'entrée Yapper d'un clip animé à partir de son image finale. */
  function videoInput(imageUrl: string, resolution: number) {
    return {
      prompt: UNIVERSAL_VIDEO_PROMPT,
      videoLength: VIDEO_CLIP_SECONDS,
      aspectRatio: "16:9",
      resolution,
      startingFrameImageUrl: imageUrl,
    };
  }

  /**
   * Chiffre un lot complet sans rien dépenser.
   *
   * Une seule génération est chiffrée puis multipliée par le nombre d'éléments :
   * tous les éléments d'un lot partagent le même modèle et le même format, donc
   * le coût unitaire est identique, et chiffrer 150 beats un par un ferait 150
   * appels pour une information déjà connue au premier.
   */
  router.post("/generate/estimate", async (req, res) => {
    const { kind, model, count, resolution } = req.body || {};
    if (kind !== "images" && kind !== "videos") {
      return res.status(400).json({ error: "Le type de génération doit être « images » ou « videos »." });
    }
    if (!model) return res.status(400).json({ error: "Le modèle est requis." });

    const items = Math.max(1, Number(count) || 1);

    try {
      const estimate = await yapper.estimateProcess(
        kind === "images"
          ? {
              type: "image-generation",
              model,
              input: imageInput("estimation", String(resolution || "1080")),
            }
          : {
              type: "video-generation",
              model,
              input: videoInput("https://example.com/frame.png", Number(resolution) || 720),
            }
      );

      const credits = await yapper.getCredits().catch(() => null);

      res.json({
        perItem: estimate.creditsEstimated,
        count: items,
        total: estimate.creditsEstimated * items,
        canStart: estimate.canStart,
        estimatedCompletionSeconds: estimate.estimatedCompletionSeconds,
        available: credits?.availableCredits ?? estimate.credits?.available ?? null,
      });
    } catch (error: any) {
      console.error("Vox, erreur d'estimation Yapper :", error);
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  /**
   * Lance un lot de générations Yapper en tâche de fond.
   *
   * La réponse est immédiate : le frontend sonde ensuite l'avancement, comme le
   * fait déjà le rendu ffmpeg du studio.
   */
  router.post("/generate/start", async (req, res) => {
    const { kind, model, items, resolution, idempotencyPrefix } = req.body || {};

    if (kind !== "images" && kind !== "videos") {
      return res.status(400).json({ error: "Le type de génération doit être « images » ou « videos »." });
    }
    if (!model) return res.status(400).json({ error: "Le modèle est requis." });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Aucun élément à générer." });
    }

    if (!yapper.isConfigured()) {
      return res.status(400).json({
        error:
          "YAPPER_API_KEY n'est pas configurée. Ajoutez votre clé d'API Yapper pour générer les images et les vidéos.",
      });
    }

    const jobId = `vox-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const prefix = String(idempotencyPrefix || jobId);

    const jobItems: VoxAssetJob[] = items.map((item: any) => ({
      beatIndex: Number(item.beatIndex),
      processId: null,
      state: "pending",
      url: null,
      error: null,
    }));

    const status: VoxBatchJobStatus = {
      jobId,
      kind,
      state: "running",
      total: jobItems.length,
      completed: 0,
      failed: 0,
      creditsEstimated: 0,
      items: jobItems,
    };
    voxJobs.set(jobId, status);

    res.json({ jobId, total: jobItems.length });

    // Fond de tâche : la file est consommée par un petit pool de travailleurs,
    // pour ne pas ouvrir 150 générations simultanées chez Yapper.
    (async () => {
      let cursor = 0;

      const worker = async () => {
        for (;;) {
          const index = cursor++;
          if (index >= items.length) return;

          const item = items[index];
          const jobItem = status.items[index];
          jobItem.state = "running";

          try {
            const input =
              kind === "images"
                ? imageInput(String(item.prompt), String(resolution || "1080"))
                : videoInput(String(item.imageUrl), Number(resolution) || 720);

            if (kind === "videos" && !item.imageUrl) {
              throw new Error("Aucune image de départ : générez d'abord l'image de ce beat.");
            }

            const started = await yapper.startProcess({
              type: kind === "images" ? "image-generation" : "video-generation",
              model,
              input,
              // La clé d'idempotence est stable par beat : un renvoi après
              // coupure réseau retombe sur la même génération au lieu d'en
              // facturer une seconde.
              idempotencyKey: `${prefix}-${jobItem.beatIndex}`,
              metadata: { voxJobId: jobId, beatIndex: jobItem.beatIndex },
            });

            jobItem.processId = started.id;

            const finished = await yapper.waitForProcess(started.id);

            if (finished.status === "completed") {
              const url = yapper.extractOutputUrl(finished);
              if (!url) throw new Error("Yapper n'a renvoyé aucune URL de média pour cette génération.");
              jobItem.url = url;
              jobItem.state = "done";
              status.completed++;
            } else {
              throw new Error(finished.error || `Génération terminée avec l'état « ${finished.status} ».`);
            }
          } catch (error: any) {
            jobItem.state = "error";
            jobItem.error = error.message || "Échec de la génération.";
            status.failed++;
            console.error(`Vox, échec du beat ${jobItem.beatIndex} :`, error.message || error);
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(YAPPER_CONCURRENCY, items.length) }, () => worker())
      );

      status.state = status.failed === status.total ? "error" : "done";
      if (status.state === "error") {
        status.error = "Toutes les générations de ce lot ont échoué.";
      }
    })();
  });

  router.get("/generate/status/:jobId", (req, res) => {
    const job = voxJobs.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Tâche de génération introuvable (peut-être expirée)." });
    }
    res.json(job);
  });

  // -------------------------------------------------------------------------
  // Montage final ffmpeg
  // -------------------------------------------------------------------------

  interface VoxRenderJobStatus {
    status: "processing" | "done" | "error";
    progress: number;
    label: string;
    downloadUrl?: string;
    durationSeconds?: number;
    error?: string;
  }

  const renderJobs = new Map<string, VoxRenderJobStatus>();

  router.post("/render/start", (req, res) => {
    const {
      topic,
      beats: rawBeats,
      voiceBatches: rawVoice,
      fitMode = "assemblage",
      asmrVolume = 0.25,
      burnSubtitles = false,
    } = req.body || {};

    if (!Array.isArray(rawBeats) || rawBeats.length === 0) {
      return res.status(400).json({ error: "Aucun beat à monter." });
    }

    const beats: VoxRenderBeat[] = rawBeats.map((b: any) => ({
      index: Number(b.index),
      text: String(b.text || ""),
      wordCount: Number(b.wordCount) || 1,
      clipUrl: b.clipUrl || null,
      imageUrl: b.imageUrl || null,
    }));

    if (!beats.some((b) => b.clipUrl || b.imageUrl)) {
      return res.status(400).json({
        error: "Aucun beat ne dispose d'un clip ou d'une image. Générez les visuels avant le montage.",
      });
    }

    const voiceBatches = (Array.isArray(rawVoice) ? rawVoice : [])
      .filter((b: any) => b?.audioDataUri)
      .map((b: any) => ({ wordCount: Number(b.wordCount) || 1, audioDataUri: String(b.audioDataUri) }));

    const jobId = `vox-render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    renderJobs.set(jobId, { status: "processing", progress: 0, label: "Initialisation du montage..." });

    res.json({ jobId, hasNarration: voiceBatches.length > 0 });

    (async () => {
      try {
        const result = await renderVoxDocumentary(
          jobId,
          String(topic || "documentaire"),
          {
            beats,
            voiceBatches,
            fitMode: fitMode as VoxFitMode,
            asmrVolume: Number(asmrVolume) || 0,
            burnSubtitles: !!burnSubtitles,
          },
          (progress, label) => renderJobs.set(jobId, { status: "processing", progress, label })
        );

        renderJobs.set(jobId, {
          status: "done",
          progress: 100,
          label: "Montage terminé.",
          downloadUrl: result.outputUrl,
          durationSeconds: result.durationSeconds,
        });
      } catch (error: any) {
        console.error("Vox, erreur de montage :", error);
        renderJobs.set(jobId, {
          status: "error",
          progress: 0,
          label: "Erreur",
          error:
            error.message ||
            "Le montage a échoué. Vérifiez que ffmpeg et ffprobe sont installés et accessibles dans le PATH du serveur.",
        });
      }
    })();
  });

  router.get("/render/status/:jobId", (req, res) => {
    const job = renderJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Montage introuvable (peut-être expiré)." });
    res.json(job);
  });

  // -------------------------------------------------------------------------
  // Export du fichier .txt de prompts
  // -------------------------------------------------------------------------

  router.post("/prompts-file", (req, res) => {
    const { topic, prompts } = req.body || {};
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: "Aucun prompt à exporter." });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${promptsFileName(topic || "sujet")}"`);
    res.send(serializePromptsFile(prompts));
  });

  return router;
}

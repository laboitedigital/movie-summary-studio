import express from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { FALLBACK_CATALOG } from "./src/fallbackCatalog.js";
import { renderMovieSummary, RENDER_ROOT, cleanupOldJobs, RenderSegmentInput } from "./renderEngine.js";

dotenv.config();

// Nettoie les anciens rendus au démarrage du serveur
cleanupOldJobs();

// --- Official trailer clip extraction (via yt-dlp) ---
const TRAILER_CLIPS_ROOT = path.join(process.cwd(), "trailer-clips");
if (!fs.existsSync(TRAILER_CLIPS_ROOT)) fs.mkdirSync(TRAILER_CLIPS_ROOT, { recursive: true });

function cleanupOldTrailerClips(maxAgeMs = 24 * 60 * 60 * 1000) {
  if (!fs.existsSync(TRAILER_CLIPS_ROOT)) return;
  const now = Date.now();
  for (const entry of fs.readdirSync(TRAILER_CLIPS_ROOT)) {
    const fullPath = path.join(TRAILER_CLIPS_ROOT, entry);
    try {
      if (now - fs.statSync(fullPath).mtimeMs > maxAgeMs) fs.rmSync(fullPath, { force: true });
    } catch {
      // ignore
    }
  }
}
cleanupOldTrailerClips();

function runCapture(cmd: string, args: string[], timeoutMs = 30000): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`${cmd} a dépassé le délai maximal (${timeoutMs}ms)`));
    }, timeoutMs);
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} a échoué (code ${code}): ${stderr.slice(-1200) || stdout.slice(-1200)}`));
    });
  });
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Lazy initialize Anthropic Client
let anthropicClient: Anthropic | null = null;
let lastUsedKey: string | null = null;

function getAnthropicClient() {
  const rawKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!rawKey) {
    throw new Error("La clé d'API Claude (CLAUDE_API_KEY) n'est pas configurée. Veuillez l'ajouter dans l'onglet Paramètres/Secrets.");
  }
  // Strip quotes if they were pasted accidentally
  const key = rawKey.replace(/^["']|["']$/g, "").trim();
  if (!anthropicClient || lastUsedKey !== key) {
    anthropicClient = new Anthropic({ apiKey: key });
    lastUsedKey = key;
  }
  return anthropicClient;
}

// Robust fallback runner to support keys with varying tier permissions
async function createClaudeMessageWithFallback(client: Anthropic, messages: any[], maxTokens = 8192) {
  const models = [
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
    "claude-3-7-sonnet-latest",
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-latest",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-5-haiku-latest",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-latest",
    "claude-3-haiku-20240307"
  ];

  // claude-3-haiku-20240307 (very last resort fallback) caps output at 4096 tokens.
  const MAX_TOKENS_LEGACY_CAP = 4096;

  let lastError: any = null;
  let allFailedWith404 = true;
  for (const model of models) {
    try {
      console.log(`Trying Claude model: ${model}`);
      const message = await client.messages.create({
        model: model,
        max_tokens: model === "claude-3-haiku-20240307" ? Math.min(maxTokens, MAX_TOKENS_LEGACY_CAP) : maxTokens,
        messages: messages,
      });
      console.log(`Success with Claude model: ${model}`);
      return message;
    } catch (err: any) {
      console.error(`Failed with Claude model ${model}:`, err.message || err);
      lastError = err;
      
      const errStr = String(err.message || "").toLowerCase();
      const is404 = err.status === 404 || err.statusCode === 404 || errStr.includes("not_found") || errStr.includes("not found");
      
      if (!is404) {
        allFailedWith404 = false;
      }

      if (
        is404 || 
        errStr.includes("model") || 
        errStr.includes("unsupported") ||
        err.status === 400
      ) {
        continue;
      }
      throw err;
    }
  }

  if (allFailedWith404) {
    throw new Error(
      "Votre clé d'API Claude est bien configurée, mais Anthropic renvoie une erreur 404 (Modèle non trouvé). " +
      "Cela signifie généralement que votre compte Anthropic n'a aucun crédit disponible (solde à 0$) ou que votre clé n'est pas active. " +
      "Veuillez vous connecter sur https://console.anthropic.com/, aller dans la section 'Billing' (Facturation) et ajouter un solde de crédit (minimum 5$). En attendant, l'application bascule automatiquement sur Gemini."
    );
  }

  throw lastError || new Error("Aucun modèle Claude n'est disponible avec la clé d'API fournie.");
}

// Robust wrapper for Gemini calls with retry & exponential backoff & model fallbacks
async function callGeminiWithRetry(
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  fallbackModels: string[] = [],
  maxRetries = 3
) {
  const allModels = [params.model, ...fallbackModels];
  let lastError: any = null;

  for (const model of allModels) {
    let attempt = 0;
    let delay = 1000;
    while (attempt < maxRetries) {
      try {
        console.log(`Calling Gemini with model ${model} (attempt ${attempt + 1}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini call failed with model ${model} (attempt ${attempt + 1}):`, err.message || err);
        
        // If it's a 400 bad request (e.g., config error), don't retry, just fail or try next model
        if (err.status === 400 || err.statusCode === 400) {
          break;
        }

        attempt++;
        if (attempt < maxRetries) {
          console.log(`Waiting ${delay}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }
  }
  throw lastError || new Error(`Gemini generation failed for models: ${allModels.join(", ")}`);
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Config Route to detect key existence
app.get("/api/config", (req, res) => {
  res.json({
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasClaude: !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY),
    hasClipCafe: !!(process.env.CLIP_CAFE_API_KEY || process.env.SCRAPESTACK_API_KEY),
    hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
  });
});

// Simple in-memory cache for the ElevenLabs voice list (avoids hammering their API)
let elevenLabsVoicesCache: { fetchedAt: number; voices: any[] } | null = null;
const ELEVENLABS_VOICES_CACHE_TTL_MS = 60 * 60 * 1000; // 1h

app.get("/api/tts/elevenlabs-voices", async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: "ELEVENLABS_API_KEY n'est pas configurée." });
  }

  try {
    if (elevenLabsVoicesCache && Date.now() - elevenLabsVoicesCache.fetchedAt < ELEVENLABS_VOICES_CACHE_TTL_MS) {
      return res.json({ voices: elevenLabsVoicesCache.voices });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs a renvoyé une erreur (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const voices = (data.voices || []).map((v: any) => ({
      id: v.voice_id,
      label: `${v.name}${v.labels?.accent ? ` (${v.labels.accent})` : ""}${v.labels?.description ? ` — ${v.labels.description}` : ""}`,
    }));

    elevenLabsVoicesCache = { fetchedAt: Date.now(), voices };
    res.json({ voices });
  } catch (error: any) {
    console.error("Erreur récupération voix ElevenLabs :", error);
    res.status(500).json({ error: error.message || "Impossible de récupérer les voix ElevenLabs." });
  }
});

/**
 * Generate narration audio via ElevenLabs (returns raw mp3 Buffer)
 */
async function callElevenLabsTTS(text: string, voiceId: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY n'est pas configurée.");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs TTS a échoué (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Route to fetch YouTube metadata
app.get("/api/youtube/metadata", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "L'URL est requise." });
  }

  const videoId = extractYoutubeId(url);
  if (!videoId) {
    return res.status(400).json({ error: "L'URL fournie n'est pas un lien YouTube valide." });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return res.json({
        videoId,
        title: data.title,
        author: data.author_name,
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      });
    }
  } catch (err) {
    console.error("Error fetching YouTube oEmbed:", err);
  }

  // Fallback
  res.json({
    videoId,
    title: `Vidéo YouTube (${videoId})`,
    author: "YouTube Reference",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  });
});

/**
 * Generate Movie Summary Script using Gemini or Claude
 */
/**
 * Attempts to salvage a valid JSON object out of a truncated response (e.g. the model ran
 * out of output tokens mid-array). Walks the text respecting string boundaries (so braces
 * inside narration text don't confuse it), finds the last fully-closed structure, trims
 * everything after it, then closes any remaining open braces/brackets. This means a script
 * that got cut off after segment 6 of 8 still returns a valid result with 6 complete segments
 * instead of failing outright.
 */
function salvageTruncatedJson(text: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  let lastSafeCloseIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      stack.pop();
      lastSafeCloseIndex = i;
    }
  }

  if (lastSafeCloseIndex === -1) return text;

  let salvaged = text.slice(0, lastSafeCloseIndex + 1);

  // Re-walk the salvaged slice to find any still-unclosed braces/brackets and close them.
  const remainingStack: string[] = [];
  inString = false;
  escape = false;
  for (let i = 0; i < salvaged.length; i++) {
    const ch = salvaged[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") remainingStack.push(ch);
    else if (ch === "}" || ch === "]") remainingStack.pop();
  }
  while (remainingStack.length) {
    const open = remainingStack.pop();
    salvaged += open === "{" ? "}" : "]";
  }

  return salvaged;
}

/**
 * Parses a model's JSON response, falling back to salvageTruncatedJson if the raw text
 * doesn't parse as-is (most commonly because generation was cut off by the token budget).
 */
function parseScriptJsonWithSalvage(rawText: string): any {
  try {
    return JSON.parse(rawText);
  } catch (firstError) {
    const salvaged = salvageTruncatedJson(rawText);
    try {
      const data = JSON.parse(salvaged);
      console.warn("JSON tronqué récupéré partiellement (segments incomplets en fin de réponse ignorés).");
      return data;
    } catch {
      throw firstError; // salvage didn't help; surface the original error
    }
  }
}

/**
 * Splits narration text into `numChunks` roughly equal word-count pieces.
 */
function splitNarrationIntoChunks(text: string, numChunks: number): string[] {
  const words = (text || "").split(/\s+/).filter(Boolean);
  if (numChunks <= 1 || words.length <= numChunks) return [text];
  const chunkSize = Math.ceil(words.length / numChunks);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

/**
 * Safety net: the AI is asked to split long segments into ~7s "beats" (so multiple short
 * clips can be used instead of looping one), but it doesn't always comply, especially for
 * longer narrations. This guarantees a minimum beat count per segment by evenly re-splitting
 * the narration text whenever the AI under-delivered, so the editing UI always has enough
 * beats to fill the segment's actual spoken duration.
 */
function ensureMinimumBeats(data: any): any {
  if (!data?.segments || !Array.isArray(data.segments)) return data;

  data.segments = data.segments.map((seg: any) => {
    if (seg.useReferenceImage) return seg; // image segments don't need multi-clip beats

    const wordCount = (seg.narration || "").split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.max(3, wordCount / 2.2); // ~2.2 words/sec spoken French narration
    const minBeats = Math.max(1, Math.ceil(estimatedDuration / 7));
    const beats = Array.isArray(seg.beats) ? seg.beats : [];

    if (beats.length === 0 || beats.length >= minBeats) return seg;

    console.warn(`Segment "${seg.title}" : ${beats.length} beat(s) fourni(s) pour ~${Math.round(estimatedDuration)}s estimées — re-découpage automatique en ${minBeats} beats.`);
    const chunks = splitNarrationIntoChunks(seg.narration || "", minBeats);
    const newBeats = chunks.map((chunk: string) => ({
      text: chunk,
      suggestedSearch: beats[0]?.suggestedSearch || seg.suggestedSearch || "",
    }));
    return { ...seg, beats: newBeats };
  });

  return data;
}

app.post("/api/gemini/generate-script", async (req, res) => {
  const { movieTitle, customInstructions, language = "French", provider = "gemini", referenceUrls = [], targetDurationMinutes = 10 } = req.body;

  if (!movieTitle) {
    return res.status(400).json({ error: "Le titre du film est requis." });
  }

  try {
    let referenceSection = "";
    const referenceImagesMapping: string[] = [];

    if (referenceUrls && Array.isArray(referenceUrls) && referenceUrls.length > 0) {
      referenceSection = `\nL'utilisateur a fourni les vidéos de référence YouTube suivantes pour s'en inspirer fortement (style, hook, structure, rythme, niveau de détail) :\n`;
      for (const url of referenceUrls) {
        const videoId = extractYoutubeId(url);
        if (videoId) {
          const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          referenceImagesMapping.push(thumb);
          referenceSection += `- URL : ${url} (ID de la vidéo : ${videoId}, Image miniature : ${thumb})\n`;
        }
      }
      
      referenceSection += `\nCONSIGNES SUR LES RÉFÉRENCES :
1. Analyse le style de narration, le hook d'introduction (accroche), le rythme, la structure ET le niveau de détail typique de ce genre de vidéos de référence, et applique ce "mélange" au nouveau script pour "${movieTitle}". Imagine la moyenne du format de ces vidéos de référence (longueur des phrases, densité d'information, ton) plutôt que de copier une seule d'entre elles.
2. Pour chaque segment, détermine s'il est préférable d'utiliser un extrait du film OU s'il s'agit d'une section d'illustration/conceptuelle générale (ex: l'introduction face caméra, une explication théorique, la conclusion/outro) où il vaut mieux afficher une image/scène d'illustration non-film issue des vidéos de référence.
3. Si le segment doit utiliser une image d'illustration non-film, mets "useReferenceImage" à true et choisis une URL d'image miniature parmi celles-ci : [${referenceImagesMapping.map(img => `"${img}"`).join(", ")}] pour le champ "referenceImage". Explique brièvement la raison dans "referenceImageReason" (ex: "Idéal pour introduire le résumé en montrant l'analyseur face caméra").
4. Si le segment doit utiliser un extrait du film, mets "useReferenceImage" à false, "referenceImage" à null et "referenceImageReason" à null.`;
    }

    // A narrator speaks roughly 130-150 words per minute. We size the script accordingly.
    const safeMinutes = Math.max(10, Math.min(20, Number(targetDurationMinutes) || 10));
    const targetWordCount = Math.round(safeMinutes * 140);
    const targetSegmentCount = Math.max(6, Math.min(20, Math.round(safeMinutes * 1.6)));
    const wordsPerSegment = Math.round(targetWordCount / targetSegmentCount);

    const prompt = `Crée un script de résumé de film complet et détaillé pour YouTube pour le film "${movieTitle}".
Langue du script : ${language}.
Directives supplémentaires : ${customInstructions || "Aucune"}.${referenceSection}

EXIGENCE DE LONGUEUR (TRÈS IMPORTANT, ne la sous-estime pas) :
Le script doit représenter environ ${safeMinutes} minutes de narration audio au total, soit environ ${targetWordCount} mots de narration cumulés sur l'ensemble des segments. C'est un résumé COMPLET et DÉTAILLÉ de l'intrigue du film (introduction, mise en place, péripéties multiples, rebondissements, climax, résolution, conclusion) — pas un teaser de 30 secondes. Ne résume pas le film en 4-5 phrases au total : raconte vraiment l'histoire avec ses détails et ses moments clés.

Structure le script en environ ${targetSegmentCount} segments couvrant les étapes de l'histoire (introduction/hook, mise en place des personnages et du contexte, déclencheur, plusieurs péripéties/rebondissements détaillés au fil de l'intrigue, climax, résolution, conclusion/outro/avis).
Pour chaque segment, la narration doit faire environ ${wordsPerSegment} mots (${Math.max(3, Math.round(wordsPerSegment / 18))}-${Math.max(4, Math.round(wordsPerSegment / 12))} phrases) — développe vraiment chaque moment, donne du contexte, des détails, des répliques ou des descriptions marquantes, pas juste une phrase générique.

Pour chaque segment, fournis :
1. Un titre court du segment (ex: "Introduction", "L'Inception")
2. La narration textuelle détaillée que le présentateur va lire (voir longueur ci-dessus), dynamique et captivante pour YouTube
3. Un terme de recherche global pour Clip.Cafe (suggestedSearch) qui résume le segment (utilisé en repli).
4. DÉCOUPAGE EN "BEATS" (RÈGLE OBLIGATOIRE, pas une suggestion) : découpe la narration de CE segment en plusieurs "beats" courts d'environ 5 à 8 secondes de lecture chacun (environ 12-20 mots par beat — souvent une ou deux phrases). C'EST UNE RÈGLE STRICTE : le nombre de beats doit être calculé ainsi : prends la durée estimée du segment en secondes (à partir du nombre de mots de la narration, ~2.2 mots/seconde de lecture) et DIVISE-LA par 7. Le nombre de beats doit être AU MOINS ce résultat (arrondi vers le haut), jamais moins. Par exemple, un segment de narration qui dure environ 40 secondes à l'oral DOIT avoir au moins 6 beats (40/7 ≈ 5.7 → arrondi à 6), PAS un seul beat. Ne produis JAMAIS un seul beat pour un segment de narration longue — c'est une erreur si tu le fais.
   Pour chaque beat, fournis :
   - "text" : la portion exacte de la narration correspondant à ce beat (ces portions mises bout à bout doivent reconstituer exactement le texte complet de "narration")
   - "suggestedSearch" : un terme de recherche Clip.Cafe PRÉCIS et DIFFÉRENT pour CE beat spécifique, en anglais, correspondant à une réplique, un lieu, un personnage ou une action évoquée dans ce beat précis (pas juste un terme générique répété pour tout le segment). Par exemple, pour la narration "Imaginez une planète poubelle, peuplée de bandits psychotiques... Bienvenue sur Pandora, le décor du film Borderlands, sorti en 2024...", le premier beat pourrait avoir suggestedSearch "Pandora wasteland" et le second "Borderlands Pandora planet establishing shot".
   Un segment de ${wordsPerSegment} mots doit ainsi avoir environ ${Math.max(2, Math.round(wordsPerSegment / 16))} à ${Math.max(3, Math.round(wordsPerSegment / 12))} beats, pour permettre d'utiliser plusieurs extraits vidéo courts (~7 secondes chacun) au lieu d'un seul extrait qui boucle pendant tout le segment.
5. Les informations d'image de référence si applicables (useReferenceImage, referenceImage, referenceImageReason).

Fais en sorte de renvoyer le résultat strictly en format JSON correspondant au schéma suivant :
RÈGLE JSON CRITIQUE : n'utilise JAMAIS de guillemets doubles (") à l'intérieur des valeurs de texte (narration, text, suggestedSearch, title), même pour citer une réplique du film — cela casse le format JSON. Si tu cites une réplique, n'utilise aucun guillemet autour, ou des guillemets simples (') uniquement. Exemple correct : "narration": "Il répond simplement : je reviendrai." Exemple INCORRECT à ne jamais faire : "narration": "Il répond : "je reviendrai"."
{
  "movieTitle": "${movieTitle}",
  "segments": [
    {
      "title": "Titre du segment",
      "narration": "Texte de la narration détaillée",
      "suggestedSearch": "terme de recherche Clip.Cafe global en anglais",
      "beats": [
        { "text": "Portion 1 de la narration...", "suggestedSearch": "terme de recherche précis en anglais pour cette portion" },
        { "text": "Portion 2 de la narration...", "suggestedSearch": "autre terme de recherche précis en anglais" }
      ],
      "useReferenceImage": false,
      "referenceImage": null,
      "referenceImageReason": null
    }
  ]
}`;

    if (provider === "claude") {
      try {
        const client = getAnthropicClient();
        // Scale the output token budget with the requested script length, otherwise long
        // scripts (10-20 min) get cut off mid-JSON and fail to parse. The "beats" breakdown
        // roughly duplicates narration text plus adds per-beat search terms, hence the higher multiplier.
        // Scale the output token budget with the requested script length, otherwise long
        // scripts (10-20 min) get cut off mid-JSON and fail to parse. The "beats" breakdown
        // roughly duplicates narration text plus adds per-beat search terms, hence the higher multiplier.
        const scriptMaxTokens = Math.min(32000, Math.max(12000, Math.round(targetWordCount * 5)));
        const basePrompt = prompt + "\nRespond strictly with only the JSON object and nothing else. Ensure there is no markdown code blocks in your response.";

        let data: any = null;
        let lastParseError: any = null;

        // Try up to 2 times: if the first response has invalid JSON (most commonly caused by
        // an unescaped double-quote inside a narration/dialogue snippet), retry once with the
        // exact parse error fed back so the model can self-correct.
        for (let attempt = 0; attempt < 2; attempt++) {
          const messages = attempt === 0
            ? [{ role: "user", content: basePrompt }]
            : [
                { role: "user", content: basePrompt },
                {
                  role: "user",
                  content: `Ta réponse précédente contenait du JSON invalide et n'a pas pu être analysée (erreur : "${lastParseError?.message}"). Renvoie l'objet JSON complet à nouveau, en corrigeant cette erreur — vérifie particulièrement qu'aucune valeur de texte ne contient de guillemets doubles (") non échappés. Réponds uniquement avec le JSON corrigé, rien d'autre.`
                }
              ];

          const message = await createClaudeMessageWithFallback(client, messages, scriptMaxTokens);
          const contentText = message.content[0].type === "text" ? message.content[0].text : "";
          const cleanedJson = contentText.substring(contentText.indexOf("{"), contentText.lastIndexOf("}") + 1);

          try {
            data = parseScriptJsonWithSalvage(cleanedJson.trim());
            break;
          } catch (parseErr: any) {
            lastParseError = parseErr;
            console.warn(`Échec de parsing JSON Claude (tentative ${attempt + 1}/2):`, parseErr.message);
          }
        }

        if (!data) {
          throw lastParseError || new Error("JSON invalide après 2 tentatives.");
        }

        res.json(ensureMinimumBeats(data));
      } catch (claudeError: any) {
        console.warn("Claude failed, falling back to Gemini with retry:", claudeError.message || claudeError);
        
        // Fallback to Gemini with retry and secondary models
        const response = await callGeminiWithRetry({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        }, ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite"]);

        const jsonText = response.text || "{}";
        const data = ensureMinimumBeats(parseScriptJsonWithSalvage(jsonText.trim()));
        res.json({
          ...data,
          fallbackFromClaude: true,
          fallbackError: claudeError.message || "Claude model not available",
        });
      }
    } else {
      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      }, ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite"]);

      const jsonText = response.text || "{}";
      const data = ensureMinimumBeats(parseScriptJsonWithSalvage(jsonText.trim()));
      res.json(data);
    }
  } catch (error: any) {
    console.error("Erreur de génération de script :", error);
    res.status(500).json({ error: error.message || "Impossible de générer le script." });
  }
});

function addWavHeader(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM = 1
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  
  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Generate Text-to-Speech audio for narration via ElevenLabs (preferred) or Gemini TTS model
 */
app.post("/api/gemini/generate-tts", async (req, res) => {
  const { text, voice = "Zephyr", provider } = req.body; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr' (Gemini) or a voice_id (ElevenLabs)

  if (!text) {
    return res.status(400).json({ error: "Le texte de la narration est requis." });
  }

  // Decide which provider to use: explicit choice from the frontend,
  // otherwise default to ElevenLabs if configured, falling back to Gemini.
  const useElevenLabs = provider === "elevenlabs" || (provider !== "gemini" && !!process.env.ELEVENLABS_API_KEY);

  if (useElevenLabs) {
    try {
      const mp3Buffer = await callElevenLabsTTS(text, voice);
      res.json({ audio: mp3Buffer.toString("base64"), mimeType: "audio/mpeg" });
      return;
    } catch (error: any) {
      console.error("Erreur de génération TTS (ElevenLabs) :", error);
      res.status(500).json({ error: error.message || "Impossible de générer l'audio de narration via ElevenLabs." });
      return;
    }
  }

  try {
    const prompt = `Say clearly and narrate perfectly with a professional and captivating movie summarizer voice: ${text}`;
    
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    }, ["gemini-2.5-flash"]); // Fallback that also supports AUDIO modality

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const pcmBuffer = Buffer.from(base64Audio, "base64");
      const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);
      const base64Wav = wavBuffer.toString("base64");
      res.json({ audio: base64Wav, mimeType: "audio/wav" });
    } else {
      throw new Error("Aucun fichier audio généré.");
    }
  } catch (error: any) {
    console.error("Erreur de génération TTS :", error);
    res.status(500).json({ error: error.message || "Impossible de générer l'audio de narration." });
  }
});

/**
 * Real video rendering via ffmpeg (replaces the old front-end simulation)
 *
 * Flow:
 *  1. POST /api/render/start -> kicks off the render in the background, returns a jobId immediately
 *  2. GET  /api/render/status/:jobId -> poll this for live progress
 *  3. Final file is served statically from /render-output/<jobId>/final.mp4
 */
interface RenderJobStatus {
  status: "processing" | "done" | "error";
  progress: number;
  label: string;
  downloadUrl?: string;
  durationSeconds?: number;
  error?: string;
}

const renderJobs = new Map<string, RenderJobStatus>();

app.use("/render-output", express.static(RENDER_ROOT));

function segmentHasAnyClip(s: any): boolean {
  const beatClips = Array.isArray(s.beats) ? s.beats.filter((b: any) => b?.assignedClip) : [];
  return beatClips.length > 0 || !!s.assignedClip || !!(s.useReferenceImage && s.referenceImage);
}

app.post("/api/render/start", async (req, res) => {
  const { movieTitle, segments, burnSubtitles = false, antiDetectionEffects = true } = req.body;

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return res.status(400).json({ error: "Aucune séquence à exporter." });
  }

  const missing = segments.filter((s: any) => !segmentHasAnyClip(s));
  if (missing.length > 0) {
    return res.status(400).json({
      error: "Toutes les séquences doivent avoir au moins un extrait vidéo (ou une image de référence) assigné avant l'export.",
    });
  }

  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  renderJobs.set(jobId, { status: "processing", progress: 0, label: "Initialisation du rendu..." });

  res.json({ jobId });

  const renderInputs: RenderSegmentInput[] = await Promise.all(
    segments.map(async (s: any) => {
      // Collect every clip assigned across this segment's beats (preferred — multiple short extracts),
      // falling back to the single legacy assignedClip if no beats have clips (e.g. older/simple segments).
      const beatClips: any[] = Array.isArray(s.beats) ? s.beats.filter((b: any) => b?.assignedClip).map((b: any) => b.assignedClip) : [];
      const sourceClips = beatClips.length > 0 ? beatClips : (s.assignedClip ? [s.assignedClip] : []);

      const clipVideoUrls: string[] = await Promise.all(
        sourceClips.map(async (clip: any) => {
          // Clip.Cafe download links expire ~5 minutes after search; refresh right before rendering.
          if (clip?.clipCafeSlug) {
            const freshUrl = await refreshClipCafeDownloadUrl(clip.clipCafeSlug);
            if (freshUrl) return freshUrl;
          }
          return clip?.videoUrl || null;
        })
      ).then((urls) => urls.filter((u): u is string => !!u));

      return {
        id: s.id,
        narration: s.narration || "",
        duration: s.duration || 5,
        clipVideoUrls,
        imageUrl: s.referenceImage || null,
        useImage: !!s.useReferenceImage,
        ttsAudioDataUri: s.ttsAudioUrl || null,
        burnSubtitles: !!burnSubtitles,
        antiDetectionEffects: !!antiDetectionEffects,
      };
    })
  );

  // Fire-and-forget: the render runs in the background, progress is polled separately.
  (async () => {
    try {
      const result = await renderMovieSummary(jobId, movieTitle || "video", renderInputs, (pct, label) => {
        renderJobs.set(jobId, { status: "processing", progress: pct, label });
      });

      renderJobs.set(jobId, {
        status: "done",
        progress: 100,
        label: "Rendu terminé avec succès !",
        downloadUrl: result.outputUrl,
        durationSeconds: result.durationSeconds,
      });
    } catch (err: any) {
      console.error("Erreur de rendu vidéo :", err);
      renderJobs.set(jobId, {
        status: "error",
        progress: 0,
        label: "Erreur",
        error:
          err.message ||
          "Le rendu vidéo a échoué côté serveur. Vérifiez que ffmpeg est bien installé sur votre serveur.",
      });
    }
  })();
});

app.get("/api/render/status/:jobId", (req, res) => {
  const job = renderJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "Tâche de rendu introuvable (peut-être expirée)." });
  }
  res.json(job);
});

/**
 * Official trailer clip extraction (via yt-dlp)
 * Lets the user paste an official trailer URL, scrub through it in-browser,
 * and extract a short range to use as an extra video source alongside Clip.Cafe.
 */
app.use("/trailer-clips", express.static(TRAILER_CLIPS_ROOT));

app.get("/api/trailer/preview-url", async (req, res) => {
  const youtubeUrl = req.query.url as string;
  if (!youtubeUrl) {
    return res.status(400).json({ error: "URL YouTube requise." });
  }

  try {
    const { stdout } = await runCapture(
      "yt-dlp",
      ["-f", "best[ext=mp4][protocol^=https]/best[ext=mp4]/best", "-g", youtubeUrl],
      25000
    );
    const streamUrl = stdout.trim().split("\n")[0];
    if (!streamUrl) throw new Error("Aucun flux vidéo trouvé pour cette URL.");
    res.json({ streamUrl });
  } catch (err: any) {
    console.error("Erreur preview bande-annonce :", err);
    res.status(500).json({
      error:
        err.message ||
        "Impossible de charger la bande-annonce. Vérifiez le lien YouTube, ou que yt-dlp est installé sur le serveur.",
    });
  }
});

app.post("/api/trailer/extract", async (req, res) => {
  const { youtubeUrl, start, end, movieTitle } = req.body;

  if (!youtubeUrl || start === undefined || end === undefined) {
    return res.status(400).json({ error: "URL, début et fin sont requis." });
  }

  const startSec = Math.max(0, Number(start));
  const endSec = Number(end);
  const duration = endSec - startSec;

  if (!(duration > 0)) {
    return res.status(400).json({ error: "La fin doit être après le début." });
  }
  if (duration > 20) {
    return res.status(400).json({ error: "Limite de 20 secondes par extraction de bande-annonce." });
  }

  const clipId = `trailer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const outputPath = path.join(TRAILER_CLIPS_ROOT, `${clipId}.mp4`);

  try {
    await runCapture(
      "yt-dlp",
      [
        "--download-sections", `*${startSec}-${endSec}`,
        "-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", outputPath,
        youtubeUrl,
      ],
      60000
    );

    if (!fs.existsSync(outputPath)) {
      throw new Error("Le fichier extrait n'a pas été créé.");
    }

    res.json({
      id: clipId,
      url: youtubeUrl,
      videoUrl: `/trailer-clips/${clipId}.mp4`,
      quote: "Extrait de la bande-annonce officielle",
      movie: movieTitle || "Bande-annonce",
      duration,
    });
  } catch (err: any) {
    console.error("Erreur extraction bande-annonce :", err);
    res.status(500).json({
      error: err.message || "Impossible d'extraire cet extrait de la bande-annonce.",
    });
  }
});

/**
 * Trims a custom portion out of an already-found Clip.Cafe result (same idea as the trailer
 * extractor, but for clips coming straight from a Clip.Cafe search — lets the user pick exactly
 * which few seconds of a longer clip to use, the same way Clip.Cafe's own site allows.
 */
app.post("/api/clip-cafe/trim", async (req, res) => {
  const { videoUrl, start, end, movie, quote } = req.body;

  if (!videoUrl || start === undefined || end === undefined) {
    return res.status(400).json({ error: "URL, début et fin sont requis." });
  }

  const startSec = Math.max(0, Number(start));
  const endSec = Number(end);
  const duration = endSec - startSec;

  if (!(duration > 0)) {
    return res.status(400).json({ error: "La fin doit être après le début." });
  }
  if (duration > 15) {
    return res.status(400).json({ error: "Limite de 15 secondes par extraction personnalisée." });
  }

  const clipId = `cliptrim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tempInputPath = path.join(TRAILER_CLIPS_ROOT, `${clipId}-src.mp4`);
  const outputPath = path.join(TRAILER_CLIPS_ROOT, `${clipId}.mp4`);

  try {
    const dlRes = await fetch(videoUrl, { signal: AbortSignal.timeout(20000) });
    if (!dlRes.ok) throw new Error(`Téléchargement échoué (HTTP ${dlRes.status}).`);
    const buf = Buffer.from(await dlRes.arrayBuffer());
    fs.writeFileSync(tempInputPath, buf);

    await runCapture(
      "ffmpeg",
      ["-y", "-ss", String(startSec), "-i", tempInputPath, "-t", String(duration), "-c", "copy", outputPath],
      30000
    );

    fs.unlinkSync(tempInputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Le fichier extrait n'a pas été créé.");
    }

    res.json({
      id: clipId,
      url: videoUrl,
      videoUrl: `/trailer-clips/${clipId}.mp4`,
      quote: quote || "Extrait personnalisé",
      movie: movie || "Clip.Cafe",
      duration,
    });
  } catch (err: any) {
    console.error("Erreur découpage extrait Clip.Cafe :", err);
    if (fs.existsSync(tempInputPath)) {
      try { fs.unlinkSync(tempInputPath); } catch {}
    }
    res.status(500).json({ error: err.message || "Impossible de découper cet extrait." });
  }
});

/**
 * Search Clip.Cafe (Scraper + Catalog Fallback)
 */
app.get("/api/clips/search", async (req, res) => {
  const query = (req.query.q as string) || "";
  
  if (!query) {
    return res.json([]);
  }

  const clipCafeApiKey = process.env.CLIP_CAFE_API_KEY;
  const officialApiClips: any[] = [];

  // Use Clip.Cafe's official structured API (requires a PRO API key from clip.cafe/pro → API docs).
  // This replaced the old fragile HTML scraping approach which broke when the site changed.
  if (clipCafeApiKey) {
    try {
      const apiUrl = `https://api.clip.cafe/?api_key=${encodeURIComponent(clipCafeApiKey)}&transcript=${encodeURIComponent(query)}&size=8`;
      const response = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });

      if (response.ok) {
        const data = await response.json();
        const hits = data?.hits?.hits || [];

        for (const hit of hits) {
          const src = hit._source;
          if (!src || !src.download) continue;

          officialApiClips.push({
            id: src.slug,
            url: `https://clip.cafe/${src.movie_slug}/${src.slug}/`,
            videoUrl: src.download, // Note: this download link is only valid for ~5 minutes; refreshed again at render time via slug.
            quote: src.title,
            movie: src.movie_title,
            thumbnail: src.movie_poster,
            duration: src.duration || 6,
            clipCafeSlug: src.slug,
          });
        }
      } else {
        console.warn(`Clip.Cafe API a répondu avec le statut ${response.status}`);
      }
    } catch (apiErr) {
      console.warn("L'API officielle Clip.Cafe a échoué ou a expiré. Utilisation du catalogue de secours...", apiErr);
    }
  }

  try {
    // Always merge in relevant fallback catalog results to enrich the experience
    const catalogQuery = query.toLowerCase();
    const catalogResults = FALLBACK_CATALOG.filter(clip => 
      clip.movie.toLowerCase().includes(catalogQuery) ||
      clip.quote.toLowerCase().includes(catalogQuery) ||
      clip.id.toLowerCase().includes(catalogQuery)
    );

    // Combine official API results and catalog, de-duplicate by URL
    const combined = [...officialApiClips, ...catalogResults];
    const seenUrls = new Set();
    const uniqueResults = combined.filter(clip => {
      if (seenUrls.has(clip.videoUrl)) return false;
      seenUrls.add(clip.videoUrl);
      return true;
    });

    // If still no results, return a random selection of fallbacks so the user is never stuck
    if (uniqueResults.length === 0) {
      const shuff = [...FALLBACK_CATALOG].sort(() => 0.5 - Math.random());
      return res.json(shuff.slice(0, 4));
    }

    res.json(uniqueResults.slice(0, 10));
  } catch (error: any) {
    console.error("Clip Search error:", error);
    res.json(FALLBACK_CATALOG.slice(0, 5)); // Safe fallback response
  }
});

/**
 * Re-fetches a fresh, still-valid download URL for a Clip.Cafe clip by its slug.
 * The official API's "download" link expires ~5 minutes after the original search,
 * so we look it up again right before rendering instead of relying on the stale one.
 */
async function refreshClipCafeDownloadUrl(slug: string): Promise<string | null> {
  const apiKey = process.env.CLIP_CAFE_API_KEY;
  if (!apiKey || !slug) return null;

  try {
    const apiUrl = `https://api.clip.cafe/?api_key=${encodeURIComponent(apiKey)}&slug=${encodeURIComponent(slug)}&size=1`;
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;

    const data = await response.json();
    const hit = data?.hits?.hits?.[0];
    return hit?._source?.download || null;
  } catch (e) {
    console.warn(`Impossible de rafraîchir le lien Clip.Cafe pour le slug "${slug}":`, e);
    return null;
  }
}

// Configure Vite or Static Files Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

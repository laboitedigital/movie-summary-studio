import React, { useState, useEffect, useMemo } from "react";
import {
  Scissors, Sparkles, Loader2, AlertCircle, Download, Mic, Play,
  Image as ImageIcon, Film, CheckCircle2, XCircle, RefreshCw, Coins, ArrowRight, Clapperboard,
} from "lucide-react";
import { NICHES, DURATIONS, VOICE_DIRECTION } from "../vox/constants";
import { formatTimecode } from "../vox/beats";
import { promptsFileName } from "../vox/promptBuilder";
import type {
  VoxIdea, VoxBeat, VoxImagePrompt, VoxThumbnailPrompt, VoxVoiceBatch, VoxBatchJobStatus,
} from "../vox/types";

/**
 * Interface du moteur Vox (Crime Documentary Paper Engine).
 *
 * Le moteur est une machine à états : chaque étape s'ouvre uniquement quand la
 * précédente a produit son résultat, comme le prévoit le matériau source. Les
 * étapes déjà franchies restent affichées et rejouables, pour pouvoir reprendre
 * une seule d'entre elles sans relancer toute la chaîne.
 */

type Stage = "niche" | "idees" | "duree" | "script" | "voix" | "beats" | "images" | "video" | "vignettes";

const STAGES: { id: Stage; label: string; state: string }[] = [
  { id: "niche", label: "Niche", state: "1" },
  { id: "idees", label: "Dix idées", state: "2" },
  { id: "duree", label: "Durée", state: "3" },
  { id: "script", label: "Script", state: "4" },
  { id: "voix", label: "Voix off", state: "5" },
  { id: "beats", label: "Beats", state: "6" },
  { id: "images", label: "Images", state: "7" },
  { id: "video", label: "Vidéo", state: "8" },
  { id: "vignettes", label: "Vignettes", state: "9" },
];

interface VoxConfig {
  hasYapper: boolean;
  hasElevenLabs: boolean;
  universalVideoPrompt: string;
  videoClipSeconds: number;
}

interface YapperModel {
  id: string;
  displayName: string;
  capabilities?: { description?: string };
  pricing?: { creditsByResolution?: Record<string, number>; creditsByLength?: Record<string, number> };
}

interface Estimate {
  perItem: number;
  count: number;
  total: number;
  available: number | null;
  canStart: boolean;
  estimatedCompletionSeconds?: number;
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "La requête a échoué.");
  return data;
}

export default function VoxEngine() {
  const [config, setConfig] = useState<VoxConfig | null>(null);
  const [stage, setStage] = useState<Stage>("niche");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // État 1 à 4
  const [niche, setNiche] = useState<string>(NICHES[0].label);
  const [customNiche, setCustomNiche] = useState("");
  const [ideas, setIdeas] = useState<VoxIdea[]>([]);
  const [topic, setTopic] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [script, setScript] = useState<string>("");
  const [scriptMeta, setScriptMeta] = useState<{ actualWords: number; targetWords: number; withinTolerance: boolean; cliffhangerPattern: string } | null>(null);

  // État 5, voix off
  const [voices, setVoices] = useState<{ id: string; label: string }[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [voiceBatches, setVoiceBatches] = useState<VoxVoiceBatch[]>([]);

  // État 6 à 9
  const [beats, setBeats] = useState<VoxBeat[]>([]);
  const [beatSanity, setBeatSanity] = useState<{ ok: boolean; message: string | null } | null>(null);
  const [imagePrompts, setImagePrompts] = useState<VoxImagePrompt[]>([]);
  const [thumbnails, setThumbnails] = useState<VoxThumbnailPrompt[]>([]);

  // Génération Yapper
  const [imageModels, setImageModels] = useState<YapperModel[]>([]);
  const [videoModels, setVideoModels] = useState<YapperModel[]>([]);
  const [imageModel, setImageModel] = useState("nano-banana-pro");
  const [videoModel, setVideoModel] = useState("seedance-2.0-mini");
  const [imageResolution, setImageResolution] = useState("1080");
  const [videoResolution, setVideoResolution] = useState(720);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimateKind, setEstimateKind] = useState<"images" | "videos" | null>(null);
  const [imageJob, setImageJob] = useState<VoxBatchJobStatus | null>(null);
  const [videoJob, setVideoJob] = useState<VoxBatchJobStatus | null>(null);

  useEffect(() => {
    fetch("/api/vox/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setError("Impossible de lire la configuration du moteur."));

    fetch("/api/tts/elevenlabs-voices")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.voices) && d.voices.length > 0) {
          setVoices(d.voices);
          setVoiceId(d.voices[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  // Le catalogue Yapper n'est chargé qu'une fois la clé confirmée présente.
  useEffect(() => {
    if (!config?.hasYapper) return;
    fetch("/api/vox/models")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.images)) setImageModels(d.images);
        if (Array.isArray(d.videos)) setVideoModels(d.videos);
      })
      .catch(() => undefined);
  }, [config?.hasYapper]);

  const activeNiche = niche === "__custom" ? customNiche : niche;
  const stageIndex = STAGES.findIndex((s) => s.id === stage);
  const reached = (id: Stage) => STAGES.findIndex((s) => s.id === id) <= stageIndex;

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await task();
    } catch (e: any) {
      setError(e.message || "Une erreur s'est produite.");
    } finally {
      setBusy(null);
    }
  };

  // --- État 2 -------------------------------------------------------------
  const generateIdeas = () =>
    run("idees", async () => {
      const data = await postJson("/api/vox/ideas", { niche: activeNiche });
      setIdeas(data.ideas);
      setStage("idees");
    });

  // --- État 4 -------------------------------------------------------------
  const generateScript = (seconds: number) =>
    run("script", async () => {
      const data = await postJson("/api/vox/script", { topic, durationSeconds: seconds });
      setScript(data.text);
      setScriptMeta({
        actualWords: data.actualWords,
        targetWords: data.targetWords,
        withinTolerance: data.withinTolerance,
        cliffhangerPattern: data.cliffhangerPattern,
      });
      const batches = await postJson("/api/vox/voice-batches", { script: data.text });
      setVoiceBatches(batches.batches);
      setStage("script");
    });

  // --- État 5 -------------------------------------------------------------
  const generateVoiceBatch = (index: number) =>
    run(`voix-${index}`, async () => {
      const batch = voiceBatches[index];
      const data = await postJson("/api/vox/voiceover", { text: batch.text, voiceId });
      const url = `data:${data.mimeType};base64,${data.audio}`;
      setVoiceBatches((prev) =>
        prev.map((b, i) =>
          i === index ? { ...b, takes: [...b.takes, url], selectedTake: b.takes.length, audioUrl: url } : b
        )
      );
    });

  const selectTake = (batchIndex: number, takeIndex: number) => {
    setVoiceBatches((prev) =>
      prev.map((b, i) =>
        i === batchIndex ? { ...b, selectedTake: takeIndex, audioUrl: b.takes[takeIndex] } : b
      )
    );
  };

  // --- État 6 -------------------------------------------------------------
  const buildBeatTable = () =>
    run("beats", async () => {
      const data = await postJson("/api/vox/beats", { script, durationSeconds });
      setBeats(data.beats);
      setBeatSanity(data.sanity);
      setStage("beats");
    });

  // --- État 7 -------------------------------------------------------------
  const generateImagePrompts = () =>
    run("prompts", async () => {
      const data = await postJson("/api/vox/image-prompts", { topic, script, beats });
      setImagePrompts(data.prompts);
      if (data.missing > 0) {
        setError(`${data.missing} beat(s) n'ont pas reçu de scène. Relancez cette étape pour les compléter.`);
      }
      setStage("images");
    });

  const downloadPromptsFile = () => {
    const content = imagePrompts.map((p) => p.fullPrompt.trim()).join("\n\n") + "\n";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = promptsFileName(topic || "sujet");
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // --- Génération Yapper --------------------------------------------------
  const requestEstimate = (kind: "images" | "videos") =>
    run(`estimate-${kind}`, async () => {
      const count = kind === "images" ? imagePrompts.length : imageJob?.items.filter((i) => i.url).length || 0;
      const data = await postJson("/api/vox/generate/estimate", {
        kind,
        model: kind === "images" ? imageModel : videoModel,
        count,
        resolution: kind === "images" ? imageResolution : videoResolution,
      });
      setEstimate(data);
      setEstimateKind(kind);
    });

  const pollJob = (jobId: string, kind: "images" | "videos") => {
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/vox/generate/status/${jobId}`);
        const data: VoxBatchJobStatus = await response.json();
        if (kind === "images") setImageJob(data);
        else setVideoJob(data);
        if (data.state === "done" || data.state === "error") clearInterval(timer);
      } catch {
        clearInterval(timer);
      }
    }, 4000);
  };

  const startGeneration = (kind: "images" | "videos") =>
    run(`start-${kind}`, async () => {
      const items =
        kind === "images"
          ? imagePrompts.map((p) => ({ beatIndex: p.beatIndex, prompt: p.fullPrompt }))
          : (imageJob?.items || [])
              .filter((i) => i.url)
              .map((i) => ({ beatIndex: i.beatIndex, imageUrl: i.url }));

      if (items.length === 0) throw new Error("Aucun élément à générer.");

      const data = await postJson("/api/vox/generate/start", {
        kind,
        model: kind === "images" ? imageModel : videoModel,
        resolution: kind === "images" ? imageResolution : videoResolution,
        items,
      });

      setEstimate(null);
      setEstimateKind(null);
      pollJob(data.jobId, kind);
      if (kind === "videos") setStage("video");
    });

  // --- État 9 -------------------------------------------------------------
  const generateThumbnails = () =>
    run("vignettes", async () => {
      const data = await postJson("/api/vox/thumbnails", { topic, script });
      setThumbnails(data.thumbnails);
      setStage("vignettes");
    });

  const totalVoiceSeconds = useMemo(
    () => voiceBatches.reduce((sum, b) => sum + b.estimatedSeconds, 0),
    [voiceBatches]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Bandeau d'étapes */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/50 border border-slate-800 rounded-xl p-2">
        {STAGES.map((s) => {
          const done = STAGES.findIndex((x) => x.id === s.id) < stageIndex;
          const current = s.id === stage;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                current
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : done
                  ? "bg-slate-800/60 text-slate-300"
                  : "text-slate-600"
              }`}
            >
              <span className="opacity-60">{s.state}</span>
              <span className="font-sans font-semibold">{s.label}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {config && !config.hasYapper && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>YAPPER_API_KEY absente.</strong> Les états 1 à 7 et 9 fonctionnent (script, beats, prompts,
            fichier .txt). La génération réelle des images et des vidéos reste indisponible tant que la clé
            n'est pas ajoutée dans le fichier .env.
          </span>
        </div>
      )}

      {/* ÉTAT 1, niche */}
      <Section icon={<Scissors className="w-4 h-4" />} state="1" title="Niche">
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <button
              key={n.id}
              onClick={() => setNiche(n.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                niche === n.label
                  ? "bg-amber-500 text-slate-950 border-amber-500"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
            >
              {n.label}
              {n.isHouseDefault && <span className="ml-1.5 opacity-60 font-mono text-[10px]">défaut</span>}
            </button>
          ))}
          <button
            onClick={() => setNiche("__custom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              niche === "__custom"
                ? "bg-amber-500 text-slate-950 border-amber-500"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            La tienne
          </button>
        </div>

        {niche === "__custom" && (
          <input
            value={customNiche}
            onChange={(e) => setCustomNiche(e.target.value)}
            placeholder="Écris ta niche"
            className="mt-3 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-500 outline-none"
          />
        )}

        <button
          onClick={generateIdeas}
          disabled={!activeNiche || busy === "idees"}
          className="mt-3 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {busy === "idees" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Générer 10 idées
        </button>
      </Section>

      {/* ÉTAT 2, dix idées */}
      {reached("idees") && ideas.length > 0 && (
        <Section icon={<Sparkles className="w-4 h-4" />} state="2" title="Dix idées">
          <div className="flex flex-col gap-1.5">
            {ideas.map((idea) => (
              <button
                key={idea.index}
                onClick={() => {
                  setTopic(idea.title);
                  setStage("duree");
                }}
                className={`text-left flex items-start gap-3 px-3 py-2 rounded-lg border transition-colors ${
                  topic === idea.title
                    ? "bg-amber-500/15 border-amber-500/50"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="font-mono text-[11px] text-slate-500 mt-0.5 w-4 shrink-0">{idea.index}</span>
                <span className="flex-1">
                  <span className="block text-sm text-slate-100 font-medium">{idea.title}</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    {idea.territory} · {idea.hook}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ou décris un autre sujet"
            className="mt-3 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-500 outline-none"
          />
        </Section>
      )}

      {/* ÉTAT 3, durée */}
      {reached("duree") && topic && (
        <Section icon={<ArrowRight className="w-4 h-4" />} state="3" title="Durée">
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.seconds}
                onClick={() => {
                  setDurationSeconds(d.seconds);
                  generateScript(d.seconds);
                }}
                disabled={busy === "script"}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 ${
                  durationSeconds === d.seconds
                    ? "bg-amber-500 text-slate-950 border-amber-500"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {d.label}
                <span className="ml-1.5 opacity-60 font-mono text-[10px]">{d.targetWords} mots</span>
              </button>
            ))}
          </div>
          {busy === "script" && (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Écriture du script en cours
            </p>
          )}
        </Section>
      )}

      {/* ÉTAT 4, script */}
      {reached("script") && script && (
        <Section icon={<Clapperboard className="w-4 h-4" />} state="4" title="Script (style Fern)">
          <div className="flex items-center gap-3 mb-2 text-[11px] font-mono">
            <span className={scriptMeta?.withinTolerance ? "text-emerald-400" : "text-amber-400"}>
              {scriptMeta?.actualWords} mots / cible {scriptMeta?.targetWords}
            </span>
            {scriptMeta?.cliffhangerPattern && (
              <span className="text-slate-500">chute : {scriptMeta.cliffhangerPattern}</span>
            )}
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={8}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 leading-relaxed focus:border-amber-500 outline-none font-serif"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setStage("voix")}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Mic className="w-4 h-4" /> Passer à la voix off
            </button>
            <button
              onClick={buildBeatTable}
              disabled={busy === "beats"}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {busy === "beats" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Découper en beats
            </button>
          </div>
        </Section>
      )}

      {/* ÉTAT 5, voix off */}
      {reached("voix") && voiceBatches.length > 0 && (
        <Section icon={<Mic className="w-4 h-4" />} state="5" title="Voix off ElevenLabs">
          <p className="text-[11px] text-slate-400 mb-3">
            {VOICE_DIRECTION} Réglages appliqués : stabilité 55, similarité 80, style bas, speaker boost actif.
            Chaque lot fait 20 à 25 secondes ; régénère un lot 2 à 5 fois et garde la meilleure prise. Le lot
            d'ouverture porte la vidéo.
          </p>

          {!config?.hasElevenLabs ? (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-lg p-3">
              ELEVENLABS_API_KEY absente. Copie chaque lot ci-dessous dans l'interface ElevenLabs avec les
              réglages indiqués.
            </div>
          ) : (
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 mb-3 outline-none focus:border-amber-500"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          )}

          <p className="text-[11px] font-mono text-slate-500 mb-2">
            {voiceBatches.length} lots, {totalVoiceSeconds.toFixed(1)}s au total
          </p>

          <div className="flex flex-col gap-2">
            {voiceBatches.map((batch, i) => (
              <div key={batch.index} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-[11px] font-mono text-slate-500">
                    Lot {batch.index} · {batch.estimatedSeconds}s
                    {batch.isColdOpen && (
                      <span className="ml-2 text-amber-400 font-sans font-semibold">ouverture à froid</span>
                    )}
                  </span>
                  {config?.hasElevenLabs && (
                    <button
                      onClick={() => generateVoiceBatch(i)}
                      disabled={busy === `voix-${i}`}
                      className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      {busy === `voix-${i}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      {batch.takes.length === 0 ? "Générer" : `Nouvelle prise (${batch.takes.length})`}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{batch.text}</p>

                {batch.takes.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {batch.takes.map((take, t) => (
                      <div key={t} className="flex items-center gap-2">
                        <button
                          onClick={() => selectTake(i, t)}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            batch.selectedTake === t
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          prise {t + 1}
                        </button>
                        <audio controls src={take} className="h-7 flex-1" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={buildBeatTable}
            disabled={busy === "beats"}
            className="mt-3 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {busy === "beats" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Découper en beats
          </button>
        </Section>
      )}

      {/* ÉTAT 6, beats */}
      {reached("beats") && beats.length > 0 && (
        <Section icon={<Scissors className="w-4 h-4" />} state="6" title={`Beats (${beats.length})`}>
          {beatSanity && !beatSanity.ok && beatSanity.message && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-lg p-3 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{beatSanity.message}</span>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 sticky top-0">
                <tr className="text-slate-500 font-mono text-[10px]">
                  <th className="text-left px-3 py-1.5 w-10">#</th>
                  <th className="text-left px-3 py-1.5 w-16">début</th>
                  <th className="text-left px-3 py-1.5">narration</th>
                </tr>
              </thead>
              <tbody>
                {beats.map((beat) => (
                  <tr key={beat.index} className="border-t border-slate-850 hover:bg-slate-900/40">
                    <td className="px-3 py-1.5 font-mono text-slate-600">{beat.index}</td>
                    <td className="px-3 py-1.5 font-mono text-slate-500">{formatTimecode(beat.startSeconds)}</td>
                    <td className="px-3 py-1.5 text-slate-300">{beat.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={generateImagePrompts}
            disabled={busy === "prompts"}
            className="mt-3 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {busy === "prompts" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            Générer un prompt d'image par beat
          </button>
        </Section>
      )}

      {/* ÉTAT 7, prompts et images */}
      {reached("images") && imagePrompts.length > 0 && (
        <Section icon={<ImageIcon className="w-4 h-4" />} state="7" title={`Prompts d'images (${imagePrompts.length})`}>
          <button
            onClick={downloadPromptsFile}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm px-4 py-2 rounded-lg transition-colors mb-3"
          >
            <Download className="w-4 h-4" /> Télécharger {promptsFileName(topic || "sujet")}
          </button>

          <details className="mb-3">
            <summary className="text-[11px] font-mono text-slate-500 cursor-pointer hover:text-slate-300">
              Voir les prompts
            </summary>
            <div className="mt-2 max-h-60 overflow-y-auto flex flex-col gap-2">
              {imagePrompts.map((p) => (
                <div key={p.beatIndex} className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] font-mono text-slate-600">beat {p.beatIndex}</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{p.scene}</p>
                </div>
              ))}
            </div>
          </details>

          {config?.hasYapper && (
            <GenerationPanel
              kind="images"
              label="Générer les images sur Yapper"
              models={imageModels}
              model={imageModel}
              setModel={setImageModel}
              resolutionOptions={["720", "1080", "2k", "4k"]}
              resolution={String(imageResolution)}
              setResolution={(r) => setImageResolution(r)}
              count={imagePrompts.length}
              estimate={estimateKind === "images" ? estimate : null}
              busy={busy}
              job={imageJob}
              onEstimate={() => requestEstimate("images")}
              onStart={() => startGeneration("images")}
            />
          )}
        </Section>
      )}

      {/* ÉTAT 8, vidéo */}
      {imageJob?.state === "done" && config?.hasYapper && (
        <Section icon={<Film className="w-4 h-4" />} state="8" title="Prompt vidéo universel">
          <p className="text-[11px] text-slate-400 mb-2">
            Le même prompt est appliqué à chaque image générée : clip de {config.videoClipSeconds} secondes,
            caméra verrouillée, assemblage du collage de 0 à 7 secondes, affiche vivante de 7 à 10 secondes.
          </p>
          <details className="mb-3">
            <summary className="text-[11px] font-mono text-slate-500 cursor-pointer hover:text-slate-300">
              Voir le prompt vidéo universel
            </summary>
            <pre className="mt-2 max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-3 text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed">
              {config.universalVideoPrompt}
            </pre>
          </details>

          <GenerationPanel
            kind="videos"
            label="Animer chaque image sur Yapper"
            models={videoModels}
            model={videoModel}
            setModel={setVideoModel}
            resolutionOptions={["480", "720", "1080"]}
            resolution={String(videoResolution)}
            setResolution={(r) => setVideoResolution(Number(r))}
            count={imageJob.items.filter((i) => i.url).length}
            estimate={estimateKind === "videos" ? estimate : null}
            busy={busy}
            job={videoJob}
            onEstimate={() => requestEstimate("videos")}
            onStart={() => startGeneration("videos")}
          />
        </Section>
      )}

      {/* ÉTAT 9, vignettes */}
      {script && (
        <Section icon={<ImageIcon className="w-4 h-4" />} state="9" title="Vignettes">
          <button
            onClick={generateThumbnails}
            disabled={busy === "vignettes"}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {busy === "vignettes" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Générer 3 prompts de vignettes
          </button>

          {thumbnails.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {thumbnails.map((t) => (
                <div key={t.index} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-600">vignette {t.index}</span>
                    {t.words.map((w) => (
                      <span
                        key={w}
                        className="text-[10px] font-bold bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.scene}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({
  icon, state, title, children,
}: {
  icon: React.ReactNode;
  state: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
        <span className="text-amber-400">{icon}</span>
        <span className="font-mono text-[10px] text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded">
          ÉTAT {state}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Panneau de dépense Yapper.
 *
 * Aucune génération ne part sans que l'utilisateur ait vu le coût exact : le
 * bouton de lancement n'apparaît qu'après une estimation, obtenue en dryRun,
 * qui ne facture rien.
 */
function GenerationPanel({
  kind, label, models, model, setModel, resolutionOptions, resolution, setResolution,
  count, estimate, busy, job, onEstimate, onStart,
}: {
  kind: "images" | "videos";
  label: string;
  models: YapperModel[];
  model: string;
  setModel: (m: string) => void;
  resolutionOptions: string[];
  resolution: string;
  setResolution: (r: string) => void;
  count: number;
  estimate: Estimate | null;
  busy: string | null;
  job: VoxBatchJobStatus | null;
  onEstimate: () => void;
  onStart: () => void;
}) {
  const notEnough = estimate?.available != null && estimate.total > estimate.available;

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
      <div className="flex flex-wrap gap-2 mb-3">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="flex-1 min-w-40 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
        >
          {models.length === 0 && <option value={model}>{model}</option>}
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.displayName}</option>
          ))}
        </select>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
        >
          {resolutionOptions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {!estimate ? (
        <button
          onClick={onEstimate}
          disabled={busy === `estimate-${kind}` || count === 0}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          {busy === `estimate-${kind}` ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Coins className="w-3.5 h-3.5" />
          )}
          Estimer le coût de {count} {kind === "images" ? "images" : "clips"}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-300">
            <strong className="text-amber-300">{estimate.total} crédits</strong> pour {estimate.count}{" "}
            {kind === "images" ? "images" : "clips"} ({estimate.perItem} par unité).
            {estimate.available != null && (
              <span className="text-slate-500"> Solde disponible : {estimate.available}.</span>
            )}
          </p>
          {notEnough && (
            <p className="text-xs text-red-300">
              Solde insuffisant. Rechargez sur yapper.so avant de lancer.
            </p>
          )}
          <button
            onClick={onStart}
            disabled={busy === `start-${kind}` || notEnough || !estimate.canStart}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors w-fit"
          >
            {busy === `start-${kind}` ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {label}
          </button>
        </div>
      )}

      {job && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
            <span>
              {job.completed} / {job.total} terminés
              {job.failed > 0 && <span className="text-red-400"> · {job.failed} en échec</span>}
            </span>
            <span>{job.state === "done" ? "terminé" : job.state === "error" ? "échec" : "en cours"}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${job.total ? ((job.completed + job.failed) / job.total) * 100 : 0}%` }}
            />
          </div>

          <div className="mt-2 grid grid-cols-6 sm:grid-cols-10 gap-1">
            {job.items.map((item) => (
              <div
                key={item.beatIndex}
                title={item.error || `beat ${item.beatIndex}`}
                className={`aspect-square rounded flex items-center justify-center ${
                  item.state === "done"
                    ? "bg-emerald-500/20"
                    : item.state === "error"
                    ? "bg-red-500/20"
                    : item.state === "running"
                    ? "bg-amber-500/20"
                    : "bg-slate-800/60"
                }`}
              >
                {item.state === "done" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {item.state === "error" && <XCircle className="w-3 h-3 text-red-400" />}
                {item.state === "running" && <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />}
              </div>
            ))}
          </div>

          {job.state === "done" && (
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
              {job.items
                .filter((i) => i.url)
                .map((item) =>
                  kind === "images" ? (
                    <img
                      key={item.beatIndex}
                      src={item.url!}
                      alt={`beat ${item.beatIndex}`}
                      className="w-full aspect-video object-cover rounded border border-slate-800"
                    />
                  ) : (
                    <video
                      key={item.beatIndex}
                      src={item.url!}
                      controls
                      className="w-full aspect-video rounded border border-slate-800"
                    />
                  )
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

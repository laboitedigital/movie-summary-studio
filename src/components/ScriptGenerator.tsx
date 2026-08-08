import React, { useState, useEffect } from "react";
import { Sparkles, Languages, Volume2, Mic, Play, Pause, RefreshCw, AlertCircle, Trash2, Plus, ArrowRight, Loader2 } from "lucide-react";
import { ScriptSegment } from "../types";

interface ScriptGeneratorProps {
  movieTitle: string;
  setMovieTitle: (title: string) => void;
  segments: ScriptSegment[];
  setSegments: (segments: ScriptSegment[]) => void;
  voice: string;
  setVoice: (voice: string) => void;
}

const POPULAR_MOVIES = [
  { title: "Inception", year: "2010" },
  { title: "The Matrix", year: "1999" },
  { title: "Titanic", year: "1997" },
  { title: "The Dark Knight", year: "2008" },
  { title: "Interstellar", year: "2014" },
  { title: "Forrest Gump", year: "1994" }
];

const PREBUILT_VOICES = [
  { id: "Zephyr", label: "Zephyr (Chaleureux / Narratif)", accent: "French/English Neutral" },
  { id: "Kore", label: "Kore (Professionnel / Posé)", accent: "Studio Clear" },
  { id: "Fenrir", label: "Fenrir (Profond / Dramatique)", accent: "Cinematic Bass" },
  { id: "Puck", label: "Puck (Dynamique / Amical)", accent: "YouTube Fast" }
];

export default function ScriptGenerator({
  movieTitle,
  setMovieTitle,
  segments,
  setSegments,
  voice,
  setVoice
}: ScriptGeneratorProps) {
  const [customInstructions, setCustomInstructions] = useState("");
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);
  const [provider, setProvider] = useState<"gemini" | "claude">("gemini");
  const [hasClaude, setHasClaude] = useState(false);

  // TTS provider state (ElevenLabs preferred when configured, Gemini as fallback)
  const [ttsProvider, setTtsProvider] = useState<"gemini" | "elevenlabs">("gemini");
  const [hasElevenLabs, setHasElevenLabs] = useState(false);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<{ id: string; label: string }[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  
  // YouTube reference videos state
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [youtubeMetadata, setYoutubeMetadata] = useState<Record<string, { title: string; author: string; thumbnailUrl: string; videoId: string }>>({});
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  // Audio state tracking
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [generatingTtsId, setGeneratingTtsId] = useState<string | null>(null);
  const [bulkTtsProgress, setBulkTtsProgress] = useState<{ current: number; total: number } | null>(null);

  const handleAddYoutubeUrl = async () => {
    if (!newYoutubeUrl.trim()) return;
    setYoutubeError(null);

    const trimmedUrl = newYoutubeUrl.trim();
    if (!trimmedUrl.includes("youtube.com") && !trimmedUrl.includes("youtu.be")) {
      setYoutubeError("Veuillez entrer un lien YouTube valide.");
      return;
    }

    setIsAddingYoutube(true);
    try {
      const res = await fetch(`/api/youtube/metadata?url=${encodeURIComponent(trimmedUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (!youtubeUrls.includes(trimmedUrl)) {
          setYoutubeUrls([...youtubeUrls, trimmedUrl]);
          setYoutubeMetadata(prev => ({
            ...prev,
            [trimmedUrl]: data
          }));
        }
        setNewYoutubeUrl("");
      } else {
        const data = await res.json();
        setYoutubeError(data.error || "Impossible de récupérer les informations de la vidéo.");
      }
    } catch (err) {
      console.error(err);
      setYoutubeError("Erreur de connexion lors de la récupération des données.");
    } finally {
      setIsAddingYoutube(false);
    }
  };

  const handleRemoveYoutubeUrl = (url: string) => {
    setYoutubeUrls(youtubeUrls.filter(u => u !== url));
    const updatedMeta = { ...youtubeMetadata };
    delete updatedMeta[url];
    setYoutubeMetadata(updatedMeta);
  };

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasClaude) {
          setHasClaude(true);
          setProvider("claude");
        }
        if (data.hasElevenLabs) {
          setHasElevenLabs(true);
          setTtsProvider("elevenlabs");
        }
      })
      .catch((err) => console.error("Error fetching config:", err));
  }, []);

  // Fetch the real ElevenLabs voice list once it becomes the active TTS provider
  useEffect(() => {
    if (ttsProvider !== "elevenlabs" || elevenLabsVoices.length > 0) return;
    setIsLoadingVoices(true);
    fetch("/api/tts/elevenlabs-voices")
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && Array.isArray(data.voices)) {
          setElevenLabsVoices(data.voices);
          if (data.voices.length > 0) {
            setVoice(data.voices[0].id);
          }
        }
      })
      .catch((err) => console.error("Error fetching ElevenLabs voices:", err))
      .finally(() => setIsLoadingVoices(false));
  }, [ttsProvider]);

  const handleSelectSuggested = (title: string) => {
    setMovieTitle(title);
  };

  const handleGenerateScript = async () => {
    if (!movieTitle.trim()) {
      setError("Veuillez saisir un titre de film.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setFallbackWarning(null);

    try {
      const response = await fetch("/api/gemini/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieTitle,
          customInstructions,
          language: "French",
          provider,
          referenceUrls: youtubeUrls,
          targetDurationMinutes
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Une erreur s'est produite lors de la génération.");
      }

      const data = await response.json();
      
      if (data.fallbackFromClaude) {
        setFallbackWarning(
          "Le modèle Claude 4.6 Sonnet n'est pas activé ou disponible sous votre niveau de clé API (erreur 404). L'application a basculé automatiquement sur Google Gemini 3.5 pour assurer le service sans interruption !"
        );
      }
      
      if (data.segments && Array.isArray(data.segments)) {
        const mapped: ScriptSegment[] = data.segments.map((seg: any, idx: number) => {
          const rawBeats = Array.isArray(seg.beats) ? seg.beats : [];
          const beats = rawBeats.length > 0
            ? rawBeats.map((b: any, bIdx: number) => ({
                id: `beat-${Date.now()}-${idx}-${bIdx}`,
                text: b.text || "",
                suggestedSearch: b.suggestedSearch || seg.suggestedSearch || movieTitle,
                assignedClip: null,
              }))
            : [{
                // Fallback: no beats returned by the AI, treat the whole narration as one beat
                id: `beat-${Date.now()}-${idx}-0`,
                text: seg.narration || "",
                suggestedSearch: seg.suggestedSearch || movieTitle,
                assignedClip: null,
              }];

          return {
            id: `seg-${Date.now()}-${idx}`,
            title: seg.title || `Séquence ${idx + 1}`,
            narration: seg.narration || "",
            suggestedSearch: seg.suggestedSearch || movieTitle,
            duration: Math.max(5, Math.ceil(seg.narration.split(" ").length * 0.45)), // estimate duration: ~130 words per minute
            beats,
            assignedClip: null,
            ttsAudioUrl: null,
            useReferenceImage: seg.useReferenceImage || false,
            referenceImage: seg.referenceImage || null,
            referenceImageReason: seg.referenceImageReason || null
          };
        });
        setSegments(mapped);
        // Automatically generate narration audio for every segment, using the voice
        // selected before clicking "Rédiger" — no need to click "Générer Audio" per segment.
        generateAllVoiceovers(mapped);
      } else {
        throw new Error("Format de réponse non conforme.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de joindre le serveur de génération.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Shared low-level TTS call, returns the raw API payload without touching component state.
  const fetchTTSAudio = async (text: string): Promise<{ audio: string; mimeType: string } | null> => {
    const response = await fetch("/api/gemini/generate-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, provider: ttsProvider })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Échec de la génération de la voix par l'API.");
    }

    const data = await response.json();
    if (!data.audio) return null;
    return { audio: data.audio, mimeType: data.mimeType || "audio/wav" };
  };

  const handleGenerateTTS = async (segmentId: string, text: string) => {
    setGeneratingTtsId(segmentId);
    setError(null);

    try {
      const result = await fetchTTSAudio(text);
      if (result) {
        const audioUri = `data:${result.mimeType};base64,${result.audio}`;
        setSegments(segments.map(seg => seg.id === segmentId ? { ...seg, ttsAudioUrl: audioUri } : seg));
      }
    } catch (err: any) {
      console.error(err);
      setError("Erreur TTS : " + (err.message || "Impossible d'enregistrer la voix-off."));
    } finally {
      setGeneratingTtsId(null);
    }
  };

  // Generates narration audio for every segment sequentially right after a script is produced,
  // using whichever voice/provider was selected before clicking "Rédiger". Runs one at a time
  // (rather than in parallel) to stay within API rate limits and to give clear progress feedback.
  const generateAllVoiceovers = async (segs: ScriptSegment[]) => {
    setBulkTtsProgress({ current: 0, total: segs.length });
    let working = segs;

    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      setBulkTtsProgress({ current: i + 1, total: segs.length });
      if (!seg.narration.trim()) continue;

      try {
        const result = await fetchTTSAudio(seg.narration);
        if (result) {
          const audioUri = `data:${result.mimeType};base64,${result.audio}`;
          working = working.map(s => s.id === seg.id ? { ...s, ttsAudioUrl: audioUri } : s);
          setSegments(working);
        }
      } catch (err: any) {
        console.error(`Échec génération voix pour le segment "${seg.title}":`, err);
        // Continue with the remaining segments even if one fails (e.g. quota hit mid-way)
      }
    }

    setBulkTtsProgress(null);
  };

  const handlePlayAudio = (segmentId: string, url: string) => {
    if (playingAudioId === segmentId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.onended = () => setPlayingAudioId(null);
      activeAudioRef.current = audio;
      setPlayingAudioId(segmentId);
      audio.play().catch(e => {
        console.error(e);
        setPlayingAudioId(null);
      });
    }
  };

  const updateSegmentField = (id: string, field: keyof ScriptSegment, value: any) => {
    setSegments(segments.map(seg => {
      if (seg.id === id) {
        return { ...seg, [field]: value };
      }
      return seg;
    }));
  };

  const handleAddSegment = () => {
    const newSeg: ScriptSegment = {
      id: `seg-custom-${Date.now()}`,
      title: `Nouvelle Séquence ${segments.length + 1}`,
      narration: "Écrivez ici le texte qui sera narré à haute voix.",
      suggestedSearch: movieTitle || "movie",
      duration: 6,
      beats: [{
        id: `beat-custom-${Date.now()}`,
        text: "Écrivez ici le texte qui sera narré à haute voix.",
        suggestedSearch: movieTitle || "movie",
        assignedClip: null,
      }],
      assignedClip: null,
      ttsAudioUrl: null
    };
    setSegments([...segments, newSeg]);
  };

  const handleDeleteSegment = (id: string) => {
    setSegments(segments.filter(seg => seg.id !== id));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6" id="script-generator">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 font-sans">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Créateur de Script & Narration par l'IA</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Définissez votre film et demandez à Gemini de rédiger votre résumé de film, de vous recommander des extraits vidéo et d'en générer la voix-off narrative.
        </p>
      </div>

      {/* Movie Form */}
      <div className="flex flex-col gap-4">
        {provider === "claude" && !hasClaude && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300 flex items-start gap-2.5 select-none">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-semibold block text-white mb-0.5">Clé Claude non configurée</span>
              <span>Pour utiliser Claude 4.6 Sonnet, veuillez ajouter la variable d'environnement <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px] text-amber-200 font-bold">CLAUDE_API_KEY</code> dans vos Secrets (bouton Paramètres/Secrets en haut à droite). En attendant, l'application peut basculer sur Gemini.</span>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">Film cible</label>
            <div className="flex items-center bg-slate-950 border border-slate-850 p-0.5 rounded-lg gap-0.5">
              <button
                onClick={() => setProvider("gemini")}
                className={`text-[10px] font-mono font-bold px-2 py-1 rounded transition-all select-none ${
                  provider === "gemini"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Utiliser Google Gemini 3.5 Flash"
              >
                GEMINI
              </button>
              <button
                onClick={() => setProvider("claude")}
                className={`text-[10px] font-mono font-bold px-2 py-1 rounded transition-all flex items-center gap-1 select-none ${
                  provider === "claude"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Utiliser Anthropic Claude 4.6 Sonnet"
              >
                <span>CLAUDE</span>
                <span className={`w-1.5 h-1.5 rounded-full ${hasClaude ? "bg-emerald-500" : "bg-red-500"}`} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              placeholder="Ex: Inception, Titanic, The Matrix..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
              id="movie-title-input"
            />
            <button
              onClick={handleGenerateScript}
              disabled={isGenerating || !movieTitle.trim()}
              className="bg-gradient-to-r from-amber-500 to-amber-300 text-slate-950 hover:from-amber-400 hover:to-amber-200 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 font-bold px-5 rounded-xl text-sm transition-all flex items-center gap-2 select-none shadow-lg shadow-amber-500/10 cursor-pointer"
              id="generate-script-btn"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Rédiger</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggested popular list */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Exemples :</span>
          {POPULAR_MOVIES.map((mov) => (
            <button
              key={mov.title}
              onClick={() => handleSelectSuggested(mov.title)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${movieTitle === mov.title ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"}`}
            >
              {mov.title} <span className="opacity-50 text-[10px]">({mov.year})</span>
            </button>
          ))}
        </div>

        {/* YouTube References */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
              Vidéos YouTube de référence (Hook, Style, Structure, Images)
            </label>
            <p className="text-[10px] text-slate-500">
              Ajoutez des liens de vidéos YouTube pour inspirer le script, la structure, le rythme et suggérer des images d'illustration non-film (B-roll, transition face caméra).
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newYoutubeUrl}
              onChange={(e) => setNewYoutubeUrl(e.target.value)}
              placeholder="Collez un lien YouTube (ex: https://www.youtube.com/watch?v=...)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleAddYoutubeUrl}
              disabled={isAddingYoutube || !newYoutubeUrl.trim()}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 disabled:text-slate-600 border border-slate-700 hover:border-slate-600 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none cursor-pointer"
            >
              {isAddingYoutube ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Ajouter</span>
            </button>
          </div>

          {youtubeError && (
            <p className="text-[10px] text-red-400 font-medium">{youtubeError}</p>
          )}

          {youtubeUrls.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {youtubeUrls.map((url) => {
                const meta = youtubeMetadata[url];
                return (
                  <div
                    key={url}
                    className="flex items-center justify-between bg-slate-900 border border-slate-800/80 rounded-lg p-2 gap-3"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {meta?.thumbnailUrl ? (
                        <img
                          src={meta.thumbnailUrl}
                          alt={meta.title}
                          className="w-10 aspect-video rounded object-cover border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 aspect-video rounded bg-slate-800 flex items-center justify-center shrink-0 border border-slate-750">
                          <span className="text-[9px] font-mono text-slate-500">YT</span>
                        </div>
                      )}
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-medium text-slate-200 truncate leading-snug">
                          {meta?.title || url}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 truncate">
                          {meta?.author || "YouTube"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveYoutubeUrl(url)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
                      title="Retirer la référence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Target duration control */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Durée cible du résumé</label>
            <span className="text-amber-400 font-mono text-xs font-bold">{targetDurationMinutes} min</span>
          </div>
          <input
            type="range"
            min={10}
            max={20}
            step={1}
            value={targetDurationMinutes}
            onChange={(e) => setTargetDurationMinutes(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Minimum 10 minutes pour respecter le seuil des publicités mid-roll YouTube (AdSense). Ajuste le nombre et la
            longueur des séquences générées pour viser environ cette durée.
          </p>
        </div>

        {/* Custom Guidelines */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">Instructions supplémentaires de ton (Optionnel)</label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: Utilise un ton humoristique et de l'humour cynique. Insiste sur la théorie de la fin d'Inception..."
            rows={2}
            className="w-full bg-transparent text-slate-300 text-xs placeholder-slate-700 focus:outline-none resize-none"
          />
        </div>

        {/* Voice selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Voix du narrateur IA</label>
              {hasElevenLabs && (
                <div className="flex items-center bg-slate-950 border border-slate-850 p-0.5 rounded-lg gap-0.5">
                  <button
                    onClick={() => setTtsProvider("elevenlabs")}
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded transition-all select-none ${
                      ttsProvider === "elevenlabs" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    ELEVENLABS
                  </button>
                  <button
                    onClick={() => setTtsProvider("gemini")}
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded transition-all select-none ${
                      ttsProvider === "gemini" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    GEMINI
                  </button>
                </div>
              )}
            </div>
            {ttsProvider === "elevenlabs" ? (
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                disabled={isLoadingVoices}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
              >
                {isLoadingVoices ? (
                  <option>Chargement des voix...</option>
                ) : elevenLabsVoices.length > 0 ? (
                  elevenLabsVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))
                ) : (
                  <option>Aucune voix trouvée</option>
                )}
              </select>
            ) : (
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {PREBUILT_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-[11px] leading-relaxed self-end py-1">
            <Languages className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {ttsProvider === "elevenlabs"
                ? "Les voix ElevenLabs Multilingual v2 gèrent le français nativement avec une intonation naturelle."
                : "Les voix de synthèse Gemini s'adaptent naturellement à la langue rédigée de votre script !"}
            </span>
          </div>
        </div>
      </div>

      {bulkTtsProgress && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
          <Loader2 className="w-4 h-4 shrink-0 animate-spin text-amber-400" />
          <div className="flex-1">
            <span className="font-semibold block text-white mb-0.5">Génération automatique des voix-off...</span>
            <span>Segment {bulkTtsProgress.current}/{bulkTtsProgress.total}</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${(bulkTtsProgress.current / bulkTtsProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {fallbackWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-semibold block text-white mb-0.5">Bascule de sécurité active (Fallback automatique)</span>
            <span>{fallbackWarning}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Segments list */}
      {segments.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Séquences du résumé ({segments.length})</span>
            <button
              onClick={handleAddSegment}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une scène</span>
            </button>
          </div>

          <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1" id="segments-timeline">
            {segments.map((seg, idx) => (
              <div
                key={seg.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col gap-3 relative transition-all"
              >
                {/* Scene badge header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-mono text-[10px] text-white font-bold">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={seg.title}
                      onChange={(e) => updateSegmentField(seg.id, "title", e.target.value)}
                      className="bg-transparent text-xs font-semibold text-white focus:outline-none focus:border-b focus:border-amber-500/50 max-w-[200px]"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500">Durée:</span>
                      <input
                        type="number"
                        min="3"
                        max="30"
                        value={seg.duration}
                        onChange={(e) => updateSegmentField(seg.id, "duration", parseInt(e.target.value) || 5)}
                        className="w-10 bg-slate-900 text-white font-mono text-center text-xs rounded border border-slate-800 py-0.5"
                      />
                      <span className="text-[10px] font-mono text-slate-500">s</span>
                    </div>
                    <button
                      onClick={() => handleDeleteSegment(seg.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Supprimer la scène"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Narration script block */}
                <div>
                  <textarea
                    value={seg.narration}
                    onChange={(e) => updateSegmentField(seg.id, "narration", e.target.value)}
                    placeholder="Saisissez la narration parlée..."
                    rows={2}
                    className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-slate-700 font-sans resize-none"
                  />
                </div>

                {/* Clip Cafe Suggested Search */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold shrink-0">Recherche Clip.Cafe :</span>
                    <input
                      type="text"
                      value={seg.suggestedSearch}
                      onChange={(e) => updateSegmentField(seg.id, "suggestedSearch", e.target.value)}
                      className="bg-transparent text-xs text-amber-300 font-mono focus:outline-none flex-1 focus:border-b focus:border-amber-500/30 truncate"
                    />
                  </div>

                  {/* Narrator Voice generation & status */}
                  <div className="flex justify-end gap-2">
                    {seg.ttsAudioUrl ? (
                      <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-1 px-2.5 text-emerald-400 text-[11px] font-medium">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Voix-off prête</span>
                        <button
                          onClick={() => handlePlayAudio(seg.id, seg.ttsAudioUrl!)}
                          className="ml-2 hover:text-white text-emerald-400 bg-slate-900 rounded p-1 transition-colors"
                          title="Écouter la voix-off"
                        >
                          {playingAudioId === seg.id ? <Pause className="w-3 h-3 fill-emerald-400 text-emerald-400" /> : <Play className="w-3 h-3 fill-emerald-400" />}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateTTS(seg.id, seg.narration)}
                        disabled={generatingTtsId !== null || !seg.narration.trim()}
                        className="bg-slate-900 border border-slate-800 hover:border-amber-500/20 hover:text-amber-400 text-slate-300 disabled:text-slate-600 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer select-none"
                      >
                        {generatingTtsId === seg.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                            <span>Génération audio...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" />
                            <span>Générer Audio</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Youtube reference image option */}
                {seg.referenceImage && (
                  <div className="mt-1 bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <img
                      src={seg.referenceImage}
                      alt="Miniature"
                      className="w-20 aspect-video object-cover rounded border border-slate-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] bg-red-600/20 text-red-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                          Image de référence YouTube
                        </span>
                        <button
                          onClick={() => updateSegmentField(seg.id, "useReferenceImage", !seg.useReferenceImage)}
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase transition-all ${
                            seg.useReferenceImage
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {seg.useReferenceImage ? "Activée" : "Désactivée"}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal font-sans">
                        {seg.referenceImageReason || "Suggéré comme illustration conceptuelle non-film (B-roll)."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Display per-beat clip assignment status (not relevant for reference-image segments) */}
                {!seg.useReferenceImage && (seg.beats && seg.beats.length > 0 ? (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">
                        Extraits : {seg.beats.filter(b => b.assignedClip).length}/{seg.beats.length} assignés
                      </span>
                    </div>
                    {seg.beats.map((beat, bIdx) => (
                      <div
                        key={beat.id}
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 gap-2 ${
                          beat.assignedClip
                            ? "bg-amber-500/5 border-amber-500/10"
                            : "bg-slate-900/40 border-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${beat.assignedClip ? "bg-amber-400" : "bg-slate-700"}`} />
                          <span className="text-[9px] text-slate-500 font-mono shrink-0">#{bIdx + 1}</span>
                          {beat.assignedClip ? (
                            <span className="text-[11px] text-white font-medium truncate font-sans">
                              {beat.assignedClip.movie} - "{beat.assignedClip.quote}"
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic truncate font-sans">
                              "{beat.text.slice(0, 50)}{beat.text.length > 50 ? "..." : ""}"
                            </span>
                          )}
                        </div>
                        {beat.assignedClip ? (
                          <button
                            onClick={() => {
                              const newBeats = seg.beats.map((b, i) => i === bIdx ? { ...b, assignedClip: null } : b);
                              updateSegmentField(seg.id, "beats", newBeats);
                            }}
                            className="text-slate-500 hover:text-red-400 text-[10px] font-mono transition-colors shrink-0"
                          >
                            Détacher
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                            <span>Cherchez</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between bg-slate-900/40 rounded-lg border border-slate-800/40 px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-500 font-mono italic">Aucune vidéo assignée</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Trouvez un extrait</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

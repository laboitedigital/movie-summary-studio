import React, { useState } from "react";
import { Download, Film, Sparkles, RefreshCw, CheckCircle, AlertTriangle, FileText, Youtube, Share2, Compass } from "lucide-react";
import { ScriptSegment } from "../types";

interface VideoExporterProps {
  movieTitle: string;
  segments: ScriptSegment[];
  duration: number;
}

export default function VideoExporter({
  movieTitle,
  segments,
  duration
}: VideoExporterProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [burnSubtitles, setBurnSubtitles] = useState(false);
  const [antiDetectionEffects, setAntiDetectionEffects] = useState(true);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStep, setRenderStep] = useState("");
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  
  // YouTube Optimization generator
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<{ title: string; description: string; tags: string } | null>(null);

  const missingClipsCount = segments.filter(seg => {
    const hasAnyBeatClip = (seg.beats || []).some(b => b.assignedClip);
    return !hasAnyBeatClip && !seg.assignedClip && !(seg.useReferenceImage && seg.referenceImage);
  }).length;
  const missingAudioCount = segments.filter(seg => !seg.ttsAudioUrl).length;
  const isReady = segments.length > 0 && missingClipsCount === 0;
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderError(null);
    setRenderStep("Envoi des séquences au serveur de rendu...");

    try {
      const startRes = await fetch("/api/render/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieTitle, segments, burnSubtitles, antiDetectionEffects }),
      });

      if (!startRes.ok) {
        const errData = await startRes.json().catch(() => ({}));
        throw new Error(errData.error || "Impossible de démarrer le rendu.");
      }

      const { jobId } = await startRes.json();

      // Poll for progress until done or error
      await new Promise<void>((resolve, reject) => {
        const poll = async () => {
          try {
            const statusRes = await fetch(`/api/render/status/${jobId}`);
            if (!statusRes.ok) {
              throw new Error("Impossible de récupérer l'état du rendu.");
            }
            const job = await statusRes.json();
            setRenderProgress(job.progress || 0);
            setRenderStep(job.label || "");

            if (job.status === "done") {
              setRenderedUrl(job.downloadUrl);
              resolve();
            } else if (job.status === "error") {
              reject(new Error(job.error || "Le rendu vidéo a échoué."));
            } else {
              setTimeout(poll, 1500);
            }
          } catch (e) {
            reject(e);
          }
        };
        poll();
      });
    } catch (err: any) {
      console.error(err);
      setRenderError(err.message || "Une erreur est survenue pendant le rendu de la vidéo.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleGenerateYoutubeMetadata = async () => {
    setIsGeneratingMetadata(true);
    try {
      const summaryText = segments.map((seg, idx) => `[Séquence ${idx + 1}] ${seg.title}: ${seg.narration}`).join("\n");
      const prompt = `Génère des métadonnées YouTube optimisées pour le référencement (SEO) pour une vidéo de résumé du film "${movieTitle}".
Voici le plan détaillé du script de la vidéo :
${summaryText}

Rends le résultat strictly en format JSON avec ces trois clés :
- "title" : 3 propositions de titres YouTube ultra-cliquables (avec majuscules, émojis et crochets accrocheurs).
- "description" : Une description YouTube structurée de 3-4 paragraphes, incluant des chapitres d'horodatage fictifs basés sur les segments du script, des mots-clés et un appel à l'action.
- "tags" : Une liste de 15 tags pertinents séparés par des virgules.`;

      const response = await fetch("/api/gemini/generate-script", { // we can reuse the generic endpoint by checking prompt
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieTitle,
          customInstructions: prompt,
          language: "French"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMetadata({
          title: data.title || `${movieTitle} RÉSUMÉ COMPLET (En 5 Minutes !)`,
          description: data.description || `Voici le résumé du film d'aujourd'hui : ${movieTitle}.\n\nN'oubliez pas d'aimer, de vous abonner et de cliquer sur la cloche pour ne rater aucun résumé !`,
          tags: data.tags || `${movieTitle}, résumé de film, film complet, explication fin`
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6" id="video-exporter">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 font-sans">
          <Film className="w-5 h-5 text-amber-400" />
          <span>Exportation & Métadonnées YouTube</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Compilez vos séquences éditées en une vidéo MP4 fluide prête pour YouTube, et générez des titres et descriptions optimisés par l'IA.
        </p>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clips Check */}
        <div className={`p-4 rounded-xl border flex flex-col gap-1 select-none ${missingClipsCount === 0 ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-slate-950 border-slate-850 text-slate-400"}`}>
          <span className="text-[10px] font-mono font-bold uppercase">Extraits Vidéo</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-sans">{segments.length - missingClipsCount}</span>
            <span className="text-xs opacity-70">/ {segments.length} assignés</span>
          </div>
          {missingClipsCount > 0 && (
            <span className="text-[10px] text-amber-400 font-medium mt-1">
              {missingClipsCount} scène(s) requièrent un extrait.
            </span>
          )}
        </div>

        {/* Audio Check */}
        <div className={`p-4 rounded-xl border flex flex-col gap-1 select-none ${missingAudioCount === 0 ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-slate-950 border-slate-850 text-slate-400"}`}>
          <span className="text-[10px] font-mono font-bold uppercase">Voix-Off Audio</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-sans">{segments.length - missingAudioCount}</span>
            <span className="text-xs opacity-70">/ {segments.length} générées</span>
          </div>
          {missingAudioCount > 0 && (
            <span className="text-[10px] text-amber-400 font-medium mt-1">
              Générez la narration vocale pour chaque scène.
            </span>
          )}
        </div>

        {/* Total Time */}
        <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col gap-1 text-slate-400 select-none">
          <span className="text-[10px] font-mono font-bold uppercase">Durée Totale estimée</span>
          <div className="flex items-baseline gap-1 mt-1 text-white">
            <span className="text-2xl font-bold font-sans">{duration.toFixed(0)}</span>
            <span className="text-xs opacity-70">secondes de vidéo</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Format idéal pour Shorts ou Reel.</span>
        </div>
      </div>

      {/* Action panel */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-4">
        {isRendering ? (
          <div className="w-full flex flex-col items-center justify-center gap-4 py-4">
            <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
            <div className="w-full max-w-md bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-white font-mono">{renderProgress}% complété</span>
              <span className="text-[11px] text-slate-500 font-mono italic">{renderStep}</span>
            </div>
          </div>
        ) : renderedUrl ? (
          <div className="py-2 flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <div className="flex flex-col gap-1 text-center">
              <h3 className="text-sm font-bold text-white">Vidéo Résumé Compilée !</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Le fichier de votre vidéo de résumé pour <strong>{movieTitle}</strong> a été assemblé avec succès.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href={renderedUrl}
                download={`${movieTitle.toLowerCase().replace(/\s+/g, "_")}_resume.mp4`}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger la Vidéo MP4</span>
              </a>
              <button
                onClick={() => setRenderedUrl(null)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white font-mono text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Re-monter
              </button>
            </div>
            <video
              src={renderedUrl}
              controls
              className="w-full max-w-md rounded-xl border border-slate-800 mt-2"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            {renderError && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-start gap-2 max-w-md text-left">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-300">{renderError}</span>
              </div>
            )}
            {!isReady && (
              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex items-center gap-2 max-w-md text-left">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-[11px] text-amber-400">
                  Note : Vous devez associer un extrait vidéo (ou une image de référence) à toutes vos séquences pour pouvoir effectuer l'export final de votre vidéo.
                </span>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={burnSubtitles}
                onChange={(e) => setBurnSubtitles(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-amber-500"
              />
              <span>Incruster les sous-titres jaunes sur la vidéo (désactivé par défaut)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={antiDetectionEffects}
                onChange={(e) => setAntiDetectionEffects(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-amber-500"
              />
              <span>Effets visuels anti-détection sur les extraits (miroir, léger zoom, filtre couleur — activé par défaut)</span>
            </label>
            <button
              onClick={handleStartRender}
              disabled={!isReady}
              className="bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 font-bold px-6 py-3 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10 select-none cursor-pointer"
              id="render-video-btn"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compiler la Vidéo Summary</span>
            </button>
          </div>
        )}
      </div>

      {/* YouTube Optimization Suite */}
      {isReady && (
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">Boîte à Outils YouTube SEO</span>
            </div>
            {!metadata && (
              <button
                onClick={handleGenerateYoutubeMetadata}
                disabled={isGeneratingMetadata}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                {isGeneratingMetadata ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                <span>Générer les Titres & Description IA</span>
              </button>
            )}
          </div>

          {isGeneratingMetadata && (
            <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
              <span>Génération des métadonnées cliquables...</span>
            </div>
          )}

          {metadata && (
            <div className="flex flex-col gap-4 text-left border-t border-slate-900 pt-4" id="youtube-seo-suite">
              {/* Proposed Titles */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Idées de Titres accrocheurs</span>
                <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 text-xs text-amber-100 font-semibold font-sans space-y-1">
                  {typeof metadata.title === 'string' ? (
                    <p>{metadata.title}</p>
                  ) : Array.isArray(metadata.title) ? (
                    (metadata.title as string[]).map((t: string, i: number) => <p key={i}>🔥 {t}</p>)
                  ) : (
                    Object.values(metadata.title).map((t: any, i: number) => <p key={i}>🎬 {t}</p>)
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Description pré-remplie avec Horodatages</span>
                <textarea
                  readOnly
                  value={metadata.description}
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-3 text-xs text-slate-300 font-sans focus:outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Tags de recherche (SEO)</span>
                <div className="bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-400 font-mono">
                  {metadata.tags}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

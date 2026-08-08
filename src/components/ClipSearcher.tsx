import React, { useState, useEffect } from "react";
import { Search, Film, Play, Check, RefreshCw, Layers, Sparkles, HelpCircle, FilmIcon, Video } from "lucide-react";
import { MovieClip, ScriptSegment } from "../types";

interface ClipSearcherProps {
  segments: ScriptSegment[];
  setSegments: (segments: ScriptSegment[]) => void;
  activeSegmentIndex: number;
}

export default function ClipSearcher({
  segments,
  setSegments,
  activeSegmentIndex
}: ClipSearcherProps) {
  const activeSegment = segments[activeSegmentIndex];
  const beats = activeSegment?.beats || [];

  const [activeBeatIndex, setActiveBeatIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Official trailer extraction state
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trailerStreamUrl, setTrailerStreamUrl] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [trailerError, setTrailerError] = useState<string | null>(null);
  const [trailerStart, setTrailerStart] = useState<number | null>(null);
  const [trailerEnd, setTrailerEnd] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const trailerVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [clips, setClips] = useState<MovieClip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasClipCafeKey, setHasClipCafeKey] = useState(false);
  
  // Local video preview modal or overlay
  const [previewClipId, setPreviewClipId] = useState<string | null>(null);
  const previewVideoRef = React.useRef<HTMLVideoElement | null>(null);

  // Custom trim range within a previewed Clip.Cafe result (mirrors the trailer trim UX,
  // letting the user pick exactly which few seconds of a longer clip to use).
  const [trimStart, setTrimStart] = useState<number | null>(null);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);
  const [isTrimmingClip, setIsTrimmingClip] = useState(false);
  const [trimClipError, setTrimClipError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasClipCafe) {
          setHasClipCafeKey(true);
        }
      })
      .catch((err) => console.error("Error fetching config in ClipSearcher:", err));
  }, []);

  // Reset to the first beat whenever the active segment changes
  useEffect(() => {
    setActiveBeatIndex(0);
  }, [activeSegmentIndex]);

  const activeBeat = beats[activeBeatIndex] || null;

  // Sync searchQuery with the active beat's suggested search terms
  useEffect(() => {
    if (activeBeat) {
      setSearchQuery(activeBeat.suggestedSearch || "");
      if (activeBeat.suggestedSearch) {
        handleSearchClips(activeBeat.suggestedSearch);
      }
    }
  }, [activeSegmentIndex, activeBeatIndex, activeBeat?.suggestedSearch]);

  const handleSearchClips = async (queryToSearch = searchQuery) => {
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    setError(null);
    setPreviewClipId(null);

    try {
      const response = await fetch(`/api/clips/search?q=${encodeURIComponent(queryToSearch)}`);
      if (!response.ok) {
        throw new Error("Impossible de récupérer les extraits de films.");
      }
      const data = await response.json();
      setClips(data);
    } catch (err: any) {
      console.error(err);
      setError("Erreur de recherche : Impossible de joindre Clip.Cafe.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadTrailer = async () => {
    if (!trailerUrl.trim()) return;
    setIsLoadingTrailer(true);
    setTrailerError(null);
    setTrailerStreamUrl(null);
    setTrailerStart(null);
    setTrailerEnd(null);

    try {
      const res = await fetch(`/api/trailer/preview-url?url=${encodeURIComponent(trailerUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de charger cette bande-annonce.");
      setTrailerStreamUrl(data.streamUrl);
    } catch (err: any) {
      setTrailerError(err.message || "Erreur lors du chargement de la bande-annonce.");
    } finally {
      setIsLoadingTrailer(false);
    }
  };

  const handleMarkStart = () => {
    if (trailerVideoRef.current) setTrailerStart(trailerVideoRef.current.currentTime);
  };

  const handleMarkEnd = () => {
    if (trailerVideoRef.current) setTrailerEnd(trailerVideoRef.current.currentTime);
  };

  const handleExtractTrailerClip = async () => {
    if (trailerStart === null || trailerEnd === null || !activeBeat) return;
    setIsExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch("/api/trailer/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: trailerUrl.trim(),
          start: Math.min(trailerStart, trailerEnd),
          end: Math.max(trailerStart, trailerEnd),
          movieTitle: activeSegment?.title || "Bande-annonce",
        }),
      });
      const clip = await res.json();
      if (!res.ok) throw new Error(clip.error || "Impossible d'extraire cet extrait.");
      handleAssignClip(clip);
      setTrailerStart(null);
      setTrailerEnd(null);
    } catch (err: any) {
      setExtractError(err.message || "Erreur lors de l'extraction.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAssignClip = (clip: MovieClip) => {
    if (!activeSegment || beats.length === 0) return;

    const newBeats = beats.map((beat, idx) => idx === activeBeatIndex ? { ...beat, assignedClip: clip } : beat);

    setSegments(segments.map(seg => {
      if (seg.id === activeSegment.id) {
        return {
          ...seg,
          beats: newBeats,
          // Sync duration to at least cover the sum of clip durations if larger than current estimate
          duration: Math.max(seg.duration, clip.duration || 6)
        };
      }
      return seg;
    }));

    // Auto-advance to the next unfilled beat for a faster workflow
    const nextUnfilled = newBeats.findIndex((b, idx) => idx > activeBeatIndex && !b.assignedClip);
    if (nextUnfilled !== -1) {
      setActiveBeatIndex(nextUnfilled);
    } else {
      const firstUnfilled = newBeats.findIndex((b) => !b.assignedClip);
      if (firstUnfilled !== -1) setActiveBeatIndex(firstUnfilled);
    }
  };

  const handlePreviewClip = (clipId: string) => {
    if (previewClipId === clipId) {
      setPreviewClipId(null);
    } else {
      setPreviewClipId(clipId);
    }
    setTrimStart(null);
    setTrimEnd(null);
    setTrimClipError(null);
  };

  const handleMarkClipStart = () => {
    if (previewVideoRef.current) setTrimStart(previewVideoRef.current.currentTime);
  };

  const handleMarkClipEnd = () => {
    if (previewVideoRef.current) setTrimEnd(previewVideoRef.current.currentTime);
  };

  const handleTrimAndAssignClip = async (clip: MovieClip) => {
    if (trimStart === null || trimEnd === null || !activeBeat) return;
    setIsTrimmingClip(true);
    setTrimClipError(null);

    try {
      const res = await fetch("/api/clip-cafe/trim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: clip.videoUrl,
          start: trimStart,
          end: trimEnd,
          movie: clip.movie,
          quote: clip.quote,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Échec du découpage de l'extrait.");
      }

      const trimmedClip: MovieClip = await res.json();
      handleAssignClip(trimmedClip);
      setPreviewClipId(null);
      setTrimStart(null);
      setTrimEnd(null);
    } catch (err: any) {
      console.error(err);
      setTrimClipError(err.message || "Impossible de découper cet extrait.");
    } finally {
      setIsTrimmingClip(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6" id="clip-searcher">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 font-sans">
            <Film className="w-5 h-5 text-amber-400" />
            <span>Recherche d'Extraits de Films (Clip.Cafe)</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Cherchez des dialogues mythiques ou des actions phares de films. Sélectionnez l'extrait parfait pour l'associer à la scène en cours.
          </p>
        </div>
        {hasClipCafeKey && (
          <div className="self-start sm:self-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>PROXY PRO CLÉ ACTIF</span>
          </div>
        )}
      </div>

      {/* Active Segment context Banner */}
      {activeSegment ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col gap-3 select-none">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-0.5 truncate">
              <span className="text-[10px] uppercase font-bold text-amber-400 font-mono">Séquence Active de Montage</span>
              <span className="text-xs font-semibold text-white truncate font-sans">
                {activeSegmentIndex + 1}. {activeSegment.title}
              </span>
            </div>
            <div className="px-2.5 py-1 bg-slate-950 rounded-lg text-amber-300 font-mono text-[10px] font-bold shrink-0 border border-slate-800">
              DURÉE: {activeSegment.duration}s
            </div>
          </div>

          {beats.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] uppercase font-bold text-amber-300/70 font-mono">
                  Beats ({beats.filter(b => b.assignedClip).length}/{beats.length} extraits assignés — ~7s chacun)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {beats.map((beat, idx) => (
                  <button
                    key={beat.id}
                    onClick={() => setActiveBeatIndex(idx)}
                    title={beat.text}
                    className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-all flex items-center gap-1.5 max-w-[220px] ${
                      idx === activeBeatIndex
                        ? "bg-amber-500 text-slate-950 border-amber-500 font-bold"
                        : beat.assignedClip
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${beat.assignedClip ? (idx === activeBeatIndex ? "bg-slate-950" : "bg-amber-400") : "bg-slate-700"}`} />
                    <span className="truncate">#{idx + 1} {beat.suggestedSearch}</span>
                  </button>
                ))}
              </div>
              {activeBeat && (
                <p className="text-[11px] text-slate-300 italic truncate font-sans mt-2">
                  "{activeBeat.text}"
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-850">
          <p className="text-slate-500 text-xs">Veuillez d'abord générer un script ci-dessus.</p>
        </div>
      )}

      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClips()}
            placeholder="Saisissez un dialogue ou un mot-clé (ex: spoon, i will be back)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all font-sans"
            id="clip-search-input"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>
        <button
          onClick={() => handleSearchClips()}
          disabled={isSearching || !searchQuery.trim()}
          className="bg-slate-850 hover:bg-slate-800 border border-slate-800 disabled:text-slate-600 font-bold px-4 rounded-xl text-xs transition-all text-white flex items-center gap-1.5 select-none"
          id="clip-search-btn"
        >
          {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Search className="w-3.5 h-3.5" />}
          <span>Rechercher</span>
        </button>
      </div>

      {/* Official Trailer Extraction */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
            Bande-annonce officielle (optionnel)
          </span>
        </div>
        <p className="text-[10px] text-slate-500">
          Colle le lien YouTube de la bande-annonce officielle pour en extraire toi-même un passage (max 20s par extraction) et l'associer au beat actif.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={trailerUrl}
            onChange={(e) => setTrailerUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 font-mono"
          />
          <button
            onClick={handleLoadTrailer}
            disabled={isLoadingTrailer || !trailerUrl.trim()}
            className="bg-slate-850 hover:bg-slate-800 border border-slate-800 disabled:text-slate-600 font-bold px-4 rounded-lg text-xs transition-all text-white flex items-center gap-1.5 shrink-0"
          >
            {isLoadingTrailer ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : null}
            <span>Charger</span>
          </button>
        </div>

        {trailerError && <p className="text-[11px] text-red-400">{trailerError}</p>}

        {trailerStreamUrl && (
          <div className="flex flex-col gap-2">
            <video
              ref={trailerVideoRef}
              src={trailerStreamUrl}
              controls
              className="w-full rounded-lg border border-slate-800 max-h-[260px]"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleMarkStart}
                className="bg-slate-850 hover:bg-slate-800 border border-slate-800 font-bold px-3 py-1.5 rounded-lg text-[11px] text-white"
              >
                Marquer début {trailerStart !== null ? `(${trailerStart.toFixed(1)}s)` : ""}
              </button>
              <button
                onClick={handleMarkEnd}
                className="bg-slate-850 hover:bg-slate-800 border border-slate-800 font-bold px-3 py-1.5 rounded-lg text-[11px] text-white"
              >
                Marquer fin {trailerEnd !== null ? `(${trailerEnd.toFixed(1)}s)` : ""}
              </button>
              <button
                onClick={handleExtractTrailerClip}
                disabled={trailerStart === null || trailerEnd === null || isExtracting || !activeBeat}
                className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5"
              >
                {isExtracting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>Extraire et associer au beat #{activeBeatIndex + 1}</span>
              </button>
            </div>
            {extractError && <p className="text-[11px] text-red-400">{extractError}</p>}
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          <span>Utilisation du catalogue de secours de haute qualité.</span>
        </div>
      )}

      {/* Results grid */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        {isSearching ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-slate-400 text-xs font-mono">Crawl de Clip.Cafe en cours...</p>
          </div>
        ) : clips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="clips-grid">
            {clips.map((clip) => {
              const isAssigned = activeBeat?.assignedClip?.videoUrl === clip.videoUrl;
              const isPreviewing = previewClipId === clip.id;

              return (
                <div
                  key={clip.id}
                  className={`border rounded-xl overflow-hidden flex flex-col bg-slate-950 transition-all ${
                    isAssigned 
                      ? "border-amber-500 ring-1 ring-amber-500/20" 
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Thumbnail / Video Preview aspect ratio 16:9 */}
                  <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center group">
                    {isPreviewing ? (
                      <>
                        <video
                          ref={previewVideoRef}
                          src={clip.videoUrl}
                          className="w-full h-full object-cover"
                          controls
                          autoPlay
                          playsInline
                        />
                      </>
                    ) : (
                      <>
                        <img
                          src={clip.thumbnail || `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop`}
                          alt={clip.movie}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const fallback = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop";
                            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                          }}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-all"
                        />
                        <button
                          onClick={() => handlePreviewClip(clip.id)}
                          className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-md"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                      </>
                    )}

                    {/* Clip info tags */}
                    <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-amber-400 uppercase tracking-wide border border-slate-800 select-none">
                      {clip.duration}s
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide truncate">
                        {clip.movie}
                      </span>
                      <p className="text-xs font-semibold text-white leading-relaxed line-clamp-2 italic font-sans">
                        "{clip.quote}"
                      </p>
                    </div>

                    {isPreviewing && (
                      <div className="flex flex-col gap-1.5 bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">
                          Découper un passage précis (comme sur Clip.Cafe) :
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={handleMarkClipStart}
                            className="bg-slate-850 hover:bg-slate-800 border border-slate-800 font-bold px-2 py-1 rounded text-[10px] text-white"
                          >
                            Début {trimStart !== null ? `(${trimStart.toFixed(1)}s)` : ""}
                          </button>
                          <button
                            onClick={handleMarkClipEnd}
                            className="bg-slate-850 hover:bg-slate-800 border border-slate-800 font-bold px-2 py-1 rounded text-[10px] text-white"
                          >
                            Fin {trimEnd !== null ? `(${trimEnd.toFixed(1)}s)` : ""}
                          </button>
                          <button
                            onClick={() => handleTrimAndAssignClip(clip)}
                            disabled={trimStart === null || trimEnd === null || isTrimmingClip || !activeBeat}
                            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1"
                          >
                            {isTrimmingClip ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                            <span>Découper et associer</span>
                          </button>
                        </div>
                        {trimClipError && <p className="text-[10px] text-red-400">{trimClipError}</p>}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreviewClip(clip.id)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold text-center border transition-all ${
                          isPreviewing 
                            ? "bg-slate-900 text-white border-slate-700" 
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {isPreviewing ? "Fermer" : "Aperçu"}
                      </button>
                      <button
                        onClick={() => handleAssignClip(clip)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          isAssigned
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                        }`}
                        disabled={!activeBeat}
                      >
                        {isAssigned ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Associé</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-3.5 h-3.5" />
                            <span>Associer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-8 text-center select-none">
            <FilmIcon className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-sm font-semibold text-slate-400">Aucun extrait trouvé</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xs">
              Saisissez un mot de dialogue ou un mot-clé précis pour déclencher la recherche sur Clip.Cafe ou utiliser nos fallbacks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

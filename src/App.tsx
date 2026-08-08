import React, { useState, useEffect } from "react";
import { Film, Play, Sparkles, HelpCircle, Layers, Clapperboard, Youtube, Tv, ListCollapse, MessageSquareDot } from "lucide-react";
import { ScriptSegment } from "./types";
import { FALLBACK_CATALOG } from "./fallbackCatalog";
import PreviewPlayer from "./components/PreviewPlayer";
import ScriptGenerator from "./components/ScriptGenerator";
import ClipSearcher from "./components/ClipSearcher";
import Timeline from "./components/Timeline";
import VideoExporter from "./components/VideoExporter";

// Initialize a beautiful, highly engaging preloaded project (Inception) so the user isn't greeted by a blank state
const INITIAL_SEGMENTS: ScriptSegment[] = [
  {
    id: "pre-1",
    title: "1. L'Accroche",
    narration: "Aujourd'hui, on résume Inception. Un thriller psychologique révolutionnaire où le monde réel s'entremêle avec l'illusion des rêves.",
    suggestedSearch: "we need to go deeper",
    duration: 7,
    beats: [{ id: "beat-pre-1-0", text: "Aujourd'hui, on résume Inception. Un thriller psychologique révolutionnaire où le monde réel s'entremêle avec l'illusion des rêves.", suggestedSearch: "we need to go deeper", assignedClip: FALLBACK_CATALOG[0] }],
    assignedClip: FALLBACK_CATALOG[0], // "We need to go deeper"
    ttsAudioUrl: null
  },
  {
    id: "pre-2",
    title: "2. Le Voleur d'idées",
    narration: "Dom Cobb est un extracteur professionnel capable de s'infiltrer dans votre subconscient pour voler vos secrets les plus précieux.",
    suggestedSearch: "what is the most resilient parasite",
    duration: 8,
    beats: [{ id: "beat-pre-2-0", text: "Dom Cobb est un extracteur professionnel capable de s'infiltrer dans votre subconscient pour voler vos secrets les plus précieux.", suggestedSearch: "what is the most resilient parasite", assignedClip: FALLBACK_CATALOG[1] }],
    assignedClip: FALLBACK_CATALOG[1], // "An idea. Resilient. Highly contagious."
    ttsAudioUrl: null
  },
  {
    id: "pre-3",
    title: "3. Le Piège des Rêves",
    narration: "Sa nouvelle mission n'est pas de voler, mais d'implanter une idée. Un voyage périlleux au risque de se perdre à jamais.",
    suggestedSearch: "youre waiting for a train",
    duration: 8,
    beats: [{ id: "beat-pre-3-0", text: "Sa nouvelle mission n'est pas de voler, mais d'implanter une idée. Un voyage périlleux au risque de se perdre à jamais.", suggestedSearch: "youre waiting for a train", assignedClip: FALLBACK_CATALOG[2] }],
    assignedClip: FALLBACK_CATALOG[2], // "You're waiting for a train..."
    ttsAudioUrl: null
  },
  {
    id: "pre-4",
    title: "4. Est-ce Réel ?",
    narration: "À la fin, la toupie continue de tourner. Sommes-nous éveillés ou piégés dans un songe ? Abonnez-vous pour plus de résumés !",
    suggestedSearch: "spinning top",
    duration: 7,
    beats: [{ id: "beat-pre-4-0", text: "À la fin, la toupie continue de tourner. Sommes-nous éveillés ou piégés dans un songe ? Abonnez-vous pour plus de résumés !", suggestedSearch: "spinning top", assignedClip: FALLBACK_CATALOG[0] }],
    assignedClip: FALLBACK_CATALOG[0], // Spinning top clip fallback
    ttsAudioUrl: null
  }
];

export default function App() {
  const [movieTitle, setMovieTitle] = useState("Inception");
  const [segments, setSegments] = useState<ScriptSegment[]>(INITIAL_SEGMENTS);
  const [voice, setVoice] = useState("Zephyr");

  // Timeline Player States
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  // Calculate total timeline duration
  const totalDuration = segments.reduce((acc, seg) => acc + seg.duration, 0);

  // Update active segment index automatically when currentTime moves
  useEffect(() => {
    let elapsed = 0;
    for (let i = 0; i < segments.length; i++) {
      const end = elapsed + segments[i].duration;
      if (currentTime >= elapsed && currentTime <= end) {
        if (activeSegmentIndex !== i) {
          setActiveSegmentIndex(i);
        }
        break;
      }
      elapsed = end;
    }
  }, [currentTime, segments, activeSegmentIndex]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950" id="studio-root">
      {/* Cinematic Header Banner */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/10">
            <Clapperboard className="w-5.5 h-5.5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
              <span>YouTube Movie Summary Studio</span>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">PRO v1.0</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Automatisez le montage de vos résumés de films en liant vos scripts de narration avec Clip.Cafe.
            </p>
          </div>
        </div>

        {/* Studio Status / Stats */}
        <div className="flex items-center gap-3 text-slate-500 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-lg select-none">
            <Tv className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
            <span className="text-slate-400 font-semibold">CLIP.CAFE PROXY ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Script Generator Cockpit (lg:col-span-5) */}
          <section className="lg:col-span-5 flex flex-col gap-6 h-full">
            <ScriptGenerator
              movieTitle={movieTitle}
              setMovieTitle={setMovieTitle}
              segments={segments}
              setSegments={setSegments}
              voice={voice}
              setVoice={setVoice}
            />
          </section>

          {/* Right Panel: Live Player monitor & search (lg:col-span-7) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Preview Monitor */}
              <PreviewPlayer
                segments={segments}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                duration={totalDuration}
                activeSegmentIndex={activeSegmentIndex}
              />

              {/* Clip Cafe Clip Searcher */}
              <ClipSearcher
                segments={segments}
                setSegments={setSegments}
                activeSegmentIndex={activeSegmentIndex}
              />
            </div>
          </section>
        </div>

        {/* Bottom Panel: Interactive editing Timeline & Exporter */}
        <div className="grid grid-cols-1 gap-6 mt-2">
          {/* Multi-track Timeline */}
          <Timeline
            segments={segments}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            activeSegmentIndex={activeSegmentIndex}
            setActiveSegmentIndex={setActiveSegmentIndex}
            duration={totalDuration}
          />

          {/* Video Exporter & Youtube SEO metadata Suite */}
          <VideoExporter
            movieTitle={movieTitle}
            segments={segments}
            duration={totalDuration}
          />
        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="border-t border-slate-900 py-6 mt-12 bg-slate-950/30 text-center flex flex-col items-center justify-center gap-2 select-none">
        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
          <span>Crafted in AI Studio Workspace</span>
          <span className="text-slate-700">•</span>
          <span>© 2026 YouTube Summary Studio Inc.</span>
        </div>
        <p className="text-[10px] text-slate-600 max-w-md">
          Cette application utilise les API Gemini pour la génération de scripts et de narrations de synthèse vocale adaptées aux créateurs de contenu cinéma.
        </p>
      </footer>
    </div>
  );
}

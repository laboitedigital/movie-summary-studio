import React, { useRef } from "react";
import { Mic, Video, Type, Clock, Music } from "lucide-react";
import { ScriptSegment } from "../types";

interface TimelineProps {
  segments: ScriptSegment[];
  currentTime: number;
  setCurrentTime: (time: number) => void;
  activeSegmentIndex: number;
  setActiveSegmentIndex: (index: number) => void;
  duration: number;
}

export default function Timeline({
  segments,
  currentTime,
  setCurrentTime,
  activeSegmentIndex,
  setActiveSegmentIndex,
  duration
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Compute segment start times
  const getSegmentStarts = () => {
    let elapsed = 0;
    return segments.map((seg) => {
      const start = elapsed;
      elapsed += seg.duration;
      return start;
    });
  };

  const segmentStarts = getSegmentStarts();

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = Math.max(0, Math.min(percentage * duration, duration));
    setCurrentTime(targetTime);

    // Find and set corresponding active segment index
    let elapsed = 0;
    for (let i = 0; i < segments.length; i++) {
      const end = elapsed + segments[i].duration;
      if (targetTime >= elapsed && targetTime <= end) {
        setActiveSegmentIndex(i);
        break;
      }
      elapsed = end;
    }
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4" id="editor-timeline-panel">
      {/* Panel title */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-white">Banc de Montage & Timecode</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1 rounded-lg text-xs font-mono font-bold text-amber-400">
          TIMECODE: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="relative mt-2 bg-slate-950 rounded-xl border border-slate-800 p-4 select-none flex flex-col gap-4 overflow-hidden">
        {/* Seek playhead indicator line */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-20 pointer-events-none transition-all duration-75"
          style={{ left: `calc(${playheadPercent}% + 96px)` }} // Adjusted for label column width (96px)
        />

        {/* TRACK 1: SCRIPT SCENES */}
        <div className="flex items-center gap-4 relative">
          <div className="w-20 text-right flex items-center justify-end gap-1.5 shrink-0 text-slate-400 font-mono text-[10px] uppercase font-bold">
            <Type className="w-3.5 h-3.5 text-slate-500" />
            <span>Script</span>
          </div>
          <div className="flex-1 h-14 bg-slate-900/60 rounded-lg flex relative border border-slate-850 overflow-hidden">
            {segments.map((seg, idx) => {
              const widthPct = (seg.duration / duration) * 100;
              const isActive = idx === activeSegmentIndex;
              return (
                <button
                  key={seg.id}
                  onClick={() => setActiveSegmentIndex(idx)}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full border-r border-slate-950/40 px-3 py-1.5 text-left flex flex-col justify-between transition-all select-none focus:outline-none ${
                    isActive 
                      ? "bg-amber-500/20 text-amber-300 border-y border-amber-500/30" 
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wide">
                    SÉQ {idx + 1}
                  </span>
                  <span className="text-[11px] font-semibold truncate font-sans leading-tight">
                    {seg.title}
                  </span>
                  <span className="text-[9px] font-mono text-right opacity-60 self-end">
                    {seg.duration}s
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TRACK 2: NARRATION AUDIO */}
        <div className="flex items-center gap-4 relative">
          <div className="w-20 text-right flex items-center justify-end gap-1.5 shrink-0 text-slate-400 font-mono text-[10px] uppercase font-bold">
            <Mic className="w-3.5 h-3.5 text-slate-500" />
            <span>Voix-Off</span>
          </div>
          <div className="flex-1 h-11 bg-slate-900/60 rounded-lg flex relative border border-slate-850 overflow-hidden">
            {segments.map((seg, idx) => {
              const widthPct = (seg.duration / duration) * 100;
              const hasVoice = seg.ttsAudioUrl !== null;
              return (
                <div
                  key={seg.id}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full border-r border-slate-950/40 p-2 flex items-center gap-1.5 ${
                    hasVoice 
                      ? "bg-emerald-500/10 border-y border-emerald-500/20 text-emerald-400" 
                      : "bg-slate-900/40 text-slate-600"
                  }`}
                >
                  {hasVoice ? (
                    <div className="flex items-center gap-1.5 w-full">
                      {/* Decorative waveform */}
                      <div className="flex items-end gap-0.5 h-4 w-6 shrink-0">
                        <div className="w-0.5 h-1/2 bg-emerald-500/70 rounded-full animate-pulse" />
                        <div className="w-0.5 h-full bg-emerald-500/90 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                        <div className="w-0.5 h-1/3 bg-emerald-500/60 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                        <div className="w-0.5 h-3/4 bg-emerald-500/80 rounded-full animate-pulse" style={{ animationDelay: "0.05s" }} />
                      </div>
                      <span className="text-[10px] font-mono truncate">Audio Généré</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono italic truncate">Muet (générer audio)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TRACK 3: MOVIE CLIPS */}
        <div className="flex items-center gap-4 relative">
          <div className="w-20 text-right flex items-center justify-end gap-1.5 shrink-0 text-slate-400 font-mono text-[10px] uppercase font-bold">
            <Video className="w-3.5 h-3.5 text-slate-500" />
            <span>Extraits</span>
          </div>
          <div className="flex-1 h-12 bg-slate-900/60 rounded-lg flex relative border border-slate-850 overflow-hidden">
            {segments.map((seg, idx) => {
              const widthPct = (seg.duration / duration) * 100;
              const beatClips = (seg.beats || []).filter(b => b.assignedClip);
              const hasClip = beatClips.length > 0 || seg.assignedClip !== null;
              const firstClip = beatClips[0]?.assignedClip || seg.assignedClip;
              return (
                <div
                  key={seg.id}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full border-r border-slate-950/40 px-2 py-1 flex flex-col justify-center gap-0.5 ${
                    hasClip 
                      ? "bg-amber-500/10 border-y border-amber-500/20 text-amber-300" 
                      : "bg-slate-900/40 text-slate-600"
                  }`}
                >
                  {hasClip && firstClip ? (
                    <>
                      <span className="text-[9px] font-bold uppercase truncate tracking-wider font-mono text-amber-400 leading-tight">
                        {firstClip.movie}{beatClips.length > 1 ? ` (+${beatClips.length - 1})` : ""}
                      </span>
                      <span className="text-[10px] font-sans truncate leading-none text-white">
                        "{firstClip.quote}"
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono italic truncate text-slate-600">Rechercher Clip.Cafe</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TIMELINE RULER */}
        <div className="flex items-center gap-4 mt-1 border-t border-slate-900 pt-3">
          <div className="w-20 shrink-0" />
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            className="flex-1 h-6 relative bg-slate-900/40 border border-slate-800 rounded-lg cursor-crosshair flex items-center px-2 select-none"
          >
            {/* Markers */}
            <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] font-mono text-slate-500">
              <span>0.00s</span>
              <span>{(duration * 0.25).toFixed(1)}s</span>
              <span>{(duration * 0.5).toFixed(1)}s</span>
              <span>{(duration * 0.75).toFixed(1)}s</span>
              <span>{duration.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Type as TypeIcon } from "lucide-react";
import { ScriptSegment } from "../types";

interface PreviewPlayerProps {
  segments: ScriptSegment[];
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  duration: number;
  activeSegmentIndex: number;
}

export default function PreviewPlayer({
  segments,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  duration,
  activeSegmentIndex
}: PreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showSubtitles, setShowSubtitles] = useState(true);

  // Calculate segment timeline bounds
  const getSegmentBounds = () => {
    let elapsed = 0;
    return segments.map((seg) => {
      const start = elapsed;
      const end = elapsed + seg.duration;
      elapsed = end;
      return { start, end };
    });
  };

  const bounds = getSegmentBounds();
  const activeSegment = segments[activeSegmentIndex];
  const activeBound = bounds[activeSegmentIndex];

  // The first beat-assigned clip is used as the representative preview clip for this segment
  // (the full multi-clip cut sequence is only realized at final ffmpeg render time).
  const primaryClip = (activeSegment?.beats || []).find(b => b.assignedClip)?.assignedClip || activeSegment?.assignedClip || null;

  // Sync Video source and local playback time based on global timeline
  useEffect(() => {
    if (!videoRef.current) return;

    if (primaryClip?.videoUrl) {
      setVideoError(null);
      
      // Determine if video source changed
      const currentSrc = videoRef.current.src;
      const targetSrc = primaryClip!.videoUrl;
      
      if (currentSrc !== targetSrc) {
        videoRef.current.src = targetSrc;
        videoRef.current.load();
      }

      // Map global currentTime to clip's local playback position
      if (activeBound) {
        const localOffset = currentTime - activeBound.start;
        const clipDuration = primaryClip!.duration || 5;
        // Loop locally if the segment duration is longer than the clip duration
        const targetLocalTime = localOffset % clipDuration;
        
        if (Math.abs(videoRef.current.currentTime - targetLocalTime) > 0.5) {
          videoRef.current.currentTime = targetLocalTime;
        }
      }

      // Sync play/pause state
      if (isPlaying) {
        videoRef.current.play().catch((err) => {
          console.warn("Video autoplay blocked or failed:", err);
        });
      } else {
        videoRef.current.pause();
      }
    } else {
      videoRef.current.pause();
    }
  }, [activeSegment, isPlaying, activeBound, currentTime]);

  // Handle Narration Audio playback
  useEffect(() => {
    // Cleanup active audio element if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!isPlaying) return;

    if (activeSegment?.ttsAudioUrl) {
      // Re-create audio element
      const audio = new Audio(activeSegment.ttsAudioUrl);
      audio.muted = isMuted;
      audioRef.current = audio;

      // Calculate start time in the TTS audio
      if (activeBound) {
        const localOffset = currentTime - activeBound.start;
        if (localOffset >= 0 && localOffset < activeSegment.duration) {
          audio.currentTime = localOffset;
          audio.play().catch((err) => console.warn("Audio play blocked:", err));
        }
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeSegmentIndex, isPlaying, activeSegment?.ttsAudioUrl]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Global playback timer
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - (currentTime * 1000);
      playbackIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= duration) {
          setCurrentTime(0);
          setIsPlaying(false);
        } else {
          setCurrentTime(elapsed);
        }
      }, 50);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, duration]);

  const handleTogglePlay = () => {
    if (duration === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.currentTime = 0;
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full" id="player-container">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Moniteur de Rendu</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 ${showSubtitles ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-white"}`}
            title="Sous-titres"
          >
            <TypeIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono">CC</span>
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Screen Aspect Ratio 16:9 */}
      <div className="relative aspect-video flex-1 bg-black flex items-center justify-center overflow-hidden border-b border-slate-800" id="video-screen">
        {primaryClip?.videoUrl ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              loop
              onError={() => {
                setVideoError("Impossible de charger l'extrait de film. Format incompatible ou CORS bloqué.");
              }}
            />
            {/* Cinematic subtitle rendering */}
            {showSubtitles && activeSegment?.narration && (
              <div className="absolute bottom-6 left-6 right-6 text-center z-10 select-none pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                <span className="bg-black/75 px-4 py-2 rounded-lg text-amber-300 font-sans font-bold text-sm md:text-base lg:text-lg border border-slate-800/50 leading-relaxed inline-block max-w-[90%]">
                  {activeSegment.narration}
                </span>
              </div>
            )}
          </>
        ) : activeSegment?.useReferenceImage && activeSegment?.referenceImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            <img
              src={activeSegment.referenceImage}
              alt="Référence"
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 max-w-[85%] aspect-video border border-slate-700/50 rounded-lg overflow-hidden shadow-2xl">
              <img
                src={activeSegment.referenceImage}
                alt="Référence YouTube"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Référence YouTube
              </div>
            </div>
            {/* Cinematic subtitle rendering */}
            {showSubtitles && activeSegment?.narration && (
              <div className="absolute bottom-6 left-6 right-6 text-center z-20 select-none pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                <span className="bg-black/75 px-4 py-2 rounded-lg text-amber-300 font-sans font-bold text-sm md:text-base lg:text-lg border border-slate-800/50 leading-relaxed inline-block max-w-[90%]">
                  {activeSegment.narration}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center px-6 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-2 border border-slate-700">
              <Play className="w-6 h-6 ml-1" />
            </div>
            <p className="text-slate-300 font-medium text-sm">Aucun extrait assigné à cette séquence</p>
            <p className="text-slate-500 text-xs max-w-sm">
              Générez un script, recherchez un extrait sur Clip.Cafe puis associez-le pour commencer le montage.
            </p>
          </div>
        )}

        {/* Video Load error warning overlay */}
        {videoError && primaryClip && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-amber-400 text-sm font-medium mb-1">Avis d'Intégration</p>
            <p className="text-slate-400 text-xs max-w-xs mb-3">
              Le clip Clip.Cafe est en cours de traitement ou requiert un décodage local.
            </p>
            <button 
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.src = primaryClip!.videoUrl;
                  videoRef.current.load();
                  setVideoError(null);
                }
              }}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono border border-slate-700 transition-colors"
            >
              Recharger le Lecteur
            </button>
          </div>
        )}

        {/* Scene Tag */}
        {activeSegment && (
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex flex-col gap-0.5 select-none z-10">
            <span className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">Séquence {activeSegmentIndex + 1}</span>
            <span className="text-xs font-semibold text-white font-sans">{activeSegment.title}</span>
          </div>
        )}

        {/* Clip Source Badge */}
        {primaryClip ? (
          <div className="absolute top-4 right-4 bg-amber-500/90 backdrop-blur-md text-slate-950 px-2.5 py-1.5 rounded-lg font-bold text-[10px] tracking-wide shadow-lg flex items-center gap-1.5 z-10 uppercase font-mono">
            <span>{primaryClip!.movie}</span>
          </div>
        ) : activeSegment?.useReferenceImage && activeSegment?.referenceImage ? (
          <div className="absolute top-4 right-4 bg-red-600 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg font-bold text-[10px] tracking-wide shadow-lg flex items-center gap-1.5 z-10 uppercase font-mono">
            <span>Réf. YouTube</span>
          </div>
        ) : null}
      </div>

      {/* Control Bar */}
      <div className="px-4 py-4 bg-slate-950 flex flex-col gap-3">
        {/* Progress Timeline in Control Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-12">{formatTime(currentTime)}</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden cursor-pointer group" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            setCurrentTime(percentage * duration);
          }}>
            {/* Active Segments dividers */}
            <div className="absolute inset-0 flex justify-between pointer-events-none z-10">
              {bounds.map((b, idx) => (
                <div 
                  key={idx} 
                  className="h-full w-0.5 bg-slate-900/60" 
                  style={{ left: `${(b.start / duration) * 100}%` }}
                />
              ))}
            </div>
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-75"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 w-12 text-right">{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              disabled={duration === 0}
              className={`p-3 rounded-full transition-all transform hover:scale-105 ${
                isPlaying 
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20" 
                  : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
              id="play-pause-btn"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <button
              onClick={handleReset}
              className="p-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              id="reset-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {primaryClip ? (
            <div className="text-[11px] text-slate-500 italic max-w-xs text-right font-mono truncate">
              "{primaryClip.quote}"
            </div>
          ) : activeSegment?.useReferenceImage && activeSegment?.referenceImageReason ? (
            <div className="text-[11px] text-amber-500/80 italic max-w-xs text-right font-sans truncate" title={activeSegment.referenceImageReason}>
              💡 {activeSegment.referenceImageReason}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

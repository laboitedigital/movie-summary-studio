export interface MovieClip {
  id: string;
  url: string;
  videoUrl: string;
  quote: string;
  movie: string;
  thumbnail?: string;
  duration: number; // in seconds
  clipCafeSlug?: string; // present when sourced from the official Clip.Cafe API; used to refresh the download link at render time
}

export interface ScriptBeat {
  id: string;
  text: string; // the slice of narration this beat covers
  suggestedSearch: string; // Clip.Cafe search term specific to this beat
  assignedClip: MovieClip | null;
}

export interface ScriptSegment {
  id: string;
  title: string;
  narration: string;
  suggestedSearch: string;
  duration: number; // estimated duration in seconds
  beats: ScriptBeat[]; // sub-divisions of the narration (~5-8s each), each can have its own assigned clip
  assignedClip: MovieClip | null; // legacy single-clip slot, still used for reference-image segments / simple cases
  ttsAudioUrl: string | null; // URL of generated TTS or uploaded file
  useReferenceImage?: boolean;
  referenceImage?: string | null;
  referenceImageReason?: string | null;
}

export interface SummaryProject {
  id: string;
  movieTitle: string;
  script: ScriptSegment[];
  audioFileUrl: string | null; // uploaded raw narration audio, if any
  createdAt: number;
}

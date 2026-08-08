/** Types partagés par le moteur Vox, côté client et côté serveur. */

/** Une idée de vidéo produite à l'état 2. */
export interface VoxIdea {
  index: number;
  title: string;
  /** Territoire de l'idée (braquage, disparition, fraude, traque...), sert à garantir qu'aucune idée ne se répète. */
  territory: string;
  /** Accroche concrète : une date, un nom, un nombre ou un lieu. */
  hook: string;
}

/** Le script continu produit à l'état 4. */
export interface VoxScript {
  topic: string;
  /** Bloc de prose continue, sans titre ni indication de plan. */
  text: string;
  targetWords: number;
  actualWords: number;
  durationSeconds: number;
  /** Identifiant du motif de chute utilisé pour la dernière phrase. */
  cliffhangerPattern: string;
}

/** Un beat visuel produit à l'état 6. */
export interface VoxBeat {
  index: number;
  /** Timecode de début, cumulé à 2,5 mots par seconde, une décimale. */
  startSeconds: number;
  /** Portion exacte de narration couverte par ce beat. */
  text: string;
  wordCount: number;
}

/** Un prompt d'image de beat, produit à l'état 7. */
export interface VoxImagePrompt {
  beatIndex: number;
  /** Partie rédigée par le modèle : la composition concrète de ce beat. */
  scene: string;
  /** Prompt complet réellement envoyé au générateur : scène + bloc de style + closer. */
  fullPrompt: string;
}

/** Un prompt de vignette, produit à l'état 9. */
export interface VoxThumbnailPrompt {
  index: number;
  scene: string;
  fullPrompt: string;
  /** Les mots en capitales réellement présents dans l'image, 2 éléments maximum. */
  words: string[];
}

/** Un lot de voix off ElevenLabs (20 à 25 secondes, section 8). */
export interface VoxVoiceBatch {
  index: number;
  text: string;
  wordCount: number;
  estimatedSeconds: number;
  /** Data URI de l'audio généré, null tant que le lot n'a pas été produit. */
  audioUrl: string | null;
  /** Un lot peut être régénéré 2 à 5 fois, on garde la meilleure prise. */
  takes: string[];
  selectedTake: number;
  /** Le lot d'ouverture porte la vidéo : c'est la prise prioritaire. */
  isColdOpen: boolean;
}

/** État d'un travail de génération Yapper (images ou vidéos). */
export type VoxJobState = "pending" | "running" | "done" | "error";

export interface VoxAssetJob {
  beatIndex: number;
  processId: string | null;
  state: VoxJobState;
  /** URL de l'image ou de la vidéo produite. */
  url: string | null;
  error: string | null;
}

export interface VoxBatchJobStatus {
  jobId: string;
  kind: "images" | "videos";
  state: VoxJobState;
  total: number;
  completed: number;
  failed: number;
  creditsEstimated: number;
  items: VoxAssetJob[];
  error?: string;
}

/** Le projet Vox complet, tel que porté par l'interface. */
export interface VoxProject {
  niche: string;
  ideas: VoxIdea[];
  selectedIdea: VoxIdea | null;
  durationSeconds: number;
  script: VoxScript | null;
  beats: VoxBeat[];
  imagePrompts: VoxImagePrompt[];
  thumbnails: VoxThumbnailPrompt[];
  voiceBatches: VoxVoiceBatch[];
}

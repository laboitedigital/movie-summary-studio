/**
 * Montage final du moteur Vox, via ffmpeg.
 *
 * Le moteur de résumés de films (renderEngine.ts) ne convient pas ici : il est
 * bâti autour d'extraits sous copyright (plafond de 7 secondes d'usage continu,
 * effets anti-détection, mise en boucle). Les visuels Vox sont générés par le
 * studio lui-même, donc rien de tout cela n'a lieu d'être, et les contraintes
 * sont inverses : chaque plan doit tomber exactement sur sa ligne de narration.
 *
 * Principe du montage :
 *  1. les lots de voix off sont concaténés en une seule piste de narration
 *  2. la durée RÉELLE de chaque lot, mesurée au ffprobe, sert d'horloge maîtresse
 *  3. à l'intérieur d'un lot, la durée est répartie entre ses beats au prorata
 *     du nombre de mots
 *  4. chaque clip de 10 secondes est ajusté à la durée de son beat
 *  5. la narration se superpose au montage, avec l'ASMR papier en lit sonore
 */

import fs from "fs";
import path from "path";
import {
  RENDER_ROOT,
  ensureDir,
  run,
  ffprobeDuration,
  downloadToFile,
  decodeBase64DataUri,
  wrapText,
  escapeForFilter,
  FONT_PATH,
  type RenderResult,
} from "./renderEngine.js";

/**
 * Ajustement d'un clip de 10 secondes à la durée de son beat.
 *
 * Le prompt vidéo universel construit le collage de 0 à 7 secondes, puis le fige
 * de 7 à 10. Un beat durant 2 à 3 secondes, il faut choisir ce qu'on en garde.
 */
export type VoxFitMode =
  /** L'assemblage (0 à 7s) compressé à la durée du beat : le collage se termine pile sur la fin de la phrase. */
  | "assemblage"
  /** Le clip entier compressé à la durée du beat. */
  | "complet"
  /** La fin du clip, à vitesse réelle : l'affiche déjà composée, sans animation. */
  | "affiche";

/** Fin de la phase d'assemblage dans le clip généré, en secondes. */
const ASSEMBLY_END_SECONDS = 7;

export interface VoxRenderBeat {
  index: number;
  text: string;
  wordCount: number;
  /** URL du clip animé, ou null si seule l'image est disponible. */
  clipUrl: string | null;
  /** URL de l'image du beat, utilisée en repli quand le clip manque. */
  imageUrl: string | null;
}

export interface VoxRenderVoiceBatch {
  /** Nombre de mots couverts par ce lot, pour répartir sa durée entre ses beats. */
  wordCount: number;
  /** Data URI de la prise retenue. */
  audioDataUri: string;
}

export interface VoxRenderInput {
  beats: VoxRenderBeat[];
  voiceBatches: VoxRenderVoiceBatch[];
  fitMode: VoxFitMode;
  /** Volume du lit sonore ASMR sous la narration, 0 pour le couper. */
  asmrVolume: number;
  burnSubtitles: boolean;
}

type ProgressCallback = (pct: number, label: string) => void;

/**
 * Chaîne de filtres atempo pour un facteur de vitesse quelconque.
 *
 * atempo n'accepte qu'un facteur de 0,5 à 2 par instance : au delà il faut les
 * enchaîner. Comprimer 7 secondes d'ASMR en 2,4 demande un facteur de 2,9, donc
 * deux instances.
 */
function atempoChain(factor: number): string {
  const parts: string[] = [];
  let remaining = factor;

  while (remaining > 2) {
    parts.push("atempo=2.0");
    remaining /= 2;
  }
  while (remaining < 0.5) {
    parts.push("atempo=0.5");
    remaining /= 0.5;
  }

  parts.push(`atempo=${remaining.toFixed(4)}`);
  return parts.join(",");
}

/**
 * Répartit la durée réelle de chaque lot de voix entre les beats qu'il couvre.
 *
 * Les deux découpages (beats et lots) partitionnent la même suite de mots dans
 * le même ordre : un beat appartient au lot qui contient son premier mot. Caler
 * ainsi sur l'audio mesuré plutôt que sur l'estimation à 2,5 mots par seconde
 * évite que l'image dérive de la voix au fil de la vidéo.
 */
function distributeDurations(
  beats: VoxRenderBeat[],
  batchWordCounts: number[],
  batchDurations: number[]
): number[] {
  // Bornes de mots de chaque lot.
  const batchStarts: number[] = [];
  let cumulative = 0;
  for (const words of batchWordCounts) {
    batchStarts.push(cumulative);
    cumulative += words;
  }

  // Beats regroupés par lot d'appartenance.
  const beatsByBatch: number[][] = batchWordCounts.map(() => []);
  let beatStart = 0;

  for (let i = 0; i < beats.length; i++) {
    let batchIndex = 0;
    for (let b = batchWordCounts.length - 1; b >= 0; b--) {
      if (beatStart >= batchStarts[b]) {
        batchIndex = b;
        break;
      }
    }
    beatsByBatch[batchIndex].push(i);
    beatStart += beats[i].wordCount;
  }

  const durations = new Array<number>(beats.length).fill(0);

  for (let b = 0; b < beatsByBatch.length; b++) {
    const group = beatsByBatch[b];
    if (group.length === 0) continue;

    const groupWords = group.reduce((sum, i) => sum + beats[i].wordCount, 0) || 1;
    const groupDuration = batchDurations[b];

    for (const i of group) {
      // Un plan sous une demi-seconde ne se lit pas : c'est le plancher.
      durations[i] = Math.max(0.5, (groupDuration * beats[i].wordCount) / groupWords);
    }
  }

  // Un beat orphelin (aucun lot de voix) retombe sur l'estimation théorique.
  for (let i = 0; i < durations.length; i++) {
    if (durations[i] === 0) durations[i] = Math.max(0.5, beats[i].wordCount / 2.5);
  }

  return durations;
}

export async function renderVoxDocumentary(
  jobId: string,
  topic: string,
  input: VoxRenderInput,
  onProgress?: ProgressCallback
): Promise<RenderResult> {
  ensureDir(RENDER_ROOT);
  const jobDir = path.join(RENDER_ROOT, jobId);
  ensureDir(jobDir);

  const { beats, voiceBatches, fitMode, asmrVolume, burnSubtitles } = input;

  if (beats.length === 0) throw new Error("Aucun beat à monter.");
  const usable = beats.filter((b) => b.clipUrl || b.imageUrl);
  if (usable.length === 0) {
    throw new Error("Aucun beat ne dispose d'un clip ou d'une image. Générez les visuels avant le montage.");
  }

  const totalSteps = beats.length + 3;
  let stepCount = 0;
  const report = (label: string) => {
    stepCount++;
    onProgress?.(Math.min(95, Math.round((stepCount / totalSteps) * 90)), label);
  };

  // --- 1. Piste de narration ------------------------------------------------
  report("Assemblage de la voix off...");

  const voiceDir = path.join(jobDir, "voice");
  ensureDir(voiceDir);

  const batchPaths: string[] = [];
  const batchDurations: number[] = [];

  for (let i = 0; i < voiceBatches.length; i++) {
    const batchPath = path.join(voiceDir, `batch_${i}.mp3`);
    decodeBase64DataUri(voiceBatches[i].audioDataUri, batchPath);
    const duration = await ffprobeDuration(batchPath);
    if (duration <= 0) {
      throw new Error(`Le lot de voix off ${i + 1} est illisible. Régénérez-le avant de lancer le montage.`);
    }
    batchPaths.push(batchPath);
    batchDurations.push(duration);
  }

  let narrationPath: string | null = null;
  if (batchPaths.length > 0) {
    narrationPath = path.join(voiceDir, "narration.mp3");
    const listPath = path.join(voiceDir, "batches.txt");
    fs.writeFileSync(listPath, batchPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
    // Réencodage plutôt que copie : les lots viennent de générations séparées et
    // une simple concaténation de flux laisse des clics aux raccords.
    await run("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0", "-i", listPath,
      "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100",
      narrationPath,
    ]);
  }

  // --- 2. Durée de chaque plan ---------------------------------------------
  const durations =
    batchDurations.length > 0
      ? distributeDurations(beats, voiceBatches.map((b) => b.wordCount), batchDurations)
      : beats.map((b) => Math.max(0.5, b.wordCount / 2.5));

  // --- 3. Un segment vidéo par beat ----------------------------------------
  const segmentPaths: string[] = [];

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    const target = durations[i];
    const segDir = path.join(jobDir, `beat_${beat.index}`);
    ensureDir(segDir);

    report(`Plan ${i + 1}/${beats.length} : ${beat.text.slice(0, 40)}...`);

    const subPath = path.join(segDir, "sub.txt");
    fs.writeFileSync(subPath, wrapText(beat.text || ""));
    const drawtext =
      burnSubtitles && FONT_PATH
        ? `,drawtext=fontfile='${escapeForFilter(FONT_PATH)}':textfile='${escapeForFilter(subPath)}':fontcolor=white:fontsize=40:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-th-70:line_spacing=8`
        : "";

    const outPath = path.join(segDir, "out.mp4");
    const baseVideo = `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30`;

    let built = false;
    let lastError: any = null;

    // Le clip animé est le rendu voulu ; l'image fixe est un repli acceptable
    // (la caméra est verrouillée de toute façon), et le carton noir garantit que
    // le montage aboutit même si un beat a échoué côté génération.
    const attempts: Array<"clip" | "image" | "placeholder"> = [];
    if (beat.clipUrl) attempts.push("clip");
    if (beat.imageUrl) attempts.push("image");
    attempts.push("placeholder");

    for (const mode of attempts) {
      try {
        if (mode === "clip") {
          const clipPath = path.join(segDir, "clip.mp4");
          await downloadToFile(beat.clipUrl as string, clipPath);
          const sourceDuration = (await ffprobeDuration(clipPath)) || 10;

          let trimArgs: string[] = [];
          let sourceLength: number;

          if (fitMode === "affiche") {
            // La fin du clip : le collage est déjà composé et tient l'affiche.
            const start = Math.max(0, sourceDuration - target);
            trimArgs = ["-ss", String(start)];
            sourceLength = target;
          } else if (fitMode === "complet") {
            sourceLength = sourceDuration;
          } else {
            // "assemblage" : la construction du collage, sans le temps de pose.
            sourceLength = Math.min(ASSEMBLY_END_SECONDS, sourceDuration);
          }

          const speed = sourceLength / target;
          const ptsFactor = target / sourceLength;
          const videoChain =
            Math.abs(speed - 1) < 0.01
              ? `${baseVideo}${drawtext}`
              : `setpts=PTS*${ptsFactor.toFixed(6)},${baseVideo}${drawtext}`;

          const args = ["-y", ...trimArgs, "-t", String(sourceLength), "-i", clipPath];

          if (asmrVolume > 0) {
            const audioChain =
              Math.abs(speed - 1) < 0.01
                ? `volume=${asmrVolume}`
                : `${atempoChain(speed)},volume=${asmrVolume}`;
            args.push(
              "-filter_complex",
              `[0:v]${videoChain}[v];[0:a]${audioChain},apad[a]`,
              "-map", "[v]", "-map", "[a]"
            );
          } else {
            args.push(
              "-filter_complex",
              `[0:v]${videoChain}[v];anullsrc=channel_layout=stereo:sample_rate=44100[a]`,
              "-map", "[v]", "-map", "[a]"
            );
          }

          args.push(
            "-t", String(target),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            outPath
          );
          await run("ffmpeg", args, 180000);
        } else if (mode === "image") {
          const imgPath = path.join(segDir, "image.png");
          await downloadToFile(beat.imageUrl as string, imgPath);

          // Aucun Ken Burns : le style impose une caméra strictement verrouillée.
          await run("ffmpeg", [
            "-y", "-loop", "1", "-i", imgPath,
            "-filter_complex",
            `[0:v]${baseVideo}${drawtext}[v];anullsrc=channel_layout=stereo:sample_rate=44100[a]`,
            "-map", "[v]", "-map", "[a]",
            "-t", String(target),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            outPath,
          ], 120000);
        } else {
          await run("ffmpeg", [
            "-y",
            "-f", "lavfi", "-i", `color=c=0x1a1712:s=1920x1080:r=30:d=${target + 0.5}`,
            "-filter_complex",
            `[0:v]setsar=1${drawtext}[v];anullsrc=channel_layout=stereo:sample_rate=44100[a]`,
            "-map", "[v]", "-map", "[a]",
            "-t", String(target),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            outPath,
          ], 60000);
        }

        built = true;
        break;
      } catch (e) {
        lastError = e;
        console.warn(`[vox] Beat ${beat.index}, échec du mode "${mode}" :`, (e as Error).message);
      }
    }

    if (!built) {
      throw new Error(`Impossible de monter le plan ${beat.index} (${lastError?.message || "erreur inconnue"})`);
    }

    segmentPaths.push(outPath);
  }

  // --- 4. Concaténation des plans ------------------------------------------
  report("Assemblage des plans...");

  const concatListPath = path.join(jobDir, "concat.txt");
  fs.writeFileSync(concatListPath, segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));

  const compositePath = path.join(jobDir, "composite.mp4");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", compositePath], 180000);

  // --- 5. Narration par dessus ---------------------------------------------
  report("Pose de la narration...");

  const finalPath = path.join(jobDir, "final.mp4");

  if (narrationPath) {
    const args = ["-y", "-i", compositePath, "-i", narrationPath];

    if (asmrVolume > 0) {
      // La narration domine, l'ASMR reste en dessous : le mixage est explicite
      // (normalize=0) pour qu'amix ne baisse pas la voix en ajoutant la seconde
      // entrée.
      args.push(
        "-filter_complex",
        `[0:a]volume=1.0[asmr];[1:a]volume=1.0[nar];[asmr][nar]amix=inputs=2:duration=longest:normalize=0[aout]`,
        "-map", "0:v", "-map", "[aout]"
      );
    } else {
      args.push("-map", "0:v", "-map", "1:a");
    }

    args.push(
      "-c:v", "copy",
      "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
      "-shortest",
      finalPath
    );
    await run("ffmpeg", args, 180000);
  } else {
    fs.copyFileSync(compositePath, finalPath);
  }

  const durationSeconds = await ffprobeDuration(finalPath);
  onProgress?.(100, "Montage terminé.");

  return {
    outputUrl: `/render-output/${jobId}/final.mp4`,
    outputPath: finalPath,
    durationSeconds,
  };
}

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export const RENDER_ROOT = path.join(process.cwd(), "render-output");

export function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function run(cmd: string, args: string[], timeoutMs = 120000): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`${cmd} a dépassé le délai maximal (${timeoutMs}ms)`));
    }, timeoutMs);

    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`${cmd} a échoué (code ${code}) :\n${stderr.slice(-1500)}`));
    });
  });
}

export async function ffprobeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath
    ]);
    let out = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.on("close", () => {
      const val = parseFloat(out.trim());
      resolve(isNaN(val) ? 0 : val);
    });
    proc.on("error", () => resolve(0));
  });
}

export async function downloadToFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Téléchargement échoué (HTTP ${res.status}) pour ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  if (fs.statSync(destPath).size < 1024) {
    throw new Error(`Fichier téléchargé trop petit / invalide : ${url}`);
  }
}

export function decodeBase64DataUri(dataUri: string, destPath: string) {
  const match = dataUri.match(/^data:.*?;base64,(.*)$/);
  const base64 = match ? match[1] : dataUri;
  fs.writeFileSync(destPath, Buffer.from(base64, "base64"));
}

export function wrapText(text: string, maxCharsPerLine = 42): string {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines.join("\n");
}

const FONT_CANDIDATES = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
  "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
];

function findFont(): string | null {
  for (const candidate of FONT_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export const FONT_PATH = findFont();

/**
 * Builds the ffmpeg video filter chain for a real movie clip shot.
 * When antiDetection is enabled, applies a horizontal mirror, a slight digital zoom,
 * and a subtle color/contrast shift — small visual changes that help the frame not
 * match the original source 1:1 for automated content-matching systems, on top of the
 * 7-second continuous-use cap already applied elsewhere.
 */
function buildClipVideoFilters(drawtextFilter: string, antiDetection: boolean): string {
  const mirror = antiDetection ? "hflip," : "";
  // A ~6-7% larger scale before the final crop creates a subtle, fixed digital zoom-in.
  const scaleW = antiDetection ? 2050 : 1920;
  const scaleH = antiDetection ? 1153 : 1080;
  const colorShift = antiDetection ? ",eq=saturation=1.15:contrast=1.05:brightness=0.02,hue=h=6" : "";
  return `${mirror}scale=${scaleW}:${scaleH}:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30${colorShift}${drawtextFilter}`;
}

// Recap channels typically cap continuous use of any single copyrighted clip to a few
// seconds (looping it if narration runs longer) to reduce Content ID / fair-use risk on YouTube.
const MAX_CONTINUOUS_CLIP_SECONDS = 7;

export interface RenderSegmentInput {
  id: string;
  narration: string;
  duration: number;
  clipVideoUrls: string[];
  imageUrl: string | null;
  useImage: boolean;
  ttsAudioDataUri: string | null;
  burnSubtitles: boolean;
  antiDetectionEffects: boolean;
}

export interface RenderResult {
  outputUrl: string;
  outputPath: string;
  durationSeconds: number;
}

type ProgressCallback = (pct: number, label: string) => void;

// Escape a path for use inside an ffmpeg filter option (colons and backslashes need escaping)
export function escapeForFilter(p: string): string {
  return p.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
}

export async function renderMovieSummary(
  jobId: string,
  movieTitle: string,
  segments: RenderSegmentInput[],
  onProgress?: ProgressCallback
): Promise<RenderResult> {
  ensureDir(RENDER_ROOT);
  const jobDir = path.join(RENDER_ROOT, jobId);
  ensureDir(jobDir);

  const totalSteps = segments.length + 1;
  let stepCount = 0;
  const report = (label: string) => {
    stepCount++;
    const pct = Math.min(95, Math.round((stepCount / totalSteps) * 90));
    onProgress?.(pct, label);
  };

  const segmentOutputs: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segDir = path.join(jobDir, `seg_${i}`);
    ensureDir(segDir);

    report(`Scène ${i + 1}/${segments.length} : ${(seg.narration || "").slice(0, 45)}...`);

    const outPath = path.join(segDir, "out.mp4");
    const audioExt = (seg.ttsAudioDataUri || "").startsWith("data:audio/mpeg") ? "mp3" : "wav";
    const audioInPath = path.join(segDir, `audio.${audioExt}`);
    const subPath = path.join(segDir, "subtitle.txt");

    // --- 1. Decode narration audio (if any) and determine real target duration ---
    let audioExists = false;
    let targetDuration = Math.max(2, seg.duration || 5);
    if (seg.ttsAudioDataUri) {
      try {
        decodeBase64DataUri(seg.ttsAudioDataUri, audioInPath);
        audioExists = true;
        const audioDur = await ffprobeDuration(audioInPath);
        if (audioDur > 0.3) {
          targetDuration = Math.max(2, audioDur + 0.4); // petit padding de respiration
        }
      } catch (e) {
        console.warn(`[render] Audio invalide pour la scène ${i}:`, e);
        audioExists = false;
      }
    }

    fs.writeFileSync(subPath, wrapText(seg.narration || ""));
    const drawtextFilter = (seg.burnSubtitles && FONT_PATH)
      ? `,drawtext=fontfile='${escapeForFilter(FONT_PATH)}':textfile='${escapeForFilter(subPath)}':fontcolor=yellow:fontsize=42:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-th-70:line_spacing=8`
      : "";

    // --- 2. Try to build the segment: real clip(s) -> reference image -> placeholder ---
    const attempts: Array<"clip" | "image" | "placeholder"> = [];
    if (seg.clipVideoUrls && seg.clipVideoUrls.length > 0) attempts.push("clip");
    if (seg.useImage && seg.imageUrl) attempts.push("image");
    attempts.push("placeholder");

    let built = false;
    let lastErr: any = null;

    for (const mode of attempts) {
      try {
        if (mode === "clip") {
          const urls = seg.clipVideoUrls;

          if (urls.length === 1) {
            // --- Single clip: keep original audio mixed quietly under the narration ---
            const clipInPath = path.join(segDir, "clip_in.mp4");
            await downloadToFile(urls[0], clipInPath);

            // Cap continuous use of this single clip to MAX_CONTINUOUS_CLIP_SECONDS — if the
            // narration runs longer, we loop this short trimmed chunk instead of replaying the
            // full source clip over and over (reduces Content ID / fair-use risk on YouTube).
            let loopSourcePath = clipInPath;
            try {
              const sourceDuration = await ffprobeDuration(clipInPath);
              if (sourceDuration > MAX_CONTINUOUS_CLIP_SECONDS) {
                const trimmedPath = path.join(segDir, "clip_in_trimmed.mp4");
                await run("ffmpeg", ["-y", "-i", clipInPath, "-t", String(MAX_CONTINUOUS_CLIP_SECONDS), "-c", "copy", trimmedPath]);
                loopSourcePath = trimmedPath;
              }
            } catch (trimErr) {
              console.warn(`[render] Découpage à ${MAX_CONTINUOUS_CLIP_SECONDS}s impossible, utilisation du clip complet :`, trimErr);
            }

            const videoFilters = buildClipVideoFilters(drawtextFilter, !!seg.antiDetectionEffects);
            let filterComplex: string;
            const args = ["-y", "-stream_loop", "-1", "-i", loopSourcePath];

            // Original clip audio is intentionally dropped (not just lowered) — keeping any trace
            // of the movie's audio increases the risk of Content ID / audio-fingerprint claims.
            // Only the narration (or silence) plays.
            if (audioExists) {
              args.push("-i", audioInPath);
              filterComplex = `[0:v]${videoFilters}[v];[1:a]volume=1.0[aout]`;
            } else {
              filterComplex = `[0:v]${videoFilters}[v];anullsrc=channel_layout=stereo:sample_rate=44100[aout]`;
            }

            args.push(
              "-filter_complex", filterComplex,
              "-map", "[v]", "-map", "[aout]",
              "-t", String(targetDuration),
              "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
              "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
              outPath
            );
            await run("ffmpeg", args);
          } else {
            // --- Multiple clips (beats): cut between several ~7s extracts instead of looping one ---
            // Original clip audio is dropped here (mixing many disjointed audio snippets sounds chaotic);
            // only the narration plays over the whole composite.
            const sourceDurations: number[] = [];
            for (let u = 0; u < urls.length; u++) {
              const srcPath = path.join(segDir, `clip_src_${u}.mp4`);
              await downloadToFile(urls[u], srcPath);
              const dur = await ffprobeDuration(srcPath);
              sourceDurations.push(dur > 0 ? dur : MAX_CONTINUOUS_CLIP_SECONDS);
            }

            // Build the shot list: cycle through the provided clips, each capped at
            // MAX_CONTINUOUS_CLIP_SECONDS, until we've covered the full narration duration.
            const shotPaths: string[] = [];
            let cumulative = 0;
            let shotIdx = 0;
            const MAX_SHOTS = 60; // safety cap against pathological inputs
            while (cumulative < targetDuration && shotIdx < MAX_SHOTS) {
              const srcIndex = shotIdx % urls.length;
              const srcPath = path.join(segDir, `clip_src_${srcIndex}.mp4`);
              const shotDur = Math.min(MAX_CONTINUOUS_CLIP_SECONDS, sourceDurations[srcIndex], targetDuration - cumulative);
              if (shotDur < 0.3) break;

              const shotPath = path.join(segDir, `shot_${shotIdx}.mp4`);
              await run("ffmpeg", [
                "-y", "-i", srcPath,
                "-t", String(shotDur),
                "-vf", buildClipVideoFilters("", !!seg.antiDetectionEffects),
                "-an",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
                shotPath,
              ]);
              shotPaths.push(shotPath);
              cumulative += shotDur;
              shotIdx++;
            }

            // Concatenate all shots into one silent composite video for this segment.
            const shotsListPath = path.join(segDir, "shots_concat.txt");
            fs.writeFileSync(shotsListPath, shotPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
            const multiClipVideoPath = path.join(segDir, "multiclip_video.mp4");
            await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", shotsListPath, "-c", "copy", multiClipVideoPath]);

            // Final mux: burn subtitles (if enabled) and lay the narration audio over the whole composite.
            const args = ["-y", "-i", multiClipVideoPath];
            let filterComplex: string;
            if (audioExists) {
              args.push("-i", audioInPath);
              filterComplex = `[0:v]setsar=1${drawtextFilter}[v]`;
              args.push("-filter_complex", filterComplex, "-map", "[v]", "-map", "1:a");
            } else {
              filterComplex = `[0:v]setsar=1${drawtextFilter}[v];anullsrc=channel_layout=stereo:sample_rate=44100[aout]`;
              args.push("-filter_complex", filterComplex, "-map", "[v]", "-map", "[aout]");
            }

            args.push(
              "-t", String(targetDuration),
              "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
              "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
              outPath
            );
            await run("ffmpeg", args);
          }
        } else if (mode === "image") {
          const imgInPath = path.join(segDir, "image_in.jpg");
          await downloadToFile(seg.imageUrl as string, imgInPath);

          const frames = Math.max(1, Math.round(targetDuration * 30));
          // Effet "Ken Burns" : léger zoom progressif sur l'image fixe
          const videoFilters = `scale=2200:-2,zoompan=z='min(zoom+0.0007,1.18)':d=${frames}:s=1920x1080:fps=30,setsar=1${drawtextFilter}`;
          const args = ["-y", "-loop", "1", "-i", imgInPath];
          let filterComplex: string;

          if (audioExists) {
            args.push("-i", audioInPath);
            filterComplex = `[0:v]${videoFilters}[v];[1:a]volume=1.0[aout]`;
          } else {
            filterComplex = `[0:v]${videoFilters}[v];anullsrc=channel_layout=stereo:sample_rate=44100[aout]`;
          }

          args.push(
            "-filter_complex", filterComplex,
            "-map", "[v]", "-map", "[aout]",
            "-t", String(targetDuration),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            outPath
          );
          await run("ffmpeg", args);
        } else {
          // placeholder: fond cinématique sombre uni
          const videoFilters = `setsar=1${drawtextFilter}`;
          const args = [
            "-y",
            "-f", "lavfi", "-i", `color=c=0x11131a:s=1920x1080:r=30:d=${targetDuration + 0.5}`,
          ];
          let filterComplex: string;

          if (audioExists) {
            args.push("-i", audioInPath);
            filterComplex = `[0:v]${videoFilters}[v];[1:a]volume=1.0[aout]`;
          } else {
            filterComplex = `[0:v]${videoFilters}[v];anullsrc=channel_layout=stereo:sample_rate=44100[aout]`;
          }

          args.push(
            "-filter_complex", filterComplex,
            "-map", "[v]", "-map", "[aout]",
            "-t", String(targetDuration),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            outPath
          );
          await run("ffmpeg", args);
        }

        built = true;
        break;
      } catch (e) {
        lastErr = e;
        console.warn(`[render] Scène ${i} - échec mode "${mode}":`, (e as Error).message);
      }
    }

    if (!built) {
      throw new Error(`Impossible de construire la scène ${i + 1} (${lastErr?.message || "erreur inconnue"})`);
    }

    segmentOutputs.push(outPath);
  }

  report("Assemblage final de la vidéo...");

  const concatListPath = path.join(jobDir, "concat.txt");
  const concatContent = segmentOutputs
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n");
  fs.writeFileSync(concatListPath, concatContent);

  const finalPath = path.join(jobDir, "final.mp4");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", finalPath], 60000);

  const durationSeconds = await ffprobeDuration(finalPath);
  onProgress?.(100, "Rendu terminé avec succès !");

  return {
    outputUrl: `/render-output/${jobId}/final.mp4`,
    outputPath: finalPath,
    durationSeconds,
  };
}

// Nettoyage optionnel des anciens jobs (à appeler périodiquement, ex: cron ou au démarrage)
export function cleanupOldJobs(maxAgeMs = 24 * 60 * 60 * 1000) {
  if (!fs.existsSync(RENDER_ROOT)) return;
  const now = Date.now();
  for (const entry of fs.readdirSync(RENDER_ROOT)) {
    const fullPath = path.join(RENDER_ROOT, entry);
    try {
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  }
}

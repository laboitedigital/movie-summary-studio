/**
 * Détection des images vides renvoyées par un générateur.
 *
 * Un modèle d'image qui refuse une consigne ne renvoie pas toujours une erreur :
 * il arrive qu'il produise un cadre uniforme, noir ou blanc, avec un statut
 * « completed » et une URL parfaitement valide. Le contrôle habituel (statut
 * terminal plus URL présente) laisse donc passer une image inutilisable, qui
 * n'apparaît qu'au montage final.
 *
 * Observé en conditions réelles : une scène décrivant des mains soulevant un
 * tableau lors d'un vol est revenue en cadre entièrement noir. Reformulée sans
 * l'action, elle est passée.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { downloadToFile } from "../renderEngine.js";

/**
 * Écart type de luminance en dessous duquel un cadre est considéré uniforme.
 *
 * Une composition en collage éditorial, même très épurée, dépasse largement ce
 * seuil : elle porte du grain de papier, des ombres et un accent rouge.
 */
const FLAT_LUMA_STDEV = 1.5;

function lumaStats(filePath: string): Promise<{ average: number; stdev: number } | null> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", [
      "-v", "error",
      "-i", filePath,
      "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-",
      "-frames:v", "1",
      "-f", "null", "-",
    ]);

    let out = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (out += d.toString()));
    proc.on("error", () => resolve(null));
    proc.on("close", () => {
      const average = Number(out.match(/YAVG=([\d.]+)/)?.[1]);
      const low = Number(out.match(/YLOW=([\d.]+)/)?.[1]);
      const high = Number(out.match(/YHIGH=([\d.]+)/)?.[1]);

      if (!Number.isFinite(average)) return resolve(null);
      // À défaut d'écart type direct, l'amplitude entre les extrêmes suffit à
      // séparer un cadre uniforme d'une vraie composition.
      const spread = Number.isFinite(low) && Number.isFinite(high) ? high - low : NaN;
      resolve({ average, stdev: Number.isFinite(spread) ? spread : NaN });
    });
  });
}

/**
 * Vrai quand le média pointé par cette URL est un cadre uniforme.
 *
 * En cas de doute (ffmpeg absent, téléchargement impossible, statistiques
 * illisibles), la fonction renvoie false : mieux vaut laisser passer une image
 * douteuse que bloquer une génération valide sur un contrôle qui n'a pas pu
 * s'exécuter.
 */
export async function isBlankMedia(url: string): Promise<boolean> {
  const tempPath = path.join(os.tmpdir(), `vox-check-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  try {
    await downloadToFile(url, tempPath);
    const stats = await lumaStats(tempPath);
    if (!stats) return false;

    if (Number.isFinite(stats.stdev)) return stats.stdev < FLAT_LUMA_STDEV;

    // Repli sur la luminance moyenne quand l'amplitude n'a pas pu être lue :
    // seuls le noir et le blanc absolus sont alors rejetés.
    return stats.average < 1 || stats.average > 254;
  } catch {
    return false;
  } finally {
    try {
      fs.rmSync(tempPath, { force: true });
    } catch {
      // ignore
    }
  }
}

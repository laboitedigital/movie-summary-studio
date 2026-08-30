#!/usr/bin/env node
/**
 * Ranking — un videoclip par entree du classement.
 *
 * Chaque entree de sujet.json donne UN mp4 vertical : l'extrait Clip.cafe du film,
 * recadre en 9:16, avec la voix off Yapper par-dessus et le son d'origine baisse.
 * Les cinq mp4 partent ensuite dans VSUB pour le montage du ranking.
 *
 * Ecrit d'apres https://clip.cafe/api-docs/ :
 *  - toute recherche genere une cle de telechargement valable 5 minutes
 *  - le telechargement est un appel separe : ?api_key=..&slug=..&key=..
 *  - les entiers acceptent des intervalles : duration=7-10
 *
 *   export CLIP_CAFE_API_KEY="ta_cle"
 *   node ranking.mjs catalogue top5-transformers   # liste les extraits 7-10 s (aucun telechargement)
 *   node ranking.mjs montage   top5-transformers   # telecharge, recadre, muxe la voix
 *
 * Entre les deux, choix.json permet de forcer un slug par entree :
 *   { "05": "slug-du-clip", "01": "..." }
 * Sans choix.json, montage prend le premier slug encore libre du catalogue.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const KEY = process.env.CLIP_CAFE_API_KEY;
if (!KEY) {
  console.error('Manque CLIP_CAFE_API_KEY. Fais : export CLIP_CAFE_API_KEY="..."');
  process.exit(1);
}

const API = "https://api.clip.cafe/";
const RATE_MS = 6500;          // plan PRO : 10 requetes/minute, soit une toutes les 6 s
const DUREE_EXTRAIT = "7-10";  // la fenetre demandee : ni micro-clip, ni plan interminable

const cmd = process.argv[2];
const projet = process.argv[3];
if (!cmd || !projet) {
  console.log("Usage : node ranking.mjs <catalogue|montage> <dossier-du-projet>");
  process.exit(1);
}

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", projet);
if (!fs.existsSync(RACINE)) {
  console.error(`Projet introuvable : ${RACINE}`);
  process.exit(1);
}

const sujet = JSON.parse(fs.readFileSync(path.join(RACINE, "sujet.json"), "utf8"));
const VOIX = path.join(RACINE, "voix");
const SORTIE = path.join(RACINE, "sortie");
const TRAVAIL = path.join(RACINE, ".travail");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params, { binary = false } = {}) {
  const url = `${API}?api_key=${encodeURIComponent(KEY)}&${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (res.status === 429) throw new Error("429 : limite de debit depassee, augmente RATE_MS");
  if (res.status === 401) throw new Error("401 : cle API refusee");
  if (!res.ok) throw new Error(`Clip.cafe a repondu ${res.status}`);
  if (binary) return Buffer.from(await res.arrayBuffer());
  const data = await res.json();
  return (data?.hits?.hits || []).map((h) => h._source).filter(Boolean);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (c) => (c === 0 ? resolve(out) : reject(new Error(`${cmd} code ${c}\n${err.slice(-800)}`))));
  });
}

const duree = async (f) =>
  parseFloat(await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

const aDuSon = async (f) =>
  (await run("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", f])).trim() !== "";

/**
 * Liste tous les extraits 7-10 s de chaque film.
 *
 * On liste plutot que de chercher par mot-cle : sur un catalogue etroit, la recherche
 * semantique de Clip.cafe converge et renvoie les memes quelques extraits quelle que
 * soit la requete. Lister le film puis choisir est la seule facon fiable d'avoir
 * cinq extraits reellement differents.
 */
async function catalogue() {
  const cat = {};
  console.log(`${sujet.clips.length} films, une requete toutes les ${RATE_MS / 1000} s. Aucun telechargement.\n`);

  for (const c of sujet.clips) {
    process.stdout.write(`#${c.rang}  ${c.film} (${c.annee}) ... `);
    try {
      const p = new URLSearchParams({ ...c.recherche, duration: DUREE_EXTRAIT, size: "100", sort: "duration", order: "desc" });
      const hits = await api(p.toString());
      cat[c.tag] = hits.map((h) => ({
        slug: h.slug,
        duree: h.duration,
        film: h.movie_title,
        annee: h.movie_year,
        replique: h.title,
        page: `https://clip.cafe/${h.movie_slug}/${h.slug}/`,
      }));
      console.log(`${hits.length} extrait(s) de 7 a 10 s`);
      cat[c.tag].slice(0, 6).forEach((r, i) =>
        console.log(`      [${i}] ${String(r.duree ?? "?").padStart(2)}s  ${r.slug.padEnd(44)} ${String(r.replique || "").slice(0, 52)}`)
      );
      if (!hits.length) console.log("      AUCUN extrait dans cette fenetre — elargis DUREE_EXTRAIT ou verifie le titre/annee");
    } catch (e) {
      console.log(`ECHEC : ${e.message}`);
      cat[c.tag] = [];
    }
    await sleep(RATE_MS);
  }

  fs.writeFileSync(path.join(RACINE, "catalogue.json"), JSON.stringify(cat, null, 2));
  console.log(`\nEcrit catalogue.json.`);
  console.log(`Pour forcer un extrait, mets son slug dans choix.json : { "05": "slug", ... }`);
  console.log(`Puis : node ranking.mjs montage ${projet}`);
}

/**
 * Telecharge l'extrait choisi, le recadre en 9:16 et pose la voix off dessus.
 *
 * La duree finale est celle de l'EXTRAIT (7 a 10 s), pas celle de la voix : la voix
 * fait 5 a 8 s et se pose dedans, elle n'a pas a remplir le plan. Elle entre apres
 * une courte avance, pour ne pas demarrer sur la premiere image.
 *
 * Seul cas ou l'extrait ne commande pas : quand la voix ne rentrerait pas dedans.
 * La narration n'est jamais coupee — l'extrait est alors prolonge sur sa derniere
 * image (tpad). A l'inverse, un extrait plus long que necessaire est coupe (-t).
 */
async function montage() {
  const catFile = path.join(RACINE, "catalogue.json");
  if (!fs.existsSync(catFile)) {
    console.error("catalogue.json absent. Lance d'abord : node ranking.mjs catalogue " + projet);
    process.exit(1);
  }
  const cat = JSON.parse(fs.readFileSync(catFile, "utf8"));
  const choixFile = path.join(RACINE, "choix.json");
  const choix = fs.existsSync(choixFile) ? JSON.parse(fs.readFileSync(choixFile, "utf8")) : {};

  fs.mkdirSync(SORTIE, { recursive: true });
  fs.mkdirSync(TRAVAIL, { recursive: true });

  const { largeur: L, hauteur: H, fps: FPS, cadrage = "plein" } = sujet.format;
  const { volumeExtrait, volumeVoix, queueSecondes, avanceSecondes } = sujet.audio;

  // Un slug deja pris ne peut pas etre repris : sans cette liste, deux entrees
  // voisines finissent sur le meme extrait.
  const pris = new Set(Object.values(choix));
  const manifeste = [];

  /** Telecharge un extrait. Renvoie null si Clip.cafe ne le sert pas. */
  async function recuperer(slug, vers) {
    // La cle de telechargement expire apres 5 min : celle du catalogue est morte.
    // On refait une recherche par slug pour en obtenir une fraiche.
    const frais = (await api(`slug=${encodeURIComponent(slug)}&size=1`))[0];
    if (!frais) throw new Error(`slug introuvable : ${slug}`);
    const dl = frais.download;
    if (!dl) throw new Error("aucune cle de telechargement renvoyee");

    let buf;
    // Selon les comptes, "download" est soit une URL complete, soit la cle
    // a passer a l'endpoint documente. On gere les deux.
    if (typeof dl === "string" && dl.startsWith("http")) {
      const r = await fetch(dl, { signal: AbortSignal.timeout(180000) });
      if (!r.ok) throw new Error(`telechargement HTTP ${r.status}`);
      buf = Buffer.from(await r.arrayBuffer());
    } else {
      buf = await api(`slug=${encodeURIComponent(slug)}&key=${encodeURIComponent(dl)}`, { binary: true });
    }
    if (buf.length < 2048) throw new Error("fichier trop petit, cle probablement expiree");
    fs.writeFileSync(vers, buf);
    return frais;
  }

  for (const c of sujet.clips) {
    const voix = path.join(VOIX, `${c.tag}.mp3`);
    process.stdout.write(`#${c.rang}  ${c.film} ... `);

    if (!fs.existsSync(voix)) {
      console.log(`ECHEC : voix manquante (${path.relative(RACINE, voix)})`);
      manifeste.push({ tag: c.tag, rang: c.rang, statut: "echec", erreur: "voix manquante" });
      continue;
    }

    // Le slug force passe en tete, le catalogue sert de repli. Un slug peut etre
    // indexe et pourtant renvoyer 404 au telechargement : sans repli, l'entree est
    // perdue et il faut un run entier pour la rattraper.
    const repli = (cat[c.tag] || []).map((r) => r.slug).filter((sl) => !pris.has(sl));
    const candidats = [...new Set([choix[c.tag], ...repli].filter(Boolean))].slice(0, 4);
    if (!candidats.length) {
      console.log("ECHEC : aucun extrait disponible dans le catalogue");
      manifeste.push({ tag: c.tag, rang: c.rang, statut: "echec", erreur: "catalogue vide" });
      continue;
    }

    let pose = null;
    let derniereErreur = null;

    for (const candidat of candidats) {
      pris.add(candidat);
      const brut = path.join(TRAVAIL, `${c.tag}-brut.mp4`);
      try {
        const frais = await recuperer(candidat, brut);

        const dVoix = await duree(voix);
        const dExtrait = await duree(brut);
        // La voix commande : la video colle a la narration et l'extrait est coupe.
        // On ne descend jamais sous la voix — la narration n'est jamais tronquee.
        const finale = +(avanceSecondes + dVoix + queueSecondes).toFixed(3);
        const sonDispo = await aDuSon(brut);

        // fps EN PREMIER : les extraits sont en 24/25 fps et le montage en 30 ; conformer
        // apres le reste ferait heriter la base de temps du premier flux.
        const rallonge = `tpad=stop_mode=clone:stop_duration=${Math.max(0, finale - dExtrait + 1).toFixed(3)}`;
        const video = cadrage === "flou"
          // Fond flou plein cadre, extrait net par-dessus : rien de l'image n'est perdu,
          // mais l'image utile ne fait qu'une bande au centre.
          ? `[0:v]fps=${FPS},split=2[a][b];` +
            `[a]scale=${L}:${H}:force_original_aspect_ratio=increase,crop=${L}:${H},gblur=sigma=28[bg];` +
            `[b]scale=${L}:-2:flags=lanczos[fg];` +
            `[bg][fg]overlay=(W-w)/2:(H-h)/2,${rallonge},format=yuv420p[v]`
          // Plein cadre : l'image remplit le 9:16. Un 16:9 y perd ses cotes — c'est le
          // prix d'un vrai cadrage vertical, et c'est ce que le format court attend.
          : `[0:v]fps=${FPS},scale=${L}:${H}:force_original_aspect_ratio=increase,` +
            `crop=${L}:${H},${rallonge},format=yuv420p[v]`;

        // Le son d'origine reste audible sous la narration, mais ne lui dispute rien.
        // normalize=0 : sans lui, amix divise chaque entree par leur nombre.
        // Pas de shortest=1 : c'est -t qui fixe la duree, sinon le plus court tronque tout.
        // all=1 : sans lui, adelay ne decale que le premier canal et la voix se dedouble.
        const retard = `adelay=${Math.round(avanceSecondes * 1000)}:all=1`;
        const audio = sonDispo
          ? `[0:a]volume=${volumeExtrait},apad[s0];[1:a]volume=${volumeVoix},${retard}[s1];[s0][s1]amix=inputs=2:duration=longest:normalize=0[aout]`
          : `[1:a]volume=${volumeVoix},${retard},apad[aout]`;

        const sortie = path.join(SORTIE, `${c.tag}-${c.film.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.mp4`);
        await run("ffmpeg", [
          "-y", "-i", brut, "-i", voix,
          "-filter_complex", `${video};${audio}`,
          "-map", "[v]", "-map", "[aout]",
          "-t", String(finale),
          "-r", String(FPS),
          "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
          "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
          "-movflags", "+faststart",
          sortie,
        ]);
        fs.unlinkSync(brut);

        const reelle = await duree(sortie);
        pose = {
          tag: c.tag, rang: c.rang, statut: "ok",
          fichier: path.relative(RACINE, sortie),
          duree: +reelle.toFixed(3), dureeVoix: +dVoix.toFixed(3), dureeExtrait: +dExtrait.toFixed(3),
          slug: candidat, film: frais.movie_title, annee: frais.movie_year,
          replique: frais.title, page: `https://clip.cafe/${frais.movie_slug}/${candidat}/`,
          sonOrigine: sonDispo, texte: c.texte,
          repliApres: candidat === choix[c.tag] ? undefined : `slug force indisponible (${derniereErreur})`,
        };
        const ecart = reelle - dVoix;
        console.log(`ok — ${reelle.toFixed(2)}s  (voix ${dVoix.toFixed(2)}s, +${ecart.toFixed(2)}s ; extrait ${dExtrait.toFixed(2)}s coupe)  ${candidat}`);
        break;
      } catch (e) {
        derniereErreur = e.message;
        if (fs.existsSync(brut)) fs.unlinkSync(brut);
        const reste = candidats.indexOf(candidat) < candidats.length - 1;
        console.log(`${candidat} : ${e.message}${reste ? " — repli sur le suivant" : ""}`);
        if (reste) { process.stdout.write(`#${c.rang}  ${c.film} ... `); await sleep(RATE_MS); }
      }
    }

    manifeste.push(pose || {
      tag: c.tag, rang: c.rang, statut: "echec",
      erreur: derniereErreur, essayes: candidats,
    });
    await sleep(RATE_MS);
  }

  fs.rmSync(TRAVAIL, { recursive: true, force: true });
  // Dans l'ordre du montage : on descend 5, 4, 3, 2, 1.
  manifeste.sort((a, b) => b.rang - a.rang);
  fs.writeFileSync(path.join(RACINE, "manifeste.json"), JSON.stringify(manifeste, null, 2));

  const ok = manifeste.filter((m) => m.statut === "ok");
  console.log(`\n${ok.length}/${sujet.clips.length} videoclips dans ${path.relative(RACINE, SORTIE)}/`);
  console.log(`Extraits distincts : ${new Set(ok.map((m) => m.slug)).size}`);
  const rates = manifeste.filter((m) => m.statut !== "ok");
  if (rates.length) {
    // Un run partiel ne doit pas passer pour un succes : le job doit rougir.
    console.log(`A reprendre : ${rates.map((r) => `#${r.rang} (${r.erreur})`).join(", ")}`);
    console.log(`::error::${rates.length} entree(s) sur ${sujet.clips.length} sans videoclip.`);
    process.exitCode = 1;
  }
}


if (cmd === "catalogue") await catalogue();
else if (cmd === "montage") await montage();
else {
  console.log("Usage : node ranking.mjs <catalogue|montage> <dossier-du-projet>");
  process.exit(1);
}

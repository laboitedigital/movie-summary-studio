#!/usr/bin/env node
/**
 * MR Tier Maker — recuperation des extraits Clip.cafe
 * Episode 01 "Transformers", segment 1 : The Transformers: The Movie (1986), plans 9 a 29.
 * 14 extraits (le plan 022 est coupe en deux : 022a et 022b).
 *
 * Prerequis : Node 18+, ffmpeg dans le PATH.
 *
 *   export CLIP_CAFE_API_KEY="ta_cle"
 *   node clipcafe-film1.mjs search     # cherche et ecrit choices.json (rien n'est telecharge)
 *   node clipcafe-film1.mjs fetch      # telecharge + coupe les extraits choisis
 *
 * Pour changer un choix : ouvre picks.json, mets l'index du hit voulu (0 = premier),
 * puis relance "fetch". Les liens de telechargement Clip.cafe expirent apres ~5 minutes,
 * donc "fetch" redemande systematiquement une URL fraiche via le slug.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const KEY = process.env.CLIP_CAFE_API_KEY;
if (!KEY) {
  console.error("Manque CLIP_CAFE_API_KEY. Fais : export CLIP_CAFE_API_KEY=\"...\"");
  process.exit(1);
}

const OUT = "clips-film1";
const API = "https://api.clip.cafe/";

// Les plans du segment 1986 qui demandent un extrait de film.
// "dur" est le temps A L ECRAN : un plan tient jusqu au debut du suivant, silences compris.
// Les plans 13, 19, 20, 21, 24, 27, 28 et 29 sont du motion design ou des photos : ils ne sont pas ici.
const SHOTS = [
  { n:  9, tc: "0:42", dur: 7.2, q: "one shall stand one shall fall" },
  { n: 10, tc: "0:49", dur: 4.3, q: "Autobots transform" },
  { n: 11, tc: "0:53", dur: 5.7, q: "who are you Autobot" },
  { n: 12, tc: "0:59", dur: 4.9, q: "I do not know who that is" },
  { n: 14, tc: "1:10", dur: 7.3, q: "Decepticons attack Autobot shuttle" },
  { n: 15, tc: "1:17", dur: 5.4, q: "transform and roll out" },
  { n: 16, tc: "1:22", dur: 6.7, q: "Megatron I will crush you" },
  { n: 17, tc: "1:29", dur: 4.7, q: "Optimus Prime dies" },
  { n: 18, tc: "1:34", dur: 4.3, q: "do not grieve Optimus" },
  // Plan 022 fait 8,2 s a l'ecran : deux extraits de ~4,1 s au lieu d'un seul,
  // pour rester sous la barre des 7 secondes continues.
  { n: 22, tc: "1:51", dur: 4.1, q: "Autobots retreat battle",  suffix: "a" },
  { n: 22, tc: "1:55", dur: 4.1, q: "Decepticons pursue Autobots", suffix: "b" },
  { n: 23, tc: "1:59", dur: 6.3, q: "Decepticons attack city" },
  { n: 25, tc: "2:10", dur: 6.9, q: "Hot Rod" },
  { n: 26, tc: "2:17", dur: 6.5, q: "Unicron" },
];

const CAP = 7.0; // plafond dur : aucun extrait ne depasse 7 s
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?api_key=${encodeURIComponent(KEY)}&${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Clip.cafe a repondu ${res.status}`);
  const data = await res.json();
  return (data?.hits?.hits || []).map((h) => h._source).filter(Boolean);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`${cmd} code ${c}\n${err.slice(-600)}`))));
  });
}

async function search() {
  const choices = {};
  for (const s of SHOTS) {
    const tag = String(s.n).padStart(3, "0") + (s.suffix || "");
    process.stdout.write(`plan ${tag}  "${s.q}" ... `);
    try {
      const hits = await api(`transcript=${encodeURIComponent(s.q)}&size=8`);
      choices[tag] = hits.map((h) => ({
        slug: h.slug,
        movie: h.movie_title,
        quote: h.title,
        duration: h.duration,
        page: `https://clip.cafe/${h.movie_slug}/${h.slug}/`,
      }));
      console.log(`${hits.length} resultat(s)`);
      hits.slice(0, 4).forEach((h, i) =>
        console.log(`        [${i}] ${h.movie_title} — ${String(h.title || "").slice(0, 70)}`)
      );
      if (!hits.length) console.log("        (aucun resultat : reformule la requete)");
    } catch (e) {
      console.log(`ECHEC : ${e.message}`);
      choices[tag] = [];
    }
    await sleep(400); // on ne martele pas leur API
  }
  fs.writeFileSync("choices.json", JSON.stringify(choices, null, 2));
  const picks = Object.fromEntries(SHOTS.map((s) => [String(s.n).padStart(3, "0") + (s.suffix || ""), 0]));
  if (!fs.existsSync("picks.json")) fs.writeFileSync("picks.json", JSON.stringify(picks, null, 2));
  console.log(`\nEcrit choices.json et picks.json.`);
  console.log(`Verifie la colonne "movie" : une requete peut ramener un extrait d'un autre film.`);
  console.log(`Corrige picks.json si besoin, puis : node clipcafe-film1.mjs fetch`);
}

async function fetchAll() {
  if (!fs.existsSync("choices.json")) {
    console.error("Lance d'abord : node clipcafe-film1.mjs search");
    process.exit(1);
  }
  const choices = JSON.parse(fs.readFileSync("choices.json", "utf8"));
  const picks = fs.existsSync("picks.json") ? JSON.parse(fs.readFileSync("picks.json", "utf8")) : {};
  fs.mkdirSync(OUT, { recursive: true });

  const manifest = [];
  for (const s of SHOTS) {
    const tag = String(s.n).padStart(3, "0") + (s.suffix || "");
    const list = choices[tag] || [];
    const idx = picks[tag] ?? 0;
    const chosen = list[idx];

    if (!chosen) {
      console.log(`plan ${tag}  AUCUN CHOIX — a traiter a la main`);
      manifest.push({ shot: tag, status: "manquant", query: s.q });
      continue;
    }

    process.stdout.write(`plan ${tag}  ${chosen.movie} ... `);
    try {
      // Lien de telechargement frais : celui de la recherche expire apres ~5 min.
      const fresh = await api(`slug=${encodeURIComponent(chosen.slug)}&size=1`);
      const url = fresh[0]?.download;
      if (!url) throw new Error("pas de lien de telechargement pour ce slug");

      const raw = path.join(OUT, `${tag}-src.mp4`);
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`telechargement HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2048) throw new Error("fichier trop petit, lien probablement expire");
      fs.writeFileSync(raw, buf);

      // Coupe a la duree du plan, plafonnee a 7 s. Reencodage pour une coupe nette
      // (le -c copy couperait sur l'image cle precedente).
      const dur = Math.min(s.dur, CAP);
      const cut = path.join(OUT, `${tag}-${chosen.slug}.mp4`);
      await run("ffmpeg", [
        "-y", "-i", raw, "-t", String(dur),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k",
        cut,
      ]);
      fs.unlinkSync(raw);

      console.log(`ok — ${dur.toFixed(1)}s`);
      manifest.push({
        shot: tag, tc: s.tc, duration: dur, status: "ok",
        file: cut, movie: chosen.movie, quote: chosen.quote,
        slug: chosen.slug, page: chosen.page, query: s.q,
      });
    } catch (e) {
      console.log(`ECHEC : ${e.message}`);
      manifest.push({ shot: tag, status: "echec", erreur: e.message, query: s.q });
    }
    await sleep(500);
  }

  fs.writeFileSync("manifest-film1.json", JSON.stringify(manifest, null, 2));
  const ok = manifest.filter((m) => m.status === "ok").length;
  console.log(`\n${ok}/${SHOTS.length} extraits recuperes dans ${OUT}/`);
  console.log(`Detail dans manifest-film1.json`);
  const bad = manifest.filter((m) => m.status !== "ok");
  if (bad.length) {
    console.log(`\nA reprendre : ${bad.map((b) => b.shot).join(", ")}`);
  }
}

const cmd = process.argv[2];
if (cmd === "search") await search();
else if (cmd === "fetch") await fetchAll();
else {
  console.log("Usage : node clipcafe-film1.mjs search   puis   node clipcafe-film1.mjs fetch");
  process.exit(1);
}

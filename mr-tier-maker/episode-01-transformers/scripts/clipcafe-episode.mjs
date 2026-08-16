#!/usr/bin/env node
/**
 * MR TierMaker — recuperation des extraits de TOUT un episode.
 *
 * Le script precedent (clipcafe-film1.mjs) ne connaissait qu'un seul film :
 * Transformers 1986. Celui-ci lit le plan de montage et traite les neuf films,
 * en contraignant chaque recherche au bon titre et a la bonne annee — sans quoi
 * l'index, domine par les films Bay, renvoie n'importe quoi.
 *
 *   export CLIP_CAFE_API_KEY="..."
 *   node clipcafe-episode.mjs plan-episode-01.json          # tous les films
 *   node clipcafe-episode.mjs plan-episode-01.json 3        # segment 3 seulement
 */
import fs from "node:fs";
import { spawn } from "node:child_process";

const KEY = process.env.CLIP_CAFE_API_KEY;
if (!KEY) { console.error("Manque CLIP_CAFE_API_KEY"); process.exit(1); }

const PLAN = process.argv[2] || "plan-episode-01.json";
const ONLY = process.argv[3] ? Number(process.argv[3]) : null;

const API = "https://api.clip.cafe/";
const OUT = "clips";
const CAP = 7.0;            // aucun extrait ne depasse 7 s
const RATE_MS = 6500;       // plan PRO : 10 requetes/minute
const DURATION_RANGE = "3-30";

// index de segment -> film. L'ordre suit le plan de montage.
const FILMS = [
  { titre: "Transformers",  annee: "1986" },
  { titre: "Transformers",  annee: "2007" },
  { titre: "Transformers",  annee: "2009" },
  { titre: "Transformers",  annee: "2011" },
  { titre: "Transformers",  annee: "2014" },
  { titre: "Transformers",  annee: "2017" },
  { titre: "Bumblebee",     annee: "2018" },
  { titre: "Transformers One", annee: "2024" },
  { titre: "Transformers Rise of the Beasts", annee: "2023" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params, binary = false) {
  const res = await fetch(`${API}?api_key=${encodeURIComponent(KEY)}&${params}`,
    { signal: AbortSignal.timeout(60000) });
  if (res.status === 429) throw new Error("429 : ralentis RATE_MS");
  if (res.status === 401) throw new Error("401 : cle refusee");
  if (!res.ok) throw new Error(`Clip.cafe ${res.status}`);
  if (binary) return Buffer.from(await res.arrayBuffer());
  const d = await res.json();
  return (d?.hits?.hits || []).map((h) => h._source).filter(Boolean);
}

const params = (film, q, champ) => {
  const p = new URLSearchParams();
  p.set(champ, q);
  if (film) { p.set("movie_title", film.titre); p.set("movie_year", film.annee); }
  p.set("duration", DURATION_RANGE);
  p.set("size", "8");
  return p.toString();
};

function ffmpeg(args) {
  return new Promise((ok, ko) => {
    const p = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = ""; p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c === 0 ? ok() : ko(new Error(err.slice(-400)))));
  });
}

const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const shots = plan.filter((r) => r.type === "CLIP" && r.requete
  && (ONLY === null || r.seg === ONLY));

fs.mkdirSync(OUT, { recursive: true });
console.log(`${shots.length} extrait(s) a chercher\n`);

const rapport = [];
for (const s of shots) {
  const film = FILMS[s.seg] || null;
  const tag = String(s.n).padStart(3, "0");
  const dest = `${OUT}/${tag}.mp4`;
  if (fs.existsSync(dest)) { console.log(`= ${tag} deja la`); continue; }

  let hits = [];
  // "captions" cherche sur ce qu'on voit, "transcript" sur les repliques.
  // On tente le visuel d'abord : la plupart des notes decrivent une action.
  for (const champ of ["captions", "transcript"]) {
    try { hits = await api(params(film, s.requete, champ)); } catch (e) {
      console.log(`! ${tag} ${e.message}`); }
    await sleep(RATE_MS);
    if (hits.length) break;
  }
  // dernier recours : sans contrainte de film
  if (!hits.length) {
    try { hits = await api(params(null, s.requete, "captions")); } catch {}
    await sleep(RATE_MS);
  }
  if (!hits.length) {
    console.log(`x ${tag} aucun resultat  "${s.requete}"`);
    rapport.push({ plan: s.n, seg: s.seg, requete: s.requete, etat: "aucun resultat" });
    continue;
  }

  const h = hits[0];
  const url = h.download?.startsWith("http")
    ? h.download
    : `${API}?api_key=${encodeURIComponent(KEY)}&slug=${encodeURIComponent(h.slug)}&key=${encodeURIComponent(h.download)}`;
  try {
    const buf = await api(url.startsWith("http") && !url.includes("api_key")
      ? url : url.split("?")[1], true);
    fs.writeFileSync(`${OUT}/_${tag}.mp4`, buf);
    // on coupe a 7 s : c'est la limite qu'on s'impose sur les extraits
    await ffmpeg(["-y", "-loglevel", "error", "-i", `${OUT}/_${tag}.mp4`,
      "-t", String(CAP), "-c", "copy", dest]);
    fs.unlinkSync(`${OUT}/_${tag}.mp4`);
    console.log(`+ ${tag} ${h.slug}`);
    rapport.push({ plan: s.n, seg: s.seg, requete: s.requete, slug: h.slug, etat: "ok" });
  } catch (e) {
    console.log(`! ${tag} telechargement : ${e.message}`);
    rapport.push({ plan: s.n, seg: s.seg, requete: s.requete, etat: "echec telechargement" });
  }
  await sleep(RATE_MS);
}

fs.writeFileSync(`${OUT}/rapport.json`, JSON.stringify(rapport, null, 1));
const ok = rapport.filter((r) => r.etat === "ok").length;
console.log(`\n${ok}/${shots.length} extraits recuperes`);

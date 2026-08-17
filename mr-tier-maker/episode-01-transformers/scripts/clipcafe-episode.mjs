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
 *   PLANS=085,111 node clipcafe-episode.mjs plan.json       # ces deux plans
 *   PLANS=034 REQUETE="a|b|c" node ...                      # essaie a, puis b, puis c
 *
 * PLANS permet de rattraper quelques plans sans repayer tout un segment. Mais
 * un run partiel ne voit pas ce que les runs precedents ont deja pris : sans
 * garde-fou il choisirait le meme clip qu un plan voisin, exactement le piege
 * que la deduplication evite a l interieur d un run. EXCLURE sert a ca — on y
 * met les slugs deja utilises pour le meme film (ils sont dans le log du run
 * precedent, ou dans clips/rapport.json).
 *
 *   PLANS=085 EXCLURE=so-what-about-the-deal-is-done,calling-all-autobots-s1 \
 *     node clipcafe-episode.mjs plan.json
 */
import fs from "node:fs";
import { spawn } from "node:child_process";

const KEY = process.env.CLIP_CAFE_API_KEY;
if (!KEY) { console.error("Manque CLIP_CAFE_API_KEY"); process.exit(1); }

const PLAN = process.argv[2] || "plan-episode-01.json";
const ONLY = process.argv[3] ? Number(process.argv[3]) : null;
const decoupe = (v) => (v || "").split(/[,\s]+/).filter(Boolean);
const PLANS = decoupe(process.env.PLANS).map(Number);
const EXCLURE = decoupe(process.env.EXCLURE);
const REQUETE = (process.env.REQUETE || "").split("|").map((x) => x.trim()).filter(Boolean);

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
  // segment 7 = Rise of the Beasts, segment 8 = Transformers One. Les deux
  // etaient inverses ici comme dans plan.py : les 19 extraits de ces deux
  // segments ont ete cherches dans le mauvais film.
  { titre: "Transformers Rise of the Beasts", annee: "2023" },
  { titre: "Transformers One", annee: "2024" },
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

const params = (film, q, champ, taille = 8) => {
  const p = new URLSearchParams();
  p.set(champ, q);
  if (film) { p.set("movie_title", film.titre); p.set("movie_year", film.annee); }
  p.set("duration", DURATION_RANGE);
  p.set("size", String(taille));
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
  && (PLANS.length ? PLANS.includes(r.n) : (ONLY === null || r.seg === ONLY)));

fs.mkdirSync(OUT, { recursive: true });
console.log(`${shots.length} extrait(s) a chercher`);
if (PLANS.length) {
  const absents = PLANS.filter((n) => !shots.some((s) => s.n === n));
  if (absents.length) console.log(`! demandes mais pas des plans CLIP : ${absents.join(", ")}`);
}
if (EXCLURE.length) console.log(`${EXCLURE.length} slug(s) deja pris, ecartes d office`);
if (REQUETE.length) console.log(`requete(s) imposee(s) : ${REQUETE.join("  |  ")}`);
console.log("");

// La recherche semantique de Clip.cafe converge : sur un catalogue etroit, elle
// renvoie les memes 4-5 extraits quelle que soit la requete. Sans garde-fou,
// trois plans differents recoivent le meme clip. On tient donc la liste de ce
// qui est deja pris et on descend dans les resultats jusqu a un slug neuf.
const pris = new Set(EXCLURE);
const rapport = [];
for (const s of shots) {
  const film = FILMS[s.seg] || null;
  const tag = String(s.n).padStart(3, "0");
  const dest = `${OUT}/${tag}.mp4`;
  if (fs.existsSync(dest)) { console.log(`= ${tag} deja la`); continue; }

  let hits = [];
  const requetes = REQUETE.length ? REQUETE : [s.requete];
  // "captions" cherche sur ce qu'on voit, "transcript" sur les repliques.
  // On tente le visuel d'abord : la plupart des notes decrivent une action.
  // On cumule les deux au lieu de s'arreter au premier qui repond : plus le
  // vivier est large, moins on tombe sur un doublon.
  boucle:
  for (const q of requetes) {
    for (const champ of ["captions", "transcript"]) {
      try {
        const r = await api(params(film, q, champ));
        for (const x of r) if (!hits.some((y) => y.slug === x.slug)) hits.push(x);
      } catch (e) { console.log(`! ${tag} ${e.message}`); }
      await sleep(RATE_MS);
      if (hits.filter((x) => !pris.has(x.slug)).length >= 3) break boucle;
    }
  }
  // Pas assez de candidats neufs : on redemande large avant d abandonner. Le
  // plan 034 est mort comme ca — sur 8 resultats, 7 etaient deja pris et le
  // huitieme rendait un 404. Il ne restait rien a essayer.
  if (hits.filter((x) => !pris.has(x.slug)).length < 2 && film) {
    for (const champ of ["captions", "transcript"]) {
      try {
        const r = await api(params(film, requetes[0], champ, 25));
        for (const x of r) if (!hits.some((y) => y.slug === x.slug)) hits.push(x);
      } catch (e) { console.log(`! ${tag} ${e.message}`); }
      await sleep(RATE_MS);
    }
    console.log(`  ${tag} recherche elargie : ${hits.filter((x) => !pris.has(x.slug)).length} candidat(s) neufs`);
  }

  // PAS de repli sans contrainte de film. Il existait, et il a fait entrer un
  // extrait d actualite indienne dans une tier list Transformers : le plan 128
  // ne trouvait rien dans Rise of the Beasts, le script relachait la contrainte
  // en silence, et prenait le premier resultat du catalogue entier. Mieux vaut
  // un plan vide, qui se voit, qu un plan hors sujet, qui passe.
  if (!hits.length) {
    console.log(`x ${tag} aucun resultat  "${s.requete}"`);
    rapport.push({ plan: s.n, seg: s.seg, requete: s.requete, etat: "aucun resultat" });
    continue;
  }

  // Un 404 au telechargement ne veut pas dire "ce plan est perdu" : le clip
  // existe dans l index mais son fichier n est pas servable. On passe donc au
  // candidat suivant au lieu d abandonner. Sans ca, un second passage refait
  // exactement les memes choix et rate exactement les memes extraits.
  const candidats = hits.filter((x) => !pris.has(x.slug));
  if (!candidats.length) {
    console.log(`x ${tag} tous les resultats sont deja utilises  "${s.requete}"`);
    rapport.push({ plan: s.n, seg: s.seg, requete: s.requete, etat: "doublon inevitable",
                   proposes: hits.map((x) => x.slug) });
    continue;
  }

  let pose = false;
  for (const [k, h] of candidats.entries()) {
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
      pris.add(h.slug);
      const suite = hits.indexOf(h) ? `   (${hits.indexOf(h) + 1}e resultat)` : "";
      console.log(`+ ${tag} ${h.slug}${suite}${k ? `   apres ${k} echec(s)` : ""}`);
      rapport.push({ plan: s.n, seg: s.seg, requete: s.requete, slug: h.slug,
                     rang: hits.indexOf(h) + 1, echecs: k, etat: "ok" });
      pose = true;
      break;
    } catch (e) {
      console.log(`  ${tag} ${h.slug} : ${e.message}, on essaie le suivant`);
      await sleep(RATE_MS);
    }
  }
  if (!pose) {
    console.log(`x ${tag} aucun candidat telechargeable  "${s.requete}"`);
    rapport.push({ plan: s.n, seg: s.seg, requete: s.requete, etat: "aucun telechargeable",
                   essayes: candidats.map((x) => x.slug) });
  }
  await sleep(RATE_MS);
}

fs.writeFileSync(`${OUT}/rapport.json`, JSON.stringify(rapport, null, 1));
const ok = rapport.filter((r) => r.etat === "ok");
const distincts = new Set(ok.map((r) => r.slug)).size;
console.log(`\n${ok.length}/${shots.length} extraits recuperes, ${distincts} distincts`);
if (distincts < ok.length) console.log("ATTENTION : des doublons subsistent, voir rapport.json");

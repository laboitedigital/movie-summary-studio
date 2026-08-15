#!/usr/bin/env node
/**
 * MR Tier Maker — recuperation des extraits Clip.cafe
 * Episode 01 "Transformers", segment 1 : The Transformers: The Movie (1986), plans 9 a 29.
 * 14 extraits (le plan 022 est coupe en deux : 022a et 022b).
 *
 * Ecrit d'apres la doc officielle https://clip.cafe/api-docs/ :
 *  - toute recherche genere une cle de telechargement valable 5 minutes
 *  - le telechargement est un appel separe : ?api_key=..&slug=..&key=..
 *  - les entiers acceptent des intervalles : duration=3-10, movie_year=1986
 *  - "captions" fait de la recherche semantique sur l'image, "transcript" sur les repliques
 *
 * Prerequis : Node 18+, ffmpeg dans le PATH.
 *
 *   export CLIP_CAFE_API_KEY="ta_cle"
 *   node clipcafe-film1.mjs search     # cherche et ecrit choices.json (aucun telechargement)
 *   node clipcafe-film1.mjs fetch      # telecharge + coupe les extraits choisis
 *
 * Entre les deux, ouvre choices.json et verifie chaque resultat. Pour changer un
 * choix, mets l'index voulu dans picks.json (0 = premier) puis relance "fetch".
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const KEY = process.env.CLIP_CAFE_API_KEY;
if (!KEY) {
  console.error('Manque CLIP_CAFE_API_KEY. Fais : export CLIP_CAFE_API_KEY="..."');
  process.exit(1);
}

const OUT = "clips-film1";
const API = "https://api.clip.cafe/";

// Tous les plans de ce segment viennent du meme film : on contraint la recherche
// dessus pour ne pas ramener un extrait des films Bay, qui dominent l'index.
const FILM = { movie_title: "Transformers", movie_year: "1986" };

// mode "transcript" = cherche dans les repliques prononcees.
// mode "captions"   = recherche semantique sur ce qu'on voit. A utiliser des que
//                     le plan decrit une action plutot qu'une ligne de dialogue.
// dur = temps A L ECRAN du plan : il tient jusqu'au debut du suivant, silences compris.
const SHOTS = [
  { n:  9, tc: "0:42", dur: 7.2, mode: "transcript", q: "one shall stand one shall fall" },
  { n: 10, tc: "0:49", dur: 4.3, mode: "captions",   q: "robot transforming into a vehicle" },
  { n: 11, tc: "0:53", dur: 5.7, mode: "captions",   q: "crowd of many different robot characters" },
  { n: 12, tc: "0:59", dur: 4.9, mode: "transcript", q: "who is that" },
  { n: 14, tc: "1:10", dur: 7.3, mode: "captions",   q: "space battle between robot ships" },
  { n: 15, tc: "1:17", dur: 5.4, mode: "captions",   q: "close up of mechanical transformation" },
  { n: 16, tc: "1:22", dur: 6.7, mode: "captions",   q: "two giant robots face each other before fighting" },
  { n: 17, tc: "1:29", dur: 4.7, mode: "captions",   q: "robot leader dying on a table" },
  { n: 18, tc: "1:34", dur: 4.3, mode: "transcript", q: "do not grieve" },
  { n: 22, tc: "1:51", dur: 4.1, mode: "captions",   q: "robots fleeing an explosion", suffix: "a" },
  { n: 22, tc: "1:55", dur: 4.1, mode: "captions",   q: "aerial chase between robots", suffix: "b" },
  { n: 23, tc: "1:59", dur: 6.3, mode: "captions",   q: "city under attack by robots" },
  { n: 25, tc: "2:10", dur: 6.9, mode: "transcript", q: "Hot Rod" },
  { n: 26, tc: "2:17", dur: 6.5, mode: "transcript", q: "Unicron" },
];

const CAP = 7.0;        // aucun extrait ne depasse 7 s continues
const RATE_MS = 6500;   // plan PRO : 10 requetes/minute, soit une toutes les 6 s
const DURATION_RANGE = "3-30"; // on ecarte les micro-clips inutilisables

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tagOf = (s) => String(s.n).padStart(3, "0") + (s.suffix || "");

async function api(params, { binary = false } = {}) {
  const url = `${API}?api_key=${encodeURIComponent(KEY)}&${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (res.status === 429) throw new Error("429 : limite de debit depassee, ralentis RATE_MS");
  if (res.status === 401) throw new Error("401 : cle API refusee");
  if (!res.ok) throw new Error(`Clip.cafe a repondu ${res.status}`);
  if (binary) return Buffer.from(await res.arrayBuffer());
  const data = await res.json();
  return (data?.hits?.hits || []).map((h) => h._source).filter(Boolean);
}

function query(s, { constrained = true } = {}) {
  const p = new URLSearchParams();
  p.set(s.mode, s.q);
  p.set("duration", DURATION_RANGE);
  p.set("size", "8");
  if (constrained) for (const [k, v] of Object.entries(FILM)) p.set(k, v);
  return p.toString();
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

/**
 * Liste TOUT le catalogue Clip.cafe pour ce film en une seule requete.
 *
 * La recherche par "captions" s'est revelee inutilisable sur ce catalogue : elle
 * renvoie les memes quelques extraits quelle que soit la question, ce qui menait
 * cinq plans differents a choisir le meme clip. Le film n'ayant qu'une vingtaine
 * d'extraits indexes, il est plus simple et plus sur de tous les lister, puis
 * d'assigner a la main dans assign.json.
 */
async function catalogue() {
  console.log("Une seule requete pour lister tout le catalogue du film.\n");
  const all = [];
  for (let from = 0; from < 200; from += 100) {
    const p = new URLSearchParams({ ...FILM, size: "100", from: String(from), sort: "duration", order: "asc" });
    const hits = await api(p.toString());
    all.push(...hits);
    if (hits.length < 100) break;
    await sleep(RATE_MS);
  }

  const rows = all.map((h) => ({
    slug: h.slug,
    quote: h.title,
    duration: h.duration,
    movie: h.movie_title,
    year: h.movie_year,
    page: `https://clip.cafe/${h.movie_slug}/${h.slug}/`,
  }));
  fs.writeFileSync("catalogue.json", JSON.stringify(rows, null, 2));

  console.log(`${rows.length} extraits disponibles pour ${FILM.movie_title} ${FILM.movie_year} :\n`);
  for (const r of rows) {
    console.log(`  ${String(r.duration ?? "?").padStart(3)}s  ${r.slug.padEnd(46)} ${r.quote}`);
  }
  console.log(`\nEcrit catalogue.json. Assigne ensuite les slugs aux plans dans assign.json,`);
  console.log(`au format { "009": "slug-du-clip", "010": "...", ... }, puis lance fetch.`);
}

async function search() {
  const choices = {};
  console.log(`${SHOTS.length} plans, une requete toutes les ${RATE_MS / 1000} s (limite PRO : 10/min).`);
  console.log(`Duree estimee : ~${Math.ceil((SHOTS.length * RATE_MS) / 60000)} min. Aucun telechargement.\n`);

  for (const s of SHOTS) {
    const tag = tagOf(s);
    process.stdout.write(`plan ${tag}  [${s.mode}] "${s.q}" ... `);
    try {
      let hits = await api(query(s));
      let loosened = false;
      if (!hits.length) {
        // Rien dans le film cible : on relache la contrainte de film pour voir
        // ce qui existe ailleurs, en le signalant clairement.
        await sleep(RATE_MS);
        hits = await api(query(s, { constrained: false }));
        loosened = true;
      }
      choices[tag] = hits.map((h) => ({
        slug: h.slug,
        key: h.download ?? null,      // cle de telechargement, valable 5 min
        movie: h.movie_title,
        year: h.movie_year,
        quote: h.title,
        duration: h.duration,
        page: `https://clip.cafe/${h.movie_slug}/${h.slug}/`,
      }));
      console.log(`${hits.length} resultat(s)${loosened ? "  [HORS FILM CIBLE]" : ""}`);
      hits.slice(0, 4).forEach((h, i) =>
        console.log(`        [${i}] ${h.movie_title} (${h.movie_year ?? "?"}) ${h.duration ?? "?"}s — ${String(h.title || "").slice(0, 60)}`)
      );
      if (!hits.length) console.log("        aucun resultat, reformule la requete");
    } catch (e) {
      console.log(`ECHEC : ${e.message}`);
      choices[tag] = [];
    }
    await sleep(RATE_MS);
  }

  fs.writeFileSync("choices.json", JSON.stringify(choices, null, 2));
  if (!fs.existsSync("picks.json")) {
    fs.writeFileSync("picks.json", JSON.stringify(Object.fromEntries(SHOTS.map((s) => [tagOf(s), 0])), null, 2));
  }
  console.log(`\nEcrit choices.json et picks.json.`);
  console.log(`Verifie "movie" et "year" : tout doit dire Transformers 1986.`);
  console.log(`Puis : node clipcafe-film1.mjs fetch`);
}

async function fetchAll() {
  if (!fs.existsSync("choices.json") && !fs.existsSync("assign.json")) {
    console.error("Lance d'abord : node clipcafe-film1.mjs catalogue (puis remplis assign.json)");
    process.exit(1);
  }
  const choices = fs.existsSync("choices.json") ? JSON.parse(fs.readFileSync("choices.json", "utf8")) : {};
  const picks = fs.existsSync("picks.json") ? JSON.parse(fs.readFileSync("picks.json", "utf8")) : {};
  // assign.json fait autorite : il associe directement un plan a un slug choisi
  // dans le catalogue, sans passer par le classement de l'API.
  const assign = fs.existsSync("assign.json") ? JSON.parse(fs.readFileSync("assign.json", "utf8")) : {};
  fs.mkdirSync(OUT, { recursive: true });

  console.log(`${SHOTS.length} extraits. Chacun consomme 1 requete et 1 telechargement du`);
  console.log(`quota mensuel (plan PRO : 10 000 requetes, 1 000 telechargements).\n`);

  const manifest = [];
  for (const s of SHOTS) {
    const tag = tagOf(s);
    const chosen = assign[tag]
      ? { slug: assign[tag], movie: FILM.movie_title, year: FILM.movie_year, quote: "(assigne a la main)", page: null }
      : (choices[tag] || [])[picks[tag] ?? 0];

    if (!chosen) {
      console.log(`plan ${tag}  AUCUN CHOIX — a traiter a la main`);
      manifest.push({ shot: tag, status: "manquant", query: s.q });
      continue;
    }

    process.stdout.write(`plan ${tag}  ${chosen.movie} ... `);
    try {
      // La cle de telechargement expire apres 5 min, donc celle de la phase
      // "search" est morte. On refait une recherche par slug pour en obtenir
      // une fraiche, puis on telecharge dans la foulee.
      const fresh = (await api(`slug=${encodeURIComponent(chosen.slug)}&size=1`))[0];
      if (!fresh) throw new Error("slug introuvable");
      const dl = fresh.download;
      if (!dl) throw new Error("aucune cle de telechargement renvoyee");

      // Selon les comptes, "download" est soit une URL complete, soit la cle
      // a passer a l'endpoint documente. On gere les deux.
      const raw = path.join(OUT, `${tag}-src.mp4`);
      let buf;
      if (typeof dl === "string" && dl.startsWith("http")) {
        const r = await fetch(dl, { signal: AbortSignal.timeout(120000) });
        if (!r.ok) throw new Error(`telechargement HTTP ${r.status}`);
        buf = Buffer.from(await r.arrayBuffer());
      } else {
        buf = await api(
          `slug=${encodeURIComponent(chosen.slug)}&key=${encodeURIComponent(dl)}`,
          { binary: true }
        );
      }
      if (buf.length < 2048) throw new Error("fichier trop petit, cle probablement expiree");
      fs.writeFileSync(raw, buf);

      // Coupe a la duree du plan, plafonnee a 7 s. Reencodage pour une coupe nette :
      // un -c copy couperait sur l'image cle precedente.
      const dur = Math.min(s.dur, CAP);
      const cut = path.join(OUT, `${tag}-${chosen.slug}.mp4`);
      await run("ffmpeg", [
        "-y", "-i", raw, "-t", String(dur),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", cut,
      ]);
      fs.unlinkSync(raw);

      console.log(`ok — ${dur.toFixed(1)}s`);
      manifest.push({
        shot: tag, tc: s.tc, duration: dur, status: "ok", file: cut,
        movie: chosen.movie, year: chosen.year, quote: chosen.quote,
        slug: chosen.slug, page: chosen.page, mode: s.mode, query: s.q,
      });
    } catch (e) {
      console.log(`ECHEC : ${e.message}`);
      manifest.push({ shot: tag, status: "echec", erreur: e.message, query: s.q });
    }
    await sleep(RATE_MS);
  }

  fs.writeFileSync("manifest-film1.json", JSON.stringify(manifest, null, 2));
  const ok = manifest.filter((m) => m.status === "ok").length;
  console.log(`\n${ok}/${SHOTS.length} extraits recuperes dans ${OUT}/`);
  console.log(`Detail dans manifest-film1.json`);
  const bad = manifest.filter((m) => m.status !== "ok");
  if (bad.length) console.log(`\nA reprendre : ${bad.map((b) => b.shot).join(", ")}`);
}

const cmd = process.argv[2];
if (cmd === "catalogue") await catalogue();
else if (cmd === "search") await search();
else if (cmd === "fetch") await fetchAll();
else {
  console.log("Usage :");
  console.log("  node clipcafe-film1.mjs catalogue   liste tous les extraits du film (1 requete)");
  console.log("  node clipcafe-film1.mjs search      cherche plan par plan (14 requetes)");
  console.log("  node clipcafe-film1.mjs fetch       telecharge selon assign.json ou picks.json");
  process.exit(1);
}

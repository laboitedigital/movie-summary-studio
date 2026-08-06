# Habillage motion design (Remotion)

Ajoute une couche de motion graphics par-dessus une vidéo déjà rendue :
carton d'intro, cartons de chapitre, punchlines, entourages au feutre,
barre de progression, bug d'abonnement et carton de fin.

Le style (fond blanc, trait encre bleu nuit, accents orange/bleu) est calqué
sur le rendu « whiteboard cartoon » des vidéos générées par le studio, pour
que l'habillage se fonde dans l'image au lieu de se poser dessus.

## Installation

```bash
cd motion
npm install
```

Puis déposer la vidéo à habiller ici :

```
motion/public/source.mp4
```

Elle est volontairement exclue de git (`.gitignore`) : c'est un binaire lourd
qui n'a pas à vivre dans l'historique.

## Utilisation

```bash
npm run studio          # éditeur interactif, aperçu temps réel
npm run render          # rendu final -> out/video-habillee.mp4
npm run render:preview  # aperçu 12 s -> out/apercu.mp4
npm run fonts           # régénère src/fonts-inline.ts depuis public/fonts
npm run lint            # typecheck
```

Pour viser un passage précis sans re-encoder les 4 min 28 :

```bash
npx remotion render Apercu out/test.mp4 --props='{"offsetSec":22}'
```

### Compositions

| Composition      | Contenu                                    |
| ---------------- | ------------------------------------------ |
| `Habillage`      | la vidéo entière habillée (rendu final)    |
| `Apercu`         | 12 s à partir du début (intro + balayage)  |
| `ApercuChapitre` | 10 s à partir de 18 s (carton chapitre 01) |
| `ApercuFin`      | 9,5 s à partir de 258,5 s (carton de fin)  |

Les aperçus partagent le composant du rendu final : ils prennent une prop
`offsetSec` et décalent la lecture, sans jamais désynchroniser les overlays
(ceux-ci sont calés sur le temps absolu de la vidéo source).

## Adapter l'habillage

**Tout se règle dans `src/timeline.ts`.** C'est le seul fichier à éditer pour
changer les textes, les timings ou la marque :

- `INTRO` — carton d'ouverture (titre, kicker, sous-titre, durée)
- `CHAPTERS` — les 5 chapitres plein cadre et leur position
- `KEYWORDS` — les punchlines + note manuscrite
- `HIGHLIGHTS` — les entourages au feutre (coordonnées en px sur 1920×1080)
- `BRAND` — pastille de chaîne en haut à droite, barre de progression
- `SUBSCRIBE_BUG` / `OUTRO` — appels à l'action de fin

Les couleurs et les polices sont dans `src/theme.ts`.

### Plein cadre ou posé sur l'image

Deux registres cohabitent, et c'est un réglage, pas une fatalité :

| Élément                       | Registre            | Réglage                              |
| ----------------------------- | ------------------- | ------------------------------------ |
| Intro / chapitres / outro     | plein cadre         | toujours                             |
| Punchline                     | au choix            | `fullscreen: true` sur l'entrée      |
| Entourages, pastille, barre   | posé sur l'image    | toujours                             |

Une punchline `fullscreen` devient un carton plein cadre avec texte géant
révélé mot à mot ; sans le drapeau, elle reste une pastille discrète en bas de
cadre qui laisse voir le schéma. Sur les 8 punchlines, 4 sont en plein cadre —
alterner évite que le procédé s'use.

Les durées des moments plein cadre se règlent avec `CHAPTER_ENTER` /
`CHAPTER_HOLD` / `CHAPTER_EXIT` et leurs équivalents `STATEMENT_*`.

### Les chapitres masquent les coupes

`CHAPTER_ENTER` sert aussi de calage : le panneau de chapitre couvre le cadre
**exactement au moment de la coupe de plan**, si bien que la coupe sèche de la
vidéo source se produit derrière lui et que la sortie révèle directement le
nouveau plan. Les micro-transitions sont donc désactivées sur ces coupes-là
(`CHAPTER_CUTS` dans `SceneTransition.tsx`) — sinon elles feraient doublon.

### D'où viennent les timings

Les 14 coupes de plan de `SCENE_CUTS` ont été **mesurées** sur la vidéo source
par détection de changement de scène :

```bash
ffmpeg -i source.mp4 -filter:v "select='gt(scene,0.35)',showinfo" -f null -
```

Chaque overlay est calé sur une de ces coupes, donc sur un vrai changement de
plan et pas sur une estimation.

Pour réutiliser ce projet sur **une autre vidéo**, relancer cette commande sur
la nouvelle source, remplacer `SCENE_CUTS`, `SOURCE_DURATION_IN_FRAMES` et
réécrire `CHAPTERS` / `KEYWORDS`.

### Les textes, en revanche, sont à relire

Ils ont été déduits de ce qui est **visible à l'écran** (schémas, libellés,
pictogrammes), pas de la narration : la transcription audio n'a pas pu être
faite dans l'environnement de build (`huggingface.co` bloqué par la politique
réseau). Si une punchline tombe à côté de ce que dit la voix off, c'est dans
`src/timeline.ts` que ça se corrige.

## Polices

Poppins (600/800) et Caveat (700) sont **embarquées** : les `.woff2` de
`public/fonts/` sont inlinés en base64 dans `src/fonts-inline.ts` et déclarés
en `@font-face` CSS. Le rendu ne dépend donc d'aucun accès réseau et il est
reproductible à l'identique.

Après avoir changé un fichier de police :

```bash
npm run fonts   # régénère src/fonts-inline.ts
```

Le chargement est volontairement fait **sans `delayRender()`** : Remotion
attend déjà `document.fonts.ready` avant de capturer chaque frame. Les deux
variantes à base de `delayRender` (d'abord `staticFile()`, puis data URI)
bloquaient le rendu long — sur les pages que Remotion ouvre en cours de route,
le handle n'était jamais libéré et le rendu s'arrêtait vers la frame 770.

## Rendu sans Chrome préinstallé

Remotion télécharge son propre Chrome Headless Shell au premier rendu. Si le
réseau le bloque, pointer sur un Chromium déjà présent :

```bash
npx remotion render Habillage out/video-habillee.mp4 \
  --browser-executable=/chemin/vers/chromium
```

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dd5e38b2-db2a-41a7-8cb1-ee4fe194aa03

## Run Locally

**Prerequisites:**  Node.js, **ffmpeg + ffprobe installed and available in your system PATH**


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Mode "Vox Doc Engine" (documentaire en collage papier)

Le studio héberge une seconde chaîne de production, accessible par le sélecteur en haut à droite.
Là où le mode "Résumé de film" monte des extraits Clip.Cafe existants, le Vox Doc Engine **fabrique
ses propres visuels** : il écrit un script documentaire en français, le découpe en plans, puis
génère une image de collage papier par plan et l'anime en clip de 10 secondes.

Le moteur suit les 9 états du *Crime Documentary Paper Engine* (ADN d'écriture Fern, système visuel
de collage, lois de composition, motifs de chute, ADN des vignettes). Tout l'éditorial est en
**français** ; les prompts d'images et de vidéo sont en **anglais**, langue dans laquelle les
modèles de génération comprennent le vocabulaire du collage éditorial.

### Les 9 états

| État | Ce qu'il produit | Moteur |
|---|---|---|
| 1 | Choix de la niche | interface |
| 2 | 10 idées, titres de forme Fern, aucun doublon de sous-territoire | Claude ou Gemini |
| 3 | Choix de la durée (30 s à 5 min) | interface |
| 4 | Script de narration continue, à 5 % près de la cible de mots | Claude ou Gemini |
| 5 | Voix off en lots de 20 à 25 s, 2 à 5 prises par lot | **ElevenLabs** |
| 6 | Tableau de beats timecodés à 2,5 mots/seconde | calcul local |
| 7 | Un prompt d'image par beat + fichier `[sujet]-prompts.txt` | Claude ou Gemini, puis **Yapper** |
| 8 | Prompt vidéo universel appliqué à chaque image | **Yapper** (image vers vidéo) |
| 9 | 3 prompts de vignettes | Claude ou Gemini |
| 10 | Montage final en MP4 1920x1080 | **ffmpeg** |

### Points de conception

- **Le découpage en beats est calculé, pas généré.** Les règles (2 à 3 secondes par beat, 5 à 8 mots,
  timecodes cumulés à 2,5 mots/seconde) sont arithmétiques : `src/vox/beats.ts` les applique de façon
  déterministe, rejouable et sans consommer de jetons. Les coupures tombent sur les césures naturelles
  du français, virgules d'abord, connecteurs de proposition ensuite.
- **Le bloc de style et le closer sont concaténés par le code**, jamais rédigés par un modèle
  (`src/vox/promptBuilder.ts`). Un modèle qui recopie trente fois le même paragraphe de 90 mots finit
  toujours par en dériver, et la série d'images perd son unité visuelle.
- **La cible de mots du script est vérifiée côté serveur** et relancée une fois avec la correction
  exacte si l'écart dépasse 5 %.
- **Aucun tiret cadratin** n'échappe à la règle maison : elle est appliquée par le code sur chaque
  sortie textuelle (`src/vox/sanitize.ts`), pas seulement demandée au modèle.
- **Aucune dépense sans validation.** Tout lot d'images ou de clips est d'abord chiffré en `dryRun`
  (gratuit) chez Yapper, le coût exact et le solde restant sont affichés, et le bouton de lancement
  n'apparaît qu'ensuite. Chaque génération porte une clé d'idempotence stable par beat, pour qu'un
  renvoi après coupure réseau ne facture jamais deux fois la même image.

### Le montage final (état 10)

`voxRenderEngine.ts` assemble les plans et pose la narration par dessus. Il est séparé du moteur de
résumés de films, dont les contraintes sont inverses : celui-ci est bâti autour d'extraits sous
copyright (plafond de 7 secondes d'usage continu, effets anti-détection, mise en boucle), alors que
les visuels Vox sont générés par le studio et doivent tomber exactement sur leur ligne de narration.

- **La voix est l'horloge maîtresse.** La durée réelle de chaque lot de voix off est mesurée au
  `ffprobe`, puis répartie entre les beats de ce lot au prorata du nombre de mots. Se caler sur
  l'audio mesuré plutôt que sur l'estimation à 2,5 mots/seconde évite que l'image dérive de la voix
  au fil de la vidéo. Mesuré sur un montage de test : 0,02 seconde d'écart sur l'ensemble.
- **Ajustement des clips de 10 secondes**, au choix. Le prompt vidéo universel construit le collage
  de 0 à 7 secondes puis le fige, alors qu'un plan dure 2 à 3 secondes :
  - `composition` (défaut) : la fenêtre de 2,5 à 7 secondes, compressée sur la durée du plan
  - `assemblage` : toute la construction (0 à 7s) compressée
  - `affiche` : la fin du clip à vitesse réelle
  - `complet` : les 10 secondes compressées, temps de pose compris

  Les bornes du mode par défaut sont mesurées, pas choisies à l'estime. Sur les clips réellement
  produits, l'écart entre l'image courante et la composition finale s'effondre autour de 2,5 secondes
  (de 24 à 6 sur l'échelle de luminance) : avant ce point le cadre est une plaque de papier presque
  vide, et un montage qui l'inclut clignote de pages blanches. Après 7 secondes le prompt impose
  « everything holds position », et un montage qui s'y limite tombe à 94 pour cent d'images figées,
  c'est à dire un diaporama. La fenêtre intermédiaire garde 54 pour cent d'images identiques, ce qui
  correspond à la cadence stop-motion « 2-3 frame holds » que le prompt demande explicitement.

- **Lit sonore ASMR** réglable sous la narration (0,25 par défaut, 0 pour le couper). Quand la vidéo
  est accélérée, l'audio l'est aussi via une chaîne `atempo`.
- **Replis en cascade** : clip animé, puis image fixe si le clip manque (la caméra est verrouillée de
  toute façon), puis carton neutre. Un beat raté n'empêche jamais le montage d'aboutir.

Comme pour l'autre mode, `ffmpeg` et `ffprobe` doivent être installés sur le serveur, et le rendu
tourne en tâche de fond (`POST /api/vox/render/start` renvoie un `jobId`, puis le frontend interroge
`GET /api/vox/render/status/:jobId`).

### Configuration

Ajoutez `YAPPER_API_KEY` dans votre `.env` (voir `.env.example`). `ELEVENLABS_API_KEY` est déjà
utilisée par le studio et sert aussi à la voix off du moteur, avec les réglages du matériau source
(stabilité 55, similarité 80, style bas, speaker boost actif).

Sans clé Yapper, les états 1 à 7 et 9 restent pleinement utilisables : vous récupérez le fichier
`.txt` de prompts prêt pour une génération en masse ailleurs. Sans clé ElevenLabs, l'état 5 renvoie
chaque lot en texte prêt à coller dans l'interface ElevenLabs, accompagné de ses réglages.

## Rendu vidéo réel (ffmpeg)

L'export final de la vidéo (bouton "Compiler la Vidéo Summary") effectue un **vrai rendu côté serveur** via `ffmpeg` :
- Téléchargement des extraits Clip.Cafe assignés (ou de l'image de référence en mode Ken Burns si activée)
- Découpage de chaque extrait à un maximum de 7 secondes continues (anti-Content ID), avec possibilité d'assigner plusieurs extraits courts par segment ("beats")
- Effets visuels anti-détection optionnels (miroir, léger zoom, filtre couleur) — activés par défaut
- Narration TTS comme seule piste audio (l'audio original des extraits est retiré)
- Incrustation optionnelle des sous-titres jaunes style cinéma
- Concatenation finale en MP4 (H.264 / AAC, 1920x1080)

**Important :** votre serveur de déploiement doit avoir `ffmpeg` et `ffprobe` installés (`apt install ffmpeg` sur Ubuntu/Debian, ou l'équivalent sur votre hébergeur). Sans ça, le rendu échouera avec un message d'erreur explicite.

## Extraction de bande-annonce officielle (yt-dlp)

La fonctionnalité "Bande-annonce officielle" dans la recherche d'extraits permet de coller un lien YouTube
et d'en extraire soi-même un passage (max 20s) à associer à un beat. Cette fonctionnalité nécessite **yt-dlp**
installé sur le serveur et accessible dans le PATH :

```bash
pip install yt-dlp --break-system-packages
# Vérifier l'installation :
yt-dlp --version
```

Sans `yt-dlp` installé, cette fonctionnalité spécifique échouera avec un message d'erreur explicite — le reste
de l'application (génération de script, recherche Clip.Cafe, export ffmpeg) continue de fonctionner normalement.

Si votre reverse proxy (Nginx, Hostinger, etc.) a un timeout HTTP court, ce n'est pas un problème : le rendu se fait en tâche de fond (`POST /api/render/start` retourne immédiatement un `jobId`, puis le frontend interroge `GET /api/render/status/:jobId` toutes les 1.5s jusqu'à la fin).

Les fichiers rendus sont stockés dans `render-output/` (exclu de git) et nettoyés automatiquement après 24h.


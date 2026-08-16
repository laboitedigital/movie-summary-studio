# MR TierMaker

Chaîne YouTube de tier lists de films et séries. Français québécois, format
faceless, un classement S→F par épisode.

**Ce fichier est chargé automatiquement à chaque session.** Il contient ce
qu'une session neuve doit savoir avant de toucher à quoi que ce soit. La
procédure complète est dans `mr-tier-maker/PIPELINE.md`.

## Architecture

| Outil | Fait quoi | Ne fait jamais |
|---|---|---|
| **Remotion** (`mr-tier-maker/kit-v2/`) | tout le graphique : cartes, jauges, tableau, wipe, carton verdict | **aucune vidéo** — le rendu tourne dans Chromium, qui ne décode pas le ProRes |
| **ffmpeg** | extraits, détourage de la mascotte, assemblage, encodage | le graphique — il n'a ni springs ni mise en page |
| **Yapper** | voix off, mascotte animée, images génériques | — |
| **Clip.cafe** | extraits de films | — |

Les overlays Remotion sortent en **ProRes 4444** (alpha réel, lu sans perte par
ffmpeg). Les éléments opaques sortent en H.264.

## Contraintes qui ne changent jamais

**Yapper : 3 générations en parallèle maximum.** Lancer par lots de 3 et
attendre la fin d'un lot avant le suivant.

**Yapper coûte de l'argent réel.** Toujours `dryRun: true` d'abord, et un
`idempotencyKey` stable sur le vrai run.

**Clip.cafe et les dépôts d'images sont bloqués depuis la session** (403 sur le
CONNECT : `clip.cafe`, `commons.wikimedia.org`, `api.openverse.org`,
`www.loc.gov`). **Ne pas contourner.** Ils passent par les jobs GitHub
`.github/workflows/clipcafe.yml` et `archives.yml`.

**Un job GitHub n'apparaît dans l'onglet Actions que depuis la branche par
défaut.** Tout nouveau workflow doit être mergé avant d'être lançable.

**Remotion ne peut pas télécharger son navigateur** (`remotion.media` hors
allowlist). `remotion.config.ts` pointe sur le Chromium déjà installé.

## Identité visuelle

Palette échantillonnée sur le logo, jamais relevée à l'œil —
`mr-tier-maker/tableau/palette.md` fait foi.

```
S #E6354F   A #F47025   B #F7B632   C #72AB54   D #3A5DAD   F #7242AA
fond #071027    plaque mascotte #050E21–#071023
```

Six rangées **S A B C D F**, pas de E. Lettres **blanches, contour noir 4 px**,
sur les six couleurs. Coins arrondis, contour noir épais, ombre dure, aplats —
le vocabulaire de l'avatar. Typo **Fredoka**, servie depuis `public/fonts/`.

**Les bandes arc-en-ciel appartiennent au logo, pas aux plans de l'avatar.** Le
détourage de la mascotte est un `colorkey=0x050D23:0.030:0.012` : il ne marche
que sur un fond uni. Toute génération de mascotte doit garder ce fond plat.

## Pièges déjà payés — ne pas les repayer

**`shortest=1` sur un overlay tronque la base.** Un bandeau de 300 frames posé
sur un plan de 429 coupait l'extrait à la durée du bandeau.

**Les extraits sont en 24/25 fps, le montage en 60.** Les conformer (`fps=60`)
*avant* tout compositing, sinon l'overlay hérite de la base de temps du premier
flux et perd la moitié de sa durée.

**Mesurer le texte, ne pas l'estimer.** Une largeur estimée au nombre de
caractères se trompe de 12 % sur un titre en capitales. Remotion :
`@remotion/layout-utils`. ffmpeg : rendre puis relever l'encre.

**`drawtext` en ffmpeg casse** sur l'apostrophe et les deux-points même entre
quotes, et un `%` sort une image vide. Passer par `textfile=` +
`expansion=none`.

**`hexc('071027')` avec `lstrip('0x')`** mange le zéro de tête et renvoie un
rouge. Retirer le préfixe explicitement.

**`zoompan` tronque x et y à l'entier**, ce qui fait vibrer l'image. Sur-
échantillonner l'entrée ×4 avant le zoom.

**Valider le YAML des workflows avant de pousser** (`yaml.safe_load`). Une
continuation de ligne shell qui retombe en colonne 1 ferme le bloc `run: |` et
rend le fichier illisible par GitHub — le job échoue alors sur chaque `push`
en affichant son chemin au lieu de son nom.

## Découpage et calage

Un plan par phrase du SRT. Les bornes viennent du **SRT mot à mot**, jamais
d'une durée estimée : un plan tient jusqu'au début du suivant, et la coupe est
faite **à la frame**. C'est ce qui empêche une vidéo de 15 minutes de dériver.

Extraits Clip.cafe : **7 secondes maximum**. Requêtes de recherche **en
anglais**.

**La recherche sémantique de Clip.cafe converge.** Sur un catalogue étroit,
elle renvoie les mêmes 4-5 extraits quelle que soit la requête : trois plans
différents reçoivent le même clip. Toute récupération en lot doit tenir la
liste des slugs déjà pris et descendre dans les résultats jusqu'à un slug neuf,
puis vérifier le nombre d'extraits **distincts** — pas le nombre de
téléchargements.

## Ce qui est acquis et ne se refait jamais

Plaque de la mascotte, 6 cartons de tier, 6 réactions animées, kit motion à
12 compositions, palette. Un nouvel épisode ne repaie que la voix off, les
extraits, et son cold open.

## Git

Développer sur la branche demandée, jamais sur `main` directement. Ne jamais
committer la clé API Clip.cafe — elle vit dans le secret GitHub
`CLIP_CAFE_API_KEY`.

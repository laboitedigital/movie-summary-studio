# Kit motion design v2 — Remotion

Remplace le kit ffmpeg (`../kit/`). Même identité graphique, mais des animations
que ffmpeg ne savait pas faire : springs, easings réels, mise en page auto,
mesure de texte, et surtout **un canal alpha**.

## Pourquoi changer d'outil

Le kit v1 cuisait chaque élément sur un fond navy opaque. Conséquence : le
bandeau, le wipe et le placement d'affiche **ne pouvaient pas être posés
par-dessus un extrait de film**. C'était un plafond d'architecture, pas un
détail de finition.

Le reste de l'argument est du temps perdu à contourner ffmpeg : PNG écrits
octet par octet en Python faute de PIL, `scale` piloté par fichier `sendcmd`
faute d'animation temporelle, sur-échantillonnage ×4 pour compenser la
troncature entière de `zoompan`, et trois pièges d'échappement de `drawtext`.
Tout cela est natif ici.

## La règle qui gouverne l'architecture

**Remotion ne touche à aucune vidéo.** Le rendu tourne dans Chromium, qui ne
décode pas le ProRes. Les extraits de films et la mascotte restent du côté
ffmpeg. Le partage est net :

| | fait quoi |
|---|---|
| **Remotion** | tout le graphique : cartes, jauges, tableau, wipe, placement |
| **ffmpeg** | tout ce qui est vidéo : extraits, détourage de la mascotte, assemblage final |

C'est pour ça que `VerdictCard` sort en **transparent** : le montage empile
`fond de chaîne → VerdictCard → mascotte détourée`.

## Compositions

| id | durée | fond | sortie |
|---|---|---|---|
| `TitleCard` | 3,5 s | opaque | H.264 |
| `RainbowWipe` | 0,7 s | **alpha** | ProRes 4444 |
| `LowerThird` | 5 s | **alpha** | ProRes 4444 |
| `ProsCons` | 4 s | opaque | H.264 |
| `ScoreDials` | 4 s | opaque | H.264 |
| `TierBoard` | 5 s | opaque | H.264 |
| `PosterPlacement` | 2,5 s | **alpha** | ProRes 4444 |
| `VerdictCard` | 6,7 s | **alpha** | ProRes 4444 |

`VerdictCard` ne figurait pas dans le brief : c'est pourtant l'élément
signature de la chaîne, le seul qui rend une vidéo reconnaissable en deux
secondes.

## Deux points non évidents

**Les couleurs.** Elles sont échantillonnées sur le logo, pas relevées à l'œil.
Le fond est `#071027` — c'est la couleur exacte derrière la mascotte, et tout
raccord non détouré en dépend.

**L'origine du zoom de `VerdictCard`.** Deux contraintes simultanées : à pleine
échelle le bord du tableau doit tomber à x=880 (la mascotte occupe tout ce qui
est à gauche) et la rangée visée doit être centrée. « Centrer sur la rangée »
ne suffit pas — la pastille du tier finit derrière la mascotte et on ne sait
plus de quelle rangée il s'agit. Le point fixe est donc résolu analytiquement.

## Cadence

**60 fps**, y compris le montage final. Les extraits sources sont en 24 ou
25 fps : ils sont conformés avec `fps=60` (duplication de trames, aucune perte).
Sans ça, un overlay 60 fps posé sur un extrait 25 fps est tronqué à 42 % de sa
durée — l'overlay hérite de la base de temps du premier flux.

## Rendu

```bash
npm install
./render.sh                 # les 8 compositions dans out/
npx remotion studio         # aperçu interactif
```

Le téléchargement du Chrome Headless Shell de Remotion est bloqué par la
politique de sortie réseau ; `remotion.config.ts` pointe donc sur le Chromium
déjà installé sur la machine.

## Son

Aucun audio n'est embarqué. `src/markers.ts` déclare les repères d'événements
(pop, whoosh, thud, tick) que le montage ffmpeg utilisera pour poser les
bruitages.

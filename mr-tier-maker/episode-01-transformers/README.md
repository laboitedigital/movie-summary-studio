# MR Tier Maker — Épisode 01 : Transformers

Package de montage du segment **The Transformers: The Movie (1986)**, tier B, plans 9 à 29.

## Contenu

| Fichier | Quoi |
|---|---|
| `plan/plan-de-montage.html` | Le découpage complet des 156 plans de l'épisode. À ouvrir dans un navigateur. |
| `animatic-film1.mp4` | Prévisualisation du segment 1986 (1:57) : la vraie voix off sur les cartons de chaque plan. Aucun extrait, c'est le squelette du montage. |
| `images/` | Les 3 images fixes du segment, générées dans Yapper en 2K 16:9. |
| `scripts/clipcafe-film1.mjs` | Récupère les 14 extraits Clip.cafe du segment. À lancer sur ta machine. |

## Récupérer les extraits vidéo

Les extraits ne sont pas dans ce dépôt : le domaine `clip.cafe` est bloqué par la
politique réseau de la session Claude, donc le téléchargement se fait chez toi.

Prérequis : Node 18+ et `ffmpeg` dans le PATH.

```bash
cd scripts
export CLIP_CAFE_API_KEY="ta_cle"

node clipcafe-film1.mjs search   # cherche, écrit choices.json et picks.json
node clipcafe-film1.mjs fetch    # télécharge et coupe à la bonne durée
```

Entre les deux, ouvre `choices.json` et vérifie la colonne `movie` de chaque plan :
une requête peut ramener un extrait venu d'un autre film. Pour changer un choix,
mets l'index voulu dans `picks.json` (0 = premier résultat) puis relance `fetch`.

Les extraits arrivent dans `scripts/clips-film1/`, déjà coupés, avec un
`manifest-film1.json` qui relie chaque fichier à son numéro de plan.

## Règles de montage du segment

- Aucun extrait ne dépasse **7 secondes** continues.
- Le plan 022 tient 8,2 s à l'écran : il est découpé en `022a` et `022b`, deux extraits d'environ 4,1 s.
- Les durées du plan de montage sont du **temps à l'écran** : un plan tient jusqu'au début du suivant, silences compris.
- Pour les plans entre 7,0 et 7,5 s, le plafond de 7 s laisse un trou de quelques dixièmes : fais démarrer le plan suivant un peu plus tôt.

## À corriger dans la voix off

Deux jointures de chunks ont perdu de la narration au montage, hors de ce segment
mais dans le même épisode. Détail complet dans le plan de montage.

- **4:04** — le verdict A de Transformers 2007 n'est jamais prononcé, et Revenge of the Fallen n'est jamais nommé.
- **7:19** — le verdict A de Dark of the Moon saute, et Age of Extinction n'est jamais introduit.
- **8:11** — la phrase « Rien de ce qui a été construit avant lui. » a perdu son début.

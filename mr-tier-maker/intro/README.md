# Cold open — épisode 01 (Transformers)

21,12 s, calé à la frame sur les quatre premières phrases de la voix off.
La cinquième phrase bascule sur l'avertissement : c'est là que le cold open
s'arrête.

| Plan | Frames | Temps | Fabrication |
|---|---|---|---|
| 1 — neuf barres | 101 | 0 → 4,04 | ffmpeg |
| 2 — silhouette blockbuster | 103 | 4,04 → 8,16 | Seedance 2.5 |
| 3 — mécha cel-anime 1986 | 119 | 8,16 → 12,92 | Seedance 2.5 |
| 4 — avatar devant le tableau | 103 | 12,92 → 17,04 | Seedance 2.5 + tableau composité |
| 5 — affiches puis tableau | 102 | 17,04 → 21,12 | ffmpeg |

## Pourquoi deux plans ne sont pas en IA

**Le plan 1 doit montrer exactement neuf barres** — la phrase dit « neuf
films ». Un modèle en dessine sept ou onze.

**Le plan 5 doit montrer les vraies affiches et des lettres lisibles.** Un
modèle génère de fausses affiches et du texte illisible.

Dans les deux cas ffmpeg est à la fois plus juste et gratuit.

## Aucun personnage sous copyright

Les plans 2 et 3 sont des silhouettes de mécha d'un design original. Les
prompts interdisent explicitement tout logo, tout visage reconnaissable et
tout texte. Citer un extrait de film pour le commenter se défend ; recréer
un personnage sous licence, non.

## Ce qui manque

- **La voix off de l'intro.** Le montage est muet : seul le segment 1986
  (116 s) est disponible ici, pas les 21 premières secondes de l'épisode.
- **Une affiche sur neuf.** *Rise of the Beasts* renvoyait un 404 chez
  Clip.cafe. Le plan 5 en défile huit.

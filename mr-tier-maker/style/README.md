# Style motion — aligné sur le logo cartoon

Tout le motion design reprend le vocabulaire graphique de l'avatar : **coins
arrondis, gros contour noir, aplats de couleur, ombre portée dure** (pas de
flou). Fini les traits fins et le monospace.

| Élément | Avant | Maintenant |
|---|---|---|
| Pastilles de tier | rectangles nets, sans contour | arrondi 20 px, contour noir 7 px, ombre dure 8 px |
| Rangées | rectangle translucide | plaque arrondie `#16233F`, contour noir 6 px |
| Lettres | DejaVu Sans **Mono** | DejaVu Sans **Bold**, contour noir 5 px |
| Surbrillance du verdict | rectangle à angles droits | anneau arrondi à la couleur du tier |

## Fichiers

- `cartoon.py` — écriture de PNG et rectangles arrondis. Pas de PIL ni
  d'ImageMagick sur la machine, donc les PNG sont écrits à la main ; le lissage
  n'est calculé que dans les coins, ce qui rend le rendu instantané.
- `tableau.py` — le tableau S→F et l'anneau de surbrillance
- `verdict.py` — le carton verdict complet

## Les extraits restent en plein écran

Un cadre à 90 % avait été essayé pour limiter les réclamations YouTube, puis
retiré : il ne protège de rien. L'empreinte Content ID résiste au
redimensionnement et au recadrage, et la piste audio suffit seule à déclencher
une correspondance. Ce qui protège réellement, c'est le caractère transformatif
— commentaire, critique, classement — plus des extraits courts (moins de 7 s)
et jamais d'audio original laissé seul.

## Piège corrigé

`hexc()` n'utilise **pas** `lstrip('0x')` : sur `'071027'`, `lstrip` mange le
zéro de tête et renvoyait un rouge sombre au lieu du bleu nuit.

## Poussée de caméra sur la rangée du verdict

Après la surbrillance, la caméra pousse dans la rangée classée (zoom 2,2 ×),
tient 1,5 s, puis ressort.

**Le zoom ne porte que sur le plateau, pas sur l'avatar.** Zoomer l'image
entière l'agrandirait et le sortirait du cadre : on ne verrait plus qu'un bout
de son épaule. Ici le tableau grandit derrière lui pendant qu'il reste posé à
l'échelle 1. Le centre du zoom est calé pour que la pastille du tier reste à
droite de lui — sans elle, on ne saurait plus de quelle rangée il s'agit.

## Contour des lettres

Les lettres foncées (A, B, C) avaient un contour **noir** de 5 px. Sur une
lettre déjà noire, ça faisait une bouillie : le A et le B n'étaient plus
lisibles.

Règle appliquée, dans `tableau.lettre()` :

- lettre claire (S, D, F) → contour **noir**
- lettre foncée (A, B, C) → contour **blanc**

Le contour détache la lettre du fond coloré au lieu de l'épaissir.

## Grain

Un bruit temporel très léger (`noise=alls=5`) est ajouté en fin de chaîne. La
raison est technique, pas décorative : sur un aplat bleu nuit, H.264 fait
apparaître des cercles concentriques (banding). Le grain les dissout.

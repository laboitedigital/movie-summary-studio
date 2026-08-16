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
| Extraits Clip.cafe | plein écran | cadre à 90 %, coins arrondis, contour noir |

## Fichiers

- `cartoon.py` — écriture de PNG et rectangles arrondis. Pas de PIL ni
  d'ImageMagick sur la machine, donc les PNG sont écrits à la main ; le lissage
  n'est calculé que dans les coins, ce qui rend le rendu instantané.
- `tableau.py` — le tableau S→F et l'anneau de surbrillance
- `cadre.py` — encadre un extrait à 90 %
- `verdict.py` — le carton verdict complet

## Le cadre à 90 %

`cadre.py` place l'extrait dans une ouverture de 1728×972 centrée, sur le fond
de la chaîne, avec un contour noir arrondi. L'extrait est recadré (`crop`) et
jamais déformé.

**À savoir, sur la protection contre les réclamations.** Réduire l'image à
90 % ne trompe pas Content ID : l'empreinte résiste au redimensionnement et au
recadrage, et l'audio suffit à elle seule à déclencher une correspondance. Ce
qui protège réellement, c'est le caractère transformatif — commentaire,
critique, classement — et c'est déjà ce que fait la chaîne. Le cadre est donc
à considérer comme un choix graphique, pas comme un bouclier juridique.

## Piège corrigé

`hexc()` n'utilise **pas** `lstrip('0x')` : sur `'071027'`, `lstrip` mange le
zéro de tête et renvoyait un rouge sombre au lieu du bleu nuit.

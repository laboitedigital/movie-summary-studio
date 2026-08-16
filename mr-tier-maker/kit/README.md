# Kit de motion design

Six éléments récurrents d'un épisode, tous dans le vocabulaire de l'avatar :
coins arrondis, contour noir épais, aplats, ombre portée dure, arrivée sèche
avec un léger dépassement puis calage.

| # | Élément | Durée | À quoi ça sert |
|---|---------|-------|----------------|
| 1 | Carton titre | 3,4 s | Ouvre chaque film : titre + année |
| 2 | Étiquette | 4,0 s | Rappelle en bas de l'écran quel film est à l'image, par-dessus l'extrait |
| 3 | Pour / contre | 4,2 s | Les deux arguments, en vert et en rouge |
| 4 | Chiffre clé | 3,6 s | Un score ou un box-office qui monte en compteur |
| 5 | Transition | 1,2 s | Les six couleurs du logo balaient l'écran entre deux films |
| 6 | Rappel du tableau | 4,6 s | Les affiches déjà classées tombent dans leurs rangées |
| 7 | Zoom sur une rangée | 5,2 s | La caméra pousse dans la rangée dont on parle, tient, ressort |

`demo-kit.mp4` enchaîne les six, séparés par la transition.

## Utilisation

```python
import kit
kit.carton_titre("BUMBLEBEE", "2018", "sortie.mp4")
kit.chiffre(91, "Score critiques", "sortie.mp4", suffixe=" %")
kit.rappel({0: ["posters/1986....jpg"], 2: [...]}, "sortie.mp4")
```

Les pastilles s'adaptent au texte : la largeur réelle est mesurée, pas estimée.

## Deux pièges de drawtext, corrigés

**Tout le texte passe par `textfile=` + `expansion=none`.** En `text='...'`,
drawtext casse sur l'apostrophe et sur les deux-points même entre quotes, et
un simple `%` sort une **image entièrement vide** sur ce build. C'est ce qui
faisait disparaître le compteur du chiffre clé.

**La largeur du texte est mesurée, pas estimée.** Le texte est rendu une fois
sur un canevas large et on relève l'extension de l'encre. Une estimation au
nombre de caractères se trompait de 12 % sur un titre en capitales, et le
texte débordait de sa pastille.

## Révision « polish » (retour extérieur)

Quatre points d'une critique reçue étaient justes et sont appliqués :

- **Vraies courbes d'accélération.** `ease()` était deux segments droits avec un
  dépassement — mécanique. C'est maintenant un *easeOutBack* cubique : démarrage
  rapide, dépassement, retour amorti.
- **Rebond d'échelle à l'apparition** (0 → 105 % → 100 %). ffmpeg ne sait pas
  animer `scale` avec le temps ; `zoompan` ne descend pas sous z=1. La solution
  est un fichier `sendcmd` qui pilote `scale` image par image — c'est ce que
  fait `pop()`.
- **Relief sur les pastilles.** Liseré clair dégradé sur les 42 % du haut,
  16 % d'opacité. Assez pour donner du volume, pas assez pour casser l'aplat.
- **Vignettage** sur les fonds unis (`vignette=a=PI/4.2`).
- **Centrage vertical réel** via `text_h` plutôt qu'une constante.

Trois autres points de cette critique décrivaient des choses **déjà présentes**
— elles avaient été jugées sur des images fixes :

- Le décalage temporel existe déjà (pour/contre 0,7 s, affiches 0,16 s, bandes
  de transition 0,05 s).
- Le compteur décélère déjà (`(i/N)**0.75` sur 22 paliers).
- La transition arc-en-ciel est déjà un balayage en cascade, pas une image fixe.

Deux points ont été écartés :

- **Particules / grille animée en fond** : ça contredit le style du logo, qui
  est en aplats francs. Le vignettage suffit à habiter le fond.
- **Logo Rotten Tomatoes ou Metacritic** : marques déposées. Une jauge
  circulaire dit la même chose sans le risque, et c'est ce qui a été fait.

**La taille des affiches sur téléphone** est réglée par l'élément 7,
`zoom_rangee()`. Les affiches font 63 px de large dans le tableau : illisibles
sur un petit écran. Agrandir les rangées ferait perdre la vue d'ensemble, donc
la caméra pousse dans la rangée dont on parle au moment où on en parle, tient
2,2 s, puis ressort.

```python
kit.zoom_rangee("rappel.mp4", row=2, out="zoom-B.mp4")   # 0 = S … 5 = F
```

Deux détails qui comptent :

- **Le cadrage horizontal garde la pastille du tier dans le champ.** Zoomé sur
  les seules affiches, on ne sait plus de quelle rangée il s'agit.
- **`zoompan` tronque `x` et `y` à l'entier**, ce qui fait vibrer l'image
  pendant le mouvement. L'entrée est donc sur-échantillonnée ×4 avant le zoom,
  pour que la troncature devienne sous-pixellique.

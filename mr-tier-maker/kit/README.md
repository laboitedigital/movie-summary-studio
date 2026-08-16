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

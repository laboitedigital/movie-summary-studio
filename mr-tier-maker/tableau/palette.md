# Palette MR TierMaker — tirée du logo

Couleurs échantillonnées directement sur les bandes de `smug-s-tile.jpg`
(colonne x=2030, l'image d'origine fait 2048x2048).

| Tier | Hex       | Texte du label |
|------|-----------|----------------|
| S    | `#E6354F` | blanc          |
| A    | `#F47025` | noir           |
| B    | `#F7B632` | noir           |
| C    | `#72AB54` | noir           |
| D    | `#3A5DAD` | blanc          |
| F    | `#7242AA` | blanc          |

Fond du carton verdict : `#071027` (le bleu nuit exact derrière la mascotte,
pour qu'il n'y ait aucune coupure entre elle et le tableau).

Lignes vides du tableau : `#101A2E` à 82 % d'opacité.

Mise en page (1920x1080) : label 104 px, ligne 760 px, hauteur 112 px,
gap 9 px, tableau ancré à x=860.

Ordre des calques : fond uni → tableau → affiche qui glisse → surbrillance de
la rangée → **avatar détouré par-dessus, à 100 % d'opacité**. Aucun fondu.

Le détourage est un simple `colorkey=0x050D23:0.030:0.012` : il ne marche que
parce que la plaque de la mascotte a un fond bleu nuit parfaitement uni et
**plus aucune bande de couleur**. C'est la raison d'être de
`mascotte/plaque-fond-uni-1920x1080.jpg` — les bandes du logo sont réservées
au logo, elles ne doivent plus apparaître dans les plans de l'avatar.

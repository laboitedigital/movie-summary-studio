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

Ordre des calques : fond → tableau → affiche qui glisse → surbrillance de la
rangée → **mascotte par-dessus**. La mascotte est donc au premier plan : ses
cheveux et son épaule passent devant les pastilles S et F. Son bord droit
s'efface en dégradé sur 220 px et elle est recadrée à 900 px de large pour
couper avant les bandes du logo (sinon elles apparaissaient en fantôme
par-dessus le tableau).

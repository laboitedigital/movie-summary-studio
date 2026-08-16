# Cartons de tier — MR TierMaker

Six images 1920×1080, une par tier. Toutes dérivées de la même plaque maîtresse
(`../plaque-fond-uni-1920x1080.jpg`, asset Yapper `b0e8f0ee-…`), donc le
personnage, la pose et le cadrage sont identiques d'une carte à l'autre.

| Carte | Couleur du carton | Rangée du tableau |
|-------|-------------------|-------------------|
| S | `#E6354F` | `#E6354F` |
| A | `#F47025` | `#F47025` |
| B | `#F7B632` | `#F7B632` |
| C | `#72AB54` | `#72AB54` |
| D | `#3A5DAD` | `#3A5DAD` |
| F | `#7242AA` | `#7242AA` |

Le carton que tient l'avatar et la rangée qui s'allume dans le tableau ont donc
exactement la même valeur.

## Deux règles à ne pas casser

**Pas de bandes de couleur.** Les bandes arc-en-ciel appartiennent au logo, pas
aux plans de l'avatar. Le détourage du carton verdict est un simple
`colorkey` sur le fond uni : si des bandes réapparaissent, elles ressortent en
bloc opaque par-dessus le tableau.

**Fond parfaitement uni.** Mesuré entre `#050E21` et `#071023` sur les six
cartes, ce qui tient largement dans `colorkey=0x050D23:0.030:0.012`. Le sweat
noir se situe à une distance de 0,047 de la clé — la marge est réelle mais
pas énorme, donc toute nouvelle génération doit garder ce fond plat, sans
dégradé ni vignettage.

Ce sont aussi les images de départ des réactions animées : une réaction par
tier part de son propre carton.

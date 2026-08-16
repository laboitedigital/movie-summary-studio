# Voix off — les 24,5 s retrouvées

## Ce qui s'était passé

Le montage assemblé (`935,33 s`) tronquait la **fin** de trois des quatre
parties générées. Pas une seconde de silence dans le fichier : les raccords
étaient nets, et c'est bien pour ça que ça ne se voyait pas. Ce qui manquait,
c'était du **texte**.

Et il tombait exactement aux mauvais endroits : les verdicts A de
*Transformers 2007* et de *Dark of the Moon*.

## Comment on l'a établi

Sans transcription — impossible ici. On a comparé les **enveloppes d'énergie**
par corrélation croisée : deux enregistrements du même texte ont la même
respiration.

1. Chaque partie a été située dans le master. Les quatre se suivent dans
   l'ordre `a1 → a2 → ae → a4` et ne se répètent pas (corrélation de 0,2-0,3
   entre la fin de l'une et le début de la suivante — ce ne sont pas les mêmes
   phrases).
2. Les 14 dernières secondes de chaque partie ont été cherchées dans le
   master : celles de `a1` (r = 0,50) et de `a2` (r = 0,56) **n'y sont pas**,
   celles de `ae` et `a4` y sont (r = 0,89 et 0,99).
3. L'écart entre la position réelle de chaque partie dans le master et une
   concaténation simple donne le compte : 14,19 + 9,59 + 0,70 = **24,47 s**.

## Ce qui a été reconstruit

`voix-complete.mp3` — **959,80 s** (contre 935,33 s).

Les quatre parties bout à bout, plus la conclusion de 42,7 s qui n'existait
que dans le master. Les quatre jonctions tombent sur des fins de phrase
(niveau mesuré à −29 dB et moins), aucune coupure en milieu de mot.

| Partie | Dans le master | Nouveau | Récupéré |
|---|---|---|---|
| a1 | 0,0 – 240,4 | 0,0 – 254,6 | **+14,19 s** |
| a2 | 240,4 – 435,4 | 254,6 – 459,2 | **+9,59 s** |
| ae | 435,4 – 695,3 | 459,2 – 719,8 | +0,70 s |
| a4 | 695,3 – 892,6 | 719,8 – 917,1 | — |
| conclusion | 892,6 – 935,3 | 917,1 – 959,8 | — |

## Les 156 plans sont déjà reportés

`plans-remappes.json`. La correspondance est linéaire par morceau : dans chaque
partie le décalage est constant, donc **aucun plan n'a eu besoin d'être
re-découpé** — seules ses bornes glissent.

Les trois fenêtres retrouvées s'insèrent entre les plans existants :

| Fenêtre | Durée | Position |
|---|---|---|
| 240,40 → 254,59 | 14,19 s | juste avant le plan 043 |
| 449,59 → 459,18 | 9,59 s | juste avant le plan 077 |
| 719,08 → 719,77 | 0,70 s | juste avant le plan 120 |

## Ce qu'il reste à faire

**Le texte de ces trois fenêtres n'est pas transcrit.** Il n'y a pas de
reconnaissance vocale disponible ici. Deux façons de finir :

- refaire passer `voix-complete.mp3` dans l'outil qui a produit le premier SRT,
  ce qui redonne un sous-titrage complet et juste ;
- ou écouter les trois fenêtres et me dicter le texte — 24 secondes en tout.

Tant que ce n'est pas fait, les plans 043 et 077 portent le verdict sans que
le plan de montage sache quoi afficher dessus.

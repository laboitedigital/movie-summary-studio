# Voix off — la référence, c'est `sources/`

## Ce qui fait foi

`voix/sources/` — les **quatre fichiers générés**, dans l'ordre. Rien d'autre.

| Fichier | Durée |
|---|---|
| `01-a1.mp3` | 254,589 s |
| `02-a2.mp3` | 204,591 s |
| `03-ae.mp3` | 260,598 s |
| `04-a4.mp3` | 197,329 s |
| **`voix-complete.mp3`** (bout à bout) | **917,11 s** |

`scripts/rebuild.py` reconstruit `voix-complete.mp3` depuis `sources/`. Il ne
dépend de rien d'autre : le fichier peut être supprimé et refait à l'identique.

## Le master FlexClip a été jeté

Il ne sert plus à rien et il était faux sur deux points.

**Il tronquait la fin de trois parties sur quatre** — 24,47 s de narration, sans
une seconde de silence dans le fichier : les raccords étaient nets, c'est pour
ça que ça ne se voyait pas. Ce qui manquait, c'était du **texte**, et il tombait
exactement aux mauvais endroits : les verdicts A de *Transformers 2007* et de
*Dark of the Moon*.

**Il finissait sur 42,7 s de silence numérique** (−91 dB du début à la fin du
segment). Ce n'était pas une conclusion : la dernière phrase parlée — « Merci
d'avoir regardé et on se revoit dans la prochaine tier list » — est déjà à la
fin de `04-a4.mp3`, et la voix complète s'arrête 0,19 s après elle.

## Comment la troncature a été établie

Sans transcription — impossible ici. On a comparé les **enveloppes d'énergie**
par corrélation croisée : deux enregistrements du même texte ont la même
respiration. (`scripts/align.py`, `scripts/manque.py` — gardés pour la méthode,
ils ne tournent plus, le master n'existe plus.)

1. Chaque partie a été située dans le master. Les quatre se suivent dans
   l'ordre `a1 → a2 → ae → a4` et ne se répètent pas (corrélation de 0,2-0,3
   entre la fin de l'une et le début de la suivante — ce ne sont pas les mêmes
   phrases).
2. Les 14 dernières secondes de chaque partie ont été cherchées dans le
   master : celles de `a1` (r = 0,50) et de `a2` (r = 0,56) **n'y sont pas**,
   celles de `ae` et `a4` y sont (r = 0,89 et 0,99).
3. L'écart entre la position réelle de chaque partie dans le master et une
   concaténation simple donne le compte : 14,19 + 9,59 + 0,70 = **24,47 s**.

| Partie | Dans le master | Sur la référence | Récupéré |
|---|---|---|---|
| a1 | 0,0 – 240,4 | 0,0 – 254,6 | **+14,19 s** |
| a2 | 240,4 – 435,4 | 254,6 – 459,2 | **+9,59 s** |
| ae | 435,4 – 695,3 | 459,2 – 719,8 | +0,70 s |
| a4 | 695,3 – 892,6 | 719,8 – 917,1 | — |

## Le SRT et les 156 plans

`voix-master.srt` porte le **texte**, mais ses timecodes sont ceux du master :
ils ne valent plus. `scripts/remap.py` les reporte sur la référence et écrit
`plans-remappes.json` — c'est ce que `shots.load()` relit, et **la seule base de
temps du montage**. La correspondance est linéaire par morceau : dans chaque
partie le décalage est constant, donc aucun plan n'a eu besoin d'être
re-découpé — seules ses bornes glissent.

Le dernier plan (156) finit à 916,81 s.

## Ce qu'il reste à faire

**Le texte des trois fenêtres récupérées n'est pas transcrit.** Pas de
reconnaissance vocale disponible ici.

| Fenêtre | Durée | Position |
|---|---|---|
| 240,40 → 254,59 | 14,19 s | juste avant le plan 043 |
| 449,59 → 459,18 | 9,59 s | juste avant le plan 077 |
| 719,08 → 719,78 | 0,70 s | juste avant le plan 120 |

Deux façons de finir :

- refaire passer `voix-complete.mp3` dans l'outil qui a produit le premier SRT,
  ce qui redonne un sous-titrage complet et juste — puis relancer `remap.py` ;
- ou écouter les trois fenêtres et me dicter le texte — 24 secondes en tout.

Tant que ce n'est pas fait, les plans 043 et 077 portent le verdict sans que le
plan de montage sache quoi afficher dessus.

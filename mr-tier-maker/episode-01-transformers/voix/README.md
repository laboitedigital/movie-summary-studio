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

## Le sous-titrage a été refait

`voix.srt` est calé sur `voix-complete.mp3` : timecodes et audio sont enfin sur
la même base, il n'y a plus rien à remapper. C'est ce que `shots.load()` lit.

Il contient les 24,47 s que l'ancien n'avait pas, et le texte confirme mot pour
mot ce que la corrélation avait annoncé — c'étaient bien les deux verdicts :

| Fenêtre | Ce que le master avait mangé |
|---|---|
| 240,4 → 254,6 | « …et c'est pour ça que ça marche. Le film n'essaie jamais d'être plus gros que cette idée-là. **Verdict, il va en A.** Deux ans plus tard, tout part en fumée. » |
| 449,6 → 459,2 | « …pas le temps de **la digérer**. Mais dans l'ensemble, c'est un très bon film d'action. **Verdict ? Il va en A.** Et ensuite, le vide. » |

L'ancien SRT enchaînait « pas le temps de l'exagérer » sur « Mais dans
l'ensemble, c'est plus long que… » — une phrase qui ne voulait rien dire.
Il corrige aussi « tiers list » → « tier list », « un tiers du milieu » → « un
tir du milieu », et « trilogie B. 3. » qui était un artefact.

`voix-master.srt` est l'ancien, gardé pour une seule raison : retrouver la
numérotation d'avant.

## La renumérotation

Le découpage passe de **156 à 159 plans** — les deux verdicts retrouvés et
leurs deux transitions de segment font trois plans de plus. Tout ce qui suit le
plan 043 glisse de 1 à 3 rangs.

`scripts/renumerote.py` reporte les 156 annotations sur la nouvelle
numérotation. Il apparie chaque nouveau plan à l'ancien dont le texte s'y
retrouve, et **quand deux plans fusionnent il garde celui qui ouvre le plan** —
c'est son image qui est à l'écran au moment de la coupe. Huit plans qu'aucun
appariement ne pouvait trancher sont annotés à la main dans le script.

Deux segments n'avaient pas de carton titre — *Revenge of the Fallen* et *Age
of Extinction* — parce que le master avait mangé précisément leurs phrases de
transition. Ils en ont un maintenant.

L'ordre à respecter :

```
scripts/rebuild.py               # sources/ -> voix-complete.mp3
scripts/remap.py                 # ancien SRT -> plans-remappes.json (le pont)
scripts/renumerote.py            # -> annot.py renumeroté, ancien-vers-nouveau.json
scripts/plan.py                  # -> plan-episode-01.json, plan-montage.md
scripts/extraits-renumerotes.py  # -> renommer-extraits.sh
```

Les archives `voix/plan-ancien-156.json` et `voix/annot-ancien-156.py` sont les
versions d'avant : les scripts repartent toujours de là, jamais du fichier
qu'ils viennent de réécrire. Relancer la chaîne deux fois donne le même
résultat.

## Les extraits déjà téléchargés

**94 des 96 sont réutilisables**, il suffit de les renommer :
`scripts/renommer-extraits.sh` (61 `mv`, en ordre descendant pour ne jamais
écraser un fichier pas encore déplacé).

| | |
|---|---|
| à retélécharger | `085` *Lockdown bounty hunter*, `111` *Optimus Prime Cybertron battle* — leur plan est né d'une scission |
| abandonnés | `055`, `069` — leur plan a fusionné avec le voisin |

Et un troisième, qui n'a rien à voir avec la renumérotation : **`034`** était un
404 dans le grand run et n'a jamais été relancé. Les runs de rattrapage ne
couvraient que les segments 5 et 6, personne n'a vérifié le segment 1. On était
donc à 93 extraits sur 96, pas 95.

`voix/slugs-extraits.json` recense maintenant quel clip se trouve derrière
chaque plan. Sans cette table, un rattrapage partiel ne sait pas ce qui est déjà
pris et rechoisit le clip du plan voisin — la recherche sémantique de Clip.cafe
converge, c'est le piège connu du projet. `scripts/slugs-extraits.py` la
reconstruit et liste les plans encore vides.

## Ce qu'il reste à faire

Plus rien sur la voix off. Le texte des fenêtres retrouvées est transcrit, les
plans sont renumérotés, le plan de montage est régénéré.

Côté matière : les deux extraits ci-dessus, et les images d'archives qui
manquaient déjà.

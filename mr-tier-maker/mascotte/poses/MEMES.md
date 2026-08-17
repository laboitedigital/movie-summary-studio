# Les memes de l episode

Une reaction de la mascotte posee **par-dessus** le plan qui joue. Elle ne
remplace aucun plan : elle entre par le bord droit, tient 2,5 s, ressort par ou
elle est venue.

| plan | pose | ce que dit la voix a ce moment-la |
|---|---|---|
| 056 | `cache-yeux` | « des blagues qui n auraient **jamais** du sortir d une salle de scenarisation » |
| 077 | `blase` | « Le film dure **2h35** et on le sent. » |
| 087 | `facepalm` | « ce qui me derange le plus, c est la mort de **Ratchet** » |
| 099 | `hallucine` | « la famille de Sam etait une lignee **magique** » |
| 148 | `satisfait` | « c est le **meilleur** film de la franchise apres Bumblebee » |

Un par segment, repartis sur l episode. Deux reactions de suite se
neutraliseraient : c est une ponctuation, pas un procede.

## Comment c est cale

**Sur le mot qui pique, pas sur le debut du plan.** La frame vient du SRT — cue
qui porte le mot, plus sa position dans le texte de la cue au prorata de la
duree.

**Et la reaction doit tenir entiere avant la coupe.** Si le mot tombe a moins de
150 frames de la fin, on recule l entree (`min(mot, nfr - 150)`) : une mascotte
qui disparait en meme temps que l image change ressemble a un bug, pas a une
intention. Les plans 077 et 087 sont dans ce cas.

## Comment c est fabrique

Les JPG de `poses/` sont detoures **une fois**, en amont, vers
`kit-v2/public/poses/*.png` :

    ffmpeg -i pose.jpg -vf "format=rgba,colorkey=0x050D23:0.030:0.012" pose.png

puis recadres sur leur boite alpha — sans ca la pose arrive avec 30 % de vide
autour et la placer dans un coin devient un calcul a l aveugle.

**Remotion ne sait pas incruster une couleur.** Le detourage ne peut donc pas se
faire dans la composition : c est pour ca qu il est fait en amont, et pas a
chaque rendu.

La composition `Meme` anime ensuite le PNG (ressort a l entree, respiration,
sortie par le bord) et sort en ProRes 4444. ffmpeg la pose sur le plan monte,
**en dernier** — au-dessus du cadre, du bandeau et du wipe.

## Pas de texte, sauf s il ajoute quelque chose

Le champ `texte` existe et affiche une plaque coloree au-dessus de la pose. Il
reste vide sur les cinq : la voix dit deja la phrase, et l ecrire une seconde
fois encombre l image sans rien apprendre — meme raisonnement que pour les
fleches. Il sert quand un mot AJOUTE quelque chose que la narration ne prononce
pas : un chiffre, une date, un nom.

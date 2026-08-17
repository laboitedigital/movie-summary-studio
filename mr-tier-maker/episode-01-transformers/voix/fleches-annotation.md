# Les fleches : ce que la passe d annotation a trouve

Passe faite sur le montage du run **31979526236** (copie 720p `apercu/`), en
relevant les frames au moment ou chaque nom est **prononce**, puis deux frames
supplementaires a 30 % et 70 % de chaque plan suspect.

## Le resultat, sans arrondir

**38 mentions de personnage dans des plans-extrait. Une seule fleche posable.**

Ce n est pas un probleme d outil : `pose_fleche()` marche, le rendu Remotion
marche, les coordonnees relatives marchent. C est un probleme de **matiere**.

Trois causes, dans cet ordre d importance :

1. **Clip.cafe est indexe sur les dialogues, donc il rend le plan de CELUI QUI
   PARLE.** Quand la narration dit « Blackout attaque la base », la recherche
   trouve une replique ou le mot apparait — et le plan montre le militaire qui
   la prononce, pas Blackout. 12 plans sur 31 sont dans ce cas.

2. **Les personnages muets sont introuvables par construction.** Bumblebee ne
   parle pas dans son propre film. Blackout, Scourge, Devastator non plus. Un
   catalogue indexe sur la parole ne peut pas livrer leur plan. Il faut soit
   viser une replique dite PAR quelqu un d autre DANS le meme plan, soit faire
   le plan en motion.

3. **Une fleche sur un sujet qui remplit l ecran ne sert a rien.** Plan 052 :
   Bumblebee est bien la, mais sa tete occupe 60 % du cadre. Pointer un sujet
   deja evident encombre l image. Ecarte pour cette raison : 052, 097, 058.

## Ecartees aussi

- **3 mentions tombaient a moins d une seconde de la coupe** (087 Ratchet,
  110 Optimus, 132 Bumblebee) : la fleche n aurait pas eu le temps d exister.
- **Plusieurs plans contiennent une coupe interne** (052 coupe a +45 frames sur
  un autre plan) : une fleche de 150 frames survit au raccord et se retrouve
  posee sur une image qui n a plus rien a voir. A verifier plan par plan avant
  de poser.

## La seule retenue

Plan **133**, Bumblebee de profil a gauche face au Terrorcon, oeil bleu en
(0.235, 0.40), fleche venant du haut, declenchee a la frame 13.

## Les 12 extraits hors-sujet, a reprendre en un seul lot

L ordre compte : ils partagent la liste d exclusion, sinon la recherche
semantique redonne le meme extrait a deux plans voisins.

| plan | ce que dit la narration | ce qu on voit | slug actuel |
|---|---|---|---|
| 037 | Blackout attaque la base | un militaire de dos, dans le noir | `oh-my-god-s6` |
| 039 | Optimus Prime arrive et se presente | un soldat au telephone, puis un homme en costume | `i-aint-never-seen-in-life` |
| 074 | l opposition Optimus / Sentinel, la bataille de Chicago | Sam en entrevue d embauche | `so-humans-are-working-the-decepticons` |
| 078 | la mort d Ironhide | un militaire dans une carcasse | `this-gun-my-perfect-invention-ironhide` |
| 091 | Optimus a un arc reel | Lockdown | `and-later-truck-comes-haul-off` |
| 101 | Quintessa, le mechant le plus oubliable | des debris dans un orage | `quintessa-get-off-our-planet` |
| 111 | Optimus Prime au sommet de sa forme | deux ados devant un pick-up | `lets-do-this-s17` |
| 114 | Charlie, meilleur personnage humain | un entrepot sombre, puis Bumblebee | `leave-alone-you-dont-understand` |
| 121 | Bumblebee oblige d etre plus intelligent | John Cena qui parle dans un bureau | `they-literally-call-themselves-decepticons-s1` |
| 125 | Maximals, cle Transwarp, Unicron, Scourge | une Porsche dans un stationnement | `i-alright-now-just-like-brother-rick-showed-you-i` |
| 131 | Elena explique des artefacts | la jungle, Airazor, une chute dans le sable | `airazor-screeches-s1` |
| 017 | Optimus Prime meurt | des debris illisibles (deja connu) | — |

**Corollaire sur la redaction des requetes.** Une requete doit etre une
**replique dite dans le plan voulu**, pas une description du plan. Pour obtenir
un plan DE Optimus, il faut chercher ce qu Optimus DIT. Pour un personnage
muet, chercher ce qu on lui dit.

## Ce qui va bien, et qu on ne touche pas

017, 026, 049, 071, 077, 099, 126, 148 : pas litteraux, mais l image tient le
propos. 026 montre meme Unicron en forme de planete a 30 % du plan — la
mention tombe juste trop tot pour qu une fleche s y pose.

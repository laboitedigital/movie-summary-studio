# Les trois images d'archive manquantes

## Je ne peux pas les télécharger d'ici

La politique de sortie réseau de cette session refuse **tous** les dépôts
d'images : `commons.wikimedia.org`, `upload.wikimedia.org`, `api.openverse.org`,
`www.loc.gov` — 403 sur le CONNECT, comme `clip.cafe`. Je ne contourne pas.

## Solution : le job GitHub

`.github/workflows/archives.yml` fait le travail depuis l'infrastructure
GitHub, qui n'a pas cette restriction. Il interroge l'API de Wikimedia Commons
et **ne garde que les fichiers dont la licence est explicitement réutilisable**
(domaine public, CC0, CC BY). Il écrit un `LICENCES.md` avec, pour chaque
image, sa licence, son auteur et l'URL de la page source — l'attribution que
CC BY exige.

```
Actions → « Images d'archive (Wikimedia Commons) » → Run workflow
   requête : Orson Welles 1985
   requête : children watching television 1980s
   requête : Transformers toy 1984
```

## Trois fonds, une planche contact

Le job interroge maintenant **trois fonds** et ne garde que les licences
réutilisables :

| Fonds | Ce qu'on y trouve | Licences |
|---|---|---|
| **Wikimedia Commons** | large, très varié, métadonnées de licence fiables | PD, CC0, CC BY |
| **Library of Congress** | photographie documentaire américaine, souvent 1930–1990 | domaine public pour l'essentiel |
| **Openverse** | agrège Flickr, musées, banques sous CC | CC commercial + modification |

Il sort une **planche contact numérotée** (`planche.jpg`) : tu regardes, tu me
donnes les numéros, je les intègre au montage. `LICENCES.md` donne pour chaque
image sa licence, son auteur et l'URL source.

```
Actions → « Images d'archive » → Run workflow
requêtes : Orson Welles ; children watching television 1980s ; vintage robot toy 1980s
```

**Écris les requêtes en anglais.** Les métadonnées de ces trois fonds le sont
presque toutes ; « enfants devant la télévision » ne renverra rien, *children
watching television* renverra des dizaines de résultats.

**Je n'ai pas pu tester ce job d'ici** — les trois hôtes sont bloqués par la
politique réseau de la session. Il est écrit défensivement (chaque source
échoue indépendamment sans tuer le run), mais la première exécution demandera
peut-être un ajustement. Envoie-moi le log si ça sort vide.

## Sur « recréer une photo quasi identique »

Ça ne règle pas le problème que ça cherche à régler : une recréation fidèle
d'une photographie protégée reste une œuvre dérivée de cette photographie. Et
en pratique je ne peux pas la regarder pour la copier, puisque je n'ai accès à
aucun dépôt d'images.

La version qui marche, c'est de recréer **la situation**, pas la photo : des
enfants génériques devant une télé cathodique, un jouet-robot 80s en blister
sans logo. Aucune source à copier, aucune licence à tracer.

## Reste que pour deux des trois

, l'archive n'est pas la meilleure option

| Plan | Ce que dit la voix off | Recommandation |
|---|---|---|
| **019** | « Pour des enfants de huit ans à l'époque, c'était un traumatisme collectif » | **Générer.** Enfants génériques devant une télé cathodique, aucune personne réelle, aucune marque. Zéro question de licence, et l'image peut être stylisée aux couleurs de la chaîne. 10 crédits. |
| **021** | « Un film pour vendre des jouets » | **Archive ou générique sans marque.** Une photo de jouets G1 en boîte montre un emballage sous marque déposée Hasbro. Une image générée de robot-jouet des années 80 en blister, sans logo, dit la même chose sans le risque. |
| **027** | « doublé par Orson Welles dans son dernier rôle » | **Carton typographique, pas de portrait.** Voir ci-dessous. |

## Pourquoi le plan 027 est meilleur sans photo

Le propos de la phrase n'est pas le visage d'Orson Welles : c'est le **fait**,
absurde et vrai, qu'il a fini sa carrière en doublant une planète qui mange des
planètes. Un carton typographique laisse le fait occuper tout l'écran. Un
portrait d'archive, lui, oblige le spectateur à reconnaître un visage — et
ajoute une question de droit à l'image d'une personne réelle pour un gain
narratif nul.

`apercus/plan-027-typo.jpg` montre le rendu.

## Ce qu'il reste à fournir (à jour)

| Plan | Image | État |
|---|---|---|
| `019` | Enfants devant une télé des années 80 | ✅ dans `images/` |
| `021` | Jouets Transformers G1 en boîte | ✅ dans `images/` |
| `027` | Portrait d'Orson Welles | ✅ dans `images/` |
| `006` `007` | Deux affiches floutées | à fabriquer — je floute deux affiches déjà là |
| `066` | Apollo 11 / NASA | ✅ **illustration assumée**, générée dans Yapper — voir plus bas |
| `137` | Commentaires YouTube négatifs | ✅ passé en motion — composition `Commentaires`, sans pseudos |

### Deux plans sont passés en motion plutôt qu'en photo

**`031` — Michael Bay.** La seule photo libre de lui est en CC BY-SA 3.0, ce qui
obligerait à créditer l'auteur dans la description de chaque vidéo. Le plan tient
maintenant **l'affiche 2007** — qu'on a déjà — en Ken Burns lent, avec un bandeau
`MICHAEL BAY / RÉALISATEUR`. Rien à fournir.

**`136` — la bande-annonce et ses dislikes.** YouTube ne montre plus le nombre de
dislikes depuis 2021 : la capture demandée était impossible sans extension, et un
nombre inventé n'est pas une source. Le plan devient la **colonne des reproches**,
une ligne par grief au rythme de la phrase — `TON TROP ENFANTIN`,
`ANIMATION ÉTRANGE`, `CONCEPT CONDAMNÉ D'AVANCE`. La colonne « pour » reste vide
jusqu'au plan `138`, qui la renverse.

Ça fait passer les images à fournir de 6 à 2.


## Deux plans qui ne prennent pas de document

**`066` — la mission Apollo.** Le plan illustre un élément de l'intrigue de
*Dark of the Moon*, pas un fait historique à établir. On a donc fait une
**illustration assumée** plutôt qu'une fausse archive : aplats, contours noirs
épais, fond `#071027`, flamme ambre — le vocabulaire de l'avatar. L'astronaute
porte une visière dorée entièrement réfléchissante : **aucun visage**, parce que
les astronautes d'Apollo 11 sont des personnes réelles et qu'on ne leur invente
pas de traits. Généré dans Yapper, `gpt-image-2`, 10 crédits.

Les vraies photos NASA restent en domaine public si tu changes d'avis :
[galerie Apollo 11](https://www.nasa.gov/apollo11-gallery).

**`137` — les commentaires YouTube.** Une capture inventée aurait donné de faux
commentaires attribués à de vraies personnes, sur un plan qui sert à établir un
fait. Le plan passe en motion : des bulles aux couleurs de la chaîne, sans
pseudo et sans imiter l'interface de YouTube, qui remettent à l'écran les
reproches que la narration énonce déjà.

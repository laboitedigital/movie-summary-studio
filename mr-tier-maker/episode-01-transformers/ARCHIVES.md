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

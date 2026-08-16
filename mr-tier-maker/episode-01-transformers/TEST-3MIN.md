# Vidéo test — les 3 premières minutes

`scripts/build3.py` monte de **00:00 à 02:38.98** : cold open, amorce, et le
segment 1986 complet jusqu'au verdict B. 9 535 frames à 60 fps, voix off calée.

## Comment c'est monté

Chaque plan est coupé **à la frame** sur les bornes du SRT : `frames(n)` prend
le début du plan suivant, jamais une durée estimée. La vidéo ne peut donc pas
dériver par rapport à la narration, même après 156 plans.

Le partage Remotion / ffmpeg est visible ici :

- Remotion rend le graphique (tableau, chiffres, citation, pour/contre, carton
  verdict) — dont les overlays à canal alpha.
- ffmpeg fait tout ce qui touche à la vidéo : extraits, détourage de la
  mascotte, assemblage.

Le plan 009 le montre bien : extrait plein écran + **bandeau alpha posé
par-dessus**. C'est exactement ce que le kit v1 ne savait pas faire.

## Trois pièges rencontrés

**`shortest=1` sur un overlay tronque la base.** Le bandeau fait 300 frames, le
plan 429 : l'extrait était coupé à la durée du bandeau. Sans `shortest`, la
dernière image du bandeau (transparente, il sort du cadre) est figée, ce qui est
invisible.

**Les extraits sont en 24/25 fps.** Ils sont conformés en 60 fps avant tout
compositing, sinon un overlay 60 fps posé dessus hérite de la base de temps du
premier flux et perd 58 % de sa durée.

**Les sources plus courtes que leur plan sont gelées** sur leur dernière image
(`tpad=stop_mode=clone`) plutôt que de laisser un trou noir.

## Ce qui est marqué « à fournir »

Trois plans affichent un carton d'attente au lieu d'un média :

| Plan | À 1:38, 1:46, 2:23 | Ce qu'il faut |
|---|---|---|
| 019 | 01:38 | Photo d'archive : enfants devant une télé des années 80 |
| 021 | 01:46 | Photos de jouets Transformers G1 en boîte |
| 027 | 02:23 | Portrait d'Orson Welles — 1985, dernier rôle |

Ces cartons sont volontairement visibles : dans une vidéo de test, un trou
signalé est plus utile qu'un trou masqué. Je ne génère pas ces images — ce sont
des personnes et des objets réels.

Deux plans utilisent une substitution assumée, faute d'élément dédié :
le plan 013 (trombinoscope) devient un `BigStat` « 100 épisodes », et le plan
008 (« ON COMMENCE ») une `Citation`.

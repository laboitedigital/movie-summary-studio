# Ranking — un videoclip par entrée du classement

Format court, vertical, prêt à empiler dans VSUB. Un sujet donne **cinq mp4** :
extrait Clip.cafe du film, recadré en 9:16, avec la voix off par-dessus et le son
d'origine baissé sous la narration.

Ça n'a rien à voir avec le pipeline `mr-tier-maker/` : pas de Remotion, pas de
tableau, pas de SRT. Cinq clips indépendants, le montage se fait dans VSUB.

## Ce qui vit où

```
ranking/
  scripts/ranking.mjs          le script Clip.cafe + montage (les deux phases)
  <projet>/
    sujet.json                 le classement : films, années, textes de voix off
    voix/<tag>.mp3             la voix off générée, une par entrée
    choix.json                 optionnel — force un slug par entrée
    catalogue.json             sortie de la phase catalogue
    sortie/*.mp4               les videoclips finis
    manifeste.json             ce qui est sorti, avec durées et slugs
```

Le `tag` est la clé qui relie tout : `01` à `05`, et **`01` est le premier du
classement**, pas le premier à l'écran. Le montage descend `05 → 01`.

## La marche à suivre

**1. Le sujet.** `sujet.json` porte les cinq films, leur année, et le texte de
narration de chacun. La recherche Clip.cafe se fait sur `movie_title` +
`movie_year`, pas sur le texte.

**2. La voix off.** Générée dans Yapper, une piste par entrée, déposée dans
`voix/<tag>.mp3`. **Chaque piste tient entre 5 et 8 secondes**, ce qui se joue au
nombre de mots, pas au débit du modèle : 24 mots sortent à 8,3-10,1 s, 17 mots
sortent à 6,6-7,9 s. Écrire en enchaîné — des virgules plutôt que des points —
enlève les silences entre les propositions et fait gagner deux secondes à contenu
égal. Les générations audio ne coûtent rien en crédits, mais la règle
du dépôt tient : `dryRun: true` d'abord, `idempotencyKey` stable sur le vrai run,
et **trois générations en parallèle maximum**.

**3. Les extraits et le montage.** Onglet **Actions** → **Ranking - videoclips**.
Deux phases :

| Phase | Ce qu'elle fait |
|---|---|
| `catalogue` | liste les extraits de **7 à 10 s** de chaque film, sans rien télécharger |
| `montage` | télécharge l'extrait choisi, recadre en 9:16, muxe la voix, sort les mp4 |

Tu télécharges l'artefact `ranking-videoclips`, tu déposes les cinq mp4 dans VSUB.

**Le job ne s'exécute que depuis la branche par défaut.** Un workflow n'apparaît
dans l'onglet Actions qu'une fois mergé — c'est pour ça que la PR passe avant.

## Choisir les extraits plutôt que les subir

La phase `catalogue` **liste** le film au lieu de chercher par mot-clé. C'est
délibéré : sur un catalogue étroit, la recherche sémantique de Clip.cafe converge
et renvoie les mêmes quatre ou cinq extraits quelle que soit la requête. Lister
puis choisir est la seule façon d'avoir cinq extraits réellement différents.

Sans `choix.json`, le montage prend le premier slug encore libre. Pour imposer le
tien, lis `catalogue.json` et écris :

```json
{ "05": "slug-du-clip", "04": "...", "03": "...", "02": "...", "01": "..." }
```

Les slugs déjà pris sont tenus dans une liste pendant le run : deux entrées ne
peuvent pas retomber sur le même extrait.

## Ce que le montage garantit

**La durée finale colle à la voix.** `avance + voix + queue`, et l'extrait est
coupé à cette longueur. La narration n'est jamais tronquée — c'est le plancher —
mais rien ne traîne après elle. Un extrait de 10 s posé sur une voix de 5,4 s
sort à 6,06 s.

Quand l'extrait est plus court que la voix, il est prolongé sur sa dernière image
plutôt que la couper.

**Le 9:16 est plein cadre par défaut.** L'image remplit les 1080×1920 : un 16:9 y
perd ses côtés, c'est le prix d'un vrai cadrage vertical et c'est ce que le format
court attend. `format.cadrage: "flou"` rebascule sur l'ancien rendu — l'image
entière dans une bande centrée, sur fond flou plein cadre — quand perdre les côtés
coûte trop cher sur un plan large.

**Le son d'origine reste sous la voix** (12 %), il ne disparaît pas. `amix` est en
`normalize=0` — sans ça, il divise chaque entrée par leur nombre et tout le mixage
tombe de moitié.

Deux pièges du dépôt sont déjà désamorcés dans le script, ne les réintroduis pas :
`fps` est conformé **avant** le compositing (les extraits sont en 24/25 fps, la
sortie en 30), et la durée est fixée par `-t`, **jamais** par `shortest=1` — qui
tronquerait la base sur la piste la plus courte.

## En local

Impossible : `clip.cafe` répond 403 sur le CONNECT depuis la session, et ffmpeg
n'est pas installé. Les deux phases tournent dans le job GitHub, qui a le secret
`CLIP_CAFE_API_KEY` et installe ffmpeg. Ne pas contourner.

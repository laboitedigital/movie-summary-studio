# Comment faire un épisode, de zéro

Pas de skills : tout se fait en parlant à Claude Code dans ce dépôt. Le
`CLAUDE.md` à la racine est chargé automatiquement à chaque session — les
conventions, les contraintes et les pièges sont donc déjà connus, y compris
dans une session neuve qui ne sait rien de l'épisode précédent.

Cinq étapes. À chaque fois : ce que **tu** fais, ce que **je** fais, ce qui
sort.

---

## 1. Le script

**Tu** ouvres une session dans ce dépôt et tu dis, en substance :

> Nouvel épisode : tier list de la franchise **X**. Voici 2-3 scripts de
> référence. Écris-moi le script dans mon style.

En joignant les scripts de référence (PDF ou texte).

**Je** lis les références, j'en extrais la charte réelle plutôt que de la
supposer, je pose le classement, puis j'écris. Structure attendue :

- **Hook** (~20 s) — le compte, l'écart, la promesse, puis l'annonce de **deux
  surprises** : un film détesté qui monte, un film défendu qui tombe. C'est ce
  qui tient le spectateur.
- **Un segment par œuvre**, chronologique : contexte → ce qui marche → ce qui
  ne marche pas → verdict.
- **Récap final** — le tableau se relit rangée par rangée, la boucle se ferme
  sur le chiffre du hook.

Ton : québécois parlé, jamais du français neutre. Chaque film a droit à sa
défense **et** à son procès. Un avis tranché — un C partout ne fait pas une
tier list.

**Sort :** `mr-tier-maker/episode-XX-<sujet>/script.md`, en un bloc, sans
didascalies. C'est ce texte exact qui part en synthèse vocale.

**Tu approuves avant l'étape 2.** Régénérer 15 minutes d'audio coûte cher.

---

## 2. La voix off et le SRT

> Le script est bon, fais la voix off.

**Je** produis l'audio dans Yapper avec la voix de **Paul**, par lots de 3 en
attendant entre chaque, puis j'en tire un SRT **mot à mot**.

Deux règles de sous-titrage qui ont déjà coûté une reprise : découper sur des
frontières de mots (jamais « c'est une décision d » / « 'écriture »), et garder
l'espace insécable avant `; : ! ?`.

**Ce qui fait foi, ce sont les fichiers générés, jamais un export
assemblé.** Sur l'épisode 01, le master sorti de FlexClip avait mangé la fin de
trois parties sur quatre — 24,47 s de narration, précisément les verdicts — et
ajouté 42,7 s de silence à la fin. Les raccords étaient nets : rien ne se
voyait, ni ne s'entendait. Les parties vont dans `voix/sources/`, numérotées
dans l'ordre, et `scripts/rebuild.py` les met bout à bout.

**Sort :** `voix/sources/*.mp3`, `voix/voix-complete.mp3` et `episode.srt`.

Si tu produis la voix toi-même, dépose les parties dans `voix/sources/` et le
SRT dans le dossier de l'épisode, puis passe à l'étape 3.

---

## 3. Le découpage

> Fais le découpage et le plan de montage.

**Je** découpe un plan par phrase du SRT, j'annote chacun en `CLIP`, `MOTION`
ou `PHOTO` avec son intention, et je produis le plan timecodé : pour chaque
plan, ses bornes réelles, sa durée d'écran, la famille du kit et **l'appel
exact** à passer.

Le SRT doit être calé sur la voix off de référence — celle de `voix/sources/`
mise bout à bout, pas sur un export. Si le sous-titrage change après coup, tout
ce qui est indexé par numéro de plan glisse : les extraits Clip.cafe, les
images, les annotations. `scripts/renumerote.py` fait le report, et
`scripts/renommer-extraits.sh` renomme ce qui est déjà téléchargé.

Les 12 compositions du kit couvrent tout : `TitleCard`, `LowerThird`,
`RainbowWipe`, `ProsCons`, `ScoreDials`, `BigStat`, `Citation`, `Versus`,
`TierBoard`, `BoardRecap`, `PosterPlacement`, `VerdictCard`.

**Sort :** `plan-montage.md` (lisible) et `plan-episode-XX.json` (machine),
qui contient aussi les **requêtes de recherche Clip.cafe, en anglais**.

---

## 4. La matière

C'est la seule étape que tu dois lancer toi-même, parce que les sources sont
bloquées depuis ma session.

**Je te donne le lien du merge à chaque épisode, sans que tu aies à le
demander.** Un job GitHub n'apparaît dans l'onglet Actions que depuis la
branche par défaut : tant que le travail de l'épisode est sur une branche, les
jobs ne sont pas lançables. J'ouvre donc la pull request et je te donne le lien
dès que le plan de montage est prêt — c'est le moment exact où tu en as besoin.

Attention à l'ordre : si je pousse encore des fichiers **après** ton merge, ils
ne sont pas sur `main`. Dans ce cas je rouvre une PR et je te redonne le lien.

Puis dans **Actions** :

| Job | Ce qu'il ramène |
|---|---|
| **Clip.cafe** — mode `catalogue` | la liste des extraits disponibles pour un film |
| **Clip.cafe** — mode `posters` | les affiches |
| **Clip.cafe** — mode `complet` | les extraits (7 s max), d'après les requêtes du plan |
| **Images d'archive** | Commons + Library of Congress + Openverse, licences réutilisables, planche contact numérotée |

Tu télécharges les artefacts, tu me donnes les numéros des archives qui te
plaisent, tu déposes le reste dans le dossier de l'épisode.

---

## 5. Le montage

> Monte l'épisode.

**Je** rends les éléments Remotion avec les vraies valeurs du plan, je conforme
tout en 1920×1080 à 60 fps, je coupe **à la frame** sur les bornes du SRT, et
j'assemble avec la voix off.

Le montage tourne dans le job **Montage complet de l'épisode**, pas ici : les
extraits vivent dans les artefacts Clip.cafe, et le stockage des artefacts est
hors de ma politique de sortie réseau. Un runner GitHub, lui, y accède. Tu ne
télécharges qu'un fichier à la fin.

`episode-01-transformers/scripts/build.py` déduit la recette du plan de
montage, famille par famille — extrait, verdict, carton titre, affiche, photo,
rappel tableau, citation, chiffre clé, pour/contre. `build3.py` reste comme
témoin : c'était la version écrite plan par plan, tenable jusqu'à 30 plans.

**Ce qui n'a pas de matière sort en carton de remplacement, visible**, avec le
numéro du plan et ce qui manque, et la liste part dans `manquants.json`. Un
montage complet dont on voit les trous vaut mieux qu'un montage court dont on
ne voit rien.

**Sort :** `episode-01.mp4`, 1920×1080, 60 fps, et `manquants.json`.

---

## Ce que coûte un épisode

| Poste | Épisode 01 | Épisodes suivants |
|---|---|---|
| Plaque mascotte, cartons, réactions, kit | 1 330 crédits | **0** |
| Voix off | selon la longueur | idem |
| Cold open animé | ~630 crédits | ~630 (ou 0 si réutilisé) |
| Extraits Clip.cafe | quota du plan PRO | idem |

Le gros du budget de l'épisode 01 servait à construire la chaîne. Ce qui reste
récurrent : la voix, les extraits, et le cold open s'il est animé.

---

## Si une session neuve reprend le projet

Elle lit `CLAUDE.md` automatiquement. Pour reprendre un épisode en cours, lui
donner le dossier : `mr-tier-maker/episode-XX-<sujet>/`. Le plan de montage
suffit à savoir où on en est — chaque plan y porte son état.

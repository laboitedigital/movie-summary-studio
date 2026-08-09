# Charte « Vox Short » — résumés de film 30–45 s

Statut : **proposition, non implémentée.** Ce document est la spécification de référence ;
la section « Delta d'implémentation » liste ce qu'il faut changer dans le code pour l'appliquer.

Objectif : produire des shorts de **30 à 45 secondes** montés avec **3 à 4 extraits vidéo
seulement**, dans le langage visuel éditorial de Vox (cartons typographiques, coupes franches,
accent jaune, narration au présent).

---

## 1. Format

**Défaut : vertical 1080 × 1920, 30 fps.** C'est le format des Shorts / Reels / TikTok, qui est
la destination naturelle d'un 30–45 s. La variante 16:9 est décrite en §9.

Les extraits de film sont du 16:9 (ou du 2.39). On ne les recadre **pas** en plein vertical —
ça décapite les plans cinéma. On les pose en **bande centrée sur un fond off-black**, ce qui est
à la fois fidèle au traitement éditorial Vox et non destructif :

```
y=0     ┌──────────────────────────┐  fond #0B0B0B
        │                          │
        │      ZONE KICKER         │  carton / titre de section
        │                          │
y=536   ├──────────────────────────┤
        │                          │
        │   BANDE VIDÉO 1080×608   │  extrait, 16:9, pleine largeur
        │                          │
y=1144  ├──────────────────────────┤
        │                          │
        │     ZONE SOUS-TITRE      │  captions burn-in
        │                          │
y=1620  ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤  ← rien en dessous (UI plateforme)
        │                          │
y=1920  └──────────────────────────┘
```

- Bande vidéo : `1080 × 608`, origine `y = 536`.
- Zone kicker : `y ∈ [200, 500]`.
- Zone sous-titre : `y ∈ [1220, 1560]`.
- **Zone morte** : `y > 1620` et `y < 180` — aucun élément lisible (barres d'UI natives).

---

## 2. Structure narrative

Une idée = un plan. Pas de sous-découpage en beats.

### Version 4 plans (38–45 s) — recommandée

| # | Rôle | Durée | Mots | Contenu |
|---|------|-------|------|---------|
| 1 | **HOOK** | 6 s | ~14 | Question ou affirmation choc. Le plan le plus fort du film. |
| 2 | **PRÉMISSE** | 11 s | ~26 | Qui, où, quoi. Le titre du film est prononcé ici au plus tard. |
| 3 | **ESCALADE** | 14 s | ~33 | Le nœud, ce qui dérape. Le cœur de la vidéo. |
| 4 | **CHUTE** | 11 s | ~26 | La question ouverte, pas la résolution. + carton de fin. |
|   | **Total** | **42 s** | **~99** | |

### Version 3 plans (30–34 s)

| # | Rôle | Durée | Mots |
|---|------|-------|------|
| 1 | **HOOK** | 6 s | ~14 |
| 2 | **PRÉMISSE + ESCALADE** | 13 s | ~30 |
| 3 | **CHUTE** | 12 s | ~28 |
|   | **Total** | **31 s** | **~72** |

**Débit de référence : 140 mots/minute ≈ 2,33 mots/seconde.** Budget global :

| Durée cible | Mots totaux | Plans |
|---|---|---|
| 30 s | 70 | 3 |
| 35 s | 82 | 3 |
| 40 s | 93 | 4 |
| 45 s | 105 | 4 |

**Un extrait Clip.Cafe par plan → 3 ou 4 téléchargements par vidéo.** C'est la contrainte
structurante : l'ancien moteur en réclamait un par beat de 7 s.

---

## 3. Règles d'écriture (la voix Vox)

**À faire**
- Présent de l'indicatif, systématiquement.
- Phrases courtes : **14 mots maximum**, une proposition principale.
- Le hook est une **question** ou un **fait contre-intuitif**. Il commence sur du concret.
- Un chiffre, une date ou un nom propre par plan quand c'est possible — ça ancre.
- Chaque plan porte **une seule idée**. Si on peut la couper en deux, c'est deux plans.
- Sur 30–45 s on vend la **prémisse**, pas le dénouement. La chute est une question ouverte.

**Interdits**
- « Aujourd'hui on résume… », « Bienvenue », « Dans cette vidéo », « Abonnez-vous » (en voix).
- Superlatifs creux : « incroyable », « fou », « le meilleur film de tous les temps ».
- Le vouvoiement d'adresse plus d'une fois sur la vidéo.
- Toute phrase qui décrit le montage (« on voit ici que… »).

**Exemple de hook conforme** — *Blade Runner 2049* :
> ✅ « Un policier découvre une tombe. Ce qu'il y a dedans ne devrait pas exister. »
> ❌ « Aujourd'hui on va parler de Blade Runner 2049, un chef-d'œuvre absolu. »

---

## 4. Typographie

**Police : Archivo Black** (OFL, libre) — l'équivalent libre le plus proche du Balto de Vox.
À vendorer dans `assets/fonts/Archivo-Black.ttf` : le serveur ne dispose aujourd'hui que de
DejaVu et Liberation, qui ne tiennent pas le style.
Repli acceptable si absente : `DejaVuSans-Bold.ttf`.

| Élément | Taille | Casse | Couleur | Position |
|---|---|---|---|---|
| Carton plein cadre | 88 px | MAJUSCULES | `#FFFFFF` sur `#0B0B0B` | centré, 2 lignes max |
| Kicker de section | 64 px | MAJUSCULES | `#FFFFFF` | zone kicker, centré |
| Sous-titre | 58 px | Phrase | `#FFFFFF` sur boîte `#0B0B0B` @ 75 % | zone sous-titre |
| Mot surligné | 58 px | Phrase | `#0B0B0B` sur boîte `#FFE01A` | inline dans le sous-titre |
| Carton de fin — titre | 76 px | MAJUSCULES | `#FFFFFF` | centré |
| Carton de fin — année | 44 px | — | `#A0A4AB` | sous le titre |

- Cartons et kickers : **5 mots maximum**.
- Sous-titres : **4 mots par ligne, 2 lignes maximum**, `boxborderw=18`.
- **Interlettrage resserré** sur les MAJUSCULES.
- **Un seul mot surligné par plan**, celui que la voix appuie.

### Palette

| Rôle | Hex |
|---|---|
| Accent (jaune Vox, approximation) | `#FFE01A` |
| Fond / boîtes | `#0B0B0B` |
| Texte principal | `#FFFFFF` |
| Texte secondaire | `#A0A4AB` |

Le jaune est l'**unique** accent. Il ne sert qu'à deux choses : surligner un mot, et le liseré
du carton de fin. Jamais en fond de plan entier.

> Note : `#FFE01A` est une approximation du jaune de marque Vox, pas la valeur officielle.
> À ajuster si vous voulez vous en éloigner davantage pour des raisons de marque.

**Ce qui disparaît** : les sous-titres jaunes 42 px style « cinéma » du moteur actuel
(`fontcolor=yellow:fontsize=42:borderw=3`). Ils sont l'exact opposé du registre Vox.

---

## 5. Montage et mouvement

- **Coupe franche uniquement. Zéro fondu, zéro crossfade, zéro transition animée.**
- **Punch-in** : le mouvement signature. Recadrage instantané `1.00 → 1.14` sur coupe,
  jamais animé. Il sert aussi de solution au cap Content ID (§7).
- **Push lent** optionnel : `zoompan` de `1.00` à `1.04` sur la durée du plan. Discret.
- **Cartons** : 1,0 à 1,4 s, apparition et disparition sèches. Aucun mouvement de texte —
  pas de slide, pas de fade, pas de typewriter.
- Cadence de coupe visible visée : **une coupe toutes les 4 à 6 s** (obtenue par les punch-in
  et les cartons, pas par plus d'extraits).

### Découpe d'un plan long

Un plan de 11 s dépasse le cap de continuité. On le scinde sans télécharger d'extrait
supplémentaire :

```
Plan 3 (14 s) sur un seul extrait :
  0,0 → 6,0 s   extrait, cadrage 1.00
  6,0 → 7,2 s   CARTON plein cadre (1,2 s)
  7,2 → 14,0 s  même extrait, cadrage 1.14   ← punch-in
```

Ou, sans carton :

```
Plan 2 (11 s) :
  0,0 → 6,0 s   cadrage 1.00
  6,0 → 11,0 s  cadrage 1.14
```

**Règle** : tout plan > 6,5 s est scindé en sous-plans de ≤ 6,5 s, en alternant les cadrages
`1.00 / 1.14 / 1.00`. Le nombre d'extraits téléchargés reste 3 ou 4.

---

## 6. Audio

- **Voix off seule** en piste principale. L'audio d'origine des extraits est supprimé
  (comportement déjà en place).
- Cible de niveau : **VO à −16 LUFS**, lit musical optionnel à **−26 LUFS** avec ducking.
- Coupes audio sèches, avec un fondu de **40 ms** uniquement pour éviter les clics.
- Accent sonore court (tick) sur les cartons : optionnel, −20 dB, désactivé par défaut.

---

## 7. Anti-Content-ID, révisé

Le style Vox change la donne sur deux points du moteur actuel :

| Réglage actuel | Décision | Raison |
|---|---|---|
| `hflip` (miroir) activé par défaut | **Désactivé par défaut** | Retourne tout texte présent dans le plan et inverse la lecture géographique. Incompatible avec un registre éditorial. |
| Zoom numérique ~6 % | **Conservé** | Invisible, efficace. |
| Léger décalage colorimétrique | **Conservé** | |
| `MAX_CONTINUOUS_CLIP_SECONDS = 7` | **Abaissé à 6,5 s** | Cohérent avec la règle de découpe §5. |
| — | **Ajout : recadrage en bande** | Le compositing 1080×1920 est déjà une transformation significative. |

Le punch-in de §5 fait double emploi : il sert le style **et** casse la continuité d'usage.

---

## 8. Schéma de script attendu de l'IA

```json
{
  "movieTitle": "Blade Runner 2049",
  "targetSeconds": 42,
  "segments": [
    {
      "role": "hook",
      "narration": "Un policier découvre une tombe. Ce qu'il y a dedans ne devrait pas exister.",
      "suggestedSearch": "K discovers buried box at protein farm",
      "kicker": "CE QUI NE DEVRAIT PAS EXISTER",
      "highlight": "ne devrait pas exister",
      "seconds": 6
    }
  ]
}
```

Champs par segment :

| Champ | Contrainte |
|---|---|
| `role` | `hook` \| `premise` \| `escalation` \| `payoff` |
| `narration` | Respecte le budget mots du rôle (§2). Phrases ≤ 14 mots. |
| `suggestedSearch` | En anglais, **précis** : une réplique, un lieu, une action identifiable. |
| `kicker` | ≤ 5 mots, MAJUSCULES. `null` si le plan n'en porte pas. |
| `highlight` | Un fragment **exactement présent** dans `narration`. Un seul par plan. |
| `seconds` | Durée cible du plan, dérivée du nombre de mots ÷ 2,33. |

Contraintes globales : `segments.length ∈ [3, 4]`, `Σ seconds ∈ [30, 45]`,
`Σ mots ≈ targetSeconds × 2,33` (±10 %).

---

## 9. Variante 16:9 (1920 × 1080)

Si la destination est le YouTube classique plutôt que les Shorts, tout §1–§8 tient, avec
ces différences :

- L'extrait remplit le cadre (`crop=1920:1080`), pas de bande.
- Kicker en **tiers inférieur gauche**, `x = 120`, `y = 820`, aligné à gauche, 56 px.
  Le centrage plein cadre est réservé aux cartons de transition.
- Sous-titres centrés à `y = h − 160`, 46 px.
- Cartons pleins cadre inchangés, 88 px centré.
- Zones mortes : marge de sécurité de 90 px sur tous les bords.

---

## 10. Delta d'implémentation

Ce qu'il faut toucher, par fichier. Rien de tout cela n'est fait à ce stade.

**`src/types.ts`**
- `ScriptSegment` : ajouter `role`, `kicker`, `highlight`, `seconds`.
- Neutraliser `beats[]` dans le mode Vox (un segment = un plan = un extrait).

**`server.ts`**
- Nouveau mode `voxShort` dans le générateur de script. Remplace intégralement le bloc
  « EXIGENCE DE LONGUEUR » et la règle de découpage en beats (`durée ÷ 7`), qui poussent
  aujourd'hui vers 10–20 min et des dizaines d'extraits.
- Bornes : `targetSeconds ∈ [30, 45]`, `segments ∈ [3, 4]`.
- Injecter les règles d'écriture §3 comme contraintes dures, avec la liste d'interdits.

**`renderEngine.ts`**
- Canevas `1080×1920` + compositing en bande (`pad` / `overlay` sur fond `#0B0B0B`).
- `buildClipVideoFilters()` : version bande, `hflip` désactivé par défaut.
- `MAX_CONTINUOUS_CLIP_SECONDS` : `7` → `6.5`.
- Logique de scission punch-in (§5) : découpe d'un plan long en sous-plans à cadrages alternés.
- Remplacer le `drawtext` jaune 42 px par : sous-titre blanc sur boîte + surlignage jaune du
  fragment `highlight`.
- Nouveaux rendus : carton plein cadre, carton de fin (titre + année).

**`assets/fonts/`**
- Vendorer `Archivo-Black.ttf` (OFL). Étendre `findFont()` pour le préférer.

**UI (`ScriptGenerator.tsx`, `VideoExporter.tsx`)**
- Sélecteur de durée : `30 / 35 / 40 / 45 s` à la place de `10–20 min`.
- Sélecteur de format : `9:16` (défaut) / `16:9`.
- Champs éditables `kicker` et `highlight` par plan.

---

## 11. Points ouverts

1. **Format** — la charte assume le 9:16. Si la destination est le YouTube 16:9 classique,
   basculer sur §9.
2. **Jaune de marque** — `#FFE01A` est une approximation. À arbitrer.
3. **Lit musical** — prévu dans la charte mais aucune source audio n'est câblée dans le
   projet aujourd'hui. À traiter séparément si vous le voulez.

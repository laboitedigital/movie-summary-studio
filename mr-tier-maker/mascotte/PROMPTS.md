# Prompts exacts — mascotte, cartons, réactions

Les images sont versionnées, mais **une image ne dit pas comment la refaire**.
Ce fichier garde les prompts au mot près, avec le modèle, le coût et l'ID de
l'asset Yapper. C'est ce qu'il faut pour produire une septième réaction, un
carton dans une nouvelle couleur, ou tout regénérer si un fichier se perd.

Toujours `dryRun: true` avant le vrai run, et un `idempotencyKey` stable.

---

## 1. Plaque maîtresse

`plaque-fond-uni-1920x1080.jpg` — modèle `gpt-image-2`, 2k, 16:9, 10 crédits.
Référence : l'avatar d'origine (asset `99188b9b-41e0-4daf-8c8e-1d45cafb2bc0`).
Sortie : asset **`b0e8f0ee-5e36-4c8c-a8d7-e7e878e6dcf5`**.

> Keep the character exactly as he is — same face, same expression, same pose,
> same hand, same brown hair, same black hoodie, same card with the letter S —
> but remove the rainbow colour stripes on the right completely. The whole
> background becomes one perfectly flat, uniform, solid dark navy blue, hex
> #071027, with no gradient, no vignette, no lighting falloff and no texture at
> all: a single even block of colour behind the character. Also move the
> character so he sits in the left third of the frame, leaving the right two
> thirds as empty flat navy. Nothing else about him changes.

**Les deux exigences non négociables sont dans ce prompt** : plus de bandes, et
un fond parfaitement plat. Le détourage `colorkey=0x050D23:0.030:0.012` ne
marche que là-dessus, et le sweat noir n'est qu'à 0,047 de la clé — la marge
existe mais elle est mince.

Le personnage dans le tiers gauche laisse la place au tableau à droite.

---

## 2. Les six cartons de tier

`cartes/carte-{S,A,B,C,D,F}.jpg` — `gpt-image-2`, 2k, 16:9, 10 crédits pièce.
Référence : la plaque maîtresse ci-dessus. Sortie recadrée en 1920×1080
(`crop=2020:1136:14:0,scale=1920:1080` — le modèle rend en 2048×1136).

> Keep this image exactly as it is — same character, same pose, same position
> in the left third of the frame, same perfectly flat uniform dark navy
> background with no stripes and no gradient. Change only the small card he
> holds: the letter becomes a capital **{LETTRE}** instead of S, in the same
> blocky stencil lettering, same size, same position, the card keeps its dark
> almost black interior, and only its rounded border, the letter itself and the
> outer neon glow become **{DESCRIPTION}**, hex **{HEX}**.

| Tier | DESCRIPTION | HEX |
|---|---|---|
| S | a vivid raspberry red | `#E6354F` |
| A | a vivid orange | `#F47025` |
| B | a golden amber yellow | `#F7B632` |
| C | a medium leaf green | `#72AB54` |
| D | a medium royal blue | `#3A5DAD` |
| F | a medium purple | `#7242AA` |

Pour S, remplacer la première phrase du changement par « the letter stays a
capital S » — seule la couleur change.

**Ne change que la bordure, la lettre et le halo.** L'intérieur du carton reste
noir : c'est ce qui rend le bleu et le violet lisibles autant que le jaune.

---

## 3. Les six réactions animées

`reactions/reaction-{S,A,B,C,D,F}.mp4` — `seedance-2.5`, 5 s, 720p, 16:9,
**210 crédits pièce**. Image de départ : le carton du tier correspondant,
uploadé en 1920×1080 exact.

Squelette commun, à compléter par le jeu propre au tier :

> A 2D cartoon character holds up a small **{COULEUR}** tier card marked
> **{LETTRE}**. **{JEU}** His mouth never opens, he does not speak. The camera
> is locked off, no zoom, no pan, no drift. The background stays a perfectly
> flat uniform dark navy blue, completely empty, with no colour stripes, no
> gradient and no lighting change. His hoodie stays solid black, his hair stays
> brown, and his face keeps exactly the same design throughout.

**Les trois verrous de la fin du prompt sont ceux qui dérivent** si on les
enlève : le modèle ouvre la bouche, fait bouger la caméra, et réintroduit un
dégradé dans le fond — ce dernier casse le détourage.

| Tier | JEU |
|---|---|
| **S** | He is pleased and sure of himself: his smirk widens into a broad closed-mouth grin, he lifts the card a couple of centimetres higher and gives one firm approving nod, then settles. His eyebrows rise slightly on the nod. The card's red neon glow pulses gently twice. |
| **A** | He approves clearly but without excitement: a small satisfied closed-mouth smile, one calm nod, and a slight tilt of the card towards the camera as if presenting it. The card's orange neon glow pulses gently once. |
| **B** | He is mildly content, nothing more: he tilts his head slightly to one side, gives one small nod, and his smirk stays exactly as it is. A tiny shrug of one shoulder. The card's amber neon glow pulses gently once. |
| **C** | He is completely non-committal: his smirk flattens into a neutral straight mouth, he raises one eyebrow, and gives a small so-so shrug of both shoulders while tilting the card slightly side to side. The card's green neon glow pulses gently once. |
| **D** | He is unimpressed and a little tired of it: his eyelids drop to half-closed, one corner of his mouth pulls down, and he gives a single slow disapproving shake of the head while the card stays up. The card's blue neon glow pulses gently once. |
| **F** | He is done with it: he shuts his eyes for a beat, shakes his head firmly twice, and pushes the card a little further out to the side as if getting rid of it, mouth pressed into a flat disapproving line. The card's purple neon glow flickers once and dims. |

---

## 4. Cold open — les deux plans mécha

`seedance-2.5`, 5 s, 720p, 16:9, **sans image de départ**, 210 crédits pièce.

**Aucun personnage sous licence.** Les prompts interdisent explicitement logo,
visage reconnaissable et texte : citer un extrait pour le commenter se défend,
recréer un personnage sous licence ne se défend pas.

**Plan 2 — registre blockbuster**

> A colossal humanoid war machine rises in silhouette against a burning orange
> sky, backlit so only its outline and a few hard rim highlights are visible.
> Metal panels along its shoulder and arm fold and lock into place with
> mechanical precision. Embers and debris drift through heavy dust haze,
> anamorphic lens flares streak across the frame, slight handheld camera shake,
> slow low push-in. Live-action blockbuster look, teal and orange grade, shallow
> depth of field. The machine is an original generic design with no recognisable
> face and no branding. There is no text, no writing and no logo anywhere in the
> frame.

**Plan 3 — registre cel-anime 1986**

> A colossal humanoid machine rendered as 1986 hand-painted cel animation: flat
> painted colour fills, thick black ink outlines, visible 35mm film grain,
> halation bloom around the highlights, slight gate weave. Low heroic angle
> looking up as it plants one foot forward and straightens. Hand-painted matte
> background of a ruined orange sky with airbrushed clouds. Limited animation
> feel, held drawings, slow vertical pan up the body ending on the head. The
> machine is an original generic design with no recognisable face and no
> branding. There is no text, no writing and no logo anywhere in the frame.

C'est le **passage de l'un à l'autre** qui fait le gag : blockbuster fauché →
vrai anime. Le changement de rendu porte le sens de la phrase.

# Mascotte MR TierMaker

## Image de référence

`reference-1920x1080.jpg` — 1920×1080, exactement 16:9.

Elle est dérivée de `../smug-s-tile.jpg` (2048×2048, l'original de Popol), étendue en
16:9 avec GPT Image 2 puis recadrée au pixel près. **C'est cette version qu'il faut
passer aux modèles vidéo**, pas l'originale carrée : Kling 3.0 refuse toute image dont
le ratio n'est pas exactement 1,7778, et un ratio approchant fait recadrer les autres.

Asset Yapper : `99188b9b-41e0-4daf-8c8e-1d45cafb2bc0`

## Modèle retenu : Seedance 2.5

```
model      seedance-2.5
resolution 720
aspectRatio 16:9
videoLength 5
startingFrameImageUrl  <url de l asset Yapper ci-dessus>
```

210 crédits par clip de 5 s.

## Pourquoi celui-là

Quatre modèles testés sur le même plan, même prompt, même image de départ.
Les fichiers sont dans `tests/`.

| Modèle | Déf. | Crédits | Fidélité au personnage | Tenue du cadre |
|---|---|---|---|---|
| **Seedance 2.5** | 720p | 210 | **la meilleure** — air narquois intact | léger resserrement |
| Seedance 2.0 | 1080p | 280 | ouvre un large sourire dents apparentes | resserrement net |
| Seedance 2.0 Mini | 960px | 90 | change la couleur du hoodie | resserrement marqué |
| Veo 3.1 | 720p | 80 | correcte | **la meilleure** — cadre quasi fixe |

Veo tient mieux le cadre, mais Seedance 2.5 respecte mieux le personnage, et c'est ce
qui compte pour une mascotte récurrente. Le resserrement de Seedance est un mouvement
de caméra normal, pas un défaut à corriger.

## Écrire les prompts

L'image porte déjà le style, l'éclairage, le décor et la pose : ne les redécris pas.
Décris uniquement le mouvement, et ce qui doit rester fixe.

Ce qui dérive si on ne le verrouille pas :

- **l'expression** — préciser que la bouche reste fermée et les paupières mi-closes,
  sinon les modèles lui font un grand sourire
- **la couleur du hoodie** — préciser qu'il reste noir
- **la position des bandes** de couleur en fond

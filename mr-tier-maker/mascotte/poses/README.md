# Poses de la mascotte

Générées dans Yapper, `gpt-image-2`, 10 crédits chacune, **avec l'avatar en
image de référence**. C'est la référence qui compte : sans elle, le modèle
dessine un personnage qui *ressemble* — cheveux, sourcils, coupe légèrement
différents — et la chaîne perd son identité au fil des épisodes.

| Fichier | Pose | Pour |
|---|---|---|
| `blase.jpg` | Bras croisés, regard mi-clos | Un film qu'on subit |
| `hallucine.jpg` | Yeux ronds, mains levées | Une incohérence de scénario |
| `facepalm.jpg` | Paume sur le front | Le pire moment d'un film |

## Détourage

Elles passent au `colorkey=0x050D23:0.030:0.012`, la clé du projet — vérifié :
alpha résiduel de **3 sur 255** dans les coins.

Leur fond n'est pas exactement `#050D23` : mesuré, il est à `(1,7,30)` et
`(0,8,32)` selon la pose, contre `(5,13,35)` pour la clé. L'écart passe dans la
tolérance, mais il est à la limite. Si une pose future ne se détoure pas, c'est
la première chose à mesurer — aux quatre coins, pas à l'œil.

Le prompt exige un fond **uniforme, sans dégradé ni ombre portée**. C'est la
condition du détourage, pas une préférence esthétique.

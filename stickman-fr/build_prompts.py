# -*- coding: utf-8 -*-
"""Assemble les 126 prompts d'image stickman a partir des scenes + blocs verrouilles."""
import json, pathlib

# Cadence de parole mesuree sur la voix off ElevenLabs (eleven_v3, voix Yann).
WPS = 3.27

LOCKED_CHARACTER = (
    "LOCKED CHARACTER DESIGN: The stick figure characters have large perfectly round pure white heads "
    "with highly expressive cartoon faces featuring thick black eyebrow lines that show emotion clearly, "
    "large white eyes with black pupils and visible irises, and wide open mouths with teeth and tongue "
    "visible when expressing strong emotions like anger, fear, surprise, or excitement. The character "
    "bodies are classic stick figure construction with thin black line arms and legs but the heads are "
    "the dominant visual feature at approximately one third of the total character height. Characters "
    "wear detailed thematic clothing rendered in the stick figure aesthetic, meaning clothing is drawn "
    "as clean cartoon outlines with flat colors and simple details that match the scene and story "
    "context, such as robes, suits, armor, casual clothes, or period appropriate costumes. Clothing "
    "must be colorful and visually specific to the character role in the scene."
)

MAIN_CHARACTER = (
    "MAIN CHARACTER (LEO) - LOCKED APPEARANCE, IDENTICAL IN EVERY IMAGE: Leo is a stick figure with a "
    "large perfectly round pure white head, wearing a heather grey hooded sweatshirt with white "
    "drawstrings and a large front kangaroo pocket, a white t-shirt visible at the collar, dark blue "
    "jeans slightly rolled up at the ankles, and bright red sneakers with white soles. He permanently "
    "wears electric blue over-ear headphones resting around his neck, often holds a black-cased "
    "smartphone in both hands, and a small orange spiral notebook sticks out of his front pocket. His "
    "shoulders sit slightly hunched forward and his thick black eyebrows swing quickly between hope and "
    "confusion. His hood is ALWAYS down, resting flat behind his neck, and is NEVER pulled up over his "
    "head. His head is always completely bare, perfectly round, pure white, and has NO HAIR of any kind, "
    "no fringe, no strands, nothing on top of the head. This exact appearance must be reproduced "
    "identically in this image."
)

# Regles de coherence ajoutees apres le test de 4 images (capuche relevee, membres habilles,
# texte parasite dans les decors). Bloc separe : les blocs verrouilles restent verbatim.
CONSISTENCY_RULES = (
    "MANDATORY CONSISTENCY RULES FOR THIS IMAGE SET: Every character's arms and legs are drawn as thin "
    "plain black lines with no thickness, no volume, and no sleeves or trouser legs wrapped around them. "
    "Clothing covers the torso only and stops at the shoulders and hips, so the limbs stay bare black "
    "lines in every single image. No character has hair of any kind and no character wears a hood pulled "
    "over the head; every head is a bare, perfectly round, pure white circle. There is NO text anywhere "
    "in the image: no words, no letters, no lettering on posters, signs, screens, labels, packaging, "
    "books, or walls, no logos, no watermarks, and no captions. The only exception is a number on a "
    "counter or display when the scene description above explicitly asks for one."
)

LOCKED_STYLE = (
    "LOCKED IMAGE STYLE: The overall image style is cinematic cartoon illustration with fully colored "
    "and rendered backgrounds that create dramatic atmospheric depth. Backgrounds are richly detailed "
    "cartoon environments with strong dramatic lighting, vivid color palettes, atmospheric effects like "
    "fire glow, moonlight, spotlights, storm clouds, or magical light, and multiple layers of depth from "
    "foreground elements to distant background details. The art style combines the simplicity of stick "
    "figure characters with the visual richness of a professionally illustrated cartoon short film, "
    "similar to a high quality web comic or animated series still frame. Line weights are bold and "
    "confident throughout. Colors are saturated and contrast-rich. The composition uses cinematic "
    "framing with clear foreground, midground, and background layers. Lighting is dramatic and "
    "purposeful, creating strong mood and atmosphere appropriate to the scene. 16:9 horizontal "
    "composition, ultra-detailed, professional cartoon illustration quality."
)

# Phrase ajoutee uniquement quand une image de reference est jointe a la generation
# (Yapper : input.referenceImages = [{"assetId": "..."}]). Absente du fichier .md,
# qui sert aux generations manuelles sans reference.
REFERENCE_NOTE = (
    "CHARACTER REFERENCE: The attached reference image shows the main character Leo exactly as he must "
    "look. Copy his head shape, face style, line weight, clothing colours, and body proportions from that "
    "reference precisely, including when he appears small, distant, or in the background of this scene."
)

CLOSER = (
    "The stick figure heads must be large, round, pure white, and highly expressive with cartoon facial "
    "features clearly visible. Character clothing must be fully colored and thematically appropriate. "
    "The background must be a fully rendered cinematic cartoon environment with rich color, dramatic "
    "lighting, and atmospheric depth. NOT minimalist, NOT black and white only, NOT flat or textureless. "
    "Full color cinematic cartoon stick figure illustration at professional quality, 16:9, ultra-detailed."
)


def build(scenes, beats, out_md):
    assert len(scenes) == len(beats), (len(scenes), len(beats))
    parts = []
    cum = 0
    for i, (s, b) in enumerate(zip(scenes, beats), 1):
        tc = cum / WPS
        cum += len(b.split())
        parts.append(
            f"## PROMPT {i}  —  beat {i} · {tc:.1f}s\n"
            f"**Narration :** {b}\n\n"
            f"**Scène (FR) :** {s['fr']}\n\n"
            f"**Prompt :**\n"
            f"{s['env']} {s['chars']} {s['action']} "
            f"{LOCKED_CHARACTER} {MAIN_CHARACTER} {LOCKED_STYLE} {CONSISTENCY_RULES} {CLOSER}\n"
        )
    out_md.write_text(
        f"# PROMPTS D'IMAGE STICKMAN — {len(parts)} BEATS\n"
        f"Vidéo : « Comment YouTube paie vraiment ses créateurs » — 5 minutes, "
        f"{sum(len(b.split()) for b in beats)} mots, {len(parts)} beats.\n"
        f"Cadence de narration mesurée : {WPS} mots/seconde.\n"
        "Personnage principal verrouillé : Léo.\n\n"
        + "\n---\n\n".join(parts),
        encoding="utf-8",
    )
    return len(parts)


if __name__ == "__main__":
    here = pathlib.Path(__file__).parent
    scenes = json.loads((here / "scenes.json").read_text(encoding="utf-8"))
    beats = [l.strip() for l in (here / "beats.txt").read_text(encoding="utf-8").splitlines() if l.strip()]
    n = build(scenes, beats, here / "PROMPTS_IMAGES_STICKMAN.md")
    print(f"{n} prompts generes")


# Gabarit compact utilise pour la generation via API : l'image de reference porte
# le style et le personnage, le prompt ne porte plus que la scene.
COMPACT_PREFIX = (
    "Match the attached reference image exactly for art style and for the main character Leo: same "
    "cinematic cartoon illustration style, same bold confident line work, same fully rendered colourful "
    "background with dramatic atmospheric lighting, same large round pure white bare head with no hair "
    "and expressive thick black eyebrows, and Leo's same heather grey hoodie with the hood down, white "
    "t-shirt, dark blue rolled jeans, red sneakers, electric blue headphones around the neck and orange "
    "notebook in the front pocket. Every wall, poster, artwork, sign, label, book and screen in this "
    "image is completely blank with no words, letters or lettering anywhere, except the numbers "
    "explicitly described below."
)
COMPACT_SUFFIX = "16:9 horizontal composition, ultra-detailed, professional cartoon illustration quality."


def compact(i):
    """Prompt compact du beat i (1-indexe)."""
    import json, pathlib
    s = json.loads((pathlib.Path(__file__).parent / "scenes.json").read_text(encoding="utf-8"))[i - 1]
    return f"{COMPACT_PREFIX} {s['env']} {s['chars']} {s['action']} {COMPACT_SUFFIX}"

# -*- coding: utf-8 -*-
"""Assemble les 126 prompts d'image stickman a partir des scenes + blocs verrouilles."""
import json, pathlib

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
    "confusion. This exact appearance must be reproduced identically in this image."
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
        tc = cum / 2.5
        cum += len(b.split())
        parts.append(
            f"## PROMPT {i}  —  beat {i} · {tc:.1f}s\n"
            f"**Narration :** {b}\n\n"
            f"**Scène (FR) :** {s['fr']}\n\n"
            f"**Prompt :**\n"
            f"{s['env']} {s['chars']} {s['action']} "
            f"{LOCKED_CHARACTER} {MAIN_CHARACTER} {LOCKED_STYLE} {CLOSER}\n"
        )
    out_md.write_text(
        "# PROMPTS D'IMAGE STICKMAN — 126 BEATS\n"
        "Vidéo : « Comment YouTube paie vraiment ses créateurs » — 5 minutes, 749 mots, 126 beats.\n"
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

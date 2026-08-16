#!/usr/bin/env bash
# Rendu du kit MR TierMaker.
#
# Deux formats, et la raison n est pas le logiciel de montage : c est ffmpeg qui
# assemble. On sort donc l intermediaire que ffmpeg lit le mieux.
#   - overlays  -> ProRes 4444, alpha reel, lu sans perte par ffmpeg
#   - opaques   -> H.264 CRF 16
#
# A NE PAS FAIRE : donner du ProRes en ENTREE a Remotion. Le rendu tourne dans
# Chromium, qui ne decode pas le ProRes. Toute video source (extraits, mascotte)
# reste du cote ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
OUT=${OUT:-out}
mkdir -p "$OUT"
E=src/index.ts
ALPHA=(--codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png)
OPAQUE=(--codec=h264 --crf=16)

r() { echo "→ $1"; npx --no-install remotion render "$E" "$@"; }

# --- opaques -----------------------------------------------------------------
r TitleCard  "$OUT/TitleCard.mp4"  "${OPAQUE[@]}" --props='{"title":"THE TRANSFORMERS: THE MOVIE","year":1986}'
r ProsCons   "$OUT/ProsCons.mp4"   "${OPAQUE[@]}"
r ScoreDials "$OUT/ScoreDials.mp4" "${OPAQUE[@]}"
r TierBoard  "$OUT/TierBoard.mp4"  "${OPAQUE[@]}"

# --- overlays a canal alpha ---------------------------------------------------
r RainbowWipe     "$OUT/RainbowWipe.mov"     "${ALPHA[@]}"
r LowerThird      "$OUT/LowerThird.mov"      "${ALPHA[@]}" --props='{"label":"THE MOVIE","year":1986,"tier":"B"}'
r PosterPlacement "$OUT/PosterPlacement.mov" "${ALPHA[@]}"
r VerdictCard     "$OUT/VerdictCard.mov"     "${ALPHA[@]}"

echo "OK — $OUT"

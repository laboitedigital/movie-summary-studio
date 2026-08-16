#!/bin/sh
# Remet les 95 extraits dans clips/, en NOUVELLE numerotation.
#
# Ils sont eparpilles dans cinq artefacts GitHub, dont trois sont en ANCIENNE
# numerotation — ils ont ete telecharges avant que le sous-titrage soit refait.
# L ordre ci-dessous compte : on renomme AVANT de poser les rattrapages, qui
# eux sont deja au bon numero. L inverse les ecraserait.
#
#   sh assembler-extraits.sh ~/Telechargements
#
# ou le dossier passe en argument contient les cinq zip decompresses dans des
# sous-dossiers, un par run :
#
#   31928598104/   88 extraits, tous les films          (ancienne numerotation)
#   31948946566/    8 extraits, segment 5               (ancienne numerotation)
#   31949254257/   11 extraits, segment 6               (ancienne numerotation)
#   31951727721/    2 extraits, plans 085 et 111        (NOUVELLE)
#   31970533637/   25 extraits, dont les segments 7 et 8 refaits dans le bon
#                  film, apres l'inversion de la table FILMS     (NOUVELLE)
#   31974243565/    3 extraits, 017 128 156                      (NOUVELLE)
#
# Ne PAS reprendre les artefacts des runs 31951890382 et 31952257833 : c etaient
# les tentatives sur le plan 034, qui n est plus un extrait. Leur 034.mp4 serait
# signale en trop a la verification.
#
# Les artefacts expirent le 2026-08-23.
set -e
SRC="${1:?donne le dossier qui contient les artefacts decompresses}"
ICI=$(cd "$(dirname "$0")" && pwd)
DEST="$ICI/clips"
mkdir -p "$DEST"

# 1. le grand run sert de base, les deux rattrapages de segment l ecrasent
for r in 31928598104 31948946566 31949254257; do
  [ -d "$SRC/$r" ] || { echo "manque : $SRC/$r"; exit 1; }
  cp "$SRC/$r"/*.mp4 "$DEST/"
done
echo "$(ls "$DEST"/*.mp4 | wc -l) extraits en ancienne numerotation"

# 2. ancienne -> nouvelle numerotation
(cd "$DEST" && sh "$ICI/renommer-extraits.sh")

# 3. les rattrapages, deja au bon numero
# L'ordre compte : le dernier ecrit gagne. 31974243565 refait trois plans qui
# etaient deja dans 31970533637.
for r in 31951727721 31970533637 31974243565; do
  [ -d "$SRC/$r" ] && cp "$SRC/$r"/*.mp4 "$DEST/"
done
# le 034 telecharge ne sert plus : le plan est passe en motion
rm -f "$DEST/034.mp4"

# 4. verification contre le plan : chaque plan CLIP doit avoir son fichier
python3 - "$DEST" "$ICI/../plan-episode-01.json" <<'PY'
import json, os, sys, glob
dest, chemin = sys.argv[1], sys.argv[2]
plan = json.load(open(chemin, encoding='utf-8'))
attendus = sorted(x['n'] for x in plan if x['famille'] == 'extrait')
present  = {int(os.path.basename(f)[:3]) for f in glob.glob(os.path.join(dest, '*.mp4'))}
manque   = [n for n in attendus if n not in present]
extra    = sorted(present - set(attendus))
print("%d extraits attendus, %d presents" % (len(attendus), len(present & set(attendus))))
if manque: print("MANQUE : %s" % ", ".join("%03d" % n for n in manque))
if extra:  print("en trop (a jeter) : %s" % ", ".join("%03d" % n for n in extra))
if not manque: print("complet.")
PY

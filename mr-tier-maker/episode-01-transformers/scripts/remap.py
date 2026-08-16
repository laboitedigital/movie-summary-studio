# -*- coding: utf-8 -*-
"""Reporte les plans de l ANCIEN sous-titrage sur la voix off de reference.

Ne sert plus au montage : le SRT a ete refait sur `voix-complete.mp3`, donc
`shots.load()` lit deja les bons timecodes. Ce script ne sert qu a produire
`plans-remappes.json`, la piece qui permet a `renumerote.py` de savoir quel
ancien plan correspond a quel nouveau — et donc de renommer ce qui etait deja
indexe par numero de plan.

La correspondance est lineaire par morceau : dans chaque partie le decalage est
constant, donc aucun plan n a besoin d etre re-decoupe — seules ses bornes
glissent. Les trois fenetres de narration recuperee s inserent entre les plans.

A relancer si le SRT change. Sortie : voix/plans-remappes.json.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shots

VOIX = shots.VOIX
SEG  = json.load(open(os.path.join(VOIX, 'correspondance.json'), encoding='utf-8'))

def remap(t):
    for s in SEG:
        if s['master_debut'] <= t < s['master_fin']:
            return round(s['nouveau_debut'] + (t - s['master_debut']), 3)
    return round(SEG[-1]['nouveau_fin'] + (t - SEG[-1]['master_fin']), 3)

S = shots.load(os.path.join(VOIX, 'voix-master.srt'))
out = [{**x, 'a': remap(x['a']), 'b': remap(x['b'])} for x in S]
json.dump(out, open(os.path.join(VOIX, 'plans-remappes.json'), 'w'),
          ensure_ascii=False, indent=1)

print("fenetres de narration recuperee :\n")
for s in SEG:
    if s['recupere_s'] > 0.05:
        d0 = s['nouveau_fin'] - s['recupere_s']
        suiv = min((x for x in S if x['a'] >= s['master_fin'] - 6),
                   key=lambda x: x['a'], default=None)
        note = "plan %03d" % suiv['n'] if suiv else "?"
        print("  %7.2f -> %7.2f s   (%5.2f s)   apres la fin de %s, avant le %s"
              % (d0, s['nouveau_fin'], s['recupere_s'], s['partie'], note))
print("\n%d anciens plans remappes -> voix/plans-remappes.json" % len(out))
print("(le montage, lui, utilise shots.load() : %d plans sur voix.srt)"
      % len(shots.load()))

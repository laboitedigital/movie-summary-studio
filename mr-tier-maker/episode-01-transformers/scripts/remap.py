# -*- coding: utf-8 -*-
import sys; sys.path.insert(0,".")
"""Reporte les 156 plans sur la nouvelle voix off.

La correspondance est lineaire par morceau : dans chaque partie, le decalage
est constant. Aucun plan n a besoin d etre re-decoupe — seules ses bornes
glissent. Les trois fenetres de narration recuperee s inserent entre les plans.
"""
import json, shots
SEG=json.load(open('vo/correspondance.json'))

def remap(t):
    for s in SEG:
        if s['master_debut'] <= t < s['master_fin']:
            return round(s['nouveau_debut'] + (t - s['master_debut']), 3)
    return round(SEG[-1]['nouveau_fin'] + (t - SEG[-1]['master_fin']), 3)

S=shots.load()
out=[]
for x in S:
    out.append({**x, 'a': remap(x['a']), 'b': remap(x['b'])})
json.dump(out, open('vo/plans-remappes.json','w'), ensure_ascii=False, indent=1)

print("fenetres de narration recuperee :\n")
for s in SEG:
    if s['recupere_s'] > 0.05:
        d0 = s['nouveau_fin'] - s['recupere_s']
        # quel plan tombait juste apres la coupure ?
        suiv = min((x for x in S if x['a'] >= s['master_fin']-6), key=lambda x: x['a'], default=None)
        note = f"plan {suiv['n']:03d}" if suiv else "?"
        print(f"  {d0:7.2f} -> {s['nouveau_fin']:7.2f} s   ({s['recupere_s']:5.2f} s)"
              f"   apres la fin de {s['partie']}, avant le {note}")
print(f"\n{len(out)} plans remappes -> vo/plans-remappes.json")
print(f"nouvelle duree totale : {SEG[-1]['nouveau_fin']:.2f} s "
      f"(ancienne : 935.33 s)")

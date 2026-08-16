# -*- coding: utf-8 -*-
"""Reconstruit voix-complete.mp3 a partir des seules parties generees.

La voix off de reference, ce sont les quatre fichiers de `voix/sources/`, pas
le master FlexClip. Celui-ci tronquait la FIN de a1, de a2 et de ae — 24,47 s
de narration, exactement les passages qui portaient les verdicts — et ajoutait
42,7 s de silence numerique (-91 dB) apres la derniere phrase. Il a ete jete :
plus rien ici n en depend.

Sortie : voix/voix-complete.mp3 (917,11 s) + voix/correspondance.json, la table
qui reporte les timecodes du SRT master sur cette nouvelle base de temps.
"""
import subprocess, json, os

ICI  = os.path.dirname(os.path.abspath(__file__))
VOIX = os.path.join(os.path.dirname(ICI), 'voix')

# les 5 morceaux, dans l ordre, et leur duree mesuree
PARTS = [('01-a1', 254.589), ('02-a2', 204.591), ('03-ae', 260.598),
         ('04-a4', 197.329)]

# ou chaque partie commençait dans l ancien master (mesure par correlation
# d enveloppes d energie). Sert uniquement a convertir les timecodes du SRT.
MASTER = [0.0, 240.4, 435.4, 695.3, 892.63]

def sh(*a): subprocess.run(list(a), check=True)

def build():
    liste = os.path.join(VOIX, 'liste.txt')
    with open(liste, 'w') as f:
        for n, _ in PARTS:
            f.write("file '%s'\n" % os.path.join(VOIX, 'sources', n + '.mp3'))
    out = os.path.join(VOIX, 'voix-complete.mp3')
    sh('ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
       '-i', liste, '-c:a', 'libmp3lame', '-b:a', '192k', out)
    os.remove(liste)
    return out

def table():
    seg, new = [], 0.0
    for i, (n, dur) in enumerate(PARTS):
        old0, old1 = MASTER[i], MASTER[i + 1]
        seg.append({"partie": n, "master_debut": old0, "master_fin": old1,
                    "nouveau_debut": round(new, 3), "nouveau_fin": round(new + dur, 3),
                    "recupere_s": round(dur - (old1 - old0), 3)})
        new += dur
    json.dump(seg, open(os.path.join(VOIX, 'correspondance.json'), 'w'),
              indent=1, ensure_ascii=False)
    return seg

if __name__ == '__main__':
    out = build()
    seg = table()
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'csv=p=0', out], capture_output=True, text=True).stdout)
    print("voix-complete.mp3 : %.2f s" % d)
    print("narration recuperee : %.2f s\n" % sum(s['recupere_s'] for s in seg if s['recupere_s'] > 0))
    print("%14s | %16s | %16s | recupere" % ('partie', 'master', 'nouveau'))
    for s in seg:
        print("%14s | %7.1f-%7.1f | %7.1f-%7.1f | %+6.2f s" % (
            s['partie'], s['master_debut'], s['master_fin'],
            s['nouveau_debut'], s['nouveau_fin'], s['recupere_s']))

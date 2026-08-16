# -*- coding: utf-8 -*-
"""Reconstruit la voix off complete a partir des 4 parties generees.

Ce que l analyse a etabli :
  - les 4 fichiers se suivent (aucun ne repete le texte du voisin), dans
    l ordre a1, a2, ae, a4 ;
  - le master assemble tronquait la FIN de a1, de a2 et de ae — 24,5 s au
    total, exactement les passages qui portaient les verdicts manquants ;
  - le master contient en revanche une conclusion de 42,7 s absente des quatre
    parties. On la recupere depuis lui.

Sortie : voix-complete.mp3, et la table de correspondance des timecodes.
"""
import subprocess, json, os

PARTS=[('a1',254.589),('a2',204.590),('ae',260.596),('a4',197.329)]
# ou chaque partie commence dans le master assemble (mesure par correlation)
DANS_MASTER=[0.0, 240.4, 435.4, 695.3]
FIN_A4_MASTER=892.63          # la queue du master commence ici

def sh(*a): subprocess.run(list(a),check=True)

# 1. la conclusion, extraite du master
sh('ffmpeg','-y','-loglevel','error','-ss',str(FIN_A4_MASTER),'-i','voix-episode.mp3',
   '-c:a','libmp3lame','-b:a','192k','vo/queue.mp3')

# 2. concatenation des 4 parties + la conclusion, sans reencoder les bornes
with open('vo/liste.txt','w') as f:
    for n,_ in PARTS: f.write(f"file '{os.path.abspath('vo/'+n+'.mp3')}'\n")
    f.write(f"file '{os.path.abspath('vo/queue.mp3')}'\n")
sh('ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i','vo/liste.txt',
   '-c:a','libmp3lame','-b:a','192k','voix-complete.mp3')

d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration',
    '-of','csv=p=0','voix-complete.mp3'],capture_output=True,text=True).stdout)

# 3. table de correspondance ancien -> nouveau timecode
seg=[]; new=0.0
for i,(n,dur) in enumerate(PARTS):
    old0=DANS_MASTER[i]
    old1=DANS_MASTER[i+1] if i+1<len(DANS_MASTER) else FIN_A4_MASTER
    seg.append({"partie":n,"master_debut":old0,"master_fin":old1,
                "nouveau_debut":round(new,3),"nouveau_fin":round(new+dur,3),
                "recupere_s":round(dur-(old1-old0),3)})
    new+=dur
seg.append({"partie":"conclusion","master_debut":FIN_A4_MASTER,"master_fin":935.328,
            "nouveau_debut":round(new,3),"nouveau_fin":round(new+935.328-FIN_A4_MASTER,3),
            "recupere_s":0.0})
json.dump(seg,open('vo/correspondance.json','w'),indent=1,ensure_ascii=False)

print(f"voix-complete.mp3 : {d:.2f} s  (master : 935.33 s)")
print(f"narration recuperee : {sum(s['recupere_s'] for s in seg):.2f} s\n")
print(f"{'partie':>11} | {'master':>16} | {'nouveau':>16} | recupere")
for s in seg:
    print(f"{s['partie']:>11} | {s['master_debut']:7.1f}-{s['master_fin']:7.1f} |"
          f" {s['nouveau_debut']:7.1f}-{s['nouveau_fin']:7.1f} | {s['recupere_s']:+6.2f} s")

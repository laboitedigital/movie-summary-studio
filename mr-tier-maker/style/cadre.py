# -*- coding: utf-8 -*-
"""Les extraits Clip.cafe ne sont plus plein ecran : ils vivent dans un cadre
cartoon a 90 % de la largeur, sur le fond de la chaine."""
import subprocess, os, cartoon
NAVY='071027'
W,H=1920,1080
RATIO=0.90
CW=int(W*RATIO)//2*2          # 1728
CH=CW*9//16//2*2              # 972
CX=(W-CW)//2; CY=(H-CH)//2
CADRE='out/cadre-90.png'

def make_cadre(path=CADRE, r=30, stroke=10):
    if not os.path.exists(path):
        cartoon.hole_frame(path,W,H,CX,CY,CW,CH,r=r,stroke=stroke,bg=NAVY)
    return path

def encadrer(src,out,d=None):
    make_cadre()
    # le clip remplit le trou : on recadre au besoin plutot que de deformer
    fc=(f"[0:v]scale={CW}:{CH}:force_original_aspect_ratio=increase,"
        f"crop={CW}:{CH},setsar=1[clip];"
        f"color=c=0x{NAVY}:s={W}x{H}[bgc];"
        f"[bgc][clip]overlay=x={CX}:y={CY}:shortest=1[base];"
        f"[base][1:v]overlay=x=0:y=0:format=auto[v]")
    cmd=['ffmpeg','-y','-loglevel','error','-i',src,'-i',CADRE,
         '-filter_complex',fc,'-map','[v]']
    if d: cmd+=['-t',str(d)]
    cmd+=['-r','25','-c:v','libx264','-preset','veryfast','-crf','18',
          '-pix_fmt','yuv420p','-an',out]
    subprocess.run(cmd,check=True)
    print("ok ->",out)

if __name__=='__main__':
    import sys
    encadrer(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv)>3 else None)

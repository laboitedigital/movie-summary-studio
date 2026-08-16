# -*- coding: utf-8 -*-
# Plans 1 et 5 du cold open : fabriques en ffmpeg, pas en IA.
# Plan 1 = neuf barres qui s allument (le compte doit etre exact).
# Plan 5 = travelling sur les vraies affiches, puis le tableau.
import subprocess, os, glob, tableau
NAVY='0x071027'; FPS=25
SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
TIERS=tableau.TIERS

def plan1(out, d=3.72):
    N=9; bw=34; gap=104; H=460
    total=N*bw+(N-1)*gap; x0=(1920-total)//2; y0=(1080-H)//2
    t0=0.25; step=0.19            # une barre toutes les 0.19 s
    tdim=t0+N*step+0.35           # ensuite tout s eteint sauf la 1re et la 9e
    f=[]
    for i in range(N):
        x=x0+i*(bw+gap); on=t0+i*step
        keep = (i==0 or i==N-1)
        # halo
        f.append(f"drawbox=x={x-9}:y={y0-9}:w={bw+18}:h={H+18}:color=0xF7B632@0.16:t=fill:"
                 f"enable='between(t,{on:.2f},{d})'")
        # barre pleine, puis attenuee pour les sept du milieu
        if keep:
            f.append(f"drawbox=x={x}:y={y0}:w={bw}:h={H}:color=0xF7B632:t=fill:enable='gte(t,{on:.2f})'")
        else:
            f.append(f"drawbox=x={x}:y={y0}:w={bw}:h={H}:color=0xF7B632:t=fill:"
                     f"enable='between(t,{on:.2f},{tdim:.2f})'")
            f.append(f"drawbox=x={x}:y={y0}:w={bw}:h={H}:color=0xF7B632@0.13:t=fill:enable='gt(t,{tdim:.2f})'")
    vf=",".join(f)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','lavfi',
        '-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}','-vf',vf,
        '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out],check=True)
    print("ok ->",out)

def plan5(out, d=4.14):
    aff=sorted(glob.glob('posters/*.jpg'))
    ph=620; pw=int(ph*496/755); gap=64
    strip=len(aff)*pw+(len(aff)-1)*gap
    ins=[]; fc=[]
    for i,a in enumerate(aff):
        ins += ['-loop','1','-i',a]
        fc.append(f"[{i}:v]scale={pw}:{ph}[p{i}]")
    # bande : les affiches posees cote a cote sur un fond transparent
    fc.append(f"color=c={NAVY}:s=1920x1080:r={FPS}:d={d}[bg]")
    prev='bg'
    travel=1920+strip
    for i in range(len(aff)):
        xi=f"{1920+i*(pw+gap)}-({travel})*t/{d-0.15}"
        fc.append(f"[{prev}][p{i}]overlay=x='{xi}':y={(1080-ph)//2}:shortest=1[s{i}]")
        prev=f"s{i}"
    # le tableau vide monte en fondu sur la derniere seconde
    tab=tableau.build(); t0=d-1.15
    ins += ['-loop','1','-i',tab]
    ti=len(aff)
    dx=(1920-(tableau.RX+tableau.RW-tableau.BX))//2-tableau.BX   # on le recentre
    fc.append(f"[{ti}:v]format=rgba,fade=in:st={t0:.2f}:d=0.30:alpha=1[tab]")
    fc.append(f"[{prev}][tab]overlay=x={dx}:y=0:format=auto[tb]")
    txt=[]
    for i2 in range(len(TIERS)):
        l,fcol,bw,bc=tableau.lettre(i2); y=tableau.row_y(i2)
        open(f'intro/_l{i2}.txt','w').write(l)
        txt.append(f"drawtext=fontfile={SANS}:textfile=intro/_l{i2}.txt:expansion=none:"
                   f"fontcolor={fcol}:fontsize=76:borderw={bw}:bordercolor={bc}:"
                   f"x={tableau.BX+dx}+({tableau.LAB}-text_w)/2:"
                   f"y={y}+({tableau.RH}-text_h)/2-4:enable='gte(t,{t0+0.18:.2f})'")
    fc.append("[tb]"+",".join(txt)+"[v]")
    cmd=['ffmpeg','-y','-loglevel','error']+ins+['-filter_complex',";".join(fc),
        '-map','[v]','-t',str(d),'-r',str(FPS),
        '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out]
    subprocess.run(cmd,check=True)
    print("ok ->",out,f"({len(aff)} affiches)")

if __name__=='__main__':
    os.makedirs('intro',exist_ok=True)
    plan1('intro/plan-1.mp4')
    plan5('intro/plan-5.mp4')

# -*- coding: utf-8 -*-
# Plans 1 et 5 du cold open : fabriques en ffmpeg, pas en IA.
# Plan 1 = neuf barres qui s allument (le compte doit etre exact).
# Plan 5 = travelling sur les vraies affiches, puis le tableau.
import subprocess, os, glob
NAVY='0x071027'; FPS=25
MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
TIERS=[("S",'0xE6354F','0xFFFFFF'),("A",'0xF47025','0x0B0D10'),
       ("B",'0xF7B632','0x0B0D10'),("C",'0x72AB54','0x0B0D10'),
       ("D",'0x3A5DAD','0xFFFFFF'),("F",'0x7242AA','0xFFFFFF')]

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
    lab_w=104; rw=800; gap2=9; rh=112; bx=(1920-(104+800))//2
    ry=(1080-(6*rh+5*gap2))//2
    board=[]
    for i,(l,c,ink) in enumerate(TIERS):
        y=ry+i*(rh+gap2)
        board.append(f"drawbox=x={bx}:y={y}:w={lab_w}:h={rh}:color={c}@0.92:t=fill:enable='gte(t,{d-1.15:.2f})'")
        board.append(f"drawbox=x={bx+lab_w}:y={y}:w={rw}:h={rh}:color=0x101A2E@0.80:t=fill:enable='gte(t,{d-1.15:.2f})'")
        board.append(f"drawtext=fontfile={MONO}:text='{l}':fontcolor={ink}:fontsize=72:"
                     f"x={bx}+({lab_w}-text_w)/2:y={y}+({rh}-text_h)/2-5:enable='gte(t,{d-1.15:.2f})'")
    fc.append(f"[{prev}]"+",".join(board)+"[v]")
    cmd=['ffmpeg','-y','-loglevel','error']+ins+['-filter_complex',";".join(fc),
        '-map','[v]','-t',str(d),'-r',str(FPS),
        '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out]
    subprocess.run(cmd,check=True)
    print("ok ->",out,f"({len(aff)} affiches)")

if __name__=='__main__':
    os.makedirs('intro',exist_ok=True)
    plan1('intro/plan-1.mp4')
    plan5('intro/plan-5.mp4')

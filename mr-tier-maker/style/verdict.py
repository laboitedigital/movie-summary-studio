# -*- coding: utf-8 -*-
"""Carton VERDICT, style cartoon.

Fond de la chaine -> tableau (PNG a gros contours) -> lettres -> affiche qui
glisse -> surbrillance -> avatar detoure par-dessus, a pleine opacite.
"""
import subprocess, sys, tableau
SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
NAVY='0x071027'; KEY='0x050D23'; DIM='0xA8B4C8'
T=tableau.TIERS

def build(masc, poster, target, d, out, still=False):
    tab=tableau.build(); hl=tableau.highlight(target)
    BX,LAB,RX,RW,RH=tableau.BX,tableau.LAB,tableau.RX,tableau.RW,tableau.RH
    yT=tableau.row_y(target)
    ph=RH-22; pw=int(ph*496/755)
    col='0x'+T[target][1]
    xe=f"if(lt(t,2.4),1920,if(lt(t,3.05),1920-(1920-{RX+16})*(t-2.4)/0.65,{RX+16}))"
    # les lettres : grosse graisse, contour noir, comme le lettrage du logo
    txt=[f"drawtext=fontfile={SANS}:text='VERDICT':fontcolor={DIM}:fontsize=40:"
         f"borderw=6:bordercolor=black:x={BX}+(({RX+RW})-{BX}-text_w)/2:y=86:enable='gte(t,0.2)'"]
    for i,(l,c,ink) in enumerate(T):
        y=tableau.row_y(i)
        txt.append(f"drawtext=fontfile={SANS}:text='{l}':fontcolor=0x{ink}:fontsize=76:"
                   f"borderw=5:bordercolor=black:x={BX}+({LAB}-text_w)/2:"
                   f"y={y}+({RH}-text_h)/2-4:enable='gte(t,0.4)'")
    fc=(f"[1:v][3:v]overlay=x=0:y=0:enable='gte(t,0.4)'[bg0];"
        f"[bg0]{','.join(txt)}[bg];"
        f"[2:v]scale={pw}:{ph}[pv];"
        f"[bg][pv]overlay=x='{xe}':y={yT+11}:enable='gte(t,2.4)'[o];"
        f"[o]drawbox=x={RX}:y={yT}:w={RW}:h={RH}:color={col}@0.20:t=fill:enable='between(t,3.05,3.5)'[o2];"
        f"[o2][4:v]overlay=x=0:y=0:enable='gte(t,3.05)'[plateau];"
        f"[0:v]scale=1920:1080,format=rgba,colorkey={KEY}:0.030:0.012[av];"
        f"[plateau][av]overlay=x=0:y=0:format=auto[v]")
    cmd=['ffmpeg','-y','-loglevel','error']
    cmd+= (['-loop','1','-i',masc] if still else ['-i',masc])
    cmd+= ['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r=25:d={d}',
           '-loop','1','-i',poster,'-loop','1','-i',tab,'-loop','1','-i',hl,
           '-filter_complex',fc,'-map','[v]','-t',str(d),'-r','25',
           '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out]
    subprocess.run(cmd,check=True)
    print("ok ->",out)

if __name__=='__main__':
    m=sys.argv[1] if len(sys.argv)>1 else 'mascotte/reac-B.mp4'
    build(m,'posters/1986-the-transformers-the-movie.jpg',2,6.2,
          'motion/029-verdict-B-cartoon.mp4', still=m.endswith(('.jpg','.png')))

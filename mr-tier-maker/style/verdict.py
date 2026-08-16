# -*- coding: utf-8 -*-
"""Carton VERDICT, style cartoon, avec poussee de camera sur la rangee.

Ordre des calques :
  fond -> tableau -> lettres -> affiche qui glisse -> surbrillance
  -> POUSSEE DE CAMERA sur la rangee du verdict
  -> avatar detoure par-dessus, a pleine opacite et a l echelle 1

Le zoom ne porte que sur le plateau, pas sur l avatar. Zoomer l image entiere
le ferait grandir et sortir du cadre : on ne verrait plus qu un bout de son
epaule. Ici le tableau grandit derriere lui pendant qu il reste pose.
"""
import subprocess, sys, tableau
SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
NAVY='0x071027'; KEY='0x050D23'; DIM='0xA8B4C8'
T=tableau.TIERS
FPS=25

def _zoom(row, zmax, t_in, mont, tenue, desc, sur=4):
    """Expressions zoompan. Le centre est cale pour que la pastille du tier
    reste a droite de l avatar (qui occupe les 880 premiers pixels)."""
    cx=min(tableau.BX+60/zmax, tableau.BX+60)      # ~820 : la pastille reste visible
    cy=tableau.row_y(row)+tableau.RH/2
    a=t_in; b=a+mont; c=b+tenue; e=c+desc
    Tt="(on/%d)"%FPS
    u1=f"min(1,max(0,({Tt}-{a})/{mont}))"; u2=f"min(1,max(0,({Tt}-{c})/{desc}))"
    E1=f"(1-pow(1-{u1},3))"; E2=f"(1-pow(1-{u2},3))"
    z=(f"if(lt({Tt},{a}),1,if(lt({Tt},{b}),1+({zmax}-1)*{E1},"
       f"if(lt({Tt},{c}),{zmax},if(lt({Tt},{e}),{zmax}-({zmax}-1)*{E2},1))))")
    x=f"min(max({cx*sur}-(iw/zoom)/2,0),iw-iw/zoom)"
    y=f"min(max({cy*sur}-(ih/zoom)/2,0),ih-ih/zoom)"
    return (f"scale={1920*sur}:{1080*sur}:flags=neighbor,"
            f"zoompan=z='{z}':x='{x}':y='{y}':d=1:s=1920x1080:fps={FPS}")

def build(masc, poster, target, d, out, still=False,
          zoom=True, zmax=2.2, t_in=3.5, mont=0.7, tenue=1.5, desc=0.7):
    tab=tableau.build(); hl=tableau.highlight(target)
    BX,LAB,RX,RW,RH=tableau.BX,tableau.LAB,tableau.RX,tableau.RW,tableau.RH
    yT=tableau.row_y(target)
    ph=RH-22; pw=int(ph*496/755)
    col='0x'+T[target][1]
    xe=f"if(lt(t,2.4),1920,if(lt(t,3.05),1920-(1920-{RX+16})*(t-2.4)/0.65,{RX+16}))"
    txt=[f"drawtext=fontfile={SANS}:text='VERDICT':fontcolor={DIM}:fontsize=40:"
         f"borderw=6:bordercolor=black:x={BX}+(({RX+RW})-{BX}-text_w)/2:y=86:enable='gte(t,0.2)'"]
    for i in range(len(T)):
        l,fc_,bw,bc=tableau.lettre(i); y=tableau.row_y(i)
        txt.append(f"drawtext=fontfile={SANS}:text='{l}':fontcolor={fc_}:fontsize=76:"
                   f"borderw={bw}:bordercolor={bc}:x={BX}+({LAB}-text_w)/2:"
                   f"y={y}+({RH}-text_h)/2-4:enable='gte(t,0.4)'")
    zf=(","+_zoom(target,zmax,t_in,mont,tenue,desc)) if zoom else ""
    fc=(f"[1:v]vignette=a=PI/4.2[bgv];"
        f"[bgv][3:v]overlay=x=0:y=0:enable='gte(t,0.4)'[bg0];"
        f"[bg0]{','.join(txt)}[bg];"
        f"[2:v]scale={pw}:{ph}[pv];"
        f"[bg][pv]overlay=x='{xe}':y={yT+11}:enable='gte(t,2.4)'[o];"
        f"[o]drawbox=x={RX}:y={yT}:w={RW}:h={RH}:color={col}@0.20:t=fill:enable='between(t,3.05,3.5)'[o2];"
        f"[o2][4:v]overlay=x=0:y=0:enable='gte(t,3.05)'[plat];"
        f"[plat]setpts=PTS-STARTPTS{zf}[plateau];"
        f"[0:v]scale=1920:1080,format=rgba,colorkey={KEY}:0.030:0.012[av];"
        f"[plateau][av]overlay=x=0:y=0:format=auto:repeatlast=1,"
        f"noise=alls=5:allf=t+u[v]")   # casse le banding du degrade sombre
    cmd=['ffmpeg','-y','-loglevel','error']
    cmd+= (['-loop','1','-i',masc] if still else ['-i',masc])
    cmd+= ['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}',
           '-loop','1','-i',poster,'-loop','1','-i',tab,'-loop','1','-i',hl,
           '-filter_complex',fc,'-map','[v]','-t',str(d),'-r',str(FPS),
           '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out]
    subprocess.run(cmd,check=True)
    print("ok ->",out)

if __name__=='__main__':
    m=sys.argv[1] if len(sys.argv)>1 else 'mascotte/reac-B.mp4'
    build(m,'posters/1986-the-transformers-the-movie.jpg',2,6.4,
          'motion/029-verdict-B-cartoon.mp4', still=m.endswith(('.jpg','.png')))

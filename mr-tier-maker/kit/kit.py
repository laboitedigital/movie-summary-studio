# -*- coding: utf-8 -*-
"""Kit de motion design MR TierMaker, style cartoon.

Six elements recurrents d un episode. Meme vocabulaire partout : coins
arrondis, contour noir epais, ombre dure, arrivee sec avec un leger
depassement puis calage.

Tout le texte passe par `textfile=` + `expansion=none`. C est le seul moyen
fiable : en `text='...'`, drawtext casse sur l apostrophe, sur les deux-points,
et un simple `%` fait sortir une image vide (verifie sur ce build).
"""
import subprocess, os, cartoon, tableau
NAVY='0x071027'
SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FPS=25
os.makedirs('kit',exist_ok=True)
_n=[0]

def dt(text, size, color, x, y, borderw=5, enable=None):
    _n[0]+=1; p=f'kit/_t{_n[0]}.txt'
    open(p,'w',encoding='utf-8').write(text)
    s=(f"drawtext=fontfile={SANS}:textfile={p}:expansion=none:fontcolor={color}:"
       f"fontsize={size}:x={x}:y={y}")
    if borderw: s+=f":borderw={borderw}:bordercolor=black"
    if enable: s+=f":enable='{enable}'"
    return s

_cache={}
def largeur(text,size):
    """Largeur reelle du texte : on le rend une fois et on mesure l encre.

    Une estimation au nombre de caracteres se trompait de 15 % sur les titres
    en capitales, et le texte debordait de sa pastille."""
    k=(text,size)
    if k in _cache: return _cache[k]
    _n[0]+=1; f=f'kit/_m{_n[0]}.txt'
    open(f,'w',encoding='utf-8').write(text)
    W=3600; H=int(size*2.2)//2*2
    r=subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i',f'color=c=black:s={W}x{H}:d=0.04',
        '-vf',f'drawtext=fontfile={SANS}:textfile={f}:expansion=none:fontcolor=white:'
              f'fontsize={size}:x=0:y=0,format=gray','-frames:v','1','-f','rawvideo','-'],
        capture_output=True)
    d=r.stdout; w=0
    for y in range(H):
        row=d[y*W:(y+1)*W]
        x=W-1
        while x>w and row[x]<24: x-=1
        if x>w: w=x
    _cache[k]=w+1
    return w+1

def ease(x0,x1,t0,dur,over=18):
    """Glisse de x0 a x1 : arrivee rapide, depassement, retour."""
    t1=t0+dur*0.72; t2=t0+dur
    return (f"if(lt(t,{t0}),{x0},"
            f"if(lt(t,{t1}),{x0}+({x1}-{x0}+{over})*(t-{t0})/{t1-t0},"
            f"if(lt(t,{t2}),{x1}+{over}-{over}*(t-{t1})/{t2-t1},{x1})))")

def run(fc, inputs, out, d):
    cmd=['ffmpeg','-y','-loglevel','error']+inputs+['-filter_complex',fc,
         '-map','[v]','-t',str(d),'-r',str(FPS),'-c:v','libx264','-preset','veryfast',
         '-crf','18','-pix_fmt','yuv420p','-an',out]
    subprocess.run(cmd,check=True); print("ok ->",out)

# ---------------------------------------------------------------- 1. carton titre
def carton_titre(titre,annee,out,d=3.4):
    fs=92
    while largeur(titre,fs)+120>1680 and fs>52: fs-=4
    pw=min(1680,largeur(titre,fs)+120)
    aw=largeur(annee,56)+120
    c=cartoon.Canvas(1920,1080)
    c.rrect(160,404,pw,190,'F7B632',r=34,stroke=10,shadow=(0,14))
    c.rrect(160,614,aw,104,'16233F',r=26,stroke=8,shadow=(0,12))
    c.save('kit/_titre.png')
    x=ease(-1750,0,0.10,0.55); x2=ease(-1750,0,0.28,0.55)
    fc=(f"color=c={NAVY}:s=1920x1080:r={FPS}[bg];"
        f"[1:v]crop=1920:210:0:396[p1];[1:v]crop=1920:130:0:606[p2];"
        f"[bg][p1]overlay=x='{x}':y=396[a];"
        f"[a][p2]overlay=x='{x2}':y=606[b];"
        f"[b]"+dt(titre,fs,'0x0B0D10',f"'220+({x})'",int(404+(190-fs*1.0)/2),borderw=0)+","
        +dt(annee,56,'0xF7B632',f"'218+({x2})'",638)+"[v]")
    run(fc,['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}',
            '-loop','1','-i','kit/_titre.png'],out,d)

# ------------------------------------------------------- 2. etiquette sur un extrait
def etiquette(clip,texte,out,d=4.0):
    w=largeur(texte,54)+90
    c=cartoon.Canvas(1920,1080); c.rrect(0,0,w,110,'E6354F',r=26,stroke=8,shadow=(0,12))
    c.save('kit/_etiq.png')
    x=ease(-900,70,0.35,0.5)
    fc=(f"[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1[c];"
        f"[c][1:v]overlay=x='{x}':y=880:shortest=1[a];"
        f"[a]"+dt(texte,54,'white',f"'115+({x})'",908)+"[v]")
    run(fc,['-i',clip,'-loop','1','-i','kit/_etiq.png'],out,d)

# ------------------------------------------------------------- 3. pour / contre
def pour_contre(pour,contre,out,d=4.2):
    wa=largeur('+  '+pour,58)+120; wb=largeur('-  '+contre,58)+120  # 60 px de marge de chaque cote
    for n,(w,col) in enumerate([(wa,'72AB54'),(wb,'E6354F')]):
        c=cartoon.Canvas(1920,1080); c.rrect(0,0,w,140,col,r=32,stroke=9,shadow=(0,12))
        c.save(f'kit/_pc{n}.png')
    xa=ease(-1500,240,0.25,0.5); xb=ease(-1500,240,0.95,0.5)
    fc=(f"color=c={NAVY}:s=1920x1080:r={FPS}[bg];"
        f"[1:v]crop=1800:160:0:0[p];[2:v]crop=1800:160:0:0[q];"
        f"[bg][p]overlay=x='{xa}':y=380[a];"
        f"[a][q]overlay=x='{xb}':y=580[b];"
        f"[b]"+dt('+  '+pour,58,'0x0B0D10',f"'60+({xa})'",416,borderw=0)+","
        +dt('-  '+contre,58,'white',f"'60+({xb})'",616,borderw=4)+"[v]")
    run(fc,['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}',
            '-loop','1','-i','kit/_pc0.png','-loop','1','-i','kit/_pc1.png'],out,d)

# --------------------------------------------------------------- 4. chiffre cle
def chiffre(valeur,label,out,d=3.6,suffixe=''):
    c=cartoon.Canvas(1920,1080); c.rrect(510,360,900,300,'3A5DAD',r=40,stroke=11,shadow=(0,16))
    c.save('kit/_chiffre.png')
    N=22; t0=0.45; dtp=0.055; steps=[]
    for i in range(N+1):
        v=round(valeur*(i/N)**0.75)
        a=t0+i*dtp; b=a+dtp if i<N else d
        txt=f"{v}{suffixe}"
        steps.append(dt(txt,140,'white','(w-text_w)/2',396,borderw=7,
                        enable=f"between(t,{a:.3f},{b:.3f})"))
    steps.append(dt(label,44,'0xA8B4C8','(w-text_w)/2',560,enable=f"gte(t,{t0})"))
    fc=(f"color=c={NAVY}:s=1920x1080:r={FPS}[bg];"
        f"[bg][1:v]overlay=x=0:y=0:enable='gte(t,0.25)'[a];"
        f"[a]{','.join(steps)}[v]")
    run(fc,['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}',
            '-loop','1','-i','kit/_chiffre.png'],out,d)

# ---------------------------------------------------------------- 5. transition
def transition(out,d=1.2):
    cols=[t[1] for t in tableau.TIERS]; bh=1080//len(cols); f=[]
    for i,col in enumerate(cols):
        t0=0.05*i; t1=t0+0.42
        x=f"if(lt(t,{t0}),-1920,if(lt(t,{t1}),-1920+1920*(t-{t0})/{t1-t0},0))"
        f.append(f"drawbox=x='{x}':y={i*bh}:w=1920:h={bh+1}:color=0x{col}:t=fill")
    for i,col in enumerate(cols):
        t0=0.62+0.05*i; t1=t0+0.40
        x=f"if(lt(t,{t0}),1921,if(lt(t,{t1}),1920*(t-{t0})/{t1-t0},1920))"
        f.append(f"drawbox=x='{x}':y={i*bh}:w=1920:h={bh+1}:color={NAVY}:t=fill")
    run(f"color=c={NAVY}:s=1920x1080:r={FPS}[bg];[bg]{','.join(f)}[v]",
        ['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}'],out,d)

# ------------------------------------------------------------ 6. rappel du tableau
def rappel(place,out,d=4.6):
    """place : {index de rangee : [chemins d affiches]}"""
    tab=tableau.build()
    ins=['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}','-loop','1','-i',tab]
    fc=["[0:v][1:v]overlay=x=0:y=0[b0]"]
    prev='b0'; k=2; n=0
    ph=tableau.RH-14; pw=int(ph*496/755)
    for row,affs in sorted(place.items()):
        for j,a in enumerate(affs):
            ins+=['-loop','1','-i',a]
            y=tableau.row_y(row)+7; x=tableau.RX+14+j*(pw+12)
            t0=0.5+0.16*n
            fc.append(f"[{k}:v]scale={pw}:{ph}[a{k}]")
            fc.append(f"[{prev}][a{k}]overlay=x={x}:y='if(lt(t,{t0}),1200,{y})':shortest=1[b{k}]")
            prev=f"b{k}"; k+=1; n+=1
    txt=[dt(l,76,'0x'+ink,f"{tableau.BX}+({tableau.LAB}-text_w)/2",
            f"{tableau.row_y(i)}+({tableau.RH}-text_h)/2-4")
         for i,(l,c,ink) in enumerate(tableau.TIERS)]
    fc.append(f"[{prev}]"+",".join(txt)+"[v]")
    run(";".join(fc),ins,out,d)

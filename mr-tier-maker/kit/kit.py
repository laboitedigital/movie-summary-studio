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

def dt(text, size, color, x, y, borderw=5, enable=None, bordercolor='black'):
    _n[0]+=1; p=f'kit/_t{_n[0]}.txt'
    open(p,'w',encoding='utf-8').write(text)
    s=(f"drawtext=fontfile={SANS}:textfile={p}:expansion=none:fontcolor={color}:"
       f"fontsize={size}:x={x}:y={y}")
    if borderw: s+=f":borderw={borderw}:bordercolor={bordercolor}"
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

def ease(x0,x1,t0,dur,over=1.70158):
    """Glisse de x0 a x1 en easeOutBack : demarre vite, depasse, revient.

    Vraie courbe cubique, pas deux segments droits : c est ce qui distingue un
    mouvement mecanique d un mouvement qui a du poids."""
    u=f"min(1,max(0,(t-{t0})/{dur}))"
    c1=over; c3=over+1
    e=f"(1+{c3}*pow({u}-1,3)+{c1}*pow({u}-1,2))"
    return f"if(lt(t,{t0}),{x0},{x0}+({x1}-{x0})*{e})"

def pop(dur=0.34, w=None, h=None, fps=FPS, path=None, t0=0.0):
    """Fichier sendcmd pour un rebond d echelle 0 -> 105 % -> 100 %."""
    _n[0]+=1; path=path or f'kit/_pop{_n[0]}.txt'
    n=max(2,int(dur*fps)); lines=[]
    c1,c3=1.9,2.9
    for i in range(n+1):
        u=i/n
        e=1+c3*(u-1)**3+c1*(u-1)**2
        k=max(0.02,e)
        lines.append(f"{t0+i/fps:.3f} scale w {max(2,int(w*k))}, scale h {max(2,int(h*k))};")
    open(path,'w').write("\n".join(lines)+"\n")
    return path

def run(fc, inputs, out, d, grain=True):
    # Grain tres leger : sur un fond bleu nuit, H.264 fait apparaitre des
    # cercles concentriques (banding). Un peu de bruit temporel les dissout.
    if grain: fc=fc+";[v]noise=alls=5:allf=t+u[vg]"
    cmd=['ffmpeg','-y','-loglevel','error']+inputs+['-filter_complex',fc,
         '-map','[vg]' if grain else '[v]','-t',str(d),'-r',str(FPS),'-c:v','libx264','-preset','veryfast',
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
    fc=(f"color=c={NAVY}:s=1920x1080:r={FPS},vignette=a=PI/4.2[bg];"
        f"[1:v]crop=1920:210:0:396[p1];[1:v]crop=1920:130:0:606[p2];"
        f"[bg][p1]overlay=x='{x}':y=396[a];"
        f"[a][p2]overlay=x='{x2}':y=606[b];"
        f"[b]"+dt(titre,fs,'0x0B0D10',f"'220+({x})'","404+(190-text_h)/2",borderw=0)+","
        +dt(annee,56,'0xF7B632',f"'218+({x2})'","606+(104-text_h)/2")+"[v]")
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
        f"[a]"+dt(texte,54,'white',f"'115+({x})'","880+(110-text_h)/2")+"[v]")
    run(fc,['-i',clip,'-loop','1','-i','kit/_etiq.png'],out,d)

# ------------------------------------------------------------- 3. pour / contre
def pour_contre(pour,contre,out,d=4.2):
    wa=largeur('+  '+pour,58)+120; wb=largeur('-  '+contre,58)+120  # 60 px de marge de chaque cote
    for n,(w,col) in enumerate([(wa,'72AB54'),(wb,'E6354F')]):
        c=cartoon.Canvas(1920,1080); c.rrect(0,0,w,140,col,r=32,stroke=9,shadow=(0,12))
        c.save(f'kit/_pc{n}.png')
    xa=ease(-1500,240,0.25,0.5); xb=ease(-1500,240,0.95,0.5)
    fc=(f"color=c={NAVY}:s=1920x1080:r={FPS},vignette=a=PI/4.2[bg];"
        f"[1:v]crop=1800:160:0:0[p];[2:v]crop=1800:160:0:0[q];"
        f"[bg][p]overlay=x='{xa}':y=380[a];"
        f"[a][q]overlay=x='{xb}':y=580[b];"
        f"[b]"+dt('+  '+pour,58,'0x0B0D10',f"'60+({xa})'","380+(140-text_h)/2",borderw=0)+","
        +dt('-  '+contre,58,'white',f"'60+({xb})'","580+(140-text_h)/2",borderw=4)+"[v]")
    run(fc,['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}',
            '-loop','1','-i','kit/_pc0.png','-loop','1','-i','kit/_pc1.png'],out,d)

# --------------------------------------------------------------- 4. chiffre cle
def chiffre(valeur,label,out,d=4.0,suffixe='',maxi=100,couleur='F7B632'):
    """Jauge circulaire + compteur. Plutot qu un logo Rotten Tomatoes ou
    Metacritic : ce sont des marques deposees, une jauge ne l est pas."""
    PW=560; PX=(1920-PW)//2; PY=(1080-PW)//2
    CX=1920//2; CY=PY+250; RO=170; RI=138
    N=22; t0=0.55; dtp=0.055
    base=cartoon.Canvas(1920,1080)
    base.rrect(PX,PY,PW,PW,'16233F',r=48,stroke=11,shadow=(0,16))
    base.arc(CX,CY,RO,RI,1.0,'0E1830')
    base.save('kit/_ch_base.png')
    for i in range(N+1):
        v=(i/N)**0.75
        c=cartoon.Canvas(1920,1080)
        c.arc(CX,CY,RO,RI,v*valeur/maxi,couleur)
        c.save(f'kit/_ch_a{i}.png')
    cmd=pop(0.36,PW+40,PW+40,t0=0.18)
    steps=[]
    for i in range(N+1):
        a=t0+i*dtp; b=a+dtp if i<N else d
        steps.append(dt(f"{round(valeur*(i/N)**0.75)}{suffixe}",96,'white',
                        '(w-text_w)/2',f"{CY}-text_h/2",borderw=6,
                        enable=f"between(t,{a:.3f},{b:.3f})"))
    steps.append(dt(label,44,'0xA8B4C8','(w-text_w)/2',f"{PY+PW}-120-text_h/2",
                    enable=f"gte(t,{t0})"))
    ins=['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d={d}',
         '-loop','1','-i','kit/_ch_base.png']
    fc=[f"[0:v]vignette=a=PI/4.2[bgv]",
        f"[1:v]crop={PW+40}:{PW+40}:{PX-20}:{PY-20},format=rgba,sendcmd=f={cmd},"
        f"scale={PW+40}:{PW+40}:eval=frame[e]",
        f"[bgv][e]overlay=x='(main_w-overlay_w)/2':y='{PY+PW//2+20}-overlay_h/2':"
        f"enable='gte(t,0.18)'[a0]"]
    prev='a0'
    for i in range(N+1):
        ins+=['-loop','1','-i',f'kit/_ch_a{i}.png']
        a=t0+i*dtp; b=a+dtp if i<N else d
        fc.append(f"[{prev}][{i+2}:v]overlay=x=0:y=0:enable='between(t,{a:.3f},{b:.3f})'[a{i+1}]")
        prev=f"a{i+1}"
    fc.append(f"[{prev}]{','.join(steps)}[v]")
    run(";".join(fc),ins,out,d)

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
    run(f"color=c={NAVY}:s=1920x1080:r={FPS},vignette=a=PI/4.2[bg];[bg]{','.join(f)}[v]",
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
    txt=[]
    for i in range(len(tableau.TIERS)):
        l,fcol,bw,bc=tableau.lettre(i)
        txt.append(dt(l,76,fcol,f"{tableau.BX}+({tableau.LAB}-text_w)/2",
                      f"{tableau.row_y(i)}+({tableau.RH}-text_h)/2-4",
                      borderw=bw,bordercolor=bc))
    fc.append(f"[{prev}]"+",".join(txt)+"[v]")
    run(";".join(fc),ins,out,d)

# --------------------------------------------- 7. zoom dynamique sur une rangee
def zoom_rangee(src, row, out, d=None, zmax=2.8, a=0.8, mont=0.8, tenue=2.2, desc=0.8,
                cx=None, sur=4):
    """Pousse la camera dans une rangee du tableau, tient, puis ressort.

    Les affiches font 63 px de large dans le tableau : illisibles sur un
    telephone. Plutot que d agrandir les rangees — ce qui ferait perdre la vue
    d ensemble — on zoome sur celle dont on parle au moment ou on en parle.

    zoompan tronque x et y a l entier, ce qui fait vibrer l image. On sur-echantillonne
    donc l entree (x{sur}) pour que la troncature devienne sous-pixellique.
    """
    import tableau
    if d is None: d=a+mont+tenue+desc+0.6
    W,H=1920,1080; IW,IH=W*sur,H*sur
    cy=(tableau.row_y(row)+tableau.RH/2)*sur
    # cadrage horizontal : on garde la pastille du tier dans le champ,
    # sinon on ne sait plus de quelle rangee il s agit
    if cx is None: cx=tableau.BX-24+(1920/zmax)/2
    cx=cx*sur
    b=a+mont; c=b+tenue; e=c+desc
    T="(on/25)"
    u1=f"min(1,max(0,({T}-{a})/{mont}))"
    u2=f"min(1,max(0,({T}-{c})/{desc}))"
    E1=f"(1-pow(1-{u1},3))"; E2=f"(1-pow(1-{u2},3))"
    z=(f"if(lt({T},{a}),1,"
       f"if(lt({T},{b}),1+({zmax}-1)*{E1},"
       f"if(lt({T},{c}),{zmax},"
       f"if(lt({T},{e}),{zmax}-({zmax}-1)*{E2},1))))")
    x=f"min(max({cx}-(iw/zoom)/2,0),iw-iw/zoom)"
    y=f"min(max({cy}-(ih/zoom)/2,0),ih-ih/zoom)"
    fc=(f"[0:v]scale={IW}:{IH}:flags=neighbor,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d=1:s={W}x{H}:fps={FPS}[v]")
    run(fc,['-i',src],out,d)

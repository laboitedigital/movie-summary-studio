# -*- coding: utf-8 -*-
"""Montage complet de l episode, les 159 plans.

build3.py ne montait que les 2 min 39 du debut, avec une recette ecrite plan
par plan a la main. A 159 plans ce n est plus tenable : la recette est deduite
du plan de montage, famille par famille.

Ce qui ne change pas :
  - un plan par phrase du SRT, coupe A LA FRAME sur la borne du plan suivant ;
  - tout en 60 fps, extraits compris (24/25 fps a l origine, conformes par
    duplication) — sinon un overlay 60 fps pose sur un extrait 25 fps est
    tronque a 42 % de sa duree ;
  - Remotion ne touche aucune video : Chromium ne decode pas le ProRes. Il sort
    des overlays alpha, ffmpeg fait le reste.

Ce qui n a pas de matiere sort en carton Placeholder, VISIBLE, avec le numero
du plan et ce qui manque. Un montage complet dont on voit les trous vaut mieux
qu un montage court dont on ne voit rien.
"""
import subprocess, os, json, re, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shots

FPS=60; W,H=1920,1080
ICI  = os.path.dirname(os.path.abspath(__file__))
EP   = os.path.dirname(ICI)
KIT  = os.path.join(os.path.dirname(EP), 'kit-v2')
NAVY='0x071027'; KEY='0x050D23'
OUT  = os.environ.get('OUT', os.path.join(ICI, 'montage'))
CLIPS= os.path.join(ICI, 'clips')
IMG  = os.path.join(EP, 'images')
MASC = os.path.join(os.path.dirname(EP), 'mascotte')
INTRO= os.path.join(os.path.dirname(EP), 'intro')
VOIX = os.path.join(EP, 'voix', 'voix-complete.mp3')

PLAN = {x['n']: x for x in json.load(open(os.path.join(EP,'plan-episode-01.json'),
                                          encoding='utf-8'))}
S    = {x['n']: x for x in shots.load()}
TIERS=["S","A","B","C","D","F"]

# (rangee, titre, annee, slug d affiche, plan de verdict) — meme table que plan.py
FILMS=[
 (2,"THE TRANSFORMERS: THE MOVIE","1986","1986-the-transformers-the-movie",29),
 (1,"TRANSFORMERS","2007","2007-transformers",46),
 (4,"REVENGE OF THE FALLEN","2009","2009-revenge-of-the-fallen",63),
 (1,"DARK OF THE MOON","2011","2011-dark-of-the-moon",79),
 (4,"AGE OF EXTINCTION","2014","2014-age-of-extinction",93),
 (4,"THE LAST KNIGHT","2017","2017-the-last-knight",106),
 (0,"BUMBLEBEE","2018","2018-bumblebee",122),
 # segment 7 = Rise of the Beasts, verdict B ; segment 8 = Transformers One,
 # verdict A. Les deux etaient inverses : leur affiche partait dans la mauvaise
 # rangee et leur carton titre au mauvais segment.
 (2,"RISE OF THE BEASTS","2023","2023-rise-of-the-beasts",134),
 (1,"TRANSFORMERS ONE","2024","2024-transformers-one",149),
]

os.makedirs(OUT, exist_ok=True); os.makedirs(OUT+'/el', exist_ok=True)
manquants=[]

def sh(*a, **k): subprocess.run(list(a), check=True, **k)

def nb_frames(f):
    r=subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v:0',
        '-show_entries','stream=nb_read_frames','-of','csv=p=0',f],
        capture_output=True,text=True).stdout.strip()
    return int(r or 0)

def remo(comp, out, props=None, alpha=False):
    """Rend une composition Remotion. Cache : on ne refait pas ce qui existe."""
    if os.path.exists(out): return out
    cmd=['npx','--no-install','remotion','render','src/index.ts',comp,os.path.abspath(out)]
    if alpha: cmd+=['--codec=prores','--prores-profile=4444','--pixel-format=yuva444p10le','--image-format=png']
    else:     cmd+=['--codec=h264','--crf=16']
    if props: cmd+=['--props='+json.dumps(props,ensure_ascii=False)]
    sh(*cmd, cwd=KIT, stdout=subprocess.DEVNULL)
    return out

def frames(n):
    """Duree du plan n, en frames a 60 ips, calee sur le debut du suivant."""
    a=S[n]['a']; b=S[n+1]['a'] if (n+1) in S else S[n]['b']
    return round(b*FPS)-round(a*FPS)

def cut(src, nfr, out, extra=''):
    """Amene n importe quelle source a 1920x1080@60 et exactement nfr frames.
    Les sources trop courtes sont gelees sur leur derniere image."""
    vf=(f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
        f"setsar=1,fps={FPS}"+(','+extra if extra else ''))
    sh('ffmpeg','-y','-loglevel','error','-i',src,'-vf',vf,'-frames:v',str(nfr),
       '-fps_mode','cfr','-r',str(FPS),'-c:v','libx264','-preset','veryfast','-crf','17',
       '-pix_fmt','yuv420p','-an',out)
    got=nb_frames(out)
    if got<nfr:
        tmp=out+'.pad.mp4'
        sh('ffmpeg','-y','-loglevel','error','-i',out,'-vf',
           f"tpad=stop_mode=clone:stop_duration={(nfr-got)/FPS+0.2}",'-frames:v',str(nfr),
           '-r',str(FPS),'-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p',tmp)
        os.replace(tmp,out)
    return out

def poster(slug):
    return os.path.join(KIT,'public','posters',slug+'.jpg')

def assure_affiche(slug, titre, annee):
    """Fabrique une affiche de remplacement si la vraie manque.

    Sans ca une seule affiche absente fait tomber TOUT le tableau : le
    BoardRecap charge les neuf, et Remotion annule le rendu des qu une image
    rend 404. L affiche de Rise of the Beasts manquait, et avec elle les douze
    rappels de tableau de la fin plus les deux derniers cartons verdict.

    Le remplacement est volontairement moche : fond de chaine, titre, et
    AFFICHE A FOURNIR en toutes lettres. On doit le voir au montage.
    """
    f=poster(slug)
    if os.path.exists(f): return f
    manquants.append((0, 'affiche %s.jpg absente, carton de remplacement'%slug))
    os.makedirs(os.path.dirname(f), exist_ok=True)
    # drawtext casse sur l apostrophe et les deux-points meme entre quotes,
    # et un % sort une image vide : on passe par textfile
    t1=f+'.t1.txt'; t2=f+'.t2.txt'
    open(t1,'w',encoding='utf-8').write(titre.replace(':',' ')+"\n"+str(annee))
    open(t2,'w',encoding='utf-8').write("AFFICHE A FOURNIR")
    FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    sh('ffmpeg','-y','-loglevel','error','-f','lavfi','-i','color=c=0x0D1730:s=600x900',
       '-vf',(f"drawbox=x=14:y=14:w=572:h=872:color=0x2A3757:t=6,"
              f"drawtext=fontfile={FONT}:textfile={t1}:expansion=none:fontcolor=white:"
              f"fontsize=44:line_spacing=18:x=(w-text_w)/2:y=(h-text_h)/2-40,"
              f"drawtext=fontfile={FONT}:textfile={t2}:expansion=none:fontcolor=0xF7B632:"
              f"fontsize=26:x=(w-text_w)/2:y=h-120"),
       '-frames:v','1',f)
    os.remove(t1); os.remove(t2)
    return f

def rows_avant(n):
    """L etat du tableau juste avant le plan n : les films deja juges."""
    r={t:[] for t in TIERS}
    for tier,titre,annee,slug,pv in FILMS:
        if pv < n: r[TIERS[tier]].append('posters/'+slug+'.jpg')
    return [{"tier":t,"posters":r[t]} for t in TIERS]

def film_de(n):
    seg=PLAN[n]['seg']
    return FILMS[seg] if 0 <= seg < len(FILMS) else None

# ---------------------------------------------------------------- les familles

def f_extrait(n, nfr, out):
    src=os.path.join(CLIPS, '%03d.mp4'%n)
    if not os.path.exists(src):
        return trou(n, nfr, out, 'extrait %03d.mp4 absent'%n)
    f=film_de(n)
    premier = bool(f) and not any(PLAN[m]['famille']=='extrait' and PLAN[m]['seg']==PLAN[n]['seg']
                                  for m in range(1,n))
    if premier:
        lt=remo('LowerThird', f'{OUT}/el/lt-{f[3]}.mov',
                {"label":f[1],"year":int(f[2]),"tier":TIERS[f[0]]}, alpha=True)
        tmp=out+'.base.mp4'; cut(src,nfr,tmp)
        # PAS de shortest=1 : il tronquerait l extrait a la duree du bandeau
        sh('ffmpeg','-y','-loglevel','error','-i',tmp,'-i',os.path.abspath(lt),
           '-filter_complex','[0:v][1:v]overlay=0:0:format=auto:repeatlast=1',
           '-frames:v',str(nfr),'-r',str(FPS),'-c:v','libx264','-preset','veryfast',
           '-crf','17','-pix_fmt','yuv420p','-an',out)
        os.remove(tmp); return out
    return cut(src,nfr,out)

def f_verdict(n, nfr, out):
    f=next((x for x in FILMS if x[4]==n), None)
    if not f: return trou(n, nfr, out, 'aucun film ne porte le verdict du plan %d'%n)
    tier=TIERS[f[0]]; rows=rows_avant(n)
    slot=len(next(r for r in rows if r['tier']==tier)['posters'])
    vc=remo('VerdictCard', f'{OUT}/el/verdict-{f[3]}.mov',
            {"rows":rows,"poster":'posters/'+f[3]+'.jpg',"tier":tier,
             "slotIndex":slot,"offsetX":260,"zoom":2.0}, alpha=True)
    reac=next((c for c in (os.path.join(MASC,'reactions','reaction-%s.mp4'%tier),
                           os.path.join(MASC,'reactions','reac-%s.mp4'%tier),
                           os.path.join(MASC,'reac-%s.mp4'%tier))
               if os.path.exists(c)), None)
    if reac:
        ins=['-i',reac]
        fc=(f'[0:v][1:v]overlay=0:0:format=auto[a];'
            f'[2:v]scale={W}:{H},fps={FPS},format=rgba,colorkey={KEY}:0.030:0.012[m];'
            f'[a][m]overlay=0:0:format=auto:repeatlast=1[v]')
    else:
        # sans mascotte le carton reste lisible, mais c est une perte : on le dit
        manquants.append((n, 'reaction-%s.mp4 introuvable, verdict sans mascotte'%tier))
        ins=[]; fc='[0:v][1:v]overlay=0:0:format=auto[v]'
    sh('ffmpeg','-y','-loglevel','error','-f','lavfi','-i',f'color=c={NAVY}:s={W}x{H}:r={FPS}',
       '-i',os.path.abspath(vc),*ins,'-filter_complex',fc,'-map','[v]','-frames:v',str(nfr),
       '-r',str(FPS),'-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-an',out)
    return out

def f_carton_titre(n, nfr, out):
    f=film_de(n)
    if not f: return f_citation(n, nfr, out)
    src=remo('TitleCard', f'{OUT}/el/titre-{f[3]}.mp4',
             {"title":f[1],"year":int(f[2]),"tier":TIERS[f[0]]})
    return cut(os.path.abspath(src), nfr, out)

def ken_burns(src, nfr, out, zmax=1.12):
    # sur-echantillonnage x4 avant le zoom : zoompan tronque x et y a l entier,
    # ce qui fait vibrer l image
    sh('ffmpeg','-y','-loglevel','error','-loop','1','-i',src,'-vf',
       f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
       f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:{NAVY},scale={W*4}:-2,"
       f"zoompan=z='min(zoom+0.0005,{zmax})':d={nfr}:s={W}x{H}:fps={FPS}",
       '-frames:v',str(nfr),'-r',str(FPS),'-c:v','libx264','-preset','veryfast',
       '-crf','17','-pix_fmt','yuv420p',out)
    return out

def f_affiche(n, nfr, out):
    f=film_de(n)
    aff=poster(f[3]) if f else None
    if not aff or not os.path.exists(aff):
        return trou(n, nfr, out, 'affiche absente')
    ken_burns(aff, nfr, out, 1.15)
    lt=remo('LowerThird', f'{OUT}/el/lt-realisateur.mov',
            {"label":"MICHAEL BAY","year":int(f[2]),"tier":TIERS[f[0]]}, alpha=True)
    tmp=out+'.lt.mp4'
    sh('ffmpeg','-y','-loglevel','error','-i',out,'-i',os.path.abspath(lt),
       '-filter_complex','[0:v][1:v]overlay=0:0:format=auto:repeatlast=1',
       '-frames:v',str(nfr),'-r',str(FPS),'-c:v','libx264','-preset','veryfast',
       '-crf','17','-pix_fmt','yuv420p','-an',tmp)
    os.replace(tmp,out); return out

def f_photo(n, nfr, out):
    trouve=sorted(glob.glob(os.path.join(IMG,'%03d-*'%n)))
    if not trouve:
        return trou(n, nfr, out, PLAN[n]['note'][:60])
    return ken_burns(trouve[0], nfr, out)

def f_rappel(n, nfr, out):
    src=remo('BoardRecap', f'{OUT}/el/board-{n:03d}.mp4',
             {"rows":rows_avant(n),"zoom":1.0,"offsetX":0})
    return cut(os.path.abspath(src), nfr, out)

def f_citation(n, nfr, out):
    f=film_de(n)
    src=remo('Citation', f'{OUT}/el/cit-{n:03d}.mp4',
             {"text":texte_court(n),"accent":TIERS[f[0]] if f else "B"})
    return cut(os.path.abspath(src), nfr, out)

def f_chiffre(n, nfr, out):
    m=re.search(r'(\d[\d\s]*)', PLAN[n]['note'])
    val=int(re.sub(r'\D','',m.group(1))) if m else 0
    if not val: return f_citation(n, nfr, out)
    f=film_de(n)
    src=remo('BigStat', f'{OUT}/el/stat-{n:03d}.mp4',
             {"value":val,"unit":"","label":etiquette(n),"countUp":True,
              "color":TIERS[f[0]] if f else "accent"})
    return cut(os.path.abspath(src), nfr, out)

def f_pour_contre(n, nfr, out):
    pour, contre = colonnes(n)
    if not pour and not contre:
        return trou(n, nfr, out, 'pour / contre a ecrire : '+PLAN[n]['note'][:44])
    src=remo('ProsCons', f'{OUT}/el/pc-{n:03d}.mp4', {"pros":pour,"cons":contre})
    return cut(os.path.abspath(src), nfr, out)

def f_motion(n, nfr, out):
    return trou(n, nfr, out, PLAN[n]['note'][:60])

def trou(n, nfr, out, quoi):
    manquants.append((n, quoi))
    src=remo('Placeholder', f'{OUT}/el/trou-{n:03d}.mp4', {"what":quoi,"shot":'%03d'%n})
    return cut(os.path.abspath(src), nfr, out)

# ------------------------------------------------------- textes tires du plan

def texte_court(n, maxi=90):
    m=re.search(r"[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]{4}[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ '’,-]{6,}", PLAN[n]['note'])
    if m: return m.group(0).strip(" ,-")
    t=S[n]['txt'].strip()
    return t if len(t)<=maxi else t[:maxi].rsplit(' ',1)[0]+'…'

def etiquette(n):
    m=re.search(r"\d[\d\s]*\s*([A-Za-zÀ-ÿ' ]{3,40})", PLAN[n]['note'])
    return (m.group(1).strip() if m else PLAN[n]['texte'][:40]).lower()

def colonnes(n):
    """Les lignes en capitales de la note, une par grief.

    On ne s en sert QUE si la note a ete ecrite pour ca — le mot COLONNE. Les
    autres notes sont des indications de mise en scene, pas du texte a l ecran :
    en tirer des capitales au hasard donnait « ENERGIQUE » contre « IMPORTANT »
    sur le plan 028, deux qualites presentees comme un desaccord. Un carton de
    remplacement visible vaut mieux qu une affirmation fausse mais assuree.
    """
    if 'COLONNE' not in PLAN[n]['note'].upper(): return [], []
    # un seul item n est pas un comparatif : « DEFAUTS » tout seul est un titre
    # de rubrique, pas une ligne a afficher
    caps=[c.strip() for c in re.findall(
        r"[A-ZÀ-Ý][A-ZÀ-Ý '’]{5,}", PLAN[n]['note'])]
    # les mots-cles de la note ne sont pas du texte a l ecran
    CLES={'COLONNE','CARTON','CITATION','PLEIN ECRAN','FICHE FILM','VERDICT','RETROUVE'}
    # ProsCons plafonne chaque colonne a 3 : au-dela, zod refuse les props
    caps=[c for c in caps if len(c)>5 and c not in CLES][:6]
    if not caps: return [], []
    u=PLAN[n]['note'].upper()
    if len(caps) < 2: return [], []
    if 'POUR' not in u[:u.index('COLONNE')][-30:]:
        return [], caps[:3]      # une seule colonne : les reproches
    moitie=min(3, (len(caps)+1)//2)
    return caps[:moitie], caps[moitie:moitie+3]

FAMILLES={'extrait':f_extrait,'verdict':f_verdict,'carton titre':f_carton_titre,
          'affiche':f_affiche,'photo':f_photo,'rappel tableau':f_rappel,
          'citation':f_citation,'chiffre cle':f_chiffre,'pour / contre':f_pour_contre,
          'motion':f_motion,'transition':f_citation}

def plan(n):
    out=f'{OUT}/p{n:03d}.mp4'
    if os.path.exists(out) and nb_frames(out)==frames(n): return out
    fam=PLAN[n]['famille']
    try:
        return FAMILLES.get(fam, f_motion)(n, frames(n), out)
    except subprocess.CalledProcessError:
        print('  plan %03d (%s) a echoue, carton de remplacement'%(n,fam))
        return trou(n, frames(n), out, '%s : echec du rendu'%fam)

if __name__=='__main__':
    for tier,titre,annee,slug,pv in FILMS:
        assure_affiche(slug, titre, annee)
    debut=int(sys.argv[1]) if len(sys.argv)>1 else 1
    fin  =int(sys.argv[2]) if len(sys.argv)>2 else max(S)
    parts=[]
    co=f'{OUT}/p000.mp4'
    src=os.path.join(INTRO,'cold-open.mp4')
    if debut==1 and os.path.exists(src):
        if not os.path.exists(co): cut(src, round(S[1]['a']*FPS), co)
        parts.append('p000.mp4')
    for n in range(debut, fin+1):
        plan(n); parts.append('p%03d.mp4'%n)
        print('.', end='', flush=True)
    print()
    with open(f'{OUT}/liste.txt','w') as f:
        for p in parts: f.write("file '%s'\n"%p)
    sh('ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',f'{OUT}/liste.txt',
       '-c','copy',f'{OUT}/muet.mp4')
    dur=(S[fin+1]['a'] if (fin+1) in S else S[fin]['b'])
    sh('ffmpeg','-y','-loglevel','error','-i',f'{OUT}/muet.mp4','-ss','0','-t',str(dur),
       '-i',VOIX,'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k',
       '-shortest',f'{OUT}/episode-01.mp4')
    json.dump([{"plan":n,"manque":q} for n,q in manquants],
              open(f'{OUT}/manquants.json','w'), indent=1, ensure_ascii=False)
    print('-> %s/episode-01.mp4  (%.1f s)'%(OUT,dur))
    print('%d plan(s) en carton de remplacement :'%len(manquants))
    for n,q in manquants: print('   %03d  %s'%(n,q))

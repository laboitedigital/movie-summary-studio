# -*- coding: utf-8 -*-
"""Montage des 3 premieres minutes de l episode 01.

Cold open + amorce + segment 1986 complet, jusqu au verdict B (0 -> 02:38.98).
Chaque plan est coupe A LA FRAME sur les bornes du SRT : la video ne peut pas
deriver par rapport a la voix off.

La voix off de reference est `voix/voix-complete.mp3` — les quatre parties
generees bout a bout, 917,11 s. Le master FlexClip a ete jete : il tronquait
24,47 s de narration et finissait sur 42,7 s de silence.

Tout est en 60 fps, y compris les extraits (24/25 fps a l origine, conformes par
duplication). Sans ca, un overlay 60 fps pose sur un extrait 25 fps est tronque
a 42 % de sa duree : overlay herite de la base de temps du premier flux.
"""
import subprocess, os, json, shutil, glob
import shots

FPS=60; W,H=1920,1080
KIT='/home/user/movie-summary-studio/mr-tier-maker/kit-v2'
NAVY='0x071027'; KEY='0x050D23'
OUT='m3'; os.makedirs(OUT,exist_ok=True); os.makedirs(OUT+'/el',exist_ok=True)
S={x['n']:x for x in shots.load()}
FIN=29                                  # dernier plan : le verdict B

def sh(*a, **k):
    subprocess.run(list(a), check=True, **k)

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
    """Duree du plan n, en frames a 60 ips, calee sur le plan suivant."""
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
    got=int(subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v:0',
        '-show_entries','stream=nb_read_frames','-of','csv=p=0',out],
        capture_output=True,text=True).stdout.strip() or 0)
    if got<nfr:   # source plus courte que le plan : on gele la derniere image
        tmp=out+'.pad.mp4'
        sh('ffmpeg','-y','-loglevel','error','-i',out,'-vf',
           f"tpad=stop_mode=clone:stop_duration={(nfr-got)/FPS+0.2}",'-frames:v',str(nfr),
           '-r',str(FPS),'-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p',tmp)
        os.replace(tmp,out)
    return out

AFF='posters/1986-the-transformers-the-movie.jpg'
ROWS_VIDE=[{"tier":t,"posters":[]} for t in ["S","A","B","C","D","F"]]

def flou(src, out, nfr, q=True):
    """Affiche floutee avec un point d interrogation : les deux surprises du hook."""
    vf=(f"scale=760:-1,boxblur=22:2,scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:0x071027,fps={FPS}")
    if q: vf+=(",drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:"
               "text='?':fontcolor=0xF7B632:fontsize=420:borderw=14:bordercolor=black:"
               "x=(w-text_w)/2:y=(h-text_h)/2")
    sh('ffmpeg','-y','-loglevel','error','-loop','1','-i',src,'-vf',vf,'-frames:v',str(nfr),
       '-r',str(FPS),'-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p',out)
    return out

def clip_avec_bandeau(clip, nfr, out, label, annee, tier):
    """Extrait plein ecran + bandeau alpha par-dessus. C est precisement ce que le
    kit v1 ne savait pas faire : son bandeau etait cuit sur un fond opaque."""
    lt=remo('LowerThird', f'{OUT}/el/lt-{label[:6]}.mov',
            {"label":label,"year":annee,"tier":tier}, alpha=True)
    tmp=f'{out}.base.mp4'; cut(clip,nfr,tmp)
    # PAS de shortest=1 : le bandeau fait 300 frames, le plan 429 — shortest
    # tronquait l extrait a la duree du bandeau. Sa derniere image est
    # entierement transparente (il sort du cadre), donc la figer est invisible.
    sh('ffmpeg','-y','-loglevel','error','-i',tmp,'-i',os.path.abspath(lt),
       '-filter_complex',f'[0:v][1:v]overlay=0:0:format=auto:repeatlast=1',
       '-frames:v',str(nfr),'-r',str(FPS),'-c:v','libx264','-preset','veryfast','-crf','17',
       '-pix_fmt','yuv420p','-an',out)
    os.remove(tmp); return out

def verdict(nfr, out):
    """Fond de chaine -> carton verdict (alpha, Remotion) -> mascotte detouree
    (ffmpeg). Chromium ne decode pas le ProRes : aucune video ne passe par
    Remotion."""
    rows=[{"tier":t,"posters":[]} for t in ["S","A","B","C","D","F"]]
    vc=remo('VerdictCard', f'{OUT}/el/verdict-B.mov',
            {"rows":rows,"poster":"posters/1986-the-transformers-the-movie.jpg",
             "tier":"B","slotIndex":0,"offsetX":260,"zoom":2.0}, alpha=True)
    sh('ffmpeg','-y','-loglevel','error',
       '-f','lavfi','-i',f'color=c={NAVY}:s={W}x{H}:r={FPS}',
       '-i',os.path.abspath(vc),'-i','mascotte/reac-B.mp4',
       '-filter_complex',
       f'[0:v][1:v]overlay=0:0:format=auto[a];'
       f'[2:v]scale={W}:{H},fps={FPS},format=rgba,colorkey={KEY}:0.030:0.012[m];'
       f'[a][m]overlay=0:0:format=auto:repeatlast=1[v]',
       '-map','[v]','-frames:v',str(nfr),'-r',str(FPS),
       '-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-an',out)
    return out

C='clips'
RECETTE = {
 5:  ('remo','BoardRecap', {"rows":ROWS_VIDE,"zoom":1.0,"offsetX":0}),
 6:  ('flou','posters/2017-the-last-knight.jpg', None),
 7:  ('flou','posters/2018-bumblebee.jpg', None),
 8:  ('remo','Citation', {"text":"On commence. On part de la source.","accent":"B"}),
 9:  ('bandeau', f'{C}/009-it-the-year-2005.mp4', ("THE MOVIE",1986,"B")),
 10: ('clip', f'{C}/010-prepare-extermination.mp4', None),
 11: ('clip', f'{C}/011-and-every-other-autobot.mp4', None),
 12: ('clip', f'{C}/012-whered-come-from-s8.mp4', None),
 13: ('remo','BigStat', {"value":100,"unit":"","label":"épisodes avant le film","countUp":True,"color":"D"}),
 14: ('clip', f'{C}/014-the-constructicons-form-devastator.mp4', None),
 15: ('clip', f'{C}/015-destroy-devastator.mp4', None),
 16: ('clip', f'{C}/016-one-shall-stand.mp4', None),
 17: ('clip', f'{C}/017-till-all-are-one.mp4', None),
 18: ('clip', f'{C}/018-he-leaves-there-no-hope-s1.mp4', None),
 19: ('hole','Photo d’archive : enfants devant une télé des années 80','019'),
 20: ('remo','Citation', {"text":"Une décision d’écriture d’une audace complète.",
                          "source":"La mort d’Optimus, 1986","accent":"B"}),
 21: ('hole','Photos de jouets Transformers G1 en boîte','021'),
 22: ('clip2', (f'{C}/022a-were-under-attack-s3.mp4', f'{C}/022b-the-decepticons-are-retreating.mp4'), None),
 23: ('clip', f'{C}/023-were-outnumbered.mp4', None),
 24: ('remo','BigStat', {"value":80,"unit":"","label":"minutes à fond de train","countUp":True,"color":"accent"}),
 25: ('clip', f'{C}/025-turbo-roddin-young-punk.mp4', None),
 26: ('clip', f'{C}/026-you-have-failed-no-unicron.mp4', None),
 27: ('hole','Portrait d’Orson Welles — 1985, dernier rôle','027'),
 28: ('remo','ProsCons', {"pros":["Court et énergique","Historiquement important"],
                          "cons":["Demande des devoirs avant de l’apprécier"]}),
 29: ('verdict', None, None),
}

def plan(n):
    nfr=frames(n); out=f'{OUT}/p{n:03d}.mp4'
    if os.path.exists(out): return out
    kind,a,b=RECETTE[n]
    if kind=='clip':      cut(a,nfr,out)
    elif kind=='clip2':
        h=nfr//2
        cut(a[0],h,f'{OUT}/_a.mp4'); cut(a[1],nfr-h,f'{OUT}/_b.mp4')
        with open(f'{OUT}/_l.txt','w') as f: f.write("file '_a.mp4'\nfile '_b.mp4'\n")
        sh('ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',f'{OUT}/_l.txt','-c','copy',out)
    elif kind=='bandeau': clip_avec_bandeau(a,nfr,out,*b)
    elif kind=='flou':    flou(a,out,nfr)
    elif kind=='hole':
        src=remo('Placeholder', f'{OUT}/el/hole-{b}.mp4', {"what":a,"shot":b})
        cut(os.path.abspath(src),nfr,out)
    elif kind=='remo':
        src=remo(a, f'{OUT}/el/{a}-{n:03d}.mp4', b)
        cut(os.path.abspath(src),nfr,out)
    elif kind=='verdict': verdict(nfr,out)
    return out

if __name__=='__main__':
    import sys
    parts=[]
    # 1. cold open existant (25 ips) conforme en 60
    co=f'{OUT}/p000.mp4'
    if not os.path.exists(co): cut('intro/cold-open.mp4', round(S[5]['a']*FPS), co)
    parts.append('p000.mp4')
    for n in range(5,FIN+1):
        plan(n); parts.append(f'p{n:03d}.mp4'); print('.',end='',flush=True)
    print()
    with open(f'{OUT}/liste.txt','w') as f:
        for p in parts: f.write(f"file '{p}'\n")
    sh('ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',f'{OUT}/liste.txt',
       '-c','copy',f'{OUT}/muet.mp4')
    dur=S[FIN+1]['a'] if (FIN+1) in S else S[FIN]['b']
    sh('ffmpeg','-y','-loglevel','error','-i',f'{OUT}/muet.mp4','-ss','0','-t',str(dur),
       '-i',shots.VOIX+'/voix-complete.mp3','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k',
       '-shortest',f'{OUT}/test-3min.mp4')
    print('->', f'{OUT}/test-3min.mp4', 'jusqu a', round(dur,2),'s')

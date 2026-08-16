# -*- coding: utf-8 -*-
"""Les 156 plans de l episode.

`load()` renvoie les plans cales sur `voix/voix-complete.mp3` — les quatre
parties generees bout a bout. C est la seule base de temps du montage.

Le SRT (`voix/voix-master.srt`) est cale sur l ancien master FlexClip, qui
tronquait 24,47 s de narration. Il reste ici parce qu il porte le TEXTE, mais
ses timecodes ne valent plus : `load_master()` les lit tels quels, `remap.py`
les reporte sur la nouvelle base et ecrit `voix/plans-remappes.json`, que
`load()` relit. Ne jamais monter sur `load_master()`.
"""
import re, json, os

ICI  = os.path.dirname(os.path.abspath(__file__))
VOIX = os.path.join(os.path.dirname(ICI), 'voix')
SRT  = os.path.join(VOIX, 'voix-master.srt')
PLANS= os.path.join(VOIX, 'plans-remappes.json')

def load():
    """Les plans sur la voix off de reference. A utiliser partout."""
    return json.load(open(PLANS, encoding='utf-8'))

def load_master():
    """Les plans sur les timecodes bruts du SRT. Pour remap.py uniquement."""
    src=open(SRT,encoding='utf-8').read()
    src=src.replace('(Transcribed by TurboScribe. Go Unlimited to remove this message.) ','')
    src=re.sub(r'Transcribed by TurboScribe\..*?message\.','',src)
    b=re.findall(r'\d+\n(\d\d:\d\d:\d\d,\d+) --> (\d\d:\d\d:\d\d,\d+)\n(.*?)(?=\n\n|\Z)',src,re.S)
    def sec(x):
        h,m,r=x.split(':'); s,ms=r.split(','); return int(h)*3600+int(m)*60+int(s)+int(ms)/1000
    items=[(sec(a),sec(c),' '.join(t.split())) for a,c,t in b if t.strip()]
    sen=[];buf='';st0=None
    for st,en,txt in items:
        if st0 is None: st0=st
        buf=(buf+' '+txt).strip()
        if re.search(r'[.!?]$',txt): sen.append((st0,en,buf));buf='';st0=None
    if buf: sen.append((st0,items[-1][1],buf))
    MAX=7.5;sh=[];cs=ce=None;ct=[]
    for st,en,txt in sen:
        if cs is None: cs,ce,ct=st,en,[txt];continue
        if en-cs<=MAX: ce=en;ct.append(txt)
        else: sh.append((cs,ce,' '.join(ct)));cs,ce,ct=st,en,[txt]
    if cs is not None: sh.append((cs,ce,' '.join(ct)))
    final=[]
    for st,en,txt in sh:
        d=en-st
        if d<=MAX+0.5: final.append((st,en,txt));continue
        n=int(d//MAX)+1;w=txt.split();per=max(1,len(w)//n)
        for i in range(n):
            c=' '.join(w[i*per:(i+1)*per]) if i<n-1 else ' '.join(w[i*per:])
            if c.strip(): final.append((st+d*i/n,st+d*(i+1)/n,c))
    # duree ECRAN : un plan tient jusqu au debut du suivant
    END=892.334  # fin de la parole dans l ancien master
    out=[]
    for i,(a,b,txt) in enumerate(final):
        nxt = final[i+1][0] if i+1<len(final) else END
        out.append(dict(n=i+1, a=a, b=nxt, speech=b-a, screen=nxt-a, txt=txt))
    return out

if __name__=='__main__':
    S=load()
    print("plans:",len(S), " (voix-complete.mp3)")
    print("ecran  : total %.1fs | moy %.1fs | max %.1fs"%(sum(s['screen'] for s in S),
          sum(s['screen'] for s in S)/len(S), max(s['screen'] for s in S)))
    over=[s for s in S if s['screen']>7.5]
    print("plans > 7.5s ecran : %d"%len(over))
    for s in over: print("   %03d  %.1fs  (parole %.1fs)  %s"%(s['n'],s['screen'],s['speech'],s['txt'][:56]))

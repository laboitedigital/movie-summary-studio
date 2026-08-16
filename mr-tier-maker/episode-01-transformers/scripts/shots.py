# -*- coding: utf-8 -*-
import re
SRT='/root/.claude/uploads/6766f008-556b-59c2-a547-c84c2948a887/2f6a5ad7-Untitled___Made_with_FlexClip.srt'
def load():
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
    # duree ECRAN : un plan tient jusqu'au debut du suivant
    END=892.334  # fin reelle de la parole dans le mp3
    out=[]
    for i,(a,b,txt) in enumerate(final):
        nxt = final[i+1][0] if i+1<len(final) else END
        out.append(dict(n=i+1, a=a, b=nxt, speech=b-a, screen=nxt-a, txt=txt))
    return out
if __name__=='__main__':
    S=load()
    print("plans:",len(S))
    print("ecran  : total %.1fs | moy %.1fs | max %.1fs"%(sum(s['screen'] for s in S),
          sum(s['screen'] for s in S)/len(S), max(s['screen'] for s in S)))
    over=[s for s in S if s['screen']>7.5]
    print("plans > 7.5s ecran : %d"%len(over))
    for s in over: print("   %03d  %.1fs  (parole %.1fs)  %s"%(s['n'],s['screen'],s['speech'],s['txt'][:56]))

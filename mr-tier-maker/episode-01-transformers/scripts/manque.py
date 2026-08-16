# -*- coding: utf-8 -*-
# ENQUETE, UNE SEULE FOIS — ne tourne plus.
# Ce script comparait les parties generees au master FlexClip pour trouver ce
# qu il tronquait. Le master a ete jete une fois le compte etabli (24,47 s de
# narration perdue). Conserve pour la methode : correlation croisee des
# enveloppes d energie, quand aucune transcription n est disponible.
"""La fin de chaque partie existe-t-elle dans le master ?"""
import subprocess, numpy as np
SR=4000; HOP=80
def env(path,start=None,dur=None):
    cmd=['ffmpeg','-v','error']
    if start is not None: cmd+=['-ss',str(start)]
    if dur is not None: cmd+=['-t',str(dur)]
    cmd+=['-i',path,'-ac','1','-ar',str(SR),'-f','s16le','-']
    x=np.frombuffer(subprocess.run(cmd,capture_output=True).stdout,dtype=np.int16).astype(np.float32)
    n=len(x)//HOP
    e=np.log1p(np.abs(x[:n*HOP].reshape(n,HOP)).mean(1))
    return (e-e.mean())/(e.std()+1e-9)
def slide(needle,hay):
    n=len(needle)
    f=np.fft.rfft(hay,len(hay)+n); g=np.fft.rfft(needle[::-1],len(hay)+n)
    c=np.fft.irfft(f*g)[n-1:len(hay)]
    cs=np.concatenate(([0],np.cumsum(hay**2)))
    norm=np.sqrt(np.maximum(cs[n:]-cs[:-n],1e-9))
    s=c[:len(norm)]/(norm*np.sqrt(np.sum(needle**2))+1e-9)
    i=int(np.argmax(s)); return i*0.02,float(s[i])

master=env('voix-episode.mp3')
DUR={'a1':254.59,'a2':204.59,'ae':260.60,'a4':197.33}
print("Les 14 dernieres secondes de chaque partie, cherchees dans le master :\n")
for k,d in DUR.items():
    tail=env(f'vo/{k}.mp3', d-14, 14)
    off,sc=slide(tail,master)
    verdict = "PRESENTE" if sc>0.80 else ("ABSENTE DU MASTER" if sc<0.55 else "douteux")
    print(f"  fin de {k:3s} -> r={sc:.2f} a {off:7.1f} s   {verdict}")
print()
tot=sum(DUR.values())
print(f"concatenation simple a1+a2+ae+a4 = {tot:.2f} s")
print(f"master actuel                    = 935.33 s")

# -*- coding: utf-8 -*-
"""Les fichiers source se chevauchent-ils vraiment, ou se suivent-ils ?

Si la fin de A et le debut de B disent le MEME texte, la correlation dans la
zone commune est elevee : on peut couper n importe ou dedans. Si elle est
basse, ce sont deux textes differents — et ce qui manque au master est
precisement ce qui tombe entre les deux.
"""
import subprocess, numpy as np
SR=4000; HOP=80

def env(path, start=None, dur=None):
    cmd=['ffmpeg','-v','error']
    if start is not None: cmd+=['-ss',str(start)]
    if dur   is not None: cmd+=['-t',str(dur)]
    cmd+=['-i',path,'-ac','1','-ar',str(SR),'-f','s16le','-']
    raw=subprocess.run(cmd,capture_output=True).stdout
    x=np.frombuffer(raw,dtype=np.int16).astype(np.float32)
    n=len(x)//HOP
    e=np.log1p(np.abs(x[:n*HOP].reshape(n,HOP)).mean(1))
    return (e-e.mean())/(e.std()+1e-9)

def slide(needle, hay):
    n=len(needle)
    if n>len(hay): return None,0.0
    f=np.fft.rfft(hay,len(hay)+n); g=np.fft.rfft(needle[::-1],len(hay)+n)
    c=np.fft.irfft(f*g)[n-1:len(hay)]
    cs=np.concatenate(([0],np.cumsum(hay**2)))
    norm=np.sqrt(np.maximum(cs[n:]-cs[:-n],1e-9))
    s=c[:len(norm)]/(norm*np.sqrt(np.sum(needle**2))+1e-9)
    i=int(np.argmax(s)); return i*0.02, float(s[i])

DUR={'a1':254.59,'a2':204.59,'ae':260.60,'a4':197.33}
for A,B in [('a1','a2'),('a2','ae'),('ae','a4')]:
    da=DUR[A]
    # 25 dernieres secondes de A, cherchees dans les 60 premieres de B
    tail=env(f'vo/{A}.mp3', da-25, 25)
    head=env(f'vo/{B}.mp3', 0, 60)
    off,sc=slide(tail, head)
    print(f"fin de {A} retrouvee dans {B} a {off:6.2f} s   r={sc:.2f}"
          f"   {'-> chevauchement reel' if sc>0.85 else '-> PAS le meme texte'}")

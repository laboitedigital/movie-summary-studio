# -*- coding: utf-8 -*-
"""Ou chaque fichier de voix off tombe-t-il dans le master ?

On ne peut pas transcrire ici, mais on peut comparer les enveloppes d energie :
deux enregistrements du meme texte ont la meme respiration. Une correlation
elevee = c est le meme passage.
"""
import subprocess, numpy as np
SR=4000; HOP=80   # 20 ms

def env(path):
    raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-ac','1','-ar',str(SR),
        '-f','s16le','-'],capture_output=True).stdout
    x=np.frombuffer(raw,dtype=np.int16).astype(np.float32)
    n=len(x)//HOP
    e=np.abs(x[:n*HOP].reshape(n,HOP)).mean(1)
    e=np.log1p(e)
    return (e-e.mean())/(e.std()+1e-9)

def best_offset(needle, hay):
    """Correlation normalisee de needle glissee sur hay."""
    n=len(needle)
    if n>len(hay): return None,0.0
    f=np.fft.rfft(hay, len(hay)+n)
    g=np.fft.rfft(needle[::-1], len(hay)+n)
    c=np.fft.irfft(f*g)[n-1:len(hay)]
    # normalisation par la norme locale de hay
    cs=np.concatenate(([0],np.cumsum(hay**2)))
    norm=np.sqrt(np.maximum(cs[n:]-cs[:-n],1e-9))
    score=c[:len(norm)]/(norm*np.sqrt(np.sum(needle**2))+1e-9)
    i=int(np.argmax(score))
    return i*0.02, float(score[i])

master=env('voix-episode.mp3')
print(f"master : {len(master)*0.02:.1f} s\n")
for name,f in [('a1','vo/a1.mp3'),('a2','vo/a2.mp3'),('a4','vo/a4.mp3'),('ae','vo/ae.mp3')]:
    e=env(f)
    # on teste avec les 30 premieres secondes, c est assez pour situer
    off,sc=best_offset(e[:1500], master)
    off2,sc2=best_offset(e[-1500:], master)
    print(f"{name}  duree {len(e)*0.02:7.1f} s | debut -> {off:7.1f} s (r={sc:.2f})"
          f" | fin -> {off2+30:7.1f} s (r={sc2:.2f})")

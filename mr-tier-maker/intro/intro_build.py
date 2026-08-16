# -*- coding: utf-8 -*-
# Assemblage du cold open : coupes calees a la frame sur les phrases de la voix off.
import subprocess, os
import intro_graph as G
FPS=25
NAVY='0x071027'; KEY='0x050D23'
MONO='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# bornes des phrases dans le SRT de l episode
EDGES=[0.0, 4.06, 8.18, 12.92, 17.03, 21.14]
FR=[round(e*FPS) for e in EDGES]
DUR=[FR[i+1]-FR[i] for i in range(len(FR)-1)]

def cut(src, n, out, ss=0.0):
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(ss),'-i',src,
        '-vf',f'scale=1920:1080,fps={FPS}','-frames:v',str(n),'-an',
        '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out],check=True)

def plan4(src, n, out):
    """L avatar detoure, pose sur le tableau vide."""
    import tableau
    tab=tableau.build()
    txt=[]
    for i2,(l,c,ink) in enumerate(G.TIERS):
        y=tableau.row_y(i2)
        txt.append(f"drawtext=fontfile={MONO}:text='{l}':fontcolor=0x{ink}:fontsize=76:"
                   f"borderw=5:bordercolor=black:x={tableau.BX}+({tableau.LAB}-text_w)/2:"
                   f"y={y}+({tableau.RH}-text_h)/2-4")
    fc=(f"[1:v][2:v]overlay=x=0:y=0[bg0];"
        f"[bg0]{','.join(txt)}[bg];"
        f"[0:v]scale=1920:1080,format=rgba,colorkey={KEY}:0.030:0.012[av];"
        f"[bg][av]overlay=x=0:y=0:format=auto[v]")
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,
        '-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r={FPS}:d=10',
        '-loop','1','-i',tab,
        '-filter_complex',fc,'-map','[v]','-frames:v',str(n),'-an',
        '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out],check=True)

os.makedirs('intro/cut',exist_ok=True)
G.plan1('intro/plan-1.mp4', d=DUR[0]/FPS)
G.plan5('intro/plan-5.mp4', d=DUR[4]/FPS)
cut('intro/plan-1.mp4', DUR[0], 'intro/cut/1.mp4')
cut('intro/brut-2.mp4', DUR[1], 'intro/cut/2.mp4')
cut('intro/brut-3.mp4', DUR[2], 'intro/cut/3.mp4')
plan4('intro/brut-4.mp4', DUR[3], 'intro/cut/4.mp4')
cut('intro/plan-5.mp4', DUR[4], 'intro/cut/5.mp4')
with open('intro/liste.txt','w') as f:
    for i in range(1,6): f.write(f"file 'cut/{i}.mp4'\n")
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0',
    '-i','intro/liste.txt','-c','copy','intro/cold-open.mp4'],check=True)
d=subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v:0',
    '-show_entries','stream=nb_read_frames,duration','-of','csv=p=0','intro/cold-open.mp4'],
    capture_output=True,text=True).stdout.strip()
print("plans (frames):",DUR,"total",sum(DUR))
print("cold-open.mp4 ->",d)

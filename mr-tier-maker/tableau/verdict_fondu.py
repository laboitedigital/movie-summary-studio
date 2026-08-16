# -*- coding: utf-8 -*-
# Carton VERDICT : avatar au premier plan, a pleine opacite, tableau a droite.
#
# Principe : la plaque de la mascotte a un fond bleu nuit parfaitement uni et
# plus aucune bande de couleur, donc un simple colorkey suffit a la detourer.
# L avatar detoure se pose PAR-DESSUS le tableau, a 100 % d opacite, sans
# aucun fondu. Le tableau demarre sous son epaule.
import subprocess, sys
MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
DIM='0x8794A8'; NAVY='0x071027'
KEY='0x050D23'   # fond uni de la plaque, mesure au pixel
# couleurs echantillonnees sur les bandes du logo
TIERS=[("S",'0xE6354F','0xFFFFFF'),("A",'0xF47025','0x0B0D10'),
       ("B",'0xF7B632','0x0B0D10'),("C",'0x72AB54','0x0B0D10'),
       ("D",'0x3A5DAD','0xFFFFFF'),("F",'0x7242AA','0xFFFFFF')]

def build(masc, poster, target, d, out, still=False):
    lab_w=104; rw=800; gap=9; rh=112
    bx=800          # le tableau demarre sous l epaule de l avatar
    rx=bx+lab_w
    ry=(1080-(len(TIERS)*rh+(len(TIERS)-1)*gap))//2
    yT=ry+target*(rh+gap)
    ph=rh-14; pw=int(ph*496/755)
    col=TIERS[target][1]
    xe=f"if(lt(t,2.4),1920,if(lt(t,3.05),1920-(1920-{rx+14})*(t-2.4)/0.65,{rx+14}))"
    f=[f"drawtext=fontfile={MONO}:text='VERDICT':fontcolor={DIM}:fontsize=32:x={bx}+(({rx+rw})-{bx}-text_w)/2:y=96:enable='gte(t,0.2)'"]
    for i,(l,c,ink) in enumerate(TIERS):
        y=ry+i*(rh+gap)
        f.append(f"drawbox=x={bx}:y={y}:w={lab_w}:h={rh}:color={c}:t=fill:enable='gte(t,0.4)'")
        f.append(f"drawtext=fontfile={MONO}:text='{l}':fontcolor={ink}:fontsize=72:x={bx}+({lab_w}-text_w)/2:y={y}+({rh}-text_h)/2-5:enable='gte(t,0.4)'")
        f.append(f"drawbox=x={rx}:y={y}:w={rw}:h={rh}:color=0x101A2E@0.82:t=fill:enable='gte(t,0.4)'")
    board=",".join(f)
    fc=(
      f"[0:v]scale=1920:1080,format=rgba,colorkey={KEY}:0.030:0.012[av];"
      f"[1:v]{board}[bg];"
      f"[2:v]scale={pw}:{ph}[pv];"
      f"[bg][pv]overlay=x='{xe}':y={yT+7}:enable='gte(t,2.4)'[o];"
      f"[o]drawbox=x={rx}:y={yT}:w={rw}:h={rh}:color={col}@0.24:t=fill:enable='between(t,3.05,3.5)',"
      f"drawbox=x={bx}:y={yT}:w={rw+lab_w}:h={rh}:color={col}:t=3:enable='gte(t,3.05)'[plateau];"
      f"[plateau][av]overlay=x=0:y=0:format=auto[v]"
    )
    cmd=['ffmpeg','-y','-loglevel','error']
    cmd+= (['-loop','1','-i',masc] if still else ['-i',masc])
    cmd+= ['-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r=25:d={d}',
        '-loop','1','-i',poster,
        '-filter_complex',fc,'-map','[v]','-t',str(d),'-r','25',
        '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out]
    subprocess.run(cmd,check=True)
    print("ok ->",out)

if __name__=='__main__':
    m=sys.argv[1] if len(sys.argv)>1 else 'mascotte/plaque-1920.jpg'
    build(m,'posters/1986-the-transformers-the-movie.jpg', 2, 6.2,
          'motion/029-verdict-B.mp4', still=m.endswith(('.jpg','.png')))

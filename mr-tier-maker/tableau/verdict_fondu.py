# -*- coding: utf-8 -*-
# Carton VERDICT : mascotte a gauche, fondue dans le fond, tableau a droite.
# Aucune coupure : le fond du carton reprend le bleu nuit exact de l image (#071027)
# et le bord droit de la mascotte s efface en degrade.
import subprocess, sys
MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
NAVY='0x071027'; DIM='0x8794A8'; INK='0x0B0D10'
TIERS=[("S",'0xE6354F','0xFFFFFF'),("A",'0xF47025','0x0B0D10'),("B",'0xF7B632','0x0B0D10'),("C",'0x72AB54','0x0B0D10'),("D",'0x3A5DAD','0xFFFFFF'),("F",'0x7242AA','0xFFFFFF')]   # couleurs echantillonnees sur les bandes du logo

def build(masc, poster, target, d, out):
    MW=900          # largeur de la mascotte : on coupe avant les bandes du logo
    FADE=220        # longueur du degrade
    lab_w=104; rw=760; gap=9; rh=112
    bx=860                       # debut du tableau : la mascotte le recouvre en partie
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
      # 1. le tableau se dessine sur le fond bleu nuit
      f"[0:v]{board}[bg];"
      # 2. l affiche glisse dans sa rangee
      f"[2:v]scale={pw}:{ph}[pv];"
      f"[bg][pv]overlay=x='{xe}':y={yT+7}:enable='gte(t,2.4)'[o];"
      f"[o]drawbox=x={rx}:y={yT}:w={rw}:h={rh}:color={col}@0.24:t=fill:enable='between(t,3.05,3.5)',"
      f"drawbox=x={bx}:y={yT}:w={rw+lab_w}:h={rh}:color={col}:t=3:enable='gte(t,3.05)'[plateau];"
      # 3. la mascotte passe PAR-DESSUS, son bord droit s efface en degrade
      f"[1:v]scale=1920:1080,crop={MW}:1080:400:0,format=rgba,"
      f"geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*min(1,max(0,({MW}-X)/{FADE}))'[m];"
      f"[plateau][m]overlay=x=0:y=0:format=auto[v]"
    )
    subprocess.run(['ffmpeg','-y','-loglevel','error',
        '-f','lavfi','-i',f'color=c={NAVY}:s=1920x1080:r=25:d={d}',
        '-i',masc,'-loop','1','-i',poster,
        '-filter_complex',fc,'-map','[v]','-t',str(d),
        '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out],check=True)
    print("ok ->",out)

if __name__=='__main__':
    build(sys.argv[1] if len(sys.argv)>1 else 'mascotte/reaction-B.mp4',
          'posters/1986-the-transformers-the-movie.jpg', 2, 6.2,
          'motion/029-verdict-B-fondu.mp4')

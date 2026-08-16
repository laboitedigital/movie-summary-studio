# -*- coding: utf-8 -*-
"""Le tableau de tiers, style cartoon : pastilles a gros contour noir et ombre dure."""
import cartoon, os
TIERS=[("S",'E6354F','FFFFFF'),("A",'F47025','0B0D10'),("B",'F7B632','0B0D10'),
       ("C",'72AB54','0B0D10'),("D",'3A5DAD','FFFFFF'),("F",'7242AA','FFFFFF')]
LAB=116; RW=780; RH=108; GAP=16; BX=800
RY=(1080-(len(TIERS)*RH+(len(TIERS)-1)*GAP))//2
RX=BX+LAB+10
PLATE='16233F'

def row_y(i): return RY+i*(RH+GAP)

def build(path='out/tableau-cartoon.png'):
    if os.path.exists(path): return path
    c=cartoon.Canvas(1920,1080)
    for i,(l,col,ink) in enumerate(TIERS):
        y=row_y(i)
        c.rrect(RX,y,RW,RH,PLATE,r=18,stroke=6,shadow=(0,8))
        c.rrect(BX,y,LAB,RH,col,r=20,stroke=7,shadow=(0,8))
    c.save(path); return path

if __name__=='__main__':
    print(build())

def highlight(target, path=None):
    """Anneau arrondi qui entoure la rangee du verdict."""
    path = path or f'out/surbrillance-{TIERS[target][0]}.png'
    import os
    if os.path.exists(path): return path
    y=row_y(target)
    c=cartoon.Canvas(1920,1080)
    c.ring(BX-10, y-10, (RX+RW+10)-(BX-10), RH+20, TIERS[target][1], r=28, thick=7)
    c.save(path); return path

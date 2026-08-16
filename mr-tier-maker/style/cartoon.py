# -*- coding: utf-8 -*-
"""Boite a outils du style cartoon : coins arrondis, gros contour noir, ombre dure.

Pas de PIL ni d ImageMagick sur cette machine, donc on ecrit les PNG a la main.
Le lissage n est calcule que dans les quatre coins (le reste est rectangulaire),
ce qui rend le tout instantane meme en Python pur.
"""
import zlib, struct, math

def write_png(path, w, h, buf):
    raw=bytearray()
    for y in range(h):
        raw.append(0); raw += buf[y*w*4:(y+1)*w*4]
    def chunk(t,d):
        return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'
    png+=chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))
    png+=chunk(b'IDAT',zlib.compress(bytes(raw),6))
    png+=chunk(b'IEND',b'')
    open(path,'wb').write(png)

def hexc(c):
    # attention : lstrip('0x') mangerait les zeros de tete de '071027'
    if c.startswith('#'): c=c[1:]
    if c[:2].lower()=='0x': c=c[2:]
    return (int(c[0:2],16),int(c[2:4],16),int(c[4:6],16))

def _cov(px,py,x,y,w,h,r,ss=4):
    """Couverture d un pixel par le rectangle arrondi, echantillonnee ss x ss."""
    n=0
    for i in range(ss):
        for j in range(ss):
            sx=px+(i+0.5)/ss; sy=py+(j+0.5)/ss
            dx=max(abs(sx-(x+w/2))-(w/2-r),0.0)
            dy=max(abs(sy-(y+h/2))-(h/2-r),0.0)
            if math.hypot(dx,dy)<=r: n+=1
    return n/(ss*ss)

def rrect_mask(W,H,x,y,w,h,r):
    """Masque 0..255 du rectangle arrondi, lisse seulement dans les coins."""
    m=bytearray(W*H)
    for yy in range(max(0,y),min(H,y+h)):
        near_y = yy<y+r or yy>=y+h-r
        row=yy*W
        if not near_y:
            for xx in range(max(0,x),min(W,x+w)): m[row+xx]=255
        else:
            for xx in range(max(0,x),min(W,x+w)):
                if x+r<=xx<x+w-r: m[row+xx]=255
                else: m[row+xx]=int(255*_cov(xx,yy,x,y,w,h,r))
    return m

def sticker(path,w,h,fill,r=22,stroke=8,shadow=(0,10),shadow_a=0.38,pad=None):
    """Pastille facon autocollant : fond plein, contour noir epais, ombre dure."""
    sx,sy=shadow
    pad = pad if pad is not None else max(abs(sx),abs(sy))+2
    W=w+2*pad; H=h+2*pad
    buf=bytearray(W*H*4)
    fr,fg,fb=hexc(fill)
    outer=rrect_mask(W,H,pad,pad,w,h,r)
    inner=rrect_mask(W,H,pad+stroke,pad+stroke,w-2*stroke,h-2*stroke,max(1,r-stroke))
    shad =rrect_mask(W,H,pad+sx,pad+sy,w,h,r)
    for i in range(W*H):
        a_s=shad[i]; a_o=outer[i]; a_i=inner[i]
        # ombre d abord
        rr=gg=bb=0; aa=int(a_s*shadow_a)
        if a_o:   # contour noir
            aa=max(aa,a_o); rr=gg=bb=0
        if a_i:   # remplissage
            t=a_i/255
            rr=int(fr*t); gg=int(fg*t); bb=int(fb*t)
            aa=max(aa,a_i)
        o=i*4; buf[o]=rr; buf[o+1]=gg; buf[o+2]=bb; buf[o+3]=aa
    write_png(path,W,H,buf)
    return W,H,pad

def hole_frame(path,W,H,x,y,w,h,r=30,stroke=10,bg='071027',shadow=(0,14),shadow_a=0.45):
    """Plaque pleine ecran percee d un trou arrondi : le clip se glisse dessous.

    Le trou est transparent, le pourtour est peint au fond de la chaine, et un
    gros trait noir cerne l ouverture. Les coins carres du clip sont donc
    masques par la plaque."""
    buf=bytearray(W*H*4)
    br,bg_,bb=hexc(bg)
    hole =rrect_mask(W,H,x,y,w,h,r)
    ring =rrect_mask(W,H,x-stroke,y-stroke,w+2*stroke,h+2*stroke,r+stroke)
    sx,sy=shadow
    shad =rrect_mask(W,H,x-stroke+sx,y-stroke+sy,w+2*stroke,h+2*stroke,r+stroke)
    for i in range(W*H):
        a_h=hole[i]; a_r=ring[i]; a_s=shad[i]
        rr,gg,bb2,aa = br,bg_,bb,255          # fond de la chaine partout
        if a_s and not a_r:                   # ombre portee sur le fond
            t=a_s/255*shadow_a
            rr=int(br*(1-t)); gg=int(bg_*(1-t)); bb2=int(bb*(1-t))
        if a_r:                               # trait noir
            t=a_r/255
            rr=int(rr*(1-t)); gg=int(gg*(1-t)); bb2=int(bb2*(1-t))
        if a_h:                               # ouverture : on efface
            aa=255-a_h
        o=i*4; buf[o]=rr; buf[o+1]=gg; buf[o+2]=bb2; buf[o+3]=aa
    write_png(path,W,H,buf)

class Canvas:
    """Toile RGBA sur laquelle on empile des rectangles arrondis facon autocollant."""
    def __init__(self,W,H):
        self.W=W; self.H=H; self.buf=bytearray(W*H*4)
    def _blend(self,i,r,g,b,a):
        if a<=0: return
        o=i*4; da=self.buf[o+3]
        if a>=255:
            self.buf[o]=r; self.buf[o+1]=g; self.buf[o+2]=b; self.buf[o+3]=255; return
        t=a/255; it=1-t
        self.buf[o]=int(r*t+self.buf[o]*it)
        self.buf[o+1]=int(g*t+self.buf[o+1]*it)
        self.buf[o+2]=int(b*t+self.buf[o+2]*it)
        self.buf[o+3]=min(255,int(a+da*it))
    def rrect(self,x,y,w,h,fill,r=20,stroke=7,shadow=(0,8),shadow_a=0.40,sheen=0.16):
        fr,fg,fb=hexc(fill)
        if shadow:
            sx,sy=shadow
            sh=rrect_mask(self.W,self.H,x+sx,y+sy,w,h,r)
            for i,a in enumerate(sh):
                if a: self._blend(i,0,0,0,int(a*shadow_a))
        out=rrect_mask(self.W,self.H,x,y,w,h,r)
        for i,a in enumerate(out):
            if a: self._blend(i,0,0,0,a)
        if stroke>0:
            inn=rrect_mask(self.W,self.H,x+stroke,y+stroke,w-2*stroke,h-2*stroke,max(1,r-stroke))
            for i,a in enumerate(inn):
                if a: self._blend(i,fr,fg,fb,a)
            # liseré clair en haut : donne du relief sans casser l aplat
            if sheen>0:
                top=int(h*0.42)
                for yy in range(y+stroke,min(self.H,y+stroke+top)):
                    k=1.0-(yy-(y+stroke))/max(1,top)
                    a_s=int(255*sheen*k*k)
                    if a_s<=0: continue
                    row=yy*self.W
                    for xx in range(max(0,x+stroke),min(self.W,x+w-stroke)):
                        i=row+xx
                        if inn[i]: self._blend(i,255,255,255,min(a_s,inn[i]))
    def save(self,path): write_png(path,self.W,self.H,self.buf)

def _ring(self,x,y,w,h,fill,r=24,thick=6):
    """Contour arrondi seul : rien a l interieur."""
    fr,fg,fb=hexc(fill)
    out=rrect_mask(self.W,self.H,x,y,w,h,r)
    inn=rrect_mask(self.W,self.H,x+thick,y+thick,w-2*thick,h-2*thick,max(1,r-thick))
    for i in range(self.W*self.H):
        a=out[i]-inn[i]
        if a>0: self._blend(i,fr,fg,fb,a)
Canvas.ring=_ring

def _arc(self,cx,cy,r_out,r_in,frac,fill,start=-90.0):
    """Anneau partiel, du haut dans le sens horaire. frac de 0 a 1."""
    fr,fg,fb=hexc(fill)
    end=start+360.0*max(0.0,min(1.0,frac))
    for yy in range(max(0,cy-r_out-1),min(self.H,cy+r_out+2)):
        row=yy*self.W
        for xx in range(max(0,cx-r_out-1),min(self.W,cx+r_out+2)):
            n=0
            for i in range(2):
                for j in range(2):
                    dx=xx+(i+0.5)/2-cx; dy=yy+(j+0.5)/2-cy
                    d=math.hypot(dx,dy)
                    if d<r_in or d>r_out: continue
                    ang=math.degrees(math.atan2(dy,dx))
                    while ang<start: ang+=360.0
                    if ang<=end: n+=1
            if n: self._blend(row+xx,fr,fg,fb,int(255*n/4))
Canvas.arc=_arc

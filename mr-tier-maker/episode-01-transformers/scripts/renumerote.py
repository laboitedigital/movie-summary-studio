# -*- coding: utf-8 -*-
"""Reporte le plan de montage sur le nouveau sous-titrage.

Le SRT a ete refait sur `voix-complete.mp3`. Il contient 24,47 s de narration
que l ancien n avait pas, donc le decoupage passe de 156 a 159 plans et la
numerotation glisse. Tout ce qui est indexe par numero de plan doit suivre :
plan-episode-01.json, assign.json (les extraits Clip.cafe), images/.

Methode : les anciens plans sont deja reportes sur la nouvelle base de temps
(`plans-remappes.json`). Pour chaque nouveau plan on cherche l ancien dont le
texte s y retrouve, et quand deux anciens fusionnent en un seul nouveau on
garde CELUI QUI COMMENCE le plan — c est son image qui est a l ecran au moment
de la coupe. Le recouvrement temporel ne sert plus qu a departager. PUIS on
verifie le texte. Le recouvrement seul se trompe sur
les plans a cheval sur un trou : le « Verdict, il va en A » retrouve se voyait
attribuer l annotation d un ancien plan qui disait autre chose. Un appariement
n est retenu que si les deux textes se ressemblent vraiment.

Sortie : annot.py renumerote (la source des annotations), la table
ancien -> nouveau pour renommer les extraits deja telecharges, et le rapport.
`plan.py` regenere ensuite le plan de montage a partir de la.
"""
import json, os, sys, re, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shots

EP    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)) )
VOIX  = shots.VOIX
# les trois fenetres de narration que le master tronquait, sur la base actuelle
TROUS = [(240.40, 254.59), (449.59, 459.18), (719.08, 719.78)]

def norm(t):
    t = t.lower().replace('\u2019', "'")
    return re.sub(r"[^a-z0-9\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f6\u00f9\u00fb\u00fc\u00e7' ]", ' ', t).split()

def pareil(a, b):
    """Les deux plans disent-ils la meme chose ?"""
    return difflib.SequenceMatcher(a=norm(a), b=norm(b), autojunk=False).ratio()

SEUIL = 0.60

def dans_un_trou(p):
    """Le plan passe-t-il plus de la moitie de son temps dans un trou ?"""
    for t0, t1 in TROUS:
        if min(p['b'], t1) - max(p['a'], t0) > (p['b'] - p['a']) * 0.5:
            return True
    return False

new = shots.load()
old = json.load(open(os.path.join(VOIX, 'plans-remappes.json'), encoding='utf-8'))

corr, inedits = {}, []
for p in new:
    if dans_un_trou(p):
        inedits.append(p['n']); continue
    best, cle = None, None
    np = norm(p['txt'])
    for q in old:
        rec = min(p['b'], q['b']) - max(p['a'], q['a'])
        if rec <= 0: continue
        oq = norm(q['txt'])
        m = difflib.SequenceMatcher(a=oq, b=np, autojunk=False).find_longest_match(
            0, len(oq), 0, len(np))
        # part de l ancien plan qui se retrouve dans le nouveau, et a quel mot
        part = m.size / max(1, len(oq))
        k = (round(part, 2), -m.b, rec)   # -m.b : celui qui commence le plan gagne
        if cle is None or k > cle: best, cle = q, k
    if best and pareil(p['txt'], best['txt']) >= SEUIL:
        corr[p['n']] = best['n']
    else:
        inedits.append(p['n'])

# un ancien plan ne doit pas nourrir deux nouveaux : on garde le recouvrement
# le plus fort et le second devient un plan a re-annoter
vus = {}
for n, o in sorted(corr.items()):
    vus.setdefault(o, []).append(n)
doublons = {o: v for o, v in vus.items() if len(v) > 1}

json.dump({'nouveau_vers_ancien': corr, 'inedits': inedits,
           'anciens_scindes': doublons},
          open(os.path.join(VOIX, 'correspondance-plans.json'), 'w'),
          indent=1, ensure_ascii=False)

print("%d plans (avant : %d)" % (len(new), len(old)))
print("%d repris de l ancienne numerotation" % len(corr))
print("%d anciens plans scindes en deux : %s" % (len(doublons), sorted(doublons)))
print("\n%d plans a annoter — narration retrouvee ou trop remaniee :" % len(inedits))
for n in inedits:
    p = new[n-1]
    print("  %03d  %7.2f-%7.2f  %s" % (p['n'], p['a'], p['b'], p['txt']))


# ------------------------------------------------------- les 8 a la main
# Les plans que le recouvrement ne peut pas trancher. Six sortent des fenetres
# retrouvees : ils portent les deux verdicts A que l ancien montage n avait
# pas, et les deux ouvertures de segment qui allaient avec.
#
# Les notes sont ecrites pour le detecteur de `plan.py:element()` : « PLEIN
# ECRAN » donne un carton titre, « VERDICT X » un carton verdict, « CITATION »
# une citation. Ne pas melanger deux de ces mots dans une meme note.
MAIN = {
 44: ("CLIP", "the car stands up",
      "Le plan fondateur : la voiture qui se leve. Plan long."),
 45: ("MOTION", "",
      "RETROUVE. Citation a l'ecran : C'EST SIMPLE, C'EST UNIVERSEL. Typo machine "
      "a ecrire. Cette phrase n'existait pas dans l'ancien montage."),
 46: ("MOTION", "",
      "VERDICT A. Transformers 2007. RETROUVE — la phrase du verdict etait coupee. "
      "La vignette glisse dans la case A, puis le wipe part sur « Deux ans plus "
      "tard, tout part en fumee »."),
 47: ("MOTION", "",
      "RETROUVE. Wipe arc-en-ciel, puis la fiche film REVENGE OF THE FALLEN 2009 "
      "en plein ecran. Bandeau : greve des scenaristes 2007-2008."),
 69: ("CLIP", "I saved the world twice",
      "Plan de Sam qui rappelle ce qu'il a fait. Fusion de deux anciens plans : "
      "c'est celui qui ouvre le plan qui donne l'image."),
 78: ("CLIP", "Ironhide dies",
      "Plan de la mort d'Ironhide, coupe volontairement trop tot. Le texte dit "
      "« la digerer » — l'ancien SRT avait transcrit « l'exagerer »."),
 79: ("MOTION", "",
      "VERDICT A. Dark of the Moon. RETROUVE. Vignette dans la case A sous "
      "Transformers 2007, puis le wipe part sur « Et ensuite, le vide »."),
 80: ("MOTION", "",
      "RETROUVE. Fiche film AGE OF EXTINCTION 2014 en plein ecran, puis le chiffre "
      "2 H 45 qui s'ecrase par-dessus : plus long que la majorite des films primes."),
 141:("CLIP", "Orion Pax and D-16 friendship",
      "Plan de la relation centrale."),
}

# on repart TOUJOURS de l archive, jamais de annot.py qui vient d etre reecrit :
# relancer le script deux fois donnerait sinon n importe quoi
import importlib.util
_s = importlib.util.spec_from_file_location('annot_ancien',
        os.path.join(VOIX, 'annot-ancien-156.py'))
_m = importlib.util.module_from_spec(_s); _s.loader.exec_module(_m)
A = {a[0]: a for a in _m.A}
assert len(A) == len(old), "annot-ancien-156.py et plans-remappes.json ne concordent pas" 

lignes = []
for p in new:
    if p['n'] in MAIN:
        typ, q, note = MAIN[p['n']]
    else:
        _, typ, q, note = A[corr[p['n']]]
    lignes.append((p['n'], typ, q, note))

def lit(x):
    return '"' + x.replace('\\', '\\\\').replace('"', '\\"') + '"'

sortie = ['# -*- coding: utf-8 -*-',
          '# (num, type, query, note)',
          '# Renumerote sur voix.srt par renumerote.py — %d plans.' % len(lignes),
          '# Les plans marques RETROUVE portent la narration que le master tronquait.',
          'A = [']
for i, (n, typ, q, note) in enumerate(lignes):
    if i and lignes[i-1][0] < 9 <= n: sortie.append('')
    sortie.append('(%d,%s,%s,%s),' % (n, lit(typ), lit(q), lit(note)))
sortie.append(']')
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'annot.py'), 'w',
     encoding='utf-8').write('\n'.join(sortie) + '\n')

# les bornes de segment de plan.py sont des numeros de plan de verdict
VERDICTS_ANCIENS = [29, 45, 62, 79, 91, 104, 119, 131, 146]
FORCE = {45: 46, 79: 79}          # les deux verdicts retrouves, poses a la main
inverse = {}
for n, o in corr.items(): inverse.setdefault(o, []).append(n)
nouveaux = [FORCE.get(v, min(inverse.get(v, [v]))) for v in VERDICTS_ANCIENS]

json.dump({str(o): sorted(v) for o, v in sorted(inverse.items())},
          open(os.path.join(VOIX, 'ancien-vers-nouveau.json'), 'w'),
          indent=1, ensure_ascii=False)

print("\nannot.py reecrit : %d annotations" % len(lignes))
print("bornes de segment pour plan.py (FILMS[...][4]) :")
print("   anciennes %s" % VERDICTS_ANCIENS)
print("   nouvelles %s" % nouveaux)
print("table ancien -> nouveau : voix/ancien-vers-nouveau.json")

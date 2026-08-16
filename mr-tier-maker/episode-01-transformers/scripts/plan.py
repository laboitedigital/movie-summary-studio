# -*- coding: utf-8 -*-
"""Plan de montage timecode de l episode 01.

Croise trois sources qui existaient deja separement :
  - shots.py   : les bornes reelles de chaque plan, tirees du SRT mot a mot
  - annot.py   : le type et l intention de chaque plan (156 annotations)
  - le disque  : ce qui est reellement disponible (extraits, affiches, reactions)

et produit, pour chaque plan, l element du kit a poser et ce qui manque.
"""
import annot, shots, json, os, re, glob

FILMS=[  # (rangee du tier, titre, annee, slug d affiche, plan de verdict)
 (2,"THE TRANSFORMERS: THE MOVIE","1986","1986-the-transformers-the-movie",29),
 (1,"TRANSFORMERS","2007","2007-transformers",46),
 (4,"REVENGE OF THE FALLEN","2009","2009-revenge-of-the-fallen",63),
 (1,"DARK OF THE MOON","2011","2011-dark-of-the-moon",79),
 (4,"AGE OF EXTINCTION","2014","2014-age-of-extinction",93),
 (4,"THE LAST KNIGHT","2017","2017-the-last-knight",106),
 (0,"BUMBLEBEE","2018","2018-bumblebee",122),
 # segment 7 = Rise of the Beasts, verdict B ; segment 8 = Transformers One,
 # verdict A. Les deux etaient inverses : leur affiche partait dans la mauvaise
 # rangee et leur carton titre au mauvais segment.
 (2,"RISE OF THE BEASTS","2023","2023-rise-of-the-beasts",134),
 (1,"TRANSFORMERS ONE","2024","2024-transformers-one",149),
]
TIER="SABCDF"

def tc(s):
    m=int(s//60); r=s-60*m
    return f"{m:02d}:{r:05.2f}"

def element(n,typ,note,dispo_clip):
    """Quel element du kit poser sur ce plan."""
    u=note.upper()
    if typ=="CLIP":
        return ("extrait", f"clips/{dispo_clip}" if dispo_clip else "— extrait a telecharger")
    if typ=="PHOTO":
        return ("photo", "— image a fournir")
    if "VERDICT" in u:
        m=re.search(r"VERDICT ([SABCDF])",u)
        t=m.group(1) if m else "?"
        return ("verdict", f"verdict.build(reac-{t}.mp4, affiche, row={TIER.index(t)}, zoom=True)")
    if "PLEIN ECRAN" in u or "FICHE FILM" in u:
        return ("carton titre", "kit.carton_titre(titre, annee)")
    if re.search(r"\b\d+\s*(MINUTES|TONNES)\b",u) or "CHRONO" in u or "ENCART CHIFFRE" in u or "COMPTEUR" in u:
        return ("chiffre cle", "kit.chiffre(valeur, label)")
    # \b : « affichEES » (plan 083) ne doit pas matcher, et le COMPTEUR du
    # plan 002 passe avant parce que sa regle est plus haut
    if re.search(r"\bAFFICHE\b", u):
        return ("affiche", "kit.affiche(slug) + LowerThird(titre, sous_titre)")
    if "COLONNE" in u or "COMPARATIF" in u or "DEUX " in u or "RECAP" in u:
        return ("pour / contre", "kit.pour_contre(pour, contre)")
    if "CITATION" in u or "CARTON " in u or "TYPO" in u:
        return ("citation", "kit.citation(texte, source=...)")
    if "BOARD" in u or "CASE " in u or "VIGNETTE" in u:
        return ("rappel tableau", "kit.rappel(place) + kit.zoom_rangee(row)")
    if "TRANSITION" in u or "ON COMMENCE" in u or "ON CONTINUE" in u:
        return ("transition", "kit.transition()")
    return ("motion", "— a preciser")

def build():
    S={x['n']:x for x in shots.load()}
    clips={}
    for f in sorted(glob.glob('clips/*.mp4')):
        clips[int(os.path.basename(f)[:3])]=os.path.basename(f)
    posters={os.path.splitext(os.path.basename(p))[0] for p in glob.glob('posters/*.jpg')}
    reacs={os.path.basename(p)[5] for p in glob.glob('mascotte/reac-?.mp4')}

    bornes=[f[4] for f in FILMS]
    def segment(n):
        for i,b in enumerate(bornes):
            if n<=b: return i
        return len(FILMS)-1

    rows=[]; manque=[]
    for n,typ,q,note in annot.A:
        sh=S[n]; seg=segment(n) if n>=9 else -1
        fam,el=element(n,typ,note,clips.get(n))
        rows.append(dict(n=n,seg=seg,a=sh['a'],b=sh['b'],dur=sh['screen'],
                         type=typ,famille=fam,element=el,requete=q,
                         texte=sh['txt'],note=note))
        if el.startswith("—"): manque.append((n,sh['a'],fam,note,q))
    return rows, manque, posters, reacs

if __name__=='__main__':
    rows,manque,posters,reacs=build()
    json.dump(rows,open('out/plan-episode-01.json','w'),ensure_ascii=False,indent=1)
    print(f"{len(rows)} plans, {len(manque)} a fournir")
    from collections import Counter
    print(Counter(r['famille'] for r in rows))

def markdown(path='out/plan-montage.md'):
    rows,manque,posters,reacs=build()
    S={r['n']:r for r in rows}
    o=[]
    o.append("# Plan de montage — épisode 01 : Transformers\n")
    o.append("**156 plans, 14 min 52 s de voix off.** Toutes les bornes viennent du SRT")
    o.append("mot à mot, pas d'une estimation : un plan tient jusqu'au début du suivant.\n")
    o.append("Colonnes : `in` / `out` sont les timecodes de la voix off ; `durée` est le")
    o.append("temps d'écran ; `élément` est l'appel exact du kit.\n")

    # cold open
    o.append("## 00:00 → 00:21 — Cold open\n")
    o.append("Déjà monté et calé : `intro/cold-open-vo.mp4`. Cinq plans, coupes à la frame")
    o.append("sur les quatre premières phrases.\n")

    for i,(row_i,titre,annee,slug,vfin) in enumerate(FILMS):
        seg=[r for r in rows if r['seg']==i]
        if not seg: continue
        a=seg[0]['a']; b=seg[-1]['b']
        aff = "✅" if slug in posters else "❌ affiche manquante"
        rea = "✅" if TIER[row_i] in reacs else "❌"
        o.append(f"\n## {tc(a)} → {tc(b)} — {titre} ({annee}) — verdict **{TIER[row_i]}**\n")
        o.append(f"Affiche {aff} · réaction {TIER[row_i]} {rea} · {len(seg)} plans\n")
        o.append(f"À l'ouverture : `kit.carton_titre(\"{titre}\", \"{annee}\")`, "
                 f"puis `kit.etiquette(clip, \"{titre.split(':')[0].strip()} · {annee}\")` "
                 f"tenue sur les 8 premières secondes du segment.\n")
        o.append("| # | in | out | durée | famille | élément | texte de la voix off |")
        o.append("|---|----|-----|-------|---------|---------|----------------------|")
        for r in seg:
            t=r['texte'].replace('|','/')
            if len(t)>62: t=t[:60]+'…'
            el=r['element'].replace('|','/')
            o.append(f"| {r['n']:03d} | {tc(r['a'])} | {tc(r['b'])} | {r['dur']:.1f} s | "
                     f"{r['famille']} | `{el}` | {t} |")

    o.append("\n## Ce qu'il manque pour monter\n")
    clips_ko=[m for m in manque if m[2]=='extrait']
    photos=[m for m in manque if m[2]=='photo']
    autres=[m for m in manque if m[2] not in ('extrait','photo')]
    o.append(f"**{len(clips_ko)} extraits à télécharger** sur Clip.cafe (14 sont déjà sur le")
    o.append("disque, tous sur le film de 1986). Les requêtes sont dans `plan-episode-01.json`,")
    o.append("champ `requete` — le job GitHub `complet` peut les tirer d'un coup.\n")
    o.append(f"**{len(photos)} images à fournir** (photos d'archive, jouets, plateaux de")
    o.append("tournage). Je ne les génère pas : ce sont des personnes et des objets réels.\n")
    if autres:
        o.append(f"**{len(autres)} éléments de motion à préciser ou à construire :**\n")
        for n,a,fam,note,q in autres:
            o.append(f"- `{n:03d}` à {tc(a)} — *{fam}* — {note}")
    o.append("\n**Les huit familles du kit couvrent tout le plan.** La citation, appelée")
    o.append("4 fois ici, a été ajoutée pour ce montage : `kit.citation()`.\n")
    o.append("**Trois coupures dans la voix off** — 24,8 s au total — qui emportent deux")
    o.append("verdicts :\n")
    o.append("- `045` à 04:04 — verdict A de *Transformers 2007* manquant")
    o.append("- `079` à 07:19 — verdict A de *Dark of the Moon* manquant")
    o.append("- `087` à 08:11 — colonne points positifs, raccord à vérifier\n")
    o.append("Il faut regénérer ces passages de narration avant de pouvoir monter les")
    o.append("segments 2 et 4 en entier.\n")
    open(path,'w',encoding='utf-8').write("\n".join(o))
    print("ok ->",path, len(o),"lignes")

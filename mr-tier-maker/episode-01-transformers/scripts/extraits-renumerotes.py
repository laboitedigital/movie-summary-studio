# -*- coding: utf-8 -*-
"""Ce que devient chaque extrait deja telecharge apres la renumerotation.

A lancer APRES renumerote.py et plan.py : il compare l ancien plan et le
nouveau pour savoir quel fichier NNN.mp4 doit prendre quel numero.

Trois cas :
  - un ancien plan devient un nouveau  -> simple renommage ;
  - un ancien plan se scinde en deux   -> son extrait va au plan qui l ouvre,
    l autre moitie a besoin d un extrait neuf ;
  - deux anciens plans fusionnent      -> on garde l extrait de celui qui ouvre
    le plan, c est son image qui est a l ecran a la coupe. L autre est abandonne.

Sortie : scripts/renommer-extraits.sh et voix/extraits-renumerotes.json.
"""
import json, os

ICI  = os.path.dirname(os.path.abspath(__file__))
EP   = os.path.dirname(ICI)
VOIX = os.path.join(EP, 'voix')

new = {x['n']: x for x in json.load(open(os.path.join(EP, 'plan-episode-01.json'), encoding='utf-8'))}
old = {x['n']: x for x in json.load(open(os.path.join(VOIX, 'plan-ancien-156.json'), encoding='utf-8'))}
inv = json.load(open(os.path.join(VOIX, 'ancien-vers-nouveau.json'), encoding='utf-8'))

# les plans apparies a la main dans renumerote.py, qui gardent leur extrait
MANUEL = {44: 44, 69: 68, 78: 78, 141: 138}

src = {}
for o, ns in inv.items():
    o = int(o)
    if old[o]['famille'] != 'extrait': continue
    for n in sorted(ns):
        if new[n]['famille'] == 'extrait':
            src[n] = o; break
src.update(MANUEL)
assert len(set(src.values())) == len(src), "un extrait servirait deux fois"

extraits   = sorted(n for n, x in new.items() if x['famille'] == 'extrait')
manquants  = [n for n in extraits if n not in src]
bouge      = sorted(((src[n], n) for n in extraits if n in src and src[n] != n), reverse=True)
orphelins  = sorted(set(o for o, x in old.items() if x['famille'] == 'extrait') - set(src.values()))

L = ["#!/bin/sh",
     "# Renommage des extraits deja telecharges : ancienne numerotation -> nouvelle.",
     "# Le sous-titrage refait sur voix-complete.mp3 a ajoute 3 plans : tout ce qui",
     "# suit le plan 043 glisse. A appliquer dans le dossier des extraits AVANT de",
     "# les remettre dans clips/.",
     "# Ordre descendant : jamais d ecrasement d un fichier pas encore deplace.",
     "set -e", ""]
L += ["mv %03d.mp4 %03d.mp4" % (o, n) for o, n in bouge]
L += ["", "# a telecharger, plans nes d une scission : %s" % ", ".join("%03d" % n for n in manquants),
      "# abandonnes, leur plan a fusionne : %s" % ", ".join("%03d" % o for o in orphelins)]
open(os.path.join(ICI, 'renommer-extraits.sh'), 'w').write("\n".join(L) + "\n")
json.dump({"reutilises": {str(n): src[n] for n in sorted(src)},
           "a_telecharger": manquants, "abandonnes": orphelins},
          open(os.path.join(VOIX, 'extraits-renumerotes.json'), 'w'), indent=1)

print("extraits au plan : %d   reutilisables : %d   a telecharger : %d"
      % (len(extraits), len(src), len(manquants)))
for n in manquants:
    print("   %03d  %-32s %s" % (n, new[n]['requete'][:32], new[n]['texte'][:52]))
print("abandonnes (plans fusionnes) : %s" % orphelins)
print("%d renommages -> scripts/renommer-extraits.sh" % len(bouge))

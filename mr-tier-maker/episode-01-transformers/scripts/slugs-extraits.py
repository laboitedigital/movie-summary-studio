# -*- coding: utf-8 -*-
"""Quel clip Clip.cafe se trouve derriere chaque plan.

Les trois runs GitHub ne laissent leur trace que dans leur log et dans le
rapport.json de leur artefact. Sans cette table, un run partiel ne sait pas ce
qui est deja pris et rechoisit le clip du plan voisin : la recherche semantique
converge, c est le piege connu du projet. Les slugs sont donc recopies ici,
depuis les logs des runs 31928598104 (tous les films), 31948946566 (segment 5)
et 31949254257 (segment 6). Les deux derniers remplacent le premier.

Les rattrapages faits APRES la renumerotation sont deja en nouvelle
numerotation : ils vont dans RATTRAPAGES, pas dans les trois blocs du haut.

Sortie : voix/slugs-extraits.json, en NOUVELLE numerotation, et la liste des
plans encore sans extrait — a passer en EXCLURE= lors d un rattrapage.
"""
import json
GRAND = """003 gipsy-is-command-be-advised-that-have-a-rogue-jaeger
009 framed-in-enamel
010 it-the-year-2005
011 first-crack-the-shell
012 and-these-shall-be-minions
014 guns-arent-exactly-friendly
015 a-dramatic-affliction-compromised-our-trusted-department-store
016 and-every-other-autobot
017 destroy-devastator
018 destroy-unicron
022 the-battles-over-but-the-war-just-begun
023 were-under-attack-s3
025 theres-a-hole-in-the-shuttle
026 you-have-failed-no-unicron
032 autobots-roll-out-we-rolling
033 decepticons-attack-hit-it
036 bring-the-rain-all-right
037 oh-my-god-s6
038 get-get-get-get-it
039 i-aint-never-seen-in-life
040 humans-dont-deserve-live
042 at-time-cant-confirm-whether-there-any-survivors
043 we-heard-talking-somebody-sam
044 go-go-go-go
047 bee-you-hate-i-understand
048 and-now-were-underneath-the-moon-the-stars
049 all-decepticon-life-i-never-did-a-thing-worth-doing-now
050 holy-mother
051 earth-earth
054 die-like-brothers
055 boy-returned-me
057 here-comes-s4
058 bad-ass-ice-cream-truck-coming-through
059 cover-optimus
061 awesome-i-think-aliens-built-that
064 decepticons-will-never-leave-planet-alone
066 here-are-s12
067 sam-i-think-an-interview-should-wear-real-pants
068 everybody-stay-calm-youre-gonna-be-fine
069 thats-car-s3
070 epps-you-are-ridiculous
071 hey-sentinel
072 commencing-transport-s1
073 defenders-of-earth-s1
074 so-humans-are-working-the-decepticons
076 about-mystery-raid-in-the-middle-east
077 decepticon-punk-s2
078 this-gun-my-perfect-invention-ironhide
080 human-beings-bunch-of-backstabbin-weasels
081 cade-i-am-in-debt
083 so-what-about-the-deal-is-done
084 cade-relax-youre-going-have-an-aortic-infarction
085 calling-all-autobots-s1
086 they-slaughtered-ratchet-s1
088 autobots-decepticons
089 and-later-truck-comes-haul-off
090 brave-warriors-s1
092 drop-the-cruiser-right-now
095 lam-optimus-prime
097 go-go-go-s51
098 because-of-that
101 i-making-the-moment-more-epic
107 after-i-kill-you-i-kill-her
108 where-optimus-prime-s1
111 leave-alone-you-dont-understand
112 where-are-going-wherere-going-dear
115 bumblebee-2018
116 you-kept-planet-safe
117 bumblebee-2018-s1
121 sentinel-the-betrayer-dead
122 yeah-she-my-cuff-key
123 b-127-knives-coming-out-of-the-ceiling-amazing
125 and-destroy-studio-one
127 santas-brother-have-a-name-or-is-just-santas-brother
128 hey-easy-easy
129 yes-s935
130 a-queen-buff-tailed-bumblebee
135 dont-prime-i-can-give-everything-want
136 heres-the-plan-s4
137 bee
138 autobots-must-be-using-their-new-pets-reach-the-temple
139 metallic-whining
140 at-least-the-foot-soldiers-took-the-bait-yeah-scourge-didnt
143 dont-be-frightened-humans
144 any-sign-of-scourge-nope-all-clear-here
145 benefits-of-serving-the-almighty-unicron
153 as-will-those-strong-enough-ever-pose-a-threat
154 hey-are-sure-can-take-off"""
SEG5 = """092 drop-the-cruiser-right-now
093 your-so-called-magician-merlin-cannot-help-us
095 lam-optimus-prime
097 go-go-go-s51
098 because-of-that
099 quintessa-get-off-our-planet
100 your-war-doomed-cybertron-s1
101 i-making-the-moment-more-epic"""
SEG6 = """107 after-i-kill-you-i-kill-her
108 where-optimus-prime-s1
109 bumblebee-2018
111 leave-alone-you-dont-understand
112 where-are-going-wherere-going-dear
113 charlie-there-is-like-a-million-guys-out-there
114 no-dont-run-do-not-run
115 bumblebee-2018-s1
116 you-kept-planet-safe
117 please
118 they-literally-call-themselves-decepticons-s1"""

# rattrapages, run 31951727721 — deja en NOUVELLE numerotation
RATTRAPAGES = """085 there-one-way-survive-s1
111 lets-do-this-s17"""

def lire(t):
    d={}
    for l in t.strip().splitlines():
        n,s=l.split(); d[int(n)]=s
    return d

anciens={}
anciens.update(lire(GRAND)); anciens.update(lire(SEG5)); anciens.update(lire(SEG6))
print("slugs connus, ancienne numerotation : %d"%len(anciens))
print("distincts : %d"%len(set(anciens.values())))

new={x['n']:x for x in json.load(open('plan-episode-01.json',encoding='utf-8'))}
old={x['n']:x for x in json.load(open('voix/plan-ancien-156.json',encoding='utf-8'))}
ren=json.load(open('voix/extraits-renumerotes.json',encoding='utf-8'))
src={int(k):v for k,v in ren['reutilises'].items()}   # nouveau -> ancien

table={}
for n in sorted(x for x in new if new[x]['famille']=='extrait'):
    o=src.get(n)
    if o is not None and o in anciens: table[n]=anciens[o]
table.update(lire(RATTRAPAGES))
sans=[n for n in sorted(x for x in new if new[x]['famille']=='extrait') if n not in table]
print("\nextraits au plan : %d   avec un slug connu : %d"%(
      sum(1 for x in new.values() if x['famille']=='extrait'), len(table)))
print("sans extrait :")
for n in sans:
    print("   %03d  seg %s  %-34s %s"%(n,new[n]['seg'],new[n]['requete'][:34],new[n]['texte'][:48]))
d=len(table)-len(set(table.values()))
print("doublons dans la table : %d"%d)
json.dump({str(k):v for k,v in sorted(table.items())},
          open('voix/slugs-extraits.json','w'),indent=1,ensure_ascii=False)

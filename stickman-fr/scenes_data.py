# -*- coding: utf-8 -*-
S = []
def s(fr, env, chars, action):
    S.append({"fr": fr, "env": env, "chars": chars, "action": action})

# ---------- BEATS 1-12 : L'ENIGME D'OUVERTURE ----------
s("Deux créateurs appuient sur publier au même instant, dans deux chambres identiques.",
  "SCENE AND ENVIRONMENT: A wide night-time split view of two small bedroom studios standing side by side like two halves of one room, separated by a thin vertical wall of light. The left room is lit by a warm orange desk lamp, the right room by cold blue monitor glow. Both rooms have cluttered desks, cable coils, posters, and a window showing a deep blue city skyline with scattered lit windows and low storm clouds.",
  "CHARACTERS: Two stick figures, one in each room, seated at their desks in identical postures, mirrored. Leo sits at the left desk in his heather grey hoodie and red sneakers, leaning toward his screen with eyebrows raised in hope. The second creator on the right wears an olive green bomber jacket and black trousers, same eager posture, mouth slightly open.",
  "KEY ACTION AND FOCAL POINT: Both characters press a large glowing upload button on their screens at exactly the same moment, and two identical beams of pale light shoot upward from both monitors toward the ceiling. The viewer's eye is pulled to the perfect symmetry of the two identical gestures."),

s("Le compteur du premier créateur explose à un million de vues.",
  "SCENE AND ENVIRONMENT: The right bedroom studio at night, seen slightly from below, drowned in cold blue and cyan monitor light. Behind the desk the wall is covered with a huge projected counter made of glowing digits. Storm clouds churn outside the window and blue light spills across the floor in long streaks.",
  "CHARACTERS: One stick figure, the olive green bomber jacket creator, standing up from his chair in the centre right of the frame, arms thrown wide, head tilted back, mouth wide open with teeth and tongue visible in pure joy, eyebrows shot up high. Leo appears small in the far left background behind the dividing wall, watching, tiny by comparison.",
  "KEY ACTION AND FOCAL POINT: The giant glowing counter behind him reads one million and blasts cyan light across the whole room, with motion lines radiating outward from the digits. The eye lands first on the enormous number, then on the celebrating figure beneath it."),

s("Le compteur de Léo s'arrête, dix fois plus petit.",
  "SCENE AND ENVIRONMENT: The left bedroom studio at night, warm amber lamp light, much smaller and cosier than the neighbouring room. A modest glowing counter floats above the desk, physically ten times smaller than the giant one still glowing faintly beyond the dividing wall on the right edge of the frame.",
  "CHARACTERS: One main stick figure, Leo, seated at his desk in the centre left, hands flat on the desk, shoulders hunched forward, head tilted up at the small counter, eyebrows flat and slightly lowered, mouth a small straight line of quiet acceptance.",
  "KEY ACTION AND FOCAL POINT: Leo stares up at his own small amber counter reading one hundred thousand while the enormous cyan counter glows behind the wall. The contrast in scale between the two numbers is the focal point."),

s("Une horloge murale marque la fin du mois au-dessus des deux bureaux.",
  "SCENE AND ENVIRONMENT: A wide symmetrical shot of both bedroom studios again, now lit by cool early morning light from the window. Above the dividing wall hangs a large round wall clock with a torn paper calendar beside it, its final page curling away. Dust motes float in shafts of pale light.",
  "CHARACTERS: Two stick figures, one per room, both seated with backs to the viewer, both looking up at the clock. Leo on the left in his grey hoodie, the olive jacket creator on the right, both with heads tilted at exactly the same angle.",
  "KEY ACTION AND FOCAL POINT: The clock hands snap onto the final hour of the month and the last calendar page tears free and drifts down between the two rooms. The falling page is the eye's first target."),

s("Léo reçoit un chèque énorme, son voisin un tout petit.",
  "SCENE AND ENVIRONMENT: The dividing wall between the two studios seen from the front, warm gold light pouring from the left half, thin grey light from the right half. Two mail slots are cut into the wall, one per room, each spilling paper.",
  "CHARACTERS: Two stick figures standing facing the viewer, one on each side of the wall. Leo on the left holds a giant golden cheque almost as tall as he is, eyebrows raised, mouth open in disbelief. The olive jacket creator on the right holds a tiny grey cheque the size of a bus ticket, eyebrows slammed down, mouth open in outrage, motion lines shaking around his fists.",
  "KEY ACTION AND FOCAL POINT: The two cheques are held up side by side at the same height so the absurd size difference reads instantly. The golden cheque glows and is the brightest object in the frame."),

s("Léo, seul, fixe les deux chèques sans comprendre.",
  "SCENE AND ENVIRONMENT: A dim empty room in deep blue shadow with one hard white spotlight falling from above, creating a bright circular pool on the floor and long dramatic shadows stretching behind. The background fades into atmospheric darkness with faint floating question mark shapes barely visible in the gloom.",
  "CHARACTERS: One stick figure, Leo, standing alone in the centre of the spotlight pool, one cheque in each hand held out at arm's length, head turning between them, eyebrows twisted into a confused knot, mouth pulled sideways.",
  "KEY ACTION AND FOCAL POINT: Leo looks from one cheque to the other and back, with small motion arcs around his head showing the repeated turn. His baffled face is the focal point."),

s("Une porte de lumière s'ouvre derrière lui et éclaire la pièce.",
  "SCENE AND ENVIRONMENT: The same dark blue room, but now a tall rectangle of warm golden light has opened in the back wall like a doorway, throwing a long bright path across the floor toward the viewer. Dust and light particles drift in the beam and the shadows retreat to the corners.",
  "CHARACTERS: One stick figure, Leo, standing in the middle ground, body turned three quarters toward the new light, one hand raised to shield his eyes, the other still holding a cheque. His eyebrows lift high and his mouth opens in dawning realisation.",
  "KEY ACTION AND FOCAL POINT: The golden doorway of light opens behind him and washes over his body. The eye is pulled along the bright floor path straight to the doorway."),

s("Léo tend ses vues à un guichet et le guichetier refuse de payer.",
  "SCENE AND ENVIRONMENT: A tall marble payment counter in a grand hall lit by cold overhead lamps, with a metal grille window, brass fittings, and a heavy shuttered sign above reading nothing but a large stylised play triangle. Deep green and grey tones, long shadows on the polished floor.",
  "CHARACTERS: Two stick figures. Leo stands in the left foreground on tiptoe, pushing a thick stack of paper marked with view icons across the counter, eyebrows hopeful. Behind the grille a taller clerk figure in a burgundy uniform waistcoat and grey cap pushes the stack straight back, palm flat, eyebrows lowered, mouth a firm flat line.",
  "KEY ACTION AND FOCAL POINT: The clerk's flat palm shoves the stack of views back across the counter toward Leo, with motion lines behind the push. The rejected stack sliding back is the focal point."),

s("Le même guichetier accepte volontiers une pile de panneaux publicitaires.",
  "SCENE AND ENVIRONMENT: The same marble payment counter and grille, but now the overhead lamps have warmed to gold and a soft glow rises from behind the counter. Small stacked coins are visible through the grille and the polished floor reflects amber light.",
  "CHARACTERS: Two stick figures. The burgundy uniformed clerk leans forward through the grille with eyebrows raised and mouth open in a wide welcoming smile, both hands reaching out eagerly. Leo stands on the right in profile, watching sideways, one eyebrow up, holding a small folded advertising billboard against his chest.",
  "KEY ACTION AND FOCAL POINT: The clerk's two hands grab the small billboard and pull it through the grille while pushing a coin outward in exchange. The exchange happening at the grille is the focal point."),

s("Une publicité géante s'allume juste devant l'écran de la vidéo.",
  "SCENE AND ENVIRONMENT: A dark cinema-like space where a huge glowing video screen fills the back wall, showing a simple cartoon landscape. Directly in front of it a second, taller advertising panel has dropped from above on thick chains, blazing with orange and yellow light and completely covering the video. Dust drifts in the projector beam overhead.",
  "CHARACTERS: One stick figure, Leo, small in the lower centre foreground seen from behind, head tipped back to look up at the enormous panel, shoulders hunched, arms hanging at his sides.",
  "KEY ACTION AND FOCAL POINT: The advertising panel slams down into place in front of the video screen with impact lines and a burst of orange light around its base. The dropped panel dominates the frame."),

s("Une rangée de publicités porte des étiquettes de prix très différentes.",
  "SCENE AND ENVIRONMENT: A long gallery wall in a vast hall, lit by individual overhead spotlights, each pool of light falling on a framed advertising panel hung in a row receding into the distance. Rich teal walls, warm spotlight beams, atmospheric haze between the frames.",
  "CHARACTERS: One stick figure, Leo, walking along the row in the mid foreground, seen in profile, head turned up toward the frames, one hand lifted toward a price tag, eyebrows climbing higher with each step.",
  "KEY ACTION AND FOCAL POINT: Large hanging price tags dangle from each frame, tiny and pale on the near ones and enormous and glowing gold on the far ones. The escalating tags are the focal point."),

s("Léo écarte un rideau et découvre la machinerie cachée.",
  "SCENE AND ENVIRONMENT: A heavy deep red theatre curtain fills most of the frame, pulled open at the centre to reveal a warm brass and copper machine room behind it, full of gears, pipes, and a conveyor belt, lit by golden industrial lamps with steam drifting upward.",
  "CHARACTERS: One stick figure, Leo, standing in the left foreground in silhouette against the opening, one arm stretched out gripping the curtain edge and pulling it aside, body leaning back with the effort, head turned to look into the machinery, mouth open in surprise.",
  "KEY ACTION AND FOCAL POINT: The curtain sweeps open and golden machine light floods across Leo's body. The revealed machinery in the gap is the focal point."),

# ---------- BEATS 13-26 : LE CIRCUIT DE L'ARGENT ----------
s("Un dirigeant de marque présente son produit sous un projecteur.",
  "SCENE AND ENVIRONMENT: A polished corporate showroom with a raised circular platform, deep navy walls, tall glass panels reflecting light, and a single hard white spotlight beaming down through faint haze onto the platform centre.",
  "CHARACTERS: Two stick figures. A brand executive stands on the platform in a crisp royal blue suit jacket, red tie, and black trousers, chest pushed out, one arm extended presenting a glowing product box, eyebrows confident and level, mouth open mid-pitch. Leo watches from the shadowed lower left corner, only his head and shoulders in frame, eyebrows raised.",
  "KEY ACTION AND FOCAL POINT: The executive holds the glowing product box high in the spotlight beam so it throws light across his face. The lit box is the focal point."),

s("La marque verse un sac d'argent dans une fente de la plateforme.",
  "SCENE AND ENVIRONMENT: The base of an enormous machine wall made of brushed steel panels, rivets, and glowing indicator lights, with a wide coin slot at chest height. Warm amber light leaks from the seams and cool blue light rakes across the metal from above.",
  "CHARACTERS: Two stick figures. The royal blue suited executive stands centre frame, both arms straining as he tips a fat cream coloured money sack into the slot, legs braced apart, torso rotated with effort, mouth tight. Leo stands to the right holding his orange notebook, watching, one eyebrow raised.",
  "KEY ACTION AND FOCAL POINT: A stream of gold coins pours from the sack into the machine slot with motion lines and a warm glow rising from the opening. The pouring coins are the focal point."),

s("Un bras mécanique saisit la publicité et la fait glisser sur un rail.",
  "SCENE AND ENVIRONMENT: The interior of the same great machine, a warm brass and copper hall full of rails, pulleys, and conveyor tracks running into deep atmospheric haze. Steam vents puff from pipes and golden work lamps hang overhead.",
  "CHARACTERS: One stick figure, Leo, standing small on a walkway in the lower left, head turned up to follow the machinery, hands gripping the railing, mouth slightly open.",
  "KEY ACTION AND FOCAL POINT: A large mechanical claw arm grips a glowing orange advertising panel and swings it along an overhead rail, motion lines trailing behind. The travelling panel is the focal point."),

s("Le bras dépose la publicité exactement devant la bonne vidéo.",
  "SCENE AND ENVIRONMENT: The end of the machine hall opening onto a wall of many small glowing video screens arranged in a grid, each showing a different simple cartoon scene. One screen in the centre is far brighter than the rest and haloed in warm light.",
  "CHARACTERS: One stick figure, Leo, standing in the lower right foreground seen from behind, head tilted up, arms at his sides.",
  "KEY ACTION AND FOCAL POINT: The mechanical claw lowers the glowing orange advertising panel precisely into the slot in front of the one brightest screen, with a satisfying alignment glow at the contact point. That single lit screen is the focal point."),

s("Une pile de pièces tombe sur une balance à deux plateaux.",
  "SCENE AND ENVIRONMENT: A grand hall with a huge ornate brass balance scale standing on a stone plinth, lit from above by a warm hanging lamp, with tall dark green columns receding into shadow behind and dust drifting in the light.",
  "CHARACTERS: One stick figure, Leo, standing at the base of the plinth in the lower left, head tipped back, both hands raised in front of his chest, eyebrows lifted in anticipation, mouth a small open circle.",
  "KEY ACTION AND FOCAL POINT: A cascade of gold coins falls from above into the centre of the scale and splits into two streams heading for the two pans, motion lines tracing both arcs. The splitting coin stream is the focal point."),

s("Le plateau de la plateforme se remplit en premier.",
  "SCENE AND ENVIRONMENT: Close on the left pan of the great brass scale, heaped with gold coins and sinking heavily downward, the chain pulled taut. A tall steel machine wall with glowing indicator lights looms behind it, washing the coins in cold blue rim light against the warm lamp glow.",
  "CHARACTERS: One stick figure, Leo, small in the lower right corner, looking up at the heavy pan, eyebrows flattening, mouth pulled into a straight line.",
  "KEY ACTION AND FOCAL POINT: The heavily loaded pan drops with impact lines and a few coins bouncing off the pile. The sinking pan is the focal point."),

s("Le plateau de Léo reçoit une part plus petite mais bien réelle.",
  "SCENE AND ENVIRONMENT: Close on the right pan of the same brass scale, rising lighter into the warm lamp light, holding a neat modest stack of gold coins that glow strongly against the dark green depth behind.",
  "CHARACTERS: One stick figure, Leo, standing on tiptoe in the lower centre, both arms stretched up to cup the underside of the rising pan, eyebrows raised high, mouth open in a wide relieved smile with teeth visible.",
  "KEY ACTION AND FOCAL POINT: Leo catches the smaller stack of coins as the pan lifts toward him, a warm glow spilling over his face and hands. His lit up face under the coins is the focal point."),

s("Léo raye une question inscrite sur un grand tableau.",
  "SCENE AND ENVIRONMENT: A vast dark slate blackboard wall filling the frame, lit by a single warm work lamp clamped at the top edge, with chalk dust hanging in the beam and a rolling ladder leaning against the board on the right.",
  "CHARACTERS: One stick figure, Leo, standing on the second rung of the ladder in the centre, body rotated into the swing, one arm slashing a thick chalk line across a written question, eyebrows lowered in concentration, mouth set tight.",
  "KEY ACTION AND FOCAL POINT: A bold white chalk cross is being struck across the question, chalk dust bursting away from the stroke with motion lines. The crossing stroke is the focal point."),

s("Une foule de spectateurs identiques regarde en silence.",
  "SCENE AND ENVIRONMENT: A dark auditorium seen from the stage, rows of seats receding into blue shadow, faint spotlight haze overhead, and small screen glows dotting the crowd like fireflies.",
  "CHARACTERS: Many stick figures filling the seats in simple casual clothes of muted greys, blues, and browns, all facing forward with identical neutral expressions, eyebrows flat, mouths small lines. Leo stands alone on the lit stage edge in the lower right, seen from behind, facing the crowd.",
  "KEY ACTION AND FOCAL POINT: The entire crowd stares silently ahead in perfect stillness while Leo faces them alone. The wall of identical faces is the focal point."),

s("Léo écrit une nouvelle question, bien plus grande, sur le tableau.",
  "SCENE AND ENVIRONMENT: The same dark slate blackboard wall under the warm clamped work lamp, chalk dust drifting, the rolling ladder now positioned centre frame with a bright pool of light around the writing area.",
  "CHARACTERS: One stick figure, Leo, standing high on the ladder, stretched up on one leg with the other kicked back for balance, arm extended overhead writing in huge bold chalk letters, eyebrows raised, mouth open with concentration.",
  "KEY ACTION AND FOCAL POINT: An enormous chalk question mark is being drawn across the top of the board, far larger than everything else written there. The giant question mark is the focal point."),

s("Une marque hésite, un carnet de chèques ouvert à la main.",
  "SCENE AND ENVIRONMENT: A dim wood panelled office at night, a green banker's lamp casting a tight warm pool on a heavy desk, rain streaking the tall window behind, city lights blurred beyond the glass in cold blue.",
  "CHARACTERS: Two stick figures. The royal blue suited brand executive sits at the desk, pen hovering above an open chequebook, head tilted, one eyebrow up in calculation, mouth pressed sideways. Leo stands in the doorway on the far left, half in shadow, watching quietly.",
  "KEY ACTION AND FOCAL POINT: The pen tip hovers a hair above the blank cheque without touching it, a small glint of light on the nib. The hovering pen is the focal point."),

s("La marque tend une liasse en pointant précisément un groupe de gens.",
  "SCENE AND ENVIRONMENT: A raised balcony overlooking a crowd square at dusk, warm lantern light on the balcony rail, cool violet twilight over the crowd below, banners hanging from the balcony and a rich orange sky with layered clouds.",
  "CHARACTERS: Three stick figure groups. The blue suited executive stands at the rail centre frame, one arm thrust out pointing down at a specific cluster of people, the other hand holding out a thick banded stack of notes. Below, a dense crowd of small stick figures in muted clothes, with one cluster lit brightly by a shaft of light. Leo stands beside the executive, following the pointing arm with his eyes, eyebrows raised.",
  "KEY ACTION AND FOCAL POINT: The pointing arm and the outstretched cash line up in one straight diagonal that leads the eye down to the single lit cluster in the crowd."),

s("Deux escaliers partent du même palier, l'un plat, l'autre vertigineux.",
  "SCENE AND ENVIRONMENT: A dramatic stone landing splitting into two staircases under a stormy sky, the left staircase almost flat and short, the right staircase climbing steeply into golden light breaking through the clouds. Deep shadow in the gorge between them, wind driven mist below.",
  "CHARACTERS: One stick figure, Leo, standing at the fork in the lower centre, head turning between the two staircases, one foot lifted undecided, arms slightly out for balance, eyebrows twisted in doubt.",
  "KEY ACTION AND FOCAL POINT: The gap between the two staircases widens visibly as they climb, the right one soaring far above the left. The widening gap is the focal point."),

s("Une salle d'arcade bruyante, pleine de bornes et d'écrans.",
  "SCENE AND ENVIRONMENT: A packed neon arcade at night, rows of cabinets glowing magenta, cyan, and lime, reflections streaking across a glossy black floor, dark ceiling with hanging cables and a haze of coloured light.",
  "CHARACTERS: Several stick figures at the cabinets in bright casual clothes, hoodies and caps in neon colours, hunched over controls with excited faces. Leo stands in the centre aisle facing the viewer, hands in his hoodie pocket, looking around, eyebrows raised.",
  "KEY ACTION AND FOCAL POINT: The neon arcade signage blazes above the aisle and floods Leo with coloured light. The glowing wall of cabinets is the focal point."),

# ---------- BEATS 27-40 : LES DEUX AUDIENCES ----------
s("Des adolescents en sacs à dos remplissent toute la salle d'arcade.",
  "SCENE AND ENVIRONMENT: The same neon arcade, now shot lower and wider, cabinets glowing magenta and cyan on both sides forming a bright corridor, hazy coloured light, glossy reflective floor, dark ceiling above.",
  "CHARACTERS: A crowd of small young stick figures packed shoulder to shoulder, wearing colourful backpacks, caps turned backwards, bright hoodies in lime, orange, and purple, all leaning toward the screens with wide eyes and open mouths. Leo stands squeezed at the right edge, taller than the crowd, looking down at them, one eyebrow raised.",
  "KEY ACTION AND FOCAL POINT: The young crowd surges forward toward the cabinets in one wave with motion lines behind them. The dense mass of backpacks and caps is the focal point."),

s("Un annonceur regarde cette foule depuis la porte, peu enthousiaste.",
  "SCENE AND ENVIRONMENT: The arcade entrance seen from inside, a rectangle of cold blue street night beyond the doorway, neon spill from the cabinets painting the door frame in magenta, cigarette-like haze drifting in the light shaft.",
  "CHARACTERS: Two stick figures. A brand representative stands in the doorway in a plain slate grey suit and thin brown tie, one hand on the door frame, head tilted, eyebrows lowered in doubt, mouth pulled sideways in hesitation. Leo stands inside on the right, turning to look back at him.",
  "KEY ACTION AND FOCAL POINT: The grey suited figure leans in through the doorway without stepping inside, half lit magenta and half lit blue. His hesitant lean is the focal point."),

s("Il sort un porte-monnaie minuscule, presque vide.",
  "SCENE AND ENVIRONMENT: A tight view of the arcade doorway area, the neon glow now dimmer and cooler, background cabinets thrown out of focus into soft magenta bokeh, a single hard light from above picking out the hands.",
  "CHARACTERS: Two stick figures. The grey suited representative stands centre frame holding open a tiny coin purse with both hands, shoulders shrugged up, eyebrows raised apologetically, mouth an awkward wavy line. Leo leans in from the left, head lowered, peering into the purse, one eyebrow up.",
  "KEY ACTION AND FOCAL POINT: Two small coins sit alone in the open purse under the hard light, casting long shadows inside it. The nearly empty purse is the focal point."),

s("Mille petites silhouettes de spectateurs s'alignent devant une caisse.",
  "SCENE AND ENVIRONMENT: A long counting hall with pale teal walls, a low ceiling with rows of hanging lamps, and a mechanical counter machine at the end with a large glowing dial. Cool even light with warm pools under each lamp, receding into haze.",
  "CHARACTERS: A very long queue of small identical stick figure viewers in muted casual clothes stretching from the foreground to the machine in the far background, all facing the same way. Leo stands beside the machine at the end of the queue, hand on its lever, looking back along the line, mouth open slightly.",
  "KEY ACTION AND FOCAL POINT: The endless queue of viewers feeds one by one into the counting machine, which ticks over on its glowing dial. The receding line is the focal point."),

s("La machine ne recrache que deux ou trois pièces ternes.",
  "SCENE AND ENVIRONMENT: Close on the output tray of the counting machine, brushed steel and rivets, teal wall behind, a single overhead lamp throwing a hard cone of light onto the tray and deep shadow around it.",
  "CHARACTERS: One stick figure, Leo, crouched down in front of the tray, both hands cupped underneath it, head lowered to tray height, eyebrows dropping, mouth curving down at the corners in disappointment.",
  "KEY ACTION AND FOCAL POINT: Two dull grey coins clatter out of the tray into Leo's cupped hands with tiny impact lines and no glow at all. The pitiful pair of coins is the focal point."),

s("Un couloir de bureaux feutrés remplace l'arcade bruyante.",
  "SCENE AND ENVIRONMENT: A calm upmarket office corridor at golden hour, tall glass walls on the left showing a city skyline in warm orange light, dark wood panelling on the right, a deep navy carpet, and long warm light bars running along the ceiling into the distance.",
  "CHARACTERS: One stick figure, Leo, walking away from the viewer down the middle of the corridor, seen from behind, head turning to the left toward the glass, one hand trailing along the wood panelling.",
  "KEY ACTION AND FOCAL POINT: Leo steps out of a dark doorway into the warm corridor light, the sharp line between shadow and gold cutting across his body. That light line is the focal point."),

s("Des adultes en tenue de travail attendent, dossiers sous le bras.",
  "SCENE AND ENVIRONMENT: A wide bright waiting area with tall windows, warm late afternoon light streaming in and casting long window frame shadows across a polished stone floor, potted plants in the corners, and a city skyline beyond the glass.",
  "CHARACTERS: Several adult stick figures seated and standing in a loose row, wearing charcoal blazers, burgundy coats, dark green work jackets, and one white shirt with rolled sleeves, each holding folders, briefcases, or house keys, all with calm level eyebrows. Leo stands at the left end of the row in his grey hoodie, clearly the youngest and most casual, looking along the line.",
  "KEY ACTION AND FOCAL POINT: The row of adults waits patiently in the window light while Leo studies them from the end. The contrast between his hoodie and their formal clothes is the focal point."),

s("Un stylo s'apprête à signer un contrat épais sur une table de réunion.",
  "SCENE AND ENVIRONMENT: A dark polished boardroom table filling the lower half of the frame, a single warm pendant lamp hanging low over its centre creating a bright disc of light, deep shadows and blurred city night windows behind.",
  "CHARACTERS: Two stick figures. An adult client in a charcoal blazer and burgundy scarf leans over the table centre frame, pen gripped in one hand poised above a thick contract, other hand flat on the paper, eyebrows lowered in serious concentration. Leo stands at the far end of the table in the shadow, leaning in to watch, mouth slightly open.",
  "KEY ACTION AND FOCAL POINT: The pen tip touches the signature line and a small ink glint catches the lamp light. The pen on paper is the focal point."),

s("Le contrat signé se transforme en une tour de pièces d'or.",
  "SCENE AND ENVIRONMENT: The same boardroom table under the low pendant lamp, but the light has turned rich gold and warm particles rise through the beam, the dark background now glowing faintly at the edges.",
  "CHARACTERS: Two stick figures. The charcoal blazer client stands back from the table with both arms lowered, head tipped up, eyebrows raised. Leo stands beside him on the right, leaning back with both hands lifted to his own head, mouth wide open with teeth and tongue visible in astonishment.",
  "KEY ACTION AND FOCAL POINT: A tall column of gold coins rises out of the signed contract almost to the ceiling, coins spiralling upward with motion lines. The towering coin column is the focal point."),

s("Un banquier en costume trois pièces pose une lourde mallette sur le comptoir.",
  "SCENE AND ENVIRONMENT: A grand bank hall with marble columns, a high vaulted ceiling, brass fittings, and tall arched windows throwing cool blue daylight in wide shafts, with warm lamp pools on the counter tops and a polished floor reflecting both.",
  "CHARACTERS: Two stick figures. A banker stands behind the counter in a deep green three piece suit with a gold watch chain, both hands pressed down on a large brown leather briefcase, chest forward, eyebrows level and certain, mouth firm. Leo stands on the customer side, hands on the counter edge, head tilted back to look up at the case, eyebrows high.",
  "KEY ACTION AND FOCAL POINT: The heavy briefcase lands on the marble counter with impact lines and a puff of dust. The briefcase at the moment of landing is the focal point."),

s("Le banquier accroche son affiche juste devant la file d'adultes.",
  "SCENE AND ENVIRONMENT: The same marble bank hall, seen from a lower angle looking toward the entrance where warm daylight floods in, columns framing the shot on both sides, dust drifting in the light shafts.",
  "CHARACTERS: Three stick figure groups. The green suited banker stands on a small stepladder centre frame, arms stretched up hanging a large glowing advertising board. Below him a queue of adult stick figures in blazers and coats faces the board. Leo stands to the right of the ladder, steadying it with one hand, looking up.",
  "KEY ACTION AND FOCAL POINT: The advertising board swings into place directly in the eye line of the waiting adults, warm light spilling from it onto their faces. The board dropping into position is the focal point."),

s("La même file de mille spectateurs, mais devant une caisse dorée.",
  "SCENE AND ENVIRONMENT: The same long counting hall as before, now transformed with warm gold light, brass fittings on the machine, richer amber lamps overhead, and a deeper glow at the end of the hall.",
  "CHARACTERS: An identical long queue of stick figure viewers, but now dressed in blazers, coats, and work jackets in burgundy, charcoal, and forest green. Leo stands beside the machine at the end of the line, hand on the same lever, glancing back with one eyebrow raised in suspicion.",
  "KEY ACTION AND FOCAL POINT: The same number of figures feeds into the same machine, but the machine's dial now glows hot gold instead of pale teal. The glowing dial is the focal point."),

s("La caisse déverse un torrent de pièces d'or dans les bras de Léo.",
  "SCENE AND ENVIRONMENT: Close on the output tray of the same counting machine, now blazing with warm golden light that fills the frame and throws long dramatic shadows behind, the teal wall now lit amber, sparks of light dancing in the air.",
  "CHARACTERS: One stick figure, Leo, staggering back one step with both arms held out overflowing, legs braced apart under the weight, head thrown back, mouth wide open with teeth and tongue visible in shock, eyebrows shot up to the top of his head.",
  "KEY ACTION AND FOCAL POINT: A torrent of gold coins pours out of the tray into and past his arms, bouncing across the floor with impact lines. The cascade of coins is the focal point."),

s("Un projecteur unique éclaire Léo, doigt levé, comme pour dire voilà.",
  "SCENE AND ENVIRONMENT: A dark stage space in deep indigo with one hard white spotlight from directly above, a bright circular pool on the boards, atmospheric haze catching the beam edges, and the rest of the frame falling into rich shadow.",
  "CHARACTERS: One stick figure, Leo, standing dead centre in the pool of light, feet together, one arm raised with index finger pointed straight up, chin lifted, eyebrows raised high, mouth open in a confident open smile with teeth visible.",
  "KEY ACTION AND FOCAL POINT: Leo's raised finger catches the very centre of the spotlight beam. The lifted hand is the focal point."),

# ---------- BEATS 41-56 : LE CHOIX DU SUJET ET LE RPM ----------
s("Léo se tient sur un podium avec un petit compteur à cent mille.",
  "SCENE AND ENVIRONMENT: A sports podium under stadium floodlights at night, deep blue sky above, banks of lights flaring in the upper corners, streaks of light across a polished arena floor, faint crowd shapes in the dark stands.",
  "CHARACTERS: One stick figure, Leo, standing on the tall centre podium block, chest lifted, arms slightly out from his sides, eyebrows raised, mouth open in a surprised smile with teeth visible.",
  "KEY ACTION AND FOCAL POINT: A modest glowing counter reading one hundred thousand hovers just above his head, small but blazing bright white against the night sky. The floating counter is the focal point."),

s("Le créateur au million se retrouve sur une marche plus basse.",
  "SCENE AND ENVIRONMENT: The same floodlit arena podium, wider shot now showing both blocks, cold blue light on the lower block and warm gold light on the taller one, long shadows stretching toward the viewer.",
  "CHARACTERS: Two stick figures. Leo stands on the tall gold lit block on the left, arms out, mouth open in a smile. The olive green bomber jacket creator stands on the lower blue lit block on the right, arms hanging, shoulders collapsed inward, head dropped forward, eyebrows curved sadly, mouth pulled down.",
  "KEY ACTION AND FOCAL POINT: A giant counter reading one million floats above the lower figure and a small counter reading one hundred thousand floats above the higher one. The inverted arrangement is the focal point."),

s("Deux réveils identiques, deux piles de travail identiques.",
  "SCENE AND ENVIRONMENT: A symmetrical night interior split down the middle by a thin dark line, both halves identical, each with a desk, a warm lamp, a coffee cup, and a tall stack of papers, both windows showing the same deep blue night sky with the same moon.",
  "CHARACTERS: Two stick figures in identical exhausted postures, one per half, elbows on desks, heads propped in both hands, eyes half lidded, eyebrows flat and heavy. Leo occupies the left half in his grey hoodie, the olive jacket creator the right.",
  "KEY ACTION AND FOCAL POINT: Two identical alarm clocks on the two desks show exactly the same late hour, glowing faintly. The mirrored identical effort is the focal point."),

s("Léo choisit une porte parmi plusieurs, dans un couloir de portes colorées.",
  "SCENE AND ENVIRONMENT: A long corridor lined with many closed doors of different colours, each with a small sign above it, lit by warm ceiling lamps that grow brighter toward one specific door glowing gold at the far end, atmospheric haze deepening the perspective.",
  "CHARACTERS: One stick figure, Leo, standing in the mid corridor seen in three quarter view, one hand reaching out toward a door handle, body already leaning that way, other hand holding his orange notebook, eyebrows raised in decision.",
  "KEY ACTION AND FOCAL POINT: Leo's hand closes on the handle of the one gold glowing door while the other doors stay dark. The chosen handle is the focal point."),

s("Une file d'annonceurs en costume attend devant la porte de Léo.",
  "SCENE AND ENVIRONMENT: The outside of a single door at the end of a warmly lit hall, a bright rectangle of gold light spilling from under the door, rich blue shadows along the queue, a velvet rope line and brass stands leading away into the distance.",
  "CHARACTERS: A long queue of brand executive stick figures in royal blue, charcoal, deep green, and burgundy suits, each holding a money sack or briefcase, stretching from the door into the background, all leaning forward eagerly with raised eyebrows. Leo stands in the doorway itself, one hand on the frame, looking down the queue with his mouth open in disbelief.",
  "KEY ACTION AND FOCAL POINT: The first executive in line thrusts a fat money sack toward Leo while the rest of the queue presses forward behind him. The offered sack at the front of the line is the focal point."),

s("Une courte liste est affichée, éclairée, sur un mur autrement vide.",
  "SCENE AND ENVIRONMENT: A vast dark concrete wall stretching in every direction with one small framed list hanging at its centre, lit by a single tight spotlight from above, the surrounding wall falling away into deep atmospheric blue shadow.",
  "CHARACTERS: One stick figure, Leo, standing small in the lower centre foreground seen from behind, head tipped up, hands in his hoodie pocket, dwarfed by the empty wall.",
  "KEY ACTION AND FOCAL POINT: The single small lit list floats in the middle of an enormous empty wall. The isolated pool of light on the list is the focal point."),

s("Le même mur, mais on découvre que la liste ne change jamais d'une année à l'autre.",
  "SCENE AND ENVIRONMENT: The same dark concrete wall, now revealed to hold a long receding row of identical framed lists disappearing into the haze, each with a different dated plaque beneath it, each lit by its own small spotlight.",
  "CHARACTERS: One stick figure, Leo, walking away from the viewer along the row in the mid ground, head turned to the frames, one arm out running his fingertips past them, shoulders relaxed in recognition.",
  "KEY ACTION AND FOCAL POINT: Every framed list down the entire receding row is exactly identical. The endless repetition is the focal point."),

s("Quatre enseignes lumineuses s'allument l'une après l'autre.",
  "SCENE AND ENVIRONMENT: A night street corner in the rain, wet asphalt reflecting colour, four tall illuminated shop signs stacked up the side of a building, a coin symbol, a shield, a house, and a circuit board, each glowing a different saturated colour of gold, red, blue, and green against a stormy purple sky.",
  "CHARACTERS: One stick figure, Leo, standing on the wet pavement in the lower left, head tipped far back, one hand shielding his eyes from the rain, mouth open in awe, coloured light washing across his hoodie.",
  "KEY ACTION AND FOCAL POINT: The four signs blaze at full brightness together and their reflections streak down the wet street toward the viewer. The stacked signs are the focal point."),

s("Trois autres enseignes s'allument sur le bâtiment d'en face.",
  "SCENE AND ENVIRONMENT: The opposite side of the same rainy night street, three more tall illuminated signs on a second building, a medical cross, a set of scales, and an aeroplane, glowing white, deep amber, and turquoise, the rain now heavier with streaks catching the light and the purple sky rumbling above.",
  "CHARACTERS: One stick figure, Leo, standing centre frame in the road seen from behind, turning to face the second building, arms lifting slightly away from his body, head tilted up.",
  "KEY ACTION AND FOCAL POINT: The three new signs snap on at once, throwing a fresh wave of coloured light across the flooded road. The sudden illumination is the focal point."),

s("Léo soulève l'un des mots comme on soulève une trappe.",
  "SCENE AND ENVIRONMENT: A dark floor made of enormous stone letters, lit by a low raking amber light that carves deep shadows between them, with atmospheric mist pooling in the gaps and a warm glow leaking upward from below one letter.",
  "CHARACTERS: One stick figure, Leo, crouched low centre frame, both hands gripping the edge of one giant letter and hauling it upward, legs bent and torso rotated with the strain, eyebrows lowered in effort, mouth open with exertion.",
  "KEY ACTION AND FOCAL POINT: A bright golden shaft of light bursts out of the widening gap beneath the lifted letter and hits Leo's face. The escaping light is the focal point."),

s("Sous le mot, une marque entière est cachée avec ses bureaux.",
  "SCENE AND ENVIRONMENT: An underground chamber revealed beneath the giant letters, warm and richly lit, containing a miniature corporate world of small glass offices, glowing windows, tiny lamps, and a soft golden haze, with the raised stone letter forming a ceiling above.",
  "CHARACTERS: Two stick figures. The royal blue suited brand executive stands in the middle of the miniature offices looking up toward the opening, one arm raised in greeting, eyebrows up, mouth open in a broad welcome. Leo's head and shoulders lean in through the gap above, upside down in the frame, mouth open in surprise.",
  "KEY ACTION AND FOCAL POINT: Leo's face appears in the opening above the hidden company as the executive waves up at him. The meeting of the two faces across the gap is the focal point."),

s("La marque montre une immense montagne de gains potentiels.",
  "SCENE AND ENVIRONMENT: A high vantage point overlooking a vast golden valley at sunrise, an enormous mountain of stacked gold coins rising in the distance, warm orange light breaking over its peak, layered clouds and long shadows across the valley floor.",
  "CHARACTERS: Two stick figures. The blue suited executive stands on the ledge in the left foreground, one arm swept wide presenting the view, chest out, eyebrows raised proudly. Leo stands beside him on the right, both hands on his head, mouth wide open with teeth and tongue visible, eyebrows shot up in stunned reaction.",
  "KEY ACTION AND FOCAL POINT: The executive's sweeping arm leads the eye straight to the sunlit coin mountain. The mountain peak catching the sunrise is the focal point."),

s("La marque ouvre une valise pleine de billets pour aller la chercher.",
  "SCENE AND ENVIRONMENT: The same ledge above the golden valley, now shot close and low, warm sunrise light raking across a flat stone surface, the coin mountain glowing softly out of focus in the background.",
  "CHARACTERS: Two stick figures. The blue suited executive kneels on one knee behind a large open briefcase, both hands on its lid, head lifted toward Leo, eyebrows level and businesslike, mouth in a confident closed smile. Leo crouches opposite, leaning in over the case, hands on his knees, eyes wide.",
  "KEY ACTION AND FOCAL POINT: The briefcase lid swings open and warm gold light floods out of it across both characters' faces. The opening case is the focal point."),

s("Un chiffre unique flotte au-dessus d'une pile de mille vues.",
  "SCENE AND ENVIRONMENT: A dark studio space in deep navy with a single wide beam of warm light falling from above onto a low pedestal, the rest of the room dissolving into atmospheric shadow, faint floating dust in the beam.",
  "CHARACTERS: One stick figure, Leo, standing beside the pedestal in three quarter view, one hand resting on its edge, the other pointing up at the floating number, eyebrows raised, mouth slightly open in explanation.",
  "KEY ACTION AND FOCAL POINT: A single large glowing number hovers above a neat stack of a thousand small view icons on the pedestal. The floating number is the focal point."),

s("Une plaque gravée est dévoilée sous le chiffre.",
  "SCENE AND ENVIRONMENT: The same dark navy studio and warm overhead beam, now with a polished brass plaque mounted on the front face of the pedestal, catching a bright specular highlight, a small red velvet cloth sliding off it.",
  "CHARACTERS: One stick figure, Leo, standing behind the pedestal with both arms sweeping outward, having just pulled the cloth away, torso rotated with the motion, eyebrows raised high, mouth open in a proud announcing shape.",
  "KEY ACTION AND FOCAL POINT: The red cloth flies away with motion lines and the brass plaque flashes under the beam. The revealed plaque is the focal point."),

s("Trois lettres géantes en néon s'allument dans le noir.",
  "SCENE AND ENVIRONMENT: A pitch dark space where three enormous freestanding neon letters stand in a row, glowing hot amber gold, their light spilling in wide pools across a wet reflective black floor, thin haze in the air amplifying the glow, deep shadow everywhere else.",
  "CHARACTERS: One stick figure, Leo, standing small at the base of the letters in the lower centre, seen from behind, arms slightly raised, head tipped back, dwarfed by their scale.",
  "KEY ACTION AND FOCAL POINT: The three letters ignite together and their reflection burns across the wet floor toward the viewer. The blazing letters are the focal point."),

# ---------- BEATS 57-72 : CPM CONTRE RPM, ET LA PORTE ----------
s("Un second néon presque identique s'allume à côté du premier.",
  "SCENE AND ENVIRONMENT: The same pitch dark hall with the wet reflective black floor, now holding two sets of enormous neon letters side by side, the left one glowing amber gold and the right one glowing cold electric blue, their two coloured reflections overlapping in the middle of the floor and mixing into green.",
  "CHARACTERS: One stick figure, Leo, standing between the two sets in the lower centre, head snapping to the right toward the new letters, one arm flung out for balance, eyebrows knotted, mouth pulled sideways in confusion.",
  "KEY ACTION AND FOCAL POINT: The second set of letters flares on and its cold blue light cuts across Leo's face, splitting it into warm and cool halves. The lit half of his face is the focal point."),

s("Une foule entière court vers le mauvais des deux néons.",
  "SCENE AND ENVIRONMENT: The same dark hall in a wide shot, the two neon words standing far apart, the blue one much larger and brighter and drawing everything toward it, haze thick with coloured light, wet floor streaked with running reflections.",
  "CHARACTERS: A crowd of small stick figures in mixed casual clothes sprinting from right to left toward the blue letters, bodies leaning far forward, arms pumping, legs blurred with motion lines, mouths open in excitement. Leo stands alone in the right foreground, arm outstretched toward them, mouth open in warning, eyebrows lifted.",
  "KEY ACTION AND FOCAL POINT: The whole crowd streams past Leo toward the bright blue word while he reaches after them in vain. The rushing crowd is the focal point."),

s("L'annonceur pose une grosse somme sur la table de départ.",
  "SCENE AND ENVIRONMENT: A long dark wooden table lit by a single low hanging lamp at its near end, the far end fading into shadow, deep burgundy walls behind, warm dust drifting in the lamp cone.",
  "CHARACTERS: Two stick figures. The royal blue suited executive stands at the near end of the table, both hands pressing a tall stack of banknotes down onto the wood, torso leaning into the push, eyebrows level, mouth firm. Leo waits at the far dark end of the table, only faintly lit, watching, hands on the table edge.",
  "KEY ACTION AND FOCAL POINT: The tall stack of notes lands under the lamp with impact lines, the brightest object in the frame at the start of the table."),

s("La somme glisse le long de la table vers Léo, en rétrécissant.",
  "SCENE AND ENVIRONMENT: The same long dark table shot down its length, a row of hanging lamps now lighting the whole run, each pool of light slightly cooler than the last, deep shadow beyond the edges and warm haze above.",
  "CHARACTERS: One stick figure, Leo, standing at the near end of the table in the foreground, both hands cupped ready on the wood, leaning forward, eyebrows raised in anticipation, mouth a small open circle.",
  "KEY ACTION AND FOCAL POINT: The stack of notes slides along the table toward Leo with speed lines behind it, visibly smaller in each pool of light it crosses. The shrinking stack in motion is the focal point."),

s("Une petite somme atterrit enfin dans un compte en banque ouvert.",
  "SCENE AND ENVIRONMENT: A warm intimate corner of a room at night, a small wooden desk with an open ledger book and a soft amber desk lamp, a window behind showing a calm dark blue night with a few city lights and a low moon.",
  "CHARACTERS: One stick figure, Leo, seated at the desk in three quarter view, both hands flat on either side of the open ledger, head lowered toward it, eyebrows relaxed and level, mouth a small satisfied closed smile.",
  "KEY ACTION AND FOCAL POINT: A modest neat stack of coins settles onto the open ledger page with a soft glow around it. The coins on the page are the focal point."),

s("Un péage géant prélève sa part au milieu du trajet.",
  "SCENE AND ENVIRONMENT: A huge toll gate structure straddling the dark table road, built of steel and rivets with glowing indicator lights and a heavy counterweighted barrier arm, cold blue light beneath the arch and warm light on the far side, steam venting from the sides.",
  "CHARACTERS: Two stick figures. A toll operator in a burgundy uniform waistcoat and grey cap leans out of a small booth window, one arm scooping a large portion off the sliding stack of notes, eyebrows level and businesslike. Leo stands beyond the barrier on the far side, hands on hips, head tilted, mouth pulled flat in resignation.",
  "KEY ACTION AND FOCAL POINT: The operator's arm sweeps a thick slice off the top of the stack as it passes under the arch. The scooping arm is the focal point."),

s("Un débutant, yeux écarquillés, ne regarde que le grand chiffre bleu.",
  "SCENE AND ENVIRONMENT: A dark room lit almost entirely by the cold blue glow of an enormous number filling the back wall, cyan light washing across the floor and ceiling, everything else sunk in deep shadow with faint blue rim highlights.",
  "CHARACTERS: Two stick figures. A beginner creator in a bright yellow t-shirt and blue cap stands centre frame facing the wall, arms hanging loose, head tilted far back, eyes enormous, mouth hanging wide open with teeth and tongue visible, entirely bathed in blue light. Leo stands behind him in the right foreground in shadow, one hand half raised as if to tap his shoulder, eyebrows drawn together in concern.",
  "KEY ACTION AND FOCAL POINT: The beginner stares up hypnotised at the giant blue number while Leo hesitates behind him. The upturned entranced face is the focal point."),

s("Le débutant se voit déjà en millionnaire, dans une bulle rêvée.",
  "SCENE AND ENVIRONMENT: The same blue lit room, but a large soft edged dream bubble now floats above the beginner, filled with warm golden light showing a tiny sunlit scene of a sports car, a palm tree, and coin piles, its warm colour clashing against the surrounding cold blue.",
  "CHARACTERS: Two stick figures. The yellow t-shirt beginner floats up onto his toes, arms spread wide, head tipped back, mouth open in a huge joyful smile with teeth visible. Leo watches from the lower right, one eyebrow up, mouth pulled to one side in doubt.",
  "KEY ACTION AND FOCAL POINT: The golden dream bubble swells above the beginner's head, warm light spilling down onto him. The glowing bubble is the focal point."),

s("La bulle éclate et seul le petit chiffre doré reste, bien réel.",
  "SCENE AND ENVIRONMENT: The same room, the giant blue number now switched off and dark, the walls cool and empty, with one small warm gold number glowing quietly at chest height in the centre, its little pool of amber light the only illumination.",
  "CHARACTERS: Two stick figures. The yellow t-shirt beginner stands with shoulders collapsed, head dropped forward, arms limp, eyebrows curved down, mouth pulled small. Leo stands beside him with one hand placed on his shoulder, head turned toward him, eyebrows raised gently, mouth calm and level.",
  "KEY ACTION AND FOCAL POINT: Bubble fragments drift and fade around them while the small gold number holds steady. The small steady number is the focal point."),

s("Léo tend la main vers une pièce posée hors de portée.",
  "SCENE AND ENVIRONMENT: A dim stone chamber in deep blue shadow with a single narrow shaft of warm light falling from a high window onto a raised stone plinth in the centre, dust turning slowly in the beam, the walls fading into darkness.",
  "CHARACTERS: One stick figure, Leo, stretched out at full extension toward the plinth, one leg trailing behind, torso leaning far forward, one arm reaching with fingers splayed, eyebrows knotted with effort, mouth open with strain.",
  "KEY ACTION AND FOCAL POINT: A single glowing coin sits on the plinth just beyond his fingertips, a small gap of light between hand and coin. That gap is the focal point."),

s("Une porte massive et verrouillée barre le chemin.",
  "SCENE AND ENVIRONMENT: An enormous iron door set into a towering stone wall that runs out of frame in every direction, lit by two flanking torches whose orange flame light flickers across the rivets and hinges, deep blue night above the wall, cold mist at the base of the door.",
  "CHARACTERS: One stick figure, Leo, standing directly in front of the door in the lower centre, tiny against it, both palms pressed flat on the iron, head tipped back, shoulders hunched, eyebrows raised in dismay.",
  "KEY ACTION AND FOCAL POINT: The vast sealed door towers over him with its two great locks catching the torchlight. The locked door face is the focal point."),

s("Deux énormes verrous numérotés maintiennent la porte fermée.",
  "SCENE AND ENVIRONMENT: A close view of the centre of the same iron door, torch flames flaring at both edges of the frame and throwing dancing orange light and hard shadows across the metal, cold blue rim light from above, embers drifting upward.",
  "CHARACTERS: One stick figure, Leo, standing on tiptoe in the lower centre, one hand gripping the lower lock, the other reaching up toward the higher one, body stretched into a long diagonal, mouth open with effort, eyebrows lowered in determination.",
  "KEY ACTION AND FOCAL POINT: Two massive engraved padlocks hang side by side on the door, one at chest height and one far above his reach, both glinting in the firelight. The pair of locks is the focal point."),

s("Léo pousse la porte de toutes ses forces, sans qu'elle bouge.",
  "SCENE AND ENVIRONMENT: The same iron door and torchlit stone wall, shot from the side so the door forms a flat wall on the right and Leo pushes from the left, orange firelight raking across the scene, dust kicked up at his feet, deep blue shadow behind him.",
  "CHARACTERS: One stick figure, Leo, shoulder driven into the door, both feet skidding backward with dust puffs, legs braced at a steep angle, torso rotated into the effort, eyebrows slammed down, mouth wide open with teeth visible in a shout of exertion.",
  "KEY ACTION AND FOCAL POINT: Motion lines and skid marks show maximum force while the door stays perfectly still. The unmoved door edge against his shoulder is the focal point."),

s("De l'autre côté du mur, un compteur de vues explose dans le vide.",
  "SCENE AND ENVIRONMENT: The far side of the same great stone wall at night, an empty windswept plain in deep blue and violet, a colossal glowing counter mounted on the wall spinning upward through enormous numbers, its white light spilling across the empty grass and stone.",
  "CHARACTERS: One stick figure, Leo, small in the lower right corner on his side of the wall, standing on tiptoe with both hands gripping the top of a low barrier, only his head and arms visible, watching the counter.",
  "KEY ACTION AND FOCAL POINT: The giant counter races upward through millions with motion lines and light bursts while the plain below stays completely empty. The spinning counter above the empty ground is the focal point."),

s("Sous le compteur, la caisse enregistreuse reste désespérément vide.",
  "SCENE AND ENVIRONMENT: Close on an old brass cash register standing alone on a stone ledge beneath the glowing counter, its drawer hanging open and completely empty, cold white counter light from above and deep blue shadow inside the drawer, a single cobweb strand across one corner.",
  "CHARACTERS: One stick figure, Leo, leaning over the open drawer with both hands gripping its edges, head lowered right down into it, shoulders slumped, eyebrows curved sadly, mouth pulled into a small downward line.",
  "KEY ACTION AND FOCAL POINT: The drawer sits wide open and absolutely empty under the blazing counter. The empty drawer is the focal point."),

s("Une longue file de créateurs découragés fait demi-tour devant le mur.",
  "SCENE AND ENVIRONMENT: The base of the great stone wall at dusk, a wide muddy path running along it, cold violet sky with heavy clouds, torch light fading at the door far to the left, and scattered abandoned equipment on the ground.",
  "CHARACTERS: Many stick figures in mixed casual clothes, hoodies, caps, and jackets in muted colours, walking away from the wall toward the viewer with shoulders slumped, heads down, arms hanging, several dragging bags behind them. Leo stands still in the mid ground facing the wall, the only figure not turning around, seen from behind.",
  "KEY ACTION AND FOCAL POINT: The stream of departing figures flows past Leo in both directions while he alone stays facing the wall. The contrast between the moving crowd and his stillness is the focal point."),

# ---------- BEATS 73-90 : L'ABANDON, PUIS LES REGLES D'APRES LA PORTE ----------
s("Un créateur pose sa caméra par terre et s'en va sous la pluie.",
  "SCENE AND ENVIRONMENT: A rain soaked path beside the great stone wall at dusk, puddles reflecting a bruised violet sky, heavy rain streaks across the frame, a single distant torch glowing weakly on the wall, wet abandoned cables coiled in the mud.",
  "CHARACTERS: Two stick figures. A departing creator in a soaked maroon jacket sets a small camera down in a puddle and walks away toward the background, head down, shoulders collapsed, arms limp. Leo stands in the right foreground under the rain, turned to watch him go, one hand half raised, eyebrows curved with concern, mouth slightly open.",
  "KEY ACTION AND FOCAL POINT: The camera settles into the puddle and its little red light goes dark. The abandoned camera in the water is the focal point."),

s("Un graphique de vues grimpe joyeusement vers le haut de l'écran.",
  "SCENE AND ENVIRONMENT: A dark control room with a huge glowing display wall showing a rising line graph in bright cyan, the glow filling the room, banks of small indicator lights along the console below, blue light streaks across a polished floor.",
  "CHARACTERS: One stick figure, Leo, standing at the console in the lower centre seen from behind, both arms lifting slowly outward, head tipped up, following the climbing line with his whole body.",
  "KEY ACTION AND FOCAL POINT: The cyan line climbs steeply toward the top right corner with a bright glowing point at its tip and motion lines trailing it. The climbing line tip is the focal point."),

s("Juste à côté, le compteur d'argent reste bloqué à zéro.",
  "SCENE AND ENVIRONMENT: The same dark control room, camera panned to the right so the cyan graph glows out of focus at the left edge while a second smaller display sits centre frame showing a flat dead line and a single unlit zero, its panel dark grey and cold with no glow at all.",
  "CHARACTERS: One stick figure, Leo, standing directly in front of the dark panel, one hand flat on its surface, head lowered toward it, eyebrows dropping into a flat heavy line, mouth pulled down at the corners.",
  "KEY ACTION AND FOCAL POINT: The dead flat line and the unlit zero sit motionless beside the blazing climbing graph. The dark zero is the focal point."),

s("Un créateur furieux frappe la machine qu'il croit cassée.",
  "SCENE AND ENVIRONMENT: The same control room, now lit by harsh red warning light pulsing from the ceiling, sparks drifting from a cable overhead, deep shadows swinging across the console, smoke curling near the top of the frame.",
  "CHARACTERS: Two stick figures. A creator in an orange hoodie hammers both fists down on the console, legs braced wide, torso hunched forward with the impact, eyebrows slammed down hard, mouth wide open with teeth and tongue visible in a furious shout. Leo stands to the right, one arm reaching out to stop him, eyebrows raised in alarm.",
  "KEY ACTION AND FOCAL POINT: Both fists strike the console with heavy impact lines and a burst of sparks. The point of impact is the focal point."),

s("La machine, elle, tourne parfaitement, engrenages huilés et réguliers.",
  "SCENE AND ENVIRONMENT: The interior of the machine seen through an open inspection hatch, a warm brass and copper mechanism of perfectly meshed gears turning smoothly, oil gleaming on the teeth, steady golden work lamps, gentle steam, everything calm and orderly.",
  "CHARACTERS: One stick figure, Leo, leaning in through the hatch from the left, one hand on the frame, head tilted with interest, eyebrows raised, mouth open in quiet realisation.",
  "KEY ACTION AND FOCAL POINT: The gears turn in flawless order with soft light glinting along every tooth. The meshing gears are the focal point."),

s("Les créateurs découragés sont tous encore du même côté de la porte.",
  "SCENE AND ENVIRONMENT: A wide shot of the great iron door in the towering stone wall at dusk, torches burning at both sides, the ground before it packed with waiting figures, cold violet sky above and warm firelight below creating a strong two colour split.",
  "CHARACTERS: A crowd of stick figures in muted casual clothes standing shoulder to shoulder in front of the closed door, all facing it, some with heads down, some with arms crossed. Leo stands at the front of the crowd, one hand raised flat against the door, turning his head back over his shoulder to look at everyone behind him.",
  "KEY ACTION AND FOCAL POINT: The whole crowd stands on the near side of one closed door. Leo's turned head and his hand on the iron form the focal point."),

s("Les deux verrous s'ouvrent enfin dans une gerbe de lumière.",
  "SCENE AND ENVIRONMENT: Close on the great iron door as both padlocks burst open, brilliant golden light exploding from the seams of the door and cutting through the torch smoke, embers and metal fragments flying outward, the stone wall lit hot orange.",
  "CHARACTERS: One stick figure, Leo, staggering back one step with both arms flung up in front of his face, head turned slightly away, legs braced, eyebrows shot up, mouth wide open with teeth and tongue visible in shock and joy.",
  "KEY ACTION AND FOCAL POINT: The two locks split apart with radiating impact lines and a blast of golden light. The bursting locks are the focal point."),

s("Derrière la porte, un panneau de règles attend déjà.",
  "SCENE AND ENVIRONMENT: The space just beyond the open door, a calm stone corridor lit by cool overhead light with the warm glow of the doorway behind, a large official notice board mounted on the wall ahead with a heavy frame and a small lamp above it, dust drifting in the corridor light.",
  "CHARACTERS: One stick figure, Leo, standing just inside the corridor, still half lit by the warm doorway behind him, head tilted up at the board, arms lowering slowly, eyebrows climbing, mouth pulling flat in surprise.",
  "KEY ACTION AND FOCAL POINT: The notice board stands directly in his path, lit by its own lamp. The board is the focal point."),

s("Une vidéo courte, représentée par un ruban très bref, apparaît.",
  "SCENE AND ENVIRONMENT: A dark workshop space in deep teal with a long illuminated workbench running across the frame, warm lamps hanging low over it, tool shapes and reels in the shadowed background, and a soft light haze above the bench.",
  "CHARACTERS: One stick figure, Leo, standing behind the bench in the centre, holding a very short strip of film ribbon stretched between his two hands, arms close together, head lowered to inspect it, eyebrows raised, mouth pulled to one side.",
  "KEY ACTION AND FOCAL POINT: The short film strip stretches taut between his hands, glowing softly from within. The little strip is the focal point."),

s("Léo cherche de la place sur le ruban et n'en trouve presque pas.",
  "SCENE AND ENVIRONMENT: The same workshop bench under the hanging lamps, camera pushed in closer so the short film strip fills much of the frame, warm rim light along its edges, deep teal shadow behind, small dust motes in the lamp cones.",
  "CHARACTERS: One stick figure, Leo, leaning right over the bench with both elbows on it, one hand walking two fingers along the strip like a measuring pair of legs, head lowered close to the surface, eyebrows squeezed together, mouth pursed in concentration.",
  "KEY ACTION AND FOCAL POINT: His two measuring fingers run out of strip almost immediately at the far end. The end of the strip under his fingers is the focal point."),

s("Une seule case publicitaire tient sur toute la longueur du ruban.",
  "SCENE AND ENVIRONMENT: The same workshop bench, now with a single small orange advertising card slotted into the short film strip and glowing warmly, its light spilling onto the wood, the rest of the bench in cool teal shadow.",
  "CHARACTERS: One stick figure, Leo, standing back from the bench with both hands turned palm up in a small shrug, shoulders lifted, head tilted, eyebrows raised, mouth pulled sideways in acceptance.",
  "KEY ACTION AND FOCAL POINT: One lone glowing orange card sits in the strip with obvious empty space nowhere left around it. The single card is the focal point."),

s("Léo déroule un ruban beaucoup plus long à travers tout l'atelier.",
  "SCENE AND ENVIRONMENT: A wide view of the whole workshop, warm hanging lamps in a receding row, deep teal walls, and a long film ribbon unspooling from a large reel and running the entire width of the frame and out of both sides, catching light along its length.",
  "CHARACTERS: One stick figure, Leo, walking backward toward the right while pulling the ribbon out with both hands, legs striding wide, torso leaning back against the pull, head turned to check the length, mouth open in a determined smile.",
  "KEY ACTION AND FOCAL POINT: The ribbon unspools in a long glowing line across the entire workshop with motion lines at the reel. The stretching ribbon is the focal point."),

s("Il glisse plusieurs cases publicitaires le long du long ruban.",
  "SCENE AND ENVIRONMENT: The same long ribbon stretched across the workshop, now with several orange advertising cards slotted into it at intervals, each throwing its own warm pool of light onto the bench below, creating a rhythm of glows receding into the haze.",
  "CHARACTERS: One stick figure, Leo, moving along the ribbon in the mid ground, one hand pressing a fresh card into place, the other holding two spare cards, body turned into the work, eyebrows raised, mouth open in a pleased smile with teeth visible.",
  "KEY ACTION AND FOCAL POINT: A new card clicks into the ribbon and lights up, joining the row of glows. The card being inserted is the focal point."),

s("Les cases se répartissent au milieu du contenu, pas seulement au début.",
  "SCENE AND ENVIRONMENT: An overhead view looking straight down at the long ribbon laid out on the workbench, warm lamp light falling evenly along it, the wood grain visible, deep shadow at the frame edges, the glowing cards spaced out along the middle section.",
  "CHARACTERS: One stick figure, Leo, seen from directly above standing beside the bench, arms spread over the ribbon, head bowed to look down the line, hoodie and red sneakers clearly visible from this angle.",
  "KEY ACTION AND FOCAL POINT: The evenly spaced glowing cards sit through the middle of the ribbon rather than clustered at its start. The rhythm of spaced glows is the focal point."),

s("Léo lève une main pour arrêter net l'enthousiasme.",
  "SCENE AND ENVIRONMENT: The workshop, lights dimmed to a single hard overhead lamp directly above, a tight bright circle around Leo and heavy teal shadow swallowing the rest, faint haze in the beam.",
  "CHARACTERS: One stick figure, Leo, standing centre frame facing the viewer, one arm thrust straight forward with palm flat toward the camera in a stop gesture, other hand on his hip, head tilted slightly down, eyebrows lowered, mouth pressed into a firm flat line.",
  "KEY ACTION AND FOCAL POINT: His flat palm fills the near foreground, lit hard by the overhead lamp. The stop hand is the focal point."),

s("Il tire de force sur un ruban court pour l'allonger.",
  "SCENE AND ENVIRONMENT: The workshop bench under harsh angled light, the background dropping into deep shadow, dust shaken loose into the air, the wood surface scuffed and the lamp swinging slightly so the shadows tilt.",
  "CHARACTERS: One stick figure, Leo, hauling on both ends of a short film strip with all his weight, one foot up on the bench edge for leverage, torso rotated hard, arms trembling with motion lines, eyebrows slammed down, mouth wide open with teeth and tongue visible in strain.",
  "KEY ACTION AND FOCAL POINT: The strip stretches thin and pale in the middle under the strain with stress lines around it. The over stretched middle is the focal point."),

s("Le ruban étiré devient transparent et se déchire.",
  "SCENE AND ENVIRONMENT: The same bench, the swinging lamp now throwing wild shadows, small torn fragments flying through the air, teal shadow behind and a hard white highlight along the tear line.",
  "CHARACTERS: One stick figure, Leo, thrown off balance backward, both arms flung out, one leg kicked up, head snapped back, eyebrows shot up, mouth wide open with teeth and tongue visible in dismay.",
  "KEY ACTION AND FOCAL POINT: The film strip snaps clean in two with a burst of impact lines and flying fragments. The break point is the focal point."),

s("Le public quitte la salle au milieu de la projection.",
  "SCENE AND ENVIRONMENT: A dark cinema interior seen from the front rows, a large pale screen glowing weakly at the back, rows of seats in blue shadow, an exit sign glowing green at the side casting a cold pool of light on the aisle carpet.",
  "CHARACTERS: Many stick figures rising from their seats and streaming toward the green lit exit, bodies turned away, arms reaching for the door, several already silhouetted in the exit glow, all with flat bored eyebrows or downturned mouths. Leo stands alone at the front beside the screen, arms dropping to his sides, head turning to follow them, eyebrows curved down.",
  "KEY ACTION AND FOCAL POINT: The audience empties toward the green exit while the screen still plays. The stream of departing figures is the focal point."),

# ---------- BEATS 91-108 : LA RETENTION, LE PLAFOND, LES PRODUITS ----------
s("La porte de sortie se referme sur les derniers spectateurs.",
  "SCENE AND ENVIRONMENT: The cinema exit doorway seen from inside, a bright green exit sign directly above, cold outside light spilling through the narrowing gap, the surrounding auditorium in deep blue shadow, dust swirling in the draught.",
  "CHARACTERS: Two stick figures. The last viewer in a mustard coat slips through the closing gap, only half his body still visible, head turned away. Leo stands in the foreground reaching toward the door with one arm outstretched, other hand at his chest, eyebrows raised high, mouth open in a call.",
  "KEY ACTION AND FOCAL POINT: The heavy door swings shut with motion lines, cutting the light beam down to a thin blade. The closing gap is the focal point."),

s("Sur l'écran, la publicité du milieu s'affiche pour des sièges vides.",
  "SCENE AND ENVIRONMENT: The cinema auditorium seen from the back, every seat empty, the large screen at the front now blazing with a bright orange advertising panel that lights the whole empty room, its glow falling on rows of unoccupied seats and a scattered popcorn box on the floor.",
  "CHARACTERS: One stick figure, Leo, sitting alone in the very centre of the empty rows, seen from behind, arms on both armrests, head tilted, shoulders low.",
  "KEY ACTION AND FOCAL POINT: The advertisement plays at full brightness to a completely empty auditorium. The lit screen above the empty seats is the focal point."),

s("Le guichet reste fermé, aucun paiement pour cette publicité.",
  "SCENE AND ENVIRONMENT: A payment window in a stone wall with its metal roller shutter pulled down and padlocked, a small unlit lamp above, a faded closed sign hanging crooked, cold blue night light on the stone and a single warm streetlamp far behind casting a long shadow.",
  "CHARACTERS: One stick figure, Leo, standing at the shutter holding out a paper receipt with one hand, the other hand hanging at his side, shoulders dropped, head lowered, eyebrows curved sadly, mouth pulled small and flat.",
  "KEY ACTION AND FOCAL POINT: The receipt hovers in front of the locked shutter with nowhere to go. The closed shutter is the focal point."),

s("Une règle géante mesure une vidéo interminable dans le vide.",
  "SCENE AND ENVIRONMENT: A vast empty grey plain under a flat overcast sky with an enormous ruler lying across the ground stretching to the horizon, cool desaturated light, thin mist along the ground, and a few dry weeds at the edges.",
  "CHARACTERS: One stick figure, Leo, standing on top of the ruler in the mid ground, hands on hips, head turning to follow it toward the horizon, eyebrows flat, mouth pulled sideways in doubt.",
  "KEY ACTION AND FOCAL POINT: The colossal ruler runs endlessly into empty distance with nothing on it at all. The empty measured length is the focal point."),

s("Un unique siège vide dans une salle immense.",
  "SCENE AND ENVIRONMENT: A huge dark auditorium shot wide, hundreds of empty seats receding into shadow, a single cold spotlight falling from above onto one seat in the middle of the room, deep blue everywhere else with faint dust in the beam.",
  "CHARACTERS: One stick figure, Leo, standing beside the lit empty seat with one hand resting on its back, head lowered toward it, shoulders slumped, eyebrows curved down, mouth a small flat line.",
  "KEY ACTION AND FOCAL POINT: The lone spotlight isolates one empty seat in a sea of darkness. The empty lit seat is the focal point."),

s("Un ruban court mais dense, entièrement doré sur toute sa longueur.",
  "SCENE AND ENVIRONMENT: The workshop bench again, warm and inviting, a single hanging lamp with a rich amber glow, deep teal shadows behind, warm dust motes floating, the wood surface polished and gleaming.",
  "CHARACTERS: One stick figure, Leo, holding a short film strip up at eye level with both hands, head tilted to admire it, eyebrows raised, mouth open in a small satisfied smile with teeth visible.",
  "KEY ACTION AND FOCAL POINT: The whole short strip glows solid gold from end to end with no dull sections at all. The evenly glowing strip is the focal point."),

s("Une salle comble regarde jusqu'à la toute dernière image.",
  "SCENE AND ENVIRONMENT: The cinema auditorium from the front corner, every seat filled, warm white screen light washing over the crowd from the left, deep shadow behind the back rows, faint dust drifting in the projector beam overhead.",
  "CHARACTERS: Many stick figures packed in the seats in mixed colourful casual clothes, all leaning slightly forward, eyebrows raised, eyes wide, mouths open in engagement, none looking away. Leo sits in the front row on the right, turned around in his seat to look back at the full house, mouth open in a delighted smile.",
  "KEY ACTION AND FOCAL POINT: The entire audience stays locked on the screen together while Leo looks back at them. The wall of attentive faces is the focal point."),

s("Un ruban très long, mais terne et gris après quelques centimètres.",
  "SCENE AND ENVIRONMENT: The same workshop bench, the lamp now cooler and dimmer, a very long film strip laid out across the wood, its first section glowing warmly and the remaining length fading into flat dull grey that disappears into the shadow at the frame edge.",
  "CHARACTERS: One stick figure, Leo, standing at the point where the glow dies, one hand hovering above the grey section, head lowered, eyebrows drawn together, mouth pulled down at one corner.",
  "KEY ACTION AND FOCAL POINT: The sharp line where the golden glow ends and the grey begins sits right under his hovering hand. That transition line is the focal point."),

s("La foule se lève en masse au tiers de la projection.",
  "SCENE AND ENVIRONMENT: The cinema auditorium shot from the screen looking back at the seats, the green exit signs glowing on both side walls, cold light spilling into the aisles, deep blue shadow over the seat rows and a pale wash of screen light on the nearest faces.",
  "CHARACTERS: Many stick figures standing up all at once from the middle rows and turning toward the aisles, bodies twisted mid rise, arms grabbing coats, several already stepping out, all with flat bored eyebrows. Leo stands in the lower foreground with his back to the viewer, arms half raised in disbelief.",
  "KEY ACTION AND FOCAL POINT: The synchronised mass standing motion ripples across the rows with motion lines. The wave of rising figures is the focal point."),

s("Léo coche méthodiquement chaque case d'une longue liste.",
  "SCENE AND ENVIRONMENT: A calm warmly lit study at night, a tall checklist board propped against a wall, a green shaded desk lamp throwing a soft pool of light, dark wood shelves in the background, and a window showing a quiet deep blue night.",
  "CHARACTERS: One stick figure, Leo, standing at the board with a thick marker in one hand, arm raised mid stroke, other hand steadying the board, eyebrows level in focus, mouth in a calm closed smile.",
  "KEY ACTION AND FOCAL POINT: A bold tick lands in the final empty box of a long completed list. The last tick mark is the focal point."),

s("Sa tête heurte un plafond de verre qu'il n'avait pas vu.",
  "SCENE AND ENVIRONMENT: A bright vertical shaft of space with a huge transparent glass ceiling overhead, warm golden light glowing tantalisingly above the glass and cooler blue light below it, faint reflections and light refractions running across the surface, empty air beneath.",
  "CHARACTERS: One stick figure, Leo, floating upward in the centre of the frame with both arms stretched above him, legs trailing, the top of his round white head pressed flat against the underside of the glass, eyebrows shot up, mouth wide open with teeth and tongue visible in surprise.",
  "KEY ACTION AND FOCAL POINT: Impact rings spread outward across the glass from the point where his head stops. The contact point is the focal point."),

s("Léo se tient sur un sol solide fait de pièces publicitaires.",
  "SCENE AND ENVIRONMENT: A wide low angle view of a solid floor built from tightly packed gold coins stretching to the horizon, warm side lighting raking across the coin texture, a rich orange and violet sky above with layered clouds and a low sun.",
  "CHARACTERS: One stick figure, Leo, standing firmly in the centre with feet planted apart, one foot tapping the coin floor, hands on hips, head lowered to look at the ground, eyebrows level, mouth in a small confident line.",
  "KEY ACTION AND FOCAL POINT: His red sneaker taps the coin floor and a small ring of light spreads out from the contact. The solid coin ground under his feet is the focal point."),

s("Très haut au-dessus de lui, un sommet lumineux reste inatteignable.",
  "SCENE AND ENVIRONMENT: An extreme low angle looking straight up from the coin floor toward a towering mountain of gold that disappears into bright cloud, brilliant sunlight bursting around its far peak, dramatic shadow on the near face, birds as tiny shapes near the top.",
  "CHARACTERS: One stick figure, Leo, tiny in the lower centre foreground seen from behind, head tipped fully back, one arm raised pointing up, the other hanging, dwarfed by the scale.",
  "KEY ACTION AND FOCAL POINT: The distant sunlit peak blazes far above him with light rays streaming past the mountain edges. The unreachable peak is the focal point."),

s("Léo écarte des rideaux et observe d'autres créateurs au travail.",
  "SCENE AND ENVIRONMENT: A warm busy workshop hall seen through a parted curtain, several lit workstations with hanging lamps, shelves of boxes and materials, golden light and gentle steam, a rich amber and brown palette with deep shadow at the edges.",
  "CHARACTERS: Several stick figures at workstations in colourful aprons, jackets, and rolled sleeve shirts, all busy with their hands, eyebrows focused. Leo peers in from the left foreground, one hand holding the curtain aside, head leaning through, eyebrows raised high in curiosity, mouth slightly open.",
  "KEY ACTION AND FOCAL POINT: Leo's head leans into the warm lit workshop while the busy figures work on. The lit workspace beyond the curtain is the focal point."),

s("Ces créateurs ont un atelier riche et bien équipé.",
  "SCENE AND ENVIRONMENT: The full workshop hall in a wide shot, tall shelves loaded with neatly packed goods, several glowing work areas, a large window pouring warm afternoon light across the floor, hanging plants and lamps, dust turning in the beams, deep warm colour throughout.",
  "CHARACTERS: Several stick figures moving through the space carrying boxes and tools, dressed in a deep teal apron, a rust orange jacket, and a mustard shirt, all with calm confident postures. Leo stands just inside the entrance in the right foreground, turning slowly to take in the room, arms slightly out, mouth open in awe.",
  "KEY ACTION AND FOCAL POINT: The full richly stocked workshop opens out around Leo. The loaded shelves catching the window light are the focal point."),

s("Un créateur passe devant la caisse de la plateforme sans s'arrêter.",
  "SCENE AND ENVIRONMENT: The marble bank hall again with its brass counter and grille, cool daylight through arched windows and a warm lamp pool on the counter, polished floor with long reflections, columns receding into the background.",
  "CHARACTERS: Two stick figures. A creator in a rust orange jacket strides past the counter without turning her head, arms swinging, legs mid stride with motion lines, eyebrows level and purposeful. The burgundy uniformed clerk leans out of the grille holding a small envelope, eyebrows raised in surprise, mouth open. Leo stands to the right watching the pass by, one eyebrow up.",
  "KEY ACTION AND FOCAL POINT: The striding figure moves past the offered envelope without slowing. The unclaimed envelope in the clerk's hand is the focal point."),

s("La petite enveloppe de paiement reste seule sur le comptoir.",
  "SCENE AND ENVIRONMENT: Close on the brass counter top, a single small pale envelope lying in a soft warm lamp pool, the marble surface stretching away into cool blue shadow, faint dust in the light, the grille bars out of focus behind.",
  "CHARACTERS: One stick figure, Leo, leaning on the counter from the left with both forearms on the marble, head resting near the envelope, eyebrows level and thoughtful, mouth pulled slightly to one side.",
  "KEY ACTION AND FOCAL POINT: The lone envelope sits untouched in its small pool of light. The envelope is the focal point."),

s("Les créateurs installent leur propre étal juste à côté.",
  "SCENE AND ENVIRONMENT: A lively evening market street beside the bank building, warm string lights strung overhead, wooden market stalls with striped awnings in teal and rust, a deep violet dusk sky above the rooftops, warm light pooling on the cobblestones.",
  "CHARACTERS: Several stick figures setting up a stall, one in a rust orange jacket hanging a sign, one in a mustard shirt stacking boxes, all with raised eyebrows and open smiles. Leo stands in the centre foreground holding one end of the awning cloth, head turned toward the stall, mouth open in an excited smile with teeth visible.",
  "KEY ACTION AND FOCAL POINT: The striped awning unfurls over the stall with motion lines as the string lights blink on above it. The opening stall is the focal point."),

# ---------- BEATS 109-126 : LE CREATEUR DEVIENT UNE ENTREPRISE ----------
s("Sur l'étal, un manuel lumineux et un modèle prêt à l'emploi.",
  "SCENE AND ENVIRONMENT: Close on the market stall counter under warm string lights, worn wooden boards, a striped teal awning edge at the top of the frame, deep violet evening beyond, warm light pooling on the goods and soft bokeh lights in the background.",
  "CHARACTERS: One stick figure, Leo, standing behind the counter with both hands presenting the goods, palms turned up, head tilted, eyebrows raised, mouth open in a welcoming smile with teeth visible.",
  "KEY ACTION AND FOCAL POINT: A thick glowing manual and a neat stacked template sit side by side on the counter, both giving off a soft warm light. The two lit products are the focal point."),

s("À côté, un outil brillant et une main tendue pour accompagner.",
  "SCENE AND ENVIRONMENT: The other end of the same stall counter, warm string lights above, a small hanging lamp casting a tight glow, wooden shelves behind stacked with boxes, violet dusk and blurred market lights in the background.",
  "CHARACTERS: Two stick figures. Leo stands behind the counter on the left holding out a gleaming brass tool in one hand, the other hand extended open toward a customer. A customer in a charcoal blazer reaches back across the counter, both eyebrows raised, mouth open in a pleased smile.",
  "KEY ACTION AND FOCAL POINT: The two hands meet over the counter with the shining tool between them. The handshake over the tool is the focal point."),

s("Une seule vidéo projette un faisceau qui remplit dix coffres.",
  "SCENE AND ENVIRONMENT: A dark hall in deep navy where a single glowing screen mounted high on the left wall projects a wide fan of golden light across the room onto a row of ten open treasure chests lined up along the floor, each filling with light, warm haze in the beam and rich shadow beyond.",
  "CHARACTERS: One stick figure, Leo, standing in the middle of the light fan with both arms raised wide, head tipped back, mouth open in a huge smile with teeth and tongue visible, eyebrows high, gold light washing over his hoodie.",
  "KEY ACTION AND FOCAL POINT: The single beam splits into ten streams that pour into the ten chests. The fan of splitting light is the focal point."),

s("Dans la foule, quelques spectateurs lèvent la main pour acheter.",
  "SCENE AND ENVIRONMENT: A crowd scene at the evening market under warm string lights, most of the crowd in cool violet shadow, with three warm spotlight beams falling from above onto three specific individuals, deep dusk sky and glowing stall lights in the background.",
  "CHARACTERS: Many stick figures standing shoulder to shoulder in muted clothes with neutral faces, and three figures among them lit by the beams, one in a mustard coat, one in a teal jacket, one in a burgundy scarf, each with one arm raised high and eyebrows lifted, mouths open. Leo stands on a crate at the right edge, pointing at the raised hands, mouth open in delight.",
  "KEY ACTION AND FOCAL POINT: Three lit arms rise out of a dark crowd. The raised hands in their spotlights are the focal point."),

s("Le reste de la foule se contente de regarder passer une publicité.",
  "SCENE AND ENVIRONMENT: The same market crowd, now lit only by the flat orange glow of a large advertising panel mounted above the stalls, its light washing every face in the same uniform tone, the string lights dimmed, the sky a deep flat violet.",
  "CHARACTERS: Many stick figures standing still and facing the panel, arms at their sides, eyebrows flat, mouths small neutral lines, all identical in posture. Leo stands at the right edge in profile, looking not at the panel but back at the three departed customers, one eyebrow raised thoughtfully.",
  "KEY ACTION AND FOCAL POINT: The uniform passive crowd faces the glowing panel in complete stillness. The sea of flat expressions is the focal point."),

s("Une ligne de lumière sépare nettement deux moitiés de l'image.",
  "SCENE AND ENVIRONMENT: A dark studio space divided down the exact centre by a single vertical blade of brilliant white light running floor to ceiling, the left half washed in cool blue and the right half in warm gold, thin haze making the light blade glow, deep shadow at both outer edges.",
  "CHARACTERS: One stick figure, Leo, standing directly on the dividing line facing the viewer, his body split perfectly into a cool blue half and a warm gold half, arms slightly out from his sides, head level, eyebrows raised, mouth in a small knowing line.",
  "KEY ACTION AND FOCAL POINT: The blade of light cuts precisely down the middle of his round white head. The split face is the focal point."),

s("À gauche un créateur seul, à droite une équipe et un bâtiment.",
  "SCENE AND ENVIRONMENT: A wide split composition, the left half a small dim bedroom with one desk and one lamp in cool blue, the right half a warm bright multi storey building interior with several lit floors, shelves, plants, and hanging lamps in rich gold, a hard vertical line between them.",
  "CHARACTERS: On the left, Leo sits alone at his single desk in cool light, shoulders hunched, head lowered. On the right, several stick figures in teal aprons, rust jackets, and mustard shirts work across the lit floors, plus a second Leo standing confidently in the centre of that half with hands on hips.",
  "KEY ACTION AND FOCAL POINT: The same character appears in both halves, alone and dim on one side, surrounded and lit on the other. The contrast across the dividing line is the focal point."),

s("Léo attend devant une boîte aux lettres, sous la pluie.",
  "SCENE AND ENVIRONMENT: A grey suburban street corner in steady rain, a single metal mailbox on a post in the centre, wet pavement reflecting a weak streetlamp, low grey clouds, bare branches at the frame edges, a muted blue and grey palette with one small warm streetlamp glow.",
  "CHARACTERS: One stick figure, Leo, standing directly in front of the mailbox with both hands gripping its lid, head lowered, shoulders pulled up against the rain, eyebrows curved with impatience, mouth pressed into a small tight line, rain streaking off his hood.",
  "KEY ACTION AND FOCAL POINT: The closed empty mailbox sits shut under the rain with a small puddle forming below it. The shut mailbox lid is the focal point."),

s("Un calendrier mural n'affiche qu'un seul jour entouré en rouge.",
  "SCENE AND ENVIRONMENT: A plain dim room with a large wall calendar hanging alone on an empty wall, lit by one narrow shaft of cold daylight from a small high window, dust in the beam, long shadows down the wall, everything else in flat grey blue shadow.",
  "CHARACTERS: One stick figure, Leo, standing beneath the calendar looking up, arms hanging at his sides, one foot slightly forward, eyebrows flat, mouth a small straight line of patient waiting.",
  "KEY ACTION AND FOCAL POINT: A single date near the end of the calendar is circled in thick red while every other square stays blank. The red circle is the focal point."),

s("Un bâtiment lumineux alimenté par plusieurs canalisations différentes.",
  "SCENE AND ENVIRONMENT: A warm glowing building seen at night from a low angle, several thick pipes of different colours running into its base from different directions across the ground, each pulsing with light, a deep blue night sky above, city glow on the horizon, warm light in every window.",
  "CHARACTERS: One stick figure, Leo, standing at the base of the building in the lower centre, arms crossed, head tilted up, chest lifted, eyebrows level and satisfied, mouth in a calm closed smile, warm light on his face.",
  "KEY ACTION AND FOCAL POINT: Four differently coloured pipes pulse light into the building at once. The converging glowing pipes are the focal point."),

s("Une seule de ces canalisations porte l'étiquette publicité.",
  "SCENE AND ENVIRONMENT: Close on the base of the same building at night, one orange pipe in sharp focus in the foreground with a small metal tag hanging from it, the three other coloured pipes glowing softly out of focus behind, warm light spilling from the building above, deep blue shadow below.",
  "CHARACTERS: One stick figure, Leo, crouched beside the orange pipe with one hand resting on it, head turned toward the viewer, one eyebrow raised, mouth pulled slightly to one side in a knowing expression.",
  "KEY ACTION AND FOCAL POINT: His hand rests on one pipe among four while the others keep glowing on their own. The single tagged pipe is the focal point."),

s("Léo repose sa caméra avant même d'avoir commencé à tourner.",
  "SCENE AND ENVIRONMENT: A quiet bedroom studio at golden hour, warm low sunlight slanting through the window across a desk, dust drifting in the beam, a tripod and lights set up and waiting, soft shadows and a calm amber palette.",
  "CHARACTERS: One stick figure, Leo, standing beside the tripod with one hand still on the camera he has just set down, body paused mid motion, head turned away toward the window light, eyebrows raised in a thoughtful lift, mouth slightly open.",
  "KEY ACTION AND FOCAL POINT: His hand lifts off the camera without switching it on, the red record light staying dark. The unlit record light is the focal point."),

s("Une question géante en lettres de lumière apparaît devant lui.",
  "SCENE AND ENVIRONMENT: The same bedroom studio, now dark except for an enormous glowing question mark floating in the middle of the room, throwing warm gold light across the walls, desk, and ceiling, with haze making the glow bloom and long shadows radiating outward behind every object.",
  "CHARACTERS: One stick figure, Leo, standing in front of the floating shape with both arms lowered, head tipped back, gold light filling his round white head, eyebrows raised high, mouth open in a small awed circle.",
  "KEY ACTION AND FOCAL POINT: The huge glowing question mark hovers at the centre of the room, brighter than everything else. The floating symbol is the focal point."),

s("Un projecteur balaie la foule pour trouver qui regarde vraiment.",
  "SCENE AND ENVIRONMENT: A dark crowd field at night seen from a raised angle, hundreds of small stick figures in shadow, with one wide searchlight beam sweeping across them from the upper left, its cone visible in the haze and its bright oval pool crossing the crowd, deep blue and violet everywhere else.",
  "CHARACTERS: Many small stick figures in muted clothes standing across the field with upturned round white heads. Leo stands on a raised platform in the lower right, both hands on the searchlight housing, swinging it across the crowd, eyebrows lowered in focus, mouth set.",
  "KEY ACTION AND FOCAL POINT: The bright oval of light sweeps across the sea of upturned faces with motion lines behind the beam. The moving pool of light is the focal point."),

s("Un annonceur observe cette même foule, un produit à la main.",
  "SCENE AND ENVIRONMENT: The edge of the same dark crowd field, a raised viewing platform in the foreground with a brass railing catching warm lamp light, the crowd stretching away into blue shadow below, a violet night sky with thin clouds and a low moon.",
  "CHARACTERS: Two stick figures. The royal blue suited brand executive leans on the railing holding a glowing product box under one arm, head lowered toward the crowd, one eyebrow raised in appraisal, mouth pursed in calculation. Leo stands beside him on the right, following his gaze, arms folded.",
  "KEY ACTION AND FOCAL POINT: The executive scans the crowd with his product tucked ready under his arm. His appraising downturned face is the focal point."),

s("La marque tend son produit vers la foule et sort son chéquier.",
  "SCENE AND ENVIRONMENT: The same platform above the crowd, now warmly lit from below by the glow of the awakening crowd's screens, the violet sky brightening at the horizon, the brass railing gleaming, haze catching the rising light.",
  "CHARACTERS: Two stick figures. The blue suited executive stretches the glowing product box out over the railing toward the crowd with one arm while pulling a chequebook from his jacket with the other, chest forward, eyebrows raised, mouth open in an eager pitch. Leo stands beside him watching the chequebook, one eyebrow up, mouth open slightly.",
  "KEY ACTION AND FOCAL POINT: The product reaches out over the crowd while the chequebook comes free of the jacket. The chequebook mid draw is the focal point."),

s("Léo tient un sujet dans une main et une foule entière dans l'autre.",
  "SCENE AND ENVIRONMENT: A dark dramatic space in deep indigo with two hard overhead lights, one falling on each of Leo's hands, thin haze catching both beams, the rest of the frame sinking into rich shadow with faint rim light along the floor.",
  "CHARACTERS: One stick figure, Leo, standing centre frame facing the viewer, arms held out wide at shoulder height, one hand cupping a small glowing subject icon, the other cupping a tiny crowd of miniature stick figures, head turning between them, eyebrows raised, mouth open in realisation.",
  "KEY ACTION AND FOCAL POINT: The two lit hands hold two different things at the same height. The pair of glowing palms is the focal point."),

s("Léo referme la main sur un billet, seul et sûr de lui, à l'aube.",
  "SCENE AND ENVIRONMENT: A high rooftop at sunrise, the city spread out far below in cool blue shadow, brilliant orange and gold light breaking across the horizon behind, long dramatic shadows stretching backward across the roof, warm rim light on every edge and a few birds in the distance.",
  "CHARACTERS: One stick figure, Leo, standing at the rooftop edge facing the sunrise in three quarter view, feet planted apart, chest lifted, one fist closed firmly around a folded banknote and held at his side, head level, eyebrows steady and level, mouth in a calm certain closed smile.",
  "KEY ACTION AND FOCAL POINT: His closed fist holds the note against the blazing sunrise, warm light burning around the edges of his hand. The closed fist against the sun is the focal point."),

(() => {
  'use strict';

  const POOL = window.CINEGENOME_FANS250?.films || [];
  if (!POOL.length) return;

  const STORE_KEY = 'cinegenome_dna_test_beta_v3';
  const AXES = [
    ['surrealism','REALITY BEND'], ['solitude','SOLITUDE'], ['romance','ROMANCE'],
    ['nostalgia','NOSTALGIA'], ['intensity','INTENSITY'], ['pace','PACE'],
    ['visual','VISUAL STYLE'], ['complexity','COMPLEXITY'], ['darkness','DARKNESS'],
    ['humor','HUMOR'], ['dreamLogic','DREAM LOGIC'], ['action','ACTION'],
    ['horror','HORROR'], ['warmth','WARMTH'], ['intimacy','INTIMACY']
  ];

  const Q = [
    ['surrealism', 1, 'I like films where reality itself can bend, fracture, or become uncertain.'],
    ['surrealism',-1, 'I prefer a film world that stays grounded in recognizable reality.'],
    ['solitude',1, 'I connect strongly with protagonists who feel isolated, alienated, or out of place.'],
    ['solitude',-1, 'I get more energy from relationships inside a group than from watching someone alone.'],
    ['romance',1, 'A love story can be the main reason I care about a film.'],
    ['romance',-1, 'I usually prefer romance to stay secondary to the film’s main idea or conflict.'],
    ['nostalgia',1, 'Memory, longing, and bittersweet nostalgia can carry a film for me.'],
    ['nostalgia',-1, 'A film rarely wins me over just because it evokes the past or a lost time.'],
    ['intensity',1, 'I want a film to push me toward emotional or physical overload.'],
    ['intensity',-1, 'I prefer tension to stay restrained rather than escalate toward overwhelm.'],
    ['pace',1, 'I enjoy films that build momentum and keep moving forward.'],
    ['pace',-1, 'I am comfortable with long silences, waiting, and slow observation.'],
    ['visual',1, 'Images, composition, and visual style can matter to me as much as plot.'],
    ['visual',-1, 'If the writing works, visual style usually matters much less to me.'],
    ['complexity',1, 'I enjoy narratives that make me reconstruct events, motives, or meaning.'],
    ['complexity',-1, 'I prefer a story whose structure and meaning are clear without much decoding.'],
    ['darkness',1, 'I am comfortable when a film stays bleak, disturbing, cruel, or morally abrasive.'],
    ['darkness',-1, 'I prefer films to leave some emotional breathing room instead of dwelling in ugliness.'],
    ['humor',1, 'Even serious films are better for me when humor can break or distort the tension.'],
    ['humor',-1, 'Once a film becomes heavy, I usually want it to stay tonally serious.'],
    ['dreamLogic',1, 'I enjoy scenes that connect through mood, association, or intuition instead of clear cause-and-effect.'],
    ['dreamLogic',-1, 'I prefer scenes to connect through understandable cause-and-effect rather than associative logic.'],
    ['action',1, 'Movement, chases, fights, or physical spectacle can be a major source of enjoyment for me.'],
    ['action',-1, 'Physical action is usually less interesting to me than atmosphere, ideas, or character.'],
    ['horror',1, 'I enjoy dread, fear, body horror, or the feeling that something is deeply wrong.'],
    ['horror',-1, 'I would rather a film create tension without trying to frighten or unsettle me.'],
    ['warmth',1, 'I want at least some tenderness, hope, or human warmth inside a film.'],
    ['warmth',-1, 'A cold, unsentimental film can be exactly what I want.'],
    ['intimacy',1, 'I would choose an intimate character study over a story driven mainly by scale or plot.'],
    ['intimacy',-1, 'I would rather explore a large world or external conflict than stay inside one person’s emotions.']
  ];

  const SCALE = ['STRONGLY DISAGREE','DISAGREE','NEUTRAL','AGREE','STRONGLY AGREE'];

  const RESULT_INFO = {
    specimen:['CLOSEST SPECIMEN','The film whose fixed 15-axis DNA profile is closest to your Filmprint pattern. It is a similarity match across the candidate pool, not a claim that you are literally the film.'],
    match:['CINEGENOME MATCH','A normalized similarity score between your 15-axis Filmprint and the matched film DNA, adjusted slightly by how strongly you answered. It is a match indicator, not a review score or probability.'],
    genome:['GENOME KEY','A share code for DNA CROSSCHECK. Your result stays local until you choose CREATE SHARE KEY; the short key lets a friend load the response vector needed for comparison without attaching an account identity.'],
    phenotype:['SPECIMEN PHENOTYPE','A compact readout of the matched film itself: its dominant cinematic family and strongest traits. This describes the specimen, not your personality.'],
    affinity:['SPECIMEN AFFINITY','Why this film matched you. ALIGNMENT shows the strongest shared signals; GENOMIC DEVIATION shows the most meaningful place where your taste and the film differ.'],
    route:['CONNECTION ROUTE','The path through which your DNA connects to this film. Two people can match the same specimen through different trait combinations. The route is calculated after the match and does not change the winning film.'],
    profile:['DNA PROFILE','Your 15-axis cinematic taste vector. SELF shows you, SPECIMEN shows the matched film, and OVERLAY compares both. SIGNAL reflects how strongly your answers formed a pattern; COHERENCE reflects consistency across paired checks.'],
    near:['NEAR MUTATIONS','The next closest specimens after your winner. They are alternate films with similar overall DNA, useful for seeing how small changes in your taste pattern could lead to a different match.']
  };

  function dnaInfoButton(key,label){
    return `<button type="button" class="dna-info-btn" data-dna-info="${key}" aria-label="${label}">i</button>`;
  }

  function fingerprintSvg(){
    return `<svg viewBox="0 0 140 170" aria-hidden="true">
      <path d="M70 12c-31 0-55 23-55 55 0 18 5 28 7 45"/>
      <path d="M70 25c-24 0-43 18-43 43 0 16 5 27 6 43"/>
      <path d="M70 38c-17 0-31 13-31 31 0 23 9 35 7 63"/>
      <path d="M70 51c-10 0-18 8-18 19 0 27 13 37 8 76"/>
      <path d="M70 51c10 0 18 8 18 19 0 32-16 42-11 83"/>
      <path d="M70 38c17 0 31 13 31 31 0 29-14 44-10 69"/>
      <path d="M70 25c24 0 43 18 43 43 0 24-10 38-8 58"/>
      <path d="M70 12c31 0 55 23 55 55 0 22-8 35-8 49"/>
    </svg>`;
  }

  function synthesisHelixMarkup(){
    return Array.from({length:18},(_,i)=>{
      const y=(8 + (i*84/17)).toFixed(2);
      const phase=(i*28)%180;
      const delay=(i*0.045).toFixed(3);
      return `<i class="synth-rung" style="--y:${y}%;--phase:${phase}deg;--delay:${delay}s"></i>`;
    }).join('');
  }

  function synthesisAxesMarkup(){
    const codes=['RLT','SOL','ROM','NOST','INT','PACE','VIS','CMP','DRK','HMR','DRM','ACT','HOR','WRM','INTM'];
    return codes.map((code,i)=>`<span data-synth-axis="${i}"><i></i><b>${code}</b></span>`).join('');
  }
  const PRESETS = {
    romance:{surrealism:35,solitude:55,romance:94,nostalgia:68,intensity:62,pace:48,visual:65,complexity:48,darkness:38,humor:52,dreamLogic:38,action:18,horror:8,warmth:76,intimacy:86},
    horror:{surrealism:63,solitude:62,romance:20,nostalgia:35,intensity:84,pace:62,visual:72,complexity:60,darkness:91,humor:24,dreamLogic:62,action:48,horror:97,warmth:16,intimacy:45},
    action:{surrealism:35,solitude:28,romance:28,nostalgia:45,intensity:86,pace:86,visual:81,complexity:52,darkness:52,humor:45,dreamLogic:30,action:96,horror:25,warmth:45,intimacy:28},
    comedy:{surrealism:45,solitude:28,romance:50,nostalgia:58,intensity:42,pace:67,visual:58,complexity:42,darkness:18,humor:94,dreamLogic:48,action:35,horror:10,warmth:78,intimacy:58},
    surreal:{surrealism:95,solitude:70,romance:40,nostalgia:46,intensity:68,pace:46,visual:88,complexity:84,darkness:67,humor:35,dreamLogic:97,action:30,horror:55,warmth:32,intimacy:65},
    arthouse:{surrealism:58,solitude:82,romance:52,nostalgia:62,intensity:48,pace:27,visual:82,complexity:75,darkness:55,humor:30,dreamLogic:58,action:12,horror:20,warmth:48,intimacy:91},
    coming:{surrealism:35,solitude:58,romance:58,nostalgia:87,intensity:55,pace:53,visual:60,complexity:45,darkness:40,humor:62,dreamLogic:40,action:22,horror:12,warmth:79,intimacy:82},
    epic:{surrealism:50,solitude:35,romance:32,nostalgia:52,intensity:84,pace:68,visual:94,complexity:70,darkness:52,humor:34,dreamLogic:55,action:82,horror:24,warmth:48,intimacy:30},
    mystery:{surrealism:58,solitude:64,romance:28,nostalgia:40,intensity:69,pace:55,visual:67,complexity:93,darkness:72,humor:22,dreamLogic:60,action:38,horror:42,warmth:23,intimacy:52},
    animation:{surrealism:58,solitude:40,romance:42,nostalgia:68,intensity:55,pace:62,visual:93,complexity:48,darkness:30,humor:67,dreamLogic:73,action:48,horror:17,warmth:82,intimacy:57},
    musical:{surrealism:46,solitude:35,romance:70,nostalgia:66,intensity:60,pace:67,visual:84,complexity:40,darkness:28,humor:70,dreamLogic:58,action:25,horror:8,warmth:80,intimacy:62},
    crime:{surrealism:35,solitude:55,romance:18,nostalgia:42,intensity:75,pace:62,visual:66,complexity:72,darkness:82,humor:28,dreamLogic:28,action:55,horror:32,warmth:18,intimacy:48},
    warm:{surrealism:34,solitude:38,romance:55,nostalgia:77,intensity:45,pace:50,visual:58,complexity:38,darkness:14,humor:67,dreamLogic:43,action:22,horror:5,warmth:96,intimacy:75},
    darkDrama:{surrealism:45,solitude:78,romance:28,nostalgia:46,intensity:75,pace:42,visual:67,complexity:68,darkness:91,humor:13,dreamLogic:45,action:22,horror:32,warmth:14,intimacy:80},
    slow:{surrealism:45,solitude:75,romance:48,nostalgia:63,intensity:38,pace:18,visual:74,complexity:60,darkness:48,humor:28,dreamLogic:46,action:8,horror:18,warmth:48,intimacy:88},
    mindgame:{surrealism:70,solitude:64,romance:28,nostalgia:35,intensity:72,pace:58,visual:73,complexity:97,darkness:70,humor:18,dreamLogic:72,action:35,horror:45,warmth:20,intimacy:45}
  };

  const GROUPS = {
    romance:[
      'La La Land','Edward Scissorhands','10 Things I Hate About You','The Perks of Being a Wallflower','Eternal Sunshine of the Spotless Mind','Call Me by Your Name','Little Women','Pride & Prejudice','The Notebook','Mamma Mia!','Before Sunrise','About Time','How to Lose a Guy in 10 Days','Amélie','Portrait of a Lady on Fire','In the Mood for Love','Twilight','Brokeback Mountain','Titanic','(500) Days of Summer','Past Lives','Your Name.','When Harry Met Sally...','Challengers','The Handmaiden','Dirty Dancing','13 Going on 30','To All the Boys I\'ve Loved Before','The Worst Person in the World','Her','Me Before You','Notting Hill','Before Sunset','Atonement','Flipped','Moulin Rouge!'
    ],
    horror:[
      'Scream','Sinners','Donnie Darko','Edward Scissorhands','The Shining','The Thing','Alien','Perfect Blue','Midsommar','It','Hereditary','The Rocky Horror Picture Show','Get Out','American Psycho','Corpse Bride','Twin Peaks: Fire Walk with Me','Edward Scissorhands','The Nightmare Before Christmas','Pearl','Jennifer\'s Body','Pan\'s Labyrinth','The Lighthouse','Frankenstein','Jaws','I Saw the TV Glow','The Substance','The Conjuring','Blue Velvet'
    ],
    action:[
      'The Dark Knight','Star Wars: Episode III – Revenge of the Sith','Kill Bill: Vol. 1','The Lord of the Rings: The Return of the King','Spider-Man: Into the Spider-Verse','Dune: Part Two','Inglourious Basterds','The Batman','Spider-Man: Across the Spider-Verse','The Lord of the Rings: The Fellowship of the Ring','Harry Potter and the Prisoner of Azkaban','The Hunger Games: Catching Fire','Django Unchained','The Empire Strikes Back','Jurassic Park','Avatar','How to Train Your Dragon','The Matrix','Blade Runner 2049','Gladiator','The Hunger Games','Avengers: Endgame','The Lord of the Rings: The Two Towers','Cars','Baby Driver','Avengers: Infinity War','Mad Max: Fury Road','Spider-Man: Brand New Day','Superman','The Maze Runner','Star Wars','The Good, the Bad and the Ugly','Spider-Man 2','Dune','Drive','The Departed','The Amazing Spider-Man','Spider-Man: No Way Home','The Lego Batman Movie','Hacksaw Ridge','Harry Potter and the Goblet of Fire','Top Gun: Maverick','Akira','Guardians of the Galaxy','Pirates of the Caribbean: The Curse of the Black Pearl','Captain America: The Winter Soldier'
    ],
    comedy:[
      'Fantastic Mr. Fox','Little Miss Sunshine','Pulp Fiction','Mamma Mia!','Back to the Future','The Grand Budapest Hotel','Scott Pilgrim vs. the World','How to Lose a Guy in 10 Days','Amélie','Ratatouille','The Devil Wears Prada','The Big Lebowski','The Princess Bride','Shrek 2','Cars','Baby Driver','But I\'m a Cheerleader','The Rocky Horror Picture Show','Knives Out','The Secret Life of Walter Mitty','Uptown Girls','Pitch Perfect','Mean Girls','The Parent Trap','Bottoms','Ferris Bueller\'s Day Off','Ponyo','Superbad','The Royal Tenenbaums','The Greatest Showman','The Breakfast Club','White Chicks','Once Upon a Time... in Hollywood','Juno','Legally Blonde','Soul','The Lego Batman Movie','Isle of Dogs','Jojo Rabbit','Poor Things','Clueless','Catch Me If You Can','Shrek','Matilda','Hot Fuzz','Guardians of the Galaxy','Dazed and Confused','Barbie','Frances Ha'
    ],
    surreal:[
      'Everything Everywhere All at Once','Coraline','Howl\'s Moving Castle','Black Swan','Spirited Away','Inception','Donnie Darko','Mulholland Drive','Blade Runner','The Shining','2001: A Space Odyssey','Perfect Blue','Midsommar','A Clockwork Orange','The End of Evangelion','Twin Peaks: Fire Walk with Me','Eyes Wide Shut','Labyrinth','Pan\'s Labyrinth','The Lighthouse','I Saw the TV Glow','The Substance','Alice in Wonderland','Poor Things','Blue Velvet','Akira','All About Lily Chou-Chou'
    ],
    arthouse:[
      'Aftersun','La Haine','Portrait of a Lady on Fire','Mulholland Drive','The Virgin Suicides','Taxi Driver','In the Mood for Love','Past Lives','Paris, Texas','Moonlight','Perfect Days','Chungking Express','Waves','Lost in Translation','The Handmaiden','Mysterious Skin','The Worst Person in the World','Fallen Angels','Manchester by the Sea','The Florida Project','I Saw the TV Glow','Y Tu Mamá También','All About Lily Chou-Chou','Frances Ha'
    ],
    coming:[
      'Dead Poets Society','10 Things I Hate About You','The Perks of Being a Wallflower','Good Will Hunting','Little Women','Call Me by Your Name','Lady Bird','Girl, Interrupted','The Virgin Suicides','Stand by Me','Almost Famous','The Hunger Games','But I\'m a Cheerleader','A Silent Voice: The Movie','Waves','Uptown Girls','Mean Girls','The Parent Trap','Bottoms','Ferris Bueller\'s Day Off','13 Going on 30','To All the Boys I\'ve Loved Before','The Breakfast Club','Juno','Legally Blonde','The Florida Project','I Saw the TV Glow','Clueless','All About Lily Chou-Chou','Dazed and Confused','Flipped','Matilda','Frances Ha'
    ],
    epic:[
      'Interstellar','Project Hail Mary','Star Wars: Episode III – Revenge of the Sith','The Lord of the Rings: The Return of the King','Inception','Dune: Part Two','The Lord of the Rings: The Fellowship of the Ring','The Empire Strikes Back','The Odyssey','Avatar','Titanic','Blade Runner 2049','Oppenheimer','Gladiator','Avengers: Endgame','The Lord of the Rings: The Two Towers','Avengers: Infinity War','Mad Max: Fury Road','Spider-Man: Brand New Day','Superman','Star Wars','Dune','Spider-Man: No Way Home','Wicked','Hacksaw Ridge','The Pianist','Top Gun: Maverick','Amadeus','Guardians of the Galaxy'
    ],
    mystery:[
      'Se7en','The Silence of the Lambs','Shutter Island','The Prestige','Prisoners','Memento','Knives Out','Memories of Murder','Gone Girl','The Batman','The Handmaiden','Eyes Wide Shut','The Departed','Blue Velvet','Catch Me If You Can'
    ],
    animation:[
      'Fantastic Mr. Fox','Spider-Man: Into the Spider-Verse','Howl\'s Moving Castle','Spirited Away','Spider-Man: Across the Spider-Verse','Princess Mononoke','Tangled','Ratatouille','How to Train Your Dragon','Perfect Blue','Shrek 2','Cars','Corpse Bride','Ponyo','The Nightmare Before Christmas','Soul','The Lego Batman Movie','Isle of Dogs','My Neighbor Totoro','Alice in Wonderland','Kiki\'s Delivery Service','The Lion King','Chainsaw Man – The Movie: Reze Arc','Akira','Coco','Shrek'
    ],
    musical:[
      'La La Land','Mamma Mia!','Pitch Perfect','The Sound of Music','The Greatest Showman','Wicked','Moulin Rouge!','Singin\' in the Rain'
    ],
    crime:[
      'Fight Club','Se7en','The Dark Knight','The Godfather','Pulp Fiction','GoodFellas','The Silence of the Lambs','City of God','Django Unchained','Scarface','No Country for Old Men','The Godfather Part II','The Wolf of Wall Street','There Will Be Blood','Gone Girl','Heat','Baby Driver','Memories of Murder','American Psycho','The Social Network','Once Upon a Time... in Hollywood','Drive','The Departed','Catch Me If You Can','Léon: The Professional','Joker','Blue Velvet'
    ],
    warm:[
      'Dead Poets Society','Good Will Hunting','Little Women','Fantastic Mr. Fox','Forrest Gump','Little Miss Sunshine','Back to the Future','About Time','The Grand Budapest Hotel','Ratatouille','How to Train Your Dragon','The Princess Bride','Cars','The Secret Life of Walter Mitty','The Sound of Music','WALL·E','The Parent Trap','Ponyo','The Holdovers','The Royal Tenenbaums','The Greatest Showman','Notting Hill','Life Is Beautiful','It\'s a Wonderful Life','Juno','Legally Blonde','Soul','My Neighbor Totoro','Jojo Rabbit','Clueless','Kiki\'s Delivery Service','The Lion King','Coco','Shrek','Flipped','Matilda'
    ],
    darkDrama:[
      'Fight Club','Whiplash','Se7en','Black Swan','The Silence of the Lambs','Beautiful Boy','La Haine','City of God','The Shining','Girl, Interrupted','Bones and All','Taxi Driver','Prisoners','Trainspotting','Oldboy','Requiem for a Dream','Midsommar','There Will Be Blood','A Clockwork Orange','Gone Girl','Moonlight','Heat','Hereditary','Mysterious Skin','American Psycho','Neon Genesis Evangelion: The End of Evangelion','Eyes Wide Shut','Drive','Manchester by the Sea','Pearl','Monster','Babylon','Grave of the Fireflies','Jennifer\'s Body','The Lighthouse','Schindler\'s List','The Green Mile','Joker','The Substance','The Pianist','One Flew Over the Cuckoo\'s Nest','Blue Velvet','Incendies','Atonement'
    ],
    slow:[
      'Aftersun','Paris, Texas','In the Mood for Love','2001: A Space Odyssey','Past Lives','Moonlight','Perfect Days','Chungking Express','Lost in Translation','The Handmaiden','The Worst Person in the World','Her','Fallen Angels','Manchester by the Sea','The Florida Project','The Lighthouse','All About Lily Chou-Chou','Atonement','Frances Ha'
    ],
    mindgame:[
      'Everything Everywhere All at Once','Fight Club','Black Swan','Inception','Donnie Darko','Shutter Island','The Prestige','Mulholland Drive','Perfect Blue','Memento','Gone Girl','The Handmaiden','Get Out','Eyes Wide Shut','Obsession','The Lighthouse','I Saw the TV Glow','The Substance','Blue Velvet'
    ]
  };

  const groupIndex = new Map();
  for (const [group, titles] of Object.entries(GROUPS)) {
    titles.forEach(title => {
      const key = norm(title);
      if (!groupIndex.has(key)) groupIndex.set(key, []);
      groupIndex.get(key).push(group);
    });
  }

  function norm(s){
    return String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[–—]/g,'-').replace(/[^a-z0-9]+/g,' ').trim();
  }
  function clamp(n,min=0,max=100){ return Math.max(min,Math.min(max,n)); }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function round1(n){ return Math.round((Number(n)||0)*10)/10; }
  function hash32(value){ let h=2166136261; for(const ch of String(value)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
  function microDNA(title,axis){ return ((hash32(`${title}|${axis}|cg-premium-v1`)%9)-4)/10; }

  const sourceFilms = window.CINEGENOME_ENRICHED_TOP500 || [];
  const localByTitle = new Map(sourceFilms.map(f => [norm(f.title), f]));

  function dnaToProfile(f){
    const d = f?.dna || {};
    const darkness = Number(d.darkness ?? 50), intensity = Number(d.intensity ?? 50), pacing = Number(d.pacing ?? 50), chaos = Number(d.chaos ?? 50);
    return {
      surrealism:Number(d.surrealism ?? 50), solitude:Number(d.loneliness ?? 50), romance:Number(d.romance ?? 50), nostalgia:Number(d.nostalgia ?? 50),
      intensity, pace:pacing, visual:Number(d.visualExtremity ?? 50), complexity:Number(d.narrativeComplexity ?? 50), darkness,
      humor:Number(d.humor ?? 50), dreamLogic:Number(d.dreamLogic ?? 50), action:clamp(intensity*.40+pacing*.38+chaos*.22),
      horror:clamp(darkness*.52+intensity*.26+Number(d.surrealism ?? 50)*.22-10),
      warmth:clamp((100-darkness)*.42+Number(d.nostalgia ?? 50)*.18+Number(d.humor ?? 50)*.18+Number(d.romance ?? 50)*.22),
      intimacy:clamp(Number(d.loneliness ?? 50)*.32+Number(d.romance ?? 50)*.24+Number(d.narrativeComplexity ?? 50)*.18+(100-pacing)*.26)
    };
  }

  function profileForFilm(film){
    const local = localByTitle.get(norm(film.title));
    let profile = local ? dnaToProfile(local) : Object.fromEntries(AXES.map(([k]) => [k,50]));
    const groups = groupIndex.get(norm(film.title)) || [];
    if (groups.length) {
      const strength = local ? .30 : .58;
      for (const g of groups) {
        const preset = PRESETS[g];
        if (!preset) continue;
        for (const [k] of AXES) profile[k] = clamp(lerp(profile[k], preset[k] ?? 50, strength / Math.max(1, Math.sqrt(groups.length))));
      }
    }
    // Premium specimen fingerprint: preserve the semantic profile, then add a tiny
    // deterministic ±0.4 micro-variation and quantize to tenths. This separates
    // near-identical specimens without letting arbitrary noise drive the match.
    for (const [k] of AXES) profile[k] = round1(clamp(profile[k] + microDNA(film.title,k)));

    // A tiny rank prior only breaks genuine ties; popularity never drives the match.
    profile.__rank = film.rank;
    profile.__groups = groups;
    profile.__source = local ? 'hybrid-local-dna' : (groups.length ? 'curated-archetype' : 'neutral-fallback');
    return profile;
  }

  const CANDIDATES = POOL.map(f => ({...f, profile:profileForFilm(f)}));

  function answerToSigned(value, direction){
    // 1..5 => -1, -.5, 0, .5, 1. Neutral is a real zero-preference response,
    // not a hidden midpoint that carries the same confidence as an opinion.
    const signed = (clamp(Number(value),1,5)-3) / 2;
    return direction === 1 ? signed : -signed;
  }

  function buildUserVector(answers){
    const byAxis = {};
    Q.forEach((q,i) => {
      const [axis,dir] = q;
      (byAxis[axis] ||= []).push(answerToSigned(answers[i],dir));
    });
    const vector = {}, weights = {}, axisCoherence = {}, axisIntensity = {}, coherence = [], intensity = [];
    for (const [axis] of AXES) {
      const vals = byAxis[axis] || [0,0];
      const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
      const pairCoherence = vals.length > 1 ? 1 - Math.min(2,Math.abs(vals[0]-vals[1]))/2 : 1;
      const preferenceIntensity = vals.reduce((a,b)=>a+Math.abs(b),0)/vals.length;
      vector[axis] = round1(clamp(50 + mean*50));
      weights[axis] = .08 + .92 * preferenceIntensity * (.35 + .65*pairCoherence);
      axisCoherence[axis] = Math.round(pairCoherence*100);
      axisIntensity[axis] = Math.round(preferenceIntensity*100);
      coherence.push(pairCoherence);
      intensity.push(preferenceIntensity);
    }
    return {
      vector, weights, axisCoherence, axisIntensity,
      coherence:Math.round(coherence.reduce((a,b)=>a+b,0)/coherence.length*100),
      signalStrength:Math.round(intensity.reduce((a,b)=>a+b,0)/intensity.length*100)
    };
  }

  function scoreCandidate(user, candidate){
    let sum=0, weightSum=0;
    for (const [axis] of AXES) {
      const w = user.weights[axis] || 1;
      const diff = (user.vector[axis] - candidate.profile[axis]) / 100;
      sum += w * diff * diff;
      weightSum += w;
    }
    const rms = Math.sqrt(sum / Math.max(.001, weightSum));
    const similarity = clamp(100 * (1-rms), 0, 100);
    const rankTieBreak = (251-candidate.rank) * 0.0001;
    return similarity + rankTieBreak;
  }

  function topReasons(user, profile){
    return AXES.map(([axis,label]) => {
      const diff=Math.abs(user.vector[axis]-profile[axis]);
      const closeness=1-diff/100;
      const evidence=user.weights[axis] || .08;
      return {axis,label,diff,user:user.vector[axis],film:profile[axis],reasonScore:closeness*evidence};
    }).sort((a,b)=>b.reasonScore-a.reasonScore || a.diff-b.diff).slice(0,4);
  }

  const AXIS_EXPLANATIONS = {
    surrealism:{high:'reality that can bend, fracture, or refuse to explain itself',low:'grounded worlds with clear rules'},
    solitude:{high:'loneliness, alienation, and inward protagonists',low:'social energy and ensemble dynamics'},
    romance:{high:'emotional stakes built around love and attachment',low:'stories where romance stays peripheral'},
    nostalgia:{high:'memory, longing, and bittersweet nostalgia',low:'forward-looking immediacy over nostalgia'},
    intensity:{high:'high emotional or physical pressure',low:'restraint and low-temperature tension'},
    pace:{high:'forward momentum and escalation',low:'patience, silence, and slow observation'},
    visual:{high:'strong visual authorship and image-first storytelling',low:'story and writing over visual spectacle'},
    complexity:{high:'narratives that make you reconstruct meaning',low:'direct storytelling with little decoding'},
    darkness:{high:'bleak, disturbing, or morally abrasive material',low:'lighter emotional territory'},
    humor:{high:'humor cutting through serious material',low:'tonal seriousness without much comic release'},
    dreamLogic:{high:'images that work by feeling before literal logic',low:'surreal ideas that eventually resolve into clear logic'},
    action:{high:'movement, spectacle, and physical energy',low:'psychology and atmosphere over action'},
    horror:{high:'dread, unease, and horror textures',low:'tension without wanting the film to scare you'},
    warmth:{high:'tenderness, hope, and human warmth',low:'cold, unsentimental emotional distance'},
    intimacy:{high:'intimate character focus and interior emotion',low:'world-scale ideas and external stakes'}
  };

  function joinNatural(items){
    if(items.length<=1) return items[0] || '';
    if(items.length===2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0,-1).join(', ')}, and ${items[items.length-1]}`;
  }

  function explainAxis(reason){
    const copy=AXIS_EXPLANATIONS[reason.axis];
    if(!copy) return reason.label.toLowerCase();
    if(reason.user>=57) return copy.high;
    if(reason.user<=43) return copy.low;
    // A near-neutral axis can still be useful when the film occupies the same middle ground.
    return `a balanced ${reason.label.toLowerCase()} signal`;
  }

  function buildMatchExplanation(user, film, reasons){
    const primary=reasons.slice(0,3);
    const labels=primary.map(r=>r.label.toLowerCase());
    const preferences=primary.map(explainAxis);
    const avgGap=primary.length ? round1(primary.reduce((sum,r)=>sum+r.diff,0)/primary.length) : 0;

    let confidence;
    if(user.signalStrength<30){
      confidence='You used Neutral often, so the model treats this as a softer read and only gives real weight to the preferences you actually committed to.';
    }else if(user.signalStrength>=68){
      confidence='Your answers were decisive, so these overlaps carry a strong signal rather than being driven by neutral defaults.';
    }else{
      confidence='The model is leaning on the preferences you expressed most clearly and down-weighting the quieter signals.';
    }

    let coherence;
    if(user.coherence<65){
      coherence='Some paired answers pulled against each other, so those axes were automatically down-weighted.';
    }else if(user.coherence>=86){
      coherence='Your paired answers were highly consistent, so the shared axes carried extra weight.';
    }else{
      coherence='Your paired answers were coherent enough for these shared axes to stay influential.';
    }

    return {
      lede:`Your DNA leans toward ${joinNatural(preferences)}.`,
      body:`${film.title} converges with that pattern across ${joinNatural(labels)} — only ${avgGap} points of average separation on the strongest shared traits. The match is not saying you belong to one genre; it is reading the pressure, rhythm, emotional temperature, and image-logic you repeatedly asked cinema to give you.`,
      note:`${confidence} ${coherence}`,
      evidence:primary
    };
  }

  const SHARE_FILM_TRAIT_COPY = {
    surrealism:{high:'lets reality fracture without rushing to stabilize it',low:'keeps its world legible even when the emotions get strange'},
    solitude:{high:'turns isolation into psychological pressure',low:'draws energy from people colliding with one another'},
    romance:{high:'lets attachment carry real narrative weight',low:'keeps romance peripheral to the main pressure'},
    nostalgia:{high:'uses memory and longing as emotional architecture',low:'stays rooted in immediate experience rather than looking backward'},
    intensity:{high:'sustains pressure instead of offering easy release',low:'trusts restraint more than escalation'},
    pace:{high:'keeps momentum doing part of the emotional work',low:'lets tension accumulate through patience and duration'},
    visual:{high:'uses images as meaning rather than decoration',low:'lets structure and writing carry more of the load'},
    complexity:{high:'makes interpretation part of the viewing experience',low:'keeps its dramatic logic clean and immediately readable'},
    darkness:{high:'allows discomfort to remain unresolved',low:'protects some emotional breathing room'},
    humor:{high:'uses humor to destabilize the surrounding seriousness',low:'keeps the tonal pressure severe'},
    dreamLogic:{high:'lets feeling arrive before literal explanation',low:'eventually pulls strange images back into clear logic'},
    action:{high:'expresses emotion through movement and physical force',low:'keeps spectacle secondary to atmosphere or psychology'},
    horror:{high:'treats dread as an atmosphere rather than an isolated shock',low:'builds tension without depending on fear'},
    warmth:{high:'keeps tenderness visible even under pressure',low:'withholds comfort instead of softening the experience'},
    intimacy:{high:'stays close to interior emotion and character detail',low:'thinks at a scale larger than one person’s inner life'}
  };

  function shareFilmTrait(reason){
    const copy=SHARE_FILM_TRAIT_COPY[reason.axis];
    if(!copy) return reason.label.toLowerCase();
    if(reason.film>=57) return copy.high;
    if(reason.film<=43) return copy.low;
    return `holds ${reason.label.toLowerCase()} close to a deliberate middle register`;
  }

  function buildShareNarrative(user, film, profile, friction){
    const ranked=AXES.map(([axis,label])=>{
      const u=user.vector[axis], f=profile[axis], diff=Math.abs(u-f);
      const evidence=user.weights[axis]||.08;
      const distinction=Math.abs(u-50)/50;
      return {axis,label,user:u,film:f,diff,score:(1-diff/100)*evidence*(.35+.65*distinction)};
    }).sort((a,b)=>b.score-a.score || b.diff-a.diff);
    const strongest=ranked.slice(0,3);
    const axes=new Set(strongest.map(x=>x.axis));

    let tasteSentence;
    if(axes.has('darkness') && axes.has('horror')) tasteSentence='You gravitate toward cinema where dread becomes an atmosphere, not a sequence of shocks.';
    else if(axes.has('darkness') && axes.has('solitude')) tasteSentence='You respond to isolation when it hardens into psychological pressure rather than simple loneliness.';
    else if(axes.has('complexity') && (axes.has('surrealism') || axes.has('dreamLogic'))) tasteSentence='You like films that make interpretation part of the experience and leave some uncertainty alive.';
    else if(axes.has('visual') && (axes.has('surrealism') || axes.has('dreamLogic'))) tasteSentence='You read images as meaning, not decoration, especially when a film trusts feeling before explanation.';
    else if(axes.has('intensity') && (axes.has('pace') || axes.has('action'))) tasteSentence='You want momentum to carry emotional pressure, not just move the plot from one event to the next.';
    else if(axes.has('nostalgia') && axes.has('warmth')) tasteSentence='You are drawn to films where memory and tenderness shape the structure, not merely the mood.';
    else if(axes.has('romance') && axes.has('intimacy')) tasteSentence='You value attachment when it becomes the engine of the film rather than a decorative subplot.';
    else if(axes.has('solitude') && axes.has('intimacy')) tasteSentence='You prefer films that stay psychologically close to a person even when very little is happening externally.';
    else if(axes.has('humor') && axes.has('darkness')) tasteSentence='You seem comfortable with tonal instability—humor can make darkness stranger instead of making it safer.';
    else if(axes.has('pace') && axes.has('action')) tasteSentence='You respond to cinema that thinks through movement: pace and physical energy become part of the emotion.';
    else {
      const wants=strongest.slice(0,2).map(explainAxis);
      tasteSentence=`Your taste concentrates around ${joinNatural(wants)} rather than a single genre identity.`;
    }

    const mechanics=strongest.slice(0,2).map(shareFilmTrait);
    let fitSentence=`${film.title} fits because it ${joinNatural(mechanics)}.`;
    const gap=friction?.rows?.[0];
    if(gap && gap.diff>=12){
      const direction=gap.user>gap.film ? 'slightly less' : 'slightly more';
      fitSentence+=` Its ${gap.label.toLowerCase()} runs ${direction} extreme than your baseline, which gives the match useful friction.`;
    }
    return {text:`${tasteSentence} ${fitSentence}`, strongest};
  }

  const DIAGNOSIS_ARCHETYPES = [
    ['PERCEPTUAL DRIFTER',v=>(v.surrealism+v.dreamLogic+v.visual)/3],
    ['INTERIOR OBSERVER',v=>(v.solitude+v.intimacy+(100-v.pace))/3],
    ['SENSORY MAXIMALIST',v=>(v.intensity+v.visual+v.action)/3],
    ['MEMORY ROMANTIC',v=>(v.nostalgia+v.warmth+v.romance+v.intimacy)/4],
    ['FORENSIC VIEWER',v=>(v.complexity+v.darkness+v.solitude)/3],
    ['DREAD SEEKER',v=>(v.horror+v.darkness+v.intensity)/3],
    ['KINETIC SEEKER',v=>(v.pace+v.action+v.intensity)/3],
    ['TONAL CONTRARIAN',v=>(v.humor+v.darkness+v.surrealism)/3],
    ['HUMAN SIGNAL',v=>(v.warmth+v.intimacy+v.nostalgia+v.humor)/4]
  ];

  function buildCinematicDiagnosis(user){
    const axes=AXES.map(([axis,label])=>({
      axis,label,value:user.vector[axis],weight:user.weights[axis]||.08,
      deviation:Math.abs(user.vector[axis]-50),
      coherence:user.axisCoherence?.[axis] ?? 100,
      intensity:user.axisIntensity?.[axis] ?? Math.round(Math.abs(user.vector[axis]-50)*2)
    }));
    const ranked=axes.slice().sort((a,b)=>(b.deviation*b.weight)-(a.deviation*a.weight));
    const primary=ranked.slice(0,4);
    const resistance=ranked.filter(x=>x.value<43).slice(0,2);
    const archetypes=DIAGNOSIS_ARCHETYPES.map(([name,score])=>({name,score:score(user.vector)})).sort((a,b)=>b.score-a.score).slice(0,2);
    const contradictions=axes.filter(x=>x.coherence<65 && x.intensity>=25).sort((a,b)=>a.coherence-b.coherence);

    if(user.signalStrength<20){
      return {
        code:'OPEN SIGNAL / LOW COMMITMENT',
        lede:'Your cinematic DNA is intentionally unresolved.',
        body:'Most of your answers stayed close to Neutral, so CineGenome refuses to invent a loud personality from weak evidence. The match is being driven by the few axes where you actually moved away from center.',
        signalRead:'This is a low-voltage profile. Treat the result as a soft directional read, not a fixed identity.',
        coherenceRead:'Neutral is valid data here: it means flexibility, not missing information.',
        primary
      };
    }

    if(user.coherence<40 && user.signalStrength>=55){
      return {
        code:'VOLATILE SIGNAL / SPLIT AXES',
        lede:'Your cinematic DNA is high-energy but internally contradictory.',
        body:'You express strong preferences, then push against some of those same preferences in the paired reverse-coded signals. CineGenome treats that instability as real taste complexity and suppresses the conflicted axes instead of averaging them into fake certainty.',
        signalRead:'Your appetite is strong; the uncertainty comes from contradiction, not indecision.',
        coherenceRead:`The most divided axes are ${joinNatural(contradictions.slice(0,3).map(x=>x.label.toLowerCase())) || 'distributed across the profile'}.`,
        primary
      };
    }

    const lead=primary.length ? joinNatural(primary.slice(0,3).map(explainAxis)) : 'a deliberately broad range of cinematic signals';
    const resist=resistance.length ? ` You are notably less dependent on ${joinNatural(resistance.map(x=>AXIS_EXPLANATIONS[x.axis]?.high || x.label.toLowerCase()))}, which narrows the field further.` : '';

    let signalRead;
    if(user.signalStrength>=70) signalRead='This is a high-voltage profile: you answered with enough conviction that the model can distinguish appetite from mere tolerance.';
    else if(user.signalStrength<32) signalRead='This is an elastic profile: Neutral appears often, so the result is built from the smaller number of preferences you actually pushed away from center.';
    else signalRead='This is a mixed-strength profile: the machine follows your committed preferences while allowing the quieter axes to stay flexible.';

    let coherenceRead;
    if(contradictions.length) coherenceRead=`Your ${joinNatural(contradictions.slice(0,2).map(x=>x.label.toLowerCase()))} signals are internally split. Instead of forcing them into a fake certainty, CineGenome reduces their influence and reads that tension as part of your taste.`;
    else if(user.coherence>=86) coherenceRead='Your paired answers reinforce one another unusually well, so the profile behaves like a stable taste signature rather than a collection of isolated likes.';
    else coherenceRead='Your paired answers are coherent enough to form a stable pattern without pretending every axis is absolute.';

    return {
      code:archetypes.map(x=>x.name).join(' / '),
      lede:`Your cinematic DNA reads as ${archetypes[0]?.name || 'HYBRID SPECTATOR'} with a secondary ${archetypes[1]?.name || 'OPEN SIGNAL'} pattern.`,
      body:`You are pulled hardest toward ${lead}.${resist}`,
      signalRead,
      coherenceRead,
      primary
    };
  }

  function buildFilmSpecimenBio(film, profile){
    const axes=AXES.map(([axis,label])=>({axis,label,value:round1(profile[axis]),deviation:Math.abs(profile[axis]-50)}))
      .sort((a,b)=>b.deviation-a.deviation || b.value-a.value);
    const dominant=axes.slice(0,3);
    const resistance=axes.slice().sort((a,b)=>a.value-b.value)[0];
    const groups=(profile.__groups||[]).map(g=>String(g).replace(/([A-Z])/g,' $1').trim().toUpperCase());
    const family=groups.length ? groups.slice(0,2).join(' / ') : 'UNCATALOGUED HYBRID';
    const code=`SPC-${hash32(`${film.title}|specimen-bio-v1`).toString(16).toUpperCase().padStart(8,'0')}`;
    const phraseFor=(x)=>{
      const copy=AXIS_EXPLANATIONS[x.axis];
      if(!copy) return x.label.toLowerCase();
      if(x.value>=57) return copy.high;
      if(x.value<=43) return copy.low;
      return `a deliberately balanced ${x.label.toLowerCase()} signal`;
    };
    const phrases=dominant.map(phraseFor);
    const variant=hash32(film.title)%4;
    const ledes=[
      `${film.title} is tuned less like a genre label and more like a pressure pattern: ${joinNatural(phrases)}.`,
      `The specimen profile for ${film.title} concentrates around ${joinNatural(phrases)}.`,
      `${film.title} carries a ${family.toLowerCase()} genome, but its real identity sits in ${joinNatural(phrases)}.`,
      `Read as cinematic DNA, ${film.title} is defined by ${joinNatural(phrases)} rather than a single genre tag.`
    ];
    const peakText=dominant.map(x=>`${x.label} ${x.value.toFixed(1)}`).join(' // ');
    const body=`Its strongest coordinates are ${peakText}. The counter-signal is ${resistance.label} at ${resistance.value.toFixed(1)}, which keeps the profile from collapsing into a one-note archetype. Those tenths matter only as a fingerprint between very close specimens; they never outweigh the larger taste pattern.`;
    const share=`${ledes[variant]} Peaks: ${dominant.slice(0,2).map(x=>`${x.label} ${x.value.toFixed(1)}`).join(' / ')}.`;
    return {code,family,lede:ledes[variant],body,dominant,resistance,share};
  }

  const CONNECTION_ROUTES = [
    {id:'LIMINAL', label:'LIMINAL', traits:[['surrealism',1],['dreamLogic',1],['complexity',1],['solitude',1]], copy:'You meet this film where reality loosens and interpretation stays active.'},
    {id:'VISCERAL', label:'VISCERAL', traits:[['intensity',1],['horror',1],['darkness',1],['action',1]], copy:'You meet this film through pressure, dread, physical force, and emotional overload.'},
    {id:'INTIMATE', label:'INTIMATE', traits:[['intimacy',1],['romance',1],['warmth',1],['nostalgia',1]], copy:'You meet this film through closeness, attachment, tenderness, and memory.'},
    {id:'AUSTERE', label:'AUSTERE', traits:[['pace',-1],['warmth',-1],['humor',-1],['solitude',1]], copy:'You meet this film through patience, distance, severity, and inward pressure.'},
    {id:'KINETIC', label:'KINETIC', traits:[['pace',1],['action',1],['intensity',1],['visual',1]], copy:'You meet this film through momentum, movement, escalation, and image-driven energy.'},
    {id:'FORMALIST', label:'FORMALIST', traits:[['visual',1],['complexity',1],['pace',-1],['dreamLogic',-1]], copy:'You meet this film through construction: image, structure, control, and deliberate rhythm.'},
    {id:'PLAYFUL', label:'PLAYFUL', traits:[['humor',1],['warmth',1],['dreamLogic',1],['pace',1]], copy:'You meet this film through tonal elasticity, warmth, surprise, and playful motion.'},
    {id:'CONTEMPLATIVE', label:'CONTEMPLATIVE', traits:[['pace',-1],['intimacy',1],['solitude',1],['visual',1]], copy:'You meet this film through observation, interiority, stillness, and visual attention.'},
    {id:'REALIST', label:'REALIST', traits:[['surrealism',-1],['dreamLogic',-1],['complexity',-1],['intimacy',1]], copy:'You meet this film through legibility, lived emotion, and grounded human detail.'},
    {id:'DARK_ROMANTIC', label:'DARK ROMANTIC', traits:[['romance',1],['darkness',1],['nostalgia',1],['intimacy',1]], copy:'You meet this film where attachment and longing remain entangled with darkness.'}
  ];

  function poleStrength(value, dir){
    const signed=(Number(value)-50)/50;
    return clamp(dir===1 ? signed : -signed, 0, 1);
  }

  function buildConnectionRoute(user, film, profile){
    const axisConnections=AXES.map(([axis,label])=>{
      const u=user.vector[axis], f=profile[axis], diff=Math.abs(u-f);
      const closeness=1-diff/100;
      const evidence=user.weights[axis]||.08;
      const sharedExtremity=(Math.abs(u-50)+Math.abs(f-50))/100;
      return {axis,label,user:u,film:f,diff,closeness,evidence,score:closeness*evidence*(.28+.72*sharedExtremity)};
    });
    const byAxis=Object.fromEntries(axisConnections.map(x=>[x.axis,x]));
    const routes=CONNECTION_ROUTES.map(route=>{
      let total=0, possible=0, aligned=0;
      const traits=route.traits.map(([axis,dir])=>{
        const x=byAxis[axis];
        const uPole=poleStrength(x.user,dir), fPole=poleStrength(x.film,dir);
        const directional=Math.sqrt(uPole*fPole);
        const value=x.score*(.25+.75*directional);
        total+=value; possible+=x.evidence; aligned+=directional;
        return {...x,dir,directional,value};
      }).sort((a,b)=>b.value-a.value || a.diff-b.diff);
      const score=possible ? total/possible : 0;
      const alignment=aligned/route.traits.length;
      return {...route,traits,score,alignment};
    }).sort((a,b)=>b.score-a.score || b.alignment-a.alignment);

    const winner=routes[0];
    const evidence=winner.traits.filter(x=>x.value>0).slice(0,3);
    const avgGap=evidence.length ? evidence.reduce((n,x)=>n+x.diff,0)/evidence.length : 0;
    const alpha=winner.alignment>=.28 && avgGap<=18 && winner.score>=(routes[1]?.score||0)*1.04;
    const subtype=alpha?'α':'β';
    const strongest=evidence.length ? evidence : axisConnections.sort((a,b)=>b.score-a.score).slice(0,3);
    const signalText=joinNatural(strongest.map(x=>x.label.toLowerCase()));
    const body=`${film.title} is not matching you through every part of its genome. Your strongest route into it runs through ${signalText}. ${winner.copy}`;
    const note=alpha
      ? 'α = primary route // these shared traits form a concentrated core of the match.'
      : 'β = secondary route // the match arrives through a more mixed or contrastive cluster of traits.';
    return {route:winner.label,subtype,code:`${winner.label.replace(/\s+/g,'-')}-${subtype}`,body,note,evidence:strongest,score:winner.score,alignment:winner.alignment};
  }

  function buildFriction(user, profile){
    if(user.signalStrength<20){
      return {
        rows:[],
        lede:'Your profile stays too close to Neutral to claim a strong mismatch with confidence.',
        note:'CineGenome leaves the friction readout quiet rather than fabricating a conflict from low-strength signals.'
      };
    }
    const rows=AXES.map(([axis,label])=>{
      const u=user.vector[axis], f=profile[axis], diff=Math.abs(u-f), weight=user.weights[axis]||.08;
      return {axis,label,user:u,film:f,diff,score:diff*(.35+.65*weight)};
    }).sort((a,b)=>b.score-a.score || b.diff-a.diff);
    const picked=rows.filter(x=>x.diff>=10).slice(0,2);
    const use=picked.length ? picked : rows.slice(0,1);
    const lines=use.map(x=>{
      const phrase=AXIS_EXPLANATIONS[x.axis]?.high || x.label.toLowerCase();
      return x.user>x.film
        ? `you ask for more ${phrase} than this specimen usually supplies`
        : `this specimen pushes harder toward ${phrase} than your DNA normally requests`;
    });
    const maxGap=use[0]?.diff || 0;
    const joined=joinNatural(lines);
    const frictionSentence=joined ? `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.` : '';
    return {
      rows:use,
      lede:maxGap<8 ? 'Friction is almost absent — this is unusually close to a mirror-image match.' : frictionSentence,
      note:maxGap<8 ? 'The remaining gap lives in low-weight signals rather than a major taste conflict.' : 'That mismatch matters: it keeps the result from becoming a flattering “everything matches” diagnosis and shows where the film may challenge your normal comfort zone.'
    };
  }

  function renderDnaProfileMode(mode, selfRows, specimenRows){
    const specimenMap=Object.fromEntries(specimenRows.map(r=>[r.axis,r]));
    if(mode==='overlay'){
      return selfRows.map(row=>{
        const film=specimenMap[row.axis] || {value:50};
        const selfValue=Number(row.value).toFixed(1);
        const filmValue=Number(film.value).toFixed(1);
        return `<div class="dna-profile-axis dna-profile-axis-overlay">
          <div><span>${escapeHtml(row.label)}</span><b><em>SELF ${selfValue}</em><strong>SPECIMEN ${filmValue}</strong></b></div>
          <i class="dna-overlay-rail"><span class="dna-overlay-self" style="left:${row.value}%"></span><span class="dna-overlay-film" style="left:${film.value}%"></span></i>
        </div>`;
      }).join('');
    }
    const source=mode==='specimen' ? specimenRows : selfRows;
    return source.map(r=>`<div class="dna-profile-axis ${mode==='specimen'?'is-specimen':''}"><div><span>${escapeHtml(r.label)}</span><b>${Number(r.value).toFixed(1)}</b></div><i><em style="width:${r.value}%"></em></i></div>`).join('');
  }

  function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

  function dnaSignature(answers){
    let h = 2166136261;
    for (const value of answers) {
      h ^= Number(value) || 0;
      h = Math.imul(h, 16777619);
    }
    return `CG-${(h >>> 0).toString(16).toUpperCase().padStart(8,'0')}`;
  }

  const GENOME_KEY_ALPHABET='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function genomeBase32Encode(value){
    let n=BigInt(value), out='';
    if(n===0n) return '0';
    while(n>0n){ out=GENOME_KEY_ALPHABET[Number(n%32n)]+out; n/=32n; }
    return out;
  }
  function genomeBase32Decode(value){
    let n=0n;
    for(const ch of String(value).toUpperCase()){
      const idx=GENOME_KEY_ALPHABET.indexOf(ch);
      if(idx<0) throw new Error('INVALID_GENOME_KEY');
      n=n*32n+BigInt(idx);
    }
    return n;
  }
  function genomeChecksum(answers){
    const raw=hash32(`FILMPRINT-V1|${answers.map(v=>clamp(Number(v),1,5)).join('')}`)%1024;
    return genomeBase32Encode(BigInt(raw)).padStart(2,'0');
  }
  function encodeGenomeKey(answers){
    let n=0n;
    answers.slice(0,30).forEach(value=>{ n=n*5n+BigInt(clamp(Number(value),1,5)-1); });
    const body=genomeBase32Encode(n).padStart(14,'0');
    const payload=`${body}${genomeChecksum(answers)}`;
    return `CG1-${payload.slice(0,4)}-${payload.slice(4,8)}-${payload.slice(8,12)}-${payload.slice(12,16)}`;
  }
  function decodeGenomeKey(raw){
    let compact=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    compact=compact.replace(/O/g,'0').replace(/[IL]/g,'1');
    if(!compact.startsWith('CG1')) throw new Error('KEY_PREFIX');
    const payload=compact.slice(3);
    if(payload.length!==16) throw new Error('KEY_LENGTH');
    const body=payload.slice(0,14), check=payload.slice(14);
    let n=genomeBase32Decode(body);
    const answers=Array(30).fill(1);
    for(let i=29;i>=0;i--){ answers[i]=Number(n%5n)+1; n/=5n; }
    if(n!==0n || genomeChecksum(answers)!==check) throw new Error('KEY_CHECKSUM');
    return answers;
  }

  const GENOME_SHARE_CACHE_KEY='cinegenome_genome_share_cache_v1';
  function readGenomeShareCache(){
    try{
      const parsed=JSON.parse(localStorage.getItem(GENOME_SHARE_CACHE_KEY)||'{}');
      return parsed && typeof parsed==='object' ? parsed : {};
    }catch{ return {}; }
  }
  function cachedGenomeShareKey(localKey){
    const hit=readGenomeShareCache()[localKey];
    return hit && typeof hit.key==='string' ? hit.key : '';
  }
  function saveGenomeShareKey(localKey,shareKey){
    try{
      const cache=readGenomeShareCache();
      cache[localKey]={key:shareKey,createdAt:Date.now()};
      localStorage.setItem(GENOME_SHARE_CACHE_KEY,JSON.stringify(cache));
    }catch{}
  }
  function normalizeCloudGenomeKey(raw){
    let compact=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    compact=compact.replace(/O/g,'0').replace(/[IL]/g,'1');
    if(compact.startsWith('CG')) compact=compact.slice(2);
    if(compact.length!==8) throw new Error('CLOUD_KEY_LENGTH');
    if([...compact].some(ch=>GENOME_KEY_ALPHABET.indexOf(ch)<0)) throw new Error('CLOUD_KEY_CHAR');
    return `CG-${compact.slice(0,4)}-${compact.slice(4,8)}`;
  }
  async function publishGenomeShareKey(answers){
    const response=await fetch('/api/genome',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({answers:answers.slice(0,30)})
    });
    let data={};
    try{ data=await response.json(); }catch{}
    if(!response.ok){
      const err=new Error(data?.error||`GENOME_HTTP_${response.status}`);
      err.status=response.status; err.payload=data; throw err;
    }
    return normalizeCloudGenomeKey(data.key);
  }
  async function resolveGenomeFriendKey(raw){
    const compact=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(compact.startsWith('CG1') && compact.length===19){
      const answers=decodeGenomeKey(raw);
      return {answers,key:encodeGenomeKey(answers),source:'local'};
    }
    const key=normalizeCloudGenomeKey(raw);
    const response=await fetch(`/api/genome?key=${encodeURIComponent(key)}`,{cache:'no-store'});
    let data={};
    try{ data=await response.json(); }catch{}
    if(!response.ok){
      const err=new Error(data?.error||`GENOME_HTTP_${response.status}`);
      err.status=response.status; err.payload=data; throw err;
    }
    const answers=Array.isArray(data.answers) ? data.answers.map(Number) : [];
    const complete=answers.length===30 && answers.every(n=>Number.isInteger(n)&&n>=1&&n<=5);
    const profile=complete ? null : readGenomeProfile(data.vector);
    if(!complete && !Object.keys(profile).length) throw new Error('GENOME_RECORD_INVALID');
    return {answers:complete?answers:null,profile,key:normalizeCloudGenomeKey(data.key||key),source:'cloud'};
  }
  function readGenomeProfile(raw){
    if(!raw || typeof raw!=='object' || Array.isArray(raw)) return {};
    const result={};
    for(const [axis,label] of AXES){
      const normalized=key=>String(key).toLowerCase().replace(/[^a-z0-9]/g,'');
      const hit=Object.keys(raw).find(key=>normalized(key)===normalized(axis)||normalized(key)===normalized(label));
      const value=hit==null?null:raw[hit];
      if(value!==null && value!=='' && (typeof value==='number'||typeof value==='string')){
        const number=Number(value);
        if(Number.isFinite(number) && number>=0 && number<=100) result[axis]=number;
      }
    }
    return result;
  }
  function compareHumanDna(a,b){
    const axes=AXES.flatMap(([axis,label],order)=>{
      const av=a.vector?.[axis], bv=b.vector?.[axis];
      if(!Number.isFinite(av)||!Number.isFinite(bv)||av<0||av>100||bv<0||bv>100) return [];
      return [{axis,label,a:av,b:bv,diff:Math.abs(av-bv),order}];
    });
    if(!axes.length) return {similarity:null,shared:[],split:[],axes:[],coverage:0};
    const rms=Math.sqrt(axes.reduce((sum,x)=>sum+(x.diff/100)**2,0)/axes.length);
    const similarity=clamp(100*(1-rms),0,100);
    const shared=[...axes].sort((x,y)=>x.diff-y.diff||x.order-y.order).slice(0,3);
    const sharedAxes=new Set(shared.map(x=>x.axis));
    const split=[...axes].filter(x=>!sharedAxes.has(x.axis)).sort((x,y)=>y.diff-x.diff||x.order-y.order).slice(0,3);
    return {similarity,shared,split,axes,coverage:axes.length};
  }
  function crosscheckReading(cross){
    // Fracture is the dominant difference between the two human profiles.
    // Connection Route below is calculated separately for each person's own film.
    if(cross.coverage<10) return {fracture:null,reason:`ONLY ${cross.coverage}/15 AXES // FRACTURE UNKNOWN.`};
    const ranked=[...cross.axes].sort((x,y)=>y.diff-x.diff||x.order-y.order);
    const fracture=ranked[0];
    const median=ranked[Math.floor(ranked.length/2)].diff;
    return {fracture:fracture?.diff>=25 && fracture.diff-median>=10?fracture:null,reason:null};
  }
  function nearestSpecimenForUser(user){
    return CANDIDATES.map(c=>({c,score:scoreCandidate(user,c)})).sort((a,b)=>b.score-a.score || a.c.rank-b.c.rank)[0];
  }

  function profileRows(user){
    return AXES.map(([axis,label])=>({axis,label,value:round1(user.vector[axis])}));
  }

  const SHARE_FORMATS = {
    story:{label:'STORY 9:16',width:1080,height:1920},
    square:{label:'SQUARE 1:1',width:1080,height:1080},
    portrait:{label:'POST 4:5',width:1080,height:1350},
    wide:{label:'WIDE 16:9',width:1600,height:900}
  };

  function wrapCanvasText(ctx,text,maxWidth){
    const words=String(text).split(/\s+/);
    const lines=[]; let line='';
    for(const word of words){
      const test=line ? `${line} ${word}` : word;
      if(line && ctx.measureText(test).width>maxWidth){ lines.push(line); line=word; }
      else line=test;
    }
    if(line) lines.push(line);
    return lines;
  }

  function drawWrappedCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){
    let lines=wrapCanvasText(ctx,text,maxWidth);
    if(lines.length>maxLines){
      lines=lines.slice(0,maxLines);
      let last=lines[maxLines-1];
      while(last.length>1 && ctx.measureText(`${last}…`).width>maxWidth) last=last.slice(0,-1);
      lines[maxLines-1]=`${last.replace(/[ ,.;:!?-]+$/,'')}…`;
    }
    lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
    return y+lines.length*lineHeight;
  }

  function drawImageCover(ctx,img,x,y,w,h){
    const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
    if(!iw||!ih) return;
    const scale=Math.max(w/iw,h/ih), sw=w/scale, sh=h/scale;
    const sx=(iw-sw)/2, sy=(ih-sh)/2;
    ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
  }

  async function loadCanvasImage(url){
    if(!url) return null;
    const res=await fetch(url,{cache:'force-cache'});
    if(!res.ok) throw new Error(`POSTER_HTTP_${res.status}`);
    const blob=await res.blob();
    const objectUrl=URL.createObjectURL(blob);
    try{
      return await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(new Error('POSTER_DECODE_FAILED'));
        img.src=objectUrl;
      });
    }finally{
      setTimeout(()=>URL.revokeObjectURL(objectUrl),2500);
    }
  }

  async function loadSharePoster(payload){
    const urls=[payload.posterProxyUrl,payload.posterDirectUrl].filter(Boolean);
    for(const url of urls){
      try{ const img=await loadCanvasImage(url); if(img) return img; }catch{}
    }
    return null;
  }

  function canvasLines(ctx,text,maxWidth,maxLines=99){
    let lines=wrapCanvasText(ctx,text,maxWidth);
    if(lines.length>maxLines){
      lines=lines.slice(0,maxLines);
      let last=lines[maxLines-1];
      while(last.length>1 && ctx.measureText(`${last}…`).width>maxWidth) last=last.slice(0,-1);
      lines[maxLines-1]=`${last.replace(/[ ,.;:!?-]+$/,'')}…`;
    }
    return lines;
  }

  function pickShareText(payload, key){
    return payload?.[`${key}Short`] || payload?.[key] || '';
  }

  function drawCompactLine(ctx, text, x, y, width, color, size=18, maxLines=2){
    if(!text) return y;
    ctx.fillStyle=color;
    ctx.font=`700 ${size}px monospace`;
    const lines=canvasLines(ctx, text, width, maxLines);
    const lineH=Math.round(size*1.34);
    lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineH));
    return y + lines.length*lineH;
  }

  function drawStoryShareCard(payload, include, spec){
    const canvas=document.createElement('canvas');
    canvas.width=spec.width; canvas.height=spec.height;
    const ctx=canvas.getContext('2d');
    const w=canvas.width, h=canvas.height;
    const acid='#b8ff35', paper='#eef0e8', muted='#82907d', panel='#101710', rail='#293428';
    const pad=64, contentW=w-pad*2;
    const gradient=ctx.createLinearGradient(0,0,0,h);
    gradient.addColorStop(0,'#0d140d');
    gradient.addColorStop(.55,'#081008');
    gradient.addColorStop(1,'#0d150d');
    ctx.fillStyle=gradient; ctx.fillRect(0,0,w,h);
    ctx.fillStyle=acid; ctx.fillRect(pad,pad,contentW,8);
    ctx.textBaseline='top';

    const hasBio=!!(include.bio && pickShareText(payload,'bio'));
    const hasWhy=!!(include.why && pickShareText(payload,'explanation'));
    const hasFriction=!!(include.friction && pickShareText(payload,'friction'));
    const hasRoute=!!(include.route && payload.connectionRoute);
    const hasProfile=!!(include.profile && payload.peakRows?.length);
    const hasNear=!!(include.near && payload.near?.length);
    const activeCount=[hasBio,hasWhy,hasFriction,hasRoute,hasProfile,hasNear].filter(Boolean).length;

    ctx.fillStyle=acid; ctx.font='700 23px monospace';
    ctx.fillText('CINEGENOME LAB // FILMPRINT',pad,pad+28);

    const scoreColW=250, titleY=pad+74, titleW=contentW-scoreColW-22;
    ctx.fillStyle=paper; ctx.font='900 70px Arial, sans-serif';
    const titleLines=canvasLines(ctx,String(payload.title||'UNTITLED').toUpperCase(),titleW,3);
    const titleLineH=62;
    titleLines.forEach((line,i)=>ctx.fillText(line,pad,titleY+i*titleLineH));
    const headerBottom=titleY+titleLines.length*titleLineH;

    const pctX=w-pad-scoreColW+6;
    ctx.fillStyle=acid; ctx.font='900 84px Arial, sans-serif';
    ctx.fillText(`${payload.score.toFixed(1)}%`,pctX,titleY+2);
    ctx.fillStyle=muted; ctx.font='700 18px monospace';
    ctx.fillText('CINEGENOME MATCH',pctX,titleY+104);
    if(include.meta){
      ctx.fillStyle=paper; ctx.font='700 15px monospace';
      [payload.signature,`SIGNAL ${payload.signalStrength}%`,`COHERENCE ${payload.coherence}%`].forEach((line,i)=>ctx.fillText(line,pctX,titleY+142+i*23));
    }

    let posterW=490, posterH=735;
    if(activeCount <= 2){ posterW=560; posterH=840; }
    else if(activeCount === 3){ posterW=540; posterH=810; }
    else if(activeCount === 4){ posterW=520; posterH=780; }
    const posterY=headerBottom+24, posterX=Math.round((w-posterW)/2);
    if(include.poster){
      ctx.fillStyle='#141d14'; ctx.fillRect(posterX-9,posterY-9,posterW+18,posterH+18);
      ctx.strokeStyle=acid; ctx.lineWidth=3; ctx.strokeRect(posterX-1,posterY-1,posterW+2,posterH+2);
      if(payload.posterImage) drawImageCover(ctx,payload.posterImage,posterX,posterY,posterW,posterH);
      else{
        ctx.fillStyle=panel; ctx.fillRect(posterX,posterY,posterW,posterH);
        ctx.fillStyle=acid; ctx.font='800 24px monospace'; ctx.fillText('POSTER SIGNAL PENDING',posterX+24,posterY+28);
        ctx.fillStyle=paper; ctx.font='900 70px Arial, sans-serif'; ctx.fillText('CG',posterX+24,posterY+82);
        ctx.fillStyle=muted; ctx.font='700 21px monospace'; ctx.fillText('DNA DOSSIER // EXPORT MODE',posterX+24,posterY+150);
      }
      ctx.fillStyle=acid; ctx.fillRect(posterX,posterY+posterH-9,posterW,9);
    }

    let cursorY=include.poster ? posterY+posterH+22 : headerBottom+36;
    const inner=20;
    let footerTop = h - pad - 118;

    const compactBlock=(label,text,accent=false,maxLines=1,bodySize=18)=>{
      if(!text || cursorY>=footerTop) return false;
      ctx.font=`700 ${bodySize}px monospace`;
      const lines=canvasLines(ctx,text,contentW-inner*2,maxLines);
      const lineH=Math.round(bodySize*1.32);
      const blockH=inner+18+8+lines.length*lineH+inner-8;
      if(cursorY+blockH>footerTop) return false;
      ctx.fillStyle=panel; ctx.fillRect(pad,cursorY,contentW,blockH);
      if(accent){ctx.fillStyle=acid;ctx.fillRect(pad,cursorY,7,blockH);}else{ctx.strokeStyle=rail;ctx.lineWidth=2;ctx.strokeRect(pad+1,cursorY+1,contentW-2,blockH-2);}
      ctx.fillStyle=accent?acid:paper; ctx.font='900 19px Arial, sans-serif'; ctx.fillText(label,pad+inner,cursorY+inner);
      ctx.fillStyle=paper; ctx.font=`700 ${bodySize}px monospace`;
      lines.forEach((line,i)=>ctx.fillText(line,pad+inner,cursorY+inner+27+i*lineH));
      cursorY+=blockH+11;
      return true;
    };

    if(hasBio) compactBlock('FILM SPECIMEN BIO',pickShareText(payload,'bio'),false,activeCount <= 4 ? 2 : 1,18);
    if(hasWhy) compactBlock('SPECIMEN AFFINITY',pickShareText(payload,'explanation'),true,activeCount <= 2 ? 4 : activeCount === 3 ? 4 : activeCount === 4 ? 3 : 2,19);
    if(hasFriction) compactBlock('THE FRICTION',pickShareText(payload,'friction'),false,activeCount <= 4 ? 2 : 1,18);

    if(hasRoute && cursorY<footerTop){
      const routeH=104;
      if(cursorY+routeH<=footerTop){
        ctx.fillStyle=panel; ctx.fillRect(pad,cursorY,contentW,routeH);
        ctx.fillStyle=acid; ctx.fillRect(pad,cursorY,7,routeH);
        ctx.fillStyle=muted; ctx.font='700 14px monospace'; ctx.fillText('CONNECTION ROUTE',pad+inner,cursorY+16);
        ctx.fillStyle=acid; ctx.font='900 28px Arial, sans-serif';
        const routeTitle=String(payload.connectionRoute||'UNCLASSIFIED').toUpperCase();
        ctx.fillText(routeTitle,pad+inner,cursorY+37);
        ctx.fillStyle=paper; ctx.font='700 16px monospace';
        ctx.fillText(`SUBJECT PATTERN // ${String(payload.subjectPattern||'UNCLASSIFIED').toUpperCase()}`,pad+inner,cursorY+72);
        cursorY+=routeH+11;
      }
    }

    if(hasProfile && cursorY<footerTop){
      const peakCount = activeCount <= 4 ? 5 : 4;
      const peaks=(payload.peakRows||[]).slice(0,peakCount);
      const blockH = peakCount === 5 ? 206 : 176;
      if(cursorY+blockH<=footerTop){
        ctx.fillStyle=panel; ctx.fillRect(pad,cursorY,contentW,blockH);
        ctx.strokeStyle=rail;ctx.lineWidth=2;ctx.strokeRect(pad+1,cursorY+1,contentW-2,blockH-2);
        ctx.fillStyle=paper; ctx.font='900 19px Arial, sans-serif'; ctx.fillText('DNA READOUT // PEAK MUTATIONS',pad+inner,cursorY+16);
        peaks.forEach((row,i)=>{
          const y=cursorY+47+i*30;
          ctx.fillStyle=paper; ctx.font='700 16px monospace'; ctx.fillText(row.label.toUpperCase(),pad+inner,y);
          ctx.textAlign='right';ctx.fillStyle=acid;ctx.fillText(Number(row.value).toFixed(1),w-pad-inner,y);ctx.textAlign='left';
          const bx=pad+245, bw=contentW-245-inner;
          ctx.fillStyle=rail;ctx.fillRect(bx,y+7,bw,6);
          ctx.fillStyle=acid;ctx.fillRect(bx,y+7,bw*(row.value/100),6);
        });
        cursorY+=blockH+11;
      }
    }

    if(hasNear) compactBlock('NEAR MUTATIONS',payload.near.slice(0,3).join(' // '),false,activeCount <= 4 ? 2 : 1,17);

    const footerLineY = h - pad - 86;
    const footerTextY = footerLineY + 16;
    const footerMetaY = footerLineY + 50;

    ctx.fillStyle=acid; ctx.fillRect(pad,footerLineY,contentW,2);
    ctx.fillStyle=paper; ctx.font='900 22px Arial, sans-serif';
    drawCompactLine(ctx,'30 SIGNALS. NO LUCK. FIND YOUR CINEMATIC DOUBLE.',pad,footerTextY,contentW,paper,22,2);
    ctx.fillStyle=muted; ctx.font='700 14px monospace';
    ctx.fillText('STORY EXPORT // ADAPTIVE SUMMARY LAYOUT',pad,footerMetaY);
    return canvas;
  }

  function drawWideShareCard(payload, include, spec){
    const canvas=document.createElement('canvas');
    canvas.width=spec.width; canvas.height=spec.height;
    const ctx=canvas.getContext('2d');
    const w=canvas.width, h=canvas.height;
    const acid='#b8ff35', paper='#eef0e8', muted='#82907d', rail='#2a3728', panel='#101710';
    const pad=56, footerTop=h-pad-46;
    ctx.fillStyle='#091009'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle=acid; ctx.fillRect(pad,pad,w-pad*2,6);
    ctx.textBaseline='top';
    ctx.fillStyle=acid; ctx.font='700 18px monospace'; ctx.fillText('CINEGENOME LAB // FILMPRINT',pad,pad+18);

    const posterW=include.poster?250:0, posterH=include.poster?375:0;
    const posterX=include.poster?w-pad-posterW:0, posterY=pad+50;
    const leftW=include.poster ? posterX-pad-42 : w-pad*2;

    ctx.fillStyle=paper; ctx.font='900 58px Arial, sans-serif';
    const titleLines=canvasLines(ctx,String(payload.title||'UNTITLED').toUpperCase(),leftW,2);
    const titleLineH=52;
    titleLines.forEach((line,i)=>ctx.fillText(line,pad,pad+54+i*titleLineH));
    const titleBottom=pad+54+titleLines.length*titleLineH;

    ctx.fillStyle=acid; ctx.font='900 72px Arial, sans-serif';
    ctx.fillText(`${payload.score.toFixed(1)}%`,pad,titleBottom+5);
    ctx.fillStyle=muted; ctx.font='700 17px monospace';
    ctx.fillText('CINEGENOME MATCH',pad,titleBottom+84);
    if(include.meta){
      ctx.fillStyle=paper; ctx.font='700 14px monospace';
      ctx.fillText(`${payload.signature} // SIGNAL ${payload.signalStrength}% // COHERENCE ${payload.coherence}%`,pad,titleBottom+112);
    }

    if(include.poster){
      ctx.fillStyle='#141d14';ctx.fillRect(posterX-8,posterY-8,posterW+16,posterH+16);
      if(payload.posterImage) drawImageCover(ctx,payload.posterImage,posterX,posterY,posterW,posterH);
      else{
        ctx.fillStyle=panel;ctx.fillRect(posterX,posterY,posterW,posterH);
        ctx.fillStyle=acid;ctx.font='800 17px monospace';ctx.fillText('POSTER SIGNAL PENDING',posterX+16,posterY+20);
        ctx.fillStyle=paper;ctx.font='900 52px Arial, sans-serif';ctx.fillText('CG',posterX+16,posterY+60);
      }
      ctx.strokeStyle=acid;ctx.lineWidth=2;ctx.strokeRect(posterX-1,posterY-1,posterW+2,posterH+2);
      ctx.fillStyle=acid;ctx.fillRect(posterX,posterY+posterH-7,posterW,7);
    }

    let cursorY=Math.max(titleBottom+148,pad+250);
    const leftBlockW=leftW;
    const compactWide=(label,text,accent=false,maxLines=2)=>{
      if(!text || cursorY>=footerTop) return;
      ctx.font='700 15px monospace';
      const lines=canvasLines(ctx,text,leftBlockW-36,maxLines);
      const lineH=20;
      const bh=15+18+7+lines.length*lineH+12;
      if(cursorY+bh>footerTop) return;
      ctx.fillStyle=panel;ctx.fillRect(pad,cursorY,leftBlockW,bh);
      if(accent){ctx.fillStyle=acid;ctx.fillRect(pad,cursorY,6,bh);}else{ctx.strokeStyle=rail;ctx.lineWidth=2;ctx.strokeRect(pad+1,cursorY+1,leftBlockW-2,bh-2);}
      ctx.fillStyle=accent?acid:paper;ctx.font='900 17px Arial, sans-serif';ctx.fillText(label,pad+16,cursorY+13);
      ctx.fillStyle=paper;ctx.font='700 15px monospace';
      lines.forEach((line,i)=>ctx.fillText(line,pad+16,cursorY+38+i*lineH));
      cursorY+=bh+9;
    };

    if(include.bio) compactWide('FILM SPECIMEN BIO',pickShareText(payload,'bio'),false,1);
    if(include.why) compactWide('SPECIMEN AFFINITY',pickShareText(payload,'explanation'),true,2);
    if(include.friction) compactWide('THE FRICTION',pickShareText(payload,'friction'),false,1);
    if(include.route && payload.connectionRoute && cursorY<footerTop){
      const bh=86;
      if(cursorY+bh<=footerTop){
        ctx.fillStyle=panel;ctx.fillRect(pad,cursorY,leftBlockW,bh);
        ctx.fillStyle=acid;ctx.fillRect(pad,cursorY,6,bh);
        ctx.fillStyle=muted;ctx.font='700 12px monospace';ctx.fillText('CONNECTION ROUTE',pad+16,cursorY+12);
        ctx.fillStyle=acid;ctx.font='900 24px Arial, sans-serif';
        ctx.fillText(String(payload.connectionRoute).toUpperCase(),pad+16,cursorY+30);
        ctx.fillStyle=paper;ctx.font='700 13px monospace';ctx.fillText(`SUBJECT PATTERN // ${String(payload.subjectPattern||'UNCLASSIFIED').toUpperCase()}`,pad+16,cursorY+61);
        cursorY+=bh+9;
      }
    }
    if(include.near && payload.near?.length) compactWide('NEAR MUTATIONS',payload.near.slice(0,3).join(' // '),false,1);

    if(include.profile){
      const peaks=(payload.peakRows||[]).slice(0,3);
      const dx=include.poster?posterX:pad+leftBlockW+30;
      const dw=include.poster?posterW:330;
      let dy=include.poster?posterY+posterH+22:pad+70;
      if(dy+145<footerTop){
        ctx.fillStyle=panel;ctx.fillRect(dx,dy,dw,145);
        ctx.strokeStyle=rail;ctx.lineWidth=2;ctx.strokeRect(dx+1,dy+1,dw-2,143);
        ctx.fillStyle=paper;ctx.font='900 17px Arial, sans-serif';ctx.fillText('DNA PEAKS',dx+16,dy+14);
        peaks.forEach((row,i)=>{
          const y=dy+43+i*29;
          ctx.fillStyle=paper;ctx.font='700 13px monospace';ctx.fillText(row.label.toUpperCase(),dx+16,y);
          ctx.textAlign='right';ctx.fillStyle=acid;ctx.fillText(Number(row.value).toFixed(1),dx+dw-14,y);ctx.textAlign='left';
          ctx.fillStyle=rail;ctx.fillRect(dx+16,y+17,dw-30,5);
          ctx.fillStyle=acid;ctx.fillRect(dx+16,y+17,(dw-30)*(row.value/100),5);
        });
      }
    }

    ctx.fillStyle=acid;ctx.fillRect(pad,h-pad-34,w-pad*2,2);
    ctx.fillStyle=paper;ctx.font='900 19px Arial, sans-serif';
    drawCompactLine(ctx,'30 SIGNALS. NO LUCK. FIND YOUR CINEMATIC DOUBLE.',pad,h-pad-25,w-pad*2,paper,19,1);
    return canvas;
  }

  function drawShareCard(formatKey, payload, options={}){
    const spec=SHARE_FORMATS[formatKey] || SHARE_FORMATS.square;
    const include={poster:true,bio:false,why:true,route:true,profile:true,meta:false,friction:false,near:true,...options};
    if(formatKey==='story') return drawStoryShareCard(payload, include, spec);
    if(formatKey==='wide') return drawWideShareCard(payload, include, spec);
    const canvas=document.createElement('canvas');
    canvas.width=spec.width; canvas.height=spec.height;
    const ctx=canvas.getContext('2d');
    const w=canvas.width,h=canvas.height;
    const ink='#0e120d', paper='#eef0e8', acid='#b8ff35', muted='#7f8a79', rail='#344032', panel='#131a12';
    const pad=Math.round(w*.07);
    ctx.fillStyle=ink; ctx.fillRect(0,0,w,h);
    ctx.fillStyle=acid; ctx.fillRect(pad,pad,w-pad*2,Math.max(6,Math.round(h*.005)));

    ctx.textBaseline='top';
    ctx.fillStyle=acid;
    ctx.font=`700 ${Math.max(20,Math.round(w*.022))}px monospace`;
    ctx.fillText('CINEGENOME LAB // FILMPRINT',pad,pad+Math.round(h*.035));

    const titleY=pad+Math.round(h*.095);
    const posterImage=include.poster ? payload.posterImage : null;
    let posterBox=null;
    let titleWidth=w-pad*2;
    if(posterImage){
      const posterScale=formatKey==='portrait'?.20:.15;
      const pw=Math.round(w*posterScale), ph=Math.round(pw*1.5);
      const px=w-pad-pw, py=titleY;
      posterBox={x:px,y:py,w:pw,h:ph};
      titleWidth=Math.max(Math.round(w*.42),px-pad-Math.round(w*.035));
      ctx.fillStyle='#1b2319'; ctx.fillRect(px-6,py-6,pw+12,ph+12);
      drawImageCover(ctx,posterImage,px,py,pw,ph);
      ctx.strokeStyle=acid; ctx.lineWidth=Math.max(2,Math.round(w*.0025)); ctx.strokeRect(px-1,py-1,pw+2,ph+2);
      ctx.fillStyle=acid; ctx.fillRect(px,py+ph-Math.max(8,Math.round(w*.008)),pw,Math.max(8,Math.round(w*.008)));
    }

    const titleSize=Math.max(52,Math.round(w*.064));
    ctx.fillStyle=paper; ctx.font=`900 ${titleSize}px Arial, sans-serif`;
    const titleLines=wrapCanvasText(ctx,payload.title,titleWidth);
    const titleLineH=Math.round(titleSize*.92);
    titleLines.slice(0,3).forEach((line,i)=>ctx.fillText(line.toUpperCase(),pad,titleY+i*titleLineH));
    const titleBottom=titleY+Math.min(3,titleLines.length)*titleLineH;

    const scoreY=titleBottom+Math.round(h*.024);
    const scoreSize=Math.max(72,Math.round(w*.105));
    const scoreLabelSize=Math.max(16,Math.round(w*.016));
    ctx.fillStyle=acid;
    ctx.font=`900 ${scoreSize}px Arial, sans-serif`;
    ctx.fillText(`${payload.score.toFixed(1)}%`,pad,scoreY);
    const scoreLabelY=scoreY+scoreSize+Math.max(16,Math.round(h*.012));
    ctx.fillStyle=muted;
    ctx.font=`700 ${scoreLabelSize}px monospace`;
    ctx.fillText('CINEGENOME MATCH',pad,scoreLabelY);

    const scoreBottom=scoreLabelY+scoreLabelSize+Math.max(12,Math.round(h*.012));
    const heroBottom=Math.max(scoreBottom,posterBox ? posterBox.y+posterBox.h : 0);
    let cursorY=heroBottom+Math.round(h*.022);
    const footerBase=h-pad-Math.round(h*.075);

    if(include.bio && payload.bio && cursorY<footerBase){
      const bioPad=Math.max(14,Math.round(w*.014));
      const bioTitle=Math.max(15,Math.round(w*.016));
      const bioBody=Math.max(13,Math.round(w*.0145));
      const bioLine=Math.round(bioBody*1.34);
      ctx.font=`700 ${bioBody}px monospace`;
      const maxBioLines=formatKey==='square'?2:3;
      let bioLines=wrapCanvasText(ctx,pickShareText(payload,'bio'),w-pad*2-bioPad*2).slice(0,maxBioLines);
      const bioH=bioPad+bioTitle+Math.round(bioPad*.55)+bioLines.length*bioLine+bioPad;
      if(cursorY+bioH<footerBase){
        ctx.fillStyle='#0d130d'; ctx.fillRect(pad,cursorY,w-pad*2,bioH);
        ctx.strokeStyle=rail; ctx.lineWidth=Math.max(1,Math.round(w*.0015)); ctx.strokeRect(pad+.5,cursorY+.5,w-pad*2-1,bioH-1);
        ctx.fillStyle=paper; ctx.font=`900 ${bioTitle}px Arial, sans-serif`; ctx.fillText('FILM SPECIMEN BIO',pad+bioPad,cursorY+bioPad);
        ctx.fillStyle=muted; ctx.font=`700 ${bioBody}px monospace`;
        let lines=canvasLines(ctx,pickShareText(payload,'bio'),w-pad*2-bioPad*2,maxBioLines);
        const bioY=cursorY+bioPad+bioTitle+Math.round(bioPad*.55);
        lines.forEach((line,i)=>ctx.fillText(line,pad+bioPad,bioY+i*bioLine));
        cursorY+=bioH+Math.round(h*.014);
      }
    }

    if(include.why && payload.explanation && cursorY<footerBase){
      const whyPad=Math.max(16,Math.round(w*.016));
      const whyTitle=Math.max(17,Math.round(w*.018));
      const whyBody=Math.max(16,Math.round(w*.0165));
      const whyLine=Math.round(whyBody*1.36);
      ctx.font=`700 ${whyBody}px monospace`;
      const maxWhyLines=formatKey==='square'?3:4;
      let whyLines=canvasLines(ctx,pickShareText(payload,'explanation'),w-pad*2-whyPad*2,maxWhyLines);
      const whyH=whyPad+whyTitle+Math.round(whyPad*.65)+whyLines.length*whyLine+whyPad;
      if(cursorY+whyH<footerBase){
        ctx.fillStyle=panel; ctx.fillRect(pad,cursorY,w-pad*2,whyH);
        ctx.fillStyle=acid; ctx.fillRect(pad,cursorY,Math.max(5,Math.round(w*.005)),whyH);
        ctx.fillStyle=acid; ctx.font=`900 ${whyTitle}px Arial, sans-serif`; ctx.fillText('SPECIMEN AFFINITY',pad+whyPad,cursorY+whyPad);
        ctx.fillStyle=paper; ctx.font=`700 ${whyBody}px monospace`;
        const whyY=cursorY+whyPad+whyTitle+Math.round(whyPad*.65);
        whyLines.forEach((line,i)=>ctx.fillText(line,pad+whyPad,whyY+i*whyLine));
        cursorY+=whyH+Math.round(h*.018);
      }
    }

    if(include.route && payload.connectionRoute && cursorY<footerBase){
      const routePad=Math.max(14,Math.round(w*.014));
      const routeLabel=Math.max(11,Math.round(w*.0115));
      const routeHead=Math.max(22,Math.round(w*.024));
      const routeMeta=Math.max(12,Math.round(w*.0125));
      const routeH=routePad+routeLabel+7+routeHead+9+routeMeta+routePad;
      if(cursorY+routeH<footerBase){
        ctx.fillStyle=panel; ctx.fillRect(pad,cursorY,w-pad*2,routeH);
        ctx.strokeStyle=rail; ctx.lineWidth=Math.max(1,Math.round(w*.0015)); ctx.strokeRect(pad+.5,cursorY+.5,w-pad*2-1,routeH-1);
        ctx.fillStyle=muted; ctx.font=`700 ${routeLabel}px monospace`; ctx.fillText('CONNECTION ROUTE',pad+routePad,cursorY+routePad);
        ctx.fillStyle=acid; ctx.font=`900 ${routeHead}px Arial, sans-serif`;
        const routeName=String(payload.connectionRoute).toUpperCase();
        ctx.fillText(routeName,pad+routePad,cursorY+routePad+routeLabel+7);
        ctx.fillStyle=paper; ctx.font=`700 ${routeMeta}px monospace`;
        ctx.fillText(`SUBJECT PATTERN // ${String(payload.subjectPattern||'UNCLASSIFIED').toUpperCase()}`,pad+routePad,cursorY+routePad+routeLabel+7+routeHead+9);
        cursorY+=routeH+Math.round(h*.014);
      }
    }

    if(include.meta && cursorY<footerBase){
      ctx.fillStyle=paper; ctx.font=`900 ${Math.max(22,Math.round(w*.024))}px Arial, sans-serif`;
      ctx.fillText('DNA READOUT',pad,cursorY);
      ctx.fillStyle=muted; ctx.font=`700 ${Math.max(13,Math.round(w*.013))}px monospace`;
      const metaText = `${payload.signature} // SIGNAL ${payload.signalStrength}% // COHERENCE ${payload.coherence}%`;
      drawCompactLine(ctx,metaText,pad,cursorY+Math.round(w*.033),w-pad*2,muted,Math.max(13,Math.round(w*.013)),2);
      cursorY+=Math.round(w*.067);
    }

    if(include.friction && payload.friction && cursorY<footerBase){
      ctx.fillStyle=acid; ctx.font=`900 ${Math.max(18,Math.round(w*.019))}px Arial, sans-serif`;
      ctx.fillText('THE FRICTION',pad,cursorY);
      ctx.fillStyle=muted; ctx.font=`700 ${Math.max(13,Math.round(w*.013))}px monospace`;
      cursorY=drawWrappedCanvasText(ctx,pickShareText(payload,'friction'),pad,cursorY+Math.round(w*.028),w-pad*2,Math.max(18,Math.round(w*.018)),2)+Math.round(h*.012);
    }

    if(include.profile && cursorY<footerBase){
      ctx.fillStyle=paper; ctx.font=`900 ${Math.max(22,Math.round(w*.024))}px Arial, sans-serif`;
      ctx.fillText('YOUR CINEMATIC DNA',pad,cursorY);
      cursorY+=Math.round(w*.046);

      const rows=payload.rows;
      const cols=3;
      const gap=Math.round(w*.025);
      const colW=(w-pad*2-gap*(cols-1))/cols;
      const rowsPerCol=Math.ceil(rows.length/cols);
      const remaining=Math.max(90,footerBase-cursorY-(include.near?Math.round(h*.06):0));
      const rowH=Math.max(27,Math.min(Math.round(w*.048),Math.floor(remaining/rowsPerCol)));
      rows.forEach((row,idx)=>{
        const col=Math.floor(idx/rowsPerCol);
        const r=idx%rowsPerCol;
        const x=pad+col*(colW+gap), y=cursorY+r*rowH;
        if(y+rowH>footerBase) return;
        ctx.fillStyle=paper; ctx.font=`700 ${Math.max(11,Math.round(w*.0115))}px monospace`;
        ctx.fillText(row.label,x,y);
        ctx.textAlign='right'; ctx.fillStyle=acid; ctx.fillText(Number(row.value).toFixed(1),x+colW,y); ctx.textAlign='left';
        const barY=y+Math.max(18,Math.round(w*.017));
        ctx.fillStyle=rail; ctx.fillRect(x,barY,colW,Math.max(4,Math.round(w*.004)));
        ctx.fillStyle=acid; ctx.fillRect(x,barY,colW*(row.value/100),Math.max(4,Math.round(w*.004)));
      });
      cursorY+=rowsPerCol*rowH+Math.round(h*.012);
    }

    if(include.near && payload.near?.length && cursorY<footerBase){
      ctx.fillStyle=muted; ctx.font=`700 ${Math.max(12,Math.round(w*.0125))}px monospace`;
      const near=`NEAR MUTATIONS // ${payload.near.slice(0,3).join(' // ')}`;
      drawWrappedCanvasText(ctx,near,pad,cursorY,w-pad*2,Math.max(18,Math.round(w*.018)),2);
    }

    const footerY=h-pad-Math.round(h*.04);
    ctx.fillStyle=paper; ctx.font=`900 ${Math.max(20,Math.round(w*.023))}px Arial, sans-serif`;
    drawCompactLine(ctx,'30 SIGNALS. NO LUCK. FIND YOUR CINEMATIC DOUBLE.',pad,footerY,w-pad*2,paper,Math.max(20,Math.round(w*.023)),2);
    return canvas;
  }

  async function exportShareCard(formatKey,payload,options){
    const renderPayload={...payload};
    if(options?.poster) renderPayload.posterImage=await loadSharePoster(payload);
    const canvas=drawShareCard(formatKey,renderPayload,options);
    const blob=await new Promise((resolve,reject)=>{
      try{ canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG_RENDER_FAILED')),'image/png',1); }
      catch(err){ reject(err); }
    });
    const safe=String(payload.title||'result').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'result';
    const filename=`cinegenome-dna-${safe}-${formatKey}.png`;
    if(blob && typeof File!=='undefined'){
      const file=new File([blob],filename,{type:'image/png'});
      try{
        if(navigator.share && navigator.canShare?.({files:[file]})){
          await navigator.share({files:[file],title:'CineGenome DNA',text:`${payload.title} // ${payload.score.toFixed(1)}% CineGenome match`});
          return 'SHARED';
        }
      }catch(err){
        if(err?.name==='AbortError') return 'CANCELLED';
      }
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      return 'DOWNLOADED';
    }
    const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=filename; document.body.appendChild(a); a.click(); a.remove();
    return 'DOWNLOADED';
  }

  function loadState(){
    try { const x=JSON.parse(localStorage.getItem(STORE_KEY)||'null'); return x && Array.isArray(x.answers) ? x : null; } catch { return null; }
  }
  function saveState(state){ try { localStorage.setItem(STORE_KEY,JSON.stringify(state)); } catch {} }
  function clearState(){ try { localStorage.removeItem(STORE_KEY); } catch {} }

  function init(root){
    let saved = loadState();
    let state = saved || {started:false,index:0,answers:Array(30).fill(3),touched:Array(30).fill(false),done:false};

    const render = () => {
      if (!state.started) return renderIntro();
      if (state.done) return renderResult();
      renderQuestion();
    };

    const renderIntro = () => {
      root.innerHTML = `
        <div class="dna-test-intro">
          <div class="dna-test-index">PSYCHOMETRIC PASS // 30 SIGNALS // 5-POINT LIKERT</div>
          <p>Thirty paired signals cut your taste into a 15-axis profile. The machine returns the closest cinematic specimen. No random draw. Neutral counts — it just whispers.</p>
          <div class="dna-test-meta"><span>30 QUESTIONS</span><span>15 TASTE AXES</span><span>1 CLOSEST SPECIMEN</span></div>
          <button class="lab-btn primary dna-begin" type="button">BEGIN SEQUENCE</button>
          ${saved && saved.started ? '<button class="dna-resume" type="button">RESUME PREVIOUS SIGNAL</button>' : ''}
        </div>`;
      root.querySelector('.dna-begin')?.addEventListener('click',()=>{ state={started:true,index:0,answers:Array(30).fill(3),touched:Array(30).fill(false),done:false}; saveState(state); render(); });
      root.querySelector('.dna-resume')?.addEventListener('click',()=>{ state=saved; render(); });
    };

    const renderQuestion = () => {
      const i = state.index;
      const [, , text] = Q[i];
      const val = Number(state.answers[i] ?? 3);
      const touched = !!state.touched[i];
      root.innerHTML = `
        <div class="dna-test-question">
          <div class="dna-test-progressline"><b>${String(i+1).padStart(2,'0')} / 30</b><span>${Math.round(i/30*100)}% SEQUENCED</span></div>
          <div class="dna-test-progress"><i style="width:${(i/30)*100}%"></i></div>
          <div class="dna-question-code">SIGNAL ${String(i+1).padStart(2,'0')} // ${AXES.find(a=>a[0]===Q[i][0])?.[1] || 'TRAIT'}</div>
          <h3>${escapeHtml(text)}</h3>
          <div class="likert-shell ${touched?'is-touched':''}">
            <input class="likert-range" type="range" min="1" max="5" step="1" value="${val}" aria-label="Five point agreement scale">
            <div class="likert-dots" role="group" aria-label="Five point agreement scale">${[1,2,3,4,5].map(n=>`<button type="button" data-likert-value="${n}" class="${touched && n===val?'is-on':''}" aria-label="${SCALE[n-1]}" title="${SCALE[n-1]}"></button>`).join('')}</div>
            <div class="likert-ends"><span>STRONGLY<br>DISAGREE</span><b>${SCALE[val-1]}</b><span>STRONGLY<br>AGREE</span></div>
          </div>
          <div class="dna-question-actions">
            <button class="lab-btn dna-back" type="button" ${i===0?'disabled':''}>← BACK</button>
            <button class="lab-btn primary dna-next" type="button" ${touched?'':'disabled'}>${i===29?'SEQUENCE DNA':'NEXT SIGNAL →'}</button>
          </div>
          <small class="dna-touch-hint">CLICK ANY POINT TO LOCK IT — NEUTRAL COUNTS.</small>
        </div>`;
      const range = root.querySelector('.likert-range');
      const shell = root.querySelector('.likert-shell');
      const next = root.querySelector('.dna-next');
      const setValue = (raw) => {
        const value = clamp(Number(raw),1,5);
        state.answers[i]=value; state.touched[i]=true; saveState(state);
        if (range) range.value=String(value);
        shell?.classList.add('is-touched');
        const label=root.querySelector('.likert-ends b'); if(label) label.textContent=SCALE[value-1];
        root.querySelectorAll('[data-likert-value]').forEach(dot=>dot.classList.toggle('is-on',Number(dot.dataset.likertValue)===value));
        next.disabled=false;
      };
      range?.addEventListener('input',()=>setValue(range.value));
      // A click on the current thumb position must still count as an explicit answer.
      // This is especially important for NEUTRAL because a range input does not emit
      // `input` when its value stays at the default midpoint.
      range?.addEventListener('click',()=>setValue(range.value));
      root.querySelectorAll('[data-likert-value]').forEach(dot=>dot.addEventListener('click',()=>setValue(dot.dataset.likertValue)));
      root.querySelector('.dna-back')?.addEventListener('click',()=>{ if(i>0){state.index--; saveState(state); render();} });
      next?.addEventListener('click',()=>{
        if(!state.touched[i]) return;
        if(i<29){ state.index++; saveState(state); render(); }
        else { state.done=true; saveState(state); renderSequenceScan(); }
      });
    };

    const renderSequenceScan = () => {
      root.innerHTML = `
        <div class="dna-synthesis-stage" aria-live="polite">
          <div class="synthesis-hud synthesis-hud-left" aria-hidden="true">
            <span>SUBJECT // FP-030</span><span>CHAMBER // 15A</span><span>STATE // SYNTHESIS</span>
          </div>
          <div class="synthesis-hud synthesis-hud-right" aria-hidden="true">
            <span>POOL // 250</span><span>MODEL // DETERMINISTIC</span><span>LINK // LOCAL</span>
          </div>
          <div class="synthesis-terminal">
            <div class="synthesis-kicker">CINEGENOME // SPECIMEN SYNTHESIS</div>
            <div class="synthesis-chamber" data-synthesis-chamber>
              <div class="synthesis-cap synthesis-cap-top"><i></i><i></i><i></i></div>
              <div class="synthesis-glass">
                <div class="synthesis-liquid"></div>
                <div class="synthesis-bubbles" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--x:${9+(i*7)%82}%;--d:${(i*.13).toFixed(2)}s;--s:${4+(i%4)*2}px"></i>`).join('')}</div>
                <div class="synthesis-helix" aria-hidden="true">${synthesisHelixMarkup()}</div>
                <div class="synthesis-beam"></div>
                <div class="synthesis-lock" data-synthesis-lock>SPECIMEN<br>LOCK</div>
              </div>
              <div class="synthesis-cap synthesis-cap-bottom"><i></i><i></i><i></i></div>
            </div>
            <div class="synthesis-copy">
              <div class="synthesis-title" data-synthesis-title>INITIALIZING CHAMBER</div>
              <div class="synthesis-status" data-synthesis-status>30 RESPONSE SIGNALS SECURED.</div>
            </div>
            <div class="synthesis-axis-grid">${synthesisAxesMarkup()}</div>
            <div class="synthesis-progress"><i data-synthesis-meter style="width:6%"></i></div>
          </div>
        </div>`;

      const title=root.querySelector('[data-synthesis-title]');
      const status=root.querySelector('[data-synthesis-status]');
      const meter=root.querySelector('[data-synthesis-meter]');
      const chamber=root.querySelector('[data-synthesis-chamber]');
      const lock=root.querySelector('[data-synthesis-lock]');
      const axes=[...root.querySelectorAll('[data-synth-axis]')];
      const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      const materializeResult=()=>{
        renderResult();
        requestAnimationFrame(()=>{
          const result=root.querySelector('.dna-result');
          result?.classList.add('is-specimen-reveal');
          setTimeout(()=>result?.classList.remove('is-specimen-reveal'),1250);
        });
      };

      if(reduced){
        axes.forEach(x=>x.classList.add('is-on'));
        chamber?.classList.add('is-locked');
        if(lock) lock.classList.add('is-on');
        if(title) title.textContent='SPECIMEN LOCKED';
        if(status) status.textContent='CLOSEST CINEMATIC GENOME RESOLVED.';
        if(meter) meter.style.width='100%';
        setTimeout(materializeResult,260);
        return;
      }

      setTimeout(()=>{
        chamber?.classList.add('is-live');
        if(title) title.textContent='CENTRIFUGING SIGNALS';
        if(status) status.textContent='SEPARATING PREFERENCE NOISE FROM LOCKED SIGNAL.';
        if(meter) meter.style.width='24%';
      },260);

      setTimeout(()=>{
        chamber?.classList.add('is-assembling');
        if(title) title.textContent='ASSEMBLING CINEMATIC GENOME';
        if(status) status.textContent='MAPPING 15 AXES INTO A SINGLE SUBJECT STRAND.';
        if(meter) meter.style.width='52%';
        axes.forEach((cell,i)=>setTimeout(()=>cell.classList.add('is-on'),i*62));
      },900);

      setTimeout(()=>{
        chamber?.classList.add('is-searching');
        if(title) title.textContent='CROSS-MATCHING SPECIMENS';
        if(status) status.textContent='250 FILM GENOMES PASSING THROUGH THE CHAMBER.';
        if(meter) meter.style.width='82%';
      },1900);

      setTimeout(()=>{
        chamber?.classList.add('is-locked');
        if(lock) lock.classList.add('is-on');
        if(title) title.textContent='SPECIMEN LOCKED';
        if(status) status.textContent='CLOSEST CINEMATIC GENOME RESOLVED.';
        if(meter) meter.style.width='100%';
      },2750);

      setTimeout(()=>{
        root.querySelector('.dna-synthesis-stage')?.classList.add('is-release');
      },3200);
      setTimeout(materializeResult,3520);
    };

    const renderResult = () => {
      const user = buildUserVector(state.answers);
      const ranked = CANDIDATES.map(c=>({c,score:scoreCandidate(user,c)})).sort((a,b)=>b.score-a.score || a.c.rank-b.c.rank);
      const best = ranked[0], reasons = topReasons(user,best.c.profile);
      const displayScore = clamp(best.score * (.82 + .18*(user.signalStrength/100)), 35, 98.7);
      const rows = profileRows(user);
      const specimenRows = AXES.map(([axis,label])=>({axis,label,value:round1(best.c.profile[axis])}));
      const signature = dnaSignature(state.answers);
      const genomeKey = encodeGenomeKey(state.answers);
      const cachedShareKey = cachedGenomeShareKey(genomeKey);
      const nearTitles = ranked.slice(1,4).map(x=>x.c.title);
      const explanation = buildMatchExplanation(user,best.c,reasons);
      const diagnosis = buildCinematicDiagnosis(user);
      const filmBio = buildFilmSpecimenBio(best.c,best.c.profile);
      const friction = buildFriction(user,best.c.profile);
      const connection = buildConnectionRoute(user,best.c,best.c.profile);
      root.innerHTML = `
        <div class="dna-result" data-dna-result>
          <div class="dna-result-toolbar">
            <div class="dna-result-label"><span>YOUR CLOSEST SPECIMEN // DNA LOCK ACQUIRED</span>${dnaInfoButton('specimen','What is the closest specimen?')}</div>
            <div class="dna-genome-key ${cachedShareKey?'is-cloud':'is-unpublished'}" aria-label="Shareable Filmprint Genome Key">
              <div class="dna-genome-key-copy"><span>GENOME KEY ${dnaInfoButton('genome','What is a Genome Key?')}</span><small data-genome-key-mode>${cachedShareKey?'SHARE KEY // READY':'SHARE KEY // CREATE ON DEMAND'}</small></div>
              <code data-genome-key-code>${cachedShareKey||'NOT GENERATED'}</code>
              <div class="dna-genome-key-actions">
                <button type="button" data-genome-copy ${cachedShareKey?'':'hidden'}>COPY KEY</button>
                <button type="button" data-genome-publish ${cachedShareKey?'hidden':''}>CREATE SHARE KEY</button>
                <button type="button" data-genome-compare-toggle>COMPARE DNA</button>
              </div>
              <em data-genome-copy-status aria-live="polite">${cachedShareKey?'READY TO SHARE // YOUR FULL RESULT STAYS LOCAL.':'YOUR RESULT STAYS LOCAL UNTIL YOU CREATE A SHARE KEY.'}</em>
            </div>
          </div>
          <section class="dna-compare-panel" data-genome-compare-panel hidden aria-label="Compare Filmprint DNA with a friend">
            <div class="dna-compare-panel-head"><div><span>DNA CROSSCHECK</span><small>PASTE A FRIEND'S GENOME KEY</small></div><button type="button" data-genome-compare-close aria-label="Close comparison">×</button></div>
            <div class="dna-compare-entry"><input type="text" data-genome-friend-key autocomplete="off" spellcheck="false" placeholder="CG-XXXX-XXXX"><button type="button" class="lab-btn primary" data-genome-compare-run>RUN CROSSCHECK</button></div>
            <small class="dna-compare-hint">PASTE A FRIEND'S GENOME KEY. COMPATIBLE LEGACY KEYS ARE STILL ACCEPTED SILENTLY. NO ACCOUNT IDENTITY IS INCLUDED.</small>
            <div class="dna-compare-output" data-genome-compare-output hidden></div>
          </section>
          <div class="dna-result-grid">
            <div class="dna-result-poster"><div class="dna-result-poster-fallback">CG<br>DNA</div><img alt="" hidden></div>
            <div class="dna-result-copy">
              <div class="dna-rank">CINEMATIC SPECIMEN // MATCHED</div>
              <h3>${escapeHtml(best.c.title)}</h3>
              <div class="dna-match"><strong>${displayScore.toFixed(1)}%</strong><span>CINEGENOME MATCH ${dnaInfoButton('match','What does the match percentage mean?')}</span></div>
              <p>Closest match across your 15-axis cinematic taste pattern.</p>
              <div class="dna-phenotype-line"><span>SPECIMEN PHENOTYPE ${dnaInfoButton('phenotype','What is Specimen Phenotype?')}</span><b>${escapeHtml(filmBio.family)}</b><small>${escapeHtml(filmBio.dominant.slice(0,2).map(x=>x.label.toUpperCase()).join(' // '))}</small></div>
              <div class="dna-reasons">${reasons.map(r=>`<span>${r.label}<b>${round1(100-r.diff).toFixed(1)}%</b></span>`).join('')}</div>
            </div>
          </div>
          <section class="dna-why dna-affinity" aria-label="Specimen affinity analysis">
            <div class="dna-why-head"><span>SPECIMEN AFFINITY ${dnaInfoButton('affinity','What is Specimen Affinity?')}</span><small>ALIGNMENT + DEVIATION // MATCH READOUT</small></div>
            <div class="dna-affinity-band is-alignment"><b>ALIGNMENT</b><p class="dna-why-lede">${escapeHtml(explanation.lede)}</p></div>
            <p>${escapeHtml(explanation.body)}</p>
            <div class="dna-why-evidence">${explanation.evidence.map(r=>`<span><b>${escapeHtml(r.label)}</b><em>YOU ${round1(r.user).toFixed(1)} ↔ FILM ${round1(r.film).toFixed(1)}</em></span>`).join('')}</div>
            <div class="dna-affinity-band is-deviation"><b>GENOMIC DEVIATION</b><p>${escapeHtml(friction.lede)}</p>${friction.rows?.length?`<em>${escapeHtml(friction.rows[0].label.toUpperCase())} // YOU ${round1(friction.rows[0].user).toFixed(1)} ↔ FILM ${round1(friction.rows[0].film).toFixed(1)}</em>`:''}</div>
            <small class="dna-why-note">${escapeHtml(explanation.note)}</small>
          </section>
          <section class="dna-connection" aria-label="How your DNA connects to this film">
            <div class="dna-connection-head"><span>CONNECTION ROUTE ${dnaInfoButton('route','What is Connection Route?')}</span><small>HOW YOU ENTER THIS SPECIMEN</small></div>
            <div class="dna-connection-type"><strong>${escapeHtml(connection.route)}</strong><b>${escapeHtml(connection.subtype)}</b></div>
            <div class="dna-subject-readout"><span>SUBJECT PATTERN</span><b>${escapeHtml(diagnosis.code)}</b></div>
            <p>${escapeHtml(connection.body)}</p>
            <div class="dna-connection-evidence">${connection.evidence.map(r=>`<span><b>${escapeHtml(r.label)}</b><em>YOU ${round1(r.user).toFixed(1)} ↔ FILM ${round1(r.film).toFixed(1)}</em></span>`).join('')}</div>
            <small>${escapeHtml(connection.note)}</small>
          </section>
          <section class="dna-profile" aria-label="Cinematic DNA profile viewer">
            <div class="dna-profile-head">
              <div><span class="dna-profile-title-line"><span data-dna-profile-label>SELF DNA // 15 AXES</span>${dnaInfoButton('profile','What is the DNA Profile?')}</span><b>${signature}</b></div>
              <div class="dna-profile-head-right">
                <small data-dna-profile-meta>SIGNAL ${user.signalStrength}% // COHERENCE ${user.coherence}%</small>
                <div class="dna-profile-overlay-key" data-dna-overlay-key hidden aria-label="Overlay marker guide">
                  <span class="is-self"><i></i><b>GREEN = YOU</b></span>
                  <span class="is-film"><i></i><b>HOLLOW = FILM</b></span>
                </div>
              </div>
            </div>
            <div class="dna-profile-switch" role="tablist" aria-label="DNA profile view">
              <button type="button" class="is-active" data-dna-profile-mode="self" role="tab" aria-selected="true">SELF</button>
              <button type="button" data-dna-profile-mode="specimen" role="tab" aria-selected="false">SPECIMEN</button>
              <button type="button" data-dna-profile-mode="overlay" role="tab" aria-selected="false">OVERLAY</button>
            </div>
            <div class="dna-profile-grid" data-dna-profile-grid>${renderDnaProfileMode('self',rows,specimenRows)}</div>
          </section>
          <section class="dna-near" aria-label="Near mutations">
            <div class="dna-near-head"><span>NEAR MUTATIONS ${dnaInfoButton('near','What are Near Mutations?')}</span><small>ALTERNATE SPECIMENS // NEXT CLOSEST SIGNALS</small></div>
            <div class="dna-near-grid">${nearTitles.map((title,n)=>`<b><em>#0${n+2}</em><strong>${escapeHtml(title)}</strong></b>`).join('')}</div>
          </section>
          <dialog class="dna-info-dialog" data-dna-info-dialog aria-label="Filmprint field note">
            <div class="dna-info-shell">
              <button type="button" class="dna-info-close" data-dna-info-close aria-label="Close field note">×</button>
              <small>FILMPRINT // FIELD NOTE</small>
              <h4 data-dna-info-title>FIELD NOTE</h4>
              <p data-dna-info-body></p>
            </div>
          </dialog>
          <dialog class="dna-export-dialog" data-share-dialog aria-label="Export Filmprint DNA card">
            <div class="dna-export-shell">
              <div class="dna-export-head"><div><span>OUTPUT TERMINAL // DNA CARD</span><b>SELECT EXPORT SPECIMEN</b></div><button type="button" data-share-close aria-label="Close export terminal">×</button></div>
              <div class="dna-share-options" role="group" aria-label="Choose what appears on the share card">
                <label><input type="checkbox" data-share-option="poster" checked><span>FILM POSTER</span></label>
                <label><input type="checkbox" data-share-option="why" checked><span>SPECIMEN AFFINITY</span></label>
                <label><input type="checkbox" data-share-option="route" checked><span>CONNECTION ROUTE</span></label>
                <label><input type="checkbox" data-share-option="profile" checked><span>DNA PROFILE</span></label>
                <label><input type="checkbox" data-share-option="near" checked><span>NEAR MUTATIONS</span></label>
              </div>
              <div class="dna-export-formats">${Object.entries(SHARE_FORMATS).map(([key,spec])=>`<button class="dna-export-format" type="button" data-share-format="${key}"><b>${spec.label}</b><small>${spec.width} × ${spec.height} PNG</small></button>`).join('')}</div>
              <small class="dna-share-status" aria-live="polite">SELECT MODULES, THEN CHOOSE AN OUTPUT SIZE.</small>
            </div>
          </dialog>
          <div class="dna-result-actions"><small>Deterministic model: same answers = same result.</small><div class="dna-result-action-buttons"><button class="lab-btn primary dna-retake" type="button">RETEST DNA</button><button class="lab-btn dna-export-open" type="button" data-share-open>EXPORT DNA CARD</button></div></div>
        </div>`;
      root.querySelector('.dna-retake')?.addEventListener('click',()=>{ clearState(); saved=null; state={started:true,index:0,answers:Array(30).fill(3),touched:Array(30).fill(false),done:false}; saveState(state); render(); });

      const infoDialog=root.querySelector('[data-dna-info-dialog]');
      const infoTitle=root.querySelector('[data-dna-info-title]');
      const infoBody=root.querySelector('[data-dna-info-body]');
      root.querySelectorAll('[data-dna-info]').forEach(btn=>btn.addEventListener('click',event=>{
        event.preventDefault(); event.stopPropagation();
        const note=RESULT_INFO[btn.dataset.dnaInfo];
        if(!note||!infoDialog)return;
        if(infoTitle)infoTitle.textContent=note[0];
        if(infoBody)infoBody.textContent=note[1];
        if(typeof infoDialog.showModal==='function')infoDialog.showModal(); else infoDialog.setAttribute('open','');
      }));
      root.querySelector('[data-dna-info-close]')?.addEventListener('click',()=>infoDialog?.close?.());
      infoDialog?.addEventListener('click',event=>{ if(event.target===infoDialog) infoDialog.close?.(); });

      const genomeCopyStatus=root.querySelector('[data-genome-copy-status]');
      const genomeCode=root.querySelector('[data-genome-key-code]');
      const genomeMode=root.querySelector('[data-genome-key-mode]');
      const genomePublish=root.querySelector('[data-genome-publish]');
      let activeGenomeKey=cachedShareKey||'';
      const setGenomeStatus=(message,timeout=3200)=>{
        if(!genomeCopyStatus) return;
        genomeCopyStatus.textContent=message;
        if(timeout) setTimeout(()=>{ if(genomeCopyStatus?.textContent===message) genomeCopyStatus.textContent=''; },timeout);
      };
      const genomeCopy=root.querySelector('[data-genome-copy]');
      root.querySelector('[data-genome-copy]')?.addEventListener('click',async()=>{
        const value=activeGenomeKey;
        if(!value){ setGenomeStatus('CREATE A SHARE KEY FIRST.'); return; }
        let copied=false;
        try{ await navigator.clipboard.writeText(value); copied=true; }catch{}
        if(!copied){
          try{
            const ta=document.createElement('textarea'); ta.value=value; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0';
            document.body.appendChild(ta); ta.select(); copied=document.execCommand('copy'); ta.remove();
          }catch{}
        }
        setGenomeStatus(copied?'GENOME KEY COPIED.':'COPY FAILED — SELECT THE KEY MANUALLY.');
      });
      genomePublish?.addEventListener('click',async()=>{
        const old=genomePublish.textContent;
        genomePublish.disabled=true; genomePublish.textContent='GENERATING…';
        setGenomeStatus('REQUESTING SHORT SHARE KEY…',0);
        try{
          const shareKey=await publishGenomeShareKey(state.answers);
          activeGenomeKey=shareKey;
          saveGenomeShareKey(genomeKey,shareKey);
          if(genomeCode) genomeCode.textContent=shareKey;
          if(genomeMode) genomeMode.textContent='SHARE KEY // READY';
          if(genomeCopy) genomeCopy.hidden=false;
          genomePublish.hidden=true;
          const keyShell=genomePublish.closest('.dna-genome-key');
          keyShell?.classList.remove('is-unpublished');
          keyShell?.classList.add('is-cloud');
          setGenomeStatus('READY TO SHARE // YOUR FULL RESULT STAYS LOCAL.',5200);
        }catch(err){
          genomePublish.textContent=old;
          const noStore=err?.status===503 || err?.payload?.error==='genome_store_not_configured';
          setGenomeStatus(noStore?'SHARE STORE NOT CONNECTED — YOUR RESULT IS STILL SAFE LOCALLY.':'SHARE KEY FAILED — YOUR RESULT IS STILL SAFE LOCALLY.',5200);
        }finally{ genomePublish.disabled=false; }
      });

      const comparePanel=root.querySelector('[data-genome-compare-panel]');
      const compareInput=root.querySelector('[data-genome-friend-key]');
      const compareOutput=root.querySelector('[data-genome-compare-output]');
      const setCompareOpen=(open)=>{
        if(!comparePanel) return;
        comparePanel.hidden=!open;
        if(open) setTimeout(()=>compareInput?.focus(),0);
      };
      root.querySelector('[data-genome-compare-toggle]')?.addEventListener('click',()=>setCompareOpen(comparePanel?.hidden!==false));
      root.querySelector('[data-genome-compare-close]')?.addEventListener('click',()=>setCompareOpen(false));
      const runGenomeCompare=async()=>{
        if(!compareInput || !compareOutput) return;
        const raw=compareInput.value.trim();
        if(!raw){ compareOutput.hidden=false; compareOutput.innerHTML='<div class="dna-compare-error">PASTE A GENOME KEY FIRST.</div>'; return; }
        const runButton=root.querySelector('[data-genome-compare-run]');
        const old=runButton?.textContent||'RUN CROSSCHECK';
        if(runButton){runButton.disabled=true;runButton.textContent='RESOLVING…';}
        compareOutput.hidden=false;
        compareOutput.innerHTML='<div class="dna-compare-error">RESOLVING GENOME SIGNAL…</div>';
        try{
          const resolved=await resolveGenomeFriendKey(raw);
          const friendAnswers=resolved.answers;
          const friendUser=friendAnswers?buildUserVector(friendAnswers):{vector:resolved.profile};
          const cross=compareHumanDna(user,friendUser);
          const friendNearest=friendAnswers?nearestSpecimenForUser(friendUser):null;
          const friendConnection=friendNearest?buildConnectionRoute(friendUser,friendNearest.c,friendNearest.c.profile):null;
          const friendSignature=friendAnswers?dnaSignature(friendAnswers):'UNKNOWN';
          const signalRow=x=>`<div class="dna-compare-row"><b>${escapeHtml(x.label)}</b><small>YOU ${x.a.toFixed(1)} / FRIEND ${x.b.toFixed(1)}</small><em>Δ${x.diff.toFixed(1)}</em></div>`;
          const reading=crosscheckReading(cross);
          const fractureLine=reading.fracture
            ? `YOU ${reading.fracture.a.toFixed(1)} / FRIEND ${reading.fracture.b.toFixed(1)} / Δ${reading.fracture.diff.toFixed(1)}. ${reading.fracture.a>reading.fracture.b?'YOU':'FRIEND'} HIGHER.`
            : reading.reason||'NO SINGLE AXIS STANDS OUT AS A FRACTURE.';
          compareInput.value=resolved.key;
          compareOutput.innerHTML=`
            <div class="dna-compare-score"><span>DNA SYNC</span><strong>${cross.similarity==null?'UNKNOWN':`${cross.similarity.toFixed(1)}%`}</strong><small>DATA COVERAGE ${cross.coverage}/15 AXES${cross.coverage<15?' // PARTIAL':''}</small></div>
            <div class="dna-compare-specimen"><div><span>YOUR SPECIMEN</span><b>${escapeHtml(best.c.title)}</b><small>${signature}</small></div><i>VS</i><div><span>FRIEND SPECIMEN</span><b>${friendNearest?escapeHtml(friendNearest.c.title):'UNKNOWN'}</b><small>${friendSignature}</small></div></div>
            <div class="dna-compare-signals">
              <div><span>SHARED SIGNALS</span>${cross.shared.length?cross.shared.map(signalRow).join(''):'<small>UNKNOWN // NO COMPARABLE AXES</small>'}</div>
              <div><span>SPLIT SIGNALS</span>${cross.split.length?cross.split.map(signalRow).join(''):'<small>UNKNOWN // TOO FEW AXES</small>'}</div>
            </div><div class="dna-compare-reading" aria-label="Your route, friend route and DNA difference">
              <div><span>CONNECTION ROUTE // EACH TO OWN SPECIMEN</span><div class="dna-compare-route-lines"><small>YOU <b>${escapeHtml(connection.code)}</b></small><small>FRIEND <b>${friendConnection?escapeHtml(friendConnection.code):'UNKNOWN // PARTIAL DNA'}</b></small></div></div>
              <div><span>FRACTURE // YOU VS FRIEND</span><b>${reading.fracture?escapeHtml(reading.fracture.label):'NONE DETECTED'}</b><small>${fractureLine}</small></div>
            </div>`;
        }catch(err){
          const missing=err?.status===404;
          const noStore=err?.status===503||err?.status===502||err instanceof TypeError;
          const corrupt=err?.message==='GENOME_RECORD_INVALID';
          compareOutput.innerHTML=`<div class="dna-compare-error">${missing?'SHARE KEY NOT FOUND OR EXPIRED.':noStore?'SHARE STORE OFFLINE — TRY AGAIN LATER.':corrupt?'GENOME DATA UNAVAILABLE // NO VALID AXES.':'GENOME KEY REJECTED // CHECK THE CODE AND TRY AGAIN.'}</div>`;
        }finally{if(runButton){runButton.disabled=false;runButton.textContent=old;}}
      };
      root.querySelector('[data-genome-compare-run]')?.addEventListener('click',runGenomeCompare);
      compareInput?.addEventListener('keydown',event=>{ if(event.key==='Enter') runGenomeCompare(); });

      const shareDialog=root.querySelector('[data-share-dialog]');
      root.querySelector('[data-share-open]')?.addEventListener('click',()=>{
        if(!shareDialog) return;
        if(typeof shareDialog.showModal==='function') shareDialog.showModal();
        else shareDialog.setAttribute('open','');
      });
      root.querySelector('[data-share-close]')?.addEventListener('click',()=>shareDialog?.close?.());
      shareDialog?.addEventListener('click',event=>{
        if(event.target===shareDialog) shareDialog.close?.();
      });

      const profileGrid=root.querySelector('[data-dna-profile-grid]');
      const profileLabel=root.querySelector('[data-dna-profile-label]');
      const profileMeta=root.querySelector('[data-dna-profile-meta]');
      const overlayKey=root.querySelector('[data-dna-overlay-key]');
      root.querySelectorAll('[data-dna-profile-mode]').forEach(btn=>btn.addEventListener('click',()=>{
        const mode=btn.dataset.dnaProfileMode;
        root.querySelectorAll('[data-dna-profile-mode]').forEach(tab=>{
          const active=tab===btn;
          tab.classList.toggle('is-active',active);
          tab.setAttribute('aria-selected',String(active));
        });
        if(profileGrid) profileGrid.innerHTML=renderDnaProfileMode(mode,rows,specimenRows);
        if(profileLabel) profileLabel.textContent=mode==='self' ? 'SELF DNA // 15 AXES' : mode==='specimen' ? 'SPECIMEN DNA // 15 AXES' : 'DNA OVERLAY // 15 AXES';
        if(profileMeta) profileMeta.textContent=mode==='self' ? `SIGNAL ${user.signalStrength}% // COHERENCE ${user.coherence}%` : mode==='specimen' ? `${best.c.title.toUpperCase()} // SPECIMEN PROFILE` : 'POSITIONAL COMPARE // ONE RAIL';
        if(overlayKey) overlayKey.hidden=mode!=='overlay';
      }));
      const shareExplanation=`${explanation.lede} ${friction.lede}`;
      const shareFriction=friction.lede;
      const peakRows=[...rows].sort((a,b)=>Math.abs(b.value-50)-Math.abs(a.value-50) || b.value-a.value).slice(0,5);
      const dnaPeaks=peakRows.map(r=>`${r.label.toUpperCase()} ${Number(r.value).toFixed(1)}`).join(' // ');
      const shareNarrative=buildShareNarrative(user,best.c,best.c.profile,friction);
      shareNarrative.text=`${connection.code} // ${connection.body}`;
      const sharePayload={
        title:best.c.title,
        score:displayScore,
        rows,
        signature,
        signalStrength:user.signalStrength,
        coherence:user.coherence,
        near:nearTitles,
        connectionRoute:connection.route,
        connectionSubtype:connection.subtype,
        subjectPattern:diagnosis.code,
        bio:filmBio.share,
        bioShort:`${best.c.title} carries its strongest pressure through ${joinNatural(filmBio.dominant.slice(0,2).map(x=>x.label.toLowerCase()))}.`,
        explanation:shareExplanation,
        explanationShort:`${explanation.lede}${friction.rows?.length ? ` Deviation: ${friction.rows[0].label.toLowerCase()} runs ${friction.rows[0].film>friction.rows[0].user?'above':'below'} your baseline.` : ''}`,
        friction:shareFriction,
        frictionShort: friction.rows?.length ? friction.rows.slice(0,1).map(r=>`${r.label.toUpperCase()} mismatch // YOU ${round1(r.user).toFixed(1)} ↔ FILM ${round1(r.film).toFixed(1)}.`).join(' ') : shareFriction,
        dnaPeaks,
        peakRows,
        posterProxyUrl:'',posterDirectUrl:''
      };
      const posterPromise=hydratePoster(best.c.title, root.querySelector('.dna-result-poster'));
      const getShareOptions=()=>Object.fromEntries([...root.querySelectorAll('[data-share-option]')].map(input=>[input.dataset.shareOption,input.checked]));
      root.querySelectorAll('[data-share-option]').forEach(input=>input.addEventListener('change',()=>{
        const status=root.querySelector('.dna-share-status');
        if(!status) return;
        const chosen=Object.entries(getShareOptions()).filter(([,on])=>on).map(([key])=>key.toUpperCase());
        status.textContent=chosen.length ? `CARD MODULES // ${chosen.join(' + ')}` : 'MINIMAL CARD // FILM + MATCH SCORE ONLY.';
      }));
      root.querySelectorAll('[data-share-format]').forEach(btn=>btn.addEventListener('click',async()=>{
        const format=btn.dataset.shareFormat;
        const status=root.querySelector('.dna-share-status');
        const oldHtml=btn.innerHTML; btn.disabled=true; btn.textContent='RENDERING…';
        try{
          const options=getShareOptions();
          if(options.poster && !sharePayload.posterProxyUrl && !sharePayload.posterDirectUrl){
            const poster=await posterPromise;
            if(poster){ sharePayload.posterProxyUrl=poster.posterProxyUrl||''; sharePayload.posterDirectUrl=poster.posterDirectUrl||''; }
          }
          const outcome=await exportShareCard(format,sharePayload,options);
          if(status) status.textContent=outcome==='SHARED' ? 'DNA CARD SENT TO SHARE SHEET.' : outcome==='CANCELLED' ? 'SHARE CANCELLED.' : (options.poster && !sharePayload.posterProxyUrl && !sharePayload.posterDirectUrl) ? 'POSTER UNAVAILABLE — CARD EXPORTED WITH LAB FALLBACK.' : 'DNA CARD EXPORTED AS PNG.';
        }catch{ if(status) status.textContent='EXPORT FAILED — TRY AGAIN.'; }
        btn.disabled=false; btn.innerHTML=oldHtml;
      }));
    };

    render();
  }

  async function hydratePoster(title, wrap){
    const svc = window.CINEGENOME_TMDB_SERVICE;
    if (!wrap || !svc?.canQuery?.()) return null;
    try {
      const hit = await svc.searchMovie(title);
      if(!hit?.poster_path) return null;
      const pageUrl = svc.posterUrl(hit.poster_path,'w342');
      const posterDirectUrl = svc.posterUrl(hit.poster_path,'w780');
      const posterProxyUrl = `/api/tmdb-poster?path=${encodeURIComponent(hit.poster_path)}&size=w780`;
      const img=wrap.querySelector('img');
      if(img && pageUrl){ img.src=pageUrl; img.alt=`${title} poster`; img.hidden=false; wrap.classList.add('has-poster'); }
      return {posterProxyUrl,posterDirectUrl,posterPath:hit.poster_path};
    } catch { return null; }
  }

  document.querySelectorAll('[data-dna-test]').forEach(init);
})();

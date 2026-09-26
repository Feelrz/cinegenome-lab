/* Daily Anomaly Hunt. Six cases, three creature draws. Browser-local progress. */
(() => {
  'use strict';
  const testMode = /(?:^|[?&])gacha-test=1(?:&|$)/.test(window.location?.search || '');
  const KEY = testMode ? 'cinegenome_gacha_qa_session_v1' : 'cinegenome_anomaly_daily_v2';
  let progressStorage = localStorage;
  if (testMode) {
    try { progressStorage = sessionStorage; }
    catch { progressStorage = {getItem:()=>null,setItem:()=>{},removeItem:()=>{}}; }
  }
  const LEGACY_KEY = 'cinegenome_anomaly_v1';
  const FILMS = window.CINEGENOME_ENRICHED_TOP500 || [];
  const DEAD = window.CINEGENOME_DEAD_CHANNEL || [];
  const DIMS = window.CINEGENOME_DIMENSIONS || [];
  if (!FILMS.length || !DEAD.length) return;

  // Deep-rotation case bank. Scanner and crossbreed clues are authored from
  // established film premises; Atlas and Mutation protocols are generated from
  // CineGenome DNA axes only. No provisional metadata is used as movie trivia.
  const SCANNER_TRIVIA = [
  [
    "Mind Game",
    "An animated second chance turns a fatal encounter into an absurd escape from something enormous and alive. Which film?"
  ],
  [
    "Eternal Sunshine of the Spotless Mind",
    "A breakup sends two former lovers to have each other removed from memory. Which film?"
  ],
  [
    "Perfect Blue",
    "A former pop idol begins acting while her public persona and an online double erode her sense of self. Which film?"
  ],
  [
    "Mulholland Drive",
    "An amnesiac and an aspiring actress follow a trail of clues through a dreamlike Los Angeles. Which film?"
  ],
  [
    "Stalker",
    "A guide leads two visitors into a forbidden Zone rumored to grant a person’s deepest wish. Which film?"
  ],
  [
    "Oldboy",
    "A man released after fifteen years of unexplained captivity searches for the person behind it. Which film?"
  ],
  [
    "2001: A Space Odyssey",
    "A mysterious monolith reappears as a spacecraft’s artificial intelligence turns against its crew. Which film?"
  ],
  [
    "Chungking Express",
    "Two Hong Kong police officers deal with heartbreak in separate stories joined by a restless city. Which film?"
  ],
  [
    "Cure",
    "A detective investigates murders linked by a strange ritual and a mysterious drifter. Which film?"
  ],
  [
    "Fallen Angels",
    "A hired killer and the woman who manages his jobs inhabit a neon-lit city after dark. Which film?"
  ],
  [
    "Black Swan",
    "A ballerina’s pursuit of a dual role makes perfection and identity collide. Which film?"
  ],
  [
    "The Handmaiden",
    "A pickpocket enters a wealthy household as a maid while competing deceptions unfold. Which film?"
  ],
  [
    "Trainspotting",
    "Young friends in Scotland struggle with addiction and the temptation to leave it behind. Which film?"
  ],
  [
    "The Matrix",
    "A hacker discovers that ordinary reality is an artificial system. Which film?"
  ],
  [
    "The Truman Show",
    "One man gradually discovers that his everyday life has been a television production. Which film?"
  ],
  [
    "Parasite",
    "An underemployed family enters a rich household through a chain of carefully staged jobs. Which film?"
  ],
  [
    "Spirited Away",
    "A girl works in a bathhouse for spirits after her parents undergo a startling transformation. Which film?"
  ],
  [
    "Memento",
    "A man who cannot form new memories relies on photographs and tattoos to pursue revenge. Which film?"
  ],
  [
    "Whiplash",
    "A jazz drummer faces a brutal instructor while chasing musical greatness. Which film?"
  ],
  [
    "The Grand Budapest Hotel",
    "A concierge and his lobby boy are drawn into a fight over an inheritance and a painting. Which film?"
  ],
  [
    "Everything Everywhere All at Once",
    "A laundromat owner confronts alternate lives while her taxes are under audit. Which film?"
  ],
  [
    "Akira",
    "A teenage biker in a future Tokyo develops dangerous psychic powers. Which film?"
  ],
  [
    "Persona",
    "A nurse cares for an actress who has stopped speaking; their identities begin to blur. Which film?"
  ],
  [
    "In the Mood for Love",
    "Two neighbors suspect their spouses of an affair and form a careful bond of their own. Which film?"
  ],
  [
    "Memories of Murder",
    "Detectives confront a string of killings in a rural South Korean province. Which film?"
  ],
  [
    "Arrival",
    "A linguist is recruited to communicate with visitors whose written language changes how time is understood. Which film?"
  ],
  [
    "Alien",
    "A commercial spacecraft answers a distress signal and brings an organism aboard that hunts the crew. Which film?"
  ],
  [
    "Apocalypse Now",
    "An army captain travels upriver during the Vietnam War to find a colonel operating beyond command. Which film?"
  ],
  [
    "Amélie",
    "A shy Parisian waitress secretly intervenes in other people’s lives while avoiding her own chance at intimacy. Which film?"
  ],
  [
    "Back to the Future",
    "A teenager is sent decades into the past in a scientist’s time machine and risks erasing his own future. Which film?"
  ],
  [
    "Before Sunrise",
    "Two strangers meet on a train and spend one night walking and talking through Vienna. Which film?"
  ],
  [
    "Bicycle Thieves",
    "A father and son search postwar Rome for the bicycle whose theft threatens the father’s new job. Which film?"
  ],
  [
    "Casablanca",
    "A nightclub owner in wartime Morocco is forced to choose between an old love and helping her escape. Which film?"
  ],
  [
    "Chinatown",
    "A private investigator following an adultery case uncovers a conspiracy tied to Los Angeles water and power. Which film?"
  ],
  [
    "City of God",
    "Two boys grow along different paths inside a violent Rio de Janeiro neighborhood. Which film?"
  ],
  [
    "Come and See",
    "A teenage boy joins partisans in occupied Belarus and witnesses the destruction of war at close range. Which film?"
  ],
  [
    "Dead Poets Society",
    "A new teacher urges students at a strict boarding school to think independently through poetry. Which film?"
  ],
  [
    "Django Unchained",
    "A freed man joins a bounty hunter and sets out to rescue his wife from a plantation. Which film?"
  ],
  [
    "Do the Right Thing",
    "A brutally hot day on one Brooklyn block builds toward conflict around a neighborhood pizzeria. Which film?"
  ],
  [
    "Fight Club",
    "An insomniac office worker meets a charismatic soap maker and helps create an underground fighting club. Which film?"
  ],
  [
    "GoodFellas",
    "A boy’s fascination with organized crime grows into a life inside a New York mob circle. Which film?"
  ],
  [
    "Grave of the Fireflies",
    "Two siblings struggle to survive in Japan during the final months of World War II. Which film?"
  ],
  [
    "Heat",
    "A meticulous professional thief and an equally driven detective move toward a collision in Los Angeles. Which film?"
  ],
  [
    "Incendies",
    "Twins follow instructions in their mother’s will and uncover the violent history she kept from them. Which film?"
  ],
  [
    "Inception",
    "A specialist who enters dreams is offered a chance to clear his record by planting an idea instead of stealing one. Which film?"
  ],
  [
    "Interstellar",
    "A former pilot leaves a failing Earth through a wormhole in search of a future home for humanity. Which film?"
  ],
  [
    "Kill Bill: Vol. 1",
    "A former assassin wakes from a coma and begins hunting the people who betrayed her. Which film?"
  ],
  [
    "La Haine",
    "Three friends move through the aftermath of a riot in the Paris suburbs as tension with police keeps rising. Which film?"
  ],
  [
    "Little Miss Sunshine",
    "A dysfunctional family crosses the country in a yellow van so a child can enter a beauty pageant. Which film?"
  ],
  [
    "Mad Max: Fury Road",
    "A road warrior and a rebel driver flee a tyrant across the desert with a group of women seeking freedom. Which film?"
  ],
  [
    "Moonlight",
    "A boy’s life is shown across three stages as he navigates identity, masculinity and intimacy in Miami. Which film?"
  ],
  [
    "My Neighbor Totoro",
    "Two sisters move to the countryside and encounter gentle forest spirits near their new home. Which film?"
  ],
  [
    "No Country for Old Men",
    "A hunter finds money after a drug deal goes wrong and is pursued by an implacable killer. Which film?"
  ],
  [
    "Pan's Labyrinth",
    "A girl in postwar Spain enters a dark fairy-tale world while living under a violent military officer. Which film?"
  ],
  [
    "Paris, Texas",
    "A missing man reappears in the desert and slowly tries to reconnect with the family he left behind. Which film?"
  ],
  [
    "Portrait of a Lady on Fire",
    "A painter is hired to secretly make the wedding portrait of a woman who refuses to pose. Which film?"
  ],
  [
    "Prisoners",
    "After two girls disappear, a desperate father takes the investigation into his own hands. Which film?"
  ],
  [
    "Psycho",
    "A secretary on the run stops at an isolated motel managed by a nervous young man and his unseen mother. Which film?"
  ],
  [
    "Pulp Fiction",
    "Hitmen, a boxer, a gangster and his wife collide across interlocking stories in Los Angeles. Which film?"
  ],
  [
    "Rear Window",
    "A photographer confined to his apartment becomes convinced that a neighbor has committed murder. Which film?"
  ],
  [
    "Reservoir Dogs",
    "After a jewelry robbery fails, surviving criminals gather in a warehouse and suspect a police informant among them. Which film?"
  ],
  [
    "RRR",
    "Two revolutionaries become friends before discovering that their missions place them on opposing sides. Which film?"
  ],
  [
    "Schindler's List",
    "A German industrialist gradually uses his factory and influence to protect Jewish workers during the Holocaust. Which film?"
  ],
  [
    "Se7en",
    "Two detectives hunt a serial killer who stages murders around the seven deadly sins. Which film?"
  ],
  [
    "Seven Samurai",
    "A village threatened by bandits hires masterless warriors to organize its defense. Which film?"
  ],
  [
    "Shutter Island",
    "A U.S. marshal investigates a disappearance at an isolated psychiatric hospital and begins doubting the case around him. Which film?"
  ],
  [
    "The Silence of the Lambs",
    "An FBI trainee seeks help from an imprisoned killer while tracking another murderer. Which film?"
  ],
  [
    "Singin' in the Rain",
    "Silent-film performers struggle with the industry’s shift to synchronized sound while a new romance begins. Which film?"
  ],
  [
    "Solaris",
    "A psychologist arrives at a space station where an alien ocean appears to materialize the crew’s memories. Which film?"
  ],
  [
    "Synecdoche, New York",
    "A theater director builds an ever-expanding replica of his life inside a warehouse. Which film?"
  ],
  [
    "The Dark Knight",
    "A masked vigilante faces a criminal who turns Gotham’s institutions and moral rules into experiments. Which film?"
  ],
  [
    "The Godfather",
    "The reluctant son of a crime-family patriarch is drawn deeper into the business after an attempt on his father’s life. Which film?"
  ],
  [
    "The Shining",
    "A writer takes a winter job at an isolated hotel where his family is threatened by the building and his unraveling mind. Which film?"
  ],
  [
    "The Thing",
    "Researchers in Antarctica discover an organism that can imitate any living creature it absorbs. Which film?"
  ],
  [
    "The Prestige",
    "Two rival magicians turn professional competition into an increasingly destructive obsession. Which film?"
  ],
  [
    "The Lord of the Rings: The Fellowship of the Ring",
    "A hobbit leaves home carrying a ring that must be destroyed before its maker can reclaim it. Which film?"
  ],
  [
    "Terminator 2: Judgment Day",
    "A reprogrammed machine is sent back in time to protect a boy from a more advanced assassin. Which film?"
  ],
  [
    "Vertigo",
    "A detective with a fear of heights becomes obsessed with the woman he was hired to follow. Which film?"
  ],
  [
    "WALL·E",
    "A lone waste-collecting robot on an abandoned Earth discovers a new purpose after meeting a visiting probe. Which film?"
  ],
  [
    "Your Name.",
    "Two teenagers mysteriously begin waking up in each other’s bodies and try to understand the connection between them. Which film?"
  ]
]
    .map(([title,clue]) => ({target:FILMS.find(movie=>movie.title===title),clue}))
    .filter(item=>item.target);

  const AXIS_KEYS = DIMS.map(dim=>dim.key).filter(Boolean);
  const ATLAS_PROFILES = [
    {id:'dual-peak',name:'DUAL PEAK',x:[.62,.92],y:[.62,.92]},
    {id:'polar-split',name:'POLAR SPLIT',x:[.62,.92],y:[.08,.38]},
    {id:'inverse-split',name:'INVERSE SPLIT',x:[.08,.38],y:[.62,.92]},
    {id:'ghost-midfield',name:'GHOST MIDFIELD',x:[.34,.66],y:[.34,.66]}
  ];
  const ATLAS_BLUEPRINTS = [];
  for (let i=0;i<AXIS_KEYS.length;i++) for (let j=i+1;j<AXIS_KEYS.length;j++)
    for (const profile of ATLAS_PROFILES)
      ATLAS_BLUEPRINTS.push({xKey:AXIS_KEYS[i],yKey:AXIS_KEYS[j],profile});

  const MUTATION_THRESHOLD_PROFILES = [
    {thresholdId:'hard',highMin:80,lowMax:30},
    {thresholdId:'redline',highMin:86,lowMax:26},
    {thresholdId:'precision',highMin:76,lowMax:22}
  ];
  const MUTATION_PROTOCOLS = [];
  for (const high of AXIS_KEYS) for (const low of AXIS_KEYS) if (high!==low)
    for (const threshold of MUTATION_THRESHOLD_PROFILES)
      MUTATION_PROTOCOLS.push({high,low,...threshold});

  const AXIS_HIGH_FLAVOR = {
    surrealism:'Let reality visibly slip its restraints.',
    loneliness:'Isolate the emotional field until solitude dominates.',
    chaos:'Push disorder into the foreground.',
    romance:'Let attachment become one of the specimen’s dominant forces.',
    nostalgia:'Flood the image with memory and temporal ache.',
    intensity:'Keep emotional or physical pressure near redline.',
    pacing:'Drive the rhythm forward with almost no dead air.',
    visualExtremity:'Make the image impossible to ignore.',
    narrativeComplexity:'Force the structure to demand reconstruction.',
    darkness:'Let the tonal floor drop toward the abyss.',
    humor:'Keep comic energy electrically present.',
    dreamLogic:'Let association outrank ordinary cause and effect.'
  };
  const AXIS_LOW_FLAVOR = {
    surrealism:'Keep the world materially legible.',
    loneliness:'Do not leave the specimen emotionally stranded.',
    chaos:'Suppress disorder and keep the system controlled.',
    romance:'Strip romantic gravity out of the experiment.',
    nostalgia:'Prevent memory from becoming the dominant atmosphere.',
    intensity:'Do not let pressure become the main engine.',
    pacing:'Keep acceleration under strict control.',
    visualExtremity:'Restrain the image before spectacle takes over.',
    narrativeComplexity:'Keep the route through the story unusually clean.',
    darkness:'Do not let the tone sink too far into shadow.',
    humor:'Bleed comic relief almost completely out of the sample.',
    dreamLogic:'Keep causal logic awake and accountable.'
  };

  const CROSSBREED_CAPSULES = [
  [
    "Mind Game",
    "an animated loser gets a second shot at life after an impossible death and bolts toward freedom"
  ],
  [
    "Perfect Blue",
    "a former idol enters acting while an online double and a stalker fracture her sense of identity"
  ],
  [
    "The Truman Show",
    "a man slowly realizes his ordinary life is a television set built around him"
  ],
  [
    "Mulholland Drive",
    "an amnesiac and an aspiring actress chase an identity through dreamlike Los Angeles"
  ],
  [
    "The Grand Budapest Hotel",
    "a concierge and his lobby boy become entangled in an inheritance, a painting and a murder accusation"
  ],
  [
    "Oldboy",
    "a man released after fifteen unexplained years of captivity hunts the architect of his imprisonment"
  ],
  [
    "Chungking Express",
    "heartbroken Hong Kong police officers drift through chance encounters, food stalls and restless nights"
  ],
  [
    "Stalker",
    "a guide leads two men into a forbidden Zone said to contain a room that grants deepest wishes"
  ],
  [
    "Spirited Away",
    "a girl works in a bathhouse for spirits after her parents are transformed"
  ],
  [
    "2001: A Space Odyssey",
    "a monolith shadows human evolution while a spacecraft intelligence turns against its crew"
  ],
  [
    "The Matrix",
    "a hacker learns that the reality around him is a manufactured system"
  ],
  [
    "Fallen Angels",
    "a contract killer and his unseen partner move through neon Hong Kong after dark"
  ],
  [
    "In the Mood for Love",
    "two neighbors suspect their spouses and form an intimate bond they carefully refuse to consummate"
  ],
  [
    "The Handmaiden",
    "a pickpocket enters a wealthy household as a maid inside a layered con"
  ],
  [
    "Parasite",
    "an underemployed family gradually infiltrates the household of a wealthy family"
  ],
  [
    "Black Swan",
    "a ballerina pursuing perfection starts losing the boundary between role, rival and self"
  ],
  [
    "Whiplash",
    "a jazz drummer is pushed toward obsession by a brutal teacher"
  ],
  [
    "Eternal Sunshine of the Spotless Mind",
    "former lovers attempt to erase one another from memory after a breakup"
  ],
  [
    "Memento",
    "a man unable to form new memories uses photographs, notes and tattoos to pursue revenge"
  ],
  [
    "Trainspotting",
    "young friends in Scotland swing between addiction, friendship and the urge to escape"
  ],
  [
    "Little Miss Sunshine",
    "a dysfunctional family crosses the country in a broken-down van for a child’s pageant"
  ],
  [
    "Cure",
    "a detective traces a series of ritual-like murders back toward a strangely empty drifter"
  ],
  [
    "Memories of Murder",
    "detectives struggle through a rural serial-murder investigation with little reliable evidence"
  ],
  [
    "Arrival",
    "a linguist tries to communicate with visitors whose language alters how time is perceived"
  ],
  [
    "Alien",
    "a spacecraft crew brings aboard an organism that grows into a nearly unstoppable predator"
  ],
  [
    "Inception",
    "a dream infiltrator is hired to plant an idea inside another person’s mind"
  ],
  [
    "Interstellar",
    "a former pilot crosses a wormhole searching for a future home as Earth fails behind him"
  ],
  [
    "Mad Max: Fury Road",
    "fugitives tear across a desert pursued by a tyrant and his war machines"
  ],
  [
    "Pan's Labyrinth",
    "a girl under fascist rule follows a dangerous fairy-tale quest through an ancient labyrinth"
  ],
  [
    "The Shining",
    "a family is isolated in a winter hotel as the father and the building become increasingly dangerous"
  ],
  [
    "The Thing",
    "an Antarctic research team faces an organism capable of perfectly imitating its victims"
  ],
  [
    "Pulp Fiction",
    "criminals, a boxer and a gangster’s wife collide across interlocking Los Angeles stories"
  ],
  [
    "Fight Club",
    "an insomniac and a charismatic stranger turn underground fighting into something much larger"
  ],
  [
    "The Godfather",
    "a reluctant son is pulled into the violent business of his powerful crime family"
  ],
  [
    "The Dark Knight",
    "a masked vigilante faces a criminal who treats a city’s morality as an experiment"
  ],
  [
    "Portrait of a Lady on Fire",
    "a painter secretly studies the woman whose wedding portrait she has been hired to make"
  ],
  [
    "Your Name.",
    "two teenagers begin waking in each other’s bodies and discover their connection reaches across more than distance"
  ],
  [
    "WALL·E",
    "a solitary waste robot on an abandoned Earth follows a sleek visitor into space"
  ],
  [
    "No Country for Old Men",
    "a man takes money from a failed drug deal and is pursued by an implacable killer"
  ],
  [
    "Se7en",
    "two detectives follow murders arranged around the seven deadly sins"
  ]
]
    .map(([title,capsule]) => ({movie:FILMS.find(item=>item.title===title),capsule}))
    .filter(item=>item.movie);
  const CROSSBREED_PROTOCOLS = [];
  for (let i=0;i<CROSSBREED_CAPSULES.length;i++) for (let j=i+1;j<CROSSBREED_CAPSULES.length;j++)
    CROSSBREED_PROTOCOLS.push({left:CROSSBREED_CAPSULES[i],right:CROSSBREED_CAPSULES[j]});
  const CROSSBREED_BALANCE = [
    {id:'balanced',min:40,max:60,label:'BALANCED WINDOW'},
    {id:'tight',min:45,max:55,label:'TIGHT EQUILIBRIUM'}
  ];

  const CASE_BANK_COUNTS = {
    scanner:SCANNER_TRIVIA.length,
    atlas:ATLAS_BLUEPRINTS.length,
    mutation:MUTATION_PROTOCOLS.length,
    crossbreed:CROSSBREED_PROTOCOLS.length
  };
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  })[c]);
  const label = key => DIMS.find(dim => dim.key === key)?.label?.toUpperCase() || String(key).toUpperCase();
  const hash = value => {
    let h = 2166136261;
    for (const char of String(value)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const assetRoot = new URL('../assets/creatures/', document.currentScript?.src || location.href).href;
  const CREATURES = [
    {id:'pierlurk',name:'PIERLURK',rarity:'C',source:'JAWS',kind:'COASTAL SHARK',description:'A subsurface anomaly that waits beneath the quiet pier.'},
    {id:'ambergraze',name:'AMBERGRAZE',rarity:'B',source:'JURASSIC PARK',kind:'RESIN GRAZER',description:'Ancient life gathers in the reclaimed greenhouse.'},
    {id:'viridra',name:'VIRIDRA',rarity:'A',source:'THE MATRIX',kind:'GLITCH PREDATOR',description:'Its reflection moves before the body does.'},
    {id:'cirrivel',name:'CIRRIVEL',rarity:'S',source:'ARRIVAL',kind:'CIRCULAR MOTH',description:'A fogbound creature with memories written in rings.'},
    {id:'foldhart',name:'FOLDHART',rarity:'SR',source:'INCEPTION',kind:'DREAM BEAST',description:'The city bends around its antlers.'},
    {id:'parallux',name:'PARALLUX',rarity:'S',source:'EVERYTHING EVERYWHERE ALL AT ONCE',kind:'PARALLEL-TAIL CREATURE',description:'Each of its three tails remembers a different life.'},
    {id:'glassheron',name:'GLASSHERON',rarity:'A',source:'BLADE RUNNER 2049',kind:'GLASS-FEATHERED HERON',description:'Its reflection remembers a sky it has never seen.'},
    {id:'briarboar',name:'BRIARBOAR',rarity:'B',source:"PAN’S LABYRINTH",kind:'ROOTBOUND BOAR',description:'A lantern burns between its thorns, even where no path remains.'},
    {id:'dustbrake',name:'DUSTBRAKE',rarity:'B',source:'MAD MAX: FURY ROAD',kind:'TREAD-SHELL BEETLE',description:'Its armored tracks survive storms that erase every road.'},
    {id:'skyshell',name:'SKYSHELL',rarity:'C',source:'THE TRUMAN SHOW',kind:'SKY-SHELL SNAIL',description:'Clouds drift across its living shell even when the sky beyond the wall stands still.'},
    {id:'carpetmink',name:'CARPETMINK',rarity:'C',source:'THE SHINING',kind:'CORRIDOR MINK',description:'Its patterned coat shifts whenever the corridor behind it changes direction.'}
  ];
  const ODDS = [{rarity:'C',weight:60},{rarity:'B',weight:30},{rarity:'A',weight:8},{rarity:'S',weight:1.8},{rarity:'SR',weight:0.2}];
  const RARITY_ORDER = ['SR','S','A','B','C'];
  const cardById = id => CREATURES.find(c => c.id === id);
  const randomPercent = () => {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      globalThis.crypto.getRandomValues(value);
      return value[0] / 4294967296 * 100;
    }
    return Math.random() * 100;
  };
  function rollCard() {
    let value = randomPercent();
    for (const tier of ODDS) {
      value -= tier.weight;
      if (value < 0) {
        const members=CREATURES.filter(card=>card.rarity===tier.rarity);
        // Reuse the same roll within each rarity band: adding species never changes tier odds.
        const withinTier=Math.min(members.length-1,Math.floor((1+value/tier.weight)*members.length));
        return members[Math.max(0,withinTier)];
      }
    }
    return CREATURES[CREATURES.length-1];
  }
  const dialog = document.getElementById('anomalyDialog');
  const body = document.getElementById('anomalyCaseContent');
  const SOUND_KEY = 'cinegenome_creature_sound_v1';
  let soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch {}
  let audioContext = null;
  let date = today(), cases = [];
  let selected = null;
  let state = { date, solved: {}, traces: {}, collection: [], pulls: [], migrated: false, rewardVersion: 4 };
  let revealing = false;
  let activeReveal = null;
  let toastTimer = null;

  function soundContext() {
    if (!soundOn) return null;
    try {
      if (!audioContext) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return null;
        audioContext = new Audio();
      }
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      return audioContext;
    } catch { return null; }
  }
  function tone(frequency, duration, type='sine', volume=.05, delay=0) {
    const context = soundContext();
    if (!context) return;
    try {
      const start = context.currentTime + delay, oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start); oscillator.stop(start + duration + .025);
    } catch {}
  }
  function revealSound(rarity) {
    const notes = rarity === 'SR' ? [392,494,587,784,988,1175,1568] :
      rarity === 'S' ? [392,523,659,988] : rarity === 'A' ? [330,440,659] :
      rarity === 'B' ? [294,392,523] : [262,330];
    notes.forEach((note,index) => tone(note,rarity === 'SR' ? .8 : .34,
      rarity === 'SR' ? 'sine' : 'triangle',rarity === 'SR' ? .055 : .042,index * (rarity === 'SR' ? .115 : .095)));
    if (rarity === 'SR') {
      tone(98,1.35,'sawtooth',.035);
      tone(1568,1.4,'sine',.035,.78);
    }
  }

  function buildCases(day) {
    const parts=String(day).split('-').map(Number);
    const dayIndex=Math.floor(Date.UTC(parts[0]||1970,(parts[1]||1)-1,parts[2]||1)/86400000);
    const seededShuffle=(items,seedValue)=>{
      let seed=seedValue>>>0;
      const next=()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed; };
      for(let i=items.length-1;i>0;i--){const j=next()%(i+1);[items[i],items[j]]=[items[j],items[i]];}
      return items;
    };
    // Category decks walk through an entire pool before reshuffling. This keeps
    // the daily file deterministic while preventing short-cycle repetition.
    const deckPick=(items,count,salt)=>{
      if(!items.length) return [];
      const cycleDays=Math.max(1,Math.floor(items.length/count));
      const cycle=Math.floor(dayIndex/cycleDays);
      const offset=(dayIndex%cycleDays)*count;
      // Build the same boundary-safe order for every date inside a cycle.
      // The rotation is inherited from earlier cycles, so fixing a boundary
      // can never create a repeat on the following day.
      let previousOrder=null,order=null;
      for(let c=0;c<=cycle;c++){
        order=seededShuffle(items.slice(),hash(`${salt}:${c}`));
        if(previousOrder && order.length>count){
          const previous=previousOrder.slice(-count);
          let guard=0;
          while(order.slice(0,count).some(item=>previous.includes(item)) && guard++<order.length)
            order.push(order.shift());
        }
        previousOrder=order;
      }
      return Array.from({length:count},(_,index)=>order[(offset+index)%order.length]);
    };
    const quantile=(values,p)=>{
      const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);
      if(!sorted.length) return 50;
      const pos=(sorted.length-1)*Math.max(0,Math.min(1,p));
      const lo=Math.floor(pos),hi=Math.ceil(pos),mix=pos-lo;
      return sorted[lo]+(sorted[hi]-sorted[lo])*mix;
    };
    const axisValues=key=>FILMS.map(movie=>Number(movie?.dna?.[key])).filter(Number.isFinite);
    const resolveAtlas=(blueprint,slot)=>{
      const {xKey,yKey,profile}=blueprint;
      const xv=axisValues(xKey),yv=axisValues(yKey);
      let widen=0,axis=null;
      while(widen<=.24){
        const xLo=Math.max(0,profile.x[0]-widen),xHi=Math.min(1,profile.x[1]+widen);
        const yLo=Math.max(0,profile.y[0]-widen),yHi=Math.min(1,profile.y[1]+widen);
        const xMin=Math.max(0,Math.round(quantile(xv,xLo))),xMax=Math.min(100,Math.round(quantile(xv,xHi)));
        const yMin=Math.max(0,Math.round(quantile(yv,yLo))),yMax=Math.min(100,Math.round(quantile(yv,yHi)));
        const available=FILMS.filter(movie=>Number(movie?.dna?.[xKey])>=xMin&&Number(movie?.dna?.[xKey])<=xMax&&Number(movie?.dna?.[yKey])>=yMin&&Number(movie?.dna?.[yKey])<=yMax).length;
        axis={xKey,yKey,xMin,xMax,yMin,yMax,profileId:profile.id,profileName:profile.name,available};
        if(available>=18) break;
        widen+=.06;
      }
      return axis;
    };

    const scanners=deckPick(SCANNER_TRIVIA,2,'scanner');
    const atlasBlueprints=deckPick(ATLAS_BLUEPRINTS,2,'atlas');
    const coordinates=atlasBlueprints.map(resolveAtlas);
    const mutation=deckPick(MUTATION_PROTOCOLS,1,'mutation')[0];
    const crossbreed=deckPick(CROSSBREED_PROTOCOLS,1,'crossbreed')[0];
    const balance=CROSSBREED_BALANCE[hash(`${day}:balance`)%CROSSBREED_BALANCE.length];
    const atlasNames=['GHOST COORDINATE','BROKEN CONSTELLATION','POLAR TRACE','STATIC ORBIT','NULL SECTOR','ECHO VECTOR'];
    const scannerNames=['IDENTITY LEAK','SPLIT SIGNAL','FALSE MEMORY','NAMELESS FRAME','GHOST CREDIT','ARCHIVE BREACH'];
    const mutationNames=['ILLEGAL VECTOR','GENOME OVERRIDE','REDLINE EDIT','TRAIT SUPPRESSION','FORBIDDEN CUT'];
    const crossbreedNames=['TWIN REACTOR','PARENT COLLISION','DUAL SPECIMEN','SPLICE EVENT','GENETIC DOUBLE'];
    const nameFor=(names,salt,index=0)=>names[hash(`${day}:${salt}:${index}`)%names.length];
    const atlas=(id,axis,index)=>({id,kind:'atlas',name:nameFor(atlasNames,'atlas-name',index),...axis,
      hint:`${axis.profileName} protocol. Plot X = ${label(axis.xKey)} between ${axis.xMin} and ${axis.xMax}; Y = ${label(axis.yKey)} between ${axis.yMin} and ${axis.yMax}. Inspect any specimen inside both bands. ${axis.available} viable nodes detected in the current archive.`});
    const mutationHint=`Push ${label(mutation.high)} to ${mutation.highMin}+ and suppress ${label(mutation.low)} to ${mutation.lowMax} or lower. ${AXIS_HIGH_FLAVOR[mutation.high]||''} ${AXIS_LOW_FLAVOR[mutation.low]||''}`;
    const crossbreedHint=`PARENT A // ${crossbreed.left.capsule}. PARENT B // ${crossbreed.right.capsule}. Identify both specimens, initiate a crossbreed, and hold the blend inside the ${balance.min}–${balance.max}% ${balance.label.toLowerCase()}.`;
    return [
      {id:'S1',kind:'scan',name:nameFor(scannerNames,'scan-name',0),...scanners[0],hint:scanners[0].clue},
      {id:'S2',kind:'scan',name:nameFor(scannerNames,'scan-name',1),...scanners[1],hint:scanners[1].clue},
      atlas('A1',coordinates[0],0),
      atlas('A2',coordinates[1],1),
      {id:'M1',kind:'mutation',name:nameFor(mutationNames,'mutation-name'),...mutation,hint:mutationHint},
      {id:'X1',kind:'crossbreed',name:nameFor(crossbreedNames,'cross-name'),parents:[crossbreed.left.movie,crossbreed.right.movie],
        ratioMin:balance.min,ratioMax:balance.max,balanceId:balance.id,hint:crossbreedHint}
    ];
  }

  function loadState(day) {
    let saved = {};
    try { saved = JSON.parse(progressStorage.getItem(KEY) || '{}') || {}; } catch {}
    const collection = Array.isArray(saved.collection) ? saved.collection.filter(x => x && typeof x.id === 'string') : [];
    let pulls = Array.isArray(saved.pulls) ? saved.pulls.filter(x =>
      x && typeof x.id === 'string' && typeof x.date === 'string' &&
      (!x.cardId || cardById(x.cardId))) : [];
    const result = {
      date:day,
      solved:saved.date === day && saved.solved && typeof saved.solved === 'object' ? saved.solved : {},
      traces:saved.date === day && saved.traces && typeof saved.traces === 'object' ? saved.traces : {},
      collection, pulls, migrated:saved.migrated === true, rewardVersion:4
    };
    // Preserve older case stamps and convert already solved v49.2 cases
    // into unclaimed draw tickets once. A repeat load cannot mint extras.
    if (!result.migrated) {
      try { if (!testMode) {
        const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
        if (old.stage === 3 && typeof old.caseId === 'string' && !collection.some(x => x.id === 'LEGACY:' + old.caseId)) {
          collection.push({id:'LEGACY:' + old.caseId, date:old.caseId.replace('CG-A/',''), kind:'legacy',
            name:'WEEKLY TRANSMISSION', subject:'ORIGINAL ANOMALY HUNT'});
        }
      } } catch {}
      result.migrated = true;
    }
    const caseIds = new Set(['S1','S2','A1','A2','M1','X1']);
    // Previous releases awarded one pack per case and a bonus. Keep cards
    // already obtained; convert unopened packs to the new two-cases-per-pack
    // rule, including packs earned on earlier dates.
    const earnedByDay = new Map();
    for (const pull of pulls) {
      if (!caseIds.has(pull.caseId)) continue;
      if (!earnedByDay.has(pull.date)) earnedByDay.set(pull.date,new Set());
      earnedByDay.get(pull.date).add(pull.caseId);
    }
    if (saved.date === day) {
      if (!earnedByDay.has(day)) earnedByDay.set(day,new Set());
      for (const id of caseIds) if (result.solved[id]) earnedByDay.get(day).add(id);
    }
    if (saved.rewardVersion !== 4) pulls = pulls.filter(p => !!p.cardId);
    for (const [earnedDate, completed] of earnedByDay) {
      const eligible = Math.floor(completed.size / 2);
      const existing = pulls.filter(p => p.date === earnedDate).length;
      for (let i = existing + 1; i <= eligible; i++)
        pulls.push({id:earnedDate + ':PAIR:' + i,date:earnedDate,caseId:'PAIR:'+i,cardId:null});
    }
    result.pulls = pulls;
    return result;
  }

  function save() {
    try { progressStorage.setItem(KEY, JSON.stringify(state)); }
    catch { announce('Storage unavailable // cards may not survive a reload'); }
  }
  function resetIfNewDay() {
    const key = today();
    if (key === date) return;
    date = key; cases = buildCases(date); state = loadState(date); selected = null;
    save(); render();
  }
  cases = buildCases(date);
  state = loadState(date);
  save();

  const caseCount = () => cases.filter(item => state.solved[item.id]).length;
  const pending = () => state.pulls.filter(p => !p.cardId);
  const owned = () => state.pulls.filter(p => !!p.cardId && cardById(p.cardId));
  const typeName = kind => ({scan:'SCANNER',atlas:'ATLAS',mutation:'MUTATION',crossbreed:'CROSSBREED'})[kind] || 'CASE';
  const TRACE_INTEGRITY = [100,85,65,40];
  const traceLevel = item => Math.max(0,Math.min(3,Number(state.traces?.[item?.id])||0));
  const caseIntegrity = item => TRACE_INTEGRITY[traceLevel(item)] || 40;
  const decade = year => Number.isFinite(Number(year)) ? `${Math.floor(Number(year)/10)*10}s` : 'UNKNOWN ERA';
  const maskTitle = title => String(title||'').split(/\s+/).map(word=>{
    if(!word) return word;
    if(/^[^A-Za-z0-9]+$/.test(word)) return word;
    const chars=[...word];
    return chars.map((char,index)=>index===0 || /[^A-Za-z0-9]/.test(char) ? char : '•').join('');
  }).join(' ');
  const atlasCandidates = item => FILMS.filter(movie=>Number(movie?.dna?.[item.xKey])>=item.xMin && Number(movie?.dna?.[item.xKey])<=item.xMax && Number(movie?.dna?.[item.yKey])>=item.yMin && Number(movie?.dna?.[item.yKey])<=item.yMax);
  function traceCards(item){
    if(!item) return [];
    if(item.kind==='scan'){
      const target=item.target||{};
      return [
        {code:'TRACE 01 // LOCATE',title:'SPECIMEN SCANNER',body:'Open the Scanner and use the specimen search field. This case resolves when the correct film dossier is scanned.',route:'SEARCH SPECIMEN'},
        {code:'TRACE 02 // NARROW',title:`ARCHIVE BAND // ${decade(target.year)}`,body:`The specimen was released in the ${decade(target.year)}. Its title signature begins ${String(target.title||'?').trim().charAt(0).toUpperCase() || '?'}.`,route:'SEARCH SPECIMEN'},
        {code:'TRACE 03 // DECODE',title:'PARTIAL TITLE SIGNATURE',body:`${maskTitle(target.title)} // ${target.year || 'YEAR UNKNOWN'}. Search this signature in Scanner and confirm the matching dossier.`,route:'SEARCH SPECIMEN'}
      ];
    }
    if(item.kind==='atlas'){
      const candidates=atlasCandidates(item);
      const shortlist=candidates.slice().sort((a,b)=>hash(`${date}:${item.id}:${a.title}`)-hash(`${date}:${item.id}:${b.title}`)).slice(0,3).map(x=>x.title);
      return [
        {code:'TRACE 01 // LOCATE',title:'GENOME ATLAS',body:'Use the X/Y coordinate map. The answer is any specimen that lands inside both requested numeric bands.',route:'X/Y COORDINATE MAP'},
        {code:'TRACE 02 // NARROW',title:`SET X ${label(item.xKey)} // Y ${label(item.yKey)}`,body:`Configure X = ${label(item.xKey)} and Y = ${label(item.yKey)}. Then inspect nodes where X is ${item.xMin}–${item.xMax} and Y is ${item.yMin}–${item.yMax}.`,route:'AXIS SELECTORS'},
        {code:'TRACE 03 // DECODE',title:'VIABLE SPECIMENS DETECTED',body:shortlist.length ? `Try tracing one of these signals on the map: ${shortlist.join(' // ')}.` : 'No shortlist could be decoded. Use the exact coordinate window shown above.',route:'MAP NODES'}
      ];
    }
    if(item.kind==='mutation'){
      return [
        {code:'TRACE 01 // LOCATE',title:'MUTATION CHAMBER',body:'Use TRAIT OVERRIDES. This case is solved by the live DNA vector, not by choosing one specific movie.',route:'TRAIT OVERRIDES'},
        {code:'TRACE 02 // NARROW',title:`RAISE ${label(item.high)} // LOWER ${label(item.low)}`,body:`Only two traits matter for the lock: ${label(item.high)} must reach ${item.highMin}+ while ${label(item.low)} must fall to ${item.lowMax} or below.`,route:'TARGET SLIDERS'},
        {code:'TRACE 03 // DECODE',title:'VECTOR RECIPE',body:`Load any seed. Set ${label(item.high)} to at least ${item.highMin}, set ${label(item.low)} to ${item.lowMax} or lower, then move either target slider once to transmit the vector.`,route:'LIVE VECTOR'}
      ];
    }
    const parents=item.parents||[];
    return [
      {code:'TRACE 01 // LOCATE',title:'CROSSBREED REACTOR',body:'Identify both parent films from the case capsules, load them into Parent A and Parent B, then use GENETIC DOMINANCE.',route:'PARENT A + PARENT B'},
      {code:'TRACE 02 // NARROW',title:`BLEND WINDOW // ${item.ratioMin}–${item.ratioMax}%`,body:`The parent order does not matter. Keep the blend inside ${item.ratioMin}–${item.ratioMax}% and focus on the two film premises embedded in the case text.`,route:'GENETIC DOMINANCE'},
      {code:'TRACE 03 // DECODE',title:'PARENT SIGNALS UNMASKED',body:`PARENT A // ${parents[0]?.title || 'UNKNOWN'} · PARENT B // ${parents[1]?.title || 'UNKNOWN'}. Load both and hold the blend inside the required window.`,route:'REACTOR INPUTS'}
    ];
  }
  function revealTrace(item){
    if(!item || state.solved[item.id]) return;
    const current=traceLevel(item);
    if(current>=3) return;
    state.traces = state.traces || {};
    state.traces[item.id]=current+1;
    save();render();
    announce(`TRACE ${String(current+1).padStart(2,'0')} UNSEALED // CASE INTEGRITY ${caseIntegrity(item)}%`);
  }
  function guideTargets(item){
    const mobile=!!document.getElementById('mBottomNav');
    const kind=item?.kind;
    if(!kind) return {module:null,targets:[]};
    if(mobile){
      if(kind==='scan') return {module:'#mTabScanner',targets:['#mScannerSearch']};
      if(kind==='atlas') return {module:'#mBottomNav [data-target="atlas"]',targets:['#mAtlasX','#mAtlasY','#mAtlasSvg']};
      if(kind==='mutation') return {module:'#mBottomNav [data-target="mutation"]',targets:[`#mMutationControls [data-dim="${item.high}"]`,`#mMutationControls [data-dim="${item.low}"]`]};
      return {module:'#mBottomNav [data-target="crossbreed"]',targets:['#mParentA','#mParentB','#mBlend']};
    }
    if(kind==='scan') return {module:'#moduleNav [data-view="scanner"]',targets:['#scannerSearch']};
    if(kind==='atlas') return {module:'#moduleNav [data-view="atlas"]',targets:['#axisX','#axisY','#atlasSvg']};
    if(kind==='mutation') return {module:'#moduleNav [data-view="mutation"]',targets:[`#mutationControls [data-dim="${item.high}"]`,`#mutationControls [data-dim="${item.low}"]`]};
    return {module:'#moduleNav [data-view="crossbreed"]',targets:['#parentASearch','#parentBSearch','#blendSlider']};
  }
  function takeMeThere(item){
    if(!item) return;
    const guide=guideTargets(item);
    if(dialog?.open) dialog.close();
    setTimeout(()=>{
      document.querySelector(guide.module)?.click();
      setTimeout(()=>{
        if(item.kind==='atlas' && traceLevel(item)>=2){
          const mobile=!!document.getElementById('mBottomNav');
          const x=document.querySelector(mobile?'#mAtlasX':'#axisX');
          const y=document.querySelector(mobile?'#mAtlasY':'#axisY');
          if(x && y){ x.value=item.xKey; y.value=item.yKey; x.dispatchEvent(new Event('change',{bubbles:true})); y.dispatchEvent(new Event('change',{bubbles:true})); }
        }
        const nodes=guide.targets.map(sel=>document.querySelector(sel)).filter(Boolean);
        nodes.forEach(node=>{
          const shell=node.closest?.('.field,.m-field,.mutation-row,.m-card,.atlas-wrap') || node;
          shell.classList.add('case-guidance-pulse');
          setTimeout(()=>shell.classList.remove('case-guidance-pulse'),3200);
        });
        const focus=nodes.find(node=>/^(INPUT|SELECT|BUTTON)$/.test(node.tagName));
        focus?.focus?.({preventScroll:true});
        (focus || nodes[0])?.scrollIntoView?.({behavior:'smooth',block:'center'});
      },80);
    },30);
  }

  function announce(message) {
    const toast = document.getElementById('anomalyToast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3800);
  }

  function collect(item) {
    resetIfNewDay();
    if (state.solved[item.id]) return false;
    state.solved[item.id] = true;
    const count = caseCount();
    if (count % 2 === 0) {
      const id = date + ':PAIR:' + count / 2;
      if (!state.pulls.some(p => p.id === id))
        state.pulls.push({id,date,caseId:'PAIR:' + count / 2,cardId:null});
    }
    selected = item.id;
    save(); render();
    announce(count % 2 === 0 ? 'CASE PAIR SEALED // CREATURE DRAW READY' : item.name + ' // ONE MORE CASE TO EARN A DRAW');
    if (dialog && !dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
    return true;
  }

  function cardMarkup(card, pull, duplicate, preview) {
    const obtained = obtainedAt(pull);
    return `<article class="creature-card rarity-${card.rarity.toLowerCase()}" aria-label="${esc(card.name)} rarity ${card.rarity}">
      <div class="creature-card-top"><span>CG / CREATURE FILE</span><b>${card.rarity}</b></div>
      <div class="creature-art"><img src="${assetRoot + card.id}.webp" alt="${esc(card.kind)} inspired by ${esc(card.source)}" loading="${preview?'eager':'lazy'}"></div>
      <div class="creature-card-info"><small>${esc(card.kind)} // ${esc(card.source)}</small>
        <strong>${esc(card.name)}</strong><p>${esc(card.description)}</p>
        <span>#${CREATURES.indexOf(card)+1} / ${CREATURES.length} &nbsp;·&nbsp; CREATURE OBTAINED // ${esc(obtained)}${duplicate?' &nbsp;·&nbsp; DUPLICATE':''}</span>
      </div>
    </article>`;
  }
  function obtainedAt(pull) {
    if (!pull.claimedAt) return pull.date;
    const acquired = new Date(pull.claimedAt);
    return Number.isNaN(acquired.getTime()) ? pull.date :
      acquired.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  function render() {
    const count = caseCount(), tickets = pending(), cards = owned();
    document.querySelectorAll('[data-anomaly-progress]').forEach(node => { node.textContent = count + '/6' + (tickets.length ? ' · ' + tickets.length + ' DRAW' : ''); });
    document.querySelectorAll('[data-anomaly-portal]').forEach(node => {
      node.classList.toggle('is-active', count > 0 || tickets.length > 0);
      node.classList.toggle('is-complete', count === 6);
    });
    if (!body) return;
    if (!selected) selected = tickets.length ? tickets[0].id : (cases.find(item => !state.solved[item.id])?.id || 'COLLECTION');
    const current = cases.find(item => item.id === selected);
    const activePull = state.pulls.find(p => p.id === selected);
    const activeCard = activePull?.cardId && cardById(activePull.cardId);
    const activeDuplicate = activeCard && state.pulls.some(p => p !== activePull && p.cardId === activeCard.id &&
      state.pulls.indexOf(p) < state.pulls.indexOf(activePull));
    const counts = Object.fromEntries(CREATURES.map(c => [c.id,cards.filter(p=>p.cardId===c.id).length]));
    body.innerHTML = `
      <div class="anomaly-kicker">DAILY FILE // ${date} // RESETS AT LOCAL MIDNIGHT</div>
      <h2 id="anomalyHeading">ANOMALY HUNT <span>${count}/6</span></h2>
      ${testMode ? `<section class="creature-test-panel" aria-label="Gacha test controls">
        <strong>TEST MODE // NO REAL REWARDS</strong>
        <p>Preview the exact pack animation and sounds. Pick a rarity to force its reveal, or choose RANDOM for a normal roll. Test cards stay in this tab only and never enter your real collection.</p>
        <div class="creature-test-buttons">
          ${['RANDOM','C','B','A','S','SR'].map(tier => `<button type="button" data-anomaly-test="${tier}">${tier === 'RANDOM'?'RANDOM DRAW':'TEST '+tier}</button>`).join('')}
        </div>
        <button type="button" class="creature-test-reset" data-anomaly-test-reset>RESET TEST CARDS</button>
        <a href="${esc(window.location?.pathname || '/')}">EXIT TEST MODE ↗</a>
      </section>` : ''}
      <p class="anomaly-intro">Every two solved cases earn one creature draw. Finish all six for three draws today. Stuck? Open a case and REQUEST TRACE — assistance points you to the right module without reducing rewards.</p>
      <div class="anomaly-case-grid">
        ${cases.map((item,index) => `<button type="button" class="anomaly-case ${state.solved[item.id]?'is-solved':''} ${selected===item.id?'is-selected':''}"
          data-anomaly-case="${item.id}" aria-pressed="${selected===item.id}">
          <small>CASE 0${index+1} / ${typeName(item.kind)}</small><strong>${esc(item.name)}</strong>
          <span>${state.solved[item.id]?`◆ CASE SOLVED · ${caseIntegrity(item)}%`:(traceLevel(item)?`◇ TRACE ${traceLevel(item)}/3 · ${caseIntegrity(item)}%`:'◇ UNSOLVED')}</span>
        </button>`).join('')}
      </div>
      <section class="creature-draw" aria-live="polite">
        <div class="creature-draw-heading"><span class="anomaly-step-number">CREATURE DRAW // ${tickets.length} READY</span>
          <button type="button" class="creature-sound-toggle" data-anomaly-sound aria-pressed="${soundOn}">SOUND ${soundOn?'ON':'OFF'} ${soundOn?'◖))':'○'}</button></div>
        ${activeCard ? `<h3>CREATURE OBTAINED // ${esc(obtainedAt(activePull))}</h3>
          ${cardMarkup(activeCard,activePull,activeDuplicate,true)}
          <p>${activeDuplicate?'Duplicate pull. Your copy count has increased.':'New species recorded in your collection.'}</p>`
        : current ? `<div class="anomaly-step ${state.solved[current.id]?'is-found':''}"><strong>${esc(current.name)}</strong><p>${esc(current.hint)}</p>
          <div class="anomaly-case-assist">
            <div class="anomaly-integrity"><span>CASE INTEGRITY</span><b>${caseIntegrity(current)}%</b><i style="--integrity:${caseIntegrity(current)}%"><em></em></i><small>TRACE assistance never reduces creature rewards.</small></div>
            ${traceCards(current).slice(0,traceLevel(current)).map((trace,index)=>`<article class="anomaly-trace"><small>${esc(trace.code)}</small><strong>${esc(trace.title)}</strong><p>${esc(trace.body)}</p>${index===0||index===traceLevel(current)-1?`<button type="button" data-anomaly-route="${current.id}">TAKE ME THERE ↗ <span>${esc(trace.route)}</span></button>`:''}</article>`).join('')}
            ${!state.solved[current.id] && traceLevel(current)<3 ? `<button type="button" class="anomaly-trace-request" data-anomaly-trace="${current.id}">${traceLevel(current)===0?'REQUEST TRACE // LOCATE':traceLevel(current)===1?'REQUEST TRACE 02 // NARROW':'REQUEST TRACE 03 // DECODE'} ↗</button>` : ''}
            ${!state.solved[current.id] && traceLevel(current)>=3 ? '<small class="anomaly-trace-max">MAX TRACE REACHED // REWARD REMAINS UNCHANGED</small>' : ''}
          </div>
          ${state.solved[current.id]?`<p>Case solved // integrity ${caseIntegrity(current)}%. Every two completed cases unlock one creature draw.</p>`:''}</div>` : ''}
        ${tickets.length ? `<div class="creature-pack"><div class="creature-pack-face"><small>CINEGENOME / SEALED SPECIMEN</small><b>?</b><span>CREATURE // C TO SR</span></div>
          <button type="button" class="anomaly-export" data-anomaly-draw="${esc(tickets[0].id)}">OPEN CREATURE PACK · ${tickets.length} READY ↗</button></div>`
        : '<p class="anomaly-note">No unopened packs. Solve another case or return tomorrow.</p>'}
        <details class="creature-odds"><summary>DRAW ODDS & RULES</summary>
          <p>Each draw: C 60% · B 30% · A 8% · S 1.8% · SR 0.2%. Every draw is independent for this browser, so different players may get different cards. Duplicates can appear; there is no paid draw.</p>
        </details>
      </section>
      <section class="anomaly-collection">
        <h3>CREATURE COLLECTION // ${Object.values(counts).filter(Boolean).length}/${CREATURES.length} SPECIES</h3>
        <p>${cards.length} cards · ${tickets.length} unopened packs · saved in this browser.</p>
        <div class="creature-gallery">${CREATURES.slice().sort((a,b)=>RARITY_ORDER.indexOf(a.rarity)-RARITY_ORDER.indexOf(b.rarity)||a.name.localeCompare(b.name)).map(card => `
          <button type="button" class="creature-slot rarity-${card.rarity.toLowerCase()}" data-anomaly-creature="${card.id}" ${counts[card.id]?'':'disabled'}>
            ${counts[card.id]?`<img src="${assetRoot+card.id}.webp" loading="lazy" alt="">`:'<span class="creature-unknown">?</span>'}
            <span><b>${counts[card.id]?card.name:'UNDISCOVERED'}</b><small>${card.rarity} · ${counts[card.id]?'×'+counts[card.id]:'LOCKED'}</small>
            ${counts[card.id]?`<small>OBTAINED // ${esc(obtainedAt(cards.find(p=>p.cardId===card.id)))}</small>`:''}</span>
          </button>`).join('')}</div>
        <p class="anomaly-note">Collection is tied to this browser. Clearing site data or switching devices removes local progress.</p>
      </section>`;
  }

  function draw(id) {
    if (revealing) return;
    resetIfNewDay();
    const pull = state.pulls.find(p => p.id === id && !p.cardId);
    if (!pull) return;
    soundContext(); // The opening click unlocks audio on mobile browsers.
    const card = (testMode && pull.testRarity ? CREATURES.find(c => c.rarity === pull.testRarity) : null) || rollCard();
    // Commit first: a refresh during the reveal cannot lose the result or reroll.
    pull.cardId = card.id; pull.claimedAt = new Date().toISOString();
    save();
    selected = pull.id;
    revealing = true;
    const button = body?.querySelector('[data-anomaly-draw]');
    if (button) { button.disabled = true; button.textContent = 'DECODING SPECIMEN…'; }
    const duplicate = state.pulls.some(p => p !== pull && p.cardId === card.id &&
      state.pulls.indexOf(p) < state.pulls.indexOf(pull));
    const overlay = document.createElement('div');
    overlay.className = 'creature-reveal-overlay';
    overlay.dataset.stage = 'scan';
    overlay.dataset.rarity = card.rarity.toLowerCase();
    overlay.setAttribute('role','status');
    overlay.setAttribute('aria-live','polite');
    overlay.innerHTML = `<div class="creature-reveal-inner">
      <span class="creature-reveal-kicker">CINEGENOME LAB // SPECIMEN EXTRACTION</span>
      <div class="creature-reveal-pack" aria-hidden="true"><span>CG-09</span><b>?</b><small>UNIDENTIFIED LIFEFORM</small></div>
      <strong class="creature-reveal-status">SCANNING GENOME...</strong>
      <div class="creature-reveal-meter"><span></span></div>
      <button type="button" class="creature-reveal-action" data-reveal-skip>SKIP ANIMATION ↗</button>
    </div>`;
    dialog?.appendChild(overlay);
    const timers = [];
    const later = (fn, delay) => timers.push(setTimeout(fn,delay));
    const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };
    const finish = () => {
      if (!activeReveal || activeReveal.overlay !== overlay) return;
      clearTimers();overlay.remove();activeReveal = null;revealing = false;render();
      body?.querySelector('.creature-card')?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
    };
    const reveal = () => {
      if (!activeReveal || activeReveal.overlay !== overlay || overlay.dataset.stage === 'revealed') return;
      clearTimers();
      overlay.dataset.stage = 'revealed';
      overlay.innerHTML = `<div class="creature-reveal-inner">
        <span class="creature-reveal-kicker">CREATURE OBTAINED // ${esc(obtainedAt(pull))}</span>
        <strong class="creature-reveal-status">${card.rarity === 'SR'?'ULTRA RARE SPECIMEN':'NEW SPECIMEN DETECTED'} // ${card.rarity}</strong>
        ${cardMarkup(card,pull,duplicate,true)}
        <button type="button" class="creature-reveal-action" data-reveal-continue>CONTINUE TO COLLECTION ↗</button>
      </div>`;
      revealSound(card.rarity);
      announce('CREATURE OBTAINED // ' + card.name + ' [' + card.rarity + ']');
      overlay.querySelector('[data-reveal-continue]')?.focus();
    };
    activeReveal = {overlay,finish,reveal};
    overlay.addEventListener('click',event => {
      if (event.target.closest('[data-reveal-skip]')) reveal();
      else if (event.target.closest('[data-reveal-continue]')) finish();
    });
    overlay.querySelector('[data-reveal-skip]')?.focus();
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { reveal(); return; }
    tone(180,.18,'triangle',.045);
    for (let i=0; i<10; i++) later(() => tone(240+i*48,.09,'triangle',.028),160+i*145);
    later(() => {
      overlay.dataset.stage = 'charge';
      const status = overlay.querySelector('.creature-reveal-status');
      if (status) status.textContent = 'SIGNAL LOCKED // EXTRACTING...';
      tone(175,.42,'sawtooth',.035);
    },1850);
    later(() => { overlay.dataset.stage = 'burst'; tone(440,.16,'triangle',.04); },2250);
    later(reveal,2500);
  }

  document.querySelectorAll('[data-anomaly-open]').forEach(button => button.addEventListener('click', () => {
    resetIfNewDay(); render(); if (!dialog?.open) dialog?.showModal();
  }));
  document.getElementById('anomalyClose')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('close', () => activeReveal?.finish());
  body?.addEventListener('click', event => {
    const testButton = event.target.closest('[data-anomaly-test]');
    if (testMode && testButton) {
      const rarity = testButton.dataset.anomalyTest;
      if (!['RANDOM','C','B','A','S','SR'].includes(rarity)) return;
      const id = date + ':QA:' + Date.now() + ':' + Math.random().toString(36).slice(2);
      state.pulls.push({id,date,caseId:'QA',cardId:null,
        testRarity:rarity === 'RANDOM' ? null : rarity});
      save(); draw(id); return;
    }
    if (testMode && event.target.closest('[data-anomaly-test-reset]')) {
      activeReveal?.finish();
      try { progressStorage.removeItem(KEY); } catch {}
      state = loadState(date); selected = null; save(); render(); return;
    }
    if (event.target.closest('[data-anomaly-sound]')) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY,soundOn?'on':'off'); } catch {}
      if (soundOn) tone(540,.13,'sine',.035);
      render(); return;
    }
    const traceButton=event.target.closest('[data-anomaly-trace]');
    if(traceButton){ revealTrace(cases.find(x=>x.id===traceButton.dataset.anomalyTrace)); return; }
    const routeButton=event.target.closest('[data-anomaly-route]');
    if(routeButton){ takeMeThere(cases.find(x=>x.id===routeButton.dataset.anomalyRoute)); return; }
    const drawButton = event.target.closest('[data-anomaly-draw]');
    if (drawButton) { draw(drawButton.dataset.anomalyDraw); return; }
    const caseButton = event.target.closest('[data-anomaly-case]');
    const creatureButton = event.target.closest('[data-anomaly-creature]');
    if (caseButton) { selected = caseButton.dataset.anomalyCase; render(); return; }
    if (creatureButton) {
      const pull = state.pulls.find(p=>p.cardId===creatureButton.dataset.anomalyCreature);
      if (pull) { selected = pull.id; render(); body?.querySelector('.creature-draw')?.scrollIntoView?.({block:'start'}); }
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== KEY) return;
    state = loadState(date);render();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resetIfNewDay();
  });
  function scheduleReset() {
    const next = new Date();next.setHours(24,0,0,0);
    setTimeout(() => { resetIfNewDay(); scheduleReset(); }, Math.max(1000,next.getTime()-Date.now()+50));
  }
  scheduleReset();render();
  if (testMode && dialog && !dialog.open) dialog.showModal();

  window.CINEGENOME_ANOMALY = {
    scan(movie) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='scan' && !state.solved[x.id] && movie?.title===x.target.title && Number(movie.year)===Number(x.target.year));
      return item ? collect(item,movie.title) : false;
    },
    atlas(movie,xKey,yKey) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='atlas' && !state.solved[x.id]
        && xKey===x.xKey && yKey===x.yKey
        && Number(movie?.dna?.[x.xKey])>=x.xMin && Number(movie?.dna?.[x.xKey])<=x.xMax
        && Number(movie?.dna?.[x.yKey])>=x.yMin && Number(movie?.dna?.[x.yKey])<=x.yMax);
      return item ? collect(item,`${movie.title} / X ${label(item.xKey)} ${movie.dna[item.xKey]} / Y ${label(item.yKey)} ${movie.dna[item.yKey]}`) : false;
    },
    mutation(dna) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='mutation' && !state.solved[x.id] && Number(dna?.[x.high])>=Number(x.highMin??80) && Number(dna?.[x.low])<=Number(x.lowMax??30));
      return item ? collect(item,`${label(item.high)} ${dna[item.high]} / ${label(item.low)} ${dna[item.low]}`) : false;
    },
    crossbreed(a,b,ratio) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='crossbreed' && !state.solved[x.id]);
      if (!item || !a || !b || !Number.isFinite(Number(ratio)) || Number(ratio)<Number(item.ratioMin??40) || Number(ratio)>Number(item.ratioMax??60)) return false;
      const pair=[a.title,b.title].sort().join('|');
      if (pair!==item.parents.map(x=>x.title).sort().join('|')) return false;
      return collect(item,`${a.title} × ${b.title} / ${ratio}%`);
    },
    status() {
      resetIfNewDay();
      return { date, solved:cases.filter(x=>state.solved[x.id]).map(x=>x.id),
        collection:owned().length,
        pending:pending().length, pulls:state.pulls.map(p=>({...p})),
        caseBank:{...CASE_BANK_COUNTS,total:Object.values(CASE_BANK_COUNTS).reduce((a,b)=>a+b,0)}, cases:cases.map(x=>({
          id:x.id,kind:x.kind,hint:x.hint,target:x.target?.title,year:x.target?.year,
          xKey:x.xKey,yKey:x.yKey,xMin:x.xMin,xMax:x.xMax,yMin:x.yMin,yMax:x.yMax,
          high:x.high,low:x.low,highMin:x.highMin,lowMax:x.lowMax,parents:x.parents?.map(p=>p.title),ratioMin:x.ratioMin,ratioMax:x.ratioMax,profileId:x.profileId,
          traceLevel:traceLevel(x),integrity:caseIntegrity(x)
        })) };
    }
  };
})();

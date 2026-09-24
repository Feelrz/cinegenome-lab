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

  // Hand-written story clues only: provisional film DNA and incomplete TMDB
  // metadata must never be used to invent film trivia.
  const SCANNER_TRIVIA = [
    ['Mind Game','In 2004, an animated second chance turns a fatal encounter into an absurd escape from something enormous and alive. Which film?'],
    ['Eternal Sunshine of the Spotless Mind','In 2004, a breakup sends two former lovers to have each other removed from memory. Which film?'],
    ['Perfect Blue','In 1997, a former pop idol begins acting while her public persona and an online double erode her sense of self. Which film?'],
    ['Mulholland Drive','In 2001, an amnesiac and an aspiring actress follow a trail of clues through a dreamlike Los Angeles. Which film?'],
    ['Stalker','In 1979, a guide leads two visitors into a forbidden Zone rumored to grant a person’s deepest wish. Which film?'],
    ['Oldboy','In 2003, a man released after fifteen years of unexplained captivity searches for the person behind it. Which film?'],
    ['2001: A Space Odyssey','In 1968, a mysterious monolith reappears as a spacecraft’s artificial intelligence turns against its crew. Which film?'],
    ['Chungking Express','In 1994, two Hong Kong police officers deal with heartbreak in separate stories joined by a restless city. Which film?'],
    ['Cure','In 1997, a detective investigates murders linked by a strange ritual and a mysterious drifter. Which film?'],
    ['Fallen Angels','In 1995, a hired killer and the woman who manages his jobs inhabit a neon-lit city after dark. Which film?'],
    ['Black Swan','In 2010, a ballerina’s pursuit of a dual role makes perfection and identity collide. Which film?'],
    ['The Handmaiden','In 2016, a pickpocket enters a wealthy household as a maid while competing deceptions unfold. Which film?'],
    ['Trainspotting','In 1996, young friends in Scotland struggle with addiction and the temptation to leave it behind. Which film?'],
    ['The Matrix','In 1999, a hacker discovers that ordinary reality is an artificial system. Which film?'],
    ['The Truman Show','In 1998, one man gradually discovers that his everyday life has been a television production. Which film?'],
    ['Parasite','In 2019, an underemployed family enters a rich household through a chain of carefully staged jobs. Which film?'],
    ['Spirited Away','In 2001, a girl works in a bathhouse for spirits after her parents undergo a startling transformation. Which film?'],
    ['Memento','In 2000, a man who cannot form new memories relies on photographs and tattoos to pursue revenge. Which film?'],
    ['Whiplash','In 2014, a jazz drummer faces a brutal instructor while chasing musical greatness. Which film?'],
    ['The Grand Budapest Hotel','In 2014, a concierge and his lobby boy are drawn into a fight over an inheritance and a painting. Which film?'],
    ['Everything Everywhere All at Once','In 2022, a laundromat owner confronts alternate lives while her taxes are under audit. Which film?'],
    ['Akira','In 1988, a teenage biker in a future Tokyo develops dangerous psychic powers. Which film?'],
    ['Persona','In 1966, a nurse cares for an actress who has stopped speaking; their identities begin to blur. Which film?'],
    ['In the Mood for Love','In 2000, two neighbors suspect their spouses of an affair and form a careful bond of their own. Which film?'],
    ['Memories of Murder','In 2003, detectives confront a string of killings in a rural South Korean province. Which film?']
  ].map(([title,clue]) => ({target:FILMS.find(movie=>movie.title===title),clue})).filter(item=>item.target);

  // Each coordinate uses both Atlas controls. Keep enough qualifying films in
  // the bundled catalog that the default 80-node view remains practical.
  const ATLAS_PAIRS = [
    ['nostalgia','dreamLogic'],['visualExtremity','chaos'],
    ['darkness','dreamLogic'],['nostalgia','surrealism'],
    ['visualExtremity','nostalgia'],['darkness','visualExtremity'],
    ['nostalgia','darkness'],['visualExtremity','humor'],
    ['darkness','chaos'],['nostalgia','visualExtremity']
  ];
  const MUTATION_RIDDLES = [
    ['dreamLogic','romance','The plot only makes sense while asleep; the love story has almost vanished.'],
    ['darkness','humor','Almost no light survives the final act, and there is nothing left to laugh at.'],
    ['surrealism','pacing','Reality bends out of shape while the film refuses to hurry.'],
    ['chaos','romance','Every scene erupts into disorder; no one has time to fall in love.'],
    ['nostalgia','loneliness','The whole film feels like a memory, yet nobody has to face it alone.'],
    ['visualExtremity','humor','The images assault your eyes, but every joke has been cut.'],
    ['intensity','loneliness','The pressure never lets up, although no one is left alone with it.'],
    ['dreamLogic','pacing','A sleeping mind writes the rules; the story moves like a slow pulse.']
  ];
  const CROSSBREED_RIDDLES = [
    ['Mind Game','3 Idiots','An animated escape into a second life meets three students who refuse to obey the education machine.'],
    ['Perfect Blue','The Truman Show','A performer loses track of her own identity; an ordinary man suspects his life is being staged.'],
    ['Mulholland Drive','The Grand Budapest Hotel','A fractured Hollywood identity checks into a hotel where an inheritance and a painting go missing.'],
    ['Oldboy','Chungking Express','Fifteen years behind a locked door collide with two police officers nursing heartbreak in Hong Kong.'],
    ['Stalker','Spirited Away','A forbidden Zone that promises wishes meets a bathhouse where a girl works for spirits.'],
    ['2001: A Space Odyssey','The Matrix','A silent monolith in deep space meets a hacker who doubts the world he can see.'],
    ['Fallen Angels','In the Mood for Love','A neon-night killer meets two neighbors guarding a secret about their spouses.'],
    ['The Handmaiden','Parasite','A disguised maid enters one household; an entire family infiltrates another.'],
    ['Black Swan','Whiplash','A dancer’s impossible dual role rehearses alongside a drummer driven to the edge.'],
    ['Eternal Sunshine of the Spotless Mind','Memento','A romance erases its memories while a revenge story tattoos them back onto skin.'],
    ['Trainspotting','Little Miss Sunshine','A Scottish escape from addiction meets a family road trip toward a child’s pageant.'],
    ['Cure','Memories of Murder','A detective faces ritual-like murders in one country; a rural investigation stalls in another.']
  ].map(([first,second,clue])=>({parents:[FILMS.find(m=>m.title===first),FILMS.find(m=>m.title===second)],clue}))
    .filter(item=>item.parents.every(Boolean));
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
    {id:'foldhart',name:'FOLDHART',rarity:'SR',source:'INCEPTION',kind:'DREAM BEAST',description:'The city bends around its antlers.'}
  ];
  const ODDS = [{rarity:'C',weight:60},{rarity:'B',weight:30},{rarity:'A',weight:8},{rarity:'S',weight:1.8},{rarity:'SR',weight:0.2}];
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
      if (value < 0) return CREATURES.find(card => card.rarity === tier.rarity);
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
  let state = { date, solved: {}, collection: [], pulls: [], migrated: false, rewardVersion: 4 };
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
    const pool = SCANNER_TRIVIA.slice();
    let seed = hash(day);
    const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
    const shuffle = items => {
      for(let i=items.length-1;i>0;i--){const j=next()%(i+1);[items[i],items[j]]=[items[j],items[i]];}
      return items;
    };
    shuffle(pool);
    const coordinates=shuffle(ATLAS_PAIRS.slice()).slice(0,2).map(([xKey,yKey],index)=>{
      let xMin=60+(hash(`${day}:x:${index}`)%7),xMax=xMin+22;
      let yMin=35+(hash(`${day}:y:${index}`)%9),yMax=yMin+30;
      const available=()=>FILMS.filter(m=>m.dna?.[xKey]>=xMin&&m.dna[xKey]<=xMax&&m.dna[yKey]>=yMin&&m.dna[yKey]<=yMax).length;
      if(available()<35){xMin=60;xMax=86;yMin=35;yMax=70;}
      return {xKey,yKey,xMin,xMax,yMin,yMax};
    });
    const mutation=shuffle(MUTATION_RIDDLES.slice())[0];
    const crossbreed=shuffle(CROSSBREED_RIDDLES.slice())[0];
    const atlas=(id,name,axis)=>({id,kind:'atlas',name,...axis,
      hint:`Plot two signals: X = ${label(axis.xKey)} between ${axis.xMin} and ${axis.xMax}; Y = ${label(axis.yKey)} between ${axis.yMin} and ${axis.yMax}. Inspect a node inside both ranges. Load more nodes or randomize the constellation if needed.`});
    return [
      {id:'S1',kind:'scan',name:'IDENTITY LEAK',...pool[0],hint:pool[0].clue},
      {id:'S2',kind:'scan',name:'SPLIT SIGNAL',...pool[1],hint:pool[1].clue},
      atlas('A1','GHOST COORDINATE',coordinates[0]),
      atlas('A2','BROKEN CONSTELLATION',coordinates[1]),
      {id:'M1',kind:'mutation',name:'ILLEGAL VECTOR',high:mutation[0],low:mutation[1],
        hint:`${mutation[2]} Find the two Mutation sliders: one must reach at least four-fifths; the other can rise no higher than three-tenths.`},
      {id:'X1',kind:'crossbreed',name:'TWIN REACTOR',parents:crossbreed.parents,
        hint:`${crossbreed.clue} Pair the two films and initiate a crossbreed. Keep neither parent above three-fifths of the blend.`}
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
      <p class="anomaly-intro">Every two solved cases earn one creature draw. Finish all six for three draws today. Cases reset at local midnight; unopened packs and obtained cards stay here.</p>
      <div class="anomaly-case-grid">
        ${cases.map((item,index) => `<button type="button" class="anomaly-case ${state.solved[item.id]?'is-solved':''} ${selected===item.id?'is-selected':''}"
          data-anomaly-case="${item.id}" aria-pressed="${selected===item.id}">
          <small>CASE 0${index+1} / ${typeName(item.kind)}</small><strong>${esc(item.name)}</strong>
          <span>${state.solved[item.id]?'◆ CASE SOLVED':'◇ UNSOLVED'}</span>
        </button>`).join('')}
      </div>
      <section class="creature-draw" aria-live="polite">
        <div class="creature-draw-heading"><span class="anomaly-step-number">CREATURE DRAW // ${tickets.length} READY</span>
          <button type="button" class="creature-sound-toggle" data-anomaly-sound aria-pressed="${soundOn}">SOUND ${soundOn?'ON':'OFF'} ${soundOn?'◖))':'○'}</button></div>
        ${activeCard ? `<h3>CREATURE OBTAINED // ${esc(obtainedAt(activePull))}</h3>
          ${cardMarkup(activeCard,activePull,activeDuplicate,true)}
          <p>${activeDuplicate?'Duplicate pull. Your copy count has increased.':'New species recorded in your collection.'}</p>`
        : current ? `<div class="anomaly-step"><strong>${esc(current.name)}</strong><p>${esc(current.hint)}</p>
          ${state.solved[current.id]?'<p>Case solved. Every two completed cases unlock one creature draw.</p>':''}</div>` : ''}
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
        <div class="creature-gallery">${CREATURES.slice().reverse().map(card => `
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
      const item=cases.find(x=>x.kind==='mutation' && !state.solved[x.id] && Number(dna?.[x.high])>=80 && Number(dna?.[x.low])<=30);
      return item ? collect(item,`${label(item.high)} ${dna[item.high]} / ${label(item.low)} ${dna[item.low]}`) : false;
    },
    crossbreed(a,b,ratio) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='crossbreed' && !state.solved[x.id]);
      if (!item || !a || !b || !Number.isFinite(Number(ratio)) || Number(ratio)<40 || Number(ratio)>60) return false;
      const pair=[a.title,b.title].sort().join('|');
      if (pair!==item.parents.map(x=>x.title).sort().join('|')) return false;
      return collect(item,`${a.title} × ${b.title} / ${ratio}%`);
    },
    status() {
      resetIfNewDay();
      return { date, solved:cases.filter(x=>state.solved[x.id]).map(x=>x.id),
        collection:owned().length,
        pending:pending().length, pulls:state.pulls.map(p=>({...p})),
        cases:cases.map(x=>({
          id:x.id,kind:x.kind,hint:x.hint,target:x.target?.title,year:x.target?.year,
          xKey:x.xKey,yKey:x.yKey,xMin:x.xMin,xMax:x.xMax,yMin:x.yMin,yMax:x.yMax,
          high:x.high,low:x.low,parents:x.parents?.map(p=>p.title)
        })) };
    }
  };
})();

(() => {
  'use strict';

  const MOVIES = Array.isArray(window.CINEGENOME_MOVIES) ? window.CINEGENOME_MOVIES : [];
  const DIMS = Array.isArray(window.CINEGENOME_DIMENSIONS) ? window.CINEGENOME_DIMENSIONS : [];
  const DIM_KEYS = DIMS.map(d => d.key);
  const hasCompleteDNA = dna => !!dna && DIM_KEYS.every(key => typeof dna[key] === 'number' && Number.isFinite(dna[key]) && dna[key]>=0 && dna[key]<=100);
  const dnaSourceRank = source => source==='editorial-researched-v1' ? 5 : source==='curated-starter-v1' ? 4 : source==='legacy-curated-profile-v2' ? 4 : source==='tmdb-genome-v4' ? 3 : source==='editorial-archetype-v1' ? 2 : source==='tmdb-genome-v3' ? 1 : 0;
  const retainCurrentDNA = (current,cached) => {
    const before=dnaSourceRank(current.dnaSource),after=dnaSourceRank(cached.dnaSource);
    return before>after || (before===after && before>=2 &&
      Number(current.dnaEvidence?.coverage||0)>=Number(cached.dnaEvidence?.coverage||0));
  };
  const dnaReviewable = movie => hasCompleteDNA(movie?.dna) &&
    (movie.dnaSource==='curated-starter-v1' || movie.dnaSource==='editorial-researched-v1' || movie.dnaSource==='tmdb-genome-v4') &&
    DIM_KEYS.every(key=>Array.isArray(movie.dnaEvidence?.axes?.[key]) && movie.dnaEvidence.axes[key].length>0);
  const ENRICHED_TOP500 = Array.isArray(window.CINEGENOME_ENRICHED_TOP500) ? window.CINEGENOME_ENRICHED_TOP500 : [];
  const movieKey = (m) => `${String(m?.title||'').trim().toLowerCase()}|${Number(m?.year)||0}`;
  const mountedKeys = new Set(MOVIES.map(movieKey));
  ENRICHED_TOP500.forEach((m, i) => {
    if (!m || !hasCompleteDNA(m.dna)) return;
    const key = movieKey(m);
    const existing = MOVIES.find(x => movieKey(x) === key || (m.tmdbId && x.tmdbId && Number(x.tmdbId) === Number(m.tmdbId)));
    if (existing) {
      existing.inCurated500 = true;
      existing.dnaConfidence = existing.dnaConfidence ?? m.dnaConfidence;
      return;
    }
    if (mountedKeys.has(key)) return;
    MOVIES.push(Object.assign({ id: 2000000 + Number(m.sourceId || i + 1), country:'Unknown', genres:[], tags:[], inCurated500:true }, m));
    mountedKeys.add(key);
  });
  (window.CINEGENOME_WATCH_ONCE_EXTRA||[]).forEach(m=>{
    if(!hasCompleteDNA(m?.dna) || mountedKeys.has(movieKey(m)))return;
    MOVIES.push({...m});mountedKeys.add(movieKey(m));
  });
  function recordHomeAction(kind, films){
    const ids=films.map(film=>film?.id);
    if(ids.every(id=>Number.isSafeInteger(id)&&id>0))
      window.dispatchEvent(new CustomEvent('cinegenome:home-trace',{detail:{kind,ids}}));
  }
  const VERSION = window.CINEGENOME_DATA_VERSION || 'unknown';
  const dnaProvenance = movie => movie?.dnaSource==='editorial-researched-v1'
    ? 'SOURCE-REVIEWED EDITORIAL DNA // 12/12 AXES // INTERPRETATION'
    : movie?.dnaSource==='curated-starter-v1'
    ? 'EDITORIAL DNA // SOURCE NOTES PENDING'
    : movie?.dnaSource==='legacy-curated-profile-v2'
      ? 'LEGACY CURATED DNA // PARTIAL PROVENANCE // EXTERNAL REVIEW PENDING'
      : movie?.dnaSource==='editorial-archetype-v1'
      ? `EDITORIAL ARCHETYPE DNA // ${movie.cinematicSignals?.map(x=>String(x).toUpperCase()).join(' + ')||'DERIVED SIGNAL'} // SOURCE REVIEW PENDING`
      : movie?.dnaSource==='tmdb-genome-v4'
      ? `METADATA MODEL V4 // EVIDENCE ${movie.dnaEvidence?.coverage??'UNKNOWN'}/12 AXES // NEUTRAL PRIOR ON UNOBSERVED AXES`
      : movie?.dnaSource==='tmdb-genome-v3'
        ? 'LEGACY METADATA MODEL V3 // RECHECK PENDING'
        : 'PROVISIONAL DNA // AXIS EVIDENCE NOT VERIFIED';
  const dnaTrace = movie => {
    if(movie?.dnaSource==='editorial-archetype-v1'){ const a=movie.cinematicSignals||movie.dnaEvidence?.archetypes||[]; return a.length?`<div class="micro">ARCHETYPE TRACE // ${a.map(x=>esc(String(x).toUpperCase())).join(' + ')}</div>`:''; }
    if(movie?.dnaSource==='legacy-curated-profile-v2') return '<div class="micro">PROVENANCE TRACE // LEGACY CURATED PROFILE · AXIS SOURCES PENDING</div>';
    if(!['tmdb-genome-v4','editorial-researched-v1'].includes(movie?.dnaSource)) return '';
    const axes=movie.dnaEvidence?.axes||{};
    const strongest=DIMS.filter(d=>axes[d.key]?.length)
      .sort((a,b)=>Math.abs(movie.dna[b.key]-50)-Math.abs(movie.dna[a.key]-50)||DIM_KEYS.indexOf(a.key)-DIM_KEYS.indexOf(b.key))
      .slice(0,3).map(d=>`${d.label.toUpperCase()} ← ${axes[d.key].slice(0,2).map(s=>s.split(':')[0].toUpperCase()).join(' + ')}`);
    return strongest.length?`<div class="micro">EVIDENCE TRACE // ${strongest.map(esc).join(' · ')}</div>`:'';
  };
  const STORAGE_KEY = 'cinegenome_lab_v1';
  const RX_KEY = 'cinegenome_daily_rx_v2';
  const TMDB_CACHE_KEY = 'cinegenome_tmdb_movie_cache_v1';
  const TOP500_ITEMS = Array.isArray(window.CINEGENOME_TOP500) ? window.CINEGENOME_TOP500 : [];
  const TOP500 = Array.isArray(window.CINEGENOME_TOP500_TITLES) ? window.CINEGENOME_TOP500_TITLES : TOP500_ITEMS.map(x=>x.title);
  const TMDB = window.CINEGENOME_TMDB_SERVICE || null;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));
  const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  let state = loadState();
  let currentScannerId = MOVIES[0]?.id || null;
  let scannerTMDBRequestToken = 0;
  let scannerStatsCache = null;
  let scannerCompareThirdEnabled = false;
  let scannerSequenceTimers = [];
  let scannerSequenceLastKey = '';
  let scannerSequenceLastAt = 0;
  let moduleEntryTimers = [];
  let moduleEntryToken = 0;
  let mutationDNA = cloneDNA(MOVIES[0]?.dna || {});
  let mutationSeedNonce = 0;
  let mutationPass = 0;
  let activeMutationSeedCode = 'CGM-00000000';
  let logs = [];
  let currentPrescription = null;
  let prescriptionStage = 0;
  let ritualTimers = [];
  let rxTransitionTimer = null;
  let atlasShuffleSeed = Math.floor(Math.random() * 1000000000);
  // New seed on every full page load. Hack-text choices are deterministic inside
  // one page session, but a refresh produces a new interrogation vocabulary.
  const HACK_SESSION_SEED = (() => {
    try {
      const a = new Uint32Array(2);
      crypto.getRandomValues(a);
      return `${a[0].toString(16)}${a[1].toString(16)}`;
    } catch {
      return `${Date.now().toString(16)}${Math.floor(Math.random()*0xffffffff).toString(16)}`;
    }
  })();

  const RX_SPREAD = [
    { key:'wound', label:'WOUND', prompt:'the film that presses on what is unresolved' },
    { key:'mirror', label:'MIRROR', prompt:'the film that reflects your current cinematic appetite' },
    { key:'antidote', label:'ANTIDOTE', prompt:'the film that disrupts the pattern instead of feeding it' }
  ];

  const MODULE_INFO = {
    scanner:{
      code:'MODULE // 01',
      title:'SPECIMEN SCANNER',
      description:'Reads one film as a 12-trait cinematic genome, compares every axis with the archive median, detects anomalous traits, assigns model phenotypes and supports pair or triple cross-scans.',
      simple:'Choose one film, inspect what makes its genome unusual, then overlay it against up to two other specimens.',
      steps:['Search for or select a film specimen.','Read its genome silhouette, archive deviation, anomaly percentile and phenotype labels.','Use Compare Specimens for a pair/triple overlay, then open the dossier for the full pathology report.']
    },
    crossbreed:{
      code:'MODULE // 02',
      title:'CROSSBREED REACTOR',
      description:'Combines the cinematic DNA of two films into one synthetic hybrid genome. The dominance control determines how much of Parent A and Parent B survives in the result.',
      simple:'Blend two films together, adjust the ratio, then find real films whose DNA most closely resembles the synthetic hybrid.',
      steps:['Choose Parent A and Parent B.','Adjust Genetic Dominance to control the blend.','Initiate Crossbreed and inspect the closest viable archive matches.']
    },
    mutation:{
      code:'MODULE // 03',
      title:'MUTATION CHAMBER',
      description:'Starts from an existing film genome and lets you manually mutate individual cinematic traits. CineGenome continuously searches for the closest real film to the synthetic profile.',
      simple:'Take one film as a seed, alter its traits with the sliders, then discover the real film that most closely matches your mutation.',
      steps:['Search for a Seed Organism.','Load its DNA or generate a seeded mutation.','Move the trait sliders and watch the Live Vector Match update.']
    },
    atlas:{
      code:'MODULE // 04',
      title:'GENOME ATLAS',
      description:'Maps the archive as a cinematic constellation. Every circle represents one film, and its position is determined by the two DNA traits selected for the X and Y axes.',
      simple:'A map of films based on two DNA traits. Nearby points have more similar values along the selected axes.',
      steps:['Choose DNA traits for the X and Y axes.','Choose how many specimen nodes to load.','Click any node to reveal its title and inspect the film.']
    },
    bloodline:{
      code:'MODULE // 05',
      title:'CINEMATIC BLOODLINE LAB',
      description:'Builds model-inferred cinematic relatives using DNA similarity and release-year distance. Labels such as Ancestor Signal and Spiritual Sibling describe CineGenome proximity, not documented historical influence.',
      simple:'Trace model-based cinematic relatives around one film without claiming that one film historically influenced another.',
      steps:['Choose a Source Specimen.','Trace its model-inferred bloodline.','Click a relative to inspect it or send it to the Scanner.']
    },
    archive:{
      code:'MODULE // 06',
      title:'EXPERIMENT ARCHIVE',
      description:'Stores specimens and experiments you saved while using CineGenome. The archive is stored locally in this browser.',
      simple:'A local collection of saved films, crossbreeds and mutation experiments from your current browser.',
      steps:['Save specimens or experiments from other modules.','Return here to review saved lab activity.','Erase Archive clears only this browser’s locally stored lab history.']
    }
  };

  function openModuleInfo(key){
    const info=MODULE_INFO[key], dialog=$('#moduleInfoDialog');
    if(!info||!dialog)return;
    $('#moduleInfoCode').textContent=info.code;
    $('#moduleInfoTitle').textContent=info.title;
    $('#moduleInfoDescription').textContent=info.description;
    $('#moduleInfoSimple').textContent=info.simple;
    $('#moduleInfoSteps').innerHTML=info.steps.map((step,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><p>${esc(step)}</p></div>`).join('');
    if(!dialog.open) dialog.showModal();
  }

  let secretTapCount = 0;
  let secretTapTimer = null;
  let secretNonce = 0;
  let deadChannelMode = 'cult';
  let deadKeyboardBuffer = '';
  let deadSoundEnabled = true;
  let deadAudioTimer = null;
  let deadTransitionTimer = null;
  let deadHistoryArmed = false;
  const deadMetadataCache = new Map();
  let deadPosterHydrationToken = 0;
  let deadPickerSelection = null;
  let deadPickerTimer = null;
  let bootDismissTimer = null;
  let labUiAudioContext = null;
  const LAB_SFX_KEY='cinegenome_ui_sfx_v1';
  let labSfxEnabled=true;
  try{ labSfxEnabled=localStorage.getItem(LAB_SFX_KEY)!=='off'; }catch{}

  function syncLabSfxButton(){
    const btn=$('#globalSfxToggle');
    if(!btn)return;
    btn.textContent=`SFX // ${labSfxEnabled?'ON':'OFF'}`;
    btn.setAttribute('aria-pressed',String(labSfxEnabled));
    btn.classList.toggle('is-muted',!labSfxEnabled);
  }

  function playLabMenuSfx(isFilmprint=false){
    if(!labSfxEnabled)return;
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      const ctx=labUiAudioContext||(labUiAudioContext=new AudioCtx());
      if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const now=ctx.currentTime;

      // Master bus: short, dry and deliberately restrained so repeated navigation
      // feels like a tactile laboratory switch rather than a notification sound.
      const master=ctx.createGain();
      const compressor=ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-20,now);
      compressor.knee.setValueAtTime(8,now);
      compressor.ratio.setValueAtTime(5,now);
      compressor.attack.setValueAtTime(0.001,now);
      compressor.release.setValueAtTime(0.055,now);
      master.gain.setValueAtTime(0.0001,now);
      master.gain.exponentialRampToValueAtTime(isFilmprint?0.112:0.090,now+0.002);
      master.gain.exponentialRampToValueAtTime(0.0001,now+(isFilmprint?0.19:0.14));
      master.connect(compressor); compressor.connect(ctx.destination);

      // 1) Mechanical contact: a tiny filtered noise snap gives the click its tactile edge.
      const noiseLen=Math.max(1,Math.floor(ctx.sampleRate*0.035));
      const noiseBuffer=ctx.createBuffer(1,noiseLen,ctx.sampleRate);
      const noise=noiseBuffer.getChannelData(0);
      for(let i=0;i<noiseLen;i++){
        const env=Math.pow(1-i/noiseLen,4);
        noise[i]=(Math.random()*2-1)*env;
      }
      const noiseSrc=ctx.createBufferSource();
      const noiseHP=ctx.createBiquadFilter();
      const noisePeak=ctx.createBiquadFilter();
      const noiseGain=ctx.createGain();
      noiseHP.type='highpass'; noiseHP.frequency.setValueAtTime(1200,now);
      noisePeak.type='bandpass'; noisePeak.frequency.setValueAtTime(isFilmprint?3900:4550,now); noisePeak.Q.setValueAtTime(1.25,now);
      noiseGain.gain.setValueAtTime(isFilmprint?0.76:0.64,now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001,now+0.028);
      noiseSrc.buffer=noiseBuffer;
      noiseSrc.connect(noiseHP); noiseHP.connect(noisePeak); noisePeak.connect(noiseGain); noiseGain.connect(master);
      noiseSrc.start(now); noiseSrc.stop(now+0.035);

      // 2) Hard digital switch transient.
      const tick=ctx.createOscillator();
      const tickGain=ctx.createGain();
      tick.type='square';
      tick.frequency.setValueAtTime(isFilmprint?1650:1420,now);
      tick.frequency.exponentialRampToValueAtTime(isFilmprint?760:690,now+0.018);
      tickGain.gain.setValueAtTime(0.58,now);
      tickGain.gain.exponentialRampToValueAtTime(0.0001,now+0.022);
      tick.connect(tickGain); tickGain.connect(master); tick.start(now); tick.stop(now+0.024);

      // 3) Glassy confirmation ping — the 'high-tech lab' part of the sound.
      const ping=ctx.createOscillator();
      const pingGain=ctx.createGain();
      ping.type='triangle';
      ping.frequency.setValueAtTime(isFilmprint?1280:1760,now+0.006);
      ping.frequency.exponentialRampToValueAtTime(isFilmprint?2140:1320,now+(isFilmprint?0.105:0.064));
      pingGain.gain.setValueAtTime(0.0001,now);
      pingGain.gain.exponentialRampToValueAtTime(isFilmprint?0.54:0.42,now+0.009);
      pingGain.gain.exponentialRampToValueAtTime(0.0001,now+(isFilmprint?0.135:0.086));
      ping.connect(pingGain); pingGain.connect(master); ping.start(now+0.004); ping.stop(now+(isFilmprint?0.14:0.09));

      // 4) Very short sub 'thunk' prevents the click from sounding thin on speakers/headphones.
      const body=ctx.createOscillator();
      const bodyGain=ctx.createGain();
      body.type='sine';
      body.frequency.setValueAtTime(isFilmprint?165:135,now);
      body.frequency.exponentialRampToValueAtTime(isFilmprint?88:78,now+0.035);
      bodyGain.gain.setValueAtTime(0.42,now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001,now+0.040);
      body.connect(bodyGain); bodyGain.connect(master); body.start(now); body.stop(now+0.043);

      // FILMPRINT gets one extra micro data-chirp, keeping it recognisable without being louder.
      if(isFilmprint){
        const chirp=ctx.createOscillator();
        const chirpGain=ctx.createGain();
        chirp.type='sine';
        chirp.frequency.setValueAtTime(2250,now+0.065);
        chirp.frequency.exponentialRampToValueAtTime(3100,now+0.125);
        chirpGain.gain.setValueAtTime(0.0001,now+0.060);
        chirpGain.gain.exponentialRampToValueAtTime(0.28,now+0.073);
        chirpGain.gain.exponentialRampToValueAtTime(0.0001,now+0.145);
        chirp.connect(chirpGain); chirpGain.connect(master); chirp.start(now+0.060); chirp.stop(now+0.148);
      }
    }catch{}
  }

  function playLabActionSfx(){
    if(!labSfxEnabled)return;
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      const ctx=labUiAudioContext||(labUiAudioContext=new AudioCtx());
      if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const now=ctx.currentTime;
      const master=ctx.createGain();
      master.gain.setValueAtTime(0.0001,now);
      master.gain.exponentialRampToValueAtTime(0.075,now+0.002);
      master.gain.exponentialRampToValueAtTime(0.0001,now+0.095);
      master.connect(ctx.destination);

      const snap=ctx.createOscillator(), snapGain=ctx.createGain();
      snap.type='square';
      snap.frequency.setValueAtTime(1760,now);
      snap.frequency.exponentialRampToValueAtTime(860,now+0.018);
      snapGain.gain.setValueAtTime(0.56,now);
      snapGain.gain.exponentialRampToValueAtTime(0.0001,now+0.024);
      snap.connect(snapGain); snapGain.connect(master); snap.start(now); snap.stop(now+0.026);

      const relay=ctx.createOscillator(), relayGain=ctx.createGain();
      relay.type='triangle';
      relay.frequency.setValueAtTime(540,now+0.018);
      relay.frequency.exponentialRampToValueAtTime(1180,now+0.066);
      relayGain.gain.setValueAtTime(0.0001,now);
      relayGain.gain.exponentialRampToValueAtTime(0.34,now+0.022);
      relayGain.gain.exponentialRampToValueAtTime(0.0001,now+0.085);
      relay.connect(relayGain); relayGain.connect(master); relay.start(now+0.015); relay.stop(now+0.09);

      const body=ctx.createOscillator(), bodyGain=ctx.createGain();
      body.type='sine'; body.frequency.setValueAtTime(118,now);
      body.frequency.exponentialRampToValueAtTime(72,now+0.038);
      bodyGain.gain.setValueAtTime(0.22,now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001,now+0.042);
      body.connect(bodyGain); bodyGain.connect(master); body.start(now); body.stop(now+0.045);
    }catch{}
  }

  let labHoverSfxStamp=0;
  function playLabHoverSfx(){
    if(!labSfxEnabled)return;
    if(window.matchMedia && !window.matchMedia('(hover:hover) and (pointer:fine)').matches)return;
    const stamp=performance.now();
    if(stamp-labHoverSfxStamp<52)return;
    labHoverSfxStamp=stamp;
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      const ctx=labUiAudioContext||(labUiAudioContext=new AudioCtx());
      if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const now=ctx.currentTime;
      const master=ctx.createGain();
      master.gain.setValueAtTime(0.0001,now);
      master.gain.exponentialRampToValueAtTime(0.022,now+0.0015);
      master.gain.exponentialRampToValueAtTime(0.0001,now+0.052);
      master.connect(ctx.destination);
      const tick=ctx.createOscillator(),gain=ctx.createGain();
      tick.type='square';
      tick.frequency.setValueAtTime(1640,now);
      tick.frequency.exponentialRampToValueAtTime(1080,now+0.022);
      gain.gain.setValueAtTime(0.38,now);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.032);
      tick.connect(gain);gain.connect(master);tick.start(now);tick.stop(now+0.034);
      const body=ctx.createOscillator(),bodyGain=ctx.createGain();
      body.type='triangle';body.frequency.setValueAtTime(230,now+0.008);
      bodyGain.gain.setValueAtTime(0.0001,now);
      bodyGain.gain.exponentialRampToValueAtTime(0.18,now+0.010);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001,now+0.047);
      body.connect(bodyGain);bodyGain.connect(master);body.start(now+0.007);body.stop(now+0.050);
    }catch{}
  }


  // One TMDB request per specimen at a time, shared by Scanner/Crossbreed/Mutation.
  const metadataHydrationInFlight = new Map();
  let crossbreedMetadataToken = 0;
  let mutationMetadataTimer = null;
  let mutationMetadataToken = 0;
  let guestbookIncidentActive = false;
  let guestbookIncidentTimer = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        archive: Array.isArray(parsed.archive) ? parsed.archive : []
      };
    } catch {
      return { favorites: [], archive: [] };
    }
  }

  function persistState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function cloneDNA(dna) {
    const out = {};
    DIM_KEYS.forEach(k => {
      const value=dna?.[k];
      out[k]=typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100?value:null;
    });
    return out;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function makeMutationSeed(movie, nonce=mutationSeedNonce) {
    const raw = `${HACK_SESSION_SEED}|${movie?.id||0}|${movie?.title||'unknown'}|${movie?.year||0}|${nonce}`;
    return `CGM-${hash32(raw).toString(16).toUpperCase().padStart(8,'0')}`;
  }

  function mutationRng(extra='') {
    return mulberry32(hash32(`${activeMutationSeedCode}|${extra}`));
  }

  function updateMutationSeedReadout(movie) {
    activeMutationSeedCode = makeMutationSeed(movie);
    const code=$('#mutationSeedCode'); if(code) code.textContent=activeMutationSeedCode;
    const meta=$('#mutationSeedMeta');
    if(meta) meta.textContent=`${movie?.title||'UNKNOWN'} / PASS ${String(mutationPass).padStart(2,'0')} / SESSION SEEDED`;
  }

  function movieById(id) { return MOVIES.find(m => m.id === Number(id)); }

  function scoreSimilarity(a, b, weights = {}) {
    if (!hasCompleteDNA(a) || !hasCompleteDNA(b) || !DIM_KEYS.length) return null;
    let total = 0, weightTotal = 0;
    DIM_KEYS.forEach(key => {
      const w = Number(weights[key] ?? 1);
      const diff = clamp(a[key]) - clamp(b[key]);
      total += w * diff * diff;
      weightTotal += w;
    });
    const rms = Math.sqrt(total / Math.max(weightTotal, 1));
    return Math.round(clamp(100 - rms));
  }

  function nearest(dna, excludeIds = [], limit = 6) {
    return MOVIES
      .filter(m => !excludeIds.includes(m.id) && hasCompleteDNA(m.dna))
      .map(movie => ({ movie, score: scoreSimilarity(dna, movie.dna) }))
      .filter(entry => entry.score !== null)
      .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title))
      .slice(0, limit);
  }

  function blendDNA(a, b, ratioA = 50) {
    const wa = clamp(ratioA) / 100;
    const wb = 1 - wa;
    const out = {};
    DIM_KEYS.forEach(k => out[k] = Math.round(clamp(a?.[k]) * wa + clamp(b?.[k]) * wb));
    return out;
  }

  function dominantTraits(dna, count = 3) {
    return DIMS.map(d => ({ ...d, value: clamp(dna[d.key]) })).sort((a,b) => b.value - a.value).slice(0, count);
  }

  function lowestTraits(dna, count = 2) {
    return DIMS.map(d => ({ ...d, value: clamp(dna[d.key]) })).sort((a,b) => a.value - b.value).slice(0, count);
  }

  function stability(dna) {
    const chaos = clamp(dna.chaos);
    const dream = clamp(dna.dreamLogic);
    const intensity = clamp(dna.intensity);
    const complexity = clamp(dna.narrativeComplexity);
    return Math.round(clamp(100 - (chaos * .30 + dream * .18 + intensity * .17 + complexity * .10) + 24));
  }

  function pathologyReport(movie, dna = movie?.dna) {
    if (!dna) return 'No readable genome found.';
    const top = dominantTraits(dna, 3);
    const low = lowestTraits(dna, 1)[0];
    const words = top.map(t => t.label.toLowerCase()).join(', ');
    let warning = 'Genome remains within controllable laboratory parameters.';
    if (dna.chaos >= 90) warning = 'Severe volatility detected. Do not expose to linear narrative structures.';
    else if (dna.dreamLogic >= 90) warning = 'Reality membrane unstable. Dream-state contamination is probable.';
    else if (dna.loneliness >= 90) warning = 'Extreme isolation signature detected. Emotional vacuum is persistent.';
    else if (dna.darkness >= 90) warning = 'High darkness concentration. Extended exposure may alter tonal baseline.';
    return `Dominant expression: ${words}. Suppressed trait: ${low.label.toLowerCase()} (${low.value}). ${warning}`;
  }


  function directorFingerprint(movie) {
    if (!movie) return { dna:{}, count:0, label:'UNKNOWN' };
    const director=String(movie.director||'').trim();
    const known=director && !['unknown','metadata pending'].includes(director.toLowerCase());
    const peers=MOVIES.filter(m => known && String(m.director||'').trim().toLowerCase()===director.toLowerCase() && m.dna);
    const source=peers.length ? peers : [movie];
    const dna={};
    DIM_KEYS.forEach(k => dna[k]=Math.round(source.reduce((sum,m)=>sum+clamp(m.dna?.[k]),0)/Math.max(source.length,1)));
    return { dna, count:source.length, label:known?director:'DIRECTOR SIGNAL PENDING' };
  }

  function renderDirectorFingerprint(el, movie) {
    if(!el || !movie) return;
    const fp=directorFingerprint(movie);
    const traits=dominantTraits(fp.dna,4);
    el.innerHTML=`<div class="director-fingerprint-head"><strong>${esc(fp.label.toUpperCase())}</strong><span>${fp.count>1?`${fp.count} SPECIMENS AVERAGED`:'SINGLE-SPECIMEN PROFILE'}</span></div>
      <div class="fingerprint-bars">${traits.map(t=>`<div class="fingerprint-row"><span>${esc(t.label.toUpperCase())}</span><div class="fingerprint-track"><div class="fingerprint-fill" style="width:${t.value}%"></div></div><b>${t.value}</b></div>`).join('')}</div>`;
  }

  function watchConditions(movie, dna=movie?.dna) {
    if(!dna) return [];
    const out=[];
    const push=(label,tone='')=>{ if(!out.some(x=>x.label===label)) out.push({label,tone}); };
    if(clamp(dna.loneliness)>=74 || clamp(dna.darkness)>=78) push('WATCH ALONE','hot');
    if(clamp(dna.dreamLogic)>=72 || clamp(dna.surrealism)>=76) push('AFTER MIDNIGHT','hot');
    if(clamp(dna.narrativeComplexity)>=74 || (movie?.runtime||0)>=160) push('DO NOT WATCH TIRED','warn');
    if(clamp(dna.visualExtremity)>=78) push('LOW LIGHT / FULL SCREEN');
    if(clamp(dna.pacing)<=38 || (movie?.runtime||0)>=150) push('NO SECOND SCREEN');
    if(clamp(dna.intensity)>=82) push('ALLOW A QUIET COMEDOWN');
    if(clamp(dna.nostalgia)>=80) push('BEST WITHOUT DISTRACTIONS');
    if(clamp(dna.humor)>=78 && clamp(dna.darkness)<55) push('GOOD WITH COMPANY');
    if(clamp(dna.romance)>=78 && clamp(dna.loneliness)>=65) push('DO NOT TEXT YOUR EX','warn');
    if(!out.length) push('WATCH IN ONE SITTING');
    return out.slice(0,4);
  }

  function renderWatchConditions(el,movie) {
    if(!el || !movie) return;
    el.innerHTML=watchConditions(movie).map(x=>`<span class="watch-chip ${x.tone||''}">${esc(x.label)}</span>`).join('');
  }

  function bloodlineRelation(source,target,score) {
    const delta=(Number(target.year)||0)-(Number(source.year)||0);
    const topA=new Set(dominantTraits(source.dna,3).map(x=>x.key));
    const overlap=dominantTraits(target.dna,3).filter(x=>topA.has(x.key)).length;
    if(Math.abs(delta)<=2) return {key:'sibling',label:'SPIRITUAL SIBLING'};
    if(overlap<=1 && score>=78) return {key:'mutation',label:'MUTATION'};
    if(delta<0) return {key:'ancestor',label:'ANCESTOR SIGNAL'};
    return {key:'descendant',label:'DESCENDANT SIGNAL'};
  }

  function traceBloodline(sourceId) {
    const source=movieById(sourceId)||MOVIES[0];
    const svg=$('#bloodlineSvg'); if(!source||!svg)return;
    const relatives=nearest(source.dna,[source.id],8).map(x=>({...x,rel:bloodlineRelation(source,x.movie,x.score)}));
    $('#bloodlineComparison').hidden=true;
    const cx=500,cy=310,rx=350,ry=225;
    let links='', nodes='';
    relatives.forEach((r,i)=>{
      const a=(-Math.PI/2)+(i/relatives.length)*Math.PI*2;
      const x=cx+Math.cos(a)*rx, y=cy+Math.sin(a)*ry;
      links+=`<line class="bloodline-link ${r.rel.key}" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
      const short=r.movie.title.length>22?r.movie.title.slice(0,20)+'…':r.movie.title;
      nodes+=`<g class="bloodline-node" data-id="${r.movie.id}" tabindex="0" role="button" aria-label="${esc(r.movie.title)}"><circle cx="${x}" cy="${y}" r="${10+r.score/18}" fill="#182016" stroke="#879680"/><text x="${x}" y="${y+29}" text-anchor="middle">${esc(short)}</text><text class="bloodline-rel" x="${x}" y="${y+42}" text-anchor="middle">${esc(r.rel.label)} / ${r.score}%</text></g>`;
    });
    svg.innerHTML=`<rect width="1000" height="620" fill="#101510"/><circle cx="${cx}" cy="${cy}" r="116" fill="none" stroke="#273126" stroke-dasharray="4 8"/>${links}<g class="bloodline-node bloodline-source" data-id="${source.id}" tabindex="0"><circle cx="${cx}" cy="${cy}" r="22"/><text x="${cx}" y="${cy+42}" text-anchor="middle">${esc(source.title.length>28?source.title.slice(0,26)+'…':source.title)}</text><text class="bloodline-rel" x="${cx}" y="${cy+55}" text-anchor="middle">SOURCE / ${source.year||'—'}</text></g>${nodes}`;
    $('#bloodlineDetail').innerHTML=`<strong>${esc(source.title)}</strong> / ${esc(source.director||'Unknown')} / ${source.year||'—'} — model-inferred relatives based on 12-D DNA similarity and year distance.`;
    $$('.bloodline-node',svg).forEach(n=>{
      const activate=()=>{
        const m=movieById(Number(n.dataset.id)); if(!m)return;
        window.CINEGENOME_ANOMALY?.bloodline(source,m);
        const comparison=$('#bloodlineComparison');comparison.hidden=false;
        window.CINEGENOME_INSTRUMENTS.differential(comparison,source.dna,m.dna,{title:'CLOSEST SHARED SIGNALS',leftLabel:'SOURCE',rightLabel:'RELATIVE',similar:true});
        $('#bloodlineDetail').innerHTML=`<strong>${esc(m.title)} (${m.year||'—'})</strong> — ${esc(m.director||'Unknown')} · <button class="table-action" id="bloodlineScanBtn" type="button">SCAN SPECIMEN</button>`;
        $('#bloodlineScanBtn')?.addEventListener('click',()=>{renderScanner(m.id);recordHomeAction('scan',[m]);switchView('scanner');});
      };
      n.addEventListener('click',activate);
      n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
    });
    log(`BLOODLINE TRACED: ${source.title.toUpperCase()}`);
  }

  function deadChannelPool() {
    return Array.isArray(window.CINEGENOME_DEAD_CHANNEL) ? window.CINEGENOME_DEAD_CHANNEL : [];
  }

  function deadDepthLabel(rank) {
    if(rank<=45) return 'MAXIMUM CULT SIGNAL';
    if(rank<=100) return 'HIGH CULT SIGNAL';
    if(rank<=180) return 'FRINGE TRANSMISSION';
    if(rank<=240) return 'DEEP CHANNEL';
    return 'LOW-VISIBILITY SIGNAL';
  }

  function weightedDeadPick(pool, count, seed, mode='cult') {
    const rng=mulberry32(seed);
    const rows=pool.map(item=>{
      let weight=1;
      if(mode==='cult') weight=Math.max(.18,1.35-(item.rank/300));
      if(mode==='deep') weight=.2+(item.rank/300)*1.4;
      if(mode==='chaos') weight=.75+(hash32(`${seed}|${item.title}`)%100)/100;
      return {item,weight:Math.max(.05,weight)*(0.8+rng()*.45)};
    });
    const out=[];
    while(rows.length && out.length<count){
      const total=rows.reduce((s,x)=>s+x.weight,0);
      let roll=rng()*total, chosen=0;
      for(let i=0;i<rows.length;i++){ roll-=rows[i].weight; if(roll<=0){chosen=i;break;} }
      out.push(rows.splice(chosen,1)[0].item);
    }
    return out;
  }

  async function resolveDeadSpecimenMetadata(specimen){
    if(!specimen)return null;
    const key=String(specimen.rank);
    if(deadMetadataCache.has(key)) return deadMetadataCache.get(key);
    if(!TMDB?.canQuery()) return null;
    try{
      const data=await promiseTimeout(TMDB.resolveTitle(specimen.title,null,{strict:true}),9000,'DEAD_TMDB_TIMEOUT');
      const movie=data?tmdbToMovie(data):null;
      deadMetadataCache.set(key,movie);
      return movie;
    }catch(err){
      deadMetadataCache.set(key,null);
      log(`DEAD CHANNEL TMDB ERROR: ${specimen.title} // ${err.message||'UNKNOWN'}`);
      return null;
    }
  }

  function paintDeadCardPoster(specimen,movie,token){
    if(token!==deadPosterHydrationToken)return;
    const card=$(`.dead-card[data-rank="${specimen.rank}"]`);
    if(!card)return;
    const slot=card.querySelector('.dead-card-poster');
    if(!slot)return;
    if(movie?.posterPath && TMDB){
      const url=TMDB.posterUrl(movie.posterPath,'w342');
      slot.innerHTML=`<img src="${esc(url)}" alt="Poster for ${esc(movie.title||specimen.title)}" loading="lazy">`;
      slot.classList.add('has-poster');
      const meta=card.querySelector('.dead-card-meta');
      if(meta && movie.year) meta.innerHTML=`${esc(deadDepthLabel(specimen.rank))}<br>${movie.year} // ${esc(movie.director||'Unknown')}`;
    }else{
      slot.innerHTML='<span>POSTER SIGNAL<br>UNAVAILABLE</span>';
      slot.classList.add('is-missing');
    }
  }

  async function hydrateDeadCardPosters(specimens,token){
    if(!TMDB?.canQuery())return;
    const queue=specimens.slice();
    const worker=async()=>{
      while(queue.length && token===deadPosterHydrationToken){
        const specimen=queue.shift();
        const movie=await resolveDeadSpecimenMetadata(specimen);
        paintDeadCardPoster(specimen,movie,token);
      }
    };
    await Promise.all([worker(),worker(),worker()]);
  }

  function renderSecretArchive() {
    const host=$('#secretGrid'); if(!host)return;
    const pool=deadChannelPool();
    const seed=hash32(`${HACK_SESSION_SEED}|dead300|${secretNonce}|${deadChannelMode}`);
    const picked=weightedDeadPick(pool,12,seed,deadChannelMode);
    const token=++deadPosterHydrationToken;

    host.innerHTML=picked.map((m,i)=>{
      const sourceCode=`D${String(m.rank).padStart(3,'0')}-${hash32(m.title).toString(16).slice(0,4).toUpperCase()}`;
      return `<article class="dead-card" data-rank="${m.rank}" tabindex="0" role="button" aria-label="Open dossier for ${esc(m.title)}">
        <div class="dead-card-poster"><span>SEARCHING<br>TMDB SIGNAL...</span></div>
        <div class="dead-card-code">${sourceCode} // PAGE ${m.page}</div>
        <h3>${esc(m.title)}</h3>
        <div class="dead-card-meta">${esc(deadDepthLabel(m.rank))}<br>BAD SIGNAL COORDINATE ${String(m.rank).padStart(3,'0')} / 300</div>
        <div class="dead-card-signal"><span>FOUND ON THE WRONG SIDE OF THE WEB</span><button class="dead-open" type="button" data-rank="${m.rank}">OPEN DOSSIER</button></div>
      </article>`;
    }).join('');

    $$('.dead-card',host).forEach(card=>{
      const open=()=>{
        const specimen=pool.find(x=>x.rank===Number(card.dataset.rank));
        if(specimen) openDeadDossier(specimen);
      };
      card.addEventListener('click',e=>{
        if(e.target.closest('.dead-open'))return;
        open();
      });
      card.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}
      });
    });
    $$('.dead-open',host).forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      const specimen=pool.find(x=>x.rank===Number(btn.dataset.rank));
      if(specimen) openDeadDossier(specimen);
    }));

    hydrateDeadCardPosters(picked,token);
  }

  async function openDeadDossier(specimen) {
    const dialog=$('#deadDossierDialog'), host=$('#deadDossierContent');
    if(!dialog||!host)return;

    host.innerHTML=`<div class="dead-detail-kicker">DEAD CHANNEL // RESOLVING SPECIMEN ${String(specimen.rank).padStart(3,'0')}</div><div class="dead-detail-title">${esc(specimen.title)}</div><div class="dead-detail-copy">Querying pathology metadata…</div>`;

    if(!dialog.open){
      try{ dialog.showModal(); }
      catch{ dialog.setAttribute('open',''); }
    }

    const movie=await resolveDeadSpecimenMetadata(specimen);
    if(!dialog.open)return;

    if(!movie){
      host.innerHTML=`<div class="dead-detail-kicker">DEAD CHANNEL // ${String(specimen.rank).padStart(3,'0')}</div><div class="dead-detail-title">${esc(specimen.title)}</div><div class="dead-detail-meta">${esc(deadDepthLabel(specimen.rank))} // SOURCE POSITION ${String(specimen.rank).padStart(3,'0')}</div><div class="dead-detail-copy">Metadata signal unavailable. This specimen remains isolated from the main CineGenome catalog.</div>`;
      return;
    }

    const poster=movie.posterPath&&TMDB?TMDB.posterUrl(movie.posterPath,'w500'):'';
    host.innerHTML=`<div class="dead-detail-grid">
      <div class="dead-poster">${poster?`<img src="${esc(poster)}" alt="Poster for ${esc(movie.title)}">`:'POSTER SIGNAL UNAVAILABLE'}</div>
      <div>
        <div class="dead-detail-kicker">DEAD CHANNEL // ${String(specimen.rank).padStart(3,'0')} // ${esc(deadDepthLabel(specimen.rank))}</div>
        <h3 class="dead-detail-title">${esc(movie.title)}</h3>
        <div class="dead-detail-meta">${movie.year||'—'} / ${esc(movie.director||'Unknown')} ${movie.runtime?`/ ${movie.runtime} MIN`:''}<br>${esc((movie.genres||[]).join(' / ')||'UNCLASSIFIED')}</div>
        <div class="dead-detail-copy">${esc(movie.overview||'Synopsis signal unavailable.')}</div>
        <div class="section-kicker spacing-top">ISOLATED GENOME // ${hasCompleteDNA(movie.dna)?esc(dnaProvenance(movie)):'UNAVAILABLE // INSUFFICIENT DNA EVIDENCE'}</div>
        ${hasCompleteDNA(movie.dna)?`<div class="dna-grid dead-detail-dna" id="deadDnaGrid"></div>${dnaTrace(movie)}`:''}
        <p class="micro spacing-top">This resolved specimen remains off-catalog: opening it here does not add it to the normal 500-film pool.</p>
      </div>
    </div>`;
    if(hasCompleteDNA(movie.dna))renderDNAGrid($('#deadDnaGrid'),movie.dna);
  }

  function clearDeadAudioTimer(){
    if(deadAudioTimer){ clearTimeout(deadAudioTimer); deadAudioTimer=null; }
  }

  function playDeadLaugh(){
    const audio=$('#deadChannelAudio');
    if(!audio || !deadSoundEnabled || !$('#secretArchiveDialog')?.open) return;
    try{
      audio.pause();
      audio.currentTime=0;
      audio.volume=.13;
      audio.playbackRate=.88;
      const p=audio.play();
      if(p?.catch) p.catch(()=>{});
    }catch{}
    clearDeadAudioTimer();
    const pause=11000+(hash32(`${Date.now()}|dead-audio`)%9000);
    deadAudioTimer=setTimeout(playDeadLaugh,pause);
  }

  function primeDeadAudio(){
    const audio=$('#deadChannelAudio');
    if(!audio || !deadSoundEnabled)return;
    try{
      audio.pause();
      audio.currentTime=0;
      audio.muted=true;
      audio.volume=.13;
      audio.playbackRate=.88;
      const p=audio.play();
      if(p?.catch)p.catch(()=>{ audio.muted=false; });
    }catch{ audio.muted=false; }
  }

  function startDeadAudio(){
    const audio=$('#deadChannelAudio');
    if(!audio || !deadSoundEnabled)return;
    clearDeadAudioTimer();
    try{
      audio.pause();
      audio.currentTime=0;
      audio.muted=false;
      audio.volume=.01;
      audio.playbackRate=.88;
      audio.currentTime=0;
      const p=audio.play();
      if(p?.then){
        p.then(()=>{
          let v=.01;
          const fade=setInterval(()=>{
            v=Math.min(.13,v+.015);
            audio.volume=v;
            if(v>=.13) clearInterval(fade);
          },55);
        }).catch(()=>{});
      }
    }catch{}
    deadAudioTimer=setTimeout(playDeadLaugh,13000);
  }

  function stopDeadAudio(){
    clearDeadAudioTimer();
    const audio=$('#deadChannelAudio');
    if(!audio)return;
    try{ audio.pause(); audio.currentTime=0; }catch{}
  }

  function setDeadSound(enabled){
    deadSoundEnabled=!!enabled;
    const btn=$('#deadSoundBtn');
    if(btn){
      btn.classList.toggle('is-muted',!deadSoundEnabled);
      btn.textContent=deadSoundEnabled?'♫ SOUND: ON':'♫ SOUND: OFF';
    }
    if(deadSoundEnabled && $('#secretArchiveDialog')?.open) playDeadLaugh();
    else stopDeadAudio();
  }

  function closeGuestbookIncident({resumeAmbient=true}={}){
    const overlay=$('#guestbookJumpscare'), video=$('#guestbookSurpriseVideo');
    if(guestbookIncidentTimer){ clearTimeout(guestbookIncidentTimer); guestbookIncidentTimer=null; }
    guestbookIncidentActive=false;
    document.body.classList.remove('guestbook-incident');
    if(video){
      try{ video.pause(); video.currentTime=0; }catch{}
    }
    if(overlay){
      overlay.classList.remove('is-active');
      setTimeout(()=>{
        if(!guestbookIncidentActive && overlay.open){
          try{ overlay.close(); }catch{}
        }
      },120);
    }
    if(resumeAmbient && deadSoundEnabled && $('#secretArchiveDialog')?.open){
      clearDeadAudioTimer();
      deadAudioTimer=setTimeout(playDeadLaugh,2500);
    }
  }

  function triggerGuestbookIncident(){
    if(guestbookIncidentActive)return;
    const overlay=$('#guestbookJumpscare'), video=$('#guestbookSurpriseVideo');
    if(!overlay||!video)return;
    guestbookIncidentActive=true;
    stopDeadAudio();
    document.body.classList.add('guestbook-incident');
    if(!overlay.open){
      try{ overlay.showModal(); }
      catch{
        try{ overlay.setAttribute('open',''); }catch{}
      }
    }
    requestAnimationFrame(()=>requestAnimationFrame(()=>overlay.classList.add('is-active')));
    try{
      video.pause();
      video.currentTime=0;
      video.volume=1;
      const p=video.play();
      if(p?.catch) p.catch(()=>{});
    }catch{}
    // Safety fallback if ended event is missed.
    guestbookIncidentTimer=setTimeout(()=>closeGuestbookIncident(),5400);
    log('GUESTBOOK INCIDENT #004 // VIDEO PAYLOAD EXECUTED');
  }

  function runDeadTransition(){
    const veil=$('#deadTransition'), readout=$('#deadTransitionLog');
    if(!veil)return Promise.resolve();
    if(deadTransitionTimer){ clearTimeout(deadTransitionTimer); deadTransitionTimer=null; }
    veil.hidden=false;
    document.body.classList.add('dead-hijacking');
    requestAnimationFrame(()=>requestAnimationFrame(()=>veil.classList.add('is-on')));
    const messages=['DIALING 56K NODE...','HANDSHAKE ACCEPTED // WRONG HOST','DOWNLOADING cursed_index.html','MIRROR FOUND // DO NOT REFRESH'];
    messages.forEach((msg,i)=>setTimeout(()=>{if(readout)readout.textContent=msg;},i*245));
    return new Promise(resolve=>{
      deadTransitionTimer=setTimeout(()=>{
        resolve();
        setTimeout(()=>{
          veil.classList.remove('is-on');
          document.body.classList.remove('dead-hijacking');
          setTimeout(()=>{veil.hidden=true;},430);
        },110);
      },900);
    });
  }

  async function openSecretArchive() {
    const dialog=$('#secretArchiveDialog');
    if(!dialog || dialog.open)return;
    deadChannelMode='cult';
    $$('.dead-mode').forEach(b=>b.classList.toggle('is-active',b.dataset.deadMode===deadChannelMode));
    renderSecretArchive();
    deadPickerSelection=null;
    stopDeadPicker();
    if($('#deadPickerScreen')){
      $('#deadPickerScreen').classList.remove('is-spinning');
      $('#deadPickerCode').textContent='D???';
      $('#deadPickerTitle').textContent='CLICK THE BUTTON, COWARD';
      $('#deadPickerMeta').textContent='300 BAD IDEAS AVAILABLE';
      $('#deadPickerOpen').disabled=true;
    }

    // Unlock the audio element silently from the initiating gesture. The laugh itself
    // starts only after the hijack transition has finished, so loading and page ambience
    // can never overlap.
    primeDeadAudio();
    await runDeadTransition();

    dialog.classList.remove('is-leaving');
    if(!deadHistoryArmed){
      try{history.pushState({...history.state,cinegenomeOverlay:'weird-stuff'},'',location.href);deadHistoryArmed=true}catch{}
    }
    dialog.showModal();
    if(deadSoundEnabled) setTimeout(startDeadAudio,520);
    log('DEAD CHANNEL MIRROR LOADED // NORMAL SITE SUSPENDED');
  }

  function closeSecretArchiveSmooth(options={}){
    const fromHistory=options?.fromHistory===true;
    const dialog=$('#secretArchiveDialog');
    if(!dialog?.open)return;
    if(!fromHistory&&deadHistoryArmed&&history.state?.cinegenomeOverlay==='weird-stuff'){
      try{history.back();return}catch{}
    }
    deadHistoryArmed=false;
    if(guestbookIncidentActive) closeGuestbookIncident({resumeAmbient:false});
    dialog.classList.add('is-leaving');
    stopDeadPicker();
    stopDeadAudio();
    setTimeout(()=>{
      if(dialog.open)dialog.close();
      dialog.classList.remove('is-leaving');
      },430);
  }

  function log(message) {
    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    logs.unshift({ time, message });
    logs = logs.slice(0, 80);
    renderLogs();
  }

  function archiveExperiment(type, title, detail, dna = null) {
    state.archive.unshift({ id: Date.now(), type, title, detail, dna: dna ? cloneDNA(dna) : null, at: new Date().toISOString() });
    state.archive = state.archive.slice(0, 50);
    persistState();
    renderArchive();
  }

  function fillMovieSelect(select, includeBlank = false) {
    if (!select) return;
    select.innerHTML = includeBlank ? '<option value="">SELECT SPECIMEN</option>' : '';
    MOVIES.slice().sort((a,b) => a.title.localeCompare(b.title)).forEach(m => {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = `${m.title} (${m.year})`;
      select.appendChild(o);
    });
  }


  function movieSearchLabel(movie) {
    if(!movie) return '';
    return `${movie.title}${movie.year ? ` (${movie.year})` : ''}`;
  }

  function movieSearchHaystack(movie) {
    return [
      movie.title,
      movie.year,
      movie.director,
      movie.country,
      ...(movie.genres||[]),
      ...(movie.tags||[])
    ].join(' ').toLowerCase();
  }

  function movieSearchResults(query, limit=9) {
    const q=String(query||'').trim().toLowerCase();
    if(!q) return MOVIES.slice().sort((a,b)=>a.title.localeCompare(b.title)).slice(0,limit);
    const tokens=q.split(/\s+/).filter(Boolean);
    return MOVIES
      .map(movie=>{
        const title=String(movie.title||'').toLowerCase();
        const director=String(movie.director||'').toLowerCase();
        const year=String(movie.year||'');
        const hay=movieSearchHaystack(movie);
        if(!tokens.every(t=>hay.includes(t))) return null;
        let score=0;
        if(title===q) score+=1000;
        if(title.startsWith(q)) score+=500;
        if(title.includes(q)) score+=260;
        if(director.startsWith(q)) score+=180;
        if(director.includes(q)) score+=100;
        if(year===q) score+=160;
        const idx=title.indexOf(q);
        if(idx>=0) score+=Math.max(0,40-idx);
        return {movie,score};
      })
      .filter(Boolean)
      .sort((a,b)=>b.score-a.score || a.movie.title.localeCompare(b.movie.title))
      .slice(0,limit)
      .map(x=>x.movie);
  }

  function setMovieSearchSelection(inputId, hiddenId, movie) {
    const input=$(`#${inputId}`), hidden=$(`#${hiddenId}`);
    if(!input||!hidden||!movie)return;
    hidden.value=String(movie.id);
    input.value=movieSearchLabel(movie);
    input.dataset.selectedId=String(movie.id);
  }

  function setupMovieSearch({inputId,hiddenId,resultsId,initialMovie,onSelect}) {
    const input=$(`#${inputId}`), hidden=$(`#${hiddenId}`), host=$(`#${resultsId}`);
    if(!input||!hidden||!host)return;
    let results=[];
    let active=-1;

    const close=()=>{host.hidden=true;active=-1;};
    const choose=(movie)=>{
      if(!movie)return;
      setMovieSearchSelection(inputId,hiddenId,movie);
      close();
      onSelect?.(movie);
    };
    const paint=(query)=>{
      results=movieSearchResults(query,9);
      active=-1;
      host.innerHTML=results.length
        ? results.map((m,i)=>`<button type="button" class="movie-search-option" role="option" data-index="${i}" data-id="${m.id}"><strong>${esc(m.title)}</strong><span>${m.year||'—'}</span><small>${esc(m.director||'Unknown')} // ${esc((m.genres||[]).slice(0,2).join(' / ')||'UNCLASSIFIED')}</small></button>`).join('')
        : '<div class="movie-search-empty">NO MATCHING SPECIMEN</div>';
      host.hidden=false;
      $$('.movie-search-option',host).forEach(btn=>btn.addEventListener('mousedown',e=>{
        e.preventDefault();
        choose(results[Number(btn.dataset.index)]);
      }));
    };
    const highlight=()=>{
      $$('.movie-search-option',host).forEach((btn,i)=>btn.classList.toggle('is-keyboard',i===active));
    };

    input.addEventListener('focus',()=>{
      const selected=movieById(hidden.value);
      paint(selected && input.value===movieSearchLabel(selected) ? '' : input.value);
    });
    input.addEventListener('input',()=>paint(input.value));
    input.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){
        e.preventDefault();
        if(host.hidden) paint(input.value);
        active=Math.min(results.length-1,active+1); highlight();
      } else if(e.key==='ArrowUp'){
        e.preventDefault();
        active=Math.max(0,active-1); highlight();
      } else if(e.key==='Enter'){
        if(results.length){
          e.preventDefault();
          choose(results[active>=0?active:0]);
        }
      } else if(e.key==='Escape'){
        close();
        const selected=movieById(hidden.value);
        if(selected) input.value=movieSearchLabel(selected);
      }
    });
    input.addEventListener('blur',()=>{
      setTimeout(()=>{
        close();
        const selected=movieById(hidden.value);
        if(selected && input.value.trim()!==movieSearchLabel(selected)) input.value=movieSearchLabel(selected);
      },120);
    });

    if(initialMovie) setMovieSearchSelection(inputId,hiddenId,initialMovie);
  }

  function renderDNAGrid(el, dna) {
    if (!el) return;
    el.innerHTML = DIMS.map(d => {
      const v = clamp(dna?.[d.key]);
      const cls = v >= 88 ? 'hot' : v >= 72 ? 'acid' : '';
      return `<div class="dna-row ${cls}"><span>${esc(d.label.toUpperCase())}</span><div class="dna-track"><div class="dna-fill" style="width:${v}%"></div></div><span class="dna-value">${v}</span></div>`;
    }).join('');
  }

  function drawScope(svg, dna, seed = 1, label = 'GENOME WAVEFORM') {
    if (!svg || !dna) return;
    const w = 900, h = 270, mid = 135;
    const chaos = clamp(dna.chaos) / 100;
    const intensity = clamp(dna.intensity) / 100;
    const dream = clamp(dna.dreamLogic) / 100;
    const pacing = clamp(dna.pacing) / 100;
    const visual = clamp(dna.visualExtremity) / 100;
    let p1 = '', p2 = '', bars = '';
    for (let x=0; x<=w; x+=4) {
      const t = x / w;
      const wave = Math.sin(t * Math.PI * (4 + pacing * 16) + seed) * (22 + intensity * 47);
      const distortion = Math.sin(t * Math.PI * (17 + chaos * 29) + seed*2.7) * chaos * 20;
      const drift = Math.sin(t * Math.PI * 2 + dream * 3) * dream * 23;
      const genomeSignature = DIMS.slice(0, 12).reduce((sum, d, i) => {
        const centered = (clamp(dna[d.key]) - 50) / 50;
        return sum + Math.sin(t * Math.PI * (3.1 + i * 1.37) + seed * .013 * (i + 1)) * centered;
      }, 0) * 2.35;
      const y = mid + wave * (.55 + .35 * Math.sin(t * Math.PI * 3 + dream)) + distortion + drift + genomeSignature;
      const y2 = mid - wave * .58 + Math.sin(t*Math.PI*11 + seed) * visual * 15 - genomeSignature * .55;
      p1 += `${x===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)} `;
      p2 += `${x===0?'M':'L'}${x.toFixed(1)},${y2.toFixed(1)} `;
    }
    // The raw DNA values often cluster around the mid-range for grounded films.
    // Keep those raw 0-100 values intact, but give the scanner a specimen-relative
    // contrast pass so the shape of each profile is actually readable at a glance.
    // The tiny number above every bar is always the unmodified raw DNA score.
    const scopeDims = DIMS.slice(0, 12);
    const scopeValues = scopeDims.map(d => clamp(dna[d.key]));
    const scopeMin = Math.min(...scopeValues);
    const scopeMax = Math.max(...scopeValues);
    const scopeRange = Math.max(8, scopeMax - scopeMin);
    scopeDims.forEach((d, i) => {
      const x = 45 + i * 72;
      const v = scopeValues[i];
      const relative = clamp((v - scopeMin) / scopeRange, 0, 1);
      // 35% absolute magnitude + 65% local profile contrast. This exaggerates
      // differences visually without modifying the underlying DNA data.
      const expression = clamp((v / 100) * .35 + relative * .65, 0, 1);
      const bh = 16 + expression * 78;
      const y = 242 - bh;
      const hot = v > 88;
      bars += `<rect x="${x}" y="${y.toFixed(1)}" width="12" height="${bh.toFixed(1)}" fill="${hot?'#d03728':'#b8ff35'}" opacity=".88"/>`
        + `<line x1="${x-3}" y1="${y.toFixed(1)}" x2="${x+15}" y2="${y.toFixed(1)}" stroke="${hot?'#d03728':'#b8ff35'}" stroke-width="1" opacity=".36"/>`
        + `<text x="${x+6}" y="${Math.max(36,y-5).toFixed(1)}" text-anchor="middle" fill="${hot?'#d03728':'#b8ff35'}" font-size="7" opacity=".92">${Math.round(v)}</text>`
        + `<text x="${x+6}" y="258" text-anchor="middle" fill="#8e9887" font-size="7">${esc(d.label.slice(0,3).toUpperCase())}</text>`;
    });
    svg.innerHTML = `
      <rect width="900" height="270" fill="#121712"/>
      <g opacity=".7">${gridLines(w,h)}</g>
      <path d="${p2}" fill="none" stroke="#7d9e55" stroke-width="1.2" opacity=".6"/>
      <path d="${p1}" fill="none" stroke="#b8ff35" stroke-width="2.2"/>
      <line x1="0" y1="135" x2="900" y2="135" stroke="#566052" stroke-dasharray="5 8" opacity=".55"/>
      ${bars}
      <text x="18" y="22" fill="#b8ff35" font-size="10">${esc(label)}</text>
      <text x="882" y="22" text-anchor="end" fill="#7f8a79" font-size="9">STABILITY ${stability(dna)}%</text>`;
  }

  function gridLines(w,h) {
    let s='';
    for(let x=0;x<=w;x+=45) s += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#283126" stroke-width="1"/>`;
    for(let y=0;y<=h;y+=27) s += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#283126" stroke-width="1"/>`;
    return s;
  }

  function renderRanks(el, rows) {
    if (!el) return;
    el.innerHTML = rows.map((r, i) => `<div class="rank-item"><span class="rank-num">${String(i+1).padStart(2,'0')}</span><div><div class="rank-title">${esc(r.movie.title)}</div><div class="rank-meta">${esc(metadataMetaLine(r.movie))}</div></div><strong class="rank-score">${r.score}%</strong></div>`).join('');
  }


  function dismissBootScreen(){
    const boot=$('#bootScreen');
    if(!boot || boot.classList.contains('is-gone')) return;
    if(window.__CINEGENOME_BOOT_FAILSAFE__){
      clearTimeout(window.__CINEGENOME_BOOT_FAILSAFE__);
      window.__CINEGENOME_BOOT_FAILSAFE__=null;
    }
    boot.classList.add('is-gone');
    try{ sessionStorage.setItem('cinegenome_boot_seen','1'); }catch{}
    if(bootDismissTimer){clearTimeout(bootDismissTimer);bootDismissTimer=null;}
    setTimeout(()=>{boot.hidden=true;},620);
  }

  function initBootScreen(){
    const boot=$('#bootScreen'); if(!boot)return;
    let seen=false;
    try{ seen=sessionStorage.getItem('cinegenome_boot_seen')==='1'; }catch{}
    if(seen){ boot.hidden=true; return; }
    boot.hidden=false;
    bootDismissTimer=setTimeout(dismissBootScreen,1750);
  }

  function openHumanRecord(){
    const dialog=$('#humanSpecimenDialog');
    if(dialog && !dialog.open) dialog.showModal();
    log('HUMAN SPECIMEN RECORD OPENED // EXTERNAL ARCHIVE DETECTED');
  }


  function stopDeadPicker(){
    if(deadPickerTimer){ clearInterval(deadPickerTimer); deadPickerTimer=null; }
  }

  function spinDeadPicker(){
    const pool=deadChannelPool();
    const screen=$('#deadPickerScreen'), title=$('#deadPickerTitle'), code=$('#deadPickerCode'), meta=$('#deadPickerMeta'), open=$('#deadPickerOpen');
    if(!pool.length||!screen||!title)return;
    window.CINEGENOME_PICKER_SFX?.prime();
    stopDeadPicker();
    deadPickerSelection=null;
    open.disabled=true;
    screen.classList.add('is-spinning');
    let ticks=0;
    const max=24;
    const seed=hash32(`${HACK_SESSION_SEED}|picker3000|${Date.now()}|${secretNonce}`);
    const rng=mulberry32(seed);
    deadPickerTimer=setInterval(()=>{
      const m=pool[Math.floor(rng()*pool.length)]||pool[0];
      code.textContent=`D${String(m.rank).padStart(3,'0')}`;
      title.textContent=m.title;
      meta.textContent=`SEARCHING BAD SIGNALS... ${String(Math.min(99,ticks*4)).padStart(2,'0')}%`;
      ticks++;
      if(ticks % 2 === 0) window.CINEGENOME_PICKER_SFX?.tick(ticks);
      if(ticks>=max){
        stopDeadPicker();
        window.CINEGENOME_PICKER_SFX?.finish();
        deadPickerSelection=m;
        screen.classList.remove('is-spinning');
        code.textContent=`D${String(m.rank).padStart(3,'0')} // SELECTED`;
        title.textContent=m.title;
        meta.textContent=`${deadDepthLabel(m.rank)} // BAD SIGNAL COORDINATE ${String(m.rank).padStart(3,'0')}/300`;
        open.disabled=false;
        try{
          const audio=$('#deadChannelAudio');
          if(audio&&deadSoundEnabled){audio.playbackRate=.72;audio.volume=.07;}
        }catch{}
      }
    },58);
  }

  function isMetadataPending(movie){
    if(!movie) return true;
    const director=String(movie.director||'').trim().toLowerCase();
    const country=String(movie.country||'').trim().toLowerCase();
    return !movie.tmdbId
      || !director
      || director==='metadata pending'
      || director==='unknown'
      || !country
      || country==='unknown'
      || !(movie.genres||[]).length
      || !movie.overview
      || !movie.posterPath;
  }

  function promiseTimeout(promise, ms=9000, label='TMDB_TIMEOUT'){
    let timer;
    const timeout=new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error(label)),ms);
    });
    return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
  }

  async function hydrateMovieMetadata(movie){
    if(!movie || !TMDB?.canQuery() || (!isMetadataPending(movie) && movie.dnaSource!=='tmdb-genome-v3')) return movie;
    const key=String(movie.id);
    if(metadataHydrationInFlight.has(key)) return metadataHydrationInFlight.get(key);

    const task=(async()=>{
      try{
        return await promiseTimeout(enrichLocalMovie(movie),9000,'TMDB_REQUEST_TIMEOUT');
      } finally {
        metadataHydrationInFlight.delete(key);
      }
    })();

    metadataHydrationInFlight.set(key,task);
    return task;
  }

  function metadataMetaLine(movie,{includeCountry=false}={}){
    if(!movie) return 'METADATA SIGNAL UNAVAILABLE';
    const director=String(movie.director||'').trim();
    const pending=!director || director.toLowerCase()==='metadata pending' || director.toLowerCase()==='unknown';
    if(pending){
      return `RESOLVING TMDB SIGNAL… / ${movie.year||'—'}${includeCountry?' / …':''}`;
    }
    return `${director.toUpperCase()} / ${movie.year||'—'}${includeCountry?` / ${String(movie.country||'Unknown').toUpperCase()}`:''}`;
  }

  function renderScannerPoster(movie, state='idle') {
    const box=$('#scannerPosterBox'), img=$('#scannerPoster'), placeholder=$('#scannerPosterPlaceholder'), status=$('#scannerPosterStatus');
    if(!box||!img||!placeholder||!status||!movie)return;
    const poster=movie.posterPath && TMDB ? TMDB.posterUrl(movie.posterPath,'w342') : '';
    box.dataset.state=state;
    box.classList.toggle('has-poster',!!poster);
    if(poster){
      img.src=poster;
      img.alt=`Poster for ${movie.title}`;
      img.hidden=false;
      status.textContent='TMDB SIGNAL LOCKED';
    }else{
      img.hidden=true;
      img.removeAttribute('src');
      img.alt='';
      status.textContent=state==='loading' ? 'SEARCHING TMDB SIGNAL…' : state==='error' ? 'POSTER SIGNAL UNAVAILABLE' : TMDB?.canQuery() ? 'AWAITING TMDB RESOLUTION' : 'TMDB PROXY OFFLINE';
    }
  }

  async function hydrateScannerFromTMDB(movie) {
    if(!movie || !TMDB?.canQuery()) {
      renderScannerPoster(movie,'error');
      return;
    }
    const needsMetadata=isMetadataPending(movie);
    if(!needsMetadata){
      renderScannerPoster(movie,'ready');
      return;
    }
    const requestToken=++scannerTMDBRequestToken;
    const expectedId=movie.id;
    renderScannerPoster(movie,'loading');
    try{
      const enriched=await hydrateMovieMetadata(movie);
      if(requestToken!==scannerTMDBRequestToken || currentScannerId!==expectedId) return;
      if(!enriched){ renderScannerPoster(movie,'error'); return; }
      // Repaint all scanner readouts because TMDB enrichment can improve director,
      // genres, runtime and evidence-based model DNA in addition to adding the poster.
      renderScanner(enriched.id,{skipTMDB:true,silent:true});
      log(`SCANNER TMDB SIGNAL LOCKED: ${enriched.title.toUpperCase()}`);
    }catch(err){
      if(requestToken!==scannerTMDBRequestToken || currentScannerId!==expectedId) return;
      renderScannerPoster(movie,'error');
      const status=$('#scannerPosterStatus');
      if(status && String(err?.message||'').includes('TIMEOUT')) status.textContent='TMDB SIGNAL TIMEOUT // RETRY ON NEXT SCAN';
      log(`SCANNER TMDB LINK ERROR: ${err.message||'UNKNOWN'}`);
    }
  }


  function scannerStats(){
    if(scannerStatsCache) return scannerStatsCache;
    const out={};
    const archive=scannerBaselineReady()
      ? MOVIES.filter(dnaReviewable)
      : MOVIES;
    DIMS.forEach(d=>{
      const values=archive.map(m=>m?.dna?.[d.key]).filter(v=>typeof v==='number' && Number.isFinite(v) && v>=0 && v<=100).sort((a,b)=>a-b);
      const n=Math.max(1,values.length);
      const q=p=>values[Math.min(values.length-1,Math.max(0,Math.round((values.length-1)*p)))]||0;
      const mean=values.reduce((a,b)=>a+b,0)/n;
      const variance=values.reduce((sum,v)=>sum+Math.pow(v-mean,2),0)/n;
      out[d.key]={
        values,
        mean,
        sd:Math.sqrt(variance)||1,
        median:q(.5),
        q1:q(.25),
        q3:q(.75)
      };
    });
    scannerStatsCache=out;
    return out;
  }

  // The historical archive contains mostly unevidenced vectors. Do not present
  // its median or percentile as a calibrated population statistic.
  function scannerBaselineReady(){
    const verified=MOVIES.filter(dnaReviewable).length;
    return verified>=100 && verified>=Math.ceil(MOVIES.length*.7);
  }

  function signedDelta(value, median){
    const delta=Math.round(clamp(value)-Number(median||0));
    return `${delta>0?'+':''}${delta}`;
  }

  function scannerAnomalyProfile(dna){
    const stats=scannerStats();
    const rows=DIMS.map(d=>{
      const value=clamp(dna?.[d.key]);
      const st=stats[d.key]||{mean:50,sd:1,median:50,values:[]};
      const deviation=value-st.median;
      const z=Math.abs(value-st.mean)/Math.max(1,st.sd);
      const absoluteDeviation=Math.abs(deviation);
      const archiveDeviations=(st.values||[]).map(v=>Math.abs(v-st.median)).sort((a,b)=>a-b);
      const below=archiveDeviations.filter(v=>v<=absoluteDeviation).length;
      const anomalyPercentile=Math.round((below/Math.max(1,archiveDeviations.length))*1000)/10;
      return {...d,value,median:st.median,deviation,z,anomalyPercentile};
    }).sort((a,b)=>b.z-a.z || Math.abs(b.deviation)-Math.abs(a.deviation));
    const strongest=rows[0];
    const pair=rows.slice(0,2);
    const conditions=pair.map(r=>({key:r.key,direction:r.deviation>=0?'HIGH':'LOW',threshold:r.deviation>=0?Math.max(r.median+8,r.value-7):Math.min(r.median-8,r.value+7)}));
    const verified=MOVIES.filter(dnaReviewable);
    const matchCount=verified.filter(m=>conditions.every(c=>c.direction==='HIGH'?m.dna[c.key]>=c.threshold:m.dna[c.key]<=c.threshold)).length;
    const prevalence=Math.round((matchCount/Math.max(1,verified.length))*1000)/10;
    return {strongest,pair,prevalence,matchCount,rows};
  }

  function scannerPhenotypes(dna){
    const labels=[];
    const push=(label,detail)=>{if(labels.length<4&&!labels.some(x=>x.label===label))labels.push({label,detail});};
    const v=k=>typeof dna?.[k]==='number'&&Number.isFinite(dna[k])&&dna[k]>=0&&dna[k]<=100?dna[k]:undefined;
    if(v('pacing')<=38 && (v('darkness')>=58||v('intensity')>=60)) push('SLOW-BURN PRESSURE','LOW TEMPO / SUSTAINED LOAD');
    if(v('dreamLogic')>=72||v('surrealism')>=74) push('DREAM LOGIC','REALITY MEMBRANE UNSTABLE');
    if(v('visualExtremity')>=76) push('SENSORY MAXIMALISM','HIGH VISUAL EXPRESSION');
    if(v('loneliness')>=72 && v('humor')<=48) push('ISOLATION FIELD','SOCIAL SIGNAL SUPPRESSED');
    if(v('narrativeComplexity')>=72) push('FORMAL DENSITY','HIGH STRUCTURAL LOAD');
    if(v('romance')>=66 && v('darkness')>=64) push('DOOMED INTIMACY','ROMANCE / DARKNESS COUPLED');
    if(v('humor')>=68 && v('chaos')>=64) push('ANARCHIC COMEDY','HUMOR / CHAOS COUPLED');
    if(v('nostalgia')>=76) push('MEMORY-DRIVEN','NOSTALGIA DOMINANT');
    if(v('intensity')>=78 && v('pacing')>=66) push('KINETIC PRESSURE','HIGH SPEED / HIGH LOAD');
    if(v('darkness')>=78 && v('humor')<=35) push('AUSTERE DREAD','DARKNESS DOMINANT');
    if(labels.length<2){
      DIMS.map(d=>({...d,value:v(d.key)})).filter(t=>t.value!==undefined)
        .sort((a,b)=>b.value-a.value).slice(0,4)
        .forEach(t=>push(`${t.label.toUpperCase()} DOMINANT`,`${t.value} / 100 EXPRESSION`));
    }
    return labels.slice(0,4);
  }

  function renderScannerDNAGrid(el,dna,movie){
    if(!el)return;
    const stats=scannerStats();
    const calibrated=scannerBaselineReady() && dnaReviewable(movie);
    const self=scannerLocalAnomalyProfile(dna);
    el.innerHTML=DIMS.map(d=>{
      const raw=dna?.[d.key];
      const known=typeof raw==='number'&&Number.isFinite(raw)&&raw>=0&&raw<=100;
      const v=known?raw:null;
      const med=calibrated?stats[d.key]?.median:self?.median;
      const canCompare=known&&Number.isFinite(med);
      const delta=canCompare?Math.round(v-med):null;
      const cls=v>=88?'hot':v>=72?'acid':'';
      return `<div class="dna-row scanner-dna-row ${cls}">
        <span class="scanner-axis-label">${esc(d.label.toUpperCase())}</span>
        <div class="dna-track scanner-dna-track ${known?'':'is-unknown'}" title="${canCompare?`${calibrated?'Evidenced archive':'Subject'} median ${med}`:'Axis or reference unknown'}">
          ${known?`<div class="dna-fill" style="width:${v}%"></div>`:''}
          ${canCompare?`<i class="scanner-median-marker" style="left:${med}%" aria-hidden="true"></i>`:''}
        </div>
        <span class="dna-value scanner-dna-value"><b>${known?Math.round(v):'UNKNOWN'}</b><small class="${delta>0?'is-up':delta<0?'is-down':''}">${canCompare?`Δ ${delta>0?'+':''}${delta}`:'Δ —'}</small></span>
      </div>`;
    }).join('');
    const axisGuide=$('#scannerAxisGuide'),medianGuide=$('#scannerMedianGuide');
    if(axisGuide)axisGuide.textContent=calibrated?'AXIS DEVIATION // EVIDENCED ARCHIVE':'AXIS DEVIATION // WITHIN FILM';
    if(medianGuide)medianGuide.textContent=calibrated?'VERTICAL LINE = ARCHIVE MEDIAN':'VERTICAL LINE = SUBJECT MEDIAN';
  }

  function drawScannerSilhouette(svg,dna,movie){
    if(!svg||!dna)return;
    const self=scannerLocalAnomalyProfile(dna);
    if(!self||self.coverage!==DIMS.length){
      svg.innerHTML=`<rect width="260" height="150" fill="#101510"/><text x="130" y="74" text-anchor="middle" fill="#c5d1b8">SILHOUETTE UNKNOWN</text><text x="130" y="91" text-anchor="middle" fill="#a0a996">${self?.coverage??0}/${DIMS.length} KNOWN AXES</text>`;
      return;
    }
    const stats=scannerStats();
    const cx=130,cy=75,r=54;
    const ring=(ratio)=>DIMS.map((d,i)=>{
      const a=-Math.PI/2+(i/DIMS.length)*Math.PI*2;
      return `${(cx+Math.cos(a)*r*ratio).toFixed(1)},${(cy+Math.sin(a)*r*ratio).toFixed(1)}`;
    }).join(' ');
    const poly=(source)=>DIMS.map((d,i)=>{
      const a=-Math.PI/2+(i/DIMS.length)*Math.PI*2;
      const val=clamp(typeof source==='function'?source(d):source?.[d.key]);
      const rr=16+(val/100)*(r-16);
      return `${(cx+Math.cos(a)*rr).toFixed(1)},${(cy+Math.sin(a)*rr).toFixed(1)}`;
    }).join(' ');
    const subject=poly(dna);
    const calibrated=scannerBaselineReady()&&dnaReviewable(movie);
    const median=poly(d=>calibrated?stats[d.key]?.median:self.median);
    const spokes=DIMS.map((d,i)=>{
      const a=-Math.PI/2+(i/DIMS.length)*Math.PI*2;
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    }).join('');
    svg.innerHTML=`<rect width="260" height="150" fill="#101510"/>
      <g class="scanner-silhouette-grid"><polygon points="${ring(1)}"/><polygon points="${ring(.68)}"/><polygon points="${ring(.36)}"/>${spokes}</g>
      <polygon class="scanner-silhouette-median" points="${median}"/>
      <polygon class="scanner-silhouette-subject" points="${subject}"/>
      <text x="10" y="16">SUBJECT</text><text x="250" y="16" text-anchor="end">${calibrated?'EVIDENCED MEDIAN':'SUBJECT MEDIAN'}</text>`;
  }

  function renderScannerPhenotypes(dna){
    const host=$('#scannerPhenotypes'); if(!host)return;
    host.innerHTML=scannerPhenotypes(dna).map((p,i)=>`<div class="scanner-phenotype"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(p.label)}</strong><small>${esc(p.detail)}</small></div>`).join('');
  }

  function scannerLocalAnomalyProfile(dna){
    const known=DIMS.map((d,index)=>({...d,index,value:dna?.[d.key]}))
      .filter(r=>typeof r.value==='number'&&Number.isFinite(r.value)&&r.value>=0&&r.value<=100);
    if(known.length<4)return null;
    const sorted=known.map(r=>r.value).sort((a,b)=>a-b);
    const mid=Math.floor(sorted.length/2);
    const median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
    const rows=known.map(r=>({...r,deviation:r.value-median,strength:Math.abs(r.value-median)}))
      .sort((a,b)=>b.strength-a.strength||a.index-b.index);
    return {strongest:rows[0],pair:rows.slice(0,2),median,coverage:known.length,rows};
  }

  function renderScannerAnomaly(dna,movie){
    const delta=$('#scannerAnomalyDelta'),axis=$('#scannerAnomalyAxis'),meta=$('#scannerAnomalyMeta'),pair=$('#scannerRarePair'),mode=$('#scannerAnomalyMode');
    const calibrated=scannerBaselineReady() && dnaReviewable(movie);
    if(!calibrated){
      const profile=scannerLocalAnomalyProfile(dna);
      const top=profile?.strongest;
      const source=movie?.dnaSource==='editorial-researched-v1'?'SOURCE REVIEWED':
        movie?.dnaSource==='legacy-curated-profile-v2'?'LEGACY / PARTIAL TRACE':
        movie?.dnaSource==='editorial-archetype-v1'?'EDITORIAL ARCHETYPE':
        movie?.dnaSource==='curated-starter-v1'?'CURATED / UNTRACED':
        movie?.dnaSource==='tmdb-genome-v4'?'METADATA DERIVED':'PROVISIONAL';
      if(mode)mode.textContent='INTRA-SPECIMEN';
      if(delta)delta.textContent=top?`Δ ${signedDelta(top.value,profile.median)}`:'UNKNOWN';
      if(axis)axis.textContent=top?`${top.label.toUpperCase()} // ${Math.round(top.value)}`:'INSUFFICIENT DNA';
      if(meta)meta.textContent=top?`${top.strength===0?'NO AXIS DEVIATES // ':''}SUBJECT MEDIAN ${profile.median} / 100 // ${profile.coverage}/${DIMS.length} KNOWN AXES // ${source}`:'AT LEAST FOUR KNOWN AXES REQUIRED // UNKNOWN ≠ ZERO';
      if(pair){
        const names=profile?.pair.map(r=>`${r.deviation>0?'HIGH':r.deviation<0?'LOW':'AT MEDIAN'} ${r.label.toUpperCase()} ${Math.round(r.value)}`).join(' + ');
        pair.textContent=top?top.strength===0?'NO DOMINANT CONTRAST // FLAT SPECIMEN':`DOMINANT CONTRAST // ${names} // SAME FILM`:'TRAIT PAIR UNKNOWN';
      }
      return;
    }
    const profile=scannerAnomalyProfile(dna);
    const top=profile.strongest;
    if(!top)return;
    if(mode)mode.textContent='ARCHIVE DEVIATION';
    if(delta)delta.textContent=`Δ ${signedDelta(top.value,top.median)}`;
    if(axis)axis.textContent=`${top.label.toUpperCase()} // ${Math.round(top.value)}`;
    if(meta)meta.textContent=`ANOMALY PCTL ${profile.strongest.anomalyPercentile.toFixed(1)} // ARCHIVE MEDIAN ${Math.round(top.median)} // ${top.deviation>=0?'OVER-EXPRESSED':'SUPPRESSED'}`;
    if(pair){
      const names=profile.pair.map(r=>`${r.deviation>=0?'HIGH':'LOW'} ${r.label.toUpperCase()}`).join(' + ');
      pair.textContent=`${profile.prevalence<=12?'RARE':'DISTINCTIVE'} TRAIT PAIR // ${names} // ${profile.prevalence.toFixed(1)}% OF EVIDENCED ARCHIVE`;
    }
  }

  function runScannerSequence(movie){
    const overlay=$('#scannerScanSequence'),step=$('#scannerScanStep'),bar=$('#scannerScanProgress'),code=$('#scannerScanCode');
    if(!overlay||!step||!bar||!code||!movie)return;
    const panel=overlay.closest('.scanner-panel');
    const pathology=$('.pathology-panel');
    const now=Date.now();
    const key=String(movie.id);
    if(scannerSequenceLastKey===key && now-scannerSequenceLastAt<450)return;
    scannerSequenceLastKey=key;scannerSequenceLastAt=now;
    scannerSequenceTimers.forEach(clearTimeout);scannerSequenceTimers=[];
    const stages=[
      [0,'POSTER INGEST','OPTICAL CHANNEL ACQUIRED',8],
      [280,'METADATA EXTRACTION',`${movie.year||'—'} // ${String(movie.director||'UNKNOWN').toUpperCase()}`,27],
      [560,'GENOME MAPPING','12 AXES / VECTOR NORMALIZED',49],
      [840,'AXIS CALIBRATION',scannerBaselineReady()&&dnaReviewable(movie)?'ARCHIVE MEDIAN OVERLAY':'SUBJECT MEDIAN REFERENCE',68],
      [1120,'ANOMALY DETECTION',scannerBaselineReady()&&dnaReviewable(movie)?'PERCENTILE MODEL / TRAIT PAIRS':'DOMINANT AXIS / OWN MEDIAN',86],
      [1400,'SPECIMEN LOCKED',`SUBJECT #${String(movie.id).padStart(4,'0')} // READOUT READY`,100]
    ];
    overlay.hidden=false;
    overlay.classList.remove('is-leaving');
    panel?.classList.add('is-scanning');
    pathology?.classList.add('is-scanning');
    pathology?.setAttribute('aria-busy','true');
    requestAnimationFrame(()=>overlay.classList.add('is-active'));
    bar.style.width='0%';
    stages.forEach(([delay,label,detail,pct])=>{
      scannerSequenceTimers.push(setTimeout(()=>{
        step.textContent=label;code.textContent=detail;bar.style.width=`${pct}%`;
      },delay));
    });
    scannerSequenceTimers.push(setTimeout(()=>{
      overlay.classList.add('is-leaving');
      scannerSequenceTimers.push(setTimeout(()=>{
        overlay.classList.remove('is-active','is-leaving');overlay.hidden=true;
        panel?.classList.remove('is-scanning');
        pathology?.classList.remove('is-scanning');
        pathology?.removeAttribute('aria-busy');
      },260));
    },1660));
  }

  function scannerComparisonMovies(){
    const primary=movieById(currentScannerId)||MOVIES[0];
    const b=movieById($('#compareB')?.value);
    const c=scannerCompareThirdEnabled?movieById($('#compareC')?.value):null;
    const list=[primary,b,c].filter(Boolean);
    const unique=[];const ids=new Set();
    list.forEach(m=>{if(!ids.has(m.id)){ids.add(m.id);unique.push(m);}});
    return unique;
  }

  function drawScannerComparison(svg,movies){
    if(!svg||!movies.length)return;
    const w=900,h=210,top=34,bottom=168,left=42,right=20;
    const plotW=w-left-right;
    const x=i=>left+(i/(DIMS.length-1))*plotW;
    const y=v=>bottom-(clamp(v)/100)*(bottom-top);
    let grid='';
    [25,50,75].forEach(v=>{grid+=`<line x1="${left}" y1="${y(v)}" x2="${w-right}" y2="${y(v)}" class="scanner-compare-grid"/><text x="8" y="${y(v)+3}" class="scanner-compare-grid-label">${v}</text>`;});
    const axis=DIMS.map((d,i)=>`<text x="${x(i).toFixed(1)}" y="190" text-anchor="middle" class="scanner-compare-axis">${esc(d.label.slice(0,3).toUpperCase())}</text>`).join('');
    const classes=['is-a','is-b','is-c'];
    const paths=movies.map((m,idx)=>{
      const d=DIMS.map((dim,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(m.dna?.[dim.key]).toFixed(1)}`).join(' ');
      const dots=DIMS.map((dim,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(m.dna?.[dim.key]).toFixed(1)}" r="2.5"/>`).join('');
      return `<g class="scanner-compare-path ${classes[idx]}"><path d="${d}"/>${dots}</g>`;
    }).join('');
    const legend=movies.map((m,idx)=>`<g class="scanner-compare-legend ${classes[idx]}" transform="translate(${left+idx*260},16)"><line x1="0" y1="0" x2="24" y2="0"/><text x="31" y="3">${String.fromCharCode(65+idx)} // ${esc(m.title.slice(0,26).toUpperCase())}</text></g>`).join('');
    svg.innerHTML=`<rect width="900" height="210" fill="#101510"/>${grid}${paths}${axis}${legend}`;
  }


  function ensureScannerCompareSelections(primary){
    if(!primary)return;
    const bHidden=$('#compareB'),cHidden=$('#compareC');
    const fallback=(exclude)=>MOVIES.find(m=>!exclude.includes(m.id))||MOVIES[0];
    let b=movieById(bHidden?.value);
    if(!b||b.id===primary.id){
      b=fallback([primary.id]);
      if(b)setMovieSearchSelection('compareBSearch','compareB',b);
    }
    let c=movieById(cHidden?.value);
    if(!c||c.id===primary.id||c.id===b?.id){
      c=fallback([primary.id,b?.id]);
      if(c)setMovieSearchSelection('compareCSearch','compareC',c);
    }
  }

  function renderScannerComparison(){
    const primary=movieById(currentScannerId)||MOVIES[0];
    const primaryTitle=$('#comparePrimaryTitle'); if(primaryTitle&&primary)primaryTitle.textContent=`${primary.title} (${primary.year||'—'})`;
    const movies=scannerComparisonMovies();
    const svg=$('#scannerCompareScope'),host=$('#scannerCompareMetrics');
    if(!svg||!host||!movies.length)return;
    drawScannerComparison(svg,movies);
    if(movies.length<2){host.textContent='SELECT A SECOND SPECIMEN TO BEGIN CROSS-SCAN.';return;}
    const pairs=[];
    for(let i=0;i<movies.length;i++)for(let j=i+1;j<movies.length;j++)pairs.push({a:movies[i],b:movies[j],score:scoreSimilarity(movies[i].dna,movies[j].dna)});
    const coherence=Math.round(pairs.reduce((s,p)=>s+p.score,0)/Math.max(1,pairs.length));
    const stats=scannerStats();
    const shared=DIMS.map(d=>{
      const vals=movies.map(m=>clamp(m.dna?.[d.key]));
      const med=stats[d.key]?.median??50;
      const range=Math.max(...vals)-Math.min(...vals);
      const calibrated=scannerBaselineReady();
      const high=calibrated&&vals.every(v=>v>=med+6),low=calibrated&&vals.every(v=>v<=med-6);
      return {d,vals,range,shared:range<=22&&(calibrated?(high||low):true),direction:calibrated?(high?'HIGH':'LOW'):'CLOSE',avg:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)};
    });
    const sharedTraits=shared.filter(x=>x.shared).sort((a,b)=>a.range-b.range).slice(0,4);
    const deviations=shared.slice().sort((a,b)=>b.range-a.range).slice(0,4);
    host.innerHTML=`<div class="scanner-compare-summary"><strong>${coherence}%</strong><span>MODEL COHERENCE // ${movies.every(m=>['curated-starter-v1','editorial-researched-v1','legacy-curated-profile-v2','editorial-archetype-v1','tmdb-genome-v4'].includes(m.dnaSource))?'INTERPRETIVE':'PROVISIONAL'}</span></div>
      <div class="scanner-compare-pair-scores">${pairs.map(p=>`<span>${esc(p.a.title)} ↔ ${esc(p.b.title)} <b>${p.score}%</b></span>`).join('')}</div>
      <div class="scanner-compare-columns">
        <div><span>SHARED TRAITS</span>${sharedTraits.length?sharedTraits.map(x=>`<b>${x.direction} ${esc(x.d.label.toUpperCase())} // ${x.avg}</b>`).join(''):'<b>NO TIGHT SHARED TRAIT CLUSTER</b>'}</div>
        <div><span>MAJOR DEVIATION</span>${deviations.map(x=>`<b>${esc(x.d.label.toUpperCase())} // RANGE ${Math.round(x.range)}</b>`).join('')}</div>
      </div>
      <div class="scanner-compare-jump">${movies.slice(1).map(m=>`<button type="button" data-compare-scan="${m.id}">SCAN ${esc(m.title.toUpperCase())}</button>`).join('')}</div>`;
    $$('[data-compare-scan]',host).forEach(btn=>btn.addEventListener('click',()=>{
      const film=movieById(btn.dataset.compareScan);
      if(film){renderScanner(film.id);recordHomeAction('scan',[film])}
    }));
  }

  function renderScanner(id = currentScannerId, options = {}) {
    const movie = movieById(id) || MOVIES[0];
    if (!movie) return;
    currentScannerId = movie.id;
    if(!options.skipTMDB) scannerTMDBRequestToken++;
    $('#scannerSelect').value = String(movie.id);
    $('#scannerCode').textContent = `SUBJECT #${String(movie.id).padStart(4,'0')}`;
    $('#scannerTitle').textContent = movie.title;
    $('#scannerMeta').textContent = metadataMetaLine(movie,{includeCountry:true});
    $('#scannerTags').innerHTML = [...(movie.genres||[]), ...(movie.tags||[])].map(t => `<span class="tag">${esc(String(t).toUpperCase())}</span>`).join('');
    $('#stabilityScore').textContent = `${stability(movie.dna)}%`;
    $('#diagnostics').innerHTML = [
      ['EMOTIONAL DECAY', movie.dna.loneliness],
      ['REALITY DISTORTION', movie.dna.surrealism],
      ['VOLATILITY', movie.dna.chaos],
      ['VISUAL MUTATION', movie.dna.visualExtremity],
      ['DREAM CONTAMINATION', movie.dna.dreamLogic]
    ].map(([k,v]) => `<div class="diagnostic"><strong>${k}</strong><span>${v}%</span></div>`).join('');
    $('#scannerReport').textContent = pathologyReport(movie);
    renderScannerDNAGrid($('#scannerDNA'), movie.dna, movie);
    drawScannerSilhouette($('#scannerSilhouette'), movie.dna, movie);
    renderScannerPhenotypes(movie.dna);
    renderScannerAnomaly(movie.dna,movie);
    ensureScannerCompareSelections(movie);
    renderScannerComparison();
    $('#scannerDNASource').textContent=dnaProvenance(movie);
    drawScope($('#scannerScope'), movie.dna, movie.id, `${movie.title.toUpperCase()} / GENOME READOUT`);
    renderRanks($('#similarList'), nearest(movie.dna, [movie.id], 5));
    renderDirectorFingerprint($('#directorFingerprint'), movie);
    renderWatchConditions($('#watchConditions'), movie);
    renderScannerPoster(movie,movie.posterPath?'ready':'idle');
    const isFav = state.favorites.includes(movie.id);
    $('#favoriteBtn').setAttribute('aria-pressed', isFav ? 'true' : 'false');
    $('#favoriteBtn').textContent = isFav ? '★ SAVED' : '☆ SAVE';
    if(!options.silent)window.CINEGENOME_ANOMALY?.scan(movie);
    if(!options.silent) {
      runScannerSequence(movie);
      log(`SCANNED SPECIMEN: ${movie.title.toUpperCase()}`);
    }
    if(!options.skipTMDB) {
      // Delay one frame so the local scanner UI paints immediately before network work starts.
      requestAnimationFrame(()=>hydrateScannerFromTMDB(movie));
    }
  }

  function handleScannerSearch(query, scan=false) {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const found = MOVIES.find(m => [m.title,m.director,m.country,...m.genres,...m.tags].join(' ').toLowerCase().includes(q));
    if (found) {
      $('#scannerSelect').value=String(found.id);
      if(scan)renderScanner(found.id);
      return found;
    }
  }

  function renderCrossbreed(options={}) {
    const a = movieById($('#parentA').value) || MOVIES[0];
    const b = movieById($('#parentB').value) || MOVIES[1] || MOVIES[0];
    if (!a || !b) return;
    const ratioA = Number($('#blendSlider').value);
    const hybrid = blendDNA(a.dna, b.dna, ratioA);
    const matches = nearest(hybrid, [a.id,b.id], 5);
    const best = matches[0];

    $('#blendA').textContent = `${ratioA}%`;
    $('#blendB').textContent = `${100-ratioA}%`;
    $('#parentALabel').textContent = a.title.slice(0,18).toUpperCase();
    $('#parentBLabel').textContent = b.title.slice(0,18).toUpperCase();
    renderDNAGrid($('#hybridDNA'), hybrid);
    window.CINEGENOME_INSTRUMENTS.differential($('#hybridDifferential'),a.dna,b.dna,{title:'PARENT DIFFERENTIAL / LARGEST DISTANCES',middle:hybrid});
    drawScope($('#hybridScope'), hybrid, a.id+b.id+ratioA, 'SYNTHETIC HYBRID GENOME');
    $('#hybridStatus').textContent = 'ALIVE';
    $('#hybridMatchScore').textContent = best ? `${best.score}%` : '—%';
    $('#hybridMatchTitle').textContent = best?.movie.title || 'No viable match';
    $('#hybridMatchMeta').textContent = best ? metadataMetaLine(best.movie) : 'No archive match';
    $('#hybridReport').textContent = `${a.title} (${ratioA}%) × ${b.title} (${100-ratioA}%). ${pathologyReport(null, hybrid)}`;
    renderRanks($('#hybridMatches'), matches);

    // Resolve only the currently relevant parents + best hybrid result.
    // Requests are deduplicated globally, so dragging the blend slider does not spam TMDB.
    if(!options.skipHydrate && TMDB?.canQuery()){
      const targets=[a,b,best?.movie].filter(m=>m && isMetadataPending(m));
      if(targets.length){
        const token=++crossbreedMetadataToken;
        const expectedA=a.id, expectedB=b.id;
        Promise.allSettled(targets.map(hydrateMovieMetadata)).then(()=>{
          if(token!==crossbreedMetadataToken) return;
          if(Number($('#parentA').value)!==expectedA || Number($('#parentB').value)!==expectedB) return;
          renderCrossbreed({skipHydrate:true});
          log('CROSSBREED TMDB METADATA SYNCHRONIZED');
        });
      }
    }

    return { a,b,hybrid,best,ratioA };
  }

  function purgeCrossbreed() {
    $('#hybridScope').innerHTML = '';
    $('#hybridDNA').innerHTML = '';
    $('#hybridDifferential').innerHTML = '';
    $('#hybridStatus').textContent = 'IDLE';
    $('#hybridMatchScore').textContent = '—%';
    $('#hybridMatchTitle').textContent = 'Chamber purged';
    $('#hybridMatchMeta').textContent = 'No active organism.';
    $('#hybridReport').textContent = 'Crossbreed two films to generate a synthetic genome.';
    $('#hybridMatches').innerHTML = '';
    log('CROSSBREED CHAMBER PURGED');
  }

  function buildMutationControls() {
    const host = $('#mutationControls');
    host.innerHTML = '';
    DIMS.forEach(d => {
      const row = document.createElement('div');
      row.className = 'mutation-control';
      row.innerHTML = `<span>${esc(d.label.toUpperCase())}</span><input type="range" min="0" max="100" step="1" data-dim="${esc(d.key)}" value="${clamp(mutationDNA[d.key])}" aria-label="${esc(d.label)}"><strong data-value-for="${esc(d.key)}">${clamp(mutationDNA[d.key])}</strong>`;
      host.appendChild(row);
    });
    $$('input[type="range"][data-dim]', host).forEach(input => input.addEventListener('input', e => {
      const key = e.currentTarget.dataset.dim;
      mutationDNA[key] = clamp(e.currentTarget.value);
      $(`[data-value-for="${key}"]`, host).textContent = mutationDNA[key];
      renderMutation();
      window.CINEGENOME_ANOMALY?.mutation(mutationDNA);
    }));
  }

  async function loadMutationSeed({preservePass=false}={}) {
    let movie = movieById($('#mutationSeed').value) || MOVIES[0];
    if (!movie) return;
    if(!preservePass) mutationPass=0;
    updateMutationSeedReadout(movie);
    // A selected seed is upgraded to the evidence-based film model when TMDB
    // metadata is available. The local provisional DNA remains the offline fallback.
    if (TMDB?.canQuery() && (Number(movie.dnaConfidence||0) < .7 || !movie.overview || !(movie.genres||[]).length)) {
      try {
        const upgraded=await hydrateMovieMetadata(movie);
        if(upgraded) movie=upgraded;
      } catch(err) { log(`MUTATION SEED ENRICHMENT SKIPPED: ${err.message}`); }
    }
    mutationDNA = cloneDNA(movie.dna);
    updateMutationSeedReadout(movie);
    buildMutationControls();
    renderMutation();
    log(`MUTATION SEED LOADED: ${movie.title.toUpperCase()} // ${activeMutationSeedCode}`);
  }


  function renderMutation(options={}) {
    const source=movieById($('#mutationSeed').value);
    window.CINEGENOME_INSTRUMENTS.differential($('#mutationDifferential'),source?.dna,mutationDNA,{title:'DEVIATION FROM SEED / LARGEST CHANGES',leftLabel:'SEED',rightLabel:'LIVE'});
    const match = nearest(mutationDNA, [], 1)[0];
    if (!match) return;
    $('#mutationScore').textContent = `${match.score}%`;
    $('#mutationTitle').textContent = match.movie.title;
    $('#mutationMeta').textContent = metadataMetaLine(match.movie,{includeCountry:true});
    renderDNAGrid($('#mutationMatchDNA'), match.movie.dna);
    $('#mutationReport').textContent = `Seed ${activeMutationSeedCode}. Synthetic profile currently converges on ${match.movie.title}. ${pathologyReport(null, mutationDNA)}`;
    renderTubes();

    // Slider movement can change the nearest specimen rapidly. Wait briefly before
    // resolving TMDB metadata so we only hydrate the specimen the user actually lands on.
    if(!options.skipHydrate && TMDB?.canQuery() && isMetadataPending(match.movie)){
      if(mutationMetadataTimer) clearTimeout(mutationMetadataTimer);
      const token=++mutationMetadataToken;
      const expectedId=match.movie.id;
      mutationMetadataTimer=setTimeout(async()=>{
        try{
          await hydrateMovieMetadata(match.movie);
          if(token!==mutationMetadataToken) return;
          const current=nearest(mutationDNA,[],1)[0];
          if(!current || current.movie.id!==expectedId) return;
          renderMutation({skipHydrate:true});
          log(`MUTATION MATCH TMDB SIGNAL LOCKED: ${match.movie.title.toUpperCase()}`);
        }catch(err){
          log(`MUTATION MATCH TMDB LINK ERROR: ${err.message||'UNKNOWN'}`);
        }
      },220);
    }
  }

  function renderTubes() {
    const host = $('#testTubes');
    const sample = DIMS.slice(0, 6);
    // Beta49 mechanics: the liquid level is a pure CSS level on the vessel.
    // Keep the newer 3×2 chamber layout, but avoid extra badges/inner boxes.
    host.innerHTML = sample.map(d => `<div class="tube-wrap"><div class="tube" style="--level:${clamp(mutationDNA[d.key])}%"></div><div class="tube-label">${esc(d.label.toUpperCase())}</div></div>`).join('');
  }

  function randomMutation() {
    const source=movieById($('#mutationSeed').value) || MOVIES[0];
    if(!source)return;
    mutationPass++;
    updateMutationSeedReadout(source);
    const base=cloneDNA(source.dna);
    const rng=mutationRng(`pass-${mutationPass}`);
    DIM_KEYS.forEach((k,idx) => {
      // Mutations are centered on the seed organism instead of becoming pure
      // random noise. Most traits move modestly; a few become recessive/extreme.
      const u=(rng()+rng()+rng())/3; // triangular-ish center bias
      let delta=Math.round((u-.5)*52);
      if(rng()<0.12) delta += Math.round((rng()<.5?-1:1)*(12+rng()*22));
      mutationDNA[k]=clamp(base[k]+delta);
    });
    buildMutationControls();
    renderMutation();
    log(`SEEDED MUTAGEN PASS ${mutationPass}: ${activeMutationSeedCode}`);
  }

  async function randomizeMutationSeed() {
    if(!MOVIES.length)return;
    mutationSeedNonce++;
    mutationPass=0;
    const rng=mulberry32(hash32(`${HACK_SESSION_SEED}|mutation-seed|${mutationSeedNonce}`));
    const pool=MOVIES.filter(m=>m?.dna);
    const movie=pool[Math.floor(rng()*pool.length)] || MOVIES[0];
    setMovieSearchSelection('mutationSeedSearch','mutationSeed',movie);
    activeMutationSeedCode=makeMutationSeed(movie);
    updateMutationSeedReadout(movie);
    await loadMutationSeed();
    log(`RANDOM MUTATION SEED SELECTED: ${movie.title.toUpperCase()}`);
  }

  function setupAtlasControls() {
    [$('#axisX'), $('#axisY')].forEach((select, index) => {
      select.innerHTML = DIMS.map(d => `<option value="${esc(d.key)}">${esc(d.label.toUpperCase())}</option>`).join('');
      select.value = index === 0 ? 'surrealism' : 'loneliness';
    });
    const genres = allGenres();
    $('#atlasGenre').innerHTML = '<option value="">ALL GENRES</option>' + genres.map(g => `<option>${esc(g)}</option>`).join('');
  }

  function drawAtlas() {
    const svg = $('#atlasSvg');
    const xKey = $('#axisX').value;
    const yKey = $('#axisY').value;
    const genre = $('#atlasGenre').value;
    const requested = clamp(Number($('#atlasLimit')?.value || 80),20,500);
    if($('#atlasLimitValue')) $('#atlasLimitValue').textContent = String(requested);
    const query=($('#atlasFind')?.value||'').trim().toLowerCase();
    const source = MOVIES.filter(m => (!genre || m.genres.includes(genre)) &&
      (!query || `${m.title} ${m.year||''} ${m.director||''}`.toLowerCase().includes(query)) &&
      window.CINEGENOME_INSTRUMENTS.known(m.dna?.[xKey]) && window.CINEGENOME_INSTRUMENTS.known(m.dna?.[yKey]));
    const ordered = source.slice().sort((a,b)=>hash32(`${atlasShuffleSeed}|${a.title}|${a.year}`)-hash32(`${atlasShuffleSeed}|${b.title}|${b.year}`));
    const rows = ordered.slice(0,Math.min(requested,ordered.length));
    $('#atlasCount').textContent = `${rows.length} / ${source.length} SPECIMENS`;
    $('#atlasDetail').textContent=!rows.length?'NO MATCHING KNOWN COORDINATES. Clear the search or change the filters.':rows.length>40?'Dense constellation mode — labels are hidden. Click any node to reveal its film title.':'Select a node to inspect its coordinates in this field.';
    const w=1000,h=620,pad={l:64,r:30,t:28,b:58};
    const sx = v => pad.l + (clamp(v)/100)*(w-pad.l-pad.r);
    const sy = v => h-pad.b - (clamp(v)/100)*(h-pad.t-pad.b);
    let grid='';
    for(let v=0;v<=100;v+=20){
      const x=sx(v), y=sy(v);
      grid += `<line class="atlas-grid" x1="${x}" y1="${pad.t}" x2="${x}" y2="${h-pad.b}"/><line class="atlas-grid" x1="${pad.l}" y1="${y}" x2="${w-pad.r}" y2="${y}"/><text class="atlas-tick" x="${x}" y="${h-35}" text-anchor="middle">${v}</text><text class="atlas-tick" x="42" y="${y+3}" text-anchor="middle">${v}</text>`;
    }
    const showLabels = rows.length <= 40;
    const nodes = rows.map(m => {
      const x=sx(m.dna[xKey]), y=sy(m.dna[yKey]);
      const hot=m.dna.intensity>=90;
      const label = showLabels ? `<text class="atlas-dot-label" x="${x+9}" y="${y-8}">${esc(m.title.length>24?m.title.slice(0,22)+'…':m.title)}</text>` : '';
      return `<g class="atlas-node" data-id="${m.id}" tabindex="0" role="button" aria-label="${esc(m.title)}"><title>${esc(m.title)} (${m.year||'—'})</title><circle cx="${x}" cy="${y}" r="${4+m.dna.visualExtremity/32}" fill="${hot?'#d03728':'#b8ff35'}" stroke="#e8eadf" stroke-width="1" opacity=".86"/>${label}</g>`;
    }).join('');
    const xLabel = DIMS.find(d=>d.key===xKey)?.label || xKey;
    const yLabel = DIMS.find(d=>d.key===yKey)?.label || yKey;
    svg.innerHTML = `<rect class="atlas-bg" width="1000" height="620" fill="#121712"/>${grid}${nodes}<text class="atlas-axis-label" x="500" y="603" text-anchor="middle">${esc(xLabel.toUpperCase())} →</text><text class="atlas-axis-label" transform="translate(14 310) rotate(-90)" text-anchor="middle">${esc(yLabel.toUpperCase())} →</text>`;
    $$('.atlas-node', svg).forEach(node => {
      const inspect = () => {
        const id=Number(node.dataset.id);
        inspectAtlasNode(id, xKey, yKey);
        if(!showLabels) revealAtlasNodeTitle(node,id);
        else {
          clearAtlasNodeTitle();
          node.classList.add('is-selected');
        }
      };
      node.addEventListener('click', e => { e.stopPropagation(); inspect(); });
      node.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect();} });
    });

    if(!showLabels){
      svg.addEventListener('click', e=>{
        if(e.target?.classList?.contains('atlas-bg')) clearAtlasNodeTitle();
      }, {once:true});
    }
  }

  function clearAtlasNodeTitle(){
    const svg=$('#atlasSvg'); if(!svg)return;
    svg.querySelector('#atlasSelectedLabel')?.remove();
    $$('.atlas-node',svg).forEach(n=>n.classList.remove('is-selected'));
  }

  function revealAtlasNodeTitle(node,id){
    const svg=$('#atlasSvg'), movie=movieById(id); if(!svg||!node||!movie)return;
    clearAtlasNodeTitle();

    const circle=node.querySelector('circle'); if(!circle)return;
    const cx=Number(circle.getAttribute('cx')||0);
    const cy=Number(circle.getAttribute('cy')||0);
    const title=movie.title||'UNKNOWN SPECIMEN';

    // Approximate pixel-width inside the fixed 1000px SVG viewBox.
    const boxW=Math.min(330,Math.max(120,34 + title.length*7.1));
    const boxH=42;
    const placeLeft=cx+boxW+24>985;
    const boxX=placeLeft ? Math.max(12,cx-boxW-17) : Math.min(985-boxW,cx+17);
    const boxY=Math.max(12,Math.min(560,cy-boxH/2));
    const textX=boxX+11;
    const titleY=boxY+17;
    const metaY=boxY+31;

    const ns='http://www.w3.org/2000/svg';
    const g=document.createElementNS(ns,'g');
    g.setAttribute('id','atlasSelectedLabel');
    g.setAttribute('class','atlas-selected-label');
    g.setAttribute('pointer-events','none');

    const line=document.createElementNS(ns,'line');
    line.setAttribute('x1',String(cx));
    line.setAttribute('y1',String(cy));
    line.setAttribute('x2',String(placeLeft ? boxX+boxW : boxX));
    line.setAttribute('y2',String(boxY+boxH/2));
    line.setAttribute('class','atlas-selected-leader');

    const rect=document.createElementNS(ns,'rect');
    rect.setAttribute('x',String(boxX));
    rect.setAttribute('y',String(boxY));
    rect.setAttribute('width',String(boxW));
    rect.setAttribute('height',String(boxH));
    rect.setAttribute('rx','5');
    rect.setAttribute('class','atlas-selected-label-bg');

    const titleText=document.createElementNS(ns,'text');
    titleText.setAttribute('x',String(textX));
    titleText.setAttribute('y',String(titleY));
    titleText.setAttribute('class','atlas-selected-title');
    titleText.textContent=title.length>38 ? title.slice(0,36)+'…' : title;

    const meta=document.createElementNS(ns,'text');
    meta.setAttribute('x',String(textX));
    meta.setAttribute('y',String(metaY));
    meta.setAttribute('class','atlas-selected-meta');
    meta.textContent=`${movie.year||'—'} // CLICKED SPECIMEN`;

    g.append(line,rect,titleText,meta);
    svg.appendChild(g);
    node.classList.add('is-selected');
  }

  function randomizeAtlasNodes() {
    atlasShuffleSeed = Math.floor(Math.random() * 1000000000);
    const detail=$('#atlasDetail');
    const svg=$('#atlasSvg');
    if(detail) detail.textContent='Fresh specimen constellation generated. Select a node to inspect it.';
    drawAtlas();
    if(svg){
      svg.classList.remove('atlas-refresh');
      void svg.getBoundingClientRect();
      svg.classList.add('atlas-refresh');
      setTimeout(()=>svg.classList.remove('atlas-refresh'),650);
    }
    log('GENOME ATLAS RANDOMIZED');
  }

  function inspectAtlasNode(id, xKey, yKey) {
    const m = movieById(id); if(!m) return;
    const xl=DIMS.find(d=>d.key===xKey)?.label||xKey, yl=DIMS.find(d=>d.key===yKey)?.label||yKey;
    $('#atlasDetail').innerHTML = `
      <div class="atlas-detail-card">
        <div class="atlas-detail-copy">
          <span>SELECTED SPECIMEN</span>
          <strong>${esc(m.title)} <em>${m.year||'—'}</em></strong>
          <small>${esc(m.director||'UNKNOWN DIRECTOR')}</small>
        </div>
        <div class="atlas-detail-coordinates">
          <span><i>X // ${esc(xl.toUpperCase())}</i><b>${m.dna[xKey]}</b></span>
          <span><i>Y // ${esc(yl.toUpperCase())}</i><b>${m.dna[yKey]}</b></span>
        </div>
        <button class="table-action atlas-detail-scan" type="button" id="atlasScanBtn">SCAN SPECIMEN →</button>
      </div>`;
    window.CINEGENOME_ANOMALY?.atlas(m,xKey,yKey);
    $('#atlasScanBtn').addEventListener('click', () => { renderScanner(m.id); recordHomeAction('scan',[m]); switchView('scanner'); });
  }

  function allGenres(){ return [...new Set(MOVIES.flatMap(m=>m.genres))].sort(); }

  function renderArchive() {
    const host = $('#archiveCards');
    window.CINEGENOME_ARCHIVE.render(host,{
      favorites:[...new Set(state.favorites.map(Number))].map(id=>movieById(id)).filter(Boolean),
      experiments:state.archive,
      onScan:movie=>{switchView('scanner');renderScanner(movie.id);recordHomeAction('scan',[movie]);}
    });
  }

  function renderLogs() {
    const host = $('#systemLog'); if(!host) return;
    host.innerHTML = logs.map(l => `<div class="log-row"><span class="log-time">${esc(l.time)}</span><span>${esc(l.message)}</span></div>`).join('');
  }


  function localDateKey() {
    const d = new Date();
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function hash32(text) {
    let h = 2166136261;
    for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function top500SeedFor(dateKey, salt='primary') {
    const profile = state.favorites.slice().sort((a,b)=>a-b).join(',');
    if (TOP500_ITEMS.length) return TOP500_ITEMS[hash32(`${dateKey}|${salt}|${profile}`) % TOP500_ITEMS.length];
    if (TOP500.length) return { title:TOP500[hash32(`${dateKey}|${salt}|${profile}`) % TOP500.length], year:null };
    const m = MOVIES[hash32(`${dateKey}|${salt}|${profile}`) % Math.max(MOVIES.length,1)];
    return { title:m?.title || 'Unknown Specimen', year:m?.year || null };
  }

  function loadRxDay() {
    const date = localDateKey();
    try {
      const raw = JSON.parse(localStorage.getItem(RX_KEY) || 'null');
      if (raw && raw.date === date && Array.isArray(raw.draws)) return raw;
    } catch {}
    return { date, draws: [] };
  }

  function saveRxDay(day) {
    try { localStorage.setItem(RX_KEY, JSON.stringify(day)); } catch {}
    updateRxFabCounter();
  }

  function clearRitualTimers(){
    ritualTimers.forEach(id => { clearTimeout(id); clearInterval(id); });
    ritualTimers=[];
  }

  function setRxFabState(text='0/3') {
    const count=$('#rxFabCount'); if(count) count.textContent=text;
  }

  function updateRxFabCounter() {
    const day=loadRxDay();
    setRxFabState(`${Math.min(day.draws.length,3)}/3`);
  }

  function renderRxHistory(activeIndex=null) {
    const day=loadRxDay();
    const history=$('#rxHistory');
    const slots=$$('.rx-history-slot');
    const navigation=$('#rxFilmNavigation');
    if(navigation) {
      navigation.hidden=day.draws.length<2;
      $('#rxPrevious').disabled=activeIndex==null || activeIndex<=0;
      $('#rxNext').disabled=activeIndex==null || activeIndex>=day.draws.length-1;
    }
    if(!history || !slots.length) return;
    history.hidden = day.draws.length===0;
    slots.forEach((btn,i)=>{
      const draw=day.draws[i];
      btn.disabled=!draw;
      btn.classList.toggle('has-rx',!!draw);
      btn.classList.toggle('is-active',draw && i===activeIndex);
      const small=btn.querySelector('small');
      if(small) small.textContent=draw ? 'SAVED' : 'EMPTY';
      const role=RX_SPREAD[i];
      const roleNode=btn.querySelector('b');
      if(roleNode) roleNode.textContent=role?.label || `DOSE ${i+1}`;
      btn.title=draw ? `${role?.label || 'Dose'} — ${draw.title || 'Saved prescription'}${draw.year ? ` (${draw.year})` : ''}` : `${role?.label || 'Dose'} slot empty`;
    });
  }

  async function showSavedPrescription(index, replay=false) {
    const day=loadRxDay();
    const saved=day.draws[index];
    if(!saved) return;
    prescriptionStage=replay?1:2;
    let movie=saved.movieId ? movieById(saved.movieId) : MOVIES.find(m=>m.title===saved.title && (!saved.year || Number(m.year)===Number(saved.year))) || null;
    const rx={...saved,date:day.date,drawNo:index+1,movie};
    currentPrescription=rx;
    $('#rxScanStage').hidden=true;
    $('#rxLimitStage').hidden=true;
    const stage=$('#rxCardStage');
    stage.hidden=false;
    stage.classList.add('is-entering','history-swap');
    setPrescriptionCard(rx,replay?1:2);
    renderRxHistory(index);
    await ensurePrescriptionMetadata();
    if(currentPrescription===rx) setPrescriptionCard(rx,prescriptionStage);
    setTimeout(()=>stage.classList.remove('history-swap'),360);
  }

  function setPrescriptionCard(rx, stage=1) {
    currentPrescription = rx;
    prescriptionStage = stage;
    const movie = rx?.movie || (rx?.movieId ? movieById(rx.movieId) : MOVIES.find(m=>m.title===rx?.title && (!rx?.year || Number(m.year)===Number(rx.year)))) || null;
    if (movie) currentPrescription.movie = movie;
    const dna = movie?.dna;
    const top = dna ? dominantTraits(dna,1)[0] : null;
    const title = movie?.title || rx?.title || 'UNKNOWN';
    const poster = movie?.posterPath && TMDB ? TMDB.posterUrl(movie.posterPath,'w500') : '';
    const drawNo = Number(rx?.drawNo || 1);

    $('#rxTitle').textContent = title;
    $('#rxTrait').textContent = top ? `${top.label.toUpperCase()} ${top.value}%` : 'GENOME SIGNAL FOUND';
    $('#rxDate').textContent = new Date().toLocaleDateString([], {weekday:'short',year:'numeric',month:'short',day:'2-digit'}).toUpperCase();
    $('#rxSealCount').textContent = `DIAGNOSIS ${drawNo} / 3`;
    const card=$('#rxTarotCard');
    card.classList.toggle('is-revealed', stage >= 2);
    card.classList.remove('is-revealing');
    card.classList.toggle('show-poster', stage >= 2 && !!poster);
    const spreadRole=RX_SPREAD[Math.max(0,Math.min(2,drawNo-1))];
    $('#rxStatus').textContent = stage===1 ? `${spreadRole?.label || 'SEALED'} / SEALED` : `${spreadRole?.label || 'DOSE'} ${drawNo} / 3`;
    $('#rxCardHint').textContent = stage===1 ? 'SPECIMEN SEALED' : `${movie?.year||rx?.year||'—'} // ${movie?.director && movie.director!=='Metadata pending' ? movie.director : 'DIRECTOR SIGNAL PENDING'}`;
    $('#rxClickHint').textContent = stage===1 ? 'CLICK CARD TO REVEAL' : `PRESCRIPTION ${drawNo} OF 3`;
    const img=$('#rxPoster');
    if (poster) { img.src=poster; img.alt=`Poster for ${title}`; img.hidden=false; }
    else { img.hidden=true; img.removeAttribute('src'); }
    const year = movie?.year || rx?.year || '—';
    $('#rxYear').textContent = year;
    $('#rxDirector').textContent = [movie?.director && movie.director!=='Metadata pending' ? movie.director : null, movie?.runtime ? `${movie.runtime} MIN` : null].filter(Boolean).join(' / ') || 'METADATA PENDING';
    $('#rxGenres').textContent = (movie?.genres||[]).length ? movie.genres.join(' / ').toUpperCase() : 'GENRE SIGNAL PENDING';
    $('#rxOverview').textContent = movie?.overview || 'Synopsis signal unavailable. TMDB metadata has not been resolved yet.';
    renderDNAGrid($('#rxDNAGrid'), dna || {});
    const rxWatch=$('#rxWatchStrip');
    if(rxWatch){
      rxWatch.hidden=stage<2 || !movie;
      rxWatch.innerHTML=stage>=2 && movie ? watchConditions(movie).slice(0,3).map(x=>`<span>${esc(x.label)}</span>`).join('') : '';
    }
    $('#rxRevealActions').hidden = stage < 2;
    const nextDose=$('#rxNextDoseBtn');
    const usedDoses=loadRxDay().draws.length;
    nextDose.hidden=stage<2 || usedDoses>=3;
    if(!nextDose.hidden) nextDose.textContent=`NEXT DAILY DOSE // ${usedDoses+1} OF 3 ↗`;
    $('#rxSynopsis').hidden = true;
    $('#rxDNA').hidden = true;
    $('#rxSynopsisBtn').classList.remove('is-active');
    $('#rxDnaBtn').classList.remove('is-active');
    $('#rxCloseBtn').hidden = false;
    updateRxFabCounter();
    renderRxHistory(Math.max(0, drawNo-1));
  }

  async function ensurePrescriptionMetadata() {
    if (!currentPrescription) return null;
    const rx=currentPrescription;
    let movie=rx.movie || (rx.movieId?movieById(rx.movieId):MOVIES.find(m=>m.title===rx.title && (!rx.year || Number(m.year)===Number(rx.year))));
    if (movie && TMDB?.canQuery() && (!movie.posterPath || !movie.overview || !movie.tmdbId || !movie.director || !(movie.genres||[]).length)) {
      try { movie=await enrichLocalMovie(movie); }
      catch(err){ log(`RX TMDB LINK ERROR: ${err.message}`); }
    } else if (!movie && rx.title && TMDB?.canQuery()) {
      try { movie=await importTMDBTitle(rx.title,rx.year); }
      catch(err){ log(`RX TMDB RESOLUTION FAILED: ${err.message}`); }
    }
    if(currentPrescription!==rx)return null;
    if (movie) {
      rx.movie=movie;
      rx.movieId=movie.id;
      rx.year=movie.year || rx.year;
      rx.title=movie.title || rx.title;
      const day=loadRxDay();
      const idx=Number(rx.drawNo||1)-1;
      if(day.draws[idx]) {
        day.draws[idx]={...day.draws[idx],title:rx.title,year:rx.year,movieId:rx.movieId};
        saveRxDay(day);
      }
    }
    return movie;
  }

  function rxSeedForDraw(day, drawNo) {
    const used=new Set((day.draws||[]).map(x=>String(x.title||'').toLowerCase()));
    for(let attempt=0;attempt<20;attempt++) {
      const seed=top500SeedFor(day.date,`diagnosis-${drawNo}-${attempt}`);
      if(!used.has(String(seed.title||'').toLowerCase())) return seed;
    }
    return top500SeedFor(day.date,`diagnosis-${drawNo}-fallback`);
  }

  function ritualDelay(ms) {
    return new Promise(resolve=>{
      const id=setTimeout(resolve,ms); ritualTimers.push(id);
    });
  }

  async function hackerLine(container, text, index) {
    const row=document.createElement('span');
    row.className='rx-scan-line';
    const prefix=document.createElement('b'); prefix.textContent=`${String(index+1).padStart(2,'0')} //`;
    const body=document.createElement('i');
    row.append(prefix,body); container.appendChild(row);
    const glyph='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&?/<>[]{}';
    const frames=Math.max(8,Math.min(15,Math.round(text.length/4)));
    for(let tick=1;tick<=frames;tick++){
      if($('#rxFloat').hidden) return;
      const reveal=Math.floor(text.length*(tick/frames));
      let out=text.slice(0,reveal);
      for(let j=reveal;j<text.length;j++) out += text[j]===' ' ? ' ' : glyph[hash32(`${text}|${tick}|${j}`)%glyph.length];
      body.textContent=out;
      await ritualDelay(34);
    }
    body.textContent=text;
    await ritualDelay(105);
  }

  async function diagnoseToday() {
    clearRitualTimers();
    prescriptionStage=0;
    currentPrescription=null;
    $('#rxNextDoseBtn').hidden=true;
    $('#rxFloat .rx-float-body').scrollTop=0;
    $('#rxCloseBtn').hidden=false;
    $('#rxCardStage').classList.remove('is-entering');
    $('#rxCardStage').hidden=true;
    $('#rxLimitStage').hidden=true;
    $('#rxScanStage').hidden=false;
    $('#rxSynopsis').hidden=true;
    $('#rxDNA').hidden=true;
    const day=loadRxDay();
    const used=Math.min(day.draws.length,3);
    updateRxFabCounter();

    const isMemoryRecheck = used >= 3;
    const drawNo = isMemoryRecheck ? 3 : used + 1;
    $('#rxDrawCount').textContent = isMemoryRecheck ? 'DAILY DOSE MEMORY // 3 / 3' : `DIAGNOSIS ${drawNo} / 3`;
    const lines=$('#rxDiagnosticLines');
    lines.innerHTML='';
    const seedBase=hash32(`${HACK_SESSION_SEED}|${day.date}|${drawNo}|${isMemoryRecheck ? 'memory-recheck' : 'fresh-diagnosis'}`);
    const percentages=[
      34+(hash32(`${seedBase}|p0`)%63),
      28+(hash32(`${seedBase}|p1`)%69),
      41+(hash32(`${seedBase}|p2`)%57),
      19+(hash32(`${seedBase}|p3`)%78)
    ];
    const pick=(pool,slot)=>pool[hash32(`${HACK_SESSION_SEED}|${day.date}|${drawNo}|${slot}|${seedBase}`)%pool.length];

    const freshPools={
      link:[
        'SUBJECT LINK ESTABLISHED',
        'NEURAL CINEMA PORT OPEN',
        'SUBJECT PRESENCE CONFIRMED',
        'RETINAL HANDSHAKE ACCEPTED',
        'CORTEX INPUT CHANNEL UNLOCKED',
        'VIEWER SIGNATURE ACQUIRED',
        'PSYCHO-CINEMATIC BUS ONLINE',
        'SUBJECT ECHO LOCATED',
        'OPTIC NERVE RELAY STABLE',
        'PERSONALITY CACHE MOUNTED',
        'MEMORY INTERFACE RESPONDING',
        'SPECTATOR PROFILE IN RANGE'
      ],
      metric:[
        `RETINAL AFTERIMAGE DENSITY ${percentages[0]}%`,
        `NOSTALGIA RESIDUE ${percentages[0]}%`,
        `SILENCE TOLERANCE ${percentages[1]}%`,
        `BEAUTIFUL DAMAGE INDEX ${percentages[2]}%`,
        `EMOTIONAL LATENCY ${percentages[3]}%`,
        `UNFINISHED THOUGHT PRESSURE ${percentages[1]}%`,
        `MELANCHOLY CONDUCTIVITY ${percentages[2]}%`,
        `VISUAL FATIGUE RESISTANCE ${percentages[0]}%`,
        `MEMORY GRAIN SATURATION ${percentages[3]}%`,
        `CINEMATIC WITHDRAWAL LEVEL ${percentages[1]}%`,
        `DREAM RETENTION COEFFICIENT ${percentages[2]}%`,
        `AFFECTIVE NOISE FLOOR ${percentages[0]}%`
      ],
      anomaly:[
        `UNRESOLVED ENDING LOAD ${percentages[1]}%`,
        `REALITY DISTORTION ${percentages[2]}%`,
        `MEMORY TRACE DRIFT ${percentages[3]}%`,
        `IDENTITY BLEED ${percentages[0]}%`,
        `TEMPORAL DISPLACEMENT ${percentages[1]}%`,
        `PARASOCIAL STATIC ${percentages[3]}%`,
        `NARRATIVE INSTABILITY ${percentages[2]}%`,
        `DREAM-LOGIC LEAKAGE ${percentages[0]}%`,
        `EMOTIONAL COMPRESSION ${percentages[1]}%`,
        `SUBTEXT CONTAMINATION ${percentages[2]}%`,
        `PATTERN RECOGNITION FEVER ${percentages[3]}%`,
        `ARCHIVAL DEJA VU ${percentages[0]}%`
      ],
      filter:[
        'DREAM-LOGIC FILTER BYPASSED',
        'POPULARITY BIAS DISABLED',
        'SAFE CHOICES REMOVED FROM POOL',
        'COMFORT GENRE EXCLUSION ENABLED',
        'ALGORITHM POLITENESS DISABLED',
        'REWATCH BIAS PURGED',
        'MAINSTREAM GRAVITY REDUCED',
        'EXPECTED OUTCOMES QUARANTINED',
        'FAMILIARITY SAFEGUARD OFFLINE',
        'CRITICAL CONSENSUS MUTED',
        'GENRE COMFORT MASK REMOVED',
        'PREDICTABILITY BUFFER TERMINATED'
      ],
      search:[
        'CROSS-CHECKING 500 CINEMATIC SPECIMENS',
        'RUNNING GENOME COLLISION TEST',
        'SEARCHING FOR THE FILM YOU ARE AVOIDING',
        'COMPARING SUBJECT AGAINST SEALED ARCHIVE',
        'TRACING CLOSEST EMOTIONAL ORGANISM',
        'INTERROGATING 500 DORMANT SPECIMENS',
        'MAPPING AFFECTIVE SCARS TO FILM DNA',
        'SCANNING FOR UNAUTHORIZED RESONANCE',
        'CALCULATING CINEMATIC ANTIDOTE',
        'LOCATING HIGHEST-RISK COMPATIBILITY',
        'MATCHING MEMORY NOISE TO FILM GENOME',
        'SEQUENCING SUBJECT AGAINST ARCHIVE'
      ],
      prefinal:[
        'ARCHIVE GATES UNLOCKED',
        'GENOME LOCK CONFIRMED',
        'SUBJECT PROFILE COLLAPSED TO ONE MATCH',
        'CANDIDATE POOL REDUCED TO SINGLE ORGANISM',
        'ONE SPECIMEN REMAINS ACTIVE',
        'MATCH CONFIDENCE ABOVE SAFETY THRESHOLD',
        'ANOMALOUS RESONANCE CONFIRMED',
        'PRESCRIPTION CHANNEL ARMED',
        'FINAL SPECIMEN REMOVED FROM QUARANTINE',
        'CINEMATIC RESPONSE NOW IRREVERSIBLE'
      ],
      final:[
        'MATCH ISOLATED // DO NOT LOOK AWAY',
        'PRESCRIPTION FOUND // IDENTITY VERIFIED',
        'SPECIMEN LOCKED // REVEAL WHEN READY',
        'MATCH SEALED // SUBJECT CONSENT IRRELEVANT',
        'PRESCRIPTION AUTHORIZED // OPEN WHEN CALM',
        'SPECIMEN ACQUIRED // DO NOT REFRESH MEMORY',
        'FILM SELECTED // RESISTANCE NOTED',
        'MATCH COMPLETE // EYE CONTACT REQUIRED',
        'RX GENERATED // ARCHIVE IS WATCHING',
        'PRESCRIPTION SEALED // PROCEED QUIETLY',
        'SPECIMEN READY // DO NOT EXPECT COMFORT',
        'MATCH FOUND // MEMORY MAY CHANGE AFTER VIEWING'
      ]
    };

    const memoryPools={
      link:[
        'SUBJECT LINK RE-ESTABLISHED',
        'RETURNING SUBJECT DETECTED',
        'DAILY DOSE MEMORY REOPENED',
        'KNOWN VIEWER SIGNATURE CONFIRMED',
        'PRIOR DIAGNOSTIC SESSION RECOVERED',
        'DAILY SUBJECT CACHE RESTORED',
        'CINEMATIC MEMORY PORT RECONNECTED',
        'ARCHIVE RECOGNIZES THIS SUBJECT'
      ],
      quota:[
        'DAILY PRESCRIPTION QUOTA DETECTED // 03 OF 03',
        'THREE DAILY DOSES FOUND // NO FOURTH ENTRY',
        'DAILY DOSE LIMIT CONFIRMED // ARCHIVE LOCKED',
        'PRESCRIPTION CAPACITY SATURATED // 03/03',
        'NO UNUSED DIAGNOSTIC SLOTS REMAIN',
        'DAILY CINEMATIC DOSAGE COMPLETE'
      ],
      metric:[
        `MEMORY TRACE INTEGRITY ${percentages[0]}%`,
        `CINEMATIC RESIDUE ${percentages[2]}%`,
        `POST-DIAGNOSIS ECHO ${percentages[1]}%`,
        `ARCHIVE RECALL STABILITY ${percentages[3]}%`,
        `PRESCRIPTION AFTERIMAGE ${percentages[0]}%`,
        `VIEWER MEMORY RETENTION ${percentages[2]}%`
      ],
      restriction:[
        'NO NEW DOSE AUTHORIZED',
        'FOURTH PRESCRIPTION BLOCKED',
        'NEW SPECIMEN ACCESS DENIED',
        'DAILY DOSAGE LOCK REMAINS ACTIVE',
        'FRESH RX CHANNEL DISABLED',
        'ADDITIONAL MATCH REQUEST REJECTED'
      ],
      restore:[
        'RE-INDEXING SAVED SPECIMENS',
        'RECONSTRUCTING DAILY DOSE MEMORY',
        'MOUNTING THREE SEALED PRESCRIPTIONS',
        'RECOVERING PRIOR SPECIMEN STATES',
        'REASSEMBLING CINEMATIC MEMORY',
        'RESTORING SAVED MATCHES FROM CACHE'
      ],
      final:[
        'DAILY DOSE MEMORY UNSEALED // LAST MATCH RESTORED',
        'DAILY ARCHIVE OPEN // SELECT A SAVED DOSE',
        'MEMORY RESTORED // THREE PRESCRIPTIONS AVAILABLE',
        'RX HISTORY MOUNTED // NO NEW MATCH GENERATED',
        'SAVED SPECIMENS ONLINE // RECALL PERMITTED',
        'DAILY MEMORY OPEN // ARCHIVE AWAITS INPUT'
      ]
    };

    let steps;
    if(isMemoryRecheck){
      steps=[
        pick(memoryPools.link,'m-link'),
        pick(memoryPools.quota,'m-quota'),
        pick(memoryPools.metric,'m-metric-a'),
        pick(memoryPools.metric,'m-metric-b'),
        pick(memoryPools.restriction,'m-restrict'),
        pick(memoryPools.restore,'m-restore'),
        pick(memoryPools.final,'m-final')
      ];
      if(steps[2]===steps[3]) steps[3]=memoryPools.metric[(memoryPools.metric.indexOf(steps[3])+1)%memoryPools.metric.length];
    }else{
      steps=[
        pick(freshPools.link,'f-link'),
        pick(freshPools.metric,'f-metric'),
        pick(freshPools.anomaly,'f-anomaly'),
        pick(freshPools.filter,'f-filter'),
        pick(freshPools.search,'f-search'),
        pick(freshPools.prefinal,'f-prefinal'),
        pick(freshPools.final,'f-final')
      ];
    }
    await ritualDelay(180);
    for(let i=0;i<steps.length;i++){
      if($('#rxFloat').hidden) return;
      await hackerLine(lines,steps[i],i);
    }
    await ritualDelay(320);

    if(isMemoryRecheck){
      $('#rxScanStage').classList.add('is-leaving');
      await ritualDelay(280);
      $('#rxScanStage').hidden=true;
      $('#rxScanStage').classList.remove('is-leaving');
      $('#rxLimitStage').hidden=true;
      log('RX DAILY LIMIT REACHED // MEMORY RECHECK COMPLETE');
      await showSavedPrescription(2);
      $('#rxStatus').textContent='DAILY LIMIT 3/3';
      return;
    }

    const seed=rxSeedForDraw(day,drawNo);
    let movie=MOVIES.find(m=>m.title.toLowerCase()===String(seed.title).toLowerCase() && (!seed.year || Number(m.year)===Number(seed.year))) || null;
    const rx={date:day.date,drawNo,title:movie?.title||seed.title,year:movie?.year||seed.year||null,movieId:movie?.id||null,movie};
    currentPrescription=rx;
    day.draws.push({drawNo,title:rx.title,year:rx.year,movieId:rx.movieId});
    saveRxDay(day);

    $('#rxScanStage').classList.add('is-leaving');
    await ritualDelay(260);
    $('#rxScanStage').hidden=true;
    $('#rxScanStage').classList.remove('is-leaving');
    const cardStage=$('#rxCardStage');
    cardStage.classList.remove('is-entering');
    cardStage.hidden=false;
    setPrescriptionCard(rx,1);
    requestAnimationFrame(()=>requestAnimationFrame(()=>cardStage.classList.add('is-entering')));
    ensurePrescriptionMetadata().then(()=>{
      if(currentPrescription===rx && prescriptionStage===1) setPrescriptionCard(rx,1);
    }).catch(()=>{});
    log(`RX DIAGNOSIS ${drawNo}/3: ${String(rx.title).toUpperCase()}`);
  }

  function initPrescription() {
    clearRitualTimers();
    currentPrescription=null;
    prescriptionStage=0;
    $('#rxScanStage').classList.remove('is-leaving');
    $('#rxScanStage').hidden=false;
    $('#rxCardStage').classList.remove('is-entering');
    $('#rxCardStage').hidden=true;
    $('#rxNextDoseBtn').hidden=true;
    $('#rxLimitStage').hidden=true;
    $('#rxCloseBtn').hidden=false;
    updateRxFabCounter();
  }

  function togglePrescriptionPanel(force) {
    const panel=$('#rxFloat'), fab=$('#rxFab'), backdrop=$('#rxBackdrop'); if(!panel||!fab||!backdrop)return;
    const currentlyOpen = !panel.hidden && panel.classList.contains('is-visible');
    const open = typeof force==='boolean' ? force : !currentlyOpen;
    if(rxTransitionTimer){ clearTimeout(rxTransitionTimer); rxTransitionTimer=null; }
    fab.setAttribute('aria-expanded',open?'true':'false');
    document.body.classList.toggle('rx-open',open);
    if(open){
      clearRitualTimers();
      initPrescription();
      panel.hidden=false; backdrop.hidden=false;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        panel.classList.add('is-visible');
        backdrop.classList.add('is-visible');
      }));
      ritualDelay(460).then(()=>{
        if(!panel.hidden && panel.classList.contains('is-visible')) diagnoseToday();
      });
    } else {
      clearRitualTimers();
      panel.classList.remove('is-visible');
      backdrop.classList.remove('is-visible');
      rxTransitionTimer=setTimeout(()=>{
        panel.hidden=true; backdrop.hidden=true;
        initPrescription();
        rxTransitionTimer=null;
      },420);
    }
  }

  async function advancePrescriptionCard() {
    if(!currentPrescription || prescriptionStage>=2)return;
    const rx=currentPrescription;
    const card=$('#rxTarotCard');
    if(card.classList.contains('is-revealing'))return;
    card.classList.add('is-revealing');
    $('#rxClickHint').textContent='DECODING SPECIMEN…';
    await ensurePrescriptionMetadata();
    await ritualDelay(520);
    if(currentPrescription===rx && !$('#rxFloat').hidden) setPrescriptionCard(rx,2);
  }

  function generateDNAProfileFromTMDB(data) {
    return window.CINEGENOME_DNA_MODEL.profile(data);
  }

  function generateDNAFromTMDB(data) { return generateDNAProfileFromTMDB(data)?.dna||null; }

  function tmdbToMovie(data) {
    const director=(data.credits?.crew||[]).find(x=>x.job==='Director')?.name || 'Unknown';
    const genres=(data.genres||[]).map(x=>x.name).filter(Boolean);
    const tags=(data.keywords?.keywords||data.keywords?.results||[]).map(x=>x.name).filter(Boolean).slice(0,14);
    const profile=generateDNAProfileFromTMDB(data);
    return {
      id: 1000000 + Number(data.id), tmdbId:Number(data.id), title:data.title||data.original_title||'Unknown',
      year:Number(String(data.release_date||'').slice(0,4))||0, director,
      country:(data.production_countries||[]).map(x=>x.name).join(' / ')||'Unknown', genres:genres.length?genres:['Unclassified'], tags,
      overview:data.overview||'', posterPath:data.poster_path||'', backdropPath:data.backdrop_path||'', runtime:data.runtime||null,
      dna:profile?.dna||null,dnaSource:profile?.source||'unavailable',dnaConfidence:profile?.confidence??null,
      dnaModelVersion:profile?.modelVersion||null,dnaEvidence:profile?.dnaEvidence||null,metadataSource:'tmdb'
    };
  }

  function saveTMDBMovie(movie){
    try{
      const raw=JSON.parse(localStorage.getItem(TMDB_CACHE_KEY)||'[]');
      const rows=Array.isArray(raw)?raw:[];
      const key=movieKey(movie);
      const next=[movie,...rows.filter(x=>x.tmdbId!==movie.tmdbId && movieKey(x)!==key)].slice(0,600);
      localStorage.setItem(TMDB_CACHE_KEY,JSON.stringify(next));
    }catch{}
  }

  function loadTMDBMovieCache(){
    try{
      const rows=JSON.parse(localStorage.getItem(TMDB_CACHE_KEY)||'[]');
      if(!Array.isArray(rows))return;
      rows.forEach(cached=>{
        if(!cached) return;
        const existing=MOVIES.find(x => (cached.tmdbId && x.tmdbId && Number(x.tmdbId)===Number(cached.tmdbId)) || movieKey(x)===movieKey(cached));
        if(existing){
          if(existing.tmdbId && cached.tmdbId && Number(existing.tmdbId)!==Number(cached.tmdbId))return;
          const keepId=existing.id, keepCurated=existing.inCurated500;
          if(hasCompleteDNA(cached.dna)){
            const preserved=retainCurrentDNA(existing,cached)?{dna:existing.dna,dnaSource:existing.dnaSource,
              dnaConfidence:existing.dnaConfidence,dnaModelVersion:existing.dnaModelVersion,dnaEvidence:existing.dnaEvidence}:null;
            Object.assign(existing,cached,{id:keepId,inCurated500:keepCurated||cached.inCurated500},preserved);
          }
        } else if(cached.tmdbId && hasCompleteDNA(cached.dna)) MOVIES.push(cached);
      });
    }catch{}
  }

  function ensureMovieInSelects(movie){
    ['#scannerSelect','#parentA','#parentB','#mutationSeed'].forEach(sel=>{
      const s=$(sel); if(!s || [...s.options].some(o=>Number(o.value)===movie.id))return;
      const o=document.createElement('option');o.value=movie.id;o.textContent=`${movie.title} (${movie.year||'—'})`;s.appendChild(o);
    });
  }

  async function importTMDBTitle(title,year){
    if(!TMDB?.canQuery()) throw new Error('TMDB_NOT_CONNECTED');
    const data=await TMDB.resolveTitle(title,year);
    if(!data) throw new Error('TMDB_NO_MATCH');
    const existing=MOVIES.find(m=>m.tmdbId===Number(data.id)); if(existing)return existing;
    const movie=tmdbToMovie(data);
    if(!hasCompleteDNA(movie.dna))throw new Error('TMDB_DNA_EVIDENCE_INSUFFICIENT');
    MOVIES.push(movie); saveTMDBMovie(movie); ensureMovieInSelects(movie); return movie;
  }

  async function enrichLocalMovie(movie){
    if(!movie || !TMDB?.canQuery()) return movie;
    const data=await TMDB.resolveTitle(movie.title,movie.year||undefined,{strict:true}); if(!data)return movie;
    const matchYear=Number(String(data.release_date||'').slice(0,4));
    if(movie.inWatchOnce && matchYear && Math.abs(matchYear-Number(movie.year))>2)return movie;
    if(!movie.inWatchOnce && matchYear && movie.year && Math.abs(matchYear-Number(movie.year))>1)return movie;
    movie.tmdbId=Number(data.id);
    movie.overview=data.overview||movie.overview||'';
    movie.posterPath=data.poster_path||movie.posterPath||'';
    movie.backdropPath=data.backdrop_path||movie.backdropPath||'';
    movie.runtime=data.runtime||movie.runtime||null;
    movie.director=(data.credits?.crew||[]).find(x=>x.job==='Director')?.name||movie.director||'Unknown';
    movie.country=(data.production_countries||[]).map(x=>x.name).join(' / ')||movie.country||'Unknown';
    movie.genres=(data.genres||[]).map(x=>x.name).filter(Boolean);
    movie.tags=(data.keywords?.keywords||data.keywords?.results||[]).map(x=>x.name).filter(Boolean).slice(0,14);
    const profile=generateDNAProfileFromTMDB(data);
    if(profile){
      if(!['curated-starter-v1','editorial-researched-v1','legacy-curated-profile-v2'].includes(movie.dnaSource)){
        movie.dna=profile.dna;movie.dnaSource=profile.source;
        movie.dnaConfidence=profile.confidence;movie.dnaModelVersion=profile.modelVersion;
        movie.dnaEvidence=profile.dnaEvidence;
      }
      scannerStatsCache=null;
    }
    saveTMDBMovie({...movie});
    return movie;
  }

  function renderDossier(movie, message='') {
    if(!movie){ $('#movieDossier').innerHTML='<div class="dossier-loading">SPECIMEN NOT FOUND.</div>'; return; }
    const poster=movie.posterPath&&TMDB?TMDB.posterUrl(movie.posterPath,'w500'):'';
    const tags=[...(movie.genres||[]),...(movie.tags||[])].slice(0,12);
    const fp=directorFingerprint(movie);
    const conditions=watchConditions(movie);
    const relatives=nearest(movie.dna,[movie.id],3).map(x=>({movie:x.movie,score:x.score,rel:bloodlineRelation(movie,x.movie,x.score)}));
    $('#movieDossier').innerHTML=`<div class="dossier-grid"><div class="dossier-poster">${poster?`<img src="${esc(poster)}" alt="Poster for ${esc(movie.title)}">`:`<div class="poster-placeholder">POSTER SIGNAL UNAVAILABLE<br>${TMDB?.canQuery()?'NO IMAGE FOUND':'CONNECT TMDB'}</div>`}</div><div class="dossier-content"><div class="dossier-meta">${esc(movie.director||'Unknown')} / ${movie.year||'—'}${movie.runtime?` / ${movie.runtime} MIN`:''}</div><h2>${esc(movie.title)}</h2><div class="dossier-tags">${tags.map(t=>`<span class="tag">${esc(String(t).toUpperCase())}</span>`).join('')}</div><p class="dossier-overview">${esc(movie.overview||message||'Synopsis unavailable in the local archive. Connect TMDB to retrieve the film dossier.')}</p><div class="section-kicker">CINEGENOME DNA // ${esc(dnaProvenance(movie))}</div>${dnaTrace(movie)}<div class="dna-grid dossier-dna" id="dossierDNA"></div><div class="dossier-cinephile-grid"><section class="dossier-module"><div class="section-kicker">DIRECTOR FINGERPRINT</div><div id="dossierFingerprint"></div></section><section class="dossier-module"><div class="section-kicker">WATCH CONDITIONS</div><div class="dossier-watch">${conditions.map(x=>`<span class="watch-chip ${x.tone||''}">${esc(x.label)}</span>`).join('')}</div></section><section class="dossier-module"><div class="section-kicker">MODEL BLOODLINE</div>${relatives.map(r=>`<div class="diagnostic"><strong>${esc(r.rel.label)}</strong><span>${esc(r.movie.title)} / ${r.score}%</span></div>`).join('')}</section><section class="dossier-module"><div class="section-kicker">AFTERTASTE PREDICTION</div><p class="dossier-overview">${esc(dominantTraits(movie.dna,3).map(x=>x.label.toLowerCase()).join(' / '))}. Allow the film to settle before replacing it with another signal.</p></section></div></div></div>`;
    renderDNAGrid($('#dossierDNA'),movie.dna);
    renderDirectorFingerprint($('#dossierFingerprint'),movie);
  }

  async function openMovieDossier(movieOrTitle) {
    const dialog=$('#movieDialog'); if(!dialog)return;
    dialog.showModal(); $('#movieDossier').innerHTML='<div class="dossier-loading">READING ARCHIVE…</div>';
    let movie=typeof movieOrTitle==='string'?MOVIES.find(m=>m.title===movieOrTitle):movieOrTitle;
    const title=typeof movieOrTitle==='string'?movieOrTitle:movie?.title;
    try{
      if(!movie && title && TMDB?.canQuery()) movie=await importTMDBTitle(title);
      else if(movie && (!movie.overview||!movie.posterPath) && TMDB?.canQuery()) movie=await enrichLocalMovie(movie);
    }catch(err){ log(`DOSSIER LINK ERROR: ${err.message}`); }
    renderDossier(movie,'');
    if(!movie && title) $('#movieDossier').innerHTML=`<div class="dossier-loading">${esc(title)}<br><br>CONNECT TMDB TO LOAD POSTER + SYNOPSIS.</div>`;
  }

  async function updateTMDBState(test=false){
    const el=$('#tmdbState'); if(!el)return;
    if(!TMDB?.canQuery()){ el.textContent='TMDB PROXY NOT AVAILABLE'; return false; }
    if(!test){ el.textContent='TMDB PROXY CONFIGURED // PRESS TEST SERVER LINK'; return true; }
    el.textContent='TESTING SERVER LINK…';
    try{
      const ok=await TMDB.health();
      el.textContent=ok?'TMDB SERVER LINK ONLINE':'TMDB SERVER LINK RETURNED INVALID DATA';
      return ok;
    }catch(err){
      el.textContent=`TMDB LINK ERROR // ${err.status||err.message||'UNKNOWN'}`;
      return false;
    }
  }

  function setupTMDBSettings(){
    updateTMDBState(false);
    const btn=$('#tmdbSettingsBtn');
    const test=$('#testTmdbBtn');
    if(btn) btn.addEventListener('click',()=>{updateTMDBState(false);$('#tmdbDialog')?.showModal();});
    if(test) test.addEventListener('click',()=>updateTMDBState(true));
  }

  function filmprintFingerprintSvg(){
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

  function ensureFilmprintScanGate(){
    let gate=document.getElementById('filmprintScanGate');
    if(gate)return gate;
    gate=document.createElement('div');
    gate.id='filmprintScanGate';
    gate.className='filmprint-scan-gate';
    gate.setAttribute('aria-hidden','true');
    const axisCodes=['RLT','SOL','ROM','NOS','INT','PAC','VIS','CMP','DRK','HMR','DRM','ACT','HOR','WRM','ITM'];
    gate.innerHTML=`
      <div class="fp-entry-flash" aria-hidden="true"></div>
      <div class="fp-scan-terminal">
        <div class="fp-scan-kicker">CINEGENOME // SUBJECT PRINT ACQUISITION</div>
        <div class="fp-assay-rig" aria-hidden="true">
          <div class="fp-rig-side fp-rig-left"><span>PORT // 09</span><span>RIDGE MAP</span><span>NO BIOMETRIC DATA</span></div>
          <div class="fp-scan-core">
            <div class="fp-orbit fp-orbit-a"></div>
            <div class="fp-orbit fp-orbit-b"></div>
            <div class="fp-reticle"><i></i><i></i><i></i><i></i></div>
            <div class="fp-sensor">
              <div class="fp-sensor-grid"></div>
              ${filmprintFingerprintSvg()}
              <div class="fp-scan-sweep"></div>
              <div class="fp-lock-mark"><b>+</b><span>PRINT<br>LOCKED</span></div>
            </div>
          </div>
          <div class="fp-rig-side fp-rig-right"><span>30 SIGNALS</span><span>15 AXES</span><span>LOCAL ASSAY</span></div>
        </div>
        <div class="fp-scan-title" data-fp-entry-title>FILMPRINT ACCESS</div>
        <div class="fp-scan-copy" data-fp-entry-copy>CALIBRATING RIDGE FIELD…</div>
        <div class="fp-axis-strip" aria-hidden="true">${axisCodes.map((code,i)=>`<span style="--i:${i}"><i></i><b>${code}</b></span>`).join('')}</div>
        <div class="fp-scan-meter"><i data-fp-entry-meter></i></div>
        <div class="fp-scan-readouts"><span>SUBJECT // PRESENT</span><span>PRINT // UNRESOLVED</span><span>ASSAY // STANDBY</span></div>
      </div>`;
    document.body.appendChild(gate);
    return gate;
  }

  function playFilmprintEntryScan(){
    const gate=ensureFilmprintScanGate();
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const copy=gate.querySelector('[data-fp-entry-copy]');
    const title=gate.querySelector('[data-fp-entry-title]');
    const meter=gate.querySelector('[data-fp-entry-meter]');
    const cells=[...gate.querySelectorAll('.fp-scan-readouts span')];
    const phases=['phase-reading','phase-mapping','phase-lock','is-release'];
    phases.forEach(c=>gate.classList.remove(c));
    gate.classList.add('is-active');
    gate.setAttribute('aria-hidden','false');
    if(title) title.textContent='FILMPRINT ACCESS';
    if(copy) copy.textContent='CALIBRATING RIDGE FIELD…';
    if(meter) meter.style.width='5%';
    cells.forEach(x=>x.classList.remove('is-on'));
    cells[0]?.classList.add('is-on');
    const end=()=>{
      gate.classList.remove('is-active','phase-reading','phase-mapping','phase-lock','is-release');
      gate.setAttribute('aria-hidden','true');
    };
    if(reduced){
      if(title) title.textContent='PRINT LOCKED';
      if(copy) copy.textContent='FILMPRINT CHAMBER UNSEALED.';
      if(meter) meter.style.width='100%';
      cells.forEach(x=>x.classList.add('is-on'));
      gate.classList.add('phase-lock');
      setTimeout(end,320);
      return;
    }
    requestAnimationFrame(()=>gate.classList.add('phase-reading'));
    setTimeout(()=>{
      gate.classList.add('phase-mapping');
      if(copy) copy.textContent='TRACING SUBJECT CINEMA SIGNATURE…';
      if(meter) meter.style.width='44%';
      cells[1]?.classList.add('is-on');
    },500);
    setTimeout(()=>{
      if(copy) copy.textContent='MAPPING RIDGES TO 15 TASTE AXES…';
      if(meter) meter.style.width='76%';
    },1000);
    setTimeout(()=>{
      gate.classList.add('phase-lock');
      if(title) title.textContent='PRINT LOCKED';
      if(copy) copy.textContent='FILMPRINT CHAMBER UNSEALED.';
      if(meter) meter.style.width='100%';
      cells[2]?.classList.add('is-on');
    },1500);
    setTimeout(()=>gate.classList.add('is-release'),1960);
    setTimeout(end,2360);
  }

  const MODULE_ENTRY_CONFIG = {
    crossbreed:{
      index:'02',kicker:'RECOMBINATION PROTOCOL // BIOCHAMBER',
      stages:[
        [0,'PARENTS LOCKED','SPECIMEN A + B / INPUT VECTORS HELD',10],
        [520,'GENOME SPLICE','12 AXES / DOMINANCE WEIGHTS ALIGNING',38],
        [1040,'TRAIT MERGE','INHERITED + HYBRID SIGNALS RESOLVING',70],
        [1560,'HYBRID READY','RESULTANT ORGANISM CHANNEL OPEN',100]
      ],duration:1970
    },
    mutation:{
      index:'03',kicker:'CONTROLLED DEVIATION // CHAMBER',
      stages:[
        [0,'SEED LOCKED','ORIGINAL CINEMATIC VECTOR HELD INTACT',10],
        [530,'CHAMBER UNSTABLE','TRAIT LIMITERS RELEASED',36],
        [1060,'TRAIT REWRITE','LIVE MUTATION VECTOR RECALCULATING',70],
        [1590,'MUTATION READY','DEVIATION SPACE OPEN / SEED PRESERVED',100]
      ],duration:2000
    },
    atlas:{
      index:'04',kicker:'COORDINATE FIELD // ARCHIVE MAP',
      stages:[
        [0,'ARCHIVE INDEX','EVIDENCED SPECIMENS ENTERING FIELD',11],
        [510,'AXIS PROJECTION','X / Y CINEMATIC COORDINATES ALIGNING',40],
        [1020,'NODE RESOLUTION','NEIGHBOR SIGNALS + OUTLIERS LOCATING',72],
        [1530,'ATLAS ONLINE','COORDINATE FIELD READY',100]
      ],duration:1940
    },
    bloodline:{
      index:'05',kicker:'KINSHIP ASSAY // LINEAGE MODEL',
      stages:[
        [0,'SOURCE LOCKED','CINEMATIC SIGNALS ISOLATED',11],
        [520,'KINSHIP PASS','DNA PROXIMITY + YEAR DISTANCE COMPARING',40],
        [1040,'LINEAGE TRACE','STRONG + WEAK RELATIVES DRAWING',72],
        [1560,'BLOODLINE READY','MODEL KINSHIP MAP RESOLVED',100]
      ],duration:1970
    },
    archive:{
      index:'06',kicker:'RETENTION VAULT // LOCAL RECORDS',
      stages:[
        [0,'VAULT HANDSHAKE','LOCAL BROWSER RECORDS MOUNTING',12],
        [515,'RECORD CHECK','SAVED SPECIMENS + EXPERIMENTS VERIFYING',41],
        [1030,'DOSSIER RESTORE','RETAINED LAB HISTORY RECONSTRUCTING',74],
        [1545,'ARCHIVE OPEN','LOCAL RECORD CHANNEL READY',100]
      ],duration:1960
    }
  };

  function moduleEntryHost(view){
    const target=document.querySelector(`[data-view-panel="${view}"]`);
    if(!target)return null;
    return target.querySelector(':scope > .two-col > .lab-panel:first-child > .panel-body')
      || target.querySelector(':scope > .lab-panel > .panel-body')
      || target.querySelector('.lab-panel .panel-body');
  }

  function clearModuleEntryHosts(){
    $$('.module-entry-host').forEach(host=>host.classList.remove('module-entry-host','is-entry-active'));
    $$('.module-entry-side-pending').forEach(panel=>panel.classList.remove('module-entry-side-pending'));
  }

  function stopModuleEntrySequence(){
    moduleEntryToken++;
    moduleEntryTimers.forEach(clearTimeout);moduleEntryTimers=[];
    const gate=$('#moduleEntrySequence');
    if(!gate)return;
    gate.classList.remove('is-active','is-leaving','is-stage-changing');
    gate.hidden=true;gate.setAttribute('aria-hidden','true');
    gate.dataset.stage='0';
    clearModuleEntryHosts();
    $$('.view[aria-busy="true"]').forEach(v=>v.removeAttribute('aria-busy'));
  }

  function setModuleEntryStage(gate,title,detail,progress,stage,index){
    const [,label,copy,pct]=stage;
    gate.dataset.stage=String(index);
    gate.classList.remove('is-stage-changing');
    void gate.offsetWidth;
    title.textContent=label;
    detail.textContent=copy;
    progress.style.width=`${pct}%`;
    gate.classList.add('is-stage-changing');
  }

  function playModuleEntrySequence(view){
    const cfg=MODULE_ENTRY_CONFIG[view],gate=$('#moduleEntrySequence');
    if(!cfg||!gate)return;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
      stopModuleEntrySequence();
      return;
    }
    const title=$('#moduleEntryTitle'),detail=$('#moduleEntryDetail'),progress=$('#moduleEntryProgress'),kicker=$('#moduleEntryKicker'),index=$('#moduleEntryIndex');
    if(!title||!detail||!progress||!kicker||!index)return;
    const target=document.querySelector(`[data-view-panel="${view}"]`);
    const host=moduleEntryHost(view);
    if(!target||!host)return;
    moduleEntryToken++;
    const token=moduleEntryToken;
    moduleEntryTimers.forEach(clearTimeout);moduleEntryTimers=[];
    clearModuleEntryHosts();
    $$('.view[aria-busy="true"]').forEach(v=>v.removeAttribute('aria-busy'));
    host.classList.add('module-entry-host','is-entry-active');
    const primaryPanel=host.closest('.lab-panel');
    const panelRow=primaryPanel?.parentElement;
    if(panelRow?.classList.contains('two-col')){
      [...panelRow.children].forEach(panel=>{
        if(panel!==primaryPanel && panel.classList?.contains('lab-panel')) panel.classList.add('module-entry-side-pending');
      });
    }
    host.appendChild(gate);
    target.setAttribute('aria-busy','true');
    gate.dataset.module=view;
    gate.dataset.stage='0';
    gate.hidden=false;gate.setAttribute('aria-hidden','false');
    gate.classList.remove('is-active','is-leaving','is-stage-changing');
    kicker.textContent=cfg.kicker;index.textContent=cfg.index;
    title.textContent=cfg.stages[0][1];detail.textContent=cfg.stages[0][2];progress.style.width='0%';
    // Restart from a calm, deterministic state even if the operator changes rooms rapidly.
    void gate.offsetWidth;
    requestAnimationFrame(()=>{if(token===moduleEntryToken)gate.classList.add('is-active')});
    cfg.stages.forEach((stage,stageIndex)=>{
      const delay=stage[0];
      moduleEntryTimers.push(setTimeout(()=>{
        if(token!==moduleEntryToken)return;
        setModuleEntryStage(gate,title,detail,progress,stage,stageIndex);
      },delay));
    });
    moduleEntryTimers.push(setTimeout(()=>{
      if(token!==moduleEntryToken)return;
      gate.classList.add('is-leaving');
      host.classList.remove('is-entry-active');
      moduleEntryTimers.push(setTimeout(()=>{
        if(token!==moduleEntryToken)return;
        gate.classList.remove('is-active','is-leaving','is-stage-changing');gate.hidden=true;gate.setAttribute('aria-hidden','true');
        host.classList.remove('module-entry-host');
        $$('.module-entry-side-pending').forEach(panel=>panel.classList.remove('module-entry-side-pending'));
        target.removeAttribute('aria-busy');
      },320));
    },cfg.duration));
  }

  const MODULE_AUTOFOCUS_VIEWS = new Set(['scanner','crossbreed','mutation','atlas','bloodline','archive','dna']);

  function focusModuleViewport(view) {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduced ? 'auto' : 'smooth';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(MODULE_AUTOFOCUS_VIEWS.has(view)){
        const target=document.querySelector(`[data-view-panel="${view}"]`);
        if(target){
          const top=Math.max(0,window.scrollY+target.getBoundingClientRect().top-6);
          window.scrollTo({top,behavior});
          return;
        }
      }
      window.scrollTo({top:0,behavior});
    }));
  }

  function switchView(view) {
    const previousView=document.querySelector('.view.is-active')?.dataset.viewPanel||'';
    const wasFilmprint=document.body.classList.contains('filmprint-mode');
    const filmprintMode=view==='dna';
    const homeMode=view==='home';
    // Cover the paper interface first, then swap the underlying theme. This prevents
    // a single white/black repaint before the fingerprint terminal becomes visible.
    if(filmprintMode && !wasFilmprint) playFilmprintEntryScan();
    document.body.classList.toggle('filmprint-mode',filmprintMode);
    document.body.classList.toggle('home-mode',homeMode);
    $$('.module-btn').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.viewPanel === view));
    if(view==='scanner') renderScanner(currentScannerId);
    if(view==='crossbreed') renderCrossbreed();
    if(view==='mutation') renderMutation();
    if(view==='atlas') drawAtlas();
    if(view==='bloodline') traceBloodline(Number($('#bloodlineSelect')?.value || currentScannerId));
    if(view==='archive') renderArchive();
    if(view!==previousView){
      if(MODULE_ENTRY_CONFIG[view]) playModuleEntrySequence(view);
      else stopModuleEntrySequence();
    }
    log(`MODULE OPENED: ${view.toUpperCase()}`);
    focusModuleViewport(view);
  }

  function init() {
    // Mount the FILMPRINT cover during boot so the first click never pays a DOM-create frame.
    ensureFilmprintScanGate();
    $('#mobileReturnLink')?.addEventListener('click',()=>{
      try{sessionStorage.removeItem('cinegenome_force_desktop')}catch{}
    });
    initBootScreen();
    loadTMDBMovieCache();
    if(!MOVIES.length || !DIMS.length){
      document.body.innerHTML='<pre style="padding:20px">CINEGENOME DATABASE FAILED TO LOAD.</pre>'; return;
    }
    $('#datasetVersion').textContent = VERSION.toUpperCase();
    $('#contaminationReadout').textContent = `${(1.2 + MOVIES.length/40).toFixed(1).padStart(4,'0')}%`;

    fillMovieSelect($('#scannerSelect'));
    $('#scannerSelect').value = String(MOVIES[0].id);
    setupMovieSearch({
      inputId:'parentASearch', hiddenId:'parentA', resultsId:'parentASuggestions',
      initialMovie:MOVIES[0], onSelect:()=>renderCrossbreed()
    });
    setupMovieSearch({
      inputId:'parentBSearch', hiddenId:'parentB', resultsId:'parentBSuggestions',
      initialMovie:MOVIES[1]||MOVIES[0], onSelect:()=>renderCrossbreed()
    });
    setupMovieSearch({
      inputId:'mutationSeedSearch', hiddenId:'mutationSeed', resultsId:'mutationSeedSuggestions',
      initialMovie:MOVIES[2]||MOVIES[0],
      onSelect:(movie)=>{
        mutationSeedNonce++;
        mutationPass=0;
        updateMutationSeedReadout(movie);
        loadMutationSeed();
      }
    });
    setupMovieSearch({
      inputId:'bloodlineSearch', hiddenId:'bloodlineSelect', resultsId:'bloodlineSuggestions',
      initialMovie:MOVIES[0], onSelect:(movie)=>traceBloodline(movie.id)
    });
    setupMovieSearch({
      inputId:'compareBSearch', hiddenId:'compareB', resultsId:'compareBSuggestions',
      initialMovie:MOVIES[1]||MOVIES[0], onSelect:()=>renderScannerComparison()
    });
    setupMovieSearch({
      inputId:'compareCSearch', hiddenId:'compareC', resultsId:'compareCSuggestions',
      initialMovie:MOVIES[2]||MOVIES[1]||MOVIES[0], onSelect:()=>renderScannerComparison()
    });
    updateMutationSeedReadout(movieById($('#mutationSeed').value) || MOVIES[0]);

    setupAtlasControls();
    mutationDNA=cloneDNA((movieById($('#mutationSeed').value)||MOVIES[0]).dna);
    buildMutationControls();
    // First paint is strictly local. Network enrichment begins only after the UI is visible.
    renderMutation({skipHydrate:true});
    renderScanner(MOVIES[0].id,{skipTMDB:true,silent:true});
    renderCrossbreed({skipHydrate:true});
    renderArchive();
    initPrescription();
    setupTMDBSettings();

    // Homepage is now the default entry. Scanner hydrates only after it is actually opened.
    setTimeout(()=>{
      if(!$('#view-scanner')?.classList.contains('is-active')) return;
      const movie=movieById(currentScannerId);
      if(movie) hydrateScannerFromTMDB(movie);
    },2100);

    $('#bootSkipBtn')?.addEventListener('click',dismissBootScreen);
    document.addEventListener('keydown',e=>{ if(e.key==='Escape' && !$('#bootScreen')?.hidden) dismissBootScreen(); });
    $('#humanRecordTrigger')?.addEventListener('click',openHumanRecord);
    $('#humanRecordClose')?.addEventListener('click',()=>$('#humanSpecimenDialog')?.close());
    $('#deadPickerSpin')?.addEventListener('click',spinDeadPicker);
    $('#deadPickerSfx')?.addEventListener('click',event=>{
      const sound=window.CINEGENOME_PICKER_SFX;
      sound?.setEnabled(!sound.isEnabled());
      const enabled=sound?.isEnabled()??false;
      event.currentTarget.textContent=`♪ ROULETTE SFX: ${enabled?'ON':'OFF'}`;
      event.currentTarget.setAttribute('aria-pressed',String(enabled));
    });
    $('#deadPickerOpen')?.addEventListener('click',()=>{ if(deadPickerSelection) openDeadDossier(deadPickerSelection); });
    $$('.tab-info-btn').forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      openModuleInfo(btn.dataset.moduleInfo);
    }));
    $('#moduleInfoClose')?.addEventListener('click',()=>$('#moduleInfoDialog')?.close());

    $$('.module-btn').forEach(btn => {
      btn.addEventListener('pointerenter', event => {
        if(!event.pointerType || event.pointerType==='mouse') playLabHoverSfx();
      });
      btn.addEventListener('pointerdown', () => {
        if(!btn.classList.contains('is-active')) playLabMenuSfx(btn.dataset.view==='dna');
      });
      btn.addEventListener('keydown', event => {
        if((event.key==='Enter' || event.key===' ') && !btn.classList.contains('is-active')) playLabMenuSfx(btn.dataset.view==='dna');
      });
      btn.addEventListener('click', () => {
        switchView(btn.dataset.view);
      });
    });
    $$('[data-home-view]').forEach(btn=>{
      btn.addEventListener('pointerdown',()=>playLabMenuSfx(btn.dataset.homeView==='dna'));
      btn.addEventListener('click',()=>switchView(btn.dataset.homeView));
    });
    $$('[data-home-code]').forEach(btn=>btn.addEventListener('click',()=>$('#specimenCodeBtn')?.click()));
    syncLabSfxButton();
    $('#globalSfxToggle')?.addEventListener('click',()=>{
      labSfxEnabled=!labSfxEnabled;
      try{localStorage.setItem(LAB_SFX_KEY,labSfxEnabled?'on':'off')}catch{}
      syncLabSfxButton();
      window.dispatchEvent(new CustomEvent('cinegenome:sfx-change',{detail:{enabled:labSfxEnabled}}));
      if(labSfxEnabled) playLabMenuSfx(false);
    });
    window.CINEGENOME_UI_SFX={
      menu:playLabMenuSfx,
      action:playLabActionSfx,
      hover:playLabHoverSfx,
      enabled:()=>labSfxEnabled
    };
    $('#scannerSelect').addEventListener('change', e => {
      const film=movieById(e.currentTarget.value);
      if(film){renderScanner(film.id);recordHomeAction('scan',[film])}
    });
    $('#compareThirdToggle')?.addEventListener('click',e=>{
      scannerCompareThirdEnabled=!scannerCompareThirdEnabled;
      const slot=$('#compareCSlot');
      if(slot)slot.hidden=!scannerCompareThirdEnabled;
      e.currentTarget.setAttribute('aria-pressed',String(scannerCompareThirdEnabled));
      e.currentTarget.textContent=scannerCompareThirdEnabled?'− REMOVE THIRD':'+ THIRD SPECIMEN';
      ensureScannerCompareSelections(movieById(currentScannerId));
      renderScannerComparison();
      log(`SCANNER ${scannerCompareThirdEnabled?'TRIPLE':'PAIR'} CROSS-SCAN MODE`);
    });
    $('#scannerSearch').addEventListener('input', e => handleScannerSearch(e.currentTarget.value));
    $('#scannerSearch').addEventListener('keydown', e => { if(e.key==='Enter'){
      e.preventDefault();const film=handleScannerSearch(e.currentTarget.value,true);
      if(film)recordHomeAction('scan',[film]);
    } });
    $('#openDossierBtn').addEventListener('click', () => openMovieDossier(movieById(currentScannerId)));
    $('#rxFab').addEventListener('click',()=>togglePrescriptionPanel());
    $('#rxHeaderNote')?.addEventListener('click',()=>togglePrescriptionPanel(true));
    $('#rxCloseBtn').addEventListener('click',()=>togglePrescriptionPanel(false));
    $('#rxFloat').addEventListener('click',e=>e.stopPropagation());
    $('#rxBackdrop').addEventListener('click',()=>togglePrescriptionPanel(false));
    $$('.rx-history-slot').forEach(btn=>btn.addEventListener('click',()=>{ if(!btn.disabled) showSavedPrescription(Number(btn.dataset.rxSlot)); }));
    $('#rxPrevious').addEventListener('click',()=>{
      const index=Number(currentPrescription?.drawNo||1)-1;
      if(index>0)showSavedPrescription(index-1);
    });
    $('#rxNext').addEventListener('click',()=>{
      const index=Number(currentPrescription?.drawNo||1)-1;
      if(index+1<loadRxDay().draws.length)showSavedPrescription(index+1);
    });
    $('#rxTarotCard').addEventListener('click',advancePrescriptionCard);
    $('#rxNextDoseBtn').addEventListener('click',()=>{
      if(prescriptionStage===2 && loadRxDay().draws.length<3 && !$('#rxFloat').hidden) diagnoseToday();
    });
    $('#rxSynopsisBtn').addEventListener('click',async()=>{ await ensurePrescriptionMetadata(); setPrescriptionCard(currentPrescription,2); $('#rxSynopsis').hidden=false; $('#rxDNA').hidden=true; $('#rxSynopsisBtn').classList.add('is-active'); $('#rxDnaBtn').classList.remove('is-active'); });
    $('#rxDnaBtn').addEventListener('click',()=>{ setPrescriptionCard(currentPrescription,2); $('#rxDNA').hidden=false; $('#rxSynopsis').hidden=true; $('#rxDnaBtn').classList.add('is-active'); $('#rxSynopsisBtn').classList.remove('is-active'); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape' && !$('#rxFloat').hidden) togglePrescriptionPanel(false); });
    $('#favoriteBtn').addEventListener('click', () => {
      const id=currentScannerId; if(!id)return;
      if(state.favorites.includes(id)) state.favorites=state.favorites.filter(x=>x!==id); else state.favorites.push(id);
      persistState();
      const saved=state.favorites.includes(id);
      $('#favoriteBtn').setAttribute('aria-pressed',String(saved));
      $('#favoriteBtn').textContent=saved?'★ SAVED':'☆ SAVE';
      renderArchive();
      log(state.favorites.includes(id)?'SPECIMEN SAVED TO ARCHIVE':'SPECIMEN REMOVED FROM ARCHIVE');
    });

    ['#breedBtn','#saveMutationBtn','#traceBloodlineBtn'].forEach(selector=>{
      $(selector)?.addEventListener('pointerdown',playLabActionSfx);
    });

    $('#blendSlider').addEventListener('input', renderCrossbreed);
    $('#breedBtn').addEventListener('click', () => {
      const result=renderCrossbreed(); if(!result)return;
      window.CINEGENOME_ANOMALY?.crossbreed(result.a,result.b,result.ratioA);
      archiveExperiment('CROSSBREED', `${result.a.title} × ${result.b.title}`, `Dominance ${result.ratioA}/${100-result.ratioA}. Nearest viable specimen: ${result.best?.movie.title || 'none'} (${Number.isFinite(result.best?.score)?result.best.score+'%':'UNKNOWN'}).`, result.hybrid);
      recordHomeAction('crossbreed',[result.a,result.b]);
      log(`CROSSBREED COMPLETED: ${result.a.title.toUpperCase()} × ${result.b.title.toUpperCase()}`);
    });
    $('#swapParentsBtn').addEventListener('click', () => {
      const a=movieById($('#parentA').value), b=movieById($('#parentB').value);
      if(!a||!b)return;
      setMovieSearchSelection('parentASearch','parentA',b);
      setMovieSearchSelection('parentBSearch','parentB',a);
      renderCrossbreed();
    });
    $('#purgeBtn').addEventListener('click', purgeCrossbreed);

    $('#copySeedBtn').addEventListener('click',()=>loadMutationSeed());
    $('#reseedMutationBtn').addEventListener('click', randomizeMutationSeed);
    $('#randomMutationBtn').addEventListener('click', randomMutation);
    $('#saveMutationBtn').addEventListener('click', () => {
      const match=nearest(mutationDNA,[],1)[0];
      archiveExperiment('MUTATION', `Mutation → ${match?.movie.title || 'Unknown'}`, `Synthetic profile matched ${Number.isFinite(match?.score)?match.score+'%':'UNKNOWN'} with the nearest living specimen.`, mutationDNA);
      const seed=movieById($('#mutationSeed').value);
      if(seed)recordHomeAction('mutation',[seed]);
      log('MUTATION VECTOR SAVED TO ARCHIVE');
    });

    ['#axisX','#axisY'].forEach(s => $(s).addEventListener('change', drawAtlas));
    $('#atlasFind').addEventListener('input',drawAtlas);
    $('#atlasGenre').addEventListener('change', () => { atlasShuffleSeed = Math.floor(Math.random() * 1000000000); drawAtlas(); });
    $('#atlasLimit').addEventListener('input', drawAtlas);
    $('#randomAtlasBtn').addEventListener('click', randomizeAtlasNodes);
    $('#resetAtlasBtn').addEventListener('click', () => { $('#axisX').value='surrealism';$('#axisY').value='loneliness';$('#atlasGenre').value='';$('#atlasFind').value='';$('#atlasLimit').value='80';atlasShuffleSeed = Math.floor(Math.random() * 1000000000);drawAtlas(); });

    $('#traceBloodlineBtn').addEventListener('click',()=>traceBloodline(Number($('#bloodlineSelect').value)));
    $('#bloodlineRandomBtn').addEventListener('click',()=>{
      const rng=mulberry32(hash32(`${HACK_SESSION_SEED}|bloodline|${Date.now()}`));
      const m=MOVIES[Math.floor(rng()*MOVIES.length)]||MOVIES[0];
      setMovieSearchSelection('bloodlineSearch','bloodlineSelect',m); traceBloodline(m.id);
    });

    const brand=$('.brand-mark');
    if(brand) brand.addEventListener('click',()=>{
      switchView('home');
      secretTapCount++;
      brand.classList.remove('secret-armed');
      void brand.offsetWidth;
      brand.classList.add('secret-armed');
      setTimeout(()=>brand.classList.remove('secret-armed'),260);
      if(secretTapTimer) clearTimeout(secretTapTimer);
      secretTapTimer=setTimeout(()=>{secretTapCount=0;},2600);
      if(secretTapCount>=7){ secretTapCount=0; if(secretTapTimer)clearTimeout(secretTapTimer); openSecretArchive(); }
    });

    $('#secretCloseBtn')?.addEventListener('click',closeSecretArchiveSmooth);
    window.addEventListener('popstate',()=>{
      const dialog=$('#secretArchiveDialog');
      if(dialog?.open&&deadHistoryArmed){closeSecretArchiveSmooth({fromHistory:true});return}
      deadHistoryArmed=history.state?.cinegenomeOverlay==='weird-stuff';
    });
    $('#secretArchiveDialog')?.addEventListener('close',()=>{
      if(guestbookIncidentActive) closeGuestbookIncident({resumeAmbient:false});
      stopDeadAudio();
      document.body.classList.remove('dead-hijacking');
    });
    $('#deadSoundBtn')?.addEventListener('click',()=>setDeadSound(!deadSoundEnabled));
    $('#deadGuestbookBtn')?.addEventListener('click',triggerGuestbookIncident);
    $('#guestbookSurpriseVideo')?.addEventListener('ended',()=>closeGuestbookIncident());
    $('#guestbookSurpriseVideo')?.addEventListener('error',()=>closeGuestbookIncident());
    $('#guestbookJumpscare')?.addEventListener('cancel',e=>{
      e.preventDefault();
      closeGuestbookIncident();
    });
    $('#secretRefreshBtn')?.addEventListener('click',()=>{secretNonce++;renderSecretArchive();log(`DEAD CHANNEL RETUNED // ${deadChannelMode.toUpperCase()}`);});
    $('#deadDossierBack')?.addEventListener('click',()=>$('#deadDossierDialog')?.close());
    $('#deadDossierClose')?.addEventListener('click',()=>$('#deadDossierDialog')?.close());
    $('#deadDossierDialog')?.addEventListener('cancel',e=>{
      e.preventDefault();
      $('#deadDossierDialog')?.close();
    });
    $$('.dead-mode').forEach(btn=>btn.addEventListener('click',()=>{
      deadChannelMode=btn.dataset.deadMode||'cult';
      $$('.dead-mode').forEach(x=>x.classList.toggle('is-active',x===btn));
      secretNonce++; renderSecretArchive();
      log(`DEAD CHANNEL MODE: ${deadChannelMode.toUpperCase()}`);
    }));

    $('#specimenCodeBtn')?.addEventListener('click',()=>{
      $('#specimenCodeReadout').textContent='AWAITING CODE… // CASE ZERO: CG-000';
      $('#specimenCodeInput').value='';
      $('#specimenCodeDialog')?.showModal();
      setTimeout(()=>$('#specimenCodeInput')?.focus(),40);
    });
    $('#specimenCodeClose')?.addEventListener('click',()=>$('#specimenCodeDialog')?.close());
    $('#specimenCodeInput')?.addEventListener('keydown',e=>{
      if(e.key!==' ' || e.isComposing)return;
      e.preventDefault();
      const input=e.currentTarget;
      input.setRangeText('-',input.selectionStart,input.selectionEnd,'end');
    });
    $('#specimenCodeInput')?.addEventListener('input',e=>{
      const input=e.currentTarget;
      if(!/\s/.test(input.value))return;
      const cursor=input.selectionStart;
      const before=input.value.slice(0,cursor).replace(/\s/g,'-');
      input.value=input.value.replace(/\s/g,'-');
      input.setSelectionRange(before.length,before.length);
    });
    document.addEventListener('cinegenome:quarantine-film',async e=>{
      const specimen=deadChannelPool().find(x=>x.rank===Number(e.detail?.rank));
      if(!specimen)return;
      await openSecretArchive();
      if($('#secretArchiveDialog')?.open)openDeadDossier(specimen);
    });
    $('#specimenCodeForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const raw=String($('#specimenCodeInput').value||'').trim().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
      if(window.CINEGENOME_SPECIMEN_CODES?.run(raw,{close:()=>$('#specimenCodeDialog')?.close(),status:message=>{$('#specimenCodeReadout').textContent=message}}))return;
      if(raw==='CG000'){
        $('#specimenCodeReadout').textContent='ACCESS GRANTED // QUARANTINE FILE CG-000';
        $('#specimenCodeDialog')?.close();
        window.CINEGENOME_QUARANTINE?.open();
      }else if(raw==='DEAD300'){
        $('#specimenCodeReadout').textContent='ACCESS GRANTED // CHANNEL D-300';
        setTimeout(()=>{ $('#specimenCodeDialog')?.close(); openSecretArchive(); },220);
      }else if(raw===window.CINEGENOME_YUGEN?.ACCESS || raw==='CGYUGENREI09'){
        $('#specimenCodeReadout').textContent='KEY ACCEPTED // 幽玄回線 接続準備';
        $('#specimenCodeDialog')?.close();
        setTimeout(()=>window.CINEGENOME_YUGEN?.enter(),45);
      }else{
        $('#specimenCodeReadout').textContent='SPECIMEN DOES NOT EXIST. STOP LOOKING FOR IT.';
      }
    });

    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && guestbookIncidentActive){
        e.preventDefault();
        closeGuestbookIncident();
        return;
      }
      if(e.key==='Escape' && $('#deadDossierDialog')?.open){
        e.preventDefault();
        $('#deadDossierDialog').close();
        return;
      }
      if(e.key==='Escape' && $('#secretArchiveDialog')?.open){
        e.preventDefault();
        closeSecretArchiveSmooth();
        return;
      }
      if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if(e.key.length!==1) return;
      deadKeyboardBuffer=(deadKeyboardBuffer+e.key.toUpperCase()).replace(/[^A-Z0-9]/g,'').slice(-7);
      if(deadKeyboardBuffer.endsWith('DEAD300')){ deadKeyboardBuffer=''; openSecretArchive(); return; }
      if(deadKeyboardBuffer.endsWith('WHOAMI')){ deadKeyboardBuffer=''; openHumanRecord(); }
    });

    $('#clearArchiveBtn').addEventListener('click', () => { state={favorites:[],archive:[]};persistState();renderArchive();renderScanner(currentScannerId);log('EXPERIMENT ARCHIVE ERASED'); });

    switchView('home');
    log(`SEALED SPECIMEN POOL MOUNTED: ${MOVIES.length} GENOMES / ${DIMS.length} DNA DIMENSIONS`);
    log('GENOME ENGINE V4 ONLINE // GENRE + KEYWORD + SYNOPSIS EVIDENCE; PRIOR AXES DISCLOSED');
    log('DIRECTOR FINGERPRINT + MODEL BLOODLINE SYSTEMS ONLINE');
    log('SEARCHABLE SPECIMEN PICKERS ONLINE // CROSSBREED + MUTATION + BLOODLINE');
    log('DEAD CHANNEL Y2K MIRROR PRESENT // AUDIO PARASITE ARMED');
    log('GUESTBOOK INCIDENT TOP-LAYER PAYLOAD MOUNTED // guestbooksuprise.mp4');
    log('HUMAN SPECIMEN RECORD SEALED // COMMAND WHOAMI');
    log('DEAD CHANNEL RANDOM MOVIE PICKER 3000 ONLINE');
    log('GENOME ATLAS DENSE-NODE TITLE REVEAL ONLINE');
    log('TMDB SAFE SYNC ONLINE // MODULE-ON-DEMAND + 9s TIMEOUT');
    log('ENGLISH MODULE INFO + TOP-LAYER DEAD DOSSIER ONLINE');
    log('SCANNER LAZY TMDB POSTER LINK ONLINE');
    $('#eastereggNote')?.addEventListener('click',()=>log('LAB MEMO ACKNOWLEDGED // DO NOT PRESS CINEGENOME 7x'));
    log(`PRESCRIPTION POOL MOUNTED: ${TOP500.length || MOVIES.length} CURATED TITLES`);
    log('CINEGENOME LAB BOOT SEQUENCE COMPLETE');
  }

  try{
    init();
  }catch(err){
    console.error('[CINEGENOME INIT ERROR]',err);
    try{
      const boot=document.getElementById('bootScreen');
      if(boot){
        boot.classList.add('is-gone');
        setTimeout(()=>{boot.hidden=true;},120);
      }
    }catch{}
    const fallback=document.getElementById('systemLog');
    if(fallback){
      fallback.innerHTML=`<div class="log-line"><span>BOOT ERROR</span><b>${esc(err?.message||'UNKNOWN')}</b></div>`+fallback.innerHTML;
    }
  }
})();

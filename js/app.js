(() => {
  'use strict';

  const MOVIES = Array.isArray(window.CINEGENOME_MOVIES) ? window.CINEGENOME_MOVIES : [];
  const ENRICHED_TOP500 = Array.isArray(window.CINEGENOME_ENRICHED_TOP500) ? window.CINEGENOME_ENRICHED_TOP500 : [];
  const movieKey = (m) => `${String(m?.title||'').trim().toLowerCase()}|${Number(m?.year)||0}`;
  const mountedKeys = new Set(MOVIES.map(movieKey));
  ENRICHED_TOP500.forEach((m, i) => {
    if (!m || !m.dna) return;
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
    if(!m?.dna || mountedKeys.has(movieKey(m)))return;
    MOVIES.push({...m});mountedKeys.add(movieKey(m));
  });
  const DIMS = Array.isArray(window.CINEGENOME_DIMENSIONS) ? window.CINEGENOME_DIMENSIONS : [];
  const VERSION = window.CINEGENOME_DATA_VERSION || 'unknown';
  const DIM_KEYS = DIMS.map(d => d.key);
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
      description:'Reads one film as a 12-trait cinematic genome. CineGenome combines its local DNA model with resolved TMDB metadata such as poster, director, genres, runtime and synopsis.',
      simple:'Choose one film, inspect its cinematic DNA, then compare it with nearby specimens that share similar traits.',
      steps:['Search for or select a film specimen.','Inspect its DNA profile, poster, metadata and director fingerprint.','Open the dossier for the full synopsis and extended pathology report.']
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
  const deadMetadataCache = new Map();
  let deadPosterHydrationToken = 0;
  let deadPickerSelection = null;
  let deadPickerTimer = null;
  let bootDismissTimer = null;

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
    DIM_KEYS.forEach(k => out[k] = clamp(dna?.[k]));
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
    if (!a || !b || !DIM_KEYS.length) return 0;
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
      .filter(m => !excludeIds.includes(m.id))
      .map(movie => ({ movie, score: scoreSimilarity(dna, movie.dna) }))
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
        $('#bloodlineDetail').innerHTML=`<strong>${esc(m.title)} (${m.year||'—'})</strong> — ${esc(m.director||'Unknown')} · <button class="table-action" id="bloodlineScanBtn" type="button">SCAN SPECIMEN</button>`;
        $('#bloodlineScanBtn')?.addEventListener('click',()=>{renderScanner(m.id);switchView('scanner');});
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
      const data=await promiseTimeout(TMDB.resolveTitle(specimen.title,null),9000,'DEAD_TMDB_TIMEOUT');
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
        <div class="section-kicker spacing-top">ISOLATED GENOME // ENGINE V3</div>
        <div class="dna-grid dead-detail-dna" id="deadDnaGrid"></div>
        <p class="micro spacing-top">This resolved specimen remains off-catalog: opening it here does not add it to the normal 500-film pool.</p>
      </div>
    </div>`;
    renderDNAGrid($('#deadDnaGrid'),movie.dna);
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

  function startDeadAudio(){
    const audio=$('#deadChannelAudio');
    if(!audio || !deadSoundEnabled)return;
    clearDeadAudioTimer();
    try{
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

    // Trigger audio from the initiating user gesture before the transition delay.
    startDeadAudio();
    await runDeadTransition();

    dialog.classList.remove('is-leaving');
    dialog.showModal();
    // If autoplay was deferred by the browser, this second attempt follows the same user-triggered sequence.
    if(deadSoundEnabled) setTimeout(playDeadLaugh,350);
    log('DEAD CHANNEL MIRROR LOADED // NORMAL SITE SUSPENDED');
  }

  function closeSecretArchiveSmooth(){
    const dialog=$('#secretArchiveDialog');
    if(!dialog?.open)return;
    if(guestbookIncidentActive) closeGuestbookIncident({resumeAmbient:false});
    dialog.classList.add('is-leaving');
    stopDeadPicker();
    stopDeadAudio();
    setTimeout(()=>{
      dialog.close();
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
      const y = mid + wave * (.55 + .35 * Math.sin(t * Math.PI * 3 + dream)) + distortion + drift;
      const y2 = mid - wave * .58 + Math.sin(t*Math.PI*11 + seed) * visual * 15;
      p1 += `${x===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)} `;
      p2 += `${x===0?'M':'L'}${x.toFixed(1)},${y2.toFixed(1)} `;
    }
    DIMS.slice(0, 12).forEach((d, i) => {
      const x = 45 + i * 72;
      const v = clamp(dna[d.key]);
      const bh = 10 + v * .55;
      bars += `<rect x="${x}" y="${242-bh}" width="12" height="${bh}" fill="${v>88?'#d03728':'#b8ff35'}" opacity=".82"/><text x="${x+6}" y="258" text-anchor="middle" fill="#8e9887" font-size="7">${esc(d.label.slice(0,3).toUpperCase())}</text>`;
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
    if(!movie || !TMDB?.canQuery() || !isMetadataPending(movie)) return movie;
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
      // genres, runtime and Genome V3 DNA in addition to adding the poster.
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
    renderDNAGrid($('#scannerDNA'), movie.dna);
    $('#scannerDNASource').textContent=movie.dnaSource==='tmdb-genome-v3'
      ? `DNA MODEL // TMDB METADATA // CONFIDENCE ${Math.round(Number(movie.dnaConfidence||0)*100)}%`
      : `PRELIMINARY DNA // TMDB METADATA PENDING // CONFIDENCE ${Math.round(Number(movie.dnaConfidence||.38)*100)}%`;
    drawScope($('#scannerScope'), movie.dna, movie.id, `${movie.title.toUpperCase()} / GENOME READOUT`);
    renderRanks($('#similarList'), nearest(movie.dna, [movie.id], 5));
    renderDirectorFingerprint($('#directorFingerprint'), movie);
    renderWatchConditions($('#watchConditions'), movie);
    renderScannerPoster(movie,movie.posterPath?'ready':'idle');
    const isFav = state.favorites.includes(movie.id);
    $('#favoriteBtn').setAttribute('aria-pressed', isFav ? 'true' : 'false');
    $('#favoriteBtn').textContent = isFav ? '★ SAVED' : '☆ SAVE';
    window.CINEGENOME_ANOMALY?.scan(movie);
    if(!options.silent) log(`SCANNED SPECIMEN: ${movie.title.toUpperCase()}`);
    if(!options.skipTMDB) {
      // Delay one frame so the local scanner UI paints immediately before network work starts.
      requestAnimationFrame(()=>hydrateScannerFromTMDB(movie));
    }
  }

  function handleScannerSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const found = MOVIES.find(m => [m.title,m.director,m.country,...m.genres,...m.tags].join(' ').toLowerCase().includes(q));
    if (found) renderScanner(found.id);
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
    // A selected seed is automatically upgraded to Genome Engine V3 when TMDB
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
    const source = MOVIES.filter(m => !genre || m.genres.includes(genre));
    const ordered = source.slice().sort((a,b)=>hash32(`${atlasShuffleSeed}|${a.title}|${a.year}`)-hash32(`${atlasShuffleSeed}|${b.title}|${b.year}`));
    const rows = ordered.slice(0,Math.min(requested,ordered.length));
    $('#atlasCount').textContent = `${rows.length} / ${source.length} SPECIMENS`;
    if(rows.length>40 && $('#atlasDetail') && !$('#atlasDetail').querySelector('strong')){
      $('#atlasDetail').textContent='Dense constellation mode — labels are hidden. Click any node to reveal its film title.';
    }
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
    $('#atlasDetail').innerHTML = `<strong>${esc(m.title)} (${m.year})</strong> — ${esc(m.director)} · ${esc(xl)} ${m.dna[xKey]} · ${esc(yl)} ${m.dna[yKey]} · <button class="table-action" type="button" id="atlasScanBtn">SCAN SPECIMEN</button>`;
    window.CINEGENOME_ANOMALY?.atlas(m,xKey);
    $('#atlasScanBtn').addEventListener('click', () => { renderScanner(m.id); switchView('scanner'); });
  }

  function allGenres(){ return [...new Set(MOVIES.flatMap(m=>m.genres))].sort(); }

  function renderArchive() {
    const host = $('#archiveCards');
    const favoriteCards = state.favorites.map(id => movieById(id)).filter(Boolean).map(m => ({ type:'FAVORITE', title:m.title, detail:`${m.director} / ${m.year}`, id:`fav-${m.id}` }));
    const records = [...favoriteCards, ...state.archive];
    if(!records.length){ host.innerHTML='<div class="empty-state">NO SAVED SPECIMENS OR EXPERIMENTS.<br>THE ARCHIVE IS CLEAN.</div>'; return; }
    host.innerHTML = records.map(r => `<article class="archive-card"><div class="archive-card-head"><h3>${esc(r.title)}</h3><span class="archive-type">${esc(r.type)}</span></div><p>${esc(r.detail || '')}${r.at ? `<br>${esc(new Date(r.at).toLocaleString())}` : ''}</p></article>`).join('');
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

  async function showSavedPrescription(index) {
    const day=loadRxDay();
    const saved=day.draws[index];
    if(!saved) return;
    prescriptionStage=2;
    let movie=saved.movieId ? movieById(saved.movieId) : MOVIES.find(m=>m.title===saved.title && (!saved.year || Number(m.year)===Number(saved.year))) || null;
    const rx={...saved,date:day.date,drawNo:index+1,movie};
    currentPrescription=rx;
    $('#rxScanStage').hidden=true;
    $('#rxLimitStage').hidden=true;
    const stage=$('#rxCardStage');
    stage.hidden=false;
    stage.classList.add('is-entering','history-swap');
    setPrescriptionCard(rx,2);
    renderRxHistory(index);
    await ensurePrescriptionMetadata();
    if(currentPrescription===rx) setPrescriptionCard(rx,2);
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
    let movie=currentPrescription.movie || (currentPrescription.movieId?movieById(currentPrescription.movieId):MOVIES.find(m=>m.title===currentPrescription.title && (!currentPrescription.year || Number(m.year)===Number(currentPrescription.year))));
    if (movie && TMDB?.canQuery() && (!movie.posterPath || !movie.overview || !movie.tmdbId || !movie.director || !(movie.genres||[]).length)) {
      try { movie=await enrichLocalMovie(movie); }
      catch(err){ log(`RX TMDB LINK ERROR: ${err.message}`); }
    } else if (!movie && currentPrescription.title && TMDB?.canQuery()) {
      try { movie=await importTMDBTitle(currentPrescription.title,currentPrescription.year); }
      catch(err){ log(`RX TMDB RESOLUTION FAILED: ${err.message}`); }
    }
    if (movie) {
      currentPrescription.movie=movie;
      currentPrescription.movieId=movie.id;
      currentPrescription.year=movie.year || currentPrescription.year;
      currentPrescription.title=movie.title || currentPrescription.title;
      const day=loadRxDay();
      const idx=Number(currentPrescription.drawNo||1)-1;
      if(day.draws[idx]) {
        day.draws[idx]={...day.draws[idx],title:currentPrescription.title,year:currentPrescription.year,movieId:currentPrescription.movieId};
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
    $('#rxDrawCount').textContent = isMemoryRecheck ? 'DAILY RX MEMORY // 3 / 3' : `DIAGNOSIS ${drawNo} / 3`;
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
        'RX MEMORY CHANNEL REOPENED',
        'KNOWN VIEWER SIGNATURE CONFIRMED',
        'PRIOR DIAGNOSTIC SESSION RECOVERED',
        'DAILY SUBJECT CACHE RESTORED',
        'CINEMATIC MEMORY PORT RECONNECTED',
        'ARCHIVE RECOGNIZES THIS SUBJECT'
      ],
      quota:[
        'DAILY PRESCRIPTION QUOTA DETECTED // 03 OF 03',
        'THREE ACTIVE DOSES FOUND // NO FOURTH ENTRY',
        'DAILY RX LIMIT CONFIRMED // ARCHIVE LOCKED',
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
        'RECONSTRUCTING DAILY RX MEMORY',
        'MOUNTING THREE SEALED PRESCRIPTIONS',
        'RECOVERING PRIOR SPECIMEN STATES',
        'REASSEMBLING CINEMATIC MEMORY',
        'RESTORING SAVED MATCHES FROM CACHE'
      ],
      final:[
        'RX MEMORY UNSEALED // LAST MATCH RESTORED',
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
    const card=$('#rxTarotCard');
    card.classList.add('is-revealing');
    $('#rxClickHint').textContent='DECODING SPECIMEN…';
    await ensurePrescriptionMetadata();
    await ritualDelay(520);
    setPrescriptionCard(currentPrescription,2);
  }

  function generateDNAProfileFromTMDB(data) {
    return window.CINEGENOME_DNA_MODEL.profile(data);
  }

  function generateDNAFromTMDB(data) { return generateDNAProfileFromTMDB(data).dna; }

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
      dna:profile.dna, dnaSource:profile.source, dnaConfidence:profile.confidence, dnaModelVersion:'3.0'
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
          const keepId=existing.id, keepCurated=existing.inCurated500;
          Object.assign(existing,cached,{id:keepId,inCurated500:keepCurated||cached.inCurated500});
        } else if(cached.tmdbId && cached.dna) MOVIES.push(cached);
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
    const movie=tmdbToMovie(data); MOVIES.push(movie); saveTMDBMovie(movie); ensureMovieInSelects(movie); return movie;
  }

  async function enrichLocalMovie(movie){
    if(!movie || !TMDB?.canQuery()) return movie;
    const data=await TMDB.resolveTitle(movie.title,movie.year||undefined,{strict:!!movie.inWatchOnce}); if(!data)return movie;
    const matchYear=Number(String(data.release_date||'').slice(0,4));
    if(movie.inWatchOnce && matchYear && Math.abs(matchYear-Number(movie.year))>2)return movie;
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
    movie.dna=profile.dna;
    movie.dnaSource=profile.source;
    movie.dnaConfidence=profile.confidence;
    movie.dnaModelVersion='3.0';
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
    $('#movieDossier').innerHTML=`<div class="dossier-grid"><div class="dossier-poster">${poster?`<img src="${esc(poster)}" alt="Poster for ${esc(movie.title)}">`:`<div class="poster-placeholder">POSTER SIGNAL UNAVAILABLE<br>${TMDB?.canQuery()?'NO IMAGE FOUND':'CONNECT TMDB'}</div>`}</div><div class="dossier-content"><div class="dossier-meta">${esc(movie.director||'Unknown')} / ${movie.year||'—'}${movie.runtime?` / ${movie.runtime} MIN`:''}</div><h2>${esc(movie.title)}</h2><div class="dossier-tags">${tags.map(t=>`<span class="tag">${esc(String(t).toUpperCase())}</span>`).join('')}</div><p class="dossier-overview">${esc(movie.overview||message||'Synopsis unavailable in the local archive. Connect TMDB to retrieve the film dossier.')}</p><div class="section-kicker">CINEGENOME DNA // ${movie.dnaSource==='tmdb-genome-v3'?'METADATA MODEL':'PRELIMINARY · TMDB PENDING'}</div><div class="dna-grid dossier-dna" id="dossierDNA"></div><div class="dossier-cinephile-grid"><section class="dossier-module"><div class="section-kicker">DIRECTOR FINGERPRINT</div><div id="dossierFingerprint"></div></section><section class="dossier-module"><div class="section-kicker">WATCH CONDITIONS</div><div class="dossier-watch">${conditions.map(x=>`<span class="watch-chip ${x.tone||''}">${esc(x.label)}</span>`).join('')}</div></section><section class="dossier-module"><div class="section-kicker">MODEL BLOODLINE</div>${relatives.map(r=>`<div class="diagnostic"><strong>${esc(r.rel.label)}</strong><span>${esc(r.movie.title)} / ${r.score}%</span></div>`).join('')}</section><section class="dossier-module"><div class="section-kicker">AFTERTASTE PREDICTION</div><p class="dossier-overview">${esc(dominantTraits(movie.dna,3).map(x=>x.label.toLowerCase()).join(' / '))}. Allow the film to settle before replacing it with another signal.</p></section></div></div></div>`;
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

  function switchView(view) {
    $$('.module-btn').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.viewPanel === view));
    if(view==='scanner') renderScanner(currentScannerId);
    if(view==='crossbreed') renderCrossbreed();
    if(view==='mutation') renderMutation();
    if(view==='atlas') drawAtlas();
    if(view==='bloodline') traceBloodline(Number($('#bloodlineSelect')?.value || currentScannerId));
    if(view==='archive') renderArchive();
    log(`MODULE OPENED: ${view.toUpperCase()}`);
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function init() {
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
    updateMutationSeedReadout(movieById($('#mutationSeed').value) || MOVIES[0]);

    setupAtlasControls();
    mutationDNA=cloneDNA((movieById($('#mutationSeed').value)||MOVIES[0]).dna);
    buildMutationControls();
    // First paint is strictly local. Network enrichment begins only after the UI is visible.
    renderMutation({skipHydrate:true});
    renderScanner(MOVIES[0].id,{skipTMDB:true});
    renderCrossbreed({skipHydrate:true});
    renderArchive();
    initPrescription();
    setupTMDBSettings();

    // Hydrate only the visible scanner after startup. Other modules hydrate when opened.
    setTimeout(()=>{
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

    $$('.module-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    $('#scannerSelect').addEventListener('change', e => renderScanner(Number(e.currentTarget.value)));
    $('#scannerSearch').addEventListener('input', e => handleScannerSearch(e.currentTarget.value));
    $('#scannerSearch').addEventListener('keydown', e => { if(e.key==='Enter') handleScannerSearch(e.currentTarget.value); });
    $('#openDossierBtn').addEventListener('click', () => openMovieDossier(movieById(currentScannerId)));
    $('#rxFab').addEventListener('click',()=>togglePrescriptionPanel());
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
    $('#rxSynopsisBtn').addEventListener('click',async()=>{ await ensurePrescriptionMetadata(); setPrescriptionCard(currentPrescription,2); $('#rxSynopsis').hidden=false; $('#rxDNA').hidden=true; $('#rxSynopsisBtn').classList.add('is-active'); $('#rxDnaBtn').classList.remove('is-active'); });
    $('#rxDnaBtn').addEventListener('click',()=>{ setPrescriptionCard(currentPrescription,2); $('#rxDNA').hidden=false; $('#rxSynopsis').hidden=true; $('#rxDnaBtn').classList.add('is-active'); $('#rxSynopsisBtn').classList.remove('is-active'); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape' && !$('#rxFloat').hidden) togglePrescriptionPanel(false); });
    $('#favoriteBtn').addEventListener('click', () => {
      const id=currentScannerId; if(!id)return;
      if(state.favorites.includes(id)) state.favorites=state.favorites.filter(x=>x!==id); else state.favorites.push(id);
      persistState(); renderScanner(id); renderArchive();
      log(state.favorites.includes(id)?'SPECIMEN SAVED TO ARCHIVE':'SPECIMEN REMOVED FROM ARCHIVE');
    });

    $('#blendSlider').addEventListener('input', renderCrossbreed);
    $('#breedBtn').addEventListener('click', () => {
      const result=renderCrossbreed(); if(!result)return;
      window.CINEGENOME_ANOMALY?.crossbreed(result.a,result.b,result.ratioA);
      archiveExperiment('CROSSBREED', `${result.a.title} × ${result.b.title}`, `Dominance ${result.ratioA}/${100-result.ratioA}. Nearest viable specimen: ${result.best?.movie.title || 'none'} (${result.best?.score || 0}%).`, result.hybrid);
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
      archiveExperiment('MUTATION', `Mutation → ${match?.movie.title || 'Unknown'}`, `Synthetic profile matched ${match?.score || 0}% with the nearest living specimen.`, mutationDNA);
      log('MUTATION VECTOR SAVED TO ARCHIVE');
    });

    ['#axisX','#axisY'].forEach(s => $(s).addEventListener('change', drawAtlas));
    $('#atlasGenre').addEventListener('change', () => { atlasShuffleSeed = Math.floor(Math.random() * 1000000000); drawAtlas(); });
    $('#atlasLimit').addEventListener('input', drawAtlas);
    $('#randomAtlasBtn').addEventListener('click', randomizeAtlasNodes);
    $('#resetAtlasBtn').addEventListener('click', () => { $('#axisX').value='surrealism';$('#axisY').value='loneliness';$('#atlasGenre').value='';$('#atlasLimit').value='80';atlasShuffleSeed = Math.floor(Math.random() * 1000000000);drawAtlas(); });

    $('#traceBloodlineBtn').addEventListener('click',()=>traceBloodline(Number($('#bloodlineSelect').value)));
    $('#bloodlineRandomBtn').addEventListener('click',()=>{
      const rng=mulberry32(hash32(`${HACK_SESSION_SEED}|bloodline|${Date.now()}`));
      const m=MOVIES[Math.floor(rng()*MOVIES.length)]||MOVIES[0];
      setMovieSearchSelection('bloodlineSearch','bloodlineSelect',m); traceBloodline(m.id);
    });

    const brand=$('.brand-mark');
    if(brand) brand.addEventListener('click',()=>{
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
      $('#specimenCodeReadout').textContent='AWAITING CODE…';
      $('#specimenCodeInput').value='';
      $('#specimenCodeDialog')?.showModal();
      setTimeout(()=>$('#specimenCodeInput')?.focus(),40);
    });
    $('#specimenCodeClose')?.addEventListener('click',()=>$('#specimenCodeDialog')?.close());
    $('#specimenCodeForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const raw=String($('#specimenCodeInput').value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
      if(raw==='DEAD300'){
        $('#specimenCodeReadout').textContent='ACCESS GRANTED // CHANNEL D-300';
        setTimeout(()=>{ $('#specimenCodeDialog')?.close(); openSecretArchive(); },220);
      }else{
        $('#specimenCodeReadout').textContent='ACCESS DENIED // UNKNOWN SPECIMEN CODE';
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

    log(`SEALED SPECIMEN POOL MOUNTED: ${MOVIES.length} GENOMES / ${DIMS.length} DNA DIMENSIONS`);
    log('GENOME ENGINE V3 ONLINE // TMDB METADATA + GENRE + KEYWORDS + OVERVIEW + INTERACTION RULES');
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

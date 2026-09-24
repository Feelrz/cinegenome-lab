(() => {
  'use strict';

  const MOVIES = Array.isArray(window.CINEGENOME_MOVIES) ? window.CINEGENOME_MOVIES : [];
  const ENRICHED = Array.isArray(window.CINEGENOME_ENRICHED_TOP500) ? window.CINEGENOME_ENRICHED_TOP500 : [];
  const DEAD = Array.isArray(window.CINEGENOME_DEAD_CHANNEL) ? window.CINEGENOME_DEAD_CHANNEL : [];
  const TOP500 = Array.isArray(window.CINEGENOME_TOP500) ? window.CINEGENOME_TOP500 : [];
  const DIMS = Array.isArray(window.CINEGENOME_DIMENSIONS) ? window.CINEGENOME_DIMENSIONS : [];
  const TMDB = window.CINEGENOME_TMDB_SERVICE || null;
  const RX_KEY='cinegenome_daily_rx_v2';
  const STORAGE_KEY='cinegenome_lab_v1';
  const TMDB_CACHE_KEY='cinegenome_tmdb_movie_cache_v1';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const clamp=(n,min=0,max=100)=>Math.min(max,Math.max(min,Number(n)||0));
  const dims=()=>DIMS.map(d=>d.key);
  const movieKey=m=>`${String(m?.title||'').trim().toLowerCase()}|${Number(m?.year)||0}`;

  const mounted=new Set(MOVIES.map(movieKey));
  ENRICHED.forEach((m,i)=>{
    if(!m?.dna)return;
    const key=movieKey(m);
    if(mounted.has(key))return;
    MOVIES.push(Object.assign({id:2000000+Number(m.sourceId||i+1),country:'Unknown',genres:[],tags:[],inCurated500:true},m));
    mounted.add(key);
  });

  let current=MOVIES[0]||null;
  let parentA=MOVIES[0]||null,parentB=MOVIES[1]||MOVIES[0]||null;
  let mutationSeed=MOVIES[2]||MOVIES[0]||null;
  let mutationDNA=cloneDNA(mutationSeed?.dna||{});
  let atlasSeed=Math.floor(Math.random()*1e9);
  let atlasVisible=[],atlasSelected=null;
  let bloodlineSource=MOVIES[0]||null;
  let mobileBrandTapCount=0;
  let mobileBrandTapTimer=null;
  let rxRunToken=0;
  let deadMode='cult',deadRenderToken=0,deadPickerSelection=null,deadPickerTimer=null,deadDetailToken=0;
  let deadSoundEnabled=false,guestbookTimer=null,guestbookActive=false,toastTimer=null;
  let state=loadState();
  const metadataCache=new Map();
  const deadMetadataCache=new Map();

  const INFO={
    scanner:['SPECIMEN SCANNER','Reads one film as a 12-trait cinematic genome and resolves its poster, director, genres and synopsis through TMDB.',['Search for a film.','Inspect its DNA and nearby genomes.','Open the dossier for metadata and synopsis.']],
    crossbreed:['CROSSBREED REACTOR','Blends two film genomes into a synthetic hybrid and finds the closest real film in the archive.',['Choose Parent A and Parent B.','Adjust the blend ratio.','Run the reactor and inspect the nearest match.']],
    mutation:['MUTATION CHAMBER','Starts with one film genome and lets you manually alter cinematic traits.',['Choose a seed film.','Move DNA sliders.','Watch the nearest real-film match update.']],
    atlas:['GENOME ATLAS','A touch-friendly map where every circle is one film and its position comes from two selected DNA traits.',['Choose X and Y traits.','Adjust how many nodes are visible.','Tap a node to identify the film.']]
  };

  function hash32(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function cloneDNA(dna){const o={};dims().forEach(k=>o[k]=clamp(dna?.[k]));return o}
  function dnaDistance(a,b){let sum=0;dims().forEach(k=>sum+=(clamp(a?.[k])-clamp(b?.[k]))**2);return Math.sqrt(sum/Math.max(dims().length,1))}
  function nearest(dna,exclude=[],limit=5){const ex=new Set(exclude.map(Number));return MOVIES.filter(m=>m?.dna&&!ex.has(Number(m.id))).map(movie=>({movie,score:Math.max(0,Math.round(100-dnaDistance(dna,movie.dna)))})).sort((a,b)=>b.score-a.score).slice(0,limit)}
  function blendDNA(a,b,ratioA){const out={};dims().forEach(k=>out[k]=Math.round(clamp(a?.[k])*ratioA/100+clamp(b?.[k])*(100-ratioA)/100));return out}
  function localDate(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function loadState(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return{favorites:Array.isArray(x.favorites)?x.favorites:[],archive:Array.isArray(x.archive)?x.archive:[]}}catch{return{favorites:[],archive:[]}}}
  function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}}
  function toast(message){
    const el=$('#mToast');el.textContent=message;el.hidden=false;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3000);
  }
  function archiveExperiment(type,title,detail,dna){
    state.archive.unshift({id:Date.now(),type,title,detail,dna:cloneDNA(dna),at:new Date().toISOString()});
    state.archive=state.archive.slice(0,50);saveState();renderArchive();toast(`${type} SAVED TO ARCHIVE`);
  }
  function loadRxDay(){const date=localDate();try{const d=JSON.parse(localStorage.getItem(RX_KEY)||'null');if(d?.date===date&&Array.isArray(d.draws))return d}catch{}return{date,draws:[]}}
  function saveRxDay(d){try{localStorage.setItem(RX_KEY,JSON.stringify(d))}catch{}updateRxCount()}

  function hydrateFromCache(){
    try{
      const cache=JSON.parse(localStorage.getItem(TMDB_CACHE_KEY)||'{}');
      Object.values(cache).forEach(c=>{
        const m=MOVIES.find(x=>movieKey(x)===movieKey(c));
        if(m)Object.assign(m,c);
      });
    }catch{}
  }
  function saveMovieCache(movie){
    try{
      const cache=JSON.parse(localStorage.getItem(TMDB_CACHE_KEY)||'{}');
      cache[movieKey(movie)]={
        title:movie.title,year:movie.year,tmdbId:movie.tmdbId,director:movie.director,country:movie.country,
        genres:movie.genres,tags:movie.tags,overview:movie.overview,posterPath:movie.posterPath,runtime:movie.runtime
      };
      localStorage.setItem(TMDB_CACHE_KEY,JSON.stringify(cache));
    }catch{}
  }
  async function hydrate(movie){
    if(!movie||!TMDB?.canQuery())return movie;
    if(movie.tmdbId&&movie.posterPath&&movie.overview&&movie.director&&movie.director!=='Metadata pending')return movie;
    const key=movieKey(movie);
    if(metadataCache.has(key))return metadataCache.get(key);
    const p=(async()=>{
      try{
        const data=await TMDB.resolveTitle(movie.title,movie.year);
        if(!data)return movie;
        const director=(data.credits?.crew||[]).find(x=>x.job==='Director')?.name||movie.director||'Unknown';
        const countries=(data.production_countries||[]).map(x=>x.name);
        movie.tmdbId=data.id;
        movie.director=director;
        movie.country=countries.join(' / ')||movie.country||'Unknown';
        movie.genres=(data.genres||[]).map(x=>x.name);
        movie.tags=(data.keywords?.keywords||data.keywords?.results||[]).slice(0,12).map(x=>x.name);
        movie.overview=data.overview||movie.overview||'';
        movie.posterPath=data.poster_path||movie.posterPath||'';
        movie.runtime=data.runtime||movie.runtime||null;
        saveMovieCache(movie);
        return movie;
      }catch{return movie}
    })();
    metadataCache.set(key,p);
    return p;
  }

  function searchMovies(q,limit=8){
    const s=String(q||'').trim().toLowerCase();
    if(!s)return MOVIES.slice(0,limit);
    return MOVIES.map(m=>{
      const hay=[m.title,m.year,m.director,...(m.genres||[])].join(' ').toLowerCase();
      if(!hay.includes(s))return null;
      const title=String(m.title||'').toLowerCase();
      return{m,score:title===s?100:title.startsWith(s)?70:title.includes(s)?50:20};
    }).filter(Boolean).sort((a,b)=>b.score-a.score||a.m.title.localeCompare(b.m.title)).slice(0,limit).map(x=>x.m);
  }
  function setupSearch(input,host,onPick,initial){
    input.value=initial?`${initial.title} (${initial.year||'—'})`:'';
    const paint=()=>{
      const rows=searchMovies(input.value,8);
      host.innerHTML=rows.map(m=>`<button type="button" data-id="${m.id}"><b>${esc(m.title)}</b><small>${m.year||'—'} // ${esc(m.director||'Metadata pending')}</small></button>`).join('');
      host.hidden=false;
      $$('button',host).forEach(b=>b.onclick=()=>{const m=MOVIES.find(x=>Number(x.id)===Number(b.dataset.id));if(!m)return;input.value=`${m.title} (${m.year||'—'})`;host.hidden=true;onPick(m)});
    };
    input.addEventListener('focus',paint);
    input.addEventListener('input',paint);
    input.addEventListener('blur',()=>setTimeout(()=>host.hidden=true,120));
  }

  function renderDNA(host,dna){
    host.innerHTML=DIMS.map(d=>`<div class="m-dna-row"><span>${esc(d.label.toUpperCase())}</span><div class="m-dna-track"><div class="m-dna-fill" style="width:${clamp(dna?.[d.key])}%"></div></div><b>${clamp(dna?.[d.key])}</b></div>`).join('');
  }
  function renderNearest(host,dna,exclude=[]){
    host.innerHTML=nearest(dna,exclude,5).map(x=>`<button type="button" data-id="${x.movie.id}"><b>${esc(x.movie.title)}</b><strong>${x.score}%</strong><small>${x.movie.year||'—'} // ${esc(x.movie.director||'Metadata pending')}</small></button>`).join('');
    $$('button',host).forEach(b=>b.onclick=()=>{const m=MOVIES.find(x=>Number(x.id)===Number(b.dataset.id));if(m){current=m;switchView('scanner');renderScanner(m)}})
  }

  async function renderScanner(movie){
    current=movie||current;if(!current)return;
    $('#mScannerSearch').value=`${current.title} (${current.year||'—'})`;
    const saved=state.favorites.some(id=>Number(id)===Number(current.id));
    $('#mSaveBtn').textContent=saved?'SAVED':'SAVE';
    $('#mSaveBtn').setAttribute('aria-pressed',String(saved));
    $('#mScannerCode').textContent=`SPECIMEN #${String(current.sourceId||current.id).slice(-4).padStart(4,'0')}`;
    $('#mScannerTitle').textContent=current.title;
    window.CINEGENOME_ANOMALY?.scan(current);
    $('#mScannerMeta').textContent=`${current.director||'RESOLVING TMDB SIGNAL…'} / ${current.year||'—'}`;
    $('#mScannerTags').innerHTML=(current.genres||[]).slice(0,4).map(x=>`<span>${esc(x.toUpperCase())}</span>`).join('');
    $('#mDnaConfidence').textContent=`CONF ${Math.round((current.dnaConfidence||.38)*100)}%`;
    renderDNA($('#mScannerDNA'),current.dna);
    renderNearest($('#mScannerNearest'),current.dna,[current.id]);
    const poster=$('#mScannerPoster');
    if(current.posterPath&&TMDB)poster.innerHTML=`<img src="${esc(TMDB.posterUrl(current.posterPath,'w342'))}" alt="">`;
    else poster.innerHTML=`<span>${TMDB?.canQuery()?'SEARCHING TMDB<br>SIGNAL...':'POSTER SIGNAL<br>UNAVAILABLE'}</span>`;
    const token=current.id;
    await hydrate(current);
    if(current.id!==token)return;
    $('#mScannerMeta').textContent=`${current.director||'Unknown'} / ${current.year||'—'}${current.runtime?` / ${current.runtime} MIN`:''}`;
    $('#mScannerTags').innerHTML=(current.genres||[]).slice(0,4).map(x=>`<span>${esc(x.toUpperCase())}</span>`).join('');
    if(current.posterPath&&TMDB)poster.innerHTML=`<img src="${esc(TMDB.posterUrl(current.posterPath,'w342'))}" alt="Poster for ${esc(current.title)}">`;
    if(!current.posterPath)poster.innerHTML='<span>POSTER SIGNAL<br>UNAVAILABLE</span>';
    renderNearest($('#mScannerNearest'),current.dna,[current.id]);
  }

  function dominantTraits(dna,count=3){
    return DIMS.map(d=>({...d,value:clamp(dna?.[d.key])})).sort((a,b)=>b.value-a.value).slice(0,count);
  }
  function directorFingerprint(movie){
    const director=String(movie.director||'').trim();
    const known=director&&!['unknown','metadata pending'].includes(director.toLowerCase());
    const peers=known?MOVIES.filter(m=>String(m.director||'').trim().toLowerCase()===director.toLowerCase()&&m.dna):[];
    const specimens=peers.length?peers:[movie],dna={};
    dims().forEach(key=>dna[key]=Math.round(specimens.reduce((sum,m)=>sum+clamp(m.dna?.[key]),0)/specimens.length));
    return {director:known?director:'Unknown',count:specimens.length,dna};
  }
  function watchConditions(movie){
    const dna=movie?.dna;if(!dna)return [];
    const out=[],push=label=>{if(!out.includes(label))out.push(label)};
    if(clamp(dna.loneliness)>=74||clamp(dna.darkness)>=78)push('WATCH ALONE');
    if(clamp(dna.dreamLogic)>=72||clamp(dna.surrealism)>=76)push('AFTER MIDNIGHT');
    if(clamp(dna.narrativeComplexity)>=74||(movie.runtime||0)>=160)push('DO NOT WATCH TIRED');
    if(clamp(dna.visualExtremity)>=78)push('LOW LIGHT / FULL SCREEN');
    if(clamp(dna.pacing)<=38||(movie.runtime||0)>=150)push('NO SECOND SCREEN');
    if(clamp(dna.intensity)>=82)push('ALLOW A QUIET COMEDOWN');
    if(clamp(dna.nostalgia)>=80)push('BEST WITHOUT DISTRACTIONS');
    if(clamp(dna.humor)>=78&&clamp(dna.darkness)<55)push('GOOD WITH COMPANY');
    if(clamp(dna.romance)>=78&&clamp(dna.loneliness)>=65)push('DO NOT TEXT YOUR EX');
    if(!out.length)push('WATCH IN ONE SITTING');return out.slice(0,4);
  }
  function bloodlineRelation(source,target,score){
    const delta=(Number(target.year)||0)-(Number(source.year)||0);
    const top=new Set(dominantTraits(source.dna).map(x=>x.key));
    const overlap=dominantTraits(target.dna).filter(x=>top.has(x.key)).length;
    if(Math.abs(delta)<=2)return 'SPIRITUAL SIBLING';
    if(overlap<=1&&score>=78)return 'MUTATION';
    return delta<0?'ANCESTOR SIGNAL':'DESCENDANT SIGNAL';
  }
  async function openDossier(movie){
    const host=$('#mDossierContent'),dialog=$('#mDossierDialog');
    host.innerHTML='<p class="m-muted">Resolving TMDB dossier…</p>';
    dialog.showModal();await hydrate(movie);
    if(!dialog.open)return;
    const poster=movie.posterPath&&TMDB?TMDB.posterUrl(movie.posterPath,'w500'):'';
    const fp=directorFingerprint(movie),relatives=nearest(movie.dna,[movie.id],3);
    host.innerHTML=`<div class="m-dossier-grid"><div>${poster?`<img src="${esc(poster)}" alt="Poster for ${esc(movie.title)}">`:'<div class="m-poster">NO POSTER</div>'}</div><div><span class="m-kicker">SPECIMEN DOSSIER</span><h2>${esc(movie.title)}</h2><p class="m-muted">${esc(movie.director||'Unknown')} / ${movie.year||'—'}${movie.runtime?` / ${movie.runtime} MIN`:''}</p><div class="m-tags">${(movie.genres||[]).map(x=>`<span>${esc(x.toUpperCase())}</span>`).join('')}</div></div></div>
      <p class="m-overview">${esc(movie.overview||'Synopsis signal unavailable.')}</p>
      <div class="m-card"><div class="m-card-head"><span>CINEMATIC DNA</span></div><div class="m-dna" id="mDossierDNA"></div></div>
      <div class="m-card"><div class="m-card-head"><span>DIRECTOR FINGERPRINT</span></div><p class="m-muted">${esc(fp.director)} // ${fp.count>1?`${fp.count} SPECIMENS AVERAGED`:'SINGLE-SPECIMEN PROFILE'}</p><div class="m-dna" id="mFingerprintDNA"></div></div>
      <div class="m-card"><div class="m-card-head"><span>WATCH CONDITIONS</span></div><div class="m-watch-chips">${watchConditions(movie).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>
      <div class="m-card"><div class="m-card-head"><span>MODEL BLOODLINE</span></div><div class="m-list">${relatives.map(x=>`<div class="m-list-row"><b>${esc(x.movie.title)}</b><strong>${x.score}%</strong><small>${bloodlineRelation(movie,x.movie,x.score)} // MODEL INFERENCE</small></div>`).join('')}</div></div>
      <div class="m-card"><div class="m-card-head"><span>AFTERTASTE PREDICTION</span></div><p class="m-muted">${esc(dominantTraits(movie.dna).map(x=>x.label.toLowerCase()).join(' / '))}. Allow the film to settle before replacing it with another signal.</p></div>`;
    renderDNA($('#mDossierDNA'),movie.dna);
    $('#mFingerprintDNA').innerHTML=dominantTraits(fp.dna,4).map(d=>`<div class="m-dna-row"><span>${esc(d.label.toUpperCase())}</span><div class="m-dna-track"><div class="m-dna-fill" style="width:${d.value}%"></div></div><b>${d.value}</b></div>`).join('');
  }

  function renderCrossbreed(){
    const ratio=Number($('#mBlend').value),dna=blendDNA(parentA?.dna,parentB?.dna,ratio),best=nearest(dna,[parentA?.id,parentB?.id],1)[0];
    $('#mBlendA').textContent=`${ratio}%`;$('#mBlendB').textContent=`${100-ratio}%`;
    $('#mHybridTitle').textContent=best?.movie.title||'No viable match';
    $('#mHybridScore').textContent=best?`${best.score}%`:'—';
    $('#mHybridMeta').textContent=best?`${best.movie.year||'—'} // ${best.movie.director||'Metadata pending'}`:'';
    renderDNA($('#mHybridDNA'),dna);
    if(best)hydrate(best.movie).then(()=>{$('#mHybridMeta').textContent=`${best.movie.year||'—'} // ${best.movie.director||'Unknown'}`});
  }

  function renderMutationControls(){
    $('#mMutationControls').innerHTML=DIMS.map(d=>`<label class="m-field"><span>${esc(d.label)} <b id="mv-${d.key}">${mutationDNA[d.key]}</b></span><input data-dim="${d.key}" type="range" min="0" max="100" value="${mutationDNA[d.key]}"></label>`).join('');
    $$('input[data-dim]',$('#mMutationControls')).forEach(input=>input.oninput=()=>{mutationDNA[input.dataset.dim]=Number(input.value);$(`#mv-${input.dataset.dim}`).textContent=input.value;renderMutationMatch();window.CINEGENOME_ANOMALY?.mutation(mutationDNA)});
  }
  function renderMutationMatch(){
    const best=nearest(mutationDNA,[],1)[0];if(!best)return;
    $('#mMutationTitle').textContent=best.movie.title;$('#mMutationScore').textContent=`${best.score}%`;$('#mMutationMeta').textContent=`${best.movie.year||'—'} // ${best.movie.director||'Metadata pending'}`;
    hydrate(best.movie).then(()=>$('#mMutationMeta').textContent=`${best.movie.year||'—'} // ${best.movie.director||'Unknown'}`);
  }
  function setMutationSeed(movie){mutationSeed=movie;mutationDNA=cloneDNA(movie.dna);$('#mMutationSeed').value=`${movie.title} (${movie.year||'—'})`;$('#mMutationCode').textContent=`CGM-${hash32(movieKey(movie)).toString(16).toUpperCase().slice(0,8)}`;renderMutationControls();renderMutationMatch()}

  function fillAtlasSelects(){
    const opts=DIMS.map(d=>`<option value="${d.key}">${esc(d.label)}</option>`).join('');
    $('#mAtlasX').innerHTML=opts;$('#mAtlasY').innerHTML=opts;$('#mAtlasX').value='surrealism';$('#mAtlasY').value='loneliness';
  }
  function renderAtlas(){
    const svg=$('#mAtlasSvg'),xk=$('#mAtlasX').value,yk=$('#mAtlasY').value,limit=Number($('#mAtlasLimit').value);
    $('#mAtlasCount').textContent=limit;
    const r=rng(atlasSeed),source=MOVIES.filter(m=>m.dna).slice(),picked=[];
    while(source.length&&picked.length<limit)picked.push(source.splice(Math.floor(r()*source.length),1)[0]);
    atlasVisible=picked;atlasSelected=null;$('#mAtlasScan').hidden=true;
    $('#mAtlasDetail').textContent='Tap a node or use INSPECT RANDOM NODE to reveal a film.';
    svg.innerHTML=`<rect width="720" height="620" fill="#0c100c"/>${picked.map(m=>{
      const x=28+clamp(m.dna[xk])*6.55,y=592-clamp(m.dna[yk])*5.45;
      return `<g class="m-atlas-node" data-id="${m.id}" role="button" tabindex="0" aria-label="Inspect ${esc(m.title)}"><circle cx="${x}" cy="${y}" r="8" fill="#8ebf45" stroke="#dfff9d" stroke-width="1"/><circle cx="${x}" cy="${y}" r="22" fill="transparent"/></g>`;
    }).join('')}`;
    $$('.m-atlas-node',svg).forEach(g=>{
      const activate=()=>inspectAtlas(MOVIES.find(x=>Number(x.id)===Number(g.dataset.id)));
      g.onclick=activate;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}};
    });
  }
  function inspectAtlas(m){
    if(!m)return;atlasSelected=m;
    const xk=$('#mAtlasX').value,yk=$('#mAtlasY').value;
    const x=DIMS.find(d=>d.key===xk)?.label,y=DIMS.find(d=>d.key===yk)?.label;
    $('#mAtlasDetail').innerHTML=`<b>${esc(m.title)}</b><br>${m.year||'—'} // ${esc(x)} ${m.dna[xk]} // ${esc(y)} ${m.dna[yk]}`;
    window.CINEGENOME_ANOMALY?.atlas(m,xk);
    $('#mAtlasScan').hidden=false;
  }

  function renderBloodline(){
    if(!bloodlineSource)return;
    const rows=nearest(bloodlineSource.dna,[bloodlineSource.id],8);
    $('#mBloodlineList').innerHTML=rows.map(x=>`<button data-id="${x.movie.id}"><b>${esc(x.movie.title)}</b><strong>${x.score}%</strong><small>${x.movie.year||'—'} // ${bloodlineRelation(bloodlineSource,x.movie,x.score)} // MODEL INFERENCE</small></button>`).join('');
    $$('button',$('#mBloodlineList')).forEach(b=>b.onclick=()=>{const m=MOVIES.find(x=>Number(x.id)===Number(b.dataset.id));if(m){current=m;switchView('scanner');renderScanner(m)}})
  }
  function renderArchive(){
    const favorites=[...new Set(state.favorites.map(Number))].map(id=>MOVIES.find(x=>Number(x.id)===id)).filter(Boolean);
    const experiments=state.archive.filter(x=>x&&typeof x==='object');
    const rows=favorites.map(m=>`<button type="button" data-id="${m.id}"><b>${esc(m.title)}</b><small>${m.year||'—'} // SAVED SPECIMEN</small></button>`).join('')+
      experiments.map(x=>`<div class="m-list-row"><b>${esc(x.title||'UNNAMED EXPERIMENT')}</b><strong>${esc(x.type||'EXPERIMENT')}</strong><small>${esc(x.detail||'')}${x.at?`<br>${esc(new Date(x.at).toLocaleDateString())}`:''}</small></div>`).join('');
    $('#mArchiveList').innerHTML=rows||'<div class="m-list-row"><b>Archive empty.</b><small>Save specimens and experiments to see them here.</small></div>';
    $$('button',$('#mArchiveList')).forEach(b=>b.onclick=()=>{
      const m=MOVIES.find(x=>Number(x.id)===Number(b.dataset.id));
      if(m){current=m;switchView('scanner');renderScanner(m)}
    });
  }

  function switchView(name){
    $$('.m-view').forEach(v=>v.classList.toggle('is-active',v.dataset.view===name));
    $$('.m-bottom-nav button').forEach(b=>b.classList.toggle('is-active',b.dataset.target===name));
    scrollTo({top:0,behavior:'smooth'});
    if(name==='atlas')renderAtlas();
    if(name==='more')renderArchive();
  }

  function updateRxCount(){
    const day=loadRxDay();$('#mRxCount').textContent=`${Math.min(day.draws.length,3)}/3`;
  }
  const rxRoles=['WOUND','MIRROR','ANTIDOTE'];
  function rxSeedForDraw(day,drawNo){
    const profile=state.favorites.slice().sort((a,b)=>Number(a)-Number(b)).join(',');
    const used=new Set(day.draws.map(x=>String(x.title||'').toLowerCase()));
    const pool=TOP500.length?TOP500:MOVIES;
    for(let attempt=0;attempt<20;attempt++){
      const seed=pool[hash32(`${day.date}|diagnosis-${drawNo}-${attempt}|${profile}`)%pool.length];
      if(!used.has(String(seed.title).toLowerCase()))return seed;
    }
    return pool[hash32(`${day.date}|diagnosis-${drawNo}-fallback|${profile}`)%pool.length];
  }
  function renderRxHistory(){
    const d=loadRxDay();
    $('#mRxHistory').innerHTML=[0,1,2].map(i=>`<button class="${d.draws[i]?'has':''}" data-i="${i}" ${d.draws[i]?'':'disabled'}>${String(i+1).padStart(2,'0')}<br>${rxRoles[i]}<br>${d.draws[i]?'SAVED':'EMPTY'}</button>`).join('');
    $$('button',$('#mRxHistory')).forEach(b=>b.onclick=()=>{rxRunToken++;showRxSaved(Number(b.dataset.i))});
  }
  async function rxMovieFromDraw(draw){
    let m=draw.movieId?MOVIES.find(x=>Number(x.id)===Number(draw.movieId)):null;
    if(!m)m=MOVIES.find(x=>String(x.title).toLowerCase()===String(draw.title).toLowerCase()&&(!draw.year||Number(x.year)===Number(draw.year)));
    if(m)await hydrate(m);return m;
  }
  function rxHackLines(limitReached=false){
    const pools=[
      ['SUBJECT LINK ESTABLISHED','RETINAL HANDSHAKE ACCEPTED','CORTEX INPUT CHANNEL OPEN'],
      ['DREAM-LOGIC FILTER BYPASSED','POPULARITY BIAS DISABLED','SAFE CHOICES REMOVED'],
      ['CROSS-CHECKING 500 CINEMATIC SPECIMENS','MAPPING AFFECTIVE SCARS TO FILM DNA','LOCATING HIGHEST-RISK COMPATIBILITY'],
      limitReached?['DAILY LIMIT CONFIRMED // REOPENING MEMORY']:['MATCH ISOLATED // DO NOT LOOK AWAY','RX GENERATED // ARCHIVE IS WATCHING']
    ];
    const r=rng(hash32(`${Date.now()}|mobile-rx`));return pools.map(p=>p[Math.floor(r()*p.length)]);
  }
  async function runRx(){
    const token=++rxRunToken,dialog=$('#mRxDialog');if(!dialog.open)dialog.showModal();
    $('#mRxCard').hidden=true;$('#mRxScan').innerHTML='';renderRxHistory();
    const day=loadRxDay(),lines=rxHackLines(day.draws.length>=3);
    for(let i=0;i<lines.length;i++){
      const div=document.createElement('div');div.textContent=`0${i+1} // ${lines[i]}`;
      $('#mRxScan').appendChild(div);await new Promise(r=>setTimeout(r,180));
      if(!dialog.open||token!==rxRunToken)return;
    }
    if(day.draws.length>=3){await showRxSaved(2);return}
    // Refresh the shared day's record; another desktop tab may have saved a dose.
    const fresh=loadRxDay();if(fresh.draws.length>=3){await showRxSaved(2);return}
    const seed=rxSeedForDraw(fresh,fresh.draws.length+1);
    if(!seed){toast('RX SIGNAL UNAVAILABLE');return}
    const m=MOVIES.find(x=>movieKey(x)===movieKey(seed))||null;
    fresh.draws.push({drawNo:fresh.draws.length+1,title:seed.title,year:seed.year,movieId:m?.id||null});
    saveRxDay(fresh);renderRxHistory();
    $('#mRxCard').hidden=false;$('#mRxSealed').hidden=false;$('#mRxReveal').hidden=true;
    $('#mRxCard').dataset.index=String(fresh.draws.length-1);
    if(m)hydrate(m).catch(()=>{});
  }
  async function showRxSaved(index){
    const draw=loadRxDay().draws[index];if(!draw)return;
    const token=rxRunToken;
    $('#mRxCard').hidden=false;$('#mRxSealed').hidden=true;$('#mRxReveal').hidden=false;
    $('#mRxReveal').textContent='RECONSTRUCTING SAVED RX…';$('#mRxCard').dataset.index=String(index);
    const m=await rxMovieFromDraw(draw);if(!$('#mRxDialog').open||token!==rxRunToken)return;
    const poster=m?.posterPath&&TMDB?TMDB.posterUrl(m.posterPath,'w500'):'';
    $('#mRxReveal').innerHTML=`${poster?`<img src="${esc(poster)}" alt="Poster for ${esc(m?.title||draw.title)}">`:''}<span class="m-kicker">${rxRoles[index]} // RX ${index+1}/3</span><h2>${esc(m?.title||draw.title)}</h2><p>${esc(m?.director||'Unknown')} / ${m?.year||draw.year||'—'}${m?.runtime?` / ${m.runtime} MIN`:''}</p><p>${esc(m?.overview||'Synopsis signal unavailable.')}</p><div style="clear:both"></div>${m?`<div class="m-watch-chips">${watchConditions(m).slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="m-dna" id="mRxDNA"></div>`:''}`;
    if(m)renderDNA($('#mRxDNA'),m.dna);
  }

  function deadDepthLabel(rank){
    if(rank<=45)return 'MAXIMUM CULT SIGNAL';if(rank<=100)return 'HIGH CULT SIGNAL';
    if(rank<=180)return 'FRINGE TRANSMISSION';if(rank<=240)return 'DEEP CHANNEL';
    return 'LOW-VISIBILITY SIGNAL';
  }
  function deadPick(pool,count,seed,mode=deadMode){
    const roll=rng(seed),rows=pool.map(item=>{
      const weight=mode==='cult'?Math.max(.18,1.35-item.rank/300):mode==='deep'?.2+(item.rank/300)*1.4:mode==='chaos'?.75+(hash32(`${seed}|${item.title}`)%100)/100:1;
      return {item,weight:Math.max(.05,weight)*(.8+roll()*.45)};
    }),out=[];
    while(rows.length&&out.length<count){
      let target=roll()*rows.reduce((sum,x)=>sum+x.weight,0),idx=0;
      for(let i=0;i<rows.length;i++){target-=rows[i].weight;if(target<=0){idx=i;break}}
      out.push(rows.splice(idx,1)[0].item);
    }
    return out;
  }
  async function deadMetadata(specimen){
    if(!TMDB?.canQuery())return null;
    const key=String(specimen.rank);if(deadMetadataCache.has(key))return deadMetadataCache.get(key);
    const request=Promise.race([TMDB.resolveTitle(specimen.title,null),new Promise((_,reject)=>setTimeout(()=>reject(new Error('SIGNAL_TIMEOUT')),9000))]).catch(()=>null);
    deadMetadataCache.set(key,request);const data=await request;deadMetadataCache.set(key,data);return data;
  }
  function renderDead(){
    const token=++deadRenderToken,picked=deadPick(DEAD,8,hash32(`${Date.now()}|${Math.random()}|${deadMode}`));
    const host=$('#mDeadGrid');
    host.innerHTML=picked.map(x=>`<button type="button" class="m-dead-card" data-rank="${x.rank}" aria-label="Open dossier for ${esc(x.title)}"><span class="m-dead-poster">POSTER SIGNAL<br>${TMDB?.canQuery()?'SEARCHING':'UNAVAILABLE'}</span><b>${esc(x.title)}</b><small>D${String(x.rank).padStart(3,'0')} // ${esc(deadDepthLabel(x.rank))}<br>OPEN DOSSIER ↗</small></button>`).join('');
    const queue=picked.slice(),worker=async()=>{
      while(queue.length&&token===deadRenderToken){
        const item=queue.shift(),data=await deadMetadata(item);if(token!==deadRenderToken)return;
        const slot=$(`.m-dead-card[data-rank="${item.rank}"] .m-dead-poster`,host);if(!slot)continue;
        slot.innerHTML=data?.poster_path?`<img src="${esc(TMDB.posterUrl(data.poster_path,'w342'))}" alt="Poster for ${esc(data.title||item.title)}" loading="lazy">`:'POSTER SIGNAL<br>UNAVAILABLE';
      }
    };
    Promise.all([worker(),worker(),worker()]).catch(()=>{});
  }
  async function openDeadDetail(specimen){
    if(!specimen)return;
    const token=++deadDetailToken,dialog=$('#mDeadDetailDialog'),host=$('#mDeadDetailContent');
    host.innerHTML=`<span class="m-dead-detail-kicker">CHANNEL D-300 // ${String(specimen.rank).padStart(3,'0')}</span><h2>${esc(specimen.title)}</h2><p>RESOLVING METADATA SIGNAL…</p>`;
    if(!dialog.open)dialog.showModal();
    const data=await deadMetadata(specimen);if(!dialog.open||token!==deadDetailToken)return;
    const poster=data?.poster_path?TMDB.posterUrl(data.poster_path,'w500'):'';
    const director=(data?.credits?.crew||[]).find(x=>x.job==='Director')?.name||'Unknown';
    const year=Number(String(data?.release_date||'').slice(0,4))||null,genres=(data?.genres||[]).map(x=>x.name).join(' / ');
    host.innerHTML=`<span class="m-dead-detail-kicker">CHANNEL D-300 // ${String(specimen.rank).padStart(3,'0')} // ${esc(deadDepthLabel(specimen.rank))}</span><h2>${esc(data?.title||specimen.title)}</h2><p>${year||'—'} // ${esc(director)}${data?.runtime?` // ${data.runtime} MIN`:''}</p>${poster?`<img class="m-dead-detail-poster" src="${esc(poster)}" alt="Poster for ${esc(data.title||specimen.title)}">`:''}<p>${esc(genres||'OFF-CATALOG SPECIMEN')}</p><p>${esc(data?.overview||'Metadata signal unavailable. This specimen remains isolated from the main catalog.')}</p><small>SOURCE COORDINATE ${String(specimen.rank).padStart(3,'0')} / 300 // NOT A QUALITY SCORE</small>`;
  }
  function stopDeadPicker(){if(deadPickerTimer){clearInterval(deadPickerTimer);deadPickerTimer=null}}
  function spinDeadPicker(){
    if(!DEAD.length||deadPickerTimer)return;
    const screen=$('#mDeadPickerScreen'),button=$('#mDeadPickerSpin'),open=$('#mDeadPickerOpen'),previous=deadPickerSelection?.rank;
    deadPickerSelection=null;open.disabled=true;button.disabled=true;screen.classList.add('is-spinning');
    let ticks=0;const random=rng(hash32(`${Date.now()}|${Math.random()}|picker3000`));
    deadPickerTimer=setInterval(()=>{
      const pool=DEAD.length>1?DEAD.filter(x=>x.rank!==previous):DEAD,item=pool[Math.floor(random()*pool.length)];
      $('#mDeadPickerCode').textContent=`D${String(item.rank).padStart(3,'0')}`;
      $('#mDeadPickerTitle').textContent=item.title;
      $('#mDeadPickerMeta').textContent=`SCANNING BAD SIGNALS… ${Math.min(99,++ticks*5)}%`;
      if(ticks>=22){
        stopDeadPicker();deadPickerSelection=item;screen.classList.remove('is-spinning');
        $('#mDeadPickerMeta').textContent=`${deadDepthLabel(item.rank)} // COORDINATE ${String(item.rank).padStart(3,'0')}/300`;
        button.disabled=false;open.disabled=false;
      }
    },55);
  }
  function closeGuestbook(){
    clearTimeout(guestbookTimer);guestbookTimer=null;guestbookActive=false;
    const video=$('#mGuestbookVideo'),dialog=$('#mGuestbookDialog');video.pause();
    try{video.currentTime=0}catch{}if(dialog.open)dialog.close();
  }
  function openGuestbook(){
    if(guestbookActive)return;guestbookActive=true;
    const audio=$('#mDeadAudio');audio.pause();audio.currentTime=0;
    const dialog=$('#mGuestbookDialog'),video=$('#mGuestbookVideo');dialog.showModal();video.currentTime=0;
    video.play().catch(()=>toast('TAP THE VIDEO TO PLAY'));guestbookTimer=setTimeout(closeGuestbook,5400);
  }

  function openInfo(key){const x=INFO[key];if(!x)return;$('#mInfoContent').innerHTML=`<div class="m-info-copy"><span class="m-kicker">MODULE INFORMATION</span><h2>${esc(x[0])}</h2><p>${esc(x[1])}</p><ol>${x[2].map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`;$('#mInfoDialog').showModal()}

  function init(){
    hydrateFromCache();
    const boot=$('#mBoot'),hideBoot=()=>{boot.classList.add('is-gone');setTimeout(()=>boot.hidden=true,450)};
    let seenBoot=false;
    try{seenBoot=sessionStorage.getItem('cinegenome_mobile_boot_seen')==='1';sessionStorage.setItem('cinegenome_mobile_boot_seen','1')}catch{}
    if(seenBoot)boot.hidden=true;else setTimeout(hideBoot,1350);
    fillAtlasSelects();
    setupSearch($('#mScannerSearch'),$('#mScannerSuggestions'),m=>renderScanner(m),current);
    setupSearch($('#mParentA'),$('#mParentASuggestions'),m=>{parentA=m;renderCrossbreed()},parentA);
    setupSearch($('#mParentB'),$('#mParentBSuggestions'),m=>{parentB=m;renderCrossbreed()},parentB);
    setupSearch($('#mMutationSeed'),$('#mMutationSuggestions'),setMutationSeed,mutationSeed);
    setupSearch($('#mBloodlineSearch'),$('#mBloodlineSuggestions'),m=>{bloodlineSource=m;renderBloodline()},bloodlineSource);
    renderScanner(current);renderCrossbreed();setMutationSeed(mutationSeed);renderBloodline();renderArchive();updateRxCount();

    $$('.m-bottom-nav button').forEach(b=>b.onclick=()=>switchView(b.dataset.target));
    $$('.m-info').forEach(b=>b.onclick=()=>openInfo(b.dataset.info));
    $$('[data-close-dialog]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
    $('#mRxDialog').addEventListener('close',()=>{rxRunToken++});
    $('#mDossierBtn').onclick=()=>current&&openDossier(current);
    $('#mSaveBtn').onclick=()=>{
      if(!current)return;
      const wasSaved=state.favorites.some(id=>Number(id)===Number(current.id));
      if(!wasSaved)state.favorites.push(current.id);
      else state.favorites=state.favorites.filter(x=>Number(x)!==Number(current.id));
      saveState();renderScanner(current);renderArchive();
      toast(wasSaved?'SPECIMEN REMOVED FROM ARCHIVE':'SPECIMEN SAVED TO ARCHIVE');
    };
    $('#mRandomSpecimen').onclick=()=>{
      const pool=MOVIES.filter(m=>m.inCurated500&&m.id!==current?.id);
      const pick=pool[Math.floor(Math.random()*pool.length)]||MOVIES[0];
      if(pick){renderScanner(pick);toast('RANDOM SPECIMEN ISOLATED')}
    };
    $('#mBlend').oninput=renderCrossbreed;
    $('#mCrossbreedBtn').onclick=()=>{
      $('#mHybridResult').scrollIntoView({behavior:'smooth',block:'center'});
      window.CINEGENOME_ANOMALY?.crossbreed(parentA,parentB,Number($('#mBlend').value));
      renderCrossbreed();toast('SYNTHETIC HYBRID SEQUENCED');
    };
    $('#mSaveCrossbreed').onclick=()=>{
      if(!parentA||!parentB)return;
      const ratio=Number($('#mBlend').value),dna=blendDNA(parentA.dna,parentB.dna,ratio);
      const best=nearest(dna,[parentA.id,parentB.id],1)[0];
      archiveExperiment('CROSSBREED',`${parentA.title} × ${parentB.title}`,`Dominance ${ratio}/${100-ratio}. Nearest viable specimen: ${best?.movie.title||'none'} (${best?.score||0}%).`,dna);
    };
    $('#mRandomMutationSeed').onclick=()=>setMutationSeed(MOVIES[Math.floor(Math.random()*MOVIES.length)]);
    $('#mSaveMutation').onclick=()=>{
      const best=nearest(mutationDNA,[],1)[0];
      archiveExperiment('MUTATION',`Mutation → ${best?.movie.title||'Unknown'}`,`Seed: ${mutationSeed?.title||'Unknown'}. Synthetic profile matched ${best?.score||0}% with the nearest specimen.`,mutationDNA);
    };
    $('#mAtlasX').onchange=renderAtlas;$('#mAtlasY').onchange=renderAtlas;
    $('#mAtlasLimit').oninput=renderAtlas;
    $('#mAtlasRandom').onclick=()=>{atlasSeed=Math.floor(Math.random()*1e9);renderAtlas()};
    $('#mAtlasSurprise').onclick=()=>inspectAtlas(atlasVisible[Math.floor(Math.random()*atlasVisible.length)]);
    $('#mAtlasScan').onclick=()=>{if(atlasSelected){switchView('scanner');renderScanner(atlasSelected)}};
    $$('[data-sheet]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.sheet==='bloodline'?'#mBloodlineSheet':'#mArchiveSheet';
      $(id).hidden=false;$(id).scrollIntoView({behavior:'smooth'});
    });
    $$('[data-close-sheet]').forEach(b=>b.onclick=()=>b.closest('.m-more-sheet').hidden=true);
    $('#mClearArchive').onclick=()=>{
      if(!confirm('Erase saved specimens and experiments from this browser?'))return;
      state.favorites=[];state.archive=[];saveState();renderArchive();renderScanner(current);
      toast('LOCAL ARCHIVE ERASED');
    };
    $('#mHumanBtn').onclick=()=>$('#mHumanDialog').showModal();

    const openDead=()=>{if($('#mDeadDialog').open)return;$('#mDeadDialog').showModal();renderDead()};
    const resetDead=()=>{
      deadRenderToken++;stopDeadPicker();deadPickerSelection=null;
      $('#mDeadPickerScreen').classList.remove('is-spinning');
      $('#mDeadPickerCode').textContent='D???';
      $('#mDeadPickerTitle').textContent='CLICK THE BUTTON, COWARD';
      $('#mDeadPickerMeta').textContent='300 BAD IDEAS AVAILABLE';
      $('#mDeadPickerSpin').disabled=false;$('#mDeadPickerOpen').disabled=true;
      const audio=$('#mDeadAudio');audio.pause();audio.currentTime=0;
      deadSoundEnabled=false;$('#mDeadSound').textContent='♫ SOUND: OFF';
      $('#mDeadSound').setAttribute('aria-pressed','false');
    };
    const closeDead=()=>{
      if($('#mDeadDetailDialog').open)$('#mDeadDetailDialog').close();
      if($('#mDeadDialog').open)$('#mDeadDialog').close();
    };
    $('#mDeadBtn').onclick=openDead;$('#mDeadClose').onclick=closeDead;
    $('#mDeadDialog').addEventListener('close',resetDead);
    $('#mDeadRandom').onclick=renderDead;
    $$('.m-dead-modes button').forEach(btn=>btn.onclick=()=>{
      deadMode=btn.dataset.deadMode;
      $$('.m-dead-modes button').forEach(b=>{
        const active=b===btn;b.classList.toggle('is-active',active);
        b.setAttribute('aria-pressed',String(active));
      });
      renderDead();
    });
    $('#mDeadGrid').onclick=e=>{
      const card=e.target.closest('.m-dead-card');
      if(card)openDeadDetail(DEAD.find(x=>x.rank===Number(card.dataset.rank)));
    };
    $('#mDeadPickerSpin').onclick=spinDeadPicker;
    $('#mDeadPickerOpen').onclick=()=>openDeadDetail(deadPickerSelection);
    $('#mDeadDetailClose').onclick=$('#mDeadDetailBack').onclick=()=>$('#mDeadDetailDialog').close();
    $('#mDeadDetailDialog').addEventListener('close',()=>deadDetailToken++);
    $('#mDeadSound').onclick=()=>{
      deadSoundEnabled=!deadSoundEnabled;
      const btn=$('#mDeadSound'),audio=$('#mDeadAudio');
      btn.textContent=`♫ SOUND: ${deadSoundEnabled?'ON':'OFF'}`;
      btn.setAttribute('aria-pressed',String(deadSoundEnabled));
      if(deadSoundEnabled){audio.volume=.07;audio.playbackRate=.72;audio.currentTime=0;audio.play().catch(()=>{})}
      else{audio.pause();audio.currentTime=0}
    };
    $('#mDeadGuestbook').onclick=openGuestbook;
    $('#mGuestbookClose').onclick=closeGuestbook;
    $('#mGuestbookVideo').onclick=()=>{
      if($('#mGuestbookVideo').paused)$('#mGuestbookVideo').play().catch(()=>{});
    };
    $('#mGuestbookVideo').addEventListener('ended',closeGuestbook);
    $('#mGuestbookVideo').addEventListener('error',closeGuestbook);
    $('#mGuestbookDialog').addEventListener('cancel',e=>{e.preventDefault();closeGuestbook()});
    $('#mDesktopBtn').onclick=()=>{
      try{sessionStorage.setItem('cinegenome_force_desktop','1')}catch{}
      location.href='../?desktop=1';
    };
    $('#mRxBtn').onclick=runRx;
    $('#mRxCard').onclick=()=>{
      const i=Number($('#mRxCard').dataset.index||loadRxDay().draws.length-1);
      showRxSaved(i);
    };
    $('#mBrand').onclick=()=>{
      const brand=$('#mBrand');brand.classList.remove('is-secret-tap');
      void brand.offsetWidth;brand.classList.add('is-secret-tap');
      setTimeout(()=>brand.classList.remove('is-secret-tap'),260);
      mobileBrandTapCount++;
      if(mobileBrandTapTimer)clearTimeout(mobileBrandTapTimer);
      mobileBrandTapTimer=setTimeout(()=>{mobileBrandTapCount=0},2600);
      if(mobileBrandTapCount>=7){
        mobileBrandTapCount=0;if(mobileBrandTapTimer)clearTimeout(mobileBrandTapTimer);
        openDead();return;
      }
      switchView('scanner');
    };
  }

  init();
})();

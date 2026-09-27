(() => {
  'use strict';

  const MOVIES = Array.isArray(window.CINEGENOME_MOVIES) ? window.CINEGENOME_MOVIES : [];
  const ENRICHED = Array.isArray(window.CINEGENOME_ENRICHED_TOP500) ? window.CINEGENOME_ENRICHED_TOP500 : [];
  const DEAD = Array.isArray(window.CINEGENOME_DEAD_CHANNEL) ? window.CINEGENOME_DEAD_CHANNEL : [];
  const TOP500 = Array.isArray(window.CINEGENOME_TOP500) ? window.CINEGENOME_TOP500 : [];
  const DIMS = Array.isArray(window.CINEGENOME_DIMENSIONS) ? window.CINEGENOME_DIMENSIONS : [];
  const validDNA=dna=>!!dna && DIMS.every(dim=>typeof dna[dim.key]==='number' && Number.isFinite(dna[dim.key]) && dna[dim.key]>=0 && dna[dim.key]<=100);
  const dnaSourceRank=source=>source==='editorial-researched-v1'?5:source==='curated-starter-v1'?4:source==='legacy-curated-profile-v2'?4:source==='tmdb-genome-v4'?3:source==='editorial-archetype-v1'?2:source==='tmdb-genome-v3'?1:0;
  const retainCurrentDNA=(current,cached)=>{
    const before=dnaSourceRank(current.dnaSource),after=dnaSourceRank(cached.dnaSource);
    return before>after || (before===after && before>=2 &&
      Number(current.dnaEvidence?.coverage||0)>=Number(cached.dnaEvidence?.coverage||0));
  };
  const dnaProvenance=movie=>movie?.dnaSource==='editorial-researched-v1'?'SOURCE-REVIEWED EDITORIAL // 12/12 AXES':
    movie?.dnaSource==='curated-starter-v1'?'EDITORIAL DNA // SOURCE NOTES PENDING':
    movie?.dnaSource==='legacy-curated-profile-v2'?'LEGACY CURATED DNA // PARTIAL PROVENANCE':
    movie?.dnaSource==='editorial-archetype-v1'?`EDITORIAL ARCHETYPE DNA // ${movie.cinematicSignals?.map(x=>String(x).toUpperCase()).join(' + ')||'DERIVED SIGNAL'}`:
    movie?.dnaSource==='tmdb-genome-v4'?`MODEL V4 // ${movie.dnaEvidence?.coverage??'?'}/12 AXES EVIDENCED`:
    movie?.dnaSource==='tmdb-genome-v3'?'LEGACY MODEL V3':'ARCHIVE DNA // PROVISIONAL / AXIS EVIDENCE PENDING';
  const dnaTrace=movie=>{
    if(movie?.dnaSource==='editorial-archetype-v1'){const a=movie.cinematicSignals||movie.dnaEvidence?.archetypes||[];return a.length?`<p class="m-muted">ARCHETYPE TRACE // ${a.map(x=>esc(String(x).toUpperCase())).join(' + ')}</p>`:'';}
    if(movie?.dnaSource==='legacy-curated-profile-v2')return '<p class="m-muted">PROVENANCE TRACE // LEGACY CURATED PROFILE · AXIS SOURCES PENDING</p>';
    if(!['tmdb-genome-v4','editorial-researched-v1'].includes(movie?.dnaSource))return '';
    const axes=movie.dnaEvidence?.axes||{};
    const picks=DIMS.filter(d=>axes[d.key]?.length)
      .sort((a,b)=>Math.abs(movie.dna[b.key]-50)-Math.abs(movie.dna[a.key]-50)||DIMS.indexOf(a)-DIMS.indexOf(b))
      .slice(0,3).map(d=>`${d.label.toUpperCase()} ← ${axes[d.key].slice(0,2).map(s=>s.split(':')[0].toUpperCase()).join(' + ')}`);
    return picks.length?`<p class="m-muted">EVIDENCE TRACE // ${picks.map(esc).join(' · ')}</p>`:'';
  };
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
    if(!validDNA(m?.dna))return;
    const key=movieKey(m);
    if(mounted.has(key))return;
    MOVIES.push(Object.assign({id:2000000+Number(m.sourceId||i+1),country:'Unknown',genres:[],tags:[],inCurated500:true},m));
    mounted.add(key);
  });
  (window.CINEGENOME_WATCH_ONCE_EXTRA||[]).forEach(m=>{
    if(!validDNA(m?.dna)||mounted.has(movieKey(m)))return;
    MOVIES.push({...m});mounted.add(movieKey(m));
  });
  function recordHomeAction(kind,films){
    const ids=films.map(film=>film?.id);
    if(ids.every(id=>Number.isSafeInteger(id)&&id>0))
      window.dispatchEvent(new CustomEvent('cinegenome:home-trace',{detail:{kind,ids}}));
  }

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
  function cloneDNA(dna){const o={};dims().forEach(k=>{const v=dna?.[k];o[k]=typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100?v:null});return o}
  function dnaDistance(a,b){if(!validDNA(a)||!validDNA(b))return null;let sum=0;dims().forEach(k=>sum+=(a[k]-b[k])**2);return Math.sqrt(sum/Math.max(dims().length,1))}
  function nearest(dna,exclude=[],limit=5){if(!validDNA(dna))return [];const ex=new Set(exclude.map(Number));return MOVIES.filter(m=>validDNA(m.dna)&&!ex.has(Number(m.id))).map(movie=>({movie,score:Math.max(0,Math.round(100-dnaDistance(dna,movie.dna)))})).sort((a,b)=>b.score-a.score||a.movie.title.localeCompare(b.movie.title)).slice(0,limit)}
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
      (Array.isArray(cache)?cache:Object.values(cache)).forEach(c=>{
        const m=MOVIES.find(x=>movieKey(x)===movieKey(c));
        if(m&&validDNA(c.dna)){
          if(m.tmdbId && c.tmdbId && Number(m.tmdbId)!==Number(c.tmdbId))return;
          const preserved=retainCurrentDNA(m,c)?{dna:m.dna,dnaSource:m.dnaSource,
            dnaConfidence:m.dnaConfidence,dnaModelVersion:m.dnaModelVersion,dnaEvidence:m.dnaEvidence}:null;
          Object.assign(m,c,{id:m.id,inCurated500:m.inCurated500,inWatchOnce:m.inWatchOnce},preserved);
        }
      });
    }catch{}
  }
  function saveMovieCache(movie){
    try{
      const cache=JSON.parse(localStorage.getItem(TMDB_CACHE_KEY)||'[]');
      const rows=Array.isArray(cache)?cache:Object.values(cache);
      const saved={...movie};
      localStorage.setItem(TMDB_CACHE_KEY,JSON.stringify([saved,...rows.filter(x=>movieKey(x)!==movieKey(movie)&&x.tmdbId!==movie.tmdbId)].slice(0,600)));
    }catch{}
  }
  async function hydrate(movie){
    if(!movie||!TMDB?.canQuery())return movie;
    if(movie.tmdbId&&movie.posterPath&&movie.overview&&movie.dnaSource==='tmdb-genome-v4'&&movie.director&&movie.director!=='Metadata pending')return movie;
    const key=movieKey(movie);
    if(metadataCache.has(key))return metadataCache.get(key);
    const p=(async()=>{
      try{
        const data=await TMDB.resolveTitle(movie.title,movie.year,{strict:true});
        if(!data)return movie;
        const matchYear=Number(String(data.release_date||'').slice(0,4));
        if(matchYear && movie.year && Math.abs(matchYear-Number(movie.year))>1)return movie;
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
        const profile=window.CINEGENOME_DNA_MODEL?.profile(data);
        if(profile&&!['curated-starter-v1','editorial-researched-v1','legacy-curated-profile-v2'].includes(movie.dnaSource)){
          movie.dna=profile.dna;movie.dnaSource=profile.source;movie.dnaConfidence=profile.confidence;
          movie.dnaModelVersion=profile.modelVersion;movie.dnaEvidence=profile.dnaEvidence;
        }
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
    $$('button',host).forEach(b=>b.onclick=()=>{const m=MOVIES.find(x=>Number(x.id)===Number(b.dataset.id));if(m){current=m;switchView('scanner');renderScanner(m);recordHomeAction('scan',[m])}})
  }

  async function renderScanner(movie,{preview=false}={}){
    current=movie||current;if(!current)return;
    $('#mScannerSearch').value=`${current.title} (${current.year||'—'})`;
    const saved=state.favorites.some(id=>Number(id)===Number(current.id));
    $('#mSaveBtn').textContent=saved?'SAVED':'SAVE';
    $('#mSaveBtn').setAttribute('aria-pressed',String(saved));
    $('#mScannerCode').textContent=`SPECIMEN #${String(current.sourceId||current.id).slice(-4).padStart(4,'0')}`;
    $('#mScannerTitle').textContent=current.title;
    if(!preview)window.CINEGENOME_ANOMALY?.scan(current);
    $('#mScannerMeta').textContent=`${current.director||'RESOLVING TMDB SIGNAL…'} / ${current.year||'—'}`;
    $('#mScannerTags').innerHTML=(current.genres||[]).slice(0,4).map(x=>`<span>${esc(x.toUpperCase())}</span>`).join('');
    $('#mDnaConfidence').textContent=dnaProvenance(current);
    renderDNA($('#mScannerDNA'),current.dna);
    renderNearest($('#mScannerNearest'),current.dna,[current.id]);
    const poster=$('#mScannerPoster');
    if(current.posterPath&&TMDB)poster.innerHTML=`<img src="${esc(TMDB.posterUrl(current.posterPath,'w342'))}" alt="">`;
    else poster.innerHTML=`<span>${TMDB?.canQuery()?'SEARCHING TMDB<br>SIGNAL...':'POSTER SIGNAL<br>UNAVAILABLE'}</span>`;
    if(preview)return;
    const token=current.id;
    await hydrate(current);
    if(current.id!==token)return;
    $('#mScannerMeta').textContent=`${current.director||'Unknown'} / ${current.year||'—'}${current.runtime?` / ${current.runtime} MIN`:''}`;
    $('#mScannerTags').innerHTML=(current.genres||[]).slice(0,4).map(x=>`<span>${esc(x.toUpperCase())}</span>`).join('');
    $('#mDnaConfidence').textContent=dnaProvenance(current);
    renderDNA($('#mScannerDNA'),current.dna);
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
      <div class="m-card"><div class="m-card-head"><span>CINEMATIC DNA</span><span>${esc(dnaProvenance(movie))}</span></div>${dnaTrace(movie)}<div class="m-dna" id="mDossierDNA"></div></div>
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
    window.CINEGENOME_INSTRUMENTS.differential($('#mHybridDifferential'),parentA?.dna,parentB?.dna,{title:'PARENT DIFFERENTIAL',middle:dna});
    if(best)hydrate(best.movie).then(()=>{$('#mHybridMeta').textContent=`${best.movie.year||'—'} // ${best.movie.director||'Unknown'}`});
  }

  function renderMutationControls(){
    $('#mMutationControls').innerHTML=DIMS.map(d=>`<label class="m-field"><span>${esc(d.label)} <b id="mv-${d.key}">${mutationDNA[d.key]}</b></span><input data-dim="${d.key}" type="range" min="0" max="100" value="${mutationDNA[d.key]}"></label>`).join('');
    $$('input[data-dim]',$('#mMutationControls')).forEach(input=>input.oninput=()=>{mutationDNA[input.dataset.dim]=Number(input.value);$(`#mv-${input.dataset.dim}`).textContent=input.value;renderMutationMatch();window.CINEGENOME_ANOMALY?.mutation(mutationDNA)});
  }
  function renderMutationMatch(){
    window.CINEGENOME_INSTRUMENTS.differential($('#mMutationDifferential'),mutationSeed?.dna,mutationDNA,{title:'DEVIATION FROM SEED',leftLabel:'SEED',rightLabel:'LIVE'});
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
    const query=($('#mAtlasFind')?.value||'').trim().toLowerCase();
    const r=rng(atlasSeed),source=MOVIES.filter(m=>window.CINEGENOME_INSTRUMENTS.known(m.dna?.[xk])&&window.CINEGENOME_INSTRUMENTS.known(m.dna?.[yk])&&(!query||`${m.title} ${m.year||''} ${m.director||''}`.toLowerCase().includes(query))).slice(),picked=[];
    while(source.length&&picked.length<limit)picked.push(source.splice(Math.floor(r()*source.length),1)[0]);
    atlasVisible=picked;atlasSelected=null;$('#mAtlasScan').hidden=true;
    $('#mAtlasCount').textContent=picked.length;
    $('#mAtlasDetail').textContent=picked.length?'Tap a node to inspect its exact coordinates.':'NO MATCHING KNOWN COORDINATES. Clear the search or change axes.';
    const sx=v=>60+v*6.1,sy=v=>550-v*5;
    const grid=[0,20,40,60,80,100].map(v=>`<path d="M${sx(v)} 50V550 M60 ${sy(v)}H670" fill="none" stroke="#384933"/><text x="${sx(v)}" y="573" text-anchor="middle" fill="#c8d9b9" font-size="14">${v}</text><text x="43" y="${sy(v)+5}" text-anchor="end" fill="#c8d9b9" font-size="14">${v}</text>`).join('');
    const xLabel=DIMS.find(d=>d.key===xk)?.label||xk,yLabel=DIMS.find(d=>d.key===yk)?.label||yk;
    svg.innerHTML=`<rect width="720" height="620" fill="#0c100c"/>${grid}<text x="365" y="608" text-anchor="middle" fill="#d8e8cb" font-size="16">${esc(xLabel)} →</text><text transform="translate(18 300) rotate(-90)" text-anchor="middle" fill="#d8e8cb" font-size="16">${esc(yLabel)} →</text>${picked.map(m=>{
      const x=sx(m.dna[xk]),y=sy(m.dna[yk]);
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
    window.CINEGENOME_ANOMALY?.atlas(m,xk,yk);
    $('#mAtlasScan').hidden=false;
  }

  function renderBloodline(){
    if(!bloodlineSource)return;
    $('#mBloodlineInspect').replaceChildren();
    const rows=nearest(bloodlineSource.dna,[bloodlineSource.id],8);
    $('#mBloodlineList').innerHTML=rows.map(x=>`<button data-id="${x.movie.id}"><b>${esc(x.movie.title)}</b><strong>${x.score}%</strong><small>${x.movie.year||'—'} // ${bloodlineRelation(bloodlineSource,x.movie,x.score)} // MODEL INFERENCE</small></button>`).join('');
    $$('button',$('#mBloodlineList')).forEach(b=>b.onclick=()=>{
      const m=MOVIES.find(x=>Number(x.id)===Number(b.dataset.id));if(!m)return;
      window.CINEGENOME_ANOMALY?.bloodline(bloodlineSource,m);
      const inspect=$('#mBloodlineInspect');
      inspect.innerHTML=`<span class="m-kicker">SELECTED RELATIVE</span><h3>${esc(m.title)}</h3><p class="m-muted">${esc(m.year||'YEAR UNKNOWN')} / ${esc(m.director||'DIRECTOR UNKNOWN')}</p><div class="cg83-instrument" id="mBloodlineComparison"></div><button class="m-btn full" type="button" id="mBloodlineScan">SCAN THIS RELATIVE ↗</button>`;
      window.CINEGENOME_INSTRUMENTS.differential($('#mBloodlineComparison'),bloodlineSource.dna,m.dna,{title:'CLOSEST SHARED SIGNALS',leftLabel:'SOURCE',rightLabel:'RELATIVE',similar:true});
      $('#mBloodlineScan').onclick=()=>{current=m;switchView('scanner');renderScanner(m);recordHomeAction('scan',[m])};
      inspect.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
  }
  function renderArchive(){
    const favorites=[...new Set(state.favorites.map(Number))].map(id=>MOVIES.find(x=>Number(x.id)===id)).filter(Boolean);
    window.CINEGENOME_ARCHIVE.render($('#mArchiveList'),{favorites,experiments:state.archive,
      onScan:m=>{current=m;switchView('scanner');renderScanner(m);recordHomeAction('scan',[m])}});
  }

  let mobileUiAudioContext=null;
  function playMobileMenuSfx(){
    try{
      if(localStorage.getItem('cinegenome_ui_sfx_v1')==='off')return;
      const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
      const ctx=mobileUiAudioContext||(mobileUiAudioContext=new AudioCtx());
      if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const t=ctx.currentTime;
      const master=ctx.createGain(),comp=ctx.createDynamicsCompressor();
      master.gain.setValueAtTime(.0001,t);master.gain.exponentialRampToValueAtTime(.082,t+.002);master.gain.exponentialRampToValueAtTime(.0001,t+.132);
      comp.threshold.setValueAtTime(-20,t);comp.ratio.setValueAtTime(5,t);comp.attack.setValueAtTime(.001,t);comp.release.setValueAtTime(.05,t);
      master.connect(comp);comp.connect(ctx.destination);

      const nLen=Math.max(1,Math.floor(ctx.sampleRate*.030)),buf=ctx.createBuffer(1,nLen,ctx.sampleRate),d=buf.getChannelData(0);
      for(let i=0;i<nLen;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/nLen,4);
      const ns=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),bp=ctx.createBiquadFilter(),ng=ctx.createGain();
      ns.buffer=buf;hp.type='highpass';hp.frequency.setValueAtTime(1350,t);bp.type='bandpass';bp.frequency.setValueAtTime(4300,t);bp.Q.setValueAtTime(1.2,t);
      ng.gain.setValueAtTime(.58,t);ng.gain.exponentialRampToValueAtTime(.0001,t+.025);ns.connect(hp);hp.connect(bp);bp.connect(ng);ng.connect(master);ns.start(t);ns.stop(t+.03);

      const tick=ctx.createOscillator(),tg=ctx.createGain();tick.type='square';tick.frequency.setValueAtTime(1500,t);tick.frequency.exponentialRampToValueAtTime(720,t+.017);tg.gain.setValueAtTime(.54,t);tg.gain.exponentialRampToValueAtTime(.0001,t+.021);tick.connect(tg);tg.connect(master);tick.start(t);tick.stop(t+.023);
      const ping=ctx.createOscillator(),pg=ctx.createGain();ping.type='triangle';ping.frequency.setValueAtTime(1700,t+.006);ping.frequency.exponentialRampToValueAtTime(1280,t+.06);pg.gain.setValueAtTime(.0001,t);pg.gain.exponentialRampToValueAtTime(.36,t+.008);pg.gain.exponentialRampToValueAtTime(.0001,t+.078);ping.connect(pg);pg.connect(master);ping.start(t+.004);ping.stop(t+.082);
      const body=ctx.createOscillator(),bg=ctx.createGain();body.type='sine';body.frequency.setValueAtTime(125,t);body.frequency.exponentialRampToValueAtTime(76,t+.032);bg.gain.setValueAtTime(.36,t);bg.gain.exponentialRampToValueAtTime(.0001,t+.036);body.connect(bg);bg.connect(master);body.start(t);body.stop(t+.039);
    }catch{}
  }

  const MODULE_AUTOFOCUS_VIEWS=new Set(['scanner','crossbreed','mutation','atlas','bloodline','archive']);

  function focusModuleViewport(name){
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior=reduced?'auto':'smooth';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(MODULE_AUTOFOCUS_VIEWS.has(name)){
        const target=document.querySelector(`.m-view[data-view="${name}"]`);
        if(target){
          const top=Math.max(0,window.scrollY+target.getBoundingClientRect().top-8);
          window.scrollTo({top,behavior});
          return;
        }
      }
      window.scrollTo({top:0,behavior});
    }));
  }

  function switchView(name){
    document.body.classList.toggle('mobile-home-mode',name==='home');
    $$('.m-view').forEach(v=>v.classList.toggle('is-active',v.dataset.view===name));
    $$('.m-bottom-nav button').forEach(b=>b.classList.toggle('is-active',b.dataset.target===name));
    $$('[data-primary-view]').forEach(b=>{
      const active=b.dataset.primaryView===name;
      b.classList.toggle('is-active',active);
      b.setAttribute('aria-selected',String(active));
    });
    focusModuleViewport(name);
    if(name==='scanner')renderScanner(current);
    if(name==='atlas')renderAtlas();
    if(name==='archive')renderArchive();
    if(name==='bloodline')renderBloodline();
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
    const current=Number($('#mRxCard').dataset.index||0);
    $('#mRxNavigation').hidden=d.draws.length<2;
    $('#mRxPrevious').disabled=current<=0;
    $('#mRxNext').disabled=current>=d.draws.length-1;
  }
  const rxDelay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function updateRxNextDose(){
    const next=$('#mRxNextDoseBtn'),used=loadRxDay().draws.length;
    next.hidden=used>=3||!$('#mRxCard').classList.contains('is-revealed');
    if(!next.hidden)next.textContent=`NEXT DAILY DOSE // ${used+1} OF 3 ↗`;
  }
  function rxShowCard(index,sealed){
    const card=$('#mRxCard'),stage=$('#mRxCardStage');
    $('#mRxScanStage').classList.add('is-leaving');
    $('#mRxScanStage').hidden=true;
    card.dataset.index=String(index);card.hidden=false;
    card.classList.remove('is-revealed','show-poster','is-revealing');
    $('#mRxNextDoseBtn').hidden=true;
    $('#mRxReveal').hidden=true;
    $('#mRxHint').textContent=sealed?'TAP TO REVEAL':'PRESCRIPTION RECONSTRUCTED';
    stage.hidden=false;stage.classList.remove('is-entering');
    requestAnimationFrame(()=>requestAnimationFrame(()=>stage.classList.add('is-entering')));
    renderRxHistory();
  }
  async function rxFillFilm(index,token){
    const draw=loadRxDay().draws[index];if(!draw)return;
    $('#mRxRole').textContent=`${rxRoles[index]} // RX ${index+1}/3`;
    $('#mRxTitle').textContent=draw.title||'SIGNAL PENDING';
    $('#mRxMeta').textContent=draw.year||'METADATA PENDING';
    $('#mRxReveal').textContent='RECONSTRUCTING SAVED RX…';
    const m=await rxMovieFromDraw(draw);
    if(!$('#mRxDialog').open||token!==rxRunToken||Number($('#mRxCard').dataset.index)!==index)return;
    const poster=m?.posterPath&&TMDB?TMDB.posterUrl(m.posterPath,'w500'):'';
    const img=$('#mRxPoster');img.src=poster;img.style.visibility=poster?'visible':'hidden';img.alt=`Poster for ${m?.title||draw.title}`;
    $('#mRxRole').textContent=`${rxRoles[index]} // RX ${index+1}/3`;
    $('#mRxTitle').textContent=m?.title||draw.title;
    $('#mRxMeta').textContent=[m?.year||draw.year,m?.director].filter(Boolean).join(' // ');
    $('#mRxReveal').innerHTML=`<span class="m-kicker">${rxRoles[index]} // RX ${index+1}/3</span><h2>${esc(m?.title||draw.title)}</h2><p>${esc(m?.director||'Metadata pending')} / ${m?.year||draw.year||'—'}${m?.runtime?` / ${m.runtime} MIN`:''}</p><p>${esc(m?.overview||'Synopsis signal unavailable.')}</p>${m?`<div class="m-watch-chips">${watchConditions(m).slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="m-dna" id="mRxDNA"></div>`:''}`;
    if(m)renderDNA($('#mRxDNA'),m.dna);
    $('#mRxCard').classList.add('show-poster');
  }
  function rxReveal(){
    const card=$('#mRxCard');if(card.hidden||card.classList.contains('is-revealed')||card.classList.contains('is-revealing'))return;
    card.classList.add('is-revealing');$('#mRxHint').textContent='DECRYPTING SPECIMEN…';
    const token=rxRunToken;
    setTimeout(()=>{if(token!==rxRunToken||!$('#mRxDialog').open)return;
      card.classList.remove('is-revealing');card.classList.add('is-revealed');
      updateRxNextDose();
      $('#mRxHint').textContent='PRESCRIPTION '+(Number(card.dataset.index)+1)+' OF 3';
      setTimeout(()=>{if(token!==rxRunToken)return;$('#mRxReveal').hidden=false},650);
    },460);
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
    $('#mRxNextDoseBtn').hidden=true;
    $('#mRxDialog .m-dialog-body').scrollTop=0;
    $('#mRxCardStage').hidden=true;$('#mRxCard').hidden=true;
    $('#mRxScanStage').hidden=false;$('#mRxScanStage').classList.remove('is-leaving');
    $('#mRxScan').innerHTML='';
    const day=loadRxDay(),lines=rxHackLines(day.draws.length>=3);
    $('#mRxDrawCount').textContent=day.draws.length>=3?'DAILY DOSE MEMORY // 3 / 3':`DIAGNOSIS ${day.draws.length+1} / 3`;
    await rxDelay(230);
    for(let i=0;i<lines.length;i++){
      if(!dialog.open||token!==rxRunToken)return;
      const div=document.createElement('div');div.className='m-rx-scan-line';
      div.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b><i></i>`;
      $('#mRxScan').appendChild(div);
      // The desktop diagnostic line resolves through scrambled characters.
      const target=lines[i],glyph='01#%∆?';
      for(let frame=0;frame<3;frame++){
        div.querySelector('i').textContent=target.split('').map((c,j)=>c===' '?' ':j<Math.floor(target.length*(frame+1)/4)?c:glyph[(j+frame)%glyph.length]).join('');
        await rxDelay(47);
        if(!dialog.open||token!==rxRunToken)return;
      }
      div.querySelector('i').textContent=target;
      await rxDelay(135);
    }
    await rxDelay(330);if(!dialog.open||token!==rxRunToken)return;
    const fresh=loadRxDay();if(fresh.draws.length>=3){await showRxSaved(2);return}
    const seed=rxSeedForDraw(fresh,fresh.draws.length+1);
    if(!seed){toast('RX SIGNAL UNAVAILABLE');return}
    const m=MOVIES.find(x=>movieKey(x)===movieKey(seed))||null;
    fresh.draws.push({drawNo:fresh.draws.length+1,title:seed.title,year:seed.year,movieId:m?.id||null});
    saveRxDay(fresh);updateRxCount();
    const index=fresh.draws.length-1;
    rxShowCard(index,true);rxFillFilm(index,token);
  }
  async function showRxSaved(index,replay=false){
    if(!loadRxDay().draws[index])return;
    const token=rxRunToken;
    rxShowCard(index,replay);
    rxFillFilm(index,token);
    if(replay)return;
    // History is already known, so replay the same card flip immediately.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(token===rxRunToken&&$('#mRxDialog').open){$('#mRxCard').classList.add('is-revealed');$('#mRxReveal').hidden=false;updateRxNextDose()}
    }));
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
    const request=Promise.race([TMDB.resolveTitle(specimen.title,null,{strict:true}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('SIGNAL_TIMEOUT')),9000))]).catch(()=>null);
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
    window.CINEGENOME_PICKER_SFX?.prime();
    const screen=$('#mDeadPickerScreen'),button=$('#mDeadPickerSpin'),open=$('#mDeadPickerOpen'),previous=deadPickerSelection?.rank;
    deadPickerSelection=null;open.disabled=true;button.disabled=true;screen.classList.add('is-spinning');
    let ticks=0;const random=rng(hash32(`${Date.now()}|${Math.random()}|picker3000`));
    deadPickerTimer=setInterval(()=>{
      const pool=DEAD.length>1?DEAD.filter(x=>x.rank!==previous):DEAD,item=pool[Math.floor(random()*pool.length)];
      $('#mDeadPickerCode').textContent=`D${String(item.rank).padStart(3,'0')}`;
      $('#mDeadPickerTitle').textContent=item.title;
      $('#mDeadPickerMeta').textContent=`SCANNING BAD SIGNALS… ${Math.min(99,++ticks*5)}%`;
      if(ticks % 2 === 0) window.CINEGENOME_PICKER_SFX?.tick(ticks);
      if(ticks>=22){
        stopDeadPicker();deadPickerSelection=item;screen.classList.remove('is-spinning');
        window.CINEGENOME_PICKER_SFX?.finish();
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
    setupSearch($('#mScannerSearch'),$('#mScannerSuggestions'),m=>{renderScanner(m);recordHomeAction('scan',[m])},current);
    setupSearch($('#mParentA'),$('#mParentASuggestions'),m=>{parentA=m;renderCrossbreed()},parentA);
    setupSearch($('#mParentB'),$('#mParentBSuggestions'),m=>{parentB=m;renderCrossbreed()},parentB);
    setupSearch($('#mMutationSeed'),$('#mMutationSuggestions'),setMutationSeed,mutationSeed);
    setupSearch($('#mBloodlineSearch'),$('#mBloodlineSuggestions'),m=>{bloodlineSource=m;renderBloodline()},bloodlineSource);
    renderScanner(current,{preview:true});renderCrossbreed();setMutationSeed(mutationSeed);renderBloodline();renderArchive();updateRxCount();
    switchView('home');

    $$('.m-bottom-nav button').forEach(b=>{
      b.addEventListener('pointerdown',()=>{if(!b.classList.contains('is-active'))playMobileMenuSfx()});
      b.onclick=()=>{switchView(b.dataset.target)};
    });
    $$('[data-primary-view]').forEach(b=>{
      b.addEventListener('pointerdown',()=>{if(!b.classList.contains('is-active'))playMobileMenuSfx()});
      b.onclick=()=>{switchView(b.dataset.primaryView)};
    });
    $$('[data-mobile-home-view]').forEach(b=>{
      b.addEventListener('pointerdown',playMobileMenuSfx);
      b.onclick=()=>switchView(b.dataset.mobileHomeView);
    });
    $$('[data-mobile-home-code]').forEach(b=>b.addEventListener('click',()=>$('#mSpecimenCodeBtn')?.click()));
    $$('[data-mobile-home-filmprint]').forEach(button=>button.addEventListener('click',()=>{
      document.body.classList.remove('mobile-home-mode');
      switchView('scanner');
      setTimeout(()=>document.getElementById('m-test-ur-dna')?.scrollIntoView?.({behavior:'smooth',block:'start'}),60);
    }));
    $('[data-open-archive]').onclick=()=>{playMobileMenuSfx();switchView('archive')};
    $('#mDatasetVersion').textContent=`TOP500 + ${(window.CINEGENOME_WATCH_ONCE_EXTRA||[]).length} WATCH-ONCE`;
    $('#mContamination').textContent=`${(1.2+MOVIES.length/40).toFixed(1)}%`;
    $$('.m-info').forEach(b=>b.onclick=()=>openInfo(b.dataset.info));
    $$('[data-close-dialog]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
    $('#mRxDialog').addEventListener('close',()=>{rxRunToken++});
    $('#mDossierBtn').onclick=()=>current&&openDossier(current);
    $('#mSaveBtn').onclick=()=>{
      if(!current)return;
      const wasSaved=state.favorites.some(id=>Number(id)===Number(current.id));
      if(!wasSaved)state.favorites.push(current.id);
      else state.favorites=state.favorites.filter(x=>Number(x)!==Number(current.id));
      saveState();
      $('#mSaveBtn').textContent=wasSaved?'SAVE':'SAVED';
      $('#mSaveBtn').setAttribute('aria-pressed',String(!wasSaved));
      renderArchive();
      toast(wasSaved?'SPECIMEN REMOVED FROM ARCHIVE':'SPECIMEN SAVED TO ARCHIVE');
    };
    $('#mRandomSpecimen').onclick=()=>{
      const pool=MOVIES.filter(m=>m.dna&&m.id!==current?.id);
      const pick=pool[Math.floor(Math.random()*pool.length)]||MOVIES[0];
      if(pick){renderScanner(pick);recordHomeAction('scan',[pick]);toast('RANDOM SPECIMEN ISOLATED')}
    };
    $('#mBlend').oninput=renderCrossbreed;
    $('#mCrossbreedBtn').onclick=()=>{
      $('#mHybridResult').scrollIntoView({behavior:'smooth',block:'center'});
      window.CINEGENOME_ANOMALY?.crossbreed(parentA,parentB,Number($('#mBlend').value));
      renderCrossbreed();recordHomeAction('crossbreed',[parentA,parentB]);toast('SYNTHETIC HYBRID SEQUENCED');
    };
    $('#mSaveCrossbreed').onclick=()=>{
      if(!parentA||!parentB)return;
      const ratio=Number($('#mBlend').value),dna=blendDNA(parentA.dna,parentB.dna,ratio);
      const best=nearest(dna,[parentA.id,parentB.id],1)[0];
      archiveExperiment('CROSSBREED',`${parentA.title} × ${parentB.title}`,`Dominance ${ratio}/${100-ratio}. Nearest viable specimen: ${best?.movie.title||'none'} (${Number.isFinite(best?.score)?best.score+'%':'UNKNOWN'}).`,dna);
      recordHomeAction('crossbreed',[parentA,parentB]);
    };
    $('#mRandomMutationSeed').onclick=()=>setMutationSeed(MOVIES[Math.floor(Math.random()*MOVIES.length)]);
    $('#mSaveMutation').onclick=()=>{
      const best=nearest(mutationDNA,[],1)[0];
      archiveExperiment('MUTATION',`Mutation → ${best?.movie.title||'Unknown'}`,`Seed: ${mutationSeed?.title||'Unknown'}. Synthetic profile matched ${Number.isFinite(best?.score)?best.score+'%':'UNKNOWN'} with the nearest specimen.`,mutationDNA);
      if(mutationSeed)recordHomeAction('mutation',[mutationSeed]);
    };
    $('#mAtlasX').onchange=renderAtlas;$('#mAtlasY').onchange=renderAtlas;
    $('#mAtlasFind').oninput=renderAtlas;
    $('#mAtlasLimit').oninput=renderAtlas;
    $('#mAtlasRandom').onclick=()=>{atlasSeed=Math.floor(Math.random()*1e9);renderAtlas()};
    $('#mAtlasSurprise').onclick=()=>inspectAtlas(atlasVisible[Math.floor(Math.random()*atlasVisible.length)]);
    $('#mAtlasScan').onclick=()=>{if(atlasSelected){switchView('scanner');renderScanner(atlasSelected);recordHomeAction('scan',[atlasSelected])}};
    $('#mClearArchive').onclick=()=>{
      if(!confirm('Erase saved specimens and experiments from this browser?'))return;
      state.favorites=[];state.archive=[];saveState();renderArchive();renderScanner(current);
      toast('LOCAL ARCHIVE ERASED');
    };
    $('#mHumanBtn').onclick=()=>$('#mHumanDialog').showModal();

    let deadTransitionToken=0;
    const openDead=async()=>{
      if($('#mDeadDialog').open||!$('#mDeadTransition').hidden)return;
      const token=++deadTransitionToken,veil=$('#mDeadTransition'),readout=$('#mDeadTransitionLog');
      veil.hidden=false;document.body.classList.add('m-dead-hijacking');
      requestAnimationFrame(()=>requestAnimationFrame(()=>veil.classList.add('is-on')));
      const messages=['DIALING 56K NODE...','HANDSHAKE ACCEPTED // WRONG HOST','DOWNLOADING cursed_index.html','MIRROR FOUND // DO NOT REFRESH'];
      messages.forEach((msg,i)=>setTimeout(()=>{if(token===deadTransitionToken)readout.textContent=msg},i*245));
      await rxDelay(900);if(token!==deadTransitionToken)return;
      $('#mDeadDialog').showModal();renderDead();
      setTimeout(()=>{
        veil.classList.remove('is-on');document.body.classList.remove('m-dead-hijacking');
        setTimeout(()=>{veil.hidden=true},430);
      },110);
    };
    document.addEventListener('cinegenome:quarantine-film',async e=>{
      const specimen=DEAD.find(x=>x.rank===Number(e.detail?.rank));
      if(!specimen)return;
      await openDead();
      if($('#mDeadDialog').open)openDeadDetail(specimen);
    });
    document.addEventListener('cinegenome:quarantine-weird',openDead);
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
    $('#mDeadPickerSfx').onclick=()=>{
      const sound=window.CINEGENOME_PICKER_SFX;
      sound?.setEnabled(!sound.isEnabled());
      const enabled=sound?.isEnabled()??false;
      $('#mDeadPickerSfx').textContent=`♪ ROULETTE SFX: ${enabled?'ON':'OFF'}`;
      $('#mDeadPickerSfx').setAttribute('aria-pressed',String(enabled));
    };
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
    $('#mRxBtn').onclick=runRx;
    $('#mRxNextDoseBtn').onclick=()=>{
      if($('#mRxDialog').open&&$('#mRxCard').classList.contains('is-revealed')&&loadRxDay().draws.length<3)runRx();
    };
    $('#mRxPrevious').onclick=()=>{
      const index=Number($('#mRxCard').dataset.index||0);
      if(index>0){rxRunToken++;showRxSaved(index-1)}
    };
    $('#mRxNext').onclick=()=>{
      const index=Number($('#mRxCard').dataset.index||0);
      if(index+1<loadRxDay().draws.length){rxRunToken++;showRxSaved(index+1,true)}
    };
    $('#mRxCard').onclick=rxReveal;
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
      switchView('home');
    };
  }

  init();
})();

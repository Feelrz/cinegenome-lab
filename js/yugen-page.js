(() => {
  'use strict';
  const KEY='cinegenome_yugen_node_v1';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  function bindReturnToLab(){
    $$('a[href="index.html"]').forEach(link=>link.addEventListener('click',event=>{
      if(event.defaultPrevented||(event.button&&event.button!==0)||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      try{
        sessionStorage.setItem('cg_return_to_lab','yugen');
        sessionStorage.setItem('cinegenome_boot_seen','1');
      }catch{}
      document.body.classList.add('y-returning-to-lab');
      window.setTimeout(()=>window.location.assign(link.href),360);
    }));
  }
  bindReturnToLab();
  const hasAccess=()=>{try{return localStorage.getItem(KEY)==='1'}catch{return false}};
  if(!hasAccess()){$('#yugenPage').classList.add('is-hidden');$('#yugenBoot').hidden=true;$('#yugenLock').hidden=false;return}

  const raw=window.CINEGENOME_YUGEN_SOURCE_DATA||{sources:[]};
  const dnaSource=Array.isArray(window.CINEGENOME_ENRICHED_TOP500)?window.CINEGENOME_ENRICHED_TOP500:[];
  const dnaMap=new Map(dnaSource.map(x=>[norm(x.title),x]));
  const registry=new Map();
  raw.sources.forEach(source=>source.entries.forEach(entry=>{
    const k=norm(entry.title);let r=registry.get(k);
    if(!r){r={title:entry.title,year:entry.year||null,sources:[],sourcePositions:{}};registry.set(k,r)}
    if(entry.year&&!r.year)r.year=entry.year;
    if(!r.sources.includes(source.id))r.sources.push(source.id);
    r.sourcePositions[source.id]=entry.position;
  }));
  const records=[...registry.values()].map((r,i)=>{const dna=dnaMap.get(norm(r.title));return {...r,id:i+1,dna:dna||null,year:r.year||dna?.year||null}});

  const POSTER_CACHE_KEY='cinegenome_yugen_posters_v1';
  const POSTER_NONE='__NONE__';
  let posterCache={};
  try{posterCache=JSON.parse(localStorage.getItem(POSTER_CACHE_KEY)||'{}')||{}}catch{posterCache={}}
  const posterKey=r=>`${norm(r.title)}::${r.year||''}`;
  const posterPath=r=>{const direct=String(r?.dna?.posterPath||'').trim();if(direct)return direct;const cached=posterCache[posterKey(r)];return cached&&cached!==POSTER_NONE?cached:''};
  const posterUrl=(path,size='w342')=>path?`/api/tmdb-poster?path=${encodeURIComponent(path)}&size=${size}`:'';
  const posterFallback=(r,state='loading')=>`<div class="y-poster-fallback ${state==='missing'?'is-missing':''}"><b>映画</b><span>YG-${String(r.id).padStart(3,'0')}</span><small>${state==='missing'?'POSTER 未登録':'POSTER SIGNAL'}</small></div>`;
  const posterMarkup=(r,size='w342')=>{const path=posterPath(r);return path?`<img src="${posterUrl(path,size)}" alt="${esc(r.title)} poster" loading="lazy" decoding="async">`:posterFallback(r,posterCache[posterKey(r)]===POSTER_NONE?'missing':'loading')};
  const posterQueue=[],posterQueued=new Set();let posterActive=0;
  function savePosterCache(){try{localStorage.setItem(POSTER_CACHE_KEY,JSON.stringify(posterCache))}catch{}}
  function applyPoster(r,path){document.querySelectorAll(`[data-poster-id="${r.id}"]`).forEach(shell=>{shell.innerHTML=path?`<img src="${posterUrl(path,shell.classList.contains('y-dossier-poster')?'w500':'w342')}" alt="${esc(r.title)} poster" loading="lazy" decoding="async">`:posterFallback(r,'missing');shell.classList.toggle('is-missing',!path)})}
  async function resolvePoster(r){
    const k=posterKey(r),existing=posterPath(r);if(existing){applyPoster(r,existing);return}
    if(posterCache[k]===POSTER_NONE){applyPoster(r,'');return}
    const service=window.CINEGENOME_TMDB_SERVICE;if(!service||!service.canQuery?.())return;
    try{const hit=await service.searchMovie(r.title,r.year,{strict:true});const path=String(hit?.poster_path||'');posterCache[k]=path||POSTER_NONE;savePosterCache();applyPoster(r,path)}catch{}
  }
  function pumpPosters(){while(posterActive<3&&posterQueue.length){const r=posterQueue.shift();posterActive++;resolvePoster(r).finally(()=>{posterActive--;posterQueued.delete(r.id);pumpPosters()})}}
  function queuePoster(r){if(!r)return;const path=posterPath(r);if(path||posterCache[posterKey(r)]===POSTER_NONE){applyPoster(r,path);return}if(posterQueued.has(r.id))return;posterQueued.add(r.id);posterQueue.push(r);pumpPosters()}
  let posterObserver=null;
  function observePosters(){
    if(posterObserver)posterObserver.disconnect();
    if('IntersectionObserver' in window){posterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){const r=records.find(x=>x.id===Number(entry.target.dataset.posterId));queuePoster(r);posterObserver.unobserve(entry.target)}}),{rootMargin:'520px 0px'});document.querySelectorAll('.y-card-poster[data-poster-id]').forEach(el=>posterObserver.observe(el))}
    else document.querySelectorAll('.y-card-poster[data-poster-id]').forEach(el=>queuePoster(records.find(x=>x.id===Number(el.dataset.posterId))));
  }

  records.sort((a,b)=>{const both=b.sources.length-a.sources.length;if(both)return both;const pa=a.sourcePositions.PURE??999,pb=b.sourcePositions.PURE??999;if(pa!==pb)return pa-pb;return (a.sourcePositions.JP02??999)-(b.sourcePositions.JP02??999)});
  records.forEach((r,i)=>r.id=i+1);

  const labels={surrealism:'SURREAL',loneliness:'SOLITUDE',chaos:'CHAOS',romance:'ROMANCE',nostalgia:'MEMORY',intensity:'INTENSITY',pacing:'PACING',visualExtremity:'VISUAL',narrativeComplexity:'COMPLEX',darkness:'DARKNESS',humor:'HUMOR',dreamLogic:'DREAM'};
  const era=y=>!y?'UNKNOWN':y<1950?'PRE1950':y<1970?'1950':y<1990?'1970':y<2010?'1990':'2010';
  const sourceBadge=id=>id==='PURE'?'<span class="y-source-tag">JP-01</span>':'<span class="y-source-tag red">JP-02</span>';
  const sourceName=id=>id==='PURE'?'JP-01 // POLL SIGNAL':'JP-02 // CURATED SIGNAL';
  const dnaBars=r=>Object.entries(r.dna?.dna||{}).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>`<div class="y-dna-row"><span>${esc(labels[k]||k)}</span><i style="--v:${Number(v)||0}%"></i><b>${Number(v)||0}</b></div>`).join('');
  const director=r=>r.dna?.director&&r.dna.director!=='Metadata pending'?r.dna.director:'';
  const decade=y=>y?Math.floor(y/10)*10:null;
  const queryBlob=r=>norm(`${r.title} ${r.year||''} ${director(r)} ${r.sources.join(' ')} ${r.dna?'linked dna':'unmapped source only'} ${Object.keys(r.dna?.dna||{}).join(' ')}`);

  $('#yCountAll').textContent=String(records.length).padStart(3,'0');
  $('#yCountDNA').textContent=String(records.filter(x=>x.dna).length).padStart(3,'0');

  const search=$('#ySearch'),source=$('#ySource'),eraSelect=$('#yEra'),index=$('#yIndex'),dossier=$('#yDossier'),resultCount=$('#yResultCount'),searchMode=$('#ySearchMode'),suggestions=$('#ySearchSuggestions');
  let visible=[...records],selected=records[0]||null,suggestIndex=-1,spinPick=null,spinning=false;

  function parseQuery(value){
    const tokens=(String(value||'').match(/"[^"]+"|\S+/g)||[]).map(x=>x.replace(/^"|"$/g,''));
    const out={text:[],directors:[],years:[],eras:[],dna:null,feed:null};
    tokens.forEach(token=>{
      const m=token.match(/^([a-z]+):(.*)$/i);if(!m){out.text.push(norm(token));return}
      const key=m[1].toLowerCase(),val=norm(m[2]);
      if((key==='director'||key==='dir')&&val)out.directors.push(val);
      else if(key==='year'&&/^\d{4}$/.test(val))out.years.push(Number(val));
      else if(key==='era'&&val)out.eras.push(val);
      else if(key==='dna'&&/^(linked|unmapped|source)$/.test(val))out.dna=val;
      else if((key==='feed'||key==='source')&&val)out.feed=val;
      else out.text.push(norm(token));
    });
    return out;
  }
  function eraDirectiveMatch(r,values){
    if(!values.length)return true;
    return values.some(v=>{
      if(!r.year)return /unknown|unmapped/.test(v);
      const d=decade(r.year);
      if(/^(20)?00s?$/.test(v))return d===2000;
      if(/^(19)?90s?$/.test(v))return d===1990;
      if(/^(19)?80s?$/.test(v))return d===1980;
      if(/^(19)?70s?$/.test(v))return d===1970;
      if(/^(19)?60s?$/.test(v))return d===1960;
      if(/^(19)?50s?$/.test(v))return d===1950;
      if(/pre ?50|classic/.test(v))return r.year<1950;
      if(/modern|2010|2020/.test(v))return r.year>=2010;
      return norm(era(r.year))===v;
    });
  }
  function queryMatches(r,parsed){
    const blob=queryBlob(r);
    if(parsed.text.some(t=>t&&!blob.includes(t)))return false;
    if(parsed.directors.some(t=>!norm(director(r)).includes(t)))return false;
    if(parsed.years.length&&!parsed.years.includes(Number(r.year)))return false;
    if(!eraDirectiveMatch(r,parsed.eras))return false;
    if(parsed.dna==='linked'&&!r.dna)return false;
    if((parsed.dna==='unmapped'||parsed.dna==='source')&&r.dna)return false;
    if(parsed.feed){
      const f=parsed.feed.replace(/[^a-z0-9]/g,'');
      if(f==='dual'&&r.sources.length<2)return false;
      else if(/^(1|01|jp01|pure)$/.test(f)&&!r.sources.includes('PURE'))return false;
      else if(/^(2|02|jp02)$/.test(f)&&!r.sources.includes('JP02'))return false;
    }
    return true;
  }
  function scoreRecord(r,value){
    const q=norm(value);if(!q)return 0;const title=norm(r.title),dir=norm(director(r)),blob=queryBlob(r);let score=0;
    if(title===q)score+=120;else if(title.startsWith(q))score+=78;else if(title.includes(q))score+=52;
    if(dir===q)score+=46;else if(dir.includes(q))score+=27;
    q.split(' ').filter(Boolean).forEach(t=>{if(title.includes(t))score+=14;if(dir.includes(t))score+=8;if(blob.includes(t))score+=3});
    if(String(r.year||'').includes(q))score+=22;if(r.sources.length>1)score+=2;return score;
  }
  function filteredRecords(){
    const parsed=parseQuery(search.value),src=source.value,er=eraSelect.value;
    return records.filter(r=>{
      if(!queryMatches(r,parsed))return false;
      const sok=src==='ALL'||(src==='DUAL'?r.sources.length>1:r.sources.includes(src));
      const eok=er==='ALL'||era(r.year)===er;
      return sok&&eok;
    });
  }
  function renderDossier(r){
    selected=r||visible[0]||records[0]||null;
    index.querySelectorAll('.y-card').forEach(x=>x.classList.toggle('is-selected',Number(x.dataset.id)===selected?.id));
    if(!selected){dossier.innerHTML='<div class="y-dossier-body">信号なし // NO SIGNAL</div>';return}
    const src=selected.sources.map(id=>`<span>${esc(sourceName(id))} // POS ${String(selected.sourcePositions[id]).padStart(2,'0')}</span>`).join('');
    const meta=selected.dna;
    dossier.innerHTML=`<div class="y-dossier-head"><span>標本記録 // SPECIMEN RECORD</span><span>${String(selected.id).padStart(3,'0')} / ${String(records.length).padStart(3,'0')}</span></div><div class="y-dossier-body"><div class="y-dossier-poster" data-poster-id="${selected.id}">${posterMarkup(selected,'w500')}</div><div class="y-dossier-code">幽玄標本 // YG-${String(selected.id).padStart(3,'0')}</div><h2>${esc(selected.title)}</h2><div class="y-dossier-year">${selected.year?`YEAR // ${selected.year}`:'YEAR // 未登録 / UNMAPPED'}${director(selected)?` &nbsp;·&nbsp; DIRECTOR // ${esc(director(selected))}`:''}</div><div class="y-source-stamps">${src}</div>${meta?`<div class="y-dna-status"><span>CINEGENOME DNA LINK</span><b>接続済 // LINKED</b></div><div class="y-dna">${dnaBars(selected)}</div>`:`<div class="y-dna-status"><span>CINEGENOME DNA LINK</span><b>未登録 // UNMAPPED</b></div><div class="y-unmapped">SOURCE-ONLY SPECIMEN. THIS TITLE EXISTS IN THE YŪGEN ARCHIVAL FEED BUT DOES NOT CURRENTLY HAVE A MATCHING PROFILE IN THE CINEGENOME DNA POOL. NO SYNTHETIC DNA VALUES ARE GENERATED.</div>`}<div class="y-legend">JP-01 / JP-02 POSITIONS PRESERVE EACH FEED'S SOURCE ORDER. YŪGEN DOES NOT COMBINE THEM INTO A NEW RANKING.</div></div>`;
    queuePoster(selected);
  }
  function renderSuggestions(){
    const value=search.value.trim();if(!value||/:/.test(value)){suggestions.hidden=true;suggestions.innerHTML='';suggestIndex=-1;return}
    const hits=records.map(r=>({r,score:scoreRecord(r,value)})).filter(x=>x.score>3).sort((a,b)=>b.score-a.score).slice(0,6);
    if(!hits.length){suggestions.hidden=true;suggestions.innerHTML='';suggestIndex=-1;return}
    suggestions.innerHTML=hits.map(({r},i)=>`<button type="button" role="option" data-id="${r.id}" data-suggest-index="${i}"><span>${String(r.id).padStart(3,'0')}</span><strong>${esc(r.title)}</strong><small>${r.year||'—'}${director(r)?` // ${esc(director(r))}`:''}</small><b>${r.dna?'DNA 接続済':'未登録'}</b></button>`).join('');
    suggestions.hidden=false;suggestIndex=-1;
    suggestions.querySelectorAll('button').forEach(btn=>btn.addEventListener('mousedown',e=>{e.preventDefault();const r=records.find(x=>x.id===Number(btn.dataset.id));search.value=r.title;suggestions.hidden=true;render();renderDossier(r)}));
  }
  function render(){
    visible=filteredRecords();
    resultCount.textContent=`${String(visible.length).padStart(3,'0')} SIGNALS`;
    searchMode.textContent=search.value.trim()?`QUERY // ${String(visible.length).padStart(3,'0')} MATCHED`:`SMART INDEX // ${String(records.length).padStart(3,'0')} MOUNTED`;
    index.innerHTML=visible.length?visible.map(r=>`<button class="y-card${selected?.id===r.id?' is-selected':''}" data-id="${r.id}" type="button"><span class="y-card-poster" data-poster-id="${r.id}">${posterMarkup(r)}</span><span class="y-card-content"><span class="y-card-index">${String(r.id).padStart(3,'0')}</span><span class="y-card-top">${r.sources.map(sourceBadge).join('')}</span><strong>${esc(r.title)}</strong><span class="y-card-meta"><span>${r.year||'YEAR —'}</span><span>${r.dna?'DNA 接続済':'SOURCE ONLY'}</span></span></span></button>`).join(''):'<div class="y-empty">該当信号なし // NO ARCHIVE SIGNALS MATCH THIS FILTER.</div>';
    index.querySelectorAll('.y-card').forEach(card=>card.addEventListener('click',()=>renderDossier(records.find(r=>r.id===Number(card.dataset.id)))));
    observePosters();
    if(!selected||!visible.some(r=>r.id===selected.id))renderDossier(visible[0]);else renderDossier(selected);
  }

  search.addEventListener('input',()=>{render();renderSuggestions()});
  search.addEventListener('keydown',e=>{
    const opts=[...suggestions.querySelectorAll('button')];
    if(e.key==='ArrowDown'&&opts.length){e.preventDefault();suggestIndex=Math.min(suggestIndex+1,opts.length-1)}
    else if(e.key==='ArrowUp'&&opts.length){e.preventDefault();suggestIndex=Math.max(suggestIndex-1,0)}
    else if(e.key==='Enter'&&suggestIndex>=0&&opts[suggestIndex]){e.preventDefault();opts[suggestIndex].dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))}
    else if(e.key==='Escape'){suggestions.hidden=true;suggestIndex=-1;return}
    opts.forEach((o,i)=>o.classList.toggle('is-active',i===suggestIndex));if(suggestIndex>=0)opts[suggestIndex]?.scrollIntoView({block:'nearest'});
  });
  search.addEventListener('blur',()=>setTimeout(()=>suggestions.hidden=true,120));
  source.addEventListener('change',render);eraSelect.addEventListener('change',render);
  $('#ySearchClear').addEventListener('click',()=>{search.value='';source.value='ALL';eraSelect.value='ALL';suggestions.hidden=true;render();search.focus()});
  $$('.y-search-hints [data-y-query]').forEach(btn=>btn.addEventListener('click',()=>{const q=btn.dataset.yQuery;search.value=search.value.trim()?`${search.value.trim()} ${q}`:q;render();search.focus()}));
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search.focus();search.select()}else if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')){e.preventDefault();search.focus()}});

  $('#yRandom').addEventListener('click',()=>{if(!visible.length)return;const r=visible[Math.floor(Math.random()*visible.length)];renderDossier(r);dossier.scrollIntoView({behavior:'smooth',block:'nearest'})});

  const spinOverlay=$('#ySpinOverlay'),spinStage=$('#ySpinStage'),spinTitle=$('#ySpinTitle'),spinMeta=$('#ySpinMeta'),spinCounter=$('#ySpinCounter'),spinPool=$('#ySpinPool'),spinTape=$('#ySpinTape'),spinOpen=$('#ySpinOpen');
  let spinAudio=null,spinSound=true,spinTimer=null,spinStartTimer=null;
  try{spinSound=localStorage.getItem('cinegenome_yugen_sound_v1')!=='off' && localStorage.getItem('cinegenome_ui_sfx_v1')!=='off'}catch{}
  function unlockSpinAudio(){
    if(!spinSound)return;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      spinAudio=spinAudio||new Audio();
      if(spinAudio.state==='suspended')spinAudio.resume().catch(()=>{});
    }catch{}
  }
  function spinTone(frequency,duration=.035,delay=0,volume=.025){
    if(!spinSound || !spinAudio || document.hidden)return;
    try{
      const ctx=spinAudio,t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
      o.type='triangle';o.frequency.setValueAtTime(frequency,t);
      o.frequency.exponentialRampToValueAtTime(frequency*.72,t+duration);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.004);
      g.gain.exponentialRampToValueAtTime(.0001,t+duration);
      o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+duration+.015);
      o.onended=()=>{o.disconnect();g.disconnect()};
    }catch{}
  }
  const soundButton=$('#ySpinSound');
  function paintSpinSound(){if(soundButton){soundButton.textContent='SFX '+(spinSound?'ON':'OFF');soundButton.setAttribute('aria-pressed',String(spinSound))}}
  soundButton?.addEventListener('click',()=>{spinSound=!spinSound;try{localStorage.setItem('cinegenome_yugen_sound_v1',spinSound?'on':'off')}catch{}unlockSpinAudio();paintSpinSound()});
  paintSpinSound();
  const rand=n=>{if(n<=1)return 0;try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}catch{return Math.floor(Math.random()*n)}};
  const spinMetaText=r=>`${r.year||'YEAR —'} // ${r.sources.map(id=>id==='PURE'?'JP-01':'JP-02').join(' + ')} // ${r.dna?'DNA LINKED':'SOURCE ONLY'}`;
  function openSpin(){if(!visible.length)return;unlockSpinAudio();spinOverlay.hidden=false;requestAnimationFrame(()=>spinOverlay.classList.add('is-open'));spinPool.textContent=`POOL // ${String(visible.length).padStart(3,'0')}`;spinPick=null;spinOpen.disabled=true;spinCounter.textContent='STANDBY // 待機';spinTitle.textContent='PRESS SPIN';spinMeta.textContent='CURRENT FILTERS BECOME THE DRAW POOL.';spinTape.innerHTML=visible.slice(0,7).map(r=>`<span>${esc(r.title)}</span>`).join('');clearTimeout(spinStartTimer);spinStartTimer=setTimeout(()=>doSpin(),180)}
  function closeSpin(){clearTimeout(spinStartTimer);clearTimeout(spinTimer);spinning=false;spinStage.classList.remove('is-spinning','is-locked');spinOverlay.classList.remove('is-open');setTimeout(()=>spinOverlay.hidden=true,240)}
  function doSpin(){if(spinning||!visible.length)return;unlockSpinAudio();spinning=true;spinPick=null;spinOpen.disabled=true;spinStage.classList.add('is-spinning');spinCounter.textContent='抽選中 // SPINNING';let frame=0,total=Math.min(34,Math.max(24,visible.length>40?31:27));
    const tick=()=>{if(!spinning||spinOverlay.hidden)return;spinTone(940-(frame/total)*540);const r=visible[rand(visible.length)];spinTitle.textContent=r.title;spinMeta.textContent=spinMetaText(r);const tape=[];for(let i=0;i<7;i++)tape.push(visible[rand(visible.length)]);spinTape.innerHTML=tape.map((x,i)=>`<span${i===3?' class="is-hot"':''}>${esc(x.title)}</span>`).join('');frame++;if(frame<total){spinTimer=setTimeout(tick,42+Math.pow(frame/total,3)*190)}else{spinPick=visible[rand(visible.length)];spinTitle.textContent=spinPick.title;spinMeta.textContent=spinMetaText(spinPick);spinCounter.textContent='抽選完了 // SPECIMEN LOCKED';[440,660,880].forEach((f,i)=>spinTone(f,.16,i*.075,.025));spinStage.classList.remove('is-spinning');spinStage.classList.add('is-locked');setTimeout(()=>spinStage.classList.remove('is-locked'),520);spinOpen.disabled=false;spinning=false}};tick();
  }
  $('#ySpin').addEventListener('click',openSpin);$('#ySpinAgain').addEventListener('click',doSpin);spinOpen.addEventListener('click',()=>{if(!spinPick)return;renderDossier(spinPick);closeSpin();setTimeout(()=>dossier.scrollIntoView({behavior:'smooth',block:'start'}),260)});$$('[data-spin-close]').forEach(x=>x.addEventListener('click',closeSpin));

  const clock=()=>{try{$('#yClock').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())+' JST'}catch{}};clock();setInterval(clock,1000);
  const glitch=$('.y-glitch'),base=glitch.dataset.glitch,glyphs=['幽','玄','映','画','零','標','本','記','録','検','索','波'];
  function pulse(){const chars=[...base],spots=chars.map((c,i)=>/[A-Z]/.test(c)?i:-1).filter(i=>i>=0),n=Math.random()<.7?1:2;for(let j=0;j<n&&spots.length;j++){const p=spots.splice(rand(spots.length),1)[0];chars[p]=glyphs[rand(glyphs.length)]}glitch.textContent=chars.join('');glitch.classList.add('is-glitching');setTimeout(()=>{glitch.textContent=base;glitch.classList.remove('is-glitching')},105+Math.random()*70)}
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){setInterval(pulse,1820);glitch.addEventListener('mouseenter',pulse)}

  render();
  const boot=$('#yugenBoot'),bootLine=$('#yugenBootLine');
  setTimeout(()=>bootLine.textContent='JP-01 / JP-02 FEEDS MOUNTED // 資料源 接続済',360);
  setTimeout(()=>bootLine.textContent='YŪGEN ARCHIVE READY // 認証完了',760);
  setTimeout(()=>boot.classList.add('is-gone'),1180);
  setTimeout(()=>boot.remove(),1700);
})();

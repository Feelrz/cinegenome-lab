/* Home evidence is a local, opt-in-by-action trace of real lab operations.
   No inferred film result, account identifier, network call or secret is stored. */
(() => {
  'use strict';
  const key='cinegenome-home-evidence-v1';
  const movies=new Map((window.CINEGENOME_MOVIES||[])
    .filter(movie=>Number.isSafeInteger(movie?.id)&&movie.id>0)
    .map(movie=>[movie.id,movie]));
  document.querySelectorAll('[data-home-yugen]').forEach(button=>{
    button.addEventListener('click',()=>{
      if(button.classList.contains('is-decoding'))return;
      const enter=window.CINEGENOME_YUGEN?.enter;
      if(typeof enter!=='function')return;
      if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){enter();return;}
      button.classList.add('is-decoding');
      window.setTimeout(()=>{button.classList.remove('is-decoding');enter();},320);
    });
  });
  const host=document.querySelector('[data-home-memory]');
  if(!host)return;
  const memorySection=host.closest('.cg82-afterimage');
  const kinds={scan:'SCANNED SPECIMEN',crossbreed:'CROSSBREED SEALED',mutation:'MUTATION SAVED'};
  const expectedLength={scan:1,crossbreed:2,mutation:1};
  let persistable=true;

  function validated(raw){
    if(!raw||typeof raw!=='object'||!Object.hasOwn(expectedLength,raw.kind)||!Array.isArray(raw.ids)||raw.ids.length!==expectedLength[raw.kind])return null;
    const ids=raw.ids;
    if(!ids.every(id=>Number.isSafeInteger(id)&&movies.has(id)))return null;
    return {kind:raw.kind,ids:ids.slice()};
  }
  function read(){
    try{
      const saved=localStorage.getItem(key);
      if(!saved)return [];
      if(saved.length>2048)return [];
      const parsed=JSON.parse(saved);
      if(parsed?.v!==1||!Array.isArray(parsed.entries))return [];
      return parsed.entries.slice(0,3).map(validated).filter(Boolean);
    }catch{persistable=false;return []}
  }
  let entries=read();
  function sourceLabel(movie){
    if(movie.dnaSource==='editorial-researched-v1'&&movie.dnaEvidence?.coverage===12&&
       (window.CINEGENOME_DIMENSIONS||[]).length===12&&
       window.CINEGENOME_DIMENSIONS.every(axis=>movie.dnaEvidence.axes?.[axis.key]?.length))return 'SOURCE-REVIEWED EDITORIAL DNA';
    if(movie.dnaSource==='curated-starter-v1')return 'EDITORIAL DNA / SOURCE NOTES PENDING';
    if(movie.dnaSource==='legacy-curated-profile-v2')return 'LEGACY DNA / PARTIAL PROVENANCE';
    if(movie.dnaSource==='editorial-archetype-v1')return 'DERIVED ARCHETYPE / SOURCE REVIEW PENDING';
    if(movie.dnaSource==='tmdb-genome-v4')return 'METADATA-DERIVED DNA';
    return 'DNA STATUS / PROVISIONAL OR UNKNOWN';
  }
  const button=(label,route)=>{
    const el=document.createElement('button');el.type='button';el.textContent=label;
    el.dataset.homeTraceRoute=route;return el;
  };
  function render(){
    host.replaceChildren();
    if(memorySection&&!persistable)memorySection.querySelector('span').textContent='AFTERIMAGE / THIS SESSION';
    if(memorySection)memorySection.hidden=!entries.length;
    if(!entries.length){
      return;
    }
    const list=document.createElement('ol');list.className='cg81-trace-list';
    for(const entry of entries){
      const films=entry.ids.map(id=>movies.get(id));
      const item=document.createElement('li');item.className='cg81-trace-item';
      const copy=document.createElement('div');
      const name=document.createElement('b');
      name.textContent=`${kinds[entry.kind]} / ${films.map(f=>`${f.title} (${f.year||'YEAR UNKNOWN'})`).join(' × ')}`;
      const meta=document.createElement('small');
      meta.textContent=films.map(sourceLabel).join(' / ');
      copy.append(name,meta);
      const route=entry.kind==='scan'?'scanner':entry.kind==='crossbreed'?'crossbreed':'mutation';
      item.append(copy,button('OPEN ROOM ↗',route));list.append(item);
    }
    host.append(list);
  }
  render();
  window.addEventListener('cinegenome:home-trace',event=>{
    const trace=validated(event.detail);
    if(!trace)return;
    entries=[trace,...entries.filter(e=>e.kind!==trace.kind||e.ids.join(',')!==trace.ids.join(','))].slice(0,3);
    try{localStorage.setItem(key,JSON.stringify({v:1,entries}))}
    catch{persistable=false}
    render();
  });
  host.addEventListener('click',event=>{
    const route=event.target.closest('[data-home-trace-route]')?.dataset.homeTraceRoute;
    if(!['scanner','crossbreed','mutation'].includes(route))return;
    const target=document.querySelector(`.module-btn[data-view="${route}"],.m-primary-tabs [data-primary-view="${route}"],.m-bottom-nav [data-target="${route}"]`);
    target?.click();
  });

})();

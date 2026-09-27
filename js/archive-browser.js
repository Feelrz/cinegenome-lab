/* Saved films and experimental vectors share storage, but have distinct meaning. */
(() => {
  'use strict';
  const views=new WeakMap();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const known=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100;
  const dateLabel=v=>{const d=new Date(v);return v&&!Number.isNaN(d.getTime())?d.toLocaleString():'DATE UNAVAILABLE'};
  function render(host,data){
    if(!host)return;
    let view=views.get(host);
    if(!view){view={tab:'films',query:'',kind:'all',data};views.set(host,view)}
    view.data=data;
    const films=(data.favorites||[]).filter(Boolean),experiments=(data.experiments||[]).filter(x=>x&&typeof x==='object');
    if(!host.querySelector('[data-archive-results]')){
      host.innerHTML=`<div class="cg83-archive-tabs" role="group" aria-label="Archive category"><button type="button" data-archive-tab="films">SAVED FILMS</button><button type="button" data-archive-tab="experiments">EXPERIMENTS</button></div>
        <div class="cg83-archive-tools"><label><span>SEARCH THIS SHELF</span><input type="search" data-archive-search placeholder="Title, director or experiment" autocomplete="off"></label><label data-archive-kind-label hidden><span>EXPERIMENT TYPE</span><select data-archive-kind><option value="all">ALL TYPES</option><option value="CROSSBREED">CROSSBREED</option><option value="MUTATION">MUTATION</option></select></label></div>
        <p class="cg83-archive-caption" data-archive-caption aria-live="polite"></p><div class="cg83-archive-results" data-archive-results></div>`;
      host.addEventListener('input',e=>{if(e.target.matches('[data-archive-search]')){view.query=e.target.value;paint()}});
      host.addEventListener('change',e=>{if(e.target.matches('[data-archive-kind]')){view.kind=e.target.value;paint()}});
      host.addEventListener('click',e=>{
        const tab=e.target.closest('[data-archive-tab]');
        if(tab){view.tab=tab.dataset.archiveTab;paint();return}
        const scan=e.target.closest('[data-archive-scan]');
        if(scan){const movie=view.data.favorites.find(m=>String(m.id)===scan.dataset.archiveScan);if(movie)view.data.onScan?.(movie)}
      });
    }
    function paint(){
      const data=view.data,films=(data.favorites||[]).filter(Boolean),experiments=(data.experiments||[]).filter(x=>x&&typeof x==='object');
      for(const tab of host.querySelectorAll('[data-archive-tab]')){
        const isFilm=tab.dataset.archiveTab==='films';
        tab.textContent=`${isFilm?'SAVED FILMS':'EXPERIMENTS'} / ${isFilm?films.length:experiments.length}`;
        tab.setAttribute('aria-pressed',String(tab.dataset.archiveTab===view.tab));
      }
      const q=view.query.trim().toLowerCase(),results=host.querySelector('[data-archive-results]');
      host.querySelector('[data-archive-kind-label]').hidden=view.tab==='films';
      const pool=view.tab==='films'?films:experiments;
      const rows=pool.filter(row=>(view.tab==='films'||view.kind==='all'||row.type===view.kind)&&[row.title,row.director,row.year,row.type,row.detail].join(' ').toLowerCase().includes(q));
      host.querySelector('[data-archive-caption]').textContent=`${rows.length} OF ${pool.length} RECORDS / ${view.tab==='films'?'Films saved from Scanner. Open one to examine it.':'Stored experiment snapshots, newest first. Expand a vector to inspect its saved values.'}`;
      if(!rows.length){results.innerHTML=`<p class="cg83-archive-empty">${pool.length?'NO MATCHING RECORDS. Try another search.':view.tab==='films'?'THIS SHELF IS EMPTY. Save a film in Specimen Scanner.':'NO EXPERIMENTS SEALED. Run Crossbreed or save a Mutation.'}</p>`;return}
      results.innerHTML=rows.map(row=>{
        if(view.tab==='films')return `<article class="cg83-archive-row"><div><small>SAVED SPECIMEN</small><h3>${esc(row.title||'UNTITLED')}</h3><p>${esc(row.year||'YEAR UNKNOWN')} / ${esc(row.director||'DIRECTOR UNKNOWN')}</p></div><button type="button" data-archive-scan="${esc(row.id)}">OPEN DOSSIER ↗</button></article>`;
        const axes=(window.CINEGENOME_DIMENSIONS||[]).map(d=>({...d,value:row.dna?.[d.key]}));
        const covered=axes.filter(d=>known(d.value)).length;
        return `<article class="cg83-archive-row is-experiment"><div><small>${esc(row.type||'EXPERIMENT')} / ${esc(dateLabel(row.at))}</small><h3>${esc(row.title||'UNTITLED EXPERIMENT')}</h3><p>${esc(row.detail||'No experiment notes recorded.')}</p></div>
          <details><summary>SAVED VECTOR / ${covered}/${axes.length} AXES</summary><dl class="cg83-vector-list">${axes.map(d=>`<div><dt>${esc(d.label)}</dt><dd>${known(d.value)?d.value:'UNKNOWN'}</dd></div>`).join('')}</dl><p>A snapshot of the synthetic profile at the time of saving.</p></details></article>`;
      }).join('');
    }
    paint();
  }
  window.CINEGENOME_ARCHIVE={render};
})();

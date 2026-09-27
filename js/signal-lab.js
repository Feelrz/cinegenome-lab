/* Optional read-only experiments on the existing 12-axis film DNA model. */
(() => {
  'use strict';
  const axes=Array.isArray(window.CINEGENOME_DIMENSIONS)?window.CINEGENOME_DIMENSIONS:[];
  const archive=Array.isArray(window.CINEGENOME_ENRICHED_TOP500)?window.CINEGENOME_ENRICHED_TOP500:[];
  const complete=film=>axes.length===12&&axes.every(axis=>{
    const value=film?.dna?.[axis.key];
    return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100;
  });
  const films=archive.filter(complete);
  const identity=film=>`${film.sourceId ?? ''}|${film.title}|${film.year}`;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const hash=value=>{let n=2166136261;for(const char of value){n^=char.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0};
  const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const distance=(a,b)=>axes.reduce((sum,axis)=>sum+Math.abs(a.dna[axis.key]-b.dna[axis.key]),0)/axes.length;
  const order=(a,b)=>identity(a).localeCompare(identity(b),'en');
  const selected=index=>films[(hash(`${day()}|signal-lab`)+index)%films.length];
  function constellation(index){
    if(films.length<3)return null;
    const source=selected(index),remaining=films.filter(film=>identity(film)!==identity(source));
    remaining.sort((a,b)=>distance(source,a)-distance(source,b)||order(a,b));
    const echo=remaining[0],inverse=remaining[remaining.length-1];
    if(!echo||!inverse||identity(echo)===identity(inverse))return null;
    const deltas=axes.map((axis,i)=>({label:axis.label,index:i,near:Math.abs(source.dna[axis.key]-echo.dna[axis.key]),far:Math.abs(source.dna[axis.key]-inverse.dna[axis.key])}));
    const shared=deltas.slice().sort((a,b)=>a.near-b.near||a.index-b.index)[0];
    const split=deltas.slice().sort((a,b)=>b.far-a.far||a.index-b.index)[0];
    return {source,echo,inverse,shared,split,nearDistance:distance(source,echo),farDistance:distance(source,inverse)};
  }
  let dialog,body,mode='ghost',nonce=0,audioContext=null,timers=[];
  function stop(){
    for(const timer of timers)clearTimeout(timer);
    timers=[];
    if(audioContext){audioContext.close().catch(()=>{});audioContext=null}
    body?.querySelectorAll('.signal-axis.is-playing').forEach(row=>row.classList.remove('is-playing'));
  }
  const trace=(film,color)=>{
    const points=axes.map((axis,i)=>`${18+i*26},${90-film.dna[axis.key]*.69}`).join(' ');
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.6" vector-effect="non-scaling-stroke"/>`;
  };
  function renderGhost(){
    const report=constellation(nonce);
    if(!report){body.innerHTML='<p class="signal-empty">GENOME COVERAGE INSUFFICIENT // NO FILMS WITH COMPLETE 12-AXIS DNA.</p>';return}
    const {source,echo,inverse,shared,split,nearDistance,farDistance}=report;
    body.innerHTML=`<span class="signal-kicker">PHANTOM://REEL · 12-AXIS ARCHIVE TRACE</span>
      <h2>THE ARCHIVE HAS <em>A DOUBLE.</em></h2>
      <p class="signal-explain">One film, its nearest genome trace, and the most distant signal in the loaded catalog. All distances use the same twelve CineGenome model axes.</p>
      <svg class="signal-plot" viewBox="0 0 326 110" role="img" aria-label="Three film DNA traces across twelve axes">
        <path d="M18 55H304 M18 20H304 M18 90H304" stroke="#486441" stroke-width="1" stroke-dasharray="3 6"/>
        ${trace(source,'#dfff9c')}${trace(echo,'#77d8da')}${trace(inverse,'#ff896e')}</svg>
      <div class="signal-result"><article><small>00 / SOURCE</small><strong>${esc(source.title)}</strong><span>${esc(source.year)}</span></article>
      <article><small>01 / NEAREST ECHO</small><strong>${esc(echo.title)}</strong><span>MEAN AXIS DISTANCE Δ${nearDistance.toFixed(1)}</span></article>
      <article><small>02 / FARTHEST SIGNAL</small><strong>${esc(inverse.title)}</strong><span>MEAN AXIS DISTANCE Δ${farDistance.toFixed(1)}</span></article></div>
      <p class="signal-reading">CLOSEST AXIS // ${esc(shared.label.toUpperCase())} Δ${shared.near.toFixed(1)}<br>
      WIDEST FRACTURE // ${esc(split.label.toUpperCase())} Δ${split.far.toFixed(1)}</p>
      <button class="signal-retune" type="button" data-signal-retune>RETUNE ARCHIVE FREQUENCY ↗</button>
      <small class="signal-disclaimer">MODEL-INFERRED DNA // ${films.length} COMPLETE FILMS // DISTANCE ≠ RELATIONSHIP OR RATING</small>`;
  }
  function renderSonic(){
    if(!films.length){body.innerHTML='<p class="signal-empty">GENOME COVERAGE INSUFFICIENT // AUDIO SEQUENCE UNAVAILABLE.</p>';return}
    const film=selected(nonce);
    body.innerHTML=`<span class="signal-kicker">SYNAPSE://12 · GENOME SONIFICATION</span>
      <h2>HEAR THE <em>GENOME.</em></h2>
      <p class="signal-explain">Twelve CineGenome model values drive twelve sequential tones. Pitch and loudness are derived from the displayed values; this is an experiment, not a film soundtrack.</p>
      <div class="signal-subject"><small>ACQUIRED SIGNAL / ${esc(film.year)}</small><strong>${esc(film.title)}</strong></div>
      <div class="signal-axes">${axes.map((axis,i)=>`<div class="signal-axis" data-tone-index="${i}"><span>${String(i+1).padStart(2,'0')} ${esc(axis.label.toUpperCase())}</span><i><b style="width:${film.dna[axis.key]}%"></b></i><strong>${film.dna[axis.key]}</strong></div>`).join('')}</div>
      <div class="signal-actions"><button type="button" data-signal-play>▶ EXECUTE AUDIO TRACE</button><button type="button" data-signal-stop>■ STOP</button><button type="button" data-signal-retune>↻ NEW SPECIMEN</button></div>
      <p class="signal-status" role="status" aria-live="polite">AUDIO CHANNEL IDLE // USER ACTION REQUIRED</p>
      <small class="signal-disclaimer">MODEL-INFERRED DNA // 12/12 AXES VERIFIED // NO AUDIO AUTOPLAY</small>`;
  }
  function render(){if(!body)return;mode==='ghost'?renderGhost():renderSonic()}
  async function play(){
    stop();const film=selected(nonce);
    const status=body.querySelector('.signal-status');
    const Ctor=window.AudioContext||window.webkitAudioContext;
    if(!Ctor){if(status)status.textContent='AUDIO UNAVAILABLE // VISUAL SIGNAL REMAINS';return}
    try{audioContext=new Ctor();await audioContext.resume()}
    catch {if(status)status.textContent='AUDIO BLOCKED // ENABLE SOUND IN YOUR BROWSER';stop();return}
    if(!dialog?.open||mode!=='sonic'||!audioContext)return;
    if(status)status.textContent='TRANSLATING MODEL VALUES INTO AUDIO…';
    axes.forEach((axis,i)=>{
      const value=film.dna[axis.key],begin=audioContext.currentTime+i*.23;
      const freq=170*Math.pow(2,i/12)*(.85+value/320);
      const osc=audioContext.createOscillator(),gain=audioContext.createGain();
      osc.type=i%3===0?'triangle':'sine';osc.frequency.setValueAtTime(freq,begin);
      gain.gain.setValueAtTime(.0001,begin);
      gain.gain.linearRampToValueAtTime(.015+value*.00045,begin+.04);
      gain.gain.exponentialRampToValueAtTime(.0001,begin+.21);
      osc.connect(gain);gain.connect(audioContext.destination);osc.start(begin);osc.stop(begin+.22);
      timers.push(setTimeout(()=>body?.querySelector(`[data-tone-index="${i}"]`)?.classList.add('is-playing'),i*230));
      timers.push(setTimeout(()=>body?.querySelector(`[data-tone-index="${i}"]`)?.classList.remove('is-playing'),i*230+210));
    });
    timers.push(setTimeout(()=>{if(status)status.textContent='TRACE COMPLETE // ALL TWELVE AXES TRANSMITTED';stop()},axes.length*230+350));
  }
  function init(){
    dialog=document.createElement('dialog');dialog.className='signal-dialog';dialog.setAttribute('aria-label','CineGenome restricted signal experiment');
    dialog.innerHTML='<section class="signal-shell"><header><span>CG-09 // SIGNAL EXPERIMENT</span><button type="button" data-signal-close aria-label="Close signal experiment">×</button></header><div class="signal-body"></div></section>';
    document.body.appendChild(dialog);body=dialog.querySelector('.signal-body');
    dialog.querySelector('[data-signal-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',stop);
    dialog.addEventListener('click',event=>{
      if(event.target.closest('[data-signal-retune]')){stop();nonce++;render()}
      else if(event.target.closest('[data-signal-play]'))play();
      else if(event.target.closest('[data-signal-stop]')){stop();const s=body.querySelector('.signal-status');if(s)s.textContent='AUDIO CHANNEL STOPPED'}
    });
  }
  window.CINEGENOME_SIGNAL_LAB={open(nextMode){
    if(!dialog)init();stop();mode=nextMode==='sonic'?'sonic':'ghost';nonce=0;render();
    if(!dialog.open)dialog.showModal();dialog.querySelector('[data-signal-close]').focus();
  }};
})();

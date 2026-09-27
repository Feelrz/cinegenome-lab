/* Readouts only: these functions never score, match or mutate a genome. */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const known=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100;
  function differential(host,left,right,{title='SIGNAL DIFFERENTIAL',leftLabel='A',rightLabel='B',middle=null,similar=false}={}){
    if(!host)return;
    const axes=window.CINEGENOME_DIMENSIONS||[];
    const rows=axes.map((axis,index)=>({...axis,index,a:left?.[axis.key],b:right?.[axis.key]}))
      .filter(row=>known(row.a)&&known(row.b)).map(row=>({...row,delta:Math.abs(row.a-row.b)}));
    rows.sort((a,b)=>(similar?a.delta-b.delta:b.delta-a.delta)||a.index-b.index);
    const fmt=v=>known(v)?Number(v.toFixed(1)).toString():'UNKNOWN';
    host.innerHTML=`<div class="cg83-instrument-head"><strong>${esc(title)}</strong><span>${rows.length}/${axes.length} AXES COMPARABLE</span></div>
      ${rows.length?`<table class="cg83-differential"><thead><tr><th scope="col">SIGNAL</th><th scope="col">${esc(leftLabel)}</th>${middle?'<th scope="col">BLEND</th>':''}<th scope="col">${esc(rightLabel)}</th><th scope="col">Δ</th></tr></thead><tbody>${rows.slice(0,3).map(row=>`<tr><th scope="row">${esc(row.label)}</th><td>${fmt(row.a)}</td>${middle?`<td class="is-blend">${fmt(middle[row.key])}</td>`:''}<td>${fmt(row.b)}</td><td>${fmt(row.delta)}</td></tr>`).join('')}</tbody></table>`:'<p class="cg83-instrument-empty">INSUFFICIENT DATA / No comparable axes.</p>'}`;
  }
  window.CINEGENOME_INSTRUMENTS={differential,known};
})();

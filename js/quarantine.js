/* CG-000: one hidden dossier, three curated D-300 transmissions per local day. */
(() => {
  'use strict';
  const pool=Array.isArray(window.CINEGENOME_DEAD_CHANNEL)?window.CINEGENOME_DEAD_CHANNEL:[];
  const byRank=new Map(pool.map(item=>[item.rank,item]));
  const groups=[
    [{rank:190,note:'A handmade action signal that refuses to behave like anything in the main archive.'},
     {rank:197,note:'A peculiar transmission from the edge of the children’s-film frequency.'},
     {rank:213,note:'A counterculture detour with no interest in a straight route.'},
     {rank:235,note:'An impossible premise that keeps rolling long after the joke should stop.'},
     {rank:247,note:'Unstable winter imagery and a wonderfully strange handmade pulse.'},
     {rank:269,note:'A giant signal from a very different corner of cinema history.'}],
    [{rank:179,note:'An odd creature feature picked up by the wrong receiver.'},
     {rank:184,note:'Cosmic spectacle held together by pure cult-film nerve.'},
     {rank:210,note:'A surreal station where the film signal refuses to settle.'},
     {rank:211,note:'An eccentric superhero crossover far off the familiar map.'},
     {rank:254,note:'Action, possession and excessive energy on the same reel.'},
     {rank:258,note:'A creature you might wish had stayed inside its container.'}],
    [{rank:239,note:'An outrageous physical-world transmission with the dial turned past safe.'},
     {rank:253,note:'A domestic object with a deeply suspicious presence.'},
     {rank:255,note:'A strange craving embedded in the image.'},
     {rank:256,note:'A wild, unruly animal signal with an unusually tangible presence.'},
     {rank:285,note:'A masked midnight detour caught on a damaged channel.'},
     {rank:290,note:'A future vision that looks like it escaped the archive entirely.'}]
  ];
  const hash=text=>{let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0};
  const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=value=>String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  const select=date=>groups.map((items,i)=>items[hash(`${date}|CG-000|${i}`)%items.length]).filter(item=>byRank.has(item.rank));
  let dossier;
  function open(){
    if(!dossier){
      dossier=document.createElement('dialog');
      dossier.className='quarantine-dialog';dossier.setAttribute('aria-labelledby','quarantineTitle');
      dossier.innerHTML=`<div class="quarantine-shell"><header><span>CG-000 // CLASSIFIED</span><button type="button" data-quarantine-close aria-label="Close quarantine file">×</button></header><div class="quarantine-body"></div></div>`;
      document.body.appendChild(dossier);
      dossier.querySelector('[data-quarantine-close]').addEventListener('click',()=>dossier.close());
      dossier.addEventListener('click',e=>{
        const button=e.target.closest('[data-quarantine-rank]');if(!button)return;
        const rank=Number(button.dataset.quarantineRank);
        if(!byRank.has(rank))return;
        dossier.close();
        document.dispatchEvent(new CustomEvent('cinegenome:quarantine-film',{detail:{rank}}));
      });
    }
    const date=day(),signals=select(date);
    dossier.querySelector('.quarantine-body').innerHTML=`
      <span class="quarantine-kicker">QUARANTINE FILE // FOUND IN THE SPACE BETWEEN SPECIMENS</span>
      <h2 id="quarantineTitle">THE <em>UNFILMED</em></h2>
      <div class="quarantine-meta"><span>DIRECTOR // NO RECORD</span><span>FIRST SCAN // TOMORROW</span><span>TRANSMISSION // ${escapeHtml(date)}</span></div>
      <p class="quarantine-lead">Three operators described the same final scene. None could agree on who was watching it.</p>
      <p class="quarantine-report">The missing film has no poster. Its signal bleeds into existing cinema instead. These three real, off-catalog specimens were intercepted in the search. Return tomorrow to retune the receiver.</p>
      <div class="quarantine-subhead">THREE OBSCURE SIGNALS // TODAY</div>
      <div class="quarantine-signals">${signals.map((entry,i)=>{
        const film=byRank.get(entry.rank);
        return `<button type="button" data-quarantine-rank="${entry.rank}" aria-label="Open dossier for ${escapeHtml(film.title)}"><small>0${i+1} // D${String(entry.rank).padStart(3,'0')}</small><strong>${escapeHtml(film.title)}</strong><span>${escapeHtml(entry.note)}</span><b>OPEN D-300 DOSSIER ↗</b></button>`;
      }).join('')}</div>
      <small class="quarantine-disclaimer">CURATED FROM THE WEIRD / D-300 ARCHIVE // COORDINATES ARE ARCHIVE POSITIONS, NOT RATINGS.</small>`;
    if(!dossier.open)dossier.showModal();
  }
  window.CINEGENOME_QUARANTINE={open,select,normalize};
  const mobileTrigger=document.getElementById('mSpecimenCodeBtn');
  if(!mobileTrigger)return;
  const terminal=document.createElement('dialog');terminal.className='quarantine-terminal';terminal.setAttribute('aria-labelledby','quarantineTerminalTitle');
  terminal.innerHTML=`<form class="quarantine-terminal-shell"><header><span id="quarantineTerminalTitle">SPECIMEN ACCESS TERMINAL</span><button type="button" data-terminal-close aria-label="Close specimen terminal">×</button></header><div><label for="quarantineCodeInput">ENTER SPECIMEN CODE</label><input id="quarantineCodeInput" autocomplete="off" spellcheck="false" placeholder="CG-____"><p class="quarantine-terminal-status" aria-live="polite">AWAITING CODE… // CASE ZERO: CG-000</p><button type="submit">AUTHENTICATE</button></div></form>`;
  document.body.appendChild(terminal);
  mobileTrigger.addEventListener('click',()=>{terminal.querySelector('input').value='';terminal.querySelector('.quarantine-terminal-status').textContent='AWAITING CODE… // CASE ZERO: CG-000';terminal.showModal();terminal.querySelector('input').focus()});
  terminal.querySelector('[data-terminal-close]').addEventListener('click',()=>terminal.close());
  terminal.querySelector('form').addEventListener('submit',e=>{
    e.preventDefault();const code=normalize(terminal.querySelector('input').value);
    if(code==='CG000'){terminal.close();open()}
    else if(code==='DEAD300'){terminal.close();document.dispatchEvent(new CustomEvent('cinegenome:quarantine-weird'))}
    else terminal.querySelector('.quarantine-terminal-status').textContent='SPECIMEN DOES NOT EXIST. STOP LOOKING FOR IT.';
  });
})();

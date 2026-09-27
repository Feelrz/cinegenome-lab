(() => {
  'use strict';
  const API = '/api/notes';
  const board = document.getElementById('wallBoard');
  const totalEl = document.getElementById('wallTotal');
  const dialog = document.getElementById('wallNoteDialog');
  const shuffleBtn = document.getElementById('wallShuffle');
  let notes = [];
  let seed = `${Date.now()}-${Math.random()}`;
  let known = new Set();
  let initialized = false;
  let shuffleTimer = 0;

  const introTransition = (() => {
    try {
      const flagged = sessionStorage.getItem('cg_lab_wall_intro') === '1';
      if (flagged) sessionStorage.removeItem('cg_lab_wall_intro');
      return flagged;
    } catch { return false; }
  })();
  if (introTransition) {
    document.body.classList.add('wall-landing');
    window.setTimeout(() => document.body.classList.add('is-ready'), 150);
  }

  function bindReturnToLab(){
    document.querySelectorAll('a[href^="index.html"]').forEach(link=>{
      link.addEventListener('click',event=>{
        if(event.defaultPrevented||(event.button&&event.button!==0)||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        event.preventDefault();
        try{
          sessionStorage.setItem('cg_return_to_lab','lab-wall');
          sessionStorage.setItem('cinegenome_boot_seen','1');
        }catch{}
        document.body.classList.add('wall-returning-to-lab');
        const delay=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:360;
        window.setTimeout(()=>window.location.assign(link.href),delay);
      });
    });
  }
  bindReturnToLab();

  function hash32(text){let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function rotation(id){return (((hash32(`${seed}|${id}`)%61)-30)/10).toFixed(1)}
  function cardScale(id){return (0.97+(hash32(`${seed}|scale|${id}`)%7)*.01).toFixed(2)}
  function tapeX(id){return `${38+(hash32(`${seed}|tape|${id}`)%25)}%`}
  function tapeRot(id){return `${((hash32(`${seed}|tape-rot|${id}`)%61)-30)/10}deg`}
  function letterboxdUrl(name){return `https://letterboxd.com/${encodeURIComponent(name)}/`}
  function identity(note){
    const type=note.identityType||(note.letterboxd?'letterboxd':'anonymous');
    const value=String(note.identityValue??note.letterboxd??'');
    return type==='letterboxd'&&/^[A-Za-z0-9_-]{1,30}$/.test(value)
      ? {text:`@${value}`,url:letterboxdUrl(value)}
      : {text:type==='name'&&value?value:'ANONYMOUS',url:null};
  }
  function formatTime(ms){const d=new Date(Number(ms)||Date.now());const p=n=>String(n).padStart(2,'0');return `${p(d.getDate())}.${p(d.getMonth()+1)}.${String(d.getFullYear()).slice(-2)} / ${p(d.getHours())}:${p(d.getMinutes())}`}
  function shuffled(list=notes){return list.slice().sort((a,b)=>hash32(`${seed}|${a.id}`)-hash32(`${seed}|${b.id}`))}

  let noteCloseTimer=0;
  function closeDetail(){
    if(!dialog?.open)return;
    clearTimeout(noteCloseTimer);
    dialog.classList.remove('is-note-open');
    dialog.classList.add('is-note-closing');
    noteCloseTimer=window.setTimeout(()=>{
      if(dialog?.open)dialog.close();
      dialog?.classList.remove('is-note-open','is-note-closing');
    },370);
  }

  function openDetail(note,sourceEl=null){
    if(!dialog||!note)return;
    document.getElementById('wallNoteMeta').textContent=`LAB NOTE // ${String(note.id).replace(/^N-/,'#').slice(0,12)}`;
    document.getElementById('wallNoteMessage').textContent=note.message;
    const author=document.getElementById('wallNoteAuthor');const who=identity(note);author.textContent=who.text+(who.url?' ↗':'');if(who.url)author.href=who.url;else author.removeAttribute('href');
    document.getElementById('wallNoteTime').textContent=`TRANSMITTED // ${formatTime(note.createdAt)}`;
    clearTimeout(noteCloseTimer);
    if(!dialog.open)dialog.showModal();
    dialog.classList.remove('is-note-open','is-note-closing');
    if(sourceEl){
      const rect=sourceEl.getBoundingClientRect();
      const rawX=(rect.left+rect.width/2-window.innerWidth/2)*0.14;
      const rawY=(rect.top+rect.height/2-window.innerHeight/2)*0.14;
      dialog.style.setProperty('--wall-note-origin-x',`${Math.round(Math.max(-74,Math.min(74,rawX)))}px`);
      dialog.style.setProperty('--wall-note-origin-y',`${Math.round(Math.max(-48,Math.min(48,rawY)))}px`);
    }else{
      dialog.style.setProperty('--wall-note-origin-x','0px');
      dialog.style.setProperty('--wall-note-origin-y','20px');
    }
    requestAnimationFrame(()=>requestAnimationFrame(()=>dialog.classList.add('is-note-open')));
  }

  function makeCard(note,index,{fresh=false}={}){
    const card=document.createElement('button');
    card.type='button';
    card.className='wall-card'+(fresh?' is-fresh':'');
    card.dataset.noteId=note.id;
    card.style.setProperty('--r',`${rotation(note.id)}deg`);
    card.style.setProperty('--s',cardScale(note.id));
    card.style.setProperty('--tape-x',tapeX(note.id));
    card.style.setProperty('--tape-r',tapeRot(note.id));
    card.style.setProperty('--wall-delay',`${Math.min(index,18)*60}ms`);
    card.setAttribute('aria-label',`Open note from ${identity(note).text}`);
    const meta=document.createElement('span');meta.className='wall-card-meta';meta.textContent=`LAB NOTE // ${String(note.id).replace(/^N-/,'#').slice(0,8)}`;
    const body=document.createElement('p');body.textContent=note.message;
    const by=document.createElement('span');by.className='wall-card-author';by.textContent=identity(note).text;
    card.append(meta,body,by);
    card.addEventListener('click',()=>openDetail(note,card));
    return card;
  }

  function renderInitial(){
    if(!board)return;
    board.innerHTML='';
    if(!notes.length){
      const e=document.createElement('div');e.className='wall-loading';e.textContent='NO PUBLIC TRANSMISSIONS YET. BE THE FIRST SUBJECT TO PIN ONE.';board.appendChild(e);return;
    }
    shuffled().forEach((note,index)=>board.appendChild(makeCard(note,index)));
  }

  function syncIncremental(incoming){
    if(!board)return;
    const incomingMap=new Map(incoming.map(n=>[n.id,n]));
    const fresh=incoming.filter(n=>!known.has(n.id));
    const removed=[...known].filter(id=>!incomingMap.has(id));

    removed.forEach(id=>{
      const card=board.querySelector(`.wall-card[data-note-id="${CSS.escape(id)}"]`);
      if(!card)return;
      card.classList.add('is-removing');
      window.setTimeout(()=>card.remove(),850);
    });

    // New transmissions enter softly without rebuilding or reshuffling the wall.
    // The random seed only changes on a true page refresh or the explicit RESHUFFLE button.
    fresh.slice().reverse().forEach((note,index)=>{
      const card=makeCard(note,index,{fresh:true});
      board.prepend(card);
    });
  }

  async function fetchNotes(){
    try{
      let incoming=[]; let incomingTotal=0;
      if(Array.isArray(window.CG_LAB_NOTES_DEMO)){
        incoming=window.CG_LAB_NOTES_DEMO.slice();incomingTotal=incoming.length;
      }else{
        const res=await fetch(`${API}?limit=500&_=${Date.now()}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!res.ok)throw new Error('offline');
        const data=await res.json();incoming=Array.isArray(data.notes)?data.notes:[];incomingTotal=Number(data.total)||incoming.length;
      }
      incoming.sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
      if(!initialized){
        notes=incoming;known=new Set(notes.map(n=>n.id));initialized=true;renderInitial();
      }else{
        const changed=incoming.length!==notes.length||incoming.some((n,i)=>notes[i]?.id!==n.id);
        if(changed) syncIncremental(incoming);
        notes=incoming;known=new Set(notes.map(n=>n.id));
      }
      if(totalEl)totalEl.textContent=incomingTotal||notes.length;
    }catch{
      if(!initialized&&board)board.innerHTML='<div class="wall-loading">PUBLIC WALL SIGNAL OFFLINE // TRY AGAIN LATER.</div>';
      if(!initialized&&totalEl)totalEl.textContent='—';
    }
  }

  function reshuffleWall(){
    if(!board||!notes.length)return;
    clearTimeout(shuffleTimer);
    board.classList.add('is-reshuffling');
    shuffleTimer=window.setTimeout(()=>{
      seed=`${Date.now()}-${Math.random()}`;
      renderInitial();
      requestAnimationFrame(()=>requestAnimationFrame(()=>board.classList.remove('is-reshuffling')));
    },420);
  }

  shuffleBtn?.addEventListener('click',reshuffleWall);
  document.getElementById('wallNoteClose')?.addEventListener('click',closeDetail);
  dialog?.addEventListener('close',()=>{clearTimeout(noteCloseTimer);dialog.classList.remove('is-note-open','is-note-closing')});
  dialog?.addEventListener('click',e=>{if(e.target===dialog)closeDetail()});
  dialog?.addEventListener('cancel',e=>{e.preventDefault();closeDetail()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)fetchNotes()});
  fetchNotes();
  setInterval(()=>{if(!document.hidden)fetchNotes()},30000);
})();

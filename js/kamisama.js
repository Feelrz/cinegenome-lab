(() => {
  'use strict';
  const API='/api/notes';
  const $=s=>document.querySelector(s);
  const tokenInput=$('#adminToken'),unlock=$('#adminUnlock'),status=$('#adminStatus'),panel=$('#adminPanel'),login=$('#adminLogin'),list=$('#adminList'),search=$('#adminSearch'),total=$('#adminTotal');
  let token=''; let notes=[]; let armTimer=0;
  try{token=sessionStorage.getItem('cg_notes_admin_token')||'';if(token)tokenInput.value=token}catch{}
  function setStatus(msg,type=''){status.textContent=msg;status.className=`notes-admin-status${type?' is-'+type:''}`}
  function escReg(s){return String(s||'').toLowerCase()}
  function rot(id){let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))|0;return ((Math.abs(h)%25)-12)/10}
  function fmt(ms){const d=new Date(Number(ms)||Date.now());return d.toLocaleString(undefined,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
  function render(){
    const q=escReg(search.value);const visible=notes.filter(n=>!q||escReg(`${n.id} ${n.message} ${n.letterboxd}`).includes(q));
    list.innerHTML='';
    if(!visible.length){list.innerHTML='<div class="notes-admin-empty">NO NOTES MATCH THIS FILTER.</div>';return}
    for(const n of visible){
      const card=document.createElement('article');card.className='admin-note';card.style.setProperty('--r',`${rot(n.id)}deg`);
      const meta=document.createElement('div');meta.className='admin-note-meta';meta.textContent=`${n.id} // ${fmt(n.createdAt)}`;
      const msg=document.createElement('div');msg.className='admin-note-message';msg.textContent=n.message;
      const foot=document.createElement('div');foot.className='admin-note-footer';
      const author=document.createElement('a');author.href=`https://letterboxd.com/${encodeURIComponent(n.letterboxd)}/`;author.target='_blank';author.rel='noopener noreferrer';author.textContent=`/${n.letterboxd} ↗`;
      const actions=document.createElement('div');actions.className='admin-note-actions';
      const del=document.createElement('button');del.type='button';del.className='admin-note-delete';del.textContent='DELETE';
      del.addEventListener('click',async()=>{
        if(!del.classList.contains('is-armed')){clearTimeout(armTimer);document.querySelectorAll('.admin-note-delete.is-armed').forEach(b=>{b.classList.remove('is-armed');b.textContent='DELETE'});del.classList.add('is-armed');del.textContent='CONFIRM';armTimer=setTimeout(()=>{del.classList.remove('is-armed');del.textContent='DELETE'},3500);return}
        clearTimeout(armTimer);del.disabled=true;card.classList.add('is-deleting');
        try{const res=await fetch(`${API}?id=${encodeURIComponent(n.id)}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||`HTTP_${res.status}`);notes=notes.filter(x=>x.id!==n.id);total.textContent=String(notes.length);card.remove();if(!list.children.length)render();setStatus(`DELETED // ${n.id}`,'ok')}catch(err){card.classList.remove('is-deleting');del.disabled=false;del.classList.remove('is-armed');del.textContent='DELETE';setStatus(`DELETE FAILED // ${err.message}`,'error')}
      });
      actions.append(del);foot.append(author,actions);card.append(meta,msg,foot);list.append(card);
    }
  }
  async function load({unlocking=false}={}){
    if(!token){setStatus('ENTER ADMIN TOKEN.','error');return}
    setStatus(unlocking?'VERIFYING MODERATION TOKEN…':'REFRESHING WALL…');
    try{const res=await fetch(`${API}?admin=1&limit=500&_=${Date.now()}`,{cache:'no-store',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||`HTTP_${res.status}`);notes=Array.isArray(data.notes)?data.notes:[];total.textContent=String(Number(data.total)||notes.length);panel.hidden=false;login.classList.add('is-unlocked');try{sessionStorage.setItem('cg_notes_admin_token',token)}catch{}render();setStatus(`ADMIN LINK VERIFIED // ${notes.length} NOTES LOADED`,'ok')}catch(err){panel.hidden=true;setStatus(err.message==='admin_required'?'INVALID ADMIN TOKEN.':`ADMIN LINK ERROR // ${err.message}`,'error')}
  }
  unlock.addEventListener('click',()=>{token=tokenInput.value.trim();load({unlocking:true})});
  tokenInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();unlock.click()}});
  $('#adminRefresh').addEventListener('click',()=>load());
  $('#adminLock').addEventListener('click',()=>{token='';tokenInput.value='';notes=[];list.innerHTML='';panel.hidden=true;try{sessionStorage.removeItem('cg_notes_admin_token')}catch{}setStatus('TERMINAL LOCKED.')});
  search.addEventListener('input',render);
  if(token)load({unlocking:true});
})();

(() => {
  'use strict';
  const API='/api/site-config';
  const DEFAULTS={
    operatorArchiveUrl:'https://boxd.it/a35Ed',
    chiefResearcherUrl:'https://letterboxd.com/feelrz/'
  };
  function validUrl(value){
    try{const u=new URL(String(value||''),location.href);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}
  }
  function apply(config){
    const next={...DEFAULTS,...(config||{})};
    Object.entries(next).forEach(([key,value])=>{
      const href=validUrl(value); if(!href) return;
      document.querySelectorAll(`[data-site-link="${key}"]`).forEach(el=>{ el.href=href; });
    });
    window.CINEGENOME_SITE_CONFIG=next;
  }
  async function load(){
    apply(DEFAULTS);
    try{
      const res=await fetch(`${API}?_=${Date.now()}`,{cache:'no-store',headers:{Accept:'application/json'}});
      if(!res.ok) return;
      const data=await res.json();
      apply(data.config||data);
    }catch{}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();

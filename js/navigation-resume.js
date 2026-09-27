(() => {
  'use strict';
  function cleanup(){
    document.querySelectorAll('.wall-nav-transition,#yugenGateTransition,.yugen-gate-transition').forEach(el=>el.remove());
    document.body.classList.remove('dead-hijacking','m-dead-hijacking','wall-returning-to-lab','y-returning-to-lab');
    const dead=document.getElementById('deadTransition');if(dead){dead.classList.remove('is-on');dead.hidden=true}
    const mobileDead=document.getElementById('mDeadTransition');if(mobileDead){mobileDead.classList.remove('is-on');mobileDead.hidden=true}
  }
  window.addEventListener('pagehide',cleanup,{capture:true});
  window.addEventListener('pageshow',e=>{
    let backForward=false;try{backForward=performance.getEntriesByType('navigation')[0]?.type==='back_forward'}catch{}
    if(e.persisted||backForward)requestAnimationFrame(()=>requestAnimationFrame(cleanup));
  });
})();

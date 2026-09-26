(() => {
  'use strict';
  const KEY='cinegenome_yugen_node_v1';
  const ACCESS='CGYUGENREI09';
  const DISPLAY='CG-YŪGEN//REI-09';
  const unlocked=()=>{try{return localStorage.getItem(KEY)==='1'}catch{return false}};
  const unlock=()=>{try{localStorage.setItem(KEY,'1')}catch{} return true};
  const destination=()=>location.pathname.includes('/mobile/')?'../yugen.html':'yugen.html';
  const audio=()=>{try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),g=c.createGain();g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.055,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.46);g.connect(c.destination);[220,330,495].forEach((f,i)=>{const o=c.createOscillator();o.type=i===2?'sine':'square';o.frequency.setValueAtTime(f,c.currentTime+i*.055);o.connect(g);o.start(c.currentTime+i*.055);o.stop(c.currentTime+.5)});setTimeout(()=>c.close?.(),650)}catch{}};
  function enter(){
    unlock(); audio();
    let veil=document.getElementById('yugenGateTransition');
    if(!veil){
      veil=document.createElement('div');veil.id='yugenGateTransition';veil.className='yugen-gate-transition';veil.innerHTML=`<div class="ygt-grid" aria-hidden="true"></div><div class="ygt-kanji" aria-hidden="true">幽玄</div><div class="ygt-terminal"><span class="ygt-node">CG-09 // 外部研究区画</span><strong data-ygt-main>認証中</strong><span data-ygt-sub>AUTHENTICATING SPECIMEN KEY…</span><i><b data-ygt-bar></b></i><small>YŪGEN ROUTING PROTOCOL // 日本映画標本庫</small></div>`;document.body.appendChild(veil);
    }
    const main=veil.querySelector('[data-ygt-main]'),sub=veil.querySelector('[data-ygt-sub]'),bar=veil.querySelector('[data-ygt-bar]');
    requestAnimationFrame(()=>requestAnimationFrame(()=>veil.classList.add('is-on')));
    const stage=(ms,a,b,w)=>setTimeout(()=>{main.textContent=a;sub.textContent=b;bar.style.width=w},ms);
    stage(180,'照合','SPECIMEN KEY MATCHED // REI-09','31%');
    stage(620,'認証完了','ACCESS GRANTED // YŪGEN NODE','66%');
    stage(1060,'接続中','ROUTING TO 日本映画 ARCHIVE…','100%');
    setTimeout(()=>veil.classList.add('is-transfer'),1370);
    setTimeout(()=>location.assign(destination()+'?access=rei09'),1690);
  }
  window.CINEGENOME_YUGEN={ACCESS,DISPLAY,KEY,unlock,unlocked,enter,reveal:()=>{}};
})();

/* Public specimen-code routing. These codes are discoverable shortcuts, never credentials. */
(() => {
  'use strict';
  const scriptUrl=document.currentScript?.src || new URL('../js/specimen-codes.js',location.href).href;
  const labRoot=new URL('../',scriptUrl);
  const normalize=value=>String(value||'').trim().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const navigate=file=>location.assign(new URL(file,labRoot).href);
  const openCases=()=>document.querySelector('[data-anomaly-open]')?.click();

  const EEAO_AUDIO_URL=new URL('assets/audio/eeaao-i-love-you.mp3',labRoot).href;

  function ensureEeaoStyle(){
    if(document.getElementById('cg-eeao-style'))return;
    const style=document.createElement('style');
    style.id='cg-eeao-style';
    style.textContent=`
      .cg-eeao-egg{position:fixed;inset:0;z-index:2147483000;overflow:hidden;background:radial-gradient(circle at 50% 48%,rgba(185,255,46,.14),transparent 33%),linear-gradient(rgba(12,16,12,.035) 1px,transparent 1px),#ece9db;background-size:auto,100% 4px;color:#0a0e0a;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;isolation:isolate;cursor:crosshair;opacity:0;clip-path:circle(0% at 50% 50%);transform:scale(.985);transition:clip-path .82s cubic-bezier(.18,.82,.24,1),opacity .26s ease,transform .82s cubic-bezier(.18,.82,.24,1)}
      .cg-eeao-egg.is-open{opacity:1;clip-path:circle(150% at 50% 50%);transform:scale(1)}
      .cg-eeao-egg.is-closing{opacity:0;clip-path:circle(0% at 50% 50%);transform:scale(1.012);transition-duration:.64s,.4s,.64s}
      .cg-eeao-egg::before{content:"";position:absolute;inset:-20%;z-index:-1;background:repeating-linear-gradient(115deg,transparent 0 80px,rgba(12,16,12,.025) 81px 83px);animation:cgEeaoDrift 18s linear infinite}
      .cg-eeao-egg::after{content:"";position:absolute;inset:0;z-index:20;pointer-events:none;background:#0a0e0a;opacity:.14;mix-blend-mode:multiply;transition:opacity .7s ease .05s}
      .cg-eeao-egg.is-open::after{opacity:0}
      .cg-eeao-close{position:absolute;top:22px;right:24px;width:48px;height:48px;border:2px solid #0a0e0a;background:#ece9db;color:#0a0e0a;font:900 25px/1 Arial,sans-serif;cursor:pointer;z-index:30;opacity:0;transform:translateY(-8px) rotate(-2deg);transition:transform .22s ease,background .16s ease,color .16s ease,opacity .28s ease .58s}
      .cg-eeao-egg.is-open .cg-eeao-close{opacity:1;transform:none}
      .cg-eeao-close:hover{transform:rotate(7deg) scale(1.05);background:#0a0e0a;color:#b9ff2e}
      .cg-eeao-meta{position:absolute;top:28px;left:30px;z-index:27;font-size:10px;font-weight:900;letter-spacing:.14em;border:1px solid #0a0e0a;padding:8px 10px;background:rgba(236,233,219,.9);opacity:0;transform:translateY(-8px);transition:opacity .34s ease .52s,transform .34s ease .52s}
      .cg-eeao-egg.is-open .cg-eeao-meta{opacity:1;transform:none}
      .cg-eeao-gate{position:absolute;left:50%;top:50%;z-index:26;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:8px;text-align:center;pointer-events:none;opacity:1;transition:opacity .34s ease .42s,transform .46s cubic-bezier(.2,.8,.2,1) .32s}
      .cg-eeao-gate span{font-size:9px;letter-spacing:.18em;font-weight:900;color:#0a0e0a}
      .cg-eeao-gate b{font:900 clamp(18px,2.5vw,34px)/1 Arial Black,Impact,sans-serif;letter-spacing:-.02em;text-transform:uppercase}
      .cg-eeao-gate i{display:block;width:150px;height:3px;background:#0a0e0a;overflow:hidden;position:relative}
      .cg-eeao-gate i::after{content:"";position:absolute;inset:0;background:#b9ff2e;transform:translateX(-100%);animation:cgEeaoGate 1.02s cubic-bezier(.2,.8,.2,1) forwards}
      .cg-eeao-egg.is-open .cg-eeao-gate{opacity:0;transform:translate(-50%,-54%) scale(.96)}
      .cg-eeao-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-47%) scale(.965);z-index:10;width:min(760px,76vw);text-align:center;pointer-events:none;opacity:0;transition:opacity .52s ease .56s,transform .68s cubic-bezier(.18,.82,.24,1) .48s}
      .cg-eeao-egg.is-open .cg-eeao-center{opacity:1;transform:translate(-50%,-50%) scale(1)}
      .cg-eeao-kicker{display:inline-block;padding:6px 10px;background:#0a0e0a;color:#b9ff2e;font-size:9px;font-weight:900;letter-spacing:.14em;margin:0 auto 16px}
      .cg-eeao-center h2{margin:0 auto;font:900 clamp(44px,7.2vw,108px)/.82 Arial Black,Impact,sans-serif;letter-spacing:-.06em;text-transform:uppercase;text-align:center;max-width:760px}
      .cg-eeao-center p{max-width:690px;margin:22px auto 0;font-size:11px;font-weight:800;letter-spacing:.065em;line-height:1.68;text-transform:uppercase;text-align:center;text-wrap:balance}
      .cg-eeao-center p + p{margin-top:12px}
      .cg-eeao-center strong{background:#b9ff2e;padding:0 .22em}
      .cg-eeao-eye-field{position:absolute;inset:0;z-index:5;pointer-events:none}
      .cg-eeao-eye{--s:92px;position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);transform:translate(-50%,-50%) rotate(var(--r,0deg)) scale(.72);border:1px solid rgba(20,24,20,.62);border-radius:50%;background:radial-gradient(circle at 38% 32%,#fff 0 21%,#fbfaf4 41%,#ecebe4 72%,#d5d7d1 100%);box-shadow:0 12px 24px rgba(7,10,7,.18),0 3px 8px rgba(7,10,7,.15),inset 0 0 0 2px rgba(255,255,255,.82),inset 0 -10px 16px rgba(23,28,22,.08);opacity:0;overflow:hidden;transition:opacity .38s ease var(--d,0ms),transform .56s cubic-bezier(.18,.82,.24,1) var(--d,0ms)}
      .cg-eeao-eye::before{content:"";position:absolute;inset:4%;border-radius:50%;background:linear-gradient(145deg,rgba(255,255,255,.92) 0 12%,rgba(255,255,255,.16) 28%,transparent 48%),radial-gradient(circle at 70% 78%,rgba(18,22,18,.09),transparent 36%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.64);pointer-events:none;z-index:3}
      .cg-eeao-eye::after{content:"";position:absolute;left:16%;top:10%;width:34%;height:18%;border-radius:50%;background:rgba(255,255,255,.54);filter:blur(.6px);transform:rotate(-20deg);pointer-events:none;z-index:4}
      .cg-eeao-egg.is-open .cg-eeao-eye{opacity:1;transform:translate(-50%,-50%) rotate(var(--r,0deg)) scale(1)}
      .cg-eeao-pupil{position:absolute;left:50%;top:50%;width:56%;height:56%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle at 35% 28%,#303430 0 3%,#111411 18%,#070907 64%,#000 100%);box-shadow:0 4px 8px rgba(0,0,0,.28),inset 1px 1px 2px rgba(255,255,255,.11),inset -5px -7px 8px rgba(0,0,0,.38);will-change:transform;transition:transform 72ms cubic-bezier(.2,.7,.2,1);z-index:2}
      .cg-eeao-pupil::before{content:"";position:absolute;left:13%;top:11%;width:32%;height:27%;border-radius:50%;background:radial-gradient(circle at 38% 36%,#fff 0 28%,rgba(255,255,255,.82) 31%,rgba(255,255,255,.12) 67%,transparent 70%);transform:rotate(-18deg)}
      .cg-eeao-pupil::after{content:"";position:absolute;width:11%;height:11%;right:18%;bottom:19%;border-radius:50%;background:rgba(255,255,255,.52);filter:blur(.2px)}
      .cg-eeao-footer{position:absolute;z-index:28;left:26px;right:26px;bottom:22px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;opacity:0;transform:translateY(8px);transition:opacity .34s ease .72s,transform .34s ease .72s}
      .cg-eeao-egg.is-open .cg-eeao-footer{opacity:1;transform:none}
      .cg-eeao-footer button{border:1px solid #0a0e0a;background:rgba(236,233,219,.92);color:#0a0e0a;padding:9px 11px;text-decoration:none;font:inherit;cursor:pointer}
      .cg-eeao-footer button:hover{background:#0a0e0a;color:#b9ff2e}
      .cg-eeao-footer span{margin-left:auto;background:#b9ff2e;padding:8px 10px;border:1px solid #0a0e0a}
      .cg-eeao-audio{position:absolute;width:1px;height:1px;left:-9999px;bottom:-9999px;opacity:0;pointer-events:none}
      @keyframes cgEeaoDrift{to{transform:translate3d(7%,3%,0) rotate(.3deg)}}
      @keyframes cgEeaoGate{0%{transform:translateX(-100%)}55%{transform:translateX(0)}100%{transform:translateX(100%)}}
      @media(max-width:700px){.cg-eeao-center{width:84vw}.cg-eeao-center h2{font-size:clamp(39px,13vw,70px)}.cg-eeao-center p{font-size:9px;line-height:1.58}.cg-eeao-eye{transform:translate(-50%,-50%) scale(.62) rotate(var(--r,0deg))}.cg-eeao-egg.is-open .cg-eeao-eye{transform:translate(-50%,-50%) scale(.82) rotate(var(--r,0deg))}.cg-eeao-footer{left:14px;right:14px;bottom:14px}.cg-eeao-footer span{display:none}.cg-eeao-meta{left:14px;top:14px;max-width:calc(100vw - 84px)}.cg-eeao-close{top:12px;right:12px}}
      @media(prefers-reduced-motion:reduce){.cg-eeao-egg,.cg-eeao-center,.cg-eeao-eye,.cg-eeao-gate,.cg-eeao-footer,.cg-eeao-close,.cg-eeao-meta{transition-duration:.01ms!important;transition-delay:0ms!important}.cg-eeao-egg::before{animation:none}.cg-eeao-gate i::after{animation:none}.cg-eeao-pupil{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function openEEAAO(){
    const existing=document.querySelector('.cg-eeao-egg');
    if(existing){existing.querySelector('.cg-eeao-close')?.focus();return}
    ensureEeaoStyle();
    const previousFocus=document.activeElement;
    const previousOverflow=document.documentElement.style.overflow;
    const previousBodyOverflow=document.body.style.overflow;
    const egg=document.createElement('section');
    egg.className='cg-eeao-egg';
    egg.setAttribute('role','dialog');egg.setAttribute('aria-modal','true');egg.setAttribute('aria-labelledby','cgEeaoTitle');
    const eyes=[
      [4,10,72,-8],[14,7,112,7],[28,10,62,-6],[39,6,94,8],[53,10,70,-8],[66,6,116,5],[81,10,78,-7],[94,8,106,8],
      [7,25,122,6],[20,23,70,-5],[33,27,98,7],[48,22,132,-4],[63,25,76,6],[76,24,104,-8],[91,27,128,5],
      [3,44,86,-6],[15,43,138,8],[29,46,66,-8],[40,40,108,5],[58,43,84,-5],[71,42,142,7],[86,44,72,-4],[98,43,112,6],
      [7,63,118,-7],[23,64,82,5],[35,61,146,-5],[53,65,70,7],[65,60,104,-6],[79,64,132,6],[94,62,88,-7],
      [3,82,78,7],[15,84,130,-5],[30,86,92,6],[45,82,116,-7],[60,87,68,8],[73,83,144,-5],[88,85,104,6],[98,82,74,-8],
      [10,97,96,-5],[25,95,66,7],[39,98,128,-6],[56,96,86,5],[70,98,112,-8],[84,96,72,6],[96,97,118,-5]
    ];
    egg.innerHTML=`<button class="cg-eeao-close" type="button" aria-label="Close EEAAO anomaly">×</button>
      <div class="cg-eeao-meta">SPECIMEN CODE / CG-EEAAO // PERSONAL ANOMALY</div>
      <div class="cg-eeao-gate" aria-hidden="true"><span>CG-EEAAO // SIGNAL LOCK</span><b>Observer field acquired.</b><i></i></div>
      <div class="cg-eeao-center"><div class="cg-eeao-kicker">CHIEF RESEARCHER // PERSONAL ANOMALY</div><h2 id="cgEeaoTitle">THIS ONE<br>IS PERSONAL.</h2><p>Of every specimen in this archive, this is the one I would keep if the lab burned down. It lets chaos, regret, family, failure and love occupy the same frame without forcing any of them to become simple.</p><p>Maybe that is why I keep returning to it. Infinite choices collapse into one small instruction: <strong>stay. care. choose the people in front of you.</strong> The lab can measure signals. It still cannot measure what that did to me.</p></div>
      <div class="cg-eeao-eye-field" aria-hidden="true">${eyes.map(([x,y,size,r],index)=>`<span class="cg-eeao-eye" style="--x:${x}%;--y:${y}%;--s:${size}px;--r:${r}deg;--d:${Math.min(690,250+index*34)}ms"><i class="cg-eeao-pupil"></i></span>`).join('')}</div>
      <div class="cg-eeao-footer"><button type="button" data-eeao-audio>BACKSOUND // ON</button><span>ESC // COLLAPSE THIS UNIVERSE</span></div>
      <audio class="cg-eeao-audio" data-eeao-audio-el preload="auto" loop src="${EEAO_AUDIO_URL}"></audio>`;
    document.body.appendChild(egg);
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';

    const audioEl=egg.querySelector('[data-eeao-audio-el]');
    const audioButton=egg.querySelector('[data-eeao-audio]');
    let audioOn=true;
    let audioFade=0;
    try{audioOn=localStorage.getItem('cinegenome_ui_sfx_v1')!=='off'}catch{}
    function stopFade(){if(audioFade){cancelAnimationFrame(audioFade);audioFade=0}}
    function fadeAudio(target=0.46,duration=1100){
      stopFade();
      const start=performance.now(),from=audioEl.volume;
      const tick=now=>{const p=Math.min(1,(now-start)/duration);audioEl.volume=from+(target-from)*(1-Math.pow(1-p,3));if(p<1)audioFade=requestAnimationFrame(tick);else audioFade=0};
      audioFade=requestAnimationFrame(tick);
    }
    async function startAudio(){
      if(!audioOn){audioButton.textContent='BACKSOUND // OFF';audioButton.setAttribute('aria-pressed','false');return}
      audioEl.volume=0;
      try{await audioEl.play();fadeAudio(.46,1250);audioButton.textContent='BACKSOUND // ON';audioButton.setAttribute('aria-pressed','true')}
      catch{audioButton.textContent='BACKSOUND // TAP TO PLAY';audioButton.setAttribute('aria-pressed','false')}
    }
    function stopAudio(immediate=false){
      stopFade();
      if(immediate){audioEl.pause();audioEl.currentTime=0;return}
      const start=performance.now(),from=audioEl.volume;
      const tick=now=>{const p=Math.min(1,(now-start)/420);audioEl.volume=from*(1-p);if(p<1)audioFade=requestAnimationFrame(tick);else{audioFade=0;audioEl.pause();audioEl.currentTime=0}};
      audioFade=requestAnimationFrame(tick);
    }
    audioButton.addEventListener('click',async()=>{
      audioOn=!audioOn;
      if(audioOn){await startAudio()}else{stopAudio();audioButton.textContent='BACKSOUND // OFF';audioButton.setAttribute('aria-pressed','false')}
    });

    requestAnimationFrame(()=>requestAnimationFrame(()=>egg.classList.add('is-open')));
    setTimeout(startAudio,180);

    let raf=0,point={x:innerWidth/2,y:innerHeight/2};
    const pupils=[...egg.querySelectorAll('.cg-eeao-pupil')];
    function paintEyes(){
      raf=0;
      pupils.forEach(pupil=>{
        const eye=pupil.parentElement,rect=eye.getBoundingClientRect();
        const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
        const dx=point.x-cx,dy=point.y-cy,dist=Math.hypot(dx,dy)||1;
        const max=Math.max(4,rect.width*.175),travel=Math.min(max,dist*.105);
        const x=dx/dist*travel,y=dy/dist*travel;
        pupil.style.transform=`translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      });
    }
    function onMove(event){point={x:event.clientX,y:event.clientY};if(!raf)raf=requestAnimationFrame(paintEyes)}
    egg.addEventListener('pointermove',onMove,{passive:true});

    let closing=false;
    function closeEgg(){
      if(closing)return;closing=true;
      if(raf)cancelAnimationFrame(raf);
      document.removeEventListener('keydown',onKey);
      stopAudio();
      egg.classList.remove('is-open');
      egg.classList.add('is-closing');
      setTimeout(()=>{
        stopAudio(true);
        egg.remove();
        document.documentElement.style.overflow=previousOverflow;
        document.body.style.overflow=previousBodyOverflow;
        previousFocus?.focus?.();
      },660);
    }
    function onKey(event){if(event.key==='Escape')closeEgg()}
    document.addEventListener('keydown',onKey);
    egg.querySelector('.cg-eeao-close').addEventListener('click',closeEgg);
    setTimeout(()=>egg.querySelector('.cg-eeao-close')?.focus(),760);
    requestAnimationFrame(paintEyes);
  }

  function run(input,{close=()=>{},status=()=>{}}={}) {
    const code=normalize(input);
    if(code==='CGNULLPULL'||code==='CGQAGACHA'){
      status('NULL//PULL // SYNTHETIC DRAW CHANNEL');close();
      const destination=new URL(location.href);
      if(destination.searchParams.get('gacha-test')==='1')openCases();
      else {destination.searchParams.set('gacha-test','1');location.assign(destination.href)}
      return true;
    }
    if(code==='CGROOT09'||code==='CGKAMISAMA'){
      status('ROOT://KAMISAMA // AUTH TOKEN REQUIRED');close();navigate('kamisama.html');return true;
    }
    if(code==='CGMITOSIS03'||code==='CGTRIPLICATE'){
      const result=window.CINEGENOME_ANOMALY?.redeemSpecimenCode('CGTRIPLICATE') || 'unavailable';
      if(result==='granted'){
        status('MITOSIS://03 // THREE PACKS REPLICATED LOCALLY');close();openCases();
      }else status({claimed:'ALREADY REDEEMED IN THIS BROWSER.',test_mode:'EXIT QA TEST MODE TO CLAIM REAL PACKS.',storage_unavailable:'STORAGE UNAVAILABLE // NO PACKS CREDITED.',unavailable:'ANOMALY CHANNEL UNAVAILABLE // RETRY AFTER LOADING.'}[result]||'CODE REFUSED.');
      return true;
    }
    if(code==='CGHELLGATE09'||code==='CGSECTOR09'){
      if(!window.CINEGENOME_SECTOR09?.open){status('SECTOR CHANNEL UNAVAILABLE.');return true}
      status('HELLGATE://09 // FEED ONLINE');close();window.CINEGENOME_SECTOR09.open();return true;
    }
    if(code==='CGPHANTOMREEL'||code==='CGSYNAPSE12'){
      if(!window.CINEGENOME_SIGNAL_LAB?.open){status('SIGNAL ENGINE UNAVAILABLE.');return true}
      const mode=code==='CGPHANTOMREEL'?'ghost':'sonic';
      status(mode==='ghost'?'PHANTOM://REEL // ARCHIVE GHOST FOUND':'SYNAPSE://12 // SIGNAL READY');
      close();window.CINEGENOME_SIGNAL_LAB.open(mode);return true;
    }
    if(code==='CGEEAAO'){
      status('EEAAO://ALL // PERSONAL ANOMALY OPEN');close();openEEAAO();return true;
    }
    if(code==='CGATLAS'){
      const target=document.querySelector('.module-btn[data-view="atlas"],.m-bottom-nav button[data-target="atlas"]');
      if(!target){status('ATLAS ROUTE UNAVAILABLE.');return true}
      status('ATLAS ROUTE ACQUIRED.');close();target.click();return true;
    }
    if(code==='CGWALL'){
      try{sessionStorage.setItem('cinegenome_labwall_route_v1','1');sessionStorage.setItem('cg_lab_wall_intro','1')}catch{}
      status('COLLECTIVE TRACE // LAB WALL');close();navigate('lab-wall.html');return true;
    }
    return false;
  }
  window.CINEGENOME_SPECIMEN_CODES={run,normalize};
})();

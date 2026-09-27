/* SECTOR 09: an original, self-contained raycasting laboratory easter egg. */
(() => {
  'use strict';
  const BASE_MAP=[
    '111111111111',
    '100000000001',
    '101110011101',
    '100010000001',
    '100010110101',
    '100000000001',
    '101101010101',
    '100001000001',
    '101000111001',
    '100000000001',
    '100000000001',
    '111111111111'
  ];
  const BASE_TARGETS=[{x:5.5,y:1.5},{x:5.5,y:5.5},{x:9.5,y:9.5},{x:10.5,y:1.5},
    {x:1.5,y:9.5},{x:6.5,y:7.5},{x:8.5,y:5.5},{x:8.5,y:9.5},{x:10.5,y:7.5},{x:7.5,y:3.5}];
  const EXITS=[{x:10.5,y:10.5},{x:10.5,y:1.5},{x:1.5,y:10.5}];
  const W=320,H=200,FOV=Math.PI/2.9;
  let dialog,canvas,ctx,hud,state,raf=0,last=0,map=BASE_MAP,exit=EXITS[0],attempt=0;
  const held=new Set();
  const wall=(x,y)=>map[Math.floor(y)]?.[Math.floor(x)]!=='0';
  const clearAt=(x,y)=>!wall(x-.19,y-.19)&&!wall(x+.19,y-.19)&&!wall(x-.19,y+.19)&&!wall(x+.19,y+.19);
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  function cast(angle,max=16){
    const dx=Math.cos(angle),dy=Math.sin(angle);
    for(let d=.025;d<max;d+=.035){
      const x=state.x+dx*d,y=state.y+dy*d;
      if(wall(x,y))return {d,x,y};
    }
    return {d:max,x:state.x+dx*max,y:state.y+dy*max};
  }
  function sectorDate(){
    const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function variantFor(date,n){
    let hash=2166136261;
    for(const char of date)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
    return (hash+n)%8;
  }
  function transform(point,variant){
    let {x,y}=point;
    if(variant>=4)x=12-x;
    for(let i=0;i<variant%4;i++)[x,y]=[12-y,x];
    return {x,y};
  }
  function fresh(){
    const variant=variantFor(sectorDate(),attempt++);
    const cells=Array.from({length:12},()=>Array(12).fill('1'));
    BASE_MAP.forEach((row,y)=>[...row].forEach((cell,x)=>{
      const placed=transform({x:x+.5,y:y+.5},variant);
      cells[Math.floor(placed.y)][Math.floor(placed.x)]=cell;
    }));
    map=cells.map(row=>row.join(''));
    const chosenExit=EXITS[variant%EXITS.length];
    exit=transform(chosenExit,variant);
    const player=transform({x:1.5,y:1.5},variant);
    const facing=transform({x:1.5+Math.cos(.2),y:1.5+Math.sin(.2)},variant);
    const hostiles=Array.from({length:BASE_TARGETS.length},(_,i)=>BASE_TARGETS[(variant*3+i*3)%BASE_TARGETS.length])
      .filter(t=>distance(t,chosenExit)>1 && distance(t,{x:1.5,y:1.5})>2).slice(0,3);
    return {...player,a:Math.atan2(facing.y-player.y,facing.x-player.x),health:100,kills:0,
      targets:hostiles.map(t=>({...transform(t,variant),alive:true})),
      phase:'live',reward:'',cooldown:0,flash:0,damageTimer:1.5};
  }
  function claimReward(){
    state.reward=window.CINEGENOME_ANOMALY?.awardSector09Daily?.()||'unavailable';
  }
  function hudText(){
    if(!hud||!state)return;
    hud.textContent=state.phase==='won'?({granted:'BREACH SEALED // +1 CREATURE DRAW READY IN OPEN CASES',claimed:'BREACH SEALED // DAILY DRAW ALREADY CLAIMED',test_mode:'BREACH SEALED // QA MODE: NO LIVE DRAW',storage_unavailable:'BREACH SEALED // REWARD STORAGE UNAVAILABLE',unavailable:'BREACH SEALED // REWARD CHANNEL UNAVAILABLE'}[state.reward]||'BREACH SEALED // ALL SIGNALS CONTAINED'):
      state.phase==='lost'?'BIOFEED LOST // RESTART SECTOR':
      `INTEGRITY ${Math.ceil(state.health)}% // HOSTILES ${state.targets.filter(t=>t.alive).length}/3 // ${state.kills===3?'EXIT UNLOCKED':'EXIT SEALED'}`;
  }
  function shoot(){
    if(!state||state.phase!=='live'||state.cooldown>0)return;
    state.cooldown=.3;state.flash=.12;
    const target=state.targets.filter(t=>t.alive).map(t=>({t,d:distance(state,t),a:Math.abs(angleDiff(Math.atan2(t.y-state.y,t.x-state.x),state.a))}))
      .filter(hit=>hit.d<7&&hit.a<Math.max(.06,.28/hit.d)&&cast(Math.atan2(hit.t.y-state.y,hit.t.x-state.x),hit.d).d>=hit.d-.1)
      .sort((a,b)=>a.d-b.d)[0];
    if(target){target.t.alive=false;state.kills++;hudText()}
  }
  function move(dt){
    if(state.phase!=='live')return;
    if(held.has('left'))state.a-=dt*2.2;
    if(held.has('right'))state.a+=dt*2.2;
    let direction=(held.has('forward')?1:0)-(held.has('back')?1:0);
    if(direction){
      const dx=Math.cos(state.a)*dt*2.1*direction,dy=Math.sin(state.a)*dt*2.1*direction;
      if(clearAt(state.x+dx,state.y))state.x+=dx;
      if(clearAt(state.x,state.y+dy))state.y+=dy;
    }
    state.cooldown=Math.max(0,state.cooldown-dt);
    state.flash=Math.max(0,state.flash-dt);
    state.damageTimer-=dt;
    if(state.damageTimer<=0){
      if(state.targets.some(t=>t.alive&&distance(state,t)<3.3&&cast(Math.atan2(t.y-state.y,t.x-state.x),distance(state,t)).d>=distance(state,t)-.1)){
        state.health=Math.max(0,state.health-14);hudText();
        if(state.health===0){state.phase='lost';held.clear()}
      }
      state.damageTimer=1.8;
    }
    if(state.kills===3&&distance(state,exit)<.68){state.phase='won';held.clear();claimReward();hudText()}
  }
  function sprite(x,y,depth,color,mark,zBuffer){
    const d=distance(state,{x,y});
    const relative=angleDiff(Math.atan2(y-state.y,x-state.x),state.a);
    if(d<.15||Math.abs(relative)>FOV*.72||cast(Math.atan2(y-state.y,x-state.x),d).d<d-.1)return;
    const sx=W/2+relative/FOV*W;
    const size=Math.min(125,Math.max(8,depth/d*135));
    if(sx<0||sx>=W||zBuffer[Math.min(W-1,Math.max(0,Math.floor(sx)))]<d-.2)return;
    ctx.fillStyle='#0a0e0a';ctx.fillRect(sx-size*.35,H/2-size*.48,size*.7,size);
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,5/d);ctx.strokeRect(sx-size*.35,H/2-size*.48,size*.7,size);
    ctx.fillStyle=color;ctx.font=`bold ${Math.max(9,size*.38)}px monospace`;
    ctx.textAlign='center';ctx.fillText(mark,sx,H/2+size*.14);
  }
  function draw(){
    ctx.fillStyle='#101911';ctx.fillRect(0,0,W,H/2);
    ctx.fillStyle='#242e23';ctx.fillRect(0,H/2,W,H/2);
    ctx.fillStyle='#3b5139';ctx.fillRect(0,H/2,W,1);
    const zBuffer=[];
    for(let sx=0;sx<W;sx+=2){
      const ray=state.a+Math.atan((sx/W-.5)*2*Math.tan(FOV/2));
      const hit=cast(ray),d=Math.max(.12,hit.d*Math.cos(ray-state.a)),height=Math.min(H*2,150/d);
      const edge=Math.min(hit.x%1,hit.y%1,1-hit.x%1,1-hit.y%1)<.08;
      const fade=Math.max(.14,1-hit.d/18);
      const light=Math.floor((edge?118:85)*fade);
      ctx.fillStyle=`rgb(${Math.floor(light*.58)},${light},${Math.floor(light*.45)})`;
      ctx.fillRect(sx,Math.floor(H/2-height/2),2,Math.ceil(height));
      zBuffer[sx]=zBuffer[sx+1]=hit.d;
    }
    const sprites=[...state.targets.filter(t=>t.alive).map(t=>({...t,color:'#ff836d',mark:'◇'})),{...exit,color:state.kills===3?'#b8ff35':'#556452',mark:state.kills===3?'EXIT':'×'}];
    sprites.sort((a,b)=>distance(state,b)-distance(state,a));
    for(const t of sprites)sprite(t.x,t.y,1,t.color,t.mark,zBuffer);
    ctx.strokeStyle=state.flash?'#f8f9d8':'#b8ff35';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(W/2-6,H/2);ctx.lineTo(W/2-2,H/2);ctx.moveTo(W/2+2,H/2);ctx.lineTo(W/2+6,H/2);
    ctx.moveTo(W/2,H/2-6);ctx.lineTo(W/2,H/2-2);ctx.moveTo(W/2,H/2+2);ctx.lineTo(W/2,H/2+6);ctx.stroke();
    if(state.flash){ctx.fillStyle='#e9ffae66';ctx.fillRect(W/2-12,H-26,24,26)}
    const scale=3;
    map.forEach((row,y)=>[...row].forEach((cell,x)=>{ctx.fillStyle=cell==='1'?'#768c69':'#111c13';ctx.fillRect(W-42+x*scale,6+y*scale,scale-1,scale-1)}));
    ctx.fillStyle='#b8ff35';ctx.fillRect(W-42+state.x*scale-2,6+state.y*scale-2,4,4);
    if(state.phase!=='live'){
      ctx.fillStyle='#081008c9';ctx.fillRect(0,58,W,85);
      ctx.fillStyle=state.phase==='won'?'#b8ff35':'#ff836d';ctx.textAlign='center';ctx.font='bold 16px monospace';
      ctx.fillText(state.phase==='won'?'SECTOR CONTAINED':'SIGNAL LOST',W/2,105);
    }
  }
  function frame(now){
    if(!dialog?.open){raf=0;return}
    const dt=Math.min(.045,Math.max(0,(now-last)/1000||0));last=now;
    move(dt);draw();raf=requestAnimationFrame(frame);
  }
  const controls={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  function keyDown(event){
    if(!dialog?.open)return;
    if(controls[event.code]){event.preventDefault();held.add(controls[event.code])}
    if(event.code==='Space'||event.code==='KeyZ'){event.preventDefault();if(!event.repeat)shoot()}
    if(event.code==='KeyR'){event.preventDefault();state=fresh();hudText()}
  }
  function init(){
    dialog=document.createElement('dialog');dialog.className='sector09-dialog';dialog.setAttribute('aria-label','Sector 09 playable archive breach');
    dialog.innerHTML=`<section class="sector09-shell"><header><span>HELLGATE://09 // SECTOR BREACH</span><button type="button" data-sector-close aria-label="Exit Sector 09">×</button></header>
      <div class="sector09-body"><p>THREE HOSTILE SIGNALS. CLEAR THE ARCHIVE. REACH THE EXIT.</p>
      <canvas width="320" height="200" role="img" aria-label="First-person archive corridor with enemies and exit"></canvas>
      <div class="sector09-hud" role="status" aria-live="polite"></div>
      <div class="sector09-actions"><div class="sector09-controls"><button type="button" data-sector-move="left" aria-label="Turn left">↶</button><button type="button" data-sector-move="forward" aria-label="Move forward">↑</button><button type="button" data-sector-move="back" aria-label="Move backward">↓</button><button type="button" data-sector-move="right" aria-label="Turn right">↷</button></div><button type="button" data-sector-fire>FIRE / Z</button><button type="button" data-sector-retry>RETRY</button></div>
      <small>W / S MOVE · A / D TURN · SPACE / Z FIRE · R RETRY · ESC EXIT</small>
      <small>ONE CREATURE DRAW PER DAY ON CLEAR // SAVED IN THIS BROWSER</small></div></section>`;
    document.body.appendChild(dialog);
    canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d',{alpha:false});hud=dialog.querySelector('.sector09-hud');
    dialog.querySelector('[data-sector-close]').addEventListener('click',()=>dialog.close());
    dialog.querySelector('[data-sector-retry]').addEventListener('click',()=>{state=fresh();hudText()});
    dialog.querySelector('[data-sector-fire]').addEventListener('click',shoot);
    dialog.querySelectorAll('[data-sector-move]').forEach(btn=>{
      const action=btn.dataset.sectorMove;
      btn.addEventListener('pointerdown',event=>{event.preventDefault();held.add(action);btn.setPointerCapture?.(event.pointerId)});
      for(const name of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(name,()=>held.delete(action));
    });
    dialog.addEventListener('close',()=>{held.clear();if(raf)cancelAnimationFrame(raf);raf=0});
    window.addEventListener('keydown',keyDown);
    window.addEventListener('keyup',event=>{if(controls[event.code])held.delete(controls[event.code])});
    window.addEventListener('blur',()=>held.clear());
  }
  window.CINEGENOME_SECTOR09={open(){
    if(!dialog)init();
    state=fresh();held.clear();hudText();dialog.showModal();last=performance.now();
    if(!raf)raf=requestAnimationFrame(frame);
    dialog.querySelector('[data-sector-close]').focus();
  }};
})();

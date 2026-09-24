const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname;
const data={window:{}};vm.createContext(data);
for(const path of ['data/movies.js','data/top500-enriched.js','data/dead-channel-300.js'])
 vm.runInContext(fs.readFileSync(root+'/'+path,'utf8'),data);
const storage=new Map();
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
const testStorage=new Map();
const sessionStorage={getItem:k=>testStorage.get(k)||null,setItem:(k,v)=>testStorage.set(k,String(v)),removeItem:k=>testStorage.delete(k)};
function mount(date,roll=0,options={}){
 const nodes=new Map(),get=id=>{
  if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',hidden:true,open:false,
   addEventListener(name,fn){this[name]=fn;},showModal(){this.open=true},close(){this.open=false},
   querySelector(){return null},appendChild(node){this.lastOverlay=node}});
  return nodes.get(id);
 };
 class FixedDate extends Date {
  constructor(...args){super(...(args.length?args:[date]))}
  static now(){return new Date(date).getTime()}
 }
 const progress=[{textContent:''}];
 const document={currentScript:{src:'https://example.test/js/anomaly.js'},getElementById:get,
  querySelectorAll:selector=>selector==='[data-anomaly-progress]'?progress
   :selector==='[data-anomaly-portal]'?[{classList:{toggle(){}}}]
   :selector==='[data-anomaly-open]'?[{addEventListener(){}}]:[],
  addEventListener(){},createElement(){return {dataset:{},setAttribute(){},addEventListener(name,fn){this[name]=fn},remove(){this.removed=true},querySelector(selector){return selector==='[data-reveal-continue]'?{focus(){}}:null}}}};
 const ctx={window:{...data.window,location:{search:options.search||'',pathname:'/'},AudioContext:options.AudioContext,addEventListener(){}},document,Date:FixedDate,
  localStorage,sessionStorage,Number,String,JSON,URL,Uint32Array,
  crypto:{getRandomValues(array){array[0]=Math.floor(roll*4294967296);return array}},
  matchMedia:()=>({matches:options.reducedMotion!==false}),
  setTimeout:(fn,delay)=>{if(delay<=650)fn();return 1},clearTimeout(){}};
 vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(root+'/js/anomaly.js','utf8'),ctx);
 const clickDraw=id=>get('anomalyCaseContent').click({target:{closest(selector){
  return selector==='[data-anomaly-draw]'?{dataset:{anomalyDraw:id}}:null
 }}});
 return {core:ctx.window.CINEGENOME_ANOMALY,get,progress,clickDraw};
}
let app=mount('2026-09-24T12:00:00Z');
let status=app.core.status();
assert.equal(status.cases.length,6);
assert.equal(status.pending,0);
assert.equal(app.core.scan({title:'wrong',year:2000}),false);
for(const item of status.cases.filter(x=>x.kind==='scan')){
 const movie=data.window.CINEGENOME_ENRICHED_TOP500.find(x=>x.title===item.target&&x.year===item.year);
 assert(movie);assert(!item.hint.toLowerCase().includes(item.target.toLowerCase()));
 assert.equal(app.core.scan(movie),true);assert.equal(app.core.scan(movie),false);
 assert.equal(app.core.status().pending,app.core.status().solved.length===2?1:0,'one pack after two cases');
}
for(const item of status.cases.filter(x=>x.kind==='atlas')){
 const movies=data.window.CINEGENOME_ENRICHED_TOP500.filter(m=>m.dna[item.xKey]>=item.xMin&&m.dna[item.xKey]<=item.xMax&&m.dna[item.yKey]>=item.yMin&&m.dna[item.yKey]<=item.yMax);
 assert(movies.length>=35);
 assert.equal(app.core.atlas(movies[0],'other',item.yKey),false);
 assert.equal(app.core.atlas(movies[0],item.xKey,item.yKey),true);
}
const mutation=status.cases.find(x=>x.kind==='mutation');
assert.equal(app.core.mutation({[mutation.high]:79,[mutation.low]:30}),false);
assert.equal(app.core.mutation({[mutation.high]:80,[mutation.low]:30}),true);
const crossbreed=status.cases.find(x=>x.kind==='crossbreed');
assert.equal(app.core.crossbreed({title:crossbreed.parents[0]},{title:crossbreed.parents[1]},39),false);
assert.equal(app.core.crossbreed({title:crossbreed.parents[0]},{title:crossbreed.parents[1]},50),true);
status=app.core.status();
assert.equal(status.solved.length,6);assert.equal(status.pending,3);
assert.equal(status.collection,0);
assert.match(app.get('anomalyCaseContent').innerHTML,/CREATURE COLLECTION/);
assert.match(app.get('anomalyCaseContent').innerHTML,/SR 0.2%/);
assert.equal(app.progress[0].textContent,'6/6 · 3 DRAW');
app=mount('2026-09-24T15:00:00Z',0);
assert.equal(app.core.status().pending,3,'tickets survive reload');
for(const pull of app.core.status().pulls){
 app.clickDraw(pull.id);
 assert.equal(app.core.status().pulls.find(x=>x.id===pull.id).cardId,
  'pierlurk','rarity roll at lower boundary');
 app.clickDraw(pull.id);
 app.get('anomalyDialog').lastOverlay.click({target:{closest:selector=>selector==='[data-reveal-continue]'?{}:null}});
}
assert.equal(app.core.status().collection,3);
assert.equal(app.core.status().pending,0);
assert.equal(app.core.status().pulls.filter(x=>x.cardId==='pierlurk').length,3,'duplicates count');
assert.match(app.get('anomalyCaseContent').innerHTML,/×3/);
assert.match(app.get('anomalyCaseContent').innerHTML,/CREATURE OBTAINED \/\/ 24 Sept 2026/);
app=mount('2026-09-25T12:00:00Z',.999);
assert.equal(app.core.status().solved.length,0);
assert.equal(app.core.status().collection,3,'cards retained after date reset');
assert.equal(app.core.status().pending,0);
const next=app.core.status();assert.notEqual(next.cases[0].target,status.cases[0].target);
const id=next.cases[0],movie=data.window.CINEGENOME_ENRICHED_TOP500.find(m=>m.title===id.target&&m.year===id.year);
app.core.scan(movie);
assert.equal(app.core.status().pending,0,'one case does not earn a draw');
const second=next.cases[1],secondMovie=data.window.CINEGENOME_ENRICHED_TOP500.find(m=>m.title===second.target&&m.year===second.year);
app.core.scan(secondMovie);
app.clickDraw(next.date+':PAIR:1');
assert.equal(app.core.status().pulls.at(-1).cardId,'foldhart','top rarity roll at upper boundary');
storage.clear();
storage.set('cinegenome_anomaly_daily_v2',JSON.stringify({date:'2026-09-25',solved:{S1:true,S2:true},collection:[{id:'2026-09-25:S1',kind:'scan'}],migrated:true}));
app=mount('2026-09-25T12:00:00Z');
assert.equal(app.core.status().pending,1,'two old solved cases grant one replacement draw');
app=mount('2026-09-25T13:00:00Z');
assert.equal(app.core.status().pending,1,'migration is idempotent');
// Previously drawn v49.3 cards stay in the collection; unopened packs
// migrate from seven per completed board to three, even on prior dates.
storage.clear();
const oldDay='2026-09-24';
const oldPulls=['S1','S2','A1','A2','M1','X1','MASTER'].map((caseId,i)=>({
 id:oldDay+':'+caseId,date:oldDay,caseId,bonus:caseId==='MASTER',
 cardId:i===0?'viridra':null,claimedAt:i===0?'2026-09-24T10:00:00Z':undefined
}));
storage.set('cinegenome_anomaly_daily_v2',JSON.stringify({
 date:oldDay,solved:Object.fromEntries(['S1','S2','A1','A2','M1','X1'].map(id=>[id,true])),
 pulls:oldPulls,collection:[],migrated:true
}));
app=mount('2026-09-25T12:00:00Z');
assert.equal(app.core.status().collection,1,'existing card preserved');
assert.equal(app.core.status().pending,2,'old unopened tickets normalized to three total');
app=mount('2026-09-25T13:00:00Z');
assert.equal(app.core.status().pending,2,'old ticket migration stays idempotent');
for(const [roll,expected] of [[0,'pierlurk'],[.61,'ambergraze'],[.91,'viridra'],[.995,'cirrivel'],[.999,'foldhart']]){
 storage.clear();
 const date='2026-09-25';
 storage.set('cinegenome_anomaly_daily_v2',JSON.stringify({
  date,solved:{S1:true,S2:true},rewardVersion:4,migrated:true,collection:[],
  pulls:[{id:date+':PAIR:1',date,caseId:'PAIR:1',cardId:null}]
 }));
 app=mount('2026-09-25T12:00:00Z',roll);
 app.clickDraw(date+':PAIR:1');
 assert.equal(app.core.status().pulls[0].cardId,expected,'rarity band at '+roll);
 if(expected==='foldhart')assert.match(app.get('anomalyDialog').lastOverlay.innerHTML,/ULTRA RARE SPECIMEN/);
}
let notes=0;
class FakeAudio {
 constructor(){this.currentTime=0;this.destination={};this.state='running'}
 createOscillator(){notes++;return {frequency:{setValueAtTime(){}},connect(){return this},start(){},stop(){}}}
 createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this}}}
}
function soundDraw(roll, mute) {
 storage.clear();notes=0;
 const date='2026-09-25';
 storage.set('cinegenome_anomaly_daily_v2',JSON.stringify({
  date,solved:{S1:true,S2:true},rewardVersion:4,migrated:true,collection:[],
  pulls:[{id:date+':PAIR:1',date,caseId:'PAIR:1',cardId:null}]
 }));
 if(mute)storage.set('cinegenome_creature_sound_v1','off');
 const run=mount('2026-09-25T12:00:00Z',roll,{AudioContext:FakeAudio});
 run.clickDraw(date+':PAIR:1');
 return notes;
}
assert(soundDraw(.999,false)>soundDraw(0,false),'SR has a longer unique audio cue');
assert.equal(soundDraw(.999,true),0,'mute persists and silences the SR cue');
// Skip must immediately show the committed card without allowing another roll.
storage.clear();
storage.set('cinegenome_anomaly_daily_v2',JSON.stringify({
 date:'2026-09-25',solved:{S1:true,S2:true},rewardVersion:4,migrated:true,collection:[],
 pulls:[{id:'2026-09-25:PAIR:1',date:'2026-09-25',caseId:'PAIR:1',cardId:null}]
}));
app=mount('2026-09-25T12:00:00Z',.999,{reducedMotion:false});
app.clickDraw('2026-09-25:PAIR:1');
const overlay=app.get('anomalyDialog').lastOverlay;
assert.equal(overlay.dataset.stage,'scan');
assert.equal(app.core.status().pulls[0].cardId,'foldhart','card saved before reveal animation');
overlay.click({target:{closest:selector=>selector==='[data-reveal-skip]'?{}:null}});
assert.equal(overlay.dataset.stage,'revealed');
overlay.click({target:{closest:selector=>selector==='[data-reveal-continue]'?{}:null}});
assert.equal(overlay.removed,true);
assert.equal(app.core.status().collection,1);
app.get('anomalyCaseContent').click({target:{closest:selector=>selector==='[data-anomaly-sound]'?{}:null}});
assert.equal(storage.get('cinegenome_creature_sound_v1'),'off','mute setting survives reload');
storage.set('cinegenome_creature_sound_v1','on');
testStorage.clear();
const genuine=JSON.stringify({date:'2026-09-25',solved:{S1:true,S2:true},
 rewardVersion:4,migrated:true,collection:[],
 pulls:[{id:'2026-09-25:PAIR:1',date:'2026-09-25',caseId:'PAIR:1',cardId:'pierlurk'}]});
storage.set('cinegenome_anomaly_daily_v2',genuine);
app=mount('2026-09-25T12:00:00Z',0,{search:'?gacha-test=1',AudioContext:FakeAudio});
assert.equal(app.get('anomalyDialog').open,true,'test mode opens directly');
assert.match(app.get('anomalyCaseContent').innerHTML,/TEST MODE \/\/ NO REAL REWARDS/);
const qaClick=tier=>app.get('anomalyCaseContent').click({target:{closest:selector=>
 selector==='[data-anomaly-test]'?{dataset:{anomalyTest:tier}}:null}});
qaClick('SR');
assert.equal(app.core.status().collection,1);
assert.equal(app.core.status().pulls[0].cardId,'foldhart','forced SR in QA');
assert.equal(storage.get('cinegenome_anomaly_daily_v2'),genuine,'real progress untouched by QA');
assert(testStorage.has('cinegenome_gacha_qa_session_v1'),'QA saved in session only');
app.get('anomalyDialog').lastOverlay.click({target:{closest:selector=>selector==='[data-reveal-continue]'?{}:null}});
qaClick('SR');
assert.equal(app.core.status().collection,2,'test duplicate can be previewed');
assert.match(app.get('anomalyDialog').lastOverlay.innerHTML,/DUPLICATE/);
app.get('anomalyDialog').lastOverlay.click({target:{closest:selector=>selector==='[data-reveal-continue]'?{}:null}});
app.get('anomalyCaseContent').click({target:{closest:selector=>selector==='[data-anomaly-test-reset]'?{}:null}});
assert.equal(app.core.status().collection,0,'reset removes QA cards');
assert.equal(storage.get('cinegenome_anomaly_daily_v2'),genuine,'reset leaves real collection intact');
console.log('PASS: quest draws, migration, rarity, audio, skip, isolated QA and forced SR');

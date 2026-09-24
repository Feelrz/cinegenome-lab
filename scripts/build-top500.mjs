// Build an enriched Top-500 catalog from the bundled title snapshot using TMDB.
// Usage:
//   TMDB_API_KEY=... node scripts/build-top500.mjs
//   or TMDB_READ_TOKEN=... node scripts/build-top500.mjs
// Output:
//   data/top500-enriched.json
//
// The script is intentionally conservative: one request chain at a time + delay.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const token = process.env.TMDB_READ_TOKEN || '';
const apiKey = process.env.TMDB_API_KEY || '';
if (!token && !apiKey) throw new Error('Set TMDB_API_KEY or TMDB_READ_TOKEN first.');
const top500Source = await fs.readFile(path.join(root,'data','top500.js'),'utf8');
const sandbox = { window:{} }; vm.createContext(sandbox); vm.runInContext(top500Source,sandbox);
const items = sandbox.window.CINEGENOME_TOP500 || (sandbox.window.CINEGENOME_TOP500_TITLES || []).map(title=>({title,year:null}));
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
function hash32(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const dims=['surrealism','loneliness','chaos','romance','nostalgia','intensity','pacing','visualExtremity','narrativeComplexity','darkness','humor','dreamLogic'];
function seeded(seed,key,min=43,max=57){return Math.round(min+(hash32(`${seed}|${key}`)%1000/999)*(max-min));}
function add(dna,key,n){dna[key]=clamp((dna[key]||0)+n);}
function generateDNA(data){
  const seed=`${data.id}|${data.title}|${data.release_date}|genome-v3`; const dna={}; dims.forEach(k=>dna[k]=seeded(seed,k));
  const genres=(data.genres||[]).map(x=>(x.name||'').toLowerCase());
  const kws=(data.keywords?.keywords||data.keywords?.results||[]).map(x=>(x.name||'').toLowerCase());
  const overview=String(data.overview||'').toLowerCase();
  const title=String(data.title||data.original_title||'').toLowerCase();
  const text=[title,overview,...kws].join(' ');
  const director=((data.credits?.crew||[]).find(x=>x.job==='Director')?.name||'').toLowerCase();
  const runtime=Number(data.runtime)||0;
  const year=Number(String(data.release_date||'').slice(0,4))||0;
  const apply=(rule,mult=1)=>Object.entries(rule||{}).forEach(([k,v])=>add(dna,k,Math.round(v*mult)));
  const genreRules={horror:{darkness:22,intensity:15,loneliness:7,romance:-8,humor:-10,dreamLogic:5},thriller:{intensity:16,darkness:10,pacing:11,narrativeComplexity:7},romance:{romance:27,nostalgia:7,loneliness:4,darkness:-5},comedy:{humor:28,darkness:-11,intensity:-5,chaos:4},fantasy:{surrealism:15,dreamLogic:18,visualExtremity:10,nostalgia:5},mystery:{narrativeComplexity:18,dreamLogic:9,darkness:5},animation:{visualExtremity:12,dreamLogic:8,surrealism:5},'science fiction':{surrealism:9,narrativeComplexity:11,visualExtremity:13,dreamLogic:6},'sci-fi':{surrealism:9,narrativeComplexity:11,visualExtremity:13,dreamLogic:6},action:{intensity:19,pacing:19,chaos:13,narrativeComplexity:-4},adventure:{pacing:10,visualExtremity:8,intensity:7,darkness:-3},war:{darkness:20,intensity:18,loneliness:10,romance:-9,humor:-9},crime:{darkness:13,intensity:9,chaos:7,narrativeComplexity:6},drama:{loneliness:6,narrativeComplexity:7,intensity:3},documentary:{surrealism:-11,dreamLogic:-13,narrativeComplexity:7},music:{nostalgia:8,romance:4,visualExtremity:5},family:{darkness:-10,humor:7,nostalgia:8,romance:3},history:{darkness:5,narrativeComplexity:8,nostalgia:6},western:{nostalgia:7,loneliness:7,intensity:7,darkness:4}};
  genres.forEach(g=>apply(genreRules[g]));
  const signals=[[/dream|dreaming|oneiric|nightmare|sleep/,{surrealism:22,dreamLogic:28,narrativeComplexity:5}],[/surreal|surrealism|hallucinat|psychedelic|visionary/,{surrealism:28,dreamLogic:24,visualExtremity:17}],[/paranoi|conspiracy|obsession|obsessive/,{darkness:13,loneliness:10,narrativeComplexity:11,intensity:8}],[/identity|double|doppelg|alter ego|memory loss|amnesia/,{narrativeComplexity:16,dreamLogic:11,loneliness:6,surrealism:8}],[/isolation|isolated|lonely|loneliness|solitude|alienation/,{loneliness:25,darkness:10,pacing:-5}],[/grief|mourning|bereav|loss of|death of/,{loneliness:18,darkness:15,nostalgia:11,humor:-7}],[/memory|remember|recollection|past life|childhood/,{nostalgia:18,narrativeComplexity:6,dreamLogic:4}],[/revenge|vengeance/,{intensity:17,darkness:16,chaos:8,romance:-5}],[/murder|serial killer|killing|assassin/,{darkness:18,intensity:14,chaos:9,humor:-8}],[/war|battle|soldier|occupation|genocide|holocaust/,{darkness:24,intensity:19,loneliness:11,humor:-12}],[/love|lover|romance|romantic|relationship|marriage/,{romance:18,nostalgia:6,loneliness:4}],[/friendship|friends|coming of age|youth|adolescen/,{nostalgia:13,romance:3,humor:4}],[/absurd|absurdist|satire|satirical|farce/,{surrealism:12,humor:18,chaos:8,dreamLogic:7}],[/religion|faith|god|spiritual|existential|meaning of life/,{narrativeComplexity:16,loneliness:10,darkness:7,pacing:-6}],[/experimental|avant-garde|nonlinear|non-linear|fragmented/,{surrealism:17,visualExtremity:19,narrativeComplexity:16,dreamLogic:15}],[/body horror|mutation|transformation|metamorph/,{visualExtremity:20,intensity:17,darkness:14,surrealism:12}],[/dystop|apocalypse|post-apocalyptic|totalitarian/,{darkness:20,chaos:14,loneliness:9,intensity:13}],[/city|urban|nightlife|neon/,{visualExtremity:8,loneliness:6,pacing:5}],[/quiet|meditative|contemplative|slow burn|slow-burn/,{pacing:-17,loneliness:8,narrativeComplexity:7}],[/fast-paced|frenetic|kinetic|race against time/,{pacing:18,intensity:13,chaos:9}],[/musical|music|band|singer|song|dance/,{nostalgia:7,visualExtremity:8,humor:4}],[/comedy|comic|funny|humorous/,{humor:18,darkness:-6}],[/trauma|abuse|violence|torture/,{darkness:18,intensity:16,loneliness:9,humor:-11}],[/family|mother|father|parent|sibling/,{nostalgia:8,loneliness:5,romance:3}],[/time travel|alternate reality|parallel|simulation/,{surrealism:15,dreamLogic:16,narrativeComplexity:17}],[/monster|ghost|supernatural|haunted|demon/,{darkness:15,surrealism:10,dreamLogic:8,intensity:9}]];
  signals.forEach(([rx,rule])=>{if(rx.test(text))apply(rule);});
  if(/dream|hallucinat|surreal/.test(text)&&/identity|memory|amnesia|double/.test(text))apply({surrealism:10,dreamLogic:13,narrativeComplexity:10});
  if(/love|relationship|romance/.test(text)&&/memory|past|loss|grief/.test(text))apply({romance:8,nostalgia:13,loneliness:8});
  if(/war|genocide|occupation/.test(text)&&/child|family|civilian/.test(text))apply({darkness:9,loneliness:9,intensity:7});
  if(/absurd|satire/.test(text)&&genres.includes('comedy'))apply({humor:9,surrealism:7,chaos:5});
  if(genres.includes('animation')&&/dream|fantasy|surreal|magical/.test(text))apply({visualExtremity:9,dreamLogic:8,surrealism:7});
  if(runtime>=180)apply({pacing:-16,narrativeComplexity:9,intensity:3}); else if(runtime>=145)apply({pacing:-9,narrativeComplexity:6}); else if(runtime>0&&runtime<=85)apply({pacing:10,narrativeComplexity:-3});
  if(year&&year<1960)apply({nostalgia:9,visualExtremity:-3}); else if(year&&year<1980)apply({nostalgia:6}); else if(year&&year<2000)apply({nostalgia:3});
  const directorRules={'david lynch':{surrealism:13,dreamLogic:15,darkness:6,narrativeComplexity:9},'andrei tarkovsky':{pacing:-12,narrativeComplexity:10,loneliness:8,dreamLogic:8},'wong kar-wai':{romance:9,nostalgia:11,loneliness:9,visualExtremity:7},'stanley kubrick':{visualExtremity:8,narrativeComplexity:7,darkness:5,humor:-2},'satoshi kon':{surrealism:12,dreamLogic:14,narrativeComplexity:10,visualExtremity:7},'ingmar bergman':{loneliness:11,darkness:8,narrativeComplexity:10,pacing:-6},'federico fellini':{surrealism:9,dreamLogic:9,visualExtremity:7,humor:4},'yasujirō ozu':{pacing:-11,nostalgia:10,loneliness:7,intensity:-7},'yasujiro ozu':{pacing:-11,nostalgia:10,loneliness:7,intensity:-7},'park chan-wook':{visualExtremity:9,intensity:9,darkness:7,narrativeComplexity:7},'gaspar noé':{visualExtremity:13,intensity:12,surrealism:8,darkness:8},'gaspar noe':{visualExtremity:13,intensity:12,surrealism:8,darkness:8},'sion sono':{chaos:11,intensity:9,surrealism:7,romance:4},'akira kurosawa':{intensity:6,narrativeComplexity:6,visualExtremity:5},'hiroshi teshigahara':{surrealism:9,loneliness:9,visualExtremity:8,dreamLogic:7},'charlie kaufman':{surrealism:11,narrativeComplexity:13,dreamLogic:12,loneliness:7}};
  if(directorRules[director])apply(directorRules[director]);
  let confidence=.42;if(genres.length)confidence+=.13;if(kws.length>=3)confidence+=.14;else if(kws.length)confidence+=.07;if(overview.length>=100)confidence+=.12;else if(overview.length)confidence+=.06;if(director)confidence+=.07;if(runtime)confidence+=.05;confidence=Math.min(.93,Math.round(confidence*100)/100);
  if(confidence<.68)dims.forEach(k=>dna[k]=Math.round(50+(dna[k]-50)*.76));
  dims.forEach(k=>dna[k]=clamp(dna[k]));
  return {dna,confidence};
}
async function tmdb(pathname,params={}){
  const u=new URL(`https://api.themoviedb.org/3${pathname}`); Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v))); if(apiKey && !token)u.searchParams.set('api_key',apiKey);
  for(let attempt=0;attempt<5;attempt++){
    const headers={accept:'application/json'}; if(token)headers.Authorization=`Bearer ${token}`;
    const r=await fetch(u,{headers});
    if(r.status===429){await sleep(1000*(attempt+1));continue;}
    if(!r.ok)throw new Error(`${r.status} ${await r.text()}`); return r.json();
  }
  throw new Error('TMDB rate-limit retry exhausted');
}
async function resolve(title,year){
  const s=await tmdb('/search/movie',{query:title,include_adult:false,language:'en-US',...(year?{year}: {})}); if(!s.results?.length)return null;
  const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); const target=norm(title);
  const hit=[...s.results].sort((a,b)=>Number([a.title,a.original_title].some(x=>norm(x)===target))<Number([b.title,b.original_title].some(x=>norm(x)===target))?1:-1)[0];
  return tmdb(`/movie/${hit.id}`,{language:'en-US',append_to_response:'credits,keywords'});
}
const output=[]; const failures=[];
for(let i=0;i<items.length;i++){
  const {title,year}=items[i]; process.stdout.write(`\r${String(i+1).padStart(3)}/${items.length} ${title.slice(0,55).padEnd(55)}`);
  try{
    const d=await resolve(title,year); if(!d){failures.push({title,year,error:'NO_MATCH'});continue;}
    output.push({tmdbId:d.id,title:d.title,originalTitle:d.original_title,year:Number(String(d.release_date||'').slice(0,4))||null,director:(d.credits?.crew||[]).find(x=>x.job==='Director')?.name||null,country:(d.production_countries||[]).map(x=>x.name).join(' / '),overview:d.overview||'',posterPath:d.poster_path||'',backdropPath:d.backdrop_path||'',runtime:d.runtime||null,genres:(d.genres||[]).map(x=>x.name),tags:(d.keywords?.keywords||[]).slice(0,10).map(x=>x.name),...(()=>{const profile=generateDNA(d);return {dna:profile.dna,dnaSource:'tmdb-genome-v3',dnaConfidence:profile.confidence,dnaModelVersion:'3.0'};})(),collection:'curated-top500'});
  }catch(e){failures.push({title,error:e.message});}
  await sleep(120);
  if((i+1)%25===0) await fs.writeFile(path.join(root,'data','top500-enriched.partial.json'),JSON.stringify({generatedAt:new Date().toISOString(),movies:output,failures},null,2));
}
const bundle={snapshot:sandbox.window.CINEGENOME_TOP500_SNAPSHOT,generatedAt:new Date().toISOString(),movies:output,failures};
await fs.writeFile(path.join(root,'data','top500-enriched.json'),JSON.stringify(bundle,null,2));
await fs.writeFile(path.join(root,'data','top500-enriched.js'),`window.CINEGENOME_ENRICHED_TOP500 = ${JSON.stringify(output,null,2)};\n`);
console.log(`\nDone. ${output.length} matched; ${failures.length} unresolved.`);

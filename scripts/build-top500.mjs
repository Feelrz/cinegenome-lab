// Build an enriched Top-500 catalog from the bundled title snapshot using TMDB.
// Usage:
//   TMDB_READ_TOKEN=... node scripts/build-top500.mjs
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
const token = process.env.TMDB_READ_TOKEN;
if (!token) throw new Error('Set TMDB_READ_TOKEN first.');
const top500Source = await fs.readFile(path.join(root,'data','top500.js'),'utf8');
const sandbox = { window:{} }; vm.createContext(sandbox); vm.runInContext(top500Source,sandbox);
const titles = sandbox.window.CINEGENOME_TOP500_TITLES || [];
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
function hash32(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const dims=['surrealism','loneliness','chaos','romance','nostalgia','intensity','pacing','visualExtremity','narrativeComplexity','darkness','humor','dreamLogic'];
function seeded(seed,key,min=28,max=70){return Math.round(min+(hash32(`${seed}|${key}`)%1000/999)*(max-min));}
function add(dna,key,n){dna[key]=clamp((dna[key]||0)+n);}
function generateDNA(data){
  const seed=`${data.id}|${data.title}|${data.release_date}`; const dna={}; dims.forEach(k=>dna[k]=seeded(seed,k));
  const genres=(data.genres||[]).map(x=>(x.name||'').toLowerCase());
  const kws=(data.keywords?.keywords||data.keywords?.results||[]).map(x=>(x.name||'').toLowerCase());
  const text=[data.overview||'',...kws].join(' ').toLowerCase();
  const g={horror:{darkness:24,intensity:16,romance:-8,humor:-8},thriller:{intensity:17,darkness:12,pacing:10},romance:{romance:30,loneliness:6},comedy:{humor:30,darkness:-12},fantasy:{surrealism:15,dreamLogic:18,visualExtremity:8},mystery:{narrativeComplexity:18,dreamLogic:8},animation:{visualExtremity:12,dreamLogic:7},'science fiction':{surrealism:8,narrativeComplexity:10,visualExtremity:12},action:{intensity:19,pacing:20,chaos:14},war:{darkness:19,intensity:18,romance:-8},crime:{darkness:12,intensity:8},drama:{loneliness:6,narrativeComplexity:6}};
  genres.forEach(x=>Object.entries(g[x]||{}).forEach(([k,v])=>add(dna,k,v)));
  const w={dream:{surrealism:22,dreamLogic:28},surreal:{surrealism:30,dreamLogic:20},hallucinat:{surrealism:24,dreamLogic:26},paranoia:{darkness:14,loneliness:13,narrativeComplexity:10},identity:{narrativeComplexity:14,dreamLogic:8,loneliness:7},isolation:{loneliness:25,darkness:12},lonely:{loneliness:25},grief:{loneliness:18,darkness:15,nostalgia:8},memory:{nostalgia:20,narrativeComplexity:7},childhood:{nostalgia:20},psychedelic:{surrealism:28,visualExtremity:25,dreamLogic:25},experimental:{surrealism:18,visualExtremity:20,narrativeComplexity:14},violence:{intensity:20,darkness:15,chaos:12},revenge:{intensity:16,darkness:16},love:{romance:14},relationship:{romance:10,loneliness:5},absurd:{surrealism:18,humor:12,chaos:10},music:{nostalgia:8,visualExtremity:7},dance:{pacing:12,visualExtremity:10},dystop:{darkness:18,loneliness:10},apocalypse:{darkness:24,chaos:18}};
  Object.entries(w).forEach(([word,rule])=>{if(text.includes(word))Object.entries(rule).forEach(([k,v])=>add(dna,k,v));});
  return dna;
}
async function tmdb(pathname,params={}){
  const u=new URL(`https://api.themoviedb.org/3${pathname}`); Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v)));
  for(let attempt=0;attempt<5;attempt++){
    const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`,accept:'application/json'}});
    if(r.status===429){await sleep(1000*(attempt+1));continue;}
    if(!r.ok)throw new Error(`${r.status} ${await r.text()}`); return r.json();
  }
  throw new Error('TMDB rate-limit retry exhausted');
}
async function resolve(title){
  const s=await tmdb('/search/movie',{query:title,include_adult:false,language:'en-US'}); if(!s.results?.length)return null;
  const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); const target=norm(title);
  const hit=[...s.results].sort((a,b)=>Number([a.title,a.original_title].some(x=>norm(x)===target))<Number([b.title,b.original_title].some(x=>norm(x)===target))?1:-1)[0];
  return tmdb(`/movie/${hit.id}`,{language:'en-US',append_to_response:'credits,keywords'});
}
const output=[]; const failures=[];
for(let i=0;i<titles.length;i++){
  const title=titles[i]; process.stdout.write(`\r${String(i+1).padStart(3)}/${titles.length} ${title.slice(0,55).padEnd(55)}`);
  try{
    const d=await resolve(title); if(!d){failures.push({title,error:'NO_MATCH'});continue;}
    output.push({tmdbId:d.id,title:d.title,originalTitle:d.original_title,year:Number(String(d.release_date||'').slice(0,4))||null,director:(d.credits?.crew||[]).find(x=>x.job==='Director')?.name||null,country:(d.production_countries||[]).map(x=>x.name).join(' / '),overview:d.overview||'',posterPath:d.poster_path||'',backdropPath:d.backdrop_path||'',runtime:d.runtime||null,genres:(d.genres||[]).map(x=>x.name),tags:(d.keywords?.keywords||[]).slice(0,10).map(x=>x.name),dna:generateDNA(d),dnaSource:'auto-tmdb-v1',collection:'curated-top500'});
  }catch(e){failures.push({title,error:e.message});}
  await sleep(120);
  if((i+1)%25===0) await fs.writeFile(path.join(root,'data','top500-enriched.partial.json'),JSON.stringify({generatedAt:new Date().toISOString(),movies:output,failures},null,2));
}
const bundle={snapshot:sandbox.window.CINEGENOME_TOP500_SNAPSHOT,generatedAt:new Date().toISOString(),movies:output,failures};
await fs.writeFile(path.join(root,'data','top500-enriched.json'),JSON.stringify(bundle,null,2));
await fs.writeFile(path.join(root,'data','top500-enriched.js'),`window.CINEGENOME_ENRICHED_TOP500 = ${JSON.stringify(output,null,2)};\n`);
console.log(`\nDone. ${output.length} matched; ${failures.length} unresolved.`);

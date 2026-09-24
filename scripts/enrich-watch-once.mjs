// Optional build-time enrichment for every supplemental film. Credentials stay in env.
// Run inside project root: TMDB_READ_TOKEN=... node scripts/enrich-watch-once.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const root=new URL('../',import.meta.url);
const url=new URL('data/watch-once-extra.js',root);
const token=process.env.TMDB_READ_TOKEN;
const key=process.env.TMDB_API_KEY;
if(!token&&!key)throw new Error('Provide TMDB_READ_TOKEN or TMDB_API_KEY in the environment.');
const context={window:{}};
for(const filename of ['data/movies.js','js/dna-model.js','data/watch-once-extra.js']){
  runInNewContext(readFileSync(new URL(filename,root),'utf8'),context);
}
const films=context.window.CINEGENOME_WATCH_ONCE_EXTRA;
const profile=context.window.CINEGENOME_DNA_MODEL.profile;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const normalize=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
async function request(path,params={}){
  const qs=new URLSearchParams(params);if(key&&!token)qs.set('api_key',key);
  for(let attempt=0;attempt<4;attempt++){
    const response=await fetch(`https://api.themoviedb.org/3${path}?${qs}`,{
      headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(15000)
    });
    if((response.status===429||response.status>=500)&&attempt<3){await pause(800*(attempt+1));continue}
    if(!response.ok)throw new Error(`TMDB HTTP ${response.status} for ${path}`);
    return response.json();
  }
}
async function resolve(film){
  const query={query:film.title,year:film.year,include_adult:'false',language:'en-US'};
  let search=await request('/search/movie',query);
  if(!search.results?.length){delete query.year;search=await request('/search/movie',query)}
  const candidates=(search.results||[]).filter(item=>{
    const year=Number(String(item.release_date||'').slice(0,4));
    const exact=normalize(item.title)===normalize(film.title)||normalize(item.original_title)===normalize(film.title);
    return exact&&year&&Math.abs(year-film.year)<=2;
  }).sort((a,b)=>{
    const exactA=normalize(a.title)===normalize(film.title)||normalize(a.original_title)===normalize(film.title);
    const exactB=normalize(b.title)===normalize(film.title)||normalize(b.original_title)===normalize(film.title);
    return Number(exactB)-Number(exactA)||Math.abs(Number(a.release_date.slice(0,4))-film.year)-Math.abs(Number(b.release_date.slice(0,4))-film.year);
  });
  if(!candidates.length)return null;
  return request(`/movie/${candidates[0].id}`,{language:'en-US',append_to_response:'credits,keywords'});
}
let done=0,unmatched=0,processed=0;
function save(){writeFileSync(url,`/* Watch-once extras; CineGenome DNA is a metadata-based inference, never a rating. */\nwindow.CINEGENOME_WATCH_ONCE_EXTRA = ${JSON.stringify(films)};\n`)}
for(const film of films){
  if(film.dnaSource==='tmdb-genome-v3')continue;
  try{
    const data=await resolve(film);
    if(!data){unmatched++;continue}
    const estimated=profile(data);
    Object.assign(film,{
      tmdbId:data.id,director:(data.credits?.crew||[]).find(c=>c.job==='Director')?.name||'Unknown',
      country:(data.production_countries||[]).map(c=>c.name).join(' / ')||'Unknown',
      genres:(data.genres||[]).map(g=>g.name),tags:(data.keywords?.keywords||data.keywords?.results||[]).map(k=>k.name).slice(0,14),
      overview:data.overview||'',posterPath:data.poster_path||'',backdropPath:data.backdrop_path||'',
      runtime:data.runtime||null,dna:estimated.dna,dnaSource:estimated.source,
      dnaConfidence:estimated.confidence,dnaModelVersion:'3.0'
    });
    done++;
  }catch(error){console.warn(`Skipped ${film.title} (${film.year}): ${error.message}`)}
  if(++processed%20===0)save();
  await pause(120);
}
save();
console.log(`Metadata enriched: ${done}; unmatched: ${unmatched}; see data/watch-once-extra.js.`);

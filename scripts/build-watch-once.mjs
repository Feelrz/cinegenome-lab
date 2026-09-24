// Regenerate the supplemental catalog from the dated Letterboxd title/year snapshot.
// Run: node scripts/build-watch-once.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const base=new URL('../',import.meta.url);
const read=(name)=>readFileSync(new URL(name,base),'utf8');
const source=JSON.parse(read('data/watch-once-source.json'));
const curated=JSON.parse(read('data/top500-enriched.json')).films;
const norm=s=>String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const key=m=>`${norm(m.title)}|${Number(m.year)}`;
const seen=new Set(curated.map(key));
const context={window:{}};
runInNewContext(read('data/movies.js'),context);
runInNewContext(read('js/dna-model.js'),context);
const movies=[];
for(const item of source){
  if(seen.has(key(item)))continue;
  seen.add(key(item));
  const index=movies.length+1;
  const {dna}=context.window.CINEGENOME_DNA_MODEL.profile({
    id:`watch-once-${index}`,title:item.title,release_date:`${item.year}-01-01`,genres:[],overview:''
  });
  movies.push({id:3000000+index,title:item.title,year:item.year,
    director:'Metadata pending',country:'Unknown',genres:[],tags:[],overview:'',
    posterPath:'',runtime:null,dna,dnaSource:'provisional-title-year',
    dnaConfidence:.42,dnaModelVersion:'3.0-provisional',inWatchOnce:true,inCurated500:false});
}
if(source.length!==800||curated.length!==500||movies.length!==511)throw new Error('List snapshot changed; review matches before publishing.');
writeFileSync(new URL('data/watch-once-extra.js',base),
  `/* ${movies.length} additional titles; title/year verified against the linked Letterboxd snapshot.\n   Initial DNA is visibly provisional; both interfaces rebuild it from TMDB metadata when available. */\nwindow.CINEGENOME_WATCH_ONCE_EXTRA = ${JSON.stringify(movies)};\n`);
console.log(`Generated ${movies.length} additional titles. Curated Top 500 remains unchanged.`);

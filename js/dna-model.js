/* Shared film-DNA inference. Model interpretations of verified metadata, not objective film ratings. */
(() => {
  'use strict';
  const DIM_KEYS=(window.CINEGENOME_DIMENSIONS||[]).map(d=>d.key);
  function clamp(value){return Math.max(0,Math.min(100,Number(value)))}
  function addDNA(dna,key,amount){ dna[key]=clamp(dna[key]+amount); }

  function generateDNAProfileFromTMDB(data) {
    // A neutral prior is an explicit model assumption. Missing metadata cannot produce DNA.
    const dna={}; DIM_KEYS.forEach(k=>dna[k]=50);
    const genres=[...new Set((data.genres||[]).map(g=>String(g.name||'').toLowerCase()).filter(Boolean))];
    const keywords=(data.keywords?.keywords||data.keywords?.results||[]).map(k=>String(k.name||'').toLowerCase());
    const overview=String(data.overview||'').toLowerCase();
    if(!genres.length && !keywords.length && overview.trim().length<20) return null;
    const text=[overview,...keywords].join(' ');
    const evidence=Object.fromEntries(DIM_KEYS.map(k=>[k,[]]));
    const apply=(rule,source)=>Object.entries(rule||{}).forEach(([k,v])=>{
      if(!Object.prototype.hasOwnProperty.call(dna,k))return;
      addDNA(dna,k,v);
      evidence[k].push(source);
    });
    // Boundaries prevent fragments such as "war" inside "award" from becoming evidence.
    const matches=(rx,s)=>new RegExp(`(?:^|[^a-z])(?:${rx.source})(?=$|[^a-z])`,'i').test(s);

    // Genre gives narrow directional evidence. Animation, sci-fi, drama or an
    // older release alone cannot prove visual maximalism, complexity or nostalgia.
    const genreRules={
      horror:{darkness:18,intensity:8},thriller:{intensity:12},
      romance:{romance:22},comedy:{humor:22},
      mystery:{narrativeComplexity:8},action:{intensity:15,pacing:9},
      adventure:{pacing:5},war:{darkness:14,intensity:10},
      crime:{darkness:6}
    };
    genres.forEach(g=>apply(genreRules[g],`genre:${g}`));

    const signals=[
      [/dream|dreams|dreaming|dreamlike|oneiric|nightmare|nightmares/,{dreamLogic:23,surrealism:12}],
      [/surreal|surrealism|hallucination|hallucinations|psychedelic/,{surrealism:23,dreamLogic:15}],
      [/paranoia|paranoid|conspiracy|obsession|obsessive/,{darkness:9,intensity:7}],
      [/doppelganger|alter ego|memory loss|amnesia/,{narrativeComplexity:11}],
      [/isolation|isolated|lonely|loneliness|solitude|alienation/,{loneliness:20}],
      [/grief|mourning|bereavement/,{loneliness:10,darkness:10}],
      [/nostalgia|nostalgic|longing|reminiscence|childhood memories/,{nostalgia:20}],
      [/revenge|vengeance/,{intensity:13,darkness:10}],
      [/murder|murders|murderer|murderers|serial killer|assassination/,{darkness:15,intensity:10}],
      [/war|wars|battle|battles|genocide|holocaust/,{darkness:16,intensity:13}],
      [/love|lovers|lover|romance|romantic|relationship|relationships/,{romance:16}],
      [/absurd|absurdist/,{surrealism:12,humor:6}],
      [/satire|satirical|farce/,{humor:12}],
      [/experimental|avant-garde|fragmented/,{visualExtremity:14,narrativeComplexity:9}],
      [/nonlinear|non-linear/,{narrativeComplexity:18}],
      [/body horror/,{darkness:18,intensity:14,visualExtremity:7}],
      [/dystopia|dystopian|apocalypse|apocalyptic/,{darkness:14,chaos:10}],
      [/quiet|meditative|contemplative|slow burn|slow-burn/,{pacing:-15}],
      [/fast-paced|frenetic|kinetic|race against time/,{pacing:15,intensity:8}],
      [/comedy|comic|funny|humorous/,{humor:15}],
      [/trauma|abuse|violence|torture/,{darkness:13,intensity:12}],
      [/time travel|alternate reality|parallel universe/,{narrativeComplexity:14,surrealism:7}]
    ];
    signals.forEach(([rx,rule])=>{
      const inKeywords=keywords.some(k=>matches(rx,k));
      if(inKeywords || matches(rx,overview)) apply(rule,`${inKeywords?'keyword':'synopsis'}:${rx.source.split('|')[0]}`);
    });

    // The only interaction is a documented combination of explicit themes.
    if(matches(/dream|surreal|hallucination/,text) && matches(/memory|amnesia/,text))
      apply({dreamLogic:6,narrativeComplexity:6},'interaction:dream-memory');

    const coverage=DIM_KEYS.filter(k=>evidence[k].length).length;
    if(coverage<3)return null; // A mostly neutral vector is not a verified film genome.
    const confidence=Math.min(.9,Math.round((.24+(genres.length?.18:0)+(keywords.length?.15:0)+(overview.length>=100?.18:overview.length>=20?.08:0)+.15*coverage/Math.max(1,DIM_KEYS.length))*100)/100);
    // No observed cue for an axis: 50 is a neutral prior, never an observed zero.
    DIM_KEYS.forEach(k=>dna[k]=clamp(Math.round(dna[k])));
    return {dna,confidence,source:'tmdb-genome-v4',modelVersion:'4.0',dnaEvidence:{axes:evidence,coverage,total:DIM_KEYS.length,prior:50,sources:{genres:genres.length,keywords:keywords.length,synopsis:overview.trim().length>=20}}};
  }

  window.CINEGENOME_DNA_MODEL={profile:generateDNAProfileFromTMDB};
})();

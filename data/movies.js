/*
  CINEGENOME V3 database bootstrap.
  The active specimen catalog is the 500-film curated pool in top500-enriched.js.
  DNA values are CineGenome model output, never Letterboxd or TMDB ratings.
*/
window.CINEGENOME_MOVIES = [];
window.CINEGENOME_DIMENSIONS = [
  {key:'surrealism',label:'Surrealism',group:'Mind'},
  {key:'loneliness',label:'Loneliness',group:'Emotion'},
  {key:'chaos',label:'Chaos',group:'Energy'},
  {key:'romance',label:'Romance',group:'Emotion'},
  {key:'nostalgia',label:'Nostalgia',group:'Emotion'},
  {key:'intensity',label:'Intensity',group:'Energy'},
  {key:'pacing',label:'Pacing',group:'Rhythm'},
  {key:'visualExtremity',label:'Visual Extremity',group:'Image'},
  {key:'narrativeComplexity',label:'Narrative Complexity',group:'Mind'},
  {key:'darkness',label:'Darkness',group:'Tone'},
  {key:'humor',label:'Humor',group:'Tone'},
  {key:'dreamLogic',label:'Dream Logic',group:'Mind'}
];
window.CINEGENOME_DATA_VERSION = 'top500-dna-2.0.0';

/**
 * Optional server-side metadata sync example.
 * Never put TMDB_BEARER or SUPABASE_SERVICE_ROLE_KEY in browser JavaScript.
 *
 * npm i @supabase/supabase-js
 * TMDB_BEARER=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node database/tmdb-sync-example.mjs "Perfect Blue"
 */
import { createClient } from '@supabase/supabase-js';

const { TMDB_BEARER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!TMDB_BEARER || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing TMDB_BEARER, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY');
}
const query = process.argv.slice(2).join(' ').trim();
if (!query) throw new Error('Pass a movie title, e.g. node database/tmdb-sync-example.mjs "Perfect Blue"');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const headers = { Authorization: `Bearer ${TMDB_BEARER}`, accept: 'application/json' };

const search = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&include_adult=false`, { headers });
if (!search.ok) throw new Error(`TMDB search failed: ${search.status}`);
const result = (await search.json()).results?.[0];
if (!result) throw new Error('No TMDB result found');

const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${result.id}?append_to_response=credits,keywords`, { headers });
if (!detailRes.ok) throw new Error(`TMDB detail failed: ${detailRes.status}`);
const detail = await detailRes.json();
const director = detail.credits?.crew?.find(p => p.job === 'Director')?.name ?? null;
const tags = detail.keywords?.keywords?.slice(0, 20).map(k => k.name) ?? [];

const row = {
  tmdb_id: detail.id,
  title: detail.title,
  original_title: detail.original_title,
  release_year: Number(String(detail.release_date || '').slice(0,4)) || null,
  director,
  country: detail.production_countries?.map(c => c.name).join(' / ') || null,
  overview: detail.overview || null,
  poster_path: detail.poster_path || null,
  backdrop_path: detail.backdrop_path || null,
  genres: detail.genres?.map(g => g.name) || [],
  tags,
  metadata_source: 'tmdb',
  source_updated_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const { data, error } = await supabase.from('movies').upsert(row, { onConflict: 'tmdb_id' }).select().single();
if (error) throw error;
console.log('Synced metadata:', data);
console.log('DNA scoring intentionally remains separate; write it to movie_dna with your versioned scoring pipeline.');

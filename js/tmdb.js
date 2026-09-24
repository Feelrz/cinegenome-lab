(() => {
  'use strict';
  const CONFIG = Object.assign({
    mode: 'direct',
    apiBase: 'https://api.themoviedb.org/3',
    proxyBase: '/api/tmdb',
    language: 'en-US'
  }, window.CINEGENOME_TMDB_CONFIG || {});
  const TOKEN_KEY = 'cinegenome_tmdb_read_token';

  function token(){
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function setToken(value){
    try {
      if (value) sessionStorage.setItem(TOKEN_KEY, String(value).trim());
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
  function canQuery(){ return CONFIG.mode === 'proxy' || !!token(); }
  async function request(path, params={}){
    const qs = new URLSearchParams(params);
    let url, options={headers:{accept:'application/json'}};
    if (CONFIG.mode === 'proxy') {
      qs.set('path', path);
      url = `${CONFIG.proxyBase}?${qs}`;
    } else {
      const t = token();
      if (!t) throw new Error('TMDB_NOT_CONNECTED');
      url = `${CONFIG.apiBase}${path}?${qs}`;
      options.headers.Authorization = `Bearer ${t}`;
    }
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = new Error(`TMDB_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  async function searchMovie(title, year, {strict=false}={}){
    const params={ query:title, language:CONFIG.language, include_adult:'false', ...(year?{year:String(year)}:{}) };
    let data=await request('/search/movie',params);
    if(strict&&year&&!data.results?.length){delete params.year;data=await request('/search/movie',params)}
    let rows = Array.isArray(data.results) ? data.results : [];
    if (!rows.length) return null;
    const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const target = norm(title);
    if(strict)rows=rows.filter(item=>{
      const exact=[item.title,item.original_title].some(value=>norm(value)===target);
      const releaseYear=Number(String(item.release_date||'').slice(0,4));
      return exact&&(!year||(releaseYear&&Math.abs(releaseYear-Number(year))<=2));
    });
    if(!rows.length)return null;
    return rows.slice().sort((a,b) => {
      const aExact = [a.title,a.original_title].some(x=>norm(x)===target) ? 1 : 0;
      const bExact = [b.title,b.original_title].some(x=>norm(x)===target) ? 1 : 0;
      if (aExact !== bExact) return bExact-aExact;
      return (b.popularity||0)-(a.popularity||0);
    })[0];
  }
  async function details(id){
    return request(`/movie/${Number(id)}`, { language:CONFIG.language, append_to_response:'credits,keywords' });
  }
  async function resolveTitle(title, year, options){
    const hit = await searchMovie(title, year, options);
    if (!hit) return null;
    const full = await details(hit.id);
    return Object.assign({}, hit, full);
  }

  async function health(){
    const data = await request('/configuration');
    return !!(data && data.images && data.images.secure_base_url);
  }

  function posterUrl(path, size='w500'){
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
  }
  function backdropUrl(path, size='w1280'){
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
  }

  window.CINEGENOME_TMDB_SERVICE = { CONFIG, token, setToken, canQuery, request, searchMovie, details, resolveTitle, health, posterUrl, backdropUrl };
})();

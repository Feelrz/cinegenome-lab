(() => {
  'use strict';

  const MOVIES = Array.isArray(window.CINEGENOME_MOVIES) ? window.CINEGENOME_MOVIES : [];
  const ENRICHED_TOP500 = Array.isArray(window.CINEGENOME_ENRICHED_TOP500) ? window.CINEGENOME_ENRICHED_TOP500 : [];
  ENRICHED_TOP500.forEach((m, i) => {
    if (!m || !m.dna || MOVIES.some(x => x.tmdbId && Number(x.tmdbId) === Number(m.tmdbId))) return;
    MOVIES.push(Object.assign({ id: 2000000 + i + 1, country:'Unknown', genres:[], tags:[] }, m));
  });
  const DIMS = Array.isArray(window.CINEGENOME_DIMENSIONS) ? window.CINEGENOME_DIMENSIONS : [];
  const VERSION = window.CINEGENOME_DATA_VERSION || 'unknown';
  const DIM_KEYS = DIMS.map(d => d.key);
  const STORAGE_KEY = 'cinegenome_lab_v1';
  const RX_KEY = 'cinegenome_daily_rx_v1';
  const TMDB_CACHE_KEY = 'cinegenome_tmdb_movie_cache_v1';
  const TOP500 = Array.isArray(window.CINEGENOME_TOP500_TITLES) ? window.CINEGENOME_TOP500_TITLES : [];
  const TMDB = window.CINEGENOME_TMDB_SERVICE || null;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));
  const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  let state = loadState();
  let currentScannerId = MOVIES[0]?.id || null;
  let mutationDNA = cloneDNA(MOVIES[0]?.dna || {});
  let logs = [];
  let currentPrescription = null;
  let ritualTimers = [];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        archive: Array.isArray(parsed.archive) ? parsed.archive : []
      };
    } catch {
      return { favorites: [], archive: [] };
    }
  }

  function persistState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function cloneDNA(dna) {
    const out = {};
    DIM_KEYS.forEach(k => out[k] = clamp(dna?.[k]));
    return out;
  }

  function movieById(id) { return MOVIES.find(m => m.id === Number(id)); }

  function scoreSimilarity(a, b, weights = {}) {
    if (!a || !b || !DIM_KEYS.length) return 0;
    let total = 0, weightTotal = 0;
    DIM_KEYS.forEach(key => {
      const w = Number(weights[key] ?? 1);
      const diff = clamp(a[key]) - clamp(b[key]);
      total += w * diff * diff;
      weightTotal += w;
    });
    const rms = Math.sqrt(total / Math.max(weightTotal, 1));
    return Math.round(clamp(100 - rms));
  }

  function nearest(dna, excludeIds = [], limit = 6) {
    return MOVIES
      .filter(m => !excludeIds.includes(m.id))
      .map(movie => ({ movie, score: scoreSimilarity(dna, movie.dna) }))
      .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title))
      .slice(0, limit);
  }

  function blendDNA(a, b, ratioA = 50) {
    const wa = clamp(ratioA) / 100;
    const wb = 1 - wa;
    const out = {};
    DIM_KEYS.forEach(k => out[k] = Math.round(clamp(a?.[k]) * wa + clamp(b?.[k]) * wb));
    return out;
  }

  function dominantTraits(dna, count = 3) {
    return DIMS.map(d => ({ ...d, value: clamp(dna[d.key]) })).sort((a,b) => b.value - a.value).slice(0, count);
  }

  function lowestTraits(dna, count = 2) {
    return DIMS.map(d => ({ ...d, value: clamp(dna[d.key]) })).sort((a,b) => a.value - b.value).slice(0, count);
  }

  function stability(dna) {
    const chaos = clamp(dna.chaos);
    const dream = clamp(dna.dreamLogic);
    const intensity = clamp(dna.intensity);
    const complexity = clamp(dna.narrativeComplexity);
    return Math.round(clamp(100 - (chaos * .30 + dream * .18 + intensity * .17 + complexity * .10) + 24));
  }

  function pathologyReport(movie, dna = movie?.dna) {
    if (!dna) return 'No readable genome found.';
    const top = dominantTraits(dna, 3);
    const low = lowestTraits(dna, 1)[0];
    const words = top.map(t => t.label.toLowerCase()).join(', ');
    let warning = 'Genome remains within controllable laboratory parameters.';
    if (dna.chaos >= 90) warning = 'Severe volatility detected. Do not expose to linear narrative structures.';
    else if (dna.dreamLogic >= 90) warning = 'Reality membrane unstable. Dream-state contamination is probable.';
    else if (dna.loneliness >= 90) warning = 'Extreme isolation signature detected. Emotional vacuum is persistent.';
    else if (dna.darkness >= 90) warning = 'High darkness concentration. Extended exposure may alter tonal baseline.';
    return `Dominant expression: ${words}. Suppressed trait: ${low.label.toLowerCase()} (${low.value}). ${warning}`;
  }

  function log(message) {
    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    logs.unshift({ time, message });
    logs = logs.slice(0, 80);
    renderLogs();
  }

  function archiveExperiment(type, title, detail, dna = null) {
    state.archive.unshift({ id: Date.now(), type, title, detail, dna: dna ? cloneDNA(dna) : null, at: new Date().toISOString() });
    state.archive = state.archive.slice(0, 50);
    persistState();
    renderArchive();
  }

  function fillMovieSelect(select, includeBlank = false) {
    if (!select) return;
    select.innerHTML = includeBlank ? '<option value="">SELECT SPECIMEN</option>' : '';
    MOVIES.slice().sort((a,b) => a.title.localeCompare(b.title)).forEach(m => {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = `${m.title} (${m.year})`;
      select.appendChild(o);
    });
  }

  function renderDNAGrid(el, dna) {
    if (!el) return;
    el.innerHTML = DIMS.map(d => {
      const v = clamp(dna?.[d.key]);
      const cls = v >= 88 ? 'hot' : v >= 72 ? 'acid' : '';
      return `<div class="dna-row ${cls}"><span>${esc(d.label.toUpperCase())}</span><div class="dna-track"><div class="dna-fill" style="width:${v}%"></div></div><span class="dna-value">${v}</span></div>`;
    }).join('');
  }

  function drawScope(svg, dna, seed = 1, label = 'GENOME WAVEFORM') {
    if (!svg || !dna) return;
    const w = 900, h = 270, mid = 135;
    const chaos = clamp(dna.chaos) / 100;
    const intensity = clamp(dna.intensity) / 100;
    const dream = clamp(dna.dreamLogic) / 100;
    const pacing = clamp(dna.pacing) / 100;
    const visual = clamp(dna.visualExtremity) / 100;
    let p1 = '', p2 = '', bars = '';
    for (let x=0; x<=w; x+=4) {
      const t = x / w;
      const wave = Math.sin(t * Math.PI * (4 + pacing * 16) + seed) * (22 + intensity * 47);
      const distortion = Math.sin(t * Math.PI * (17 + chaos * 29) + seed*2.7) * chaos * 20;
      const drift = Math.sin(t * Math.PI * 2 + dream * 3) * dream * 23;
      const y = mid + wave * (.55 + .35 * Math.sin(t * Math.PI * 3 + dream)) + distortion + drift;
      const y2 = mid - wave * .58 + Math.sin(t*Math.PI*11 + seed) * visual * 15;
      p1 += `${x===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)} `;
      p2 += `${x===0?'M':'L'}${x.toFixed(1)},${y2.toFixed(1)} `;
    }
    DIMS.slice(0, 12).forEach((d, i) => {
      const x = 45 + i * 72;
      const v = clamp(dna[d.key]);
      const bh = 10 + v * .55;
      bars += `<rect x="${x}" y="${242-bh}" width="12" height="${bh}" fill="${v>88?'#d03728':'#b8ff35'}" opacity=".82"/><text x="${x+6}" y="258" text-anchor="middle" fill="#8e9887" font-size="7">${esc(d.label.slice(0,3).toUpperCase())}</text>`;
    });
    svg.innerHTML = `
      <rect width="900" height="270" fill="#121712"/>
      <g opacity=".7">${gridLines(w,h)}</g>
      <path d="${p2}" fill="none" stroke="#7d9e55" stroke-width="1.2" opacity=".6"/>
      <path d="${p1}" fill="none" stroke="#b8ff35" stroke-width="2.2"/>
      <line x1="0" y1="135" x2="900" y2="135" stroke="#566052" stroke-dasharray="5 8" opacity=".55"/>
      ${bars}
      <text x="18" y="22" fill="#b8ff35" font-size="10">${esc(label)}</text>
      <text x="882" y="22" text-anchor="end" fill="#7f8a79" font-size="9">STABILITY ${stability(dna)}%</text>`;
  }

  function gridLines(w,h) {
    let s='';
    for(let x=0;x<=w;x+=45) s += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#283126" stroke-width="1"/>`;
    for(let y=0;y<=h;y+=27) s += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#283126" stroke-width="1"/>`;
    return s;
  }

  function renderRanks(el, rows) {
    if (!el) return;
    el.innerHTML = rows.map((r, i) => `<div class="rank-item"><span class="rank-num">${String(i+1).padStart(2,'0')}</span><div><div class="rank-title">${esc(r.movie.title)}</div><div class="rank-meta">${esc(r.movie.director)} / ${r.movie.year}</div></div><strong class="rank-score">${r.score}%</strong></div>`).join('');
  }

  function renderScanner(id = currentScannerId) {
    const movie = movieById(id) || MOVIES[0];
    if (!movie) return;
    currentScannerId = movie.id;
    $('#scannerSelect').value = String(movie.id);
    $('#scannerCode').textContent = `SUBJECT #${String(movie.id).padStart(4,'0')}`;
    $('#scannerTitle').textContent = movie.title;
    $('#scannerMeta').textContent = `${movie.director.toUpperCase()} / ${movie.year} / ${movie.country.toUpperCase()}`;
    $('#scannerTags').innerHTML = [...movie.genres, ...movie.tags].map(t => `<span class="tag">${esc(t.toUpperCase())}</span>`).join('');
    $('#stabilityScore').textContent = `${stability(movie.dna)}%`;
    $('#diagnostics').innerHTML = [
      ['EMOTIONAL DECAY', movie.dna.loneliness],
      ['REALITY DISTORTION', movie.dna.surrealism],
      ['VOLATILITY', movie.dna.chaos],
      ['VISUAL MUTATION', movie.dna.visualExtremity],
      ['DREAM CONTAMINATION', movie.dna.dreamLogic]
    ].map(([k,v]) => `<div class="diagnostic"><strong>${k}</strong><span>${v}%</span></div>`).join('');
    $('#scannerReport').textContent = pathologyReport(movie);
    renderDNAGrid($('#scannerDNA'), movie.dna);
    drawScope($('#scannerScope'), movie.dna, movie.id, `${movie.title.toUpperCase()} / GENOME READOUT`);
    renderRanks($('#similarList'), nearest(movie.dna, [movie.id], 5));
    const isFav = state.favorites.includes(movie.id);
    $('#favoriteBtn').setAttribute('aria-pressed', isFav ? 'true' : 'false');
    $('#favoriteBtn').textContent = isFav ? '★ SAVED' : '☆ SAVE';
    log(`SCANNED SPECIMEN: ${movie.title.toUpperCase()}`);
  }

  function handleScannerSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const found = MOVIES.find(m => [m.title,m.director,m.country,...m.genres,...m.tags].join(' ').toLowerCase().includes(q));
    if (found) renderScanner(found.id);
  }

  function renderCrossbreed() {
    const a = movieById($('#parentA').value) || MOVIES[0];
    const b = movieById($('#parentB').value) || MOVIES[1] || MOVIES[0];
    if (!a || !b) return;
    const ratioA = Number($('#blendSlider').value);
    const hybrid = blendDNA(a.dna, b.dna, ratioA);
    const matches = nearest(hybrid, [a.id,b.id], 5);
    const best = matches[0];
    $('#blendA').textContent = `${ratioA}%`;
    $('#blendB').textContent = `${100-ratioA}%`;
    $('#parentALabel').textContent = a.title.slice(0,18).toUpperCase();
    $('#parentBLabel').textContent = b.title.slice(0,18).toUpperCase();
    renderDNAGrid($('#hybridDNA'), hybrid);
    drawScope($('#hybridScope'), hybrid, a.id+b.id+ratioA, 'SYNTHETIC HYBRID GENOME');
    $('#hybridStatus').textContent = 'ALIVE';
    $('#hybridMatchScore').textContent = best ? `${best.score}%` : '—%';
    $('#hybridMatchTitle').textContent = best?.movie.title || 'No viable match';
    $('#hybridMatchMeta').textContent = best ? `${best.movie.director.toUpperCase()} / ${best.movie.year}` : 'No archive match';
    $('#hybridReport').textContent = `${a.title} (${ratioA}%) × ${b.title} (${100-ratioA}%). ${pathologyReport(null, hybrid)}`;
    renderRanks($('#hybridMatches'), matches);
    return { a,b,hybrid,best,ratioA };
  }

  function purgeCrossbreed() {
    $('#hybridScope').innerHTML = '';
    $('#hybridDNA').innerHTML = '';
    $('#hybridStatus').textContent = 'IDLE';
    $('#hybridMatchScore').textContent = '—%';
    $('#hybridMatchTitle').textContent = 'Chamber purged';
    $('#hybridMatchMeta').textContent = 'No active organism.';
    $('#hybridReport').textContent = 'Crossbreed two films to generate a synthetic genome.';
    $('#hybridMatches').innerHTML = '';
    log('CROSSBREED CHAMBER PURGED');
  }

  function buildMutationControls() {
    const host = $('#mutationControls');
    host.innerHTML = '';
    DIMS.forEach(d => {
      const row = document.createElement('div');
      row.className = 'mutation-control';
      row.innerHTML = `<span>${esc(d.label.toUpperCase())}</span><input type="range" min="0" max="100" step="1" data-dim="${esc(d.key)}" value="${clamp(mutationDNA[d.key])}" aria-label="${esc(d.label)}"><strong data-value-for="${esc(d.key)}">${clamp(mutationDNA[d.key])}</strong>`;
      host.appendChild(row);
    });
    $$('input[type="range"][data-dim]', host).forEach(input => input.addEventListener('input', e => {
      const key = e.currentTarget.dataset.dim;
      mutationDNA[key] = clamp(e.currentTarget.value);
      $(`[data-value-for="${key}"]`, host).textContent = mutationDNA[key];
      renderMutation();
    }));
  }

  function loadMutationSeed() {
    const movie = movieById($('#mutationSeed').value) || MOVIES[0];
    if (!movie) return;
    mutationDNA = cloneDNA(movie.dna);
    buildMutationControls();
    renderMutation();
    log(`MUTATION SEED LOADED: ${movie.title.toUpperCase()}`);
  }

  function renderMutation() {
    const match = nearest(mutationDNA, [], 1)[0];
    if (!match) return;
    $('#mutationScore').textContent = `${match.score}%`;
    $('#mutationTitle').textContent = match.movie.title;
    $('#mutationMeta').textContent = `${match.movie.director.toUpperCase()} / ${match.movie.year} / ${match.movie.country.toUpperCase()}`;
    renderDNAGrid($('#mutationMatchDNA'), match.movie.dna);
    $('#mutationReport').textContent = `Synthetic profile currently converges on ${match.movie.title}. ${pathologyReport(null, mutationDNA)}`;
    renderTubes();
  }

  function renderTubes() {
    const host = $('#testTubes');
    const sample = DIMS.slice(0, 6);
    host.innerHTML = sample.map(d => `<div class="tube-wrap"><div class="tube" style="--level:${clamp(mutationDNA[d.key])}%"></div><div class="tube-label">${esc(d.label.toUpperCase())}</div></div>`).join('');
  }

  function randomMutation() {
    DIM_KEYS.forEach(k => mutationDNA[k] = Math.floor(Math.random()*101));
    buildMutationControls();
    renderMutation();
    log('RANDOM MUTAGEN INJECTED');
  }

  function setupAtlasControls() {
    [$('#axisX'), $('#axisY')].forEach((select, index) => {
      select.innerHTML = DIMS.map(d => `<option value="${esc(d.key)}">${esc(d.label.toUpperCase())}</option>`).join('');
      select.value = index === 0 ? 'surrealism' : 'loneliness';
    });
    const genres = allGenres();
    $('#atlasGenre').innerHTML = '<option value="">ALL GENRES</option>' + genres.map(g => `<option>${esc(g)}</option>`).join('');
  }

  function drawAtlas() {
    const svg = $('#atlasSvg');
    const xKey = $('#axisX').value;
    const yKey = $('#axisY').value;
    const genre = $('#atlasGenre').value;
    const rows = MOVIES.filter(m => !genre || m.genres.includes(genre));
    $('#atlasCount').textContent = `${rows.length} SPECIMENS`;
    const w=1000,h=620,pad={l:64,r:30,t:28,b:58};
    const sx = v => pad.l + (clamp(v)/100)*(w-pad.l-pad.r);
    const sy = v => h-pad.b - (clamp(v)/100)*(h-pad.t-pad.b);
    let grid='';
    for(let v=0;v<=100;v+=20){
      const x=sx(v), y=sy(v);
      grid += `<line class="atlas-grid" x1="${x}" y1="${pad.t}" x2="${x}" y2="${h-pad.b}"/><line class="atlas-grid" x1="${pad.l}" y1="${y}" x2="${w-pad.r}" y2="${y}"/><text class="atlas-tick" x="${x}" y="${h-35}" text-anchor="middle">${v}</text><text class="atlas-tick" x="42" y="${y+3}" text-anchor="middle">${v}</text>`;
    }
    const nodes = rows.map(m => {
      const x=sx(m.dna[xKey]), y=sy(m.dna[yKey]);
      const hot=m.dna.intensity>=90;
      return `<g class="atlas-node" data-id="${m.id}" tabindex="0" role="button" aria-label="${esc(m.title)}"><circle cx="${x}" cy="${y}" r="${5+m.dna.visualExtremity/25}" fill="${hot?'#d03728':'#b8ff35'}" stroke="#e8eadf" stroke-width="1" opacity=".9"/><text class="atlas-dot-label" x="${x+9}" y="${y-8}">${esc(m.title.length>24?m.title.slice(0,22)+'…':m.title)}</text></g>`;
    }).join('');
    const xLabel = DIMS.find(d=>d.key===xKey)?.label || xKey;
    const yLabel = DIMS.find(d=>d.key===yKey)?.label || yKey;
    svg.innerHTML = `<rect width="1000" height="620" fill="#121712"/>${grid}${nodes}<text class="atlas-axis-label" x="500" y="603" text-anchor="middle">${esc(xLabel.toUpperCase())} →</text><text class="atlas-axis-label" transform="translate(14 310) rotate(-90)" text-anchor="middle">${esc(yLabel.toUpperCase())} →</text>`;
    $$('.atlas-node', svg).forEach(node => {
      const inspect = () => inspectAtlasNode(Number(node.dataset.id), xKey, yKey);
      node.addEventListener('click', inspect);
      node.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect();} });
    });
  }

  function inspectAtlasNode(id, xKey, yKey) {
    const m = movieById(id); if(!m) return;
    const xl=DIMS.find(d=>d.key===xKey)?.label||xKey, yl=DIMS.find(d=>d.key===yKey)?.label||yKey;
    $('#atlasDetail').innerHTML = `<strong>${esc(m.title)} (${m.year})</strong> — ${esc(m.director)} · ${esc(xl)} ${m.dna[xKey]} · ${esc(yl)} ${m.dna[yKey]} · <button class="table-action" type="button" id="atlasScanBtn">SCAN SPECIMEN</button>`;
    $('#atlasScanBtn').addEventListener('click', () => { renderScanner(m.id); switchView('scanner'); });
  }

  function allGenres(){ return [...new Set(MOVIES.flatMap(m=>m.genres))].sort(); }

  function setupDatabaseFilters() {
    const opts = allGenres().map(g=>`<option>${esc(g)}</option>`).join('');
    $('#dbGenre').innerHTML = '<option value="">ALL</option>'+opts;
  }

  function renderDatabase() {
    const q = $('#dbSearch').value.trim().toLowerCase();
    const genre = $('#dbGenre').value;
    const sort = $('#dbSort').value;
    let rows = MOVIES.filter(m => {
      const hay = [m.title,m.director,m.country,...m.genres,...m.tags].join(' ').toLowerCase();
      return (!q || hay.includes(q)) && (!genre || m.genres.includes(genre));
    });
    rows = rows.slice().sort((a,b) => {
      if(sort==='year-desc') return b.year-a.year;
      if(sort==='year-asc') return a.year-b.year;
      if(DIM_KEYS.includes(sort)) return b.dna[sort]-a.dna[sort];
      return a.title.localeCompare(b.title);
    });
    $('#dbCount').textContent = `${rows.length} RECORDS`;
    $('#databaseRows').innerHTML = rows.map(m => `<tr><td>CG-${String(m.id).padStart(4,'0')}</td><td class="title-cell"><strong>${esc(m.title)}</strong><span>${esc(m.director)}</span></td><td>${m.year}</td><td>${esc(m.genres.join(' / '))}</td><td>${m.dna.surrealism}</td><td>${m.dna.loneliness}</td><td>${m.dna.chaos}</td><td>${m.dna.intensity}</td><td><button class="table-action" type="button" data-dossier-id="${m.id}">DOSSIER</button> <button class="table-action" type="button" data-scan-id="${m.id}">SCAN</button></td></tr>`).join('');
    $$('[data-scan-id]', $('#databaseRows')).forEach(btn => btn.addEventListener('click', () => { renderScanner(Number(btn.dataset.scanId)); switchView('scanner'); }));
    $$('[data-dossier-id]', $('#databaseRows')).forEach(btn => btn.addEventListener('click', () => openMovieDossier(movieById(Number(btn.dataset.dossierId)))));
  }

  function renderArchive() {
    const host = $('#archiveCards');
    const favoriteCards = state.favorites.map(id => movieById(id)).filter(Boolean).map(m => ({ type:'FAVORITE', title:m.title, detail:`${m.director} / ${m.year}`, id:`fav-${m.id}` }));
    const records = [...favoriteCards, ...state.archive];
    if(!records.length){ host.innerHTML='<div class="empty-state">NO SAVED SPECIMENS OR EXPERIMENTS.<br>THE ARCHIVE IS CLEAN.</div>'; return; }
    host.innerHTML = records.map(r => `<article class="archive-card"><div class="archive-card-head"><h3>${esc(r.title)}</h3><span class="archive-type">${esc(r.type)}</span></div><p>${esc(r.detail || '')}${r.at ? `<br>${esc(new Date(r.at).toLocaleString())}` : ''}</p></article>`).join('');
  }

  function renderLogs() {
    const host = $('#systemLog'); if(!host) return;
    host.innerHTML = logs.map(l => `<div class="log-row"><span class="log-time">${esc(l.time)}</span><span>${esc(l.message)}</span></div>`).join('');
  }


  function localDateKey() {
    const d = new Date();
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function hash32(text) {
    let h = 2166136261;
    for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function top500TitleFor(dateKey, salt='primary') {
    if (!TOP500.length) return MOVIES[hash32(dateKey+salt)%Math.max(MOVIES.length,1)]?.title || 'Unknown Specimen';
    const profile = state.favorites.slice().sort((a,b)=>a-b).join(',');
    return TOP500[hash32(`${dateKey}|${salt}|${profile}`) % TOP500.length];
  }

  function loadDailyPrescription() {
    const date = localDateKey();
    try {
      const raw = JSON.parse(localStorage.getItem(RX_KEY) || 'null');
      if (raw && raw.date === date && raw.title) return raw;
    } catch {}
    return null;
  }

  function saveDailyPrescription(rx) {
    currentPrescription = rx;
    try { localStorage.setItem(RX_KEY, JSON.stringify(rx)); } catch {}
  }

  function clearRitualTimers(){ ritualTimers.forEach(clearTimeout); ritualTimers=[]; }

  function setPrescriptionCard(rx, reveal=false) {
    currentPrescription = rx;
    $('#prescriptionDate').textContent = new Date().toLocaleDateString([], {weekday:'short',year:'numeric',month:'short',day:'2-digit'}).toUpperCase();
    $('#prescriptionTitle').textContent = rx.movie?.title || rx.title || 'UNKNOWN';
    $('#prescriptionMeta').textContent = rx.movie ? `${rx.movie.director || 'UNKNOWN DIRECTOR'} / ${rx.movie.year || '—'}` : 'CURATED SPECIMEN / METADATA SEALED';
    const dna = rx.movie?.dna;
    const top = dna ? dominantTraits(dna,1)[0] : null;
    $('#prescriptionTrait').textContent = top ? `${top.label.toUpperCase()} ${top.value}%` : 'DNA AWAITING TMDB LINK';
    const poster = rx.movie?.posterPath && TMDB ? TMDB.posterUrl(rx.movie.posterPath,'w500') : '';
    const img=$('#prescriptionPoster');
    if(poster){ img.src=poster; img.alt=`Poster for ${rx.movie.title}`; img.hidden=false; } else { img.hidden=true; img.removeAttribute('src'); }
    $('#tarotCard').disabled=false;
    $('#tarotCard').classList.toggle('is-revealed', !!reveal);
    $('#prescriptionStatus').textContent = reveal ? 'REVEALED' : 'SEALED';
    $('#prescriptionActions').hidden = !reveal;
    $('#prescriptionReport').textContent = reveal
      ? (rx.movie ? `Diagnosis complete. ${pathologyReport(rx.movie)} Prescription: watch ${rx.movie.title} today.` : `Diagnosis complete. Prescription: ${rx.title}. Connect TMDB to retrieve poster, synopsis and generate the full genome.`)
      : 'Diagnosis stored. Touch the sealed card to reveal today’s specimen.';
  }

  async function diagnoseToday(forceAlternative=false) {
    clearRitualTimers();
    $('#diagnoseBtn').disabled=true;
    $('#tarotCard').classList.remove('is-revealed');
    $('#prescriptionActions').hidden=true;
    $('#prescriptionStatus').textContent='PROCESSING';
    const lines=$('#diagnosticLines');
    const steps=['READING SUBJECT…','ANALYZING CINEMATIC DEFICIENCY…','QUERYING CURATED 500…','MATCHING GENOME SIGNAL…','SPECIMEN FOUND.'];
    lines.innerHTML='';
    steps.forEach((text,i)=>ritualTimers.push(setTimeout(()=>{
      const el=document.createElement('span'); el.textContent=text; lines.appendChild(el);
    }, i*420)));
    ritualTimers.push(setTimeout(async()=>{
      const date=localDateKey();
      const previous=loadDailyPrescription();
      const rejectionCount = forceAlternative ? Math.min(1,(previous?.rejections||0)+1) : (previous?.rejections||0);
      const title = forceAlternative ? top500TitleFor(date,'contraindication') : (previous?.title || top500TitleFor(date,'primary'));
      let movie = MOVIES.find(m=>m.title.toLowerCase()===title.toLowerCase()) || null;
      if (!movie && TMDB?.canQuery()) {
        try { movie = await importTMDBTitle(title); } catch(err) { log(`TMDB RESOLUTION FAILED: ${title.toUpperCase()} / ${err.message}`); }
      } else if (movie && !movie.overview && TMDB?.canQuery()) {
        try { movie = await enrichLocalMovie(movie); } catch {}
      }
      const rx={date,title:movie?.title||title,movieId:movie?.id||null,rejections:rejectionCount};
      saveDailyPrescription(rx);
      currentPrescription={...rx,movie};
      setPrescriptionCard(currentPrescription,false);
      $('#diagnoseBtn').disabled=false;
      $('#diagnoseBtn').querySelector('span').textContent='DIAGNOSIS COMPLETE';
      $('#diagnoseBtn').querySelector('small').textContent='TOUCH THE CARD TO REVEAL';
      log(`DAILY PRESCRIPTION GENERATED: ${(movie?.title||title).toUpperCase()}`);
    }, steps.length*420+100));
  }

  function initPrescription() {
    $('#prescriptionDate').textContent = new Date().toLocaleDateString([], {weekday:'short',year:'numeric',month:'short',day:'2-digit'}).toUpperCase();
    const saved=loadDailyPrescription();
    if(saved){
      const movie=saved.movieId?movieById(saved.movieId):MOVIES.find(m=>m.title===saved.title);
      setPrescriptionCard({...saved,movie},false);
      $('#diagnoseBtn').querySelector('span').textContent='READ TODAY’S DIAGNOSIS';
      $('#diagnoseBtn').querySelector('small').textContent='PRESCRIPTION ALREADY LOCKED';
    }
  }

  function seededValue(seed,key,min=28,max=70){ const n=hash32(`${seed}|${key}`)%1000/999; return Math.round(min+n*(max-min)); }
  function addDNA(dna,key,amount){ dna[key]=clamp((dna[key]||0)+amount); }

  function generateDNAFromTMDB(data) {
    const seed=`${data.id}|${data.title}|${data.release_date}`;
    const dna={}; DIM_KEYS.forEach(k=>dna[k]=seededValue(seed,k));
    const genres=(data.genres||[]).map(g=>String(g.name||'').toLowerCase());
    const keywords=(data.keywords?.keywords||data.keywords?.results||[]).map(k=>String(k.name||'').toLowerCase());
    const text=[data.overview||'',...keywords].join(' ').toLowerCase();
    const genreRules={
      horror:{darkness:24,intensity:16,romance:-8,humor:-8}, thriller:{intensity:17,darkness:12,pacing:10},
      romance:{romance:30,loneliness:6}, comedy:{humor:30,darkness:-12}, fantasy:{surrealism:15,dreamLogic:18,visualExtremity:8},
      mystery:{narrativeComplexity:18,dreamLogic:8}, animation:{visualExtremity:12,dreamLogic:7},
      'science fiction':{surrealism:8,narrativeComplexity:10,visualExtremity:12}, action:{intensity:19,pacing:20,chaos:14},
      war:{darkness:19,intensity:18,romance:-8}, crime:{darkness:12,intensity:8}, drama:{loneliness:6,narrativeComplexity:6}
    };
    genres.forEach(g=>Object.entries(genreRules[g]||{}).forEach(([k,v])=>addDNA(dna,k,v)));
    const wordRules={
      dream:{surrealism:22,dreamLogic:28}, surreal:{surrealism:30,dreamLogic:20}, hallucinat:{surrealism:24,dreamLogic:26},
      paranoia:{darkness:14,loneliness:13,narrativeComplexity:10}, identity:{narrativeComplexity:14,dreamLogic:8,loneliness:7},
      isolation:{loneliness:25,darkness:12}, lonely:{loneliness:25}, grief:{loneliness:18,darkness:15,nostalgia:8},
      memory:{nostalgia:20,narrativeComplexity:7}, childhood:{nostalgia:20}, psychedelic:{surrealism:28,visualExtremity:25,dreamLogic:25},
      experimental:{surrealism:18,visualExtremity:20,narrativeComplexity:14}, violence:{intensity:20,darkness:15,chaos:12},
      revenge:{intensity:16,darkness:16}, love:{romance:14}, relationship:{romance:10,loneliness:5}, absurd:{surrealism:18,humor:12,chaos:10},
      music:{nostalgia:8,visualExtremity:7}, dance:{pacing:12,visualExtremity:10}, dystop:{darkness:18,loneliness:10}, apocalypse:{darkness:24,chaos:18}
    };
    Object.entries(wordRules).forEach(([word,rule])=>{ if(text.includes(word)) Object.entries(rule).forEach(([k,v])=>addDNA(dna,k,v)); });
    return dna;
  }

  function tmdbToMovie(data) {
    const director=(data.credits?.crew||[]).find(x=>x.job==='Director')?.name || 'Unknown';
    const genres=(data.genres||[]).map(x=>x.name).filter(Boolean);
    const tags=(data.keywords?.keywords||data.keywords?.results||[]).map(x=>x.name).filter(Boolean).slice(0,8);
    return {
      id: 1000000 + Number(data.id), tmdbId:Number(data.id), title:data.title||data.original_title||'Unknown',
      year:Number(String(data.release_date||'').slice(0,4))||0, director,
      country:(data.production_countries||[]).map(x=>x.name).join(' / ')||'Unknown', genres:genres.length?genres:['Unclassified'], tags,
      overview:data.overview||'', posterPath:data.poster_path||'', backdropPath:data.backdrop_path||'', runtime:data.runtime||null,
      dna:generateDNAFromTMDB(data), dnaSource:'auto-tmdb-v1'
    };
  }

  function saveTMDBMovie(movie){
    try{
      const raw=JSON.parse(localStorage.getItem(TMDB_CACHE_KEY)||'[]');
      const rows=Array.isArray(raw)?raw:[];
      const next=[movie,...rows.filter(x=>x.tmdbId!==movie.tmdbId)].slice(0,120);
      localStorage.setItem(TMDB_CACHE_KEY,JSON.stringify(next));
    }catch{}
  }

  function loadTMDBMovieCache(){
    try{
      const rows=JSON.parse(localStorage.getItem(TMDB_CACHE_KEY)||'[]');
      if(!Array.isArray(rows))return;
      rows.forEach(m=>{ if(m?.tmdbId && !MOVIES.some(x=>x.tmdbId===m.tmdbId) && m.dna) MOVIES.push(m); });
    }catch{}
  }

  function ensureMovieInSelects(movie){
    ['#scannerSelect','#parentA','#parentB','#mutationSeed'].forEach(sel=>{
      const s=$(sel); if(!s || [...s.options].some(o=>Number(o.value)===movie.id))return;
      const o=document.createElement('option');o.value=movie.id;o.textContent=`${movie.title} (${movie.year||'—'})`;s.appendChild(o);
    });
  }

  async function importTMDBTitle(title,year){
    if(!TMDB?.canQuery()) throw new Error('TMDB_NOT_CONNECTED');
    const data=await TMDB.resolveTitle(title,year);
    if(!data) throw new Error('TMDB_NO_MATCH');
    const existing=MOVIES.find(m=>m.tmdbId===Number(data.id)); if(existing)return existing;
    const movie=tmdbToMovie(data); MOVIES.push(movie); saveTMDBMovie(movie); ensureMovieInSelects(movie); return movie;
  }

  async function enrichLocalMovie(movie){
    if(!movie || !TMDB?.canQuery()) return movie;
    const data=await TMDB.resolveTitle(movie.title,movie.year||undefined); if(!data)return movie;
    movie.tmdbId=Number(data.id); movie.overview=data.overview||movie.overview||''; movie.posterPath=data.poster_path||movie.posterPath||''; movie.backdropPath=data.backdrop_path||movie.backdropPath||''; movie.runtime=data.runtime||movie.runtime||null;
    if(!movie.director || movie.director==='Unknown') movie.director=(data.credits?.crew||[]).find(x=>x.job==='Director')?.name||movie.director;
    saveTMDBMovie({...movie}); return movie;
  }

  function renderDossier(movie, message='') {
    if(!movie){ $('#movieDossier').innerHTML='<div class="dossier-loading">SPECIMEN NOT FOUND.</div>'; return; }
    const poster=movie.posterPath&&TMDB?TMDB.posterUrl(movie.posterPath,'w500'):'';
    const tags=[...(movie.genres||[]),...(movie.tags||[])].slice(0,12);
    $('#movieDossier').innerHTML=`<div class="dossier-grid"><div class="dossier-poster">${poster?`<img src="${esc(poster)}" alt="Poster for ${esc(movie.title)}">`:`<div class="poster-placeholder">POSTER SIGNAL UNAVAILABLE<br>${TMDB?.canQuery()?'NO IMAGE FOUND':'CONNECT TMDB'}</div>`}</div><div class="dossier-content"><div class="dossier-meta">${esc(movie.director||'Unknown')} / ${movie.year||'—'}${movie.runtime?` / ${movie.runtime} MIN`:''}</div><h2>${esc(movie.title)}</h2><div class="dossier-tags">${tags.map(t=>`<span class="tag">${esc(String(t).toUpperCase())}</span>`).join('')}</div><p class="dossier-overview">${esc(movie.overview||message||'Synopsis unavailable in the local archive. Connect TMDB to retrieve the film dossier.')}</p><div class="section-kicker">CINEGENOME DNA</div><div class="dna-grid dossier-dna" id="dossierDNA"></div></div></div>`;
    renderDNAGrid($('#dossierDNA'),movie.dna);
  }

  async function openMovieDossier(movieOrTitle) {
    const dialog=$('#movieDialog'); if(!dialog)return;
    dialog.showModal(); $('#movieDossier').innerHTML='<div class="dossier-loading">READING ARCHIVE…</div>';
    let movie=typeof movieOrTitle==='string'?MOVIES.find(m=>m.title===movieOrTitle):movieOrTitle;
    const title=typeof movieOrTitle==='string'?movieOrTitle:movie?.title;
    try{
      if(!movie && title && TMDB?.canQuery()) movie=await importTMDBTitle(title);
      else if(movie && (!movie.overview||!movie.posterPath) && TMDB?.canQuery()) movie=await enrichLocalMovie(movie);
    }catch(err){ log(`DOSSIER LINK ERROR: ${err.message}`); }
    renderDossier(movie,'');
    if(!movie && title) $('#movieDossier').innerHTML=`<div class="dossier-loading">${esc(title)}<br><br>CONNECT TMDB TO LOAD POSTER + SYNOPSIS.</div>`;
  }

  function updateTMDBState(){
    const connected=!!TMDB?.canQuery();
    $('#tmdbState').textContent=connected?(TMDB.CONFIG.mode==='proxy'?'TMDB PROXY ONLINE':'TMDB TOKEN CONNECTED'):'TMDB NOT CONNECTED';
    $('#tmdbTokenInput').value=TMDB?.token?.()||'';
  }

  function setupTMDBSettings(){
    updateTMDBState();
    $('#tmdbSettingsBtn').addEventListener('click',()=>{updateTMDBState();$('#tmdbDialog').showModal();});
    $('#saveTmdbTokenBtn').addEventListener('click',()=>{TMDB?.setToken?.($('#tmdbTokenInput').value);updateTMDBState();log('TMDB DATA LINK UPDATED');});
    $('#clearTmdbTokenBtn').addEventListener('click',()=>{TMDB?.setToken?.('');$('#tmdbTokenInput').value='';updateTMDBState();log('TMDB DATA LINK DISCONNECTED');});
  }

  function switchView(view) {
    $$('.module-btn').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.viewPanel === view));
    if(view==='atlas') drawAtlas();
    if(view==='database') renderDatabase();
    if(view==='archive') renderArchive();
    if(view==='prescription') initPrescription();
    log(`MODULE OPENED: ${view.toUpperCase()}`);
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function init() {
    loadTMDBMovieCache();
    if(!MOVIES.length || !DIMS.length){
      document.body.innerHTML='<pre style="padding:20px">CINEGENOME DATABASE FAILED TO LOAD.</pre>'; return;
    }
    $('#datasetVersion').textContent = VERSION.toUpperCase();
    $('#contaminationReadout').textContent = `${(1.2 + MOVIES.length/40).toFixed(1).padStart(4,'0')}%`;

    fillMovieSelect($('#scannerSelect'));
    fillMovieSelect($('#parentA'));
    fillMovieSelect($('#parentB'));
    fillMovieSelect($('#mutationSeed'));
    $('#scannerSelect').value = String(MOVIES[0].id);
    $('#parentA').value = String(MOVIES[0].id);
    $('#parentB').value = String(MOVIES[1]?.id || MOVIES[0].id);
    $('#mutationSeed').value = String(MOVIES[2]?.id || MOVIES[0].id);

    setupAtlasControls();
    setupDatabaseFilters();
    buildMutationControls();
    renderMutation();
    renderScanner(MOVIES[0].id);
    renderCrossbreed();
    renderArchive();
    renderDatabase();
    initPrescription();
    setupTMDBSettings();

    $$('.module-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    $('#scannerSelect').addEventListener('change', e => renderScanner(Number(e.currentTarget.value)));
    $('#scannerSearch').addEventListener('input', e => handleScannerSearch(e.currentTarget.value));
    $('#scannerSearch').addEventListener('keydown', e => { if(e.key==='Enter') handleScannerSearch(e.currentTarget.value); });
    $('#openDossierBtn').addEventListener('click', () => openMovieDossier(movieById(currentScannerId)));
    $('#diagnoseBtn').addEventListener('click', () => { const saved=loadDailyPrescription(); if(saved){ setPrescriptionCard({...saved,movie:saved.movieId?movieById(saved.movieId):MOVIES.find(m=>m.title===saved.title)},false); } else diagnoseToday(false); });
    $('#tarotCard').addEventListener('click', async () => { if(!currentPrescription)return; $('#tarotCard').classList.add('is-revealed');$('#prescriptionStatus').textContent='REVEALED';$('#prescriptionActions').hidden=false; if(!currentPrescription.movie && currentPrescription.title && TMDB?.canQuery()){ try{ const m=await importTMDBTitle(currentPrescription.title); currentPrescription.movie=m; currentPrescription.movieId=m.id; saveDailyPrescription({date:currentPrescription.date,title:m.title,movieId:m.id,rejections:currentPrescription.rejections||0}); setPrescriptionCard(currentPrescription,true); }catch{} } });
    $('#openPrescriptionBtn').addEventListener('click',()=>openMovieDossier(currentPrescription?.movie||currentPrescription?.title));
    $('#scanPrescriptionBtn').addEventListener('click', async()=>{ let m=currentPrescription?.movie; if(!m && currentPrescription?.title && TMDB?.canQuery()){ try{m=await importTMDBTitle(currentPrescription.title);}catch{} } if(m){currentPrescription.movie=m;ensureMovieInSelects(m);renderScanner(m.id);switchView('scanner');} else {$('#tmdbDialog').showModal();} });
    $('#rejectPrescriptionBtn').addEventListener('click',()=>{ if((currentPrescription?.rejections||0)>=1){ $('#prescriptionReport').textContent='CONTRAINDICATION LIMIT REACHED. THE LAB WILL NOT NEGOTIATE FURTHER TODAY.'; return; } diagnoseToday(true); });
    $('#favoriteBtn').addEventListener('click', () => {
      const id=currentScannerId; if(!id)return;
      if(state.favorites.includes(id)) state.favorites=state.favorites.filter(x=>x!==id); else state.favorites.push(id);
      persistState(); renderScanner(id); renderArchive();
      log(state.favorites.includes(id)?'SPECIMEN SAVED TO ARCHIVE':'SPECIMEN REMOVED FROM ARCHIVE');
    });

    $('#blendSlider').addEventListener('input', renderCrossbreed);
    $('#parentA').addEventListener('change', renderCrossbreed);
    $('#parentB').addEventListener('change', renderCrossbreed);
    $('#breedBtn').addEventListener('click', () => {
      const result=renderCrossbreed(); if(!result)return;
      archiveExperiment('CROSSBREED', `${result.a.title} × ${result.b.title}`, `Dominance ${result.ratioA}/${100-result.ratioA}. Nearest viable specimen: ${result.best?.movie.title || 'none'} (${result.best?.score || 0}%).`, result.hybrid);
      log(`CROSSBREED COMPLETED: ${result.a.title.toUpperCase()} × ${result.b.title.toUpperCase()}`);
    });
    $('#swapParentsBtn').addEventListener('click', () => { const a=$('#parentA'),b=$('#parentB'),t=a.value;a.value=b.value;b.value=t;renderCrossbreed(); });
    $('#purgeBtn').addEventListener('click', purgeCrossbreed);

    $('#copySeedBtn').addEventListener('click', loadMutationSeed);
    $('#randomMutationBtn').addEventListener('click', randomMutation);
    $('#saveMutationBtn').addEventListener('click', () => {
      const match=nearest(mutationDNA,[],1)[0];
      archiveExperiment('MUTATION', `Mutation → ${match?.movie.title || 'Unknown'}`, `Synthetic profile matched ${match?.score || 0}% with the nearest living specimen.`, mutationDNA);
      log('MUTATION VECTOR SAVED TO ARCHIVE');
    });

    ['#axisX','#axisY','#atlasGenre'].forEach(s => $(s).addEventListener('change', drawAtlas));
    $('#resetAtlasBtn').addEventListener('click', () => { $('#axisX').value='surrealism';$('#axisY').value='loneliness';$('#atlasGenre').value='';drawAtlas(); });
    ['#dbSearch','#dbGenre','#dbSort'].forEach(s => $(s).addEventListener(s==='#dbSearch'?'input':'change', renderDatabase));
    $('#clearArchiveBtn').addEventListener('click', () => { state={favorites:[],archive:[]};persistState();renderArchive();renderScanner(currentScannerId);log('EXPERIMENT ARCHIVE ERASED'); });

    log(`DATABASE MOUNTED: ${MOVIES.length} LOCAL SPECIMENS / ${DIMS.length} DNA DIMENSIONS`);
    log(`PRESCRIPTION POOL MOUNTED: ${TOP500.length || MOVIES.length} CURATED TITLES`);
    log('CINEGENOME LAB BOOT SEQUENCE COMPLETE');
  }

  init();
})();

/* Daily Anomaly Hunt. Six independent cases, collectible rewards and one
   master file. Local-only progress; completely separate from the RX quota. */
(() => {
  'use strict';
  const KEY = 'cinegenome_anomaly_daily_v2';
  const LEGACY_KEY = 'cinegenome_anomaly_v1';
  const FILMS = window.CINEGENOME_ENRICHED_TOP500 || [];
  const DEAD = window.CINEGENOME_DEAD_CHANNEL || [];
  const DIMS = window.CINEGENOME_DIMENSIONS || [];
  if (!FILMS.length || !DEAD.length) return;

  const CANDIDATES = [
    'Perfect Blue','Mulholland Drive','Stalker','Persona','Memento','Mind Game',
    'Akira','Synecdoche, New York','Everything Everywhere All at Once','The Shining',
    'The Truman Show','The Fall','The Matrix','Memories of Murder','Spirited Away',
    'Parasite','Whiplash','Oldboy','Eternal Sunshine of the Spotless Mind',
    'The Grand Budapest Hotel','In the Mood for Love','La Haine','Chungking Express',
    'Tokyo Story','The Handmaiden'
  ].map(title => FILMS.find(movie => movie.title === title)).filter(Boolean);
  const TRAITS = ['darkness','visualExtremity','nostalgia','dreamLogic'];
  const HIGH = ['dreamLogic','surrealism','darkness','chaos'];
  const LOW = ['pacing','humor','romance','loneliness'];
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  })[c]);
  const label = key => DIMS.find(dim => dim.key === key)?.label?.toUpperCase() || String(key).toUpperCase();
  const hash = value => {
    let h = 2166136261;
    for (const char of String(value)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const pickSignal = (date, index) => DEAD[(hash(date) + index * 41) % DEAD.length];
  const dialog = document.getElementById('anomalyDialog');
  const body = document.getElementById('anomalyCaseContent');
  let date = today(), cases = [];
  let selected = null;
  let showAllCollection = false;
  let state = { date, solved: {}, collection: [], migrated: false };
  let toastTimer = null;

  function buildCases(day) {
    const pool = CANDIDATES.slice();
    let seed = hash(day);
    const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
    for (let i = pool.length - 1; i > 0; i--) {
      const j = next() % (i + 1); [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const a = TRAITS[hash(day + ':atlas') % TRAITS.length];
    const b = TRAITS[(TRAITS.indexOf(a) + 2) % TRAITS.length];
    const high = HIGH[hash(day + ':high') % HIGH.length];
    const low = LOW[hash(day + ':low') % LOW.length];
    return [
      { id:'S1', kind:'scan', name:'IDENTITY LEAK', target:pool[0],
        hint:`Scan a ${pool[0].year} film whose title starts “${pool[0].title.slice(0,5).toUpperCase()}”.` },
      { id:'S2', kind:'scan', name:'SPLIT SIGNAL', target:pool[1],
        hint:`Scan a ${pool[1].year} film whose title starts “${pool[1].title.slice(0,5).toUpperCase()}”.` },
      { id:'A1', kind:'atlas', name:'GHOST COORDINATE', trait:a, min:70,
        hint:`Set Atlas X axis to ${label(a)}. Inspect a node with ${label(a)} ≥ 70. Randomize nodes if needed.` },
      { id:'A2', kind:'atlas', name:'BROKEN CONSTELLATION', trait:b, min:70,
        hint:`Set Atlas X axis to ${label(b)}. Inspect a node with ${label(b)} ≥ 70. Randomize nodes if needed.` },
      { id:'M1', kind:'mutation', name:'ILLEGAL VECTOR', high, low,
        hint:`Move Mutation sliders: ${label(high)} ≥ 80 and ${label(low)} ≤ 30.` },
      { id:'X1', kind:'crossbreed', name:'TWIN REACTOR', parents:[pool[2],pool[3]],
        hint:`Crossbreed ${pool[2].title} + ${pool[3].title} at a 40–60% blend. Press INITIATE CROSSBREED.` }
    ];
  }

  function loadState(day) {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch {}
    const collection = Array.isArray(saved.collection) ? saved.collection.filter(x => x && typeof x.id === 'string') : [];
    const result = {
      date: day, solved: saved.date === day && saved.solved && typeof saved.solved === 'object' ? saved.solved : {},
      collection, migrated: saved.migrated === true
    };
    // A finished V46 weekly case stays visible as a legacy collectible.
    if (!result.migrated) {
      try {
        const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
        if (old.stage === 3 && typeof old.caseId === 'string' && !collection.some(x => x.id === `LEGACY:${old.caseId}`)) {
          collection.push({
            id:`LEGACY:${old.caseId}`, date:old.caseId.replace('CG-A/',''), kind:'legacy',
            name:'WEEKLY TRANSMISSION', subject:'ORIGINAL ANOMALY HUNT',
            signal:'ARCHIVED', coordinate:'CG-A'
          });
        }
      } catch {}
      result.migrated = true;
    }
    return result;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  function resetIfNewDay() {
    const key = today();
    if (key === date) return;
    date = key; cases = buildCases(date); state = loadState(date); selected = null;
    save(); render();
  }
  cases = buildCases(date);
  state = loadState(date);
  save();

  const caseCount = () => cases.filter(item => state.solved[item.id]).length;
  const rewardById = id => state.collection.find(item => item.id === id);
  const rewardId = caseId => `${date}:${caseId}`;
  const typeName = kind => ({scan:'SCANNER',atlas:'ATLAS',mutation:'MUTATION',crossbreed:'CROSSBREED',master:'DAILY MASTER',legacy:'LEGACY'})[kind] || 'CASE';

  function announce(message) {
    const toast = document.getElementById('anomalyToast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3800);
  }

  function collect(item, subject) {
    resetIfNewDay();
    if (state.solved[item.id]) return false;
    const index = cases.findIndex(c => c.id === item.id);
    const intercepted = pickSignal(date, index);
    const reward = {
      id:rewardId(item.id), date, kind:item.kind, name:item.name, code:item.id,
      subject:String(subject).slice(0,130), coordinate:`D-${String(intercepted.rank).padStart(3,'0')}`,
      signal:intercepted.title
    };
    state.solved[item.id] = reward;
    state.collection.push(reward);
    selected = reward.id;
    if (caseCount() === cases.length) {
      const final = pickSignal(date, cases.length);
      const master = {
        id:rewardId('MASTER'), date, kind:'master', code:'MASTER',
        name:'BLACK FILE', subject:'SIX ANOMALIES SEALED',
        coordinate:`D-${String(final.rank).padStart(3,'0')}`, signal:final.title
      };
      state.collection.push(master);
      selected = master.id;
    }
    save(); render();
    announce(caseCount() === cases.length ? 'BLACK FILE UNSEALED // SIX CASES COMPLETE' : `${item.name} // CASE STAMP COLLECTED`);
    return true;
  }

  function renderReward(reward) {
    return `<section class="anomaly-reward ${reward.kind === 'master' ? 'is-master' : ''}">
      <span>${reward.kind === 'master' ? 'MASTER REWARD // ALL SIX CASES COMPLETE' : 'COLLECTIBLE CASE STAMP // PERMANENT ARCHIVE'}</span>
      <div class="anomaly-stamp" aria-label="${esc(reward.name)} collectible">
        <small>CINEGENOME LAB / ${esc(reward.date)}</small>
        <b>${esc(reward.kind === 'master' ? 'BLACK FILE' : reward.name)}</b>
        <em>${esc(reward.coordinate)} // ${esc(reward.signal)}</em>
        <span>SUBJECT: ${esc(reward.subject)}</span>
      </div>
      <p>${reward.kind === 'master'
        ? 'You sealed every anomaly today. This master coordinate exists only in this daily case file.'
        : 'This stamp stays in your local collection when the daily cases reset.'}</p>
      <div class="anomaly-reward-actions">
        <button type="button" class="anomaly-export" data-anomaly-png="${esc(reward.id)}">SAVE COLLECTIBLE PNG ↗</button>
        <button type="button" class="anomaly-export anomaly-export-alt" data-anomaly-txt="${esc(reward.id)}">CASE REPORT .TXT ↗</button>
      </div>
      <p class="anomaly-note">Editorial fiction. Film titles are real; D-numbers are archive coordinates, not ratings.</p>
    </section>`;
  }

  function render() {
    const count = caseCount();
    document.querySelectorAll('[data-anomaly-progress]').forEach(node => { node.textContent = `${count}/6`; });
    document.querySelectorAll('[data-anomaly-portal]').forEach(node => {
      node.classList.toggle('is-active', count > 0);
      node.classList.toggle('is-complete', count === 6);
    });
    if (!body) return;
    if (!selected) selected = cases.find(item => !state.solved[item.id])?.id || rewardId('MASTER');
    const current = cases.find(item => item.id === selected);
    const reward = rewardById(selected) || (current ? state.solved[current.id] : null);
    body.innerHTML = `
      <div class="anomaly-kicker">DAILY FILE // ${date} // RESETS AT LOCAL MIDNIGHT</div>
      <h2 id="anomalyHeading">ANOMALY HUNT <span>${count}/6</span></h2>
      <p class="anomaly-intro">Six cases regenerate each day. Solve them in any order. Every case yields a collectible stamp; sealing all six unlocks a BLACK FILE.</p>
      <div class="anomaly-case-grid">
        ${cases.map((item,index) => `<button type="button" class="anomaly-case ${state.solved[item.id] ? 'is-solved' : ''} ${selected === item.id ? 'is-selected' : ''}"
            data-anomaly-case="${item.id}" aria-pressed="${selected === item.id}">
          <small>CASE 0${index+1} / ${typeName(item.kind)}</small>
          <strong>${esc(item.name)}</strong>
          <span>${state.solved[item.id] ? '◆ STAMP COLLECTED' : '◇ UNSOLVED'}</span>
        </button>`).join('')}
      </div>
      ${reward ? renderReward(reward) : current ? `<section class="anomaly-step">
        <span class="anomaly-step-number">ACTIVE CASE // ${typeName(current.kind)}</span>
        <strong>${esc(current.name)}</strong><p>${esc(current.hint)}</p>
        <p class="anomaly-note">Use the named lab module. A solved case remains in your collection after midnight.</p>
      </section>` : ''}
      <section class="anomaly-collection">
        <h3>COLLECTION // ${state.collection.length} STAMPS</h3>
        <p>Recent recovered files. Stored in this browser.</p>
        <div class="anomaly-collection-grid">
          ${(showAllCollection ? state.collection : state.collection.slice(-12)).slice().reverse().map(item => `
            <button type="button" class="${selected === item.id ? 'is-selected' : ''}" data-anomaly-reward="${esc(item.id)}">
              <small>${esc(item.date)} // ${typeName(item.kind)}</small><strong>${esc(item.name)}</strong>
            </button>`).join('') || '<span>NO FILES RECOVERED YET.</span>'}
        </div>
        ${state.collection.length > 12 ? `<button type="button" class="anomaly-collection-more" data-anomaly-toggle-collection>
          ${showAllCollection ? 'SHOW RECENT FILES' : `VIEW ALL ${state.collection.length} FILES`}
        </button>` : ''}
      </section>`;
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function exportText(reward) {
    const lines = [
      `CINEGENOME LAB // ${reward.name}`, `DATE: ${reward.date}`,
      `SUBJECT: ${reward.subject}`, `INTERCEPT: ${reward.coordinate} / ${reward.signal}`,
      '', 'CLASSIFIED EDITORIAL FICTION // NOT A FILM RATING'
    ];
    download(new Blob([lines.join('\n')], {type:'text/plain;charset=utf-8'}), `CineGenome-${reward.date}-${reward.code || 'CASE'}.txt`);
  }
  const wrap = (ctx, words, x, y, width, height, max=3) => {
    let line = '', count = 0;
    for (const word of String(words).split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > width && line) {
        ctx.fillText(line, x, y + count++ * height);
        line = word;
        if (count >= max) return;
      } else line = next;
    }
    if (count < max) ctx.fillText(line, x, y + count * height);
  };
  function exportPng(reward) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      const master = reward.kind === 'master';
      const acid = master ? '#ff634a' : '#b8ff35';
      ctx.fillStyle = '#090e09'; ctx.fillRect(0,0,1080,1350);
      ctx.strokeStyle = acid;ctx.lineWidth=6;ctx.strokeRect(34,34,1012,1282);
      for (let i=0;i<26;i++) {
        const y=106+i*43;
        ctx.fillStyle = i%5===0 ? '#1d2d18' : '#121a12';ctx.fillRect(42,y,996,1);
      }
      ctx.fillStyle=acid;ctx.fillRect(65,65,950,72);
      ctx.fillStyle='#090e09';ctx.font='bold 30px monospace';ctx.fillText('CINEGENOME LAB // CG-09',88,111);
      ctx.fillStyle='#a1b39a';ctx.font='23px monospace';ctx.fillText(`RECOVERED: ${reward.date}     FILE: ${reward.code || 'LEGACY'}`,75,195);
      ctx.fillStyle=acid;ctx.font='bold 34px monospace';ctx.fillText(master?'MASTER CLASSIFICATION':'COLLECTIBLE CASE STAMP',75,270);
      ctx.fillStyle='#f0f4e7';ctx.font='bold 66px sans-serif';
      wrap(ctx,master?'BLACK FILE':reward.name,75,360,930,77,3);
      ctx.fillStyle=acid;ctx.fillRect(75,510,930,3);
      ctx.fillStyle='#b4c5aa';ctx.font='bold 27px monospace';ctx.fillText('SUBJECT / RESEARCH TRACE',75,586);
      ctx.fillStyle='#f0f4e7';ctx.font='bold 42px sans-serif';wrap(ctx,reward.subject,75,650,900,50,3);
      ctx.fillStyle='#b4c5aa';ctx.font='bold 27px monospace';ctx.fillText('INTERCEPTED COORDINATE',75,835);
      ctx.fillStyle=acid;ctx.font='bold 54px monospace';ctx.fillText(reward.coordinate,75,912);
      ctx.fillStyle='#f0f4e7';ctx.font='bold 38px sans-serif';wrap(ctx,reward.signal,75,990,900,46,3);
      ctx.fillStyle=acid;ctx.fillRect(75,1170,930,3);
      ctx.fillStyle='#9eaf96';ctx.font='21px monospace';ctx.fillText('EDITORIAL FICTION // ARCHIVE COORDINATE, NOT A RATING',75,1220);
      ctx.fillText(master?'ALL SIX DAILY ANOMALIES SEALED':'RETURN TOMORROW // NEW SIGNALS WILL APPEAR',75,1260);
      if (canvas.toBlob) {
        canvas.toBlob(blob => {
          if (blob) download(blob,`CineGenome-${reward.date}-${reward.code || 'CASE'}.png`);
          else announce('PNG EXPORT UNAVAILABLE');
        },'image/png');
      } else {
        const link = document.createElement('a');link.href=canvas.toDataURL('image/png');
        link.download=`CineGenome-${reward.date}-${reward.code || 'CASE'}.png`;
        document.body.appendChild(link);link.click();link.remove();
      }
    } catch { announce('PNG EXPORT UNAVAILABLE ON THIS DEVICE'); }
  }

  document.querySelectorAll('[data-anomaly-open]').forEach(button => button.addEventListener('click', () => {
    resetIfNewDay(); render(); if (!dialog?.open) dialog?.showModal();
  }));
  document.getElementById('anomalyClose')?.addEventListener('click', () => dialog?.close());
  body?.addEventListener('click', event => {
    if (event.target.closest('[data-anomaly-toggle-collection]')) {
      showAllCollection = !showAllCollection; render(); return;
    }
    const caseButton = event.target.closest('[data-anomaly-case]');
    const rewardButton = event.target.closest('[data-anomaly-reward]');
    if (caseButton || rewardButton) {
      selected = caseButton?.dataset.anomalyCase || rewardButton.dataset.anomalyReward;
      render(); return;
    }
    const png = event.target.closest('[data-anomaly-png]');
    const txt = event.target.closest('[data-anomaly-txt]');
    if (png || txt) {
      const item = rewardById(png?.dataset.anomalyPng || txt.dataset.anomalyTxt);
      if (item) (png ? exportPng : exportText)(item);
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== KEY) return;
    state = loadState(date);render();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resetIfNewDay();
  });
  function scheduleReset() {
    const next = new Date();next.setHours(24,0,0,0);
    setTimeout(() => { resetIfNewDay(); scheduleReset(); }, Math.max(1000,next.getTime()-Date.now()+50));
  }
  scheduleReset();render();

  window.CINEGENOME_ANOMALY = {
    scan(movie) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='scan' && !state.solved[x.id] && movie?.title===x.target.title && Number(movie.year)===Number(x.target.year));
      return item ? collect(item,movie.title) : false;
    },
    atlas(movie,xKey) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='atlas' && !state.solved[x.id] && xKey===x.trait && Number(movie?.dna?.[x.trait])>=x.min);
      return item ? collect(item,`${movie.title} / ${label(item.trait)} ${movie.dna[item.trait]}`) : false;
    },
    mutation(dna) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='mutation' && !state.solved[x.id] && Number(dna?.[x.high])>=80 && Number(dna?.[x.low])<=30);
      return item ? collect(item,`${label(item.high)} ${dna[item.high]} / ${label(item.low)} ${dna[item.low]}`) : false;
    },
    crossbreed(a,b,ratio) {
      resetIfNewDay();
      const item=cases.find(x=>x.kind==='crossbreed' && !state.solved[x.id]);
      if (!item || !a || !b || !Number.isFinite(Number(ratio)) || Number(ratio)<40 || Number(ratio)>60) return false;
      const pair=[a.title,b.title].sort().join('|');
      if (pair!==item.parents.map(x=>x.title).sort().join('|')) return false;
      return collect(item,`${a.title} × ${b.title} / ${ratio}%`);
    },
    status() {
      resetIfNewDay();
      return { date, solved:cases.filter(x=>state.solved[x.id]).map(x=>x.id), master:!!rewardById(rewardId('MASTER')),
        collection:state.collection.length, cases:cases.map(x=>({
          id:x.id,kind:x.kind,target:x.target?.title,year:x.target?.year,
          trait:x.trait,min:x.min,high:x.high,low:x.low,parents:x.parents?.map(p=>p.title)
        })) };
    }
  };
})();

(() => {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const trigger = $('#addLabNoteBtn');
  const dialog = $('#labNoteDialog');
  const form = $('#labNoteForm');
  const message = $('#labNoteMessage');
  const handle = $('#labNoteLetterboxd');
  const identityModeButton = $('#labNoteIdentityMode');
  const identityHelp = $('#labNoteIdentityHelp');
  let identityMode = 'letterboxd';
  let anonymousConfirmTimer = 0;
  const counter = $('#labNoteCount');
  const status = $('#labNoteStatus');
  const feed = $('#labNoteFeed');
  const dialogWallCount = $('#labWallDialogCount');
  const dialogWallStatus = $('#labWallDialogStatus');
  const dialogWallShortcut = $('#labWallDialogShortcut');
  const preview = $('#labNoteWall');
  const liveStatus = $('#labNoteLiveStatus');
  const wallCount = $('#labWallCount');
  const whiteboard = $('#labWallWhiteboard');
  const liveFlash = $('#labNoteLiveFlash');
  const detailDialog = $('#labNoteDetailDialog');
  const hero = document.querySelector('.hero-panel');
  if (!trigger || !dialog || !form) return;

  const API = '/api/notes';
  const pageSeed = (() => {
    try {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return String(a[0]);
    } catch { return `${Date.now()}-${Math.random()}`; }
  })();

  let notes = [];
  let total = 0;
  let pollTimer = 0;
  let audioCtx = null;
  let hasInitialLoad = false;
  let newlyPinnedId = '';
  let flashTimer = 0;
  let layoutTimer = 0;
  let wallSelectionIds = [];
  const wallPositionCache = new Map();
  let wallLayoutSignature = '';
  let settleLayoutTimer = 0;
  let wallReseedTimer = 0;
  let wallHovering = false;
  let wallReseedPending = false;
  let wallSeedCycle = 0;
  const wallExposure = new Map();
  let wallExposureCycle = -1;
  const activeWallSeed = () => `${pageSeed}|cycle-${wallSeedCycle}`;

  function escText(value) { return String(value == null ? '' : value); }
  function hash32(text) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seedText) {
    let x = hash32(seedText) || 0x9e3779b9;
    return () => {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return ((x >>> 0) / 4294967296);
    };
  }
  function rotation(id, index) {
    const h = hash32(`${id}|${activeWallSeed()}|${index}`);
    return (((h % 51) - 25) / 10).toFixed(1);
  }
  function noteScale(id, index) {
    const h=hash32(`${activeWallSeed()}|scale|${id}|${index}`);
    return (0.96 + (h % 9) * .01).toFixed(2);
  }
  function tapeOffset(id, index) {
    const h=hash32(`${activeWallSeed()}|tape|${id}|${index}`);
    return `${38 + (h % 25)}%`;
  }
  function tapeRotation(id, index) {
    const h=hash32(`${activeWallSeed()}|tape-rot|${id}|${index}`);
    return `${((h % 61)-30)/10}deg`;
  }
  function ageTone(index) { return Math.max(.78, 1 - index * .018).toFixed(2); }
  function letterboxdUrl(name) { return `https://letterboxd.com/${encodeURIComponent(name)}/`; }
  function identity(note) {
    const type=note.identityType || (note.letterboxd?'letterboxd':'anonymous');
    const value=String(note.identityValue ?? note.letterboxd ?? '');
    return type==='letterboxd' && /^[A-Za-z0-9_-]{1,30}$/.test(value)
      ? {text:`@${value}`,url:letterboxdUrl(value)}
      : {text:type==='name' && value?value:'ANONYMOUS',url:null};
  }
  function resetAnonymousConfirmation(){
    clearTimeout(anonymousConfirmTimer);
    const submit=$('#labNoteSubmit');
    if(!submit)return;
    delete submit.dataset.confirmAnonymous;
    if(!submit.disabled)submit.textContent='PIN NOTE';
  }
  identityModeButton?.addEventListener('click',()=>{
    resetAnonymousConfirmation();
    identityMode=identityMode==='letterboxd'?'name':'letterboxd';
    identityModeButton.setAttribute('aria-pressed',String(identityMode==='name'));
    identityModeButton.setAttribute('aria-label',`Switch identity mode to ${identityMode==='name'?'Letterboxd':'name'}`);
    identityModeButton.textContent=identityMode==='name'?'NAME ↔ LETTERBOXD':'LETTERBOXD ↔ NAME';
    handle.value=''; handle.maxLength=identityMode==='name'?40:80;
    handle.dataset.identityMode=identityMode;
    handle.placeholder=identityMode==='name'?'Leave blank for anonymous':'@yourletterboxdid';
    identityHelp.textContent=identityMode==='name'?'BLANK NAME = ANONYMOUS. LINKS INSIDE THE MESSAGE ARE BLOCKED.':'LETTERBOXD HANDLE OR PROFILE URL. SWITCH TO NAME TO POST WITHOUT LETTERBOXD.';
    handle.focus();
  });
  function formatTime(ms) {
    const d = new Date(Number(ms) || Date.now());
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)} / ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function playPinSfx(mode = 'open') {
    try {
      if(localStorage.getItem('cinegenome_ui_sfx_v1')==='off') return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = audioCtx || (audioCtx = new Ctx());
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const out = ctx.createGain();
      out.gain.setValueAtTime(.0001, now);
      out.gain.exponentialRampToValueAtTime(mode === 'pin' ? .065 : .038, now + .003);
      out.gain.exponentialRampToValueAtTime(.0001, now + (mode === 'pin' ? .18 : .09));
      out.connect(ctx.destination);

      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(mode === 'pin' ? 1850 : 1420, now);
      click.frequency.exponentialRampToValueAtTime(720, now + .022);
      clickGain.gain.setValueAtTime(.36, now);
      clickGain.gain.exponentialRampToValueAtTime(.0001, now + .028);
      click.connect(clickGain); clickGain.connect(out); click.start(now); click.stop(now + .03);

      if (mode === 'pin') {
        const chirp = ctx.createOscillator();
        const chirpGain = ctx.createGain();
        chirp.type = 'triangle';
        chirp.frequency.setValueAtTime(980, now + .025);
        chirp.frequency.exponentialRampToValueAtTime(2460, now + .13);
        chirpGain.gain.setValueAtTime(.0001, now + .02);
        chirpGain.gain.exponentialRampToValueAtTime(.25, now + .045);
        chirpGain.gain.exponentialRampToValueAtTime(.0001, now + .15);
        chirp.connect(chirpGain); chirpGain.connect(out); chirp.start(now + .02); chirp.stop(now + .155);
      }
    } catch {}
  }

  function showLiveFlash() { /* retired: feedback now stays inside the note composer */ }

  let composerStatusTimer = 0;
  function setComposerStatus(text, { settle = false } = {}) {
    if (!status) return;
    clearTimeout(composerStatusTimer);
    status.textContent = text;
    status.classList.remove('is-success','is-error');
    if (/RECEIVED|PINNED|LIVE/.test(text)) status.classList.add('is-success');
    if (/FAILED|OFFLINE|INVALID|REJECTED|THROTTLED/.test(text)) status.classList.add('is-error');
    if (settle) {
      composerStatusTimer = window.setTimeout(() => {
        status.textContent = 'PUBLIC WALL LINK // LIVE';
        status.classList.remove('is-success','is-error');
      }, 2200);
    }
  }

  let noteDetailCloseTimer = 0;

  function closeNoteDetail() {
    if (!detailDialog?.open) return;
    clearTimeout(noteDetailCloseTimer);
    detailDialog.classList.remove('is-note-open');
    detailDialog.classList.add('is-note-closing');
    noteDetailCloseTimer = window.setTimeout(() => {
      if (detailDialog?.open) detailDialog.close();
      detailDialog.classList.remove('is-note-open','is-note-closing');
    }, 370);
  }

  function openNoteDetail(note, sourceEl = null) {
    if (!note || !detailDialog) return;
    playPinSfx('open');
    const id = escText(note.id).replace(/^N-/, '#').slice(0, 12);
    const meta = $('#labNoteDetailMeta');
    const body = $('#labNoteDetailMessage');
    const author = $('#labNoteDetailAuthor');
    const time = $('#labNoteDetailTime');
    if (meta) meta.textContent = `LAB NOTE // ${id}`;
    if (body) body.textContent = note.message;
    if (author) {
      const who=identity(note);
      author.textContent = who.text+(who.url?' ↗':'');
      if(who.url) author.href=who.url; else author.removeAttribute('href');
    }
    if (time) time.textContent = `TRANSMITTED // ${formatTime(note.createdAt)}`;
    clearTimeout(noteDetailCloseTimer);
    if (!detailDialog.open) detailDialog.showModal();
    detailDialog.classList.remove('is-note-open','is-note-closing');
    if(sourceEl){
      const rect=sourceEl.getBoundingClientRect();
      const rawX=(rect.left+rect.width/2-window.innerWidth/2)*0.14;
      const rawY=(rect.top+rect.height/2-window.innerHeight/2)*0.14;
      const cx=Math.max(-74,Math.min(74,rawX));
      const cy=Math.max(-48,Math.min(48,rawY));
      detailDialog.style.setProperty('--note-origin-x',`${Math.round(cx)}px`);
      detailDialog.style.setProperty('--note-origin-y',`${Math.round(cy)}px`);
    }else{
      detailDialog.style.setProperty('--note-origin-x','0px');
      detailDialog.style.setProperty('--note-origin-y','20px');
    }
    requestAnimationFrame(()=>requestAnimationFrame(()=>detailDialog.classList.add('is-note-open')));
  }

  function makeNoteCard(note, index, opts = {}) {
    const { compact = false, scatter = false, isNew = false } = opts;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'public-lab-note' + (compact ? ' is-compact' : '') + (scatter ? ' is-scatter' : '') + (isNew ? ' is-new-note' : '');
    card.style.setProperty('--note-rot', `${rotation(note.id, index)}deg`);
    card.style.setProperty('--note-age', ageTone(index));
    card.style.setProperty('--note-scale', noteScale(note.id,index));
    card.style.setProperty('--tape-x', tapeOffset(note.id,index));
    card.style.setProperty('--tape-rot', tapeRotation(note.id,index));
    card.setAttribute('aria-label', `Open lab note from ${identity(note).text}`);

    const meta = document.createElement('span');
    meta.className = 'public-lab-note-meta';
    meta.textContent = `LAB NOTE // ${escText(note.id).replace(/^N-/, '#').slice(0, 8)}`;
    const body = document.createElement('p');
    body.textContent = note.message;
    const byline = document.createElement('span');
    byline.className = 'public-lab-note-author';
    byline.textContent = identity(note).text;
    card.append(meta, body, byline);
    card.addEventListener('click', () => openNoteDetail(note, card));
    return card;
  }

  function wallCap() {
    const width = window.innerWidth;
    if (width <= 760) return 4;
    if (width < 980) return 6;
    if (width < 1280) return 8;
    return 10;
  }

  function shuffledWallSelection() {
    const cap = wallCap();
    const available = new Map(notes.map(note => [note.id, note]));
    const seed = activeWallSeed();
    const hashOrder = notes.slice().sort((a, b) => {
      const ha = hash32(`${seed}|${a.id}`);
      const hb = hash32(`${seed}|${b.id}`);
      return ha - hb;
    });

    // Keep the retained subset chosen by reseedWall(), then fill every open slot
    // from the least-recently-seen notes in the FULL Lab Wall pool. This prevents
    // a 20-note wall from showing the same 10 forever just because their positions
    // are being reseeded.
    wallSelectionIds = wallSelectionIds.filter(id => available.has(id)).slice(0, cap);
    const selectedSet = new Set(wallSelectionIds);
    const candidates = hashOrder.filter(note => !selectedSet.has(note.id)).sort((a,b) => {
      const ea = wallExposure.get(a.id) || { count:0, last:-999999 };
      const eb = wallExposure.get(b.id) || { count:0, last:-999999 };
      if (ea.last !== eb.last) return ea.last - eb.last;       // oldest/never-seen first
      if (ea.count !== eb.count) return ea.count - eb.count;  // fewer appearances first
      return hash32(`${seed}|fair|${a.id}`) - hash32(`${seed}|fair|${b.id}`);
    });
    for (const note of candidates) {
      if (wallSelectionIds.length >= cap) break;
      wallSelectionIds.push(note.id);
      selectedSet.add(note.id);
    }

    if (newlyPinnedId && available.has(newlyPinnedId) && !selectedSet.has(newlyPinnedId)) {
      if (wallSelectionIds.length < cap) wallSelectionIds.push(newlyPinnedId);
      else wallSelectionIds[wallSelectionIds.length - 1] = newlyPinnedId;
    }

    // Count an exposure only once per reseed cycle; background polling/rendering
    // must not make a note look artificially "recent".
    if (wallExposureCycle !== wallSeedCycle) {
      wallExposureCycle = wallSeedCycle;
      wallSelectionIds.forEach(id => {
        const prev = wallExposure.get(id) || { count:0, last:-999999 };
        wallExposure.set(id, { count: prev.count + 1, last: wallSeedCycle });
      });
      // Remove stale history for notes that no longer exist on the public wall.
      for (const id of wallExposure.keys()) if (!available.has(id)) wallExposure.delete(id);
    }

    return wallSelectionIds.map(id => available.get(id)).filter(Boolean);
  }

  function rectRelativeTo(el, rootRect, pad = 6) {
    const r = el.getBoundingClientRect();
    return { left:r.left-rootRect.left-pad, top:r.top-rootRect.top-pad, right:r.right-rootRect.left+pad, bottom:r.bottom-rootRect.top+pad };
  }
  function overlaps(a, b, pad = 0) {
    return !(a.right + pad <= b.left || a.left >= b.right + pad || a.bottom + pad <= b.top || a.top >= b.bottom + pad);
  }

  function layoutScatter() {
    if (!preview || !hero || preview.hidden) return;
    if (window.innerWidth <= 760) return;
    const root = hero.getBoundingClientRect();
    const cards = Array.from(preview.querySelectorAll('.public-lab-note.is-scatter:not(.is-retiring)'));
    if (!cards.length || root.width < 400 || root.height < 260) return;

    const layoutSignature = `${Math.round(root.width)}x${Math.round(root.height)}|${wallSeedCycle}`;
    if (layoutSignature !== wallLayoutSignature) {
      wallPositionCache.clear();
      wallLayoutSignature = layoutSignature;
    }

    // Hard protected zones. Notes are allowed to feel dense and handmade, but
    // they can never sit on top of the hero headline/copy or actionable cards.
    const protectedEls = [
      hero.querySelector('.hero-title-cluster'),
      hero.querySelector('.field-manual-trigger'),
      hero.querySelector('.hero-note-board'),
      hero.querySelector('.lab-wall-whiteboard'),
      hero.querySelector('.warning-stamp')
    ].filter(Boolean);
    const retiringRects = Array.from(preview.querySelectorAll('.public-lab-note.is-retiring')).map(el => rectRelativeTo(el, root, 5));
    const protectedRects = [...protectedEls.map(el => rectRelativeTo(el, root, 12)), ...retiringRects];
    const placed = [];
    const marginX = 10;
    const marginTop = 14;
    const marginBottom = 18;
    const random = rng(`${activeWallSeed()}|dense-layout|${Math.round(root.width)}x${Math.round(root.height)}`);

    function intersectionRatio(a, b) {
      const w = Math.max(0, Math.min(a.right,b.right) - Math.max(a.left,b.left));
      const h = Math.max(0, Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top));
      if (!w || !h) return 0;
      const area = w*h;
      const minArea = Math.max(1, Math.min((a.right-a.left)*(a.bottom-a.top),(b.right-b.left)*(b.bottom-b.top)));
      return area/minArea;
    }
    function blockedByProtected(candidate) {
      return protectedRects.some(r => overlaps(candidate, r, 0));
    }
    function chooseCandidate(card, index) {
      const w = card.offsetWidth || 100;
      const h = card.offsetHeight || 76;
      const maxX = Math.max(marginX, root.width - w - marginX);
      const maxY = Math.max(marginTop, root.height - h - marginBottom);
      const phases = [0.05, 0.14, 0.24, 0.34, 0.44];
      let best = null;
      let bestScore = Infinity;
      for (const overlapLimit of phases) {
        for (let attempt=0; attempt<220; attempt+=1) {
          const left = marginX + random() * Math.max(1, maxX-marginX);
          const top = marginTop + random() * Math.max(1, maxY-marginTop);
          const candidate = {left,top,right:left+w,bottom:top+h};
          if (blockedByProtected(candidate)) continue;
          let maxOverlap = 0;
          let totalOverlap = 0;
          for (const other of placed) {
            const ratio = intersectionRatio(candidate, other);
            maxOverlap = Math.max(maxOverlap, ratio);
            totalOverlap += ratio;
          }
          if (maxOverlap > overlapLimit) continue;
          // Prefer open space, but slightly reward edge/corner placement so the
          // field surrounds the protected headline instead of forming one blob.
          const cx = left + w/2, cy = top + h/2;
          const edge = Math.min(cx,root.width-cx,cy,root.height-cy);
          const score = totalOverlap*100 + edge*.004 + random()*0.12;
          if (score < bestScore) { best=candidate; bestScore=score; }
        }
        if (best) break;
      }
      return best;
    }

    cards.forEach((card, index) => {
      card.style.display = '';
      const id = card.dataset.noteId || String(index);
      const chosen = chooseCandidate(card,index);
      if (!chosen) {
        card.style.display = 'none';
        wallPositionCache.delete(id);
        return;
      }
      placed.push(chosen);
      wallPositionCache.set(id,{left:chosen.left,top:chosen.top});
      card.style.setProperty('--note-x', `${Math.round(chosen.left)}px`);
      card.style.setProperty('--note-y', `${Math.round(chosen.top)}px`);
      card.style.setProperty('--note-z', String(card.classList.contains('is-new-note') ? 22 : 3 + (hash32(`${activeWallSeed()}|${id}`) % 9)));
    });
  }

  function renderScatter() {
    if (!preview) return;
    const selected = shuffledWallSelection();
    const selectedIds = new Set(selected.map(note => note.id));
    const existing = new Map(Array.from(preview.querySelectorAll('.public-lab-note[data-note-id]')).map(card => [card.dataset.noteId, card]));

    existing.forEach((card, id) => {
      if (selectedIds.has(id)) return;
      card.classList.add('is-retiring');
      card.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => card.remove(), 820);
    });

    selected.forEach((note, index) => {
      let card = existing.get(note.id);
      if (!card || card.classList.contains('is-retiring')) {
        card = makeNoteCard(note, index, { compact: true, scatter: true, isNew: note.id === newlyPinnedId });
        card.dataset.noteId = note.id;
      } else {
        card.style.setProperty('--note-rot', `${rotation(note.id, index)}deg`);
        card.style.setProperty('--note-age', ageTone(index));
        card.style.setProperty('--note-scale', noteScale(note.id,index));
        card.style.setProperty('--tape-x', tapeOffset(note.id,index));
        card.style.setProperty('--tape-rot', tapeRotation(note.id,index));
      }
      preview.appendChild(card);
    });

    preview.hidden = selected.length === 0;
    clearTimeout(layoutTimer);
    clearTimeout(settleLayoutTimer);
    layoutTimer = setTimeout(layoutScatter, 40);
    settleLayoutTimer = setTimeout(layoutScatter, 880);
    if (newlyPinnedId && selected.some(n => n.id === newlyPinnedId)) {
      setTimeout(() => { newlyPinnedId = ''; }, 1400);
    }
  }

  function renderFeed() {
    if (!feed) return;
    feed.innerHTML = '';
    const recent = notes.slice(0, 12);
    if (!recent.length) {
      const empty = document.createElement('div');
      empty.className = 'lab-note-empty';
      empty.textContent = 'NO PUBLIC TRANSMISSIONS YET. BE THE FIRST SUBJECT TO PIN ONE.';
      feed.appendChild(empty);
      return;
    }
    recent.forEach((note, index) => feed.appendChild(makeNoteCard(note, index, { compact:false })));
  }

  function render() {
    renderScatter();
    renderFeed();
    if (liveStatus) liveStatus.textContent = total ? `live // ${total} pinned` : 'live public wall';
    if (wallCount) wallCount.textContent = total || notes.length || '0';
    if (dialogWallCount) dialogWallCount.textContent = total || notes.length || '0';
    if (dialogWallStatus) dialogWallStatus.textContent = `${Array.isArray(window.CG_LAB_NOTES_DEMO) ? 'DEMO' : 'LIVE'} SIGNAL // ${total || notes.length || 0} NOTES`;
  }

  function mergeLatest(latest) {
    const beforeIds = new Set(notes.map(n => n.id));
    const map = new Map(notes.map(n => [n.id, n]));
    latest.forEach(n => map.set(n.id, n));
    const merged = Array.from(map.values()).sort((a,b) => Number(b.createdAt||0) - Number(a.createdAt||0)).slice(0, 500);
    const changed = merged.length !== notes.length || merged.some((n, i) => notes[i]?.id !== n.id);
    notes = merged;
    if (hasInitialLoad) {
      const fresh = latest.find(n => !beforeIds.has(n.id));
      if (fresh) {
        newlyPinnedId = fresh.id;
        playPinSfx('pin');
      }
    }
    return changed;
  }

  async function fetchNotes({ quiet = false, full = false } = {}) {
    try {
      let incoming = [];
      let incomingTotal = 0;
      if (Array.isArray(window.CG_LAB_NOTES_DEMO)) {
        incoming = window.CG_LAB_NOTES_DEMO.slice().sort((a,b) => Number(b.createdAt||0) - Number(a.createdAt||0));
        incomingTotal = incoming.length;
      } else {
        const limit = full ? 500 : 24;
        const response = await fetch(`${API}?limit=${limit}&_=${Date.now()}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        incoming = Array.isArray(data.notes) ? data.notes : [];
        incomingTotal = Number(data.total) || incoming.length;
      }

      let changed = false;
      if (full || !hasInitialLoad) {
        const beforeSig = notes.map(n => n.id).join('|');
        notes = incoming.slice().sort((a,b) => Number(b.createdAt||0) - Number(a.createdAt||0)).slice(0, 500);
        changed = beforeSig !== notes.map(n => n.id).join('|') || !hasInitialLoad;
      } else {
        changed = mergeLatest(incoming);
      }
      total = incomingTotal || Math.max(total, notes.length);

      // Important: a background check that finds nothing new does not touch
      // the sticky-note DOM. This keeps the wall visually still and clickable.
      if (changed) render();
      else {
        if (liveStatus) liveStatus.textContent = total ? `${Array.isArray(window.CG_LAB_NOTES_DEMO) ? 'demo' : 'live'} // ${total} pinned` : 'live public wall';
        if (wallCount) wallCount.textContent = total || notes.length || '0';
        if (dialogWallCount) dialogWallCount.textContent = total || notes.length || '0';
        if (dialogWallStatus) dialogWallStatus.textContent = `${Array.isArray(window.CG_LAB_NOTES_DEMO) ? 'DEMO' : 'LIVE'} SIGNAL // ${total || notes.length || 0} NOTES`;
      }
      hasInitialLoad = true;
      if (!quiet && status) status.textContent = Array.isArray(window.CG_LAB_NOTES_DEMO)
        ? `DEMO WALL // ${total} LOCAL MOCK NOTES`
        : 'PUBLIC WALL LINK // LIVE';
    } catch {
      if (!quiet && status) status.textContent = 'PUBLIC WALL LINK // OFFLINE';
      if (liveStatus) liveStatus.textContent = 'wall offline';
      if (wallCount && !notes.length) wallCount.textContent = '—';
      if (dialogWallCount && !notes.length) dialogWallCount.textContent = '—';
      if (dialogWallStatus) dialogWallStatus.textContent = 'PUBLIC WALL SIGNAL // OFFLINE';
    }
  }

  let noteComposerCloseTimer = 0;
  function openDialog() {
    playPinSfx('open');
    clearTimeout(noteComposerCloseTimer);
    if (!dialog.open) dialog.showModal();
    dialog.classList.remove('is-dialog-closing');
    requestAnimationFrame(()=>requestAnimationFrame(()=>dialog.classList.add('is-dialog-open')));
    fetchNotes({ quiet:false, full:false });
    setTimeout(() => message && message.focus(), 180);
  }
  function closeDialog() {
    if (!dialog.open) return;
    clearTimeout(noteComposerCloseTimer);
    dialog.classList.remove('is-dialog-open');
    dialog.classList.add('is-dialog-closing');
    noteComposerCloseTimer = window.setTimeout(()=>{
      if(dialog.open) dialog.close();
      dialog.classList.remove('is-dialog-open','is-dialog-closing');
    }, 370);
  }

  function openWallBoardTransition(targetUrl, sourceEl = whiteboard) {
    try { sessionStorage.setItem('cg_lab_wall_intro', '1'); sessionStorage.setItem('cinegenome_labwall_route_v1','1'); } catch {}
    playPinSfx('open');
    const rect = sourceEl ? sourceEl.getBoundingClientRect() : { left:window.innerWidth*.62, top:100, width:280, height:92 };
    if (dialog?.open) dialog.close();
    const overlay = document.createElement('div');
    overlay.className = 'wall-nav-transition';
    overlay.innerHTML = `<div class="wall-nav-transition-board" aria-hidden="true">
      <span class="wall-nav-transition-tape"></span>
      <span class="wall-nav-transition-copy"><em>PUBLIC LAB WALL</em><strong>OPENING<br>BOARD</strong><small data-wall-nav-status>COLLECTING TRANSMISSIONS…</small></span>
      <span class="wall-nav-transition-sticky s1"><span>LAB NOTE // SIGNAL FOUND</span></span>
      <span class="wall-nav-transition-sticky s2"><span>SUBJECT TRACE // PUBLIC</span></span>
      <span class="wall-nav-transition-sticky s3"><span>ARCHIVE NOTE // PINNED</span></span>
      <span class="wall-nav-transition-progress"><i></i></span>
    </div>`;
    overlay.style.setProperty('--x', `${Math.round(rect.left)}px`);
    overlay.style.setProperty('--y', `${Math.round(rect.top)}px`);
    overlay.style.setProperty('--w', `${Math.round(rect.width)}px`);
    overlay.style.setProperty('--h', `${Math.round(rect.height)}px`);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-active'));
    window.setTimeout(() => {
      const label = overlay.querySelector('[data-wall-nav-status]');
      if (label) label.textContent = 'READING PUBLIC TRANSMISSIONS…';
    }, 1250);
    window.setTimeout(() => {
      overlay.classList.add('is-linked');
      const label = overlay.querySelector('[data-wall-nav-status]');
      if (label) label.textContent = 'BOARD READY // OPENING ARCHIVE';
      playPinSfx('pin');
    }, 2750);
    window.setTimeout(() => overlay.classList.add('is-leaving'), 3180);
    window.setTimeout(() => { window.location.href = targetUrl; }, 3520);
  }

  trigger.addEventListener('click', openDialog);
  function bindWallPortal(link) {
    link?.addEventListener('click', event => {
      if (event.defaultPrevented) return;
      if (event.button && event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openWallBoardTransition(link.href, link);
    });
  }
  bindWallPortal(whiteboard);
  bindWallPortal(dialogWallShortcut);
  // Keep the homepage FOLLOW THE EVIDENCE Lab Wall card on the same portal path
  // as the header whiteboard instead of falling through to a hard page navigation.
  bindWallPortal(document.querySelector('.cg79-wall[href="lab-wall.html"]'));
  $('#labNoteClose')?.addEventListener('click', closeDialog);
  $('#labNoteRefresh')?.addEventListener('click', () => fetchNotes({ full:false }));
  dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });
  dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
  dialog.addEventListener('close',()=>{ clearTimeout(noteComposerCloseTimer); dialog.classList.remove('is-dialog-open','is-dialog-closing'); });

  $('#labNoteDetailClose')?.addEventListener('click', closeNoteDetail);
  detailDialog?.addEventListener('close',()=>{ clearTimeout(noteDetailCloseTimer); detailDialog.classList.remove('is-note-open','is-note-closing'); });
  detailDialog?.addEventListener('click', e => { if (e.target === detailDialog) closeNoteDetail(); });
  detailDialog?.addEventListener('cancel', e => { e.preventDefault(); closeNoteDetail(); });

  if (message && counter) {
    const updateCount = () => { counter.textContent = `${message.value.length}/180`; resetAnonymousConfirmation(); };
    message.addEventListener('input', updateCount);
    updateCount();
  }

  handle?.addEventListener('input',resetAnonymousConfirmation);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submit = $('#labNoteSubmit');
    if (!message || !handle || !submit) return;
    const payload = { message: message.value.trim(), identityType:identityMode, identityValue:handle.value.trim() };
    if (!payload.message || (identityMode==='letterboxd' && !payload.identityValue)) {
      status.textContent = identityMode==='letterboxd'?'MESSAGE + LETTERBOXD ID REQUIRED.':'MESSAGE REQUIRED.';
      return;
    }

    const anonymousMode=identityMode==='name' && !payload.identityValue;
    if(anonymousMode && submit.dataset.confirmAnonymous!=='1'){
      submit.dataset.confirmAnonymous='1';
      submit.textContent='CONFIRM ANONYMOUS';
      status.textContent='ANONYMOUS MODE // CLICK AGAIN TO PIN WITHOUT A NAME.';
      playPinSfx('open');
      clearTimeout(anonymousConfirmTimer);
      anonymousConfirmTimer=window.setTimeout(resetAnonymousConfirmation,4200);
      return;
    }
    clearTimeout(anonymousConfirmTimer);
    delete submit.dataset.confirmAnonymous;
    submit.disabled = true;
    submit.textContent = 'TRANSMITTING…';
    setComposerStatus('UPLINKING NOTE TO PUBLIC WALL…');
    if (Array.isArray(window.CG_LAB_NOTES_DEMO)) {
      const demoValue=identityMode==='letterboxd'?payload.identityValue.replace(/^https?:\/\/(?:www\.)?letterboxd\.com\//i,'').replace(/^[@/]+/,'').replace(/\/.*$/,''):payload.identityValue;
      const demoNote = { id:`N-DEMO-LOCAL-${Date.now()}`, message:payload.message, identityType:identityMode==='name'&&!demoValue?'anonymous':identityMode, identityValue:demoValue||null, createdAt:Date.now() };
      window.CG_LAB_NOTES_DEMO.unshift(demoNote);
      notes = window.CG_LAB_NOTES_DEMO.slice(); total = notes.length; newlyPinnedId = demoNote.id;
      message.value=''; handle.value=''; if(counter) counter.textContent='0/180';
      setComposerStatus('NOTE PINNED // LOCAL DEMO WALL UPDATED.', { settle:true }); playPinSfx('pin'); render();
      submit.disabled=false; submit.textContent='PIN NOTE'; return;
    }
    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) throw new Error('RATE');
        if (data.error === 'invalid_letterboxd') throw new Error('LETTERBOXD');
        if (data.error === 'invalid_identity') throw new Error('IDENTITY');
        if (data.error === 'invalid_message') throw new Error('MESSAGE');
        throw new Error('OFFLINE');
      }
      playPinSfx('pin');
      message.value = '';
      handle.value = '';
      if (counter) counter.textContent = '0/180';
      setComposerStatus('NOTE PINNED // PUBLIC WALL UPDATED.', { settle:true });
      if (data.note) {
        notes = [data.note, ...notes.filter(n => n.id !== data.note.id)].slice(0, 500);
        total = Math.max(Number(data.total) || 0, total + 1, notes.length);
        newlyPinnedId = data.note.id;
      }
      render();
      setTimeout(() => fetchNotes({ quiet:true, full:false }), 650);
    } catch (error) {
      const code = error && error.message;
      setComposerStatus(code === 'RATE'
        ? 'TRANSMISSION THROTTLED // WAIT A MOMENT.'
        : code === 'LETTERBOXD'
          ? 'INVALID LETTERBOXD ID // USE /USERNAME ONLY.'
          : code === 'IDENTITY'
            ? 'INVALID NAME // USE UP TO 40 CHARACTERS, NO LINKS.'
          : code === 'MESSAGE'
            ? 'MESSAGE REJECTED // 1–180 CHARACTERS, NO LINKS.'
            : 'PUBLIC WALL OFFLINE // NOTE NOT SENT.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'PIN NOTE';
    }
  });

  function reseedWall() {
    if (document.hidden || !preview || preview.hidden || dialog?.open || detailDialog?.open) return;
    // Never move a note while somebody is reading it. If the 18s timer fires
    // during hover/focus, remember the reseed and run it shortly after exit.
    if (wallHovering || preview.matches(':focus-within')) {
      wallReseedPending = true;
      return;
    }
    wallReseedPending = false;
    const cap = wallCap();
    const available = new Set(notes.map(note => note.id));
    // Keep ~60% stable and rotate ~40% of the visible wall. On wide desktop
    // this is 10 fixed slots: 6 retained + 4 fresh notes from the full pool.
    const replaceCount = Math.max(1, Math.round(cap * .40));
    const keepCount = Math.max(1, cap - replaceCount);
    const keep = wallSelectionIds.filter(id => available.has(id))
      .sort((a,b)=>hash32(`${activeWallSeed()}|keep|${a}`)-hash32(`${activeWallSeed()}|keep|${b}`))
      .slice(0, keepCount);
    wallSeedCycle += 1;
    wallSelectionIds = keep;
    wallPositionCache.clear();
    wallLayoutSignature = '';
    preview.classList.add('is-reseeding');
    renderScatter();
    window.setTimeout(() => preview?.classList.remove('is-reseeding'), 1050);
  }

  function scheduleWallReseed() {
    clearInterval(wallReseedTimer);
    wallReseedTimer = window.setInterval(reseedWall, 18000);
  }

  function releaseDeferredReseed() {
    if (wallHovering || preview?.matches(':focus-within') || !wallReseedPending) return;
    wallReseedPending = false;
    window.setTimeout(() => {
      if (!wallHovering && !preview?.matches(':focus-within')) reseedWall();
      else wallReseedPending = true;
    }, 320);
  }

  preview?.addEventListener('pointerover', event => {
    if (event.target.closest('.public-lab-note.is-scatter')) wallHovering = true;
  });
  preview?.addEventListener('pointerout', event => {
    const card = event.target.closest('.public-lab-note.is-scatter');
    if (!card || card.contains(event.relatedTarget)) return;
    wallHovering = !!preview.querySelector('.public-lab-note.is-scatter:hover');
    if (!wallHovering) releaseDeferredReseed();
  });
  preview?.addEventListener('focusin', () => { wallHovering = true; });
  preview?.addEventListener('focusout', () => {
    window.setTimeout(() => {
      wallHovering = !!preview?.matches(':focus-within');
      if (!wallHovering) releaseDeferredReseed();
    }, 0);
  });

  function schedulePolling() {
    clearInterval(pollTimer);
    pollTimer = window.setInterval(() => {
      if (!document.hidden) fetchNotes({ quiet:true, full:false });
    }, 30000);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchNotes({ quiet:true, full:false });
  });
  window.addEventListener('resize', () => {
    wallLayoutSignature = '';
    clearTimeout(layoutTimer);
    clearTimeout(settleLayoutTimer);
    layoutTimer = setTimeout(layoutScatter, 100);
  }, { passive:true });

  // Full pool only once per page load so every refresh can surface a different mix of old/new notes.
  fetchNotes({ quiet:true, full:true });
  schedulePolling();
  scheduleWallReseed();
  if (location.hash === '#lab-notes') {
    setTimeout(openDialog, 220);
  }
})();

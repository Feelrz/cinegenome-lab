(() => {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const trigger = $('#addLabNoteBtn');
  const dialog = $('#labNoteDialog');
  const form = $('#labNoteForm');
  const message = $('#labNoteMessage');
  const handle = $('#labNoteLetterboxd');
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
    const h = hash32(`${id}|${pageSeed}|${index}`);
    return (((h % 51) - 25) / 10).toFixed(1);
  }
  function noteScale(id, index) {
    const h=hash32(`${pageSeed}|scale|${id}|${index}`);
    return (0.96 + (h % 9) * .01).toFixed(2);
  }
  function tapeOffset(id, index) {
    const h=hash32(`${pageSeed}|tape|${id}|${index}`);
    return `${38 + (h % 25)}%`;
  }
  function tapeRotation(id, index) {
    const h=hash32(`${pageSeed}|tape-rot|${id}|${index}`);
    return `${((h % 61)-30)/10}deg`;
  }
  function ageTone(index) { return Math.max(.78, 1 - index * .018).toFixed(2); }
  function letterboxdUrl(name) { return `https://letterboxd.com/${encodeURIComponent(name)}/`; }
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

  function showLiveFlash() {
    if (!liveFlash) return;
    clearTimeout(flashTimer);
    liveFlash.hidden = false;
    flashTimer = setTimeout(() => { liveFlash.hidden = true; }, 2600);
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
      author.textContent = `/${note.letterboxd} ↗`;
      author.href = letterboxdUrl(note.letterboxd);
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
    card.setAttribute('aria-label', `Open lab note from ${note.letterboxd}`);

    const meta = document.createElement('span');
    meta.className = 'public-lab-note-meta';
    meta.textContent = `LAB NOTE // ${escText(note.id).replace(/^N-/, '#').slice(0, 8)}`;
    const body = document.createElement('p');
    body.textContent = note.message;
    const byline = document.createElement('span');
    byline.className = 'public-lab-note-author';
    byline.textContent = `/${note.letterboxd}`;
    card.append(meta, body, byline);
    card.addEventListener('click', () => openNoteDetail(note, card));
    return card;
  }

  function shuffledWallSelection() {
    const width = window.innerWidth;
    // Keep the hero header lively but readable: target a deliberate 5–6 visible
    // sticky notes on desktop instead of trying to flood the whole hero area.
    const cap = width <= 760 ? 4 : width < 980 ? 5 : 6;
    const available = new Map(notes.map(note => [note.id, note]));
    const ordered = notes.slice().sort((a, b) => {
      const ha = hash32(`${pageSeed}|${a.id}`);
      const hb = hash32(`${pageSeed}|${b.id}`);
      return ha - hb;
    });

    // One random arrangement per real page refresh. Background polling never
    // reshuffles the wall just because the API was checked again.
    wallSelectionIds = wallSelectionIds.filter(id => available.has(id)).slice(0, cap);
    if (!wallSelectionIds.length) wallSelectionIds = ordered.slice(0, cap).map(note => note.id);
    if (wallSelectionIds.length < cap) {
      for (const note of ordered) {
        if (wallSelectionIds.includes(note.id)) continue;
        wallSelectionIds.push(note.id);
        if (wallSelectionIds.length >= cap) break;
      }
    }

    if (newlyPinnedId && available.has(newlyPinnedId) && !wallSelectionIds.includes(newlyPinnedId)) {
      if (wallSelectionIds.length < cap) wallSelectionIds.push(newlyPinnedId);
      else wallSelectionIds[wallSelectionIds.length - 1] = newlyPinnedId;
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
    if (!preview || !hero || window.innerWidth <= 760 || preview.hidden) return;
    const root = hero.getBoundingClientRect();
    const cards = Array.from(preview.querySelectorAll('.public-lab-note.is-scatter:not(.is-retiring)'));
    if (!cards.length || root.width < 400 || root.height < 240) return;

    const protectedEls = [
      hero.querySelector('.eyebrow'), hero.querySelector('h1'), hero.querySelector('p'), hero.querySelector('.field-manual-trigger'),
      hero.querySelector('.hero-note-board'), hero.querySelector('.lab-wall-whiteboard'), hero.querySelector('.warning-stamp')
    ].filter(Boolean);
    const protectedRects = protectedEls.map(el => rectRelativeTo(el, root, 14));
    const placed = [];
    const margin = 14;
    const gap = 12;
    const sample = cards[0];
    const noteW = sample?.offsetWidth || 126;
    const noteH = sample?.offsetHeight || 92;
    const random = rng(`${pageSeed}|balanced-layout|${Math.round(root.width)}x${Math.round(root.height)}`);

    // Build a loose corkboard-style grid and fill from the lower half upward.
    // This keeps the headline readable and uses the empty breathing room below it.
    const slots = [];
    const bottom = root.height - noteH - margin;
    const stepY = noteH + gap;
    let rowIndex = 0;
    for (let y = bottom; y >= margin; y -= stepY, rowIndex += 1) {
      const lowerHalf = y > root.height * .48;
      const xStart = lowerHalf ? root.width * .24 : root.width * .34;
      const xEnd = root.width * .86 - noteW;
      const stepX = noteW + gap;
      const rowSlots = [];
      for (let x = xStart; x <= xEnd; x += stepX) {
        const jitterX = (random() - .5) * 12;
        const jitterY = (random() - .5) * 10;
        const candidate = {
          left: Math.max(margin, x + jitterX),
          top: Math.max(margin, y + jitterY),
          right: Math.max(margin, x + jitterX) + noteW,
          bottom: Math.max(margin, y + jitterY) + noteH,
        };
        if (candidate.right > root.width - margin || candidate.bottom > root.height - margin) continue;
        if (protectedRects.some(r => overlaps(candidate, r, 3))) continue;
        rowSlots.push(candidate);
      }
      // Shuffle each row so every refresh still feels alive, but stays readable.
      rowSlots.sort(() => random() - .5);
      slots.push(...rowSlots);
    }

    cards.forEach((card, index) => {
      card.style.display = '';
      card.style.setProperty('--note-x', '0px');
      card.style.setProperty('--note-y', '0px');
      let chosen = null;
      while (slots.length && !chosen) {
        const candidate = slots.shift();
        if (placed.some(r => overlaps(candidate, r, gap))) continue;
        chosen = candidate;
      }
      if (!chosen) {
        // Never pile notes over the title just to hit a quota. Extra notes stay on the full wall.
        card.style.display = 'none';
        return;
      }
      placed.push(chosen);
      card.style.setProperty('--note-x', `${Math.round(chosen.left)}px`);
      card.style.setProperty('--note-y', `${Math.round(chosen.top)}px`);
      card.style.setProperty('--note-z', String(2 + (hash32(card.dataset.noteId || String(index)) % 6)));
    });

    // The public wall should never feel dead just because the normal collision
    // pass was conservative. If at least two real notes exist, make a second
    // bottom-up pass for hidden cards and guarantee two visible notes whenever
    // the hero physically has room. We still never synthesize fake public notes.
    const minimumVisible = Math.min(2, cards.length);
    let visibleCount = cards.filter(card => card.style.display !== 'none').length;
    if (visibleCount < minimumVisible) {
      const hiddenCards = cards.filter(card => card.style.display === 'none');
      const emergencyGap = 6;
      const emergencySlots = [];
      const xMin = Math.max(margin, root.width * .20);
      const xMax = Math.max(xMin, root.width * .88 - noteW);
      const yMin = Math.max(margin, root.height * .46);
      const yMax = Math.max(yMin, root.height - noteH - margin);
      for (let y = yMax; y >= yMin; y -= 12) {
        for (let x = xMin; x <= xMax; x += 12) {
          const candidate = { left:x, top:y, right:x+noteW, bottom:y+noteH };
          if (protectedRects.some(r => overlaps(candidate, r, 1))) continue;
          if (placed.some(r => overlaps(candidate, r, emergencyGap))) continue;
          emergencySlots.push(candidate);
        }
      }
      for (const card of hiddenCards) {
        if (visibleCount >= minimumVisible) break;
        let chosen = null;
        while (emergencySlots.length && !chosen) {
          const candidate = emergencySlots.shift();
          if (placed.some(r => overlaps(candidate, r, emergencyGap))) continue;
          chosen = candidate;
        }
        if (!chosen) break;
        card.style.display = '';
        card.style.setProperty('--note-x', `${Math.round(chosen.left)}px`);
        card.style.setProperty('--note-y', `${Math.round(chosen.top)}px`);
        card.style.setProperty('--note-z', String(5 + visibleCount));
        placed.push(chosen);
        visibleCount += 1;
      }
    }
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
      window.setTimeout(() => card.remove(), 620);
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
    layoutTimer = setTimeout(layoutScatter, 40);
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
        showLiveFlash();
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
    try { sessionStorage.setItem('cg_lab_wall_intro', '1'); } catch {}
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
    const updateCount = () => { counter.textContent = `${message.value.length}/180`; };
    message.addEventListener('input', updateCount);
    updateCount();
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submit = $('#labNoteSubmit');
    if (!message || !handle || !submit) return;
    const payload = { message: message.value.trim(), letterboxd: handle.value.trim() };
    if (!payload.message || !payload.letterboxd) {
      status.textContent = 'MESSAGE + LETTERBOXD ID REQUIRED.';
      return;
    }

    submit.disabled = true;
    submit.textContent = 'TRANSMITTING…';
    status.textContent = 'UPLINKING NOTE TO PUBLIC WALL…';
    if (Array.isArray(window.CG_LAB_NOTES_DEMO)) {
      const demoNote = { id:`N-DEMO-LOCAL-${Date.now()}`, message:payload.message, letterboxd:payload.letterboxd.replace(/^[@/]+/,'').replace(/^https?:\/\/(?:www\.)?letterboxd\.com\//i,'').replace(/\/.*$/,''), createdAt:Date.now() };
      window.CG_LAB_NOTES_DEMO.unshift(demoNote);
      notes = window.CG_LAB_NOTES_DEMO.slice(); total = notes.length; newlyPinnedId = demoNote.id;
      message.value=''; handle.value=''; if(counter) counter.textContent='0/180';
      status.textContent='DEMO TRANSMISSION // NOTE PINNED LOCALLY.'; playPinSfx('pin'); showLiveFlash(); render();
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
        if (data.error === 'invalid_message') throw new Error('MESSAGE');
        throw new Error('OFFLINE');
      }
      playPinSfx('pin');
      message.value = '';
      handle.value = '';
      if (counter) counter.textContent = '0/180';
      status.textContent = 'TRANSMISSION RECEIVED // NOTE PINNED.';
      if (data.note) {
        notes = [data.note, ...notes.filter(n => n.id !== data.note.id)].slice(0, 500);
        total = Math.max(Number(data.total) || 0, total + 1, notes.length);
        newlyPinnedId = data.note.id;
        showLiveFlash();
      }
      render();
      setTimeout(() => fetchNotes({ quiet:true, full:false }), 650);
    } catch (error) {
      const code = error && error.message;
      status.textContent = code === 'RATE'
        ? 'TRANSMISSION THROTTLED // WAIT A MOMENT.'
        : code === 'LETTERBOXD'
          ? 'INVALID LETTERBOXD ID // USE /USERNAME ONLY.'
          : code === 'MESSAGE'
            ? 'MESSAGE REJECTED // 1–180 CHARACTERS, NO LINKS.'
            : 'PUBLIC WALL OFFLINE // NOTE NOT SENT.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'PIN NOTE';
    }
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
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(layoutScatter, 100);
  }, { passive:true });

  // Full pool only once per page load so every refresh can surface a different mix of old/new notes.
  fetchNotes({ quiet:true, full:true });
  schedulePolling();
  if (location.hash === '#lab-notes') {
    setTimeout(openDialog, 220);
  }
})();

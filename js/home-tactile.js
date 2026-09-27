(() => {
  'use strict';

  const SFX_KEY = 'cinegenome_ui_sfx_v1';
  let audioContext = null;
  let hoverCooldown = 0;

  const sfxEnabled = () => {
    try { return localStorage.getItem(SFX_KEY) !== 'off'; }
    catch { return true; }
  };

  function contextFromGesture(allowResume = false) {
    if (!sfxEnabled()) return null;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      audioContext ||= new Audio();
      if (audioContext.state === 'suspended') {
        if (!allowResume) return null;
        audioContext.resume().catch(() => {});
      }
      return audioContext;
    } catch { return null; }
  }

  function playHoverTick(seed = 0) {
    const nowMs = performance.now();
    if (nowMs - hoverCooldown < 72) return;
    hoverCooldown = nowMs;
    const ctx = contextFromGesture(false);
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    try {
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, t);
      master.gain.exponentialRampToValueAtTime(0.026, t + 0.0015);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
      master.connect(ctx.destination);

      const click = ctx.createOscillator();
      const gain = ctx.createGain();
      click.type = 'square';
      const start = 1780 + (seed % 5) * 85;
      click.frequency.setValueAtTime(start, t);
      click.frequency.exponentialRampToValueAtTime(920 + (seed % 3) * 45, t + 0.018);
      gain.gain.setValueAtTime(0.44, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
      click.connect(gain); gain.connect(master);
      click.start(t); click.stop(t + 0.024);

      const body = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(320 + (seed % 4) * 18, t + 0.004);
      bodyGain.gain.setValueAtTime(0.12, t + 0.004);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.034);
      body.connect(bodyGain); bodyGain.connect(master);
      body.start(t + 0.004); body.stop(t + 0.036);
    } catch {}
  }

  function playPaperClick(mode = 'open') {
    const ctx = contextFromGesture(true);
    if (!ctx) return;
    const t = ctx.currentTime;
    try {
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, t);
      master.gain.exponentialRampToValueAtTime(mode === 'open' ? 0.058 : 0.045, t + 0.002);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      master.connect(ctx.destination);

      const noiseLength = Math.max(1, Math.floor(ctx.sampleRate * 0.045));
      const buffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < noiseLength; i++) {
        const env = Math.pow(1 - i / noiseLength, 3.2);
        channel[i] = (Math.random() * 2 - 1) * env;
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(mode === 'open' ? 2450 : 1900, t);
      filter.Q.setValueAtTime(0.85, t);
      noiseGain.gain.setValueAtTime(0.42, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      source.buffer = buffer;
      source.connect(filter); filter.connect(noiseGain); noiseGain.connect(master);
      source.start(t); source.stop(t + 0.046);

      const snap = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snap.type = 'square';
      snap.frequency.setValueAtTime(mode === 'open' ? 1320 : 980, t);
      snap.frequency.exponentialRampToValueAtTime(mode === 'open' ? 480 : 390, t + 0.032);
      snapGain.gain.setValueAtTime(0.33, t);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      snap.connect(snapGain); snapGain.connect(master);
      snap.start(t); snap.stop(t + 0.043);

      if (mode === 'open') {
        const latch = ctx.createOscillator();
        const latchGain = ctx.createGain();
        latch.type = 'triangle';
        latch.frequency.setValueAtTime(510, t + 0.035);
        latch.frequency.exponentialRampToValueAtTime(760, t + 0.085);
        latchGain.gain.setValueAtTime(0.0001, t + 0.03);
        latchGain.gain.exponentialRampToValueAtTime(0.18, t + 0.045);
        latchGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.095);
        latch.connect(latchGain); latchGain.connect(master);
        latch.start(t + 0.032); latch.stop(t + 0.1);
      }
    } catch {}
  }

  function setupHomeTactileFeedback() {
    const board = document.querySelector('.cg79-board');
    if (!board) return;

    // Hover is bound to the physical card itself so the sound and motion happen
    // as soon as the cursor enters the paper, not only when it reaches the CTA.
    const hoverSelector = [
      '.cg81-primary',
      '.cg81-alternate',
      '.cg79-module',
      '.cg79-codes',
      '.cg79-quest',
      '.cg79-creature',
      '.cg83-yugen-mark',
      '[data-cg91-memo-open]',
      '.cg90-researcher-signoff',
      '[data-field-manual-open]'
    ].join(',');

    const hoverTargets = [...new Set(board.querySelectorAll(hoverSelector))];
    hoverTargets.forEach((target, index) => {
      target.dataset.cg91Tactile = 'true';
      target.addEventListener('pointerenter', event => {
        if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        playHoverTick(index);
      }, { passive: true });
    });

    // Home-view routing already has its own navigation click SFX. Paper CTAs that
    // do not route through that system get the short physical switch/paper click here.
    const clickSelector = [
      '.cg79-codes',
      '.cg79-quest button',
      '.cg79-creature button',
      '.cg83-yugen-mark',
      '[data-cg91-memo-open]',
      '.cg90-researcher-signoff a',
      '[data-field-manual-open]'
    ].join(',');
    [...new Set(board.querySelectorAll(clickSelector))].forEach(target => {
      target.addEventListener('pointerdown', () => playPaperClick('open'), { passive: true });
    });

    // Prime the WebAudio context on the first real gesture. Browsers correctly block
    // pointer-hover audio before a user has interacted with the page at least once.
    board.addEventListener('pointerdown', () => contextFromGesture(true), { once: true, passive: true });
  }

  function setupReactiveHomePapers() {
    const board = document.querySelector('.cg79-board');
    if (!board || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia?.('(hover:hover) and (pointer:fine)').matches) return;

    const configs = [
      { selector: '.cg79-quest', moveX: 3.8, moveY: 2.7, rotX: 0.55, rotY: 0.72 },
      { selector: '.cg79-creature', moveX: 3.8, moveY: 2.7, rotX: 0.55, rotY: 0.72 },
      { selector: '.cg90-researcher-signoff', moveX: 2.2, moveY: 1.5, rotX: 0.30, rotY: 0.42 }
    ];

    configs.forEach(config => {
      board.querySelectorAll(config.selector).forEach(paper => {
        const reset = () => {
          paper.classList.remove('is-cg92-hover');
          paper.style.setProperty('--cg92-x', '0px');
          paper.style.setProperty('--cg92-y', '0px');
          paper.style.setProperty('--cg92-rx', '0deg');
          paper.style.setProperty('--cg92-ry', '0deg');
        };

        paper.addEventListener('pointerenter', event => {
          if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
          paper.classList.add('is-cg92-hover');
        }, { passive: true });

        paper.addEventListener('pointermove', event => {
          if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
          const rect = paper.getBoundingClientRect();
          const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
          const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
          paper.style.setProperty('--cg92-x', `${(nx * config.moveX).toFixed(2)}px`);
          paper.style.setProperty('--cg92-y', `${(ny * config.moveY).toFixed(2)}px`);
          paper.style.setProperty('--cg92-rx', `${(-ny * config.rotX).toFixed(3)}deg`);
          paper.style.setProperty('--cg92-ry', `${(nx * config.rotY).toFixed(3)}deg`);
        }, { passive: true });

        paper.addEventListener('pointerleave', reset, { passive: true });
        paper.addEventListener('blur', reset, true);
      });
    });
  }

  function setupResearchMemo() {
    const dialog = document.getElementById('cg91ResearchMemo');
    const paper = dialog?.querySelector('[data-cg91-memo-paper]');
    const status = dialog?.querySelector('[data-cg91-memo-status]');
    const openers = [...document.querySelectorAll('[data-cg91-memo-open]')];
    const closer = dialog?.querySelector('[data-cg91-memo-close]');
    if (!dialog || !paper || !openers.length) return;

    const defaultStatus = 'OPERATOR NOTE / UNSEALED';
    const open = () => {
      playPaperClick('open');
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      requestAnimationFrame(() => closer?.focus({ preventScroll: true }));
    };
    const close = () => {
      playPaperClick('close');
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    };

    // Memo opener already participates in the board click-SFX set. Avoid a second click
    // by letting its pointerdown create the sound and using click only for the dialog action.
    openers.forEach(button => button.addEventListener('click', () => {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      requestAnimationFrame(() => closer?.focus({ preventScroll: true }));
    }));
    closer?.addEventListener('click', close);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener('close', () => {
      paper.style.removeProperty('--cg91-tx');
      paper.style.removeProperty('--cg91-ty');
      paper.style.removeProperty('--cg91-rx');
      paper.style.removeProperty('--cg91-ry');
      if (status) status.textContent = defaultStatus;
    });

    dialog.querySelectorAll('[data-cg91-signal]').forEach(paragraph => {
      paragraph.addEventListener('pointerenter', event => {
        if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        if (status) status.textContent = paragraph.dataset.cg91Signal || defaultStatus;
      });
      paragraph.addEventListener('pointerleave', () => {
        if (status) status.textContent = defaultStatus;
      });
    });

    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      paper.addEventListener('pointermove', event => {
        if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        const rect = paper.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
        const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
        paper.style.setProperty('--cg91-tx', `${(nx * 2.2).toFixed(2)}px`);
        paper.style.setProperty('--cg91-ty', `${(ny * 1.5).toFixed(2)}px`);
        paper.style.setProperty('--cg91-rx', `${(-ny * 0.34).toFixed(3)}deg`);
        paper.style.setProperty('--cg91-ry', `${(nx * 0.42).toFixed(3)}deg`);
      }, { passive: true });
      paper.addEventListener('pointerleave', () => {
        paper.style.setProperty('--cg91-tx', '0px');
        paper.style.setProperty('--cg91-ty', '0px');
        paper.style.setProperty('--cg91-rx', '0deg');
        paper.style.setProperty('--cg91-ry', '0deg');
      }, { passive: true });
    }
  }

  const boot = () => {
    setupHomeTactileFeedback();
    setupReactiveHomePapers();
    setupResearchMemo();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();

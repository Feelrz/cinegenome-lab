/* CineGenome field manual — shared desktop/mobile orientation dossier. */
(() => {
  'use strict';
  const triggers = document.querySelectorAll('[data-field-manual-open]');
  if (!triggers.length) return;

  const dialog = document.createElement('dialog');
  dialog.id = 'fieldManualDialog';
  dialog.className = 'field-manual-dialog';
  dialog.setAttribute('aria-labelledby', 'fieldManualTitle');
  dialog.innerHTML = `
    <div class="field-manual-shell">
      <header class="field-manual-header">
        <div><small>CG-09 // DECLASSIFIED ORIENTATION FILE</small>
          <strong id="fieldManualTitle">FIELD MANUAL <span>?</span></strong></div>
        <button type="button" data-manual-close aria-label="Close field manual">×</button>
      </header>
      <nav class="field-manual-tabs" aria-label="Field manual chapters">
        <button type="button" data-manual-tab="start" aria-pressed="true">01 / START HERE</button>
        <button type="button" data-manual-tab="modules" aria-pressed="false">02 / LAB MAP</button>
        <button type="button" data-manual-tab="protocols" aria-pressed="false">03 / PROTOCOLS</button>
        <button type="button" data-manual-tab="faq" aria-pressed="false">04 / FAQ</button>
      </nav>
      <div class="field-manual-content">
        <section data-manual-panel="start" aria-labelledby="manualStartTitle">
          <div class="field-manual-kicker">ORIENTATION // READ BEFORE TOUCHING ANYTHING</div>
          <h2 id="manualStartTitle">WELCOME TO CINEGENOME.</h2>
          <p class="field-manual-lead">CineGenome treats films like living specimens. Search a title, inspect its interpreted cinematic genome, compare nearby organisms, then push the model through crossbreeding, mutation, mapping and lineage tracing.</p>
          <div class="field-manual-side field-manual-start-shortcut"><b>MODEL NOTE // TWO DIFFERENT STRANDS</b><p><strong>Specimen Scanner</strong> describes films with a 12-axis cinematic DNA model. <strong>FILMPRINT</strong> reads your answers as a separate 15-axis taste strand and finds the closest matching specimen. Neither is a quality score or a scientific measurement.</p></div>
          <div class="field-manual-path">
            <div><b>01</b><strong>EXAMINE</strong><span>Scan a film and read the evidence, DNA, anomalies and nearest specimens.</span></div>
            <div><b>02</b><strong>EXPERIMENT</strong><span>Crossbreed or mutate traits. The result stays tied to the selected inputs.</span></div>
            <div><b>03</b><strong>TRACE</strong><span>Map the archive, inspect inferred bloodlines, or decode your own FILMPRINT.</span></div>
            <div><b>04</b><strong>LEAVE EVIDENCE</strong><span>Save experiments, solve cases, collect creatures, or pin a note for the next operator.</span></div>
          </div>
          <div class="field-manual-actions">
            <button type="button" data-manual-action="scanner">ENTER SPECIMEN SCANNER ↗</button>
            <button type="button" data-manual-action="filmprint">RUN FILMPRINT ↗</button>
            <button type="button" data-manual-action="cases">OPEN DAILY CASES ↗</button>
          </div>
        </section>

        <section data-manual-panel="modules" aria-labelledby="manualModulesTitle" hidden>
          <div class="field-manual-kicker">ACCESS MAP // 06 INDEXED CHAMBERS</div>
          <h2 id="manualModulesTitle">WHAT CAN I DO HERE?</h2>
          <div class="field-manual-module-grid">
            <article><small>01 / EXAMINE</small><h3>SPECIMEN SCANNER</h3><p>Search a film, inspect its DNA silhouette, evidence status, Genomic Anomaly and nearest archive neighbors.</p></article>
            <article><small>02 / COMBINE</small><h3>CROSSBREED REACTOR</h3><p>Choose two parent films, change dominance, and synthesize an input-driven hybrid genome.</p></article>
            <article><small>03 / ALTER</small><h3>MUTATION CHAMBER</h3><p>Start from one film, rewrite selected traits, and locate real films nearest to the mutated vector.</p></article>
            <article><small>04 / LOCATE</small><h3>GENOME ATLAS</h3><p>Project the archive across two DNA axes and inspect clusters, neighbors and outliers.</p></article>
            <article><small>05 / TRACE</small><h3>BLOODLINE LAB</h3><p>Trace model-inferred relatives from DNA proximity and chronology. Similarity is not proof of influence.</p></article>
            <article><small>06 / RETAIN</small><h3>EXPERIMENT ARCHIVE</h3><p>Reopen specimens and experiments saved locally in this browser.</p></article>
          </div>
          <div class="field-manual-side"><b>SIDE CHANNELS // ACTIVE</b><p><strong>FILMPRINT</strong> decodes your taste. <strong>Daily Dose</strong> issues up to three film prescriptions each local day. <strong>Daily Cases</strong> turn the lab into a research hunt. <strong>Lab Wall</strong> is the public evidence board.</p></div>
          <p class="field-manual-hint">Not every channel is listed here. That is intentional. If the lab tells you not to press something, the manual takes no legal position.</p>
        </section>

        <section data-manual-panel="protocols" aria-labelledby="manualProtocolsTitle" hidden>
          <div class="field-manual-kicker">FIELD PROTOCOLS // CASES, RECORDS, CREATURES</div>
          <h2 id="manualProtocolsTitle">WHAT RESETS. WHAT SURVIVES.</h2>
          <p class="field-manual-lead">Most personal progress is browser-local. Daily Cases and Daily Dose refresh with your device's local date. Saved experiments, earned packs, creature cards and completed FILMPRINT data remain until that site's local storage is cleared.</p>
          <div class="field-manual-side"><b>REQUEST TRACE // OPTIONAL ASSISTANCE</b><p>Unsolved cases can reveal three escalating clues: <strong>LOCATE</strong>, <strong>NARROW</strong> and <strong>DECODE</strong>. TRACE lowers only the cosmetic Case Integrity readout. It never reduces pack milestones or creature draw odds.</p></div>
          <div class="field-manual-reward-track">
            <div><b>2 CASES</b><strong>1 PACK</strong></div>
            <div><b>4 CASES</b><strong>2 PACKS</strong></div>
            <div><b>6 CASES</b><strong>3 PACKS</strong></div>
          </div>
          <div class="field-manual-odds"><span>CREATURE DRAW ODDS</span><b>C 60%</b><b>B 30%</b><b>A 8%</b><b>S 1.8%</b><b>SR 0.2%</b></div>
          <div class="field-manual-status-grid" aria-label="CineGenome data status legend">
            <div><b>REVIEWED</b><span>Human-curated or explicitly researched source data.</span></div>
            <div><b>DERIVED</b><span>Calculated from known inputs by CineGenome's model.</span></div>
            <div><b>PROVISIONAL</b><span>Usable, but not yet fully verified or calibrated.</span></div>
            <div><b>UNKNOWN</b><span>Missing evidence. Never silently treated as zero.</span></div>
          </div>
          <p class="field-manual-hint">Phone and desktop can hold different local histories. A share key is created only when you explicitly request one from FILMPRINT.</p>
          <div class="field-manual-actions">
            <button type="button" data-manual-action="cases">OPEN DAILY CASES ↗</button>
            <button type="button" data-manual-action="labwall">OPEN LAB WALL ↗</button>
          </div>
        </section>

        <section data-manual-panel="faq" aria-labelledby="manualFaqTitle" hidden>
          <div class="field-manual-kicker">COMMON TRANSMISSIONS // SHORT ANSWERS ONLY</div>
          <h2 id="manualFaqTitle">FAQ</h2>
          <div class="field-manual-faq">
            <details><summary>What exactly is FILMPRINT?</summary><p>FILMPRINT is CineGenome's 30-signal taste assay. Your responses form a 15-axis preference strand, which is compared with candidate film profiles to return the closest specimen and a readable connection route.</p></details>
            <details><summary>Are the DNA numbers ratings or scientific measurements?</summary><p>No. They are interpretive model coordinates for cinematic mood, storytelling and visual language. They do not measure film quality and should not be read as scientific fact.</p></details>
            <details><summary>Are Scanner DNA and FILMPRINT DNA the same thing?</summary><p>No. Scanner uses a film-facing 12-axis model. FILMPRINT uses a separate 15-axis human taste strand derived from your answers, then compares that preference signal with film profiles.</p></details>
            <details><summary>Why do some records say PROVISIONAL or UNKNOWN?</summary><p>CineGenome keeps evidence status visible. PROVISIONAL means the record can be used but is not fully verified. UNKNOWN means the evidence is missing; unknown values are not silently converted to zero.</p></details>
            <details><summary>What is a GENOME KEY?</summary><p>A GENOME KEY is created only when you explicitly choose to share a FILMPRINT result for DNA CROSSCHECK. The normal result stays local first; the share flow publishes only the data required for comparison, not an account identity.</p></details>
            <details><summary>What is Daily Dose?</summary><p>Daily Dose is the eye-access prescription system. It can issue up to three curated film doses per local day. Reopening a dose you already received does not spend another dose.</p></details>
            <details><summary>How do Daily Cases and creature rewards work?</summary><p>Six cases appear each local day across Scanner, Atlas, Mutation and Crossbreed. Solve 2, 4 and 6 cases to earn the three pack milestones. TRACE assistance never reduces those rewards.</p></details>
            <details><summary>What is the Lab Wall?</summary><p>The Lab Wall is the public research board. You can read visitor notes and leave a transmission under a chosen name or anonymously. Internal identifiers are not displayed as public identity.</p></details>
            <details><summary>Will my phone and laptop share the same collection and history?</summary><p>Not automatically. Experiments, creature collections and most progress are stored in the browser, so different devices can have different local records.</p></details>
            <details><summary>Why is a poster sometimes missing?</summary><p>Poster art is hydrated through the site's external TMDB connection. Core CineGenome results still work if that image service is unavailable, and posterless fallbacks are used where possible.</p></details>
            <details><summary>Do I need an account or payment?</summary><p>No account or purchase is required for the current lab experience.</p></details>
          </div>
        </section>
      </div>
      <footer class="field-manual-footer">END OF FILE // EVERYTHING ELSE IS FIELDWORK</footer>
    </div>`;
  document.body.appendChild(dialog);

  let opener = null;
  const tabs = [...dialog.querySelectorAll('[data-manual-tab]')];
  const tabNames = new Set(['start', 'modules', 'protocols', 'faq']);

  function switchTab(name) {
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.manualTab === name)));
    dialog.querySelectorAll('[data-manual-panel]').forEach(panel => {
      panel.hidden = panel.dataset.manualPanel !== name;
    });
    dialog.scrollTop = 0;
  }

  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    opener = trigger;
    const requested = trigger.dataset.fieldManualSection;
    switchTab(tabNames.has(requested) ? requested : 'start');
    if (!dialog.open) dialog.showModal();
  }));

  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-manual-close]')) { dialog.close(); return; }
    const tab = event.target.closest('[data-manual-tab]');
    if (tab) { window.CINEGENOME_UI_SFX?.menu?.(false); switchTab(tab.dataset.manualTab); return; }
    const action = event.target.closest('[data-manual-action]')?.dataset.manualAction;
    if (!action) return;
    dialog.close();
    const mobile = !!document.getElementById('mTabScanner');
    setTimeout(() => {
      if (action === 'scanner' || action === 'cases') {
        document.querySelector(mobile ? '#mTabScanner' : '#moduleNav [data-view="scanner"]')?.click();
        if (action === 'cases') document.querySelector(mobile ? '#mScanner [data-anomaly-open]' : '#view-scanner [data-anomaly-open]')?.click();
      } else if (action === 'filmprint') {
        if (mobile) document.getElementById('m-test-ur-dna')?.scrollIntoView({behavior:'smooth',block:'start'});
        else document.querySelector('#moduleNav [data-view="dna"]')?.click();
      } else if (action === 'rx') {
        document.getElementById(mobile ? 'mRxBtn' : 'rxFab')?.click();
      } else if (action === 'labwall') {
        window.location.href = mobile ? '../lab-wall.html' : 'lab-wall.html';
      }
    }, 24);
  });

  dialog.querySelector('.field-manual-tabs')?.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    switchTab(next.dataset.manualTab);
  });

  dialog.addEventListener('close', () => opener?.focus());
})();

/* Orientation dossier shared by desktop and mobile. No saved state or APIs. */
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
        <button type="button" data-manual-tab="modules" aria-pressed="false">02 / THE LAB</button>
        <button type="button" data-manual-tab="creatures" aria-pressed="false">03 / CREATURES</button>
        <button type="button" data-manual-tab="faq" aria-pressed="false">04 / FAQ</button>
      </nav>
      <div class="field-manual-content">
        <section data-manual-panel="start" aria-labelledby="manualStartTitle">
          <div class="field-manual-kicker">WELCOME, NEW OPERATOR // ACCESS GRANTED</div>
          <h2 id="manualStartTitle">WHAT IS CINEGENOME?</h2>
          <p class="field-manual-lead">CineGenome is an interactive film laboratory. Treat a movie like an organism: search for a title, read its cinematic DNA, compare it with other films, then experiment with what its traits could become.</p>
          <p>The 12 DNA traits describe mood, storytelling and visual style. They are CineGenome's interpretive model, not official film ratings or scientific measurements.</p>
          <div class="field-manual-side field-manual-start-shortcut"><b>FAST TRACK // FILMPRINT</b><p><strong>FILMPRINT</strong> is the quickest way to understand the lab from the inside. It reads your taste through 30 signals, rebuilds a 15-axis cinematic DNA strand, then returns the closest specimen in the archive. If you want a shortcut, start there.</p></div>
          <div class="field-manual-path">
            <div><b>01</b><strong>SCAN A FILM</strong><span>Search a title in Specimen Scanner and open its dossier.</span></div>
            <div><b>02</b><strong>FOLLOW THE SIGNAL</strong><span>Inspect its DNA and nearest films; explore the other lab modules.</span></div>
            <div><b>03</b><strong>SCAN YOURSELF</strong><span>Run FILMPRINT to decode your own cinematic DNA and find your closest specimen.</span></div>
            <div><b>04</b><strong>HUNT & COLLECT</strong><span>Solve daily cases, open creature packs and build your collection.</span></div>
          </div>
          <div class="field-manual-actions">
            <button type="button" data-manual-action="scanner">ENTER SPECIMEN SCANNER ↗</button>
            <button type="button" data-manual-action="filmprint">RUN FILMPRINT ↗</button>
            <button type="button" data-manual-action="rx">TRY DAILY DOSE ↗</button>
          </div>
        </section>
        <section data-manual-panel="modules" aria-labelledby="manualModulesTitle" hidden>
          <div class="field-manual-kicker">ACCESS MAP // 06 ACTIVE CHAMBERS + SIDE SIGNALS</div>
          <h2 id="manualModulesTitle">WHAT CAN I DO HERE?</h2>
          <div class="field-manual-module-grid">
            <article><small>01 / EXAMINE</small><h3>SPECIMEN SCANNER</h3><p>Search films, read their 12-trait DNA, open dossiers and discover nearby cinematic genomes.</p></article>
            <article><small>02 / COMBINE</small><h3>CROSSBREED REACTOR</h3><p>Choose two parent films and adjust the blend to generate an imaginary hybrid.</p></article>
            <article><small>03 / ALTER</small><h3>MUTATION CHAMBER</h3><p>Move the DNA sliders to design an impossible movie and find its nearest matches.</p></article>
            <article><small>04 / MAP</small><h3>GENOME ATLAS</h3><p>Choose X and Y traits, then inspect where films land on the cinematic map.</p></article>
            <article><small>05 / TRACE</small><h3>BLOODLINE LAB</h3><p>Explore model-inferred film relatives based on DNA similarity and release dates.</p></article>
            <article><small>06 / REMEMBER</small><h3>EXPERIMENT ARCHIVE</h3><p>Revisit films and experiments you saved in this browser.</p></article>
          </div>
          <div class="field-manual-side"><b>OTHER SIGNALS</b><p><strong>Daily Dose</strong> prescribes up to three curated films a day. <strong>Dead Channel</strong> is the weird film detour, with a roulette picker and off-catalog discoveries.</p></div>
          <p class="field-manual-hint">On mobile, the main Scanner and Archive tabs sit near the top. The fixed navigation below takes you to MIX, MUTATE, ATLAS and BLOODLINE.</p>
        </section>
        <section data-manual-panel="creatures" aria-labelledby="manualCreaturesTitle" hidden>
          <div class="field-manual-kicker">ANOMALY HUNT // CREATURE CAPTURE PROTOCOL</div>
          <h2 id="manualCreaturesTitle">HOW DO I CATCH CREATURES?</h2>
          <p class="field-manual-lead">Open <strong>DAILY CASES</strong> in a lab module. Solve clues by using Scanner, Atlas, Mutation and Crossbreed. Six new cases appear each local day: two Scanner, two Atlas, one Mutation and one Crossbreed. A deep-rotation case bank walks through large deterministic decks before recycling, so short-cycle repeats are suppressed.</p>
          <div class="field-manual-side"><b>STUCK? REQUEST A TRACE.</b><p>Every unsolved case now has three optional assistance layers: <strong>LOCATE</strong> tells you which lab module and control to use, <strong>NARROW</strong> reduces the search space, and <strong>DECODE</strong> exposes a near-solution while still making you perform the experiment. <strong>TAKE ME THERE</strong> jumps to the correct module and highlights the relevant controls. TRACE use lowers only the cosmetic Case Integrity readout — creature rewards never change.</p></div>
          <div class="field-manual-reward-track">
            <div><b>2 CASES</b><strong>1 PACK</strong></div>
            <div><b>4 CASES</b><strong>2 PACKS</strong></div>
            <div><b>6 CASES</b><strong>3 PACKS</strong></div>
          </div>
          <p>Open a pack to reveal a creature card. Each draw is independent, so a creature you already own can appear again. Duplicates add another copy to your collection.</p>
          <div class="field-manual-odds"><span>DRAW ODDS</span><b>C 60%</b><b>B 30%</b><b>A 8%</b><b>S 1.8%</b><b>SR 0.2%</b></div>
          <p class="field-manual-hint">Cases reset at your local midnight. Unopened packs and obtained cards stay in this browser. Your phone and laptop keep separate collections.</p>
          <div class="field-manual-actions"><button type="button" data-manual-action="cases">OPEN DAILY CASES ↗</button></div>
        </section>
        <section data-manual-panel="faq" aria-labelledby="manualFaqTitle" hidden>
          <div class="field-manual-kicker">COMMON TRANSMISSIONS // ANSWERS UNSEALED</div>
          <h2 id="manualFaqTitle">FAQ</h2>
          <div class="field-manual-faq">
            <details><summary>What exactly is FILMPRINT?</summary><p>FILMPRINT is CineGenome's 30-signal taste assay. You answer thirty five-point Likert prompts, and the lab reconstructs a 15-axis cinematic preference strand before finding the closest specimen in its calibrated candidate library. It is deterministic: the same completed answer pattern produces the same result.</p></details>
            <details><summary>Does Neutral count as an answer?</summary><p>Yes. Neutral is a real, selectable response, not an unanswered state. It contributes very little directional pressure, so a neutral-heavy profile produces a softer signal than a profile built from strong, consistent answers.</p></details>
            <details><summary>Why does FILMPRINT ask similar questions twice?</summary><p>The 30 prompts are paired across 15 taste axes, including reverse-coded partners. CineGenome compares each pair for coherence. Contradictory pairs are automatically down-weighted instead of being treated as equally reliable evidence.</p></details>
            <details><summary>What do Specimen Affinity and Connection Route mean?</summary><p><strong>Specimen Affinity</strong> explains the strongest measurable alignments between your taste strand and the matched film, plus the most meaningful genomic deviation. <strong>Connection Route</strong> goes one layer deeper and identifies the particular way you connect to that film, so two people can share the same closest specimen for different reasons.</p></details>
            <details><summary>Why do some FILMPRINT numbers have decimals?</summary><p>Matched specimens use stable micro-fingerprints at 0.1 precision to separate films that sit extremely close together in the same DNA territory. The tiny variation is deterministic and capped, so it refines close calls without overpowering the larger profile.</p></details>
            <details><summary>What is a CONNECTION ROUTE?</summary><p>Your closest specimen has one stable film DNA, but different people can connect to that same film through different parts of its profile. CONNECTION ROUTE analyzes the strongest shared, non-neutral signals after the match is found and names the route — for example LIMINAL, VISCERAL, INTIMATE or CONTEMPLATIVE. α marks a concentrated primary route; β marks a more mixed or contrastive route. The route is deterministic and does not change the winning film.</p></details>
            <details><summary>Can I share my FILMPRINT result?</summary><p>Yes. Your result stays local first. The internal offline key remains available as a compatibility fallback, but the normal interface only shows a short server-backed <strong>GENOME KEY</strong> after you explicitly create one for friend comparison. PNG export opens in a dedicated output terminal, then offers Story 9:16, Square 1:1, Post 4:5 and Wide 16:9 formats with modular content controls.</p></details>
            <details><summary>What is a GENOME KEY and how does friend comparison work?</summary><p>FILMPRINT now uses a hybrid key system. Your full result stays local by default. CineGenome keeps the long CG1 representation internally as an offline/legacy fallback, but it stays out of the normal interface. If you explicitly press <strong>CREATE SHARE KEY</strong>, CineGenome publishes only the 30 response values to the configured share store and returns a shorter CG key. DNA CROSSCHECK accepts either type, calculates DNA Sync, highlights shared and split axes, and identifies the friend's closest specimen. No account name or login identity is stored in the key.</p></details>
            <details><summary>Why is a poster missing from my result or export?</summary><p>Poster artwork is hydrated through the site's TMDB connection. FILMPRINT and the local DNA result still work if that external image is unavailable; exports fall back to a posterless CineGenome layout instead of failing.</p></details>
            <details><summary>What is Daily Dose?</summary><p>Daily Dose is the eye-access prescription system. It can issue up to three curated film doses per local day. Reopening or browsing a dose you already received does not spend another dose.</p></details>
            <details><summary>How many OPEN CASES appear each day?</summary><p>Six: two Scanner cases, two Atlas cases, one Mutation case and one Crossbreed case. The hunt now draws from 1,520 core case blueprints before additional blend-window variation, using deterministic deep-rotation decks that suppress short-cycle repeats.</p></details>
            <details><summary>What is REQUEST TRACE and does it reduce my rewards?</summary><p>REQUEST TRACE is progressive case assistance. TRACE 01 points to the correct module and control, TRACE 02 narrows the search, and TRACE 03 partially decodes the solution. TAKE ME THERE can jump directly to the relevant lab area and highlight what to use. TRACE levels reduce the cosmetic Case Integrity readout from 100% to 85%, 65% or 40%, but pack milestones and creature draw odds are never reduced.</p></details>
            <details><summary>Do today's OPEN CASES use pure randomness?</summary><p>No. The daily set is deterministic for the local date. Atlas ranges are built from archive distributions so viable specimens remain discoverable, Mutation thresholds vary by protocol, and Crossbreed cases rotate authored parent riddles with balanced or tight blend windows.</p></details>
            <details><summary>How do creature rewards work?</summary><p>Solve 2 cases for the first pack, 4 for the second and all 6 for the third. Each pack draw is independent, so duplicates can appear and increase that creature's copy count. Current draw odds are C 60%, B 30%, A 8%, S 1.8% and SR 0.2%.</p></details>
            <details><summary>What resets each day, and what stays?</summary><p>OPEN CASES and Daily Dose availability reset on the device's local date. Creature cards, unopened earned packs, saved experiments, FILMPRINT progress and other browser-local records remain unless that site's local data is cleared.</p></details>
            <details><summary>Will my phone and laptop share the same collection and history?</summary><p>No. CineGenome currently stores collections, experiments and other progress in the browser. Devices can therefore have different creature draws and histories, and clearing site data can remove those local records.</p></details>
            <details><summary>Are Scanner DNA and FILMPRINT DNA the same thing?</summary><p>They are related but not identical. Scanner dossiers use CineGenome's film-facing DNA model to describe a movie. FILMPRINT uses a separate 15-axis human taste strand derived from your 30 responses, then compares that preference signal with candidate film profiles.</p></details>
            <details><summary>Are DNA numbers ratings or scientific measurements?</summary><p>No. They are interpretive model coordinates for mood, storytelling, visual language and taste proximity. Similarity, Bloodline links, FILMPRINT matches and specimen bios are model outputs, not objective quality scores, medical tests or verified claims of artistic influence.</p></details>
            <details><summary>Do I need an account or payment?</summary><p>No account or purchase is required for the current lab experience. Progress is browser-local rather than account-synced.</p></details>
          </div>
        </section>
      </div>
      <footer class="field-manual-footer">END OF FILE // RETURN TO THE LAB WHEN READY</footer>
    </div>`;
  document.body.appendChild(dialog);
  let opener = null;
  const tabs = [...dialog.querySelectorAll('[data-manual-tab]')];
  function switchTab(name) {
    tabs.forEach(tab => { tab.setAttribute('aria-pressed', String(tab.dataset.manualTab === name)); });
    dialog.querySelectorAll('[data-manual-panel]').forEach(panel => {
      panel.hidden = panel.dataset.manualPanel !== name;
    });
    dialog.scrollTop = 0;
  }
  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    opener = trigger; switchTab('start');
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
      }
    }, 24);
  });
  dialog.querySelector('.field-manual-tabs')?.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();switchTab(next.dataset.manualTab);
  });
  dialog.addEventListener('close', () => opener?.focus());
})();

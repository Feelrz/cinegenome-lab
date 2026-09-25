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
          <div class="field-manual-path">
            <div><b>01</b><strong>SCAN A FILM</strong><span>Search a title in Specimen Scanner and open its dossier.</span></div>
            <div><b>02</b><strong>FOLLOW THE SIGNAL</strong><span>Inspect its DNA and nearest films; explore the other lab modules.</span></div>
            <div><b>03</b><strong>HUNT & COLLECT</strong><span>Solve daily cases, open creature packs and build your collection.</span></div>
          </div>
          <div class="field-manual-actions">
            <button type="button" data-manual-action="scanner">ENTER SPECIMEN SCANNER ↗</button>
            <button type="button" data-manual-action="rx">TRY DAILY RX ↗</button>
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
          <div class="field-manual-side"><b>OTHER SIGNALS</b><p><strong>Daily RX</strong> prescribes up to three curated films a day. <strong>Dead Channel</strong> is the weird film detour, with a roulette picker and off-catalog discoveries.</p></div>
          <p class="field-manual-hint">On mobile, the main Scanner and Archive tabs sit near the top. The fixed navigation below takes you to MIX, MUTATE, ATLAS and BLOODLINE.</p>
        </section>
        <section data-manual-panel="creatures" aria-labelledby="manualCreaturesTitle" hidden>
          <div class="field-manual-kicker">ANOMALY HUNT // CREATURE CAPTURE PROTOCOL</div>
          <h2 id="manualCreaturesTitle">HOW DO I CATCH CREATURES?</h2>
          <p class="field-manual-lead">Open <strong>DAILY CASES</strong> in a lab module. Solve clues by using Scanner, Atlas, Mutation and Crossbreed. Six new cases appear each local day: two Scanner, two Atlas, one Mutation and one Crossbreed.</p>
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
            <details><summary>Do I need an account or pay to play?</summary><p>No account or purchase is required. The lab, daily cases and creature draws are free to use.</p></details>
            <details><summary>Will my phone and laptop get the same cards?</summary><p>Each browser rolls independently. The results can differ, but both devices can also get the same card by chance. Collections do not sync between devices.</p></details>
            <details><summary>What resets each day?</summary><p>The six Anomaly Hunt cases and daily RX availability reset on the device's local date. Cards and unopened packs remain in the same browser.</p></details>
            <details><summary>Where can I see my creatures?</summary><p>Open DAILY CASES, then scroll to CREATURE COLLECTION. Each card shows its rarity, copy count and acquisition date.</p></details>
            <details><summary>Are DNA numbers film ratings?</summary><p>No. They are interpretive outputs from the CineGenome model. Similarity and Bloodline relationships describe model proximity, not verified artistic influence.</p></details>
            <details><summary>Why is a poster or film detail missing?</summary><p>Some metadata comes from the site's TMDB connection. The lab can show a local DNA record while an external poster or detail is unavailable.</p></details>
            <details><summary>How do I keep my collection?</summary><p>Keep using the same browser and device. Clearing site data can remove locally saved cards and experiments. Cross-device accounts are not available yet.</p></details>
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
    if (tab) { switchTab(tab.dataset.manualTab); return; }
    const action = event.target.closest('[data-manual-action]')?.dataset.manualAction;
    if (!action) return;
    dialog.close();
    const mobile = !!document.getElementById('mTabScanner');
    if (action === 'scanner' || action === 'cases') {
      document.querySelector(mobile ? '#mTabScanner' : '#moduleNav [data-view="scanner"]')?.click();
      if (action === 'cases') document.querySelector(mobile ? '#mScanner [data-anomaly-open]' : '#view-scanner [data-anomaly-open]')?.click();
    } else if (action === 'rx') document.getElementById(mobile ? 'mRxBtn' : 'rxFab')?.click();
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

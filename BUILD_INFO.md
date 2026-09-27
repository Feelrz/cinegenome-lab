# CINEGENOME V5.0 FINAL CHECKED

Final QA wrapper for the EEAAO Eyes Polish build.

# CineGenome V5.0 FINAL — Release Polish 1

Build lineage: V5.0 FINAL + DNA Crosscheck Hotfix + Genome Persistence Hotfix.

This patch changes only presentation/navigation safeguards and interaction polish:
- Story 9:16 export reserves the score/meta header before the centered poster, moving the poster and all dossier blocks lower.
- EXPORT DNA CARD is now the acid-green primary result action; RETEST DNA is secondary.
- Entering FILMPRINT auto-scrolls to the module and BEGIN SEQUENCE carries a restrained readiness beacon.
- Anonymous Lab Note posting requires a deliberate second PIN click.
- Yūgen and Lab Wall now reject direct address-bar entry unless the current tab received an authored route grant from CineGenome. Refresh remains usable while inside; returning to the lab clears the route grant.

IMPORTANT: the HTML route gate is an experience/discovery gate, not a security boundary. Public client files remain inspectable by a determined visitor.

# CineGenome V5.0 FINAL

BASE: CineGenome V5.0 Beta 91. Production candidate for `cinegenome.xyz` on the existing Vercel deployment.

## Final homepage interaction polish
- Quest Board and Creature Index now react to the cursor across the entire paper surface, not only the CTA.
- Each card lifts, drifts a few pixels toward the pointer and receives a restrained 3D tilt; it settles smoothly when the pointer leaves.
- The yellow Chief Researcher / External Field Log strip receives a lighter version of the same physical-paper motion.
- Hover SFX now triggers on the whole Quest / Creature / Field Log paper surface; click SFX remains on the actual CTA/link, avoiding double audio.
- Fine-pointer and `prefers-reduced-motion` guards keep touch/mobile and accessibility behavior stable.

## Production packaging
- Desktop + mobile build metadata now report `V5.0 FINAL`.
- Production home assets use `css/home-final.css` and `js/home-tactile-final.js` with a final cache key.
- Added canonical metadata for `cinegenome.xyz`, plus `robots.txt` and `sitemap.xml`.
- Vercel same-origin `/api/*` architecture and environment-variable model are preserved. No secrets are embedded in client files.

## Runtime logic preserved
DNA calculation, film data, Crossbreed, Mutation, Atlas, Bloodline, Daily Cases / Creature logic, persistence, Yūgen, Lab Wall, and server API behavior are unchanged by this final polish.

---

# CineGenome V5.0 Beta 91

BASE: CineGenome V5.0 Beta 90. DEVELOPMENT BUILD — no MASTER/STABLE promotion.

## Scope
- Add one more physically attached note to the Chief Researcher welcome letter.
- Make the note open into a centered long-form paper instead of navigating away.
- Add subtle reactive behavior to the long memo without sacrificing readability.
- Add tactile hover/click audio feedback to homepage cards while respecting the existing global SFX preference.

## Sealed Addendum / 00-B
- New taped mini-paper is attached inside the welcome-letter heading column.
- Copy: `READ IF YOU PLAN TO TOUCH EVERYTHING.` / `UNSEAL FIELD NOTE ↗`.
- Clicking opens a centered paper dialog titled `DO NOT FOLLOW THE LAB IN ORDER.`
- The memo expands the lab philosophy: room order is optional, UNKNOWN ≠ ZERO, side channels are intentionally incomplete, bad experimental ideas are welcome when documented, and the CineGenome logo is a return path rather than an in-world exit.
- Hovering each paragraph updates the memo status strip (`ROOM ORDER / OPTIONAL`, `DATA RULE / UNKNOWN ≠ ZERO`, etc.).
- Paper receives a restrained cursor parallax on mouse/pen; reduced-motion users receive a static paper.
- Desktop and mobile share the same memo and responsive paper layout.

## Homepage tactile SFX
- Added a short dry mechanical hover tick to the interactive homepage cards after the browser audio context has been unlocked by a real user gesture.
- Existing room-navigation cards keep their current menu-click sound; the new layer does not stack a second click on them.
- Controls without an existing homepage click sound receive a short paper/switch click: Daily Cases, Lab Wall, Specimen Code, Quest/Creature controls, Yūgen mark, Field Manual, the sealed addendum and the external field-log link.
- All new sounds obey `cinegenome_ui_sfx_v1` / global SFX OFF.

## Files changed
- `index.html`
- `mobile/index.html`
- `css/home-beta91.css` (new; extends Beta 90 home styling)
- `js/home-tactile.js` (new)
- `BUILD_INFO.md`
- `STAGING_QA_V5_BETA91.md` (new)

## Preserved
Entry-transition timing from Beta 90, Field Manual content, DNA datasets/calculations, Scanner/Crossbreed/Mutation/Atlas/Bloodline logic, persistence schema, Yūgen and Lab Wall implementation are unchanged.

---

# CineGenome V5.0 Beta 90

BASE: CineGenome V5.0 Beta 89. DEVELOPMENT BUILD — no MASTER/STABLE promotion.

## Scope
- Tighten entry/loading cadence one more step without returning to abrupt Beta 86-style pacing.
- Rewrite and simplify UNSEAL FIELD MANUAL around the current product instead of accumulating old explanations.
- Replace the clickable `THE MAP IS INCOMPLETE` homepage note with a non-navigation welcome letter from the Chief Researcher.

## Entry cadence
- Specimen Scanner: final stage at ~1.40s, release begins at ~1.66s, hidden after ~1.92s.
- Crossbreed / Mutation / Atlas / Bloodline / Archive: final stage around ~1.53–1.59s, release around ~1.94–2.00s, hidden ~0.32s later.
- FILMPRINT: trimmed to ~2.36s total.
- Progress and stage copy still use eased transitions; no instant snapping.

## Field Manual
- Tabs are now START HERE / LAB MAP / PROTOCOLS / FAQ.
- Removed duplicated technical FAQ material and deep implementation trivia that did not help a first-time operator.
- Added a compact distinction between 12-axis film DNA and 15-axis FILMPRINT taste DNA.
- Added current side channels: FILMPRINT, Daily Dose, Daily Cases, Lab Wall.
- Added browser-local persistence/reset explanation, TRACE behavior, reward milestones, creature odds and data-status legend.
- Added direct Lab Wall action while keeping unindexed/hidden channels intentionally undisclosed.

## Homepage welcome letter
- Replaces `THE MAP IS INCOMPLETE` and removes its forced Scanner click target.
- New Chief Researcher memo welcomes the operator, establishes the unresolved-exit fiction, and explicitly encourages free exploration.
- Includes a taped yellow researcher sign-off, `STATUS / UNCONFIRMED`, and a discreet external field-log link to the supplied Letterboxd profile.
- Implemented on desktop and mobile home surfaces.

## Files changed
- `index.html`
- `mobile/index.html`
- `js/app.js`
- `js/field-manual.js`
- `css/home-beta90.css` (new)
- `BUILD_INFO.md`
- `STAGING_QA_V5_BETA90.md` (new)

## Preserved
DNA datasets, Scanner calculations, Crossbreed calculations, Mutation calculations, Atlas/Bloodline logic, persistence schema, Yūgen and Lab Wall implementation are unchanged.

---

# CineGenome V5.0 Beta 89

BASE: CineGenome V5.0 Beta 88. DEVELOPMENT ONLY — no MASTER/STABLE promotion.

Transition pacing pass only. The Scanner acquisition sequence is slightly slower than Beta 88 so each readout is legible without feeling abrupt, while Crossbreed, Mutation, Genome Atlas, Bloodline and Experiment Archive are shortened from the previous ~3.3–3.4 second hold to roughly ~2.3–2.4 seconds before release. Their fade-out is also tightened, while progress, text and scanline motion remain eased rather than snapping. FILMPRINT keeps its existing ~2.7 second entry timing because it already sits in the intended middle range.

Net effect: the shared lab-room transitions now land around the same perceived cadence as FILMPRINT — long enough to read the room-specific process, short enough not to interrupt navigation. No transition copy, layout containment, side-panel reveal behavior, auto-scroll behavior, film/DNA data, scoring, Crossbreed/Mutation logic, storage, quests, APIs, Yūgen or Lab Wall changed.

See `STAGING_QA_V5_BETA89.md`.

## Beta 88 baseline (retained)

BASE: CineGenome V5.0 Beta 87. DEVELOPMENT ONLY — no MASTER/STABLE promotion.

Minor entry-transition polish. For Crossbreed, Mutation, Atlas/Bloodline where applicable, and Experiment Archive, any secondary/right lab panel now behaves like Scanner's Pathology Report during acquisition: the panel frame/header remains visible, but panel-body results/log text stays hidden until the entry sequence has fully faded out. No result is exposed early during loading.

Experiment Archive's contained VAULT transition now reserves enough temporary panel-body height while mounted, so the dossier graphic, progress bar and status copy remain fully inside the dark archive result box even when local storage is empty or the archive content is otherwise short. The temporary height is released immediately after the entry gate unmounts.

No film data, DNA scoring, mutation/crossbreed math, storage schema, quests, APIs, Yūgen, Lab Wall, FILMPRINT, or transition timing changed.

See `STAGING_QA_V5_BETA88.md`.

## Beta 87 baseline (retained)

BASE: CineGenome V5.0 Beta 86. DEVELOPMENT ONLY — no MASTER/STABLE promotion.

Contained-transition refinement requested after Beta 86. Experiment Archive now joins Scanner, Crossbreed, Mutation, Atlas and Bloodline in the module auto-focus set on desktop and mobile. The Scanner acquisition terminal is lowered again for a more natural visual center while its existing scan timing stays unchanged.

Crossbreed, Mutation, Atlas, Bloodline and Archive entry sequences no longer cover the full lab viewport. The shared gate is re-parented into each active module's primary lab panel body, where it behaves like the Scanner's contained acquisition overlay. Their phase timing is deliberately slower (about 3.3–3.4 seconds), the scanline and graphic motion are calmer, and each graphic advances by stage instead of relying on fast looping. The transition terminal now has fixed desktop/mobile geometry so long phase labels cannot make the card grow and shrink. Mutation copy is shortened to stable labels such as CHAMBER UNSTABLE and TRAIT REWRITE.

No film data, DNA scoring, mutation math, archive storage schema, quests, APIs, Yūgen, Lab Wall, or FILMPRINT logic changed. Reduced-motion behavior remains supported.

See `STAGING_QA_V5_BETA87.md`.

## Beta 86 baseline (retained)

BASE: CineGenome V5.0 Beta 85. DEVELOPMENT ONLY — no MASTER/STABLE promotion.

Module-transition pass requested after Beta 85. The Specimen Scanner keeps its existing acquisition sequence but the terminal now sits visibly lower in the scanner viewport for a cleaner vertical balance. Crossbreed Reactor, Mutation Chamber, Genome Atlas, Bloodline Lab and Experiment Archive now each have a dedicated room-entry sequence with their own explanatory stages and motion language: parent-vector splicing, chamber destabilization, coordinate indexing, lineage tracing and local dossier reconstruction. FILMPRINT keeps its existing fingerprint-entry scan.

The previously approved auto-focus scope remains unchanged: Scanner, Crossbreed, Mutation, Atlas and Bloodline auto-focus; Archive still keeps its prior top-reset behavior. Yūgen and Lab Wall are byte-for-byte unchanged. No film data, DNA scoring, mutation math, archive schema, quests, APIs or persistence logic changed. Reduced-motion users skip the new room-entry animation.

See `STAGING_QA_V5_BETA86.md`.

## Beta 85 baseline (retained)

BASE: CineGenome V5.0 Beta 84. DEVELOPMENT ONLY — no MASTER/STABLE promotion.

UX navigation pass requested after Beta 84. Specimen Scanner, Crossbreed Reactor, Mutation Chamber, Genome Atlas and Bloodline Lab now auto-focus their active module when opened, so the module panel arrives at the top of the viewport instead of requiring a manual scroll past the global hero. Home, Archive and Filmprint keep their existing top behavior. Yūgen and Lab Wall are intentionally unchanged. Reduced-motion users receive an immediate jump instead of smooth motion.

Mutation Chamber desktop now places DEVIATION FROM SEED / LARGEST CHANGES after the trait slider + tube controls, so the user edits the live vector before reading the diagnostic delta. Mobile already used this hierarchy and remains structurally unchanged. No DNA calculations, mutation values, matching, storage, quests, film data, Yūgen or Lab Wall logic changed.

See `STAGING_QA_V5_BETA85.md`.

## Beta 84 baseline (retained)

BASE: CineGenome V5.0 Beta 83. DEVELOPMENT ONLY — no MASTER/STABLE promotion.

Navigation-transition patch only. The Lab Wall card under FOLLOW THE EVIDENCE now uses the same board-opening portal transition as the header/public-wall entry. Returning from Lab Wall or Yūgen sets a one-shot session return flag, skips the main CineGenome boot replay, fades the external room out, and softly settles the already-running lab UI back in. Modified-click behavior is preserved and reduced-motion users are not forced through the exit delay. No film data, DNA logic, quest logic, storage schemas, APIs, or feature scoring changed.

See `STAGING_QA_V5_BETA84.md`.

## Beta 83 baseline (retained)

# CineGenome V5.0 Beta 83

BASE: CineGenome V5.0 Beta 82 from this session. DEVELOPMENT ONLY — no MASTER/STABLE promotion.

Eight-part revision: Beta81 heading treatment; minimal red Yūgen glyph with a short glitch and existing entry route; FILMPRINT as the primary home entry; optional synthesized Yūgen spinner sound; three Scanner riddles plus three rotating lab protocols, daily check-in and a seven-day GOLD reward; Save without rescanning; separate searchable Saved Films and Experiments shelves; richer, readable instruments in Crossbreed, Mutation, Atlas and Bloodline on desktop and mobile.

Normal draw odds remain C 60 / B 30 / A 8 / S 1.8 / SR 0.2 percent. GOLD is B 87 / A 10 / S 2.7 / SR 0.3 percent, one additional pack every seven consecutive completed daily check-ins. Collection and streak remain local to the browser. The pool now contains 105 unique film riddles, including 25 additional clues drawn from existing editorial source notes. This is a quest content expansion, not an additional verified film-DNA batch.

Migration: legacy earned cards and packs remain. Case stamps from the previous two-riddle deck are cleared on upgrade because their IDs refer to different questions; a notice explains the new daily file. Favorites and saved experiment snapshots retain their existing storage schema. New readouts retain unknown values as unknown and do not alter scoring or matching.

See STAGING_QA_V5_BETA83.md for tests, changed files, shared dependencies and the browser-staging limitation.

## Beta 82 baseline (retained)

# CineGenome V5.0 Beta 82

BASE: CineGenome V5.0 Beta 81 ZIP from this session, with the original Beta 79 homepage as the exact source of the restored room and side-channel content. Experimental development build; no master/stable promotion.

The Beta 81 upper field desk, FAQ and three entry methods remain. The original Beta 79 operator note, evidence scribble, eight visible room notes, three side-channel notes, their complete original text, and provenance footer have been restored for desktop and mobile. The awkward Beta 81 instrument directory and code ledger are removed. A small unregistered Japanese fragment at the edge of the side channel calls the existing YŪGEN entry protocol. The optional browser-only history is renamed RESIDUAL TRACE, moved below the side channel, and hidden until a real lab action exists. Mobile binds both FILMPRINT entry buttons. See `STAGING_QA_V5_BETA82.md`.

The film archive, cinematic DNA, APIs, header ADD NOTE and topbar remain unchanged from Beta 81. No 25-film score revisions were promoted without film-specific and per-axis source verification.

## Beta 81 baseline (retained)

# CineGenome V5.0 Beta 81

BASE: CineGenome V5.0 Beta 80 ZIP from this session. This is a development build; it is not a master or stable promotion. Beta 80's local evidence trail and existing routes remain, while the homepage visual system is replaced.

Homepage art direction: a restrained archival field desk. The Scanner is the primary investigation; FILMPRINT and Daily Cases have smaller, clear entry points. Creature Index follows the Cases, the recent evidence trail is quieter, and the six other modules form an instrument directory instead of a wall of similar cards. The FAQ remains explicitly labeled. The previous moving Darkroom spotlight, artificial negative reveal, heavy shadows and hover movement have been removed. Two already supported Specimen Codes now appear as plain accession records with their destinations and terminal links.

The desktop ADD NOTE header, mobile topbar, lab modules, storage contract, film/DNA database, and backend remain as in Beta 80. See `STAGING_QA_V5_BETA81.md` for actual verification and limitations. No 25-film batch was added; scoring without film-specific, per-axis evidence would imply false precision.

## Beta 80 baseline (retained)

# CineGenome V5.0 Beta 80

BASE: CineGenome V5.0 Beta 79 ZIP from this session. Beta 80 remains an experimental development build; the film archive and cinematic DNA are unchanged from Beta 79. No stable or master promotion.

The homepage now presents three distinct first choices (Specimen Scanner, FILMPRINT, Daily Cases) and places the Creature Index alongside a small local evidence trail above the secondary rooms on desktop and mobile. The trail appears only after a visitor actually scans a specimen, runs Crossbreed, or saves a Mutation; it keeps three recent actions in browser storage. It stores an operation name and real numeric film IDs, and labels DNA provenance from the existing archive. The buttons open the relevant room; they do not restore the exact prior experiment. Empty and unavailable data are shown honestly.

The Darkroom reveals two already implemented Specimen Codes through an explicit INSPECT NEGATIVE action. The FAQ opens the existing Field Manual. Navigation, ADD NOTE header, Lab Wall, GENOMIC ANOMALY, creature rewards and DNA scoring are preserved. See `STAGING_QA_V5_BETA80.md`.

No additional batch of 25 films was promoted in this homepage pass. Film-specific sources and per-axis interpretations are still required before changing scores or provenance.

## Beta 79 baseline (retained)

# CineGenome V5.0 Beta 79

BASE: CineGenome V5.0 Beta 78 ZIP from this session. Beta 79 remains an experimental development build; no stable promotion.

The homepage was rebuilt as a readable evidence board on desktop and mobile. A dedicated UNFILED / FAQ note opens the existing FAQ, and every lab room now has a short explanation and a working route. Separate Daily Quest, Creature Index and Specimen Code notes use the existing handlers. The two code hints shown on the board now include the required CG prefix, so they work as typed. The method scribble distinguishes archive evidence from interpreted DNA; UNKNOWN remains UNKNOWN. The original desktop header with ADD NOTE, mobile topbar, Lab Wall, scanner and GENOMIC ANOMALY remain in place.

Film DNA and metadata remain exactly at the Beta 78 baseline (77 source-reviewed films). No additional batch of 25 was promoted in this homepage pass: film-specific sources and per-axis reasoning would be needed before changing more scores or their evidence tier. See `STAGING_QA_V5_BETA79.md`.

## Beta 78 baseline (retained)

# CineGenome V5.0 Beta 78

BASE: User-requested CineGenome V5.0 Beta 77 ZIP. Beta 78 remains experimental; no MASTER or STABLE promotion.

The Beta 77 homepage remains the default route. Its original desktop hero/header, including ADD NOTE, is now visible there. The whiteboard adds usable Specimen Codes, archive and provenance notes; invented decorative DNA values were removed. GENOMIC ANOMALY remains available: when the archive lacks calibration it compares only a film's known axes to that film's own median, reports coverage and provenance, and marks missing axes UNKNOWN. No local rarity percentage is claimed.

Twenty-five existing legacy-curated Top-500 films received per-axis, source-linked editorial interpretations. Audit: 77 source-reviewed / 408 legacy partial / 467 archetype-derived / 44 provisional / 15 historical curated without axis trace. See `DNA_RESEARCH_BETA78.md` and `STAGING_QA_V5_BETA78.md`.

## Beta 77 baseline (retained)

BASE: CineGenome V5.0 Beta 76
DATE: 2026-09-27

BETA 77 is a bulk data-maturation pass. Exactly 900 formerly generic provisional records now have clearer, more useful CineGenome data states: 433 existing Top-500 legacy curated profiles keep their DNA scores unchanged but receive explicit partial-provenance classification, while 467 Watch Once profiles are recalibrated from title/year provisional DNA to title-specific editorial archetype profiles. The remaining 44 Watch Once records stay provisional rather than receiving forced low-evidence data. Source-reviewed records remain a separate high-evidence tier and no factual metadata is invented by the archetype process. See `UPDATE_V5_BETA77.md`, `DNA_RESEARCH_BETA77.md`, `STAGING_QA_V5_BETA77.md`, `database/editorial-archetype-batch04.json`, and `database/dna-audit-beta77.csv`.


## FINAL DNA CROSSCHECK UI HOTFIX
- Shared Signals now report axis MATCH percentage instead of delta.
- Split Signals continue to report delta.
- No scoring, stored genome data, share-key API, or specimen matching logic changed.

## FINAL GENOME PERSISTENCE HOTFIX
- Verified short share keys with server read-back before READY state.
- Same-browser recovery for self-generated short keys if the active remote store returns 404.
- RETEST DNA does not delete remote keys; misleading expired copy removed.



## FINAL UI HOTFIX
- Stable homepage sticky-note placement and bottom-edge containment.
- RETEST DNA returns to Filmprint BEGIN SEQUENCE intro.

## FINAL EEAAO / SPECIMEN-CODE POLISH
- Replaced the Letterboxd-specific provenance sentence with archive/evidence language that stands on its own.
- Added `CG-SYNAPSE12` to the visible Specimen Code card; the existing SYNAPSE route remains unchanged.
- Added `CG-EEAAO` as a new specimen-code Easter egg inspired by Everything Everywhere All at Once.
- `CG-EEAAO` opens a full-screen original interactive googly-eye field: pupils track the pointer/touch position, ESC/close collapses the field, and the supplied YouTube source is embedded as the background audio feed with a visible source fallback.
- The Chief Researcher welcome memo now explicitly hints at `CG-EEAAO` as a personal bias/discovery clue.
- Desktop lab module tabs now emit a restrained hover tick when crossed by a fine-pointer mouse, while their existing stronger click/navigation SFX remains intact.
- `api/` and `data/` are byte-identical to the previous FINAL NOTE + RETEST HOTFIX baseline.

## FINAL EEAAO PRESENTATION / AUDIO POLISH
- Enlarged the interactive pupils and slightly increased the eye field scale while preserving pointer tracking containment.
- Rebuilt EEAAO entry/exit as a staged universe reveal/collapse rather than an abrupt screen swap: signal-lock gate, radial reveal, staggered eyes, delayed copy/footer, and a reverse close transition.
- Replaced the YouTube iframe dependency with the user-supplied local `assets/audio/eeaao-i-love-you.mp3` file. Playback fades in and out and still respects the existing UI SFX preference.
- Recentered the entire EEAAO text system and rewrote the central message as an original Chief Researcher note about why the film is personally meaningful rather than a generic multiverse slogan.
- `api/`, `data/`, Filmprint DNA, genome persistence, Lab Wall, Yugen, Crossbreed, Mutation and Atlas logic remain unchanged.

## FINAL EEAAO GOOGLY-EYE REALISM POLISH
- Rebuilt the CG-EEAAO eye material to resemble physical plastic googly eyes: off-white dome, translucent lens highlights, grey rim depth, glossy black floating pupils, and softer cast shadows.
- Increased the interactive eye field from 14 to 45 independently tracking eyes with varied sizes and placement.
- Kept the existing EEAAO transition, personal copy, local soundtrack, and all non-EEAAO feature logic unchanged.
- Bumped specimen-code script cache key to `v5-final-eeao3` on desktop and mobile.

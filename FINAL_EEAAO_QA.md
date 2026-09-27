# CineGenome V5.0 FINAL — EEAAO / Specimen Code QA

STATUS: STATIC PASS / VISUAL BROWSER CHECK RECOMMENDED AFTER DEPLOY

Checks completed:
- Desktop `index.html`: no duplicate IDs.
- Mobile `mobile/index.html`: no duplicate IDs.
- `js/app.js`: Node syntax PASS.
- `js/specimen-codes.js`: Node syntax PASS.
- `api/` hash: unchanged from previous FINAL NOTE + RETEST HOTFIX.
- `data/` hash: unchanged from previous FINAL NOTE + RETEST HOTFIX.
- Old Letterboxd provenance sentence removed from desktop and mobile homepage.
- Visible Specimen Code card includes `CG-SYNAPSE12` on desktop and mobile.
- `CG-EEAAO` route present and normalizes from the user-facing hyphenated code.
- EEAAO interactive-eye overlay and supplied YouTube video ID are present.
- Desktop `.module-btn` fine-pointer hover SFX is wired separately from click/navigation SFX.

Browser note:
- Browsers may block sound before the first user gesture. Entering `CG-EEAAO` itself is a user gesture, so the YouTube background feed is requested at the correct moment; a visible source link remains available if the source refuses embedding/autoplay.

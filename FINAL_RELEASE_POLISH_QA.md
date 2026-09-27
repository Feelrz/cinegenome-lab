# CineGenome V5.0 FINAL — Release Polish QA

## Requested changes
- Story 9:16: percentage/header clearance reserved before poster; poster and subsequent dossier blocks moved downward.
- Result actions: EXPORT DNA CARD = primary acid-green; RETEST DNA = secondary.
- FILMPRINT entry: desktop auto-scrolls to FILMPRINT like the core lab modules; BEGIN SEQUENCE gets a restrained readiness beacon. Mobile already auto-scrolls and inherits the beacon.
- Anonymous note: blank NAME mode requires a second deliberate PIN click within 4.2s.
- Direct HTML discovery gate: Lab Wall and Yūgen require an in-session route grant created by CineGenome interactions. Main-lab pages clear stale grants, including BFCache return.
- Lab Wall and Yūgen removed from sitemap discovery; Lab Wall is now noindex to match Yūgen.

## Verification
- JS syntax: PASS for all modified JS files.
- Duplicate HTML IDs: PASS (desktop, mobile, Lab Wall, Yūgen).
- CSS brace balance: PASS.
- API + data file SHA-256 equality vs Genome Persistence Hotfix baseline: PASS.
- Filmprint auto-scroll, export-button priority, anonymous confirmation, Story clearance, Lab Wall/Yūgen route guards: static assertions PASS.

## Important limitation
The direct-page lock is an experience/discovery gate implemented in client-side code, not cryptographic authentication. It prevents ordinary address-bar entry but cannot make public HTML/JS secret from a determined visitor.

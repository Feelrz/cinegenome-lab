# CINEGENOME LAB ALT V49.6

This is the V49.1 build with more thoughtful daily Anomaly Hunt cases. Scanner uses film trivia; Atlas checks both axes; Mutation and Crossbreed use story riddles. RX arrows and all other V49 functionality remain. See `UPDATE_V49_2.md`.

# CINEGENOME LAB — ALT API BUILD

Interactive **movie DNA laboratory** built with plain HTML, CSS and JavaScript.

## ALT API build

This variant is configured for a **server-side TMDB proxy only**. Add `TMDB_API_KEY` in Vercel Environment Variables; the credential is never shipped to the browser. Use `TMDB CONNECTION -> TEST SERVER LINK` to verify it.

## Features

- **RX Diagnosis** — up to three cinematic diagnoses per day, delivered through an automatic scan and minimal reveal card.
- **500-title curated prescription pool** — snapshot membership from Letterboxd's official Top 500 list dated 2026-09-22. Ranking numbers are deliberately not shown or used in the UI.
- **Film dossier** — click `OPEN DOSSIER` to see poster, synopsis, metadata and the CINEGENOME DNA vector.
- **TMDB connection** — poster + overview + canonical metadata can be resolved from TMDB.
- **Automatic DNA generator** — imported TMDB metadata is converted to the 12 CINEGENOME dimensions with a deterministic rule-based scoring engine.
- **Batch Top-500 builder** — `scripts/build-top500.mjs` resolves all 500 bundled titles through TMDB and generates `data/top500-enriched.js` / `.json`.
- **Production proxy example** — `api/tmdb.js` keeps the TMDB token on the server for a public deployment.
- **Shared visitor total** — the desktop and mobile counters use `api/visitors.js` and a server-side Upstash Redis store. See `UPDATE_V44.md` for activation steps.
- **Daily Anomaly Hunt** — six seeded cases each local day across Scanner, Atlas, Mutation, and Crossbreed. Clues now include film trivia, two-axis coordinates and narrative riddles. Every two solved cases award one creature draw, for a maximum of three per day. The five creature illustrations are compressed to WebP; duplicates count toward the collection. See `UPDATE_V49_6.md` for the isolated gacha test mode.
- **Watch-once extension** — 511 additional searchable titles compared with the original curated Top 500. New titles are initially marked **PRELIMINARY**; TMDB metadata upgrades director, genres, synopsis, poster and inferred 12-trait DNA when the proxy is configured. The RX pool stays at the original 500. See `UPDATE_V49.md`.

The original modules remain:

- Specimen Scanner
- Crossbreed Reactor
- Mutation Chamber
- Genome Atlas
- Experiment Archive

## Run locally

Windows: double-click `START_HERE_WINDOWS.bat`.

Or:

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Poster + synopsis with TMDB

TMDB is not an open-source database API, but its developer API is free for non-commercial use subject to its terms and attribution requirements.

For local testing:

1. Create a TMDB account and obtain an **API Read Access Token**.
2. Open CINEGENOME.
3. Click `TMDB CONNECTION` in the footer.
4. Paste the token and press `CONNECT TMDB`.
5. The token is stored only in `sessionStorage`, so closing the browser session removes it.

Do **not** hard-code your bearer token into a public static site.

For production:

1. Set `TMDB_READ_TOKEN` in your hosting environment.
2. Deploy `api/tmdb.js` as a serverless function (the included example follows Vercel's handler shape).
3. Change `data/tmdb-config.js`:

```js
window.CINEGENOME_TMDB_CONFIG = {
  mode: 'proxy',
  proxyBase: '/api/tmdb',
  language: 'en-US'
};
```

TMDB attribution notice is already present in the settings dialog. For a public release, also add an approved TMDB logo in your credits/about area as required by TMDB's branding guidance.

## Build the complete 500-film database

The bundled `data/top500.js` contains exactly **500 unique titles**, with no public ranking field.

Run:

```bash
TMDB_READ_TOKEN="YOUR_TOKEN" node scripts/build-top500.mjs
```

On Windows PowerShell:

```powershell
$env:TMDB_READ_TOKEN="YOUR_TOKEN"
node scripts/build-top500.mjs
```

The importer:

1. Reads the 500-title curated snapshot.
2. Searches TMDB for each title.
3. Fetches details + credits + keywords.
4. Stores poster paths and synopsis.
5. Generates the 12-dimensional DNA vector.
6. Writes:
   - `data/top500-enriched.json`
   - `data/top500-enriched.js`
7. The website automatically loads `top500-enriched.js` on next refresh.

The script uses conservative sequential requests, handles HTTP 429 retry, and writes a partial checkpoint every 25 films.

## Today's Prescription logic

The daily film is deterministic for the local calendar date:

```text
DATE
 +
LOCAL FAVORITES PROFILE
 +
CURATED 500 POOL
 →
DAILY SPECIMEN
```

Refreshing the page does not change the prescription. One `CONTRAINDICATION` alternative is permitted per day. If TMDB is connected, a prescribed title that is not yet in the local database is resolved, given an automatic DNA vector, and cached locally.

## Data model

Canonical metadata and CINEGENOME DNA stay separate conceptually:

```text
TMDB
  ↓
movies
  title / year / overview / poster / director / genres / keywords
  ↓
CINEGENOME DNA ENGINE
  ↓
movie_dna
  surrealism / loneliness / chaos / romance / nostalgia / intensity
  pacing / visual_extremity / narrative_complexity / darkness / humor / dream_logic
```

`database/schema.sql` contains the Supabase/PostgreSQL schema with RLS for public catalog reads.

## Important data-source note

- `data/top500.js` stores curated list **membership only** and intentionally exposes no ranking.
- Letterboxd itself is not used for posters or synopsis.
- Poster and synopsis enrichment comes from TMDB.
- DNA values are CINEGENOME model/editorial output and are not official TMDB or Letterboxd fields.

## File structure

```text
cinegenome-lab/
├─ index.html
├─ START_HERE_WINDOWS.bat
├─ css/
│  └─ styles.css
├─ js/
│  ├─ app.js
│  └─ tmdb.js
├─ data/
│  ├─ movies.js
│  ├─ top500.js
│  ├─ top500-enriched.js
│  └─ tmdb-config.js
├─ api/
│  └─ tmdb.js
├─ scripts/
│  └─ build-top500.mjs
└─ database/
   ├─ schema.sql
   ├─ starter-movies.csv
   └─ tmdb-sync-example.mjs
```


## ALT V4 — RX Ritual

The current alternative build removes the prescription tab and moves the daily film prescription into a centered floating ritual. The 500-film database now lazy-loads director and genre metadata through the TMDB proxy as records become visible. See `UPDATE_V4.md`.


## ALT V6
See `UPDATE_V6.md` for the automatic 3x/day diagnosis flow and minimal card reveal.

## ALT V7
See `UPDATE_V7.md` for smooth RX transitions, custom scrollbars, hidden database UI, and randomized Genome Atlas sampling.


## V14
Seeded Mutation Chamber + Genome Engine V3. See `UPDATE_V14.md`.


## ALT V42 - Mobile parity

Mobile Random Movie Picker 3000, guestbook video incident, curated Top 500 RX, richer dossier, shared Experiment Archive, Atlas touch controls and improved mobile typography. See UPDATE_V42.md.

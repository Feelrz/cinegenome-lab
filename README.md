# CINEGENOME LAB v2

Interactive **movie DNA laboratory** built with plain HTML, CSS and JavaScript.

## New in v2

- **Today's Prescription** — a one-film-per-day cinematic diagnosis presented as a ritual/tarot specimen card.
- **500-title curated prescription pool** — snapshot membership from Letterboxd's official Top 500 list dated 2026-09-22. Ranking numbers are deliberately not shown or used in the UI.
- **Film dossier** — click `OPEN DOSSIER` to see poster, synopsis, metadata and the CINEGENOME DNA vector.
- **TMDB connection** — poster + overview + canonical metadata can be resolved from TMDB.
- **Automatic DNA generator** — imported TMDB metadata is converted to the 12 CINEGENOME dimensions with a deterministic rule-based scoring engine.
- **Batch Top-500 builder** — `scripts/build-top500.mjs` resolves all 500 bundled titles through TMDB and generates `data/top500-enriched.js` / `.json`.
- **Production proxy example** — `api/tmdb.js` keeps the TMDB token on the server for a public deployment.

The original modules remain:

- Specimen Scanner
- Crossbreed Reactor
- Mutation Chamber
- Genome Atlas
- Specimen Database
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

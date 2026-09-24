# TMDB setup for the public CINEGENOME build

This build is proxy-only. Do not put your TMDB credential into frontend JavaScript or commit it to GitHub.

## Vercel

1. Open the CINEGENOME project in Vercel.
2. Settings -> Environment Variables.
3. Add `TMDB_API_KEY` and paste your TMDB v3 API key as the value.
4. Enable Production and Preview (Development too if desired).
5. Save and redeploy.
6. Open the site -> `TMDB CONNECTION` -> `TEST SERVER LINK`.

When the status reads `TMDB SERVER LINK ONLINE`, poster, synopsis, runtime, genres, director, and keyword enrichment can be loaded through `/api/tmdb`.

The secret is intentionally not included in this repository/ZIP.

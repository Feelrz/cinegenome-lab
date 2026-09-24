# CineGenome DNA Engine V3

The 500-title source list supplies title/year membership only. DNA is CineGenome model output, not a Letterboxd or TMDB score.

V3 improves evidence weighting by using TMDB metadata when available: genres, keywords, synopsis, runtime, director, and signal interactions. Confidence is stored separately. A film that has not yet been resolved through TMDB remains a low-confidence provisional profile rather than pretending to be fully measured.

To generate the full 500-film enriched dataset locally:

```bash
TMDB_API_KEY=YOUR_KEY node scripts/build-top500.mjs
```

The script writes `data/top500-enriched.json` and `data/top500-enriched.js`. Do not commit your API key.

# FILMPRINT Product Audit — Beta 29

## Recommended fixed question count: 30

CineGenome currently models 15 human taste axes. A professional fixed-form design benefits from at least two complementary signals per axis so that one wording does not dominate the result and contradictory responses can reduce confidence. That naturally produces 30 questions.

### Why not 20–24 fixed questions?
The experience would be faster, but several axes would have only one item. A single ambiguous answer would then have disproportionate influence, and the existing direct/reverse coherence logic would become uneven across axes.

### Why not 36–45 questions?
Extra items would improve redundancy only modestly for this entertainment/product context while making the assay feel more like a survey. The additional completion cost is more noticeable than the likely gain for a 250–500 film candidate pool.

### Best future shorter mode
If completion data later shows meaningful drop-off, use 24 core questions followed by 0–6 deterministic adaptive questions targeted only at low-confidence or contradictory axes. That can feel shorter for decisive users while preserving a maximum 30-signal ceiling. It should be a separate engine revision because variable question IDs must also be versioned in Genome Keys.

## Result-layer audit

### Keep
1. Closest Specimen — the primary payoff.
2. Why This Film? — explains the match in human language.
3. Connection Route — makes the same film meaningfully different for different users.
4. DNA Viewer — transparent evidence and comparison surface.
5. Near Mutations — useful alternate results rather than decorative filler.
6. Genome Key / Compare — social utility.
7. Export — useful sharing utility, but collapsed by default.
8. Retest — necessary control.

### Remove from visible result
- Film Specimen Bio — describes the film but duplicates information already available in the film-facing DNA and Why This Film.
- Cinematic Diagnosis — overlaps with the user DNA profile and Connection Route.
- The Friction — useful analytically, but the Overlay already exposes mismatches more clearly and with less copy.

The goal is a result page that reads in one clear sequence: **result → reason → personal route → evidence → alternatives → share/compare**.

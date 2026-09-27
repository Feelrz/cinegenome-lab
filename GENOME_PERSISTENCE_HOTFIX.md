# CineGenome V5.0 FINAL — Genome Persistence Hotfix

## Bug clarified
`RETEST DNA` does not delete a short genome share key on the server. The previous UI mapped any HTTP 404 from `/api/genome` to `SHARE KEY NOT FOUND OR EXPIRED`, which made a missing record/store mismatch look like an expiry event.

## Changes
- Short share keys are now verified by an immediate read-back before the UI marks them `READY TO SHARE`.
- If a self-generated short key disappears from the active remote share store, the same browser can recover the original 30 Filmprint answers from the existing local share-key cache and continue DNA Crosscheck.
- Crosscheck labels a recovered result as `LOCAL RECOVERY`.
- 404 copy no longer claims the key expired. It explains that the key is missing from the active share store and that RETEST DNA did not delete it.
- No change to the 365-day server TTL, Filmprint scoring, DNA Sync math, specimen matching, or Crossbreed/Mutation systems.

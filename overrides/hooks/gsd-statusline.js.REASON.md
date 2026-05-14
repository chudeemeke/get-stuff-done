# Override: hooks/gsd-statusline.js

## Why
Enhanced context usage bar with autocompact-relative scaling. Our version computes context proximity as a percentage of the distance to Claude Code's autocompact threshold (~16.5%), giving a more accurate "how close am I to compaction" signal than the raw remaining percentage upstream uses.

## Upstream snapshot
- Version: 1.39.1
- SHA-256: 50008bc73692eff0fb9f60da17f08a0a3aaa7234b355ee1dec02108aabbac3fd

## What's different
- Autocompact-relative context bar (0% = fresh, 100% = compaction imminent)
- Reads `gsd.role` from config for consumer/maintainer display
- Fork branding in output
- Detailed formula comments explaining the scaling math

### Phase 43 UPGRADE-07 fold candidates (deferred per RESEARCH.md §8 Q3; review-trigger condition partially MET)
Six upstream commits touched this file in v1.34.2..v1.39.1; three are override-relevant:

- **#2219 (53078d3f) — autocompact scaling adopted upstream:** Upstream now reads `CLAUDE_CODE_AUTO_COMPACT_WINDOW` env var to compute the same autocompact-relative scaling the fork's override implemented manually. **The Review trigger condition below is partially met.** UPGRADE-07 should cherry-pick upstream's env-var-based scaling (richer than fork's hardcoded ~16.5% buffer) and retire the fork's custom math.
- **#1990 (cc04baa5) — GSD milestone/phase/status surfacing:** Upstream now surfaces GSD state when no active todo. Related to (but more sophisticated than) fork's "fork branding" line. UPGRADE-07 should reconcile.
- **#2884 (8fc1fa26) — phase-lifecycle scenes:** Upstream now renders phase-aware status scenes (`active_phase` / `next_action` / `next_phases` from STATE.md frontmatter). Override doesn't have this; fold during UPGRADE-07.

Three are not override-relevant: #2594 (last:/cmd opt-in suffix), #2460 (chmod fix), #2162 (stale-hooks warning).

Per A-12 the override-rewrite work is Wave 5's job — Wave 2 only refreshed the snapshot. Wave 5's disposition is REWRITE not DELETE: keep fork's `gsd.role` consumer/maintainer routing + branding intent, but cherry-pick #2219's env-var scaling.

## Review trigger
When upstream hooks/gsd-statusline.js changes, review whether upstream adopted similar scaling.
If upstream's context bar becomes threshold-relative, this override may no longer be needed.

**Status 2026-05-15:** review-trigger condition PARTIALLY MET — upstream adopted env-var-based scaling in #2219 (v1.38.x). Override remains warranted only for fork-specific branding and `gsd.role` routing. REWRITE during Wave 5 (per A-12) will retire the custom-scaling math.

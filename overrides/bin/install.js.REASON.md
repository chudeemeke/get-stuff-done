# Override: bin/install.js

## Why
Memory-nexus recovery exposed a Codex global install crash after upstream copied files and wrote VERSION. `installCodexConfig` can pass `null` frontmatter into `extractFrontmatterField`, which then calls `.match` and aborts the installer after mutation.

## Upstream snapshot
- Version: 1.9.1
- SHA-256: aa776a525a21eebf30ce0ee176b360ccb30ae9522e1c0c37f982c88509877bde
- Semantic SHA-256: 4bbcd0f95c08f948b86e024ddc3a1db0a65b0da0fead6a6f1079eec2b6523603

## What's different
- Treats missing or malformed YAML frontmatter as an absent field in `extractFrontmatterField`.
- Preserves filename fallback behavior for Codex agent metadata instead of crashing during TOML generation.

## Review trigger
When upstream `bin/install.js` changes, check whether Open GSD natively handles absent agent frontmatter in Codex config generation and remove this override once upstream behavior covers the case.

## Bump review 2026-08-30 (1.6.1 -> 1.7.0)

Reviewed 2026-08-30 for the 1.6.1 -> 1.7.0 bump: upstream extractFrontmatterField STILL calls .match() on unguarded input, so the override remains required. Rebased as pure 1.7.0 base + the null guard (the previous file carried a pre-1.6.1 vintage base). Companion fix: upstream 1.7.0 writes a .gsd-source marker (#1477) outside the manifest and never removes it on uninstall; the fork wrapper (bin/install.js metadata cleanup list) now removes it. Upstream-contribution candidates: the null guard and the uninstall marker removal.

## Bump review 2026-08-30 (1.7.0 -> 1.8.0)

Reviewed 2026-08-30 for 1.7.0 -> 1.8.0: upstream shipped a large installer
revision (#2284 the bulk, plus #2305/#2310/#2322/#2278/#2393 and ADR-2310) —
all adopted intact via the pure-1.8.0 base. Verified against the 1.8.0 file:
extractFrontmatterField (line 2434) STILL calls .match() unguarded, and
uninstall STILL never removes the .gsd-source marker it writes (line 10630) —
both fork deltas remain required. Rebuilt as pure 1.8.0 base + the null guard
+ the uninstall marker removal. Both remain upstream-contribution candidates.

## Bump review 2026-09-05 (1.8.0 -> 1.9.1)

Forward-port from the exact 1.9.1 base. See `.planning/evidence/bump-1.9.1-port.md` for per-file disposition and candidate evidence. Base hashes do not independently prove behavior.

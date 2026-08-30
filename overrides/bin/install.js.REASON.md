# Override: bin/install.js

## Why
Memory-nexus recovery exposed a Codex global install crash after upstream copied files and wrote VERSION. `installCodexConfig` can pass `null` frontmatter into `extractFrontmatterField`, which then calls `.match` and aborts the installer after mutation.

## Upstream snapshot
- Version: 1.7.0
- SHA-256: 4fdbc40ae3951e98bc1bcb0ed966c80e7f33875bbed5928f3daa264a229a6030
- Semantic SHA-256: c36f2c6dfed687c96d0ee639b6b15350397eb9d21ba8e30a658f16e5ad085aa8

## What's different
- Treats missing or malformed YAML frontmatter as an absent field in `extractFrontmatterField`.
- Preserves filename fallback behavior for Codex agent metadata instead of crashing during TOML generation.

## Review trigger
When upstream `bin/install.js` changes, check whether Open GSD natively handles absent agent frontmatter in Codex config generation and remove this override once upstream behavior covers the case.

## Bump review 2026-08-30 (1.6.1 -> 1.7.0)

Reviewed 2026-08-30 for the 1.6.1 -> 1.7.0 bump: upstream extractFrontmatterField STILL calls .match() on unguarded input, so the override remains required. Rebased as pure 1.7.0 base + the null guard (the previous file carried a pre-1.6.1 vintage base). Companion fix: upstream 1.7.0 writes a .gsd-source marker (#1477) outside the manifest and never removes it on uninstall; the fork wrapper (bin/install.js metadata cleanup list) now removes it. Upstream-contribution candidates: the null guard and the uninstall marker removal.

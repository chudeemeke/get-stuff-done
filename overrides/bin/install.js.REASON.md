# Override: bin/install.js

## Why
Memory-nexus recovery exposed a Codex global install crash after upstream copied files and wrote VERSION. `installCodexConfig` can pass `null` frontmatter into `extractFrontmatterField`, which then calls `.match` and aborts the installer after mutation.

## Upstream snapshot
- Version: 1.5.0
- SHA-256: 054a9051ee6bf07d1783fabf63faa91e4278f9a86dce1b8f7bb4ab476f361823
- Semantic SHA-256: fedaac1f39c85f704272b678752b2dd2f4dc813fc518bd96a3100dba38ee5a65

## What's different
- Treats missing or malformed YAML frontmatter as an absent field in `extractFrontmatterField`.
- Preserves filename fallback behavior for Codex agent metadata instead of crashing during TOML generation.

## Review trigger
When upstream `bin/install.js` changes, check whether Open GSD natively handles absent agent frontmatter in Codex config generation and remove this override once upstream behavior covers the case.

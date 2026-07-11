# Override: bin/install.js

## Why
Memory-nexus recovery exposed a Codex global install crash after upstream copied files and wrote VERSION. `installCodexConfig` can pass `null` frontmatter into `extractFrontmatterField`, which then calls `.match` and aborts the installer after mutation.

## Upstream snapshot
- Version: 1.6.1
- SHA-256: a74dae2ae714ae19c26d350ebfd28011d3f6540e090d59e0617d2c102a35c670
- Semantic SHA-256: 90fc4ee6ce384e8adc671ea91e9e4db4ece6f80c3ab85e74e472171110abe043

## What's different
- Treats missing or malformed YAML frontmatter as an absent field in `extractFrontmatterField`.
- Preserves filename fallback behavior for Codex agent metadata instead of crashing during TOML generation.

## Review trigger
When upstream `bin/install.js` changes, check whether Open GSD natively handles absent agent frontmatter in Codex config generation and remove this override once upstream behavior covers the case.

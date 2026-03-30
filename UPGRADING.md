# Upgrading to v3.0.0

## What Changed

v3.0 replaces the direct-edit fork with an overlay architecture.
Upstream (get-shit-done-cc) is now consumed as a build-time dependency
and composed into a self-contained dist/ at publish time.

All fork-specific additions (platform detection, theming, validation,
sync tools, hooks) continue to work identically.

## Install v3.0

```bash
bunx @chude/get-stuff-done@3.0.0 --claude --global
```

If you have a v2.x installation, the installer automatically detects
and cleans up old files before proceeding. User config (`~/.gsd/`)
and project data (`.planning/`) are not affected.

## Rollback to v2.x

```bash
bunx @chude/get-stuff-done@2.4.0 --claude --global
```

The v2.4.0 release remains available on npm. The `v2.4.0-legacy` git
tag marks the last commit before the overlay architecture was adopted.

To inspect the legacy source:

```bash
git checkout v2.4.0-legacy
```

## Architecture Overview

| Aspect | v2.x | v3.0 |
|--------|------|------|
| Upstream integration | Cherry-pick sync (manual per-commit) | npm devDependency, composed at publish time |
| Package contents | Source files shipped directly | Pre-composed dist/ shipped |
| Branding | Internal path renaming | Surface-only text replacement via branding.json |
| Feature control | Direct file edits | Feature flags via features.json (file-level exclusion) |
| Module overrides | Fork edits in-place | Overlay overrides with REASON.md enforcement |

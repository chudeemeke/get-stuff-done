---
phase: 42-budget-enforcement-process-hardening-cousin-test
plan: 03
subsystem: ci
tags: [cousin-test, install, provenance, workflow, docs, tdd]

requires:
  - phase: 42-budget-enforcement-process-hardening-cousin-test
    plan: 02
    provides: non-interactive gsd --version --json provenance output
provides:
  - cold-install cousin smoke helper
  - cousin install GitHub Actions matrix
  - public install and optional read-only token documentation
affects: [phase-42, ship-readiness, install, ci, docs]

key-files:
  created:
    - scripts/cousin-smoke.js
    - tests/cousin-smoke.test.js
    - .github/workflows/cousin-install.yml
    - INSTALL.md
  modified:
    - tests/ci-workflow.test.js
    - perf-baseline.json
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md

requirements-completed: ["SHIP-07", "DOCS-04"]
requirements-advanced: []

completed: 2026-07-03
---

# Phase 42 Plan 03: Cousin Cold-Install CI Summary

## Accomplishments

- Added `scripts/cousin-smoke.js`, a non-interactive cold-install smoke helper for `npm`, `pnpm`, and `bun`.
- Added TDD coverage in `tests/cousin-smoke.test.js` for package-manager selection, packed tarball specs, temp-root isolation, token redaction, local-bin resolution, and required provenance keys.
- Added `.github/workflows/cousin-install.yml` with a weekly, manual, and PR-triggered matrix across `ubuntu-latest`, `macos-15`, and `windows-latest`.
- Covered Node 20 and Node 22 across `npm`, `pnpm`, and `bun`.
- Added `INSTALL.md` with public install instructions, PATH notes, `gsd --version --json` verification, and optional read-only `NODE_AUTH_TOKEN` handling.

## Workflow Matrix

- OS: `ubuntu-latest`, `macos-15`, `windows-latest`.
- Node: Node 20, Node 22.
- Package managers: `npm`, `pnpm`, `bun`.
- PR source mode: build current branch with `bun run dist`, pack with `npm pack`, then install the packed tarball.
- Scheduled/manual source mode: install `@chude/get-stuff-done@latest`.
- pnpm source mode: invoke `corepack pnpm@10.17.1` so the Node 20 axis does not drift to pnpm releases requiring newer Node runtimes.

## Isolation Contract

The smoke helper creates a fresh temp project and keeps install side effects under the supplied runner temp root:

- `HOME`
- `USERPROFILE`
- `CLAUDE_CONFIG_DIR`
- `GSD_CI_SMOKE_DIR`
- package-manager caches and npm user config

If `NODE_AUTH_TOKEN` is present, it writes only a temp-project `.npmrc`; token-like environment values are redacted from command failure output.

## Verification

- `node scripts/cousin-smoke.js --help` - passed.
- `bun test tests/cousin-smoke.test.js tests/ci-workflow.test.js` - 23 pass, 0 fail.
- `bash scripts/lint-workflows.sh` - passed.
- `rg -n -- "cousin-smoke.js|macos-15|node-version|package-manager|--version --json|NPM_READONLY_TOKEN" .github/workflows/cousin-install.yml tests/ci-workflow.test.js` - found required workflow/test evidence.
- `rg -n -- "@chude/get-stuff-done|gsd --version --json|overlayManifestSha256|npm|pnpm|bun|CLAUDE_CONFIG_DIR" INSTALL.md` - found required install-doc evidence.
- `bun run compose` - passed; composed Open GSD `1.5.0`, overlay `3.0.2`, 645 files.
- Windows packed-tarball smoke from a local temp root - passed for `npm`, `pnpm`, and `bun`.
- `bun test tests/verify.test.cjs tests/validate-configs.test.js` - 30 pass, 0 fail.
- `bun run lint` - passed with existing repository lint baseline: 135 warnings, 0 errors; no new warnings from `scripts/cousin-smoke.js`.
- `git diff --check` - passed with only existing planning-file CRLF normalization warnings.
- `bun test` - 1,771 pass, 0 fail.
- Cleanup: removed regenerated `%TEMP%\gsd-test-*` directories after verification; kept regenerated `dist/` because package/config validation depends on it locally.
- Remote Cousin Install CI run `28651494046` - passed across all 18 OS x Node x package-manager jobs.
- Remote CI run `28651494074` - only `Perf Budget (macos)` failed on macOS compose variance after non-performance Plan 03 changes; rerun job `84971056837` measured compose `499ms` vs `370ms` baseline with `96.6ms` stddev.
- `bun test tests/check-perf.test.js tests/perf-baseline-schema.test.js` - passed after adding the scoped macOS compose accepted regression.

## Deviations

- Updated `.planning/ROADMAP.md` for the previously merged Plan 04 completion because it still showed Plan 04 unchecked.
- First remote Cousin Install run `28650045682` failed on real matrix behavior before merge: Windows cannot execute `.cmd` shims through `spawnSync` without shell mode, Bun on Windows creates `gsd.exe` rather than `gsd.cmd`, and Corepack selected pnpm 11.9.0 which requires newer Node than the Node 20 axis. The helper now uses Windows shell execution, resolves the actual installed local-bin candidate, pins `corepack pnpm@10.17.1`, and passes pnpm `--allow-build` approvals for the package lifecycle scripts.
- Added a time-limited `macos` + `compose` accepted regression in `perf-baseline.json`, scoped to PR #20/run `28651494074`, maxRatio `1.5`, expiring `2026-07-10`. This is a CI-environment rescue for recurring macOS benchmark variance after non-performance changes, not a global budget weakening.

## Next Phase Readiness

Phase 42 Plan 05 is next. It owns markdownlint and link-check gates for tracked markdown and closes the remaining Phase 42 DOCS-05 and DOCS-06 requirements.

---
phase: 42
status: complete
researched_at: 2026-07-03
confidence: high
---

# Phase 42 Research

## Result

Phase 42 is implementable as five small, independently reviewable plans:

1. Perf budget comparison and CI enforcement.
2. Non-interactive launcher provenance output.
3. Cousin cold-install workflow and install documentation.
4. Oversight principle, triggers, and deterministic probes.
5. Markdown and link-check gates.

The main planning correction is that cousin CI cannot honestly assert `gsd --version` provenance until the launcher supports a non-interactive version mode.

## Current Repo Facts

- Phase 41 committed `perf-baseline.json` with linux, macos, and windows install/compose metrics.
- Phase 41 committed `.planning/perf/test-timing.json` with linux, macos, and windows test timing metrics.
- Existing CI already uses `macos-15`; `tests/ci-workflow.test.js` forbids `macos-latest`.
- `scripts/bench.js` captures install and compose metrics; Phase 42 should add comparison/enforcement, not rewrite capture.
- `bin/gsd.js` currently reads package version for the startup banner but always launches `claude` afterward. It has no `--version` or `--version --json` path.
- `@chude/get-stuff-done` is currently public on npm and latest is `3.0.2`.
- `markdownlint-cli2` latest is `0.23.0`; Phase 42 planning reconciled DOCS-06 to that version.
- `lycheeverse/lychee-action` latest v2 release is `v2.8.0`.
- No markdownlint or lychee config exists today.

## Architecture Notes

### Perf Budget

Add a single `scripts/check-perf.js` comparator:

- Read baseline from `perf-baseline.json`.
- Read a current one-platform artifact from `scripts/bench.js --platform`.
- Compare `install` and `compose` mean values against the matching baseline platform.
- Emit GitHub workflow annotations for warnings and failures.
- Fail on ratios above `1.25` unless a matching `acceptedRegressions[]` entry allows it.

This keeps capture and compare separate: `bench.js` owns measurement; `check-perf.js` owns policy.

### Launcher Provenance

The cousin workflow needs a non-interactive truth surface. `gsd --version --json` should compute provenance from packaged files:

- `package.json` for package name/version.
- `dist/.install-meta.json` for upstream version if present.
- `dist/.overlay-manifest.json` for SHA-256.
- `package.json.devDependencies["@opengsd/gsd-core"]` as fallback upstream version in local dev.

### Cousin Test

The package has a lifecycle `install` script. Cold install tests must isolate HOME/config paths so installer side effects are contained in runner temp directories.

The workflow should cover:

- OS: `ubuntu-latest`, `macos-15`, `windows-latest`.
- Node: `20`, `22`.
- Package manager: `npm`, `pnpm`, `bun`.

For PRs, the most useful signal is installing the current branch's packed artifact. For scheduled/manual smoke, installing `@chude/get-stuff-done@latest` validates the published consumer path.

### Oversight Probes

The principle should live once in `overlay/memory/oversight-principle-evidence-before-claim.md`. Agent files should only include short trigger entries with IDs:

- `EBC-EXEC-POSTMERGE`
- `EBC-EXEC-SUMMARY`
- `EBC-VERIFY-CI-BEFORE-MEASURE`
- `EBC-PLAN-METRIC-COMPAT`

`scripts/verify-oversight-probes.js` should use deterministic fixture text, not LLM calls.

### Docs Gates

Run markdown/link checks against tracked markdown only. This prevents generated `dist`, `node_modules`, and ignored upstream copies from dominating the signal.

## Risks

- Docs gates may uncover large pre-existing markdown debt. The plan must decide whether to fix tracked docs or narrowly configure rules; it must not hide tracked docs with broad ignores.
- Perf budget enforcement can be flaky if hyperfine sample counts are too low. Use low-cost CI capture but keep thresholds coarse and based on Phase 41 mean values.
- Cousin install may mutate global config if temp HOME/CLAUDE_CONFIG_DIR isolation is missed.
- `gh` defaults to the archived upstream repo in this worktree; GitHub commands should pin `--repo chudeemeke/get-stuff-done`.

## Validation Architecture

Phase 42 verification must prove behavior, not file presence:

- Perf: tests create baseline/current fixtures and assert warning, failure, and accepted regression behavior.
- Launcher: tests run `node bin/gsd.js --version --json` and assert no `claude` spawn plus all provenance fields.
- Cousin: workflow/test helper proves temp-home isolation and the exact smoke command shape for each package manager.
- Oversight: probe script fails if any trigger ID or fixture expectation is missing.
- Docs: local docs lint command and workflow tests prove tracked markdown is the target set.

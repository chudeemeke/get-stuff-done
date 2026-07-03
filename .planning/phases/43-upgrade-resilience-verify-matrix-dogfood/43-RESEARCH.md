# Phase 43: Upgrade Resilience - Research

**Date:** 2026-07-03
**Status:** Research complete

## Research Question

What do we need to know to plan Phase 43 well?

Phase 43 must prove that an Open GSD upstream bump is routine, reviewed, and
recoverable. The work spans install safety, local registry upgrade simulation,
historical compatibility coverage, semantic override staleness, hook override
reconciliation, override churn reporting, SBOM output, and a live dogfood bump.

## Current Repo Shape

The repo already has the right architectural seams:

- `scripts/lib/upstream-source.js` is the active upstream authority port.
- `scripts/compose.js` owns the clean `dist/` composition pipeline and writes
  `.install-meta.json` plus `.overlay-manifest.json`.
- `scripts/finalize-dist.js` owns the final deployment shaping step after build.
- `scripts/check-overrides.js` is the blocking override gate and currently uses
  byte-for-byte SHA-256 comparison for every override.
- `bin/install.js` delegates to upstream install logic, then layers overlay
  files, metadata, statusline setup, and orphan cleanup.
- CI already separates docs, audit, test, perf, parity, upstream-compat,
  boundary, and override jobs. Phase 43 should add targeted jobs instead of
  overloading existing gates.

## External Evidence

### Open GSD Version State

Live npm/GitHub checks on 2026-07-03 showed:

- Current fork pin: `@opengsd/gsd-core@1.5.0`.
- Current stable npm latest: `1.6.1`.
- Current npm next: `1.7.0-rc.2`.
- Stable candidate set for N=3 matrix: `1.5.0`, `1.6.0`, `1.6.1`.

Planning consequence: use exact stable pins only. Do not write `latest`, `next`,
semver ranges, or prerelease tags into authority or matrix state.

### Verdaccio

Context7 official Verdaccio docs confirm:

- Docker can run a local registry with port `4873`.
- npm clients can use a one-shot registry via `NPM_CONFIG_REGISTRY`.
- publishing/installing can target a registry with `--registry`.

Planning consequence: build `verify-upgrade` around temp directories and a
Linux Verdaccio service/container. Do not mutate the operator's global npm, Bun,
Claude, Codex, or GSD configuration.

### CycloneDX

Context7 CycloneDX Node module docs confirm:

- `@cyclonedx/cyclonedx-npm` can generate JSON SBOM output with
  `--output-format JSON --output-file <path>`.
- The tool can use `node_modules` or npm lock data depending on project setup.

Live npm metadata on 2026-07-03 showed `@cyclonedx/cyclonedx-npm` latest is
`5.0.0`, but requirement `SHIP-03` explicitly names `4.2.1`.

Planning consequence: pin `@cyclonedx/cyclonedx-npm@4.2.1` unless a later
requirements review deliberately changes `SHIP-03`. This repo has `bun.lock`
but no committed `package-lock.json`, so the implementation must verify SBOM
generation after `bun install` from `node_modules`, or explicitly create any
npm lock artifact it depends on without introducing untracked drift.

### JavaScript Semantic Comparison

Context7 Acorn docs confirm:

- `acorn.parse(source, { ecmaVersion, sourceType })` returns an ESTree AST.
- Comments and whitespace are not semantic AST nodes unless collected through
  callbacks.
- `sourceType` can be `script`, `module`, or `commonjs`.

Live npm metadata on 2026-07-03 showed `acorn` latest is `8.17.0`.

Planning consequence: add a small semantic comparison boundary for `.js`
override sources, likely backed by `acorn@8.17.0`. Keep
`scripts/check-overrides.js` as the policy CLI facade and isolate parser logic
in a helper that can fall back to byte-hash behavior on parse errors.

### Open GSD 1.6.1 Hook Inspection

Temp-isolated `npm pack @opengsd/gsd-core@1.6.1` inspection found:

- `hooks/gsd-check-update-worker.js` and `hooks/dist/gsd-check-update-worker.js`
  are present.
- `hooks/dist/gsd-check-update.js` contains `detectConfigDir`, a shared
  `$HOME/.cache/gsd` cache path, and package-identity cache file wiring.
- `hooks/dist/gsd-statusline.js` contains phase-lifecycle fields:
  `active_phase`, `next_action`, `next_phases`, completed/total progress, and
  autocompact scaling via `CLAUDE_CODE_AUTO_COMPACT_WINDOW`.

Planning consequence: UPGRADE-07 is a rewrite/reconciliation, not a snapshot
refresh. The fork must preserve package identity, role routing, commit
classification, and throttle policy while adopting upstream's useful hook
structure and statusline state handling.

## Implementation Strategy

Phase 43 should be split into six plans:

1. **Upgrade verifier and install transaction safety**
   - Add `scripts/verify-upgrade.js`.
   - Add structured JSON report output.
   - Add temp-isolated install/reinstall target handling.
   - Harden installer preflight/transaction/rollback enough that partial state
     is reported and recoverable instead of merely warned.
   - Add Linux Verdaccio CI wiring on schedule and path-relevant changes.

2. **Vetted upstream matrix**
   - Add `.planning/vetted-upstream-versions.json` with exactly three entries.
   - Add a runner that expands from that file.
   - Keep current pinned version blocking; keep historical versions
     informational unless explicitly promoted.
   - Automate prune-oldest-on-bump behavior.

3. **Semantic override staleness for JavaScript**
   - Add an AST/canonical comparison port for `.js` override upstream sources.
   - Preserve byte-hash behavior for non-JS files and parse failures.
   - Add fixtures for comment-only, whitespace-only, and semantic JS changes.
   - Document `.md` semantic diff as v1.3.0 deferred work.

4. **Hook override reconciliation**
   - Reconcile `overrides/hooks/gsd-check-update.js` and
     `overrides/hooks/gsd-statusline.js` atomically.
   - Add `gsd-check-update-worker.js` if preserving the upstream split is the
     cleanest way to keep responsibilities separated.
   - Update both REASON files with `1.6.1` snapshots after review.

5. **Override churn and SBOM**
   - Add a deterministic override-churn generator and CHANGELOG insertion point.
   - Add SBOM generation between compose and finalize-dist.
   - Ensure `dist/bom.json` is included by `package.json#files` and by the
     future release artifact path.

6. **Live dogfood bump**
   - Reverify npm/GitHub current state.
   - Bump from `1.5.0` to the current reviewed stable target, currently
     expected to be `1.6.1`.
   - Run the new verifier, matrix, semantic staleness, hook, churn, SBOM, test,
     lint, docs, and CI gates.
   - Record D-7 evidence in `MAINTENANCE.md`.

This ordering matters. The live bump must prove the gates, not discover that the
gates are missing.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Verdaccio tests mutate global npm config | Use temp npmrc/config/env only, and assert no global config command is used. |
| SBOM tool expects `package-lock.json` | Test against the repo's real `bun install` + `node_modules` state or add explicit npm lock generation as a controlled artifact. |
| Semantic comparator weakens the blocking gate | Restrict semantic pass to successfully parsed `.js`; keep byte-hash for non-JS and parse failures. |
| Hook reconciliation loses fork behavior | Add tests for package name, role routing, throttle, statusline branding, and phase lifecycle fields before rewrites. |
| Matrix becomes stale busywork | Make `.planning/vetted-upstream-versions.json` the only matrix source and automate prune-on-bump. |
| Dogfood bump grows beyond Phase 43 | Fail closed into documented follow-up instead of force-merging a brittle bump. |

## Validation Architecture

Use existing Bun and Node test infrastructure.

| Layer | Command | Purpose |
|-------|---------|---------|
| Focused verifier tests | `bun test tests/verify-upgrade.test.js` | Upgrade report schema, temp isolation, command orchestration, failure classification. |
| Installer safety tests | `bun test tests/installer-safety.test.js` | Transaction/preflight/rollback and no user-content deletion. |
| Matrix tests | `bun test tests/vetted-upstream-versions.test.js tests/run-upstream-compat-ci.test.js` | Exactly three versions, blocking current pin, informational historical behavior, prune-on-bump. |
| Override tests | `bun test tests/check-overrides.test.js tests/check-overrides-integration.test.js` | JS comment/whitespace non-alert and semantic-change alert. |
| Hook tests | `bun test tests/hooks.test.js tests/hooks-manifest.test.js` | Atomic check-update/statusline behavior and packaged hook manifest integrity. |
| Compose/package tests | `bun test tests/compose.test.js tests/package-launcher-v3.test.js` | `dist/bom.json` generation and package inclusion. |
| Workflow tests | `bun test tests/ci-workflow.test.js` | CI schedule/path/on-change wiring and artifact upload shape. |
| Full local gate | `bun run lint && bun test && bun run lint:docs && git diff --check` | Regression guard before PR. |

Manual-only validation should be limited to the live dogfood bump evidence:
PR number, target version, duration, gate outcomes, caught issues, and friction
recorded in `MAINTENANCE.md`.

## Research Decisions for Planning

- Plan with exact version pins.
- Do not use `latest` or prerelease tags as dependency truth.
- Prefer small CommonJS helpers over a new framework.
- Keep policy facades stable: `scripts/check-overrides.js`,
  `scripts/compose.js`, and `bin/install.js` should remain the user-facing
  entry points.
- Treat `.planning/vetted-upstream-versions.json` as maintainer/build-time
  truth, not runtime package truth.
- Keep Phase 44 publish/provenance/runbook polish out of Phase 43 unless a
  Phase 43 acceptance criterion directly requires a minimal hook.

## RESEARCH COMPLETE

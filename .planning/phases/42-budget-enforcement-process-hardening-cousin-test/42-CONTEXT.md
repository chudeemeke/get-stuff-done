---
phase: 42
status: ready-for-planning
gathered: 2026-07-03
source: "GSD context fallback from ROADMAP, REQUIREMENTS, Phase 41 verification, and targeted repo inspection"
requirements:
  - PERF-03
  - PERF-04
  - PERF-05
  - PROCESS-01
  - PROCESS-02
  - PROCESS-03
  - PROCESS-04
  - PROCESS-05
  - PROCESS-06
  - PROCESS-07
  - SHIP-07
  - DOCS-04
  - DOCS-05
  - DOCS-06
---

# Phase 42: Budget Enforcement, Process Hardening, Cousin-Test - Context

## Phase Boundary

Phase 42 turns Phase 41 evidence into enforcement. It must:

- Enforce performance budgets against the committed Phase 41 baselines.
- Consolidate evidence-before-claim oversight into one principle and four short triggers.
- Prove a never-touched-this-repo install path can run the published/package artifact.
- Add install documentation plus markdown/link gates.

Phase 42 must not implement Phase 43 upgrade resilience, Verdaccio, SBOM, publish provenance, or backlog 999.x unless a new explicit planning decision promotes that work.

## Locked Decisions

### D-42-01 - Measure before enforcing

Use `perf-baseline.json` and `.planning/perf/test-timing.json` from Phase 41 as the only initial budget baselines. Do not fabricate or hand-enter platform numbers.

### D-42-02 - Budget thresholds

Use the Phase 42 roadmap thresholds:

- warning when current mean is greater than `1.10x` baseline mean.
- failure when current mean is greater than `1.25x` baseline mean.
- compare per platform and per metric.

The minimum blocking metric is `compose`; `install` should also be compared because the baseline already captures it.

### D-42-03 - Accepted regression matching

Keep the existing required `acceptedRegressions[]` fields: `reason`, `reviewer`, `reviewedDate`, and `ticket`. Phase 42 may extend each entry with optional target fields such as `platform`, `metric`, `maxRatio`, and `expiresOn`, but the original four fields stay required and schema-validated.

### D-42-04 - macOS runner label

Use `macos-15`, not `macos-latest`. Phase 41 added a repository invariant that forbids `macos-latest` to avoid runner migration drift, and Phase 42 planning reconciled the roadmap and SHIP-07 requirement text accordingly.

### D-42-05 - Package install truth

`@chude/get-stuff-done` is currently public on npm at `3.0.2`. The cousin workflow should not require a secret for public install. It may support an optional read-only token for private registry scenarios, but no token should be required for the default path.

### D-42-06 - Non-interactive provenance output

Before cousin CI can assert install provenance, `gsd --version` must become non-interactive. It should not spawn `claude`. Add a machine-readable mode, preferably `gsd --version --json`, that includes:

- package name `@chude/get-stuff-done`.
- fork package version.
- upstream package name `@opengsd/gsd-core`.
- upstream version.
- overlay manifest SHA-256.

### D-42-07 - Docs gate scope

Markdown/link gates apply to tracked repository markdown files, not generated dependency copies. Do not lint or link-check ignored generated/dependency trees such as `node_modules`, `dist`, or `overlay/get-shit-done`.

### D-42-08 - External tool refresh

As of 2026-07-03:

- `markdownlint-cli2` latest is `0.23.0` (`npm view markdownlint-cli2 version`).
- `lycheeverse/lychee-action` latest v2 release is `v2.8.0`.
- `@chude/get-stuff-done` npm latest is `3.0.2`.

The older markdownlint-cli2 requirement was stale. Phase 42 planning reconciled DOCS-06 to `markdownlint-cli2@0.23.0`, matching the npm refresh on 2026-07-03.

### D-42-09 - No new top-level directories

Keep additions inside existing surfaces: `scripts/`, `tests/`, `.github/workflows/`, `config/`, `overlay/`, `.planning/`, and root documentation files such as `INSTALL.md`. Do not add new top-level directories.

### D-42-10 - Advisory, not blocking, oversight triggers

PROCESS-07 defines graduation criteria only. No oversight trigger graduates to blocking in v1.2.0.

## Canonical References

Downstream agents must read these before implementing:

- `.planning/ROADMAP.md` - Phase 42 goal, requirements, and success criteria.
- `.planning/REQUIREMENTS.md` - PERF, PROCESS, SHIP, and DOCS requirement text.
- `.planning/STATE.md` - current phase ordering and residual risks.
- `.planning/phases/41-foundation-flip-gate-install-audit-surface-windows-slo/41-VERIFICATION.md` - Phase 41 closure evidence and known residual risks.
- `perf-baseline.json` - install/compose baseline and accepted regression array.
- `.planning/perf/test-timing.json` - test timing baseline.
- `scripts/bench.js` - current benchmark capture helper.
- `.github/workflows/ci.yml` - existing CI patterns and runner labels.
- `tests/ci-workflow.test.js` - workflow invariants, including `macos-latest` prohibition.
- `overlay/agents/gsd-oversight-execution.md` - execution oversight trigger target.
- `overlay/agents/gsd-oversight-verification.md` - verification oversight trigger target.
- `overlay/agents/gsd-oversight-planning.md` - planning oversight trigger target.
- `bin/gsd.js` - launcher requiring non-interactive version/provenance support.
- `package.json` - package manager scripts, package file manifest, and npm package metadata.

## Deferred

- Backlog 999.1 plan-checker wave collision detection stays unpromoted.
- Backlog 999.2 config schema drift stays unpromoted.
- Phase 43 upgrade verification and dogfood bump stay out of Phase 42.
- Phase 44 publish provenance, SBOM, and final release polish stay out of Phase 42.

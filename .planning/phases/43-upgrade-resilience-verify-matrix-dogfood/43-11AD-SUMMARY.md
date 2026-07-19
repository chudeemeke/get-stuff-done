---
phase: 43
plan: "11AD"
wave: 19
status: complete
date: 2026-07-19
requirements: ["SHIP-03A", "SHIP-08"]
---

# Phase 43 Plan 11AD Summary - Bun Audit And CycloneDX Authority

## Outcome

Removed the release-blocking CycloneDX advisory through an exact direct upgrade
from `@cyclonedx/cyclonedx-npm` 4.2.1 to 6.0.0. `bun.lock` remains the sole
dependency graph, `audit-ci` is removed, no `package-lock.json` exists, and the
empty suppression ledger contains no CycloneDX exception.

The replacement audit gate consumes pinned Bun 1.3.5 JSON directly and fails
closed on runtime drift, tool or network failure, malformed JSON, schema drift,
missing or non-canonical advisory URLs, and exit-status/report disagreement.
HIGH and CRITICAL findings block; lower findings remain counted and visible.

## Audit Authority

- The no-shell adapter attests the repository-pinned Bun version before running
  `bun audit --json` and never emits child stdout or stderr on failures.
- Report, package, advisory, CWE, CVSS, field-count, and byte-count boundaries
  are closed against the observed Bun 1.3.5 schema.
- Canonical IDs are derived only from exact
  `https://github.com/advisories/GHSA-...` URLs using GitHub's GHSA alphabet.
- Suppressions require exact ID and severity matches, retain reviewer metadata
  in output, expire after their bounded review window, and reject duplicates.
- The live audit now reports seven moderate findings, zero HIGH/CRITICAL
  findings, zero suppressions, and no `GHSA-v75r-vx73-82pj`.

## SBOM Boundary

- Generator discovery permits only repository-local CycloneDX shims and has no
  `bunx` registry fallback.
- CycloneDX executes without a shell using the compatibility-spike-proven 6.0.0
  arguments, reproducible output, CLI schema validation, and application type.
- Output must remain below the selected project's `dist/` directory. Child
  failures are propagated without exposing child output.
- Post-generation validation requires CycloneDX 1.6, a positive document
  version, a valid package identity, and an application root matching
  `package.json` group, name, and version.
- Two real invocations produced byte-identical 1,033,978-byte BOMs with SHA-256
  `E9E9D98F34D93AFAAC091209AC5900CFE029316F34B9D3E54725DAC38D7658F9`.

## Coverage

The durable `test:coverage:phase43-audit-sbom` script runs the same portable
behavior suites under Node/c8 while Bun remains functional test authority. It
enforces 95% independently for every metric and every included file.

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `scripts/audit-check.js` | 98.71% | 95.97% | 100.00% | 98.71% |
| `scripts/generate-sbom.js` | 99.02% | 98.03% | 100.00% | 99.02% |

## Validation Evidence

- Focused Bun gate: 37/37 passed with 133 expectations.
- Focused Node/c8 gate: 37/37 passed; both files exceed every per-file 95%
  threshold.
- Compose/SBOM integration: 156/156 passed with 324 expectations.
- `bun run audit:ci`: passed with seven moderate findings and no blockers or
  suppressions.
- `bun run sbom`: passed twice with byte-identical CycloneDX 1.6 output.
- `bun run dist`: compose, build, SBOM, and finalize all passed; 740 files were
  composed and install metadata reports upstream 1.6.1 / overlay 3.0.2.
- Focused ESLint: zero errors and zero warnings.
- Broad suite: 1,498/1,499 passed. The sole failure is the pre-existing Plan
  11AE Windows harness failure: PowerShell cannot autoload
  `Microsoft.PowerShell.Security`, so `Get-Acl` fails before product execution.
  Its isolated rerun passed 39/40 with the same error.
- `git diff --check`: passed; only the existing `tests/compose.test.js` CRLF
  conversion notice was reported.

## GSD Closeout

- Plan structure: two complete tasks, no errors or warnings.
- Summary verifier: passed with both created test artifacts and both task
  commits present.
- Roadmap analyzer: Phase 43 is 19/50; portfolio progress is 41/72 (57%).
- Plan index: 50 plans across 46 waves; Plan 11AE is the next autonomous unit.
- Documentation lint: 381 primary and 58 secondary Markdown files, zero errors.
- Consistency: passed with the four pre-existing Phase 44, backlog-directory,
  and legacy Phase 40.5 frontmatter warnings.
- Legacy artifact/key-link helpers do not decode this plan's nested
  `must_haves`, and the reference helper treats npm scopes, generated artifact
  paths, and verification command text as file references. Direct artifact,
  command, and plan-structure checks remain authoritative for this closeout.
- Legacy `state-snapshot` again returned null fields because it recognizes the
  older bold-field STATE template rather than this repository's current
  frontmatter/body format. Roadmap analysis and direct STATE reads remain the
  recovery authority.

## Boundaries

This plan does not claim 100% broad-suite success, resolution of the Windows
DACL harness, a passed hosted envelope, release readiness, or Phase 43
completion. Plan 11AE owns the platform harness correction; Plans 11AF-11AI and
11AK remain required before owner-gated Plan 11AJ.

No workflow, npm authentication, registry credential, machine-global Bun
installation, public issue/comment, push, PR, hosted run, branch protection,
merge, release, credential, or live `authkey`, `remotely`, or `conversations`
state changed. Windows and WSL npm both resolved to the official npm registry
during execution, and no project `.npmrc` exists.

Generated `coverage/` and root `dist/` were verified as contained ordinary
directories with zero tracked files. Automated recursive deletion was blocked
before execution by the command safety layer, so both remain locally and are
not claimed clean. The hook/bin `dist` paths are reparse points and were left
untouched. All four surfaces are ignored or untracked and reproducible by the
recorded coverage and distribution commands.

## Task Commits

1. **RED audit/SBOM contracts:** `865e21d6` (`test`)
2. **GREEN dependency and adapters:** `7393a96b` (`feat`)

## Next

Execute Plan 11AE's cross-platform product, oracle, and harness corrections.
The first target is the independently reproduced Windows PowerShell security
module/DACL harness failure. No hosted or public action is authorized by this
closeout.

## Self-Check: PASSED

- Both plan tasks and acceptance criteria have direct local evidence.
- The vulnerable dependency and advisory are absent without suppression.
- The sole lock, audit, SBOM, distribution, coverage, and focused lint claims
  agree with the final implementation subject.
- The broad-suite limitation remains explicit, separately owned, and is not
  represented as Plan 11AD success.
- The next durable resume target is Plan 11AE.

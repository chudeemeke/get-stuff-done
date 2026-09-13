---
phase: 43
plan: "11AC"
wave: 18
status: complete
date: 2026-07-19
requirements: ["UPGRADE-04", "UPGRADE-05", "UPGRADE-09", "SHIP-08"]
---

# Phase 43 Plan 11AC Summary - Hosted And Toolchain Authority Repair

## Outcome

Implemented Fable decisions D1-D5 and made the bounded D6 extraction decision.
The hosted verifier now proves an exact pre-payload event subject against a
byte-pinned control program, while the toolchain verifier consumes one closed
per-workflow/per-job runtime map instead of inferred or blanket setup claims.

This plan defines verifier authority and receipt schemas only. It does not
claim that current hosted workflows emit or consume the receipts, that hosted
CI has passed, or that the whole job worktree remains immutable after payload
execution. Plans 11AH and 11AJ own those later claims.

## Authority Changes

- Toolchain manifest schema 3 declares every payload job as `bun`, `node`, or
  `both`; undeclared payloads, missing setup, extraneous setup, duplicate
  setup, and setup outside the exact declaration fail closed.
- Only the exact contract-injected checkout plus adjacent verification step is
  exempt from payload classification. Name, shell, environment, command,
  position, checkout input, and side-workspace drift become payload.
- Hosted contract schema 4 permits zero or one exact pinned
  `step-security/harden-runner` prelude, followed by one exact checkout and the
  adjacent subject verification. The sole checkout exception is Secret Scan
  `fetch-depth: 0`.
- Caller-supplied runtime evidence is named `local-runtime`; legacy `full` is
  rejected and `hosted-runtime` remains reserved until trusted receipt
  consumption exists.
- Closed Tier A runner and Tier B runtime receipt schemas bind identity to run
  ID, attempt, job, runner, platform, exact runtimes, tools, and container
  digests. Tier B authority covers the 21 declared runtime subjects.

## Coverage Seam

Kept Bun as the functional test authority and retained `node:test` for the
same two verifier suites under c8. `expect` is exact-pinned at `30.4.1`, c8 is
exact-pinned at `9.1.0`, Jest itself was not installed, and `bun.lock` remains
the sole dependency lock. The frozen c8 include list contains only the two
verifier entry modules and enforces 95% independently for statements,
branches, functions, and lines per file.

Latest Node coverage evidence:

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `scripts/verify-hosted-ci.js` | 98.42% | 96.55% | 98.38% | 98.42% |
| `scripts/verify-toolchain-authority.js` | 97.10% | 95.32% | 100.00% | 97.10% |

## D6 Disposition

Aborted the optional extraction after the mandated bounded inspection. A pure
move of only the named CLI and adapter functions would require circular
imports, new factories, or semantic shims because composition, containment,
sanitization, and private parser authority cross the proposed boundaries.
No cosmetic modules were created.

The durable disposition is
`43-11AC-D6-EXTRACTION-DISPOSITION-2026-07-19.md`. Phase 44 must complete the
policy/I/O separation before the first post-v1.2 feature changes either
verifier.

## Validation Evidence

- Focused Bun gate: 131/131 passed with 501 expectations.
- Node coverage gate: 118/118 passed; both files exceed every 95% threshold.
- Node syntax checks: both verifier entry modules passed.
- Focused ESLint: zero errors. The Plan 11AC changes add no warnings; 13 known
  warnings remain in existing bounded filesystem and dynamic-envelope paths.
- Documentation lint: 381 primary and 57 secondary Markdown files, zero
  errors.
- `git diff --check`: passed; Git reported only the existing CRLF conversion
  notices for `ROADMAP.md` and `tests/roadmap.test.cjs`.
- Broad suite: 1,470/1,471 passed. The sole failure is the already diagnosed
  protected-Windows-DACL harness defect owned by Plan 11AE.
- Legacy `audit:ci` remains red because it requires an absent
  `package-lock.json`. `bun audit` reports the eight existing findings (one
  high, seven moderate), led by CycloneDX 4.2.1; neither new coverage
  dependency appears in the finding paths. Plan 11AD owns the Bun-native audit
  authority and advisory remediation.

## GSD Closeout

- Plan structure: four complete tasks, no errors or warnings.
- Summary verifier: passed with all listed artifacts and commits present.
- Roadmap analyzer: Phase 43 is 18/50; portfolio progress is 40/72 (56%).
- Plan index: 50 plans across 46 waves; Plan 11AD is the next autonomous unit.
- Consistency: passed with four pre-existing Phase 44, backlog-directory, and
  legacy Phase 40.5 frontmatter warnings.
- Legacy `state-snapshot` returned null fields because it recognizes the older
  bold-field STATE template rather than this repository's current
  frontmatter/body format. Roadmap analysis and direct STATE reads remain the
  recovery authority; the parser mismatch is carried debt, not a successful
  Plan 11AC gate.

## Boundaries

No workflow, registry, npm authentication, machine-global Bun installation,
public issue/comment, push, PR, hosted run, branch protection, merge, release,
credential, or live `authkey`, `remotely`, or `conversations` state changed.
The generated `coverage/` directory is disposable and is removed after final
evidence inspection.

## Task Commits

1. **Fable corrective architecture:** `22d40da4` (`docs`)
2. **RED authority and coverage specification:** `51bd25e0` (`test`)
3. **GREEN verifier authority implementation:** `a4a7c02d` (`feat`)

The preceding classifier correction is preserved independently as `c9b20a9a`
(`fix`) because it repairs the GSD read model rather than Plan 11AC's verifier
behavior.

## Next

Execute Plan 11AD's CycloneDX 6 and Bun-lock-native audit correction. Plan 11AE
then owns the Windows ACL harness fix, followed by Plans 11AF-11AI and the
stable 1.7.0 upgrade in Plan 11AK. Owner-gated Plan 11AJ remains the first point
at which a push, hosted run, public mutation, or formal post-hosted Fable
checkpoint may be requested.

## Self-Check: PASSED

- Plan structure reports four complete tasks with no errors or warnings.
- Every listed implementation artifact and task commit exists.
- Focused behavior, per-file coverage, syntax, lint, documentation, and diff
  evidence agree with this summary.
- Broad-suite and audit red results remain explicit, separately owned, and are
  not represented as Plan 11AC success claims.
- The next durable resume target is Plan 11AD; no public or hosted gate was
  advanced.

---
phase: 43
plan: "11AF"
wave: 19
status: complete
date: 2026-07-19
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-09", "SHIP-08"]
---

# Phase 43 Plan 11AF Summary - Authenticated Upgrade Proof

## Outcome

Restored the real local upgrade verifier with an ephemeral authenticated
Verdaccio identity, isolated npm configuration, centralized redaction, and
fail-closed cleanup. The verifier keeps the full nine-step package lifecycle
and now proves exact target-upstream composition, exact installed provenance,
trusted executable selection, canonical filesystem containment, and new
artifact identity.

A pinned Verdaccio 6.8.0 lifecycle completed the exact `1.6.1 -> 1.7.0`
sequence. Anonymous publication was rejected, authenticated publication and
reinstallation passed, expected and observed smoke provenance matched, ambient
npm configuration remained byte-identical, and the owned registry process,
listener, storage, verifier roots, and temporary harness root were removed.

## Architecture And Security Boundaries

- The verifier is a worker, not a registry orchestrator. It accepts only a
  credential-free loopback HTTP endpoint and declares the required external
  disposable lifecycle in its report. Plan 11AH owns the reproducible hosted
  registry lifecycle.
- Identity bootstrap uses a bounded HTTP adapter and a crypto-random per-run
  user. The token is written only to an owned npm config and enters the
  redaction corpus before any observable operation.
- Child environments are constructed from an allowlist. Node, npm, and Bun are
  resolved once against the baseline environment, must be absolute and outside
  the project, and are invoked directly with `shell: false`.
- npm 11.6.4 prepare compatibility is gated on exact `prepare: husky` and uses
  an owned directory containing only static no-op `husky` shims. It does not
  expose source `node_modules/.bin` to outer executable resolution.
- Target materialization uses a minimal private manifest containing exact
  target Open GSD and exact Ajv versions. No source `NODE_PATH` fallback is
  permitted. Target package metadata must be a regular file, canonically inside
  workspace `node_modules`, with exact name and version before compose.
- Expected smoke provenance includes the SHA-256 of the composed workspace
  manifest. The installed package independently rehashes its manifest; exact
  expected, observed, and verified objects must match.
- Every packed artifact path is checked lexically and canonically, must be a
  regular file, must not reuse a pre-existing tarball, and must match exact
  filename and npm JSON package identity before its size and digest are trusted.

## TDD And Review Disposition

The implementation followed chronological RED and GREEN slices. The final RED
slice encoded five GPT-5.6-Sol blockers: source dependency fallback, unbound
smoke digest, prepare-path executable substitution, lexical-only temp
containment, and reusable artifact identity. The product revision corrected all
five before lifecycle evidence was refreshed.

Fable then independently reviewed the bound source and receipt and returned
`ACCEPT_WITH_FOLLOW_UPS`. Fable verified both source hashes against the receipt,
confirmed that post-receipt changes were evidence-only, and found all ten Plan
11AF truths proven. The authoritative review is
`43-FABLE-PLAN11AF-CURRENT-REVISION-REVIEW-2026-07-19.md`.

## Coverage

The dedicated Node/c8 command enforces each metric independently for
`scripts/verify-upgrade.js`.

| Statements | Branches | Functions | Lines |
| ---: | ---: | ---: | ---: |
| 99.42% | 95.10% | 100.00% | 99.42% |

The focused gate passed 54/54 tests. It includes negative coverage for identity
bootstrap, credential observability, config mutation, cleanup combinations,
canonical path aliases, target identity, baseline tool trust, artifact reuse,
and valid-but-wrong provenance digests.

## Validation Evidence

- Real local lifecycle: nine/nine steps passed against pinned Verdaccio 6.8.0;
  receipt schema 2 binds source `8d92a576`, verifier/test/report hashes, exact
  artifacts, and expected/observed/verified smoke provenance.
- Full suite: 1,552/1,552 passed across 58 files with 4,378 assertions.
- Distribution: compose, build, SBOM, and finalize passed; 740 files composed
  and 124 branding rules applied.
- Focused ESLint: zero errors and zero warnings.
- Repository ESLint: zero errors and 220 existing security-plugin warnings.
- Documentation lint: zero errors across both configured sets.
- Dependency policy: seven findings, zero blocking, zero suppressed.
- Gitleaks: the three implementation/evidence commits through `e9be7573` were
  scanned with no leaks.
- `git diff --check`: passed.

## Follow-Up Ownership

- Plan 11AH must correct `.github/workflows/upgrade-verifier.yml`, whose stale
  `1.5.0 -> 1.6.1` arguments would now correctly fail source-pin binding, and
  pin the floating Verdaccio service image to an immutable reviewed identity.
- Plan 11AH or later hygiene can preserve both root and terminal failure
  classifications and align reported smoke paths with exact execution paths.
- Plan 11AK retains the full root dependency/lockfile bump and Open GSD 1.7.0
  dogfood advance.
- Direct verifier spawns are shell-free. npm prepare and `bun run compose` are
  transitive tool-owned lifecycle boundaries and are not claimed otherwise.

## GSD Closeout

- Both tasks and every must-have truth have direct code, test, lifecycle, and
  review evidence.
- Plan structure and summary validation pass with two complete tasks, both
  required artifacts present, valid commit evidence, and a passed self-check.
- Plan 11AF is the twenty-first of fifty Phase 43 plans with a summary.
- Portfolio progress is 43/72 plans (60%).
- Plan 11AG is the next autonomous Wave 19 unit and owns paired same-run
  performance authority; Plan 11AH depends on its completion as well as 11AF.
- Plan 11R remains blocked because no passed exact-subject hosted envelope or
  formal post-hosted Fable checkpoint exists.
- Roadmap consistency passes with four pre-existing warnings for the future
  Phase 44 directory, two directory-less backlog phases, and legacy Phase 40.5
  frontmatter.
- Legacy artifact/key-link helpers do not decode nested `must_haves`; direct
  plan structure, summary, file, command, lifecycle, and roadmap checks remain
  the closeout authority.

## Boundaries

This closeout proves local Windows worker behavior and one owned local registry
lifecycle. It does not claim hosted Linux/container evidence, current hosted
workflow arguments, an immutable hosted registry image, full dogfood lockfile
advancement, release readiness, or Phase 43 completion.

No push, PR, hosted run, issue/comment mutation, merge, release, repository
visibility change, branch-protection change, credential change, package
publication, or live `authkey`, `remotely`, or `conversations` state changed.
The earlier user-level localhost npm redirect is not active: Windows and
WSL-invoked npm resolve to the public npm registry, and the lifecycle proved
that ambient config remained unchanged.

Generated coverage data and the temporary lifecycle harness were removed. The
root `dist` tree was regenerated successfully and produced no tracked diff.

## Task Commits

1. **RED authentication/isolation/proof contracts:** `a005b8be`, `af4335c9`,
   `ee5b10ca`
2. **GREEN authenticated and fail-closed verifier:** `adf9b4ae`, `3858de57`,
   `b1a374dc`, `d46992bc`, `828fb6fc`, `2e47ef2a`, `8d92a576`
3. **Cause, lifecycle, and review evidence:** `a6428be8`, `2fda50c0`,
   `e9be7573`, `6ea2e765`

## Self-Check: PASSED

- All ten required truths are locally proven.
- Every changed-product coverage metric independently exceeds 95%.
- Real package operations and cleanup passed against authenticated Verdaccio.
- Sol blockers are resolved and Fable accepted the corrective revision.
- Later-plan and owner-gated work remains explicit and unclaimed.
- The next durable resume target is Plan 11AG.

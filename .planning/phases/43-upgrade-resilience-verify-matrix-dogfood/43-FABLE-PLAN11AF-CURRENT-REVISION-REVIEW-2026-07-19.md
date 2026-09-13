# Fable Review: Phase 43 Plan 11AF Current Revision

Reviewer: Claude Fable 5, acting lead developer, architect, security reviewer,
and project designer.

Scope: `scripts/verify-upgrade.js` and tests at `8d92a576`, lifecycle receipt at
`e9be7573`, and review packet at `6ea2e765`. The review was read-only.

## Verdict: ACCEPT_WITH_FOLLOW_UPS

Plan 11AF is locally closure-ready as scoped. Fable found all ten required
truths proven by the implementation, tests, and hash-bound local receipt. The
follow-ups are later-plan or cosmetic work and do not invalidate Plan 11AF.

## Independent Binding Checks

- The verifier SHA-256 `14fbda4a...ce0f4` and test SHA-256
  `d981b256...1411` match the receipt exactly.
- Changes after the receipt-bound product revision are evidence and review
  documents only; the tested product source remains byte-identical.
- Receipt source `1.6.1` matches the checkout pin, and `prepare: husky` matches
  the narrow compatibility-shim precondition.
- Fable performed line-level review and binding checks but did not rerun the
  suites or local registry lifecycle in read-only plan mode.

## Required Truths

1. Ephemeral authenticated identity: proven through crypto-random identity
   bootstrap and the anonymous-publication rejection receipt.
2. Credential non-observability: proven through owned npm config, early secret
   registration, central report sanitization, canary tests, and Gitleaks.
3. Real operations: proven by all nine pack, publish, install, bump, compose,
   reinstall, and smoke operations against pinned Verdaccio 6.8.0.
4. Credential cleanup: proven by independent neutralize, unlink, and owned-root
   removal stages plus combined-failure tests.
5. Ambient npm config invariance: proven by kind, size, and SHA-256 snapshots,
   mutation negatives, and the lifecycle receipt.
6. Bootstrap rejection: proven to stop before package publication.
7. Bounded cleanup: proven on success, step failure, setup failure, and
   combined cleanup-failure paths.
8. Exact smoke provenance: proven by a pre-publication workspace digest and an
   independently rehashed installed manifest with exact identity comparison.
9. Trusted child boundary: proven by the environment allowlist, baseline
   absolute executable resolution, project-path rejection, and direct
   `shell: false` execution.
10. Artifact integrity: proven by lexical and canonical containment,
    regular-file checks, prior-artifact exclusion, exact identity, size, and
    SHA-256 evidence.

## Findings

1. **LOW, Plan 11AH:** `.github/workflows/upgrade-verifier.yml` still requests
   `1.5.0 -> 1.6.1` while the source pin is `1.6.1`; the next hosted run would
   correctly fail `source_pin_mismatch`. Plan 11AH must update or derive the
   source version and pin the floating `verdaccio/verdaccio:6` image.
2. **LOW, cosmetic:** terminal config/cleanup classifications can overwrite an
   earlier step classification, although steps and warnings retain the cause
   and success cannot result.
3. **LOW, cosmetic:** reported smoke command paths differ from the exact
   absolute execution path, and one smoke package path is fork-name literal.
4. **INFO:** the current-package side proves installability; exact provenance
   smoke applies to the bumped package, consistent with Plan 11AF.
5. **INFO:** `bun run compose`, like npm lifecycle execution, is a transitive
   tool-owned shell boundary; the direct verifier spawn boundary remains
   shell-free.
6. **INFO:** publish and install intentionally permit contained lifecycle
   behavior for realism; future npm behavior changes should remain diagnosable.
7. **INFO:** npmrc mode `0o600` is advisory on Windows but enforced on hosted
   Linux; the Windows file remains inside the per-run user-owned temp root.

## Later-Plan Ownership

- Plan 11AH owns reproducible hosted registry lifecycle, current version
  arguments, an immutable Verdaccio identity, and hosted Linux evidence.
- Plan 11AK owns the root dependency/lockfile bump and full dogfood advance.
- Optional report-accuracy and classification refinements can be handled by
  Plan 11AH or a later hygiene plan.

## Closure Decision

Fable's exact decision was: "Plan 11AF can be closed locally now - no minimum
revision required." This does not authorize a push, PR, hosted run, merge,
release, credential change, or public mutation.

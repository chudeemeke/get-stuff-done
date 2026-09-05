# Maintenance

## Bump Runbook

This section covers the Phase 41 bump hygiene checks that are already active.
It is intentionally scoped to the current foundation work; additional upgrade
process sections are owned by Phase 44.

1. Confirm the active upstream authority is still Open GSD and the reviewed pin
   is still the intended target in `package.json`.
2. Run `node scripts/check-overrides.js` before preparing a bump branch.
3. Run `bash .changelog-conflict-check.sh --self-test` before editing release
   notes or merging upstream changelog material.
4. If the self-test fails, fix the guard or fixtures before continuing. Do not
   extend the shell script for a second markdown pattern; Phase 42 owns the
   markdownlint migration.
5. Keep published-release changelog edits out of routine bump commits. New
   entries belong under `## [Unreleased]` until a release is cut.
6. After changing overrides, update each companion `REASON.md` with the reviewed
   upstream version and SHA-256 hash.
7. Re-run `node scripts/check-overrides.js` after compose output changes.
8. Boundary debt remains informational; do not treat a boundary failure as a
   reason to weaken the blocking override gate.
9. Record any bump decision that changes upstream authority in `.planning/STATE.md`
   and the relevant phase summary.
10. Do not use dynamic `latest` or `next` Open GSD pins in committed metadata.
11. Keep `bun install --ignore-scripts` as the dependency-update command unless a
    plan explicitly authorizes lifecycle scripts.
12. Do not generate or commit placeholder perf or platform-validation numbers.
13. If a bump needs a new manual decision, stop and record the decision before
    changing package metadata.

## Forward-porting overrides on an upstream bump

Overrides are rebuilt forward on every pin change, never three-way merged. A
merge uses the old override's base as the merge base, but that base vintage is
unverified — `REASON.md` certifies the upstream file, never the override's own
starting point. With a wrong base, `git merge-file` reads upstream features the
override predates as fork deletions and silently strips them; the result still
parses and can pass shallow tests.

Steps, per bump, with `<old>` the previous pin and `<new>` the incoming one:

1. **Find what actually moved.** Fetch the old pure base
   (`npm pack @opengsd/gsd-core@<old>` into a scratch directory, then extract)
   and `cmp` each overridden path against the installed new one. Paths that are
   byte-identical need no port at all.
2. **Correct adoption tests, then run the drop experiment before porting.**
   Compose the new upstream with a scratch copy of `overlay/` and no sibling
   `overrides/`; do not rename the live tree. Run candidate-bound compatibility
   tests and retain full TAP logs plus the report. Classify every failed
   assertion as a fork behavior, adopted upstream change, or harness defect.
   A green all-drop suite is only a retirement candidate; prove each retained
   override's behavior independently before removing it. The September5 1.8.0
   recheck found 14 failures, not the earlier confounded 18.
3. **Recover the fork delta against a like-for-like base.** Strip upstream's
   inline `// eslint-disable-next-line @typescript-eslint/...` lines from both
   the old and the new pure base (whole-line filter — the fork does not load
   that plugin; the current lint glob covers JS, not CJS, so do not claim these
   comments cause CJS lint failures). Then inspect
   `diff -u stripped-old/<file> overrides/<file>` to identify the intended delta.
4. **Rebuild forward.** Copy `stripped-new/<file>` over `overrides/<file>` and
   apply the delta with `patch -p0`. Hunks land with line offsets; a reject
   means upstream rewrote that exact region, so resolve only that hunk by hand.
5. **Verify behavior on the composed candidate.** Map each retained delta to
   tests of its intended behavior and preserve upstream regression assertions.
   Inspect changed TypeScript sources when the package ships generated CJS.
   Line counts and symbol greps are inspection aids, not semantic proof.
6. **Refresh each `REASON.md`**: `- Version:`, `- SHA-256:` and, where present,
   `- Semantic SHA-256:` of the new upstream file, plus a dated bump-review note
   recording what upstream absorbed and what was adopted or deferred. Confirm
   with `node scripts/check-overrides.js`.

Deliberate upstream semantic changes are **adopted** through fork test updates,
not reverted through an override. Make the adopting assertion conditional on the
pinned version rather than accepting both shapes forever — a permanent
alternation lets either side regress unnoticed. Precedents: `All phases
complete` (ADR-2207), verification-gated roadmap checkboxes (#2022), and
absolute `init` planning paths (#2376).

Two traps that have cost real time here:

- A matrix run reads the live `tests/` tree. Do not edit test files while one is
  running in the background.
- `node --test tests/<suite>.test.cjs` run from the repo root exercises whatever
  the suite's helper binds to, and the legacy repo-root `get-stuff-done/`
  directory is the default. Only the compat matrix, or a run with
  `GSD_COMPAT_PACKAGE_ROOT` pointed at a composed candidate, proves anything
  about the pinned upstream.

## Oversight Trigger Graduation Criteria (PROCESS-07)

Oversight triggers are advisory forcing functions until this section is updated
by an explicit promotion review. Each trigger must reference this heading and
the shared principle in
`overlay/memory/oversight-principle-evidence-before-claim.md`.

Promotion requirements:

1. Observe at least 20 PRs with the trigger firing or correctly abstaining.
2. Keep the false-positive rate at or below 5% false-positive across the
   observation window.
3. Require a maintainer-authored PR review that names the trigger, evidence
   window, and proposed behavior change.
4. Require 2 weeks clean CI history after the observation window begins.
5. Update `MAINTENANCE.md` with trigger name, promotion date, and observation
   evidence before any behavior changes.
6. For Phase 42 and the v1.2.0 milestone, no trigger graduates to blocking in v1.2.0.

## Security

This section covers Phase 41 audit operation. Broader release-security sections
are deferred to Phase 44 after the scanner jobs and first audit results exist.

1. Run `node scripts/audit-check.js --validate-only` before any dependency audit
   result is trusted.
2. Generate `package-lock.json` only as an audit input with
   `npm install --package-lock-only --ignore-scripts`; do not commit it.
3. Run `bun run audit:ci` only after suppression validation passes.
4. Suppressions live in `.planning/audits/suppressions.json` and must include
   `id`, `severity`, `reason`, `reviewer`, `reviewedDate`, and `reReviewDate`.
5. The maximum suppression TTL is 60 calendar days from `reviewedDate`.
6. Critical findings are fixed in the current ship-ready hardening milestone.
7. High findings block CI unless covered by an unexpired suppression.
8. Moderate findings are planned for the next hardening milestone unless local
   exploitability requires immediate handling.
9. Low findings are backlogged with a review date and remain visible.
10. Keep `eslint-plugin-security` active for production JavaScript.
11. Test-only eslint security rule disables must stay documented in
    `eslint.config.js`.
12. Harden-runner starts in audit mode; block-mode promotion is Phase 44 scope
    after two clean weekly reviews.

Harden-runner audit review log format:

| date | workflow | reviewer | findings | action |
|------|----------|----------|----------|--------|
| YYYY-MM-DD | ci.yml / job name | reviewer | none or summary | kept audit mode / filed issue |

## Escape-Hatch Decisions Log

REL-03 is a friction-heavy escape hatch, not a way to hide unreliable tests. Use
this table only after the Phase 41 Windows root-cause timebox has been spent and
the remaining flake is tied to a concrete issue.

Phase 41 Windows root-cause work is timeboxed to 2 working days. After that
timebox, any remaining flake must move to REL-03 with an issue link, concrete
deadline, reviewer, CI job-summary visibility, and this table row before Phase
41 can close. Use IDs in the form `REL-03-N`.

Required surfaces for every active escape hatch:

1. A visible in-test skip reason with the REL-03 id, issue link, and deadline.
2. A GitHub Actions job-summary entry under active REL-03 skips.
3. A durable row in the table below.
4. A named reviewer accountable for the deadline.
5. A status value of `active`, `extended`, or `resolved`.
6. A follow-up issue or PR link in the `issue` column.
7. A deadline that is close enough to force review, not an open-ended date.
8. Removal of the skip once the root cause is fixed.

| ID | test-path | platform | issue | deadline | reviewer | status |
|----|-----------|----------|-------|----------|----------|--------|
| N/A | N/A | all | N/A | N/A | N/A | No active REL-03 skips |

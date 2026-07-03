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

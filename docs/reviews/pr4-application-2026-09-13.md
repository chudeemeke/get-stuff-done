# PR 4 application review

PR: https://github.com/chudeemeke/get-stuff-done/pull/4

Recovered remote head: `81951b255cb8b7796fa28ae5311ed96da133b339`.
Fetched main: `3d1ae34f29084d0c538fd9d8db37aa6f09c13ed1`.
The complete application diff is the standalone doctor and its tests. Existing
unregistered doctor files and other worktrees were preserved.

## Findings and changes

- Non-dry repair refuses symbolic links before reading, parsing or creating
  backups. Diagnosis and dry-run can inspect a link. The actionable refusal
  directs the caller to inspect and explicitly select the regular target.
- Suggested repair commands include the absolute script and settings paths,
  quoted separately for Bash and PowerShell. Tests execute both suggestions
  from another working directory with spaces, apostrophes and dollar signs.
- Empty and flag-shaped settings values fail as usage errors. `check
  --dry-run` is rejected rather than silently ignored.
- Backup and staging creation is exclusive. Failed staging writes and renames
  preserve the original, retain the backup, and clean only owned staging data.
  Cleanup failure retains both diagnostics and the temporary path.
- Pattern matching accepts the exact bunx executable basename, not arbitrary
  executables ending in bunx. Successful repair output says repaired. CLI
  output uses natural process termination to flush pipes.

## Validation

- Pinned Bun 1.3.5: 69 tests passed, zero failed, 185 assertions across the
  functional and decision suites.
- Node/C8: 60 functional tests passed; `scripts/gsd-doctor.cjs` has 100 percent
  statements, branches, functions and lines. Tier S decision tests reject nine
  deliberately incorrect safety implementations.
- Linux Node 20.20.2 probe: link refusal, dry-run, ordinary repair, exact backup,
  link retention, unrelated settings, idempotence, and target/backup 0600 modes
  passed. The earlier probe source hash is retained externally; repeat if its
  relevant implementation changes.
- Focused ESLint and whitespace checks passed. Complete pre-push results and
  hosted checks must be attached to the actual published head separately.
- Independent full-source review ran through Codex 0.154.0, live-resolved
  gpt-5.6-sol at xhigh. Its seven findings were inspected. Six are fixed
  (including the staging-write fix completed while review ran); security
  metadata remains the blocker below.

## Remaining blocker and recommendation

The original atomic replacement preserves permission bits, but does not
explicitly preserve custom Windows DACLs, extended POSIX ACLs, ownership or
extended attributes. Ordinary-file and mode tests do not certify those cases.
The attempted isolated Windows ACL-mutation probe was rejected by automatic
approval review and did not execute. A user decision is pending between safe
refusal for unsupported custom metadata and platform-specific preservation.
Owner: application agent; trigger: resolve that policy and implement/test it
before recommending approval. No approval or merge is recommended yet.

No global settings were repaired. This is repository-local tooling, not a new
npm-installed command. There is no whole-repository coverage or final hosted-CI
compliance claim. CI workflow changes and monitoring belong to the CI owner.

## CI owner handoff

Use the published PR head, not the recovered head or historical green checks.
Changes are limited to doctor source, tests and this application review.
Run the existing required checks unchanged; report infrastructure failures
separately from application failures. The focused command is `bun run test
tests/gsd-doctor.test.js tests/gsd-doctor-decisions.test.js`. Do not approve,
merge or change draft/readiness state on the strength of this handoff.

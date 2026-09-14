# PR 4 application review

PR: https://github.com/chudeemeke/get-stuff-done/pull/4

Recovered remote head: `81951b255cb8b7796fa28ae5311ed96da133b339`.
First published safety fixes: `9376358f6f43aeeb56d339da7cad9d173fd13632`.
Fetched main: `3d1ae34f29084d0c538fd9d8db37aa6f09c13ed1`.
Existing doctor work and all other worktrees were preserved.

## Acceptance decision: blocked

September 14 update: the user explicitly reopened the assumptions behind strict
refusal and asked to assess PR4 against the project end state. The earlier
decision below is the acceptance baseline, not a prohibition on reconsidering
the contract. See `pr4-first-principles-2026-09-14.md`; no weaker implementation,
approval or merge has been authorized. TxF is not adopted. Existing upstream
migration and context-blind doctor diagnosis have been reproduced, so establish
whether a separate doctor remains necessary before adding more repair machinery.

On September 13 the user selected both strict refusal when custom ACLs or
ownership cannot safely be preserved, and ordinary non-elevated repair as a
release requirement. The current implementation satisfies the refusal policy
but does not satisfy ordinary non-elevated repair. Keep PR 4 blocked; no approval,
merge, or readiness change is authorized. This decision is settled, not pending.

Application development owns the remaining design and native implementation.
The retirement trigger is a real non-elevated repair on each supported platform,
with security metadata preservation/refusal, atomic visibility, durable backup,
and failure recovery verified together. Injected inspection is not acceptance
proof. A privileged-only implementation cannot close this requirement.

## Findings and changes

- Non-dry repair refuses final symbolic links before parsing or creating backups.
  Diagnosis and dry-run can inspect them. The refusal explains how to inspect
  and explicitly select the regular target.
- Suggested commands retain the absolute custom settings path and script path,
  with separate Bash and PowerShell literal quoting. Actual shell tests cover
  spaces, apostrophes and dollar signs from a different working directory.
- Empty or flag-shaped settings arguments and check with dry-run fail as usage
  errors. Only an exact bunx executable basename is recognized. Repair output
  distinguishes actual changes from dry-run and uses natural pipe flushing.
- Security inspection precedes backup and replacement. Hard links, unsupported
  filesystems, custom metadata, failed or malformed inspection, and incomplete
  inspection are refused. Empty inspection probes are cleaned; simultaneous
  inspection and cleanup failures retain both diagnostics.
- Staged files receive and verify the original POSIX mode after creation, so a
  restrictive umask cannot silently remove group access.
- Unrelated JSON numbers that cannot round-trip losslessly are refused before
  writing. Repaired hook paths with Bash expansion characters use literal
  quoting, including embedded apostrophes.
- Backup bytes are staged, flushed, and published exclusively by a hard link.
  Partial backups never acquire the final backup name. Replacement bytes are
  flushed before rename; parent directories are flushed on POSIX. Existing
  backups are never overwritten. Failure cleanup retains the original or its
  complete backup and reports cleanup failures. Windows directory flushing is
  not provided by Node and is not claimed.

## Validation and its limits

- Pinned Bun 1.3.5: 102 tests passed, zero failed, 324 assertions across four
  focused files. Thirteen deliberately incorrect implementations are rejected.
- Node: 89 functional, security and durability tests passed with no skips.
- C8 reports 100 percent statements, branches, functions and lines separately
  for both doctor modules. The per-file Tier S branch gate passes. This combines
  Windows receipts and source-hash-verified Linux transaction receipts. Native
  predicate logic is also exercised with injected inspection results; coverage
  does not establish that privileged native inspection succeeds.
- Native Linux Node 20.20.2 / Python 3.12.3: transaction tests with explicitly
  injected successful inspection verify real filesystem repair, exact backup,
  0660 target and backup under umask 0077, unrelated settings, symlink refusal
  and preservation, dry-run and idempotence. A separate real security inspection
  refuses on that account. The receipt says nativeRepairAvailable=false.
- Windows CLI tests likewise verify actual safe refusal when audit inspection
  is unavailable. Read-only Get-Acl -Audit fails on this account because
  SeSecurityPrivilege is unavailable. Virtual PowerShell predicate tests do
  not change on-disk ACLs. Native Windows repair success is not claimed.
- Earlier native positive receipts predate the stricter inspector and are
  historical. A complete Linux suite setup timed out downloading dependencies;
  that is failed setup evidence, not a test pass.

Linux inspection currently requires an existing CAP_SYS_ADMIN capability to
avoid silently missing trusted xattrs, checks inode flags and project metadata,
and accepts only explicitly listed native filesystem types. Windows inspection
compares full descriptors, rejects custom/audit rules, extra streams and unusual
attributes. These restrictions leave ordinary non-elevated repair unsupported
on both tested accounts. No elevation or permission reset was added. Authkey's
inspected credential-broker code provides no established elevation route for
this operation; Tailscale is not involved. Neither project was modified.

The complete PR and a subsequent security packet were independently reviewed
with Codex 0.154.0, live-resolved gpt-5.6-sol at xhigh. The subsequent review
returned five findings: umask, hidden Linux metadata, unrelated number loss,
hook quoting, and backup durability. The changes above address those concrete
paths, but native successful inspection and final-revision independent review
remain unverified. No clean final review verdict is claimed.

Evidence is retained under
`C:/Users/Destiny/.codex/reports/gsd-application-2026-09-13/`:
`pr4-review-fixes-tests.log`, `pr4-security-coverage-final.log`,
`pr4-linux-transaction-final.log`, `pr4-security-coverage/coverage-summary.json`,
and `pr4-security-review-retry.md` with its raw review log. The first security
review attempt stalled in startup hooks and was cancelled without a verdict.

No global settings were repaired. This remains repository-local tooling, not
an npm-installed command. No whole-repository coverage or hosted-CI compliance
is claimed. An earlier ACL-modification probe was rejected by automatic review
and never executed; subsequent Windows native inspection was read-only.

## CI owner handoff

Use the newly published head, not historical checks. Changes are limited to
application source, regression tests and this review. Run existing required
checks unchanged; CI workflows and monitoring remain with the CI owner.
Focused command: `bun run test tests/gsd-doctor.test.js
tests/gsd-doctor-security.test.js tests/gsd-doctor-durability.test.js
tests/gsd-doctor-decisions.test.js`.

Passing CI cannot close the non-elevated repair blocker. No infrastructure
redesign, approval, merge, or readiness change is requested.

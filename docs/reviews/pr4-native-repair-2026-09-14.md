# PR4 ordinary-account repair investigation

**Superseded next action:** the user's first-principles reassessment is recorded
in `pr4-first-principles-2026-09-14.md`. The earlier TxF-versus-blocked framing
below was too narrow. No TxF adoption decision is pending; runtime-aware
classification and existing upstream migration must be resolved first.

Application owner: this get-stuff-done CLI session. CI workflows and monitoring
remain with the separate Desktop session. This is a bounded repair investigation
within the existing completion contract, not a new strategic audit.

## Binding requirements

- Preserve the approved symlink refusal and correctly quoted custom paths.
- Ordinary non-elevated repair must work; privileged-only repair cannot pass.
- Refuse when custom ACLs or ownership cannot safely be preserved.
- Retain atomic publication, exact durable backup, unrelated settings and
  failure recovery. No production permission changes or implicit elevation.
- No approval, merge or draft-readiness change is authorized.

## Recovered state and executable acceptance

Fetched main and all three application PR branches on September 14. PR4 remains
open at `17278b2a9b28e58f561fcbdf02c96a20cb5415c8`. Its existing untracked coverage
was preserved. Other worktrees were not changed.

New release acceptance command:

```
node --test tests/acceptance/doctor-unprivileged.cjs
```

The test establishes a non-elevated token, invokes the actual CLI against an
OS-temp fixture whose path includes spaces, an apostrophe and a dollar sign,
and requires correct repair, unrelated settings, exact backup and idempotence.
It does not inject a successful inspector or accept refusal as success.

RED: one test failed at the actual repair command because Get-Acl -Audit is
unavailable to this account. This is the intended release blocker, not a passing
refusal test. No production source change has been adopted.

## Native alternatives examined

1. NTFS security identity comparison: rejected. The per-file USN probe returns
   SecurityId zero. The documented FSCTL response requires zero here; equal
   zero values cannot prove equal security descriptors.
2. ReplaceFileW: its documented preserved fields do not establish complete
   owner/SACL preservation. It cannot silently replace the strict inspector.
3. Transactional NTFS: an isolated ordinary-account prototype passes commit,
   explicit rollback, original visibility before commit, retained file ID,
   readable owner/DACL equality and alternate-stream preservation. It modifies
   data on the existing object rather than replacing the security-bearing inode.
   A follow-up probe stores and commits the exact backup in a named stream on
   the original file before repairing its default stream; backup bytes survive
   both repair rollback and commit. Audit ACLs were not inspected or modified.
   This is not production acceptance. Stream backups are tied to the original
   file: deleting or replacing that file can delete them, and tools that ignore
   streams can omit them. That differs from independent sibling backup files.

TxF is not adopted: Microsoft discourages new dependencies on it and warns it
may be unavailable in future Windows releases. Linux ordinary-account support,
backup security, interrupted-process recovery, final security review and native
failure coverage still need resolution. The bounded independent design review
completed, as qualified below; no production mechanism was selected.

Sources:
- https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-fscc/d2a2b53e-bf78-4ef3-90c7-21b918fab304
- https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-replacefilew
- https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createfiletransactedw
- https://learn.microsoft.com/en-us/windows/win32/fileio/deprecation-of-txf

## Evidence and next action

Artifacts are in the existing
`C:/Users/Destiny/.codex/reports/gsd-application-2026-09-13/` directory:
`pr4-unprivileged-red.tap`, `pr4-txf-probe.ps1`, `pr4-txf-probe.log`,
`pr4-native-design-packet.md` and reviewer outputs.

The Claude Fable/high review attempt returned usage exhaustion without a review.
The Codex review was launched with the live-resolved gpt-5.6-sol/xhigh model;
its completed review is `pr4-native-design-sol.md`, session
`01a09e05-656a-7db2-b07c-5f907fc88d32`, exit zero. The review found no simpler
proven Windows mechanism under the stated invariants. It considers a limited
TxF backend defensible only with explicit lifecycle/support acceptance and
native full-descriptor, backup, process-interruption and ambiguous-commit proof.
It does not establish generic Linux/ext4 support. The follow-up stream-backup
probe postdates that review and has not been independently reviewed.

The recommendation against adopting TxF merely to close the PR stands. The
proposed owner lifecycle/support decision is withdrawn after reassessment found
existing upstream migration and missing runtime context in the doctor. The
review's diagnosis-only completion alternative remains rejected: the user
requires ordinary-account repair. See the superseding assessment for concrete
application work. PR4 remains owned here and blocked by implementation and
native acceptance, not by a pending decision about TxF or by CI ownership.

# Installer rollback redesign: observe, do not predict

Status: v2, APPROVED by the owner 2026-09-18 after independent review. v1 (commit
`3fe53109`) was approved, then reviewed NOT PASS by two independent lanes; findings,
dispositions and what the author got wrong are in
`docs/reviews/installer-rollback-design-review-2026-09-18.md`. The owner answered four
further decisions (D1 to D4) the same day; this text is the result. No installer code
has been edited. Date: 2026-09-18. Subject: `bin/install.js` on
`chore/upstream-bump-1.9.1` (draft PR 69). Supersedes the "Opinion" section of
`docs/reviews/pr69-frontier-review-2026-09-18.md` where the two differ.

## Problem

`createInstallTransaction` snapshots a predicted path list. The upstream child writes
elsewhere, so a failed install leaves 622 files behind while the wrapper prints
`Rollback applied` unconditionally (line 1001; blocker 1,
`.planning/evidence/pr69-installer-recovery-red-2026-09-14.json`). `main()` runs
`cleanupV2` before the transaction exists, so the only recursive deletion has no
rollback, and the old manifests are already gone when line 335 reads them (blocker 3,
finding F2). The preflight catch commits on any error (lines 965-970). Restore deletes
or overwrites whatever currently sits at a path (lines 272, 277, 281).

## Truths

1. The upstream child is a black box and its write set moves every release. No list
   stays complete. Measured assumption, not enforced: the 1.9.1 child wrote nothing
   outside the config dir (spike below) and never requires `child_process`.
2. The target is shared and live. `~/.claude/projects/` alone is 843 MB on a disk at
   96%, so nothing outside the roots is ever recursed into. The roots themselves are
   small: 19 MB in about 1,000 files on the owner's machine, measured 2026-09-18.
3. A rollback never deletes or overwrites owner bytes in place, including bytes that
   appeared during the install window. It moves them to quarantine.
4. A rollback message is a claim. It is printed only after verification, and it says
   exactly what was verified.
5. Every destructive step of an install happens inside the transaction, or does not
   happen. (`--uninstall`, line 1120, is outside this design; see "Open".)
6. One installer at a time per target.
7. Transaction state is on disk in a known place before the first mutation, so a
   later run can detect and finish an aborted transaction.

## Derived structure

1. **Lock, then open.** An exclusive lock file in the target, created with `wx`,
   holding the pid; a stale lock is detected by pid liveness. `install()` then opens
   the transaction before any mutation. v2 detection and cleanup run inside it, under
   `failWithRollback`, never under the preflight catch.
2. **One transaction directory in the target**, same volume: `snapshot/`,
   `quarantine/<transaction id>/` and `journal.json`. It replaces the `os.tmpdir()`
   snapshot and the separate `before-update` holding area. Its name and the lock's
   name join the generated-names constant, which also replaces the inline list in the
   "always clean metadata" loop and is shared by cleanup and rollback.
3. **Roots.** Top-level entries of `dist/`, roots named by the existing manifests, and
   the generated-names constant. A root that is a junction or symlink is refused at
   preflight with the root named (`targetRelativePath` returns null below it, line 245).
4. **Pre-image (D1): content and SHA-256 for every pre-existing file in the roots**,
   copied into `snapshot/` behind a total byte budget and a free-space preflight; a
   file over budget is hashed only and reported. Keys are case-folded and
   NFC-normalised on win32 and darwin. Legacy roots that cleanup removes are moved in
   by rename (zero disk cost), falling back to copy only when rename fails on an open
   file. Any error while reading a root aborts before mutation. The pre-image is taken
   after the wrapper's own pre-writes (`preserveLocalPatchHistory`).
5. **Top level (D2).** Outside the roots, top-level files are hashed and each
   top-level non-root directory gets a one-level entry set, minus a fixed exclusion
   list (`projects/`, `todos/` and similar). Never recursive. Used for reporting only.
6. **Journal (D4).** `journal.json` records the transaction id, the pre-image index,
   the quarantine path and each completed step, written before the first mutation and
   updated as steps complete.
7. **On failure,** after the child's `close` event: (a) every entry in a root that is
   absent from the pre-image moves to quarantine; nothing is deleted, and the child's
   new manifest is not consulted; (b) every pre-image file whose current bytes differ
   is restored, after the differing current file moves to quarantine under a suffixed
   name; (c) missing pre-image files are restored; (d) renamed legacy roots move back.
   Errors (EBUSY, EPERM, EXDEV) are collected per entry and never stop the remaining
   steps; nothing falls back to copy-then-delete.
8. **Verify, then speak.** Re-hash the roots and re-read the top level. Three outcomes:
   `Rollback applied` (roots match the pre-image, nothing unrecognised outside them);
   `Rollback applied; unverified entries outside the roots`, naming them as untouched,
   not as residue, and dropping any whose birthtime falls outside the child's
   start-to-close window (a zero birthtime stays in the report); `Rollback incomplete`,
   listing what moved and where, what would not move and why, the snapshot path, and
   one recovery instruction. All exit non-zero; the last two have distinct codes.
9. **Next run (D4).** A run that finds a journal finishes that rollback first with the
   same steps, reports, and exits non-zero asking for a re-run. No new flag.
10. **Bounded disk (D3).** On a successful install, a quarantined file is deleted only
    when it is byte-identical to the file that install placed at the same relative
    path. Everything else stays and is named on every run until the owner removes it.
    The committed transaction's `snapshot/` is deleted; one prior generation is kept
    (finding F4).

## Against what exists

Kept: `targetRelativePath` containment, ownership-manifest validation, the injectable
seams and result shape of `install()`, the 17-line `overrides/bin/install.js` fix.
Changed: `createInstallTransaction`, `rollbackInstallTransaction`,
`commitInstallTransaction`, `copySnapshotPath` and `restoreSnapshotPath` (quarantine
before restore), `preserveLocalPatchHistory` (holding area), `install()` (lock, journal,
`close`, cleanup inside, message from result), `main()` (cleanup moves out), the
metadata loop (constant plus containment helper, F3), the file header (F2). Upstream's
`runtime-artifact-install-plan.cjs` is a partial plan and is not adopted as authority.

## Alternatives considered

**Stage, then publish (spiked, not adopted).** Spike, 2026-09-18, owner-approved, temp
directories and a fake HOME only (the real `~/.claude` fingerprint was identical before
and after): the composed 1.9.1 child exited 0 and wrote 632 files, none outside the
config dir. 204 of the 632 (32%) embed the absolute config-dir path, 703 occurrences,
one encoding; 18 files also carry `~/` or `$HOME` forms; the child reads live state.
A relocating second writer needs the same proof as the first. Both review lanes agree.
Revisit only if upstream stops baking paths.

**Rejected by review:** hardlink pre-image (in-place writes share the inode); OS
journals (privileged, non-deterministic); `dev`/`ino` rename tracking (subsumed by the
content pre-image); killing the child's process tree (the pinned upstream installer
never requires `child_process`; a test reads the pinned file and fails if that
changes); a `NODE_OPTIONS` preload shim (possible follow-up, not planned).

## Blockers from `pr69-application-2026-09-13.md`

Closed by design: 1, 3. Narrowed: 2 and 4 (rollback no longer needs an ownership
verdict; cleanup still does), 5 (all publication through the containment helper), 7
(settings backup and staging names fold into the transaction directory). Not addressed
here: 6 patch-tree residue, 8 multi-destination modes, 9 fresh matrix and Tier S evidence.

## Proof

`tests/acceptance/installer-recovery.cjs` becomes a gate: a package script and a CI
step run it (F5). Transaction functions are Tier S: 100% branches, and each case
asserts the message and exit code as well as the bytes. Adversarial cases: owner write
inside a root during the window; concurrent `settings.json` edit surviving a restore;
same-size same-mtime rewrite detected; child deletes a pre-existing file; case-only
rename (named skip on Linux); junction root refused; child side-write to a new
top-level name; child edit of an existing top-level file; another session's top-level
entry with a birthtime outside the window; second failure against an existing
quarantine; GSD-named quarantined file with owner content surviving the prune; two
installers against the lock and a stale lock; wrapper killed mid-child and
mid-rollback, recovered by the next run; child exit by signal with a null code; EPERM
during pre-image aborting before mutation; ENOSPC through the fs seam during snapshot
and during quarantine creation; a locked file held by a PowerShell helper with
`FileShare.None`. One mutation check per gate: force the verify comparison to
always-equal and assert the acceptance test goes red.

## Decisions (owner, 2026-09-18, each via AskUserQuestion with the evidence inside)

First round, on v1: observe model with scoped roots and quarantine; roots extended by
the generated-names constant plus a top-level check (after `.gsd-source` was found
outside the proposed roots); quarantine pruned selectively. Second round, after review:

- D1 pre-image: **content plus hashes of the roots.** Rejected: hashes only; listing
  without mtime. Removes the "reported, not restored" weakness accepted in round one.
- D2 top-level check: **three outcomes, hashed one level deep, birthtime filter.**
  Rejected: three outcomes names-only; the round-one form.
- D3 pruning: **byte-identity only, and step 4(b) of v1 is cut.** Rejected: no
  automatic pruning; the round-one path-name proof.
- D4 durability: **journal plus automatic completion of an aborted rollback.**
  Rejected: a `--recover` flag; deferring to a follow-up PR.

## Open

`--uninstall` is destructive and outside any transaction. Owner disposition pending:
fix now, schedule, or accept with truth 5 scoped to install as written above.

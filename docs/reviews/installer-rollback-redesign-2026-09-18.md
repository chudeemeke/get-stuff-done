# Installer rollback redesign: observe, do not predict

Status: v3, APPROVED by the owner 2026-09-18 after two review rounds. v1 (`3fe53109`)
and v2 (`5d5033f0`) were each reviewed NOT PASS by two independent lanes; findings,
dispositions and what the author got wrong are in
`docs/reviews/installer-rollback-design-review-2026-09-18.md`. The owner made eleven
decisions across three rounds; this text is the result. No installer code has been
edited. Subject: `bin/install.js` on `chore/upstream-bump-1.9.1` (draft PR 69).
Supersedes the "Opinion" section of `docs/reviews/pr69-frontier-review-2026-09-18.md`
where the two differ.

## Problem

`createInstallTransaction` snapshots a predicted path list. The upstream child writes
elsewhere, so a failed install leaves 622 files behind while the wrapper prints
`Rollback applied` unconditionally (line 1001; blocker 1,
`.planning/evidence/pr69-installer-recovery-red-2026-09-14.json`). `main()` runs
`cleanupV2` before the transaction exists, so the only recursive deletion has no
rollback, and the old manifests are gone when line 335 reads them (blocker 3, F2).
The preflight catch commits on any error (lines 965-970). Restore deletes or
overwrites whatever currently sits at a path (lines 272, 277, 281).

## Truths

1. The upstream child is a black box and its write set moves every release. No list
   stays complete. Two side-writes outside `dist/` and the manifest are known today:
   `.gsd-source` and `gsd-migration-journal/` (upstream `installer-migrations.cjs`).
2. The target is shared and live. Nothing outside the roots is ever recursed into.
   Measured on the owner's `~/.claude`, 2026-09-18: roots 19 MB in about 1,000 files;
   `projects/` 843 MB; 62 top-level entries; twelve or more non-root directories
   written continuously by other sessions; 3 of 28 top-level files changed within one
   hour, one of them `.credentials.json`.
3. A rollback never deletes or overwrites owner bytes in place, including bytes that
   appeared during the install window. It moves them to quarantine.
4. A rollback message is a claim. It is printed only after verification and says
   exactly what was verified.
5. Every destructive step of an install happens inside the transaction, or does not
   happen. `--uninstall` is outside this design except for the lock (step 12).
6. One installer at a time per target.
7. A journal on disk means a complete pre-image exists; no journal means nothing was
   mutated. A later run can therefore always tell which.
8. The installer never reads the content of a file it does not own. Outside the roots
   it reads top-level names only.

## Names (one table in the code, three classes)

| Class | Members | Roots | Cleanup may delete | Rollback and verify |
|---|---|---|---|---|
| Generated | `gsd-file-manifest.json`, `.install-meta.json`, `.overlay-manifest.json`, `.gsd-profile`, `.gsd-source`, `CREDITS.md`, `gsd-install-state.json`, `package.json` | yes | yes | yes |
| Observed | `settings.json`, `gsd-local-patches`, `gsd-pristine`, `gsd-migration-journal` | yes | no | yes |
| Protected (wrapper-owned) | `gsd-install-transaction/`, `gsd-install-transaction-retired-*`, `gsd-install.lock`, `gsd-local-patch-history/` | no | no | never touched; recognised, not reported, in the top-level check |

The Generated row replaces the inline list at lines 498-507. The containment helper
refuses any manifest path under a Protected name.

## Derived structure

1. **Lock, then journal, then open.** `gsd-install.lock` is created with `wx` and holds
   the pid and creation time. A lock whose pid is dead is claimed by renaming it to a
   unique name; only the run whose rename succeeds proceeds. A pid that is alive, or
   whose liveness cannot be decided, refuses with: `Another install appears to be
   running (pid <pid>, lock <path>, created <time>). If no installer is running,
   delete that file and run again.` Crash matrix: stale lock without journal, take
   over; stale lock with journal, take over and recover (step 10); journal without
   lock, recover; live lock, refuse naming the lock and any journal.
2. **Transaction directory** `gsd-install-transaction/` in the target: `snapshot/`,
   `journal.json`, `quarantine/<transaction id>/new/` and
   `quarantine/<transaction id>/displaced/<attempt>/`, each mirroring relative paths,
   so nothing needs a suffix and a replay cannot collide.
3. **Roots.** Top-level entries of `dist/`, roots named by the existing manifests, and
   the Generated and Observed names; never a Protected name. A root that is itself a
   link is refused at preflight with the root named. A link below a root is recorded
   as its target string, never descended, never moved or restored; if it changed it
   is reported under `Rollback incomplete`.
4. **Pre-image: copy-only and read-only.** Every pre-existing entry in the roots is
   recorded: directories (including empty ones), links as above, files copied into
   `snapshot/` with a SHA-256. Stored names are kept exactly; comparison keys fold
   case on win32 and fold case plus NFC on darwin, and two entries folding to one key
   abort. Caps: 32 MiB per file, 256 MiB total. Free space required: twice the
   snapshot bytes plus the `dist/` bytes plus 64 MiB. A cap or the free-space check
   failing refuses at preflight, printing the numbers and the largest entries. Any
   read error aborts. The abort path deletes the incomplete snapshot and never commits.
5. **Journal.** Written once the hashed snapshot is complete and before the first
   mutation, by writing a temp file in the transaction directory and renaming over.
   Fields: schema version, transaction id, wrapper version, created and last-updated
   times, the pre-image index, the phase, completed steps, the child's pid, and the
   wrapper's own expected writes. An unparseable journal or an unknown schema version
   refuses with the path and the version; it is never read as "no journal".
6. **Order inside `install()`.** Lock; journal check (step 10); preflight and
   pre-image; journal; `preserveLocalPatchHistory` (reads `snapshot/`, writes the
   durable `gsd-local-patch-history/` generation, journaled as an expected write);
   v2 detection and cleanup; child; overlay steps; commit. Everything after the
   journal runs under `failWithRollback`. `main()` no longer runs cleanup.
7. **Outside the roots (names only).** One `readdir` of the target before the child
   and one after. No file outside the roots is opened; no birthtime is consulted.
8. **On failure,** after the child's `close` event, each entry is handled by checking
   its current state, so every step is idempotent: (a) the snapshot is re-hashed
   against the journal index, and a mismatched copy is never restored from; (b) an
   entry in a root that is absent from the pre-image moves to `quarantine/.../new/`;
   nothing is deleted and the child's manifest is not consulted; (c) a pre-image entry
   whose current bytes or type differ has the current entry moved to `displaced/`, then
   is restored with `COPYFILE_EXCL`; on `EEXIST` the newcomer is quarantined and the
   restore retried, three times at most; if the move to quarantine fails, that entry
   is not restored; (d) missing pre-image files and directories are restored. Errors
   (EBUSY, EPERM, EXDEV, ENOSPC) are collected per entry, never stop the remaining
   entries, and never trigger copy-then-delete.
9. **Verify, then speak.** Match means: identical entry set by exact stored name and
   type, identical SHA-256 for every file, identical target string for every link.
   Size, mtime and ctime are never inputs. Outcomes: `Rollback applied: GSD roots
   restored and verified` (exit: the child's non-zero code, else 1); `Rollback applied
   to the GSD roots; new top-level entries appeared and were left untouched: <names>`
   (exit 3); `Rollback incomplete`, listing what moved and where, what did not and
   why, the snapshot path and one recovery instruction (exit 4). Codes 3 and 4 take
   precedence over the child's code, which is printed.
10. **A later run that finds a journal,** under the lock: if the journal's child pid is
    alive, refuse. If the journal was last updated within 60 minutes: print its date
    and every entry about to move, run steps 8 and 9, print `Recovered an interrupted
    install from <date>` with each moved entry and its quarantine path, mark the
    journal complete, delete `snapshot/`, keep the quarantine, exit non-zero asking for
    a re-run. If older: do not roll back. Rename the transaction directory to
    `gsd-install-transaction-retired-<date>`, print where it is and that it holds the
    pre-install copies, name it on every run until the owner deletes it, and start a
    fresh transaction from the current state. A `snapshot/` with no journal is deleted
    at preflight and reported; a quarantine with no journal is kept and named. No flag.
11. **Commit.** Delete `snapshot/` and the journal. A quarantined file is deleted only
    when it is byte-identical to the file this install placed at the same relative
    path; everything else stays and is named on every run. Older `before-update-*`
    generations under `gsd-local-patch-history/` are pruned to one (finding F4).
12. **Uninstall** takes the same lock and refuses while a journal exists. Running it
    inside a transaction is tracked as a GitHub issue linked to PR 69, trigger: before
    the release that ships this transaction.

## Against what exists

Kept: `targetRelativePath` containment, ownership-manifest validation, the injectable
seams and result shape of `install()`, the durable patch-history generation (line 753),
the 17-line `overrides/bin/install.js` fix. Changed: `createInstallTransaction`,
`rollbackInstallTransaction`, `commitInstallTransaction`, `copySnapshotPath`,
`restoreSnapshotPath`, `preserveLocalPatchHistory` (reads the new snapshot layout),
`install()` and its preflight catch, `main()`, `uninstall()` (lock only), the metadata
loop (names table plus containment helper, F3), the file header (F2). Upstream's
`runtime-artifact-install-plan.cjs` and its migration journal are not adopted as
authority.

## Alternatives considered

**Stage, then publish (spiked, not adopted).** Spike, 2026-09-18, owner-approved, temp
directories and a fake HOME only (the real `~/.claude` fingerprint was identical before
and after): the composed 1.9.1 child exited 0 and wrote 632 files, none outside the
config dir. 204 of the 632 (32%) embed the absolute config-dir path, 703 occurrences,
one encoding; 18 files also carry `~/` or `$HOME` forms; the child reads live state.
A relocating second writer needs the same proof as the first. All review lanes agree.

**Rejected by review or by measurement:** hardlink pre-image (in-place writes share
the inode); OS journals (privileged, non-deterministic); `dev`/`ino` rename tracking
(subsumed by the content pre-image; both lanes concur); renaming legacy roots into the
snapshot (saves about 8 MB, costs a mutation inside the pre-image); a hash-only
fallback over budget (recreates the unrecoverable class); hashing top-level files and
one-level entry sets outside the roots (unreachable `applied`, a release-tracking
exclusion list, and the installer opening `.credentials.json`); a birthtime filter or
tag (NTFS tunneling and rename hide residue); process start time in the lock (needs a
subprocess per platform; the failure mode is an actionable refusal); killing the
child's process tree (the wrapper has no timeout path, so the direct child is dead
before any rollback; grandchildren are covered by the guard test below); a
`NODE_OPTIONS` preload shim (possible follow-up, not planned).

## Blockers from `pr69-application-2026-09-13.md`

Closed by design: 1, 3. Narrowed: 2 and 4 (rollback no longer needs an ownership
verdict; cleanup still does), 5 (all publication through the containment helper), 7
(the snapshot moves into the transaction directory). Not addressed here: 6 patch-tree
residue, 8 multi-destination modes, 9 fresh matrix and Tier S evidence.

## Proof

`tests/acceptance/installer-recovery.cjs` becomes a gate: a package script and a CI
step run it (F5). Transaction functions are Tier S: 100% branches, and each case
asserts the message and exit code as well as the bytes.

Guard test, derived at test time from the composed `dist/bin/install.js` and every
file it requires: no `child_process`, `spawn`, `exec`, `fork`, `Bun.spawn` or
`process.binding`. A bump that adds one fails the gate and reopens the process-tree
decision. Residual risk recorded: grandchildren only.

Adversarial cases: owner write inside a root during the window; a `settings.json`
write landing between quarantine and restore; concurrent `settings.json` edit
surviving a restore; same-size same-mtime rewrite detected; child deletes a
pre-existing file and an empty directory; file replaced by a directory; case-only
rename (named skip on Linux); two names folding to one key; link root refused; link
below a root recorded and never descended; child side-write to a new top-level name;
another session's new top-level entry; second failure against an existing quarantine;
GSD-named quarantined file with owner content surviving the prune; two installers
against the lock; stale-lock takeover race; live-pid refusal message; wrapper killed
mid-child and mid-rollback, recovered by the next run; replay of a half-finished
recovery; stale journal retired with intervening owner edits untouched; journal
torn, unparseable and unknown-schema; orphaned child alive at recovery; snapshot hash
mismatch; the child run against a populated transaction directory leaving it
byte-identical; manifest path under a Protected name refused; caps and free-space
refusal before mutation; EPERM during pre-image aborting with no commit; ENOSPC through
the fs seam during snapshot, quarantine creation and restore; a locked file held by a
PowerShell helper with `FileShare.None`; child exit by signal with a null code;
uninstall refused by the lock and by a journal. One mutation check per gate: force the
verify comparison to always-equal and assert the acceptance test goes red.

## Decisions (owner, 2026-09-18, each via AskUserQuestion with the evidence inside)

Round one, on v1: observe model with scoped roots and quarantine; roots extended by
known names plus a top-level check; quarantine pruned selectively.

Round two, after the first review: D1 content plus hashes of the roots; D2 three
outcomes for the check outside the roots; D3 byte-identity pruning, and the
manifest-trusting delete path cut; D4 a journal with automatic completion.

Round three, after the confirmation review of v2:

- D1 revised: **refuse at preflight over the caps; pre-image copy-only.** Rejected:
  keeping rename for legacy roots; the hash-only fallback.
- D2 revised: **names only outside the roots, three outcomes.** Rejected: a hashed
  allow-list of files; D2 as approved with an exclusion list.
- D4 revised: **automatic when the journal is fresh (60 minutes), retired when
  stale.** Rejected: always automatic; `--recover` and `--abandon` flags.
- Uninstall: **lock now, transaction as a tracked issue.** Rejected: fully inside
  now; accept as is.

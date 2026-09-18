# Installer rollback redesign: observe, do not predict

Status: Accepted by the owner, 2026-09-18, after four independent review rounds. Not
yet implemented. Findings, dispositions and what the author got wrong in each round
are in `docs/reviews/installer-rollback-design-review-2026-09-18.md`. The owner made
eleven decisions across three rounds; this text is the result. No installer code has
been edited. Subject: `bin/install.js` on `chore/upstream-bump-1.9.1` (draft PR 69).
Supersedes the "Opinion" section of `docs/reviews/pr69-frontier-review-2026-09-18.md`
where the two differ.

| Revision | Date | What changed | Trigger |
|---|---|---|---|
| `3fe53109` | 2026-09-18 | First proposal, approved with two amendments | Owner decisions, round one |
| `5d5033f0` | 2026-09-18 | Content pre-image, lock, journal, quarantine before restore | First review: two lanes NOT PASS; owner decisions, round two |
| `fe0ac33b` | 2026-09-18 | Names table, copy-only pre-image with caps, names only outside the roots, fresh-or-retire recovery, uninstall lock | Second review: two lanes NOT PASS; owner decisions, round three |
| `5f8b8258` | 2026-09-18 | Legacy class, lock and journal lifecycle, bounded child-pid check, fuller messages | Third review: one PASS WITH CHANGES, one NOT PASS as written; no owner decision touched |
| this revision | 2026-09-18 | Journal deleted before snapshot, bad snapshot copies never displaced, exit codes 5 and 6, wording fixes | Fourth review: both lanes PASS WITH CHANGES |

Commit subjects and inbox events written on 2026-09-18 call the first four rows v1 to
v4; this table is the mapping.

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
7. A journal at the live path means a transaction is open and its complete pre-image
   exists; no journal there means no transaction is open. The journal is therefore
   always written after the snapshot and deleted before it.
8. Outside the roots the installer reads top-level names only and never opens a file.

## Names (one table in the code, three classes)

| Class | Members | Roots | Cleanup may delete | Rollback and verify |
|---|---|---|---|---|
| Generated | `gsd-file-manifest.json`, `.install-meta.json`, `.overlay-manifest.json`, `.gsd-profile`, `.gsd-source`, `CREDITS.md`, `gsd-install-state.json`, `package.json` | yes | yes | yes |
| Legacy | `get-stuff-done/`, `get-shit-done/`, `gsd-core/` | yes | yes, recursively, in the no-manifest branch only | yes |
| Observed | `settings.json`, `gsd-local-patches`, `gsd-pristine`, `gsd-migration-journal` | yes | no | yes |
| Protected (wrapper-owned) | `gsd-install-transaction/`, `gsd-install-transaction-retired-*`, `gsd-install.lock`, `gsd-install.lock.stale-*`, `gsd-local-patch-history/` | no | no | rollback and verify never touch them; recognised, not reported, in the top-level check |

The Generated row replaces the inline list at lines 498-507 and the Legacy row the
list at lines 482-486, so cleanup deletes nothing that is not a root with a pre-image.
The containment helper refuses any manifest path under a Protected name.

## Derived structure

1. **Lock, then journal, then open.** `isSafeToClean` runs first, before anything is
   written (so a mistyped `--config-dir` is never touched), and preflight repeats it.
   Then `gsd-install.lock` is created with
   `wx` and holds the pid and creation time. A lock whose pid is dead is claimed by
   renaming it to `gsd-install.lock.stale-<unique>`; only the run whose rename succeeds
   proceeds, and it immediately creates its own lock with `wx` (refusing if that
   fails) before deleting the renamed one. The lock is released on every exit path
   after acquisition: commit, rollback whether verified or incomplete, recovery, a
   failed retire rename, every refusal, and both `process.exit` calls in
   `uninstall()`. A lock
   left by a crash is what the takeover rule is for. A pid that is alive, or
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
   the Generated, Legacy and Observed names; never a Protected name. A root that is itself a
   link is refused at preflight with the root named. A link below a root is recorded
   as its target string, never descended, never moved or restored; if it changed it
   is reported under `Rollback incomplete`.
4. **Pre-image: copy-only and read-only.** Every pre-existing entry in the roots is
   recorded: directories (including empty ones), links as above, files copied into
   `snapshot/` with a SHA-256. Stored names are kept exactly; comparison keys fold
   case on win32 and fold case plus NFC on darwin, and two entries folding to one key
   abort. Caps: 32 MiB per file, 256 MiB total. Free space required: twice the
   snapshot bytes, plus the `dist/` bytes, plus the bytes of `gsd-local-patches` and
   `gsd-pristine` (the patch-history generation is a further copy), plus 64 MiB. A
   cap or the free-space check failing refuses at preflight, printing the numbers and the largest entries. Any
   read error aborts. The abort path deletes the incomplete snapshot and never commits.
5. **Journal.** Written once the hashed snapshot is complete and before the first
   mutation. Every write, first and later, goes to a temp file in the transaction
   directory and is renamed over. Fields: schema version, transaction id, wrapper
   version, created and last-updated times, the pre-image index (with its time), the
   top-level names taken with the pre-image, the phase, the child's pid, and the
   wrapper's own expected writes. The phase becomes `spawning` before the child is
   spawned and the pid is added right after, so a journal in that phase without a pid
   means the child's liveness cannot be decided. The phase becomes `child-closed` on
   the child's `close` event, after which its pid is never consulted. An unparseable
   journal or an unknown schema version refuses with the path and the version; it is
   never read as "no journal".
6. **Order inside `install()`.** Lock; journal check (step 10); preflight and
   pre-image; journal; `preserveLocalPatchHistory` (reads `snapshot/`, writes the
   durable `gsd-local-patch-history/` generation, journaled as an expected write);
   detection and cleanup of a GSD 2.x install; child; overlay steps; commit. Everything after the
   journal runs under `failWithRollback`. `main()` no longer runs cleanup.
7. **Outside the roots (names only).** One `readdir` of the target taken with the
   pre-image, before cleanup, and one at verification. Names that appeared and names
   that disappeared are both reported. No file outside the roots is opened; no
   birthtime is consulted.
8. **On failure,** after the child's `close` event, each entry is handled by checking
   its current state, so every step is idempotent: (a) the snapshot is re-hashed
   against the journal index; a pre-image entry whose copy is missing or fails the
   re-hash is neither displaced nor restored, its live entry stays where it is, and
   it is listed under `Rollback incomplete`; (b) an
   entry in a root that is absent from the pre-image moves to `quarantine/.../new/`;
   nothing is deleted and the child's manifest is not consulted; (c) a pre-image entry
   whose current bytes or type differ has the current entry moved to `displaced/`, then
   is restored with `COPYFILE_EXCL`; on `EEXIST` the newcomer is quarantined and the
   restore retried, three times at most; if the move to quarantine fails, that entry
   is not restored; an entry whose bytes match but whose stored name differs only by
   case is renamed back to the stored name; (d) missing pre-image files and
   directories are restored. Errors (EBUSY, EPERM, EXDEV, ENOSPC) are collected per
   entry, never stop the remaining entries, and never trigger copy-then-delete.
9. **Verify, then speak.** Match means: identical entry set by exact stored name and
   type, identical SHA-256 for every file, identical target string for every link.
   Size, mtime and ctime are never inputs. Outcomes: `Rollback applied: GSD roots
   restored to their state at <pre-image time> and verified` (exit 1); `Rollback
   applied: GSD roots restored to their state at <pre-image time> and verified;
   top-level entries appeared or disappeared and were left untouched: <names>`
   (exit 3); `Rollback incomplete`, listing what did not move or restore and why, and
   one recovery instruction (exit 4). Exit 5 is a verified recovery (step 10), whatever
   the top-level names did, which the message reports. Exit 6 is every refusal made
   before any mutation: lock held, child possibly alive, caps or free space, a link
   root, an unreadable journal, a failed retire rename. So 1 always means "failed and
   rolled back" and 6 always means "nothing was touched". The child's own exit code
   is printed, never returned, so it cannot collide with these. Every outcome also
   prints each `displaced/` entry with its quarantine path (these are bytes someone
   else wrote during the window), the count of `new/` entries with the quarantine
   path, and writes the full list of moved entries to `moved.txt` beside them. After
   either `applied` outcome the journal is deleted first and the snapshot second
   (truth 7: a kill between the two leaves a snapshot with no journal, which step 10
   discards, never a journal with no pre-image), and the quarantine is kept. After `incomplete` the transaction directory is retired at once
   (step 10) and the message names the retired path, so nothing loops and nothing the
   message points at is deleted. A journal has no "complete" state: it exists or it
   does not.
10. **A later run that finds a journal,** under the lock. Such a journal comes only
    from a wrapper that was killed. If it was last updated more than 60 minutes ago,
    it is retired whatever its pid says. If it is fresh and in the `spawning` phase,
    and its child pid is alive or was never recorded, refuse with: `An interrupted install
    from <time> may still be running (child pid <pid or unknown>). If none is, run
    again after <time + 60 minutes>; the interrupted transaction will then be set
    aside and kept.` Otherwise, fresh: print its date and every entry about to move,
    run steps 8 and 9, print `Recovered an interrupted install from <date>` with the
    step 9 listing, exit 5 asking for a re-run (exit 4 and retirement if incomplete).
    Retiring: rename the transaction directory to
    `gsd-install-transaction-retired-<UTC timestamp to the second>-<transaction id>`;
    if that rename fails, refuse with the path and the error, mutating nothing else.
    Write into it the list of root entries present now that its pre-image did not
    have. Print its path, that its `snapshot/` holds the copies from before the
    interrupted install, how many displaced entries its `quarantine/` holds with the
    path of the `moved.txt` that lists them, and how many entries that install or
    later activity left in the roots. Repeat that notice
    in every outcome message of every run until the owner deletes the directory. Then
    start a fresh transaction from the current state. A `snapshot/` with no journal is
    deleted at preflight and reported; a quarantine with no journal is kept and named.
    No flag.
11. **Commit.** Delete the journal, then `snapshot/`, in that order. Then walk every
    `quarantine/*/new/` and `quarantine/*/displaced/*/` left by earlier transactions: a
    quarantined file is deleted only when it is byte-identical to the file this install
    placed at the same relative path; everything else stays and is named on every run. Older `before-update-*`
    generations under `gsd-local-patch-history/` are pruned to one (finding F4), except
    that any generation older than a retired transaction still on disk is kept, since
    it is the only patch baseline taken from the true pre-install state.
12. **Uninstall** takes the same lock, releases it before both of its `process.exit`
    calls, and refuses (exit 6) while a journal exists with: `An interrupted install
    was found. Run the installer once to recover it or set it aside, then uninstall.
    If it is older than 60 minutes, that run will also install.` Because an
    incomplete rollback retires its journal at once, the only journal uninstall can
    meet is a killed wrapper's, and one installer run clears it. Running uninstall
    inside a transaction is tracked as issue #75, trigger: before the release that
    ships this transaction.

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
uninstall refused by the lock and by a journal, with its instruction; a no-manifest
target whose `get-shit-done/` is deleted by cleanup and restored by rollback; a
mistyped config dir left without a lock file; the lock released on every exit path
including both uninstall exits; a child exiting 3 or 4 not changing the wrapper's
code; a top-level entry that disappears during the window; a case-only rename restored
to the stored name; a journal in the `spawning` phase with no pid refused with its
instruction; a stale journal whose pid now belongs to an unrelated live process still
retired; an incomplete rollback retired at once with the message naming the retired
path; a patch-history generation older than a retired transaction surviving the prune;
displaced entries printed in every outcome and `moved.txt` written; the wrapper killed
between deleting the journal and deleting the snapshot, the next run discarding the
snapshot and touching nothing else; a snapshot copy that fails its re-hash leaving the
live entry in place and reported; every refusal exiting 6 with the target
byte-identical; a verified recovery exiting 5 when top-level names changed; a journal
in the `child-closed` phase recovered although its pid is reused by a live process.
One mutation check per gate: force the
verify comparison to always-equal and assert the acceptance test goes red.

## Decisions (owner, 2026-09-18, each via AskUserQuestion with the evidence inside)

Round one, on the first proposal (`3fe53109`): observe model with scoped roots and quarantine; roots extended by
known names plus a top-level check; quarantine pruned selectively.

Round two, after the first review: D1 content plus hashes of the roots; D2 three
outcomes for the check outside the roots; D3 byte-identity pruning, and the
manifest-trusting delete path cut; D4 a journal with automatic completion.

Round three, after the second review (of `5d5033f0`):

- D1 revised: **refuse at preflight over the caps; pre-image copy-only.** Rejected:
  keeping rename for legacy roots; the hash-only fallback.
- D2 revised: **names only outside the roots, three outcomes.** Rejected: a hashed
  allow-list of files; D2 as approved with an exclusion list.
- D4 revised: **automatic when the journal is fresh (60 minutes), retired when
  stale.** Rejected: always automatic; `--recover` and `--abandon` flags.
- Uninstall: **lock now, transaction as a tracked issue.** Rejected: fully inside
  now; accept as is.

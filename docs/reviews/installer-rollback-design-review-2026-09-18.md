# Independent review of the installer rollback redesign: findings and disposition

Date: 2026-09-18. Subject: `docs/reviews/installer-rollback-redesign-2026-09-18.md` as
approved by the owner the same day (commit `3fe53109`). Gate: the owner required an
independent review of the approved design before any `bin/install.js` edit.

Four review rounds ran that day, each against a named commit of the note: `3fe53109`
(the sections up to "Proof plan additions"), then `5d5033f0`, `fe0ac33b` and
`5f8b8258`, each under its own heading below. The note's Revision history table maps
these to the v1 to v4 labels that the day's commit subjects and inbox events use.

## Lanes

| Lane | Model and effort | Result |
|---|---|---|
| Google Antigravity (`agy` 1.2.2) | `gemini-3.8-flash-high`, live-resolved | NOT PASS, 22.5 KB, all cited lines real |
| Anthropic | `fable`, `--effort high`, plan mode | NOT PASS as written; PASS WITH CHANGES |
| OpenAI Codex 0.154.0 | `gpt-6-astra` / `xhigh`, banner verified | No review: usage limit until 2026-09-19 09:37. Not counted |

Packet: 34,068 bytes, SHA-256
`8b36cf1c3897030c34640c5de45495da21987783932b60c0c17823f76892208a`: the note verbatim
plus `bin/install.js` lines 234-426, 428-515, 640-679 and 948-1137. Every code claim
marked "verified" below was checked against the file by the frontier session.

## What the author got wrong

1. The verification step compared path, type, size and mtime. Restore uses
   `copyFileSync` and `cpSync`, which set a new mtime, so any rollback that restored
   anything could never have verified. The design was self-defeating (Fable, BLOCKER).
2. Truth 2 rejected a content snapshot because `projects/` is 843 MB, without
   measuring the roots. Measured after the review: every root present in the real
   `~/.claude` totals 19 MB in about 1,000 files. The listing-only pre-image, and the
   "reported, not restored" weakness the owner was asked to accept, were not forced.
3. The quarantine-pruning proof (then called Amendment B) was a path-name match. `package.json` is in the generated-names
   list (line 506); a name proves nothing about bytes (both lanes).

## Findings and disposition

Accepted into the design (both lanes agree unless marked):

| # | Finding | Severity | Disposition |
|---|---|---|---|
| 1 | mtime comparison defeats itself; same-size same-tick rewrites are invisible | BLOCKER | Compare content hashes and entry sets. mtime is not compared |
| 2 | Pre-image can hold content for the roots at 19 MB | MEDIUM, decisive | Owner decision D1 |
| 3 | Path-name proof in the quarantine-pruning rule can delete owner bytes | BLOCKER | Owner decision D3: prune only a quarantined file byte-identical to the file the successful install placed at the same relative path |
| 4 | 4(b) deletes manifest-named new entries on the child's word | MEDIUM | Owner decision D3: cut; everything new is quarantined |
| 5 | Restore overwrites a file another session edited during the window (lines 277, 281, verified); line 272 also recursively deletes whatever now sits at a path that did not exist before (found while verifying) | HIGH (Fable) | Rollback never deletes or overwrites in place: any current entry whose bytes differ from the snapshot, or that did not exist before, is moved to quarantine first |
| 6 | No single-writer exclusion; two installers quarantine each other's files | HIGH | Exclusive lock file created with `wx`, holding the pid, stale detection by pid liveness; its name joins the generated-names constant |
| 7 | State dies with the wrapper: snapshot in a random `os.tmpdir()` name (line 346, verified), pre-image in memory | HIGH (Fable) | Owner decision D4 |
| 8 | Three holding areas (tmp snapshot, `before-update`, quarantine) | MEDIUM | One transaction directory in the target: `snapshot/`, `quarantine/<transaction id>/`, `journal.json` |
| 9 | Copying legacy roots can hit ENOSPC at 96% disk | HIGH/MEDIUM | Rename into the transaction directory, rename back on rollback, delete on commit. Falls back to copy only when rename fails on an open file |
| 10 | Preflight catch commits on any error (lines 965-970, verified); cleanup moved there would commit damage | MEDIUM (Fable) | Cleanup runs under `failWithRollback` |
| 11 | `Rollback applied` printed unconditionally (line 1001, verified) | MEDIUM | Message driven by the verified result |
| 12 | Unrecognised top-level entry from another session yields a false `incomplete` | MEDIUM | Owner decision D2 |
| 13 | Side-writes into an existing non-root top-level directory or file are invisible to a names-only check | HIGH (Fable) | Owner decision D2 |
| 14 | A root that is a junction or symlink is unobserved (`targetRelativePath` returns null, line 245, verified) | HIGH | Preflight refuses with the root named |
| 15 | Case-only and Unicode-normalised names | HIGH | Pre-image keys are case-folded and NFC-normalised on win32 and darwin |
| 16 | Partial pre-image (EPERM while reading a root) | MEDIUM (Fable) | Abort before any mutation |
| 17 | Wrapper pre-writes (`preserveLocalPatchHistory`, line 963) look like residue | MEDIUM (Fable) | Pre-image is taken after wrapper pre-writes |
| 18 | Quarantine collisions, EXDEV, open files, failure during quarantine | BLOCKER/HIGH | Per-transaction subdirectory; EXDEV and EBUSY are collected and reported, never copy-deleted; errors do not stop snapshot restore; message lists moved, unmoved, snapshot path and one recovery instruction |
| 19 | Truncated manifest after a killed child | MEDIUM (agy) | Moot once 4(b) is cut; the child's manifest is not read during rollback |
| 20 | Wait on `close`, not `exit` | MEDIUM (Fable) | Accepted |

Rejected or narrowed, with rationale:

| Finding | Rationale |
|---|---|
| Key the pre-image by `dev`/`ino` to detect renames (Fable) | Subsumed by a content pre-image: the new name is quarantined and the old name restored from content, so no owner byte is lost. Identity tracking is structure the requirement no longer pays for |
| Kill the child's process tree before rollback (Fable) | The pinned upstream installer never requires `child_process` (615 KB file; the only match is a comment at line 11653). A test reads the pinned file at test time and fails if that changes, so a bump surfaces it |
| Cut the top-level check and rely on GSD name patterns (agy) | Reintroduces the blocker-1 class: a future side-write under a new name is missed silently. Narrowed by D2 instead |
| Cut pruning entirely, timestamped dumps, owner cleans up (agy) | Leaves finding F4 (bounded disk) open. Byte-identity pruning is a small, sound rule |
| Cut the pre-image diff (agy) | Without a pre-image nothing identifies what the child created |
| Hardlink pre-image; OS journals (both reject) | In-place writes share the inode; USN, fanotify and FSEvents are privileged and non-deterministic |
| `NODE_OPTIONS` preload shim journaling the child's writes (Fable, "not for this PR") | Recorded as a possible follow-up only; no owner, no trigger, not planned |
| Lock a file with `fs.openSync` in tests (agy) | libuv opens with full sharing on Windows, so it would not block a rename. Use Fable's method: a PowerShell helper holding `FileShare.None`, and the fs seam for ENOSPC |

Needs the owner's disposition, outside this design:

- `--uninstall` (line 1120, verified) is destructive and outside any transaction, so
  truth 5 is scoped to install. Fix now, schedule, or accept and reword truth 5.

## Proof plan additions (accepted from both lanes)

Wrapper killed mid-child and mid-rollback; two installers against the lock; case-only
rename; child edit of a top-level file and a write into an existing non-root directory;
concurrent `settings.json` edit surviving a restore; second failure against an existing
quarantine; junction root; manifest naming a pre-existing owner path; child exit by
signal with a null code; GSD-named quarantined file with owner content surviving the
prune; same-size same-mtime rewrite detected; EPERM during pre-image aborting before
mutation; ENOSPC during quarantine creation through the fs seam. One mutation check per
gate: force the verify comparison to always-equal and assert the acceptance test goes
red. Case tests skip on Linux by name, never silently.

## Second review: confirmation of commit `5d5033f0` (same day)

Packet: 45,904 bytes, SHA-256
`57413161f06f0a8f64f652be2822aafb141001ca9151fdde16089855c9ec0809`: this document,
the note at `5d5033f0`, and `bin/install.js` lines 234-426, 428-515, 640-679, 724-776, 948-1137.
Lanes: `gemini-3.8-flash-high` NOT PASS (21 KB); `fable` at high effort NOT PASS as
written, all fixes textual (15.5 KB). Codex still quota-walled.

What the author got wrong in that revision:

1. The transaction directory and the lock were put in the generated-names constant,
   which it also made the cleanup list and a source of roots. Cleanup would have
   deleted the rollback state, and the directory would have been pre-imaged,
   quarantined and re-verified as a root (both lanes, BLOCKER).
2. It folded the `before-update` patch-history generation into the transaction
   directory on a reviewer's suggestion without reading the code. Line 753 says that
   generation deliberately outlives commit and rollback (verified afterwards).
3. Its roots dropped `settings.json`, `gsd-local-patches` and `gsd-pristine`, which
   today's snapshot list names at lines 341-343 (Fable, HIGH, verified).
4. It hashed every top-level file. That opens `.credentials.json`, and 3 of the 28
   top-level files change within an hour, so `applied` was unreachable. Neither lane
   raised the credentials read; it was found while measuring Fable's churn claim.

Accepted into the next revision (`fe0ac33b`) without an owner decision: names table with three classes; the
transaction directory excluded from roots, pre-image, rollback and verification;
"match" defined as entry set by exact name and type plus per-file SHA-256; links
recorded as target strings and never descended; case folding only on win32, case plus
NFC on darwin, abort on a folded collision; directories recorded; lock claimed by
rename, lock-then-journal order, crash matrix, refusal message text; journal written
after the complete snapshot, atomically, with schema version, child pid and expected
wrapper writes; unparseable or unknown journal refuses; state-checked idempotent
rollback steps; snapshot re-hashed before restore; `COPYFILE_EXCL` restore with bounded
retry; a failed quarantine move skips that restore; quarantine layout by subtree
instead of suffixes; exit-code precedence; the preflight catch never commits; the
guard test broadened to the composed installer, its requires, `Bun.spawn` and
`process.binding`; seventeen further proof cases.

Rejected: process start time in the lock (Fable; needs a subprocess per platform, and
the failure mode is an actionable refusal); killing the process tree (Google; the
wrapper has no timeout path, lines 1053-1078 verified, so the direct child is dead
before any rollback); cutting the top-level names check (Google; `gsd-migration-journal/`
was found the same day as a second side-write no list had); cutting pruning (Google;
owner decision D3); "reporting only violates truth 3" and the `skills/` example
(Google; `skills/` is a root, and not moving unknown entries is the owner's decision).

Owner decisions, round three: D1 revised to a preflight refusal with a copy-only
pre-image; D2 revised to names only outside the roots; D4 revised to automatic
recovery within 60 minutes and retirement of a stale journal; uninstall takes the lock
now, with its transaction tracked as an issue. All are written into `fe0ac33b`.

## Third review: confirmation of commit `fe0ac33b` (same day)

Packet: 55,790 bytes, SHA-256
`5e320d8f81a0332c367197cb8b0f32fd31a956c66487ed5452a8a348e9209e2c`: this document,
the note at `fe0ac33b`, and `bin/install.js` lines 234-426, 428-515, 640-679, 724-776, 905-941
and 948-1137. Lanes: `gemini-3.8-flash-high` PASS WITH CHANGES (9.4 KB); `fable` at
high effort NOT PASS as written, eight required changes, all textual (9.1 KB). Both
confirm the three blocker gaps from the second review closed and every recorded rejection sound given the
code. Codex still quota-walled.

What the author got wrong in that revision:

1. The names table covered the metadata list at lines 498-507 but not the legacy list
   at lines 482-486. In a no-manifest target, `get-stuff-done/` and `get-shit-done/`
   would have been deleted recursively without being roots, so with no pre-image
   (Fable, HIGH, verified). The owner's real target has a `get-shit-done/`.
2. Nothing released the lock, and nothing deleted the journal after an ordinary clean
   rollback, so every run would have met a stale lock and the next run would have been
   pulled into recovery (both lanes).
3. The recovery path deleted `snapshot/` unconditionally, including after an
   incomplete rollback whose message points the owner at that snapshot (Fable, HIGH).
4. The journal's child-pid check had no instruction and ran before the age test, so a
   reused pid could block retirement for ever (Fable, HIGH).

Accepted into the next revision (`5f8b8258`), none touching an owner decision: a Legacy class in the names table;
the lock created after `isSafeToClean`, a new lock written at once after a stale
takeover, release on every exit path, the claimed-rename pattern Protected; every
journal write atomic, a `spawning` phase, the pid added after spawn; the journal and
snapshot deleted after either `applied` outcome; an incomplete rollback retired at
once so nothing loops and nothing the message names is deleted; a stale journal
retired whatever its pid, a fresh journal with a live or unknown child refused with a
bounded instruction; every outcome printing displaced entries, the count of new ones
and writing `moved.txt`; outcome 1 stating the pre-image time; the child's exit code
printed and never returned; exit 5 for a verified recovery; disappeared top-level
names reported and the first `readdir` taken with the pre-image; a case-only rename
restored to the stored name; the free-space formula counting the patch-history copy;
the retired directory's name, a failed retire rename, and its notice enumerating the
retired quarantine; the patch-history prune keeping a generation older than a retired
transaction; eleven further proof cases.

Rejected or kept as decided: restoring from the retired snapshot before a fresh
transaction (Google; that is the stale rollback the owner decided against, and the
truthfulness concern is met by stating the pre-image time and repeating the retirement
notice); cutting the 60-minute split (Google; owner decision D4); flat displaced
directory (Google; the attempt level is what makes a replay collision-free); uninstall
refusing only on an incomplete journal (Fable; moot, since an incomplete rollback no
longer leaves a journal, and the owner's chosen text stays with a printed instruction
added); cutting the per-file cap (Fable, LOW; the owner's round-three decision names
both caps, and a refusal prints the numbers and the largest entries).

## Fourth review: confirmation of commit `5f8b8258` (same day)

Packet: 63,142 bytes, SHA-256
`72e1f8636bb0d8e783c985e7baf959a6a2e3f7784c26152a0dc9cd0b88c76883`: this document,
the note at `5f8b8258`, and the same code ranges as the third review. The ask was a
landing check plus seven failure sequences walked through the steps. Lanes:
`gemini-3.8-flash-high` PASS WITH CHANGES (10.4 KB), two wording fixes, both "can be
settled while writing the failing tests"; `fable` at high effort PASS WITH CHANGES
(8.6 KB), two changes that must precede implementation and six that can wait for the
tests. Both walked all seven sequences to a state where the next run proceeds without
the owner editing a file, and neither found a recorded rejection wrong given the code.
Codex still quota-walled, so no OpenAI lane reviewed any revision.

What the author got wrong in that revision:

1. Steps 9 and 11 deleted the snapshot before the journal. A kill between the two left
   a journal with no pre-image, and the next run would have "rolled back" a committed
   install: about 630 files quarantined, `settings.json` displaced, nothing restored
   (Fable, HIGH). Truth 7 stated the invariant and the steps broke it.
2. Step 8(a) forbade restoring from a bad snapshot copy but step 8(c) still displaced
   the live entry first, removing a file from the roots with nothing put back (Fable,
   HIGH).
3. The Legacy class was added to the names table and left out of step 3's list of
   roots; the lock-release list omitted the incomplete outcome (both lanes).

Accepted, all in the current revision of the note: journal deleted before snapshot in
steps 9 and 11; an entry with a missing or failed snapshot copy neither displaced nor
restored and reported; Legacy named in step 3; the lock-release list naming incomplete
rollback, a failed retire rename and every refusal; `isSafeToClean` before the lock,
repeated by preflight; truths 7 and 8 reworded; the exit-3 message carrying the
pre-image time and "verified"; exit 5 for a verified recovery whatever the top-level
names did; exit 6 for every refusal before mutation, so 1 always means rolled back
and 6 always means untouched; the retire notice naming `moved.txt`; the commit prune
walking every earlier quarantine; the uninstall message saying a stale journal makes
the installer run install as well; a `child-closed` journal phase after which the pid
is never consulted (Fable's optional item, taken because it removes a reused-pid
delay for one sentence); six further proof cases. Rejected: nothing.

Gate status: the owner's requirement, an independent review of the approved design
before implementation, is met by two lanes at PASS WITH CHANGES with every change
applied. The changes of this last round were not themselves re-reviewed; both lanes
classed all but two as settleable in the failing tests, and those two are one-sentence
ordering rules that the proof plan now covers with named cases.

## Owner decisions, round two (answered after the first review)

D1 content plus hashes of the roots. D2 three outcomes, hashed one level deep, with
the birthtime filter. D3 byte-identity pruning, and step 4(b) of `3fe53109` is cut. D4 journal
plus automatic completion of an aborted rollback. All four are written into the
redesign note at `5d5033f0`, which goes back to the available lanes for a confirmation pass before
any `bin/install.js` edit.

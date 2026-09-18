# Independent review of the installer rollback redesign: findings and disposition

Date: 2026-09-18. Subject: `docs/reviews/installer-rollback-redesign-2026-09-18.md` as
approved by the owner the same day (commit `3fe53109`). Gate: the owner required an
independent review of the approved design before any `bin/install.js` edit.

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
3. Amendment B's proof was a path-name match. `package.json` is in the generated-names
   list (line 506); a name proves nothing about bytes (both lanes).

## Findings and disposition

Accepted into the design (both lanes agree unless marked):

| # | Finding | Severity | Disposition |
|---|---|---|---|
| 1 | mtime comparison defeats itself; same-size same-tick rewrites are invisible | BLOCKER | Compare content hashes and entry sets. mtime is not compared |
| 2 | Pre-image can hold content for the roots at 19 MB | MEDIUM, decisive | Owner decision D1 |
| 3 | Path-name proof in Amendment B can delete owner bytes | BLOCKER | Owner decision D3: prune only a quarantined file byte-identical to the file the successful install placed at the same relative path |
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

## Owner decisions (D1 to D4, answered 2026-09-18)

D1 content plus hashes of the roots. D2 three outcomes, hashed one level deep, with
the birthtime filter. D3 byte-identity pruning, and v1 step 4(b) is cut. D4 journal
plus automatic completion of an aborted rollback. All four are written into v2 of the
redesign note, which goes back to the available lanes for a confirmation pass before
any `bin/install.js` edit.

# Review packet: installer transaction, amended design note and the lock seam

Status: open for review, 2026-09-19. Author of the work under review: Claude Code
(Anthropic, Fable tier). Requested reviewer: OpenAI Codex, read-only. This is a
cross-vendor review; no OpenAI model has reviewed any revision of this design.

You are a critical reviewer. Do not edit, create or delete any file. Do not run the
installer against a real home directory. You may read the repository and run read-only
commands. `node --test tests/coverage/install-transaction.test.cjs` is safe: it writes
only to fresh directories under the OS temp directory.

## Context

Repository: a skin over the upstream package `@opengsd/gsd-core`. `bin/install.js` is the
fork's wrapper around the upstream installer, which it runs as a child process against
the user's live `~/.claude` directory. On branch `chore/upstream-bump-1.9.1` (draft PR 69)
the wrapper snapshots a PREDICTED path list, so a failed install leaves about 622 files
behind and prints `Rollback applied` unconditionally. The owner accepted a redesign
("observe, do not predict") after five review rounds and fifteen decisions. Those
decisions are FIXED: do not argue them again. Flag only where the implementation or the
note's own text is unsafe, inconsistent or under-specified.

Read, in this order:

1. `docs/reviews/installer-rollback-redesign-2026-09-18.md`: the design note. Sections
   "Truths", "Names", "Derived structure" (steps 1 to 12), "Proof", "Readings settled for
   implementation", "Decisions".
2. `docs/plans/features/installer-transaction.md`: the approved test-first plan. Where
   the plan and the note differ, the note wins.
3. `bin/lib/install-names.js` and `bin/lib/install-transaction.js` at commit `4eb3201f`.
4. `tests/coverage/install-transaction.test.cjs`: the unit suite. The ten `render:` cases
   fail on purpose ("not implemented"): that seam has not landed.
5. `scripts/expect-red.cjs`: how the two gates are held in expected-red mode.

`bin/install.js` has NOT been edited yet and nothing requires the new modules.

## What landed in the lock seam (commit 4eb3201f)

`acquireLock(targetDir)` returns `{ path, tookOver, release() }` or throws an
`InstallRefusal` (`exitCode` 6). Evidence recorded by the author, win32 only because
hosted CI is account-locked: 29 lock cases pass; c8 reports 100 percent on statements,
branches, functions and lines for both modules; 18 of 18 single-replacement mutants over
the lock's decision points were killed; full suite 1796 pass, 0 fail, under bun 1.3.5.

Choices made INSIDE the owner's decisions, which the tests now pin:

1. The lock is published by `linkSync` from a fully written temp file, so it is never
   observable empty. There is NO fallback for a filesystem that cannot hard-link: the
   install refuses with exit 6. Reason: a lock written in place is observable empty, an
   empty lock prints "delete that file", and a user could then delete a live lock.
2. Takeover of a dead holder is rename, verify, publish. A rename is not a
   compare-and-swap: between this run's read and its rename a rival may have taken over,
   so the file this run moved may be the rival's LIVE lock. The moved file's text must
   equal the dead lock's text; otherwise it is linked back and this run refuses.
   Recorded residual risk: a third installer arriving in the gap between the mistaken
   rename and the link-back acquires the lock, and the rival then runs beside it with its
   lock file gone. The rival's `release()` tolerates that; the concurrent run is not
   prevented.
3. Every lost race (rename answers ENOENT; moved the wrong lock; publish after the claim
   answers EEXIST; the holder released between the refused publish and the read) refuses
   with one message: `The install lock changed hands while this run was starting (lock
   <path>). Run again. If it still refuses and no installer is running, delete that file
   and run again.`
4. Every unexpected filesystem error refuses with `The install lock could not be created
   (lock <path>): <error message>. Nothing was changed.`
5. Liveness: dead only when `process.kill(pid, 0)` throws `ESRCH`. A normal return,
   `EPERM` and any other error all refuse as "appears to be running".
6. A lock file is readable only if it is JSON with a positive integer `pid` and a
   `created` string that round-trips through `new Date(x).toISOString()`. Reason: the
   creation time is printed verbatim in the refusal. Pid 0 is unreadable.
7. The temp file is `<lock>.stale-<id>.new` and the claimed dead lock is
   `<lock>.stale-<id>`, so both stay inside the protected `gsd-install.lock.stale-*`
   family and the owner-accepted names table is unchanged.
8. `release()` deletes the lock only while it still holds this run's exact text, never
   throws, and is safe to call twice.
9. An absent target directory is refused and not created by `acquireLock`. Creating it is
   assigned to the preflight seam, after every refusal that can be decided without it.
10. Default ports are references (`Date.now`, `process.kill`, `crypto.randomUUID`), not
    wrappers, so the 100 percent function gate needs no test-only indirection.

## What to look for

1. Any interleaving of two or three installers against `acquireLock` that ends with two
   runs both believing they hold the lock, other than the recorded residual in choice 2.
   Is that residual acceptable for a tool that mutates a live `~/.claude`, or is there a
   cheap protocol change that closes it without a lock on the lock?
2. Platform behaviour the win32-only evidence cannot show: `linkSync` onto an existing
   directory, `readFileSync` of a directory, `renameSync` of a file another process has
   open, hard links on macOS APFS and on Linux overlay or network filesystems,
   `process.kill(pid, 0)` semantics for pid reuse and for a pid owned by another user.
3. Whether refusing on a filesystem without hard links (choice 1) is the right trade,
   given where `~/.claude` realistically lives.
4. The three new or pinned messages: are they accurate in every state that prints them,
   and does any of them tell the user to delete a file that may be a live lock?
5. Whether pid and creation time are a strong enough identity for `release()` and for the
   verify step of the takeover.
6. The design note itself: contradictions between "Derived structure", "Proof" and
   "Readings settled for implementation"; any step whose wording two implementers would
   build differently; any adversarial case in "Proof" that the described design cannot
   pass.
7. Test quality in the unit suite: tautologies, cases that would pass against a wrong
   implementation, fault injections that never reach their injection.
8. Elegance: structure in `install-transaction.js` that the spec does not pay for.

## Report shape

Findings first, most severe first. For each: severity (BLOCKER, HIGH, MEDIUM, LOW), the
file and line, the concrete failing sequence or input, and the smallest change that
fixes it. Then a verdict line: PASS, PASS WITH CHANGES or NOT PASS. State plainly what
you did not check. Cite only paths that exist in this repository.

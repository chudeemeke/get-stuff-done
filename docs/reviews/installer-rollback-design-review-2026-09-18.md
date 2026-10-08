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

## Implementation planning: proposed amendment (same day, not yet reviewed)

Found while planning the implementation, before any `bin/install.js` edit. This
section describes the proposal as committed at `e235c9f2`. It then went to two lanes
and to the owner; see "Fifth review" below, which supersedes items here where they
differ (notably item 1's closing sentence, which was itself wrong).

What the author got wrong:

1. The first review rejected killing the child's process tree on the recorded fact
   that the pinned installer "never requires `child_process`" (615 KB file, one match
   in a comment). That was checked on one file. Its require graph does load a process
   API: `dist/bin/install.js:21` requires `shell-command-projection.cjs`, which loads
   `node:child_process` (line 57) and spawns at lines 478, 489, 500 and 618. No lane
   caught it in four rounds, and the guard test written from that fact could never
   have gone green. The installer binds only twelve text-projection names from the
   module and none that spawn, so the rejection's conclusion still appears to hold;
   its evidence did not.
2. The acceptance test's central assertion (no file left in the target) contradicts
   step 9, which keeps the quarantine in the target. Nobody compared the two.
3. The mutation check was specified against a scenario in which the mutant survives.

Proposed dispositions are in the note under "Proof" and "Readings settled for
implementation". The readings table is the design critique's list of points where two
implementers would differ, each given the reading closest to the accepted text.

## Fifth review: the proposed amendment at `e235c9f2` (2026-09-18 to 09-19)

Packet: 74,486 bytes, SHA-256
`0a7b47e46aa55cb9768a350df2e5644e96a3060b3dbda8e5e0e217832a57f3f3`: the ask, the
note and this record at `e235c9f2`, `tests/acceptance/installer-recovery.cjs`,
`dist/bin/install.js` lines 1-30, `shell-command-projection.cjs` lines 50-60, 456-520
and 555-625, and `bin/install.js` lines 948-1080. Lanes: `fable` at high effort, plan
mode, NOT PASS (18.7 KB, 7 min), every required change textual; `gemini-3.8-flash-high`
via `agy` 1.2.6, PASS WITH CHANGES (14.8 KB, 2 min). Codex not run: usage limit until
2026-09-19 09:37. The `fable` lane read a composed build outside the packet, from the
main checkout (upstream 1.8.0); each of its repository claims was re-verified against
this branch's 1.9.1 build before use, and all held with shifted line numbers.

What the author got wrong in the proposal:

1. It corrected "the installer file never requires `child_process`" by checking ONE
   module and then claimed the installer "spawns nothing": the same error one level
   up (`fable`, BLOCKER). The graph also reaches `execGit` in `worktree-base-ref.cjs`,
   `git check-ignore` in `config-loader.cjs` and a pid probe in `capability-lock.cjs`.
2. It asserted zero spawn events without running anything. Measured afterwards: the
   real child makes one spawn on a fresh Windows install, so the proposed guard would
   have been red. The lane's own prediction, that the probe runs only when a lock
   already exists, was also wrong. Neither had measured.
3. Its replacement acceptance assertion exempted every Protected name, which is weaker
   than the original and passes an implementation that deletes residue (both lanes).
4. Its second scenario did not kill the verify mutant, because the note never said
   what decides `incomplete`; under any sensible rule a forced error yields
   `incomplete` whatever the comparison returns (`fable`, HIGH).
5. Four readings were decisions in disguise or unsafe: exit 6 for misuse, a
   future-dated journal as stale, the first-segment manifest rule, and the digest
   taken from the copy alone (both lanes, between them).

Accepted into the note: the rejection rests on the measurement and the guard is a
tripwire; spawn-shape allowlist with two entries; "twelve bound names" dropped;
marker inside the gate, one armed process per run, per-route controls inside the real
child, `getBuiltinModule`, `worker_threads`, `dlopen` and `execve` wrapped, the `node:`
prefix stripped, CommonJS-only attribution stated, Bun named as residual risk; exact
acceptance allowlist, twin fixture, upgrade fixture with the test's own walker, exact
outcome string, `status === 1`; the outcome rule written into step 9; the verify
mutant killed by a byte appended after a successful restore, with the forced-`EPERM`
case kept separately and no mutation switch in product code; digest from copy and
source; target created only after every refusal is decided; unit move falling back
to per-entry moves; `linkSync` publication of the lock; an exit code for a failed
snapshot deletion at commit; the D1 consequence for shared roots stated.

Rejected or narrowed: an AST audit of the twelve bound names (Google; moot once the
assertion is dropped and spawns are observed); a static or `module.register` check for
ESM imports (Google; the spawn wraps already catch what an `import()` does, and the
limit is recorded); removing the journal's "expected writes" field (`fable`, as one of
two options; the other is taken: a test proves nothing reads it, so accepted step 5 is
not edited); raising the acceptance child's 30 s timeout now (`fable`, LOW; settled
when the scenario runs under the real transaction, with the measured time in hand).

Owner decisions, round four, each asked with the evidence inside the question:
process-tree rejection confirmed on the corrected evidence; exit 2 for misuse;
future-dated journal stale and retired, chosen over the author's post-review
recommendation with both lanes' objection stated; manifest roots limited to shipped or
known names. The revised text was not itself re-reviewed.

## Owner decisions, round two (answered after the first review)

D1 content plus hashes of the roots. D2 three outcomes, hashed one level deep, with
the birthtime filter. D3 byte-identity pruning, and step 4(b) of `3fe53109` is cut. D4 journal
plus automatic completion of an aborted rollback. All four are written into the
redesign note at `5d5033f0`, which goes back to the available lanes for a confirmation pass before
any `bin/install.js` edit.

## Sixth review: the amended note and the lock seam at `4eb3201f` (2026-09-19)

Lane: OpenAI Codex, `gpt-6-astra`, reasoning effort `xhigh`, read-only sandbox, banner
verified, launched detached 2026-09-19T10:42Z; the first OpenAI review of any revision of
this design. Packet: `installer-lock-seam-review-packet-2026-09-19.md`. Review, verbatim:
`installer-lock-seam-codex-review-2026-09-19.md`. Full transcript (untracked evidence):
`.planning/evidence/codex-lock-seam-review-2026-09-19.log`. **Verdict: NOT PASS**, one
BLOCKER, five HIGH, two MEDIUM. Every path it cites exists. It ran in-memory
reproductions only and says so; nothing below has been re-measured by the author.

**STATUS: ALL EIGHT FIX DIRECTIONS AND HOLISTIC RECOMMENDATIONS ACCEPTED BY OWNER; NO IMPLEMENTATION FIX ACCEPTED.** What follows is the author's preliminary assessment,
written by the Claude Code session that built the lock seam, in the last minutes of its
quota. Dispositions are the owner's, in the next session. The next session may be Codex: a
vendor dispositioning its own review is weak evidence, so the owner decides each row.

Session update, 2026-09-19: after the bounded value comparison, the owner chose to
retain a reduced skin, preserve measured protections, retire duplication only after
parity proof, and resume these eight dispositions. That direction does not disposition
any finding or approve a lock API shape. The owner dispositions below are authoritative;
the original proposed dispositions remain historical proposals.

### Owner dispositions (2026-09-19)

| # | Owner decision | Implementation and acceptance status |
|---|---|---|
| 1 | **Fix now; preserve automatic takeover only with a proven safe protocol.** | Protocol and argument/return shape remain unapproved. No RED tests or implementation changes yet. Must prove exclusive ownership through takeover interleavings and failure paths before acceptance. The author's identity-keyed marker remains a candidate, not an approved solution. |
| 2 | **Approve design amendment now; implement in restore seam.** | Owner authorized the design-note scope extension for step 8(c) and its required proof: completed private staging copy, exclusive hard-link publication, snapshot kept separate, and owner-write interleaving cases. Amendment recorded; no restore tests or implementation yet. Restore argument/return shape remains owner-gated before tests. |
| 3 | **Approve acquisition identity plus a terminal release handle as a conditional fix direction.** | After the further review below, owner approved this pair as part of the lock repair, conditional on approval of the complete takeover/release protocol and failed-release outcomes before RED tests. No new tests or implementation; the lock is not accepted as safe. |
| 4 | **Approve requiring an established shared liveness domain and refusing takeover for foreign or unknown domains as a conditional fix direction.** | Exact domain identity mechanism and any new dependency-injection input remain subject to owner approval of the complete protocol/API before RED tests. Platform and hostname alone are not assumed sufficient. No new tests or implementation; the lock is not accepted as safe. |
| 5 | **Fix now; approve the bounded scope extension.** | Owner approved P03 and amendments through section20. P04/P05 are locally verified on win32, with current source-bound coverage, full-suite recheck and review receipts in execution-plan section20. Retain the intermittent native DACL timeout, moved-list and platform qualification limits there. This does not accept the lock, installer or release. |
| 6 | **Approved the refined amendment with explicit replay behavior, then requested a holistic review with all answers open to reconsideration.** | The approval arrived after the replay question had been withdrawn and the second follow-up drafted. Preserve it as an actual owner answer, not approval of the different single-attempt proposal. Hold amendment of steps 9-10 during the newly requested holistic review. No tests or implementation. |
| 7-8 | No disposition recorded in this session. Included in the holistic review below. | Do not infer answers from the owner's statement that they may have answered all eight. |

Latest owner decision, 2026-09-19: "I'm accept your suggestions, recommendations and
preferred design direction." This accepts the holistic review below, including
findings 7-8 and H1-H3 policy changes: child liveness outranks age; one persisted
automatic rollback attempt; retain mutable quarantine unless safe deletion is proved.
It supersedes the older replay approval in row 6 and the conflicting earlier fixed
installer D3/D4 readings. Campaign D1-D11 are a different decision set and remain
unchanged. Rows above and the follow-up chronology preserve the original answers;
this paragraph is their current disposition. H4-H8 requirements are accepted, but
their concrete platform mechanisms and proof are not yet supplied. All seam argument/
return shapes still require approval before RED tests. No implementation acceptance.

Execution authority now points to
`docs/plans/features/skin-completion-execution-2026-09-19.md`. The owner requested
an actionable, atomic and verifiable path to the complete project end state. The
current-session boundary (stop before preflight/snapshot implementation), no-push
condition and no-real-home restriction remain in force.

### Finding 3 follow-up review (2026-09-19)

Owner requested further review before selecting the fix. Scope: source inspection
of `bin/lib/install-transaction.js`, existing lock cases in
`tests/coverage/install-transaction.test.cjs`, and
`scripts/install-transaction-mutants.cjs`, at HEAD `e50bda5b`. No reproduction,
new tests, implementation, or independent reviewer run was performed.

Required invariant: a release handle may affect only its own acquisition; after
that handle becomes terminal, later calls must not touch the filesystem. Acquisition
identity cannot be inferred from PID/time. The protocol must also prevent replacement
between the ownership check and deletion; identity comparison alone cannot do that.

Source findings:

- `acquireLock` already generates a random ID, but uses it only in temporary names
  (lines 177-179). Its payload has only PID/time. `release` compares that text and
  unlinks by pathname, with no terminal state (lines 196-201).
- The existing rival-release case changes both PID and time. It does not exercise
  two distinct acquisitions with identical PID/time. Release mutants check deletion
  of any lock or no lock; they do not require acquisition identity or terminality.
- The failed-release case injects `EBUSY`, then supplies a probe that reports the
  old PID dead. That proves only behavior with that supplied answer; it does not
  prove cleanup while the original process is still alive.

| Candidate | Assessment |
|---|---|
| More precise timestamp or PID alone | Does not establish acquisition identity. Reject as the fix. |
| Terminal handle alone | Stops repeated release, but does not distinguish a replacement before the handle's first call. Insufficient alone. |
| Acquisition ID alone | Separates equal PID/time payloads, but leaves old handles active and does not close the check/delete race. Insufficient for the full lifecycle. |
| Acquisition ID plus terminal handle | Recommended minimum component, using the existing `newId` port. Must be integrated with the safe takeover/liveness protocol from findings 1 and 4. Not a standalone lock-safety proof. |

Before API approval, specify when the handle becomes terminal (proposal: before its
first filesystem access), the outcome when reading or deleting fails, and recovery
of a remaining lock. Repeated calls must not retry deletion; a retained lock must
not be treated as absent, nor may a live holder be declared dead to clear it. Specify
missing/invalid acquisition-ID handling and the uniqueness contract of `newId`;
random identity is not an atomic compare-and-delete primitive.

Required future RED/mutation evidence, after shape approval: equal PID/time with
distinct acquisition IDs; replacement before first release; repeated release with
zero filesystem calls; first-release read/unlink faults followed by repeat calls;
and takeover/release interleavings under the agreed liveness model. Mutants must
independently remove identity and terminality so neither guard is incidental.

Recommendation returned to owner: select the pair as part of the lock repair, with
the complete protocol, failure outcomes and API approved before tests. This review
does not accept finding 3 or establish that the overall lock is safe.

Owner response after this review: **approve this conditional fix direction**.
The disposition is recorded in row 3 above; protocol/API approval and the required
proof remain outstanding. The review's recommendation is now accepted as direction,
not as evidence that the defect has been fixed.

### Finding 6 follow-up review (2026-09-19)

Historical proposal: superseded by the second follow-up below after the owner
challenged whether the replay-based amendment was an adequate solution.

Owner requested further review before any amendment. Basis: current design steps
5, 8-10, truth 7, settled readings and fixed owner decisions; the brief's proposed
journal/rollback/recovery shapes; existing render cases at
`tests/coverage/install-transaction.test.cjs:449` and `:490`; and the module's
`landed` map at HEAD `e50bda5b`. This is source/design reasoning, not a fresh
reproduction or independent review. Only `acquireLock` is implemented; render,
rollback, recovery and retirement still throw `not implemented`.

The invariant is that failure to move the transaction aside cannot undo mutations
already performed or justify claiming that nothing changed. A failed rename leaves
the journal, snapshot and quarantine at their live location. Keep them together;
do not delete the journal to make the next run proceed, since that would hide an
open transaction and make its snapshot eligible for orphan cleanup (truth 7).

The previous proposal omitted an important consequence: under fixed D4, a fresh
retained journal can trigger rollback again on the next invocation. That rollback
may quarantine edits the owner made after the earlier failure and restore older
snapshot bytes at the live paths. The byte-preservation rule still applies, but it
does not promise that intervening edits remain in place. Idempotence for an unchanged
tree does not establish harmless replay against an actively edited tree. The note's
claim that immediate retirement means "nothing loops" cannot cover failed retirement.

Refined proposed amendment, not approved:

| Situation | Required behavior and exit meaning |
|---|---|
| Incomplete rollback followed by failed retirement | Keep exit 4. Preserve the live journal, snapshot and quarantine; report rollback problems, the retirement error and actual retained paths. Stop this invocation; do not begin a new install or retry rollback in a loop. |
| Next invocation, fresh journal eligible for recovery under step 10 | Perform one recovery pass under the lock, using current-state checks, snapshot validation and quarantine rules. A completed verified recovery exits 5 and asks for a rerun. An incomplete recovery attempts retirement; if that also fails, retain the live transaction and exit 4 again. |
| Next invocation, stale or future-dated journal | Preserve fixed D4: attempt retirement without replaying rollback. On retirement success, retain its contents and follow the existing fresh-install path. On rename failure before this invocation has mutated installation contents, refuse with exit 6 and the retained path/error. |
| Next invocation, fresh spawning journal whose child is alive or unknown | Preserve the existing refusal and wait instruction; do not infer that the child closed merely because an earlier rollback was reported. |
| Unparseable or unknown-schema retained journal | Preserve the existing refusal; never treat it as no journal. |

Exit 6 on a later invocation describes that invocation's pre-mutation refusal; it
must not claim that the prior invocation made no changes. Repeated invocations may
still fail or replay while eligible under D4. No eventual-success or bounded-number-
of-reruns claim is justified. Do not change the embedded freshness clock merely to
force a chosen recovery branch; the existing journal-update contract remains binding.

The existing `incomplete()` fixture always supplies `retiredPath`, and its render
case always expects that path. It cannot represent a failed retirement accurately.
Before implementation, approve an outcome shape that distinguishes a successfully
retired transaction from one retained at the live path, including the retirement
error. Render only paths that actually exist at the reported location; a failure
must not fabricate a retired path. That shape is still a later seam approval item.

Alternatives considered: always refuse retained journals or always retire them on
the next run would change D4's fresh-recovery rule. A durable retirement-pending
marker would add state, write-failure/crash handling, and a policy exception; its
absence after a failed write would still be ambiguous. Neither is silently adopted.
Changing only the exit code would leave next-run handling and output shape undefined.

Required later proof, after API approval: partial restore then retirement failure
with exit 4 and retained bytes; fresh next-run recovery including intervening owner
edits preserved in quarantine; repeated failure without a within-run loop or new
install; stale/future retirement success and failure; live/unknown child and invalid
journal refusals; successful-retirement path reporting; and mutants that falsely
emit exit 6 after mutation, discard the retained journal or report a nonexistent
retired path. No tests have been written or run for these requirements.

Recommendation: approve the refined amendment only with the fresh-replay consequence
explicitly understood. It preserves the fixed decisions and adds no new journal
state. Design amendment and implementation acceptance remain pending.

### Finding 6 second follow-up: prevent repeated rollback, separate outcome from storage cleanup

Status: proposed after the owner requested a better solution covering the edge
cases. The preceding replay-based recommendation and its approval question are
withdrawn. This is design analysis, not an approved amendment or tested protocol.

The previous analysis was anchored to preserving D4 rather than first deriving the
needed behavior. Requirements: truthful outcomes; preserve snapshot and quarantined
bytes; no repeated automatic rollback against newer edits; survive a process dying
at any boundary; treat missing/corrupt/failed writes as uncertainty; keep useful
automatic recovery where the evidence permits it; avoid a second full transaction
engine. A failed cleanup operation must not become permission for another rollback.

There is an information gap in the current design. Consider a process dying before
rollback and a process dying after rollback when recording its outcome also failed.
Both may leave the same old journal. If we keep only that journal, a later run cannot
always distinguish those histories. Writing a retirement-pending flag only AFTER
rollback does not solve the failure-to-write case. More retries or a freshness check
cannot manufacture the missing evidence.

Recommended structure: one persisted automatic rollback attempt per transaction,
with a separate result record. Both live inside the existing Protected transaction
directory, carry the transaction identity and supported schema version, and move
with it. No sidecar elsewhere in the real home, daemon, database or new dependency
is proposed. Exact names and schemas remain API/protocol approval items.

1. Under a proven exclusive lock, inspect the journal, process state, snapshot and
   any attempt/result records. Unknown schema, inconsistent identity, unreadable
   records or incomplete inspection block automatic mutation. Absence is meaningful
   only in a schema that specifies these records; legacy journals cannot be guessed
   into the new protocol. A record without its expected journal is investigated and
   retained, never blindly handled as an orphan snapshot.
2. Before the first rollback mutation, exclusively create and persist an attempt
   record. The creating invocation alone may use that permission, once. A pre-existing
   record never grants permission to resume mutations in another invocation. If
   creation, writing, flushing, closing or validation fails, perform no rollback
   mutation. A partial/invalid record blocks later automatic recovery; do not erase
   it merely to retry. An uncertain persistence result also grants no permission.
3. With permission established, perform one bounded rollback pass using the approved
   quarantine/restore rules. Preserve the original snapshot. Record the result:
   verified-at-time or incomplete, together with collected errors and actual paths.
   A complete result is published only after the pass and verification finish. If
   result publication fails, the attempt record still prevents automatic replay.
4. Incomplete, interrupted or unrecorded outcomes remain unresolved. Retiring the
   transaction is a storage move, not proof that rollback succeeded. Failure leaves
   the same unresolved transaction at its actual live path. Success preserves the
   complete transaction at its retired path. Do not copy-then-delete as a fallback.
5. On a later invocation, an attempt record forbids another automatic restore,
   regardless of its age or the result-record status. Inspection is read-only for
   installation roots. A valid verified result can support completion of metadata
   cleanup; new live edits must not be rewritten to reproduce an earlier result.
   Incomplete/missing/ambiguous results permit preservation and retirement only.
   Finish that recovery/retirement invocation before starting a new installation.
6. After successful retirement, a subsequent ordinary installer invocation can use
   the current roots as its new baseline, with the existing retired-data notices
   and retention protections. That is a new install, not a verified restoration of
   the old state. If the owner needs the old state, the instruction must point to
   retained data and inspection/repair before reinstalling. No new recovery flag is
   proposed. Retirement failure blocks that fresh install while the live transaction
   remains. A crash after successful retirement must still leave discoverable notices
   and data; paths are reconstructed from actual locations, not cached absolute paths.

| Boundary or fault | Required next action |
|---|---|
| Crash before any attempt record exists | Existing fresh-journal recovery eligibility can allow the first attempt, after safe child/lock checks. |
| Partial attempt record, unknown schema or identity mismatch | Refuse automatic root mutation; preserve and diagnose. Missing evidence is not permission. |
| Attempt persisted, crash before first restore | Conservatively treat the one attempt as consumed. Preserve/retire; no replay. This sacrifices some recoverability for a provable boundary. |
| Crash mid-rollback | Preserve partial roots, snapshot and quarantined bytes. No repeated restore into paths that may now contain newer edits. |
| Rollback finishes but result write fails | Attempt record remains authoritative against replay; report unresolved, never infer success from a missing result. |
| Incomplete result, retirement fails repeatedly | Reattempt only safe retirement/inspection on later runs; report the retained location and error. Never rerun rollback or begin a new install against the live transaction. |
| Verified result, cleanup fails | Preserve the recorded historical verification and remaining artifacts; retry only applicable cleanup. Never claim the current tree is unchanged without a fresh read-only check. |
| Owner edits after any attempt | A later recovery pass does not move or overwrite those live edits. The initial pass still has the existing concurrent-edit quarantine semantics. |
| Restart after retirement rename, before its notice | Discover the retired transaction and derive all paths from its real location; never lose the retained-data warning. |
| Child alive, foreign or unknown liveness | An attempt record does not make a live child safe. Preserve refusal requirements; lock and child liveness are separate prerequisites. |
| Disk full, denied access, unreadable state | Refuse the operation requiring unavailable evidence. Never delete the snapshot/journal to make room or force progress. |
| Snapshot invalid | No destructive restoration from invalid pre-image bytes; preserve what exists and report unresolved. |

Outcome semantics also need precision. Exit 4 covers an outstanding incomplete or
uncertain rollback, including a later cleanup-only invocation that still cannot
retire it; the message distinguishes earlier root changes from actions in this run.
Exit 6 remains a refusal before recovery work begins, with no misleading claim about
prior invocations. Verified-at-time, current-tree verification and successful cleanup
are separate facts; renderer/API shapes must not collapse them into one boolean or
an always-present `retiredPath`. Successful metadata cleanup cannot upgrade a prior
incomplete rollback to a verified one. Exact outcome/exit mapping is an approval item.

Necessary policy changes, NOT silently applied: D4's automatic fresh recovery remains
for transactions whose first rollback has not started, but interrupted rollback is
preserved/retired rather than automatically replayed. The existing proof requirements
for automatic mid-rollback recovery must change accordingly. The journal lifecycle
must recognise persisted attempt/result evidence, and the incomplete-outcome mapping
must cover a later cleanup-only invocation. The old rule treating stale/future
journals as eligible for retirement despite a possibly live child remains a separately
recorded owner risk; this finding does not resolve or erase it. No all-edge safety
claim is possible while that risk and lock findings remain open.

Durability is a separate acceptance obligation. A process-kill test is not a power-
loss test. Node documents `fs.fsyncSync` as OS/device dependent; `writeFileSync`
`flush` flushes file data, not a general multi-file transaction guarantee
([Node filesystem documentation](https://nodejs.org/docs/latest-v24.x/api/fs.html#fsfsyncsyncfd)).
Windows exposes separate buffering/flush behavior
([FlushFileBuffers](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers)).
These references support the need to prove record publication and storage ordering;
they do not certify this proposed protocol. Native filesystem support, ordering of
snapshot/journal/attempt persistence, and inability to honour required barriers must
be resolved before accepting crash durability. Do not present write-then-read-back
as proof against power loss. Unsupported durability guarantees must be refused or
explicitly scoped by an owner-approved contract, never silently weakened.

Required proof after protocol/API approval: crash/fault injection at every record,
rollback, result, cleanup and rename boundary; no second automatic pass per transaction;
no root mutations on restart once an attempt exists; first-attempt write failure
prevents root writes; malformed/legacy/identity-mismatched evidence refuses; owner
edits and snapshot/quarantine bytes survive; reported paths exist; no new install
while unresolved live state exists; platform-native locking and required persistence
checks. Negative controls remove the attempt barrier, ignore a failed publication,
replay despite the marker, or report a retired path after rename failure. Require
review of the full transition table before tests, then implementation evidence and
an independent final-revision review. No implementation or test acceptance yet.

### Holistic review of all eight findings and their interactions (2026-09-19)

Verdict: **NOT READY for lock/transaction implementation acceptance.** The eight
findings are valid repair targets, but eight individually approved patches would
not establish a safe installer. Highest-priority contradiction: the fixed stale/
future-journal policy can start a new installer while the previous child is alive.
An additional lock on the wrapper does not stop an orphaned child that still writes.

Scope and evidence: inspected current design, brief, transaction source, existing
lock/render tests, expected-red implementation/tests and mutant definitions at
`e50bda5b`; earlier source-review findings and the comparison remain attributable to
their original evidence. No new product execution, crash experiment, test, native
filesystem proof or independent reviewer was performed. Reasoned interleavings below
are design counterexamples, not claims of newly reproduced failures.

| Finding | Recommendation after considering the others | Required qualification |
|---|---|---|
| 1: unsafe takeover | Keep the safety requirement, not the existing rename/link-back algorithm. Fresh acquisition can remain exclusive publication. Automatic stale removal must stay disabled wherever its full proof is unavailable. | One protocol must cover acquire, takeover, release and crashes. A candidate identity-keyed reclamation marker requires proof that only its holder can detach that exact dead acquisition, including marker creation/cleanup failures. A second read alone is insufficient. |
| 2: restore overwrites concurrent edits | Keep completed private staging plus exclusive publication; never link the snapshot or write published bytes. | Publication collisions, directory/type changes, parent-path containment, staging/cleanup errors and snapshot independence all matter. This solves partial-copy exposure, not every concurrent filesystem race. |
| 3: acquisition identity and repeat release | Keep unique acquisition identity plus a terminal release handle. | Terminal before first filesystem access; report retained-lock cleanup failure. Prove identity and terminality separately, and integrate with finding 1 rather than treating text-check/unlink as atomic. |
| 4: liveness domain | Keep refusal for foreign/unknown domains and broaden the invariant to the journal's child as well as the wrapper lock. | Hostname/platform are insufficient proof of PID namespace identity. Native locks may avoid PID reclamation locally but need evidence for every shared-filesystem/runtime pair; they are not an automatic WSL/Windows solution. |
| 5: false-green gates | Keep the approved validator repair and do it before relying on any repaired-seam gate. | Reject missing/duplicate/unknown checks, malformed statuses, stale skeleton failures, unexpected skips/cancellations and absent per-file coverage; exact expected pending-case inventory. Validate current captured receipts and negative controls. An expected-red pass is not product acceptance. |
| 6: failed retirement | Replace replay-by-freshness with the single-attempt candidate above, separating rollback result from retirement/cleanup. | A persisted attempt record precedes root mutation. Missing result after a crash does not authorize replay. This sacrifices automatic continuation after mid-rollback interruption; D4/lifecycle changes need explicit owner approval. |
| 7: partial pending-file residue | Fix through explicit exclusive creation/ownership, complete writes, close, and cleanup on every failure path. | Never remove an existing collision file. Preserve both original and cleanup errors. If owned residue remains, name it and avoid the unqualified "Nothing was changed" claim. Scope exit semantics to installation content versus transaction metadata explicitly. |
| 8: links inside directory moves | Fix, but do not accept a scan-then-bulk-rename patch as a complete guarantee. Prefer handling entries individually and retaining unsafe directory structures as incomplete. | A regular file or parent directory can also become a link between inspection and action. Absolute no-link-movement/no-escape guarantees require suitable guarded operations or an explicitly bounded concurrency model; repeated path checks alone do not prove them. |

Cross-cutting decisions that need reconsideration, with owner and closure trigger:

| ID | Gap and consequence | Recommended response | Owner / trigger |
|---|---|---|---|
| H1 | Fixed D4 retires stale/future journals irrespective of a possibly live child, then starts fresh. It contradicts single-writer safety. | Age may select recovery policy only AFTER child quiescence is established. Live or unknown child refuses regardless of age or clock direction. Revisit the earlier fixed decision explicitly. | Owner decides policy; implementing agent proves it before journal/recovery API approval. |
| H2 | Retrying a fresh rollback can move newer edits, while failed result writes erase the evidence that an attempt already ran. | Persist one attempt before mutation; subsequent uncertain attempts are inspection/preservation/retirement only. No claimed automatic mid-rollback resumption under this conservative design. | Owner decides D4 amendment; implementer completes state/exit table before any recovery tests. |
| H3 | Existing equality-based quarantine pruning compares, then deletes. A writer can still hold an open descriptor to a renamed file and change its bytes after comparison. | Retain quarantine automatically unless safe deletion can be established; explicit owner cleanup is preferable to an unproved data-loss guarantee. This reopens D3 for such mutable entries. | Owner decides retention trade-off; implementer closes before commit/prune seam. |
| H4 | Preflight checks do not freeze links, directories or shared-path topology for later writes. | Define the supported writer/threat model, then require a filesystem boundary that can enforce it. Refuse unsupported operations instead of declaring path rechecks race-free. No silent dependency/port expansion. | Implementer presents concrete supported-platform mechanism; owner approves before snapshot/apply shapes. |
| H5 | Atomic publication, process-crash persistence and power-loss durability are different properties. | Qualify filesystem support and persistence ordering; unsupported guarantees remain refused or explicitly scoped. No claim from a process-kill test that power-loss recovery works. | Implementer supplies native evidence before durability acceptance; CI account-lock remains a release block. |
| H6 | Snapshot/verification walk files sequentially while other writers run. They do not establish a globally atomic point-in-time tree. | Describe a verified captured pre-image and observation interval, or add writer coordination if a single-instant guarantee is essential. Do not claim a stronger snapshot than the primitive provides. | Implementer proposes accurate claim; owner ratifies before render/verification shape. |
| H7 | Uninstall guidance assumes one installer run always clears a journal. Failed retirement disproves that, even without the single-attempt proposal. | Derive uninstall/recovery instructions from actual retained state. Never promise a single retry clears it. | Implementer updates later wiring/docs after recovery contract approval. |
| H8 | Markdown CLI summaries reported zero checked files despite nonzero input counts. | Do not use that CLI exit 0 as acceptance. Investigate before gate reliance; direct lint API is only the explicitly scoped documentation check. | Implementing agent; before next repository lint acceptance. |

Primary-source checks support specific boundaries, not overall product acceptance:
Linux isolates PIDs by namespace
([pid_namespaces](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html));
Linux rename preserves open descriptors and moves a symlink if it is the source
([rename](https://man7.org/linux/man-pages/man2/rename.2.html)). H3/H4 are inferences
from those semantics and this design's compare-then-delete/check-then-move sequence.
Linux file locks and Windows byte-range locks have platform-specific semantics
([flock](https://man7.org/linux/man-pages/man2/flock.2.html),
[LockFileEx](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-lockfileex));
neither reference proves interoperability for a shared WSL/Windows target.

Preferred delivery direction: conservative, bounded recovery with retained evidence,
not progressively more automatic retries. Keep fresh exclusive locking and normal
install behavior useful; unknown ownership or unsupported reclamation refuses.
Preserve staged restore and strict validators. Separate operation status, actual
storage location, prior root changes, this invocation's changes and cleanup errors
in the approved outcome contract. An attempt/result record belongs to that lifecycle;
it is not a second full per-file transaction log. Do not build an unbounded recovery
engine to avoid a clear refusal.

Proposed order after owner ratification: (1) resolve H1/H2 and support/retention
policy together; (2) approve validator contract, write RED controls, repair gates;
(3) approve the combined lock protocol/API covering findings 1/3/4/7, RED tests and
mutants, native concurrency validation and checkpoint; (4) stop this session before
preflight/snapshot; later seams implement approved snapshot/restore/recovery contracts.
No push until hosted jobs execute; no installed-runtime or release acceptance until
current-source/native evidence and independent final-revision review exist.

This holistic review is complete as a source/design assessment. It is not an
exhaustive guarantee against every filesystem failure, nor approval to amend the
fixed policies. The next owner decision is on the integrated behavior and explicitly
listed trade-offs; do not resume the superseded row-6 approval prompt.

### Original author assessment

Current follow-up before the historical author assessment: P06 resolved the H8
lint-summary suspicion on 2026-09-19. In installed markdownlint-cli2 0.23.2,
`Linting` counts checked inputs; `Summary` counts only files with reported issues.
Source inspection and two CLI stdin controls (clean: exit 0; invalid heading:
exit 1/MD018; both checked one input) confirm that zero summary files need no source
fix. Receipt: `.planning/evidence/p06-lint-summary-control-2026-09-19.json`.
Full repository lint was not run. P03's exact validator contract is now proposed
in completion-plan section 12 and awaiting the owner's answer; no new RED tests.

What the author got wrong: the recorded three-installer residual was judged acceptable
and errors on the link-back were swallowed; the reviewer reproduced a wider failure in
which an `EPERM` on the link-back deletes the rival's live lock outright. Pid plus
creation time was also treated as enough identity for `release()`. Both were predictions,
and both were wrong.

| # | Finding | Author's assessment | Proposed disposition |
|---|---|---|---|
| 1 | BLOCKER: takeover can remove a live holder's lock | Correct. Part one is the recorded residual; part two (link-back failing for a reason other than `EEXIST`, then the claim deleted) is new and worse. The proposed fix, an OS-held lock, is not available from Node builtins, and the module may require nothing else | Fix before any further seam builds on the lock. Proposal for the owner, because it changes step 1 of the note: never rename a lock on the strength of a read. Take over through an exclusive marker KEYED TO THE DEAD LOCK'S IDENTITY (`linkSync` to `<lock>.stale-<digest of the dead lock's text>`). Only the marker's holder may move that lock, and it re-reads the lock after taking the marker, so a late contender either meets `EEXIST` or sees a different text and refuses. A marker left by a crash refuses with the delete instruction: safe, and manual. If the owner rejects a marker, the fallback is no automatic takeover at all: a dead holder refuses with the delete instruction |
| 2 | HIGH: `COPYFILE_EXCL` is not atomic, so an owner write during a restore can be overwritten | Correct, and it is the same lesson as the lock: publish finished bytes by link, never write in place | Amend step 8(c): stage the restore copy privately in the transaction directory, then `linkSync` it to the destination. Add the interleaving case to "Proof" |
| 3 | HIGH: pid and time do not identify an acquisition | Correct. Narrow in practice (one acquisition per process) and cheap to close | Put the acquisition id in the lock text and make `release()` terminal after its first call. The suite pins the lock text exactly, so its cases change with it |
| 4 | HIGH: liveness is probed without checking the liveness domain | Correct, and directly relevant on the owner's machines: WSL and Windows share one `~/.claude`, and a WSL pid means nothing to a Windows probe, so a live WSL installer reads as dead | Record a domain in the lock (platform plus hostname at the least) and refuse takeover of a foreign or unknown domain. Needs a `hostname` port, which is a new port: owner approval |
| 5 | HIGH: the expected-red judges accept extra regressions | Partly by design (extra acceptance failures were allowed because only win32 could be measured), but the reviewer is right that an owner-data check failing must never be acceptable, that `not implemented: acquireLock` must stop being an accepted red now that the seam has landed, and that a report with no coverage table must fail | Fix in `scripts/expect-red.cjs` with negative controls. Outside the Step 3 allowlist in the Codex brief, so it needs the owner's go-ahead |
| 6 | HIGH: a failed retirement after a rollback has no consistent outcome | Correct: steps 9 and 10 of the note contradict each other there | Amend the note: retirement failing after mutation keeps exit 4, names the live transaction directory and the error, and defines what the next run does with that journal |
| 7 | MEDIUM: a partial write of the temp file leaves it behind under "Nothing was changed" | Correct | Separate exclusive creation from the write so the file is known to be this run's, remove it on failure, and name the path if removal fails |
| 8 | MEDIUM: moving a new directory as one unit conflicts with "links are never moved" | Correct: a contradiction inside the note | Amend the reading: a new directory that contains a link is handled per entry, the link stays, and the outcome is incomplete |

The reviewer accepts the refusal on filesystems without hard links as a defensible trade.
Not checked by the reviewer, by its own statement: the unit suite, coverage, the mutants,
the full suite, the installer, and native macOS, Linux, APFS, overlay or network filesystem
behaviour.

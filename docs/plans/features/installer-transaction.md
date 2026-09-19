<!-- Copied 2026-09-19 from the owner-approved Claude Code plan so that any harness can read it. -->

> **Status, 2026-09-19:** approved by the owner. **Step 0 is DONE** (commits `e235c9f2`,
> `95e4cc2f`). Where this plan and the design note differ, the NOTE wins
> (`docs/reviews/installer-rollback-redesign-2026-09-18.md`). Superseded here: the Step 0
> guard proposal (the "twelve bound names" and zero-spawn assertions were dropped after a
> measurement found one allowlisted pid-probe spawn), and the readings table (round-four
> owner decisions: exit 2 for argument misuse; manifest roots limited to shipped or known
> names; digest from source and copy; target created only after every refusal is decided).
> In Step 5, the verify mutant is killed by a byte appended after a successful restore, not
> by a forced restore failure. **Next: Step 1.**

# Plan: installer transaction implementation (PR 69), test-first

Status: ready for owner review, 2026-09-18. Built from a first-hand read of the
design, the review record, all of `bin/install.js` and the acceptance test, plus two
read-only exploration reports and one design critique; every claim the plan leans on
was re-checked directly. Nothing outside this file has been edited. No installer edit
happens before approval.

## Context

`bin/install.js` on `chore/upstream-bump-1.9.1` (draft PR 69, head `8c78d21f`, in
sync with origin) snapshots a predicted path list, so a failed install leaves about
622 files behind while printing `Rollback applied` unconditionally. The owner
accepted a redesign on 2026-09-18 after four review rounds and eleven decisions:
`docs/reviews/installer-rollback-redesign-2026-09-18.md` (the design) and
`docs/reviews/installer-rollback-design-review-2026-09-18.md` (the review record).
Those decisions are fixed. This plan implements the design, RED first.

Work happens in the worktree `C:\Projects\get-stuff-done\.claude\worktrees\skin-campaign`
by explicit path (the shell working directory does not persist between calls).

## Invariants throughout (risky flow: destructive filesystem code)

- No test, script or manual run ever targets the real `~/.claude`. Every fixture is a
  disposable directory; destructive RED cases aim at copies (mistakes-log Testing 6).
- The installer never opens a file outside its roots (truth 8). Tests assert it.
- A rollback never deletes or overwrites owner bytes in place (truth 3).
- The eleven owner decisions are not reopened. If implementation shows one is unsafe:
  stop, and ask with the evidence inside the AskUserQuestion text.
- Rollback path for this work itself: every step is its own commit on the PR branch;
  `git revert <sha>` undoes any step. No bare `git stash`. No force-push.
- At most three process-heavy shells; cargo-style concurrency rule applies to test
  runs sharing `dist/` (never compose while a suite runs).
- Every `git push` runs with pinned bun 1.3.5 first on PATH; never `--no-verify`.
- A green gate binds to the tree it ran against; re-run before `git add` after any edit.
- Commits: author `Chude <chude@emeke.org>`, no AI attribution, no emojis.

## Facts established first-hand

- All `tests/installer-*.test.js` suites use `bun:test`. The repo's per-file coverage
  gates are `c8 --per-file --check-coverage ... node --test <files>` package scripts.
  `bin/install.js` has no coverage gate; `tests/acceptance/installer-recovery.cjs` is
  wired to no script and no workflow.
- c8 gates per FILE. "100% branches on transaction functions" is therefore only
  enforceable if those functions live in their own module.
- `install()` listens on the child's `exit` event (line 1069); the design requires
  `close`. `failWithRollback` returns the child's code (line 1007); the design
  forbids that.
- `main()` runs `cleanupV2` before any transaction (lines 1125-1133).
- The preflight catch commits on any error (lines 965-970).

## Finding that must be settled before the guard test is written

The accepted note records that the pinned upstream installer "never requires
`child_process`". Verified 2026-09-18: true of the single file, FALSE of its require
graph. `dist/bin/install.js:21` (same line in the pinned upstream file) requires
`gsd-core/bin/lib/shell-command-projection.cjs`, which loads `node:child_process`
(:57) and spawns at :478, :489, :500, :618. The installer binds only twelve pure
text-projection functions from it (module lines 108-455) and calls none of `execGit`,
`execNpm`, `execTool`, `dispatchGsdCommand`, `probeTty`. The installer also has twelve
`require(path.join(_gsdLibDir, ...))` sites and `capability-loader.cjs` requires more
at runtime, so a regex-derived require graph is not closed.

Consequence: the guard test as written in "Proof" is red on 1.9.1 and cannot go
green. The behavioural conclusion (the installer spawns nothing, so the direct child
is dead before rollback) still appears to hold by call reachability. This is a review
disposition, not one of the eleven owner decisions, but the note itself says a failing
guard "reopens the process-tree decision", so it is handled as Step 0 below: amend the
note, independent review of the amendment, THEN the owner is asked with the evidence
inside the question. Order follows the feedback memory "review before recommending".

## Module location and skin check (verified)

New fork-owned module `bin/lib/install-transaction.js`. Upstream-shadow check on the
file path answers OK (upstream `bin/lib/` holds only `ui-safety-gate.cjs`);
`package.json#files` already ships `bin`; root `bin/` is not a compose input, so
nothing lands in `dist/`; boundary ratchet stays at 42 of 48. `scripts/lib/` was the
alternative and loses: it needs a `files` entry or the module silently does not ship.

Knock-on edits this forces:
- `tests/installer-v3.test.js:29-46` fixture copies only `bin/install.js`; it must copy
  `bin/` recursively. A guarded `require` with a fallback is wrong for a module whose
  purpose is the transaction.
- `tests/installer-exports.test.js:15-40` pins export names and a silent bare `require`.
- `.github/workflows/upgrade-verifier.yml:15` triggers on `bin/install.js` only; extend
  to `bin/**`, and the matching assertion at `tests/ci-workflow.test.js:612`.

## Blast radius in existing suites (verified)

`tests/installer-safety.test.js`: 33 test instances depend on the current shape.
Inversions, not just re-baselines: `:273`/`:306` assert rollback deletes new files
(design quarantines); `:354` asserts the snapshot parent is `os.tmpdir()` (design: in
the target); `:430` five preflight refusals assert status 1 (design: 6); `:449` and
`:530` assert the wrapper returns the child's code (design: printed, never returned);
`:1632` expects rollback to throw on a locked first file (design: collect, continue).
Helper `spawnThatExits` (:131) emits `exit`; the design waits on `close`.
`tests/installer-cli-safety.test.js:34,49,70,91` expect CLI status 1; some become 6.

## CI and script wiring (verified)

- CI runs only for PRs into `main`, so a stacked PR onto this branch would get no
  checks. Work lands as atomic commits on this branch; PR 69 stays a draft.
- Acceptance: package script `test:acceptance:installer-recovery` =
  `node tests/acceptance/installer-recovery.cjs`, plus one step in the `test` job of
  `.github/workflows/ci.yml` (3-OS matrix, already composes at :318). A step keeps job
  topology unchanged; a new job would need a row in
  `config/phase43-hosted-ci-contract.json` (`allowUnexpectedJobs: false`).
- Coverage gate: node-only suite under `tests/coverage/`, registered in
  `tests/coverage-contract.json`, package script with `c8 --per-file --include
  '**/bin/lib/install-transaction.js' --branches 100` (other three metrics 100 as
  well unless the Plan review finds a reason), and a CI step. Extend
  `tests/test-config-hygiene.test.js` to pin the include list and the 100 threshold,
  or the gate is prose.
- Never spell a CI step `bun test ...`; never name a script exactly `test:coverage`.
- eslint: name digest variables `digest`, not `hash`
  (`security/detect-possible-timing-attacks` is an error).

## Debt seen while exploring (surfaced, not silently deferred)

1. The five `test:coverage:phase43-*` c8 gates run in no workflow and not in the
   pre-push hook. They are package scripts only. Not caused by this work.
2. `scripts/setup-branch-protection.json` requires a context named
   "Boundary & Override Check"; `ci.yml` has two separate jobs and no job of that name.
3. PR 69's body cites head `df0d3f9c` in its Verification text; the head is `8c78d21f`.
4. `fileError(code)` is duplicated in two test files; this work adds a third consumer,
   so it is promoted to `tests/helpers/` here (in scope).
Items 1 to 3 need an owner disposition; they are listed again in the closing summary.

## Two places where the existing proof cannot work as written (verified)

1. `installer-recovery.cjs:103-111` asserts zero files remain besides `owner.txt` and
   `settings.json`. Step 9 of the note keeps the quarantine (about 622 files plus
   `moved.txt`) inside the target. The test encodes the old "delete residue"
   expectation. It changes to: zero residue OUTSIDE Protected names; roots
   byte-identical to the pre-image; the quarantine count equals the residue count;
   message and exit code asserted (it records `claimedRollbackApplied` today and never
   asserts it). This aligns the test with the owner's quarantine decision; it does not
   weaken it.
2. The mutation check (verify forced to always-equal) is vacuous against a clean
   rollback, because verification would pass anyway. A second acceptance scenario is
   added: a restore that is forced to fail, expecting `Rollback incomplete`, exit 4 and
   a retired directory. Under the mutant it reports `applied`, so the gate goes red.

## Readings of the accepted note that the failing tests will encode

Stated here so they can be corrected in one reply at approval. None reopens a decision.

| Point | Reading |
|---|---|
| Refusals before the lock (`--all`, missing `dist/`, corrupt overlay manifest, unsafe target) | Exit 6. The note says 6 is "every refusal made before any mutation" and 1 "always means failed and rolled back". cli-standards would give 2 for misuse; the accepted note wins |
| Links inside `gsd-local-patches` / `gsd-pristine` | `assertRegularBackupTree` keeps refusing at preflight (exit 6); the note lists the patch-history generation as kept. Elsewhere links below a root are recorded, per step 3 |
| Target directory absent (fresh install) | Created after `isSafeToClean`, before the lock; removed again on a refusal if this run created it and it is empty |
| "Roots named by the existing manifests" | First path segment of each manifest entry; a Protected segment refuses, exit 6 |
| Third `EEXIST` on restore | Newcomer left in place, entry reported under `Rollback incomplete` |
| Empty or unparseable lock file | Liveness undecidable: refuse with the delete instruction |
| Journal `last-updated` in the future | Treated as stale and retired (retiring keeps everything; an automatic rollback mutates) |
| Journal "expected writes" | Informational; Protected names are already recognised and unreported |
| New directory created by the child | Moved to `new/` as one unit; the count in the message is units moved |
| Pre-image digest | Taken from the snapshot copy, so the index describes exactly what can be restored |
| Caps counting owner files in shared roots (`skills/`, `hooks/`) | As decided (D1): refuse and print the largest entries |

## Module design

Two new fork-owned files (neither name exists upstream):

- `bin/lib/install-names.js`: the one names table. Four frozen arrays (Generated,
  Legacy, Observed, Protected) plus `isProtectedName`. Requires nothing. Consumed by
  `removeGsdFiles` (replacing the inline lists at 482-486 and 498-507) and by the
  transaction, so cleanup never loads the transaction to read names.
- `bin/lib/install-transaction.js`: requires `./install-names` and Node builtins only.
  Direction is `install.js` -> transaction -> names; no cycle.

Injection: one factory `createInstallTransactionApi(ports)` merging over defaults. Not
the `deps.fs || fs` idiom, since each `||` is a branch pair per port per function.
Ports: `fs` (sync subset), `platform`, `now`, `pid`, `signalProcess`, `newId`,
`freeBytes` (`fs.statfsSync`; Node floor is 20.9, no guard). `platform` is a port so
the win32, darwin and linux folding branches are all coverable on any host, which a
100% gate on a 3-OS matrix requires. No logger port: the module returns outcomes and a
pure `renderOutcome(outcome, notices)` returns `{ exitCode, lines }`; `install.js`
prints. Message, code and bytes are then each assertable without console capture.

Exports: `acquireLock`, `inspectExisting`, `openTransaction`, `snapshotPathOf`,
`recordExpectedWrite`, `markSpawning`, `recordChildPid`, `markChildClosed`,
`planRollback`, `applyRollbackAction`, `verify`, `rollback`, `recover`, `retire`,
`commit`, `renderOutcome`. The plan/apply split is an implementation choice, not the
note's: it makes "wrapper killed mid-rollback after action k" deterministic for every
k with no sleeps and no crash seam (step 8 catches per-entry errors and would swallow
a thrown seam).

Stays in `bin/install.js`: argument parsing, `isSafeToClean`, `targetRelativePath`
(gains the Protected refusal), `removeGsdFiles`, `detectV2`, `cleanupV2` (moved inside
`install()` under `failWithRollback`), `patchStatusLine`, overlay copies,
`preserveLocalPatchHistory` (reads `snapshotPathOf`), `install()` and its existing
seams and result shape, `main()`, `uninstall()` (lock plus journal refusal only), the
file header (F2), the misplaced JSDoc (F7).

## Step sequence (each step one or more atomic commits on this branch)

Step 0. Amend the note, docs only. Correct the `child_process` fact, replace the guard
  criterion, add the two proof corrections and the readings table, add a Revision
  history row keyed by commit. Proposed guard: one real run of the composed child under
  one preload that hooks `Module._load` (recording parent and request for
  `child_process`, `node:child_process`, `cluster`) and wraps every spawn entry point;
  assert the observed loader set is a subset of a one-entry allowlist with that entry
  present, the installer binds exactly the twelve known names from it, and zero spawn
  events across a fresh install, an upgrade and a failed install. Controls: a missing
  trace or preload marker is a failure, never zero; per-event append, not an exit dump;
  a positive-control fixture that does spawn must be detected. Node-only, with a text
  scan kept for `Bun.spawn`. Residual risk reworded to "unexercised paths and non-JS
  spawn routes". Then: independent review lanes on the amendment (Anthropic fable at
  high effort; Google if available; Codex offered, quota returns 2026-09-19 09:37),
  findings dispositioned in the review record, and ONLY THEN the owner is asked, with
  the evidence inside the question. Steps 1 to 6 do not depend on the answer.

Step 1. Acceptance gate, expected-red. Rewrite the acceptance assertions per the two
  corrections above. Package script `test:acceptance:installer-recovery`. New
  `scripts/expect-red.cjs`: passes only on the KNOWN red (exit 1, `accepted:false`,
  `injectedFailureReached:true`, the known failure text); an unexpected pass fails, and
  so does red for the wrong reason such as a missing compose. One step in the `test`
  job after the Bun step; `tests/ci-workflow.test.js` asserts it. This keeps the
  evidence that the gate runs on three OSes and can fail (finding F5) without pushing
  a red head.

Step 2. Unit RED. `install-names.js` lands complete. `install-transaction.js` lands as
  a skeleton whose exports throw `not implemented: <name>`, so failures are per case.
  Nothing requires it yet. `tests/coverage/install-transaction.test.cjs` (node-only, so
  the pre-push hook's `bun run test` stays green), registered in
  `tests/coverage-contract.json`; script `test:coverage:install-transaction` (c8
  `--per-file`, both new files, 100 on all four metrics); `setup-node` added to the
  `test` job, then the same expected-red step. `tests/test-config-hygiene.test.js` pins
  the include list and the 100 threshold. `tests/helpers/fault-fs.cjs` promotes the
  duplicated `fileError`.

Step 3. GREEN, one commit per seam, order forced by dependency: names and comparison
  keys; lock; preflight and snapshot; journal; plan, apply, verify; render; recover and
  retire; commit and prune. Rollback fixtures are built with `openTransaction`, never
  hand-written JSON, except the torn and unknown-schema cases.

Step 4. Wiring, pushed as one unit. `install.js` hard-requires the module;
  `createInstallerPackageFixture` copies `bin/` recursively; `exit` becomes `close`
  (helper `spawnThatExits` emits both; one case emits only `exit` and asserts no
  rollback starts; spawn failure with `child.pid === undefined` still rolls back);
  the 33 tests are rewritten, one (`:247`) deleted as superseded, the rest kept;
  CLI status expectations and the exports pin updated; `upgrade-verifier.yml` paths and
  its test extended to `bin/**`. New portable suite `tests/installer-transaction.test.js`
  for real-filesystem cases through the `install()` seams.

Step 5. Flip. Delete `scripts/expect-red.cjs`; both steps become plain gates;
  `ci-workflow.test.js` asserts `expect-red` is gone. Add the mutation check: copy
  `bin/` to a temp package root, one exact-string replacement whose needle must occur
  exactly once, run the acceptance file against it, assert red. Remaining real-CLI
  cases: two installers against the lock; wrapper killed mid-child (a preload blocks
  the child on a sentinel file, the test kills the wrapper, the next run refuses, the
  sentinel is released, the run after recovers with exit 5); the child run against a
  populated transaction directory; every refusal exiting 6 byte-identical. Windows-only:
  PowerShell `FileShare.None` during pre-image (6) and during restore (4 plus
  retirement), helper promoted from `tests/fork-roadmap-persistence.test.js:66-95`.
  Named skips only: case-only rename on Linux; symlink without privilege on Windows.

Step 6. Guard test, after Step 0's owner answer. CHANGELOG `Unreleased`, README exit
  codes, PR 69 body (stale head SHA, Verification, non-claims), inbox Event Log rows,
  handoff.

Rough size: about 40 node-only unit cases, 18 portable integration, 6 real-CLI, 2
Windows-only. Not addressed here, as the note already says: blockers 6, 8, 9; issue 75.

## Verification

Serialized, never beside a compose, at most three process-heavy shells, each result
read from a file with `rc` captured on the bare command and the suite SUMMARY LINE
checked (never the exit code alone):
1. `bun run compose`, then `node tests/acceptance/installer-recovery.cjs`: red through
   Step 4's predecessor, green after; report JSON shows exit code, message, quarantine
   count, roots byte-identical.
2. `bun run test:coverage:install-transaction`: 100/100/100/100 per file, both files.
3. Mutation check red against the mutant, green against the real module.
4. `bun run lint`, `bun run lint:docs`, `bun run test` under pinned bun 1.3.5 (recipe
   in memory `local_bun_version_mismatch_false_reds.md`), `node scripts/check-overrides.js`,
   `node scripts/check-parity.js`, boundary ratchet still 42 of 48.
5. Skin audit before each push: files since merge-base classified against the table in
   CLAUDE.md; upstream-shadow check on every new path.
6. Hosted: all checks green on the final head on three OSes; PR stays draft. Tier D:
   decision brief filed as a `next_owner: user` inbox item; no merge without the
   owner's answer. PR 4 closure is not part of this and is not authorized.

# Codex brief: continuing the installer transaction (PR 69, plan Step 3 onward)

Status: written 2026-09-19 by the Claude Code session that landed the lock seam
(`4eb3201f`), at the owner's request: Anthropic quota is ending for the week and Codex
continues this work. Read this file after `.planning/CONTINUE.md`.

Authority, highest first: the owner's fifteen decisions (end of the design note); the
design note `docs/reviews/installer-rollback-redesign-2026-09-18.md`; the plan
`docs/plans/features/installer-transaction.md`; this brief. Where two differ, the higher
one wins and you tell the owner.

## Your role

You implement. The design is decided: the note fixes behaviour, messages, exit codes and
order; the plan fixes module layout, ports and the operation list. What is NOT yet fixed
is the argument and return shape of most operations. For those, this brief proposes a
shape. Before you write a seam's RED cases, show the owner that seam's shape (the
proposal below, or your correction of it with the reason) and get a one-line approval.
That is the whole design loop: you propose, the owner approves, you build.

If implementation shows an owner decision or a note reading is unsafe: STOP. Ask the
owner with the evidence in the question. Never guess and build.

Simplicity clamp: prefer the smallest diff that satisfies the acceptance criteria. Three
similar lines beat a premature abstraction. Do not introduce structure beyond what this
brief, the plan and the note name. If you believe the spec needs more structure than
allowed, stop and report why instead of building it.

## Where things are

- Worktree (the ONLY checkout to work in):
  `C:\Projects\get-stuff-done\.claude\worktrees\skin-campaign`, branch
  `chore/upstream-bump-1.9.1`, draft PR 69. The main checkout is another branch with a
  stale handoff; ignore it.
- Done: plan Steps 0, 1, 2, and the first two seams of Step 3 (names and comparison
  keys; the lock). `bin/install.js` is unedited; nothing requires the new modules yet.
- A read-only Codex review (`gpt-6-astra`, `xhigh`) of the amended note and the lock seam
  finished 2026-09-19: **NOT PASS, one BLOCKER, five HIGH, two MEDIUM.** Verbatim:
  `docs/reviews/installer-lock-seam-codex-review-2026-09-19.md`; packet beside it. The
  author's preliminary assessment and a proposed disposition per finding are in
  `docs/reviews/installer-rollback-design-review-2026-09-18.md`, "Sixth review". NOTHING is
  dispositioned.
  FIRST UNIT of your first session: take the owner through the eight rows and record the
  owner's disposition of each in that section (fix now, defer with owner and trigger, or
  reject with rationale). You are the same vendor as the reviewer: the owner decides every
  row, you do not.
  **The BLOCKER is in the lock seam itself** (a takeover can remove a live holder's lock).
  Do NOT start the preflight-and-snapshot seam until the owner has dispositioned finding 1
  and the lock is fixed accordingly, RED first, with its mutants. Findings 1, 3, 4 and 7
  change `acquireLock` and its cases, which are inside your allowlist once approved.
  Findings 2, 6 and 8 amend the design note and finding 5 edits `scripts/expect-red.cjs`:
  both are outside the allowlist below until the owner says otherwise.
- GitHub Actions is ACCOUNT-LOCKED (billing) since 2026-09-19T02:05Z: every job reports
  zero steps. DO NOT PUSH while it is locked; commits stay local. Check before the first
  push of any session:
  `gh run list --branch chore/upstream-bump-1.9.1 --workflow CI --limit 1 --json databaseId --jq ".[0].databaseId"`
  then `gh api repos/chudeemeke/get-stuff-done/actions/runs/<id>/jobs --jq ".jobs[] | [.name, .conclusion, (.steps|length)] | @tsv"`.
  Zero steps everywhere means still locked. Everything since `897116f9` is measured on
  win32 only. When it clears: push once, read the three-platform result of both
  expected-red gates before building further, and trigger a CI run on `main`
  (`9f008c4d`; PR 72 merged while locked and never ran).

## Scope allowlist (everything else is read-only)

`bin/lib/install-transaction.js`, `tests/coverage/install-transaction.test.cjs`,
`tests/helpers/fault-fs.cjs`, `scripts/install-transaction-mutants.cjs`, this brief, the
plan's status header, `.planning/HANDOFF.json`, `.planning/CONTINUE.md`, the review
record named above. `bin/install.js`, the workflows, `scripts/expect-red.cjs` and the
other suites belong to plan Steps 4 and 5: do not touch them during Step 3.
`bin/lib/install-names.js` is complete; changing the names table is an owner decision.

Prohibitions: no new dependency; no new module; no new port beyond the plan's list
(`fs`, `platform`, `now`, `pid`, `signalProcess`, `newId`, `freeBytes`); no new export
(the suite pins the module's exports to `OPERATIONS` and `createInstallTransactionApi`);
no logger and no printing from the module; no mutation switch or test hook in product
code; no CLI, flag or environment surface; no `--no-verify`; no force-push; no bare
`git stash`; no AI attribution in commits (author `Chude <chude@emeke.org>`).
No test, script or manual run may target the real `~/.claude`: every fixture is a fresh
temp directory. The installer never opens a file outside its roots.

## Exemplar: match the lock seam

Read `bin/lib/install-transaction.js` and the `lock` cases before writing anything.
The shape to repeat:

- Operations are closures inside `createInstallTransactionApi`, reading ports
  destructured ONCE at the top. No `port || default` inside an operation: each would be
  an uncoverable branch pair.
- Default ports are references (`Date.now`, `process.kill`), never wrapper functions, so
  the 100 percent function gate needs no test-only indirection. Add `platform:
  process.platform` and `freeBytes` the same way when their seam lands (`freeBytes` needs
  a small function over `fs.statfsSync`; cover it with a real temp directory).
- A landed operation is registered in the `landed` map; the rest keep throwing
  `not implemented: <name>`.
- Refusals are `InstallRefusal` (exit code 6) built by small module-level functions that
  hold the exact message. Messages come from the note verbatim where the note gives them.
- Unexpected filesystem errors become a refusal or a collected per-entry error, as the
  note says for that step; they never escape raw.
- Tests use real temp directories, plus `fsWith({ call: replacement })` to inject a
  fault or to let a "rival" act first. Every case asserts message, exit code AND the
  bytes or directory listing left behind.
- In test and product source, spell invisible or composed characters as numeric code
  points (`String.fromCodePoint(0x301)`), never as escapes.

## Per seam: the loop

1. Show the owner the seam's shape; get approval.
2. RED: add the seam's cases. Run `node scripts/expect-red.cjs install-transaction-coverage`.
   It must exit 0 with every new case failing as `not implemented: <operation>`.
3. GREEN: implement until only later seams' cases fail.
4. Gates, one at a time, never in parallel, never while `bun run compose` runs, output to
   a file and the exit code read from the bare command (never through a pipe):
   - `node scripts/expect-red.cjs install-transaction-coverage`: exit 0, and both modules
     at 100 on statements, branches, functions and lines in its printed table.
   - Add the seam's decision points to `MUTANTS` in
     `scripts/install-transaction-mutants.cjs`; `bun run test:mutants:install-transaction`
     must end `survivors: 0`.
   - `bun run lint`: 0 errors, and no new warning in the files you touched.
   - `bun run test` under PINNED bun 1.3.5: read the summary line (`Ran N tests across M
     files`, 0 fail), not the exit code alone. 2026-09-19 baseline: 1796 pass, 70 files.
     The machine's default bun is newer and produces false reds. Put this first on PATH:
     `C:\Users\Destiny\AppData\Local\npm-cache\_npx\bb6645c1041000be\node_modules\@oven\bun-windows-x64-baseline\bin`
     and confirm `bun --version` prints 1.3.5 (if that cache is gone:
     `npx -y -p bun@1.3.5 bun --version`, then find `bun.exe` under `_npx`).
5. One commit per seam. The message states the case counts, the coverage numbers, the
   mutant result and the full-suite summary, and "win32 only" while CI is locked.
6. Update the plan's status header, `.planning/CONTINUE.md` (new top block, stamp the old
   one) and `.planning/HANDOFF.json` (new dated section, `READ_FIRST`, `SECTION_INDEX`).
   Claude Code may be the next harness; it reads the same files.

Report to the owner after each seam: what changed; one line of WHY for every choice the
note did not dictate; the gate evidence; anything you saw and did not fix.

## Seam order (one change from the plan, with its reason)

preflight and snapshot; journal; plan, apply, verify; recover and retire; commit and
prune; RENDER LAST. The plan put render sixth. Reason for the move: the ten `render:`
cases are the only RED cases left, and `scripts/expect-red.cjs` fails with "UNEXPECTED
PASS" the moment no case fails. Render is pure and nothing in Step 3 depends on it, so
landing it last keeps the gate in its approved shape until plan Step 5 flips both gates
together, with no early workflow edit. The owner may veto this.

`renderOutcome` is already fully specified by its ten cases and the note's step 9 and 10
wording; its outcome shapes (`applied`, `incomplete`, `recovered`, `refused`, `misuse`,
`committed`, and the retired-transaction notice) are the contract every earlier seam
must PRODUCE. Read those cases before designing any return value.

## Proposed shapes (proposals until the owner approves them seam by seam)

All paths in an index are target-relative with `/` separators, stored names exact;
`names.comparisonKey(name, platform)` decides sameness.

Preflight and snapshot (note steps 2, 3, 4, 7; readings: manifest roots, target absent,
pre-image digest, caps, links in patch trees):

- `openTransaction(targetDir, { distDir, manifestEntries, wrapperVersion })` where
  `manifestEntries` is `[{ manifest, entry }]` read by `bin/install.js`. Computes roots
  (top-level entries of `distDir`; first segment of each manifest entry, refused unless
  shipped or a Generated, Legacy or Observed name, and refused if Protected; the three
  name classes), refuses a link root, walks the roots recording directories, links (as
  target strings, never descended) and files, enforces the caps and the free-space
  formula BEFORE copying, copies files into `snapshot/` hashing copy and source (the
  variable is `digest`, never `hash`: eslint `detect-possible-timing-attacks` is an
  error), takes the one top-level `readdir`, and returns a frozen handle
  `{ id, dir, preImageTime, index, topLevelNames }`. Any read error deletes the
  incomplete `snapshot/` and refuses; nothing is committed. Two entries folding to one
  key refuse. A `snapshot/` with no journal found at preflight is deleted and reported.
- An ABSENT target: every refusal is decided first (free space on the nearest existing
  ancestor), then the directory is created, recording the first ancestor created.
  `acquireLock` refuses an absent target by design, so this creation must happen before
  the lock is taken; if the lock then refuses, remove only directories this run made,
  non-recursive `rmdir`, ignoring `ENOTEMPTY`. Where that orchestration lives
  (`openTransaction` cannot run before the lock) is an OPEN SHAPE QUESTION for the
  owner: the smallest answer is an `ensureTarget`-style step inside `acquireLock`'s
  caller contract, but it would be a seventeenth operation, which the pinned list of
  sixteen forbids. Ask before building.
- `snapshotPathOf(transaction, relativePath)`: the snapshot copy's path, for
  `preserveLocalPatchHistory`.

Journal (note step 5): `openTransaction` gains the journal write as its last act;
`recordExpectedWrite`, `markSpawning`, `recordChildPid`, `markChildClosed` each take the
handle, rewrite the journal by temp file and rename inside the transaction directory, and
bump last-updated from the `now` port. `inspectExisting(targetDir)` reads and mutates
nothing: it returns what a later run needs to decide step 10 (journal parsed or a refusal
for unparseable or unknown schema; stale by the EMBEDDED last-updated time, a future time
counting as stale; orphan snapshot; quarantines; retired-transaction notices).

Plan, apply, verify (note steps 8, 9): `planRollback(transaction)` returns an ordered
list of plain action objects from the CURRENT state; `applyRollbackAction(transaction,
action)` performs one and returns its collected error or null, idempotently;
`verify(transaction)` returns the mismatches; `rollback(transaction, { childExit })` is
plan, apply all, verify, write `moved.txt`, then delete journal then snapshot (applied)
or retire (incomplete), and returns an `applied` or `incomplete` outcome in the exact
shape the render cases use. Outcome rule: `incomplete` if ANY error was collected OR
verification found a mismatch.

Recover and retire (note step 10): `recover(targetDir, inspection)` and
`retire(targetDir, inspection)` return `recovered` outcomes and the notice shape.
Commit and prune (note step 11): `commit(transaction, { placedFiles })` returns
`committed` with `warnings`.

## Known traps on this machine

- Every shell command starts with an explicit `cd` into the worktree, and
  `git branch --show-current` is checked before any commit.
- Never send text containing a backslash through a heredoc or an inline `node -e`
  argument; write a file, then `node --check` it.
- At most three process-heavy shells at once; MSYS deadlocks beyond that.
- Three untracked `.planning/evidence/pr69-*-2026-09-14.log` files are old evidence that
  exists only on this disk. Leave them.
- PR 4 closure is NOT authorized. Main is nominally red (two Windows timeouts on
  `323b4708`) and cannot be rerun while the account is locked.

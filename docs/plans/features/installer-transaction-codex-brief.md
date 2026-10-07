# Codex brief: continuing the installer transaction (PR 69, plan Step 3 onward)

Status: written 2026-09-19 by the Claude Code session that landed the lock seam
(`4eb3201f`), at the owner's request: Anthropic quota is ending for the week and Codex
continues this work. Read this file after `.planning/CONTINUE.md`.

Authority, highest first: latest explicit owner decisions; the design note's current
authority section (`docs/reviews/installer-rollback-redesign-2026-09-18.md`); the skin
completion contract and `docs/plans/features/skin-completion-execution-2026-09-19.md`;
the reconciled installer plan; this brief. The latest accepted holistic directions
supersede conflicting earlier installer D3/D4 readings. Campaign D1-D11 remain
unchanged. Where two differ, use the current authority and report the conflict.

## Current assessment result,2026-09-22

The approved section24 Claude/Codex source compatibility assessment is complete;
see execution-plan section24's September22 map and source-bound receipt
`.planning/evidence/p07-section24-compatibility-2026-09-22.json`.
Recommendation is private preparation/final-path qualification with separately
owned publication, not whole-runtime generation switching as the next build.
Neither delivery model has implementation approval. F1/F2 Codex path findings,
mutable agent/profile surfaces, distinct state roots and qualification gates are
recorded there. NEXT prepare a concrete Q1/Q2 packet before execution approval.
No new experiment or product seam follows from assessment completion. Section23
remains withdrawn; campaign D1-D11 and accepted safety requirements remain binding.

## Owner direction, 2026-09-19: completion and value

Latest decision: the owner accepted the holistic review's suggestions,
recommendations and preferred direction, including all eight repair directions and
H1-H8. The design note now has an authoritative current-policy addendum. Child safety
outranks age, one persisted automatic rollback attempt replaces automatic replay,
and mutable quarantine is retained unless deletion safety is proved. Historical
installer D3/D4 conflicts are superseded explicitly; campaign D1-D11 are unchanged.

The owner requested an actionable, verifiable route to project completion. Read
`docs/plans/features/skin-completion-execution-2026-09-19.md` for R1-R10 acceptance,
P00-P30 work packages and upgrade subpackages. P03 validator contract and P07 combined
lock protocol/API approval still precede RED tests. Do not re-ask the eight policy
questions. No preflight/snapshot implementation in this session.

UPDATE: the owner selected "Compare value first" and authorized the disposable
comparison. It is complete; read `docs/reviews/opengsd-value-comparison-2026-09-19.md`
before resuming implementation. The recommendation is to retain a reduced skin,
not switch directly to stock upstream. The owner accepted that direction on
2026-09-19: preserve measured protections, retire duplication only after parity
proof, and resume the eight lock-review dispositions. No individual retirement is
approved merely by accepting the direction.
The initial assessment below is retained as chronology, not the final verdict.

The owner reactivated the September 5 completion objective in the Codex goal tracker:
finish the existing contract, preserve decisions and concurrent work, and deliver a
polished, robust, useful tool with concrete requirements and explicit verification
and validation outcomes. The owner also asked whether maintaining this project still
adds value over using current Open-GSD. This is a request for a candid assessment,
not authorization to abandon the project, change its fixed 1.12.0 destination, migrate
an installation, or reopen the fifteen installer decisions.

Verification must establish that the specified behavior works. Validation must
establish that the resulting tool helps the owner enough to justify maintaining it.
The existing `.planning/SKIN-COMPLETION.md` acceptance map remains the contract.
The following makes its completion evidence explicit; it does not certify attainment:

| Requirement | Completion evidence required |
|---|---|
| Safe installation and updates | Isolated fresh/upgrade/no-op/conflict/interruption/recovery scenarios; owner bytes preserved; exclusive lock ownership; messages and exit codes match observed outcomes. Cover supported runtime/platform combinations and record unavailable native evidence as open. |
| Reliable continuity | Actual interrupted work resumes the correct checkout, task and decisions; state writers preserve required metadata; coherent publication acceptance includes its owning project's protocol receipt. |
| Working daily workflow | An installed candidate completes representative discuss/plan/execute/verify/ship preparation flows in disposable projects, with traceable artifacts and no hidden manual repair. Merges remain owner-gated. |
| Enforced quality | Per-file and per-package risk tiers from the shared quality contract; Tier A >=95% in each metric; Tier S 100% branches plus adversarial and mutation/equivalent decision checks; reviewed Tier B exceptions only. Missing/stale evidence and deliberately broken controls fail gates. |
| Release readiness | Final-revision tests, build, lint, security and attributable review evidence; required hosted checks actually execute and pass on the final commit. Installed artifacts match the approved source and receipt. |
| Demonstrated usefulness | Preserve ratified D11 targets and their provisional interpretation below. Record task correctness, missed defects, recovery, owner interventions, tokens/cache and elapsed time for matched tasks and model settings. Include held-out tasks. Any supplementary comparison rubric is agreed before measuring; do not invent a benefit threshold after seeing results. |
| Maintainable scope and closure | Each retained difference has a named user need, a reproducer/acceptance case, an owner and a retirement trigger. Classify remaining issues and reconcile roadmap, inbox, artifact and installed state. No completion claim from a merged PR alone. |

Initial assessment (source/document inspection only, no new behavioral measurements):

- This worktree pins `@opengsd/gsd-core` 1.9.1. The fixed completion target is 1.12.0.
- The official release page inspected on 2026-09-19 identifies 1.14.0 as latest:
  <https://github.com/open-gsd/gsd-core/releases/tag/v1.14.0>. Its notes describe
  workflow payload reduction, external reviewer lanes, state/progress fixes and path
  containment work. These overlap areas of interest; release notes do not prove that
  any specific fork acceptance case is satisfied.
- `tests/acceptance/README.md` retains a September 5 pure-1.12.0 result of 9 passing
  and 3 failing state cases. That is historical evidence, not a current-1.14.0 result.
- The lock remains NOT PASS; the eight sixth-review findings remain undispositioned.
- The contract's inbox source path is absent in this worktree. The checked-in
  acceptance map is available, but full source-contract traceability needs recovery
  within owner-authorized paths before claiming complete reconciliation.

Recommendation, not an owner decision: perform one bounded comparison of exact
current-upstream bytes, the existing skin, and upstream plus only necessary additive
configuration/skills. Separate user benefits from work needed only to maintain a
separate distribution. Prefer the smallest option meeting the owner's requirements;
preserve the existing work and require an explicit owner decision before changing
delivery direction. Trial files or edits outside the current allowlist need scope
approval. No installer implementation resumed during this initial assessment.

### Recovered decision and comparison map (read-only follow-up, 2026-09-19)

Source-location correction,2026-09-21: both the September5 completion contract and
September2 engine/prose ratification exist in MAIN docs/inbox. Owner clarification
authorized reading the central inbox; source texts/hashes are retained in
`.planning/evidence/p07-original-contract-recovery-2026-09-21.json`. The missing-path
statements below describe the earlier worktree-only search, not absent authority.
The existing acceptance map and D1-D11 remain unchanged. Section23 of the execution
plan is a reviewed, unapproved containment-policy proposal; no product API or new
experiment follows from its preparation. Main planning/source remain untouched.

The original inbox contract was not found in this worktree's inbox, archives or Git
history for its exact path. The ratification itself is retained in commit `38504333`
and `.planning/HANDOFF.json` -> `bump_arc` -> `sequencing_decision_resolved` ->
`decisions_recorded_2026_09_05`. It records:

- D11: Conversations re-runs its Phase 24 `--reviews` replan on the lean profile
  against the September 1 baseline. Provisional targets: orchestration read <8k
  tokens, planner prompt <300 lines, total <300k tokens, and checker catches the
  injected error without a hand brief. A numerical miss triggers review of target
  and change together, not automatic failure.
- D4 keeps the subagent planner and tries the per-plan research digest first.
- D6 does not enable Prompt Golf as a mechanism. Reading current upstream's payload
  changes does not authorize changing that decision.
- D5 fixes the delivery endpoint at 1.12.0, then quarterly vetted updates. Evaluating
  1.14.0 as an alternative does not silently advance the delivery endpoint.

| Claimed benefit | Existing evidence or reusable case | What remains to decide |
|---|---|---|
| Correct phase, milestone and plan accounting | `tests/runtime-overrides.test.cjs`, `tests/init.test.cjs`, `tests/roadmap.test.cjs`, `tests/state.test.cjs`; individual override reasons | Run behavioral cases against the exact alternative. Fork-specific diagnostic fields are not by themselves user requirements. |
| Metadata preservation and docs commits | `tests/acceptance/state-delivery.cjs`; retained Windows and Linux pure-1.12 TAP both show 9 pass, 3 fail | Current-upstream behavior is unmeasured. Distinguish changed CLI contracts from lost capabilities. |
| Byte-preserving roadmap writes | `tests/fork-roadmap-persistence.test.js`; roadmap override reason | Establish which byte/ACL guarantees the owner needs and whether the alternative provides them; do not treat an adapter-only unit suite as an upstream comparison. |
| Safe installer ownership and recovery | `tests/installer-cli-safety.test.js`, `tests/acceptance/installer-recovery.cjs`, six-round review record | The CLI suite targets this repo's wrapper directly; a green run cannot establish pure-upstream behavior. Isolated upstream scenarios need an explicit candidate entry point. |
| Planner digest and reviewer effort | `skin-1.12-pure-agent-skills-probe.json` and `skin-1.12-pure-effort-write-probe.json` under `.planning/evidence/` record native routing/sync in disposable Claude and Codex installs | Historical seam proof only. Actual digest consumption, useful checker output and D11 performance remain open. Prefer native configuration/skills when they satisfy the same behavior. |
| Branded distribution and update routing | Hook override reasons specify fork package identity and throttles | Separate owner-needed update policy from work required only to keep a separate package alive. |

At this read-only follow-up, comparison execution was still awaiting the owner's
answer. That wait is superseded by the authorized comparison report above. The
historical results in this subsection are not fresh acceptance of either candidate.

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
  author's preliminary assessment and the current owner dispositions are in
  `docs/reviews/installer-rollback-design-review-2026-09-18.md`, "Sixth review".
  All eight fix directions and holistic recommendations are now accepted by the
  owner. No implementation fix is accepted. See the latest direction at the top
  of this brief and the execution plan's P03/P07 approval packets.
  The eight-row disposition loop is complete through the owner's holistic acceptance.
  Next: prepare concrete validator and combined-lock contract packets, then execute
  the approved packages. The author's historical proposals are not approved algorithms.
  **The BLOCKER is in the lock seam itself** (a takeover can remove a live holder's lock).
  Do NOT start the preflight-and-snapshot seam until the owner has dispositioned finding 1
  and the lock is fixed accordingly, RED first, with its mutants. Findings 1, 3, 4 and 7
  change `acquireLock` and its cases, which are inside your allowlist once approved.
  Findings 2, 6 and 8 amend the design note and finding 5 edits `scripts/expect-red.cjs`.
  The owner approved the bounded extensions below and the subsequent holistic policy
  amendments to the design note. Exact implementation shapes still need approval.
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
Owner-approved section21 experiment, 2026-09-21: only
`.claude/p07-containment-spike-2026-09-20/` experimental sources/builds/fixtures and
`.planning/evidence/p07-containment-spike-2026-09-20/` receipts, plus existing
planning/continuity paths. One Windows NTFS candidate, three cases, nine claims,
one initial run each, at most one defect correction. Section21 owns exact controls,
report and stop rules. No production dependency/module/port/API approval follows;
lock RED tests and preflight/snapshot remain outside this approval.

Owner-approved section20 amendment, 2026-09-20: supersede section19's literal
home equality with complete before/after home-state observations and the exact five
Windows runtime-owned paths and type restrictions in execution-plan section20.
Rename both identities to home-outside-target-preserved; retain27 checks and the
14PASS/13FAIL target. Privately redirect app-data/cache variables before snapshots.
This approval authorizes dependent RED/GREEN work in the existing three paths.

Owner-approved section19 amendment, 2026-09-19: add fresh and upgrade
home-outside-target preservation oracles in the same validator/test/harness paths.
Both always PASS with empty tree-delta observations;27 reviewed checks, expected
14PASS/13FAIL subject to fresh proof. Seed only disposable home data; exclude only
the exact install target from each outside-target comparison. Judge arguments and
context shape unchanged. Section20 now supersedes this observation and naming rule.

Owner-approved bounded lint extension, 2026-09-19: `eslint.config.js` may add only
`scripts/expect-red.cjs` and `tests/acceptance/installer-recovery.cjs` to existing
rules, retaining existing test overrides for the harness. Negative RED/GREEN
enforcement controls belong in the already-approved `tests/expect-red.test.js`.
No rule severity or installer API change is authorized by this extension.

Owner-approved evidence relocation, 2026-09-19: move only the extracted1,074-file
upstream comparison snapshot from `.planning/evidence/value-comparison-2026-09-19/package`
to `.claude/value-comparison-2026-09-19/upstream-package`, with before/after path,
size and SHA256 verification and a retained receipt. Completed; historical reports
and archive retained. No lint configuration change is authorized by this move.

Owner-approved P03 amendment after Opus5/xhigh review: include
`tests/acceptance/installer-recovery.cjs` solely for complete structured failure
observations, harness source identity and an independent upgrade owner-preservation
PASS row (25 checks). Exact amended validator arguments, host/runtime evidence and
schemas are in completion-plan section16. Original validator paths remain approved.
P04/P05 may proceed RED/GREEN; the lock API and snapshot boundary are unchanged.

RED-loop correction: new bug-reproducing assertions run through the ordinary
focused test command and MUST fail before the fix. Do not add their failures to an
expected-red allowlist. The old instruction that every new RED must pass expect-red
as `not implemented` applies only to a deliberately approved new unimplemented seam,
not repairing existing code. Preserve genuine RED separately from harness refusal.

Owner extension, 2026-09-19, Sixth-review finding 2: amend
`docs/reviews/installer-rollback-redesign-2026-09-18.md` step 8(c) and its required
proof for completed private staging and exclusive hard-link publication, keeping
the snapshot separate. Implementation remains in the later restore seam, with its
argument/return shape approved before tests. Subsequent owner acceptance also
authorizes the holistic design-policy addendum for findings 6/8 and H1-H8. It does
not authorize starting preflight/snapshot implementation in this session.

Planning extension from the owner's completion request:
`docs/plans/features/skin-completion-execution-2026-09-19.md` and continuity updates.
This creates no blanket source/test/workflow scope extension for later packages.

Owner extension, 2026-09-19, Sixth-review finding 5: fix the expected-red validators
and add negative controls in `scripts/expect-red.cjs`, `tests/expect-red.test.js` and
`tests/fixtures/expect-red/`. Require complete check inventories, an explicit permitted
failure set and affirmative coverage evidence. Present the validator contract for
owner approval before RED tests. This extension does not authorize changing workflows
or lowering any quality requirement.

`bin/lib/install-transaction.js`, `tests/coverage/install-transaction.test.cjs`,
`tests/helpers/fault-fs.cjs`, `scripts/install-transaction-mutants.cjs`, this brief, the
plan's status header, `.planning/HANDOFF.json`, `.planning/CONTINUE.md`, the review
record named above, plus the bounded owner extensions just listed. `bin/install.js`,
the workflows and suites outside those extensions belong to plan Steps 4 and 5:
do not touch them during Step 3.
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

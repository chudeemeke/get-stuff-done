# Cold review: P07 prerequisite mechanism decision
Owner explicitly requests Opus 5 at xhigh. Review only the supplied packet; no tools, commands or edits. Return PASS, PASS WITH CHANGES, or NOT PASS with numbered findings. This is approval of a bounded feasibility study, NOT approval of production code/API or platform claims. Challenge whether section21 is the smallest useful next step and its source/report/safety boundaries are concrete. Do not accept a native helper as proven merely from citations. Inspect contradictions, impossible guarantees, wasted work, missing outcomes, scope and implementation feasibility. Distinguish blocking corrections from optional improvements. Do not invent runtime execution or source verification. Full code/plan are supplied to avoid forgetting the existing contract. Section21 is the new proposal; sections13-14 and the current-authority block constrain it. No product lock changes/tests are permitted yet. Existing P04/P05 verified work must be preserved. Any needed change beyond the existing allowlist requires owner approval; the proposed study requests exactly that extension. Owner does not want repeated approval for already-approved validator work.

# Current design authority
# Installer rollback redesign: observe, do not predict

## Current authority: owner acceptance after holistic review, 2026-09-19

The owner accepted all eight repair directions and the integrated recommendations
in the Sixth-review holistic assessment. This section supersedes conflicting
historical text below, including the earlier fixed installer D3/D4 decisions; it
does not change the separate campaign D1-D11 decisions. Historical wording is
retained for traceability, not as an alternative executable contract. The detailed
operation arguments/returns, filesystem support and durability mechanisms remain
subject to approval before tests. Implementation has not been accepted.

- Lock ownership: publish completed lock contents exclusively; distinguish every
  acquisition and make release terminal. Automatic takeover is permitted only with
  proof of the complete acquire/takeover/release protocol. Foreign or unknown
  liveness domains refuse; platform/hostname alone are not a proof. Report retained
  lock metadata and cleanup errors. The old rename/verify/link-back protocol below
  is rejected. No OS-lock adapter or identity-marker candidate is approved merely
  by accepting this policy.
- Child safety: a live or unknown child blocks recovery/retirement that would
  permit another writer, regardless of journal age or clock direction. First
  establish quiescence; only then use freshness to select policy. A recorded valid
  child-closed state is distinct from guessing that a PID has gone away.
- Before rollback changes any installation entry, persist and validate permission
  for one automatic attempt, tied to the transaction. Failure or uncertain record
  persistence grants no permission. An existing/partial attempt record never grants
  a later invocation permission to replay rollback. Invalid or incompatible evidence
  refuses automatic mutation. Record the result separately after the pass.
- An interrupted attempt, incomplete result or missing result after an attempt is
  preserved and diagnosed; later invocations inspect and may safely retire it, but
  do not automatically restore again into newer owner edits. This supersedes fresh
  journal replay and automatic mid-rollback resumption below. An eligible fresh
  journal with no prior attempt may still begin its first recovery attempt.
- Rollback result, current verification and metadata cleanup are separate facts.
  Failed retirement after an incomplete attempt retains exit 4, reports actual live
  paths and errors, and preserves journal/snapshot/quarantine. Retiring moves retained
  data; it does not establish successful restoration. No new installation starts
  against an unresolved live transaction. Finish recovery/retirement invocation
  before starting a new install. A later ordinary install uses the current roots
  as its baseline and must report retained retired data.
- A verified result may support completion of metadata cleanup without redoing
  restoration. Persisted attempt/result records take precedence over the historical
  rule to delete every snapshot lacking a journal: inconsistent or unexplained
  evidence is retained, not blindly deleted. Define all cleanup-crash states in the
  approved lifecycle and outcome contract before implementation.
- Keep finding 2's completed private staging and exclusive publication; never link
  snapshot bytes or write to the published restore. Preserve existing collision
  bounds and per-entry errors. Preflight path checks alone do not establish safe
  containment under concurrent topology changes; the supported mechanism must be
  proved or the operation refused. Links must not be moved inside a bulk directory
  move. Retain unsafe structures as incomplete rather than claim a scan closes races.
- Mutable quarantine is retained unless safe deletion can be established. A hash
  comparison alone does not make deletion safe against an active writer. Explicit
  owner cleanup is preferred to an unproved automatic prune. This supersedes the
  byte-equality-only quarantine deletion rule in step 11; unrelated patch-history
  retention remains unchanged unless separately dispositioned.
- Cleanup only files exclusively created by this run; preserve collision files.
  Report partial-write residue and both primary/cleanup errors. Refusal language
  must distinguish installation-content changes from transaction metadata and prior
  attempts; the unqualified "nothing was touched" claim is not valid with residue.
- Claims describe the captured pre-image and actual verification, not a globally
  atomic snapshot of a live tree. Process-crash safety and power-loss durability
  need separate evidence. Uninstall instructions reflect retained state and must
  not promise that one retry clears a journal. Exact text/exits remain part of the
  owner-approved outcome shape.

See `docs/plans/features/skin-completion-execution-2026-09-19.md` for the dependency
order, completion evidence and retained boundaries. The historical steps, proof
cases and decision records below must be reconciled against this section in the
protocol work package before tests; they must not be copied into tests unchanged.

## Historical design and decision chronology

# Scope
## Scope allowlist (everything else is read-only)
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

# Current lock source
'use strict';

// The install transaction: lock, journal, copy-only pre-image, rollback by quarantine
// and restore, verification before any claim, recovery of an interrupted run.
// Contract: docs/reviews/installer-rollback-redesign-2026-09-18.md. Requires the names
// table and Node builtins only; bin/install.js depends on this module, never the
// reverse. It returns outcomes and never prints: renderOutcome turns an outcome into
// lines and an exit code, and the caller prints them.
//
// PARTIAL: the lock has landed. Every other operation throws until its seam lands
// (plan Step 3). Nothing requires this module yet.
const crypto = require('node:crypto');
const nodeFs = require('node:fs');
const path = require('node:path');

const OPERATIONS = Object.freeze([
  'acquireLock',
  'inspectExisting',
  'openTransaction',
  'snapshotPathOf',
  'recordExpectedWrite',
  'markSpawning',
  'recordChildPid',
  'markChildClosed',
  'planRollback',
  'applyRollbackAction',
  'verify',
  'rollback',
  'recover',
  'retire',
  'commit',
  'renderOutcome',
]);

// Protected names (install-names.js). A dead holder's lock is moved to
// <lock>.stale-<id>; this run's lock waits at <lock>.stale-<id>.new until it is
// published. Both belong to the one protected family, so residue a crash leaves behind
// is recognised and never treated as an entry someone else made.
const LOCK_NAME = 'gsd-install.lock';
const CLAIM_INFIX = '.stale-';
const PENDING_SUFFIX = '.new';

// Every default is a reference, not a wrapper, so no port has a path of its own to cover.
// The remaining ports (platform, freeBytes) arrive with the seams that use them.
const DEFAULT_PORTS = Object.freeze({
  fs: nodeFs,
  now: Date.now,
  pid: process.pid,
  signalProcess: process.kill,
  newId: crypto.randomUUID,
});

// A refusal is decided before any mutation: exit 6 always means nothing was touched.
class InstallRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'InstallRefusal';
    this.exitCode = 6;
  }
}

const IF_NONE_RUNNING = 'If no installer is running, delete that file and run again.';

function heldBy(holder, lockPath) {
  return new InstallRefusal(`Another install appears to be running (pid ${holder.pid}, lock ${lockPath}, `
    + `created ${holder.created}). ${IF_NONE_RUNNING}`);
}

function unreadable(lockPath) {
  return new InstallRefusal(`An install lock exists but cannot be read (lock ${lockPath}). ${IF_NONE_RUNNING}`);
}

function changedHands(lockPath) {
  return new InstallRefusal(`The install lock changed hands while this run was starting (lock ${lockPath}). `
    + 'Run again. If it still refuses and no installer is running, delete that file and run again.');
}

function notCreated(lockPath, error) {
  return new InstallRefusal(`The install lock could not be created (lock ${lockPath}): ${error.message}. Nothing was changed.`);
}

// The creation time is printed verbatim in a refusal, so only the exact form this module
// writes is accepted from a file.
function isUtcInstant(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

// One factory, ports merged over defaults, so a missing port is never a branch inside
// an operation.
function createInstallTransactionApi(ports) {
  const { fs, now, pid, signalProcess, newId } = { ...DEFAULT_PORTS, ...ports };

  // 'held' carries the holder's pid, its creation time and the exact text; 'absent' and
  // 'unreadable' carry nothing, so their text never equals a real lock's.
  function readLock(file) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (error) {
      return { state: error.code === 'ENOENT' ? 'absent' : 'unreadable' };
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { state: 'unreadable' };
    }
    const { pid: holder, created } = Object(parsed);
    if (!Number.isInteger(holder) || holder <= 0 || !isUtcInstant(created)) return { state: 'unreadable' };
    return { state: 'held', pid: holder, created, text };
  }

  // Dead only when the probe says so. Alive, owned by another user (EPERM) and any other
  // answer all leave liveness undecided, and an undecided holder is never taken over.
  function isDead(holder) {
    try {
      signalProcess(holder, 0);
      return false;
    } catch (error) {
      return error.code === 'ESRCH';
    }
  }

  // A link fails if the name exists, and the file it publishes is already complete, so
  // the lock is never observable empty. True when this run's lock is now the lock.
  function publish(pending, lockPath) {
    try {
      fs.linkSync(pending, lockPath);
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') return false;
      throw error;
    }
  }

  function removeQuietly(file) {
    try {
      fs.unlinkSync(file);
    } catch {
      // Residue under a protected name is harmless; failing the run over it is not.
    }
  }

  // Reached only when a lock exists. This run proceeds only if the holder is proved dead
  // AND its own rename moved that exact lock AND its own lock is then published first.
  function takeOver(lockPath, claim, pending) {
    const holder = readLock(lockPath);
    if (holder.state === 'absent') throw changedHands(lockPath);
    if (holder.state === 'unreadable') throw unreadable(lockPath);
    if (!isDead(holder.pid)) throw heldBy(holder, lockPath);
    try {
      fs.renameSync(lockPath, claim);
    } catch (error) {
      if (error.code === 'ENOENT') throw changedHands(lockPath);
      throw error;
    }
    // A rename is not a compare-and-swap: between the read and the rename a rival may
    // have taken over, and then the file this run moved is the rival's LIVE lock.
    const movedTheDeadLock = readLock(claim).text === holder.text;
    const published = movedTheDeadLock && publish(pending, lockPath);
    if (!movedTheDeadLock) {
      try {
        fs.linkSync(claim, lockPath);
      } catch {
        // A third run took the lock in the gap. Its lock stands; the rival's is lost,
        // which its own release tolerates. Recorded as a residual risk of the design.
      }
    }
    removeQuietly(claim);
    if (!published) throw changedHands(lockPath);
  }

  // The target must exist: creating it belongs to preflight, after every refusal that
  // can be decided without it (note, "Readings settled", target directory absent).
  function acquireLock(targetDir) {
    const lockPath = path.join(targetDir, LOCK_NAME);
    const claim = `${lockPath}${CLAIM_INFIX}${newId()}`;
    const pending = `${claim}${PENDING_SUFFIX}`;
    const text = JSON.stringify({ pid, created: new Date(now()).toISOString() });
    try {
      fs.writeFileSync(pending, text, { flag: 'wx' });
    } catch (error) {
      throw notCreated(lockPath, error);
    }
    let tookOver = false;
    try {
      if (!publish(pending, lockPath)) {
        takeOver(lockPath, claim, pending);
        tookOver = true;
      }
    } catch (error) {
      throw error instanceof InstallRefusal ? error : notCreated(lockPath, error);
    } finally {
      removeQuietly(pending);
    }
    // Deletes the lock only while it still holds this run's exact text, and never
    // throws: a lock left behind names a pid that is about to exit, so the next run
    // takes it over.
    const release = () => {
      if (readLock(lockPath).text === text) removeQuietly(lockPath);
    };
    return Object.freeze({ path: lockPath, tookOver, release });
  }

  const landed = new Map([['acquireLock', acquireLock]]);
  return Object.freeze(Object.fromEntries(OPERATIONS.map(name => [name, landed.get(name) || (() => {
    throw new Error(`not implemented: ${name}`);
  })])));
}

module.exports = Object.freeze({ OPERATIONS, createInstallTransactionApi });


# Execution plan
# Reduced-skin completion: execution and acceptance contract

Date: 2026-09-19. Owner: Chude. Implementing owner: this project's Codex session.
Status: accepted design direction recorded; execution plan prepared; product work
not accepted. This is an execution addendum to `.planning/SKIN-COMPLETION.md`, not
a new strategic audit or replacement project. Current checkout: ONLY
`C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign`, branch
`chore/upstream-bump-1.9.1`, baseline HEAD `e50bda5b` plus preserved local work.

## 1. End state and authority

Deliver the smallest useful Open-GSD skin at the fixed upstream 1.12.0 endpoint,
preserving measured routing/state/installer protections and using native upstream
features where parity is proved. It must install/update/refuse/recover truthfully,
preserve owner data, resume the correct work, and make the retained custom behavior
worth its maintenance cost. It is done only when the acceptance rows below have
current attributable evidence and the owner's deployment/acceptance gates are met.

Authority: latest explicit owner decisions; current-authority section in
`docs/reviews/installer-rollback-redesign-2026-09-18.md`; the skin completion
contract and campaign D1-D11; this execution addendum; reconciled seam briefs.
Historical text loses to a newer explicit decision. The original source-contract
inbox file is absent in this worktree: recover its traceability from permitted Git
history/artifacts before final closure, without reading the forbidden main checkout.

The owner accepted the holistic review, all eight repair directions and H1-H8:

- Child liveness outranks age/future clocks; never enable a second writer while a
  previous child is alive or unknown.
- Persist one automatic rollback attempt before root mutation; later uncertain or
  incomplete attempts do not automatically replay against newer edits.
- Keep mutable quarantine unless deletion safety is established; byte equality
  alone is insufficient. Separate result, location, current observation and cleanup.
- Keep staged exclusive restoration, unique lock identity, terminal release, strict
  evidence validators, owned-temp cleanup and stronger link/containment handling.
- Refuse unsupported automatic operations. Prove platform/durability guarantees;
  do not silently narrow them to make an implementation pass.

These supersede the conflicting earlier INSTALLER D3/D4 readings. The CAMPAIGN
D1-D11 (including fixed 1.12.0, subagent planner, native skill integration, guard
retention and provisional D11 performance targets) remain binding.

## 2. One goal, one acceptance map, atomic work packages

Use one persistent project goal. This document defines its work packages; do not
create a new goal for every finding or treat a new session as a new project.
The goal was blocked when this plan was created. The owner subsequently resumed it;
the live tracker now reports ACTIVE. Its objective still contains the completed
value comparison, whose accepted outcome is recorded here. It has not been completed
or replaced. Do not clear it simply to manufacture a second tracker; execute the
remaining dependency-ready work under the current accepted decisions.

Suggested normalized wording if the owner later edits the goal:

> Complete the accepted reduced Open-GSD skin to the fixed 1.12.0 endpoint using
> docs/plans/features/skin-completion-execution-2026-09-19.md and the existing skin
> contract. Work only in the authorized skin-campaign worktree. Execute the next
> dependency-ready authorized package, prove its outcome, checkpoint and continue.
> Preserve measured protections and owner data; retire duplication only after parity
> proof. Complete R1-R10 with current source/artifact/runtime evidence and owner
> validation. Honour seam API approval, current-session scope, CI/no-push and real-home
> boundaries. Never approve/merge/mark ready or activate a real installation without
> the required owner authority. Do not declare completion while any mandatory
> acceptance row, required review or external/owner gate remains unresolved.

An automatic goal is persistence, not evidence. Its completion condition is the
acceptance matrix, not a token count, elapsed time, number of commits or green badge.

## 3. Acceptance matrix

All rows start OPEN. Historical evidence may guide work but cannot certify newer
source or artifacts. R1-R9 refine the existing nine contract rows; R10 makes the
already-required release/operational acceptance explicit.

| ID | Observable requirement | Verification evidence | Validation / closure condition |
|---|---|---|---|
| R1 | Exact supported source/artifact identity | Immutable 1.12.0 version/commit/integrity; compose and package manifests; source-to-artifact hashes and imports | Owner's fixed endpoint reached; no shadow edits, dynamic pin or accidental older runtime |
| R2 | Reduced, justified skin | Per-behavior retain/remove ledger, upstream parity experiments and override provenance at each bump | Each retained difference has an actual user need, acceptance case and retirement trigger; removals preserve behavior |
| R3 | Trustworthy quality evidence | Complete suite inventories; per-file/package/changed-line coverage; adversarial/mutation checks; negative gate controls; final-revision reviews | Gates reject known violations; no omitted files, fabricated greens or unowned exceptions |
| R4 | Useful installed tool | Disposable installed Claude/Codex entrypoints, route/import/skill/effort checks on declared supported platforms; packaging and no-op cases | Representative user tasks work from installed artifacts without manual source fixes; real activation remains separately gated |
| R5 | State integrity | Unknown-key preservation, partial config, plan counts, bullet/decimal phases, milestone routing, roadmap-byte fixtures; installed caller proof | Actual planning/resume selects and updates the intended state; no silent loss of user metadata |
| R6 | Safe coherent continuity | Interrupted-session cases; correct branch/task/decisions; versioned Conversations consumer contract and old/new/conflict generation fixtures | Resume recovers coherent work, not mixed successful state; missing external contract remains a blocker |
| R7 | Safe installation/update/recovery | Fresh/upgrade/no-op/conflict/refusal/fault/crash/concurrency scenarios; snapshots/quarantine preserved; exact messages/exits; platform-native proof | Owner can understand retained data and remedy an incomplete operation; no second writer or blind recovery replay |
| R8 | Demonstrated efficiency and usefulness | Matched D11 baseline/candidate; actual digest consumption; correctness and injected defect detection; reads/prompt/tokens/cache/time/interventions; held-out case | Provisional targets reviewed as agreed; misses get an explicit owner decision on target/change, never a concealed pass |
| R9 | Maintainable, reconciled delivery | Requirements, roadmap, inbox, PR lineage, source, package, installed receipt and residual issues reconciled | Every open issue has severity, owner and concrete trigger; no hidden debt or unexplained installed divergence |
| R10 | Operational release readiness | Required hosted checks actually run on final HEAD; independent final-revision review; security/performance gates; usable docs and recovery instructions | Owner authorizes relevant merges/release/activation, then installed-generation acceptance is recorded; readiness alone is not deployment |

Support matrix is a required output of P02, not an invented blanket claim. Existing
contract names Windows Claude/Codex and Linux installed acceptance; the transaction
CI plan includes Windows/Linux/macOS. Preserve existing supported-runtime regressions.
Determine exact runtime/OS/filesystem combinations before claiming coverage. Native
macOS/Linux, WSL/Windows shared paths and power-loss semantics are not proved by
in-memory ports or Windows-only tests.

## 4. Autonomy and approval boundaries

Proceed autonomously with source inspection, approved-path documentation, diagnosis,
test/implementation/refactoring inside an approved seam, retained evidence, explicit-
path local commits and routine fixes inside the package. Use the existing tools and
skills suited to the work; do not introduce a second planning framework or dashboard.

Owner gates still apply to a seam's actual argument/return shapes before RED tests,
unsupported-platform/guarantee trade-offs, a new dependency/port/export outside the
approved shape, scope beyond the explicit allowlist, PR4 closure, merge/ready/release
actions and real installation changes. Present one concrete packet covering related
contracts, explain trade-offs, obtain one approval, then finish the approved work
without repeated confirmation. Do not ask again for the policies accepted above.

Hard boundaries: no real `~/.claude` tests; no main-checkout planning; no upstream
source edits; no pushes until CI jobs show steps above zero; gates serial under
pinned Bun 1.3.5; preserve existing dirty/untracked work; no AI commit attribution.
Current session ends after validator/lock checkpoint work: do not begin preflight/
snapshot implementation in this session. Planning future seams does not lift that
boundary. No estimated implementation size or deadline is claimed before contracts
and capability constraints are resolved.

Subagents are not enabled merely by this plan. If explicitly authorized later, use
them for bounded independent review/read-only inventory with context and file owners;
keep coupled lock/lifecycle implementation and resource-heavy gates serialized.
Independent release review remains required; resolve the approved reviewer lane at
invocation time and retain the actual result, never a claimed unavailable review.

## 5. Atomic work-package rule

Each package has one reviewable outcome, dependency IDs, exact permitted paths,
approved contract reference, RED/control case, GREEN summary, verification commands,
source/artifact identity, evidence links, review result, and failure/recovery behavior.
A package is not READY until those fields are concrete. Split it if it produces
independently releasable behaviors or needs an unresolved architectural decision.

Workflow: read current disk/Git -> select one ready package -> verify authority ->
RED/control -> smallest GREEN implementation -> refactor -> appropriate gates ->
review -> local checkpoint -> update evidence and next package. RED and GREEN receipts
belong to one coherent change; no requirement to commit a broken intermediate state.
Do not move the expected-red boundary to hide a landed regression.

States: PLANNED, NEEDS-CONTRACT, READY, RUNNING, LOCAL-VERIFIED, ACCEPTED,
EXTERNAL-BLOCKED. ACCEPTED requires all evidence demanded by that package; record
local-only progress separately from native/hosted/product acceptance. Stale receipts
cannot advance state. Documentation packages may be accepted by document validation;
product packages cannot borrow that status.

At each checkpoint record: package/state; what changed and why; commit plus dirty
patch identity; commands/tool versions; pass/fail/skip/total summary; coverage by
file and metric; mutation/control results; artifact hashes; reviewer provenance;
limitations/blocker/next owner; next ready package. Keep bulky output in the existing
evidence directory, summaries here/HANDOFF, not pasted repeatedly into chat.

## 6. Dependency-ordered work packages

The following is the complete delivery decomposition. Near-term packets below are
concrete; later NEEDS-CONTRACT packets are refined just before execution using the
then-current source. They are not permission to guess future APIs or fake precision.

| ID | One outcome | Dependencies | Verifiable completion | Initial state / scope |
|---|---|---|---|---|
| P00 | Accepted policy and completion plan persisted | Owner acceptance | All eight/H1-H8 reconciled, prior conflicts explicitly superseded; resume pointers agree | Documentation completed in this planning turn; no product acceptance |
| P01 | Current delivery/baseline receipt | P00 | CWD/branch/HEAD/dirty evidence; live PR4/69/70 and CI-job metadata; predecessor/successor obligations mapped without closing PRs | LOCAL-VERIFIED, section 11; no product delivery acceptance |
| P02 | Enforceable support/threat/quality matrix | P00 | Each promised platform/property has a mechanism, proof plan and failure behavior; unsupported combinations explicit; tier inventory includes unimported code | RUNNING, partial matrix in section 13; mechanisms still open |
| P03 | Validator contract approved | P01 | Exact report/inventory/coverage/failure rules and pure function shapes agreed; stale fixture handling explicit | OWNER APPROVED original and section16 amended contracts; no validator shape decision pending |
| P04 | Recovery expected-red validator rejects extra regressions | P03 | Captured expected failure accepted; owner-data loss, malformed/duplicate/missing checks and wrong failure sets rejected | LOCAL-VERIFIED win32, final section20 receipt; native qualification remains open |
| P05 | Transaction coverage expected-red validator rejects false greens | P03, P04 | Only currently approved pending render cases fail; implemented lock regressions fail; current per-file metric evidence required | LOCAL-VERIFIED win32, final section20 receipt; same bounded paths |
| P06 | Documentation lint evidence reconciled | P00 | Explain zero-file summaries using actual checked-file counts and a deliberately invalid fixture; correct genuine gate defect if found | LOCAL-VERIFIED, section 11; semantics confirmed, no source fix needed |
| P07 | Combined lock protocol/API approved | P02, P03 | Acquisition/release/takeover/liveness/cleanup transition table and exact shapes; exclusive-ownership proof argument and counterexamples; support/refusal policy | NEEDS-CONTRACT; findings 1/3/4/7 treated together |
| P08 | Lock identity, terminal release and owned-temp failure handling | P05, P07 | Same PID/time acquisitions stay distinct; repeat release has no filesystem effect; owned partial-write cleanup and collision preservation | RED/GREEN; transaction module, approved suite/helper |
| P09 | Safe supported takeover or explicit conservative refusal | P07, P08 | No contender can detach a live holder; foreign/unknown domains and unsupported primitives refuse; crashed-reclaimer cases covered | RED/GREEN; no assumed automatic takeover support |
| P10 | Lock decision checks and local integration checkpoint | P04-P09 | Mutation controls catch removed safeguards; serial local gates and actual multiprocess temp-target contention pass; open native evidence named | LOCAL-VERIFIED only until required native evidence arrives; STOP before snapshot this session |
| P11 | Preflight/snapshot seam contract and implementation | P02, P10; later session | Caps, space, roots, conflict keys, copies/digests and failures; absent-target creation shape approved; no mutation on refusal beyond reported metadata | NEEDS-CONTRACT; current-session implementation prohibited |
| P12 | Journal and attempt/result publication seam | P11 | Approved schema and crash-state table; no root writes without persisted attempt; incomplete/unknown record refuses; identity/legacy handling | NEEDS-CONTRACT; durability qualification required |
| P13 | Quarantine/apply seam preserves entries and containment | P11, P12 | Per-entry current-state actions; staged exclusive restore; bounded collisions; link/topology changes handled under proved contract | NEEDS-CONTRACT; findings 2/8 |
| P14 | Verification produces truthful scoped findings | P13 | Independent expected tree catches mismatch, preserved edits and top-level changes; no claim of atomic whole-tree observation | NEEDS-CONTRACT; verification mutant fails |
| P15 | Recovery/retirement never repeats an automatic attempt | P12-P14 | Child safety outranks age; no replay after attempt; interrupted/result-write/retirement failures preserve evidence and actual paths | NEEDS-CONTRACT; finding 6 and H1/H2 |
| P16 | Commit/cleanup retains data unless deletion is proved safe | P12, P15 | Cleanup ordering survives interruption; mutable quarantine retained; valid cleanup-only restart; patch-baseline protections remain | NEEDS-CONTRACT; H3 and orphan-state cases |
| P17 | Outcome renderer matches actual operations | P08-P16 | Exact exits/messages distinguish prior/current changes, verified-at-time/current verification, live/retired locations and cleanup failures | NEEDS-CONTRACT; render lands after final outcome shapes |
| P18 | Wrapper invokes the accepted transaction | P11-P17 | Correct lock/journal/child-close/rollback/commit/uninstall wiring; no double handling, misleading success or unprotected cleanup | Later installer-plan Steps 4-6 scope, not current lock allowlist |
| P19 | Real CLI crash/recovery acceptance | P18 | Fresh/upgrade/no-op/conflict/faults; kill at each meaningful boundary; owner-byte inventory survives; installed subprocess behavior matches messages | Disposable homes only; independent oracle |
| P20 | Ordinary required gates replace expected-red wrappers | P19 | Both product gates genuinely GREEN; deliberately broken installer fails; workflows invoke real tests with full inventory | Later workflow/package scope approval; never flip early |
| P21 | Native final-revision installer qualification | P19, P20; CI jobs execute | Supported native OS/filesystem matrix, required coverage/controls/reviews/hosted checks tied to final source | EXTERNAL-BLOCKED where runners/CI unavailable; local work continues |
| P22 | PR4 obligations and PR69 delivery reconciled | P01, P21; owner PR4 decision | Settings/ownership obligations satisfied or explicitly owned successor acceptance; PR69 draft accurately reports evidence; no unauthorized closure/merge/ready | Delivery order #4 -> #69; local lock repair remains authorized before disposition |
| P23 | Digest/checker/skill integration delivered for PR70 | P22; authorized source scope | Existing digest reused, native skill mapping/effort proven through actual planner consumption; checker catches held-out defect | NEEDS-CONTRACT; no worktree switch inferred; PR70 after PR69 |
| U[v] | One vetted upstream increment, v in 1.10.0/1.11.0/1.12.0 | Prior accepted version; P22/P23 as applicable | Version subpackages below, all evidence tied to new pin; one vetted PR per version | PLANNED; fixed endpoint, no direct jump |
| P24 | State writer/reader contract passes at final candidate | U[1.12.0], P23 | Full unknown-key/bullet/decimal/count/routing/roadmap cases and installed callers pass; campaign D3 adoption only after its gates | NEEDS-CONTRACT; preserve measured skin protections |
| P25 | Coherent-resume consumer contract integrated | P24; versioned Conversations receipt | Old/new/conflict membership, stale-parent writers, interruptions and installed adapters match shared protocol | EXTERNAL-BLOCKED pending current receipt verification; do not invent sibling API |
| P26 | Disposable installed workflow qualification | P19, P24, P25 | Claude/Codex discuss-plan-execute-verify/resume and updater scenarios on supported targets; package/import/version hashes match | NEEDS-CONTRACT; real homes remain excluded |
| P27 | D11 usefulness comparison and held-out validation | P23, P26; baseline/protocol available | Actual digest read, injected defect caught without briefing, matched metrics; held-out case; misses explicitly reviewed | NEEDS-CONTRACT; numerical targets remain provisional |
| P28 | Release/activation decision packet | P21, P26, P27 | Final source/artifact/CI/review/security evidence; backup/restore, conflict and authority plan; open issues dispositioned | Owner release/merge/real-install authority gate |
| P29 | Authorized installation accepted | P28 and explicit target/action approval | Backups verified, activated bytes match approved artifact, installed routes/effort/resume useful, recovery instructions exercised safely | Not authorized by this plan; no test against real home |
| P30 | Completion reconciliation and owner validation | R1-R10, P29 | Installed generation/source/artifacts/planning/inbox agree; residual owners/triggers; owner confirms representative usefulness; actual goal completion | Final gate; blocked rows cannot be counted complete |

The P22 PR4 decision is a delivery gate, not a reason to halt the expressly authorized
local installer repair. Read-only mapping P01 may run while API decisions are pending.
PR/future-stage names are recovered from local contracts, not live hosted claims.
External messages/issue comments need the existing authorized workflow or explicit
instruction; maintain owning-project records without asking the user to relay them.

Each U[v] is expanded into atomic subpackages before it is READY:

1. U[v]-01: pin identity/integrity and compose/compatibility baseline; no guessed
   acceptance copied from the previous version.
2. U[v]-02-[behavior]: one retained/removed override or additive behavior at a time,
   RED/GREEN or parity experiment with provenance and retirement trigger.
3. U[v]-03: composed/package/installed regression evidence at the final pin,
   including installer safety and remaining application obligations.
4. U[v]-04: complete gates/review and concrete owner delivery decision; prepare
   the next version only after the required predecessor integration is authorized.

## 7. Near-term execution packets

### P03: next concrete owner packet, before code

Read current `scripts/expect-red.cjs`, `tests/expect-red.test.js`, fixtures and the
package command. Preserve pure judge result convention (`string[]`: empty only for
the exact known-red contract) unless a correction is presented with rationale.
Propose the coverage-evidence input explicitly; do not hide I/O in a pure judge.
Specify how the runner binds fresh coverage to this invocation and rejects old files.

The captured recovery fixture currently contains 24 checks: seven harness checks
and seventeen acceptance checks. Its exact inventory, types and pass/fail values
must be reviewed; do not accept only the five current signature failures while
ignoring other failures. Extra/missing/duplicate checks are errors until deliberately
updated with the acceptance harness. Owner preservation checks must pass.

The landed module currently leaves ten named render cases unimplemented. The old
TAP fixture permits `not implemented: acquireLock` and is obsolete as an accepted
baseline. Capture current source evidence under pinned Bun before replacing fixture
expectations; preserve historical receipts. Match pending cases to their exact
operation and reject other failures, skips, cancellations and inventory omissions.

The package command already emits c8 text and json-summary with exact `--all`
includes for both transaction modules and 100 in all four metrics. Contract packet
must require numeric per-file evidence and fresh run attribution, not merely absence
of `ERROR: Coverage`. If a needed runner/config change exceeds approved paths, show
that exact small scope extension with the packet. P03 completion is owner approval
of this concrete input/output/inventory contract, not this preparatory description.

### P04-P05: validator repair acceptance

RED controls: owner-data failure; omitted/duplicate/unknown check; malformed report;
wrong/absent summary; fail/pass count mismatch; stale acquireLock skeleton; unrelated
exception; absent file/metric, NaN/out-of-range metric, below-tier critical file;
stale coverage receipt; skipped/cancelled test; unexpected all-green product result.
GREEN: intended known-red reports only. Re-run the actual commands after parser
fixtures pass, retain their summaries and explain the expected failures. Final
evidence includes current source identities and controls showing the validator fails.
Do not claim the installer is safe because its expected-red wrapper passes.

### P07-P10: combined lock repair acceptance

Prepare one packet with target-existence precondition; lock schema/acquisition
identity; liveness-domain evidence; acquire/refusal/cleanup result shapes; terminal
release result; complete takeover algorithm or conservative refusal by support class;
leftover-file handling; and no-new-export/port/dependency compliance or exact requested
exception. Include the third-contender counterexample before proposing a replacement.

RED and mutation matrix after approval: equal PID/time acquisitions; repeat release;
read/unlink/close/write/publication failures; partial file and existing collision;
live/unknown/foreign holder; competing reclaimers; holder change; crash after each
reclamation boundary; cleanup failure preserving actionable paths; fresh multiprocess
contention in a disposable target. Assert active-holder exclusivity, not just which
lock file is left on disk. Check scope coverage at 100/100/100/100 as already required.
Do not test against real homes or make unsupported native-platform acceptance claims.

P10 checkpoint contains protocol approval, RED/GREEN receipts, mutants, local gate
summaries, source/dirty identity, review findings and native/hosted limits. It ends
the current implementation slice; the next session starts P11 only under its approved
contract and scope. If no safe supported takeover exists, implement the accepted
explicit refusal behavior; any reduction in promised supported behavior is presented
as a concrete product trade-off, not hidden behind a green test.

## 8. Verification and validation discipline

Use pinned Bun 1.3.5 first on PATH:
`C:/Users/Destiny/AppData/Local/npm-cache/_npx/bb6645c1041000be/node_modules/@oven/bun-windows-x64-baseline/bin`.
Verify version. Run gates ONE AT A TIME; read full summary/inventory and bare exit.
Keep evidence in `.planning/evidence/` with a package ID, platform and source hash.
Tests, coverage, mutation, compatibility, build, security and installed-use evidence
are distinct. Only repeat a passing gate for changed inputs or an unresolved concern.

Applicable existing commands include `bun run lint`, `bun run lint:docs`,
`bun run compose`, `bun run test`, `bun run test:repository-compat`,
`bun run test:coverage:install-transaction`, `bun run test:mutants:install-transaction`,
`node tests/acceptance/installer-recovery.cjs`, `node scripts/check-overrides.js`,
`node scripts/check-parity.js`, and the repository's security/performance commands.
Select gates by package risk and current command definitions; this is not permission
to run every expensive gate repeatedly or regard intentional interim RED as GREEN.

Tier S: 100% branches plus adversarial/mutation proof; other metrics at least 95%
per executable file, package and changed lines, unless the existing project bar is
higher. Transaction modules retain 100 in all four metrics. Tier A: 95% in each.
Include unimported files; exceptions are individual, reviewed and attributable.
No required quality metric is satisfied by a package average hiding one weak file.

Validation uses actual installed behavior and owner tasks, not only helper tests.
Preserve the ratified D11 benchmark: Conversations Phase24 `--reviews` against the
September1 baseline; orchestration reads <8k tokens, planner prompt <300 lines,
total <300k tokens, checker detects the injected defect without a hand brief.
Numerical misses trigger the agreed review of target and change together. Correctness,
data preservation and defect-detection requirements cannot be exchanged for speed.
Agree supplementary held-out scenarios before measuring to avoid moving the goalposts.

## 9. External/owner gates and continuation

| Gate | Current evidence | Next owner/action | Work that may continue |
|---|---|---|---|
| Goal execution status | Owner resumed; live goal tool now reports ACTIVE | Continue same goal; no duplicate | Dependency-ready authorized work |
| GitHub Actions | P01 live receipt: run 35430281217, all 18 jobs zero steps | Agent reads run/jobs recipe before any push; account owner resolves external lock if still blocked | Local authorized packages; no native/hosted acceptance inferred |
| Protocol/API approvals | Validator original and amended contracts approved; combined lock contract pending | Agent implements P04/P05 and prepares P07; owner approves lock shape before its tests | P02 platform evidence and approved validator work |
| Same-session boundary | Preflight/snapshot implementation explicitly excluded | End at P10; later session recovers checkpoint and approves next seam | Plan future work, no P11 implementation now |
| PR4/delivery sequence | Closure remains separately owner-gated | Agent maps actual obligations in P01; owner decides concrete packet | Authorized local PR69 work |
| Coherent resume | Local September14 receipt is partial/source-qualified | Verify current owning-project contract receipt through allowed feed; request exact missing deliverable via authorized workflow | Installer/state fixtures that do not invent the protocol |
| Real runtime/release | No authorization for real-home testing/activation or merge/ready | Prepare P28 first; owner approves exact target/artifact/action | All disposable installed acceptance |

CI recipe remains the installer brief's: query latest CI run on this branch, then
its jobs and step counts. Zero-step jobs do not prove failure of source or success
of checks. Do not push to see whether billing has cleared. Once jobs execute,
follow the brief's controlled push/check sequence and inspect final-HEAD results.

When one package is blocked, select another dependency-ready authorized package.
Do not repeatedly ask for the same answer or silently switch project scope. For a
true stop: preserve progress, name the exact missing artifact/decision and its owner,
and provide the command/evidence that will release it. A blocked release is not a
completed goal; a completed local slice is not completed product acceptance.

## 10. Initial checkpoint

- P00: owner acceptance recorded and authoritative policy addendum written; this
  execution plan created. Document validation is recorded in the current handoff.
- Comparison: already complete; reduced-skin direction accepted. Do not rerun the
  strategic comparison absent new parity evidence or an owner-directed change.
- P03 and P07: not yet contract-approved; product tests/implementation not started.
- P01/P02/P06: available read-only work; CI, full support matrix and lint-summary
  explanation are not asserted complete here.
- All R1-R10 remain open until their evidence and required acceptance exist.
- No commit/push/merge, real-home action or goal-status change is part of this
  documentation checkpoint. Existing unrelated dirty/untracked evidence is preserved.

## 11. Resumed execution: P01 receipt and P06 diagnosis

P01 live receipt: `.planning/evidence/p01-delivery-baseline-2026-09-19.json`,
captured 2026-09-19T19:45Z. Worktree HEAD remains `e50bda5b`; local tracking comparison
is 0 behind / 10 ahead. Hosted PR69 independently reports `897116f9`, OPEN/DRAFT.
PR4 is OPEN at `17278b2a`, non-draft; PR70 OPEN/DRAFT at `573d9f91`. No remote
mutation, fetch, push, review submission or closure was performed.

Latest branch CI run `35430281217` is completed/failure; all 18 returned jobs have
zero steps. The no-push condition still applies. This is the latest run's measured
state, not a new billing diagnosis or proof of how a future job would behave.

PR4's successor contract was recovered read-only from Git object `62f281c0`, path
`docs/reviews/pr4-successor-acceptance-2026-09-14.md`; no other checkout was opened.
The local handoff records owner acceptance of supersession, with closure separately
unapproved. Its H1-H8 are DISTINCT from installer holistic H1-H8:

| Successor obligation | Completion-plan owner and trigger |
|---|---|
| H1: reach migration from an ordinary terminal without running the broken hook | P22/P26 installed migration fixture |
| H2: exact ownership/execution-form matrix; settings/options/custom paths preserved | P22 bounded migration contract before adoption; shell, type, empty args, malformed/duplicate entries, links and concurrent edits all included |
| H3: normal-account maintenance, ACL/ownership, backup exposure, interruption | P02/P19/P21 native maintenance evidence |
| H4: new files, metadata, newer owner changes and corrupted provenance handled safely | P11-P21 transaction and installed fault evidence |
| H5: Windows Claude/Codex and supported Linux at final 1.12.0 | P21/P26 final artifact/runtime receipts; existing support not silently dropped |
| H6: discoverable, tested diagnostic/remediation instructions | P26/P28 maintenance instructions derived from actual outcomes |
| H7: arbitrary-settings support explicitly dispositioned | Owner supersession accepted; preserve one-reproduced-supported-case reopening trigger; PR4 closure remains separate |
| H8: final source/review/CI/installed evidence and consumer closure agree | P28-P30; no closure inferred from PR retirement |

PR70's current hosted head matches the historical digest-helper checkpoint. Actual
planner consumption and useful checker output remain P23/P27 obligations; this
receipt does not certify the helper or complete the integration. P01 is complete as
a baseline/delivery mapping, not as delivery acceptance.

P06 diagnosis is complete for the reported zero-file-summary concern. Installed
`markdownlint-cli2` 0.23.2 counts checked inputs in `Linting: N files`; its
`flattenTaskResults` includes only entries with errors in `filesReported`, used by
`Summary: ... in N files`. Source: `node_modules/markdownlint-cli2/markdownlint-cli2.mjs`
around lines 847-887 and 1071-1096. Thus `Summary: 0 issues in 0 files` does not mean
zero checked files. Earlier H8 suspicion is resolved, not a confirmed gate defect.

Evidence: `.planning/evidence/p06-lint-summary-control-2026-09-19.json`. Under pinned
Bun, two serial CLI stdin probes using repository config each reported `Linting: 1
file`: valid heading exited 0 with zero issues; missing heading space exited 1 with
one MD018 issue in one file. No lint source/config change is needed for this finding.
This tests summary semantics and an invalid-input control, not the whole repository
or tracked-file discovery. Continue reading the input count AND issue count/exit;
explicitly lint new untracked docs because `scripts/lint-docs.js` discovers tracked
files only. No full documentation gate is claimed by these two probes.

## 12. P03 concrete validator contract for owner approval

Status: ORIGINAL CONTRACT AND SECTION16 AMENDMENT APPROVED by the owner.
P04/P05 implementation is authorized. Section16 supersedes the original argument
shapes and 24-check inventory below, and adds the bounded harness scope.
Original paths: `scripts/expect-red.cjs`,
`tests/expect-red.test.js`, `tests/fixtures/expect-red/`. No new dependency, product
port, workflow change, package-script edit or installer change. The following is
the approved contract for RED controls. Subsequent review changes affecting shapes or promised behavior return to the owner before dependent tests.

### Inputs and return values

```text
Run = { status: number | null, stdout: string, stderr: string,
        signal?: string | null, error?: Error }

judgeInstallerRecovery(run: Run, evidence: {
  sourceHashes: { 'bin/install.js': string, 'dist/bin/install.js': string }
}) -> string[]

judgeInstallTransactionCoverage(run: Run, evidence: {
  projectRoot: string,
  coverageSummary: object
}) -> string[]

main(args = process.argv.slice(2), dependencies = {
  spawnSync?, packageJson?, log?, fs?
}) -> 0 | 1 | 2
```

The two judges remain pure: no reads, child execution or writes. `[]` means only
the exact allowed interim RED was proved. A nonempty array names violations;
malformed/missing inputs return diagnostics, not uncaught exceptions. `main`
keeps 0 for validated expected RED, 1 for unexpected/malformed evidence or runner
failure, 2 for CLI misuse. It prints raw child stdout AND stderr plus an explicit
inventory/coverage verdict. A fully passing product gate still returns 1 with
`UNEXPECTED PASS` until the approved ordinary-gate transition in P20.

`fs` is a runner-only test dependency for creation/read/cleanup faults, not a new
transaction port. Reviewed expected inventories are constants in the validator,
not caller-provided allowlists or lists inferred from this run's output. Existing
exported harness/signature constants may remain for compatibility but the five-item
signature ceases to define acceptance. No new export is needed.

### Recovery report acceptance

Require exit 1, no spawn error/signal, a JSON object with `accepted: false`, a
`checks` array, no harness error, and `fixtureRemoved: true`. Platform and Node
version must be nonempty strings. Both report source digests must be valid SHA-256
and match the runner's expected current bytes. `failure` must identify exactly the
failed checks without duplicates. Do not equate a child failure with a harness crash.

Every check has exact expected scenario/id/kind, boolean `ok`, and a nonempty string
detail when false. Reject unknown, missing and duplicate identities, wrong types,
wrong kinds, additional failures or unexpected improvements. The exact inventory
is 24 checks: all seven harness checks PASS; these seventeen acceptance rows have
the following expected status. Order is not significant; identity and cardinality are.

| Scenario | Acceptance id | Required status while wrapper is unfixed |
|---|---|---|
| fresh | status-is-1 | PASS |
| fresh | outcome-exact | FAIL |
| fresh | top-level-exact-allowlist | FAIL |
| fresh | owner-bytes-preserved | PASS |
| fresh | transaction-directory-shape | FAIL |
| fresh | quarantine-path-printed | FAIL |
| fresh | new-equals-twin-residue | FAIL |
| fresh | displaced-equals-twin-changes | PASS |
| fresh | moved-txt-lists-every-file | FAIL |
| upgrade | status-is-1 | PASS |
| upgrade | outcome-exact | FAIL |
| upgrade | tree-deep-equal-outside-allowlist | FAIL |
| upgrade | transaction-directory-shape | FAIL |
| upgrade | quarantine-path-printed | FAIL |
| upgrade | removed-file-quarantined-as-new | FAIL |
| upgrade | edited-file-displaced | FAIL |
| upgrade | moved-txt-lists-every-file | FAIL |

The seven harness identities remain the existing `INSTALLER_RECOVERY_HARNESS`
constant. Total: 11 PASS, 13 FAIL. Extra descriptive metadata may remain; it cannot
override checks. This intentionally allows known product defects only at these
identities; it does not establish the failing properties as safe or acceptable.

### Transaction TAP and affirmative coverage

Current exact inventory is the 51 named cases captured in
`.planning/evidence/p03-validator-baseline-2026-09-19/receipt.json` ->
`coverage.inventory`, and its raw `coverage.stdout.txt` (SHA-256
`1ead2909e17ebed36e7d7530d95bd91fd24518c170712c25a89b4c571683102a`). Copy this
reviewed inventory into validator constants during GREEN; never learn acceptance
from the output being judged. The first 41 names must pass. The ten exact `render:`
names must fail with diagnostic `error: 'not implemented: renderOutcome'`,
`failureType: 'testCodeFailure'` and `code: 'ERR_TEST_FAILURE'`. An unimplemented
`acquireLock` is a regression, even if totals and aggregate coverage look plausible.

Require one TAP version header, one complete plan, one each of tests/suites/pass/
fail/cancelled/skipped/todo summaries, unique contiguous result numbers and the full
reviewed name set. Counts must reconcile: currently 51/0/41/10/0/0/0. Reject bailout,
skip/todo directives, cancellations, duplicate names or summaries, missing cases,
unexpected nested suites, unknown result records and truncated diagnostics. Allow
timings, stack paths and the c8 text table to vary; they grant no acceptance.

Require `coverageSummary` from this invocation, with exactly `total` and both full
source-file identities rooted at `projectRoot`: `bin/lib/install-names.js` and
`bin/lib/install-transaction.js`. No basename-only matching. Normalize native path
separators/case as appropriate for the current host; reject duplicate aliases,
foreign roots, missing or extra executable-file rows.

For statements, branches, functions and lines independently, require finite numeric
`pct === 100`, positive integer totals, covered equals total, skipped equals zero;
the total row must equal the sum of both file rows. Ignore only c8's ancillary
`branchesTrue` field (not one of the four required metrics). The absence of a
textual coverage error is insufficient. Any reported coverage error on either
stream rejects, even alongside apparently valid JSON.

### Runner freshness, failures and evolution

For coverage, `main` exclusively creates a new temporary directory for this run,
with separate c8 report and V8-data children, and passes their paths BEFORE c8's
child command. It validates that the package command still invokes the expected
c8 executable, suite, TAP reporter, `--all`, exact two includes, per-file checking,
four 100 thresholds and text/json-summary reporters. Conflicting coverage path or
policy flags/configuration are refused; no silent rewriting of a weakened command.
There is no fallback to the shared `coverage/coverage-summary.json`. The private
directory must start empty, and the summary must be a regular non-link file below
it, produced after this invocation starts. No mtime-only freshness decision.

The runner captures source identities before and after execution and rejects
changes during the run: recovery wrapper/composed child/harness; coverage modules,
suite and fault helper; both also package script and validator. It prints hashes,
tool versions, summary and verdict. Normal trusted local/CI execution is assumed;
this is protection against stale/omitted evidence and ordinary concurrent edits,
not attestation against malicious code forging reports or changing bytes and back.

Spawn/read/parse/command errors fail the gate. Cleanup removes only this run's
verified private scratch directory after evidence is printed. Cleanup failure
also returns 1 and names the retained path, preserving the original error if any.
Tests inject filesystem faults through `fs`; no real user home is used.

Keep the old 32-case skeleton TAP as a negative fixture. Add the current captured
51-case TAP and coverage summary as positive fixtures, with source/tool provenance.
Recovery capture now reproduced the existing 24-case result. Fixtures are evidence
inputs, not generators of the expected inventory.

Later seam approvals explicitly update the reviewed inventory. New RED tests are
run directly with their documented failing assertions; they must NOT be added to
the permitted-failure set just to make this wrapper pass. During lock repair the
expected-red wrapper correctly rejects new assertion failures until GREEN. Approved
new unimplemented seams may add exact named pending cases deliberately. This
supersedes the brief's blanket instruction that every new RED must pass expect-red
as `not implemented`, which cannot hold when repairing already-landed code.

### Required controls and evidence for P04/P05

RED controls cover owner-byte loss, every missing/duplicate/unknown inventory
case, wrong kinds/types, contradictory failure list, source mismatch, stale lock
skeleton, unrelated assertion, missing/truncated/duplicated TAP summaries, skip/
cancel/bailout, absent or mismatched coverage, one metric below 100, nonnumeric or
inconsistent metrics, stale shared report with no fresh report, and creation/read/
spawn/cleanup faults. Existing capture is accepted only with its current evidence.

Verification after GREEN: focused validator suite; captured/live recovery verdict;
captured/live transaction coverage verdict; negative controls; appropriate lint
and pinned-Bun full-suite summary, serially. Measure validator coverage separately
with all four metrics and 100% branches under its gate-integrity risk classification;
do not count transaction-module coverage as coverage of the validator itself.
No mutation of a product requirement or workflow to make these checks pass.

Fresh baseline evidence (not RED controls for a new implementation): pinned Bun
1.3.5, Node v24.20.0, win32, HEAD `e50bda5b`; coverage gate exit 1, 51 tests,
41 PASS / 10 FAIL, no skips/cancellations/todos, both modules 100 in all four
metrics. Recovery exit 1, 24 checks, 11 PASS / 13 FAIL, fixture removed, wrapper
and composed-child hashes match. Full output and post-capture source identities
are in `.planning/evidence/p03-validator-baseline-2026-09-19/`. These results do
not accept the unsafe lock or qualify any other native platform. CI currently runs
these two gates under Node 22; the local capture used Node 24.20.0. Both runtime
families must be checked before claiming parser portability; platform-specific
paths/timings are not expected-status differences.

## 13. P02 support, threat and proof matrix: initial research

Status: PARTIAL; no platform mechanism/API approved. This matrix records obligations
and concrete missing proof, rather than silently promising that the existing `fs`
port can implement every guarantee. It does not authorize a native helper, a new
port/dependency, a narrower product contract or snapshot implementation this session.

Irreducible requirements: one installer writes at a time; ordinary owner edits may
occur; older evidence cannot authorize destroying newer bytes; target-path checks
must protect the actual operation; a message is limited to what was verified.
Privileged hostile replacement of the executable/test runner is not an evidence
attestation threat this project solves. This exclusion does not exempt ordinary
concurrent filesystem edits or a shared target accessed from another PID domain.

| Property / environment | Required mechanism or remaining decision | Required proof and safe failure |
|---|---|---|
| Windows Claude/Codex; supported Linux installations | Preserve existing delivery scope; list exact filesystem/runtime combinations in the protocol receipt | Native installed fixtures for each promised combination; no Linux/macOS claim from injected `platform` values on Windows |
| CI Windows/Linux/macOS | Existing three-platform jobs and Node 22 gate runtime stay required | Executed final-source jobs, actual counts, per-file metrics; zero-step jobs leave qualification open |
| Fresh lock publication | Complete privately owned file, exclusive publication on qualified filesystem; no write to public lock afterwards | Two real processes contend, precisely one owns; partial-write/close/publication/cleanup faults retain truthful paths; unsupported primitive refuses |
| Stale takeover | Shared trusted liveness domain AND one proven acquire/reclaim/release protocol | Paused contenders, holder exit/PID reuse, reclaimer crash, stale handle and foreign namespace; absent domain/proof refuses automatic takeover |
| Lock release | Unique acquisition identity, terminal handle and deletion protocol compatible with reclamation | First invocation becomes terminal before I/O; old handle cannot remove replacement; retained-lock errors reported, no blind retry |
| Orphan child | Journal phase and trustworthy child quiescence evidence; time alone never proves death | Alive/unknown children across stale/future journals block a second writer; spawn/PID-publication crash gap retained; guard upstream descendant behavior |
| Concurrent owner file writes | Snapshot is private copy; restore staging is complete before exclusive publication; quarantine stays mutable and retained | Destination write/collision after staging, open descriptor writes after rename, snapshot independence, no overwrite of newer bytes |
| Concurrent parent/entry topology changes | Operation-level containment mechanism remains OPEN; a scan/recheck followed by path-based mutation is insufficient | Parent swapped to link/junction and source type changed at each read/move/publish boundary; outside sentinels unchanged; unsafe operation refuses/retains incomplete result |
| Network/shared filesystems and Windows/WSL shared target | No interoperability inferred from same path/hostname or successful single-process link | Explicit native/shared-target concurrency and identity proof before support; no automatic reclamation without it |
| Process crash | Permission record before first restore mutation; ordered attempt/result/cleanup states | Kill process at each publication boundary; never replay persisted or uncertain attempt; report retained state |
| Power loss/storage failure | Filesystem persistence ordering and flush guarantees separately qualified; no guarantee selected yet | Native durability evidence or explicit owner-approved limitation before release; a process kill is insufficient proof |
| ACLs/modes/ownership and backup privacy | Preserve earlier PR69 security-metadata obligations; byte hash alone does not cover them | Normal-account native fixtures and protected Windows DACL checks; no permissive fallback on unsupported metadata operations |
| Snapshot and verification | Verified sequential captured pre-image, with accurate observation-time wording | Source/copy mismatch, per-file cap, total cap, free-space refusal, changing file/tree cases; no claim of one atomic tree instant |
| Evidence gates | Reviewed inventories, current source identity and affirmative per-file reports | P03-P05 negative controls plus full native runner evidence; fail closed on omitted or stale reports |

Primitive research, checked against primary sources on 2026-09-19:

- Node 24 documents `copyFile` as not atomic. A completed staging copy and exclusive
  publication are therefore distinct steps; copying with an exclusive destination
  flag does not by itself prove an invisible completed restore. [Node 24 fs](https://nodejs.org/docs/latest-v24.x/api/fs.html#fscopyfilesyncsrc-dest-mode).
- Windows hard links refer to files on the same volume, with changes visible through
  other links. Infer that linking a snapshot to a writable restored destination
  would violate snapshot independence. [Microsoft hard links and junctions](https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions).
- Linux rename preserves open file descriptors and moves a source symlink itself.
  Infer that quarantine does not freeze content and a bulk directory move can carry
  links. [Linux rename](https://man7.org/linux/man-pages/man2/rename.2.html).
- Linux `openat2` offers resolution constraints such as `RESOLVE_BENEATH`; that is a
  primitive candidate, not proof for the whole rename/unlink/publication protocol,
  nor a portable Node adapter already available here. [Linux openat2](https://man7.org/linux/man-pages/man2/openat2.2.html).

Tier inventory for the immediate slice: `bin/lib/install-names.js` and
`bin/lib/install-transaction.js` remain Tier S, 100 in all four metrics by the
existing project gate, including stubs under `--all`. `scripts/expect-red.cjs` is
Tier S gate-integrity code: 100% branches, at least 95% in each other metric, plus
adversarial controls; coverage must include its runner/error paths as well as pure
judges. Mutant driver and fault helper require deliberate removed-safeguard controls
and attribution; they cannot certify themselves solely by emitting an exit code.
Later wrapper/wiring inherits Tier S; no coverage claim for it exists in this slice.

P02 completion still needs the concrete supported mechanism and refusal contract,
plus the full later-module classification. Next owner is the implementing agent:
resolve the lock-specific matrix into P07 and present any necessary bounded port or
dependency change before tests. Path-boundary/native durability work stays open for
the later snapshot/apply contracts; it is not silently deferred past release.

## 14. P07 protocol analysis before the approval packet

Status: design analysis, NOT an approved API or accepted lock. P03 has since been
owner-approved and reviewed by Opus; section16 amendment is also approved. This section records why P07 must include support choices
instead of presenting identity/release fixes as a complete concurrency solution.

The current default ports are `fs`, `now`, `pid`, `signalProcess`, `newId`;
`signalProcess(pid, 0)` carries no evidence of a shared PID domain. The handoff
specifically identifies a Windows/WSL shared target. No trusted domain resolver
or native lock adapter is present in this module. Neither a caller-supplied arbitrary
string nor `platform + hostname` would establish that absent production mechanism.

### Minimum protocol obligations

1. Acquisition identity must be fresh for each acquisition, independent of PID and
   timestamp. Serialize it in the lock. Validate any ID used in a filename as a
   bounded single path component; never treat injected `newId` as path authority.
2. Exclusive creation must establish ownership of the pending file BEFORE writing.
   Handle short/failed writes and close errors separately. A failed `open('wx')`
   grants no cleanup authority over a colliding name. A close failure must not lead
   to an unqualified descriptor retry that could affect a reused descriptor.
3. Publish only a completed private file by an exclusive operation. Until publication
   succeeds, this process is not the lock holder and cannot start installation writes.
4. The release handle becomes terminal before its first I/O. Repeated calls return
   the same recorded outcome without touching the filesystem. Identity verification
   and deletion must be justified by the whole protocol, not called an atomic CAS.
5. Report acquisition refusal, acquired-with-pending-residue, successful release,
   ownership loss/absence, and failed release distinctly. Keep original and cleanup
   errors, and name uncertain/retained paths. A release failure does not retroactively
   turn an installed outcome into a pre-mutation refusal or imply the lock disappeared.
6. Only protocol participants can alter lock metadata automatically. Operator removal
   while an installer is live defeats file locking; guidance must establish wrapper
   AND child quiescence before manual action, not merely absence of one local PID.
7. An acquired wrapper lock never proves an orphan child stopped. The later journal
   contract must block root mutation until child quiescence is established.

### Reclamation candidates and their actual proof boundaries

| Candidate | What it can establish | What it cannot establish / cost |
|---|---|---|
| Existing read/rename/verify/link-back | Nothing adequate for exclusion during takeover | Already rejected: another live lock can be detached before identity is checked |
| Unique ID plus another read before unlink | Detects some changed owners | A read is not conditional deletion; it does not supply an exclusive remover or trusted liveness |
| Exclusive reclamation marker keyed to acquisition identity | Under a proved shared liveness domain and cooperating protocol, only the marker owner may remove that dead acquisition after rechecking it | Domain resolver and namespace protection still missing; marker-owner crash before removal must retain/refuse, not start recursive marker reclamation |
| OS-held lock adapter | Potentially removes PID-based stale-file reclamation locally | No such adapter in current allowed Node ports; dependencies/ports and Windows/WSL/shared-filesystem interoperability require explicit design and native proof |
| Refuse every existing lock; fresh acquisition and terminal release only | Removes automatic contenders' ability to detach a live lock without adding a guessed domain resolver | Crashed lock blocks unattended recovery; owner must establish quiescence and remove it. This is a concrete availability trade-off, not automatic fulfillment of the requested recovery design |

For the identity-marker candidate, the proof obligation is a complete interleaving:
read identity A; exclusively acquire marker(A); re-read current lock; require A and
trusted death; remove A; compete to publish the new acquisition. A later contender
may win publication after removal; the reclaimer then refuses, never removes that
winner. A paused contender for A must recheck after its marker acquisition and may
not act on the earlier read. Marker collisions never grant cleanup ownership.
Crashes before/after marker publication, removal and new-lock publication must each
have an explicit retained-state outcome. This is a proof sketch requiring review
and tests; it is not approval of the earlier author's link-marker algorithm.

Neither marker nor conservative refusal solves arbitrary replacement of the target's
parent path. For example: validate parent P; another writer replaces P with a link;
then a path-based pending-file creation or cleanup can access the replacement.
Unique IDs and another `lstat` do not eliminate that interval. An operation-level
boundary or an explicitly coordinated namespace is needed. Even ordinary file
editors may publish via rename, so "non-malicious owner" is not enough to establish
stable path topology. Do not infer such a constraint from the fixed root list.

P07's final packet must therefore state the production mechanism, supported target
concurrency and unavailable-domain behavior alongside its exact arguments/returns.
Preferred safety rule remains the accepted one: automatic takeover only when proved;
otherwise truthful refusal. Whether the currently supportable refusal-only behavior
is acceptable for this delivery slice is an owner-visible trade-off if no qualified
automatic mechanism is found. No dormant test-only domain port, guessed OS identity,
new dependency or reduced containment promise is authorized by this analysis.

## 15. Independent validator-review attempt

The cross-ai-review skill's preferred API lane was attempted with installed Claude
Code 2.1.278, provider alias `fable`, effort `high`, restricted plan mode, no tools,
no MCP servers and no persisted reviewer session. It received a cold packet containing
P03's full contract, current validator source, source/platform context, scope and
specific questions about false acceptance and Node 22/24 portability.

Result: exit 1, `You're out of usage credits.` No critique was returned, so this is
NOT review acceptance. Evidence under `.planning/evidence/`:
`p03-validator-review-packet-2026-09-19.md`,
`p03-validator-fable-review-2026-09-19.txt`, sibling `.stderr.txt` and `.exit.txt`.
No retry or silent model substitution. Next owner: implementing agent; retry the
preferred lane after credits/availability change, before final API acceptance.
At the time of that failed call P03 was awaiting the owner. The owner subsequently
APPROVED the exact validator contract, then explicitly requested "Opus5 at xhigh
effort". This is an explicit reviewer override, not a silent fallback. A new CLI
invocation uses `--model opus --effort xhigh`; initialization reports
`claude-opus-5`, session `b288c2c2-9cda-42b8-b0d4-7a187577ae27`. Initialization does
not echo effort, so only the requested xhigh setting is claimed. Evidence prefix:
`.planning/evidence/p03-validator-opus-xhigh-review-2026-09-19`; metadata records
packet hash and process handle. That launch completed as recorded below. Never
restart a reviewer from historical running prose; use live handle/terminal evidence.

### Opus result and source-checked disposition

The existing reviewer finished: exit 0, result `success`, model `claude-opus-5`.
Verdict: **PASS WITH CHANGES, conditional; H1 blocks acceptance**. Read the complete
review at `.planning/evidence/p03-validator-opus-xhigh-review-2026-09-19.md`;
raw JSONL, stderr, exit and metadata remain beside it. This completes the requested
review, not acceptance of the contract or product implementation.

| Finding | Implementer disposition after checking current source/evidence |
|---|---|
| H1: a known-FAIL row can conceal additional damage | ACCEPT. The proposed identity/status-only rule is insufficient. `record` truncates detail to 600 characters; `assertSameTree` shows only the first six paths; moved-file details only four examples. Exact matching formatted diagnostics is therefore insufficient as a general completeness guarantee and is sensitive to Node assertion formatting. Propose bounded harness extension below. The review's lock-repair example is prospective: the current module remains unwired. |
| M1: host/runtime binding | ACCEPT. Add explicit host evidence and reject production execution under Bun; the CLI gate must run under Node. Proposed argument delta below requires owner approval. |
| M2: coverage-ignore pragmas | ACCEPT. Neither watched module currently contains them. Reject c8/v8/istanbul ignore directives in the already-read source; no blanket exception and no new I/O port. |
| M3: zero totals / aggregate arithmetic | PARTIAL. Current modules have positive totals in every metric: names functions2/branches9, transaction functions14/branches59, lines/statements49/211. Keep the approved positive-total rule for these two nontrivial modules; zero would require an explicit future contract change. Aggregate equality applies to counts, not summed percentages. Ancillary `branchesTrue.pct: Unknown` is already ignored. |
| M4: validator branch coverage under Bun | ACCEPT the need for Node measurement; no downgrade. Existing `tests/helpers/portable-test-api.js` already supports Bun/Node with installed `expect`. Reuse it within the approved test file, replacing Bun-only parameterization/matchers with portable cases. Run the existing c8 directly against that file, with no new module/package script. |
| M5: moving safety cases into expected failures | ACCEPT a separate never-permitted-failure inventory and invariant check. It catches accidental policy drift; source review still controls deliberate edits to both constants. No claim that a constant prevents a malicious source rewrite. |
| L1: TAP framing | ACCEPT terminal summary-block recognition, bounded diagnostic blocks and consistent escaped names. Existing suite is flat; nested suites remain rejected unless explicitly added by a later contract. |
| L2: runner robustness | ACCEPT clearing inherited NODE_TEST_CONTEXT, refusing test-runner flags in NODE_OPTIONS, bounded execution and bounded owned-scratch cleanup retries. Exact runner runtime input proposed below; no process timeout authorizes reuse of incomplete evidence. |
| L3: source bytes and missing evidence | ACCEPT parsing package JSON from the same bytes hashed, explicit digest/failure mappings and errors for absent evidence. The contract already says no shared-summary fallback. |
| L4: TDD labelling and stale brief | ACCEPT. Existing rejected malformed cases are characterization, not a newly reproduced RED. Correct the brief before executing the revised test loop. |

No claim of parser portability beyond measured Windows/Node24; CI Node22 and the
native Linux/macOS runs remain required. A live report tied to current composed bytes
does not alone prove compose freshness; existing compose/parity/manifest gates retain
that separate obligation. The validator must not claim product acceptance.

## 16. P03 amendment proposed after Opus review

Status: OWNER APPROVED via the structured amendment answer. The owner approved section12 before this review.
Its general safety/return/coverage contract stands; the following argument and report
changes and one additional source path are now explicitly approved.

### Exact input changes

```text
Host = { platform: 'win32' | 'linux' | 'darwin', nodeVersion: string }

judgeInstallerRecovery(run, {
  sourceHashes: {
    'bin/install.js': string,
    'dist/bin/install.js': string,
    'tests/acceptance/installer-recovery.cjs': string
  },
  host: Host
}) -> string[]

judgeInstallTransactionCoverage(run, {
  projectRoot: string, coverageSummary: object,
  host: { platform: 'win32' | 'linux' | 'darwin' }
}) -> string[]

main(args, dependencies = {
  spawnSync?, packageJson?, log?, fs?,
  runtime?: { execPath: string, platform: string,
              nodeVersion: string, isBun: boolean }
}) -> 0 | 1 | 2
```

`runtime` is runner-only test injection, defaulted from the current process; not a
CLI flag, environment surface or transaction port. Production refuses Bun. This
allows Bun unit tests to inject a controlled Node runner and Node/c8 to measure the
real Node path. Recovery report `platform`/`node` must equal expected host; coverage
uses the explicit platform's path rules, making foreign-path controls testable.
No runtime/version value alone proves coverage; all existing evidence rules remain.
If a runner timeout or signal leaves descendant-process quiescence uncertain,
return failure and name/retain its private scratch; do not race deletion against
possible writers or claim that killing the direct child stopped the process tree.
Ordinary completed runs retain the approved bounded cleanup and error reporting.

### One bounded harness extension and report delta

Add `tests/acceptance/installer-recovery.cjs` to this repair's allowlist, solely to
emit complete machine-readable failure evidence and an independent upgrade owner
preservation check. No installer mutation, additional runtime modes, recovery behavior,
workflow or package-script change. The harness still runs only in disposable homes.

Every recovery check gains `evidence: { kind: string, actual: object }`. Kind-specific
objects are JSON data, captured independently by the acceptance harness rather than
from the wrapper's transaction journal. Human `detail` remains diagnostic and may
still be truncated; it never substitutes for machine evidence. The inventory defines
the required kind and exact field schema for each check before implementation.
For the thirteen currently failing rows, required kinds and fields are:

| Check family | Kind and actual fields | Known-RED rule |
|---|---|---|
| outcome-exact | `outcome-lines`, `{ lines: string[] }` | Exactly the existing unverified `Rollback applied` line |
| fresh top-level-exact-allowlist | `top-level-names`, `{ names: string[] }` | Exact sorted, complete reviewed top-level set; extra lock/residue names reject |
| transaction-directory-shape | `transaction-state`, `{ state: 'absent' }` for the current known RED | Only actual absence of the transaction root; permission errors, other failures, a partial directory or unknown state reject |
| quarantine-path-printed | `quarantine-reference`, `{ path: null }` for the current known RED | No quarantine only when the transaction-state evidence independently proves absent |
| fresh new-equals-twin-residue | `tree-delta`, `{ missing: string[], unexpected: string[], changed: string[] }` | Full sorted paths; current missing set equals the independent twin residue paths, unexpected/changed empty; no truncated examples |
| upgrade tree-deep-equal-outside-allowlist | `tree-delta`, same fields | Missing/unexpected empty; exactly the current changed `gsd-install-state.json` path; separate owner preservation must pass |
| removed-file-quarantined-as-new | `entry-type`, `{ path: string, type: null }` for the current known RED | Path equals the independently selected removed fixture entry; no quarantine entry exists |
| edited-file-displaced | `displaced-paths`, `{ paths: string[] }` | Empty while transaction absent; the independently seeded edited file must still pass owner preservation |
| moved-txt-lists-every-file | `moved-list`, `{ expected: string[], listed: string[] }` | Complete expected file paths from twin/upgrade oracle and empty listed set while transaction absent |

Report `context` is `{ twin: { residue: Record<string, 'file' | 'dir' | 'link'> },
upgrade: { edited: string, removed: string } }`, with target-relative slash paths;
no absolute/escaping paths or ambiguous duplicate identities. It supplies the
complete twin residue path/type map and independently selected upgrade names.
Validators check cross-field consistency; expected
known failures are not learned from this run's failed status or human message.
An I/O/observation failure produces `observation-error` with actual
`{ code: string | null, message: string }` and a failing check, never an invented
empty/absent observation. This kind is never accepted as known RED. Passing checks may use
`assertion-pass` with an empty actual object; their bool remains independently tested.

Add `upgrade:owner-bytes-preserved`, always required PASS, independently comparing
the seeded owner files and edited entry to their pre-upgrade bytes and confirming
the intentionally removed entry remains absent. This yields exactly **25 checks:
12 PASS / 13 FAIL** at the current candidate, subject to fresh capture proving it.
Its failure is never permitted. Report `sourceHashes` includes the harness itself.
Existing seven harness PASS checks and all other required PASS rows remain mandatory.

This closes the identified loss-of-information problem; it does not assert every
unimplemented property is safe. Full product acceptance still requires these FAIL
rows to become PASS and their tests/review to remain meaningful.

Validation: fresh capture under Node; reproduce old-validator acceptance of added
owner damage and changed failure evidence before fixing it; negative controls for
truncated/missing/contradictory observations, stale lock residue, wrong host, ignored
coverage and the new owner invariant. The human-readable diagnostic may change
without changing a verdict, but the complete observed facts may not be discarded.
Use portable tests with Node/c8 for validator branch coverage; no policy downgrade.

P04/P05 implementation is authorized under this approved amendment; execute RED/GREEN and retain evidence.
No source or tests were changed during review disposition. After approval, P04 began with an owner-byte-loss control: RED29pass/1fail, then GREEN30pass/0fail; receipts p04-owner-loss-red/green-2026-09-19.log.

## 17. P04/P05 implementation evidence and remaining acceptance

Implementation is authorized and underway, not accepted. No lock or installer-wrapper
source change, commit or push. Every cycle below retains separate RED and GREEN logs
in `.planning/evidence/`, named `p04-<topic>-red/green-2026-09-19.log` or
`p05-<topic>-red/green-2026-09-19.log`. The initial bare-Bun refusal is explicitly
excluded from behavioral RED evidence.

| Package | Implemented controls with RED/GREEN evidence |
|---|---|
| P04 | Fresh owner loss; independent upgrade owner preservation; complete typed observations; exact 25-check inventory; observed failure facts; report shape and cleanup; relative context paths; explicit source/host binding; Node-only production execution; source stability across capture |
| P05 | Existing portable Node/Bun test adapter; reviewed 51-case inventory; bounded flat TAP and terminal counts; affirmative per-file and aggregate JSON coverage; unique private reports/V8 capture; exact package command policy; command parsed from the same bytes hashed; malformed/interrupted run rejection |

Fresh structured recovery capture: 25 checks, 12 pass / 13 fail, exit1 and
fixtureRemoved true. Fixture `tests/fixtures/expect-red/installer-recovery-structured-red.json`
contains complete facts; stderr/exit receipt is `p04-structured-capture-2026-09-19.*`.
The historical 24-check recovery and 32-case skeleton TAP fixtures remain intact.
The new 51-case TAP/coverage fixtures are exact copies of the reviewed P03 baseline,
not fresh product acceptance or invented expected output.

Earlier parser/runner-focused Bun1.3.5 result: 44 pass / 0 fail; two slow recovery
observation tests were filtered out. Earlier complete focused run: 32 pass / 0 fail,
before later validator edits. Earlier Node portability result: 37 pass / 0 fail.
These are different source revisions and must not be combined into final acceptance.

Remaining owner: implementing agent, before P04/P05 checkpoint acceptance. The runner
controls listed in the chronology below are now implemented. Current open requirements
are the harness branch-coverage gap, actual ESLint rule coverage of CJS,
final-revision combined gates, and independent review disposition. The snapshot lint
obstruction is resolved by the owner-approved verified relocation recorded below.
Native Node22/Linux/macOS evidence remains unmeasured.
P07 is still an unapproved combined lock API; preflight/snapshot remains excluded.

First full Node/c8 validator probe: 46 tests pass, no skips/cancellations; statements
and lines97.4%, functions100%, branches91.86%. The coverage gate correctly exits1
against the required100% branches. This is NOT acceptance. Receipt:
`.planning/evidence/p05-validator-coverage-probe-2026-09-19.log` and sibling directory.
Focused ESLint on the three changed executable files exited0 at that revision;
subsequent edits require a fresh check.

Later RED/GREEN cycles added ignore-directive refusal and isolated/bounded runner
environment (including an explicit private empty c8 config to disable ancestor
config discovery), plus inherited Node test-option refusal. Existing failure paths
now have characterization controls for missing/malformed/non-file/symlink reports,
read failures, setup failures, cleanup failures and uncertain child termination.
Those already-correct failure paths are not mislabeled new RED evidence.
Earlier targeted result: 48pass0fail, two observation tests filtered, before adding
the actual Node CLI integration case. See the current measurements below; do not
transfer earlier coverage to newer source.

### Current verification and scope decisions

- Validator Node/c8 probe3: **56 pass, 0 fail; 100% statements, branches, functions
  and lines**. Raw output, JSON coverage and exit0 are retained under
  `p05-validator-coverage-probe3-2026-09-19`.
- Twelve selected decision controls detect weakened copies of recovery and coverage
  guards. They run only in isolated VM contexts with a different source filename,
  never modifying production files or contributing mutant execution to production
  coverage. This is targeted mutation evidence, not an exhaustive mutation score.
- Full pinned-Bun suite: **1,826 pass, 0 fail across 70 files**, 677.82 seconds,
  `p05-full-bun-suite-2026-09-19.log`. This precedes the final termination-marker fix.
- Subsequent strict termination-marker RED: two tests fail for error:false/0/empty/null
  and signal:false/0/empty. GREEN:44 parser tests pass. Current review source hashes
  are in `p05-validator-opus-xhigh-review-2026-09-19.metadata.json`; the earlier
  complete suite and100% measurement are not final-revision acceptance of those bytes.
- The unchanged acceptance harness's earlier Node/V8 trace yields96.01% statements
  and lines,100% functions, **86.86% branches**. Source digest remains
  `87047200ee914ebab1c67d72fafed3a9356d8b64878c6f4d0ec0616587da6ee4`.
  Receipt:`p05-harness-coverage-inspection-2026-09-19.log`. This is below even the
  shared95% branch floor; no exclusion or downgrade has been granted. The agent must
  provide meaningful harness branch proof before claiming this repair accepted.
- Full lint:684 errors, all from the retained upstream comparison snapshot; zero
  errors reported against repository source. The existing security rule block only
  targets `**/*.js`, so this does not establish rule execution for the changed CJS
  validator and harness. Config changes are outside the present source allowlist;
  this enforcement gap requires a concrete disposition, not a silent green claim.
- **Owner scope decision approved and executed:** moved only the1,074-file extracted snapshot from
  `.planning/evidence/value-comparison-2026-09-19/package` to
  `.claude/value-comparison-2026-09-19/upstream-package`, verify every path/size/SHA256,
  with every path/size/SHA256 verified before and after. Archive and historical reports remain.
  Exact manifest/proposal:`p05-lint-snapshot-relocation-proposal-2026-09-19.json`.
  Receipt:`p05-lint-snapshot-relocation-receipt-2026-09-19.json`; pointer retained at
  the original evidence root. Post-relocation pinned-Bun1.3.5 lint exits0 with
  **0 errors,815 warnings**, log/exit:`p05-post-relocation-lint-2026-09-19.*`.
  Lint rules are unchanged. This does not close the CJS enforcement gap above.
- Independent implementation review attempt terminated, exec32509, reviewer session
  `338837fc-7455-4687-a885-8fb284e61379`. CLI2.1.278 initialization confirms
  `claude-opus-5`; xhigh was explicitly requested, not echoed by initialization.
  Packet prefix:`p05-validator-implementation-review-packet-2026-09-19`;
  transcript/metadata prefix:`p05-validator-opus-xhigh-review-2026-09-19`.
  Exit0/result success did not yield a review: final text contains simulated Bash
  invocations and unverified disk claims, with no verdict or findings; initialization
  confirms tools=[]. This attempt is rejected as review evidence. Preserve its raw
  transcript and retry the same requested model/effort with packet-only instructions.

### Follow-up evidence and bounded lint proposal

The packet-only Opus5/xhigh retry is running as exec95419, reviewer session
`7478df97-c038-495f-882c-fa3652dcad26`; initialization confirms `claude-opus-5`
and tools=[]. Prefix:`p05-validator-opus-xhigh-retry-2026-09-19`. No verdict yet.
Source hashes still match the first implementation-review packet.

Applying the existing ESLint rules to the two changed CJS files using an in-memory
file-pattern override yields **0 errors,20 warnings**, pinned Bun1.3.5, exit0.
Receipt:`p05-cjs-explicit-lint-2026-09-19.{log,json,exit.txt}`. This diagnostic does
not change repository configuration or establish ongoing enforcement. Warnings are
retained for review; the validator's numeric-duration regex is among them.

Owner scope request submitted: the two-line candidate in
`p05-cjs-lint-proposed-2026-09-19.patch` adds only the validator and harness paths
to existing security rules and applies the existing test overrides to the harness.
Proposed negative control in the already-approved test file asks ESLint to lint
an unsafe eval string under each real path and requires an error; it never executes
the string. Run RED before the config change and GREEN after. No rule severity,
installer API or unrelated CJS coverage is changed. Config edit awaits approval.

Relocation documentation check:3 Markdown inputs,0 issues, pinned Bun1.3.5;
`p05-relocation-docs-2026-09-19.*`. Wrapper and lock source remain unchanged.

Current-source validator Node/c8 probe4: **59 pass,0 fail,0 skipped/cancelled/todo;
100% statements,branches,functions,lines; exit0**. Receipt under
`p05-validator-coverage-probe4-2026-09-19/receipt.json` binds unchanged before/after
validator and test hashes. It includes the latest termination-marker fix and the
12 selected decision controls. The two slow live-recovery observation tests remain
outside this focused command; their older evidence and the earlier full-project
suite are not converted into final-source proof by this result. No source changed
during the packet review or measurement. Harness branch coverage remains open.

## 18. Opus implementation review and repair dispositions

The retry completed exit0 with a substantive **PASS WITH CHANGES** critique.
Read `p05-validator-opus-xhigh-retry-2026-09-19.md` and its metadata for attribution
and exact reviewed hashes. This is packet-only source review, not native execution
or final-revision acceptance. Fixtures were not supplied to the reviewer. The
following dispositions distinguish verified code behavior from broader proposals.
Owner of uncompleted repairs: implementing agent, before P04/P05 acceptance unless
a later package or an explicit shape approval is named below.

| Finding | Source-checked disposition and required proof |
|---|---|
| F1: damage outside target and fresh nested-content blind spots | The outside-target observation gap is real. Expanding the oracle and check inventory needs a precise owner-approved contract. One row per fresh and upgrade scenario means27 checks, not the review's26. Do not change inventory silently. Fresh fixture currently seeds only two top-level owner files; broader nested-owner and complete output-message acceptance remains required in later installer acceptance, not proved by this25-row interim gate. |
| F2: observation-error emission and quarantine success paths unmeasured | ACCEPT. Add isolated subprocess fault controls over the actual harness, proving emitted typed I/O errors and judge rejection; add meaningful positive/quarantine oracle controls. Unit-forged reports alone do not suffice. |
| F3: cleanup throw suppresses report and retained path | FIXED with RED/GREEN control. EBUSY previously produced empty stdout. Harness now emits accepted:false,fixtureRemoved:false and the existing harnessError field, prints the retained fixture path, and exits1. No new report field or inventory. Guarded deletion remains inside the try; two bounded retries. Control aborts before any installer child and removes only its named empty fixture after terminal execution. |
| F4: live-capture maxBuffer | ACCEPT. Align the live capture bound with64MiB and retain a clear overflow failure; does not enlarge the accepted report semantics. |
| F5: inherited NODE_OPTIONS contamination | FIXED RED/GREEN: both gates refuse every non-empty inherited NODE_OPTIONS; even whitespace-only input is removed from the child environment. Covers long and short preload flags, loaders, imports, conditions and test flags. A denylist of a few flags would leave future contamination routes. |
| F6: weak twin floor | PARTLY ACCEPT. A one-file real twin cannot pass the existing picked-files harness check, which requires two traced files; the review's exact real-run example is overstated. A much smaller self-consistent map can still weaken coverage. Pin the reviewed root set/minimum independent selection facts without learning a weaker expectation from new output. |
| F7: abort diagnostic hidden by absent context | ACCEPT. Retain the context error while reporting actual failed/missing harness checks; never dereference invalid context. Prove a real abort-shaped report. |
| F8: fresh owner boolean not duplicated by digest evidence | Not a contract violation, as the reviewer states. Prefer mutation proof of the harness's independent byte comparison within the approved assertion-pass shape. Additional digest shapes require owner approval and do not by themselves make a faulty harness trustworthy. Do not claim duplicate observations are independent observers. |
| F9: outer timeout below inner timeout | ACCEPT timeout ordering. Reject the proposed blanket cleanup sweep: a prefix and parent do not establish descendant quiescence. On uncertain termination retain/name evidence; remove only an attributed fixture after proved terminal ownership. |
| F10: live Node path attribution | ACCEPT. Bind live-test evidence to the resolved interpreter/version, preserving Node execution under Bun. |
| F11: redundant observation sentinels | Advisory defense in depth; existing inventory and required-PASS guards already reject these inputs. Improve only alongside meaningful controls, without presenting the current examples as false acceptance. |
| F12: positional/no-op test mutations | ACCEPT targeted fixes: select checks by identity and assert mutation preconditions. The frozen Windows coverage fixture path is intentionally historical evidence; do not rewrite it as if captured on another host. |

The review's context-dependent Node coverage-directive and c8 config-discovery
questions remain unverified; inspect the installed implementations before claiming
either a defect or immunity. Review evidence is not transferred to subsequent fixes.

The owner approved the bounded ESLint extension. The exact two-line selection change
is applied, with no severity change. Its negative control was RED (unsafe eval not
flagged) then GREEN (both real CJS paths flag the error; harmless input passes).
Receipts:`p05-cjs-lint-enforcement-red/green-2026-09-19.log`.
F3 receipts:`p05-opus-cleanup-report-red/green-2026-09-19.log`.
F5 receipts:`p05-opus-node-options-red/green-2026-09-19.log`.
Probe4 and the earlier full suite predate these changes; fresh final-source proof
and review disposition are still required. No lock or wrapper implementation change.

## 19. Approved outside-target home preservation amendment

Status: OWNER APPROVED, implementation authorized. Existing judge signatures and
context shape remain unchanged. Scope remains the same validator/test/harness paths.

Add exactly two acceptance identities:
`fresh:home-outside-target-unchanged` and
`upgrade:home-outside-target-unchanged`. Both are always-required PASS and carry
`evidence: { kind: 'tree-delta', actual: { missing: [], unexpected: [], changed: [] } }`.
The arrays contain every changed relative path on failure, with sorted full lists;
the known-RED judge accepts only the empty delta. I/O failures produce the existing
never-accepted observation-error kind. Neither check may join the permitted FAIL set.
This yields27 reviewed checks, expected14PASS/13FAIL, only after fresh measurement
confirms that distribution. Unexpected damage blocks; it is not added to known RED.

In each generated fixture, seed representative owner files under `.gsd`, `.codex`
and `.config`, plus an unrelated owner directory with an empty child directory.
All are under the disposable fixture home in this worktree. Immediately before
each failure-injected wrapper run, snapshot the entire fixture home and remove only
the exact target subtree from the comparison. Compare afterward using the existing
independent walker (file digests, link targets, directory entries). For upgrade, the
baseline is after the successful first install and owner edit/removal. There is no
other path exclusion and no journal-derived expected state. Fresh target fixtures
and their two original owner files remain unchanged by this bounded amendment.

Required proof: the real current candidate supplies27 checks with14PASS/13FAIL,
source/host binding and confirmed cleanup; controlled outside-target deletion,
byte changes and extra entries each fail the corresponding preservation check and
the judge; omitted/duplicate/new-failing identities reject. Removing the new check
or its comparison is detected by a decision control. No real-home reads/writes.

This does not claim complete fresh nested-target or output-message acceptance;
those belong to later installer acceptance before release. It also does not adopt
F8's duplicate digest schema: retain the approved assertion-pass shape and prove
the actual owner-byte comparison with fault/mutation controls.

### Section19 execution result: additional failure, not accepted

Home oracle RED expected27 but received25; GREEN simulator supplies27 all-PASS
checks. Six real-filesystem damage controls cover deletion, changed bytes and an
extra entry in fresh and upgrade homes. A separate in-memory harness mutant replaces
both home comparisons; the damage control detects it. Synthetic filename excludes
mutant execution from real harness coverage; no production file is rewritten.
These are harness-oracle controls, not proof the installer recovers correctly.

Fresh native capture `p05-home-recovery-capture-2026-09-19.json` yields **27 checks,
13PASS/14FAIL**, exit1 and fixtureRemoved:true. The new fresh home check detects
`AppData` and `AppData/Roaming` being created. Upgrade home comparison passes. Do
not relabel this as the approved14PASS/13FAIL; do not update the captured known-RED
fixture to pretend these extra changes are approved. The validator still has its
earlier25-row inventory pending resolution of this observed contract conflict.

Read-only diagnostic instrumentation identifies upstream
`dist/gsd-core/bin/lib/capability-lock.cjs:195`: a module-load process-start-time
probe launches `powershell -NoProfile -NonInteractive`. The trace observes Roaming
absent before and present after that child. A standalone PowerShell no-op reproduces
the same change, while Node no-op/homedir, git and cmd controls do not. Redirecting
APPDATA/LOCALAPPDATA privately additionally exposes PowerShell cache writes. The
harness currently inherits those variables; prior captures therefore do not prove
all process data stayed private. No retrospective claim is made about real cache
changes without before/after evidence. Installer captures are stopped until isolation
is repaired. No real Claude installation was intentionally targeted.

Receipts: `p05-home-origin-trace-2026-09-20.jsonl`,
`p05-home-origin-instrumented-report-2026-09-20.json` (diagnostic only; injected
preload differs from ordinary acceptance), `p05-home-origin-noop-2026-09-19.json`,
`p05-home-origin-processes-2026-09-19.json`,
`p05-home-origin-powershell-2026-09-20.json`, and
`p05-home-origin-powershell-stability-2026-09-20.json`. Repeated PowerShell calls
rewrite StartupProfileData-NonInteractive; warming a profile does not prove stability.
The CoreCLR no-profile-gather setting also failed to suppress writes in this installed
Windows PowerShell; `p05-home-origin-no-profile-gather-2026-09-20.json` records that
negative result. Do not infer support from another CLR's source configuration.

Primary upstream context: [PowerShell cache concurrency issue](https://github.com/PowerShell/PowerShell/issues/26528)
and [.NET runtime profile write issue](https://github.com/dotnet/runtime/issues/95591).
Those reports concern other environments; the receipts above establish this host's behavior.

## 20. Approved complete home-state observation with explicit runtime ownership

Status: OWNER APPROVED, 2026-09-20; dependent RED/GREEN work authorized. This supersedes
section19's literal unchanged-home requirement. Same two checks,
same27 total and14PASS/13FAIL target; rename the two identities to
`fresh:home-outside-target-preserved` and `upgrade:home-outside-target-preserved`.
Both remain always-required PASS. Judge arguments remain unchanged.

Replace their observation with
`evidence: { kind: 'home-state', actual: { before: Record<string,string>, after: Record<string,string> } }`.
Both maps are complete independent walker snapshots outside only the exact install
target: `dir`, `file:<sha256>`, or `link:<target>`. No path is omitted for being a
cache. Validate canonical relative paths and host identity; require the seeded owner
files and empty directory in the before map so an empty observation cannot pass.
Preserve complete observations on a check failure; I/O errors remain observation-error.

All before entries must survive with identical type/content/link target, and no
new entries are allowed, except this exact Windows runtime-owned set:

- `AppData/Local/Microsoft`
- `AppData/Local/Microsoft/Windows`
- `AppData/Local/Microsoft/Windows/Caches`
- `AppData/Local/Microsoft/Windows/PowerShell`
- `AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive`

The first four may only be newly created plain directories or remain identical
plain directories. The final path may only be created or updated as a regular file;
before/after digests are still reported. No deletion, type change or symlink is
permitted at any of these paths, and no descendant glob is exempted. Linux/macOS
have no runtime exception. Unknown runtime artifacts fail closed and require review.

Fixture preparation seeds AppData/Roaming and AppData/Local with owner sentinel
files, alongside the section19 owner files. Redirect APPDATA, LOCALAPPDATA and
XDG_CONFIG_HOME/XDG_CACHE_HOME/XDG_DATA_HOME into each disposable home; clear or
privately redirect an inherited PowerShell module-analysis cache path. No ambient
owner cache location may be inherited. Keep TEMP/TMP within the invocation scratch.
All initialization is explicit before the independent before snapshot. No global
environment, runtime or installation configuration change.

Required evidence: native current candidate27checks/14PASS/13FAIL with all complete
home maps retained; approved runtime-only writes accepted; six existing protected-data
damage controls still reject; extra runtime descendants, directory/file substitutions,
symlink substitutions and deleted runtime artifacts reject; absent/partial/malformed
maps reject; removed comparison/allowlist safeguards are detected. No valid report
or changed source gains acceptance from old coverage/review evidence.

Alternative: retain literal whole-home immutability and keep the expected-RED gate
failed until the upstream PowerShell probe is replaced under a separately approved
production scope. Do not fake a clean home, skip the probe, exclude all AppData, or
weaken the never-fail owner checks to keep the previous failure count.

### Section20 execution and second implementation review (2026-09-20)

Owner approval recorded; implementation is within the same three executable paths
and fixture directory. Both home identities now report complete home-state maps.
Private APPDATA/LOCALAPPDATA/XDG paths are initialized before snapshots; inherited
case aliases are removed before private values are applied. A mixed-case PowerShell
cache variable reproduced a real isolation gap RED, then passed after repair.

Final native capture: `p05-private-home-recovery-final-2026-09-20.*`,27 checks,
14PASS/13knownFAIL,fixtureRemoved:true,stable before/after source hashes. The known-RED
fixture is an exact copy. This establishes the reviewed interim failure inventory,
not working rollback. Both home maps retain the actual startup-cache digests.

Proof includes all six owner-damage cases, six runtime deletion/descendant/type/link
cases, malformed/partial maps, Windows name identity, real harness abort/stat/trace
faults,16 validator decision mutants and three separate harness comparison mutants.
TAP replacement controls now assert the text actually changes; failure-row controls
select identities instead of positions. No runtime/cache exclusion glob was added.

The measured78-test Node/c8 run passed with100% statements/branches/functions/lines
for each executable file (`p05-section20-coverage-complete-2026-09-20/`). Later Map
refactoring, filename checks and review repairs invalidate reuse as final evidence;
fresh post-review coverage is running. Full lint after Map refactoring:0errors,
835warnings (815 elsewhere plus19 pre-existing validator warnings and1 harness
warning); new section20 warnings removed without rule suppression or severity edits.
Full-project suite and attributable final-delta review remain open.

Opus5/xhigh returned **PASS WITH CHANGES**, no reproduced current safety regression,
source snapshot stable. Evidence:`p05-section20-opus-review-2026-09-20.*`, reviewer
session29e7f939-ba2a-4da9-affd-db359177d77f,CLI2.1.278,model initialization verified
claude-opus-5,zero tools. Effort requested xhigh; initialization does not echo effort.
This is packet-only review, not execution. It explicitly confirms section20's exact
runtime ownership and closes earlier F1-F7 and F9-F10 source-local repair concerns.
Its own F3 was withdrawn as a non-finding and must not be counted as a defect.

| Second-review item | Disposition, owner and concrete trigger |
|---|---|
| F1 substring membership in moved.txt; F2 upgrade checks only removed file | Real latent harness weakness, not current false acceptance: both rows must FAIL with exactly empty listed observations. Preserve approved27 identities and interim schema. The suggested exact-set comparison against only new/removed entries would contradict design steps9-10, which require the full moved/displaced list. Implementing agent must resolve full moved-list format and expected inventory at the restore/moved-list seam approval, before either row can become an accepted PASS. No rename or weaker list definition authorized. |
| F3 two-map identity | Reviewer explicitly withdrew this as a non-finding after finding no counterexample. |
| F4 fresh owner/displaced comparison mutants | FIXED: separate actual-harness mutants remove each assertion; real private owner damage/unexpected displacement rejects, weakened copy accepts. No observation/API changes. |
| F5 Node coverage directives | FIXED RED/GREEN. Installed v8-to-istanbul/lib/source.js:54-80 recognizes node:coverage ignore-next and enable/disable, plus its legacy [c\|v]8 start/stop pattern. Validator rejects these forms before spawn; watched-module controls cover both modules. Reachability is now source-verified in the installed converter, not assumed from Node native flags. |
| F6 future command-array caching | Not a present defect: fresh arrays each invocation. Implementing agent must preserve this invariant or copy before mutation if command caching is introduced; no speculative cache change now. |
| F7 optional TAP subtest comments | Retain approved portable per-case optional comments; all51 result identities and terminal totals remain exact. No demonstrated false acceptance from mixed comments; any future framing change needs its actual runtime evidence. |
| F8 unknown-id sentinel | Existing unreviewed-key guard rejects and is independently mutation-tested. Additional sentinel is redundant defense, not a discovered bypass; retain reviewed behavior. |
| F9 failed capture may rerun in second test | Test-run efficiency limitation, not product correctness. Implementing agent should cache the terminal failed attempt if optimizing/reworking capture lifecycle; never imply two failed attempts are one measurement. No broad fixture sweep or uncertain-child cleanup. |
| F10 native/final-source evidence | OPEN: local win32 Node24 evidence only; Node22/Linux/macOS and hosted steps remain required in P02/platform/release gates. Post-review local coverage, full suite and final-delta review precede P05 acceptance. |

The installed c8 config discovery question is also resolved by source inspection:
node_modules/c8/lib/parse-args.js:13-21 uses find-up only as the config default;
the gate passes an explicit fresh empty --config and tests that argument. This
statement is about the installed converter/config implementation, not all versions.
No wrapper/lock source, new API/module/dependency, preflight/snapshot, commit or push.

### Final local checkpoint

P04/P05 are LOCAL-VERIFIED on win32. Receipt:
`.planning/evidence/p05-local-verification-2026-09-20.json`.
Final Node/c8 qualification:80PASS/0FAIL and100% in all four metrics for both files.
Final full-suite recheck under Bun1.3.5:1847PASS/0FAIL across70files; lint0errors and
835 pre-existing warnings; live recovery CLI exits0 for27 checks,14PASS/13knownFAIL,
cleanup confirmed. Source hashes stable; no source edits between these final gates.

The delta review found that the converter also honors node:coverage disabled/enabled
prefixes. Genuine RED then GREEN closed that boundary mismatch. Final exact correction
review **PASS**, claude-opus-5/xhigh requested,zero tools,reviewer
c2e3a66f-7591-4d8c-af1e-49bb9de6fe63; prefix p05-directive-prefix-opus-2026-09-20.
The broadened directive rejection intentionally rejects matching prose too. The helper
parameter rename is positional and the full suite verifies its call sites. Delta D2-D4
remain advisory: retain strong whole-report mutant assertions; judge rejection is
covered separately; status-is-1 harness rows have no dedicated assertion-removal mutant.

Retain the failed prior final-suite trial:1846PASS/1FAIL, existing protected-Windows-DACL
case hit the publisher's10000ms PowerShell timeout. The unchanged isolated case and
one unchanged full-suite recheck pass. Root cause is unproven; later CPU90-91% is context,
not causation. No roadmap source, test or timeout was edited. Implementing agent owns
native reliability investigation in P02 before P21 qualification; any repair outside
this allowlist needs its own bounded approval. Receipt p05-dacl-timeout-disposition-
2026-09-20.json records the failure; a green recheck does not erase it.

Next is P07's production protocol and exact API approval, not another validator-policy
question. No lock/wrapper edit, preflight/snapshot, commit or push. Goal remains ACTIVE;
local verification is not native-all-platform, installer, PR or release acceptance.

## 21. P07 mechanism decision: proposed bounded native qualification

Status: **PROPOSED, NOT APPROVED**. This is a prerequisite decision packet, not
an accepted lock protocol or permission to write its production RED tests. Section20
is implemented and locally verified. The next unresolved issue is mechanistic:
the allowed Node filesystem/PID ports do not currently provide the containment and
shared-liveness evidence required by sections13-14. Another identity check is not
a substitute. Do not implement an always-refuse lock and call automatic recovery done.

### Facts, inference and minimum necessary structure

At e50bda5b plus the preserved dirty tree, the installer lock still performs the
rejected rename-before-verification takeover. Repository searches of bin/scripts/
overlay found no LockFileEx, flock, openat2 or handle-relative Windows adapter.
The existing dist/gsd-core/bin/lib/capability-lock.cjs is not a reusable solution:
it uses hostname/start-time checks, treats missing hostname as local, has a
600000ms deadman policy, and rechecks before a path-based rename. This is a
source-level suitability finding, not a newly reproduced upstream incident.
Implementing agent owns assessing that existing capability lock's impact during
upstream/native qualification before P21; do not edit generated dist or silently
claim installer locking repairs the capability-consent subsystem.

Primary documentation checked 2026-09-20:

- [Node22 filesystem API](https://nodejs.org/download/release/latest-jod/docs/api/fs.html)
  exposes path-based filesystem operations and file descriptors; no documented
  portable LockFileEx/flock or directory-handle-relative mutation API was found.
- [Microsoft LockFileEx](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-lockfileex)
  releases locks after holder exit/handle close; release can be delayed. It does
  not prevent mapped-view access. This is a mutual-exclusion primitive candidate,
  not proof of protected pathname identity or orphan-child quiescence.
- [Microsoft NtCreateFile](https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile)
  documents relative opens using a RootDirectory handle. Exact access masks,
  reparse behavior, rename protection and subsequent publication/removal still
  need a native qualification; do not infer them from a successful ordinary open.
- [Microsoft CreateFile](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea)
  documents sharing constraints, including delete/rename access. Retaining handles
  without delete sharing is a candidate for preventing namespace replacement on
  Windows, not a demonstrated guard over every ancestor or later child operation.
- [Linux openat2](https://man7.org/linux/man-pages/man2/openat2.2.html)
  constrains lookup relative to a directory descriptor; the later mutation must
  still preserve that boundary. Do not depend on newly introduced kernel flags.
- [Linux flock](https://man7.org/linux/man-pages/man2/flock.2.html)
  describes open-file-description locking and differing network-filesystem
  semantics. A renamed/unlinked lock inode and a new pathname can split ownership;
  an OS-held lock is not permission to replace its coordination object.

Inference: the existing portable implementation is insufficient for the complete
approved threat model. A small native capability may be justified, but its cost
and cross-platform behavior are not yet established. Shipping a helper now would
prematurely commit this reduced skin to a new packaging and maintenance burden.
Keep these three requirements separate: stable authority over one target object;
exclusive installer ownership; quiescence of any earlier child before content writes.
Neither a lease nor a PID probe alone establishes all three.

### Recommended decision and alternatives

Approve one bounded, disposable native-primitive qualification before selecting
the production P07 API. It must either demonstrate a viable mechanism on each
promised environment or return a specific unsupported/unverified result. It may
not quietly narrow Windows/Linux/macOS delivery, add a shipping dependency or
weaken owner-edit/path protection. A failed study is useful evidence and ends at
an owner decision, not another unrestricted implementation/research loop.

| Direction | Concrete consequence | Recommendation |
|---|---|---|
| Bounded native qualification | Learn whether OS-held ownership and operation containment can satisfy the existing contract; no production adapter yet | Preferred next step |
| Approve a native production helper immediately | Requires packaging, ABI/toolchain, distribution, platform and process-lifecycle commitments without current native proof | Premature |
| Portable file protocol under a stable/coordinated namespace | Could use identity markers and trusted domain evidence, but explicitly changes the concurrent-topology contract; domain mechanism still required | Only if owner deliberately changes requirements |
| Refuse every existing lock | Avoids automated detachment but loses unattended crash recovery and still does not contain fresh path operations | Insufficient by itself |

### Exact study boundary and report contract proposed for approval

Allow only new study sources, fixtures, compiler outputs and receipts under
`.planning/evidence/p07-native-qualification-2026-09-20/`, plus the existing plan,
brief and continuity files. No product source, package/lockfile, workflow, installed
home, new third-party dependency, elevated operation or permanent system change.
Use existing local Rust with standard library/direct OS FFI for an isolated probe,
and a Node supervisor. No downloads or toolchain installation are included. If a
required compiler, native host or privilege is absent, record UNVERIFIED and stop
that platform. Source filenames: supervisor.cjs, probe.rs, README.md and report.json;
additional data/build files stay under the same directory. These are experimental
sources, not a new product module or an approved production port.

Proposed supervisor input, one JSON object, rejecting unknown fields:

```text
{ schema: 1, candidate: "windows-handles" | "posix-descriptors",
  scenario: "ownership" | "holder-exit" | "parent-swap" | "leaf-swap" |
            "publication" | "terminal-release" | "foreign-domain" | "orphan-child" }
```

There is no caller-provided target path, command, PID, timeout, expected result or
skip switch. Supervisor creates a fresh private home and fixture inside the approved
study directory, seeds outside-target owner sentinels, and owns all child processes.
It clears inherited cache/home aliases and uses the approved private runtime-home
policy. It compiles the fixed local source to a private output path without Cargo
dependencies. Execute gates serially with pinned Bun1.3.5 on PATH; record the actual
Node, compiler, OS/kernel, architecture and filesystem. A platform name injected on
Windows is never evidence of Linux/macOS behavior. No remote machine execution is
included in this approval; unavailable native hosts are an explicit evidence gap.

Probe/supervisor communication uses private inherited pipes with bounded JSONL
events, a run identity and ordered barrier sequence; no filesystem marker polling
or sleeps as concurrency proof. Fixed actions are selected by the supervisor's
scenario, never an arbitrary command from a fixture. Bound each child to60s and each
scenario including cleanup to180s; a timeout fails the case and is never liveness
proof. Record every child exit and close observation. Kill only owned test children,
then verify termination; uncertainty retains the fixture and fails the report.

Required report, with all keys present and no additional keys:

```text
{ schema: 1, runId: UUID, input: <validated input>,
  sourceHashes: { supervisor: SHA256, probe: SHA256 },
  environment: { platform, release, arch, filesystem, node, bun, compiler },
  verdict: "PASS" | "FAIL" | "UNVERIFIED",
  claims: [{ id, status: "proved-in-fixture" | "refuted" | "unverified",
             eventSequences: [integer], reason }],
  events: [{ sequence, actor, action, outcome, errorCode: string | null }],
  ownerState: { before: <complete map>, after: <complete map> },
  children: [{ actor, pid, exitCode: integer | null, signal: string | null,
               closeObserved: boolean }],
  cleanup: { complete: boolean, retainedPaths: [string], errors: [string] } }
```

Hashes bind the exact source before/after execution; source drift fails. Every
report names the tested scope and non-claims. Missing events, skipped barriers,
incomplete maps, unknown inventory, missing child closure or cleanup failure cannot
produce PASS. Complete maps use section20's entry representations/type rules; only
the exact fixture target and compiler-output directory are excluded from owner
comparison, never a broad cache directory. A study receipt is native feasibility
evidence, not production coverage, power-loss proof or accepted installer behavior.

### Eight scenarios and falsification requirements

1. Ownership: two independently opened contenders for the same target; exactly one
   may enter the protected section. Test alias paths to the same target. No duplicate
   handle passed to the contender that would make contention vacuous.
2. Holder exit: pause holder, verify contender refusal, terminate holder, observe
   actual closure and then retry. Never infer death from elapsed time or foreign PID.
3. Parent swap: pause immediately before each lock-metadata operation; independently
   rename/replace its parent with a link/junction to seeded outside data. Prove
   containment or refusal. An initial lstat followed by a normal path operation is
   a required failing control. Root bootstrap and ancestor aliases are included.
4. Leaf swap: replace coordination/pending leaf between observation and action;
   preserve replacement bytes and prevent two owners. A stable coordination object
   cannot simply be assumed. Explicitly distinguish protocol-owned metadata from
   ordinary owner-editable installation entries.
5. Publication: two complete private candidates; exclusive publication permits one
   winner. Short write, failed close and colliding names must not remove unowned
   files or expose an incomplete public record; no blind close retry.
6. Terminal release: after the first release, a successor acquires; repeated release
   performs zero OS operations and cannot affect that successor. Include failed first
   release and independent same-PID/time acquisitions.
7. Foreign domain: common exclusive publication must still prevent two winners even
   if OS locking does not interoperate. Unknown/foreign evidence must not authorize
   reclamation. Native cross-domain interoperation remains UNVERIFIED unless actually
   run; an injected label tests refusal policy only.
8. Orphan child: holder exits while its test child keeps writing. Lease reacquisition
   alone must not be reported as permission for a second writer; report the missing
   quiescence evidence. This does not implement the later journal/process seam.

The study starts with one intentionally unsafe control per relevant guarantee and
must observe its violation before accepting the corresponding candidate observation.
It is test-first experimental work; it does not approve the product lock's arguments.
Do not port a failed candidate across platforms merely to increase case counts.

Stop after one complete candidate pass and at most one focused correction/recheck
per available native platform. Return the evidence table, cost/packaging implications,
unresolved containment semantics (including a retained directory moved outside the
current pathname), and the proposed production acquire/release/error contract.
If no candidate satisfies the requirements, name the exact conflicting guarantees
and ask the owner to decide; do not silently weaken them. P07 remains pending until
that production packet is separately reviewed and approved. P08/P09 lock tests and
preflight/snapshot implementation remain unauthorized by this study proposal.

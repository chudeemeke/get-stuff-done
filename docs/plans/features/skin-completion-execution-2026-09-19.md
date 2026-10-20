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

## 21. P07 prerequisite: proposed Windows containment spike

Status: **OWNER APPROVED 2026-09-21; bounded experiment now COMPLETE**, see execution checkpoint below.
Execution is authorized only within the boundaries below. Supersedes the eight-scenario study draft
retained in p07-mechanism-opus-2026-09-20.packet.md. That draft received
**PASS WITH CHANGES**, claude-opus-5/xhigh requested, session
9d124829-3290-4276-af0d-3f1fd78209a2, packet-only, zero tools. No product lock tests were authorized. Experimental sources and results now exist;
the execution checkpoint below supersedes the proposal's unexecuted status.

### Decision and why this is the next bounded step

Keep the accepted takeover policy: automatic takeover only with proof; otherwise
truthful refusal. Containment is independent and presently unsolved for both fresh
acquisition and refusal-only implementations. Do not ask the owner to decide this
same policy again. P07 production arguments/returns remain unapproved.

Approve a three-case **Windows containment spike**, testing one candidate: retained
Windows directory handles with delete sharing denied, and single-component relative
opens via NtCreateFile. This is a falsifiable candidate, not an accepted mechanism.
Test whether it prevents path replacement while allowing ordinary owner file writes,
including what it prevents the owner from renaming. It does not implement a lock,
choose a liveness domain, qualify automatic takeover, or implement recovery.

Positive outcome: resolve the Windows containment uncertainty, then prepare the
cross-platform mechanism/cost table and P07 API packet. Windows-only evidence cannot
approve a portable production API. Native Linux and macOS evidence stay open; macOS
is an existing CI requirement, not a newly promised installation platform. Negative
outcome: return the exact refuted guarantee to the owner without changing candidate
or weakening the contract. Unverified outcome: name the missing tool, privilege,
host or observation; do not treat it as mechanism refutation or silently retry.

The owner is considering a native component only if a later design can use a small
first-party helper, without an admin service, install-time compiler or install-time
binary download, and with attributable builds/native gates for supported platforms.
This is a proposed cost envelope for evaluation, not approval to ship a helper.
If even that envelope is unacceptable, do not conduct this spike. A successful spike
removes one feasibility blocker; it does not establish packaging or product readiness.

### Current evidence and exposure

- No LockFileEx, flock, openat2 or Windows handle-relative adapter was found in
  bin/scripts/overlay. The allowed Node fs/PID ports supply no demonstrated operation
  boundary against parent replacement. This is a repository finding, not a proof
  that no possible JavaScript technique exists.
- The rejected installer lock remains in bin/lib/install-transaction.js; the wrapper
  currently does not import it. Deferring its repair does not newly expose that
  implementation, but the existing installer still fails rollback acceptance.
- A separate lock is **included in the assembled distribution** at
  dist/gsd-core/bin/lib/capability-lock.cjs. Its
  capability-consent and capability-lifecycle consumers call acquireLock for consent
  persistence and lifecycle mutations. It uses hostname/start-time heuristics, treats
  a missing hostname as local, permits foreign/unknown takeover after600000ms, and
  rechecks before path-based rename. This source-level suitability finding is not a
  reproduced exploit. It must not be reused as the installer safety mechanism.
  Implementing agent owns a bounded reachability/race assessment before the next
  installed-use qualification/P21; any repair requires its own allowlist. Study
  approval does not accept this shipped risk or claim the installer repair covers it.
- Local command discovery found rustc/cargo launchers, not proof of a working compiler.
  WSL lists Ubuntu; kernel version, filesystem and toolchain remain unverified.
  This packet authorizes Windows/local NTFS only. WSL2/ext4, Windows/WSL shared paths,
  native Linux and macOS have **no execution authorization or proof in this spike**.
  No remote execution or CI workaround is included.

Primary sources checked 2026-09-20:
[Node22 fs](https://nodejs.org/download/release/latest-jod/docs/api/fs.html),
[CreateFile sharing](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea),
[NtCreateFile relative opens](https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile),
[LockFileEx](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-lockfileex),
[Linux openat2](https://man7.org/linux/man-pages/man2/openat2.2.html),
[Linux flock](https://man7.org/linux/man-pages/man2/flock.2.html).
These documents establish candidate primitives, not this protocol's safety. OS-held
lock release may be delayed and does not prove child quiescence. Those lock-specific
questions remain in P07; this spike makes no claim about them.

### Exact source and execution boundary proposed for approval

New experimental source only in
`.claude/p07-containment-spike-2026-09-20/`: `probe.rs`, `supervisor.cjs`, `README.md`;
compiler outputs and disposable fixtures stay under that directory. Reports and
source/binary hashes go to `.planning/evidence/p07-containment-spike-2026-09-20/`.
The existing eslint configuration already excludes .claude/**. No lint configuration
change or shipping exemption is proposed. Review these two experimental sources
explicitly; run Node syntax check, Rust compiler warnings-as-errors, and explicit
Markdown CLI on README/changed planning files. Record actual output, not merely exit.
The spike is not production Tier S acceptance or an addition to the coverage gate.

Use a resolved, already-installed rustc executable and its existing standard library,
with direct Windows FFI and no Cargo/crates/downloads. Record executable/sysroot and
build command. Rust avoids introducing a PowerShell compile/hosting subprocess into
the measured window, given the retained PowerShell timeout/home-cache observations.
PowerShell/.NET FileShare.None does not alone exercise handle-relative traversal;
flock(1) does not test this Windows containment candidate. This rationale is limited
to the spike, not a product implementation-language decision.

Resolve the installed compiler read-only, then build **before** the measured owner
snapshot in a private build home. Clear case aliases and redirect HOME/USERPROFILE,
APPDATA/LOCALAPPDATA/XDG variables, CARGO_HOME/RUSTUP_HOME, TEMP/TMP and incremental
output privately; invoke the resolved compiler directly, not rustup auto-install.
No real Claude/Codex target, elevated action, persistent system change or real owner
content. Attack links/junctions point only to seeded data in the private fixture.
No caller-supplied target, command, PID, timeout, expected result or skip switch.

Supervisor input is exactly `{schema:1, caseId:"parent-swap"|"leaf-swap"|"moved-directory"}`.
Unknown keys/values reject before creating a fixture. A UUID run directory contains
its own home, target, sibling sentinels and actor logs. Use private inherited pipes
with sequenced barriers; actors are fixed `supervisor`, `candidate`, `owner`.
Each child deadline60s; whole case including cleanup180s. Timeout means UNVERIFIED,
never mechanism refutation or death evidence. Stop/verify only owned children; any
uncertain closure retains the fixture. No sleep/polling race inference.

One candidate, three cases, one platform. One initial run per case. At most **one
supervisor/probe defect correction in the entire spike**, logged and reviewed, may
rerun affected cases once. A candidate-design change, second harness defect, timeout,
missing positive control or genuine refutation stops the spike and returns to the
owner. No second candidate, automatic retries or silent time-budget extension.
Timeout always takes precedence over the correction allowance: stop UNVERIFIED;
a pre-measurement missing/broken compiler or linker also returns UNVERIFIED and
does not consume that allowance. The180s case deadline includes all control phases.

### Fixed claims, controls and expected observations

| Case | Exact claim identities | Observation required |
|---|---|---|
| parent-swap | parent-outside-preserved; alias-same-object; owner-file-write-preserved | Pause before relative create and before owned-file cleanup; owner attempts parent/ancestor rename and junction replacement. Outside sentinels unchanged; ordinary pre-existing owner-file write succeeds and survives. Exercise case-alias and a pre-existing fixture junction alias to the same target, recording file identity. No UNC/network/8.3/bind-mount claim. |
| leaf-swap | leaf-replacement-preserved; leaf-type-enforced; owner-rename-effect-recorded | Pause between leaf observation and relative open/action; substitute a regular file, directory and junction. Replacement bytes preserved or operation refused; no unexpected type followed. Record each owner rename result/error, including sharing violations caused by the candidate. |
| moved-directory | moved-object-boundary; ancestor-rename-effect-recorded; guard-exit-effect-recorded | With child/ancestor handles retained, attempt moving the held directory out of target into the fixture sibling and replacing the old name. Safe result requires move denied or candidate refusal before post-move mutation; continued mutation via a moved handle does not pass the pathname-boundary claim. Record owner restrictions and retry outcome after actual guard-process closure. No bounded kernel-release promise from one measurement. |

The three case rows define exactly nine claim identities; each case must report all
and only its row. Fixed actions are open/create/close/remove/write/rename/junction/
barrier/process-exit; outcomes are success/refused/error/not-reached. Include literal
OS status codes. Intended owner-write changes are logged as expected deltas; all
other owner entries use complete before/after maps and section20 type/runtime rules.
No target-wide exclusion may hide damage to an owner entry used by a claim. Keep a
separate complete target map for those assertions. Private compiler work is outside
the observation window, not a broad cache exclusion.

Each claim carries an unsafe-control record showing its detector catches the named
violation, and a positive-control record showing the intended OS call succeeds on
an unchanged fixture with documented arguments. Inspect FFI definitions against
published signatures and record the exact access/share/create options. A missing or
failed positive control gives UNVERIFIED, not refuted. A negative control that cannot
induce its violation also gives UNVERIFIED. Owner-impact claims are observational:
controls validate that success and sharing-refusal events are distinguished; they
cannot establish that a measured restriction is acceptable to the owner.

### Evidence contract and decision output

One immutable receipt per run, named `<runId>-<caseId>.json`, plus `index.json` listing
all attempted/unattempted cases and reasons. No single report.json overwritten.
Use exactly these receipt fields (no open-ended additional claims):

```text
{schema:1, runId, caseId, candidate:"windows-relative-handles-v1",
 scope:{platform:"win32",filesystem:"NTFS",aliases:["case","fixture-junction"]},
 nonClaims:["portable-lock-safety","automatic-takeover","child-quiescence",
            "power-loss","owner-impact-acceptance","production-readiness",
            "symbolic-link-traversal","release-latency-bound"],
 provenance:{sources,compilerExecutable,compilerVersion,sysroot,buildCommand,
             binaryPath,binarySha256,sourceStable,binaryStable},
 environment:{osRelease,arch,node,bun,filesystemEvidence,hostLoadBefore,hostLoadAfter},
 timing:{startedAt,endedAt,deadlineMs},
 verdict:"mechanism-observed-in-fixture"|"refuted"|"unverified",
 claims:[{id,status,reason,events,positiveControl,unsafeControl}],
 events:[{sequence,actor,action,outcome,osCode,elapsedMs,detail}],
 ownerState:{before,after,expectedOwnerWrites}, targetState:{before,after},
 children:[{actor,pid,exitCode,signal,closeObserved}],
 cleanup:{complete,retainedPaths,errors}}
```

Claims use the same three verdict terms. Control records contain identity, observed
outcome and event sequence references. Source and binary digests bind before/after
execution. Filesystem evidence names the native volume-query method/result, not a
label copied from input. Host load is context only. Missing/unexpected claims,
malformed events, unobserved barriers, source/binary drift, absent child closure or
cleanup failure prohibit mechanism-observed-in-fixture. Refuted requires a concrete
counterexample with valid positive controls; everything else is unverified.
With valid provenance/control evidence, a refuted claim makes the run refuted;
otherwise any unverified claim makes it unverified, and mechanism-observed-in-fixture
requires all three claims observed plus every evidence/closure/cleanup condition.
Each unsafe control runs with the candidate guard absent on its own fixture instance,
as a named phase within the same case run. Register all nine positive-control and
nine unsafe-control identities in README before execution. Sources records contain
path and SHA256; open/create event detail contains access/share/disposition/flags.
A non-NTFS volume result aborts UNVERIFIED. Index records any correction and its
superseded/superseding run IDs; never overwrite the earlier evidence. Case1 parent
rename effects are event observations, not extra claims. Symbolic-link traversal
and a release-latency bound are additional non-claims: junction and one post-exit
observation do not prove them. Any later non-Windows table row stays unverified.

Validation is documented checks plus independent review of raw receipts/source,
**not a new general-purpose validator framework**. Retain raw events, exact commands,
compiler output and failures. Deliver index, findings/cost table and updated
CONTINUE/HANDOFF, naming every remaining gap. Source review and negative controls
are required even though this bounded experiment is not a production coverage gate.

### Opus findings disposition

1/14: fixed Windows-only inventory; distinguish CI macOS and unverified Ubuntu/WSL.
2: fixed total run/correction bound; reject the suggested unlimited harness fixes.
3/4/5/17/18/19/20: explicit fixed claims, controls, provenance, per-run receipts,
non-claims, vocabularies, manual review and non-product verdicts.
6/7/8: timeout UNVERIFIED, private build before measurement, existing ignored study
source directory; no new lint rule or home exclusion.
9/10: takeover policy unchanged; positive/negative/unverified decision branches and
proposed maintenance envelope explicit.
11/12: moved-object case and owner impact explicit; lock release latency deferred
with the removed OS-lock scope, not claimed proved by containment.
13/22: shipped capability-lock consumers/exposure disclosed; installer seam unwired.
15/21: publication, terminal release, liveness and orphan cases removed from spike;
remain requirements of their later approved seams.
16/23: host-language rationale and receipt/continuity deliverables explicit.

Owner approved this bounded source/experiment extension on2026-09-21.
No lock implementation, P08/P09 RED tests, preflight/snapshot, commit or push follows
from approval of this spike alone.

Final approval-readiness review: **PASS**, claude-opus-5/xhigh requested, session
c99b25ee-82ad-4c0d-916c-863b64797b28, zero tools, packet-only. Evidence prefix
p07-containment-opus-2026-09-20. Its three required text-only preregistration
corrections are incorporated above; the reviewer explicitly required no further
review pass for those corrections. No claim of experimental or product execution.

### Execution checkpoint,2026-09-21

The preceding approval-readiness result is historical. Owner approval was followed
by exactly three initial Windows/local-NTFS runs, one for each approved case.
All nine claims were observed in their fixtures with nine positive and nine unsafe
controls. Six child exits and all runtime fixture removals were confirmed. Full
maps show only preregistered owner/control changes; no product source was edited.
One pre-execution correction batch consumed the entire correction budget; Opus5
source review then returned PASS. No runtime correction or rerun occurred.

Evidence directory: .planning/evidence/p07-containment-spike-2026-09-20/.
index.json identifies raw receipts; map-review.json records every changed path;
findings.md gives the result/cost table and remaining proof obligations.
Independent Opus5/xhigh-requested raw-receipt review returned **PASS for bounded
fixture evidence only**, session91545cf2-5477-4145-aa3b-280bb1e2469c, zero tools,
terminal success. runtime-review.md owns the judgment; completion.json binds the
frozen source hashes, exact three-run index, build evidence and dispositions.
The nonblocking leaf positive-control reference mismatch is recorded without a
second correction: required ready/owner-write observations exist at events10/18,
while the control links open/close events7/19. All other limitations are retained
in findings.md. No successful guarded move occurred; this proves observed move
refusal, not safe mutation after a successful move. No production protocol, API,
native dependency or owner rename restriction is approved by these results.

## 22. Independent read-only progress while section21 approval is pending

Checked2026-09-20. No experiment, new test, module import, real-home inspection,
product edit or hosted mutation. The section21 approval question remains pending;
goal continuation is not that approval. Scope of this assessment is the assembled
distribution in this worktree, not a claim about a published/installed release.

### Capability-lock exposure and source-derived counterexamples

The assembled `dist/gsd-core/bin/lib/capability-lock.cjs` and pinned
`node_modules/@opengsd/gsd-core/gsd-core/bin/lib/capability-lock.cjs` are byte-identical,
SHA256 `3ae720ff1b9e7e3572f4fd36f708db5190dbef64fa96443112c3721894ab4c35`.
The pinned package identifies version1.9.1. No upstream-latest or installed-home
equivalence is inferred. Receipt: `.planning/evidence/p07-capability-lock-assessment-2026-09-20.json`.

Reachable call chain, confirmed by source inspection:

- `gsd-tools.cjs:298,2869,2968` imports/registers/dispatches the capability router.
- `capability-command-router.cjs:262,328,438` dispatches install/update/remove,
  calling lifecycle install/upgrade/remove after reconciliation. The lifecycle
  acquires the shared lock at lines822/1003/1132/1296 and checks acquisition failure
  before its protected mutation. Reconciliation uses the same lock.
- Router trust-revoke calls `revokeProjectConsent` at line710. Lifecycle consent
  recording calls `recordProjectConsent` at line735. Consent record/revoke acquire
  `.consent.lock` at lines669/722 before reading and rewriting the shared store.
  Store resolution is `<gsdHome or GSD_HOME or homedir>/.gsd/consent.json`; no actual
  user's path was opened. The lifecycle lock instead protects the capability root.

| ID / assessment | Source evidence | Consequence and required follow-up |
|---|---|---|
| CL1 / HIGH, exclusion race | capability-lock.cjs:472 checks identity,479 renames; shell-command-projection.cjs:714-743 ultimately calls plain renameSync without conditional identity | Two reclaimers can detach a successor's live lock. Require a deterministic multi-contender regression and a complete ownership protocol before accepting a repair. |
| CL2 / HIGH, unknown liveness treated as reclaimable | getProcessStartTime:181-210 returns null on failed/timeout probes; holderVerifiedLive:246-257 returns false for unknown start time; acquire:445-466 falls through to takeover | A lock older than60s can be taken from a live same-host holder when start-time evidence is unavailable. Foreign/unknown holder takeover after600s is likewise time-based, not death proof. Require tri-state liveness/domain cases. |
| CL3 / HIGH, release check/removal race | releaseLock:502-531 reads token, checks inode, then path-based rmSync; handle is not terminal | If takeover/replacement happens after release's last check, release can remove a successor. Require release/takeover interleavings and terminal-handle semantics in any approved repair. |

CL1 interleaving, derived from code rather than executed: dead acquisition A exists;
contenders B and C each finish the last identity check for A. Pause C. B renames A,
removes the renamed file, retries exclusive creation, publishes B and enters its
critical section. Resume C at renameSync: it renames the path now holding B, removes
B's file, retries exclusive creation and enters as C. Both writers now possess a
successful handle. The final identity check before rename does not close this gap.
All steps use ordinary scheduling between synchronous filesystem calls; no hostile
binary replacement, inode reuse or identical token is needed for this counterexample.

CL3 depends on replacement being possible: A's release completes its token/inode
check; a reclaimer replaces A with B; release resumes rmSync on the shared path.
CL2 provides one live-holder route, and CL1 independently demonstrates exclusion
failure. These are separate decision boundaries, not three reproduced incidents.

Consent impact is a concrete lost-update scenario: writer A reads a store containing
consent X; concurrent writer B revokes X and commits; A commits its older whole-store
view while recording unrelated Y, restoring X. Other consent binding checks still
apply; this assessment does not claim remote exploitation or actual unauthorized
execution. Lifecycle overlap also risks bundle/ledger/config inconsistency; the
specific resulting artifact has not been reproduced. A fresh uncontended success
test cannot establish safety against these schedules.

Disposition: **not suitable for installer reuse; installed-use/release qualification
remains open**. Implementing agent owns preparing a bounded reproduction/repair
contract before the next installed-use qualification/P21. Preserve pinned upstream
provenance; do not edit generated dist. Any overlay/upstream-source change or new
tests needs its own explicit allowlist/API decision. Source findings are strong
local evidence; platform reproduction, downstream effects, replacement design,
native gates and independent final-source acceptance are still required. This
records and advances the previously owned assessment; it does not accept the risk
or extend section21's experiment approval.

### Hosted evidence refresh

At2026-09-20T01:26:34Z, latest branch CI run35430281217 remains completed/failure
on897116f9, with18/18jobs returned and every step inventory empty. Receipt
`p07-ci-recheck-2026-09-20.json` and raw jobs retained. At01:29:07Z, the latest
repository CI run35440758703 (dependabot, created2026-09-19T11:40:31Z) also has
18/18jobs with zero steps. Its first check annotation says the job could not start
because the account is locked due to billing. Raw latest-run/jobs/annotations are
retained under the p07 prefixes. These are freshly fetched historical run results,
not a live billing-account probe or a new execution. No newer executed CI evidence
was found; no run was triggered and no push is authorized by the brief's recipe.

The same annotation announces ubuntu-latest migration to Ubuntu26 from2026-10-19.
Record this environment-drift input for the implementing agent's P02/P21 hosted
qualification; no workflow change is authorized here, and no current Ubuntu26
execution is claimed. User action remains the existing account-lock item, not a
new request to repeat it. Section21 scope approval remains independently pending.

## 23. Post-experiment containment decision,2026-09-21

Status: **DECISION REQUEST WITHDRAWN after owner premise-review request; see section24.**
No option was selected. Existing requirements remain in force. The text below is
a historical, reviewed proposal, not the required next owner choice.
Section21 is complete, not pending. The full campaign goal remains active and
incomplete. This section changes no requirement until the owner explicitly decides.
It does not authorize tests, another experiment, a native helper, or product edits.

### Requirements and minimum mechanism

The installer must exclude competing installers; preserve owner data; publish only
completed lock/restore state; preserve uncertain child/transaction state; and give
truthful failure/cleanup outcomes. Exclusion between cooperating installers does
not stop an editor, shell or sync tool from moving their parent directories.
Containing access to a directory object also does not establish that object is
still beneath its original pathname. Those are distinct possible guarantees;
production object-versus-pathname authority is not yet settled by H4 alone.

Section21 supports one Windows/local-NTFS mechanism: retain directory handles with
delete sharing denied. It observed blocked directory moves, successful ordinary
file edits, exclusive publication refusal on collisions, and a successful rename
after child close. It supplies no portable lock, root-bootstrap or post-move proof.
Receipts and final independent PASS are in p07-containment-spike-2026-09-20/.

Minimum structure under the strict pathname-boundary reading: trusted acquisition
of an anchor; enforcement of every relevant namespace boundary for the entire
operation; exclusive lock publication/release; and independent child quiescence.
Neither a PID check nor an advisory lock on installer metadata supplies the
namespace enforcement. Neither a preflight scan nor a last-moment recheck closes
the interval between inspection and a pathname mutation. These are deductions from
the operation ordering, not new runtime evidence or a universal impossibility claim.

### Platform and cost comparison

| Environment/mechanism | Available evidence | Remaining obligation and cost |
|---|---|---|
| Windows/local NTFS, retained handles and relative operations | Three bounded native cases, independently reviewed | Bootstrap from a trusted anchor, every operation boundary, normal-account ACLs, child lifetime, crash behavior, distribution and final-revision qualification; directory rename restrictions require explicit acceptance |
| Linux, directory descriptors/openat2 | Documentation: stable object reference and constrained open resolution | Does not by itself freeze the directory's original pathname or constrain later unlink/rename/write operations; no native fixture or complete strict-boundary mechanism qualified |
| macOS/POSIX-relative operations | No native proof obtained in this experiment | Existing native CI requirement remains; Linux-only openat2 is not a macOS implementation; no claim of portable containment |
| Windows/WSL shared targets, network/shared filesystems | No interoperability qualification | No common liveness or lock domain inferred; refusal remains required wherever proof is absent |
| Current Node pathname operations plus rechecks | Existing module and rejected takeover reviewed | Cannot be certified as enforcing the strict concurrent-topology boundary; more tests cannot manufacture the missing primitive |
| Explicitly coordinated topology during a maintenance window | Proposed product precondition, not current evidence | Smaller implementation may be possible, but unsupported concurrent moves/link changes cease to have a guaranteed outcome; a warning, checkbox or lock file does not enforce this precondition |

Primary sources checked2026-09-21:
[Linux open](https://man7.org/linux/man-pages/man2/open.2.html) documents stable
directory references across rename;
[Linux openat2](https://man7.org/linux/man-pages/man2/openat2.2.html) constrains path
resolution for the open operation;
[Linux flock](https://man7.org/linux/man-pages/man2/flock.2.html) describes advisory
locking, not a directory-rename fence;
[Microsoft CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew)
describes delete-sharing effects on rename/delete. These documents support the
primitive distinctions; they do not establish native portability or product safety.

A first-party helper would add a native build/release matrix, artifact integrity,
packaging, OS/filesystem compatibility and crash/IPC ownership work. The existing
scope permits no production dependency, module or port for it. A proposal must
retain the owner's cost envelope: no admin service, install-time compiler or
install-time binary download. No calendar estimate is asserted before a supported
design exists. Merely choosing Rust would not resolve the Linux boundary.

### Proposed decision and its precise trade-off

Recommendation for review: **consider a coordinated-topology installation contract
before authorizing a native subsystem**. The reduced skin retains measured workflow
value; a general concurrent-filesystem boundary is substantial additional scope.
This is a proposed relaxation of H4, not an interpretation already authorized by
the owner and not a claim to the original stronger end state.

The proposed maintenance window would run from before target/bootstrap checks until
all installer children are confirmed closed and metadata cleanup reaches its
reported terminal outcome. The owner must arrange that no other process moves or
replaces the target, its ancestors, traversed directories, mounts, junctions or
symlinks during that window. Protected transaction/lock names must remain exclusively
under the installer protocol. Ordinary content writes to existing regular files and
atomic replacement with another regular file would remain in scope of the existing
captured-pre-image/rollback guarantees, not a guarantee of retaining every
intermediate edit overwritten by another actor before observation. The closed
action table and preservation qualifications below govern this proposal.
The distinction between allowed regular-file replacement and forbidden topology
changes must be reflected in later operation contracts and adversarial tests.

The program cannot reliably prove that an arbitrary same-user actor will honor
that window. Diagnostics may identify known conflicts and refuse; they cannot turn
absence of detected activity into a guarantee. Crashes do not automatically end the
window: unresolved children must be quiescent before manual cleanup or another run.
An owner promise cannot replace automatic enforcement of cooperating-installer
exclusion, child safety, exclusive restore publication or terminal release.

If the owner accepts this change, it unlocks preparation of a **Node-only P07
candidate**, not its implementation: exclusive completed-file publication, unique
acquisition identity, terminal release, owned-temp cleanup and explicit residue
outcomes. All existing locks would refuse unless a separate safe takeover protocol
and shared liveness mechanism is later qualified. That has an availability cost:
a crashed lock may require owner-established wrapper AND child quiescence and
manual recovery. The exact argument/return shapes and support matrix still require
one combined approval before RED tests. No new CLI confirmation flag is proposed
or approved here; the user-facing support/precondition wording belongs in that packet.

If the owner retains the strict boundary, retain it verbatim: no Node-only repair
or Windows-only delivery is silently substituted. P07 remains unapproved until a
complete supported-platform boundary is designed and reviewed. The next proposal
must name actual mechanisms, scope and proof cases, not request unlimited native
research. Another experiment requires its own bounded approval because section21's
three-run/one-correction allowance is exhausted.

Windows-only completion and replacing the skin with stock upstream are not offered
as equivalent completions: neither fulfills the current accepted campaign scope.
The September19 reduced-skin decision and fixed1.12.0 destination are unchanged.

### Verification and owner decision gate

Independent review must challenge: whether the proposed window is understandable
and usable; whether ordinary editor behavior makes it impractical; whether a
Node-only protocol can preserve regular-file replacement guarantees; whether this
is an unjustified weakening of the requested end state; and any smaller mechanism
that preserves the strict boundary without changing scope. Review is judgment,
not native proof. No requirement changes merely because the reviewer agrees.

Before asking the owner, retain the final review and disposition every finding.
Then ask whether to accept this explicit boundary/availability trade-off, retain
the strict boundary, or prepare the window candidate with private upstream staging.
Do not re-ask the settled takeover policy or imply that an API, product test or
native helper is authorized by that answer.

### Critical-review amendments: exact decision boundary

First Opus5/xhigh-requested review: PASS WITH CHANGES, session
bf7e9979-eb77-479e-b380-b06a9f10b02b, terminal success, zero tools. Its eight required
clarifications are addressed below. Evidence prefix p07-boundary-decision-opus-2026-09-21.

**Current H4**, Sixth-review holistic table, accepted September19:

> Define the supported writer/threat model, then require a filesystem boundary
> that can enforce it. Refuse unsupported operations instead of declaring path
> rechecks race-free. No silent dependency/port expansion.

Its problem statement says preflight does not freeze links/directories/shared-path
topology. Separately, section21's approved moved-directory case requires that a
moved handle not authorize mutation outside the target boundary. That experimental
claim is the source of the stronger pathname-stability reading here, not a verbatim
universal H4 clause. H4 alone does not settle whether final production authority
follows an anchored object after its pathname changes. We must not silently accept
post-move writes: object-relative authority would also need an explicit supported
contract and counterexamples. No impossibility theorem is claimed.

**Exact proposed replacement H4 for the window candidate only:**

> All mutating installer operations, including install, uninstall mutation and
> locking, rollback, recovery, retirement and metadata cleanup, require a coordinated
> topology maintenance window. External actors may perform only actions marked
> allowed in section23's action table. The program does not enforce external
> topology coordination and does not guarantee containment if a forbidden action
> occurs; detection/refusal are best effort, not proof of absence. Cooperating
> installer exclusion, child quiescence, captured-pre-image verification, exclusive
> restore publication, owned cleanup and truthful outcomes remain mandatory.
> All other2026-09-19 accepted directions remain unchanged, including one-attempt
> permission, no interrupted-attempt replay, mutable-quarantine retention, separate
> result/verification/cleanup facts and per-entry link preservation.
> Unknown/mismatched recovery identities refuse automatic mutation. Unsupported
> primitive, filesystem or liveness behavior refuses. Refuse unsupported operations
> instead of declaring path rechecks race-free. No silent dependency/port expansion.
> No new dependency, module, port, API or CLI surface is approved by this decision.

The operative current-authority finding2 bullet also says:

> Preflight path checks alone do not establish safe containment under concurrent
> topology changes; the supported mechanism must be proved or the operation refused.

Under B/C only, replace that sentence with this exact proposed text:

> Preflight checks do not enforce containment under concurrent topology changes.
> The coordinated-topology window is an external precondition; no containment
> guarantee applies to forbidden external changes during that window. Within that
> precondition, each operation's safety mechanism must still be proved or the
> operation refused. Path rechecks are not race-free enforcement.

The rest of that bullet remains unchanged. These are proposed amendments in this
plan only; the accepted design note remains authoritative until owner approval.

This would apply to Windows too: the experimental native guard would not ship in
the Node-only candidate. It reduces protection against benign concurrent moves/link
changes by editors, sync clients, branch-switching tools and runtimes. An arbitrary
same-user adversary can also modify owner bytes directly; neither proposal promises
to prevent all such attacks. That observation does not excuse unsafe installer
writes. The window relinquishes guaranteed containment even when a benign actor
breaks its precondition. Later native strengthening requires separate scope/proof.

### Closed external-action table for the proposed window

Unlisted actions affecting traversed paths, managed roots or protected metadata are
forbidden. Root/ancestor restrictions take precedence over general allowed rows.
Targets include Claude/Codex config homes; runtime sessions and sync clients may
need to stop. This table covers external actors, not transaction-owned operations.

| External action | Classification | Required behavior within the proposed contract |
|---|---|---|
| Read ordinary regular-file contents | Allowed | No globally atomic view promised |
| Write existing regular-file bytes; atomic-save replacement by an independent regular file | Allowed | Captured-pre-image/rollback preservation below, not retention of every intermediate byte version |
| Create/delete independent regular files below an existing managed directory | Allowed | Existing rollback/new-entry rules, bounded collisions, truthful incomplete outcomes |
| Create/delete independent regular files directly in the target root | Allowed | Target root counts as managed for this row; protected-name restrictions take precedence |
| Create/delete unrelated sibling entries in ancestor directories, including ordinary HOME temporary entries | Allowed | Must not replace an ancestor/path component, alter its security metadata or touch protected names; HOME is not frozen |
| Create/delete directories inside managed roots, or create/delete top-level directories in the target | Forbidden | New project/session directory creation is allowed only inside an already existing unmanaged subtree under the next row |
| Change entries solely in unmanaged subtrees unrelated to traversed ancestors | Allowed | Do not descend/open their contents; preserve outside-root policy and truthful top-level observations |
| Rename/delete/replace target, traversed ancestor or managed directory; change mount/reparse topology | Forbidden | Known conflict refuses; absence of a detected conflict is not enforcement |
| Introduce/retarget a symlink/junction on traversed/managed paths; replace a regular file with a directory | Forbidden | Refuse known unsupported shape; do not follow it |
| Introduce hard links involving traversed/managed files, including outside aliases | Forbidden | Known multiply linked mutable entries refuse absent separate proof; scans do not detect every concurrent violation |
| Change ACL, ownership, mode or special attributes on traversed/managed/protected objects | Forbidden | Refuse or retain incomplete state under the later seam's metadata contract |
| Alter/remove lock, journal, snapshot, staging, attempt records or quarantine outside protocol | Forbidden | No manual deletion with live/unknown writers |
| Existing links/reparse entries/aliases before the window | Detected-and-refused for traversal/mutation without a safe operation | No authority to delete owner links or weaken accepted per-entry link preservation |

The unmanaged-subtree row includes creating/deleting its files AND directories.
A live Claude/Codex session need not exit merely to launch the installer: it may
continue only if every target-related action stays within allowed rows. If its
behavior cannot be bounded (for example it may create a new top-level directory),
use a separate terminal with that runtime stopped. The tool cannot certify that
promise. Usability on the owner's real workflow must be validated before release;
no real config home is inspected or modified for this proposal.

Static support costs for the initial B candidate are explicit, not hidden under
'unsafe operation': symlink/reparse targets or ancestors are proposed to refuse;
multiply linked mutable managed regular files are proposed to refuse. These are
NEW availability restrictions, requiring owner acceptance and later native proof,
not previously approved consequences of topology coordination. Stable dotfile
manager links and redirected-folder targets may therefore be unsupported. Paths
used to develop this repository are unrelated to this installation-target policy.
Existing root-link refusal is already in the brief's openTransaction proposal;
link preservation inside snapshots remains in the accepted design. Filesystems
unable to perform required exclusive hard-link restore publication already cannot
satisfy accepted finding2 step8(c); no copy/overwrite fallback is introduced. P07
must list exact supported filesystems rather than infer support from an OS name.

### Writers, ordinary saves and child limits

Current bin/install.js runs upstream against the real target, then writes overlay,
metadata and status-line state. It does not generate privately and commit only
through a guarded writer. A wrapper helper is therefore not an upstream sandbox.
The contract must cover both writers and permitted descendants. This is source
inspection, not a new exploit or execution demonstration.

The approved restore direction remains: completed private staging, exclusive
hard-link publication, never link snapshot bytes, never write the published file.
Move the current entry into an exclusively reserved transaction-owned quarantine
destination; reservation must prevent rename from replacing another retained entry.
A concurrent save may end up in quarantine; an open editor handle may keep writing
there. Publication collisions follow the accepted bounded quarantine/retry rule:
three attempts, then leave the colliding entry and report incomplete. Do not promise
the edit stays at its original name or quarantine is immutable. Unsupported hard
links/metadata refuse, never fall back to overwriting. These existing design rules
are not a proven Node implementation or permission to start the restore seam.

Child quiescence is an independent open gate. No qualified production mechanism
for all descendants after wrapper failure is supplied here on Windows, Linux or
macOS. A Node close event, POSIX process group, or assumed Windows job behavior does
not establish that proof. Live/unknown children refuse; normal completion still
needs the later guarded-child contract to establish the permitted process graph
and its terminal state. The maintenance promise does not replace that requirement.

The window continues through unresolved invocation state until quiescence and
recovery/retirement reach their reported terminal outcome. Later recovery must
reverify recorded root identities and refuse mismatch; that improves truthful
outcomes, not enforcement of earlier pathname stability. An owner unable to sustain
the window cannot treat this profile as supporting their target.

Manual crash recovery would require identifying the target and all potentially
writing wrappers/runtimes/hosts, stopping them using reliable native process-identity
evidence, then re-establishing the window before owned lock cleanup. Missing local
PID or timeout is insufficient. Without trustworthy quiescence retain/refuse; a
separately reviewed operator procedure may require controlled host shutdown/restart
with writers disabled. Unknown shared/remote writers remain unsupported. This is
an availability burden; the executable operator runbook remains owed before release,
not replaced by today's blanket 'delete the lock and retry' wording.

### Decision outcomes and cost

| Choice | Authorization sought | Cost/acceptance limit |
|---|---|---|
| A: retain H4 verbatim | No policy relaxation; object-versus-pathname authority stays open for a concrete contract | No complete production mechanism qualified today; repaired-contract mutation refuses until proof. Object-relative authority remains a candidate, not silently rejected. Pathname-stable Linux feasibility is unknown, not proved impossible. |
| B: coordinated window, Node-first candidate | Exact replacement H4/finding2 sentence, action table and static refusal classes; prepare combined P07 protocol/API and refusal matrix | Owner controls topology through operation and unresolved recovery; existing locks refuse until takeover qualified; static target/ancestor aliases and multiply linked mutable managed files refuse. B may still end in refusal; qualifying the pinned process graph may require a separate native-containment or explicit upstream-trust decision. It does NOT guarantee avoiding native scope. |
| C: window plus private upstream generation candidate | Prepare B with upstream writing a private target and wrapper-controlled publication | Additional design for existing-state seeding, path-sensitive settings/migrations/patches, output binding and real-install parity; may shorten the live-target window, but capture/commit/rollback/recovery still need coordination. Staging is not itself a sandbox. |

The earlier 'Node-only' label describes the proposed lock/metadata candidate, not
a promise that whole-install child safety can avoid native code. B is Node-first,
not certified Node-only delivery. Its recommendation is conditional on BOTH a
usable maintenance window and a qualified child-quiescence solution at acceptable
cost, as well as informed acceptance of the weaker topology promise. Until those
conditions are met it offers no established overall cost saving. C is not free safety: upstream
semantics may change under a private target. No answer completes P07, permits RED
tests, or changes the reduced-skin decision/fixed1.12.0 destination.

Review assertions not adopted as facts: no universal same-user containment
impossibility, no unverified libuv job guarantee, no claim the existing unmodified
installer currently refuses on every platform. 'Refuse until qualified' applies to
the repaired contract. Unexamined /proc/self/fd and platform-specific no-follow
facilities remain possible inputs, not proven mechanisms or new experiment authority.

### Final review disposition and decision status

Final Opus5/xhigh-requested review: PASS WITH CHANGES, terminal success, zero tools,
session55915f43-068f-4411-aa52-78c43fca987f. Five specified corrections applied:
standing rules and operative finding2 sentence retained/amended explicitly;
object-versus-pathname ambiguity corrected; sibling/directory/session actions
classified; new static refusal costs identified; Node-first child-safety uncertainty
made explicit. Reviewer required no further loop for these specified corrections.
This is not an unconditional reviewed PASS or approval of an implementation.
Raw review: p07-boundary-decision-final-opus-2026-09-21.md; disposition/source binding:
p07-boundary-decision-disposition-2026-09-21.json. No requirement changed.

Original September5 contract and September2 ratification were recovered read-only
from MAIN docs/inbox; p07-original-contract-recovery-2026-09-21.json retains full
source text and hashes. The earlier missing-source statement was checkout-local,
not evidence of a missing contract. Existing acceptance map and D1-D11 stand.

## 24. First-principles reassessment requested by owner,2026-09-21

The owner does not understand why section23 is the necessary decision and requests
an explanation, systems view, first-principles derivation and alternatives independent
of prior choices. This authorizes analysis, not A/B/C, a requirement relaxation,
new product architecture, tests, experiments or implementation. The section23 choice
request and B recommendation are withdrawn. Accepted safety requirements stand.

### Where the chain went wrong

The completion objective is a useful, maintainable reduced skin with safe updates,
correct workflows and durable recovery. It is not a particular rollback algorithm.
September19's matched comparison justifies selected routing/accounting/roadmap/owner
protections, not all fork machinery. Both tested delivery alternatives failed the
recovery acceptance; stock upstream is not an evidenced recovery solution.

Current bin/install.js:948 onward runs the upstream installer against the real
shared target, then adds overlay/metadata/status-line writes. Failure invokes
rollback. Its known false rollback result and owner-data hazards are real. Repair
work consequently expanded into snapshots, journals, child quiescence, locks and
concurrent namespace handling. Section21 supplied a narrow Windows primitive result,
not proof that this overall live-rewrite architecture is the right delivery model.
Section23 prematurely treated that model as the basis for choosing a protection
mechanism or shifting topology responsibility to the owner.

### Requirements derived from the outcome

Preserve the working installation until its replacement is ready; preserve unrelated
owner state; exclude competing updates; survive interruption with attributable
recovery; report actual outcomes; preserve intended runtime behavior across platforms;
keep maintenance proportionate to the measured skin value. These are outcome tests,
not permission to discard existing requirements or fixed campaign decisions.

The minimum conceptual structure is candidate preparation/validation, a defined
ownership boundary, a bounded activation operation, retained prior state, and an
explicit recovery protocol. It need not begin by modifying a broad live directory
and then trying to infer/reverse every change made by an upstream child.

### Compare against existing mechanisms

- scripts/compose.js already accepts a distinct distDir and emits composed metadata.
- scripts/verify-upgrade.js already uses private workspaces and runtime environments
  for candidate checks. scripts/vetted-upstream-versions.js binds vetting to evidence.
- These are reusable foundations, not proof of production activation or a sandbox.
- Current upstream installation writes multiple runtime surfaces and uses relative
  dependencies, for example scripts/changeset to scripts/lib and gsd-core modules
  (dist/bin/install.js:11269 onward). Existing commands/skills/settings and mutable
  runtime data cannot be assumed to follow one generation pointer consistently.

Preferred architecture to assess: prepare a separate versioned GSD-owned generation,
validate it before activation, retain the prior generation, and minimize changes to
shared runtime integration. Keep user configuration and mutable state distinct from
replaceable shipped content. Where runtime adapters permit it, select a generation
once per operation/session rather than resolving a moving pointer on each read.
Initial installation and legacy migration are distinct from routine updates.

This is a candidate, not an approved implementation. Known architecture precedent:
[Nix profiles](https://nix.dev/manual/nix/2.34/package-management/profiles.html) retain
versioned generations and switch profile references. This illustrates the pattern;
it does not prove a portable single-switch implementation for Claude/Codex, suggest
adopting Nix, or authorize a new package manager.

### Limits and recommendation

Private staging followed by copying over all live files still leaves the difficult
publication problem. Separate versioned generations can reduce it only if actual
runtime path/adapter contracts cooperate. Shared settings edits need their own
coordination/conflict protocol; a precheck plus rename is not compare-and-swap.
A pointer switch does not make multiple config edits atomic, pin a running session,
sandbox upstream, establish child death, or qualify crash/power-loss durability.
Mutable data and deferred deletion remain separately owned proof obligations.

Recommendation: do not select A/B/C or weaken containment to fit the current repair.
First compare the existing live-rewrite repair against generation-based delivery
using a bounded compatibility map: enumerate installed surfaces and readers/writers;
classify shipped content, mutable state and shared settings; identify every activation
write and legacy migration; test feasibility against supported adapter seams and
existing acceptance requirements. This is desk/source analysis first. Reject the
candidate if it needs extensive upstream forking, a new orchestration/package
framework, or conceals the same shared-state races behind an activation abstraction.

A narrowly scoped maintenance interval may still be appropriate for initial setup
or genuinely shared settings. Its necessity and exact affected surface must follow
that map, rather than an indefinite whole-operation promise that directories stay
unchanged. Preserve current repairs/evidence as useful assets; sunk work does not
select the architecture. No additional runtime test or production scope is approved.

### Section24 compatibility assessment completed,2026-09-22

**Recommendation:** qualify private preparation first, with publication treated as
a separate, explicitly owned operation. Do not make whole-runtime versioned
generations the next implementation target. The inspected adapters do not supply
one activation point, immutable installed content, or a session-generation binding.
Versioned storage for a verified payload is still useful as a candidate, but a
transparent generation switch currently requires changes across runtime discovery,
artifact writers and shared state. No delivery architecture is accepted by this
assessment; in particular this does not reinstate section23's maintenance-window
recommendation or approve the current live-rewrite implementation.

The smallest justified direction is to move upstream execution, conversion and
validation away from live state, reuse the existing composition/verifier pieces,
and require an explicit publication contract for the remaining live writes. This
removes an upstream child's broad live mutation from the intended design; it does
not make copying prepared files transactional. Initial setup, legacy migration and
routine updates must have distinct write sets. Configuration changes are not
routine payload activation merely because the installer currently performs both.

#### Evidence boundary and extracted source manifest

This is the approved desk/source assessment, on branch
`chore/upstream-bump-1.9.1`, HEAD `e50bda5b9dc6c538bd33f1736fe59fcc957f78a7`,
plus preserved dirty work. Receipt:
`.planning/evidence/p07-section24-compatibility-2026-09-22.json`.
It binds 37 inspected files by SHA256 and records pre-documentation tracked dirty
hashes/status. The existing dist metadata declares upstream1.9.1, overlay3.0.2,
composed2026-09-20. This is **not** a fresh compose, package-integrity check,
behavioral run, independent review or native-platform qualification. The fixed
campaign endpoint remains1.12.0; this map must be rechecked at each adopted bump.

The source references below are extraction anchors, not runtime proof:

| Ref | Source and decisive anchor |
|---|---|
| S1 | `bin/install.js:948` install: transaction, inherited-environment upstream spawn at1055, overlay/metadata/status-line work and rollback. Status-line writer at841. |
| S2 | `dist/gsd-core/bin/lib/runtime-artifact-layout.cjs` findInstallSourceRoot/findAgentsSourceRoot, dispatchKindEntry and resolveRuntimeArtifactLayout; `runtime-artifact-install-plan.cjs` createRuntimeArtifactInstallPlan. |
| S3 | `dist/gsd-core/bin/lib/capability-registry.cjs:477` Claude descriptor; `:999` Codex descriptor; `runtime-homes.cjs` getGlobalConfigDir/resolveConfigHomeFromDescriptor. |
| S4 | `dist/bin/install.js:10376` migration dispatch; `:10478` source marker; `:10702` Claude local commands; `:10786` core copy; `:10930` agent loop; `:11110` hooks bundle; `:11269` scripts; `:11467` Codex config branch; `:12054` Claude settings; `:12408` finish settings write. |
| S5 | `runtime-artifact-conversion.cjs:2172` computePathPrefix and `:2493` rewriteStagedSkillBodies; `dist/bin/install.js:7031` installCodexConfig embeds absolute core paths. Unqualified module paths in this table live under `dist/gsd-core/bin/lib/`. |
| S6 | `install-engine.cjs:56` USER_OWNED_ARTIFACTS; `:677` installRuntimeArtifacts; `surface.cjs:92` writeSurface and `:334` materialization; `commands.cjs:579` cmdEffortSync; `profile-output.cjs:673` profile destination. |
| S7 | `capability-command-router.cjs:61` scope root resolver; `capability-lifecycle.cjs:49` capabilitiesRoot/capDataDir; `capability-loader.cjs:244` overlay roots; `capability-consent.cjs:160` consent root; capability-ledger.cjs and capability-writer.cjs. |
| S8 | `dist/bin/install.js:7001` shared defaults, `:9455` file manifest, `:9757` patch backup; `installer-migrations.cjs:621` journal roots; `bin/install.js:734` patch history. |
| S9 | `dist/hooks/gsd-check-update.js:135` cache and `:149` worker; worker writes; `gsd-statusline.js:317` context bridge; `gsd-context-monitor.js:70` temporary session metrics; `dist/scripts/changeset/cli.cjs:20` sibling imports. |
| S10 | `scripts/compose.js` merge with distinct distDir; `scripts/verify-upgrade.js:421` allowlisted child environment and `:506` private roots; `scripts/vetted-upstream-versions.js:47` evidence hash binding. |

#### Installed surfaces, discovery, ownership and activation

Notation: **R** is the selected runtime config root (global Claude defaults to
home/.claude, Codex to home/.codex; their environment overrides and explicit target
selection matter). **P** is the resolved project root; local runtime roots are
P/.claude or P/.codex. **H** is os.homedir(); **G** is GSD_HOME or H. These are
different authorities. **A** is H/.agents for the inspected global Codex layout.
Generation feasibility below is an assessment, never a runtime guarantee.

| Surface / actual location | Reader and discovery | Writer and ownership / state class | Coupling and generation feasibility | Required activation or migration / unresolved question |
|---|---|---|---|---|
| Core: R/gsd-core/{bin,workflows,templates,references,...}, VERSION and .gsd-runtime | CLI sibling imports; skills/agents reference core paths; model/capability readers inspect runtime/version markers | Upstream copies/replaces core; wrapper adds overlay helpers. Shipped payload **except** owner profile noted below | Internal relative tree can stay together; external prompts contain target-specific paths. Payload pinning is plausible if callers receive an explicit stable generation path (S4,S5) | Existing layout needs many replacements. A retained generation needs caller bindings; changing R/gsd-core alone does not switch skills, agents or hooks coherently |
| Claude global R/skills/gsd-*/SKILL.md | Runtime file discovery; GSD surface/capability readers also inspect skills | Installer layout conversion and surface/capability materialization; owner edits and gsd-dev-preferences also exist. Derived, mutable installed surface | Path rewriting targets R, not a generation authority. Stable delegating skill files are a candidate; metadata, invocation rules and body parity must be preserved (S2-S6) | Per-skill publication/removal and profile changes; live discovery can mix old loaded instructions with new files |
| Claude local R/commands/gsd-*.md | Runtime flat command filenames; body references rewritten core | Bespoke installer branch, stale command removal and legacy commands/gsd migration; dev-preferences preserved separately | Local and global do not share one install path. A global-skills-only adapter does not cover this path (S4) | Individual command writes, legacy tree cleanup and stale skill removal; owner artifact migration is separate |
| Codex global A/skills/gsd-*/SKILL.md | Runtime user skills; installer uses descriptor home=.agents | Installer uses kind.home; GSD surface writer currently uses layout.configDir. Shared with other skill producers | Outside R even with CODEX_HOME/--config-dir selected. Per-folder symlink discovery is documented; that does not bind other surfaces (S2,S3,S6) | Must enumerate A separately; cannot replace all A/skills. Destination disagreement F1 below blocks claimed writer compatibility |
| Codex local skills | Inspected layout resolves to R/skills: home override is applied only for global scope | Installer conversion/copy | Official current repo discovery uses P/.agents/skills. Compatibility of inspected local location with a selected Codex build remains unproved (S2,S3) | F2 below: qualify local discovery before claiming support; no silent relocation or legacy deletion |
| Claude R/agents/gsd-*.md | Runtime agent discovery; GSD agent checks | Installer adds effort; effort sync rewrites regular .md files; owner customizations. Derived mutable state | cmdEffortSync skips symlink files and refuses non-Claude runtime work. Symlinked agents are not a transparent replacement; symlinked parent directories could instead expose generation bytes to writes (S4,S6) | Per-agent changes, effort and model policy; pinning needs an approved writer strategy, not only a pointer |
| Codex R/agents/gsd-*.toml and emitted .md | Runtime native TOML agents; generated fallback instructions can read TOML relative to active config root | Installer converts bodies and embeds model/effort; owner policy influences generation | Absolute R/gsd-core path is embedded in TOML. Settings defaults and project overrides influence bytes. Stable agent names do not pin the body/workflows (S4,S5,S8) | Agent file publication plus config/default interactions; no documented whole-set switch established |
| R/hooks, hooks/lib and R/package.json CommonJS marker | Settings/hooks.json command paths; hook sibling imports and child worker path | Installer bundled copy; runtime executes hooks and worker. Shipped executable payload; outputs live elsewhere | Keep hooks with their dependent core/libs. A stable executable launcher could select once per invocation; later invocations and loaded skill prose may select differently (S4,S9) | Hook registrations plus payload; child lifetime and release/reclamation remain open, including detached workers |
| R/scripts/changeset, R/scripts/lib and selected helper scripts | Update workflow executes scripts; changeset imports ../lib and ../../gsd-core | Installer copies package-source files into shared scripts directories | Preserve sibling topology; copying only an entrypoint breaks imports. Payload grouping plausible, direct workflow paths still need binding (S4,S9) | Publish only attributable files, preserving unrelated scripts; generation adapter must cover direct script invocations |
| R/.gsd-source | findInstallSourceRoot and findAgentsSourceRoot, staging and later surface operations | Installer writes package commands/gsd **source** location, Claude global only | Absolute source/cache dependency; agent source inferred from sibling topology. A private stage path cannot be removed while marker consumers depend on it (S2,S4) | Publish durable matching source authority, not a dangling preparation directory or stale npx cache marker |
| Claude R/settings.json global, R/settings.local.json local; local installer can also reconcile R/settings.json | Runtime hooks/permissions/status line; installer reads existing config | Upstream merge/write; wrapper always invokes patchStatusLine(R/settings.json), even after Codex install. Shared owner configuration | Whole-file read/modify/write; neither rename nor a generation pointer prevents concurrent owner-write loss (S1,S4) | Explicit field ownership, conflict/recovery protocol and related backups/temp files; wrapper's extra Codex settings.json write must be accounted for, not treated as native Codex config |
| Codex R/config.toml and R/hooks.json | Runtime features/agent settings and hook registration | Codex adapter migrates/merges config and separately registers hook events; shared owner config | Separate files, absolute runner/hook references; config adapter is an install intent dispatcher, not activation transaction (S4,S8) | Multi-file activation remains. Existing temporary rename protects a file from truncation, not this set from mixed reads or intervening edits |
| H/.gsd/defaults.json; P/.planning/config.json and planning/state files | Effective config/model/effort and workflow commands | Installer writeNonClaudeDefaults uses H directly; runtime configuration/state writers and owner edits | Defaults are cross-runtime mutable state, not inside R and not redirected by GSD_HOME in this writer. Project state must survive payload changes (S6-S8) | Private preparation must not write real H or consume unrelated live project policy. Coherent-resume integration remains separately required |
| R/.gsd-profile, R/.gsd-surface.json; owner USER-PROFILE.md under R/gsd-core and gsd-dev-preferences in skills/commands | Profile/surface resolver; workflows consume owner profile/preferences | Installer/profile/surface/capability writers; profile-output writes USER-PROFILE.md; owner edits | Installed tree is not wholly immutable. read-only generations would break these writes unless redirected or independently projected (S6) | Separate authored state from shipped content with an approved migration/read contract; copying owner state into each generation creates stale divergent copies |
| G/.gsd/capabilities/<id>, G/.gsd/capability-data/<id>, G/.gsd-capabilities.json; project equivalents rooted at P | Capability loader composes global/project overlays; version and consent checks | Capability lifecycle and ledger writers. Independently versioned extensions plus mutable data; **not R by default** | CLI global scope passes G, project scope passes P. Lifecycle parameter runtimeDir means scope root here. Generation switching core does not switch extensions, consent or schema compatibility (S7) | Keep existing data authority; qualify old/new core with extensions. Lifecycle lock at scope/.gsd/capabilities/.lock; CL1-CL3 remain open |
| G/.gsd/consent.json and its consent lock | Loader validates project-specific consent against user-owned store | Consent/lifecycle operations; user-owned trust state | Outside project even for project capabilities. G is independent of CLAUDE_CONFIG_DIR/CODEX_HOME (S7) | Never restore old consent as a side effect of payload rollback; exact concurrent mutation/recovery protocol separately owned |
| R/gsd-file-manifest.json, .install-meta.json, .overlay-manifest.json; gsd-local-patches and migration journal/backups | Installer drift, ownership, update/reapply/recovery readers | Upstream/wrapper writes; historical owner edits and recovery evidence retained | Metadata binds artifacts; not mutable state to roll back indiscriminately. Off-root Codex skills must be represented consistently (S1,S8) | Publish matching evidence with actual selected content; keep failed/previous state attributable; legacy migration must preserve unrelated paths |
| H/.cache/gsd and os.tmpdir() session context files | Update/status-line/context hooks | Update worker and context/status hooks; mutable shared/session outputs | Outside payload; cache identity is not a session-generation pin. Worker retains executable dependencies (S9) | Do not put caches inside immutable generations or delete old generations before consumer lifetime is settled |

This map covers the traced Claude/Codex delivery families and material runtime
writers, not an exhaustive dynamic syscall inventory for every command or optional
extension. Prefix ownership is not proof that all matching owner files are disposable.
Custom paths, linked roots, per-project/global precedence and selected runtime
versions remain qualification axes. No real runtime directory was inspected.

#### Host discovery evidence and session coherence

Official documentation checked2026-09-22: Claude supports symlinked skill folders
and watches SKILL.md changes during a session. It does not describe that as a
transaction with agents, settings, hooks and referenced workflow files. This makes
session pinning an additional obligation, not a consequence of file discovery.
[Claude skills](https://code.claude.com/docs/en/skills).

Codex documents user/repository .agents/skills discovery and symlinked skill
folders. Its custom agents are separately discovered TOML definitions. Those
contracts do not establish a portable all-surface switch or guarantee symlink
semantics for every other artifact type.
[Codex skills](https://learn.chatgpt.com/docs/build-skills),
[Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents).
These current documentation observations do not qualify any installed runtime
version. No latest-release assertion or automatic runtime upgrade follows.

Concrete mixed-generation schedule: a runtime loads an old skill/agent body;
activation replaces its referenced stable core path; a later command reads a new
workflow or launches new core code. A launcher resolving once per process only
pins that process. It does not pin previously loaded prose, future tool calls,
subagents, or mutable extensions. A retained generation must be referenced by
the whole operation, or an explicitly approved reload/session boundary is needed.
Neither mechanism is present as a demonstrated contract here.

#### Three candidate comparison

| Candidate | Benefit supported by source | Remaining live work / compatibility cost | Assessment |
|---|---|---|---|
| Current live rewrite plus repair/restore | Reuses existing runtime conversion paths and prior tests/validator work | Upstream child mutates payload, discovery files, configuration, migrations, defaults and off-root skills; recovery must identify and preserve all owners while proving child quiescence | Baseline only; neither September19 recovery result nor section21 primitive accepts this architecture. Most expensive live mutation boundary |
| Private preparation, then publication into current layout | Composition and private verifier already supply useful pieces; preserves existing discovery conventions and minimizes upstream divergence | Must render for final destinations, separate live config intent from fixture config, enumerate all owned roots, and publish a multi-file set safely. Partial copies still mix generations | **Preferred next qualification direction**, not a safe implementation already proved. Reject an implementation that merely runs upstream privately and copies every resulting file back |
| Versioned owned generations with stable adapters | Retains payload and may reduce executable activation writes; relative core/hooks/scripts bundle can remain together | Skills/agent discovery, effort sync, surface materialization, owner profiles, absolute paths, source marker and shared configuration need coordination. A symlink swap cannot cover them all | Do not select whole-runtime generations as the next build target. Retain only the narrower immutable-payload idea pending proof that adapter/writer changes stay small and preserve workflow semantics |

The minimum plausible generation unit is a co-located shipped core, dependent
hooks/scripts and retained source needed for rematerialization, excluding mutable
profile/data/configuration. That is a candidate **storage** unit, not an approved
directory shape, new port or API. Skills/agents remain integration surfaces until
their body, metadata, model/effort and invocation semantics are proven compatible
with delegation. A new package manager, broad workflow rewriting or a permanent
fork of the runtime adapters fails the reduced-skin maintenance criterion.

#### Activation writes and publication obligations

For the existing-layout candidate, the source-derived activation inventory is:

1. Owned core/hook/script/overlay file replacements and any stale owned removal.
2. Runtime discovery skills/commands/agents, including global Codex's other root.
3. A durable source marker and profile/surface intent reconciled with owner changes.
4. Shared Claude settings or Codex config/hooks changes, wrapper status-line writes,
   and any deliberate global defaults change. These require separate ownership and
   conflict decisions; never copy fixture defaults wholesale into the owner home.
5. Matching ownership/version/install metadata and recoverable migration/patch
   records. Existing runtime caches and capability/user data are outside payload.

For a generation candidate, only item1 could plausibly shrink to a selected
payload reference. Items2-5 do not disappear. Initial setup establishes discovery
and hook entries; legacy migration resolves old locations and authored bytes;
routine update should avoid changing them when its integration contract is
unchanged. No claim of a single atomic activation is justified for either path.

#### Owned findings and explicit qualification gates

| ID | Fact or unresolved compatibility issue | Owner and concrete trigger |
|---|---|---|
| F1 | Source mismatch: createRuntimeArtifactInstallPlan uses kind.home or configDir; surface.applySurface uses layout.configDir only. Global Codex install targets H/.agents/skills but materialization targets R/skills. Capability-state's installed fallback also reads configDir/skills. Source-local confidence high; user-visible outcome not reproduced | get-stuff-done implementing agent: separately scoped reproduction and disposition before any Codex materialization/installed-use acceptance. No silent fix, inbox closure or main-checkout write |
| F2 | Local Codex descriptor home is ignored by dispatchKindEntry's global-only home resolution, yielding R/skills. Current official repository discovery documents .agents/skills. Compatibility with an intended runtime build is unverified | Same owner: exact-version local install/discovery fixture before local support or migration acceptance; determine whether another supported discovery mechanism closes the gap |
| F3 | Claude effort sync writes regular installed agent files and deliberately skips symlink files. Owner profile writes target core. These conflict with treating all installed content as immutable | Same owner: writer-compatible projection/state strategy must be approved and demonstrated before selecting generations; preserve D1/D2/D4 behavior |
| F4 | GSD_HOME isolates capability state/consent, while non-Claude installer defaults use os.homedir(); CODEX_HOME alone does not isolate Codex skills | Same owner: private-home and complete outside-target observation are mandatory before any approved preparation experiment; reuse section20 constraints, never point at real homes |
| CL1-CL3 | Previously recorded capability takeover/unknown-liveness/release findings remain reachable; changing installer delivery does not repair lifecycle locks | Same owner: separately approved reproduction/repair before installed-use qualification/P21; receipt p07-capability-lock-assessment-2026-09-20.json retained |

Qualification criteria, agreed scope and concrete protocol/API approval required
before experiments or RED tests:

- **Q1 Source and preparation:** exact composed candidate identity, full output
  inventory and successful private conversion for Claude/Codex global/local.
  Deliberately malformed/missing artifacts must fail. All owner-home, alternate
  skills, defaults, consent, cache and project observations remain unchanged.
  Reuse compose, verifier allowlisted environment and vetted hash evidence; an
  environment redirect is not a sandbox or proof that every child has stopped.
- **Q2 Destination binding:** prove final-target rendering without a live-target
  write; distinguish logical final paths from physical staging paths. A prepared
  result referencing deleted staging, npx cache or another generation fails.
  Preserve scripts/hooks/core relative imports and exact runtime discovery.
- **Q3 Writer compatibility:** disposition F1/F2; exercise surface/capability
  materialization, effort/model behavior, user profile/preferences and extension
  reads/writes. For generations, writes must neither mutate retained shipped
  bytes nor disappear into a new stale state copy. Preserve the fixed campaign
  decisions rather than dropping a troublesome writer to simplify activation.
- **Q4 Publication and recovery:** enumerate the complete live write set; approve
  exclusion, owner-write conflict, interrupted publication, restart, truthful
  status and one-attempt recovery semantics. Retain old usable state and changed
  owner bytes; missing/unknown liveness refuses unsafe recovery. Cover roots and
  topology under accepted H1-H8; no section23 restriction is silently restored.
- **Q5 Runtime coherence:** exact-version installed discovery and representative
  skill -> agent -> workflow -> CLI -> hook operation on old/new candidates,
  including a consumer alive across publication. Prove binding or obtain explicit
  approval for a bounded reload/session rule; neither is implied by symlink support.
- **Q6 Native and acceptance:** supported Windows/Linux and other promised native
  platform/path behavior, child lifetime and durability evidence; Tier S branch
  and decision checks for publication/state logic; final-revision review and
  actually executed CI. Retained DACL intermittency and moved-list oracle gap
  keep their existing owners/triggers. All nine campaign rows remain pending.

The next approval should be a bounded private-preparation/destination-binding
qualification packet covering Q1/Q2, with an exact fixture matrix, allowed writes,
assertions and stop conditions. It must explicitly exclude live publication and
runtime-home installation. Prepare that concrete packet before requesting its
execution; do not start a fresh strategic assessment or invent a production API
from this recommendation. F1/F2 reproduction/repair and Q3-Q6 require their own
scope where they exceed that packet. No new experiment was run in this assessment.

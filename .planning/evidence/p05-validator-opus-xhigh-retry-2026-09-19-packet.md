# Retry: final packet-only critique required

You have NO tools. Do not request, imitate or emit tool calls. Do not claim to inspect disk, run commands, or verify hashes. Review ONLY the supplied code and contract. You have enough source for code-local review. Return a substantive final verdict and numbered findings, or explicitly say CANNOT REVIEW with the reason. A plan to review is not a review. Do not start with verification or promise future work.

Status correction superseding historical text below: the owner approved the1074-file snapshot relocation; it completed with matching paths/sizes/SHA256. Post-relocation pinned-Bun lint exits0 with0errors/815warnings, rules unchanged. CJS rule coverage and harness branch proof remain open. The preceding review attempt emitted simulated tools and no findings, and was rejected. This retry must produce an actual code critique. Source bytes below are unchanged.
# P04/P05 validator implementation review

You are the independent critical reviewer. The owner explicitly requested Opus5
at xhigh effort. This is a cold, read-only review of the implementation below.
Return PASS / PASS WITH CHANGES / NOT PASS, then severity-ranked findings with
concrete file/line evidence, reproducer and minimal repair. Distinguish code-local
findings (high confidence) from owner-policy/platform conclusions (context-dependent).
Do not edit, execute, approve a release, or infer unavailable native evidence.

Worktree: C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign.
Branch: chore/upstream-bump-1.9.1. Base HEAD e50bda5b; review the dirty source bytes
identified below, not just HEAD. No installer wrapper or lock-source edits.

The owner approved both execution-plan section12 and the section16 amendment after
your earlier Opus review found H1: expected failure labels could conceal additional
damage in truncated diagnostics. Approved changes include complete observations,
host/runtime inputs and an independent upgrade owner-preservation check. The exact
contract is appended. Section16 supersedes section12's old arguments and 24-count.

Review only scripts/expect-red.cjs, tests/expect-red.test.js and the bounded changes
to tests/acceptance/installer-recovery.cjs. The repair must fail closed on incomplete,
stale, malformed, conflicting or weakened evidence. It is an interim expected-red
gate, not acceptance of the still-unimplemented transaction or unsafe existing lock.
P07 combined lock protocol/API is unapproved. No preflight/snapshot work is authorized
in this session. No real user homes, push, merge, release or global configuration edits.

Known implementation evidence (do not inflate it):
- Fresh recovery:25 checks,12PASS/13FAIL, disposable fixture removed, source digests.
- Frozen transaction TAP:51 cases,41PASS/10 named renderOutcome failures, no skips.
- Node/c8 probe3:56 tests pass, validator100% statements/branches/functions/lines.
  This excludes the two slow observation cases; those passed in an earlier full
  focused Bun run of51 tests. The test file subsequently gained12 targeted decision
  mutants, all detected under Bun. A later RED/GREEN fix rejects supplied malformed
  termination markers (error:false/0/empty/null or signal:false/0/empty). Final
  combined measurements of those current bytes are still pending.
- The real Node coverage CLI passed using private report/V8 directories.
- Full project Bun1.3.5 suite passed1826tests/70files/0fail BEFORE that final
  termination-marker fix; do not transfer it to newer source.
- Full lint failed684 errors, ALL in an untracked retained upstream1.14.0 comparison
  snapshot under .planning/evidence. There were zero repository-source errors.
  Owner approval for hash-verified snapshot relocation is pending; lint rules are
  unchanged. Existing repository warnings are not certified remediated. Inspection
  found eslint.config.js security rules target **/*.js, not the two changed .cjs
  files. Thus zero repository-source errors does not prove those rules ran on them.
- Native Node22, Linux and macOS have NOT been measured. Pure host-path controls do
  not prove native behavior. The changed acceptance harness has live scenario proof,
  and a diagnostic report from its unchanged earlier Node/V8 capture measures
  96.01% statements/lines,100% functions,86.86% branches. Its digest is unchanged
  (87047200ee914ebab1c67d72fafed3a9356d8b64878c6f4d0ec0616587da6ee4).
  This misses the shared per-file branch bar; the gap remains OPEN, not waived.

Explicit questions:
1. Can any additional regression still pass either judge while the reviewed red
   signature remains? Check observations, inventories, path identity and TAP framing.
2. Are source binding, package-byte parsing, exact command policy, private config,
   reports and cleanup/termination semantics sufficient under the approved trust
   model? Source hashes are not claimed as hostile-process attestation.
3. Do tests and12 decision controls test the intended contract, or hide weaknesses?
4. Are report shapes and never-fail owner checks independently meaningful? The
   separate required-PASS list always applies even if a row enters the FAIL list.
5. Identify missing operational or quality proof precisely. Do not accept the
   whole project from unit coverage, and do not reopen fixed owner policies silently.

Only findings supported by the packet are confirmed findings. If information is
missing, name the exact missing proof; do not invent source contents or test results.
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



BEGIN SOURCE scripts/expect-red.cjs SHA256 a951904a007d52079be1ae7ca47c2e2cfa6ed76950c97bb091646f911ed55b81
   1: 'use strict';
   2: 
   3: // Holds a gate in expected-red mode while its fix is built test-first. The gate still
   4: // runs on every platform, and this wrapper passes only when it fails for the KNOWN
   5: // reason. An unexpected pass fails, and so does a red for any other reason (a missing
   6: // compose, a fixture that never reached its injection). Remove a gate's entry, and
   7: // call the gate directly, when its fix lands.
   8: // Plan: docs/plans/features/installer-transaction.md, Steps 1, 2 and 5.
   9: const path = require('path');
  10: const fs = require('node:fs');
  11: const { createHash } = require('node:crypto');
  12: const { spawnSync } = require('child_process');
  13: const { isDeepStrictEqual } = require('node:util');
  14: 
  15: const PROJECT_ROOT = path.resolve(__dirname, '..');
  16: const RECOVERY_SOURCES = ['bin/install.js', 'dist/bin/install.js', 'tests/acceptance/installer-recovery.cjs'];
  17: const COVERAGE_SOURCES = ['bin/lib/install-names.js', 'bin/lib/install-transaction.js',
  18:   'tests/coverage/install-transaction.test.cjs', 'tests/helpers/fault-fs.cjs'];
  19: 
  20: // Reviewed 2026-09-19: the first 41 cases pass; only the ten render cases fail.
  21: // Fixed policy, not inferred from a candidate run or loaded from a mutable report.
  22: const COVERAGE_CASES = [
  23:   "names: the four classes match the accepted table exactly",
  24:   "names: the table cannot be changed by a consumer",
  25:   "names: no name belongs to two classes, so a root is never also protected",
  26:   "names: the module requires nothing, so cleanup never loads the transaction to read names",
  27:   "comparison keys: stored names are kept on linux, case folds on win32, case and NFC fold on darwin",
  28:   "comparison keys: an unknown platform keeps stored names, like linux",
  29:   "protected names: exact names and both generated families are recognised",
  30:   "protected names: near misses are owner names, not protected ones",
  31:   "protected names: a case variant is the same directory on win32 and darwin, a different one on linux",
  32:   "transaction: the module exposes one factory and the sixteen planned operations",
  33:   "lock: acquiring writes the pid and creation time, and releasing removes the file",
  34:   "lock: it is published whole by a link from a finished temp file, never written in place",
  35:   "lock: releasing never deletes a lock that now names another installer",
  36:   "lock: a holder that is alive refuses with the exact instruction and touches nothing",
  37:   "lock: a holder that is alive but owned by another user (EPERM) refuses with the exact instruction and touches nothing",
  38:   "lock: a holder that is undecidable (an unexpected error) refuses with the exact instruction and touches nothing",
  39:   "lock: a holder that is dead is taken over, and no stale file is left behind",
  40:   "lock: a lock file that is empty cannot prove its holder dead, so it refuses without a pid or a time",
  41:   "lock: a lock file that is not JSON cannot prove its holder dead, so it refuses without a pid or a time",
  42:   "lock: a lock file that is missing its pid cannot prove its holder dead, so it refuses without a pid or a time",
  43:   "lock: a lock file that is carrying a pid that is not a positive integer cannot prove its holder dead, so it refuses without a pid or a time",
  44:   "lock: a lock file that is carrying pid 0, which a probe would read as the whole process group cannot prove its holder dead, so it refuses without a pid or a time",
  45:   "lock: a lock file that is missing its creation time cannot prove its holder dead, so it refuses without a pid or a time",
  46:   "lock: a lock file that is JSON null cannot prove its holder dead, so it refuses without a pid or a time",
  47:   "lock: a lock file that is a JSON array cannot prove its holder dead, so it refuses without a pid or a time",
  48:   "lock: a lock file that is carrying a creation time that is not a string cannot prove its holder dead, so it refuses without a pid or a time",
  49:   "lock: a lock file that is carrying a creation time that is not a date cannot prove its holder dead, so it refuses without a pid or a time",
  50:   "lock: a lock file that is carrying a creation time that is not a full UTC instant cannot prove its holder dead, so it refuses without a pid or a time",
  51:   "lock: a lock path that is a directory cannot be read, so it refuses and leaves it alone",
  52:   "lock race: a rival that renames the stale lock first wins, and this run refuses leaving only what the rival made",
  53:   "lock race: a rename that moved a rival live lock, not the dead one, puts it back and refuses",
  54:   "lock race: when a third run takes the lock before the rival lock can be put back, the third lock stands",
  55:   "lock race: winning the rename but losing the publish to another run refuses, and that run keeps the lock",
  56:   "lock race: a holder that releases between the refused publish and the read is a changed hand, not a crash",
  57:   "lock: an absent target is refused and is not created",
  58:   "lock: a temp name that already exists belongs to someone else, so it refuses and does not delete it",
  59:   "lock: a filesystem that cannot link refuses, with no fallback to a lock written in place",
  60:   "lock: a stale lock that cannot be renamed refuses and stays where it is",
  61:   "lock: a temp file that cannot be removed does not undo the lock, and its name is a protected one",
  62:   "lock: a release that cannot delete the file does not throw; the lock then names a dead pid and is taken over",
  63:   "lock: with no ports it uses this process, the real clock and the real liveness probe",
  64:   "render: a verified rollback exits 1 with the exact claim",
  65:   "render: top-level names that came or went are reported, left untouched, and exit 3",
  66:   "render: every rollback outcome names what was quarantined and where the full list is",
  67:   "render: an incomplete rollback exits 4, lists each entry with its reason, names the retired path, gives one instruction",
  68:   "render: a verified recovery exits 5 whatever the top-level names did, and asks for a re-run",
  69:   "render: a recovery whose rollback is incomplete exits 4, not 5",
  70:   "render: a refusal exits 6 and argument misuse exits 2, each with only its message",
  71:   "render: the child exit code or signal is printed and never becomes the exit code",
  72:   "render: a committed install exits 0, and still exits 0 with a warning when snapshot/ could not be deleted",
  73:   "render: the notice about a retired transaction is repeated in every outcome until the owner deletes it",
  74: ];
  75: 
  76: const INSTALLER_RECOVERY_HARNESS = [
  77:   'twin:child-failed-at-injection',
  78:   'twin:residue-non-empty',
  79:   'fresh:wrapper-child-failed-at-injection',
  80:   'upgrade:first-install-succeeded',
  81:   'upgrade:picked-files-installed',
  82:   'upgrade:wrapper-child-failed-at-injection',
  83:   'upgrade:child-rewrote-picked-files',
  84: ];
  85: 
  86: const INSTALLER_RECOVERY_SIGNATURE = [
  87:   'fresh:outcome-exact',
  88:   'fresh:top-level-exact-allowlist',
  89:   'fresh:transaction-directory-shape',
  90:   'upgrade:outcome-exact',
  91:   'upgrade:transaction-directory-shape',
  92: ];
  93: 
  94: // Safety checks are never permitted failures, independently of the interim RED.
  95: const RECOVERY_REQUIRED_PASS = [
  96:   ...INSTALLER_RECOVERY_HARNESS,
  97:   'fresh:status-is-1', 'fresh:owner-bytes-preserved', 'fresh:displaced-equals-twin-changes',
  98:   'upgrade:status-is-1', 'upgrade:owner-bytes-preserved',
  99: ];
 100: const RECOVERY_REQUIRED_FAIL = [
 101:   ...INSTALLER_RECOVERY_SIGNATURE,
 102:   'fresh:quarantine-path-printed', 'fresh:new-equals-twin-residue', 'fresh:moved-txt-lists-every-file',
 103:   'upgrade:tree-deep-equal-outside-allowlist', 'upgrade:quarantine-path-printed',
 104:   'upgrade:removed-file-quarantined-as-new', 'upgrade:edited-file-displaced', 'upgrade:moved-txt-lists-every-file',
 105: ];
 106: 
 107: function keyOf(check) {
 108:   return `${check.scenario}:${check.id}`;
 109: }
 110: 
 111: function linesOf(text) {
 112:   return String(text || '').split(/\r?\n/);
 113: }
 114: 
 115: function isObject(value) {
 116:   return value !== null && typeof value === 'object' && !Array.isArray(value);
 117: }
 118: 
 119: function hasKeys(value, keys) {
 120:   return isObject(value) && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort());
 121: }
 122: 
 123: function validRecoveryContext(context, platform) {
 124:   if (!hasKeys(context, ['twin', 'upgrade']) || !hasKeys(context.twin, ['residue']) ||
 125:       !hasKeys(context.upgrade, ['edited', 'removed']) || !isObject(context.twin.residue)) return false;
 126:   const relativeName = name => typeof name === 'string' && name.length > 0 &&
 127:     !/[\\:\x00-\x1f]/.test(name) && name.split('/').every(segment =>
 128:       segment !== '' && segment !== '.' && segment !== '..' &&
 129:       (platform !== 'win32' || !/[. ]$/.test(segment)));
 130:   const identity = name => platform === 'darwin' ? name.normalize('NFC').toLowerCase()
 131:     : platform === 'win32' ? name.toLowerCase() : name;
 132:   const entries = Object.entries(context.twin.residue);
 133:   if (!entries.length || !entries.some(([, type]) => type === 'file')) return false;
 134:   const seen = new Set();
 135:   for (const [name, type] of entries) {
 136:     if (!relativeName(name) || !['file', 'dir', 'link'].includes(type) || seen.has(identity(name))) return false;
 137:     seen.add(identity(name));
 138:   }
 139:   const { edited, removed } = context.upgrade;
 140:   return relativeName(edited) && relativeName(removed) && identity(edited) !== identity(removed);
 141: }
 142: 
 143: function recoveryObservation(check, context) {
 144:   if (RECOVERY_REQUIRED_PASS.includes(keyOf(check))) return { kind: 'assertion-pass', actual: {} };
 145:   // The complete context is validated before any observation is compared.
 146:   const residue = context.twin.residue;
 147:   switch (check.id) {
 148:     case 'outcome-exact':
 149:       return { kind: 'outcome-lines', actual: { lines: ['Rollback applied'] } };
 150:     case 'top-level-exact-allowlist':
 151:       return { kind: 'top-level-names', actual: { names: [
 152:         '.gsd-source', 'agents', 'gsd-core', 'gsd-migration-journal', 'hooks',
 153:         'owner.txt', 'package.json', 'scripts', 'settings.json', 'skills',
 154:       ] } };
 155:     case 'transaction-directory-shape':
 156:       return { kind: 'transaction-state', actual: { state: 'absent' } };
 157:     case 'quarantine-path-printed':
 158:       return { kind: 'quarantine-reference', actual: { path: null } };
 159:     case 'new-equals-twin-residue':
 160:       return { kind: 'tree-delta', actual: { missing: Object.keys(residue).sort(), unexpected: [], changed: [] } };
 161:     case 'tree-deep-equal-outside-allowlist':
 162:       return { kind: 'tree-delta', actual: { missing: [], unexpected: [], changed: ['gsd-install-state.json'] } };
 163:     case 'removed-file-quarantined-as-new':
 164:       return { kind: 'entry-type', actual: { path: context.upgrade.removed, type: null } };
 165:     case 'edited-file-displaced':
 166:       return { kind: 'displaced-paths', actual: { paths: [] } };
 167:     case 'moved-txt-lists-every-file':
 168:       return { kind: 'moved-list', actual: {
 169:         expected: check.scenario === 'fresh'
 170:           ? Object.keys(residue).filter(name => residue[name] === 'file').sort()
 171:           : [context.upgrade.removed],
 172:         listed: [],
 173:       } };
 174:     default:
 175:       return undefined;
 176:   }
 177: }
 178: 
 179: // The installer leaves the child's files in the target and prints an unverified
 180: // "Rollback applied" (blocker 1). Those two failures, in both scenarios, are the red.
 181: function judgeInstallerRecovery(run, evidence) {
 182:   if (!isObject(run) || typeof run.stdout !== 'string' || typeof run.stderr !== 'string') {
 183:     return ['malformed run: stdout and stderr must be strings'];
 184:   }
 185:   if (run.error !== undefined || (run.signal !== undefined && run.signal !== null)) {
 186:     return ['run has failure or malformed termination evidence'];
 187:   }
 188:   let report;
 189:   try {
 190:     report = JSON.parse(run.stdout);
 191:   } catch {
 192:     return [`no JSON report on stdout: ${String(run.stderr || run.stdout).slice(0, 300)}`];
 193:   }
 194:   if (!isObject(report)) return ['recovery report must be an object'];
 195:   if (run.status === 0 || report.accepted === true) {
 196:     return ['UNEXPECTED PASS: the gate is green. Remove its expect-red entry and run it as a plain gate (plan Step 5).'];
 197:   }
 198:   const problems = [];
 199:   if (run.status !== 1) problems.push(`exit status ${run.status}, expected 1`);
 200:   if (report.accepted !== false) problems.push('report must explicitly declare accepted: false');
 201:   if (report.fixtureRemoved !== true) problems.push('fixture cleanup was not confirmed');
 202:   if (report.harnessError) problems.push(`harness error: ${report.harnessError}`);
 203:   const host = evidence?.host;
 204:   if (!isObject(host) || !['win32', 'linux', 'darwin'].includes(host.platform) ||
 205:       typeof host.nodeVersion !== 'string' || !/^v\d+\.\d+\.\d+$/.test(host.nodeVersion) ||
 206:       report.platform !== host.platform || report.node !== host.nodeVersion) {
 207:     problems.push('missing or mismatched host/runtime evidence');
 208:   }
 209:   if (!hasKeys(evidence?.sourceHashes, RECOVERY_SOURCES) || !hasKeys(report.sourceHashes, RECOVERY_SOURCES)) {
 210:     problems.push('missing or unreviewed source identities');
 211:   } else {
 212:     for (const name of RECOVERY_SOURCES) {
 213:       const digest = evidence.sourceHashes[name];
 214:       if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest) || report.sourceHashes[name] !== digest) {
 215:         problems.push(`missing, malformed or mismatched source digest: ${name}`);
 216:       }
 217:     }
 218:   }
 219:   if (!Array.isArray(report.checks)) return [...problems, 'checks must be an array'];
 220:   if (!validRecoveryContext(report.context, report.platform)) return [...problems, 'invalid independent recovery context'];
 221:   const checks = new Map();
 222:   const expectedKeys = new Set([...RECOVERY_REQUIRED_PASS, ...RECOVERY_REQUIRED_FAIL]);
 223:   for (const check of report.checks) {
 224:     if (!isObject(check) || typeof check.scenario !== 'string' || typeof check.id !== 'string') {
 225:       problems.push('malformed check identity');
 226:       continue;
 227:     }
 228:     const key = keyOf(check);
 229:     if (typeof check.ok !== 'boolean') problems.push(`check status must be boolean: ${key}`);
 230:     if (check.ok === false && (typeof check.detail !== 'string' || !check.detail.trim())) {
 231:       problems.push(`failed check has no diagnostic: ${key}`);
 232:     }
 233:     if (check.ok === true && Object.hasOwn(check, 'detail')) problems.push(`passing check has a failure detail: ${key}`);
 234:     if (checks.has(key)) problems.push(`duplicate check: ${key}`);
 235:     if (!expectedKeys.has(key)) problems.push(`unreviewed check: ${key}`);
 236:     const expectedKind = INSTALLER_RECOVERY_HARNESS.includes(key) ? 'harness' : 'acceptance';
 237:     if (check.kind !== expectedKind) problems.push(`wrong check kind: ${key}`);
 238:     if (!isDeepStrictEqual(check.evidence, recoveryObservation(check, report.context))) {
 239:       problems.push(`unexpected or incomplete observation: ${key}`);
 240:     }
 241:     checks.set(key, check);
 242:   }
 243:   const failedKeys = [...checks.values()].filter(check => check.ok === false).map(keyOf).sort();
 244:   const declaredFailures = typeof report.failure === 'string' ? report.failure.split(',').map(key => key.trim()).sort() : [];
 245:   if (!isDeepStrictEqual(declaredFailures, failedKeys)) problems.push('failure inventory does not match failed checks');
 246:   for (const key of INSTALLER_RECOVERY_HARNESS) {
 247:     if (!checks.get(key)?.ok) problems.push(`harness check did not pass: ${key}`);
 248:   }
 249:   for (const check of checks.values()) {
 250:     if (check.kind === 'harness' && !check.ok) problems.push(`harness check failed: ${keyOf(check)}: ${check.detail}`);
 251:   }
 252:   for (const key of RECOVERY_REQUIRED_FAIL) {
 253:     if (checks.get(key)?.ok !== false) problems.push(`known failure absent: ${key}`);
 254:   }
 255:   for (const key of RECOVERY_REQUIRED_PASS) {
 256:     // Enforce safety independently: even adding this row to REQUIRED_FAIL cannot
 257:     // make a failed safety check acceptable. Conflicting lists cannot both pass.
 258:     if (checks.get(key)?.ok !== true) problems.push(`required preservation check did not pass: ${key}`);
 259:   }
 260:   return [...new Set(problems)];
 261: }
 262: 
 263: function tapFramingProblems(lines) {
 264:   const bad = message => [`invalid TAP framing: ${message}`];
 265:   if (lines[0] !== 'TAP version 13') return bad('missing initial version');
 266:   let cursor = 1;
 267:   for (const [offset, name] of COVERAGE_CASES.entries()) {
 268:     if (lines[cursor]?.startsWith('# Subtest: ')) {
 269:       if (lines[cursor++] !== `# Subtest: ${name}`) return bad('unreviewed subtest');
 270:     }
 271:     const result = `${offset < 41 ? 'ok' : 'not ok'} ${offset + 1} - ${name}`;
 272:     if (lines[cursor++] !== result) return bad('unexpected case or result');
 273:     if (lines[cursor++] !== '  ---') return bad('missing diagnostic start');
 274:     const fields = new Map();
 275:     while (cursor < lines.length && lines[cursor] !== '  ...') {
 276:       const line = lines[cursor++];
 277:       if (!line.startsWith('  ')) return bad('unterminated diagnostic block');
 278:       const field = /^  ([A-Za-z_]+):\s*(.*)$/.exec(line);
 279:       if (field) {
 280:         if (fields.has(field[1])) return bad(`duplicate diagnostic field: ${field[1]}`);
 281:         fields.set(field[1], field[2]);
 282:       }
 283:     }
 284:     if (lines[cursor++] !== '  ...') return bad('unterminated diagnostic block');
 285:     if (offset >= 41 && (fields.get('failureType') !== "'testCodeFailure'" ||
 286:         fields.get('code') !== "'ERR_TEST_FAILURE'")) return bad('wrong failure type or code');
 287:     if (offset >= 41 && fields.get('error') !== "'not implemented: renderOutcome'") {
 288:       return [`failed for another reason: ${name}`];
 289:     }
 290:     if (offset < 41 && ['error', 'failureType', 'code'].some(key => fields.has(key))) {
 291:       return bad('passing case contains a failure');
 292:     }
 293:   }
 294:   const terminal = ['1..51', '# tests 51', '# suites 0', '# pass 41', '# fail 10',
 295:     '# cancelled 0', '# skipped 0', '# todo 0'];
 296:   for (const line of terminal) if (lines[cursor++] !== line) return bad(`missing terminal ${line}`);
 297:   if (lines[cursor]?.startsWith('# duration_ms ')) {
 298:     if (!/^# duration_ms \d+(\.\d+)?$/.test(lines[cursor++])) return bad('invalid duration');
 299:   }
 300:   // c8's presentation table is ancillary; all numeric coverage comes from JSON.
 301:   for (const line of lines.slice(cursor)) {
 302:     if (/^\s*(TAP version|(?:not )?ok \d+|1\.\.|# |Bail out!)/.test(line)) return bad('TAP token after terminal summary');
 303:     if (line && !line.includes('|') && !line.startsWith('ERROR: Coverage')) return bad('unexpected trailing output');
 304:   }
 305:   return [];
 306: }
 307: 
 308: function coverageEvidenceProblems(evidence) {
 309:   const platform = evidence?.host?.platform;
 310:   if (!['win32', 'linux', 'darwin'].includes(platform) || typeof evidence?.projectRoot !== 'string' ||
 311:       !isObject(evidence.coverageSummary)) return ['missing or malformed coverage evidence'];
 312:   const paths = platform === 'win32' ? path.win32 : path.posix;
 313:   if (!paths.isAbsolute(evidence.projectRoot)) return ['coverage project root must be absolute'];
 314:   const identity = name => {
 315:     const normalized = paths.normalize(name);
 316:     return platform === 'win32' ? normalized.toLowerCase()
 317:       : platform === 'darwin' ? normalized.normalize('NFC').toLowerCase() : normalized;
 318:   };
 319:   const expected = ['bin/lib/install-names.js', 'bin/lib/install-transaction.js']
 320:     .map(name => identity(paths.join(evidence.projectRoot, name)));
 321:   const tables = new Map();
 322:   for (const [name, table] of Object.entries(evidence.coverageSummary)) {
 323:     const spelling = platform === 'win32' ? name.replaceAll('/', '\\') : name;
 324:     if (spelling !== paths.normalize(spelling)) return [`noncanonical coverage file alias: ${name}`];
 325:     const key = name === 'total' ? name : identity(name);
 326:     if (name !== 'total' && (!paths.isAbsolute(name) || !expected.includes(key))) {
 327:       return [`unreviewed coverage file: ${name}`];
 328:     }
 329:     if (tables.has(key)) return [`duplicate coverage file identity: ${name}`];
 330:     tables.set(key, table);
 331:   }
 332:   if (tables.size !== 3 || !tables.has('total') || expected.some(name => !tables.has(name))) {
 333:     return ['coverage must include total and both reviewed files'];
 334:   }
 335:   const metrics = ['lines', 'statements', 'functions', 'branches'];
 336:   const problems = [];
 337:   for (const [name, table] of tables) {
 338:     if (!isObject(table) || Object.keys(table).some(key => ![...metrics, 'branchesTrue'].includes(key))) {
 339:       problems.push(`malformed coverage table: ${name}`);
 340:       continue;
 341:     }
 342:     for (const metric of metrics) {
 343:       const value = table[metric];
 344:       if (!hasKeys(value, ['total', 'covered', 'skipped', 'pct']) ||
 345:           !Number.isSafeInteger(value.total) || value.total <= 0 || value.covered !== value.total ||
 346:           value.skipped !== 0 || value.pct !== 100) {
 347:         problems.push(`coverage must be complete and 100%: ${name} ${metric}`);
 348:       }
 349:     }
 350:   }
 351:   if (!problems.length) {
 352:     for (const metric of metrics) {
 353:       for (const count of ['total', 'covered', 'skipped']) {
 354:         const sum = expected.reduce((total, name) => total + tables.get(name)[metric][count], 0);
 355:         if (tables.get('total')[metric][count] !== sum) problems.push(`coverage aggregate mismatch: ${metric} ${count}`);
 356:       }
 357:     }
 358:   }
 359:   return problems;
 360: }
 361: 
 362: // Only the ten reviewed render cases remain unimplemented. Every landed case and
 363: // the complete TAP envelope must still pass; coverage evidence is a separate proof.
 364: function judgeInstallTransactionCoverage(run, evidence) {
 365:   if (!isObject(run) || typeof run.stdout !== 'string' || typeof run.stderr !== 'string') {
 366:     return ['malformed run: stdout and stderr must be strings'];
 367:   }
 368:   if (run.error !== undefined || (run.signal !== undefined && run.signal !== null)) {
 369:     return ['run has failure or malformed termination evidence'];
 370:   }
 371:   const lines = linesOf(run.stdout);
 372:   const framingProblems = tapFramingProblems(lines);
 373:   const count = label => Number(lines.find(line => line.startsWith(`# ${label} `))?.slice(label.length + 3));
 374:   const failed = count('fail');
 375:   if (!Number.isInteger(failed) || !Number.isInteger(count('pass'))) {
 376:     return [`no TAP summary on stdout: ${String(run.stderr || run.stdout).slice(0, 300)}`];
 377:   }
 378:   if (run.status === 0 || failed === 0) {
 379:     return ['UNEXPECTED PASS: no case fails. Remove this expect-red entry and run the gate as a plain gate (plan Step 5).'];
 380:   }
 381:   const problems = [];
 382:   problems.push(...coverageEvidenceProblems(evidence));
 383:   problems.push(...framingProblems);
 384:   if (run.status !== 1) problems.push(`exit status ${run.status}, expected 1`);
 385:   const starts = lines.flatMap((line, index) => (/^(not )?ok \d+ - /.test(line) ? [index] : []));
 386:   if (starts.length !== COVERAGE_CASES.length) problems.push('case inventory must contain exactly the reviewed 51 cases');
 387:   for (const [offset, start] of starts.entries()) {
 388:     const expected = `${offset < 41 ? 'ok' : 'not ok'} ${offset + 1} - ${COVERAGE_CASES[offset]}`;
 389:     if (lines[start] !== expected) problems.push(`unreviewed case identity or result: ${lines[start]}`);
 390:   }
 391:   const failures = starts.filter(index => lines[index].startsWith('not ok '));
 392:   if (failures.length !== failed) problems.push(`summary reports ${failed} failures, ${failures.length} found`);
 393:   for (const line of [...linesOf(run.stderr), ...lines]) {
 394:     if (line.includes('ERROR: Coverage')) problems.push(line.trim());
 395:   }
 396:   return problems;
 397: }
 398: 
 399: const KNOWN_REDS = {
 400:   'installer-recovery': { script: 'test:acceptance:installer-recovery', judge: judgeInstallerRecovery },
 401:   'install-transaction-coverage': { script: 'test:coverage:install-transaction', judge: judgeInstallTransactionCoverage },
 402: };
 403: 
 404: // The command comes from package.json so this wrapper and the package script cannot drift.
 405: // Package scripts quote glob-like arguments for the shell; no shell runs here.
 406: function commandFor(gate, packageJson) {
 407:   const command = packageJson.scripts?.[gate.script];
 408:   if (typeof command !== 'string' || !command.startsWith('node ')) {
 409:     throw new Error(`package script ${gate.script} must be a plain "node <file>" command, saw ${JSON.stringify(command)}`);
 410:   }
 411:   const args = command.split(' ').slice(1).map(argument => argument.replace(/^'(.*)'$/, '$1'));
 412:   const expected = gate.script === 'test:acceptance:installer-recovery' ? ['tests/acceptance/installer-recovery.cjs'] : [
 413:     'node_modules/c8/bin/c8.js', '--all', '--per-file', '--include=bin/lib/install-names.js',
 414:     '--include=bin/lib/install-transaction.js', '--check-coverage', '--statements', '100', '--branches', '100',
 415:     '--functions', '100', '--lines', '100', '--reporter=text', '--reporter=json-summary',
 416:     'node', '--test', '--test-reporter=tap', 'tests/coverage/install-transaction.test.cjs',
 417:   ];
 418:   if (!['test:acceptance:installer-recovery', 'test:coverage:install-transaction'].includes(gate.script) ||
 419:       !isDeepStrictEqual(args, expected)) throw new Error(`unreviewed package gate command: ${gate.script}`);
 420:   return args;
 421: }
 422: 
 423: function main(args = process.argv.slice(2), dependencies = {}) {
 424:   const spawn = dependencies.spawnSync || spawnSync;
 425:   let packageJson;
 426:   const log = dependencies.log || (message => process.stderr.write(`${message}\n`));
 427:   const fileSystem = dependencies.fs || fs;
 428:   const runtime = dependencies.runtime || {
 429:     execPath: process.execPath, platform: process.platform, nodeVersion: process.version, isBun: Boolean(process.versions.bun),
 430:   };
 431:   const gate = Object.hasOwn(KNOWN_REDS, args[0]) ? KNOWN_REDS[args[0]] : undefined;
 432:   if (args.length !== 1 || !gate) {
 433:     log(`Usage: node scripts/expect-red.cjs <${Object.keys(KNOWN_REDS).join('|')}>`);
 434:     return 2;
 435:   }
 436:   if (runtime.isBun) {
 437:     log('expect-red: run this gate under Node; Bun evidence is not accepted');
 438:     return 1;
 439:   }
 440:   if (/(?:^|\s|["'])--(?:experimental-)?test(?:[-=\s]|$)/.test(process.env.NODE_OPTIONS || '')) {
 441:     log('expect-red: inherited NODE_OPTIONS contains test-runner flags');
 442:     return 1;
 443:   }
 444:   let evidence;
 445:   let capturedHashes;
 446:   const digestFile = name => createHash('sha256')
 447:     .update(fileSystem.readFileSync(path.join(PROJECT_ROOT, name))).digest('hex');
 448:   const recovery = args[0] === 'installer-recovery';
 449:   try {
 450:     const sourceBytes = Object.fromEntries([...(recovery ? RECOVERY_SOURCES : COVERAGE_SOURCES), 'package.json', 'scripts/expect-red.cjs']
 451:       .map(name => [name, fileSystem.readFileSync(path.join(PROJECT_ROOT, name))]));
 452:     if (!recovery) {
 453:       for (const name of COVERAGE_SOURCES.slice(0, 2)) {
 454:         if (/(?:c8|v8|istanbul)\s+ignore\b/i.test(sourceBytes[name].toString('utf8'))) {
 455:           throw new Error(`coverage ignore directive in ${name}`);
 456:         }
 457:       }
 458:     }
 459:     capturedHashes = Object.fromEntries(Object.entries(sourceBytes)
 460:       .map(([name, bytes]) => [name, createHash('sha256').update(bytes).digest('hex')]));
 461:     packageJson = JSON.parse(sourceBytes['package.json'].toString('utf8'));
 462:     if (dependencies.packageJson && !isDeepStrictEqual(dependencies.packageJson, packageJson)) {
 463:       throw new Error('injected package.json does not match captured bytes');
 464:     }
 465:     const tools = { node: runtime.nodeVersion };
 466:     if (!recovery) {
 467:       tools.c8 = JSON.parse(fileSystem.readFileSync(path.join(PROJECT_ROOT, 'node_modules/c8/package.json'), 'utf8')).version;
 468:       if (typeof tools.c8 !== 'string' || !tools.c8) throw new Error('missing c8 version evidence');
 469:     }
 470:     log(`expect-red evidence: ${JSON.stringify({ node: runtime.nodeVersion, platform: runtime.platform, tools, sourceHashes: capturedHashes })}`);
 471:     if (recovery) {
 472:       evidence = {
 473:         host: { platform: runtime.platform, nodeVersion: runtime.nodeVersion },
 474:         sourceHashes: Object.fromEntries(RECOVERY_SOURCES.map(name => [name, capturedHashes[name]])),
 475:       };
 476:     }
 477:   } catch (error) {
 478:     log(`expect-red: could not read source evidence: ${error.message}`);
 479:     return 1;
 480:   }
 481:   let scratch;
 482:   let reports;
 483:   let run;
 484:   const problems = [];
 485:   try {
 486:     const command = commandFor(gate, packageJson);
 487:     const env = { ...process.env };
 488:     delete env.NODE_TEST_CONTEXT;
 489:     delete env.NODE_V8_COVERAGE;
 490:     if (!recovery) {
 491:       scratch = fileSystem.mkdtempSync(path.join(PROJECT_ROOT, '.claude', 'expect-red-'));
 492:       reports = path.join(scratch, 'reports');
 493:       const v8 = path.join(scratch, 'v8');
 494:       fileSystem.mkdirSync(reports);
 495:       fileSystem.mkdirSync(v8);
 496:       const config = path.join(scratch, 'c8.json');
 497:       fileSystem.writeFileSync(config, '{}', { flag: 'wx' });
 498:       env.NODE_V8_COVERAGE = v8;
 499:       const childIndex = command.indexOf('node');
 500:       command[childIndex] = runtime.execPath;
 501:       command.splice(childIndex, 0, `--reports-dir=${reports}`, `--temp-directory=${v8}`, `--config=${config}`);
 502:     }
 503:     run = spawn(runtime.execPath, command, {
 504:       cwd: PROJECT_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
 505:       timeout: 300000, env,
 506:     });
 507:     // Print both streams even when the child fails. Neither stream is acceptance.
 508:     log(run.stdout);
 509:     log(run.stderr);
 510:     if (run.error || run.signal) {
 511:       problems.push(`gate execution failed: ${run.error?.message || run.signal}`);
 512:     } else {
 513:       if (!recovery) {
 514:         const summaryPath = path.join(reports, 'coverage-summary.json');
 515:         const stat = fileSystem.lstatSync(summaryPath);
 516:         if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('coverage summary must be a plain file');
 517:         evidence = { projectRoot: PROJECT_ROOT, host: { platform: runtime.platform },
 518:           coverageSummary: JSON.parse(fileSystem.readFileSync(summaryPath, 'utf8')) };
 519:       }
 520:       problems.push(...gate.judge(run, evidence));
 521:     }
 522:   } catch (error) {
 523:     problems.push(`could not capture gate evidence: ${error.message}`);
 524:   } finally {
 525:     if (scratch) {
 526:       if (!run || run.error || run.signal) {
 527:         problems.push(`retained private scratch; child quiescence not established: ${scratch}`);
 528:       } else {
 529:         try {
 530:           if (path.dirname(scratch) !== path.join(PROJECT_ROOT, '.claude') ||
 531:               !path.basename(scratch).startsWith('expect-red-')) throw new Error('scratch ownership mismatch');
 532:           const stat = fileSystem.lstatSync(scratch);
 533:           if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('scratch is not the owned directory');
 534:           fileSystem.rmSync(scratch, { recursive: true, maxRetries: 2, retryDelay: 50 });
 535:         } catch (error) {
 536:           problems.push(`private scratch cleanup failed: ${scratch}: ${error.message}`);
 537:         }
 538:       }
 539:     }
 540:   }
 541:   if (capturedHashes) {
 542:     for (const [name, digest] of Object.entries(capturedHashes)) {
 543:       try {
 544:         if (digestFile(name) !== digest) problems.push(`source changed during capture: ${name}`);
 545:       } catch (error) {
 546:         problems.push(`could not recheck source ${name}: ${error.message}`);
 547:       }
 548:     }
 549:   }
 550:   if (problems.length) {
 551:     log(`expect-red ${args[0]}: NOT the known red`);
 552:     for (const problem of problems) log(`  - ${problem}`);
 553:     return 1;
 554:   }
 555:   log(`expect-red ${args[0]}: failed for the known reason, as expected until the fix lands`);
 556:   return 0;
 557: }
 558: 
 559: if (require.main === module) {
 560:   process.exitCode = main();
 561: }
 562: 
 563: module.exports = {
 564:   INSTALLER_RECOVERY_HARNESS,
 565:   INSTALLER_RECOVERY_SIGNATURE,
 566:   KNOWN_REDS,
 567:   commandFor,
 568:   judgeInstallTransactionCoverage,
 569:   judgeInstallerRecovery,
 570:   main,
 571: };
END SOURCE scripts/expect-red.cjs

BEGIN SOURCE tests/expect-red.test.js SHA256 ef6a215990c5a610af6139a6e6e3d077ad72d076895aeb51aaf39309187d1897
   1: const { describe, expect, test } = require('./helpers/portable-test-api.js');
   2: const fs = require('fs');
   3: const path = require('path');
   4: const { spawnSync } = require('node:child_process');
   5: 
   6: const {
   7:   INSTALLER_RECOVERY_HARNESS,
   8:   INSTALLER_RECOVERY_SIGNATURE,
   9:   commandFor,
  10:   judgeInstallTransactionCoverage: judgeCoverage,
  11:   judgeInstallerRecovery: judgeRecovery,
  12:   main,
  13: } = require('../scripts/expect-red.cjs');
  14: 
  15: // A real report captured from tests/acceptance/installer-recovery.cjs on the unfixed
  16: // installer (win32, 2026-09-19), not a hand-written one: a hand-written fixture would
  17: // encode the judge's own assumptions about the report shape.
  18: const KNOWN_RED = fs.readFileSync(
  19:   path.join(__dirname, 'fixtures', 'expect-red', 'installer-recovery-structured-red.json'),
  20:   'utf8'
  21: );
  22: const capturedRecovery = JSON.parse(KNOWN_RED);
  23: const RECOVERY_EVIDENCE = {
  24:   sourceHashes: capturedRecovery.sourceHashes,
  25:   host: { platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node },
  26: };
  27: 
  28: function judgeInstallerRecovery(run, evidence = RECOVERY_EVIDENCE) {
  29:   return judgeRecovery(run, evidence);
  30: }
  31: 
  32: function runOf(report, status = 1) {
  33:   return { status, stdout: typeof report === 'string' ? report : JSON.stringify(report), stderr: '' };
  34: }
  35: 
  36: function mutated(change) {
  37:   const report = JSON.parse(KNOWN_RED);
  38:   change(report);
  39:   return report;
  40: }
  41: 
  42: function setCheck(report, key, ok) {
  43:   const check = report.checks.find(candidate => `${candidate.scenario}:${candidate.id}` === key);
  44:   check.ok = ok;
  45:   check.detail = ok ? undefined : 'forced by the test';
  46: }
  47: 
  48: let liveRecovery;
  49: function longTest(name, fn) {
  50:   if (process.versions.bun) test(name, fn, 240000);
  51:   else test(name, { timeout: 240000 }, fn);
  52: }
  53: 
  54: function captureRecovery() {
  55:   if (!liveRecovery) {
  56:     const run = spawnSync('node', ['tests/acceptance/installer-recovery.cjs'], {
  57:       cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 180000,
  58:     });
  59:     expect(run.error).toBeUndefined();
  60:     expect(run.status).toBe(1);
  61:     liveRecovery = JSON.parse(run.stdout);
  62:     expect(liveRecovery.fixtureRemoved).toBe(true);
  63:   }
  64:   return liveRecovery;
  65: }
  66: 
  67: describe('expect-red: recovery observation contract', () => {
  68:   longTest('the disposable upgrade independently checks owner preservation', () => {
  69:     const report = captureRecovery();
  70:     const owner = report.checks.find(check => keyOfCheck(check) === 'upgrade:owner-bytes-preserved');
  71:     expect(owner?.ok).toBe(true);
  72:     expect(report.checks).toHaveLength(25);
  73:   });
  74: 
  75:   longTest('known failures retain complete typed observations independently of diagnostic truncation', () => {
  76:     const report = captureRecovery();
  77:     const kinds = new Map([
  78:       ['outcome-exact', 'outcome-lines'], ['top-level-exact-allowlist', 'top-level-names'],
  79:       ['transaction-directory-shape', 'transaction-state'], ['quarantine-path-printed', 'quarantine-reference'],
  80:       ['new-equals-twin-residue', 'tree-delta'], ['tree-deep-equal-outside-allowlist', 'tree-delta'],
  81:       ['removed-file-quarantined-as-new', 'entry-type'], ['edited-file-displaced', 'displaced-paths'],
  82:       ['moved-txt-lists-every-file', 'moved-list'],
  83:     ]);
  84:     for (const check of report.checks.filter(check => !check.ok)) {
  85:       expect(check.evidence?.kind).toBe(kinds.get(check.id));
  86:     }
  87:     const delta = report.checks.find(check => check.id === 'new-equals-twin-residue').evidence.actual;
  88:     expect(delta.missing).toEqual(Object.keys(report.context.twin.residue).sort());
  89:     expect(delta.missing.length).toBeGreaterThan(6);
  90:     expect(delta.unexpected).toEqual([]);
  91:     expect(delta.changed).toEqual([]);
  92:     expect(report.context.upgrade).toEqual({ edited: report.upgrade.edited, removed: report.upgrade.removed });
  93:     expect(report.sourceHashes['tests/acceptance/installer-recovery.cjs']).toMatch(/^[a-f0-9]{64}$/);
  94:   });
  95: });
  96: 
  97: function keyOfCheck(check) {
  98:   return `${check.scenario}:${check.id}`;
  99: }
 100: 
 101: describe('expect-red: installer recovery', () => {
 102:   test('supplied malformed termination markers are never treated as absent', () => {
 103:     for (const error of [false, 0, '', null]) {
 104:       expect(judgeInstallerRecovery({ ...runOf(KNOWN_RED), error }).length).toBeGreaterThan(0);
 105:     }
 106:     for (const signal of [false, 0, '']) {
 107:       expect(judgeInstallerRecovery({ ...runOf(KNOWN_RED), signal }).length).toBeGreaterThan(0);
 108:     }
 109:   });
 110: 
 111:   test('host-specific identity rules and contradictory pass details are checked', () => {
 112:     for (const platform of ['linux', 'darwin']) {
 113:       const report = mutated(value => { value.platform = platform; });
 114:       const evidence = structuredClone(RECOVERY_EVIDENCE);
 115:       evidence.host.platform = platform;
 116:       expect(judgeInstallerRecovery(runOf(report), evidence)).toEqual([]);
 117:     }
 118:     expect(judgeInstallerRecovery(runOf(mutated(report => { report.checks[0].detail = 'unexpected failure detail'; }))).length).toBeGreaterThan(0);
 119:     expect(judgeInstallerRecovery(runOf('{malformed'))[0]).toContain('{malformed');
 120:   });
 121: 
 122:   test('recovery evidence must match the explicitly supplied source bytes and host', () => {
 123:     for (const evidence of [undefined, null, {}, { ...RECOVERY_EVIDENCE, host: null },
 124:       { ...RECOVERY_EVIDENCE, sourceHashes: {} },
 125:       { ...RECOVERY_EVIDENCE, host: { platform: 'linux', nodeVersion: capturedRecovery.node } },
 126:       { ...RECOVERY_EVIDENCE, host: { platform: 'win32', nodeVersion: 'v22.0.0' } }]) {
 127:       expect(judgeRecovery(runOf(KNOWN_RED), evidence).length).toBeGreaterThan(0);
 128:     }
 129:     for (const name of Object.keys(RECOVERY_EVIDENCE.sourceHashes)) {
 130:       for (const change of [
 131:         report => { delete report.sourceHashes[name]; },
 132:         report => { report.sourceHashes[name] = 'a'.repeat(64); },
 133:         report => { report.sourceHashes[name] = 'not-a-digest'; },
 134:       ]) expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
 135:     }
 136:     expect(judgeInstallerRecovery(runOf(mutated(report => { report.sourceHashes.extra = 'a'.repeat(64); }))).length).toBeGreaterThan(0);
 137:     expect(judgeInstallerRecovery(runOf(mutated(report => { report.platform = 'unknown'; }))).length).toBeGreaterThan(0);
 138:     expect(judgeInstallerRecovery(runOf(mutated(report => { report.node = 'v22.0.0'; }))).length).toBeGreaterThan(0);
 139:   });
 140: 
 141:   test('independent context must contain unambiguous relative paths and real residue', () => {
 142:     for (const change of [
 143:       report => { delete report.context; },
 144:       report => { report.context.twin.residue = {}; },
 145:       report => { report.context.upgrade.edited = report.context.upgrade.removed; },
 146:       report => { report.context.upgrade.edited = '../owner.txt'; },
 147:       report => { report.context.upgrade.edited = '/owner.txt'; },
 148:       report => { report.context.upgrade.edited = 'C:/owner.txt'; },
 149:       report => { report.context.upgrade.edited = 'a//b'; },
 150:       report => { report.context.upgrade.edited = 'a/./b'; },
 151:       report => { report.context.twin.residue.extra = 'unknown-type'; },
 152:       report => { report.context.twin.residue['skills/alias'] = 'file'; report.context.twin.residue['skills/ALIAS'] = 'file'; },
 153:     ]) {
 154:       expect(judgeInstallerRecovery(runOf(mutated(change))).some(problem => problem.includes('context'))).toBe(true);
 155:     }
 156:   });
 157: 
 158:   test('malformed, interrupted and cleanup-failed reports return diagnostics instead of acceptance or exceptions', () => {
 159:     for (const report of [null, [], true, 1, 'text', {}, { checks: null }, { checks: {} }, { checks: [null] }]) {
 160:       expect(judgeInstallerRecovery(runOf(JSON.stringify(report))).length).toBeGreaterThan(0);
 161:     }
 162:     for (const change of [
 163:       report => { delete report.accepted; }, report => { report.accepted = 'false'; },
 164:       report => { delete report.fixtureRemoved; }, report => { report.fixtureRemoved = false; },
 165:       report => { report.checks[0] = null; }, report => { report.checks = {}; },
 166:       report => { report.checks[0].ok = 1; }, report => { report.checks[4].detail = ''; },
 167:       report => { report.failure += ', fresh:outcome-exact'; },
 168:       report => { report.failure = 'fresh:outcome-exact'; },
 169:       report => { delete report.failure; },
 170:     ]) expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
 171:     for (const run of [undefined, null, {}, { ...runOf(KNOWN_RED), signal: 'SIGTERM' },
 172:       { ...runOf(KNOWN_RED), error: new Error('timeout') }, { ...runOf(KNOWN_RED), stderr: null }]) {
 173:       expect(judgeInstallerRecovery(run).length).toBeGreaterThan(0);
 174:     }
 175:   });
 176: 
 177:   test('known failure labels cannot conceal missing, contradictory or additional observations', () => {
 178:     const baseline = JSON.parse(KNOWN_RED);
 179:     for (const original of baseline.checks) {
 180:       const key = keyOfCheck(original);
 181:       const changes = [
 182:         check => { delete check.evidence; },
 183:         check => { check.evidence.kind = 'observation-error'; },
 184:         check => { check.evidence.actual.unreviewed = 'additional damage'; },
 185:       ];
 186:       for (const field of Object.keys(original.evidence.actual)) {
 187:         changes.push(check => { delete check.evidence.actual[field]; });
 188:         changes.push(check => {
 189:           const value = check.evidence.actual[field];
 190:           check.evidence.actual[field] = Array.isArray(value) ? [...value, 'unreviewed-damage'] : 'contradiction';
 191:         });
 192:       }
 193:       for (const change of changes) {
 194:         const report = mutated(value => change(value.checks.find(check => keyOfCheck(check) === key)));
 195:         expect(judgeInstallerRecovery(runOf(report)).some(problem => problem.includes(key))).toBe(true);
 196:       }
 197:     }
 198:     const diagnosticsOnly = mutated(report => {
 199:       for (const check of report.checks.filter(check => !check.ok)) check.detail = 'Different human formatting';
 200:     });
 201:     expect(judgeInstallerRecovery(runOf(diagnosticsOnly))).toEqual([]);
 202:   });
 203: 
 204:   test('only the complete reviewed inventory is accepted, without duplicates or extra failures', () => {
 205:     const baseline = JSON.parse(KNOWN_RED);
 206:     for (const original of baseline.checks) {
 207:       const key = keyOfCheck(original);
 208:       for (const change of [
 209:         report => { report.checks = report.checks.filter(check => keyOfCheck(check) !== key); },
 210:         report => { report.checks.push({ ...original }); },
 211:         report => { setCheck(report, key, !original.ok); },
 212:         report => { report.checks.find(check => keyOfCheck(check) === key).kind = 'unreviewed'; },
 213:       ]) {
 214:         expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
 215:       }
 216:     }
 217:     expect(judgeInstallerRecovery(runOf(mutated(report => {
 218:       report.checks.push({ scenario: 'fresh', id: 'unknown', kind: 'acceptance', ok: false, detail: 'new damage' });
 219:     }))).length).toBeGreaterThan(0);
 220:   });
 221: 
 222:   test('the captured red from the unfixed installer is the known red', () => {
 223:     expect(judgeInstallerRecovery(runOf(KNOWN_RED))).toEqual([]);
 224:   });
 225: 
 226:   test('an additional owner-byte loss cannot hide behind the expected recovery failures', () => {
 227:     const report = mutated(value => setCheck(value, 'fresh:owner-bytes-preserved', false));
 228:     const problems = judgeInstallerRecovery(runOf(report));
 229:     expect(problems.some(problem => problem.includes('fresh:owner-bytes-preserved'))).toBe(true);
 230:   });
 231: 
 232:   test('an unexpected pass fails and says how to retire the wrapper', () => {
 233:     const green = mutated(report => {
 234:       report.accepted = true;
 235:       for (const check of report.checks) check.ok = true;
 236:     });
 237:     const problems = judgeInstallerRecovery(runOf(green, 0));
 238:     expect(problems).toHaveLength(1);
 239:     expect(problems[0]).toContain('UNEXPECTED PASS');
 240:   });
 241: 
 242:   for (const key of INSTALLER_RECOVERY_HARNESS) test(`a red with harness check ${key} failing is the wrong red`, () => {
 243:     const problems = judgeInstallerRecovery(runOf(mutated(report => setCheck(report, key, false))));
 244:     expect(problems.some(problem => problem.includes(key))).toBe(true);
 245:   });
 246: 
 247:   for (const key of INSTALLER_RECOVERY_HARNESS) test(`a red that never ran harness check ${key} is the wrong red`, () => {
 248:     const partial = mutated(report => {
 249:       report.checks = report.checks.filter(check => `${check.scenario}:${check.id}` !== key);
 250:     });
 251:     expect(judgeInstallerRecovery(runOf(partial))).toContain(`harness check did not pass: ${key}`);
 252:   });
 253: 
 254:   for (const key of INSTALLER_RECOVERY_SIGNATURE) test(`a red in which ${key} passes is not the known red`, () => {
 255:     const problems = judgeInstallerRecovery(runOf(mutated(report => setCheck(report, key, true))));
 256:     expect(problems).toContain(`known failure absent: ${key}`);
 257:   });
 258: 
 259:   test('a missing compose is the wrong red', () => {
 260:     const report = { accepted: false, checks: [], harnessError: 'compose the candidate before running acceptance' };
 261:     const problems = judgeInstallerRecovery(runOf(report));
 262:     expect(problems).toContain('harness error: compose the candidate before running acceptance');
 263:   });
 264: 
 265:   test('a crash with no report and an unexpected exit status are both refused', () => {
 266:     expect(judgeInstallerRecovery({ status: 1, stdout: '', stderr: 'SyntaxError: boom' })[0]).toContain('SyntaxError: boom');
 267:     expect(judgeInstallerRecovery(runOf(KNOWN_RED, 3))).toContain('exit status 3, expected 1');
 268:   });
 269: });
 270: 
 271: describe('expect-red: install transaction coverage', () => {
 272:   const COVERAGE_EVIDENCE = {
 273:     projectRoot: 'C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign', host: { platform: 'win32' },
 274:     coverageSummary: JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8')),
 275:   };
 276:   const judgeInstallTransactionCoverage = (run, evidence = COVERAGE_EVIDENCE) => judgeCoverage(run, evidence);
 277:   // Real reviewed TAP from the landed lock module with only render pending.
 278:   const KNOWN_TAP = fs.readFileSync(
 279:     path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'),
 280:     'utf8'
 281:   );
 282:   const tapRun = (stdout, status = 1, stderr = '') => ({ status, stdout, stderr });
 283:   const FIRST_REASON = "error: 'not implemented: renderOutcome'";
 284: 
 285:   test('supplied malformed termination markers are never treated as absent', () => {
 286:     for (const error of [false, 0, '', null]) {
 287:       expect(judgeInstallTransactionCoverage({ ...tapRun(KNOWN_TAP), error }).length).toBeGreaterThan(0);
 288:     }
 289:     for (const signal of [false, 0, '']) {
 290:       expect(judgeInstallTransactionCoverage({ ...tapRun(KNOWN_TAP), signal }).length).toBeGreaterThan(0);
 291:     }
 292:   });
 293: 
 294:   test('affirmative coverage requires both exact files, every metric and consistent aggregate counts', () => {
 295:     for (const evidence of [undefined, null, {}, { ...COVERAGE_EVIDENCE, coverageSummary: {} },
 296:       { ...COVERAGE_EVIDENCE, host: { platform: 'unknown' } },
 297:       { ...COVERAGE_EVIDENCE, projectRoot: '/foreign-project' }]) {
 298:       expect(judgeCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
 299:     }
 300:     for (const file of Object.keys(COVERAGE_EVIDENCE.coverageSummary)) {
 301:       for (const metric of ['lines', 'statements', 'functions', 'branches']) {
 302:         for (const delta of [{ total: 0 }, { covered: 0 }, { skipped: 1 }, { pct: 99.99 }, { pct: '100' }]) {
 303:           const evidence = structuredClone(COVERAGE_EVIDENCE);
 304:           Object.assign(evidence.coverageSummary[file][metric], delta);
 305:           expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
 306:         }
 307:       }
 308:       const absent = structuredClone(COVERAGE_EVIDENCE);
 309:       delete absent.coverageSummary[file];
 310:       expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), absent).length).toBeGreaterThan(0);
 311:     }
 312:     const aggregate = structuredClone(COVERAGE_EVIDENCE);
 313:     aggregate.coverageSummary.total.branches.total++;
 314:     aggregate.coverageSummary.total.branches.covered++;
 315:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), aggregate).length).toBeGreaterThan(0);
 316:     const extra = structuredClone(COVERAGE_EVIDENCE);
 317:     extra.coverageSummary['C:/foreign/file.js'] = structuredClone(extra.coverageSummary.total);
 318:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), extra).length).toBeGreaterThan(0);
 319:     for (const platform of ['linux', 'darwin']) {
 320:       const evidence = structuredClone(COVERAGE_EVIDENCE);
 321:       evidence.host.platform = platform;
 322:       evidence.projectRoot = '/project';
 323:       evidence.coverageSummary = Object.fromEntries(Object.entries(evidence.coverageSummary).map(([name, data]) => [
 324:         name === 'total' ? name : `/project/bin/lib/${path.win32.basename(name)}`, data,
 325:       ]));
 326:       expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence)).toEqual([]);
 327:     }
 328:   });
 329: 
 330:   test('coverage refuses malformed or interrupted runs and TAP tokens disguised as table rows', () => {
 331:     for (const run of [undefined, null, {}, { ...tapRun(KNOWN_TAP), signal: 'SIGTERM' },
 332:       { ...tapRun(KNOWN_TAP), error: new Error('timeout') }, { ...tapRun(KNOWN_TAP), stderr: null }]) {
 333:       expect(judgeInstallTransactionCoverage(run).length).toBeGreaterThan(0);
 334:     }
 335:     for (const line of ['Bail out! | incomplete', '  ok 1 - nested | ignored', '# tests 51 | fake']) {
 336:       expect(judgeInstallTransactionCoverage(tapRun(`${KNOWN_TAP}\n${line}`)).length).toBeGreaterThan(0);
 337:     }
 338:   });
 339: 
 340:   test('coverage aliases, malformed tables and truncated TAP are rejected', () => {
 341:     const file = Object.keys(COVERAGE_EVIDENCE.coverageSummary).find(name => name !== 'total');
 342:     for (const change of [
 343:       evidence => { evidence.projectRoot = 'relative'; },
 344:       evidence => { delete evidence.projectRoot; },
 345:       evidence => { evidence.coverageSummary[file] = null; },
 346:       evidence => { evidence.coverageSummary[file].unreviewedMetric = {}; },
 347:       evidence => { evidence.coverageSummary[file.toUpperCase()] = evidence.coverageSummary[file]; },
 348:     ]) {
 349:       const evidence = structuredClone(COVERAGE_EVIDENCE);
 350:       change(evidence);
 351:       expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
 352:     }
 353:     for (const wrong of [
 354:       KNOWN_TAP.replace('# Subtest: names:', '# Subtest: unknown:'),
 355:       KNOWN_TAP.replace('  ---', '  missing-start'),
 356:       KNOWN_TAP.slice(0, KNOWN_TAP.lastIndexOf('  ...')).trimEnd(),
 357:       KNOWN_TAP.replace("  type: 'test'", "  type: 'test'\n  error: 'unexpected error'"),
 358:       KNOWN_TAP.replace('# duration_ms ', '# duration_ms NaN'),
 359:       `${KNOWN_TAP}\nunstructured trailing garbage`,
 360:     ]) expect(judgeInstallTransactionCoverage(tapRun(wrong)).length).toBeGreaterThan(0);
 361:   });
 362: 
 363:   test('a normalized alias cannot replace the exact covered source identity', () => {
 364:     const evidence = structuredClone(COVERAGE_EVIDENCE);
 365:     const file = Object.keys(evidence.coverageSummary).find(name => name !== 'total');
 366:     const alias = `${path.win32.dirname(file)}/../lib/${path.win32.basename(file)}`;
 367:     evidence.coverageSummary[alias] = evidence.coverageSummary[file];
 368:     delete evidence.coverageSummary[file];
 369:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
 370:   });
 371: 
 372:   test('decision controls detect independently weakened recovery and coverage guards', () => {
 373:     const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'expect-red.cjs'), 'utf8');
 374:     const recoveryCases = [
 375:       ['if (checks.has(key))', report => { report.checks.push(structuredClone(report.checks[0])); }],
 376:       ['if (!expectedKeys.has(key))', report => { report.checks.push({ scenario: 'fresh', id: 'unreviewed', kind: 'acceptance', ok: true }); }],
 377:       ['if (report.fixtureRemoved !== true)', report => { report.fixtureRemoved = false; }],
 378:       ['if (!validRecoveryContext(report.context, report.platform))', report => { report.context.upgrade.edited = '../owner'; }],
 379:       ['if (!isDeepStrictEqual(check.evidence, recoveryObservation(check, report.context)))', report => {
 380:         report.checks.find(check => check.id === 'new-equals-twin-residue').evidence.actual.changed.push('owner.txt');
 381:       }],
 382:       ['if (checks.get(key)?.ok !== true)', report => {
 383:         setCheck(report, 'upgrade:owner-bytes-preserved', false);
 384:         report.failure += ', upgrade:owner-bytes-preserved';
 385:       }],
 386:       ['if (checks.get(key)?.ok !== false)', report => {
 387:         setCheck(report, 'fresh:outcome-exact', true);
 388:         report.failure = report.failure.split(', ').filter(key => key !== 'fresh:outcome-exact').join(', ');
 389:       }],
 390:     ].map(([before, change]) => ({ before, after: 'if (false)', name: 'judgeInstallerRecovery',
 391:       run: runOf(mutated(change)), evidence: RECOVERY_EVIDENCE }));
 392:     const shortfall = structuredClone(COVERAGE_EVIDENCE);
 393:     const file = Object.keys(shortfall.coverageSummary).find(name => name !== 'total');
 394:     shortfall.coverageSummary[file].branches.pct = 99;
 395:     const aggregate = structuredClone(COVERAGE_EVIDENCE);
 396:     aggregate.coverageSummary.total.lines.total++;
 397:     aggregate.coverageSummary.total.lines.covered++;
 398:     const coverageCases = [
 399:       { before: 'problems.push(...coverageEvidenceProblems(evidence));', after: '', evidence: undefined },
 400:       { before: 'value.pct !== 100', after: 'false', evidence: shortfall },
 401:       { before: "if (tables.get('total')[metric][count] !== sum)", after: 'if (false)', evidence: aggregate },
 402:       { before: 'const framingProblems = tapFramingProblems(lines);', after: 'const framingProblems = [];',
 403:         evidence: COVERAGE_EVIDENCE, run: tapRun(KNOWN_TAP.replace('# pass 41', '# pass 40')) },
 404:       { before: `if (offset >= 41 && fields.get('error') !== "'not implemented: renderOutcome'")`, after: 'if (false)',
 405:         evidence: COVERAGE_EVIDENCE, run: tapRun(KNOWN_TAP.replace(FIRST_REASON, "error: 'unexpected owner loss'")) },
 406:     ].map(value => ({ name: 'judgeInstallTransactionCoverage', run: tapRun(KNOWN_TAP), ...value }));
 407:     for (const control of [...recoveryCases, ...coverageCases]) {
 408:       const judge = control.name === 'judgeInstallerRecovery' ? judgeRecovery : judgeCoverage;
 409:       // The original rejection predicate must fail for this exact weakened copy.
 410:       expect(judge(control.run, control.evidence).length).toBeGreaterThan(0);
 411:       expect(source.split(control.before)).toHaveLength(2);
 412:       const mutant = { exports: {} };
 413:       require('node:vm').runInNewContext(source.replace(control.before, control.after), {
 414:         module: mutant, require, process, Buffer, __dirname: path.resolve(__dirname, '..', 'scripts'),
 415:       }, { filename: 'expect-red-decision-mutant.cjs', timeout: 1000 });
 416:       expect(mutant.exports[control.name](control.run, control.evidence)).toEqual([]);
 417:     }
 418:     expect(recoveryCases.length + coverageCases.length).toBe(12);
 419:   });
 420: 
 421:   test('the reviewed 51-case render-only red is the known red', () => {
 422:     expect(KNOWN_TAP.split(FIRST_REASON).length).toBeGreaterThan(2);
 423:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP))).toEqual([]);
 424:   });
 425: 
 426:   test('old skeleton evidence and any incomplete or changed case inventory are refused', () => {
 427:     const old = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-known-red.tap.txt'), 'utf8');
 428:     expect(judgeInstallTransactionCoverage(tapRun(old)).length).toBeGreaterThan(0);
 429:     const lines = KNOWN_TAP.split('\n').filter(line => /^(not )?ok \d+ - /.test(line));
 430:     expect(lines).toHaveLength(51);
 431:     for (const line of lines) {
 432:       for (const replacement of ['', line.replace(' - ', ' - unreviewed: '), `${line}\n${line}`]) {
 433:         expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP.replace(line, replacement))).length).toBeGreaterThan(0);
 434:       }
 435:     }
 436:   });
 437: 
 438:   test('TAP framing, terminal counts and bounded render failure diagnostics are mandatory', () => {
 439:     for (const wrong of [
 440:       KNOWN_TAP.replace('TAP version 13', ''), `TAP version 13\n${KNOWN_TAP}`,
 441:       KNOWN_TAP.replace('1..51', '1..50'), KNOWN_TAP.replace('1..51', '1..51\n1..51'),
 442:       KNOWN_TAP.replace('# pass 41', '# pass 40'), KNOWN_TAP.replace('# skipped 0', '# skipped 1'),
 443:       KNOWN_TAP.replace('# cancelled 0', '# cancelled 1'), KNOWN_TAP.replace('# todo 0', '# todo 1'),
 444:       KNOWN_TAP.replace('# suites 0', '# suites 1'), KNOWN_TAP.replace('# tests 51', '# tests 50'),
 445:       KNOWN_TAP.replace('# tests 51', '# unrelated\n# tests 51'),
 446:       KNOWN_TAP.replace('  ...', '  broken-end'),
 447:       KNOWN_TAP.replace("code: 'ERR_TEST_FAILURE'", "code: 'DIFFERENT_ERROR'"),
 448:       KNOWN_TAP.replace("failureType: 'testCodeFailure'", "failureType: 'cancelledByParent'"),
 449:       KNOWN_TAP.replace(FIRST_REASON, "error: 'not implemented: acquireLock'"),
 450:       KNOWN_TAP.replace(FIRST_REASON, `${FIRST_REASON}\n  ${FIRST_REASON}`),
 451:       `${KNOWN_TAP}\nBail out! incomplete`, `${KNOWN_TAP}\n    ok 1 - nested`,
 452:     ]) expect(judgeInstallTransactionCoverage(tapRun(wrong)).length).toBeGreaterThan(0);
 453:     const metadata = KNOWN_TAP.replace('  duration_ms:', "  futureMetadata: 'portable'\n  duration_ms:");
 454:     expect(judgeInstallTransactionCoverage(tapRun(metadata))).toEqual([]);
 455:   });
 456: 
 457:   test('only the actual error field can establish the permitted render failure', () => {
 458:     const disguised = KNOWN_TAP.replace(`  ${FIRST_REASON}`,
 459:       `  futureMetadata: |-\n    ${FIRST_REASON}\n  error: 'unexpected owner loss'`);
 460:     expect(judgeInstallTransactionCoverage(tapRun(disguised)).length).toBeGreaterThan(0);
 461:   });
 462: 
 463:   test('a case failing for any reason other than an unbuilt operation is the wrong red', () => {
 464:     const wrong = KNOWN_TAP.replace(FIRST_REASON, "error: 'Expected values to be strictly equal'");
 465:     const problems = judgeInstallTransactionCoverage(tapRun(wrong));
 466:     expect(problems).toHaveLength(1);
 467:     expect(problems[0].startsWith('failed for another reason: render:')).toBe(true);
 468:   });
 469: 
 470:   test('a coverage shortfall on landed code is the wrong red, on either stream', () => {
 471:     const shortfall = 'ERROR: Coverage for branches (88.88%) does not meet threshold (100%) for bin/lib/install-names.js';
 472:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP, 1, `${shortfall}\n`))).toEqual([shortfall]);
 473:     expect(judgeInstallTransactionCoverage(tapRun(`${KNOWN_TAP}\n${shortfall}\n`))).toEqual([shortfall]);
 474:   });
 475: 
 476:   test('nothing failing, a crash with no summary, and a miscounted summary are all refused', () => {
 477:     const green = KNOWN_TAP.split('\n').filter(line => !line.startsWith('# fail ')).join('\n');
 478:     expect(judgeInstallTransactionCoverage(tapRun(`${green}\n# fail 0\n`, 0))[0]).toContain('UNEXPECTED PASS');
 479:     expect(judgeInstallTransactionCoverage(tapRun('', 1, 'Error: Cannot find module'))[0]).toContain('Cannot find module');
 480:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP.replace('# fail 10', '# fail 11')))).toContain(
 481:       'summary reports 11 failures, 10 found',
 482:     );
 483:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP, 7))).toEqual(['exit status 7, expected 1']);
 484:   });
 485: });
 486: 
 487: describe('expect-red: command line', () => {
 488:   const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
 489: 
 490:   longTest('the actual Node CLI validates the live coverage gate through private c8 capture', () => {
 491:     const env = { ...process.env };
 492:     delete env.NODE_TEST_CONTEXT;
 493:     const run = spawnSync('node', ['scripts/expect-red.cjs', 'install-transaction-coverage'], {
 494:       cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8', timeout: 90000,
 495:     });
 496:     expect(run.error).toBeUndefined();
 497:     expect(run.status).toBe(0);
 498:     expect(run.stderr).toContain('# tests 51');
 499:     expect(run.stderr).toContain('# pass 41');
 500:     expect(run.stderr).toContain('# fail 10');
 501:     expect(run.stderr).toContain('failed for the known reason');
 502:   });
 503: 
 504:   test('coverage ignore directives in either watched module refuse before execution', () => {
 505:     for (const module of ['install-names.js', 'install-transaction.js']) {
 506:       for (const provider of ['c8', 'v8', 'istanbul']) {
 507:         let spawned = false;
 508:         const messages = [];
 509:         const result = main(['install-transaction-coverage'], {
 510:           packageJson, log: message => messages.push(message),
 511:           runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
 512:           fs: { ...fs, readFileSync(name, ...args) {
 513:             const bytes = fs.readFileSync(name, ...args);
 514:             return path.basename(name) === module ? Buffer.concat([Buffer.from(bytes), Buffer.from(`\n/* ${provider} ignore next */`)]) : bytes;
 515:           } },
 516:           spawnSync: () => { spawned = true; return { status: 1, stdout: '', stderr: '' }; },
 517:         });
 518:         expect(result).toBe(1);
 519:         expect(spawned).toBe(false);
 520:         expect(messages.join('\n')).toContain(module);
 521:       }
 522:     }
 523:   });
 524: 
 525:   test('capture bounds execution and isolates inherited test and coverage configuration', () => {
 526:     const previousContext = process.env.NODE_TEST_CONTEXT;
 527:     const previousCoverage = process.env.NODE_V8_COVERAGE;
 528:     process.env.NODE_TEST_CONTEXT = 'child-v8';
 529:     process.env.NODE_V8_COVERAGE = 'unrelated-coverage';
 530:     let inspected = false;
 531:     try {
 532:       main(['install-transaction-coverage'], {
 533:         packageJson, log: () => {},
 534:         runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
 535:         spawnSync: (_exe, args, options) => {
 536:           expect(options.env?.NODE_TEST_CONTEXT).toBeUndefined();
 537:           const temp = args.find(value => value.startsWith('--temp-directory=')).slice('--temp-directory='.length);
 538:           expect(options.env?.NODE_V8_COVERAGE).toBe(temp);
 539:           expect(Number.isInteger(options.timeout)).toBe(true);
 540:           expect(options.timeout).toBeGreaterThan(0);
 541:           expect(options.timeout).toBeLessThanOrEqual(300000);
 542:           const config = args.find(value => value.startsWith('--config='));
 543:           expect(config).toBeDefined();
 544:           expect(JSON.parse(fs.readFileSync(config.slice('--config='.length), 'utf8'))).toEqual({});
 545:           inspected = true;
 546:           return { status: 1, stdout: '', stderr: '' };
 547:         },
 548:       });
 549:       expect(inspected).toBe(true);
 550:     } finally {
 551:       if (previousContext === undefined) delete process.env.NODE_TEST_CONTEXT;
 552:       else process.env.NODE_TEST_CONTEXT = previousContext;
 553:       if (previousCoverage === undefined) delete process.env.NODE_V8_COVERAGE;
 554:       else process.env.NODE_V8_COVERAGE = previousCoverage;
 555:     }
 556:   });
 557: 
 558:   test('inherited Node test-runner options refuse before child execution', () => {
 559:     const previous = process.env.NODE_OPTIONS;
 560:     try {
 561:       for (const option of ['--test', '--test-reporter=tap', '--test-name-pattern=only-one', '--experimental-test-isolation=none']) {
 562:         process.env.NODE_OPTIONS = option;
 563:         let spawned = false;
 564:         const result = main(['installer-recovery'], {
 565:           packageJson, log: () => {},
 566:           runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
 567:           spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
 568:         });
 569:         expect(result).toBe(1);
 570:         expect(spawned).toBe(false);
 571:       }
 572:     } finally {
 573:       if (previous === undefined) delete process.env.NODE_OPTIONS;
 574:       else process.env.NODE_OPTIONS = previous;
 575:     }
 576:   });
 577: 
 578:   test('capture faults cannot pass or silently discard uncertain evidence', () => {
 579:     const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
 580:     const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
 581:     for (const mode of ['missing', 'malformed', 'symlink', 'not-file', 'cleanup', 'timeout', 'signal',
 582:       'spawn-throw', 'read-before', 'read-after', 'mkdir', 'scratch-link', 'scratch-not-directory', 'c8-version', 'c8-json']) {
 583:       let scratch;
 584:       let spawned = false;
 585:       const messages = [];
 586:       const fault = () => { throw Object.assign(new Error(`injected ${mode}`), { code: 'EACCES' }); };
 587:       const fileSystem = { ...fs,
 588:         mkdtempSync(prefix) { scratch = fs.mkdtempSync(prefix); return scratch; },
 589:         mkdirSync(name) { if (mode === 'mkdir') fault(); return fs.mkdirSync(name); },
 590:         readFileSync(name, ...args) {
 591:           if (path.basename(path.dirname(name)) === 'c8' && path.basename(name) === 'package.json') {
 592:             if (mode === 'c8-version') return '{}';
 593:             if (mode === 'c8-json') return '{bad';
 594:           }
 595:           if (mode === 'read-before' || (mode === 'read-after' && spawned && path.basename(name) !== 'coverage-summary.json')) fault();
 596:           if (path.basename(name) === 'coverage-summary.json') expect(path.dirname(path.dirname(name))).toBe(scratch);
 597:           return fs.readFileSync(name, ...args);
 598:         },
 599:         lstatSync(name) {
 600:           const stat = fs.lstatSync(name);
 601:           if (path.basename(name) === 'coverage-summary.json') {
 602:             if (mode === 'symlink') stat.isSymbolicLink = () => true;
 603:             if (mode === 'not-file') stat.isFile = () => false;
 604:           }
 605:           if (name === scratch) {
 606:             if (mode === 'scratch-link') stat.isSymbolicLink = () => true;
 607:             if (mode === 'scratch-not-directory') stat.isDirectory = () => false;
 608:           }
 609:           return stat;
 610:         },
 611:         rmSync(name, options) { if (mode === 'cleanup') fault(); return fs.rmSync(name, options); },
 612:       };
 613:       try {
 614:         const result = main(['install-transaction-coverage'], {
 615:           packageJson, fs: fileSystem, log: message => messages.push(message),
 616:           runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
 617:           spawnSync: (_exe, args) => {
 618:             spawned = true;
 619:             if (mode === 'spawn-throw') fault();
 620:             const reports = args.find(value => value.startsWith('--reports-dir=')).slice('--reports-dir='.length);
 621:             const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
 622:               name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
 623:             ]));
 624:             if (mode !== 'missing') fs.writeFileSync(path.join(reports, 'coverage-summary.json'), mode === 'malformed' ? '{broken' : JSON.stringify(nativeSummary));
 625:             if (mode === 'timeout') return { status: null, stdout, stderr: '', error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) };
 626:             if (mode === 'signal') return { status: null, stdout, stderr: '', signal: 'SIGTERM' };
 627:             return { status: 1, stdout, stderr: '' };
 628:           },
 629:         });
 630:         expect(result).toBe(1);
 631:         if (['timeout', 'signal', 'spawn-throw', 'mkdir', 'cleanup', 'scratch-link', 'scratch-not-directory'].includes(mode)) {
 632:           expect(fs.existsSync(scratch)).toBe(true);
 633:           expect(messages.join('\n')).toContain(scratch);
 634:         } else if (scratch) expect(fs.existsSync(scratch)).toBe(false);
 635:       } finally {
 636:         // No real child was launched. Only remove this test's exact recorded temp.
 637:         if (scratch && fs.existsSync(scratch)) {
 638:           expect(path.dirname(scratch)).toBe(path.resolve(__dirname, '..', '.claude'));
 639:           expect(path.basename(scratch).startsWith('expect-red-')).toBe(true);
 640:           fs.rmSync(scratch, { recursive: true });
 641:         }
 642:       }
 643:     }
 644:   });
 645: 
 646:   test('cleanup never removes a scratch path outside its exact ownership convention', () => {
 647:     const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
 648:     const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
 649:     const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
 650:       name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
 651:     ]));
 652:     for (const location of [['.claude', 'not-owned'], ['.planning', 'expect-red-foreign']]) {
 653:       let removed = false;
 654:       const messages = [];
 655:       // Virtual paths only: the injected filesystem does not create or write them.
 656:       const virtualPath = path.resolve(__dirname, '..', ...location);
 657:       const result = main(['install-transaction-coverage'], {
 658:         packageJson, log: message => messages.push(message),
 659:         runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
 660:         fs: { ...fs, mkdtempSync: () => virtualPath, mkdirSync() {}, writeFileSync() {},
 661:           lstatSync: () => ({ isFile: () => true, isSymbolicLink: () => false }),
 662:           readFileSync(name, ...args) {
 663:             return path.basename(name) === 'coverage-summary.json' ? JSON.stringify(nativeSummary) : fs.readFileSync(name, ...args);
 664:           },
 665:           rmSync() { removed = true; },
 666:         },
 667:         spawnSync: () => ({ status: 1, stdout, stderr: '' }),
 668:       });
 669:       expect(result).toBe(1);
 670:       expect(removed).toBe(false);
 671:       expect(messages.join('\n')).toContain('scratch ownership mismatch');
 672:     }
 673:   });
 674: 
 675:   test('coverage capture uses a new private report and V8 directory on every invocation', () => {
 676:     const seen = new Set();
 677:     const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
 678:     const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
 679:     for (let index = 0; index < 2; index++) {
 680:       let scratch;
 681:       const messages = [];
 682:       const result = main(['install-transaction-coverage'], {
 683:         packageJson, log: message => messages.push(message),
 684:         runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
 685:         spawnSync: (_exe, args) => {
 686:           const reportIndex = args.findIndex(value => value.startsWith('--reports-dir='));
 687:           const tempIndex = args.findIndex(value => value.startsWith('--temp-directory='));
 688:           expect(reportIndex).toBeGreaterThan(0);
 689:           expect(tempIndex).toBeGreaterThan(0);
 690:           expect(reportIndex).toBeLessThan(args.indexOf('node'));
 691:           expect(tempIndex).toBeLessThan(args.indexOf('node'));
 692:           const reports = args[reportIndex].slice('--reports-dir='.length);
 693:           const v8 = args[tempIndex].slice('--temp-directory='.length);
 694:           scratch = path.dirname(reports);
 695:           expect(path.dirname(v8)).toBe(scratch);
 696:           expect(seen.has(scratch)).toBe(false);
 697:           seen.add(scratch);
 698:           expect(fs.readdirSync(reports)).toEqual([]);
 699:           expect(fs.readdirSync(v8)).toEqual([]);
 700:           const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
 701:             name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
 702:           ]));
 703:           fs.writeFileSync(path.join(reports, 'coverage-summary.json'), JSON.stringify(nativeSummary));
 704:           return { status: 1, stdout, stderr: 'capture stderr retained' };
 705:         },
 706:       });
 707:       expect(result).toBe(0);
 708:       expect(fs.existsSync(scratch)).toBe(false);
 709:       expect(messages.join('\n')).toContain('capture stderr retained');
 710:     }
 711:   });
 712: 
 713:   test('source or validator changes during capture invalidate the report', () => {
 714:     for (const changed of ['bin/install.js', 'dist/bin/install.js', 'tests/acceptance/installer-recovery.cjs',
 715:       'package.json', 'scripts/expect-red.cjs']) {
 716:       let spawned = false;
 717:       const messages = [];
 718:       const fileSystem = { ...fs, readFileSync(name, ...args) {
 719:         const bytes = fs.readFileSync(name, ...args);
 720:         const relative = path.relative(path.resolve(__dirname, '..'), name).split(path.sep).join('/');
 721:         return spawned && relative === changed ? Buffer.concat([Buffer.from(bytes), Buffer.from(' ')]) : bytes;
 722:       } };
 723:       const result = main(['installer-recovery'], {
 724:         packageJson, fs: fileSystem, log: message => messages.push(message),
 725:         runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
 726:         spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
 727:       });
 728:       expect(result).toBe(1);
 729:       expect(messages.join('\n')).toContain(changed);
 730:     }
 731:   });
 732: 
 733:   test('the package command is parsed from the same bytes as its evidence digest', () => {
 734:     let spawned = false;
 735:     const changed = structuredClone(packageJson);
 736:     changed.scripts['test:acceptance:installer-recovery'] = 'node tests/other.cjs';
 737:     const result = main(['installer-recovery'], {
 738:       packageJson, log: () => {},
 739:       runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
 740:       fs: { ...fs, readFileSync(name, ...args) {
 741:         return path.resolve(name) === path.resolve(__dirname, '..', 'package.json')
 742:           ? Buffer.from(JSON.stringify(changed)) : fs.readFileSync(name, ...args);
 743:       } },
 744:       spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
 745:     });
 746:     expect(result).toBe(1);
 747:     expect(spawned).toBe(false);
 748:   });
 749: 
 750:   test('the runner prints source identities and runtime provenance with its verdict', () => {
 751:     const messages = [];
 752:     expect(main(['installer-recovery'], {
 753:       packageJson, log: message => messages.push(message),
 754:       runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
 755:       spawnSync: () => runOf(KNOWN_RED),
 756:     })).toBe(0);
 757:     const line = messages.find(message => typeof message === 'string' && message.startsWith('expect-red evidence: '));
 758:     expect(line).toBeDefined();
 759:     const evidence = JSON.parse(line.slice('expect-red evidence: '.length));
 760:     expect(evidence.node).toBe(capturedRecovery.node);
 761:     expect(evidence.platform).toBe(capturedRecovery.platform);
 762:     expect(Object.keys(evidence.sourceHashes).sort()).toEqual([
 763:       'bin/install.js', 'dist/bin/install.js', 'package.json', 'scripts/expect-red.cjs', 'tests/acceptance/installer-recovery.cjs',
 764:     ]);
 765:     for (const digest of Object.values(evidence.sourceHashes)) expect(digest).toMatch(/^[a-f0-9]{64}$/);
 766:   });
 767: 
 768:   test('c8 executes the same explicit Node runtime that captured the evidence', () => {
 769:     const selectedNode = path.resolve(__dirname, '..', '.claude', 'selected-node-runtime');
 770:     let observed;
 771:     main(['install-transaction-coverage'], {
 772:       packageJson, log: () => {},
 773:       runtime: { execPath: selectedNode, platform: process.platform, nodeVersion: process.version, isBun: false },
 774:       spawnSync: (exe, args) => { observed = { exe, args }; return { status: 1, stdout: '', stderr: '' }; },
 775:     });
 776:     expect(observed.exe).toBe(selectedNode);
 777:     expect(observed.args[observed.args.indexOf('--test') - 1]).toBe(selectedNode);
 778:   });
 779: 
 780:   test('the production gate refuses Bun before spawning a child', () => {
 781:     let spawned = false;
 782:     const messages = [];
 783:     const result = main(['installer-recovery'], {
 784:       packageJson, log: message => messages.push(message),
 785:       runtime: { execPath: process.execPath, platform: process.platform, nodeVersion: process.version, isBun: true },
 786:       spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
 787:     });
 788:     expect(spawned).toBe(false);
 789:     expect(result).toBe(1);
 790:     expect(messages.join('\n')).toContain('Node');
 791:   });
 792: 
 793:   test('the gate command is read from package.json, not copied', () => {
 794:     expect(commandFor({ script: 'test:acceptance:installer-recovery' }, packageJson)).toEqual([
 795:       'tests/acceptance/installer-recovery.cjs',
 796:     ]);
 797:     const coverage = commandFor({ script: 'test:coverage:install-transaction' }, packageJson);
 798:     expect(coverage).toContain('--include=bin/lib/install-transaction.js');
 799:     expect(coverage.some(argument => argument.includes("'"))).toBe(false);
 800:     expect(() => commandFor({ script: 'test' }, { scripts: { test: 'bun test' } })).toThrow('plain "node <file>"');
 801:     expect(() => commandFor({ script: 'absent' }, packageJson)).toThrow('absent');
 802:   });
 803: 
 804:   test('package commands cannot weaken coverage or redirect the reviewed gate', () => {
 805:     const script = 'test:coverage:install-transaction';
 806:     const command = packageJson.scripts[script];
 807:     for (const changed of [
 808:       command.replace('--branches 100', '--branches 99'),
 809:       command.replace('--all ', ''), command.replace('--per-file ', ''),
 810:       command.replace('--reporter=json-summary ', ''),
 811:       command.replace('--test-reporter=tap', '--test-reporter=spec'),
 812:       command.replace('tests/coverage/install-transaction.test.cjs', 'tests/other.cjs'),
 813:       `${command} --config=elsewhere.json`, `${command} --exclude=bin/lib/install-transaction.js`,
 814:     ]) expect(() => commandFor({ script }, { scripts: { [script]: changed } })).toThrow();
 815:     expect(() => commandFor({ script: 'test:acceptance:installer-recovery' }, {
 816:       scripts: { 'test:acceptance:installer-recovery': 'node tests/other.cjs' },
 817:     })).toThrow();
 818:   });
 819: 
 820:   test('exits 0 on the known red, 1 on anything else, 2 on misuse', () => {
 821:     const lines = [];
 822:     const dependencies = result => ({ packageJson, log: line => lines.push(line), spawnSync: () => result,
 823:       runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
 824:     });
 825:     expect(main(['installer-recovery'], dependencies(runOf(KNOWN_RED)))).toBe(0);
 826:     expect(main(['installer-recovery'], dependencies(runOf(KNOWN_RED, 0)))).toBe(1);
 827:     expect(main(['installer-recovery'], dependencies({ error: new Error('spawn ENOENT') }))).toBe(1);
 828:     expect(main([], dependencies(runOf(KNOWN_RED)))).toBe(2);
 829:     expect(main(['constructor'], dependencies(runOf(KNOWN_RED)))).toBe(2);
 830:     expect(lines.join('\n')).toContain('Usage: node scripts/expect-red.cjs <installer-recovery|install-transaction-coverage>');
 831:   });
 832: });
END SOURCE tests/expect-red.test.js

BEGIN SOURCE tests/acceptance/installer-recovery.cjs SHA256 87047200ee914ebab1c67d72fafed3a9356d8b64878c6f4d0ec0616587da6ee4
   1: 'use strict';
   2: 
   3: // Run explicitly: node tests/acceptance/installer-recovery.cjs (after bun run compose)
   4: // Contract: docs/reviews/installer-rollback-redesign-2026-09-18.md, "Proof".
   5: // Exercises the real wrapper and the real composed child in disposable homes under
   6: // this checkout. It never reads the wrapper's journal or snapshot to learn the
   7: // pre-image: the oracles are a twin fixture and this file's own tree walker.
   8: const assert = require('node:assert/strict');
   9: const crypto = require('node:crypto');
  10: const fs = require('node:fs');
  11: const os = require('node:os');
  12: const path = require('node:path');
  13: const { spawnSync } = require('node:child_process');
  14: 
  15: const project = path.resolve(__dirname, '../..');
  16: const scratchParent = path.join(project, '.claude');
  17: fs.mkdirSync(scratchParent, { recursive: true });
  18: const scratch = fs.mkdtempSync(path.join(scratchParent, 'installer-recovery-'));
  19: const wrapper = path.join(project, 'bin/install.js');
  20: const upstream = path.join(project, 'dist/bin/install.js');
  21: 
  22: const INJECTED = 'INJECTED_MANIFEST_PUBLICATION_FAILURE';
  23: const TRANSACTION_DIR = 'gsd-install-transaction';
  24: const OWNER_FILES = {
  25:   'owner.txt': 'owner bytes\n',
  26:   'settings.json': '{"owner":{"keep":true},"statusLine":{"type":"command","command":"echo owner"}}\n',
  27: };
  28: const OUTCOME = /^Rollback applied: GSD roots restored to their state at (\S.*) and verified$/;
  29: const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
  30: 
  31: const report = { platform: process.platform, node: process.version, accepted: false, checks: [], context: {} };
  32: 
  33: class ScenarioAborted extends Error {}
  34: 
  35: function record(scenario, kind, id, fn) {
  36:   let evidence;
  37:   const observe = (observationKind, actual) => { evidence = { kind: observationKind, actual }; };
  38:   try {
  39:     fn(observe);
  40:     report.checks.push({ scenario, kind, id, ok: true, evidence: evidence || { kind: 'assertion-pass', actual: {} } });
  41:     return true;
  42:   } catch (error) {
  43:     if (!evidence || error.code !== 'ERR_ASSERTION') {
  44:       evidence = { kind: 'observation-error', actual: { code: error.code || null, message: String(error.message) } };
  45:     }
  46:     report.checks.push({ scenario, kind, id, ok: false, evidence,
  47:       detail: String(error.message).replace(ANSI, '').slice(0, 600) });
  48:     return false;
  49:   }
  50: }
  51: 
  52: // A harness check proves the scenario ran as designed; without it nothing later means anything.
  53: function harness(scenario, id, fn) {
  54:   if (!record(scenario, 'harness', id, fn)) throw new ScenarioAborted(`${scenario}:${id}`);
  55: }
  56: 
  57: function accept(scenario, id, fn) {
  58:   record(scenario, 'acceptance', id, fn);
  59: }
  60: 
  61: function digestOf(bytes) {
  62:   return crypto.createHash('sha256').update(bytes).digest('hex');
  63: }
  64: 
  65: // Own walker: type, SHA-256, link targets, and every directory so empty ones count.
  66: function snapshotTree(root) {
  67:   const entries = {};
  68:   const pending = [''];
  69:   while (pending.length) {
  70:     const relative = pending.pop();
  71:     for (const name of fs.readdirSync(path.join(root, relative))) {
  72:       const child = relative ? `${relative}/${name}` : name;
  73:       const absolute = path.join(root, child);
  74:       const stat = fs.lstatSync(absolute);
  75:       if (stat.isSymbolicLink()) entries[child] = `link:${fs.readlinkSync(absolute)}`;
  76:       else if (stat.isDirectory()) {
  77:         entries[child] = 'dir';
  78:         pending.push(child);
  79:       } else entries[child] = `file:${digestOf(fs.readFileSync(absolute))}`;
  80:     }
  81:   }
  82:   return entries;
  83: }
  84: 
  85: function typesOnly(tree) {
  86:   return Object.fromEntries(Object.entries(tree).map(([name, value]) => [name, value.split(':')[0]]));
  87: }
  88: 
  89: function without(tree, topLevelName) {
  90:   return Object.fromEntries(Object.entries(tree)
  91:     .filter(([name]) => name !== topLevelName && !name.startsWith(`${topLevelName}/`)));
  92: }
  93: 
  94: function assertSameTree(actual, expected, label, observe) {
  95:   const missing = Object.keys(expected).filter(name => !(name in actual)).sort();
  96:   const unexpected = Object.keys(actual).filter(name => !(name in expected)).sort();
  97:   const changed = Object.keys(expected).filter(name => name in actual && actual[name] !== expected[name]).sort();
  98:   observe('tree-delta', { missing, unexpected, changed });
  99:   if (missing.length + unexpected.length + changed.length === 0) return;
 100:   const show = list => `${list.length}${list.length ? ` (${list.slice(0, 6).join(', ')})` : ''}`;
 101:   assert.fail(`${label}: missing ${show(missing)}; unexpected ${show(unexpected)}; changed ${show(changed)}`);
 102: }
 103: 
 104: function createFixture(name) {
 105:   const home = path.join(scratch, `${name} home`);
 106:   const target = path.join(home, 'runtime with spaces');
 107:   fs.mkdirSync(target, { recursive: true });
 108:   for (const [file, content] of Object.entries(OWNER_FILES)) fs.writeFileSync(path.join(target, file), content);
 109:   return { name, home, target };
 110: }
 111: 
 112: // Inject only at the first manifest publication in the real upstream child, after
 113: // materialization has started. The wrapper's recovery is not mocked. The trace is a
 114: // lower bound: synchronous path-based calls only.
 115: function writeInjection(fixture) {
 116:   const preload = path.join(scratch, `${fixture.name} inject write failure.cjs`);
 117:   const traceFile = path.join(scratch, `${fixture.name}-write-trace.json`);
 118:   fs.writeFileSync(preload, `
 119:     const fs = require('node:fs');
 120:     const path = require('node:path');
 121:     if (path.resolve(process.argv[1]) === ${JSON.stringify(upstream)}) {
 122:       const write = fs.writeFileSync;
 123:       const trace = [];
 124:       const home = ${JSON.stringify(fixture.home)};
 125:       const methods = { writeFileSync: [0], copyFileSync: [1], appendFileSync: [0],
 126:         unlinkSync: [0], rmSync: [0], rmdirSync: [0], mkdirSync: [0], renameSync: [0, 1] };
 127:       for (const [method, indices] of Object.entries(methods)) {
 128:         const original = fs[method];
 129:         fs[method] = function(...args) {
 130:           const paths = indices.flatMap(index => {
 131:             if (typeof args[index] !== 'string') return [];
 132:             const absolute = path.resolve(args[index]);
 133:             return absolute.startsWith(home + path.sep) ? [path.relative(home, absolute).replaceAll('\\\\', '/')] : [];
 134:           });
 135:           try {
 136:             if (method === 'writeFileSync' && typeof args[0] === 'string' && path.resolve(args[0]) === ${JSON.stringify(path.join(fixture.target, 'gsd-file-manifest.json'))}) {
 137:               throw new Error(${JSON.stringify(INJECTED)});
 138:             }
 139:             const result = original.apply(this, args);
 140:             if (paths.length) trace.push({ method, paths, completed: true });
 141:             return result;
 142:           } catch (error) {
 143:             if (paths.length) trace.push({ method, paths, completed: false });
 144:             throw error;
 145:           }
 146:         };
 147:       }
 148:       process.on('exit', () => write(${JSON.stringify(traceFile)}, JSON.stringify(trace)));
 149:     }
 150:   `);
 151:   return { preload, traceFile };
 152: }
 153: 
 154: function run(script, fixture, injection) {
 155:   const env = {
 156:     ...process.env, HOME: fixture.home, USERPROFILE: fixture.home,
 157:     GSD_HOME: path.join(fixture.home, '.gsd'), CLAUDE_CONFIG_DIR: fixture.target,
 158:     CODEX_HOME: path.join(fixture.home, '.codex'), XDG_CONFIG_HOME: path.join(fixture.home, '.config'),
 159:     TEMP: scratch, TMP: scratch,
 160:   };
 161:   for (const key of ['GSD_TEST_MODE', 'GSD_PROJECT_DIR', 'GSD_WORKSTREAM', 'NODE_OPTIONS', 'FORCE_COLOR']) delete env[key];
 162:   if (injection) env.NODE_OPTIONS = `--require ${JSON.stringify(injection.preload)}`;
 163:   const started = Date.now();
 164:   const result = spawnSync(process.execPath, [script, '--claude', '--global', '--config-dir', fixture.target], {
 165:     cwd: scratch, env, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024,
 166:   });
 167:   const output = `${result.stdout || ''}\n${result.stderr || ''}`.replace(ANSI, '');
 168:   return { result, output, started, finished: Date.now() };
 169: }
 170: 
 171: function readTrace(injection) {
 172:   return fs.existsSync(injection.traceFile) ? JSON.parse(fs.readFileSync(injection.traceFile, 'utf8')) : [];
 173: }
 174: 
 175: // Independent source for "exactly the residue": the same failure-injected child,
 176: // without the wrapper, against a twin fixture.
 177: function measureTwin() {
 178:   const scenario = 'twin';
 179:   const details = report[scenario] = {};
 180:   const twin = createFixture('twin');
 181:   const injection = writeInjection(twin);
 182:   const before = snapshotTree(twin.target);
 183:   const attempt = run(upstream, twin, injection);
 184:   harness(scenario, 'child-failed-at-injection', () => {
 185:     assert.equal(attempt.result.error, undefined);
 186:     assert.ok(attempt.output.includes(INJECTED), 'twin child never reached the injected write');
 187:     assert.notEqual(attempt.result.status, 0);
 188:   });
 189:   const after = snapshotTree(twin.target);
 190:   const residue = typesOnly(Object.fromEntries(Object.entries(after).filter(([name]) => !(name in before))));
 191:   report.context.twin = { residue };
 192:   const changed = Object.keys(before).filter(name => after[name] !== before[name]).sort();
 193:   // Files the trace saw the child write one by one. The child also places whole
 194:   // directories with fs.cpSync, which the trace cannot attribute to a file.
 195:   const prefix = `${path.relative(twin.home, twin.target).replaceAll('\\', '/')}/`;
 196:   const traced = new Set(readTrace(injection).filter(event => event.completed)
 197:     .flatMap(event => event.paths).filter(name => name.startsWith(prefix)).map(name => name.slice(prefix.length)));
 198:   const tracedFiles = Object.keys(residue).filter(name => residue[name] === 'file' && name.includes('/') && traced.has(name)).sort();
 199:   details.residueEntries = Object.keys(residue).length;
 200:   details.changed = changed;
 201:   details.tracedFiles = tracedFiles.length;
 202:   harness(scenario, 'residue-non-empty', () => assert.ok(Object.keys(residue).length > 0));
 203:   return { residue, changed, tracedFiles };
 204: }
 205: 
 206: function assertOutcome(scenario, details, attempt) {
 207:   accept(scenario, 'status-is-1', () => assert.equal(attempt.result.status, 1));
 208:   accept(scenario, 'outcome-exact', observe => {
 209:     const lines = attempt.output.split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith('Rollback '));
 210:     details.outcomeLines = lines;
 211:     observe('outcome-lines', { lines });
 212:     assert.equal(lines.length, 1, `expected one outcome line, saw ${JSON.stringify(lines)}`);
 213:     const match = OUTCOME.exec(lines[0]);
 214:     assert.ok(match, `outcome line is not the verified form: ${JSON.stringify(lines[0])}`);
 215:     const claimed = Date.parse(match[1]);
 216:     assert.ok(Number.isFinite(claimed), `pre-image time does not parse: ${match[1]}`);
 217:     assert.ok(claimed >= attempt.started - 1000 && claimed <= attempt.finished,
 218:       `pre-image time ${match[1]} is outside this run`);
 219:   });
 220: }
 221: 
 222: // Inside the transaction directory: only quarantine/<one id>/ with new/**, displaced/**
 223: // and moved.txt. No lock, journal, snapshot/ or anything else.
 224: function readQuarantine(scenario, details, fixture, attempt) {
 225:   const quarantine = { entries: {}, displaced: [], moved: '' };
 226:   accept(scenario, 'transaction-directory-shape', observe => {
 227:     const root = path.join(fixture.target, TRANSACTION_DIR);
 228:     let stat;
 229:     try {
 230:       stat = fs.lstatSync(root);
 231:     } catch (error) {
 232:       if (error.code !== 'ENOENT') throw error;
 233:       observe('transaction-state', { state: 'absent' });
 234:       assert.fail('transaction root is absent');
 235:     }
 236:     observe('transaction-state', { state: 'present' });
 237:     assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), 'transaction root is not a plain directory');
 238:     assert.deepEqual(fs.readdirSync(root).sort(), ['quarantine']);
 239:     const ids = fs.readdirSync(path.join(root, 'quarantine'));
 240:     assert.equal(ids.length, 1, `expected one transaction id, saw ${JSON.stringify(ids)}`);
 241:     const idDir = path.join(root, 'quarantine', ids[0]);
 242:     const names = fs.readdirSync(idDir).sort();
 243:     assert.deepEqual(names.filter(name => !['displaced', 'moved.txt', 'new'].includes(name)), []);
 244:     assert.ok(names.includes('new') && names.includes('moved.txt'), `saw ${JSON.stringify(names)}`);
 245:     quarantine.idDir = idDir;
 246:     quarantine.entries = typesOnly(snapshotTree(path.join(idDir, 'new')));
 247:     quarantine.moved = fs.readFileSync(path.join(idDir, 'moved.txt'), 'utf8');
 248:     if (names.includes('displaced')) {
 249:       const found = new Set();
 250:       for (const attemptName of fs.readdirSync(path.join(idDir, 'displaced'))) {
 251:         const tree = snapshotTree(path.join(idDir, 'displaced', attemptName));
 252:         for (const [name, value] of Object.entries(tree)) if (value !== 'dir') found.add(name);
 253:       }
 254:       quarantine.displaced = [...found].sort();
 255:     }
 256:     details.quarantinedEntries = Object.keys(quarantine.entries).length;
 257:     details.displaced = quarantine.displaced;
 258:   });
 259:   accept(scenario, 'quarantine-path-printed', observe => {
 260:     observe('quarantine-reference', { path: quarantine.idDir || null });
 261:     assert.ok(quarantine.idDir, 'no quarantine to name');
 262:     assert.ok(attempt.output.includes(quarantine.idDir), `output never names ${quarantine.idDir}`);
 263:   });
 264:   return quarantine;
 265: }
 266: 
 267: function assertMovedListsFiles(scenario, quarantine, expectedEntries) {
 268:   accept(scenario, 'moved-txt-lists-every-file', observe => {
 269:     const files = Object.keys(expectedEntries).filter(name => expectedEntries[name] === 'file').sort();
 270:     observe('moved-list', { expected: files, listed: quarantine.moved.split(/\r?\n/).filter(Boolean) });
 271:     const absent = files.filter(name => !quarantine.moved.includes(name));
 272:     assert.equal(absent.length, 0, `${absent.length} of ${files.length} absent, e.g. ${absent.slice(0, 4).join(', ')}`);
 273:   });
 274: }
 275: 
 276: function freshScenario(twin) {
 277:   const scenario = 'fresh';
 278:   const details = report[scenario] = {};
 279:   const fixture = createFixture('fresh');
 280:   const injection = writeInjection(fixture);
 281:   const attempt = run(wrapper, fixture, injection);
 282:   details.status = attempt.result.status;
 283:   details.traceCount = readTrace(injection).length;
 284:   harness(scenario, 'wrapper-child-failed-at-injection', () => {
 285:     assert.equal(attempt.result.error, undefined);
 286:     assert.ok(attempt.output.includes(INJECTED), 'child under the wrapper never reached the injected write');
 287:   });
 288: 
 289:   assertOutcome(scenario, details, attempt);
 290:   accept(scenario, 'top-level-exact-allowlist', observe => {
 291:     const names = fs.readdirSync(fixture.target).sort();
 292:     details.topLevelCount = names.length;
 293:     observe('top-level-names', { names });
 294:     assert.deepEqual(names, [...Object.keys(OWNER_FILES), TRANSACTION_DIR].sort());
 295:   });
 296:   accept(scenario, 'owner-bytes-preserved', () => {
 297:     for (const [file, content] of Object.entries(OWNER_FILES)) {
 298:       assert.equal(fs.readFileSync(path.join(fixture.target, file), 'utf8'), content, file);
 299:     }
 300:   });
 301:   const quarantine = readQuarantine(scenario, details, fixture, attempt);
 302:   accept(scenario, 'new-equals-twin-residue', observe => assertSameTree(quarantine.entries, twin.residue, 'new/ against twin', observe));
 303:   accept(scenario, 'displaced-equals-twin-changes', () => assert.deepEqual(quarantine.displaced, twin.changed));
 304:   assertMovedListsFiles(scenario, quarantine, twin.residue);
 305: }
 306: 
 307: function upgradeScenario(twin) {
 308:   const scenario = 'upgrade';
 309:   const details = report[scenario] = {};
 310:   const fixture = createFixture('upgrade');
 311:   const first = run(wrapper, fixture, null);
 312:   harness(scenario, 'first-install-succeeded', () => {
 313:     assert.equal(first.result.error, undefined);
 314:     assert.equal(first.result.status, 0, first.output.slice(-400));
 315:   });
 316: 
 317:   // Give the rollback real work: one installed file carries an owner edit (must come
 318:   // back byte-identical) and one is gone (its re-creation must be quarantined).
 319:   // Picked from what the twin's trace saw the child write, so the child is known to write both.
 320:   const written = twin.tracedFiles;
 321:   const edited = written[0];
 322:   const removed = written[written.length - 1];
 323:   harness(scenario, 'picked-files-installed', () => {
 324:     assert.ok(written.length >= 2, `saw ${written.length}`);
 325:     for (const name of [edited, removed]) assert.ok(fs.existsSync(path.join(fixture.target, name)), name);
 326:   });
 327:   fs.appendFileSync(path.join(fixture.target, edited), '\nowner edit made before the failed upgrade\n');
 328:   fs.unlinkSync(path.join(fixture.target, removed));
 329:   details.edited = edited;
 330:   details.removed = removed;
 331:   report.context.upgrade = { edited, removed };
 332:   const before = without(snapshotTree(fixture.target), TRANSACTION_DIR);
 333: 
 334:   const injection = writeInjection(fixture);
 335:   const attempt = run(wrapper, fixture, injection);
 336:   details.status = attempt.result.status;
 337:   const trace = readTrace(injection);
 338:   details.traceCount = trace.length;
 339:   harness(scenario, 'wrapper-child-failed-at-injection', () => {
 340:     assert.equal(attempt.result.error, undefined);
 341:     assert.ok(attempt.output.includes(INJECTED), 'child under the wrapper never reached the injected write');
 342:   });
 343:   // The trace is a lower bound, so a hit is proof the rollback had both jobs to do.
 344:   harness(scenario, 'child-rewrote-picked-files', () => {
 345:     const prefix = path.relative(fixture.home, fixture.target).replaceAll('\\', '/');
 346:     const completed = new Set(trace.filter(event => event.completed).flatMap(event => event.paths));
 347:     for (const name of [edited, removed]) assert.ok(completed.has(`${prefix}/${name}`), `child never wrote ${name}`);
 348:   });
 349: 
 350:   assertOutcome(scenario, details, attempt);
 351:   accept(scenario, 'owner-bytes-preserved', () => {
 352:     const after = snapshotTree(fixture.target);
 353:     for (const name of [...Object.keys(OWNER_FILES), edited]) {
 354:       assert.ok(before[name]?.startsWith('file:'), `no owner pre-image: ${name}`);
 355:       assert.equal(after[name], before[name], `owner bytes changed: ${name}`);
 356:     }
 357:     assert.equal(Object.hasOwn(after, removed), false, `owner-removed entry reappeared: ${removed}`);
 358:   });
 359:   accept(scenario, 'tree-deep-equal-outside-allowlist', observe => {
 360:     assertSameTree(without(snapshotTree(fixture.target), TRANSACTION_DIR), before, 'after against before', observe);
 361:   });
 362:   const quarantine = readQuarantine(scenario, details, fixture, attempt);
 363:   accept(scenario, 'removed-file-quarantined-as-new', observe => {
 364:     observe('entry-type', { path: removed, type: quarantine.entries[removed] || null });
 365:     assert.equal(quarantine.entries[removed], 'file');
 366:   });
 367:   accept(scenario, 'edited-file-displaced', observe => {
 368:     observe('displaced-paths', { paths: [...quarantine.displaced].sort() });
 369:     assert.ok(quarantine.displaced.includes(edited), JSON.stringify(quarantine.displaced.slice(0, 6)));
 370:   });
 371:   assertMovedListsFiles(scenario, quarantine, { [removed]: 'file' });
 372: }
 373: 
 374: try {
 375:   assert.ok(fs.existsSync(upstream), 'compose the candidate before running acceptance');
 376:   report.sourceHashes = Object.fromEntries(['bin/install.js', 'dist/bin/install.js', 'tests/acceptance/installer-recovery.cjs'].map(name => [
 377:     name, digestOf(fs.readFileSync(path.join(project, name))),
 378:   ]));
 379:   const guarded = fn => {
 380:     try {
 381:       return fn();
 382:     } catch (error) {
 383:       if (!(error instanceof ScenarioAborted)) throw error;
 384:       return undefined;
 385:     }
 386:   };
 387:   const twin = guarded(measureTwin);
 388:   if (twin) for (const scenario of [freshScenario, upgradeScenario]) guarded(() => scenario(twin));
 389:   const failed = report.checks.filter(check => !check.ok);
 390:   report.accepted = failed.length === 0;
 391:   if (failed.length) report.failure = failed.map(check => `${check.scenario}:${check.id}`).join(', ');
 392: } catch (error) {
 393:   report.harnessError = error.message;
 394: } finally {
 395:   if (!report.accepted) process.exitCode = 1;
 396:   // Only delete this invocation's generated fixture inside this checkout.
 397:   assert.equal(path.dirname(path.resolve(scratch)), path.resolve(scratchParent));
 398:   assert.ok(path.basename(scratch).startsWith('installer-recovery-'));
 399:   fs.rmSync(scratch, { recursive: true, force: true });
 400:   report.fixtureRemoved = !fs.existsSync(scratch);
 401:   process.stdout.write(JSON.stringify(report, null, 2) + os.EOL);
 402: }
END SOURCE tests/acceptance/installer-recovery.cjs

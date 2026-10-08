# Independent review: P03 expected-red validator API and proof contract

Read-only, packet-only review. Do not use tools or change files. Return PASS / PASS WITH CHANGES / NOT PASS with severity, concrete counterexample and smallest correction. Limit response to 1600 words. Identify anything the packet cannot establish.

Context: Owner is completing a reduced Open-GSD skin, fixed endpoint1.12.0, with a currently unsafe, unwired installer-transaction lock. Worktree skin-campaign at e50bda5b. User accepted repair policies but requires exact seam argument/return approval before RED tests. The pending P03 contract below is PROPOSED, not implemented; no user answer yet. P03 repairs false-green expected-red validators before lock repair. Do not treat passing baseline lock tests as safety acceptance.

Current scripts/expect-red.cjs silently collapses duplicate recovery checks, checks only seven harness passes and five signature failures, ignores extra acceptance failures, accepts any unimplemented operation from TAP, and only looks for textual coverage errors. Baseline Node24.20 Windows: recovery24 checks (11pass13fail); transaction51 cases (41pass10 renderOutcome failures), c8 both files100 all metrics. CI gate runtime Node22, three OSes, not yet measured because latest jobs all have zero steps. Scope only existing validator, its Bun test and fixtures; no new dependency, module, package/workflow change, installer edit or real-home tests. Pure judges currently return string[]; main returns integer exit codes.

Reviewer focus:
1. Can this contract still accept missing, contradictory, stale or wrong-source evidence? Give actual acceptance path, not generic warnings.
2. Are API shapes/failure outcomes complete and implementable without hidden I/O or new dependencies? Include cleanup and malformed-input cases.
3. Could exact TAP/metric rules reject legitimate Node22/24 or Windows/Linux/macOS output? Distinguish measured incompatibility from a needed native test.
4. Does the test plan independently falsify gates, preserve TDD and avoid moving expected failures to hide regressions?
5. Prefer bounded corrections. Do not expand into redesigning locks or completing the installer. Do not request source changes outside the allowlist without explaining the smallest extension.
## 12. P03 concrete validator contract for owner approval

Status: PROPOSED, not approved. Scope stays `scripts/expect-red.cjs`,
`tests/expect-red.test.js`, `tests/fixtures/expect-red/`. No new dependency, product
port, workflow change, package-script edit or installer change. The following is
the precise contract to approve before writing RED controls.

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


## Current validator source

'use strict';

// Holds a gate in expected-red mode while its fix is built test-first. The gate still
// runs on every platform, and this wrapper passes only when it fails for the KNOWN
// reason. An unexpected pass fails, and so does a red for any other reason (a missing
// compose, a fixture that never reached its injection). Remove a gate's entry, and
// call the gate directly, when its fix lands.
// Plan: docs/plans/features/installer-transaction.md, Steps 1, 2 and 5.
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const INSTALLER_RECOVERY_HARNESS = [
  'twin:child-failed-at-injection',
  'twin:residue-non-empty',
  'fresh:wrapper-child-failed-at-injection',
  'upgrade:first-install-succeeded',
  'upgrade:picked-files-installed',
  'upgrade:wrapper-child-failed-at-injection',
  'upgrade:child-rewrote-picked-files',
];

const INSTALLER_RECOVERY_SIGNATURE = [
  'fresh:outcome-exact',
  'fresh:top-level-exact-allowlist',
  'fresh:transaction-directory-shape',
  'upgrade:outcome-exact',
  'upgrade:transaction-directory-shape',
];

function keyOf(check) {
  return `${check.scenario}:${check.id}`;
}

function linesOf(text) {
  return String(text || '').split(/\r?\n/);
}

// The installer leaves the child's files in the target and prints an unverified
// "Rollback applied" (blocker 1). Those two failures, in both scenarios, are the red.
function judgeInstallerRecovery(run) {
  let report;
  try {
    report = JSON.parse(run.stdout);
  } catch {
    return [`no JSON report on stdout: ${String(run.stderr || run.stdout).slice(0, 300)}`];
  }
  if (run.status === 0 || report.accepted === true) {
    return ['UNEXPECTED PASS: the gate is green. Remove its expect-red entry and run it as a plain gate (plan Step 5).'];
  }
  const problems = [];
  if (run.status !== 1) problems.push(`exit status ${run.status}, expected 1`);
  if (report.harnessError) problems.push(`harness error: ${report.harnessError}`);
  const checks = new Map((report.checks || []).map(check => [keyOf(check), check]));
  for (const key of INSTALLER_RECOVERY_HARNESS) {
    if (!checks.get(key)?.ok) problems.push(`harness check did not pass: ${key}`);
  }
  for (const check of checks.values()) {
    if (check.kind === 'harness' && !check.ok) problems.push(`harness check failed: ${keyOf(check)}: ${check.detail}`);
  }
  for (const key of INSTALLER_RECOVERY_SIGNATURE) {
    if (checks.get(key)?.ok !== false) problems.push(`known failure absent: ${key}`);
  }
  return [...new Set(problems)];
}

// The transaction module is a skeleton: the only acceptable failure is a case that
// reaches an operation whose seam has not landed. A case failing any other way, a
// coverage shortfall on what HAS landed, or a run with nothing failing is the wrong red.
function judgeInstallTransactionCoverage(run) {
  const lines = linesOf(run.stdout);
  const count = label => Number(lines.find(line => line.startsWith(`# ${label} `))?.slice(label.length + 3));
  const failed = count('fail');
  if (!Number.isInteger(failed) || !Number.isInteger(count('pass'))) {
    return [`no TAP summary on stdout: ${String(run.stderr || run.stdout).slice(0, 300)}`];
  }
  if (run.status === 0 || failed === 0) {
    return ['UNEXPECTED PASS: no case fails. Remove this expect-red entry and run the gate as a plain gate (plan Step 5).'];
  }
  const problems = [];
  if (run.status !== 1) problems.push(`exit status ${run.status}, expected 1`);
  const starts = lines.flatMap((line, index) => (/^(not )?ok \d+ - /.test(line) ? [index] : []));
  const failures = starts.filter(index => lines[index].startsWith('not ok '));
  if (failures.length !== failed) problems.push(`summary reports ${failed} failures, ${failures.length} found`);
  for (const index of failures) {
    const end = starts.find(start => start > index) ?? lines.length;
    const error = lines.slice(index, end).find(line => line.trimStart().startsWith('error:'));
    if (!/^\s+error: 'not implemented: [A-Za-z]+'$/.test(error || '')) {
      problems.push(`failed for another reason: ${lines[index].replace(/^not ok \d+ - /, '')}`);
    }
  }
  for (const line of [...linesOf(run.stderr), ...lines]) {
    if (line.includes('ERROR: Coverage')) problems.push(line.trim());
  }
  return problems;
}

const KNOWN_REDS = {
  'installer-recovery': { script: 'test:acceptance:installer-recovery', judge: judgeInstallerRecovery },
  'install-transaction-coverage': { script: 'test:coverage:install-transaction', judge: judgeInstallTransactionCoverage },
};

// The command comes from package.json so this wrapper and the package script cannot drift.
// Package scripts quote glob-like arguments for the shell; no shell runs here.
function commandFor(gate, packageJson) {
  const command = packageJson.scripts?.[gate.script];
  if (typeof command !== 'string' || !command.startsWith('node ')) {
    throw new Error(`package script ${gate.script} must be a plain "node <file>" command, saw ${JSON.stringify(command)}`);
  }
  return command.split(' ').slice(1).map(argument => argument.replace(/^'(.*)'$/, '$1'));
}

function main(args = process.argv.slice(2), dependencies = {}) {
  const spawn = dependencies.spawnSync || spawnSync;
  const packageJson = dependencies.packageJson || require(path.join(PROJECT_ROOT, 'package.json'));
  const log = dependencies.log || (message => process.stderr.write(`${message}\n`));
  const gate = Object.hasOwn(KNOWN_REDS, args[0]) ? KNOWN_REDS[args[0]] : undefined;
  if (args.length !== 1 || !gate) {
    log(`Usage: node scripts/expect-red.cjs <${Object.keys(KNOWN_REDS).join('|')}>`);
    return 2;
  }
  const run = spawn(process.execPath, commandFor(gate, packageJson), {
    cwd: PROJECT_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (run.error) {
    log(`expect-red ${args[0]}: could not run the gate: ${run.error.message}`);
    return 1;
  }
  // The gate's own report is the per-platform evidence, so it is printed either way.
  log(run.stdout);
  const problems = gate.judge(run);
  if (problems.length) {
    log(`expect-red ${args[0]}: NOT the known red`);
    for (const problem of problems) log(`  - ${problem}`);
    return 1;
  }
  log(`expect-red ${args[0]}: failed for the known reason, as expected until the fix lands`);
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  INSTALLER_RECOVERY_HARNESS,
  INSTALLER_RECOVERY_SIGNATURE,
  KNOWN_REDS,
  commandFor,
  judgeInstallTransactionCoverage,
  judgeInstallerRecovery,
  main,
};

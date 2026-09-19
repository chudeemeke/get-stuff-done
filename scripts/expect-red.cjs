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

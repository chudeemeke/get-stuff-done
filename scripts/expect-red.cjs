'use strict';

// Holds a gate in expected-red mode while its fix is built test-first. The gate still
// runs on every platform, and this wrapper passes only when it fails for the KNOWN
// reason. An unexpected pass fails, and so does a red for any other reason (a missing
// compose, a fixture that never reached its injection). Remove a gate's entry, and
// call the gate directly, when its fix lands.
// Plan: docs/plans/features/installer-transaction.md, Steps 1, 2 and 5.
const path = require('path');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { spawnSync } = require('child_process');
const { isDeepStrictEqual } = require('node:util');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RECOVERY_SOURCES = ['bin/install.js', 'dist/bin/install.js', 'tests/acceptance/installer-recovery.cjs'];
const COVERAGE_SOURCES = ['bin/lib/install-names.js', 'bin/lib/install-transaction.js',
  'tests/coverage/install-transaction.test.cjs', 'tests/helpers/fault-fs.cjs'];

// Reviewed 2026-09-19: the first 41 cases pass; only the ten render cases fail.
// Fixed policy, not inferred from a candidate run or loaded from a mutable report.
const COVERAGE_CASES = [
  "names: the four classes match the accepted table exactly",
  "names: the table cannot be changed by a consumer",
  "names: no name belongs to two classes, so a root is never also protected",
  "names: the module requires nothing, so cleanup never loads the transaction to read names",
  "comparison keys: stored names are kept on linux, case folds on win32, case and NFC fold on darwin",
  "comparison keys: an unknown platform keeps stored names, like linux",
  "protected names: exact names and both generated families are recognised",
  "protected names: near misses are owner names, not protected ones",
  "protected names: a case variant is the same directory on win32 and darwin, a different one on linux",
  "transaction: the module exposes one factory and the sixteen planned operations",
  "lock: acquiring writes the pid and creation time, and releasing removes the file",
  "lock: it is published whole by a link from a finished temp file, never written in place",
  "lock: releasing never deletes a lock that now names another installer",
  "lock: a holder that is alive refuses with the exact instruction and touches nothing",
  "lock: a holder that is alive but owned by another user (EPERM) refuses with the exact instruction and touches nothing",
  "lock: a holder that is undecidable (an unexpected error) refuses with the exact instruction and touches nothing",
  "lock: a holder that is dead is taken over, and no stale file is left behind",
  "lock: a lock file that is empty cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is not JSON cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is missing its pid cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is carrying a pid that is not a positive integer cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is carrying pid 0, which a probe would read as the whole process group cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is missing its creation time cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is JSON null cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is a JSON array cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is carrying a creation time that is not a string cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is carrying a creation time that is not a date cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock file that is carrying a creation time that is not a full UTC instant cannot prove its holder dead, so it refuses without a pid or a time",
  "lock: a lock path that is a directory cannot be read, so it refuses and leaves it alone",
  "lock race: a rival that renames the stale lock first wins, and this run refuses leaving only what the rival made",
  "lock race: a rename that moved a rival live lock, not the dead one, puts it back and refuses",
  "lock race: when a third run takes the lock before the rival lock can be put back, the third lock stands",
  "lock race: winning the rename but losing the publish to another run refuses, and that run keeps the lock",
  "lock race: a holder that releases between the refused publish and the read is a changed hand, not a crash",
  "lock: an absent target is refused and is not created",
  "lock: a temp name that already exists belongs to someone else, so it refuses and does not delete it",
  "lock: a filesystem that cannot link refuses, with no fallback to a lock written in place",
  "lock: a stale lock that cannot be renamed refuses and stays where it is",
  "lock: a temp file that cannot be removed does not undo the lock, and its name is a protected one",
  "lock: a release that cannot delete the file does not throw; the lock then names a dead pid and is taken over",
  "lock: with no ports it uses this process, the real clock and the real liveness probe",
  "render: a verified rollback exits 1 with the exact claim",
  "render: top-level names that came or went are reported, left untouched, and exit 3",
  "render: every rollback outcome names what was quarantined and where the full list is",
  "render: an incomplete rollback exits 4, lists each entry with its reason, names the retired path, gives one instruction",
  "render: a verified recovery exits 5 whatever the top-level names did, and asks for a re-run",
  "render: a recovery whose rollback is incomplete exits 4, not 5",
  "render: a refusal exits 6 and argument misuse exits 2, each with only its message",
  "render: the child exit code or signal is printed and never becomes the exit code",
  "render: a committed install exits 0, and still exits 0 with a warning when snapshot/ could not be deleted",
  "render: the notice about a retired transaction is repeated in every outcome until the owner deletes it",
];

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

// Safety checks are never permitted failures, independently of the interim RED.
const RECOVERY_REQUIRED_PASS = [
  ...INSTALLER_RECOVERY_HARNESS,
  'fresh:status-is-1', 'fresh:owner-bytes-preserved', 'fresh:displaced-equals-twin-changes',
  'upgrade:status-is-1', 'upgrade:owner-bytes-preserved',
  'fresh:home-outside-target-preserved', 'upgrade:home-outside-target-preserved',
];
const RECOVERY_REQUIRED_FAIL = [
  ...INSTALLER_RECOVERY_SIGNATURE,
  'fresh:quarantine-path-printed', 'fresh:new-equals-twin-residue', 'fresh:moved-txt-lists-every-file',
  'upgrade:tree-deep-equal-outside-allowlist', 'upgrade:quarantine-path-printed',
  'upgrade:removed-file-quarantined-as-new', 'upgrade:edited-file-displaced', 'upgrade:moved-txt-lists-every-file',
];
const RECOVERY_RESIDUE_ROOTS = {
  '.gsd-source': 'file', agents: 'dir', 'gsd-core': 'dir', 'gsd-migration-journal': 'dir',
  hooks: 'dir', 'package.json': 'file', scripts: 'dir', skills: 'dir',
};

function keyOf(check) {
  return `${check.scenario}:${check.id}`;
}

function linesOf(text) {
  return String(text || '').split(/\r?\n/);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasKeys(value, keys) {
  return isObject(value) && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort());
}

function validRecoveryContext(context, platform) {
  if (!hasKeys(context, ['twin', 'upgrade']) || !hasKeys(context.twin, ['residue']) ||
      !hasKeys(context.upgrade, ['edited', 'removed']) || !isObject(context.twin.residue)) return false;
  const relativeName = name => typeof name === 'string' && name.length > 0 &&
    !/[\\:\x00-\x1f]/.test(name) && name.split('/').every(segment =>
      segment !== '' && segment !== '.' && segment !== '..' &&
      (platform !== 'win32' || !/[. ]$/.test(segment)));
  const identity = name => platform === 'darwin' ? name.normalize('NFC').toLowerCase()
    : platform === 'win32' ? name.toLowerCase() : name;
  const entries = Object.entries(context.twin.residue);
  if (!entries.length || !entries.some(([, type]) => type === 'file')) return false;
  if (!isDeepStrictEqual(Object.fromEntries(entries.filter(([name]) => !name.includes('/'))), RECOVERY_RESIDUE_ROOTS)) return false;
  const seen = new Set();
  for (const [name, type] of entries) {
    if (!relativeName(name) || !['file', 'dir', 'link'].includes(type) || seen.has(identity(name))) return false;
    seen.add(identity(name));
  }
  const { edited, removed } = context.upgrade;
  return relativeName(edited) && relativeName(removed) && identity(edited) !== identity(removed);
}

function recoveryObservation(check, context) {
  if (RECOVERY_REQUIRED_PASS.includes(keyOf(check))) return { kind: 'assertion-pass', actual: {} };
  // The complete context is validated before any observation is compared.
  const residue = context.twin.residue;
  switch (check.id) {
    case 'outcome-exact':
      return { kind: 'outcome-lines', actual: { lines: ['Rollback applied'] } };
    case 'top-level-exact-allowlist':
      return { kind: 'top-level-names', actual: { names: [
        '.gsd-source', 'agents', 'gsd-core', 'gsd-migration-journal', 'hooks',
        'owner.txt', 'package.json', 'scripts', 'settings.json', 'skills',
      ] } };
    case 'transaction-directory-shape':
      return { kind: 'transaction-state', actual: { state: 'absent' } };
    case 'quarantine-path-printed':
      return { kind: 'quarantine-reference', actual: { path: null } };
    case 'new-equals-twin-residue':
      return { kind: 'tree-delta', actual: { missing: Object.keys(residue).sort(), unexpected: [], changed: [] } };
    case 'tree-deep-equal-outside-allowlist':
      return { kind: 'tree-delta', actual: { missing: [], unexpected: [], changed: ['gsd-install-state.json'] } };
    case 'removed-file-quarantined-as-new':
      return { kind: 'entry-type', actual: { path: context.upgrade.removed, type: null } };
    case 'edited-file-displaced':
      return { kind: 'displaced-paths', actual: { paths: [] } };
    case 'moved-txt-lists-every-file':
      return { kind: 'moved-list', actual: {
        expected: check.scenario === 'fresh'
          ? Object.keys(residue).filter(name => residue[name] === 'file').sort()
          : [context.upgrade.removed],
        listed: [],
      } };
    default:
      return undefined;
  }
}

function validHomeObservation(evidence, platform) {
  if (!hasKeys(evidence, ['kind', 'actual']) || evidence.kind !== 'home-state' ||
      !hasKeys(evidence.actual, ['before', 'after'])) return false;
  const { before: beforeState, after: afterState } = evidence.actual;
  const identity = name => platform === 'darwin' ? name.normalize('NFC').toLowerCase()
    : platform === 'win32' ? name.toLowerCase() : name;
  for (const state of [beforeState, afterState]) {
    if (!isObject(state)) return false;
    const tree = new Map(Object.entries(state));
    const seen = new Set();
    for (const [name, value] of tree) {
      const segments = name.split('/');
      if (!name || /[\\:\x00-\x1f]/.test(name) || segments.some(segment =>
        !segment || segment === '.' || segment === '..' ||
        (platform === 'win32' && (/[. ]$/.test(segment) || /[<>"|?*]/.test(segment) ||
          /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment)))) ||
        identity(segments[0]) === identity('runtime with spaces') || seen.has(identity(name))) return false;
      seen.add(identity(name));
      if (typeof value !== 'string' || !(value === 'dir' || /^file:[a-f0-9]{64}$/.test(value) ||
        (value.startsWith('link:') && value.length > 5 && !value.includes('\0')))) return false;
      for (let length = 1; length < segments.length; length++) {
        const parent = segments.slice(0, length).join('/');
        if (tree.get(parent) !== 'dir') return false;
      }
    }
  }
  const before = new Map(Object.entries(beforeState));
  const after = new Map(Object.entries(afterState));
  const ownerFiles = {
    '.gsd/owner.json': '{"owner":"gsd home"}\n', '.codex/owner.txt': 'codex owner bytes\n',
    '.config/owner.txt': 'config owner bytes\n', 'AppData/Roaming/owner.txt': 'roaming owner bytes\n',
    'AppData/Local/owner.txt': 'local owner bytes\n',
  };
  for (const [name, bytes] of Object.entries(ownerFiles)) {
    if (before.get(name) !== `file:${createHash('sha256').update(bytes).digest('hex')}`) return false;
  }
  for (const name of ['other-owner/empty', '.cache', '.local/share']) if (before.get(name) !== 'dir') return false;
  const directories = new Set(['AppData/Local/Microsoft', 'AppData/Local/Microsoft/Windows',
    'AppData/Local/Microsoft/Windows/Caches', 'AppData/Local/Microsoft/Windows/PowerShell']);
  const runtimeFile = 'AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive';
  for (const name of new Set([...before.keys(), ...after.keys()])) {
    if (platform === 'win32' && directories.has(name)) {
      if (after.get(name) !== 'dir' || (before.has(name) && before.get(name) !== 'dir')) return false;
    } else if (platform === 'win32' && name === runtimeFile) {
      if (!/^file:[a-f0-9]{64}$/.test(after.get(name)) ||
        (before.has(name) && !/^file:[a-f0-9]{64}$/.test(before.get(name)))) return false;
    } else if (before.get(name) !== after.get(name)) return false;
  }
  return true;
}

// The installer leaves the child's files in the target and prints an unverified
// "Rollback applied" (blocker 1). Those two failures, in both scenarios, are the red.
function judgeInstallerRecovery(run, evidence) {
  if (!isObject(run) || typeof run.stdout !== 'string' || typeof run.stderr !== 'string') {
    return ['malformed run: stdout and stderr must be strings'];
  }
  if (run.error !== undefined || (run.signal !== undefined && run.signal !== null)) {
    return ['run has failure or malformed termination evidence'];
  }
  let report;
  try {
    report = JSON.parse(run.stdout);
  } catch {
    return [`no JSON report on stdout: ${String(run.stderr || run.stdout).slice(0, 300)}`];
  }
  if (!isObject(report)) return ['recovery report must be an object'];
  if (run.status === 0 || report.accepted === true) {
    return ['UNEXPECTED PASS: the gate is green. Remove its expect-red entry and run it as a plain gate (plan Step 5).'];
  }
  const problems = [];
  if (run.status !== 1) problems.push(`exit status ${run.status}, expected 1`);
  if (report.accepted !== false) problems.push('report must explicitly declare accepted: false');
  if (report.fixtureRemoved !== true) problems.push('fixture cleanup was not confirmed');
  if (report.harnessError) problems.push(`harness error: ${report.harnessError}`);
  const host = evidence?.host;
  if (!isObject(host) || !['win32', 'linux', 'darwin'].includes(host.platform) ||
      typeof host.nodeVersion !== 'string' || !/^v\d+\.\d+\.\d+$/.test(host.nodeVersion) ||
      report.platform !== host.platform || report.node !== host.nodeVersion) {
    problems.push('missing or mismatched host/runtime evidence');
  }
  if (!hasKeys(evidence?.sourceHashes, RECOVERY_SOURCES) || !hasKeys(report.sourceHashes, RECOVERY_SOURCES)) {
    problems.push('missing or unreviewed source identities');
  } else {
    for (const name of RECOVERY_SOURCES) {
      const digest = evidence.sourceHashes[name];
      if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest) || report.sourceHashes[name] !== digest) {
        problems.push(`missing, malformed or mismatched source digest: ${name}`);
      }
    }
  }
  if (!Array.isArray(report.checks)) return [...problems, 'checks must be an array'];
  const validContext = validRecoveryContext(report.context, report.platform);
  if (!validContext) problems.push('invalid independent recovery context');
  const checks = new Map();
  const expectedKeys = new Set([...RECOVERY_REQUIRED_PASS, ...RECOVERY_REQUIRED_FAIL]);
  for (const check of report.checks) {
    if (!isObject(check) || typeof check.scenario !== 'string' || typeof check.id !== 'string') {
      problems.push('malformed check identity');
      continue;
    }
    const key = keyOf(check);
    if (typeof check.ok !== 'boolean') problems.push(`check status must be boolean: ${key}`);
    if (check.ok === false && (typeof check.detail !== 'string' || !check.detail.trim())) {
      problems.push(`failed check has no diagnostic: ${key}`);
    }
    if (check.ok === true && Object.hasOwn(check, 'detail')) problems.push(`passing check has a failure detail: ${key}`);
    if (checks.has(key)) problems.push(`duplicate check: ${key}`);
    if (!expectedKeys.has(key)) problems.push(`unreviewed check: ${key}`);
    const expectedKind = INSTALLER_RECOVERY_HARNESS.includes(key) ? 'harness' : 'acceptance';
    if (check.kind !== expectedKind) problems.push(`wrong check kind: ${key}`);
    if (check.id === 'home-outside-target-preserved'
      ? !validHomeObservation(check.evidence, report.platform)
      : validContext && !isDeepStrictEqual(check.evidence, recoveryObservation(check, report.context))) {
      problems.push(`unexpected or incomplete observation: ${key}`);
    }
    checks.set(key, check);
  }
  const failedKeys = [...checks.values()].filter(check => check.ok === false).map(keyOf).sort();
  const declaredFailures = typeof report.failure === 'string' ? report.failure.split(',').map(key => key.trim()).sort() : [];
  if (!isDeepStrictEqual(declaredFailures, failedKeys)) problems.push('failure inventory does not match failed checks');
  for (const key of INSTALLER_RECOVERY_HARNESS) {
    if (!checks.get(key)?.ok) problems.push(`harness check did not pass: ${key}`);
  }
  for (const check of checks.values()) {
    if (check.kind === 'harness' && !check.ok) problems.push(`harness check failed: ${keyOf(check)}: ${check.detail}`);
  }
  for (const key of RECOVERY_REQUIRED_FAIL) {
    if (checks.get(key)?.ok !== false) problems.push(`known failure absent: ${key}`);
  }
  for (const key of RECOVERY_REQUIRED_PASS) {
    // Enforce safety independently: even adding this row to REQUIRED_FAIL cannot
    // make a failed safety check acceptable. Conflicting lists cannot both pass.
    if (checks.get(key)?.ok !== true) problems.push(`required preservation check did not pass: ${key}`);
  }
  return [...new Set(problems)];
}

function tapFramingProblems(lines) {
  const bad = message => [`invalid TAP framing: ${message}`];
  if (lines[0] !== 'TAP version 13') return bad('missing initial version');
  let cursor = 1;
  for (const [offset, name] of COVERAGE_CASES.entries()) {
    if (lines[cursor]?.startsWith('# Subtest: ')) {
      if (lines[cursor++] !== `# Subtest: ${name}`) return bad('unreviewed subtest');
    }
    const result = `${offset < 41 ? 'ok' : 'not ok'} ${offset + 1} - ${name}`;
    if (lines[cursor++] !== result) return bad('unexpected case or result');
    if (lines[cursor++] !== '  ---') return bad('missing diagnostic start');
    const fields = new Map();
    while (cursor < lines.length && lines[cursor] !== '  ...') {
      const line = lines[cursor++];
      if (!line.startsWith('  ')) return bad('unterminated diagnostic block');
      const field = /^  ([A-Za-z_]+):\s*(.*)$/.exec(line);
      if (field) {
        if (fields.has(field[1])) return bad(`duplicate diagnostic field: ${field[1]}`);
        fields.set(field[1], field[2]);
      }
    }
    if (lines[cursor++] !== '  ...') return bad('unterminated diagnostic block');
    if (offset >= 41 && (fields.get('failureType') !== "'testCodeFailure'" ||
        fields.get('code') !== "'ERR_TEST_FAILURE'")) return bad('wrong failure type or code');
    if (offset >= 41 && fields.get('error') !== "'not implemented: renderOutcome'") {
      return [`failed for another reason: ${name}`];
    }
    if (offset < 41 && ['error', 'failureType', 'code'].some(key => fields.has(key))) {
      return bad('passing case contains a failure');
    }
  }
  const terminal = ['1..51', '# tests 51', '# suites 0', '# pass 41', '# fail 10',
    '# cancelled 0', '# skipped 0', '# todo 0'];
  for (const line of terminal) if (lines[cursor++] !== line) return bad(`missing terminal ${line}`);
  if (lines[cursor]?.startsWith('# duration_ms ')) {
    if (!/^# duration_ms \d+(\.\d+)?$/.test(lines[cursor++])) return bad('invalid duration');
  }
  // c8's presentation table is ancillary; all numeric coverage comes from JSON.
  for (const line of lines.slice(cursor)) {
    if (/^\s*(TAP version|(?:not )?ok \d+|1\.\.|# |Bail out!)/.test(line)) return bad('TAP token after terminal summary');
    if (line && !line.includes('|') && !line.startsWith('ERROR: Coverage')) return bad('unexpected trailing output');
  }
  return [];
}

function coverageEvidenceProblems(evidence) {
  const platform = evidence?.host?.platform;
  if (!['win32', 'linux', 'darwin'].includes(platform) || typeof evidence?.projectRoot !== 'string' ||
      !isObject(evidence.coverageSummary)) return ['missing or malformed coverage evidence'];
  const paths = platform === 'win32' ? path.win32 : path.posix;
  if (!paths.isAbsolute(evidence.projectRoot)) return ['coverage project root must be absolute'];
  const identity = name => {
    const normalized = paths.normalize(name);
    return platform === 'win32' ? normalized.toLowerCase()
      : platform === 'darwin' ? normalized.normalize('NFC').toLowerCase() : normalized;
  };
  const expected = ['bin/lib/install-names.js', 'bin/lib/install-transaction.js']
    .map(name => identity(paths.join(evidence.projectRoot, name)));
  const tables = new Map();
  for (const [name, table] of Object.entries(evidence.coverageSummary)) {
    const spelling = platform === 'win32' ? name.replaceAll('/', '\\') : name;
    if (spelling !== paths.normalize(spelling)) return [`noncanonical coverage file alias: ${name}`];
    const key = name === 'total' ? name : identity(name);
    if (name !== 'total' && (!paths.isAbsolute(name) || !expected.includes(key))) {
      return [`unreviewed coverage file: ${name}`];
    }
    if (tables.has(key)) return [`duplicate coverage file identity: ${name}`];
    tables.set(key, table);
  }
  if (tables.size !== 3 || !tables.has('total') || expected.some(name => !tables.has(name))) {
    return ['coverage must include total and both reviewed files'];
  }
  const metrics = ['lines', 'statements', 'functions', 'branches'];
  const problems = [];
  for (const [name, table] of tables) {
    if (!isObject(table) || Object.keys(table).some(key => ![...metrics, 'branchesTrue'].includes(key))) {
      problems.push(`malformed coverage table: ${name}`);
      continue;
    }
    for (const metric of metrics) {
      const value = table[metric];
      if (!hasKeys(value, ['total', 'covered', 'skipped', 'pct']) ||
          !Number.isSafeInteger(value.total) || value.total <= 0 || value.covered !== value.total ||
          value.skipped !== 0 || value.pct !== 100) {
        problems.push(`coverage must be complete and 100%: ${name} ${metric}`);
      }
    }
  }
  if (!problems.length) {
    for (const metric of metrics) {
      for (const count of ['total', 'covered', 'skipped']) {
        const sum = expected.reduce((total, name) => total + tables.get(name)[metric][count], 0);
        if (tables.get('total')[metric][count] !== sum) problems.push(`coverage aggregate mismatch: ${metric} ${count}`);
      }
    }
  }
  return problems;
}

// Only the ten reviewed render cases remain unimplemented. Every landed case and
// the complete TAP envelope must still pass; coverage evidence is a separate proof.
function judgeInstallTransactionCoverage(run, evidence) {
  if (!isObject(run) || typeof run.stdout !== 'string' || typeof run.stderr !== 'string') {
    return ['malformed run: stdout and stderr must be strings'];
  }
  if (run.error !== undefined || (run.signal !== undefined && run.signal !== null)) {
    return ['run has failure or malformed termination evidence'];
  }
  const lines = linesOf(run.stdout);
  const framingProblems = tapFramingProblems(lines);
  const count = label => Number(lines.find(line => line.startsWith(`# ${label} `))?.slice(label.length + 3));
  const failed = count('fail');
  if (!Number.isInteger(failed) || !Number.isInteger(count('pass'))) {
    return [`no TAP summary on stdout: ${String(run.stderr || run.stdout).slice(0, 300)}`];
  }
  if (run.status === 0 || failed === 0) {
    return ['UNEXPECTED PASS: no case fails. Remove this expect-red entry and run the gate as a plain gate (plan Step 5).'];
  }
  const problems = [];
  problems.push(...coverageEvidenceProblems(evidence));
  problems.push(...framingProblems);
  if (run.status !== 1) problems.push(`exit status ${run.status}, expected 1`);
  const starts = lines.flatMap((line, index) => (/^(not )?ok \d+ - /.test(line) ? [index] : []));
  if (starts.length !== COVERAGE_CASES.length) problems.push('case inventory must contain exactly the reviewed 51 cases');
  for (const [offset, start] of starts.entries()) {
    const expected = `${offset < 41 ? 'ok' : 'not ok'} ${offset + 1} - ${COVERAGE_CASES[offset]}`;
    if (lines[start] !== expected) problems.push(`unreviewed case identity or result: ${lines[start]}`);
  }
  const failures = starts.filter(index => lines[index].startsWith('not ok '));
  if (failures.length !== failed) problems.push(`summary reports ${failed} failures, ${failures.length} found`);
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
  const args = command.split(' ').slice(1).map(argument => argument.replace(/^'(.*)'$/, '$1'));
  const expected = gate.script === 'test:acceptance:installer-recovery' ? ['tests/acceptance/installer-recovery.cjs'] : [
    'node_modules/c8/bin/c8.js', '--all', '--per-file', '--include=bin/lib/install-names.js',
    '--include=bin/lib/install-transaction.js', '--check-coverage', '--statements', '100', '--branches', '100',
    '--functions', '100', '--lines', '100', '--reporter=text', '--reporter=json-summary',
    'node', '--test', '--test-reporter=tap', 'tests/coverage/install-transaction.test.cjs',
  ];
  if (!['test:acceptance:installer-recovery', 'test:coverage:install-transaction'].includes(gate.script) ||
      !isDeepStrictEqual(args, expected)) throw new Error(`unreviewed package gate command: ${gate.script}`);
  return args;
}

function main(args = process.argv.slice(2), dependencies = {}) {
  const spawn = dependencies.spawnSync || spawnSync;
  let packageJson;
  const log = dependencies.log || (message => process.stderr.write(`${message}\n`));
  const fileSystem = dependencies.fs || fs;
  const runtime = dependencies.runtime || {
    execPath: process.execPath, platform: process.platform, nodeVersion: process.version, isBun: Boolean(process.versions.bun),
  };
  const gate = Object.hasOwn(KNOWN_REDS, args[0]) ? KNOWN_REDS[args[0]] : undefined;
  if (args.length !== 1 || !gate) {
    log(`Usage: node scripts/expect-red.cjs <${Object.keys(KNOWN_REDS).join('|')}>`);
    return 2;
  }
  if (runtime.isBun) {
    log('expect-red: run this gate under Node; Bun evidence is not accepted');
    return 1;
  }
  if ((process.env.NODE_OPTIONS || '').trim()) {
    log('expect-red: NODE_OPTIONS must be unset for isolated evidence capture');
    return 1;
  }
  let evidence;
  let capturedHashes;
  const digestFile = name => createHash('sha256')
    .update(fileSystem.readFileSync(path.join(PROJECT_ROOT, name))).digest('hex');
  const recovery = args[0] === 'installer-recovery';
  try {
    const sourceBytes = Object.fromEntries([...(recovery ? RECOVERY_SOURCES : COVERAGE_SOURCES), 'package.json', 'scripts/expect-red.cjs']
      .map(name => [name, fileSystem.readFileSync(path.join(PROJECT_ROOT, name))]));
    if (!recovery) {
      for (const name of COVERAGE_SOURCES.slice(0, 2)) {
        if (/(?:[cv|]8|istanbul)\s+ignore\b|node:coverage\s+(?:ignore|disable|enable)/i.test(sourceBytes[name].toString('utf8'))) {
          throw new Error(`coverage ignore directive in ${name}`);
        }
      }
    }
    capturedHashes = Object.fromEntries(Object.entries(sourceBytes)
      .map(([name, bytes]) => [name, createHash('sha256').update(bytes).digest('hex')]));
    packageJson = JSON.parse(sourceBytes['package.json'].toString('utf8'));
    if (dependencies.packageJson && !isDeepStrictEqual(dependencies.packageJson, packageJson)) {
      throw new Error('injected package.json does not match captured bytes');
    }
    const tools = { node: runtime.nodeVersion };
    if (!recovery) {
      tools.c8 = JSON.parse(fileSystem.readFileSync(path.join(PROJECT_ROOT, 'node_modules/c8/package.json'), 'utf8')).version;
      if (typeof tools.c8 !== 'string' || !tools.c8) throw new Error('missing c8 version evidence');
    }
    log(`expect-red evidence: ${JSON.stringify({ node: runtime.nodeVersion, platform: runtime.platform, tools, sourceHashes: capturedHashes })}`);
    if (recovery) {
      evidence = {
        host: { platform: runtime.platform, nodeVersion: runtime.nodeVersion },
        sourceHashes: Object.fromEntries(RECOVERY_SOURCES.map(name => [name, capturedHashes[name]])),
      };
    }
  } catch (error) {
    log(`expect-red: could not read source evidence: ${error.message}`);
    return 1;
  }
  let scratch;
  let reports;
  let run;
  const problems = [];
  try {
    const command = commandFor(gate, packageJson);
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    delete env.NODE_V8_COVERAGE;
    delete env.NODE_OPTIONS;
    if (!recovery) {
      scratch = fileSystem.mkdtempSync(path.join(PROJECT_ROOT, '.claude', 'expect-red-'));
      reports = path.join(scratch, 'reports');
      const v8 = path.join(scratch, 'v8');
      fileSystem.mkdirSync(reports);
      fileSystem.mkdirSync(v8);
      const config = path.join(scratch, 'c8.json');
      fileSystem.writeFileSync(config, '{}', { flag: 'wx' });
      env.NODE_V8_COVERAGE = v8;
      const childIndex = command.indexOf('node');
      command[childIndex] = runtime.execPath;
      command.splice(childIndex, 0, `--reports-dir=${reports}`, `--temp-directory=${v8}`, `--config=${config}`);
    }
    run = spawn(runtime.execPath, command, {
      cwd: PROJECT_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 300000, env,
    });
    // Print both streams even when the child fails. Neither stream is acceptance.
    log(run.stdout);
    log(run.stderr);
    if (run.error || run.signal) {
      problems.push(`gate execution failed: ${run.error?.message || run.signal}`);
    } else {
      if (!recovery) {
        const summaryPath = path.join(reports, 'coverage-summary.json');
        const stat = fileSystem.lstatSync(summaryPath);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('coverage summary must be a plain file');
        evidence = { projectRoot: PROJECT_ROOT, host: { platform: runtime.platform },
          coverageSummary: JSON.parse(fileSystem.readFileSync(summaryPath, 'utf8')) };
      }
      problems.push(...gate.judge(run, evidence));
    }
  } catch (error) {
    problems.push(`could not capture gate evidence: ${error.message}`);
  } finally {
    if (scratch) {
      if (!run || run.error || run.signal) {
        problems.push(`retained private scratch; child quiescence not established: ${scratch}`);
      } else {
        try {
          if (path.dirname(scratch) !== path.join(PROJECT_ROOT, '.claude') ||
              !path.basename(scratch).startsWith('expect-red-')) throw new Error('scratch ownership mismatch');
          const stat = fileSystem.lstatSync(scratch);
          if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('scratch is not the owned directory');
          fileSystem.rmSync(scratch, { recursive: true, maxRetries: 2, retryDelay: 50 });
        } catch (error) {
          problems.push(`private scratch cleanup failed: ${scratch}: ${error.message}`);
        }
      }
    }
  }
  if (capturedHashes) {
    for (const [name, digest] of Object.entries(capturedHashes)) {
      try {
        if (digestFile(name) !== digest) problems.push(`source changed during capture: ${name}`);
      } catch (error) {
        problems.push(`could not recheck source ${name}: ${error.message}`);
      }
    }
  }
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

# Final delta review: P04/P05 section20
No tools. Do not imitate tool calls or claim execution. Return a substantive PASS / PASS WITH CHANGES / NOT PASS, concrete findings, confidence and scope limits in at most1000 words.
Owner requested Opus5/xhigh. Review only the post-review delta below and its interactions with the supplied context. The complete implementation review was PASS WITH CHANGES with no reproducible current safety regression, snapshot p05-section20-opus-review-2026-09-20.packet.md, SHA256 in accompanying metadata. This delta does not change owner APIs,27 identities,14PASS/13knownFAIL,home-state schema or runtime exception policy. No wrapper or lock source changes.
Post-review repairs: reject converter-recognized node:coverage ignore/enable/disable and legacy pipe-8 ignore directives; actual-harness owner-byte and displaced-entry damage/mutant controls. Installed node_modules/v8-to-istanbul/lib/source.js recognizes those forms (source excerpt below). Prior reviewer F4/F5 addressed. F1/F2 moved-list weaknesses remain explicitly owned by implementing agent at restore/moved-list format approval before current known-FAIL rows become PASS; the proposed equality against new/removed-only files would conflict with design steps9-10 requiring the full moved/displaced list. No inventory rename authorized. F3 was reviewer-withdrawn. F6-F9 defensive/future/test-efficiency advisories are dispositioned, not counted as current false acceptance.
Current measured evidence before this review:80 tests passed under Node/c8,100% all four metrics independently for validator and harness,stable source hashes; lint0errors/835 pre-existing warnings,no new warning or suppression. Complete repository suite and real recovery CLI results will be appended before invocation. Native win32 Node24 only; no hosted/native-other-platform acceptance. No completion from intentional product rollback failures.

Current source hashes:
{
  "scripts/expect-red.cjs": "45e576291952e82dbac3a8bdc458b6cce5a9ae4946f8b2ce7a274222e8c214bb",
  "tests/acceptance/installer-recovery.cjs": "444a786ec8312b43560ca889c671c3867390d018e47e68e4f657d07cfcf95d58",
  "tests/expect-red.test.js": "be7afbe2366fa6534e2a08486a0bebb4ca50180fa0699b8faa7ab4aa9fa1ef53"
}
## Exact delta
--- reviewed/scripts/expect-red.cjs
+++ current/scripts/expect-red.cjs
@@ -511,7 +511,7 @@
       .map(name => [name, fileSystem.readFileSync(path.join(PROJECT_ROOT, name))]));
     if (!recovery) {
       for (const name of COVERAGE_SOURCES.slice(0, 2)) {
-        if (/(?:c8|v8|istanbul)\s+ignore\b/i.test(sourceBytes[name].toString('utf8'))) {
+        if (/(?:[cv|]8|istanbul)\s+ignore\b|node:coverage\s+(?:ignore|disable|enable)\b/i.test(sourceBytes[name].toString('utf8'))) {
           throw new Error(`coverage ignore directive in ${name}`);
         }
       }
--- reviewed/tests/expect-red.test.js
+++ current/tests/expect-red.test.js
@@ -235,6 +235,8 @@
         if (fault.endsWith('-change')) fs.writeFileSync(path.join(options.env.HOME, '.config', 'owner.txt'), 'damaged');
         if (fault.endsWith('-extra')) fs.writeFileSync(path.join(options.env.HOME, 'outside-extra.txt'), 'unexpected');
       }
+      if (fault === 'fresh-owner-change' && scenario === 'fresh') fs.writeFileSync(path.join(target, 'owner.txt'), 'damaged owner');
+      if (fault === 'fresh-displaced-extra' && scenario === 'fresh') write(path.join(quarantine, 'displaced/attempt/owner.txt'), 'unexpected displacement');
       return { status: 1, stdout: `${injection}\nRollback applied: GSD roots restored to their state at ${new Date().toISOString()} and verified\n${quarantine}\n`, stderr: '' };
     };
     fs.readdirSync = function (name) {
@@ -260,15 +262,20 @@
       if (!weaken) require(harness);
       else {
         const source = fs.readFileSync(harness, 'utf8');
-        const decision = "assertHomePreserved(snapshotOutsideTarget(fixture), outsideBefore, observe);";
-        assert.equal(source.split(decision).length, 3);
+        const decisions = {
+          home: ["assertHomePreserved(snapshotOutsideTarget(fixture), outsideBefore, observe);", "observe('home-state', { before: outsideBefore, after: snapshotOutsideTarget(fixture) });", 2],
+          owner: ["assert.equal(fs.readFileSync(path.join(fixture.target, file), 'utf8'), content, file);", 'void content;', 1],
+          displaced: ['assert.deepEqual(quarantine.displaced, twin.changed)', 'undefined', 1],
+        };
+        const [decision, replacement, occurrences] = decisions[weaken === true ? 'home' : weaken];
+        assert.equal(source.split(decision).length, occurrences + 1);
         // Separate synthetic filename keeps mutant execution out of the real
         // harness's coverage. No production file is edited or written.
         const Module = require('node:module');
         const filename = path.join(path.dirname(harness), 'installer-recovery-decision-mutant.cjs');
         const mutant = new Module(filename);
         mutant.filename = filename;
-        mutant._compile(source.replaceAll(decision, "observe('home-state', { before: outsideBefore, after: snapshotOutsideTarget(fixture) });"), filename);
+        mutant._compile(source.replaceAll(decision, replacement), filename);
       }
     }
     finally { child.spawnSync = spawn; fs.readdirSync = readDirectory; fs.lstatSync = stat; }
@@ -285,6 +292,16 @@
 }
 
 describe('expect-red: recovery observation contract', () => {
+  test('fresh owner and displaced comparisons each detect a removed assertion', () => {
+    for (const [fault, decision, id] of [['fresh-owner-change', 'owner', 'owner-bytes-preserved'],
+      ['fresh-displaced-extra', 'displaced', 'displaced-equals-twin-changes']]) {
+      const correct = captureHarnessOracle(fault);
+      expect(correct.report.accepted).toBe(false);
+      expect(correct.report.checks.find(row => row.scenario === 'fresh' && row.id === id).ok).toBe(false);
+      const mutant = captureHarnessOracle(fault, decision);
+      expect(mutant.report.accepted).toBe(true);
+    }
+  });
   test('aborted harness, absent trace and unreadable transaction remain rejected with cleanup', () => {
     for (const mode of ['harness-abort', 'trace-absent', 'stat-error', 'baseline-read-error']) {
       const { run, report } = captureHarnessOracle(mode);
@@ -981,7 +998,8 @@
 
   test('coverage ignore directives in either watched module refuse before execution', () => {
     for (const module of ['install-names.js', 'install-transaction.js']) {
-      for (const provider of ['c8', 'v8', 'istanbul']) {
+      for (const directive of ['c8 ignore next', 'v8 ignore next', 'istanbul ignore next',
+        'node:coverage ignore next', 'node:coverage disable', 'node:coverage enable', '|8 ignore start']) {
         let spawned = false;
         const messages = [];
         const result = main(['install-transaction-coverage'], {
@@ -989,7 +1007,7 @@
           runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
           fs: { ...fs, readFileSync(name, ...args) {
             const bytes = fs.readFileSync(name, ...args);
-            return path.basename(name) === module ? Buffer.concat([Buffer.from(bytes), Buffer.from(`\n/* ${provider} ignore next */`)]) : bytes;
+            return path.basename(name) === module ? Buffer.concat([Buffer.from(bytes), Buffer.from(`\n/* ${directive} */`)]) : bytes;
           } },
           spawnSync: () => { spawned = true; return { status: 1, stdout: '', stderr: '' }; },
         });
## Current validator context
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
        if (/(?:[cv|]8|istanbul)\s+ignore\b|node:coverage\s+(?:ignore|disable|enable)\b/i.test(sourceBytes[name].toString('utf8'))) {
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

## Installed converter excerpt

  /**
   * Parses for comments:
   *    c8 ignore next
   *    c8 ignore next 3
   *    c8 ignore start
   *    c8 ignore stop
   * And equivalent ones for v8, e.g. v8 ignore next.
   * @param {string} lineStr
   * @return {{count?: number, start?: boolean, stop?: boolean}|undefined}
   */
  _parseIgnore (lineStr) {
    const testIgnoreNextLines = lineStr.match(/^\W*\/\* (?:[cv]8|node:coverage) ignore next (?<count>[0-9]+)/)
    if (testIgnoreNextLines) {
      return { count: Number(testIgnoreNextLines.groups.count) }
    }

    // Check if comment is on its own line.
    if (lineStr.match(/^\W*\/\* (?:[cv]8|node:coverage) ignore next/)) {
      return { count: 1 }
    }

    if (lineStr.match(/\/\* ([cv]8|node:coverage) ignore next/)) {
      // Won't ignore successive lines, but the current line will be ignored.
      return { count: 0 }
    }

    const testIgnoreStartStop = lineStr.match(/\/\* [c|v]8 ignore (?<mode>start|stop)/)
    if (testIgnoreStartStop) {
      if (testIgnoreStartStop.groups.mode === 'start') return { start: true }
      if (testIgnoreStartStop.groups.mode === 'stop') return { stop: true }
    }

    const testNodeIgnoreStartStop = lineStr.match(/\/\* node:coverage (?<mode>enable|disable)/)
    if (testNodeIgnoreStartStop) {
      if (testNodeIgnoreStartStop.groups.mode === 'disable') return { start: true }
      if (testNodeIgnoreStartStop.groups.mode === 'enable') return { stop: true }
    }
  }
## Completed invocation evidence
Full Bun1.3.5 suite:1847PASS,0FAIL,70files,7802assertions,exit0,271.28seconds,recorded source hashes stable. Live node scripts/expect-red.cjs installer-recovery:exit0,27checks with14PASS/13knownFAIL,cleanup true,known reason verdict. Current coverage80PASS,100% each metric both files. No source edits since those proofs.
## Current test context
const { describe, expect, test } = require('./helpers/portable-test-api.js');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('node:child_process');

const {
  INSTALLER_RECOVERY_HARNESS,
  INSTALLER_RECOVERY_SIGNATURE,
  commandFor,
  judgeInstallTransactionCoverage: judgeCoverage,
  judgeInstallerRecovery: judgeRecovery,
  main,
} = require('../scripts/expect-red.cjs');

// A real report captured from tests/acceptance/installer-recovery.cjs on the unfixed
// installer (win32, 2026-09-19), not a hand-written one: a hand-written fixture would
// encode the judge's own assumptions about the report shape.
const KNOWN_RED = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'expect-red', 'installer-recovery-structured-red.json'),
  'utf8'
);
const capturedRecovery = JSON.parse(KNOWN_RED);
const RECOVERY_EVIDENCE = {
  sourceHashes: capturedRecovery.sourceHashes,
  host: { platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node },
};

function judgeInstallerRecovery(run, evidence = RECOVERY_EVIDENCE) {
  return judgeRecovery(run, evidence);
}

function runOf(report, status = 1) {
  return { status, stdout: typeof report === 'string' ? report : JSON.stringify(report), stderr: '' };
}

function mutated(change) {
  const report = JSON.parse(KNOWN_RED);
  change(report);
  return report;
}

function changedText(text, search, replacement) {
  expect(text.includes(search)).toBe(true);
  const changed = text.replace(search, replacement);
  expect(changed).not.toBe(text);
  return changed;
}

function setCheck(report, key, ok) {
  const check = report.checks.find(candidate => `${candidate.scenario}:${candidate.id}` === key);
  check.ok = ok;
  check.detail = ok ? undefined : 'forced by the test';
}

let liveRecovery;
let resolvedNode;
function nodeRuntime() {
  if (!resolvedNode) {
    const probe = spawnSync('node', ['-p', 'JSON.stringify({execPath:process.execPath,version:process.version,platform:process.platform})'], {
      encoding: 'utf8', timeout: 10000, maxBuffer: 16384,
    });
    expect(probe.error).toBeUndefined();
    expect(probe.status).toBe(0);
    resolvedNode = JSON.parse(probe.stdout);
    expect(path.isAbsolute(resolvedNode.execPath)).toBe(true);
    expect(resolvedNode.version).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(resolvedNode.platform).toBe(process.platform);
  }
  return resolvedNode;
}

function captureNode(args, options) {
  return spawnSync(nodeRuntime().execPath, args, { encoding: 'utf8', ...options, maxBuffer: 64 * 1024 * 1024 });
}

function longTest(name, fn, timeout = 240000) {
  if (process.versions.bun) test(name, fn, timeout);
  else test(name, { timeout }, fn);
}

function captureRecovery() {
  if (!liveRecovery) {
    const run = captureNode(['tests/acceptance/installer-recovery.cjs'], {
      cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 180000,
    });
    expect(run.error).toBeUndefined();
    expect(run.status).toBe(1);
    liveRecovery = JSON.parse(run.stdout);
    expect(liveRecovery.fixtureRemoved).toBe(true);
    expect(liveRecovery.node).toBe(nodeRuntime().version);
    expect(liveRecovery.platform).toBe(nodeRuntime().platform);
  }
  return liveRecovery;
}

function captureCleanupFailure() {
  const harnessPath = path.resolve(__dirname, 'acceptance/installer-recovery.cjs');
  const control = function (harness) {
    const fs = require('node:fs');
    const path = require('node:path');
    const project = path.resolve(path.dirname(harness), '../..');
    const upstream = path.join(project, 'dist/bin/install.js');
    const exists = fs.existsSync;
    const create = fs.mkdtempSync;
    const remove = fs.rmSync;
    let fixture;
    // Abort before any installer child can be launched. This is a cleanup-oracle
    // control, not a product recovery run or a substitute for live acceptance.
    fs.existsSync = function (name) { return name === upstream ? false : exists.apply(this, arguments); };
    fs.mkdtempSync = function () { fixture = create.apply(this, arguments); return fixture; };
    fs.rmSync = function (name) {
      if (name === fixture) throw Object.assign(new Error('EBUSY: controlled fixture cleanup failure'), { code: 'EBUSY' });
      return remove.apply(this, arguments);
    };
    try { require(harness); }
    catch (error) { process.stderr.write(`control caught: ${error.message}\n`); process.exitCode = 1; }
    finally {
      fs.existsSync = exists;
      fs.mkdtempSync = create;
      fs.rmSync = remove;
      process.stderr.write(`control fixture: ${JSON.stringify(fixture)}\n`);
    }
  };
  const run = captureNode(['-'], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024,
    input: `(${control.toString()})(${JSON.stringify(harnessPath)});`,
  });
  expect(run.error).toBeUndefined();
  expect(run.signal).toBeNull();
  const marker = run.stderr.split('\n').find(line => line.startsWith('control fixture: '));
  expect(marker).toBeDefined();
  const fixture = JSON.parse(marker.slice('control fixture: '.length));
  // The child is terminal and the control prevented all descendants. Remove only
  // its named, empty, plain fixture; never sweep another invocation's directories.
  expect(path.dirname(fixture)).toBe(path.resolve(__dirname, '..', '.claude'));
  expect(path.basename(fixture).startsWith('installer-recovery-')).toBe(true);
  expect(fs.lstatSync(fixture).isSymbolicLink()).toBe(false);
  expect(fs.readdirSync(fixture)).toEqual([]);
  fs.rmdirSync(fixture);
  return { run, fixture };
}

function captureHarnessOracle(mode, weakenHomeComparison = false) {
  const harnessPath = path.resolve(__dirname, 'acceptance/installer-recovery.cjs');
  const control = function (harness, fault, weaken) {
    const fs = require('node:fs');
    const path = require('node:path');
    const assert = require('node:assert/strict');
    const child = require('node:child_process');
    const spawn = child.spawnSync;
    const readDirectory = fs.readdirSync;
    const stat = fs.lstatSync;
    const project = path.resolve(path.dirname(harness), '../..');
    let faultPath;
    let fired = false;
    if (fault === 'private-environment-alias') process.env.pSmOdUlEaNaLySiScAcHePaTh = path.join(project, 'unowned-control-cache');
    // Simulate the completed installer's filesystem effects, not the harness's
    // observations or assertions. The real harness walks real private files.
    child.spawnSync = (_executable, args, options) => {
      const target = args[args.length - 1];
      const scenario = path.basename(options.env.HOME).split(' ')[0];
      assert.equal(path.dirname(options.cwd), path.join(project, '.claude'));
      assert.ok(path.basename(options.cwd).startsWith('installer-recovery-'));
      assert.equal(target, path.join(options.cwd, `${scenario} home`, 'runtime with spaces'));
      if (fault === 'harness-abort') return { status: 1 };
      if (fault.startsWith('private-environment')) {
        for (const [key, relative] of Object.entries({ APPDATA: 'AppData/Roaming', LOCALAPPDATA: 'AppData/Local',
          XDG_CONFIG_HOME: '.config', XDG_CACHE_HOME: '.cache', XDG_DATA_HOME: '.local/share' })) {
          assert.equal(options.env[key], path.join(options.env.HOME, relative));
          assert.ok(fs.lstatSync(options.env[key]).isDirectory());
        }
        assert.equal(options.env.PSModuleAnalysisCachePath, undefined);
        assert.ok(!Object.keys(options.env).some(key => key.toUpperCase() === 'PSMODULEANALYSISCACHEPATH'));
        assert.equal(options.env.TEMP, options.cwd);
        assert.equal(options.env.TMP, options.cwd);
      }
      const write = (name, bytes) => { fs.mkdirSync(path.dirname(name), { recursive: true }); fs.writeFileSync(name, bytes); };
      const edited = 'skills/a.txt';
      const removed = 'skills/b.txt';
      const upgrading = scenario === 'upgrade' && Boolean(options.env.NODE_OPTIONS);
      const ownerBytes = upgrading ? fs.readFileSync(path.join(target, edited)) : null;
      if (fault.startsWith('runtime-')) {
        const runtime = path.join(options.env.HOME, 'AppData/Local/Microsoft/Windows');
        fs.mkdirSync(path.join(runtime, 'Caches'), { recursive: true });
        write(path.join(runtime, 'PowerShell/StartupProfileData-NonInteractive'), upgrading ? 'updated runtime' : 'runtime');
        if (upgrading) {
          const cache = path.join(runtime, 'PowerShell/StartupProfileData-NonInteractive');
          if (fault === 'runtime-extra') write(path.join(runtime, 'Caches/unapproved.bin'), 'unexpected');
          if (fault === 'runtime-delete') fs.unlinkSync(cache);
          if (fault === 'runtime-directory-type') {
            fs.rmdirSync(path.join(runtime, 'Caches'));
            fs.writeFileSync(path.join(runtime, 'Caches'), 'substituted');
          }
          if (fault === 'runtime-file-type') { fs.unlinkSync(cache); fs.mkdirSync(cache); }
          if (fault === 'runtime-directory-link') {
            fs.rmdirSync(path.join(runtime, 'Caches'));
            fs.symlinkSync(path.join(options.env.HOME, '.cache'), path.join(runtime, 'Caches'), 'junction');
          }
          if (fault === 'runtime-file-link') {
            fs.unlinkSync(cache);
            fs.symlinkSync(path.join(options.env.HOME, '.cache'), cache, 'junction');
          }
        }
      }
      write(path.join(target, edited), 'installed a\n');
      write(path.join(target, removed), 'installed b\n');
      if (!options.env.NODE_OPTIONS) return { status: 0, stdout: '', stderr: '' };
      fs.writeFileSync(path.join(options.cwd, `${scenario}-write-trace.json`), JSON.stringify([
        { completed: true, paths: [`runtime with spaces/${edited}`] },
        { completed: true, paths: [`runtime with spaces/${removed}`] },
      ]));
      const injection = 'INJECTED_MANIFEST_PUBLICATION_FAILURE';
      if (fault === 'trace-absent') fs.unlinkSync(path.join(options.cwd, `${scenario}-write-trace.json`));
      if (scenario === 'twin') return { status: 1, stdout: injection, stderr: '' };
      const transaction = path.join(target, 'gsd-install-transaction');
      if (fault === 'stat-error' && scenario === 'fresh') faultPath = transaction;
      const quarantine = path.join(transaction, 'quarantine', 'control-id');
      const freshRoot = path.join(quarantine, 'new');
      fs.mkdirSync(path.join(freshRoot, 'skills'), { recursive: true });
      if (upgrading) {
        write(path.join(quarantine, 'displaced', 'attempt', edited), fs.readFileSync(path.join(target, edited)));
        fs.writeFileSync(path.join(target, edited), ownerBytes);
        fs.renameSync(path.join(target, removed), path.join(freshRoot, removed));
      } else {
        fs.renameSync(path.join(target, edited), path.join(freshRoot, edited));
        fs.renameSync(path.join(target, removed), path.join(freshRoot, removed));
        fs.rmdirSync(path.join(target, 'skills'));
      }
      fs.writeFileSync(path.join(quarantine, 'moved.txt'), (upgrading ? [removed] : [edited, removed]).join('\n') + '\n');
      if (scenario === 'fresh' && ['before-observe', 'after-observe', 'without-code'].includes(fault)) {
        faultPath = fault === 'before-observe' ? target : transaction;
      }
      if (fault.startsWith(`home-${scenario}-`)) {
        if (fault.endsWith('-delete')) fs.unlinkSync(path.join(options.env.HOME, '.gsd', 'owner.json'));
        if (fault.endsWith('-change')) fs.writeFileSync(path.join(options.env.HOME, '.config', 'owner.txt'), 'damaged');
        if (fault.endsWith('-extra')) fs.writeFileSync(path.join(options.env.HOME, 'outside-extra.txt'), 'unexpected');
      }
      if (fault === 'fresh-owner-change' && scenario === 'fresh') fs.writeFileSync(path.join(target, 'owner.txt'), 'damaged owner');
      if (fault === 'fresh-displaced-extra' && scenario === 'fresh') write(path.join(quarantine, 'displaced/attempt/owner.txt'), 'unexpected displacement');
      return { status: 1, stdout: `${injection}\nRollback applied: GSD roots restored to their state at ${new Date().toISOString()} and verified\n${quarantine}\n`, stderr: '' };
    };
    fs.readdirSync = function (name) {
      if (fault === 'baseline-read-error' && path.basename(name) === 'runtime with spaces') {
        throw Object.assign(new Error('controlled baseline observation failure'), { code: 'EACCES' });
      }
      if (fault !== 'stat-error' && !fired && name === faultPath) {
        fired = true;
        const error = new Error('controlled directory observation failure');
        if (fault !== 'without-code') error.code = 'EACCES';
        throw error;
      }
      return readDirectory.apply(this, arguments);
    };
    fs.lstatSync = function (name) {
      if (fault === 'stat-error' && !fired && name === faultPath) {
        fired = true;
        throw Object.assign(new Error('controlled transaction stat failure'), { code: 'EACCES' });
      }
      return stat.apply(this, arguments);
    };
    try {
      if (!weaken) require(harness);
      else {
        const source = fs.readFileSync(harness, 'utf8');
        const decisions = {
          home: ["assertHomePreserved(snapshotOutsideTarget(fixture), outsideBefore, observe);", "observe('home-state', { before: outsideBefore, after: snapshotOutsideTarget(fixture) });", 2],
          owner: ["assert.equal(fs.readFileSync(path.join(fixture.target, file), 'utf8'), content, file);", 'void content;', 1],
          displaced: ['assert.deepEqual(quarantine.displaced, twin.changed)', 'undefined', 1],
        };
        const [decision, replacement, occurrences] = decisions[weaken === true ? 'home' : weaken];
        assert.equal(source.split(decision).length, occurrences + 1);
        // Separate synthetic filename keeps mutant execution out of the real
        // harness's coverage. No production file is edited or written.
        const Module = require('node:module');
        const filename = path.join(path.dirname(harness), 'installer-recovery-decision-mutant.cjs');
        const mutant = new Module(filename);
        mutant.filename = filename;
        mutant._compile(source.replaceAll(decision, replacement), filename);
      }
    }
    finally { child.spawnSync = spawn; fs.readdirSync = readDirectory; fs.lstatSync = stat; }
  };
  const run = captureNode(['-'], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024,
    input: `(${control.toString()})(${JSON.stringify(harnessPath)},${JSON.stringify(mode)},${JSON.stringify(weakenHomeComparison)});`,
  });
  expect(run.error).toBeUndefined();
  expect(run.signal).toBeNull();
  const report = JSON.parse(run.stdout);
  expect(report.fixtureRemoved).toBe(true);
  return { run, report };
}

describe('expect-red: recovery observation contract', () => {
  test('fresh owner and displaced comparisons each detect a removed assertion', () => {
    for (const [fault, decision, id] of [['fresh-owner-change', 'owner', 'owner-bytes-preserved'],
      ['fresh-displaced-extra', 'displaced', 'displaced-equals-twin-changes']]) {
      const correct = captureHarnessOracle(fault);
      expect(correct.report.accepted).toBe(false);
      expect(correct.report.checks.find(row => row.scenario === 'fresh' && row.id === id).ok).toBe(false);
      const mutant = captureHarnessOracle(fault, decision);
      expect(mutant.report.accepted).toBe(true);
    }
  });
  test('aborted harness, absent trace and unreadable transaction remain rejected with cleanup', () => {
    for (const mode of ['harness-abort', 'trace-absent', 'stat-error', 'baseline-read-error']) {
      const { run, report } = captureHarnessOracle(mode);
      expect(run.status).toBe(1);
      expect(report.accepted).toBe(false);
      expect(judgeInstallerRecovery(run).length).toBeGreaterThan(0);
      if (mode === 'stat-error') {
        const row = report.checks.find(check => keyOfCheck(check) === 'fresh:transaction-directory-shape');
        expect(row.evidence).toEqual({ kind: 'observation-error', actual: { code: 'EACCES', message: 'controlled transaction stat failure' } });
      } else if (mode === 'baseline-read-error') expect(report.harnessError).toBe('controlled baseline observation failure');
      else expect(report.checks.some(row => row.kind === 'harness' && !row.ok)).toBe(true);
    }
  });
  test('private environment clears case aliases of inherited runtime cache paths', () => {
    const { run, report } = captureHarnessOracle('private-environment-alias');
    expect(run.status).toBe(0);
    expect(report.accepted).toBe(true);
  });
  test('runtime exceptions never permit deletion, extra descendants, type or link substitution', () => {
    for (const mode of ['extra', 'delete', 'directory-type', 'file-type', 'directory-link', 'file-link']) {
      const { run, report } = captureHarnessOracle(`runtime-${mode}`);
      expect(run.status).toBe(1);
      const check = report.checks.find(row => keyOfCheck(row) === 'upgrade:home-outside-target-preserved');
      expect(check.ok).toBe(false);
      expect(check.evidence.kind).toBe('home-state');
      const bad = mutated(value => { value.checks.find(row => keyOfCheck(row) === keyOfCheck(check)).evidence = check.evidence; });
      expect(judgeInstallerRecovery(runOf(bad))).toContain(`unexpected or incomplete observation: ${keyOfCheck(check)}`);
    }
  });
  test('exact Windows runtime creation and regular-file updates preserve owner data', () => {
    const { run, report } = captureHarnessOracle('runtime-allowed');
    expect(run.status).toBe(process.platform === 'win32' ? 0 : 1);
    for (const scenario of ['fresh', 'upgrade']) {
      const check = report.checks.find(row => row.scenario === scenario && row.id === 'home-outside-target-preserved');
      expect(check.ok).toBe(process.platform === 'win32');
      expect(check.evidence.kind).toBe('home-state');
      const { before, after } = check.evidence.actual;
      const cache = 'AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive';
      expect(after[cache]).toMatch(/^file:[a-f0-9]{64}$/);
      if (scenario === 'upgrade') expect(after[cache]).not.toBe(before[cache]);
    }
  });
  test('private runtime environment is initialized before complete home observations', () => {
    const { run, report } = captureHarnessOracle('private-environment');
    expect(run.status).toBe(0);
    for (const scenario of ['fresh', 'upgrade']) {
      const check = report.checks.find(row => row.scenario === scenario && row.id === 'home-outside-target-preserved');
      expect(check?.ok).toBe(true);
      expect(check.evidence.kind).toBe('home-state');
      const { before, after } = check.evidence.actual;
      expect(after).toEqual(before);
      for (const name of ['.gsd/owner.json', '.codex/owner.txt', '.config/owner.txt',
        'AppData/Roaming/owner.txt', 'AppData/Local/owner.txt']) expect(before[name]).toMatch(/^file:[a-f0-9]{64}$/);
      expect(before['other-owner/empty']).toBe('dir');
    }
  });
  test('outside-target deletion, byte damage and extra entries fail in both scenarios', () => {
    for (const scenario of ['fresh', 'upgrade']) {
      for (const [damage, name] of [['delete', '.gsd/owner.json'],
        ['change', '.config/owner.txt'], ['extra', 'outside-extra.txt']]) {
        const { run, report } = captureHarnessOracle(`home-${scenario}-${damage}`);
        expect(run.status).toBe(1);
        expect(report.accepted).toBe(false);
        const check = report.checks.find(row => row.scenario === scenario && row.id === 'home-outside-target-preserved');
        expect(check?.ok).toBe(false);
        expect(check.evidence.kind).toBe('home-state');
        expect(check.evidence.actual.after[name]).not.toBe(check.evidence.actual.before[name]);
        const bad = mutated(value => { value.checks.find(row => keyOfCheck(row) === keyOfCheck(check)).evidence = check.evidence; });
        expect(judgeInstallerRecovery(runOf(bad))).toContain(`unexpected or incomplete observation: ${keyOfCheck(check)}`);
      }
    }
  });

  test('outside-target damage controls detect a removed home comparison', () => {
    const correct = captureHarnessOracle('home-upgrade-delete');
    expect(correct.report.accepted).toBe(false);
    const mutant = captureHarnessOracle('home-upgrade-delete', true);
    expect(mutant.report.accepted).toBe(true);
  });
  test('the real harness recognizes complete private quarantine and restored owner data', () => {
    const { run, report } = captureHarnessOracle('none');
    expect(run.status).toBe(0);
    expect(report.accepted).toBe(true);
    expect(report.checks).toHaveLength(27);
    expect(report.checks.every(check => check.ok)).toBe(true);
    for (const scenario of ['fresh', 'upgrade']) {
      const check = report.checks.find(row => row.scenario === scenario && row.id === 'home-outside-target-preserved');
      expect(check?.ok).toBe(true);
      expect(check.evidence.kind).toBe('home-state');
      expect(check.evidence.actual.after).toEqual(check.evidence.actual.before);
    }
    expect(report.fresh.quarantinedEntries).toBe(3);
    expect(report.upgrade.displaced).toEqual(['skills/a.txt']);
  });

  test('the real harness emits observation-error before and after partial observation', () => {
    for (const mode of ['before-observe', 'after-observe', 'without-code']) {
      const { run, report } = captureHarnessOracle(mode);
      expect(run.status).toBe(1);
      expect(report.checks.find(row => row.scenario === 'fresh' && row.id === 'home-outside-target-preserved')?.ok).toBe(true);
      const id = mode === 'before-observe' ? 'top-level-exact-allowlist' : 'transaction-directory-shape';
      const check = report.checks.find(row => row.scenario === 'fresh' && row.id === id);
      expect(check.ok).toBe(false);
      expect(check.evidence).toEqual({ kind: 'observation-error', actual: {
        code: mode === 'without-code' ? null : 'EACCES', message: 'controlled directory observation failure',
      } });
      // Feed the actually emitted observation into the frozen known-RED case.
      // Other GREEN simulator observations are not evidence of product recovery.
      const bad = mutated(value => { value.checks.find(row => row.scenario === 'fresh' && row.id === id).evidence = check.evidence; });
      expect(judgeInstallerRecovery(runOf(bad))).toContain(`unexpected or incomplete observation: fresh:${id}`);
    }
  });
  test('cleanup failure still emits a rejected report and names its retained fixture', () => {
    const { run, fixture } = captureCleanupFailure();
    expect(run.status).toBe(1);
    const report = JSON.parse(run.stdout);
    expect(report.accepted).toBe(false);
    expect(report.fixtureRemoved).toBe(false);
    expect(report.harnessError).toContain('cleanup');
    expect(report.harnessError).toContain('EBUSY');
    expect(run.stderr).toContain(`retained fixture: ${fixture}`);
    expect(judgeInstallerRecovery(run).length).toBeGreaterThan(0);
  });
  longTest('the disposable upgrade independently checks owner preservation', () => {
    const report = captureRecovery();
    const owner = report.checks.find(check => keyOfCheck(check) === 'upgrade:owner-bytes-preserved');
    expect(owner?.ok).toBe(true);
    expect(report.checks).toHaveLength(27);
  });

  longTest('known failures retain complete typed observations independently of diagnostic truncation', () => {
    const report = captureRecovery();
    const kinds = new Map([
      ['outcome-exact', 'outcome-lines'], ['top-level-exact-allowlist', 'top-level-names'],
      ['transaction-directory-shape', 'transaction-state'], ['quarantine-path-printed', 'quarantine-reference'],
      ['new-equals-twin-residue', 'tree-delta'], ['tree-deep-equal-outside-allowlist', 'tree-delta'],
      ['removed-file-quarantined-as-new', 'entry-type'], ['edited-file-displaced', 'displaced-paths'],
      ['moved-txt-lists-every-file', 'moved-list'],
    ]);
    for (const check of report.checks.filter(check => !check.ok)) {
      expect(check.evidence?.kind).toBe(kinds.get(check.id));
    }
    const delta = report.checks.find(check => check.id === 'new-equals-twin-residue').evidence.actual;
    expect(delta.missing).toEqual(Object.keys(report.context.twin.residue).sort());
    expect(delta.missing.length).toBeGreaterThan(6);
    expect(delta.unexpected).toEqual([]);
    expect(delta.changed).toEqual([]);
    expect(report.context.upgrade).toEqual({ edited: report.upgrade.edited, removed: report.upgrade.removed });
    expect(report.sourceHashes['tests/acceptance/installer-recovery.cjs']).toMatch(/^[a-f0-9]{64}$/);
  });
});

function keyOfCheck(check) {
  return `${check.scenario}:${check.id}`;
}

describe('expect-red: installer recovery', () => {
  test('Windows home-state paths reject illegal characters and reserved device names', () => {
    for (const name of ['bad?', 'bad*', 'bad<', 'bad>', 'bad|', 'bad"', 'CON', 'nul.txt', 'AUX', 'PRN', 'COM1.log', 'LPT9']) {
      const report = mutated(value => {
        const state = value.checks.find(row => keyOfCheck(row) === 'fresh:home-outside-target-preserved').evidence.actual;
        state.before[name] = state.after[name] = 'dir';
      });
      expect(judgeInstallerRecovery(runOf(report))).toContain('unexpected or incomplete observation: fresh:home-outside-target-preserved');
    }
  });
  test('home maps reject incomplete, malformed, aliased and falsely preserved evidence', () => {
    const cache = 'AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive';
    const changes = [
      row => { delete row.evidence; }, row => { row.evidence = null; },
      row => { row.evidence.extra = true; }, row => { row.evidence.kind = 'assertion-pass'; },
      row => { row.evidence.actual = null; }, row => { row.evidence.actual.extra = true; },
      row => { delete row.evidence.actual.before; }, row => { delete row.evidence.actual.after; },
      row => { row.evidence.actual.before = {}; }, row => { row.evidence.actual.after = []; },
      row => { delete row.evidence.actual.before['.gsd/owner.json']; delete row.evidence.actual.after['.gsd/owner.json']; },
      row => { delete row.evidence.actual.before['other-owner/empty']; delete row.evidence.actual.after['other-owner/empty']; },
      row => { row.evidence.actual.before['.config/owner.txt'] = row.evidence.actual.after['.config/owner.txt'] = `file:${'a'.repeat(64)}`; },
      ...['', '../bad', '/bad', 'a//b', 'a/./b', 'C:/bad', 'a\\b', 'bad ', 'bad.', 'runtime with spaces',
        'Runtime With Spaces/child', '.CONFIG', '.config/OWNER.TXT'].map(name => row => {
        row.evidence.actual.before[name] = row.evidence.actual.after[name] = 'dir';
      }),
      ...[null, 1, '', 'file:invalid', 'link:', `link:a${String.fromCharCode(0)}`].map(value => row => {
        row.evidence.actual.before.other = row.evidence.actual.after.other = value;
      }),
      row => { delete row.evidence.actual.before['AppData/Local']; },
      row => { row.evidence.actual.before['.config'] = 'link:elsewhere'; },
      row => { row.evidence.actual.before[cache] = 'dir'; },
      row => { row.evidence.actual.before[cache] = 'link:elsewhere'; },
      row => { row.evidence.actual.before['AppData/Local/Microsoft/Windows/Caches'] = 'link:elsewhere';
        row.evidence.actual.after['AppData/Local/Microsoft/Windows/Caches'] = 'dir'; },
    ];
    for (const change of changes) {
      const report = mutated(value => {
        const row = value.checks.find(check => keyOfCheck(check) === 'upgrade:home-outside-target-preserved');
        const original = JSON.stringify(row);
        change(row);
        expect(JSON.stringify(row)).not.toBe(original);
      });
      expect(judgeInstallerRecovery(runOf(report))).toContain('unexpected or incomplete observation: upgrade:home-outside-target-preserved');
    }
  });

  test('runtime changes are Windows-only; preserved arbitrary owner files and links remain valid', () => {
    for (const platform of ['linux', 'darwin']) {
      const evidence = structuredClone(RECOVERY_EVIDENCE);
      evidence.host.platform = platform;
      const report = mutated(value => { value.platform = platform; });
      expect(judgeInstallerRecovery(runOf(report), evidence)).toContain('unexpected or incomplete observation: fresh:home-outside-target-preserved');
      for (const row of report.checks.filter(check => check.id === 'home-outside-target-preserved')) {
        row.evidence.actual.after = structuredClone(row.evidence.actual.before);
        row.evidence.actual.before['owner-link'] = row.evidence.actual.after['owner-link'] = 'link:other-owner';
        row.evidence.actual.before['extra-owner'] = row.evidence.actual.after['extra-owner'] = `file:${'b'.repeat(64)}`;
      }
      expect(judgeInstallerRecovery(runOf(report), evidence)).toEqual([]);
    }
  });
  test('the captured 27-check private-home report satisfies the approved inventory', () => {
    expect(capturedRecovery.checks).toHaveLength(27);
    expect(capturedRecovery.checks.filter(row => row.ok)).toHaveLength(14);
    expect(judgeInstallerRecovery(runOf(KNOWN_RED))).toEqual([]);
  });
  test('a real abort-shaped report keeps its failed harness diagnostic without context', () => {
    const report = mutated(value => {
      const check = value.checks.find(row => keyOfCheck(row) === 'twin:child-failed-at-injection');
      check.ok = false;
      check.detail = 'child never reached injection';
      check.evidence = { kind: 'observation-error', actual: { code: 'ERR_ASSERTION', message: check.detail } };
      value.checks = [check];
      value.context = {};
      value.failure = keyOfCheck(check);
    });
    const problems = judgeInstallerRecovery(runOf(report));
    expect(problems).toContain('invalid independent recovery context');
    expect(problems).toContain('harness check did not pass: twin:child-failed-at-injection');
  });

  test('supplied malformed termination markers are never treated as absent', () => {
    for (const error of [false, 0, '', null]) {
      expect(judgeInstallerRecovery({ ...runOf(KNOWN_RED), error }).length).toBeGreaterThan(0);
    }
    for (const signal of [false, 0, '']) {
      expect(judgeInstallerRecovery({ ...runOf(KNOWN_RED), signal }).length).toBeGreaterThan(0);
    }
  });

  test('host-specific identity rules and contradictory pass details are checked', () => {
    for (const platform of ['linux', 'darwin']) {
      const report = mutated(value => {
        value.platform = platform;
        for (const row of value.checks.filter(check => check.id === 'home-outside-target-preserved')) {
          row.evidence.actual.after = structuredClone(row.evidence.actual.before);
        }
      });
      const evidence = structuredClone(RECOVERY_EVIDENCE);
      evidence.host.platform = platform;
      expect(judgeInstallerRecovery(runOf(report), evidence)).toEqual([]);
    }
    expect(judgeInstallerRecovery(runOf(mutated(report => {
      report.checks.find(row => keyOfCheck(row) === 'twin:child-failed-at-injection').detail = 'unexpected failure detail';
    }))).length).toBeGreaterThan(0);
    expect(judgeInstallerRecovery(runOf('{malformed'))[0]).toContain('{malformed');
  });

  test('recovery evidence must match the explicitly supplied source bytes and host', () => {
    for (const evidence of [undefined, null, {}, { ...RECOVERY_EVIDENCE, host: null },
      { ...RECOVERY_EVIDENCE, sourceHashes: {} },
      { ...RECOVERY_EVIDENCE, host: { platform: 'linux', nodeVersion: capturedRecovery.node } },
      { ...RECOVERY_EVIDENCE, host: { platform: 'win32', nodeVersion: 'v22.0.0' } }]) {
      expect(judgeRecovery(runOf(KNOWN_RED), evidence).length).toBeGreaterThan(0);
    }
    for (const name of Object.keys(RECOVERY_EVIDENCE.sourceHashes)) {
      for (const change of [
        report => { delete report.sourceHashes[name]; },
        report => { report.sourceHashes[name] = 'a'.repeat(64); },
        report => { report.sourceHashes[name] = 'not-a-digest'; },
      ]) expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
    }
    expect(judgeInstallerRecovery(runOf(mutated(report => { report.sourceHashes.extra = 'a'.repeat(64); }))).length).toBeGreaterThan(0);
    expect(judgeInstallerRecovery(runOf(mutated(report => { report.platform = 'unknown'; }))).length).toBeGreaterThan(0);
    expect(judgeInstallerRecovery(runOf(mutated(report => { report.node = 'v22.0.0'; }))).length).toBeGreaterThan(0);
  });

  test('independent context must contain unambiguous relative paths and real residue', () => {
    for (const change of [
      report => { delete report.context; },
      report => { report.context.twin.residue = {}; },
      report => { report.context.upgrade.edited = report.context.upgrade.removed; },
      report => { report.context.upgrade.edited = '../owner.txt'; },
      report => { report.context.upgrade.edited = '/owner.txt'; },
      report => { report.context.upgrade.edited = 'C:/owner.txt'; },
      report => { report.context.upgrade.edited = 'a//b'; },
      report => { report.context.upgrade.edited = 'a/./b'; },
      report => { report.context.twin.residue.extra = 'unknown-type'; },
      report => { report.context.twin.residue['skills/alias'] = 'file'; report.context.twin.residue['skills/ALIAS'] = 'file'; },
    ]) {
      expect(judgeInstallerRecovery(runOf(mutated(change))).some(problem => problem.includes('context'))).toBe(true);
    }
  });

  test('a self-consistent smaller twin cannot silently drop a reviewed root', () => {
    const report = mutated(value => {
      const residue = Object.fromEntries(Object.entries(value.context.twin.residue)
        .filter(([name]) => name !== 'hooks' && !name.startsWith('hooks/')));
      value.context.twin.residue = residue;
      value.checks.find(row => keyOfCheck(row) === 'fresh:new-equals-twin-residue').evidence.actual.missing = Object.keys(residue).sort();
      value.checks.find(row => keyOfCheck(row) === 'fresh:moved-txt-lists-every-file').evidence.actual.expected =
        Object.keys(residue).filter(name => residue[name] === 'file').sort();
    });
    expect(judgeInstallerRecovery(runOf(report))).toContain('invalid independent recovery context');
  });

  test('malformed, interrupted and cleanup-failed reports return diagnostics instead of acceptance or exceptions', () => {
    for (const report of [null, [], true, 1, 'text', {}, { checks: null }, { checks: {} }, { checks: [null] }]) {
      expect(judgeInstallerRecovery(runOf(JSON.stringify(report))).length).toBeGreaterThan(0);
    }
    for (const change of [
      report => { delete report.accepted; }, report => { report.accepted = 'false'; },
      report => { delete report.fixtureRemoved; }, report => { report.fixtureRemoved = false; },
      report => { report.checks[report.checks.findIndex(row => keyOfCheck(row) === 'twin:child-failed-at-injection')] = null; },
      report => { report.checks = {}; },
      report => { report.checks.find(row => keyOfCheck(row) === 'twin:child-failed-at-injection').ok = 1; },
      report => { report.checks.find(row => keyOfCheck(row) === 'fresh:outcome-exact').detail = ''; },
      report => { report.failure += ', fresh:outcome-exact'; },
      report => { report.failure = 'fresh:outcome-exact'; },
      report => { delete report.failure; },
    ]) expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
    for (const run of [undefined, null, {}, { ...runOf(KNOWN_RED), signal: 'SIGTERM' },
      { ...runOf(KNOWN_RED), error: new Error('timeout') }, { ...runOf(KNOWN_RED), stderr: null }]) {
      expect(judgeInstallerRecovery(run).length).toBeGreaterThan(0);
    }
  });

  test('known failure labels cannot conceal missing, contradictory or additional observations', () => {
    const baseline = JSON.parse(KNOWN_RED);
    for (const original of baseline.checks) {
      const key = keyOfCheck(original);
      const changes = [
        check => { delete check.evidence; },
        check => { check.evidence.kind = 'observation-error'; },
        check => { check.evidence.actual.unreviewed = 'additional damage'; },
      ];
      for (const field of Object.keys(original.evidence.actual)) {
        changes.push(check => { delete check.evidence.actual[field]; });
        changes.push(check => {
          const value = check.evidence.actual[field];
          check.evidence.actual[field] = Array.isArray(value) ? [...value, 'unreviewed-damage'] : 'contradiction';
        });
      }
      for (const change of changes) {
        const report = mutated(value => change(value.checks.find(check => keyOfCheck(check) === key)));
        expect(judgeInstallerRecovery(runOf(report)).some(problem => problem.includes(key))).toBe(true);
      }
    }
    const diagnosticsOnly = mutated(report => {
      for (const check of report.checks.filter(check => !check.ok)) check.detail = 'Different human formatting';
    });
    expect(judgeInstallerRecovery(runOf(diagnosticsOnly))).toEqual([]);
  });

  test('only the complete reviewed inventory is accepted, without duplicates or extra failures', () => {
    const baseline = JSON.parse(KNOWN_RED);
    for (const original of baseline.checks) {
      const key = keyOfCheck(original);
      for (const change of [
        report => { report.checks = report.checks.filter(check => keyOfCheck(check) !== key); },
        report => { report.checks.push({ ...original }); },
        report => { setCheck(report, key, !original.ok); },
        report => { report.checks.find(check => keyOfCheck(check) === key).kind = 'unreviewed'; },
      ]) {
        expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
      }
    }
    expect(judgeInstallerRecovery(runOf(mutated(report => {
      report.checks.push({ scenario: 'fresh', id: 'unknown', kind: 'acceptance', ok: false, detail: 'new damage' });
    }))).length).toBeGreaterThan(0);
  });

  test('the captured red from the unfixed installer is the known red', () => {
    expect(judgeInstallerRecovery(runOf(KNOWN_RED))).toEqual([]);
  });

  test('an additional owner-byte loss cannot hide behind the expected recovery failures', () => {
    const report = mutated(value => setCheck(value, 'fresh:owner-bytes-preserved', false));
    const problems = judgeInstallerRecovery(runOf(report));
    expect(problems.some(problem => problem.includes('fresh:owner-bytes-preserved'))).toBe(true);
  });

  test('an unexpected pass fails and says how to retire the wrapper', () => {
    const green = mutated(report => {
      report.accepted = true;
      for (const check of report.checks) check.ok = true;
    });
    const problems = judgeInstallerRecovery(runOf(green, 0));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('UNEXPECTED PASS');
  });

  for (const key of INSTALLER_RECOVERY_HARNESS) test(`a red with harness check ${key} failing is the wrong red`, () => {
    const problems = judgeInstallerRecovery(runOf(mutated(report => setCheck(report, key, false))));
    expect(problems.some(problem => problem.includes(key))).toBe(true);
  });

  for (const key of INSTALLER_RECOVERY_HARNESS) test(`a red that never ran harness check ${key} is the wrong red`, () => {
    const partial = mutated(report => {
      report.checks = report.checks.filter(check => `${check.scenario}:${check.id}` !== key);
    });
    expect(judgeInstallerRecovery(runOf(partial))).toContain(`harness check did not pass: ${key}`);
  });

  for (const key of INSTALLER_RECOVERY_SIGNATURE) test(`a red in which ${key} passes is not the known red`, () => {
    const problems = judgeInstallerRecovery(runOf(mutated(report => setCheck(report, key, true))));
    expect(problems).toContain(`known failure absent: ${key}`);
  });

  test('a missing compose is the wrong red', () => {
    const report = { accepted: false, checks: [], harnessError: 'compose the candidate before running acceptance' };
    const problems = judgeInstallerRecovery(runOf(report));
    expect(problems).toContain('harness error: compose the candidate before running acceptance');
  });

  test('a crash with no report and an unexpected exit status are both refused', () => {
    expect(judgeInstallerRecovery({ status: 1, stdout: '', stderr: 'SyntaxError: boom' })[0]).toContain('SyntaxError: boom');
    expect(judgeInstallerRecovery(runOf(KNOWN_RED, 3))).toContain('exit status 3, expected 1');
  });
});

describe('expect-red: install transaction coverage', () => {
  const COVERAGE_EVIDENCE = {
    projectRoot: 'C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign', host: { platform: 'win32' },
    coverageSummary: JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8')),
  };
  const judgeInstallTransactionCoverage = (run, evidence = COVERAGE_EVIDENCE) => judgeCoverage(run, evidence);
  // Real reviewed TAP from the landed lock module with only render pending.
  const KNOWN_TAP = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'),
    'utf8'
  );
  const tapRun = (stdout, status = 1, stderr = '') => ({ status, stdout, stderr });
  const FIRST_REASON = "error: 'not implemented: renderOutcome'";

  test('supplied malformed termination markers are never treated as absent', () => {
    for (const error of [false, 0, '', null]) {
      expect(judgeInstallTransactionCoverage({ ...tapRun(KNOWN_TAP), error }).length).toBeGreaterThan(0);
    }
    for (const signal of [false, 0, '']) {
      expect(judgeInstallTransactionCoverage({ ...tapRun(KNOWN_TAP), signal }).length).toBeGreaterThan(0);
    }
  });

  test('affirmative coverage requires both exact files, every metric and consistent aggregate counts', () => {
    for (const evidence of [undefined, null, {}, { ...COVERAGE_EVIDENCE, coverageSummary: {} },
      { ...COVERAGE_EVIDENCE, host: { platform: 'unknown' } },
      { ...COVERAGE_EVIDENCE, projectRoot: '/foreign-project' }]) {
      expect(judgeCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
    }
    for (const file of Object.keys(COVERAGE_EVIDENCE.coverageSummary)) {
      for (const metric of ['lines', 'statements', 'functions', 'branches']) {
        for (const delta of [{ total: 0 }, { covered: 0 }, { skipped: 1 }, { pct: 99.99 }, { pct: '100' }]) {
          const evidence = structuredClone(COVERAGE_EVIDENCE);
          Object.assign(evidence.coverageSummary[file][metric], delta);
          expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
        }
      }
      const absent = structuredClone(COVERAGE_EVIDENCE);
      delete absent.coverageSummary[file];
      expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), absent).length).toBeGreaterThan(0);
    }
    const aggregate = structuredClone(COVERAGE_EVIDENCE);
    aggregate.coverageSummary.total.branches.total++;
    aggregate.coverageSummary.total.branches.covered++;
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), aggregate).length).toBeGreaterThan(0);
    const extra = structuredClone(COVERAGE_EVIDENCE);
    extra.coverageSummary['C:/foreign/file.js'] = structuredClone(extra.coverageSummary.total);
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), extra).length).toBeGreaterThan(0);
    for (const platform of ['linux', 'darwin']) {
      const evidence = structuredClone(COVERAGE_EVIDENCE);
      evidence.host.platform = platform;
      evidence.projectRoot = '/project';
      evidence.coverageSummary = Object.fromEntries(Object.entries(evidence.coverageSummary).map(([name, data]) => [
        name === 'total' ? name : `/project/bin/lib/${path.win32.basename(name)}`, data,
      ]));
      expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence)).toEqual([]);
    }
  });

  test('coverage refuses malformed or interrupted runs and TAP tokens disguised as table rows', () => {
    for (const run of [undefined, null, {}, { ...tapRun(KNOWN_TAP), signal: 'SIGTERM' },
      { ...tapRun(KNOWN_TAP), error: new Error('timeout') }, { ...tapRun(KNOWN_TAP), stderr: null }]) {
      expect(judgeInstallTransactionCoverage(run).length).toBeGreaterThan(0);
    }
    for (const line of ['Bail out! | incomplete', '  ok 1 - nested | ignored', '# tests 51 | fake']) {
      expect(judgeInstallTransactionCoverage(tapRun(`${KNOWN_TAP}\n${line}`)).length).toBeGreaterThan(0);
    }
  });

  test('coverage aliases, malformed tables and truncated TAP are rejected', () => {
    const file = Object.keys(COVERAGE_EVIDENCE.coverageSummary).find(name => name !== 'total');
    for (const change of [
      evidence => { evidence.projectRoot = 'relative'; },
      evidence => { delete evidence.projectRoot; },
      evidence => { evidence.coverageSummary[file] = null; },
      evidence => { evidence.coverageSummary[file].unreviewedMetric = {}; },
      evidence => { evidence.coverageSummary[file.toUpperCase()] = evidence.coverageSummary[file]; },
    ]) {
      const evidence = structuredClone(COVERAGE_EVIDENCE);
      change(evidence);
      expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
    }
    for (const wrong of [
      changedText(KNOWN_TAP, '# Subtest: names:', '# Subtest: unknown:'),
      changedText(KNOWN_TAP, '  ---', '  missing-start'),
      KNOWN_TAP.slice(0, KNOWN_TAP.lastIndexOf('  ...')).trimEnd(),
      changedText(KNOWN_TAP, "  type: 'test'", "  type: 'test'\n  error: 'unexpected error'"),
      changedText(KNOWN_TAP, '# duration_ms ', '# duration_ms NaN'),
      `${KNOWN_TAP}\nunstructured trailing garbage`,
    ]) expect(judgeInstallTransactionCoverage(tapRun(wrong)).length).toBeGreaterThan(0);
  });

  test('a normalized alias cannot replace the exact covered source identity', () => {
    const evidence = structuredClone(COVERAGE_EVIDENCE);
    const file = Object.keys(evidence.coverageSummary).find(name => name !== 'total');
    const alias = `${path.win32.dirname(file)}/../lib/${path.win32.basename(file)}`;
    evidence.coverageSummary[alias] = evidence.coverageSummary[file];
    delete evidence.coverageSummary[file];
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
  });

  test('decision controls detect independently weakened recovery and coverage guards', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'expect-red.cjs'), 'utf8');
    const recoveryCases = [
      ['if (checks.has(key))', report => { report.checks.push(structuredClone(report.checks.find(row => keyOfCheck(row) === 'twin:child-failed-at-injection'))); }],
      ['if (!expectedKeys.has(key))', report => { report.checks.push({ scenario: 'fresh', id: 'unreviewed', kind: 'acceptance', ok: true }); }],
      ['if (report.fixtureRemoved !== true)', report => { report.fixtureRemoved = false; }],
      ['if (!validContext)', report => { report.context.upgrade.edited = '../owner'; }],
      ["if (check.id === 'home-outside-target-preserved'\n      ? !validHomeObservation(check.evidence, report.platform)\n      : validContext && !isDeepStrictEqual(check.evidence, recoveryObservation(check, report.context)))", report => {
        report.checks.find(check => check.id === 'new-equals-twin-residue').evidence.actual.changed.push('owner.txt');
      }],
      ['if (checks.get(key)?.ok !== true)', report => {
        setCheck(report, 'upgrade:owner-bytes-preserved', false);
        report.failure += ', upgrade:owner-bytes-preserved';
      }],
      ['if (checks.get(key)?.ok !== false)', report => {
        setCheck(report, 'fresh:outcome-exact', true);
        report.failure = report.failure.split(', ').filter(key => key !== 'fresh:outcome-exact').join(', ');
      }],
    ].map(([before, change]) => ({ before, after: 'if (false)', name: 'judgeInstallerRecovery',
      run: runOf(mutated(change)), evidence: RECOVERY_EVIDENCE }));
    const homeCases = [
      { before: 'before.get(name) !== after.get(name)', after: 'false', change: state => { state.after['.config/owner.txt'] = `file:${'a'.repeat(64)}`; } },
      { before: 'directories.has(name)', after: "(directories.has(name) || name === 'AppData/Local/Microsoft/Windows/Caches/extra')",
        change: state => { state.before['AppData/Local/Microsoft/Windows/Caches'] = state.after['AppData/Local/Microsoft/Windows/Caches'] = 'dir';
          state.after['AppData/Local/Microsoft/Windows/Caches/extra'] = 'dir'; } },
      { before: "(before.has(name) && !/^file:[a-f0-9]{64}$/.test(before.get(name)))", after: 'false',
        change: state => { state.before['AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive'] = 'link:elsewhere'; } },
      { before: "(before.has(name) && before.get(name) !== 'dir')", after: 'false',
        change: state => { state.before['AppData/Local/Microsoft/Windows/Caches'] = 'link:elsewhere';
          state.after['AppData/Local/Microsoft/Windows/Caches'] = 'dir'; } },
    ].map(control => ({ ...control, name: 'judgeInstallerRecovery', evidence: RECOVERY_EVIDENCE,
      run: runOf(mutated(report => control.change(report.checks.find(row => keyOfCheck(row) === 'upgrade:home-outside-target-preserved').evidence.actual))) }));
    const shortfall = structuredClone(COVERAGE_EVIDENCE);
    const file = Object.keys(shortfall.coverageSummary).find(name => name !== 'total');
    shortfall.coverageSummary[file].branches.pct = 99;
    const aggregate = structuredClone(COVERAGE_EVIDENCE);
    aggregate.coverageSummary.total.lines.total++;
    aggregate.coverageSummary.total.lines.covered++;
    const coverageCases = [
      { before: 'problems.push(...coverageEvidenceProblems(evidence));', after: '', evidence: undefined },
      { before: 'value.pct !== 100', after: 'false', evidence: shortfall },
      { before: "if (tables.get('total')[metric][count] !== sum)", after: 'if (false)', evidence: aggregate },
      { before: 'const framingProblems = tapFramingProblems(lines);', after: 'const framingProblems = [];',
        evidence: COVERAGE_EVIDENCE, run: tapRun(changedText(KNOWN_TAP, '# pass 41', '# pass 40')) },
      { before: `if (offset >= 41 && fields.get('error') !== "'not implemented: renderOutcome'")`, after: 'if (false)',
        evidence: COVERAGE_EVIDENCE, run: tapRun(changedText(KNOWN_TAP, FIRST_REASON, "error: 'unexpected owner loss'")) },
    ].map(value => ({ name: 'judgeInstallTransactionCoverage', run: tapRun(KNOWN_TAP), ...value }));
    for (const control of [...recoveryCases, ...homeCases, ...coverageCases]) {
      const judge = control.name === 'judgeInstallerRecovery' ? judgeRecovery : judgeCoverage;
      // The original rejection predicate must fail for this exact weakened copy.
      expect(judge(control.run, control.evidence).length).toBeGreaterThan(0);
      expect(source.split(control.before)).toHaveLength(2);
      const mutant = { exports: {} };
      require('node:vm').runInNewContext(source.replace(control.before, control.after), {
        module: mutant, require, process, Buffer, __dirname: path.resolve(__dirname, '..', 'scripts'),
      }, { filename: 'expect-red-decision-mutant.cjs', timeout: 1000 });
      expect(mutant.exports[control.name](control.run, control.evidence)).toEqual([]);
    }
    expect(recoveryCases.length + homeCases.length + coverageCases.length).toBe(16);
  });

  test('the reviewed 51-case render-only red is the known red', () => {
    expect(KNOWN_TAP.split(FIRST_REASON).length).toBeGreaterThan(2);
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP))).toEqual([]);
  });

  test('old skeleton evidence and any incomplete or changed case inventory are refused', () => {
    const old = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-known-red.tap.txt'), 'utf8');
    expect(judgeInstallTransactionCoverage(tapRun(old)).length).toBeGreaterThan(0);
    const lines = KNOWN_TAP.split('\n').filter(line => /^(not )?ok \d+ - /.test(line));
    expect(lines).toHaveLength(51);
    for (const line of lines) {
      for (const replacement of ['', line.replace(' - ', ' - unreviewed: '), `${line}\n${line}`]) {
        expect(judgeInstallTransactionCoverage(tapRun(changedText(KNOWN_TAP, line, replacement))).length).toBeGreaterThan(0);
      }
    }
  });

  test('TAP framing, terminal counts and bounded render failure diagnostics are mandatory', () => {
    for (const wrong of [
      changedText(KNOWN_TAP, 'TAP version 13', ''), `TAP version 13\n${KNOWN_TAP}`,
      changedText(KNOWN_TAP, '1..51', '1..50'), changedText(KNOWN_TAP, '1..51', '1..51\n1..51'),
      changedText(KNOWN_TAP, '# pass 41', '# pass 40'), changedText(KNOWN_TAP, '# skipped 0', '# skipped 1'),
      changedText(KNOWN_TAP, '# cancelled 0', '# cancelled 1'), changedText(KNOWN_TAP, '# todo 0', '# todo 1'),
      changedText(KNOWN_TAP, '# suites 0', '# suites 1'), changedText(KNOWN_TAP, '# tests 51', '# tests 50'),
      changedText(KNOWN_TAP, '# tests 51', '# unrelated\n# tests 51'),
      changedText(KNOWN_TAP, '  ...', '  broken-end'),
      changedText(KNOWN_TAP, "code: 'ERR_TEST_FAILURE'", "code: 'DIFFERENT_ERROR'"),
      changedText(KNOWN_TAP, "failureType: 'testCodeFailure'", "failureType: 'cancelledByParent'"),
      changedText(KNOWN_TAP, FIRST_REASON, "error: 'not implemented: acquireLock'"),
      changedText(KNOWN_TAP, FIRST_REASON, `${FIRST_REASON}\n  ${FIRST_REASON}`),
      `${KNOWN_TAP}\nBail out! incomplete`, `${KNOWN_TAP}\n    ok 1 - nested`,
    ]) expect(judgeInstallTransactionCoverage(tapRun(wrong)).length).toBeGreaterThan(0);
    const metadata = changedText(KNOWN_TAP, '  duration_ms:', "  futureMetadata: 'portable'\n  duration_ms:");
    expect(judgeInstallTransactionCoverage(tapRun(metadata))).toEqual([]);
  });

  test('only the actual error field can establish the permitted render failure', () => {
    const disguised = changedText(KNOWN_TAP, `  ${FIRST_REASON}`,
      `  futureMetadata: |-\n    ${FIRST_REASON}\n  error: 'unexpected owner loss'`);
    expect(judgeInstallTransactionCoverage(tapRun(disguised)).length).toBeGreaterThan(0);
  });

  test('a case failing for any reason other than an unbuilt operation is the wrong red', () => {
    const wrong = changedText(KNOWN_TAP, FIRST_REASON, "error: 'Expected values to be strictly equal'");
    const problems = judgeInstallTransactionCoverage(tapRun(wrong));
    expect(problems).toHaveLength(1);
    expect(problems[0].startsWith('failed for another reason: render:')).toBe(true);
  });

  test('a coverage shortfall on landed code is the wrong red, on either stream', () => {
    const shortfall = 'ERROR: Coverage for branches (88.88%) does not meet threshold (100%) for bin/lib/install-names.js';
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP, 1, `${shortfall}\n`))).toEqual([shortfall]);
    expect(judgeInstallTransactionCoverage(tapRun(`${KNOWN_TAP}\n${shortfall}\n`))).toEqual([shortfall]);
  });

  test('nothing failing, a crash with no summary, and a miscounted summary are all refused', () => {
    const green = KNOWN_TAP.split('\n').filter(line => !line.startsWith('# fail ')).join('\n');
    expect(judgeInstallTransactionCoverage(tapRun(`${green}\n# fail 0\n`, 0))[0]).toContain('UNEXPECTED PASS');
    expect(judgeInstallTransactionCoverage(tapRun('', 1, 'Error: Cannot find module'))[0]).toContain('Cannot find module');
    expect(judgeInstallTransactionCoverage(tapRun(changedText(KNOWN_TAP, '# fail 10', '# fail 11')))).toContain(
      'summary reports 11 failures, 10 found',
    );
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP, 7))).toEqual(['exit status 7, expected 1']);
  });
});

describe('expect-red: command line', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  test('Node capture preserves a complete structured report larger than one MiB', () => {
    const run = captureNode(['-e', 'process.stdout.write(JSON.stringify({text:"x".repeat(2*1024*1024)}))'], { timeout: 10000 });
    expect(run.error).toBeUndefined();
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout).text.length).toBe(2 * 1024 * 1024);
  });

  test('repository ESLint rejects unsafe code under both repaired CJS paths', async () => {
    const { ESLint } = require('eslint');
    const eslint = new ESLint({ cwd: path.resolve(__dirname, '..') });
    for (const filePath of ['scripts/expect-red.cjs', 'tests/acceptance/installer-recovery.cjs']) {
      const [unsafe] = await eslint.lintText('eval(process.argv[2]);\n', { filePath });
      expect(unsafe.messages.some(message => message.ruleId === 'security/detect-eval-with-expression' && message.severity === 2)).toBe(true);
      const [safe] = await eslint.lintText("const label = 'safe';\n", { filePath });
      expect(safe.errorCount).toBe(0);
    }
  });

  longTest('the actual Node CLI validates the live coverage gate through private c8 capture', () => {
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const run = captureNode(['scripts/expect-red.cjs', 'install-transaction-coverage'], {
      cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8', timeout: 360000,
    });
    expect(run.error).toBeUndefined();
    expect(run.status).toBe(0);
    expect(run.stderr).toContain('# tests 51');
    expect(run.stderr).toContain('# pass 41');
    expect(run.stderr).toContain('# fail 10');
    expect(run.stderr).toContain('failed for the known reason');
    const provenance = run.stderr.split('\n').find(line => line.startsWith('expect-red evidence: '));
    expect(provenance).toBeDefined();
    const evidence = JSON.parse(provenance.slice('expect-red evidence: '.length));
    expect(evidence.node).toBe(nodeRuntime().version);
    expect(evidence.platform).toBe(nodeRuntime().platform);
  }, 400000);

  test('coverage ignore directives in either watched module refuse before execution', () => {
    for (const module of ['install-names.js', 'install-transaction.js']) {
      for (const directive of ['c8 ignore next', 'v8 ignore next', 'istanbul ignore next',
        'node:coverage ignore next', 'node:coverage disable', 'node:coverage enable', '|8 ignore start']) {
        let spawned = false;
        const messages = [];
        const result = main(['install-transaction-coverage'], {
          packageJson, log: message => messages.push(message),
          runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
          fs: { ...fs, readFileSync(name, ...args) {
            const bytes = fs.readFileSync(name, ...args);
            return path.basename(name) === module ? Buffer.concat([Buffer.from(bytes), Buffer.from(`\n/* ${directive} */`)]) : bytes;
          } },
          spawnSync: () => { spawned = true; return { status: 1, stdout: '', stderr: '' }; },
        });
        expect(result).toBe(1);
        expect(spawned).toBe(false);
        expect(messages.join('\n')).toContain(module);
      }
    }
  });

  test('capture bounds execution and isolates inherited test and coverage configuration', () => {
    const previousContext = process.env.NODE_TEST_CONTEXT;
    const previousCoverage = process.env.NODE_V8_COVERAGE;
    process.env.NODE_TEST_CONTEXT = 'child-v8';
    process.env.NODE_V8_COVERAGE = 'unrelated-coverage';
    let inspected = false;
    try {
      main(['install-transaction-coverage'], {
        packageJson, log: () => {},
        runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
        spawnSync: (_exe, args, options) => {
          expect(options.env?.NODE_TEST_CONTEXT).toBeUndefined();
          const temp = args.find(value => value.startsWith('--temp-directory=')).slice('--temp-directory='.length);
          expect(options.env?.NODE_V8_COVERAGE).toBe(temp);
          expect(Number.isInteger(options.timeout)).toBe(true);
          expect(options.timeout).toBeGreaterThan(0);
          expect(options.timeout).toBeLessThanOrEqual(300000);
          const config = args.find(value => value.startsWith('--config='));
          expect(config).toBeDefined();
          expect(JSON.parse(fs.readFileSync(config.slice('--config='.length), 'utf8'))).toEqual({});
          inspected = true;
          return { status: 1, stdout: '', stderr: '' };
        },
      });
      expect(inspected).toBe(true);
    } finally {
      if (previousContext === undefined) delete process.env.NODE_TEST_CONTEXT;
      else process.env.NODE_TEST_CONTEXT = previousContext;
      if (previousCoverage === undefined) delete process.env.NODE_V8_COVERAGE;
      else process.env.NODE_V8_COVERAGE = previousCoverage;
    }
  });

  test('inherited Node options refuse before child execution for both gates', () => {
    const previous = process.env.NODE_OPTIONS;
    try {
      for (const option of ['--test', '--test-reporter=tap', '--test-name-pattern=only-one', '--experimental-test-isolation=none',
        '--require=./instrument.cjs', '-r ./instrument.cjs', '--import=./instrument.mjs',
        '--experimental-loader=./loader.mjs', '--loader=./loader.mjs', '--conditions=custom',
        '--enable-source-maps', '--max-old-space-size=4096']) {
        for (const gate of ['installer-recovery', 'install-transaction-coverage']) {
          process.env.NODE_OPTIONS = option;
          let spawned = false;
          const result = main([gate], {
            packageJson, log: () => {},
            runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
            spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
          });
          expect(result).toBe(1);
          expect(spawned).toBe(false);
        }
      }
      process.env.NODE_OPTIONS = '  ';
      let cleanEnvironment = false;
      expect(main(['installer-recovery'], {
        packageJson, log: () => {},
        runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
        spawnSync: (_exe, _args, options) => { cleanEnvironment = options.env.NODE_OPTIONS === undefined; return runOf(KNOWN_RED); },
      })).toBe(0);
      expect(cleanEnvironment).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.NODE_OPTIONS;
      else process.env.NODE_OPTIONS = previous;
    }
  });

  test('capture faults cannot pass or silently discard uncertain evidence', () => {
    const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
    for (const mode of ['missing', 'malformed', 'symlink', 'not-file', 'cleanup', 'timeout', 'signal',
      'spawn-throw', 'read-before', 'read-after', 'mkdir', 'scratch-link', 'scratch-not-directory', 'c8-version', 'c8-json']) {
      let scratch;
      let spawned = false;
      const messages = [];
      const fault = () => { throw Object.assign(new Error(`injected ${mode}`), { code: 'EACCES' }); };
      const fileSystem = { ...fs,
        mkdtempSync(prefix) { scratch = fs.mkdtempSync(prefix); return scratch; },
        mkdirSync(name) { if (mode === 'mkdir') fault(); return fs.mkdirSync(name); },
        readFileSync(name, ...args) {
          if (path.basename(path.dirname(name)) === 'c8' && path.basename(name) === 'package.json') {
            if (mode === 'c8-version') return '{}';
            if (mode === 'c8-json') return '{bad';
          }
          if (mode === 'read-before' || (mode === 'read-after' && spawned && path.basename(name) !== 'coverage-summary.json')) fault();
          if (path.basename(name) === 'coverage-summary.json') expect(path.dirname(path.dirname(name))).toBe(scratch);
          return fs.readFileSync(name, ...args);
        },
        lstatSync(name) {
          const stat = fs.lstatSync(name);
          if (path.basename(name) === 'coverage-summary.json') {
            if (mode === 'symlink') stat.isSymbolicLink = () => true;
            if (mode === 'not-file') stat.isFile = () => false;
          }
          if (name === scratch) {
            if (mode === 'scratch-link') stat.isSymbolicLink = () => true;
            if (mode === 'scratch-not-directory') stat.isDirectory = () => false;
          }
          return stat;
        },
        rmSync(name, options) { if (mode === 'cleanup') fault(); return fs.rmSync(name, options); },
      };
      try {
        const result = main(['install-transaction-coverage'], {
          packageJson, fs: fileSystem, log: message => messages.push(message),
          runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
          spawnSync: (_exe, args) => {
            spawned = true;
            if (mode === 'spawn-throw') fault();
            const reports = args.find(value => value.startsWith('--reports-dir=')).slice('--reports-dir='.length);
            const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
              name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
            ]));
            if (mode !== 'missing') fs.writeFileSync(path.join(reports, 'coverage-summary.json'), mode === 'malformed' ? '{broken' : JSON.stringify(nativeSummary));
            if (mode === 'timeout') return { status: null, stdout, stderr: '', error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) };
            if (mode === 'signal') return { status: null, stdout, stderr: '', signal: 'SIGTERM' };
            return { status: 1, stdout, stderr: '' };
          },
        });
        expect(result).toBe(1);
        if (['timeout', 'signal', 'spawn-throw', 'mkdir', 'cleanup', 'scratch-link', 'scratch-not-directory'].includes(mode)) {
          expect(fs.existsSync(scratch)).toBe(true);
          expect(messages.join('\n')).toContain(scratch);
        } else if (scratch) expect(fs.existsSync(scratch)).toBe(false);
      } finally {
        // No real child was launched. Only remove this test's exact recorded temp.
        if (scratch && fs.existsSync(scratch)) {
          expect(path.dirname(scratch)).toBe(path.resolve(__dirname, '..', '.claude'));
          expect(path.basename(scratch).startsWith('expect-red-')).toBe(true);
          fs.rmSync(scratch, { recursive: true });
        }
      }
    }
  });

  test('cleanup never removes a scratch path outside its exact ownership convention', () => {
    const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
    const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
      name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
    ]));
    for (const location of [['.claude', 'not-owned'], ['.planning', 'expect-red-foreign']]) {
      let removed = false;
      const messages = [];
      // Virtual paths only: the injected filesystem does not create or write them.
      const virtualPath = path.resolve(__dirname, '..', ...location);
      const result = main(['install-transaction-coverage'], {
        packageJson, log: message => messages.push(message),
        runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
        fs: { ...fs, mkdtempSync: () => virtualPath, mkdirSync() {}, writeFileSync() {},
          lstatSync: () => ({ isFile: () => true, isSymbolicLink: () => false }),
          readFileSync(name, ...args) {
            return path.basename(name) === 'coverage-summary.json' ? JSON.stringify(nativeSummary) : fs.readFileSync(name, ...args);
          },
          rmSync() { removed = true; },
        },
        spawnSync: () => ({ status: 1, stdout, stderr: '' }),
      });
      expect(result).toBe(1);
      expect(removed).toBe(false);
      expect(messages.join('\n')).toContain('scratch ownership mismatch');
    }
  });

  test('coverage capture uses a new private report and V8 directory on every invocation', () => {
    const seen = new Set();
    const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
    for (let index = 0; index < 2; index++) {
      let scratch;
      const messages = [];
      const result = main(['install-transaction-coverage'], {
        packageJson, log: message => messages.push(message),
        runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
        spawnSync: (_exe, args) => {
          const reportIndex = args.findIndex(value => value.startsWith('--reports-dir='));
          const tempIndex = args.findIndex(value => value.startsWith('--temp-directory='));
          expect(reportIndex).toBeGreaterThan(0);
          expect(tempIndex).toBeGreaterThan(0);
          expect(reportIndex).toBeLessThan(args.indexOf('node'));
          expect(tempIndex).toBeLessThan(args.indexOf('node'));
          const reports = args[reportIndex].slice('--reports-dir='.length);
          const v8 = args[tempIndex].slice('--temp-directory='.length);
          scratch = path.dirname(reports);
          expect(path.dirname(v8)).toBe(scratch);
          expect(seen.has(scratch)).toBe(false);
          seen.add(scratch);
          expect(fs.readdirSync(reports)).toEqual([]);
          expect(fs.readdirSync(v8)).toEqual([]);
          const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
            name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
          ]));
          fs.writeFileSync(path.join(reports, 'coverage-summary.json'), JSON.stringify(nativeSummary));
          return { status: 1, stdout, stderr: 'capture stderr retained' };
        },
      });
      expect(result).toBe(0);
      expect(fs.existsSync(scratch)).toBe(false);
      expect(messages.join('\n')).toContain('capture stderr retained');
    }
  });

  test('source or validator changes during capture invalidate the report', () => {
    for (const changed of ['bin/install.js', 'dist/bin/install.js', 'tests/acceptance/installer-recovery.cjs',
      'package.json', 'scripts/expect-red.cjs']) {
      let spawned = false;
      const messages = [];
      const fileSystem = { ...fs, readFileSync(name, ...args) {
        const bytes = fs.readFileSync(name, ...args);
        const relative = path.relative(path.resolve(__dirname, '..'), name).split(path.sep).join('/');
        return spawned && relative === changed ? Buffer.concat([Buffer.from(bytes), Buffer.from(' ')]) : bytes;
      } };
      const result = main(['installer-recovery'], {
        packageJson, fs: fileSystem, log: message => messages.push(message),
        runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
        spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
      });
      expect(result).toBe(1);
      expect(messages.join('\n')).toContain(changed);
    }
  });

  test('the package command is parsed from the same bytes as its evidence digest', () => {
    let spawned = false;
    const changed = structuredClone(packageJson);
    changed.scripts['test:acceptance:installer-recovery'] = 'node tests/other.cjs';
    const result = main(['installer-recovery'], {
      packageJson, log: () => {},
      runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
      fs: { ...fs, readFileSync(name, ...args) {
        return path.resolve(name) === path.resolve(__dirname, '..', 'package.json')
          ? Buffer.from(JSON.stringify(changed)) : fs.readFileSync(name, ...args);
      } },
      spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
    });
    expect(result).toBe(1);
    expect(spawned).toBe(false);
  });

  test('the runner prints source identities and runtime provenance with its verdict', () => {
    const messages = [];
    expect(main(['installer-recovery'], {
      packageJson, log: message => messages.push(message),
      runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
      spawnSync: () => runOf(KNOWN_RED),
    })).toBe(0);
    const line = messages.find(message => typeof message === 'string' && message.startsWith('expect-red evidence: '));
    expect(line).toBeDefined();
    const evidence = JSON.parse(line.slice('expect-red evidence: '.length));
    expect(evidence.node).toBe(capturedRecovery.node);
    expect(evidence.platform).toBe(capturedRecovery.platform);
    expect(Object.keys(evidence.sourceHashes).sort()).toEqual([
      'bin/install.js', 'dist/bin/install.js', 'package.json', 'scripts/expect-red.cjs', 'tests/acceptance/installer-recovery.cjs',
    ]);
    for (const digest of Object.values(evidence.sourceHashes)) expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });

  test('c8 executes the same explicit Node runtime that captured the evidence', () => {
    const selectedNode = path.resolve(__dirname, '..', '.claude', 'selected-node-runtime');
    let observed;
    main(['install-transaction-coverage'], {
      packageJson, log: () => {},
      runtime: { execPath: selectedNode, platform: process.platform, nodeVersion: process.version, isBun: false },
      spawnSync: (exe, args) => { observed = { exe, args }; return { status: 1, stdout: '', stderr: '' }; },
    });
    expect(observed.exe).toBe(selectedNode);
    expect(observed.args[observed.args.indexOf('--test') - 1]).toBe(selectedNode);
  });

  test('the production gate refuses Bun before spawning a child', () => {
    let spawned = false;
    const messages = [];
    const result = main(['installer-recovery'], {
      packageJson, log: message => messages.push(message),
      runtime: { execPath: process.execPath, platform: process.platform, nodeVersion: process.version, isBun: true },
      spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
    });
    expect(spawned).toBe(false);
    expect(result).toBe(1);
    expect(messages.join('\n')).toContain('Node');
  });

  test('the gate command is read from package.json, not copied', () => {
    expect(commandFor({ script: 'test:acceptance:installer-recovery' }, packageJson)).toEqual([
      'tests/acceptance/installer-recovery.cjs',
    ]);
    const coverage = commandFor({ script: 'test:coverage:install-transaction' }, packageJson);
    expect(coverage).toContain('--include=bin/lib/install-transaction.js');
    expect(coverage.some(argument => argument.includes("'"))).toBe(false);
    expect(() => commandFor({ script: 'test' }, { scripts: { test: 'bun test' } })).toThrow('plain "node <file>"');
    expect(() => commandFor({ script: 'absent' }, packageJson)).toThrow('absent');
  });

  test('package commands cannot weaken coverage or redirect the reviewed gate', () => {
    const script = 'test:coverage:install-transaction';
    const command = packageJson.scripts[script];
    for (const changed of [
      command.replace('--branches 100', '--branches 99'),
      command.replace('--all ', ''), command.replace('--per-file ', ''),
      command.replace('--reporter=json-summary ', ''),
      command.replace('--test-reporter=tap', '--test-reporter=spec'),
      command.replace('tests/coverage/install-transaction.test.cjs', 'tests/other.cjs'),
      `${command} --config=elsewhere.json`, `${command} --exclude=bin/lib/install-transaction.js`,
    ]) expect(() => commandFor({ script }, { scripts: { [script]: changed } })).toThrow();
    expect(() => commandFor({ script: 'test:acceptance:installer-recovery' }, {
      scripts: { 'test:acceptance:installer-recovery': 'node tests/other.cjs' },
    })).toThrow();
  });

  test('exits 0 on the known red, 1 on anything else, 2 on misuse', () => {
    const lines = [];
    const dependencies = result => ({ packageJson, log: line => lines.push(line), spawnSync: () => result,
      runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
    });
    expect(main(['installer-recovery'], dependencies(runOf(KNOWN_RED)))).toBe(0);
    expect(main(['installer-recovery'], dependencies(runOf(KNOWN_RED, 0)))).toBe(1);
    expect(main(['installer-recovery'], dependencies({ error: new Error('spawn ENOENT') }))).toBe(1);
    expect(main([], dependencies(runOf(KNOWN_RED)))).toBe(2);
    expect(main(['constructor'], dependencies(runOf(KNOWN_RED)))).toBe(2);
    expect(lines.join('\n')).toContain('Usage: node scripts/expect-red.cjs <installer-recovery|install-transaction-coverage>');
  });
});


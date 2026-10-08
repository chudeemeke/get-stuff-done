# P04/P05 repaired validator and approved section20 review
You have NO tools. Do not request, imitate or emit tool calls. Review only this packet and return a substantive final PASS / PASS WITH CHANGES / NOT PASS, followed by severity-ranked findings with source line, concrete counterexample, smallest repair and confidence. Maximum 2200 words. Do not claim execution, disk access or independent hash verification.
Owner explicitly requests Opus5 at xhigh. This is an independent read-only review of current dirty bytes in skin-campaign, branch chore/upstream-bump-1.9.1, HEAD e50bda5b. Review the supplied bytes, not HEAD.
Scope: strict expected-RED validators and approved bounded recovery harness/test repairs. Installer wrapper and unsafe lock remain unchanged. Lock protocol P07 is unapproved; no preflight/snapshot work. The installer intentionally fails exactly13 reviewed acceptance checks; the gate must reject any other failure, missing evidence, unexpected pass, changed inventory or weakened coverage. Do not treat these13 known defects as newly discovered implementation regressions.
Section20 was explicitly APPROVED by owner: exactly27 identities,14 requiredPASS and13 knownFAIL. Both home-outside-target-preserved rows retain complete independent before/after home-state maps. Preserve every owner path; permit ONLY four named Windows runtime directories and regular-file creation/update of StartupProfileData-NonInteractive, no deletion/type/symlink/broad cache exclusion. Linux/macOS have no runtime exceptions. All named app-data/cache variables must be private, including inherited case aliases; no real Claude target. Judge arguments unchanged. Full exact contract is appended.
Progress since previous review: complete positive/quarantine and error controls; cleanup failure emits rejected JSON and named retained fixture;64MiB test capture; all inherited nonempty NODE_OPTIONS rejected; independent twin root floor; context failure retains harness diagnostics; explicit Node identity and outer/inner timeout ordering; identity-based test mutation and guarded TAP replacements. No duplicate F8 digest schema: existing assertion-pass shape retained; independent comparison mutation proof remains an open review item. F11 redundant sentinels not claimed necessary. c8 installed source uses find-up config default overridden by fresh explicit --config; Node-specific coverage disable directives are not yet established.
Evidence, agent-measured, not reviewer-executed: native final capture27/14PASS/13FAIL,cleanup true, unchanged source hashes, retained fixture exact copy. Initial full focused76 tests passed. Later Node/c8 run78 tests passed and both executable files100% each metric. Subsequent Map refactor, Windows invalid-name validation and TAP test precondition changes have focused GREEN; final coverage/full-project suite must rerun for current bytes. Full lint current0errors/835warnings:815 existing elsewhere plus19 pre-existing validator warnings and1 harness warning; no new section20 warnings.16 validator decision mutants detected, plus actual-harness removed home comparison control. Native win32 Node24.20.0 only; no Node22/Linux/macOS acceptance or hosted CI claim. CI last18jobs zero steps, no push.
Judge code-local safety and test adequacy. Distinguish reproducible defects from defense-in-depth proposals, evidence gaps and policy changes. Account for the explicit approved runtime ownership; do not demand literal cache equality. No contract changes are silently authorized by recommendations.

## scripts/expect-red.cjs SHA256 49bc236f66d37fd5fc52bd67d6494cba00eabc89dc9689f1b0e2c486dc29f42f
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
99:   'fresh:home-outside-target-preserved', 'upgrade:home-outside-target-preserved',
100: ];
101: const RECOVERY_REQUIRED_FAIL = [
102:   ...INSTALLER_RECOVERY_SIGNATURE,
103:   'fresh:quarantine-path-printed', 'fresh:new-equals-twin-residue', 'fresh:moved-txt-lists-every-file',
104:   'upgrade:tree-deep-equal-outside-allowlist', 'upgrade:quarantine-path-printed',
105:   'upgrade:removed-file-quarantined-as-new', 'upgrade:edited-file-displaced', 'upgrade:moved-txt-lists-every-file',
106: ];
107: const RECOVERY_RESIDUE_ROOTS = {
108:   '.gsd-source': 'file', agents: 'dir', 'gsd-core': 'dir', 'gsd-migration-journal': 'dir',
109:   hooks: 'dir', 'package.json': 'file', scripts: 'dir', skills: 'dir',
110: };
111: 
112: function keyOf(check) {
113:   return `${check.scenario}:${check.id}`;
114: }
115: 
116: function linesOf(text) {
117:   return String(text || '').split(/\r?\n/);
118: }
119: 
120: function isObject(value) {
121:   return value !== null && typeof value === 'object' && !Array.isArray(value);
122: }
123: 
124: function hasKeys(value, keys) {
125:   return isObject(value) && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort());
126: }
127: 
128: function validRecoveryContext(context, platform) {
129:   if (!hasKeys(context, ['twin', 'upgrade']) || !hasKeys(context.twin, ['residue']) ||
130:       !hasKeys(context.upgrade, ['edited', 'removed']) || !isObject(context.twin.residue)) return false;
131:   const relativeName = name => typeof name === 'string' && name.length > 0 &&
132:     !/[\\:\x00-\x1f]/.test(name) && name.split('/').every(segment =>
133:       segment !== '' && segment !== '.' && segment !== '..' &&
134:       (platform !== 'win32' || !/[. ]$/.test(segment)));
135:   const identity = name => platform === 'darwin' ? name.normalize('NFC').toLowerCase()
136:     : platform === 'win32' ? name.toLowerCase() : name;
137:   const entries = Object.entries(context.twin.residue);
138:   if (!entries.length || !entries.some(([, type]) => type === 'file')) return false;
139:   if (!isDeepStrictEqual(Object.fromEntries(entries.filter(([name]) => !name.includes('/'))), RECOVERY_RESIDUE_ROOTS)) return false;
140:   const seen = new Set();
141:   for (const [name, type] of entries) {
142:     if (!relativeName(name) || !['file', 'dir', 'link'].includes(type) || seen.has(identity(name))) return false;
143:     seen.add(identity(name));
144:   }
145:   const { edited, removed } = context.upgrade;
146:   return relativeName(edited) && relativeName(removed) && identity(edited) !== identity(removed);
147: }
148: 
149: function recoveryObservation(check, context) {
150:   if (RECOVERY_REQUIRED_PASS.includes(keyOf(check))) return { kind: 'assertion-pass', actual: {} };
151:   // The complete context is validated before any observation is compared.
152:   const residue = context.twin.residue;
153:   switch (check.id) {
154:     case 'outcome-exact':
155:       return { kind: 'outcome-lines', actual: { lines: ['Rollback applied'] } };
156:     case 'top-level-exact-allowlist':
157:       return { kind: 'top-level-names', actual: { names: [
158:         '.gsd-source', 'agents', 'gsd-core', 'gsd-migration-journal', 'hooks',
159:         'owner.txt', 'package.json', 'scripts', 'settings.json', 'skills',
160:       ] } };
161:     case 'transaction-directory-shape':
162:       return { kind: 'transaction-state', actual: { state: 'absent' } };
163:     case 'quarantine-path-printed':
164:       return { kind: 'quarantine-reference', actual: { path: null } };
165:     case 'new-equals-twin-residue':
166:       return { kind: 'tree-delta', actual: { missing: Object.keys(residue).sort(), unexpected: [], changed: [] } };
167:     case 'tree-deep-equal-outside-allowlist':
168:       return { kind: 'tree-delta', actual: { missing: [], unexpected: [], changed: ['gsd-install-state.json'] } };
169:     case 'removed-file-quarantined-as-new':
170:       return { kind: 'entry-type', actual: { path: context.upgrade.removed, type: null } };
171:     case 'edited-file-displaced':
172:       return { kind: 'displaced-paths', actual: { paths: [] } };
173:     case 'moved-txt-lists-every-file':
174:       return { kind: 'moved-list', actual: {
175:         expected: check.scenario === 'fresh'
176:           ? Object.keys(residue).filter(name => residue[name] === 'file').sort()
177:           : [context.upgrade.removed],
178:         listed: [],
179:       } };
180:     default:
181:       return undefined;
182:   }
183: }
184: 
185: function validHomeObservation(evidence, platform) {
186:   if (!hasKeys(evidence, ['kind', 'actual']) || evidence.kind !== 'home-state' ||
187:       !hasKeys(evidence.actual, ['before', 'after'])) return false;
188:   const { before: beforeState, after: afterState } = evidence.actual;
189:   const identity = name => platform === 'darwin' ? name.normalize('NFC').toLowerCase()
190:     : platform === 'win32' ? name.toLowerCase() : name;
191:   for (const state of [beforeState, afterState]) {
192:     if (!isObject(state)) return false;
193:     const tree = new Map(Object.entries(state));
194:     const seen = new Set();
195:     for (const [name, value] of tree) {
196:       const segments = name.split('/');
197:       if (!name || /[\\:\x00-\x1f]/.test(name) || segments.some(segment =>
198:         !segment || segment === '.' || segment === '..' ||
199:         (platform === 'win32' && (/[. ]$/.test(segment) || /[<>"|?*]/.test(segment) ||
200:           /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment)))) ||
201:         identity(segments[0]) === identity('runtime with spaces') || seen.has(identity(name))) return false;
202:       seen.add(identity(name));
203:       if (typeof value !== 'string' || !(value === 'dir' || /^file:[a-f0-9]{64}$/.test(value) ||
204:         (value.startsWith('link:') && value.length > 5 && !value.includes('\0')))) return false;
205:       for (let length = 1; length < segments.length; length++) {
206:         const parent = segments.slice(0, length).join('/');
207:         if (tree.get(parent) !== 'dir') return false;
208:       }
209:     }
210:   }
211:   const before = new Map(Object.entries(beforeState));
212:   const after = new Map(Object.entries(afterState));
213:   const ownerFiles = {
214:     '.gsd/owner.json': '{"owner":"gsd home"}\n', '.codex/owner.txt': 'codex owner bytes\n',
215:     '.config/owner.txt': 'config owner bytes\n', 'AppData/Roaming/owner.txt': 'roaming owner bytes\n',
216:     'AppData/Local/owner.txt': 'local owner bytes\n',
217:   };
218:   for (const [name, bytes] of Object.entries(ownerFiles)) {
219:     if (before.get(name) !== `file:${createHash('sha256').update(bytes).digest('hex')}`) return false;
220:   }
221:   for (const name of ['other-owner/empty', '.cache', '.local/share']) if (before.get(name) !== 'dir') return false;
222:   const directories = new Set(['AppData/Local/Microsoft', 'AppData/Local/Microsoft/Windows',
223:     'AppData/Local/Microsoft/Windows/Caches', 'AppData/Local/Microsoft/Windows/PowerShell']);
224:   const runtimeFile = 'AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive';
225:   for (const name of new Set([...before.keys(), ...after.keys()])) {
226:     if (platform === 'win32' && directories.has(name)) {
227:       if (after.get(name) !== 'dir' || (before.has(name) && before.get(name) !== 'dir')) return false;
228:     } else if (platform === 'win32' && name === runtimeFile) {
229:       if (!/^file:[a-f0-9]{64}$/.test(after.get(name)) ||
230:         (before.has(name) && !/^file:[a-f0-9]{64}$/.test(before.get(name)))) return false;
231:     } else if (before.get(name) !== after.get(name)) return false;
232:   }
233:   return true;
234: }
235: 
236: // The installer leaves the child's files in the target and prints an unverified
237: // "Rollback applied" (blocker 1). Those two failures, in both scenarios, are the red.
238: function judgeInstallerRecovery(run, evidence) {
239:   if (!isObject(run) || typeof run.stdout !== 'string' || typeof run.stderr !== 'string') {
240:     return ['malformed run: stdout and stderr must be strings'];
241:   }
242:   if (run.error !== undefined || (run.signal !== undefined && run.signal !== null)) {
243:     return ['run has failure or malformed termination evidence'];
244:   }
245:   let report;
246:   try {
247:     report = JSON.parse(run.stdout);
248:   } catch {
249:     return [`no JSON report on stdout: ${String(run.stderr || run.stdout).slice(0, 300)}`];
250:   }
251:   if (!isObject(report)) return ['recovery report must be an object'];
252:   if (run.status === 0 || report.accepted === true) {
253:     return ['UNEXPECTED PASS: the gate is green. Remove its expect-red entry and run it as a plain gate (plan Step 5).'];
254:   }
255:   const problems = [];
256:   if (run.status !== 1) problems.push(`exit status ${run.status}, expected 1`);
257:   if (report.accepted !== false) problems.push('report must explicitly declare accepted: false');
258:   if (report.fixtureRemoved !== true) problems.push('fixture cleanup was not confirmed');
259:   if (report.harnessError) problems.push(`harness error: ${report.harnessError}`);
260:   const host = evidence?.host;
261:   if (!isObject(host) || !['win32', 'linux', 'darwin'].includes(host.platform) ||
262:       typeof host.nodeVersion !== 'string' || !/^v\d+\.\d+\.\d+$/.test(host.nodeVersion) ||
263:       report.platform !== host.platform || report.node !== host.nodeVersion) {
264:     problems.push('missing or mismatched host/runtime evidence');
265:   }
266:   if (!hasKeys(evidence?.sourceHashes, RECOVERY_SOURCES) || !hasKeys(report.sourceHashes, RECOVERY_SOURCES)) {
267:     problems.push('missing or unreviewed source identities');
268:   } else {
269:     for (const name of RECOVERY_SOURCES) {
270:       const digest = evidence.sourceHashes[name];
271:       if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest) || report.sourceHashes[name] !== digest) {
272:         problems.push(`missing, malformed or mismatched source digest: ${name}`);
273:       }
274:     }
275:   }
276:   if (!Array.isArray(report.checks)) return [...problems, 'checks must be an array'];
277:   const validContext = validRecoveryContext(report.context, report.platform);
278:   if (!validContext) problems.push('invalid independent recovery context');
279:   const checks = new Map();
280:   const expectedKeys = new Set([...RECOVERY_REQUIRED_PASS, ...RECOVERY_REQUIRED_FAIL]);
281:   for (const check of report.checks) {
282:     if (!isObject(check) || typeof check.scenario !== 'string' || typeof check.id !== 'string') {
283:       problems.push('malformed check identity');
284:       continue;
285:     }
286:     const key = keyOf(check);
287:     if (typeof check.ok !== 'boolean') problems.push(`check status must be boolean: ${key}`);
288:     if (check.ok === false && (typeof check.detail !== 'string' || !check.detail.trim())) {
289:       problems.push(`failed check has no diagnostic: ${key}`);
290:     }
291:     if (check.ok === true && Object.hasOwn(check, 'detail')) problems.push(`passing check has a failure detail: ${key}`);
292:     if (checks.has(key)) problems.push(`duplicate check: ${key}`);
293:     if (!expectedKeys.has(key)) problems.push(`unreviewed check: ${key}`);
294:     const expectedKind = INSTALLER_RECOVERY_HARNESS.includes(key) ? 'harness' : 'acceptance';
295:     if (check.kind !== expectedKind) problems.push(`wrong check kind: ${key}`);
296:     if (check.id === 'home-outside-target-preserved'
297:       ? !validHomeObservation(check.evidence, report.platform)
298:       : validContext && !isDeepStrictEqual(check.evidence, recoveryObservation(check, report.context))) {
299:       problems.push(`unexpected or incomplete observation: ${key}`);
300:     }
301:     checks.set(key, check);
302:   }
303:   const failedKeys = [...checks.values()].filter(check => check.ok === false).map(keyOf).sort();
304:   const declaredFailures = typeof report.failure === 'string' ? report.failure.split(',').map(key => key.trim()).sort() : [];
305:   if (!isDeepStrictEqual(declaredFailures, failedKeys)) problems.push('failure inventory does not match failed checks');
306:   for (const key of INSTALLER_RECOVERY_HARNESS) {
307:     if (!checks.get(key)?.ok) problems.push(`harness check did not pass: ${key}`);
308:   }
309:   for (const check of checks.values()) {
310:     if (check.kind === 'harness' && !check.ok) problems.push(`harness check failed: ${keyOf(check)}: ${check.detail}`);
311:   }
312:   for (const key of RECOVERY_REQUIRED_FAIL) {
313:     if (checks.get(key)?.ok !== false) problems.push(`known failure absent: ${key}`);
314:   }
315:   for (const key of RECOVERY_REQUIRED_PASS) {
316:     // Enforce safety independently: even adding this row to REQUIRED_FAIL cannot
317:     // make a failed safety check acceptable. Conflicting lists cannot both pass.
318:     if (checks.get(key)?.ok !== true) problems.push(`required preservation check did not pass: ${key}`);
319:   }
320:   return [...new Set(problems)];
321: }
322: 
323: function tapFramingProblems(lines) {
324:   const bad = message => [`invalid TAP framing: ${message}`];
325:   if (lines[0] !== 'TAP version 13') return bad('missing initial version');
326:   let cursor = 1;
327:   for (const [offset, name] of COVERAGE_CASES.entries()) {
328:     if (lines[cursor]?.startsWith('# Subtest: ')) {
329:       if (lines[cursor++] !== `# Subtest: ${name}`) return bad('unreviewed subtest');
330:     }
331:     const result = `${offset < 41 ? 'ok' : 'not ok'} ${offset + 1} - ${name}`;
332:     if (lines[cursor++] !== result) return bad('unexpected case or result');
333:     if (lines[cursor++] !== '  ---') return bad('missing diagnostic start');
334:     const fields = new Map();
335:     while (cursor < lines.length && lines[cursor] !== '  ...') {
336:       const line = lines[cursor++];
337:       if (!line.startsWith('  ')) return bad('unterminated diagnostic block');
338:       const field = /^  ([A-Za-z_]+):\s*(.*)$/.exec(line);
339:       if (field) {
340:         if (fields.has(field[1])) return bad(`duplicate diagnostic field: ${field[1]}`);
341:         fields.set(field[1], field[2]);
342:       }
343:     }
344:     if (lines[cursor++] !== '  ...') return bad('unterminated diagnostic block');
345:     if (offset >= 41 && (fields.get('failureType') !== "'testCodeFailure'" ||
346:         fields.get('code') !== "'ERR_TEST_FAILURE'")) return bad('wrong failure type or code');
347:     if (offset >= 41 && fields.get('error') !== "'not implemented: renderOutcome'") {
348:       return [`failed for another reason: ${name}`];
349:     }
350:     if (offset < 41 && ['error', 'failureType', 'code'].some(key => fields.has(key))) {
351:       return bad('passing case contains a failure');
352:     }
353:   }
354:   const terminal = ['1..51', '# tests 51', '# suites 0', '# pass 41', '# fail 10',
355:     '# cancelled 0', '# skipped 0', '# todo 0'];
356:   for (const line of terminal) if (lines[cursor++] !== line) return bad(`missing terminal ${line}`);
357:   if (lines[cursor]?.startsWith('# duration_ms ')) {
358:     if (!/^# duration_ms \d+(\.\d+)?$/.test(lines[cursor++])) return bad('invalid duration');
359:   }
360:   // c8's presentation table is ancillary; all numeric coverage comes from JSON.
361:   for (const line of lines.slice(cursor)) {
362:     if (/^\s*(TAP version|(?:not )?ok \d+|1\.\.|# |Bail out!)/.test(line)) return bad('TAP token after terminal summary');
363:     if (line && !line.includes('|') && !line.startsWith('ERROR: Coverage')) return bad('unexpected trailing output');
364:   }
365:   return [];
366: }
367: 
368: function coverageEvidenceProblems(evidence) {
369:   const platform = evidence?.host?.platform;
370:   if (!['win32', 'linux', 'darwin'].includes(platform) || typeof evidence?.projectRoot !== 'string' ||
371:       !isObject(evidence.coverageSummary)) return ['missing or malformed coverage evidence'];
372:   const paths = platform === 'win32' ? path.win32 : path.posix;
373:   if (!paths.isAbsolute(evidence.projectRoot)) return ['coverage project root must be absolute'];
374:   const identity = name => {
375:     const normalized = paths.normalize(name);
376:     return platform === 'win32' ? normalized.toLowerCase()
377:       : platform === 'darwin' ? normalized.normalize('NFC').toLowerCase() : normalized;
378:   };
379:   const expected = ['bin/lib/install-names.js', 'bin/lib/install-transaction.js']
380:     .map(name => identity(paths.join(evidence.projectRoot, name)));
381:   const tables = new Map();
382:   for (const [name, table] of Object.entries(evidence.coverageSummary)) {
383:     const spelling = platform === 'win32' ? name.replaceAll('/', '\\') : name;
384:     if (spelling !== paths.normalize(spelling)) return [`noncanonical coverage file alias: ${name}`];
385:     const key = name === 'total' ? name : identity(name);
386:     if (name !== 'total' && (!paths.isAbsolute(name) || !expected.includes(key))) {
387:       return [`unreviewed coverage file: ${name}`];
388:     }
389:     if (tables.has(key)) return [`duplicate coverage file identity: ${name}`];
390:     tables.set(key, table);
391:   }
392:   if (tables.size !== 3 || !tables.has('total') || expected.some(name => !tables.has(name))) {
393:     return ['coverage must include total and both reviewed files'];
394:   }
395:   const metrics = ['lines', 'statements', 'functions', 'branches'];
396:   const problems = [];
397:   for (const [name, table] of tables) {
398:     if (!isObject(table) || Object.keys(table).some(key => ![...metrics, 'branchesTrue'].includes(key))) {
399:       problems.push(`malformed coverage table: ${name}`);
400:       continue;
401:     }
402:     for (const metric of metrics) {
403:       const value = table[metric];
404:       if (!hasKeys(value, ['total', 'covered', 'skipped', 'pct']) ||
405:           !Number.isSafeInteger(value.total) || value.total <= 0 || value.covered !== value.total ||
406:           value.skipped !== 0 || value.pct !== 100) {
407:         problems.push(`coverage must be complete and 100%: ${name} ${metric}`);
408:       }
409:     }
410:   }
411:   if (!problems.length) {
412:     for (const metric of metrics) {
413:       for (const count of ['total', 'covered', 'skipped']) {
414:         const sum = expected.reduce((total, name) => total + tables.get(name)[metric][count], 0);
415:         if (tables.get('total')[metric][count] !== sum) problems.push(`coverage aggregate mismatch: ${metric} ${count}`);
416:       }
417:     }
418:   }
419:   return problems;
420: }
421: 
422: // Only the ten reviewed render cases remain unimplemented. Every landed case and
423: // the complete TAP envelope must still pass; coverage evidence is a separate proof.
424: function judgeInstallTransactionCoverage(run, evidence) {
425:   if (!isObject(run) || typeof run.stdout !== 'string' || typeof run.stderr !== 'string') {
426:     return ['malformed run: stdout and stderr must be strings'];
427:   }
428:   if (run.error !== undefined || (run.signal !== undefined && run.signal !== null)) {
429:     return ['run has failure or malformed termination evidence'];
430:   }
431:   const lines = linesOf(run.stdout);
432:   const framingProblems = tapFramingProblems(lines);
433:   const count = label => Number(lines.find(line => line.startsWith(`# ${label} `))?.slice(label.length + 3));
434:   const failed = count('fail');
435:   if (!Number.isInteger(failed) || !Number.isInteger(count('pass'))) {
436:     return [`no TAP summary on stdout: ${String(run.stderr || run.stdout).slice(0, 300)}`];
437:   }
438:   if (run.status === 0 || failed === 0) {
439:     return ['UNEXPECTED PASS: no case fails. Remove this expect-red entry and run the gate as a plain gate (plan Step 5).'];
440:   }
441:   const problems = [];
442:   problems.push(...coverageEvidenceProblems(evidence));
443:   problems.push(...framingProblems);
444:   if (run.status !== 1) problems.push(`exit status ${run.status}, expected 1`);
445:   const starts = lines.flatMap((line, index) => (/^(not )?ok \d+ - /.test(line) ? [index] : []));
446:   if (starts.length !== COVERAGE_CASES.length) problems.push('case inventory must contain exactly the reviewed 51 cases');
447:   for (const [offset, start] of starts.entries()) {
448:     const expected = `${offset < 41 ? 'ok' : 'not ok'} ${offset + 1} - ${COVERAGE_CASES[offset]}`;
449:     if (lines[start] !== expected) problems.push(`unreviewed case identity or result: ${lines[start]}`);
450:   }
451:   const failures = starts.filter(index => lines[index].startsWith('not ok '));
452:   if (failures.length !== failed) problems.push(`summary reports ${failed} failures, ${failures.length} found`);
453:   for (const line of [...linesOf(run.stderr), ...lines]) {
454:     if (line.includes('ERROR: Coverage')) problems.push(line.trim());
455:   }
456:   return problems;
457: }
458: 
459: const KNOWN_REDS = {
460:   'installer-recovery': { script: 'test:acceptance:installer-recovery', judge: judgeInstallerRecovery },
461:   'install-transaction-coverage': { script: 'test:coverage:install-transaction', judge: judgeInstallTransactionCoverage },
462: };
463: 
464: // The command comes from package.json so this wrapper and the package script cannot drift.
465: // Package scripts quote glob-like arguments for the shell; no shell runs here.
466: function commandFor(gate, packageJson) {
467:   const command = packageJson.scripts?.[gate.script];
468:   if (typeof command !== 'string' || !command.startsWith('node ')) {
469:     throw new Error(`package script ${gate.script} must be a plain "node <file>" command, saw ${JSON.stringify(command)}`);
470:   }
471:   const args = command.split(' ').slice(1).map(argument => argument.replace(/^'(.*)'$/, '$1'));
472:   const expected = gate.script === 'test:acceptance:installer-recovery' ? ['tests/acceptance/installer-recovery.cjs'] : [
473:     'node_modules/c8/bin/c8.js', '--all', '--per-file', '--include=bin/lib/install-names.js',
474:     '--include=bin/lib/install-transaction.js', '--check-coverage', '--statements', '100', '--branches', '100',
475:     '--functions', '100', '--lines', '100', '--reporter=text', '--reporter=json-summary',
476:     'node', '--test', '--test-reporter=tap', 'tests/coverage/install-transaction.test.cjs',
477:   ];
478:   if (!['test:acceptance:installer-recovery', 'test:coverage:install-transaction'].includes(gate.script) ||
479:       !isDeepStrictEqual(args, expected)) throw new Error(`unreviewed package gate command: ${gate.script}`);
480:   return args;
481: }
482: 
483: function main(args = process.argv.slice(2), dependencies = {}) {
484:   const spawn = dependencies.spawnSync || spawnSync;
485:   let packageJson;
486:   const log = dependencies.log || (message => process.stderr.write(`${message}\n`));
487:   const fileSystem = dependencies.fs || fs;
488:   const runtime = dependencies.runtime || {
489:     execPath: process.execPath, platform: process.platform, nodeVersion: process.version, isBun: Boolean(process.versions.bun),
490:   };
491:   const gate = Object.hasOwn(KNOWN_REDS, args[0]) ? KNOWN_REDS[args[0]] : undefined;
492:   if (args.length !== 1 || !gate) {
493:     log(`Usage: node scripts/expect-red.cjs <${Object.keys(KNOWN_REDS).join('|')}>`);
494:     return 2;
495:   }
496:   if (runtime.isBun) {
497:     log('expect-red: run this gate under Node; Bun evidence is not accepted');
498:     return 1;
499:   }
500:   if ((process.env.NODE_OPTIONS || '').trim()) {
501:     log('expect-red: NODE_OPTIONS must be unset for isolated evidence capture');
502:     return 1;
503:   }
504:   let evidence;
505:   let capturedHashes;
506:   const digestFile = name => createHash('sha256')
507:     .update(fileSystem.readFileSync(path.join(PROJECT_ROOT, name))).digest('hex');
508:   const recovery = args[0] === 'installer-recovery';
509:   try {
510:     const sourceBytes = Object.fromEntries([...(recovery ? RECOVERY_SOURCES : COVERAGE_SOURCES), 'package.json', 'scripts/expect-red.cjs']
511:       .map(name => [name, fileSystem.readFileSync(path.join(PROJECT_ROOT, name))]));
512:     if (!recovery) {
513:       for (const name of COVERAGE_SOURCES.slice(0, 2)) {
514:         if (/(?:c8|v8|istanbul)\s+ignore\b/i.test(sourceBytes[name].toString('utf8'))) {
515:           throw new Error(`coverage ignore directive in ${name}`);
516:         }
517:       }
518:     }
519:     capturedHashes = Object.fromEntries(Object.entries(sourceBytes)
520:       .map(([name, bytes]) => [name, createHash('sha256').update(bytes).digest('hex')]));
521:     packageJson = JSON.parse(sourceBytes['package.json'].toString('utf8'));
522:     if (dependencies.packageJson && !isDeepStrictEqual(dependencies.packageJson, packageJson)) {
523:       throw new Error('injected package.json does not match captured bytes');
524:     }
525:     const tools = { node: runtime.nodeVersion };
526:     if (!recovery) {
527:       tools.c8 = JSON.parse(fileSystem.readFileSync(path.join(PROJECT_ROOT, 'node_modules/c8/package.json'), 'utf8')).version;
528:       if (typeof tools.c8 !== 'string' || !tools.c8) throw new Error('missing c8 version evidence');
529:     }
530:     log(`expect-red evidence: ${JSON.stringify({ node: runtime.nodeVersion, platform: runtime.platform, tools, sourceHashes: capturedHashes })}`);
531:     if (recovery) {
532:       evidence = {
533:         host: { platform: runtime.platform, nodeVersion: runtime.nodeVersion },
534:         sourceHashes: Object.fromEntries(RECOVERY_SOURCES.map(name => [name, capturedHashes[name]])),
535:       };
536:     }
537:   } catch (error) {
538:     log(`expect-red: could not read source evidence: ${error.message}`);
539:     return 1;
540:   }
541:   let scratch;
542:   let reports;
543:   let run;
544:   const problems = [];
545:   try {
546:     const command = commandFor(gate, packageJson);
547:     const env = { ...process.env };
548:     delete env.NODE_TEST_CONTEXT;
549:     delete env.NODE_V8_COVERAGE;
550:     delete env.NODE_OPTIONS;
551:     if (!recovery) {
552:       scratch = fileSystem.mkdtempSync(path.join(PROJECT_ROOT, '.claude', 'expect-red-'));
553:       reports = path.join(scratch, 'reports');
554:       const v8 = path.join(scratch, 'v8');
555:       fileSystem.mkdirSync(reports);
556:       fileSystem.mkdirSync(v8);
557:       const config = path.join(scratch, 'c8.json');
558:       fileSystem.writeFileSync(config, '{}', { flag: 'wx' });
559:       env.NODE_V8_COVERAGE = v8;
560:       const childIndex = command.indexOf('node');
561:       command[childIndex] = runtime.execPath;
562:       command.splice(childIndex, 0, `--reports-dir=${reports}`, `--temp-directory=${v8}`, `--config=${config}`);
563:     }
564:     run = spawn(runtime.execPath, command, {
565:       cwd: PROJECT_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
566:       timeout: 300000, env,
567:     });
568:     // Print both streams even when the child fails. Neither stream is acceptance.
569:     log(run.stdout);
570:     log(run.stderr);
571:     if (run.error || run.signal) {
572:       problems.push(`gate execution failed: ${run.error?.message || run.signal}`);
573:     } else {
574:       if (!recovery) {
575:         const summaryPath = path.join(reports, 'coverage-summary.json');
576:         const stat = fileSystem.lstatSync(summaryPath);
577:         if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('coverage summary must be a plain file');
578:         evidence = { projectRoot: PROJECT_ROOT, host: { platform: runtime.platform },
579:           coverageSummary: JSON.parse(fileSystem.readFileSync(summaryPath, 'utf8')) };
580:       }
581:       problems.push(...gate.judge(run, evidence));
582:     }
583:   } catch (error) {
584:     problems.push(`could not capture gate evidence: ${error.message}`);
585:   } finally {
586:     if (scratch) {
587:       if (!run || run.error || run.signal) {
588:         problems.push(`retained private scratch; child quiescence not established: ${scratch}`);
589:       } else {
590:         try {
591:           if (path.dirname(scratch) !== path.join(PROJECT_ROOT, '.claude') ||
592:               !path.basename(scratch).startsWith('expect-red-')) throw new Error('scratch ownership mismatch');
593:           const stat = fileSystem.lstatSync(scratch);
594:           if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('scratch is not the owned directory');
595:           fileSystem.rmSync(scratch, { recursive: true, maxRetries: 2, retryDelay: 50 });
596:         } catch (error) {
597:           problems.push(`private scratch cleanup failed: ${scratch}: ${error.message}`);
598:         }
599:       }
600:     }
601:   }
602:   if (capturedHashes) {
603:     for (const [name, digest] of Object.entries(capturedHashes)) {
604:       try {
605:         if (digestFile(name) !== digest) problems.push(`source changed during capture: ${name}`);
606:       } catch (error) {
607:         problems.push(`could not recheck source ${name}: ${error.message}`);
608:       }
609:     }
610:   }
611:   if (problems.length) {
612:     log(`expect-red ${args[0]}: NOT the known red`);
613:     for (const problem of problems) log(`  - ${problem}`);
614:     return 1;
615:   }
616:   log(`expect-red ${args[0]}: failed for the known reason, as expected until the fix lands`);
617:   return 0;
618: }
619: 
620: if (require.main === module) {
621:   process.exitCode = main();
622: }
623: 
624: module.exports = {
625:   INSTALLER_RECOVERY_HARNESS,
626:   INSTALLER_RECOVERY_SIGNATURE,
627:   KNOWN_REDS,
628:   commandFor,
629:   judgeInstallTransactionCoverage,
630:   judgeInstallerRecovery,
631:   main,
632: };

## tests/acceptance/installer-recovery.cjs SHA256 444a786ec8312b43560ca889c671c3867390d018e47e68e4f657d07cfcf95d58
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
28: const HOME_OWNER_FILES = {
29:   '.gsd/owner.json': '{"owner":"gsd home"}\n',
30:   '.codex/owner.txt': 'codex owner bytes\n',
31:   '.config/owner.txt': 'config owner bytes\n',
32:   'AppData/Roaming/owner.txt': 'roaming owner bytes\n',
33:   'AppData/Local/owner.txt': 'local owner bytes\n',
34: };
35: const OUTCOME = /^Rollback applied: GSD roots restored to their state at (\S.*) and verified$/;
36: const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
37: 
38: const report = { platform: process.platform, node: process.version, accepted: false, checks: [], context: {} };
39: 
40: class ScenarioAborted extends Error {}
41: 
42: function record(scenario, kind, id, fn) {
43:   let evidence;
44:   const observe = (observationKind, actual) => { evidence = { kind: observationKind, actual }; };
45:   try {
46:     fn(observe);
47:     report.checks.push({ scenario, kind, id, ok: true, evidence: evidence || { kind: 'assertion-pass', actual: {} } });
48:     return true;
49:   } catch (error) {
50:     if (!evidence || error.code !== 'ERR_ASSERTION') {
51:       evidence = { kind: 'observation-error', actual: { code: error.code || null, message: String(error.message) } };
52:     }
53:     report.checks.push({ scenario, kind, id, ok: false, evidence,
54:       detail: String(error.message).replace(ANSI, '').slice(0, 600) });
55:     return false;
56:   }
57: }
58: 
59: // A harness check proves the scenario ran as designed; without it nothing later means anything.
60: function harness(scenario, id, fn) {
61:   if (!record(scenario, 'harness', id, fn)) throw new ScenarioAborted(`${scenario}:${id}`);
62: }
63: 
64: function accept(scenario, id, fn) {
65:   record(scenario, 'acceptance', id, fn);
66: }
67: 
68: function digestOf(bytes) {
69:   return crypto.createHash('sha256').update(bytes).digest('hex');
70: }
71: 
72: // Own walker: type, SHA-256, link targets, and every directory so empty ones count.
73: function snapshotTree(root, excludedRoot) {
74:   const entries = {};
75:   const pending = [''];
76:   while (pending.length) {
77:     const relative = pending.pop();
78:     for (const name of fs.readdirSync(path.join(root, relative))) {
79:       const child = relative ? `${relative}/${name}` : name;
80:       if (child === excludedRoot) continue;
81:       const absolute = path.join(root, child);
82:       const stat = fs.lstatSync(absolute);
83:       if (stat.isSymbolicLink()) entries[child] = `link:${fs.readlinkSync(absolute)}`;
84:       else if (stat.isDirectory()) {
85:         entries[child] = 'dir';
86:         pending.push(child);
87:       } else entries[child] = `file:${digestOf(fs.readFileSync(absolute))}`;
88:     }
89:   }
90:   return entries;
91: }
92: 
93: function typesOnly(tree) {
94:   return Object.fromEntries(Object.entries(tree).map(([name, value]) => [name, value.split(':')[0]]));
95: }
96: 
97: function without(tree, topLevelName) {
98:   return Object.fromEntries(Object.entries(tree)
99:     .filter(([name]) => name !== topLevelName && !name.startsWith(`${topLevelName}/`)));
100: }
101: 
102: function assertSameTree(actual, expected, label, observe) {
103:   const missing = Object.keys(expected).filter(name => !(name in actual)).sort();
104:   const unexpected = Object.keys(actual).filter(name => !(name in expected)).sort();
105:   const changed = Object.keys(expected).filter(name => name in actual && actual[name] !== expected[name]).sort();
106:   observe('tree-delta', { missing, unexpected, changed });
107:   if (missing.length + unexpected.length + changed.length === 0) return;
108:   const show = list => `${list.length}${list.length ? ` (${list.slice(0, 6).join(', ')})` : ''}`;
109:   assert.fail(`${label}: missing ${show(missing)}; unexpected ${show(unexpected)}; changed ${show(changed)}`);
110: }
111: 
112: function createFixture(name) {
113:   const home = path.join(scratch, `${name} home`);
114:   const target = path.join(home, 'runtime with spaces');
115:   fs.mkdirSync(target, { recursive: true });
116:   for (const [file, content] of Object.entries(OWNER_FILES)) fs.writeFileSync(path.join(target, file), content);
117:   for (const [file, content] of Object.entries(HOME_OWNER_FILES)) {
118:     fs.mkdirSync(path.dirname(path.join(home, file)), { recursive: true });
119:     fs.writeFileSync(path.join(home, file), content);
120:   }
121:   fs.mkdirSync(path.join(home, 'other-owner', 'empty'), { recursive: true });
122:   for (const relative of ['.cache', '.local/share']) fs.mkdirSync(path.join(home, relative), { recursive: true });
123:   return { name, home, target };
124: }
125: 
126: function snapshotOutsideTarget(fixture) {
127:   return snapshotTree(fixture.home, path.relative(fixture.home, fixture.target).replaceAll('\\', '/'));
128: }
129: 
130: function assertHomePreserved(after, before, observe) {
131:   observe('home-state', { before, after });
132:   const runtimeDirectories = [
133:     'AppData/Local/Microsoft', 'AppData/Local/Microsoft/Windows',
134:     'AppData/Local/Microsoft/Windows/Caches', 'AppData/Local/Microsoft/Windows/PowerShell',
135:   ];
136:   const runtimeFile = 'AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive';
137:   for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
138:     if (process.platform === 'win32' && runtimeDirectories.includes(name)) {
139:       assert.equal(after[name], 'dir', `runtime directory: ${name}`);
140:       assert.ok(before[name] === undefined || before[name] === 'dir', `runtime directory before: ${name}`);
141:     } else if (process.platform === 'win32' && name === runtimeFile) {
142:       assert.match(after[name] || '', /^file:[a-f0-9]{64}$/, `runtime file: ${name}`);
143:       assert.ok(before[name] === undefined || /^file:[a-f0-9]{64}$/.test(before[name]), `runtime file before: ${name}`);
144:     } else assert.equal(after[name], before[name], `home outside target: ${name}`);
145:   }
146: }
147: 
148: // Inject only at the first manifest publication in the real upstream child, after
149: // materialization has started. The wrapper's recovery is not mocked. The trace is a
150: // lower bound: synchronous path-based calls only.
151: function writeInjection(fixture) {
152:   const preload = path.join(scratch, `${fixture.name} inject write failure.cjs`);
153:   const traceFile = path.join(scratch, `${fixture.name}-write-trace.json`);
154:   fs.writeFileSync(preload, `
155:     const fs = require('node:fs');
156:     const path = require('node:path');
157:     if (path.resolve(process.argv[1]) === ${JSON.stringify(upstream)}) {
158:       const write = fs.writeFileSync;
159:       const trace = [];
160:       const home = ${JSON.stringify(fixture.home)};
161:       const methods = { writeFileSync: [0], copyFileSync: [1], appendFileSync: [0],
162:         unlinkSync: [0], rmSync: [0], rmdirSync: [0], mkdirSync: [0], renameSync: [0, 1] };
163:       for (const [method, indices] of Object.entries(methods)) {
164:         const original = fs[method];
165:         fs[method] = function(...args) {
166:           const paths = indices.flatMap(index => {
167:             if (typeof args[index] !== 'string') return [];
168:             const absolute = path.resolve(args[index]);
169:             return absolute.startsWith(home + path.sep) ? [path.relative(home, absolute).replaceAll('\\\\', '/')] : [];
170:           });
171:           try {
172:             if (method === 'writeFileSync' && typeof args[0] === 'string' && path.resolve(args[0]) === ${JSON.stringify(path.join(fixture.target, 'gsd-file-manifest.json'))}) {
173:               throw new Error(${JSON.stringify(INJECTED)});
174:             }
175:             const result = original.apply(this, args);
176:             if (paths.length) trace.push({ method, paths, completed: true });
177:             return result;
178:           } catch (error) {
179:             if (paths.length) trace.push({ method, paths, completed: false });
180:             throw error;
181:           }
182:         };
183:       }
184:       process.on('exit', () => write(${JSON.stringify(traceFile)}, JSON.stringify(trace)));
185:     }
186:   `);
187:   return { preload, traceFile };
188: }
189: 
190: function run(script, fixture, injection) {
191:   const privateEnv = {
192:     HOME: fixture.home, USERPROFILE: fixture.home,
193:     GSD_HOME: path.join(fixture.home, '.gsd'), CLAUDE_CONFIG_DIR: fixture.target,
194:     CODEX_HOME: path.join(fixture.home, '.codex'), XDG_CONFIG_HOME: path.join(fixture.home, '.config'),
195:     APPDATA: path.join(fixture.home, 'AppData/Roaming'), LOCALAPPDATA: path.join(fixture.home, 'AppData/Local'),
196:     XDG_CACHE_HOME: path.join(fixture.home, '.cache'), XDG_DATA_HOME: path.join(fixture.home, '.local/share'),
197:     TEMP: scratch, TMP: scratch,
198:   };
199:   const replaced = new Set([...Object.keys(privateEnv), 'GSD_TEST_MODE', 'GSD_PROJECT_DIR', 'GSD_WORKSTREAM',
200:     'NODE_OPTIONS', 'FORCE_COLOR', 'PSMODULEANALYSISCACHEPATH']);
201:   const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !replaced.has(key.toUpperCase())));
202:   Object.assign(env, privateEnv);
203:   if (injection) env.NODE_OPTIONS = `--require ${JSON.stringify(injection.preload)}`;
204:   const started = Date.now();
205:   const result = spawnSync(process.execPath, [script, '--claude', '--global', '--config-dir', fixture.target], {
206:     cwd: scratch, env, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024,
207:   });
208:   const output = `${result.stdout || ''}\n${result.stderr || ''}`.replace(ANSI, '');
209:   return { result, output, started, finished: Date.now() };
210: }
211: 
212: function readTrace(injection) {
213:   return fs.existsSync(injection.traceFile) ? JSON.parse(fs.readFileSync(injection.traceFile, 'utf8')) : [];
214: }
215: 
216: // Independent source for "exactly the residue": the same failure-injected child,
217: // without the wrapper, against a twin fixture.
218: function measureTwin() {
219:   const scenario = 'twin';
220:   const details = report[scenario] = {};
221:   const twin = createFixture('twin');
222:   const injection = writeInjection(twin);
223:   const before = snapshotTree(twin.target);
224:   const attempt = run(upstream, twin, injection);
225:   harness(scenario, 'child-failed-at-injection', () => {
226:     assert.equal(attempt.result.error, undefined);
227:     assert.ok(attempt.output.includes(INJECTED), 'twin child never reached the injected write');
228:     assert.notEqual(attempt.result.status, 0);
229:   });
230:   const after = snapshotTree(twin.target);
231:   const residue = typesOnly(Object.fromEntries(Object.entries(after).filter(([name]) => !(name in before))));
232:   report.context.twin = { residue };
233:   const changed = Object.keys(before).filter(name => after[name] !== before[name]).sort();
234:   // Files the trace saw the child write one by one. The child also places whole
235:   // directories with fs.cpSync, which the trace cannot attribute to a file.
236:   const prefix = `${path.relative(twin.home, twin.target).replaceAll('\\', '/')}/`;
237:   const traced = new Set(readTrace(injection).filter(event => event.completed)
238:     .flatMap(event => event.paths).filter(name => name.startsWith(prefix)).map(name => name.slice(prefix.length)));
239:   const tracedFiles = Object.keys(residue).filter(name => residue[name] === 'file' && name.includes('/') && traced.has(name)).sort();
240:   details.residueEntries = Object.keys(residue).length;
241:   details.changed = changed;
242:   details.tracedFiles = tracedFiles.length;
243:   harness(scenario, 'residue-non-empty', () => assert.ok(Object.keys(residue).length > 0));
244:   return { residue, changed, tracedFiles };
245: }
246: 
247: function assertOutcome(scenario, details, attempt) {
248:   accept(scenario, 'status-is-1', () => assert.equal(attempt.result.status, 1));
249:   accept(scenario, 'outcome-exact', observe => {
250:     const lines = attempt.output.split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith('Rollback '));
251:     details.outcomeLines = lines;
252:     observe('outcome-lines', { lines });
253:     assert.equal(lines.length, 1, `expected one outcome line, saw ${JSON.stringify(lines)}`);
254:     const match = OUTCOME.exec(lines[0]);
255:     assert.ok(match, `outcome line is not the verified form: ${JSON.stringify(lines[0])}`);
256:     const claimed = Date.parse(match[1]);
257:     assert.ok(Number.isFinite(claimed), `pre-image time does not parse: ${match[1]}`);
258:     assert.ok(claimed >= attempt.started - 1000 && claimed <= attempt.finished,
259:       `pre-image time ${match[1]} is outside this run`);
260:   });
261: }
262: 
263: // Inside the transaction directory: only quarantine/<one id>/ with new/**, displaced/**
264: // and moved.txt. No lock, journal, snapshot/ or anything else.
265: function readQuarantine(scenario, details, fixture, attempt) {
266:   const quarantine = { entries: {}, displaced: [], moved: '' };
267:   accept(scenario, 'transaction-directory-shape', observe => {
268:     const root = path.join(fixture.target, TRANSACTION_DIR);
269:     let stat;
270:     try {
271:       stat = fs.lstatSync(root);
272:     } catch (error) {
273:       if (error.code !== 'ENOENT') throw error;
274:       observe('transaction-state', { state: 'absent' });
275:       assert.fail('transaction root is absent');
276:     }
277:     observe('transaction-state', { state: 'present' });
278:     assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), 'transaction root is not a plain directory');
279:     assert.deepEqual(fs.readdirSync(root).sort(), ['quarantine']);
280:     const ids = fs.readdirSync(path.join(root, 'quarantine'));
281:     assert.equal(ids.length, 1, `expected one transaction id, saw ${JSON.stringify(ids)}`);
282:     const idDir = path.join(root, 'quarantine', ids[0]);
283:     const names = fs.readdirSync(idDir).sort();
284:     assert.deepEqual(names.filter(name => !['displaced', 'moved.txt', 'new'].includes(name)), []);
285:     assert.ok(names.includes('new') && names.includes('moved.txt'), `saw ${JSON.stringify(names)}`);
286:     quarantine.idDir = idDir;
287:     quarantine.entries = typesOnly(snapshotTree(path.join(idDir, 'new')));
288:     quarantine.moved = fs.readFileSync(path.join(idDir, 'moved.txt'), 'utf8');
289:     if (names.includes('displaced')) {
290:       const found = new Set();
291:       for (const attemptName of fs.readdirSync(path.join(idDir, 'displaced'))) {
292:         const tree = snapshotTree(path.join(idDir, 'displaced', attemptName));
293:         for (const [name, value] of Object.entries(tree)) if (value !== 'dir') found.add(name);
294:       }
295:       quarantine.displaced = [...found].sort();
296:     }
297:     details.quarantinedEntries = Object.keys(quarantine.entries).length;
298:     details.displaced = quarantine.displaced;
299:   });
300:   accept(scenario, 'quarantine-path-printed', observe => {
301:     observe('quarantine-reference', { path: quarantine.idDir || null });
302:     assert.ok(quarantine.idDir, 'no quarantine to name');
303:     assert.ok(attempt.output.includes(quarantine.idDir), `output never names ${quarantine.idDir}`);
304:   });
305:   return quarantine;
306: }
307: 
308: function assertMovedListsFiles(scenario, quarantine, expectedEntries) {
309:   accept(scenario, 'moved-txt-lists-every-file', observe => {
310:     const files = Object.keys(expectedEntries).filter(name => expectedEntries[name] === 'file').sort();
311:     observe('moved-list', { expected: files, listed: quarantine.moved.split(/\r?\n/).filter(Boolean) });
312:     const absent = files.filter(name => !quarantine.moved.includes(name));
313:     assert.equal(absent.length, 0, `${absent.length} of ${files.length} absent, e.g. ${absent.slice(0, 4).join(', ')}`);
314:   });
315: }
316: 
317: function freshScenario(twin) {
318:   const scenario = 'fresh';
319:   const details = report[scenario] = {};
320:   const fixture = createFixture('fresh');
321:   const injection = writeInjection(fixture);
322:   const outsideBefore = snapshotOutsideTarget(fixture);
323:   const attempt = run(wrapper, fixture, injection);
324:   details.status = attempt.result.status;
325:   details.traceCount = readTrace(injection).length;
326:   harness(scenario, 'wrapper-child-failed-at-injection', () => {
327:     assert.equal(attempt.result.error, undefined);
328:     assert.ok(attempt.output.includes(INJECTED), 'child under the wrapper never reached the injected write');
329:   });
330: 
331:   assertOutcome(scenario, details, attempt);
332:   accept(scenario, 'home-outside-target-preserved', observe => {
333:     assertHomePreserved(snapshotOutsideTarget(fixture), outsideBefore, observe);
334:   });
335:   accept(scenario, 'top-level-exact-allowlist', observe => {
336:     const names = fs.readdirSync(fixture.target).sort();
337:     details.topLevelCount = names.length;
338:     observe('top-level-names', { names });
339:     assert.deepEqual(names, [...Object.keys(OWNER_FILES), TRANSACTION_DIR].sort());
340:   });
341:   accept(scenario, 'owner-bytes-preserved', () => {
342:     for (const [file, content] of Object.entries(OWNER_FILES)) {
343:       assert.equal(fs.readFileSync(path.join(fixture.target, file), 'utf8'), content, file);
344:     }
345:   });
346:   const quarantine = readQuarantine(scenario, details, fixture, attempt);
347:   accept(scenario, 'new-equals-twin-residue', observe => assertSameTree(quarantine.entries, twin.residue, 'new/ against twin', observe));
348:   accept(scenario, 'displaced-equals-twin-changes', () => assert.deepEqual(quarantine.displaced, twin.changed));
349:   assertMovedListsFiles(scenario, quarantine, twin.residue);
350: }
351: 
352: function upgradeScenario(twin) {
353:   const scenario = 'upgrade';
354:   const details = report[scenario] = {};
355:   const fixture = createFixture('upgrade');
356:   const first = run(wrapper, fixture, null);
357:   harness(scenario, 'first-install-succeeded', () => {
358:     assert.equal(first.result.error, undefined);
359:     assert.equal(first.result.status, 0, first.output.slice(-400));
360:   });
361: 
362:   // Give the rollback real work: one installed file carries an owner edit (must come
363:   // back byte-identical) and one is gone (its re-creation must be quarantined).
364:   // Picked from what the twin's trace saw the child write, so the child is known to write both.
365:   const written = twin.tracedFiles;
366:   const edited = written[0];
367:   const removed = written[written.length - 1];
368:   harness(scenario, 'picked-files-installed', () => {
369:     assert.ok(written.length >= 2, `saw ${written.length}`);
370:     for (const name of [edited, removed]) assert.ok(fs.existsSync(path.join(fixture.target, name)), name);
371:   });
372:   fs.appendFileSync(path.join(fixture.target, edited), '\nowner edit made before the failed upgrade\n');
373:   fs.unlinkSync(path.join(fixture.target, removed));
374:   details.edited = edited;
375:   details.removed = removed;
376:   report.context.upgrade = { edited, removed };
377:   const before = without(snapshotTree(fixture.target), TRANSACTION_DIR);
378: 
379:   const injection = writeInjection(fixture);
380:   const outsideBefore = snapshotOutsideTarget(fixture);
381:   const attempt = run(wrapper, fixture, injection);
382:   details.status = attempt.result.status;
383:   const trace = readTrace(injection);
384:   details.traceCount = trace.length;
385:   harness(scenario, 'wrapper-child-failed-at-injection', () => {
386:     assert.equal(attempt.result.error, undefined);
387:     assert.ok(attempt.output.includes(INJECTED), 'child under the wrapper never reached the injected write');
388:   });
389:   // The trace is a lower bound, so a hit is proof the rollback had both jobs to do.
390:   harness(scenario, 'child-rewrote-picked-files', () => {
391:     const prefix = path.relative(fixture.home, fixture.target).replaceAll('\\', '/');
392:     const completed = new Set(trace.filter(event => event.completed).flatMap(event => event.paths));
393:     for (const name of [edited, removed]) assert.ok(completed.has(`${prefix}/${name}`), `child never wrote ${name}`);
394:   });
395: 
396:   assertOutcome(scenario, details, attempt);
397:   accept(scenario, 'home-outside-target-preserved', observe => {
398:     assertHomePreserved(snapshotOutsideTarget(fixture), outsideBefore, observe);
399:   });
400:   accept(scenario, 'owner-bytes-preserved', () => {
401:     const after = snapshotTree(fixture.target);
402:     for (const name of [...Object.keys(OWNER_FILES), edited]) {
403:       assert.ok(before[name]?.startsWith('file:'), `no owner pre-image: ${name}`);
404:       assert.equal(after[name], before[name], `owner bytes changed: ${name}`);
405:     }
406:     assert.equal(Object.hasOwn(after, removed), false, `owner-removed entry reappeared: ${removed}`);
407:   });
408:   accept(scenario, 'tree-deep-equal-outside-allowlist', observe => {
409:     assertSameTree(without(snapshotTree(fixture.target), TRANSACTION_DIR), before, 'after against before', observe);
410:   });
411:   const quarantine = readQuarantine(scenario, details, fixture, attempt);
412:   accept(scenario, 'removed-file-quarantined-as-new', observe => {
413:     observe('entry-type', { path: removed, type: quarantine.entries[removed] || null });
414:     assert.equal(quarantine.entries[removed], 'file');
415:   });
416:   accept(scenario, 'edited-file-displaced', observe => {
417:     observe('displaced-paths', { paths: [...quarantine.displaced].sort() });
418:     assert.ok(quarantine.displaced.includes(edited), JSON.stringify(quarantine.displaced.slice(0, 6)));
419:   });
420:   assertMovedListsFiles(scenario, quarantine, { [removed]: 'file' });
421: }
422: 
423: try {
424:   assert.ok(fs.existsSync(upstream), 'compose the candidate before running acceptance');
425:   report.sourceHashes = Object.fromEntries(['bin/install.js', 'dist/bin/install.js', 'tests/acceptance/installer-recovery.cjs'].map(name => [
426:     name, digestOf(fs.readFileSync(path.join(project, name))),
427:   ]));
428:   const guarded = fn => {
429:     try {
430:       return fn();
431:     } catch (error) {
432:       if (!(error instanceof ScenarioAborted)) throw error;
433:       return undefined;
434:     }
435:   };
436:   const twin = guarded(measureTwin);
437:   if (twin) for (const scenario of [freshScenario, upgradeScenario]) guarded(() => scenario(twin));
438:   const failed = report.checks.filter(check => !check.ok);
439:   report.accepted = failed.length === 0;
440:   if (failed.length) report.failure = failed.map(check => `${check.scenario}:${check.id}`).join(', ');
441: } catch (error) {
442:   report.harnessError = error.message;
443: } finally {
444:   if (!report.accepted) process.exitCode = 1;
445:   // Only delete this invocation's generated fixture inside this checkout.
446:   report.fixtureRemoved = false;
447:   try {
448:     assert.equal(path.dirname(path.resolve(scratch)), path.resolve(scratchParent));
449:     assert.ok(path.basename(scratch).startsWith('installer-recovery-'));
450:     fs.rmSync(scratch, { recursive: true, force: true, maxRetries: 2, retryDelay: 50 });
451:     assert.equal(fs.existsSync(scratch), false, 'fixture still exists after cleanup');
452:     report.fixtureRemoved = true;
453:   } catch (error) {
454:     report.accepted = false;
455:     process.exitCode = 1;
456:     report.harnessError = [report.harnessError, `fixture cleanup failed: ${error.message}`].filter(Boolean).join('; ');
457:     process.stderr.write(`installer recovery retained fixture: ${scratch}\n${error.message}\n`);
458:   }
459:   process.stdout.write(JSON.stringify(report, null, 2) + os.EOL);
460: }

## tests/expect-red.test.js SHA256 6701bd427655e4791fb195de30279fdd858d09b4fc6b83383fac0d02bfdab25f
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
42: function changedText(text, search, replacement) {
43:   expect(text.includes(search)).toBe(true);
44:   const changed = text.replace(search, replacement);
45:   expect(changed).not.toBe(text);
46:   return changed;
47: }
48: 
49: function setCheck(report, key, ok) {
50:   const check = report.checks.find(candidate => `${candidate.scenario}:${candidate.id}` === key);
51:   check.ok = ok;
52:   check.detail = ok ? undefined : 'forced by the test';
53: }
54: 
55: let liveRecovery;
56: let resolvedNode;
57: function nodeRuntime() {
58:   if (!resolvedNode) {
59:     const probe = spawnSync('node', ['-p', 'JSON.stringify({execPath:process.execPath,version:process.version,platform:process.platform})'], {
60:       encoding: 'utf8', timeout: 10000, maxBuffer: 16384,
61:     });
62:     expect(probe.error).toBeUndefined();
63:     expect(probe.status).toBe(0);
64:     resolvedNode = JSON.parse(probe.stdout);
65:     expect(path.isAbsolute(resolvedNode.execPath)).toBe(true);
66:     expect(resolvedNode.version).toMatch(/^v\d+\.\d+\.\d+$/);
67:     expect(resolvedNode.platform).toBe(process.platform);
68:   }
69:   return resolvedNode;
70: }
71: 
72: function captureNode(args, options) {
73:   return spawnSync(nodeRuntime().execPath, args, { encoding: 'utf8', ...options, maxBuffer: 64 * 1024 * 1024 });
74: }
75: 
76: function longTest(name, fn, timeout = 240000) {
77:   if (process.versions.bun) test(name, fn, timeout);
78:   else test(name, { timeout }, fn);
79: }
80: 
81: function captureRecovery() {
82:   if (!liveRecovery) {
83:     const run = captureNode(['tests/acceptance/installer-recovery.cjs'], {
84:       cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 180000,
85:     });
86:     expect(run.error).toBeUndefined();
87:     expect(run.status).toBe(1);
88:     liveRecovery = JSON.parse(run.stdout);
89:     expect(liveRecovery.fixtureRemoved).toBe(true);
90:     expect(liveRecovery.node).toBe(nodeRuntime().version);
91:     expect(liveRecovery.platform).toBe(nodeRuntime().platform);
92:   }
93:   return liveRecovery;
94: }
95: 
96: function captureCleanupFailure() {
97:   const harnessPath = path.resolve(__dirname, 'acceptance/installer-recovery.cjs');
98:   const control = function (harness) {
99:     const fs = require('node:fs');
100:     const path = require('node:path');
101:     const project = path.resolve(path.dirname(harness), '../..');
102:     const upstream = path.join(project, 'dist/bin/install.js');
103:     const exists = fs.existsSync;
104:     const create = fs.mkdtempSync;
105:     const remove = fs.rmSync;
106:     let fixture;
107:     // Abort before any installer child can be launched. This is a cleanup-oracle
108:     // control, not a product recovery run or a substitute for live acceptance.
109:     fs.existsSync = function (name) { return name === upstream ? false : exists.apply(this, arguments); };
110:     fs.mkdtempSync = function () { fixture = create.apply(this, arguments); return fixture; };
111:     fs.rmSync = function (name) {
112:       if (name === fixture) throw Object.assign(new Error('EBUSY: controlled fixture cleanup failure'), { code: 'EBUSY' });
113:       return remove.apply(this, arguments);
114:     };
115:     try { require(harness); }
116:     catch (error) { process.stderr.write(`control caught: ${error.message}\n`); process.exitCode = 1; }
117:     finally {
118:       fs.existsSync = exists;
119:       fs.mkdtempSync = create;
120:       fs.rmSync = remove;
121:       process.stderr.write(`control fixture: ${JSON.stringify(fixture)}\n`);
122:     }
123:   };
124:   const run = captureNode(['-'], {
125:     cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024,
126:     input: `(${control.toString()})(${JSON.stringify(harnessPath)});`,
127:   });
128:   expect(run.error).toBeUndefined();
129:   expect(run.signal).toBeNull();
130:   const marker = run.stderr.split('\n').find(line => line.startsWith('control fixture: '));
131:   expect(marker).toBeDefined();
132:   const fixture = JSON.parse(marker.slice('control fixture: '.length));
133:   // The child is terminal and the control prevented all descendants. Remove only
134:   // its named, empty, plain fixture; never sweep another invocation's directories.
135:   expect(path.dirname(fixture)).toBe(path.resolve(__dirname, '..', '.claude'));
136:   expect(path.basename(fixture).startsWith('installer-recovery-')).toBe(true);
137:   expect(fs.lstatSync(fixture).isSymbolicLink()).toBe(false);
138:   expect(fs.readdirSync(fixture)).toEqual([]);
139:   fs.rmdirSync(fixture);
140:   return { run, fixture };
141: }
142: 
143: function captureHarnessOracle(mode, weakenHomeComparison = false) {
144:   const harnessPath = path.resolve(__dirname, 'acceptance/installer-recovery.cjs');
145:   const control = function (harness, fault, weaken) {
146:     const fs = require('node:fs');
147:     const path = require('node:path');
148:     const assert = require('node:assert/strict');
149:     const child = require('node:child_process');
150:     const spawn = child.spawnSync;
151:     const readDirectory = fs.readdirSync;
152:     const stat = fs.lstatSync;
153:     const project = path.resolve(path.dirname(harness), '../..');
154:     let faultPath;
155:     let fired = false;
156:     if (fault === 'private-environment-alias') process.env.pSmOdUlEaNaLySiScAcHePaTh = path.join(project, 'unowned-control-cache');
157:     // Simulate the completed installer's filesystem effects, not the harness's
158:     // observations or assertions. The real harness walks real private files.
159:     child.spawnSync = (_executable, args, options) => {
160:       const target = args[args.length - 1];
161:       const scenario = path.basename(options.env.HOME).split(' ')[0];
162:       assert.equal(path.dirname(options.cwd), path.join(project, '.claude'));
163:       assert.ok(path.basename(options.cwd).startsWith('installer-recovery-'));
164:       assert.equal(target, path.join(options.cwd, `${scenario} home`, 'runtime with spaces'));
165:       if (fault === 'harness-abort') return { status: 1 };
166:       if (fault.startsWith('private-environment')) {
167:         for (const [key, relative] of Object.entries({ APPDATA: 'AppData/Roaming', LOCALAPPDATA: 'AppData/Local',
168:           XDG_CONFIG_HOME: '.config', XDG_CACHE_HOME: '.cache', XDG_DATA_HOME: '.local/share' })) {
169:           assert.equal(options.env[key], path.join(options.env.HOME, relative));
170:           assert.ok(fs.lstatSync(options.env[key]).isDirectory());
171:         }
172:         assert.equal(options.env.PSModuleAnalysisCachePath, undefined);
173:         assert.ok(!Object.keys(options.env).some(key => key.toUpperCase() === 'PSMODULEANALYSISCACHEPATH'));
174:         assert.equal(options.env.TEMP, options.cwd);
175:         assert.equal(options.env.TMP, options.cwd);
176:       }
177:       const write = (name, bytes) => { fs.mkdirSync(path.dirname(name), { recursive: true }); fs.writeFileSync(name, bytes); };
178:       const edited = 'skills/a.txt';
179:       const removed = 'skills/b.txt';
180:       const upgrading = scenario === 'upgrade' && Boolean(options.env.NODE_OPTIONS);
181:       const ownerBytes = upgrading ? fs.readFileSync(path.join(target, edited)) : null;
182:       if (fault.startsWith('runtime-')) {
183:         const runtime = path.join(options.env.HOME, 'AppData/Local/Microsoft/Windows');
184:         fs.mkdirSync(path.join(runtime, 'Caches'), { recursive: true });
185:         write(path.join(runtime, 'PowerShell/StartupProfileData-NonInteractive'), upgrading ? 'updated runtime' : 'runtime');
186:         if (upgrading) {
187:           const cache = path.join(runtime, 'PowerShell/StartupProfileData-NonInteractive');
188:           if (fault === 'runtime-extra') write(path.join(runtime, 'Caches/unapproved.bin'), 'unexpected');
189:           if (fault === 'runtime-delete') fs.unlinkSync(cache);
190:           if (fault === 'runtime-directory-type') {
191:             fs.rmdirSync(path.join(runtime, 'Caches'));
192:             fs.writeFileSync(path.join(runtime, 'Caches'), 'substituted');
193:           }
194:           if (fault === 'runtime-file-type') { fs.unlinkSync(cache); fs.mkdirSync(cache); }
195:           if (fault === 'runtime-directory-link') {
196:             fs.rmdirSync(path.join(runtime, 'Caches'));
197:             fs.symlinkSync(path.join(options.env.HOME, '.cache'), path.join(runtime, 'Caches'), 'junction');
198:           }
199:           if (fault === 'runtime-file-link') {
200:             fs.unlinkSync(cache);
201:             fs.symlinkSync(path.join(options.env.HOME, '.cache'), cache, 'junction');
202:           }
203:         }
204:       }
205:       write(path.join(target, edited), 'installed a\n');
206:       write(path.join(target, removed), 'installed b\n');
207:       if (!options.env.NODE_OPTIONS) return { status: 0, stdout: '', stderr: '' };
208:       fs.writeFileSync(path.join(options.cwd, `${scenario}-write-trace.json`), JSON.stringify([
209:         { completed: true, paths: [`runtime with spaces/${edited}`] },
210:         { completed: true, paths: [`runtime with spaces/${removed}`] },
211:       ]));
212:       const injection = 'INJECTED_MANIFEST_PUBLICATION_FAILURE';
213:       if (fault === 'trace-absent') fs.unlinkSync(path.join(options.cwd, `${scenario}-write-trace.json`));
214:       if (scenario === 'twin') return { status: 1, stdout: injection, stderr: '' };
215:       const transaction = path.join(target, 'gsd-install-transaction');
216:       if (fault === 'stat-error' && scenario === 'fresh') faultPath = transaction;
217:       const quarantine = path.join(transaction, 'quarantine', 'control-id');
218:       const freshRoot = path.join(quarantine, 'new');
219:       fs.mkdirSync(path.join(freshRoot, 'skills'), { recursive: true });
220:       if (upgrading) {
221:         write(path.join(quarantine, 'displaced', 'attempt', edited), fs.readFileSync(path.join(target, edited)));
222:         fs.writeFileSync(path.join(target, edited), ownerBytes);
223:         fs.renameSync(path.join(target, removed), path.join(freshRoot, removed));
224:       } else {
225:         fs.renameSync(path.join(target, edited), path.join(freshRoot, edited));
226:         fs.renameSync(path.join(target, removed), path.join(freshRoot, removed));
227:         fs.rmdirSync(path.join(target, 'skills'));
228:       }
229:       fs.writeFileSync(path.join(quarantine, 'moved.txt'), (upgrading ? [removed] : [edited, removed]).join('\n') + '\n');
230:       if (scenario === 'fresh' && ['before-observe', 'after-observe', 'without-code'].includes(fault)) {
231:         faultPath = fault === 'before-observe' ? target : transaction;
232:       }
233:       if (fault.startsWith(`home-${scenario}-`)) {
234:         if (fault.endsWith('-delete')) fs.unlinkSync(path.join(options.env.HOME, '.gsd', 'owner.json'));
235:         if (fault.endsWith('-change')) fs.writeFileSync(path.join(options.env.HOME, '.config', 'owner.txt'), 'damaged');
236:         if (fault.endsWith('-extra')) fs.writeFileSync(path.join(options.env.HOME, 'outside-extra.txt'), 'unexpected');
237:       }
238:       return { status: 1, stdout: `${injection}\nRollback applied: GSD roots restored to their state at ${new Date().toISOString()} and verified\n${quarantine}\n`, stderr: '' };
239:     };
240:     fs.readdirSync = function (name) {
241:       if (fault === 'baseline-read-error' && path.basename(name) === 'runtime with spaces') {
242:         throw Object.assign(new Error('controlled baseline observation failure'), { code: 'EACCES' });
243:       }
244:       if (fault !== 'stat-error' && !fired && name === faultPath) {
245:         fired = true;
246:         const error = new Error('controlled directory observation failure');
247:         if (fault !== 'without-code') error.code = 'EACCES';
248:         throw error;
249:       }
250:       return readDirectory.apply(this, arguments);
251:     };
252:     fs.lstatSync = function (name) {
253:       if (fault === 'stat-error' && !fired && name === faultPath) {
254:         fired = true;
255:         throw Object.assign(new Error('controlled transaction stat failure'), { code: 'EACCES' });
256:       }
257:       return stat.apply(this, arguments);
258:     };
259:     try {
260:       if (!weaken) require(harness);
261:       else {
262:         const source = fs.readFileSync(harness, 'utf8');
263:         const decision = "assertHomePreserved(snapshotOutsideTarget(fixture), outsideBefore, observe);";
264:         assert.equal(source.split(decision).length, 3);
265:         // Separate synthetic filename keeps mutant execution out of the real
266:         // harness's coverage. No production file is edited or written.
267:         const Module = require('node:module');
268:         const filename = path.join(path.dirname(harness), 'installer-recovery-decision-mutant.cjs');
269:         const mutant = new Module(filename);
270:         mutant.filename = filename;
271:         mutant._compile(source.replaceAll(decision, "observe('home-state', { before: outsideBefore, after: snapshotOutsideTarget(fixture) });"), filename);
272:       }
273:     }
274:     finally { child.spawnSync = spawn; fs.readdirSync = readDirectory; fs.lstatSync = stat; }
275:   };
276:   const run = captureNode(['-'], {
277:     cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024,
278:     input: `(${control.toString()})(${JSON.stringify(harnessPath)},${JSON.stringify(mode)},${JSON.stringify(weakenHomeComparison)});`,
279:   });
280:   expect(run.error).toBeUndefined();
281:   expect(run.signal).toBeNull();
282:   const report = JSON.parse(run.stdout);
283:   expect(report.fixtureRemoved).toBe(true);
284:   return { run, report };
285: }
286: 
287: describe('expect-red: recovery observation contract', () => {
288:   test('aborted harness, absent trace and unreadable transaction remain rejected with cleanup', () => {
289:     for (const mode of ['harness-abort', 'trace-absent', 'stat-error', 'baseline-read-error']) {
290:       const { run, report } = captureHarnessOracle(mode);
291:       expect(run.status).toBe(1);
292:       expect(report.accepted).toBe(false);
293:       expect(judgeInstallerRecovery(run).length).toBeGreaterThan(0);
294:       if (mode === 'stat-error') {
295:         const row = report.checks.find(check => keyOfCheck(check) === 'fresh:transaction-directory-shape');
296:         expect(row.evidence).toEqual({ kind: 'observation-error', actual: { code: 'EACCES', message: 'controlled transaction stat failure' } });
297:       } else if (mode === 'baseline-read-error') expect(report.harnessError).toBe('controlled baseline observation failure');
298:       else expect(report.checks.some(row => row.kind === 'harness' && !row.ok)).toBe(true);
299:     }
300:   });
301:   test('private environment clears case aliases of inherited runtime cache paths', () => {
302:     const { run, report } = captureHarnessOracle('private-environment-alias');
303:     expect(run.status).toBe(0);
304:     expect(report.accepted).toBe(true);
305:   });
306:   test('runtime exceptions never permit deletion, extra descendants, type or link substitution', () => {
307:     for (const mode of ['extra', 'delete', 'directory-type', 'file-type', 'directory-link', 'file-link']) {
308:       const { run, report } = captureHarnessOracle(`runtime-${mode}`);
309:       expect(run.status).toBe(1);
310:       const check = report.checks.find(row => keyOfCheck(row) === 'upgrade:home-outside-target-preserved');
311:       expect(check.ok).toBe(false);
312:       expect(check.evidence.kind).toBe('home-state');
313:       const bad = mutated(value => { value.checks.find(row => keyOfCheck(row) === keyOfCheck(check)).evidence = check.evidence; });
314:       expect(judgeInstallerRecovery(runOf(bad))).toContain(`unexpected or incomplete observation: ${keyOfCheck(check)}`);
315:     }
316:   });
317:   test('exact Windows runtime creation and regular-file updates preserve owner data', () => {
318:     const { run, report } = captureHarnessOracle('runtime-allowed');
319:     expect(run.status).toBe(process.platform === 'win32' ? 0 : 1);
320:     for (const scenario of ['fresh', 'upgrade']) {
321:       const check = report.checks.find(row => row.scenario === scenario && row.id === 'home-outside-target-preserved');
322:       expect(check.ok).toBe(process.platform === 'win32');
323:       expect(check.evidence.kind).toBe('home-state');
324:       const { before, after } = check.evidence.actual;
325:       const cache = 'AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive';
326:       expect(after[cache]).toMatch(/^file:[a-f0-9]{64}$/);
327:       if (scenario === 'upgrade') expect(after[cache]).not.toBe(before[cache]);
328:     }
329:   });
330:   test('private runtime environment is initialized before complete home observations', () => {
331:     const { run, report } = captureHarnessOracle('private-environment');
332:     expect(run.status).toBe(0);
333:     for (const scenario of ['fresh', 'upgrade']) {
334:       const check = report.checks.find(row => row.scenario === scenario && row.id === 'home-outside-target-preserved');
335:       expect(check?.ok).toBe(true);
336:       expect(check.evidence.kind).toBe('home-state');
337:       const { before, after } = check.evidence.actual;
338:       expect(after).toEqual(before);
339:       for (const name of ['.gsd/owner.json', '.codex/owner.txt', '.config/owner.txt',
340:         'AppData/Roaming/owner.txt', 'AppData/Local/owner.txt']) expect(before[name]).toMatch(/^file:[a-f0-9]{64}$/);
341:       expect(before['other-owner/empty']).toBe('dir');
342:     }
343:   });
344:   test('outside-target deletion, byte damage and extra entries fail in both scenarios', () => {
345:     for (const scenario of ['fresh', 'upgrade']) {
346:       for (const [damage, name] of [['delete', '.gsd/owner.json'],
347:         ['change', '.config/owner.txt'], ['extra', 'outside-extra.txt']]) {
348:         const { run, report } = captureHarnessOracle(`home-${scenario}-${damage}`);
349:         expect(run.status).toBe(1);
350:         expect(report.accepted).toBe(false);
351:         const check = report.checks.find(row => row.scenario === scenario && row.id === 'home-outside-target-preserved');
352:         expect(check?.ok).toBe(false);
353:         expect(check.evidence.kind).toBe('home-state');
354:         expect(check.evidence.actual.after[name]).not.toBe(check.evidence.actual.before[name]);
355:         const bad = mutated(value => { value.checks.find(row => keyOfCheck(row) === keyOfCheck(check)).evidence = check.evidence; });
356:         expect(judgeInstallerRecovery(runOf(bad))).toContain(`unexpected or incomplete observation: ${keyOfCheck(check)}`);
357:       }
358:     }
359:   });
360: 
361:   test('outside-target damage controls detect a removed home comparison', () => {
362:     const correct = captureHarnessOracle('home-upgrade-delete');
363:     expect(correct.report.accepted).toBe(false);
364:     const mutant = captureHarnessOracle('home-upgrade-delete', true);
365:     expect(mutant.report.accepted).toBe(true);
366:   });
367:   test('the real harness recognizes complete private quarantine and restored owner data', () => {
368:     const { run, report } = captureHarnessOracle('none');
369:     expect(run.status).toBe(0);
370:     expect(report.accepted).toBe(true);
371:     expect(report.checks).toHaveLength(27);
372:     expect(report.checks.every(check => check.ok)).toBe(true);
373:     for (const scenario of ['fresh', 'upgrade']) {
374:       const check = report.checks.find(row => row.scenario === scenario && row.id === 'home-outside-target-preserved');
375:       expect(check?.ok).toBe(true);
376:       expect(check.evidence.kind).toBe('home-state');
377:       expect(check.evidence.actual.after).toEqual(check.evidence.actual.before);
378:     }
379:     expect(report.fresh.quarantinedEntries).toBe(3);
380:     expect(report.upgrade.displaced).toEqual(['skills/a.txt']);
381:   });
382: 
383:   test('the real harness emits observation-error before and after partial observation', () => {
384:     for (const mode of ['before-observe', 'after-observe', 'without-code']) {
385:       const { run, report } = captureHarnessOracle(mode);
386:       expect(run.status).toBe(1);
387:       expect(report.checks.find(row => row.scenario === 'fresh' && row.id === 'home-outside-target-preserved')?.ok).toBe(true);
388:       const id = mode === 'before-observe' ? 'top-level-exact-allowlist' : 'transaction-directory-shape';
389:       const check = report.checks.find(row => row.scenario === 'fresh' && row.id === id);
390:       expect(check.ok).toBe(false);
391:       expect(check.evidence).toEqual({ kind: 'observation-error', actual: {
392:         code: mode === 'without-code' ? null : 'EACCES', message: 'controlled directory observation failure',
393:       } });
394:       // Feed the actually emitted observation into the frozen known-RED case.
395:       // Other GREEN simulator observations are not evidence of product recovery.
396:       const bad = mutated(value => { value.checks.find(row => row.scenario === 'fresh' && row.id === id).evidence = check.evidence; });
397:       expect(judgeInstallerRecovery(runOf(bad))).toContain(`unexpected or incomplete observation: fresh:${id}`);
398:     }
399:   });
400:   test('cleanup failure still emits a rejected report and names its retained fixture', () => {
401:     const { run, fixture } = captureCleanupFailure();
402:     expect(run.status).toBe(1);
403:     const report = JSON.parse(run.stdout);
404:     expect(report.accepted).toBe(false);
405:     expect(report.fixtureRemoved).toBe(false);
406:     expect(report.harnessError).toContain('cleanup');
407:     expect(report.harnessError).toContain('EBUSY');
408:     expect(run.stderr).toContain(`retained fixture: ${fixture}`);
409:     expect(judgeInstallerRecovery(run).length).toBeGreaterThan(0);
410:   });
411:   longTest('the disposable upgrade independently checks owner preservation', () => {
412:     const report = captureRecovery();
413:     const owner = report.checks.find(check => keyOfCheck(check) === 'upgrade:owner-bytes-preserved');
414:     expect(owner?.ok).toBe(true);
415:     expect(report.checks).toHaveLength(27);
416:   });
417: 
418:   longTest('known failures retain complete typed observations independently of diagnostic truncation', () => {
419:     const report = captureRecovery();
420:     const kinds = new Map([
421:       ['outcome-exact', 'outcome-lines'], ['top-level-exact-allowlist', 'top-level-names'],
422:       ['transaction-directory-shape', 'transaction-state'], ['quarantine-path-printed', 'quarantine-reference'],
423:       ['new-equals-twin-residue', 'tree-delta'], ['tree-deep-equal-outside-allowlist', 'tree-delta'],
424:       ['removed-file-quarantined-as-new', 'entry-type'], ['edited-file-displaced', 'displaced-paths'],
425:       ['moved-txt-lists-every-file', 'moved-list'],
426:     ]);
427:     for (const check of report.checks.filter(check => !check.ok)) {
428:       expect(check.evidence?.kind).toBe(kinds.get(check.id));
429:     }
430:     const delta = report.checks.find(check => check.id === 'new-equals-twin-residue').evidence.actual;
431:     expect(delta.missing).toEqual(Object.keys(report.context.twin.residue).sort());
432:     expect(delta.missing.length).toBeGreaterThan(6);
433:     expect(delta.unexpected).toEqual([]);
434:     expect(delta.changed).toEqual([]);
435:     expect(report.context.upgrade).toEqual({ edited: report.upgrade.edited, removed: report.upgrade.removed });
436:     expect(report.sourceHashes['tests/acceptance/installer-recovery.cjs']).toMatch(/^[a-f0-9]{64}$/);
437:   });
438: });
439: 
440: function keyOfCheck(check) {
441:   return `${check.scenario}:${check.id}`;
442: }
443: 
444: describe('expect-red: installer recovery', () => {
445:   test('Windows home-state paths reject illegal characters and reserved device names', () => {
446:     for (const name of ['bad?', 'bad*', 'bad<', 'bad>', 'bad|', 'bad"', 'CON', 'nul.txt', 'AUX', 'PRN', 'COM1.log', 'LPT9']) {
447:       const report = mutated(value => {
448:         const state = value.checks.find(row => keyOfCheck(row) === 'fresh:home-outside-target-preserved').evidence.actual;
449:         state.before[name] = state.after[name] = 'dir';
450:       });
451:       expect(judgeInstallerRecovery(runOf(report))).toContain('unexpected or incomplete observation: fresh:home-outside-target-preserved');
452:     }
453:   });
454:   test('home maps reject incomplete, malformed, aliased and falsely preserved evidence', () => {
455:     const cache = 'AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive';
456:     const changes = [
457:       row => { delete row.evidence; }, row => { row.evidence = null; },
458:       row => { row.evidence.extra = true; }, row => { row.evidence.kind = 'assertion-pass'; },
459:       row => { row.evidence.actual = null; }, row => { row.evidence.actual.extra = true; },
460:       row => { delete row.evidence.actual.before; }, row => { delete row.evidence.actual.after; },
461:       row => { row.evidence.actual.before = {}; }, row => { row.evidence.actual.after = []; },
462:       row => { delete row.evidence.actual.before['.gsd/owner.json']; delete row.evidence.actual.after['.gsd/owner.json']; },
463:       row => { delete row.evidence.actual.before['other-owner/empty']; delete row.evidence.actual.after['other-owner/empty']; },
464:       row => { row.evidence.actual.before['.config/owner.txt'] = row.evidence.actual.after['.config/owner.txt'] = `file:${'a'.repeat(64)}`; },
465:       ...['', '../bad', '/bad', 'a//b', 'a/./b', 'C:/bad', 'a\\b', 'bad ', 'bad.', 'runtime with spaces',
466:         'Runtime With Spaces/child', '.CONFIG', '.config/OWNER.TXT'].map(name => row => {
467:         row.evidence.actual.before[name] = row.evidence.actual.after[name] = 'dir';
468:       }),
469:       ...[null, 1, '', 'file:invalid', 'link:', `link:a${String.fromCharCode(0)}`].map(value => row => {
470:         row.evidence.actual.before.other = row.evidence.actual.after.other = value;
471:       }),
472:       row => { delete row.evidence.actual.before['AppData/Local']; },
473:       row => { row.evidence.actual.before['.config'] = 'link:elsewhere'; },
474:       row => { row.evidence.actual.before[cache] = 'dir'; },
475:       row => { row.evidence.actual.before[cache] = 'link:elsewhere'; },
476:       row => { row.evidence.actual.before['AppData/Local/Microsoft/Windows/Caches'] = 'link:elsewhere';
477:         row.evidence.actual.after['AppData/Local/Microsoft/Windows/Caches'] = 'dir'; },
478:     ];
479:     for (const change of changes) {
480:       const report = mutated(value => {
481:         const row = value.checks.find(check => keyOfCheck(check) === 'upgrade:home-outside-target-preserved');
482:         const original = JSON.stringify(row);
483:         change(row);
484:         expect(JSON.stringify(row)).not.toBe(original);
485:       });
486:       expect(judgeInstallerRecovery(runOf(report))).toContain('unexpected or incomplete observation: upgrade:home-outside-target-preserved');
487:     }
488:   });
489: 
490:   test('runtime changes are Windows-only; preserved arbitrary owner files and links remain valid', () => {
491:     for (const platform of ['linux', 'darwin']) {
492:       const evidence = structuredClone(RECOVERY_EVIDENCE);
493:       evidence.host.platform = platform;
494:       const report = mutated(value => { value.platform = platform; });
495:       expect(judgeInstallerRecovery(runOf(report), evidence)).toContain('unexpected or incomplete observation: fresh:home-outside-target-preserved');
496:       for (const row of report.checks.filter(check => check.id === 'home-outside-target-preserved')) {
497:         row.evidence.actual.after = structuredClone(row.evidence.actual.before);
498:         row.evidence.actual.before['owner-link'] = row.evidence.actual.after['owner-link'] = 'link:other-owner';
499:         row.evidence.actual.before['extra-owner'] = row.evidence.actual.after['extra-owner'] = `file:${'b'.repeat(64)}`;
500:       }
501:       expect(judgeInstallerRecovery(runOf(report), evidence)).toEqual([]);
502:     }
503:   });
504:   test('the captured 27-check private-home report satisfies the approved inventory', () => {
505:     expect(capturedRecovery.checks).toHaveLength(27);
506:     expect(capturedRecovery.checks.filter(row => row.ok)).toHaveLength(14);
507:     expect(judgeInstallerRecovery(runOf(KNOWN_RED))).toEqual([]);
508:   });
509:   test('a real abort-shaped report keeps its failed harness diagnostic without context', () => {
510:     const report = mutated(value => {
511:       const check = value.checks.find(row => keyOfCheck(row) === 'twin:child-failed-at-injection');
512:       check.ok = false;
513:       check.detail = 'child never reached injection';
514:       check.evidence = { kind: 'observation-error', actual: { code: 'ERR_ASSERTION', message: check.detail } };
515:       value.checks = [check];
516:       value.context = {};
517:       value.failure = keyOfCheck(check);
518:     });
519:     const problems = judgeInstallerRecovery(runOf(report));
520:     expect(problems).toContain('invalid independent recovery context');
521:     expect(problems).toContain('harness check did not pass: twin:child-failed-at-injection');
522:   });
523: 
524:   test('supplied malformed termination markers are never treated as absent', () => {
525:     for (const error of [false, 0, '', null]) {
526:       expect(judgeInstallerRecovery({ ...runOf(KNOWN_RED), error }).length).toBeGreaterThan(0);
527:     }
528:     for (const signal of [false, 0, '']) {
529:       expect(judgeInstallerRecovery({ ...runOf(KNOWN_RED), signal }).length).toBeGreaterThan(0);
530:     }
531:   });
532: 
533:   test('host-specific identity rules and contradictory pass details are checked', () => {
534:     for (const platform of ['linux', 'darwin']) {
535:       const report = mutated(value => {
536:         value.platform = platform;
537:         for (const row of value.checks.filter(check => check.id === 'home-outside-target-preserved')) {
538:           row.evidence.actual.after = structuredClone(row.evidence.actual.before);
539:         }
540:       });
541:       const evidence = structuredClone(RECOVERY_EVIDENCE);
542:       evidence.host.platform = platform;
543:       expect(judgeInstallerRecovery(runOf(report), evidence)).toEqual([]);
544:     }
545:     expect(judgeInstallerRecovery(runOf(mutated(report => {
546:       report.checks.find(row => keyOfCheck(row) === 'twin:child-failed-at-injection').detail = 'unexpected failure detail';
547:     }))).length).toBeGreaterThan(0);
548:     expect(judgeInstallerRecovery(runOf('{malformed'))[0]).toContain('{malformed');
549:   });
550: 
551:   test('recovery evidence must match the explicitly supplied source bytes and host', () => {
552:     for (const evidence of [undefined, null, {}, { ...RECOVERY_EVIDENCE, host: null },
553:       { ...RECOVERY_EVIDENCE, sourceHashes: {} },
554:       { ...RECOVERY_EVIDENCE, host: { platform: 'linux', nodeVersion: capturedRecovery.node } },
555:       { ...RECOVERY_EVIDENCE, host: { platform: 'win32', nodeVersion: 'v22.0.0' } }]) {
556:       expect(judgeRecovery(runOf(KNOWN_RED), evidence).length).toBeGreaterThan(0);
557:     }
558:     for (const name of Object.keys(RECOVERY_EVIDENCE.sourceHashes)) {
559:       for (const change of [
560:         report => { delete report.sourceHashes[name]; },
561:         report => { report.sourceHashes[name] = 'a'.repeat(64); },
562:         report => { report.sourceHashes[name] = 'not-a-digest'; },
563:       ]) expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
564:     }
565:     expect(judgeInstallerRecovery(runOf(mutated(report => { report.sourceHashes.extra = 'a'.repeat(64); }))).length).toBeGreaterThan(0);
566:     expect(judgeInstallerRecovery(runOf(mutated(report => { report.platform = 'unknown'; }))).length).toBeGreaterThan(0);
567:     expect(judgeInstallerRecovery(runOf(mutated(report => { report.node = 'v22.0.0'; }))).length).toBeGreaterThan(0);
568:   });
569: 
570:   test('independent context must contain unambiguous relative paths and real residue', () => {
571:     for (const change of [
572:       report => { delete report.context; },
573:       report => { report.context.twin.residue = {}; },
574:       report => { report.context.upgrade.edited = report.context.upgrade.removed; },
575:       report => { report.context.upgrade.edited = '../owner.txt'; },
576:       report => { report.context.upgrade.edited = '/owner.txt'; },
577:       report => { report.context.upgrade.edited = 'C:/owner.txt'; },
578:       report => { report.context.upgrade.edited = 'a//b'; },
579:       report => { report.context.upgrade.edited = 'a/./b'; },
580:       report => { report.context.twin.residue.extra = 'unknown-type'; },
581:       report => { report.context.twin.residue['skills/alias'] = 'file'; report.context.twin.residue['skills/ALIAS'] = 'file'; },
582:     ]) {
583:       expect(judgeInstallerRecovery(runOf(mutated(change))).some(problem => problem.includes('context'))).toBe(true);
584:     }
585:   });
586: 
587:   test('a self-consistent smaller twin cannot silently drop a reviewed root', () => {
588:     const report = mutated(value => {
589:       const residue = Object.fromEntries(Object.entries(value.context.twin.residue)
590:         .filter(([name]) => name !== 'hooks' && !name.startsWith('hooks/')));
591:       value.context.twin.residue = residue;
592:       value.checks.find(row => keyOfCheck(row) === 'fresh:new-equals-twin-residue').evidence.actual.missing = Object.keys(residue).sort();
593:       value.checks.find(row => keyOfCheck(row) === 'fresh:moved-txt-lists-every-file').evidence.actual.expected =
594:         Object.keys(residue).filter(name => residue[name] === 'file').sort();
595:     });
596:     expect(judgeInstallerRecovery(runOf(report))).toContain('invalid independent recovery context');
597:   });
598: 
599:   test('malformed, interrupted and cleanup-failed reports return diagnostics instead of acceptance or exceptions', () => {
600:     for (const report of [null, [], true, 1, 'text', {}, { checks: null }, { checks: {} }, { checks: [null] }]) {
601:       expect(judgeInstallerRecovery(runOf(JSON.stringify(report))).length).toBeGreaterThan(0);
602:     }
603:     for (const change of [
604:       report => { delete report.accepted; }, report => { report.accepted = 'false'; },
605:       report => { delete report.fixtureRemoved; }, report => { report.fixtureRemoved = false; },
606:       report => { report.checks[report.checks.findIndex(row => keyOfCheck(row) === 'twin:child-failed-at-injection')] = null; },
607:       report => { report.checks = {}; },
608:       report => { report.checks.find(row => keyOfCheck(row) === 'twin:child-failed-at-injection').ok = 1; },
609:       report => { report.checks.find(row => keyOfCheck(row) === 'fresh:outcome-exact').detail = ''; },
610:       report => { report.failure += ', fresh:outcome-exact'; },
611:       report => { report.failure = 'fresh:outcome-exact'; },
612:       report => { delete report.failure; },
613:     ]) expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
614:     for (const run of [undefined, null, {}, { ...runOf(KNOWN_RED), signal: 'SIGTERM' },
615:       { ...runOf(KNOWN_RED), error: new Error('timeout') }, { ...runOf(KNOWN_RED), stderr: null }]) {
616:       expect(judgeInstallerRecovery(run).length).toBeGreaterThan(0);
617:     }
618:   });
619: 
620:   test('known failure labels cannot conceal missing, contradictory or additional observations', () => {
621:     const baseline = JSON.parse(KNOWN_RED);
622:     for (const original of baseline.checks) {
623:       const key = keyOfCheck(original);
624:       const changes = [
625:         check => { delete check.evidence; },
626:         check => { check.evidence.kind = 'observation-error'; },
627:         check => { check.evidence.actual.unreviewed = 'additional damage'; },
628:       ];
629:       for (const field of Object.keys(original.evidence.actual)) {
630:         changes.push(check => { delete check.evidence.actual[field]; });
631:         changes.push(check => {
632:           const value = check.evidence.actual[field];
633:           check.evidence.actual[field] = Array.isArray(value) ? [...value, 'unreviewed-damage'] : 'contradiction';
634:         });
635:       }
636:       for (const change of changes) {
637:         const report = mutated(value => change(value.checks.find(check => keyOfCheck(check) === key)));
638:         expect(judgeInstallerRecovery(runOf(report)).some(problem => problem.includes(key))).toBe(true);
639:       }
640:     }
641:     const diagnosticsOnly = mutated(report => {
642:       for (const check of report.checks.filter(check => !check.ok)) check.detail = 'Different human formatting';
643:     });
644:     expect(judgeInstallerRecovery(runOf(diagnosticsOnly))).toEqual([]);
645:   });
646: 
647:   test('only the complete reviewed inventory is accepted, without duplicates or extra failures', () => {
648:     const baseline = JSON.parse(KNOWN_RED);
649:     for (const original of baseline.checks) {
650:       const key = keyOfCheck(original);
651:       for (const change of [
652:         report => { report.checks = report.checks.filter(check => keyOfCheck(check) !== key); },
653:         report => { report.checks.push({ ...original }); },
654:         report => { setCheck(report, key, !original.ok); },
655:         report => { report.checks.find(check => keyOfCheck(check) === key).kind = 'unreviewed'; },
656:       ]) {
657:         expect(judgeInstallerRecovery(runOf(mutated(change))).length).toBeGreaterThan(0);
658:       }
659:     }
660:     expect(judgeInstallerRecovery(runOf(mutated(report => {
661:       report.checks.push({ scenario: 'fresh', id: 'unknown', kind: 'acceptance', ok: false, detail: 'new damage' });
662:     }))).length).toBeGreaterThan(0);
663:   });
664: 
665:   test('the captured red from the unfixed installer is the known red', () => {
666:     expect(judgeInstallerRecovery(runOf(KNOWN_RED))).toEqual([]);
667:   });
668: 
669:   test('an additional owner-byte loss cannot hide behind the expected recovery failures', () => {
670:     const report = mutated(value => setCheck(value, 'fresh:owner-bytes-preserved', false));
671:     const problems = judgeInstallerRecovery(runOf(report));
672:     expect(problems.some(problem => problem.includes('fresh:owner-bytes-preserved'))).toBe(true);
673:   });
674: 
675:   test('an unexpected pass fails and says how to retire the wrapper', () => {
676:     const green = mutated(report => {
677:       report.accepted = true;
678:       for (const check of report.checks) check.ok = true;
679:     });
680:     const problems = judgeInstallerRecovery(runOf(green, 0));
681:     expect(problems).toHaveLength(1);
682:     expect(problems[0]).toContain('UNEXPECTED PASS');
683:   });
684: 
685:   for (const key of INSTALLER_RECOVERY_HARNESS) test(`a red with harness check ${key} failing is the wrong red`, () => {
686:     const problems = judgeInstallerRecovery(runOf(mutated(report => setCheck(report, key, false))));
687:     expect(problems.some(problem => problem.includes(key))).toBe(true);
688:   });
689: 
690:   for (const key of INSTALLER_RECOVERY_HARNESS) test(`a red that never ran harness check ${key} is the wrong red`, () => {
691:     const partial = mutated(report => {
692:       report.checks = report.checks.filter(check => `${check.scenario}:${check.id}` !== key);
693:     });
694:     expect(judgeInstallerRecovery(runOf(partial))).toContain(`harness check did not pass: ${key}`);
695:   });
696: 
697:   for (const key of INSTALLER_RECOVERY_SIGNATURE) test(`a red in which ${key} passes is not the known red`, () => {
698:     const problems = judgeInstallerRecovery(runOf(mutated(report => setCheck(report, key, true))));
699:     expect(problems).toContain(`known failure absent: ${key}`);
700:   });
701: 
702:   test('a missing compose is the wrong red', () => {
703:     const report = { accepted: false, checks: [], harnessError: 'compose the candidate before running acceptance' };
704:     const problems = judgeInstallerRecovery(runOf(report));
705:     expect(problems).toContain('harness error: compose the candidate before running acceptance');
706:   });
707: 
708:   test('a crash with no report and an unexpected exit status are both refused', () => {
709:     expect(judgeInstallerRecovery({ status: 1, stdout: '', stderr: 'SyntaxError: boom' })[0]).toContain('SyntaxError: boom');
710:     expect(judgeInstallerRecovery(runOf(KNOWN_RED, 3))).toContain('exit status 3, expected 1');
711:   });
712: });
713: 
714: describe('expect-red: install transaction coverage', () => {
715:   const COVERAGE_EVIDENCE = {
716:     projectRoot: 'C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign', host: { platform: 'win32' },
717:     coverageSummary: JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8')),
718:   };
719:   const judgeInstallTransactionCoverage = (run, evidence = COVERAGE_EVIDENCE) => judgeCoverage(run, evidence);
720:   // Real reviewed TAP from the landed lock module with only render pending.
721:   const KNOWN_TAP = fs.readFileSync(
722:     path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'),
723:     'utf8'
724:   );
725:   const tapRun = (stdout, status = 1, stderr = '') => ({ status, stdout, stderr });
726:   const FIRST_REASON = "error: 'not implemented: renderOutcome'";
727: 
728:   test('supplied malformed termination markers are never treated as absent', () => {
729:     for (const error of [false, 0, '', null]) {
730:       expect(judgeInstallTransactionCoverage({ ...tapRun(KNOWN_TAP), error }).length).toBeGreaterThan(0);
731:     }
732:     for (const signal of [false, 0, '']) {
733:       expect(judgeInstallTransactionCoverage({ ...tapRun(KNOWN_TAP), signal }).length).toBeGreaterThan(0);
734:     }
735:   });
736: 
737:   test('affirmative coverage requires both exact files, every metric and consistent aggregate counts', () => {
738:     for (const evidence of [undefined, null, {}, { ...COVERAGE_EVIDENCE, coverageSummary: {} },
739:       { ...COVERAGE_EVIDENCE, host: { platform: 'unknown' } },
740:       { ...COVERAGE_EVIDENCE, projectRoot: '/foreign-project' }]) {
741:       expect(judgeCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
742:     }
743:     for (const file of Object.keys(COVERAGE_EVIDENCE.coverageSummary)) {
744:       for (const metric of ['lines', 'statements', 'functions', 'branches']) {
745:         for (const delta of [{ total: 0 }, { covered: 0 }, { skipped: 1 }, { pct: 99.99 }, { pct: '100' }]) {
746:           const evidence = structuredClone(COVERAGE_EVIDENCE);
747:           Object.assign(evidence.coverageSummary[file][metric], delta);
748:           expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
749:         }
750:       }
751:       const absent = structuredClone(COVERAGE_EVIDENCE);
752:       delete absent.coverageSummary[file];
753:       expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), absent).length).toBeGreaterThan(0);
754:     }
755:     const aggregate = structuredClone(COVERAGE_EVIDENCE);
756:     aggregate.coverageSummary.total.branches.total++;
757:     aggregate.coverageSummary.total.branches.covered++;
758:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), aggregate).length).toBeGreaterThan(0);
759:     const extra = structuredClone(COVERAGE_EVIDENCE);
760:     extra.coverageSummary['C:/foreign/file.js'] = structuredClone(extra.coverageSummary.total);
761:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), extra).length).toBeGreaterThan(0);
762:     for (const platform of ['linux', 'darwin']) {
763:       const evidence = structuredClone(COVERAGE_EVIDENCE);
764:       evidence.host.platform = platform;
765:       evidence.projectRoot = '/project';
766:       evidence.coverageSummary = Object.fromEntries(Object.entries(evidence.coverageSummary).map(([name, data]) => [
767:         name === 'total' ? name : `/project/bin/lib/${path.win32.basename(name)}`, data,
768:       ]));
769:       expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence)).toEqual([]);
770:     }
771:   });
772: 
773:   test('coverage refuses malformed or interrupted runs and TAP tokens disguised as table rows', () => {
774:     for (const run of [undefined, null, {}, { ...tapRun(KNOWN_TAP), signal: 'SIGTERM' },
775:       { ...tapRun(KNOWN_TAP), error: new Error('timeout') }, { ...tapRun(KNOWN_TAP), stderr: null }]) {
776:       expect(judgeInstallTransactionCoverage(run).length).toBeGreaterThan(0);
777:     }
778:     for (const line of ['Bail out! | incomplete', '  ok 1 - nested | ignored', '# tests 51 | fake']) {
779:       expect(judgeInstallTransactionCoverage(tapRun(`${KNOWN_TAP}\n${line}`)).length).toBeGreaterThan(0);
780:     }
781:   });
782: 
783:   test('coverage aliases, malformed tables and truncated TAP are rejected', () => {
784:     const file = Object.keys(COVERAGE_EVIDENCE.coverageSummary).find(name => name !== 'total');
785:     for (const change of [
786:       evidence => { evidence.projectRoot = 'relative'; },
787:       evidence => { delete evidence.projectRoot; },
788:       evidence => { evidence.coverageSummary[file] = null; },
789:       evidence => { evidence.coverageSummary[file].unreviewedMetric = {}; },
790:       evidence => { evidence.coverageSummary[file.toUpperCase()] = evidence.coverageSummary[file]; },
791:     ]) {
792:       const evidence = structuredClone(COVERAGE_EVIDENCE);
793:       change(evidence);
794:       expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
795:     }
796:     for (const wrong of [
797:       changedText(KNOWN_TAP, '# Subtest: names:', '# Subtest: unknown:'),
798:       changedText(KNOWN_TAP, '  ---', '  missing-start'),
799:       KNOWN_TAP.slice(0, KNOWN_TAP.lastIndexOf('  ...')).trimEnd(),
800:       changedText(KNOWN_TAP, "  type: 'test'", "  type: 'test'\n  error: 'unexpected error'"),
801:       changedText(KNOWN_TAP, '# duration_ms ', '# duration_ms NaN'),
802:       `${KNOWN_TAP}\nunstructured trailing garbage`,
803:     ]) expect(judgeInstallTransactionCoverage(tapRun(wrong)).length).toBeGreaterThan(0);
804:   });
805: 
806:   test('a normalized alias cannot replace the exact covered source identity', () => {
807:     const evidence = structuredClone(COVERAGE_EVIDENCE);
808:     const file = Object.keys(evidence.coverageSummary).find(name => name !== 'total');
809:     const alias = `${path.win32.dirname(file)}/../lib/${path.win32.basename(file)}`;
810:     evidence.coverageSummary[alias] = evidence.coverageSummary[file];
811:     delete evidence.coverageSummary[file];
812:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP), evidence).length).toBeGreaterThan(0);
813:   });
814: 
815:   test('decision controls detect independently weakened recovery and coverage guards', () => {
816:     const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'expect-red.cjs'), 'utf8');
817:     const recoveryCases = [
818:       ['if (checks.has(key))', report => { report.checks.push(structuredClone(report.checks.find(row => keyOfCheck(row) === 'twin:child-failed-at-injection'))); }],
819:       ['if (!expectedKeys.has(key))', report => { report.checks.push({ scenario: 'fresh', id: 'unreviewed', kind: 'acceptance', ok: true }); }],
820:       ['if (report.fixtureRemoved !== true)', report => { report.fixtureRemoved = false; }],
821:       ['if (!validContext)', report => { report.context.upgrade.edited = '../owner'; }],
822:       ["if (check.id === 'home-outside-target-preserved'\n      ? !validHomeObservation(check.evidence, report.platform)\n      : validContext && !isDeepStrictEqual(check.evidence, recoveryObservation(check, report.context)))", report => {
823:         report.checks.find(check => check.id === 'new-equals-twin-residue').evidence.actual.changed.push('owner.txt');
824:       }],
825:       ['if (checks.get(key)?.ok !== true)', report => {
826:         setCheck(report, 'upgrade:owner-bytes-preserved', false);
827:         report.failure += ', upgrade:owner-bytes-preserved';
828:       }],
829:       ['if (checks.get(key)?.ok !== false)', report => {
830:         setCheck(report, 'fresh:outcome-exact', true);
831:         report.failure = report.failure.split(', ').filter(key => key !== 'fresh:outcome-exact').join(', ');
832:       }],
833:     ].map(([before, change]) => ({ before, after: 'if (false)', name: 'judgeInstallerRecovery',
834:       run: runOf(mutated(change)), evidence: RECOVERY_EVIDENCE }));
835:     const homeCases = [
836:       { before: 'before.get(name) !== after.get(name)', after: 'false', change: state => { state.after['.config/owner.txt'] = `file:${'a'.repeat(64)}`; } },
837:       { before: 'directories.has(name)', after: "(directories.has(name) || name === 'AppData/Local/Microsoft/Windows/Caches/extra')",
838:         change: state => { state.before['AppData/Local/Microsoft/Windows/Caches'] = state.after['AppData/Local/Microsoft/Windows/Caches'] = 'dir';
839:           state.after['AppData/Local/Microsoft/Windows/Caches/extra'] = 'dir'; } },
840:       { before: "(before.has(name) && !/^file:[a-f0-9]{64}$/.test(before.get(name)))", after: 'false',
841:         change: state => { state.before['AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive'] = 'link:elsewhere'; } },
842:       { before: "(before.has(name) && before.get(name) !== 'dir')", after: 'false',
843:         change: state => { state.before['AppData/Local/Microsoft/Windows/Caches'] = 'link:elsewhere';
844:           state.after['AppData/Local/Microsoft/Windows/Caches'] = 'dir'; } },
845:     ].map(control => ({ ...control, name: 'judgeInstallerRecovery', evidence: RECOVERY_EVIDENCE,
846:       run: runOf(mutated(report => control.change(report.checks.find(row => keyOfCheck(row) === 'upgrade:home-outside-target-preserved').evidence.actual))) }));
847:     const shortfall = structuredClone(COVERAGE_EVIDENCE);
848:     const file = Object.keys(shortfall.coverageSummary).find(name => name !== 'total');
849:     shortfall.coverageSummary[file].branches.pct = 99;
850:     const aggregate = structuredClone(COVERAGE_EVIDENCE);
851:     aggregate.coverageSummary.total.lines.total++;
852:     aggregate.coverageSummary.total.lines.covered++;
853:     const coverageCases = [
854:       { before: 'problems.push(...coverageEvidenceProblems(evidence));', after: '', evidence: undefined },
855:       { before: 'value.pct !== 100', after: 'false', evidence: shortfall },
856:       { before: "if (tables.get('total')[metric][count] !== sum)", after: 'if (false)', evidence: aggregate },
857:       { before: 'const framingProblems = tapFramingProblems(lines);', after: 'const framingProblems = [];',
858:         evidence: COVERAGE_EVIDENCE, run: tapRun(changedText(KNOWN_TAP, '# pass 41', '# pass 40')) },
859:       { before: `if (offset >= 41 && fields.get('error') !== "'not implemented: renderOutcome'")`, after: 'if (false)',
860:         evidence: COVERAGE_EVIDENCE, run: tapRun(changedText(KNOWN_TAP, FIRST_REASON, "error: 'unexpected owner loss'")) },
861:     ].map(value => ({ name: 'judgeInstallTransactionCoverage', run: tapRun(KNOWN_TAP), ...value }));
862:     for (const control of [...recoveryCases, ...homeCases, ...coverageCases]) {
863:       const judge = control.name === 'judgeInstallerRecovery' ? judgeRecovery : judgeCoverage;
864:       // The original rejection predicate must fail for this exact weakened copy.
865:       expect(judge(control.run, control.evidence).length).toBeGreaterThan(0);
866:       expect(source.split(control.before)).toHaveLength(2);
867:       const mutant = { exports: {} };
868:       require('node:vm').runInNewContext(source.replace(control.before, control.after), {
869:         module: mutant, require, process, Buffer, __dirname: path.resolve(__dirname, '..', 'scripts'),
870:       }, { filename: 'expect-red-decision-mutant.cjs', timeout: 1000 });
871:       expect(mutant.exports[control.name](control.run, control.evidence)).toEqual([]);
872:     }
873:     expect(recoveryCases.length + homeCases.length + coverageCases.length).toBe(16);
874:   });
875: 
876:   test('the reviewed 51-case render-only red is the known red', () => {
877:     expect(KNOWN_TAP.split(FIRST_REASON).length).toBeGreaterThan(2);
878:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP))).toEqual([]);
879:   });
880: 
881:   test('old skeleton evidence and any incomplete or changed case inventory are refused', () => {
882:     const old = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-known-red.tap.txt'), 'utf8');
883:     expect(judgeInstallTransactionCoverage(tapRun(old)).length).toBeGreaterThan(0);
884:     const lines = KNOWN_TAP.split('\n').filter(line => /^(not )?ok \d+ - /.test(line));
885:     expect(lines).toHaveLength(51);
886:     for (const line of lines) {
887:       for (const replacement of ['', line.replace(' - ', ' - unreviewed: '), `${line}\n${line}`]) {
888:         expect(judgeInstallTransactionCoverage(tapRun(changedText(KNOWN_TAP, line, replacement))).length).toBeGreaterThan(0);
889:       }
890:     }
891:   });
892: 
893:   test('TAP framing, terminal counts and bounded render failure diagnostics are mandatory', () => {
894:     for (const wrong of [
895:       changedText(KNOWN_TAP, 'TAP version 13', ''), `TAP version 13\n${KNOWN_TAP}`,
896:       changedText(KNOWN_TAP, '1..51', '1..50'), changedText(KNOWN_TAP, '1..51', '1..51\n1..51'),
897:       changedText(KNOWN_TAP, '# pass 41', '# pass 40'), changedText(KNOWN_TAP, '# skipped 0', '# skipped 1'),
898:       changedText(KNOWN_TAP, '# cancelled 0', '# cancelled 1'), changedText(KNOWN_TAP, '# todo 0', '# todo 1'),
899:       changedText(KNOWN_TAP, '# suites 0', '# suites 1'), changedText(KNOWN_TAP, '# tests 51', '# tests 50'),
900:       changedText(KNOWN_TAP, '# tests 51', '# unrelated\n# tests 51'),
901:       changedText(KNOWN_TAP, '  ...', '  broken-end'),
902:       changedText(KNOWN_TAP, "code: 'ERR_TEST_FAILURE'", "code: 'DIFFERENT_ERROR'"),
903:       changedText(KNOWN_TAP, "failureType: 'testCodeFailure'", "failureType: 'cancelledByParent'"),
904:       changedText(KNOWN_TAP, FIRST_REASON, "error: 'not implemented: acquireLock'"),
905:       changedText(KNOWN_TAP, FIRST_REASON, `${FIRST_REASON}\n  ${FIRST_REASON}`),
906:       `${KNOWN_TAP}\nBail out! incomplete`, `${KNOWN_TAP}\n    ok 1 - nested`,
907:     ]) expect(judgeInstallTransactionCoverage(tapRun(wrong)).length).toBeGreaterThan(0);
908:     const metadata = changedText(KNOWN_TAP, '  duration_ms:', "  futureMetadata: 'portable'\n  duration_ms:");
909:     expect(judgeInstallTransactionCoverage(tapRun(metadata))).toEqual([]);
910:   });
911: 
912:   test('only the actual error field can establish the permitted render failure', () => {
913:     const disguised = changedText(KNOWN_TAP, `  ${FIRST_REASON}`,
914:       `  futureMetadata: |-\n    ${FIRST_REASON}\n  error: 'unexpected owner loss'`);
915:     expect(judgeInstallTransactionCoverage(tapRun(disguised)).length).toBeGreaterThan(0);
916:   });
917: 
918:   test('a case failing for any reason other than an unbuilt operation is the wrong red', () => {
919:     const wrong = changedText(KNOWN_TAP, FIRST_REASON, "error: 'Expected values to be strictly equal'");
920:     const problems = judgeInstallTransactionCoverage(tapRun(wrong));
921:     expect(problems).toHaveLength(1);
922:     expect(problems[0].startsWith('failed for another reason: render:')).toBe(true);
923:   });
924: 
925:   test('a coverage shortfall on landed code is the wrong red, on either stream', () => {
926:     const shortfall = 'ERROR: Coverage for branches (88.88%) does not meet threshold (100%) for bin/lib/install-names.js';
927:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP, 1, `${shortfall}\n`))).toEqual([shortfall]);
928:     expect(judgeInstallTransactionCoverage(tapRun(`${KNOWN_TAP}\n${shortfall}\n`))).toEqual([shortfall]);
929:   });
930: 
931:   test('nothing failing, a crash with no summary, and a miscounted summary are all refused', () => {
932:     const green = KNOWN_TAP.split('\n').filter(line => !line.startsWith('# fail ')).join('\n');
933:     expect(judgeInstallTransactionCoverage(tapRun(`${green}\n# fail 0\n`, 0))[0]).toContain('UNEXPECTED PASS');
934:     expect(judgeInstallTransactionCoverage(tapRun('', 1, 'Error: Cannot find module'))[0]).toContain('Cannot find module');
935:     expect(judgeInstallTransactionCoverage(tapRun(changedText(KNOWN_TAP, '# fail 10', '# fail 11')))).toContain(
936:       'summary reports 11 failures, 10 found',
937:     );
938:     expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP, 7))).toEqual(['exit status 7, expected 1']);
939:   });
940: });
941: 
942: describe('expect-red: command line', () => {
943:   const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
944: 
945:   test('Node capture preserves a complete structured report larger than one MiB', () => {
946:     const run = captureNode(['-e', 'process.stdout.write(JSON.stringify({text:"x".repeat(2*1024*1024)}))'], { timeout: 10000 });
947:     expect(run.error).toBeUndefined();
948:     expect(run.status).toBe(0);
949:     expect(JSON.parse(run.stdout).text.length).toBe(2 * 1024 * 1024);
950:   });
951: 
952:   test('repository ESLint rejects unsafe code under both repaired CJS paths', async () => {
953:     const { ESLint } = require('eslint');
954:     const eslint = new ESLint({ cwd: path.resolve(__dirname, '..') });
955:     for (const filePath of ['scripts/expect-red.cjs', 'tests/acceptance/installer-recovery.cjs']) {
956:       const [unsafe] = await eslint.lintText('eval(process.argv[2]);\n', { filePath });
957:       expect(unsafe.messages.some(message => message.ruleId === 'security/detect-eval-with-expression' && message.severity === 2)).toBe(true);
958:       const [safe] = await eslint.lintText("const label = 'safe';\n", { filePath });
959:       expect(safe.errorCount).toBe(0);
960:     }
961:   });
962: 
963:   longTest('the actual Node CLI validates the live coverage gate through private c8 capture', () => {
964:     const env = { ...process.env };
965:     delete env.NODE_TEST_CONTEXT;
966:     const run = captureNode(['scripts/expect-red.cjs', 'install-transaction-coverage'], {
967:       cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8', timeout: 360000,
968:     });
969:     expect(run.error).toBeUndefined();
970:     expect(run.status).toBe(0);
971:     expect(run.stderr).toContain('# tests 51');
972:     expect(run.stderr).toContain('# pass 41');
973:     expect(run.stderr).toContain('# fail 10');
974:     expect(run.stderr).toContain('failed for the known reason');
975:     const provenance = run.stderr.split('\n').find(line => line.startsWith('expect-red evidence: '));
976:     expect(provenance).toBeDefined();
977:     const evidence = JSON.parse(provenance.slice('expect-red evidence: '.length));
978:     expect(evidence.node).toBe(nodeRuntime().version);
979:     expect(evidence.platform).toBe(nodeRuntime().platform);
980:   }, 400000);
981: 
982:   test('coverage ignore directives in either watched module refuse before execution', () => {
983:     for (const module of ['install-names.js', 'install-transaction.js']) {
984:       for (const provider of ['c8', 'v8', 'istanbul']) {
985:         let spawned = false;
986:         const messages = [];
987:         const result = main(['install-transaction-coverage'], {
988:           packageJson, log: message => messages.push(message),
989:           runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
990:           fs: { ...fs, readFileSync(name, ...args) {
991:             const bytes = fs.readFileSync(name, ...args);
992:             return path.basename(name) === module ? Buffer.concat([Buffer.from(bytes), Buffer.from(`\n/* ${provider} ignore next */`)]) : bytes;
993:           } },
994:           spawnSync: () => { spawned = true; return { status: 1, stdout: '', stderr: '' }; },
995:         });
996:         expect(result).toBe(1);
997:         expect(spawned).toBe(false);
998:         expect(messages.join('\n')).toContain(module);
999:       }
1000:     }
1001:   });
1002: 
1003:   test('capture bounds execution and isolates inherited test and coverage configuration', () => {
1004:     const previousContext = process.env.NODE_TEST_CONTEXT;
1005:     const previousCoverage = process.env.NODE_V8_COVERAGE;
1006:     process.env.NODE_TEST_CONTEXT = 'child-v8';
1007:     process.env.NODE_V8_COVERAGE = 'unrelated-coverage';
1008:     let inspected = false;
1009:     try {
1010:       main(['install-transaction-coverage'], {
1011:         packageJson, log: () => {},
1012:         runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
1013:         spawnSync: (_exe, args, options) => {
1014:           expect(options.env?.NODE_TEST_CONTEXT).toBeUndefined();
1015:           const temp = args.find(value => value.startsWith('--temp-directory=')).slice('--temp-directory='.length);
1016:           expect(options.env?.NODE_V8_COVERAGE).toBe(temp);
1017:           expect(Number.isInteger(options.timeout)).toBe(true);
1018:           expect(options.timeout).toBeGreaterThan(0);
1019:           expect(options.timeout).toBeLessThanOrEqual(300000);
1020:           const config = args.find(value => value.startsWith('--config='));
1021:           expect(config).toBeDefined();
1022:           expect(JSON.parse(fs.readFileSync(config.slice('--config='.length), 'utf8'))).toEqual({});
1023:           inspected = true;
1024:           return { status: 1, stdout: '', stderr: '' };
1025:         },
1026:       });
1027:       expect(inspected).toBe(true);
1028:     } finally {
1029:       if (previousContext === undefined) delete process.env.NODE_TEST_CONTEXT;
1030:       else process.env.NODE_TEST_CONTEXT = previousContext;
1031:       if (previousCoverage === undefined) delete process.env.NODE_V8_COVERAGE;
1032:       else process.env.NODE_V8_COVERAGE = previousCoverage;
1033:     }
1034:   });
1035: 
1036:   test('inherited Node options refuse before child execution for both gates', () => {
1037:     const previous = process.env.NODE_OPTIONS;
1038:     try {
1039:       for (const option of ['--test', '--test-reporter=tap', '--test-name-pattern=only-one', '--experimental-test-isolation=none',
1040:         '--require=./instrument.cjs', '-r ./instrument.cjs', '--import=./instrument.mjs',
1041:         '--experimental-loader=./loader.mjs', '--loader=./loader.mjs', '--conditions=custom',
1042:         '--enable-source-maps', '--max-old-space-size=4096']) {
1043:         for (const gate of ['installer-recovery', 'install-transaction-coverage']) {
1044:           process.env.NODE_OPTIONS = option;
1045:           let spawned = false;
1046:           const result = main([gate], {
1047:             packageJson, log: () => {},
1048:             runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
1049:             spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
1050:           });
1051:           expect(result).toBe(1);
1052:           expect(spawned).toBe(false);
1053:         }
1054:       }
1055:       process.env.NODE_OPTIONS = '  ';
1056:       let cleanEnvironment = false;
1057:       expect(main(['installer-recovery'], {
1058:         packageJson, log: () => {},
1059:         runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
1060:         spawnSync: (_exe, _args, options) => { cleanEnvironment = options.env.NODE_OPTIONS === undefined; return runOf(KNOWN_RED); },
1061:       })).toBe(0);
1062:       expect(cleanEnvironment).toBe(true);
1063:     } finally {
1064:       if (previous === undefined) delete process.env.NODE_OPTIONS;
1065:       else process.env.NODE_OPTIONS = previous;
1066:     }
1067:   });
1068: 
1069:   test('capture faults cannot pass or silently discard uncertain evidence', () => {
1070:     const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
1071:     const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
1072:     for (const mode of ['missing', 'malformed', 'symlink', 'not-file', 'cleanup', 'timeout', 'signal',
1073:       'spawn-throw', 'read-before', 'read-after', 'mkdir', 'scratch-link', 'scratch-not-directory', 'c8-version', 'c8-json']) {
1074:       let scratch;
1075:       let spawned = false;
1076:       const messages = [];
1077:       const fault = () => { throw Object.assign(new Error(`injected ${mode}`), { code: 'EACCES' }); };
1078:       const fileSystem = { ...fs,
1079:         mkdtempSync(prefix) { scratch = fs.mkdtempSync(prefix); return scratch; },
1080:         mkdirSync(name) { if (mode === 'mkdir') fault(); return fs.mkdirSync(name); },
1081:         readFileSync(name, ...args) {
1082:           if (path.basename(path.dirname(name)) === 'c8' && path.basename(name) === 'package.json') {
1083:             if (mode === 'c8-version') return '{}';
1084:             if (mode === 'c8-json') return '{bad';
1085:           }
1086:           if (mode === 'read-before' || (mode === 'read-after' && spawned && path.basename(name) !== 'coverage-summary.json')) fault();
1087:           if (path.basename(name) === 'coverage-summary.json') expect(path.dirname(path.dirname(name))).toBe(scratch);
1088:           return fs.readFileSync(name, ...args);
1089:         },
1090:         lstatSync(name) {
1091:           const stat = fs.lstatSync(name);
1092:           if (path.basename(name) === 'coverage-summary.json') {
1093:             if (mode === 'symlink') stat.isSymbolicLink = () => true;
1094:             if (mode === 'not-file') stat.isFile = () => false;
1095:           }
1096:           if (name === scratch) {
1097:             if (mode === 'scratch-link') stat.isSymbolicLink = () => true;
1098:             if (mode === 'scratch-not-directory') stat.isDirectory = () => false;
1099:           }
1100:           return stat;
1101:         },
1102:         rmSync(name, options) { if (mode === 'cleanup') fault(); return fs.rmSync(name, options); },
1103:       };
1104:       try {
1105:         const result = main(['install-transaction-coverage'], {
1106:           packageJson, fs: fileSystem, log: message => messages.push(message),
1107:           runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
1108:           spawnSync: (_exe, args) => {
1109:             spawned = true;
1110:             if (mode === 'spawn-throw') fault();
1111:             const reports = args.find(value => value.startsWith('--reports-dir=')).slice('--reports-dir='.length);
1112:             const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
1113:               name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
1114:             ]));
1115:             if (mode !== 'missing') fs.writeFileSync(path.join(reports, 'coverage-summary.json'), mode === 'malformed' ? '{broken' : JSON.stringify(nativeSummary));
1116:             if (mode === 'timeout') return { status: null, stdout, stderr: '', error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) };
1117:             if (mode === 'signal') return { status: null, stdout, stderr: '', signal: 'SIGTERM' };
1118:             return { status: 1, stdout, stderr: '' };
1119:           },
1120:         });
1121:         expect(result).toBe(1);
1122:         if (['timeout', 'signal', 'spawn-throw', 'mkdir', 'cleanup', 'scratch-link', 'scratch-not-directory'].includes(mode)) {
1123:           expect(fs.existsSync(scratch)).toBe(true);
1124:           expect(messages.join('\n')).toContain(scratch);
1125:         } else if (scratch) expect(fs.existsSync(scratch)).toBe(false);
1126:       } finally {
1127:         // No real child was launched. Only remove this test's exact recorded temp.
1128:         if (scratch && fs.existsSync(scratch)) {
1129:           expect(path.dirname(scratch)).toBe(path.resolve(__dirname, '..', '.claude'));
1130:           expect(path.basename(scratch).startsWith('expect-red-')).toBe(true);
1131:           fs.rmSync(scratch, { recursive: true });
1132:         }
1133:       }
1134:     }
1135:   });
1136: 
1137:   test('cleanup never removes a scratch path outside its exact ownership convention', () => {
1138:     const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
1139:     const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
1140:     const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
1141:       name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
1142:     ]));
1143:     for (const location of [['.claude', 'not-owned'], ['.planning', 'expect-red-foreign']]) {
1144:       let removed = false;
1145:       const messages = [];
1146:       // Virtual paths only: the injected filesystem does not create or write them.
1147:       const virtualPath = path.resolve(__dirname, '..', ...location);
1148:       const result = main(['install-transaction-coverage'], {
1149:         packageJson, log: message => messages.push(message),
1150:         runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
1151:         fs: { ...fs, mkdtempSync: () => virtualPath, mkdirSync() {}, writeFileSync() {},
1152:           lstatSync: () => ({ isFile: () => true, isSymbolicLink: () => false }),
1153:           readFileSync(name, ...args) {
1154:             return path.basename(name) === 'coverage-summary.json' ? JSON.stringify(nativeSummary) : fs.readFileSync(name, ...args);
1155:           },
1156:           rmSync() { removed = true; },
1157:         },
1158:         spawnSync: () => ({ status: 1, stdout, stderr: '' }),
1159:       });
1160:       expect(result).toBe(1);
1161:       expect(removed).toBe(false);
1162:       expect(messages.join('\n')).toContain('scratch ownership mismatch');
1163:     }
1164:   });
1165: 
1166:   test('coverage capture uses a new private report and V8 directory on every invocation', () => {
1167:     const seen = new Set();
1168:     const stdout = fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-red.tap.txt'), 'utf8');
1169:     const summary = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-render-coverage.json'), 'utf8'));
1170:     for (let index = 0; index < 2; index++) {
1171:       let scratch;
1172:       const messages = [];
1173:       const result = main(['install-transaction-coverage'], {
1174:         packageJson, log: message => messages.push(message),
1175:         runtime: { execPath: 'node', platform: process.platform, nodeVersion: process.version, isBun: false },
1176:         spawnSync: (_exe, args) => {
1177:           const reportIndex = args.findIndex(value => value.startsWith('--reports-dir='));
1178:           const tempIndex = args.findIndex(value => value.startsWith('--temp-directory='));
1179:           expect(reportIndex).toBeGreaterThan(0);
1180:           expect(tempIndex).toBeGreaterThan(0);
1181:           expect(reportIndex).toBeLessThan(args.indexOf('node'));
1182:           expect(tempIndex).toBeLessThan(args.indexOf('node'));
1183:           const reports = args[reportIndex].slice('--reports-dir='.length);
1184:           const v8 = args[tempIndex].slice('--temp-directory='.length);
1185:           scratch = path.dirname(reports);
1186:           expect(path.dirname(v8)).toBe(scratch);
1187:           expect(seen.has(scratch)).toBe(false);
1188:           seen.add(scratch);
1189:           expect(fs.readdirSync(reports)).toEqual([]);
1190:           expect(fs.readdirSync(v8)).toEqual([]);
1191:           const nativeSummary = Object.fromEntries(Object.entries(summary).map(([name, data]) => [
1192:             name === 'total' ? name : path.resolve(__dirname, '..', 'bin', 'lib', path.win32.basename(name)), data,
1193:           ]));
1194:           fs.writeFileSync(path.join(reports, 'coverage-summary.json'), JSON.stringify(nativeSummary));
1195:           return { status: 1, stdout, stderr: 'capture stderr retained' };
1196:         },
1197:       });
1198:       expect(result).toBe(0);
1199:       expect(fs.existsSync(scratch)).toBe(false);
1200:       expect(messages.join('\n')).toContain('capture stderr retained');
1201:     }
1202:   });
1203: 
1204:   test('source or validator changes during capture invalidate the report', () => {
1205:     for (const changed of ['bin/install.js', 'dist/bin/install.js', 'tests/acceptance/installer-recovery.cjs',
1206:       'package.json', 'scripts/expect-red.cjs']) {
1207:       let spawned = false;
1208:       const messages = [];
1209:       const fileSystem = { ...fs, readFileSync(name, ...args) {
1210:         const bytes = fs.readFileSync(name, ...args);
1211:         const relative = path.relative(path.resolve(__dirname, '..'), name).split(path.sep).join('/');
1212:         return spawned && relative === changed ? Buffer.concat([Buffer.from(bytes), Buffer.from(' ')]) : bytes;
1213:       } };
1214:       const result = main(['installer-recovery'], {
1215:         packageJson, fs: fileSystem, log: message => messages.push(message),
1216:         runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
1217:         spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
1218:       });
1219:       expect(result).toBe(1);
1220:       expect(messages.join('\n')).toContain(changed);
1221:     }
1222:   });
1223: 
1224:   test('the package command is parsed from the same bytes as its evidence digest', () => {
1225:     let spawned = false;
1226:     const changed = structuredClone(packageJson);
1227:     changed.scripts['test:acceptance:installer-recovery'] = 'node tests/other.cjs';
1228:     const result = main(['installer-recovery'], {
1229:       packageJson, log: () => {},
1230:       runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
1231:       fs: { ...fs, readFileSync(name, ...args) {
1232:         return path.resolve(name) === path.resolve(__dirname, '..', 'package.json')
1233:           ? Buffer.from(JSON.stringify(changed)) : fs.readFileSync(name, ...args);
1234:       } },
1235:       spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
1236:     });
1237:     expect(result).toBe(1);
1238:     expect(spawned).toBe(false);
1239:   });
1240: 
1241:   test('the runner prints source identities and runtime provenance with its verdict', () => {
1242:     const messages = [];
1243:     expect(main(['installer-recovery'], {
1244:       packageJson, log: message => messages.push(message),
1245:       runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
1246:       spawnSync: () => runOf(KNOWN_RED),
1247:     })).toBe(0);
1248:     const line = messages.find(message => typeof message === 'string' && message.startsWith('expect-red evidence: '));
1249:     expect(line).toBeDefined();
1250:     const evidence = JSON.parse(line.slice('expect-red evidence: '.length));
1251:     expect(evidence.node).toBe(capturedRecovery.node);
1252:     expect(evidence.platform).toBe(capturedRecovery.platform);
1253:     expect(Object.keys(evidence.sourceHashes).sort()).toEqual([
1254:       'bin/install.js', 'dist/bin/install.js', 'package.json', 'scripts/expect-red.cjs', 'tests/acceptance/installer-recovery.cjs',
1255:     ]);
1256:     for (const digest of Object.values(evidence.sourceHashes)) expect(digest).toMatch(/^[a-f0-9]{64}$/);
1257:   });
1258: 
1259:   test('c8 executes the same explicit Node runtime that captured the evidence', () => {
1260:     const selectedNode = path.resolve(__dirname, '..', '.claude', 'selected-node-runtime');
1261:     let observed;
1262:     main(['install-transaction-coverage'], {
1263:       packageJson, log: () => {},
1264:       runtime: { execPath: selectedNode, platform: process.platform, nodeVersion: process.version, isBun: false },
1265:       spawnSync: (exe, args) => { observed = { exe, args }; return { status: 1, stdout: '', stderr: '' }; },
1266:     });
1267:     expect(observed.exe).toBe(selectedNode);
1268:     expect(observed.args[observed.args.indexOf('--test') - 1]).toBe(selectedNode);
1269:   });
1270: 
1271:   test('the production gate refuses Bun before spawning a child', () => {
1272:     let spawned = false;
1273:     const messages = [];
1274:     const result = main(['installer-recovery'], {
1275:       packageJson, log: message => messages.push(message),
1276:       runtime: { execPath: process.execPath, platform: process.platform, nodeVersion: process.version, isBun: true },
1277:       spawnSync: () => { spawned = true; return runOf(KNOWN_RED); },
1278:     });
1279:     expect(spawned).toBe(false);
1280:     expect(result).toBe(1);
1281:     expect(messages.join('\n')).toContain('Node');
1282:   });
1283: 
1284:   test('the gate command is read from package.json, not copied', () => {
1285:     expect(commandFor({ script: 'test:acceptance:installer-recovery' }, packageJson)).toEqual([
1286:       'tests/acceptance/installer-recovery.cjs',
1287:     ]);
1288:     const coverage = commandFor({ script: 'test:coverage:install-transaction' }, packageJson);
1289:     expect(coverage).toContain('--include=bin/lib/install-transaction.js');
1290:     expect(coverage.some(argument => argument.includes("'"))).toBe(false);
1291:     expect(() => commandFor({ script: 'test' }, { scripts: { test: 'bun test' } })).toThrow('plain "node <file>"');
1292:     expect(() => commandFor({ script: 'absent' }, packageJson)).toThrow('absent');
1293:   });
1294: 
1295:   test('package commands cannot weaken coverage or redirect the reviewed gate', () => {
1296:     const script = 'test:coverage:install-transaction';
1297:     const command = packageJson.scripts[script];
1298:     for (const changed of [
1299:       command.replace('--branches 100', '--branches 99'),
1300:       command.replace('--all ', ''), command.replace('--per-file ', ''),
1301:       command.replace('--reporter=json-summary ', ''),
1302:       command.replace('--test-reporter=tap', '--test-reporter=spec'),
1303:       command.replace('tests/coverage/install-transaction.test.cjs', 'tests/other.cjs'),
1304:       `${command} --config=elsewhere.json`, `${command} --exclude=bin/lib/install-transaction.js`,
1305:     ]) expect(() => commandFor({ script }, { scripts: { [script]: changed } })).toThrow();
1306:     expect(() => commandFor({ script: 'test:acceptance:installer-recovery' }, {
1307:       scripts: { 'test:acceptance:installer-recovery': 'node tests/other.cjs' },
1308:     })).toThrow();
1309:   });
1310: 
1311:   test('exits 0 on the known red, 1 on anything else, 2 on misuse', () => {
1312:     const lines = [];
1313:     const dependencies = result => ({ packageJson, log: line => lines.push(line), spawnSync: () => result,
1314:       runtime: { execPath: 'node', platform: capturedRecovery.platform, nodeVersion: capturedRecovery.node, isBun: false },
1315:     });
1316:     expect(main(['installer-recovery'], dependencies(runOf(KNOWN_RED)))).toBe(0);
1317:     expect(main(['installer-recovery'], dependencies(runOf(KNOWN_RED, 0)))).toBe(1);
1318:     expect(main(['installer-recovery'], dependencies({ error: new Error('spawn ENOENT') }))).toBe(1);
1319:     expect(main([], dependencies(runOf(KNOWN_RED)))).toBe(2);
1320:     expect(main(['constructor'], dependencies(runOf(KNOWN_RED)))).toBe(2);
1321:     expect(lines.join('\n')).toContain('Usage: node scripts/expect-red.cjs <installer-recovery|install-transaction-coverage>');
1322:   });
1323: });

## tests/fixtures/expect-red/installer-recovery-structured-red.json SHA256 ea0ed0f9646d1761e539104d6b60373fac594e2d182b2a1d95c10d46b9b0cfaa
1: {
2:   "platform": "win32",
3:   "node": "v24.20.0",
4:   "accepted": false,
5:   "checks": [
6:     {
7:       "scenario": "twin",
8:       "kind": "harness",
9:       "id": "child-failed-at-injection",
10:       "ok": true,
11:       "evidence": {
12:         "kind": "assertion-pass",
13:         "actual": {}
14:       }
15:     },
16:     {
17:       "scenario": "twin",
18:       "kind": "harness",
19:       "id": "residue-non-empty",
20:       "ok": true,
21:       "evidence": {
22:         "kind": "assertion-pass",
23:         "actual": {}
24:       }
25:     },
26:     {
27:       "scenario": "fresh",
28:       "kind": "harness",
29:       "id": "wrapper-child-failed-at-injection",
30:       "ok": true,
31:       "evidence": {
32:         "kind": "assertion-pass",
33:         "actual": {}
34:       }
35:     },
36:     {
37:       "scenario": "fresh",
38:       "kind": "acceptance",
39:       "id": "status-is-1",
40:       "ok": true,
41:       "evidence": {
42:         "kind": "assertion-pass",
43:         "actual": {}
44:       }
45:     },
46:     {
47:       "scenario": "fresh",
48:       "kind": "acceptance",
49:       "id": "outcome-exact",
50:       "ok": false,
51:       "evidence": {
52:         "kind": "outcome-lines",
53:         "actual": {
54:           "lines": [
55:             "Rollback applied"
56:           ]
57:         }
58:       },
59:       "detail": "outcome line is not the verified form: \"Rollback applied\""
60:     },
61:     {
62:       "scenario": "fresh",
63:       "kind": "acceptance",
64:       "id": "home-outside-target-preserved",
65:       "ok": true,
66:       "evidence": {
67:         "kind": "home-state",
68:         "actual": {
69:           "before": {
70:             ".cache": "dir",
71:             ".codex": "dir",
72:             ".config": "dir",
73:             ".gsd": "dir",
74:             ".local": "dir",
75:             "AppData": "dir",
76:             "other-owner": "dir",
77:             "other-owner/empty": "dir",
78:             "AppData/Local": "dir",
79:             "AppData/Roaming": "dir",
80:             "AppData/Roaming/owner.txt": "file:28c1aef6e81ffeaefb84dc6f3ce40782634fbdf2da6b34d902a3471eda919f96",
81:             "AppData/Local/owner.txt": "file:e499611dd9b769d7e03f0d0aeaccea8d7e6d7f1afcf1e326814e4da09e515a54",
82:             ".local/share": "dir",
83:             ".gsd/owner.json": "file:b5f487601adb4b7904b51e721bc732659bed9b6277b4b0363c097486f85e6ebe",
84:             ".config/owner.txt": "file:cae8bccf23526392cc6a3d970ab5cf82e5858fc5b1924a9164944812a51e6fcc",
85:             ".codex/owner.txt": "file:4b371db1a677affe16e51582a5f39200fcf7ec05287c479943d64522e3ba2956"
86:           },
87:           "after": {
88:             ".cache": "dir",
89:             ".codex": "dir",
90:             ".config": "dir",
91:             ".gsd": "dir",
92:             ".local": "dir",
93:             "AppData": "dir",
94:             "other-owner": "dir",
95:             "other-owner/empty": "dir",
96:             "AppData/Local": "dir",
97:             "AppData/Roaming": "dir",
98:             "AppData/Roaming/owner.txt": "file:28c1aef6e81ffeaefb84dc6f3ce40782634fbdf2da6b34d902a3471eda919f96",
99:             "AppData/Local/Microsoft": "dir",
100:             "AppData/Local/owner.txt": "file:e499611dd9b769d7e03f0d0aeaccea8d7e6d7f1afcf1e326814e4da09e515a54",
101:             "AppData/Local/Microsoft/Windows": "dir",
102:             "AppData/Local/Microsoft/Windows/PowerShell": "dir",
103:             "AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive": "file:49cd61f5a4b874d896bff0b4be0f1cd96b80e1a2427b49003b39e3c0fa7ca487",
104:             ".local/share": "dir",
105:             ".gsd/owner.json": "file:b5f487601adb4b7904b51e721bc732659bed9b6277b4b0363c097486f85e6ebe",
106:             ".config/owner.txt": "file:cae8bccf23526392cc6a3d970ab5cf82e5858fc5b1924a9164944812a51e6fcc",
107:             ".codex/owner.txt": "file:4b371db1a677affe16e51582a5f39200fcf7ec05287c479943d64522e3ba2956"
108:           }
109:         }
110:       }
111:     },
112:     {
113:       "scenario": "fresh",
114:       "kind": "acceptance",
115:       "id": "top-level-exact-allowlist",
116:       "ok": false,
117:       "evidence": {
118:         "kind": "top-level-names",
119:         "actual": {
120:           "names": [
121:             ".gsd-source",
122:             "agents",
123:             "gsd-core",
124:             "gsd-migration-journal",
125:             "hooks",
126:             "owner.txt",
127:             "package.json",
128:             "scripts",
129:             "settings.json",
130:             "skills"
131:           ]
132:         }
133:       },
134:       "detail": "Expected values to be strictly deep-equal:\n+ actual - expected\n\n  [\n+   '.gsd-source',\n+   'agents',\n+   'gsd-core',\n+   'gsd-migration-journal',\n+   'hooks',\n-   'gsd-install-transaction',\n    'owner.txt',\n+   'package.json',\n+   'scripts',\n    'settings.json',\n+   'skills'\n  ]\n"
135:     },
136:     {
137:       "scenario": "fresh",
138:       "kind": "acceptance",
139:       "id": "owner-bytes-preserved",
140:       "ok": true,
141:       "evidence": {
142:         "kind": "assertion-pass",
143:         "actual": {}
144:       }
145:     },
146:     {
147:       "scenario": "fresh",
148:       "kind": "acceptance",
149:       "id": "transaction-directory-shape",
150:       "ok": false,
151:       "evidence": {
152:         "kind": "transaction-state",
153:         "actual": {
154:           "state": "absent"
155:         }
156:       },
157:       "detail": "transaction root is absent"
158:     },
159:     {
160:       "scenario": "fresh",
161:       "kind": "acceptance",
162:       "id": "quarantine-path-printed",
163:       "ok": false,
164:       "evidence": {
165:         "kind": "quarantine-reference",
166:         "actual": {
167:           "path": null
168:         }
169:       },
170:       "detail": "no quarantine to name"
171:     },
172:     {
173:       "scenario": "fresh",
174:       "kind": "acceptance",
175:       "id": "new-equals-twin-residue",
176:       "ok": false,
177:       "evidence": {
178:         "kind": "tree-delta",
179:         "actual": {
180:           "missing": [
181:             ".gsd-source",
182:             "agents",
183:             "agents/general-purpose.md",
184:             "agents/gsd-advisor-researcher.md",
185:             "agents/gsd-ai-researcher.md",
186:             "agents/gsd-assumptions-analyzer.md",
187:             "agents/gsd-code-fixer.md",
188:             "agents/gsd-code-reviewer.md",
189:             "agents/gsd-codebase-mapper.md",
190:             "agents/gsd-debug-session-manager.md",
191:             "agents/gsd-debugger.md",
192:             "agents/gsd-doc-classifier.md",
193:             "agents/gsd-doc-synthesizer.md",
194:             "agents/gsd-doc-verifier.md",
195:             "agents/gsd-doc-writer.md",
196:             "agents/gsd-domain-researcher.md",
197:             "agents/gsd-eval-auditor.md",
198:             "agents/gsd-eval-planner.md",
199:             "agents/gsd-executor.md",
200:             "agents/gsd-framework-selector.md",
201:             "agents/gsd-integration-checker.md",
202:             "agents/gsd-intel-updater.md",
203:             "agents/gsd-mempalace-curator.md",
204:             "agents/gsd-nyquist-auditor.md",
205:             "agents/gsd-oversight-execution.md",
206:             "agents/gsd-oversight-planning.md",
207:             "agents/gsd-oversight-sync.md",
208:             "agents/gsd-oversight-verification.md",
209:             "agents/gsd-pattern-mapper.md",
210:             "agents/gsd-phase-researcher.md",
211:             "agents/gsd-plan-checker.md",
212:             "agents/gsd-planner.md",
213:             "agents/gsd-project-researcher.md",
214:             "agents/gsd-research-synthesizer.md",
215:             "agents/gsd-roadmapper.md",
216:             "agents/gsd-security-auditor.md",
217:             "agents/gsd-ui-auditor.md",
218:             "agents/gsd-ui-checker.md",
219:             "agents/gsd-ui-researcher.md",
220:             "agents/gsd-user-profiler.md",
221:             "agents/gsd-verifier.md",
222:             "gsd-core",
223:             "gsd-core/.gsd-runtime",
224:             "gsd-core/VERSION",
225:             "gsd-core/bin",
226:             "gsd-core/bin/check-latest-version.cjs",
227:             "gsd-core/bin/ensure-runtime-build.cjs",
228:             "gsd-core/bin/gsd-tools.cjs",
229:             "gsd-core/bin/gsd_run",
230:             "gsd-core/bin/lib",
231:             "gsd-core/bin/lib/active-workstream-store.cjs",
232:             "gsd-core/bin/lib/adapter-declarative.cjs",
233:             "gsd-core/bin/lib/adapter-imperative.cjs",
234:             "gsd-core/bin/lib/adr-parser.cjs",
235:             "gsd-core/bin/lib/agent-command-router.cjs",
236:             "gsd-core/bin/lib/agent-install-check.cjs",
237:             "gsd-core/bin/lib/api-coverage.cjs",
238:             "gsd-core/bin/lib/artifacts.cjs",
239:             "gsd-core/bin/lib/assumption-delta.cjs",
240:             "gsd-core/bin/lib/audit-command-router.cjs",
241:             "gsd-core/bin/lib/audit.cjs",
242:             "gsd-core/bin/lib/broken-windows.cjs",
243:             "gsd-core/bin/lib/capability-activation.cjs",
244:             "gsd-core/bin/lib/capability-command-router.cjs",
245:             "gsd-core/bin/lib/capability-consent.cjs",
246:             "gsd-core/bin/lib/capability-ledger.cjs",
247:             "gsd-core/bin/lib/capability-lifecycle.cjs",
248:             "gsd-core/bin/lib/capability-loader.cjs",
249:             "gsd-core/bin/lib/capability-lock.cjs",
250:             "gsd-core/bin/lib/capability-registry.cjs",
251:             "gsd-core/bin/lib/capability-source.cjs",
252:             "gsd-core/bin/lib/capability-state.cjs",
253:             "gsd-core/bin/lib/capability-trust.cjs",
254:             "gsd-core/bin/lib/capability-validator.cjs",
255:             "gsd-core/bin/lib/capability-writer.cjs",
256:             "gsd-core/bin/lib/check-command-router.cjs",
257:             "gsd-core/bin/lib/cjs-command-router-adapter.cjs",
258:             "gsd-core/bin/lib/claude-orchestration-command-router.cjs",
259:             "gsd-core/bin/lib/claude-orchestration.cjs",
260:             "gsd-core/bin/lib/cli-exit.cjs",
261:             "gsd-core/bin/lib/cli-skew-check.cjs",
262:             "gsd-core/bin/lib/clock.cjs",
263:             "gsd-core/bin/lib/clusters.cjs",
264:             "gsd-core/bin/lib/code-review-flags.cjs",
265:             "gsd-core/bin/lib/command-aliases.cjs",
266:             "gsd-core/bin/lib/command-arg-projection.cjs",
267:             "gsd-core/bin/lib/command-roster.cjs",
268:             "gsd-core/bin/lib/command-routing-hub.cjs",
269:             "gsd-core/bin/lib/commands.cjs",
270:             "gsd-core/bin/lib/config-loader.cjs",
271:             "gsd-core/bin/lib/config-schema.cjs",
272:             "gsd-core/bin/lib/config-types.cjs",
273:             "gsd-core/bin/lib/config.cjs",
274:             "gsd-core/bin/lib/configuration.cjs",
275:             "gsd-core/bin/lib/context-utilization.cjs",
276:             "gsd-core/bin/lib/core-utils.cjs",
277:             "gsd-core/bin/lib/coverage.cjs",
278:             "gsd-core/bin/lib/decisions.cjs",
279:             "gsd-core/bin/lib/docs.cjs",
280:             "gsd-core/bin/lib/drift.cjs",
281:             "gsd-core/bin/lib/edge-probe.cjs",
282:             "gsd-core/bin/lib/embedding-adapter.cjs",
283:             "gsd-core/bin/lib/estimate-cli.cjs",
284:             "gsd-core/bin/lib/eval-command-router.cjs",
285:             "gsd-core/bin/lib/eval.cjs",
286:             "gsd-core/bin/lib/external-descriptor-trust.cjs",
287:             "gsd-core/bin/lib/external-job.cjs",
288:             "gsd-core/bin/lib/fallow-runner.cjs",
289:             "gsd-core/bin/lib/federated-config.cjs",
290:             "gsd-core/bin/lib/fork-roadmap-persistence.cjs",
291:             "gsd-core/bin/lib/frontmatter.cjs",
292:             "gsd-core/bin/lib/gap-checker.cjs",
293:             "gsd-core/bin/lib/gate-predicate-evaluator.cjs",
294:             "gsd-core/bin/lib/git-base-branch.cjs",
295:             "gsd-core/bin/lib/graphify-command-router.cjs",
296:             "gsd-core/bin/lib/graphify.cjs",
297:             "gsd-core/bin/lib/gsd2-import.cjs",
298:             "gsd-core/bin/lib/handshake-serialized.cjs",
299:             "gsd-core/bin/lib/hook-bus.cjs",
300:             "gsd-core/bin/lib/host-integration-adapters",
301:             "gsd-core/bin/lib/host-integration-adapters/cline-sdk-binding.cjs",
302:             "gsd-core/bin/lib/host-integration-adapters/imperative-hook-bus.cjs",
303:             "gsd-core/bin/lib/host-integration-sdk.cjs",
304:             "gsd-core/bin/lib/host-integration.cjs",
305:             "gsd-core/bin/lib/init-command-router.cjs",
306:             "gsd-core/bin/lib/init.cjs",
307:             "gsd-core/bin/lib/install-effort-resolver.cjs",
308:             "gsd-core/bin/lib/install-engine.cjs",
309:             "gsd-core/bin/lib/install-profiles.cjs",
310:             "gsd-core/bin/lib/installer-migration-authoring.cjs",
311:             "gsd-core/bin/lib/installer-migration-report.cjs",
312:             "gsd-core/bin/lib/installer-migrations",
313:             "gsd-core/bin/lib/installer-migrations.cjs",
314:             "gsd-core/bin/lib/installer-migrations/000-first-time-baseline.cjs",
315:             "gsd-core/bin/lib/installer-migrations/001-legacy-orphan-files.cjs",
316:             "gsd-core/bin/lib/installer-migrations/002-codex-legacy-hooks-json.cjs",
317:             "gsd-core/bin/lib/installer-migrations/003-rename-get-shit-done-to-gsd-core.cjs",
318:             "gsd-core/bin/lib/installer-migrations/004-prune-stale-pristine-snapshots.cjs",
319:             "gsd-core/bin/lib/installer-migrations/005-opencode-baseline-commands-dir.cjs",
320:             "gsd-core/bin/lib/installer-migrations/006-pi-extension-cjs-to-js.cjs",
321:             "gsd-core/bin/lib/intel-command-router.cjs",
322:             "gsd-core/bin/lib/intel.cjs",
323:             "gsd-core/bin/lib/io.cjs",
324:             "gsd-core/bin/lib/learnings.cjs",
325:             "gsd-core/bin/lib/legacy-cleanup.cjs",
326:             "gsd-core/bin/lib/loop-host-contract.cjs",
327:             "gsd-core/bin/lib/loop-resolver.cjs",
328:             "gsd-core/bin/lib/markdown-sectionizer.cjs",
329:             "gsd-core/bin/lib/markdown-table.cjs",
330:             "gsd-core/bin/lib/mcp-server.cjs",
331:             "gsd-core/bin/lib/milestone.cjs",
332:             "gsd-core/bin/lib/model-adapter.cjs",
333:             "gsd-core/bin/lib/model-catalog.cjs",
334:             "gsd-core/bin/lib/model-profiles.cjs",
335:             "gsd-core/bin/lib/model-resolver.cjs",
336:             "gsd-core/bin/lib/normalize-test-command.cjs",
337:             "gsd-core/bin/lib/observability",
338:             "gsd-core/bin/lib/observability/event.cjs",
339:             "gsd-core/bin/lib/observability/logger.cjs",
340:             "gsd-core/bin/lib/observability/redaction.cjs",
341:             "gsd-core/bin/lib/onboard-projection.cjs",
342:             "gsd-core/bin/lib/package-identity.cjs",
343:             "gsd-core/bin/lib/package-legitimacy.cjs",
344:             "gsd-core/bin/lib/phase-command-router.cjs",
345:             "gsd-core/bin/lib/phase-estimation.cjs",
346:             "gsd-core/bin/lib/phase-id.cjs",
347:             "gsd-core/bin/lib/phase-lifecycle.cjs",
348:             "gsd-core/bin/lib/phase-locator.cjs",
349:             "gsd-core/bin/lib/phase.cjs",
350:             "gsd-core/bin/lib/phases-command-router.cjs",
351:             "gsd-core/bin/lib/plan-drift-guard.cjs",
352:             "gsd-core/bin/lib/plan-scan.cjs",
353:             "gsd-core/bin/lib/planning-workspace.cjs",
354:             "gsd-core/bin/lib/probe-core.cjs",
355:             "gsd-core/bin/lib/profile-output.cjs",
356:             "gsd-core/bin/lib/profile-pipeline-command-router.cjs",
357:             "gsd-core/bin/lib/profile-pipeline.cjs",
358:             "gsd-core/bin/lib/prohibition-enforcement.cjs",
359:             "gsd-core/bin/lib/project-root.cjs",
360:             "gsd-core/bin/lib/prompt-budget.cjs",
361:             "gsd-core/bin/lib/research-provider.cjs",
362:             "gsd-core/bin/lib/research-store.cjs",
363:             "gsd-core/bin/lib/resolution.cjs",
364:             "gsd-core/bin/lib/review-lane-descriptor.cjs",
365:             "gsd-core/bin/lib/review-lane-invocation.cjs",
366:             "gsd-core/bin/lib/review-lane-runner.cjs",
367:             "gsd-core/bin/lib/review-reviewer-selection.cjs",
368:             "gsd-core/bin/lib/roadmap-command-router.cjs",
369:             "gsd-core/bin/lib/roadmap-parser.cjs",
370:             "gsd-core/bin/lib/roadmap-upgrade.cjs",
371:             "gsd-core/bin/lib/roadmap.cjs",
372:             "gsd-core/bin/lib/runtime-artifact-conversion.cjs",
373:             "gsd-core/bin/lib/runtime-artifact-install-plan.cjs",
374:             "gsd-core/bin/lib/runtime-artifact-layout.cjs",
375:             "gsd-core/bin/lib/runtime-config-adapter-registry.cjs",
376:             "gsd-core/bin/lib/runtime-homes.cjs",
377:             "gsd-core/bin/lib/runtime-hooks-surface.cjs",
378:             "gsd-core/bin/lib/runtime-name-policy.cjs",
379:             "gsd-core/bin/lib/runtime-slash.cjs",
380:             "gsd-core/bin/lib/schema-detect.cjs",
381:             "gsd-core/bin/lib/secrets.cjs",
382:             "gsd-core/bin/lib/security.cjs",
383:             "gsd-core/bin/lib/semver-compare.cjs",
384:             "gsd-core/bin/lib/shell-command-projection.cjs",
385:             "gsd-core/bin/lib/smart-entry.cjs",
386:             "gsd-core/bin/lib/spec-section.cjs",
387:             "gsd-core/bin/lib/stale-bake-guard.cjs",
388:             "gsd-core/bin/lib/state-command-router.cjs",
389:             "gsd-core/bin/lib/state-document.cjs",
390:             "gsd-core/bin/lib/state-io.cjs",
391:             "gsd-core/bin/lib/state-transition.cjs",
392:             "gsd-core/bin/lib/state.cjs",
393:             "gsd-core/bin/lib/surface.cjs",
394:             "gsd-core/bin/lib/task-command-router.cjs",
395:             "gsd-core/bin/lib/teams-status.cjs",
396:             "gsd-core/bin/lib/template.cjs",
397:             "gsd-core/bin/lib/uat-predicate.cjs",
398:             "gsd-core/bin/lib/uat.cjs",
399:             "gsd-core/bin/lib/ui-consideration-probe.cjs",
400:             "gsd-core/bin/lib/ui-safety-gate.cjs",
401:             "gsd-core/bin/lib/unusable-input.cjs",
402:             "gsd-core/bin/lib/update-context.cjs",
403:             "gsd-core/bin/lib/validate-command-router.cjs",
404:             "gsd-core/bin/lib/validate.cjs",
405:             "gsd-core/bin/lib/verification-command-router.cjs",
406:             "gsd-core/bin/lib/verification.cjs",
407:             "gsd-core/bin/lib/verify-command-router.cjs",
408:             "gsd-core/bin/lib/verify.cjs",
409:             "gsd-core/bin/lib/workstream-inventory-builder.cjs",
410:             "gsd-core/bin/lib/workstream-inventory.cjs",
411:             "gsd-core/bin/lib/workstream-name-policy.cjs",
412:             "gsd-core/bin/lib/workstream.cjs",
413:             "gsd-core/bin/lib/worktree-base-ref.cjs",
414:             "gsd-core/bin/lib/worktree-safety.cjs",
415:             "gsd-core/bin/lib/write-set.cjs",
416:             "gsd-core/bin/shared",
417:             "gsd-core/bin/shared/config-defaults.manifest.json",
418:             "gsd-core/bin/shared/config-schema.manifest.json",
419:             "gsd-core/bin/shared/model-catalog.json",
420:             "gsd-core/bin/shared/runtime-aliases.manifest.json",
421:             "gsd-core/bin/verify-reapply-patches.cjs",
422:             "gsd-core/contexts",
423:             "gsd-core/contexts/dev.md",
424:             "gsd-core/contexts/research.md",
425:             "gsd-core/contexts/review.md",
426:             "gsd-core/references",
427:             "gsd-core/references/agent-contracts.md",
428:             "gsd-core/references/agent-skills-bootstrap.md",
429:             "gsd-core/references/ai-evals.md",
430:             "gsd-core/references/ai-frameworks.md",
431:             "gsd-core/references/api-coverage.md",
432:             "gsd-core/references/artifact-types.md",
433:             "gsd-core/references/autonomous-smart-discuss.md",
434:             "gsd-core/references/checkpoints.md",
435:             "gsd-core/references/common-bug-patterns.md",
436:             "gsd-core/references/context-budget.md",
437:             "gsd-core/references/continuation-format.md",
438:             "gsd-core/references/debugger-bug-taxonomy.md",
439:             "gsd-core/references/debugger-fix-acceptance.md",
440:             "gsd-core/references/debugger-philosophy.md",
441:             "gsd-core/references/debugger-prevention.md",
442:             "gsd-core/references/debugger-rca-branching.md",
443:             "gsd-core/references/debugger-repro-hardening.md",
444:             "gsd-core/references/debugger-sbfl.md",
445:             "gsd-core/references/debugger-semantic-recall.md",
446:             "gsd-core/references/decimal-phase-calculation.md",
447:             "gsd-core/references/doc-conflict-engine.md",
448:             "gsd-core/references/domain-probes.md",
449:             "gsd-core/references/edge-probe-fixtures",
450:             "gsd-core/references/edge-probe-fixtures/01-round-half-even",
451:             "gsd-core/references/edge-probe-fixtures/01-round-half-even/expected-coverage.json",
452:             "gsd-core/references/edge-probe-fixtures/01-round-half-even/requirements.json",
453:             "gsd-core/references/edge-probe-fixtures/02-merge-intervals",
454:             "gsd-core/references/edge-probe-fixtures/02-merge-intervals/expected-coverage.json",
455:             "gsd-core/references/edge-probe-fixtures/02-merge-intervals/requirements.json",
456:             "gsd-core/references/edge-probe-fixtures/03-truncate-graphemes",
457:             "gsd-core/references/edge-probe-fixtures/03-truncate-graphemes/expected-coverage.json",
458:             "gsd-core/references/edge-probe-fixtures/03-truncate-graphemes/requirements.json",
459:             "gsd-core/references/edge-probe-fixtures/04-money-rounding",
460:             "gsd-core/references/edge-probe-fixtures/04-money-rounding/expected-coverage.json",
461:             "gsd-core/references/edge-probe-fixtures/04-money-rounding/requirements.json",
462:             "gsd-core/references/edge-probe-fixtures/05-list-dedupe",
463:             "gsd-core/references/edge-probe-fixtures/05-list-dedupe/expected-coverage.json",
464:             "gsd-core/references/edge-probe-fixtures/05-list-dedupe/requirements.json",
465:             "gsd-core/references/edge-probe-fixtures/06-resolved-mixed",
466:             "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/expected-coverage.json",
467:             "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/requirements.json",
468:             "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/resolutions.json",
469:             "gsd-core/references/edge-probe.md",
470:             "gsd-core/references/execute-mvp-tdd.md",
471:             "gsd-core/references/execute-phase-between-wave-reset.md",
472:             "gsd-core/references/execute-phase-context-guard.md",
473:             "gsd-core/references/execute-phase-quota-recovery.md",
474:             "gsd-core/references/execute-phase-requirement-revert.md",
475:             "gsd-core/references/execute-phase-response-language.md",
476:             "gsd-core/references/execute-phase-wave-guard.md",
477:             "gsd-core/references/executor-examples.md",
478:             "gsd-core/references/few-shot-examples",
479:             "gsd-core/references/few-shot-examples/plan-checker.md",
480:             "gsd-core/references/few-shot-examples/verifier.md",
481:             "gsd-core/references/gate-prompts.md",
482:             "gsd-core/references/gates.md",
483:             "gsd-core/references/git-integration.md",
484:             "gsd-core/references/git-planning-commit.md",
485:             "gsd-core/references/gsd-run-resolver.md",
486:             "gsd-core/references/honest-verifier.md",
487:             "gsd-core/references/ios-scaffold.md",
488:             "gsd-core/references/loop-hook-dispatch.md",
489:             "gsd-core/references/mandatory-initial-read.md",
490:             "gsd-core/references/model-profile-resolution.md",
491:             "gsd-core/references/model-profiles.md",
492:             "gsd-core/references/mvp-concepts.md",
493:             "gsd-core/references/offer-next.md",
494:             "gsd-core/references/phase-argument-parsing.md",
495:             "gsd-core/references/planner-antipatterns.md",
496:             "gsd-core/references/planner-chunked.md",
497:             "gsd-core/references/planner-gap-closure.md",
498:             "gsd-core/references/planner-graphify-auto-update.md",
499:             "gsd-core/references/planner-guidance.md",
500:             "gsd-core/references/planner-human-verify-mode.md",
501:             "gsd-core/references/planner-interface-context.md",
502:             "gsd-core/references/planner-load-graph-context.md",
503:             "gsd-core/references/planner-mvp-mode.md",
504:             "gsd-core/references/planner-preconditions.md",
505:             "gsd-core/references/planner-reversibility.md",
506:             "gsd-core/references/planner-reviews.md",
507:             "gsd-core/references/planner-revision.md",
508:             "gsd-core/references/planner-source-audit.md",
509:             "gsd-core/references/planning-config.md",
510:             "gsd-core/references/prohibition-probe-fixtures",
511:             "gsd-core/references/prohibition-probe-fixtures/01-streak-reminder",
512:             "gsd-core/references/prohibition-probe-fixtures/01-streak-reminder/expected.json",
513:             "gsd-core/references/prohibition-probe-fixtures/02-clean-utility",
514:             "gsd-core/references/prohibition-probe-fixtures/02-clean-utility/expected.json",
515:             "gsd-core/references/prohibition-probe-fixtures/03-multi-prohibition",
516:             "gsd-core/references/prohibition-probe-fixtures/03-multi-prohibition/expected.json",
517:             "gsd-core/references/prohibition-probe.md",
518:             "gsd-core/references/project-skills-discovery.md",
519:             "gsd-core/references/questioning.md",
520:             "gsd-core/references/research-documentation-lookup.md",
521:             "gsd-core/references/research-philosophy.md",
522:             "gsd-core/references/research-verification-protocol.md",
523:             "gsd-core/references/reviewer-instances.md",
524:             "gsd-core/references/revision-loop.md",
525:             "gsd-core/references/runtime-aware-dispatch.md",
526:             "gsd-core/references/scout-codebase.md",
527:             "gsd-core/references/security-asvs-levels.md",
528:             "gsd-core/references/skeleton-template.md",
529:             "gsd-core/references/sketch-interactivity.md",
530:             "gsd-core/references/sketch-theme-system.md",
531:             "gsd-core/references/sketch-tooling.md",
532:             "gsd-core/references/sketch-variant-patterns.md",
533:             "gsd-core/references/specless-probe-fallback.md",
534:             "gsd-core/references/spidr-splitting.md",
535:             "gsd-core/references/tdd.md",
536:             "gsd-core/references/thinking-models-debug.md",
537:             "gsd-core/references/thinking-models-execution.md",
538:             "gsd-core/references/thinking-models-planning.md",
539:             "gsd-core/references/thinking-models-research.md",
540:             "gsd-core/references/thinking-models-verification.md",
541:             "gsd-core/references/thinking-partner.md",
542:             "gsd-core/references/ui-brand.md",
543:             "gsd-core/references/ui-consideration-probe.md",
544:             "gsd-core/references/universal-anti-patterns.md",
545:             "gsd-core/references/untrusted-input-boundary.md",
546:             "gsd-core/references/user-profiling.md",
547:             "gsd-core/references/user-story-template.md",
548:             "gsd-core/references/verification-overrides.md",
549:             "gsd-core/references/verification-patterns.md",
550:             "gsd-core/references/verify-mvp-mode.md",
551:             "gsd-core/references/workstream-flag.md",
552:             "gsd-core/references/worktree-branch-check.md",
553:             "gsd-core/references/worktree-path-safety.md",
554:             "gsd-core/templates",
555:             "gsd-core/templates/AI-SPEC.md",
556:             "gsd-core/templates/DEBUG.md",
557:             "gsd-core/templates/README.md",
558:             "gsd-core/templates/SECURITY.md",
559:             "gsd-core/templates/UAT.md",
560:             "gsd-core/templates/UI-SPEC.md",
561:             "gsd-core/templates/VALIDATION.md",
562:             "gsd-core/templates/claude-md.md",
563:             "gsd-core/templates/codebase",
564:             "gsd-core/templates/codebase/architecture.md",
565:             "gsd-core/templates/codebase/concerns.md",
566:             "gsd-core/templates/codebase/conventions.md",
567:             "gsd-core/templates/codebase/integrations.md",
568:             "gsd-core/templates/codebase/stack.md",
569:             "gsd-core/templates/codebase/structure.md",
570:             "gsd-core/templates/codebase/testing.md",
571:             "gsd-core/templates/config.json",
572:             "gsd-core/templates/context.md",
573:             "gsd-core/templates/continue-here.md",
574:             "gsd-core/templates/copilot-instructions.md",
575:             "gsd-core/templates/debug-subagent-prompt.md",
576:             "gsd-core/templates/dev-preferences.md",
577:             "gsd-core/templates/discovery.md",
578:             "gsd-core/templates/discussion-log.md",
579:             "gsd-core/templates/milestone-archive.md",
580:             "gsd-core/templates/milestone.md",
581:             "gsd-core/templates/phase-prompt.md",
582:             "gsd-core/templates/planner-subagent-prompt.md",
583:             "gsd-core/templates/project.md",
584:             "gsd-core/templates/requirements.md",
585:             "gsd-core/templates/research-project",
586:             "gsd-core/templates/research-project/ARCHITECTURE.md",
587:             "gsd-core/templates/research-project/FEATURES.md",
588:             "gsd-core/templates/research-project/PITFALLS.md",
589:             "gsd-core/templates/research-project/STACK.md",
590:             "gsd-core/templates/research-project/SUMMARY.md",
591:             "gsd-core/templates/research.md",
592:             "gsd-core/templates/retrospective.md",
593:             "gsd-core/templates/roadmap.md",
594:             "gsd-core/templates/spec.md",
595:             "gsd-core/templates/state.md",
596:             "gsd-core/templates/summary-complex.md",
597:             "gsd-core/templates/summary-minimal.md",
598:             "gsd-core/templates/summary-standard.md",
599:             "gsd-core/templates/summary.md",
600:             "gsd-core/templates/user-profile.md",
601:             "gsd-core/templates/user-setup.md",
602:             "gsd-core/templates/verification-report.md",
603:             "gsd-core/workflows",
604:             "gsd-core/workflows/_runtime-launcher.snippet.sh",
605:             "gsd-core/workflows/add-backlog.md",
606:             "gsd-core/workflows/add-phase.md",
607:             "gsd-core/workflows/add-tests.md",
608:             "gsd-core/workflows/add-todo.md",
609:             "gsd-core/workflows/ai-integration-phase.md",
610:             "gsd-core/workflows/analyze-dependencies.md",
611:             "gsd-core/workflows/audit-fix.md",
612:             "gsd-core/workflows/audit-milestone.md",
613:             "gsd-core/workflows/audit-uat.md",
614:             "gsd-core/workflows/autonomous.md",
615:             "gsd-core/workflows/check-todos.md",
616:             "gsd-core/workflows/cleanup.md",
617:             "gsd-core/workflows/code-review-fix.md",
618:             "gsd-core/workflows/code-review.md",
619:             "gsd-core/workflows/complete-milestone.md",
620:             "gsd-core/workflows/debug.md",
621:             "gsd-core/workflows/diagnose-issues.md",
622:             "gsd-core/workflows/discovery-phase.md",
623:             "gsd-core/workflows/discuss-phase",
624:             "gsd-core/workflows/discuss-phase-assumptions.md",
625:             "gsd-core/workflows/discuss-phase-power.md",
626:             "gsd-core/workflows/discuss-phase.md",
627:             "gsd-core/workflows/discuss-phase/modes",
628:             "gsd-core/workflows/discuss-phase/modes/advisor.md",
629:             "gsd-core/workflows/discuss-phase/modes/all.md",
630:             "gsd-core/workflows/discuss-phase/modes/analyze.md",
631:             "gsd-core/workflows/discuss-phase/modes/auto.md",
632:             "gsd-core/workflows/discuss-phase/modes/batch.md",
633:             "gsd-core/workflows/discuss-phase/modes/chain.md",
634:             "gsd-core/workflows/discuss-phase/modes/default.md",
635:             "gsd-core/workflows/discuss-phase/modes/power.md",
636:             "gsd-core/workflows/discuss-phase/modes/text.md",
637:             "gsd-core/workflows/discuss-phase/templates",
638:             "gsd-core/workflows/discuss-phase/templates/checkpoint.json",
639:             "gsd-core/workflows/discuss-phase/templates/context.md",
640:             "gsd-core/workflows/discuss-phase/templates/discussion-log.md",
641:             "gsd-core/workflows/do.md",
642:             "gsd-core/workflows/docs-update.md",
643:             "gsd-core/workflows/edit-phase.md",
644:             "gsd-core/workflows/eval-review.md",
645:             "gsd-core/workflows/execute-phase",
646:             "gsd-core/workflows/execute-phase.md",
647:             "gsd-core/workflows/execute-phase/steps",
648:             "gsd-core/workflows/execute-phase/steps/codebase-drift-gate.md",
649:             "gsd-core/workflows/execute-phase/steps/executor-isolation-dispatch.md",
650:             "gsd-core/workflows/execute-phase/steps/per-plan-worktree-gate.md",
651:             "gsd-core/workflows/execute-phase/steps/post-merge-gate.md",
652:             "gsd-core/workflows/execute-phase/steps/regression-gate.md",
653:             "gsd-core/workflows/execute-phase/steps/worktree-recovery-policy.md",
654:             "gsd-core/workflows/execute-plan.md",
655:             "gsd-core/workflows/explore.md",
656:             "gsd-core/workflows/extract-learnings.md",
657:             "gsd-core/workflows/fast.md",
658:             "gsd-core/workflows/forensics.md",
659:             "gsd-core/workflows/graduation.md",
660:             "gsd-core/workflows/health.md",
661:             "gsd-core/workflows/help",
662:             "gsd-core/workflows/help.md",
663:             "gsd-core/workflows/help/modes",
664:             "gsd-core/workflows/help/modes/brief.md",
665:             "gsd-core/workflows/help/modes/default.md",
666:             "gsd-core/workflows/help/modes/full.md",
667:             "gsd-core/workflows/help/modes/topic.md",
668:             "gsd-core/workflows/import.md",
669:             "gsd-core/workflows/inbox.md",
670:             "gsd-core/workflows/ingest-docs.md",
671:             "gsd-core/workflows/insert-phase.md",
672:             "gsd-core/workflows/list-phase-assumptions.md",
673:             "gsd-core/workflows/list-seeds.md",
674:             "gsd-core/workflows/list-workspaces.md",
675:             "gsd-core/workflows/manager.md",
676:             "gsd-core/workflows/map-codebase.md",
677:             "gsd-core/workflows/milestone-summary.md",
678:             "gsd-core/workflows/mvp-phase.md",
679:             "gsd-core/workflows/new-milestone.md",
680:             "gsd-core/workflows/new-project.md",
681:             "gsd-core/workflows/new-workspace.md",
682:             "gsd-core/workflows/next.md",
683:             "gsd-core/workflows/node-repair.md",
684:             "gsd-core/workflows/note.md",
685:             "gsd-core/workflows/onboard.md",
686:             "gsd-core/workflows/pause-work.md",
687:             "gsd-core/workflows/plan-milestone-gaps.md",
688:             "gsd-core/workflows/plan-phase",
689:             "gsd-core/workflows/plan-phase.md",
690:             "gsd-core/workflows/plan-phase/steps",
691:             "gsd-core/workflows/plan-phase/steps/closed-phase-gate.md",
692:             "gsd-core/workflows/plan-phase/steps/prd-express-path.md",
693:             "gsd-core/workflows/plan-phase/steps/windows-troubleshooting.md",
694:             "gsd-core/workflows/plan-review-convergence.md",
695:             "gsd-core/workflows/plant-seed.md",
696:             "gsd-core/workflows/pr-branch.md",
697:             "gsd-core/workflows/profile-user.md",
698:             "gsd-core/workflows/progress.md",
699:             "gsd-core/workflows/quick.md",
700:             "gsd-core/workflows/reapply-patches.md",
701:             "gsd-core/workflows/remove-phase.md",
702:             "gsd-core/workflows/remove-workspace.md",
703:             "gsd-core/workflows/resume-project.md",
704:             "gsd-core/workflows/review.md",
705:             "gsd-core/workflows/scan.md",
706:             "gsd-core/workflows/secure-phase.md",
707:             "gsd-core/workflows/session-report.md",
708:             "gsd-core/workflows/settings-advanced.md",
709:             "gsd-core/workflows/settings-integrations.md",
710:             "gsd-core/workflows/settings.md",
711:             "gsd-core/workflows/ship.md",
712:             "gsd-core/workflows/sketch-wrap-up.md",
713:             "gsd-core/workflows/sketch.md",
714:             "gsd-core/workflows/smart-entry.md",
715:             "gsd-core/workflows/spec-phase.md",
716:             "gsd-core/workflows/spike-wrap-up.md",
717:             "gsd-core/workflows/spike.md",
718:             "gsd-core/workflows/stats.md",
719:             "gsd-core/workflows/sync-skills.md",
720:             "gsd-core/workflows/thread.md",
721:             "gsd-core/workflows/transition.md",
722:             "gsd-core/workflows/ui-phase.md",
723:             "gsd-core/workflows/ui-review.md",
724:             "gsd-core/workflows/ultraplan-phase.md",
725:             "gsd-core/workflows/undo.md",
726:             "gsd-core/workflows/update.md",
727:             "gsd-core/workflows/validate-phase.md",
728:             "gsd-core/workflows/verify-phase.md",
729:             "gsd-core/workflows/verify-work.md",
730:             "gsd-migration-journal",
731:             "hooks",
732:             "hooks/gsd-check-update-worker.js",
733:             "hooks/gsd-check-update.js",
734:             "hooks/gsd-config-reload.js",
735:             "hooks/gsd-context-monitor.js",
736:             "hooks/gsd-cursor-post-tool.js",
737:             "hooks/gsd-cursor-pre-tool.js",
738:             "hooks/gsd-cursor-session-start.js",
739:             "hooks/gsd-cursor-stop.js",
740:             "hooks/gsd-cursor-subagent-start.js",
741:             "hooks/gsd-cursor-subagent-stop.js",
742:             "hooks/gsd-ensure-canonical-path.js",
743:             "hooks/gsd-graphify-update.sh",
744:             "hooks/gsd-phase-boundary.sh",
745:             "hooks/gsd-prompt-guard.js",
746:             "hooks/gsd-read-guard.js",
747:             "hooks/gsd-read-injection-scanner.js",
748:             "hooks/gsd-session-state.sh",
749:             "hooks/gsd-statusline.js",
750:             "hooks/gsd-update-banner.js",
751:             "hooks/gsd-validate-commit.sh",
752:             "hooks/gsd-windsurf-pre-command.js",
753:             "hooks/gsd-windsurf-pre-write.js",
754:             "hooks/gsd-workflow-guard.js",
755:             "hooks/gsd-worktree-path-guard.js",
756:             "hooks/lib",
757:             "hooks/lib/cursor-workspace.js",
758:             "hooks/lib/git-cmd.js",
759:             "hooks/lib/gsd-graphify-rebuild.sh",
760:             "hooks/managed-hooks-registry.cjs",
761:             "package.json",
762:             "scripts",
763:             "scripts/changeset",
764:             "scripts/changeset/README.md",
765:             "scripts/changeset/cli.cjs",
766:             "scripts/changeset/github-release-notes.cjs",
767:             "scripts/changeset/lint.cjs",
768:             "scripts/changeset/new.cjs",
769:             "scripts/changeset/parse.cjs",
770:             "scripts/changeset/render.cjs",
771:             "scripts/changeset/serialize.cjs",
772:             "scripts/fix-slash-commands.cjs",
773:             "scripts/gen-capability-registry.cjs",
774:             "scripts/gen-loop-host-contract.cjs",
775:             "scripts/lib",
776:             "scripts/lib/allowlist-ratchet.cjs",
777:             "scripts/lib/cli-exit.cjs",
778:             "skills",
779:             "skills/gsd-add-tests",
780:             "skills/gsd-add-tests/SKILL.md",
781:             "skills/gsd-ai-integration-phase",
782:             "skills/gsd-ai-integration-phase/SKILL.md",
783:             "skills/gsd-audit-fix",
784:             "skills/gsd-audit-fix/SKILL.md",
785:             "skills/gsd-audit-milestone",
786:             "skills/gsd-audit-milestone/SKILL.md",
787:             "skills/gsd-audit-uat",
788:             "skills/gsd-audit-uat/SKILL.md",
789:             "skills/gsd-autonomous",
790:             "skills/gsd-autonomous/SKILL.md",
791:             "skills/gsd-capture",
792:             "skills/gsd-capture/SKILL.md",
793:             "skills/gsd-cleanup",
794:             "skills/gsd-cleanup/SKILL.md",
795:             "skills/gsd-code-review",
796:             "skills/gsd-code-review/SKILL.md",
797:             "skills/gsd-complete-milestone",
798:             "skills/gsd-complete-milestone/SKILL.md",
799:             "skills/gsd-config",
800:             "skills/gsd-config/SKILL.md",
801:             "skills/gsd-debug",
802:             "skills/gsd-debug/SKILL.md",
803:             "skills/gsd-discuss-phase",
804:             "skills/gsd-discuss-phase/SKILL.md",
805:             "skills/gsd-docs-update",
806:             "skills/gsd-docs-update/SKILL.md",
807:             "skills/gsd-eval-review",
808:             "skills/gsd-eval-review/SKILL.md",
809:             "skills/gsd-execute-phase",
810:             "skills/gsd-execute-phase/SKILL.md",
811:             "skills/gsd-explore",
812:             "skills/gsd-explore/SKILL.md",
813:             "skills/gsd-extract-learnings",
814:             "skills/gsd-extract-learnings/SKILL.md",
815:             "skills/gsd-fast",
816:             "skills/gsd-fast/SKILL.md",
817:             "skills/gsd-forensics",
818:             "skills/gsd-forensics/SKILL.md",
819:             "skills/gsd-graphify",
820:             "skills/gsd-graphify/SKILL.md",
821:             "skills/gsd-health",
822:             "skills/gsd-health/SKILL.md",
823:             "skills/gsd-help",
824:             "skills/gsd-help/SKILL.md",
825:             "skills/gsd-import",
826:             "skills/gsd-import/SKILL.md",
827:             "skills/gsd-inbox",
828:             "skills/gsd-inbox/SKILL.md",
829:             "skills/gsd-ingest-docs",
830:             "skills/gsd-ingest-docs/SKILL.md",
831:             "skills/gsd-manager",
832:             "skills/gsd-manager/SKILL.md",
833:             "skills/gsd-map-codebase",
834:             "skills/gsd-map-codebase/SKILL.md",
835:             "skills/gsd-mempalace-capture",
836:             "skills/gsd-mempalace-capture/SKILL.md",
837:             "skills/gsd-mempalace-recall",
838:             "skills/gsd-mempalace-recall/SKILL.md",
839:             "skills/gsd-milestone-summary",
840:             "skills/gsd-milestone-summary/SKILL.md",
841:             "skills/gsd-mvp-phase",
842:             "skills/gsd-mvp-phase/SKILL.md",
843:             "skills/gsd-new-milestone",
844:             "skills/gsd-new-milestone/SKILL.md",
845:             "skills/gsd-new-project",
846:             "skills/gsd-new-project/SKILL.md",
847:             "skills/gsd-next",
848:             "skills/gsd-next/SKILL.md",
849:             "skills/gsd-ns-context",
850:             "skills/gsd-ns-context/SKILL.md",
851:             "skills/gsd-ns-ideate",
852:             "skills/gsd-ns-ideate/SKILL.md",
853:             "skills/gsd-ns-manage",
854:             "skills/gsd-ns-manage/SKILL.md",
855:             "skills/gsd-ns-project",
856:             "skills/gsd-ns-project/SKILL.md",
857:             "skills/gsd-ns-review",
858:             "skills/gsd-ns-review/SKILL.md",
859:             "skills/gsd-ns-workflow",
860:             "skills/gsd-ns-workflow/SKILL.md",
861:             "skills/gsd-onboard",
862:             "skills/gsd-onboard/SKILL.md",
863:             "skills/gsd-pause-work",
864:             "skills/gsd-pause-work/SKILL.md",
865:             "skills/gsd-phase",
866:             "skills/gsd-phase/SKILL.md",
867:             "skills/gsd-plan-phase",
868:             "skills/gsd-plan-phase/SKILL.md",
869:             "skills/gsd-plan-review-convergence",
870:             "skills/gsd-plan-review-convergence/SKILL.md",
871:             "skills/gsd-pr-branch",
872:             "skills/gsd-pr-branch/SKILL.md",
873:             "skills/gsd-profile-user",
874:             "skills/gsd-profile-user/SKILL.md",
875:             "skills/gsd-progress",
876:             "skills/gsd-progress/SKILL.md",
877:             "skills/gsd-quick",
878:             "skills/gsd-quick/SKILL.md",
879:             "skills/gsd-resume-work",
880:             "skills/gsd-resume-work/SKILL.md",
881:             "skills/gsd-review",
882:             "skills/gsd-review-backlog",
883:             "skills/gsd-review-backlog/SKILL.md",
884:             "skills/gsd-review/SKILL.md",
885:             "skills/gsd-secure-phase",
886:             "skills/gsd-secure-phase/SKILL.md",
887:             "skills/gsd-settings",
888:             "skills/gsd-settings/SKILL.md",
889:             "skills/gsd-ship",
890:             "skills/gsd-ship/SKILL.md",
891:             "skills/gsd-sketch",
892:             "skills/gsd-sketch/SKILL.md",
893:             "skills/gsd-spec-phase",
894:             "skills/gsd-spec-phase/SKILL.md",
895:             "skills/gsd-spike",
896:             "skills/gsd-spike/SKILL.md",
897:             "skills/gsd-stats",
898:             "skills/gsd-stats/SKILL.md",
899:             "skills/gsd-surface",
900:             "skills/gsd-surface/SKILL.md",
901:             "skills/gsd-thread",
902:             "skills/gsd-thread/SKILL.md",
903:             "skills/gsd-ui-phase",
904:             "skills/gsd-ui-phase/SKILL.md",
905:             "skills/gsd-ui-review",
906:             "skills/gsd-ui-review/SKILL.md",
907:             "skills/gsd-ultraplan-phase",
908:             "skills/gsd-ultraplan-phase/SKILL.md",
909:             "skills/gsd-undo",
910:             "skills/gsd-undo/SKILL.md",
911:             "skills/gsd-update",
912:             "skills/gsd-update/SKILL.md",
913:             "skills/gsd-upstream",
914:             "skills/gsd-upstream/SKILL.md",
915:             "skills/gsd-validate-phase",
916:             "skills/gsd-validate-phase/SKILL.md",
917:             "skills/gsd-verify-work",
918:             "skills/gsd-verify-work/SKILL.md",
919:             "skills/gsd-workspace",
920:             "skills/gsd-workspace/SKILL.md",
921:             "skills/gsd-workstreams",
922:             "skills/gsd-workstreams/SKILL.md"
923:           ],
924:           "unexpected": [],
925:           "changed": []
926:         }
927:       },
928:       "detail": "new/ against twin: missing 742 (.gsd-source, agents, agents/general-purpose.md, agents/gsd-advisor-researcher.md, agents/gsd-ai-researcher.md, agents/gsd-assumptions-analyzer.md); unexpected 0; changed 0"
929:     },
930:     {
931:       "scenario": "fresh",
932:       "kind": "acceptance",
933:       "id": "displaced-equals-twin-changes",
934:       "ok": true,
935:       "evidence": {
936:         "kind": "assertion-pass",
937:         "actual": {}
938:       }
939:     },
940:     {
941:       "scenario": "fresh",
942:       "kind": "acceptance",
943:       "id": "moved-txt-lists-every-file",
944:       "ok": false,
945:       "evidence": {
946:         "kind": "moved-list",
947:         "actual": {
948:           "expected": [
949:             ".gsd-source",
950:             "agents/general-purpose.md",
951:             "agents/gsd-advisor-researcher.md",
952:             "agents/gsd-ai-researcher.md",
953:             "agents/gsd-assumptions-analyzer.md",
954:             "agents/gsd-code-fixer.md",
955:             "agents/gsd-code-reviewer.md",
956:             "agents/gsd-codebase-mapper.md",
957:             "agents/gsd-debug-session-manager.md",
958:             "agents/gsd-debugger.md",
959:             "agents/gsd-doc-classifier.md",
960:             "agents/gsd-doc-synthesizer.md",
961:             "agents/gsd-doc-verifier.md",
962:             "agents/gsd-doc-writer.md",
963:             "agents/gsd-domain-researcher.md",
964:             "agents/gsd-eval-auditor.md",
965:             "agents/gsd-eval-planner.md",
966:             "agents/gsd-executor.md",
967:             "agents/gsd-framework-selector.md",
968:             "agents/gsd-integration-checker.md",
969:             "agents/gsd-intel-updater.md",
970:             "agents/gsd-mempalace-curator.md",
971:             "agents/gsd-nyquist-auditor.md",
972:             "agents/gsd-oversight-execution.md",
973:             "agents/gsd-oversight-planning.md",
974:             "agents/gsd-oversight-sync.md",
975:             "agents/gsd-oversight-verification.md",
976:             "agents/gsd-pattern-mapper.md",
977:             "agents/gsd-phase-researcher.md",
978:             "agents/gsd-plan-checker.md",
979:             "agents/gsd-planner.md",
980:             "agents/gsd-project-researcher.md",
981:             "agents/gsd-research-synthesizer.md",
982:             "agents/gsd-roadmapper.md",
983:             "agents/gsd-security-auditor.md",
984:             "agents/gsd-ui-auditor.md",
985:             "agents/gsd-ui-checker.md",
986:             "agents/gsd-ui-researcher.md",
987:             "agents/gsd-user-profiler.md",
988:             "agents/gsd-verifier.md",
989:             "gsd-core/.gsd-runtime",
990:             "gsd-core/VERSION",
991:             "gsd-core/bin/check-latest-version.cjs",
992:             "gsd-core/bin/ensure-runtime-build.cjs",
993:             "gsd-core/bin/gsd-tools.cjs",
994:             "gsd-core/bin/gsd_run",
995:             "gsd-core/bin/lib/active-workstream-store.cjs",
996:             "gsd-core/bin/lib/adapter-declarative.cjs",
997:             "gsd-core/bin/lib/adapter-imperative.cjs",
998:             "gsd-core/bin/lib/adr-parser.cjs",
999:             "gsd-core/bin/lib/agent-command-router.cjs",
1000:             "gsd-core/bin/lib/agent-install-check.cjs",
1001:             "gsd-core/bin/lib/api-coverage.cjs",
1002:             "gsd-core/bin/lib/artifacts.cjs",
1003:             "gsd-core/bin/lib/assumption-delta.cjs",
1004:             "gsd-core/bin/lib/audit-command-router.cjs",
1005:             "gsd-core/bin/lib/audit.cjs",
1006:             "gsd-core/bin/lib/broken-windows.cjs",
1007:             "gsd-core/bin/lib/capability-activation.cjs",
1008:             "gsd-core/bin/lib/capability-command-router.cjs",
1009:             "gsd-core/bin/lib/capability-consent.cjs",
1010:             "gsd-core/bin/lib/capability-ledger.cjs",
1011:             "gsd-core/bin/lib/capability-lifecycle.cjs",
1012:             "gsd-core/bin/lib/capability-loader.cjs",
1013:             "gsd-core/bin/lib/capability-lock.cjs",
1014:             "gsd-core/bin/lib/capability-registry.cjs",
1015:             "gsd-core/bin/lib/capability-source.cjs",
1016:             "gsd-core/bin/lib/capability-state.cjs",
1017:             "gsd-core/bin/lib/capability-trust.cjs",
1018:             "gsd-core/bin/lib/capability-validator.cjs",
1019:             "gsd-core/bin/lib/capability-writer.cjs",
1020:             "gsd-core/bin/lib/check-command-router.cjs",
1021:             "gsd-core/bin/lib/cjs-command-router-adapter.cjs",
1022:             "gsd-core/bin/lib/claude-orchestration-command-router.cjs",
1023:             "gsd-core/bin/lib/claude-orchestration.cjs",
1024:             "gsd-core/bin/lib/cli-exit.cjs",
1025:             "gsd-core/bin/lib/cli-skew-check.cjs",
1026:             "gsd-core/bin/lib/clock.cjs",
1027:             "gsd-core/bin/lib/clusters.cjs",
1028:             "gsd-core/bin/lib/code-review-flags.cjs",
1029:             "gsd-core/bin/lib/command-aliases.cjs",
1030:             "gsd-core/bin/lib/command-arg-projection.cjs",
1031:             "gsd-core/bin/lib/command-roster.cjs",
1032:             "gsd-core/bin/lib/command-routing-hub.cjs",
1033:             "gsd-core/bin/lib/commands.cjs",
1034:             "gsd-core/bin/lib/config-loader.cjs",
1035:             "gsd-core/bin/lib/config-schema.cjs",
1036:             "gsd-core/bin/lib/config-types.cjs",
1037:             "gsd-core/bin/lib/config.cjs",
1038:             "gsd-core/bin/lib/configuration.cjs",
1039:             "gsd-core/bin/lib/context-utilization.cjs",
1040:             "gsd-core/bin/lib/core-utils.cjs",
1041:             "gsd-core/bin/lib/coverage.cjs",
1042:             "gsd-core/bin/lib/decisions.cjs",
1043:             "gsd-core/bin/lib/docs.cjs",
1044:             "gsd-core/bin/lib/drift.cjs",
1045:             "gsd-core/bin/lib/edge-probe.cjs",
1046:             "gsd-core/bin/lib/embedding-adapter.cjs",
1047:             "gsd-core/bin/lib/estimate-cli.cjs",
1048:             "gsd-core/bin/lib/eval-command-router.cjs",
1049:             "gsd-core/bin/lib/eval.cjs",
1050:             "gsd-core/bin/lib/external-descriptor-trust.cjs",
1051:             "gsd-core/bin/lib/external-job.cjs",
1052:             "gsd-core/bin/lib/fallow-runner.cjs",
1053:             "gsd-core/bin/lib/federated-config.cjs",
1054:             "gsd-core/bin/lib/fork-roadmap-persistence.cjs",
1055:             "gsd-core/bin/lib/frontmatter.cjs",
1056:             "gsd-core/bin/lib/gap-checker.cjs",
1057:             "gsd-core/bin/lib/gate-predicate-evaluator.cjs",
1058:             "gsd-core/bin/lib/git-base-branch.cjs",
1059:             "gsd-core/bin/lib/graphify-command-router.cjs",
1060:             "gsd-core/bin/lib/graphify.cjs",
1061:             "gsd-core/bin/lib/gsd2-import.cjs",
1062:             "gsd-core/bin/lib/handshake-serialized.cjs",
1063:             "gsd-core/bin/lib/hook-bus.cjs",
1064:             "gsd-core/bin/lib/host-integration-adapters/cline-sdk-binding.cjs",
1065:             "gsd-core/bin/lib/host-integration-adapters/imperative-hook-bus.cjs",
1066:             "gsd-core/bin/lib/host-integration-sdk.cjs",
1067:             "gsd-core/bin/lib/host-integration.cjs",
1068:             "gsd-core/bin/lib/init-command-router.cjs",
1069:             "gsd-core/bin/lib/init.cjs",
1070:             "gsd-core/bin/lib/install-effort-resolver.cjs",
1071:             "gsd-core/bin/lib/install-engine.cjs",
1072:             "gsd-core/bin/lib/install-profiles.cjs",
1073:             "gsd-core/bin/lib/installer-migration-authoring.cjs",
1074:             "gsd-core/bin/lib/installer-migration-report.cjs",
1075:             "gsd-core/bin/lib/installer-migrations.cjs",
1076:             "gsd-core/bin/lib/installer-migrations/000-first-time-baseline.cjs",
1077:             "gsd-core/bin/lib/installer-migrations/001-legacy-orphan-files.cjs",
1078:             "gsd-core/bin/lib/installer-migrations/002-codex-legacy-hooks-json.cjs",
1079:             "gsd-core/bin/lib/installer-migrations/003-rename-get-shit-done-to-gsd-core.cjs",
1080:             "gsd-core/bin/lib/installer-migrations/004-prune-stale-pristine-snapshots.cjs",
1081:             "gsd-core/bin/lib/installer-migrations/005-opencode-baseline-commands-dir.cjs",
1082:             "gsd-core/bin/lib/installer-migrations/006-pi-extension-cjs-to-js.cjs",
1083:             "gsd-core/bin/lib/intel-command-router.cjs",
1084:             "gsd-core/bin/lib/intel.cjs",
1085:             "gsd-core/bin/lib/io.cjs",
1086:             "gsd-core/bin/lib/learnings.cjs",
1087:             "gsd-core/bin/lib/legacy-cleanup.cjs",
1088:             "gsd-core/bin/lib/loop-host-contract.cjs",
1089:             "gsd-core/bin/lib/loop-resolver.cjs",
1090:             "gsd-core/bin/lib/markdown-sectionizer.cjs",
1091:             "gsd-core/bin/lib/markdown-table.cjs",
1092:             "gsd-core/bin/lib/mcp-server.cjs",
1093:             "gsd-core/bin/lib/milestone.cjs",
1094:             "gsd-core/bin/lib/model-adapter.cjs",
1095:             "gsd-core/bin/lib/model-catalog.cjs",
1096:             "gsd-core/bin/lib/model-profiles.cjs",
1097:             "gsd-core/bin/lib/model-resolver.cjs",
1098:             "gsd-core/bin/lib/normalize-test-command.cjs",
1099:             "gsd-core/bin/lib/observability/event.cjs",
1100:             "gsd-core/bin/lib/observability/logger.cjs",
1101:             "gsd-core/bin/lib/observability/redaction.cjs",
1102:             "gsd-core/bin/lib/onboard-projection.cjs",
1103:             "gsd-core/bin/lib/package-identity.cjs",
1104:             "gsd-core/bin/lib/package-legitimacy.cjs",
1105:             "gsd-core/bin/lib/phase-command-router.cjs",
1106:             "gsd-core/bin/lib/phase-estimation.cjs",
1107:             "gsd-core/bin/lib/phase-id.cjs",
1108:             "gsd-core/bin/lib/phase-lifecycle.cjs",
1109:             "gsd-core/bin/lib/phase-locator.cjs",
1110:             "gsd-core/bin/lib/phase.cjs",
1111:             "gsd-core/bin/lib/phases-command-router.cjs",
1112:             "gsd-core/bin/lib/plan-drift-guard.cjs",
1113:             "gsd-core/bin/lib/plan-scan.cjs",
1114:             "gsd-core/bin/lib/planning-workspace.cjs",
1115:             "gsd-core/bin/lib/probe-core.cjs",
1116:             "gsd-core/bin/lib/profile-output.cjs",
1117:             "gsd-core/bin/lib/profile-pipeline-command-router.cjs",
1118:             "gsd-core/bin/lib/profile-pipeline.cjs",
1119:             "gsd-core/bin/lib/prohibition-enforcement.cjs",
1120:             "gsd-core/bin/lib/project-root.cjs",
1121:             "gsd-core/bin/lib/prompt-budget.cjs",
1122:             "gsd-core/bin/lib/research-provider.cjs",
1123:             "gsd-core/bin/lib/research-store.cjs",
1124:             "gsd-core/bin/lib/resolution.cjs",
1125:             "gsd-core/bin/lib/review-lane-descriptor.cjs",
1126:             "gsd-core/bin/lib/review-lane-invocation.cjs",
1127:             "gsd-core/bin/lib/review-lane-runner.cjs",
1128:             "gsd-core/bin/lib/review-reviewer-selection.cjs",
1129:             "gsd-core/bin/lib/roadmap-command-router.cjs",
1130:             "gsd-core/bin/lib/roadmap-parser.cjs",
1131:             "gsd-core/bin/lib/roadmap-upgrade.cjs",
1132:             "gsd-core/bin/lib/roadmap.cjs",
1133:             "gsd-core/bin/lib/runtime-artifact-conversion.cjs",
1134:             "gsd-core/bin/lib/runtime-artifact-install-plan.cjs",
1135:             "gsd-core/bin/lib/runtime-artifact-layout.cjs",
1136:             "gsd-core/bin/lib/runtime-config-adapter-registry.cjs",
1137:             "gsd-core/bin/lib/runtime-homes.cjs",
1138:             "gsd-core/bin/lib/runtime-hooks-surface.cjs",
1139:             "gsd-core/bin/lib/runtime-name-policy.cjs",
1140:             "gsd-core/bin/lib/runtime-slash.cjs",
1141:             "gsd-core/bin/lib/schema-detect.cjs",
1142:             "gsd-core/bin/lib/secrets.cjs",
1143:             "gsd-core/bin/lib/security.cjs",
1144:             "gsd-core/bin/lib/semver-compare.cjs",
1145:             "gsd-core/bin/lib/shell-command-projection.cjs",
1146:             "gsd-core/bin/lib/smart-entry.cjs",
1147:             "gsd-core/bin/lib/spec-section.cjs",
1148:             "gsd-core/bin/lib/stale-bake-guard.cjs",
1149:             "gsd-core/bin/lib/state-command-router.cjs",
1150:             "gsd-core/bin/lib/state-document.cjs",
1151:             "gsd-core/bin/lib/state-io.cjs",
1152:             "gsd-core/bin/lib/state-transition.cjs",
1153:             "gsd-core/bin/lib/state.cjs",
1154:             "gsd-core/bin/lib/surface.cjs",
1155:             "gsd-core/bin/lib/task-command-router.cjs",
1156:             "gsd-core/bin/lib/teams-status.cjs",
1157:             "gsd-core/bin/lib/template.cjs",
1158:             "gsd-core/bin/lib/uat-predicate.cjs",
1159:             "gsd-core/bin/lib/uat.cjs",
1160:             "gsd-core/bin/lib/ui-consideration-probe.cjs",
1161:             "gsd-core/bin/lib/ui-safety-gate.cjs",
1162:             "gsd-core/bin/lib/unusable-input.cjs",
1163:             "gsd-core/bin/lib/update-context.cjs",
1164:             "gsd-core/bin/lib/validate-command-router.cjs",
1165:             "gsd-core/bin/lib/validate.cjs",
1166:             "gsd-core/bin/lib/verification-command-router.cjs",
1167:             "gsd-core/bin/lib/verification.cjs",
1168:             "gsd-core/bin/lib/verify-command-router.cjs",
1169:             "gsd-core/bin/lib/verify.cjs",
1170:             "gsd-core/bin/lib/workstream-inventory-builder.cjs",
1171:             "gsd-core/bin/lib/workstream-inventory.cjs",
1172:             "gsd-core/bin/lib/workstream-name-policy.cjs",
1173:             "gsd-core/bin/lib/workstream.cjs",
1174:             "gsd-core/bin/lib/worktree-base-ref.cjs",
1175:             "gsd-core/bin/lib/worktree-safety.cjs",
1176:             "gsd-core/bin/lib/write-set.cjs",
1177:             "gsd-core/bin/shared/config-defaults.manifest.json",
1178:             "gsd-core/bin/shared/config-schema.manifest.json",
1179:             "gsd-core/bin/shared/model-catalog.json",
1180:             "gsd-core/bin/shared/runtime-aliases.manifest.json",
1181:             "gsd-core/bin/verify-reapply-patches.cjs",
1182:             "gsd-core/contexts/dev.md",
1183:             "gsd-core/contexts/research.md",
1184:             "gsd-core/contexts/review.md",
1185:             "gsd-core/references/agent-contracts.md",
1186:             "gsd-core/references/agent-skills-bootstrap.md",
1187:             "gsd-core/references/ai-evals.md",
1188:             "gsd-core/references/ai-frameworks.md",
1189:             "gsd-core/references/api-coverage.md",
1190:             "gsd-core/references/artifact-types.md",
1191:             "gsd-core/references/autonomous-smart-discuss.md",
1192:             "gsd-core/references/checkpoints.md",
1193:             "gsd-core/references/common-bug-patterns.md",
1194:             "gsd-core/references/context-budget.md",
1195:             "gsd-core/references/continuation-format.md",
1196:             "gsd-core/references/debugger-bug-taxonomy.md",
1197:             "gsd-core/references/debugger-fix-acceptance.md",
1198:             "gsd-core/references/debugger-philosophy.md",
1199:             "gsd-core/references/debugger-prevention.md",
1200:             "gsd-core/references/debugger-rca-branching.md",
1201:             "gsd-core/references/debugger-repro-hardening.md",
1202:             "gsd-core/references/debugger-sbfl.md",
1203:             "gsd-core/references/debugger-semantic-recall.md",
1204:             "gsd-core/references/decimal-phase-calculation.md",
1205:             "gsd-core/references/doc-conflict-engine.md",
1206:             "gsd-core/references/domain-probes.md",
1207:             "gsd-core/references/edge-probe-fixtures/01-round-half-even/expected-coverage.json",
1208:             "gsd-core/references/edge-probe-fixtures/01-round-half-even/requirements.json",
1209:             "gsd-core/references/edge-probe-fixtures/02-merge-intervals/expected-coverage.json",
1210:             "gsd-core/references/edge-probe-fixtures/02-merge-intervals/requirements.json",
1211:             "gsd-core/references/edge-probe-fixtures/03-truncate-graphemes/expected-coverage.json",
1212:             "gsd-core/references/edge-probe-fixtures/03-truncate-graphemes/requirements.json",
1213:             "gsd-core/references/edge-probe-fixtures/04-money-rounding/expected-coverage.json",
1214:             "gsd-core/references/edge-probe-fixtures/04-money-rounding/requirements.json",
1215:             "gsd-core/references/edge-probe-fixtures/05-list-dedupe/expected-coverage.json",
1216:             "gsd-core/references/edge-probe-fixtures/05-list-dedupe/requirements.json",
1217:             "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/expected-coverage.json",
1218:             "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/requirements.json",
1219:             "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/resolutions.json",
1220:             "gsd-core/references/edge-probe.md",
1221:             "gsd-core/references/execute-mvp-tdd.md",
1222:             "gsd-core/references/execute-phase-between-wave-reset.md",
1223:             "gsd-core/references/execute-phase-context-guard.md",
1224:             "gsd-core/references/execute-phase-quota-recovery.md",
1225:             "gsd-core/references/execute-phase-requirement-revert.md",
1226:             "gsd-core/references/execute-phase-response-language.md",
1227:             "gsd-core/references/execute-phase-wave-guard.md",
1228:             "gsd-core/references/executor-examples.md",
1229:             "gsd-core/references/few-shot-examples/plan-checker.md",
1230:             "gsd-core/references/few-shot-examples/verifier.md",
1231:             "gsd-core/references/gate-prompts.md",
1232:             "gsd-core/references/gates.md",
1233:             "gsd-core/references/git-integration.md",
1234:             "gsd-core/references/git-planning-commit.md",
1235:             "gsd-core/references/gsd-run-resolver.md",
1236:             "gsd-core/references/honest-verifier.md",
1237:             "gsd-core/references/ios-scaffold.md",
1238:             "gsd-core/references/loop-hook-dispatch.md",
1239:             "gsd-core/references/mandatory-initial-read.md",
1240:             "gsd-core/references/model-profile-resolution.md",
1241:             "gsd-core/references/model-profiles.md",
1242:             "gsd-core/references/mvp-concepts.md",
1243:             "gsd-core/references/offer-next.md",
1244:             "gsd-core/references/phase-argument-parsing.md",
1245:             "gsd-core/references/planner-antipatterns.md",
1246:             "gsd-core/references/planner-chunked.md",
1247:             "gsd-core/references/planner-gap-closure.md",
1248:             "gsd-core/references/planner-graphify-auto-update.md",
1249:             "gsd-core/references/planner-guidance.md",
1250:             "gsd-core/references/planner-human-verify-mode.md",
1251:             "gsd-core/references/planner-interface-context.md",
1252:             "gsd-core/references/planner-load-graph-context.md",
1253:             "gsd-core/references/planner-mvp-mode.md",
1254:             "gsd-core/references/planner-preconditions.md",
1255:             "gsd-core/references/planner-reversibility.md",
1256:             "gsd-core/references/planner-reviews.md",
1257:             "gsd-core/references/planner-revision.md",
1258:             "gsd-core/references/planner-source-audit.md",
1259:             "gsd-core/references/planning-config.md",
1260:             "gsd-core/references/prohibition-probe-fixtures/01-streak-reminder/expected.json",
1261:             "gsd-core/references/prohibition-probe-fixtures/02-clean-utility/expected.json",
1262:             "gsd-core/references/prohibition-probe-fixtures/03-multi-prohibition/expected.json",
1263:             "gsd-core/references/prohibition-probe.md",
1264:             "gsd-core/references/project-skills-discovery.md",
1265:             "gsd-core/references/questioning.md",
1266:             "gsd-core/references/research-documentation-lookup.md",
1267:             "gsd-core/references/research-philosophy.md",
1268:             "gsd-core/references/research-verification-protocol.md",
1269:             "gsd-core/references/reviewer-instances.md",
1270:             "gsd-core/references/revision-loop.md",
1271:             "gsd-core/references/runtime-aware-dispatch.md",
1272:             "gsd-core/references/scout-codebase.md",
1273:             "gsd-core/references/security-asvs-levels.md",
1274:             "gsd-core/references/skeleton-template.md",
1275:             "gsd-core/references/sketch-interactivity.md",
1276:             "gsd-core/references/sketch-theme-system.md",
1277:             "gsd-core/references/sketch-tooling.md",
1278:             "gsd-core/references/sketch-variant-patterns.md",
1279:             "gsd-core/references/specless-probe-fallback.md",
1280:             "gsd-core/references/spidr-splitting.md",
1281:             "gsd-core/references/tdd.md",
1282:             "gsd-core/references/thinking-models-debug.md",
1283:             "gsd-core/references/thinking-models-execution.md",
1284:             "gsd-core/references/thinking-models-planning.md",
1285:             "gsd-core/references/thinking-models-research.md",
1286:             "gsd-core/references/thinking-models-verification.md",
1287:             "gsd-core/references/thinking-partner.md",
1288:             "gsd-core/references/ui-brand.md",
1289:             "gsd-core/references/ui-consideration-probe.md",
1290:             "gsd-core/references/universal-anti-patterns.md",
1291:             "gsd-core/references/untrusted-input-boundary.md",
1292:             "gsd-core/references/user-profiling.md",
1293:             "gsd-core/references/user-story-template.md",
1294:             "gsd-core/references/verification-overrides.md",
1295:             "gsd-core/references/verification-patterns.md",
1296:             "gsd-core/references/verify-mvp-mode.md",
1297:             "gsd-core/references/workstream-flag.md",
1298:             "gsd-core/references/worktree-branch-check.md",
1299:             "gsd-core/references/worktree-path-safety.md",
1300:             "gsd-core/templates/AI-SPEC.md",
1301:             "gsd-core/templates/DEBUG.md",
1302:             "gsd-core/templates/README.md",
1303:             "gsd-core/templates/SECURITY.md",
1304:             "gsd-core/templates/UAT.md",
1305:             "gsd-core/templates/UI-SPEC.md",
1306:             "gsd-core/templates/VALIDATION.md",
1307:             "gsd-core/templates/claude-md.md",
1308:             "gsd-core/templates/codebase/architecture.md",
1309:             "gsd-core/templates/codebase/concerns.md",
1310:             "gsd-core/templates/codebase/conventions.md",
1311:             "gsd-core/templates/codebase/integrations.md",
1312:             "gsd-core/templates/codebase/stack.md",
1313:             "gsd-core/templates/codebase/structure.md",
1314:             "gsd-core/templates/codebase/testing.md",
1315:             "gsd-core/templates/config.json",
1316:             "gsd-core/templates/context.md",
1317:             "gsd-core/templates/continue-here.md",
1318:             "gsd-core/templates/copilot-instructions.md",
1319:             "gsd-core/templates/debug-subagent-prompt.md",
1320:             "gsd-core/templates/dev-preferences.md",
1321:             "gsd-core/templates/discovery.md",
1322:             "gsd-core/templates/discussion-log.md",
1323:             "gsd-core/templates/milestone-archive.md",
1324:             "gsd-core/templates/milestone.md",
1325:             "gsd-core/templates/phase-prompt.md",
1326:             "gsd-core/templates/planner-subagent-prompt.md",
1327:             "gsd-core/templates/project.md",
1328:             "gsd-core/templates/requirements.md",
1329:             "gsd-core/templates/research-project/ARCHITECTURE.md",
1330:             "gsd-core/templates/research-project/FEATURES.md",
1331:             "gsd-core/templates/research-project/PITFALLS.md",
1332:             "gsd-core/templates/research-project/STACK.md",
1333:             "gsd-core/templates/research-project/SUMMARY.md",
1334:             "gsd-core/templates/research.md",
1335:             "gsd-core/templates/retrospective.md",
1336:             "gsd-core/templates/roadmap.md",
1337:             "gsd-core/templates/spec.md",
1338:             "gsd-core/templates/state.md",
1339:             "gsd-core/templates/summary-complex.md",
1340:             "gsd-core/templates/summary-minimal.md",
1341:             "gsd-core/templates/summary-standard.md",
1342:             "gsd-core/templates/summary.md",
1343:             "gsd-core/templates/user-profile.md",
1344:             "gsd-core/templates/user-setup.md",
1345:             "gsd-core/templates/verification-report.md",
1346:             "gsd-core/workflows/_runtime-launcher.snippet.sh",
1347:             "gsd-core/workflows/add-backlog.md",
1348:             "gsd-core/workflows/add-phase.md",
1349:             "gsd-core/workflows/add-tests.md",
1350:             "gsd-core/workflows/add-todo.md",
1351:             "gsd-core/workflows/ai-integration-phase.md",
1352:             "gsd-core/workflows/analyze-dependencies.md",
1353:             "gsd-core/workflows/audit-fix.md",
1354:             "gsd-core/workflows/audit-milestone.md",
1355:             "gsd-core/workflows/audit-uat.md",
1356:             "gsd-core/workflows/autonomous.md",
1357:             "gsd-core/workflows/check-todos.md",
1358:             "gsd-core/workflows/cleanup.md",
1359:             "gsd-core/workflows/code-review-fix.md",
1360:             "gsd-core/workflows/code-review.md",
1361:             "gsd-core/workflows/complete-milestone.md",
1362:             "gsd-core/workflows/debug.md",
1363:             "gsd-core/workflows/diagnose-issues.md",
1364:             "gsd-core/workflows/discovery-phase.md",
1365:             "gsd-core/workflows/discuss-phase-assumptions.md",
1366:             "gsd-core/workflows/discuss-phase-power.md",
1367:             "gsd-core/workflows/discuss-phase.md",
1368:             "gsd-core/workflows/discuss-phase/modes/advisor.md",
1369:             "gsd-core/workflows/discuss-phase/modes/all.md",
1370:             "gsd-core/workflows/discuss-phase/modes/analyze.md",
1371:             "gsd-core/workflows/discuss-phase/modes/auto.md",
1372:             "gsd-core/workflows/discuss-phase/modes/batch.md",
1373:             "gsd-core/workflows/discuss-phase/modes/chain.md",
1374:             "gsd-core/workflows/discuss-phase/modes/default.md",
1375:             "gsd-core/workflows/discuss-phase/modes/power.md",
1376:             "gsd-core/workflows/discuss-phase/modes/text.md",
1377:             "gsd-core/workflows/discuss-phase/templates/checkpoint.json",
1378:             "gsd-core/workflows/discuss-phase/templates/context.md",
1379:             "gsd-core/workflows/discuss-phase/templates/discussion-log.md",
1380:             "gsd-core/workflows/do.md",
1381:             "gsd-core/workflows/docs-update.md",
1382:             "gsd-core/workflows/edit-phase.md",
1383:             "gsd-core/workflows/eval-review.md",
1384:             "gsd-core/workflows/execute-phase.md",
1385:             "gsd-core/workflows/execute-phase/steps/codebase-drift-gate.md",
1386:             "gsd-core/workflows/execute-phase/steps/executor-isolation-dispatch.md",
1387:             "gsd-core/workflows/execute-phase/steps/per-plan-worktree-gate.md",
1388:             "gsd-core/workflows/execute-phase/steps/post-merge-gate.md",
1389:             "gsd-core/workflows/execute-phase/steps/regression-gate.md",
1390:             "gsd-core/workflows/execute-phase/steps/worktree-recovery-policy.md",
1391:             "gsd-core/workflows/execute-plan.md",
1392:             "gsd-core/workflows/explore.md",
1393:             "gsd-core/workflows/extract-learnings.md",
1394:             "gsd-core/workflows/fast.md",
1395:             "gsd-core/workflows/forensics.md",
1396:             "gsd-core/workflows/graduation.md",
1397:             "gsd-core/workflows/health.md",
1398:             "gsd-core/workflows/help.md",
1399:             "gsd-core/workflows/help/modes/brief.md",
1400:             "gsd-core/workflows/help/modes/default.md",
1401:             "gsd-core/workflows/help/modes/full.md",
1402:             "gsd-core/workflows/help/modes/topic.md",
1403:             "gsd-core/workflows/import.md",
1404:             "gsd-core/workflows/inbox.md",
1405:             "gsd-core/workflows/ingest-docs.md",
1406:             "gsd-core/workflows/insert-phase.md",
1407:             "gsd-core/workflows/list-phase-assumptions.md",
1408:             "gsd-core/workflows/list-seeds.md",
1409:             "gsd-core/workflows/list-workspaces.md",
1410:             "gsd-core/workflows/manager.md",
1411:             "gsd-core/workflows/map-codebase.md",
1412:             "gsd-core/workflows/milestone-summary.md",
1413:             "gsd-core/workflows/mvp-phase.md",
1414:             "gsd-core/workflows/new-milestone.md",
1415:             "gsd-core/workflows/new-project.md",
1416:             "gsd-core/workflows/new-workspace.md",
1417:             "gsd-core/workflows/next.md",
1418:             "gsd-core/workflows/node-repair.md",
1419:             "gsd-core/workflows/note.md",
1420:             "gsd-core/workflows/onboard.md",
1421:             "gsd-core/workflows/pause-work.md",
1422:             "gsd-core/workflows/plan-milestone-gaps.md",
1423:             "gsd-core/workflows/plan-phase.md",
1424:             "gsd-core/workflows/plan-phase/steps/closed-phase-gate.md",
1425:             "gsd-core/workflows/plan-phase/steps/prd-express-path.md",
1426:             "gsd-core/workflows/plan-phase/steps/windows-troubleshooting.md",
1427:             "gsd-core/workflows/plan-review-convergence.md",
1428:             "gsd-core/workflows/plant-seed.md",
1429:             "gsd-core/workflows/pr-branch.md",
1430:             "gsd-core/workflows/profile-user.md",
1431:             "gsd-core/workflows/progress.md",
1432:             "gsd-core/workflows/quick.md",
1433:             "gsd-core/workflows/reapply-patches.md",
1434:             "gsd-core/workflows/remove-phase.md",
1435:             "gsd-core/workflows/remove-workspace.md",
1436:             "gsd-core/workflows/resume-project.md",
1437:             "gsd-core/workflows/review.md",
1438:             "gsd-core/workflows/scan.md",
1439:             "gsd-core/workflows/secure-phase.md",
1440:             "gsd-core/workflows/session-report.md",
1441:             "gsd-core/workflows/settings-advanced.md",
1442:             "gsd-core/workflows/settings-integrations.md",
1443:             "gsd-core/workflows/settings.md",
1444:             "gsd-core/workflows/ship.md",
1445:             "gsd-core/workflows/sketch-wrap-up.md",
1446:             "gsd-core/workflows/sketch.md",
1447:             "gsd-core/workflows/smart-entry.md",
1448:             "gsd-core/workflows/spec-phase.md",
1449:             "gsd-core/workflows/spike-wrap-up.md",
1450:             "gsd-core/workflows/spike.md",
1451:             "gsd-core/workflows/stats.md",
1452:             "gsd-core/workflows/sync-skills.md",
1453:             "gsd-core/workflows/thread.md",
1454:             "gsd-core/workflows/transition.md",
1455:             "gsd-core/workflows/ui-phase.md",
1456:             "gsd-core/workflows/ui-review.md",
1457:             "gsd-core/workflows/ultraplan-phase.md",
1458:             "gsd-core/workflows/undo.md",
1459:             "gsd-core/workflows/update.md",
1460:             "gsd-core/workflows/validate-phase.md",
1461:             "gsd-core/workflows/verify-phase.md",
1462:             "gsd-core/workflows/verify-work.md",
1463:             "hooks/gsd-check-update-worker.js",
1464:             "hooks/gsd-check-update.js",
1465:             "hooks/gsd-config-reload.js",
1466:             "hooks/gsd-context-monitor.js",
1467:             "hooks/gsd-cursor-post-tool.js",
1468:             "hooks/gsd-cursor-pre-tool.js",
1469:             "hooks/gsd-cursor-session-start.js",
1470:             "hooks/gsd-cursor-stop.js",
1471:             "hooks/gsd-cursor-subagent-start.js",
1472:             "hooks/gsd-cursor-subagent-stop.js",
1473:             "hooks/gsd-ensure-canonical-path.js",
1474:             "hooks/gsd-graphify-update.sh",
1475:             "hooks/gsd-phase-boundary.sh",
1476:             "hooks/gsd-prompt-guard.js",
1477:             "hooks/gsd-read-guard.js",
1478:             "hooks/gsd-read-injection-scanner.js",
1479:             "hooks/gsd-session-state.sh",
1480:             "hooks/gsd-statusline.js",
1481:             "hooks/gsd-update-banner.js",
1482:             "hooks/gsd-validate-commit.sh",
1483:             "hooks/gsd-windsurf-pre-command.js",
1484:             "hooks/gsd-windsurf-pre-write.js",
1485:             "hooks/gsd-workflow-guard.js",
1486:             "hooks/gsd-worktree-path-guard.js",
1487:             "hooks/lib/cursor-workspace.js",
1488:             "hooks/lib/git-cmd.js",
1489:             "hooks/lib/gsd-graphify-rebuild.sh",
1490:             "hooks/managed-hooks-registry.cjs",
1491:             "package.json",
1492:             "scripts/changeset/README.md",
1493:             "scripts/changeset/cli.cjs",
1494:             "scripts/changeset/github-release-notes.cjs",
1495:             "scripts/changeset/lint.cjs",
1496:             "scripts/changeset/new.cjs",
1497:             "scripts/changeset/parse.cjs",
1498:             "scripts/changeset/render.cjs",
1499:             "scripts/changeset/serialize.cjs",
1500:             "scripts/fix-slash-commands.cjs",
1501:             "scripts/gen-capability-registry.cjs",
1502:             "scripts/gen-loop-host-contract.cjs",
1503:             "scripts/lib/allowlist-ratchet.cjs",
1504:             "scripts/lib/cli-exit.cjs",
1505:             "skills/gsd-add-tests/SKILL.md",
1506:             "skills/gsd-ai-integration-phase/SKILL.md",
1507:             "skills/gsd-audit-fix/SKILL.md",
1508:             "skills/gsd-audit-milestone/SKILL.md",
1509:             "skills/gsd-audit-uat/SKILL.md",
1510:             "skills/gsd-autonomous/SKILL.md",
1511:             "skills/gsd-capture/SKILL.md",
1512:             "skills/gsd-cleanup/SKILL.md",
1513:             "skills/gsd-code-review/SKILL.md",
1514:             "skills/gsd-complete-milestone/SKILL.md",
1515:             "skills/gsd-config/SKILL.md",
1516:             "skills/gsd-debug/SKILL.md",
1517:             "skills/gsd-discuss-phase/SKILL.md",
1518:             "skills/gsd-docs-update/SKILL.md",
1519:             "skills/gsd-eval-review/SKILL.md",
1520:             "skills/gsd-execute-phase/SKILL.md",
1521:             "skills/gsd-explore/SKILL.md",
1522:             "skills/gsd-extract-learnings/SKILL.md",
1523:             "skills/gsd-fast/SKILL.md",
1524:             "skills/gsd-forensics/SKILL.md",
1525:             "skills/gsd-graphify/SKILL.md",
1526:             "skills/gsd-health/SKILL.md",
1527:             "skills/gsd-help/SKILL.md",
1528:             "skills/gsd-import/SKILL.md",
1529:             "skills/gsd-inbox/SKILL.md",
1530:             "skills/gsd-ingest-docs/SKILL.md",
1531:             "skills/gsd-manager/SKILL.md",
1532:             "skills/gsd-map-codebase/SKILL.md",
1533:             "skills/gsd-mempalace-capture/SKILL.md",
1534:             "skills/gsd-mempalace-recall/SKILL.md",
1535:             "skills/gsd-milestone-summary/SKILL.md",
1536:             "skills/gsd-mvp-phase/SKILL.md",
1537:             "skills/gsd-new-milestone/SKILL.md",
1538:             "skills/gsd-new-project/SKILL.md",
1539:             "skills/gsd-next/SKILL.md",
1540:             "skills/gsd-ns-context/SKILL.md",
1541:             "skills/gsd-ns-ideate/SKILL.md",
1542:             "skills/gsd-ns-manage/SKILL.md",
1543:             "skills/gsd-ns-project/SKILL.md",
1544:             "skills/gsd-ns-review/SKILL.md",
1545:             "skills/gsd-ns-workflow/SKILL.md",
1546:             "skills/gsd-onboard/SKILL.md",
1547:             "skills/gsd-pause-work/SKILL.md",
1548:             "skills/gsd-phase/SKILL.md",
1549:             "skills/gsd-plan-phase/SKILL.md",
1550:             "skills/gsd-plan-review-convergence/SKILL.md",
1551:             "skills/gsd-pr-branch/SKILL.md",
1552:             "skills/gsd-profile-user/SKILL.md",
1553:             "skills/gsd-progress/SKILL.md",
1554:             "skills/gsd-quick/SKILL.md",
1555:             "skills/gsd-resume-work/SKILL.md",
1556:             "skills/gsd-review-backlog/SKILL.md",
1557:             "skills/gsd-review/SKILL.md",
1558:             "skills/gsd-secure-phase/SKILL.md",
1559:             "skills/gsd-settings/SKILL.md",
1560:             "skills/gsd-ship/SKILL.md",
1561:             "skills/gsd-sketch/SKILL.md",
1562:             "skills/gsd-spec-phase/SKILL.md",
1563:             "skills/gsd-spike/SKILL.md",
1564:             "skills/gsd-stats/SKILL.md",
1565:             "skills/gsd-surface/SKILL.md",
1566:             "skills/gsd-thread/SKILL.md",
1567:             "skills/gsd-ui-phase/SKILL.md",
1568:             "skills/gsd-ui-review/SKILL.md",
1569:             "skills/gsd-ultraplan-phase/SKILL.md",
1570:             "skills/gsd-undo/SKILL.md",
1571:             "skills/gsd-update/SKILL.md",
1572:             "skills/gsd-upstream/SKILL.md",
1573:             "skills/gsd-validate-phase/SKILL.md",
1574:             "skills/gsd-verify-work/SKILL.md",
1575:             "skills/gsd-workspace/SKILL.md",
1576:             "skills/gsd-workstreams/SKILL.md"
1577:           ],
1578:           "listed": []
1579:         }
1580:       },
1581:       "detail": "628 of 628 absent, e.g. .gsd-source, agents/general-purpose.md, agents/gsd-advisor-researcher.md, agents/gsd-ai-researcher.md\n\n628 !== 0\n"
1582:     },
1583:     {
1584:       "scenario": "upgrade",
1585:       "kind": "harness",
1586:       "id": "first-install-succeeded",
1587:       "ok": true,
1588:       "evidence": {
1589:         "kind": "assertion-pass",
1590:         "actual": {}
1591:       }
1592:     },
1593:     {
1594:       "scenario": "upgrade",
1595:       "kind": "harness",
1596:       "id": "picked-files-installed",
1597:       "ok": true,
1598:       "evidence": {
1599:         "kind": "assertion-pass",
1600:         "actual": {}
1601:       }
1602:     },
1603:     {
1604:       "scenario": "upgrade",
1605:       "kind": "harness",
1606:       "id": "wrapper-child-failed-at-injection",
1607:       "ok": true,
1608:       "evidence": {
1609:         "kind": "assertion-pass",
1610:         "actual": {}
1611:       }
1612:     },
1613:     {
1614:       "scenario": "upgrade",
1615:       "kind": "harness",
1616:       "id": "child-rewrote-picked-files",
1617:       "ok": true,
1618:       "evidence": {
1619:         "kind": "assertion-pass",
1620:         "actual": {}
1621:       }
1622:     },
1623:     {
1624:       "scenario": "upgrade",
1625:       "kind": "acceptance",
1626:       "id": "status-is-1",
1627:       "ok": true,
1628:       "evidence": {
1629:         "kind": "assertion-pass",
1630:         "actual": {}
1631:       }
1632:     },
1633:     {
1634:       "scenario": "upgrade",
1635:       "kind": "acceptance",
1636:       "id": "outcome-exact",
1637:       "ok": false,
1638:       "evidence": {
1639:         "kind": "outcome-lines",
1640:         "actual": {
1641:           "lines": [
1642:             "Rollback applied"
1643:           ]
1644:         }
1645:       },
1646:       "detail": "outcome line is not the verified form: \"Rollback applied\""
1647:     },
1648:     {
1649:       "scenario": "upgrade",
1650:       "kind": "acceptance",
1651:       "id": "home-outside-target-preserved",
1652:       "ok": true,
1653:       "evidence": {
1654:         "kind": "home-state",
1655:         "actual": {
1656:           "before": {
1657:             ".cache": "dir",
1658:             ".codex": "dir",
1659:             ".config": "dir",
1660:             ".gsd": "dir",
1661:             ".local": "dir",
1662:             "AppData": "dir",
1663:             "other-owner": "dir",
1664:             "other-owner/empty": "dir",
1665:             "AppData/Local": "dir",
1666:             "AppData/Roaming": "dir",
1667:             "AppData/Roaming/owner.txt": "file:28c1aef6e81ffeaefb84dc6f3ce40782634fbdf2da6b34d902a3471eda919f96",
1668:             "AppData/Local/Microsoft": "dir",
1669:             "AppData/Local/owner.txt": "file:e499611dd9b769d7e03f0d0aeaccea8d7e6d7f1afcf1e326814e4da09e515a54",
1670:             "AppData/Local/Microsoft/Windows": "dir",
1671:             "AppData/Local/Microsoft/Windows/PowerShell": "dir",
1672:             "AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive": "file:49cd61f5a4b874d896bff0b4be0f1cd96b80e1a2427b49003b39e3c0fa7ca487",
1673:             ".local/share": "dir",
1674:             ".gsd/owner.json": "file:b5f487601adb4b7904b51e721bc732659bed9b6277b4b0363c097486f85e6ebe",
1675:             ".config/owner.txt": "file:cae8bccf23526392cc6a3d970ab5cf82e5858fc5b1924a9164944812a51e6fcc",
1676:             ".codex/owner.txt": "file:4b371db1a677affe16e51582a5f39200fcf7ec05287c479943d64522e3ba2956"
1677:           },
1678:           "after": {
1679:             ".cache": "dir",
1680:             ".codex": "dir",
1681:             ".config": "dir",
1682:             ".gsd": "dir",
1683:             ".local": "dir",
1684:             "AppData": "dir",
1685:             "other-owner": "dir",
1686:             "other-owner/empty": "dir",
1687:             "AppData/Local": "dir",
1688:             "AppData/Roaming": "dir",
1689:             "AppData/Roaming/owner.txt": "file:28c1aef6e81ffeaefb84dc6f3ce40782634fbdf2da6b34d902a3471eda919f96",
1690:             "AppData/Local/Microsoft": "dir",
1691:             "AppData/Local/owner.txt": "file:e499611dd9b769d7e03f0d0aeaccea8d7e6d7f1afcf1e326814e4da09e515a54",
1692:             "AppData/Local/Microsoft/Windows": "dir",
1693:             "AppData/Local/Microsoft/Windows/PowerShell": "dir",
1694:             "AppData/Local/Microsoft/Windows/PowerShell/StartupProfileData-NonInteractive": "file:24bd6958f4724d5669cb419c396aeafb86d33697feb58dd0d03a8d36e16054a2",
1695:             ".local/share": "dir",
1696:             ".gsd/owner.json": "file:b5f487601adb4b7904b51e721bc732659bed9b6277b4b0363c097486f85e6ebe",
1697:             ".config/owner.txt": "file:cae8bccf23526392cc6a3d970ab5cf82e5858fc5b1924a9164944812a51e6fcc",
1698:             ".codex/owner.txt": "file:4b371db1a677affe16e51582a5f39200fcf7ec05287c479943d64522e3ba2956"
1699:           }
1700:         }
1701:       }
1702:     },
1703:     {
1704:       "scenario": "upgrade",
1705:       "kind": "acceptance",
1706:       "id": "owner-bytes-preserved",
1707:       "ok": true,
1708:       "evidence": {
1709:         "kind": "assertion-pass",
1710:         "actual": {}
1711:       }
1712:     },
1713:     {
1714:       "scenario": "upgrade",
1715:       "kind": "acceptance",
1716:       "id": "tree-deep-equal-outside-allowlist",
1717:       "ok": false,
1718:       "evidence": {
1719:         "kind": "tree-delta",
1720:         "actual": {
1721:           "missing": [],
1722:           "unexpected": [],
1723:           "changed": [
1724:             "gsd-install-state.json"
1725:           ]
1726:         }
1727:       },
1728:       "detail": "after against before: missing 0; unexpected 0; changed 1 (gsd-install-state.json)"
1729:     },
1730:     {
1731:       "scenario": "upgrade",
1732:       "kind": "acceptance",
1733:       "id": "transaction-directory-shape",
1734:       "ok": false,
1735:       "evidence": {
1736:         "kind": "transaction-state",
1737:         "actual": {
1738:           "state": "absent"
1739:         }
1740:       },
1741:       "detail": "transaction root is absent"
1742:     },
1743:     {
1744:       "scenario": "upgrade",
1745:       "kind": "acceptance",
1746:       "id": "quarantine-path-printed",
1747:       "ok": false,
1748:       "evidence": {
1749:         "kind": "quarantine-reference",
1750:         "actual": {
1751:           "path": null
1752:         }
1753:       },
1754:       "detail": "no quarantine to name"
1755:     },
1756:     {
1757:       "scenario": "upgrade",
1758:       "kind": "acceptance",
1759:       "id": "removed-file-quarantined-as-new",
1760:       "ok": false,
1761:       "evidence": {
1762:         "kind": "entry-type",
1763:         "actual": {
1764:           "path": "scripts/lib/cli-exit.cjs",
1765:           "type": null
1766:         }
1767:       },
1768:       "detail": "Expected values to be strictly equal:\n+ actual - expected\n\n+ undefined\n- 'file'\n"
1769:     },
1770:     {
1771:       "scenario": "upgrade",
1772:       "kind": "acceptance",
1773:       "id": "edited-file-displaced",
1774:       "ok": false,
1775:       "evidence": {
1776:         "kind": "displaced-paths",
1777:         "actual": {
1778:           "paths": []
1779:         }
1780:       },
1781:       "detail": "[]"
1782:     },
1783:     {
1784:       "scenario": "upgrade",
1785:       "kind": "acceptance",
1786:       "id": "moved-txt-lists-every-file",
1787:       "ok": false,
1788:       "evidence": {
1789:         "kind": "moved-list",
1790:         "actual": {
1791:           "expected": [
1792:             "scripts/lib/cli-exit.cjs"
1793:           ],
1794:           "listed": []
1795:         }
1796:       },
1797:       "detail": "1 of 1 absent, e.g. scripts/lib/cli-exit.cjs\n\n1 !== 0\n"
1798:     }
1799:   ],
1800:   "context": {
1801:     "twin": {
1802:       "residue": {
1803:         ".gsd-source": "file",
1804:         "agents": "dir",
1805:         "gsd-core": "dir",
1806:         "gsd-migration-journal": "dir",
1807:         "hooks": "dir",
1808:         "package.json": "file",
1809:         "scripts": "dir",
1810:         "skills": "dir",
1811:         "skills/gsd-add-tests": "dir",
1812:         "skills/gsd-ai-integration-phase": "dir",
1813:         "skills/gsd-audit-fix": "dir",
1814:         "skills/gsd-audit-milestone": "dir",
1815:         "skills/gsd-audit-uat": "dir",
1816:         "skills/gsd-autonomous": "dir",
1817:         "skills/gsd-capture": "dir",
1818:         "skills/gsd-cleanup": "dir",
1819:         "skills/gsd-code-review": "dir",
1820:         "skills/gsd-complete-milestone": "dir",
1821:         "skills/gsd-config": "dir",
1822:         "skills/gsd-debug": "dir",
1823:         "skills/gsd-discuss-phase": "dir",
1824:         "skills/gsd-docs-update": "dir",
1825:         "skills/gsd-eval-review": "dir",
1826:         "skills/gsd-execute-phase": "dir",
1827:         "skills/gsd-explore": "dir",
1828:         "skills/gsd-extract-learnings": "dir",
1829:         "skills/gsd-fast": "dir",
1830:         "skills/gsd-forensics": "dir",
1831:         "skills/gsd-graphify": "dir",
1832:         "skills/gsd-health": "dir",
1833:         "skills/gsd-help": "dir",
1834:         "skills/gsd-import": "dir",
1835:         "skills/gsd-inbox": "dir",
1836:         "skills/gsd-ingest-docs": "dir",
1837:         "skills/gsd-manager": "dir",
1838:         "skills/gsd-map-codebase": "dir",
1839:         "skills/gsd-mempalace-capture": "dir",
1840:         "skills/gsd-mempalace-recall": "dir",
1841:         "skills/gsd-milestone-summary": "dir",
1842:         "skills/gsd-mvp-phase": "dir",
1843:         "skills/gsd-new-milestone": "dir",
1844:         "skills/gsd-new-project": "dir",
1845:         "skills/gsd-next": "dir",
1846:         "skills/gsd-ns-context": "dir",
1847:         "skills/gsd-ns-ideate": "dir",
1848:         "skills/gsd-ns-manage": "dir",
1849:         "skills/gsd-ns-project": "dir",
1850:         "skills/gsd-ns-review": "dir",
1851:         "skills/gsd-ns-workflow": "dir",
1852:         "skills/gsd-onboard": "dir",
1853:         "skills/gsd-pause-work": "dir",
1854:         "skills/gsd-phase": "dir",
1855:         "skills/gsd-plan-phase": "dir",
1856:         "skills/gsd-plan-review-convergence": "dir",
1857:         "skills/gsd-pr-branch": "dir",
1858:         "skills/gsd-profile-user": "dir",
1859:         "skills/gsd-progress": "dir",
1860:         "skills/gsd-quick": "dir",
1861:         "skills/gsd-resume-work": "dir",
1862:         "skills/gsd-review": "dir",
1863:         "skills/gsd-review-backlog": "dir",
1864:         "skills/gsd-secure-phase": "dir",
1865:         "skills/gsd-settings": "dir",
1866:         "skills/gsd-ship": "dir",
1867:         "skills/gsd-sketch": "dir",
1868:         "skills/gsd-spec-phase": "dir",
1869:         "skills/gsd-spike": "dir",
1870:         "skills/gsd-stats": "dir",
1871:         "skills/gsd-surface": "dir",
1872:         "skills/gsd-thread": "dir",
1873:         "skills/gsd-ui-phase": "dir",
1874:         "skills/gsd-ui-review": "dir",
1875:         "skills/gsd-ultraplan-phase": "dir",
1876:         "skills/gsd-undo": "dir",
1877:         "skills/gsd-update": "dir",
1878:         "skills/gsd-upstream": "dir",
1879:         "skills/gsd-validate-phase": "dir",
1880:         "skills/gsd-verify-work": "dir",
1881:         "skills/gsd-workspace": "dir",
1882:         "skills/gsd-workstreams": "dir",
1883:         "skills/gsd-workstreams/SKILL.md": "file",
1884:         "skills/gsd-workspace/SKILL.md": "file",
1885:         "skills/gsd-verify-work/SKILL.md": "file",
1886:         "skills/gsd-validate-phase/SKILL.md": "file",
1887:         "skills/gsd-upstream/SKILL.md": "file",
1888:         "skills/gsd-update/SKILL.md": "file",
1889:         "skills/gsd-undo/SKILL.md": "file",
1890:         "skills/gsd-ultraplan-phase/SKILL.md": "file",
1891:         "skills/gsd-ui-review/SKILL.md": "file",
1892:         "skills/gsd-ui-phase/SKILL.md": "file",
1893:         "skills/gsd-thread/SKILL.md": "file",
1894:         "skills/gsd-surface/SKILL.md": "file",
1895:         "skills/gsd-stats/SKILL.md": "file",
1896:         "skills/gsd-spike/SKILL.md": "file",
1897:         "skills/gsd-spec-phase/SKILL.md": "file",
1898:         "skills/gsd-sketch/SKILL.md": "file",
1899:         "skills/gsd-ship/SKILL.md": "file",
1900:         "skills/gsd-settings/SKILL.md": "file",
1901:         "skills/gsd-secure-phase/SKILL.md": "file",
1902:         "skills/gsd-review-backlog/SKILL.md": "file",
1903:         "skills/gsd-review/SKILL.md": "file",
1904:         "skills/gsd-resume-work/SKILL.md": "file",
1905:         "skills/gsd-quick/SKILL.md": "file",
1906:         "skills/gsd-progress/SKILL.md": "file",
1907:         "skills/gsd-profile-user/SKILL.md": "file",
1908:         "skills/gsd-pr-branch/SKILL.md": "file",
1909:         "skills/gsd-plan-review-convergence/SKILL.md": "file",
1910:         "skills/gsd-plan-phase/SKILL.md": "file",
1911:         "skills/gsd-phase/SKILL.md": "file",
1912:         "skills/gsd-pause-work/SKILL.md": "file",
1913:         "skills/gsd-onboard/SKILL.md": "file",
1914:         "skills/gsd-ns-workflow/SKILL.md": "file",
1915:         "skills/gsd-ns-review/SKILL.md": "file",
1916:         "skills/gsd-ns-project/SKILL.md": "file",
1917:         "skills/gsd-ns-manage/SKILL.md": "file",
1918:         "skills/gsd-ns-ideate/SKILL.md": "file",
1919:         "skills/gsd-ns-context/SKILL.md": "file",
1920:         "skills/gsd-next/SKILL.md": "file",
1921:         "skills/gsd-new-project/SKILL.md": "file",
1922:         "skills/gsd-new-milestone/SKILL.md": "file",
1923:         "skills/gsd-mvp-phase/SKILL.md": "file",
1924:         "skills/gsd-milestone-summary/SKILL.md": "file",
1925:         "skills/gsd-mempalace-recall/SKILL.md": "file",
1926:         "skills/gsd-mempalace-capture/SKILL.md": "file",
1927:         "skills/gsd-map-codebase/SKILL.md": "file",
1928:         "skills/gsd-manager/SKILL.md": "file",
1929:         "skills/gsd-ingest-docs/SKILL.md": "file",
1930:         "skills/gsd-inbox/SKILL.md": "file",
1931:         "skills/gsd-import/SKILL.md": "file",
1932:         "skills/gsd-help/SKILL.md": "file",
1933:         "skills/gsd-health/SKILL.md": "file",
1934:         "skills/gsd-graphify/SKILL.md": "file",
1935:         "skills/gsd-forensics/SKILL.md": "file",
1936:         "skills/gsd-fast/SKILL.md": "file",
1937:         "skills/gsd-extract-learnings/SKILL.md": "file",
1938:         "skills/gsd-explore/SKILL.md": "file",
1939:         "skills/gsd-execute-phase/SKILL.md": "file",
1940:         "skills/gsd-eval-review/SKILL.md": "file",
1941:         "skills/gsd-docs-update/SKILL.md": "file",
1942:         "skills/gsd-discuss-phase/SKILL.md": "file",
1943:         "skills/gsd-debug/SKILL.md": "file",
1944:         "skills/gsd-config/SKILL.md": "file",
1945:         "skills/gsd-complete-milestone/SKILL.md": "file",
1946:         "skills/gsd-code-review/SKILL.md": "file",
1947:         "skills/gsd-cleanup/SKILL.md": "file",
1948:         "skills/gsd-capture/SKILL.md": "file",
1949:         "skills/gsd-autonomous/SKILL.md": "file",
1950:         "skills/gsd-audit-uat/SKILL.md": "file",
1951:         "skills/gsd-audit-milestone/SKILL.md": "file",
1952:         "skills/gsd-audit-fix/SKILL.md": "file",
1953:         "skills/gsd-ai-integration-phase/SKILL.md": "file",
1954:         "skills/gsd-add-tests/SKILL.md": "file",
1955:         "scripts/changeset": "dir",
1956:         "scripts/fix-slash-commands.cjs": "file",
1957:         "scripts/gen-capability-registry.cjs": "file",
1958:         "scripts/gen-loop-host-contract.cjs": "file",
1959:         "scripts/lib": "dir",
1960:         "scripts/lib/allowlist-ratchet.cjs": "file",
1961:         "scripts/lib/cli-exit.cjs": "file",
1962:         "scripts/changeset/cli.cjs": "file",
1963:         "scripts/changeset/github-release-notes.cjs": "file",
1964:         "scripts/changeset/lint.cjs": "file",
1965:         "scripts/changeset/new.cjs": "file",
1966:         "scripts/changeset/parse.cjs": "file",
1967:         "scripts/changeset/README.md": "file",
1968:         "scripts/changeset/render.cjs": "file",
1969:         "scripts/changeset/serialize.cjs": "file",
1970:         "hooks/gsd-check-update-worker.js": "file",
1971:         "hooks/gsd-check-update.js": "file",
1972:         "hooks/gsd-config-reload.js": "file",
1973:         "hooks/gsd-context-monitor.js": "file",
1974:         "hooks/gsd-cursor-post-tool.js": "file",
1975:         "hooks/gsd-cursor-pre-tool.js": "file",
1976:         "hooks/gsd-cursor-session-start.js": "file",
1977:         "hooks/gsd-cursor-stop.js": "file",
1978:         "hooks/gsd-cursor-subagent-start.js": "file",
1979:         "hooks/gsd-cursor-subagent-stop.js": "file",
1980:         "hooks/gsd-ensure-canonical-path.js": "file",
1981:         "hooks/gsd-graphify-update.sh": "file",
1982:         "hooks/gsd-phase-boundary.sh": "file",
1983:         "hooks/gsd-prompt-guard.js": "file",
1984:         "hooks/gsd-read-guard.js": "file",
1985:         "hooks/gsd-read-injection-scanner.js": "file",
1986:         "hooks/gsd-session-state.sh": "file",
1987:         "hooks/gsd-statusline.js": "file",
1988:         "hooks/gsd-update-banner.js": "file",
1989:         "hooks/gsd-validate-commit.sh": "file",
1990:         "hooks/gsd-windsurf-pre-command.js": "file",
1991:         "hooks/gsd-windsurf-pre-write.js": "file",
1992:         "hooks/gsd-workflow-guard.js": "file",
1993:         "hooks/gsd-worktree-path-guard.js": "file",
1994:         "hooks/lib": "dir",
1995:         "hooks/managed-hooks-registry.cjs": "file",
1996:         "hooks/lib/cursor-workspace.js": "file",
1997:         "hooks/lib/git-cmd.js": "file",
1998:         "hooks/lib/gsd-graphify-rebuild.sh": "file",
1999:         "gsd-core/.gsd-runtime": "file",
2000:         "gsd-core/bin": "dir",
2001:         "gsd-core/contexts": "dir",
2002:         "gsd-core/references": "dir",
2003:         "gsd-core/templates": "dir",
2004:         "gsd-core/VERSION": "file",
2005:         "gsd-core/workflows": "dir",
2006:         "gsd-core/workflows/add-backlog.md": "file",
2007:         "gsd-core/workflows/add-phase.md": "file",
2008:         "gsd-core/workflows/add-tests.md": "file",
2009:         "gsd-core/workflows/add-todo.md": "file",
2010:         "gsd-core/workflows/ai-integration-phase.md": "file",
2011:         "gsd-core/workflows/analyze-dependencies.md": "file",
2012:         "gsd-core/workflows/audit-fix.md": "file",
2013:         "gsd-core/workflows/audit-milestone.md": "file",
2014:         "gsd-core/workflows/audit-uat.md": "file",
2015:         "gsd-core/workflows/autonomous.md": "file",
2016:         "gsd-core/workflows/check-todos.md": "file",
2017:         "gsd-core/workflows/cleanup.md": "file",
2018:         "gsd-core/workflows/code-review-fix.md": "file",
2019:         "gsd-core/workflows/code-review.md": "file",
2020:         "gsd-core/workflows/complete-milestone.md": "file",
2021:         "gsd-core/workflows/debug.md": "file",
2022:         "gsd-core/workflows/diagnose-issues.md": "file",
2023:         "gsd-core/workflows/discovery-phase.md": "file",
2024:         "gsd-core/workflows/discuss-phase": "dir",
2025:         "gsd-core/workflows/discuss-phase-assumptions.md": "file",
2026:         "gsd-core/workflows/discuss-phase-power.md": "file",
2027:         "gsd-core/workflows/discuss-phase.md": "file",
2028:         "gsd-core/workflows/do.md": "file",
2029:         "gsd-core/workflows/docs-update.md": "file",
2030:         "gsd-core/workflows/edit-phase.md": "file",
2031:         "gsd-core/workflows/eval-review.md": "file",
2032:         "gsd-core/workflows/execute-phase": "dir",
2033:         "gsd-core/workflows/execute-phase.md": "file",
2034:         "gsd-core/workflows/execute-plan.md": "file",
2035:         "gsd-core/workflows/explore.md": "file",
2036:         "gsd-core/workflows/extract-learnings.md": "file",
2037:         "gsd-core/workflows/fast.md": "file",
2038:         "gsd-core/workflows/forensics.md": "file",
2039:         "gsd-core/workflows/graduation.md": "file",
2040:         "gsd-core/workflows/health.md": "file",
2041:         "gsd-core/workflows/help": "dir",
2042:         "gsd-core/workflows/help.md": "file",
2043:         "gsd-core/workflows/import.md": "file",
2044:         "gsd-core/workflows/inbox.md": "file",
2045:         "gsd-core/workflows/ingest-docs.md": "file",
2046:         "gsd-core/workflows/insert-phase.md": "file",
2047:         "gsd-core/workflows/list-phase-assumptions.md": "file",
2048:         "gsd-core/workflows/list-seeds.md": "file",
2049:         "gsd-core/workflows/list-workspaces.md": "file",
2050:         "gsd-core/workflows/manager.md": "file",
2051:         "gsd-core/workflows/map-codebase.md": "file",
2052:         "gsd-core/workflows/milestone-summary.md": "file",
2053:         "gsd-core/workflows/mvp-phase.md": "file",
2054:         "gsd-core/workflows/new-milestone.md": "file",
2055:         "gsd-core/workflows/new-project.md": "file",
2056:         "gsd-core/workflows/new-workspace.md": "file",
2057:         "gsd-core/workflows/next.md": "file",
2058:         "gsd-core/workflows/node-repair.md": "file",
2059:         "gsd-core/workflows/note.md": "file",
2060:         "gsd-core/workflows/onboard.md": "file",
2061:         "gsd-core/workflows/pause-work.md": "file",
2062:         "gsd-core/workflows/plan-milestone-gaps.md": "file",
2063:         "gsd-core/workflows/plan-phase": "dir",
2064:         "gsd-core/workflows/plan-phase.md": "file",
2065:         "gsd-core/workflows/plan-review-convergence.md": "file",
2066:         "gsd-core/workflows/plant-seed.md": "file",
2067:         "gsd-core/workflows/pr-branch.md": "file",
2068:         "gsd-core/workflows/profile-user.md": "file",
2069:         "gsd-core/workflows/progress.md": "file",
2070:         "gsd-core/workflows/quick.md": "file",
2071:         "gsd-core/workflows/reapply-patches.md": "file",
2072:         "gsd-core/workflows/remove-phase.md": "file",
2073:         "gsd-core/workflows/remove-workspace.md": "file",
2074:         "gsd-core/workflows/resume-project.md": "file",
2075:         "gsd-core/workflows/review.md": "file",
2076:         "gsd-core/workflows/scan.md": "file",
2077:         "gsd-core/workflows/secure-phase.md": "file",
2078:         "gsd-core/workflows/session-report.md": "file",
2079:         "gsd-core/workflows/settings-advanced.md": "file",
2080:         "gsd-core/workflows/settings-integrations.md": "file",
2081:         "gsd-core/workflows/settings.md": "file",
2082:         "gsd-core/workflows/ship.md": "file",
2083:         "gsd-core/workflows/sketch-wrap-up.md": "file",
2084:         "gsd-core/workflows/sketch.md": "file",
2085:         "gsd-core/workflows/smart-entry.md": "file",
2086:         "gsd-core/workflows/spec-phase.md": "file",
2087:         "gsd-core/workflows/spike-wrap-up.md": "file",
2088:         "gsd-core/workflows/spike.md": "file",
2089:         "gsd-core/workflows/stats.md": "file",
2090:         "gsd-core/workflows/sync-skills.md": "file",
2091:         "gsd-core/workflows/thread.md": "file",
2092:         "gsd-core/workflows/transition.md": "file",
2093:         "gsd-core/workflows/ui-phase.md": "file",
2094:         "gsd-core/workflows/ui-review.md": "file",
2095:         "gsd-core/workflows/ultraplan-phase.md": "file",
2096:         "gsd-core/workflows/undo.md": "file",
2097:         "gsd-core/workflows/update.md": "file",
2098:         "gsd-core/workflows/validate-phase.md": "file",
2099:         "gsd-core/workflows/verify-phase.md": "file",
2100:         "gsd-core/workflows/verify-work.md": "file",
2101:         "gsd-core/workflows/_runtime-launcher.snippet.sh": "file",
2102:         "gsd-core/workflows/plan-phase/steps": "dir",
2103:         "gsd-core/workflows/plan-phase/steps/closed-phase-gate.md": "file",
2104:         "gsd-core/workflows/plan-phase/steps/prd-express-path.md": "file",
2105:         "gsd-core/workflows/plan-phase/steps/windows-troubleshooting.md": "file",
2106:         "gsd-core/workflows/help/modes": "dir",
2107:         "gsd-core/workflows/help/modes/brief.md": "file",
2108:         "gsd-core/workflows/help/modes/default.md": "file",
2109:         "gsd-core/workflows/help/modes/full.md": "file",
2110:         "gsd-core/workflows/help/modes/topic.md": "file",
2111:         "gsd-core/workflows/execute-phase/steps": "dir",
2112:         "gsd-core/workflows/execute-phase/steps/codebase-drift-gate.md": "file",
2113:         "gsd-core/workflows/execute-phase/steps/executor-isolation-dispatch.md": "file",
2114:         "gsd-core/workflows/execute-phase/steps/per-plan-worktree-gate.md": "file",
2115:         "gsd-core/workflows/execute-phase/steps/post-merge-gate.md": "file",
2116:         "gsd-core/workflows/execute-phase/steps/regression-gate.md": "file",
2117:         "gsd-core/workflows/execute-phase/steps/worktree-recovery-policy.md": "file",
2118:         "gsd-core/workflows/discuss-phase/modes": "dir",
2119:         "gsd-core/workflows/discuss-phase/templates": "dir",
2120:         "gsd-core/workflows/discuss-phase/templates/checkpoint.json": "file",
2121:         "gsd-core/workflows/discuss-phase/templates/context.md": "file",
2122:         "gsd-core/workflows/discuss-phase/templates/discussion-log.md": "file",
2123:         "gsd-core/workflows/discuss-phase/modes/advisor.md": "file",
2124:         "gsd-core/workflows/discuss-phase/modes/all.md": "file",
2125:         "gsd-core/workflows/discuss-phase/modes/analyze.md": "file",
2126:         "gsd-core/workflows/discuss-phase/modes/auto.md": "file",
2127:         "gsd-core/workflows/discuss-phase/modes/batch.md": "file",
2128:         "gsd-core/workflows/discuss-phase/modes/chain.md": "file",
2129:         "gsd-core/workflows/discuss-phase/modes/default.md": "file",
2130:         "gsd-core/workflows/discuss-phase/modes/power.md": "file",
2131:         "gsd-core/workflows/discuss-phase/modes/text.md": "file",
2132:         "gsd-core/templates/AI-SPEC.md": "file",
2133:         "gsd-core/templates/claude-md.md": "file",
2134:         "gsd-core/templates/codebase": "dir",
2135:         "gsd-core/templates/config.json": "file",
2136:         "gsd-core/templates/context.md": "file",
2137:         "gsd-core/templates/continue-here.md": "file",
2138:         "gsd-core/templates/copilot-instructions.md": "file",
2139:         "gsd-core/templates/debug-subagent-prompt.md": "file",
2140:         "gsd-core/templates/DEBUG.md": "file",
2141:         "gsd-core/templates/dev-preferences.md": "file",
2142:         "gsd-core/templates/discovery.md": "file",
2143:         "gsd-core/templates/discussion-log.md": "file",
2144:         "gsd-core/templates/milestone-archive.md": "file",
2145:         "gsd-core/templates/milestone.md": "file",
2146:         "gsd-core/templates/phase-prompt.md": "file",
2147:         "gsd-core/templates/planner-subagent-prompt.md": "file",
2148:         "gsd-core/templates/project.md": "file",
2149:         "gsd-core/templates/README.md": "file",
2150:         "gsd-core/templates/requirements.md": "file",
2151:         "gsd-core/templates/research-project": "dir",
2152:         "gsd-core/templates/research.md": "file",
2153:         "gsd-core/templates/retrospective.md": "file",
2154:         "gsd-core/templates/roadmap.md": "file",
2155:         "gsd-core/templates/SECURITY.md": "file",
2156:         "gsd-core/templates/spec.md": "file",
2157:         "gsd-core/templates/state.md": "file",
2158:         "gsd-core/templates/summary-complex.md": "file",
2159:         "gsd-core/templates/summary-minimal.md": "file",
2160:         "gsd-core/templates/summary-standard.md": "file",
2161:         "gsd-core/templates/summary.md": "file",
2162:         "gsd-core/templates/UAT.md": "file",
2163:         "gsd-core/templates/UI-SPEC.md": "file",
2164:         "gsd-core/templates/user-profile.md": "file",
2165:         "gsd-core/templates/user-setup.md": "file",
2166:         "gsd-core/templates/VALIDATION.md": "file",
2167:         "gsd-core/templates/verification-report.md": "file",
2168:         "gsd-core/templates/research-project/ARCHITECTURE.md": "file",
2169:         "gsd-core/templates/research-project/FEATURES.md": "file",
2170:         "gsd-core/templates/research-project/PITFALLS.md": "file",
2171:         "gsd-core/templates/research-project/STACK.md": "file",
2172:         "gsd-core/templates/research-project/SUMMARY.md": "file",
2173:         "gsd-core/templates/codebase/architecture.md": "file",
2174:         "gsd-core/templates/codebase/concerns.md": "file",
2175:         "gsd-core/templates/codebase/conventions.md": "file",
2176:         "gsd-core/templates/codebase/integrations.md": "file",
2177:         "gsd-core/templates/codebase/stack.md": "file",
2178:         "gsd-core/templates/codebase/structure.md": "file",
2179:         "gsd-core/templates/codebase/testing.md": "file",
2180:         "gsd-core/references/agent-contracts.md": "file",
2181:         "gsd-core/references/agent-skills-bootstrap.md": "file",
2182:         "gsd-core/references/ai-evals.md": "file",
2183:         "gsd-core/references/ai-frameworks.md": "file",
2184:         "gsd-core/references/api-coverage.md": "file",
2185:         "gsd-core/references/artifact-types.md": "file",
2186:         "gsd-core/references/autonomous-smart-discuss.md": "file",
2187:         "gsd-core/references/checkpoints.md": "file",
2188:         "gsd-core/references/common-bug-patterns.md": "file",
2189:         "gsd-core/references/context-budget.md": "file",
2190:         "gsd-core/references/continuation-format.md": "file",
2191:         "gsd-core/references/debugger-bug-taxonomy.md": "file",
2192:         "gsd-core/references/debugger-fix-acceptance.md": "file",
2193:         "gsd-core/references/debugger-philosophy.md": "file",
2194:         "gsd-core/references/debugger-prevention.md": "file",
2195:         "gsd-core/references/debugger-rca-branching.md": "file",
2196:         "gsd-core/references/debugger-repro-hardening.md": "file",
2197:         "gsd-core/references/debugger-sbfl.md": "file",
2198:         "gsd-core/references/debugger-semantic-recall.md": "file",
2199:         "gsd-core/references/decimal-phase-calculation.md": "file",
2200:         "gsd-core/references/doc-conflict-engine.md": "file",
2201:         "gsd-core/references/domain-probes.md": "file",
2202:         "gsd-core/references/edge-probe-fixtures": "dir",
2203:         "gsd-core/references/edge-probe.md": "file",
2204:         "gsd-core/references/execute-mvp-tdd.md": "file",
2205:         "gsd-core/references/execute-phase-between-wave-reset.md": "file",
2206:         "gsd-core/references/execute-phase-context-guard.md": "file",
2207:         "gsd-core/references/execute-phase-quota-recovery.md": "file",
2208:         "gsd-core/references/execute-phase-requirement-revert.md": "file",
2209:         "gsd-core/references/execute-phase-response-language.md": "file",
2210:         "gsd-core/references/execute-phase-wave-guard.md": "file",
2211:         "gsd-core/references/executor-examples.md": "file",
2212:         "gsd-core/references/few-shot-examples": "dir",
2213:         "gsd-core/references/gate-prompts.md": "file",
2214:         "gsd-core/references/gates.md": "file",
2215:         "gsd-core/references/git-integration.md": "file",
2216:         "gsd-core/references/git-planning-commit.md": "file",
2217:         "gsd-core/references/gsd-run-resolver.md": "file",
2218:         "gsd-core/references/honest-verifier.md": "file",
2219:         "gsd-core/references/ios-scaffold.md": "file",
2220:         "gsd-core/references/loop-hook-dispatch.md": "file",
2221:         "gsd-core/references/mandatory-initial-read.md": "file",
2222:         "gsd-core/references/model-profile-resolution.md": "file",
2223:         "gsd-core/references/model-profiles.md": "file",
2224:         "gsd-core/references/mvp-concepts.md": "file",
2225:         "gsd-core/references/offer-next.md": "file",
2226:         "gsd-core/references/phase-argument-parsing.md": "file",
2227:         "gsd-core/references/planner-antipatterns.md": "file",
2228:         "gsd-core/references/planner-chunked.md": "file",
2229:         "gsd-core/references/planner-gap-closure.md": "file",
2230:         "gsd-core/references/planner-graphify-auto-update.md": "file",
2231:         "gsd-core/references/planner-guidance.md": "file",
2232:         "gsd-core/references/planner-human-verify-mode.md": "file",
2233:         "gsd-core/references/planner-interface-context.md": "file",
2234:         "gsd-core/references/planner-load-graph-context.md": "file",
2235:         "gsd-core/references/planner-mvp-mode.md": "file",
2236:         "gsd-core/references/planner-preconditions.md": "file",
2237:         "gsd-core/references/planner-reversibility.md": "file",
2238:         "gsd-core/references/planner-reviews.md": "file",
2239:         "gsd-core/references/planner-revision.md": "file",
2240:         "gsd-core/references/planner-source-audit.md": "file",
2241:         "gsd-core/references/planning-config.md": "file",
2242:         "gsd-core/references/prohibition-probe-fixtures": "dir",
2243:         "gsd-core/references/prohibition-probe.md": "file",
2244:         "gsd-core/references/project-skills-discovery.md": "file",
2245:         "gsd-core/references/questioning.md": "file",
2246:         "gsd-core/references/research-documentation-lookup.md": "file",
2247:         "gsd-core/references/research-philosophy.md": "file",
2248:         "gsd-core/references/research-verification-protocol.md": "file",
2249:         "gsd-core/references/reviewer-instances.md": "file",
2250:         "gsd-core/references/revision-loop.md": "file",
2251:         "gsd-core/references/runtime-aware-dispatch.md": "file",
2252:         "gsd-core/references/scout-codebase.md": "file",
2253:         "gsd-core/references/security-asvs-levels.md": "file",
2254:         "gsd-core/references/skeleton-template.md": "file",
2255:         "gsd-core/references/sketch-interactivity.md": "file",
2256:         "gsd-core/references/sketch-theme-system.md": "file",
2257:         "gsd-core/references/sketch-tooling.md": "file",
2258:         "gsd-core/references/sketch-variant-patterns.md": "file",
2259:         "gsd-core/references/specless-probe-fallback.md": "file",
2260:         "gsd-core/references/spidr-splitting.md": "file",
2261:         "gsd-core/references/tdd.md": "file",
2262:         "gsd-core/references/thinking-models-debug.md": "file",
2263:         "gsd-core/references/thinking-models-execution.md": "file",
2264:         "gsd-core/references/thinking-models-planning.md": "file",
2265:         "gsd-core/references/thinking-models-research.md": "file",
2266:         "gsd-core/references/thinking-models-verification.md": "file",
2267:         "gsd-core/references/thinking-partner.md": "file",
2268:         "gsd-core/references/ui-brand.md": "file",
2269:         "gsd-core/references/ui-consideration-probe.md": "file",
2270:         "gsd-core/references/universal-anti-patterns.md": "file",
2271:         "gsd-core/references/untrusted-input-boundary.md": "file",
2272:         "gsd-core/references/user-profiling.md": "file",
2273:         "gsd-core/references/user-story-template.md": "file",
2274:         "gsd-core/references/verification-overrides.md": "file",
2275:         "gsd-core/references/verification-patterns.md": "file",
2276:         "gsd-core/references/verify-mvp-mode.md": "file",
2277:         "gsd-core/references/workstream-flag.md": "file",
2278:         "gsd-core/references/worktree-branch-check.md": "file",
2279:         "gsd-core/references/worktree-path-safety.md": "file",
2280:         "gsd-core/references/prohibition-probe-fixtures/01-streak-reminder": "dir",
2281:         "gsd-core/references/prohibition-probe-fixtures/02-clean-utility": "dir",
2282:         "gsd-core/references/prohibition-probe-fixtures/03-multi-prohibition": "dir",
2283:         "gsd-core/references/prohibition-probe-fixtures/03-multi-prohibition/expected.json": "file",
2284:         "gsd-core/references/prohibition-probe-fixtures/02-clean-utility/expected.json": "file",
2285:         "gsd-core/references/prohibition-probe-fixtures/01-streak-reminder/expected.json": "file",
2286:         "gsd-core/references/few-shot-examples/plan-checker.md": "file",
2287:         "gsd-core/references/few-shot-examples/verifier.md": "file",
2288:         "gsd-core/references/edge-probe-fixtures/01-round-half-even": "dir",
2289:         "gsd-core/references/edge-probe-fixtures/02-merge-intervals": "dir",
2290:         "gsd-core/references/edge-probe-fixtures/03-truncate-graphemes": "dir",
2291:         "gsd-core/references/edge-probe-fixtures/04-money-rounding": "dir",
2292:         "gsd-core/references/edge-probe-fixtures/05-list-dedupe": "dir",
2293:         "gsd-core/references/edge-probe-fixtures/06-resolved-mixed": "dir",
2294:         "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/expected-coverage.json": "file",
2295:         "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/requirements.json": "file",
2296:         "gsd-core/references/edge-probe-fixtures/06-resolved-mixed/resolutions.json": "file",
2297:         "gsd-core/references/edge-probe-fixtures/05-list-dedupe/expected-coverage.json": "file",
2298:         "gsd-core/references/edge-probe-fixtures/05-list-dedupe/requirements.json": "file",
2299:         "gsd-core/references/edge-probe-fixtures/04-money-rounding/expected-coverage.json": "file",
2300:         "gsd-core/references/edge-probe-fixtures/04-money-rounding/requirements.json": "file",
2301:         "gsd-core/references/edge-probe-fixtures/03-truncate-graphemes/expected-coverage.json": "file",
2302:         "gsd-core/references/edge-probe-fixtures/03-truncate-graphemes/requirements.json": "file",
2303:         "gsd-core/references/edge-probe-fixtures/02-merge-intervals/expected-coverage.json": "file",
2304:         "gsd-core/references/edge-probe-fixtures/02-merge-intervals/requirements.json": "file",
2305:         "gsd-core/references/edge-probe-fixtures/01-round-half-even/expected-coverage.json": "file",
2306:         "gsd-core/references/edge-probe-fixtures/01-round-half-even/requirements.json": "file",
2307:         "gsd-core/contexts/dev.md": "file",
2308:         "gsd-core/contexts/research.md": "file",
2309:         "gsd-core/contexts/review.md": "file",
2310:         "gsd-core/bin/check-latest-version.cjs": "file",
2311:         "gsd-core/bin/ensure-runtime-build.cjs": "file",
2312:         "gsd-core/bin/gsd-tools.cjs": "file",
2313:         "gsd-core/bin/gsd_run": "file",
2314:         "gsd-core/bin/lib": "dir",
2315:         "gsd-core/bin/shared": "dir",
2316:         "gsd-core/bin/verify-reapply-patches.cjs": "file",
2317:         "gsd-core/bin/shared/config-defaults.manifest.json": "file",
2318:         "gsd-core/bin/shared/config-schema.manifest.json": "file",
2319:         "gsd-core/bin/shared/model-catalog.json": "file",
2320:         "gsd-core/bin/shared/runtime-aliases.manifest.json": "file",
2321:         "gsd-core/bin/lib/active-workstream-store.cjs": "file",
2322:         "gsd-core/bin/lib/adapter-declarative.cjs": "file",
2323:         "gsd-core/bin/lib/adapter-imperative.cjs": "file",
2324:         "gsd-core/bin/lib/adr-parser.cjs": "file",
2325:         "gsd-core/bin/lib/agent-command-router.cjs": "file",
2326:         "gsd-core/bin/lib/agent-install-check.cjs": "file",
2327:         "gsd-core/bin/lib/api-coverage.cjs": "file",
2328:         "gsd-core/bin/lib/artifacts.cjs": "file",
2329:         "gsd-core/bin/lib/assumption-delta.cjs": "file",
2330:         "gsd-core/bin/lib/audit-command-router.cjs": "file",
2331:         "gsd-core/bin/lib/audit.cjs": "file",
2332:         "gsd-core/bin/lib/broken-windows.cjs": "file",
2333:         "gsd-core/bin/lib/capability-activation.cjs": "file",
2334:         "gsd-core/bin/lib/capability-command-router.cjs": "file",
2335:         "gsd-core/bin/lib/capability-consent.cjs": "file",
2336:         "gsd-core/bin/lib/capability-ledger.cjs": "file",
2337:         "gsd-core/bin/lib/capability-lifecycle.cjs": "file",
2338:         "gsd-core/bin/lib/capability-loader.cjs": "file",
2339:         "gsd-core/bin/lib/capability-lock.cjs": "file",
2340:         "gsd-core/bin/lib/capability-registry.cjs": "file",
2341:         "gsd-core/bin/lib/capability-source.cjs": "file",
2342:         "gsd-core/bin/lib/capability-state.cjs": "file",
2343:         "gsd-core/bin/lib/capability-trust.cjs": "file",
2344:         "gsd-core/bin/lib/capability-validator.cjs": "file",
2345:         "gsd-core/bin/lib/capability-writer.cjs": "file",
2346:         "gsd-core/bin/lib/check-command-router.cjs": "file",
2347:         "gsd-core/bin/lib/cjs-command-router-adapter.cjs": "file",
2348:         "gsd-core/bin/lib/claude-orchestration-command-router.cjs": "file",
2349:         "gsd-core/bin/lib/claude-orchestration.cjs": "file",
2350:         "gsd-core/bin/lib/cli-exit.cjs": "file",
2351:         "gsd-core/bin/lib/cli-skew-check.cjs": "file",
2352:         "gsd-core/bin/lib/clock.cjs": "file",
2353:         "gsd-core/bin/lib/clusters.cjs": "file",
2354:         "gsd-core/bin/lib/code-review-flags.cjs": "file",
2355:         "gsd-core/bin/lib/command-aliases.cjs": "file",
2356:         "gsd-core/bin/lib/command-arg-projection.cjs": "file",
2357:         "gsd-core/bin/lib/command-roster.cjs": "file",
2358:         "gsd-core/bin/lib/command-routing-hub.cjs": "file",
2359:         "gsd-core/bin/lib/commands.cjs": "file",
2360:         "gsd-core/bin/lib/config-loader.cjs": "file",
2361:         "gsd-core/bin/lib/config-schema.cjs": "file",
2362:         "gsd-core/bin/lib/config-types.cjs": "file",
2363:         "gsd-core/bin/lib/config.cjs": "file",
2364:         "gsd-core/bin/lib/configuration.cjs": "file",
2365:         "gsd-core/bin/lib/context-utilization.cjs": "file",
2366:         "gsd-core/bin/lib/core-utils.cjs": "file",
2367:         "gsd-core/bin/lib/coverage.cjs": "file",
2368:         "gsd-core/bin/lib/decisions.cjs": "file",
2369:         "gsd-core/bin/lib/docs.cjs": "file",
2370:         "gsd-core/bin/lib/drift.cjs": "file",
2371:         "gsd-core/bin/lib/edge-probe.cjs": "file",
2372:         "gsd-core/bin/lib/embedding-adapter.cjs": "file",
2373:         "gsd-core/bin/lib/estimate-cli.cjs": "file",
2374:         "gsd-core/bin/lib/eval-command-router.cjs": "file",
2375:         "gsd-core/bin/lib/eval.cjs": "file",
2376:         "gsd-core/bin/lib/external-descriptor-trust.cjs": "file",
2377:         "gsd-core/bin/lib/external-job.cjs": "file",
2378:         "gsd-core/bin/lib/fallow-runner.cjs": "file",
2379:         "gsd-core/bin/lib/federated-config.cjs": "file",
2380:         "gsd-core/bin/lib/fork-roadmap-persistence.cjs": "file",
2381:         "gsd-core/bin/lib/frontmatter.cjs": "file",
2382:         "gsd-core/bin/lib/gap-checker.cjs": "file",
2383:         "gsd-core/bin/lib/gate-predicate-evaluator.cjs": "file",
2384:         "gsd-core/bin/lib/git-base-branch.cjs": "file",
2385:         "gsd-core/bin/lib/graphify-command-router.cjs": "file",
2386:         "gsd-core/bin/lib/graphify.cjs": "file",
2387:         "gsd-core/bin/lib/gsd2-import.cjs": "file",
2388:         "gsd-core/bin/lib/handshake-serialized.cjs": "file",
2389:         "gsd-core/bin/lib/hook-bus.cjs": "file",
2390:         "gsd-core/bin/lib/host-integration-adapters": "dir",
2391:         "gsd-core/bin/lib/host-integration-sdk.cjs": "file",
2392:         "gsd-core/bin/lib/host-integration.cjs": "file",
2393:         "gsd-core/bin/lib/init-command-router.cjs": "file",
2394:         "gsd-core/bin/lib/init.cjs": "file",
2395:         "gsd-core/bin/lib/install-effort-resolver.cjs": "file",
2396:         "gsd-core/bin/lib/install-engine.cjs": "file",
2397:         "gsd-core/bin/lib/install-profiles.cjs": "file",
2398:         "gsd-core/bin/lib/installer-migration-authoring.cjs": "file",
2399:         "gsd-core/bin/lib/installer-migration-report.cjs": "file",
2400:         "gsd-core/bin/lib/installer-migrations": "dir",
2401:         "gsd-core/bin/lib/installer-migrations.cjs": "file",
2402:         "gsd-core/bin/lib/intel-command-router.cjs": "file",
2403:         "gsd-core/bin/lib/intel.cjs": "file",
2404:         "gsd-core/bin/lib/io.cjs": "file",
2405:         "gsd-core/bin/lib/learnings.cjs": "file",
2406:         "gsd-core/bin/lib/legacy-cleanup.cjs": "file",
2407:         "gsd-core/bin/lib/loop-host-contract.cjs": "file",
2408:         "gsd-core/bin/lib/loop-resolver.cjs": "file",
2409:         "gsd-core/bin/lib/markdown-sectionizer.cjs": "file",
2410:         "gsd-core/bin/lib/markdown-table.cjs": "file",
2411:         "gsd-core/bin/lib/mcp-server.cjs": "file",
2412:         "gsd-core/bin/lib/milestone.cjs": "file",
2413:         "gsd-core/bin/lib/model-adapter.cjs": "file",
2414:         "gsd-core/bin/lib/model-catalog.cjs": "file",
2415:         "gsd-core/bin/lib/model-profiles.cjs": "file",
2416:         "gsd-core/bin/lib/model-resolver.cjs": "file",
2417:         "gsd-core/bin/lib/normalize-test-command.cjs": "file",
2418:         "gsd-core/bin/lib/observability": "dir",
2419:         "gsd-core/bin/lib/onboard-projection.cjs": "file",
2420:         "gsd-core/bin/lib/package-identity.cjs": "file",
2421:         "gsd-core/bin/lib/package-legitimacy.cjs": "file",
2422:         "gsd-core/bin/lib/phase-command-router.cjs": "file",
2423:         "gsd-core/bin/lib/phase-estimation.cjs": "file",
2424:         "gsd-core/bin/lib/phase-id.cjs": "file",
2425:         "gsd-core/bin/lib/phase-lifecycle.cjs": "file",
2426:         "gsd-core/bin/lib/phase-locator.cjs": "file",
2427:         "gsd-core/bin/lib/phase.cjs": "file",
2428:         "gsd-core/bin/lib/phases-command-router.cjs": "file",
2429:         "gsd-core/bin/lib/plan-drift-guard.cjs": "file",
2430:         "gsd-core/bin/lib/plan-scan.cjs": "file",
2431:         "gsd-core/bin/lib/planning-workspace.cjs": "file",
2432:         "gsd-core/bin/lib/probe-core.cjs": "file",
2433:         "gsd-core/bin/lib/profile-output.cjs": "file",
2434:         "gsd-core/bin/lib/profile-pipeline-command-router.cjs": "file",
2435:         "gsd-core/bin/lib/profile-pipeline.cjs": "file",
2436:         "gsd-core/bin/lib/prohibition-enforcement.cjs": "file",
2437:         "gsd-core/bin/lib/project-root.cjs": "file",
2438:         "gsd-core/bin/lib/prompt-budget.cjs": "file",
2439:         "gsd-core/bin/lib/research-provider.cjs": "file",
2440:         "gsd-core/bin/lib/research-store.cjs": "file",
2441:         "gsd-core/bin/lib/resolution.cjs": "file",
2442:         "gsd-core/bin/lib/review-lane-descriptor.cjs": "file",
2443:         "gsd-core/bin/lib/review-lane-invocation.cjs": "file",
2444:         "gsd-core/bin/lib/review-lane-runner.cjs": "file",
2445:         "gsd-core/bin/lib/review-reviewer-selection.cjs": "file",
2446:         "gsd-core/bin/lib/roadmap-command-router.cjs": "file",
2447:         "gsd-core/bin/lib/roadmap-parser.cjs": "file",
2448:         "gsd-core/bin/lib/roadmap-upgrade.cjs": "file",
2449:         "gsd-core/bin/lib/roadmap.cjs": "file",
2450:         "gsd-core/bin/lib/runtime-artifact-conversion.cjs": "file",
2451:         "gsd-core/bin/lib/runtime-artifact-install-plan.cjs": "file",
2452:         "gsd-core/bin/lib/runtime-artifact-layout.cjs": "file",
2453:         "gsd-core/bin/lib/runtime-config-adapter-registry.cjs": "file",
2454:         "gsd-core/bin/lib/runtime-homes.cjs": "file",
2455:         "gsd-core/bin/lib/runtime-hooks-surface.cjs": "file",
2456:         "gsd-core/bin/lib/runtime-name-policy.cjs": "file",
2457:         "gsd-core/bin/lib/runtime-slash.cjs": "file",
2458:         "gsd-core/bin/lib/schema-detect.cjs": "file",
2459:         "gsd-core/bin/lib/secrets.cjs": "file",
2460:         "gsd-core/bin/lib/security.cjs": "file",
2461:         "gsd-core/bin/lib/semver-compare.cjs": "file",
2462:         "gsd-core/bin/lib/shell-command-projection.cjs": "file",
2463:         "gsd-core/bin/lib/smart-entry.cjs": "file",
2464:         "gsd-core/bin/lib/spec-section.cjs": "file",
2465:         "gsd-core/bin/lib/stale-bake-guard.cjs": "file",
2466:         "gsd-core/bin/lib/state-command-router.cjs": "file",
2467:         "gsd-core/bin/lib/state-document.cjs": "file",
2468:         "gsd-core/bin/lib/state-io.cjs": "file",
2469:         "gsd-core/bin/lib/state-transition.cjs": "file",
2470:         "gsd-core/bin/lib/state.cjs": "file",
2471:         "gsd-core/bin/lib/surface.cjs": "file",
2472:         "gsd-core/bin/lib/task-command-router.cjs": "file",
2473:         "gsd-core/bin/lib/teams-status.cjs": "file",
2474:         "gsd-core/bin/lib/template.cjs": "file",
2475:         "gsd-core/bin/lib/uat-predicate.cjs": "file",
2476:         "gsd-core/bin/lib/uat.cjs": "file",
2477:         "gsd-core/bin/lib/ui-consideration-probe.cjs": "file",
2478:         "gsd-core/bin/lib/ui-safety-gate.cjs": "file",
2479:         "gsd-core/bin/lib/unusable-input.cjs": "file",
2480:         "gsd-core/bin/lib/update-context.cjs": "file",
2481:         "gsd-core/bin/lib/validate-command-router.cjs": "file",
2482:         "gsd-core/bin/lib/validate.cjs": "file",
2483:         "gsd-core/bin/lib/verification-command-router.cjs": "file",
2484:         "gsd-core/bin/lib/verification.cjs": "file",
2485:         "gsd-core/bin/lib/verify-command-router.cjs": "file",
2486:         "gsd-core/bin/lib/verify.cjs": "file",
2487:         "gsd-core/bin/lib/workstream-inventory-builder.cjs": "file",
2488:         "gsd-core/bin/lib/workstream-inventory.cjs": "file",
2489:         "gsd-core/bin/lib/workstream-name-policy.cjs": "file",
2490:         "gsd-core/bin/lib/workstream.cjs": "file",
2491:         "gsd-core/bin/lib/worktree-base-ref.cjs": "file",
2492:         "gsd-core/bin/lib/worktree-safety.cjs": "file",
2493:         "gsd-core/bin/lib/write-set.cjs": "file",
2494:         "gsd-core/bin/lib/observability/event.cjs": "file",
2495:         "gsd-core/bin/lib/observability/logger.cjs": "file",
2496:         "gsd-core/bin/lib/observability/redaction.cjs": "file",
2497:         "gsd-core/bin/lib/installer-migrations/000-first-time-baseline.cjs": "file",
2498:         "gsd-core/bin/lib/installer-migrations/001-legacy-orphan-files.cjs": "file",
2499:         "gsd-core/bin/lib/installer-migrations/002-codex-legacy-hooks-json.cjs": "file",
2500:         "gsd-core/bin/lib/installer-migrations/003-rename-get-shit-done-to-gsd-core.cjs": "file",
2501:         "gsd-core/bin/lib/installer-migrations/004-prune-stale-pristine-snapshots.cjs": "file",
2502:         "gsd-core/bin/lib/installer-migrations/005-opencode-baseline-commands-dir.cjs": "file",
2503:         "gsd-core/bin/lib/installer-migrations/006-pi-extension-cjs-to-js.cjs": "file",
2504:         "gsd-core/bin/lib/host-integration-adapters/cline-sdk-binding.cjs": "file",
2505:         "gsd-core/bin/lib/host-integration-adapters/imperative-hook-bus.cjs": "file",
2506:         "agents/general-purpose.md": "file",
2507:         "agents/gsd-advisor-researcher.md": "file",
2508:         "agents/gsd-ai-researcher.md": "file",
2509:         "agents/gsd-assumptions-analyzer.md": "file",
2510:         "agents/gsd-code-fixer.md": "file",
2511:         "agents/gsd-code-reviewer.md": "file",
2512:         "agents/gsd-codebase-mapper.md": "file",
2513:         "agents/gsd-debug-session-manager.md": "file",
2514:         "agents/gsd-debugger.md": "file",
2515:         "agents/gsd-doc-classifier.md": "file",
2516:         "agents/gsd-doc-synthesizer.md": "file",
2517:         "agents/gsd-doc-verifier.md": "file",
2518:         "agents/gsd-doc-writer.md": "file",
2519:         "agents/gsd-domain-researcher.md": "file",
2520:         "agents/gsd-eval-auditor.md": "file",
2521:         "agents/gsd-eval-planner.md": "file",
2522:         "agents/gsd-executor.md": "file",
2523:         "agents/gsd-framework-selector.md": "file",
2524:         "agents/gsd-integration-checker.md": "file",
2525:         "agents/gsd-intel-updater.md": "file",
2526:         "agents/gsd-mempalace-curator.md": "file",
2527:         "agents/gsd-nyquist-auditor.md": "file",
2528:         "agents/gsd-oversight-execution.md": "file",
2529:         "agents/gsd-oversight-planning.md": "file",
2530:         "agents/gsd-oversight-sync.md": "file",
2531:         "agents/gsd-oversight-verification.md": "file",
2532:         "agents/gsd-pattern-mapper.md": "file",
2533:         "agents/gsd-phase-researcher.md": "file",
2534:         "agents/gsd-plan-checker.md": "file",
2535:         "agents/gsd-planner.md": "file",
2536:         "agents/gsd-project-researcher.md": "file",
2537:         "agents/gsd-research-synthesizer.md": "file",
2538:         "agents/gsd-roadmapper.md": "file",
2539:         "agents/gsd-security-auditor.md": "file",
2540:         "agents/gsd-ui-auditor.md": "file",
2541:         "agents/gsd-ui-checker.md": "file",
2542:         "agents/gsd-ui-researcher.md": "file",
2543:         "agents/gsd-user-profiler.md": "file",
2544:         "agents/gsd-verifier.md": "file"
2545:       }
2546:     },
2547:     "upgrade": {
2548:       "edited": "agents/general-purpose.md",
2549:       "removed": "scripts/lib/cli-exit.cjs"
2550:     }
2551:   },
2552:   "sourceHashes": {
2553:     "bin/install.js": "78ba71870597700880c1dcd5c1ebb093cec790fd5393ac06507334c1160b0bb3",
2554:     "dist/bin/install.js": "e6f691da2bdb777c7cd8b7a75b56b5626acbd77e1949d9ece0373d69b990164d",
2555:     "tests/acceptance/installer-recovery.cjs": "444a786ec8312b43560ca889c671c3867390d018e47e68e4f657d07cfcf95d58"
2556:   },
2557:   "twin": {
2558:     "residueEntries": 742,
2559:     "changed": [],
2560:     "tracedFiles": 554
2561:   },
2562:   "fresh": {
2563:     "status": 1,
2564:     "traceCount": 634,
2565:     "outcomeLines": [
2566:       "Rollback applied"
2567:     ],
2568:     "topLevelCount": 10
2569:   },
2570:   "upgrade": {
2571:     "edited": "agents/general-purpose.md",
2572:     "removed": "scripts/lib/cli-exit.cjs",
2573:     "status": 1,
2574:     "traceCount": 744,
2575:     "outcomeLines": [
2576:       "Rollback applied"
2577:     ]
2578:   },
2579:   "failure": "fresh:outcome-exact, fresh:top-level-exact-allowlist, fresh:transaction-directory-shape, fresh:quarantine-path-printed, fresh:new-equals-twin-residue, fresh:moved-txt-lists-every-file, upgrade:outcome-exact, upgrade:tree-deep-equal-outside-allowlist, upgrade:transaction-directory-shape, upgrade:quarantine-path-printed, upgrade:removed-file-quarantined-as-new, upgrade:edited-file-displaced, upgrade:moved-txt-lists-every-file",
2580:   "fixtureRemoved": true
2581: }

## eslint.config.js SHA256 31144e122626b61b510e698943e8ae8cf49dd5ba99339137d084fd553308ed75
1: const security = require('eslint-plugin-security');
2: 
3: module.exports = [
4:   {
5:     // `.claude/**` holds per-machine harness state, including `.claude/worktrees/<name>/`
6:     // checkouts of this same repository. Linting those re-lints a whole second copy of the
7:     // tree (and any stale copy's violations), which is why `bun run lint` could exit 1 on an
8:     // otherwise clean tree. CI never has them; every local session does.
9:     ignores: [
10:       'node_modules/**',
11:       '.upstream/**',
12:       'dist/**',
13:       'hooks/dist/**',
14:       'assets/.backup/**',
15:       '.claude/**'
16:     ]
17:   },
18:   {
19:     files: ['**/*.js', 'scripts/expect-red.cjs', 'tests/acceptance/installer-recovery.cjs'],
20:     plugins: {
21:       security
22:     },
23:     languageOptions: {
24:       ecmaVersion: 2022,
25:       sourceType: 'commonjs',
26:       globals: {
27:         require: 'readonly',
28:         module: 'readonly',
29:         exports: 'readonly',
30:         __dirname: 'readonly',
31:         __filename: 'readonly',
32:         process: 'readonly',
33:         console: 'readonly',
34:         Buffer: 'readonly',
35:         setTimeout: 'readonly',
36:         clearTimeout: 'readonly',
37:         setInterval: 'readonly',
38:         clearInterval: 'readonly'
39:       }
40:     },
41:     rules: {
42:       // Security rules - errors
43:       'security/detect-child-process': 'error',
44:       'security/detect-eval-with-expression': 'error',
45:       'security/detect-no-csrf-before-method-override': 'error',
46:       'security/detect-possible-timing-attacks': 'error',
47: 
48:       // Security rules - warnings (may have false positives)
49:       'security/detect-non-literal-fs-filename': 'warn',
50:       'security/detect-non-literal-regexp': 'warn',
51:       'security/detect-non-literal-require': 'warn',
52:       'security/detect-object-injection': 'warn',
53:       'security/detect-unsafe-regex': 'warn'
54:     }
55:   },
56:   {
57:     files: ['tests/**/*.js', 'tests/acceptance/installer-recovery.cjs'],
58:     languageOptions: {
59:       globals: {
60:         describe: 'readonly',
61:         it: 'readonly',
62:         test: 'readonly',
63:         expect: 'readonly',
64:         beforeAll: 'readonly',
65:         beforeEach: 'readonly',
66:         afterAll: 'readonly',
67:         afterEach: 'readonly',
68:         jest: 'readonly',
69:         mock: 'readonly'
70:       }
71:     },
72:     rules: {
73:       // Test fixtures intentionally use dynamic paths, subprocesses, and object
74:       // probes. Production JavaScript above keeps eslint-plugin-security active.
75:       'security/detect-non-literal-fs-filename': 'off',
76:       'security/detect-non-literal-require': 'off',
77:       'security/detect-child-process': 'off',
78:       'security/detect-object-injection': 'off'
79:     }
80:   }
81: ];
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

Previous reviewer findings, historical source; evaluate repairs against current bytes above:
# Final review — P04/P05 validator implementation

**Verdict: PASS WITH CHANGES**

This is a read-only critique of the three supplied source blobs. I executed nothing and inspected no disk. `tests/fixtures/expect-red/*` (`installer-recovery-structured-red.json`, `install-transaction-render-red.tap.txt`, `install-transaction-known-red.tap.txt`, `install-transaction-render-coverage.json`) were **not** in the packet; every claim below that depends on their exact bytes is marked as such.

The core of the amendment landed correctly. Specifically, I confirm code-locally:

- The reviewed inventory is exactly 25 identities (`expect-red.cjs:95-105`: 12 required-PASS, 13 required-FAIL), and cardinality is genuinely closed — `unreviewed check` (`:235`) plus `duplicate check` (`:234`) plus the two presence loops (`:252-259`) together admit exactly 25 distinct rows, no more, no fewer.
- The H1 information-loss problem is actually closed for the **upgrade** scenario, and closed well. `upgrade:tree-deep-equal-outside-allowlist` pins the observation to `{missing: [], unexpected: [], changed: ['gsd-install-state.json']}` (`:161-162`) against a `before` snapshot taken *after* the owner edit and the deletion (`installer-recovery.cjs:327-332`). That single pinned delta mathematically implies the edited file's bytes survived, nothing vanished, and the intentionally removed entry did not reappear — so `upgrade:owner-bytes-preserved` is corroborated by machine evidence, not merely asserted. That is the strongest part of this change.
- Cross-field binding is real, not decorative: `missing` must equal `Object.keys(context.twin.residue).sort()` (`:160`), `entry-type.path` must equal `context.upgrade.removed` (`:164`), and `moved-list.expected` is derived from the context rather than from the failed row (`:167-173`).
- Human `detail` is provably non-load-bearing: `expect-red.test.js:198-201` rewrites every failing diagnostic and still requires `[]`.
- Malformed termination markers fail closed — `run.error !== undefined` catches `false/0/''/null`, and `signal !== undefined && !== null` catches `false/0/''` (`:185`, `:368`).
- `Object.hasOwn(KNOWN_REDS, args[0])` (`:431`) is prototype-pollution-safe, and `main(['constructor'])` is tested (`test.js:829`).

The changes below are what stands between this and PASS.

---

## Confirmed code-local findings

### F1 — HIGH. Whole classes of additional damage are observed by nothing, in either scenario

`installer-recovery.cjs:154-169` points `HOME`, `USERPROFILE`, `GSD_HOME`, `CODEX_HOME`, `XDG_CONFIG_HOME` into the disposable home, but **every snapshot in the file is rooted at `fixture.target` only** (`snapshotTree(fixture.target)` at `:290, :332, :352, :360`; `readdirSync(fixture.target)` at `:291`). Nothing ever observes `fixture.home` outside `target`. A regression in which the failed install or its rollback writes into, truncates, or deletes `~/.gsd`, `~/.codex`, or `~/.config` produces an identical 25-row report with an identical failure inventory and identical pinned observations, and `judgeInstallerRecovery` returns `[]`.

Second blind spot, narrower: the **fresh** scenario has no tree-delta at all. Its only target observations are the 10-name top-level constant (`expect-red.cjs:151-154`) and the two owner files (`installer-recovery.cjs:296-300`). Nested damage inside the fresh target is invisible. That is defensible *today* only because `createFixture` seeds exactly two top-level owner files (`:104-110`) — it is an accident of the fixture, not a property the gate enforces.

Third, narrower still: `outcome-exact` filters to `line.startsWith('Rollback ')` (`:209`). Any other false claim the wrapper prints — a bogus quarantine reference, a "committed" line — is never observed.

Reproducer (not executed): seed a file at `fixture.home/.gsd/config.json` in `createFixture`, delete it from the wrapper's rollback path, re-capture. Every check keeps its current status and every pinned observation is unchanged; the judge accepts.

Minimal repair: add an always-required-PASS `home-outside-target-unchanged` row carrying a `tree-delta` observation over `snapshotTree(fixture.home)` minus the `target` subtree, captured before the wrapper run and compared after. **This changes the inventory to 26 checks and therefore returns to the owner** under §12's "Subsequent review changes affecting shapes or promised behavior return to the owner before dependent tests." I am reporting it, not authorizing it.

### F2 — HIGH. The amendment's own fail-closed guard has zero execution proof

`record()` at `installer-recovery.cjs:42-45` is the mechanism that prevents "an invented empty/absent observation":

```js
if (!evidence || error.code !== 'ERR_ASSERTION') {
  evidence = { kind: 'observation-error', actual: { code: error.code || null, message: String(error.message) } };
}
```

Trace every failing row in the current RED: `outcome-exact` (`:210`), `top-level-exact-allowlist` (`:293`), `transaction-directory-shape` (`:233`), `quarantine-path-printed` (`:260`), both `tree-delta` rows (`:98`), `entry-type` (`:364`), `displaced-paths` (`:368`), both `moved-list` rows (`:270`) all call `observe` first and then fail with `ERR_ASSERTION`. Every passing row calls `observe` never. **So neither disjunct of line 42 is ever taken, and neither is the truthy branch of `evidence || {kind:'assertion-pass'}` at `:40`.** The `observation-error` construction added by §16 is dead code in the only capture that exists.

This is exactly where the reported 86.86% branch figure lives, and it is why that figure is materially worse than the raw number suggests: the missing branches are not incidental, they include the new guard and the entire post-GREEN quarantine-reading region (`:237-257`, `:248-255`, plus the ENOENT-rethrow at `:232`).

The **validator** side is covered — `test.js:183` forces `kind = 'observation-error'` on all 25 rows and requires rejection. What is unproven is that the harness *emits* it rather than silently recording a clean absent observation.

Minimal repair, in scope: a spawned control that preloads a `--require` shim making `fs.readdirSync` throw `EACCES` once on the fresh target, then asserts the emitted report contains an `observation-error` row with `{code: 'EACCES', message}` **and** that `judgeInstallerRecovery` rejects it. Note that `installer-recovery.cjs` cannot be unit-tested in-process: `:15-18` and the top-level `try/finally` at `:374-401` run on require, so `record` is not reachable without a subprocess or a restructure that §16 forbids.

### F3 — MEDIUM. A cleanup failure suppresses the entire report

`installer-recovery.cjs:394-401`:

```js
} finally {
  if (!report.accepted) process.exitCode = 1;
  assert.equal(path.dirname(path.resolve(scratch)), path.resolve(scratchParent));
  assert.ok(path.basename(scratch).startsWith('installer-recovery-'));
  fs.rmSync(scratch, { recursive: true, force: true });
  report.fixtureRemoved = !fs.existsSync(scratch);
  process.stdout.write(JSON.stringify(report, null, 2) + os.EOL);
}
```

`force: true` swallows ENOENT but **not** EBUSY/EPERM. On win32 — the only platform this change has ever been measured on — a lingering handle from the installer child or an AV scanner makes `rmSync` throw, the throw escapes the `finally`, and `process.stdout.write` at `:401` never runs. The validator then sees empty stdout and reports `no JSON report on stdout: …` (`expect-red.cjs:192`). It fails closed, but the diagnostic is wrong and, worse, the scratch tree of disposable homes is leaked with **nothing naming its path** — the opposite of the retain-and-name discipline §16 required of the runner.

Minimal repair: wrap `:399` in `try/catch`, set `report.fixtureRemoved = false` and `report.cleanupError = String(error.message)`, and always reach `:401`. The judge already rejects `fixtureRemoved !== true` (`expect-red.cjs:201`), so this is purely a diagnostics-and-leak fix with no acceptance change.

Credit where due: `process.exitCode` rather than `process.exit()` at `:395` is correct — it lets the async pipe write at `:401` drain. That was not an accident worth losing.

### F4 — MEDIUM. `captureRecovery` will start failing on report size

`test.js:56-58`:

```js
const run = spawnSync('node', ['tests/acceptance/installer-recovery.cjs'], {
  cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 180000,
});
```

No `maxBuffer` — Node's default is 1 MiB. Compare `expect-red.cjs:504`, which correctly sets `64 * 1024 * 1024`. The report is `JSON.stringify(report, null, 2)` carrying `new-equals-twin-residue.actual.missing` (every residue path), `moved-list.actual.expected` (the file subset, again), and `top-level-names` — with 2-space indentation, that is on the order of a few hundred KB for a tree of a couple thousand files. It is under 1 MiB today (the packet's earlier Bun run passed) and grows monotonically with the installed tree. When it crosses, `run.error` becomes `ENOBUFS`, stdout is truncated, and `expect(run.error).toBeUndefined()` at `:59` fails — or `JSON.parse` at `:61` throws first. That failure will read as flakiness, not as a size limit.

Minimal repair: add `maxBuffer: 64 * 1024 * 1024` to `test.js:57`, matching the runner.

### F5 — MEDIUM. The NODE_OPTIONS guard admits preload and loader flags

`expect-red.cjs:440`:

```js
if (/(?:^|\s|["'])--(?:experimental-)?test(?:[-=\s]|$)/.test(process.env.NODE_OPTIONS || ''))
```

`main` copies the full parent environment at `:487` and deletes only `NODE_TEST_CONTEXT` and `NODE_V8_COVERAGE`. `NODE_OPTIONS` is forwarded intact. The guard rejects test-runner flags but not `--require`, `--import`, `--experimental-loader`, `--conditions`, or `--enable-source-maps` — any of which is inherited by c8, by the test child, and by the acceptance harness process. An inherited `--require ./instrument.js` can rewrite what the coverage child reports. This is not a hostile-attestation concern (correctly out of scope per §12); it is the same *ordinary contamination* class the existing guard was written for, and it is the larger half of that class.

Note the harness protects only its own grandchildren: `installer-recovery.cjs:161` deletes `NODE_OPTIONS` before spawning the installer, and `:162` sets it deliberately for injection. The harness process itself inherits whatever the runner passed.

Minimal repair: at `:440`, refuse any `NODE_OPTIONS` matching `--(require|import|loader|experimental-loader|conditions)\b` in addition to the test flags, and delete `NODE_OPTIONS` from `env` at `:487-489` for the coverage gate (the recovery harness sets its own).

### F6 — MEDIUM. No floor on the twin oracle; a degenerate oracle is self-consistent

`validRecoveryContext` (`:123-141`) requires only that `twin.residue` is non-empty and contains at least one `'file'`. The judge then derives its expected `tree-delta.missing` **from that same self-reported map** (`:160`) and `moved-list.expected` from it too (`:170`). The harness's own floor is `assert.ok(Object.keys(residue).length > 0)` (`installer-recovery.cjs:202`).

Consequence: if the injection starts firing earlier — say the child fails before `fs.cpSync` places the bulk directories — residue collapses to one entry, `missing` collapses to match it, `moved-list.expected` collapses, every pinned observation stays internally consistent, and `judgeInstallerRecovery` returns `[]`. The oracle silently weakens and the gate reports the known red.

The only floor anywhere is `expect(delta.missing.length).toBeGreaterThan(6)` at `test.js:89` — in a live-capture test, not in the validator that CI actually gates on.

Minimal repair, no inventory change: promote a reviewed floor into validator constants — require that `Object.keys(context.twin.residue)` contains the eight reviewed residue top-level names already hardcoded at `:151-154` (`.gsd-source`, `agents`, `gsd-core`, `gsd-migration-journal`, `hooks`, `package.json`, `scripts`, `skills`), rather than trusting an arbitrary non-empty map.

### F7 — MEDIUM-LOW. The real abort path loses its diagnostic, and no test reproduces that shape

`expect-red.cjs:220` early-returns on invalid context, before the per-check loop. But `report.context.twin` is assigned at `installer-recovery.cjs:191`, *after* the `twin:child-failed-at-injection` harness check at `:184`, and `report.context.upgrade` at `:331`, *after* two upgrade harness checks. So when a scenario genuinely aborts, `guarded` (`:379-386`) skips it, `context` stays `{}` (`:31`), and the judge emits `invalid independent recovery context` instead of the actionable `harness check did not pass: twin:child-failed-at-injection`.

The tests never see this. `test.js:247-252` builds the missing-harness-check case by *filtering a complete fixture*, which leaves `context` intact and reaches `:246`. So `expect(...).toContain('harness check did not pass: …')` asserts a code path the real harness cannot produce on abort. It still fails closed — just with the wrong message, and with a control that proves less than it appears to.

Reproducer (not executed): remove or corrupt `dist/bin/install.js` so the twin child fails before reaching the injection; the report carries the failed twin harness row, and the judge returns the context message rather than the harness message.

Minimal repair: at `:220`, accumulate the context problem into `problems` instead of returning, and guard `recoveryObservation` (`:145` dereferences `context.twin.residue` unguarded — that dereference is the reason the early return exists) so a missing context yields a sentinel that can never deep-equal any supplied evidence. Then add a test that constructs a report with a failed harness row *and* `context: {}`.

### F8 — MEDIUM-LOW. `fresh:owner-bytes-preserved` is an uncorroborated boolean; `upgrade` is not

`recoveryObservation` returns `{kind: 'assertion-pass', actual: {}}` for all 12 required-PASS rows before it ever consults `check.id` (`:144`). §16 explicitly permits this, so it is **not a contract violation** and I am not reopening it. The asymmetry is worth stating anyway, because it is invisible from the contract: `upgrade:owner-bytes-preserved` is fully corroborated by the pinned `tree-delta` (see the opening summary), while `fresh:owner-bytes-preserved` has no corroborating machine observation anywhere — `top-level-names` pins names, never bytes. If the harness's own comparison at `installer-recovery.cjs:296-300` were weakened, the fresh row degrades to a bare self-report and the validator has no second signal.

Minimal repair, no inventory change: have the fresh owner row `observe('owner-digests', {'owner.txt': <sha256>, 'settings.json': <sha256>})` and pin both digests as reviewed constants in the validator (they are fixed by `OWNER_FILES` at `installer-recovery.cjs:24-27`). This changes an observation shape, so per §12 it returns to the owner first.

### F9 — LOW. Inverted timeouts in the live CLI test leak a scratch directory

`test.js:493-495` spawns the real runner with `timeout: 90000`, while `expect-red.cjs:505` gives the *inner* child `timeout: 300000`. On a slow or contended machine the outer kill fires first; the runner never reaches its `finally` at `:524`, and `.claude/expect-red-*` is left behind with no sweep — unlike the fault test at `test.js:636-641`, which does clean up its recorded path.

Minimal repair: raise the outer timeout above 300 s (or make the inner timeout injectable via `dependencies`) and add a `finally` that removes leftover `.claude/expect-red-*` created during the test, prefix- and parent-guarded exactly as `expect-red.cjs:530-533` does.

### F10 — LOW. The two live tests do not pin the Node binary

`test.js:56` and `test.js:493` both spawn the bare string `'node'`, resolved through `PATH`. Under Bun that is deliberate, but it means the live evidence is not attributable to a specific runtime — which is precisely the binding §16 added `runtime.execPath` and the `host` argument to establish. The production runner does this correctly (`expect-red.cjs:503` uses `runtime.execPath`, and `:500` substitutes it for c8's child `node`, tested at `test.js:768-778`).

Minimal repair: assert the runner's emitted `expect-red evidence:` line reports the expected Node version, or resolve an explicit interpreter path.

### F11 — LOW. Two small holes in `recoveryObservation`

- `:174-175` returns `undefined` for an unknown `id`. A forged row `{scenario:'fresh', id:'unreviewed', kind:'acceptance', ok:true}` with **no** `evidence` field satisfies `isDeepStrictEqual(undefined, undefined)` at `:238`, so the observation gate is entirely vacuous for unknown ids and only `expectedKeys` (`:235`) rejects it. That single point of failure is precisely what decision control #2 (`test.js:376`) demonstrates. Repair: return a unique non-equal sentinel instead of `undefined`.
- `:144` ignores `check.ok`. A required-PASS row with `ok: false` still carrying `assertion-pass` evidence passes the observation gate — demonstrated by decision control #6 (`test.js:382-385`). The real harness never emits that shape (F2 explains why: a failing row without `observe` becomes `observation-error`), and `:258` rejects it anyway, so this costs only defense in depth. Repair: for a required-PASS key with `ok !== true`, expect the sentinel.

### F12 — LOW / test quality

- `test.js:118` and `:166` index `report.checks[0]` and `[4]` positionally and assert only `.length > 0`. If the harness reorders checks, both mutations land on different rows and still produce *some* problem — the tests pass for a different reason than their names claim.
- Several coverage negatives use `String.replace` with a literal that must exist in an unsupplied fixture (`"  type: 'test'"` at `:357`, `'  duration_ms:'` at `:453`, `'# Subtest: names:'` at `:354`). A non-matching literal makes `replace` a no-op. For the `.length > 0` cases that fails loudly (the unmodified fixture is accepted), which is fine — but `:453-454` expects `[]`, so a no-op there degrades silently into a tautology. Guard it the way `:422` guards `FIRST_REASON`.
- `test.js:273` hardcodes `projectRoot: 'C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign'`. It is portable (all path math runs through `path.win32` regardless of host, so it passes on Linux CI), but it bakes a worktree name into a committed test that must be regenerated in lockstep with the coverage fixture.

---

## Direct answers

**Q1 — Can any additional regression still pass either judge while the reviewed signature remains?** Yes, three classes, all code-local: (a) any damage outside `fixture.target` — the four redirected home directories are never observed (F1); (b) nested damage in the **fresh** target beyond the two owner files and the 10 top-level names (F1); (c) a silently weakened twin oracle, because the judge derives its expected deltas from the same self-reported residue map it is checking (F6). Path identity and TAP framing are, by contrast, tight: coverage requires both absolute rows under `projectRoot` with per-platform normalization, rejects non-canonical spellings before normalization can launder a `..` alias (`:324`), and rejects duplicate identities (`:329`); TAP pins every case number, name, result, the eight terminal counts, and forbids TAP tokens or unstructured text after the summary (`:301-304`).

**Q2 — Are source binding, package-byte parsing, command policy, private config, reports and termination semantics sufficient under the approved trust model?** Substantially yes. The command is parsed from the same bytes that were hashed (`:450`, `:461`, and the injected-mismatch guard at `:462`), and `commandFor` deep-equals the full 20-element vector, so a weakened threshold, a dropped `--per-file`, a changed reporter or a redirected suite all throw rather than being silently rewritten (`:412-419`). `--reports-dir`/`--temp-directory`/`--config` are spliced *before* c8's child command and the child `node` is replaced with `runtime.execPath` (`:499-501`). Freshness is structural — `mkdtemp` + two fresh `mkdir`s — with no mtime decision, and `lstat` rejects a non-regular or symlinked summary (`:514-516`). Quiescence is handled per §16: on `error` or `signal` the scratch is retained and named, never raced (`:526-527`). Gaps: F5 (NODE_OPTIONS), and two scope limits worth stating plainly — `node_modules/c8/bin/c8.js` is never hashed (only its version string is read, `:467`), and the ignore-directive scan at `:454` matches `c8|v8|istanbul ignore` but not Node's own `/* node:coverage disable */` form. Whether that last form can reach raw V8 coverage consumed by c8 is a c8/Node behavior question I cannot settle from this packet; likewise whether `--config={}` fully suppresses c8's discovery of a `c8` key in `package.json`. Both are context-dependent, not confirmed defects.

**Q3 — Do the tests and the 12 decision controls test the intended contract, or hide weaknesses?** The controls are genuine and well-built: each asserts the real judge rejects the crafted input, asserts the target predicate occurs **exactly once** in the source (`source.split(before)` length 2, `:411`), compiles a surgically weakened copy in `vm.runInNewContext`, and requires the mutant to return `[]` (`:410-416`). The sandbox is correct — `module` is a fresh object so `require.main === module` at `expect-red.cjs:559` is false and `main()` does not fire. Control #5 (`test.js:379-381`) is the direct H1 proof: it shows that *only* the observation gate catches damage added to the machine evidence. Two honest limits: (a) 12 controls cover 12 of roughly thirty decision points — host/runtime match (`:204`), digest match (`:212-217`), `accepted !== false` (`:200`), `harnessError` (`:202`), failure-inventory reconciliation (`:245`), `wrong check kind` (`:237`), duplicate diagnostic field (`:280`), trailing-output (`:301`), `starts.length` (`:386`), `failures.length !== failed` (`:392`), the `ERROR: Coverage` scan (`:393`) and most of `coverageEvidenceProblems` have direct negatives but no necessity proof. I spot-checked several by hand (`:200`, `:204-208`, `:212-217`, `:237`, `:245`, `:290`) and each is load-bearing — the corresponding test would fail if the predicate were deleted — so this is a coverage-of-technique gap, not a known blind spot. (b) F7 and F12 are places where a control proves less than its name implies.

**Q4 — Are the report shapes and never-fail owner checks independently meaningful?** For **upgrade**, yes and strongly: the new `upgrade:owner-bytes-preserved` row is corroborated by the pinned `tree-delta`, so the never-fail claim rests on machine evidence and not on the harness's own boolean. For **fresh**, the owner row is a bare boolean with no second signal (F8). The separate required-PASS list does apply unconditionally: `:255-259` runs over `RECOVERY_REQUIRED_PASS` regardless of what `RECOVERY_REQUIRED_FAIL` contains, and the comment at `:256-257` states the invariant correctly — adding a safety row to the failure list cannot make its failure acceptable, because the two loops assert contradictory requirements and both push. Decision control #6 confirms `:258` is the sole guard for that. Independence throughout is from the *wrapper's journal* (which the harness never reads — `installer-recovery.cjs:5-7`, its own walker at `:66-83`), not from the harness itself; the judge cannot detect a harness that observes less than it should. That distinction is the ceiling on every "independent" claim here, and F6 is what it looks like in practice.

**Q5 — Missing operational or quality proof, named exactly.**
1. No combined measurement of the **current** bytes (`a951904a…`, `ef6a2159…`, `87047200…`): the 1826-test/70-file Bun result predates the termination-marker fix and the packet correctly forbids transferring it.
2. Validator branch coverage of 100% was measured over 56 tests **excluding** the two `longTest` live cases. Those two exercise `installer-recovery.cjs` and not `expect-red.cjs`, so excluding them does not weaken the validator's own figure — but it means no single run has produced both numbers over these bytes.
3. `tests/acceptance/installer-recovery.cjs` at 86.86% branches misses the shared per-file bar, and F2 identifies *which* branches: the new `observation-error` guard plus the entire post-GREEN quarantine-reading region (`:232`, `:237-257`). OPEN, not waived — and materially worse than the percentage suggests.
4. Node 22, Linux and macOS are unmeasured. The per-platform code that would differ is real and reachable: `identity`/`relativeName` at `:126-131`, the `path.win32`/`path.posix` selection at `:312`, and the NFC+lowercase darwin rule at `:317`. Host-path controls (`test.js:112-116`, `:319-327`) exercise the *logic* with an injected platform, which is a genuine portability control for the judge, but proves nothing about c8's actual summary key spelling on those platforms.
5. ESLint's security rules target `**/*.js` and neither reviewed `.cjs` file matched. Post-relocation lint exiting 0 with 815 warnings and unchanged rules therefore still does not establish that those rules ran on `scripts/expect-red.cjs` or `tests/acceptance/installer-recovery.cjs`. The precise missing proof is a per-file `eslint --print-config` on both `.cjs` paths showing the security rules present, or a rule-coverage listing. Existing repository warnings remain uncertified.
6. No negative control demonstrates that the harness *emits* `observation-error` (F2), and none demonstrates the scenario-abort report shape (F7).

---

## Required before this can be PASS

Blocking: **F3**, **F4**, **F5** — three bounded edits, none touching acceptance semantics or the inventory. Plus an execution proof for **F2**, which is the one place where a guard this change introduced has never run.

Return to the owner rather than implementing: **F1** and **F8**, both of which alter the approved observation shapes or the 25-check inventory.

Advisory, in scope, no owner decision needed: **F6**, **F7**, **F9**–**F12**.

This verdict covers the three supplied files only. It is not acceptance of the unimplemented transaction, not acceptance of the existing lock, not approval of P07, and not a release judgment. The still-FAIL rows record known product defects; nothing here establishes those failing properties as safe.

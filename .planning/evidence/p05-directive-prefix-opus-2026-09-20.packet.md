# Final D1 repair review
No tools; no simulated tool calls or execution claims. Return PASS or NOT PASS for this narrow delta, with any concrete remaining issue, in at most400 words. Owner requests Opus5/xhigh. The previous full and delta reviews are accepted as source-qualified context, not execution proof.
The previous delta review required removing the trailing word boundary from node:coverage directive recognition because the installed converter recognizes disabled/enabled prefixes. That exact fix is now applied; both disabled and enabled cases were added to both-module refusal tests. Genuine RED showed spawned:true; GREEN has54 assertions,refuses before spawning for18 module/directive combinations. Also renamed the test helper parameter weakenHomeComparison to weakenComparison without changing behavior. No other changes since the previous delta review; no approved inventory/API/runtime ownership change.
Assess this exact correction and interactions with the converter. Earlier80-test100%-all-metrics evidence and1847/0 full-suite evidence predate this last fix; current final gates will be rerun after this review. Native win32 only. Previously owned moved-list/native evidence gaps remain open at their recorded triggers. Do not reopen unrelated code or assume you ran anything.
## Current validator scan
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
## Current directive control
  }, 400000);

  test('coverage ignore directives in either watched module refuse before execution', () => {
    for (const module of ['install-names.js', 'install-transaction.js']) {
      for (const directive of ['c8 ignore next', 'v8 ignore next', 'istanbul ignore next',
        'node:coverage ignore next', 'node:coverage disable', 'node:coverage enable',
        'node:coverage disabled', 'node:coverage enabled', '|8 ignore start']) {
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
## Installed converter recognition

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
## Previous delta verdict
# Final delta review — P04/P05 section20

## Verdict: **PASS WITH CHANGES** (one required change, low severity; no current false acceptance)

The delta is correctly scoped, fail-closed in direction, and materially strengthens the two weaknesses raised as F4/F5. It does not touch the 27 check identities, the 14PASS/13knownFAIL partition, `RECOVERY_REQUIRED_PASS`/`FAIL`, the home-state schema, `commandFor` allowlists, or the runtime-exception policy. I found one concrete defect against the delta's own stated acceptance criterion.

## Required change

**D1 — `\b` makes the `node:coverage` alternative a strict *subset* of the installed converter's recognition.**
`scripts/expect-red.cjs:514` now uses `node:coverage\s+(?:ignore|disable|enable)\b`. The supplied converter matches `/\/\* node:coverage (?<mode>enable|disable)/` with **no trailing boundary**. Therefore `/* node:coverage disabled */` (or `enabled`) is parsed by `_parseIgnore` as `{start:true}` and suppresses coverage from that line on, while the validator's `\b` fails (`disable` followed by `d` is not a boundary, and `enable` does not match at that offset). The whole point of this hunk is "reject every converter-recognized form," and this form is recognized and not rejected.

Fix: drop the trailing `\b` on the second alternative (`node:coverage\s+(?:ignore|disable|enable)`), which is strictly broader and fail-closed, and add `'node:coverage disabled'` to the directive table in `tests/expect-red.test.js:1001`. Cost: one token plus one row. I classify this as **not** a current safety regression — no such text exists in either watched module, the measured run is 100%/100%/100%/100% on both files, and the failure mode requires someone to write that exact block-comment prose into `install-names.js`/`install-transaction.js`. It should land before the restore/moved-list approval, not necessarily before this invocation.

## Verified and correct

- **Converter parity elsewhere is exact.** `[cv|]8` is the right response to the converter's `/\/\* [c|v]8 ignore (start|stop)/` character-class typo: `|8 ignore start` is genuinely honoured by the installed `source.js`, and the new `'|8 ignore start'` test case pins it. The first alternative is a superset of all four `[cv]8|node:coverage ignore next…` forms (`\s+` ⊃ single space, no anchor ⊃ `^\W*`, `/i` ⊃ case-sensitive). Alternation precedence groups as intended.
- **No collateral coupling.** The regex line is not one of the 16 `control.before` strings in “decision controls detect independently weakened recovery and coverage guards”; the `toBe(16)` count and every `split(...).toHaveLength(2)` assertion are unaffected. The refusal message still contains the module basename, so the `toContain(module)` assertion holds for all seven directives × two modules, still with `spawned === false` (pre-execution refusal preserved).
- **Mutant-control design is sound and targets real safety rows.** `fresh:owner-bytes-preserved` and `fresh:displaced-equals-twin-changes` are both in `RECOVERY_REQUIRED_PASS`, i.e. rows the judge cannot be told to excuse — exactly where a silently-removed harness assertion would be invisible to the validator. The correct/mutant pair (`accepted:false` + named row `ok:false` → `accepted:true`) is the right oracle shape and mirrors the existing home control.
- **Back-compat and multiplicity guards hold.** `weaken === true ? 'home' : weaken` preserves the existing `captureHarnessOracle('home-upgrade-delete', true)` call site, and `occurrences + 1` reproduces the prior `assert.equal(..., 3)` for the two home sites. A drifted harness produces a loud `AssertionError`, not a vacuous pass. Both replacements (`void content;`, `undefined`) are syntactically valid as statements or as arguments, and `void content;` avoids an orphaned binding.
- **Injection placement is safe.** Both new faults are gated on `scenario === 'fresh'` and sit after the twin early return, so twin/upgrade scenarios and the `none`, `runtime-*`, `home-*`, `private-environment*` controls are untouched. `owner.txt` is already in the fresh top-level allowlist, so the damage perturbs bytes, not the name set.

## Advisories (not blocking, not counted as false acceptance)

- **D2.** `expect(mutant.report.accepted).toBe(true)` couples each control to *all other* checks tolerating the injected damage. If a future row also detects `displaced/attempt/owner.txt`, this test fails for the right reason but with a misleading message. Asserting the named row flipped to `ok:true` would be more durable.
- **D3.** The new test does not also assert `judgeInstallerRecovery(run).length > 0` on the correct-harness run, unlike the sibling `harness-abort`/`trace-absent` test. Judge-side enforcement is covered elsewhere (“an additional owner-byte loss cannot hide…”), so this is redundancy, not a gap.
- **D4.** `fresh:status-is-1` / `upgrade:status-is-1` remain the only `REQUIRED_PASS` rows with no damage/mutant control. Arguably unmutatable, but worth recording as a known limit of the control set rather than leaving it implicit.
- **D5.** The parameter name `weakenHomeComparison` is now wrong (it carries `true|'owner'|'displaced'`). Rename to `weaken` at the next touch.

## Confidence and scope limits

Confidence **high** on D1 (derived directly from the supplied converter excerpt and the literal regex), **high** on the parity/no-collateral findings, **moderate** on the mutant-control findings.

Limits: no execution, so I take the 80-pass/100%-four-metric, 1847/0 Bun suite, exit-0 live `expect-red installer-recovery` (27 checks, 14/13, cleanup true) and stable-hash claims as reported. I was **not** shown `tests/acceptance/installer-recovery.cjs`, so I cannot independently confirm the three decision strings occur exactly 2/1/1 times, that the `displaced` site is fresh-only, or that the `owner` assertion is shared across both scenarios (the `occurrences=1` assertion implies it is, which is why a fresh-only injection suffices). Those are enforced at runtime by the in-control `assert.equal`, so drift fails loudly. I reviewed only the two hunks and their interactions; F1/F2 remain owned by the implementing agent at restore/moved-list format approval, F3 is withdrawn, F6–F9 stay dispositioned. Verdict conditioned on the appended full-suite and real recovery CLI results matching the summary above, and on native win32 Node 24 only.


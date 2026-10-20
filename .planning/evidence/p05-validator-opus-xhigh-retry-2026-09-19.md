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
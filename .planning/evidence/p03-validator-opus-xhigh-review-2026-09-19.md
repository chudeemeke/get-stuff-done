**Verdict: PASS WITH CHANGES, conditional.** H1 blocks approval. If the harness `detail` strings cannot be normalised enough to pin, H1 needs a harness-scope extension and the verdict becomes NOT PASS until the owner decides that. None of the corrections touch locks, the installer, workflows or package scripts.

## Findings

**H1 (High): expected-FAIL rows accept any failure, so new damage hides behind the known red.**
For the 13 FAIL rows the contract checks identity, `ok === false` and a nonempty detail. Nothing ties a failure to the *known* reason. A row that already fails cannot detect a second, different failure of the same property.
- **Counterexample A:** an upgrade regression overwrites an owner file outside the allowlist.
  - `upgrade:tree-deep-equal-outside-allowlist` already FAILs for its current difference and still FAILs, with a longer detail.
  - Upgrade has no separate owner-bytes row.
  - The judge returns `[]` and `main` returns 0.
- **Counterexample B (directly on P04/P05):** the lock repair leaves a lock file behind.
  - Inside the transaction directory, `*:transaction-directory-shape` is expected FAIL in both scenarios.
  - At top level, `fresh:top-level-exact-allowlist` is expected FAIL.
  - The residue is accepted either way.

**Smallest correction:**
1. Give each expected-FAIL row a reviewed detail matcher in validator constants: exact text after the fixture root is stripped, or the exact set of differing relative paths. Reject a FAIL whose detail differs.
2. The ten `render:` TAP failures already meet this standard (exact `error`/`failureType`/`code`). Apply the same standard here.
3. Add upgrade owner-byte-loss and stale-lock-residue RED controls.
4. If the details cannot be normalised, the smallest extension is one harness PASS row, `upgrade:owner-bytes-preserved`. That puts the harness file in the allowlist and needs its own review.

**M1 (Medium): runtime and host are unbound, so a Bun run is accepted as Node evidence.**
`spawn(process.execPath, …)` runs whatever runtime hosts `main`. If "live" verdicts are driven from the Bun suite, execPath is Bun. The harness then reports Bun's Node-compatible `process.version` and a platform. Both are "nonempty strings", so the report is accepted. A captured report from another OS or Node version is accepted the same way.

Exact API delta for approval:
```text
judgeInstallerRecovery(run, { sourceHashes, host: { platform, nodeVersion } })
judgeInstallTransactionCoverage(run, { projectRoot, coverageSummary, host: { platform } })
```
- `main` fills `host` from `process.platform` and `process.version`.
- `main` returns 1 when `process.versions.bun` is set.
- The recovery judge requires the report's platform and version to equal `host`.
- `host.platform` also makes path normalisation testable on any host: `path.win32` with case folding, posix exact. Otherwise the win32 branches are reachable only natively.

**M2 (Medium): coverage-ignore pragmas satisfy every metric rule.**
`/* c8 ignore next */` (or `v8`/`istanbul ignore`) around an uncovered branch lowers the totals while pct stays 100 and covered equals total. Totals are rightly not pinned, because they change per seam. `main` already reads both module sources to hash them. It should reject ignore pragmas in those bytes, or check them against a reviewed list. This is a pure string scan with no new I/O.

**M3 (Medium): the metric rules may reject legitimate summaries.**
- "Positive integer totals" rejects a file with zero functions or branches. Istanbul reports `total: 0, pct: 100` for those. The packet does not show per-file totals for `install-names.js`.
- "Total equals sum" can only apply to `total`/`covered`/`skipped`. The total row's `pct` is derived, not summed.
- Correction: require a non-negative integer total, `covered === total`, `skipped === 0` and `pct === 100`. Check the receipt for any zero total.
- Ignoring `branchesTrue` must not throw on a non-numeric `pct` (`"Unknown"` in some istanbul versions).

**M4 (Medium): four-metric validator coverage is not implementable as stated.**
The validator suite runs under Bun. Bun 1.3.x coverage reports functions and lines only, and c8 cannot instrument JavaScriptCore. "All four metrics, 100% branches" therefore needs one of two things:
- a Node-runnable test file, measured ad hoc with the existing c8 (no package-script change); or
- an explicit downgrade to Bun functions/lines at 100 plus a reviewed branch-to-test matrix.

Decide this before RED, so the claim is not quietly weakened at GREEN.

**M5 (Medium): inventory evolution can move safety rows into the permitted-failure set.**
Under "later seam approvals update the reviewed inventory", a PASS→FAIL edit looks the same in a diff as a legitimate update. That covers `fresh:owner-bytes-preserved`, any `*:status-is-1`, any harness row, or a lock TAP name. The Bun test's copy of the inventory would be edited alongside it.

Correction: add a never-permitted-failure constant covering harness rows, owner-bytes, status rows, and TAP names outside approved pending seams. Assert it against the inventory at load time and in a test. That is one constant and one check.

**L1 (Low): TAP grammar.**
- (a) `console.log` output from a test file becomes top-level `# …` comments. A logged `tests 5` would duplicate a summary and reject legitimate output. Require the seven summaries as the contiguous block immediately after the final top-level plan.
- (b) A YAML block must open with `---` and close with `...`. Check the required keys and tolerate other keys such as `type` and `location`. Define "unknown result record" as a top-level line outside the grammar, not an unfamiliar YAML key.
- (c) "Contiguous numbering" applies at top level only, because nested plans restart.
- (d) Compare names in escaped form consistently (`\#`, `\\`).

**L2 (Low): runner robustness.**
- Spawn with an env copy that drops `NODE_TEST_CONTEXT`. When the wrapper runs under `node --test`, that variable can switch the child away from TAP.
- Refuse `NODE_OPTIONS` that carry test-runner flags.
- Add a spawn `timeout`, reported through the signal as exit 1.
- Clean up with `rmSync({ recursive: true, maxRetries, retryDelay })`, so a Windows handle release is not a wrong-reason red.
- Enumerate the injected `fs` methods (`mkdtempSync`, `lstatSync`, `readdirSync`, `readFileSync`, `rmSync`) so fault injection can be exhaustive.

**L3 (Low): implementable but underspecified.**
- Parse `package.json` from the same bytes that were hashed, not via `require`, which caches.
- State which report field maps to which digest file, and the format of `failure`.
- A judge called without `evidence` (every current test does this) must return a violation. It must not skip the checks through a default `{}`.
- If `main` cannot read the summary, it reports that directly instead of calling the judge with a placeholder.

**L4 (Low): TDD labelling.**
- Show each control failing against the HEAD validator before GREEN.
- Controls that HEAD already rejects (spawn error, non-JSON output) are characterisation tests, not RED. Label them as such.
- Write the superseded RED rule into the Codex brief itself. Otherwise the implementer follows the old "every RED passes expect-red" instruction.

## Focus answers

1. **Remaining acceptance paths:** H1 (failure for the wrong reason), M1 (wrong runtime or host), M2 (ignored code). The contract as written closes:
   - stale shared reports;
   - missing, duplicate and unknown identities;
   - a contradictory `failure` field;
   - basename matching;
   - mid-run edits.
2. **Shapes:** implementable with built-ins only (`fs`, `crypto`, `child_process`, `path`, `os`) once M1, L2 and L3 are applied. The cleanup semantics (retain and name the path, preserve the original error, return 1) are complete.
3. **Portability:** only Node 24.20.0 on win32 has been measured, and no incompatibility has been measured. The following are unmeasured, so they need native tests, not parser loosening:
   - Node 22 TAP (file-level nesting, YAML keys);
   - V8 12.x versus 13.x block-coverage granularity;
   - Linux and macOS path forms.
   
   Node 22 on Windows can be captured locally now. Linux and macOS need CI once jobs execute steps. Until then the parser must not be called portable, and red on those hosts is not evidence of a product regression.
4. **TDD:** preserved. Refusing to add new REDs to the permitted set is correct. M5 closes the remaining back door through inventory edits.

## What the packet cannot establish

- Whether the FAIL-row details are deterministic after normalisation. This decides whether H1 can be fixed inside the allowlist.
- The recovery report schema:
  - the digest field names;
  - the `failure` format;
  - whether `fixtureRemoved` is verified or only self-reported;
  - whether the report includes the fixture path, which would let `main` confirm removal.
- How `dist/bin/install.js` relates to `bin/install.js`. If dist is a build output, a stale dist matches its own current bytes and is accepted.
- How to tell an uncaught harness crash after the report is printed from the expected red. Both exit 1. Node's `Node.js vX` trailer on stderr is a cheap signal, but only if the harness does not relay the child's stderr.
- The per-file metric totals (M3), which c8 config sources exist (`.c8rc*`, `.nycrc*`, package keys), and the exact package-script text.
- Whether the 41 passing tests remain meaningful. Evidence is bound to current bytes, not reviewed bytes, so a weakened suite that keeps its names and coverage is still accepted. That is a review-process control, and the contract rightly does not claim otherwise.
- Behaviour under Node 22, Linux and macOS.

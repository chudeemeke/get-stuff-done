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

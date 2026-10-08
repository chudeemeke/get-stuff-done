# Final D1 repair review

## Verdict: **PASS**

The exact fix required by the previous delta review is applied correctly, and the resulting regex is now a strict superset of every form the installed converter honours.

## Parity re-derived against the supplied converter

- **Alternative 2** is now `node:coverage\s+(?:ignore|disable|enable)` with no trailing boundary. The converter's `/\/\* node:coverage (?<mode>enable|disable)/` has no boundary either, so `disabled`/`enabled` — which the converter parses as `{start:true}`/`{stop:true}` — are now caught. The D1 subset gap is closed, and closed in the fail-closed direction (the validator is now broader than the converter, never narrower).
- **Alternative 1's surviving `\b`** after `ignore` is safe: every converter pattern requires a literal space after `ignore` (`ignore next`, `ignore (start|stop)`), so a word-char suffix is never recognized. No second subset gap was introduced by leaving that boundary in place.
- **Superset margins hold elsewhere:** `\s+` ⊃ the converter's single literal space; `/i` ⊃ its case-sensitive matching; no anchor ⊃ `^\W*`; `[cv|]8` ⊃ `[c|v]8` including the converter's character-class typo.
- **Alternation precedence** still groups as `((?:[cv|]8|istanbul)\s+ignore\b)` | `(node:coverage\s+…)`; the `istanbul` arm is unaffected by the edit.

## Test-table consistency

9 directives × 2 modules = 18 combinations × 3 expects = 54 assertions — internally consistent with the reported GREEN. Both `disabled` and `enabled` are present, so the repair has its own control. The refusal path still precedes `capturedHashes`/spawn, so `spawned:false` and `toContain(module)` remain the right oracles, and the reported RED (`spawned:true`) confirms the control is load-bearing.

## Remaining concrete issue (verify at re-run, not blocking)

**R1 — rename blast radius.** `weakenHomeComparison → weakenComparison` is behaviour-neutral *only* if the identifier is positional. If it is a destructured/named option, or if it appears verbatim inside any of the 16 `control.before` mutation strings in "decision controls detect independently weakened recovery and coverage guards", a partial rename silently breaks a `split(...).toHaveLength(2)` assertion. I was not shown those strings. The rerun full suite will expose this loudly; no action if green.

**Advisory:** the broadened arm now also refuses on prose like `node:coverage disablement` in the two watched modules. Fail-closed and correct, but document it so a future comment does not look like a validator bug.

## Scope

Verdict covers only this delta, conditioned on the pending re-run of the 80-test/four-metric and full-suite gates, native win32 only. Previously owned moved-list/native evidence gaps stay open at their recorded triggers; D2–D4 remain advisory.

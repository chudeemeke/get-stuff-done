---
schema_version: "1.3"
source_project: authkey
created: 2026-04-27
type: bug
severity: high
fix_status: merged
affects_scope: all-consumers
workaround_applied: "git checkout -- .planning/ROADMAP.md to revert the bogus tool-introduced changes, then surgical 3-line manual Edit on ROADMAP.md to apply the intended state change."
priority_rationale: Silent corruption of a planning artifact (ROADMAP.md). The wrong checkbox flip is invisible without `git diff`, and the mass line-ending rewrite buries the 1 substantive change in 333 lines of CRLF churn. Both failure modes are documented in the calling project's own memory file `feedback_diff_automated_tool_writes.md` — this inbox issue gives that lesson a fix path.
status: merged
next_owner: get-stuff-done
triaged_at: 2026-04-29
resolved_at: 2026-07-03
pr_url: https://github.com/chudeemeke/get-stuff-done/pull/3
---

# `roadmap update-plan-progress` flips wrong checkbox AND mass-rewrites file with CRLF churn

## Resolution (2026-07-01)

Resolved in PR https://github.com/chudeemeke/get-stuff-done/pull/3 at commit `613f595463d7fd712b81fe3126346097cfdac176`.

The fix anchors checkbox matching to the target phase checklist prefix and updates the plan-count replacement pattern to avoid broad CRLF churn. Regression coverage was added in `tests/roadmap.test.cjs`, including a CRLF fixture where a different phase line mentions the target phase later in the line.

## Symptom

Calling `node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs roadmap update-plan-progress <PHASE> <PLAN_ID> completed` produces two failures:

1. **Wrong checkbox flipped.** Instead of marking the targeted phase's plan checkbox `[~] → [x]`, it flipped a different plan in a *different* phase. In the authkey reproduction, calling `update-plan-progress 09.3 01/02/03 completed` did NOT touch the three `09.3-01-stream5-…-PLAN.md` / `09.3-02-…` / `09.3-03-…` checkboxes (which stayed `[~]`). It instead flipped `09.2-08-PLAN.md` (a *different phase*, a `[ ]` plan that is explicitly blocked on Phase 09.3 closure) to `[x] (completed 2026-04-27)`.
2. **Mass file rewrite.** The same call also rewrote all 333 lines of `ROADMAP.md` with what `git diff` shows as 333 insertions and 333 deletions, while `git diff -w` reduces to a single line of substantive change (the wrong-checkbox flip). Symptom: line-ending normalization or whole-file re-emit by the tool.

## Repro

```bash
# In a project with .planning/ROADMAP.md that contains both:
#   - A `[ ]` plan-line in some Phase A immediately before
#   - A Phase B section with `[~]` in-progress plan-lines AND a numbering
#     pattern Phase A also uses (e.g. Phase A has "*-08-PLAN", Phase B has "01/02/03")
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs roadmap update-plan-progress <PHASE_B> 01 completed
git diff --stat .planning/ROADMAP.md
git diff -w .planning/ROADMAP.md
```

Authkey HEAD where this reproduced: `f92420e` (current main, 2026-04-27). ROADMAP.md state at that commit had:
- Line 290–291: Phase 09.2 plan list ending with `- [ ] 09.2-08-PLAN.md -- Final ratchet + tag …`
- Line 320–322: Phase 09.3 plan list with three `[~]` Stream 5 plans named `09.3-01-stream5-…`, `09.3-02-stream5-…`, `09.3-03-stream5-…`

CLI returned: `{ "updated": true, "phase": "09.3", "plan_count": 3, "summary_count": 3, "status": "Complete", "complete": true }` — implying success — while leaving the `[~]` checkboxes untouched and flipping the wrong `[ ]`.

## Root cause

Hypothesised (without reading the source — the inbox triager should validate against `~/Projects/get-stuff-done/bin/lib/` or wherever `roadmap update-plan-progress` lives):

1. **Wrong-checkbox flip** — the line-matching logic likely searches for a checkbox line by partial filename or line-number proximity to the `### Phase <X>` heading rather than by exact `<PHASE>-<PLAN>-…-PLAN.md` filename match. When the targeted phase's plan IDs (`09.3-01`, `09.3-02`, `09.3-03`) don't appear as exact prefixes (`09.3-01-stream5-debug-derive-landmine-PLAN.md` has `09.3-01-` then `stream5-…` suffix) the matcher may degrade to "the most recent `[ ]` checkbox before the `### Phase <X>` heading" — which in this case is `09.2-08-PLAN.md`.

2. **Mass rewrite** — likely the tool reads the whole file, parses, and re-emits with platform-default line endings (LF on the runtime, CRLF in the source repo because git's autocrlf normalises on checkout). Each round-trip flips every line ending, producing 333/333 diff stats.

The reporter has not opened the source — these are educated guesses. Validate before fixing.

## Proposed fix

**Fix 1 — exact filename matching.** Build the expected filename token from `<PHASE>-<PLAN>-` prefix and require an exact prefix match on the filename portion of the checkbox line. Reject matches that don't start with `<PHASE>-`. Fall through to "no checkbox found, error out" rather than silently flipping a different one.

```javascript
// Pseudocode
const expectedPrefix = `${PHASE}-${zeroPad(PLAN, 2)}-`;
const candidates = lines.filter(l =>
  /^- \[[~ ]\] (?<file>[^ ]+\.md) /.test(l) &&
  l.match(/^- \[[~ ]\] (?<file>[^ ]+\.md)/).groups.file.startsWith(expectedPrefix)
);
if (candidates.length === 0) {
  throw new Error(`No checkbox line found for ${PHASE}-${PLAN} (expected filename prefix: ${expectedPrefix})`);
}
if (candidates.length > 1) {
  throw new Error(`Ambiguous match for ${PHASE}-${PLAN}: ${candidates.length} candidates`);
}
// flip the single matched checkbox
```

**Fix 2 — preserve line endings.** Detect the file's existing EOL (LF vs CRLF) on read, write back with the same EOL. Or: use a line-by-line in-place rewriter (sed-like) that touches only the matched line, not whole-file re-emit. Either approach eliminates the 333/333 diff churn.

```javascript
const original = fs.readFileSync(path, 'utf-8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
// ... do the line edit ...
fs.writeFileSync(path, lines.join(eol));
```

**Fix 3 — return value should reflect actual mutation.** The CLI returned `{ updated: true, complete: true }` when no targeted checkbox actually flipped. Change return value to include the matched filename and old/new state, so callers can validate the right thing changed.

```json
{
  "updated": true,
  "phase": "09.3",
  "plan": "01",
  "matched_file": "09.3-01-stream5-debug-derive-landmine-PLAN.md",
  "old_state": "~",
  "new_state": "x",
  "completion_date": "2026-04-27"
}
```

If no candidate matched, return `updated: false` with an error rather than silently picking the wrong one.

## Test plan

Add tests covering:

1. **Exact prefix match (happy path)** — phase with plans named `<PHASE>-<NN>-<slug>-PLAN.md`; flip succeeds and only the matched checkbox changes.
2. **Filename-prefix collision regression** — file contains `09.2-08-PLAN.md [ ]` followed by `09.3-01-stream5-…-PLAN.md [~]`; calling `update-plan-progress 09.3 01 completed` MUST flip the `09.3-01-…` line and MUST NOT touch the `09.2-08-PLAN.md` line.
3. **No match → error, not silent failure** — call `update-plan-progress 99 99 completed` against a file without a 99-99 plan; CLI returns `updated: false` with an error message naming the expected prefix.
4. **EOL preservation** — input file has CRLF endings; after the call, `git diff --stat` shows ≤ 2 line changes (the flipped checkbox + maybe the Progress-table update), NOT a 333/333 mass rewrite.
5. **Idempotency** — calling `completed` on a plan that is already `[x]` should be a no-op (return `updated: false` with a "no change" reason).

## Suggested commit message

```
fix(roadmap): exact-prefix match + EOL preservation in update-plan-progress

Two regressions were silently corrupting consumer ROADMAP.md files:

1. Wrong-checkbox flip: the line matcher used loose substring or position
   heuristics, causing it to flip the most recent `[ ]` plan before the
   target `### Phase <X>` heading instead of the targeted phase's plan.
   Fix: build expected filename prefix `<PHASE>-<PLAN>-` and require
   exact-prefix match on the checkbox-line filename. Reject zero matches
   (error) or multiple matches (error) instead of silently picking one.

2. Mass file rewrite: writeback used platform-default EOL, normalising
   CRLF source files to LF on every call. Even a 1-line change produced
   333/333 diff stats. Fix: detect EOL on read, preserve on write.

Also: return value now includes `matched_file`, `old_state`, `new_state`
so callers can validate the intended mutation actually happened.

Resolves: authkey/inbox 2026-04-27
```

## Suggested CHANGELOG entry

```
### Fixed
- `roadmap update-plan-progress` no longer flips the wrong checkbox when
  multiple phases have similarly-numbered plans (e.g., `09.2-08` vs
  `09.3-01`). Now requires exact filename-prefix match.
- `roadmap update-plan-progress` preserves the source file's existing
  line endings (LF or CRLF) instead of normalising on writeback. Eliminates
  the 333-line diff churn for what should be a 1-line change.
```

## Risks / things to verify before merging

- **Backward compat for projects using fuzzy matching intentionally** — none expected; the wrong-checkbox flip is a bug, not a feature. But check git blame on the existing matcher to see if there was a deliberate design choice.
- **Edge case: phases with sub-numbering** like `09.3` vs `09.30` — exact-prefix match needs a delimiter check (`<PHASE>-<PLAN>-` ends with hyphen so `09.3-` cannot prefix-match `09.30-…`). Verify the test plan covers this.
- **Plans split across multiple files** — some plans have multiple PLAN files (e.g., `09.3-01-PLAN.md` AND `09.3-01-stream5-debug-derive-landmine-PLAN.md` in the same phase). Decide policy: one match, multiple matches, or scoped match by full slug.
- **Progress-table side-update** — the CLI also updates a "Progress" table at the top of ROADMAP.md (per the workflow doc). Verify EOL preservation applies there too, and that the table update is gated on the actual checkbox flip (i.e., don't update the table if no checkbox changed).

## Related

- Calling project memory: `~/.claude/projects/C--Users-Destiny-iCloudDrive-Documents-AI-Tools-Anthropic-Solution-Projects-authkey/memory/feedback_diff_automated_tool_writes.md` — already documents the more general lesson "always git diff after any automated tool that updates a state file." This inbox issue gives that lesson a fix path on the source-tool side.
- Calling project's reference: `reference_plan_index_has_summary_bug.md` — separate but adjacent gsd-tools defect (`phase-plan-index` reports `has_summary:false` for all plans). Suggests a broader audit of the gsd-tools `roadmap` and `phase-plan-index` subcommands' line-matching logic.
- Surfaced during: `/gsd-execute-phase 09.3` resumption (Session H, 2026-04-27). Workaround applied: surgical 3-line manual `Edit` on the ROADMAP.md after `git checkout -- .planning/ROADMAP.md` to revert the bogus tool-introduced changes.

---

## Triage 2026-04-29 (get-stuff-done)

**Validation against fork code (`get-stuff-done/bin/lib/roadmap.cjs:275-279`):**

- **Bug 1 (wrong-checkbox flip): VALID.** The regex `(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phaseEscaped}[:\\s][^\\n]*)` with `.*` between `[ ]` and `Phase X` matches ANY `- [ ]` line containing the phase string anywhere in the line, including descriptions of OTHER plans that mention the target phase in prose.
- **Bug 2 (mass-rewrite/CRLF churn): NOT REPRODUCIBLE in this repo.** Get-stuff-done's `.planning/ROADMAP.md` is LF-only (`grep -c $'\r' = 0`). The 333/333 diff symptom appears specific to authkey's CRLF working-tree environment. The fork-side fix (preserve EOL on writeback) is still desirable for cross-project robustness but not validatable here without a CRLF fixture.

**Phase 40.5 execution risk: LOW (latent, not active).**

ROADMAP.md grep for `^- \[ \].*Phase 40.5` returns:
- Line 73: `- [ ] **Phase 40.5: Upstream Bump...**` (correct summary checkbox)
- Line 209: `- [ ] TBD (... once Phase 40.5 verification confirms state)` (backlog 999.4 placeholder, ALSO matches)

Saved by `String.replace` (no `g` flag): only the FIRST occurrence flips, and line 73 precedes line 209. Phase 40.5 completion will flip the correct checkbox. **However the bug is dormant, not absent** — any future ROADMAP edit that reorders or inserts an earlier `- [ ]` line containing "Phase X" would bite.

**Disposition: RESOLVED 2026-07-01 in PR #3.**

Rationale: Post-migration verification confirmed the bug still mattered in the active fork/runtime surface. Commit `613f595463d7fd712b81fe3126346097cfdac176` anchored the checkbox matcher and added CRLF regression coverage.

**Status:** `resolved`.

## Archive Decision -- 2026-07-03

Moved to archived audit trail because the item is already terminal in the root-local inbox: status merged, resolved_at 2026-07-01, PR https://github.com/chudeemeke/get-stuff-done/pull/3.

## Event Log
<!-- inbox-events:v1 -->
- 2026-07-03T17:19:30.000Z | get-stuff-done | merged | Archived terminal PR #3 roadmap update-plan-progress fix record into tracked audit trail.
- 2026-06-26T22:36:18.238Z | conversations | correction | Added next_owner for coordination-audit ownership routing; receiver project still owns lifecycle/content triage.
- 2026-07-01T19:55:18.000Z | get-stuff-done | merged | Fixed in PR #3 at commit 613f595463d7fd712b81fe3126346097cfdac176.

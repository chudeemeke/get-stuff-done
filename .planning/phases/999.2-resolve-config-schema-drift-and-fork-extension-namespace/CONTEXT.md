# Phase 999.2 — Resolve Config Schema Drift and Fork-Extension Namespace

**Status:** BACKLOG — investigation ~80% complete, resolution pending
**Captured:** 2026-04-20
**Source:** `gsd-tools` warning observed during commit: "unknown config key(s) in .planning/config.json: skip_research, skip_plan_check, skip_verification, branch_per_phase, memory, effort, teams, gsd — these will be ignored"

## Evidence

Observed during commit of 999.1 backlog entry at 2026-04-20:

```
gsd-tools: warning: unknown config key(s) in .planning/config.json:
skip_research, skip_plan_check, skip_verification, branch_per_phase,
memory, effort, teams, gsd -- these will be ignored
```

8 top-level keys in `.planning/config.json` that upstream's `gsd-tools.cjs` does not recognize. Silently ignored rather than failing, which is why this has festered.

## Classification (investigation 80% done at capture)

Verified against upstream `node_modules/get-shit-done-cc/get-shit-done/bin/lib/config.cjs` `VALID_CONFIG_KEYS`:

### Class A: Drift (upstream renamed/restructured; our config stale) -- 4 keys

| Our key | Upstream equivalent | Resolution |
|---------|---------------------|------------|
| `skip_research` | `workflow.research` (semantics inverted; true = do, false = skip) | Migrate |
| `skip_plan_check` | `workflow.plan_check` | Migrate |
| `skip_verification` | `workflow.verifier` | Migrate |
| `branch_per_phase` | `git.branching_strategy: "phase"` | Migrate (enum value, not boolean) |

### Class B: Legitimate fork extensions (we rely on them; upstream doesn't know them) -- 4 keys

| Our key | Purpose | Fork code path that reads it |
|---------|---------|------------------------------|
| `memory.*` | Memory protocol config (enabled, location, curation, staleness_check) | Our overlay memory system |
| `effort.*` | Per-agent effort calibration (v0.2.0 Key Decision in PROJECT.md) | Our overlay effort routing |
| `teams.*` | Agent teams experimental config (v0.2.0 Key Decision: 2-gate safety, disabled by default) | Our overlay team templates |
| `gsd.role` | Maintainer vs consumer routing | `overrides/hooks/gsd-check-update.js` |

### Not in warning but confirmed present

`workflow._auto_chain_active` IS in upstream's VALID_CONFIG_KEYS (line 24 of upstream config.cjs) so not in the warning. Fork schema also includes it (Phase 39 fix). No action needed.

## Two underlying problems

1. **Config migration debt** — upstream evolved the key names/structure, we didn't follow. This is the exact class of brittleness v1.2.0 is targeting but we didn't write a requirement for it. Miss.
2. **Fork-extension namespace gap** — upstream already has `features.*` and `agent_skills.<name>` as open-ended namespaces (see `isValidConfigKey` function). Our 4 fork-specific namespaces aren't accepted. Either upstream PR to add them as namespace prefixes, or fork-side override.

## Resolution subtasks

### Subtask 1: Migrate drift keys (Class A) -- mechanical, ~30 min

1. Edit `.planning/config.json`:
   - Remove `skip_research: false`; add `workflow.research: true`
   - Remove `skip_plan_check: false`; add `workflow.plan_check: true`
   - Remove `skip_verification: false`; add `workflow.verifier: true`
   - Remove `branch_per_phase: false`; add `git.branching_strategy: "milestone"` (confirm correct enum value)
2. Update `overlay/src/config/schema.js` if needed to reflect same renames (schema must stay in sync with config)
3. Update `scripts/validate-configs.js` tests if any assert old key names
4. Verify: running any `gsd-tools` command no longer warns about these 4 keys
5. Verify: no workflow or agent code still reads old key names (grep fork code)

### Subtask 2: Decide Class B resolution path -- decision point, ~30 min

**Option A: Upstream PR to extend namespace support**

Upstream already treats `features.*` and `agent_skills.<name>` as open-ended. Propose extending `isValidConfigKey` to accept four more namespaces: `memory.*`, `effort.*`, `teams.*`, `gsd.*`.

- Pros: cleanest architectural fit; matches existing upstream pattern; benefits any fork
- Cons: upstream review cycle; may be rejected as fork-specific concern
- Risk: #1851 pattern -- is this genuinely an upstream gap or fork-specific? Per `feedback_verify_upstream_scope.md`, require external-AI cross-check before filing

**Option B: Fork-side override of `isValidConfigKey`**

Override `node_modules/get-shit-done-cc/get-shit-done/bin/lib/config.cjs` in `overrides/` with our extended namespace list.

- Pros: immediate; no upstream dependency; we already have override infrastructure
- Cons: takes ownership of upstream's core config module; every upstream bump re-reviews drift; large surface area (400+ line file for a small extension)
- Risk: high maintenance cost; REASON.md would need frequent updates

**Option C: Extend via upstream's existing namespace pattern**

Rename our fork-extension keys to use `features.*` prefix (which upstream already accepts):
- `memory.enabled` -> `features.memory.enabled`
- `effort.default` -> `features.effort.default`
- `teams.enabled` -> `features.teams.enabled`
- `gsd.role` -> `features.gsd.role`

- Pros: zero upstream changes; uses the exact pattern upstream already endorses
- Cons: all fork code reading these keys needs updating (grep hit required); nesting under `features.*` may feel semantically wrong for `gsd.role` which is not really a feature flag

**Recommendation for decision point:** Option C likely cleanest. Option A worth filing ONLY after confirming Option C is infeasible or ugly. Option B is last resort.

### Subtask 3: Implement chosen Class B path -- 1-2h depending

Varies by option selected. Include:
- Code changes per option
- Migration of config.json values
- Update all fork code that reads old keys
- Update REQUIREMENTS.md / PROJECT.md references if any

### Subtask 4: Add schema drift prevention (broader systemic fix) -- evaluate for v1.3.0

The root cause of this whole item is that **we had no CI gate detecting config schema drift between our config and upstream's VALID_CONFIG_KEYS**. v1.2.0's UPGRADE-03 (override staleness) is the closest analogue but doesn't cover config keys.

Candidate future requirement: "CI check compares `.planning/config.json` keys against upstream's `VALID_CONFIG_KEYS` + fork's extended namespaces; fails on unknown keys."

This is a v1.3.0 candidate IF investigation shows the check has non-trivial value. Do not promote into v1.2.0 mid-milestone (scope freeze).

## Promotion criteria

**If Subtask 1 completes AND Subtask 2 selects Option C:**
- Quick-resolve: do Subtask 3 in same session as investigation; close backlog with commit reference
- Total effort: ~2-3h

**If Subtask 2 selects Option A (upstream PR):**
- Hold backlog open; file upstream issue + PR separately
- External-AI cross-check required before filing (per discipline)
- Track in `memory/project_upstream_issues.md`

**If Subtask 2 selects Option B (fork override):**
- Promote to v1.3.0 as dedicated requirement (large surface area warrants proper planning)

**If Subtask 4 investigation concludes schema drift prevention is high-value:**
- Add to v1.3.0 as FUTURE-XX requirement with candidate name `CONFIG-01: Schema drift CI gate`

## Required outputs from resolution

1. `.planning/config.json` has zero unknown keys per `gsd-tools` (blocking verification)
2. Written record of which option was chosen for Class B with rejection reasons for others
3. If external-AI cross-check performed: summary recorded here
4. Memory updated: `memory/project_state.md` references the resolution path chosen
5. Tech debt entry in PROJECT.md removed or updated to reflect resolution status

## Cross-references

- `memory/feedback_verify_upstream_scope.md` (discipline)
- `memory/project_upstream_issues.md` (if upstream issue filed)
- PROJECT.md Key Decisions (v0.2.0 `effort`/`teams` additions)
- v1.2.0 REQUIREMENTS.md (existing UPGRADE-03 override staleness pattern as precedent)
- Phase 39 `_auto_chain_active` fix (same class of problem, fork-specific resolution)

## Do NOT

- Do not migrate Class A drift keys without checking fork code that reads the old names (silent breakage risk)
- Do not file upstream PR for Option A without external-AI cross-check first
- Do not add Option B without accepting the maintenance cost trade-off explicitly
- Do not add the Subtask 4 schema drift gate to v1.2.0 scope mid-milestone

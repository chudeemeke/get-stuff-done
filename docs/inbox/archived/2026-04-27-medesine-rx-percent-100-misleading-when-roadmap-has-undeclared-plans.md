---
schema_version: "1.3"
source_project: medesine-rx
created: 2026-04-27
type: bug
severity: medium
fix_status: merged
affects_scope: all-consumers
priority_rationale: "User-facing telemetry. STATE.md frontmatter is read by hooks, scripts, and humans. Misleading 100% when reality is ~47% breaks trust in the metric."
status: merged
next_owner: get-stuff-done
triaged_at: 2026-04-29
resolved_at: 2026-07-03
pr_url: https://github.com/chudeemeke/get-stuff-done/pull/3
---

# `state` and `roadmap analyze` report `percent: 100` when ROADMAP has undeclared plans

## Resolution (2026-07-01)

Resolved in PR https://github.com/chudeemeke/get-stuff-done/pull/3 at commit `613f595463d7fd712b81fe3126346097cfdac176`.

The fix counts ROADMAP-declared `**Plans:**` / `**Plans**:` totals and uses the effective max of disk PLAN files and declared ROADMAP plan totals. Regression coverage was added for both the compatibility source and the composed Open GSD runtime.

## Symptom

After adding 5 new phases (32 plans) to ROADMAP.md and running `gsd-tools state record-session`, the auto-generated YAML frontmatter on STATE.md shows:

```yaml
progress:
  total_phases: 18
  completed_phases: 9
  total_plans: 36
  completed_plans: 36
  percent: 100
```

`percent: 100` is misleading. The real picture:
- 36 plans on disk, all complete (Phases 1, 2, 3, 3.1, 4, 5, 5.1, 5.2, 5.3 = 9 phases × varying plans)
- 41 additional plans declared in ROADMAP body (Phase 0 = 2; 5.4 = 6; 5.5 = 10; 5.6 = 4; 5.7 = 6; 5.8 = 6; 6 = 3; 7 = 3; 8 = 1)
- Real total: 77 plans, 36 complete → ~47%, not 100%

`gsd-tools roadmap analyze` reports the same `progress_percent: 100` for the same reason.

## Repro

1. Project with ROADMAP.md containing both:
   - Completed phases with plan files on disk (PLAN/SUMMARY pairs)
   - Future phases declared in ROADMAP body as plan listings (e.g. `- [ ] 05.4-01-PLAN.md -- ...`) but NO disk directory yet
2. Run `gsd-tools state record-session --stopped-at "test"`
3. Observe `STATE.md` frontmatter `progress.percent` reads 100 when honest reading is ~47%.

Repro repo: `medesine-rx` at HEAD (commit `bae418c` `docs(state): record Phase 5.4 context session`).

## Root cause

Both `state.cjs::buildStateFrontmatter` and `roadmap.cjs::cmdRoadmapAnalyze` derive plan counts from **disk file existence only**:

### `bin/lib/state.cjs` (lines ~685-702)

```js
let diskTotalPlans = 0;
let diskTotalSummaries = 0;
// ...
for (const dir of phaseDirs) {
  const files = fs.readdirSync(path.join(phasesDir, dir));
  const plans = files.filter(f => f.match(/-PLAN\.md$/i)).length;
  const summaries = files.filter(f => f.match(/-SUMMARY\.md$/i)).length;
  diskTotalPlans += plans;
  diskTotalSummaries += summaries;
  // ...
}
totalPlans = diskTotalPlans;
completedPlans = diskTotalSummaries;
```

Then percent = `completedPlans / totalPlans`. When all disk-known plans are complete, percent=100% even if many plans are declared in ROADMAP and not yet started.

### `bin/lib/roadmap.cjs` (lines ~149-176, 220-221)

Per-phase parsing reads PLAN.md/SUMMARY.md file counts from `phasesDir/<phase>/`:
```js
planCount = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
summaryCount = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;
```

Aggregate at lines 220-221:
```js
const totalPlans = phases.reduce((sum, p) => sum + p.plan_count, 0);
const totalSummaries = phases.reduce((sum, p) => sum + p.summary_count, 0);
```

Same gap — only counts disk artifacts; ROADMAP-declared-but-unstarted plans contribute 0.

## Proposed fix

Parse plan listings from each phase section in ROADMAP body. Use `Math.max(disk_plan_count, roadmap_declared_plan_count)` as the effective total per phase.

### Patch 1: `bin/lib/roadmap.cjs` — per-phase parsing

In the per-phase loop in `cmdRoadmapAnalyze` (around line 132-201), after the existing disk-counting and roadmap-checkbox-status logic, add:

```js
// Count plan listings declared in ROADMAP body for this phase section.
// Format examples:
//   - [x] 04-03-PLAN.md -- description
//   - [ ] 06-01: short description (placeholder phases without files yet)
// Both XX-NN-PLAN.md and XX-NN: forms are matched.
const planLineRegex = /^\s*-\s*\[([ x])\]\s+\d+(?:\.\d+)?-\d+/gm;
let roadmapPlanCount = 0;
let roadmapCompletedPlanCount = 0;
let planLineMatch;
while ((planLineMatch = planLineRegex.exec(section)) !== null) {
  roadmapPlanCount++;
  if (planLineMatch[1] === 'x') roadmapCompletedPlanCount++;
}
```

Add to the phase-object push:
```js
phases.push({
  // ...existing fields...
  roadmap_plan_count: roadmapPlanCount,
  roadmap_completed_plan_count: roadmapCompletedPlanCount,
});
```

Update aggregation (lines 220-221):
```js
const totalPlans = phases.reduce((sum, p) =>
  sum + Math.max(p.plan_count, p.roadmap_plan_count), 0);
const totalSummaries = phases.reduce((sum, p) =>
  sum + Math.max(p.summary_count, p.roadmap_completed_plan_count), 0);
```

### Patch 2: `bin/lib/roadmap.cjs` — export helper

Add an exported helper that `state.cjs` can call (avoids duplicating the parser):

```js
/**
 * Count plan listings declared in ROADMAP.md across all phase sections.
 * Used by state.cjs to reconcile disk-only plan counts with roadmap-declared
 * plans so progress_percent reflects the full project, not just files-on-disk.
 *
 * @param {string} content - ROADMAP.md content (caller may milestone-scope first)
 * @returns {{totalDeclared: number, totalCompleted: number}}
 */
function countRoadmapPlans(content) {
  if (!content) return { totalDeclared: 0, totalCompleted: 0 };

  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
  const phaseMatches = [];
  let m;
  while ((m = phasePattern.exec(content)) !== null) {
    phaseMatches.push({ index: m.index });
  }

  let totalDeclared = 0;
  let totalCompleted = 0;
  for (let i = 0; i < phaseMatches.length; i++) {
    const start = phaseMatches[i].index;
    const end = i + 1 < phaseMatches.length ? phaseMatches[i + 1].index : content.length;
    const section = content.slice(start, end);
    const planLineRegex = /^\s*-\s*\[([ x])\]\s+\d+(?:\.\d+)?-\d+/gm;
    let planMatch;
    while ((planMatch = planLineRegex.exec(section)) !== null) {
      totalDeclared++;
      if (planMatch[1] === 'x') totalCompleted++;
    }
  }

  return { totalDeclared, totalCompleted };
}

module.exports = {
  cmdRoadmapGetPhase,
  cmdRoadmapAnalyze,
  cmdRoadmapUpdatePlanProgress,
  countRoadmapPlans,  // NEW
};
```

### Patch 3: `bin/lib/state.cjs` — reconcile in buildStateFrontmatter

Import the helper at top:
```js
const { countRoadmapPlans } = require('./roadmap.cjs');
const { extractCurrentMilestone } = require('./core.cjs');  // if not already imported
```

In `buildStateFrontmatter`, after the existing disk-counting block (around line 705), before `progressPercent` calculation:

```js
// Reconcile with ROADMAP.md declared plans.
// Phases declared in ROADMAP without disk artifacts (yet to start) contribute
// to total_plans via roadmap_plan_count, so progress_percent reflects the
// full roadmap, not just files-on-disk.
if (cwd) {
  try {
    const roadmapPath = planningPaths(cwd).roadmap;
    if (fs.existsSync(roadmapPath)) {
      const rawRoadmap = fs.readFileSync(roadmapPath, 'utf8');
      const scoped = extractCurrentMilestone(rawRoadmap, cwd);
      const counts = countRoadmapPlans(scoped);
      if (counts && counts.totalDeclared > 0) {
        totalPlans = Math.max(totalPlans || 0, counts.totalDeclared);
        completedPlans = Math.max(completedPlans || 0, counts.totalCompleted);
      }
    }
  } catch { /* intentionally empty */ }
}
```

`progressPercent` calculation that follows will then use the corrected totals.

## Test plan

### Unit tests for `countRoadmapPlans` (new)

```js
// test/lib/roadmap-count-plans.test.js (or wherever roadmap tests live)
const { countRoadmapPlans } = require('../../bin/lib/roadmap.cjs');

test('counts unchecked and checked plan listings across phases', () => {
  const content = `
### Phase 1: Foundation
Plans:
- [x] 01-01-PLAN.md -- A
- [x] 01-02-PLAN.md -- B

### Phase 2: Identity
Plans:
- [x] 02-01-PLAN.md -- C
- [ ] 02-02-PLAN.md -- D

### Phase 3: Future
Plans:
- [ ] 03-01-PLAN.md -- E
`;
  const result = countRoadmapPlans(content);
  expect(result.totalDeclared).toBe(5);
  expect(result.totalCompleted).toBe(3);
});

test('handles placeholder XX-NN: form (no -PLAN.md suffix)', () => {
  const content = `
### Phase 0: Pre-Development
Plans:
- [ ] 00-01: Business incorporation
- [ ] 00-02: Service account setup
`;
  const result = countRoadmapPlans(content);
  expect(result.totalDeclared).toBe(2);
  expect(result.totalCompleted).toBe(0);
});

test('does not match phase summary list (** Phase X: **)', () => {
  const content = `
- [x] **Phase 5.3: Quality Remediation** - description
- [ ] **Phase 5.4: Operational Hardening** - description

### Phase 5.3: Quality Remediation
Plans:
- [x] 05.3-01-PLAN.md -- A
`;
  const result = countRoadmapPlans(content);
  expect(result.totalDeclared).toBe(1);  // only the 05.3-01 inside the section
  expect(result.totalCompleted).toBe(1);
});

test('handles empty content gracefully', () => {
  expect(countRoadmapPlans('')).toEqual({ totalDeclared: 0, totalCompleted: 0 });
  expect(countRoadmapPlans(null)).toEqual({ totalDeclared: 0, totalCompleted: 0 });
});
```

### Integration test for `state.cjs` reconciliation

```js
test('STATE.md frontmatter percent reflects declared-but-unstarted plans', () => {
  // Setup: project with 2 phases on disk (1 PLAN+SUMMARY each, both complete)
  //        + 1 phase declared in ROADMAP with 4 unchecked plan listings
  // Expected: total_plans=6, completed_plans=2, percent=33 (not 100)
  // ...
});
```

### Regression test for existing behaviour

Confirm projects with no ROADMAP-declared-but-unstarted plans still report `percent: 100` correctly when all disk plans are complete (i.e., the fix shouldn't change behaviour for projects that don't exhibit the bug).

## Suggested commit message

```
fix(state, roadmap): include ROADMAP-declared plans in progress percent

Both `state record-session` (writing STATE.md frontmatter) and `roadmap
analyze` derived plan counts from disk file existence only. Phases
declared in ROADMAP without disk artifacts (yet to start) contributed 0
to total_plans, so progress_percent read 100% when all disk-known plans
were complete -- even if many plans were declared in ROADMAP and unstarted.

Add per-phase `roadmap_plan_count` / `roadmap_completed_plan_count` parsed
from each phase section's body. Aggregate via Math.max(disk, roadmap) so
phases that have started use disk truth, and phases that haven't started
contribute their declared plan count.

Export `countRoadmapPlans(content)` from roadmap.cjs for reuse in
state.cjs::buildStateFrontmatter.

Repro: medesine-rx with 36 disk plans (all complete) + 41 plans declared
in ROADMAP body across Phases 0, 5.4-5.8, 6-8 reported percent: 100.
After fix: percent reflects 36/77 ≈ 47%.
```

## Suggested CHANGELOG entry

```
### Fixed
- `state record-session` and `roadmap analyze` now include
  ROADMAP-declared-but-unstarted plans in `total_plans`. Previously,
  projects that added phases to ROADMAP without creating phase
  directories would see `percent: 100` even when most plans were
  unstarted.
```

## Risks / things to verify before merging

1. **Edge case: phase declared in ROADMAP summary list but no detail section.** The phase-pattern regex matches H3 phase headers. If a phase appears only in the top-level summary list (`- [ ] **Phase X:** desc`) without a `### Phase X:` section, it won't be counted. Probably correct — incomplete ROADMAPs shouldn't contribute — but worth confirming via test.

2. **Milestone scoping.** `state.cjs` already milestone-scopes the disk loop. The reconciliation step uses `extractCurrentMilestone` to scope ROADMAP content too, so post-shipped milestones don't leak into current-milestone counts. Verify with a multi-milestone test fixture.

3. **Performance.** ROADMAP file is read+parsed once per `state record-session` call. Negligible at typical sizes (~25 KB). Worth a perf check if ROADMAPs ever exceed 100 KB.

4. **Plan-line regex robustness.** The pattern `/^\s*-\s*\[([ x])\]\s+\d+(?:\.\d+)?-\d+/gm` may need broadening if your projects use other plan-listing formats. Test with the full set of ROADMAPs across your projects (medesine-rx, conversations, authkey, memory-nexus, etc.) before merge.

5. **Source-of-truth alignment.** I read these files at `~/.claude/get-shit-done/bin/lib/state.cjs` and `roadmap.cjs` (the global install). Your fork at `~/Projects/get-stuff-done/bin/lib/` is the upstream source. Line numbers may differ slightly. Patches are illustrative — adapt to fork's actual code.

## Related

- Project: `medesine-rx` (commit `bae418c` reproduces the symptom)
- Existing rule that nearly led to wrong fix path: `~/.claude/rules/tool-friction.md` recommends `memory friction log` for friction; this is heavier than friction (proposed patch + tests), hence routing here as an issue not a friction entry
- No CHANGELOG entry filed yet (this is the proposal)

## What I did NOT do (correctly)

- Did NOT edit `~/.claude/get-shit-done/bin/lib/*.cjs` directly. Global install is downstream of your fork; modifying it is the wrong layer.
- Did NOT propose a workaround in `medesine-rx` (e.g., manually overriding the frontmatter) because the bug affects every project that adds future phases to ROADMAP — a fork-side fix benefits all consumers.

---

*Submitted by: medesine-rx Claude Code session*
*Date: 2026-04-27*
*Migrated to schema v1.1: 2026-04-27 (was v1; renamed `proposed_fix_included` → `fix_status`, `affects_users` → `affects_scope`, added `schema_version` and `status`)*

---

## Triage 2026-04-29 (get-stuff-done)

**Validation against fork code:**

- **`bin/lib/roadmap.cjs:211` — `cmdRoadmapAnalyze`: VALID.** `progress_percent = totalSummaries / totalPlans` where `totalPlans` is summed from disk-only `plan_count`. ROADMAP-declared but undirected phases contribute 0.
- **`bin/lib/state.cjs::buildStateFrontmatter`: VALID** (same pattern by inspection — disk-only counting in the phase loop).

**Phase 40.5 risk: REAL at completion.** Current STATE.md frontmatter:
```yaml
total_phases: 7
total_plans: 5      # only Phase 40.5's 5 disk PLAN files
completed_plans: 0
```

When Phase 40.5 Wave 5 completes, all 5 SUMMARY.md files land → `completed_plans: 5, total_plans: 5, percent: 100` — while Phases 41–44 still have ~30+ plans declared in ROADMAP body but no disk artifacts. STATE.md will mislead the next session's resume briefing into thinking the milestone is complete.

**Disposition: RESOLVED 2026-07-01 in PR #3.**

Rationale: Post-migration verification confirmed disk-only counting still existed in the active fork/runtime surface. Commit `613f595463d7fd712b81fe3126346097cfdac176` counts ROADMAP-declared plan totals and added source plus composed-runtime regressions.

**Status:** `resolved`.

## Archive Decision -- 2026-07-03

Moved to archived audit trail because the item is already terminal in the root-local inbox: status merged, resolved_at 2026-07-01, PR https://github.com/chudeemeke/get-stuff-done/pull/3.

## Event Log
<!-- inbox-events:v1 -->
- 2026-07-03T17:19:30.000Z | get-stuff-done | merged | Archived terminal PR #3 roadmap-declared plan counting fix record into tracked audit trail.
- 2026-06-26T22:36:18.724Z | conversations | correction | Added next_owner for coordination-audit ownership routing; receiver project still owns lifecycle/content triage.
- 2026-07-01T19:55:18.000Z | get-stuff-done | merged | Fixed in PR #3 at commit 613f595463d7fd712b81fe3126346097cfdac176.

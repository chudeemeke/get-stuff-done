'use strict';
// Behavioral extracts from runtime-overrides.test.cjs and roadmap.test.cjs.
// Diagnostic fields and private adapter imports are intentionally not requirements.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const packageRoot = process.env.GSD_COMPARISON_PACKAGE;
assert.ok(packageRoot && path.isAbsolute(packageRoot));
const tool = path.join(packageRoot, 'gsd-core/bin/gsd-tools.cjs');
assert.ok(fs.statSync(tool).isFile());
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'behavior-'));
  function write(name, text) {
    const file = path.join(dir, '.planning', name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
  function query(...args) {
    const result = spawnSync(process.execPath, [tool, 'query', ...args], {
      cwd: dir, env: process.env, encoding: 'utf8', timeout: 30000,
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.ok(!output.error, JSON.stringify(output));
    return output;
  }
  // Retain disposable fixtures for independent inspection; no cleanup can hide a result.
  return { dir, write, query, read: name => fs.readFileSync(path.join(dir, '.planning', name), 'utf8') };
}
function currentPhaseFixture() {
  const f = fixture();
  f.write('ROADMAP.md', '# Roadmap\n\n### v1.2.0 Current Milestone -- ACTIVE\n\n### Phase 40.5: Older Work\n**Plans**: 2 plans\n\n### Phase 41: Current Work\n**Plans**: 2 plans\n\n### Phase 42: Next Work\n**Plans**: 1 plan\n');
  f.write('STATE.md', '# Session State\n\n## Current Position\n\nPhase: Phase 41 (executing) -- Current Work\nStatus: In progress\n');
  f.write('phases/40.5-older-work/40.5-01-PLAN.md', '# Plan');
  f.write('phases/41-current-work/41-01-PLAN.md', '# Plan');
  f.write('phases/999.1-backlog/999.1-01-PLAN.md', '# Backlog');
  return f;
}
test('roadmap chooses active phase 41 and next roadmap phase 42 over older work and backlog', () => {
  const output = currentPhaseFixture().query('roadmap.analyze');
  assert.equal(output.current_phase, '41', JSON.stringify(output));
  assert.equal(output.next_phase, '42', JSON.stringify(output));
});
test('init chooses active phase 41 and next roadmap phase 42 over older work and backlog', () => {
  const output = currentPhaseFixture().query('init.progress');
  assert.equal(output.current_phase?.number, '41', JSON.stringify(output));
  assert.equal(output.next_phase?.number, '42', JSON.stringify(output));
});
function milestoneFixture() {
  const f = fixture();
  f.write('ROADMAP.md', '# Roadmap\n\n## Milestones\n\n- SHIPPED **v4.0 Intelligence Layer**\n- IN PROGRESS **v5.0 Market-Leader Memory Platform**\n\n### v4.0 Intelligence Layer (Phases 30-37)\n\n- [x] **Phase 30: Historical Work** - Shipped v4 work.\n\n### v5.0 Market-Leader Memory Platform (Phases 38.0-44)\n\n- [x] **Phase 41.1: Embedding Pipeline Resilience** - Complete.\n- [ ] **Phase 42: Dreaming Consolidation** - Active.\n- [ ] **Phase 42.5: Feature Completeness** - Pending.\n\n## Phase Details\n\n### Phase 30: Historical Work\n**Plans:** 1 plan\n\n---\n\n### Phase 41.1: Embedding Pipeline Resilience\n**Plans:** 1 plan\n\n---\n\n### Phase 42: Dreaming Consolidation\n**Goal:** Consolidate memory dreams.\n**Plans:** 1 plan\n\n---\n\n### Phase 42.5: Feature Completeness\n**Plans:** 1 plan\n');
  f.write('STATE.md', '---\nmilestone: v4.0\nmilestone_name: Intelligence Layer\n---\n\n# Project State\n\n**Current Focus:** Phase 42 - dreaming-consolidation\n\nPhase: 42 (Dreaming Consolidation) - NEXT\n**Milestone:** v5.0 Market-Leader Memory Platform\n');
  return f;
}
test('roadmap excludes the old milestone despite stale STATE frontmatter', () => {
  const output = milestoneFixture().query('roadmap.analyze');
  assert.equal(output.current_phase, '42', JSON.stringify(output));
  assert.ok(output.phases.some(p => p.number === '42'), JSON.stringify(output));
  assert.ok(!output.phases.some(p => p.number === '30'), JSON.stringify(output));
});
test('execute-phase resolves the current milestone despite stale STATE frontmatter', () => {
  const output = milestoneFixture().query('init.execute-phase', '42');
  assert.equal(output.phase_found, true, JSON.stringify(output));
  assert.equal(output.milestone_version, 'v5.0', JSON.stringify(output));
});
function declaredFixture() {
  const f = fixture();
  f.write('STATE.md', '# Project State\n\n**Progress:** [----------] 0%\n');
  f.write('ROADMAP.md', '# Roadmap\n\n### v1.2.0 Current Milestone -- ACTIVE\n\n### Phase 1: Complete Slice\n**Plans**: 1 plan\n\n### Phase 2: Future Slice\n**Plans**: 4 plans\n');
  f.write('phases/01-complete-slice/01-01-PLAN.md', '# Plan');
  f.write('phases/01-complete-slice/01-01-SUMMARY.md', '# Summary');
  return f;
}
test('state includes declared future plans in its completion denominator', () => {
  const output = declaredFixture().query('state.update-progress');
  assert.equal(output.percent, 20, JSON.stringify(output));
  assert.equal(output.completed, 1, JSON.stringify(output));
  assert.equal(output.total, 5, JSON.stringify(output));
});
test('roadmap includes declared future plans in its completion denominator', () => {
  const output = declaredFixture().query('roadmap.analyze');
  assert.equal(output.total_plans, 5, JSON.stringify(output));
  assert.equal(output.total_summaries, 1, JSON.stringify(output));
  assert.equal(output.progress_percent, 20, JSON.stringify(output));
});
test('plan classifier excludes review packets while retaining valid legacy plans', () => {
  const planScan = require(path.join(packageRoot, 'gsd-core/bin/lib/plan-scan.cjs'));
  for (const name of ['42-PLAN-REVIEW.md', '43-FABLE-PLAN11AC-ADJUDICATION-PACKET-2026-07-19.md']) {
    assert.equal(planScan.isRootPlanFile(name), false, name);
  }
  for (const name of ['PLAN.md', '42-01-PLAN.md', 'legacy-plan-draft.md']) {
    assert.equal(planScan.isRootPlanFile(name), true, name);
  }
});
test('roadmap mutation changes the exact phase and preserves CRLF and unrelated bytes', () => {
  const f = fixture();
  const lines = ['# Roadmap', '', '- [ ] **Phase 09.2:** Prep notes that mention Phase 09.3 follow-up',
    '- [ ] **Phase 09.3:** Secure note flow', '', '### Phase 09.2: Prep', '**Plans:** 1 plan', '',
    '### Phase 09.3: Secure Notes', '**Plans:** 0/1 plans executed', '', 'Owner text with trailing spaces  ', ''];
  const before = lines.join('\r\n');
  f.write('ROADMAP.md', before);
  f.write('phases/09.3-secure-notes/09.3-01-PLAN.md', '# Plan');
  f.write('phases/09.3-secure-notes/09.3-01-SUMMARY.md', '# Summary');
  f.write('phases/09.3-secure-notes/09.3-VERIFICATION.md', '---\nphase: 09.3\nstatus: passed\n---\n');
  f.query('roadmap.update-plan-progress', '09.3');
  const after = f.read('ROADMAP.md');
  const date = after.match(/\(completed (\d{4}-\d{2}-\d{2})\)/)?.[1];
  assert.ok(date, after);
  const expected = before.replace('- [ ] **Phase 09.3:** Secure note flow', `- [x] **Phase 09.3:** Secure note flow (completed ${date})`)
    .replace('**Plans:** 0/1 plans executed', '**Plans:** 1/1 plans complete\r\n- [x] 09.3-01-PLAN.md');
  assert.equal(after, expected);
});

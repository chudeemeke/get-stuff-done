/**
 * GSD Tools Tests - Roadmap
 */

const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { resolveCompatPackageRoot } = require('./helpers/compat-package-root.cjs');
const COMPAT_PACKAGE_ROOT = resolveCompatPackageRoot();
const { createGsdToolsHelpers, createTempProject, cleanup } = require('./helpers.cjs');
const { captureCommandOutput } = require('./helpers/capture-command-output.cjs');
const { runGsdTools } = createGsdToolsHelpers(COMPAT_PACKAGE_ROOT);
const roadmapPersistence = require(
  path.join(COMPAT_PACKAGE_ROOT, 'bin', 'lib', 'fork-roadmap-persistence.cjs')
);
const { cmdRoadmapUpdatePlanProgress } = require(
  path.join(COMPAT_PACKAGE_ROOT, 'bin', 'lib', 'roadmap.cjs')
);
const planScan = require(
  path.join(COMPAT_PACKAGE_ROOT, 'bin', 'lib', 'plan-scan.cjs')
);

describe('shared plan-scan contract', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('excludes PLAN-REVIEW derivatives without narrowing supported plan names', () => {
    assert.strictEqual(planScan.isRootPlanFile('42-PLAN-REVIEW.md'), false);
    assert.strictEqual(planScan.isRootPlanFile('42-plan-review.MD'), false);
    assert.strictEqual(planScan.isRootPlanFile('PLAN-REVIEW.md'), false);
    assert.strictEqual(planScan.isRootPlanFile('PLAN.md'), true);
    assert.strictEqual(planScan.isRootPlanFile('42-01-PLAN.md'), true);
    assert.strictEqual(planScan.isRootPlanFile('legacy-plan-draft.md'), true);
    assert.strictEqual(planScan.isNestedPlanFile('PLAN-01.md'), true);
    assert.strictEqual(planScan.isNestedPlanFile('42-PLAN-01.md'), true);
  });

  test('does not include PLAN-REVIEW derivatives in phase scan totals', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '42-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '42-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '42-PLAN-REVIEW.md'), '# Review');

    const result = planScan.scanPhasePlans(phaseDir);

    assert.strictEqual(result.planCount, 1);
    assert.deepStrictEqual(result.planFiles, ['42-01-PLAN.md']);
  });
});

describe('roadmap get-phase command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('extracts phase section from ROADMAP.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phases

### Phase 1: Foundation
**Goal:** Set up project infrastructure
**Plans:** 2 plans

Some description here.

### Phase 2: API
**Goal:** Build REST API
**Plans:** 3 plans
`
    );

    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.found, true, 'phase should be found');
    assert.strictEqual(output.phase_number, '1', 'phase number correct');
    assert.strictEqual(output.phase_name, 'Foundation', 'phase name extracted');
    assert.strictEqual(output.goal, 'Set up project infrastructure', 'goal extracted');
  });

  test('returns not found for missing phase', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Set up project
`
    );

    const result = runGsdTools('roadmap get-phase 5', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.found, false, 'phase should not be found');
  });

  test('handles decimal phase numbers', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 2: Main
**Goal:** Main work

### Phase 2.1: Hotfix
**Goal:** Emergency fix
`
    );

    const result = runGsdTools('roadmap get-phase 2.1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.found, true, 'decimal phase should be found');
    assert.strictEqual(output.phase_name, 'Hotfix', 'phase name correct');
    assert.strictEqual(output.goal, 'Emergency fix', 'goal extracted');
  });

  test('extracts full section content', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Setup
**Goal:** Initialize everything

This phase covers:
- Database setup
- Auth configuration
- CI/CD pipeline

### Phase 2: Build
**Goal:** Build features
`
    );

    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.section.includes('Database setup'), 'section includes description');
    assert.ok(output.section.includes('CI/CD pipeline'), 'section includes all bullets');
    assert.ok(!output.section.includes('Phase 2'), 'section does not include next phase');
  });

  test('handles missing ROADMAP.md gracefully', () => {
    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.found, false, 'should return not found');
    assert.strictEqual(output.error, 'ROADMAP.md not found', 'should explain why');
  });

  test('accepts ## phase headers (two hashes)', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phase 1: Foundation
**Goal:** Set up project infrastructure
**Plans:** 2 plans

## Phase 2: API
**Goal:** Build REST API
`
    );

    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.found, true, 'phase with ## header should be found');
    assert.strictEqual(output.phase_name, 'Foundation', 'phase name extracted');
    assert.strictEqual(output.goal, 'Set up project infrastructure', 'goal extracted');
  });

  test('detects malformed ROADMAP with summary list but no detail sections', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phases

- [ ] **Phase 1: Foundation** - Set up project
- [ ] **Phase 2: API** - Build REST API
`
    );

    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.found, false, 'phase should not be found');
    assert.strictEqual(output.error, 'malformed_roadmap', 'should identify malformed roadmap');
    assert.ok(output.message.includes('missing'), 'should explain the issue');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phase next-decimal command
// ─────────────────────────────────────────────────────────────────────────────


describe('roadmap analyze command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('missing ROADMAP.md returns error', () => {
    const result = runGsdTools('roadmap analyze', tmpDir);
    assert.ok(result.success, `Command should succeed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.error, 'ROADMAP.md not found');
  });

  test('parses phases with goals and disk status', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Set up infrastructure

### Phase 2: Authentication
**Goal:** Add user auth

### Phase 3: Features
**Goal:** Build core features
`
    );

    // Create phase dirs with varying completion
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');

    const p2 = path.join(tmpDir, '.planning', 'phases', '02-authentication');
    fs.mkdirSync(p2, { recursive: true });
    fs.writeFileSync(path.join(p2, '02-01-PLAN.md'), '# Plan');

    const result = runGsdTools('roadmap analyze', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_count, 3, 'should find 3 phases');
    assert.strictEqual(output.phases[0].disk_status, 'complete', 'phase 1 complete');
    assert.strictEqual(output.phases[1].disk_status, 'planned', 'phase 2 planned');
    assert.strictEqual(output.phases[2].disk_status, 'no_directory', 'phase 3 no directory');
    assert.strictEqual(output.completed_phases, 1, '1 phase complete');
    assert.strictEqual(output.total_plans, 2, '2 total plans');
    assert.strictEqual(output.total_summaries, 1, '1 total summary');
    assert.strictEqual(output.progress_percent, 50, '50% complete');
    assert.strictEqual(output.current_phase, '2', 'current phase is 2');
  });

  test('extracts goals and dependencies', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Setup
**Goal:** Initialize project
**Depends on:** Nothing

### Phase 2: Build
**Goal:** Build features
**Depends on:** Phase 1
`
    );

    const result = runGsdTools('roadmap analyze', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phases[0].goal, 'Initialize project');
    assert.strictEqual(output.phases[0].depends_on, 'Nothing');
    assert.strictEqual(output.phases[1].goal, 'Build features');
    assert.strictEqual(output.phases[1].depends_on, 'Phase 1');
  });

  test('does not inflate plan totals for a PLAN-REVIEW artifact', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 42: Foundation
**Goal:** Build the foundation
**Plans:** 1 plan
`
    );
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '42-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '42-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '42-PLAN-REVIEW.md'), '# Review');

    const result = runGsdTools('roadmap analyze', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);

    assert.strictEqual(output.total_plans, 1);
    assert.strictEqual(output.phases[0].disk_plan_count, 1);
    assert.strictEqual(output.phases[0].plan_count, 1);
  });

  test('counts ROADMAP-declared plans so future work is not hidden', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Complete Slice
**Goal:** Ship first slice
**Plans:** 1 plan

### Phase 2: Future Slice
**Goal:** Ship remaining work
**Plans**: 4 plans
`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-complete-slice');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');

    const result = runGsdTools('roadmap analyze', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phases[0].plan_count, 1, 'phase 1 counts disk/declared plan');
    assert.strictEqual(output.phases[1].plan_count, 4, 'phase 2 counts declared future plans');
    assert.strictEqual(output.total_plans, 5, 'total plans include ROADMAP-declared future work');
    assert.strictEqual(output.total_summaries, 1, 'summaries remain disk-backed');
    assert.strictEqual(output.progress_percent, 20, 'progress should not report 100% with future work remaining');
  });

  test('prefers STATE current phase over older partial phases', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 40.5: Older Cleanup
**Goal:** Retired active work
**Plans:** 2 plans

### Phase 41: Current Hardening
**Goal:** Active work
**Plans**: 2 plans

### Phase 42: Next Work
**Goal:** Future work
**Plans:** 1 plan
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# Session State

## Current Position

Phase: Phase 41 (executing) -- Current Hardening
Status: In progress
`
    );

    const older = path.join(tmpDir, '.planning', 'phases', '40.5-older-cleanup');
    fs.mkdirSync(older, { recursive: true });
    fs.writeFileSync(path.join(older, '40.5-01-PLAN.md'), '# Plan');

    const current = path.join(tmpDir, '.planning', 'phases', '41-current-hardening');
    fs.mkdirSync(current, { recursive: true });
    fs.writeFileSync(path.join(current, '41-01-PLAN.md'), '# Plan');

    const result = runGsdTools('roadmap analyze', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.state_current_phase, '41', 'STATE current phase is surfaced');
    assert.strictEqual(output.current_phase, '41', 'STATE current phase wins over stale older partial phase');
  });
});

describe('roadmap update-plan-progress command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('checks only the exact checklist phase and preserves CRLF endings', () => {
    const roadmapPath = path.join(tmpDir, '.planning', 'ROADMAP.md');
    const roadmapContent = [
      '# Roadmap',
      '',
      '- [ ] **Phase 09.2:** Prep notes that mention Phase 09.3 follow-up',
      '- [ ] **Phase 09.3:** Secure note flow',
      '',
      '### Phase 09.2: Prep',
      '**Plans:** 1 plan',
      '',
      '### Phase 09.3: Secure Notes',
      '**Plans:** 0/1 plans executed',
      '',
    ].join('\r\n');
    fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

    const phaseDir = path.join(tmpDir, '.planning', 'phases', '09.3-secure-notes');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '09.3-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '09.3-01-SUMMARY.md'), '# Summary');

    const result = runGsdTools('roadmap update-plan-progress 09.3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    const updated = fs.readFileSync(roadmapPath, 'utf-8');
    const completedDate = updated.match(/\(completed (\d{4}-\d{2}-\d{2})\)/)?.[1];
    const expected = [
      '# Roadmap',
      '',
      '- [ ] **Phase 09.2:** Prep notes that mention Phase 09.3 follow-up',
      `- [x] **Phase 09.3:** Secure note flow (completed ${completedDate})`,
      '',
      '### Phase 09.2: Prep',
      '**Plans:** 1 plan',
      '',
      '### Phase 09.3: Secure Notes',
      '**Plans:** 1/1 plans complete',
      '- [x] 09.3-01-PLAN.md',
      '',
    ].join('\r\n');

    assert.strictEqual(output.updated, true, 'roadmap should be updated');
    assert.match(completedDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.strictEqual(updated, expected, 'only the requested phase and plan bytes should change');
    assert.strictEqual(updated.replace(/\r\n/g, '').includes('\n'), false, 'no bare LF should remain');
  });

  test('preserves LF roadmap bytes outside the requested progress edits', () => {
    const roadmapPath = path.join(tmpDir, '.planning', 'ROADMAP.md');
    const roadmapContent = [
      '# Roadmap',
      '',
      '- [ ] **Phase 10:** Delivery',
      '',
      '### Phase 10: Delivery',
      '**Plans:** 0/1 plans executed',
      'Keep  trailing spaces  ',
      '',
    ].join('\n');
    fs.writeFileSync(roadmapPath, roadmapContent, 'utf8');

    const phaseDir = path.join(tmpDir, '.planning', 'phases', '10-delivery');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '10-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '10-01-SUMMARY.md'), '# Summary');

    const result = runGsdTools('roadmap update-plan-progress 10', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const updated = fs.readFileSync(roadmapPath, 'utf8');
    const completedDate = updated.match(/\(completed (\d{4}-\d{2}-\d{2})\)/)?.[1];
    const expected = [
      '# Roadmap',
      '',
      `- [x] **Phase 10:** Delivery (completed ${completedDate})`,
      '',
      '### Phase 10: Delivery',
      '**Plans:** 1/1 plans complete',
      '- [x] 10-01-PLAN.md',
      'Keep  trailing spaces  ',
      '',
    ].join('\n');

    assert.match(completedDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.strictEqual(updated, expected);
    assert.strictEqual(updated.includes('\r'), false);
  });

  test('propagates publication failure without mutating the roadmap', () => {
    const roadmapPath = path.join(tmpDir, '.planning', 'ROADMAP.md');
    const roadmapContent = [
      '# Roadmap',
      '',
      '- [ ] **Phase 11:** Locked',
      '',
      '### Phase 11: Locked',
      '**Plans:** 0/1 plans executed',
      '',
    ].join('\n');
    fs.writeFileSync(roadmapPath, roadmapContent, 'utf8');

    const phaseDir = path.join(tmpDir, '.planning', 'phases', '11-locked');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '11-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '11-01-SUMMARY.md'), '# Summary');

    const publishError = Object.assign(new Error('roadmap locked'), { code: 'EPERM' });
    mock.method(roadmapPersistence, 'publishRoadmapPreservingBytes', () => {
      throw publishError;
    });
    try {
      assert.throws(
        () => cmdRoadmapUpdatePlanProgress(tmpDir, '11', false),
        publishError
      );
      assert.strictEqual(fs.readFileSync(roadmapPath, 'utf8'), roadmapContent);
    } finally {
      mock.restoreAll();
    }
  });

  test('reports updated false when publication suppresses a no-op', () => {
    const roadmapPath = path.join(tmpDir, '.planning', 'ROADMAP.md');
    fs.writeFileSync(roadmapPath, [
      '# Roadmap',
      '',
      '- [ ] **Phase 12:** Stable',
      '',
      '### Phase 12: Stable',
      '**Plans:** 0/1 plans executed',
      '',
    ].join('\n'), 'utf8');

    const phaseDir = path.join(tmpDir, '.planning', 'phases', '12-stable');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '12-01-PLAN.md'), '# Plan');

    mock.method(roadmapPersistence, 'publishRoadmapPreservingBytes', () => false);
    try {
      const result = captureCommandOutput(
        () => cmdRoadmapUpdatePlanProgress(tmpDir, '12', false)
      );
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(JSON.parse(result.stdout).updated, false);
    } finally {
      mock.restoreAll();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phase add command
// ─────────────────────────────────────────────────────────────────────────────


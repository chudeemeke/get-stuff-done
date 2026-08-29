/**
 * Runtime override regressions for the composed Open GSD package.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const HAS_CANDIDATE_ROOT = Boolean(process.env.GSD_COMPAT_PACKAGE_ROOT);
const NODE_EXECUTABLE =
  process.env.GSD_TEST_NODE_EXECUTABLE || (process.versions.bun ? 'node' : process.execPath);

function resolveRuntimeToolsPath(env = process.env, projectRoot = PROJECT_ROOT) {
  const packageRoot = env.GSD_COMPAT_PACKAGE_ROOT
    ? path.resolve(env.GSD_COMPAT_PACKAGE_ROOT)
    : path.join(projectRoot, 'dist', 'gsd-core');
  return path.join(packageRoot, 'bin', 'gsd-tools.cjs');
}

function assertRuntimeToolsPath(toolsPath, candidateRoot = HAS_CANDIDATE_ROOT) {
  const message = candidateRoot
    ? `Candidate package is missing bin/gsd-tools.cjs: ${toolsPath}`
    : `Composed runtime is missing: ${toolsPath}. Run bun run compose first.`;
  assert.ok(fs.existsSync(toolsPath), message);
  return toolsPath;
}

const RUNTIME_TOOLS_PATH = resolveRuntimeToolsPath();

function runRuntimeGsdTools(args, cwd) {
  const toolsPath = assertRuntimeToolsPath(RUNTIME_TOOLS_PATH);
  try {
    const stdout = execFileSync(NODE_EXECUTABLE, [toolsPath, ...args], {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: stdout.trim(), error: '' };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString().trim() || '',
      error: err.stderr?.toString().trim() || err.message,
    };
  }
}

function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-runtime-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe('composed runtime GSD overrides', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('explicit candidate root cannot fall back to repository dist', () => {
    const candidateRoot = path.join(tmpDir, 'candidate-package');
    fs.mkdirSync(candidateRoot, { recursive: true });

    const toolsPath = resolveRuntimeToolsPath(
      { GSD_COMPAT_PACKAGE_ROOT: candidateRoot },
      PROJECT_ROOT
    );

    assert.strictEqual(toolsPath, path.join(candidateRoot, 'bin', 'gsd-tools.cjs'));
    assert.throws(
      () => assertRuntimeToolsPath(toolsPath, true),
      /Candidate package is missing bin[\\/]gsd-tools\.cjs/
    );
  });

  test('roadmap analyze and init progress prefer STATE current phase', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### v1.2.0 Current Milestone -- ACTIVE

### Phase 40.5: Older Work
**Plans**: 2 plans

### Phase 41: Current Work
**Plans**: 2 plans

### Phase 42: Next Work
**Plans**: 0 plans
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# Session State

## Current Position

Phase: Phase 41 (executing) -- Current Work
Status: In progress
`
    );

    const older = path.join(tmpDir, '.planning', 'phases', '40.5-older-work');
    fs.mkdirSync(older, { recursive: true });
    fs.writeFileSync(path.join(older, '40.5-01-PLAN.md'), '# Plan');

    const current = path.join(tmpDir, '.planning', 'phases', '41-current-work');
    fs.mkdirSync(current, { recursive: true });
    fs.writeFileSync(path.join(current, '41-01-PLAN.md'), '# Plan');

    const roadmapResult = runRuntimeGsdTools(['roadmap', 'analyze'], tmpDir);
    assert.ok(roadmapResult.success, `Command failed: ${roadmapResult.error}`);
    const roadmap = JSON.parse(roadmapResult.output);
    assert.strictEqual(roadmap.state_current_phase, '41');
    assert.strictEqual(roadmap.current_phase, '41');
    assert.strictEqual(roadmap.next_phase, '42');

    const initResult = runRuntimeGsdTools(['init', 'progress'], tmpDir);
    assert.ok(initResult.success, `Command failed: ${initResult.error}`);
    const init = JSON.parse(initResult.output);
    assert.strictEqual(init.state_current_phase, '41');
    assert.strictEqual(init.current_phase.number, '41');
    assert.strictEqual(init.next_phase.number, '42');
  });

  test('roadmap parser prefers current body milestone over stale frontmatter', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

## Milestones

- SHIPPED **v4.0 Intelligence Layer**
- IN PROGRESS **v5.0 Market-Leader Memory Platform**

### v4.0 Intelligence Layer (Phases 30-37)

- [x] **Phase 30: Historical Work** - Shipped v4 work.

### v5.0 Market-Leader Memory Platform (Phases 38.0-44)

- [x] **Phase 41.1: Embedding Pipeline Resilience** - Complete.
- [ ] **Phase 42: Dreaming Consolidation** - Active.
- [ ] **Phase 42.5: Feature Completeness** - Pending.

## Phase Details

### Phase 30: Historical Work
**Plans:** 1 plan

---

### Phase 41.1: Embedding Pipeline Resilience
**Plans:** 1 plan

---

### Phase 42: Dreaming Consolidation
**Goal:** Consolidate memory dreams.
**Plans:** 1 plan

---

### Phase 42.5: Feature Completeness
**Plans:** 1 plan

---

### Cross-Cutting: v4 Quality
This older cross-cutting section should not be part of the scoped v5 phase list.
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `---
milestone: v4.0
milestone_name: Intelligence Layer
---

# Project State

**Current Focus:** Phase 42 - dreaming-consolidation

Phase: 42 (Dreaming Consolidation) - NEXT
**Milestone:** v5.0 Market-Leader Memory Platform
`
    );

    const roadmapResult = runRuntimeGsdTools(['roadmap', 'analyze'], tmpDir);
    assert.ok(roadmapResult.success, `Command failed: ${roadmapResult.error}`);
    const roadmap = JSON.parse(roadmapResult.output);
    assert.strictEqual(roadmap.state_current_phase, '42');
    assert.strictEqual(roadmap.current_phase, '42');
    assert.ok(roadmap.phases.some(phase => phase.number === '42'), 'Phase 42 should be in scoped roadmap phases');
    assert.ok(!roadmap.phases.some(phase => phase.number === '30'), 'v4 Phase 30 should not leak into v5 scope');
    assert.ok(
      roadmap.milestones.some(milestone => milestone.version === 'v5.0'),
      'v5.0 should be the scoped milestone'
    );

    const phaseResult = runRuntimeGsdTools(['init', 'execute-phase', '42'], tmpDir);
    assert.ok(phaseResult.success, `Command failed: ${phaseResult.error}`);
    const phase = JSON.parse(phaseResult.output);
    assert.strictEqual(phase.phase_found, true);
    assert.strictEqual(phase.phase_number, '42');
    assert.strictEqual(phase.milestone_version, 'v5.0');
    assert.strictEqual(phase.milestone_name, 'Market-Leader Memory Platform');
  });

  test('state update-progress counts ROADMAP-declared future plans', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# Project State

**Progress:** [----------] 0%
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### v1.2.0 Current Milestone -- ACTIVE

### Phase 1: Complete Slice
**Plans**: 1 plan

### Phase 2: Future Slice
**Plans**: 4 plans
`
    );

    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-complete-slice');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary');

    const result = runRuntimeGsdTools(['state', 'update-progress'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.percent, 20);
    assert.strictEqual(output.completed, 1);
    assert.strictEqual(output.total, 5);
  });
});

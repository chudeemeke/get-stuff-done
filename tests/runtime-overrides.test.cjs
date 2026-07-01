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
const RUNTIME_TOOLS_PATH = path.join(PROJECT_ROOT, 'dist', 'gsd-core', 'bin', 'gsd-tools.cjs');
const NODE_EXECUTABLE =
  process.env.GSD_TEST_NODE_EXECUTABLE || (process.versions.bun ? 'node' : process.execPath);

function runRuntimeGsdTools(args, cwd) {
  try {
    const stdout = execFileSync(NODE_EXECUTABLE, [RUNTIME_TOOLS_PATH, ...args], {
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

  test('roadmap analyze and init progress prefer STATE current phase', () => {
    assert.ok(fs.existsSync(RUNTIME_TOOLS_PATH), 'run bun run compose before runtime override tests');

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

  test('state update-progress counts ROADMAP-declared future plans', () => {
    assert.ok(fs.existsSync(RUNTIME_TOOLS_PATH), 'run bun run compose before runtime override tests');

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

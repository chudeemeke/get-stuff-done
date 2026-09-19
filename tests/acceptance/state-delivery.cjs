// Explicit candidate/installed-runtime acceptance; never falls back to source.
// GSD_ACCEPTANCE_TOOLS=/absolute/path/to/gsd-tools.cjs node --test --test-reporter=tap tests/acceptance/state-delivery.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const tools = process.env.GSD_ACCEPTANCE_TOOLS;
assert.ok(tools && path.isAbsolute(tools) && fs.statSync(tools).isFile(), 'GSD_ACCEPTANCE_TOOLS must identify the exact candidate');

const state = `---
gsd_state_version: "1.0"
milestone: v1.3
milestone_name: Continuity
current_phase: "23"
current_phase_name: Recovery
last_activity: "2026-08-18"
last_activity_desc: "Preserve this separate description"
owner_extension:
  decision: "D4: retain subagent planner"
  accepted: true
---
# Project State

## Current Position
Phase: 23 of 24 (Recovery)
Plan: 1 of 2
Status: In progress
Progress: [-----] 50%

## Performance Metrics
| Phase | Plan | Duration | Tasks | Files |
| --- | --- | --- | --- | --- |

## Session Continuity
Last session: 2026-08-18
Stopped at: Previous plan
Resume file: .planning/CONTINUE.md
`;

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-skin-state-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const planning = path.join(root, '.planning');
  const phase = path.join(planning, 'phases', '23-recovery');
  fs.mkdirSync(phase, { recursive: true });
  fs.mkdirSync(path.join(root, 'home'));
  fs.writeFileSync(path.join(planning, 'STATE.md'), state);
  fs.writeFileSync(path.join(planning, 'PROJECT.md'), '# Continuity\n');
  fs.writeFileSync(path.join(planning, 'ROADMAP.md'), '# Roadmap v1.3 Continuity\n\n- [x] Phase 22: Delivery\n- [ ] Phase 23: Recovery\n\n## Phase 23: Recovery\n**Plans:** 2 plans\n');
  fs.writeFileSync(path.join(phase, '23-01-PLAN.md'), '---\nphase: 23\nplan: 01\n---\n# Plan\n');
  fs.writeFileSync(path.join(phase, '23-01-SUMMARY.md'), '---\none-liner: Recovery fixture\n---\n# Summary\n');
  fs.writeFileSync(path.join(phase, '23-02-PLAN.md'), '---\nphase: 23\nplan: 02\n---\n# Plan\n');
  const env = { ...process.env, HOME: path.join(root, 'home'), USERPROFILE: path.join(root, 'home'), CLAUDE_CONFIG_DIR: path.join(root, 'home', '.claude'), CODEX_HOME: path.join(root, 'home', '.codex') };
  delete env.GSD_WORKSTREAM;
  delete env.GSD_PROJECT_DIR;
  return {
    root, planning, env,
    run(...args) {
      const result = spawnSync(process.execPath, [tools, 'query', ...args], { cwd: root, env, encoding: 'utf8', timeout: 30000 });
      assert.equal(result.error, undefined, result.error?.message);
      assert.equal(result.status, 0, result.stderr || result.stdout);
      return JSON.parse(result.stdout);
    },
    read() { return fs.readFileSync(path.join(planning, 'STATE.md'), 'utf8'); },
  };
}

function preserved(text, { activity = true } = {}) {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
  assert.match(frontmatter, /^current_phase: ["']?23["']?$/m);
  assert.match(frontmatter, /^current_phase_name: ["']?Recovery["']?$/m);
  assert.match(frontmatter, /^owner_extension:\r?\n  decision: "D4: retain subagent planner"\r?\n  accepted: true$/m);
  if (activity) {
    assert.match(frontmatter, /^last_activity: ["']?2026-08-18["']?$/m);
    assert.match(frontmatter, /^last_activity_desc: ["']?Preserve this separate description["']?$/m);
  }
}

for (const args of [
  ['state.update-progress'],
  ['state.record-metric', '--phase', '23', '--plan', '01', '--duration', '2min', '--tasks', '1', '--files', '1'],
  ['state.record-session', '--stopped-at', 'Acceptance checkpoint', '--resume-file', '.planning/CONTINUE.md'],
]) {
  test(`${args[0]} preserves curated position, activity and unknown metadata`, t => {
    const f = fixture(t);
    const result = f.run(...args);
    assert.ok(!result.error, JSON.stringify(result));
    preserved(f.read());
    assert.notEqual(f.read(), state, 'writer must execute, not silently no-op');
  });
}

test('milestone.complete retains phase 23 and unknown metadata', t => {
  const f = fixture(t);
  const result = f.run('milestone.complete', 'v1.3', '--name', 'Continuity', '--confirm');
  assert.equal(result.version, 'v1.3');
  preserved(f.read(), { activity: false });
});

test('planned-phase updates a replanned semantic state and its plan count', t => {
  const f = fixture(t);
  const result = f.run('state.planned-phase', '--phase', '23', '--name', 'Recovery', '--plans', '3');
  assert.ok(Array.isArray(result.updated) && result.updated.length > 0, JSON.stringify(result));
  assert.match(f.read(), /(?:Total Plans in Phase:\*\*\s*3|Plan:\s*0 of 3)/);
  preserved(f.read(), { activity: false });
});

test('roadmap.analyze includes a bullet-only phase', t => {
  const f = fixture(t);
  const result = f.run('roadmap.analyze');
  assert.ok(result.phases.some(phase => String(phase.number) === '22'), JSON.stringify(result));
});

test('init.manager includes or explicitly diagnoses a bullet-only phase', t => {
  const f = fixture(t);
  const result = f.run('init.manager');
  assert.ok(result.phases?.some(phase => String(phase.number ?? phase.phase_number) === '22') || JSON.stringify(result.warnings || []).includes('22'), JSON.stringify(result));
});

for (const config of [undefined, {}, { workflow: { _auto_chain_active: false } }, { commit_docs: true }, { commit_docs: false }]) {
  test(`commit and staged guard agree for config ${JSON.stringify(config)}`, t => {
    const f = fixture(t);
    function git(...args) {
      const result = spawnSync('git', args, { cwd: f.root, env: f.env, encoding: 'utf8', timeout: 30000 });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout.trim();
    }
    git('init', '--initial-branch=acceptance');
    git('config', 'user.name', 'Chude');
    git('config', 'user.email', 'chude@emeke.org');
    git('config', 'commit.gpgsign', 'false');
    git('config', 'core.hooksPath', path.join(f.root, 'empty-hooks'));
    if (config !== undefined) fs.writeFileSync(path.join(f.planning, 'config.json'), JSON.stringify(config));
    git('add', '.planning/STATE.md');
    const guard = spawnSync(process.execPath, [tools, 'query', 'check-commit'], { cwd: f.root, env: f.env, encoding: 'utf8', timeout: 30000 });
    const result = f.run('commit', 'docs: verify partial configuration', '--files', '.planning/STATE.md');
    if (config?.commit_docs === false) {
      assert.equal(guard.status, 1, guard.stdout);
      assert.match(guard.stderr, /commit_docs is false/);
      assert.equal(result.committed, false);
      assert.equal(result.skipped, true);
      assert.equal(result.reason, 'skipped_commit_docs_false');
    } else {
      assert.equal(guard.status, 0, guard.stderr);
      assert.equal(JSON.parse(guard.stdout).allowed, true);
      assert.equal(result.committed, true, JSON.stringify(result));
      assert.equal(git('show', 'HEAD:.planning/STATE.md'), state.trim(), 'prove committed bytes, not only success JSON');
    }
  });
}

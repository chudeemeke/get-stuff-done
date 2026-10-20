'use strict';
// Test whether canonical documents remove compatibility gaps without product edits.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { candidates, isolate } = require('./compare.cjs');
const isolation = isolate('upstream-adoption');
const tool = path.join(candidates.upstream, 'gsd-core/bin/gsd-tools.cjs');
const rows = [];
function write(dir, rel, content) {
  const file = path.join(dir, '.planning', rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content);
}
function query(id, dir, args, evaluate) {
  const result = spawnSync(process.execPath, [tool, 'query', ...args], { cwd: dir, env: isolation.env, encoding: 'utf8', timeout: 30000 });
  let output;
  try { output = JSON.parse(result.stdout); } catch { output = { raw: result.stdout, stderr: result.stderr }; }
  rows.push({ id, status: result.status, ok: result.status === 0 && evaluate(output), output });
}
const countDir = path.join(isolation.dir, 'declared');
write(countDir, 'STATE.md', '---\nmilestone: v1.0\n---\n# Project State\n\n## Current Position\n**Current Phase:** 1\n**Current Plan:** 1\n**Total Plans in Phase:** 1\n**Progress:** [----------] 0%\n');
write(countDir, 'ROADMAP.md', '# Roadmap\n\n## Phases\n\n- [x] **Phase 1: Complete Slice**\n- [ ] **Phase 2: Future Slice**\n\n## Phase Details\n\n### Phase 1: Complete Slice\n**Plans:** 1 plan\n\n### Phase 2: Future Slice\n**Plans:** 4 plans\n');
write(countDir, 'phases/01-complete-slice/01-01-PLAN.md', '# Plan');
write(countDir, 'phases/01-complete-slice/01-01-SUMMARY.md', '# Summary');
query('canonical-state-counts-declared-plans', countDir, ['state.update-progress'], o => o.total === 5 && o.percent === 20);
query('canonical-roadmap-counts-declared-plans', countDir, ['roadmap.analyze'], o => o.total_plans === 5 && o.progress_percent === 20);
const currentDir = path.join(isolation.dir, 'current');
write(currentDir, 'STATE.md', '---\ncurrent_phase: "41"\ncurrent_phase_name: Current Work\n---\n# Project State\n\n## Current Position\n**Current Phase:** 41\n**Current Phase Name:** Current Work\n**Status:** In progress\n');
write(currentDir, 'ROADMAP.md', '# Roadmap\n\n## Phases\n\n- [ ] **Phase 40.5: Older Work**\n- [ ] **Phase 41: Current Work**\n- [ ] **Phase 42: Next Work**\n\n## Phase Details\n\n### Phase 40.5: Older Work\n**Plans:** 1 plan\n\n### Phase 41: Current Work\n**Plans:** 1 plan\n\n### Phase 42: Next Work\n**Plans:** 1 plan\n');
write(currentDir, 'phases/40.5-older-work/40.5-01-PLAN.md', '# Plan');
write(currentDir, 'phases/41-current-work/41-01-PLAN.md', '# Plan');
query('canonical-roadmap-honors-current-phase', currentDir, ['roadmap.analyze'], o => o.current_phase === '41');
query('canonical-init-honors-current-phase', currentDir, ['init.progress'], o => o.current_phase?.number === '41');
write(currentDir, 'STATE.md', '# Project State\n\n## Current Position\n**Current Phase:** 41\n**Current Phase Name:** Current Work\n**Current Plan:** 1\n**Total Plans in Phase:** 2\n**Status:** In progress\n');
query('canonical-replanning-count', currentDir, ['state.planned-phase', '--phase', '41', '--name', 'Current Work', '--plans', '3'], o => !o.error && /Total Plans in Phase:\*\* 3/.test(fs.readFileSync(path.join(currentDir, '.planning/STATE.md'), 'utf8')));
const scan = require(path.join(candidates.upstream, 'gsd-core/bin/lib/plan-scan.cjs'));
const names = ['42-PLAN-REVIEW.md', '43-FABLE-PLAN11AC-ADJUDICATION-PACKET-2026-07-19.md', 'PLAN.md', '42-01-PLAN.md', 'legacy-plan-draft.md'];
rows.push({ id: 'plan-names', observed: Object.fromEntries(names.map(name => [name, scan.isRootPlanFile(name)])) });
// Prove that the write guard fails before creating a file outside the fixture root.
const outside = path.join(__dirname, 'forbidden-write-control.txt');
if (fs.existsSync(outside)) throw new Error('Unexpected existing negative-control file');
const control = path.join(isolation.dir, 'control.cjs');
fs.writeFileSync(control, 'require("node:fs").writeFileSync(process.argv[2], "must not be written");\n');
const result = spawnSync(process.execPath, ['--require', path.join(__dirname, 'guard.cjs'), control, outside], {
  cwd: isolation.dir, env: { ...isolation.env, COMPARISON_WRITE_ROOT: isolation.dir, COMPARISON_TRACE: path.join(isolation.dir, 'guard-control.jsonl') }, encoding: 'utf8', timeout: 10000 });
rows.push({ id: 'guard-rejects-outside-write', ok: result.status !== 0 && result.stderr.includes('COMPARISON_OUTSIDE_WRITE_ROOT') && !fs.existsSync(outside) });
fs.writeFileSync(path.join(__dirname, 'upstream-adoption.json'), JSON.stringify(rows, null, 2));
console.log(JSON.stringify(rows.map(({ id, ok, observed }) => ({ id, ok, observed })), null, 2));

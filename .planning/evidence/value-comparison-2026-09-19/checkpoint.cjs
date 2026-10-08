'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
if (execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim() !== 'chore/upstream-bump-1.9.1') throw new Error('Wrong branch');
const file = path.join(root, '.planning/HANDOFF.json');
const original = fs.readFileSync(file, 'utf8');
const handoff = JSON.parse(original);
const section = 'session_2026_09_19_value_comparison';
handoff.timestamp = new Date().toISOString();
handoff.status = 'value-comparison-complete-owner-direction-pending-lock-NOT-PASS';
handoff.READ_FIRST = `READ ${section} FIRST, then docs/reviews/opengsd-value-comparison-2026-09-19.md and the installer Codex brief. Owner authorized Compare value first. Bounded Windows comparison is complete; reduced skin recommended, direction not accepted. No product or real-install changes, commits or pushes. Existing lock remains NOT PASS; all eight findings still require owner dispositions. No preflight/snapshot this session. Existing fixed decisions remain binding.`;
handoff.SECTION_INDEX.CURRENT = [section, ...handoff.SECTION_INDEX.CURRENT.filter(k => k !== section && k !== 'session_2026_09_19_c')];
handoff.SECTION_INDEX.MIXED = ['session_2026_09_19_c', ...handoff.SECTION_INDEX.MIXED.filter(k => k !== 'session_2026_09_19_c')];
handoff.session_2026_09_19_c.SECTION_STATUS = 'MIXED: lock evidence, constraints and owner decisions remain current; next action is superseded by session_2026_09_19_value_comparison.';
handoff[section] = {
  SECTION_STATUS: 'CURRENT',
  authority: 'Owner selected Compare value first on 2026-09-19: bounded comparison with disposable homes and existing acceptance cases, no real installation changes.',
  report: 'docs/reviews/opengsd-value-comparison-2026-09-19.md',
  evidence: '.planning/evidence/value-comparison-2026-09-19/',
  scratch: '.claude/value-comparison-2026-09-19/',
  head: 'e50bda5b',
  candidates: 'Fresh composed skin at upstream 1.9.1 versus registry-integrity-verified stock 1.14.0 (f8542fef67c1f978ffa70912cb6f2aaab76464c6).',
  results: 'State: both 9 pass / 3 fail. Targeted behavior: skin 8/8, stock 0/8 with compatibility distinctions in report. Both Claude/Codex lifecycles preserve seeded owner bytes; stock falsely claims owner helper files. Fault: stock 946 residual files; skin 622 plus false rollback claim. Installed stock configuration probes 9/9 each runtime.',
  recommendation: 'Retain reduced skin for measured protections; use native configuration/additive skill mechanisms where proved. No wholesale retirement or migration accepted.',
  pending_owner: 'Accept delivery direction; then eight Sixth-review dispositions and lock shape approval before tests. No preflight/snapshot this session.',
  nonclaims: 'Windows only; no full quality gate, native Linux/macOS, D11, live planner/checker, independent review or refreshed hosted CI evidence.',
  mutations: 'Only comparison harness/evidence, decision report, brief, CONTINUE and this handoff. No product source/pin/existing tests/real installation changed. All local and uncommitted; preserve prior six evidence files.',
  source_contract_gap: 'Original September 5 inbox contract absent in allowed worktree and exact-path Git history. Ratification is in 38504333 and bump_arc.sequencing_decision_resolved.decisions_recorded_2026_09_05. Recover owning source before closure.',
};
if (fs.readFileSync(file, 'utf8') !== original) throw new Error('Handoff changed concurrently');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
const updated = JSON.stringify(handoff, null, 2).replaceAll('\n', eol) + eol;
fs.writeFileSync(file + '.value-comparison.tmp', updated, { flag: 'wx' });
fs.renameSync(file + '.value-comparison.tmp', file);
console.log('Comparison checkpoint written; no installer state accepted.');

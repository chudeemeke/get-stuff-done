/**
 * Active-product phase verification safety contract.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createGsdToolsHelpers, createTempProject, cleanup } = require('./helpers.cjs');

const ACTIVE_PACKAGE_ROOT = path.join(__dirname, '..', 'dist', 'gsd-core');
const { runGsdTools } = createGsdToolsHelpers(ACTIVE_PACKAGE_ROOT);

describe('active phase verification gate', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('refuses completion without passed verification evidence', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n- [ ] Phase 1: Foundation\n\n### Phase 1: Foundation\n'
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      '# State\n\n**Current Phase:** 01\n**Status:** In progress\n'
    );
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary');

    const result = runGsdTools('phase complete 1', tmpDir);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('verification is incomplete'));
  });
});

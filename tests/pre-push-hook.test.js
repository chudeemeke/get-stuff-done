const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PRE_PUSH = path.join(PROJECT_ROOT, '.husky', 'pre-push');

describe('pre-push hook', () => {
  test('clears Git hook-local repository env before running test gates', () => {
    const hook = fs.readFileSync(PRE_PUSH, 'utf8');
    const clearIndex = hook.indexOf('git rev-parse --local-env-vars');
    const testIndex = hook.indexOf('bun test');

    expect(clearIndex).toBeGreaterThan(-1);
    expect(testIndex).toBeGreaterThan(-1);
    expect(clearIndex).toBeLessThan(testIndex);
  });
});

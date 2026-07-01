const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CI_WORKFLOW = path.join(PROJECT_ROOT, '.github', 'workflows', 'ci.yml');

function readCiWorkflow() {
  return fs.readFileSync(CI_WORKFLOW, 'utf8');
}

describe('CI workflow security action contracts', () => {
  test('gitleaks receives the GitHub token required for pull request scans', () => {
    const workflow = readCiWorkflow();
    const gitleaksStep = workflow.slice(workflow.indexOf('uses: gitleaks/gitleaks-action@v2'));

    expect(gitleaksStep).toContain('GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
  });

  test('OSV scanner action is pinned to a resolvable concrete v2 tag', () => {
    const workflow = readCiWorkflow();

    expect(workflow).toContain('uses: google/osv-scanner-action/osv-scanner-action@v2.3.8');
    expect(workflow).not.toContain('uses: google/osv-scanner-action/osv-scanner-action@v2\n');
  });
});

describe('CI workflow informational gates', () => {
  test('upstream compatibility reports through a non-blocking CI wrapper', () => {
    const workflow = readCiWorkflow();

    expect(workflow).toContain('node scripts/run-upstream-compat-ci.js');
    expect(workflow).not.toContain('run: node scripts/run-upstream-compat.js');
  });

  test('boundary debt reports without producing a failed-step annotation', () => {
    const workflow = readCiWorkflow();
    const boundaryJobStart = workflow.indexOf('boundary-check:');
    const overrideJobStart = workflow.indexOf('override-check:');
    const boundaryJob = workflow.slice(boundaryJobStart, overrideJobStart);

    expect(boundaryJob).toContain('node scripts/check-boundary.js --report-only');
    expect(boundaryJob).not.toContain('continue-on-error: true');
    expect(boundaryJob).toContain('node scripts/check-debt-ratchet.cjs --no-compose');
  });
});

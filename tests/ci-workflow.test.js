const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, '.github', 'workflows');
const CI_WORKFLOW = path.join(WORKFLOWS_DIR, 'ci.yml');

function readCiWorkflow() {
  return fs.readFileSync(CI_WORKFLOW, 'utf8');
}

function readWorkflow(fileName) {
  return fs.readFileSync(path.join(WORKFLOWS_DIR, fileName), 'utf8');
}

function readAllWorkflowText() {
  return fs
    .readdirSync(WORKFLOWS_DIR)
    .filter(fileName => fileName.endsWith('.yml') || fileName.endsWith('.yaml'))
    .map(fileName => readWorkflow(fileName))
    .join('\n');
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

  test('first-party Node actions use Node 24-compatible majors', () => {
    const workflows = readAllWorkflowText();

    expect(workflows).toContain('actions/setup-node@v6');
    expect(workflows).not.toContain('actions/setup-node@v4');
    expect(workflows).toContain('actions/upload-artifact@v7');
    expect(workflows).not.toContain('actions/upload-artifact@v4');
    expect(workflows).toContain('actions/download-artifact@v8');
    expect(workflows).not.toContain('actions/download-artifact@v4');
    expect(workflows).toContain('actions/github-script@v8');
    expect(workflows).not.toContain('actions/github-script@v7');
  });

  test('macOS runners are pinned away from macos-latest migration', () => {
    const ciWorkflow = readCiWorkflow();
    const perfWorkflow = readWorkflow('perf-baseline.yml');
    const workflows = readAllWorkflowText();

    expect(workflows).not.toContain('macos-latest');
    expect(ciWorkflow).toContain('macos-15');
    expect(perfWorkflow).toContain('os: macos-15');
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

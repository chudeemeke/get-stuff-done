/**
 * GSD Tools Tests - Template
 *
 * Tests for get-stuff-done/bin/lib/template.cjs template selection and fill operations.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { resolveCompatPackageRoot } = require('./helpers/compat-package-root.cjs');
const COMPAT_PACKAGE_ROOT = resolveCompatPackageRoot();
const { createGsdToolsHelpers, createTempProject, cleanup } = require('./helpers.cjs');
const { runGsdTools } = createGsdToolsHelpers(COMPAT_PACKAGE_ROOT);

const TEMPLATE_PATH = path.join(COMPAT_PACKAGE_ROOT, 'bin', 'lib', 'template.cjs');
const template = require(TEMPLATE_PATH);
const { cmdTemplateSelect, cmdTemplateFill } = template;
const { captureCommandOutput } = require('./helpers/capture-command-output.cjs');

/**
 * Helper: create a phase directory structure for template fill tests.
 */
function createPhaseDir(tmpDir, phaseNum, phaseName) {
  const dirName = `${String(phaseNum).padStart(2, '0')}-${phaseName}`;
  const phaseDir = path.join(tmpDir, '.planning', 'phases', dirName);
  fs.mkdirSync(phaseDir, { recursive: true });
  return phaseDir;
}

// ---- cmdTemplateSelect ----

describe('cmdTemplateSelect()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('errors when planPath is not provided', () => {
    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, null, false));
    assert.strictEqual(mock.exitCode, 1);
    assert.ok(mock.stderr.includes('plan-path required'));
  });

  test('errors when planPath is empty string', () => {
    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, '', false));
    assert.strictEqual(mock.exitCode, 1);
    assert.ok(mock.stderr.includes('plan-path required'));
  });

  test('selects minimal template for simple plan (<=2 tasks, <=3 files, no decisions)', () => {
    const planContent = `---
phase: 01
---

### Task 1
Do something with \`src/file.js\`
`;
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.type, 'minimal');
    assert.strictEqual(result.template, 'templates/summary-minimal.md');
    assert.strictEqual(result.taskCount, 1);
    assert.strictEqual(result.hasDecisions, false);
  });

  test('selects standard template for medium-complexity plan', () => {
    const planContent = `---
phase: 01
---

### Task 1
Do something

### Task 2
Do something else

### Task 3
And another thing

Files: \`src/a.js\`, \`src/b.js\`, \`src/c.js\`, \`src/d.js\`
`;
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.type, 'standard');
    assert.strictEqual(result.taskCount, 3);
  });

  test('selects complex template when plan has decisions', () => {
    const planContent = `---
phase: 01
---

### Task 1
Make a decision about architecture

Decision: use microservices
`;
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.type, 'complex');
    assert.strictEqual(result.hasDecisions, true);
  });

  test('selects complex template when plan has >5 tasks', () => {
    const planContent = `---
phase: 01
---

### Task 1
A
### Task 2
B
### Task 3
C
### Task 4
D
### Task 5
E
### Task 6
F
`;
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.type, 'complex');
    assert.strictEqual(result.taskCount, 6);
  });

  test('selects complex template when plan references >6 files', () => {
    const planContent = `---
phase: 01
---

### Task 1
Files: \`src/a.js\`, \`src/b.js\`, \`src/c.js\`, \`src/d.js\`, \`src/e.js\`, \`src/f.js\`, \`src/g.js\`
`;
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.type, 'complex');
    assert.ok(result.fileCount > 6);
  });

  test('counts file mentions with path separators only', () => {
    // Files without path separators should not be counted
    const planContent = `---
phase: 01
---

### Task 1
Use \`file.js\` and \`src/real.js\`
`;
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    // Only src/real.js should count (has path separator)
    assert.strictEqual(result.fileCount, 1);
  });

  test('ignores http URLs in file count', () => {
    const planContent = `---
phase: 01
---

### Task 1
See \`http://example.com/file.js\` and \`src/real.js\`
`;
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.fileCount, 1);
  });

  test('deduplicates file mentions', () => {
    const planContent = `---
phase: 01
---

### Task 1
Edit \`src/file.js\` and then \`src/file.js\` again
`;
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.fileCount, 1);
  });

  test('returns raw template path when raw=true', () => {
    const planContent = '### Task 1\nSimple\n';
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), planContent);

    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'plan.md', true));
    assert.strictEqual(mock.exitCode, 0);
    assert.strictEqual(mock.stdout, 'templates/summary-minimal.md');
  });

  test('falls back to standard on file read error', () => {
    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'nonexistent-file.md', false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.type, 'standard');
    assert.ok(result.error, 'should include error message');
  });

  test('fallback returns raw standard path', () => {
    const mock = captureCommandOutput(() => cmdTemplateSelect(tmpDir, 'nonexistent.md', true));
    assert.strictEqual(mock.exitCode, 0);
    assert.strictEqual(mock.stdout, 'templates/summary-standard.md');
  });
});

// ---- cmdTemplateFill ----

describe('cmdTemplateFill()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('errors when templateType is not provided', () => {
    const mock = captureCommandOutput(() => cmdTemplateFill(tmpDir, null, { phase: '1' }, false));
    assert.strictEqual(mock.exitCode, 1);
    assert.ok(mock.stderr.includes('template type required'));
  });

  test('errors when --phase is not provided', () => {
    const mock = captureCommandOutput(() => cmdTemplateFill(tmpDir, 'summary', { phase: null }, false));
    assert.strictEqual(mock.exitCode, 1);
    assert.ok(mock.stderr.includes('--phase required'));
  });

  test('outputs error when phase is not found', () => {
    const mock = captureCommandOutput(() => cmdTemplateFill(tmpDir, 'summary', { phase: '99' }, false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.error, 'Phase not found');
  });

  test('creates summary template file', () => {
    const phaseDir = createPhaseDir(tmpDir, 1, 'foundation');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'summary', {
        phase: '1',
        plan: '01',
        name: 'Foundation',
      }, false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.created, true);
    assert.strictEqual(result.template, 'summary');

    // Verify file exists
    const filePath = path.join(phaseDir, '01-01-SUMMARY.md');
    assert.ok(fs.existsSync(filePath));

    // Verify content structure
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.startsWith('---\n'));
    assert.ok(content.includes('Phase 1: Foundation Summary'));
    assert.ok(content.includes('phase: 01-foundation'));
  });

  test('creates plan template file', () => {
    const phaseDir = createPhaseDir(tmpDir, 2, 'api');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'plan', {
        phase: '2',
        plan: '01',
        name: 'API Layer',
        type: 'execute',
        wave: '1',
      }, false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.created, true);
    assert.strictEqual(result.template, 'plan');

    const filePath = path.join(phaseDir, '02-01-PLAN.md');
    assert.ok(fs.existsSync(filePath));
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('Phase 2 Plan 01'));
    assert.ok(content.includes('type: execute'));
  });

  test('creates verification template file', () => {
    const phaseDir = createPhaseDir(tmpDir, 3, 'testing');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'verification', {
        phase: '3',
        name: 'Testing',
      }, false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.created, true);
    assert.strictEqual(result.template, 'verification');

    const filePath = path.join(phaseDir, '03-VERIFICATION.md');
    assert.ok(fs.existsSync(filePath));
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('Phase 3: Testing'));
    assert.ok(content.includes('Observable Truths'));
  });

  test('errors on unknown template type', () => {
    createPhaseDir(tmpDir, 4, 'test');

    const mock = captureCommandOutput(() => cmdTemplateFill(tmpDir, 'unknown', { phase: '4' }, false));
    assert.strictEqual(mock.exitCode, 1);
    assert.ok(mock.stderr.includes('Unknown template type: unknown'));
  });

  test('reports error when file already exists', () => {
    const phaseDir = createPhaseDir(tmpDir, 5, 'existing');
    // Pre-create the file
    fs.writeFileSync(path.join(phaseDir, '05-01-SUMMARY.md'), 'existing content');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'summary', {
        phase: '5',
        plan: '01',
        name: 'Existing',
      }, false));
    assert.strictEqual(mock.exitCode, 0);
    const result = JSON.parse(mock.stdout);
    assert.strictEqual(result.error, 'File already exists');
  });

  test('defaults plan number to 01 when not provided', () => {
    const phaseDir = createPhaseDir(tmpDir, 6, 'default-plan');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'summary', {
        phase: '6',
        name: 'Default Plan',
      }, false));
    assert.strictEqual(mock.exitCode, 0);

    const filePath = path.join(phaseDir, '06-01-SUMMARY.md');
    assert.ok(fs.existsSync(filePath));
  });

  test('uses phase name from phaseInfo when name option not provided', () => {
    createPhaseDir(tmpDir, 7, 'auto-named');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'summary', {
        phase: '7',
        plan: '01',
      }, false));
    assert.strictEqual(mock.exitCode, 0);

    const result = JSON.parse(mock.stdout);
    assert.ok(result.created);
    // Phase name comes from phaseInfo (directory name suffix: 'auto-named')
    const filePath = path.join(tmpDir, '.planning', 'phases', '07-auto-named', '07-01-SUMMARY.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('auto-named'));
  });

  test('uses Unnamed when neither option nor phaseInfo provides name', () => {
    // Create a phase directory with no name suffix
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '08');
    fs.mkdirSync(phaseDir, { recursive: true });

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'summary', {
        phase: '8',
        plan: '01',
      }, false));
    assert.strictEqual(mock.exitCode, 0);

    const filePath = path.join(phaseDir, '08-01-SUMMARY.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('Unnamed'));
  });

  test('returns raw relative path when raw=true', () => {
    createPhaseDir(tmpDir, 9, 'raw-test');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'summary', {
        phase: '9',
        plan: '01',
        name: 'Raw Test',
      }, true));
    assert.strictEqual(mock.exitCode, 0);
    // Raw mode outputs the relative path string
    assert.ok(mock.stdout.includes('09'));
    assert.ok(mock.stdout.includes('SUMMARY.md'));
  });

  test('plan template includes correct frontmatter fields', () => {
    const phaseDir = createPhaseDir(tmpDir, 10, 'fm-test');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'plan', {
        phase: '10',
        plan: '02',
        name: 'FM Test',
        type: 'tdd',
        wave: '3',
      }, false));
    assert.strictEqual(mock.exitCode, 0);

    const filePath = path.join(phaseDir, '10-02-PLAN.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('type: tdd'));
    assert.ok(content.includes('wave: 3'));
    assert.ok(content.includes('autonomous: true'));
  });

  test('plan template defaults type to execute and wave to 1', () => {
    const phaseDir = createPhaseDir(tmpDir, 11, 'defaults');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'plan', {
        phase: '11',
        plan: '01',
        name: 'Defaults',
      }, false));
    assert.strictEqual(mock.exitCode, 0);

    const filePath = path.join(phaseDir, '11-01-PLAN.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('type: execute'));
    assert.ok(content.includes('wave: 1'));
  });

  test('merges custom fields into frontmatter', () => {
    const phaseDir = createPhaseDir(tmpDir, 12, 'custom-fields');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'summary', {
        phase: '12',
        plan: '01',
        name: 'Custom Fields',
        fields: { subsystem: 'auth', tags: ['security', 'jwt'] },
      }, false));
    assert.strictEqual(mock.exitCode, 0);

    const filePath = path.join(phaseDir, '12-01-SUMMARY.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('subsystem: auth'));
    assert.ok(content.includes('security'));
    assert.ok(content.includes('jwt'));
  });

  test('verification template includes required sections', () => {
    const phaseDir = createPhaseDir(tmpDir, 13, 'verify-sections');

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'verification', {
        phase: '13',
        name: 'Verify Sections',
      }, false));
    assert.strictEqual(mock.exitCode, 0);

    const filePath = path.join(phaseDir, '13-VERIFICATION.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('Observable Truths'));
    assert.ok(content.includes('Required Artifacts'));
    assert.ok(content.includes('Key Link Verification'));
    assert.ok(content.includes('Requirements Coverage'));
    assert.ok(content.includes('Result'));
  });

  test('generates phaseSlug from phaseName when phaseInfo has no slug', () => {
    // Create phase dir with no name (slug will be null in phaseInfo)
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '14');
    fs.mkdirSync(phaseDir, { recursive: true });

    const mock = captureCommandOutput(() =>
      cmdTemplateFill(tmpDir, 'summary', {
        phase: '14',
        plan: '01',
        name: 'Custom Name Here',
      }, false));
    assert.strictEqual(mock.exitCode, 0);

    const filePath = path.join(phaseDir, '14-01-SUMMARY.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    // phaseId should use slug generated from 'Custom Name Here'
    assert.ok(content.includes('14-custom-name-here'));
  });
});

// ---- CLI integration via gsd-tools ----

describe('template CLI integration', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('template select via gsd-tools', () => {
    const planContent = '### Task 1\nSimple plan\n';
    const planPath = path.join(tmpDir, '.planning', 'phases', 'test-plan.md');
    fs.writeFileSync(planPath, planContent);

    const result = runGsdTools(`template select .planning/phases/test-plan.md`, tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.ok(output.type, 'should have template type');
  });

  test('template fill summary via gsd-tools', () => {
    createPhaseDir(tmpDir, 15, 'cli-test');

    const result = runGsdTools('template fill summary --phase 15 --plan 01 --name CLI-Test', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.created, true);
  });

  test('template select errors without plan path', () => {
    const result = runGsdTools('template select', tmpDir);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('plan-path required'));
  });

  test('template fill errors without phase', () => {
    const result = runGsdTools('template fill summary', tmpDir);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('--phase required'));
  });
});

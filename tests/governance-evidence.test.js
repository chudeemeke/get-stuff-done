import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('PR and issue evidence governance', () => {
  test('PR template requires the evidence-gate record', () => {
    const template = read('.github/PULL_REQUEST_TEMPLATE.md');

    for (const heading of [
      '## Summary',
      '## Scope',
      '## Verification',
      '## Explicit non-claims',
      '## Risks / blockers',
      '## Linked issues / GSD artifacts',
      '## Hosted evidence',
    ]) {
      expect(template).toContain(heading);
    }

    expect(template).toContain('Final PR HEAD SHA');
    expect(template).toContain('Expected checks');
    expect(template).toContain('Skipped jobs');
    expect(template).toContain('gh pr checks');
    expect(template).toContain('gh run list --branch');
  });

  test('every issue form captures the shared evidence contract', () => {
    const formDirectory = path.join(ROOT, '.github', 'ISSUE_TEMPLATE');
    const forms = fs.readdirSync(formDirectory)
      .filter((name) => name.endsWith('.yml') && name !== 'config.yml');

    expect(forms.length).toBeGreaterThanOrEqual(3);

    for (const form of forms) {
      const source = read(path.join('.github', 'ISSUE_TEMPLATE', form));
      for (const label of [
        'Problem',
        'Desired outcome',
        'Scope boundaries',
        'Acceptance criteria',
        'Verification required',
        'Explicit non-claims',
        'Linked GSD artifact',
      ]) {
        expect(source, `${form} is missing ${label}`).toContain(`label: ${label}`);
      }
    }
  });

  test('label catalog contains the standardized taxonomy', () => {
    const catalog = JSON.parse(read('config/github-labels.json'));
    const names = new Set(catalog.labels.map((label) => label.name));

    for (const name of [
      'type:bug',
      'type:feature',
      'type:docs',
      'type:decision',
      'type:release-blocker',
      'type:security',
      'type:adoption',
      'type:cross-project',
      'type:ci',
      'type:workflow',
      'type:release-plan',
      'type:fuzz',
      'type:security-gate',
      'status:blocked',
      'status:owner-gated',
      'status:ready',
      'status:misconfigured',
      'status:needs-hosted-evidence',
      'priority:p0',
      'priority:p1',
      'priority:p2',
    ]) {
      expect(names.has(name), `missing label ${name}`).toBe(true);
    }
  });

  test('hosted contract exposes enforced gates and known gaps', () => {
    const contract = JSON.parse(read('config/hosted-evidence-contract.json'));

    expect(contract.finalHeadPolicy.requireExactHead).toBe(true);
    expect(contract.finalHeadPolicy.invalidateOnNewCommit).toBe(true);
    expect(contract.finalHeadPolicy.requireSkippedJobDisposition).toBe(true);

    expect(contract.capabilities.ci.status).toBe('enforced');
    expect(contract.capabilities.security.status).toBe('enforced');
    expect(contract.capabilities.secretScan.status).toBe('enforced');
    expect(contract.capabilities.smoke.status).toBe('enforced');

    expect(contract.capabilities.coverage.status).toBe('missing');
    expect(contract.capabilities.coverage.thresholds).toEqual({
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    });
    expect(contract.capabilities.coverage.issueRequired).toBe(true);

    expect(contract.capabilities.releasePlan.status).toBe('missing');
    expect(contract.capabilities.releasePlan.issueRequired).toBe(true);
    expect(contract.capabilities.fuzz.status).toBe('not-applicable');
    expect(contract.capabilities.fuzz.reconsiderWhen).toBeTruthy();
  });

  test('contribution guidance keeps merge and goal closure distinct', () => {
    const guide = read('CONTRIBUTING.md');

    expect(guide).toContain('focused branch from `main`');
    expect(guide).toContain('chronological, factual slices');
    expect(guide).toContain('Squash merge');
    expect(guide).toContain('final PR HEAD');
    expect(guide).toContain('does not complete the project goal');
    expect(guide).toMatch(/merged PR or (?:with )?a written evidence note/);
    expect(guide).toContain('durable GSD state');
  });
});

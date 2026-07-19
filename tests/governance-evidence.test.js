const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function parseWorkflow(relativePath) {
  return Bun.YAML.parse(read(relativePath));
}

function cartesianRows(matrix) {
  const keys = Object.keys(matrix);
  return keys.reduce(
    (rows, key) => rows.flatMap((row) => matrix[key].map((value) => ({
      ...row,
      [key]: value,
    }))),
    [{}],
  );
}

function expandWorkflowJobNames(workflow) {
  return Object.values(workflow.jobs).flatMap((job) => {
    const matrix = job.strategy?.matrix;
    if (!matrix) return [job.name];
    if (matrix.exclude) throw new Error('matrix exclude requires explicit contract support');

    const axisEntries = Object.entries(matrix)
      .filter(([key]) => key !== 'include');
    if (matrix.include && axisEntries.length > 0) {
      throw new Error('mixed matrix axes and include require explicit contract support');
    }
    const rows = matrix.include ?? cartesianRows(Object.fromEntries(axisEntries));

    return rows.map((row) => job.name.replace(
      /\$\{\{\s*matrix\.([a-z0-9_-]+)\s*\}\}/gi,
      (_, key) => {
        if (!(key in row)) throw new Error(`missing matrix value ${key}`);
        return String(row[key]);
      },
    ));
  }).sort();
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

    expect(names.size).toBe(catalog.labels.length);
    for (const label of catalog.labels) {
      expect(label.color, `invalid color for ${label.name}`).toMatch(/^[0-9a-f]{6}$/i);
      expect(label.description.trim(), `missing description for ${label.name}`).toBeTruthy();
    }

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

  test('issue-form defaults reference cataloged labels', () => {
    const catalog = JSON.parse(read('config/github-labels.json'));
    const names = new Set(catalog.labels.map((label) => label.name));
    const formDirectory = path.join(ROOT, '.github', 'ISSUE_TEMPLATE');
    const forms = fs.readdirSync(formDirectory)
      .filter((name) => name.endsWith('.yml') && name !== 'config.yml');

    for (const form of forms) {
      const parsed = Bun.YAML.parse(
        read(path.join('.github', 'ISSUE_TEMPLATE', form)),
      );
      for (const label of parsed.labels ?? []) {
        expect(names.has(label), `${form} references missing label ${label}`).toBe(true);
      }
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

  test('every issue-required capability links an issue-ready GSD record', () => {
    const contract = JSON.parse(read('config/hosted-evidence-contract.json'));
    const issueRequired = Object.entries(contract.capabilities)
      .filter(([, capability]) => capability.issueRequired);

    expect(issueRequired.length).toBeGreaterThan(0);
    for (const [name, capability] of issueRequired) {
      expect(capability.issueArtifact, `${name} is missing issueArtifact`).toBeTruthy();
      const issue = read(capability.issueArtifact);
      for (const heading of [
        '## Problem',
        '## Desired Outcome',
        '## Scope Boundaries',
        '## Acceptance Criteria',
        '## Verification Required',
        '## Explicit Non-Claims',
      ]) {
        expect(issue, `${name} issue is missing ${heading}`).toContain(heading);
      }
    }
  });

  test('hosted contract equals the pull-request workflow and job inventory', () => {
    const contract = JSON.parse(read('config/hosted-evidence-contract.json'));
    const workflowDirectory = path.join(ROOT, '.github', 'workflows');
    const actualPullRequestPaths = fs.readdirSync(workflowDirectory)
      .filter((name) => parseWorkflow(path.join('.github', 'workflows', name))
        .on?.pull_request !== undefined)
      .map((name) => `.github/workflows/${name}`)
      .sort();
    const contractPaths = contract.pullRequestWorkflows
      .map((workflow) => workflow.path)
      .sort();

    expect(contractPaths).toEqual(actualPullRequestPaths);

    for (const workflowContract of contract.pullRequestWorkflows) {
      const workflow = parseWorkflow(workflowContract.path);
      if (workflowContract.requiredJobs) {
        expect(
          workflowContract.requiredJobs.toSorted(),
          `${workflowContract.name} job inventory drifted`,
        ).toEqual(expandWorkflowJobNames(workflow));
      }
    }

    const cousinContract = contract.pullRequestWorkflows
      .find((workflow) => workflow.name === 'Cousin Install').requiredMatrix;
    const cousinWorkflow = parseWorkflow('.github/workflows/cousin-install.yml');
    const cousinJob = cousinWorkflow.jobs['cousin-install'];
    const cousinMatrix = cousinJob.strategy.matrix;

    expect(cousinJob.name).toBe(
      'Cousin Install (${{ matrix.os }}, Node ${{ matrix.node-version }}, ${{ matrix.package-manager }})',
    );
    expect(cousinMatrix.os).toEqual(cousinContract.os);
    expect(cousinMatrix['node-version'].map(String)).toEqual(cousinContract.node);
    expect(cousinMatrix['package-manager']).toEqual(cousinContract.packageManager);
    expect(
      cousinMatrix.os.length
        * cousinMatrix['node-version'].length
        * cousinMatrix['package-manager'].length,
    ).toBe(cousinContract.expectedJobs);
  });

  test('branch-protection contract rejects the obsolete combined check', () => {
    const contract = JSON.parse(read('config/hosted-evidence-contract.json'));

    expect(contract.branchProtection.branch).toBe('main');
    expect(contract.branchProtection.minimumRequiredContexts).toEqual([
      'Workflow Lint',
      'Lint',
      'Source Parity Check',
      'Override Staleness Check (blocking)',
      'Secret Scan',
    ]);
    expect(contract.branchProtection.informationalContexts).toEqual([
      'Boundary Check (informational)',
    ]);
    expect(contract.branchProtection.forbiddenStaleContexts).toEqual([
      'Boundary & Override Check',
    ]);
    expect(contract.branchProtection.mutationRequiresOwnerApproval).toBe(true);
  });

  test('stale branch-protection drift has an issue-ready GSD record', () => {
    const issue = read(
      '.planning/quick/branch-protection-required-check-drift-ISSUE.md',
    );

    for (const heading of [
      '## Problem',
      '## Desired Outcome',
      '## Scope Boundaries',
      '## Acceptance Criteria',
      '## Verification Required',
      '## Explicit Non-Claims',
    ]) {
      expect(issue).toContain(heading);
    }

    for (const label of [
      'type:ci',
      'type:release-blocker',
      'status:misconfigured',
      'status:owner-gated',
      'priority:p1',
    ]) {
      expect(issue).toContain(label);
    }

    expect(issue).toContain('Boundary & Override Check');
    expect(issue).toContain('Override Staleness Check (blocking)');
    expect(issue).toContain('gh pr checks');
    expect(issue).toContain('gh run list --branch');
  });

  test('governance adoption has an issue-ready GSD record', () => {
    const issue = read('.planning/quick/pr-issue-evidence-workflow-ISSUE.md');

    for (const heading of [
      '## Problem',
      '## Desired Outcome',
      '## Scope Boundaries',
      '## Acceptance Criteria',
      '## Verification Required',
      '## Explicit Non-Claims',
    ]) {
      expect(issue).toContain(heading);
    }

    for (const label of [
      'type:workflow',
      'type:docs',
      'status:owner-gated',
      'priority:p1',
    ]) {
      expect(issue).toContain(label);
    }

    expect(issue).toContain('pr-issue-evidence-workflow-CONTEXT.md');
    expect(issue).toContain('final PR HEAD');
    expect(issue).toContain('config/hosted-evidence-contract.json');
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

  test('contribution guidance protects public artifact hygiene', () => {
    const guide = read('CONTRIBUTING.md');

    expect(guide).toContain('repository-relative paths');
    expect(guide).toContain('machine-specific absolute paths');
    expect(guide).toContain('raw authentication or billing diagnostics');
    expect(guide).toContain('history rewrite');
    expect(guide).toContain('owner-approved incident plan');
  });
});

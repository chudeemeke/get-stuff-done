'use strict';

const { describe, expect, test } = require('bun:test');
const { createHash } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  buildPassedEnvelope,
  collectHostedData,
  collectHostedEnvelope,
  computeGovernedDigests,
  createDefaultDependencies,
  evaluateHostedVerdict,
  expandJobMatrices,
  main,
  parseArgs,
  runJsonCommand,
  runTextCommand,
  resolveReceiptPath,
  selectLatestRuns,
  validateHostedContract,
  validateHostedEnvelope,
  verifyWorkflowTopology,
  verifyPendingEnvelope,
  verifyTrackedEnvelope,
  writeReceiptAtomic,
} = require('../scripts/verify-hosted-ci');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTRACT_PATH = path.join(PROJECT_ROOT, 'config', 'phase43-hosted-ci-contract.json');
const EXPECTED_HEAD = '64f137a110e985c86b08acb3140bc8b982d34843';
const BILLING_MESSAGE = 'The job was not started because your account is locked due to a billing issue.';
const COUSIN_JOBS = [
  'Cousin Install (ubuntu-latest, Node 20, npm)',
  'Cousin Install (ubuntu-latest, Node 20, pnpm)',
  'Cousin Install (ubuntu-latest, Node 20, bun)',
  'Cousin Install (ubuntu-latest, Node 22, npm)',
  'Cousin Install (ubuntu-latest, Node 22, pnpm)',
  'Cousin Install (ubuntu-latest, Node 22, bun)',
  'Cousin Install (macos-15, Node 20, npm)',
  'Cousin Install (macos-15, Node 20, pnpm)',
  'Cousin Install (macos-15, Node 20, bun)',
  'Cousin Install (macos-15, Node 22, npm)',
  'Cousin Install (macos-15, Node 22, pnpm)',
  'Cousin Install (macos-15, Node 22, bun)',
  'Cousin Install (windows-latest, Node 20, npm)',
  'Cousin Install (windows-latest, Node 20, pnpm)',
  'Cousin Install (windows-latest, Node 20, bun)',
  'Cousin Install (windows-latest, Node 22, npm)',
  'Cousin Install (windows-latest, Node 22, pnpm)',
  'Cousin Install (windows-latest, Node 22, bun)',
];

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function makeContract() {
  return {
    schemaVersion: 1,
    receiptSchemaVersion: 1,
    repository: 'chudeemeke/get-stuff-done',
    receiptPath: '.planning/evidence/phase43-hosted-verdict.json',
    acceptedConclusions: ['success'],
    allowUnexpectedWorkflows: false,
    workflows: [
      { name: 'CI', requiredJobs: ['Lint', 'Test (ubuntu-latest)'] },
      {
        name: 'Cousin Install',
        requiredJobMatrices: [
          {
            template: 'Cousin Install ({}, Node {}, {})',
            dimensions: [
              ['ubuntu-latest', 'macos-15', 'windows-latest'],
              ['20', '22'],
              ['npm', 'pnpm', 'bun'],
            ],
            expectedCount: 18,
          },
        ],
      },
      { name: 'Oversight Probes', requiredJobs: ['Verify Oversight Probes'] },
      { name: 'Compat Matrix', requiredJobs: ['Vetted Upstream Compat Matrix'] },
      { name: 'Upgrade Verifier', requiredJobs: ['Upgrade Verifier'] },
    ],
  };
}

function makeStep() {
  return { number: 1, name: 'Checkout', status: 'completed', conclusion: 'success' };
}

function makeRun(id, name, overrides = {}) {
  return {
    id,
    name,
    head_sha: EXPECTED_HEAD,
    event: 'pull_request',
    status: 'completed',
    conclusion: 'success',
    run_attempt: 1,
    pull_requests: [{ number: 23 }],
    html_url: `https://github.com/chudeemeke/get-stuff-done/actions/runs/${id}`,
    updated_at: '2026-07-14T02:38:30Z',
    ...overrides,
  };
}

function makeJob(id, name, overrides = {}) {
  return {
    id,
    name,
    status: 'completed',
    conclusion: 'success',
    steps: [makeStep()],
    html_url: `https://github.com/chudeemeke/get-stuff-done/actions/jobs/${id}`,
    ...overrides,
  };
}

function makeSuccessfulInput(contract = makeContract()) {
  const runs = contract.workflows.map((workflow, index) => makeRun(100 + index, workflow.name));
  const jobsByRun = {};

  for (const run of runs) {
    const workflow = contract.workflows.find(candidate => candidate.name === run.name);
    const names = workflow.requiredJobs || COUSIN_JOBS;
    jobsByRun[run.id] = names.map((name, index) => makeJob(run.id * 100 + index, name));
  }

  return {
    expectedHead: EXPECTED_HEAD,
    pullRequest: 23,
    prHeadAtStart: EXPECTED_HEAD,
    prHead: EXPECTED_HEAD,
    runs,
    jobsByRun,
    annotationsByJob: {},
    observedAt: '2026-07-14T03:50:00.000Z',
  };
}

function makeBillingLockedInput() {
  const input = makeSuccessfulInput();
  input.annotationsByJob = {};

  for (const run of input.runs) {
    run.conclusion = 'failure';
    const jobs = input.jobsByRun[run.id];
    for (const job of jobs) {
      job.conclusion = 'failure';
      job.steps = [];
      input.annotationsByJob[job.id] = [{ message: BILLING_MESSAGE }];
    }
  }

  return input;
}

describe('hosted CI verdict authority', () => {
  test('validates the tracked-envelope contract against exact workflow YAML topology', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

    expect(validateHostedContract(contract)).toBe(contract);
    expect(
      verifyWorkflowTopology(contract, workflowPath =>
        fs.readFileSync(path.join(PROJECT_ROOT, workflowPath), 'utf8')
      )
    ).toEqual({ workflows: 5, jobs: 39 });
  });

  test('rejects contract drift, evidence self-governance, and workflow topology drift', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    expect(() => validateHostedContract({ ...contract, unexpected: true })).toThrow(
      'unknown field'
    );
    expect(() =>
      validateHostedContract({ ...contract, acceptedConclusions: ['success', 'failure'] })
    ).toThrow('policy authority');
    expect(() =>
      validateHostedContract({ ...contract, allowUnexpectedWorkflows: true })
    ).toThrow('policy authority');
    expect(() =>
      validateHostedContract({ ...contract, repository: 'attacker/mirror' })
    ).toThrow('repository authority');
    expect(() => validateHostedContract({ ...contract, schemaVersion: 1 })).toThrow(
      'schema version 2'
    );
    expect(() => validateHostedContract({ ...contract, contractPath: 'config/other.json' })).toThrow(
      'path authority'
    );
    expect(() => validateHostedContract({ ...contract, workflows: null })).toThrow(
      'governed paths and workflows'
    );
    expect(() =>
      validateHostedContract({
        ...contract,
        governedPaths: { ...contract.governedPaths, unknown: ['README.md'] },
      })
    ).toThrow('unknown governed-path category');
    expect(() =>
      validateHostedContract({
        ...contract,
        governedPaths: { ...contract.governedPaths, source: [] },
      })
    ).toThrow('governed source paths');
    expect(() =>
      validateHostedContract({
        ...contract,
        governedPaths: {
          ...contract.governedPaths,
          policy: [...contract.governedPaths.policy, contract.governedPaths.source[0]],
        },
      })
    ).toThrow('unique across categories');
    expect(() =>
      validateHostedContract({
        ...contract,
        governedPaths: { ...contract.governedPaths, contract: ['config/other.json'] },
      })
    ).toThrow('govern its own contract path');
    expect(() =>
      validateHostedContract({
        ...contract,
        governedPaths: {
          ...contract.governedPaths,
          policy: [...contract.governedPaths.policy, `${contract.evidenceDirectory}/receipt.json`],
        },
      })
    ).toThrow('cannot be part');
    expect(() =>
      verifyWorkflowTopology(contract, workflowPath => {
        const source = fs.readFileSync(path.join(PROJECT_ROOT, workflowPath), 'utf8');
        return workflowPath.endsWith('ci.yml')
          ? source.replace('name: CI', 'name: Drifted CI')
          : source;
      })
    ).toThrow('pull_request authority');
  });

  test('computes canonical governed digests by category from exact commit bytes', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const observed = [];
    const digests = computeGovernedDigests(contract, filePath => {
      observed.push(filePath);
      return Buffer.from(`bytes:${filePath}\n`);
    });

    expect(Object.keys(digests)).toEqual(['source', 'workflow', 'contract', 'policy']);
    expect(observed).toEqual(Object.values(contract.governedPaths).flat());
    expect(digests.workflow).toHaveLength(5);
    expect(digests.source[0]).toEqual({
      path: contract.governedPaths.source[0],
      sha256: digest(Buffer.from(`bytes:${contract.governedPaths.source[0]}\n`)),
    });
  });

  test('builds only passed immutable envelopes with subject and purpose authority', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const verdict = evaluateHostedVerdict(makeSuccessfulInput(contract), contract);
    const governedDigests = computeGovernedDigests(contract, filePath =>
      Buffer.from(`bytes:${filePath}\n`)
    );
    const receiptPath = '.planning/evidence/hosted/43-11r-initial.json';
    const envelope = buildPassedEnvelope(verdict, contract, {
      purpose: 'Plan 11R initial hosted authority',
      receiptPath,
      governedDigests,
    });

    expect(validateHostedEnvelope(envelope, contract)).toBe(envelope);
    expect(envelope).toMatchObject({
      schemaVersion: 1,
      contractSchemaVersion: 2,
      repository: contract.repository,
      pullRequest: 23,
      checkedCommit: EXPECTED_HEAD,
      purpose: 'Plan 11R initial hosted authority',
      receiptPath,
      verdict: 'passed',
      hostedEvidenceExists: true,
      governedDigests,
    });
    expect(envelope).not.toHaveProperty('headSha');

    const unavailable = evaluateHostedVerdict(makeBillingLockedInput(), contract);
    expect(() =>
      buildPassedEnvelope(unavailable, contract, {
        purpose: 'must not publish',
        receiptPath,
        governedDigests,
      })
    ).toThrow('passed hosted verdict');
  });

  test('accepts only a complete successful exact-head workflow contract', () => {
    const receipt = evaluateHostedVerdict(makeSuccessfulInput(), makeContract());

    expect(receipt.verdict).toBe('passed');
    expect(receipt.hostedEvidenceExists).toBe(true);
    expect(receipt.headSha).toBe(EXPECTED_HEAD);
    expect(receipt.workflows).toHaveLength(5);
    expect(receipt.diagnostics).toEqual([]);
  });

  test('fails when the live PR head differs from local HEAD', () => {
    const input = makeSuccessfulInput();
    input.prHead = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    const receipt = evaluateHostedVerdict(input, makeContract());

    expect(receipt.verdict).toBe('failed');
    expect(receipt.hostedEvidenceExists).toBe(false);
    expect(receipt.diagnostics.map(item => item.code)).toContain('head_mismatch');
    expect(receipt.diagnostics.map(item => item.code)).toContain(
      'head_changed_during_collection'
    );
  });

  test('fails closed on missing and unexpected workflows', () => {
    const missing = makeSuccessfulInput();
    missing.runs = missing.runs.filter(run => run.name !== 'Compat Matrix');
    const unexpected = makeSuccessfulInput();
    unexpected.runs.push(makeRun(999, 'Unclassified Workflow'));

    expect(
      evaluateHostedVerdict(missing, makeContract()).diagnostics.map(item => item.code)
    ).toContain('missing_workflow');
    expect(
      evaluateHostedVerdict(unexpected, makeContract()).diagnostics.map(item => item.code)
    ).toContain('unexpected_workflow');
  });

  test('fails closed on missing jobs, pending jobs, and executed failures', () => {
    const missingJob = makeSuccessfulInput();
    missingJob.jobsByRun[100] = missingJob.jobsByRun[100].filter(job => job.name !== 'Lint');
    const pendingJob = makeSuccessfulInput();
    pendingJob.jobsByRun[100][0].status = 'in_progress';
    pendingJob.jobsByRun[100][0].conclusion = null;
    const failedJob = makeSuccessfulInput();
    failedJob.jobsByRun[100][0].conclusion = 'failure';

    expect(
      evaluateHostedVerdict(missingJob, makeContract()).diagnostics.map(item => item.code)
    ).toContain('missing_job');
    expect(
      evaluateHostedVerdict(pendingJob, makeContract()).diagnostics.map(item => item.code)
    ).toContain('job_incomplete');
    expect(
      evaluateHostedVerdict(failedJob, makeContract()).diagnostics.map(item => item.code)
    ).toContain('job_failed');
  });

  test('selects the latest run attempt for each workflow', () => {
    const input = makeSuccessfulInput();
    const oldRun = makeRun(50, 'CI', {
      conclusion: 'failure',
      run_attempt: 1,
      updated_at: '2026-07-14T02:30:00Z',
    });
    input.runs.push(oldRun);
    input.runs.find(run => run.name === 'CI').run_attempt = 2;
    input.jobsByRun[oldRun.id] = [makeJob(5000, 'Lint', { conclusion: 'failure' })];

    const receipt = evaluateHostedVerdict(input, makeContract());

    expect(receipt.verdict).toBe('passed');
    expect(receipt.workflows.find(workflow => workflow.name === 'CI').attempt).toBe(2);
  });

  test('uses update time and run ID to break equal-attempt ties deterministically', () => {
    const early = makeRun(1, 'CI', { updated_at: '2026-07-14T02:00:00Z' });
    const laterLowId = makeRun(2, 'CI', { updated_at: '2026-07-14T03:00:00Z' });
    const laterHighId = makeRun(3, 'CI', { updated_at: '2026-07-14T03:00:00Z' });

    expect(selectLatestRuns([early, laterLowId, laterHighId]).get('CI').id).toBe(3);
  });

  test('rejects malformed job-matrix cardinality and placeholder contracts', () => {
    expect(() =>
      expandJobMatrices([
        { template: 'Job {}', dimensions: [['one', 'two']], expectedCount: 3 },
      ])
    ).toThrow('expands to 2');
    expect(() =>
      expandJobMatrices([
        { template: 'Job {} {}', dimensions: [['one']], expectedCount: 1 },
      ])
    ).toThrow('unused placeholders');
  });

  test('classifies the verified zero-step billing lock as unavailable evidence', () => {
    const receipt = evaluateHostedVerdict(makeBillingLockedInput(), makeContract());

    expect(receipt.verdict).toBe('unavailable');
    expect(receipt.reason).toBe('account_billing_lock');
    expect(receipt.hostedEvidenceExists).toBe(false);
    expect(receipt.diagnostics.map(item => item.code)).toContain('zero_step_billing_lock');
  });

  test('does not misclassify an unannotated zero-step failure as billing lock', () => {
    const input = makeBillingLockedInput();
    input.annotationsByJob = {};

    const receipt = evaluateHostedVerdict(input, makeContract());

    expect(receipt.verdict).toBe('failed');
    expect(receipt.reason).not.toBe('account_billing_lock');
    expect(receipt.diagnostics.map(item => item.code)).toContain('zero_step_failure');
  });

  test('rejects collection drift, wrong PR or trigger authority, incomplete runs, and unclassified jobs', () => {
    const input = makeSuccessfulInput();
    input.localHeadAtEnd = 'c'.repeat(40);
    input.runs[0].head_sha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    input.runs[0].event = 'workflow_dispatch';
    input.runs[0].pull_requests = [{ number: 99 }];
    input.runs[0].status = 'in_progress';
    input.runs[0].conclusion = null;
    input.jobsByRun[input.runs[0].id].push(makeJob(77777, 'Unclassified Job'));

    const codes = evaluateHostedVerdict(input, makeContract()).diagnostics.map(item => item.code);

    expect(codes).toContain('local_head_changed_during_collection');
    expect(codes).toContain('run_head_mismatch');
    expect(codes).toContain('run_event_mismatch');
    expect(codes).toContain('run_pr_mismatch');
    expect(codes).toContain('run_incomplete');
    expect(codes).toContain('unexpected_job');
  });

  test('repository contract names the full workflow and cousin matrix authority', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const workflowNames = contract.workflows.map(workflow => workflow.name).sort();
    const cousin = contract.workflows.find(workflow => workflow.name === 'Cousin Install');

    expect(workflowNames).toEqual([
      'CI',
      'Compat Matrix',
      'Cousin Install',
      'Oversight Probes',
      'Upgrade Verifier',
    ]);
    expect(cousin.requiredJobMatrices).toHaveLength(1);
    expect(cousin.requiredJobMatrices[0].expectedCount).toBe(18);
    expect(
      JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')).scripts[
        'phase43:hosted-verdict'
      ]
    ).toBe('node scripts/verify-hosted-ci.js');
    expect(contract.evidenceDirectory).toBe('.planning/evidence/hosted');
    expect(fs.readFileSync(path.join(PROJECT_ROOT, '.gitignore'), 'utf8')).not.toContain(
      contract.evidenceDirectory
    );
  });
});

describe('hosted CI infrastructure ports', () => {
  test('runs structured commands without a shell and parses JSON', () => {
    const calls = [];
    const result = runJsonCommand('gh', ['api', 'repos/example/project/pulls/23'], {
      spawnSync(command, args, options) {
        calls.push({ command, args, options });
        return { status: 0, stdout: '{"head":{"sha":"abc"}}', stderr: '' };
      },
    });

    expect(result.head.sha).toBe('abc');
    expect(calls).toHaveLength(1);
    expect(calls[0].options.shell).toBe(false);
    expect(calls[0].options.encoding).toBe('utf8');
  });

  test('rejects command failures and malformed JSON without echoing environment', () => {
    const fineGrainedToken = ['github', 'pat', '1234567890abcdefghij'].join('_');
    const classicToken = ['ghp', '1234567890abcdefghij'].join('_');
    let commandError;
    try {
      runJsonCommand('gh', ['api', 'x'], {
        spawnSync() {
          return {
            status: 1,
            stdout: '',
            stderr: `request failed Authorization: Bearer ${fineGrainedToken} GH_TOKEN=${classicToken}`,
          };
        },
      });
    } catch (error) {
      commandError = error;
    }
    expect(commandError.message).toContain('request failed');
    expect(commandError.message).toContain('[redacted]');
    expect(commandError.message).not.toContain(fineGrainedToken);
    expect(commandError.message).not.toContain(classicToken);
    expect(() =>
      runJsonCommand('gh', ['api', 'x'], {
        spawnSync() {
          return { status: 0, stdout: 'not-json', stderr: '' };
        },
      })
    ).toThrow('valid JSON');
    expect(() =>
      runJsonCommand('gh', ['api', 'x'], {
        spawnSync() {
          return { error: new Error('spawn failed') };
        },
      })
    ).toThrow('spawn failed');
  });

  test('runs text commands without a shell and fails closed on command errors', () => {
    const calls = [];
    expect(
      runTextCommand('git', ['rev-parse', 'HEAD'], {
        spawnSync(command, args, options) {
          calls.push({ command, args, options });
          return { status: 0, stdout: 'abc\n', stderr: '' };
        },
      })
    ).toBe('abc');
    expect(calls[0].options.shell).toBe(false);
    expect(() =>
      runTextCommand('git', ['rev-parse', 'HEAD'], {
        spawnSync() {
          return { status: 1, stdout: '', stderr: '' };
        },
      })
    ).toThrow('unknown command failure');
    expect(() =>
      runTextCommand('git', ['rev-parse', 'HEAD'], {
        spawnSync() {
          return { error: new Error('git unavailable') };
        },
      })
    ).toThrow('git unavailable');
  });

  test('collects exact-head runs, latest jobs, and zero-step annotations', () => {
    const run = makeRun(100, 'CI', { conclusion: 'failure' });
    const job = makeJob(1000, 'Lint', { conclusion: 'failure', steps: [] });
    const calls = [];
    let pullReads = 0;
    const input = collectHostedData(
      { repository: 'chudeemeke/get-stuff-done', pullRequest: 23 },
      {
        runTextCommand(command, args) {
          calls.push([command, ...args]);
          return EXPECTED_HEAD;
        },
        runJsonCommand(command, args) {
          calls.push([command, ...args]);
          const endpoint = args[1];
          if (endpoint.includes('/pulls/23')) {
            pullReads += 1;
            return { head: { sha: EXPECTED_HEAD } };
          }
          if (endpoint.includes('/actions/runs?')) return { total_count: 1, workflow_runs: [run] };
          if (endpoint.includes('/actions/runs/100/jobs')) return { total_count: 1, jobs: [job] };
          if (endpoint.includes('/check-runs/1000/annotations')) {
            return [{ message: BILLING_MESSAGE }];
          }
          throw new Error(`Unexpected endpoint: ${endpoint}`);
        },
      }
    );

    expect(input.expectedHead).toBe(EXPECTED_HEAD);
    expect(input.prHeadAtStart).toBe(EXPECTED_HEAD);
    expect(input.prHead).toBe(EXPECTED_HEAD);
    expect(pullReads).toBe(2);
    expect(input.jobsByRun[100]).toEqual([job]);
    expect(input.annotationsByJob[1000]).toEqual([{ message: BILLING_MESSAGE }]);
    expect(calls.every(call => call[0] === 'gh' || call[0] === 'git')).toBe(true);
  });

  test('rejects incomplete workflow and job pagination', () => {
    expect(() =>
      collectHostedData(
        { repository: 'chudeemeke/get-stuff-done', pullRequest: 23 },
        {
          runTextCommand: () => EXPECTED_HEAD,
          runJsonCommand(command, args) {
            return args[1].includes('/pulls/')
              ? { head: { sha: EXPECTED_HEAD } }
              : { total_count: 2, workflow_runs: [makeRun(1, 'CI')] };
          },
        }
      )
    ).toThrow('exceeded one page');

    expect(() =>
      collectHostedData(
        { repository: 'chudeemeke/get-stuff-done', pullRequest: 23 },
        {
          runTextCommand: () => EXPECTED_HEAD,
          runJsonCommand(command, args) {
            if (args[1].includes('/pulls/')) return { head: { sha: EXPECTED_HEAD } };
            if (args[1].includes('/actions/runs?')) {
              return { total_count: 1, workflow_runs: [makeRun(1, 'CI')] };
            }
            return { total_count: 2, jobs: [makeJob(1, 'Lint')] };
          },
        }
      )
    ).toThrow('run 1');
  });

  test('parses explicit collect and offline verification modes', () => {
    const receipt = '.planning/evidence/hosted/43-11r-initial.json';
    expect(
      parseArgs([
        'collect',
        '--pr',
        '23',
        '--receipt',
        receipt,
        '--purpose',
        'Plan 11R initial hosted authority',
      ])
    ).toEqual({
      mode: 'collect',
      pullRequest: 23,
      receiptPath: receipt,
      purpose: 'Plan 11R initial hosted authority',
      subjectCommit: null,
    });
    expect(parseArgs(['verify-pending', '--pr', '23', '--receipt', receipt])).toMatchObject({
      mode: 'verify-pending',
      pullRequest: 23,
      receiptPath: receipt,
    });
    expect(
      parseArgs([
        'verify-receipt',
        '--pr',
        '23',
        '--receipt',
        receipt,
        '--subject',
        EXPECTED_HEAD,
      ])
    ).toMatchObject({ mode: 'verify-receipt', subjectCommit: EXPECTED_HEAD });
    expect(parseArgs(['--help'])).toEqual({ help: true });
    expect(() => parseArgs(['collect', '--pr', '23', '--receipt', receipt])).toThrow(
      '--purpose'
    );
    expect(() => parseArgs(['--pr', '23'])).toThrow('mode');
  });

  test('receipt paths stay inside the hosted directory and never target existing bytes', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hosted-path-'));
    const hosted = path.join(root, '.planning', 'evidence', 'hosted');
    const outside = path.join(root, 'outside');
    fs.mkdirSync(hosted, { recursive: true });
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(hosted, 'existing.json'), '{}\n');
    fs.symlinkSync(outside, path.join(hosted, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    const contract = { evidenceDirectory: '.planning/evidence/hosted' };

    try {
      expect(
        resolveReceiptPath(root, contract, '.planning/evidence/hosted/new.json', {
          mustNotExist: true,
        })
      ).toBe(path.join(hosted, 'new.json'));
      expect(() =>
        resolveReceiptPath(root, contract, '.planning/evidence/hosted/existing.json', {
          mustNotExist: true,
        })
      ).toThrow('already exists');
      expect(() =>
        resolveReceiptPath(root, contract, '.planning/evidence/hosted/escape/out.json', {
          mustNotExist: true,
        })
      ).toThrow('outside');
      expect(() =>
        resolveReceiptPath(root, contract, '.planning/evidence/hosted/../outside.json')
      ).toThrow('repository-relative');
      expect(() => resolveReceiptPath(root, contract, 'other/receipt.json')).toThrow(
        'hosted evidence directory'
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('atomic receipt publication is create-only', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hosted-write-'));
    const receiptPath = path.join(root, 'receipt.json');

    try {
      writeReceiptAtomic(receiptPath, { sequence: 1 });
      expect(() => writeReceiptAtomic(receiptPath, { sequence: 2 })).toThrow();
      expect(JSON.parse(fs.readFileSync(receiptPath, 'utf8'))).toEqual({ sequence: 1 });
      expect(fs.readdirSync(root)).toEqual(['receipt.json']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('atomic receipt publication rolls back a linked receipt when cleanup fails', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hosted-rollback-'));
    const receiptPath = path.join(root, 'receipt.json');
    let failedTempCleanup = false;
    const fileSystem = {
      mkdirSync: fs.mkdirSync,
      writeFileSync: fs.writeFileSync,
      linkSync: fs.linkSync,
      unlinkSync(filePath) {
        if (!failedTempCleanup && filePath.includes('.tmp.')) {
          failedTempCleanup = true;
          throw new Error('simulated temp cleanup failure');
        }
        return fs.unlinkSync(filePath);
      },
    };

    try {
      expect(() =>
        writeReceiptAtomic(receiptPath, { sequence: 1 }, { fileSystem })
      ).toThrow('simulated temp cleanup failure');
      expect(fs.readdirSync(root)).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('collection publishes only a passed exact-head envelope', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const receiptPath = '.planning/evidence/hosted/43-11r-initial.json';
    const writes = [];
    const readTracked = (_commit, filePath) => fs.readFileSync(path.join(PROJECT_ROOT, filePath));
    const baseDependencies = {
      contract,
      projectRoot: PROJECT_ROOT,
      resolveReceiptPath: () => path.join(PROJECT_ROOT, ...receiptPath.split('/')),
      readTracked,
      readCurrent: filePath => fs.readFileSync(path.join(PROJECT_ROOT, filePath)),
      writeReceiptAtomic: (filePath, value) => writes.push({ filePath, value }),
    };
    const options = {
      mode: 'collect',
      pullRequest: 23,
      receiptPath,
      purpose: 'Plan 11R initial hosted authority',
      subjectCommit: null,
    };

    const envelope = collectHostedEnvelope(options, {
      ...baseDependencies,
      collectHostedData: () => makeSuccessfulInput(contract),
    });
    expect(envelope.checkedCommit).toBe(EXPECTED_HEAD);
    expect(writes).toEqual([
      {
        filePath: path.join(PROJECT_ROOT, ...receiptPath.split('/')),
        value: envelope,
      },
    ]);

    writes.length = 0;
    const unavailable = collectHostedEnvelope(options, {
      ...baseDependencies,
      collectHostedData: () => makeBillingLockedInput(),
    });
    expect(unavailable.verdict).toBe('unavailable');
    expect(unavailable.hostedEvidenceExists).toBe(false);
    expect(writes).toEqual([]);
  });

  test('pending verification is offline, untracked, and bound to current HEAD', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const receiptPath = '.planning/evidence/hosted/43-11r-initial.json';
    const governedDigests = computeGovernedDigests(contract, filePath =>
      fs.readFileSync(path.join(PROJECT_ROOT, filePath))
    );
    const envelope = buildPassedEnvelope(
      evaluateHostedVerdict(makeSuccessfulInput(contract), contract),
      contract,
      {
        purpose: 'Plan 11R initial hosted authority',
        receiptPath,
        governedDigests,
      }
    );
    const dependencies = {
      contract,
      projectRoot: PROJECT_ROOT,
      resolveReceiptPath: () => path.join(PROJECT_ROOT, ...receiptPath.split('/')),
      readFile: () => Buffer.from(JSON.stringify(envelope)),
      getHead: () => EXPECTED_HEAD,
      isTracked: () => false,
      readTracked: (_commit, filePath) => fs.readFileSync(path.join(PROJECT_ROOT, filePath)),
      readCurrent: filePath => fs.readFileSync(path.join(PROJECT_ROOT, filePath)),
    };
    const options = {
      mode: 'verify-pending',
      pullRequest: 23,
      receiptPath,
      purpose: null,
      subjectCommit: null,
    };

    expect(verifyPendingEnvelope(options, dependencies)).toEqual(envelope);
    expect(() => verifyPendingEnvelope(options, { ...dependencies, isTracked: () => true })).toThrow(
      'must not already be tracked'
    );
    expect(() =>
      verifyPendingEnvelope(options, {
        ...dependencies,
        getHead: () => 'b'.repeat(40),
      })
    ).toThrow('current HEAD');
    expect(() =>
      verifyPendingEnvelope(options, {
        ...dependencies,
        readTracked: (_commit, filePath) =>
          filePath === contract.governedPaths.source[0]
            ? Buffer.from('changed\n')
            : fs.readFileSync(path.join(PROJECT_ROOT, filePath)),
      })
    ).toThrow('governed digests');
  });

  test('tracked verification requires strict ancestry and unchanged governed bytes', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const checkedCommit = 'a'.repeat(40);
    const subjectCommit = 'b'.repeat(40);
    const receiptPath = '.planning/evidence/hosted/43-11r-initial.json';
    const input = makeSuccessfulInput(contract);
    input.expectedHead = checkedCommit;
    input.prHeadAtStart = checkedCommit;
    input.prHead = checkedCommit;
    for (const run of input.runs) run.head_sha = checkedCommit;
    const governedDigests = computeGovernedDigests(contract, filePath =>
      fs.readFileSync(path.join(PROJECT_ROOT, filePath))
    );
    const envelope = buildPassedEnvelope(evaluateHostedVerdict(input, contract), contract, {
      purpose: 'Plan 11R initial hosted authority',
      receiptPath,
      governedDigests,
    });
    const readTracked = (commit, filePath) => {
      if (commit === subjectCommit && filePath === receiptPath) {
        return Buffer.from(JSON.stringify(envelope));
      }
      return fs.readFileSync(path.join(PROJECT_ROOT, filePath));
    };
    const options = {
      mode: 'verify-receipt',
      pullRequest: 23,
      receiptPath,
      purpose: null,
      subjectCommit,
    };
    const dependencies = {
      contract,
      readTracked,
      isTrackedAt: () => true,
      isAncestor: () => true,
    };

    expect(verifyTrackedEnvelope(options, dependencies)).toEqual(envelope);
    expect(() =>
      verifyTrackedEnvelope(options, { ...dependencies, isAncestor: () => false })
    ).toThrow('strict ancestor');
    expect(() =>
      verifyTrackedEnvelope(options, {
        ...dependencies,
        readTracked: (commit, filePath) => {
          if (commit === subjectCommit && filePath === contract.governedPaths.source[0]) {
            return Buffer.from('changed after CI\n');
          }
          return readTracked(commit, filePath);
        },
      })
    ).toThrow('governed digests');
    expect(() =>
      verifyTrackedEnvelope(options, { ...dependencies, isTrackedAt: () => false })
    ).toThrow('tracked in the subject commit');
  });

  test('tracked verification rejects malformed authority before invoking Git adapters', () => {
    const forbidden = () => {
      throw new Error('Git adapter must not receive malformed authority');
    };
    const dependencies = {
      readTracked: forbidden,
      isTrackedAt: forbidden,
    };

    expect(() =>
      verifyTrackedEnvelope(
        {
          pullRequest: 23,
          receiptPath: '.planning/evidence/hosted/receipt.json',
          subjectCommit: 'not-a-commit',
        },
        dependencies
      )
    ).toThrow('subject commit');
    expect(() =>
      verifyTrackedEnvelope(
        {
          pullRequest: 23,
          receiptPath: 'outside/receipt.json',
          subjectCommit: 'b'.repeat(40),
        },
        dependencies
      )
    ).toThrow('hosted evidence directory');
  });

  test('CLI help is side-effect free and mode routing redacts failures', () => {
    const stdout = [];
    const stderr = [];
    const forbidden = () => {
      throw new Error('help must not inspect the repository or GitHub');
    };
    expect(
      main(['--help'], {
        createDefaultDependencies: forbidden,
        stdout: { write: value => stdout.push(value) },
        stderr: { write: value => stderr.push(value) },
      })
    ).toBe(0);
    expect(stdout.join('')).toContain('collect');
    expect(stdout.join('')).toContain('verify-pending');
    expect(stdout.join('')).toContain('verify-receipt');
    expect(stdout.join('')).toContain('immutable tracked envelope');
    expect(stderr).toEqual([]);

    const receiptPath = '.planning/evidence/hosted/43-11r-initial.json';
    const calls = [];
    const options = [
      'collect',
      '--pr',
      '23',
      '--receipt',
      receiptPath,
      '--purpose',
      'Plan 11R initial hosted authority',
    ];
    expect(
      main(options, {
        collectHostedEnvelope: parsed => {
          calls.push(parsed);
          return { verdict: 'passed', checkedCommit: EXPECTED_HEAD, receiptPath };
        },
        stdout: { write: value => stdout.push(value) },
        stderr: { write: value => stderr.push(value) },
      })
    ).toBe(0);
    expect(calls[0]).toMatchObject({ mode: 'collect', pullRequest: 23, receiptPath });

    const classicToken = ['ghp', '1234567890abcdefghij'].join('_');
    expect(
      main(options, {
        collectHostedEnvelope: () => {
          throw new Error(`GH_TOKEN=${classicToken}`);
        },
        stdout: { write: value => stdout.push(value) },
        stderr: { write: value => stderr.push(value) },
      })
    ).toBe(1);
    expect(stderr.join('')).toContain('[redacted]');
    expect(stderr.join('')).not.toContain(classicToken);
  });

  test('CLI routes both offline verification modes without constructing real adapters', () => {
    const receiptPath = '.planning/evidence/hosted/43-11r-initial.json';
    const subjectCommit = 'b'.repeat(40);
    const calls = [];
    const forbidden = () => {
      throw new Error('injected handlers must not construct real adapters');
    };
    const output = { write() {} };
    const dependencies = {
      createDefaultDependencies: forbidden,
      verifyPendingEnvelope: options => {
        calls.push(options);
        return { checkedCommit: EXPECTED_HEAD };
      },
      verifyTrackedEnvelope: options => {
        calls.push(options);
        return { checkedCommit: EXPECTED_HEAD };
      },
      stdout: output,
      stderr: output,
    };

    expect(
      main(['verify-pending', '--pr', '23', '--receipt', receiptPath], dependencies)
    ).toBe(0);
    expect(
      main(
        [
          'verify-receipt',
          '--pr',
          '23',
          '--receipt',
          receiptPath,
          '--subject',
          subjectCommit,
        ],
        dependencies
      )
    ).toBe(0);
    expect(calls).toEqual([
      expect.objectContaining({ mode: 'verify-pending', receiptPath }),
      expect.objectContaining({ mode: 'verify-receipt', receiptPath, subjectCommit }),
    ]);
  });

  test('default Git adapters distinguish tracked, missing, and ancestor evidence', () => {
    const dependencies = createDefaultDependencies(PROJECT_ROOT);
    const head = dependencies.getHead();

    expect(head).toMatch(/^[0-9a-f]{40}$/);
    expect(dependencies.isTracked('config/phase43-hosted-ci-contract.json')).toBe(true);
    expect(dependencies.isTrackedAt(head, 'config/phase43-hosted-ci-contract.json')).toBe(true);
    expect(dependencies.isTrackedAt(head, '.planning/evidence/hosted/missing.json')).toBe(false);
    expect(dependencies.isAncestor(head, head)).toBe(true);
    expect(dependencies.readTracked(head, 'package.json')).toEqual(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'))
    );
  });
});

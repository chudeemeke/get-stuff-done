'use strict';

const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  collectHostedData,
  evaluateHostedVerdict,
  expandJobMatrices,
  main,
  parseArgs,
  runJsonCommand,
  runTextCommand,
  selectLatestRuns,
  validateHostedContract,
  verifyWorkflowTopology,
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

  test('rejects run-head drift, incomplete runs, and unclassified jobs', () => {
    const input = makeSuccessfulInput();
    input.runs[0].head_sha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    input.runs[0].status = 'in_progress';
    input.runs[0].conclusion = null;
    input.jobsByRun[input.runs[0].id].push(makeJob(77777, 'Unclassified Job'));

    const codes = evaluateHostedVerdict(input, makeContract()).diagnostics.map(item => item.code);

    expect(codes).toContain('run_head_mismatch');
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
    expect(fs.readFileSync(path.join(PROJECT_ROOT, '.gitignore'), 'utf8')).toContain(
      '.planning/evidence/phase43-hosted-verdict.json'
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

  test('atomically replaces a stale passed receipt with the latest verdict', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hosted-verdict-'));
    const reportPath = path.join(tempDir, 'receipt.json');

    try {
      fs.writeFileSync(reportPath, JSON.stringify({ verdict: 'passed', headSha: 'stale' }));
      writeReceiptAtomic(reportPath, { verdict: 'unavailable', headSha: EXPECTED_HEAD });

      expect(JSON.parse(fs.readFileSync(reportPath, 'utf8'))).toEqual({
        verdict: 'unavailable',
        headSha: EXPECTED_HEAD,
      });
      expect(fs.readdirSync(tempDir)).toEqual(['receipt.json']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('parses only the positive pull request argument', () => {
    expect(parseArgs(['--', '--pr', '23'])).toEqual({ pullRequest: 23 });
    expect(() => parseArgs([])).toThrow('positive integer');
    expect(() => parseArgs(['--pr', 'nope'])).toThrow('positive integer');
    expect(() => parseArgs(['--unknown'])).toThrow('Unknown argument');
  });

  test('main publishes passed and collection-error receipts through injected ports', () => {
    const classicToken = ['ghp', '1234567890abcdefghij'].join('_');
    const writes = [];
    const stdout = [];
    const stderr = [];
    const dependencies = {
      contract: makeContract(),
      collectHostedData: () => makeSuccessfulInput(),
      writeReceiptAtomic(reportPath, receipt) {
        writes.push({ reportPath, receipt });
      },
      stdout: { write: message => stdout.push(message) },
      stderr: { write: message => stderr.push(message) },
    };

    expect(main(['--pr', '23'], dependencies)).toBe(0);
    expect(writes[0].reportPath).toEndWith('phase43-hosted-verdict.json');
    expect(writes[0].receipt.verdict).toBe('passed');
    expect(stdout).toHaveLength(1);
    expect(stderr).toEqual([]);

    dependencies.collectHostedData = () => {
      throw new Error(`GitHub unavailable GH_TOKEN=${classicToken}`);
    };
    expect(main(['--pr', '23'], dependencies)).toBe(1);
    expect(writes[1].receipt.verdict).toBe('unavailable');
    expect(writes[1].receipt.reason).toBe('collection_error');
    expect(stderr[0]).toContain('GitHub unavailable');
    expect(writes[1].receipt.diagnostics[0].message).toContain('[redacted]');
    expect(JSON.stringify(writes[1].receipt)).not.toContain(classicToken);
    expect(stderr[0]).not.toContain(classicToken);
  });

  test('main rejects invalid CLI input before receipt publication', () => {
    const messages = [];
    const writes = [];

    expect(
      main([], {
        writeReceiptAtomic: (...args) => writes.push(args),
        stderr: { write: message => messages.push(message) },
      })
    ).toBe(1);
    expect(writes).toEqual([]);
    expect(messages[0]).toContain('--pr');
  });

  test('main replaces stale evidence when the receipt contract drifts', () => {
    const writes = [];
    const contract = makeContract();
    contract.receiptPath = '.planning/evidence/wrong.json';

    expect(
      main(['--pr', '23'], {
        contract,
        writeReceiptAtomic(reportPath, receipt) {
          writes.push({ reportPath, receipt });
        },
        stdout: { write() {} },
        stderr: { write() {} },
      })
    ).toBe(1);
    expect(writes).toHaveLength(1);
    expect(writes[0].reportPath).toEndWith('phase43-hosted-verdict.json');
    expect(writes[0].receipt.reason).toBe('collection_error');
  });
});

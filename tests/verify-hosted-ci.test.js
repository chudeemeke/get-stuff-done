'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const { spawnSync } = require('child_process');
const { createHash } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
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
  validateTierARunnerReceipt,
  validateTierBRuntimeReceipt,
  verifyWorkflowTopology,
  verifyPendingEnvelope,
  verifyTrackedEnvelope,
  writeReceiptAtomic,
} = require('../scripts/verify-hosted-ci');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTRACT_PATH = path.join(PROJECT_ROOT, 'config', 'phase43-hosted-ci-contract.json');
const TOOLCHAIN_MANIFEST_PATH = path.join(
  PROJECT_ROOT,
  'config',
  'phase43-toolchain-authority.json'
);
const EXPECTED_HEAD = '64f137a110e985c86b08acb3140bc8b982d34843';
const BOOTSTRAP_SHA = '5c813db4d8a17bd2dbf7523e016a5152a6a0c3ce';
const HARNESS_SHA = '35cbe0883a65409b13f9b7cc6347c793df2a2f15';
const BILLING_MESSAGE = 'The job was not started because your account is locked due to a billing issue.';
const SUBJECT_CHECKOUT_STEP = 'Checkout exact event subject';
const SUBJECT_VERIFY_STEP = 'Verify execution subject';
const MAX_HOSTED_RECEIPT_BYTES = 1024 * 1024;
const WORKFLOW_PATHS = {
  CI: '.github/workflows/ci.yml',
  'Cousin Install': '.github/workflows/cousin-install.yml',
  'Oversight Probes': '.github/workflows/oversight-probes.yml',
  'Compat Matrix': '.github/workflows/compat-matrix.yml',
  'Upgrade Verifier': '.github/workflows/upgrade-verifier.yml',
};
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
    executionSubject: {
      checkoutStep: SUBJECT_CHECKOUT_STEP,
      verificationStep: SUBJECT_VERIFY_STEP,
      requireAdjacent: true,
    },
    workflows: [
      { name: 'CI', path: WORKFLOW_PATHS.CI, requiredJobs: ['Lint', 'Test (ubuntu-latest)'] },
      {
        name: 'Cousin Install',
        path: WORKFLOW_PATHS['Cousin Install'],
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
      {
        name: 'Oversight Probes',
        path: WORKFLOW_PATHS['Oversight Probes'],
        requiredJobs: ['Verify Oversight Probes'],
      },
      {
        name: 'Compat Matrix',
        path: WORKFLOW_PATHS['Compat Matrix'],
        requiredJobs: ['Vetted Upstream Compat Matrix'],
      },
      {
        name: 'Upgrade Verifier',
        path: WORKFLOW_PATHS['Upgrade Verifier'],
        requiredJobs: ['Upgrade Verifier'],
      },
    ],
  };
}

function makeStep(number, name, overrides = {}) {
  return { number, name, status: 'completed', conclusion: 'success', ...overrides };
}

function makeRun(id, name, overrides = {}) {
  return {
    id,
    name,
    path: WORKFLOW_PATHS[name] || '.github/workflows/unclassified.yml',
    head_sha: EXPECTED_HEAD,
    event: 'pull_request',
    status: 'completed',
    conclusion: 'success',
    run_attempt: 1,
    pull_requests: [{ number: 23 }],
    html_url: `https://github.com/chudeemeke/get-stuff-done/actions/runs/${id}`,
    created_at: '2026-07-14T02:00:00Z',
    updated_at: '2026-07-14T02:38:30Z',
    ...overrides,
  };
}

function makeJob(id, name, overrides = {}) {
  const runId = overrides.run_id;
  return {
    id,
    name,
    status: 'completed',
    conclusion: 'success',
    steps: [makeStep(1, SUBJECT_CHECKOUT_STEP), makeStep(2, SUBJECT_VERIFY_STEP)],
    html_url: Number.isInteger(runId)
      ? `https://github.com/chudeemeke/get-stuff-done/actions/runs/${runId}/job/${id}`
      : `https://github.com/chudeemeke/get-stuff-done/actions/jobs/${id}`,
    ...overrides,
  };
}

function makeSuccessfulInput(contract = makeContract()) {
  const runs = contract.workflows.map((workflow, index) => makeRun(100 + index, workflow.name));
  const jobsByRun = {};

  for (const run of runs) {
    const workflow = contract.workflows.find(candidate => candidate.name === run.name);
    const names = workflow.requiredJobs || COUSIN_JOBS;
    jobsByRun[run.id] = names.map((name, index) => {
      const performance = contract.executionSubject?.performanceProfile;
      const steps = performance?.jobNames?.includes(name)
        ? performance.checkouts.flatMap((checkout, checkoutIndex) => [
            makeStep(checkoutIndex * 2 + 1, checkout.checkoutStep),
            makeStep(checkoutIndex * 2 + 2, checkout.verificationStep),
          ])
        : undefined;
      return makeJob(run.id * 100 + index, name, {
        run_id: run.id,
        ...(steps ? { steps } : {}),
      });
    });
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

function makeSubjectCompliantWorkflow(workflowPath, contract) {
  const document = yaml.load(fs.readFileSync(path.join(PROJECT_ROOT, workflowPath), 'utf8'));
  const policy = contract.executionSubject;
  const toolchainManifest = JSON.parse(fs.readFileSync(TOOLCHAIN_MANIFEST_PATH, 'utf8'));
  const checkoutUses = `${policy.checkoutAction}@${toolchainManifest.githubActions.pins[policy.checkoutAction].sha}`;
  const securityUses = `${policy.securityPrelude.action}@${toolchainManifest.githubActions.pins[policy.securityPrelude.action].sha}`;
  const makeSubjectPair = definition => [
    {
      name: definition.checkoutStep,
      uses: checkoutUses,
      with: {
        repository: definition.repository,
        ref: definition.ref,
        path: definition.path,
        'persist-credentials': definition.persistCredentials,
        'fetch-depth': definition.fetchDepth,
        ...(definition.inputs || {}),
      },
    },
    {
      name: definition.verificationStep,
      shell: policy.verificationShell,
      env: {
        [policy.expectedSubjectEnvironment]: definition.ref,
        [policy.subjectPathEnvironment]: definition.path,
      },
      run: policy.verificationRun,
    },
  ];
  for (const [jobId, job] of Object.entries(document.jobs)) {
    const originalSteps = job.steps || [];
    const hasSecurityPrelude = originalSteps[0]?.uses?.startsWith(
      `${policy.securityPrelude.action}@`
    );
    const profile = policy.jobProfiles[workflowPath][jobId];
    const controls = profile === policy.performanceProfile.profile
      ? policy.performanceProfile.checkouts.flatMap(makeSubjectPair)
      : makeSubjectPair({
          checkoutStep: policy.checkoutStep,
          verificationStep: policy.verificationStep,
          repository: policy.checkoutRepository,
          ref: policy.checkoutRef,
          path: policy.checkoutPath,
          persistCredentials: policy.persistCredentials,
          fetchDepth: policy.fetchDepth,
          inputs: policy.checkoutInputs[workflowPath]?.[jobId] || {},
        });
    job.steps = [
      ...(hasSecurityPrelude
        ? [{ uses: securityUses, with: { ...originalSteps[0].with } }]
        : []),
      ...controls,
      ...originalSteps.filter(
        step =>
          !step.uses?.startsWith('actions/checkout@') &&
          !step.uses?.startsWith(`${policy.securityPrelude.action}@`) &&
          step.name !== policy.checkoutStep &&
          step.name !== policy.verificationStep &&
          !policy.performanceProfile.checkouts.some(
            definition =>
              step.name === definition.checkoutStep ||
              step.name === definition.verificationStep
          )
      ),
    ];
  }
  return yaml.dump(document);
}

function readSubjectCompliantAuthorityPath(filePath, contract) {
  return Buffer.from(
    contract.governedPaths.workflow.includes(filePath)
      ? makeSubjectCompliantWorkflow(filePath, contract)
      : fs.readFileSync(path.join(PROJECT_ROOT, filePath))
  );
}

describe('hosted CI verdict authority', () => {
  test('validates the tracked-envelope contract against exact workflow YAML topology and subject semantics', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

    expect(validateHostedContract(contract)).toBe(contract);
    expect(
      verifyWorkflowTopology(contract, filePath =>
        readSubjectCompliantAuthorityPath(filePath, contract)
      )
    ).toEqual({ workflows: 5, jobs: 39 });
  });

  test('repository workflows implement the exact execution-subject contract', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

    expect(
      verifyWorkflowTopology(contract, filePath =>
        fs.readFileSync(path.join(PROJECT_ROOT, ...filePath.split('/')))
      )
    ).toEqual({ workflows: 5, jobs: 39 });
  });

  test('requires versioned execution-subject authority in the hosted contract', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

    expect(contract.schemaVersion).toBe(5);
    expect(contract.envelopeSchemaVersion).toBe(2);
    expect(contract.executionSubject).toMatchObject({
      schemaVersion: 4,
      defaultProfile: 'single-subject',
      checkoutRepository:
        "${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name || github.repository }}",
      checkoutRef:
        "${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}",
      checkoutPath: '.',
      persistCredentials: false,
      eventSubjects: {
        pull_request: {
          repository: '${{ github.event.pull_request.head.repo.full_name }}',
          ref: '${{ github.event.pull_request.head.sha }}',
        },
        push: { repository: '${{ github.repository }}', ref: '${{ github.sha }}' },
        schedule: { repository: '${{ github.repository }}', ref: '${{ github.sha }}' },
        workflow_dispatch: { repository: '${{ github.repository }}', ref: '${{ github.sha }}' },
      },
      evidenceAuthority: {
        checkNames: 'claim-only',
        prWorkflowDefinitions: 'claim-only',
        mergeEvidence: 'owner-run-collector',
        collectorActivationGate: 'plan-11aj-owner-authorization',
      },
    });
    expect(contract.executionSubject.performanceProfile).toMatchObject({
      authorityEvent: 'pull_request',
      authorityScope: 'same-repository-head',
      forkOutcome: 'no-authority',
      nonPullRequestOutcome: 'no-authority',
      bootstrapActivationGate: 'fable-accepted-final-11ah',
      jobNames: ['Perf Budget (linux)', 'Perf Budget (macos)', 'Perf Budget (windows)'],
    });
    expect(
      contract.executionSubject.performanceProfile.checkouts.map(checkout => checkout.ref)
    ).toEqual([
      BOOTSTRAP_SHA,
      HARNESS_SHA,
      '${{ github.event.pull_request.base.sha }}',
      '${{ github.event.pull_request.head.sha }}',
    ]);
    expect(() => validateHostedContract({ ...contract, schemaVersion: 4 })).toThrow(
      'schema version 5'
    );
    expect(() =>
      validateHostedContract({
        ...contract,
        executionSubject: {
          ...contract.executionSubject,
          checkoutRef: '${{ github.event.pull_request.head.sha }}',
        },
      })
    ).toThrow('execution-subject authority');
    const wrongPerformanceProfile = structuredClone(contract);
    wrongPerformanceProfile.executionSubject.jobProfiles['.github/workflows/ci.yml'][
      'perf-budget'
    ] = 'single-subject';
    expect(() => validateHostedContract(wrongPerformanceProfile)).toThrow(
      'execution-subject authority'
    );
  });

  test('declares one closed security prelude and one checkout-input exception', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

    expect(contract.schemaVersion).toBe(5);
    expect(contract.executionSubject.securityPrelude).toEqual({
      action: 'step-security/harden-runner',
      allowedInputs: { 'egress-policy': ['audit', 'block'], token: [''] },
    });
    expect(contract.executionSubject.checkoutInputs).toEqual({
      '.github/workflows/ci.yml': {
        'secret-scan': { 'fetch-depth': 0 },
      },
    });
  });

  test('declares closed Tier A runner and Tier B runtime receipt fields', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

    expect(contract.runtimeReceipts).toEqual({
      schemaVersion: 2,
      tierAAuthority: 'github-jobs-api',
      tierBSemantics: 'bounded-runner-self-observation-claims',
      runnerImageSemantics: 'observed-os-fingerprint',
      hostedImageSemantics: 'nullable-hosted-image-name-version',
      tierAFields: [
        'schemaVersion',
        'jobId',
        'runId',
        'attempt',
        'job',
        'runnerId',
        'runnerName',
        'runnerGroupId',
        'runnerGroupName',
        'runnerLabels',
      ],
      tierBFields: [
        'schemaVersion',
        'subject',
        'event',
        'runId',
        'attempt',
        'os',
        'osVersion',
        'architecture',
        'runnerImage',
        'hostedImageName',
        'hostedImageVersion',
        'nodeVersion',
        'bunVersion',
        'tools',
        'containers',
      ],
    });
  });

  test('accepts complete run-attempt-bound Tier A and Tier B receipts', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const tierA = {
      schemaVersion: 2,
      jobId: 1001,
      runId: 100,
      attempt: 2,
      job: 'Cousin Install (ubuntu-latest, Node 22, bun)',
      runnerId: 2001,
      runnerName: 'GitHub Actions 1001',
      runnerGroupId: 1,
      runnerGroupName: 'GitHub Actions',
      runnerLabels: ['ubuntu-latest', 'ubuntu-24.04', 'X64'],
    };
    const tierB = {
      schemaVersion: 2,
      subject: 'cousin-ubuntu-latest-node-22-bun',
      event: 'pull_request',
      runId: 100,
      attempt: 2,
      os: 'linux',
      osVersion: '24.04',
      architecture: 'x64',
      runnerImage: 'linux:24.04:fixture-version',
      hostedImageName: 'ubuntu24',
      hostedImageVersion: '20250720.1.0',
      nodeVersion: '22.18.0',
      bunVersion: '1.3.5',
      tools: { hyperfine: '1.20.0' },
      containers: {
        'verdaccio/verdaccio':
          'sha256:bcd0dc5f10d0b9cca5a21b1f4fb3b08c6d90978bc87b8b46402abb271e0d573a',
      },
    };

    expect(validateTierARunnerReceipt(tierA, contract)).toBe(tierA);
    expect(validateTierBRuntimeReceipt(tierB, contract)).toBe(tierB);
  });

  test('rejects incomplete or unsafe runner and runtime receipt identity', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const tierA = {
      schemaVersion: 2,
      jobId: 1001,
      runId: 100,
      attempt: 2,
      job: 'Perf Budget (linux)',
      runnerId: 2001,
      runnerName: 'GitHub Actions 1001',
      runnerGroupId: 1,
      runnerGroupName: 'GitHub Actions',
      runnerLabels: ['ubuntu-latest', 'X64'],
    };
    const tierB = {
      schemaVersion: 2,
      subject: 'ci-perf-linux',
      event: 'pull_request',
      runId: 100,
      attempt: 2,
      os: 'linux',
      osVersion: '24.04',
      architecture: 'x64',
      runnerImage: 'linux:24.04:fixture-version',
      hostedImageName: null,
      hostedImageVersion: null,
      nodeVersion: '22.18.0',
      bunVersion: '1.3.5',
      tools: { hyperfine: '1.20.0' },
      containers: {},
    };

    const tierACases = [
      candidate => delete candidate.job,
      candidate => (candidate.jobId = 0),
      candidate => (candidate.runId = Number.MAX_SAFE_INTEGER + 1),
      candidate => (candidate.attempt = 0),
      candidate => (candidate.runnerId = 0),
      candidate => (candidate.runnerName = 'unsafe\nrunner'),
      candidate => (candidate.runnerGroupId = 0),
      candidate => (candidate.runnerGroupName = ''),
      candidate => (candidate.runnerLabels = ['ubuntu-latest', 'ubuntu-latest']),
    ];
    for (const mutate of tierACases) {
      const candidate = structuredClone(tierA);
      mutate(candidate);
      expect(() => validateTierARunnerReceipt(candidate, contract)).toThrow('Tier A');
    }

    const tierBCases = [
      candidate => (candidate.subject = '../unsafe'),
      candidate => (candidate.event = 'pull_request_target'),
      candidate => (candidate.osVersion = 'unsafe\rversion'),
      candidate => (candidate.architecture = 'unknown'),
      candidate => (candidate.runnerImage = 'unknown'),
      candidate => (candidate.hostedImageName = 'ubuntu24'),
      candidate => (candidate.nodeVersion = '22'),
      candidate => (candidate.bunVersion = 'latest'),
      candidate => (candidate.tools.hyperfine = 'latest'),
      candidate => (candidate.containers.verdaccio = 'verdaccio:6'),
    ];
    for (const mutate of tierBCases) {
      const candidate = structuredClone(tierB);
      mutate(candidate);
      expect(() => validateTierBRuntimeReceipt(candidate, contract)).toThrow('Tier B');
    }
    for (const field of ['jobId', 'runnerName', 'runnerGroupName', 'runnerLabels']) {
      const candidate = structuredClone(tierB);
      candidate[field] = field === 'runnerLabels' ? ['ubuntu-latest'] : 'producer-claim';
      expect(() => validateTierBRuntimeReceipt(candidate, contract)).toThrow('Tier B');
    }
  });

  test('rejects security-prelude and per-job checkout-input drift', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const verifyMutation = mutate => {
      const documents = new Map(
        contract.workflows.map(authority => [
          authority.path,
          yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
        ])
      );
      mutate(documents.get(WORKFLOW_PATHS.CI));
      return () =>
        verifyWorkflowTopology(contract, filePath =>
          filePath === 'config/phase43-toolchain-authority.json'
            ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
            : yaml.dump(documents.get(filePath))
        );
    };

    const cases = [
      ci => (ci.jobs['secret-scan'].steps[0].uses = 'step-security/harden-runner@v2'),
      ci => ci.jobs['secret-scan'].steps.unshift({ ...ci.jobs['secret-scan'].steps[0] }),
      ci => {
        const prelude = ci.jobs['secret-scan'].steps.shift();
        ci.jobs['secret-scan'].steps.splice(1, 0, prelude);
      },
      ci => ci.jobs.lint.steps.unshift({ uses: 'actions/cache@unknown', with: {} }),
      ci => {
        const checkout = ci.jobs.lint.steps.find(step => step.name === SUBJECT_CHECKOUT_STEP);
        checkout.with['fetch-depth'] = 0;
      },
      ci => {
        const checkout = ci.jobs['secret-scan'].steps.find(
          step => step.name === SUBJECT_CHECKOUT_STEP
        );
        delete checkout.with['fetch-depth'];
      },
    ];

    for (const mutate of cases) {
      expect(verifyMutation(mutate)).toThrow('execution-subject implementation');
    }
  });

  test('rejects incomplete, reordered, or weakened paired-performance controls', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const verifyMutation = mutate => {
      const documents = new Map(
        contract.workflows.map(authority => [
          authority.path,
          yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
        ])
      );
      mutate(documents.get(WORKFLOW_PATHS.CI).jobs['perf-budget'].steps);
      return () =>
        verifyWorkflowTopology(contract, filePath =>
          filePath === 'config/phase43-toolchain-authority.json'
            ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
            : yaml.dump(documents.get(filePath))
        );
    };
    const performance = contract.executionSubject.performanceProfile;
    const cases = [
      steps => {
        const index = steps.findIndex(step => step.name === performance.checkouts[1].verificationStep);
        steps.splice(index, 1);
      },
      steps => {
        const index = steps.findIndex(step => step.name === performance.checkouts[2].verificationStep);
        steps.splice(index, 0, { run: 'echo intervening payload' });
      },
      steps => {
        const checkout = steps.find(step => step.name === performance.checkouts[3].checkoutStep);
        checkout.with['persist-credentials'] = true;
      },
      steps => {
        const checkout = steps.find(step => step.name === performance.checkouts[0].checkoutStep);
        delete checkout.with.path;
      },
      steps => {
        const checkout = steps.find(step => step.name === performance.checkouts[1].checkoutStep);
        checkout.with.ref = '${{ github.event.pull_request.head.sha }}';
      },
    ];

    for (const mutate of cases) {
      expect(verifyMutation(mutate)).toThrow('execution-subject implementation');
    }
  });

  test('requires the exact same-repository authority condition on paired jobs', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const verifyCondition = condition => {
      const documents = new Map(
        contract.workflows.map(authority => [
          authority.path,
          yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
        ])
      );
      const job = documents.get(WORKFLOW_PATHS.CI).jobs['perf-budget'];
      if (condition === null) delete job.if;
      else job.if = condition;
      return () =>
        verifyWorkflowTopology(contract, filePath =>
          filePath === 'config/phase43-toolchain-authority.json'
            ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
            : yaml.dump(documents.get(filePath))
        );
    };

    expect(verifyCondition(contract.executionSubject.performanceProfile.authorityCondition)()).toEqual({
      workflows: 5,
      jobs: 39,
    });
    for (const condition of [
      null,
      "${{ github.event_name == 'pull_request' }}",
      "${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name != github.repository }}",
    ]) {
      expect(verifyCondition(condition)).toThrow('execution-subject implementation');
    }
  });

  test('validates scalar matrix values and rejects closed contract boundary drift', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const scalarMatrix = structuredClone(contract);
    const matrix = scalarMatrix.workflows.find(
      workflow => workflow.name === 'Cousin Install'
    ).requiredJobMatrices[0];
    matrix.dimensions[1] = [20, 22];
    matrix.dimensions[2] = [true, false, 'bun'];
    expect(validateHostedContract(scalarMatrix)).toBe(scalarMatrix);

    const cases = [
      candidate => {
        candidate.workflows[0] = null;
      },
      candidate => {
        candidate.workflows[1].name = candidate.workflows[0].name;
      },
      candidate => {
        candidate.workflows[0].requiredJobs = 'Lint';
      },
      candidate => {
        candidate.workflows[0].requiredJobs = ['Lint', 'Lint'];
      },
      candidate => {
        candidate.workflows.find(
          workflow => workflow.name === 'Cousin Install'
        ).requiredJobMatrices[0].dimensions = null;
      },
      candidate => {
        candidate.workflows.find(
          workflow => workflow.name === 'Cousin Install'
        ).requiredJobMatrices[0].template = null;
      },
      candidate => {
        candidate.governedPaths.workflow.pop();
      },
    ];
    for (const mutate of cases) {
      const malformed = structuredClone(contract);
      mutate(malformed);
      expect(() => validateHostedContract(malformed)).toThrow();
    }
  });

  test('rejects named no-op subject steps and checkout-ref drift', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const documents = new Map(
      contract.workflows.map(authority => [
        authority.path,
        yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
      ])
    );
    const ci = documents.get('.github/workflows/ci.yml');
    const firstJob = Object.values(ci.jobs)[0];
    firstJob.steps[1].run = 'echo success';

    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
          : yaml.dump(documents.get(filePath))
      )
    ).toThrow('execution-subject implementation');

    firstJob.steps[1].run = contract.executionSubject.verificationRun;
    firstJob.steps[0].with.ref = '${{ github.sha }}';
    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
          : yaml.dump(documents.get(filePath))
      )
    ).toThrow('execution-subject implementation');

    firstJob.steps[0].with.ref = contract.executionSubject.checkoutRef;
    firstJob.steps[1]['continue-on-error'] = '${{ true }}';
    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
          : yaml.dump(documents.get(filePath))
      )
    ).toThrow('execution-subject implementation');

    firstJob.steps[1]['continue-on-error'] = 'false';
    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
          : yaml.dump(documents.get(filePath))
      )
    ).toThrow('execution-subject implementation');
  });

  test('rejects any second checkout after execution-subject verification', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const documents = new Map(
      contract.workflows.map(authority => [
        authority.path,
        yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
      ])
    );
    const ci = documents.get('.github/workflows/ci.yml');
    Object.values(ci.jobs)[0].steps.push({
      uses: 'actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10',
    });

    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
          : yaml.dump(documents.get(filePath))
      )
    ).toThrow('execution-subject implementation');
  });

  test('rejects side-workspace and inherited execution-subject overrides', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const cases = [
      ({ checkout }) => (checkout.with.clean = false),
      ({ checkout, verification }) => {
        checkout.with.path = 'attested';
        verification['working-directory'] = 'attested';
      },
      ({ verification }) => (verification.env.PATH = 'attacker-bin'),
      ({ workflow }) => (workflow.env = { PATH: 'attacker-bin' }),
      ({ job }) => (job.env = { GIT_DIR: 'attacker-repository' }),
      ({ workflow }) => (workflow.env = { BASH_ENV: 'attacker-bootstrap' }),
      ({ job }) => (job.env = { NODE_OPTIONS: '--require=./attacker.js' }),
      ({ job }) => (job.steps.at(-1).env = { LD_PRELOAD: './attacker.so' }),
      ({ workflow }) => (workflow.defaults = { run: { 'working-directory': 'attested' } }),
      ({ job }) => (job.defaults = { run: { 'working-directory': 'attested' } }),
      ({ job }) => job.steps.unshift({ run: 'echo attacker-bin >> "$GITHUB_PATH"' }),
    ];

    for (const mutate of cases) {
      const documents = new Map(
        contract.workflows.map(authority => [
          authority.path,
          yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
        ])
      );
      const workflow = documents.get('.github/workflows/ci.yml');
      const job = Object.values(workflow.jobs)[0];
      mutate({ workflow, job, checkout: job.steps[0], verification: job.steps[1] });

      expect(() =>
        verifyWorkflowTopology(contract, filePath =>
          filePath === 'config/phase43-toolchain-authority.json'
            ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
            : yaml.dump(documents.get(filePath))
        )
      ).toThrow('execution-subject implementation');
    }
  });

  test('rejects oversized contract and workflow matrices before Cartesian expansion', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const oversizedContract = structuredClone(contract);
    const cousin = oversizedContract.workflows.find(workflow => workflow.name === 'Cousin Install');
    cousin.requiredJobMatrices[0].dimensions = [
      Array.from({ length: 101 }, (_, index) => `os-${index}`),
      Array.from({ length: 101 }, (_, index) => `node-${index}`),
      ['npm'],
    ];
    cousin.requiredJobMatrices[0].expectedCount = 10201;
    expect(() => validateHostedContract(oversizedContract)).toThrow('matrix authority');

    const tooManyMatrices = structuredClone(contract);
    const matrixTemplate = tooManyMatrices.workflows.find(
      workflow => workflow.name === 'Cousin Install'
    ).requiredJobMatrices[0];
    tooManyMatrices.workflows.find(
      workflow => workflow.name === 'Cousin Install'
    ).requiredJobMatrices = Array.from({ length: 101 }, () => structuredClone(matrixTemplate));
    expect(() => validateHostedContract(tooManyMatrices)).toThrow('matrix authority');

    const documents = new Map(
      contract.workflows.map(authority => [
        authority.path,
        yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
      ])
    );
    documents.get('.github/workflows/cousin-install.yml').jobs['cousin-install'].strategy.matrix = {
      os: Array.from({ length: 101 }, (_, index) => `os-${index}`),
      node: Array.from({ length: 101 }, (_, index) => index),
    };
    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
          : yaml.dump(documents.get(filePath))
      )
    ).toThrow('workflow matrix');
  });

  test('rejects aggregate workflow matrix rows before Cartesian expansion', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const documents = new Map(
      contract.workflows.map(authority => [
        authority.path,
        yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
      ])
    );
    const ci = documents.get('.github/workflows/ci.yml');
    ci.jobs = Object.fromEntries(
      ['first', 'second'].map(jobId => [
        jobId,
        {
          name: `${jobId} \${{ matrix.row }}`,
          strategy: { matrix: { row: Array.from({ length: 100 }, (_, index) => index) } },
          steps: [],
        },
      ])
    );

    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
          : yaml.dump(documents.get(filePath))
      )
    ).toThrow('supported bounds');
  });

  test('rejects unsupported workflow matrix axes instead of discarding them', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const documents = new Map(
      contract.workflows.map(authority => [
        authority.path,
        yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
      ])
    );
    const cousin = documents.get('.github/workflows/cousin-install.yml');
    cousin.jobs['cousin-install'].strategy.matrix.dynamic = '${{ fromJSON(inputs.rows) }}';

    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? fs.readFileSync(TOOLCHAIN_MANIFEST_PATH)
          : yaml.dump(documents.get(filePath))
      )
    ).toThrow('workflow matrix');
  });

  test('fails closed on duplicate, missing, and malformed workflow matrix topology', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const matrixAuthority = contract.workflows.find(
      workflow => workflow.name === 'Cousin Install'
    ).requiredJobMatrices[0];
    expect(() => expandJobMatrices(null)).toThrow('matrix authority');
    expect(() => expandJobMatrices([null])).toThrow('matrix authority');
    expect(() => expandJobMatrices([matrixAuthority], 0)).toThrow('supported bounds');

    const verifyMutation = (mutate, manifestMutation) => {
      const documents = new Map(
        contract.workflows.map(authority => [
          authority.path,
          yaml.load(makeSubjectCompliantWorkflow(authority.path, contract)),
        ])
      );
      mutate(documents);
      const manifest = JSON.parse(fs.readFileSync(TOOLCHAIN_MANIFEST_PATH, 'utf8'));
      if (manifestMutation) manifestMutation(manifest);
      return () =>
        verifyWorkflowTopology(contract, filePath =>
          filePath === 'config/phase43-toolchain-authority.json'
            ? JSON.stringify(manifest)
            : yaml.dump(documents.get(filePath))
        );
    };

    for (const mutation of [
      documents => {
        documents.get(WORKFLOW_PATHS['Cousin Install']).jobs['cousin-install'].strategy.matrix = [];
      },
      documents => {
        documents.get(WORKFLOW_PATHS['Cousin Install']).jobs['cousin-install'].strategy.matrix = {
          include: [{ os: 'linux' }, { os: 'linux' }],
        };
      },
      documents => {
        documents.get(WORKFLOW_PATHS['Cousin Install']).jobs['cousin-install'].strategy.matrix = {
          os: ['linux', 'linux'],
        };
      },
      documents => {
        const job = documents.get(WORKFLOW_PATHS['Cousin Install']).jobs['cousin-install'];
        job.name = 'Cousin Install ${{ matrix.missing }}';
        job.strategy.matrix = { os: ['linux'] };
      },
      documents => {
        documents.get(WORKFLOW_PATHS.CI).jobs = null;
      },
      documents => {
        Object.values(documents.get(WORKFLOW_PATHS.CI).jobs)[0].name = 'Unexpected job name';
      },
    ]) {
      expect(verifyMutation(mutation)).toThrow();
    }
    expect(
      verifyMutation(
        () => {},
        manifest => delete manifest.githubActions.pins['actions/checkout']
      )
    ).toThrow('checkout action is not governed');
  });

  test('applies toolchain manifest byte authority during hosted topology verification', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const manifest = fs.readFileSync(TOOLCHAIN_MANIFEST_PATH);
    const oversizedManifest = Buffer.concat([
      manifest,
      Buffer.alloc(300000 - manifest.length, 0x20),
    ]);

    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? oversizedManifest
          : makeSubjectCompliantWorkflow(filePath, contract)
      )
    ).toThrow('size limit');
  });

  test('applies governed workflow byte authority during hosted topology verification', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

    expect(() =>
      verifyWorkflowTopology(contract, filePath => {
        if (filePath === 'config/phase43-toolchain-authority.json') {
          return fs.readFileSync(TOOLCHAIN_MANIFEST_PATH);
        }
        if (filePath === contract.workflows[0].path) return Buffer.alloc(256 * 1024 + 1, 0x20);
        return makeSubjectCompliantWorkflow(filePath, contract);
      })
    ).toThrow('size limit');
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
      'schema version 5'
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

  test('requires hosted and toolchain authority to govern the same workflow set', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(TOOLCHAIN_MANIFEST_PATH, 'utf8'));
    manifest.governedWorkflows = manifest.governedWorkflows.map(workflow =>
      workflow === '.github/workflows/oversight-probes.yml'
        ? '.github/workflows/unreviewed.yml'
        : workflow
    );
    manifest.runtimeRequirements['.github/workflows/unreviewed.yml'] =
      manifest.runtimeRequirements['.github/workflows/oversight-probes.yml'];
    delete manifest.runtimeRequirements['.github/workflows/oversight-probes.yml'];

    expect(() =>
      verifyWorkflowTopology(contract, filePath =>
        filePath === 'config/phase43-toolchain-authority.json'
          ? JSON.stringify(manifest)
          : readSubjectCompliantAuthorityPath(filePath, contract)
      )
    ).toThrow('workflow set');
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
    expect(
      computeGovernedDigests(contract, filePath => `text:${filePath}\n`).source[0].sha256
    ).toBe(digest(Buffer.from(`text:${contract.governedPaths.source[0]}\n`)));
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
      schemaVersion: 2,
      contractSchemaVersion: 5,
      repository: contract.repository,
      pullRequest: 23,
      checkedCommit: EXPECTED_HEAD,
      purpose: 'Plan 11R initial hosted authority',
      receiptPath,
      verdict: 'passed',
      hostedEvidenceExists: true,
      governedDigests,
    });
    const subjectEvidence = envelope.workflows.flatMap(workflow => workflow.executionSubjects);
    expect(subjectEvidence).toHaveLength(39);
    expect(subjectEvidence).toContainEqual(
      expect.objectContaining({
        job: 'Lint',
        runId: envelope.workflows[0].runId,
        attempt: envelope.workflows[0].attempt,
        expectedSubject: EXPECTED_HEAD,
        status: 'completed',
        conclusion: 'success',
      })
    );
    const tampered = structuredClone(envelope);
    tampered.workflows[0].executionSubjects[0].status = 'in_progress';
    expect(() => validateHostedEnvelope(tampered, contract)).toThrow(
      'execution-subject evidence'
    );
    const wrongRun = structuredClone(envelope);
    wrongRun.workflows[0].executionSubjects[0].runId += 1;
    expect(() => validateHostedEnvelope(wrongRun, contract)).toThrow('execution-subject evidence');
    const wrongAttempt = structuredClone(envelope);
    wrongAttempt.workflows[0].executionSubjects[0].attempt += 1;
    expect(() => validateHostedEnvelope(wrongAttempt, contract)).toThrow(
      'execution-subject evidence'
    );
    const wrongSubject = structuredClone(envelope);
    wrongSubject.workflows[0].executionSubjects[0].expectedSubject = 'a'.repeat(40);
    expect(() => validateHostedEnvelope(wrongSubject, contract)).toThrow(
      'execution-subject evidence'
    );
    const smuggledWorkflowField = structuredClone(envelope);
    smuggledWorkflowField.workflows[0].actualCheckedCommit = EXPECTED_HEAD;
    expect(() => validateHostedEnvelope(smuggledWorkflowField, contract)).toThrow(
      'workflow evidence'
    );
    const poisonedSubjectEnvelope = structuredClone(envelope);
    const originalSubject = poisonedSubjectEnvelope.workflows[0].executionSubjects[0];
    const poisonedSubject = Object.assign(Object.create({ job: originalSubject.job }), originalSubject, {
      unknownEvidence: EXPECTED_HEAD,
    });
    delete poisonedSubject.job;
    poisonedSubjectEnvelope.workflows[0].executionSubjects[0] = poisonedSubject;
    expect(() => validateHostedEnvelope(poisonedSubjectEnvelope, contract)).toThrow(
      'execution-subject evidence'
    );
    const wrongWorkflowUrl = structuredClone(envelope);
    wrongWorkflowUrl.workflows[0].url = 'https://attacker.invalid/run/100';
    expect(() => validateHostedEnvelope(wrongWorkflowUrl, contract)).toThrow('workflow evidence');
    const poisonedDigestEnvelope = structuredClone(envelope);
    const originalDigest = poisonedDigestEnvelope.governedDigests.source[0];
    const poisonedDigest = Object.assign(Object.create({ path: originalDigest.path }), {
      sha256: originalDigest.sha256,
      unknownDigestField: true,
    });
    poisonedDigestEnvelope.governedDigests.source[0] = poisonedDigest;
    expect(() => validateHostedEnvelope(poisonedDigestEnvelope, contract)).toThrow(
      'digests do not match'
    );
    for (const mutate of [
      candidate => (candidate.checkedCommit = null),
      candidate => delete candidate.governedDigests.policy,
      candidate => (candidate.governedDigests.source[0].sha256 = null),
      candidate => (candidate.workflows = null),
      candidate => (candidate.workflows[0].executionSubjects = null),
    ]) {
      const malformed = structuredClone(envelope);
      mutate(malformed);
      expect(() => validateHostedEnvelope(malformed, contract)).toThrow();
    }
    expect(envelope).not.toHaveProperty('headSha');

    for (const mutate of [
      candidate => (candidate.purpose = 'x'.repeat(501)),
      candidate => (candidate.observedAt = 'not-a-timestamp'),
      candidate => (candidate.pullRequest = Number.MAX_SAFE_INTEGER + 1),
      candidate => (candidate.workflows[0].runId = Number.MAX_SAFE_INTEGER + 1),
      candidate =>
        (candidate.workflows[0].executionSubjects[0].jobId = Number.MAX_SAFE_INTEGER + 1),
    ]) {
      const malformed = structuredClone(envelope);
      mutate(malformed);
      expect(() => validateHostedEnvelope(malformed, contract)).toThrow();
    }

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

  test('applies safe defaults to absent hosted collections and deduplicates unexpected runs', () => {
    const emptyContract = makeContract();
    emptyContract.workflows = [];
    delete emptyContract.acceptedConclusions;
    const empty = evaluateHostedVerdict({}, emptyContract);
    expect(empty.verdict).toBe('passed');
    expect(empty.hostedEvidenceExists).toBe(false);

    const contract = makeContract();
    const input = makeSuccessfulInput(contract);
    const unexpected = makeRun(999, 'Unexpected', { path: '' });
    input.runs.push(unexpected, { ...unexpected, id: 1000 });
    delete input.annotationsByJob;
    delete input.prHeadAtStart;
    delete input.jobsByRun[input.runs[0].id];
    input.jobsByRun[input.runs[1].id][0].steps = null;
    delete contract.executionSubject;
    const result = evaluateHostedVerdict(input, contract);
    expect(result.diagnostics.filter(item => item.code === 'unexpected_workflow')).toHaveLength(1);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'missing_job', workflow: contract.workflows[0].name })
    );
  });

  test('rejects PR-head metadata when a required job lacks execution-subject evidence', () => {
    const contract = makeContract();
    const input = makeSuccessfulInput(contract);
    const job = input.jobsByRun[input.runs[0].id][0];
    job.steps = [makeStep(1, SUBJECT_CHECKOUT_STEP)];

    const receipt = evaluateHostedVerdict(input, contract);

    expect(receipt.verdict).toBe('failed');
    expect(receipt.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'execution_subject_step_missing',
        workflow: 'CI',
        job: 'Lint',
      })
    );
  });

  test('requires the execution-subject step to complete successfully', () => {
    const contract = makeContract();

    for (const state of [
      { status: 'completed', conclusion: 'failure' },
      { status: 'completed', conclusion: 'skipped' },
      { status: 'in_progress', conclusion: null },
    ]) {
      const input = makeSuccessfulInput(contract);
      const subjectStep = input.jobsByRun[input.runs[0].id][0].steps[1];
      Object.assign(subjectStep, state);

      const codes = evaluateHostedVerdict(input, contract).diagnostics.map(item => item.code);

      expect(codes).toContain('execution_subject_step_not_successful');
    }
  });

  test('requires the governed checkout step to complete successfully', () => {
    const contract = makeContract();

    for (const state of [
      { status: 'completed', conclusion: 'failure' },
      { status: 'completed', conclusion: 'skipped' },
      { status: 'in_progress', conclusion: null },
    ]) {
      const input = makeSuccessfulInput(contract);
      Object.assign(input.jobsByRun[input.runs[0].id][0].steps[0], state);

      expect(evaluateHostedVerdict(input, contract).diagnostics.map(item => item.code)).toContain(
        'execution_subject_checkout_not_successful'
      );
    }
  });

  test('requires every paired-performance checkout and verification to succeed in order', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const performance = contract.executionSubject.performanceProfile;
    const makeMutation = mutate => {
      const input = makeSuccessfulInput(contract);
      const performanceJob = input.jobsByRun[input.runs[0].id].find(
        job => job.name === performance.jobNames[0]
      );
      mutate(performanceJob.steps);
      return evaluateHostedVerdict(input, contract);
    };

    expect(evaluateHostedVerdict(makeSuccessfulInput(contract), contract).verdict).toBe('passed');
    expect(
      makeMutation(steps => {
        const index = steps.findIndex(
          step => step.name === performance.checkouts[1].verificationStep
        );
        steps.splice(index, 1);
      }).diagnostics
    ).toContainEqual(
      expect.objectContaining({ code: 'execution_subject_step_missing', job: performance.jobNames[0] })
    );
    expect(
      makeMutation(steps => {
        steps.find(step => step.name === performance.checkouts[2].checkoutStep).conclusion =
          'failure';
      }).diagnostics
    ).toContainEqual(
      expect.objectContaining({
        code: 'execution_subject_checkout_not_successful',
        job: performance.jobNames[0],
      })
    );
    expect(
      makeMutation(steps => {
        steps.find(step => step.name === performance.checkouts[3].verificationStep).number += 1;
      }).diagnostics
    ).toContainEqual(
      expect.objectContaining({
        code: 'execution_subject_step_order_invalid',
        job: performance.jobNames[0],
      })
    );
  });

  test('requires subject verification immediately after the governed checkout step', () => {
    const contract = makeContract();
    const input = makeSuccessfulInput(contract);
    input.jobsByRun[input.runs[0].id][0].steps = [
      makeStep(1, SUBJECT_VERIFY_STEP),
      makeStep(2, SUBJECT_CHECKOUT_STEP),
    ];

    const receipt = evaluateHostedVerdict(input, contract);

    expect(receipt.verdict).toBe('failed');
    expect(receipt.diagnostics.map(item => item.code)).toContain(
      'execution_subject_step_order_invalid'
    );
  });

  test('checks execution-subject evidence on every expanded matrix job', () => {
    const contract = makeContract();
    const input = makeSuccessfulInput(contract);
    const cousinRun = input.runs.find(run => run.name === 'Cousin Install');
    const matrixJob = input.jobsByRun[cousinRun.id].find(
      job => job.name === 'Cousin Install (windows-latest, Node 22, bun)'
    );
    matrixJob.steps = [makeStep(1, SUBJECT_CHECKOUT_STEP)];

    expect(evaluateHostedVerdict(input, contract).diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'execution_subject_step_missing',
        workflow: 'Cousin Install',
        job: matrixJob.name,
      })
    );
  });

  test('rejects ambiguous duplicate execution-subject evidence', () => {
    const contract = makeContract();
    const input = makeSuccessfulInput(contract);
    const job = input.jobsByRun[input.runs[0].id][0];
    job.steps.push(makeStep(3, SUBJECT_VERIFY_STEP));

    expect(evaluateHostedVerdict(input, contract).diagnostics.map(item => item.code)).toContain(
      'execution_subject_step_ambiguous'
    );
  });

  test('rejects execution-subject evidence assigned to a different workflow run', () => {
    const contract = makeContract();
    const input = makeSuccessfulInput(contract);
    input.jobsByRun[input.runs[0].id][0].run_id += 1;

    expect(evaluateHostedVerdict(input, contract).diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'execution_subject_run_mismatch',
        workflow: 'CI',
        job: 'Lint',
      })
    );

    const wrongUrl = makeSuccessfulInput(contract);
    wrongUrl.jobsByRun[wrongUrl.runs[0].id][0].html_url =
      'https://github.com/chudeemeke/get-stuff-done/actions/runs/999/job/1';
    expect(evaluateHostedVerdict(wrongUrl, contract).diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'execution_subject_job_url_invalid',
        workflow: 'CI',
      })
    );
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

  test('rejects a same-name run from a different workflow path', () => {
    const input = makeSuccessfulInput();
    input.runs.push(
      makeRun(999, 'CI', {
        path: '.github/workflows/spoof.yml',
        created_at: '2026-07-14T04:00:00Z',
        updated_at: '2026-07-14T04:00:00Z',
      })
    );

    const receipt = evaluateHostedVerdict(input, makeContract());

    expect(receipt.verdict).toBe('failed');
    expect(receipt.diagnostics).toContainEqual({
      code: 'unexpected_workflow_identity',
      workflow: 'CI',
      path: '.github/workflows/spoof.yml',
    });
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
    expect(
      receipt.workflows
        .find(workflow => workflow.name === 'CI')
        .executionSubjects.every(subject => subject.attempt === 2)
    ).toBe(true);
  });

  test('rejects missing or unsafe run-attempt authority', () => {
    for (const runAttempt of [undefined, 0, Number.MAX_SAFE_INTEGER + 1]) {
      const input = makeSuccessfulInput();
      input.runs[0].run_attempt = runAttempt;
      expect(
        evaluateHostedVerdict(input, makeContract()).diagnostics.map(item => item.code)
      ).toContain('run_attempt_invalid');
    }
  });

  test('uses update time and run ID to break equal-attempt ties deterministically', () => {
    const early = makeRun(1, 'CI', { updated_at: '2026-07-14T02:00:00Z' });
    const laterLowId = makeRun(2, 'CI', { updated_at: '2026-07-14T03:00:00Z' });
    const laterHighId = makeRun(3, 'CI', { updated_at: '2026-07-14T03:00:00Z' });

    expect(selectLatestRuns([early, laterLowId, laterHighId]).get('CI').id).toBe(3);
  });

  test('does not let an older rerun eclipse a newer workflow run', () => {
    const olderRerun = makeRun(10, 'CI', {
      run_attempt: 9,
      created_at: '2026-07-14T01:00:00Z',
      updated_at: '2026-07-14T05:00:00Z',
    });
    const newerRun = makeRun(20, 'CI', {
      run_attempt: 1,
      created_at: '2026-07-14T04:00:00Z',
      updated_at: '2026-07-14T04:30:00Z',
    });

    expect(selectLatestRuns([olderRerun, newerRun]).get('CI').id).toBe(newerRun.id);
  });

  test('orders equal and partially populated runs deterministically', () => {
    const sameId = [
      makeRun(7, 'CI', { created_at: null, updated_at: '2026-07-14T02:00:00Z', run_attempt: 1 }),
      makeRun(7, 'CI', { created_at: null, updated_at: '2026-07-14T02:00:01Z', run_attempt: 2 }),
    ];
    expect(selectLatestRuns(sameId).get('CI').run_attempt).toBe(2);

    const sameAttempt = [
      makeRun(8, 'CI', { created_at: null, updated_at: '2026-07-14T02:00:00Z' }),
      makeRun(8, 'CI', { created_at: null, updated_at: '2026-07-14T02:00:01Z' }),
    ];
    expect(selectLatestRuns(sameAttempt).get('CI').updated_at).toBe('2026-07-14T02:00:01Z');
    expect(selectLatestRuns([{ name: 'CI' }, { name: 'CI' }]).get('CI')).toEqual({ name: 'CI' });
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

  test('handles missing billing annotations, jobs, and execution-subject steps', () => {
    const missingMessage = makeBillingLockedInput();
    missingMessage.annotationsByJob[missingMessage.jobsByRun[missingMessage.runs[0].id][0].id] = [
      {},
    ];
    expect(evaluateHostedVerdict(missingMessage, makeContract()).verdict).toBe('failed');

    const missingJobs = makeBillingLockedInput();
    delete missingJobs.jobsByRun[missingJobs.runs[0].id];
    expect(evaluateHostedVerdict(missingJobs, makeContract()).verdict).toBe('failed');

    const missingSteps = makeSuccessfulInput();
    missingSteps.jobsByRun[missingSteps.runs[0].id][0].steps = null;
    expect(evaluateHostedVerdict(missingSteps, makeContract()).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'execution_subject_step_missing' })
    );
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
    expect(
      runJsonCommand(process.execPath, [
        '-e',
        'process.stdout.write(JSON.stringify({ portable: true }))',
      ])
    ).toEqual({ portable: true });
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
    expect(runTextCommand(process.execPath, ['-e', 'process.stdout.write("portable")'])).toBe(
      'portable'
    );
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
          if (endpoint.includes('/actions/runs/100/attempts/1/jobs')) {
            return { total_count: 1, jobs: [job] };
          }
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
    expect(calls).toContainEqual([
      'gh',
      'api',
      'repos/chudeemeke/get-stuff-done/actions/runs/100/attempts/1/jobs?per_page=100',
    ]);
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

  test('uses default command adapters and rejects unsafe collected run identity', () => {
    const spawn = (_command, args) => {
      if (args[0] === 'rev-parse') return { status: 0, stdout: `${EXPECTED_HEAD}\n`, stderr: '' };
      if (args[1].includes('/pulls/')) {
        return {
          status: 0,
          stdout: JSON.stringify({ head: { sha: EXPECTED_HEAD } }),
          stderr: '',
        };
      }
      return { status: 0, stdout: '{}', stderr: '' };
    };
    const collected = collectHostedData(
      { repository: 'chudeemeke/get-stuff-done', pullRequest: 23 },
      { spawnSync: spawn }
    );
    expect(collected.runs).toEqual([]);
    expect(collected.localHeadAtEnd).toBe(EXPECTED_HEAD);

    expect(() =>
      collectHostedData(
        { repository: 'chudeemeke/get-stuff-done', pullRequest: 23 },
        {
          runTextCommand: () => EXPECTED_HEAD,
          runJsonCommand(_command, args) {
            if (args[1].includes('/pulls/')) return { head: { sha: EXPECTED_HEAD } };
            return { workflow_runs: [makeRun(0, 'CI')], total_count: 1 };
          },
        }
      )
    ).toThrow('run ID and attempt');

    const run = makeRun(1, 'CI');
    const noJobs = collectHostedData(
      {
        repository: 'chudeemeke/get-stuff-done',
        pullRequest: 23,
        workflows: [{ name: 'CI', path: WORKFLOW_PATHS.CI }],
      },
      {
        runTextCommand: () => EXPECTED_HEAD,
        runJsonCommand(_command, args) {
          if (args[1].includes('/pulls/')) return { head: { sha: EXPECTED_HEAD } };
          if (args[1].includes('/actions/runs?')) return { workflow_runs: [run] };
          return {};
        },
      }
    );
    expect(noJobs.jobsByRun[run.id]).toEqual([]);
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
    expect(parseArgs(['-h'])).toEqual({ help: true });
    expect(() => parseArgs(['collect', '--pr', '23', '--receipt', receipt])).toThrow(
      '--purpose'
    );
    expect(() =>
      parseArgs([
        'collect',
        '--pr',
        String(Number.MAX_SAFE_INTEGER + 1),
        '--receipt',
        receipt,
        '--purpose',
        'bounded collection',
      ])
    ).toThrow('--pr');
    expect(() =>
      parseArgs([
        'collect',
        '--pr',
        '23',
        '--receipt',
        receipt,
        '--purpose',
        'x'.repeat(501),
      ])
    ).toThrow('--purpose');
    expect(() => parseArgs(['--pr', '23'])).toThrow('mode');
    for (const args of [
      ['verify-pending', '--pr', '23', '--unknown', 'value'],
      ['verify-pending', '--pr', '23', '--pr', '24', '--receipt', receipt],
      ['verify-pending', '--pr', '23'],
      ['verify-pending', '--pr', '23', '--receipt', receipt, '--purpose', 'not allowed'],
      ['verify-receipt', '--pr', '23', '--receipt', receipt],
    ]) {
      expect(() => parseArgs(args)).toThrow();
    }
  });

  test('receipt paths stay inside the hosted directory and never target existing bytes', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hosted-path-'));
    const canonicalRoot = fs.realpathSync.native(root);
    const hosted = path.join(canonicalRoot, '.planning', 'evidence', 'hosted');
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
      expect(() =>
        resolveReceiptPath(root, contract, '.planning/evidence/hosted/missing/deep/receipt.json', {
          mustExist: true,
        })
      ).toThrow('does not exist');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('receipt expectations use native canonical identity for a linked project root', () => {
    const container = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hosted-alias-'));
    const realRoot = path.join(container, 'real-root');
    const aliasRoot = path.join(container, 'alias-root');
    const contract = { evidenceDirectory: '.planning/evidence/hosted' };
    fs.mkdirSync(path.join(realRoot, '.planning', 'evidence', 'hosted'), {
      recursive: true,
    });

    try {
      fs.symlinkSync(
        realRoot,
        aliasRoot,
        process.platform === 'win32' ? 'junction' : 'dir'
      );
      const canonicalRoot = fs.realpathSync.native(aliasRoot);
      const expected = path.join(
        canonicalRoot,
        '.planning',
        'evidence',
        'hosted',
        'new.json'
      );
      const resolved = resolveReceiptPath(
        aliasRoot,
        contract,
        '.planning/evidence/hosted/new.json',
        { mustNotExist: true }
      );

      expect(resolved).toBe(expected);
      expect(resolved).not.toBe(
        path.join(aliasRoot, '.planning', 'evidence', 'hosted', 'new.json')
      );
    } finally {
      fs.rmSync(container, { recursive: true, force: true });
    }
  });

  test('native canonical expectations account for platform path aliases', () => {
    if (process.platform === 'darwin' && fs.existsSync('/var')) {
      expect(fs.realpathSync.native('/var')).toBe('/private/var');
    }

    if (process.platform === 'win32') {
      const shortProgramFiles = `${process.env.SystemDrive || 'C:'}\\PROGRA~1`;
      if (fs.existsSync(shortProgramFiles)) {
        expect(fs.realpathSync.native(shortProgramFiles)).toBe(
          fs.realpathSync.native(process.env.ProgramFiles)
        );
      }
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

  test('atomic receipt publication reports cleanup failures without hiding the cause', () => {
    expect(() => writeReceiptAtomic('unused.json', undefined)).toThrow('serialize');
    let unlinkCalls = 0;
    const fileSystem = {
      mkdirSync() {},
      writeFileSync() {},
      linkSync() {},
      unlinkSync() {
        unlinkCalls += 1;
        if (unlinkCalls === 1) throw new Error('primary unlink failure');
        if (unlinkCalls === 2) throw new Error('destination cleanup failure');
        throw new Error('temp cleanup failure');
      },
    };
    expect(() => writeReceiptAtomic('unused.json', { sequence: 1 }, { fileSystem })).toThrow(
      'publication and cleanup failed'
    );
  });

  test('keeps legacy collection inactive until Plan 11AJ owns the first live join', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const receiptPath = '.planning/evidence/hosted/43-11r-initial.json';
    const writes = [];
    const readTracked = (_commit, filePath) => readSubjectCompliantAuthorityPath(filePath, contract);
    const baseDependencies = {
      contract,
      projectRoot: PROJECT_ROOT,
      resolveReceiptPath: () => path.join(PROJECT_ROOT, ...receiptPath.split('/')),
      readTracked,
      readCurrent: filePath => readSubjectCompliantAuthorityPath(filePath, contract),
      writeReceiptAtomic: (filePath, value) => writes.push({ filePath, value }),
    };
    const options = {
      mode: 'collect',
      pullRequest: 23,
      receiptPath,
      purpose: 'Plan 11R initial hosted authority',
      subjectCommit: null,
    };

    expect(() =>
      collectHostedEnvelope(options, {
        ...baseDependencies,
        collectHostedData: () => makeSuccessfulInput(contract),
      })
    ).toThrow('Plan 11AJ');
    expect(writes).toEqual([]);

    const errors = [];
    expect(
      main(
        [
          'collect',
          '--pr',
          '23',
          '--receipt',
          receiptPath,
          '--purpose',
          'default handler routing',
        ],
        {
          createDefaultDependencies: () => ({
            contract,
            projectRoot: PROJECT_ROOT,
            resolveReceiptPath: () => path.join(PROJECT_ROOT, ...receiptPath.split('/')),
            collectHostedData: () => makeBillingLockedInput(),
          }),
          stderr: { write: value => errors.push(value) },
          stdout: { write() {} },
        }
      )
    ).toBe(1);
    expect(errors.join('')).toContain('Plan 11AJ');
  });

  test('pending verification is offline, untracked, and bound to current HEAD', () => {
    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    const receiptPath = '.planning/evidence/hosted/43-11r-initial.json';
    const governedDigests = computeGovernedDigests(contract, filePath =>
      readSubjectCompliantAuthorityPath(filePath, contract)
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
      readTracked: (_commit, filePath) => readSubjectCompliantAuthorityPath(filePath, contract),
      readCurrent: filePath => readSubjectCompliantAuthorityPath(filePath, contract),
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
            : readSubjectCompliantAuthorityPath(filePath, contract),
      })
    ).toThrow('governed digests');
    expect(() =>
      verifyPendingEnvelope(options, {
        ...dependencies,
        readFile: () => Buffer.alloc(MAX_HOSTED_RECEIPT_BYTES + 1, 0x20),
      })
    ).toThrow('size limit');
    expect(() =>
      verifyPendingEnvelope(options, {
        contract,
        projectRoot: PROJECT_ROOT,
        resolveReceiptPath: () => path.join(PROJECT_ROOT, ...receiptPath.split('/')),
      })
    ).toThrow('receipt reader');
    expect(() =>
      verifyPendingEnvelope(options, {
        ...dependencies,
        readCurrent: undefined,
      })
    ).toThrow('tracked and current governed-byte readers');
    const wrongAuthority = structuredClone(envelope);
    wrongAuthority.pullRequest += 1;
    expect(() =>
      verifyPendingEnvelope(options, {
        ...dependencies,
        readFile: () => JSON.stringify(wrongAuthority),
      })
    ).toThrow('CLI path and pull request authority');
    expect(() =>
      verifyPendingEnvelope(options, {
        ...dependencies,
        readTracked: (_commit, filePath) =>
          readSubjectCompliantAuthorityPath(filePath, contract).toString('utf8'),
        readCurrent: filePath =>
          filePath === contract.governedPaths.source[0]
            ? 'changed current bytes\n'
            : readSubjectCompliantAuthorityPath(filePath, contract).toString('utf8'),
      })
    ).toThrow('differs from checked commit');
    expect(() =>
      verifyPendingEnvelope(
        { ...options, receiptPath: `.planning/evidence/hosted/missing-${process.pid}.json` },
        {}
      )
    ).toThrow('does not exist');
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
      readSubjectCompliantAuthorityPath(filePath, contract)
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
      return readSubjectCompliantAuthorityPath(filePath, contract);
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
    const wrongAuthority = structuredClone(envelope);
    wrongAuthority.receiptPath = '.planning/evidence/hosted/other.json';
    expect(() =>
      verifyTrackedEnvelope(options, {
        ...dependencies,
        readTracked: (commit, filePath) =>
          commit === subjectCommit && filePath === receiptPath
            ? JSON.stringify(wrongAuthority)
            : readTracked(commit, filePath),
      })
    ).toThrow('CLI path and pull request authority');
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
    expect(() =>
      verifyTrackedEnvelope(
        {
          pullRequest: 23,
          receiptPath: '.planning/evidence/hosted/receipt.json',
          subjectCommit: 'b'.repeat(40),
        },
        {}
      )
    ).toThrow('exact-commit reader');
    expect(() =>
      verifyTrackedEnvelope(
        {
          pullRequest: 23,
          receiptPath: '.planning/evidence/hosted/receipt.json',
          subjectCommit: 'b'.repeat(40),
        },
        {
          isTrackedAt: () => true,
          readTracked: () => JSON.stringify({ checkedCommit: 'invalid' }),
        }
      )
    ).toThrow('checked commit is invalid');
    expect(() =>
      verifyTrackedEnvelope(
        { pullRequest: 23, receiptPath: '.planning/evidence/hosted/receipt.json' },
        {}
      )
    ).toThrow('subject commit');
    expect(() =>
      verifyTrackedEnvelope(
        {
          pullRequest: 23,
          receiptPath: '.planning/evidence/hosted/receipt.json',
          subjectCommit: 'b'.repeat(40),
        },
        {
          isTrackedAt: () => true,
          readTracked: () => JSON.stringify({}),
        }
      )
    ).toThrow('checked commit is invalid');
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
    expect(stdout.join('')).toContain('inactive until Plan 11AJ');
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

  test('default Node CLI and filesystem adapters are executable and bounded', () => {
    const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'verify-hosted-ci.js');
    const help = spawnSync(process.execPath, [scriptPath, '--help'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain('Usage:');

    const dependencies = createDefaultDependencies(PROJECT_ROOT);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hosted-defaults-'));
    const receiptPath = path.join(root, 'receipt.json');
    try {
      fs.writeFileSync(receiptPath, '{}\n');
      expect(dependencies.readFile(receiptPath).toString('utf8')).toBe('{}\n');
      fs.writeFileSync(receiptPath, Buffer.alloc(MAX_HOSTED_RECEIPT_BYTES + 1));
      expect(() => dependencies.readFile(receiptPath)).toThrow('size limit');
      expect(() => dependencies.readTracked('not-a-commit', 'package.json')).toThrow(
        'Git hosted-evidence command failed'
      );
      expect(() => dependencies.isAncestor('not-a-commit', 'also-not-a-commit')).toThrow(
        'status command failed'
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
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
    const trackedPackage = dependencies.readTracked(head, 'package.json');
    expect(Buffer.isBuffer(trackedPackage)).toBe(true);
    expect(JSON.parse(trackedPackage.toString('utf8')).name).toBe('@chude/get-stuff-done');
  });
});

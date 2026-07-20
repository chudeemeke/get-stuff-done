'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  evaluateToolchainAuthority,
  runCli,
  validateExecutionSubjectPolicy,
  validateToolchainAuthorityManifest,
  verifyToolchainAuthority,
} = require('../scripts/verify-toolchain-authority');
const { selectHyperfineAsset } = require('../scripts/install-hyperfine');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MAX_GOVERNED_WORKFLOW_BYTES = 256 * 1024;
const MAX_TOOLCHAIN_MANIFEST_BYTES = 256 * 1024;
const MAX_RUNTIME_EVIDENCE_BYTES = 256 * 1024;
const MAX_BUN_VERSION_BYTES = 128;

function makeHyperfineAuthority() {
  return {
    semantics: 'exact-release-assets',
    version: '1.20.0',
    installer: 'scripts/install-hyperfine.js',
    releaseUrl: 'https://github.com/sharkdp/hyperfine/releases/tag/v1.20.0',
    assets: Object.fromEntries(
      [
        ['darwin-arm64', 'darwin', 'arm64'],
        ['darwin-x64', 'darwin', 'x64'],
        ['linux-arm64', 'linux', 'arm64'],
        ['linux-x64', 'linux', 'x64'],
        ['win32-x64', 'win32', 'x64'],
      ].map(([key, platform, architecture]) => [
        key,
        selectHyperfineAsset(platform, architecture),
      ])
    ),
    updateTrigger: 'review a new Hyperfine release and rerun installer plus paired gates',
  };
}

function makeManifest() {
  return {
    schemaVersion: 5,
    bun: {
      semantics: 'exact',
      version: '1.3.5',
      versionFile: '.bun-version',
      updateTrigger: 'review a new Bun release and rerun local authority gates',
    },
    githubActions: {
      semantics: 'exact-commit',
      pins: {
        'actions/checkout': {
          tag: 'v6',
          sha: 'df4cb1c069e1874edd31b4311f1884172cec0e10',
          updateTrigger: 'resolve tag v6 and review release notes',
        },
        'actions/setup-node': {
          tag: 'v6',
          sha: '249970729cb0ef3589644e2896645e5dc5ba9c38',
          updateTrigger: 'resolve tag v6 and review release notes',
        },
        'gitleaks/gitleaks-action': {
          tag: 'v3',
          sha: 'e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e',
          updateTrigger: 'resolve tag v3 and review release notes',
        },
        'oven-sh/setup-bun': {
          tag: 'v2',
          sha: '0c5077e51419868618aeaa5fe8019c62421857d6',
          updateTrigger: 'resolve tag v2 and review release notes',
        },
      },
    },
    containers: {
      semantics: 'exact-digest',
      pins: {
        'verdaccio/verdaccio': {
          tag: '6',
          digest: 'sha256:bcd0dc5f10d0b9cca5a21b1f4fb3b08c6d90978bc87b8b46402abb271e0d573a',
          updateTrigger: 'resolve tag 6 and rerun authenticated upgrade verification',
        },
      },
    },
    node: {
      semantics: 'compatibility-major',
      declaredMajors: [20, 22],
      requireResolvedPatch: true,
    },
    runtimeTools: {
      hyperfine: makeHyperfineAuthority(),
    },
    runtimeRequirements: {
      '.github/workflows/ci.yml': {
        'test-node-20': 'both',
        'perf-budget': 'both',
      },
    },
    runtimeSubjects: {
      'node-20': {
        workflow: '.github/workflows/ci.yml',
        job: 'test-node-20',
        jobName: 'Test Node 20',
        matrix: {},
        nodeMajor: 20,
        requiredTools: [],
      },
      'perf-linux': {
        workflow: '.github/workflows/ci.yml',
        job: 'perf-budget',
        jobName: 'Perf Budget (linux)',
        matrix: {},
        nodeMajor: 22,
        requiredTools: ['hyperfine'],
      },
    },
    governedWorkflows: ['.github/workflows/ci.yml'],
  };
}

function makeRuntimeEvidence() {
  return [
    {
      subject: 'node-20',
      bunVersion: '1.3.5',
      nodeVersion: '20.19.4',
      tools: {},
    },
    {
      subject: 'perf-linux',
      bunVersion: '1.3.5',
      nodeVersion: '22.18.0',
      tools: { hyperfine: '1.20.0' },
    },
  ];
}

function makeCompliantWorkflow() {
  const checkout = {
    uses: 'actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10',
  };
  const setupBun = {
    uses: 'oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6',
    with: { 'bun-version-file': '.bun-version' },
  };
  const setupNode = nodeVersion => ({
    uses: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
    with: { 'node-version': nodeVersion },
  });
  return {
    permissions: { contents: 'read' },
    jobs: {
      'test-node-20': {
        steps: [checkout, setupNode('20'), setupBun, { run: 'node --version && bun test' }],
      },
      'perf-budget': {
        steps: [checkout, setupNode('22'), setupBun, { run: 'node bench.js && bun run bench' }],
      },
    },
  };
}

function makeExecutionSubjectPolicy() {
  const contract = JSON.parse(
    fs.readFileSync(
      path.join(PROJECT_ROOT, 'config', 'phase43-hosted-ci-contract.json'),
      'utf8'
    )
  );
  return structuredClone(contract.executionSubject);
}

function makeControlSteps(policy = makeExecutionSubjectPolicy()) {
  return [
    {
      name: policy.checkoutStep,
      uses: 'actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10',
      with: {
        repository: policy.checkoutRepository,
        ref: policy.checkoutRef,
        path: policy.checkoutPath,
        'persist-credentials': policy.persistCredentials,
        'fetch-depth': policy.fetchDepth,
      },
    },
    {
      name: policy.verificationStep,
      shell: policy.verificationShell,
      env: {
        [policy.expectedSubjectEnvironment]: policy.expectedSubjectExpression,
        [policy.subjectPathEnvironment]: policy.checkoutPath,
      },
      run: policy.verificationRun,
    },
  ];
}

describe('toolchain authority', () => {
  test('repository manifest owns exact execution pins and reviewed runtime assets', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'config', 'phase43-toolchain-authority.json'), 'utf8')
    );

    expect(validateToolchainAuthorityManifest(manifest)).toBe(manifest);
    expect(fs.readFileSync(path.join(PROJECT_ROOT, '.bun-version'), 'utf8').trim()).toBe(
      manifest.bun.version
    );
    expect(Object.keys(manifest.githubActions.pins).sort()).toEqual([
      'actions/cache',
      'actions/checkout',
      'actions/download-artifact',
      'actions/github-script',
      'actions/setup-node',
      'actions/upload-artifact',
      'gitleaks/gitleaks-action',
      'google/osv-scanner-action/osv-scanner-action',
      'lycheeverse/lychee-action',
      'oven-sh/setup-bun',
      'step-security/harden-runner',
    ]);
    expect(manifest.governedWorkflows).toHaveLength(5);
    expect(manifest.schemaVersion).toBe(5);
    expect(manifest.runtimeTools.hyperfine).toEqual(makeHyperfineAuthority());
    expect(manifest.runtimeRequirements['.github/workflows/ci.yml']['perf-budget']).toBe('both');
  });

  test('hosted authority governs every toolchain authority input', () => {
    const hostedContract = JSON.parse(
      fs.readFileSync(
        path.join(PROJECT_ROOT, 'config', 'phase43-hosted-ci-contract.json'),
        'utf8'
      )
    );
    const governed = Object.values(hostedContract.governedPaths).flat();

    expect(governed).toContain('.bun-version');
    expect(governed).toContain('config/phase43-toolchain-authority.json');
    expect(governed).toContain('scripts/lib/hosted-evidence-binding.js');
    expect(governed).toContain('scripts/verify-toolchain-authority.js');
    expect(governed).toContain('tests/hosted-evidence-binding.test.js');
    expect(governed).toContain('tests/toolchain-authority.test.js');
  });

  test('declares a closed and reasoned automatic-token allowlist', () => {
    const contract = JSON.parse(
      fs.readFileSync(
        path.join(PROJECT_ROOT, 'config', 'phase43-hosted-ci-contract.json'),
        'utf8'
      )
    );
    const policy = contract.executionSubject.automaticTokenPolicy;

    expect(contract.executionSubject.schemaVersion).toBe(4);
    expect(policy.requiredPermissions).toEqual({ contents: 'read' });
    expect(policy.allowlist).toEqual([
      {
        action: 'actions/checkout',
        exposure: 'implicit-action-default',
        reason: 'Read-only clone authentication; governed checkouts never persist credentials.',
      },
      {
        action: 'gitleaks/gitleaks-action',
        exposure: 'env',
        key: 'GITHUB_TOKEN',
        value: '${{ secrets.GITHUB_TOKEN }}',
        reason: 'Read-only pull-request metadata access required by the pinned Secret Scan action.',
      },
    ]);
    expect(policy.allowlist.map(entry => entry.action)).not.toContain('actions/upload-artifact');
    expect(policy.allowlist.map(entry => entry.action)).not.toContain('actions/download-artifact');
  });

  test('rejects malformed nested execution-subject authority records', () => {
    const mutations = [
      policy => (policy.eventSubjects = null),
      policy => (policy.evidenceAuthority.checkNames = 'blocking-authority'),
      policy => (policy.performanceProfile.checkouts = null),
      policy => (policy.jobProfiles = null),
      policy => (policy.jobProfiles['.github/workflows/ci.yml'] = null),
      policy => policy.performanceProfile.jobNames.pop(),
      policy => (policy.automaticTokenPolicy = null),
      policy => policy.automaticTokenPolicy.allowlist.push({
        action: 'actions/upload-artifact',
        exposure: 'implicit-action-default',
        reason: 'Not demonstrated.',
      }),
      policy => delete policy.automaticTokenPolicy.allowlist[1].reason,
    ];

    for (const mutate of mutations) {
      const policy = makeExecutionSubjectPolicy();
      mutate(policy);
      expect(() => validateExecutionSubjectPolicy(policy)).toThrow(
        'Execution-subject control-step authority is invalid.'
      );
    }
  });

  test('static repository verification parses workflows and reports current drift', () => {
    const result = verifyToolchainAuthority({ projectRoot: PROJECT_ROOT, mode: 'static' });
    const codes = result.diagnostics.map(diagnostic => diagnostic.code);

    expect(result.mode).toBe('static');
    expect(result.ok).toBe(true);
    expect(codes).toEqual([]);
    expect(codes).not.toContain('node_major_evidence_missing');
  });

  test('rejects automatic-token exposure outside pinned allowlisted actions and read-only permissions', () => {
    const manifest = makeManifest();
    const policy = makeExecutionSubjectPolicy();
    const workflow = makeCompliantWorkflow();
    workflow.permissions = { contents: 'read' };
    workflow.jobs['test-node-20'].steps.push({
      run: 'printf %s "${{ secrets.GITHUB_TOKEN }}"',
    });
    workflow.jobs['perf-budget'].steps[1].with.token = '${{ github.token }}';
    workflow.jobs['perf-budget'].permissions = { contents: 'write' };

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      executionSubject: policy,
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'automatic_token_in_run_step',
      workflow: '.github/workflows/ci.yml',
      job: 'test-node-20',
      step: 4,
    });
    expect(result.diagnostics).toContainEqual({
      code: 'automatic_token_exposure_not_allowlisted',
      workflow: '.github/workflows/ci.yml',
      job: 'perf-budget',
      step: 1,
      action: 'actions/setup-node',
      location: 'with',
      key: 'token',
    });
    expect(result.diagnostics).toContainEqual({
      code: 'workflow_permissions_not_read_only',
      workflow: '.github/workflows/ci.yml',
      job: 'perf-budget',
    });
  });

  test('rejects indirect token contexts and token-shaped bindings outside the allowlist', () => {
    const workflow = makeCompliantWorkflow();
    workflow.env = {
      DEPLOY_KEY: '${{ secrets.DEPLOY_KEY }}',
      GITHUB_TOKEN: 'opaque-workflow-token',
    };
    workflow.jobs['test-node-20'].env = {
      CONTEXT: '${{ toJSON(github) }}',
      ACCESS_TOKEN: 'opaque-job-token',
    };
    workflow.jobs['test-node-20'].steps.push(
      { uses: 'actions/setup-node', with: { token: 'opaque' } },
      { uses: './local-action', env: { ACCESS_TOKEN: 0 } },
      {
        uses: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
        if: '${{ github["token"] }}',
      },
      null,
      []
    );
    workflow.jobs.invalid = null;
    workflow.jobs.reusable = {
      uses: 'owner/repository/.github/workflows/reusable.yml@0123456789012345678901234567890123456789',
      secrets: 'inherit',
    };

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      executionSubject: makeExecutionSubjectPolicy(),
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'automatic_token_workflow_scope_exposure',
      workflow: '.github/workflows/ci.yml',
    });
    expect(result.diagnostics).toContainEqual({
      code: 'automatic_token_job_scope_exposure',
      workflow: '.github/workflows/ci.yml',
      job: 'test-node-20',
    });
    expect(result.diagnostics).toContainEqual({
      code: 'automatic_token_job_scope_exposure',
      workflow: '.github/workflows/ci.yml',
      job: 'reusable',
    });
    expect(result.diagnostics).toContainEqual({
      code: 'automatic_token_exposure_not_allowlisted',
      workflow: '.github/workflows/ci.yml',
      job: 'test-node-20',
      step: 4,
      action: 'actions/setup-node',
      location: 'with',
      key: 'token',
    });
    expect(result.diagnostics).toContainEqual({
      code: 'automatic_token_exposure_not_allowlisted',
      workflow: '.github/workflows/ci.yml',
      job: 'test-node-20',
      step: 5,
      action: null,
      location: 'env',
      key: 'ACCESS_TOKEN',
    });
    expect(result.diagnostics).toContainEqual({
      code: 'automatic_token_exposure_not_allowlisted',
      workflow: '.github/workflows/ci.yml',
      job: 'test-node-20',
      step: 6,
      action: 'actions/setup-node',
      location: 'if',
      key: 'value',
    });
  });

  test('bounds and strictly decodes the toolchain manifest before parsing', () => {
    expect(() =>
      verifyToolchainAuthority(
        { projectRoot: PROJECT_ROOT, mode: 'static' },
        { readManifest: () => ' '.repeat(MAX_TOOLCHAIN_MANIFEST_BYTES + 1) }
      )
    ).toThrow('size limit');

    expect(() =>
      verifyToolchainAuthority(
        { projectRoot: PROJECT_ROOT, mode: 'static' },
        { readManifest: () => Buffer.from([0xff]) }
      )
    ).toThrow('valid UTF-8');
  });

  test('bounds and strictly decodes governed workflows before YAML parsing', () => {
    const readManifest = () => JSON.stringify(makeManifest());
    expect(() =>
      verifyToolchainAuthority(
        { projectRoot: PROJECT_ROOT, mode: 'static' },
        {
          readManifest,
          readWorkflow: () => ' '.repeat(MAX_GOVERNED_WORKFLOW_BYTES + 1),
        }
      )
    ).toThrow('size limit');

    expect(() =>
      verifyToolchainAuthority(
        { projectRoot: PROJECT_ROOT, mode: 'static' },
        { readManifest, readWorkflow: () => Buffer.from([0xff]) }
      )
    ).toThrow('valid UTF-8');
  });

  test('bounds and strictly decodes the Bun version authority file', () => {
    const dependencies = {
      readManifest: () => JSON.stringify(makeManifest()),
      readWorkflow: () => JSON.stringify(makeCompliantWorkflow()),
    };

    expect(() =>
      verifyToolchainAuthority(
        { projectRoot: PROJECT_ROOT, mode: 'static' },
        { ...dependencies, readText: () => Buffer.alloc(MAX_BUN_VERSION_BYTES + 1, 0x31) }
      )
    ).toThrow('size limit');
    expect(() =>
      verifyToolchainAuthority(
        { projectRoot: PROJECT_ROOT, mode: 'static' },
        { ...dependencies, readText: () => Buffer.from([0xff]) }
      )
    ).toThrow('valid UTF-8');
  });

  test('CLI emits a machine-readable verdict and fails closed', () => {
    const output = [];
    const exitCode = runCli([], {
      verifyToolchainAuthority(options) {
        return {
          mode: options.mode,
          ok: false,
          diagnostics: [{ code: 'fixture_drift' }],
        };
      },
      writeOutput(value) {
        output.push(value);
      },
    });

    expect(exitCode).toBe(1);
    expect(JSON.parse(output.join(''))).toEqual({
      mode: 'static',
      ok: false,
      diagnostics: [{ code: 'fixture_drift' }],
    });
  });

  test('CLI loads local runtime evidence and exposes help and bounded errors', () => {
    const evidence = makeRuntimeEvidence();
    const output = [];
    const exitCode = runCli(['--mode', 'local-runtime', '--runtime-evidence', 'evidence.json'], {
      projectRoot: PROJECT_ROOT,
      realpath: filePath => path.resolve(filePath),
      readRuntimeEvidence(filePath) {
        expect(filePath).toBe(path.join(PROJECT_ROOT, 'evidence.json'));
        return JSON.stringify(evidence);
      },
      verifyToolchainAuthority(options) {
        expect(options).toMatchObject({ mode: 'local-runtime', runtimeEvidence: evidence });
        return { mode: 'local-runtime', ok: true, diagnostics: [] };
      },
      writeOutput(value) {
        output.push(value);
      },
    });

    expect(exitCode).toBe(0);
    expect(JSON.parse(output.join('')).ok).toBe(true);

    const help = [];
    expect(runCli(['--help'], { writeOutput: value => help.push(value) })).toBe(0);
    expect(help.join('')).toContain('Usage:');

    for (const args of [
      ['--unknown'],
      ['--mode', 'invalid'],
      ['--mode', 'local-runtime'],
      ['--runtime-evidence', 'evidence.json'],
    ]) {
      const errors = [];
      expect(runCli(args, { writeOutput: value => errors.push(value) })).toBe(2);
      expect(JSON.parse(errors.join('')).diagnostics[0].code).toBe(
        'toolchain_authority_error'
      );
    }

    const traversal = [];
    expect(
      runCli(['--mode', 'local-runtime', '--runtime-evidence', '../outside.json'], {
        projectRoot: PROJECT_ROOT,
        writeOutput: value => traversal.push(value),
      })
    ).toBe(2);
    expect(JSON.parse(traversal.join('')).diagnostics[0].message).toContain('project root');

    const linkEscape = [];
    expect(
      runCli(['--mode', 'local-runtime', '--runtime-evidence', 'evidence.json'], {
        projectRoot: PROJECT_ROOT,
        realpath(filePath) {
          return path.resolve(filePath) === path.resolve(PROJECT_ROOT)
            ? path.resolve(PROJECT_ROOT)
            : path.resolve(PROJECT_ROOT, '..', 'outside', 'evidence.json');
        },
        writeOutput: value => linkEscape.push(value),
      })
    ).toBe(2);
    expect(JSON.parse(linkEscape.join('')).diagnostics[0].message).toContain('through a link');

    const oversized = [];
    expect(
      runCli(['--mode', 'local-runtime', '--runtime-evidence', 'evidence.json'], {
        projectRoot: PROJECT_ROOT,
        realpath: filePath => path.resolve(filePath),
        readRuntimeEvidence: () => ' '.repeat(MAX_RUNTIME_EVIDENCE_BYTES + 1),
        writeOutput: value => oversized.push(value),
      })
    ).toBe(2);
    expect(JSON.parse(oversized.join('')).diagnostics[0].message).toContain('size limit');
  });

  test('names caller-supplied evidence local-runtime and reserves hosted-runtime', () => {
    const evidence = makeRuntimeEvidence();
    const output = [];
    expect(
      runCli(['--mode', 'local-runtime', '--runtime-evidence', 'evidence.json'], {
        projectRoot: PROJECT_ROOT,
        realpath: filePath => path.resolve(filePath),
        readRuntimeEvidence: () => JSON.stringify(evidence),
        verifyToolchainAuthority: options => ({
          mode: options.mode,
          ok: true,
          diagnostics: [],
        }),
        writeOutput: value => output.push(value),
      })
    ).toBe(0);
    expect(JSON.parse(output.join('')).mode).toBe('local-runtime');

    for (const [mode, message] of [
      ['full', 'local-runtime'],
      ['hosted-runtime', 'reserved'],
    ]) {
      const errors = [];
      expect(runCli(['--mode', mode], { writeOutput: value => errors.push(value) })).toBe(2);
      expect(JSON.parse(errors.join('')).diagnostics[0].message).toContain(message);
    }
  });

  test('default Node CLI and runtime-evidence adapters are executable and bounded', () => {
    const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'verify-toolchain-authority.js');
    const help = spawnSync(process.execPath, [scriptPath, '--help'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain('Usage:');

    const staticVerdict = spawnSync(process.execPath, [scriptPath, '--mode', 'static'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    expect([0, 1]).toContain(staticVerdict.status);
    expect(JSON.parse(staticVerdict.stdout).mode).toBe('static');
    expect(() => verifyToolchainAuthority({ mode: 'invalid' })).toThrow('mode');

    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-toolchain-evidence-'));
    const evidencePath = path.join(root, 'evidence.json');
    try {
      fs.writeFileSync(evidencePath, JSON.stringify(makeRuntimeEvidence()));
      const output = [];
      expect(
        runCli(['--mode', 'local-runtime', '--runtime-evidence', 'evidence.json'], {
          projectRoot: root,
          verifyToolchainAuthority: options => ({ mode: options.mode, ok: true, diagnostics: [] }),
          writeOutput: value => output.push(value),
        })
      ).toBe(0);
      expect(JSON.parse(output.join('')).ok).toBe(true);

      fs.writeFileSync(evidencePath, ' '.repeat(MAX_RUNTIME_EVIDENCE_BYTES + 1));
      const bounded = [];
      expect(
        runCli(['--mode', 'local-runtime', '--runtime-evidence', 'evidence.json'], {
          projectRoot: root,
          writeOutput: value => bounded.push(value),
        })
      ).toBe(2);
      expect(JSON.parse(bounded.join('')).diagnostics[0].message).toContain('size limit');

      const nonError = [];
      expect(
        runCli([], {
          verifyToolchainAuthority() {
            const failure = new Error();
            failure.message = '';
            throw failure;
          },
          writeOutput: value => nonError.push(value),
        })
      ).toBe(2);
      expect(JSON.parse(nonError.join('')).diagnostics[0].message).toBe('Error');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('validates an unambiguous closed manifest schema', () => {
    const manifest = makeManifest();

    expect(validateToolchainAuthorityManifest(manifest)).toBe(manifest);
    expect(() => validateToolchainAuthorityManifest({ ...manifest, unknown: true })).toThrow(
      'unknown field'
    );
    expect(() =>
      validateToolchainAuthorityManifest({
        ...manifest,
        bun: { ...manifest.bun, semantics: 'floating' },
      })
    ).toThrow('Bun authority');
  });

  test('accepts exact per-job runtime declarations for payload jobs', () => {
    const manifest = makeManifest();

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      requireRuntimeEvidence: false,
    });

    expect(result).toEqual({ ok: true, diagnostics: [] });
  });

  test('rejects a payload job omitted from runtime requirements', () => {
    const manifest = makeManifest();
    const workflow = makeCompliantWorkflow();
    workflow.jobs.undeclared = {
      steps: [
        { uses: 'actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10' },
        { run: 'echo undeclared payload' },
      ],
    };

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      requireRuntimeEvidence: false,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'runtime_requirement_missing',
      workflow: '.github/workflows/ci.yml',
      job: 'undeclared',
    });
  });

  test('accepts bounded scalar matrix values and rejects ambiguous authority identities', () => {
    for (const value of [1, true]) {
      const manifest = makeManifest();
      manifest.runtimeSubjects['node-20'].matrix = { shard: value };
      expect(validateToolchainAuthorityManifest(manifest)).toBe(manifest);
    }

    const missingIdentity = makeManifest();
    missingIdentity.runtimeRequirements = {
      '.github/workflows/ci.yml': { 'invalid/job': 'both' },
    };
    expect(() => validateToolchainAuthorityManifest(missingIdentity)).toThrow(
      'runtime requirement authority'
    );

    const duplicateMatrix = makeManifest();
    duplicateMatrix.runtimeSubjects['node-20-copy'] = {
      ...duplicateMatrix.runtimeSubjects['node-20'],
      matrix: { ...duplicateMatrix.runtimeSubjects['node-20'].matrix },
    };
    expect(() => validateToolchainAuthorityManifest(duplicateMatrix)).toThrow(
      'runtime subject authority'
    );
  });

  test('rejects malformed nested authority records fail-closed', () => {
    const cases = [
      [manifest => (manifest.schemaVersion = 1), 'schema version'],
      [manifest => (manifest.bun.version = ''), 'Bun authority'],
      [manifest => (manifest.bun.version = '1.2.3+one+two'), 'Bun authority'],
      [manifest => (manifest.bun.updateTrigger = ''), 'Bun authority'],
      [manifest => (manifest.githubActions.semantics = 'tag'), 'GitHub Action authority'],
      [manifest => (manifest.githubActions.pins = {}), 'must define pins'],
      [
        manifest => {
          manifest.githubActions.pins['actions/checkout@v6'] =
            manifest.githubActions.pins['actions/checkout'];
          delete manifest.githubActions.pins['actions/checkout'];
        },
        'invalid pin',
      ],
      [manifest => (manifest.githubActions.pins['actions/checkout'].tag = ''), 'invalid pin'],
      [
        manifest => (manifest.githubActions.pins['actions/checkout'].sha = 'v6'),
        'invalid pin',
      ],
      [manifest => (manifest.containers.semantics = 'tag'), 'container authority'],
      [manifest => (manifest.containers.pins = {}), 'must define pins'],
      [manifest => (manifest.containers.pins['verdaccio/verdaccio'].digest = 'latest'), 'invalid pin'],
      [manifest => (manifest.node.declaredMajors = [22]), 'Node authority'],
      [
        manifest => (manifest.runtimeTools.hyperfine.semantics = 'exact'),
        'exact runtime authority',
      ],
      [manifest => (manifest.runtimeTools = null), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools = []), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools.other = {}), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools.hyperfine.extra = true), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools.hyperfine.version = '1.20.1'), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools.hyperfine.installer = '../installer.js'), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools.hyperfine.releaseUrl = 'https://example.com'), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools.hyperfine.updateTrigger = ''), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools.hyperfine.assets = null), 'exact runtime authority'],
      [manifest => (manifest.runtimeTools.hyperfine.assets = []), 'exact runtime authority'],
      [manifest => delete manifest.runtimeTools.hyperfine.assets['linux-x64'], 'exact runtime authority'],
      [
        manifest => (manifest.runtimeTools.hyperfine.assets['linux-x64'].extra = true),
        'exact runtime authority',
      ],
      [
        manifest => (manifest.runtimeTools.hyperfine.assets['linux-x64'].archiveFormat = 'zip'),
        'exact runtime authority',
      ],
      [
        manifest => (manifest.runtimeTools.hyperfine.assets['linux-x64'].executable = 'other'),
        'exact runtime authority',
      ],
      [
        manifest => (manifest.runtimeTools.hyperfine.assets['linux-x64'].name = 'other.tar.gz'),
        'exact runtime authority',
      ],
      [
        manifest => (manifest.runtimeTools.hyperfine.assets['linux-x64'].sha256 = 'latest'),
        'exact runtime authority',
      ],
      [
        manifest => (manifest.runtimeTools.hyperfine.assets['linux-x64'].url = 'https://example.com'),
        'exact runtime authority',
      ],
      [
        manifest => (manifest.runtimeTools.hyperfine.assets['linux-x64'].version = '1.20.1'),
        'exact runtime authority',
      ],
      [manifest => (manifest.runtimeSubjects = {}), 'runtime subject authority'],
      [manifest => (manifest.runtimeSubjects = null), 'runtime subject authority'],
      [
        manifest => delete manifest.runtimeSubjects['node-20'].jobName,
        'runtime subject authority',
      ],
      [
        manifest => (manifest.runtimeSubjects['node-20'].jobName = 'Unsafe\nName'),
        'runtime subject authority',
      ],
      [manifest => (manifest.runtimeRequirements = null), 'runtime requirement authority'],
      [
        manifest =>
          (manifest.runtimeRequirements['.github/workflows/ci.yml']['test-node-20'] =
            'sometimes'),
        'runtime requirement authority',
      ],
      [
        manifest => (manifest.runtimeSubjects['node-20'].matrix = []),
        'runtime subject authority',
      ],
      [
        manifest => {
          manifest.runtimeSubjects = Object.fromEntries(
            Array.from({ length: 101 }, (_, index) => [
              `subject-${index}`,
              {
                workflow: '.github/workflows/ci.yml',
                job: 'test-node-20',
                matrix: { row: index },
                nodeMajor: 20,
                requiredTools: index === 0 ? ['hyperfine'] : [],
              },
            ])
          );
        },
        'runtime subject authority',
      ],
      [manifest => (manifest.runtimeRequirements = {}), 'runtime requirement authority'],
      [
        manifest => (manifest.runtimeSubjects['perf-linux'].requiredTools = ['unknown']),
        'runtime subject authority',
      ],
      [manifest => (manifest.governedWorkflows = []), 'governed workflow authority'],
    ];

    for (const [mutate, message] of cases) {
      const manifest = makeManifest();
      mutate(manifest);
      expect(() => validateToolchainAuthorityManifest(manifest)).toThrow(message);
    }
  });

  test('rejects floating Bun instead of treating latest as authority', () => {
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: 'latest',
      workflows: {},
      runtimeEvidence: [],
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual({
      code: 'bun_version_mismatch',
      expected: '1.3.5',
      actual: 'latest',
    });
  });

  test('handles default evaluation inputs and irregular workflow dependency shapes', () => {
    const defaults = evaluateToolchainAuthority({ manifest: makeManifest() });
    expect(defaults.ok).toBe(false);
    expect(defaults.diagnostics).toContainEqual({
      code: 'governed_workflow_missing',
      workflow: '.github/workflows/ci.yml',
    });

    const workflow = makeCompliantWorkflow();
    workflow.jobs.ignored = null;
    workflow.jobs.extra = { steps: [{ uses: 'actions/cache' }] };
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
    });
    expect(result.diagnostics).toContainEqual({
      code: 'action_not_governed',
      workflow: '.github/workflows/ci.yml',
      action: 'actions/cache',
    });
  });

  test('rejects ambiguous and subject-mismatched Node setup', () => {
    const ambiguous = makeCompliantWorkflow();
    ambiguous.jobs['test-node-20'].steps.splice(2, 0, {
      uses: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
      with: { 'node-version': '20' },
    });
    const ambiguousResult = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': ambiguous },
    });
    expect(ambiguousResult.diagnostics).toContainEqual({
      code: 'node_setup_ambiguous',
      workflow: '.github/workflows/ci.yml',
      job: 'test-node-20',
    });

    const mismatched = makeCompliantWorkflow();
    mismatched.jobs['test-node-20'].steps[1].with['node-version'] = 22;
    const mismatchResult = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': mismatched },
    });
    expect(mismatchResult.diagnostics).toContainEqual({
      code: 'node_setup_subject_mismatch',
      subject: 'node-20',
      expected: 20,
      actual: 22,
    });
  });

  test('rejects movable GitHub Action tags in governed workflows', () => {
    const manifest = makeManifest();
    manifest.governedWorkflows = ['.github/workflows/ci.yml'];

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: {
        '.github/workflows/ci.yml': {
          jobs: { test: { steps: [{ uses: 'actions/checkout@v6' }] } },
        },
      },
      runtimeEvidence: [],
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual({
      code: 'action_ref_not_pinned',
      workflow: '.github/workflows/ci.yml',
      action: 'actions/checkout',
      expected: 'df4cb1c069e1874edd31b4311f1884172cec0e10',
      actual: 'v6',
    });
  });

  test('rejects setup-bun steps that bypass the Bun version file', () => {
    const manifest = makeManifest();
    manifest.githubActions.pins['oven-sh/setup-bun'] = {
      tag: 'v2',
      sha: '0c5077e51419868618aeaa5fe8019c62421857d6',
      updateTrigger: 'resolve tag v2 and review release notes',
    };

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: {
        '.github/workflows/ci.yml': {
          jobs: {
            test: {
              steps: [
                {
                  uses: 'oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6',
                  with: { 'bun-version': 'latest' },
                },
              ],
            },
          },
        },
      },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'bun_setup_not_authoritative',
      workflow: '.github/workflows/ci.yml',
      expectedVersionFile: '.bun-version',
    });
  });

  test('rejects runtime setup source overrides and unknown inputs', () => {
    const cases = [
      {
        action: 'oven-sh/setup-bun@',
        input: 'bun-download-url',
        value: 'https://attacker.invalid/bun.zip',
        code: 'bun_setup_not_authoritative',
      },
      {
        action: 'actions/setup-node@',
        input: 'mirror',
        value: 'https://attacker.invalid/node',
        code: 'node_setup_not_authoritative',
      },
      {
        action: 'actions/setup-node@',
        input: 'mirror-token',
        value: 'attacker-token',
        code: 'node_setup_not_authoritative',
      },
    ];

    for (const testCase of cases) {
      const workflow = makeCompliantWorkflow();
      const setup = workflow.jobs['test-node-20'].steps.find(step =>
        step.uses?.startsWith(testCase.action)
      );
      setup.with[testCase.input] = testCase.value;

      const result = evaluateToolchainAuthority({
        manifest: makeManifest(),
        bunVersion: '1.3.5',
        workflows: { '.github/workflows/ci.yml': workflow },
        runtimeEvidence: makeRuntimeEvidence(),
      });

      expect(result.diagnostics.map(diagnostic => diagnostic.code)).toContain(testCase.code);
    }
  });

  test('requires authoritative Bun setup in every job that executes Bun', () => {
    const workflow = makeCompliantWorkflow();
    workflow.jobs['perf-budget'].steps = workflow.jobs['perf-budget'].steps.filter(
      step => !step.uses?.startsWith('oven-sh/setup-bun@')
    );

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'bun_setup_missing',
      workflow: '.github/workflows/ci.yml',
      job: 'perf-budget',
    });
  });

  test('rejects conditional or non-blocking runtime setup actions', () => {
    const cases = [
      {
        action: 'oven-sh/setup-bun@',
        field: 'if',
        value: '${{ false }}',
        code: 'bun_setup_not_authoritative',
      },
      {
        action: 'oven-sh/setup-bun@',
        field: 'continue-on-error',
        value: '${{ true }}',
        code: 'bun_setup_not_authoritative',
      },
      {
        action: 'actions/setup-node@',
        field: 'if',
        value: '${{ false }}',
        code: 'node_setup_not_authoritative',
      },
      {
        action: 'actions/setup-node@',
        field: 'continue-on-error',
        value: 'false',
        code: 'node_setup_not_authoritative',
      },
    ];

    for (const testCase of cases) {
      const workflow = makeCompliantWorkflow();
      const setup = workflow.jobs['test-node-20'].steps.find(step =>
        step.uses?.startsWith(testCase.action)
      );
      setup[testCase.field] = testCase.value;

      const result = evaluateToolchainAuthority({
        manifest: makeManifest(),
        bunVersion: '1.3.5',
        workflows: { '.github/workflows/ci.yml': workflow },
        runtimeEvidence: makeRuntimeEvidence(),
      });

      expect(result.diagnostics.map(diagnostic => diagnostic.code)).toContain(testCase.code);
    }
  });

  test('requires authoritative setup-node in every Node-executing or runtime-evidence job', () => {
    const floating = makeCompliantWorkflow();
    floating.jobs['test-node-20'].steps.find(step =>
      step.uses?.startsWith('actions/setup-node@')
    ).with['node-version'] = 'latest';
    const floatingResult = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': floating },
      runtimeEvidence: makeRuntimeEvidence(),
    });
    expect(floatingResult.diagnostics).toContainEqual({
      code: 'node_setup_not_authoritative',
      workflow: '.github/workflows/ci.yml',
      job: 'test-node-20',
      actual: 'latest',
    });

    const missing = makeCompliantWorkflow();
    missing.jobs['perf-budget'].steps = missing.jobs['perf-budget'].steps.filter(
      step => !step.uses?.startsWith('actions/setup-node@')
    );
    const missingResult = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': missing },
      runtimeEvidence: makeRuntimeEvidence(),
    });
    expect(missingResult.diagnostics).toContainEqual({
      code: 'node_setup_missing',
      workflow: '.github/workflows/ci.yml',
      job: 'perf-budget',
    });
  });

  test('requires declared setup-node without guessing executable aliases', () => {
    const manifest = makeManifest();
    manifest.runtimeRequirements['.github/workflows/ci.yml']['nodejs-entry'] = 'node';
    const workflow = makeCompliantWorkflow();
    workflow.jobs['nodejs-entry'] = {
      steps: [{ run: 'nodejs scripts/example.js' }],
    };

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'node_setup_missing',
      workflow: '.github/workflows/ci.yml',
      job: 'nodejs-entry',
    });
  });

  test('requires setup-bun for indirect shell and runtime-subject execution', () => {
    const manifest = makeManifest();
    manifest.runtimeRequirements['.github/workflows/ci.yml']['indirect-bun'] = 'bun';
    const workflow = makeCompliantWorkflow();
    workflow.jobs['indirect-bun'] = {
      steps: [
        {
          uses: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
          with: { 'node-version': '22' },
        },
        { run: 'npm test' },
      ],
    };

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'bun_setup_missing',
      workflow: '.github/workflows/ci.yml',
      job: 'indirect-bun',
    });
  });

  test('rejects a runtime setup outside the declared exact set', () => {
    const manifest = makeManifest();
    manifest.runtimeRequirements['.github/workflows/ci.yml']['test-node-20'] = 'bun';

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      requireRuntimeEvidence: false,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'node_setup_extraneous',
      workflow: '.github/workflows/ci.yml',
      job: 'test-node-20',
    });
  });

  test('exempts only the injected byte-exact pre-payload control step', () => {
    const workflow = makeCompliantWorkflow();
    const executionSubject = makeExecutionSubjectPolicy();
    workflow.jobs['control-only'] = { steps: makeControlSteps(executionSubject) };

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      executionSubject,
      requireRuntimeEvidence: false,
    });

    expect(result).toEqual({ ok: true, diagnostics: [] });
  });

  test('classifies every control-step byte or position deviation as payload', () => {
    const executionSubject = makeExecutionSubjectPolicy();
    const mutations = [
      steps => (steps[1].name = 'Verify a different subject'),
      steps => (steps[1].shell = 'pwsh'),
      steps => (steps[1].env.EXTRA = 'unsafe'),
      steps => (steps[1].run = `${steps[1].run}\n`),
      steps => steps.splice(1, 0, { uses: 'actions/cache@cache-sha' }),
      steps => (steps[0].with.path = 'side-workspace'),
    ];

    for (const mutate of mutations) {
      const workflow = makeCompliantWorkflow();
      const steps = makeControlSteps(executionSubject);
      mutate(steps);
      workflow.jobs['control-only'] = { steps };

      const result = evaluateToolchainAuthority({
        manifest: makeManifest(),
        bunVersion: '1.3.5',
        workflows: { '.github/workflows/ci.yml': workflow },
        executionSubject,
        requireRuntimeEvidence: false,
      });

      expect(result.diagnostics).toContainEqual({
        code: 'runtime_requirement_missing',
        workflow: '.github/workflows/ci.yml',
        job: 'control-only',
      });
    }
  });

  test('requires runtime subjects for every governed matrix row', () => {
    const manifest = makeManifest();
    manifest.runtimeRequirements = {
      '.github/workflows/ci.yml': { matrix: 'both' },
    };
    manifest.runtimeSubjects = {
      'matrix-node-20': {
        workflow: '.github/workflows/ci.yml',
        job: 'matrix',
        jobName: 'Matrix (ubuntu-latest, Node 20)',
        matrix: { os: 'ubuntu-latest', node: 20 },
        nodeMajor: 20,
        requiredTools: [],
      },
      'matrix-node-22': {
        workflow: '.github/workflows/ci.yml',
        job: 'matrix',
        jobName: 'Matrix (ubuntu-latest, Node 22)',
        matrix: { os: 'ubuntu-latest', node: 22 },
        nodeMajor: 22,
        requiredTools: ['hyperfine'],
      },
    };
    const workflow = {
      jobs: {
        matrix: {
          strategy: { matrix: { os: ['ubuntu-latest'], node: [20, 22] } },
          steps: [
            { uses: 'actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10' },
            {
              uses: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
              with: { 'node-version': '${{ matrix.node }}' },
            },
            {
              uses: 'oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6',
              with: { 'bun-version-file': '.bun-version' },
            },
            { run: 'node --version && bun --version' },
          ],
        },
      },
    };
    const runtimeEvidence = Object.entries(manifest.runtimeSubjects).map(([subject, authority]) => ({
      subject,
      bunVersion: '1.3.5',
      nodeVersion: `${authority.nodeMajor}.1.0`,
      tools: authority.requiredTools.includes('hyperfine') ? { hyperfine: '1.20.0' } : {},
    }));

    expect(
      evaluateToolchainAuthority({
        manifest,
        bunVersion: '1.3.5',
        workflows: { '.github/workflows/ci.yml': workflow },
        runtimeEvidence,
      })
    ).toEqual({ ok: true, diagnostics: [] });

    workflow.jobs.matrix.strategy.matrix.os.push('windows-latest');
    const incomplete = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence,
    });
    expect(incomplete.diagnostics).toContainEqual({
      code: 'runtime_subject_matrix_row_missing',
      workflow: '.github/workflows/ci.yml',
      job: 'matrix',
      matrix: { node: 20, os: 'windows-latest' },
    });
  });

  test('rejects runtime matrices above the evidence cardinality bound before expansion', () => {
    const manifest = makeManifest();
    manifest.runtimeRequirements = {
      '.github/workflows/ci.yml': { matrix: 'both' },
    };
    manifest.runtimeSubjects = {
      bounded: {
        workflow: '.github/workflows/ci.yml',
        job: 'matrix',
        jobName: 'Matrix (0)',
        matrix: { row: 0 },
        nodeMajor: 22,
        requiredTools: ['hyperfine'],
      },
    };
    const workflow = {
      jobs: {
        matrix: {
          strategy: { matrix: { row: Array.from({ length: 101 }, (_, index) => index) } },
          steps: [
            {
              uses: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
              with: { 'node-version': '22' },
            },
          ],
        },
      },
    };
    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: [
        {
          subject: 'bounded',
          bunVersion: '1.3.5',
          nodeVersion: '22.1.0',
          tools: { hyperfine: '1.20.0' },
        },
      ],
    });

    expect(result.diagnostics).toContainEqual({
      code: 'runtime_subject_matrix_unsupported',
      workflow: '.github/workflows/ci.yml',
      job: 'matrix',
    });
  });

  test('rejects duplicate runtime matrix rows instead of reusing one subject', () => {
    const manifest = makeManifest();
    manifest.runtimeRequirements = {
      '.github/workflows/ci.yml': { matrix: 'both' },
    };
    manifest.runtimeSubjects = {
      duplicate: {
        workflow: '.github/workflows/ci.yml',
        job: 'matrix',
        jobName: 'Matrix (Node 20)',
        matrix: { node: 20 },
        nodeMajor: 20,
        requiredTools: ['hyperfine'],
      },
    };
    const workflow = {
      jobs: {
        matrix: {
          strategy: { matrix: { node: [20, 20] } },
          steps: [
            {
              uses: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
              with: { 'node-version': '${{ matrix.node }}' },
            },
          ],
        },
      },
    };
    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: [
        {
          subject: 'duplicate',
          bunVersion: '1.3.5',
          nodeVersion: '20.1.0',
          tools: { hyperfine: '1.20.0' },
        },
      ],
    });

    expect(result.diagnostics).toContainEqual({
      code: 'runtime_subject_matrix_unsupported',
      workflow: '.github/workflows/ci.yml',
      job: 'matrix',
    });
  });

  test('rejects ambiguous Bun setup in one job', () => {
    const workflow = makeCompliantWorkflow();
    workflow.jobs['perf-budget'].steps.push({
      uses: 'oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6',
      with: { 'bun-version-file': '.bun-version' },
    });

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'bun_setup_ambiguous',
      workflow: '.github/workflows/ci.yml',
      job: 'perf-budget',
    });
  });

  test('discovers only semantic workflow action and container locations', () => {
    const workflow = makeCompliantWorkflow();
    const digest = 'sha256:bcd0dc5f10d0b9cca5a21b1f4fb3b08c6d90978bc87b8b46402abb271e0d573a';
    workflow.jobs['perf-budget'].steps[0].with = {
      image: 'attacker/image:latest',
      uses: `attacker/unreviewed@${'a'.repeat(40)}`,
    };
    workflow.jobs['perf-budget'].container = `verdaccio/verdaccio@${digest}`;
    workflow.jobs['perf-budget'].services = {
      verdaccio: { image: `verdaccio/verdaccio@${digest}` },
    };

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result).toEqual({ ok: true, diagnostics: [] });
  });

  test('fails closed when a governed workflow is missing', () => {
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: {},
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'governed_workflow_missing',
      workflow: '.github/workflows/ci.yml',
    });
  });

  test('rejects remote actions missing from repository authority', () => {
    const manifest = makeManifest();
    manifest.governedWorkflows = ['.github/workflows/ci.yml'];

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: {
        '.github/workflows/ci.yml': {
          jobs: { test: { steps: [{ uses: 'attacker/unreviewed@' + 'a'.repeat(40) }] } },
        },
      },
      runtimeEvidence: [],
    });

    expect(result.diagnostics).toContainEqual({
      code: 'action_not_governed',
      workflow: '.github/workflows/ci.yml',
      action: 'attacker/unreviewed',
    });
  });

  test('fails closed on ungoverned local action definitions', () => {
    const workflow = makeCompliantWorkflow();
    workflow.jobs['perf-budget'].steps.push({ uses: './.github/actions/local' });

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'local_action_not_governed',
      workflow: '.github/workflows/ci.yml',
      action: './.github/actions/local',
    });
  });

  test('rejects mutable container tags where a digest is required', () => {
    const manifest = makeManifest();
    const digest = 'sha256:bcd0dc5f10d0b9cca5a21b1f4fb3b08c6d90978bc87b8b46402abb271e0d573a';
    const workflow = '.github/workflows/ci.yml';

    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: {
        [workflow]: {
          jobs: { verify: { services: { verdaccio: { image: 'verdaccio/verdaccio:6' } } } },
        },
      },
      runtimeEvidence: [],
    });

    expect(result.diagnostics).toContainEqual({
      code: 'container_ref_not_pinned',
      workflow,
      image: 'verdaccio/verdaccio',
      expected: `verdaccio/verdaccio@${digest}`,
      actual: 'verdaccio/verdaccio:6',
    });
  });

  test('governs Docker-based actions as exact container dependencies', () => {
    const manifest = makeManifest();
    const digest = 'sha256:bcd0dc5f10d0b9cca5a21b1f4fb3b08c6d90978bc87b8b46402abb271e0d573a';
    const workflow = '.github/workflows/ci.yml';

    const mutableWorkflow = makeCompliantWorkflow();
    mutableWorkflow.jobs['perf-budget'].steps.push({ uses: 'docker://verdaccio/verdaccio:6' });
    const exactWorkflow = makeCompliantWorkflow();
    exactWorkflow.jobs['perf-budget'].steps.push({
      uses: `docker://verdaccio/verdaccio@${digest}`,
    });
    const mutable = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { [workflow]: mutableWorkflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });
    const exact = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { [workflow]: exactWorkflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(mutable.diagnostics).toContainEqual({
      code: 'container_ref_not_pinned',
      workflow,
      image: 'verdaccio/verdaccio',
      expected: `docker://verdaccio/verdaccio@${digest}`,
      actual: 'docker://verdaccio/verdaccio:6',
    });
    expect(exact).toEqual({ ok: true, diagnostics: [] });
  });

  test('rejects container images missing from repository authority', () => {
    const manifest = makeManifest();
    const unknownDigest = `sha256:${'a'.repeat(64)}`;

    const workflow = makeCompliantWorkflow();
    workflow.jobs['perf-budget'].container = { image: `attacker/image@${unknownDigest}` };
    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toContainEqual({
      code: 'container_not_governed',
      workflow: '.github/workflows/ci.yml',
      image: 'attacker/image',
    });
  });

  test('rejects performance tools absent from repository authority', () => {
    const manifest = makeManifest();
    const evidence = makeRuntimeEvidence();
    evidence[1].tools['benchmark-wrapper'] = '1.0.0';
    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: evidence,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'runtime_tool_not_governed',
      subject: 'perf-linux',
      tool: 'benchmark-wrapper',
    });
  });

  test('does not treat prototype-chain properties as governed runtime tools', () => {
    const evidence = makeRuntimeEvidence();
    evidence[1].tools.constructor = '1.0.0';
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: evidence,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'runtime_tool_not_governed',
      subject: 'perf-linux',
      tool: 'constructor',
    });
  });

  test('rejects resolved Node versions outside declared compatibility majors', () => {
    const evidence = makeRuntimeEvidence();
    evidence[0].nodeVersion = '24.1.0';
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: evidence,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'node_major_not_declared',
      subject: 'node-20',
      expected: [20, 22],
      actual: 24,
      resolvedVersion: '24.1.0',
    });
  });

  test('requires a resolved Node patch rather than major-only runtime evidence', () => {
    const evidence = makeRuntimeEvidence();
    evidence[1].nodeVersion = '22';
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: evidence,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'node_version_not_resolved',
      subject: 'perf-linux',
      actual: '22',
    });
  });

  test('requires runtime evidence for every governed subject', () => {
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: [makeRuntimeEvidence()[1]],
    });

    expect(result.diagnostics).toContainEqual({
      code: 'runtime_subject_evidence_missing',
      subject: 'node-20',
    });
  });

  test('binds runtime evidence to the declared subject and exact Bun version', () => {
    const evidence = makeRuntimeEvidence();
    evidence[0].bunVersion = 'latest';
    evidence.push({ ...evidence[1], tools: { ...evidence[1].tools } });

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: evidence,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'bun_runtime_version_mismatch',
      subject: 'node-20',
      expected: '1.3.5',
      actual: 'latest',
    });
    expect(result.diagnostics).toContainEqual({
      code: 'runtime_subject_evidence_ambiguous',
      subject: 'perf-linux',
      actual: 2,
    });
  });

  test('requires each subject-specific runtime tool and rejects unbound subjects', () => {
    const evidence = makeRuntimeEvidence();
    delete evidence[1].tools.hyperfine;
    evidence.push({
      subject: 'unknown',
      bunVersion: '1.3.5',
      nodeVersion: '22.18.0',
      tools: {},
    });

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: evidence,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'required_runtime_tool_missing',
      subject: 'perf-linux',
      tool: 'hyperfine',
    });
    expect(result.diagnostics).toContainEqual({
      code: 'runtime_subject_not_governed',
      subject: 'unknown',
    });
  });

  test('rejects malformed runtime evidence before producing diagnostics', () => {
    const evidence = makeRuntimeEvidence();
    evidence[0].tools = [];

    expect(() =>
      evaluateToolchainAuthority({
        manifest: makeManifest(),
        bunVersion: '1.3.5',
        workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
        runtimeEvidence: evidence,
      })
    ).toThrow('runtime evidence');
    expect(() =>
      evaluateToolchainAuthority({
        manifest: makeManifest(),
        bunVersion: '1.3.5',
        workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
        runtimeEvidence: Array.from({ length: 101 }, () => makeRuntimeEvidence()[0]),
      })
    ).toThrow('runtime evidence');
  });

  test('rejects a resolved Node major assigned to the wrong runtime subject', () => {
    const evidence = makeRuntimeEvidence();
    evidence[0].nodeVersion = '22.18.0';

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: evidence,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'node_subject_major_mismatch',
      subject: 'node-20',
      expected: 20,
      actual: 22,
    });
  });

  test('accepts exact execution pins and exact governed runtimes', () => {
    const manifest = makeManifest();
    const result = evaluateToolchainAuthority({
      manifest,
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result).toEqual({ ok: true, diagnostics: [] });
  });

  test('rejects floating versions for declared runtime tools', () => {
    const evidence = makeRuntimeEvidence();
    evidence[1].tools.hyperfine = 'latest';
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
      runtimeEvidence: evidence,
    });

    expect(result.diagnostics).toContainEqual({
      code: 'runtime_tool_version_not_resolved',
      subject: 'perf-linux',
      tool: 'hyperfine',
      actual: 'latest',
    });
  });

  test('requires runtime versions to be resolved and equal exact authority', () => {
    const evaluateVersion = version => {
      const evidence = makeRuntimeEvidence();
      evidence[1].tools.hyperfine = version;
      return evaluateToolchainAuthority({
        manifest: makeManifest(),
        bunVersion: '1.3.5',
        workflows: { '.github/workflows/ci.yml': makeCompliantWorkflow() },
        runtimeEvidence: evidence,
      });
    };

    expect(evaluateVersion('1.20.0')).toEqual({ ok: true, diagnostics: [] });
    for (const version of ['1.20.1', '1.20.0-rc.1+build.7']) {
      expect(evaluateVersion(version).diagnostics).toContainEqual({
        code: 'runtime_tool_version_mismatch',
        subject: 'perf-linux',
        tool: 'hyperfine',
        expected: '1.20.0',
        actual: version,
      });
    }
    for (const version of [
      '',
      '12345678901.20.0',
      '1.a.0',
      '1.20.0-01',
      '1.20.0+bad!',
      '1.20.0-alpha..1',
    ]) {
      expect(evaluateVersion(version).diagnostics).toContainEqual({
        code: 'runtime_tool_version_not_resolved',
        subject: 'perf-linux',
        tool: 'hyperfine',
        actual: version,
      });
    }
  });

  test('bounds diagnostics from adversarial workflow payloads', () => {
    const workflow = makeCompliantWorkflow();
    workflow.jobs['perf-budget'].steps.push(
      ...Array.from({ length: 150 }, (_, index) => ({
        uses: `attacker/action-${index}@${'a'.repeat(40)}`,
      }))
    );
    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toHaveLength(100);
    expect(result.diagnostics.at(-1)).toEqual({ code: 'diagnostics_truncated', omitted: 51 });
  });

  test('bounds diagnostic strings and safely traverses cyclic workflow objects', () => {
    const cyclic = { uses: `attacker/${'x'.repeat(500)}@${'a'.repeat(40)}` };
    cyclic.loop = cyclic;
    const workflow = makeCompliantWorkflow();
    workflow.jobs['perf-budget'].steps.push(cyclic);

    const result = evaluateToolchainAuthority({
      manifest: makeManifest(),
      bunVersion: '1.3.5',
      workflows: { '.github/workflows/ci.yml': workflow },
      runtimeEvidence: makeRuntimeEvidence(),
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe('action_not_governed');
    expect(result.diagnostics[0].action).toHaveLength(200);
    expect(result.diagnostics[0].action.endsWith('...')).toBe(true);
  });
});

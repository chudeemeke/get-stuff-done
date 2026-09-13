'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');
const { captureFixture } = require('./helpers/paired-perf-fixture');
const {
  classifyPairedPerformanceAuthority,
  deriveEvidenceTopology,
  joinHostedEvidence,
  validateEvidenceAuthorityPolicy,
  validateEvidenceBindingPolicy,
  validateEventSubjectPolicies,
  validatePairedBindingManifest,
} = require('../scripts/lib/hosted-evidence-binding');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPOSITORY = 'chudeemeke/get-stuff-done';
const BASE_SHA = 'a'.repeat(40);
const HEAD_SHA = 'b'.repeat(40);

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8'));
}

function eventSubjectPolicies() {
  return {
    pull_request: {
      repository: '${{ github.event.pull_request.head.repo.full_name }}',
      ref: '${{ github.event.pull_request.head.sha }}',
    },
    push: {
      repository: '${{ github.repository }}',
      ref: '${{ github.sha }}',
    },
    schedule: {
      repository: '${{ github.repository }}',
      ref: '${{ github.sha }}',
    },
    workflow_dispatch: {
      repository: '${{ github.repository }}',
      ref: '${{ github.sha }}',
    },
  };
}

function digest(value) {
  return value.toString(16).padStart(64, '0');
}

function rawJson(value) {
  return `${JSON.stringify(value)}\n`;
}

function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex');
}

function comparisonFor(receipt) {
  return captureFixture({
    spec: {
      executionIdentity: {
        platform: receipt.os,
        architecture: receipt.architecture,
        cpu: 'fixture-cpu',
        runnerImage: receipt.runnerImage,
        runnerImageExpected: receipt.runnerImage,
        nodeVersion: `v${receipt.nodeVersion}`,
        bunVersion: receipt.bunVersion,
        hyperfineVersion: receipt.tools.hyperfine,
      },
      subjects: {
        reference: {
          commit: BASE_SHA,
          packageSha256: digest(801),
          lockSha256: digest(802),
          upstreamAuthoritySha256: digest(803),
        },
        candidate: {
          commit: HEAD_SHA,
          packageSha256: digest(804),
          lockSha256: digest(805),
          upstreamAuthoritySha256: digest(806),
        },
      },
    },
  });
}

function rebindReceipt(artifact) {
  artifact.tierBReceiptRaw = rawJson(artifact.receipt);
  artifact.tierBReceiptSha256 = sha256Bytes(artifact.tierBReceiptRaw);
  if (artifact.manifest) {
    artifact.manifest.tierBReceiptSha256 = artifact.tierBReceiptSha256;
  }
}

function runtimeOs(authority) {
  const runner = authority.matrix.platform || authority.matrix.os;
  if (runner === 'linux' || runner.startsWith('ubuntu')) return 'linux';
  if (runner === 'macos' || runner.startsWith('macos')) return 'macos';
  return 'windows';
}

function pairedManifest(hostedContract, event, tierBReceiptSha256, comparisonSha256) {
  const checkouts = Object.fromEntries(
    hostedContract.executionSubject.performanceProfile.checkouts.map(checkout => [
      checkout.id,
      checkout,
    ])
  );
  return {
    schemaVersion: hostedContract.evidenceBinding.pairedManifest.schemaVersion,
    bootstrap: { repository: event.canonicalRepository, sha: checkouts.bootstrap.ref },
    harness: { repository: event.canonicalRepository, sha: checkouts.harness.ref },
    reference: { ...event.base },
    candidate: { ...event.head },
    tierBReceiptSha256,
    comparisonSha256,
  };
}

function joinFixture() {
  const hostedContract = loadJson('config/phase43-hosted-ci-contract.json');
  const toolchainAuthority = loadJson('config/phase43-toolchain-authority.json');
  const topology = deriveEvidenceTopology(hostedContract, toolchainAuthority);
  const event = {
    name: 'pull_request',
    canonicalRepository: REPOSITORY,
    base: { repository: REPOSITORY, sha: BASE_SHA },
    head: { repository: REPOSITORY, sha: HEAD_SHA },
  };
  const runs = topology.cycle.workflows.map((workflow, index) => ({
    workflow: workflow.path,
    runId: 1_000 + index,
    attempt: 1,
    event: event.name,
    headSha: event.head.sha,
  }));
  const runByWorkflow = new Map(runs.map(run => [run.workflow, run]));
  const tierA = topology.tierAJobs.map((job, index) => ({
    schemaVersion: hostedContract.runtimeReceipts.schemaVersion,
    workflow: job.workflow,
    jobId: 10_000 + index,
    runId: runByWorkflow.get(job.workflow).runId,
    attempt: 1,
    job: job.job,
    runnerId: 20_000 + index,
    runnerName: `GitHub Actions ${index}`,
    runnerGroupId: 1,
    runnerGroupName: 'GitHub Actions',
    runnerLabels: ['hosted'],
  }));
  const artifacts = topology.runtimeArtifacts.map((artifact, index) => {
    const authority = toolchainAuthority.runtimeSubjects[artifact.subject];
    const run = runByWorkflow.get(artifact.workflow);
    const os = runtimeOs(authority);
    const receipt = {
      schemaVersion: hostedContract.runtimeReceipts.schemaVersion,
      subject: artifact.subject,
      event: event.name,
      runId: run.runId,
      attempt: run.attempt,
      os,
      osVersion: 'fixture-os-version',
      architecture: 'x64',
      runnerImage: `${os}:fixture-os-version:fixture-runner`,
      hostedImageName: null,
      hostedImageVersion: null,
      nodeVersion: `${authority.nodeMajor}.1.0`,
      bunVersion: toolchainAuthority.bun.version,
      tools: Object.fromEntries(
        authority.requiredTools.map(tool => [tool, toolchainAuthority.runtimeTools[tool].version])
      ),
      containers: {},
    };
    const tierBReceiptRaw = rawJson(receipt);
    const tierBReceiptSha256 = sha256Bytes(tierBReceiptRaw);
    const comparison = artifact.kind === 'paired' ? comparisonFor(receipt) : null;
    const comparisonRaw = comparison === null ? null : rawJson(comparison);
    const comparisonSha256 = comparisonRaw === null ? null : sha256Bytes(comparisonRaw);
    return {
      artifactId: 30_000 + index,
      name: artifact.name,
      workflow: artifact.workflow,
      runId: run.runId,
      headSha: event.head.sha,
      archiveSha256: digest(index + 201),
      tierBReceiptSha256,
      receipt,
      tierBReceiptRaw,
      manifest:
        artifact.kind === 'paired'
          ? pairedManifest(hostedContract, event, tierBReceiptSha256, comparisonSha256)
          : null,
      comparisonSha256,
      comparison,
      comparisonRaw,
    };
  });
  return { hostedContract, toolchainAuthority, event, runs, tierA, artifacts };
}

describe('hosted evidence binding', () => {
  test('rejects pull-request subject expressions reused for push', () => {
    const policies = eventSubjectPolicies();
    expect(validateEventSubjectPolicies(policies)).toBe(policies);

    policies.push = { ...policies.pull_request };

    expect(() => validateEventSubjectPolicies(policies)).toThrow(
      'push event subject authority'
    );
  });

  test('denies blocking paired authority to fork pull-request heads', () => {
    expect(
      classifyPairedPerformanceAuthority({
        canonicalRepository: 'chudeemeke/get-stuff-done',
        event: 'pull_request',
        headRepository: 'contributor/get-stuff-done',
      })
    ).toEqual({
      authority: 'none',
      reason: 'fork_head_not_authorized',
    });
  });

  test('rejects check names or PR-side workflow definitions as authority', () => {
    const policy = {
      checkNames: 'claim-only',
      prWorkflowDefinitions: 'claim-only',
      mergeEvidence: 'owner-run-collector',
      collectorActivationGate: 'plan-11aj-owner-authorization',
    };
    expect(validateEvidenceAuthorityPolicy(policy)).toBe(policy);

    policy.checkNames = 'authority';

    expect(() => validateEvidenceAuthorityPolicy(policy)).toThrow(
      'evidence authority policy'
    );
  });

  test('derives the current evidence transport topology without timeless count constants', () => {
    const hostedContract = loadJson('config/phase43-hosted-ci-contract.json');
    const toolchainAuthority = loadJson('config/phase43-toolchain-authority.json');
    const topology = deriveEvidenceTopology(hostedContract, toolchainAuthority);

    expect(validateEvidenceBindingPolicy(hostedContract.evidenceBinding)).toBe(
      hostedContract.evidenceBinding
    );
    expect(topology.cycle).toEqual({
      event: 'pull_request',
      requiredAttempt: 1,
      workflows: hostedContract.workflows.map(workflow => ({
        name: workflow.name,
        path: workflow.path,
      })),
    });
    expect(topology.tierAJobs).toHaveLength(39);
    expect(topology.runtimeArtifacts).toHaveLength(21);
    expect(topology.runtimeArtifacts.filter(artifact => artifact.kind === 'standalone')).toHaveLength(
      18
    );
    expect(topology.runtimeArtifacts.filter(artifact => artifact.kind === 'paired')).toHaveLength(3);
    expect(new Set(topology.tierAJobs.map(job => `${job.workflow}\0${job.job}`)).size).toBe(39);
    expect(new Set(topology.runtimeArtifacts.map(artifact => artifact.name)).size).toBe(21);
    expect(
      topology.runtimeArtifacts
        .filter(artifact => artifact.kind === 'paired')
        .map(artifact => artifact.subject)
        .sort()
    ).toEqual(['ci-perf-linux', 'ci-perf-macos', 'ci-perf-windows']);

    const expandedContract = structuredClone(hostedContract);
    expandedContract.workflows[0].requiredJobs.push('Future Evidence Gate');
    expect(deriveEvidenceTopology(expandedContract, toolchainAuthority).tierAJobs).toHaveLength(40);
  });

  test('fails closed on ambiguous runtime jobs and malformed evidence transport policy', () => {
    const hostedContract = loadJson('config/phase43-hosted-ci-contract.json');
    const toolchainAuthority = loadJson('config/phase43-toolchain-authority.json');

    for (const mutate of [
      policy => { policy.requiredAttempt = 2; },
      policy => { policy.standaloneArtifactNameTemplate = 'runtime-receipt'; },
      policy => { policy.pairedManifest.fields = [...policy.pairedManifest.fields, 'jobId']; },
      policy => { policy.unknown = true; },
    ]) {
      const candidate = structuredClone(hostedContract.evidenceBinding);
      mutate(candidate);
      expect(() => validateEvidenceBindingPolicy(candidate)).toThrow('evidence binding policy');
    }

    const missingJob = structuredClone(toolchainAuthority);
    missingJob.runtimeSubjects['ci-perf-linux'].jobName = 'Missing Jobs API Name';
    expect(() => deriveEvidenceTopology(hostedContract, missingJob)).toThrow(
      'runtime subject job identity'
    );

    const duplicateJob = structuredClone(toolchainAuthority);
    duplicateJob.runtimeSubjects['cousin-ubuntu-latest-node-20-pnpm'].jobName =
      duplicateJob.runtimeSubjects['cousin-ubuntu-latest-node-20-npm'].jobName;
    expect(() => deriveEvidenceTopology(hostedContract, duplicateJob)).toThrow(
      'runtime subject job identity'
    );

    const noPaired = structuredClone(hostedContract);
    noPaired.evidenceBinding.pairedJob = 'missing-job';
    expect(() => deriveEvidenceTopology(noPaired, toolchainAuthority)).toThrow(
      'paired runtime subject'
    );
  });

  test('bounds derived workflow, matrix, runtime-subject, and artifact identities', () => {
    const hostedContract = loadJson('config/phase43-hosted-ci-contract.json');
    const toolchainAuthority = loadJson('config/phase43-toolchain-authority.json');
    expect(() =>
      classifyPairedPerformanceAuthority({
        canonicalRepository: 42,
        event: 'pull_request',
        headRepository: 'chudeemeke/get-stuff-done',
      })
    ).toThrow('event identity');

    for (const mutate of [
      contract => { contract.workflows[1].requiredJobMatrices[0] = null; },
      contract => { contract.workflows[1].requiredJobMatrices[0].dimensions = [[]]; },
      contract => {
        contract.workflows[1].requiredJobMatrices[0].dimensions = [
          Array.from({ length: 101 }, (_, index) => index),
        ];
        contract.workflows[1].requiredJobMatrices[0].expectedCount = 101;
      },
      contract => { contract.workflows[1].requiredJobMatrices[0].expectedCount = 17; },
      contract => { contract.workflows[1].requiredJobMatrices[0].template = '{} {} {} {}'; },
      contract => { contract.workflows[1].requiredJobMatrices[0].template = '{}\n{} {}'; },
      contract => { contract.workflows = []; },
      contract => { contract.workflows[0].name = ''; },
      contract => { contract.workflows[0].requiredJobs.push(contract.workflows[0].requiredJobs[0]); },
      contract => { contract.evidenceBinding.pairedWorkflow = '.github/workflows/missing.yml'; },
    ]) {
      const candidate = structuredClone(hostedContract);
      mutate(candidate);
      expect(() => deriveEvidenceTopology(candidate, toolchainAuthority)).toThrow();
    }

    expect(() => deriveEvidenceTopology(hostedContract, { runtimeSubjects: null })).toThrow(
      'runtime subject authority'
    );

    const oversizedArtifact = structuredClone(toolchainAuthority);
    oversizedArtifact.runtimeSubjects = {
      ['a'.repeat(100)]: toolchainAuthority.runtimeSubjects['ci-perf-linux'],
    };
    expect(() => deriveEvidenceTopology(hostedContract, oversizedArtifact)).toThrow(
      'artifact identity'
    );
  });

  test('validates a closed paired manifest without collector-owned identity', () => {
    const fixture = joinFixture();
    const manifest = fixture.artifacts.find(artifact => artifact.manifest).manifest;

    expect(validatePairedBindingManifest(manifest, fixture.hostedContract.evidenceBinding)).toBe(
      manifest
    );
    for (const forbidden of [
      'jobId',
      'runId',
      'attempt',
      'runnerName',
      'artifactId',
      'archiveSha256',
    ]) {
      expect(manifest).not.toHaveProperty(forbidden);
    }

    for (const mutate of [
      candidate => { candidate.jobId = 1; },
      candidate => { candidate.bootstrap.sha = 'main'; },
      candidate => { candidate.reference.repository = '../unsafe'; },
      candidate => { candidate.tierBReceiptSha256 = 'sha256:bad'; },
      candidate => { delete candidate.comparisonSha256; },
    ]) {
      const candidate = structuredClone(manifest);
      mutate(candidate);
      expect(() =>
        validatePairedBindingManifest(candidate, fixture.hostedContract.evidenceBinding)
      ).toThrow('paired binding manifest');
    }
  });

  test('joins one complete same-repository first-attempt evidence cycle', () => {
    const fixture = joinFixture();
    const before = structuredClone(fixture);
    const result = joinHostedEvidence(fixture);

    expect(fixture).toEqual(before);
    expect(result.authority).toEqual({
      authority: 'blocking',
      reason: 'same_repository_head',
    });
    expect(result.runs).toHaveLength(5);
    expect(result.jobs).toHaveLength(39);
    expect(result.runtime).toHaveLength(21);
    expect(result.runtime.filter(binding => binding.kind === 'standalone')).toHaveLength(18);
    expect(result.runtime.filter(binding => binding.kind === 'paired')).toHaveLength(3);
    const paired = result.runtime.find(binding => binding.kind === 'paired');
    expect(paired.tierA.job).toBe('Perf Budget (linux)');
    expect(paired.tierB.subject).toBe('ci-perf-linux');
    expect(paired.artifact.name).toBe('paired-performance-ci-perf-linux');
    expect(paired.paired.manifest.comparisonSha256).toBe(paired.paired.comparisonSha256);
    expect(paired.paired.adjudication.verdict).toBe('pass');
  });

  test('rejects a caller-supplied canonical repository that differs from the contract', () => {
    const fixture = joinFixture();
    const attackerRepository = 'attacker/other-repository';
    fixture.event.canonicalRepository = attackerRepository;
    fixture.event.base.repository = attackerRepository;
    fixture.event.head.repository = attackerRepository;
    for (const artifact of fixture.artifacts.filter(candidate => candidate.manifest)) {
      for (const field of ['bootstrap', 'harness', 'reference', 'candidate']) {
        artifact.manifest[field].repository = attackerRepository;
      }
    }

    expect(() => joinHostedEvidence(fixture)).toThrow(
      'Hosted evidence join canonical repository does not match the contract.'
    );
  });

  test('returns an explicit no-authority outcome for a fork without accepting evidence', () => {
    const fixture = joinFixture();
    fixture.event.head.repository = 'contributor/get-stuff-done';
    fixture.runs = [];
    fixture.tierA = [];
    fixture.artifacts = [];
    expect(joinHostedEvidence(fixture)).toEqual({
      authority: { authority: 'none', reason: 'fork_head_not_authorized' },
      runs: [],
      jobs: [],
      runtime: [],
    });

    fixture.runs.push({ workflow: 'unexpected' });
    expect(() => joinHostedEvidence(fixture)).toThrow('no-authority evidence');
  });

  test('rejects missing, duplicate, extraneous, or cross-cycle runs and Tier A jobs', () => {
    const cases = [
      fixture => { fixture.runs.pop(); },
      fixture => { fixture.runs.push({ ...fixture.runs[0] }); },
      fixture => { fixture.runs[0].unexpected = true; },
      fixture => { fixture.runs[0].workflow = '.github/workflows/missing.yml'; },
      fixture => { fixture.runs[0].runId = 0; },
      fixture => { fixture.runs[0].attempt = 2; },
      fixture => { fixture.runs[0].headSha = BASE_SHA; },
      fixture => { fixture.runs[0].event = 'push'; },
      fixture => { fixture.runs[1].runId = fixture.runs[0].runId; },
      fixture => { fixture.tierA.pop(); },
      fixture => { fixture.tierA.push({ ...fixture.tierA[0], jobId: 999_999 }); },
      fixture => { fixture.tierA[0].unexpected = true; },
      fixture => { fixture.tierA[0].jobId = 0; },
      fixture => { fixture.tierA[0].attempt = 2; },
      fixture => { fixture.tierA[0].runId = fixture.runs[1].runId; },
      fixture => { fixture.tierA[0].job = 'Unexpected Job'; },
      fixture => {
        fixture.tierA[1] = { ...fixture.tierA[0], jobId: fixture.tierA[1].jobId };
      },
      fixture => { fixture.tierA[1].jobId = fixture.tierA[0].jobId; },
    ];
    for (const mutate of cases) {
      const fixture = joinFixture();
      mutate(fixture);
      expect(() => joinHostedEvidence(fixture)).toThrow();
    }
  });

  test('rejects missing, duplicate, extraneous, or mismatched runtime artifacts', () => {
    const cases = [
      fixture => { fixture.artifacts.pop(); },
      fixture => {
        fixture.artifacts.push({ ...fixture.artifacts[0], artifactId: 999_999 });
      },
      fixture => { fixture.artifacts[0].runId = fixture.runs[0].runId; },
      fixture => { fixture.artifacts[0].headSha = BASE_SHA; },
      fixture => { fixture.artifacts[0].archiveSha256 = 'bad'; },
      fixture => { fixture.artifacts[0].receipt.subject = 'other-subject'; },
      fixture => { fixture.artifacts[0].receipt.event = 'push'; },
      fixture => { fixture.artifacts[0].receipt.attempt = 2; },
      fixture => { fixture.artifacts[0].tierBReceiptRaw = '{}'; },
      fixture => { fixture.artifacts[1].artifactId = fixture.artifacts[0].artifactId; },
      fixture => { fixture.artifacts[0].manifest = {}; },
      fixture => { fixture.artifacts[0].comparisonSha256 = digest(999); },
      fixture => {
        const paired = fixture.artifacts.find(artifact => artifact.manifest);
        paired.manifest.tierBReceiptSha256 = digest(999);
      },
      fixture => {
        const paired = fixture.artifacts.find(artifact => artifact.manifest);
        paired.manifest.comparisonSha256 = digest(999);
      },
      fixture => {
        const paired = fixture.artifacts.find(artifact => artifact.manifest);
        paired.manifest.candidate.sha = BASE_SHA;
      },
      fixture => {
        const paired = fixture.artifacts.find(artifact => artifact.manifest);
        paired.comparisonRaw = '{}';
      },
      fixture => {
        const paired = fixture.artifacts.find(artifact => artifact.manifest);
        paired.comparison.verdict = 'fail';
      },
      fixture => {
        const standalone = fixture.artifacts.find(artifact => artifact.manifest === null);
        standalone.comparisonRaw = '{}';
      },
    ];
    for (const mutate of cases) {
      const fixture = joinFixture();
      mutate(fixture);
      expect(() => joinHostedEvidence(fixture)).toThrow();
    }
  });

  test('rejects malformed Tier A runner authority before joining identities', () => {
    const cases = [
      record => { record.schemaVersion = 99; },
      record => { record.workflow = 'unsafe\nworkflow'; },
      record => { record.runId = 0; },
      record => { record.attempt = 0; },
      record => { record.job = 'unsafe\njob'; },
      record => { record.runnerId = 0; },
      record => { record.runnerName = 'unsafe\nrunner'; },
      record => { record.runnerGroupId = 0; },
      record => { record.runnerGroupName = 'unsafe\ngroup'; },
      record => { record.runnerLabels = null; },
      record => { record.runnerLabels = []; },
      record => { record.runnerLabels = Array.from({ length: 51 }, (_, index) => `l${index}`); },
      record => { record.runnerLabels = ['unsafe\nlabel']; },
      record => { record.runnerLabels = ['duplicate', 'duplicate']; },
    ];
    for (const mutate of cases) {
      const fixture = joinFixture();
      mutate(fixture.tierA[0]);
      expect(() => joinHostedEvidence(fixture)).toThrow('Tier A record');
    }
  });

  test('rejects malformed Tier B runtime claims before joining artifacts', () => {
    const tooManyEntries = Object.fromEntries(
      Array.from({ length: 21 }, (_, index) => [`item-${index}`, '1.2.3'])
    );
    const cases = [
      receipt => { receipt.schemaVersion = 99; },
      receipt => { receipt.unexpected = true; },
      receipt => { receipt.subject = '../unsafe'; },
      receipt => { receipt.event = 'unsafe\nevent'; },
      receipt => { receipt.runId = 0; },
      receipt => { receipt.attempt = 0; },
      receipt => { receipt.os = 'freebsd'; },
      receipt => { receipt.osVersion = 'unsafe\nversion'; },
      receipt => { receipt.architecture = 'mips'; },
      receipt => { receipt.runnerImage = 'unbound'; },
      receipt => { receipt.hostedImageName = 'ubuntu24'; },
      receipt => {
        receipt.hostedImageName = 'ubuntu24';
        receipt.hostedImageVersion = '20250720.1.0';
        receipt.nodeVersion = '22';
      },
      receipt => { receipt.nodeVersion = '22'; },
      receipt => { receipt.nodeVersion = '1'.repeat(129); },
      receipt => { receipt.bunVersion = 'latest'; },
      receipt => { receipt.tools = []; },
      receipt => { receipt.tools = tooManyEntries; },
      receipt => { receipt.tools = { '../unsafe': '1.2.3' }; },
      receipt => { receipt.tools = { hyperfine: 'latest' }; },
      receipt => { receipt.containers = []; },
      receipt => { receipt.containers = tooManyEntries; },
      receipt => { receipt.containers = { 'INVALID IMAGE': `sha256:${'a'.repeat(64)}` }; },
      receipt => { receipt.containers = { verdaccio: 'latest' }; },
    ];
    for (const mutate of cases) {
      const fixture = joinFixture();
      mutate(fixture.artifacts[0].receipt);
      rebindReceipt(fixture.artifacts[0]);
      expect(() => joinHostedEvidence(fixture)).toThrow('Tier B runtime receipt authority');
    }
  });

  test('binds Tier B runtime claims to each governed subject authority', () => {
    const cases = [
      fixture => {
        const standalone = fixture.artifacts.find(artifact => artifact.manifest === null);
        standalone.receipt.os = 'macos';
        standalone.receipt.runnerImage =
          'macos:fixture-os-version:fixture-runner';
      },
      fixture => {
        fixture.artifacts.find(artifact => artifact.manifest === null).receipt.nodeVersion = '21.1.0';
      },
      fixture => {
        fixture.artifacts.find(artifact => artifact.manifest === null).receipt.bunVersion = '1.3.4';
      },
      fixture => {
        fixture.artifacts.find(artifact => artifact.manifest === null).receipt.tools = {
          hyperfine: '1.20.0',
        };
      },
      fixture => {
        const paired = fixture.artifacts.find(artifact => artifact.receipt.tools.hyperfine);
        paired.receipt.tools.hyperfine = '1.19.0';
      },
      fixture => {
        fixture.artifacts.find(artifact => artifact.manifest === null).receipt.containers = {
          unknown: `sha256:${'a'.repeat(64)}`,
        };
      },
      fixture => {
        fixture.artifacts.find(artifact => artifact.manifest === null).receipt.containers = {
          'verdaccio/verdaccio': `sha256:${'0'.repeat(64)}`,
        };
      },
    ];
    for (const mutate of cases) {
      const fixture = joinFixture();
      mutate(fixture);
      fixture.artifacts.forEach(rebindReceipt);
      expect(() => joinHostedEvidence(fixture)).toThrow('runtime authority');
    }

    const fixture = joinFixture();
    const container = fixture.toolchainAuthority.containers.pins['verdaccio/verdaccio'];
    fixture.artifacts[0].receipt.containers = {
      'verdaccio/verdaccio': container.digest,
    };
    rebindReceipt(fixture.artifacts[0]);
    expect(joinHostedEvidence(fixture).runtime).toHaveLength(21);
  });

  test('rejects malformed join events, no-authority payloads, and paired checkout authority', () => {
    for (const input of [null, {}, { ...joinFixture(), unexpected: true }]) {
      expect(() => joinHostedEvidence(input)).toThrow('join input');
    }
    for (const mutate of [
      fixture => { fixture.event.name = 'push'; },
      fixture => { fixture.event.canonicalRepository = '../unsafe'; },
      fixture => { fixture.event.base.repository = 'other/get-stuff-done'; },
      fixture => { fixture.event.head.sha = 'main'; },
    ]) {
      const fixture = joinFixture();
      mutate(fixture);
      expect(() => joinHostedEvidence(fixture)).toThrow();
    }
    for (const mutate of [
      fixture => { fixture.hostedContract.executionSubject.performanceProfile.checkouts = null; },
      fixture => { fixture.hostedContract.executionSubject.performanceProfile.checkouts.pop(); },
      fixture => {
        fixture.hostedContract.executionSubject.performanceProfile.checkouts[1].id = 'bootstrap';
      },
      fixture => {
        fixture.hostedContract.executionSubject.performanceProfile.checkouts[0].ref = 'main';
      },
    ]) {
      const fixture = joinFixture();
      mutate(fixture);
      expect(() => joinHostedEvidence(fixture)).toThrow('paired checkout authority');
    }

    for (const field of ['tierA', 'artifacts']) {
      const fixture = joinFixture();
      fixture.event.head.repository = 'contributor/get-stuff-done';
      fixture.runs = [];
      fixture.tierA = [];
      fixture.artifacts = [];
      fixture[field] = null;
      expect(() => joinHostedEvidence(fixture)).toThrow('no-authority evidence');
    }
  });

  test('fails closed on malformed event, repository, and authority inputs', () => {
    for (const policies of [null, [], { pull_request: eventSubjectPolicies().pull_request }]) {
      expect(() => validateEventSubjectPolicies(policies)).toThrow(
        'exact governed event set'
      );
    }

    for (const event of Object.keys(eventSubjectPolicies())) {
      const policies = eventSubjectPolicies();
      policies[event] = { repository: '${{ github.repository }}', ref: 'main' };
      expect(() => validateEventSubjectPolicies(policies)).toThrow(
        `${event} event subject authority`
      );
    }

    const base = {
      canonicalRepository: 'chudeemeke/get-stuff-done',
      event: 'pull_request',
      headRepository: 'chudeemeke/get-stuff-done',
    };
    expect(classifyPairedPerformanceAuthority(base)).toEqual({
      authority: 'blocking',
      reason: 'same_repository_head',
    });
    expect(classifyPairedPerformanceAuthority({ ...base, event: 'push' })).toEqual({
      authority: 'none',
      reason: 'non_pull_request_event',
    });
    for (const input of [
      null,
      { ...base, canonicalRepository: '../unsafe' },
      { ...base, headRepository: '' },
      { ...base, event: 'pull_request_target' },
    ]) {
      expect(() => classifyPairedPerformanceAuthority(input)).toThrow(
        'event identity'
      );
    }

    const authority = {
      checkNames: 'claim-only',
      prWorkflowDefinitions: 'claim-only',
      mergeEvidence: 'owner-run-collector',
      collectorActivationGate: 'plan-11aj-owner-authorization',
    };
    for (const mutate of [
      candidate => { candidate.prWorkflowDefinitions = 'authority'; },
      candidate => { candidate.mergeEvidence = 'check-ui'; },
      candidate => { candidate.extra = true; },
    ]) {
      const candidate = { ...authority };
      mutate(candidate);
      expect(() => validateEvidenceAuthorityPolicy(candidate)).toThrow(
        'evidence authority policy'
      );
    }
  });
});

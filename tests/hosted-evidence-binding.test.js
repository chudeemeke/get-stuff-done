'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const fs = require('fs');
const path = require('path');
const {
  classifyPairedPerformanceAuthority,
  deriveEvidenceTopology,
  validateEvidenceAuthorityPolicy,
  validateEvidenceBindingPolicy,
  validateEventSubjectPolicies,
} = require('../scripts/lib/hosted-evidence-binding');

const PROJECT_ROOT = path.resolve(__dirname, '..');

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

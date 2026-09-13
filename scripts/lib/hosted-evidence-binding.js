'use strict';

const { createHash } = require('crypto');
const { TextDecoder } = require('util');
const { adjudicatePairedComparison } = require('./paired-perf');

const EVENT_SUBJECT_EXPRESSIONS = Object.freeze({
  pull_request: Object.freeze({
    repository: '${{ github.event.pull_request.head.repo.full_name }}',
    ref: '${{ github.event.pull_request.head.sha }}',
  }),
  push: Object.freeze({
    repository: '${{ github.repository }}',
    ref: '${{ github.sha }}',
  }),
  schedule: Object.freeze({
    repository: '${{ github.repository }}',
    ref: '${{ github.sha }}',
  }),
  workflow_dispatch: Object.freeze({
    repository: '${{ github.repository }}',
    ref: '${{ github.sha }}',
  }),
});
const EVIDENCE_BINDING_POLICY_FIELDS = [
  'schemaVersion',
  'authorityEvent',
  'requiredAttempt',
  'standaloneArtifactNameTemplate',
  'pairedArtifactNameTemplate',
  'pairedWorkflow',
  'pairedJob',
  'pairedManifest',
];
const PAIRED_MANIFEST_POLICY_FIELDS = ['schemaVersion', 'fields', 'subjectFields'];
const PAIRED_MANIFEST_FIELDS = [
  'schemaVersion',
  'bootstrap',
  'harness',
  'reference',
  'candidate',
  'tierBReceiptSha256',
  'comparisonSha256',
];
const PAIRED_SUBJECT_FIELDS = ['repository', 'sha'];
const RUNTIME_SUBJECT_FIELDS = [
  'workflow',
  'job',
  'jobName',
  'matrix',
  'nodeMajor',
  'requiredTools',
];
const TIER_B_RECEIPT_FIELDS = [
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
];
const MAX_EVIDENCE_IDENTITIES = 100;
const MAX_RAW_EVIDENCE_BYTES = 1024 * 1024;
const EVENT_FIELDS = ['name', 'canonicalRepository', 'base', 'head'];
const RUN_FIELDS = ['workflow', 'runId', 'attempt', 'event', 'headSha'];
const ARTIFACT_FIELDS = [
  'artifactId',
  'name',
  'workflow',
  'runId',
  'headSha',
  'archiveSha256',
  'tierBReceiptSha256',
  'receipt',
  'tierBReceiptRaw',
  'manifest',
  'comparisonSha256',
  'comparison',
  'comparisonRaw',
];
const JOIN_INPUT_FIELDS = [
  'hostedContract',
  'toolchainAuthority',
  'event',
  'runs',
  'tierA',
  'artifacts',
];

function hasExactFields(value, fields) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === fields.length &&
    fields.every(field => Object.prototype.hasOwnProperty.call(value, field))
  );
}

function validateEventSubjectPolicies(policies) {
  const events = Object.keys(EVENT_SUBJECT_EXPRESSIONS);
  if (!hasExactFields(policies, events)) {
    throw new Error('Hosted event subject authority must define the exact governed event set.');
  }

  for (const event of events) {
    const policy = Reflect.get(policies, event);
    const expected = Reflect.get(EVENT_SUBJECT_EXPRESSIONS, event);
    if (
      !hasExactFields(policy, ['repository', 'ref']) ||
      policy.repository !== expected.repository ||
      policy.ref !== expected.ref
    ) {
      throw new Error(`Hosted ${event} event subject authority is invalid.`);
    }
  }
  return policies;
}

function isCanonicalRepository(value) {
  if (typeof value !== 'string' || value.length > 201) return false;
  const segments = value.split('/');
  return (
    segments.length === 2 &&
    segments.every(
      segment =>
        segment.length <= 100 &&
        segment !== '.' &&
        segment !== '..' &&
        /^[A-Za-z0-9_.-]+$/.test(segment)
    )
  );
}

function classifyPairedPerformanceAuthority(input) {
  if (
    !input ||
    !isCanonicalRepository(input.canonicalRepository) ||
    !isCanonicalRepository(input.headRepository) ||
    !Object.prototype.hasOwnProperty.call(EVENT_SUBJECT_EXPRESSIONS, input.event)
  ) {
    throw new Error('Paired performance event identity is invalid.');
  }
  if (input.event !== 'pull_request') {
    return { authority: 'none', reason: 'non_pull_request_event' };
  }
  if (input.headRepository !== input.canonicalRepository) {
    return { authority: 'none', reason: 'fork_head_not_authorized' };
  }
  return { authority: 'blocking', reason: 'same_repository_head' };
}

function validateEvidenceAuthorityPolicy(policy) {
  if (
    !hasExactFields(policy, [
      'checkNames',
      'prWorkflowDefinitions',
      'mergeEvidence',
      'collectorActivationGate',
    ]) ||
    policy.checkNames !== 'claim-only' ||
    policy.prWorkflowDefinitions !== 'claim-only' ||
    policy.mergeEvidence !== 'owner-run-collector' ||
    policy.collectorActivationGate !== 'plan-11aj-owner-authorization'
  ) {
    throw new Error('Hosted evidence authority policy is invalid.');
  }
  return policy;
}

function isBoundedPrintable(value, maximumLength = 200) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maximumLength &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function isBoundedToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(value);
}

function isArtifactTemplate(value) {
  return (
    typeof value === 'string' &&
    value.length <= 100 &&
    (value.match(/\{\}/g) || []).length === 1 &&
    /^[A-Za-z0-9._{}-]+$/.test(value)
  );
}

function validateEvidenceBindingPolicy(policy) {
  if (
    !hasExactFields(policy, EVIDENCE_BINDING_POLICY_FIELDS) ||
    policy.schemaVersion !== 1 ||
    policy.authorityEvent !== 'pull_request' ||
    policy.requiredAttempt !== 1 ||
    !isArtifactTemplate(policy.standaloneArtifactNameTemplate) ||
    !isArtifactTemplate(policy.pairedArtifactNameTemplate) ||
    !isBoundedPrintable(policy.pairedWorkflow) ||
    !isBoundedToken(policy.pairedJob) ||
    !hasExactFields(policy.pairedManifest, PAIRED_MANIFEST_POLICY_FIELDS) ||
    policy.pairedManifest.schemaVersion !== 1 ||
    JSON.stringify(policy.pairedManifest.fields) !== JSON.stringify(PAIRED_MANIFEST_FIELDS) ||
    JSON.stringify(policy.pairedManifest.subjectFields) !==
      JSON.stringify(PAIRED_SUBJECT_FIELDS)
  ) {
    throw new Error('Hosted evidence binding policy is invalid.');
  }
  return policy;
}

function expandMatrixJobs(matrix) {
  if (
    !matrix ||
    typeof matrix.template !== 'string' ||
    !Array.isArray(matrix.dimensions) ||
    !Number.isSafeInteger(matrix.expectedCount) ||
    matrix.expectedCount < 1
  ) {
    throw new Error('Hosted evidence workflow matrix topology is invalid.');
  }
  let combinations = [[]];
  for (const dimension of matrix.dimensions) {
    if (!Array.isArray(dimension) || dimension.length === 0) {
      throw new Error('Hosted evidence workflow matrix topology is invalid.');
    }
    combinations = combinations.flatMap(combination =>
      dimension.map(value => [...combination, String(value)])
    );
    if (combinations.length > MAX_EVIDENCE_IDENTITIES) {
      throw new Error('Hosted evidence workflow matrix topology exceeds supported bounds.');
    }
  }
  if (combinations.length !== matrix.expectedCount) {
    throw new Error('Hosted evidence workflow matrix topology is invalid.');
  }
  return combinations.map(combination => {
    let jobName = matrix.template;
    for (const value of combination) jobName = jobName.replace('{}', value);
    if (jobName.includes('{}') || !isBoundedPrintable(jobName)) {
      throw new Error('Hosted evidence workflow matrix topology is invalid.');
    }
    return jobName;
  });
}

function deriveEvidenceTopology(hostedContract, toolchainAuthority) {
  const policy = validateEvidenceBindingPolicy(hostedContract?.evidenceBinding);
  if (
    !Array.isArray(hostedContract?.workflows) ||
    hostedContract.workflows.length === 0 ||
    hostedContract.workflows.length > 20
  ) {
    throw new Error('Hosted evidence workflow topology is invalid.');
  }

  const cycleWorkflows = [];
  const tierAJobs = [];
  const jobsByWorkflow = new Map();
  for (const workflow of hostedContract.workflows) {
    if (!isBoundedPrintable(workflow?.name) || !isBoundedPrintable(workflow?.path)) {
      throw new Error('Hosted evidence workflow topology is invalid.');
    }
    const requiredJobs = Array.isArray(workflow.requiredJobs) ? workflow.requiredJobs : [];
    const matrices = Array.isArray(workflow.requiredJobMatrices)
      ? workflow.requiredJobMatrices
      : [];
    const jobs = [...requiredJobs, ...matrices.flatMap(expandMatrixJobs)];
    if (
      jobs.length === 0 ||
      jobs.length > MAX_EVIDENCE_IDENTITIES ||
      jobs.some(job => !isBoundedPrintable(job)) ||
      new Set(jobs).size !== jobs.length ||
      jobsByWorkflow.has(workflow.path)
    ) {
      throw new Error('Hosted evidence workflow job topology is invalid.');
    }
    jobsByWorkflow.set(workflow.path, new Set(jobs));
    cycleWorkflows.push({ name: workflow.name, path: workflow.path });
    tierAJobs.push(...jobs.map(job => ({ workflow: workflow.path, job })));
  }
  if (!jobsByWorkflow.has(policy.pairedWorkflow)) {
    throw new Error('Hosted evidence paired runtime subject authority is invalid.');
  }

  const runtimeSubjects = toolchainAuthority?.runtimeSubjects;
  const subjectEntries =
    runtimeSubjects && typeof runtimeSubjects === 'object' && !Array.isArray(runtimeSubjects)
      ? Object.entries(runtimeSubjects)
      : [];
  if (subjectEntries.length === 0 || subjectEntries.length > MAX_EVIDENCE_IDENTITIES) {
    throw new Error('Hosted evidence runtime subject authority is invalid.');
  }

  const runtimeArtifacts = [];
  const boundJobs = new Set();
  const artifactNames = new Set();
  for (const [subject, authority] of subjectEntries) {
    const jobs = jobsByWorkflow.get(authority?.workflow);
    const jobIdentity = `${authority?.workflow}\0${authority?.jobName}`;
    if (
      !isBoundedToken(subject) ||
      !hasExactFields(authority, RUNTIME_SUBJECT_FIELDS) ||
      !isBoundedToken(authority.job) ||
      !isBoundedPrintable(authority.jobName) ||
      !jobs?.has(authority.jobName) ||
      boundJobs.has(jobIdentity)
    ) {
      throw new Error('Hosted evidence runtime subject job identity is invalid or duplicated.');
    }
    boundJobs.add(jobIdentity);
    const kind =
      authority.workflow === policy.pairedWorkflow && authority.job === policy.pairedJob
        ? 'paired'
        : 'standalone';
    const template =
      kind === 'paired'
        ? policy.pairedArtifactNameTemplate
        : policy.standaloneArtifactNameTemplate;
    const name = template.replace('{}', subject);
    if (!isBoundedToken(name) || artifactNames.has(name)) {
      throw new Error('Hosted evidence artifact identity is invalid or duplicated.');
    }
    artifactNames.add(name);
    runtimeArtifacts.push({
      kind,
      name,
      subject,
      workflow: authority.workflow,
      job: authority.jobName,
    });
  }
  if (!runtimeArtifacts.some(artifact => artifact.kind === 'paired')) {
    throw new Error('Hosted evidence paired runtime subject authority is invalid.');
  }

  return {
    cycle: {
      event: policy.authorityEvent,
      requiredAttempt: policy.requiredAttempt,
      workflows: cycleWorkflows,
    },
    tierAJobs,
    runtimeArtifacts,
  };
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isCommitSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
}

function isSha256(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

function parseRawEvidence(value, label) {
  if (typeof value !== 'string' && !Buffer.isBuffer(value) && !ArrayBuffer.isView(value)) {
    throw new Error(`${label} raw bytes are invalid.`);
  }
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  if (bytes.length === 0 || bytes.length > MAX_RAW_EVIDENCE_BYTES) {
    throw new Error(`${label} raw bytes are invalid.`);
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} raw bytes are not valid UTF-8.`);
  }
  try {
    return { bytes, parsed: JSON.parse(text) };
  } catch {
    throw new Error(`${label} raw bytes are not valid JSON.`);
  }
}

function rawEvidenceMatchesParsed(raw, parsed) {
  return JSON.stringify(raw) === JSON.stringify(parsed);
}

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function isResolvedSemver(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 128) return false;
  // The bounded input makes the optional prerelease/build groups non-amplifying.
  // eslint-disable-next-line security/detect-unsafe-regex
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value);
}

function validateSubjectIdentity(subject) {
  if (
    !hasExactFields(subject, PAIRED_SUBJECT_FIELDS) ||
    !isCanonicalRepository(subject.repository) ||
    !isCommitSha(subject.sha)
  ) {
    throw new Error('Hosted paired binding manifest subject is invalid.');
  }
  return subject;
}

function validatePairedBindingManifest(manifest, policy) {
  validateEvidenceBindingPolicy(policy);
  if (
    !hasExactFields(manifest, policy.pairedManifest.fields) ||
    manifest.schemaVersion !== policy.pairedManifest.schemaVersion
  ) {
    throw new Error('Hosted paired binding manifest is invalid.');
  }
  for (const field of ['bootstrap', 'harness', 'reference', 'candidate']) {
    validateSubjectIdentity(Reflect.get(manifest, field));
  }
  if (!isSha256(manifest.tierBReceiptSha256) || !isSha256(manifest.comparisonSha256)) {
    throw new Error('Hosted paired binding manifest digest is invalid.');
  }
  return manifest;
}

function validateJoinEvent(event, policy, contractRepository) {
  if (
    !hasExactFields(event, EVENT_FIELDS) ||
    event.name !== policy.authorityEvent ||
    !isCanonicalRepository(event.canonicalRepository)
  ) {
    throw new Error('Hosted evidence join event is invalid.');
  }
  if (event.canonicalRepository !== contractRepository) {
    throw new Error('Hosted evidence join canonical repository does not match the contract.');
  }
  validateSubjectIdentity(event.base);
  validateSubjectIdentity(event.head);
  if (event.base.repository !== event.canonicalRepository) {
    throw new Error('Hosted evidence join base repository is not canonical.');
  }
  return classifyPairedPerformanceAuthority({
    canonicalRepository: event.canonicalRepository,
    event: event.name,
    headRepository: event.head.repository,
  });
}

function validateTierARecord(record, contract) {
  const fields = ['workflow', ...contract.runtimeReceipts.tierAFields];
  if (
    !hasExactFields(record, fields) ||
    record.schemaVersion !== contract.runtimeReceipts.schemaVersion ||
    !isBoundedPrintable(record.workflow) ||
    !isPositiveSafeInteger(record.jobId) ||
    !isPositiveSafeInteger(record.runId) ||
    !isPositiveSafeInteger(record.attempt) ||
    !isBoundedPrintable(record.job) ||
    !isPositiveSafeInteger(record.runnerId) ||
    !isBoundedPrintable(record.runnerName) ||
    !isPositiveSafeInteger(record.runnerGroupId) ||
    !isBoundedPrintable(record.runnerGroupName) ||
    !Array.isArray(record.runnerLabels) ||
    record.runnerLabels.length === 0 ||
    record.runnerLabels.length > 50 ||
    record.runnerLabels.some(label => !isBoundedPrintable(label, 100)) ||
    new Set(record.runnerLabels).size !== record.runnerLabels.length
  ) {
    throw new Error('Hosted evidence join Tier A record is invalid.');
  }
  return record;
}

function isClosedVersionMap(value, validator) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length <= 20 &&
    Object.entries(value).every(([key, item]) => validator(key, item))
  );
}

function validateTierBRuntimeReceipt(record, contract) {
  const hostedImageAbsent =
    record?.hostedImageName === null && record?.hostedImageVersion === null;
  const hostedImagePresent =
    isBoundedPrintable(record?.hostedImageName, 100) &&
    isBoundedPrintable(record?.hostedImageVersion, 100);
  if (
    !contract?.runtimeReceipts ||
    !Number.isSafeInteger(contract.runtimeReceipts.schemaVersion) ||
    JSON.stringify(contract.runtimeReceipts.tierBFields) !==
      JSON.stringify(TIER_B_RECEIPT_FIELDS) ||
    !contract?.executionSubject?.eventSubjects ||
    !hasExactFields(record, contract.runtimeReceipts.tierBFields) ||
    record.schemaVersion !== contract.runtimeReceipts.schemaVersion ||
    !isBoundedToken(record.subject) ||
    !Object.prototype.hasOwnProperty.call(
      contract.executionSubject.eventSubjects,
      record.event
    ) ||
    !isPositiveSafeInteger(record.runId) ||
    !isPositiveSafeInteger(record.attempt) ||
    !['linux', 'macos', 'windows'].includes(record.os) ||
    !isBoundedPrintable(record.osVersion, 100) ||
    !['x64', 'arm64', 'x86'].includes(record.architecture) ||
    !isBoundedPrintable(record.runnerImage, 300) ||
    ['unknown', 'unavailable', 'none', 'n/a'].includes(record.runnerImage.toLowerCase()) ||
    !record.runnerImage.startsWith(`${record.os}:${record.osVersion}:`) ||
    (!hostedImageAbsent && !hostedImagePresent) ||
    !isResolvedSemver(record.nodeVersion) ||
    !isResolvedSemver(record.bunVersion) ||
    !isClosedVersionMap(
      record.tools,
      (tool, version) => isBoundedToken(tool) && isResolvedSemver(version)
    ) ||
    !isClosedVersionMap(
      record.containers,
      (image, digest) =>
        /^[a-z0-9._/-]{1,200}$/.test(image) && /^sha256:[0-9a-f]{64}$/.test(digest)
    )
  ) {
    throw new Error('Hosted Tier B runtime receipt authority is invalid.');
  }
  return record;
}

function expectedRuntimeOs(authority) {
  const runner = authority?.matrix?.platform || authority?.matrix?.os;
  if (runner === 'linux' || runner?.startsWith('ubuntu')) return 'linux';
  if (runner === 'macos' || runner?.startsWith('macos')) return 'macos';
  if (runner === 'windows' || runner?.startsWith('windows')) return 'windows';
  return null;
}

function validateRuntimeAuthority(record, subject, toolchainAuthority) {
  const authority = Reflect.get(toolchainAuthority?.runtimeSubjects || {}, subject);
  const requiredTools = Array.isArray(authority?.requiredTools)
    ? [...authority.requiredTools].sort()
    : [];
  const actualTools = Object.keys(record.tools).sort();
  const nodeMajor = Number(record.nodeVersion.slice(0, record.nodeVersion.indexOf('.')));
  const toolsMatch =
    JSON.stringify(actualTools) === JSON.stringify(requiredTools) &&
    requiredTools.every(
      tool =>
        Reflect.get(record.tools, tool) ===
        Reflect.get(toolchainAuthority?.runtimeTools || {}, tool)?.version
    );
  const containersMatch = Object.entries(record.containers).every(
    ([image, digest]) =>
      Reflect.get(toolchainAuthority?.containers?.pins || {}, image)?.digest === digest
  );
  if (
    !authority ||
    record.os !== expectedRuntimeOs(authority) ||
    nodeMajor !== authority.nodeMajor ||
    record.bunVersion !== toolchainAuthority?.bun?.version ||
    !toolsMatch ||
    !containersMatch
  ) {
    throw new Error('Hosted Tier B runtime authority does not match its subject.');
  }
  return record;
}

function validateRunSet(runs, topology, event) {
  if (!Array.isArray(runs) || runs.length !== topology.cycle.workflows.length) {
    throw new Error('Hosted evidence join run cardinality is invalid.');
  }
  const expectedWorkflows = new Set(topology.cycle.workflows.map(workflow => workflow.path));
  const byWorkflow = new Map();
  const runIds = new Set();
  for (const run of runs) {
    if (
      !hasExactFields(run, RUN_FIELDS) ||
      !expectedWorkflows.has(run.workflow) ||
      byWorkflow.has(run.workflow) ||
      !isPositiveSafeInteger(run.runId) ||
      runIds.has(run.runId) ||
      run.attempt !== topology.cycle.requiredAttempt ||
      run.event !== topology.cycle.event ||
      run.headSha !== event.head.sha
    ) {
      throw new Error('Hosted evidence join run identity is invalid or duplicated.');
    }
    byWorkflow.set(run.workflow, run);
    runIds.add(run.runId);
  }
  return byWorkflow;
}

function validateTierASet(records, topology, runsByWorkflow, contract) {
  if (!Array.isArray(records) || records.length !== topology.tierAJobs.length) {
    throw new Error('Hosted evidence join Tier A cardinality is invalid.');
  }
  const expected = new Set(
    topology.tierAJobs.map(record => `${record.workflow}\0${record.job}`)
  );
  const byIdentity = new Map();
  const jobIds = new Set();
  for (const record of records) {
    validateTierARecord(record, contract);
    const identity = `${record.workflow}\0${record.job}`;
    const run = runsByWorkflow.get(record.workflow);
    if (
      !expected.has(identity) ||
      byIdentity.has(identity) ||
      jobIds.has(record.jobId) ||
      record.runId !== run?.runId ||
      record.attempt !== run.attempt
    ) {
      throw new Error('Hosted evidence join Tier A identity is invalid or duplicated.');
    }
    byIdentity.set(identity, record);
    jobIds.add(record.jobId);
  }
  return byIdentity;
}

function expectedPairedSubjects(contract, event) {
  const checkouts = contract?.executionSubject?.performanceProfile?.checkouts;
  if (!Array.isArray(checkouts) || checkouts.length !== 4) {
    throw new Error('Hosted evidence join paired checkout authority is invalid.');
  }
  const byId = new Map(checkouts.map(checkout => [checkout?.id, checkout]));
  if (byId.size !== 4 || !['bootstrap', 'harness', 'reference', 'candidate'].every(id => byId.has(id))) {
    throw new Error('Hosted evidence join paired checkout authority is invalid.');
  }
  const bootstrap = byId.get('bootstrap');
  const harness = byId.get('harness');
  if (!isCommitSha(bootstrap.ref) || !isCommitSha(harness.ref)) {
    throw new Error('Hosted evidence join paired checkout authority is invalid.');
  }
  return {
    bootstrap: { repository: contract.repository, sha: bootstrap.ref },
    harness: { repository: contract.repository, sha: harness.ref },
    reference: event.base,
    candidate: event.head,
  };
}

function subjectsEqual(actual, expected) {
  return actual.repository === expected.repository && actual.sha === expected.sha;
}

function validateArtifactRecord(record) {
  if (
    !hasExactFields(record, ARTIFACT_FIELDS) ||
    !isPositiveSafeInteger(record.artifactId) ||
    !isBoundedToken(record.name) ||
    !isBoundedPrintable(record.workflow) ||
    !isPositiveSafeInteger(record.runId) ||
    !isCommitSha(record.headSha) ||
    !isSha256(record.archiveSha256) ||
    !isSha256(record.tierBReceiptSha256)
  ) {
    throw new Error('Hosted evidence join artifact record is invalid.');
  }
  return record;
}

function validatePairedRuntimeIdentity(comparison, receipt) {
  const identity = comparison.executionIdentity;
  if (
    identity.platform !== receipt.os ||
    identity.architecture !== receipt.architecture ||
    identity.runnerImage !== receipt.runnerImage ||
    identity.runnerImageExpected !== receipt.runnerImage ||
    identity.nodeVersion.replace(/^v/, '') !== receipt.nodeVersion ||
    identity.bunVersion !== receipt.bunVersion ||
    identity.hyperfineVersion !== receipt.tools.hyperfine
  ) {
    throw new Error('Hosted paired comparison runtime identity is invalid.');
  }
}

function validatePairedArtifact(record, expectedSubjects, policy, receipt) {
  validatePairedBindingManifest(record.manifest, policy);
  const rawComparison = parseRawEvidence(record.comparisonRaw, 'Hosted paired comparison');
  let adjudication;
  try {
    adjudication = adjudicatePairedComparison(rawComparison.parsed);
  } catch {
    throw new Error('Hosted paired comparison semantics are invalid.');
  }
  if (
    !isSha256(record.comparisonSha256) ||
    !rawEvidenceMatchesParsed(rawComparison.parsed, record.comparison) ||
    sha256Bytes(rawComparison.bytes) !== record.comparisonSha256 ||
    record.manifest.tierBReceiptSha256 !== record.tierBReceiptSha256 ||
    record.manifest.comparisonSha256 !== record.comparisonSha256 ||
    record.comparison.subjects.reference.commit !== expectedSubjects.reference.sha ||
    record.comparison.subjects.candidate.commit !== expectedSubjects.candidate.sha ||
    !['bootstrap', 'harness', 'reference', 'candidate'].every(field =>
      subjectsEqual(Reflect.get(record.manifest, field), Reflect.get(expectedSubjects, field))
    )
  ) {
    throw new Error('Hosted paired evidence binding is invalid.');
  }
  validatePairedRuntimeIdentity(record.comparison, receipt);
  return adjudication;
}

function validateArtifactSet(
  records,
  topology,
  runsByWorkflow,
  tierAByIdentity,
  contract,
  toolchainAuthority,
  event
) {
  if (!Array.isArray(records) || records.length !== topology.runtimeArtifacts.length) {
    throw new Error('Hosted evidence join artifact cardinality is invalid.');
  }
  const expectedByName = new Map(topology.runtimeArtifacts.map(record => [record.name, record]));
  const expectedSubjects = expectedPairedSubjects(contract, event);
  const artifactIds = new Set();
  const seenNames = new Set();
  const bindings = new Map();
  for (const record of records) {
    validateArtifactRecord(record);
    const expected = expectedByName.get(record.name);
    const run = runsByWorkflow.get(record.workflow);
    if (
      !expected ||
      seenNames.has(record.name) ||
      artifactIds.has(record.artifactId) ||
      record.workflow !== expected.workflow ||
      record.runId !== run?.runId ||
      record.headSha !== event.head.sha
    ) {
      throw new Error('Hosted evidence join artifact identity is invalid or duplicated.');
    }
    const rawReceipt = parseRawEvidence(record.tierBReceiptRaw, 'Hosted Tier B runtime receipt');
    if (
      !rawEvidenceMatchesParsed(rawReceipt.parsed, record.receipt) ||
      sha256Bytes(rawReceipt.bytes) !== record.tierBReceiptSha256
    ) {
      throw new Error('Hosted Tier B runtime receipt digest is invalid.');
    }
    validateTierBRuntimeReceipt(record.receipt, contract);
    validateRuntimeAuthority(record.receipt, expected.subject, toolchainAuthority);
    if (
      record.receipt.subject !== expected.subject ||
      record.receipt.event !== event.name ||
      record.receipt.runId !== run.runId ||
      record.receipt.attempt !== run.attempt
    ) {
      throw new Error('Hosted evidence join Tier B identity is invalid.');
    }
    const tierA = tierAByIdentity.get(`${expected.workflow}\0${expected.job}`);
    let adjudication = null;
    if (expected.kind === 'paired') {
      adjudication = validatePairedArtifact(
        record,
        expectedSubjects,
        contract.evidenceBinding,
        record.receipt
      );
    } else if (
      record.manifest !== null ||
      record.comparisonSha256 !== null ||
      record.comparison !== null ||
      record.comparisonRaw !== null
    ) {
      throw new Error('Hosted standalone runtime artifact contains paired evidence.');
    }
    seenNames.add(record.name);
    artifactIds.add(record.artifactId);
    bindings.set(record.name, {
      subject: expected.subject,
      kind: expected.kind,
      tierA,
      tierB: record.receipt,
      artifact: {
        artifactId: record.artifactId,
        name: record.name,
        workflow: record.workflow,
        runId: record.runId,
        headSha: record.headSha,
        archiveSha256: record.archiveSha256,
        tierBReceiptSha256: record.tierBReceiptSha256,
      },
      paired:
        expected.kind === 'paired'
          ? {
              manifest: record.manifest,
              comparisonSha256: record.comparisonSha256,
              adjudication,
            }
          : null,
    });
  }
  return bindings;
}

function joinHostedEvidence(input) {
  if (!hasExactFields(input, JOIN_INPUT_FIELDS)) {
    throw new Error('Hosted evidence join input is invalid.');
  }
  const topology = deriveEvidenceTopology(input.hostedContract, input.toolchainAuthority);
  const authority = validateJoinEvent(
    input.event,
    input.hostedContract.evidenceBinding,
    input.hostedContract.repository
  );
  if (authority.authority === 'none') {
    if (
      !Array.isArray(input.runs) ||
      !Array.isArray(input.tierA) ||
      !Array.isArray(input.artifacts) ||
      input.runs.length > 0 ||
      input.tierA.length > 0 ||
      input.artifacts.length > 0
    ) {
      throw new Error('Hosted no-authority evidence must be empty.');
    }
    return { authority, runs: [], jobs: [], runtime: [] };
  }

  const runsByWorkflow = validateRunSet(input.runs, topology, input.event);
  const tierAByIdentity = validateTierASet(
    input.tierA,
    topology,
    runsByWorkflow,
    input.hostedContract
  );
  const artifactsByName = validateArtifactSet(
    input.artifacts,
    topology,
    runsByWorkflow,
    tierAByIdentity,
    input.hostedContract,
    input.toolchainAuthority,
    input.event
  );
  return {
    authority,
    runs: topology.cycle.workflows.map(workflow => runsByWorkflow.get(workflow.path)),
    jobs: topology.tierAJobs.map(job => tierAByIdentity.get(`${job.workflow}\0${job.job}`)),
    runtime: topology.runtimeArtifacts.map(artifact => artifactsByName.get(artifact.name)),
  };
}

module.exports = {
  classifyPairedPerformanceAuthority,
  deriveEvidenceTopology,
  isResolvedSemver,
  joinHostedEvidence,
  validateEvidenceAuthorityPolicy,
  validateEvidenceBindingPolicy,
  validateEventSubjectPolicies,
  validatePairedBindingManifest,
  validateTierBRuntimeReceipt,
};

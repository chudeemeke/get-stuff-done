'use strict';

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
const MAX_EVIDENCE_IDENTITIES = 100;

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
  if (typeof value !== 'string') return false;
  const segments = value.split('/');
  return (
    segments.length === 2 &&
    segments.every(
      segment =>
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
    !hasExactFields(policy, ['checkNames', 'prWorkflowDefinitions', 'mergeEvidence']) ||
    policy.checkNames !== 'claim-only' ||
    policy.prWorkflowDefinitions !== 'claim-only' ||
    policy.mergeEvidence !== 'owner-run-collector'
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

module.exports = {
  classifyPairedPerformanceAuthority,
  deriveEvidenceTopology,
  validateEvidenceAuthorityPolicy,
  validateEvidenceBindingPolicy,
  validateEventSubjectPolicies,
};

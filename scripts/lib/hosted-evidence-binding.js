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

module.exports = {
  classifyPairedPerformanceAuthority,
  validateEvidenceAuthorityPolicy,
  validateEventSubjectPolicies,
};

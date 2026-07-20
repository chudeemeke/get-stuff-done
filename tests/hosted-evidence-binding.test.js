'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const {
  classifyPairedPerformanceAuthority,
  validateEvidenceAuthorityPolicy,
  validateEventSubjectPolicies,
} = require('../scripts/lib/hosted-evidence-binding');

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

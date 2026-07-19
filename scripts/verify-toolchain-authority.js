'use strict';

const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');
const yaml = require('js-yaml');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = 'config/phase43-toolchain-authority.json';
const HOSTED_CONTRACT_PATH = 'config/phase43-hosted-ci-contract.json';
const MAX_DIAGNOSTICS = 100;
const MAX_DIAGNOSTIC_STRING_LENGTH = 200;
const MAX_RUNTIME_EVIDENCE = 100;
const MAX_RUNTIME_TOOLS = 20;
const MAX_GOVERNED_WORKFLOW_BYTES = 256 * 1024;
const MAX_TOOLCHAIN_MANIFEST_BYTES = 256 * 1024;
const MAX_RUNTIME_EVIDENCE_BYTES = 256 * 1024;
const MAX_BUN_VERSION_BYTES = 128;
const MAX_MATRIX_DIMENSIONS = 10;
const MAX_RUNTIME_MATRIX_ROWS = MAX_RUNTIME_EVIDENCE;
const SETUP_BUN_INPUT_KEYS = new Set(['bun-version-file']);
const SETUP_NODE_INPUT_KEYS = new Set(['node-version']);
const HELP = [
  'Usage:',
  '  node scripts/verify-toolchain-authority.js [--mode static|local-runtime] [--runtime-evidence <path>]',
  '',
  'Defaults to static repository verification. Local-runtime mode requires caller-supplied evidence.',
].join('\n');
const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'bun',
  'githubActions',
  'containers',
  'node',
  'runtimeTools',
  'runtimeSubjects',
  'runtimeRequirements',
  'governedWorkflows',
]);
const BUN_KEYS = new Set(['semantics', 'version', 'versionFile', 'updateTrigger']);
const COLLECTION_KEYS = new Set(['semantics', 'pins']);
const ACTION_PIN_KEYS = new Set(['tag', 'sha', 'updateTrigger']);
const CONTAINER_PIN_KEYS = new Set(['tag', 'digest', 'updateTrigger']);
const NODE_KEYS = new Set(['semantics', 'declaredMajors', 'requireResolvedPatch']);
const RUNTIME_TOOL_KEYS = new Set(['semantics', 'versionPattern', 'updateTrigger']);
const RUNTIME_SUBJECT_KEYS = new Set(['workflow', 'job', 'matrix', 'nodeMajor', 'requiredTools']);
const RUNTIME_REQUIREMENT_VALUES = new Set(['bun', 'node', 'both']);
const RUNTIME_EVIDENCE_KEYS = new Set(['subject', 'bunVersion', 'nodeVersion', 'tools']);
const EXECUTION_SUBJECT_KEYS = new Set([
  'checkoutStep',
  'verificationStep',
  'requireAdjacent',
  'checkoutAction',
  'checkoutRef',
  'verificationShell',
  'expectedSubjectEnvironment',
  'expectedSubjectExpression',
  'verificationRun',
  'securityPrelude',
  'checkoutInputs',
]);
const SECURITY_PRELUDE_KEYS = new Set(['action', 'allowedInputs']);
const CONTROL_CHECKOUT_KEYS = new Set(['name', 'uses', 'with', 'continue-on-error']);

function hasExactKeys(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.size &&
    Object.keys(value).every(key => keys.has(key))
  );
}

function hasOnlyKeys(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every(key => keys.has(key))
  );
}

function hasUpdateTrigger(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
}

function validateExecutionSubjectPolicy(policy) {
  if (
    !hasExactKeys(policy, EXECUTION_SUBJECT_KEYS) ||
    policy.checkoutStep !== 'Checkout exact event subject' ||
    policy.verificationStep !== 'Verify execution subject' ||
    policy.requireAdjacent !== true ||
    policy.checkoutAction !== 'actions/checkout' ||
    policy.checkoutRef !== '${{ github.event.pull_request.head.sha }}' ||
    policy.verificationShell !== 'bash' ||
    policy.expectedSubjectEnvironment !== 'GSD_EXPECTED_SUBJECT' ||
    policy.expectedSubjectExpression !== '${{ github.event.pull_request.head.sha }}' ||
    policy.verificationRun !==
      [
        'actual="$(git rev-parse HEAD)"',
        'if [ "$actual" != "$GSD_EXPECTED_SUBJECT" ]; then',
        '  echo "::error::Expected $GSD_EXPECTED_SUBJECT but checked out $actual"',
        '  exit 1',
        'fi',
      ].join('\n') ||
    !hasExactKeys(policy.securityPrelude, SECURITY_PRELUDE_KEYS) ||
    policy.securityPrelude.action !== 'step-security/harden-runner' ||
    JSON.stringify(policy.securityPrelude.allowedInputs) !==
      JSON.stringify({ 'egress-policy': ['audit', 'block'] }) ||
    JSON.stringify(policy.checkoutInputs) !==
      JSON.stringify({
        '.github/workflows/ci.yml': {
          'secret-scan': { 'fetch-depth': 0 },
        },
      })
  ) {
    throw new Error('Execution-subject control-step authority is invalid.');
  }
  return policy;
}

function isUnconditionalBlockingStep(step) {
  return (
    !Object.prototype.hasOwnProperty.call(step, 'if') &&
    (!Object.prototype.hasOwnProperty.call(step, 'continue-on-error') ||
      step['continue-on-error'] === false)
  );
}

function isBoundedToken(value, maximumLength = 100) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maximumLength) {
    return false;
  }
  for (const character of value) {
    const alphaNumeric =
      (character >= '0' && character <= '9') ||
      (character >= 'A' && character <= 'Z') ||
      (character >= 'a' && character <= 'z');
    if (!alphaNumeric && !['-', '_', '.'].includes(character)) return false;
  }
  return true;
}

function isBoundedMatrixValue(value) {
  return (
    (typeof value === 'string' && value.length <= 100) ||
    (Number.isSafeInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) ||
    typeof value === 'boolean'
  );
}

function isBoundedMatrix(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_MATRIX_DIMENSIONS &&
    entries.every(
      ([key, item]) =>
        isBoundedToken(key) &&
        isBoundedMatrixValue(item)
    )
  );
}

function canonicalMatrix(value) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

function matrixIdentity(value) {
  return JSON.stringify(canonicalMatrix(value));
}

function isNumericIdentifier(value) {
  if (value.length === 0 || value.length > 10) return false;
  for (const character of value) {
    if (character < '0' || character > '9') return false;
  }
  return value.length === 1 || value[0] !== '0';
}

function isSemverIdentifierList(value, enforceNumericLeadingZeroRule) {
  if (value.length === 0 || value.length > 64) return false;
  return value.split('.').every(identifier => {
    if (identifier.length === 0) return false;
    for (const character of identifier) {
      const alphaNumeric =
        (character >= '0' && character <= '9') ||
        (character >= 'A' && character <= 'Z') ||
        (character >= 'a' && character <= 'z');
      if (!alphaNumeric && character !== '-') return false;
    }
    if (!enforceNumericLeadingZeroRule) return true;
    const isNumeric = [...identifier].every(
      character => character >= '0' && character <= '9'
    );
    return !isNumeric || identifier.length === 1 || identifier[0] !== '0';
  });
}

function isResolvedSemver(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 128) return false;
  const plus = value.indexOf('+');
  if (plus !== -1 && value.indexOf('+', plus + 1) !== -1) return false;
  const coreAndPreRelease = plus === -1 ? value : value.slice(0, plus);
  const build = plus === -1 ? null : value.slice(plus + 1);
  const hyphen = coreAndPreRelease.indexOf('-');
  const core = hyphen === -1 ? coreAndPreRelease : coreAndPreRelease.slice(0, hyphen);
  const preRelease = hyphen === -1 ? null : coreAndPreRelease.slice(hyphen + 1);
  const coreParts = core.split('.');
  return (
    coreParts.length === 3 &&
    coreParts.every(isNumericIdentifier) &&
    (preRelease === null || isSemverIdentifierList(preRelease, true)) &&
    (build === null || isSemverIdentifierList(build, false))
  );
}

function resolvedSemverMajor(value) {
  if (!isResolvedSemver(value)) return null;
  return Number(value.slice(0, value.indexOf('.')));
}

function boundDiagnosticValue(value) {
  if (typeof value === 'string' && value.length > MAX_DIAGNOSTIC_STRING_LENGTH) {
    return `${value.slice(0, MAX_DIAGNOSTIC_STRING_LENGTH - 3)}...`;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map(boundDiagnosticValue);
  return value;
}

function createDiagnosticCollector() {
  const retained = [];
  let total = 0;
  return {
    add(diagnostic) {
      total += 1;
      if (retained.length < MAX_DIAGNOSTICS) {
        retained.push(
          Object.fromEntries(
            Object.entries(diagnostic).map(([key, value]) => [key, boundDiagnosticValue(value)])
          )
        );
      }
    },
    result() {
      if (total <= MAX_DIAGNOSTICS) {
        return { ok: total === 0, diagnostics: retained };
      }
      return {
        ok: false,
        diagnostics: [
          ...retained.slice(0, MAX_DIAGNOSTICS - 1),
          { code: 'diagnostics_truncated', omitted: total - (MAX_DIAGNOSTICS - 1) },
        ],
      };
    },
  };
}

function validatePins(pins, keys, validateIdentity, label) {
  if (!pins || typeof pins !== 'object' || Array.isArray(pins) || Object.keys(pins).length === 0) {
    throw new Error(`Toolchain ${label} authority must define pins.`);
  }
  for (const [name, pin] of Object.entries(pins)) {
    if (
      !name ||
      name.includes('@') ||
      !hasExactKeys(pin, keys) ||
      typeof pin.tag !== 'string' ||
      pin.tag.length === 0 ||
      !validateIdentity(pin) ||
      !hasUpdateTrigger(pin.updateTrigger)
    ) {
      throw new Error(`Toolchain ${label} authority contains an invalid pin.`);
    }
  }
}

function validateToolchainAuthorityManifest(manifest) {
  if (!hasExactKeys(manifest, MANIFEST_KEYS)) {
    throw new Error('Toolchain authority manifest contains an unknown field or missing field.');
  }
  if (manifest.schemaVersion !== 3) {
    throw new Error('Toolchain authority manifest schema version must be 3.');
  }
  if (
    !hasExactKeys(manifest.bun, BUN_KEYS) ||
    manifest.bun.semantics !== 'exact' ||
    !isResolvedSemver(manifest.bun.version) ||
    manifest.bun.versionFile !== '.bun-version' ||
    !hasUpdateTrigger(manifest.bun.updateTrigger)
  ) {
    throw new Error('Toolchain Bun authority is invalid.');
  }
  if (
    !hasExactKeys(manifest.githubActions, COLLECTION_KEYS) ||
    manifest.githubActions.semantics !== 'exact-commit'
  ) {
    throw new Error('Toolchain GitHub Action authority is invalid.');
  }
  validatePins(
    manifest.githubActions.pins,
    ACTION_PIN_KEYS,
    pin => /^[0-9a-f]{40}$/.test(pin.sha || ''),
    'GitHub Action'
  );
  if (
    !hasExactKeys(manifest.containers, COLLECTION_KEYS) ||
    manifest.containers.semantics !== 'exact-digest'
  ) {
    throw new Error('Toolchain container authority is invalid.');
  }
  validatePins(
    manifest.containers.pins,
    CONTAINER_PIN_KEYS,
    pin => /^sha256:[0-9a-f]{64}$/.test(pin.digest || ''),
    'container'
  );
  if (
    !hasExactKeys(manifest.node, NODE_KEYS) ||
    manifest.node.semantics !== 'compatibility-major' ||
    JSON.stringify(manifest.node.declaredMajors) !== JSON.stringify([20, 22]) ||
    manifest.node.requireResolvedPatch !== true
  ) {
    throw new Error('Toolchain Node authority is invalid.');
  }
  if (
    !manifest.runtimeTools ||
    typeof manifest.runtimeTools !== 'object' ||
    Array.isArray(manifest.runtimeTools) ||
    Object.keys(manifest.runtimeTools).length === 0 ||
    Object.values(manifest.runtimeTools).some(
      tool =>
        !hasExactKeys(tool, RUNTIME_TOOL_KEYS) ||
        tool.semantics !== 'recorded-runtime' ||
        tool.versionPattern !== 'semver' ||
        !hasUpdateTrigger(tool.updateTrigger)
    )
  ) {
    throw new Error('Toolchain recorded-runtime authority is invalid.');
  }
  if (
    !Array.isArray(manifest.governedWorkflows) ||
    manifest.governedWorkflows.length === 0 ||
    new Set(manifest.governedWorkflows).size !== manifest.governedWorkflows.length ||
    manifest.governedWorkflows.some(
      workflow =>
        typeof workflow !== 'string' ||
        !workflow.startsWith('.github/workflows/') ||
        !workflow.endsWith('.yml') ||
        workflow.includes('\\') ||
        workflow.includes('..')
    )
  ) {
    throw new Error('Toolchain governed workflow authority is invalid.');
  }
  const runtimeSubjectEntries =
    manifest.runtimeSubjects &&
    typeof manifest.runtimeSubjects === 'object' &&
    !Array.isArray(manifest.runtimeSubjects)
      ? Object.entries(manifest.runtimeSubjects)
      : [];
  const declaredRuntimeTools = new Set(Object.keys(manifest.runtimeTools));
  const runtimeRequirementEntries =
    manifest.runtimeRequirements &&
    typeof manifest.runtimeRequirements === 'object' &&
    !Array.isArray(manifest.runtimeRequirements)
      ? Object.entries(manifest.runtimeRequirements)
      : [];
  if (
    runtimeRequirementEntries.length === 0 ||
    runtimeRequirementEntries.length > manifest.governedWorkflows.length ||
    runtimeRequirementEntries.some(
      ([workflow, requirements]) =>
        !manifest.governedWorkflows.includes(workflow) ||
        !requirements ||
        typeof requirements !== 'object' ||
        Array.isArray(requirements) ||
        Object.keys(requirements).length === 0 ||
        Object.keys(requirements).length > 100 ||
        Object.entries(requirements).some(
          ([job, requirement]) =>
            !isBoundedToken(job) || !RUNTIME_REQUIREMENT_VALUES.has(requirement)
        )
    )
  ) {
    throw new Error('Toolchain runtime requirement authority is invalid.');
  }
  const runtimeJobIdentitySet = new Set(
    runtimeRequirementEntries.flatMap(([workflow, requirements]) =>
      Object.keys(requirements).map(job => `${workflow}\0${job}`)
    )
  );
  const requiredRuntimeTools = new Set();
  const runtimeMatrixIdentities = new Set();
  if (
    runtimeSubjectEntries.length === 0 ||
    runtimeSubjectEntries.length > MAX_RUNTIME_EVIDENCE ||
    runtimeSubjectEntries.some(([subject, authority]) => {
      if (
        !isBoundedToken(subject) ||
        !hasExactKeys(authority, RUNTIME_SUBJECT_KEYS) ||
        !manifest.governedWorkflows.includes(authority.workflow) ||
        !isBoundedToken(authority.job) ||
        !isBoundedMatrix(authority.matrix) ||
        !runtimeJobIdentitySet.has(`${authority.workflow}\0${authority.job}`) ||
        !manifest.node.declaredMajors.includes(authority.nodeMajor) ||
        !Array.isArray(authority.requiredTools) ||
        new Set(authority.requiredTools).size !== authority.requiredTools.length ||
        authority.requiredTools.some(
          tool => !isBoundedToken(tool) || !declaredRuntimeTools.has(tool)
        )
      ) {
        return true;
      }
      const matrixKey = `${authority.workflow}\0${authority.job}\0${matrixIdentity(authority.matrix)}`;
      if (runtimeMatrixIdentities.has(matrixKey)) return true;
      runtimeMatrixIdentities.add(matrixKey);
      for (const tool of authority.requiredTools) requiredRuntimeTools.add(tool);
      return false;
    }) ||
    [...declaredRuntimeTools].some(tool => !requiredRuntimeTools.has(tool))
  ) {
    throw new Error('Toolchain runtime subject authority is invalid.');
  }
  return manifest;
}

function validateRuntimeEvidence(runtimeEvidence) {
  if (!Array.isArray(runtimeEvidence) || runtimeEvidence.length > MAX_RUNTIME_EVIDENCE) {
    throw new Error('Toolchain runtime evidence is invalid.');
  }
  for (const evidence of runtimeEvidence) {
    if (
      !hasExactKeys(evidence, RUNTIME_EVIDENCE_KEYS) ||
      !isBoundedToken(evidence.subject) ||
      typeof evidence.bunVersion !== 'string' ||
      evidence.bunVersion.length > 128 ||
      typeof evidence.nodeVersion !== 'string' ||
      evidence.nodeVersion.length > 128 ||
      !evidence.tools ||
      typeof evidence.tools !== 'object' ||
      Array.isArray(evidence.tools) ||
      Object.keys(evidence.tools).length > MAX_RUNTIME_TOOLS ||
      Object.entries(evidence.tools).some(
        ([tool, version]) =>
          !isBoundedToken(tool) || typeof version !== 'string' || version.length > 128
      )
    ) {
      throw new Error('Toolchain runtime evidence is invalid.');
    }
  }
  return runtimeEvidence;
}

function decodeBoundedUtf8(value, label, maximumBytes) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  if (bytes.length > maximumBytes) {
    throw new Error(`${label} exceeds the ${maximumBytes}-byte size limit.`);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    if (error instanceof TypeError) throw new Error(`${label} must be valid UTF-8.`);
    throw error;
  }
}

function parseBoundedJson(value, label, maximumBytes) {
  return JSON.parse(decodeBoundedUtf8(value, label, maximumBytes));
}

function parseRuntimeEvidence(value) {
  return parseBoundedJson(value, 'Runtime evidence', MAX_RUNTIME_EVIDENCE_BYTES);
}

function parseToolchainAuthorityManifest(value) {
  return validateToolchainAuthorityManifest(
    parseBoundedJson(
      value,
      'Toolchain authority manifest',
      MAX_TOOLCHAIN_MANIFEST_BYTES
    )
  );
}

function parseGovernedWorkflow(value) {
  return yaml.load(
    decodeBoundedUtf8(value, 'Governed workflow', MAX_GOVERNED_WORKFLOW_BYTES)
  );
}

function parseBunVersionAuthority(value) {
  return decodeBoundedUtf8(value, 'Bun version file', MAX_BUN_VERSION_BYTES).trim();
}

function collectWorkflowDependencies(document) {
  const result = { actionSteps: [], images: [], jobs: [] };
  const jobs =
    document?.jobs && typeof document.jobs === 'object' && !Array.isArray(document.jobs)
      ? Object.entries(document.jobs)
      : [];
  const addAction = step => {
    if (typeof step?.uses !== 'string') return;
    if (step.uses.startsWith('docker://')) result.images.push(step.uses);
    else result.actionSteps.push(step);
  };
  const addContainer = container => {
    if (typeof container === 'string') result.images.push(container);
    else if (container && typeof container.image === 'string') result.images.push(container.image);
  };

  for (const [jobId, job] of jobs) {
    if (!job || typeof job !== 'object' || Array.isArray(job)) continue;
    const steps = Array.isArray(job.steps)
      ? job.steps.filter(step => step && typeof step === 'object' && !Array.isArray(step))
      : [];
    result.jobs.push({ id: jobId, steps, strategy: job.strategy });
    addAction(job);
    addContainer(job.container);
    if (job.services && typeof job.services === 'object' && !Array.isArray(job.services)) {
      for (const service of Object.values(job.services)) addContainer(service);
    }
    for (const step of steps) addAction(step);
  }
  return result;
}

function isExactControlStep(step, index, steps, policy, checkoutUses, workflow, jobId) {
  if (!policy || index < 1) return false;
  const checkout = steps[index - 1];
  const allowedStepKeys = new Set(['name', 'shell', 'env', 'run', 'continue-on-error']);
  const workflowCheckoutInputs = Reflect.get(policy.checkoutInputs, workflow) || {};
  const expectedCheckoutInputs = {
    ref: policy.checkoutRef,
    ...(Reflect.get(workflowCheckoutInputs, jobId) || {}),
  };
  return (
    step &&
    typeof step === 'object' &&
    Object.keys(step).every(key => allowedStepKeys.has(key)) &&
    step.name === policy.verificationStep &&
    step.shell === policy.verificationShell &&
    step.run === policy.verificationRun &&
    step.env &&
    Object.keys(step.env).length === 1 &&
    step.env[policy.expectedSubjectEnvironment] === policy.expectedSubjectExpression &&
    (!Object.prototype.hasOwnProperty.call(step, 'continue-on-error') ||
      step['continue-on-error'] === false) &&
    checkout?.name === policy.checkoutStep &&
    checkout?.uses === checkoutUses &&
    hasOnlyKeys(checkout, CONTROL_CHECKOUT_KEYS) &&
    checkout.with &&
    Object.keys(checkout.with).length === Object.keys(expectedCheckoutInputs).length &&
    Object.entries(expectedCheckoutInputs).every(
      ([key, value]) => Reflect.get(checkout.with, key) === value
    ) &&
    (!Object.prototype.hasOwnProperty.call(checkout, 'continue-on-error') ||
      checkout['continue-on-error'] === false)
  );
}

function cartesianMatrixRows(entries) {
  return entries.reduce(
    (rows, [key, values]) =>
      rows.flatMap(row => values.map(value => ({ ...row, [key]: value }))),
    [{}]
  );
}

function expandRuntimeMatrix(matrix) {
  if (!matrix) return [{}];
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) return null;
  const axes = Object.entries(matrix).filter(
    ([key, values]) => key !== 'include' && key !== 'exclude' && Array.isArray(values)
  );
  const hasUnsupportedAxis = Object.entries(matrix).some(
    ([key, values]) =>
      key !== 'include' &&
      key !== 'exclude' &&
      (!isBoundedToken(key) ||
        !Array.isArray(values) ||
        values.length === 0 ||
        values.some(value => !isBoundedMatrixValue(value)))
  );
  if (hasUnsupportedAxis || matrix.exclude || (matrix.include && axes.length > 0)) return null;
  if (Array.isArray(matrix.include)) {
    if (matrix.include.length > MAX_RUNTIME_MATRIX_ROWS || !matrix.include.every(isBoundedMatrix)) {
      return null;
    }
    const rows = matrix.include.map(canonicalMatrix);
    return new Set(rows.map(matrixIdentity)).size === rows.length ? rows : null;
  }
  if (axes.length > MAX_MATRIX_DIMENSIONS) return null;
  let cardinality = 1;
  for (const [, values] of axes) {
    if (values.length > Math.floor(MAX_RUNTIME_MATRIX_ROWS / cardinality)) return null;
    cardinality *= values.length;
  }
  const rows = cartesianMatrixRows(axes).map(canonicalMatrix);
  return new Set(rows.map(matrixIdentity)).size === rows.length ? rows : null;
}

function resolveNodeMajor(nodeVersion, matrix) {
  if (Number.isInteger(nodeVersion)) return nodeVersion;
  if (typeof nodeVersion !== 'string') return null;
  if (/^(0|[1-9][0-9]*)$/.test(nodeVersion)) return Number(nodeVersion);
  const match = nodeVersion.match(/^\$\{\{\s*matrix\.([A-Za-z0-9_-]+)\s*\}\}$/);
  if (!match) return null;
  const value = matrix[match[1]];
  if (Number.isInteger(value)) return value;
  return typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value) ? Number(value) : null;
}

function containerRepository(reference) {
  const withoutDigest = reference.split('@')[0];
  const slash = withoutDigest.lastIndexOf('/');
  const colon = withoutDigest.lastIndexOf(':');
  return colon > slash ? withoutDigest.slice(0, colon) : withoutDigest;
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

function evaluateToolchainAuthority(input) {
  validateToolchainAuthorityManifest(input.manifest);
  const executionSubject = input.executionSubject
    ? validateExecutionSubjectPolicy(input.executionSubject)
    : null;
  const diagnostics = createDiagnosticCollector();
  const expected = input.manifest.bun.version;
  const actual = String(input.bunVersion || '').trim();
  const workflowDocuments = new Map(Object.entries(input.workflows || {}));
  const actionPins = new Map(Object.entries(input.manifest.githubActions.pins));
  const containerPins = new Map(Object.entries(input.manifest.containers.pins));
  const runtimeTools = new Map(Object.entries(input.manifest.runtimeTools));
  const runtimeSubjectEntries = Object.entries(input.manifest.runtimeSubjects);
  const checkoutPin = actionPins.get(executionSubject?.checkoutAction);
  const checkoutUses = checkoutPin
    ? `${executionSubject.checkoutAction}@${checkoutPin.sha}`
    : null;

  if (actual !== expected) {
    diagnostics.add({ code: 'bun_version_mismatch', expected, actual });
  }

  for (const workflow of input.manifest.governedWorkflows) {
    const document = workflowDocuments.get(workflow);
    if (!document || typeof document !== 'object') {
      diagnostics.add({ code: 'governed_workflow_missing', workflow });
      continue;
    }
    const dependencies = collectWorkflowDependencies(document);
    const jobsById = new Map(dependencies.jobs.map(job => [job.id, job]));
    const runtimePolicies = [
      ...new Map(
        runtimeSubjectEntries
          .filter(([, authority]) => authority.workflow === workflow)
          .map(([, authority]) => [authority.job, authority])
      ).values(),
    ];
    for (const policy of runtimePolicies) {
      const job = jobsById.get(policy.job);
      if (!job) {
        diagnostics.add({
          code: 'runtime_subject_job_missing',
          workflow,
          job: policy.job,
        });
        continue;
      }
      const rows = expandRuntimeMatrix(job.strategy?.matrix);
      if (!rows) {
        diagnostics.add({ code: 'runtime_subject_matrix_unsupported', workflow, job: policy.job });
        continue;
      }
      const declared = runtimeSubjectEntries.filter(
        ([, authority]) => authority.workflow === workflow && authority.job === policy.job
      );
      const declaredByMatrix = new Map();
      for (const [subject, authority] of declared) {
        const identity = matrixIdentity(authority.matrix);
        const matches = declaredByMatrix.get(identity) || [];
        matches.push(subject);
        declaredByMatrix.set(identity, matches);
      }
      const rowIdentities = new Set(rows.map(matrixIdentity));
      for (const row of rows) {
        const matches = declaredByMatrix.get(matrixIdentity(row)) || [];
        if (matches.length === 0) {
          diagnostics.add({
            code: 'runtime_subject_matrix_row_missing',
            workflow,
            job: policy.job,
            matrix: canonicalMatrix(row),
          });
        } else if (matches.length > 1) {
          diagnostics.add({
            code: 'runtime_subject_matrix_row_ambiguous',
            workflow,
            job: policy.job,
            matrix: canonicalMatrix(row),
          });
        }
      }
      for (const [subject, authority] of declared) {
        if (!rowIdentities.has(matrixIdentity(authority.matrix))) {
          diagnostics.add({
            code: 'runtime_subject_matrix_row_unexpected',
            subject,
            workflow,
            job: policy.job,
            matrix: canonicalMatrix(authority.matrix),
          });
        }
      }
    }
    for (const step of dependencies.actionSteps) {
      const uses = step.uses;
      if (uses.startsWith('./')) {
        diagnostics.add({ code: 'local_action_not_governed', workflow, action: uses });
        continue;
      }
      const separator = uses.lastIndexOf('@');
      const action = separator === -1 ? uses : uses.slice(0, separator);
      const ref = separator === -1 ? '' : uses.slice(separator + 1);
      const pin = actionPins.get(action);
      if (!pin) {
        diagnostics.add({ code: 'action_not_governed', workflow, action });
      } else if (ref !== pin.sha) {
        diagnostics.add({
          code: 'action_ref_not_pinned',
          workflow,
          action,
          expected: pin.sha,
          actual: ref,
        });
      }
    }
    for (const step of dependencies.actionSteps) {
      if (
        step.uses.startsWith('oven-sh/setup-bun@') &&
        (!isUnconditionalBlockingStep(step) ||
          !hasOnlyKeys(step.with, SETUP_BUN_INPUT_KEYS) ||
          Object.keys(step.with || {}).length !== SETUP_BUN_INPUT_KEYS.size ||
          step.with?.['bun-version-file'] !== input.manifest.bun.versionFile ||
          Object.prototype.hasOwnProperty.call(step.with || {}, 'bun-version'))
      ) {
        diagnostics.add({
          code: 'bun_setup_not_authoritative',
          workflow,
          expectedVersionFile: input.manifest.bun.versionFile,
        });
      }
    }
    for (const job of dependencies.jobs) {
      const executesShell = job.steps.some(
        (step, index) =>
          typeof step.run === 'string' &&
          !isExactControlStep(
            step,
            index,
            job.steps,
            executionSubject,
            checkoutUses,
            workflow,
            job.id
          )
      );
      const isRuntimeSubjectJob = runtimePolicies.some(policy => policy.job === job.id);
      const requirement = input.manifest.runtimeRequirements[workflow]?.[job.id];
      const setupBunSteps = job.steps.filter(step =>
        step.uses?.startsWith('oven-sh/setup-bun@')
      );
      if (executesShell && !requirement) {
        diagnostics.add({ code: 'runtime_requirement_missing', workflow, job: job.id });
      }
      if (!executesShell && requirement) {
        diagnostics.add({ code: 'runtime_requirement_unneeded', workflow, job: job.id });
      }
      const requiresBun = requirement === 'bun' || requirement === 'both';
      if (requiresBun && setupBunSteps.length === 0) {
        diagnostics.add({ code: 'bun_setup_missing', workflow, job: job.id });
      } else if (!requiresBun && setupBunSteps.length > 0) {
        diagnostics.add({ code: 'bun_setup_extraneous', workflow, job: job.id });
      } else if (setupBunSteps.length > 1) {
        diagnostics.add({ code: 'bun_setup_ambiguous', workflow, job: job.id });
      }

      const setupNodeSteps = job.steps.filter(step =>
        step.uses?.startsWith('actions/setup-node@')
      );
      const requiresNode = requirement === 'node' || requirement === 'both';
      if (requiresNode && setupNodeSteps.length === 0) {
        diagnostics.add({ code: 'node_setup_missing', workflow, job: job.id });
      } else if (!requiresNode && setupNodeSteps.length > 0) {
        diagnostics.add({ code: 'node_setup_extraneous', workflow, job: job.id });
      } else if (setupNodeSteps.length > 1) {
        diagnostics.add({ code: 'node_setup_ambiguous', workflow, job: job.id });
      } else if (setupNodeSteps.length === 1) {
        const setupNodeStep = setupNodeSteps[0];
        const nodeVersion = setupNodeStep.with?.['node-version'];
        const rows = expandRuntimeMatrix(job.strategy?.matrix) || [{}];
        const resolvedMajors = rows.map(row => resolveNodeMajor(nodeVersion, row));
        if (
          !isUnconditionalBlockingStep(setupNodeStep) ||
          !hasOnlyKeys(setupNodeStep.with, SETUP_NODE_INPUT_KEYS) ||
          Object.keys(setupNodeStep.with || {}).length !== SETUP_NODE_INPUT_KEYS.size ||
          resolvedMajors.some(
            major => major === null || !input.manifest.node.declaredMajors.includes(major)
          )
        ) {
          diagnostics.add({
            code: 'node_setup_not_authoritative',
            workflow,
            job: job.id,
            actual: nodeVersion,
          });
        } else if (isRuntimeSubjectJob) {
          for (const [index, row] of rows.entries()) {
            const resolvedMajor = resolvedMajors.at(index);
            const expectedSubjects = runtimeSubjectEntries.filter(
              ([, authority]) =>
                authority.workflow === workflow &&
                authority.job === job.id &&
                matrixIdentity(authority.matrix) === matrixIdentity(row)
            );
            for (const [subject, authority] of expectedSubjects) {
              if (authority.nodeMajor !== resolvedMajor) {
                diagnostics.add({
                  code: 'node_setup_subject_mismatch',
                  subject,
                  expected: authority.nodeMajor,
                  actual: resolvedMajor,
                });
              }
            }
          }
        }
      }
    }
    for (const imageReference of dependencies.images) {
      const prefix = imageReference.startsWith('docker://') ? 'docker://' : '';
      const unwrappedReference = imageReference.slice(prefix.length);
      const image = containerRepository(unwrappedReference);
      const pin = containerPins.get(image);
      const expectedReference = pin && `${prefix}${image}@${pin.digest}`;
      if (!pin) {
        diagnostics.add({ code: 'container_not_governed', workflow, image });
      } else if (imageReference !== expectedReference) {
        diagnostics.add({
          code: 'container_ref_not_pinned',
          workflow,
          image,
          expected: expectedReference,
          actual: imageReference,
        });
      }
    }
  }

  if (input.requireRuntimeEvidence !== false) {
    const runtimeEvidence = validateRuntimeEvidence(input.runtimeEvidence || []);
    const evidenceBySubject = new Map();
    for (const evidence of runtimeEvidence) {
      if (!Object.prototype.hasOwnProperty.call(input.manifest.runtimeSubjects, evidence.subject)) {
        diagnostics.add({ code: 'runtime_subject_not_governed', subject: evidence.subject });
        continue;
      }
      const matches = evidenceBySubject.get(evidence.subject) || [];
      matches.push(evidence);
      evidenceBySubject.set(evidence.subject, matches);
    }

    for (const [subject, subjectAuthority] of Object.entries(input.manifest.runtimeSubjects)) {
      const matches = evidenceBySubject.get(subject) || [];
      if (matches.length === 0) {
        diagnostics.add({ code: 'runtime_subject_evidence_missing', subject });
        continue;
      }
      if (matches.length !== 1) {
        diagnostics.add({
          code: 'runtime_subject_evidence_ambiguous',
          subject,
          actual: matches.length,
        });
        continue;
      }

      const evidence = matches[0];
      if (evidence.bunVersion !== expected) {
        diagnostics.add({
          code: 'bun_runtime_version_mismatch',
          subject,
          expected,
          actual: evidence.bunVersion,
        });
      }
      const nodeMajor = resolvedSemverMajor(evidence.nodeVersion);
      if (nodeMajor === null && input.manifest.node.requireResolvedPatch) {
        diagnostics.add({
          code: 'node_version_not_resolved',
          subject,
          actual: evidence.nodeVersion,
        });
      } else if (nodeMajor !== null) {
        if (!input.manifest.node.declaredMajors.includes(nodeMajor)) {
          diagnostics.add({
            code: 'node_major_not_declared',
            subject,
            expected: input.manifest.node.declaredMajors,
            actual: nodeMajor,
            resolvedVersion: evidence.nodeVersion,
          });
        } else if (nodeMajor !== subjectAuthority.nodeMajor) {
          diagnostics.add({
            code: 'node_subject_major_mismatch',
            subject,
            expected: subjectAuthority.nodeMajor,
            actual: nodeMajor,
          });
        }
      }

      for (const tool of subjectAuthority.requiredTools) {
        if (!Object.prototype.hasOwnProperty.call(evidence.tools, tool)) {
          diagnostics.add({ code: 'required_runtime_tool_missing', subject, tool });
        }
      }
      for (const [tool, version] of Object.entries(evidence.tools)) {
        const authority = runtimeTools.get(tool);
        if (!authority) {
          diagnostics.add({ code: 'runtime_tool_not_governed', subject, tool });
        } else if (authority.versionPattern === 'semver' && !isResolvedSemver(version)) {
          diagnostics.add({
            code: 'runtime_tool_version_not_resolved',
            subject,
            tool,
            actual: version,
          });
        }
      }
    }
  }

  return diagnostics.result();
}

function verifyToolchainAuthority(options = {}, dependencies = {}) {
  const projectRoot = options.projectRoot || PROJECT_ROOT;
  const mode = options.mode || 'static';
  if (!['local-runtime', 'static'].includes(mode)) {
    throw new Error('Toolchain authority mode must be local-runtime or static.');
  }
  const readText =
    dependencies.readText ||
    (filePath => {
      // Paths come from the closed manifest schema and remain under projectRoot.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.readFileSync(path.join(projectRoot, ...filePath.split('/')));
    });
  const readManifest =
    dependencies.readManifest ||
    (filePath => {
      const manifestFile = path.join(projectRoot, ...filePath.split('/'));
      // MANIFEST_PATH is a repository-owned constant resolved beneath projectRoot.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.statSync(manifestFile).size > MAX_TOOLCHAIN_MANIFEST_BYTES) {
        throw new Error(
          `Toolchain authority manifest exceeds the ${MAX_TOOLCHAIN_MANIFEST_BYTES}-byte size limit.`
        );
      }
      // MANIFEST_PATH is a repository-owned constant resolved beneath projectRoot.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.readFileSync(manifestFile);
    });
  const readWorkflow =
    dependencies.readWorkflow ||
    (filePath => {
      const workflowFile = path.join(projectRoot, ...filePath.split('/'));
      // Governed workflow paths are validated repository-relative manifest entries.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.statSync(workflowFile).size > MAX_GOVERNED_WORKFLOW_BYTES) {
        throw new Error(
          `Governed workflow exceeds the ${MAX_GOVERNED_WORKFLOW_BYTES}-byte size limit.`
        );
      }
      // Governed workflow paths are validated repository-relative manifest entries.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.readFileSync(workflowFile);
    });
  const readHostedContract =
    dependencies.readHostedContract ||
    (filePath => {
      const contractFile = path.join(projectRoot, ...filePath.split('/'));
      // HOSTED_CONTRACT_PATH is a repository-owned constant beneath projectRoot.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.statSync(contractFile).size > MAX_TOOLCHAIN_MANIFEST_BYTES) {
        throw new Error(
          `Hosted CI contract exceeds the ${MAX_TOOLCHAIN_MANIFEST_BYTES}-byte size limit.`
        );
      }
      // HOSTED_CONTRACT_PATH is a repository-owned constant beneath projectRoot.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.readFileSync(contractFile);
    });
  const manifest = parseToolchainAuthorityManifest(readManifest(MANIFEST_PATH));
  const hostedContract = parseBoundedJson(
    readHostedContract(HOSTED_CONTRACT_PATH),
    'Hosted CI contract',
    MAX_TOOLCHAIN_MANIFEST_BYTES
  );
  const executionSubject = validateExecutionSubjectPolicy(hostedContract.executionSubject);
  const workflows = Object.fromEntries(
    manifest.governedWorkflows.map(workflow => [workflow, parseGovernedWorkflow(readWorkflow(workflow))])
  );
  const result = evaluateToolchainAuthority({
    manifest,
    bunVersion: parseBunVersionAuthority(readText(manifest.bun.versionFile)),
    workflows,
    executionSubject,
    runtimeEvidence: options.runtimeEvidence || [],
    requireRuntimeEvidence: mode === 'local-runtime',
  });
  return { mode, ...result };
}

function parseCliArgs(argv) {
  const options = { mode: 'static', runtimeEvidencePath: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv.at(index);
    const nextArgument = argv.at(index + 1);
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--mode' && nextArgument) {
      options.mode = nextArgument;
      index += 1;
    } else if (argument === '--runtime-evidence' && nextArgument) {
      options.runtimeEvidencePath = nextArgument;
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (options.mode === 'full') {
    throw new Error('Toolchain authority mode full was renamed; use --mode local-runtime.');
  }
  if (options.mode === 'hosted-runtime') {
    throw new Error('Toolchain authority mode hosted-runtime is reserved for trusted hosted receipts.');
  }
  if (!['local-runtime', 'static'].includes(options.mode)) {
    throw new Error('Toolchain authority mode must be local-runtime or static.');
  }
  if (options.mode === 'local-runtime' && !options.runtimeEvidencePath) {
    throw new Error('Local-runtime toolchain authority verification requires --runtime-evidence.');
  }
  if (options.mode === 'static' && options.runtimeEvidencePath) {
    throw new Error('--runtime-evidence requires --mode local-runtime.');
  }
  return options;
}

function runCli(argv, dependencies = {}) {
  const writeOutput = dependencies.writeOutput || (value => process.stdout.write(value));
  try {
    const cli = parseCliArgs(argv);
    if (cli.help) {
      writeOutput(`${HELP}\n`);
      return 0;
    }
    const projectRoot = dependencies.projectRoot || PROJECT_ROOT;
    let runtimeEvidence = [];
    if (cli.runtimeEvidencePath) {
      const resolvedPath = path.resolve(projectRoot, cli.runtimeEvidencePath);
      const rootPrefix = `${path.resolve(projectRoot)}${path.sep}`;
      if (!resolvedPath.startsWith(rootPrefix)) {
        throw new Error('Runtime evidence path must stay inside the project root.');
      }
      const realpath = dependencies.realpath || fs.realpathSync.native;
      const realRoot = realpath(projectRoot);
      const realEvidencePath = realpath(resolvedPath);
      if (!isContained(realRoot, realEvidencePath)) {
        throw new Error('Runtime evidence path resolves outside the project root through a link.');
      }
      const readRuntimeEvidence =
        dependencies.readRuntimeEvidence ||
        (filePath => {
          // realEvidencePath is containment-checked immediately above.
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          if (fs.statSync(filePath).size > MAX_RUNTIME_EVIDENCE_BYTES) {
            throw new Error(
              `Runtime evidence exceeds the ${MAX_RUNTIME_EVIDENCE_BYTES}-byte size limit.`
            );
          }
          // resolvedPath is checked against the project root immediately above.
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          return fs.readFileSync(filePath);
        });
      runtimeEvidence = parseRuntimeEvidence(readRuntimeEvidence(realEvidencePath));
    }
    const verify = dependencies.verifyToolchainAuthority || verifyToolchainAuthority;
    const result = verify({ projectRoot, mode: cli.mode, runtimeEvidence });
    writeOutput(`${JSON.stringify(result)}\n`);
    return result.ok ? 0 : 1;
  } catch (error) {
    const message = String(error?.message || error).slice(0, MAX_DIAGNOSTIC_STRING_LENGTH);
    writeOutput(
      `${JSON.stringify({
        mode: null,
        ok: false,
        diagnostics: [{ code: 'toolchain_authority_error', message }],
      })}\n`
    );
    return 2;
  }
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}

module.exports = {
  evaluateToolchainAuthority,
  isResolvedSemver,
  parseBunVersionAuthority,
  parseGovernedWorkflow,
  parseToolchainAuthorityManifest,
  runCli,
  validateToolchainAuthorityManifest,
  validateRuntimeEvidence,
  validateExecutionSubjectPolicy,
  verifyToolchainAuthority,
};

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createHash, randomUUID } = require('crypto');
const { TextDecoder } = require('util');
const yaml = require('js-yaml');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTRACT_PATH = 'config/phase43-hosted-ci-contract.json';
const HOSTED_EVIDENCE_DIRECTORY = '.planning/evidence/hosted';
const EXPECTED_REPOSITORY = 'chudeemeke/get-stuff-done';
const BILLING_LOCK_TEXT = 'account is locked due to a billing issue';
const GOVERNED_CATEGORIES = ['source', 'workflow', 'contract', 'policy'];
const CONTRACT_KEYS = new Set([
  'schemaVersion',
  'envelopeSchemaVersion',
  'repository',
  'contractPath',
  'evidenceDirectory',
  'acceptedConclusions',
  'allowUnexpectedWorkflows',
  'allowUnexpectedJobs',
  'governedPaths',
  'workflows',
]);
const WORKFLOW_KEYS = new Set(['name', 'path', 'requiredJobs', 'requiredJobMatrices']);
const JOB_MATRIX_KEYS = new Set(['template', 'dimensions', 'expectedCount']);
const HELP = [
  'Usage:',
  '  node scripts/verify-hosted-ci.js collect --pr <number> --receipt <path> --purpose <text>',
  '  node scripts/verify-hosted-ci.js verify-pending --pr <number> --receipt <path>',
  '  node scripts/verify-hosted-ci.js verify-receipt --pr <number> --receipt <path> --subject <40-hex>',
  '',
  'collect writes one immutable tracked envelope only for complete passed hosted evidence.',
  'verify-pending and verify-receipt perform no network calls and no writes.',
  '',
].join('\n');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function isRepositoryRelativePath(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !value.includes('\\') &&
    !value.includes(':') &&
    !value.startsWith('/') &&
    !/^[A-Za-z]:/.test(value) &&
    value.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..')
  );
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function pathEntryExists(filePath) {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function resolveReceiptPath(projectRoot, contract, receiptPath, options = {}) {
  if (!isRepositoryRelativePath(receiptPath) || !receiptPath.endsWith('.json')) {
    throw new Error('Hosted receipt must be a repository-relative JSON path.');
  }
  const prefix = `${contract.evidenceDirectory}/`;
  if (!receiptPath.startsWith(prefix)) {
    throw new Error('Hosted receipt must be beneath the contracted hosted evidence directory.');
  }

  const root = fs.realpathSync.native(projectRoot);
  const evidenceRoot = path.resolve(root, ...contract.evidenceDirectory.split('/'));
  const candidate = path.resolve(root, ...receiptPath.split('/'));
  if (!isContained(root, candidate) || !isContained(evidenceRoot, candidate)) {
    throw new Error('Hosted receipt path resolves outside the contracted evidence directory.');
  }

  let existingAncestor = path.dirname(candidate);
  while (!pathEntryExists(existingAncestor)) {
    const parent = path.dirname(existingAncestor);
    if (parent === existingAncestor) break;
    existingAncestor = parent;
  }
  const realAncestor = fs.realpathSync.native(existingAncestor);
  if (!isContained(root, realAncestor)) {
    throw new Error('Hosted receipt path resolves outside the repository through a link.');
  }
  if (pathEntryExists(evidenceRoot)) {
    const realEvidenceRoot = fs.realpathSync.native(evidenceRoot);
    if (!isContained(realEvidenceRoot, realAncestor)) {
      throw new Error('Hosted receipt path resolves outside the contracted evidence directory through a link.');
    }
  }
  if (options.mustNotExist && pathEntryExists(candidate)) {
    throw new Error('Hosted receipt already exists and is immutable.');
  }
  if (options.mustExist && !pathEntryExists(candidate)) {
    throw new Error('Hosted receipt does not exist.');
  }
  return candidate;
}

function expectedWorkflowJobs(workflowContract) {
  return [
    ...(workflowContract.requiredJobs || []),
    ...expandJobMatrices(workflowContract.requiredJobMatrices || []),
  ].sort();
}

function validateHostedContract(contract) {
  if (!contract || contract.schemaVersion !== 2 || contract.envelopeSchemaVersion !== 1) {
    throw new Error('Hosted CI contract must use schema version 2 and envelope version 1.');
  }
  if (Object.keys(contract).some(key => !CONTRACT_KEYS.has(key))) {
    throw new Error('Hosted CI contract contains an unknown field.');
  }
  if (
    contract.repository !== EXPECTED_REPOSITORY ||
    typeof contract.repository !== 'string' ||
    !isRepositoryRelativePath(contract.repository) ||
    contract.repository.split('/').length !== 2 ||
    contract.repository.includes('..')
  ) {
    throw new Error('Hosted CI contract repository authority is invalid.');
  }
  if (
    !isRepositoryRelativePath(contract.contractPath) ||
    contract.contractPath !== CONTRACT_PATH ||
    contract.evidenceDirectory !== HOSTED_EVIDENCE_DIRECTORY
  ) {
    throw new Error('Hosted CI contract repository and path authority is invalid.');
  }
  if (
    JSON.stringify(contract.acceptedConclusions) !== JSON.stringify(['success']) ||
    contract.allowUnexpectedWorkflows !== false ||
    contract.allowUnexpectedJobs !== false
  ) {
    throw new Error('Hosted CI contract policy authority must fail closed.');
  }
  if (!contract.governedPaths || !Array.isArray(contract.workflows)) {
    throw new Error('Hosted CI contract must define governed paths and workflows.');
  }
  const governedCategories = Object.keys(contract.governedPaths);
  if (
    governedCategories.length !== GOVERNED_CATEGORIES.length ||
    governedCategories.some(category => !GOVERNED_CATEGORIES.includes(category))
  ) {
    throw new Error('Hosted CI contract contains an unknown governed-path category.');
  }

  const governed = [];
  for (const category of GOVERNED_CATEGORIES) {
    const paths = contract.governedPaths[category];
    if (!Array.isArray(paths) || paths.length === 0 || paths.some(item => !isRepositoryRelativePath(item))) {
      throw new Error(`Hosted CI contract governed ${category} paths are invalid.`);
    }
    governed.push(...paths);
  }
  if (new Set(governed).size !== governed.length) {
    throw new Error('Hosted CI contract governed paths must be unique across categories.');
  }
  if (!contract.governedPaths.contract.includes(contract.contractPath)) {
    throw new Error('Hosted CI contract must govern its own contract path.');
  }
  if (governed.some(item => item === contract.evidenceDirectory || item.startsWith(`${contract.evidenceDirectory}/`))) {
    throw new Error('Hosted evidence paths cannot be part of governed digest sets.');
  }

  const names = new Set();
  const workflowPaths = new Set();
  for (const workflow of contract.workflows) {
    if (
      !workflow ||
      Object.keys(workflow).some(key => !WORKFLOW_KEYS.has(key)) ||
      typeof workflow.name !== 'string' ||
      !isRepositoryRelativePath(workflow.path) ||
      names.has(workflow.name) ||
      workflowPaths.has(workflow.path) ||
      expectedWorkflowJobs(workflow).length === 0
    ) {
      throw new Error('Hosted CI workflow authority is invalid or duplicated.');
    }
    if (
      workflow.requiredJobMatrices?.some(
        matrix =>
          !matrix ||
          Object.keys(matrix).some(key => !JOB_MATRIX_KEYS.has(key)) ||
          typeof matrix.template !== 'string' ||
          !Array.isArray(matrix.dimensions) ||
          matrix.dimensions.length === 0 ||
          matrix.dimensions.some(dimension => !Array.isArray(dimension) || dimension.length === 0) ||
          !Number.isInteger(matrix.expectedCount) ||
          matrix.expectedCount < 1
      )
    ) {
      throw new Error('Hosted CI workflow matrix authority is invalid.');
    }
    names.add(workflow.name);
    workflowPaths.add(workflow.path);
  }
  const governedWorkflows = [...contract.governedPaths.workflow].sort();
  if (JSON.stringify([...workflowPaths].sort()) !== JSON.stringify(governedWorkflows)) {
    throw new Error('Hosted CI workflow paths must equal the governed workflow set.');
  }
  return contract;
}

function cartesianRows(entries) {
  return entries.reduce(
    (rows, [key, values]) =>
      rows.flatMap(row => values.map(value => new Map([...row, [key, value]]))),
    [new Map()]
  );
}

function workflowMatrixRows(matrix) {
  const axes = Object.entries(matrix || {}).filter(
    ([key, values]) => key !== 'include' && key !== 'exclude' && Array.isArray(values)
  );
  if (matrix?.exclude || (matrix?.include && axes.length > 0)) {
    throw new Error('Hosted workflow authority does not support mixed include/exclude matrices.');
  }
  if (Array.isArray(matrix?.include)) {
    return matrix.include.map(row => new Map(Object.entries(row)));
  }
  return cartesianRows(axes);
}

function expandWorkflowJobNames(workflow) {
  const names = [];
  for (const [jobId, job] of Object.entries(workflow.jobs || {})) {
    const template = String(job.name || jobId);
    const matrix = job.strategy?.matrix;
    if (!matrix) {
      names.push(template);
      continue;
    }
    for (const row of workflowMatrixRows(matrix)) {
      names.push(
        template.replace(/\$\{\{\s*matrix\.([A-Za-z0-9_-]+)\s*\}\}/g, (_match, key) => {
          if (!row.has(key)) {
            throw new Error(`Workflow job ${jobId} references absent matrix key ${key}.`);
          }
          return String(row.get(key));
        })
      );
    }
  }
  return names.sort();
}

function verifyWorkflowTopology(contract, readWorkflow) {
  validateHostedContract(contract);
  let jobCount = 0;
  for (const authority of contract.workflows) {
    const workflow = yaml.load(readWorkflow(authority.path));
    if (!workflow || workflow.name !== authority.name || !workflow.on?.pull_request) {
      throw new Error(`Workflow ${authority.name} does not expose the contracted pull_request authority.`);
    }
    const actualJobs = expandWorkflowJobNames(workflow);
    const expectedJobs = expectedWorkflowJobs(authority);
    if (JSON.stringify(actualJobs) !== JSON.stringify(expectedJobs)) {
      throw new Error(`Workflow ${authority.name} job topology does not match the hosted CI contract.`);
    }
    jobCount += actualJobs.length;
  }
  return { workflows: contract.workflows.length, jobs: jobCount };
}

function computeGovernedDigests(contract, readPath) {
  validateHostedContract(contract);
  const result = {};
  for (const category of GOVERNED_CATEGORIES) {
    result[category] = contract.governedPaths[category].map(filePath => {
      const value = readPath(filePath);
      const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
      return { path: filePath, sha256: sha256(bytes) };
    });
  }
  return result;
}

function assertGovernedWorktreeMatchesCommit(contract, checkedCommit, dependencies) {
  for (const filePath of Object.values(contract.governedPaths).flat()) {
    const tracked = dependencies.readTracked(checkedCommit, filePath);
    const current = dependencies.readCurrent(filePath);
    const trackedBytes = Buffer.isBuffer(tracked) ? tracked : Buffer.from(tracked);
    const currentBytes = Buffer.isBuffer(current) ? current : Buffer.from(current);
    if (!trackedBytes.equals(currentBytes)) {
      throw new Error(`Governed path ${filePath} differs from checked commit ${checkedCommit}.`);
    }
  }
}

function validateHostedEnvelope(envelope, contract) {
  validateHostedContract(contract);
  const allowedKeys = new Set([
    'schemaVersion',
    'contractSchemaVersion',
    'repository',
    'pullRequest',
    'checkedCommit',
    'purpose',
    'receiptPath',
    'observedAt',
    'verdict',
    'hostedEvidenceExists',
    'governedDigests',
    'workflows',
    'diagnostics',
  ]);
  if (
    !envelope ||
    Object.keys(envelope).some(key => !allowedKeys.has(key)) ||
    envelope.schemaVersion !== contract.envelopeSchemaVersion ||
    envelope.contractSchemaVersion !== contract.schemaVersion ||
    envelope.repository !== contract.repository ||
    !Number.isInteger(envelope.pullRequest) ||
    envelope.pullRequest <= 0 ||
    !/^[0-9a-f]{40}$/.test(envelope.checkedCommit || '') ||
    typeof envelope.purpose !== 'string' ||
    envelope.purpose.trim().length === 0 ||
    !isRepositoryRelativePath(envelope.receiptPath) ||
    !envelope.receiptPath.startsWith(`${contract.evidenceDirectory}/`) ||
    typeof envelope.observedAt !== 'string' ||
    envelope.observedAt.length === 0 ||
    envelope.verdict !== 'passed' ||
    envelope.hostedEvidenceExists !== true ||
    !Array.isArray(envelope.diagnostics) ||
    envelope.diagnostics.length !== 0
  ) {
    throw new Error('Hosted CI envelope authority is invalid.');
  }

  if (!envelope.governedDigests || Object.keys(envelope.governedDigests).length !== GOVERNED_CATEGORIES.length) {
    throw new Error('Hosted CI envelope governed digests are incomplete.');
  }
  for (const category of GOVERNED_CATEGORIES) {
    const expectedPaths = contract.governedPaths[category];
    const entries = envelope.governedDigests[category];
    if (
      !Array.isArray(entries) ||
      entries.length !== expectedPaths.length ||
      entries.some(
        (entry, index) =>
          !entry ||
          Object.keys(entry).length !== 2 ||
          entry.path !== expectedPaths[index] ||
          !/^[0-9a-f]{64}$/.test(entry.sha256 || '')
      )
    ) {
      throw new Error(`Hosted CI envelope ${category} digests do not match the contract.`);
    }
  }

  if (!Array.isArray(envelope.workflows) || envelope.workflows.length !== contract.workflows.length) {
    throw new Error('Hosted CI envelope workflow evidence is incomplete.');
  }
  for (let index = 0; index < contract.workflows.length; index += 1) {
    const authority = contract.workflows[index];
    const observed = envelope.workflows[index];
    const expectedJobCount = expectedWorkflowJobs(authority).length;
    if (
      !observed ||
      observed.name !== authority.name ||
      !Number.isInteger(observed.runId) ||
      observed.runId <= 0 ||
      !Number.isInteger(observed.attempt) ||
      observed.attempt <= 0 ||
      observed.status !== 'completed' ||
      !contract.acceptedConclusions.includes(observed.conclusion) ||
      observed.jobCount !== expectedJobCount ||
      !Number.isInteger(observed.executedStepCount) ||
      observed.executedStepCount < expectedJobCount
    ) {
      throw new Error(`Hosted CI envelope workflow ${authority.name} is invalid.`);
    }
  }
  return envelope;
}

function buildPassedEnvelope(verdict, contract, authority) {
  if (!verdict || verdict.verdict !== 'passed' || verdict.hostedEvidenceExists !== true) {
    throw new Error('An immutable envelope requires a passed hosted verdict with executed evidence.');
  }
  const envelope = {
    schemaVersion: contract.envelopeSchemaVersion,
    contractSchemaVersion: contract.schemaVersion,
    repository: contract.repository,
    pullRequest: verdict.pullRequest,
    checkedCommit: verdict.headSha,
    purpose: authority.purpose,
    receiptPath: authority.receiptPath,
    observedAt: verdict.observedAt,
    verdict: 'passed',
    hostedEvidenceExists: true,
    governedDigests: authority.governedDigests,
    workflows: verdict.workflows,
    diagnostics: [],
  };
  return validateHostedEnvelope(envelope, contract);
}

function parseJsonBytes(value, label) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not valid UTF-8.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function assertGovernedDigestsMatch(actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('Hosted envelope governed digests do not match repository bytes.');
  }
}

function compareRunRecency(left, right) {
  const attemptDelta = Number(right.run_attempt || 0) - Number(left.run_attempt || 0);
  if (attemptDelta !== 0) return attemptDelta;
  const timeDelta = Date.parse(right.updated_at || 0) - Date.parse(left.updated_at || 0);
  if (timeDelta !== 0) return timeDelta;
  return Number(right.id || 0) - Number(left.id || 0);
}

function selectLatestRuns(runs) {
  const grouped = new Map();
  for (const run of runs) {
    const candidates = grouped.get(run.name) || [];
    candidates.push(run);
    grouped.set(run.name, candidates);
  }

  return new Map(
    [...grouped.entries()].map(([name, candidates]) => [
      name,
      [...candidates].sort(compareRunRecency)[0],
    ])
  );
}

function annotationHasBillingLock(annotations) {
  return (annotations || []).some(annotation =>
    String(annotation.message || '').toLowerCase().includes(BILLING_LOCK_TEXT)
  );
}

function isBillingLockShape(selectedRuns, jobsByRun, annotationsByJob) {
  if (selectedRuns.length === 0) return false;

  return selectedRuns.every(run => {
    const jobs = jobsByRun[run.id] || [];
    return (
      run.status === 'completed' &&
      run.conclusion === 'failure' &&
      jobs.length > 0 &&
      jobs.every(
        job =>
          job.status === 'completed' &&
          job.conclusion === 'failure' &&
          Array.isArray(job.steps) &&
          job.steps.length === 0 &&
          annotationHasBillingLock(annotationsByJob[job.id])
      )
    );
  });
}

function classifyJobs(workflowContract, jobs) {
  const exactNames = new Set([
    ...(workflowContract.requiredJobs || []),
    ...expandJobMatrices(workflowContract.requiredJobMatrices || []),
  ]);
  const classified = new Set();
  const missing = [];

  for (const name of exactNames) {
    const matches = jobs.filter(job => job.name === name);
    if (matches.length !== 1) missing.push({ name, actual: matches.length });
    for (const match of matches) classified.add(match.id);
  }

  return {
    missing,
    unexpected: jobs.filter(job => !classified.has(job.id)),
  };
}

function expandJobMatrices(matrices) {
  const names = [];
  for (const matrix of matrices) {
    let combinations = [[]];
    for (const dimension of matrix.dimensions || []) {
      combinations = combinations.flatMap(combination =>
        dimension.map(value => [...combination, String(value)])
      );
    }
    if (combinations.length !== matrix.expectedCount) {
      throw new Error(
        `Job matrix ${matrix.template} expands to ${combinations.length}, expected ${matrix.expectedCount}.`
      );
    }
    for (const combination of combinations) {
      let name = matrix.template;
      for (const value of combination) name = name.replace('{}', value);
      if (name.includes('{}')) throw new Error(`Job matrix ${matrix.template} has unused placeholders.`);
      names.push(name);
    }
  }
  return names;
}

function evaluateHostedVerdict(input, contract) {
  const diagnostics = [];
  const accepted = new Set(contract.acceptedConclusions || ['success']);
  const expectedNames = new Set(contract.workflows.map(workflow => workflow.name));
  const latestByName = selectLatestRuns(input.runs || []);
  const selectedRuns = [];
  const prHeadAtStart = input.prHeadAtStart || input.prHead;
  const localHeadAtEnd = input.localHeadAtEnd || input.expectedHead;

  if (prHeadAtStart !== input.prHead) {
    diagnostics.push({
      code: 'head_changed_during_collection',
      before: prHeadAtStart,
      after: input.prHead,
    });
  }
  if (prHeadAtStart !== input.expectedHead || input.prHead !== input.expectedHead) {
    diagnostics.push({
      code: 'head_mismatch',
      message: `Pull request head changed from ${prHeadAtStart} to ${input.prHead}; local HEAD is ${input.expectedHead}.`,
    });
  }
  if (localHeadAtEnd !== input.expectedHead) {
    diagnostics.push({
      code: 'local_head_changed_during_collection',
      before: input.expectedHead,
      after: localHeadAtEnd,
    });
  }

  for (const workflow of contract.workflows) {
    const run = latestByName.get(workflow.name);
    if (!run) {
      diagnostics.push({ code: 'missing_workflow', workflow: workflow.name });
      continue;
    }
    selectedRuns.push(run);
    if (run.event !== 'pull_request') {
      diagnostics.push({ code: 'run_event_mismatch', workflow: workflow.name, actual: run.event });
    }
    if (
      !Array.isArray(run.pull_requests) ||
      !run.pull_requests.some(pullRequest => pullRequest?.number === input.pullRequest)
    ) {
      diagnostics.push({ code: 'run_pr_mismatch', workflow: workflow.name });
    }
    if (run.head_sha !== input.expectedHead) {
      diagnostics.push({ code: 'run_head_mismatch', workflow: workflow.name, actual: run.head_sha });
    }
  }

  if (!contract.allowUnexpectedWorkflows) {
    for (const name of latestByName.keys()) {
      if (!expectedNames.has(name)) diagnostics.push({ code: 'unexpected_workflow', workflow: name });
    }
  }

  const billingLock =
    diagnostics.length === 0 &&
    selectedRuns.length === contract.workflows.length &&
    isBillingLockShape(selectedRuns, input.jobsByRun || {}, input.annotationsByJob || {});

  const workflowEvidence = [];
  for (const workflow of contract.workflows) {
    const run = latestByName.get(workflow.name);
    if (!run) continue;
    const jobs = (input.jobsByRun && input.jobsByRun[run.id]) || [];
    const executedStepCount = jobs.reduce(
      (total, job) => total + (Array.isArray(job.steps) ? job.steps.length : 0),
      0
    );

    if (run.status !== 'completed') {
      diagnostics.push({ code: 'run_incomplete', workflow: workflow.name, status: run.status });
    } else if (!accepted.has(run.conclusion) && !billingLock) {
      diagnostics.push({ code: 'run_failed', workflow: workflow.name, conclusion: run.conclusion });
    }

    const classification = classifyJobs(workflow, jobs);
    for (const missing of classification.missing) {
      diagnostics.push({ code: 'missing_job', workflow: workflow.name, ...missing });
    }
    if (!contract.allowUnexpectedJobs) {
      for (const job of classification.unexpected) {
        diagnostics.push({ code: 'unexpected_job', workflow: workflow.name, job: job.name });
      }
    }

    for (const job of jobs) {
      if (job.status !== 'completed') {
        diagnostics.push({ code: 'job_incomplete', workflow: workflow.name, job: job.name });
      } else if (!accepted.has(job.conclusion) && !billingLock) {
        diagnostics.push({ code: 'job_failed', workflow: workflow.name, job: job.name });
      }
      if (!Array.isArray(job.steps) || job.steps.length === 0) {
        diagnostics.push({
          code: billingLock ? 'zero_step_billing_lock' : 'zero_step_failure',
          workflow: workflow.name,
          job: job.name,
        });
      }
    }

    workflowEvidence.push({
      name: workflow.name,
      runId: run.id,
      attempt: run.run_attempt,
      status: run.status,
      conclusion: run.conclusion,
      url: run.html_url,
      jobCount: jobs.length,
      executedStepCount,
    });
  }

  const hasExecutedSteps = workflowEvidence.some(workflow => workflow.executedStepCount > 0);
  const validHead = prHeadAtStart === input.expectedHead && input.prHead === input.expectedHead;
  const verdict = billingLock ? 'unavailable' : diagnostics.length === 0 ? 'passed' : 'failed';

  return {
    repository: contract.repository,
    pullRequest: input.pullRequest,
    headSha: input.expectedHead,
    observedAt: input.observedAt,
    verdict,
    reason: billingLock ? 'account_billing_lock' : verdict === 'passed' ? null : diagnostics[0]?.code,
    hostedEvidenceExists: billingLock ? false : validHead && hasExecutedSteps,
    workflows: workflowEvidence,
    diagnostics,
  };
}

function formatCommandFailure(executable, args, stderr) {
  const detail = sanitizeDiagnostic(stderr).trim().slice(0, 500) || 'unknown command failure';
  return `${executable} ${args.join(' ')} failed: ${detail}`;
}

function sanitizeDiagnostic(value) {
  return String(value || '')
    .replace(/(authorization\s*:\s*)(?:bearer|token|basic)\s+\S+/gi, '$1[redacted]')
    .replace(/\b(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9_]+)\b/g, '[redacted]')
    .replace(/\b((?:GH|GITHUB)_TOKEN\s*[=:]\s*)\S+/gi, '$1[redacted]')
    .replace(/(https?:\/\/)[^\s/:@]+:[^\s/@]+@/gi, '$1[redacted]@');
}

function runJsonCommand(executable, args, dependencies = {}) {
  const spawn = dependencies.spawnSync || spawnSync;
  const result = spawn(executable, args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
    windowsHide: true,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(formatCommandFailure(executable, args, result.stderr));
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`${executable} ${args.join(' ')} did not return valid JSON.`);
  }
}

function runTextCommand(executable, args, dependencies = {}) {
  const spawn = dependencies.spawnSync || spawnSync;
  const result = spawn(executable, args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    shell: false,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(formatCommandFailure(executable, args, result.stderr));
  return String(result.stdout).trim();
}

function collectHostedData(options, dependencies = {}) {
  const runJson = dependencies.runJsonCommand || runJsonCommand;
  const runText = dependencies.runTextCommand || runTextCommand;
  const commandDependencies = { spawnSync: dependencies.spawnSync || spawnSync };
  const expectedHead = runText('git', ['rev-parse', 'HEAD'], commandDependencies);
  const pullAtStart = runJson(
    'gh',
    ['api', `repos/${options.repository}/pulls/${options.pullRequest}`],
    commandDependencies
  );
  const runResponse = runJson(
    'gh',
    [
      'api',
      `repos/${options.repository}/actions/runs?head_sha=${expectedHead}&event=pull_request&per_page=100`,
    ],
    commandDependencies
  );
  const runs = runResponse.workflow_runs || [];
  if (Number(runResponse.total_count || 0) > runs.length) {
    throw new Error('Hosted workflow collection exceeded one page; refusing incomplete evidence.');
  }

  const latestRuns = [...selectLatestRuns(runs).values()];
  const jobsByRun = {};
  const annotationsByJob = {};
  for (const run of latestRuns) {
    const jobResponse = runJson(
      'gh',
      ['api', `repos/${options.repository}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`],
      commandDependencies
    );
    const jobs = jobResponse.jobs || [];
    if (Number(jobResponse.total_count || 0) > jobs.length) {
      throw new Error(`Hosted job collection exceeded one page for run ${run.id}.`);
    }
    jobsByRun[run.id] = jobs;

    for (const job of jobs) {
      if (job.conclusion === 'failure' && Array.isArray(job.steps) && job.steps.length === 0) {
        annotationsByJob[job.id] = runJson(
          'gh',
          ['api', `repos/${options.repository}/check-runs/${job.id}/annotations?per_page=100`],
          commandDependencies
        );
      }
    }
  }

  const pullAtEnd = runJson(
    'gh',
    ['api', `repos/${options.repository}/pulls/${options.pullRequest}`],
    commandDependencies
  );
  const localHeadAtEnd = runText('git', ['rev-parse', 'HEAD'], commandDependencies);

  return {
    expectedHead,
    pullRequest: options.pullRequest,
    prHeadAtStart: pullAtStart.head && pullAtStart.head.sha,
    prHead: pullAtEnd.head && pullAtEnd.head.sha,
    localHeadAtEnd,
    runs,
    jobsByRun,
    annotationsByJob,
    observedAt: new Date().toISOString(),
  };
}

function collectHostedEnvelope(options, dependencies = {}) {
  const contract = validateHostedContract(
    dependencies.contract || require('../config/phase43-hosted-ci-contract.json')
  );
  const projectRoot = dependencies.projectRoot || PROJECT_ROOT;
  const resolvePath = dependencies.resolveReceiptPath || resolveReceiptPath;
  const receiptFile = resolvePath(projectRoot, contract, options.receiptPath, {
    mustNotExist: true,
  });
  const collect = dependencies.collectHostedData || collectHostedData;
  const input = collect(
    { ...options, repository: contract.repository },
    dependencies
  );
  const verdict = evaluateHostedVerdict(input, contract);
  if (verdict.verdict !== 'passed' || verdict.hostedEvidenceExists !== true) return verdict;

  if (typeof dependencies.readTracked !== 'function' || typeof dependencies.readCurrent !== 'function') {
    throw new Error('Hosted collection requires tracked and current governed-byte readers.');
  }
  verifyWorkflowTopology(contract, filePath =>
    dependencies.readTracked(input.expectedHead, filePath)
  );
  assertGovernedWorktreeMatchesCommit(contract, input.expectedHead, dependencies);
  const governedDigests = computeGovernedDigests(contract, filePath =>
    dependencies.readTracked(input.expectedHead, filePath)
  );
  const envelope = buildPassedEnvelope(verdict, contract, {
    purpose: options.purpose,
    receiptPath: options.receiptPath,
    governedDigests,
  });
  const writeReceipt = dependencies.writeReceiptAtomic || writeReceiptAtomic;
  writeReceipt(receiptFile, envelope);
  return envelope;
}

function verifyPendingEnvelope(options, dependencies = {}) {
  const contract = validateHostedContract(
    dependencies.contract || require('../config/phase43-hosted-ci-contract.json')
  );
  const projectRoot = dependencies.projectRoot || PROJECT_ROOT;
  const resolvePath = dependencies.resolveReceiptPath || resolveReceiptPath;
  const receiptFile = resolvePath(projectRoot, contract, options.receiptPath, { mustExist: true });
  if (typeof dependencies.readFile !== 'function') {
    throw new Error('Pending hosted verification requires a receipt reader.');
  }
  const envelope = validateHostedEnvelope(
    parseJsonBytes(dependencies.readFile(receiptFile), 'Hosted CI envelope'),
    contract
  );
  if (envelope.receiptPath !== options.receiptPath || envelope.pullRequest !== options.pullRequest) {
    throw new Error('Pending hosted envelope does not match CLI path and pull request authority.');
  }
  if (typeof dependencies.getHead !== 'function' || envelope.checkedCommit !== dependencies.getHead()) {
    throw new Error('Pending hosted envelope checked commit must equal current HEAD.');
  }
  if (typeof dependencies.isTracked !== 'function' || dependencies.isTracked(options.receiptPath)) {
    throw new Error('Pending hosted envelope must not already be tracked.');
  }
  if (typeof dependencies.readTracked !== 'function' || typeof dependencies.readCurrent !== 'function') {
    throw new Error('Pending hosted verification requires tracked and current governed-byte readers.');
  }
  verifyWorkflowTopology(contract, filePath =>
    dependencies.readTracked(envelope.checkedCommit, filePath)
  );
  const actualDigests = computeGovernedDigests(contract, filePath =>
    dependencies.readTracked(envelope.checkedCommit, filePath)
  );
  assertGovernedDigestsMatch(actualDigests, envelope.governedDigests);
  assertGovernedWorktreeMatchesCommit(contract, envelope.checkedCommit, dependencies);
  return envelope;
}

function verifyTrackedEnvelope(options, dependencies = {}) {
  if (!/^[0-9a-f]{40}$/.test(options.subjectCommit || '')) {
    throw new Error('Tracked hosted subject commit must be a 40-hex commit ID.');
  }
  if (
    !Number.isInteger(options.pullRequest) ||
    options.pullRequest <= 0 ||
    !isRepositoryRelativePath(options.receiptPath) ||
    !options.receiptPath.endsWith('.json') ||
    !options.receiptPath.startsWith(`${HOSTED_EVIDENCE_DIRECTORY}/`)
  ) {
    throw new Error('Tracked hosted receipt must be beneath the hosted evidence directory.');
  }
  if (typeof dependencies.readTracked !== 'function') {
    throw new Error('Tracked hosted verification requires an exact-commit reader.');
  }
  if (typeof dependencies.isTrackedAt !== 'function' || !dependencies.isTrackedAt(options.subjectCommit, options.receiptPath)) {
    throw new Error('Hosted envelope must be tracked in the subject commit.');
  }
  const envelopeValue = parseJsonBytes(
    dependencies.readTracked(options.subjectCommit, options.receiptPath),
    'Tracked hosted CI envelope'
  );
  if (!/^[0-9a-f]{40}$/.test(envelopeValue.checkedCommit || '')) {
    throw new Error('Tracked hosted envelope checked commit is invalid.');
  }
  const contract = validateHostedContract(
    parseJsonBytes(
      dependencies.readTracked(envelopeValue.checkedCommit, CONTRACT_PATH),
      'Tracked hosted CI contract'
    )
  );
  const envelope = validateHostedEnvelope(envelopeValue, contract);
  if (envelope.receiptPath !== options.receiptPath || envelope.pullRequest !== options.pullRequest) {
    throw new Error('Tracked hosted envelope does not match CLI path and pull request authority.');
  }
  if (
    envelope.checkedCommit === options.subjectCommit ||
    typeof dependencies.isAncestor !== 'function' ||
    !dependencies.isAncestor(envelope.checkedCommit, options.subjectCommit)
  ) {
    throw new Error('Hosted envelope checked commit must be a strict ancestor of the subject commit.');
  }

  verifyWorkflowTopology(contract, filePath =>
    dependencies.readTracked(envelope.checkedCommit, filePath)
  );
  verifyWorkflowTopology(contract, filePath =>
    dependencies.readTracked(options.subjectCommit, filePath)
  );
  const checkedDigests = computeGovernedDigests(contract, filePath =>
    dependencies.readTracked(envelope.checkedCommit, filePath)
  );
  const subjectDigests = computeGovernedDigests(contract, filePath =>
    dependencies.readTracked(options.subjectCommit, filePath)
  );
  assertGovernedDigestsMatch(checkedDigests, envelope.governedDigests);
  assertGovernedDigestsMatch(subjectDigests, envelope.governedDigests);
  return envelope;
}

function writeReceiptAtomic(reportPath, receipt, dependencies = {}) {
  const fileSystem = dependencies.fileSystem || fs;
  const destination = path.resolve(reportPath);
  const serialized = JSON.stringify(receipt, null, 2);
  if (serialized === undefined) throw new TypeError('Hosted receipt must serialize to JSON.');
  fileSystem.mkdirSync(path.dirname(destination), { recursive: true });
  const tempPath = `${destination}.tmp.${process.pid}.${randomUUID()}`;
  fileSystem.writeFileSync(tempPath, `${serialized}\n`, { encoding: 'utf8', flag: 'wx' });
  let linked = false;
  try {
    fileSystem.linkSync(tempPath, destination);
    linked = true;
    fileSystem.unlinkSync(tempPath);
  } catch (error) {
    const cleanupErrors = [];
    if (linked) {
      try {
        fileSystem.unlinkSync(destination);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    try {
      fileSystem.unlinkSync(tempPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') cleanupErrors.push(cleanupError);
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError([error, ...cleanupErrors], 'Hosted receipt publication and cleanup failed.', {
        cause: error,
      });
    }
    throw error;
  }
  return `${serialized}\n`;
}

function parseArgs(args) {
  const queue = args.filter(argument => argument !== '--');
  if (queue.length === 1 && (queue[0] === '--help' || queue[0] === '-h')) return { help: true };

  const modes = new Set(['collect', 'verify-pending', 'verify-receipt']);
  const mode = queue.shift();
  if (!modes.has(mode)) {
    throw new Error('Hosted CI mode must be collect, verify-pending, or verify-receipt.');
  }
  const options = {
    mode,
    pullRequest: null,
    receiptPath: null,
    purpose: null,
    subjectCommit: null,
  };
  const flags = new Map([
    ['--pr', 'pullRequest'],
    ['--receipt', 'receiptPath'],
    ['--purpose', 'purpose'],
    ['--subject', 'subjectCommit'],
  ]);
  const observed = new Set();
  while (queue.length > 0) {
    const flag = queue.shift();
    const key = flags.get(flag);
    const value = queue.shift();
    if (!key || typeof value !== 'string' || value.length === 0 || value.startsWith('--')) {
      throw new Error(`Unknown or incomplete hosted CI argument: ${flag}.`);
    }
    if (observed.has(flag)) throw new Error(`Duplicate hosted CI argument: ${flag}.`);
    observed.add(flag);
    options[key] = key === 'pullRequest' ? Number(value) : value;
  }
  if (!Number.isInteger(options.pullRequest) || options.pullRequest <= 0) {
    throw new Error('--pr requires a positive integer pull request number.');
  }
  if (typeof options.receiptPath !== 'string' || options.receiptPath.length === 0) {
    throw new Error('--receipt requires a repository-relative hosted envelope path.');
  }
  if (mode === 'collect' && (!options.purpose || options.subjectCommit)) {
    throw new Error('collect requires --purpose and does not accept --subject.');
  }
  if (mode === 'verify-pending' && (options.purpose || options.subjectCommit)) {
    throw new Error('verify-pending does not accept --purpose or --subject.');
  }
  if (
    mode === 'verify-receipt' &&
    (options.purpose || !/^[0-9a-f]{40}$/.test(options.subjectCommit || ''))
  ) {
    throw new Error('verify-receipt requires a 40-hex --subject and does not accept --purpose.');
  }
  return options;
}

function createDefaultDependencies(projectRoot = PROJECT_ROOT) {
  const projectSpawn = (command, args, options = {}) =>
    spawnSync(command, args, { ...options, cwd: projectRoot });
  const gitBinary = args => {
    const result = projectSpawn('git', args, {
      encoding: null,
      maxBuffer: 16 * 1024 * 1024,
      shell: false,
      windowsHide: true,
    });
    if (result.error || result.status !== 0) throw new Error('Git hosted-evidence command failed.');
    return result.stdout;
  };
  const gitStatus = (args, falseStatuses = new Set([1])) => {
    const result = projectSpawn('git', args, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      shell: false,
      windowsHide: true,
    });
    if (result.error) throw result.error;
    if (result.status !== 0 && !falseStatuses.has(result.status)) {
      throw new Error('Git hosted-evidence status command failed.');
    }
    return result.status === 0;
  };
  return {
    projectRoot,
    contract: validateHostedContract(
      parseJsonBytes(
        fs.readFileSync(path.join(projectRoot, ...CONTRACT_PATH.split('/'))),
        'Hosted CI contract'
      )
    ),
    spawnSync: projectSpawn,
    readFile: filePath => fs.readFileSync(filePath),
    readCurrent: filePath => fs.readFileSync(path.join(projectRoot, ...filePath.split('/'))),
    readTracked: (commit, filePath) => gitBinary(['show', `${commit}:${filePath}`]),
    getHead: () => runTextCommand('git', ['rev-parse', 'HEAD'], { spawnSync: projectSpawn }),
    isTracked: filePath => gitStatus(['ls-files', '--error-unmatch', '--', filePath]),
    isTrackedAt: (commit, filePath) =>
      gitStatus(['cat-file', '-e', `${commit}:${filePath}`], new Set([1, 128])),
    isAncestor: (ancestor, subject) =>
      gitStatus(['merge-base', '--is-ancestor', ancestor, subject]),
    writeReceiptAtomic,
  };
}

function main(args = process.argv.slice(2), dependencies = {}) {
  const stdout = dependencies.stdout || process.stdout;
  const stderr = dependencies.stderr || process.stderr;
  try {
    const options = parseArgs(args);
    if (options.help) {
      stdout.write(HELP);
      return 0;
    }
    const injectedHandlers = {
      collect: dependencies.collectHostedEnvelope,
      'verify-pending': dependencies.verifyPendingEnvelope,
      'verify-receipt': dependencies.verifyTrackedEnvelope,
    };
    const defaultHandlers = {
      collect: collectHostedEnvelope,
      'verify-pending': verifyPendingEnvelope,
      'verify-receipt': verifyTrackedEnvelope,
    };
    const injectedHandler = injectedHandlers[options.mode];
    const createDependencies = dependencies.createDefaultDependencies || createDefaultDependencies;
    const ports = injectedHandler ? dependencies : { ...createDependencies(), ...dependencies };
    const result = (injectedHandler || defaultHandlers[options.mode])(options, ports);
    if (options.mode === 'collect' && result.verdict !== 'passed') {
      throw new Error(`Hosted CI collection produced ${result.verdict}: ${result.reason || 'no passed evidence'}.`);
    }
    stdout.write(
      `Hosted CI ${options.mode} passed for ${result.checkedCommit} at ${options.receiptPath}.\n`
    );
    return 0;
  } catch (error) {
    stderr.write(`Hosted CI authority failed: ${sanitizeDiagnostic(error.message)}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
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
  verifyWorkflowTopology,
  verifyPendingEnvelope,
  verifyTrackedEnvelope,
  writeReceiptAtomic,
};

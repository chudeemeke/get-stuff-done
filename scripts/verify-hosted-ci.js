'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const { writeJsonFileAtomic } = require('./lib/atomic-json-file');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RECEIPT_PATH = path.join(PROJECT_ROOT, '.planning', 'evidence', 'phase43-hosted-verdict.json');
const BILLING_LOCK_TEXT = 'account is locked due to a billing issue';

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

  for (const workflow of contract.workflows) {
    const run = latestByName.get(workflow.name);
    if (!run) {
      diagnostics.push({ code: 'missing_workflow', workflow: workflow.name });
      continue;
    }
    selectedRuns.push(run);
  }

  if (!contract.allowUnexpectedWorkflows) {
    for (const name of latestByName.keys()) {
      if (!expectedNames.has(name)) diagnostics.push({ code: 'unexpected_workflow', workflow: name });
    }
  }

  const billingLock =
    diagnostics.every(item => item.code !== 'head_mismatch' && item.code !== 'missing_workflow') &&
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

    if (run.head_sha !== input.expectedHead) {
      diagnostics.push({ code: 'run_head_mismatch', workflow: workflow.name, actual: run.head_sha });
    }
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
    schemaVersion: contract.receiptSchemaVersion,
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

  return {
    expectedHead,
    pullRequest: options.pullRequest,
    prHeadAtStart: pullAtStart.head && pullAtStart.head.sha,
    prHead: pullAtEnd.head && pullAtEnd.head.sha,
    runs,
    jobsByRun,
    annotationsByJob,
    observedAt: new Date().toISOString(),
  };
}

function writeReceiptAtomic(reportPath, receipt) {
  return writeJsonFileAtomic(path.resolve(reportPath), receipt);
}

function parseArgs(args) {
  const options = { pullRequest: null };
  const queue = [...args];
  while (queue.length > 0) {
    const argument = queue.shift();
    if (argument === '--') continue;
    if (argument === '--pr') options.pullRequest = Number(queue.shift());
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!Number.isInteger(options.pullRequest) || options.pullRequest <= 0) {
    throw new Error('--pr requires a positive integer pull request number.');
  }
  return options;
}

function createUnavailableReceipt(contract, options, error, expectedHead = null) {
  const message = sanitizeDiagnostic(error.message);
  return {
    schemaVersion: contract.receiptSchemaVersion,
    repository: contract.repository,
    pullRequest: options.pullRequest,
    headSha: expectedHead,
    observedAt: new Date().toISOString(),
    verdict: 'unavailable',
    reason: 'collection_error',
    hostedEvidenceExists: false,
    workflows: [],
    diagnostics: [{ code: 'collection_error', message }],
  };
}

function main(args = process.argv.slice(2), dependencies = {}) {
  const stdout = dependencies.stdout || process.stdout;
  const stderr = dependencies.stderr || process.stderr;
  const writeReceipt = dependencies.writeReceiptAtomic || writeReceiptAtomic;
  let options;
  let contract;

  try {
    options = parseArgs(args);
    contract = dependencies.contract || require('../config/phase43-hosted-ci-contract.json');
    options.reportPath = RECEIPT_PATH;
    if (contract.receiptPath !== '.planning/evidence/phase43-hosted-verdict.json') {
      throw new Error('Hosted verdict receipt path does not match the project-owned evidence path.');
    }
    options.repository = contract.repository;
    const input = (dependencies.collectHostedData || collectHostedData)(options, dependencies);
    const receipt = evaluateHostedVerdict(input, contract);
    writeReceipt(options.reportPath, receipt);
    stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    return receipt.verdict === 'passed' ? 0 : 1;
  } catch (error) {
    if (!options || !contract) {
      stderr.write(`Hosted CI verdict failed: ${sanitizeDiagnostic(error.message)}\n`);
      return 1;
    }
    const receipt = createUnavailableReceipt(contract, options, error);
    writeReceipt(options.reportPath, receipt);
    stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    stderr.write(`Hosted CI verdict unavailable: ${receipt.diagnostics[0].message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  collectHostedData,
  evaluateHostedVerdict,
  expandJobMatrices,
  main,
  parseArgs,
  runJsonCommand,
  runTextCommand,
  selectLatestRuns,
  writeReceiptAtomic,
};

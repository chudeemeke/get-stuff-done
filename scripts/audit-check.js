#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const Ajv = require('ajv');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_SUPPRESSIONS_FILE = path.join(PROJECT_ROOT, '.planning', 'audits', 'suppressions.json');
const SCHEMA_FILE = path.join(PROJECT_ROOT, 'config', 'suppressions.schema.json');
const MAX_REVIEW_TTL_DAYS = 60;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function normalizeSeverity(severity) {
  return severity === 'medium' ? 'moderate' : severity;
}

function parseDateOnly(value, fieldName, id) {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!match) {
    throw new Error(`Suppression for ${id || '(unknown)'} has invalid ${fieldName}; expected YYYY-MM-DD`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Suppression for ${id || '(unknown)'} has invalid ${fieldName}; expected a real calendar date`);
  }

  return date;
}

function addCalendarDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function formatAjvError(error) {
  if (error.keyword === 'required') {
    return `Missing required field: ${error.params.missingProperty}`;
  }

  if (error.keyword === 'additionalProperties') {
    return `Unexpected additional property: ${error.params.additionalProperty}`;
  }

  const location = error.instancePath || '(root)';
  return `${location} ${error.message}`;
}

function compileSchema() {
  const schema = readJson(SCHEMA_FILE);
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function validateSuppressions(suppressions, options = {}) {
  const today = parseDateOnly(options.today || todayDateOnly(), 'today', 'validation-clock');
  const validate = options.validate || compileSchema();
  const errors = [];

  if (!validate(suppressions)) {
    errors.push(...(validate.errors || []).map(formatAjvError));
  }

  const normalized = Array.isArray(suppressions)
    ? suppressions.map(entry => ({
        ...entry,
        severity: normalizeSeverity(entry.severity),
      }))
    : [];

  for (const entry of normalized) {
    if (!entry || typeof entry !== 'object') continue;
    if (!entry.id || !entry.reviewedDate || !entry.reReviewDate) continue;

    let reviewedDate;
    let reReviewDate;
    try {
      reviewedDate = parseDateOnly(entry.reviewedDate, 'reviewedDate', entry.id);
      reReviewDate = parseDateOnly(entry.reReviewDate, 'reReviewDate', entry.id);
    } catch (err) {
      errors.push(err.message);
      continue;
    }

    if (reReviewDate < today) {
      errors.push(
        `Suppression for ${entry.id} expired ${entry.reReviewDate}; re-review and update or remove the entry in .planning/audits/suppressions.json`
      );
    }

    const maxReReviewDate = addCalendarDays(reviewedDate, MAX_REVIEW_TTL_DAYS);
    if (reReviewDate > maxReReviewDate) {
      errors.push(
        `Suppression for ${entry.id} has reReviewDate ${entry.reReviewDate} more than ${MAX_REVIEW_TTL_DAYS} calendar days after reviewedDate ${entry.reviewedDate}; reviewedDate and reReviewDate must be no more than ${MAX_REVIEW_TTL_DAYS} calendar days apart`
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    suppressions: normalized,
  };
}

function buildAuditCiAllowlist(suppressions) {
  return suppressions.map(entry => entry.id);
}

function buildAuditCiConfig(suppressions) {
  return {
    high: true,
    critical: true,
    moderate: false,
    low: false,
    'package-manager': 'npm',
    allowlist: buildAuditCiAllowlist(suppressions),
  };
}

function writeTempAuditCiConfig(config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-audit-ci-'));
  const filePath = path.join(dir, 'audit-ci.json');
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  return { dir, filePath };
}

function findAuditCiBin(projectRoot = PROJECT_ROOT) {
  const binDir = path.join(projectRoot, 'node_modules', '.bin');
  const candidates = process.platform === 'win32'
    ? ['audit-ci.cmd', 'audit-ci.ps1', 'audit-ci']
    : ['audit-ci'];

  for (const candidate of candidates) {
    const bin = path.join(binDir, candidate);
    if (fs.existsSync(bin)) {
      return bin;
    }
  }

  return null;
}

function assertPackageLock(projectRoot = PROJECT_ROOT) {
  const lockPath = path.join(projectRoot, 'package-lock.json');
  if (!fs.existsSync(lockPath)) {
    throw new Error(
      'package-lock.json is required for audit-ci. Run npm install --package-lock-only --ignore-scripts, then rerun bun run audit:ci.'
    );
  }
}

function runAuditCi(configPath, options = {}) {
  const auditCiBin = options.auditCiBin || findAuditCiBin(options.projectRoot || PROJECT_ROOT);
  if (!auditCiBin) {
    throw new Error('audit-ci binary not found in node_modules/.bin; run bun install --ignore-scripts first.');
  }

  const result = spawnSync(
    auditCiBin,
    ['--config', configPath],
    {
      cwd: options.projectRoot || PROJECT_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  if (result.error) {
    throw result.error;
  }

  return result.status === null ? 1 : result.status;
}

function parseArgs(argv) {
  const options = {
    suppressionsFile: DEFAULT_SUPPRESSIONS_FILE,
    validateOnly: false,
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--suppressions-file' && argv[i + 1]) {
      options.suppressionsFile = path.resolve(argv[i + 1]);
      i++;
    } else if (argv[i] === '--validate-only') {
      options.validateOnly = true;
    }
  }

  return options;
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const suppressions = readJson(options.suppressionsFile);
  const result = validateSuppressions(suppressions);

  if (!result.ok) {
    for (const error of result.errors) {
      process.stderr.write(`${error}\n`);
    }
    return 1;
  }

  process.stdout.write(`Validated ${result.suppressions.length} audit suppressions\n`);

  if (options.validateOnly) {
    return 0;
  }

  try {
    assertPackageLock();
    const { dir, filePath } = writeTempAuditCiConfig(buildAuditCiConfig(result.suppressions));
    const status = runAuditCi(filePath);
    fs.rmSync(dir, { recursive: true, force: true });
    return status;
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  DEFAULT_SUPPRESSIONS_FILE,
  MAX_REVIEW_TTL_DAYS,
  buildAuditCiAllowlist,
  buildAuditCiConfig,
  findAuditCiBin,
  main,
  parseArgs,
  runAuditCi,
  validateSuppressions,
  writeTempAuditCiConfig,
};

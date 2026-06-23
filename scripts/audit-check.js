#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
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

  process.stderr.write('Audit execution is not wired yet; run with --validate-only for schema validation.\n');
  return 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  DEFAULT_SUPPRESSIONS_FILE,
  MAX_REVIEW_TTL_DAYS,
  buildAuditCiAllowlist,
  main,
  parseArgs,
  validateSuppressions,
};

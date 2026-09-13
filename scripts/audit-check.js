#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const Ajv = require('ajv');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_SUPPRESSIONS_FILE = path.join(PROJECT_ROOT, '.planning', 'audits', 'suppressions.json');
const SCHEMA_FILE = path.join(PROJECT_ROOT, 'config', 'suppressions.schema.json');
const MAX_REVIEW_TTL_DAYS = 60;
const MAX_AUDIT_JSON_BYTES = 1024 * 1024;
const AUDIT_SEVERITIES = new Set(['low', 'moderate', 'high', 'critical']);
const AUDIT_FINDING_KEYS = new Set([
  'id',
  'url',
  'title',
  'severity',
  'vulnerable_versions',
  'cwe',
  'cvss',
]);
const CVSS_KEYS = new Set(['score', 'vectorString']);

function hasExactKeys(value, expected) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === expected.size &&
    Object.keys(value).every(key => expected.has(key))
  );
}

function isBoundedString(value, maxLength) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function canonicalGhsaId(url) {
  if (!isBoundedString(url, 100)) return null;
  const match = /^https:\/\/github\.com\/advisories\/(GHSA-[23456789cfghjmpqrvwx]{4}-[23456789cfghjmpqrvwx]{4}-[23456789cfghjmpqrvwx]{4})$/.exec(
    url
  );
  return match ? match[1] : null;
}

function validateAuditFinding(packageName, finding) {
  const ghsaId = canonicalGhsaId(finding?.url);
  const validCwe =
    Array.isArray(finding?.cwe) &&
    finding.cwe.length <= 20 &&
    finding.cwe.every(
      value => isBoundedString(value, 20) && /^CWE-[0-9]{1,6}$/.test(value)
    );
  const validCvss =
    hasExactKeys(finding?.cvss, CVSS_KEYS) &&
    Number.isFinite(finding.cvss.score) &&
    finding.cvss.score >= 0 &&
    finding.cvss.score <= 10 &&
    (finding.cvss.vectorString === null || isBoundedString(finding.cvss.vectorString, 200));

  if (
    !hasExactKeys(finding, AUDIT_FINDING_KEYS) ||
    !Number.isSafeInteger(finding.id) ||
    finding.id <= 0 ||
    !ghsaId ||
    !isBoundedString(finding.title, 500) ||
    !AUDIT_SEVERITIES.has(finding.severity) ||
    !isBoundedString(finding.vulnerable_versions, 500) ||
    !validCwe ||
    !validCvss
  ) {
    throw new Error(`Bun audit finding schema is invalid for package ${packageName}.`);
  }

  return { package: packageName, ghsaId, ...finding };
}

function parseBunAuditJson(input) {
  if (!isBoundedString(input, MAX_AUDIT_JSON_BYTES)) {
    throw new Error('Bun audit JSON is empty or exceeds the size limit.');
  }

  let report;
  try {
    report = JSON.parse(input);
  } catch {
    throw new Error('Bun audit output is not valid JSON.');
  }

  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('Bun audit report schema is invalid.');
  }

  const entries = Object.entries(report);
  if (entries.length > 1000) {
    throw new Error('Bun audit report exceeds the package limit.');
  }

  return entries.flatMap(([packageName, findings]) => {
    if (
      !isBoundedString(packageName, 214) ||
      // eslint-disable-next-line security/detect-unsafe-regex -- package names are hard-capped at 214 bytes before matching.
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(packageName) ||
      !Array.isArray(findings) ||
      findings.length === 0 ||
      findings.length > 100
    ) {
      throw new Error(`Bun audit package entry is invalid: ${packageName || '(empty)'}.`);
    }
    return findings.map(finding => validateAuditFinding(packageName, finding));
  });
}

function evaluateAuditFindings(findings, suppressions) {
  if (!Array.isArray(findings) || !Array.isArray(suppressions)) {
    throw new Error('Audit findings and suppressions must be arrays.');
  }
  const suppressionById = new Map(suppressions.map(entry => [entry.id, entry]));
  const suppressed = [];
  const blocking = [];
  for (const finding of findings) {
    if (!['high', 'critical'].includes(finding.severity)) continue;
    const suppression = suppressionById.get(finding.ghsaId);
    if (suppression && suppression.severity === finding.severity) {
      suppressed.push({ ...finding, suppression });
    } else {
      blocking.push(finding);
    }
  }
  return {
    ok: blocking.length === 0,
    findings,
    blocking,
    suppressed,
  };
}

function runBunAudit(options) {
  const config = {
    spawnSync,
    bunCommand: 'bun',
    projectRoot: PROJECT_ROOT,
    ...options,
  };
  const expectedVersion = config.expectedVersion;
  if (!isBoundedString(expectedVersion, 50)) {
    throw new Error('Expected Bun version authority is missing.');
  }
  const commandOptions = {
    cwd: config.projectRoot,
    encoding: 'utf-8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  };
  const versionResult = config.spawnSync(config.bunCommand, ['--version'], commandOptions);
  if (versionResult.error || versionResult.status !== 0) {
    throw new Error('Bun version attestation failed.');
  }
  if (String(versionResult.stdout || '').trim() !== expectedVersion) {
    throw new Error('Bun runtime does not match the repository version authority.');
  }

  const auditResult = config.spawnSync(
    config.bunCommand,
    ['audit', '--json'],
    commandOptions
  );
  if (auditResult.error || ![0, 1].includes(auditResult.status)) {
    throw new Error('Bun audit command failed before producing an authoritative report.');
  }
  const findings = parseBunAuditJson(String(auditResult.stdout || ''));
  if (
    (auditResult.status === 0 && findings.length !== 0) ||
    (auditResult.status === 1 && findings.length === 0)
  ) {
    throw new Error('Bun audit exit status and report findings disagree.');
  }
  return findings;
}

function readJson(filePath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- operator-selected local policy is read-only and schema-validated.
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readPinnedBunVersion() {
  return fs.readFileSync(path.join(PROJECT_ROOT, '.bun-version'), 'utf-8').trim();
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
    ? suppressions.map(entry =>
        entry && typeof entry === 'object' && !Array.isArray(entry)
          ? {
              ...entry,
              severity: normalizeSeverity(entry.severity),
            }
          : entry
      )
    : [];
  const seenSuppressionIds = new Set();

  for (const entry of normalized) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.id) {
      if (seenSuppressionIds.has(entry.id)) {
        errors.push(`Duplicate suppression for ${entry.id} is not allowed`);
      } else {
        seenSuppressionIds.add(entry.id);
      }
    }
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

function parseArgs(argv) {
  const options = {
    suppressionsFile: DEFAULT_SUPPRESSIONS_FILE,
    validateOnly: false,
  };

  const pending = [...argv];
  while (pending.length > 0) {
    const argument = pending.shift();
    if (argument === '--suppressions-file' && pending.length > 0) {
      options.suppressionsFile = path.resolve(pending.shift());
    } else if (argument === '--validate-only') {
      options.validateOnly = true;
    }
  }

  return options;
}

function main(argv, dependencies) {
  const ports = {
    projectRoot: PROJECT_ROOT,
    readJson,
    readBunVersion: readPinnedBunVersion,
    runBunAudit,
    validationOptions: undefined,
    writeOutput: process.stdout.write.bind(process.stdout),
    writeError: process.stderr.write.bind(process.stderr),
    ...dependencies,
  };
  try {
    const options = parseArgs(argv);
    const suppressions = ports.readJson(options.suppressionsFile);
    const result = validateSuppressions(suppressions, ports.validationOptions);

    if (!result.ok) {
      for (const error of result.errors) ports.writeError(`${error}\n`);
      return 1;
    }
    ports.writeOutput(`Validated ${result.suppressions.length} audit suppressions\n`);
    if (options.validateOnly) return 0;

    const findings = ports.runBunAudit({
      expectedVersion: ports.readBunVersion(),
      projectRoot: ports.projectRoot,
    });
    const verdict = evaluateAuditFindings(findings, result.suppressions);
    ports.writeOutput(
      `Bun audit: ${verdict.findings.length} finding(s), ${verdict.blocking.length} blocking, ${verdict.suppressed.length} suppressed\n`
    );
    for (const finding of verdict.suppressed) {
      ports.writeOutput(
        `SUPPRESSED ${finding.severity} ${finding.ghsaId} ${finding.package} reviewed by ${finding.suppression.reviewer}\n`
      );
    }
    for (const finding of verdict.blocking) {
      ports.writeError(
        `BLOCKING ${finding.severity} ${finding.ghsaId} ${finding.package}\n`
      );
    }
    return verdict.ok ? 0 : 1;
  } catch (err) {
    ports.writeError(`${err.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  DEFAULT_SUPPRESSIONS_FILE,
  MAX_REVIEW_TTL_DAYS,
  evaluateAuditFindings,
  main,
  parseBunAuditJson,
  parseArgs,
  runBunAudit,
  validateSuppressions,
};

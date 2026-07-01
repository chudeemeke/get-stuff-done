#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SEVERITY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

const LABEL_BY_SEVERITY = {
  critical: 'security-critical',
  high: 'security-high',
  medium: 'security-moderate',
  low: 'security-low',
  unknown: 'security-unknown',
};

function parseArgs(argv) {
  const options = {
    input: null,
    output: null,
    failOn: new Set(),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' && argv[i + 1]) {
      options.input = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      options.output = argv[++i];
    } else if (arg === '--fail-on' && argv[i + 1]) {
      options.failOn = new Set(
        argv[++i]
          .split(',')
          .map(normalizeSeverity)
          .filter(severity => severity !== 'unknown')
      );
    }
  }

  return options;
}

function normalizeSeverity(value) {
  if (value === null || value === undefined) return 'unknown';

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'moderate') return 'medium';
  if (normalized in SEVERITY_RANK) return normalized;

  const numeric = Number(normalized);
  if (!Number.isNaN(numeric)) {
    return severityFromScore(numeric);
  }

  return 'unknown';
}

function severityFromScore(score) {
  if (score >= 9) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  if (score > 0) return 'low';
  return 'unknown';
}

function severityFromVulnerability(vulnerability) {
  const candidates = [
    vulnerability?.database_specific?.severity,
    vulnerability?.ecosystem_specific?.severity,
    vulnerability?.severity,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const severities = candidate
        .map(entry => normalizeSeverity(entry?.score ?? entry?.severity ?? entry?.type))
        .filter(severity => severity !== 'unknown');
      if (severities.length > 0) {
        return severities.sort((a, b) => SEVERITY_RANK[b] - SEVERITY_RANK[a])[0];
      }
    } else {
      const severity = normalizeSeverity(candidate);
      if (severity !== 'unknown') return severity;
    }
  }

  return 'unknown';
}

function normalizePackage(pkg, source) {
  const packageInfo = pkg?.package || {};
  return {
    name: packageInfo.name || '(unknown package)',
    version: packageInfo.version || '(unknown version)',
    ecosystem: packageInfo.ecosystem || '(unknown ecosystem)',
    sourcePath: source?.path || '(unknown source)',
  };
}

function buildBody({ id, severity, packageName, packageVersion, ecosystem, sourcePath, summary, aliases }) {
  const lines = [
    '## OSV Finding',
    '',
    `- ID: ${id}`,
    `- Severity: ${severity}`,
    `- Package: ${packageName}@${packageVersion}`,
    `- Ecosystem: ${ecosystem}`,
    `- Source: ${sourcePath}`,
    '',
  ];

  if (summary) {
    lines.push(summary, '');
  }

  if (aliases.length > 0) {
    lines.push(`Aliases: ${aliases.join(', ')}`, '');
  }

  lines.push(
    'Review through SECURITY.md triage policy and .planning/audits/suppressions.json if suppression is justified.'
  );

  return lines.join('\n');
}

function normalizeOsvResults(osvResults) {
  const findingsByKey = new Map();

  for (const result of osvResults?.results || []) {
    const source = result.source || {};
    for (const pkg of result.packages || []) {
      const packageInfo = normalizePackage(pkg, source);
      for (const vulnerability of pkg.vulnerabilities || []) {
        const id = vulnerability.id || '(unknown vulnerability)';
        const key = `${id}\u0000${packageInfo.name}`;
        if (findingsByKey.has(key)) continue;

        const severity = severityFromVulnerability(vulnerability);
        const aliases = Array.isArray(vulnerability.aliases)
          ? [...new Set(vulnerability.aliases)].sort()
          : [];
        const summary = vulnerability.summary || vulnerability.details || '';

        findingsByKey.set(key, {
          id,
          packageName: packageInfo.name,
          packageVersion: packageInfo.version,
          ecosystem: packageInfo.ecosystem,
          sourcePath: packageInfo.sourcePath,
          severity,
          title: `OSV ${severity}: ${id} in ${packageInfo.name}`,
          labels: ['security', LABEL_BY_SEVERITY[severity], 'osv', 'dependency'],
          body: buildBody({
            id,
            severity,
            packageName: packageInfo.name,
            packageVersion: packageInfo.version,
            ecosystem: packageInfo.ecosystem,
            sourcePath: packageInfo.sourcePath,
            summary,
            aliases,
          }),
        });
      }
    }
  }

  return [...findingsByKey.values()].sort((a, b) => {
    const severityDelta = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (severityDelta !== 0) return severityDelta;
    const packageDelta = a.packageName.localeCompare(b.packageName);
    if (packageDelta !== 0) return packageDelta;
    return a.id.localeCompare(b.id);
  });
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

  if (!options.input || !options.output) {
    process.stderr.write('Usage: node scripts/osv-triage.js --input <json> --output <json> [--fail-on high,critical]\n');
    return 2;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(options.input, 'utf-8'));
  } catch (err) {
    process.stderr.write(`Unable to read OSV input ${options.input}: ${err.message}\n`);
    return 1;
  }

  const findings = normalizeOsvResults(parsed);
  writeJson(options.output, findings);

  const blocking = findings.filter(finding => options.failOn.has(finding.severity));
  if (blocking.length > 0) {
    process.stderr.write(`Blocking OSV findings: ${blocking.map(finding => finding.id).join(', ')}\n`);
    return 1;
  }

  process.stdout.write(`Wrote ${findings.length} OSV triage finding(s) to ${options.output}\n`);
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  main,
  normalizeOsvResults,
  normalizeSeverity,
  parseArgs,
  severityFromVulnerability,
};

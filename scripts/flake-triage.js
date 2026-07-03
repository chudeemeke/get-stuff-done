#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename, security/detect-object-injection -- CI flake triage reads repo-local artifact paths and structured event objects supplied by the workflow; behavior is covered by tests and validation commands */

const fs = require('fs');
const path = require('path');

const REL03_REASON_PATTERN = /REL-03-\d+:\s+https?:\/\/[^\s'")]+,\s+deadline\s+\d{4}-\d{2}-\d{2}/;
const BUN_REL03_WRAPPER_PATTERN = /test\.skip\.if\(\s*isWindows\s*,\s*\{\s*reason:\s*(['"`])REL-03-\d+:\s+https?:\/\/[^\s'"`)]+,\s+deadline\s+\d{4}-\d{2}-\d{2}\1\s*\}/;
const NODE_REL03_WRAPPER_PATTERN = /\b(?:t|ctx)\.skip\(\s*(['"`])REL-03-\d+:\s+https?:\/\/[^\s'"`)]+,\s+deadline\s+\d{4}-\d{2}-\d{2}\1\s*\)/;

function parseArgs(argv) {
  const options = {
    junit: null,
    platform: null,
    runUrl: null,
    commit: null,
    output: null,
    scanRel03: false,
    outputSummary: null,
    validateRel03Wrappers: false,
    sourceRoot: process.cwd(),
    recentHits: 1,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--junit' && argv[i + 1]) {
      options.junit = argv[++i];
    } else if (arg === '--platform' && argv[i + 1]) {
      options.platform = argv[++i];
    } else if (arg === '--run-url' && argv[i + 1]) {
      options.runUrl = argv[++i];
    } else if (arg === '--commit' && argv[i + 1]) {
      options.commit = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      options.output = argv[++i];
    } else if (arg === '--scan-rel03') {
      options.scanRel03 = true;
    } else if (arg === '--output-summary' && argv[i + 1]) {
      options.outputSummary = argv[++i];
    } else if (arg === '--validate-rel03-wrappers') {
      options.validateRel03Wrappers = true;
    } else if (arg === '--source-root' && argv[i + 1]) {
      options.sourceRoot = argv[++i];
    } else if (arg === '--recent-hits' && argv[i + 1]) {
      options.recentHits = Number(argv[++i]);
    }
  }

  return options;
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function stripXmlTags(value) {
  return decodeXml(String(value || '').replace(/<[^>]+>/g, '')).trim();
}

function parseAttributes(source) {
  const attributes = {};
  const attrPattern = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let match;

  while ((match = attrPattern.exec(source)) !== null) {
    attributes[match[1]] = decodeXml(match[2]);
  }

  return attributes;
}

function flakeFileBase(testFilePath) {
  const base = path.basename(testFilePath || 'unknown')
    .replace(/\.test\.(?:cjs|mjs|js|ts|tsx)$/i, '')
    .replace(/\.[^.]+$/, '');
  const normalized = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'unknown';
}

function buildFlakeLabels({ testFilePath, platform, recentHits = 1 }) {
  const labels = [
    'flake-report',
    `flake-platform-${String(platform || 'unknown').toLowerCase()}`,
    `flake-file-${flakeFileBase(testFilePath)}`,
  ];

  if (Number(recentHits) >= 3) {
    labels.push('rel-03-candidate');
  }

  return labels;
}

function parseJunitFailures(xml, options = {}) {
  const platform = options.platform || 'unknown';
  const testcasePattern = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g;
  const failures = [];
  let testcaseMatch;

  while ((testcaseMatch = testcasePattern.exec(xml)) !== null) {
    const testcaseAttrs = parseAttributes(testcaseMatch[1]);
    const body = testcaseMatch[2];
    const failureMatch = /<(failure|error)\b([^>]*)>([\s\S]*?)<\/\1>/.exec(body);
    if (!failureMatch) continue;

    const failureAttrs = parseAttributes(failureMatch[2]);
    const testFilePath = testcaseAttrs.file || testcaseAttrs.classname || testcaseAttrs.name || '(unknown test file)';
    const testName = testcaseAttrs.name || '(unknown test)';
    const failureMessage = failureAttrs.message || stripXmlTags(failureMatch[3]);
    const key = `${testFilePath}::${testName}::${platform}`;

    failures.push({
      key,
      title: `Flake: ${key}`,
      testFilePath,
      testName,
      platform,
      labels: buildFlakeLabels({
        testFilePath,
        platform,
        recentHits: options.recentHits,
      }),
      runUrl: options.runUrl || '',
      commit: options.commit || '',
      failureMessage,
    });
  }

  return failures;
}

function walkFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'coverage']);
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...walkFiles(fullPath));
      }
    } else if (/\.(?:js|cjs|mjs|ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function relativePath(sourceRoot, filePath) {
  return path.relative(sourceRoot, filePath).replace(/\\/g, '/');
}

function parseRel03Line(sourceRoot, filePath, line, lineNumber) {
  const idMatch = /\bREL-03-\d+\b/.exec(line);
  if (!idMatch) return null;

  const issueMatch = /(https?:\/\/[^\s'")]+)/.exec(line);
  const deadlineMatch = /deadline\s+(\d{4}-\d{2}-\d{2})/.exec(line);

  return {
    id: idMatch[0],
    file: relativePath(sourceRoot, filePath),
    line: lineNumber,
    issueUrl: issueMatch ? issueMatch[1].replace(/,$/, '') : '',
    deadline: deadlineMatch ? deadlineMatch[1] : '',
    validWrapper: BUN_REL03_WRAPPER_PATTERN.test(line) || NODE_REL03_WRAPPER_PATTERN.test(line),
    raw: line.trim(),
  };
}

function scanRel03Skips({ sourceRoot = process.cwd() } = {}) {
  const skips = [];

  for (const filePath of walkFiles(sourceRoot)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!line.includes('REL-03-')) return;
      const parsed = parseRel03Line(sourceRoot, filePath, line, index + 1);
      if (parsed) skips.push(parsed);
    });
  }

  return skips;
}

function formatRel03Summary(skips) {
  if (skips.length === 0) {
    return '### Active REL-03 skips\n\nNone.\n';
  }

  const lines = [
    '### Active REL-03 skips',
    '',
    '| ID | File | Issue | Deadline |',
    '| --- | --- | --- | --- |',
  ];

  for (const skip of skips) {
    lines.push(`| ${skip.id} | ${skip.file} | ${skip.issueUrl || 'missing'} | ${skip.deadline || 'missing'} |`);
  }

  return `${lines.join('\n')}\n`;
}

function validateRel03Wrappers({ sourceRoot = process.cwd() } = {}) {
  const violations = scanRel03Skips({ sourceRoot })
    .filter(skip => !skip.validWrapper || !REL03_REASON_PATTERN.test(skip.raw))
    .map(skip => `${skip.file}:${skip.line} ${skip.id} must use test.skip.if(isWindows, { reason: 'REL-03-N: <issue-url>, deadline YYYY-MM-DD' }) or supported node:test equivalent`);

  return {
    ok: violations.length === 0,
    violations,
  };
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

  if (options.junit) {
    if (!options.platform || !options.output) {
      process.stderr.write('Usage: node scripts/flake-triage.js --junit <file> --platform <platform> --run-url <url> --commit <sha> --output <json>\n');
      return 2;
    }

    const xml = fs.readFileSync(options.junit, 'utf-8');
    const events = parseJunitFailures(xml, {
      platform: options.platform,
      runUrl: options.runUrl,
      commit: options.commit,
      recentHits: options.recentHits,
    });
    writeJson(options.output, events);
    return 0;
  }

  if (options.scanRel03) {
    const skips = scanRel03Skips({ sourceRoot: options.sourceRoot });
    const summary = formatRel03Summary(skips);
    if (options.outputSummary) {
      writeFile(options.outputSummary, summary);
    } else {
      process.stdout.write(summary);
    }
    return 0;
  }

  if (options.validateRel03Wrappers) {
    const result = validateRel03Wrappers({ sourceRoot: options.sourceRoot });
    if (!result.ok) {
      process.stderr.write(`${result.violations.join('\n')}\n`);
      return 1;
    }
    return 0;
  }

  process.stderr.write('Usage: node scripts/flake-triage.js --junit <file> ... | --scan-rel03 | --validate-rel03-wrappers\n');
  return 2;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  buildFlakeLabels,
  formatRel03Summary,
  main,
  parseJunitFailures,
  scanRel03Skips,
  validateRel03Wrappers,
};

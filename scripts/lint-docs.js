#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const EXCLUDED_PREFIXES = [
  'node_modules/',
  'dist/',
  '.upstream/',
  'overlay/get-shit-done/',
];
const MAX_BATCH_CHARS = 24000;

function normalizeGitPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function isExcluded(filePath) {
  const normalized = normalizeGitPath(filePath);
  return EXCLUDED_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

function runGitLsFiles() {
  const result = spawnSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-z', '--', '*.md'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const details = `${result.stdout || ''}${result.stderr || ''}`.trim();
    throw new Error(`git ls-files failed${details ? `: ${details}` : ''}`);
  }

  return result.stdout
    .split('\0')
    .map(line => line.trim())
    .filter(Boolean)
    .map(normalizeGitPath)
    .filter(filePath => !isExcluded(filePath));
}

function resolveMarkdownlintCli() {
  const cliPath = path.join(PROJECT_ROOT, 'node_modules', 'markdownlint-cli2', 'markdownlint-cli2-bin.mjs');
  if (!fs.existsSync(cliPath)) {
    throw new Error('markdownlint-cli2 is not installed; run bun install --frozen-lockfile --ignore-scripts');
  }
  return cliPath;
}

function toLiteralMarkdownlintPath(filePath) {
  return `:${filePath}`;
}

function createBatches(files) {
  const batches = [];
  let current = [];
  let currentChars = 0;

  for (const file of files) {
    const literalPath = toLiteralMarkdownlintPath(file);
    const nextChars = currentChars + literalPath.length + 1;
    if (current.length > 0 && nextChars > MAX_BATCH_CHARS) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(literalPath);
    currentChars += literalPath.length + 1;
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

function runMarkdownlint(files) {
  if (files.length === 0) {
    process.stdout.write('No tracked markdown files found.\n');
    return 0;
  }

  const cliPath = resolveMarkdownlintCli();
  let status = 0;

  for (const batch of createBatches(files)) {
    const result = spawnSync(process.execPath, [
      cliPath,
      '--config',
      '.markdownlint-cli2.yaml',
      ...batch,
    ], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });

    if (result.error) throw result.error;
    if (result.status !== 0) status = result.status || 1;
  }

  return status;
}

function main() {
  try {
    const files = runGitLsFiles();
    return runMarkdownlint(files);
  } catch (error) {
    process.stderr.write(`Error [EDOCSLINT]: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  createBatches,
  isExcluded,
  runGitLsFiles,
};

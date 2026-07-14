#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- fixed local CycloneDX binary invocation writes only dist/bom.json. */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'bom.json');

function findCycloneDxExecutable() {
  const base = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'cyclonedx-npm');
  const candidates = process.platform === 'win32'
    ? [`${base}.exe`, `${base}.cmd`, `${base}.bunx`, base]
    : [base, `${base}.bunx`];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { command: candidate, prefixArgs: [] };
    }
  }

  return { command: 'bunx', prefixArgs: ['--bun', 'cyclonedx-npm'] };
}

function buildCycloneDxArgs(outputFile = OUTPUT_FILE) {
  return [
    'package.json',
    '--ignore-npm-errors',
    '--output-format',
    'JSON',
    '--output-file',
    outputFile,
    '--output-reproducible',
    '--validate',
    '--mc-type',
    'application',
  ];
}

function validateBom(outputFile = OUTPUT_FILE) {
  const bom = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
  if (bom.bomFormat !== 'CycloneDX') {
    throw new Error(`Unexpected SBOM format: ${bom.bomFormat || '(missing)'}`);
  }
  return bom;
}

function buildCycloneDxEnv(env = process.env) {
  const next = { ...env };
  delete next.npm_config_user_agent;
  delete next.npm_execpath;
  delete next.npm_node_execpath;
  return next;
}

function generateSbom(options = {}) {
  const outputFile = options.outputFile || OUTPUT_FILE;
  const distDir = path.dirname(outputFile);

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('dist/ not found; run bun run compose before generating the SBOM');
  }

  fs.mkdirSync(distDir, { recursive: true });

  const executable = findCycloneDxExecutable();
  const args = [...executable.prefixArgs, ...buildCycloneDxArgs(outputFile)];
  const result = spawnSync(executable.command, args, {
    cwd: PROJECT_ROOT,
    env: buildCycloneDxEnv(),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    throw new Error([
      `CycloneDX SBOM generation failed with exit ${result.status}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }

  validateBom(outputFile);
  return { outputFile };
}

function main() {
  try {
    const result = generateSbom();
    process.stdout.write(`Generated SBOM: ${path.relative(PROJECT_ROOT, result.outputFile).replace(/\\/g, '/')}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  OUTPUT_FILE,
  buildCycloneDxArgs,
  buildCycloneDxEnv,
  findCycloneDxExecutable,
  generateSbom,
  main,
  validateBom,
};

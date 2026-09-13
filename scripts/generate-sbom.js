#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'dist', 'bom.json');

function findCycloneDxExecutable(options) {
  const config = {
    projectRoot: PROJECT_ROOT,
    platform: process.platform,
    existsSync: fs.existsSync,
    ...options,
  };
  const pathApi = config.platform === 'win32' ? path.win32 : path.posix;
  const base = pathApi.join(
    config.projectRoot,
    'node_modules',
    '.bin',
    'cyclonedx-npm'
  );
  const candidates = config.platform === 'win32'
    ? [`${base}.exe`, `${base}.bunx`]
    : [base, `${base}.bunx`];

  for (const candidate of candidates) {
    if (config.existsSync(candidate)) {
      return { command: candidate, prefixArgs: [] };
    }
  }

  throw new Error('The local CycloneDX executable was not found; run bun install.');
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

function expectedPackageIdentity(packageName) {
  const scoped = /^(@[^/]+)\/(.+)$/.exec(packageName);
  return scoped
    ? { group: scoped[1], name: scoped[2] }
    : { group: undefined, name: packageName };
}

function validateBom(outputFile = OUTPUT_FILE, options) {
  const config = {
    projectRoot: PROJECT_ROOT,
    readFileSync: fs.readFileSync,
    ...options,
  };
  let bom;
  let packageManifest;
  try {
    bom = JSON.parse(config.readFileSync(outputFile, 'utf-8'));
    packageManifest =
      config.packageManifest ||
      JSON.parse(
        config.readFileSync(path.join(config.projectRoot, 'package.json'), 'utf-8')
      );
  } catch {
    throw new Error('CycloneDX SBOM output or package.json is not valid JSON.');
  }

  if (bom.bomFormat !== 'CycloneDX') {
    throw new Error(`Unexpected SBOM format: ${bom.bomFormat || '(missing)'}`);
  }
  if (bom.specVersion !== '1.6') {
    throw new Error(`Unexpected SBOM specification version: ${bom.specVersion || '(missing)'}`);
  }
  if (!Number.isSafeInteger(bom.version) || bom.version < 1) {
    throw new Error('SBOM document version must be a positive integer.');
  }

  const packageIdentityFields = [packageManifest?.name, packageManifest?.version];
  if (
    !packageIdentityFields.every(
      value => typeof value === 'string' && value.length > 0 && value.length <= 214
    )
  ) {
    throw new Error('package.json identity is invalid for SBOM validation.');
  }

  const identity = expectedPackageIdentity(packageManifest.name);
  const component = bom.metadata?.component;
  if (
    !component ||
    component.type !== 'application' ||
    component.group !== identity.group ||
    component.name !== identity.name ||
    component.version !== packageManifest.version
  ) {
    throw new Error('SBOM root component does not match package.json.');
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

function generateSbom(options) {
  const config = {
    projectRoot: PROJECT_ROOT,
    fs,
    env: process.env,
    platform: process.platform,
    spawnSync,
    ...options,
  };
  const canonicalDistDir = path.join(config.projectRoot, 'dist');
  const outputFile = path.resolve(
    config.outputFile || path.join(canonicalDistDir, 'bom.json')
  );
  const relativeOutput = path.relative(canonicalDistDir, outputFile);
  if (
    relativeOutput === '..' ||
    relativeOutput.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeOutput)
  ) {
    throw new Error('CycloneDX output must remain inside the project dist directory.');
  }

  if (!config.fs.existsSync(canonicalDistDir)) {
    throw new Error('dist/ not found; run bun run compose before generating the SBOM');
  }

  config.fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  const executable = findCycloneDxExecutable({
    projectRoot: config.projectRoot,
    platform: config.platform,
    existsSync: config.fs.existsSync.bind(config.fs),
  });
  const args = [...executable.prefixArgs, ...buildCycloneDxArgs(outputFile)];
  const result = config.spawnSync(executable.command, args, {
    cwd: config.projectRoot,
    env: buildCycloneDxEnv(config.env),
    encoding: 'utf-8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result?.error || result?.status !== 0) {
    const status = Number.isInteger(result?.status) ? result.status : 'unavailable';
    throw new Error(`CycloneDX SBOM generation failed with exit ${status}.`);
  }

  const bom = validateBom(outputFile, {
    projectRoot: config.projectRoot,
    readFileSync: config.fs.readFileSync.bind(config.fs),
  });
  return { outputFile, bom };
}

function main(dependencies) {
  const ports = {
    generateSbom,
    projectRoot: PROJECT_ROOT,
    writeOutput: process.stdout.write.bind(process.stdout),
    writeError: process.stderr.write.bind(process.stderr),
    ...dependencies,
  };
  try {
    const result = ports.generateSbom();
    ports.writeOutput(
      `Generated SBOM: ${path.relative(ports.projectRoot, result.outputFile).replace(/\\/g, '/')}\n`
    );
    return 0;
  } catch (error) {
    ports.writeError(`Error: ${error.message}\n`);
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

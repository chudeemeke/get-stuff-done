'use strict';

const fs = require('fs');
const path = require('path');
const { createHash, randomUUID } = require('crypto');
const { validatePairedBindingManifest } = require('./lib/hosted-evidence-binding');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTRACT = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, 'config', 'phase43-hosted-ci-contract.json'), 'utf8')
);
const MAX_EVIDENCE_BYTES = 16 * 1024 * 1024;
const OPTION_FIELDS = [
  'bootstrap',
  'harness',
  'reference',
  'candidate',
  'tierBReceipt',
  'comparison',
  'output',
];
const SUBJECT_FIELDS = ['repository', 'sha'];
const CLI_FIELDS = new Map([
  ['--bootstrap-repository', ['bootstrap', 'repository']],
  ['--bootstrap-sha', ['bootstrap', 'sha']],
  ['--harness-repository', ['harness', 'repository']],
  ['--harness-sha', ['harness', 'sha']],
  ['--reference-repository', ['reference', 'repository']],
  ['--reference-sha', ['reference', 'sha']],
  ['--candidate-repository', ['candidate', 'repository']],
  ['--candidate-sha', ['candidate', 'sha']],
  ['--tier-b-receipt', ['tierBReceipt']],
  ['--comparison', ['comparison']],
  ['--output', ['output']],
]);
const HELP = [
  'Usage:',
  '  node scripts/emit-paired-binding-manifest.js <subject flags> --tier-b-receipt <path> --comparison <path> --output <path>',
  '',
  'Emits one create-only paired binding manifest.',
  '',
].join('\n');

function hasExactFields(value, fields) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === fields.length &&
    fields.every(field => Object.prototype.hasOwnProperty.call(value, field))
  );
}

function parseArgs(args) {
  if (!Array.isArray(args)) throw new Error('Paired binding manifest arguments are invalid.');
  const queue = args.filter(argument => argument !== '--');
  if (queue.length === 1 && ['--help', '-h'].includes(queue[0])) return { help: true };
  const values = new Map();
  while (queue.length > 0) {
    const flag = queue.shift();
    const value = queue.shift();
    if (
      !CLI_FIELDS.has(flag) ||
      values.has(flag) ||
      typeof value !== 'string' ||
      value.length === 0 ||
      value.startsWith('--')
    ) {
      throw new Error(`Unknown or incomplete paired binding manifest argument: ${flag}.`);
    }
    values.set(flag, value);
  }
  if (values.size !== CLI_FIELDS.size) {
    throw new Error('Paired binding manifest requires the complete subject and evidence set.');
  }
  const result = {
    bootstrap: {},
    harness: {},
    reference: {},
    candidate: {},
  };
  for (const [flag, segments] of CLI_FIELDS) {
    if (segments.length === 1) {
      Reflect.set(result, segments[0], values.get(flag));
    } else {
      Reflect.set(Reflect.get(result, segments[0]), segments[1], values.get(flag));
    }
  }
  return result;
}

function resolveConfinedPath(projectRoot, filePath) {
  if (
    typeof projectRoot !== 'string' ||
    projectRoot.length === 0 ||
    typeof filePath !== 'string' ||
    filePath.length === 0 ||
    filePath.length > 500 ||
    filePath.includes('\\') ||
    path.posix.isAbsolute(filePath) ||
    filePath.split('/').some(segment => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error('Paired binding manifest path must stay inside the project root.');
  }
  const root = path.resolve(projectRoot);
  const resolved = path.resolve(root, ...filePath.split('/'));
  const relative = path.relative(root, resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Paired binding manifest path must stay inside the project root.');
  }
  return { root, resolved };
}

function assertNoLinkedAncestor(root, target) {
  let current = path.dirname(target);
  const ancestors = [];
  while (current !== root) {
    ancestors.push(current);
    current = path.dirname(current);
  }
  for (const candidate of ancestors.reverse()) {
    // Candidate ancestors derive only from a path already confined beneath root.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(candidate)) continue;
    // Candidate ancestors derive only from a path already confined beneath root.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stat = fs.lstatSync(candidate);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error('Paired binding manifest path cannot traverse a linked path.');
    }
  }
}

function defaultReadEvidence(projectRoot, filePath) {
  const { root, resolved } = resolveConfinedPath(projectRoot, filePath);
  assertNoLinkedAncestor(root, resolved);
  /* eslint-disable security/detect-non-literal-fs-filename -- resolved is confined above. */
  const stat = fs.lstatSync(resolved);
  if (stat.isSymbolicLink()) {
    throw new Error('Paired binding manifest path cannot traverse a linked path.');
  }
  if (!stat.isFile() || stat.size > MAX_EVIDENCE_BYTES) {
    throw new Error('Paired binding evidence must be one bounded regular file.');
  }
  const bytes = fs.readFileSync(resolved);
  /* eslint-enable security/detect-non-literal-fs-filename */
  if (bytes.length > MAX_EVIDENCE_BYTES) {
    throw new Error('Paired binding evidence must be one bounded regular file.');
  }
  return bytes;
}

function publishManifestCreateOnly(projectRoot, filePath, manifest) {
  const { root, resolved } = resolveConfinedPath(projectRoot, filePath);
  assertNoLinkedAncestor(root, resolved);
  const directory = path.dirname(resolved);
  /* eslint-disable security/detect-non-literal-fs-filename -- resolved is confined above. */
  fs.mkdirSync(directory, { recursive: true });
  const temporary = path.join(directory, `.paired-binding-${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(manifest)}\n`, { flag: 'wx', mode: 0o600 });
    try {
      fs.linkSync(temporary, resolved);
    } catch (error) {
      if (error?.code === 'EEXIST') {
        throw new Error(`Paired binding manifest already exists: ${filePath}.`);
      }
      throw error;
    }
    return resolved;
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  /* eslint-enable security/detect-non-literal-fs-filename */
}

function createPairedBindingManifest(options, dependencies = {}) {
  if (!hasExactFields(options, OPTION_FIELDS)) {
    throw new Error('Paired binding manifest options are invalid.');
  }
  for (const field of ['bootstrap', 'harness', 'reference', 'candidate']) {
    if (!hasExactFields(Reflect.get(options, field), SUBJECT_FIELDS)) {
      throw new Error('Paired binding manifest options are invalid.');
    }
  }
  const projectRoot = Object.prototype.hasOwnProperty.call(dependencies, 'projectRoot')
    ? dependencies.projectRoot
    : PROJECT_ROOT;
  const evidencePaths = [options.tierBReceipt, options.comparison, options.output];
  for (const filePath of evidencePaths) resolveConfinedPath(projectRoot, filePath);
  if (new Set(evidencePaths).size !== evidencePaths.length) {
    throw new Error('Paired binding manifest evidence paths must be distinct.');
  }

  const emptyDigest = '0'.repeat(64);
  validatePairedBindingManifest(
    {
      schemaVersion: CONTRACT.evidenceBinding.pairedManifest.schemaVersion,
      bootstrap: options.bootstrap,
      harness: options.harness,
      reference: options.reference,
      candidate: options.candidate,
      tierBReceiptSha256: emptyDigest,
      comparisonSha256: emptyDigest,
    },
    CONTRACT.evidenceBinding
  );

  const readEvidence = Object.prototype.hasOwnProperty.call(dependencies, 'readEvidence')
    ? dependencies.readEvidence
    : defaultReadEvidence;
  const publishManifest = Object.prototype.hasOwnProperty.call(dependencies, 'publishManifest')
    ? dependencies.publishManifest
    : publishManifestCreateOnly;
  if (typeof readEvidence !== 'function' || typeof publishManifest !== 'function') {
    throw new Error('Paired binding manifest adapters are invalid.');
  }
  const tierBReceipt = readEvidence(projectRoot, options.tierBReceipt);
  const comparison = readEvidence(projectRoot, options.comparison);
  if (
    !Buffer.isBuffer(tierBReceipt) ||
    !Buffer.isBuffer(comparison) ||
    tierBReceipt.length > MAX_EVIDENCE_BYTES ||
    comparison.length > MAX_EVIDENCE_BYTES
  ) {
    throw new Error('Paired binding evidence must be bounded bytes.');
  }

  const manifest = {
    schemaVersion: CONTRACT.evidenceBinding.pairedManifest.schemaVersion,
    bootstrap: options.bootstrap,
    harness: options.harness,
    reference: options.reference,
    candidate: options.candidate,
    tierBReceiptSha256: createHash('sha256').update(tierBReceipt).digest('hex'),
    comparisonSha256: createHash('sha256').update(comparison).digest('hex'),
  };
  validatePairedBindingManifest(manifest, CONTRACT.evidenceBinding);
  publishManifest(projectRoot, options.output, manifest);
  return manifest;
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
    createPairedBindingManifest(options, dependencies);
    stdout.write(`${JSON.stringify({ output: options.output })}\n`);
    return 0;
  } catch {
    stderr.write('Paired binding manifest failed.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  createPairedBindingManifest,
  defaultReadEvidence,
  main,
  parseArgs,
  publishManifestCreateOnly,
};

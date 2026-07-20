'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const { spawnSync } = require('child_process');
const {
  isResolvedSemver,
  validateTierBRuntimeReceipt,
} = require('./lib/hosted-evidence-binding');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTRACT = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, 'config', 'phase43-hosted-ci-contract.json'), 'utf8')
);
const TOOLCHAIN_AUTHORITY = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, 'config', 'phase43-toolchain-authority.json'), 'utf8')
);
const REVIEWED_RUNTIME_TOOLS = new Set(Object.keys(TOOLCHAIN_AUTHORITY.runtimeTools || {}));
const HELP = [
  'Usage:',
  '  node scripts/emit-hosted-runtime-receipt.js --subject <id> --output <path> [--tool <name>] [--container <image=sha256:digest>]',
  '',
  'Emits one create-only Tier B hosted runtime receipt.',
  '',
].join('\n');
const TOOL_TOKEN = /^[A-Za-z0-9._-]{1,100}$/;
const CONTAINER_IMAGE = /^[a-z0-9._/-]{1,200}$/;
const CONTAINER_DIGEST = /^sha256:[0-9a-f]{64}$/;
const RUNTIME_ENVIRONMENT_KEYS = [
  'HOME',
  'PATH',
  'Path',
  'PATHEXT',
  'SystemRoot',
  'TEMP',
  'TMP',
  'USERPROFILE',
  'WINDIR',
];

function normalizedPlatform(platform) {
  if (platform === 'darwin') return 'macos';
  if (platform === 'win32') return 'windows';
  if (platform === 'linux') return 'linux';
  return platform;
}

function defaultRunVersion(command, args) {
  const environment = Object.fromEntries(
    RUNTIME_ENVIRONMENT_KEYS.flatMap(key =>
      Object.prototype.hasOwnProperty.call(process.env, key) ? [[key, Reflect.get(process.env, key)]] : []
    )
  );
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: environment,
    maxBuffer: 64 * 1024,
    shell: false,
    timeout: 30_000,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Runtime version probe failed for ${command}.`);
  return String(result.stdout || '').trim();
}

function parseResolvedVersion(tool, output) {
  const tokens = String(output || '').trim().split(/\s+/);
  if (
    tokens.length < 1 ||
    tokens.length > 2 ||
    (tokens.length === 2 && tokens[0].toLowerCase() !== tool.toLowerCase())
  ) {
    throw new Error(`Runtime version probe for ${tool} did not return one resolved version.`);
  }
  const candidate = tokens.at(-1).replace(/^v/, '');
  if (!isResolvedSemver(candidate)) {
    throw new Error(`Runtime version probe for ${tool} did not return semantic version authority.`);
  }
  return candidate;
}

function createTierBRuntimeReceipt(options, dependencies = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Tier B runtime receipt options are invalid.');
  }
  const tools = Array.isArray(options.tools) ? options.tools : [];
  if (
    tools.length > 20 ||
    new Set(tools).size !== tools.length ||
    tools.some(
      tool =>
        typeof tool !== 'string' ||
        !TOOL_TOKEN.test(tool) ||
        !REVIEWED_RUNTIME_TOOLS.has(tool)
    )
  ) {
    throw new Error('Tier B runtime tool authority is invalid or duplicated.');
  }
  const runVersion = dependencies.runVersion || defaultRunVersion;
  const platform = normalizedPlatform((dependencies.platform || os.platform)());
  const osVersion = (dependencies.release || os.release)();
  const osDetail = (dependencies.version || os.version)();
  const receipt = {
    schemaVersion: options.schemaVersion,
    subject: options.subject,
    event: options.event,
    runId: options.runId,
    attempt: options.attempt,
    os: platform,
    osVersion,
    architecture: (dependencies.architecture || os.arch)(),
    runnerImage: `${platform}:${osVersion}:${osDetail}`,
    hostedImageName: options.hostedImageName ?? null,
    hostedImageVersion: options.hostedImageVersion ?? null,
    nodeVersion: parseResolvedVersion(
      'node',
      (dependencies.nodeVersion || (() => process.versions.node))()
    ),
    bunVersion: parseResolvedVersion('bun', runVersion('bun', ['--version'])),
    tools: Object.fromEntries(
      tools.map(tool => [tool, parseResolvedVersion(tool, runVersion(tool, ['--version']))])
    ),
    containers: Object.fromEntries(Object.entries(options.containers || {})),
  };
  return validateTierBRuntimeReceipt(receipt, CONTRACT);
}

function parseContainer(value) {
  const separator = typeof value === 'string' ? value.indexOf('=') : -1;
  const image = separator > 0 ? value.slice(0, separator) : '';
  const digest = separator > 0 ? value.slice(separator + 1) : '';
  if (!CONTAINER_IMAGE.test(image) || !CONTAINER_DIGEST.test(digest)) {
    throw new Error('Hosted runtime --container must be <image=sha256:digest>.');
  }
  return [image, digest];
}

function parseArgs(args) {
  const queue = args.filter(argument => argument !== '--');
  if (queue.length === 1 && ['--help', '-h'].includes(queue[0])) return { help: true };
  const result = { subject: null, output: null, tools: [], containerEntries: new Map() };
  while (queue.length > 0) {
    const flag = queue.shift();
    const value = queue.shift();
    if (typeof value !== 'string' || !value || value.startsWith('--')) {
      throw new Error(`Unknown or incomplete hosted runtime receipt argument: ${flag}.`);
    }
    if (flag === '--subject' && result.subject === null) {
      result.subject = value;
    } else if (flag === '--output' && result.output === null) {
      result.output = value;
    } else if (flag === '--tool') {
      result.tools.push(value);
    } else if (flag === '--container') {
      const [image, digest] = parseContainer(value);
      if (result.containerEntries.has(image)) {
        throw new Error(`Duplicate hosted runtime container authority: ${image}.`);
      }
      result.containerEntries.set(image, digest);
    } else {
      throw new Error(`Unknown or incomplete hosted runtime receipt argument: ${flag}.`);
    }
  }
  if (result.subject === null || result.output === null) {
    throw new Error('Hosted runtime receipt requires --subject and --output.');
  }
  return {
    subject: result.subject,
    output: result.output,
    tools: result.tools,
    containers: Object.fromEntries(result.containerEntries),
  };
}

function resolveOutputPath(projectRoot, filePath) {
  if (
    typeof filePath !== 'string' ||
    filePath.length === 0 ||
    filePath.length > 500 ||
    filePath.includes('\\') ||
    path.posix.isAbsolute(filePath) ||
    filePath.split('/').some(segment => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error('Hosted runtime receipt output must stay inside the project root.');
  }
  const root = path.resolve(projectRoot);
  const output = path.resolve(root, ...filePath.split('/'));
  const relative = path.relative(root, output);
  if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error('Hosted runtime receipt output must stay inside the project root.');
  }
  return { root, output };
}

function assertNoLinkedAncestor(root, output) {
  let current = path.dirname(output);
  const ancestors = [];
  while (current !== root) {
    ancestors.push(current);
    current = path.dirname(current);
  }
  for (const candidate of ancestors.reverse()) {
    // Candidate ancestors derive only from an output path already confined beneath root.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(candidate)) continue;
    // Output ancestors are confined beneath the validated project root.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stat = fs.lstatSync(candidate);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error('Hosted runtime receipt output cannot traverse a linked path.');
    }
  }
}

function publishReceiptCreateOnly(projectRoot, filePath, receipt) {
  const { root, output } = resolveOutputPath(projectRoot, filePath);
  assertNoLinkedAncestor(root, output);
  const directory = path.dirname(output);
  /* eslint-disable security/detect-non-literal-fs-filename -- root and output are confined above. */
  fs.mkdirSync(directory, { recursive: true });
  const temporary = path.join(directory, `.runtime-receipt-${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(receipt)}\n`, { flag: 'wx', mode: 0o600 });
    try {
      fs.linkSync(temporary, output);
    } catch (error) {
      if (error?.code === 'EEXIST') {
        throw new Error(`Hosted runtime receipt already exists: ${filePath}.`);
      }
      throw error;
    }
    return output;
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  /* eslint-enable security/detect-non-literal-fs-filename */
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
    const env = dependencies.env || process.env;
    const createReceipt = dependencies.createReceipt || createTierBRuntimeReceipt;
    const publishReceipt = dependencies.publishReceipt || publishReceiptCreateOnly;
    const receipt = createReceipt(
      {
        schemaVersion: CONTRACT.runtimeReceipts.schemaVersion,
        subject: options.subject,
        event: env.GITHUB_EVENT_NAME,
        runId: Number(env.GITHUB_RUN_ID),
        attempt: Number(env.GITHUB_RUN_ATTEMPT),
        hostedImageName: env.ImageOS || null,
        hostedImageVersion: env.ImageVersion || null,
        tools: options.tools,
        containers: options.containers,
      },
      dependencies.runtimeDependencies
    );
    const output = publishReceipt(
      dependencies.projectRoot || PROJECT_ROOT,
      options.output,
      receipt
    );
    stdout.write(`${JSON.stringify({ output, subject: receipt.subject })}\n`);
    return 0;
  } catch {
    stderr.write('Hosted runtime receipt failed.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  createTierBRuntimeReceipt,
  defaultRunVersion,
  main,
  parseArgs,
  publishReceiptCreateOnly,
};

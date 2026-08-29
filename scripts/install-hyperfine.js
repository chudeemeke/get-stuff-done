'use strict';

const { createHash } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HYPERFINE_VERSION = '1.20.0';
const RELEASE_BASE_URL = `https://github.com/sharkdp/hyperfine/releases/download/v${HYPERFINE_VERSION}`;
const MAX_ARCHIVE_BYTES = 10 * 1024 * 1024;
const HELP = [
  'Usage:',
  '  node scripts/install-hyperfine.js --destination <directory>',
  '',
  `Downloads, verifies, and installs Hyperfine ${HYPERFINE_VERSION} from reviewed release bytes.`,
  '',
].join('\n');

const ASSETS = Object.freeze({
  'darwin-x64': Object.freeze({
    archiveFormat: 'tar.gz',
    executable: 'hyperfine',
    name: `hyperfine-v${HYPERFINE_VERSION}-x86_64-apple-darwin.tar.gz`,
    sha256: 'f58d0b90993fadfa122a351428c469ce24afef3865f027f0e6e86f0830d088f1',
  }),
  'darwin-arm64': Object.freeze({
    archiveFormat: 'tar.gz',
    executable: 'hyperfine',
    name: `hyperfine-v${HYPERFINE_VERSION}-aarch64-apple-darwin.tar.gz`,
    sha256: '8ee7067016620447c9d2d6234ec9a4680f958b7ad983549b56334668f63075b5',
  }),
  'linux-x64': Object.freeze({
    archiveFormat: 'tar.gz',
    executable: 'hyperfine',
    name: `hyperfine-v${HYPERFINE_VERSION}-x86_64-unknown-linux-gnu.tar.gz`,
    sha256: '63ad53934062118f5b0be11785e0bb1603d4b91667d1921f2fd8df9a8712040a',
  }),
  'linux-arm64': Object.freeze({
    archiveFormat: 'tar.gz',
    executable: 'hyperfine',
    name: `hyperfine-v${HYPERFINE_VERSION}-aarch64-unknown-linux-gnu.tar.gz`,
    sha256: '90875cb1db7a1d797c311174d061728361e58fc70e3b62262a00635ac3b1997c',
  }),
  'win32-x64': Object.freeze({
    archiveFormat: 'zip',
    executable: 'hyperfine.exe',
    name: `hyperfine-v${HYPERFINE_VERSION}-x86_64-pc-windows-msvc.zip`,
    sha256: '2508c549b049b1d4342d08edc1cb42bfac169082b6e3069431b5bab9822dbb32',
  }),
});
const REVIEWED_ASSET_NAMES = new Set(Object.values(ASSETS).map(asset => asset.name));

function selectHyperfineAsset(platform, architecture) {
  const asset = Reflect.get(ASSETS, `${platform}-${architecture}`);
  if (!asset) {
    throw new Error(`Hyperfine ${HYPERFINE_VERSION} has no reviewed asset for ${platform}/${architecture}.`);
  }
  return {
    ...asset,
    url: `${RELEASE_BASE_URL}/${asset.name}`,
    version: HYPERFINE_VERSION,
  };
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function downloadReleaseAsset(url, dependencies = {}) {
  const parsed = new URL(url);
  const expectedPath = `/sharkdp/hyperfine/releases/download/v${HYPERFINE_VERSION}/`;
  const assetName = parsed.pathname.slice(expectedPath.length);
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'github.com' ||
    !parsed.pathname.startsWith(expectedPath) ||
    assetName.includes('/') ||
    !REVIEWED_ASSET_NAMES.has(assetName) ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('Hyperfine release download URL is outside reviewed authority.');
  }
  const request = dependencies.fetch || globalThis.fetch;
  if (typeof request !== 'function') {
    throw new Error('Hyperfine release download transport is unavailable.');
  }
  const response = await request(url, {
    redirect: 'follow',
    signal: dependencies.signal || AbortSignal.timeout(30_000),
  });
  if (!response?.ok) {
    throw new Error(`Hyperfine release download failed with HTTP ${response?.status || 'unknown'}.`);
  }
  const declaredLength = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_ARCHIVE_BYTES) {
    throw new Error('Hyperfine release asset exceeds the size limit.');
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_ARCHIVE_BYTES) {
    throw new Error('Hyperfine release asset bytes are invalid or exceed the size limit.');
  }
  return bytes;
}

function archiveRootName(asset) {
  const suffix = asset.archiveFormat === 'zip' ? '.zip' : '.tar.gz';
  if (!asset.name.endsWith(suffix)) {
    throw new Error('Hyperfine archive name does not match its governed format.');
  }
  return asset.name.slice(0, -suffix.length);
}

function archiveExtractor(asset) {
  return asset.archiveFormat === 'zip'
    ? 'C:\\Windows\\System32\\tar.exe'
    : 'tar';
}

function installVerifiedArchive(request, dependencies = {}) {
  const io = dependencies.fs || fs;
  const execute = dependencies.spawnSync || spawnSync;
  const makeTemporaryDirectory = dependencies.makeTemporaryDirectory || (() =>
    io.mkdtempSync(path.join(os.tmpdir(), 'gsd-hyperfine-'))
  );
  const temporary = makeTemporaryDirectory();
  try {
    const archivePath = path.join(temporary, request.asset.name);
    io.writeFileSync(archivePath, request.bytes, { flag: 'wx', mode: 0o600 });
    const extraction = execute(archiveExtractor(request.asset), ['-xf', archivePath, '-C', temporary], {
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    if (extraction.error || extraction.status !== 0) {
      throw new Error('Hyperfine reviewed archive extraction failed.');
    }

    const source = path.join(
      temporary,
      archiveRootName(request.asset),
      request.asset.executable
    );
    const sourceStat = io.lstatSync(source);
    if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) {
      throw new Error('Hyperfine reviewed archive did not contain the expected executable.');
    }
    if (request.asset.executable !== 'hyperfine.exe') io.chmodSync(source, 0o755);

    const version = execute(source, ['--version'], {
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    const expectedOutput = `hyperfine ${request.asset.version}`;
    if (version.error || version.status !== 0 || String(version.stdout || '').trim() !== expectedOutput) {
      throw new Error(`Hyperfine resolved executable version must be exactly ${request.asset.version}.`);
    }

    io.mkdirSync(request.destination, { recursive: true });
    const target = path.join(request.destination, request.asset.executable);
    io.copyFileSync(source, target, io.constants.COPYFILE_EXCL);
    return { path: target, resolvedVersion: request.asset.version };
  } finally {
    io.rmSync(temporary, { force: true, recursive: true });
  }
}

async function installHyperfine(options, dependencies = {}) {
  const asset = selectHyperfineAsset(options?.platform, options?.architecture);
  const destinationPath = options?.platform === 'win32' ? path.win32 : path.posix;
  if (
    typeof options?.destination !== 'string' ||
    options.destination.trim() !== options.destination ||
    !options.destination ||
    !destinationPath.isAbsolute(options.destination)
  ) {
    throw new Error('Hyperfine installation requires a normalized destination path.');
  }
  const ports = {
    download: downloadReleaseAsset,
    installVerifiedArchive,
    ...dependencies,
  };
  if (typeof ports.download !== 'function') {
    throw new Error('Hyperfine installer download adapter is unavailable.');
  }
  const bytes = await ports.download(asset.url);
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_ARCHIVE_BYTES) {
    throw new Error('Hyperfine release asset bytes are invalid or exceed the size limit.');
  }
  const digest = (ports.sha256 || sha256)(bytes);
  if (digest !== asset.sha256) {
    throw new Error(`Hyperfine ${asset.version} release asset SHA-256 does not match authority.`);
  }
  if (typeof ports.installVerifiedArchive !== 'function') {
    throw new Error('Hyperfine verified-archive installer adapter is unavailable.');
  }
  const installed = await ports.installVerifiedArchive({
    asset,
    bytes,
    destination: options.destination,
  });
  if (
    !installed ||
    Object.keys(installed).length !== 2 ||
    typeof installed.path !== 'string' ||
    !installed.path ||
    installed.resolvedVersion !== asset.version
  ) {
    throw new Error(`Hyperfine resolved executable version must be exactly ${asset.version}.`);
  }
  return {
    archiveSha256: asset.sha256,
    path: installed.path,
    version: installed.resolvedVersion,
  };
}

function parseArgs(args) {
  const queue = args.filter(argument => argument !== '--');
  if (queue.length === 1 && ['--help', '-h'].includes(queue[0])) return { help: true };
  let destination = null;
  while (queue.length > 0) {
    const flag = queue.shift();
    const value = queue.shift();
    if (flag !== '--destination' || typeof value !== 'string' || !value || value.startsWith('--')) {
      throw new Error(`Unknown or incomplete Hyperfine installer argument: ${flag}.`);
    }
    if (destination !== null) throw new Error('Duplicate Hyperfine installer argument: --destination.');
    destination = value;
  }
  if (destination === null) {
    throw new Error('Hyperfine installer requires --destination <directory>.');
  }
  return { destination };
}

function sanitizeDiagnostic(value) {
  return String(value || 'unknown failure')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7e]/g, '?')
    .slice(0, 500);
}

async function main(args = process.argv.slice(2), dependencies = {}) {
  const stdout = dependencies.stdout || process.stdout;
  const stderr = dependencies.stderr || process.stderr;
  try {
    const options = parseArgs(args);
    if (options.help) {
      stdout.write(HELP);
      return 0;
    }
    const installer = dependencies.installHyperfine || installHyperfine;
    const result = await installer(
      {
        architecture: dependencies.architecture || process.arch,
        destination: options.destination,
        platform: dependencies.platform || process.platform,
      },
      dependencies.installDependencies
    );
    stdout.write(`${JSON.stringify(result)}\n`);
    return 0;
  } catch (error) {
    stderr.write(`Hyperfine installer failed: ${sanitizeDiagnostic(error.message)}\n`);
    return 1;
  }
}

if (require.main === module) {
  main().then(code => { process.exitCode = code; });
}

module.exports = {
  downloadReleaseAsset,
  installHyperfine,
  installVerifiedArchive,
  main,
  parseArgs,
  selectHyperfineAsset,
};

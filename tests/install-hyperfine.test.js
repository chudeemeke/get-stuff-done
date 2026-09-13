'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  downloadReleaseAsset,
  installHyperfine,
  installVerifiedArchive,
  main,
  parseArgs,
  selectHyperfineAsset,
} = require('../scripts/install-hyperfine');

describe('Hyperfine installer', () => {
  test('selects the reviewed Hyperfine 1.20.0 Linux x64 asset', () => {
    expect(selectHyperfineAsset('linux', 'x64')).toEqual({
      archiveFormat: 'tar.gz',
      executable: 'hyperfine',
      name: 'hyperfine-v1.20.0-x86_64-unknown-linux-gnu.tar.gz',
      sha256: '63ad53934062118f5b0be11785e0bb1603d4b91667d1921f2fd8df9a8712040a',
      url: 'https://github.com/sharkdp/hyperfine/releases/download/v1.20.0/hyperfine-v1.20.0-x86_64-unknown-linux-gnu.tar.gz',
      version: '1.20.0',
    });
  });

  test('supports only the reviewed hosted-runner platform assets', () => {
    const expected = [
      ['darwin', 'x64', 'hyperfine-v1.20.0-x86_64-apple-darwin.tar.gz', 'f58d0b90993fadfa122a351428c469ce24afef3865f027f0e6e86f0830d088f1', 'tar.gz', 'hyperfine'],
      ['darwin', 'arm64', 'hyperfine-v1.20.0-aarch64-apple-darwin.tar.gz', '8ee7067016620447c9d2d6234ec9a4680f958b7ad983549b56334668f63075b5', 'tar.gz', 'hyperfine'],
      ['linux', 'arm64', 'hyperfine-v1.20.0-aarch64-unknown-linux-gnu.tar.gz', '90875cb1db7a1d797c311174d061728361e58fc70e3b62262a00635ac3b1997c', 'tar.gz', 'hyperfine'],
      ['win32', 'x64', 'hyperfine-v1.20.0-x86_64-pc-windows-msvc.zip', '2508c549b049b1d4342d08edc1cb42bfac169082b6e3069431b5bab9822dbb32', 'zip', 'hyperfine.exe'],
    ];

    for (const [platform, architecture, name, sha256, archiveFormat, executable] of expected) {
      expect(selectHyperfineAsset(platform, architecture)).toMatchObject({
        archiveFormat,
        executable,
        name,
        sha256,
        version: '1.20.0',
      });
    }
    expect(() => selectHyperfineAsset('win32', 'arm64')).toThrow(
      'no reviewed asset for win32/arm64'
    );
  });

  test('rejects tampered download bytes before extraction', async () => {
    let installed = false;

    await expect(
      installHyperfine(
        { architecture: 'x64', destination: '/runner-temp/hyperfine', platform: 'linux' },
        {
          download: async () => Buffer.from('tampered archive'),
          installVerifiedArchive: () => { installed = true; },
        }
      )
    ).rejects.toThrow('SHA-256');
    expect(installed).toBe(false);
  });

  test('rejects an installed executable that does not resolve to exactly 1.20.0', async () => {
    const asset = selectHyperfineAsset('linux', 'x64');

    await expect(
      installHyperfine(
        { architecture: 'x64', destination: '/runner-temp/hyperfine', platform: 'linux' },
        {
          download: async () => Buffer.from('reviewed archive fixture'),
          sha256: () => asset.sha256,
          installVerifiedArchive: () => ({
            path: '/runner-temp/hyperfine/hyperfine',
            resolvedVersion: '1.19.0',
          }),
        }
      )
    ).rejects.toThrow('resolved executable version');
  });

  test('extracts and verifies the reviewed executable before installing it', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hyperfine-installer-test-'));
    const temporary = path.join(root, 'private-temp');
    const destination = path.join(root, 'installed');
    const asset = selectHyperfineAsset('win32', 'x64');
    const calls = [];
    fs.mkdirSync(temporary);

    try {
      const result = installVerifiedArchive(
        { asset, bytes: Buffer.from('reviewed archive fixture'), destination },
        {
          makeTemporaryDirectory: () => temporary,
          spawnSync: (command, args, options) => {
            calls.push({ command, args, options });
            if (args[0] === '-xf') {
              const archiveRoot = asset.name.slice(0, -'.zip'.length);
              const extractedDirectory = path.join(temporary, archiveRoot);
              fs.mkdirSync(extractedDirectory);
              fs.writeFileSync(path.join(extractedDirectory, asset.executable), 'binary');
              return { status: 0, stderr: '' };
            }
            return { status: 0, stdout: 'hyperfine 1.20.0\r\n', stderr: '' };
          },
        }
      );

      expect(result).toEqual({
        path: path.join(destination, 'hyperfine.exe'),
        resolvedVersion: '1.20.0',
      });
      expect(fs.readFileSync(result.path, 'utf8')).toBe('binary');
      expect(fs.existsSync(temporary)).toBe(false);
      expect(calls.map(call => [call.command, call.args])).toEqual([
        ['C:\\Windows\\System32\\tar.exe', ['-xf', path.join(temporary, asset.name), '-C', temporary]],
        [path.join(temporary, asset.name.slice(0, -'.zip'.length), 'hyperfine.exe'), ['--version']],
      ]);
      expect(calls.every(call => call.options.shell === false)).toBe(true);
    } finally {
      fs.rmSync(root, { force: true, recursive: true });
    }
  });

  test('rejects an unsuccessful official release download', async () => {
    const url = selectHyperfineAsset('linux', 'x64').url;
    await expect(
      downloadReleaseAsset(url, {
        fetch: async () => ({ ok: false, status: 404 }),
      })
    ).rejects.toThrow('download failed with HTTP 404');
  });

  test('rejects an unreviewed sibling release asset before network access', async () => {
    let requested = false;
    await expect(
      downloadReleaseAsset(
        'https://github.com/sharkdp/hyperfine/releases/download/v1.20.0/unreviewed.tar.gz',
        { fetch: async () => { requested = true; } }
      )
    ).rejects.toThrow('outside reviewed authority');
    expect(requested).toBe(false);
  });

  test('accepts only bounded bytes from exact reviewed release URLs', async () => {
    const url = selectHyperfineAsset('linux', 'x64').url;
    const bytes = Buffer.from('archive');
    let requestOptions;
    const signal = {};
    const downloaded = await downloadReleaseAsset(url, {
      fetch: async (_url, options) => {
        requestOptions = options;
        return {
          ok: true,
          headers: { get: name => name === 'content-length' ? String(bytes.length) : null },
          arrayBuffer: async () => bytes,
        };
      },
      signal,
    });
    expect(downloaded).toEqual(bytes);
    expect(requestOptions).toEqual({ redirect: 'follow', signal });

    const invalidUrls = [
      url.replace('https:', 'http:'),
      url.replace('github.com', 'example.com'),
      url.replace('/v1.20.0/', '/v1.19.0/'),
      `${url}/nested`,
      `${url}?download=1`,
      `${url}#fragment`,
      url.replace('https://', 'https://user:password@'),
    ];
    for (const invalidUrl of invalidUrls) {
      await expect(downloadReleaseAsset(invalidUrl, { fetch: async () => null })).rejects.toThrow(
        'outside reviewed authority'
      );
    }

    await expect(downloadReleaseAsset(url, { fetch: 42 })).rejects.toThrow(
      'transport is unavailable'
    );
    await expect(downloadReleaseAsset(url, {
      fetch: async () => ({
        ok: true,
        headers: { get: () => String(10 * 1024 * 1024 + 1) },
      }),
    })).rejects.toThrow('exceeds the size limit');
    await expect(downloadReleaseAsset(url, {
      fetch: async () => ({ ok: true, arrayBuffer: async () => Buffer.alloc(0) }),
    })).rejects.toThrow('bytes are invalid');
    await expect(downloadReleaseAsset(url, {
      fetch: async () => ({
        ok: true,
        arrayBuffer: async () => Buffer.alloc(10 * 1024 * 1024 + 1),
      }),
    })).rejects.toThrow('bytes are invalid');
    await expect(downloadReleaseAsset(url, {
      fetch: async () => ({ ok: false }),
    })).rejects.toThrow('HTTP unknown');
  });

  test('fails closed on archive extraction, payload, and version anomalies', () => {
    const asset = selectHyperfineAsset('win32', 'x64');

    function runCase({ extraction = { status: 0 }, source = 'file', version = { status: 0, stdout: 'hyperfine 1.20.0' }, mutateAsset } = {}) {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hyperfine-failure-test-'));
      const temporary = path.join(root, 'private-temp');
      const candidate = { ...asset };
      if (mutateAsset) mutateAsset(candidate);
      fs.mkdirSync(temporary);
      const io = source === 'symlink'
        ? {
            ...fs,
            lstatSync: () => ({ isFile: () => true, isSymbolicLink: () => true }),
          }
        : fs;
      const action = () => installVerifiedArchive(
        { asset: candidate, bytes: Buffer.from('archive'), destination: path.join(root, 'out') },
        {
          fs: io,
          makeTemporaryDirectory: () => temporary,
          spawnSync: (_command, args) => {
            if (args[0] === '-xf') {
              if (!extraction.error && extraction.status === 0 && source !== 'missing') {
                const archiveRoot = candidate.name.replace(/(?:\.tar\.gz|\.zip)$/, '');
                const extracted = path.join(temporary, archiveRoot);
                fs.mkdirSync(extracted, { recursive: true });
                const executable = path.join(extracted, candidate.executable);
                if (source === 'directory') fs.mkdirSync(executable);
                else fs.writeFileSync(executable, 'binary');
              }
              return extraction;
            }
            return version;
          },
        }
      );
      return { action, cleanup: () => fs.rmSync(root, { force: true, recursive: true }), temporary };
    }

    const cases = [
      [{ extraction: { error: new Error('extract') } }, 'archive extraction failed'],
      [{ extraction: { status: 1 } }, 'archive extraction failed'],
      [{ source: 'directory' }, 'expected executable'],
      [{ source: 'symlink' }, 'expected executable'],
      [{ version: { error: new Error('version'), status: 0 } }, 'version must be exactly'],
      [{ version: { status: 1 } }, 'version must be exactly'],
      [{ version: { status: 0, stdout: 'hyperfine 1.19.0' } }, 'version must be exactly'],
      [{ mutateAsset: candidate => { candidate.name = 'wrong.tar.gz'; candidate.archiveFormat = 'zip'; } }, 'archive name'],
    ];
    for (const [options, message] of cases) {
      const fixture = runCase(options);
      try {
        expect(fixture.action).toThrow(message);
        expect(fs.existsSync(fixture.temporary)).toBe(false);
      } finally {
        fixture.cleanup();
      }
    }
  });

  test('uses a private default temp directory for tar archives', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hyperfine-tar-test-'));
    const destination = path.join(root, 'installed');
    const asset = selectHyperfineAsset('linux', 'x64');
    let temporary;
    try {
      const result = installVerifiedArchive(
        { asset, bytes: Buffer.from('archive'), destination },
        {
          spawnSync: (command, args) => {
            if (command === 'tar') {
              temporary = args[3];
              const extracted = path.join(temporary, asset.name.slice(0, -'.tar.gz'.length));
              fs.mkdirSync(extracted);
              fs.writeFileSync(path.join(extracted, asset.executable), 'binary');
              return { status: 0 };
            }
            return { status: 0, stdout: 'hyperfine 1.20.0\n' };
          },
        }
      );
      expect(result.resolvedVersion).toBe('1.20.0');
      expect(fs.existsSync(result.path)).toBe(true);
      expect(fs.existsSync(temporary)).toBe(false);
    } finally {
      fs.rmSync(root, { force: true, recursive: true });
    }
  });

  test('fails closed on invalid destinations, adapters, bytes, and adapter results', async () => {
    const asset = selectHyperfineAsset('linux', 'x64');
    const valid = {
      download: async () => Buffer.from('archive'),
      sha256: () => asset.sha256,
      installVerifiedArchive: () => ({ path: '/out/hyperfine', resolvedVersion: '1.20.0' }),
    };
    for (const destination of [null, '', ' relative ', 'relative', 'C:\\relative-on-linux']) {
      await expect(installHyperfine({ architecture: 'x64', destination, platform: 'linux' }, valid)).rejects.toThrow(
        'normalized destination'
      );
    }
    await expect(installHyperfine(
      { architecture: 'x64', destination: 'runner-temp\\hyperfine', platform: 'win32' },
      { ...valid, sha256: () => selectHyperfineAsset('win32', 'x64').sha256 }
    )).rejects.toThrow('normalized destination');

    const linuxOptions = { architecture: 'x64', destination: '/out', platform: 'linux' };
    await expect(installHyperfine(linuxOptions, { ...valid, download: null })).rejects.toThrow('download adapter');
    for (const bytes of [null, Buffer.alloc(0), Buffer.alloc(10 * 1024 * 1024 + 1)]) {
      await expect(installHyperfine(linuxOptions, { ...valid, download: async () => bytes })).rejects.toThrow(
        'asset bytes are invalid'
      );
    }
    await expect(installHyperfine(linuxOptions, { ...valid, installVerifiedArchive: null })).rejects.toThrow(
      'installer adapter'
    );
    for (const installed of [
      null,
      { path: '/out/hyperfine', resolvedVersion: '1.20.0', extra: true },
      { path: 42, resolvedVersion: '1.20.0' },
      { path: '', resolvedVersion: '1.20.0' },
    ]) {
      await expect(installHyperfine(linuxOptions, {
        ...valid,
        installVerifiedArchive: () => installed,
      })).rejects.toThrow('resolved executable version');
    }
    await expect(installHyperfine(
      { architecture: 'x64', destination: 'C:\\runner-temp\\hyperfine', platform: 'win32' },
      {
        ...valid,
        sha256: () => selectHyperfineAsset('win32', 'x64').sha256,
        installVerifiedArchive: () => ({
          path: 'C:\\runner-temp\\hyperfine\\hyperfine.exe',
          resolvedVersion: '1.20.0',
        }),
      }
    )).resolves.toMatchObject({ version: '1.20.0' });
    await expect(installHyperfine(linuxOptions, valid)).resolves.toEqual({
      archiveSha256: asset.sha256,
      path: '/out/hyperfine',
      version: '1.20.0',
    });
  });

  test('requires one explicit destination from the installer CLI', () => {
    expect(parseArgs(['--destination', '/runner-temp/hyperfine'])).toEqual({
      destination: '/runner-temp/hyperfine',
    });
    expect(() => parseArgs([])).toThrow('--destination');
    expect(() => parseArgs(['--destination', '/one', '--destination', '/two'])).toThrow(
      'Duplicate'
    );
    expect(() => parseArgs(['--unknown', 'value'])).toThrow('Unknown');
    expect(() => parseArgs(['--destination', '--help'])).toThrow('Unknown');
    expect(parseArgs(['--', '--destination', '/runner-temp/hyperfine'])).toEqual({
      destination: '/runner-temp/hyperfine',
    });
    expect(parseArgs(['--help'])).toEqual({ help: true });
    expect(parseArgs(['-h'])).toEqual({ help: true });
  });

  test('emits one machine-readable record for a successful CLI install', async () => {
    let received;
    let output = '';
    const code = await main(
      ['--destination', '/runner-temp/hyperfine'],
      {
        architecture: 'x64',
        installHyperfine: async options => {
          received = options;
          return {
            archiveSha256: 'a'.repeat(64),
            path: '/runner-temp/hyperfine/hyperfine',
            version: '1.20.0',
          };
        },
        platform: 'linux',
        stdout: { write: value => { output += value; } },
      }
    );

    expect(code).toBe(0);
    expect(received).toEqual({
      architecture: 'x64',
      destination: '/runner-temp/hyperfine',
      platform: 'linux',
    });
    expect(JSON.parse(output)).toEqual({
      archiveSha256: 'a'.repeat(64),
      path: '/runner-temp/hyperfine/hyperfine',
      version: '1.20.0',
    });
  });

  test('prints CLI help and sanitized failures', async () => {
    let help = '';
    expect(await main(['--help'], { stdout: { write: value => { help += value; } } })).toBe(0);
    expect(help).toContain('install-hyperfine.js --destination');

    let error = '';
    expect(await main(
      ['--destination', '/out'],
      {
        installHyperfine: async () => { throw new Error(`unsafe\n\tvalue\u0001${'x'.repeat(600)}`); },
        stderr: { write: value => { error += value; } },
      }
    )).toBe(1);
    expect(error).not.toContain('\t');
    expect(error).not.toContain('\u0001');
    expect(error.length).toBeLessThanOrEqual(531);

    const cli = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'install-hyperfine.js'), '--help'], {
      encoding: 'utf8',
      shell: false,
    });
    expect(cli.status).toBe(0);
    expect(cli.stdout).toContain('Usage:');
  });
});

/**
 * Installer Safety Unit Tests
 *
 * Comprehensive tests for all 4 safety functions in bin/install.js:
 *   - readInstalledManifest() -- manifest parsing
 *   - removeGsdFiles()        -- manifest-driven + legacy removal
 *   - detectV2()              -- v2 installation detection without false positives
 *   - isSafeToClean()         -- dangerous path rejection
 *
 * Covers: INST-01 (manifest-driven cleanup preserves user content)
 *         INST-02 (detectV2 no false positive on overlay src/)
 *         INST-03 (removal uses manifest, legacy fallback only touches known dirs)
 *
 * Origin: Phase 37 -- post-wipe incident safety validation (2026-04-01)
 */

const { test, describe, expect } = require('./helpers/portable-test-api');
const { beforeEach, afterEach } = process.versions.bun ? require('bun:test') : require('node:test');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');

const { createTempDir, SUBPROCESS_TIMEOUT } = require('./helpers');
const {
  readInstalledManifest,
  parseConfigDir,
  resolveTargetDir,
  removeGsdFiles,
  detectV2,
  isSafeToClean,
  uninstall,
  patchStatusLine,
  preflightInstallTarget,
  createInstallTransaction,
  rollbackInstallTransaction,
  install,
  copyOverlayFiles,
  writeInstallMeta,
  copyOverlayManifest,
  cleanOrphanedPaths,
  INSTALLED_MANIFEST_NAME,
} = require('../bin/install.js');

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/**
 * Representative user content that must survive all installer operations.
 * Mirrors the actual files destroyed in the 2026-04-01 wipe incident.
 */
const USER_CONTENT = {
  'CLAUDE.md': '# User CLAUDE.md\nCustom instructions',
  'rules/my-rule.md': '# Custom rule\nUser-defined rule content',
  'rules/another-rule.md': '# Another rule',
  'projects/myproject/memory/MEMORY.md': '# Project memory',
  'settings.json': JSON.stringify({ theme: 'dark', customSetting: true }),
  'skills/my-skill/SKILL.md': '# Custom skill',
  'scripts/my-script.sh': '#!/bin/bash\necho "user script"',
  'commands/my-cmd.md': '# Custom command',
};

/**
 * Populate a directory with all user content fixtures.
 * @param {string} dir - Target directory
 */
function populateUserContent(dir) {
  for (const [relPath, content] of Object.entries(USER_CONTENT)) {
    const fullPath = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }
}

/**
 * Assert all user content fixtures exist with unchanged content.
 * @param {string} dir - Target directory
 */
function assertUserContentIntact(dir) {
  for (const [relPath, expectedContent] of Object.entries(USER_CONTENT)) {
    const fullPath = path.join(dir, relPath);
    expect(fs.existsSync(fullPath)).toBe(true);
    expect(fs.readFileSync(fullPath, 'utf-8')).toBe(expectedContent);
  }
}

/**
 * Write a mock gsd-file-manifest.json using the exported constant.
 * @param {string} dir - Target directory
 * @param {string[]} files - Relative file paths to list in the manifest
 */
function writeManifest(dir, files) {
  const manifest = {
    version: '1.30.0',
    timestamp: '2026-03-29T21:05:13.431Z',
    files: Object.fromEntries(files.map((f) => [f, 'sha256hash'])),
  };
  fs.writeFileSync(
    path.join(dir, INSTALLED_MANIFEST_NAME),
    JSON.stringify(manifest)
  );
}

function writeMockDist(rootDir, overlayFiles = ['hooks/gsd-statusline.js']) {
  const distDir = path.join(rootDir, 'dist');
  fs.mkdirSync(path.join(distDir, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(distDir, 'bin', 'install.js'), '// upstream installer');
  fs.writeFileSync(
    path.join(distDir, '.overlay-manifest.json'),
    JSON.stringify(overlayFiles, null, 2)
  );
  fs.writeFileSync(
    path.join(distDir, '.install-meta.json'),
    JSON.stringify({
      upstream_version: '1.5.0',
      features_disabled: [],
      overrides_applied: [],
    }, null, 2)
  );

  for (const relPath of overlayFiles) {
    const fullPath = path.join(distDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, `dist:${relPath}`);
  }

  return distDir;
}

function spawnThatExits(code = 0) {
  return () => {
    const child = new EventEmitter();
    queueMicrotask(() => child.emit('exit', code));
    return child;
  };
}

describe('installer arguments and metadata', () => {
  for (const [args, expected] of [
    [[], null], [['--claude'], null], [['--config-dir'], null],
    [['--config-dir', '--global'], null], [['--config-dir', 'custom'], 'custom'],
    [['-c', '"quoted path"'], 'quoted path'], [['--config-dir=custom'], 'custom'],
    [["-c='quoted path'"], 'quoted path'],
  ]) {
    test(`config directory parsing: ${JSON.stringify(args)}`, () => {
      expect(parseConfigDir(args)).toBe(expected);
    });
  }

  test('target resolution respects local paths, explicit paths and runtime environment priorities', () => {
    const keys = ['OPENCODE_CONFIG_DIR', 'OPENCODE_CONFIG', 'XDG_CONFIG_HOME', 'GEMINI_CONFIG_DIR', 'CLAUDE_CONFIG_DIR'];
    const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    try {
      for (const key of keys) delete process.env[key];
      expect(resolveTargetDir(['--local', '--opencode'])).toBe(path.join(process.cwd(), '.opencode'));
      expect(resolveTargetDir(['--local', '--gemini'])).toBe(path.join(process.cwd(), '.gemini'));
      expect(resolveTargetDir(['--local', '--config-dir', 'ignored'])).toBe(path.join(process.cwd(), '.claude'));
      expect(resolveTargetDir(['--config-dir', 'explicit'])).toBe('explicit');
      expect(resolveTargetDir([])).toBe(path.join(os.homedir(), '.claude'));
      expect(resolveTargetDir(['--gemini'])).toBe(path.join(os.homedir(), '.gemini'));
      expect(resolveTargetDir(['--opencode'])).toBe(path.join(os.homedir(), '.config', 'opencode'));
      process.env.XDG_CONFIG_HOME = path.join(os.tmpdir(), 'xdg');
      expect(resolveTargetDir(['--opencode'])).toBe(path.join(process.env.XDG_CONFIG_HOME, 'opencode'));
      process.env.OPENCODE_CONFIG = path.join(os.tmpdir(), 'specific', 'opencode.json');
      expect(resolveTargetDir(['--opencode'])).toBe(path.dirname(process.env.OPENCODE_CONFIG));
      process.env.OPENCODE_CONFIG_DIR = path.join(os.tmpdir(), 'opencode-directory');
      expect(resolveTargetDir(['--opencode'])).toBe(process.env.OPENCODE_CONFIG_DIR);
      process.env.GEMINI_CONFIG_DIR = path.join(os.tmpdir(), 'gemini-directory');
      expect(resolveTargetDir(['--gemini'])).toBe(process.env.GEMINI_CONFIG_DIR);
      process.env.CLAUDE_CONFIG_DIR = path.join(os.tmpdir(), 'claude-directory');
      expect(resolveTargetDir([])).toBe(process.env.CLAUDE_CONFIG_DIR);
    } finally {
      for (const key of keys) {
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
      }
    }
  });

  test('metadata supports both upstream naming schemes and explicit package identity', () => {
    const tmp = createTempDir();
    try {
      const distDir = writeMockDist(tmp.path, []);
      const target = path.join(tmp.path, 'target');
      fs.mkdirSync(target);
      const packagePath = path.join(tmp.path, 'package.json');
      fs.writeFileSync(packagePath, JSON.stringify({ name: 'fixture-fork', version: '4.0.0' }));
      for (const input of [
        { upstreamPackage: 'upstream-camel', upstreamVersion: '1.2.3' },
        { upstream_package: 'upstream-snake', upstream_version: '2.3.4' },
        {},
      ]) {
        fs.writeFileSync(path.join(distDir, '.install-meta.json'), JSON.stringify(input));
        writeInstallMeta(target, distDir, packagePath);
        const meta = JSON.parse(fs.readFileSync(path.join(target, '.install-meta.json'), 'utf8'));
        expect(meta.forkPackage).toBe('fixture-fork');
        expect(meta.forkVersion).toBe('4.0.0');
        expect(meta.upstreamPackage).toBe(input.upstreamPackage || input.upstream_package || '@opengsd/gsd-core');
        expect(meta.upstreamVersion).toBe(input.upstreamVersion || input.upstream_version || require('../package.json').devDependencies['@opengsd/gsd-core']);
        expect(meta.features_disabled).toEqual([]);
        expect(meta.overrides_applied).toEqual([]);
      }
    } finally { tmp.cleanup(); }
  });

  test('overlay copying reports only available source files', () => {
    const tmp = createTempDir();
    try {
      const distDir = writeMockDist(tmp.path, ['hooks/present.js', 'hooks/absent.js']);
      fs.unlinkSync(path.join(distDir, 'hooks/absent.js'));
      const target = path.join(tmp.path, 'target');
      expect(copyOverlayFiles(distDir, target)).toBe(1);
      expect(fs.readFileSync(path.join(target, 'hooks/present.js'), 'utf8')).toBe('dist:hooks/present.js');
      expect(fs.existsSync(path.join(target, 'hooks/absent.js'))).toBe(false);
    } finally { tmp.cleanup(); }
  });
});

// ---------------------------------------------------------------------------
// Installer transaction preflight and rollback
// ---------------------------------------------------------------------------

describe('installer transaction safety', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('preflightInstallTarget rejects missing dist manifests before mutation', () => {
    const distDir = path.join(tmpDir.path, 'dist');
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(path.join(distDir, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(distDir, 'bin', 'install.js'), '// upstream installer');

    expect(() => preflightInstallTarget(targetDir, distDir)).toThrow('.overlay-manifest.json');

    fs.writeFileSync(path.join(distDir, '.overlay-manifest.json'), '[]');
    expect(() => preflightInstallTarget(targetDir, distDir)).toThrow('.install-meta.json');
  });

  test('createInstallTransaction snapshots previous metadata and settings.json', () => {
    const distDir = writeMockDist(tmpDir.path);
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(targetDir, { recursive: true });
    writeManifest(targetDir, ['hooks/gsd-statusline.js']);
    fs.writeFileSync(path.join(targetDir, '.overlay-manifest.json'), JSON.stringify(['hooks/pre-compact.js']));
    fs.writeFileSync(path.join(targetDir, '.install-meta.json'), JSON.stringify({ overlay_version: '3.0.1' }));
    fs.writeFileSync(path.join(targetDir, 'settings.json'), JSON.stringify({ theme: 'dark' }));

    const transaction = createInstallTransaction(targetDir, distDir);

    expect(transaction.snapshotDir).toContain('gsd-install-transaction-');
    expect(transaction.snapshots.map(snapshot => snapshot.relPath).sort()).toEqual([
      '.install-meta.json',
      '.overlay-manifest.json',
      'gsd-file-manifest.json',
      'gsd-local-patches',
      'gsd-pristine',
      'hooks/gsd-statusline.js',
      'hooks/pre-compact.js',
      'settings.json',
    ].sort());
    expect(fs.existsSync(path.join(transaction.snapshotDir, 'settings.json'))).toBe(true);
  });

  test('rollback restores settings.json and removes newly copied overlay files', () => {
    const distDir = writeMockDist(tmpDir.path, [
      'hooks/gsd-statusline.js',
      'commands/gsd/new-command.md',
    ]);
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(path.join(targetDir, 'rules'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'projects'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), '# user instructions');
    fs.writeFileSync(path.join(targetDir, 'rules', 'user.md'), '# user rule');
    fs.writeFileSync(path.join(targetDir, 'projects', 'keep.md'), '# user project');
    fs.writeFileSync(path.join(targetDir, 'settings.json'), JSON.stringify({ theme: 'dark' }));

    const transaction = createInstallTransaction(targetDir, distDir);

    fs.writeFileSync(path.join(targetDir, 'settings.json'), JSON.stringify({ statusLine: { command: 'node hooks/gsd-statusline.js' } }));
    fs.mkdirSync(path.join(targetDir, 'hooks'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'commands', 'gsd'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'hooks', 'gsd-statusline.js'), 'new overlay hook');
    fs.writeFileSync(path.join(targetDir, 'commands', 'gsd', 'new-command.md'), 'new overlay command');
    fs.writeFileSync(path.join(targetDir, '.overlay-manifest.json'), JSON.stringify(['commands/gsd/new-command.md']));

    const result = rollbackInstallTransaction(transaction);

    expect(result.rollback).toBe('applied');
    expect(JSON.parse(fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf-8'))).toEqual({ theme: 'dark' });
    expect(fs.existsSync(path.join(targetDir, 'hooks', 'gsd-statusline.js'))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, 'commands', 'gsd', 'new-command.md'))).toBe(false);
    expect(fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf-8')).toBe('# user instructions');
    expect(fs.readFileSync(path.join(targetDir, 'rules', 'user.md'), 'utf-8')).toBe('# user rule');
    expect(fs.readFileSync(path.join(targetDir, 'projects', 'keep.md'), 'utf-8')).toBe('# user project');
  });

  test('rollback preserves previously installed overlay files while removing new overlay files', () => {
    const distDir = writeMockDist(tmpDir.path, [
      'hooks/gsd-statusline.js',
      'hooks/gsd-check-update.js',
    ]);
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(path.join(targetDir, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'hooks', 'gsd-statusline.js'), 'previous hook');
    fs.writeFileSync(path.join(targetDir, '.overlay-manifest.json'), JSON.stringify(['hooks/gsd-statusline.js']));

    const transaction = createInstallTransaction(targetDir, distDir);

    fs.writeFileSync(path.join(targetDir, 'hooks', 'gsd-statusline.js'), 'new hook');
    fs.writeFileSync(path.join(targetDir, 'hooks', 'gsd-check-update.js'), 'new update hook');

    rollbackInstallTransaction(transaction);

    expect(fs.readFileSync(path.join(targetDir, 'hooks', 'gsd-statusline.js'), 'utf-8')).toBe('previous hook');
    expect(fs.existsSync(path.join(targetDir, 'hooks', 'gsd-check-update.js'))).toBe(false);
  });

  test('install reports rollback: "applied" when overlay copy fails after upstream success', async () => {
    const distDir = writeMockDist(tmpDir.path, ['hooks/gsd-statusline.js']);
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'settings.json'), JSON.stringify({ theme: 'dark' }));
    const exitCodes = [];

    const result = await install(distDir, targetDir, ['--claude'], {
      spawnImpl: spawnThatExits(0),
      copyOverlayFilesImpl: () => {
        fs.mkdirSync(path.join(targetDir, 'hooks'), { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'hooks', 'gsd-statusline.js'), 'partial');
        throw new Error('overlay failed');
      },
      exitImpl: code => exitCodes.push(code),
      logImpl: () => {},
      errorImpl: () => {},
    });

    expect(result.rollback).toBe('applied');
    expect(result.failureStep).toBe('overlay');
    expect(exitCodes).toEqual([1]);
    expect(fs.existsSync(path.join(targetDir, 'hooks', 'gsd-statusline.js'))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf-8'))).toEqual({ theme: 'dark' });
  });

  for (const cleanupFails of [false, true]) {
  test(`snapshot copy failure preserves diagnostics and never spawns upstream (cleanup failure: ${cleanupFails})`, async () => {
    const distDir = writeMockDist(tmpDir.path);
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(targetDir);
    fs.writeFileSync(path.join(targetDir, 'settings.json'), 'owner bytes');
    const copy = fs.copyFileSync;
    const remove = fs.rmSync;
    let snapshotDir;
    let spawned = false;
    try {
      fs.rmSync = (target, options) => {
        if (cleanupFails && target === snapshotDir) throw new Error('snapshot cleanup denied');
        return remove(target, options);
      };
      fs.copyFileSync = (source, destination, ...args) => {
        if (path.basename(source) === 'settings.json') {
          snapshotDir = path.dirname(destination);
          throw new Error('snapshot storage unavailable');
        }
        return copy(source, destination, ...args);
      };
      const result = await install(distDir, targetDir, [], {
        spawnImpl: () => { spawned = true; return spawnThatExits()(); },
        exitImpl: () => {}, logImpl: () => {}, errorImpl: () => {},
      });
      expect(result.failureStep).toBe('preflight');
      expect(result.error.message).toContain('snapshot storage unavailable');
      expect(spawned).toBe(false);
      expect(fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf8')).toBe('owner bytes');
      expect(snapshotDir).toBeDefined();
      expect(fs.existsSync(snapshotDir)).toBe(cleanupFails);
      if (cleanupFails) {
        expect(result.error.message).toContain('snapshot cleanup denied');
        expect(result.error.message).toContain(snapshotDir);
      }
    } finally {
      fs.copyFileSync = copy;
      fs.rmSync = remove;
      if (snapshotDir) {
        const resolved = path.resolve(snapshotDir);
        if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('gsd-install-transaction-')) {
          throw new Error('Refusing cleanup outside this test transaction');
        }
        fs.rmSync(resolved, { recursive: true, force: true });
      }
    }
  });
  }

  for (const finalStatus of [0, 1]) {
    test(`spawn error followed by exit ${finalStatus} settles once without subsequent mutation`, async () => {
      const distDir = writeMockDist(tmpDir.path);
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir);
      fs.writeFileSync(path.join(targetDir, 'settings.json'), '{"owner":true}');
      const child = new EventEmitter();
      const exits = [];
      let overlayCalls = 0;
      const pending = install(distDir, targetDir, [], {
        spawnImpl: () => child,
        copyOverlayFilesImpl: () => { overlayCalls++; return 0; },
        exitImpl: code => exits.push(code), logImpl: () => {}, errorImpl: () => {},
      });
      child.emit('error', new Error('spawn failed'));
      child.emit('exit', finalStatus);
      child.emit('error', new Error('late error'));
      const result = await pending;
      expect(result.failureStep).toBe('spawn');
      expect(result.rollback).toBe('applied');
      expect(exits).toEqual([1]);
      expect(overlayCalls).toBe(0);
      expect(fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf8')).toBe('{"owner":true}');
    });
  }

  for (const scenario of ['unsafe-target', 'missing-installer', 'corrupt-overlay', 'nonarray-overlay', 'corrupt-metadata']) {
    test(`preflight refuses ${scenario} without running the installer`, async () => {
      const distDir = writeMockDist(tmpDir.path);
      const targetDir = scenario === 'unsafe-target' ? os.homedir() : path.join(tmpDir.path, 'target');
      if (scenario === 'missing-installer') fs.unlinkSync(path.join(distDir, 'bin/install.js'));
      if (scenario === 'corrupt-overlay') fs.writeFileSync(path.join(distDir, '.overlay-manifest.json'), '{');
      if (scenario === 'nonarray-overlay') fs.writeFileSync(path.join(distDir, '.overlay-manifest.json'), '{}');
      if (scenario === 'corrupt-metadata') fs.writeFileSync(path.join(distDir, '.install-meta.json'), '{');
      let spawned = false;
      const result = await install(distDir, targetDir, [], {
        spawnImpl: () => { spawned = true; return spawnThatExits()(); },
        exitImpl: () => {}, logImpl: () => {}, errorImpl: () => {},
      });
      expect(result.status).toBe(1);
      expect(result.failureStep).toBe('preflight');
      expect(result.rollback).toBe('not_started');
      expect(spawned).toBe(false);
    });
  }

  for (const scenario of ['throw', 'signal', 'noninteger']) {
    test(`upstream ${scenario} produces a nonzero result and restores owner settings`, async () => {
      const distDir = writeMockDist(tmpDir.path);
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir);
      fs.writeFileSync(path.join(targetDir, 'settings.json'), 'owner bytes');
      const exits = [];
      const result = await install(distDir, targetDir, [], {
        spawnImpl: () => {
          fs.writeFileSync(path.join(targetDir, 'settings.json'), 'partial upstream write');
          if (scenario === 'throw') throw new Error('cannot create child');
          return spawnThatExits(scenario === 'signal' ? null : 'failure')();
        },
        exitImpl: code => exits.push(code), logImpl: () => {}, errorImpl: () => {},
      });
      expect(result.status).toBe(1);
      expect(exits).toEqual([1]);
      expect(result.rollback).toBe('applied');
      expect(fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf8')).toBe('owner bytes');
    });
  }

  test('successful install keeps a custom statusline and archives patches without a pristine tree', async () => {
    const distDir = writeMockDist(tmpDir.path);
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(path.join(targetDir, 'gsd-local-patches'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'hooks/dist'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'gsd-local-patches/keep'), 'authored');
    const settings = '{"statusLine":{"command":"my-status"}}';
    fs.writeFileSync(path.join(targetDir, 'settings.json'), settings);
    const logs = [];
    const result = await install(distDir, targetDir, [], {
      spawnImpl: spawnThatExits(), exitImpl: () => {}, logImpl: text => logs.push(text), errorImpl: () => {},
    });
    expect(result.status).toBe(0);
    expect(fs.readFileSync(path.join(targetDir, 'settings.json'), 'utf8')).toBe(settings);
    expect(fs.existsSync(path.join(targetDir, 'hooks/dist'))).toBe(false);
    const history = path.join(targetDir, 'gsd-local-patch-history');
    const generation = path.join(history, fs.readdirSync(history)[0]);
    expect(fs.readFileSync(path.join(generation, 'gsd-local-patches/keep'), 'utf8')).toBe('authored');
    expect(fs.existsSync(path.join(generation, 'gsd-pristine'))).toBe(false);
    expect(logs.join('\n')).toContain('preserved existing custom setting');
    expect(logs.join('\n')).toContain('Cleaned 1 orphaned path');
  });

  for (const overlayValue of ['{', '{}', '[null, "", "hooks/old.js", "../outside.txt"]']) {
    test(`rollback tolerates old malformed overlay inventory ${overlayValue}`, () => {
      const distDir = writeMockDist(tmpDir.path);
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir);
      fs.writeFileSync(path.join(targetDir, '.overlay-manifest.json'), overlayValue);
      fs.writeFileSync(path.join(tmpDir.path, 'outside.txt'), 'outside owner');
      const transaction = createInstallTransaction(targetDir, distDir);
      expect(transaction.snapshots.every(item => !item.relPath.startsWith('../'))).toBe(true);
      rollbackInstallTransaction(transaction);
      expect(fs.readFileSync(path.join(tmpDir.path, 'outside.txt'), 'utf8')).toBe('outside owner');
      expect(fs.readFileSync(path.join(targetDir, '.overlay-manifest.json'), 'utf8')).toBe(overlayValue);
    });
  }

  for (const upstreamStatus of [0, 1]) {
    test(`a later install preserves earlier patch generations before upstream runs (status ${upstreamStatus})`, async () => {
      const distDir = writeMockDist(tmpDir.path);
      const targetDir = path.join(tmpDir.path, 'target');
      const patches = path.join(targetDir, 'gsd-local-patches');
      const pristine = path.join(targetDir, 'gsd-pristine');
      fs.mkdirSync(path.join(patches, 'hooks'), { recursive: true });
      fs.mkdirSync(path.join(pristine, 'hooks'), { recursive: true });
      const oldMeta = JSON.stringify({ files: ['hooks/gsd-statusline.js', 'retained.md'], pristine_hashes: { 'hooks/gsd-statusline.js': 'old-hash' } });
      fs.writeFileSync(path.join(patches, 'backup-meta.json'), oldMeta);
      fs.writeFileSync(path.join(patches, 'hooks/gsd-statusline.js'), 'authored customization');
      fs.writeFileSync(path.join(patches, 'retained.md'), 'older patch absent from new manifest');
      fs.writeFileSync(path.join(pristine, 'hooks/gsd-statusline.js'), 'old pristine baseline');
      const messages = [];
      let firstGeneration;
      const options = {
        spawnImpl: () => {
          const history = path.join(targetDir, 'gsd-local-patch-history');
          const generations = fs.readdirSync(history);
          expect(generations.length).toBeGreaterThan(0);
          firstGeneration ||= generations[0];
          const generation = path.join(history, firstGeneration);
          expect(fs.readFileSync(path.join(generation, 'gsd-local-patches/backup-meta.json'), 'utf8')).toBe(oldMeta);
          expect(fs.readFileSync(path.join(generation, 'gsd-local-patches/hooks/gsd-statusline.js'), 'utf8')).toBe('authored customization');
          expect(fs.readFileSync(path.join(generation, 'gsd-local-patches/retained.md'), 'utf8')).toBe('older patch absent from new manifest');
          expect(fs.readFileSync(path.join(generation, 'gsd-pristine/hooks/gsd-statusline.js'), 'utf8')).toBe('old pristine baseline');
          // Reproduce upstream saveLocalPatches overwriting the same file and its inventory.
          fs.writeFileSync(path.join(patches, 'hooks/gsd-statusline.js'), 'generated overlay');
          fs.writeFileSync(path.join(patches, 'backup-meta.json'), JSON.stringify({ files: ['hooks/gsd-statusline.js'] }));
          fs.writeFileSync(path.join(pristine, 'hooks/gsd-statusline.js'), 'new baseline');
          return spawnThatExits(upstreamStatus)();
        },
        exitImpl: () => {}, logImpl: text => messages.push(text), errorImpl: () => {},
      };
      const result = await install(distDir, targetDir, ['--claude'], options);
      expect(result.status).toBe(upstreamStatus);
      expect(result.failureStep).toBe(upstreamStatus === 0 ? undefined : 'upstream');
      expect(messages.join('\n')).toContain('gsd-local-patch-history');
      if (upstreamStatus !== 0) {
        expect(fs.readFileSync(path.join(patches, 'backup-meta.json'), 'utf8')).toBe(oldMeta);
        expect(fs.readFileSync(path.join(patches, 'hooks/gsd-statusline.js'), 'utf8')).toBe('authored customization');
        expect(fs.readFileSync(path.join(pristine, 'hooks/gsd-statusline.js'), 'utf8')).toBe('old pristine baseline');
      } else {
        const second = await install(distDir, targetDir, ['--claude'], options);
        expect(second.status).toBe(0);
        const history = path.join(targetDir, 'gsd-local-patch-history');
        const generations = fs.readdirSync(history);
        expect(generations.length).toBe(2);
        const secondGeneration = path.join(history, generations.find(name => name !== firstGeneration));
        expect(JSON.parse(fs.readFileSync(path.join(secondGeneration, 'gsd-local-patches/backup-meta.json'), 'utf8'))).toEqual({ files: ['hooks/gsd-statusline.js'] });
        expect(fs.readFileSync(path.join(secondGeneration, 'gsd-local-patches/hooks/gsd-statusline.js'), 'utf8')).toBe('generated overlay');
        expect(fs.readFileSync(path.join(secondGeneration, 'gsd-pristine/hooks/gsd-statusline.js'), 'utf8')).toBe('new baseline');
      }
    });
  }

  test('failed archive copy cannot expose a partial completed generation or spawn upstream', async () => {
    const distDir = writeMockDist(tmpDir.path);
    const targetDir = path.join(tmpDir.path, 'target');
    for (const name of ['gsd-local-patches', 'gsd-pristine']) {
      fs.mkdirSync(path.join(targetDir, name), { recursive: true });
      fs.writeFileSync(path.join(targetDir, name, 'keep.txt'), name);
    }
    const copy = fs.cpSync;
    let spawned = false;
    try {
      fs.cpSync = (source, destination, options) => {
        if (destination.includes('gsd-local-patch-history') && path.basename(destination) === 'gsd-pristine') {
          throw new Error('intentional archive copy failure');
        }
        return copy(source, destination, options);
      };
      const result = await install(distDir, targetDir, ['--claude'], {
        spawnImpl: () => { spawned = true; return spawnThatExits(0)(); },
        exitImpl: () => {}, logImpl: () => {}, errorImpl: () => {},
      });
      expect(result.status).toBe(1);
      expect(result.error.message).toContain('intentional archive copy failure');
      expect(spawned).toBe(false);
      expect(fs.readdirSync(path.join(targetDir, 'gsd-local-patch-history'))).toEqual([]);
      for (const name of ['gsd-local-patches', 'gsd-pristine']) {
        expect(fs.readFileSync(path.join(targetDir, name, 'keep.txt'), 'utf8')).toBe(name);
      }
    } finally { fs.cpSync = copy; }
  });

  for (const linkedPath of ['gsd-local-patches', 'gsd-pristine', 'gsd-local-patches/nested', 'gsd-local-patch-history']) {
    test(`install refuses linked backup content at ${linkedPath} before upstream mutation`, async () => {
      const distDir = writeMockDist(tmpDir.path);
      const targetDir = path.join(tmpDir.path, 'target');
      const outside = path.join(tmpDir.path, 'outside');
      fs.mkdirSync(path.join(targetDir, 'gsd-local-patches'), { recursive: true });
      fs.mkdirSync(outside);
      fs.writeFileSync(path.join(outside, 'owner.txt'), 'untouched');
      const link = path.join(targetDir, linkedPath);
      if (fs.existsSync(link)) fs.rmdirSync(link);
      fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
      let spawned = false;
      const errors = [];
      const result = await install(distDir, targetDir, ['--claude'], {
        spawnImpl: () => { spawned = true; return spawnThatExits(0)(); },
        exitImpl: () => {}, logImpl: () => {}, errorImpl: text => errors.push(text),
      });
      expect(result.status).toBe(1);
      expect(result.failureStep).toBe('preflight');
      expect(spawned).toBe(false);
      expect(errors.join('\n')).toMatch(/non-regular|Unsafe local patch history/);
      expect(fs.readFileSync(path.join(outside, 'owner.txt'), 'utf8')).toBe('untouched');
    });
  }
});

// ---------------------------------------------------------------------------
// readInstalledManifest
// ---------------------------------------------------------------------------

describe('readInstalledManifest', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('returns array of relative paths when valid manifest exists', () => {
    const files = [
      'get-shit-done/bin/gsd-tools.cjs',
      'commands/gsd/workstreams.md',
      'hooks/gsd-statusline.js',
    ];
    writeManifest(tmpDir.path, files);

    const result = readInstalledManifest(tmpDir.path);
    expect(result).toEqual(files);
  });

  test('returns empty array when no manifest file exists', () => {
    const result = readInstalledManifest(tmpDir.path);
    expect(result).toEqual([]);
  });

  test('returns empty array when manifest is corrupt JSON', () => {
    fs.writeFileSync(
      path.join(tmpDir.path, INSTALLED_MANIFEST_NAME),
      '{ invalid json !!!'
    );

    const result = readInstalledManifest(tmpDir.path);
    expect(result).toEqual([]);
  });

  test('returns empty array when manifest.files is missing', () => {
    fs.writeFileSync(
      path.join(tmpDir.path, INSTALLED_MANIFEST_NAME),
      JSON.stringify({ version: '1.0.0', timestamp: '2026-01-01' })
    );

    const result = readInstalledManifest(tmpDir.path);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// removeGsdFiles
// ---------------------------------------------------------------------------

describe('removeGsdFiles', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('INST-01: manifest strategy removes listed files, user content survives', () => {
    const manifestFiles = [
      'get-shit-done/bin/gsd-tools.cjs',
      'get-shit-done/bin/lib/commands.cjs',
      'get-shit-done/templates/config.json',
      'commands/gsd/workstreams.md',
      'agents/gsd-executor.md',
      'hooks/gsd-statusline.js',
    ];

    // Create manifest-listed GSD files
    for (const f of manifestFiles) {
      const fullPath = path.join(tmpDir.path, f);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, 'gsd content');
    }

    // Create user content
    populateUserContent(tmpDir.path);

    // Write manifest
    writeManifest(tmpDir.path, manifestFiles);

    // Act
    const result = removeGsdFiles(tmpDir.path, true);

    // Assert: strategy is manifest
    expect(result.strategy).toBe('manifest');

    // Assert: all manifest-listed files removed
    for (const f of manifestFiles) {
      expect(fs.existsSync(path.join(tmpDir.path, f))).toBe(false);
    }

    // Assert: user content intact (INST-01 critical assertion)
    assertUserContentIntact(tmpDir.path);
  });

  test('INST-03: legacy fallback removes only known GSD package roots', () => {
    // No manifest -- triggers legacy fallback

    // Create v2-style directories
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'get-stuff-done', 'bin', 'tools.cjs'), 'v2 code');

    fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'get-shit-done', 'bin', 'tools.cjs'), 'v3 code');

    fs.mkdirSync(path.join(tmpDir.path, 'gsd-core', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'gsd-core', 'bin', 'tools.cjs'), 'open gsd code');

    // Create user content
    populateUserContent(tmpDir.path);

    // Act
    const result = removeGsdFiles(tmpDir.path, true);

    // Assert: strategy is legacy-fallback
    expect(result.strategy).toBe('legacy-fallback');

    // Assert: v2 directories removed
    expect(fs.existsSync(path.join(tmpDir.path, 'get-stuff-done'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'gsd-core'))).toBe(false);

    // Assert: user content intact (INST-03)
    assertUserContentIntact(tmpDir.path);
  });

  test('manifest strategy prunes empty directories after file removal', () => {
    const manifestFiles = [
      'get-shit-done/bin/lib/deep/file.cjs',
    ];

    // Create the file
    const fullPath = path.join(tmpDir.path, manifestFiles[0]);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, 'content');

    // Write manifest
    writeManifest(tmpDir.path, manifestFiles);

    // Act
    removeGsdFiles(tmpDir.path, true);

    // Assert: the file is gone
    expect(fs.existsSync(fullPath)).toBe(false);

    // Assert: empty parent directories pruned all the way up
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done', 'bin', 'lib', 'deep'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done', 'bin', 'lib'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done', 'bin'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done'))).toBe(false);
  });

  test('manifest strategy also removes overlay-manifest files', () => {
    const upstreamFiles = ['gsd-core/bin/install.js'];
    const overlayFiles = ['hooks/pre-compact.js', 'src/platform/detect.js'];

    for (const f of [...upstreamFiles, ...overlayFiles]) {
      const fullPath = path.join(tmpDir.path, f);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, 'content');
    }

    writeManifest(tmpDir.path, upstreamFiles);
    fs.writeFileSync(
      path.join(tmpDir.path, '.overlay-manifest.json'),
      JSON.stringify(overlayFiles),
      'utf-8'
    );

    const result = removeGsdFiles(tmpDir.path, true);

    expect(result.strategy).toBe('manifest');
    for (const f of [...upstreamFiles, ...overlayFiles]) {
      expect(fs.existsSync(path.join(tmpDir.path, f))).toBe(false);
    }
    expect(fs.existsSync(path.join(tmpDir.path, '.overlay-manifest.json'))).toBe(false);
  });

  test('does NOT prune directory containing user file (co-located content)', () => {
    // Pitfall 4: GSD file and user file in the same directory
    const manifestFiles = [
      'hooks/gsd-statusline.js',
    ];

    // Create GSD file listed in manifest
    fs.mkdirSync(path.join(tmpDir.path, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'hooks', 'gsd-statusline.js'), 'gsd hook');

    // Create user file in the SAME directory
    fs.writeFileSync(path.join(tmpDir.path, 'hooks', 'my-custom-hook.js'), 'user hook content');

    // Write manifest
    writeManifest(tmpDir.path, manifestFiles);

    // Act
    removeGsdFiles(tmpDir.path, true);

    // Assert: GSD file removed
    expect(fs.existsSync(path.join(tmpDir.path, 'hooks', 'gsd-statusline.js'))).toBe(false);

    // Assert: hooks/ directory still exists because user file is there
    expect(fs.existsSync(path.join(tmpDir.path, 'hooks'))).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir.path, 'hooks', 'my-custom-hook.js'), 'utf-8')).toBe('user hook content');
  });

  test('always removes GSD metadata files', () => {
    // Create metadata files at target root
    fs.writeFileSync(path.join(tmpDir.path, INSTALLED_MANIFEST_NAME), '{}');
    fs.writeFileSync(path.join(tmpDir.path, '.install-meta.json'), '{}');
    fs.writeFileSync(path.join(tmpDir.path, '.overlay-manifest.json'), '[]');
    fs.writeFileSync(path.join(tmpDir.path, '.gsd-profile'), 'full');
    fs.writeFileSync(path.join(tmpDir.path, 'CREDITS.md'), '# Credits');
    fs.writeFileSync(path.join(tmpDir.path, 'gsd-install-state.json'), '{}');
    fs.writeFileSync(path.join(tmpDir.path, 'package.json'), '{}');

    // Write a valid manifest so it uses manifest strategy
    writeManifest(tmpDir.path, ['get-shit-done/bin/gsd-tools.cjs']);
    fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'get-shit-done', 'bin', 'gsd-tools.cjs'), 'content');

    // Act
    removeGsdFiles(tmpDir.path, true);

    // Assert: all metadata files removed
    expect(fs.existsSync(path.join(tmpDir.path, INSTALLED_MANIFEST_NAME))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, '.install-meta.json'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, '.overlay-manifest.json'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, '.gsd-profile'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'CREDITS.md'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'gsd-install-state.json'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'package.json'))).toBe(false);
  });

  test('returns correct strategy and removed count', () => {
    const manifestFiles = [
      'get-shit-done/bin/gsd-tools.cjs',
      'hooks/gsd-statusline.js',
    ];

    // Create the manifest-listed files
    for (const f of manifestFiles) {
      const fullPath = path.join(tmpDir.path, f);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, 'content');
    }

    // Also create metadata that gets cleaned
    fs.writeFileSync(path.join(tmpDir.path, '.install-meta.json'), '{}');

    // Write manifest
    writeManifest(tmpDir.path, manifestFiles);

    // Act
    const result = removeGsdFiles(tmpDir.path, true);

    // Assert: strategy is manifest
    expect(result.strategy).toBe('manifest');

    // Assert: removed = 2 manifest files + manifest file itself + .install-meta.json = 4
    expect(result.removed).toBe(4);
  });

  // -------------------------------------------------------------------------
  // Path containment (traversal rejection)
  // -------------------------------------------------------------------------

  describe('path containment (traversal rejection)', () => {
    test('rejects manifest entry with ../ traversal', () => {
      // Create a file OUTSIDE targetDir that a traversal would reach
      const escapeDir = path.join(path.dirname(tmpDir.path), 'escape-target');
      fs.mkdirSync(escapeDir, { recursive: true });
      const escapeFile = path.join(escapeDir, 'precious.txt');
      fs.writeFileSync(escapeFile, 'must survive');

      // Create a valid GSD file inside targetDir
      fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir.path, 'get-shit-done', 'legit.cjs'), 'gsd');

      // Write manifest with traversal entry + valid entry
      writeManifest(tmpDir.path, [
        '../escape-target/precious.txt',
        'get-shit-done/legit.cjs',
      ]);

      const result = removeGsdFiles(tmpDir.path, true);

      // Traversal entry skipped, valid entry removed
      expect(fs.existsSync(escapeFile)).toBe(true);
      expect(fs.readFileSync(escapeFile, 'utf-8')).toBe('must survive');
      expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done', 'legit.cjs'))).toBe(false);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
      expect(result.removed).toBeGreaterThanOrEqual(1);

      // Cleanup escape dir
      fs.rmSync(escapeDir, { recursive: true, force: true });
    });

    test('rejects manifest entry with deeply nested traversal (../../)', () => {
      const nestedTarget = path.join(tmpDir.path, 'inner', 'target');
      fs.mkdirSync(nestedTarget, { recursive: true });
      const deepEscape = path.join(tmpDir.path, 'fake-bashrc');
      fs.mkdirSync(path.dirname(deepEscape), { recursive: true });
      fs.writeFileSync(deepEscape, 'shell config');

      writeManifest(nestedTarget, ['../../fake-bashrc']);

      const result = removeGsdFiles(nestedTarget, true);
      expect(fs.existsSync(deepEscape)).toBe(true);
      expect(result.skipped).toBeGreaterThanOrEqual(1);

      fs.rmSync(deepEscape, { force: true });
    });

    test('rejects absolute paths that resolve outside targetDir', () => {
      // On Unix, /etc/passwd resolves to itself (outside targetDir).
      // On Windows, path.join(target, '/etc/passwd') stays inside target (no escape).
      // Use a path that is guaranteed to escape on the current platform.
      const outsidePath = path.resolve(path.join(tmpDir.path, '..', '..', 'abs-escape-test.txt'));
      // Compute the ../ relative path from targetDir to that location
      const relEscape = path.relative(tmpDir.path, outsidePath);

      writeManifest(tmpDir.path, [relEscape]);

      const result = removeGsdFiles(tmpDir.path, true);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
    });

    test('rejects entries using platform-native absolute paths', () => {
      // Construct an absolute path on the current OS that is clearly outside targetDir
      const absoluteOutside = path.join(os.tmpdir(), 'gsd-abs-escape-test', 'evil.txt');
      // Compute relative path from targetDir to that location -- will contain ../
      const relToAbsolute = path.relative(tmpDir.path, absoluteOutside);

      writeManifest(tmpDir.path, [relToAbsolute]);

      const result = removeGsdFiles(tmpDir.path, true);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
    });

    test('mixed valid and traversal entries: deletes valid, skips traversal, user content intact', () => {
      // Valid GSD files
      const validFiles = [
        'get-shit-done/bin/gsd-tools.cjs',
        'commands/gsd/workstreams.md',
      ];
      for (const f of validFiles) {
        const fp = path.join(tmpDir.path, f);
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, 'gsd content');
      }

      // User content
      populateUserContent(tmpDir.path);

      // Manifest with valid + traversal entries (../escape always escapes on all platforms)
      writeManifest(tmpDir.path, [
        ...validFiles,
        '../escape/nope.txt',
        '../../another-escape/nope.txt',
      ]);

      const result = removeGsdFiles(tmpDir.path, true);

      expect(result.strategy).toBe('manifest');
      expect(result.skipped).toBe(2);
      // Valid files removed
      for (const f of validFiles) {
        expect(fs.existsSync(path.join(tmpDir.path, f))).toBe(false);
      }
      // User content intact
      assertUserContentIntact(tmpDir.path);
    });
  });
});

// ---------------------------------------------------------------------------
// detectV2
// ---------------------------------------------------------------------------

describe('detectV2', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('INST-02: returns false for overlay-installed dir with src/ and overlay_version', () => {
    // Overlay v3.0 installs src/ files AND writes .install-meta.json with overlay_version
    fs.mkdirSync(path.join(tmpDir.path, 'src', 'config'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'src', 'config', 'index.js'), '// overlay code');
    fs.writeFileSync(
      path.join(tmpDir.path, '.install-meta.json'),
      JSON.stringify({ overlay_version: '3.0.0' })
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });

  test('INST-02: returns false when only src/ exists (no meta files)', () => {
    // Critical false-positive regression: src/ alone must NOT trigger v2 detection
    fs.mkdirSync(path.join(tmpDir.path, 'src', 'config'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'src', 'config', 'index.js'), '// some code');

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });

  test('returns true with signal meta for v2.x meta without overlay_version', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-stuff-done', '.install-meta.json'),
      JSON.stringify({ version: '2.4.0', installType: 'link' })
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('meta');
  });

  test('returns true with version string from v2.x meta', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-stuff-done', '.install-meta.json'),
      JSON.stringify({ version: '2.4.0', installType: 'link' })
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('meta');
    expect(result.version).toBe('2.4.0');
  });

  test('returns true with signal meta-corrupt for corrupt meta JSON', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-stuff-done', '.install-meta.json'),
      '{ broken json !!!'
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('meta-corrupt');
  });

  test('returns true with signal directory-name when get-stuff-done/ exists without gsd-core/', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done', 'bin'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-stuff-done', 'bin', 'tools.cjs'),
      'v2 code'
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('directory-name');
  });

  test('returns false for empty directory', () => {
    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });

  test('returns false when both get-stuff-done/ and gsd-core/ exist (active install present)', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir.path, 'gsd-core'), { recursive: true });

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });

  test('returns false when only get-shit-done/ exists (v3 baseline, not v2)', () => {
    // Per Gemini review: get-shit-done-only is a v3 baseline state.
    // The directory-name signal is specific to get-stuff-done/, not get-shit-done/.
    fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done', 'bin'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-shit-done', 'bin', 'gsd-tools.cjs'),
      'v3 code'
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSafeToClean
// ---------------------------------------------------------------------------

describe('isSafeToClean', { timeout: SUBPROCESS_TIMEOUT }, () => {
  test('refuses home directory', () => {
    const result = isSafeToClean(os.homedir());
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('home directory');
  });

  test('refuses filesystem root', () => {
    const root = path.parse(os.homedir()).root;
    const result = isSafeToClean(root);
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('filesystem root');
  });

  test('refuses shallow paths (single segment below root)', () => {
    const root = path.parse(os.homedir()).root;
    const shallowPath = path.join(root, 'single');
    const result = isSafeToClean(shallowPath);
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('too shallow');
  });

  test('accepts valid deep path', () => {
    const deepPath = path.join(os.tmpdir(), 'gsd-test-abc123');
    const result = isSafeToClean(deepPath);
    expect(result.safe).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// uninstall (public entrypoint)
// ---------------------------------------------------------------------------

describe('uninstall', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('removes GSD files via manifest and preserves user content', () => {
    // Seed GSD files
    const gsdFiles = [
      'get-shit-done/bin/gsd-tools.cjs',
      'commands/gsd/workstreams.md',
    ];
    for (const f of gsdFiles) {
      const fp = path.join(tmpDir.path, f);
      fs.mkdirSync(path.dirname(fp), { recursive: true });
      fs.writeFileSync(fp, 'gsd content');
    }

    // Seed user content
    populateUserContent(tmpDir.path);

    // Write manifest
    writeManifest(tmpDir.path, gsdFiles);

    // Act -- exit: false so we don't kill the test runner
    const result = uninstall(tmpDir.path, { exit: false });

    // Assert: GSD files removed
    for (const f of gsdFiles) {
      expect(fs.existsSync(path.join(tmpDir.path, f))).toBe(false);
    }

    // Assert: user content intact
    assertUserContentIntact(tmpDir.path);

    // Assert: result contains removal info
    expect(result.removed).toBeGreaterThanOrEqual(1);
    expect(result.strategy).toBeDefined();
  });

  test('handles non-existent directory without throwing', () => {
    const missingDir = path.join(tmpDir.path, 'does-not-exist');

    // Should not throw
    const result = uninstall(missingDir, { exit: false });
    expect(result.removed).toBe(0);
    expect(result.missing).toBe(true);
  });

  test('legacy fallback path through uninstall removes only known dirs', () => {
    // No manifest -- triggers legacy fallback via removeGsdFiles
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'get-stuff-done', 'bin', 'tools.cjs'), 'v2');

    populateUserContent(tmpDir.path);

    const result = uninstall(tmpDir.path, { exit: false });

    expect(fs.existsSync(path.join(tmpDir.path, 'get-stuff-done'))).toBe(false);
    assertUserContentIntact(tmpDir.path);
    expect(result.strategy).toBe('legacy-fallback');
  });
});

// ---------------------------------------------------------------------------
// patchStatusLine
// ---------------------------------------------------------------------------

describe('patchStatusLine', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('creates settings.json and adds statusLine when file missing', () => {
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('added');
    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir.path, 'settings.json'), 'utf8'));
    expect(settings.statusLine).toBeDefined();
    expect(settings.statusLine.type).toBe('command');
    expect(settings.statusLine.command).toContain('gsd-statusline.js');
  });

  test('adds statusLine to existing settings with other keys', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: { pre_compact: 'node hooks/pre-compact.js' },
      theme: 'dark'
    }, null, 2));
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('added');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine.command).toContain('gsd-statusline.js');
    expect(settings.hooks).toBeDefined();  // preserved
    expect(settings.theme).toBe('dark');    // preserved
  });

  test('preserves custom non-GSD statusLine (per D-06)', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      statusLine: { type: 'command', command: 'node my-custom-statusline.js' }
    }, null, 2));
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('preserved_custom');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine.command).toBe('node my-custom-statusline.js');
  });

  test('updates existing GSD statusLine path', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      statusLine: { type: 'command', command: 'node "/old/path/hooks/gsd-statusline.js"' }
    }, null, 2));
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('updated');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine.command).toContain(tmpDir.path.replace(/\\/g, '/'));
  });

  test('uses forward-slash paths in command', () => {
    const result = patchStatusLine(tmpDir.path);
    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir.path, 'settings.json'), 'utf8'));
    expect(settings.statusLine.command).not.toContain('\\');
  });

  test('handles corrupt settings.json with backup and warning (not silent reset)', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, 'not valid json{{{');
    const result = patchStatusLine(tmpDir.path);
    // Must create backup
    expect(fs.existsSync(settingsPath + '.backup')).toBe(true);
    expect(fs.readFileSync(settingsPath + '.backup', 'utf8')).toBe('not valid json{{{');
    // Must still write valid settings
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine).toBeDefined();
    expect(result.action).toBe('added');
  });

  test('returns correct action for empty settings (no statusLine key)', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, '{}');
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('added');
  });

  test('uses atomic write (temp file + rename) to prevent TOCTOU', () => {
    // Structural verification: patchStatusLine source code must use renameSync
    const installSrc = fs.readFileSync(path.join(__dirname, '..', 'bin', 'install.js'), 'utf8');
    // Extract the patchStatusLine function body
    const fnStart = installSrc.indexOf('function patchStatusLine(');
    const fnBody = installSrc.slice(fnStart, installSrc.indexOf('\n}', fnStart) + 2);

    // Must use temp file + rename pattern (atomic write)
    expect(fnBody).toContain('renameSync');
    expect(fnBody).toContain('.tmp');
    // Must NOT use direct writeFileSync on the settings path for the final write
    // (writeFileSync is still used for the temp file, which is fine)
  });
});

// ---------------------------------------------------------------------------
// copyOverlayManifest
// ---------------------------------------------------------------------------

describe('copyOverlayManifest', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('copies .overlay-manifest.json to target root', () => {
    // Create a mock dist dir with .overlay-manifest.json
    const distDir = path.join(tmpDir.path, 'mock-dist');
    fs.mkdirSync(distDir);
    const manifest = ['hooks/gsd-statusline.js', 'hooks/gsd-check-update.js'];
    fs.writeFileSync(
      path.join(distDir, '.overlay-manifest.json'),
      JSON.stringify(manifest)
    );

    const result = copyOverlayManifest(distDir, tmpDir.path);

    const installed = path.join(tmpDir.path, '.overlay-manifest.json');
    expect(result).toBe(true);
    expect(fs.existsSync(installed)).toBe(true);
    expect(JSON.parse(fs.readFileSync(installed, 'utf8'))).toEqual(manifest);
  });

  test('does not require an upstream package root in target', () => {
    const distDir = path.join(tmpDir.path, 'mock-dist');
    fs.mkdirSync(distDir);
    const manifest = ['hooks/gsd-statusline.js'];
    fs.writeFileSync(
      path.join(distDir, '.overlay-manifest.json'),
      JSON.stringify(manifest)
    );

    const result = copyOverlayManifest(distDir, tmpDir.path);

    expect(result).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(tmpDir.path, '.overlay-manifest.json'), 'utf8'))).toEqual(manifest);
  });

  test('skips gracefully if .overlay-manifest.json does not exist in dist', () => {
    const distDir = path.join(tmpDir.path, 'mock-dist');
    fs.mkdirSync(distDir);

    // Should not throw, returns false
    const result = copyOverlayManifest(distDir, tmpDir.path);

    expect(result).toBe(false);
    expect(
      fs.existsSync(path.join(tmpDir.path, '.overlay-manifest.json'))
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// cleanOrphanedPaths
// ---------------------------------------------------------------------------

describe('cleanOrphanedPaths', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('removes hooks/dist/ directory if it exists', () => {
    const hooksDistDir = path.join(tmpDir.path, 'hooks', 'dist');
    fs.mkdirSync(hooksDistDir, { recursive: true });
    fs.writeFileSync(path.join(hooksDistDir, 'gsd-statusline.js'), 'stale');

    const removed = cleanOrphanedPaths(tmpDir.path);

    expect(fs.existsSync(hooksDistDir)).toBe(false);
    // Parent hooks/ should still exist
    expect(fs.existsSync(path.join(tmpDir.path, 'hooks'))).toBe(true);
    expect(removed).toBeGreaterThan(0);
  });

  test('returns 0 if no orphans exist', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'hooks'), { recursive: true });

    const removed = cleanOrphanedPaths(tmpDir.path);
    expect(removed).toBe(0);
  });

  test('does not touch hooks/ directory itself', () => {
    const hooksDir = path.join(tmpDir.path, 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    fs.writeFileSync(path.join(hooksDir, 'gsd-statusline.js'), 'active');

    cleanOrphanedPaths(tmpDir.path);

    expect(fs.existsSync(path.join(hooksDir, 'gsd-statusline.js'))).toBe(true);
  });

  test('preserves local patch bytes and metadata for owner reconciliation', () => {
    const patchesDir = path.join(tmpDir.path, 'gsd-local-patches');
    fs.mkdirSync(path.join(patchesDir, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(patchesDir, 'backup-meta.json'), '{}');
    fs.writeFileSync(path.join(patchesDir, 'hooks', 'gsd-statusline.js'), 'intentional user customization');

    const removed = cleanOrphanedPaths(tmpDir.path);

    expect(fs.readFileSync(path.join(patchesDir, 'backup-meta.json'), 'utf8')).toBe('{}');
    expect(fs.readFileSync(path.join(patchesDir, 'hooks', 'gsd-statusline.js'), 'utf8')).toBe('intentional user customization');
    expect(removed).toBe(0);
  });

  test('removes generated hooks while retaining local patch metadata', () => {
    const hooksDistDir = path.join(tmpDir.path, 'hooks', 'dist');
    const patchesDir = path.join(tmpDir.path, 'gsd-local-patches');
    fs.mkdirSync(hooksDistDir, { recursive: true });
    fs.mkdirSync(patchesDir, { recursive: true });
    fs.writeFileSync(path.join(hooksDistDir, 'old.js'), 'x');
    fs.writeFileSync(path.join(patchesDir, 'meta.json'), 'x');

    const removed = cleanOrphanedPaths(tmpDir.path);

    expect(removed).toBe(1);
    expect(fs.existsSync(hooksDistDir)).toBe(false);
    expect(fs.readFileSync(path.join(patchesDir, 'meta.json'), 'utf8')).toBe('x');
  });
});

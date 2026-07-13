const { describe, expect, test } = require('bun:test');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  projectRoadmapEol,
  publishRoadmapPreservingBytes,
} = require('../overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs');

function createPublicationHarness(options = {}) {
  const calls = [];
  const renameErrors = [...(options.renameErrors || [])];
  const replaceErrors = [...(options.replaceErrors || [])];
  const fs = {
    mkdirSync: (...args) => calls.push(['mkdir', ...args]),
    copyFileSync: (...args) => {
      calls.push(['copy', ...args]);
      if (options.copyError) throw options.copyError;
    },
    writeFileSync: (...args) => {
      calls.push(['write', ...args]);
      if (options.writeError) throw options.writeError;
    },
    renameSync: (...args) => {
      calls.push(['rename', ...args]);
      const error = renameErrors.shift();
      if (error) throw error;
    },
    unlinkSync: (...args) => {
      calls.push(['unlink', ...args]);
      if (options.unlinkError) throw options.unlinkError;
    },
  };

  return {
    calls,
    deps: {
      fs,
      pid: 42,
      entropy: () => 'abc123',
      platform: options.platform || 'linux',
      replaceFile: (...args) => {
        calls.push(['replace', ...args]);
        const error = replaceErrors.shift();
        if (error) throw error;
      },
      sleep: (ms) => calls.push(['sleep', ms]),
    },
  };
}

function fileError(code) {
  return Object.assign(new Error(code), { code });
}

function walkFiles(rootPath) {
  return fs.readdirSync(rootPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(rootPath, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function runWindowsPowerShell(script, filePath) {
  const executable = path.join(
    process.env.SystemRoot || 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe'
  );
  const result = spawnSync(executable, [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    Buffer.from(script, 'utf16le').toString('base64'),
  ], {
    env: { ...process.env, GSD_TEST_ROADMAP_PATH: filePath },
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`PowerShell ACL probe failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function protectWindowsDacl(filePath) {
  runWindowsPowerShell(`
    $ErrorActionPreference = 'Stop'
    $acl = Get-Acl -LiteralPath $env:GSD_TEST_ROADMAP_PATH
    $acl.SetAccessRuleProtection($true, $true)
    Set-Acl -LiteralPath $env:GSD_TEST_ROADMAP_PATH -AclObject $acl
  `, filePath);
}

function readWindowsDacl(filePath) {
  return JSON.parse(runWindowsPowerShell(`
    $ErrorActionPreference = 'Stop'
    $acl = Get-Acl -LiteralPath $env:GSD_TEST_ROADMAP_PATH
    [pscustomobject]@{
      protected = $acl.AreAccessRulesProtected
      sddl = $acl.GetSecurityDescriptorSddlForm(
        [System.Security.AccessControl.AccessControlSections]::Access
      )
    } | ConvertTo-Json -Compress
  `, filePath));
}

function createRealPublicationFixture(prefix) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const filePath = path.join(tempDir, 'ROADMAP.md');
  fs.writeFileSync(filePath, 'before\n', 'utf8');
  return { tempDir, filePath };
}

function simulatedWindowsReplace(nativeCode, mutate) {
  return (_executable, _args, options) => {
    const targetPath = options.env.GSD_ROADMAP_TARGET_PATH;
    const replacementPath = options.env.GSD_ROADMAP_REPLACEMENT_PATH;
    const backupPath = options.env.GSD_ROADMAP_BACKUP_PATH;
    if (mutate) {
      mutate({ targetPath, replacementPath, backupPath });
    } else if (nativeCode === 0) {
      if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
      fs.renameSync(targetPath, backupPath);
      fs.renameSync(replacementPath, targetPath);
    }
    return {
      error: null,
      status: nativeCode === 0 ? 0 : 1,
      stderr: nativeCode === null ? 'unclassified failure' : `GSD_REPLACE_ERROR=${nativeCode}`,
    };
  };
}

function guardedFileSystem(overrides) {
  return Object.assign(Object.create(fs), overrides);
}

describe('fork roadmap EOL projection', () => {
  test('preserves LF input without changing unrelated bytes', () => {
    const original = '# Roadmap\n\n- [ ] Phase 1\n';
    const updated = '# Roadmap\n\n- [x] Phase 1\n';

    expect(projectRoadmapEol(original, updated)).toBe(updated);
  });

  test('restores CRLF when the original roadmap uses CRLF', () => {
    const original = '# Roadmap\r\n\r\n- [ ] Phase 1\r\n';
    const updated = '# Roadmap\n\n- [x] Phase 1\n';

    expect(projectRoadmapEol(original, updated))
      .toBe('# Roadmap\r\n\r\n- [x] Phase 1\r\n');
  });

  test('uses the dominant original EOL and the first EOL to break ties', () => {
    const dominantCrLf = 'one\r\ntwo\r\nthree\n';
    const tiedCrLfFirst = 'one\r\ntwo\n';
    const updated = 'one\ntwo\nthree\n';

    expect(projectRoadmapEol(dominantCrLf, updated)).toBe('one\r\ntwo\r\nthree\r\n');
    expect(projectRoadmapEol(tiedCrLfFirst, 'one\ntwo\n')).toBe('one\r\ntwo\r\n');
  });

  test('defaults documents without line endings to LF and rejects non-string content', () => {
    expect(projectRoadmapEol('Roadmap', 'Updated')).toBe('Updated');
    expect(() => projectRoadmapEol(null, 'Updated')).toThrow('roadmap content must be a string');
    expect(() => projectRoadmapEol('Roadmap', null)).toThrow('roadmap content must be a string');
  });
});

describe('fork roadmap atomic publication', () => {
  test('rejects an empty roadmap path', () => {
    expect(() => publishRoadmapPreservingBytes('', 'before', 'after'))
      .toThrow('roadmap file path must be a non-empty string');
  });

  test('does not publish when projected content is unchanged', () => {
    const harness = createPublicationHarness();
    const original = '# Roadmap\r\n';

    const updated = publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      original,
      '# Roadmap\n',
      harness.deps
    );

    expect(updated).toBe(false);
    expect(harness.calls).toEqual([]);
  });

  test('does not normalize an unchanged mixed-EOL document', () => {
    const harness = createPublicationHarness();
    const original = 'one\r\ntwo\n';

    expect(publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      original,
      original,
      harness.deps
    )).toBe(false);
    expect(harness.calls).toEqual([]);
  });

  test('publishes changed content through an exclusive metadata-preserving sibling copy', () => {
    const harness = createPublicationHarness();
    const filePath = path.join('C:\\repo', '.planning', 'ROADMAP.md');
    const tempPath = `${filePath}.tmp.42.abc123`;

    const updated = publishRoadmapPreservingBytes(
      filePath,
      '# Roadmap\r\n- [ ] Phase 1\r\n',
      '# Roadmap\n- [x] Phase 1\n',
      harness.deps
    );

    expect(updated).toBe(true);
    expect(harness.calls).toEqual([
      ['mkdir', path.dirname(filePath), { recursive: true }],
      ['copy', filePath, tempPath, fs.constants.COPYFILE_EXCL],
      ['write', tempPath, '# Roadmap\r\n- [x] Phase 1\r\n', 'utf8'],
      ['rename', tempPath, filePath],
    ]);
  });

  test('refuses a temp collision without modifying or deleting the existing path', () => {
    const collisionError = fileError('EEXIST');
    const harness = createPublicationHarness({ copyError: collisionError });

    expect(() => publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      'before\n',
      'after\n',
      harness.deps
    )).toThrow(collisionError);
    expect(harness.calls.filter(([name]) => name === 'copy')).toHaveLength(1);
    expect(harness.calls.filter(([name]) => name === 'write')).toHaveLength(0);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(0);
  });

  test('cleans a partially created temp after a non-collision copy failure', () => {
    const copyError = fileError('ENOSPC');
    const harness = createPublicationHarness({ copyError });

    expect(() => publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      'before\n',
      'after\n',
      harness.deps
    )).toThrow(copyError);
    expect(harness.calls.filter(([name]) => name === 'copy')).toHaveLength(1);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(1);
  });

  test('preserves copy and cleanup failures when partial-copy cleanup fails', () => {
    const copyError = fileError('EIO');
    const cleanupError = fileError('EACCES');
    const harness = createPublicationHarness({ copyError, unlinkError: cleanupError });

    try {
      publishRoadmapPreservingBytes(
        'C:\\repo\\.planning\\ROADMAP.md',
        'before\n',
        'after\n',
        harness.deps
      );
      throw new Error('expected copy to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.errors).toEqual([copyError, cleanupError]);
      expect(error.cause).toBe(copyError);
    }
  });

  test('rejects unsafe or empty injected temp entropy before touching the filesystem', () => {
    for (const token of ['', '../escape', null]) {
      const harness = createPublicationHarness();
      harness.deps.entropy = () => token;

      expect(() => publishRoadmapPreservingBytes(
        'C:\\repo\\.planning\\ROADMAP.md',
        'before\n',
        'after\n',
        harness.deps
      )).toThrow('roadmap temp entropy must be a non-empty path-safe string');
      expect(harness.calls).toEqual([]);
    }
  });

  test('preserves source mode bits across real publication where the platform exposes them', { timeout: 15000 }, () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-roadmap-publish-'));
    const filePath = path.join(tempDir, 'ROADMAP.md');
    try {
      fs.writeFileSync(filePath, 'before\n', { mode: 0o600 });
      if (process.platform !== 'win32') fs.chmodSync(filePath, 0o600);
      const originalMode = fs.statSync(filePath).mode & 0o777;

      expect(publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n')).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('after\n');
      expect(fs.statSync(filePath).mode & 0o777).toBe(originalMode);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('uses the Windows destination-preserving replacement primitive', () => {
    const harness = createPublicationHarness({ platform: 'win32' });
    const filePath = 'C:\\repo\\.planning\\ROADMAP.md';
    const tempPath = `${filePath}.tmp.42.abc123`;

    expect(publishRoadmapPreservingBytes(
      filePath,
      'before\n',
      'after\n',
      harness.deps
    )).toBe(true);
    expect(harness.calls.filter(([name]) => name === 'replace'))
      .toEqual([['replace', tempPath, filePath]]);
    expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(0);
  });

  test('passes Windows replacement paths through the child environment only', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-env-');
    const spawnCalls = [];
    const simulateSuccess = simulatedWindowsReplace(0);
    const deps = {
      platform: 'win32',
      entropy: () => 'abc123',
      env: { SystemRoot: 'C:\\Windows' },
      spawnSync: (...args) => {
      spawnCalls.push(args);
        return simulateSuccess(...args);
      },
    };

    try {
      expect(publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', deps)).toBe(true);
      expect(spawnCalls).toHaveLength(1);
      const [executable, args, options] = spawnCalls[0];
      expect(executable).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
      expect(args.join(' ')).not.toContain(filePath);
      expect(options.env.GSD_ROADMAP_TARGET_PATH).toBe(filePath);
      expect(options.env.GSD_ROADMAP_REPLACEMENT_PATH).toContain('.tmp.');
      expect(options.env.GSD_ROADMAP_BACKUP_PATH).toContain('.recovery.');
      expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('maps native Windows replacement failures without hiding process errors', () => {
    const mappings = [
      [5, 'EACCES'],
      [32, 'EBUSY'],
      [33, 'EBUSY'],
      [2, 'ENOENT'],
      [3, 'ENOENT'],
      [1175, 'EWIN_UNABLE_TO_REMOVE_REPLACED'],
      [1176, 'EWIN_UNABLE_TO_MOVE_REPLACEMENT'],
      [1177, 'EWIN_UNABLE_TO_MOVE_REPLACEMENT_2'],
      [999, 'EIO'],
      [null, 'EIO'],
    ];

    for (const [nativeCode, expectedCode] of mappings) {
      const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-error-map-');
      try {
        try {
          publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
            platform: 'win32',
            entropy: () => 'abc123',
            sleep: () => {},
            spawnSync: simulatedWindowsReplace(nativeCode),
          });
          throw new Error('expected publication to fail');
        } catch (error) {
          expect(error.code).toBe(expectedCode);
          expect(error.nativeCode).toBe(nativeCode);
        }
        expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
        expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }

    const processError = fileError('ETIMEDOUT');
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-process-error-');
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        platform: 'win32',
        entropy: () => 'abc123',
        spawnSync: () => ({ error: processError, status: null, stderr: '' }),
      })).toThrow(processError);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
      expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('reconciles every documented ReplaceFileW partial-failure state', () => {
    const cases = [
      [1175, () => {}],
      [1176, () => {}],
      [1177, ({ targetPath, backupPath }) => {
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        fs.renameSync(targetPath, backupPath);
      }],
    ];

    for (const [nativeCode, mutate] of cases) {
      const { tempDir, filePath } = createRealPublicationFixture(`gsd-roadmap-${nativeCode}-`);
      try {
        expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
          platform: 'win32',
          entropy: () => 'abc123',
          spawnSync: simulatedWindowsReplace(nativeCode, mutate),
        })).toThrow();
        expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
        expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  test('preserves replacement and backup when a 1177 restoration cannot complete', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-restore-fail-');
    const restoreError = fileError('EACCES');
    const guardedFs = Object.create(fs);
    guardedFs.renameSync = (sourcePath, targetPath) => {
      if (path.basename(sourcePath) === 'original') throw restoreError;
      return fs.renameSync(sourcePath, targetPath);
    };

    try {
      try {
        publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
          fs: guardedFs,
          platform: 'win32',
          entropy: () => 'abc123',
          sleep: () => {},
          spawnSync: simulatedWindowsReplace(
            1177,
            ({ targetPath, backupPath }) => {
              if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
              fs.renameSync(targetPath, backupPath);
            }
          ),
        });
        throw new Error('expected restoration to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(AggregateError);
        expect(error.errors.some((entry) => entry.nativeCode === 1177)).toBe(true);
        expect(error.errors).toContain(restoreError);
      }

      expect(fs.existsSync(filePath)).toBe(false);
      const entries = fs.readdirSync(tempDir);
      expect(entries.some((entry) => entry.includes('.tmp.'))).toBe(true);
      const recoveryDir = entries.find((entry) => entry.includes('.recovery.'));
      expect(fs.readFileSync(path.join(tempDir, recoveryDir, 'original'), 'utf8')).toBe('before\n');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('restores the backup from an ambiguous changed-target failure state', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-ambiguous-');
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        platform: 'win32',
        entropy: () => 'abc123',
        spawnSync: simulatedWindowsReplace(999, ({ targetPath, replacementPath, backupPath }) => {
          if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
          fs.renameSync(targetPath, backupPath);
          fs.renameSync(replacementPath, targetPath);
        }),
      })).toThrow();
      expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
      expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('preserves all copies when an ambiguous target cannot be isolated', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-isolate-fail-');
    const isolateError = fileError('EACCES');
    const guardedFs = guardedFileSystem({
      renameSync: (sourcePath, targetPath) => {
        if (path.basename(targetPath) === 'displaced-target') throw isolateError;
        return fs.renameSync(sourcePath, targetPath);
      },
    });
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        fs: guardedFs,
        platform: 'win32',
        entropy: () => 'abc123',
        spawnSync: simulatedWindowsReplace(999, ({ targetPath, replacementPath }) => {
          fs.unlinkSync(targetPath);
          fs.renameSync(replacementPath, targetPath);
        }),
      })).toThrow(AggregateError);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('after\n');
      const entries = fs.readdirSync(tempDir);
      expect(entries.some((entry) => entry.includes('.tmp.'))).toBe(false);
      const recoveryDir = entries.find((entry) => entry.includes('.recovery.'));
      expect(fs.readFileSync(path.join(tempDir, recoveryDir, 'original'), 'utf8')).toBe('before\n');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('rolls an isolated changed target back when original restoration fails', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-rollback-');
    const restoreError = fileError('EACCES');
    const guardedFs = guardedFileSystem({
      renameSync: (sourcePath, targetPath) => {
        if (path.basename(sourcePath) === 'original') throw restoreError;
        return fs.renameSync(sourcePath, targetPath);
      },
    });
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        fs: guardedFs,
        platform: 'win32',
        entropy: () => 'abc123',
        spawnSync: simulatedWindowsReplace(999, ({ targetPath, replacementPath, backupPath }) => {
          if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
          fs.renameSync(targetPath, backupPath);
          fs.renameSync(replacementPath, targetPath);
        }),
      })).toThrow(AggregateError);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('after\n');
      const recoveryDir = fs.readdirSync(tempDir).find((entry) => entry.includes('.recovery.'));
      expect(fs.readFileSync(path.join(tempDir, recoveryDir, 'original'), 'utf8')).toBe('before\n');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('restores a surviving replacement when the target and backup are missing', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-replacement-restore-');
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        platform: 'win32',
        entropy: () => 'abc123',
        spawnSync: simulatedWindowsReplace(1176, ({ targetPath, backupPath }) => {
          fs.unlinkSync(backupPath);
          fs.unlinkSync(targetPath);
        }),
      })).toThrow();
      expect(fs.readFileSync(filePath, 'utf8')).toBe('after\n');
      expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('surfaces missing copies and a failed surviving-replacement restore', () => {
    for (const restoreFails of [false, true]) {
      const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-missing-copy-');
      const restoreError = fileError('EACCES');
      const guardedFs = guardedFileSystem({
        renameSync: (sourcePath, targetPath) => {
          if (restoreFails && sourcePath.includes('.tmp.')) throw restoreError;
          return fs.renameSync(sourcePath, targetPath);
        },
      });
      try {
        expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
          fs: guardedFs,
          platform: 'win32',
          entropy: () => 'abc123',
          sleep: () => {},
          spawnSync: simulatedWindowsReplace(1176, ({ targetPath, replacementPath, backupPath }) => {
            fs.unlinkSync(backupPath);
            fs.unlinkSync(targetPath);
            if (!restoreFails) fs.unlinkSync(replacementPath);
          }),
        })).toThrow(AggregateError);
        expect(fs.existsSync(filePath)).toBe(false);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  test('surfaces recovery cleanup failures without deleting the replacement', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-cleanup-fail-');
    const cleanupError = fileError('EACCES');
    const guardedFs = guardedFileSystem({ rmdirSync: () => { throw cleanupError; } });
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        fs: guardedFs,
        platform: 'win32',
        entropy: () => 'abc123',
        spawnSync: simulatedWindowsReplace(999),
      })).toThrow(AggregateError);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
      expect(fs.readdirSync(tempDir).some((entry) => entry.includes('.tmp.'))).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('surfaces post-publication backup cleanup failure as already published', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-success-cleanup-');
    const cleanupError = fileError('EACCES');
    const guardedFs = guardedFileSystem({
      unlinkSync: (targetPath) => {
        if (path.basename(targetPath) === 'original') throw cleanupError;
        return fs.unlinkSync(targetPath);
      },
    });
    try {
      try {
        publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
          fs: guardedFs,
          platform: 'win32',
          entropy: () => 'abc123',
          spawnSync: simulatedWindowsReplace(0),
        });
        throw new Error('expected cleanup to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(AggregateError);
        expect(error.published).toBe(true);
      }
      expect(fs.readFileSync(filePath, 'utf8')).toBe('after\n');
      expect(fs.readdirSync(tempDir).some((entry) => entry.includes('.recovery.'))).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('rejects unsafe Windows recovery entropy and removes the prepared replacement', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-recovery-token-');
    const tokens = ['temp-token', '../unsafe'];
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        platform: 'win32',
        entropy: () => tokens.shift(),
      })).toThrow('roadmap recovery entropy must be a non-empty path-safe string');
      expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
      expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('rejects target identity drift before Windows child startup', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-target-drift-');
    const guardedFs = guardedFileSystem({
      readFileSync: (targetPath, encoding) => targetPath === filePath
        ? 'changed-before-publication\n'
        : fs.readFileSync(targetPath, encoding),
    });
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        fs: guardedFs,
        platform: 'win32',
        entropy: () => 'abc123',
      })).toThrow('roadmap target changed or is not a regular file before Windows publication');
      expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
      expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('surfaces backup hardlink reservation and directory cleanup failures', () => {
    for (const cleanupFails of [false, true]) {
      const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-link-fail-');
      const linkError = fileError('EPERM');
      const cleanupError = fileError('EACCES');
      const guardedFs = guardedFileSystem({
        linkSync: () => { throw linkError; },
        rmdirSync: cleanupFails ? () => { throw cleanupError; } : fs.rmdirSync,
      });
      try {
        if (cleanupFails) {
          try {
            publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
              fs: guardedFs,
              platform: 'win32',
              entropy: () => 'abc123',
            });
            throw new Error('expected backup reservation to fail');
          } catch (error) {
            expect(error).toBeInstanceOf(AggregateError);
            expect(error.errors).toEqual([linkError, cleanupError]);
          }
        } else {
          expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
            fs: guardedFs,
            platform: 'win32',
            entropy: () => 'abc123',
          })).toThrow(linkError);
        }
        expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  test('keeps the displaced target until restored-original validation succeeds', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-post-restore-');
    const guardedFs = guardedFileSystem({
      renameSync: (sourcePath, targetPath) => {
        const result = fs.renameSync(sourcePath, targetPath);
        if (path.basename(sourcePath) === 'original') {
          fs.writeFileSync(targetPath, 'substituted-after-restore\n', 'utf8');
        }
        return result;
      },
    });
    try {
      expect(() => publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
        fs: guardedFs,
        platform: 'win32',
        entropy: () => 'abc123',
        spawnSync: simulatedWindowsReplace(999, ({ targetPath, replacementPath }) => {
          fs.unlinkSync(targetPath);
          fs.renameSync(replacementPath, targetPath);
        }),
      })).toThrow(AggregateError);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('after\n');
      const recoveryDir = fs.readdirSync(tempDir).find((entry) => entry.includes('.recovery.'));
      expect(fs.readFileSync(
        path.join(tempDir, recoveryDir, 'unvalidated-restored'),
        'utf8'
      )).toBe('substituted-after-restore\n');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('preserves both copies when a real child substitutes a directory at the backup path', () => {
    const { tempDir, filePath } = createRealPublicationFixture('gsd-roadmap-backup-race-');
    const childScript = [
      "const fs = require('node:fs');",
      "const backup = process.env.GSD_ROADMAP_BACKUP_PATH;",
      "if (fs.existsSync(backup)) fs.unlinkSync(backup);",
      "fs.mkdirSync(backup);",
      "process.stderr.write('GSD_REPLACE_ERROR=1175');",
      'process.exit(1);',
    ].join('');
    try {
      try {
        publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n', {
          platform: 'win32',
          entropy: () => 'abc123',
          spawnSync: (_executable, _args, options) => spawnSync(
            process.execPath,
            ['-e', childScript],
            { env: options.env, encoding: 'utf8', windowsHide: true }
          ),
        });
        throw new Error('expected backup substitution to fail safely');
      } catch (error) {
        expect(error).toBeInstanceOf(AggregateError);
        expect(error.preserveReplacement).toBe(true);
      }

      expect(fs.lstatSync(filePath).isFile()).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('before\n');
      const entries = fs.readdirSync(tempDir);
      expect(entries.some((entry) => entry.includes('.tmp.'))).toBe(true);
      expect(entries.some((entry) => entry.includes('.recovery.'))).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('preserves a protected Windows DACL and its exact access SDDL', { timeout: 15000 }, () => {
    if (process.platform !== 'win32') return;

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-roadmap-acl-'));
    const filePath = path.join(tempDir, 'ROADMAP.md');
    try {
      fs.writeFileSync(filePath, 'before\n', 'utf8');
      protectWindowsDacl(filePath);
      const originalDacl = readWindowsDacl(filePath);
      expect(originalDacl.protected).toBe(true);

      expect(publishRoadmapPreservingBytes(filePath, 'before\n', 'after\n')).toBe(true);
      expect(readWindowsDacl(filePath)).toEqual(originalDacl);
      expect(fs.readdirSync(tempDir)).toEqual(['ROADMAP.md']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('retries the injected Windows replacement primitive on transient locks', () => {
    const harness = createPublicationHarness({
      platform: 'win32',
      replaceErrors: [fileError('EBUSY')],
    });

    expect(publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      'before\n',
      'after\n',
      harness.deps
    )).toBe(true);
    expect(harness.calls.filter(([name]) => name === 'replace')).toHaveLength(2);
    expect(harness.calls.filter(([name]) => name === 'sleep')).toEqual([['sleep', 50]]);
  });

  test('retries each transient Windows lock error with bounded backoff', () => {
    for (const code of ['EPERM', 'EBUSY', 'EACCES']) {
      const harness = createPublicationHarness({
        renameErrors: [fileError(code), fileError(code)],
      });

      const updated = publishRoadmapPreservingBytes(
        'C:\\repo\\.planning\\ROADMAP.md',
        '# Roadmap\n- [ ] Phase 1\n',
        '# Roadmap\n- [x] Phase 1\n',
        harness.deps
      );

      expect(updated).toBe(true);
      expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(3);
      expect(harness.calls.filter(([name]) => name === 'sleep'))
        .toEqual([['sleep', 50], ['sleep', 50]]);
      expect(harness.calls.some(([name]) => name === 'unlink')).toBe(false);
    }
  });

  test('uses the production backoff when no sleep dependency is injected', () => {
    const harness = createPublicationHarness({
      renameErrors: [fileError('EPERM')],
    });
    delete harness.deps.sleep;

    expect(publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      '# Roadmap\n- [ ] Phase 1\n',
      '# Roadmap\n- [x] Phase 1\n',
      harness.deps
    )).toBe(true);
    expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(2);
  });

  test('cleans the temp file and surfaces a transient error after the retry bound', () => {
    const finalError = fileError('EPERM');
    const harness = createPublicationHarness({
      renameErrors: [fileError('EPERM'), fileError('EPERM'), finalError],
    });

    expect(() => publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      '# Roadmap\n- [ ] Phase 1\n',
      '# Roadmap\n- [x] Phase 1\n',
      harness.deps
    )).toThrow(finalError);
    expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(3);
    expect(harness.calls.filter(([name]) => name === 'sleep')).toHaveLength(2);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(1);
  });

  test('does not retry a non-transient rename failure and removes the temp file', () => {
    const renameError = fileError('EXDEV');
    const harness = createPublicationHarness({ renameErrors: [renameError] });

    expect(() => publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      '# Roadmap\n- [ ] Phase 1\n',
      '# Roadmap\n- [x] Phase 1\n',
      harness.deps
    )).toThrow(renameError);
    expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(1);
    expect(harness.calls.filter(([name]) => name === 'sleep')).toHaveLength(0);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(1);
  });

  test('cleans a failed temp write and preserves the original write error', () => {
    const writeError = fileError('ENOSPC');
    const harness = createPublicationHarness({ writeError });

    expect(() => publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      '# Roadmap\n- [ ] Phase 1\n',
      '# Roadmap\n- [x] Phase 1\n',
      harness.deps
    )).toThrow(writeError);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(1);
    expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(0);
  });

  test('ignores an already-missing temp during failure cleanup', () => {
    const renameError = fileError('EXDEV');
    const harness = createPublicationHarness({
      renameErrors: [renameError],
      unlinkError: fileError('ENOENT'),
    });

    expect(() => publishRoadmapPreservingBytes(
      'C:\\repo\\.planning\\ROADMAP.md',
      '# Roadmap\n- [ ] Phase 1\n',
      '# Roadmap\n- [x] Phase 1\n',
      harness.deps
    )).toThrow(renameError);
  });

  test('preserves both publication and cleanup failures', () => {
    const renameError = fileError('EXDEV');
    const cleanupError = fileError('EIO');
    const harness = createPublicationHarness({
      renameErrors: [renameError],
      unlinkError: cleanupError,
    });

    try {
      publishRoadmapPreservingBytes(
        'C:\\repo\\.planning\\ROADMAP.md',
        '# Roadmap\n- [ ] Phase 1\n',
        '# Roadmap\n- [x] Phase 1\n',
        harness.deps
      );
      throw new Error('expected publication to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.errors).toEqual([renameError, cleanupError]);
      expect(error.cause).toBe(renameError);
    }
  });
});

describe('fork roadmap persistence boundary', () => {
  test('only the roadmap override imports the fork-private adapter', () => {
    const projectRoot = path.join(__dirname, '..');
    const productionFiles = [
      ...walkFiles(path.join(projectRoot, 'overlay')),
      ...walkFiles(path.join(projectRoot, 'overrides')),
      ...walkFiles(path.join(projectRoot, 'dist', 'gsd-core')),
    ].filter((filePath) => /\.(?:cjs|mjs|js)$/.test(filePath));
    const importers = productionFiles
      .filter((filePath) => fs.readFileSync(filePath, 'utf8').includes('fork-roadmap-persistence.cjs'))
      .map((filePath) => path.relative(projectRoot, filePath).replace(/\\/g, '/'));

    expect(importers).toEqual([
      'overrides/gsd-core/bin/lib/roadmap.cjs',
      'dist/gsd-core/bin/lib/roadmap.cjs',
    ]);
    expect(fs.existsSync(
      path.join(projectRoot, 'overrides', 'gsd-core', 'bin', 'lib', 'shell-command-projection.cjs')
    )).toBe(false);
  });
});

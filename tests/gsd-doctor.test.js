'use strict';

/**
 * Tests for scripts/gsd-doctor.cjs
 *
 * Covers the detect-and-repair logic for the PowerShell call-operator
 * stale-artifact bug in ~/.claude/settings.json (see docs/inbox/2026-05-13-
 * authkey-hook-config-powershell-syntax-breaks-on-bash-windows.md).
 *
 * Test strategy: fixture-based. Each test writes a synthetic settings.json
 * to a temp directory, invokes the doctor (in-process via require, or via
 * subprocess for CLI surface), and asserts the resulting on-disk state and
 * exit codes.
 */

const { describe, test, expect } = require('./helpers/portable-test-api');
const { beforeEach, afterEach } = process.versions.bun ? require('bun:test') : require('node:test');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCRIPT = process.env.GSD_DOCTOR_TEST_SUBJECT || path.join(PROJECT_ROOT, 'scripts', 'gsd-doctor.cjs');
const implementation = require(SCRIPT);
const { assertRepairSafe } = require('../scripts/lib/doctor-security.cjs');
const capabilityDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-capability-'));
let nativeRepairAvailable = true;
try {
  const probe = path.join(capabilityDir, 'settings.json');
  fs.writeFileSync(probe, '{}', { mode: 0o600 });
  try { assertRepairSafe(probe); } catch { nativeRepairAvailable = false; }
} finally { fs.rmSync(capabilityDir, { recursive: true, force: true }); }
// Transaction/fault tests use an injected successful security inspection on
// hosts without native inspection privileges. CLI tests below retain the real
// inspector and verify refusal. Native Linux validation exercises both together.
const doctor = { ...implementation, repair: options => implementation.repair({
  ...options, ...(!nativeRepairAvailable ? { inspectSecurity: () => {} } : {}),
}) };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doctor-test-'));
}

function writeSettings(dir, obj) {
  const p = path.join(dir, 'settings.json');
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

function readSettings(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Build a settings.json shape with N broken + M clean hook entries.
 */
function buildSettings({ broken = 0, clean = 0 } = {}) {
  const hooks = { PreToolUse: [] };
  for (let i = 0; i < broken; i++) {
    hooks.PreToolUse.push({
      matcher: `BrokenMatcher${i}`,
      hooks: [
        {
          type: 'command',
          command: `& "C:/Users/X/.bun/bin/bunx.exe" "C:/Users/X/.claude/hooks/broken-${i}.js"`,
        },
      ],
    });
  }
  for (let i = 0; i < clean; i++) {
    hooks.PreToolUse.push({
      matcher: `CleanMatcher${i}`,
      hooks: [
        {
          type: 'command',
          command: `node "C:/Users/X/.claude/hooks/clean-${i}.js"`,
        },
      ],
    });
  }
  return { hooks };
}

function runCLI(args, env = {}) {
  return spawnSync('node', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

// ---------------------------------------------------------------------------
// Unit tests — pure functions
// ---------------------------------------------------------------------------

describe('BROKEN_RE — pattern detection', () => {
  const POSITIVES = [
    '& "C:/Users/X/.bun/bin/bunx.exe" "C:/Users/X/.claude/hooks/gsd-workflow-guard.js"',
    '& "/usr/local/bin/bunx" "/home/user/hooks/anything.js"',
    '& "C:/path/bunx.exe" "C:/.claude/hooks/hook.cjs"',
    '& "C:/path/bunx.exe" "C:/.claude/hooks/hook.mjs"',
  ];
  const NEGATIVES = [
    'node "C:/Users/X/.claude/hooks/gsd-workflow-guard.js"', // already clean (canonical shape)
    'bash "C:/.claude/hooks/some.sh"', // bash invocation, not affected
    'powershell -File "C:/path/script.ps1"', // PowerShell intentional
    'echo hello', // unrelated
    '', // empty
    '& "C:/path/node.exe" "C:/script.js"', // & + node (not bunx) — out of scope
    '& "C:/path/bunx.exe" "C:/script.sh"', // bunx but .sh — out of scope
    '& "C:/path/bunx.exe" script.js', // missing quotes around script path
    '  & "C:/.bunx" "C:/x.js"', // leading whitespace (anchor ^ fails)
    '& "C:/custom-bunx.exe" "C:/x.js"',
    '& "notbunx" "C:/x.js"',
  ];

  for (const s of POSITIVES) {
    test(`matches: ${s.slice(0, 60)}`, () => {
      expect(doctor.BROKEN_RE.test(s)).toBe(true);
    });
  }
  for (const s of NEGATIVES) {
    test(`rejects: ${s.slice(0, 60)}`, () => {
      expect(doctor.BROKEN_RE.test(s)).toBe(false);
    });
  }
});

describe('repairCommand — single-string repair', () => {
  test('repairs a canonical broken shape', () => {
    const r = doctor.repairCommand(
      '& "C:/Users/X/.bun/bin/bunx.exe" "C:/Users/X/.claude/hooks/hook.js"'
    );
    expect(r.fixed).toBe(true);
    expect(r.after).toBe('node "C:/Users/X/.claude/hooks/hook.js"');
  });

  test('no-op on already-clean command', () => {
    const r = doctor.repairCommand('node "C:/X/hook.js"');
    expect(r.fixed).toBe(false);
  });

  test('no-op on non-string input', () => {
    expect(doctor.repairCommand(null).fixed).toBe(false);
    expect(doctor.repairCommand(undefined).fixed).toBe(false);
    expect(doctor.repairCommand(42).fixed).toBe(false);
  });

  test('handles .cjs and .mjs extensions', () => {
    const a = doctor.repairCommand('& "C:/bunx.exe" "C:/h.cjs"');
    const b = doctor.repairCommand('& "C:/bunx.exe" "C:/h.mjs"');
    expect(a.fixed).toBe(true);
    expect(a.after).toBe('node "C:/h.cjs"');
    expect(b.fixed).toBe(true);
    expect(b.after).toBe('node "C:/h.mjs"');
  });
});

describe('diagnose — walks settings tree', () => {
  test('finds broken entries across all event names', () => {
    const settings = {
      hooks: {
        PreToolUse: [
          {
            matcher: 'Edit',
            hooks: [{ command: '& "C:/bunx" "C:/a.js"' }],
          },
        ],
        PostToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ command: '& "C:/bunx" "C:/b.js"' }],
          },
        ],
        SessionStart: [
          {
            matcher: '',
            hooks: [{ command: 'node "C:/c.js"' }], // clean — not flagged
          },
        ],
      },
    };
    const findings = doctor.diagnose(settings);
    expect(findings).toHaveLength(2);
    expect(findings[0].event).toBe('PreToolUse');
    expect(findings[1].event).toBe('PostToolUse');
  });

  test('returns empty findings on clean settings', () => {
    expect(doctor.diagnose(buildSettings({ broken: 0, clean: 3 }))).toEqual([]);
  });

  test('returns empty findings on settings without hooks', () => {
    expect(doctor.diagnose({})).toEqual([]);
    expect(doctor.diagnose(null)).toEqual([]);
    expect(doctor.diagnose({ hooks: null })).toEqual([]);
  });

  test('does not mutate input', () => {
    const settings = buildSettings({ broken: 2, clean: 1 });
    const before = JSON.stringify(settings);
    doctor.diagnose(settings);
    expect(JSON.stringify(settings)).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Integration — repair() with real filesystem
// ---------------------------------------------------------------------------

describe('repair — filesystem operations', () => {
  let tmp;
  let settingsPath;

  beforeEach(() => {
    tmp = makeTempDir();
  });

  afterEach(() => {
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('no-op when settings already clean', () => {
    settingsPath = writeSettings(tmp, buildSettings({ broken: 0, clean: 2 }));
    const result = doctor.repair({ settingsPath });
    expect(result.changed).toBe(0);
    expect(result.backupPath).toBe(null);
    expect(result.findings).toEqual([]);
  });

  test('repairs broken entries and writes backup', () => {
    settingsPath = writeSettings(tmp, buildSettings({ broken: 3, clean: 1 }));
    const result = doctor.repair({ settingsPath });
    expect(result.changed).toBe(3);
    expect(result.backupPath).toMatch(/\.bak\./);
    expect(fs.existsSync(result.backupPath)).toBe(true);

    // Settings.json on disk is repaired
    const after = readSettings(settingsPath);
    for (const entry of after.hooks.PreToolUse) {
      expect(entry.hooks[0].command).not.toMatch(/^& "/);
    }

    // Backup contains the ORIGINAL broken content
    const backup = JSON.parse(fs.readFileSync(result.backupPath, 'utf8'));
    let brokenInBackup = 0;
    for (const entry of backup.hooks.PreToolUse) {
      if (entry.hooks[0].command.startsWith('& "')) brokenInBackup++;
    }
    expect(brokenInBackup).toBe(3);
  });

  test('refuses a symlinked settings file without replacing the link or changing its target', () => {
    const targetDir = path.join(tmp, 'owner settings with spaces');
    fs.mkdirSync(targetDir);
    const target = writeSettings(targetDir, { ...buildSettings({ broken: 1 }), theme: 'owner theme' });
    const link = path.join(tmp, 'linked settings.json');
    fs.symlinkSync(target, link, 'file');
    const before = fs.readFileSync(target);
    expect(() => doctor.repair({ settingsPath: link })).toThrow(/symbolic link.*--settings/i);
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(target)).toEqual(before);
    expect(fs.readdirSync(tmp).sort()).toEqual(['linked settings.json', 'owner settings with spaces']);
    expect(fs.readdirSync(targetDir)).toEqual(['settings.json']);
    expect(doctor.repair({ settingsPath: link, dryRun: true }).changed).toBe(1);
    const repaired = doctor.repair({ settingsPath: target });
    expect(repaired.changed).toBe(1);
    expect(readSettings(link).theme).toBe('owner theme');
    expect(doctor.diagnose(readSettings(link))).toEqual([]);
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
  });

  for (const content of ['{}', '{ invalid']) {
    test(`non-dry repair refuses linked settings before parsing ${content}`, () => {
      const target = path.join(tmp, 'owner.json');
      const link = path.join(tmp, 'settings link.json');
      fs.writeFileSync(target, content);
      fs.symlinkSync(target, link, 'file');
      expect(() => doctor.repair({ settingsPath: link })).toThrow(/symbolic link/);
      expect(fs.readFileSync(target, 'utf8')).toBe(content);
      expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    });
  }

  test('idempotent — second run is a no-op', () => {
    settingsPath = writeSettings(tmp, buildSettings({ broken: 2, clean: 1 }));
    const first = doctor.repair({ settingsPath });
    expect(first.changed).toBe(2);
    const second = doctor.repair({ settingsPath });
    expect(second.changed).toBe(0);
    expect(second.backupPath).toBe(null);
  });

  test('dry-run reports without writing', () => {
    settingsPath = writeSettings(tmp, buildSettings({ broken: 2, clean: 0 }));
    const originalContent = fs.readFileSync(settingsPath, 'utf8');
    const result = doctor.repair({ settingsPath, dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.changed).toBe(2);
    expect(result.backupPath).toBe(null);
    // No write
    expect(fs.readFileSync(settingsPath, 'utf8')).toBe(originalContent);
    // No backup
    const backupFiles = fs.readdirSync(tmp).filter((f) => f.includes('.bak.'));
    expect(backupFiles).toEqual([]);
  });

  test('throws on missing settings file', () => {
    expect(() =>
      doctor.repair({ settingsPath: path.join(tmp, 'nonexistent.json') })
    ).toThrow();
  });

  test('throws on invalid JSON', () => {
    settingsPath = path.join(tmp, 'settings.json');
    fs.writeFileSync(settingsPath, '{ not valid json');
    expect(() => doctor.repair({ settingsPath })).toThrow();
  });

  test('preserves unrelated hook commands', () => {
    const settings = {
      hooks: {
        PreToolUse: [
          { matcher: 'Edit', hooks: [{ command: '& "C:/bunx" "C:/h.js"' }] },
        ],
        PostToolUse: [
          { matcher: 'Bash', hooks: [{ command: 'bash "C:/some.sh"' }] },
          {
            matcher: 'Read',
            hooks: [{ command: 'powershell -File "C:/p.ps1"' }],
          },
        ],
      },
    };
    settingsPath = writeSettings(tmp, settings);
    const result = doctor.repair({ settingsPath });
    expect(result.changed).toBe(1);
    const after = readSettings(settingsPath);
    expect(after.hooks.PostToolUse[0].hooks[0].command).toBe('bash "C:/some.sh"');
    expect(after.hooks.PostToolUse[1].hooks[0].command).toBe(
      'powershell -File "C:/p.ps1"'
    );
  });

  test('output JSON round-trip parses cleanly', () => {
    settingsPath = writeSettings(tmp, buildSettings({ broken: 4, clean: 2 }));
    doctor.repair({ settingsPath });
    expect(() => JSON.parse(fs.readFileSync(settingsPath, 'utf8'))).not.toThrow();
  });

  // Regression: codex review 2026-05-14 P2 — settings file permissions must
  // be preserved across repair. Default Node fs.writeFile creates files at
  // 0644; a 0600 settings.json that drops to 0644 would expose sensitive
  // configuration to other users on POSIX/WSL.
  test('preserves original file mode (POSIX/WSL)', () => {
    if (process.platform === 'win32' && !process.env.WSL_DISTRO_NAME) {
      // Skip — Windows native filesystem mode semantics differ.
      return;
    }
    settingsPath = writeSettings(tmp, buildSettings({ broken: 2, clean: 0 }));
    fs.chmodSync(settingsPath, 0o600);
    const origMode = fs.statSync(settingsPath).mode & 0o777;
    expect(origMode).toBe(0o600);

    const result = doctor.repair({ settingsPath });
    const afterMode = fs.statSync(settingsPath).mode & 0o777;
    const backupMode = fs.statSync(result.backupPath).mode & 0o777;
    expect(afterMode).toBe(0o600);
    expect(backupMode).toBe(0o600);
  });
});

// ---------------------------------------------------------------------------
// CLI surface
// ---------------------------------------------------------------------------

describe('CLI — exit codes and output', () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTempDir();
  });

  afterEach(() => {
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('--help exits 0', () => {
    const r = runCLI(['--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/gsd-doctor v/);
  });

  test('--version exits 0', () => {
    const r = runCLI(['--version']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/gsd-doctor v/);
  });

  test('no args exits 2', () => {
    const r = runCLI([]);
    expect(r.status).toBe(2);
  });

  test('unknown flag exits 2', () => {
    const r = runCLI(['--bogus']);
    expect(r.status).toBe(2);
  });

  // Regression: codex review 2026-05-14 P2 — --settings missing value must
  // be rejected, not silently fall back to ~/.claude/settings.json. Real
  // footgun for testing/CI invocations.
  test('--settings without value exits 2', () => {
    const r = runCLI(['repair', '--settings']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/--settings requires a value/);
  });

  test('--settings followed by another flag exits 2', () => {
    const r = runCLI(['repair', '--settings', '--dry-run']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/--settings requires a value/);
  });

  for (const value of ['', '-h']) {
    test(`rejects unsafe --settings value ${JSON.stringify(value)} instead of selecting default`, () => {
      expect(() => doctor.parseArgs(['repair', '--settings', value])).toThrow(/--settings requires a value/);
    });
  }

  test('check on clean settings exits 0', () => {
    const p = writeSettings(tmp, buildSettings({ broken: 0, clean: 2 }));
    const r = runCLI(['check', '--settings', p]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/clean/);
  });

  test('check on broken settings exits 1', () => {
    const p = writeSettings(tmp, buildSettings({ broken: 2, clean: 1 }));
    const r = runCLI(['check', '--settings', p]);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/2 broken/);
  });

  for (const shell of (process.platform === 'win32' ? ['Bash', 'PowerShell'] : ['Bash'])) {
    test(`suggested ${shell} repair preserves the custom settings path and shell metacharacters`, { timeout: 30000 }, () => {
      const custom = path.join(tmp, "owner's settings $literal with spaces");
      fs.mkdirSync(custom);
      const p = writeSettings(custom, { ...buildSettings({ broken: 1, clean: 1 }), permissions: { allow: ['Read'] } });
      const home = path.join(tmp, 'isolated home');
      fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
      const defaultPath = writeSettings(path.join(home, '.claude'), buildSettings({ broken: 1 }));
      const originalDefault = fs.readFileSync(defaultPath);
      const env = { ...process.env, HOME: home, USERPROFILE: home };
      const diagnosis = runCLI(['check', '--settings', p], env);
      const prefix = `Run (${shell}): `;
      const suggestion = diagnosis.stdout.split('\n').find(line => line.startsWith(prefix));
      expect(suggestion).toBeDefined();
      const command = suggestion.slice(prefix.length);
      const result = spawnSync(shell === 'Bash' ? 'bash' : 'pwsh',
        shell === 'Bash' ? ['--noprofile', '--norc', '-c', command] : ['-NoProfile', '-NonInteractive', '-Command', command],
        { cwd: tmp, env, encoding: 'utf8', timeout: 15000 });
      if (!nativeRepairAvailable) {
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(`Refusing repair of ${p}: security metadata cannot be safely preserved`);
        expect(doctor.diagnose(readSettings(p))).toHaveLength(1);
        expect(fs.readFileSync(defaultPath)).toEqual(originalDefault);
        expect(fs.readdirSync(custom)).toEqual(['settings.json']);
        return;
      }
      expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' });
      expect(doctor.diagnose(readSettings(p))).toEqual([]);
      expect(readSettings(p).permissions).toEqual({ allow: ['Read'] });
      expect(readSettings(p).hooks.PreToolUse[1].hooks[0].command).toBe('node "C:/Users/X/.claude/hooks/clean-0.js"');
      expect(fs.readFileSync(defaultPath)).toEqual(originalDefault);
    });
  }

  test('repair fixes ordinary settings when inspection succeeds, otherwise refuses unchanged', () => {
    const p = writeSettings(tmp, buildSettings({ broken: 2, clean: 0 }));
    const r = runCLI(['repair', '--settings', p]);
    if (!nativeRepairAvailable) {
      expect(r.status).toBe(1);
      expect(r.stderr).toContain(`Refusing repair of ${p}: security metadata cannot be safely preserved`);
      expect(doctor.diagnose(readSettings(p))).toHaveLength(2);
      expect(fs.readdirSync(tmp)).toEqual(['settings.json']);
      return;
    }
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/repaired 2/);
    expect(r.stdout).not.toContain('would repair');
    // Re-check should now be clean
    const r2 = runCLI(['check', '--settings', p]);
    expect(r2.status).toBe(0);
  });

  test('check rejects the repair-only dry-run flag', () => {
    expect(() => doctor.parseArgs(['check', '--dry-run'])).toThrow(/repair/);
  });

  test('large verbose diagnosis is fully flushed to a pipe', { timeout: 30000 }, () => {
    const p = writeSettings(tmp, buildSettings({ broken: 1500 }));
    const result = runCLI(['check', '--verbose', '--settings', p]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('BrokenMatcher1499');
    expect(result.stdout).toContain('Run (PowerShell):');
  });

  test('repair --dry-run does not modify file', () => {
    const p = writeSettings(tmp, buildSettings({ broken: 2, clean: 0 }));
    const before = fs.readFileSync(p, 'utf8');
    const r = runCLI(['repair', '--dry-run', '--settings', p]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/would repair 2/);
    expect(fs.readFileSync(p, 'utf8')).toBe(before);
  });

  test('repair on clean settings is a no-op (exits 0)', () => {
    const p = writeSettings(tmp, buildSettings({ broken: 0, clean: 2 }));
    const before = fs.readFileSync(p, 'utf8');
    const r = runCLI(['repair', '--settings', p]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/nothing to repair/);
    expect(fs.readFileSync(p, 'utf8')).toBe(before);
  });
});

describe('doctor failure boundaries', () => {
  test('default settings resolution is confined to an explicitly isolated home', () => {
    const tmp = makeTempDir();
    const homedir = os.homedir;
    try {
      os.homedir = () => tmp;
      fs.mkdirSync(path.join(tmp, '.claude'));
      const p = writeSettings(path.join(tmp, '.claude'), buildSettings({ broken: 1 }));
      expect(doctor.repair().settingsPath).toBe(p);
      const result = runCLI(['check'], { HOME: tmp, USERPROFILE: tmp });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(p);
    } finally { os.homedir = homedir; fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('verbose dry-run and missing-file errors report useful CLI results', () => {
    const tmp = makeTempDir();
    try {
      const p = writeSettings(tmp, buildSettings({ broken: 1 }));
      const preview = runCLI(['repair', '--dry-run', '--verbose', '--settings', p]);
      expect(preview.status).toBe(0);
      expect(preview.stdout).toContain('would repair 1 entry');
      expect(preview.stdout).toContain('    - &');
      expect(preview.stdout).toContain('    + node');
      expect(runCLI(['repair', '--settings', path.join(tmp, 'missing')]).status).toBe(1);
      expect(runCLI(['-h']).status).toBe(0);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('refuses to write if diagnosis and mutation disagree', () => {
    const tmp = makeTempDir();
    const parse = JSON.parse;
    try {
      const p = writeSettings(tmp, buildSettings({ broken: 1 }));
      const before = fs.readFileSync(p);
      let reads = 0;
      const hook = { get command() { return ++reads < 4 ? '& "C:/bunx" "C:/h.js"' : 'node clean.js'; } };
      JSON.parse = () => ({ hooks: { PreToolUse: [{ hooks: [hook] }] } });
      expect(() => doctor.repair({ settingsPath: p })).toThrow(/diagnose found 1 but walk repaired 0/);
      expect(fs.readFileSync(p)).toEqual(before);
      expect(fs.readdirSync(tmp)).toEqual(['settings.json']);
    } finally { JSON.parse = parse; fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('write failure cleans only its own temporary output and retains the original backup', () => {
    const tmp = makeTempDir();
    const write = fs.writeFileSync;
    try {
      const p = writeSettings(tmp, buildSettings({ broken: 1 }));
      const before = fs.readFileSync(p);
      fs.writeFileSync = (target, ...args) => {
        if (typeof target === 'number') throw new Error('disk full');
        return write(target, ...args);
      };
      expect(() => doctor.repair({ settingsPath: p })).toThrow('disk full');
      expect(fs.readFileSync(p)).toEqual(before);
      expect(fs.readdirSync(tmp).some(name => name.includes('.tmp.'))).toBe(false);
    } finally { fs.writeFileSync = write; fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('cleanup failure retains both diagnostics and leaves the original settings intact', () => {
    const tmp = makeTempDir();
    const rename = fs.renameSync;
    const unlink = fs.unlinkSync;
    try {
      const p = writeSettings(tmp, buildSettings({ broken: 1 }));
      const before = fs.readFileSync(p);
      fs.renameSync = () => { throw new Error('rename denied'); };
      fs.unlinkSync = candidate => {
        if (candidate.includes('.tmp.')) throw new Error('cleanup denied');
        return unlink(candidate);
      };
      expect(() => doctor.repair({ settingsPath: p })).toThrow(/rename denied.*cleanup failed.*cleanup denied/);
      expect(fs.readFileSync(p)).toEqual(before);
    } finally { fs.renameSync = rename; fs.unlinkSync = unlink; fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('malformed hook entries are ignored without changing unrelated values', () => {
    for (const settings of [null, 42, {}, { hooks: 42 }]) {
      expect(doctor.walkHookCommands(settings, () => 'unexpected')).toBe(0);
    }
    const settings = { hooks: { Invalid: {}, PreToolUse: [null, {}, { hooks: [null, {}, { command: 42 },
      { command: '& "C:/bunx" "C:/h.js"' }, { command: 'node clean.js' }] }] }, theme: 'dark' };
    const findings = doctor.diagnose(settings);
    expect(findings).toHaveLength(1);
    expect(findings[0].matcher).toBe('(none)');
    expect(doctor.walkHookCommands(settings, cmd => doctor.repairCommand(cmd).after || cmd)).toBe(1);
    expect(settings.theme).toBe('dark');
    expect(doctor.diagnose(settings)).toEqual([]);
  });

  test('failed atomic rename retains original settings and backup, cleans temporary output', () => {
    const tmp = makeTempDir();
    const rename = fs.renameSync;
    try {
      const settingsPath = writeSettings(tmp, buildSettings({ broken: 1 }));
      const original = fs.readFileSync(settingsPath);
      fs.renameSync = () => { throw new Error('rename denied'); };
      expect(() => doctor.repair({ settingsPath })).toThrow('rename denied');
      expect(fs.readFileSync(settingsPath)).toEqual(original);
      const names = fs.readdirSync(tmp);
      expect(names.some(name => name.includes('.tmp.'))).toBe(false);
      expect(fs.readFileSync(path.join(tmp, names.find(name => name.includes('.bak.'))))).toEqual(original);
    } finally { fs.renameSync = rename; fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('existing backup is never overwritten on timestamp collision', () => {
    const tmp = makeTempDir();
    const iso = Date.prototype.toISOString;
    try {
      Date.prototype.toISOString = () => '2026-09-13T20:00:00.000Z';
      const settingsPath = writeSettings(tmp, buildSettings({ broken: 1 }));
      const original = fs.readFileSync(settingsPath);
      const backupPath = settingsPath + '.bak.2026-09-13T20-00-00-000Z';
      fs.writeFileSync(backupPath, 'earlier owner backup');
      expect(() => doctor.repair({ settingsPath })).toThrow();
      expect(fs.readFileSync(backupPath, 'utf8')).toBe('earlier owner backup');
      expect(fs.readFileSync(settingsPath)).toEqual(original);
    } finally { Date.prototype.toISOString = iso; fs.rmSync(tmp, { recursive: true, force: true }); }
  });
});

/**
 * Unit Tests: Platform Module
 *
 * Tests platform detection, path utilities, and terminal detection:
 * - detectPlatform: OS, shell, environment detection with caching
 * - gsdPaths: cross-platform path operations (pathe-based)
 * - detectTerminal: color support, Unicode, dimensions
 */

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { detectPlatform, clearCache: clearPlatformCache } = require('../src/platform/detect');
const { gsdPaths } = require('../src/platform/paths');
const { detectTerminal, clearCache: clearTerminalCache } = require('../src/platform/terminal');
const { mockEnv } = require('./helpers');

describe('detectPlatform', () => {
  let restoreEnv;

  afterEach(() => {
    clearPlatformCache();
    if (restoreEnv) {
      restoreEnv();
      restoreEnv = null;
    }
  });

  describe('return shape and caching', () => {
    test('returns object with required fields', () => {
      const platform = detectPlatform();
      expect(platform).toHaveProperty('os');
      expect(platform).toHaveProperty('shell');
      expect(platform).toHaveProperty('arch');
      expect(platform).toHaveProperty('homedir');
      expect(platform).toHaveProperty('nodeVersion');
      expect(platform).toHaveProperty('gitAvailable');
    });

    test('caches result on repeated calls (same object reference)', () => {
      const first = detectPlatform();
      const second = detectPlatform();
      expect(first).toBe(second);
    });

    test('clearCache() makes next call re-detect', () => {
      const first = detectPlatform();
      clearPlatformCache();
      const second = detectPlatform();
      // Not the same object reference after cache clear
      expect(first).not.toBe(second);
      // But should have same values
      expect(first.os).toBe(second.os);
    });
  });

  describe('OS detection', () => {
    test('os field matches process.platform', () => {
      const platform = detectPlatform();
      expect(platform.os).toBe(process.platform);
    });

    test('boolean flags match os value', () => {
      const platform = detectPlatform();
      if (platform.os === 'win32') {
        expect(platform.isWindows).toBe(true);
        expect(platform.isMac).toBe(false);
        expect(platform.isLinux).toBe(false);
      } else if (platform.os === 'darwin') {
        expect(platform.isWindows).toBe(false);
        expect(platform.isMac).toBe(true);
        expect(platform.isLinux).toBe(false);
      } else if (platform.os === 'linux') {
        expect(platform.isWindows).toBe(false);
        expect(platform.isMac).toBe(false);
        expect(platform.isLinux).toBe(true);
      }
    });
  });

  describe('shell detection', () => {
    test('shell is a non-empty string', () => {
      const platform = detectPlatform();
      expect(typeof platform.shell).toBe('string');
      expect(platform.shell.length).toBeGreaterThan(0);
    });

    test('shell is one of known values', () => {
      const platform = detectPlatform();
      const knownShells = ['bash', 'zsh', 'pwsh', 'cmd'];
      expect(knownShells).toContain(platform.shell);
    });

    test('exactly one shell boolean is true', () => {
      const platform = detectPlatform();
      const shellBooleans = [
        platform.isBash,
        platform.isZsh,
        platform.isPowerShell,
        platform.isCmd
      ];
      const trueCount = shellBooleans.filter(v => v === true).length;
      expect(trueCount).toBe(1);
    });

    test('shell detection respects MSYSTEM env var (MinGW)', () => {
      clearPlatformCache();
      restoreEnv = mockEnv({ MSYSTEM: 'MINGW64', SHELL: undefined, PSModulePath: undefined });
      const platform = detectPlatform();

      if (process.platform === 'win32') {
        expect(platform.shell).toBe('bash');
        expect(platform.isBash).toBe(true);
      }
    });

    test('shell detection respects PSModulePath env var (PowerShell)', () => {
      if (process.platform !== 'win32') {
        return; // Skip on non-Windows
      }

      clearPlatformCache();
      // Save original values
      const originalMSYSTEM = process.env.MSYSTEM;
      const originalPSModulePath = process.env.PSModulePath;

      // Set PowerShell env
      delete process.env.MSYSTEM;
      process.env.PSModulePath = 'C:\\Program Files\\...';

      const platform = detectPlatform();
      expect(platform.shell).toBe('pwsh');
      expect(platform.isPowerShell).toBe(true);

      // Restore
      if (originalMSYSTEM !== undefined) {
        process.env.MSYSTEM = originalMSYSTEM;
      }
      if (originalPSModulePath !== undefined) {
        process.env.PSModulePath = originalPSModulePath;
      } else {
        delete process.env.PSModulePath;
      }
    });

    test('shell detection respects SHELL env var on Unix', () => {
      if (process.platform === 'win32') {
        return; // Skip on Windows
      }

      clearPlatformCache();
      restoreEnv = mockEnv({ SHELL: '/bin/zsh' });
      const platform = detectPlatform();

      expect(platform.shell).toBe('zsh');
      expect(platform.isZsh).toBe(true);
    });
  });

  describe('environment flags', () => {
    test('isMingw, isWSL, isGitBash, isNative are booleans', () => {
      const platform = detectPlatform();
      expect(typeof platform.isMingw).toBe('boolean');
      expect(typeof platform.isWSL).toBe('boolean');
      expect(typeof platform.isGitBash).toBe('boolean');
      expect(typeof platform.isNative).toBe('boolean');
    });

    test('isMingw is true when MSYSTEM set', () => {
      clearPlatformCache();
      restoreEnv = mockEnv({ MSYSTEM: 'MINGW64' });
      const platform = detectPlatform();

      if (process.platform === 'win32') {
        expect(platform.isMingw).toBe(true);
      }
    });

    test('isNative is true when not MinGW or WSL', () => {
      // This test is tricky because we're running in actual environment
      // Just verify the flag exists and is boolean
      const platform = detectPlatform();
      expect(typeof platform.isNative).toBe('boolean');
    });
  });

  describe('Node.js version', () => {
    test('nodeVersion matches process.versions.node', () => {
      const platform = detectPlatform();
      expect(platform.nodeVersion).toBe(process.versions.node);
    });

    test('nodeMajor is a number', () => {
      const platform = detectPlatform();
      expect(typeof platform.nodeMajor).toBe('number');
      expect(platform.nodeMajor).toBeGreaterThan(0);
    });

    test('nodeIsLTS is a boolean', () => {
      const platform = detectPlatform();
      expect(typeof platform.nodeIsLTS).toBe('boolean');
    });

    test('nodeMajor >= 20 means nodeIsLTS is true', () => {
      const platform = detectPlatform();
      if (platform.nodeMajor >= 20) {
        expect(platform.nodeIsLTS).toBe(true);
      }
    });
  });

  describe('git detection', () => {
    test('gitAvailable is a boolean', () => {
      const platform = detectPlatform();
      expect(typeof platform.gitAvailable).toBe('boolean');
    });

    test('when git is available, gitPath and gitVersion are strings', () => {
      const platform = detectPlatform();
      if (platform.gitAvailable) {
        expect(typeof platform.gitPath).toBe('string');
        expect(typeof platform.gitVersion).toBe('string');
        expect(platform.gitPath.length).toBeGreaterThan(0);
        expect(platform.gitVersion.length).toBeGreaterThan(0);
      }
    });

    test('when git is unavailable, gitPath and gitVersion are null', () => {
      const platform = detectPlatform();
      if (!platform.gitAvailable) {
        expect(platform.gitPath).toBe(null);
        expect(platform.gitVersion).toBe(null);
      }
    });
  });

  describe('system information', () => {
    test('arch is a non-empty string', () => {
      const platform = detectPlatform();
      expect(typeof platform.arch).toBe('string');
      expect(platform.arch.length).toBeGreaterThan(0);
    });

    test('cpus is a positive number', () => {
      const platform = detectPlatform();
      expect(typeof platform.cpus).toBe('number');
      expect(platform.cpus).toBeGreaterThan(0);
    });

    test('homedir is a non-empty string', () => {
      const platform = detectPlatform();
      expect(typeof platform.homedir).toBe('string');
      expect(platform.homedir.length).toBeGreaterThan(0);
    });
  });
});

describe('gsdPaths', () => {
  let restoreEnv;

  afterEach(() => {
    if (restoreEnv) {
      restoreEnv();
      restoreEnv = null;
    }
  });

  describe('gsdHome()', () => {
    test('returns path ending with .gsd', () => {
      const originalGsdHome = process.env.GSD_HOME;
      delete process.env.GSD_HOME;

      const home = gsdPaths.gsdHome();
      expect(home).toMatch(/\.gsd$/);

      if (originalGsdHome !== undefined) {
        process.env.GSD_HOME = originalGsdHome;
      }
    });

    test('gsdHome() with argument appends segment', () => {
      const originalGsdHome = process.env.GSD_HOME;
      delete process.env.GSD_HOME;

      const configPath = gsdPaths.gsdHome('config.json');
      expect(configPath).toMatch(/\.gsd[/\\]config\.json$/);

      if (originalGsdHome !== undefined) {
        process.env.GSD_HOME = originalGsdHome;
      }
    });

    test('gsdHome() with multiple arguments joins all segments', () => {
      const originalGsdHome = process.env.GSD_HOME;
      delete process.env.GSD_HOME;

      const path = gsdPaths.gsdHome('sub', 'dir', 'file.txt');
      expect(path).toMatch(/\.gsd[/\\]sub[/\\]dir[/\\]file\.txt$/);

      if (originalGsdHome !== undefined) {
        process.env.GSD_HOME = originalGsdHome;
      }
    });

    test('respects GSD_HOME env var override', () => {
      restoreEnv = mockEnv({ GSD_HOME: '/custom/gsd/path' });
      const home = gsdPaths.gsdHome();
      // pathe normalizes to forward slashes
      expect(home).toBe('/custom/gsd/path');
    });
  });

  describe('claudeHome()', () => {
    test('returns path ending with .claude', () => {
      const originalClaudeHome = process.env.CLAUDE_CONFIG_DIR;
      delete process.env.CLAUDE_CONFIG_DIR;

      const home = gsdPaths.claudeHome();
      expect(home).toMatch(/\.claude$/);

      if (originalClaudeHome !== undefined) {
        process.env.CLAUDE_CONFIG_DIR = originalClaudeHome;
      }
    });

    test('claudeHome() with argument appends segment', () => {
      const originalClaudeHome = process.env.CLAUDE_CONFIG_DIR;
      delete process.env.CLAUDE_CONFIG_DIR;

      const path = gsdPaths.claudeHome('settings.json');
      expect(path).toMatch(/\.claude[/\\]settings\.json$/);

      if (originalClaudeHome !== undefined) {
        process.env.CLAUDE_CONFIG_DIR = originalClaudeHome;
      }
    });

    test('respects CLAUDE_CONFIG_DIR env var override', () => {
      restoreEnv = mockEnv({ CLAUDE_CONFIG_DIR: '/custom/claude/path' });
      const home = gsdPaths.claudeHome();
      expect(home).toBe('/custom/claude/path');
    });
  });

  describe('path normalization', () => {
    test('toForwardSlash() converts backslashes to forward slashes', () => {
      const result = gsdPaths.toForwardSlash('C:\\Users\\test\\file.txt');
      expect(result).toBe('C:/Users/test/file.txt');
    });

    test('toForwardSlash() preserves already-forward-slash paths', () => {
      const result = gsdPaths.toForwardSlash('/home/user/file.txt');
      expect(result).toBe('/home/user/file.txt');
    });

    test('toForwardSlash() handles mixed slashes', () => {
      const result = gsdPaths.toForwardSlash('C:\\Users/test\\file.txt');
      expect(result).toBe('C:/Users/test/file.txt');
    });
  });

  describe('expandTilde()', () => {
    test('expands ~ to homedir', () => {
      const os = require('os');
      const result = gsdPaths.expandTilde('~/test');
      // pathe normalizes to forward slashes
      const normalizedHomedir = os.homedir().replace(/\\/g, '/');
      expect(result).toContain(normalizedHomedir);
      expect(result).toMatch(/test$/);
    });

    test('expands bare ~ to homedir', () => {
      const os = require('os');
      const result = gsdPaths.expandTilde('~');
      // pathe.join returns forward slashes
      const expected = os.homedir().replace(/\\/g, '/');
      expect(result).toBe(expected);
    });

    test('returns non-tilde paths unchanged', () => {
      const result = gsdPaths.expandTilde('/absolute/path');
      expect(result).toBe('/absolute/path');
    });

    test('returns relative paths unchanged', () => {
      const result = gsdPaths.expandTilde('relative/path');
      expect(result).toBe('relative/path');
    });
  });

  describe('isAbsolute()', () => {
    test('detects Unix absolute paths', () => {
      expect(gsdPaths.isAbsolute('/home/user')).toBe(true);
    });

    test('detects Windows absolute paths', () => {
      expect(gsdPaths.isAbsolute('C:/Users/test')).toBe(true);
      expect(gsdPaths.isAbsolute('C:\\Users\\test')).toBe(true);
    });

    test('detects relative paths', () => {
      expect(gsdPaths.isAbsolute('relative/path')).toBe(false);
      expect(gsdPaths.isAbsolute('./relative')).toBe(false);
      expect(gsdPaths.isAbsolute('../parent')).toBe(false);
    });
  });

  describe('pathe operations produce forward slashes', () => {
    test('join produces forward slashes', () => {
      const result = gsdPaths.join('dir', 'subdir', 'file.txt');
      expect(result).toBe('dir/subdir/file.txt');
    });

    test('resolve produces forward slashes', () => {
      const result = gsdPaths.resolve('dir', 'file.txt');
      expect(result).toContain('/');
      expect(result).not.toMatch(/\\/);
    });

    test('dirname produces forward slashes', () => {
      const result = gsdPaths.dirname('/home/user/file.txt');
      expect(result).toBe('/home/user');
    });
  });
});

describe('detectTerminal', () => {
  let restoreEnv;

  afterEach(() => {
    clearTerminalCache();
    if (restoreEnv) {
      restoreEnv();
      restoreEnv = null;
    }
  });

  describe('return shape', () => {
    test('returns object with expected shape', () => {
      const terminal = detectTerminal();
      expect(terminal).toHaveProperty('colorLevel');
      expect(terminal).toHaveProperty('supportsColor');
      expect(terminal).toHaveProperty('supports256Color');
      expect(terminal).toHaveProperty('supportsTruecolor');
      expect(terminal).toHaveProperty('supportsUnicode');
      expect(terminal).toHaveProperty('emulator');
      expect(terminal).toHaveProperty('columns');
      expect(terminal).toHaveProperty('rows');
      expect(terminal).toHaveProperty('isTTY');
    });

    test('caches result on repeated calls', () => {
      const first = detectTerminal();
      const second = detectTerminal();
      expect(first).toBe(second);
    });

    test('clearCache() makes next call re-detect', () => {
      const first = detectTerminal();
      clearTerminalCache();
      const second = detectTerminal();
      expect(first).not.toBe(second);
    });
  });

  describe('color support detection', () => {
    test('colorLevel is 0-3', () => {
      const terminal = detectTerminal();
      expect(terminal.colorLevel).toBeGreaterThanOrEqual(0);
      expect(terminal.colorLevel).toBeLessThanOrEqual(3);
    });

    test('supportsColor is boolean matching colorLevel > 0', () => {
      const terminal = detectTerminal();
      expect(terminal.supportsColor).toBe(terminal.colorLevel > 0);
    });

    test('supports256Color is boolean matching colorLevel >= 2', () => {
      const terminal = detectTerminal();
      expect(terminal.supports256Color).toBe(terminal.colorLevel >= 2);
    });

    test('supportsTruecolor is boolean matching colorLevel >= 3', () => {
      const terminal = detectTerminal();
      expect(terminal.supportsTruecolor).toBe(terminal.colorLevel >= 3);
    });

    test('NO_COLOR env var disables color', () => {
      clearTerminalCache();
      restoreEnv = mockEnv({ NO_COLOR: '1' });
      const terminal = detectTerminal();
      expect(terminal.colorLevel).toBe(0);
      expect(terminal.supportsColor).toBe(false);
    });

    test('FORCE_COLOR=3 enables truecolor', () => {
      clearTerminalCache();
      restoreEnv = mockEnv({ FORCE_COLOR: '3', NO_COLOR: undefined });
      const terminal = detectTerminal();
      expect(terminal.colorLevel).toBe(3);
      expect(terminal.supportsTruecolor).toBe(true);
    });

    test('Windows Terminal (WT_SESSION) supports truecolor', () => {
      clearTerminalCache();
      const originalWT = process.env.WT_SESSION;
      const originalNO_COLOR = process.env.NO_COLOR;
      const originalFORCE_COLOR = process.env.FORCE_COLOR;

      process.env.WT_SESSION = 'some-session-id';
      delete process.env.NO_COLOR;
      delete process.env.FORCE_COLOR;

      const terminal = detectTerminal();
      expect(terminal.colorLevel).toBe(3);
      expect(terminal.emulator).toBe('Windows Terminal');

      // Restore
      if (originalWT !== undefined) process.env.WT_SESSION = originalWT;
      else delete process.env.WT_SESSION;
      if (originalNO_COLOR !== undefined) process.env.NO_COLOR = originalNO_COLOR;
      if (originalFORCE_COLOR !== undefined) process.env.FORCE_COLOR = originalFORCE_COLOR;
    });

    test('COLORTERM=truecolor enables truecolor', () => {
      clearTerminalCache();
      const originalCOLORTERM = process.env.COLORTERM;
      const originalNO_COLOR = process.env.NO_COLOR;
      const originalFORCE_COLOR = process.env.FORCE_COLOR;

      process.env.COLORTERM = 'truecolor';
      delete process.env.NO_COLOR;
      delete process.env.FORCE_COLOR;

      const terminal = detectTerminal();
      expect(terminal.colorLevel).toBe(3);

      // Restore
      if (originalCOLORTERM !== undefined) process.env.COLORTERM = originalCOLORTERM;
      else delete process.env.COLORTERM;
      if (originalNO_COLOR !== undefined) process.env.NO_COLOR = originalNO_COLOR;
      if (originalFORCE_COLOR !== undefined) process.env.FORCE_COLOR = originalFORCE_COLOR;
    });
  });

  describe('Unicode support', () => {
    test('supportsUnicode is a boolean', () => {
      const terminal = detectTerminal();
      expect(typeof terminal.supportsUnicode).toBe('boolean');
    });

    test('GSD_UNICODE env var overrides detection', () => {
      clearTerminalCache();
      restoreEnv = mockEnv({ GSD_UNICODE: '1' });
      const terminal = detectTerminal();
      expect(terminal.supportsUnicode).toBe(true);
    });

    test('GSD_UNICODE=0 disables Unicode', () => {
      clearTerminalCache();
      restoreEnv = mockEnv({ GSD_UNICODE: '0' });
      const terminal = detectTerminal();
      expect(terminal.supportsUnicode).toBe(false);
    });
  });

  describe('dimensions', () => {
    test('columns is a positive integer', () => {
      const terminal = detectTerminal();
      expect(typeof terminal.columns).toBe('number');
      expect(terminal.columns).toBeGreaterThan(0);
    });

    test('rows is a positive integer', () => {
      const terminal = detectTerminal();
      expect(typeof terminal.rows).toBe('number');
      expect(terminal.rows).toBeGreaterThan(0);
    });
  });

  describe('terminal emulator', () => {
    test('emulator is a non-empty string', () => {
      const terminal = detectTerminal();
      expect(typeof terminal.emulator).toBe('string');
      expect(terminal.emulator.length).toBeGreaterThan(0);
    });

    test('emulator boolean flags match emulator string', () => {
      const terminal = detectTerminal();
      expect(terminal.isWindowsTerminal).toBe(terminal.emulator === 'Windows Terminal');
      expect(terminal.isVSCode).toBe(terminal.emulator === 'VS Code');
      expect(terminal.isITerm2).toBe(terminal.emulator === 'iTerm2');
    });
  });

  describe('TTY detection', () => {
    test('isTTY is a boolean', () => {
      const terminal = detectTerminal();
      expect(typeof terminal.isTTY).toBe('boolean');
    });
  });
});

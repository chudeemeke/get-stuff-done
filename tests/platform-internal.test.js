/**
 * Unit Tests: Platform Module Internal Helpers (Direct-Call Coverage)
 *
 * Tests exported internal helper functions directly without cache-clear + re-require.
 * This is necessary because bun 1.3.5 coverage tracking does not attribute coverage
 * to the original source when modules are re-required after cache-clear.
 *
 * These tests complement platform.test.js which uses the cache-clear pattern.
 * By keeping this file separate, we ensure a clean module-load context so that
 * direct calls to _detectShell, _detectEnvironment etc. are tracked against the
 * original module instance.
 *
 * Coverage targets:
 *   detect.js  >= 95% lines (up from 66.67%)
 *   terminal.js >= 95% lines (up from 93.50%)
 *   paths.js >= 95% functions
 */

const { describe, test, expect, afterEach } = require('bun:test');
const {
  detectPlatform,
  clearCache: clearPlatformCache,
  _detectShell,
  _detectEnvironment,
  _detectNodeVersion,
  _detectGit,
} = require('../overlay/src/platform/detect');
const {
  detectTerminal,
  clearCache: clearTerminalCache,
  _detectColorLevel,
  _detectTerminalEmulator,
  _detectUnicodeSupport,
  _getTerminalDimensions,
} = require('../overlay/src/platform/terminal');
const { gsdPaths } = require('../overlay/src/platform/paths');
const { mockPlatform } = require('./helpers');

// =============================================================================
// _detectShell direct tests
// =============================================================================

describe('_detectShell direct tests', () => {
  function saveAndClearShellVars() {
    const saved = {};
    const clearVars = ['MSYSTEM', 'PSModulePath', 'POWERSHELL_DISTRIBUTION_CHANNEL', 'SHELL', 'EXEPATH', 'MINGW_PREFIX'];
    clearVars.forEach(v => { saved[v] = process.env[v]; delete process.env[v]; });
    return () => {
      clearVars.forEach(v => {
        if (saved[v] !== undefined) process.env[v] = saved[v];
        else delete process.env[v];
      });
    };
  }

  test('Windows + MSYSTEM set detects mingw bash', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = saveAndClearShellVars();
    process.env.MSYSTEM = 'MINGW64';

    const result = _detectShell();
    expect(result.shell).toBe('bash');
    expect(result.variant).toBe('mingw');
    expect(result.isBash).toBe(true);

    restoreV();
    restoreP();
  });

  test('Windows + PSModulePath detects pwsh', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = saveAndClearShellVars();
    process.env.PSModulePath = 'C:\\Program Files\\PowerShell\\Modules';

    const result = _detectShell();
    expect(result.shell).toBe('pwsh');
    expect(result.isPowerShell).toBe(true);

    restoreV();
    restoreP();
  });

  test('Windows + POWERSHELL_DISTRIBUTION_CHANNEL detects pwsh', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = saveAndClearShellVars();
    process.env.POWERSHELL_DISTRIBUTION_CHANNEL = 'MSI:Windows 10';

    const result = _detectShell();
    expect(result.shell).toBe('pwsh');
    expect(result.isPowerShell).toBe(true);

    restoreV();
    restoreP();
  });

  test('Windows + no shell indicators defaults to cmd', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = saveAndClearShellVars();

    const result = _detectShell();
    expect(result.shell).toBe('cmd');
    expect(result.isCmd).toBe(true);

    restoreV();
    restoreP();
  });

  test('Unix + SHELL=/bin/zsh detects zsh', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = saveAndClearShellVars();
    process.env.SHELL = '/bin/zsh';

    const result = _detectShell();
    expect(result.shell).toBe('zsh');
    expect(result.isZsh).toBe(true);

    restoreV();
    restoreP();
  });

  test('Unix + SHELL=/bin/bash detects bash', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = saveAndClearShellVars();
    process.env.SHELL = '/bin/bash';

    const result = _detectShell();
    expect(result.shell).toBe('bash');
    expect(result.isBash).toBe(true);

    restoreV();
    restoreP();
  });

  test('Unix + unknown SHELL=/bin/fish defaults to bash with unknown variant', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = saveAndClearShellVars();
    process.env.SHELL = '/bin/fish';

    const result = _detectShell();
    expect(result.shell).toBe('bash');
    expect(result.variant).toBe('unknown');

    restoreV();
    restoreP();
  });

  test('Unix + empty SHELL defaults to bash with unknown variant', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = saveAndClearShellVars();
    process.env.SHELL = '';

    const result = _detectShell();
    expect(result.shell).toBe('bash');
    expect(result.variant).toBe('unknown');

    restoreV();
    restoreP();
  });
});

// =============================================================================
// _detectEnvironment direct tests
// =============================================================================

describe('_detectEnvironment direct tests', () => {
  const fs = require('fs');

  function saveAndClearEnvVars() {
    const saved = {};
    const clearVars = ['MSYSTEM', 'MINGW_PREFIX', 'EXEPATH', 'WSL_DISTRO_NAME'];
    clearVars.forEach(v => { saved[v] = process.env[v]; delete process.env[v]; });
    return () => {
      clearVars.forEach(v => {
        if (saved[v] !== undefined) process.env[v] = saved[v];
        else delete process.env[v];
      });
    };
  }

  test('Linux + /proc/version with Microsoft detects WSL', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = saveAndClearEnvVars();
    const origReadFile = fs.readFileSync;
    fs.readFileSync = (path, enc) => {
      if (path === '/proc/version') {
        return 'Linux version 5.10.0-microsoft-standard-WSL2 (oe-user@oe-host)';
      }
      return origReadFile(path, enc);
    };

    const result = _detectEnvironment();
    expect(result.isWSL).toBe(true);

    fs.readFileSync = origReadFile;
    restoreV();
    restoreP();
  });

  test('Linux + /proc/version throws + WSL_DISTRO_NAME set detects WSL', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = saveAndClearEnvVars();
    process.env.WSL_DISTRO_NAME = 'Ubuntu';
    const origReadFile = fs.readFileSync;
    fs.readFileSync = (path, enc) => {
      if (path === '/proc/version') {
        const error = new Error('ENOENT: no such file or directory');
        error.code = 'ENOENT';
        throw error;
      }
      return origReadFile(path, enc);
    };

    const result = _detectEnvironment();
    expect(result.isWSL).toBe(true);

    fs.readFileSync = origReadFile;
    restoreV();
    restoreP();
  });

  test('Linux + /proc/version throws + no WSL_DISTRO_NAME is not WSL', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = saveAndClearEnvVars();
    const origReadFile = fs.readFileSync;
    fs.readFileSync = (path, enc) => {
      if (path === '/proc/version') {
        const error = new Error('ENOENT: no such file or directory');
        error.code = 'ENOENT';
        throw error;
      }
      return origReadFile(path, enc);
    };

    const result = _detectEnvironment();
    expect(result.isWSL).toBe(false);

    fs.readFileSync = origReadFile;
    restoreV();
    restoreP();
  });

  test('Windows + MSYSTEM + EXEPATH with git detects isGitBash', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = saveAndClearEnvVars();
    process.env.MSYSTEM = 'MINGW64';
    process.env.EXEPATH = 'C:\\Program Files\\Git\\usr\\bin';

    const result = _detectEnvironment();
    expect(result.isGitBash).toBe(true);
    expect(result.isMingw).toBe(true);

    restoreV();
    restoreP();
  });

  test('Windows + MINGW_PREFIX set detects isMingw', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = saveAndClearEnvVars();
    process.env.MINGW_PREFIX = '/mingw64';

    const result = _detectEnvironment();
    expect(result.isMingw).toBe(true);

    restoreV();
    restoreP();
  });

  test('Windows + EXEPATH with git but no MSYSTEM detects isMingw', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = saveAndClearEnvVars();
    process.env.EXEPATH = 'C:\\Program Files\\Git\\usr\\bin';

    const result = _detectEnvironment();
    expect(result.isMingw).toBe(true);

    restoreV();
    restoreP();
  });

  test('Darwin + no mingw or WSL vars detects isNative', () => {
    const restoreP = mockPlatform('darwin');
    const restoreV = saveAndClearEnvVars();

    const result = _detectEnvironment();
    expect(result.isNative).toBe(true);
    expect(result.isMingw).toBe(false);
    expect(result.isWSL).toBe(false);

    restoreV();
    restoreP();
  });
});

// =============================================================================
// _detectNodeVersion direct tests
// =============================================================================

describe('_detectNodeVersion direct tests', () => {
  test('returns version info for current Node.js', () => {
    const result = _detectNodeVersion();
    expect(typeof result.version).toBe('string');
    expect(typeof result.major).toBe('number');
    expect(typeof result.isLTS).toBe('boolean');
    if (result.major >= 20) {
      expect(result.isLTS).toBe(true);
      expect(result.warning).toBe(null);
    }
  });

  test('version matches process.versions.node', () => {
    const result = _detectNodeVersion();
    expect(result.version).toBe(process.versions.node);
  });
});

// =============================================================================
// _detectGit direct tests
// =============================================================================

describe('_detectGit direct tests', () => {
  // Note: detect.js uses `const { execSync } = require('child_process')` (destructuring
  // at load time). Mutating childProcess.execSync after import does not affect the
  // already-destructured reference. The "git unavailable" branch is covered by the
  // existing cache-clear + re-require test in platform.test.js.
  // This describe block covers the "git available" path directly.

  test('git available: returns available=true with path and version strings', () => {
    const result = _detectGit();
    expect(result.available).toBe(true);
    expect(typeof result.path).toBe('string');
    expect(typeof result.version).toBe('string');
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.version.length).toBeGreaterThan(0);
  });

  test('_detectGit returns object with expected shape', () => {
    const result = _detectGit();
    expect(result).toHaveProperty('available');
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('version');
    expect(typeof result.available).toBe('boolean');
  });
});

// =============================================================================
// _detectTerminalEmulator direct tests
// =============================================================================

describe('_detectTerminalEmulator direct tests', () => {
  function cleanTerminalEnvDirect() {
    const saved = {};
    const clearVars = [
      'WT_SESSION', 'ConEmuTask', 'TERM_PROGRAM', 'TERM', 'MSYSTEM',
      'FORCE_COLOR', 'NO_COLOR', 'NODE_DISABLE_COLORS', 'COLORTERM'
    ];
    clearVars.forEach(v => { saved[v] = process.env[v]; delete process.env[v]; });
    return () => {
      clearVars.forEach(v => {
        if (saved[v] !== undefined) process.env[v] = saved[v];
        else delete process.env[v];
      });
    };
  }

  test('Windows Console Host: win32 without WT_SESSION or MSYSTEM', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = cleanTerminalEnvDirect();

    const result = _detectTerminalEmulator();
    expect(result).toBe('Windows Console Host');

    restoreV();
    restoreP();
  });

  test('unknown emulator on non-Windows with no terminal vars', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = cleanTerminalEnvDirect();

    const result = _detectTerminalEmulator();
    expect(result).toBe('unknown');

    restoreV();
    restoreP();
  });

  test('WT_SESSION set returns Windows Terminal', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.WT_SESSION = 'some-session';

    const result = _detectTerminalEmulator();
    expect(result).toBe('Windows Terminal');

    restoreV();
  });

  test('ConEmuTask set returns ConEmu', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.ConEmuTask = '{cmd::Cmd}';

    const result = _detectTerminalEmulator();
    expect(result).toBe('ConEmu');

    restoreV();
  });

  test('TERM_PROGRAM=iTerm.app returns iTerm2', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'iTerm.app';

    const result = _detectTerminalEmulator();
    expect(result).toBe('iTerm2');

    restoreV();
  });

  test('TERM_PROGRAM=vscode returns VS Code', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'vscode';

    const result = _detectTerminalEmulator();
    expect(result).toBe('VS Code');

    restoreV();
  });

  test('TERM_PROGRAM=Apple_Terminal returns Apple Terminal', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'Apple_Terminal';

    const result = _detectTerminalEmulator();
    expect(result).toBe('Apple Terminal');

    restoreV();
  });

  test('TERM_PROGRAM=Hyper returns Hyper', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'Hyper';

    const result = _detectTerminalEmulator();
    expect(result).toBe('Hyper');

    restoreV();
  });

  test('TERM=kitty returns Kitty', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'kitty';

    const result = _detectTerminalEmulator();
    expect(result).toBe('Kitty');

    restoreV();
  });

  test('TERM=alacritty returns Alacritty', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'alacritty';

    const result = _detectTerminalEmulator();
    expect(result).toBe('Alacritty');

    restoreV();
  });

  test('TERM=xterm returns xterm', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'xterm';

    const result = _detectTerminalEmulator();
    expect(result).toBe('xterm');

    restoreV();
  });

  test('TERM=screen returns GNU Screen', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'screen';

    const result = _detectTerminalEmulator();
    expect(result).toBe('GNU Screen');

    restoreV();
  });

  test('TERM=tmux-256color returns tmux', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'tmux-256color';

    const result = _detectTerminalEmulator();
    expect(result).toBe('tmux');

    restoreV();
  });
});

// =============================================================================
// _detectUnicodeSupport direct tests
// =============================================================================

describe('_detectUnicodeSupport direct tests', () => {
  function cleanTerminalEnvDirect() {
    const saved = {};
    const clearVars = [
      'GSD_UNICODE', 'WT_SESSION', 'TERM_PROGRAM', 'TERM', 'MSYSTEM',
      'FORCE_COLOR', 'NO_COLOR', 'NODE_DISABLE_COLORS', 'COLORTERM'
    ];
    clearVars.forEach(v => { saved[v] = process.env[v]; delete process.env[v]; });
    return () => {
      clearVars.forEach(v => {
        if (saved[v] !== undefined) process.env[v] = saved[v];
        else delete process.env[v];
      });
    };
  }

  test('Windows Console Host (win32 no MSYSTEM/WT_SESSION) returns false', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = cleanTerminalEnvDirect();

    const result = _detectUnicodeSupport();
    expect(result).toBe(false);

    restoreV();
    restoreP();
  });

  test('Linux framebuffer (TERM=linux) returns false', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'linux';

    const result = _detectUnicodeSupport();
    expect(result).toBe(false);

    restoreV();
    restoreP();
  });

  test('Unix with xterm TERM returns true', () => {
    const restoreP = mockPlatform('linux');
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'xterm';

    const result = _detectUnicodeSupport();
    expect(result).toBe(true);

    restoreV();
    restoreP();
  });

  test('Windows unknown terminal (TERM=unknown-terminal) returns false', () => {
    const restoreP = mockPlatform('win32');
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'unknown-terminal';

    const result = _detectUnicodeSupport();
    expect(result).toBe(false);

    restoreV();
    restoreP();
  });

  test('GSD_UNICODE=true override returns true', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.GSD_UNICODE = 'true';

    const result = _detectUnicodeSupport();
    expect(result).toBe(true);

    restoreV();
  });

  test('GSD_UNICODE=false override returns false', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.GSD_UNICODE = 'false';

    const result = _detectUnicodeSupport();
    expect(result).toBe(false);

    restoreV();
  });

  test('WT_SESSION set returns true', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.WT_SESSION = 'some-session-id';

    const result = _detectUnicodeSupport();
    expect(result).toBe(true);

    restoreV();
  });

  test('TERM_PROGRAM=iTerm.app returns true', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'iTerm.app';

    const result = _detectUnicodeSupport();
    expect(result).toBe(true);

    restoreV();
  });

  test('TERM_PROGRAM=vscode returns true', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'vscode';

    const result = _detectUnicodeSupport();
    expect(result).toBe(true);

    restoreV();
  });

  test('TERM_PROGRAM=Hyper returns true', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'Hyper';

    const result = _detectUnicodeSupport();
    expect(result).toBe(true);

    restoreV();
  });

  test('TERM=xterm-kitty returns true', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'xterm-kitty';

    const result = _detectUnicodeSupport();
    expect(result).toBe(true);

    restoreV();
  });

  test('TERM=alacritty returns true', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'alacritty';

    const result = _detectUnicodeSupport();
    expect(result).toBe(true);

    restoreV();
  });
});

// =============================================================================
// _detectColorLevel direct tests
// =============================================================================

describe('_detectColorLevel direct tests', () => {
  function cleanTerminalEnvDirect() {
    const saved = {};
    const clearVars = [
      'FORCE_COLOR', 'NO_COLOR', 'NODE_DISABLE_COLORS',
      'WT_SESSION', 'COLORTERM', 'TERM', 'TERM_PROGRAM', 'ConEmuTask'
    ];
    clearVars.forEach(v => { saved[v] = process.env[v]; delete process.env[v]; });
    return () => {
      clearVars.forEach(v => {
        if (saved[v] !== undefined) process.env[v] = saved[v];
        else delete process.env[v];
      });
    };
  }

  test('NODE_DISABLE_COLORS=1 disables color (returns 0)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.NODE_DISABLE_COLORS = '1';

    const result = _detectColorLevel();
    expect(result).toBe(0);

    restoreV();
  });

  test('Default basic color for unknown env (returns 1)', () => {
    const restoreV = cleanTerminalEnvDirect();

    const result = _detectColorLevel();
    expect(result).toBe(1);

    restoreV();
  });

  test('FORCE_COLOR=0 disables color (returns 0)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.FORCE_COLOR = '0';

    const result = _detectColorLevel();
    expect(result).toBe(0);

    restoreV();
  });

  test('FORCE_COLOR=1 enables basic color (returns 1)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.FORCE_COLOR = '1';

    const result = _detectColorLevel();
    expect(result).toBe(1);

    restoreV();
  });

  test('FORCE_COLOR=2 enables 256 color (returns 2)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.FORCE_COLOR = '2';

    const result = _detectColorLevel();
    expect(result).toBe(2);

    restoreV();
  });

  test('FORCE_COLOR=3 enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.FORCE_COLOR = '3';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });

  test('NO_COLOR disables color (returns 0)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.NO_COLOR = '1';

    const result = _detectColorLevel();
    expect(result).toBe(0);

    restoreV();
  });

  test('WT_SESSION enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.WT_SESSION = 'some-session-id';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });

  test('COLORTERM=truecolor enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.COLORTERM = 'truecolor';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });

  test('COLORTERM=24bit enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.COLORTERM = '24bit';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });

  test('TERM=dumb disables color (returns 0)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'dumb';

    const result = _detectColorLevel();
    expect(result).toBe(0);

    restoreV();
  });

  test('TERM with 256color enables 256 color (returns 2)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'xterm-256color';

    const result = _detectColorLevel();
    expect(result).toBe(2);

    restoreV();
  });

  test('TERM=xterm enables basic color (returns 1)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'xterm';

    const result = _detectColorLevel();
    expect(result).toBe(1);

    restoreV();
  });

  test('TERM=ansi enables basic color (returns 1)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'ansi';

    const result = _detectColorLevel();
    expect(result).toBe(1);

    restoreV();
  });

  test('TERM=screen enables basic color (returns 1)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'screen';

    const result = _detectColorLevel();
    expect(result).toBe(1);

    restoreV();
  });

  test('ConEmuTask set enables 256 color (returns 2)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.ConEmuTask = '{cmd::Cmd}';

    const result = _detectColorLevel();
    expect(result).toBe(2);

    restoreV();
  });

  test('TERM_PROGRAM=iTerm.app enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'iTerm.app';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });

  test('TERM_PROGRAM=vscode enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'vscode';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });

  test('TERM_PROGRAM=Apple_Terminal enables 256 color (returns 2)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'Apple_Terminal';

    const result = _detectColorLevel();
    expect(result).toBe(2);

    restoreV();
  });

  test('TERM_PROGRAM=Hyper enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM_PROGRAM = 'Hyper';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });

  test('TERM=kitty enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'kitty';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });

  test('TERM=alacritty enables truecolor (returns 3)', () => {
    const restoreV = cleanTerminalEnvDirect();
    process.env.TERM = 'alacritty';

    const result = _detectColorLevel();
    expect(result).toBe(3);

    restoreV();
  });
});

// =============================================================================
// detectTerminal aggregate function tests
// =============================================================================

describe('detectTerminal aggregate direct tests', () => {
  afterEach(() => {
    clearTerminalCache();
  });

  test('detectTerminal() returns complete terminal object', () => {
    clearTerminalCache();
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

  test('detectTerminal() caches on repeat call', () => {
    clearTerminalCache();
    const first = detectTerminal();
    const second = detectTerminal();
    expect(first).toBe(second);
  });
});

// =============================================================================
// detectPlatform aggregate function tests
// =============================================================================

describe('detectPlatform aggregate direct tests', () => {
  afterEach(() => {
    clearPlatformCache();
  });

  test('detectPlatform() returns complete platform object', () => {
    clearPlatformCache();
    const platform = detectPlatform();
    expect(platform).toHaveProperty('os');
    expect(platform).toHaveProperty('shell');
    expect(platform).toHaveProperty('arch');
    expect(platform).toHaveProperty('homedir');
    expect(platform).toHaveProperty('nodeVersion');
    expect(platform).toHaveProperty('gitAvailable');
    expect(platform).toHaveProperty('isMingw');
    expect(platform).toHaveProperty('isWSL');
    expect(platform).toHaveProperty('isNative');
  });

  test('detectPlatform() caches on repeat call', () => {
    clearPlatformCache();
    const first = detectPlatform();
    const second = detectPlatform();
    expect(first).toBe(second);
  });

  test('detectPlatform() os matches process.platform', () => {
    clearPlatformCache();
    const platform = detectPlatform();
    expect(platform.os).toBe(process.platform);
  });
});

// =============================================================================
// _getTerminalDimensions direct tests
// =============================================================================

describe('_getTerminalDimensions direct tests', () => {
  test('returns columns and rows with positive numbers', () => {
    const result = _getTerminalDimensions();
    expect(typeof result.columns).toBe('number');
    expect(typeof result.rows).toBe('number');
    expect(result.columns).toBeGreaterThan(0);
    expect(result.rows).toBeGreaterThan(0);
  });

  test('defaults to 80 columns when process.stdout.columns is undefined', () => {
    const origColumns = process.stdout.columns;
    Object.defineProperty(process.stdout, 'columns', { value: undefined, writable: true, configurable: true });
    const result = _getTerminalDimensions();
    expect(result.columns).toBe(80);
    Object.defineProperty(process.stdout, 'columns', { value: origColumns, writable: true, configurable: true });
  });
});

// =============================================================================
// gsdPaths direct tests (paths.js coverage)
// =============================================================================

describe('gsdPaths direct tests', () => {
  const os = require('os');

  describe('relative()', () => {
    test('returns relative path from base to target', () => {
      const result = gsdPaths.relative('/home/user', '/home/user/projects');
      expect(result).toBe('projects');
    });

    test('returns relative path across directories', () => {
      const result = gsdPaths.relative('/home/user/a', '/home/user/b/c');
      expect(result).toBe('../b/c');
    });
  });

  describe('gsdHome()', () => {
    test('returns path ending with .gsd when no args', () => {
      const savedGsdHome = process.env.GSD_HOME;
      delete process.env.GSD_HOME;

      const result = gsdPaths.gsdHome();
      expect(result).toMatch(/\.gsd$/);

      if (savedGsdHome !== undefined) process.env.GSD_HOME = savedGsdHome;
    });

    test('joins segment to GSD home', () => {
      const savedGsdHome = process.env.GSD_HOME;
      delete process.env.GSD_HOME;

      const result = gsdPaths.gsdHome('config.json');
      expect(result).toMatch(/\.gsd[/\\]config\.json$/);

      if (savedGsdHome !== undefined) process.env.GSD_HOME = savedGsdHome;
    });
  });

  describe('claudeHome()', () => {
    test('returns path ending with .claude when no args', () => {
      const savedClaudeDir = process.env.CLAUDE_CONFIG_DIR;
      delete process.env.CLAUDE_CONFIG_DIR;

      const result = gsdPaths.claudeHome();
      expect(result).toMatch(/\.claude$/);

      if (savedClaudeDir !== undefined) process.env.CLAUDE_CONFIG_DIR = savedClaudeDir;
    });

    test('joins segment to Claude home', () => {
      const savedClaudeDir = process.env.CLAUDE_CONFIG_DIR;
      delete process.env.CLAUDE_CONFIG_DIR;

      const result = gsdPaths.claudeHome('settings.json');
      expect(result).toMatch(/\.claude[/\\]settings\.json$/);

      if (savedClaudeDir !== undefined) process.env.CLAUDE_CONFIG_DIR = savedClaudeDir;
    });
  });

  describe('toForwardSlash()', () => {
    test('converts backslashes to forward slashes', () => {
      const result = gsdPaths.toForwardSlash('C:\\Users\\test\\file.txt');
      expect(result).toBe('C:/Users/test/file.txt');
    });

    test('preserves forward-slash paths unchanged', () => {
      const result = gsdPaths.toForwardSlash('/home/user/file.txt');
      expect(result).toBe('/home/user/file.txt');
    });
  });

  describe('expandTilde()', () => {
    test('expands ~ to homedir', () => {
      const result = gsdPaths.expandTilde('~/test');
      const normalizedHome = os.homedir().replace(/\\/g, '/');
      expect(result).toContain(normalizedHome);
      expect(result).toMatch(/test$/);
    });

    test('expands bare ~ to homedir', () => {
      const result = gsdPaths.expandTilde('~');
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
    });

    test('detects relative paths', () => {
      expect(gsdPaths.isAbsolute('relative/path')).toBe(false);
    });
  });
});

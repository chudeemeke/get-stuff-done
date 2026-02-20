/**
 * Terminal Capability Detection Module
 *
 * Detects terminal color depth, Unicode support, and dimensions.
 * Results are cached on first call for performance.
 *
 * Usage:
 *   const { detectTerminal } = require('./terminal');
 *   const term = detectTerminal();
 *   console.log(term.colorLevel);  // 0=none, 1=basic, 2=256, 3=truecolor
 *   console.log(term.supportsUnicode); // true/false
 *
 * Color Level Detection:
 *   - Checks COLORTERM, TERM, FORCE_COLOR environment variables
 *   - Recognizes modern terminals (Windows Terminal, iTerm2, VS Code, etc.)
 *   - Falls back to basic 16-color for legacy environments
 *
 * Unicode Support Detection:
 *   - Windows Terminal and modern terminals: true
 *   - Legacy Windows Console Host: false
 *   - Linux framebuffer (TERM=linux): false
 */

let cachedTerminal = null;

/**
 * Detect color support level
 * @returns {number} Color level (0-3)
 */
function detectColorLevel() {
  const env = process.env;

  // Explicit force color
  if (env.FORCE_COLOR !== undefined) {
    const level = parseInt(env.FORCE_COLOR, 10);
    if (level === 0) return 0;
    if (level === 1) return 1;
    if (level === 2) return 2;
    if (level === 3) return 3;
  }

  // No color requested
  if (env.NO_COLOR !== undefined || env.NODE_DISABLE_COLORS !== undefined) {
    return 0;
  }

  // Check for known terminal emulators first (before TERM/COLORTERM)
  if (env.WT_SESSION) {
    // Windows Terminal supports truecolor
    return 3;
  }

  // Truecolor support
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') {
    return 3;
  }

  // Check TERM variable
  const term = env.TERM || '';

  if (term === 'dumb') {
    return 0;
  }

  // 256 color support
  if (term.includes('256color')) {
    return 2;
  }

  // Basic color support
  if (
    term.includes('color') ||
    term.includes('ansi') ||
    term.includes('xterm') ||
    term.includes('screen')
  ) {
    return 1;
  }

  if (env.ConEmuTask) {
    // ConEmu supports 256 colors
    return 2;
  }

  if (env.TERM_PROGRAM) {
    const program = env.TERM_PROGRAM;
    if (program === 'iTerm.app') return 3;
    if (program === 'vscode') return 3;
    if (program === 'Apple_Terminal') return 2;
    if (program === 'Hyper') return 3;
  }

  // Check for Kitty and Alacritty
  if (term.includes('kitty') || term.includes('alacritty')) {
    return 3;
  }

  // Default to basic color for unknown terminals
  return 1;
}

/**
 * Detect terminal emulator
 * @returns {string} Terminal name
 */
function detectTerminalEmulator() {
  const env = process.env;

  if (env.WT_SESSION) return 'Windows Terminal';
  if (env.ConEmuTask) return 'ConEmu';
  if (env.TERM_PROGRAM === 'iTerm.app') return 'iTerm2';
  if (env.TERM_PROGRAM === 'vscode') return 'VS Code';
  if (env.TERM_PROGRAM === 'Apple_Terminal') return 'Apple Terminal';
  if (env.TERM_PROGRAM === 'Hyper') return 'Hyper';

  const term = env.TERM || '';
  if (term.includes('kitty')) return 'Kitty';
  if (term.includes('alacritty')) return 'Alacritty';
  if (term.includes('xterm')) return 'xterm';
  if (term.includes('screen')) return 'GNU Screen';
  if (term.includes('tmux')) return 'tmux';

  // Check for Windows Console Host
  if (process.platform === 'win32' && !env.WT_SESSION && !env.MSYSTEM) {
    return 'Windows Console Host';
  }

  return 'unknown';
}

/**
 * Detect Unicode support
 * @returns {boolean} True if Unicode is supported
 */
function detectUnicodeSupport() {
  const env = process.env;

  // Explicit override
  if (env.GSD_UNICODE !== undefined) {
    return env.GSD_UNICODE === '1' || env.GSD_UNICODE === 'true';
  }

  // Windows Terminal and modern terminals support Unicode
  if (env.WT_SESSION) return true;
  if (env.TERM_PROGRAM === 'iTerm.app') return true;
  if (env.TERM_PROGRAM === 'vscode') return true;
  if (env.TERM_PROGRAM === 'Hyper') return true;

  const term = env.TERM || '';
  if (term.includes('kitty')) return true;
  if (term.includes('alacritty')) return true;

  // Legacy Windows Console Host doesn't support Unicode well
  if (process.platform === 'win32' && !env.MSYSTEM && !env.WT_SESSION) {
    return false;
  }

  // Linux framebuffer doesn't support Unicode
  if (term === 'linux') {
    return false;
  }

  // Default to true for Unix-like systems
  if (process.platform !== 'win32') {
    return true;
  }

  // Default to false for unknown Windows terminals
  return false;
}

/**
 * Get terminal dimensions
 * @returns {object} Terminal size
 */
function getTerminalDimensions() {
  const stdout = process.stdout;

  return {
    columns: stdout.columns || 80,
    rows: stdout.rows || 24,
  };
}

/**
 * Detect all terminal capabilities
 * Results are cached after first call
 * @returns {object} Complete terminal detection result
 */
function detectTerminal() {
  if (cachedTerminal) {
    return cachedTerminal;
  }

  const colorLevel = detectColorLevel();
  const emulator = detectTerminalEmulator();
  const supportsUnicode = detectUnicodeSupport();
  const dimensions = getTerminalDimensions();

  cachedTerminal = {
    // Color support
    colorLevel,
    supportsColor: colorLevel > 0,
    supports256Color: colorLevel >= 2,
    supportsTruecolor: colorLevel >= 3,

    // Unicode support
    supportsUnicode,

    // Terminal info
    emulator,
    isWindowsTerminal: emulator === 'Windows Terminal',
    isVSCode: emulator === 'VS Code',
    isITerm2: emulator === 'iTerm2',

    // Dimensions
    columns: dimensions.columns,
    rows: dimensions.rows,

    // Interactive detection
    isTTY: process.stdout.isTTY || false,
  };

  return cachedTerminal;
}

/**
 * Clear cached terminal detection (for testing)
 */
function clearCache() {
  cachedTerminal = null;
}

module.exports = {
  detectTerminal,
  clearCache,
  // Internal exports for direct testing (coverage fix)
  _detectColorLevel: detectColorLevel,
  _detectTerminalEmulator: detectTerminalEmulator,
  _detectUnicodeSupport: detectUnicodeSupport,
  _getTerminalDimensions: getTerminalDimensions,
};

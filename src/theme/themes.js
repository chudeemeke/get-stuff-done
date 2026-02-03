/**
 * Theme Configurations
 *
 * Complete theme objects with precomposed Style instances.
 * Each theme provides all styles needed by GSD components.
 *
 * Usage:
 *   const theme = getTheme('default');
 *   theme.brand.icon.render('[GSD]');
 */

const { Style } = require('./Style');
const { semantic, contextual } = require('./tokens');

/**
 * Detect if terminal supports 256-color mode
 * @returns {boolean}
 */
function supports256Color() {
  // Windows Terminal, iTerm2, most modern terminals
  if (process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '256color') {
    return true;
  }
  // xterm-256color and similar
  if (process.env.TERM && process.env.TERM.includes('256color')) {
    return true;
  }
  // Windows Terminal
  if (process.env.WT_SESSION) {
    return true;
  }
  // VS Code terminal
  if (process.env.TERM_PROGRAM === 'vscode') {
    return true;
  }
  // ConEmu
  if (process.env.ConEmuTask) {
    return true;
  }
  return false;
}

/**
 * Build a Style from token definition
 * @param {object} tokenDef - Token definition with color and modifiers
 * @param {boolean} use256 - Whether to use 256-color mode
 * @returns {Style}
 */
function buildStyle(tokenDef, use256 = true) {
  let style = new Style();

  // Apply color
  if (tokenDef.color !== null) {
    const color = (use256 || typeof tokenDef.color !== 'number')
      ? tokenDef.color
      : (tokenDef.fallback || 'yellow');  // Fallback for 256-color tokens
    style = style.fg(color);
  }

  // Apply modifiers
  if (tokenDef.modifiers) {
    for (const mod of tokenDef.modifiers) {
      if (typeof style[mod] === 'function') {
        style = style[mod]();
      }
    }
  }

  return style;
}

/**
 * Create theme from tokens
 * @param {boolean} use256 - Whether to use 256-color mode
 * @returns {object} Theme object with precomposed styles
 */
function createTheme(use256 = true) {
  const sb = contextual.statusbar;

  return {
    name: use256 ? 'default' : 'basic',

    // Brand styles
    brand: {
      icon: buildStyle(sb.brandIcon, use256),
      text: buildStyle(sb.brandText, use256),
    },

    // Progress bar stages
    status: {
      healthy: buildStyle(sb.stageHealthy, use256),
      caution: buildStyle(sb.stageCaution, use256),
      urgent: buildStyle(sb.stageUrgent, use256),
      critical: buildStyle(sb.stageCritical, use256),
    },

    // Text styles
    text: {
      muted: buildStyle(sb.model, use256),
      separator: buildStyle(sb.separator, use256),
      notice: buildStyle(sb.updateNotice, use256),
    },

    // Convenience: reset code
    reset: Style.reset(),
  };
}

// Prebuilt themes
const themes = {
  default: null,  // Lazy-loaded based on terminal capability
  basic: null,
};

/**
 * Get theme by name (lazy initialization)
 * @param {string} name - Theme name ('default' or 'basic')
 * @returns {object} Theme object
 */
function getTheme(name = 'default') {
  // Auto-detect: use 256-color if supported, otherwise basic
  if (name === 'default' || name === 'auto') {
    const use256 = supports256Color();
    if (!themes.default) {
      themes.default = createTheme(use256);
    }
    return themes.default;
  }

  if (name === 'basic') {
    if (!themes.basic) {
      themes.basic = createTheme(false);
    }
    return themes.basic;
  }

  return getTheme('default');
}

module.exports = { getTheme, supports256Color, createTheme };

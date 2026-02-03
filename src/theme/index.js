/**
 * GSD Theme System
 *
 * Centralized theme management using Style Composer pattern.
 *
 * Quick Start:
 *   const { getTheme } = require('./src/theme');
 *   const theme = getTheme();
 *   theme.brand.icon.render('[GSD]');
 *   theme.status.caution.render('67%');
 *
 * Architecture:
 *   Style.js   - Fluent ANSI style composition (Charm.sh pattern)
 *   tokens.js  - Design tokens: primitives -> semantic -> contextual
 *   themes.js  - Precomposed theme objects with all styles
 *   index.js   - Public API (this file)
 */

const { Style, SGR, FG_BASIC, BG_BASIC } = require('./Style');
const { primitives, semantic, contextual } = require('./tokens');
const { getTheme, supports256Color, createTheme } = require('./themes');

module.exports = {
  // Primary API
  getTheme,

  // Style composition (for custom styles)
  Style,

  // Token access (for extensions)
  tokens: { primitives, semantic, contextual },

  // Utilities
  supports256Color,
  createTheme,

  // Low-level (rarely needed)
  SGR,
  FG_BASIC,
  BG_BASIC,
};

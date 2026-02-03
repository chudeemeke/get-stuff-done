/**
 * Design Tokens - Three-layer abstraction for colors
 *
 * Layer 1: Primitives - Raw values (never use directly in components)
 * Layer 2: Semantic - Meaningful names (use in general code)
 * Layer 3: Contextual - Component-specific (use in specific contexts)
 *
 * Philosophy: Change a semantic token, update everywhere.
 */

const { Style } = require('./Style');

// =============================================================================
// Layer 1: Primitives
// Raw color values - NEVER use these directly in components
// =============================================================================

const primitives = {
  // Basic colors
  black: 'black',
  white: 'white',

  // Brand colors
  cyan: 'cyan',

  // Status colors (basic ANSI)
  green: 'green',
  yellow: 'yellow',
  red: 'red',

  // Extended colors (256-color palette)
  amber: 214,        // Warm warning - between yellow and orange
  orange: 208,       // Bright orange
  darkOrange: 166,   // Muted orange
};

// =============================================================================
// Layer 2: Semantic Tokens
// Meaningful names - use these in general application code
// =============================================================================

const semantic = {
  // Brand identity
  brand: primitives.cyan,

  // Status indicators (traffic light pattern)
  success: primitives.green,
  warning: primitives.amber,    // 256-color amber for better visibility
  warningFallback: primitives.yellow,  // Basic ANSI fallback
  danger: primitives.red,

  // Text hierarchy
  textPrimary: primitives.white,
  textMuted: 'dim',  // Special: uses dim modifier, not color

  // UI elements
  separator: primitives.white,
};

// =============================================================================
// Layer 3: Contextual Tokens
// Component-specific mappings - use in specific UI contexts
// =============================================================================

const contextual = {
  statusbar: {
    // Brand display
    brandIcon: { color: semantic.brand, modifiers: ['bold'] },
    brandText: { color: semantic.brand, modifiers: [] },

    // Progress stages (maps to 4-stage system from CONTEXT.md)
    stageHealthy: { color: semantic.success, modifiers: [] },
    stageCaution: { color: semantic.warning, modifiers: [], fallback: semantic.warningFallback },
    stageUrgent: { color: semantic.danger, modifiers: [] },
    stageCritical: { color: semantic.danger, modifiers: ['reverse'] },

    // Text elements
    model: { color: null, modifiers: ['dim'] },
    cwd: { color: null, modifiers: ['dim'] },
    separator: { color: semantic.separator, modifiers: [] },

    // Notifications
    updateNotice: { color: null, modifiers: ['dim'] },
  },
};

module.exports = { primitives, semantic, contextual };

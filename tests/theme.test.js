/**
 * Unit Tests: Theme Module
 *
 * Tests Style class, theme definitions, and design tokens:
 * - Style: fluent ANSI composition, chaining, rendering
 * - themes: getTheme, createTheme, 256-color detection
 * - tokens: primitives, semantic, contextual structure
 */

const { describe, test, expect } = require('bun:test');
const { Style, SGR, FG_BASIC, BG_BASIC } = require('../overlay/src/theme/Style');
const { getTheme, supports256Color, createTheme } = require('../overlay/src/theme/themes');
const { primitives, semantic, contextual } = require('../overlay/src/theme/tokens');

describe('Style', () => {
  describe('construction and chaining', () => {
    test('new Style() creates instance', () => {
      const style = new Style();
      expect(style).toBeInstanceOf(Style);
    });

    test('bold() returns Style instance', () => {
      const style = new Style().bold();
      expect(style).toBeInstanceOf(Style);
    });

    test('fg() returns Style instance', () => {
      const style = new Style().fg('red');
      expect(style).toBeInstanceOf(Style);
    });

    test('bg() returns Style instance', () => {
      const style = new Style().bg('blue');
      expect(style).toBeInstanceOf(Style);
    });

    test('chaining multiple styles works', () => {
      const style = new Style().bold().fg('cyan').bg('black');
      expect(style).toBeInstanceOf(Style);
    });

    test('chained styles are immutable (new instance each time)', () => {
      const base = new Style();
      const bold = base.bold();
      const boldRed = bold.fg('red');

      expect(base).not.toBe(bold);
      expect(bold).not.toBe(boldRed);
    });
  });

  describe('foreground colors', () => {
    test('fg() with basic color name sets foreground', () => {
      const style = new Style().fg('red');
      const output = style.render('text');
      expect(output).toContain('\x1b[31m'); // Red FG code
    });

    test('fg() with 256-color number sets foreground', () => {
      const style = new Style().fg(214);
      const output = style.render('text');
      expect(output).toContain('\x1b[38;5;214m');
    });

    test('fg() with invalid color returns unchanged style', () => {
      const style = new Style().fg('invalid-color');
      const output = style.render('text');
      expect(output).toBe('text'); // No codes applied
    });
  });

  describe('background colors', () => {
    test('bg() with basic color name sets background', () => {
      const style = new Style().bg('blue');
      const output = style.render('text');
      expect(output).toContain('\x1b[44m'); // Blue BG code
    });

    test('bg() with 256-color number sets background', () => {
      const style = new Style().bg(208);
      const output = style.render('text');
      expect(output).toContain('\x1b[48;5;208m');
    });

    test('bg() with invalid color returns unchanged style', () => {
      const style = new Style().bg('invalid-color');
      const output = style.render('text');
      expect(output).toBe('text');
    });
  });

  describe('text decorations', () => {
    test('bold() applies bold modifier', () => {
      const style = new Style().bold();
      const output = style.render('text');
      expect(output).toContain('\x1b[1m');
    });

    test('dim() applies dim modifier', () => {
      const style = new Style().dim();
      const output = style.render('text');
      expect(output).toContain('\x1b[2m');
    });

    test('italic() applies italic modifier', () => {
      const style = new Style().italic();
      const output = style.render('text');
      expect(output).toContain('\x1b[3m');
    });

    test('underline() applies underline modifier', () => {
      const style = new Style().underline();
      const output = style.render('text');
      expect(output).toContain('\x1b[4m');
    });

    test('reverse() applies reverse modifier', () => {
      const style = new Style().reverse();
      const output = style.render('text');
      expect(output).toContain('\x1b[7m');
    });

    test('strikethrough() applies strikethrough modifier', () => {
      const style = new Style().strikethrough();
      const output = style.render('text');
      expect(output).toContain('\x1b[9m');
    });
  });

  describe('render()', () => {
    test('render() wraps text in ANSI codes and reset', () => {
      const style = new Style().fg('cyan');
      const output = style.render('test');
      expect(output).toBe('\x1b[36mtest\x1b[0m');
    });

    test('render() on empty style returns plain text', () => {
      const style = new Style();
      const output = style.render('test');
      expect(output).toBe('test');
    });

    test('render() with multiple styles combines codes', () => {
      const style = new Style().bold().fg('red');
      const output = style.render('test');
      expect(output).toContain('\x1b[1;31m'); // Bold and red combined
      expect(output).toContain('test');
      expect(output).toContain('\x1b[0m'); // Reset at end
    });

    test('render() handles empty string', () => {
      const style = new Style().fg('cyan');
      const output = style.render('');
      expect(output).toBe('\x1b[36m\x1b[0m');
    });
  });

  describe('build()', () => {
    test('build() returns ANSI escape codes without text', () => {
      const style = new Style().fg('cyan');
      const codes = style.build();
      expect(codes).toBe('\x1b[36m');
    });

    test('build() on empty style returns empty string', () => {
      const style = new Style();
      const codes = style.build();
      expect(codes).toBe('');
    });

    test('build() combines multiple codes with semicolons', () => {
      const style = new Style().bold().fg('red');
      const codes = style.build();
      expect(codes).toBe('\x1b[1;31m');
    });
  });

  describe('static methods', () => {
    test('Style.reset() returns ANSI reset sequence', () => {
      expect(Style.reset()).toBe('\x1b[0m');
    });
  });

  describe('exports', () => {
    test('SGR export is object with expected keys', () => {
      expect(SGR).toHaveProperty('reset', 0);
      expect(SGR).toHaveProperty('bold', 1);
      expect(SGR).toHaveProperty('dim', 2);
      expect(SGR).toHaveProperty('italic', 3);
      expect(SGR).toHaveProperty('underline', 4);
    });

    test('FG_BASIC export is object with expected keys', () => {
      expect(FG_BASIC).toHaveProperty('black', 30);
      expect(FG_BASIC).toHaveProperty('red', 31);
      expect(FG_BASIC).toHaveProperty('green', 32);
      expect(FG_BASIC).toHaveProperty('yellow', 33);
      expect(FG_BASIC).toHaveProperty('cyan', 36);
    });

    test('BG_BASIC export is object with expected keys', () => {
      expect(BG_BASIC).toHaveProperty('black', 40);
      expect(BG_BASIC).toHaveProperty('red', 41);
      expect(BG_BASIC).toHaveProperty('green', 42);
      expect(BG_BASIC).toHaveProperty('blue', 44);
    });
  });
});

describe('themes', () => {
  describe('supports256Color()', () => {
    test('returns a boolean', () => {
      const result = supports256Color();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('createTheme()', () => {
    test('returns theme object with expected structure', () => {
      const theme = createTheme(true);
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('brand');
      expect(theme).toHaveProperty('status');
      expect(theme).toHaveProperty('text');
      expect(theme).toHaveProperty('reset');
    });

    test('theme.brand has icon and text styles', () => {
      const theme = createTheme(true);
      expect(theme.brand).toHaveProperty('icon');
      expect(theme.brand).toHaveProperty('text');
      expect(theme.brand.icon).toBeInstanceOf(Style);
      expect(theme.brand.text).toBeInstanceOf(Style);
    });

    test('theme.status has health stage styles', () => {
      const theme = createTheme(true);
      expect(theme.status).toHaveProperty('healthy');
      expect(theme.status).toHaveProperty('caution');
      expect(theme.status).toHaveProperty('urgent');
      expect(theme.status).toHaveProperty('critical');
      expect(theme.status.healthy).toBeInstanceOf(Style);
    });

    test('theme.text has muted, separator, notice styles', () => {
      const theme = createTheme(true);
      expect(theme.text).toHaveProperty('muted');
      expect(theme.text).toHaveProperty('separator');
      expect(theme.text).toHaveProperty('notice');
    });

    test('createTheme(true) creates default theme with 256-color', () => {
      const theme = createTheme(true);
      expect(theme.name).toBe('default');
    });

    test('createTheme(false) creates basic theme without 256-color', () => {
      const theme = createTheme(false);
      expect(theme.name).toBe('basic');
    });

    test('theme.reset is ANSI reset code', () => {
      const theme = createTheme(true);
      expect(theme.reset).toBe('\x1b[0m');
    });
  });

  describe('getTheme()', () => {
    test('getTheme() returns a theme object', () => {
      const theme = getTheme();
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('brand');
      expect(theme).toHaveProperty('status');
    });

    test('getTheme("default") returns default theme', () => {
      const theme = getTheme('default');
      expect(theme.name).toMatch(/default|basic/); // Depends on terminal capability
    });

    test('getTheme("basic") returns basic theme', () => {
      const theme = getTheme('basic');
      expect(theme.name).toBe('basic');
    });

    test('getTheme("auto") returns auto-detected theme', () => {
      const theme = getTheme('auto');
      expect(theme.name).toMatch(/default|basic/);
    });

    test('getTheme(unknown) falls back to default', () => {
      const theme = getTheme('unknown-theme');
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('brand');
    });

    test('repeated calls to getTheme() return cached theme', () => {
      const first = getTheme('default');
      const second = getTheme('default');
      // Same object reference due to caching
      expect(first).toBe(second);
    });
  });

  describe('theme styles are functional', () => {
    test('brand.icon.render() produces styled output', () => {
      const theme = getTheme();
      const output = theme.brand.icon.render('[GSD]');
      expect(output).toContain('[GSD]');
      expect(output).toContain('\x1b['); // Has ANSI codes
    });

    test('status.healthy.render() produces styled output', () => {
      const theme = getTheme();
      const output = theme.status.healthy.render('OK');
      expect(output).toContain('OK');
    });

    test('text.muted.render() produces styled output', () => {
      const theme = getTheme();
      const output = theme.text.muted.render('muted');
      expect(output).toContain('muted');
    });
  });
});

describe('tokens', () => {
  describe('primitives', () => {
    test('primitives export is an object', () => {
      expect(typeof primitives).toBe('object');
    });

    test('primitives has basic colors', () => {
      expect(primitives).toHaveProperty('black');
      expect(primitives).toHaveProperty('white');
      expect(primitives).toHaveProperty('cyan');
      expect(primitives).toHaveProperty('green');
      expect(primitives).toHaveProperty('yellow');
      expect(primitives).toHaveProperty('red');
    });

    test('primitives has 256-color values', () => {
      expect(primitives).toHaveProperty('amber');
      expect(primitives).toHaveProperty('orange');
      expect(typeof primitives.amber).toBe('number');
      expect(typeof primitives.orange).toBe('number');
    });

    test('256-color values are in valid range (0-255)', () => {
      expect(primitives.amber).toBeGreaterThanOrEqual(0);
      expect(primitives.amber).toBeLessThanOrEqual(255);
      expect(primitives.orange).toBeGreaterThanOrEqual(0);
      expect(primitives.orange).toBeLessThanOrEqual(255);
    });
  });

  describe('semantic', () => {
    test('semantic export is an object', () => {
      expect(typeof semantic).toBe('object');
    });

    test('semantic has brand color', () => {
      expect(semantic).toHaveProperty('brand');
      expect(typeof semantic.brand).toBe('string');
    });

    test('semantic has status colors', () => {
      expect(semantic).toHaveProperty('success');
      expect(semantic).toHaveProperty('warning');
      expect(semantic).toHaveProperty('danger');
    });

    test('semantic has text hierarchy', () => {
      expect(semantic).toHaveProperty('textPrimary');
      expect(semantic).toHaveProperty('textMuted');
    });

    test('semantic colors map to primitives or modifiers', () => {
      // Brand should map to a primitive
      expect(semantic.brand).toBe(primitives.cyan);
      // Success should map to a primitive
      expect(semantic.success).toBe(primitives.green);
    });
  });

  describe('contextual', () => {
    test('contextual export is an object', () => {
      expect(typeof contextual).toBe('object');
    });

    test('contextual has statusbar section', () => {
      expect(contextual).toHaveProperty('statusbar');
      expect(typeof contextual.statusbar).toBe('object');
    });

    test('statusbar has brand elements', () => {
      expect(contextual.statusbar).toHaveProperty('brandIcon');
      expect(contextual.statusbar).toHaveProperty('brandText');
    });

    test('statusbar has progress stage elements', () => {
      expect(contextual.statusbar).toHaveProperty('stageHealthy');
      expect(contextual.statusbar).toHaveProperty('stageCaution');
      expect(contextual.statusbar).toHaveProperty('stageUrgent');
      expect(contextual.statusbar).toHaveProperty('stageCritical');
    });

    test('statusbar token definitions have color and modifiers', () => {
      const brandIcon = contextual.statusbar.brandIcon;
      expect(brandIcon).toHaveProperty('color');
      expect(brandIcon).toHaveProperty('modifiers');
      expect(Array.isArray(brandIcon.modifiers)).toBe(true);
    });

    test('modifier arrays contain valid modifier names', () => {
      const brandIcon = contextual.statusbar.brandIcon;
      const validModifiers = ['bold', 'dim', 'italic', 'underline', 'reverse', 'strikethrough'];
      for (const mod of brandIcon.modifiers) {
        expect(validModifiers).toContain(mod);
      }
    });
  });

  describe('three-layer abstraction', () => {
    test('semantic tokens reference primitives', () => {
      // Verify semantic layer references primitive layer
      expect(semantic.brand).toBe(primitives.cyan);
      expect(semantic.success).toBe(primitives.green);
      expect(semantic.danger).toBe(primitives.red);
    });

    test('contextual tokens reference semantic tokens', () => {
      // Verify contextual layer uses semantic values
      const brandIcon = contextual.statusbar.brandIcon;
      expect(brandIcon.color).toBe(semantic.brand);
    });

    test('changing semantic token affects contextual tokens', () => {
      // This is a design verification test
      // If semantic.brand changes, contextual.statusbar.brandIcon should reflect it
      const brandIconColor = contextual.statusbar.brandIcon.color;
      expect(brandIconColor).toBe(semantic.brand);
    });
  });
});

describe('Style - coverage gap closure', () => {
  test('blink() applies SGR blink code', () => {
    const style = new Style().blink();
    const output = style.build();
    expect(output).toBe('\x1b[5m');
  });

  test('blink() can be chained with other styles', () => {
    const style = new Style().bold().blink().fg('red');
    const output = style.render('text');
    expect(output).toContain('\x1b[1;5;31m');
    expect(output).toContain('text');
  });

  test('hidden() applies SGR hidden code', () => {
    const style = new Style().hidden();
    const output = style.build();
    expect(output).toBe('\x1b[8m');
  });

  test('hidden() can be chained with other styles', () => {
    const style = new Style().hidden().fg('cyan');
    const output = style.render('secret');
    expect(output).toContain('\x1b[8;36m');
    expect(output).toContain('secret');
  });
});

describe('themes - coverage gap closure', () => {
  /**
   * Helper to clean color-related env vars for theme tests
   */
  function cleanColorEnv() {
    const saved = {};
    const clearVars = ['COLORTERM', 'TERM', 'WT_SESSION', 'TERM_PROGRAM', 'ConEmuTask'];
    clearVars.forEach(v => {
      saved[v] = process.env[v];
      delete process.env[v];
    });

    return () => {
      clearVars.forEach(v => {
        if (saved[v] !== undefined) {
          process.env[v] = saved[v];
        } else {
          delete process.env[v];
        }
      });
    };
  }

  describe('supports256Color() detection', () => {
    test('returns true when COLORTERM=truecolor', () => {
      const restore = cleanColorEnv();
      process.env.COLORTERM = 'truecolor';

      const result = supports256Color();
      expect(result).toBe(true);

      restore();
    });

    test('returns true when COLORTERM=256color', () => {
      const restore = cleanColorEnv();
      process.env.COLORTERM = '256color';

      const result = supports256Color();
      expect(result).toBe(true);

      restore();
    });

    test('returns true when TERM includes 256color', () => {
      const restore = cleanColorEnv();
      process.env.TERM = 'xterm-256color';

      const result = supports256Color();
      expect(result).toBe(true);

      restore();
    });

    test('returns true when WT_SESSION is set', () => {
      const restore = cleanColorEnv();
      process.env.WT_SESSION = 'some-session-id';

      const result = supports256Color();
      expect(result).toBe(true);

      restore();
    });

    test('returns true when TERM_PROGRAM=vscode', () => {
      const restore = cleanColorEnv();
      process.env.TERM_PROGRAM = 'vscode';

      const result = supports256Color();
      expect(result).toBe(true);

      restore();
    });

    test('returns true when ConEmuTask is set', () => {
      const restore = cleanColorEnv();
      process.env.ConEmuTask = '{cmd::Cmd}';

      const result = supports256Color();
      expect(result).toBe(true);

      restore();
    });

    test('returns false when no 256-color indicators present', () => {
      const restore = cleanColorEnv();
      process.env.TERM = 'xterm';

      const result = supports256Color();
      expect(result).toBe(false);

      restore();
    });
  });
});

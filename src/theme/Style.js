/**
 * Style - Fluent ANSI style composition
 *
 * Inspired by Charm.sh Lip Gloss (Go) and Rich (Python).
 * Provides composable, chainable style building for terminal output.
 *
 * @example
 * const style = new Style().fg('cyan').bold();
 * style.render('[GSD]');  // Returns: \x1b[36m\x1b[1m[GSD]\x1b[0m
 */

// ANSI SGR (Select Graphic Rendition) codes
const SGR = {
  reset: 0,
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  blink: 5,
  reverse: 7,
  hidden: 8,
  strikethrough: 9,
};

// Basic ANSI colors (foreground)
const FG_BASIC = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
};

// Basic ANSI colors (background)
const BG_BASIC = {
  black: 40,
  red: 41,
  green: 42,
  yellow: 43,
  blue: 44,
  magenta: 45,
  cyan: 46,
  white: 47,
};

class Style {
  constructor(codes = []) {
    this._codes = [...codes];
  }

  // --- Foreground colors ---

  fg(color) {
    if (typeof color === 'number') {
      // 256-color mode: \x1b[38;5;Nm
      return new Style([...this._codes, `38;5;${color}`]);
    }
    // eslint-disable-next-line security/detect-object-injection -- color from theme config, trusted lookup table access
    if (FG_BASIC[color] !== undefined) {
      // eslint-disable-next-line security/detect-object-injection -- color from theme config, trusted lookup table access
      return new Style([...this._codes, FG_BASIC[color]]);
    }
    return this;
  }

  // --- Background colors ---

  bg(color) {
    if (typeof color === 'number') {
      // 256-color mode: \x1b[48;5;Nm
      return new Style([...this._codes, `48;5;${color}`]);
    }
    // eslint-disable-next-line security/detect-object-injection -- color from theme config, trusted lookup table access
    if (BG_BASIC[color] !== undefined) {
      // eslint-disable-next-line security/detect-object-injection -- color from theme config, trusted lookup table access
      return new Style([...this._codes, BG_BASIC[color]]);
    }
    return this;
  }

  // --- Text decorations ---

  bold() { return new Style([...this._codes, SGR.bold]); }
  dim() { return new Style([...this._codes, SGR.dim]); }
  italic() { return new Style([...this._codes, SGR.italic]); }
  underline() { return new Style([...this._codes, SGR.underline]); }
  blink() { return new Style([...this._codes, SGR.blink]); }
  reverse() { return new Style([...this._codes, SGR.reverse]); }
  hidden() { return new Style([...this._codes, SGR.hidden]); }
  strikethrough() { return new Style([...this._codes, SGR.strikethrough]); }

  // --- Output ---

  /**
   * Build the ANSI escape sequence (without text)
   * @returns {string} ANSI escape codes
   */
  build() {
    if (this._codes.length === 0) return '';
    return `\x1b[${this._codes.join(';')}m`;
  }

  /**
   * Render text with this style
   * @param {string} text - Text to style
   * @returns {string} Styled text with reset at end
   */
  render(text) {
    if (this._codes.length === 0) return text;
    return `${this.build()}${text}\x1b[0m`;
  }

  /**
   * Get the reset code
   * @returns {string} ANSI reset sequence
   */
  static reset() {
    return '\x1b[0m';
  }
}

module.exports = { Style, SGR, FG_BASIC, BG_BASIC };

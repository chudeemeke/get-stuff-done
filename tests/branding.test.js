/**
 * Phase 30 Plan 01 -- Branding Engine Tests
 *
 * Tests for the branding engine in scripts/compose.js.
 * Covers requirements BRAND-01 through BRAND-06.
 *
 * BRAND-01: Substitutions apply to user-visible text in upstream files
 * BRAND-02: Internal directory names (get-shit-done/) are never altered
 * BRAND-03: Code paths, import statements, config keys, markers are preserved
 * BRAND-04: Substitution ordering prevents double-replace artifacts
 * BRAND-05: LICENSE is preserved; CREDITS.md generated when preserveUpstreamCredit is true
 * BRAND-06: Invalid branding.json is rejected before any substitutions run
 */

const { describe, test, expect, beforeAll } = require('bun:test');
const fs = require('fs');
const path = require('path');

const {
  applyBrandingToContent,
  validateBrandingConfig,
  sortSubstitutions,
  shouldBrandFile,
  generateCredits,
} = require('../scripts/compose');

// Path to the upstream package installed as devDependency
const UPSTREAM_PKG = path.join(__dirname, '..', 'node_modules', 'get-shit-done-cc');
const UPSTREAM_INSTALL_JS = path.join(UPSTREAM_PKG, 'bin', 'install.js');

// Standard 3-rule substitution set matching overlay/branding.json
const STANDARD_SUBSTITUTIONS = [
  { from: 'get-shit-done-cc', to: '@chude/get-stuff-done', scope: 'text', note: 'npm package name' },
  { from: 'glittercowboy/get-shit-done', to: 'chudeemeke/get-stuff-done', scope: 'text', note: 'GitHub repo' },
  { from: 'TACHES', to: 'Chude Emeke', scope: 'text', note: 'Author attribution' },
];

describe('branding engine', () => {
  // -------------------------------------------------------------------------
  // applyBrandingToContent
  // -------------------------------------------------------------------------
  describe('applyBrandingToContent', () => {
    test('substitutes get-shit-done-cc with @chude/get-stuff-done (BRAND-01)', () => {
      const content = 'Install via: npx get-shit-done-cc\nPackage: get-shit-done-cc';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('@chude/get-stuff-done');
      expect(result).not.toContain('get-shit-done-cc');
    });

    test('substitutes glittercowboy/get-shit-done with chudeemeke/get-stuff-done (BRAND-01)', () => {
      const content = 'See https://github.com/glittercowboy/get-shit-done for details';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('chudeemeke/get-stuff-done');
      expect(result).not.toContain('glittercowboy/get-shit-done');
    });

    test('substitutes TACHES with Chude Emeke using word-boundary matching (BRAND-01, BRAND-04)', () => {
      const content = 'Created by TACHES. Contact TACHES for support.';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('Chude Emeke');
      expect(result).not.toContain('TACHES');
    });

    test('does NOT replace bare get-shit-done (without -cc suffix) (BRAND-02)', () => {
      const content = 'const dir = path.join(configDir, "get-shit-done");\nconst src = "get-shit-done";';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      // bare 'get-shit-done' must remain unchanged
      expect(result).toContain('"get-shit-done"');
      expect(result).not.toContain('get-stuff-done');
    });

    test('preserves internal directory name get-shit-done/ in path strings (BRAND-02)', () => {
      const content = [
        'const gsdDir = path.join(targetDir, "get-shit-done");',
        'const skillDest = path.join(targetDir, "get-shit-done");',
        'manifest.files["get-shit-done/" + rel] = hash;',
      ].join('\n');
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('"get-shit-done"');
      expect(result).toContain('"get-shit-done/"');
    });

    test('does not modify import statements containing get-shit-done paths (BRAND-03)', () => {
      // Import paths use the internal directory name, not the npm package name
      const content = 'const util = require("./get-shit-done/util");\nconst x = require("./get-shit-done/core");';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('"./get-shit-done/util"');
      expect(result).toContain('"./get-shit-done/core"');
    });

    test('preserves GSD_CODEX_MARKER string unchanged (BRAND-03)', () => {
      const content = 'const GSD_CODEX_MARKER = "# GSD Agent Configuration";\nif (line.includes(GSD_CODEX_MARKER)) {';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('GSD_CODEX_MARKER');
      expect(result).toContain('const GSD_CODEX_MARKER = "# GSD Agent Configuration"');
    });

    test('preserves GSD_COPILOT_INSTRUCTIONS_MARKER string unchanged (BRAND-03)', () => {
      const content = 'const GSD_COPILOT_INSTRUCTIONS_MARKER = "<!-- GSD Configuration";\nif (line.includes(GSD_COPILOT_INSTRUCTIONS_MARKER)) {';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('GSD_COPILOT_INSTRUCTIONS_MARKER');
      expect(result).toContain('const GSD_COPILOT_INSTRUCTIONS_MARKER = "<!-- GSD Configuration"');
    });

    test('applies most-specific patterns first -- no double-replace artifacts (BRAND-04)', () => {
      // glittercowboy/get-shit-done must be processed before get-shit-done-cc
      // so that 'glittercowboy/get-shit-done' does not get partially replaced first
      const content = 'glittercowboy/get-shit-done and get-shit-done-cc both appear here';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('chudeemeke/get-stuff-done');
      expect(result).toContain('@chude/get-stuff-done');
      expect(result).not.toContain('glittercowboy/get-shit-done');
      expect(result).not.toContain('get-shit-done-cc');
      // No double-replace artifacts like 'chudeemeke/get-stuff-done-cc'
      expect(result).not.toContain('chudeemeke/get-stuff-done-cc');
    });

    test('handles get-shit-done-cc@latest before get-shit-done-cc to avoid corruption (BRAND-04)', () => {
      // When sorted by length descending, 'get-shit-done-cc@latest' (22 chars) comes
      // before 'get-shit-done-cc' (16 chars), so @latest suffix is preserved correctly
      const content = 'Run: npx get-shit-done-cc@latest for the latest version';
      const sorted = sortSubstitutions([
        ...STANDARD_SUBSTITUTIONS,
        { from: 'get-shit-done-cc@latest', to: '@chude/get-stuff-done@latest', scope: 'text', note: 'versioned ref' },
      ]);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toContain('@chude/get-stuff-done@latest');
      expect(result).not.toContain('get-shit-done-cc@latest');
      // Must not produce '@chude/get-stuff-done@latest@latest' (double-replace)
      expect(result).not.toContain('@latest@latest');
    });

    test('returns unchanged content when no substitutions match', () => {
      const content = 'This content has no matching strings.';
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      const result = applyBrandingToContent(content, sorted);
      expect(result).toBe(content);
    });

    test('handles empty content without error', () => {
      const result = applyBrandingToContent('', STANDARD_SUBSTITUTIONS);
      expect(result).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // validateBrandingConfig
  // -------------------------------------------------------------------------
  describe('validateBrandingConfig', () => {
    test('accepts valid branding.json with all required fields (BRAND-06)', () => {
      const config = {
        substitutions: [
          { from: 'get-shit-done-cc', to: '@chude/get-stuff-done', scope: 'text' },
        ],
        preserveUpstreamCredit: true,
      };
      // Should not throw
      expect(() => validateBrandingConfig(config)).not.toThrow();
    });

    test('accepts valid branding.json without optional fields (BRAND-06)', () => {
      const config = {
        substitutions: [
          { from: 'get-shit-done-cc', to: '@chude/get-stuff-done', scope: 'text' },
        ],
      };
      expect(() => validateBrandingConfig(config)).not.toThrow();
    });

    test('rejects branding.json missing substitutions array (BRAND-06)', () => {
      const config = { preserveUpstreamCredit: true };
      expect(() => validateBrandingConfig(config)).toThrow();
    });

    test('rejects branding.json with substitutions that is not an array (BRAND-06)', () => {
      const config = { substitutions: 'get-shit-done-cc' };
      expect(() => validateBrandingConfig(config)).toThrow();
    });

    test('rejects substitution missing required from field (BRAND-06)', () => {
      const config = {
        substitutions: [{ to: '@chude/get-stuff-done', scope: 'text' }],
      };
      expect(() => validateBrandingConfig(config)).toThrow();
    });

    test('rejects substitution missing required to field (BRAND-06)', () => {
      const config = {
        substitutions: [{ from: 'get-shit-done-cc', scope: 'text' }],
      };
      expect(() => validateBrandingConfig(config)).toThrow();
    });

    test('rejects substitution missing required scope field (BRAND-06)', () => {
      const config = {
        substitutions: [{ from: 'get-shit-done-cc', to: '@chude/get-stuff-done' }],
      };
      expect(() => validateBrandingConfig(config)).toThrow();
    });

    test('rejects substitution with invalid scope value not "text" (BRAND-06)', () => {
      const config = {
        substitutions: [{ from: 'get-shit-done-cc', to: '@chude/get-stuff-done', scope: 'all' }],
      };
      expect(() => validateBrandingConfig(config)).toThrow();
    });

    test('rejects branding.json with extra unknown top-level properties (BRAND-06)', () => {
      const config = {
        substitutions: [{ from: 'x', to: 'y', scope: 'text' }],
        unknownField: true,
      };
      expect(() => validateBrandingConfig(config)).toThrow();
    });

    test('rejects substitution with extra unknown properties (BRAND-06)', () => {
      const config = {
        substitutions: [{ from: 'x', to: 'y', scope: 'text', badField: 'oops' }],
      };
      expect(() => validateBrandingConfig(config)).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // sortSubstitutions
  // -------------------------------------------------------------------------
  describe('sortSubstitutions', () => {
    test('sorts substitutions by from-string length descending (BRAND-04)', () => {
      const input = [
        { from: 'TACHES', to: 'Chude Emeke', scope: 'text' },
        { from: 'glittercowboy/get-shit-done', to: 'chudeemeke/get-stuff-done', scope: 'text' },
        { from: 'get-shit-done-cc', to: '@chude/get-stuff-done', scope: 'text' },
      ];
      const sorted = sortSubstitutions(input);
      expect(sorted[0].from).toBe('glittercowboy/get-shit-done'); // longest (26 chars)
      expect(sorted[1].from).toBe('get-shit-done-cc');            // middle (16 chars)
      expect(sorted[2].from).toBe('TACHES');                      // shortest (6 chars)
    });

    test('does not mutate the original array', () => {
      const input = [
        { from: 'TACHES', to: 'Chude Emeke', scope: 'text' },
        { from: 'get-shit-done-cc', to: '@chude/get-stuff-done', scope: 'text' },
      ];
      const original = [...input];
      sortSubstitutions(input);
      expect(input[0].from).toBe(original[0].from);
      expect(input[1].from).toBe(original[1].from);
    });

    test('handles single-item array without error', () => {
      const input = [{ from: 'x', to: 'y', scope: 'text' }];
      const sorted = sortSubstitutions(input);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].from).toBe('x');
    });

    test('handles empty array without error', () => {
      const sorted = sortSubstitutions([]);
      expect(sorted).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // shouldBrandFile
  // -------------------------------------------------------------------------
  describe('shouldBrandFile', () => {
    test('returns true for upstream JS files (BRAND-01)', () => {
      expect(shouldBrandFile('bin/install.js')).toBe(true);
      expect(shouldBrandFile('get-shit-done/hooks/some-hook.js')).toBe(true);
    });

    test('returns true for upstream markdown files (BRAND-01)', () => {
      expect(shouldBrandFile('README.md')).toBe(true);
      expect(shouldBrandFile('commands/gsd/some-command.md')).toBe(true);
    });

    test('returns true for upstream JSON files (BRAND-01)', () => {
      expect(shouldBrandFile('package.json')).toBe(true);
      expect(shouldBrandFile('config/settings.json')).toBe(true);
    });

    test('returns false for binary image files (BRAND-01)', () => {
      expect(shouldBrandFile('assets/logo.png')).toBe(false);
      expect(shouldBrandFile('assets/icon.svg')).toBe(false);
      expect(shouldBrandFile('assets/animation.gif')).toBe(false);
      expect(shouldBrandFile('assets/icon.ico')).toBe(false);
    });

    test('returns false for binary font files (BRAND-01)', () => {
      expect(shouldBrandFile('fonts/font.woff')).toBe(false);
      expect(shouldBrandFile('fonts/font.woff2')).toBe(false);
      expect(shouldBrandFile('fonts/font.ttf')).toBe(false);
      expect(shouldBrandFile('fonts/font.eot')).toBe(false);
    });

    test('returns false for files in overlay/ directory (BRAND-01)', () => {
      expect(shouldBrandFile('overlay/branding.json')).toBe(false);
      expect(shouldBrandFile('overlay/features.json')).toBe(false);
      expect(shouldBrandFile('overlay/.gitkeep')).toBe(false);
    });

    test('returns false for files in overrides/ directory (BRAND-01)', () => {
      expect(shouldBrandFile('overrides/commands/gsd/custom.md')).toBe(false);
      expect(shouldBrandFile('overrides/.gitkeep')).toBe(false);
    });

    test('returns false for LICENSE file -- preserve upstream credit (BRAND-05)', () => {
      expect(shouldBrandFile('LICENSE')).toBe(false);
    });

    test('returns false for LICENSE regardless of case (BRAND-05)', () => {
      expect(shouldBrandFile('license')).toBe(false);
      expect(shouldBrandFile('License')).toBe(false);
      expect(shouldBrandFile('LICENSE.md')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // generateCredits
  // -------------------------------------------------------------------------
  describe('generateCredits', () => {
    test('generates CREDITS.md content when preserveUpstreamCredit is true (BRAND-05)', () => {
      const result = generateCredits(true);
      expect(result).not.toBeNull();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Must reference the original project
      expect(result).toContain('glittercowboy/get-shit-done');
      // Must reference TACHES (the original author)
      expect(result).toContain('TACHES');
    });

    test('returns null when preserveUpstreamCredit is false (BRAND-05)', () => {
      const result = generateCredits(false);
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Integration: real upstream install.js
  // -------------------------------------------------------------------------
  describe('integration: real upstream install.js branding', () => {
    let rawContent;
    let brandedContent;

    beforeAll(() => {
      rawContent = fs.readFileSync(UPSTREAM_INSTALL_JS, 'utf-8');
      const sorted = sortSubstitutions(STANDARD_SUBSTITUTIONS);
      brandedContent = applyBrandingToContent(rawContent, sorted);
    });

    test('branded install.js has zero get-shit-done-cc occurrences (BRAND-01)', () => {
      const remaining = (brandedContent.match(/get-shit-done-cc/g) || []).length;
      expect(remaining).toBe(0);
    });

    test('branded install.js retains all bare get-shit-done path references (BRAND-02, BRAND-03)', () => {
      // Count bare 'get-shit-done' in the raw file (not followed by -cc)
      const rawBare = (rawContent.match(/get-shit-done(?!-cc)/g) || []).length;
      const brandedBare = (brandedContent.match(/get-shit-done(?!-cc)/g) || []).length;

      // All bare references must be preserved -- none should be replaced
      expect(brandedBare).toBe(rawBare);
      // There must be a substantial number (the internal directory name is used pervasively)
      expect(brandedBare).toBeGreaterThan(10);
    });

    test('branded install.js preserves GSD_CODEX_MARKER (BRAND-03)', () => {
      const rawCount = (rawContent.match(/GSD_CODEX_MARKER/g) || []).length;
      const brandedCount = (brandedContent.match(/GSD_CODEX_MARKER/g) || []).length;
      expect(brandedCount).toBe(rawCount);
      expect(brandedCount).toBeGreaterThan(0);
    });

    test('branded install.js preserves GSD_COPILOT_INSTRUCTIONS_MARKER (BRAND-03)', () => {
      const rawCount = (rawContent.match(/GSD_COPILOT_INSTRUCTIONS_MARKER/g) || []).length;
      const brandedCount = (brandedContent.match(/GSD_COPILOT_INSTRUCTIONS_MARKER/g) || []).length;
      expect(brandedCount).toBe(rawCount);
      expect(brandedCount).toBeGreaterThan(0);
    });
  });
});

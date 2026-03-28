'use strict';

/**
 * scripts/compose.js -- Composition Pipeline
 *
 * Phase 30: Branding engine functions exported for use by tests and the
 * full pipeline (to be built in Plan 02).
 *
 * Branding engine design:
 * - Substitutions are literal string replacements (not regex patterns)
 * - scope: "text" only -- never "all" (deprecated)
 * - sortSubstitutions() must be called before applyBrandingToContent()
 *   to ensure longest patterns match first (prevents double-replace artifacts)
 * - Short, all-caps tokens (e.g. TACHES) use word-boundary regex to prevent
 *   partial-word corruption; all others use String.prototype.replaceAll()
 * - Binary file detection uses file extension only (no content sniffing)
 * - overlay/ and overrides/ paths are never branded (fork-owned content)
 * - LICENSE is never modified (upstream credit preservation, BRAND-05)
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

// ---------------------------------------------------------------------------
// JSON Schema for branding.json validation (BRAND-06)
// ---------------------------------------------------------------------------
const BRANDING_SCHEMA = {
  type: 'object',
  required: ['substitutions'],
  additionalProperties: false,
  properties: {
    substitutions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['from', 'to', 'scope'],
        additionalProperties: false,
        properties: {
          from: { type: 'string', minLength: 1 },
          to: { type: 'string', minLength: 1 },
          scope: { type: 'string', enum: ['text'] },
          note: { type: 'string' },
        },
      },
    },
    preserveUpstreamCredit: { type: 'boolean' },
  },
};

// AJV instance with strict mode
const ajv = new Ajv({ allErrors: true, strict: true });
const validateSchema = ajv.compile(BRANDING_SCHEMA);

// ---------------------------------------------------------------------------
// Binary file extensions that must never be text-processed (BRAND-01)
// ---------------------------------------------------------------------------
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.bin', '.exe',
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a branding configuration object against the JSON schema.
 * Throws a descriptive Error if validation fails.
 *
 * @param {object} config - Parsed branding.json content
 * @throws {Error} If config does not match the schema
 */
function validateBrandingConfig(config) {
  const valid = validateSchema(config);
  if (!valid) {
    const errors = validateSchema.errors
      .map(e => `  ${e.instancePath || '(root)'}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid branding configuration:\n${errors}`);
  }
}

/**
 * Sorts substitutions by `from` string length descending.
 * This ensures the most-specific (longest) patterns are applied first,
 * preventing double-replace artifacts (e.g., processing
 * "glittercowboy/get-shit-done" before "get-shit-done-cc" prevents
 * the longer pattern from being corrupted by an earlier shorter match).
 *
 * Does NOT mutate the original array.
 *
 * @param {Array<{from: string, to: string, scope: string}>} substitutions
 * @returns {Array<{from: string, to: string, scope: string}>} Sorted copy
 */
function sortSubstitutions(substitutions) {
  return [...substitutions].sort((a, b) => b.from.length - a.from.length);
}

/**
 * Applies branding substitutions to file content.
 *
 * Substitutions must already be sorted (longest first) before calling.
 * Only substitutions with scope "text" are applied.
 *
 * Algorithm:
 * - Long patterns (>= 8 chars) use String.prototype.replaceAll() for
 *   exact literal replacement -- efficient and collision-free for package
 *   names and URLs.
 * - Short all-caps tokens (< 8 chars and all uppercase) use word-boundary
 *   regex (\b) to prevent replacing substrings inside longer words.
 *
 * @param {string} content - File content as UTF-8 string
 * @param {Array<{from: string, to: string, scope: string}>} sortedSubstitutions
 * @returns {string} Branded content
 */
function applyBrandingToContent(content, sortedSubstitutions) {
  let result = content;

  for (const sub of sortedSubstitutions) {
    if (sub.scope !== 'text') continue;

    const { from, to } = sub;

    // Short all-caps tokens need word-boundary matching to prevent
    // partial-word replacement (e.g., TACHES in a longer word)
    if (from.length < 8 && from === from.toUpperCase() && /^[A-Z]+$/.test(from)) {
      // Escape any regex special chars in the token (unlikely for all-caps but defensive)
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'g');
      result = result.replace(regex, to);
    } else {
      // Standard literal replaceAll -- works for package names and URLs
      result = result.replaceAll(from, to);
    }
  }

  return result;
}

/**
 * Determines whether a file should have branding applied.
 *
 * Returns false for:
 * - Binary file extensions (image, font, archive formats)
 * - Files in overlay/ (fork-owned, never upstream)
 * - Files in overrides/ (fork-owned, never upstream)
 * - LICENSE file (upstream credit preservation, BRAND-05)
 *
 * Returns true for all other files (JS, TS, MD, JSON, YAML, etc.)
 *
 * @param {string} relPath - Relative path from composition root
 * @returns {boolean}
 */
function shouldBrandFile(relPath) {
  const normalised = relPath.replace(/\\/g, '/');

  // Exclude overlay/ and overrides/ directories (fork-owned content)
  if (normalised.startsWith('overlay/') || normalised.startsWith('overrides/')) {
    return false;
  }

  // Exclude LICENSE file (all case variants, with or without extension)
  const baseName = path.basename(normalised);
  if (baseName.toLowerCase() === 'license' || baseName.toLowerCase().startsWith('license.')) {
    return false;
  }

  // Exclude binary extensions
  const ext = path.extname(baseName).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return false;
  }

  return true;
}

/**
 * Generates the content for CREDITS.md when upstream attribution is preserved.
 *
 * @param {boolean} preserveUpstreamCredit
 * @returns {string|null} CREDITS.md content, or null if credit not preserved
 */
function generateCredits(preserveUpstreamCredit) {
  if (!preserveUpstreamCredit) return null;

  return [
    '# Credits',
    '',
    'This software is based on [GSD (Get Shit Done)](https://github.com/glittercowboy/get-shit-done) by TACHES.',
    '',
    'The original GSD system is licensed under the MIT License.',
    'See the LICENSE file for the original license text.',
    '',
    '## Fork',
    '',
    'This distribution is maintained by Chude Emeke.',
    'Repository: https://github.com/chudeemeke/get-stuff-done',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// CLI entry point (when run directly as "node scripts/compose.js")
// ---------------------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const diff = args.includes('--diff');

  // Load and validate branding config
  const brandingPath = path.join(__dirname, '..', 'overlay', 'branding.json');
  if (!fs.existsSync(brandingPath)) {
    process.stderr.write(`Error: overlay/branding.json not found at ${brandingPath}\n`);
    process.exit(1);
  }

  let brandingConfig;
  try {
    brandingConfig = JSON.parse(fs.readFileSync(brandingPath, 'utf-8'));
    validateBrandingConfig(brandingConfig);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }

  if (dryRun) {
    process.stdout.write('DRY RUN -- no files written\n');
    process.stdout.write(`Branding rules loaded: ${brandingConfig.substitutions.length}\n`);
    process.stdout.write('Full composition pipeline: coming in Phase 30 Plan 02\n');
  } else if (diff) {
    process.stdout.write('--diff mode: coming in Phase 30 Plan 02\n');
  } else {
    process.stdout.write('Composition pipeline: coming in Phase 30 Plan 02\n');
    process.stdout.write(`Branding rules loaded: ${brandingConfig.substitutions.length}\n`);
  }
}

module.exports = {
  applyBrandingToContent,
  validateBrandingConfig,
  sortSubstitutions,
  shouldBrandFile,
  generateCredits,
  BRANDING_SCHEMA,
};

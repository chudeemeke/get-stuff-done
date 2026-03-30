'use strict';

/**
 * scripts/compose.js -- Composition Pipeline
 *
 * Phase 30: Full 5-stage composition pipeline + branding engine functions.
 *
 * Pipeline stages:
 *   resolve()  -- Walk upstream + overlay, validate structure, detect collisions
 *   filter()   -- Apply feature flags from features.json (Phase 31: category exclusion)
 *   override() -- Apply file overrides from overrides/ with REASON.md enforcement
 *   brand()    -- Apply surface-only branding substitutions
 *   merge()    -- Write dist/ with clean rebuild + .install-meta.json
 *
 * compose() orchestrates all 5 stages.
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
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_UPSTREAM_DIR = path.join(PROJECT_ROOT, 'node_modules', 'get-shit-done-cc');
const DEFAULT_OVERLAY_DIR = path.join(PROJECT_ROOT, 'overlay');
const DEFAULT_DIST_DIR = path.join(PROJECT_ROOT, 'dist');

// Required top-level entries in the upstream package (COMP-02)
const REQUIRED_UPSTREAM_DIRS = ['agents', 'bin', 'commands', 'get-shit-done', 'hooks', 'scripts'];

// Overlay metadata files that are never treated as additive content
const OVERLAY_METADATA = new Set(['branding.json', 'features.json', '.gitkeep', '.overlay-manifest.json']);

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

// ---------------------------------------------------------------------------
// JSON Schema for features.json validation (FEAT-04)
// ---------------------------------------------------------------------------
const FEATURES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    runtimes: {
      type: 'object',
      additionalProperties: { type: 'boolean' },
    },
    workflows: {
      type: 'object',
      required: ['enabled', 'exclude'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'string', enum: ['all'] },
        exclude: { type: 'array', items: { type: 'string' } },
      },
    },
    commands: {
      type: 'object',
      required: ['enabled', 'exclude'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'string', enum: ['all'] },
        exclude: { type: 'array', items: { type: 'string' } },
      },
    },
    agents: {
      type: 'object',
      required: ['enabled', 'exclude'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'string', enum: ['all'] },
        exclude: { type: 'array', items: { type: 'string' } },
      },
    },
    hooks: {
      type: 'object',
      required: ['enabled', 'exclude'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'string', enum: ['all'] },
        exclude: { type: 'array', items: { type: 'string' } },
      },
    },
    sdk: { type: 'boolean' },
  },
};

// Category-to-directory mapping for filter() basename matching (FEAT-01)
const CATEGORY_DIR_MAP = {
  workflows: 'get-shit-done/workflows/',
  commands:  'commands/gsd/',
  agents:    'agents/',
  hooks:     'hooks/dist/',
};

// AJV instance with strict mode
const ajv = new Ajv({ allErrors: true, strict: true });
const validateSchema = ajv.compile(BRANDING_SCHEMA);
const validateFeaturesSchema = ajv.compile(FEATURES_SCHEMA);

// ---------------------------------------------------------------------------
// Binary file extensions that must never be text-processed (BRAND-01)
// ---------------------------------------------------------------------------
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.bin', '.exe',
]);

// ---------------------------------------------------------------------------
// Branding engine (Plan 01 functions -- kept for export compatibility)
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
 * Validates a features configuration object against the JSON schema.
 * Throws a descriptive Error if validation fails.
 *
 * @param {object} config - Parsed features.json content
 * @throws {Error} If config does not match the schema
 */
function validateFeaturesConfig(config) {
  const valid = validateFeaturesSchema(config);
  if (!valid) {
    const errors = validateFeaturesSchema.errors
      .map(e => `  ${e.instancePath || '(root)'}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid features configuration:\n${errors}`);
  }
}

/**
 * Sorts substitutions by `from` string length descending.
 * This ensures the most-specific (longest) patterns are applied first,
 * preventing double-replace artifacts.
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
 * @param {string} content - File content as UTF-8 string
 * @param {Array<{from: string, to: string, scope: string}>} sortedSubstitutions
 * @returns {string} Branded content
 */
function applyBrandingToContent(content, sortedSubstitutions) {
  let result = content;

  for (const sub of sortedSubstitutions) {
    if (sub.scope !== 'text') continue;

    const { from, to } = sub;

    // Short all-caps tokens need word-boundary matching
    if (from.length < 8 && from === from.toUpperCase() && /^[A-Z]+$/.test(from)) {
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'g');
      result = result.replace(regex, to);
    } else {
      result = result.replaceAll(from, to);
    }
  }

  return result;
}

/**
 * Determines whether a file should have branding applied.
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
// Internal: Walk a directory tree and return relative paths
// ---------------------------------------------------------------------------

/**
 * Walk a directory recursively and return all file relative paths.
 * Paths always use forward slashes (cross-platform).
 *
 * @param {string} dir - Absolute directory path to walk
 * @param {string} [base=''] - Relative base prefix
 * @returns {string[]} Array of forward-slash relative paths
 */
function walkDir(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = base ? base + '/' + entry.name : entry.name;
    if (entry.isSymbolicLink()) {
      // Follow file symlinks (iCloud NTFS reparse points), skip directory symlinks (test junctions)
      let target;
      try { target = fs.statSync(abs); } catch { continue; } // Broken or inaccessible symlink
      if (target.isFile()) { files.push(rel); }
      // Directory symlinks are intentionally skipped
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...walkDir(abs, rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Stage 1: resolve()
// ---------------------------------------------------------------------------

/**
 * Resolves upstream and overlay sources into initial pipeline state.
 *
 * Validates:
 * - Upstream directory exists and has required structure (COMP-02)
 * - overlay/branding.json and overlay/features.json exist (COMP-02)
 * - No overlay file path collides with an upstream file path (COMP-08)
 *
 * Returns pipeline state:
 * - manifest: array of ManifestEntry objects
 * - branding: validated branding config
 * - features: features config
 * - warnings: array of warning strings
 * - meta: partial metadata (upstreamVersion, overlayVersion)
 *
 * @param {object} [opts]
 * @param {string} [opts.upstreamDir] - Path to upstream package
 * @param {string} [opts.overlayDir] - Path to overlay directory
 * @returns {PipelineState}
 * @throws {Error} If validation fails
 */
function resolve(opts) {
  const upstreamDir = (opts && opts.upstreamDir) || DEFAULT_UPSTREAM_DIR;
  const overlayDir = (opts && opts.overlayDir) || DEFAULT_OVERLAY_DIR;

  // Validate upstream directory exists
  if (!fs.existsSync(upstreamDir)) {
    throw new Error(
      `Upstream directory not found: ${upstreamDir}\n` +
      `Hint: run 'bun install' to install upstream, or 'bun run preview-update' to check for updates.`
    );
  }

  // Validate upstream package.json exists
  const upstreamPkgPath = path.join(upstreamDir, 'package.json');
  if (!fs.existsSync(upstreamPkgPath)) {
    throw new Error(
      `Missing upstream package.json at: ${upstreamPkgPath}\n` +
      `Hint: run 'bun install' to reinstall upstream package.`
    );
  }

  // Parse upstream package.json for version
  let upstreamPkg;
  try {
    upstreamPkg = JSON.parse(fs.readFileSync(upstreamPkgPath, 'utf-8'));
  } catch (e) {
    throw new Error(`Failed to parse upstream package.json: ${e.message}`);
  }

  // Validate required upstream directories exist
  const missingDirs = REQUIRED_UPSTREAM_DIRS.filter(
    d => !fs.existsSync(path.join(upstreamDir, d))
  );
  if (missingDirs.length > 0) {
    throw new Error(
      `Upstream package missing required directories: ${missingDirs.join(', ')}\n` +
      `Expected in: ${upstreamDir}\n` +
      `Hint: run 'bun install' to reinstall upstream, or 'bun run preview-update' to diagnose.`
    );
  }

  // Validate overlay/branding.json exists
  const brandingPath = path.join(overlayDir, 'branding.json');
  if (!fs.existsSync(brandingPath)) {
    throw new Error(
      `Missing overlay/branding.json at: ${brandingPath}\n` +
      `Hint: create overlay/branding.json with substitutions configuration.`
    );
  }

  // Validate overlay/features.json exists
  const featuresPath = path.join(overlayDir, 'features.json');
  if (!fs.existsSync(featuresPath)) {
    throw new Error(
      `Missing overlay/features.json at: ${featuresPath}\n` +
      `Hint: create overlay/features.json with feature flag configuration.`
    );
  }

  // Load and validate branding config
  let branding;
  try {
    branding = JSON.parse(fs.readFileSync(brandingPath, 'utf-8'));
    validateBrandingConfig(branding);
  } catch (e) {
    throw new Error(`Invalid overlay/branding.json: ${e.message}`);
  }

  // Load and validate features config (FEAT-04)
  let features;
  try {
    features = JSON.parse(fs.readFileSync(featuresPath, 'utf-8'));
    validateFeaturesConfig(features);
  } catch (e) {
    throw new Error(`Invalid overlay/features.json: ${e.message}`);
  }

  // Walk upstream directory to build manifest
  const upstreamFiles = walkDir(upstreamDir, '');

  // Build manifest entries
  const manifest = upstreamFiles.map(relPath => ({
    relPath: relPath.replace(/\\/g, '/'),
    sourcePath: path.join(upstreamDir, relPath),
    content: null,         // null = copy verbatim (populated in brand stage if needed)
    brandedContent: null,  // populated in brand stage
    action: 'copy',
    stage: 'resolve',
  }));

  // Build set of upstream relPaths for collision detection
  const upstreamRelPaths = new Set(manifest.map(e => e.relPath));

  // Walk overlay directory and check for collisions (COMP-08)
  // Overlay metadata files (branding.json, features.json, .gitkeep) are excluded
  if (fs.existsSync(overlayDir)) {
    const overlayFiles = walkDir(overlayDir, '');
    for (const overlayFile of overlayFiles) {
      const normalised = overlayFile.replace(/\\/g, '/');
      const baseName = normalised.split('/').pop();

      // Skip overlay metadata files
      if (OVERLAY_METADATA.has(baseName)) continue;

      // Check for collision with upstream path
      if (upstreamRelPaths.has(normalised)) {
        throw new Error(
          `Collision detected: overlay/${normalised} matches upstream file at the same path.\n` +
          `To replace this upstream file, move it to overrides/${normalised} instead.\n` +
          `The overrides/ directory is for intentional upstream file replacements.`
        );
      }
    }
  }

  // Read overlay version from package.json (our package)
  let overlayVersion = 'unknown';
  const ourPkgPath = path.join(PROJECT_ROOT, 'package.json');
  if (fs.existsSync(ourPkgPath)) {
    try {
      const ourPkg = JSON.parse(fs.readFileSync(ourPkgPath, 'utf-8'));
      overlayVersion = ourPkg.version || 'unknown';
    } catch (e) {
      // ignore
    }
  }

  return {
    manifest,
    branding,
    features,
    warnings: [],
    meta: {
      upstreamVersion: upstreamPkg.version || 'unknown',
      overlayVersion,
      upstreamDir,
      overlayDir,
    },
  };
}

// ---------------------------------------------------------------------------
// Stage 2: filter()
// ---------------------------------------------------------------------------

/**
 * Applies feature flag filtering to the manifest.
 *
 * - Excludes files by category basename matching (FEAT-01)
 * - Unmentioned files pass through unchanged (opt-out model, FEAT-02)
 * - Runtimes section is ignored entirely (FEAT-03)
 * - SDK all-or-nothing: sdk: false removes all sdk/ entries (FEAT-01)
 * - Unmatched exclude entries produce warnings (not errors)
 * - Populates state.meta.featuresDisabled with descriptive strings
 *
 * @param {PipelineState} state
 * @returns {PipelineState} New state with filtered manifest
 */
function filter(state) {
  const { features } = state;
  const excludeSet = new Set();
  const featuresDisabled = [];

  // Build exclusion set from each category's exclude list
  for (const [category, dirPrefix] of Object.entries(CATEGORY_DIR_MAP)) {
    const categoryConfig = features[category];
    if (!categoryConfig || !Array.isArray(categoryConfig.exclude)) continue;

    for (const baseName of categoryConfig.exclude) {
      excludeSet.add(`${dirPrefix}${baseName}`);
      featuresDisabled.push(`${category}/${baseName}`);
    }
  }

  // SDK all-or-nothing exclusion
  const sdkExcluded = features.sdk === false;
  if (sdkExcluded) {
    featuresDisabled.push('sdk');
  }

  const warnings = [...state.warnings];
  const matchedExcludes = new Set();

  const manifest = state.manifest.filter(entry => {
    // SDK exclusion: drop everything under sdk/
    if (sdkExcluded && entry.relPath.startsWith('sdk/')) {
      return false;
    }

    // Category exclusion: basename match within category's directory prefix
    for (const [, dirPrefix] of Object.entries(CATEGORY_DIR_MAP)) {
      if (!entry.relPath.startsWith(dirPrefix)) continue;
      const ext = path.extname(entry.relPath);
      const baseName = path.basename(entry.relPath, ext);
      const key = `${dirPrefix}${baseName}`;
      if (excludeSet.has(key)) {
        matchedExcludes.add(key);
        return false;
      }
    }

    return true;
  });

  // Warn on unmatched excludes (not errors -- compose still succeeds)
  for (const key of excludeSet) {
    if (!matchedExcludes.has(key)) {
      warnings.push(`Feature exclude "${key}" matched no upstream file`);
    }
  }

  return {
    ...state,
    manifest,
    warnings,
    meta: { ...state.meta, featuresDisabled },
  };
}

// ---------------------------------------------------------------------------
// Stage 3: override()
// ---------------------------------------------------------------------------

/**
 * Applies file overrides from the overrides/ directory.
 *
 * - Walks overrides/ to discover override files (skips .gitkeep and *.REASON.md)
 * - Enforces REASON.md companion for each override; throws with paste-ready template on missing
 * - Swaps manifest entry sourcePath and sets action/stage to 'override'
 * - Warns on overrides matching no manifest entry
 * - Populates state.meta.overridesApplied with relPaths of overridden files
 *
 * @param {PipelineState} state
 * @returns {PipelineState} New state with overrides applied
 * @throws {Error} If an override file lacks a companion REASON.md
 */
function override(state) {
  // Derive overrides directory (sibling of overlay/)
  const overridesDir = path.join(path.dirname(state.meta.overlayDir), 'overrides');

  // If overrides/ doesn't exist, pass through with empty overridesApplied
  if (!fs.existsSync(overridesDir)) {
    return {
      ...state,
      manifest: state.manifest.map(entry => ({ ...entry })),
      warnings: [...state.warnings],
      meta: { ...state.meta, overridesApplied: [] },
    };
  }

  // Walk overrides/ to find override files
  let overrideFiles;
  try {
    overrideFiles = walkDir(overridesDir, '');
  } catch (e) {
    // Empty directory or read error
    return {
      ...state,
      manifest: state.manifest.map(entry => ({ ...entry })),
      warnings: [...state.warnings],
      meta: { ...state.meta, overridesApplied: [] },
    };
  }

  // Build map of override relPath -> absolute path (skip .gitkeep and *.REASON.md)
  const overrideMap = new Map();
  for (const f of overrideFiles) {
    const normalised = f.replace(/\\/g, '/');
    if (normalised === '.gitkeep') continue;
    if (normalised.endsWith('.REASON.md')) continue;
    overrideMap.set(normalised, path.join(overridesDir, f));
  }

  // Verify REASON.md companion exists for each override
  for (const [relPath, absPath] of overrideMap) {
    const reasonPath = absPath + '.REASON.md';
    if (!fs.existsSync(reasonPath)) {
      const tpl = [
        `# Override: ${relPath}`,
        '',
        '## Why',
        '[Explain why the upstream file needs replacement]',
        '',
        '## Upstream snapshot',
        `- Version: ${state.meta.upstreamVersion || 'unknown'}`,
        '- SHA-256: [compute with: node -e "console.log(require(\'crypto\').createHash(\'sha256\').update(require(\'fs\').readFileSync(\'path/to/upstream/file\')).digest(\'hex\'))"]',
        '',
        '## What\'s different',
        '- [Bullet list of changes from upstream]',
        '',
        '## Review trigger',
        `When upstream ${relPath} changes, review whether the override is still needed.`,
      ].join('\n');
      throw new Error(
        `Missing REASON.md for override: overrides/${relPath}\n` +
        `Expected: overrides/${relPath}.REASON.md\n\n` +
        `Create the file with this template:\n\n${tpl}`
      );
    }
  }

  // If no actual overrides after skipping metadata, pass through
  if (overrideMap.size === 0) {
    return {
      ...state,
      manifest: state.manifest.map(entry => ({ ...entry })),
      warnings: [...state.warnings],
      meta: { ...state.meta, overridesApplied: [] },
    };
  }

  const warnings = [...state.warnings];
  const overridesApplied = [];

  // Build set of manifest relPaths for no-match warnings
  const manifestPaths = new Set(state.manifest.map(e => e.relPath));

  for (const [relPath] of overrideMap) {
    if (!manifestPaths.has(relPath)) {
      warnings.push(`Override "overrides/${relPath}" matches no upstream manifest entry`);
    }
  }

  // Swap manifest entries where override exists
  const manifest = state.manifest.map(entry => {
    const overrideSrc = overrideMap.get(entry.relPath);
    if (overrideSrc) {
      overridesApplied.push(entry.relPath);
      return { ...entry, sourcePath: overrideSrc, action: 'override', stage: 'override' };
    }
    return { ...entry };
  });

  return {
    ...state,
    manifest,
    warnings,
    meta: { ...state.meta, overridesApplied },
  };
}

// ---------------------------------------------------------------------------
// Stage 4: brand()
// ---------------------------------------------------------------------------

/**
 * Applies surface-only branding substitutions to upstream file content.
 *
 * For each manifest entry where shouldBrandFile() returns true:
 * - Reads source file content
 * - Applies sorted substitutions via applyBrandingToContent()
 * - If content changed, stores branded content in entry.brandedContent
 * - If content unchanged (no branding targets), leaves brandedContent as null
 *
 * @param {PipelineState} state
 * @returns {PipelineState} New state with brandedContent populated
 */
function brand(state) {
  const sortedSubs = sortSubstitutions(state.branding.substitutions);
  let brandingRulesApplied = 0;

  const manifest = state.manifest.map(entry => {
    if (!shouldBrandFile(entry.relPath)) {
      return { ...entry };
    }

    let content;
    try {
      content = fs.readFileSync(entry.sourcePath, 'utf-8');
    } catch (e) {
      // Binary file or read error -- copy verbatim
      return { ...entry };
    }

    const branded = applyBrandingToContent(content, sortedSubs);

    if (branded !== content) {
      brandingRulesApplied++;
      return { ...entry, brandedContent: branded };
    }

    return { ...entry };
  });

  return {
    ...state,
    manifest,
    warnings: [...state.warnings],
    meta: { ...state.meta, brandingRulesApplied },
  };
}

// ---------------------------------------------------------------------------
// Stage 5: merge()
// ---------------------------------------------------------------------------

/**
 * Writes the composed output to dist/.
 *
 * - Performs clean rebuild: deletes dist/ before writing
 * - Writes each manifest entry (branded content if available, raw otherwise)
 * - Writes overlay additive files (non-metadata files from overlay/)
 * - Writes CREDITS.md when preserveUpstreamCredit is true
 * - Writes .install-meta.json with full audit trail
 *
 * @param {PipelineState} state
 * @param {object} [opts]
 * @param {string} [opts.distDir] - Output directory (default: dist/)
 */
function merge(state, opts) {
  const distDir = (opts && opts.distDir) || DEFAULT_DIST_DIR;

  // Clean rebuild: remove existing dist/ to avoid stale files
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  let filesWritten = 0;
  const overridesApplied = [];

  // Write manifest entries
  for (const entry of state.manifest) {
    const destPath = path.join(distDir, entry.relPath);
    const destDir = path.dirname(destPath);
    fs.mkdirSync(destDir, { recursive: true });

    if (entry.brandedContent != null) {
      // Write branded text content
      fs.writeFileSync(destPath, entry.brandedContent, 'utf-8');
    } else {
      // Copy verbatim (binary or no branding targets)
      try {
        fs.copyFileSync(entry.sourcePath, destPath);
      } catch (e) {
        // Source may not exist if it was filtered out -- skip
        continue;
      }
    }

    if (entry.action === 'override') {
      overridesApplied.push(entry.relPath);
    }

    filesWritten++;
  }

  // Write overlay additive files (non-metadata, non-collision files)
  const overlayDir = state.meta.overlayDir || DEFAULT_OVERLAY_DIR;
  const overlayOnlyPaths = [];
  if (fs.existsSync(overlayDir)) {
    const overlayFiles = walkDir(overlayDir, '');
    for (const overlayFile of overlayFiles) {
      const normalised = overlayFile.replace(/\\/g, '/');
      const baseName = normalised.split('/').pop();
      if (OVERLAY_METADATA.has(baseName)) continue;

      const srcPath = path.join(overlayDir, overlayFile);
      const destPath = path.join(distDir, normalised);
      const destDir = path.dirname(destPath);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      overlayOnlyPaths.push(normalised);
      filesWritten++;
    }
  }

  // Write CREDITS.md when preserveUpstreamCredit is true (BRAND-05)
  const creditsContent = generateCredits(state.branding.preserveUpstreamCredit);
  if (creditsContent != null) {
    fs.writeFileSync(path.join(distDir, 'CREDITS.md'), creditsContent, 'utf-8');
    overlayOnlyPaths.push('CREDITS.md');
    filesWritten++;
  }

  // Write .overlay-manifest.json listing overlay-only files for the installer
  fs.writeFileSync(
    path.join(distDir, '.overlay-manifest.json'),
    JSON.stringify(overlayOnlyPaths.sort(), null, 2),
    'utf-8'
  );

  // Write .install-meta.json (COMP-07)
  const meta = {
    upstream_version: state.meta.upstreamVersion,
    overlay_version: state.meta.overlayVersion,
    composed_at: new Date().toISOString(),
    features_disabled: state.meta.featuresDisabled || [],
    overrides_applied: state.meta.overridesApplied || overridesApplied,
    branding_rules_applied: state.meta.brandingRulesApplied || 0,
  };
  fs.writeFileSync(
    path.join(distDir, '.install-meta.json'),
    JSON.stringify(meta, null, 2),
    'utf-8'
  );

  return { filesWritten, meta };
}

// ---------------------------------------------------------------------------
// compose() -- Full pipeline orchestrator
// ---------------------------------------------------------------------------

/**
 * Runs the full 5-stage composition pipeline.
 *
 * @param {object} [opts]
 * @param {string} [opts.upstreamDir] - Upstream package directory
 * @param {string} [opts.overlayDir] - Overlay directory
 * @param {string} [opts.distDir] - Output dist directory
 * @param {boolean} [opts.dryRun] - Preview without writing files
 * @param {boolean} [opts.diff] - Show filename-level delta against current dist/
 * @param {boolean} [opts.verbose] - Verbose output
 * @returns {ComposeSummary}
 */
function compose(opts) {
  const upstreamDir = (opts && opts.upstreamDir) || DEFAULT_UPSTREAM_DIR;
  const overlayDir = (opts && opts.overlayDir) || DEFAULT_OVERLAY_DIR;
  const distDir = (opts && opts.distDir) || DEFAULT_DIST_DIR;
  const dryRun = (opts && opts.dryRun) || false;
  const isDiff = (opts && opts.diff) || false;

  // Run pipeline stages 1-4
  const resolved = resolve({ upstreamDir, overlayDir });
  const filtered = filter(resolved);
  const overridden = override(filtered);
  const branded = brand(overridden);

  if (dryRun) {
    return {
      dryRun: true,
      filesWritten: 0,
      wouldWrite: branded.manifest.length,
      upstreamVersion: branded.meta.upstreamVersion,
      overlayVersion: branded.meta.overlayVersion,
      brandingRulesApplied: branded.meta.brandingRulesApplied || 0,
      warnings: branded.warnings,
    };
  }

  if (isDiff) {
    const delta = computeDelta(branded, distDir);
    return {
      diff: true,
      delta,
      upstreamVersion: branded.meta.upstreamVersion,
      warnings: branded.warnings,
    };
  }

  // Stage 5: merge
  const mergeResult = merge(branded, { distDir });

  return {
    filesWritten: mergeResult.filesWritten,
    upstreamVersion: branded.meta.upstreamVersion,
    overlayVersion: branded.meta.overlayVersion,
    brandingRulesApplied: branded.meta.brandingRulesApplied || 0,
    warnings: branded.warnings,
    meta: mergeResult.meta,
  };
}

// ---------------------------------------------------------------------------
// Internal: computeDelta() for --diff mode
// ---------------------------------------------------------------------------

/**
 * Computes filename-level delta between what would be composed and current dist/.
 *
 * @param {PipelineState} state - Post-brand pipeline state
 * @param {string} distDir - Current dist directory to compare against
 * @returns {Array<{relPath: string, status: 'added'|'modified'|'unchanged'|'removed'}>}
 */
function computeDelta(state, distDir) {
  const delta = [];

  // Files that would be written
  const wouldWrite = new Set(state.manifest.map(e => e.relPath));

  // Files currently in dist/
  const currentFiles = fs.existsSync(distDir)
    ? new Set(walkDir(distDir, '').map(f => f.replace(/\\/g, '/')))
    : new Set();

  // Check each manifest entry
  for (const entry of state.manifest) {
    const relPath = entry.relPath;
    const destPath = path.join(distDir, relPath);

    if (!currentFiles.has(relPath)) {
      delta.push({ relPath, status: 'added' });
    } else {
      // Compare content
      try {
        const currentContent = fs.readFileSync(destPath);
        let newContent;
        if (entry.brandedContent != null) {
          newContent = Buffer.from(entry.brandedContent, 'utf-8');
        } else {
          newContent = fs.readFileSync(entry.sourcePath);
        }
        if (Buffer.compare(currentContent, newContent) !== 0) {
          delta.push({ relPath, status: 'modified' });
        } else {
          delta.push({ relPath, status: 'unchanged' });
        }
      } catch (e) {
        delta.push({ relPath, status: 'modified' });
      }
    }
  }

  // Part A: Track CREDITS.md (additive output from merge() outside the manifest)
  const creditsContent = generateCredits(state.branding.preserveUpstreamCredit);
  if (creditsContent != null) {
    // CREDITS.md would be written -- track it
    wouldWrite.add('CREDITS.md');
    if (!currentFiles.has('CREDITS.md')) {
      delta.push({ relPath: 'CREDITS.md', status: 'added' });
    } else {
      try {
        const currentCredits = fs.readFileSync(path.join(distDir, 'CREDITS.md'));
        const newCredits = Buffer.from(creditsContent, 'utf-8');
        if (Buffer.compare(currentCredits, newCredits) !== 0) {
          delta.push({ relPath: 'CREDITS.md', status: 'modified' });
        } else {
          delta.push({ relPath: 'CREDITS.md', status: 'unchanged' });
        }
      } catch (e) {
        delta.push({ relPath: 'CREDITS.md', status: 'modified' });
      }
    }
    // If creditsContent is null, do NOT add to wouldWrite -- if CREDITS.md
    // exists in dist/, the removed-detection loop below will flag it as "removed".
  }

  // Part B: Track .install-meta.json (additive output from merge() outside the manifest)
  // composed_at will always differ between runs, so status is typically "modified"
  // when dist/ exists. This is correct -- it reflects that a new composition would
  // update the timestamp.
  wouldWrite.add('.install-meta.json');
  if (!currentFiles.has('.install-meta.json')) {
    delta.push({ relPath: '.install-meta.json', status: 'added' });
  } else {
    // .install-meta.json always differs due to composed_at timestamp
    delta.push({ relPath: '.install-meta.json', status: 'modified' });
  }

  // Part C: Track .overlay-manifest.json (additive output from merge())
  wouldWrite.add('.overlay-manifest.json');
  if (!currentFiles.has('.overlay-manifest.json')) {
    delta.push({ relPath: '.overlay-manifest.json', status: 'added' });
  } else {
    delta.push({ relPath: '.overlay-manifest.json', status: 'modified' });
  }

  // Files in dist/ that would be removed
  // Note: .install-meta.json special-case exclusion removed -- it is now tracked
  // via wouldWrite above, so it will not appear here unless compose would not write it.
  for (const existingFile of currentFiles) {
    if (!wouldWrite.has(existingFile)) {
      delta.push({ relPath: existingFile, status: 'removed' });
    }
  }

  return delta;
}

// ---------------------------------------------------------------------------
// CLI entry point (when run directly as "node scripts/compose.js")
// ---------------------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const isDiff = args.includes('--diff');
  const verbose = args.includes('--verbose');

  try {
    const summary = compose({ dryRun, diff: isDiff, verbose });

    if (dryRun) {
      process.stdout.write('Dry run -- no files written\n');
      process.stdout.write(`  upstream_version:       ${summary.upstreamVersion}\n`);
      process.stdout.write(`  overlay_version:        ${summary.overlayVersion}\n`);
      process.stdout.write(`  files_would_write:      ${summary.wouldWrite}\n`);
      process.stdout.write(`  branding_rules:         ${summary.brandingRulesApplied}\n`);
      if (summary.warnings.length > 0) {
        process.stdout.write(`  warnings:               ${summary.warnings.length}\n`);
      }
    } else if (isDiff) {
      const added = summary.delta.filter(d => d.status === 'added').length;
      const modified = summary.delta.filter(d => d.status === 'modified').length;
      const removed = summary.delta.filter(d => d.status === 'removed').length;
      const unchanged = summary.delta.filter(d => d.status === 'unchanged').length;

      process.stdout.write('Diff against current dist/\n');
      process.stdout.write(`  added:     ${added}\n`);
      process.stdout.write(`  modified:  ${modified}\n`);
      process.stdout.write(`  removed:   ${removed}\n`);
      process.stdout.write(`  unchanged: ${unchanged}\n`);

      if (verbose) {
        for (const entry of summary.delta) {
          if (entry.status !== 'unchanged') {
            process.stdout.write(`  [${entry.status}] ${entry.relPath}\n`);
          }
        }
      }
    } else {
      process.stdout.write('Composition complete\n');
      process.stdout.write(`  upstream_version:       ${summary.upstreamVersion}\n`);
      process.stdout.write(`  overlay_version:        ${summary.overlayVersion}\n`);
      process.stdout.write(`  files_written:          ${summary.filesWritten}\n`);
      process.stdout.write(`  branding_rules_applied: ${summary.brandingRulesApplied}\n`);
      if (summary.warnings.length > 0) {
        process.stdout.write(`  warnings:               ${summary.warnings.length}\n`);
        if (verbose) {
          for (const w of summary.warnings) {
            process.stdout.write(`    - ${w}\n`);
          }
        }
      }
    }
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  // Pipeline stages (COMP-10)
  resolve,
  filter,
  override,
  brand,
  merge,
  compose,
  // Branding engine (exported for test compat from Plan 01)
  applyBrandingToContent,
  validateBrandingConfig,
  sortSubstitutions,
  shouldBrandFile,
  generateCredits,
  BRANDING_SCHEMA,
  // Feature flags (Phase 31 -- FEAT-01 through FEAT-04)
  validateFeaturesConfig,
  FEATURES_SCHEMA,
  CATEGORY_DIR_MAP,
  // Utilities (exported for testing)
  walkDir,
};

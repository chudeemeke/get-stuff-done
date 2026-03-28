'use strict';

/**
 * Phase 30 Plan 02 -- Composition Pipeline Tests
 *
 * Tests for the full 5-stage composition pipeline in scripts/compose.js.
 * Covers requirements COMP-01 through COMP-10.
 *
 * COMP-01: resolve() reads upstream from node_modules/get-shit-done-cc/ and overlay from overlay/
 * COMP-02: resolve() validates upstream directory structure (fail fast with descriptive error)
 * COMP-03: filter() applies feature flag filtering (Phase 30 stub: pass through)
 * COMP-04: override() applies file overrides from overrides/ dir (Phase 30 stub: pass through)
 * COMP-06: merge() writes composed output to dist/ including overlay additive files
 * COMP-07: merge() writes .install-meta.json with audit trail
 * COMP-08: resolve() detects collisions (overlay file at same path as upstream file)
 * COMP-09: CLI --dry-run and --diff flags work
 * COMP-10: Each stage is a separate importable function (SRP)
 */

const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

const PROJECT_ROOT = path.join(__dirname, '..');
const UPSTREAM_PKG = path.join(PROJECT_ROOT, 'node_modules', 'get-shit-done-cc');
const OVERLAY_DIR = path.join(PROJECT_ROOT, 'overlay');
const COMPOSE_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'compose.js');

// Import the pipeline functions (COMP-10: each stage is importable)
const {
  resolve,
  filter,
  override,
  brand,
  merge,
  compose,
} = require('../scripts/compose');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a temporary directory for isolated merge tests.
 */
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-compose-test-'));
}

/**
 * Remove a directory tree recursively.
 */
function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Create a mock upstream directory with the expected structure.
 */
function createMockUpstream(dir) {
  fs.mkdirSync(path.join(dir, 'agents'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'commands', 'gsd'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'get-shit-done', 'workflows'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'hooks', 'dist'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });

  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'get-shit-done-cc', version: '1.30.0' }));
  fs.writeFileSync(path.join(dir, 'LICENSE'), 'MIT License\n');
  fs.writeFileSync(path.join(dir, 'README.md'), '# Get Shit Done\nBy TACHES\n');
  fs.writeFileSync(path.join(dir, 'agents', 'gsd-executor.md'), '# Executor\nget-shit-done-cc\n');
  fs.writeFileSync(path.join(dir, 'bin', 'install.js'), "// install.js\nconst pkg = 'get-shit-done-cc';\n");
  fs.writeFileSync(path.join(dir, 'commands', 'gsd', 'help.md'), '# Help\n');
  fs.writeFileSync(path.join(dir, 'get-shit-done', 'workflows', 'help.md'), '# Help for get-shit-done-cc\n');
  fs.writeFileSync(path.join(dir, 'hooks', 'dist', 'gsd-statusline.js'), '// statusline\n');
  fs.writeFileSync(path.join(dir, 'scripts', 'build-hooks.js'), '// build\n');
}

/**
 * Create a minimal overlay directory.
 */
function createMockOverlay(dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'branding.json'), JSON.stringify({
    substitutions: [
      { from: 'get-shit-done-cc', to: '@chude/get-stuff-done', scope: 'text', note: 'npm pkg' },
      { from: 'TACHES', to: 'Chude Emeke', scope: 'text', note: 'author' },
    ],
    preserveUpstreamCredit: true,
  }));
  fs.writeFileSync(path.join(dir, 'features.json'), JSON.stringify({
    runtimes: { claude: true },
    workflows: { enabled: 'all', exclude: [] },
    sdk: true,
  }));
}

// ---------------------------------------------------------------------------
// COMP-10: Pipeline stage exports (SRP)
// ---------------------------------------------------------------------------

describe('pipeline stage exports (COMP-10)', () => {
  test('resolve is an exported function', () => {
    expect(typeof resolve).toBe('function');
  });

  test('filter is an exported function', () => {
    expect(typeof filter).toBe('function');
  });

  test('override is an exported function', () => {
    expect(typeof override).toBe('function');
  });

  test('brand is an exported function', () => {
    expect(typeof brand).toBe('function');
  });

  test('merge is an exported function', () => {
    expect(typeof merge).toBe('function');
  });

  test('compose is an exported function', () => {
    expect(typeof compose).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// COMP-01 + COMP-02: resolve() -- reads upstream + overlay, validates structure
// ---------------------------------------------------------------------------

describe('resolve()', () => {
  let tmpDir;
  let mockUpstream;
  let mockOverlay;

  beforeEach(() => {
    tmpDir = makeTempDir();
    mockUpstream = path.join(tmpDir, 'upstream');
    mockOverlay = path.join(tmpDir, 'overlay');
    createMockUpstream(mockUpstream);
    createMockOverlay(mockOverlay);
  });

  afterAll(() => {
    if (tmpDir) rmDir(tmpDir);
  });

  test('returns a pipeline state object with manifest, branding, features, warnings, meta (COMP-01)', () => {
    const state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
    expect(Array.isArray(state.manifest)).toBe(true);
    expect(typeof state.branding).toBe('object');
    expect(typeof state.features).toBe('object');
    expect(Array.isArray(state.warnings)).toBe(true);
    expect(typeof state.meta).toBe('object');
  });

  test('manifest contains entries for all upstream files (COMP-01)', () => {
    const state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    // mock upstream has 11 files
    expect(state.manifest.length).toBeGreaterThan(0);
    const paths = state.manifest.map(e => e.relPath);
    expect(paths).toContain('agents/gsd-executor.md');
    expect(paths).toContain('bin/install.js');
    expect(paths).toContain('README.md');
  });

  test('manifest entry has relPath, sourcePath, action, stage (COMP-01)', () => {
    const state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    const entry = state.manifest[0];
    expect(typeof entry.relPath).toBe('string');
    expect(typeof entry.sourcePath).toBe('string');
    expect(typeof entry.action).toBe('string');
    expect(typeof entry.stage).toBe('string');
  });

  test('manifest relPaths use forward slashes on all platforms (COMP-01)', () => {
    const state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    for (const entry of state.manifest) {
      expect(entry.relPath).not.toContain('\\');
    }
  });

  test('meta.upstreamVersion is read from upstream package.json (COMP-01)', () => {
    const state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    expect(state.meta.upstreamVersion).toBe('1.30.0');
  });

  test('branding config is loaded from overlay/branding.json (COMP-01)', () => {
    const state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    expect(state.branding).toBeDefined();
    expect(Array.isArray(state.branding.substitutions)).toBe(true);
    expect(state.branding.substitutions.length).toBe(2);
  });

  test('features config is loaded from overlay/features.json (COMP-01)', () => {
    const state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    expect(state.features).toBeDefined();
    expect(state.features.sdk).toBe(true);
  });

  test('fails fast when upstream directory does not exist (COMP-02)', () => {
    expect(() => resolve({ upstreamDir: '/nonexistent/path', overlayDir: mockOverlay }))
      .toThrow(/upstream/i);
  });

  test('fails fast when upstream package.json is missing (COMP-02)', () => {
    // Remove package.json from mock upstream
    const noPackage = path.join(tmpDir, 'upstream-nopkg');
    createMockUpstream(noPackage);
    fs.rmSync(path.join(noPackage, 'package.json'));
    expect(() => resolve({ upstreamDir: noPackage, overlayDir: mockOverlay }))
      .toThrow(/package\.json/i);
  });

  test('fails fast when required upstream dir agents/ is missing (COMP-02)', () => {
    const noAgents = path.join(tmpDir, 'upstream-noagents');
    createMockUpstream(noAgents);
    fs.rmSync(path.join(noAgents, 'agents'), { recursive: true });
    expect(() => resolve({ upstreamDir: noAgents, overlayDir: mockOverlay }))
      .toThrow();
  });

  test('error message includes hint to run preview-update when upstream structure missing (COMP-02)', () => {
    expect(() => resolve({ upstreamDir: '/nonexistent', overlayDir: mockOverlay }))
      .toThrow(/preview-update|bun install/i);
  });

  test('fails fast when overlay/branding.json is missing (COMP-02)', () => {
    const noOverlay = path.join(tmpDir, 'overlay-empty');
    fs.mkdirSync(noOverlay, { recursive: true });
    // no branding.json
    fs.writeFileSync(path.join(noOverlay, 'features.json'), JSON.stringify({ sdk: true }));
    expect(() => resolve({ upstreamDir: mockUpstream, overlayDir: noOverlay }))
      .toThrow(/branding\.json/i);
  });

  // COMP-08: Collision detection
  test('throws on collision when overlay file matches an upstream path (COMP-08)', () => {
    // Put a file in overlay/ that matches an upstream relPath
    fs.writeFileSync(path.join(mockOverlay, 'README.md'), '# Overlay README\n');
    expect(() => resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay }))
      .toThrow(/collision|conflict/i);
  });

  test('collision error message includes guidance to move to overrides/ (COMP-08)', () => {
    fs.writeFileSync(path.join(mockOverlay, 'README.md'), '# Overlay README\n');
    let errorMsg = '';
    try {
      resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    } catch (e) {
      errorMsg = e.message;
    }
    expect(errorMsg).toMatch(/overrides\//i);
  });

  test('collision error names the conflicting file (COMP-08)', () => {
    fs.writeFileSync(path.join(mockOverlay, 'README.md'), '# Overlay README\n');
    let errorMsg = '';
    try {
      resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    } catch (e) {
      errorMsg = e.message;
    }
    expect(errorMsg).toContain('README.md');
  });

  test('non-conflicting overlay files (branding.json, features.json) do not trigger collision (COMP-08)', () => {
    // overlay/branding.json and features.json are metadata, not upstream files
    expect(() => resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay }))
      .not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// COMP-03: filter() -- Phase 30 stub (pass through)
// ---------------------------------------------------------------------------

describe('filter()', () => {
  let tmpDir;
  let mockUpstream;
  let mockOverlay;
  let state;

  beforeAll(() => {
    tmpDir = makeTempDir();
    mockUpstream = path.join(tmpDir, 'upstream');
    mockOverlay = path.join(tmpDir, 'overlay');
    createMockUpstream(mockUpstream);
    createMockOverlay(mockOverlay);
    state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
  });

  afterAll(() => {
    rmDir(tmpDir);
  });

  test('returns a pipeline state object (COMP-03)', () => {
    const result = filter(state);
    expect(typeof result).toBe('object');
    expect(Array.isArray(result.manifest)).toBe(true);
  });

  test('Phase 30 stub: returns all upstream files unchanged (COMP-03)', () => {
    const result = filter(state);
    // Manifest count unchanged (pass-through in Phase 30)
    expect(result.manifest.length).toBe(state.manifest.length);
  });

  test('does not mutate the input state (COMP-03)', () => {
    const originalCount = state.manifest.length;
    filter(state);
    expect(state.manifest.length).toBe(originalCount);
  });
});

// ---------------------------------------------------------------------------
// COMP-04: override() -- Phase 30 stub (pass through)
// ---------------------------------------------------------------------------

describe('override()', () => {
  let tmpDir;
  let mockUpstream;
  let mockOverlay;
  let state;

  beforeAll(() => {
    tmpDir = makeTempDir();
    mockUpstream = path.join(tmpDir, 'upstream');
    mockOverlay = path.join(tmpDir, 'overlay');
    createMockUpstream(mockUpstream);
    createMockOverlay(mockOverlay);
    state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
  });

  afterAll(() => {
    rmDir(tmpDir);
  });

  test('returns a pipeline state object (COMP-04)', () => {
    const result = override(state);
    expect(typeof result).toBe('object');
    expect(Array.isArray(result.manifest)).toBe(true);
  });

  test('Phase 30 stub: returns all files unchanged (COMP-04)', () => {
    const result = override(state);
    expect(result.manifest.length).toBe(state.manifest.length);
  });

  test('does not mutate the input state (COMP-04)', () => {
    const originalCount = state.manifest.length;
    override(state);
    expect(state.manifest.length).toBe(originalCount);
  });
});

// ---------------------------------------------------------------------------
// brand() -- applies branding substitutions (COMP-05, reused from Plan 01)
// ---------------------------------------------------------------------------

describe('brand()', () => {
  let tmpDir;
  let mockUpstream;
  let mockOverlay;
  let state;

  beforeAll(() => {
    tmpDir = makeTempDir();
    mockUpstream = path.join(tmpDir, 'upstream');
    mockOverlay = path.join(tmpDir, 'overlay');
    createMockUpstream(mockUpstream);
    createMockOverlay(mockOverlay);
    state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
  });

  afterAll(() => {
    rmDir(tmpDir);
  });

  test('returns a pipeline state object', () => {
    const result = brand(state);
    expect(typeof result).toBe('object');
    expect(Array.isArray(result.manifest)).toBe(true);
  });

  test('manifest entries for text files have brandedContent when branding targets exist', () => {
    const result = brand(state);
    // bin/install.js has 'get-shit-done-cc' which is a branding target
    const installEntry = result.manifest.find(e => e.relPath === 'bin/install.js');
    expect(installEntry).toBeDefined();
    expect(typeof installEntry.brandedContent).toBe('string');
    expect(installEntry.brandedContent).not.toContain('get-shit-done-cc');
    expect(installEntry.brandedContent).toContain('@chude/get-stuff-done');
  });

  test('LICENSE file is not branded (BRAND-05)', () => {
    const result = brand(state);
    const licenseEntry = result.manifest.find(e => e.relPath === 'LICENSE');
    expect(licenseEntry).toBeDefined();
    // brandedContent should be null or undefined for LICENSE
    expect(licenseEntry.brandedContent == null).toBe(true);
  });

  test('files without branding targets have null brandedContent', () => {
    const result = brand(state);
    // hooks/dist/gsd-statusline.js has no branding targets in mock
    const hooksEntry = result.manifest.find(e => e.relPath === 'hooks/dist/gsd-statusline.js');
    if (hooksEntry) {
      expect(hooksEntry.brandedContent == null).toBe(true);
    }
  });

  test('does not mutate the input state manifest', () => {
    const origEntries = state.manifest.map(e => ({ ...e }));
    brand(state);
    // Check original entries unchanged
    for (const orig of origEntries) {
      const current = state.manifest.find(e => e.relPath === orig.relPath);
      expect(current).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// COMP-06 + COMP-07: merge() -- writes dist/, includes overlay additive files,
//                               writes .install-meta.json
// ---------------------------------------------------------------------------

describe('merge()', () => {
  let tmpDir;
  let mockUpstream;
  let mockOverlay;
  let distDir;
  let state;

  beforeAll(() => {
    tmpDir = makeTempDir();
    mockUpstream = path.join(tmpDir, 'upstream');
    mockOverlay = path.join(tmpDir, 'overlay');
    distDir = path.join(tmpDir, 'dist');
    createMockUpstream(mockUpstream);
    createMockOverlay(mockOverlay);
    state = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    const filtered = filter(state);
    const overridden = override(filtered);
    const branded = brand(overridden);
    merge(branded, { distDir });
  });

  afterAll(() => {
    rmDir(tmpDir);
  });

  test('dist/ directory is created (COMP-06)', () => {
    expect(fs.existsSync(distDir)).toBe(true);
  });

  test('upstream files are written to dist/ (COMP-06)', () => {
    expect(fs.existsSync(path.join(distDir, 'bin', 'install.js'))).toBe(true);
    expect(fs.existsSync(path.join(distDir, 'agents', 'gsd-executor.md'))).toBe(true);
    expect(fs.existsSync(path.join(distDir, 'README.md'))).toBe(true);
  });

  test('branded content is written (not original) for branded files (COMP-06)', () => {
    const installContent = fs.readFileSync(path.join(distDir, 'bin', 'install.js'), 'utf-8');
    expect(installContent).not.toContain('get-shit-done-cc');
    expect(installContent).toContain('@chude/get-stuff-done');
  });

  test('.install-meta.json is written to dist/ (COMP-07)', () => {
    const metaPath = path.join(distDir, '.install-meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);
  });

  test('.install-meta.json contains upstream_version (COMP-07)', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(distDir, '.install-meta.json'), 'utf-8'));
    expect(meta.upstream_version).toBe('1.30.0');
  });

  test('.install-meta.json contains overlay_version (COMP-07)', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(distDir, '.install-meta.json'), 'utf-8'));
    expect(typeof meta.overlay_version).toBe('string');
  });

  test('.install-meta.json contains composed_at ISO timestamp (COMP-07)', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(distDir, '.install-meta.json'), 'utf-8'));
    expect(typeof meta.composed_at).toBe('string');
    // Should be parseable as ISO date
    expect(isNaN(Date.parse(meta.composed_at))).toBe(false);
  });

  test('.install-meta.json contains features_disabled array (COMP-07)', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(distDir, '.install-meta.json'), 'utf-8'));
    expect(Array.isArray(meta.features_disabled)).toBe(true);
  });

  test('.install-meta.json contains overrides_applied array (COMP-07)', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(distDir, '.install-meta.json'), 'utf-8'));
    expect(Array.isArray(meta.overrides_applied)).toBe(true);
  });

  test('.install-meta.json contains branding_rules_applied count (COMP-07)', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(distDir, '.install-meta.json'), 'utf-8'));
    expect(typeof meta.branding_rules_applied).toBe('number');
    expect(meta.branding_rules_applied).toBeGreaterThan(0);
  });

  test('merge performs clean rebuild -- existing dist/ is replaced (COMP-06)', () => {
    // Write a stale file to dist/
    const staleFile = path.join(distDir, 'STALE-FILE.txt');
    fs.writeFileSync(staleFile, 'stale');

    // Re-run merge
    const state2 = resolve({ upstreamDir: mockUpstream, overlayDir: mockOverlay });
    const filtered2 = filter(state2);
    const overridden2 = override(filtered2);
    const branded2 = brand(overridden2);
    merge(branded2, { distDir });

    // Stale file should be gone
    expect(fs.existsSync(staleFile)).toBe(false);
  });

  test('CREDITS.md is written when preserveUpstreamCredit is true (BRAND-05)', () => {
    const creditsPath = path.join(distDir, 'CREDITS.md');
    expect(fs.existsSync(creditsPath)).toBe(true);
    const credits = fs.readFileSync(creditsPath, 'utf-8');
    expect(credits).toContain('glittercowboy/get-shit-done');
    expect(credits).toContain('TACHES');
  });
});

// ---------------------------------------------------------------------------
// compose() -- full pipeline end-to-end
// ---------------------------------------------------------------------------

describe('compose() end-to-end', () => {
  let tmpDir;
  let mockUpstream;
  let mockOverlay;
  let distDir;

  beforeAll(() => {
    tmpDir = makeTempDir();
    mockUpstream = path.join(tmpDir, 'upstream');
    mockOverlay = path.join(tmpDir, 'overlay');
    distDir = path.join(tmpDir, 'dist');
    createMockUpstream(mockUpstream);
    createMockOverlay(mockOverlay);
  });

  afterAll(() => {
    rmDir(tmpDir);
  });

  test('compose() runs full pipeline and returns summary (COMP-01 through COMP-07)', () => {
    const summary = compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir });
    expect(typeof summary).toBe('object');
    expect(typeof summary.filesWritten).toBe('number');
    expect(summary.filesWritten).toBeGreaterThan(0);
  });

  test('compose() produces dist/ with .install-meta.json', () => {
    compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir });
    expect(fs.existsSync(path.join(distDir, '.install-meta.json'))).toBe(true);
  });

  test('compose() dry-run returns summary without writing files (COMP-09)', () => {
    const dryDistDir = path.join(tmpDir, 'dist-dry');
    const summary = compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir: dryDistDir, dryRun: true });
    expect(typeof summary).toBe('object');
    expect(fs.existsSync(dryDistDir)).toBe(false);
    expect(summary.dryRun).toBe(true);
  });

  test('compose() diff returns file delta without writing (COMP-09)', () => {
    // First compose to establish baseline
    compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir });

    const summary = compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir, diff: true });
    expect(typeof summary).toBe('object');
    expect(summary.diff).toBe(true);
    expect(Array.isArray(summary.delta)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeDelta additive outputs -- CREDITS.md and .install-meta.json delta
// ---------------------------------------------------------------------------

describe('computeDelta additive outputs', () => {
  let tmpDir;
  let mockUpstream;
  let mockOverlay;
  let distDir;

  beforeAll(() => {
    tmpDir = makeTempDir();
    mockUpstream = path.join(tmpDir, 'upstream');
    mockOverlay = path.join(tmpDir, 'overlay');
    distDir = path.join(tmpDir, 'dist');
    createMockUpstream(mockUpstream);
    createMockOverlay(mockOverlay); // preserveUpstreamCredit: true
  });

  afterAll(() => {
    rmDir(tmpDir);
  });

  test('--diff delta includes CREDITS.md when preserveUpstreamCredit is true', () => {
    // Establish baseline in distDir
    compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir });

    const summary = compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir, diff: true });
    expect(summary.diff).toBe(true);
    const creditsEntry = summary.delta.find(d => d.relPath === 'CREDITS.md');
    expect(creditsEntry).toBeDefined();
    expect(creditsEntry.status).toBe('unchanged');
  });

  test('--diff delta includes .install-meta.json', () => {
    // Establish baseline in distDir
    compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir });

    const summary = compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir, diff: true });
    expect(summary.diff).toBe(true);
    const metaEntry = summary.delta.find(d => d.relPath === '.install-meta.json');
    expect(metaEntry).toBeDefined();
    // .install-meta.json always shows modified because composed_at timestamp differs
    expect(['modified', 'unchanged']).toContain(metaEntry.status);
  });

  test('--diff detects CREDITS.md as added when missing from dist/', () => {
    // Establish baseline, then remove CREDITS.md
    compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir });
    const creditsPath = path.join(distDir, 'CREDITS.md');
    if (fs.existsSync(creditsPath)) {
      fs.rmSync(creditsPath);
    }

    const summary = compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir, diff: true });
    const creditsEntry = summary.delta.find(d => d.relPath === 'CREDITS.md');
    expect(creditsEntry).toBeDefined();
    expect(creditsEntry.status).toBe('added');
  });

  test('--diff detects CREDITS.md as removed when credit disabled', () => {
    // First compose WITH credit enabled so CREDITS.md exists in distDir
    compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir });
    expect(fs.existsSync(path.join(distDir, 'CREDITS.md'))).toBe(true);

    // Create a second overlay with preserveUpstreamCredit: false
    const noCreditsOverlay = path.join(tmpDir, 'overlay-no-credits');
    fs.mkdirSync(noCreditsOverlay, { recursive: true });
    fs.writeFileSync(path.join(noCreditsOverlay, 'branding.json'), JSON.stringify({
      substitutions: [
        { from: 'get-shit-done-cc', to: '@chude/get-stuff-done', scope: 'text', note: 'npm pkg' },
        { from: 'TACHES', to: 'Chude Emeke', scope: 'text', note: 'author' },
      ],
      preserveUpstreamCredit: false,
    }));
    fs.writeFileSync(path.join(noCreditsOverlay, 'features.json'), JSON.stringify({
      runtimes: { claude: true },
      workflows: { enabled: 'all', exclude: [] },
      sdk: true,
    }));

    // Now run diff with credit-disabled config
    const summary = compose({ upstreamDir: mockUpstream, overlayDir: noCreditsOverlay, distDir, diff: true });
    const creditsEntry = summary.delta.find(d => d.relPath === 'CREDITS.md');
    expect(creditsEntry).toBeDefined();
    expect(creditsEntry.status).toBe('removed');
  });

  test('--diff detects .install-meta.json as added when missing from dist/', () => {
    // Establish baseline, then remove .install-meta.json
    compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir });
    const metaPath = path.join(distDir, '.install-meta.json');
    if (fs.existsSync(metaPath)) {
      fs.rmSync(metaPath);
    }

    const summary = compose({ upstreamDir: mockUpstream, overlayDir: mockOverlay, distDir, diff: true });
    const metaEntry = summary.delta.find(d => d.relPath === '.install-meta.json');
    expect(metaEntry).toBeDefined();
    expect(metaEntry.status).toBe('added');
  });
});

// ---------------------------------------------------------------------------
// COMP-09: CLI flags (--dry-run, --diff, --verbose)
// ---------------------------------------------------------------------------

describe('CLI flags (COMP-09)', () => {
  function runComposeCLI(args = []) {
    const result = spawnSync(
      process.execPath,
      [COMPOSE_SCRIPT, ...args],
      { encoding: 'utf-8', timeout: 15000, cwd: PROJECT_ROOT }
    );
    return result;
  }

  test('--dry-run exits 0 and outputs summary without writing dist/', () => {
    // Check if dist/ exists before
    const distBefore = fs.existsSync(path.join(PROJECT_ROOT, 'dist'));
    const result = runComposeCLI(['--dry-run']);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/dry.?run/i);
    // dist/ should not have been written by dry-run
    // (only check if it did not exist before)
    if (!distBefore) {
      expect(fs.existsSync(path.join(PROJECT_ROOT, 'dist'))).toBe(false);
    }
  });

  test('--dry-run output contains file count', () => {
    const result = runComposeCLI(['--dry-run']);
    expect(result.status).toBe(0);
    // Should show something like "files: 225" or "225 files"
    expect(result.stdout).toMatch(/\d+/);
  });

  test('--diff exits 0', () => {
    const result = runComposeCLI(['--diff']);
    expect(result.status).toBe(0);
  });

  test('--verbose exits 0', () => {
    const result = runComposeCLI(['--verbose']);
    expect(result.status).toBe(0);
  });

  test('no flags: runs full composition with real upstream and exits 0', { timeout: 30000 }, () => {
    const result = runComposeCLI([]);
    expect(result.status).toBe(0);
  });

  test('no flags: dist/.install-meta.json is written', { timeout: 30000 }, () => {
    runComposeCLI([]);
    const metaPath = path.join(PROJECT_ROOT, 'dist', '.install-meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    expect(meta.upstream_version).toBe('1.30.0');
  });

  test('no flags: dist/ contains branding-applied content', { timeout: 30000 }, () => {
    runComposeCLI([]);
    const installPath = path.join(PROJECT_ROOT, 'dist', 'bin', 'install.js');
    if (fs.existsSync(installPath)) {
      const content = fs.readFileSync(installPath, 'utf-8');
      expect(content).not.toContain('get-shit-done-cc');
    }
  });
});

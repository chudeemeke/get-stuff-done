'use strict';

/**
 * Phase 31 Plan 03 -- check-overrides.js Tests
 *
 * Tests for the standalone staleness detection script in scripts/check-overrides.js.
 * Covers requirement OVER-03: SHA-256 content hash comparison for stale override detection.
 *
 * OVER-03: check-overrides.js detects stale overrides when upstream file content has changed
 *          since override was written. Uses SHA-256 content hash stored in REASON.md.
 */

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { runWithTimeout } = require('./helpers');

const PROJECT_ROOT = path.join(__dirname, '..');
const CHECK_OVERRIDES_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'check-overrides.js');

function runCheckOverridesCli(args = [], options = {}) {
  return runWithTimeout(process.execPath, [CHECK_OVERRIDES_SCRIPT, ...args], {
    cwd: options.cwd,
    encoding: 'utf-8',
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute SHA-256 hex digest of a string or Buffer.
 */
function computeHash(content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Build the standard REASON.md content for a given relPath, version, and hash.
 */
function createReasonMd(relPath, version, hash, opts = {}) {
  const lines = [
    `# Override: ${relPath}`,
    '',
    '## Why',
    'Test override reason',
    '',
    '## Upstream snapshot',
    `- Version: ${version}`,
    `- SHA-256: ${hash}`,
  ];

  if (opts.semanticHash) {
    lines.push(`- Semantic SHA-256: ${opts.semanticHash}`);
  }

  lines.push(
    '',
    "## What's different",
    '- Test change',
    '',
    '## Review trigger',
    `When upstream ${relPath} changes.`,
  );

  return lines.join('\n');
}

/**
 * Create a temporary directory for isolated tests.
 */
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-check-overrides-test-'));
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
 * Set up a mock test fixture with upstream and overrides directories.
 *
 * @param {object} opts
 * @param {object[]} opts.upstreamFiles - Array of { relPath, content } objects
 * @param {object[]} opts.overrideFiles - Array of { relPath, content, reasonVersion?, reasonHash? }
 *   If reasonHash is null, no REASON.md is created.
 *   If reasonHash is undefined, the current upstream hash is used (fresh override).
 * @param {string?} opts.upstreamVersion - Version for package.json (default: '1.30.0')
 * @returns {{ tmpDir, upstreamDir, overridesDir }}
 */
function createFixture(opts = {}) {
  const tmpDir = makeTempDir();
  const upstreamDir = path.join(tmpDir, 'upstream');
  const overridesDir = path.join(tmpDir, 'overrides');
  const upstreamVersion = opts.upstreamVersion || '1.30.0';

  // Create upstream dir with package.json
  fs.mkdirSync(upstreamDir, { recursive: true });
  fs.writeFileSync(
    path.join(upstreamDir, 'package.json'),
    JSON.stringify({ name: '@opengsd/gsd-core', version: upstreamVersion }),
    'utf-8'
  );

  // Create upstream files
  const upstreamFiles = opts.upstreamFiles || [];
  for (const f of upstreamFiles) {
    const abs = path.join(upstreamDir, f.relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.content, 'utf-8');
  }

  // Create overrides dir with .gitkeep
  fs.mkdirSync(overridesDir, { recursive: true });
  fs.writeFileSync(path.join(overridesDir, '.gitkeep'), '', 'utf-8');

  // Create override files
  const overrideFiles = opts.overrideFiles || [];
  for (const f of overrideFiles) {
    // Write the override file itself
    const abs = path.join(overridesDir, f.relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.content, 'utf-8');

    // Write REASON.md companion unless explicitly suppressed
    if (f.reasonHash !== null) {
      const upstreamContent = upstreamFiles.find(u => u.relPath === f.relPath)?.content;
      const hash =
        f.reasonHash !== undefined
          ? f.reasonHash
          : computeHash(upstreamContent || f.content);
      const version = f.reasonVersion || upstreamVersion;
      const reasonContent = createReasonMd(f.relPath, version, hash, {
        semanticHash: f.reasonSemanticHash,
      });
      fs.writeFileSync(abs + '.REASON.md', reasonContent, 'utf-8');
    }
  }

  return { tmpDir, upstreamDir, overridesDir };
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

describe('check-overrides module exports', () => {
  test('checkOverrides is an exported function', () => {
    const mod = require('../scripts/check-overrides');
    expect(typeof mod.checkOverrides).toBe('function');
  });

  test('Module can be required without error', () => {
    expect(() => require('../scripts/check-overrides')).not.toThrow();
  });

  test('hashFileContent is exported', () => {
    const mod = require('../scripts/check-overrides');
    expect(typeof mod.hashFileContent).toBe('function');
  });

  test('extractHashFromReason is exported', () => {
    const mod = require('../scripts/check-overrides');
    expect(typeof mod.extractHashFromReason).toBe('function');
  });

  test('extractVersionFromReason is exported', () => {
    const mod = require('../scripts/check-overrides');
    expect(typeof mod.extractVersionFromReason).toBe('function');
  });

  test('formatReport is exported', () => {
    const mod = require('../scripts/check-overrides');
    expect(typeof mod.formatReport).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Zero overrides
// ---------------------------------------------------------------------------

describe('zero overrides', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('overrides/ with only .gitkeep returns ok: true and summary.total: 0', () => {
    const fixture = createFixture({ upstreamFiles: [] });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.ok).toBe(true);
    expect(result.summary.total).toBe(0);
    expect(result.overrides).toEqual([]);
  });

  test('empty overrides summary has all-zero counts', () => {
    const fixture = createFixture({ upstreamFiles: [] });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.summary.fresh).toBe(0);
    expect(result.summary.stale).toBe(0);
    expect(result.summary.missingReason).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Fresh override
// ---------------------------------------------------------------------------

describe('fresh override', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('override with matching hash returns status: fresh', () => {
    const upstreamContent = 'upstream file content v1';
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: upstreamContent }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'my custom version',
          // reasonHash undefined = use current upstream hash (fresh)
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.overrides[0].status).toBe('fresh');
  });

  test('result ok: true when all overrides are fresh', () => {
    const upstreamContent = 'original content';
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'bin/helper.js', content: upstreamContent }],
      overrideFiles: [
        {
          relPath: 'bin/helper.js',
          content: 'fork content',
          // no reasonHash = uses computed upstream hash
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.ok).toBe(true);
  });

  test('fresh override has relPath in result', () => {
    const upstreamContent = 'content abc';
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: upstreamContent }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'custom content',
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.overrides[0].relPath).toBe('lib/config.cjs');
  });
});

// ---------------------------------------------------------------------------
// Stale override
// ---------------------------------------------------------------------------

describe('stale override', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('override with outdated hash returns status: stale', () => {
    const upstreamContent = 'upstream file content v2 -- updated';
    const oldHash = computeHash('upstream file content v1 -- original');
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: upstreamContent }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'my custom version',
          reasonHash: oldHash, // recorded when v1 was current
          reasonVersion: 'v1.29.0',
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.overrides[0].status).toBe('stale');
  });

  test('result ok: false when any override is stale', () => {
    const upstreamContent = 'updated content';
    const oldHash = computeHash('old content');
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: upstreamContent }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'fork content',
          reasonHash: oldHash,
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.ok).toBe(false);
  });

  test('stale entry includes recordedHash, currentHash, and recordedVersion', () => {
    const upstreamContent = 'new upstream content';
    const oldHash = computeHash('old upstream content');
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: upstreamContent }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'fork content',
          reasonHash: oldHash,
          reasonVersion: 'v1.29.0',
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    const entry = result.overrides[0];
    expect(entry.recordedHash).toBe(oldHash);
    expect(entry.currentHash).toBe(computeHash(upstreamContent));
    expect(entry.recordedVersion).toBe('v1.29.0');
  });

  test('summary.stale count is incremented for stale overrides', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: 'new content' }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'fork content',
          reasonHash: computeHash('old content'),
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.summary.stale).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// JavaScript semantic override staleness
// ---------------------------------------------------------------------------

describe('JavaScript semantic override staleness', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  function semanticHash(source, filePath = 'hooks/example.js') {
    const { semanticHashJavaScript } = require('../scripts/lib/semantic-js');
    const result = semanticHashJavaScript(source, filePath);
    expect(result.ok).toBe(true);
    return result.hash;
  }

  test('comment-only JavaScript upstream changes return fresh-semantic when Semantic SHA-256 matches', () => {
    const original = 'function answer() {\n  return 42;\n}\n';
    const commentOnly = '// upstream note changed\nfunction answer() {\n  return 42;\n}\n';
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'hooks/example.js', content: commentOnly }],
      overrideFiles: [
        {
          relPath: 'hooks/example.js',
          content: 'function forkAnswer() { return 42; }\n',
          reasonHash: computeHash(original),
          reasonSemanticHash: semanticHash(original),
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });

    expect(result.ok).toBe(true);
    expect(result.overrides[0].status).toBe('fresh-semantic');
    expect(result.summary.fresh).toBe(1);
  });

  test('whitespace-only JavaScript upstream changes return fresh-semantic when Semantic SHA-256 matches', () => {
    const original = 'const value = 1 + 2;\nmodule.exports = value;\n';
    const whitespaceOnly = 'const   value=1+2;\n\nmodule.exports=value;\n';
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'hooks/space.js', content: whitespaceOnly }],
      overrideFiles: [
        {
          relPath: 'hooks/space.js',
          content: 'module.exports = 3;\n',
          reasonHash: computeHash(original),
          reasonSemanticHash: semanticHash(original, 'hooks/space.js'),
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });

    expect(result.ok).toBe(true);
    expect(result.overrides[0].status).toBe('fresh-semantic');
  });

  test('semantic JavaScript AST changes return stale even when byte hash differs', () => {
    const original = 'function answer() {\n  return 42;\n}\n';
    const changed = 'function answer() {\n  return 43;\n}\n';
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'hooks/changed.js', content: changed }],
      overrideFiles: [
        {
          relPath: 'hooks/changed.js',
          content: 'function forkAnswer() { return 42; }\n',
          reasonHash: computeHash(original),
          reasonSemanticHash: semanticHash(original, 'hooks/changed.js'),
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });

    expect(result.ok).toBe(false);
    expect(result.overrides[0].status).toBe('stale');
  });

  test('JavaScript byte mismatch with missing Semantic SHA-256 remains stale', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'hooks/missing-semantic.js', content: 'const value = 2;\n' }],
      overrideFiles: [
        {
          relPath: 'hooks/missing-semantic.js',
          content: 'const value = 1;\n',
          reasonHash: computeHash('const value = 1;\n'),
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });

    expect(result.ok).toBe(false);
    expect(result.overrides[0].status).toBe('stale');
  });

  test('non-JS overrides keep byte-hash behavior even if Semantic SHA-256 is present', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'docs/example.md', content: '# Title\n\nchanged\n' }],
      overrideFiles: [
        {
          relPath: 'docs/example.md',
          content: '# Fork\n',
          reasonHash: computeHash('# Title\n\noriginal\n'),
          reasonSemanticHash: 'a'.repeat(64),
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });

    expect(result.ok).toBe(false);
    expect(result.overrides[0].status).toBe('stale');
  });

  test('parse failure falls back to byte-hash behavior and returns stale when hashes differ', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'hooks/broken.js', content: 'function broken( {\n' }],
      overrideFiles: [
        {
          relPath: 'hooks/broken.js',
          content: 'function forkBroken() {}\n',
          reasonHash: computeHash('function oldBroken() {}\n'),
          reasonSemanticHash: 'b'.repeat(64),
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });

    expect(result.ok).toBe(false);
    expect(result.overrides[0].status).toBe('stale');
    expect(result.overrides[0].semanticError).toContain('parse');
  });
});

// ---------------------------------------------------------------------------
// Missing REASON.md
// ---------------------------------------------------------------------------

describe('missing REASON.md', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('override without companion REASON.md returns status: missing-reason', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'bin/helper.js', content: 'upstream content' }],
      overrideFiles: [
        {
          relPath: 'bin/helper.js',
          content: 'fork content',
          reasonHash: null, // null = do NOT create REASON.md
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.overrides[0].status).toBe('missing-reason');
  });

  test('result ok: false when any REASON.md is missing', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'bin/helper.js', content: 'upstream content' }],
      overrideFiles: [
        {
          relPath: 'bin/helper.js',
          content: 'fork content',
          reasonHash: null,
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.ok).toBe(false);
  });

  test('missing-reason entry includes expectedReasonPath', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'bin/helper.js', content: 'upstream content' }],
      overrideFiles: [
        {
          relPath: 'bin/helper.js',
          content: 'fork content',
          reasonHash: null,
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    const entry = result.overrides[0];
    // Expected path: the override path + '.REASON.md' inside the overrides dir
    expect(entry.expectedReasonPath).toContain('bin/helper.js.REASON.md');
  });

  test('summary.missingReason count is incremented for missing REASON.md', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'bin/helper.js', content: 'upstream content' }],
      overrideFiles: [
        {
          relPath: 'bin/helper.js',
          content: 'fork content',
          reasonHash: null,
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.summary.missingReason).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Hash extraction
// ---------------------------------------------------------------------------

describe('hash extraction', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('extracts 64-character hex SHA-256 from REASON.md', () => {
    const tmpDir2 = makeTempDir();
    tmpDir = tmpDir2;
    const hash = 'a'.repeat(64);
    const reasonContent = createReasonMd('lib/config.cjs', 'v1.30.0', hash);
    const reasonPath = path.join(tmpDir2, 'config.cjs.REASON.md');
    fs.writeFileSync(reasonPath, reasonContent, 'utf-8');

    const { extractHashFromReason } = require('../scripts/check-overrides');
    expect(extractHashFromReason(reasonPath)).toBe(hash);
  });

  test('returns null if REASON.md has no valid SHA-256 line', () => {
    const tmpDir2 = makeTempDir();
    tmpDir = tmpDir2;
    const reasonContent = '# Override: lib/config.cjs\n\n## Why\nNo hash here.\n';
    const reasonPath = path.join(tmpDir2, 'config.cjs.REASON.md');
    fs.writeFileSync(reasonPath, reasonContent, 'utf-8');

    const { extractHashFromReason } = require('../scripts/check-overrides');
    expect(extractHashFromReason(reasonPath)).toBeNull();
  });

  test('handles extra whitespace around hash value', () => {
    const tmpDir2 = makeTempDir();
    tmpDir = tmpDir2;
    const hash = 'b'.repeat(64);
    const reasonContent = `# Override: lib/config.cjs\n\n## Upstream snapshot\n- SHA-256:  ${hash}  \n`;
    const reasonPath = path.join(tmpDir2, 'config.cjs.REASON.md');
    fs.writeFileSync(reasonPath, reasonContent, 'utf-8');

    const { extractHashFromReason } = require('../scripts/check-overrides');
    expect(extractHashFromReason(reasonPath)).toBe(hash);
  });

  test('returns null for a partial hash (not 64 chars)', () => {
    const tmpDir2 = makeTempDir();
    tmpDir = tmpDir2;
    const reasonContent = '# Override\n- SHA-256: abc123\n';
    const reasonPath = path.join(tmpDir2, 'config.cjs.REASON.md');
    fs.writeFileSync(reasonPath, reasonContent, 'utf-8');

    const { extractHashFromReason } = require('../scripts/check-overrides');
    expect(extractHashFromReason(reasonPath)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Version extraction
// ---------------------------------------------------------------------------

describe('version extraction', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('extracts version string from REASON.md', () => {
    const tmpDir2 = makeTempDir();
    tmpDir = tmpDir2;
    const hash = 'c'.repeat(64);
    const reasonContent = createReasonMd('lib/config.cjs', 'v1.30.0', hash);
    const reasonPath = path.join(tmpDir2, 'config.cjs.REASON.md');
    fs.writeFileSync(reasonPath, reasonContent, 'utf-8');

    const { extractVersionFromReason } = require('../scripts/check-overrides');
    expect(extractVersionFromReason(reasonPath)).toBe('v1.30.0');
  });

  test('returns null if no version line found', () => {
    const tmpDir2 = makeTempDir();
    tmpDir = tmpDir2;
    const reasonContent = '# Override: lib/config.cjs\n\n## Why\nNo version here.\n';
    const reasonPath = path.join(tmpDir2, 'config.cjs.REASON.md');
    fs.writeFileSync(reasonPath, reasonContent, 'utf-8');

    const { extractVersionFromReason } = require('../scripts/check-overrides');
    expect(extractVersionFromReason(reasonPath)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Orphaned override (upstream file removed)
// ---------------------------------------------------------------------------

describe('override with no manifest match', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('override for file not in upstream returns status: orphaned', () => {
    // Create override but no matching upstream file
    const fixture = createFixture({
      upstreamFiles: [], // nothing in upstream
      overrideFiles: [
        {
          relPath: 'lib/removed.cjs',
          content: 'fork content',
          // REASON.md is created with a made-up hash
          reasonHash: computeHash('original content that no longer exists'),
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.overrides[0].status).toBe('orphaned');
  });
});

// ---------------------------------------------------------------------------
// Mixed results
// ---------------------------------------------------------------------------

describe('mixed results', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('one fresh, one stale, one missing-reason: ok false with correct counts', () => {
    const freshUpstreamContent = 'fresh upstream content';
    const staleUpstreamContent = 'updated upstream content -- v2';
    const staleOldHash = computeHash('original stale upstream content');

    const fixture = createFixture({
      upstreamFiles: [
        { relPath: 'lib/config.cjs', content: freshUpstreamContent },
        { relPath: 'lib/runner.cjs', content: staleUpstreamContent },
        { relPath: 'bin/helper.js', content: 'helper content' },
      ],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'fork version',
          // no reasonHash = uses current upstream hash (fresh)
        },
        {
          relPath: 'lib/runner.cjs',
          content: 'fork runner',
          reasonHash: staleOldHash, // hash from old version = stale
        },
        {
          relPath: 'bin/helper.js',
          content: 'fork helper',
          reasonHash: null, // no REASON.md = missing-reason
        },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });

    expect(result.ok).toBe(false);
    expect(result.summary.total).toBe(3);
    expect(result.summary.fresh).toBe(1);
    expect(result.summary.stale).toBe(1);
    expect(result.summary.missingReason).toBe(1);
  });

  test('all fresh: ok true', () => {
    const fixture = createFixture({
      upstreamFiles: [
        { relPath: 'lib/config.cjs', content: 'content a' },
        { relPath: 'bin/helper.js', content: 'content b' },
      ],
      overrideFiles: [
        { relPath: 'lib/config.cjs', content: 'fork a' },
        { relPath: 'bin/helper.js', content: 'fork b' },
      ],
    });
    tmpDir = fixture.tmpDir;
    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    expect(result.ok).toBe(true);
    expect(result.summary.total).toBe(2);
    expect(result.summary.fresh).toBe(2);
    expect(result.summary.stale).toBe(0);
    expect(result.summary.missingReason).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatReport output
// ---------------------------------------------------------------------------

describe('formatReport', () => {
  test('report includes header line', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: true,
      overrides: [],
      summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('Override staleness report');
  });

  test('report includes summary line with counts', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: false,
      overrides: [
        {
          relPath: 'lib/config.cjs',
          status: 'stale',
          recordedHash: 'a'.repeat(64),
          currentHash: 'b'.repeat(64),
          recordedVersion: 'v1.29.0',
          currentVersion: 'v1.30.0',
        },
      ],
      summary: { total: 1, fresh: 0, stale: 1, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('1 overrides checked');
    expect(report).toContain('1 stale');
  });

  test('stale entry shows STALE status, hashes, and action', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const recordedHash = 'a'.repeat(64);
    const currentHash = 'b'.repeat(64);
    const result = {
      ok: false,
      overrides: [
        {
          relPath: 'lib/config.cjs',
          status: 'stale',
          recordedHash,
          currentHash,
          recordedVersion: 'v1.29.0',
          currentVersion: 'v1.30.0',
        },
      ],
      summary: { total: 1, fresh: 0, stale: 1, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('STALE');
    expect(report).toContain(recordedHash.slice(0, 12));
    expect(report).toContain(currentHash.slice(0, 12));
  });

  test('missing-reason entry shows expected path and template', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: false,
      overrides: [
        {
          relPath: 'bin/helper.js',
          status: 'missing-reason',
          expectedReasonPath: 'overrides/bin/helper.js.REASON.md',
        },
      ],
      summary: { total: 1, fresh: 0, stale: 0, missingReason: 1, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('MISSING REASON.md');
    expect(report).toContain('bin/helper.js.REASON.md');
  });

  test('fresh entry shows OK status', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: true,
      overrides: [
        {
          relPath: 'lib/config.cjs',
          status: 'fresh',
        },
      ],
      summary: { total: 1, fresh: 1, stale: 0, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('OK');
  });

  test('fresh-semantic entry shows OK semantic status', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: true,
      overrides: [
        {
          relPath: 'hooks/example.js',
          status: 'fresh-semantic',
        },
      ],
      summary: { total: 1, fresh: 1, stale: 0, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('OK (semantic)');
  });
});

// ---------------------------------------------------------------------------
// CLI exit codes
// ---------------------------------------------------------------------------

describe('CLI exit codes', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('exits 0 when overrides/ has only .gitkeep (zero overrides)', () => {
    const fixture = createFixture({ upstreamFiles: [] });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli(['--overrides-dir', fixture.overridesDir, '--upstream-dir', fixture.upstreamDir]);
    expect(result.status).toBe(0);
  });

  test('exits 0 when all overrides are fresh', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: 'upstream content' }],
      overrideFiles: [{ relPath: 'lib/config.cjs', content: 'fork content' }],
    });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli(['--overrides-dir', fixture.overridesDir, '--upstream-dir', fixture.upstreamDir]);
    expect(result.status).toBe(0);
  });

  test('exits 1 when an override is stale', () => {
    const oldHash = computeHash('old upstream content');
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: 'updated upstream content' }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'fork content',
          reasonHash: oldHash,
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli(['--overrides-dir', fixture.overridesDir, '--upstream-dir', fixture.upstreamDir]);
    expect(result.status).toBe(1);
  });

  test('stale override CLI output names path and mismatch action', () => {
    const oldHash = computeHash('old upstream content');
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: 'updated upstream content' }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'fork content',
          reasonHash: oldHash,
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli(['--overrides-dir', fixture.overridesDir, '--upstream-dir', fixture.upstreamDir]);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('overrides/lib/config.cjs');
    expect(output).toContain('STALE');
    expect(output).toContain('Current hash:');
    expect(output).toContain('Action:');
  });

  test('exits 1 when REASON.md is missing', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'bin/helper.js', content: 'upstream content' }],
      overrideFiles: [
        {
          relPath: 'bin/helper.js',
          content: 'fork content',
          reasonHash: null, // no REASON.md
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli(['--overrides-dir', fixture.overridesDir, '--upstream-dir', fixture.upstreamDir]);
    expect(result.status).toBe(1);
  });

  test('missing REASON.md CLI output names expected companion file', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'bin/helper.js', content: 'upstream content' }],
      overrideFiles: [
        {
          relPath: 'bin/helper.js',
          content: 'fork content',
          reasonHash: null,
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli(['--overrides-dir', fixture.overridesDir, '--upstream-dir', fixture.upstreamDir]);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('overrides/bin/helper.js');
    expect(output).toContain('MISSING REASON.md');
    expect(output).toContain('bin/helper.js.REASON.md');
  });

  test('CLI output includes the report header', () => {
    const fixture = createFixture({ upstreamFiles: [] });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli(['--overrides-dir', fixture.overridesDir, '--upstream-dir', fixture.upstreamDir]);
    expect(result.stdout).toContain('Override staleness report');
  });
});

// ---------------------------------------------------------------------------
// Orphan REASON.md (REASON.md with no matching override file)
// ---------------------------------------------------------------------------

describe('orphan REASON.md', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('standalone REASON.md without matching override file is ignored (not counted)', () => {
    // Create a fixture where REASON.md exists but the override file it documents does not
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: 'upstream content' }],
      overrideFiles: [],
    });
    tmpDir = fixture.tmpDir;

    // Manually add a REASON.md without its companion override file
    fs.mkdirSync(path.join(fixture.overridesDir, 'lib'), { recursive: true });
    fs.writeFileSync(
      path.join(fixture.overridesDir, 'lib', 'config.cjs.REASON.md'),
      createReasonMd('lib/config.cjs', 'v1.30.0', computeHash('upstream content'))
    );

    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({
      overridesDir: fixture.overridesDir,
      upstreamDir: fixture.upstreamDir,
    });
    // REASON.md files are filtered out by the .endsWith('.REASON.md') check
    // so a standalone REASON.md with no override should not be in results
    expect(result.summary.total).toBe(0);
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatReport: orphaned entry formatting (lines 279-281)
// ---------------------------------------------------------------------------

describe('formatReport orphaned entry', () => {
  test('orphaned entry shows ORPHANED status and removal action', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: false,
      overrides: [
        {
          relPath: 'lib/removed.cjs',
          status: 'orphaned',
        },
      ],
      summary: { total: 1, fresh: 0, stale: 0, missingReason: 0, orphaned: 1 },
    };
    const report = formatReport(result);
    expect(report).toContain('ORPHANED');
    expect(report).toContain('Remove this override');
    expect(report).toContain('upstream file no longer exists');
    expect(report).toContain('1 orphaned');
  });

  test('report with mixed orphaned and fresh entries shows correct summary', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: false,
      overrides: [
        { relPath: 'lib/config.cjs', status: 'fresh' },
        { relPath: 'lib/removed.cjs', status: 'orphaned' },
      ],
      summary: { total: 2, fresh: 1, stale: 0, missingReason: 0, orphaned: 1 },
    };
    const report = formatReport(result);
    expect(report).toContain('2 overrides checked');
    expect(report).toContain('1 orphaned');
    expect(report).toContain('OK'); // fresh entry
    expect(report).toContain('ORPHANED'); // orphaned entry
  });
});

// ---------------------------------------------------------------------------
// formatReport: zero overrides message
// ---------------------------------------------------------------------------

describe('formatReport zero overrides', () => {
  test('zero overrides shows "No overrides found" and "all fresh" is not shown', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: true,
      overrides: [],
      summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('No overrides found');
    expect(report).toContain('0 overrides checked');
  });
});

// ---------------------------------------------------------------------------
// formatReport: stale entry version display
// ---------------------------------------------------------------------------

describe('formatReport stale version display', () => {
  test('stale entry without recordedVersion omits recorded version line', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: false,
      overrides: [
        {
          relPath: 'lib/config.cjs',
          status: 'stale',
          recordedHash: 'a'.repeat(64),
          currentHash: 'b'.repeat(64),
          // no recordedVersion
          currentVersion: 'v1.30.0',
        },
      ],
      summary: { total: 1, fresh: 0, stale: 1, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('STALE');
    expect(report).toContain('Current version:');
    // The report should show the current version
    expect(report).toContain('v1.30.0');
  });

  test('stale entry without currentVersion omits current version line', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: false,
      overrides: [
        {
          relPath: 'lib/config.cjs',
          status: 'stale',
          recordedHash: 'a'.repeat(64),
          currentHash: 'b'.repeat(64),
          recordedVersion: 'v1.29.0',
          // no currentVersion
        },
      ],
      summary: { total: 1, fresh: 0, stale: 1, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('STALE');
    expect(report).toContain('Recorded version:');
    expect(report).toContain('v1.29.0');
  });

  test('stale entry with null recordedHash shows (none)', () => {
    const { formatReport } = require('../scripts/check-overrides');
    const result = {
      ok: false,
      overrides: [
        {
          relPath: 'lib/config.cjs',
          status: 'stale',
          recordedHash: null,
          currentHash: 'b'.repeat(64),
        },
      ],
      summary: { total: 1, fresh: 0, stale: 1, missingReason: 0, orphaned: 0 },
    };
    const report = formatReport(result);
    expect(report).toContain('(none)');
  });
});

// ---------------------------------------------------------------------------
// readUpstreamVersion error path (line 119)
// ---------------------------------------------------------------------------

describe('readUpstreamVersion fallback', () => {
  test('checkOverrides with missing upstream package.json returns version "unknown"', () => {
    const tmpDir2 = makeTempDir();
    const overridesDir = path.join(tmpDir2, 'overrides');
    const upstreamDir = path.join(tmpDir2, 'upstream');
    fs.mkdirSync(overridesDir, { recursive: true });
    fs.mkdirSync(upstreamDir, { recursive: true });
    // No package.json in upstream -- readUpstreamVersion should return 'unknown'

    // Create a stale override so currentVersion is populated from readUpstreamVersion
    fs.writeFileSync(path.join(upstreamDir, 'test.js'), 'content');
    fs.writeFileSync(path.join(overridesDir, 'test.js'), 'override');
    const oldHash = computeHash('old content');
    fs.writeFileSync(
      path.join(overridesDir, 'test.js.REASON.md'),
      createReasonMd('test.js', 'v1.29.0', oldHash)
    );

    const { checkOverrides } = require('../scripts/check-overrides');
    const result = checkOverrides({ overridesDir, upstreamDir });

    // The stale entry should have currentVersion derived from readUpstreamVersion
    const staleEntry = result.overrides.find(o => o.status === 'stale');
    expect(staleEntry).toBeDefined();
    expect(staleEntry.currentVersion).toBe('vunknown');

    rmDir(tmpDir2);
  });
});

// ---------------------------------------------------------------------------
// parseArgs() flag parsing
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  test('parses --overrides-dir flag', () => {
    const { parseArgs } = require('../scripts/check-overrides');
    const opts = parseArgs(['--overrides-dir', '/tmp/overrides']);
    expect(opts.overridesDir).toBe('/tmp/overrides');
  });

  test('parses --upstream-dir flag', () => {
    const { parseArgs } = require('../scripts/check-overrides');
    const opts = parseArgs(['--upstream-dir', '/tmp/upstream']);
    expect(opts.upstreamDir).toBe('/tmp/upstream');
  });

  test('parses both flags together', () => {
    const { parseArgs } = require('../scripts/check-overrides');
    const opts = parseArgs(['--overrides-dir', '/tmp/o', '--upstream-dir', '/tmp/u']);
    expect(opts.overridesDir).toBe('/tmp/o');
    expect(opts.upstreamDir).toBe('/tmp/u');
  });

  test('returns empty object with no flags', () => {
    const { parseArgs } = require('../scripts/check-overrides');
    const opts = parseArgs([]);
    expect(opts.overridesDir).toBeUndefined();
    expect(opts.upstreamDir).toBeUndefined();
  });

  test('ignores unknown flags', () => {
    const { parseArgs } = require('../scripts/check-overrides');
    const opts = parseArgs(['--unknown', 'value', '--overrides-dir', '/tmp/o']);
    expect(opts.overridesDir).toBe('/tmp/o');
    expect(opts.upstreamDir).toBeUndefined();
  });

  test('flag without value is ignored', () => {
    const { parseArgs } = require('../scripts/check-overrides');
    const opts = parseArgs(['--overrides-dir']);
    expect(opts.overridesDir).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// CLI entry: default args (no flags)
// ---------------------------------------------------------------------------

describe('CLI entry: default args', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('node scripts/check-overrides.js with default dirs exits 0 (zero overrides)', () => {
    // Default overrides/ dir in the repo has only .gitkeep
    const result = runCheckOverridesCli([], { cwd: PROJECT_ROOT });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Override staleness report');
  });

  test('CLI with --overrides-dir pointing to fixture with violations exits 1', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: 'updated content' }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'fork content',
          reasonHash: computeHash('old content'), // stale hash
          reasonVersion: 'v1.29.0',
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli([
      '--overrides-dir',
      fixture.overridesDir,
      '--upstream-dir',
      fixture.upstreamDir,
    ]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('STALE');
  });

  test('CLI with --overrides-dir pointing to fresh overrides exits 0', () => {
    const fixture = createFixture({
      upstreamFiles: [{ relPath: 'lib/config.cjs', content: 'upstream content' }],
      overrideFiles: [
        {
          relPath: 'lib/config.cjs',
          content: 'fork content',
          // no reasonHash = uses current upstream hash (fresh)
        },
      ],
    });
    tmpDir = fixture.tmpDir;

    const result = runCheckOverridesCli([
      '--overrides-dir',
      fixture.overridesDir,
      '--upstream-dir',
      fixture.upstreamDir,
    ]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });
});

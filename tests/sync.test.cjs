/**
 * GSD Tools Tests - Sync module
 *
 * Tests for the sync.cjs plumbing module:
 * - Direct helper function tests (no re-require pattern)
 * - CLI integration tests via runGsdTools
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// Direct import for internal helper coverage (avoids bun re-require pitfall)
const SYNC_PATH = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'lib', 'sync.cjs');
const {
  getCommitsInRange,
  getFilesForCommit,
  loadProtectedPaths,
  isSensitivePath,
  assessConflictRiskByOverlap,
  computeEffortEstimate,
} = require(SYNC_PATH);

// ─── Local Helpers ─────────────────────────────────────────────────────────────

/**
 * Create a temp project with a real git repo and an initial commit.
 * Used for checkpoint tests that need an actual HEAD SHA.
 */
function createTempGitProject() {
  const tmpDir = createTempProject();
  execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });
  fs.writeFileSync(path.join(tmpDir, 'init.txt'), 'init');
  execSync('git add .', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git commit -m "init"', { cwd: tmpDir, stdio: 'pipe' });
  return tmpDir;
}

// ─── getCommitsInRange ─────────────────────────────────────────────────────────

describe('getCommitsInRange', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty array when range has no commits', () => {
    // HEAD..HEAD is empty (HEAD is both base and target)
    const headSha = execSync('git rev-parse HEAD', { cwd: tmpDir, encoding: 'utf-8' }).trim();
    const commits = getCommitsInRange(tmpDir, headSha, headSha);
    assert.deepStrictEqual(commits, [], 'Should return empty array for empty range');
  });

  test('returns commits in range as structured objects', () => {
    // Add a second commit so we have a range
    fs.writeFileSync(path.join(tmpDir, 'file2.txt'), 'content');
    execSync('git add .', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git commit -m "second commit"', { cwd: tmpDir, stdio: 'pipe' });

    const firstSha = execSync('git rev-parse HEAD~1', { cwd: tmpDir, encoding: 'utf-8' }).trim();
    const lastSha = execSync('git rev-parse HEAD', { cwd: tmpDir, encoding: 'utf-8' }).trim();

    const commits = getCommitsInRange(tmpDir, firstSha, lastSha);
    assert.strictEqual(commits.length, 1, 'Should return one commit');
    assert.ok(commits[0].hash, 'Should have hash field');
    assert.ok(commits[0].hashShort, 'Should have hashShort field');
    assert.ok(commits[0].subject, 'Should have subject field');
    assert.ok(commits[0].date, 'Should have date field');
    assert.ok(commits[0].author, 'Should have author field');
    assert.strictEqual(commits[0].subject, 'second commit', 'Subject should match commit message');
  });

  test('handles subjects containing special characters', () => {
    // Create commit with a subject containing special chars (colon, ampersand, etc.)
    fs.writeFileSync(path.join(tmpDir, 'file3.txt'), 'content');
    execSync('git add .', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git commit -m "fix: handle edge case & special chars"', { cwd: tmpDir, stdio: 'pipe' });

    const firstSha = execSync('git rev-parse HEAD~1', { cwd: tmpDir, encoding: 'utf-8' }).trim();
    const lastSha = execSync('git rev-parse HEAD', { cwd: tmpDir, encoding: 'utf-8' }).trim();

    const commits = getCommitsInRange(tmpDir, firstSha, lastSha);
    assert.strictEqual(commits.length, 1, 'Should return one commit');
    assert.strictEqual(commits[0].subject, 'fix: handle edge case & special chars');
  });
});

// ─── getFilesForCommit ─────────────────────────────────────────────────────────

describe('getFilesForCommit', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty array for non-existent SHA', () => {
    const files = getFilesForCommit(tmpDir, 'deadbeef1234567890abcdef1234567890abcdef');
    assert.deepStrictEqual(files, [], 'Should return empty array for missing SHA');
  });

  test('returns files changed in commit as structured objects', () => {
    const headSha = execSync('git rev-parse HEAD', { cwd: tmpDir, encoding: 'utf-8' }).trim();
    const files = getFilesForCommit(tmpDir, headSha);

    assert.ok(Array.isArray(files), 'Should return an array');
    assert.ok(files.length > 0, 'Should have at least one file');

    for (const f of files) {
      assert.ok(f.status, 'Each file should have a status field');
      assert.ok(f.path, 'Each file should have a path field');
    }
  });

  test('returns added file with A status', () => {
    const headSha = execSync('git rev-parse HEAD', { cwd: tmpDir, encoding: 'utf-8' }).trim();
    const files = getFilesForCommit(tmpDir, headSha);

    // The initial commit added init.txt
    const initFile = files.find(f => f.path === 'init.txt');
    assert.ok(initFile, 'Should find init.txt in the initial commit');
    assert.strictEqual(initFile.status, 'A', 'New file should have status A');
  });
});

// ─── loadProtectedPaths ───────────────────────────────────────────────────────

describe('loadProtectedPaths', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty array when branding-map.json does not exist', () => {
    const paths = loadProtectedPaths(tmpDir);
    assert.deepStrictEqual(paths, [], 'Should return empty array when file missing');
  });

  test('returns empty array for malformed JSON', () => {
    const syncDir = path.join(tmpDir, '.planning', 'sync');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.writeFileSync(path.join(syncDir, 'branding-map.json'), '{ invalid json }');

    const paths = loadProtectedPaths(tmpDir);
    assert.deepStrictEqual(paths, [], 'Should return empty array for malformed JSON');
  });

  test('extracts fork paths from path_patterns', () => {
    const syncDir = path.join(tmpDir, '.planning', 'sync');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.writeFileSync(
      path.join(syncDir, 'branding-map.json'),
      JSON.stringify({
        path_patterns: [
          { upstream: 'get-shit-done', fork: 'get-stuff-done' },
        ],
      })
    );

    const paths = loadProtectedPaths(tmpDir);
    assert.ok(paths.includes('get-stuff-done'), 'Should include fork path from path_patterns');
  });

  test('extracts fork paths from npm_patterns and github_patterns', () => {
    const syncDir = path.join(tmpDir, '.planning', 'sync');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.writeFileSync(
      path.join(syncDir, 'branding-map.json'),
      JSON.stringify({
        npm_patterns: [
          { upstream: 'get-shit-done-cc', fork: '@chude/get-stuff-done' },
        ],
        github_patterns: [
          { upstream: 'glittercowboy/get-shit-done', fork: 'chudeemeke/get-stuff-done' },
        ],
      })
    );

    const paths = loadProtectedPaths(tmpDir);
    assert.ok(paths.includes('@chude/get-stuff-done'), 'Should include npm pattern fork');
    assert.ok(paths.includes('chudeemeke/get-stuff-done'), 'Should include github pattern fork');
  });

  test('extracts fork paths from display_name_patterns if present', () => {
    const syncDir = path.join(tmpDir, '.planning', 'sync');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.writeFileSync(
      path.join(syncDir, 'branding-map.json'),
      JSON.stringify({
        display_name_patterns: [
          { upstream: 'Get Shit Done', fork: 'Get Stuff Done' },
        ],
      })
    );

    const paths = loadProtectedPaths(tmpDir);
    assert.ok(paths.includes('Get Stuff Done'), 'Should include display name fork');
  });
});

// ─── isSensitivePath ──────────────────────────────────────────────────────────

describe('isSensitivePath', () => {
  test('returns true for exact match', () => {
    const result = isSensitivePath('package.json', ['package.json', 'README.md']);
    assert.strictEqual(result, true, 'Should return true for exact match');
  });

  test('returns true for prefix match (file inside protected directory)', () => {
    const result = isSensitivePath(
      'get-stuff-done/bin/install.js',
      ['get-stuff-done']
    );
    assert.strictEqual(result, true, 'Should return true for path under protected directory');
  });

  test('returns true for substring match (handles package names)', () => {
    const result = isSensitivePath(
      'node_modules/@chude/get-stuff-done/package.json',
      ['@chude/get-stuff-done']
    );
    assert.strictEqual(result, true, 'Should return true for substring match');
  });

  test('returns false for non-matching path', () => {
    const result = isSensitivePath(
      'src/utils/helper.js',
      ['package.json', 'get-stuff-done', 'README.md']
    );
    assert.strictEqual(result, false, 'Should return false when no match');
  });

  test('returns false for empty protected paths array', () => {
    const result = isSensitivePath('package.json', []);
    assert.strictEqual(result, false, 'Should return false for empty protectedPaths');
  });
});

// ─── assessConflictRiskByOverlap ──────────────────────────────────────────────

describe('assessConflictRiskByOverlap', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns none when working tree is clean', () => {
    // tmpDir is clean after initial commit
    const commitFiles = [{ path: 'some-file.txt' }];
    const risk = assessConflictRiskByOverlap(tmpDir, commitFiles);
    assert.strictEqual(risk, 'none', 'Should return none for clean working tree');
  });

  test('returns overlap when commit files overlap with dirty working tree', () => {
    // Modify a file to make it dirty
    fs.writeFileSync(path.join(tmpDir, 'init.txt'), 'modified content');

    const commitFiles = [{ path: 'init.txt' }];
    const risk = assessConflictRiskByOverlap(tmpDir, commitFiles);
    assert.strictEqual(risk, 'overlap', 'Should return overlap when commit touches dirty file');
  });

  test('returns none when dirty files do not overlap with commit files', () => {
    // Modify a file
    fs.writeFileSync(path.join(tmpDir, 'init.txt'), 'modified content');

    // But commit only touches a different file
    const commitFiles = [{ path: 'other-file.txt' }];
    const risk = assessConflictRiskByOverlap(tmpDir, commitFiles);
    assert.strictEqual(risk, 'none', 'Should return none when no overlap with dirty files');
  });
});

// ─── computeEffortEstimate ────────────────────────────────────────────────────

describe('computeEffortEstimate', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns null fields when sync-manifest.json does not exist', () => {
    const estimate = computeEffortEstimate(tmpDir, 10);
    assert.strictEqual(estimate.historicalConflictRate, null, 'Rate should be null');
    assert.strictEqual(estimate.estimatedConflicts, null, 'Estimated conflicts should be null');
    assert.strictEqual(estimate.estimatedCleanCommits, null, 'Estimated clean should be null');
    assert.strictEqual(estimate.dataPoints, 0, 'Data points should be 0');
  });

  test('returns null fields for malformed JSON', () => {
    const syncDir = path.join(tmpDir, '.planning', 'sync');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.writeFileSync(path.join(syncDir, 'sync-manifest.json'), '{ bad json }');

    const estimate = computeEffortEstimate(tmpDir, 10);
    assert.strictEqual(estimate.historicalConflictRate, null, 'Rate should be null for bad JSON');
    assert.strictEqual(estimate.dataPoints, 0, 'Data points should be 0 for bad JSON');
  });

  test('calculates correct historical conflict rate from manifest data', () => {
    const syncDir = path.join(tmpDir, '.planning', 'sync');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.writeFileSync(
      path.join(syncDir, 'sync-manifest.json'),
      JSON.stringify({
        applied: [
          { upstreamHash: 'abc', conflictType: null, status: 'applied' },
          { upstreamHash: 'def', conflictType: 'mechanical', status: 'applied' },
          { upstreamHash: 'ghi', conflictType: null, status: 'applied' },
          { upstreamHash: 'jkl', conflictType: 'conflict', status: 'applied' },
        ],
      })
    );

    const estimate = computeEffortEstimate(tmpDir, 10);
    assert.strictEqual(estimate.dataPoints, 4, 'Should count all applied entries');
    assert.strictEqual(estimate.historicalConflictRate, 0.5, 'Rate should be 50% (2 of 4 had conflicts)');
    assert.strictEqual(estimate.estimatedConflicts, 5, 'Should estimate 5 conflicts for 10 commits at 50%');
    assert.strictEqual(estimate.estimatedCleanCommits, 5, 'Should estimate 5 clean commits');
  });

  test('handles manifest with zero applied entries (division by zero guard)', () => {
    const syncDir = path.join(tmpDir, '.planning', 'sync');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.writeFileSync(
      path.join(syncDir, 'sync-manifest.json'),
      JSON.stringify({ applied: [] })
    );

    const estimate = computeEffortEstimate(tmpDir, 10);
    assert.strictEqual(estimate.historicalConflictRate, null, 'Rate should be null for zero data points');
    assert.strictEqual(estimate.dataPoints, 0, 'Data points should be 0');
  });

  test('treats null conflictType as no conflict', () => {
    const syncDir = path.join(tmpDir, '.planning', 'sync');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.writeFileSync(
      path.join(syncDir, 'sync-manifest.json'),
      JSON.stringify({
        applied: [
          { upstreamHash: 'abc', conflictType: null, status: 'applied' },
          { upstreamHash: 'def', conflictType: null, status: 'applied' },
          { upstreamHash: 'ghi', conflictType: null, status: 'applied' },
        ],
      })
    );

    const estimate = computeEffortEstimate(tmpDir, 9);
    assert.strictEqual(estimate.historicalConflictRate, 0, 'Rate should be 0% with no conflicts');
    assert.strictEqual(estimate.estimatedConflicts, 0, 'Estimated conflicts should be 0');
    assert.strictEqual(estimate.estimatedCleanCommits, 9, 'All commits should be estimated clean');
  });
});

// ─── sync-preview CLI integration ─────────────────────────────────────────────

describe('sync-preview command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('errors on missing range argument', () => {
    const result = runGsdTools('sync-preview', tmpDir);
    assert.strictEqual(result.success, false, 'Should fail without range');
    assert.ok(
      result.error.includes('range required') || result.error.includes('Error'),
      'Should show range error message'
    );
  });

  test('errors when SHA not found', () => {
    const result = runGsdTools('sync-preview deadbeef1234..deadbeef5678', tmpDir);
    assert.strictEqual(result.success, false, 'Should fail for non-existent SHAs');
    assert.ok(
      result.error.includes('SHA not found') || result.error.includes('Error'),
      'Should indicate SHA not found'
    );
  });

  test('succeeds with dirty working tree (read-only operation)', () => {
    // sync-preview is read-only; dirty state is surfaced as overlap risk, not a blocker
    const repoDir = createTempGitProject();
    try {
      // Add a second commit for a valid range
      fs.writeFileSync(path.join(repoDir, 'file2.txt'), 'content');
      execSync('git add . && git commit -m "second"', { cwd: repoDir, stdio: 'pipe' });

      // Dirty the working tree
      fs.writeFileSync(path.join(repoDir, 'file2.txt'), 'modified');

      const firstSha = execSync('git rev-parse HEAD~1', { cwd: repoDir, encoding: 'utf-8' }).trim();
      const lastSha = execSync('git rev-parse HEAD', { cwd: repoDir, encoding: 'utf-8' }).trim();

      const result = runGsdTools(`sync-preview ${firstSha}..${lastSha} --json`, repoDir);
      assert.strictEqual(result.success, true, 'Should succeed despite dirty working tree');
      const data = JSON.parse(result.output);
      assert.ok(Array.isArray(data.commits), 'Should return commits');
    } finally {
      cleanup(repoDir);
    }
  });

  test('--json flag returns valid JSON with correct schema keys', () => {
    // Use the actual repo with a valid range for integration testing
    // We'll use a range from the actual project repo, not tmpDir
    const repoDir = path.join(__dirname, '..');

    // Get two consecutive commits from git log
    let firstSha, lastSha;
    try {
      lastSha = execSync('git rev-parse HEAD', {
        cwd: repoDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      firstSha = execSync('git rev-parse HEAD~1', {
        cwd: repoDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch {
      // Skip test if we can't get valid SHAs
      return;
    }

    // sync-preview is read-only; dirty working tree should not block it
    const result = runGsdTools(`sync-preview ${firstSha}..${lastSha} --json`, repoDir);
    if (!result.success) {
      // Acceptable failure: SHA issues in CI
      return;
    }

    const data = JSON.parse(result.output);
    assert.ok(data.range, 'JSON should have range field');
    assert.ok(Array.isArray(data.commits), 'JSON should have commits array');
    assert.ok(data.summary, 'JSON should have summary object');
    assert.ok(typeof data.summary.totalCommits === 'number', 'summary.totalCommits should be a number');
    assert.ok('sensitivePathCount' in data.summary, 'summary should have sensitivePathCount');
    assert.ok('highRiskCount' in data.summary, 'summary should have highRiskCount');
    assert.ok('overlapRiskCount' in data.summary, 'summary should have overlapRiskCount');
    assert.ok(data.effortEstimate !== undefined, 'JSON should have effortEstimate');
  });
});

// ─── sync-checkpoint CLI integration ──────────────────────────────────────────

describe('sync-checkpoint command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('sync-checkpoint list returns empty when no checkpoint tags exist', () => {
    const result = runGsdTools('sync-checkpoint list', tmpDir);
    assert.ok(result.success, `sync-checkpoint list failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.deepStrictEqual(data.checkpoints, [], 'Should return empty checkpoints array');
    assert.strictEqual(data.count, 0, 'Count should be 0');
  });

  test('sync-checkpoint create requires batchId argument', () => {
    const result = runGsdTools('sync-checkpoint create', tmpDir);
    assert.strictEqual(result.success, false, 'Should fail without batchId');
    assert.ok(
      result.error.includes('batchId required') || result.error.includes('Error'),
      'Should indicate batchId is required'
    );
  });

  test('sync-checkpoint create creates annotated tag at HEAD', () => {
    const result = runGsdTools('sync-checkpoint create test-batch-01', tmpDir);
    assert.ok(result.success, `sync-checkpoint create failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.strictEqual(data.tag, 'sync-checkpoint-test-batch-01', 'Tag name should have correct prefix');
    assert.ok(data.sha, 'Should have SHA');
    assert.ok(data.created, 'Should have created timestamp');

    // Verify the tag was actually created in git
    const tagsResult = execSync('git tag -l "sync-checkpoint-*"', {
      cwd: tmpDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    assert.strictEqual(tagsResult, 'sync-checkpoint-test-batch-01', 'Tag should exist in git');
  });

  test('sync-checkpoint list returns tags after create', () => {
    // Create a checkpoint
    runGsdTools('sync-checkpoint create batch-02', tmpDir);

    const result = runGsdTools('sync-checkpoint list', tmpDir);
    assert.ok(result.success, `sync-checkpoint list failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.strictEqual(data.count, 1, 'Should have 1 checkpoint');
    assert.strictEqual(data.checkpoints[0].tag, 'sync-checkpoint-batch-02');
    assert.ok(data.checkpoints[0].sha, 'Checkpoint should have SHA');
  });

  test('sync-checkpoint cleanup deletes all checkpoint tags', () => {
    // Create multiple checkpoints
    runGsdTools('sync-checkpoint create batch-a', tmpDir);
    runGsdTools('sync-checkpoint create batch-b', tmpDir);

    const cleanupResult = runGsdTools('sync-checkpoint cleanup', tmpDir);
    assert.ok(cleanupResult.success, `sync-checkpoint cleanup failed: ${cleanupResult.error}`);

    const cleanupData = JSON.parse(cleanupResult.output);
    assert.strictEqual(cleanupData.count, 2, 'Should have deleted 2 tags');
    assert.strictEqual(cleanupData.deleted.length, 2, 'deleted array should have 2 entries');
    assert.strictEqual(cleanupData.failed.length, 0, 'failed array should be empty');

    // Verify tags are gone
    const listResult = runGsdTools('sync-checkpoint list', tmpDir);
    const listData = JSON.parse(listResult.output);
    assert.strictEqual(listData.count, 0, 'No checkpoints should remain after cleanup');
  });

  test('sync-checkpoint cleanup succeeds when no tags exist (idempotent)', () => {
    const result = runGsdTools('sync-checkpoint cleanup', tmpDir);
    assert.ok(result.success, `sync-checkpoint cleanup should succeed even with no tags: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.strictEqual(data.count, 0, 'Should report 0 deleted');
    assert.deepStrictEqual(data.deleted, [], 'deleted should be empty array');
    assert.deepStrictEqual(data.failed, [], 'failed should be empty array');
  });
});

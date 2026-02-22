/**
 * GSD Tools Tests — Schema validation for history-digest command
 */

const { test, describe, beforeEach, afterEach, beforeAll, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const TOOLS_PATH = path.join(PROJECT_ROOT, 'get-stuff-done', 'bin', 'gsd-tools.js');
const DIST_TOOLS_PATH = path.join(PROJECT_ROOT, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.js');

// Auto-build dist if missing (CI support after fresh checkout)
beforeAll(() => {
  if (!fs.existsSync(DIST_TOOLS_PATH)) {
    execSync('node scripts/build.js', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  }
});

// Helper to run gsd-tools command
function runGsdTools(args, cwd = process.cwd()) {
  try {
    const result = execSync(`node "${TOOLS_PATH}" ${args}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString().trim() || '',
      error: err.stderr?.toString().trim() || err.message,
    };
  }
}

// Create temp directory structure
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe('history-digest command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty phases directory returns valid schema', () => {
    const result = runGsdTools('history-digest', tmpDir);
    expect(result.success).toBe(true);

    const digest = JSON.parse(result.output);

    expect(digest.phases).toEqual({});
    expect(digest.decisions).toEqual([]);
    expect(digest.tech_stack).toEqual([]);
  });

  test('nested frontmatter fields extracted correctly', () => {
    // Create phase directory with SUMMARY containing nested frontmatter
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    const summaryContent = `---
phase: "01"
name: "Foundation Setup"
dependency-graph:
  provides:
    - "Database schema"
    - "Auth system"
  affects:
    - "API layer"
tech-stack:
  added:
    - "prisma"
    - "jose"
patterns-established:
  - "Repository pattern"
  - "JWT auth flow"
key-decisions:
  - "Use Prisma over Drizzle"
  - "JWT in httpOnly cookies"
---

# Summary content here
`;

    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), summaryContent);

    const result = runGsdTools('history-digest', tmpDir);
    expect(result.success).toBe(true);

    const digest = JSON.parse(result.output);

    // Check nested dependency-graph.provides
    expect(digest.phases['01']).toBeTruthy();
    expect(digest.phases['01'].provides.sort()).toEqual(['Auth system', 'Database schema']);

    // Check nested dependency-graph.affects
    expect(digest.phases['01'].affects).toEqual(['API layer']);

    // Check nested tech-stack.added
    expect(digest.tech_stack.sort()).toEqual(['jose', 'prisma']);

    // Check patterns-established (flat array)
    expect(digest.phases['01'].patterns.sort()).toEqual(['JWT auth flow', 'Repository pattern']);

    // Check key-decisions
    expect(digest.decisions.length).toBe(2);
    expect(
      digest.decisions.some(d => d.decision === 'Use Prisma over Drizzle')
    ).toBe(true);
  });

  test('multiple phases merged into single digest', () => {
    // Create phase 01
    const phase01Dir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phase01Dir, { recursive: true });
    fs.writeFileSync(
      path.join(phase01Dir, '01-01-SUMMARY.md'),
      `---
phase: "01"
name: "Foundation"
provides:
  - "Database"
patterns-established:
  - "Pattern A"
key-decisions:
  - "Decision 1"
---
`
    );

    // Create phase 02
    const phase02Dir = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(phase02Dir, { recursive: true });
    fs.writeFileSync(
      path.join(phase02Dir, '02-01-SUMMARY.md'),
      `---
phase: "02"
name: "API"
provides:
  - "REST endpoints"
patterns-established:
  - "Pattern B"
key-decisions:
  - "Decision 2"
tech-stack:
  added:
    - "zod"
---
`
    );

    const result = runGsdTools('history-digest', tmpDir);
    expect(result.success).toBe(true);

    const digest = JSON.parse(result.output);

    // Both phases present
    expect(digest.phases['01']).toBeTruthy();
    expect(digest.phases['02']).toBeTruthy();

    // Decisions merged
    expect(digest.decisions.length).toBe(2);

    // Tech stack merged
    expect(digest.tech_stack).toEqual(['zod']);
  });

  test('malformed SUMMARY.md skipped gracefully', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    // Valid summary
    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides:
  - "Valid feature"
---
`
    );

    // Malformed summary (no frontmatter)
    fs.writeFileSync(
      path.join(phaseDir, '01-02-SUMMARY.md'),
      `# Just a heading
No frontmatter here
`
    );

    // Another malformed summary (broken YAML)
    fs.writeFileSync(
      path.join(phaseDir, '01-03-SUMMARY.md'),
      `---
broken: [unclosed
---
`
    );

    const result = runGsdTools('history-digest', tmpDir);
    expect(result.success).toBe(true);

    const digest = JSON.parse(result.output);
    expect(digest.phases['01']).toBeTruthy();
    expect(
      digest.phases['01'].provides.includes('Valid feature')
    ).toBe(true);
  });

  test('flat provides field still works (backward compatibility)', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides:
  - "Direct provides"
---
`
    );

    const result = runGsdTools('history-digest', tmpDir);
    expect(result.success).toBe(true);

    const digest = JSON.parse(result.output);
    expect(digest.phases['01'].provides).toEqual(['Direct provides']);
  });

  test('inline array syntax supported', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides: [Feature A, Feature B]
patterns-established: ["Pattern X", "Pattern Y"]
---
`
    );

    const result = runGsdTools('history-digest', tmpDir);
    expect(result.success).toBe(true);

    const digest = JSON.parse(result.output);
    expect(digest.phases['01'].provides.sort()).toEqual(['Feature A', 'Feature B']);
    expect(digest.phases['01'].patterns.sort()).toEqual(['Pattern X', 'Pattern Y']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phases list command
// ─────────────────────────────────────────────────────────────────────────────

describe('phases list command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty phases directory returns empty array', () => {
    const result = runGsdTools('phases list', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.directories).toEqual([]);
    expect(output.count).toBe(0);
  });

  test('lists phase directories sorted numerically', () => {
    // Create out-of-order directories
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '10-final'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });

    const result = runGsdTools('phases list', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.count).toBe(3);
    expect(output.directories).toEqual(['01-foundation', '02-api', '10-final']);
  });

  test('handles decimal phases in sort order', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02.1-hotfix'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02.2-patch'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-ui'), { recursive: true });

    const result = runGsdTools('phases list', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.directories).toEqual(['02-api', '02.1-hotfix', '02.2-patch', '03-ui']);
  });

  test('--type plans lists only PLAN.md files', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan 1');
    fs.writeFileSync(path.join(phaseDir, '01-02-PLAN.md'), '# Plan 2');
    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary');
    fs.writeFileSync(path.join(phaseDir, 'RESEARCH.md'), '# Research');

    const result = runGsdTools('phases list --type plans', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.files.sort()).toEqual(['01-01-PLAN.md', '01-02-PLAN.md']);
  });

  test('--type summaries lists only SUMMARY.md files', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary 1');
    fs.writeFileSync(path.join(phaseDir, '01-02-SUMMARY.md'), '# Summary 2');

    const result = runGsdTools('phases list --type summaries', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.files.sort()).toEqual(['01-01-SUMMARY.md', '01-02-SUMMARY.md']);
  });

  test('--phase filters to specific phase directory', () => {
    const phase01 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    const phase02 = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(phase01, { recursive: true });
    fs.mkdirSync(phase02, { recursive: true });
    fs.writeFileSync(path.join(phase01, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phase02, '02-01-PLAN.md'), '# Plan');

    const result = runGsdTools('phases list --type plans --phase 01', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.files).toEqual(['01-01-PLAN.md']);
    expect(output.phase_dir).toBe('foundation');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// roadmap get-phase command
// ─────────────────────────────────────────────────────────────────────────────

describe('roadmap get-phase command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('extracts phase section from ROADMAP.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phases

### Phase 1: Foundation
**Goal:** Set up project infrastructure
**Plans:** 2 plans

Some description here.

### Phase 2: API
**Goal:** Build REST API
**Plans:** 3 plans
`
    );

    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.found).toBe(true);
    expect(output.phase_number).toBe('1');
    expect(output.phase_name).toBe('Foundation');
    expect(output.goal).toBe('Set up project infrastructure');
  });

  test('returns not found for missing phase', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Set up project
`
    );

    const result = runGsdTools('roadmap get-phase 5', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.found).toBe(false);
  });

  test('handles decimal phase numbers', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 2: Main
**Goal:** Main work

### Phase 2.1: Hotfix
**Goal:** Emergency fix
`
    );

    const result = runGsdTools('roadmap get-phase 2.1', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.found).toBe(true);
    expect(output.phase_name).toBe('Hotfix');
    expect(output.goal).toBe('Emergency fix');
  });

  test('extracts full section content', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Setup
**Goal:** Initialize everything

This phase covers:
- Database setup
- Auth configuration
- CI/CD pipeline

### Phase 2: Build
**Goal:** Build features
`
    );

    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.section.includes('Database setup')).toBe(true);
    expect(output.section.includes('CI/CD pipeline')).toBe(true);
    expect(output.section.includes('Phase 2')).toBe(false);
  });

  test('handles missing ROADMAP.md gracefully', () => {
    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.found).toBe(false);
    expect(output.error).toBe('ROADMAP.md not found');
  });

  test('accepts ## phase headers (two hashes)', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phase 1: Foundation
**Goal:** Set up project infrastructure
**Plans:** 2 plans

## Phase 2: API
**Goal:** Build REST API
`
    );

    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.found).toBe(true);
    expect(output.phase_name).toBe('Foundation');
    expect(output.goal).toBe('Set up project infrastructure');
  });

  test('detects malformed ROADMAP with summary list but no detail sections', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phases

- [ ] **Phase 1: Foundation** - Set up project
- [ ] **Phase 2: API** - Build REST API
`
    );

    const result = runGsdTools('roadmap get-phase 1', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.found).toBe(false);
    expect(output.error).toBe('malformed_roadmap');
    expect(output.message).toContain('missing');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phase next-decimal command
// ─────────────────────────────────────────────────────────────────────────────

describe('phase next-decimal command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns X.1 when no decimal phases exist', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '07-next'), { recursive: true });

    const result = runGsdTools('phase next-decimal 06', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.next).toBe('06.1');
    expect(output.existing).toEqual([]);
  });

  test('increments from existing decimal phases', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.1-hotfix'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.2-patch'), { recursive: true });

    const result = runGsdTools('phase next-decimal 06', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.next).toBe('06.3');
    expect(output.existing).toEqual(['06.1', '06.2']);
  });

  test('handles gaps in decimal sequence', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.1-first'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.3-third'), { recursive: true });

    const result = runGsdTools('phase next-decimal 06', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    // Should take next after highest, not fill gap
    expect(output.next).toBe('06.4');
  });

  test('handles single-digit phase input', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });

    const result = runGsdTools('phase next-decimal 6', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.next).toBe('06.1');
    expect(output.base_phase).toBe('06');
  });

  test('returns error if base phase does not exist', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-start'), { recursive: true });

    const result = runGsdTools('phase next-decimal 06', tmpDir);
    expect(result.success).toBe(true);

    const output = JSON.parse(result.output);
    expect(output.found).toBe(false);
    expect(output.next).toBe('06.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validation wiring
// ─────────────────────────────────────────────────────────────────────────────

describe('validation wiring', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('gsd-tools.js imports all validators from src/validation', () => {
    const source = fs.readFileSync(TOOLS_PATH, 'utf-8');
    expect(source).toMatch(/require\(['"].*src\/validation['"]\)/);
    expect(source).toMatch(/validateGitSHA/);
    expect(source).toMatch(/validateBranchName/);
    expect(source).toMatch(/validateConfigPath/);
    expect(source).toMatch(/validateTagName/);
    expect(source).toMatch(/validateRemoteURL/);
  });

  test('gsd-tools.js has requireValid bridge with explicit process.exit(1)', () => {
    const source = fs.readFileSync(TOOLS_PATH, 'utf-8');
    expect(source).toMatch(/function requireValid\(result\)/);
    // requireValid must contain both error() call and explicit process.exit(1)
    const requireValidMatch = source.match(/function requireValid\(result\)\s*\{[^}]+\}/s);
    expect(requireValidMatch).not.toBeNull();
    const requireValidBody = requireValidMatch[0];
    expect(requireValidBody).toMatch(/error\(/);
    expect(requireValidBody).toMatch(/process\.exit\(1\)/);
  });

  test('verify-summary command wires validateGitSHA through requireValid', () => {
    const source = fs.readFileSync(TOOLS_PATH, 'utf-8');
    expect(source).toMatch(/requireValid\(validateGitSHA\(/);
  });

  test('commit command rejects file paths outside project root (path traversal)', () => {
    // Initialize a real git repo so cmdCommit can function
    execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });

    // Attempt to stage a file path that traverses outside the project root
    const result = runGsdTools('commit "test msg" --files ../../etc/passwd', tmpDir);

    // Should fail with an error about invalid file path or path traversal
    expect(result.success).toBe(false);
    const combinedOutput = (result.output + ' ' + result.error).toLowerCase();
    expect(
      combinedOutput.includes('invalid file path') || combinedOutput.includes('path traversal')
    ).toBe(true);
  });

  test('ConfigLoader.js imports validateConfigPath from validation module', () => {
    const configLoaderPath = path.join(__dirname, '..', 'src', 'config', 'ConfigLoader.js');
    const source = fs.readFileSync(configLoaderPath, 'utf-8');
    expect(source).toMatch(/require\(['"].*validation['"]\)/);
    expect(source).toMatch(/validateConfigPath/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// dist: bundled gsd-tools.js regression guard (GAP-1)
// ─────────────────────────────────────────────────────────────────────────────

describe('dist: gsd-tools bundled (regression guard for GAP-1)', () => {
  test('bundled gsd-tools.js exists and is a non-trivial bundle', () => {
    expect(fs.existsSync(DIST_TOOLS_PATH)).toBe(true);
    const size = fs.statSync(DIST_TOOLS_PATH).size;
    expect(size).toBeGreaterThan(10 * 1024); // >10KB confirms bundling, not empty file
  });

  test('bundled gsd-tools.js contains no relative src/ require paths', () => {
    const content = fs.readFileSync(DIST_TOOLS_PATH, 'utf-8');
    expect(content).not.toMatch(/require\(['"]\.\.\/\.\.\/src\//);
  });

  test('bundled gsd-tools.js resolves without MODULE_NOT_FOUND from isolated dir', () => {
    // Run from a temp dir that lacks src/ to simulate post-install environment
    const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-dist-test-'));
    try {
      const result = execSync(`node "${DIST_TOOLS_PATH}" generate-slug "test text"`, {
        cwd: tmpDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const output = JSON.parse(result.trim());
      expect(output.slug).toBe('test-text');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('bundled gsd-tools.js validation commands work from isolated dir', () => {
    // verify-summary exercises validateGitSHA -- the exact function that triggered GAP-1
    const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-dist-val-'));
    try {
      // Use frontmatter validate with a minimal input file -- validation module must be loaded
      const result = execSync(
        `node "${DIST_TOOLS_PATH}" frontmatter validate "${DIST_TOOLS_PATH}" --schema plan`,
        {
          cwd: tmpDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );
      // The command should execute (validation module loaded) even if result is invalid schema
      const output = JSON.parse(result.trim());
      expect(output).toHaveProperty('valid');
    } catch (err) {
      // If frontmatter command doesn't exist, that's ok -- what matters is NOT a MODULE_NOT_FOUND error
      // A 'Unknown command' error means validation module WAS loaded (it got past require())
      const errOutput = err.stderr?.toString() || err.message;
      expect(errOutput).not.toMatch(/MODULE_NOT_FOUND/);
      expect(errOutput).not.toMatch(/Cannot find module/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

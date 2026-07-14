'use strict';

/**
 * tests/test-config-hygiene.test.js
 *
 * Meta-test: assert invariants of test-config and test-discovery scope.
 *
 * STRUCTURAL PREVENTION for the upstream-discovery failure mode that
 * caused 538+87 CI failures on PR #3 (Phase 40.5 Waves 1.5a + 1.5c, 2026-04-30).
 *
 * Failure mode this test prevents:
 *   1. Upstream package ships .test.* and ESM-syntax files inside its npm tarball
 *      (e.g. legacy get-shit-done-cc@1.38.5 shipped 77 .test.ts files in sdk/src/...).
 *   2. `bun run compose` copies node_modules/<upstream>/ to dist/.
 *   3. Tooling configured for the fork's CommonJS context (bun-test, eslint with
 *      sourceType:'commonjs') discovers files in dist/ and either runs them as
 *      tests they aren't (fixtures/paths missing) or parses them as the wrong
 *      module type (ESM import/export rejected by CJS parser).
 *
 * Categorical fix: every tool has an explicit, supported discovery boundary.
 *   - bunfig.toml [test].root is `tests`
 *   - bunfig.toml [test].pathIgnorePatterns excludes Node-native `.test.cjs`
 *   - eslint.config.js ignores includes "dist/double-star"
 * This meta-test asserts those invariants are preserved AND that no test files
 * exist in dist/ at test time.
 *
 * If this test fails: someone removed an exclusion or compose accidentally
 * preserved upstream content. The failure message points at the file to fix.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { describe, test, expect } = require('bun:test');
const { expandJobMatrices } = require('../scripts/verify-hosted-ci');

const PROJECT_ROOT = path.join(__dirname, '..');
const TESTS_DIR = __dirname;
const BUNFIG_PATH = path.join(PROJECT_ROOT, 'bunfig.toml');
const ESLINT_CONFIG_PATH = path.join(PROJECT_ROOT, 'eslint.config.js');
const PACKAGE_PATH = path.join(PROJECT_ROOT, 'package.json');
const GITIGNORE_PATH = path.join(PROJECT_ROOT, '.gitignore');
const HOSTED_CI_CONTRACT_PATH = path.join(
  PROJECT_ROOT,
  'config',
  'phase43-hosted-ci-contract.json'
);
const HOSTED_WORKFLOW_PATHS = [
  'ci.yml',
  'compat-matrix.yml',
  'cousin-install.yml',
  'oversight-probes.yml',
  'upgrade-verifier.yml',
].map(file => path.join(PROJECT_ROOT, '.github', 'workflows', file));
const COMPAT_CONTRACT_PATH = path.join(PROJECT_ROOT, 'tests', 'upstream-compat-contract.json');
const SYNC_GUIDANCE_PATHS = [
  path.join(PROJECT_ROOT, 'overlay', 'workflows', 'upstream-sync.md'),
  path.join(PROJECT_ROOT, 'get-stuff-done', 'workflows', 'upstream-sync.md'),
];

function readBunfig() {
  if (!fs.existsSync(BUNFIG_PATH)) {
    throw new Error(`bunfig.toml not found at ${BUNFIG_PATH}`);
  }
  return fs.readFileSync(BUNFIG_PATH, 'utf8');
}

function parseBunfig() {
  return Bun.TOML.parse(readBunfig());
}

function findTestFiles(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Don't recurse into nested node_modules
      if (entry.name === 'node_modules') continue;
      findTestFiles(fullPath, found);
    } else if (/\.(test|spec)\.(js|ts|cjs|mjs)$/.test(entry.name)) {
      found.push(fullPath);
    }
  }
  return found;
}

function cartesianRows(entries) {
  return entries.reduce(
    (rows, [key, values]) =>
      rows.flatMap(row => values.map(value => new Map([...row, [key, value]]))),
    [new Map()]
  );
}

function workflowMatrixRows(matrix) {
  const axes = Object.entries(matrix || {}).filter(
    ([key, values]) => key !== 'include' && key !== 'exclude' && Array.isArray(values)
  );
  if (matrix?.exclude || (matrix?.include && axes.length > 0)) {
    throw new Error('Hosted workflow contract test does not support mixed include/exclude matrices.');
  }
  if (Array.isArray(matrix?.include)) {
    return matrix.include.map(row => new Map(Object.entries(row)));
  }
  return cartesianRows(axes);
}

function expandWorkflowJobNames(workflow) {
  const names = [];
  for (const [jobId, job] of Object.entries(workflow.jobs || {})) {
    const template = String(job.name || jobId);
    const matrix = job.strategy?.matrix;
    if (!matrix) {
      names.push(template);
      continue;
    }
    for (const row of workflowMatrixRows(matrix)) {
      names.push(
        template.replace(/\$\{\{\s*matrix\.([A-Za-z0-9_-]+)\s*\}\}/g, (_match, key) => {
          if (!row.has(key)) throw new Error(`Workflow job ${jobId} references absent matrix key ${key}.`);
          return String(row.get(key));
        })
      );
    }
  }
  return names.sort();
}

describe('test-config hygiene (meta-test)', () => {
  test('bunfig.toml exists', () => {
    expect(fs.existsSync(BUNFIG_PATH)).toBe(true);
  });

  test('bunfig.toml has [test] section', () => {
    const content = readBunfig();
    expect(content).toMatch(/^\s*\[test\]/m);
  });

  test('bunfig.toml bounds discovery to the fork-owned tests directory', () => {
    const config = parseBunfig();
    expect(config.test.root).toBe('tests');
  });

  test('bunfig.toml uses pathIgnorePatterns for Node-native .test.cjs suites', () => {
    const config = parseBunfig();
    expect(config.test.pathIgnorePatterns).toContain('**/*.test.cjs');
    expect(config.test.preload).toContain('./tests/helpers/enforce-bun-test-authority.js');
  });

  test('bunfig.toml contains no unsupported legacy discovery keys', () => {
    const config = parseBunfig();
    expect(config.test).not.toHaveProperty('include');
    expect(config.test).not.toHaveProperty('exclude');
  });

  test('package scripts route Bun tests through the canonical adapter', () => {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
    expect(pkg.scripts.test).toBe('node scripts/run-bun-tests.js');
    expect(pkg.scripts['test:coverage:bun']).toBe('node scripts/run-bun-tests.js --coverage');
    expect(pkg.scripts).not.toHaveProperty('test:coverage');
  });

  test('hosted CI verdict uses canonical tracked immutable envelope authority', () => {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
    const contract = JSON.parse(fs.readFileSync(HOSTED_CI_CONTRACT_PATH, 'utf8'));
    const gitignore = fs.readFileSync(GITIGNORE_PATH, 'utf8');

    expect(pkg.scripts['phase43:hosted-verdict']).toBe('node scripts/verify-hosted-ci.js');
    expect(pkg.devDependencies['js-yaml']).toBe('5.2.0');
    expect(contract.evidenceDirectory).toBe('.planning/evidence/hosted');
    expect(gitignore).not.toContain('.planning/evidence/phase43-hosted-verdict.json');
    expect(gitignore).not.toContain(contract.evidenceDirectory);
  });

  test('hosted CI contract exactly matches structured workflow job topology', () => {
    const contract = JSON.parse(fs.readFileSync(HOSTED_CI_CONTRACT_PATH, 'utf8'));
    const workflows = new Map(
      HOSTED_WORKFLOW_PATHS.map(workflowPath => {
        const workflow = yaml.load(fs.readFileSync(workflowPath, 'utf8'));
        return [workflow.name, workflow];
      })
    );

    expect([...workflows.keys()].sort()).toEqual(
      contract.workflows.map(workflow => workflow.name).sort()
    );
    for (const workflowContract of contract.workflows) {
      const expectedJobs = [
        ...(workflowContract.requiredJobs || []),
        ...expandJobMatrices(workflowContract.requiredJobMatrices || []),
      ].sort();
      expect(expandWorkflowJobNames(workflows.get(workflowContract.name))).toEqual(expectedJobs);
    }
  });

  test('every repository test file has exactly one runner classification', () => {
    const testFiles = findTestFiles(TESTS_DIR)
      .map(file => path.relative(TESTS_DIR, file).replace(/\\/g, '/'))
      .sort();
    const bunFiles = testFiles.filter(file => file.endsWith('.test.js'));
    const nodeFiles = testFiles.filter(file => file.endsWith('.test.cjs'));
    const unclassified = testFiles.filter(
      file => !file.endsWith('.test.js') && !file.endsWith('.test.cjs')
    );
    const contract = JSON.parse(fs.readFileSync(COMPAT_CONTRACT_PATH, 'utf8'));
    const registeredNodeFiles = contract.suites.map(suite => suite.path).sort();

    expect(bunFiles.length).toBeGreaterThan(0);
    expect(unclassified).toEqual([]);
    expect(nodeFiles).toEqual(registeredNodeFiles);
  });

  test('shipped workflow guidance routes Bun projects through the adapter', () => {
    for (const guidancePath of SYNC_GUIDANCE_PATHS) {
      const guidance = fs.readFileSync(guidancePath, 'utf8');
      expect(guidance).toContain('bun run test 2>&1 || npm test 2>&1');
      expect(guidance).not.toContain('bun test 2>&1 || npm test 2>&1');
    }
  });

  test('zero test files exist in dist/ at test time', () => {
    const distDir = path.join(PROJECT_ROOT, 'dist');
    const testFiles = findTestFiles(distDir);
    if (testFiles.length > 0) {
      const sample = testFiles.slice(0, 5).map(p => path.relative(PROJECT_ROOT, p)).join('\n  ');
      throw new Error(
        `Found ${testFiles.length} test file(s) in dist/.\n\n` +
          `This means \`bun run compose\` copied upstream test files into dist/.\n` +
          `Even with Bun discovery rooted at tests/, having test files\n` +
          `in dist/ is a code smell — upstream packaging changed and the compose\n` +
          `pipeline should filter them out. Sample (first 5):\n  ${sample}\n\n` +
          `Fix in scripts/compose.js or upgrade pipeline filter logic.`
      );
    }
    expect(testFiles.length).toBe(0);
  });

  test('eslint.config.js ignores dist/**', () => {
    // Same dist/-discovery failure mode as bun-test, but for eslint's parser.
    // Without this exclusion, eslint with sourceType:'commonjs' chokes on the
    // ESM import/export syntax in upstream's bundled files (87 parse errors
    // on PR #3 v1.38.5 bump CI run, 2026-04-30).
    expect(fs.existsSync(ESLINT_CONFIG_PATH)).toBe(true);
    const config = require(ESLINT_CONFIG_PATH);
    expect(Array.isArray(config)).toBe(true);
    const ignoresEntry = config.find(c => Array.isArray(c.ignores));
    expect(ignoresEntry).toBeTruthy();
    expect(ignoresEntry.ignores).toContain('dist/**');
  });
});

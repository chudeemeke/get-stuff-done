'use strict';

/**
 * tests/test-file-exit-hygiene.test.js
 *
 * Meta-test: no test file may call process.exit at module scope.
 *
 * STRUCTURAL PREVENTION for issue #45 (2026-08-26). tests/sync.test.cjs called
 * process.exit(0) from a module-level guard when its symlink shim could not be
 * created. Under a shared-process runner that ends the whole run at that file
 * with rc 0 and no summary line (5 of 57 files ran); under `node --test` the
 * file "passes" with zero tests. Either way a partial run reports success.
 *
 * The guard detects direct calls, literal computed access, direct IIFEs and
 * describe callbacks. It does not perform interprocedural analysis of aliases,
 * called helpers, dynamic properties or arbitrary callback APIs. Deferred
 * handlers and child-script strings are excluded. An exit during loading is
 * the defect, whatever exit code it carries, because the
 * loader is the test runner's own process (bun) or the per-file child whose
 * clean exit is read as "no failures" (node --test).
 *
 * If this test fails: replace the module-scope exit with a skip primitive
 * (describe/test with { skip: reason }) so the runner records the skip and
 * keeps going.
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const { describe, test, expect } = require('bun:test');

const TESTS_DIR = __dirname;
const TEST_FILE_PATTERN = /\.test\.(?:js|cjs)$/;
const FUNCTION_NODE_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

// Sanity floor so a broken directory walk cannot produce a vacuous pass: the
// suite held 78 test files when this guard was written.
const MINIMUM_EXPECTED_TEST_FILES = 50;

function listTestFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'fixtures') continue;
      found.push(...listTestFiles(full));
    } else if (entry.isFile() && TEST_FILE_PATTERN.test(entry.name)) {
      found.push(full);
    }
  }
  return found.sort();
}

function parseScript(source) {
  const base = { ecmaVersion: 'latest', locations: true, allowHashBang: true };
  try {
    return acorn.parse(source, { ...base, sourceType: 'script', allowReturnOutsideFunction: true });
  } catch {
    return acorn.parse(source, { ...base, sourceType: 'module' });
  }
}

function isProcessExitCall(node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'process' &&
    ((!node.callee.computed && node.callee.property.name === 'exit') ||
      (node.callee.computed && node.callee.property.type === 'Literal' &&
        node.callee.property.value === 'exit'))
  );
}

/**
 * Return direct module-load exit locations, including known immediate bodies.
 * This is a syntactic regression guard, not a general reachability proof.
 */
function moduleScopeExits(source) {
  const hits = [];
  const visit = (node, insideFunction) => {
    if (!node || typeof node.type !== 'string') return;
    if (!insideFunction && isProcessExitCall(node)) {
      hits.push(node.loc.start.line);
    }
    const nowInside = insideFunction || FUNCTION_NODE_TYPES.has(node.type);
    const immediateBodies = new Set();
    if (!insideFunction && node.type === 'CallExpression') {
      if (FUNCTION_NODE_TYPES.has(node.callee.type)) immediateBodies.add(node.callee);
      const calleeName = node.callee.type === 'Identifier' ? node.callee.name : null;
      if (calleeName === 'describe' || calleeName === 'nodeDescribe') {
        for (const arg of node.arguments) {
          if (FUNCTION_NODE_TYPES.has(arg.type)) immediateBodies.add(arg);
        }
      }
    }
    const visitChild = child => {
      if (immediateBodies.has(child)) {
        for (const param of child.params) visit(param, false);
        visit(child.body, false);
      } else visit(child, nowInside);
    };
    for (const key of Object.keys(node)) {
      if (key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) visitChild(item);
      } else if (child && typeof child.type === 'string') {
        visitChild(child);
      }
    }
  };
  visit(parseScript(source), false);
  return hits;
}

describe('test-file exit hygiene (issue #45)', () => {
  test('flags literal computed exits and immediately invoked functions', () => {
    expect(moduleScopeExits("process['exit'](0)")).toEqual([1]);
    expect(moduleScopeExits('(() => process.exit(0))()')).toEqual([1]);
    expect(moduleScopeExits('(function () { process.exit(0); })()')).toEqual([1]);
    expect(moduleScopeExits('describe("suite", () => { process.exit(0); })')).toEqual([1]);
  });

  test('the walker flags a module-scope exit and ignores exits inside functions', () => {
    expect(moduleScopeExits('try { shim(); } catch (err) { process.exit(0); }')).toEqual([1]);
    expect(moduleScopeExits('if (!ok) {\n  process.exit(2);\n}')).toEqual([2]);
    expect(moduleScopeExits('function f() { process.exit(0); }')).toEqual([]);
    expect(moduleScopeExits('test("x", () => { process.exit(1); });')).toEqual([]);
    expect(moduleScopeExits("process.on('SIGINT', () => { process.exit(130); });")).toEqual([]);
    expect(moduleScopeExits('const s = "process.exit(0)";')).toEqual([]);
  });

  test('no test file calls process.exit at module scope', () => {
    const files = listTestFiles(TESTS_DIR);
    expect(files.length).toBeGreaterThanOrEqual(MINIMUM_EXPECTED_TEST_FILES);

    const offenders = [];
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      for (const line of moduleScopeExits(source)) {
        offenders.push(`${path.relative(TESTS_DIR, file)}:${line}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

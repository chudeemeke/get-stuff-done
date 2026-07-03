/**
 * GSD Tools Test Helpers
 *
 * Superset of helpers for both fork .test.js and upstream .test.cjs files.
 * The helpers/ directory provides the full set; this file re-exports and extends.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Re-export all helpers from the helpers/ directory (used by fork .test.js files)
const dirHelpers = require('./helpers/index.js');
const subprocessHelpers = require('./helpers/subprocess-with-timeout.js');
const { HEAVY_SUBPROCESS_TIMEOUT } = require('./helpers/test-timeouts');

const TOOLS_PATH = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'gsd-tools.cjs');

// Helper to run gsd-tools command (used by upstream .test.cjs files)
function runGsdTools(args, cwd = process.cwd(), options = {}) {
  const command = `"${process.execPath}" "${TOOLS_PATH}" ${args}`;
  const result = subprocessHelpers.runShellWithTimeout(command, {
    cwd,
    timeout: options.timeout || HEAVY_SUBPROCESS_TIMEOUT,
  });

  if (result.status === 0 && !result.timedOut) {
    return { success: true, output: result.stdout.trim() };
  }

  const error = result.timedOut
    ? `${command} timed out after ${result.timeout}ms`
    : result.stderr.trim() || result.error?.message || `${command} exited with status ${result.status}`;

  return {
    success: false,
    output: result.stdout.trim(),
    error,
  };
}

// Shell-safe helper using execFileSync array form (bypasses shell entirely).
// Use this when CLI arguments contain dollar signs or other shell-sensitive chars.
function runGsdToolsDirect(argsArray, cwd = process.cwd()) {
  try {
    const result = execFileSync(process.execPath, [TOOLS_PATH, ...argsArray], {
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

// Create temp directory structure (upstream-style, used by .test.cjs files)
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

function cleanup(tmpDir) {
  if (!tmpDir) return;
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

module.exports = {
  // Re-export from helpers/ directory (for fork .test.js files)
  ...dirHelpers,
  ...subprocessHelpers,
  // Additional helpers for upstream .test.cjs files
  runGsdTools,
  runGsdToolsDirect,
  createTempProject,
  cleanup,
  TOOLS_PATH,
};

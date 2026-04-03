/**
 * Test Helpers Index
 *
 * Central export point for all test helper utilities.
 * Import helpers using: const { createTempDir, mockEnv, ... } = require('./helpers')
 */

const mockFs = require('./mock-fs');
const mockProcess = require('./mock-process');
const mockChildProcess = require('./mock-child-process');
const testTimeouts = require('./test-timeouts');

module.exports = {
  // Filesystem helpers
  ...mockFs,

  // Process helpers
  ...mockProcess,

  // Child process helpers
  ...mockChildProcess,

  // Timeout constants
  ...testTimeouts
};

/**
 * Test Helpers: Process Mocking Utilities
 *
 * Provides utilities for mocking process environment, platform, and cwd.
 * All functions return restore functions that should be called in afterEach.
 */

/**
 * Mocks process.env with overrides
 * @param {object} overrides - Environment variable overrides
 * @returns {function} Restore function
 */
function mockEnv(overrides = {}) {
  const original = { ...process.env };

  Object.assign(process.env, overrides);

  return () => {
    // Restore original env
    Object.keys(process.env).forEach(key => {
      if (!(key in original)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, original);
  };
}

/**
 * Mocks process.platform
 * @param {string} platform - Platform to mock ('win32', 'darwin', 'linux', etc.)
 * @returns {function} Restore function
 */
function mockPlatform(platform) {
  const original = process.platform;

  // process.platform is read-only in some runtimes, use defineProperty
  Object.defineProperty(process, 'platform', {
    value: platform,
    writable: true,
    configurable: true
  });

  return () => {
    Object.defineProperty(process, 'platform', {
      value: original,
      writable: true,
      configurable: true
    });
  };
}

/**
 * Mocks process.cwd
 * @param {string} dir - Directory to return from process.cwd()
 * @returns {function} Restore function
 */
function mockCwd(dir) {
  const original = process.cwd;

  process.cwd = () => dir;

  return () => {
    process.cwd = original;
  };
}

module.exports = {
  mockEnv,
  mockPlatform,
  mockCwd
};

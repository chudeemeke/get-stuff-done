/**
 * Central timeout constants for subprocess-heavy tests.
 *
 * Windows subprocess operations (git init, git commit, node spawns) take
 * significantly longer than macOS/Linux. These constants prevent flaky
 * timeout failures without per-test hardcoding.
 *
 * Usage: const { SUBPROCESS_TIMEOUT } = require('./helpers');
 *        test('name', { timeout: SUBPROCESS_TIMEOUT }, () => { ... });
 */

const SUBPROCESS_TIMEOUT = 30000;
const HEAVY_SUBPROCESS_TIMEOUT = 60000;

module.exports = { SUBPROCESS_TIMEOUT, HEAVY_SUBPROCESS_TIMEOUT };

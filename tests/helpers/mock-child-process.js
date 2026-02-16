/**
 * Test Helpers: Child Process Mocking Utilities
 *
 * Provides utilities for mocking execSync, execFileSync, and spawn calls.
 * Useful for testing CLI tools without executing actual commands.
 */

/**
 * Mock for execSync that records calls and returns configured responses
 */
class MockExecSync {
  constructor() {
    this.calls = [];
    this.responses = new Map();
    this.defaultResponse = '';
    this.throwOnUnmocked = true;
  }

  /**
   * Records a call and returns configured response
   * @param {string} command - Command that was executed
   * @param {object} options - Options passed to execSync
   * @returns {string|Buffer} Configured response
   */
  exec(command, options = {}) {
    this.calls.push({ command, options });

    // Check for matching response
    for (const [pattern, response] of this.responses) {
      if (command.includes(pattern)) {
        if (response instanceof Error) {
          throw response;
        }
        return response;
      }
    }

    // No matching response found
    if (this.throwOnUnmocked) {
      const error = new Error(`Command not mocked: ${command}`);
      error.code = 1;
      throw error;
    }

    return this.defaultResponse;
  }

  /**
   * Configures a response for commands matching a pattern
   * @param {string} pattern - Substring to match in command
   * @param {string|Error} response - Response to return or error to throw
   */
  setResponse(pattern, response) {
    this.responses.set(pattern, response);
  }

  /**
   * Sets whether to throw on unmocked commands
   * @param {boolean} shouldThrow - Whether to throw on unmocked commands
   */
  setThrowOnUnmocked(shouldThrow) {
    this.throwOnUnmocked = shouldThrow;
  }

  /**
   * Sets default response for unmocked commands
   * @param {string} response - Default response
   */
  setDefaultResponse(response) {
    this.defaultResponse = response;
  }

  /**
   * Resets all recorded calls and responses
   */
  reset() {
    this.calls = [];
    this.responses.clear();
    this.defaultResponse = '';
    this.throwOnUnmocked = true;
  }

  /**
   * Gets all recorded calls
   * @returns {Array} Array of call objects
   */
  getCalls() {
    return this.calls;
  }
}

/**
 * Patches a module's execSync with a mock
 * @param {object} module - Module to patch (e.g., require('child_process'))
 * @param {Map<string, string|Error>} responses - Map of command patterns to responses
 * @returns {{ mock: MockExecSync, restore: function }} Mock instance and restore function
 */
function mockExecSync(module, responses = {}) {
  const mock = new MockExecSync();
  const original = module.execSync;

  // Configure responses
  Object.entries(responses).forEach(([pattern, response]) => {
    mock.setResponse(pattern, response);
  });

  // Replace execSync with mock
  module.execSync = (cmd, opts) => mock.exec(cmd, opts);

  const restore = () => {
    module.execSync = original;
  };

  return { mock, restore };
}

module.exports = {
  MockExecSync,
  mockExecSync
};

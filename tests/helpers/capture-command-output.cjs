'use strict';

const fs = require('node:fs');

const EXIT_SENTINEL = Symbol('capture-command-output-exit');

class CapturedExit extends Error {
  constructor(code, message) {
    super(message || `process.exit(${code})`);
    this.code = code ?? 0;
    this[EXIT_SENTINEL] = true;
  }
}

function isCapturedExit(error) {
  return Boolean(error && error[EXIT_SENTINEL]);
}

function captureCommandOutput(command) {
  if (typeof command !== 'function') {
    throw new TypeError('command must be a function');
  }

  const originalExit = process.exit;
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  const originalFsWriteSync = fs.writeSync;
  let stdout = '';
  let stderr = '';
  let rawExitCode = null;
  let returnValue;

  const captureWrite = (append) => (chunk, encoding, callback) => {
    append(String(chunk));
    const done = typeof encoding === 'function' ? encoding : callback;
    if (typeof done === 'function') done();
    return true;
  };

  process.stdout.write = captureWrite((chunk) => { stdout += chunk; });
  process.stderr.write = captureWrite((chunk) => { stderr += chunk; });
  fs.writeSync = (fd, data, ...args) => {
    if (fd !== 1 && fd !== 2) {
      return originalFsWriteSync.call(fs, fd, data, ...args);
    }

    let chunk;
    if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
      const offset = Number.isInteger(args[0]) ? args[0] : 0;
      const length = Number.isInteger(args[1]) ? args[1] : data.byteLength - offset;
      chunk = Buffer.from(data).subarray(offset, offset + length).toString('utf8');
    } else {
      chunk = String(data);
    }

    if (fd === 1) stdout += chunk;
    else stderr += chunk;
    return Buffer.byteLength(chunk);
  };
  process.exit = (code) => {
    const observedCode = code ?? 0;
    if (rawExitCode === null || rawExitCode === 0) {
      rawExitCode = observedCode;
    }
    if (observedCode !== 0) {
      const message = stderr.trim().replace(/^Error:\s*/, '');
      throw new CapturedExit(observedCode, message);
    }
  };

  try {
    returnValue = command();
  } catch (error) {
    if (!isCapturedExit(error)) throw error;
  } finally {
    process.exit = originalExit;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    fs.writeSync = originalFsWriteSync;
  }

  return {
    exitCode: rawExitCode ?? 0,
    rawExitCode,
    stdout,
    stderr,
    returnValue,
  };
}

module.exports = { captureCommandOutput };

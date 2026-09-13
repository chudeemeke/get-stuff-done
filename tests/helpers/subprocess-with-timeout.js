'use strict';

const { spawnSync } = require('child_process');
const {
  HEAVY_SUBPROCESS_TIMEOUT,
  SUBPROCESS_TIMEOUT,
} = require('./test-timeouts');

function selectTimeout(options) {
  if (Number.isFinite(options.timeout)) {
    return options.timeout;
  }

  return options.heavy ? HEAVY_SUBPROCESS_TIMEOUT : SUBPROCESS_TIMEOUT;
}

function normalizeOutput(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return Buffer.isBuffer(value) ? value.toString('utf-8') : String(value);
}

function formatCommand(command, args) {
  return [command, ...args].join(' ');
}

function normalizeResult(result, command, args, timeout) {
  const timedOut = result.error && result.error.code === 'ETIMEDOUT';
  return {
    command,
    args,
    timeout,
    status: result.status,
    signal: result.signal,
    stdout: normalizeOutput(result.stdout),
    stderr: normalizeOutput(result.stderr),
    timedOut: Boolean(timedOut),
    error: result.error || null,
  };
}

function throwForResult(result) {
  if (result.status === 0 && !result.timedOut) {
    return;
  }

  const reason = result.timedOut
    ? `timed out after ${result.timeout}ms`
    : `exited with status ${result.status}`;
  const error = new Error(`${formatCommand(result.command, result.args)} ${reason}`);
  error.result = result;
  throw error;
}

function runWithTimeout(command, args = [], options = {}) {
  const timeout = selectTimeout(options);
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    encoding: options.encoding || 'utf-8',
    stdio: options.stdio || ['pipe', 'pipe', 'pipe'],
    timeout,
    killSignal: options.killSignal || 'SIGTERM',
  });
  const normalized = normalizeResult(result, command, args, timeout);

  if (options.throwOnError) {
    throwForResult(normalized);
  }

  return normalized;
}

function runShellWithTimeout(command, options = {}) {
  const timeout = selectTimeout(options);
  const result = spawnSync(command, [], {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    encoding: options.encoding || 'utf-8',
    stdio: options.stdio || ['pipe', 'pipe', 'pipe'],
    shell: true,
    timeout,
    killSignal: options.killSignal || 'SIGTERM',
  });
  const normalized = normalizeResult(result, command, [], timeout);

  if (options.throwOnError) {
    throwForResult(normalized);
  }

  return normalized;
}

module.exports = {
  runShellWithTimeout,
  runWithTimeout,
};

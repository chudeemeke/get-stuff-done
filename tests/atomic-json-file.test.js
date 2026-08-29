const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { writeJsonFileAtomic } = require('../scripts/lib/atomic-json-file');

function fileError(code) {
  return Object.assign(new Error(code), { code });
}

function createHarness(options = {}) {
  const calls = [];
  const renameErrors = [...(options.renameErrors || [])];
  const fileSystem = {
    mkdirSync: (...args) => calls.push(['mkdir', ...args]),
    writeFileSync: (...args) => {
      calls.push(['write', ...args]);
      if (options.writeError) throw options.writeError;
    },
    renameSync: (...args) => {
      calls.push(['rename', ...args]);
      const error = renameErrors.shift();
      if (error) throw error;
    },
    unlinkSync: (...args) => {
      calls.push(['unlink', ...args]);
      if (options.unlinkError) throw options.unlinkError;
    },
  };
  return {
    calls,
    deps: {
      fs: fileSystem,
      pid: 42,
      entropy: () => 'abc123',
      sleep: ms => calls.push(['sleep', ms]),
    },
  };
}

describe('atomic JSON file publication', () => {
  test('writes exact formatted bytes through an exclusive sibling and rename', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-atomic-json-'));
    const filePath = path.join(tempDir, 'nested', 'report.json');
    try {
      writeJsonFileAtomic(filePath, { ok: true, rows: [1, 2] });
      expect(fs.readFileSync(filePath, 'utf8')).toBe(
        '{\n  "ok": true,\n  "rows": [\n    1,\n    2\n  ]\n}\n'
      );
      expect(fs.readdirSync(path.dirname(filePath))).toEqual(['report.json']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('atomically replaces an existing JSON file without leaving its sibling', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-atomic-json-replace-'));
    const filePath = path.join(tempDir, 'manifest.json');
    try {
      fs.writeFileSync(filePath, '{"old":true}\n', 'utf8');

      writeJsonFileAtomic(filePath, { current: true });

      expect(fs.readFileSync(filePath, 'utf8')).toBe('{\n  "current": true\n}\n');
      expect(fs.readdirSync(tempDir)).toEqual(['manifest.json']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('uses exclusive creation and never deletes a collided temp path', () => {
    const collision = fileError('EEXIST');
    const harness = createHarness({ writeError: collision });
    const filePath = 'C:\\repo\\evidence.json';

    expect(() => writeJsonFileAtomic(filePath, { ok: true }, harness.deps)).toThrow(collision);
    expect(harness.calls.filter(([name]) => name === 'write')[0][3])
      .toEqual({ encoding: 'utf8', flag: 'wx' });
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(0);
  });

  test('cleans a partially created temp after a non-collision write failure', () => {
    const writeError = fileError('ENOSPC');
    const harness = createHarness({ writeError });

    expect(() => writeJsonFileAtomic('C:\\repo\\evidence.json', {}, harness.deps))
      .toThrow(writeError);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(1);
  });

  test('retries transient replacement failures before succeeding', () => {
    const harness = createHarness({
      renameErrors: [fileError('EPERM'), fileError('EBUSY')],
    });

    writeJsonFileAtomic('C:\\repo\\evidence.json', {}, harness.deps);
    expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(3);
    expect(harness.calls.filter(([name]) => name === 'sleep'))
      .toEqual([['sleep', 50], ['sleep', 50]]);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(0);
  });

  test('uses the bounded production delay when no retry sleeper is injected', () => {
    const harness = createHarness({
      renameErrors: [fileError('EPERM'), fileError('EBUSY')],
    });
    delete harness.deps.sleep;

    writeJsonFileAtomic('C:\\repo\\evidence.json', {}, harness.deps);

    expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(3);
  });

  test('exhausts transient replacement retries, cleans the sibling, and preserves the error', () => {
    const finalError = fileError('EACCES');
    const harness = createHarness({
      renameErrors: [fileError('EPERM'), fileError('EBUSY'), finalError],
    });

    expect(() => writeJsonFileAtomic('C:\\repo\\evidence.json', {}, harness.deps))
      .toThrow(finalError);
    expect(harness.calls.filter(([name]) => name === 'rename')).toHaveLength(3);
    expect(harness.calls.filter(([name]) => name === 'sleep'))
      .toEqual([['sleep', 50], ['sleep', 50]]);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(1);
  });

  test('cleans the sibling and preserves replacement failure', () => {
    const renameError = fileError('EXDEV');
    const harness = createHarness({ renameErrors: [renameError] });

    expect(() => writeJsonFileAtomic('C:\\repo\\evidence.json', {}, harness.deps))
      .toThrow(renameError);
    expect(harness.calls.filter(([name]) => name === 'unlink')).toHaveLength(1);
  });

  test('aggregates publication and cleanup failures', () => {
    const renameError = fileError('EXDEV');
    const cleanupError = fileError('EACCES');
    const harness = createHarness({
      renameErrors: [renameError],
      unlinkError: cleanupError,
    });

    try {
      writeJsonFileAtomic('C:\\repo\\evidence.json', {}, harness.deps);
      throw new Error('expected publication failure');
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.errors).toEqual([renameError, cleanupError]);
      expect(error.cause).toBe(renameError);
    }
  });

  test('ignores an already-missing sibling during failure cleanup', () => {
    const renameError = fileError('EXDEV');
    const harness = createHarness({
      renameErrors: [renameError],
      unlinkError: fileError('ENOENT'),
    });

    expect(() => writeJsonFileAtomic('C:\\repo\\evidence.json', {}, harness.deps))
      .toThrow(renameError);
  });

  test('rejects invalid paths and unsafe entropy before publication', () => {
    expect(() => writeJsonFileAtomic('', {})).toThrow('JSON file path must be a non-empty string');
    expect(() => writeJsonFileAtomic('evidence.json', undefined))
      .toThrow('JSON value must serialize to a document');
    const harness = createHarness();
    harness.deps.entropy = () => '../unsafe';
    expect(() => writeJsonFileAtomic('C:\\repo\\evidence.json', {}, harness.deps))
      .toThrow('JSON temp entropy must be a non-empty path-safe string');
    expect(harness.calls).toEqual([]);
  });
});

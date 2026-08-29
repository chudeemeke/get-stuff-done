'use strict';

// This helper guarantees process-visible old-or-new JSON bytes and cleanup on
// reported failures. Planning "durable evidence" means a persistent repo
// artifact; storage-device power-loss durability and destination-specific ACL
// metadata are outside this maintainer-tool contract.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const TRANSIENT_REPLACE_ERRORS = new Set(['EPERM', 'EBUSY', 'EACCES']);
const MAX_REPLACE_ATTEMPTS = 3;
const RETRY_DELAY_MS = 50;
let sleepBuffer = null;

function sleepSync(delayMs) {
  if (sleepBuffer === null) {
    sleepBuffer = new Int32Array(new SharedArrayBuffer(4));
  }
  Atomics.wait(sleepBuffer, 0, 0, delayMs);
}

function cleanupTemp(fileSystem, tempPath) {
  try {
    fileSystem.unlinkSync(tempPath);
    return null;
  } catch (error) {
    return error.code === 'ENOENT' ? null : error;
  }
}

function throwAfterCleanup(fileSystem, tempPath, publicationError) {
  const cleanupError = cleanupTemp(fileSystem, tempPath);
  if (cleanupError) {
    throw new AggregateError(
      [publicationError, cleanupError],
      'atomic JSON publication failed and its temp file could not be removed',
      { cause: publicationError }
    );
  }
  throw publicationError;
}

function writeJsonFileAtomic(filePath, value, deps = {}) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new TypeError('JSON file path must be a non-empty string');
  }

  const fileSystem = deps.fs || fs;
  const processId = deps.pid ?? process.pid;
  const entropy = deps.entropy || crypto.randomUUID;
  const sleep = deps.sleep || sleepSync;
  const token = entropy();
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) {
    throw new TypeError('JSON temp entropy must be a non-empty path-safe string');
  }

  const serialized = JSON.stringify(value, null, 2);
  if (serialized === undefined) {
    throw new TypeError('JSON value must serialize to a document');
  }
  const bytes = `${serialized}\n`;
  const tempPath = `${filePath}.tmp.${processId}.${token}`;
  fileSystem.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    fileSystem.writeFileSync(tempPath, bytes, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') throw error;
    throwAfterCleanup(fileSystem, tempPath, error);
  }

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      fileSystem.renameSync(tempPath, filePath);
      return bytes;
    } catch (error) {
      if (TRANSIENT_REPLACE_ERRORS.has(error.code) && attempt < MAX_REPLACE_ATTEMPTS) {
        sleep(RETRY_DELAY_MS);
        continue;
      }
      throwAfterCleanup(fileSystem, tempPath, error);
    }
  }
}

module.exports = { writeJsonFileAtomic };

'use strict';

// The install transaction: lock, journal, copy-only pre-image, rollback by quarantine
// and restore, verification before any claim, recovery of an interrupted run.
// Contract: docs/reviews/installer-rollback-redesign-2026-09-18.md. Requires the names
// table and Node builtins only; bin/install.js depends on this module, never the
// reverse. It returns outcomes and never prints: renderOutcome turns an outcome into
// lines and an exit code, and the caller prints them.
//
// PARTIAL: the lock has landed. Every other operation throws until its seam lands
// (plan Step 3). Nothing requires this module yet.
const crypto = require('node:crypto');
const nodeFs = require('node:fs');
const path = require('node:path');

const OPERATIONS = Object.freeze([
  'acquireLock',
  'inspectExisting',
  'openTransaction',
  'snapshotPathOf',
  'recordExpectedWrite',
  'markSpawning',
  'recordChildPid',
  'markChildClosed',
  'planRollback',
  'applyRollbackAction',
  'verify',
  'rollback',
  'recover',
  'retire',
  'commit',
  'renderOutcome',
]);

// Protected names (install-names.js). A dead holder's lock is moved to
// <lock>.stale-<id>; this run's lock waits at <lock>.stale-<id>.new until it is
// published. Both belong to the one protected family, so residue a crash leaves behind
// is recognised and never treated as an entry someone else made.
const LOCK_NAME = 'gsd-install.lock';
const CLAIM_INFIX = '.stale-';
const PENDING_SUFFIX = '.new';

// Every default is a reference, not a wrapper, so no port has a path of its own to cover.
// The remaining ports (platform, freeBytes) arrive with the seams that use them.
const DEFAULT_PORTS = Object.freeze({
  fs: nodeFs,
  now: Date.now,
  pid: process.pid,
  signalProcess: process.kill,
  newId: crypto.randomUUID,
});

// A refusal is decided before any mutation: exit 6 always means nothing was touched.
class InstallRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'InstallRefusal';
    this.exitCode = 6;
  }
}

const IF_NONE_RUNNING = 'If no installer is running, delete that file and run again.';

function heldBy(holder, lockPath) {
  return new InstallRefusal(`Another install appears to be running (pid ${holder.pid}, lock ${lockPath}, `
    + `created ${holder.created}). ${IF_NONE_RUNNING}`);
}

function unreadable(lockPath) {
  return new InstallRefusal(`An install lock exists but cannot be read (lock ${lockPath}). ${IF_NONE_RUNNING}`);
}

function changedHands(lockPath) {
  return new InstallRefusal(`The install lock changed hands while this run was starting (lock ${lockPath}). `
    + 'Run again. If it still refuses and no installer is running, delete that file and run again.');
}

function notCreated(lockPath, error) {
  return new InstallRefusal(`The install lock could not be created (lock ${lockPath}): ${error.message}. Nothing was changed.`);
}

// The creation time is printed verbatim in a refusal, so only the exact form this module
// writes is accepted from a file.
function isUtcInstant(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

// One factory, ports merged over defaults, so a missing port is never a branch inside
// an operation.
function createInstallTransactionApi(ports) {
  const { fs, now, pid, signalProcess, newId } = { ...DEFAULT_PORTS, ...ports };

  // 'held' carries the holder's pid, its creation time and the exact text; 'absent' and
  // 'unreadable' carry nothing, so their text never equals a real lock's.
  function readLock(file) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (error) {
      return { state: error.code === 'ENOENT' ? 'absent' : 'unreadable' };
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { state: 'unreadable' };
    }
    const { pid: holder, created } = Object(parsed);
    if (!Number.isInteger(holder) || holder <= 0 || !isUtcInstant(created)) return { state: 'unreadable' };
    return { state: 'held', pid: holder, created, text };
  }

  // Dead only when the probe says so. Alive, owned by another user (EPERM) and any other
  // answer all leave liveness undecided, and an undecided holder is never taken over.
  function isDead(holder) {
    try {
      signalProcess(holder, 0);
      return false;
    } catch (error) {
      return error.code === 'ESRCH';
    }
  }

  // A link fails if the name exists, and the file it publishes is already complete, so
  // the lock is never observable empty. True when this run's lock is now the lock.
  function publish(pending, lockPath) {
    try {
      fs.linkSync(pending, lockPath);
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') return false;
      throw error;
    }
  }

  function removeQuietly(file) {
    try {
      fs.unlinkSync(file);
    } catch {
      // Residue under a protected name is harmless; failing the run over it is not.
    }
  }

  // Reached only when a lock exists. This run proceeds only if the holder is proved dead
  // AND its own rename moved that exact lock AND its own lock is then published first.
  function takeOver(lockPath, claim, pending) {
    const holder = readLock(lockPath);
    if (holder.state === 'absent') throw changedHands(lockPath);
    if (holder.state === 'unreadable') throw unreadable(lockPath);
    if (!isDead(holder.pid)) throw heldBy(holder, lockPath);
    try {
      fs.renameSync(lockPath, claim);
    } catch (error) {
      if (error.code === 'ENOENT') throw changedHands(lockPath);
      throw error;
    }
    // A rename is not a compare-and-swap: between the read and the rename a rival may
    // have taken over, and then the file this run moved is the rival's LIVE lock.
    const movedTheDeadLock = readLock(claim).text === holder.text;
    const published = movedTheDeadLock && publish(pending, lockPath);
    if (!movedTheDeadLock) {
      try {
        fs.linkSync(claim, lockPath);
      } catch {
        // A third run took the lock in the gap. Its lock stands; the rival's is lost,
        // which its own release tolerates. Recorded as a residual risk of the design.
      }
    }
    removeQuietly(claim);
    if (!published) throw changedHands(lockPath);
  }

  // The target must exist: creating it belongs to preflight, after every refusal that
  // can be decided without it (note, "Readings settled", target directory absent).
  function acquireLock(targetDir) {
    const lockPath = path.join(targetDir, LOCK_NAME);
    const claim = `${lockPath}${CLAIM_INFIX}${newId()}`;
    const pending = `${claim}${PENDING_SUFFIX}`;
    const text = JSON.stringify({ pid, created: new Date(now()).toISOString() });
    try {
      fs.writeFileSync(pending, text, { flag: 'wx' });
    } catch (error) {
      throw notCreated(lockPath, error);
    }
    let tookOver = false;
    try {
      if (!publish(pending, lockPath)) {
        takeOver(lockPath, claim, pending);
        tookOver = true;
      }
    } catch (error) {
      throw error instanceof InstallRefusal ? error : notCreated(lockPath, error);
    } finally {
      removeQuietly(pending);
    }
    // Deletes the lock only while it still holds this run's exact text, and never
    // throws: a lock left behind names a pid that is about to exit, so the next run
    // takes it over.
    const release = () => {
      if (readLock(lockPath).text === text) removeQuietly(lockPath);
    };
    return Object.freeze({ path: lockPath, tookOver, release });
  }

  const landed = new Map([['acquireLock', acquireLock]]);
  return Object.freeze(Object.fromEntries(OPERATIONS.map(name => [name, landed.get(name) || (() => {
    throw new Error(`not implemented: ${name}`);
  })])));
}

module.exports = Object.freeze({ OPERATIONS, createInstallTransactionApi });

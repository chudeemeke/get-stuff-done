'use strict';

// The install transaction: lock, journal, copy-only pre-image, rollback by quarantine
// and restore, verification before any claim, recovery of an interrupted run.
// Contract: docs/reviews/installer-rollback-redesign-2026-09-18.md. Requires the names
// table and Node builtins only; bin/install.js depends on this module, never the
// reverse. It returns outcomes and never prints: renderOutcome turns an outcome into
// lines and an exit code, and the caller prints them.
//
// SKELETON: every operation throws until its seam lands (plan Step 3). Nothing
// requires this module yet.

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

// One factory, ports merged over defaults, so a missing port is never a branch inside
// an operation. The ports (fs, platform, now, pid, signalProcess, newId, freeBytes)
// arrive with the seams that use them.
function createInstallTransactionApi() {
  return Object.freeze(Object.fromEntries(OPERATIONS.map(name => [name, () => {
    throw new Error(`not implemented: ${name}`);
  }])));
}

module.exports = Object.freeze({ OPERATIONS, createInstallTransactionApi });

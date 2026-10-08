'use strict';

// The one names table of the installer. Cleanup and the install transaction both read
// it, so cleanup can delete nothing that the transaction does not pre-image, and the
// transaction never touches a name it owns. Requires nothing, on purpose.
// Contract: docs/reviews/installer-rollback-redesign-2026-09-18.md, "Names".

// Roots. Cleanup may delete these; rollback and verify cover them.
const GENERATED = Object.freeze([
  'gsd-file-manifest.json',
  '.install-meta.json',
  '.overlay-manifest.json',
  '.gsd-profile',
  '.gsd-source', // Open GSD 1.7.0+ source-resolution marker (#1477); side-written outside the manifest
  'CREDITS.md',
  'gsd-install-state.json',
  'package.json',
]);

// Roots. Cleanup may delete these recursively, in the no-manifest branch only.
const LEGACY = Object.freeze([
  'get-stuff-done', // v2.x directory name
  'get-shit-done', // v3.0 upstream directory
  'gsd-core', // Open GSD upstream directory
]);

// Roots. Cleanup never deletes these; rollback and verify cover them.
const OBSERVED = Object.freeze(['settings.json', 'gsd-local-patches', 'gsd-pristine', 'gsd-migration-journal']);

// Wrapper-owned, never roots. Rollback and verify never touch them; the top-level
// check recognises them and does not report them.
const PROTECTED = Object.freeze(['gsd-install-transaction', 'gsd-install.lock', 'gsd-local-patch-history']);
const PROTECTED_PREFIXES = Object.freeze(['gsd-install-transaction-retired-', 'gsd-install.lock.stale-']);

// Stored names are always kept exactly. Two names are the same entry when their keys
// match: case folds on win32, case and Unicode normalization fold on darwin.
function comparisonKey(name, platform) {
  if (platform === 'win32') return name.toLowerCase();
  if (platform === 'darwin') return name.normalize('NFC').toLowerCase();
  return name;
}

// Takes one path segment. Every protected name is lowercase ASCII, so it is its own key.
function isProtectedName(name, platform) {
  const key = comparisonKey(name, platform);
  return PROTECTED.includes(key) || PROTECTED_PREFIXES.some(prefix => key.startsWith(prefix));
}

module.exports = Object.freeze({ GENERATED, LEGACY, OBSERVED, PROTECTED, PROTECTED_PREFIXES, comparisonKey, isProtectedName });

'use strict';

/**
 * hooks/index.js — Hook System Manifest (SSOT)
 *
 * Single source of truth for hook metadata: name, source location, kind,
 * and derived paths. Consumers (scripts/build.js, scripts/check-parity.js,
 * tests/hooks.test.js, future tooling) MUST import from this module rather
 * than hardcoding hook paths.
 *
 * Architecture: see docs/adr/0001-manifest-driven-knowledge.md for the
 * decision rationale and the broader pattern this module instantiates.
 *
 * Design principles:
 *   - SRP: this module's only responsibility is hook metadata
 *   - OCP: adding a hook is a single-file edit (append to HOOKS array)
 *   - DIP: consumers depend on this abstraction, not on concrete strings
 *
 * Conventions (Phase 30 / v3.0.0 architecture):
 *   - kind 'override' = hook REPLACES an upstream hook at the same relative path
 *   - kind 'overlay'  = hook is fork-only with no upstream counterpart
 *   - source dir is repo-root-relative (no leading slash)
 *
 * To ADD a hook: append a frozen entry to HOOKS below.
 * To MOVE a hook: change its `source` value. No other file changes needed.
 * To REMOVE a hook: delete its entry. Run tests to surface dangling references.
 */

const path = require('path');

// Compute repo root once (this file is at <repo>/hooks/index.js)
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Manifest data (frozen — accidental mutation is a bug)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} HookManifestEntry
 * @property {string} name        File name (basename only, with extension)
 * @property {string} source      Repo-root-relative source directory
 * @property {'override'|'overlay'} kind  Whether this replaces upstream or adds new
 * @property {string} [description]  Optional human-readable description
 */

/** @type {ReadonlyArray<HookManifestEntry>} */
const HOOKS = Object.freeze([
  Object.freeze({
    name: 'gsd-check-update.js',
    source: 'overrides/hooks',
    kind: 'override',
    description: 'SessionStart hook: throttled upstream version check (7-day cache)',
  }),
  Object.freeze({
    name: 'gsd-statusline.js',
    source: 'overrides/hooks',
    kind: 'override',
    description: 'StatusLine hook: GSD-aware terminal status with portfolio briefing',
  }),
  Object.freeze({
    name: 'pre-compact.js',
    source: 'overlay/hooks',
    kind: 'overlay',
    description: 'PreCompact hook: protect critical context from auto-compaction',
  }),
]);

// ---------------------------------------------------------------------------
// Path resolution functions
// ---------------------------------------------------------------------------

/**
 * Resolve the absolute source path for a hook entry.
 *
 * @param {HookManifestEntry} hook
 * @returns {string} Absolute path to the hook source file
 */
function sourcePath(hook) {
  if (!hook || !hook.source || !hook.name) {
    throw new TypeError('sourcePath: hook must have { source, name }');
  }
  // Split source on / so path.join uses platform-native separators
  const segments = hook.source.split('/').filter(Boolean);
  return path.join(PROJECT_ROOT, ...segments, hook.name);
}

/**
 * Resolve the absolute bundled-dist path for a hook entry.
 *
 * @param {HookManifestEntry} hook
 * @returns {string} Absolute path to the hook's bundled output
 */
function distPath(hook) {
  if (!hook || !hook.name) {
    throw new TypeError('distPath: hook must have { name }');
  }
  return path.join(PROJECT_ROOT, 'hooks', 'dist', hook.name);
}

/**
 * Find a hook entry by file name. Returns undefined if not found.
 *
 * @param {string} name
 * @returns {HookManifestEntry|undefined}
 */
function findByName(name) {
  return HOOKS.find(h => h.name === name);
}

/**
 * Filter hooks by kind ('override' or 'overlay').
 *
 * @param {'override'|'overlay'} kind
 * @returns {HookManifestEntry[]}
 */
function filterByKind(kind) {
  return HOOKS.filter(h => h.kind === kind);
}

/**
 * Return all hooks as a copy (defensive — prevents external mutation).
 * Use HOOKS directly if you don't need a copy (it's already frozen).
 *
 * @returns {HookManifestEntry[]}
 */
function allHooks() {
  return HOOKS.slice();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  PROJECT_ROOT,
  HOOKS,
  sourcePath,
  distPath,
  findByName,
  filterByKind,
  allHooks,
};

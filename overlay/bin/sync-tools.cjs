#!/usr/bin/env node
/**
 * sync-tools.cjs -- CLI entry point for sync commands
 *
 * Dispatches sync-preview and sync-checkpoint commands to overlay/lib/sync.cjs.
 * Separated from upstream's gsd-tools.cjs router because upstream does not
 * have sync commands -- these are fork-only additions.
 */
const fs = require('fs');
const path = require('path');
const sync = require('../lib/sync.cjs');

/**
 * Extract comma-separated values for a given flag from args array.
 * E.g., extractFlagValues(['--category', 'feat,fix', '--json'], '--category') => ['feat', 'fix']
 *
 * @param {string[]} args - CLI arguments
 * @param {string} flag - Flag name (e.g., '--category')
 * @returns {string[]}
 */
function extractFlagValues(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return [];
  const next = args[idx + 1];
  if (next.startsWith('--')) return [];
  return next.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Extract SHA candidates for a given flag from args array.
 * Validates each value matches /^[0-9a-f]{7,40}$/i (7-40 hex chars).
 *
 * @param {string[]} args - CLI arguments
 * @param {string} flag - Flag name (e.g., '--include')
 * @returns {string[]}
 */
function extractShaCandidates(args, flag) {
  const values = extractFlagValues(args, flag);
  return values.filter(v => /^[0-9a-f]{7,40}$/i.test(v));
}

function showUsage() {
  process.stderr.write(`Usage: sync-tools <command> [args] [--raw]

Commands:
  sync-preview <range> [--json]  Preview commits in range with diff stats
    [--category type,...] [--exclude type,...] [--include sha,...] [--exclude-sha sha,...]
  sync-checkpoint create <id>    Create annotated checkpoint tag at HEAD
  sync-checkpoint list           List active sync-checkpoint-* tags
  sync-checkpoint cleanup        Delete all sync-checkpoint-* tags

Flags:
  --raw    Output raw values without JSON wrapping
  --cwd    Override working directory
  --help   Show this help message
  -h       Show this help message
`);
}

function main() {
  const args = process.argv.slice(2);

  // Optional cwd override for sandboxed subagents running outside project root.
  let cwd = process.cwd();
  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) {
      process.stderr.write('Error: Missing value for --cwd\n');
      process.exit(1);
    }
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) {
      process.stderr.write('Error: Missing value for --cwd\n');
      process.exit(1);
    }
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  if (cwd && (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory())) {
    process.stderr.write(`Error: Invalid --cwd: ${cwd}\n`);
    process.exit(1);
  }

  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) args.splice(rawIndex, 1);

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'sync-preview': {
      const categories = extractFlagValues(args, '--category');
      const excludeCategories = extractFlagValues(args, '--exclude');
      const includeShas = extractShaCandidates(args, '--include');
      const excludeShas = extractShaCandidates(args, '--exclude-sha');

      sync.cmdSyncPreview(cwd, args[1], {
        json: args.includes('--json'),
        categories: categories.length ? categories : undefined,
        excludeCategories: excludeCategories.length ? excludeCategories : undefined,
        includeShas: includeShas.length ? includeShas : undefined,
        excludeShas: excludeShas.length ? excludeShas : undefined,
      }, raw);
      break;
    }

    case 'sync-checkpoint': {
      const subcommand = args[1];
      if (subcommand === 'create') {
        sync.cmdSyncCheckpointCreate(cwd, args[2], raw);
      } else if (subcommand === 'list') {
        sync.cmdSyncCheckpointList(cwd, raw);
      } else if (subcommand === 'cleanup') {
        sync.cmdSyncCheckpointCleanup(cwd, raw);
      } else {
        process.stderr.write('Error: Unknown sync-checkpoint subcommand. Available: create, list, cleanup\n');
        process.exit(1);
      }
      break;
    }

    default:
      showUsage();
      process.exit(1);
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
}

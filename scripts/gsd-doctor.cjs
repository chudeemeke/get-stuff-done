'use strict';

/**
 * scripts/gsd-doctor.cjs — Local-state repair for GSD hook installations.
 *
 * Purpose: Detect and repair stale/broken state in `~/.claude/settings.json`
 * that the upstream `bin/install.js` cannot self-heal because its idempotency
 * check verifies hook presence by NAME, not by command-shape VALIDITY.
 *
 * Known repair: the `& "PATH/bunx.exe" "PATH/hook.js"` PowerShell call-operator
 * shape (legacy, origin unpinned — see docs/inbox/2026-05-13-authkey-hook-config-
 * powershell-syntax-breaks-on-bash-windows.md for full investigation). bash
 * (Claude Code's default hook-executor shell on Windows) parses `&` as a
 * control operator and fails the entire command with "syntax error near
 * unexpected token `&`", which BLOCKS PreToolUse:Edit/Write hooks and emits
 * noise on PostToolUse:Bash/Read. Current upstream emits `node "PATH"` cleanly,
 * but the broken shape self-preserves across re-installs.
 *
 * Usage:
 *   node scripts/gsd-doctor.cjs check                    # diagnose (exit 0=clean, 1=broken)
 *   node scripts/gsd-doctor.cjs repair                   # backup + atomic fix
 *   node scripts/gsd-doctor.cjs repair --dry-run         # report what WOULD change
 *   node scripts/gsd-doctor.cjs --help
 *   node scripts/gsd-doctor.cjs --version
 *
 * Options:
 *   --settings <path>   Override settings.json path (default: $HOME/.claude/settings.json)
 *   --dry-run           Report changes without writing
 *   --verbose           Print per-entry decisions
 *
 * Exit codes:
 *   0 -- clean (check) OR repair succeeded
 *   1 -- broken state detected (check) OR repair failed
 *   2 -- usage error / invalid args
 *
 * Design notes (composes with project-root CLAUDE.md skin-discipline rules):
 *   - Pure scripts/* fork-only file (filename verified disjoint from upstream).
 *   - Idempotent: running `repair` twice produces identical state.
 *   - Atomic: temp-file + rename. Never leaves half-written settings.json.
 *   - Reversible: backup written BEFORE any modification, path printed.
 *   - Validation gate: round-trip JSON.parse on modified content before write.
 *   - Pattern-based, not name-based: detects the broken SHAPE regardless of
 *     which hook script name follows. Future hooks added to settings.json
 *     using the same broken shape would also be repaired.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const VERSION = '0.1.0';

// ---------------------------------------------------------------------------
// Core repair logic — pure functions, testable in isolation
// ---------------------------------------------------------------------------

/**
 * Pattern that identifies a broken hook command.
 *
 * Anchors:
 *   ^                                        — start of string (& must lead)
 *   & "                                      — literal PowerShell call-op + quote
 *   ([^"]*bunx(?:\.exe)?)                    — group 1: any path ending in bunx or bunx.exe
 *   "                                        — close runner-path quote
 *   space
 *   ("[^"]+\.(?:js|cjs|mjs)")                — group 2: FULL quoted script path (incl. both quotes)
 *   $                                        — end of string
 *
 * The .js/.cjs/.mjs extension match is deliberate — we only repair hook
 * invocations of node-runnable scripts. .sh / .ps1 / other shapes are out
 * of scope (and never had this bug per investigation).
 *
 * Group 2 captures the full `"PATH"` form so the replacement is a clean
 * `node ${m[2]}` with no manual quote re-appending (correct-by-construction).
 */
const BROKEN_RE = /^& "([^"]*bunx(?:\.exe)?)" ("[^"]+\.(?:js|cjs|mjs)")$/;

/**
 * Detect-and-repair a single command string.
 * Returns { fixed, before, after } where fixed=true if repair applied.
 */
function repairCommand(cmd) {
  if (typeof cmd !== 'string') return { fixed: false };
  const m = cmd.match(BROKEN_RE);
  if (!m) return { fixed: false };
  return { fixed: true, before: cmd, after: `node ${m[2]}` };
}

/**
 * Walk a settings object's hooks tree, applying `visitor(commandStr) => string`
 * to every command. Mutates in place. Returns count of mutations.
 */
function walkHookCommands(settings, visitor) {
  let count = 0;
  if (!settings || typeof settings !== 'object') return 0;
  const hooks = settings.hooks;
  if (!hooks || typeof hooks !== 'object') return 0;
  for (const eventName of Object.keys(hooks)) {
    const eventEntries = hooks[eventName];
    if (!Array.isArray(eventEntries)) continue;
    for (const entry of eventEntries) {
      if (!entry || !Array.isArray(entry.hooks)) continue;
      for (const h of entry.hooks) {
        if (!h || typeof h.command !== 'string') continue;
        const next = visitor(h.command);
        if (next !== h.command) {
          h.command = next;
          count++;
        }
      }
    }
  }
  return count;
}

/**
 * Diagnose: return list of broken entries WITHOUT mutating.
 * Each entry: { event, matcher, before, after }.
 */
function diagnose(settings) {
  const findings = [];
  if (!settings || !settings.hooks) return findings;
  for (const eventName of Object.keys(settings.hooks)) {
    const eventEntries = settings.hooks[eventName];
    if (!Array.isArray(eventEntries)) continue;
    for (const entry of eventEntries) {
      if (!entry || !Array.isArray(entry.hooks)) continue;
      for (const h of entry.hooks) {
        if (!h || typeof h.command !== 'string') continue;
        const r = repairCommand(h.command);
        if (r.fixed) {
          findings.push({
            event: eventName,
            matcher: entry.matcher || '(none)',
            before: r.before,
            after: r.after,
          });
        }
      }
    }
  }
  return findings;
}

/**
 * Repair: read settings.json → diagnose → if broken, backup + atomic-write fix.
 * Returns { settingsPath, backupPath, changed, findings, dryRun }.
 *
 * Throws if:
 *   - settings.json missing or unreadable
 *   - settings.json not valid JSON
 *   - post-repair content fails round-trip JSON.parse
 *   - filesystem write fails
 */
function repair({ settingsPath, dryRun = false } = {}) {
  if (!settingsPath) {
    settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  }
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const settings = JSON.parse(raw); // throws if not valid JSON
  const findings = diagnose(settings);

  if (findings.length === 0) {
    return { settingsPath, backupPath: null, changed: 0, findings, dryRun };
  }

  if (dryRun) {
    return { settingsPath, backupPath: null, changed: findings.length, findings, dryRun: true };
  }

  // Apply repair (mutates settings in place)
  const changed = walkHookCommands(settings, (cmd) => {
    const r = repairCommand(cmd);
    return r.fixed ? r.after : cmd;
  });
  // changed should equal findings.length — sanity check
  if (changed !== findings.length) {
    throw new Error(
      `Internal error: diagnose found ${findings.length} but walk repaired ${changed}`
    );
  }

  // Serialize + validation gate
  const newRaw = JSON.stringify(settings, null, 2) + '\n';
  JSON.parse(newRaw); // throws if invalid (defensive — should never trigger)

  // Backup
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = settingsPath + '.bak.' + ts;
  fs.writeFileSync(backupPath, raw);

  // Atomic write
  const tmpPath = settingsPath + '.tmp.' + ts;
  fs.writeFileSync(tmpPath, newRaw);
  fs.renameSync(tmpPath, settingsPath);

  return { settingsPath, backupPath, changed, findings, dryRun: false };
}

// ---------------------------------------------------------------------------
// CLI surface
// ---------------------------------------------------------------------------

const HELP = `gsd-doctor v${VERSION} — diagnose and repair GSD hook installation state

Usage:
  node scripts/gsd-doctor.cjs <subcommand> [options]

Subcommands:
  check               Diagnose ~/.claude/settings.json hook commands.
                      Exits 0 if clean, 1 if broken state detected.
  repair              Repair broken hook commands. Creates timestamped
                      backup before any modification.

Options:
  --settings <path>   Override settings.json path (testing).
  --dry-run           (repair only) Report changes without writing.
  --verbose           Print per-entry decisions.
  --help, -h          Show this help.
  --version           Show version.

Exit codes:
  0  clean (check) OR repair succeeded
  1  broken state detected (check) OR repair failed
  2  usage error

Examples:
  node scripts/gsd-doctor.cjs check
  node scripts/gsd-doctor.cjs repair
  node scripts/gsd-doctor.cjs repair --dry-run --verbose
`;

function parseArgs(argv) {
  const opts = {
    subcommand: null,
    settingsPath: null,
    dryRun: false,
    verbose: false,
    help: false,
    version: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--version') opts.version = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--verbose') opts.verbose = true;
    else if (a === '--settings') opts.settingsPath = argv[++i];
    else if (!opts.subcommand && (a === 'check' || a === 'repair')) opts.subcommand = a;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return opts;
}

function formatFinding(f, verbose) {
  if (!verbose) return `  ${f.event}/${f.matcher}: would repair`;
  return [
    `  ${f.event}/${f.matcher}:`,
    `    - ${f.before}`,
    `    + ${f.after}`,
  ].join('\n');
}

function runCheck(opts) {
  const settingsPath =
    opts.settingsPath || path.join(os.homedir(), '.claude', 'settings.json');
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const settings = JSON.parse(raw);
  const findings = diagnose(settings);
  if (findings.length === 0) {
    process.stdout.write(`gsd-doctor: clean (${settingsPath})\n`);
    return 0;
  }
  process.stdout.write(
    `gsd-doctor: ${findings.length} broken entr${findings.length === 1 ? 'y' : 'ies'} in ${settingsPath}\n`
  );
  for (const f of findings) {
    process.stdout.write(formatFinding(f, opts.verbose) + '\n');
  }
  process.stdout.write(`Run: node scripts/gsd-doctor.cjs repair\n`);
  return 1;
}

function runRepair(opts) {
  const result = repair({ settingsPath: opts.settingsPath, dryRun: opts.dryRun });
  if (result.changed === 0) {
    process.stdout.write(`gsd-doctor: nothing to repair (${result.settingsPath})\n`);
    return 0;
  }
  if (result.dryRun) {
    process.stdout.write(
      `gsd-doctor: would repair ${result.changed} entr${result.changed === 1 ? 'y' : 'ies'} (--dry-run, no write)\n`
    );
  } else {
    process.stdout.write(
      `gsd-doctor: repaired ${result.changed} entr${result.changed === 1 ? 'y' : 'ies'}\n`
    );
    process.stdout.write(`  backup: ${result.backupPath}\n`);
  }
  for (const f of result.findings) {
    process.stdout.write(formatFinding(f, opts.verbose) + '\n');
  }
  return 0;
}

function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`gsd-doctor: ${e.message}\n\n${HELP}`);
    return 2;
  }
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (opts.version) {
    process.stdout.write(`gsd-doctor v${VERSION}\n`);
    return 0;
  }
  if (!opts.subcommand) {
    process.stderr.write(`gsd-doctor: missing subcommand\n\n${HELP}`);
    return 2;
  }
  try {
    if (opts.subcommand === 'check') return runCheck(opts);
    if (opts.subcommand === 'repair') return runRepair(opts);
  } catch (e) {
    process.stderr.write(`gsd-doctor: ${e.message}\n`);
    return 1;
  }
  return 2;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = {
  VERSION,
  BROKEN_RE,
  repairCommand,
  walkHookCommands,
  diagnose,
  repair,
  parseArgs,
  main,
};

'use strict';

/**
 * Generate deterministic override churn notes for upstream bumps.
 *
 * The script compares the current override paths against a previous upstream
 * tree and a target upstream tree. CHANGELOG writes are intentionally limited
 * to the explicit override-churn marker block under Unreleased.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_OVERRIDES_DIR = path.join(PROJECT_ROOT, 'overrides');
const DEFAULT_CHANGELOG = path.join(PROJECT_ROOT, 'CHANGELOG.md');
const START_MARKER = '<!-- override-churn:start -->';
const END_MARKER = '<!-- override-churn:end -->';
const STATUS_KEYS = ['changed', 'carried', 'orphaned', 'added', 'removed'];

function usage() {
  return [
    'generate-override-churn',
    '',
    'Usage:',
    '  node scripts/generate-override-churn.js --from-upstream-dir <path> --to-upstream-dir <path> [options]',
    '',
    'Options:',
    '  --from-upstream-dir <path>  Previous reviewed upstream package directory.',
    '  --to-upstream-dir <path>    Target upstream package directory.',
    '  --overrides-dir <path>      Overrides directory. Defaults to ./overrides.',
    '  --changelog <path>          CHANGELOG file. Defaults to ./CHANGELOG.md.',
    '  --write                     Replace only the marked override-churn block.',
    '  --json                      Emit deterministic JSON instead of markdown.',
    '  -h, --help                  Show this help.',
    '',
  ].join('\n');
}

function normalizeRelPath(relPath) {
  return relPath.replace(/\\/g, '/');
}

function walkDir(dir, base = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      results.push(...walkDir(abs, rel));
    } else {
      results.push(normalizeRelPath(rel));
    }
  }

  return results;
}

function listOverridePaths(overridesDir) {
  return walkDir(overridesDir)
    .filter(relPath => relPath !== '.gitkeep')
    .filter(relPath => !relPath.endsWith('.REASON.md'))
    .sort((a, b) => a.localeCompare(b));
}

function hashFileContent(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function classifyOverride(relPath, fromUpstreamDir, toUpstreamDir) {
  const fromPath = path.join(fromUpstreamDir, relPath);
  const toPath = path.join(toUpstreamDir, relPath);
  const fromExists = fs.existsSync(fromPath);
  const toExists = fs.existsSync(toPath);

  if (fromExists && toExists) {
    const fromHash = hashFileContent(fromPath);
    const toHash = hashFileContent(toPath);
    return {
      relPath,
      status: fromHash === toHash ? 'carried' : 'changed',
      fromHash,
      toHash,
    };
  }

  if (!fromExists && toExists) {
    return {
      relPath,
      status: 'added',
      toHash: hashFileContent(toPath),
    };
  }

  if (fromExists && !toExists) {
    return {
      relPath,
      status: 'removed',
      fromHash: hashFileContent(fromPath),
    };
  }

  return { relPath, status: 'orphaned' };
}

function summarize(entries) {
  const summary = { total: entries.length };
  for (const key of STATUS_KEYS) {
    summary[key] = 0;
  }
  for (const entry of entries) {
    summary[entry.status]++;
  }
  return summary;
}

function generateOverrideChurn(options) {
  const fromUpstreamDir = options.fromUpstreamDir;
  const toUpstreamDir = options.toUpstreamDir;
  const overridesDir = options.overridesDir || DEFAULT_OVERRIDES_DIR;

  const entries = listOverridePaths(overridesDir)
    .map(relPath => classifyOverride(relPath, fromUpstreamDir, toUpstreamDir));

  return {
    generatedBy: 'scripts/generate-override-churn.js',
    fromUpstreamDir: path.resolve(fromUpstreamDir),
    toUpstreamDir: path.resolve(toUpstreamDir),
    overridesDir: path.resolve(overridesDir),
    summary: summarize(entries),
    entries,
  };
}

function formatChurnBody(result) {
  if (result.entries.length === 0) {
    return '- No override files found.';
  }

  return result.entries
    .map(entry => `- \`${entry.relPath}\` - ${entry.status}`)
    .join('\n');
}

function formatMarkdown(result) {
  return [
    '### Override Churn',
    START_MARKER,
    formatChurnBody(result),
    END_MARKER,
    '',
  ].join('\n');
}

function findNextReleaseHeading(changelog, unreleasedIndex) {
  const rest = changelog.slice(unreleasedIndex + '## [Unreleased]'.length);
  const match = rest.match(/\n## \[[^\]]+\]/);
  return match ? unreleasedIndex + '## [Unreleased]'.length + match.index : changelog.length;
}

function updateChangelogSection(changelog, generatedBody) {
  const start = changelog.indexOf(START_MARKER);
  const end = changelog.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`CHANGELOG must contain ${START_MARKER} and ${END_MARKER}`);
  }

  const unreleased = changelog.indexOf('## [Unreleased]');
  if (unreleased === -1) {
    throw new Error('CHANGELOG must contain ## [Unreleased]');
  }

  const nextRelease = findNextReleaseHeading(changelog, unreleased);
  if (start < unreleased || end > nextRelease) {
    throw new Error('override-churn markers must be under ## [Unreleased]');
  }

  const before = changelog.slice(0, start + START_MARKER.length);
  const after = changelog.slice(end);
  return `${before}\n${generatedBody.trimEnd()}\n${after}`;
}

function parseArgs(argv) {
  const options = {
    overridesDir: DEFAULT_OVERRIDES_DIR,
    changelog: DEFAULT_CHANGELOG,
    write: false,
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--from-upstream-dir' && argv[i + 1]) {
      options.fromUpstreamDir = argv[++i];
    } else if (arg === '--to-upstream-dir' && argv[i + 1]) {
      options.toUpstreamDir = argv[++i];
    } else if (arg === '--overrides-dir' && argv[i + 1]) {
      options.overridesDir = argv[++i];
    } else if (arg === '--changelog' && argv[i + 1]) {
      options.changelog = argv[++i];
    } else if (arg === '--write') {
      options.write = true;
    } else if (arg === '--json') {
      options.json = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

function validateOptions(options) {
  if (!options.fromUpstreamDir || !options.toUpstreamDir) {
    throw new Error('Required inputs missing: --from-upstream-dir and --to-upstream-dir');
  }

  for (const [label, dir] of [
    ['--from-upstream-dir', options.fromUpstreamDir],
    ['--to-upstream-dir', options.toUpstreamDir],
    ['--overrides-dir', options.overridesDir],
  ]) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new Error(`${label} is not an existing directory: ${dir}`);
    }
  }
}

function main(argv = process.argv.slice(2), io = process) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    io.stderr.write(`${error.message}\n\n${usage()}`);
    return 2;
  }

  if (options.help) {
    io.stdout.write(usage());
    return 0;
  }

  try {
    validateOptions(options);
    const result = generateOverrideChurn(options);

    if (options.write) {
      const changelog = fs.readFileSync(options.changelog, 'utf-8');
      const updated = updateChangelogSection(changelog, formatChurnBody(result));
      fs.writeFileSync(options.changelog, updated, 'utf-8');
    }

    if (options.json) {
      io.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      io.stdout.write(formatMarkdown(result));
    }

    return 0;
  } catch (error) {
    io.stderr.write(`${error.message}\n\n${usage()}`);
    return 2;
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  START_MARKER,
  END_MARKER,
  classifyOverride,
  formatChurnBody,
  formatMarkdown,
  generateOverrideChurn,
  hashFileContent,
  listOverridePaths,
  main,
  parseArgs,
  updateChangelogSection,
};

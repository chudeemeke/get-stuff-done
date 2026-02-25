#!/usr/bin/env node
// Check for GSD updates in background, write result to cache
// Called by SessionStart hook - runs once per session

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const homeDir = os.homedir();
const cwd = process.cwd();
const cacheDir = path.join(homeDir, '.claude', 'cache');
const cacheFile = path.join(cacheDir, 'gsd-update-check.json');

// VERSION file locations (check project first, then global)
const projectVersionFile = path.join(cwd, '.claude', 'get-stuff-done', 'VERSION');
const globalVersionFile = path.join(homeDir, '.claude', 'get-stuff-done', 'VERSION');

// Ensure cache directory exists
// eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheDir from path.join(homeDir, '.claude', 'cache'), no user input
if (!fs.existsSync(cacheDir)) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheDir from path.join(homeDir, '.claude', 'cache'), no user input
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Read gsd.role from config before spawning background process
// Per RESEARCH.md Open Question 1, Option B: inject role into spawn string
let gsdRole = 'consumer';
try {
  const { loadConfig, getConfigValue } = require('../src/config/ConfigLoader');
  const config = loadConfig();
  gsdRole = getConfigValue(config, 'gsd.role', 'consumer');
} catch (e) {
  // Silent fail - use consumer default
}

// Check cache TTL before spawning (4-hour TTL: skip if cache is fresh)
const FOUR_HOURS_SECS = 4 * 60 * 60;
let cacheIsFresh = false;
try {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheFile from path.join(homeDir, ...), no user input
  if (fs.existsSync(cacheFile)) {
    const existing = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const age = Math.floor(Date.now() / 1000) - (existing.checked || 0);
    if (age < FOUR_HOURS_SECS) {
      cacheIsFresh = true;
    }
  }
} catch (e) {
  // Silent fail - proceed with check
}

if (cacheIsFresh) {
  // Cache is fresh, skip background check
  process.exit(0);
}

// Run check in background (spawn background process, windowsHide prevents console flash)
const child = spawn(process.execPath, ['-e', `
  const fs = require('fs');
  const { execFileSync } = require('child_process');

  const cacheFile = ${JSON.stringify(cacheFile)};
  const projectVersionFile = ${JSON.stringify(projectVersionFile)};
  const globalVersionFile = ${JSON.stringify(globalVersionFile)};
  const role = ${JSON.stringify(gsdRole)};

  // Check project directory first (local install), then global
  let installed = '0.0.0';
  try {
    if (fs.existsSync(projectVersionFile)) {
      installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    } else if (fs.existsSync(globalVersionFile)) {
      installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    }
  } catch (e) {}

  if (role === 'maintainer') {
    // Maintainer path: git-based upstream check
    try {
      // Fetch upstream (15s timeout)
      execFileSync('git', ['fetch', 'upstream', 'main'], {
        encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (fetchErr) {
      // Fetch failed (no upstream remote, network down, etc.)
      // Leave existing cache unchanged if it exists, or write minimal error cache
      if (!fs.existsSync(cacheFile)) {
        fs.writeFileSync(cacheFile, JSON.stringify({
          update_available: false, installed, latest: 'unknown',
          checked: Math.floor(Date.now() / 1000), fetch_error: true
        }));
      }
      process.exit(0);
    }

    // Count upstream commits
    let upstreamCount = 0;
    try {
      const countResult = execFileSync('git',
        ['rev-list', '--count', 'HEAD..upstream/main'],
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      upstreamCount = parseInt(countResult.trim(), 10) || 0;
    } catch (e) { upstreamCount = 0; }

    if (upstreamCount === 0) {
      fs.writeFileSync(cacheFile, JSON.stringify({
        update_available: false, installed, latest: 'upstream/main',
        checked: Math.floor(Date.now() / 1000), upstream_count: 0
      }));
      process.exit(0);
    }

    // Get commit subjects for classification (lightweight -- no diffs)
    let commitSummary = [];
    let highestSeverity = 'other';
    try {
      // Use unit separator (0x1f) as field delimiter between hash and subject
      const SEP = '\\x1f';
      const logResult = execFileSync('git',
        ['log', '--format=%h' + SEP + '%s', 'HEAD..upstream/main'],
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const lines = logResult.trim().split('\\n').filter(Boolean);

      // Inline subject-only classification (per RESEARCH.md Open Question 2):
      // Cannot require sync.cjs from background process (no project node_modules on path).
      // Duplicate the subject-only classification logic here.
      // File-path heuristics are skipped (too heavy for background hook).
      const SEVERITY_ORDER = ['security', 'breaking', 'fix', 'feat', 'refactor', 'docs', 'chore', 'other'];
      let highestIdx = SEVERITY_ORDER.length - 1;

      for (const line of lines) {
        const sepIdx = line.indexOf(SEP);
        if (sepIdx === -1) continue;
        const hashShort = line.substring(0, sepIdx);
        const subject = line.substring(sepIdx + 1);

        // Subject-only classification (same precedence as classifyCommit but no file-path fallback)
        let type = 'other';
        if (/\\b(security|cve|vuln|exploit|xss|sqli|rce|injection)\\b/i.test(subject)) {
          type = 'security';
        } else if (/^[a-z]+(\\(.+\\))?!:/.test(subject) || /BREAKING[ -]CHANGE/i.test(subject)) {
          type = 'breaking';
        } else {
          const m = subject.match(/^(feat|fix|refactor|docs|chore|test|perf|style)(\\(.+\\))?:/i);
          if (m) {
            const normalize = { test: 'chore', perf: 'refactor', style: 'chore' };
            const t = m[1].toLowerCase();
            type = normalize[t] || t;
          }
        }

        commitSummary.push({ hashShort, subject, type });
        const idx = SEVERITY_ORDER.indexOf(type);
        if (idx < highestIdx) highestIdx = idx;
      }
      highestSeverity = SEVERITY_ORDER[highestIdx];
    } catch (e) {}

    const result = {
      update_available: true,
      installed,
      latest: 'upstream/main',
      checked: Math.floor(Date.now() / 1000),
      upstream_count: upstreamCount,
      highest_severity: highestSeverity,
      commit_summary: commitSummary
    };
    fs.writeFileSync(cacheFile, JSON.stringify(result));
  } else {
    // Consumer path: npm registry check (unchanged from original)
    let latest = null;
    try {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      latest = execFileSync(npmCmd, ['view', '@chude/get-stuff-done', 'version'], { encoding: 'utf8', timeout: 10000, windowsHide: true }).trim();
    } catch (e) {}

    const result = {
      update_available: latest && installed !== latest,
      installed,
      latest: latest || 'unknown',
      checked: Math.floor(Date.now() / 1000)
    };

    fs.writeFileSync(cacheFile, JSON.stringify(result));
  }
`], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true  // Required on Windows for proper process detachment
});

child.unref();

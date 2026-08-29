#!/usr/bin/env node
// gsd-hook-version: {{GSD_VERSION}}
// Background worker spawned by gsd-check-update.js.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FALLBACK_PACKAGE_NAME = '@chude/get-stuff-done';
const SEVEN_DAYS_SECS = 7 * 24 * 60 * 60;
const DEFAULT_MANAGED_HOOKS = Object.freeze([
  'gsd-check-update-worker.js',
  'gsd-check-update.js',
  'gsd-config-reload.js',
  'gsd-context-monitor.js',
  'gsd-cursor-post-tool.js',
  'gsd-cursor-session-start.js',
  'gsd-ensure-canonical-path.js',
  'gsd-graphify-update.sh',
  'gsd-phase-boundary.sh',
  'gsd-prompt-guard.js',
  'gsd-read-guard.js',
  'gsd-read-injection-scanner.js',
  'gsd-session-state.sh',
  'gsd-statusline.js',
  'gsd-update-banner.js',
  'gsd-validate-commit.sh',
  'gsd-workflow-guard.js',
  'gsd-worktree-path-guard.js',
]);

function readJson(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeJson(filePath, value) {
  if (!filePath) return;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value));
  } catch (e) {
    // Best effort. A non-writable cache should never block SessionStart.
  }
}

function parseSemver(version) {
  const match = String(version || '').trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return match.slice(1).map(part => Number.parseInt(part, 10));
}

function isNewer(candidate, baseline) {
  const next = parseSemver(candidate);
  const current = parseSemver(baseline);
  if (!next || !current) return false;

  for (let i = 0; i < next.length; i++) {
    if (next[i] > current[i]) return true;
    if (next[i] < current[i]) return false;
  }
  return false;
}

function readInstalledVersion(projectVersionFile, globalVersionFile) {
  const candidates = [projectVersionFile, globalVersionFile].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return {
          installed: fs.readFileSync(candidate, 'utf8').trim() || '0.0.0',
          configDir: path.dirname(path.dirname(candidate)),
        };
      }
    } catch (e) {
      // Try the next candidate.
    }
  }

  return { installed: '0.0.0', configDir: '' };
}

function loadManagedHooks() {
  const candidates = [
    path.join(__dirname, 'managed-hooks-registry.cjs'),
    path.join(__dirname, '..', '..', 'dist', 'hooks', 'managed-hooks-registry.cjs'),
    path.join(
      __dirname,
      '..',
      '..',
      'node_modules',
      '@opengsd',
      'gsd-core',
      'hooks',
      'managed-hooks-registry.cjs'
    ),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const registry = require(candidate);
        if (registry && Array.isArray(registry.MANAGED_HOOKS)) {
          return registry.MANAGED_HOOKS;
        }
      }
    } catch (e) {
      // Fall back to the baked list.
    }
  }

  return DEFAULT_MANAGED_HOOKS;
}

function detectStaleHooks(configDir, installed, managedHooks) {
  if (!configDir) return [];

  const hooksDir = path.join(configDir, 'hooks');
  try {
    if (!fs.existsSync(hooksDir)) return [];

    const managed = new Set(managedHooks);
    return fs.readdirSync(hooksDir)
      .filter(file => managed.has(file))
      .flatMap(file => {
        try {
          const content = fs.readFileSync(path.join(hooksDir, file), 'utf8');
          const versionMatch = content.match(/(?:\/\/|#) gsd-hook-version:\s*(.+)/);
          if (!versionMatch) {
            return [{ file, hookVersion: 'unknown', installedVersion: installed }];
          }

          const hookVersion = versionMatch[1].trim();
          if (!hookVersion.includes('{{') && isNewer(installed, hookVersion)) {
            return [{ file, hookVersion, installedVersion: installed }];
          }
        } catch (e) {
          // Ignore unreadable hook files.
        }
        return [];
      });
  } catch (e) {
    return [];
  }
}

function shouldSkipNetwork(existingCache, nowSecs) {
  return Boolean(
    existingCache
      && typeof existingCache.checked === 'number'
      && nowSecs - existingCache.checked < SEVEN_DAYS_SECS
  );
}

function mergeLocalResult(existingCache, localState) {
  const merged = {
    ...(existingCache || {}),
    update_available: Boolean(existingCache && existingCache.update_available),
    installed: localState.installed,
    latest: existingCache && existingCache.latest ? existingCache.latest : 'unknown',
    checked: existingCache && typeof existingCache.checked === 'number'
      ? existingCache.checked
      : localState.nowSecs,
    package_name: localState.packageName,
  };

  if (localState.staleHooks.length > 0) {
    merged.stale_hooks = localState.staleHooks;
  } else {
    delete merged.stale_hooks;
  }

  return merged;
}

function classifySubject(subject) {
  if (/\b(security|cve|vuln|exploit|xss|sqli|rce|injection)\b/i.test(subject)) {
    return 'security';
  }
  if (/^[a-z]+(\(.+\))?!:/.test(subject) || /BREAKING[ -]CHANGE/i.test(subject)) {
    return 'breaking';
  }

  const match = subject.match(/^(feat|fix|refactor|docs|chore|test|perf|style)(\(.+\))?:/i);
  if (!match) return 'other';

  const normalize = { test: 'chore', perf: 'refactor', style: 'chore' };
  const type = match[1].toLowerCase();
  return normalize[type] || type;
}

function readCommitSummary(cwd) {
  const SEVERITY_ORDER = ['security', 'breaking', 'fix', 'feat', 'refactor', 'docs', 'chore', 'other'];
  const SEP = '\x1f';
  let commitSummary = [];
  let highestSeverity = 'other';
  let highestIdx = SEVERITY_ORDER.length - 1;

  try {
    const logResult = execFileSync(
      'git',
      ['log', `--format=%h${SEP}%s`, 'HEAD..upstream/main'],
      { encoding: 'utf8', cwd, stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const lines = logResult.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const sepIdx = line.indexOf(SEP);
      if (sepIdx === -1) continue;

      const hashShort = line.substring(0, sepIdx);
      const subject = line.substring(sepIdx + 1);
      const type = classifySubject(subject);
      commitSummary.push({ hashShort, subject, type });

      const idx = SEVERITY_ORDER.indexOf(type);
      if (idx !== -1 && idx < highestIdx) {
        highestIdx = idx;
      }
    }
    highestSeverity = SEVERITY_ORDER[highestIdx];
  } catch (e) {
    commitSummary = [];
  }

  return { commitSummary, highestSeverity };
}

function runMaintainerCheck(localState) {
  const cwd = process.cwd();
  const base = {
    installed: localState.installed,
    package_name: localState.packageName,
  };

  try {
    execFileSync('git', ['fetch', 'upstream', 'main'], {
      encoding: 'utf8',
      cwd,
      timeout: 3000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (e) {
    if (localState.existingCache) {
      return null;
    }
    return {
      ...base,
      update_available: false,
      latest: 'unknown',
      checked: localState.nowSecs,
      fetch_error: true,
      ...(localState.staleHooks.length > 0 ? { stale_hooks: localState.staleHooks } : {}),
    };
  }

  let upstreamCount = 0;
  try {
    const countResult = execFileSync('git', ['rev-list', '--count', 'HEAD..upstream/main'], {
      encoding: 'utf8',
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    upstreamCount = Number.parseInt(countResult.trim(), 10) || 0;
  } catch (e) {
    upstreamCount = 0;
  }

  if (upstreamCount === 0) {
    return {
      ...base,
      update_available: false,
      latest: 'upstream/main',
      checked: localState.nowSecs,
      upstream_count: 0,
      ...(localState.staleHooks.length > 0 ? { stale_hooks: localState.staleHooks } : {}),
    };
  }

  const { commitSummary, highestSeverity } = readCommitSummary(cwd);
  return {
    ...base,
    update_available: true,
    latest: 'upstream/main',
    checked: localState.nowSecs,
    upstream_count: upstreamCount,
    highest_severity: highestSeverity,
    commit_summary: commitSummary,
    ...(localState.staleHooks.length > 0 ? { stale_hooks: localState.staleHooks } : {}),
  };
}

function runConsumerCheck(localState) {
  let latest = null;

  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    latest = execFileSync(npmCmd, ['view', localState.packageName, 'version'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
    }).trim();
  } catch (e) {
    latest = null;
  }

  return {
    update_available: Boolean(latest && isNewer(latest, localState.installed)),
    installed: localState.installed,
    latest: latest || 'unknown',
    checked: localState.nowSecs,
    package_name: localState.packageName,
    ...(localState.staleHooks.length > 0 ? { stale_hooks: localState.staleHooks } : {}),
  };
}

function main() {
  const cacheFile = process.env.GSD_CACHE_FILE;
  const packageName = process.env.GSD_PACKAGE_NAME || FALLBACK_PACKAGE_NAME;
  const existingCache = readJson(cacheFile);
  const nowSecs = Math.floor(Date.now() / 1000);
  const { installed, configDir } = readInstalledVersion(
    process.env.GSD_PROJECT_VERSION_FILE,
    process.env.GSD_GLOBAL_VERSION_FILE
  );
  const staleHooks = detectStaleHooks(configDir, installed, loadManagedHooks());

  const localState = { existingCache, installed, staleHooks, nowSecs, packageName };

  if (shouldSkipNetwork(existingCache, nowSecs)) {
    writeJson(cacheFile, mergeLocalResult(existingCache, localState));
    return;
  }

  const role = process.env.GSD_ROLE || 'consumer';
  const result = role === 'maintainer'
    ? runMaintainerCheck(localState)
    : runConsumerCheck(localState);

  if (result) {
    writeJson(cacheFile, result);
  }
}

main();

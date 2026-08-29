#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- statusline script with computed paths from internal logic, no user input */

// Claude Code Statusline - GSD Edition
// Shows: model | current task | git branch | context bar | directory
//
// IMPORTANT: Claude Code's remaining_percentage is RAW remaining space, NOT threshold-relative.
// Autocompact triggers when remaining hits ~16.5% (configurable).
// We scale the bar so 0% = fresh context, 100% = autocompact fires.
//
// Formula: proximity = (rawUsage / maxUsage) * 100
// Where: rawUsage = 100 - remaining, maxUsage = 100 - threshold

const fs = require('fs');
const path = require('path');
const os = require('os');

const FALLBACK_IDENTITY = Object.freeze({
  packageName: '@chude/get-stuff-done',
  PACKAGE_NAME: '@chude/get-stuff-done',
  updateCacheFileName: 'gsd-update-check-opengsd-gsd-core.json',
});

function requireIfPresent(modulePath) {
  try {
    if (fs.existsSync(modulePath)) {
      return require(modulePath);
    }
  } catch (e) {
    // Fall through to the next candidate.
  }
  return null;
}

function loadPackageIdentity() {
  const candidates = [
    path.join(__dirname, '..', 'gsd-core', 'bin', 'lib', 'package-identity.cjs'),
    path.join(__dirname, '..', '..', 'dist', 'gsd-core', 'bin', 'lib', 'package-identity.cjs'),
  ];

  for (const candidate of candidates) {
    const identity = requireIfPresent(candidate);
    if (identity && (identity.packageName || identity.PACKAGE_NAME)) {
      return {
        packageName: identity.packageName || identity.PACKAGE_NAME,
        PACKAGE_NAME: identity.PACKAGE_NAME || identity.packageName,
        updateCacheFileName: identity.updateCacheFileName || FALLBACK_IDENTITY.updateCacheFileName,
      };
    }
  }

  return FALLBACK_IDENTITY;
}

const packageIdentity = loadPackageIdentity();
const PACKAGE_NAME = packageIdentity.PACKAGE_NAME || packageIdentity.packageName;

// Autocompact threshold: matches Claude Code internal default when the
// CLAUDE_CODE_AUTO_COMPACT_WINDOW token setting is absent.
const DEFAULT_AUTOCOMPACT_THRESHOLD = 16.5;
let gsdRole = 'consumer';
try {
  const { loadConfig, getConfigValue } = require('../../src/config/ConfigLoader');
  const config = loadConfig();
  gsdRole = getConfigValue(config, 'gsd.role', 'consumer');
} catch (e) {
  // Silent fail - use defaults
}

// --- Theme System ---
// Centralized colors and styles from src/theme
const { getTheme } = require('../../src/theme');
const theme = getTheme();

// Note: theme.reset available if needed for manual ANSI resets

// Branding - icon brighter than text per CONTEXT.md
function getBranding() {
  return `${theme.brand.icon.render('\u29C9')} ${theme.brand.text.render('[GSD]')}`;
}

// Separator
const SEP = ` ${theme.text.separator.render('|')} `;

// NOTE: Blink support moved to theme system (uses reverse video fallback)

// Unicode support detection - use platform module for expanded terminal detection
const { detectTerminal } = require('../../src/platform/terminal');
const terminalCaps = detectTerminal();

// Stage icons with fallback
const ICONS = terminalCaps.supportsUnicode
  ? { warning: '\u26A0\uFE0F', lightning: '\u26A1' }  // ⚠️, ⚡
  : { warning: '!', lightning: '>' };

// Stage thresholds (fixed percentages of proximity to autocompact)
// Green: 0-50% proximity (healthy)
// Amber: 50-75% proximity (caution)
// Red: 75-87.5% proximity (urgent)
// Critical: 87.5%+ proximity (critical with reverse video)
const STAGE_CAUTION = 50;
const STAGE_URGENT = 75;
const STAGE_CRITICAL = 87.5;

function readGsdState(dir) {
  const home = os.homedir();
  let current = dir;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(current, '.planning', 'STATE.md');
    if (fs.existsSync(candidate)) {
      try {
        return parseStateMd(fs.readFileSync(candidate, 'utf8'));
      } catch (e) {
        return null;
      }
    }

    const parent = path.dirname(current);
    if (parent === current || current === home) break;
    current = parent;
  }
  return null;
}

function parseStateMd(content) {
  const state = {};
  const normalized = String(content || '').replace(/\r\n/g, '\n');
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---/);

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    for (const line of frontmatter.split('\n')) {
      const match = line.match(/^(\w+):\s*(.+)/);
      if (!match) continue;
      const key = match[1];
      const value = match[2].trim().replace(/^["']|["']$/g, '');

      if (key === 'status') state.status = value === 'null' ? null : value;
      if (key === 'milestone') state.milestone = value === 'null' ? null : value;
      if (key === 'milestone_name') state.milestoneName = value === 'null' ? null : value;
      if (key === 'active_phase') {
        state.activePhase = (value === 'null' || value === '') ? null : value;
      }
      if (key === 'next_action') {
        state.nextAction = (value === 'null' || value === '') ? null : value;
      }
    }

    const nextPhasesFlow = frontmatter.match(/^next_phases:\s*\[([^\]]*)\]/m);
    if (nextPhasesFlow) {
      const items = nextPhasesFlow[1]
        .split(',')
        .map(item => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
      state.nextPhases = items.length > 0 ? items : null;
    } else {
      const nextPhasesBlock = frontmatter.match(/^next_phases:\s*\n((?:[ \t]*-[ \t]*[^\n]+\n?)*)/m);
      if (nextPhasesBlock) {
        const items = nextPhasesBlock[1]
          .split('\n')
          .map(line => line.match(/^[ \t]*-[ \t]*(.+)$/))
          .filter(Boolean)
          .map(match => match[1].trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        state.nextPhases = items.length > 0 ? items : null;
      }
    }

    const progressMatch = frontmatter.match(/^progress:\s*\n((?:[ \t]+\w+:.+\n?)+)/m);
    if (progressMatch) {
      const completed = progressMatch[1].match(/^[ \t]+completed_phases:\s*(\d+)/m);
      const total = progressMatch[1].match(/^[ \t]+total_phases:\s*(\d+)/m);
      const percent = progressMatch[1].match(/^[ \t]+percent:\s*(\d+)/m);
      if (completed) state.completedPhases = completed[1];
      if (total) state.totalPhases = total[1];
      if (percent) state.percent = percent[1];
    }
  }

  const phaseMatch = normalized.match(/^Phase:\s*(\d+)\s+of\s+(\d+)(?:\s+\(([^)]+)\))?/m);
  if (phaseMatch) {
    state.phaseNum = phaseMatch[1];
    state.phaseTotal = phaseMatch[2];
    state.phaseName = phaseMatch[3] || null;
  }

  if (!state.status) {
    const bodyStatus = normalized.match(/^Status:\s*(.+)/m);
    if (bodyStatus) {
      const raw = bodyStatus[1].trim().toLowerCase();
      if (raw.includes('ready to plan') || raw.includes('planning')) state.status = 'planning';
      else if (raw.includes('execut')) state.status = 'executing';
      else if (raw.includes('complet') || raw.includes('archived')) state.status = 'complete';
    }
  }

  return state;
}

function renderProgressBar(percent) {
  if (percent == null || isNaN(percent)) return '';
  const pct = Math.max(0, Math.min(100, parseInt(percent, 10)));
  const filled = Math.floor(pct / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  return `[${bar}] ${pct}%`;
}

function formatGsdState(state) {
  const parts = [];

  if (state.milestone || state.milestoneName) {
    const pieces = [
      state.milestone || '',
      state.milestoneName && state.milestoneName !== 'milestone' ? state.milestoneName : '',
      renderProgressBar(state.percent),
    ].filter(Boolean);
    if (pieces.length > 0) parts.push(pieces.join(' '));
  }

  const nextPhases = state.nextPhases && state.nextPhases.length > 0
    ? state.nextPhases.join('/')
    : null;

  if (state.activePhase) {
    const stage = state.status || '';
    parts.push(stage ? `Phase ${state.activePhase} ${stage}` : `Phase ${state.activePhase}`);
  } else if (state.nextAction && nextPhases) {
    parts.push(`next ${state.nextAction} ${nextPhases}`);
  } else if (
    Number(state.percent) === 100
    || (state.completedPhases && state.totalPhases && state.completedPhases === state.totalPhases)
  ) {
    parts.push('milestone complete');
  } else {
    if (state.status) parts.push(state.status);
    if (state.phaseNum && state.phaseTotal) {
      const phase = state.phaseName
        ? `${state.phaseName} (${state.phaseNum}/${state.phaseTotal})`
        : `ph ${state.phaseNum}/${state.phaseTotal}`;
      parts.push(phase);
    }
  }

  return parts.join(' · ');
}

// Read JSON from stdin
let input = '';
// Safety: exit cleanly if stdin takes too long (belt-and-suspenders, per D-08)
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);

    const model = data.model?.display_name || 'Claude';
    const dir = data.workspace?.current_dir || process.cwd();
    const session = data.session_id || '';
    const remaining = data.context_window?.remaining_percentage;

    // Current context usage = input + cache_creation + cache_read
    const usage = data.context_window?.current_usage;
    const contextTokens = usage
      ? (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0)
      : 0;

    // Context window display (shows proximity to autocompact)
    let ctx = '';
    if (remaining != null) {
      const totalCtx = data.context_window?.total_tokens || 1_000_000;
      const autoCompactWindow = parseInt(process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW || '0', 10);
      const autoCompactThreshold = autoCompactWindow > 0
        ? Math.min(100, Math.max(0, (1 - autoCompactWindow / totalCtx) * 100))
        : DEFAULT_AUTOCOMPACT_THRESHOLD;

      // Normalize raw remaining against the usable range before autocompact.
      const usableRemaining = Math.max(
        0,
        ((remaining - autoCompactThreshold) / (100 - autoCompactThreshold)) * 100
      );
      const proximity = Math.max(0, Math.min(100, Math.round(100 - usableRemaining)));
      const rawUsage = Math.round(100 - remaining);

      // Write context metrics to bridge file for the context-monitor PostToolUse hook.
      // The monitor reads this file to inject agent-facing warnings when context is low.
      const sessionSafe = session && !/[/\\]|\.\./.test(session);
      if (sessionSafe) {
        try {
          const bridgePath = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
          const bridgeData = JSON.stringify({
            session_id: session,
            remaining_percentage: remaining,
            used_pct: rawUsage,
            timestamp: Math.floor(Date.now() / 1000)
          });
          fs.writeFileSync(bridgePath, bridgeData);
        } catch (e) {
          // Silent fail -- bridge is best-effort, don't break statusline
        }
      }

      // Build progress bar (10 segments) - shows proximity to autocompact
      const filled = Math.floor(proximity / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

      // 4-stage logic based on proximity to autocompact:
      // Green (0-50%): healthy
      // Amber (50-75%): caution (uses 256-color amber)
      // Red (75-87.5%): urgent
      // Critical (87.5%+): critical (red + reverse)
      let icon = '';
      let stageStyle;

      if (proximity < STAGE_CAUTION) {
        icon = '';
        stageStyle = theme.status.healthy;
      } else if (proximity < STAGE_URGENT) {
        icon = `${ICONS.warning} `;
        stageStyle = theme.status.caution;
      } else if (proximity < STAGE_CRITICAL) {
        icon = `${ICONS.lightning} `;
        stageStyle = theme.status.urgent;
      } else {
        icon = `${ICONS.lightning} `;
        stageStyle = theme.status.critical;
      }

      ctx = stageStyle.render(`${icon}${bar} ${proximity}%`);
    }

    // Current task from todos
    let task = '';
    const homeDir = os.homedir();
    const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude');
    const todosDir = path.join(claudeDir, 'todos');
    if (session && fs.existsSync(todosDir)) {
      try {
        let latest = null;
        for (const entry of fs.readdirSync(todosDir)) {
          if (!entry.startsWith(session) || !entry.includes('-agent-') || !entry.endsWith('.json')) continue;
          const mtime = fs.statSync(path.join(todosDir, entry)).mtime;
          if (!latest || mtime > latest.mtime) latest = { name: entry, mtime };
        }

        if (latest) {
          const todos = JSON.parse(fs.readFileSync(path.join(todosDir, latest.name), 'utf8'));
          const inProgress = todos.find(t => t.status === 'in_progress');
          if (inProgress) task = inProgress.activeForm || '';
        }
      } catch (e) {
        // Silently fail on todo filesystem errors.
      }
    }

    const gsdStateStr = task ? '' : formatGsdState(readGsdState(dir) || {});

    // Build update notification for line 2
    let line2 = '';
    const cacheFile = path.join(homeDir, '.cache', 'gsd', packageIdentity.updateCacheFileName);
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        const cacheMatchesPackage = cache.package_name && cache.package_name === PACKAGE_NAME;
        if (cacheMatchesPackage && cache.update_available && !cache.fetch_error) {
          if (gsdRole === 'maintainer') {
            // Maintainer sees rich upstream notification with count + severity
            const count = cache.upstream_count || 0;
            const severity = cache.highest_severity || 'other';
            // Severity label mapping per CONTEXT.md
            const severityLabels = {
              fix: 'fixes', feat: 'features', security: 'security fixes',
              breaking: 'breaking changes', chore: 'chores', refactor: 'refactors',
              docs: 'docs', other: 'changes'
            };
            const severityLabel = severityLabels[severity] || 'changes';
            const countLabel = count === 1 ? '1 commit' : `${count} commits`;
            line2 = theme.text.notice.render(
              `${countLabel} upstream (${severityLabel}) | /gsd:upstream`
            );
          } else {
            // Consumer sees version update prompt (use correct cache field names)
            const current = cache.installed || 'unknown';
            const latest = cache.latest || 'unknown';
            line2 = theme.text.notice.render(`${current} \u2192 ${latest} | /gsd:update`);
          }
        }
        if (cacheMatchesPackage && cache.stale_hooks && cache.stale_hooks.length > 0 && !line2) {
          line2 = theme.text.notice.render('stale hooks | /gsd:update');
        }
      } catch (e) {}
    }

    // Git branch (traverse up to find .git, supports worktrees)
    let branchDisplay = '';
    let currentPath = dir;
    while (currentPath) {
      const gitPath = path.join(currentPath, '.git');
      if (fs.existsSync(gitPath)) {
        try {
          let gitDir = gitPath;
          const stats = fs.statSync(gitPath);

          // If .git is a file (worktree), read the gitdir path
          if (stats.isFile()) {
            const gitFileContent = fs.readFileSync(gitPath, 'utf8');
            const gitDirMatch = gitFileContent.match(/gitdir:\s*(.+)/);
            if (gitDirMatch) {
              gitDir = gitDirMatch[1].trim();
              // Handle relative paths in worktree .git files
              if (!path.isAbsolute(gitDir)) {
                gitDir = path.resolve(currentPath, gitDir);
              }
            }
          }

          // Read HEAD from the actual git directory
          const headFile = path.join(gitDir, 'HEAD');
          if (fs.existsSync(headFile)) {
            const headContent = fs.readFileSync(headFile, 'utf8');
            const match = headContent.match(/ref: refs\/heads\/(.+)/);
            if (match) {
              branchDisplay = theme.text.muted.render(match[1].trim());
            }
          }
        } catch (e) {
          // Silently fail on git errors - don't break statusline
        }
        break;
      }
      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) break;
      currentPath = parentPath;
    }

    // Build statusline with new layout
    const dirname = path.basename(dir);
    const branding = getBranding();
    const modelDisplay = theme.text.muted.render(model);
    const cwdDisplay = theme.text.muted.render(dirname);
    const tokenDisplay = contextTokens > 0
      ? theme.text.muted.render(`${Number(contextTokens).toLocaleString()} tokens`)
      : '';
    const middleDisplay = task || gsdStateStr;
    const middleSegment = middleDisplay ? `${SEP}${theme.text.muted.render(middleDisplay)}` : '';

    // Line 1: branding | model | [branch |] context bar | [task/state |] cwd [| tokens]
    // Note: ctx already includes its own color codes and spacing
    const branchSep = branchDisplay ? `${branchDisplay}${SEP}` : '';
    const tokenSep = tokenDisplay ? `${SEP}${tokenDisplay}` : '';
    const line1 = `${branding}${SEP}${modelDisplay}${SEP}${branchSep}${ctx.trim()}${middleSegment}${SEP}${cwdDisplay}${tokenSep}`;

    // Output: line1, or line1 + newline + line2 if update available
    if (line2) {
      process.stdout.write(`${line1}\n${line2}`);
    } else {
      process.stdout.write(line1);
    }
  } catch (e) {
    // Silent fail - don't break statusline on parse errors
  }
});

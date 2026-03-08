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

// Autocompact threshold: matches Claude Code internal default; not user-configurable
const AUTOCOMPACT_THRESHOLD = 16.5;
let gsdRole = 'consumer';
try {
  const { loadConfig, getConfigValue } = require('../src/config/ConfigLoader');
  const config = loadConfig();
  gsdRole = getConfigValue(config, 'gsd.role', 'consumer');
} catch (e) {
  // Silent fail - use defaults
}

// --- Theme System ---
// Centralized colors and styles from src/theme
const { getTheme } = require('../src/theme');
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
const { detectTerminal } = require('../src/platform/terminal');
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

// Read JSON from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const model = data.model?.display_name || 'Claude';
    const dir = data.workspace?.current_dir || process.cwd();
    const session = data.session_id || '';
    const remaining = data.context_window?.remaining_percentage;

    // Context window display (shows proximity to autocompact)
    let ctx = '';
    if (remaining != null) {
      // Scale raw usage to threshold: 0% raw = 0% bar, threshold = 100% bar
      const maxUsage = 100 - AUTOCOMPACT_THRESHOLD;  // e.g., 83.5% when threshold=16.5
      const rawUsage = 100 - remaining;
      const proximity = Math.max(0, Math.min(100, Math.round((rawUsage / maxUsage) * 100)));

      // Write context metrics to bridge file for the context-monitor PostToolUse hook.
      // The monitor reads this file to inject agent-facing warnings when context is low.
      if (session) {
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
    const todosDir = path.join(homeDir, '.claude', 'todos');
    if (session && fs.existsSync(todosDir)) {
      const files = fs.readdirSync(todosDir)
        .filter(f => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length > 0) {
        try {
          const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
          const inProgress = todos.find(t => t.status === 'in_progress');
          if (inProgress) task = inProgress.activeForm || '';
        } catch (e) {}
      }
    }

    // Build update notification for line 2
    let line2 = '';
    const cacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-update-check.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cache.update_available && !cache.fetch_error) {
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

    // Line 1: branding | model | [branch |] context bar | cwd
    // Note: ctx already includes its own color codes and spacing
    const branchSep = branchDisplay ? `${branchDisplay}${SEP}` : '';
    const line1 = `${branding}${SEP}${modelDisplay}${SEP}${branchSep}${ctx.trim()}${SEP}${cwdDisplay}`;

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

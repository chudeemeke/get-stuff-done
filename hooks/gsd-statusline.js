#!/usr/bin/env node
// Claude Code Statusline - GSD Edition
// Shows: model | directory | autocompact proximity
//
// IMPORTANT: Claude Code's remaining_percentage is ALREADY threshold-relative.
// It represents "% of context left until autocompact triggers", not raw free space.
// When remaining_percentage hits 0%, autocompact fires.
//
// Therefore: proximity = 100 - remaining_percentage
// This directly gives us "how close to autocompact" as a 0-100% value.

const fs = require('fs');
const path = require('path');
const os = require('os');

// Load config for role only
let gsdRole = 'consumer';
try {
  const { loadConfig, getConfigValue } = require('../src/config/ConfigLoader');
  const config = loadConfig();
  gsdRole = getConfigValue(config, 'gsd.role', 'consumer');
} catch (e) {
  // Silent fail - use default
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

// Unicode support detection (Windows Console Host has limited Unicode)
function supportsUnicode() {
  if (process.platform === 'win32') {
    return Boolean(process.env.WT_SESSION) ||  // Windows Terminal
           Boolean(process.env.ConEmuTask) ||   // ConEmu
           process.env.TERM_PROGRAM === 'vscode';
  }
  return process.env.TERM !== 'linux';
}

// Stage icons with fallback
const ICONS = supportsUnicode()
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
      // remaining_percentage IS the "% left until autocompact triggers"
      // So proximity to autocompact = 100 - remaining
      const proximity = Math.max(0, Math.min(100, 100 - Math.round(remaining)));

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
        if (cache.update_available) {
          if (gsdRole === 'maintainer') {
            // Maintainer sees upstream sync prompt
            line2 = theme.text.notice.render('\uD83D\uDCE6 upstream updates | /gsd:upstream');
          } else {
            // Consumer sees version update prompt
            const current = cache.current_version || 'v0.1.0';
            const latest = cache.latest_version || 'v0.2.0';
            line2 = theme.text.notice.render(`\uD83D\uDCE6 ${current} \u2192 ${latest} | /gsd:update`);
          }
        }
      } catch (e) {}
    }

    // Build statusline with new layout
    const dirname = path.basename(dir);
    const branding = getBranding();
    const modelDisplay = theme.text.muted.render(model);
    const cwdDisplay = theme.text.muted.render(dirname);

    // Line 1: branding | model | context bar | cwd
    // Note: ctx already includes its own color codes and spacing
    const line1 = `${branding}${SEP}${modelDisplay}${SEP}${ctx.trim()}${SEP}${cwdDisplay}`;

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

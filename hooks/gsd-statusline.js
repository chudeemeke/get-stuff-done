#!/usr/bin/env node
// Claude Code Statusline - GSD Edition
// Shows: model | current task | directory | context usage

const fs = require('fs');
const path = require('path');
const os = require('os');

// Load config for dynamic thresholds
let autocompactThreshold = 50;  // Default
try {
  const { loadConfig, getConfigValue } = require('../src/config/ConfigLoader');
  const config = loadConfig();
  autocompactThreshold = getConfigValue(config, 'context_management.autocompact_threshold', 50);
} catch (e) {
  // Silent fail - use default threshold
}

// ANSI color codes
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BRIGHT = '\x1b[1m';
const RESET = '\x1b[0m';
const WHITE = '\x1b[37m';

// Branding - icon brighter than text per CONTEXT.md
function getBranding() {
  return `${CYAN}${BRIGHT}⧉${RESET} ${CYAN}[GSD]${RESET}`;
}

// Separator
const SEP = ` ${WHITE}|${RESET} `;

// Terminal blink support detection
function supportsBlinking() {
  const term = process.env.TERM || '';
  const termProgram = process.env.TERM_PROGRAM || '';

  // Known to support: xterm variants, iTerm, konsole
  if (term.includes('xterm') || termProgram === 'iTerm.app') return true;

  // Known NOT to support: VS Code, GNOME Terminal
  if (termProgram === 'vscode') return false;

  // Default: optimistically try blink
  return true;
}

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

// Calculate color thresholds as fractions of autocompact threshold
// Green -> Yellow at 50% of autocompact
// Yellow -> Red at 75% of autocompact
// Red (no blink) -> Red (blink) at 87.5% of autocompact
const greenMax = autocompactThreshold * 0.5;
const yellowMax = autocompactThreshold * 0.75;
const orangeMax = autocompactThreshold * 0.875;

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

    // Context window display (shows USED percentage)
    let ctx = '';
    if (remaining != null) {
      const rem = Math.round(remaining);
      const used = Math.max(0, Math.min(100, 100 - rem));

      // Build progress bar (10 segments)
      const filled = Math.floor(used / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

      // Stage icons and color logic (4-stage per CONTEXT.md)
      let icon = '';
      let color;
      const BLINK = supportsBlinking() ? '\x1b[5m' : '\x1b[1m';  // Fallback to bright

      // 4-stage logic per CONTEXT.md:
      // Green (0-50%): no icon, green color, no blink
      // Yellow (50-75%): warning icon, yellow color, no blink
      // Red no-blink (75-87.5%): lightning icon, red color, NO blink
      // Red with blink (87.5%+): lightning icon, red color, WITH blink
      if (used < greenMax) {
        icon = '';  // No icon for green stage
        color = '\x1b[32m';  // Green
      } else if (used < yellowMax) {
        icon = `${ICONS.warning} `;  // Warning icon for yellow
        color = '\x1b[33m';  // Yellow
      } else if (used < orangeMax) {
        icon = `${ICONS.lightning} `;  // Lightning for red (no blink yet)
        color = '\x1b[31m';  // Red without blink
      } else {
        icon = `${ICONS.lightning} `;  // Lightning for critical red
        color = `${BLINK}\x1b[31m`;  // Red WITH blink at 87.5%+ (or bright fallback)
      }

      ctx = `${color}${icon}${bar} ${used}%${RESET}`;
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

    // GSD update available?
    let gsdUpdate = '';
    const cacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-update-check.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cache.update_available) {
          gsdUpdate = '\x1b[33m⬆ /gsd:update\x1b[0m │ ';
        }
      } catch (e) {}
    }

    // Build statusline with new layout
    const dirname = path.basename(dir);
    const branding = getBranding();
    const modelDisplay = `${DIM}${model}${RESET}`;
    const cwdDisplay = `${DIM}${dirname}${RESET}`;

    // Line 1: branding | model | context bar | cwd
    // Note: ctx already includes its own color codes and spacing
    const line1 = `${branding}${SEP}${modelDisplay}${SEP}${ctx.trim()}${SEP}${cwdDisplay}`;

    process.stdout.write(line1);
  } catch (e) {
    // Silent fail - don't break statusline on parse errors
  }
});

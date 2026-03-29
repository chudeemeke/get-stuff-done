#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- launcher with computed paths from internal logic, no user input */

/**
 * GSD Cross-Platform Launcher
 *
 * Pure Node.js replacement for bin/gsd bash script.
 * Works on Windows (cmd, PowerShell, Git Bash), macOS, and Linux.
 *
 * Features:
 * - Creates default config if missing
 * - Displays startup banner with terminal-aware coloring
 * - Shows project state and continuation context if available
 * - Launches claude with passthrough arguments
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { gsdPaths } = require('../overlay/src/platform/paths');
const { detectTerminal } = require('../overlay/src/platform/terminal');
const { loadConfig, getConfigValue } = require('../overlay/src/config/ConfigLoader');

// Detect terminal capabilities
const terminal = detectTerminal();

// ANSI color codes (with fallback for no-color terminals)
const colors = terminal.supportsColor ? {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[0;33m',
  BLUE: '\x1b[0;34m',
  NC: '\x1b[0m'
} : {
  RED: '',
  GREEN: '',
  YELLOW: '',
  BLUE: '',
  NC: ''
};

// Get package version
function getVersion() {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version;
  } catch (e) {
    return '2.1.1'; // fallback
  }
}

// Logging functions
function logInfo(msg) {
  console.log(`${colors.BLUE}[GSD]${colors.NC} ${msg}`);
}

function logWarn(msg) {
  console.log(`${colors.YELLOW}[GSD]${colors.NC} ${msg}`);
}

function logError(msg) {
  console.error(`${colors.RED}[GSD]${colors.NC} ${msg}`);
}

/**
 * Ensure GSD home directory and config file exist
 * Creates default config with JSON5 comments if missing
 */
function ensureConfig() {
  const gsdHome = gsdPaths.gsdHome();
  const gsdConfig = gsdPaths.gsdHome('config.json');
  const hooksDir = gsdPaths.gsdHome('hooks');

  // Create GSD home directory
  if (!fs.existsSync(gsdHome)) {
    logInfo(`Creating GSD home directory: ${gsdHome}`);
    fs.mkdirSync(gsdHome, { recursive: true });
  }

  // Create hooks directory
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Create default config if missing
  if (!fs.existsSync(gsdConfig)) {
    logInfo('Creating default configuration');
    const defaultContent = `{
  // Config version (for future migrations)
  version: 1,

  // Context window management
  context_management: {
    // Note: autocompact is controlled by Claude Code internally
    // Save state before compaction
    precompact_save_state: true,
  },

  // Workflow control
  workflow: {
    pause_between_tasks: false,
    pause_between_phases: true,
    auto_checkpoint_interval: 5,
  },

  // Subagent model selection
  subagents: {
    default_model: "sonnet",
    executor_model: "sonnet",
    verifier_model: "sonnet",
    researcher_model: "haiku",
  },

  // UI preferences
  ui: {
    show_progress_bar: true,
    show_context_usage: true,
    theme: "aidev",
  },
}
`;
    fs.writeFileSync(gsdConfig, defaultContent, 'utf8');
  }

  // Config migration: add version field if missing
  try {
    const config = loadConfig();
    if (!config.version) {
      logInfo('Adding version field to config');
      const content = fs.readFileSync(gsdConfig, 'utf8');
      const JSON5 = require('json5');
      const parsed = JSON5.parse(content);
      parsed.version = 1;
      fs.writeFileSync(gsdConfig, JSON.stringify(parsed, null, 2), 'utf8');
    }
  } catch (e) {
    logWarn('Could not migrate config: ' + e.message);
  }
}

/**
 * Display startup banner with project state
 */
function displayBanner() {
  const version = getVersion();

  console.log('');
  console.log(`${colors.GREEN}Get Stuff Done${colors.NC} v${version}`);
  console.log('----');

  // Check for project state files
  const planningDir = '.planning';
  const statePath = path.join(planningDir, 'STATE.md');
  const continuePath = path.join(planningDir, 'CONTINUE.md');

  if (fs.existsSync(statePath)) {
    console.log(`Project state: ${colors.GREEN}Found${colors.NC}`);
  }

  if (fs.existsSync(continuePath)) {
    console.log(`Continuation: ${colors.YELLOW}Available${colors.NC}`);
  }

  console.log('----');
  console.log('');
}

/**
 * Launch Claude with passthrough arguments
 * Uses child_process.spawn with stdio inheritance for seamless experience
 */
function launchClaude(args) {
  const claude = spawn('claude', args, {
    stdio: 'inherit',
    shell: true // Allows claude.cmd on Windows to be found
  });

  claude.on('error', (err) => {
    if (err.code === 'ENOENT') {
      logError('Claude Code not found. Please install it first:');
      console.log('');
      console.log('  npm install -g @anthropic-ai/claude-code');
      console.log('');
      process.exit(1);
    } else {
      logError(`Failed to launch Claude: ${err.message}`);
      process.exit(1);
    }
  });

  claude.on('exit', (code) => {
    process.exit(code || 0);
  });
}

/**
 * Main entry point
 */
function main() {
  try {
    ensureConfig();
    displayBanner();
    launchClaude(process.argv.slice(2));
  } catch (err) {
    logError(`Initialization failed: ${err.message}`);
    process.exit(1);
  }
}

main();

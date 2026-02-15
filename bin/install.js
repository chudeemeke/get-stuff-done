#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- install script with computed paths from internal logic, no user input */
/* eslint-disable security/detect-object-injection -- install script with safe bracket notation on config objects */
/* eslint-disable security/detect-non-literal-regexp -- install script with safe dynamic patterns for template replacement */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Check Node.js version (minimum 20 LTS)
const nodeVersion = parseInt(process.version.slice(1).split('.')[0], 10);
if (nodeVersion < 20) {
  console.warn('\x1b[33m!\x1b[0m Warning: Node.js 20 or higher is recommended. Current version:', process.version);
  console.warn('  Some features may not work correctly on older versions.');
}

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('../package.json');

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local');
const hasLink = args.includes('--link') || args.includes('-l');
const hasOpencode = args.includes('--opencode');
const hasClaude = args.includes('--claude');
const hasBoth = args.includes('--both');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');
const isWindows = process.platform === 'win32';

// Runtime selection - can be set by flags or interactive prompt
let selectedRuntimes = [];
if (hasBoth) {
  selectedRuntimes = ['claude', 'opencode'];
} else if (hasOpencode) {
  selectedRuntimes = ['opencode'];
} else if (hasClaude) {
  selectedRuntimes = ['claude'];
}

// Helper to get directory name for a runtime (used for local/project installs)
function getDirName(runtime) {
  return runtime === 'opencode' ? '.opencode' : '.claude';
}

/**
 * Get the global config directory for OpenCode
 * OpenCode follows XDG Base Directory spec and uses ~/.config/opencode/
 * Priority: OPENCODE_CONFIG_DIR > dirname(OPENCODE_CONFIG) > XDG_CONFIG_HOME/opencode > ~/.config/opencode
 */
function getOpencodeGlobalDir() {
  // 1. Explicit OPENCODE_CONFIG_DIR env var
  if (process.env.OPENCODE_CONFIG_DIR) {
    return expandTilde(process.env.OPENCODE_CONFIG_DIR);
  }
  
  // 2. OPENCODE_CONFIG env var (use its directory)
  if (process.env.OPENCODE_CONFIG) {
    return path.dirname(expandTilde(process.env.OPENCODE_CONFIG));
  }
  
  // 3. XDG_CONFIG_HOME/opencode
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(expandTilde(process.env.XDG_CONFIG_HOME), 'opencode');
  }
  
  // 4. Default: ~/.config/opencode (XDG default)
  return path.join(os.homedir(), '.config', 'opencode');
}

/**
 * Get the global config directory for a runtime
 * @param {string} runtime - 'claude' or 'opencode'
 * @param {string|null} explicitDir - Explicit directory from --config-dir flag
 */
function getGlobalDir(runtime, explicitDir = null) {
  if (runtime === 'opencode') {
    // For OpenCode, --config-dir overrides env vars
    if (explicitDir) {
      return expandTilde(explicitDir);
    }
    return getOpencodeGlobalDir();
  }
  
  // Claude Code: --config-dir > CLAUDE_CONFIG_DIR > ~/.claude
  if (explicitDir) {
    return expandTilde(explicitDir);
  }
  if (process.env.CLAUDE_CONFIG_DIR) {
    return expandTilde(process.env.CLAUDE_CONFIG_DIR);
  }
  return path.join(os.homedir(), '.claude');
}

const banner = `
${cyan}   ██████╗ ███████╗██████╗
  ██╔════╝ ██╔════╝██╔══██╗
  ██║  ███╗███████╗██║  ██║
  ██║   ██║╚════██║██║  ██║
  ╚██████╔╝███████║██████╔╝
   ╚═════╝ ╚══════╝╚═════╝${reset}

  Get Stuff Done ${dim}v${pkg.version}${reset}
  A meta-prompting, context engineering and spec-driven
  development system for Claude Code. Fork by Chude.
`;

// Parse --config-dir argument
function parseConfigDirArg() {
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    // Error if --config-dir is provided without a value or next arg is another flag
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  // Also handle --config-dir=value format
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    const value = configDirArg.split('=')[1];
    if (!value) {
      console.error(`  ${yellow}--config-dir requires a non-empty path${reset}`);
      process.exit(1);
    }
    return value;
  }
  return null;
}
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes('--help') || args.includes('-h');
const forceStatusline = args.includes('--force-statusline');

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx @chude/get-stuff-done [options]

  ${yellow}Options:${reset}
    ${cyan}-g, --global${reset}              Install globally (to config directory)
    ${cyan}--local${reset}                   Install locally (to current directory)
    ${cyan}--claude${reset}                  Install for Claude Code only
    ${cyan}--opencode${reset}                Install for OpenCode only
    ${cyan}--both${reset}                    Install for both Claude Code and OpenCode
    ${cyan}-u, --uninstall${reset}           Uninstall GSD (remove all GSD files)
    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory
    ${cyan}-l, --link${reset}                Install using symlinks (for development)
                              Changes in source immediately reflect in install
    ${cyan}-h, --help${reset}                Show this help message
    ${cyan}--force-statusline${reset}        Replace existing statusline config

  ${yellow}Examples:${reset}
    ${dim}# Interactive install (prompts for runtime and location)${reset}
    npx @chude/get-stuff-done

    ${dim}# Install for Claude Code globally${reset}
    npx @chude/get-stuff-done --claude --global

    ${dim}# Install for OpenCode globally${reset}
    npx @chude/get-stuff-done --opencode --global

    ${dim}# Install for both runtimes globally${reset}
    npx @chude/get-stuff-done --both --global

    ${dim}# Install to custom config directory${reset}
    npx @chude/get-stuff-done --claude --global --config-dir ~/.claude-bc

    ${dim}# Install to current project only${reset}
    npx @chude/get-stuff-done --claude --local

    ${dim}# Development install (symlinks for edit-in-place)${reset}
    npx @chude/get-stuff-done --claude --global --link

    ${dim}# Uninstall GSD from Claude Code globally${reset}
    npx @chude/get-stuff-done --claude --global --uninstall

    ${dim}# Uninstall GSD from current project${reset}
    npx @chude/get-stuff-done --claude --local --uninstall

  ${yellow}Notes:${reset}
    The --config-dir option is useful when you have multiple Claude Code
    configurations (e.g., for different subscriptions). It takes priority
    over the CLAUDE_CONFIG_DIR environment variable.

    The --link option creates symlinks instead of copying files, useful for
    development. Changes to the source files immediately reflect in the
    installed location. On Windows, junctions are used for directories.
`);
  process.exit(0);
}

/**
 * Expand ~ to home directory (shell doesn't expand in env vars passed to node)
 */
function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Check if a path looks like a development checkout (has package.json with get-stuff-done)
 */
function isDevCheckout(srcPath) {
  const pkgPath = path.join(srcPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return false;
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.name === 'get-stuff-done-cc' || pkg.name === 'get-stuff-done' || pkg.name === '@chude/get-stuff-done';
  } catch (e) {
    return false;
  }
}

/**
 * Test if we have write permissions in a directory
 * @param {string} dir - Directory to test
 * @returns {boolean} - True if writable
 */
function canWrite(dir) {
  try {
    const testFile = path.join(dir, '.gsd-write-test-' + Date.now());
    fs.writeFileSync(testFile, '');
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively copy a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Create a symlink, using junction on Windows for directories, with fallback to copy on permission failure
 * @param {string} target - The source path (what the link points to)
 * @param {string} linkPath - The destination path (where to create the link)
 * @param {boolean} isDirectory - Whether the target is a directory
 * @returns {object} - { method: 'symlink'|'junction'|'copy', reason: string }
 */
function createSymlink(target, linkPath, isDirectory) {
  // Remove existing file/link/directory at linkPath
  if (fs.existsSync(linkPath)) {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink() || stat.isFile()) {
      fs.unlinkSync(linkPath);
    } else if (stat.isDirectory()) {
      fs.rmSync(linkPath, { recursive: true });
    }
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(linkPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Check write permissions before attempting operations
  if (!canWrite(parentDir)) {
    const advice = isWindows
      ? 'Run as administrator or check directory permissions'
      : 'Check directory permissions with chmod';
    throw new Error(`Cannot write to ${parentDir}. ${advice}`);
  }

  // Try symlink first, then junction (Windows), then copy as last resort
  if (isDirectory) {
    const type = isWindows ? 'junction' : 'dir';

    try {
      fs.symlinkSync(target, linkPath, type);
      return { method: isWindows ? 'junction' : 'symlink', reason: 'default' };
    } catch (err) {
      if (err.code === 'EPERM') {
        if (isWindows && type === 'junction') {
          // Junction failed (shouldn't happen, but handle it)
          console.log(`  ${yellow}!${reset} Junction creation failed. Falling back to file copy.`);
          console.log(`  ${dim}Note: Changes to source won't auto-propagate; reinstall after updates.${reset}`);
          copyDirectory(target, linkPath);
          return { method: 'copy', reason: 'eperm_fallback' };
        } else {
          // Symlink failed due to permissions (Developer Mode not enabled on Windows)
          console.log(`  ${yellow}!${reset} Symlinks require Developer Mode on Windows. Using junction instead.`);
          fs.symlinkSync(target, linkPath, 'junction');
          return { method: 'junction', reason: 'eperm_fallback' };
        }
      }
      throw err;
    }
  } else {
    // For files, use 'file' type on all platforms
    fs.symlinkSync(target, linkPath, 'file');
    return { method: 'symlink', reason: 'default' };
  }
}

/**
 * Detect installation type by checking if key paths are symlinks
 * @param {string} targetDir - The installation target directory
 * @returns {Promise<'link'|'copy'|null>} - Installation type or null if no installation found
 */
async function detectInstallationType(targetDir) {
  // Check key directories
  const keyPaths = [
    path.join(targetDir, 'commands', 'gsd'),
    path.join(targetDir, 'get-stuff-done'),
    path.join(targetDir, 'agents'),
    path.join(targetDir, 'hooks')
  ];

  let foundAnyPath = false;

  for (const checkPath of keyPaths) {
    if (fs.existsSync(checkPath)) {
      foundAnyPath = true;
      try {
        // Use lstat (NOT stat) - stat follows symlinks and won't detect them
        const stats = await fs.promises.lstat(checkPath);
        if (stats.isSymbolicLink()) {
          return 'link';
        }
      } catch (err) {
        // Path exists but lstat failed - assume copy
        continue;
      }
    }
  }

  // If we found paths but none were symlinks, it's a copy installation
  return foundAnyPath ? 'copy' : null;
}

/**
 * Read installation metadata from .install-meta.json
 * @param {string} targetDir - The installation target directory
 * @returns {object|null} - Metadata object or null on error/missing
 */
function readInstallMetadata(targetDir) {
  const metaPath = path.join(targetDir, 'get-stuff-done', '.install-meta.json');
  try {
    const content = fs.readFileSync(metaPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null; // No metadata file or parse error
  }
}

/**
 * Detect shell type for metadata
 * @returns {string} - Shell name
 */
function detectShell() {
  const shell = process.env.SHELL || process.env.ComSpec || '';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('fish')) return 'fish';
  if (shell.includes('pwsh') || shell.includes('powershell')) return 'pwsh';
  if (shell.includes('cmd')) return 'cmd';
  return 'unknown';
}

/**
 * Detect if running in MinGW environment (Git Bash on Windows)
 * @returns {boolean}
 */
function isMingw() {
  return process.platform === 'win32' && (
    process.env.MSYSTEM !== undefined ||
    process.env.TERM_PROGRAM === 'mintty' ||
    process.env.MINGW_PREFIX !== undefined
  );
}

/**
 * Write installation metadata to .install-meta.json
 * @param {string} targetDir - The installation target directory
 * @param {string} installType - 'copy' or 'link'
 * @param {string} version - Package version
 * @param {object} installMethodInfo - Install method details from createSymlink
 * @returns {string} - Path to the metadata file
 */
function writeInstallMetadata(targetDir, installType, version, installMethodInfo = { method: 'unknown', reason: 'default' }) {
  const metadata = {
    version: version,
    installType: installType,
    installedAt: new Date().toISOString(),
    platform: {
      os: process.platform,
      arch: process.arch,
      shell: detectShell(),
      isMingw: isMingw(),
      nodeVersion: process.version
    },
    installMethod: {
      method: installMethodInfo.method,
      reason: installMethodInfo.reason
    }
  };

  const metaPath = path.join(targetDir, 'get-stuff-done', '.install-meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2) + '\n');
  return metaPath;
}

/**
 * Prompt user to choose installation mode when existing installation detected
 * @param {string} detectedType - 'link' or 'copy'
 * @param {string} source - 'metadata' or 'filesystem'
 * @returns {Promise<boolean>} - Whether to use links (true) or copies (false)
 */
function promptInstallMode(detectedType, source) {
  return new Promise((resolve) => {
    // Non-interactive: keep existing mode
    if (!process.stdin.isTTY) {
      console.log(`  ${yellow}Non-interactive terminal, keeping ${detectedType} mode${reset}\n`);
      resolve(detectedType === 'link');
      return;
    }

    const otherType = detectedType === 'link' ? 'copy' : 'link';
    const detectedLabel = detectedType === 'link' ? 'Symlinks' : 'Copies';
    const otherLabel = otherType === 'link' ? 'Symlinks' : 'Copies';
    const detectedDesc = detectedType === 'link' ? 'for development' : 'standalone files';
    const otherDesc = otherType === 'link' ? 'for development' : 'standalone files';

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let answered = false;

    rl.on('close', () => {
      if (!answered) {
        answered = true;
        console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
        process.exit(0);
      }
    });

    console.log(`
  ${yellow}Existing installation detected${reset} ${dim}(${source})${reset}

  ${cyan}1${reset}) Keep ${detectedLabel} ${dim}(${detectedDesc})${reset}
  ${cyan}2${reset}) Switch to ${otherLabel} ${dim}(${otherDesc})${reset}
`);

    rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
      answered = true;
      rl.close();
      const choice = answer.trim() || '1';
      if (choice === '2') {
        resolve(otherType === 'link');
      } else {
        resolve(detectedType === 'link');
      }
    });
  });
}

/**
 * Determine installation mode by checking existing installation or using defaults
 * @param {string} targetDir - The installation target directory
 * @param {boolean} hasLinkFlag - Whether user explicitly passed --link flag
 * @param {boolean} useLinks - The value of the --link flag
 * @returns {Promise<boolean>} - Whether to use links (true) or copies (false)
 */
async function determineInstallMode(targetDir, hasLinkFlag, useLinks) {
  // Priority 1: Explicit --link flag from user
  if (hasLinkFlag) {
    return useLinks;
  }

  // Priority 2: Check metadata file (fast, reliable) - prompt user
  const metadata = readInstallMetadata(targetDir);
  if (metadata && metadata.installType) {
    return promptInstallMode(metadata.installType, 'metadata');
  }

  // Priority 3: Detect by checking filesystem - prompt user
  const detectedType = await detectInstallationType(targetDir);
  if (detectedType) {
    return promptInstallMode(detectedType, 'filesystem');
  }

  // Priority 4: No existing installation - use default (copy)
  return false;
}

/**
 * Build a hook command path using forward slashes for cross-platform compatibility.
 * On Windows, $HOME is not expanded by cmd.exe/PowerShell, so we use the actual path.
 */
function buildHookCommand(claudeDir, hookName) {
  // Use forward slashes for Node.js compatibility on all platforms
  const hooksPath = claudeDir.replace(/\\/g, '/') + '/hooks/' + hookName;
  return `node "${hooksPath}"`;
}

/**
 * Read and parse settings.json, returning empty object if it doesn't exist
 */
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json with proper formatting
 */
function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

/**
 * Convert Claude Code frontmatter to opencode format
 * - Converts 'allowed-tools:' array to 'permission:' object
 * @param {string} content - Markdown file content with YAML frontmatter
 * @returns {string} - Content with converted frontmatter
 */
// Color name to hex mapping for opencode compatibility
const colorNameToHex = {
  cyan: '#00FFFF',
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  yellow: '#FFFF00',
  magenta: '#FF00FF',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
};

// Tool name mapping from Claude Code to OpenCode
// OpenCode uses lowercase tool names; special mappings for renamed tools
const claudeToOpencodeTools = {
  AskUserQuestion: 'question',
  SlashCommand: 'skill',
  TodoWrite: 'todowrite',
  WebFetch: 'webfetch',
  WebSearch: 'websearch',  // Plugin/MCP - keep for compatibility
};

/**
 * Convert a Claude Code tool name to OpenCode format
 * - Applies special mappings (AskUserQuestion -> question, etc.)
 * - Converts to lowercase (except MCP tools which keep their format)
 */
function convertToolName(claudeTool) {
  // Check for special mapping first
  if (claudeToOpencodeTools[claudeTool]) {
    return claudeToOpencodeTools[claudeTool];
  }
  // MCP tools (mcp__*) keep their format
  if (claudeTool.startsWith('mcp__')) {
    return claudeTool;
  }
  // Default: convert to lowercase
  return claudeTool.toLowerCase();
}

function convertClaudeToOpencodeFrontmatter(content) {
  // Replace tool name references in content (applies to all files)
  let convertedContent = content;
  convertedContent = convertedContent.replace(/\bAskUserQuestion\b/g, 'question');
  convertedContent = convertedContent.replace(/\bSlashCommand\b/g, 'skill');
  convertedContent = convertedContent.replace(/\bTodoWrite\b/g, 'todowrite');
  // Replace /gsd:command with /gsd-command for opencode (flat command structure)
  convertedContent = convertedContent.replace(/\/gsd:/g, '/gsd-');
  // Replace ~/.claude with ~/.config/opencode (OpenCode's correct config location)
  convertedContent = convertedContent.replace(/~\/\.claude\b/g, '~/.config/opencode');

  // Check if content has frontmatter
  if (!convertedContent.startsWith('---')) {
    return convertedContent;
  }

  // Find the end of frontmatter
  const endIndex = convertedContent.indexOf('---', 3);
  if (endIndex === -1) {
    return convertedContent;
  }

  const frontmatter = convertedContent.substring(3, endIndex).trim();
  const body = convertedContent.substring(endIndex + 3);

  // Parse frontmatter line by line (simple YAML parsing)
  const lines = frontmatter.split('\n');
  const newLines = [];
  let inAllowedTools = false;
  const allowedTools = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of allowed-tools array
    if (trimmed.startsWith('allowed-tools:')) {
      inAllowedTools = true;
      continue;
    }

    // Detect inline tools: field (comma-separated string)
    if (trimmed.startsWith('tools:')) {
      const toolsValue = trimmed.substring(6).trim();
      if (toolsValue) {
        // Parse comma-separated tools
        const tools = toolsValue.split(',').map(t => t.trim()).filter(t => t);
        allowedTools.push(...tools);
      }
      continue;
    }

    // Remove name: field - opencode uses filename for command name
    if (trimmed.startsWith('name:')) {
      continue;
    }

    // Convert color names to hex for opencode
    if (trimmed.startsWith('color:')) {
      const colorValue = trimmed.substring(6).trim().toLowerCase();
      const hexColor = colorNameToHex[colorValue];
      if (hexColor) {
        newLines.push(`color: "${hexColor}"`);
      } else if (colorValue.startsWith('#')) {
        // Already hex, keep as is
        newLines.push(line);
      }
      // Skip unknown color names
      continue;
    }

    // Collect allowed-tools items
    if (inAllowedTools) {
      if (trimmed.startsWith('- ')) {
        allowedTools.push(trimmed.substring(2).trim());
        continue;
      } else if (trimmed && !trimmed.startsWith('-')) {
        // End of array, new field started
        inAllowedTools = false;
      }
    }

    // Keep other fields (including name: which opencode ignores)
    if (!inAllowedTools) {
      newLines.push(line);
    }
  }

  // Add tools object if we had allowed-tools or tools
  if (allowedTools.length > 0) {
    newLines.push('tools:');
    for (const tool of allowedTools) {
      newLines.push(`  ${convertToolName(tool)}: true`);
    }
  }

  // Rebuild frontmatter (body already has tool names converted)
  const newFrontmatter = newLines.join('\n').trim();
  return `---\n${newFrontmatter}\n---${body}`;
}

/**
 * Copy commands to a flat structure for OpenCode
 * OpenCode expects: command/gsd-help.md (invoked as /gsd-help)
 * Source structure: commands/gsd/help.md
 * 
 * @param {string} srcDir - Source directory (e.g., commands/gsd/)
 * @param {string} destDir - Destination directory (e.g., command/)
 * @param {string} prefix - Prefix for filenames (e.g., 'gsd')
 * @param {string} pathPrefix - Path prefix for file references
 * @param {string} runtime - Target runtime ('claude' or 'opencode')
 */
function copyFlattenedCommands(srcDir, destDir, prefix, pathPrefix, runtime) {
  if (!fs.existsSync(srcDir)) {
    return;
  }
  
  // Remove old gsd-*.md files before copying new ones
  if (fs.existsSync(destDir)) {
    for (const file of fs.readdirSync(destDir)) {
      if (file.startsWith(`${prefix}-`) && file.endsWith('.md')) {
        fs.unlinkSync(path.join(destDir, file));
      }
    }
  } else {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    
    if (entry.isDirectory()) {
      // Recurse into subdirectories, adding to prefix
      // e.g., commands/gsd/debug/start.md -> command/gsd-debug-start.md
      copyFlattenedCommands(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix, runtime);
    } else if (entry.name.endsWith('.md')) {
      // Flatten: help.md -> gsd-help.md
      const baseName = entry.name.replace('.md', '');
      const destName = `${prefix}-${baseName}.md`;
      const destPath = path.join(destDir, destName);
      
      // Read, transform, and write
      let content = fs.readFileSync(srcPath, 'utf8');
      // Replace path references
      const claudeDirRegex = /~\/\.claude\//g;
      const opencodeDirRegex = /~\/\.opencode\//g;
      content = content.replace(claudeDirRegex, pathPrefix);
      content = content.replace(opencodeDirRegex, pathPrefix);
      // Convert frontmatter for opencode compatibility
      content = convertClaudeToOpencodeFrontmatter(content);
      
      fs.writeFileSync(destPath, content);
    }
  }
}

/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @param {string} pathPrefix - Path prefix for file references
 * @param {string} runtime - Target runtime ('claude' or 'opencode')
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime) {
  const isOpencode = runtime === 'opencode';
  const dirName = getDirName(runtime);

  // Clean install: remove existing destination to prevent orphaned files
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix, runtime);
    } else if (entry.name.endsWith('.md')) {
      // Replace ~/.claude/ with the appropriate prefix in Markdown files
      let content = fs.readFileSync(srcPath, 'utf8');
      const claudeDirRegex = new RegExp(`~/${dirName.replace('.', '\\.')}/`, 'g');
      content = content.replace(claudeDirRegex, pathPrefix);
      // Convert frontmatter for opencode compatibility
      if (isOpencode) {
        content = convertClaudeToOpencodeFrontmatter(content);
      }
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Clean up orphaned files from previous GSD versions
 */
function cleanupOrphanedFiles(claudeDir) {
  const orphanedFiles = [
    'hooks/gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
  ];

  for (const relPath of orphanedFiles) {
    const fullPath = path.join(claudeDir, relPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`  ${green}✓${reset} Removed orphaned ${relPath}`);
    }
  }
}

/**
 * Clean up orphaned hook registrations from settings.json
 */
function cleanupOrphanedHooks(settings) {
  const orphanedHookPatterns = [
    'gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
    'gsd-intel-index.js',  // Removed in v1.9.2
    'gsd-intel-session.js',  // Removed in v1.9.2
    'gsd-intel-prune.js',  // Removed in v1.9.2
  ];

  let cleaned = false;

  // Check all hook event types (Stop, SessionStart, etc.)
  if (settings.hooks) {
    for (const eventType of Object.keys(settings.hooks)) {
      const hookEntries = settings.hooks[eventType];
      if (Array.isArray(hookEntries)) {
        // Filter out entries that contain orphaned hooks
        const filtered = hookEntries.filter(entry => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            // Check if any hook in this entry matches orphaned patterns
            const hasOrphaned = entry.hooks.some(h =>
              h.command && orphanedHookPatterns.some(pattern => h.command.includes(pattern))
            );
            if (hasOrphaned) {
              cleaned = true;
              return false;  // Remove this entry
            }
          }
          return true;  // Keep this entry
        });
        settings.hooks[eventType] = filtered;
      }
    }
  }

  if (cleaned) {
    console.log(`  ${green}✓${reset} Removed orphaned hook registrations`);
  }

  return settings;
}

/**
 * Uninstall GSD from the specified directory for a specific runtime
 * Removes only GSD-specific files/directories, preserves user content
 * @param {boolean} isGlobal - Whether to uninstall from global or local
 * @param {string} runtime - Target runtime ('claude' or 'opencode')
 */
function uninstall(isGlobal, runtime = 'claude') {
  const isOpencode = runtime === 'opencode';
  const dirName = getDirName(runtime);

  // Get the target directory based on runtime and install type
  const targetDir = isGlobal
    ? getGlobalDir(runtime, explicitConfigDir)
    : path.join(process.cwd(), dirName);

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  const runtimeLabel = isOpencode ? 'OpenCode' : 'Claude Code';
  console.log(`  Uninstalling GSD from ${cyan}${runtimeLabel}${reset} at ${cyan}${locationLabel}${reset}\n`);

  // Check if target directory exists
  if (!fs.existsSync(targetDir)) {
    console.log(`  ${yellow}⚠${reset} Directory does not exist: ${locationLabel}`);
    console.log(`  Nothing to uninstall.\n`);
    return;
  }

  let removedCount = 0;

  // 1. Remove GSD commands directory
  if (isOpencode) {
    // OpenCode: remove command/gsd-*.md files
    const commandDir = path.join(targetDir, 'command');
    if (fs.existsSync(commandDir)) {
      const files = fs.readdirSync(commandDir);
      for (const file of files) {
        if (file.startsWith('gsd-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(commandDir, file));
          removedCount++;
        }
      }
      console.log(`  ${green}✓${reset} Removed GSD commands from command/`);
    }
  } else {
    // Claude Code: remove commands/gsd/ directory
    const gsdCommandsDir = path.join(targetDir, 'commands', 'gsd');
    if (fs.existsSync(gsdCommandsDir)) {
      fs.rmSync(gsdCommandsDir, { recursive: true });
      removedCount++;
      console.log(`  ${green}✓${reset} Removed commands/gsd/`);
    }
  }

  // 2. Remove get-stuff-done directory
  const gsdDir = path.join(targetDir, 'get-stuff-done');
  if (fs.existsSync(gsdDir)) {
    fs.rmSync(gsdDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed get-stuff-done/`);
  }

  // 3. Remove GSD agents (gsd-*.md files only)
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    const files = fs.readdirSync(agentsDir);
    let agentCount = 0;
    for (const file of files) {
      if (file.startsWith('gsd-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDir, file));
        agentCount++;
      }
    }
    if (agentCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${agentCount} GSD agents`);
    }
  }

  // 4. Remove GSD hooks
  const hooksDir = path.join(targetDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const gsdHooks = ['gsd-statusline.js', 'gsd-check-update.js', 'gsd-check-update.sh'];
    let hookCount = 0;
    for (const hook of gsdHooks) {
      const hookPath = path.join(hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        fs.unlinkSync(hookPath);
        hookCount++;
      }
    }
    if (hookCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${hookCount} GSD hooks`);
    }
  }

  // 5. Clean up settings.json (remove GSD hooks and statusline)
  const settingsPath = path.join(targetDir, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    let settings = readSettings(settingsPath);
    let settingsModified = false;

    // Remove GSD statusline if it references our hook
    if (settings.statusLine && settings.statusLine.command &&
        settings.statusLine.command.includes('gsd-statusline')) {
      delete settings.statusLine;
      settingsModified = true;
      console.log(`  ${green}✓${reset} Removed GSD statusline from settings`);
    }

    // Remove GSD hooks from SessionStart
    if (settings.hooks && settings.hooks.SessionStart) {
      const before = settings.hooks.SessionStart.length;
      settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
        if (entry.hooks && Array.isArray(entry.hooks)) {
          // Filter out GSD hooks
          const hasGsdHook = entry.hooks.some(h =>
            h.command && (h.command.includes('gsd-check-update') || h.command.includes('gsd-statusline'))
          );
          return !hasGsdHook;
        }
        return true;
      });
      if (settings.hooks.SessionStart.length < before) {
        settingsModified = true;
        console.log(`  ${green}✓${reset} Removed GSD hooks from settings`);
      }
      // Clean up empty array
      if (settings.hooks.SessionStart.length === 0) {
        delete settings.hooks.SessionStart;
      }
      // Clean up empty hooks object
      if (Object.keys(settings.hooks).length === 0) {
        delete settings.hooks;
      }
    }

    if (settingsModified) {
      writeSettings(settingsPath, settings);
      removedCount++;
    }
  }

  // 6. For OpenCode, clean up permissions from opencode.json
  if (isOpencode) {
    const opencodeConfigDir = getOpencodeGlobalDir();
    const configPath = path.join(opencodeConfigDir, 'opencode.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        let modified = false;

        // Remove GSD permission entries
        if (config.permission) {
          for (const permType of ['read', 'external_directory']) {
            if (config.permission[permType]) {
              const keys = Object.keys(config.permission[permType]);
              for (const key of keys) {
                if (key.includes('get-stuff-done')) {
                  delete config.permission[permType][key];
                  modified = true;
                }
              }
              // Clean up empty objects
              if (Object.keys(config.permission[permType]).length === 0) {
                delete config.permission[permType];
              }
            }
          }
          if (Object.keys(config.permission).length === 0) {
            delete config.permission;
          }
        }

        if (modified) {
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
          removedCount++;
          console.log(`  ${green}✓${reset} Removed GSD permissions from opencode.json`);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
  }

  if (removedCount === 0) {
    console.log(`  ${yellow}⚠${reset} No GSD files found to remove.`);
  }

  console.log(`
  ${green}Done!${reset} GSD has been uninstalled from ${runtimeLabel}.
  Your other files and settings have been preserved.
`);
}

/**
 * Configure OpenCode permissions to allow reading GSD reference docs
 * This prevents permission prompts when GSD accesses the get-stuff-done directory
 */
function configureOpencodePermissions() {
  // OpenCode config file is at ~/.config/opencode/opencode.json
  const opencodeConfigDir = getOpencodeGlobalDir();
  const configPath = path.join(opencodeConfigDir, 'opencode.json');

  // Ensure config directory exists
  fs.mkdirSync(opencodeConfigDir, { recursive: true });

  // Read existing config or create empty object
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      // Invalid JSON - start fresh but warn user
      console.log(`  ${yellow}⚠${reset} opencode.json had invalid JSON, recreating`);
    }
  }

  // Ensure permission structure exists
  if (!config.permission) {
    config.permission = {};
  }

  // Build the GSD path using the actual config directory
  // Use ~ shorthand if it's in the default location, otherwise use full path
  const defaultConfigDir = path.join(os.homedir(), '.config', 'opencode');
  const gsdPath = opencodeConfigDir === defaultConfigDir
    ? '~/.config/opencode/get-stuff-done/*'
    : `${opencodeConfigDir}/get-stuff-done/*`;
  
  let modified = false;

  // Configure read permission
  if (!config.permission.read || typeof config.permission.read !== 'object') {
    config.permission.read = {};
  }
  if (config.permission.read[gsdPath] !== 'allow') {
    config.permission.read[gsdPath] = 'allow';
    modified = true;
  }

  // Configure external_directory permission (the safety guard for paths outside project)
  if (!config.permission.external_directory || typeof config.permission.external_directory !== 'object') {
    config.permission.external_directory = {};
  }
  if (config.permission.external_directory[gsdPath] !== 'allow') {
    config.permission.external_directory[gsdPath] = 'allow';
    modified = true;
  }

  if (!modified) {
    return; // Already configured
  }

  // Write config back
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`  ${green}✓${reset} Configured read permission for GSD docs`);
}

/**
 * Verify a directory exists and contains files
 */
function verifyInstalled(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory not created`);
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory is empty`);
      return false;
    }
  } catch (e) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: ${e.message}`);
    return false;
  }
  return true;
}

/**
 * Verify a file exists
 */
function verifyFileInstalled(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: file not created`);
    return false;
  }
  return true;
}

/**
 * Install to the specified directory for a specific runtime
 * @param {boolean} isGlobal - Whether to install globally or locally
 * @param {string} runtime - Target runtime ('claude' or 'opencode')
 * @param {boolean} useLinks - Whether to use symlinks instead of copies
 */
async function install(isGlobal, runtime = 'claude', useLinks = false) {
  const isOpencode = runtime === 'opencode';
  const dirName = getDirName(runtime);  // .opencode or .claude (for local installs)
  const src = path.join(__dirname, '..');

  // Validate --link usage
  if (useLinks) {
    if (!isDevCheckout(src)) {
      console.log(`  ${yellow}Warning:${reset} Source path doesn't look like a GSD development checkout.`);
      console.log(`  ${dim}Path: ${src}${reset}`);
      console.log(`  ${dim}--link is intended for development workflows where you edit source files.${reset}\n`);
    }
    // OpenCode with --link not supported (requires file transformations)
    if (isOpencode) {
      console.error(`  ${yellow}Error:${reset} --link is not supported for OpenCode installs.`);
      console.error(`  ${dim}OpenCode requires file transformations that are incompatible with symlinks.${reset}`);
      process.exit(1);
    }
  }

  // Get the target directory based on runtime and install type
  const targetDir = isGlobal
    ? getGlobalDir(runtime, explicitConfigDir)
    : path.join(process.cwd(), dirName);

  // Determine installation mode (auto-detect or use explicit flag)
  const detectedMode = await determineInstallMode(targetDir, hasLink, useLinks);
  useLinks = detectedMode;

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  // Path prefix for file references in markdown content
  // For global installs: use full path (necessary when config dir is customized)
  // For local installs: use relative ./.opencode/ or ./.claude/
  const pathPrefix = isGlobal
    ? `${targetDir}/`
    : `./${dirName}/`;

  const runtimeLabel = isOpencode ? 'OpenCode' : 'Claude Code';
  const modeLabel = useLinks ? ` ${dim}(symlinks)${reset}` : '';
  console.log(`  Installing for ${cyan}${runtimeLabel}${reset} to ${cyan}${locationLabel}${reset}${modeLabel}\n`);

  // Track installation failures
  const failures = [];

  // Clean up orphaned files from previous versions (skip in link mode - source is authoritative)
  if (!useLinks) {
    cleanupOrphanedFiles(targetDir);
  }

  // OpenCode uses 'command/' (singular) with flat structure: command/gsd-help.md
  // Claude Code uses 'commands/' (plural) with nested structure: commands/gsd/help.md
  if (isOpencode) {
    // OpenCode: flat structure in command/ directory (--link not supported)
    const commandDir = path.join(targetDir, 'command');
    fs.mkdirSync(commandDir, { recursive: true });

    // Copy commands/gsd/*.md as command/gsd-*.md (flatten structure)
    const gsdSrc = path.join(src, 'commands', 'gsd');
    copyFlattenedCommands(gsdSrc, commandDir, 'gsd', pathPrefix, runtime);
    if (verifyInstalled(commandDir, 'command/gsd-*')) {
      const count = fs.readdirSync(commandDir).filter(f => f.startsWith('gsd-')).length;
      console.log(`  ${green}✓${reset} Installed ${count} commands to command/`);
    } else {
      failures.push('command/gsd-*');
    }
  } else {
    // Claude Code: nested structure in commands/ directory
    const commandsDir = path.join(targetDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });

    const gsdSrc = path.join(src, 'commands', 'gsd');
    const gsdDest = path.join(commandsDir, 'gsd');

    if (useLinks) {
      createSymlink(gsdSrc, gsdDest, true);
      console.log(`  ${green}✓${reset} Linked commands/gsd`);
    } else {
      copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix, runtime);
      if (verifyInstalled(gsdDest, 'commands/gsd')) {
        console.log(`  ${green}✓${reset} Installed commands/gsd`);
      } else {
        failures.push('commands/gsd');
      }
    }
  }

  // Copy/link get-stuff-done skill
  const skillSrc = path.join(src, 'get-stuff-done');
  const skillDest = path.join(targetDir, 'get-stuff-done');

  if (useLinks) {
    const methodInfo = createSymlink(skillSrc, skillDest, true);
    global.gsdInstallMethodInfo = methodInfo; // Save for metadata
    console.log(`  ${green}✓${reset} Linked get-stuff-done`);
  } else {
    copyWithPathReplacement(skillSrc, skillDest, pathPrefix, runtime);
    if (verifyInstalled(skillDest, 'get-stuff-done')) {
      console.log(`  ${green}✓${reset} Installed get-stuff-done`);
    } else {
      failures.push('get-stuff-done');
    }
  }

  // Verify teams directory was included
  const teamsDest = path.join(skillDest, 'teams');
  if (fs.existsSync(teamsDest)) {
    const teamCount = fs.readdirSync(teamsDest).filter(f => f.endsWith('.md')).length;
    if (teamCount > 0) {
      console.log(`  ${green}✓${reset} Installed ${teamCount} team templates`);
    }
  }

  // Copy/link agents to agents directory (subagents must be at root level)
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(targetDir, 'agents');

    if (useLinks) {
      // In link mode, symlink the entire agents directory
      // Note: This will replace any user agents - acceptable for dev workflow
      createSymlink(agentsSrc, agentsDest, true);
      console.log(`  ${green}✓${reset} Linked agents`);
    } else {
      // If agentsDest is a symlink (from previous link-mode install), remove it first
      // Otherwise fs.unlinkSync would delete SOURCE files through the symlink
      if (fs.existsSync(agentsDest)) {
        const stat = fs.lstatSync(agentsDest);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(agentsDest);
        }
      }

      // Only delete gsd-*.md files to preserve user's custom agents
      fs.mkdirSync(agentsDest, { recursive: true });

      // Remove old GSD agents (gsd-*.md) before copying new ones
      if (fs.existsSync(agentsDest)) {
        for (const file of fs.readdirSync(agentsDest)) {
          if (file.startsWith('gsd-') && file.endsWith('.md')) {
            fs.unlinkSync(path.join(agentsDest, file));
          }
        }
      }

      // Copy new agents (don't use copyWithPathReplacement which would wipe the folder)
      const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
      for (const entry of agentEntries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
          const dirRegex = new RegExp(`~/${dirName.replace('.', '\\.')}/`, 'g');
          content = content.replace(dirRegex, pathPrefix);
          // Convert frontmatter for opencode compatibility
          if (isOpencode) {
            content = convertClaudeToOpencodeFrontmatter(content);
          }
          fs.writeFileSync(path.join(agentsDest, entry.name), content);
        }
      }
      if (verifyInstalled(agentsDest, 'agents')) {
        console.log(`  ${green}✓${reset} Installed agents`);
      } else {
        failures.push('agents');
      }
    }
  }

  // Handle CHANGELOG.md - in link mode, it's already available via get-stuff-done link
  // but we need to ensure the parent directory exists for VERSION file
  if (!useLinks) {
    const changelogSrc = path.join(src, 'CHANGELOG.md');
    const changelogDest = path.join(targetDir, 'get-stuff-done', 'CHANGELOG.md');
    if (fs.existsSync(changelogSrc)) {
      fs.copyFileSync(changelogSrc, changelogDest);
      if (verifyFileInstalled(changelogDest, 'CHANGELOG.md')) {
        console.log(`  ${green}✓${reset} Installed CHANGELOG.md`);
      } else {
        failures.push('CHANGELOG.md');
      }
    }

    // Write VERSION file for whats-new command
    const versionDest = path.join(targetDir, 'get-stuff-done', 'VERSION');
    fs.writeFileSync(versionDest, pkg.version);
    if (verifyFileInstalled(versionDest, 'VERSION')) {
      console.log(`  ${green}✓${reset} Wrote VERSION (${pkg.version})`);
    } else {
      failures.push('VERSION');
    }
  } else {
    // In link mode, create a VERSION file in the source get-stuff-done dir
    // This file will be visible through the symlink
    const versionSrc = path.join(skillSrc, 'VERSION');
    fs.writeFileSync(versionSrc, pkg.version);
    console.log(`  ${green}✓${reset} Wrote VERSION (${pkg.version}) to source`);
  }

  // Write installation metadata (track install method from get-stuff-done directory creation)
  const installType = useLinks ? 'link' : 'copy';
  // Use saved install method info if available, otherwise default
  const installMethodInfo = global.gsdInstallMethodInfo || { method: installType === 'link' ? 'symlink' : 'copy', reason: 'default' };
  writeInstallMetadata(targetDir, installType, pkg.version, installMethodInfo);
  console.log(`  ${green}✓${reset} Wrote install metadata`);

  // Copy/link hooks from dist/ (bundled with dependencies)
  // In dev mode with --link, fall back to hooks/ directory if dist/ doesn't exist
  const hooksSrcDist = path.join(src, 'hooks', 'dist');
  const hooksSrcDev = path.join(src, 'hooks');
  const hooksSrc = fs.existsSync(hooksSrcDist) ? hooksSrcDist : (useLinks ? hooksSrcDev : null);

  if (hooksSrc && fs.existsSync(hooksSrc)) {
    const hooksDest = path.join(targetDir, 'hooks');

    if (useLinks) {
      // Link the hooks directory
      createSymlink(hooksSrc, hooksDest, true);
      const srcLabel = hooksSrc === hooksSrcDist ? 'hooks/dist' : 'hooks';
      console.log(`  ${green}✓${reset} Linked ${srcLabel}`);
    } else {
      // If hooksDest is a symlink (from previous link-mode install), remove it first
      // Otherwise mkdirSync may fail or behave unexpectedly with symlinks
      if (fs.existsSync(hooksDest)) {
        const stat = fs.lstatSync(hooksDest);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(hooksDest);
        }
      }
      fs.mkdirSync(hooksDest, { recursive: true });
      const hookEntries = fs.readdirSync(hooksSrc);
      for (const entry of hookEntries) {
        const srcFile = path.join(hooksSrc, entry);
        // Only copy files, not directories
        if (fs.statSync(srcFile).isFile()) {
          const destFile = path.join(hooksDest, entry);
          fs.copyFileSync(srcFile, destFile);
        }
      }
      if (verifyInstalled(hooksDest, 'hooks')) {
        console.log(`  ${green}✓${reset} Installed hooks (bundled)`);
      } else {
        failures.push('hooks');
      }
    }
  }

  // If critical components failed, exit with error
  if (failures.length > 0) {
    console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${failures.join(', ')}`);
    console.error(`  Try running directly: node ~/.npm/_npx/*/node_modules/get-stuff-done-cc/bin/install.js --global\n`);
    process.exit(1);
  }

  // Configure statusline and hooks in settings.json
  const settingsPath = path.join(targetDir, 'settings.json');
  const settings = cleanupOrphanedHooks(readSettings(settingsPath));
  const statuslineCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-statusline.js')
    : 'node ' + dirName + '/hooks/gsd-statusline.js';
  const updateCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-check-update.js')
    : 'node ' + dirName + '/hooks/gsd-check-update.js';

  // Configure hooks (skip for opencode - different hook system)
  if (!isOpencode) {
    if (!settings.hooks) {
      settings.hooks = {};
    }

    // Configure SessionStart hook for update checking
    if (!settings.hooks.SessionStart) {
      settings.hooks.SessionStart = [];
    }

    // Check if GSD update hook already exists
    const hasGsdUpdateHook = settings.hooks.SessionStart.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'))
    );

    if (!hasGsdUpdateHook) {
      settings.hooks.SessionStart.push({
        hooks: [
          {
            type: 'command',
            command: updateCheckCommand
          }
        ]
      });
      console.log(`  ${green}✓${reset} Configured update check hook`);
    }

    // Configure PreCompact hook for state preservation before compaction
    if (!settings.hooks.PreCompact) {
      settings.hooks.PreCompact = [];
    }

    const preCompactCommand = isGlobal
      ? buildHookCommand(targetDir, 'pre-compact.js')
      : 'node ' + dirName + '/hooks/pre-compact.js';

    // Check if GSD pre-compact hook already exists
    const hasGsdPreCompactHook = settings.hooks.PreCompact.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('pre-compact'))
    );

    if (!hasGsdPreCompactHook) {
      settings.hooks.PreCompact.push({
        hooks: [
          {
            type: 'command',
            command: preCompactCommand
          }
        ]
      });
      console.log(`  ${green}✓${reset} Configured pre-compact hook`);
    }
  }

  return { settingsPath, settings, statuslineCommand, runtime };
}

/**
 * Apply statusline config, then print completion message
 * @param {string} settingsPath - Path to settings.json
 * @param {object} settings - Settings object
 * @param {string} statuslineCommand - Statusline command
 * @param {boolean} shouldInstallStatusline - Whether to install statusline
 * @param {string} runtime - Target runtime ('claude' or 'opencode')
 */
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, runtime = 'claude') {
  const isOpencode = runtime === 'opencode';

  if (shouldInstallStatusline && !isOpencode) {
    settings.statusLine = {
      type: 'command',
      command: statuslineCommand
    };
    console.log(`  ${green}✓${reset} Configured statusline`);
  }

  // Always write settings (hooks were already configured in install())
  writeSettings(settingsPath, settings);

  // Configure OpenCode permissions if needed
  if (isOpencode) {
    configureOpencodePermissions();
  }

  const program = isOpencode ? 'OpenCode' : 'Claude Code';
  const command = isOpencode ? '/gsd-help' : '/gsd:help';
  console.log(`
  ${green}Done!${reset} Launch ${program} and run ${cyan}${command}${reset}.

  ${cyan}Join the community:${reset} https://discord.gg/5JJgD5svVS
`);
}

/**
 * Handle statusline configuration with optional prompt
 */
function handleStatusline(settings, isInteractive, callback) {
  const hasExisting = settings.statusLine != null;

  // No existing statusline - just install it
  if (!hasExisting) {
    callback(true);
    return;
  }

  // Has existing and --force-statusline flag
  if (forceStatusline) {
    callback(true);
    return;
  }

  // Has existing, non-interactive mode - skip
  if (!isInteractive) {
    console.log(`  ${yellow}⚠${reset} Skipping statusline (already configured)`);
    console.log(`    Use ${cyan}--force-statusline${reset} to replace\n`);
    callback(false);
    return;
  }

  // Has existing, interactive mode - prompt user
  const existingCmd = settings.statusLine.command || settings.statusLine.url || '(custom)';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`
  ${yellow}⚠${reset} Existing statusline detected

  Your current statusline:
    ${dim}command: ${existingCmd}${reset}

  GSD includes a statusline showing:
    • Model name
    • Current task (from todo list)
    • Context window usage (color-coded)

  ${cyan}1${reset}) Keep existing
  ${cyan}2${reset}) Replace with GSD statusline
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    callback(choice === '2');
  });
}

/**
 * Prompt for runtime selection (Claude Code / OpenCode / Both)
 * @param {function} callback - Called with array of selected runtimes
 */
function promptRuntime(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  console.log(`  ${yellow}Which runtime(s) would you like to install for?${reset}

  ${cyan}1${reset}) Claude Code ${dim}(~/.claude)${reset}
  ${cyan}2${reset}) OpenCode    ${dim}(~/.config/opencode)${reset} - open source, free models
  ${cyan}3${reset}) Both
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    if (choice === '3') {
      callback(['claude', 'opencode']);
    } else if (choice === '2') {
      callback(['opencode']);
    } else {
      callback(['claude']);
    }
  });
}

/**
 * Prompt for install location
 * @param {string[]} runtimes - Array of runtimes to install for
 */
function promptLocation(runtimes) {
  // Check if stdin is a TTY - if not, fall back to global install
  // This handles npx execution in environments like WSL2 where stdin may not be properly connected
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to global install${reset}\n`);
    installAllRuntimes(runtimes, true, false, hasLink);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Track whether we've processed the answer to prevent double-execution
  let answered = false;

  // Handle readline close event (Ctrl+C, Escape, etc.) - cancel installation
  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  // Show paths for selected runtimes
  const pathExamples = runtimes.map(r => {
    // Use the proper global directory function for each runtime
    const globalPath = getGlobalDir(r, explicitConfigDir);
    return globalPath.replace(os.homedir(), '~');
  }).join(', ');

  const localExamples = runtimes.map(r => `./${getDirName(r)}`).join(', ');

  console.log(`  ${yellow}Where would you like to install?${reset}

  ${cyan}1${reset}) Global ${dim}(${pathExamples})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(${localExamples})${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, async (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    const isGlobal = choice !== '2';
    await installAllRuntimes(runtimes, isGlobal, true, hasLink);
  });
}

/**
 * Install GSD for all selected runtimes
 * @param {string[]} runtimes - Array of runtimes to install for
 * @param {boolean} isGlobal - Whether to install globally
 * @param {boolean} isInteractive - Whether running interactively
 * @param {boolean} useLinks - Whether to use symlinks instead of copies
 */
async function installAllRuntimes(runtimes, isGlobal, isInteractive, useLinks = false) {
  const results = [];

  for (const runtime of runtimes) {
    const result = await install(isGlobal, runtime, useLinks);
    results.push(result);
  }

  // Handle statusline for Claude Code only (OpenCode uses themes)
  const claudeResult = results.find(r => r.runtime === 'claude');

  if (claudeResult) {
    handleStatusline(claudeResult.settings, isInteractive, (shouldInstallStatusline) => {
      finishInstall(claudeResult.settingsPath, claudeResult.settings, claudeResult.statuslineCommand, shouldInstallStatusline, 'claude');

      // Finish OpenCode install if present
      const opencodeResult = results.find(r => r.runtime === 'opencode');
      if (opencodeResult) {
        finishInstall(opencodeResult.settingsPath, opencodeResult.settings, opencodeResult.statuslineCommand, false, 'opencode');
      }
    });
  } else {
    // Only OpenCode
    const opencodeResult = results[0];
    finishInstall(opencodeResult.settingsPath, opencodeResult.settings, opencodeResult.statuslineCommand, false, 'opencode');
  }
}

// Main
if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (explicitConfigDir && hasLocal) {
  console.error(`  ${yellow}Cannot use --config-dir with --local${reset}`);
  process.exit(1);
} else if (hasLink && hasLocal) {
  console.error(`  ${yellow}Cannot use --link with --local${reset}`);
  console.error(`  ${dim}--link creates symlinks in the global config directory for development.${reset}`);
  console.error(`  ${dim}For local development, just work directly in your project.${reset}`);
  process.exit(1);
} else if (hasLink && hasUninstall) {
  console.error(`  ${yellow}Cannot use --link with --uninstall${reset}`);
  process.exit(1);
} else if (hasUninstall) {
  // Uninstall mode
  if (!hasGlobal && !hasLocal) {
    console.error(`  ${yellow}--uninstall requires --global or --local${reset}`);
    console.error(`  Example: npx @chude/get-stuff-done --claude --global --uninstall`);
    process.exit(1);
  }
  const runtimes = selectedRuntimes.length > 0 ? selectedRuntimes : ['claude'];
  for (const runtime of runtimes) {
    uninstall(hasGlobal, runtime);
  }
} else if (selectedRuntimes.length > 0) {
  // Non-interactive: runtime specified via flags
  if (!hasGlobal && !hasLocal) {
    // Need location but runtime is specified - prompt for location only
    promptLocation(selectedRuntimes);
  } else {
    // Both runtime and location specified via flags
    installAllRuntimes(selectedRuntimes, hasGlobal, false, hasLink);
  }
} else if (hasGlobal || hasLocal) {
  // Location specified but no runtime - default to Claude Code
  installAllRuntimes(['claude'], hasGlobal, false, hasLink);
} else {
  // Fully interactive: prompt for runtime, then location
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to Claude Code global install${reset}\n`);
    installAllRuntimes(['claude'], true, false, hasLink);
  } else {
    promptRuntime((runtimes) => {
      promptLocation(runtimes);
    });
  }
}

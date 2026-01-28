# Technology Stack

**Analysis Date:** 2026-01-28

## Languages

**Primary:**
- JavaScript (Node.js) - All runtime code (installer, hooks, build scripts)
- Markdown - Commands, agents, templates, workflows, and documentation

**Secondary:**
- Bash - Hook scripts (`hooks/pre-compact.sh`)
- JSON - Configuration and schemas

## Runtime

**Environment:**
- Node.js >= 16.7.0 (specified in `package.json` engines)

**Package Manager:**
- npm (uses `package-lock.json`)
- Lockfile: present

## Frameworks

**Core:**
- None - Pure Node.js stdlib (fs, path, os, readline, child_process)
- No external runtime dependencies

**Build/Dev:**
- esbuild ^0.24.0 - Listed but not currently used (hooks are pure Node.js)

## Key Dependencies

**Runtime Dependencies:**
- None (`"dependencies": {}`)

**Dev Dependencies:**
- esbuild ^0.24.0 - Build tool (reserved for future use)

**Critical Node.js Built-ins Used:**
- `fs` - File system operations
- `path` - Path manipulation
- `os` - OS info and home directory
- `readline` - Interactive prompts
- `child_process` - Spawn background processes

## Configuration

**Environment Variables:**
- `CLAUDE_CONFIG_DIR` - Custom Claude Code config directory
- `OPENCODE_CONFIG_DIR` - Custom OpenCode config directory
- `OPENCODE_CONFIG` - OpenCode config file path
- `XDG_CONFIG_HOME` - XDG base directory spec
- `GSD_PLANNING_DIR` - Custom planning directory (default: `.planning`)
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` - Auto-compaction threshold

**Config Files:**
- `~/.gsd/config.json` - User-level GSD configuration
- `.gsd/config.json` - Project-level GSD configuration
- `~/.claude/settings.json` - Claude Code settings (hooks, statusline)
- `~/.config/opencode/opencode.json` - OpenCode permissions

**Config Schema:**
- `config/gsd-config.schema.json` - JSON Schema for GSD configuration
- `config/default-config.json` - Default configuration values

## Platform Requirements

**Development:**
- Node.js 16.7.0+
- Git (for version control)
- No native dependencies or compilation required

**Production:**
- Cross-platform: Mac, Windows, Linux
- Runs inside Claude Code or OpenCode CLI
- Distribution via npm (`npx get-stuff-done`)

## Build Process

**Scripts:**
- `npm run build:hooks` - Copies hooks to `hooks/dist/`
- `npm run prepublishOnly` - Runs build:hooks before npm publish

**Build Output:**
- `hooks/dist/gsd-statusline.js`
- `hooks/dist/gsd-check-update.js`

## Distribution

**Package Name:** `get-stuff-done` (npm)
**Binary:** `get-stuff-done` (runs `bin/install.js`)
**Published Files:**
- `bin/` - Installer script
- `commands/` - Slash commands
- `get-stuff-done/` - Templates, workflows, references
- `agents/` - Subagent definitions
- `hooks/dist/` - Bundled hooks
- `scripts/` - Build scripts

---

*Stack analysis: 2026-01-28*

# External Integrations

**Analysis Date:** 2026-01-28

## APIs & External Services

**npm Registry:**
- Purpose: Distribution and update checking
- Usage: `npx get-stuff-done` for installation
- Update check: `npm view get-stuff-done-cc version`
- No authentication required for read operations

## Data Storage

**Databases:**
- None - All state is file-based

**File Storage:**
- Local filesystem only
- Planning state: `.planning/` directory
- Configuration: `~/.gsd/config.json` (user-level), `.gsd/config.json` (project-level)
- Cache: `~/.claude/cache/gsd-update-check.json`
- Todos: `~/.claude/todos/` directory

**Caching:**
- File-based update check cache
- Location: `~/.claude/cache/gsd-update-check.json`
- Contains: installed version, latest version, check timestamp

## Authentication & Identity

**Auth Provider:**
- None - No authentication required
- System relies on Claude Code/OpenCode authentication

## Monitoring & Observability

**Error Tracking:**
- None - Silent failure pattern in hooks

**Logs:**
- Event log: `.planning/events.log`
- Logs compaction events with timestamp and trigger type

## CI/CD & Deployment

**Hosting:**
- npm registry for package distribution
- GitHub for source code (forked from glittercowboy/get-shit-done)

**CI Pipeline:**
- `.upstream/.github/` exists (original project workflows)
- Fork does not have active CI configured

## Environment Configuration

**Required env vars:**
- None required - all have defaults

**Optional env vars:**
- `CLAUDE_CONFIG_DIR` - Override Claude config location
- `OPENCODE_CONFIG_DIR` - Override OpenCode config location
- `GSD_PLANNING_DIR` - Override planning directory
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` - Override auto-compaction threshold

**Secrets location:**
- No secrets required

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Claude Code Integration

**Hook System:**
- SessionStart hook: `gsd-check-update.js` - Checks for updates
- StatusLine hook: `gsd-statusline.js` - Custom status bar
- PreCompact hook: `pre-compact.sh` - Saves state before context compaction

**Slash Commands:**
- Installed to `~/.claude/commands/gsd/` (global) or `./.claude/commands/gsd/` (local)
- Commands are Markdown files with YAML frontmatter

**Agents:**
- Installed to `~/.claude/agents/` (global) or `./.claude/agents/` (local)
- Agent files: `gsd-*.md` (codebase-mapper, debugger, executor, planner, etc.)

**Settings Integration:**
- Modifies `~/.claude/settings.json` for hooks and statusline
- Respects existing user configuration

## OpenCode Integration

**Command Structure:**
- Flat structure: `command/gsd-*.md` (not nested like Claude Code)
- Tool name conversion: AskUserQuestion -> question, SlashCommand -> skill

**Permissions:**
- Configures `~/.config/opencode/opencode.json`
- Grants read and external_directory permissions for GSD docs

**Frontmatter Conversion:**
- `allowed-tools:` array -> `tools:` object
- Color names -> hex codes
- Path references: `~/.claude/` -> `~/.config/opencode/`
- Command syntax: `/gsd:command` -> `/gsd-command`

## File System Conventions

**Planning Directory Structure:**
```
.planning/
  STATE.md          - Current state and decisions
  ROADMAP.md        - Phase roadmap
  PLAN.md           - Current task plan
  CONTINUE.md       - Resume context (auto-generated)
  events.log        - Event history
  metrics.json      - Progress metrics
  config.json       - Project-level GSD config
  codebase/         - Codebase analysis documents
  research/         - Domain research
  quick/            - Quick mode task tracking
```

**State Persistence:**
- All state persists in files, not context
- Designed for session-independent operation
- Supports `claude -c` alternative workflow

---

*Integration audit: 2026-01-28*

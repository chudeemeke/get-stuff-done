# Coding Conventions

**Analysis Date:** 2026-01-28

## File Type Conventions

**This is a meta-prompting system.** The codebase consists primarily of Markdown files that serve as prompts/instructions for Claude, not traditional source code. The only executable code is the installer and hooks.

### Markdown Files (Primary Content)

**Commands** (`commands/gsd/*.md`):
- YAML frontmatter with specific fields
- Thin wrappers that delegate to workflows
- Section order: `<objective>` -> `<execution_context>` -> `<context>` -> `<process>` -> `<success_criteria>`

**Agents** (`agents/gsd-*.md`):
- YAML frontmatter with `name`, `description`, `tools`, `color`
- Spawned by orchestrator commands
- Structure: `<role>` -> `<philosophy>` -> domain-specific sections -> `<success_criteria>`

**Templates** (`get-stuff-done/templates/*.md`):
- No frontmatter typically
- Placeholder conventions: `[Square brackets]` for required, `{curly braces}` for patterns

**References** (`get-stuff-done/references/*.md`):
- Semantic XML containers related to filename
- Deep explanations and examples

### JavaScript Files (Installer + Hooks)

**Location:** `bin/install.js`, `hooks/*.js`, `scripts/*.js`

**Style:**
- Node.js CommonJS (`require`/`module.exports`)
- No TypeScript
- No external runtime dependencies (pure Node.js stdlib)

## Naming Patterns

**Files:**
| Type | Pattern | Example |
|------|---------|---------|
| Commands | kebab-case.md | `execute-phase.md` |
| Agents | gsd-kebab-case.md | `gsd-planner.md` |
| Templates | kebab-case.md | `phase-prompt.md` |
| References | kebab-case.md | `verification-patterns.md` |
| Hooks | gsd-kebab-case.js | `gsd-statusline.js` |

**Command Names:**
- Pattern: `gsd:kebab-case`
- Example: `gsd:execute-phase`, `gsd:new-project`

**XML Tags:**
- Pattern: kebab-case or snake_case (context-dependent)
- Examples: `<execution_context>`, `<success_criteria>`, `<must-haves>`

**Step Names (within workflows):**
- Pattern: snake_case
- Example: `name="load_project_state"`, `name="spawn_executor"`

**Bash Variables:**
- Pattern: CAPS_UNDERSCORES
- Examples: `PHASE_ARG`, `MODEL_PROFILE`, `COMMIT_PLANNING_DOCS`

## YAML Frontmatter Conventions

**Commands** (`commands/gsd/*.md`):
```yaml
---
name: gsd:command-name
description: One-line description
argument-hint: "<required>" or "[optional]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
```

**Agents** (`agents/gsd-*.md`):
```yaml
---
name: gsd-agent-name
description: What this agent does. Spawned by /gsd:command.
tools: Read, Write, Bash, Glob, Grep, WebFetch
color: green
---
```

**Plans** (generated output):
```yaml
---
phase: XX-name
plan: NN
type: execute
wave: N
depends_on: []
files_modified: []
autonomous: true
must_haves:
  truths: []
  artifacts: []
  key_links: []
---
```

## XML Structure Conventions

**Semantic containers only.** Use Markdown headers for hierarchy within XML.

**Correct:**
```xml
<objective>
## Primary Goal
Build authentication system

## Success Criteria
- Users can log in
- Sessions persist
</objective>
```

**Incorrect:**
```xml
<section name="objective">
  <subsection name="primary-goal">
    <content>Build authentication system</content>
  </subsection>
</section>
```

### Task Structure (in PLANs)

```xml
<task type="auto">
  <name>Task N: Action-oriented name</name>
  <files>src/path/file.ts, src/other/file.ts</files>
  <action>What to do, what to avoid and WHY</action>
  <verify>Command or check to prove completion</verify>
  <done>Measurable acceptance criteria</done>
</task>
```

Task types:
- `type="auto"` - Claude executes autonomously
- `type="checkpoint:human-verify"` - User must verify
- `type="checkpoint:decision"` - User must choose

## @-Reference Patterns

**Static references** (always load):
```
@~/.claude/get-stuff-done/workflows/execute-phase.md
@.planning/PROJECT.md
```

**Conditional references**:
```
@.planning/DISCOVERY.md (if exists)
```

References are lazy loading signals, not pre-loaded content.

## Language & Tone

**Imperative Voice:**
- DO: "Execute tasks", "Create file", "Read STATE.md"
- DON'T: "Execution is performed", "The file should be created"

**No Filler:**
- Absent: "Let me", "Just", "Simply", "Basically", "I'd be happy to"
- Present: Direct instructions, technical precision

**No Sycophancy:**
- Absent: "Great!", "Awesome!", "Excellent!", "I'd love to help"
- Present: Factual statements, verification results

**Brevity with Substance:**
- Good: "JWT auth with refresh rotation using jose library"
- Bad: "Phase complete" or "Authentication implemented"

## Anti-Patterns (Banned)

**Enterprise Patterns:**
- Story points, sprint ceremonies, RACI matrices
- Human dev time estimates (days/weeks)
- Team coordination, knowledge transfer docs
- Change management processes

**Temporal Language** (in implementation docs):
- DON'T: "We changed X to Y", "Previously", "No longer"
- DO: Describe current state only
- Exception: CHANGELOG.md, git commits

**Generic XML:**
- DON'T: `<section>`, `<item>`, `<content>`
- DO: Semantic tags: `<objective>`, `<verification>`, `<action>`

**Vague Tasks:**
- DON'T: "Add authentication", "Make it work"
- DO: Specific instructions with files, methods, libraries

## JavaScript Code Style

**Pattern:** Pure Node.js CommonJS

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI colors as constants
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

// Functions use camelCase
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
```

**Key patterns from `bin/install.js`:**
- Function names: camelCase
- Constants: camelCase for simple values, CAPS for collections
- Error handling: try/catch with silent failures for non-critical
- Path handling: Use `path.join()` for cross-platform
- Stdin processing: Chunk-based with JSON.parse

## Commit Conventions

**Format:**
```
{type}({scope}): {description}
```

**Types:**
| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `test` | Tests only (TDD RED) |
| `refactor` | Code cleanup (TDD REFACTOR) |
| `docs` | Documentation/metadata |
| `chore` | Config/dependencies |

**During execution:**
- One commit per task
- Stage files individually (never `git add .`)
- Capture hash for SUMMARY.md

## UI/Output Conventions

**Stage Banners:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► {STAGE NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Status Symbols:**
```
✓  Complete/Passed
✗  Failed/Missing
◆  In Progress
○  Pending
⚡ Auto-approved
⚠  Warning
```

**Progress Bar:**
```
Progress: ████████░░ 80%
```

**Checkpoint Box:**
```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝
```

---

*Convention analysis: 2026-01-28*

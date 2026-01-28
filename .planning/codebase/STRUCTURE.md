# Codebase Structure

**Analysis Date:** 2026-01-28

## Directory Layout

```
get-stuff-done/
├── agents/                 # Specialized subagent definitions (11 agents)
├── assets/                 # Logo and terminal graphics
├── bin/                    # CLI launcher and installer
├── commands/gsd/           # Slash command implementations (29 commands)
├── config/                 # Default configuration files
├── docs/                   # Documentation and architecture guides
│   ├── architecture/       # System design docs
│   ├── decisions/          # ADRs and decision records
│   └── plans/              # Development plans
├── get-stuff-done/         # Core system resources
│   ├── references/         # Shared knowledge (9 files)
│   ├── templates/          # Document templates
│   │   ├── codebase/       # Codebase analysis templates (7 files)
│   │   └── research-project/ # Research templates
│   └── workflows/          # Orchestration workflows (12 files)
├── hooks/                  # Claude Code hooks (3 files)
├── research/               # Background research docs
├── scripts/                # Build/utility scripts
├── .planning/              # Project planning artifacts (generated)
│   └── codebase/           # Codebase analysis output
├── .upstream/              # Original get-shit-done fork reference
├── CHANGELOG.md            # Version history
├── CONTRIBUTING.md         # Contribution guidelines
├── GSD-STYLE.md            # Style guide for GSD development
├── MAINTAINERS.md          # Maintainer information
├── QUICKSTART.md           # Getting started guide
├── README.md               # Project overview
├── package.json            # NPM package manifest
└── LICENSE                 # MIT License
```

## Directory Purposes

**agents/**
- Purpose: Define specialized subagents spawned via Claude Code Task tool
- Contains: 11 markdown files defining agent behavior, tools, and instructions
- Key files:
  - `gsd-executor.md` - Executes plans with atomic commits
  - `gsd-planner.md` - Creates phase plans with task breakdown
  - `gsd-verifier.md` - Verifies goal achievement
  - `gsd-debugger.md` - Scientific debugging with hypothesis testing
  - `gsd-codebase-mapper.md` - Analyzes existing codebases
  - `gsd-roadmapper.md` - Creates project roadmaps
  - `gsd-project-researcher.md` - Researches domain ecosystem
  - `gsd-phase-researcher.md` - Researches implementation approaches
  - `gsd-plan-checker.md` - Validates plans before execution
  - `gsd-integration-checker.md` - Verifies cross-phase integration
  - `gsd-research-synthesizer.md` - Consolidates parallel research

**commands/gsd/**
- Purpose: Slash commands that users invoke in Claude Code
- Contains: 29 markdown command definitions
- Key files:
  - `new-project.md` - Initialize project with research and roadmap
  - `plan-phase.md` - Create execution plans for a phase
  - `execute-phase.md` - Run plans with wave-based parallelization
  - `verify-work.md` - User acceptance testing
  - `map-codebase.md` - Analyze existing codebase
  - `progress.md` - Show current status
  - `help.md` - Command reference

**get-stuff-done/**
- Purpose: Core system resources shared across commands and agents
- Contains: References, templates, workflows subdirectories

**get-stuff-done/references/**
- Purpose: Shared knowledge and behavior specifications
- Contains: 9 reference documents
- Key files:
  - `checkpoints.md` - Checkpoint type definitions and patterns
  - `verification-patterns.md` - How to verify phase goals
  - `tdd.md` - Test-driven development workflow
  - `git-integration.md` - Commit conventions and workflow
  - `model-profiles.md` - Opus/Sonnet/Haiku selection
  - `planning-config.md` - Configuration options
  - `questioning.md` - How to ask clarifying questions
  - `continuation-format.md` - Resume context format
  - `ui-brand.md` - Output formatting standards

**get-stuff-done/templates/**
- Purpose: Document structure templates for generated artifacts
- Contains: 22 template files plus subdirectories
- Key files:
  - `phase-prompt.md` - PLAN.md file format
  - `summary.md` - SUMMARY.md file format
  - `verification-report.md` - VERIFICATION.md format
  - `state.md` - STATE.md format
  - `roadmap.md` - ROADMAP.md format
  - `project.md` - PROJECT.md format
  - `requirements.md` - REQUIREMENTS.md format

**get-stuff-done/templates/codebase/**
- Purpose: Templates for codebase analysis output
- Contains: 7 template files
- Key files:
  - `architecture.md` - System architecture template
  - `structure.md` - Directory structure template
  - `conventions.md` - Coding conventions template
  - `testing.md` - Testing patterns template
  - `stack.md` - Technology stack template
  - `integrations.md` - External integrations template
  - `concerns.md` - Technical debt template

**get-stuff-done/workflows/**
- Purpose: Orchestration logic for complex multi-step operations
- Contains: 12 workflow definitions
- Key files:
  - `execute-phase.md` - Wave-based parallel plan execution
  - `execute-plan.md` - Single plan execution logic
  - `verify-phase.md` - Phase verification workflow
  - `verify-work.md` - User acceptance testing workflow
  - `map-codebase.md` - Codebase analysis workflow
  - `complete-milestone.md` - Milestone archival workflow
  - `diagnose-issues.md` - Debug workflow
  - `discuss-phase.md` - Context gathering workflow

**bin/**
- Purpose: CLI entry points and installation scripts
- Contains: 2 files
- Key files:
  - `gsd` - Bash launcher that sets environment and runs Claude Code
  - `install.js` - Node.js installer for agents/commands/hooks

**hooks/**
- Purpose: Claude Code lifecycle hooks
- Contains: 3 files
- Key files:
  - `pre-compact.sh` - Saves state before context compaction
  - `gsd-statusline.js` - Status bar display
  - `gsd-check-update.js` - Version update checker

**docs/architecture/**
- Purpose: Technical architecture documentation
- Contains: 2 files
- Key files:
  - `SYSTEM-DESIGN.md` - Full system architecture
  - `CLAUDE-CODE-INTEGRATION.md` - Task tool and agent integration

## Key File Locations

**Entry Points:**
- `bin/gsd`: CLI launcher (bash script)
- `bin/install.js`: NPM installer (Node.js)
- `commands/gsd/help.md`: Command reference

**Configuration:**
- `config/default-config.json`: Default project settings
- `get-stuff-done/templates/config.json`: Template for .planning/config.json
- `package.json`: NPM package manifest

**Core Logic:**
- `agents/gsd-executor.md`: Plan execution logic
- `agents/gsd-planner.md`: Plan creation methodology
- `get-stuff-done/workflows/execute-phase.md`: Orchestration logic

**Testing:**
- No automated tests - system uses manual UAT via `/gsd:verify-work`

## Naming Conventions

**Files:**
- Agent definitions: `gsd-{role}.md` (e.g., `gsd-executor.md`)
- Commands: `{verb}-{noun}.md` (e.g., `execute-phase.md`, `new-project.md`)
- Templates: `{artifact-type}.md` (e.g., `summary.md`, `state.md`)

**Directories:**
- Kebab-case for multi-word names (e.g., `get-stuff-done`, `research-project`)
- Singular names for type containers (e.g., `agents/` not `agent/`)

**Generated Artifacts (in user projects):**
- Phase directories: `.planning/phases/{NN}-{name}/` (e.g., `01-foundation/`)
- Plan files: `{phase}-{plan}-PLAN.md` (e.g., `01-02-PLAN.md`)
- Summary files: `{phase}-{plan}-SUMMARY.md` (e.g., `01-02-SUMMARY.md`)
- State files: `STATE.md`, `ROADMAP.md`, `PROJECT.md`, `REQUIREMENTS.md`

## Where to Add New Code

**New Agent:**
- Implementation: `agents/gsd-{name}.md`
- Format: YAML frontmatter (name, description, tools, color) + markdown instructions

**New Slash Command:**
- Implementation: `commands/gsd/{command-name}.md`
- Format: YAML frontmatter (name, description, argument-hint, allowed-tools) + XML-structured prompt

**New Workflow:**
- Implementation: `get-stuff-done/workflows/{workflow-name}.md`
- Format: XML-structured process definition with steps

**New Template:**
- Implementation: `get-stuff-done/templates/{template-name}.md`
- Format: Markdown with placeholder sections

**New Reference:**
- Implementation: `get-stuff-done/references/{topic}.md`
- Format: XML-structured knowledge document

**New Hook:**
- Implementation: `hooks/{hook-name}.{sh|js}`
- Format: Bash script or Node.js script matching Claude Code hook contract

## Special Directories

**.upstream/**
- Purpose: Contains original get-shit-done fork for reference
- Generated: No (manually maintained)
- Committed: Yes

**.planning/**
- Purpose: Project-specific planning artifacts (in user projects)
- Generated: Yes (by GSD commands)
- Committed: Configurable via `commit_docs` in config.json

**config/**
- Purpose: Default configuration templates
- Generated: No
- Committed: Yes

## Installation Targets

When installed, GSD copies files to:

**Global Install (`~/.claude/` or `~/.config/opencode/`):**
```
~/.claude/
├── agents/
│   └── gsd-*.md           # Agent definitions
├── commands/gsd/
│   └── *.md               # Slash commands
├── get-stuff-done/
│   ├── references/        # Reference docs
│   ├── templates/         # Templates
│   └── workflows/         # Workflows
├── hooks/
│   └── pre-compact.sh     # Lifecycle hooks
└── settings.json          # Updated with hook registration
```

**Local Install (`.claude/` in project):**
- Same structure as global, but in project directory

---

*Structure analysis: 2026-01-28*

<purpose>
Initialize a new project through unified flow: questioning -> research (optional) -> requirements -> roadmap. Creates .planning/ directory structure with PROJECT.md, config.json, REQUIREMENTS.md, ROADMAP.md, and STATE.md.
</purpose>

<process>

<step name="resolve_model_profile" priority="first">
Read model profile for agent spawning:

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default to "balanced" if not set.

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| gsd-project-researcher | opus | sonnet | sonnet |
| gsd-research-synthesizer | sonnet | sonnet | haiku |
| gsd-roadmapper | opus | opus | sonnet |
</step>

<step name="validate_environment">
Check if project is already initialized:

```bash
ls .planning/PROJECT.md 2>/dev/null
```

**If PROJECT.md exists:**
```
Project already initialized.

To start a new milestone: /gsd:new-milestone
To check progress: /gsd:progress
```
Exit workflow.

**If --auto flag** and no @ reference provided:
```
Error: --auto mode requires an idea document via @ reference.

Usage: /gsd:new-project --auto @path/to/idea.md
```
Exit workflow.
</step>

<step name="setup_directory">
Create planning directory structure:

```bash
mkdir -p .planning/phases
mkdir -p .planning/research
```
</step>

<step name="configure_workflow">
Use AskUserQuestion for initial configuration:

Question 1:
- header: "Profile"
- question: "Model profile for GSD agents?"
- multiSelect: false
- options:
  - label: "balanced (Recommended)"
    description: "Opus planning + Sonnet execution"
  - label: "quality"
    description: "Opus planning + Opus execution"
  - label: "budget"
    description: "Sonnet planning + Sonnet execution"

Question 2:
- header: "Docs"
- question: "Commit planning docs to git?"
- multiSelect: false
- options:
  - label: "Yes (Recommended)"
    description: "Planning docs committed and versioned"
  - label: "No"
    description: "Planning docs stay local only"

Write config.json with selections:
```json
{
  "model_profile": "[selected]",
  "skip_research": false,
  "skip_plan_check": false,
  "skip_verification": false,
  "commit_docs": [true/false],
  "branch_per_phase": false
}
```
</step>

<step name="questioning">
**If --auto flag:** Skip questioning, extract from provided document.

**Otherwise:** Use adaptive questioning to understand the project.

Load questioning reference from @~/.claude/get-stuff-done/references/questioning.md.

Key areas to cover:
1. **What is this?** -- One sentence. What does it do?
2. **Core value** -- The ONE thing that matters most
3. **Target user** -- Who uses this?
4. **Constraints** -- Budget, timeline, tech stack, platform
5. **First milestone** -- What does v1.0 look like?
6. **Non-goals** -- What is explicitly out of scope?

Use AskUserQuestion for structured choices where applicable.
Engage in conversation for open-ended questions.

Continue until you have enough context for PROJECT.md.
</step>

<step name="create_project_md">
Write PROJECT.md using template:

```markdown
# [Project Name]

## What This Is

[One paragraph description]

## Core Value

[The ONE thing that matters most]

## Target User

[Who uses this and why]

## Requirements

### Validated

(None yet -- ship to validate)

### Active

- [ ] [Requirement 1]
- [ ] [Requirement 2]
...

### Out of Scope

- [Item] -- [reason]

## Constraints

- [Constraint 1]
- [Constraint 2]

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| [Decision] | [Why] | -- |

---
*Created: [date]*
```

Write to `.planning/PROJECT.md`.
</step>

<step name="research">
**If project has new/unfamiliar domain:**

Display:
```
Researching domain...
```

Spawn parallel research agents (up to 4) for different aspects:
- Technology/framework research
- Architecture patterns
- Quality/testing approaches
- Domain-specific concerns

Each researcher writes to `.planning/research/`.

After all return, spawn synthesizer to create `.planning/research/SUMMARY.md`.

**If project uses well-known patterns:** Skip research.
</step>

<step name="create_requirements">
Based on PROJECT.md and research (if done), create scoped requirements:

Write REQUIREMENTS.md with:
- Functional requirements (what it must do)
- Non-functional requirements (performance, security, etc.)
- Acceptance criteria for each requirement
- Traceability IDs (REQ-001, REQ-002, etc.)

Use template from @~/.claude/get-stuff-done/templates/requirements.md.

Write to `.planning/REQUIREMENTS.md`.

Present requirements summary and ask for approval:
```
## Requirements: [count] items

### Functional ([count])
[list]

### Non-Functional ([count])
[list]

Approve requirements? (yes / adjust)
```

Wait for approval.
</step>

<step name="create_roadmap">
Spawn roadmapper to create phase structure:

```
Task(
  prompt="""Create a roadmap for this project.

PROJECT.md: {project_content}
REQUIREMENTS.md: {requirements_content}
Research: {research_summary if exists}

Create .planning/ROADMAP.md with phases, each mapping to requirements.
Phase numbering starts at 1.
""",
  subagent_type="gsd-roadmapper",
  model="{roadmapper_model}",
  description="Create project roadmap"
)
```

Present roadmap summary and ask for approval.
</step>

<step name="create_state">
Initialize STATE.md:

```markdown
## Project Reference

See: .planning/PROJECT.md (created [date])

**Core value:** [from PROJECT.md]
**Current focus:** v1.0 [Milestone name]

## Current Position

Phase: 1 of [N] ([Phase 1 name])
Plan: Not started
Status: Ready to plan
Last activity: [date] -- Project initialized

Progress: [--------------------] 0% (0/[N] phases)

## Accumulated Context

### Key Decisions
[from PROJECT.md]

### Blockers
None

### Roadmap Evolution
- Project initialized with [N] phases ([date])
```

Write to `.planning/STATE.md`.
</step>

<step name="commit">
Check planning config and commit if enabled:

```bash
git add .planning/
git commit -m "docs: initialize project with [N] phases"
```
</step>

<step name="confirm">
```
Project initialized.

Created:
- .planning/PROJECT.md
- .planning/config.json
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/STATE.md

[N] phases planned across v1.0 milestone.

---

## Next Up

**Plan Phase 1** -- create execution plans

`/gsd:plan-phase 1`

---
```
</step>

</process>

<success_criteria>
- [ ] .planning/ directory structure created
- [ ] config.json written with user preferences
- [ ] Questioning completed (or --auto document parsed)
- [ ] PROJECT.md created with all sections
- [ ] Research completed (if needed)
- [ ] REQUIREMENTS.md created and approved
- [ ] ROADMAP.md created with phase structure
- [ ] STATE.md initialized
- [ ] Git commit (if commit_docs enabled)
- [ ] Next step displayed (/gsd:plan-phase 1)
</success_criteria>

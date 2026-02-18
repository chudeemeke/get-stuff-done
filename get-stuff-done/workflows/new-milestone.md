<purpose>
Start a new milestone: questioning -> research (optional) -> requirements -> roadmap. Brownfield equivalent of new-project. Project exists, PROJECT.md has history. Gathers "what's next", updates PROJECT.md, then runs requirements -> roadmap cycle.
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
| gsd-roadmapper | opus | opus | sonnet |
</step>

<step name="validate_environment">
Check project exists:

```bash
cat .planning/PROJECT.md 2>/dev/null
cat .planning/MILESTONES.md 2>/dev/null
cat .planning/STATE.md 2>/dev/null
cat .planning/config.json 2>/dev/null
```

**If no PROJECT.md:**
```
Error: No project found. Run /gsd:new-project first.
```
Exit workflow.

**If ROADMAP.md exists with active phases:**
```
Warning: Active roadmap exists with incomplete phases.

Options:
1. Complete current milestone first (/gsd:complete-milestone)
2. Force new milestone (will archive current roadmap)
```

Use AskUserQuestion for choice.
</step>

<step name="load_milestone_context">
Check for pre-gathered milestone context:

```bash
cat .planning/MILESTONE-CONTEXT.md 2>/dev/null
```

If exists (from /gsd:discuss-milestone or similar), use it as starting context.
</step>

<step name="questioning">
Parse $ARGUMENTS for milestone name. If not provided, ask.

Use adaptive questioning to understand the milestone:

1. **Milestone name and version** -- e.g., "v1.1 Security Hardening"
2. **Goals** -- What does this milestone deliver?
3. **Scope** -- What's in vs out?
4. **New capabilities** -- Anything requiring domain research?
5. **Constraints** -- Timeline, tech limitations, dependencies

Build on PROJECT.md history. Reference validated requirements, past decisions.

Use AskUserQuestion for structured choices.
</step>

<step name="update_project_md">
Update PROJECT.md with new milestone context:

- Add new Active requirements
- Update "Current focus" to new milestone
- Add any new constraints
- Preserve Validated requirements from past milestones
</step>

<step name="research">
**If milestone introduces NEW capabilities/domains:**

Spawn research agents for unfamiliar areas only. Skip research for features using established patterns.

Each researcher writes to `.planning/research/`.

**If milestone is incremental (bug fixes, optimization, etc.):**
Skip research.
</step>

<step name="create_requirements">
Create REQUIREMENTS.md scoped to this milestone:

- New functional requirements
- Non-functional requirements
- Reference (but don't duplicate) validated requirements from previous milestones
- Traceability IDs continue from previous milestone (REQ-XXX)

Present and ask for approval.
</step>

<step name="create_roadmap">
Spawn roadmapper:

```
Task(
  prompt="""Create a roadmap for milestone [version] [name].

PROJECT.md: {project_content}
REQUIREMENTS.md: {requirements_content}
MILESTONES.md: {milestones_content}
Research: {research if exists}

Phase numbering continues from last milestone.
Previous milestone ended at Phase [N].
New phases start at Phase [N+1].
""",
  subagent_type="gsd-roadmapper",
  model="{roadmapper_model}",
  description="Create milestone roadmap"
)
```

Present roadmap summary and ask for approval.
</step>

<step name="reset_state">
Reset STATE.md for new milestone:

```markdown
## Project Reference

See: .planning/PROJECT.md (updated [date])

**Core value:** [from PROJECT.md]
**Current focus:** [milestone version] [milestone name]

## Current Position

Phase: [N+1] of [M] ([First new phase name])
Plan: Not started
Status: Ready to plan
Last activity: [date] -- New milestone started

Progress: [--------------------] 0% (0/[new phase count] phases)

## Accumulated Context

### Key Decisions
[carry over relevant decisions from previous milestone]

### Blockers
None

### Roadmap Evolution
- Milestone [version] [name] started with [count] phases ([date])
```
</step>

<step name="commit">
Check planning config and commit if enabled:

```bash
git add .planning/PROJECT.md .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md
git commit -m "docs: start milestone [version] [name] with [N] phases"
```
</step>

<step name="confirm">
```
Milestone started: [version] [name]

Updated: PROJECT.md
Created: REQUIREMENTS.md, ROADMAP.md
Reset: STATE.md

[N] new phases (Phase [start]-[end]).

---

## Next Up

**Plan Phase [start]** -- create execution plans

`/gsd:plan-phase [start]`

---
```
</step>

</process>

<success_criteria>
- [ ] Project existence validated
- [ ] Milestone context gathered (questioning or pre-loaded)
- [ ] PROJECT.md updated with new milestone goals
- [ ] Research completed (if new domain areas)
- [ ] REQUIREMENTS.md created and approved
- [ ] ROADMAP.md created with continued numbering
- [ ] STATE.md reset for new milestone
- [ ] Git commit (if commit_docs enabled)
- [ ] Next step displayed
</success_criteria>

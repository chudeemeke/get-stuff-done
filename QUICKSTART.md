# GSD Quick Start

## TL;DR

- New project: `gsd` then `/gsd:new-project`
- Continue work: `gsd` then say "resume" (reads from `.planning/`)
- No more `claude -c` needed: state lives in files, not context

---

## The Mental Model Shift

**Old workflow:**
```bash
claude -c               # Continue previous session
# Hope the context hasn't rotted
# Hope Claude remembers what we were doing
```

**GSD workflow:**
```bash
gsd                     # Always start fresh
# Say "resume" or "/gsd:progress"
# Claude reads STATE.md, PLAN.md, ROADMAP.md
# Full context from files, zero rot
```

GSD stores everything in `.planning/`. Each session starts clean with 200k tokens. Claude reads your project state from files, not from accumulated conversation context.

---

## Greenfield: Starting a New Project

```bash
cd ~/Projects/my-new-app
gsd
```

Then in Claude:
```
/gsd:new-project
```

The system will:
1. Ask questions until it understands your idea
2. Research the domain (optional but recommended)
3. Extract requirements (v1, v2, out of scope)
4. Create a phased roadmap

**Output files:**
```
.planning/
  PROJECT.md        # Vision and goals
  REQUIREMENTS.md   # What you're building
  ROADMAP.md        # Phases to get there
  STATE.md          # Current progress
```

---

## Brownfield: Existing Codebase

```bash
cd ~/Projects/existing-app
gsd
```

Then in Claude:
```
/gsd:map-codebase     # Analyze what's there
/gsd:new-project      # Now add your new feature
```

The codebase mapping gives GSD context about your stack, architecture, and conventions before planning.

---

## Daily Workflow

### Starting a Session

Always start with:
```bash
gsd
```

Then either:
- **"Resume"** or **"/gsd:progress"**: See where you left off
- **"/gsd:execute-phase N"**: Continue executing a phase
- **"/gsd:verify-work N"**: Test what was built

### The Core Cycle

For each phase:
```
/gsd:discuss-phase N   # Capture your preferences
/gsd:plan-phase N      # Create atomic task plans
/gsd:execute-phase N   # Run tasks (parallel where possible)
/gsd:verify-work N     # User acceptance testing
```

### Quick Tasks

For small stuff that doesn't need full planning:
```
/gsd:quick
```

GSD guarantees (atomic commits, state tracking) without the ceremony.

---

## Why You Don't Need `claude -c`

| Old Approach | Problem |
|--------------|---------|
| `claude -c` | Context accumulates, quality degrades, "I'll be more concise now" |
| Long sessions | Model gets confused, forgets earlier decisions |
| Manual handoff | "Here's what we did last time..." (wastes tokens) |

| GSD Approach | Solution |
|--------------|----------|
| `gsd` (always fresh) | 200k clean tokens every time |
| STATE.md | Decisions persist in files |
| Subagents | Heavy work in isolated contexts |

**State lives in files, not context.** When you say "resume", Claude reads:
- `STATE.md` for decisions and blockers
- `ROADMAP.md` for phase progress
- `PLAN.md` for current tasks

No context dependency. No rot. No "where were we?"

---

## Command Reference

### Core Workflow

| Command | Purpose |
|---------|---------|
| `/gsd:new-project` | Initialize: questions, research, requirements, roadmap |
| `/gsd:discuss-phase N` | Capture preferences before planning |
| `/gsd:plan-phase N` | Research + create atomic plans |
| `/gsd:execute-phase N` | Run plans in parallel waves |
| `/gsd:verify-work N` | User acceptance testing |

### Navigation

| Command | Purpose |
|---------|---------|
| `/gsd:progress` | Where am I? What's next? |
| `/gsd:help` | Show all commands |

### Session Management

| Command | Purpose |
|---------|---------|
| `/gsd:pause-work` | Create handoff when stopping mid-phase |
| `/gsd:resume-work` | Restore from last session |

### Quick Mode

| Command | Purpose |
|---------|---------|
| `/gsd:quick` | Ad-hoc task with GSD guarantees |

---

## File Structure

After initialization:
```
your-project/
  .planning/
    PROJECT.md          # Project vision
    REQUIREMENTS.md     # What to build
    ROADMAP.md          # Phases
    STATE.md            # Current state (decisions, blockers)
    config.json         # GSD settings
    phase-1/
      CONTEXT.md        # Your preferences (from discuss)
      RESEARCH.md       # Domain research
      1-PLAN.md         # Atomic task plan
      SUMMARY.md        # What was built
      VERIFICATION.md   # Test results
```

---

## Tips

1. **Always start with `gsd`**, not `claude`. The launcher sets up context management.

2. **Say "resume" to pick up where you left off.** Claude reads from `.planning/` automatically.

3. **Use `/gsd:progress` often.** It shows current state and routes to the next action.

4. **Don't skip Discuss phase.** Most failures come from wrong assumptions.

5. **Trust the subagents.** Heavy work happens in fresh 200k contexts. Your main session stays lean.

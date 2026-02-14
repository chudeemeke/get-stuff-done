# GSD Agent Memory Protocol

---
protocol_version: 1
created: 2026-02-14
agents:
  - gsd-executor
  - gsd-verifier
  - gsd-planner
  - gsd-phase-researcher
  - gsd-plan-checker
  - gsd-codebase-mapper
  - gsd-debugger
  - gsd-project-researcher
  - gsd-research-synthesizer
  - gsd-roadmapper
  - gsd-integration-checker
---

## Memory Protocol

### Location
All agent memories are stored at `.planning/memory/` within the project repository.

### Access Model
**Shared read, private write:**
- Each agent has its own memory file for writing
- All agents can read all memory files
- A `shared/` directory exists for cross-agent knowledge that any agent can write to

### Format
Hybrid markdown body with YAML frontmatter:
- **Frontmatter:** `agent`, `updated` timestamp, `entries` count
- **Body:** Markdown-formatted findings, patterns, and learnings

### Staleness Detection
Agents actively verify that memories still apply before acting on them. Each session:
1. Read your memory file and shared memory
2. Verify each entry against current codebase state
3. Note stale entries for cleanup at session end

### Conflict Resolution
**Latest-wins with contradiction logging:**
- When new learning contradicts an existing entry, keep both
- Mark the old entry with `status: superseded`
- Add `superseded_by` field pointing to the new understanding
- This creates an audit trail of how knowledge evolved

### Curation
**Auto-curation default:**
- Agents decide what to write based on reusability criterion
- Guideline: "Only write memories that would change your behavior next time"
- Alternative curation modes can be enabled in config.json if needed

### Phase Tagging
YES, auto-tag each entry with the phase that produced it. This enables staleness detection ("learned in Phase 3, is it still true in Phase 8?").

### Size
No explicit limit by default. Memory files grow organically. If memory becomes noisy, switch to:
- Fixed limit per file (e.g., 200 entries max)
- Rolling window (keep only last N months)
- Topic-based refactoring (split large files into topic files)

## Agent Files

Each agent has its own memory file at `.planning/memory/{agent-name}.md`:

- `gsd-executor.md` -- Plan execution patterns, deviation learnings, checkpoint experiences
- `gsd-verifier.md` -- Verification strategies, common gaps, wiring patterns
- `gsd-planner.md` -- Planning heuristics, dependency patterns, task sizing lessons
- `gsd-phase-researcher.md` -- Technology evaluation patterns, research pitfalls, confidence calibration
- `gsd-plan-checker.md` -- Requirement coverage patterns, common planning mistakes, dimension scoring insights
- `gsd-codebase-mapper.md` -- Codebase navigation patterns, architecture insights, file organization discoveries
- `gsd-debugger.md` -- Root cause patterns, debugging strategies, common failure modes
- `gsd-project-researcher.md` -- Project-specific patterns, workflow insights, tool discovery
- `gsd-research-synthesizer.md` -- Synthesis heuristics, research organization patterns, confidence aggregation learnings
- `gsd-roadmapper.md` -- Roadmap structuring patterns, milestone sizing insights, phase ordering lessons
- `gsd-integration-checker.md` -- Integration verification patterns, cross-plan conflict detection, dependency checking insights

Agent files are created on first write (lazy initialization). Agents do not need to create their memory file proactively.

## Shared Directory

**Location:** `.planning/memory/shared/`

**Purpose:** Cross-agent knowledge that benefits all agents:
- Project-specific conventions discovered during execution
- Common pitfalls and fixes
- Tool-specific gotchas
- Universal patterns worth checking

**Files:**
- `project-patterns.md` -- Discovered project conventions (build commands, test patterns, config structure)
- `pitfalls.md` -- Known gotchas and their fixes (authentication gates, platform quirks, tool limitations)

Any agent can write to shared files. Shared memory is read by all agents at session start.

## Memory Entry Format

Each memory entry uses this YAML structure within the markdown body:

```yaml
- finding: "Description of what you learned"
  source: "Phase X, Plan Y, Task Z"
  confidence: HIGH|MEDIUM|LOW
  phase: "XX-phase-name"
  date: "YYYY-MM-DD"
```

**Fields:**
- `finding`: Clear, actionable description of the learning
- `source`: Where this knowledge came from (phase, plan, task)
- `confidence`: How certain you are this applies consistently
- `phase`: Phase identifier for staleness detection
- `date`: When this was learned

**Confidence levels:**
- HIGH: Verified multiple times, consistently applies
- MEDIUM: Observed once or twice, likely applies
- LOW: Speculative or context-dependent

## Supersession Format

When new learning contradicts an existing entry, mark the old entry as superseded:

```yaml
- finding: "Old understanding of how the system works"
  source: "Phase 2, Plan 3, Task 1"
  confidence: HIGH
  phase: "02-statusline-redesign"
  date: "2026-01-15"
  status: superseded
  superseded_by: "Discovered in Phase 5 that the actual pattern is X, not Y. See entry dated 2026-02-01."
```

Then add the new entry:

```yaml
- finding: "New understanding of how the system actually works"
  source: "Phase 5, Plan 2, Task 3"
  confidence: HIGH
  phase: "05-update-commands"
  date: "2026-02-01"
```

This creates an audit trail showing how your understanding evolved over time.

## Usage Protocol

### On Session Start
1. Read your agent-specific memory file (`.planning/memory/{agent-name}.md`)
2. Read shared memory files in `.planning/memory/shared/`
3. Verify each entry still applies to current codebase state
4. Note any stale entries for cleanup

### During Execution
When you discover something worth remembering:
- Ask: "Would this change my behavior next time?"
- If YES: Write it to your memory file or shared memory (depending on scope)
- If NO: Skip it (avoid noise)

### On Session End
1. Update your memory file with new learnings from this session
2. If you discovered contradictions, mark old entries as superseded
3. Update the frontmatter `updated` timestamp and `entries` count

## Implementation Notes

**Do NOT use the native `memory` frontmatter field in agent definitions.** That field stores files at `.claude/agent-memory/` or `.claude/agent-memory-local/`, not at `.planning/memory/`. Implement memory through explicit Read/Write instructions in agent system prompts.

**Memory bootstrap:** If your memory file does not exist yet, create it with:
```yaml
---
agent: {agent-name}
updated: {today}
entries: 0
---
```
Then add entries during execution.

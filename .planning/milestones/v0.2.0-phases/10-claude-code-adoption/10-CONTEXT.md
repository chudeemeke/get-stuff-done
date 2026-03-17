# Phase 10: Claude Code Capability Adoption - Discussion Context

**Phase Goal:** Leverage Claude Opus 4.6 and Claude Code 2026 platform improvements for enhanced GSD orchestration

**Discussion Date:** 2026-02-14
**Status:** Complete (all areas discussed, ready for planning)

---

## Decision Summary

### 1. Memory & Persistence

| Decision | Choice |
|----------|--------|
| Scope | Project-level (each project has its own agent memory) |
| Which agents | All GSD agents |
| Curation default | Auto-curation (agents decide what to write); toggleable to explicit triggers or full Claude discretion |
| Access model | Shared read, private write (each agent writes to own section, can read others') |
| Staleness handling | Active staleness detection (agents verify memories still apply before acting) |
| Conflict resolution | Latest-wins with contradiction logging |
| Format | Hybrid — markdown body with YAML frontmatter for metadata |
| Location | `.planning/memory/` |
| Size limits | No explicit limit by default (grow organically); toggleable to fixed limit or rolling window |
| Phase tagging | Researcher/planner to determine if memories should auto-tag with producing phase |

**Key Insight:** The memory system is also the mechanism for maintaining oversight agent expertise over time. Agents learn from valid flags, missed issues, and verifier catches — accumulated knowledge improves quality across sessions.

### 2. Thinking Effort Calibration

| Decision | Choice |
|----------|--------|
| Priority | Quality-first (extended thinking wherever it genuinely improves output) |
| Scaling model | Dynamic — base level per agent type + upscaling for complex tasks |
| Scale | Claude's native scale (API's reasoning_effort parameter) |
| High-effort operations | Upstream conflict resolution, all analysis operations, plan creation & verification |
| Visibility | Show in statusline when high effort is active |
| Course corrections | Always log to memory when extended thinking changes the answer |
| Location of hints | In agent definition files (self-contained) |

**RESEARCH NEEDED:** The Phase 10 researcher must investigate:
- Whether Task tool subagents inherit the session's effort level setting
- Whether there's an API parameter to set reasoning_effort per-spawn
- How `/model` effort slider maps to the API parameter
- Design thinking effort implementation based on actual findings, not assumptions

### 3. Agent Teams & Parallelization

| Decision | Choice |
|----------|--------|
| Scope | Expand team patterns to more workflows |
| Team templates | Build now (Phase 10 scope) — templates define common team shapes, workflows reference and optionally customize |
| Oversight agents | Specialized per workflow, memory-driven expertise accumulation |
| Monitoring style | Active monitoring (watches every action, flags in real-time) |
| Oversight authority | Flag and advise only (no blocking power) |
| Team size cap | Soft cap of 8 agents with warning; override allowed |
| Team integration | Native team member via TeamCreate/SendMessage (Claude Code primitives) |
| Flag routing | Configurable per workflow — high-stakes (upstream sync, security) routes through lead; routine goes direct to executor |
| Oversight access | Full codebase access, artifact-first prompting (match Anthropic's pattern) |
| Default state | Oversight always on by default; configurable per workflow in config.json |

**Workflows to expand with teams:**
1. `/gsd:plan-phase` — Parallel researcher + codebase mapper, both feeding into planner
2. `/gsd:execute-phase` — Conflict watcher alongside parallel executors
3. `/gsd:upstream` — Parallel upstream analyzer, fork conflict checker, branding handler
4. `/gsd:verify-work` — Parallel verifiers (functional, cross-platform, security)

**Oversight agent design:**
- Specialized agents per workflow (not generic) — separate `.md` files
- Memory-driven expertise: initial seeding from project knowledge, then auto-learning
- Structured flags: requirement reference, memory entry that prompted check, severity classification, suggested fix
- Expertise maintained through memory system (area 1) — not manual curation

### 4. Tool Migration

**DROPPED from Phase 10.**

Reasoning:
- The settings.local.json corruption bug is already prevented by session memory
- Claude Code's system prompt already overrides agent instructions to prefer native tools
- Bash has genuine advantages for pipe composability, terminal verification, and complex analysis chains
- TACHES intentionally chose bash commands despite Claude tools being available — the tradeoffs are valid

### 5. Other Claude Code Capabilities

| Capability | Decision | Notes |
|------------|----------|-------|
| AskUserQuestion | Include | Add to workflows: discuss-phase, verify-work, execute-phase checkpoints, verify-phase clarifications |
| Fast mode | Exclude | Marginal benefit — GSD already has model profiles (haiku/sonnet/opus) |
| Additional hooks | Exclude | Pre-compact hook is sufficient |
| EnterPlanMode | Exclude | GSD has its own PLAN.md format with domain-specific structure |
| NotebookEdit | Exclude | Not relevant to GSD |

---

## Updated Success Criteria

Original criteria from ROADMAP.md with modifications:

1. **Agent memory frontmatter with scope** — Project-level memory in `.planning/memory/`, hybrid markdown+frontmatter format, all agents, shared read/private write
2. **Extended thinking hints with effort parameters** — Quality-first, in agent definitions, pending researcher investigation of per-agent API support
3. **Agent teams patterns for parallel orchestration** — Team templates built, oversight agents specialized per workflow, soft cap 8, native TeamCreate/SendMessage
4. ~~**Fast mode integration and flagging**~~ — Excluded (marginal benefit)
5. ~~**Bash file operations replaced with Claude tools**~~ — Dropped (bash has valid advantages, corruption already prevented)
6. **AskUserQuestion in workflows** — Added (structured decision UI in discuss-phase, verify-work, execute-phase, verify-phase)

---

## Constraints & Risks

- **Per-agent effort control uncertainty** — If the Task tool doesn't support reasoning_effort per-spawn, thinking effort hints in agent definitions may be aspirational. Researcher must determine actual capabilities before planner designs.
- **Token cost of oversight** — Active monitoring by oversight agents watching every action approximately doubles token spend per workflow. Acceptable given quality-first stance, but the configurable per-workflow toggle mitigates for routine work.
- **Memory bloat** — Auto-curation may produce noisy entries. Mitigated by toggleable cleanup strategy (default: grow organically, switch to fixed limit or rolling window if needed).
- **Team template scope** — Building templates now is forward-looking. Need to balance template infrastructure against shipping the core team patterns for existing workflows.

---

## Implementation Notes

- All oversight agents are `.md` files (same format as existing gsd-executor.md, gsd-verifier.md)
- Spawned via existing Task/TeamCreate tools
- Communication via existing SendMessage
- Memory read/write via existing Read/Write tools
- No new infrastructure, no new tools, no new APIs — just agent definitions and workflow modifications

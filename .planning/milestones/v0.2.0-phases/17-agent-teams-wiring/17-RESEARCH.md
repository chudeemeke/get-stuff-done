# Phase 17: Agent Teams Wiring - Research

**Researched:** 2026-02-20
**Domain:** Workflow conditional routing, Claude Code agent teams experimental API, config-driven branching in markdown workflows
**Confidence:** HIGH

## Summary

Phase 17 is a gap closure phase that wires existing Phase 10 artifacts (4 team templates + 4 oversight agents) into 4 workflow files via config-driven conditional routing. The templates and oversight agents are complete and correct. The workflows already have full sequential subagent fallback paths. The missing piece is a conditional branch at the right insertion point in each workflow that reads `teams.enabled` from config.json and routes to team mode when true.

This is documentation/workflow work, not code work. No JavaScript files change. No new external libraries are needed. The work is adding a `<teams_integration>` section to each of 4 workflow markdown files at the appropriate execution point.

The critical architectural finding is that Claude Code agent teams (TeamCreate/SendMessage) are experimental and require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` set in the environment. Since the GSD project has `teams.enabled: false` in config.json by default, the conditional routing means: in practice today, teams mode is never reached. The workflows read the config flag, branch to sequential fallback, and continue as before. When a user opts in by setting `teams.enabled: true`, they also need the experimental env flag set -- this should be documented in the routing section.

**Primary recommendation:** Add a `<teams_integration>` section to each workflow immediately before (or replacing) the step where subagents are spawned. The section checks `teams.enabled` from config.json; if true, it describes the TeamCreate/SendMessage sequence using the matching team template; if false, it falls through to existing sequential subagent logic. No existing workflow content needs to change -- only additions.

## Standard Stack

### Core

No new libraries. All capabilities use existing Claude Code primitives.

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Workflow `.md` files | Current | Orchestrator instructions in GSD workflows | Existing GSD pattern; consumed by orchestrators |
| Team template `.md` files | Current (Phase 10) | Define team shapes for each workflow | Already created in Phase 10 Plan 03 |
| Oversight agent `.md` files | Current (Phase 10) | Per-workflow monitors that flag without blocking | Already created in Phase 10 Plan 03 |
| `config.json` `teams` section | Current (Phase 10) | Config-driven toggle for team mode | Already exists with correct schema |

### Supporting (Experimental - Claude Code Platform)

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | env flag | Enables TeamCreate/SendMessage in Claude Code | Required for team mode path to actually work |
| TeamCreate primitive | Experimental | Creates a team lead with named teammates | When teams.enabled=true AND env flag is set |
| SendMessage primitive | Experimental | Routes messages between team members | Communication within an active team |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline conditional in each workflow step | Separate `<teams_integration>` section | Inline approach scatters team logic; dedicated section is easier to find and maintain |
| Single global team integration block | Per-workflow team sections | Each workflow has different team shapes (plan-phase has 4 members; execute-phase has variable N+2); per-workflow sections are accurate |

## Architecture Patterns

### File Locations (Verified by Direct Read)

```
C:/Users/Destiny/Projects/get-stuff-done/
  get-stuff-done/
    workflows/               # 4 files to modify
      execute-phase.md       # Primary: spawns gsd-executor agents per wave
      plan-phase.md          # Primary: spawns gsd-phase-researcher and gsd-planner
      upstream-sync.md       # Primary: orchestrates 7-stage sync (NOT workflow-subagent pattern)
      verify-phase.md        # Primary: spawns gsd-verifier
    teams/                   # 4 team templates (Phase 10, read-only)
      execute-phase-team.md
      plan-phase-team.md
      upstream-sync-team.md
      verify-work-team.md
  agents/                    # 4 oversight agents (Phase 10, read-only)
    gsd-oversight-execution.md
    gsd-oversight-planning.md
    gsd-oversight-sync.md
    gsd-oversight-verification.md
  .planning/
    config.json              # Already has teams section (no changes needed)
```

Note: `verify-phase.md` is named `verify-phase` but the team template is named `verify-work-team.md` and the oversight agent is `gsd-oversight-verification.md`. The workflow key in config.json for this workflow is `verify-work`. This naming inconsistency exists already in Phase 10 artifacts -- research found the team template says `workflow: verify-work` and config.json oversight key is `verify-work`. The wiring in Phase 17 must use the consistent name `verify-work` when referencing config.

### Workflow Structure Analysis

Each workflow has a different structure that determines WHERE to insert the teams conditional:

**execute-phase.md** (Step: `execute_waves`):
- Currently: Spawns `gsd-executor` via Task tool for each plan in each wave
- Insertion point: BEFORE the Task tool spawn in `execute_waves` step
- Team mode: Spawn execute-phase-team lead with N executor teammates + gsd-oversight-execution observer
- Fallback: Existing Task tool spawn sequence (no change to current behavior)

**plan-phase.md** (Step: `run_research`):
- Currently: Spawns `gsd-phase-researcher` via Task tool, then `gsd-planner` via Task tool
- Insertion point: At the start of the `run_research` step AND the `spawn_planner` step
- Team mode: Spawn plan-phase-research-team lead with gsd-phase-researcher + gsd-codebase-mapper teammates + gsd-oversight-planning observer; planner spawned after team completes
- Fallback: Existing sequential researcher-then-planner Task spawns (no change)

**upstream-sync.md** (Stage 3.5: SECURITY REVIEW / Stage 4: EXECUTE):
- Currently: Orchestrator-inline analysis (no separate subagents for analysis stages 1-4); only calls subprocess bash commands
- This workflow does NOT use subagent Task spawns for its core work -- the orchestrator does everything inline
- Team mode would apply at Stage 3.5 (security review) as parallel analysis before cherry-pick
- Insertion point: After Stage 3 plan generation, before Stage 3.5 security review
- Fallback: Existing inline analysis (no change -- current behavior IS the fallback)

**verify-phase.md** (Step: `load_context`):
- Currently: Spawns `gsd-verifier` via Task tool (called from execute-phase's `verify_phase_goal` step)
- This workflow IS the subagent; the orchestrator spawns it
- BUT: The workflow itself could optionally spawn oversight as a parallel Task before doing its own work
- Insertion point: After `load_context`, before `establish_must_haves`
- Team mode: Spawn verify-work-team lead with gsd-verifier + platform-verifier + security-verifier teammates + gsd-oversight-verification observer
- Fallback: Existing single-verifier behavior (no change)

### Config-Driven Conditional Pattern

The routing pattern reads `teams.enabled` from config.json and checks the env flag:

```markdown
<teams_integration workflow="WORKFLOW_NAME">
## Team Mode (Optional)

Read team config:
```bash
TEAMS_ENABLED=$(cat .planning/config.json 2>/dev/null | \
  grep -o '"enabled"[[:space:]]*:[[:space:]]*[^,}]*' | \
  head -1 | grep -o 'true\|false' || echo "false")
OVERSIGHT_ENABLED=$(cat .planning/config.json 2>/dev/null | \
  grep -o '"WORKFLOW_NAME"[[:space:]]*:[[:space:]]*[^,}]*' | \
  grep -o 'true\|false' || echo "true")
```

**If `TEAMS_ENABLED=true`:**
1. Verify `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set
   - If not set: warn user and fall through to sequential mode
2. Spawn team lead using WORKFLOW_NAME-team template:
   [team-specific instructions per template]
3. [team-specific task dependencies from template]

**If `TEAMS_ENABLED=false` (default):**
Fall through to existing sequential subagent spawning below.
</teams_integration>
```

### Team Configuration Reference (from team templates, confirmed by direct read)

| Workflow | Team Template | Members | Oversight Agent | Flag Routing |
|----------|---------------|---------|-----------------|--------------|
| execute-phase | execute-phase-team.md | Lead + N executors + 1 oversight (N+2) | gsd-oversight-execution | CRITICAL through lead; WARNING/INFO direct to executor |
| plan-phase | plan-phase-team.md | Lead + researcher + codebase-mapper + 1 oversight (4 total) | gsd-oversight-planning | Direct to planner (not high-stakes) |
| upstream-sync | upstream-sync-team.md | Lead + commit-analyzer + conflict-detector + identity-checker + 1 oversight (5 total) | gsd-oversight-sync | ALL flags through lead (HIGH-STAKES) |
| verify-phase/verify-work | verify-work-team.md | Lead + functional-verifier + platform-verifier + security-verifier + 1 oversight (5 total) | gsd-oversight-verification | Direct to verifier (not high-stakes) |

### Anti-Patterns to Avoid

- **Modifying existing workflow content:** All existing steps should be preserved intact. Only add the teams_integration section; do not alter existing task spawn calls.
- **Requiring teams for operation:** Teams mode is experimental and disabled by default. All workflows must continue working identically when `teams.enabled=false`.
- **Blocking on teams flag:** If env flag is missing when teams are enabled, warn and degrade gracefully to sequential mode -- do not error.
- **Using wrong config key for verify-work:** The config.json oversight key is `verify-work` (not `verify-phase`). Use the correct key when reading from config.
- **Adding TeamCreate/SendMessage calls to the primary flow:** These primitives are experimental. The primary (fallback) flow uses Task tool and MUST remain unchanged.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config reading | Custom JSON parser | Shell grep on config.json | All other workflows in this project already use grep; consistent with existing pattern |
| Team member task assignment | Custom task queue | Reference team template file directly | Team templates already define task dependencies and member roles |
| Flag routing logic | Custom message router | Document routing rules per template | Routing is already documented in team templates and oversight agents; workflow just follows the documented rules |
| Env flag validation | Custom env check | Document requirement to set env flag | Teams fail silently without the flag; document the requirement, don't build complex validation |

## Common Pitfalls

### Pitfall 1: Wrong Insertion Point

**What goes wrong:** The teams integration section is inserted at the wrong point in the workflow, causing teams mode to activate after work has already started (or before prerequisites are ready).

**Why it happens:** Each workflow has a different structure. Casual reading might suggest a generic "before any subagent spawning" rule, but upstream-sync.md does not use subagents for its core work at all.

**How to avoid:** Read each workflow's step structure carefully. For upstream-sync, the insertion point is Stage 3.5 (security review parallel analysis), not a subagent spawn point. For execute-phase, the insertion is at the per-wave spawn point inside `execute_waves`, not at the top of the workflow.

**Warning signs:** Teams integration section placed at top-level workflow header instead of at the specific step where work branches.

### Pitfall 2: Naming Mismatch Between Workflow and Config Key

**What goes wrong:** The workflow file is named `verify-phase.md` but the team template says `workflow: verify-work` and the config.json uses key `verify-work`. Using the wrong name means the config read fails to find the oversight toggle.

**Why it happens:** Phase 10 used `verify-work` as the canonical name in config and team templates, while the workflow file retains its original `verify-phase.md` name.

**How to avoid:** When the verify-phase.md workflow reads the oversight toggle from config.json, use key `verify-work` (the config key), not `verify-phase`.

**Warning signs:** Config read for oversight toggle returns no match, defaulting to `true` silently.

### Pitfall 3: Breaking Existing Tests

**What goes wrong:** Adding team integration content changes file content that is referenced in tests, causing test failures.

**Why it happens:** GSD has 563 tests. Some tests may grep or parse workflow files.

**How to avoid:** Check what existing tests cover the workflow files before making changes. The `teams_integration` section is additive and uses a distinct XML-like tag. Tests checking for existing content should be unaffected.

**Warning signs:** Test count drops below 563 after workflow changes.

### Pitfall 4: upstream-sync.md Misunderstanding

**What goes wrong:** Treating upstream-sync.md like execute-phase.md -- assuming there are subagent Task calls to conditionally replace with team spawning.

**Why it happens:** The research context mentions "upstream-sync" in the list of 4 affected workflows, suggesting a parallel structure with the others.

**How to avoid:** Upstream-sync.md is a self-contained workflow that runs inline (bash commands, no Task tool subagent spawning for core analysis). Its team template defines parallel agents for commit analysis, conflict detection, and branding checks -- tasks that are currently done inline by the orchestrator. Team mode adds these specialized agents as teammates; fallback leaves the inline orchestrator doing the work as before. The integration section describes this split clearly.

**Warning signs:** Attempting to find existing Task tool calls in upstream-sync.md that don't exist.

### Pitfall 5: Config Flag Reads Using Wrong JSON Path

**What goes wrong:** The grep pattern for extracting `teams.enabled` matches the wrong value (e.g., `oversight.default` which is also a boolean in the same object).

**Why it happens:** Config.json nests boolean values and `enabled` appears in both `teams.enabled` and `memory.enabled`.

**How to avoid:** Use specific patterns that include the surrounding context:
```bash
# Correct: anchored to "teams" section by looking at nested structure
python3 -c "import json; c=json.load(open('.planning/config.json')); print(c.get('teams',{}).get('enabled','false'))" 2>/dev/null || echo "false"
```
Or use jq if available. The existing bash grep approach used in other workflow steps (e.g., `model_profile`) may be fragile for nested keys -- use python3 or node for nested JSON extraction.

**Warning signs:** `TEAMS_ENABLED` resolves to wrong value in test scenarios.

## Code Examples

Verified patterns from direct reads of existing files:

### Existing Config Read Pattern (from execute-phase.md)

```bash
# Source: execute-phase.md step "load_project_state"
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | \
  grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | \
  grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")

COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | \
  grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | \
  grep -o 'true\|false' || echo "true")
```

For nested keys (teams.enabled), use python3 for reliability:

```bash
# Recommended pattern for nested JSON keys
TEAMS_ENABLED=$(python3 -c \
  "import json,sys; c=json.load(open('.planning/config.json')); \
   print(str(c.get('teams',{}).get('enabled',False)).lower())" \
  2>/dev/null || echo "false")

OVERSIGHT_ENABLED=$(python3 -c \
  "import json,sys; c=json.load(open('.planning/config.json')); \
   print(str(c.get('teams',{}).get('oversight',{}).get('per_workflow',{}).get('WORKFLOW_KEY',True)).lower())" \
  2>/dev/null || echo "true")
```

### Team Integration Section Structure

```markdown
<teams_integration workflow="execute-phase">
## Team Mode (Optional)

**Check team config:**
```bash
TEAMS_ENABLED=$(python3 -c "import json; c=json.load(open('.planning/config.json')); \
  print(str(c.get('teams',{}).get('enabled',False)).lower())" 2>/dev/null || echo "false")
```

**If `TEAMS_ENABLED=true`:**

Prerequisite: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` must be set in environment or settings.json.
If not set, warn and fall through to sequential mode.

Spawn execute-phase-team lead:
- Load `get-stuff-done/teams/execute-phase-team.md` for team configuration
- Lead role: execute-phase orchestrator (delegate mode)
- Teammates: 1 gsd-executor per plan in current wave (max 6 per soft cap)
- Observer: gsd-oversight-execution (flags requirement drift and security gaps)
- Flag routing: CRITICAL flags through lead; WARNING/INFO direct to executor

Task dependency per wave:
1. All executor teammates in wave run simultaneously
2. Oversight monitors continuously during wave execution
3. All executors complete before next wave begins

**If `TEAMS_ENABLED=false` (default):**

Continue to existing sequential subagent spawning in `execute_waves` step below.
This is the current behavior and requires no changes.
</teams_integration>
```

### Oversight Agent Invocation Reference

The oversight agents are pre-built and do not need to be modified. They are referenced by name from the team templates. When team mode is active, they are spawned as team observers. When team mode is inactive (fallback), oversight is skipped for the current session (verification phase catches issues instead).

From `execute-phase-team.md` (confirmed by direct read):
- Observer name: `gsd-oversight-execution`
- Model: `opus`
- Task: Watch execution for requirement drift, missed deviations, security gaps
- Authority: Flag and advise only, never block

From `plan-phase-team.md`:
- Observer name: `gsd-oversight-planning`
- Model: `opus`
- Task: Watch research quality, flag gaps and assumptions
- Routing: Direct to planner

From `upstream-sync-team.md`:
- Observer name: `gsd-oversight-sync`
- Model: `sonnet`
- Task: Watch for security risks and fork integrity violations
- Routing: ALL flags through lead (HIGH-STAKES workflow)

From `verify-work-team.md`:
- Observer name: `gsd-oversight-verification`
- Model: `opus`
- Task: Watch verification completeness, flag false passes
- Routing: Direct to verifier

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No team templates or oversight | Phase 10 created 4 templates + 4 oversight agents | Phase 10 (Feb 2026) | Infrastructure exists; just not wired |
| Workflows always use sequential subagents | Workflows conditionally use teams when enabled | Phase 17 (this phase) | User can opt-in to experimental team mode |
| Config teams section is orphaned | Workflows read teams.enabled to route execution | Phase 17 (this phase) | Config controls actual behavior |

**Existing (Phase 10) infrastructure confirmed working:**
- 4 team templates at `get-stuff-done/teams/*.md` -- verified by direct read
- 4 oversight agents at `agents/gsd-oversight-*.md` -- verified by direct read
- `config.json` teams section with correct schema -- verified by direct read
- `teams.enabled: false` -- correct default (experimental feature)

## Open Questions

1. **upstream-sync.md team structure at Stage 3.5 vs Stage 4**
   - What we know: Team template defines commit-analyzer, conflict-detector, identity-checker as teammates doing parallel analysis. These are "custom agents" (not named GSD agents like gsd-executor).
   - What's unclear: Should the integration reference these custom agent names, or should it describe the tasks for the team lead to delegate? The team template says "Agent: upstream analyzer (custom agent for upstream commit analysis)" -- these are described by task, not by pre-built agent files.
   - Recommendation: The teams_integration section in upstream-sync.md should reference the team template file and describe what the team lead delegates. The planner should NOT create new agent definition files for these custom roles -- they are described within the team template itself.

2. **verify-phase.md vs verify-work name collision**
   - What we know: The workflow file is `verify-phase.md` but Phase 10 named everything `verify-work`. Config key is `verify-work`.
   - What's unclear: Should Phase 17 rename the workflow file for consistency? Or just use the right config key?
   - Recommendation: Do NOT rename the workflow file -- it would break existing references. Just use the config key `verify-work` when reading from config.json. The naming inconsistency is a pre-existing cosmetic issue.

3. **Whether to add env flag check or just document it**
   - What we know: Teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Without it, TeamCreate calls would fail.
   - What's unclear: Should workflows add a bash check for this env var, or just document the requirement?
   - Recommendation: Add a check that warns and falls back if env flag is missing. Makes the degradation explicit rather than silent.

## Sources

### Primary (HIGH confidence)

- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/get-stuff-done/teams/execute-phase-team.md` -- Team structure, member count, fallback pattern, soft cap
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/get-stuff-done/teams/plan-phase-team.md` -- Team structure, task dependencies, fallback pattern
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/get-stuff-done/teams/upstream-sync-team.md` -- High-stakes flag routing, parallel analysis structure
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/get-stuff-done/teams/verify-work-team.md` -- Parallel verifier structure, oversight role
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/agents/gsd-oversight-execution.md` -- Authority scope, monitoring protocol, flag format, memory location
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/agents/gsd-oversight-planning.md` -- Flag routing (direct to planner), monitoring targets
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/agents/gsd-oversight-sync.md` -- High-stakes all-through-lead routing, protected paths
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/agents/gsd-oversight-verification.md` -- False pass detection, completeness monitoring
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/.planning/config.json` -- teams schema: enabled=false, oversight.default=true, soft_cap=8
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/get-stuff-done/workflows/execute-phase.md` -- Current structure, step names, Task tool spawn pattern
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/get-stuff-done/workflows/plan-phase.md` -- Current structure, research step, planner spawn
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/get-stuff-done/workflows/upstream-sync.md` -- Inline orchestration pattern (no Task tool subagents)
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/get-stuff-done/workflows/verify-phase.md` -- Verifier spawn structure
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/.planning/phases/10-claude-code-adoption/10-RESEARCH.md` -- Agent teams experimental status, known limitations, fallback requirement
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/.planning/phases/10-claude-code-adoption/10-03-PLAN.md` -- Original team template and oversight agent creation decisions
- Direct read: `C:/Users/Destiny/Projects/get-stuff-done/.planning/phases/10-claude-code-adoption/10-04-PLAN.md` -- Original config.json teams section decisions

### Secondary (MEDIUM confidence)

- Phase 10 RESEARCH.md finding: "Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in environment or settings.json. Known limitations: no session resumption with in-process teammates, one team per session, no nested teams." Confirmed as of Feb 2026.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries; all artifacts from Phase 10 verified by direct read
- Architecture: HIGH -- Insertion points derived from direct workflow analysis; naming issues confirmed
- Pitfalls: HIGH -- Derived from concrete structural differences between workflows (upstream-sync inline vs others subagent-based); naming mismatch confirmed by reading both config.json and team template

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (30 days -- teams experimental status may change)

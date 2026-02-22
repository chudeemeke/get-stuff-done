<purpose>
Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean by delegating plan execution to subagents.
</purpose>

<core_principle>
The orchestrator's job is coordination, not execution. Each subagent loads the full execute-plan context itself. Orchestrator discovers plans, analyzes dependencies, groups into waves, spawns agents, handles checkpoints, collects results.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
Read config.json for planning behavior settings.
</required_reading>

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
| gsd-executor | opus | sonnet | sonnet |
| gsd-verifier | sonnet | sonnet | haiku |
| general-purpose | — | — | — |

Store resolved models for use in Task calls below.
</step>

<step name="load_project_state">
Before any operation, read project state:

```bash
cat .planning/STATE.md 2>/dev/null
```

**If file exists:** Parse and internalize:
- Current position (phase, plan, status)
- Accumulated decisions (constraints on this execution)
- Blockers/concerns (things to watch for)

**If file missing but .planning/ exists:**
```
STATE.md missing but planning artifacts exist.
Options:
1. Reconstruct from existing artifacts
2. Continue without project state (may lose accumulated context)
```

**If .planning/ doesn't exist:** Error - project not initialized.

**Load planning config:**

```bash
# Check if planning docs should be committed (default: true)
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
# Auto-detect gitignored (overrides config)
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false
```

Store `COMMIT_PLANNING_DOCS` for use in git operations.
</step>

<step name="validate_phase">
Confirm phase exists and has plans:

```bash
# Match both zero-padded (05-*) and unpadded (5-*) folders
PADDED_PHASE=$(printf "%02d" ${PHASE_ARG} 2>/dev/null || echo "${PHASE_ARG}")
PHASE_DIR=$(ls -d .planning/phases/${PADDED_PHASE}-* .planning/phases/${PHASE_ARG}-* 2>/dev/null | head -1)
if [ -z "$PHASE_DIR" ]; then
  echo "ERROR: No phase directory matching '${PHASE_ARG}'"
  exit 1
fi

PLAN_COUNT=$(ls -1 "$PHASE_DIR"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$PLAN_COUNT" -eq 0 ]; then
  echo "ERROR: No plans found in $PHASE_DIR"
  exit 1
fi
```

Report: "Found {N} plans in {phase_dir}"
</step>

<step name="discover_plans">
List all plans and extract metadata:

```bash
# Get all plans
ls -1 "$PHASE_DIR"/*-PLAN.md 2>/dev/null | sort

# Get completed plans (have SUMMARY.md)
ls -1 "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null | sort
```

For each plan, read frontmatter to extract:
- `wave: N` - Execution wave (pre-computed)
- `autonomous: true/false` - Whether plan has checkpoints
- `gap_closure: true/false` - Whether plan closes gaps from verification/UAT

Build plan inventory:
- Plan path
- Plan ID (e.g., "03-01")
- Wave number
- Autonomous flag
- Gap closure flag
- Completion status (SUMMARY exists = complete)

**Filtering:**
- Skip completed plans (have SUMMARY.md)
- If `--gaps-only` flag: also skip plans where `gap_closure` is not `true`

If all plans filtered out, report "No matching incomplete plans" and exit.
</step>

<step name="group_by_wave">
Read `wave` from each plan's frontmatter and group by wave number:

```bash
# For each plan, extract wave from frontmatter
for plan in $PHASE_DIR/*-PLAN.md; do
  wave=$(grep "^wave:" "$plan" | cut -d: -f2 | tr -d ' ')
  autonomous=$(grep "^autonomous:" "$plan" | cut -d: -f2 | tr -d ' ')
  echo "$plan:$wave:$autonomous"
done
```

**Group plans:**
```
waves = {
  1: [plan-01, plan-02],
  2: [plan-03, plan-04],
  3: [plan-05]
}
```

**No dependency analysis needed.** Wave numbers are pre-computed during `/gsd:plan-phase`.

Report wave structure with context:
```
## Execution Plan

**Phase {X}: {Name}** — {total_plans} plans across {wave_count} waves

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01-01, 01-02 | {from plan objectives} |
| 2 | 01-03 | {from plan objectives} |
| 3 | 01-04 [checkpoint] | {from plan objectives} |

```

The "What it builds" column comes from skimming plan names/objectives. Keep it brief (3-8 words).
</step>

<step name="execute_waves">
Execute each wave in sequence. Autonomous plans within a wave run in parallel.

**For each wave:**

1. **Describe what's being built (BEFORE spawning):**

   Read each plan's `<objective>` section. Extract what's being built and why it matters.

   **Output:**
   ```
   ---

   ## Wave {N}

   **{Plan ID}: {Plan Name}**
   {2-3 sentences: what this builds, key technical approach, why it matters in context}

   **{Plan ID}: {Plan Name}** (if parallel)
   {same format}

   Spawning {count} agent(s)...

   ---
   ```

   **Examples:**
   - Bad: "Executing terrain generation plan"
   - Good: "Procedural terrain generator using Perlin noise — creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."

<teams_integration workflow="execute-phase">
**Config-driven team routing (check before spawning agents):**

```bash
TEAMS_ENABLED=$(python3 -c "import json; c=json.load(open('.planning/config.json')); print(str(c.get('teams',{}).get('enabled',False)).lower())" 2>/dev/null || echo "false")
```

**If `TEAMS_ENABLED=false` (default):** Continue to existing sequential subagent spawning below. No behavior change.

**If `TEAMS_ENABLED=true`:**

Check for the experimental env flag:
```bash
echo "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-missing}"
```

If flag is missing or not set to `1`: Warn and fall through to sequential mode:
```
Warning: teams.enabled=true but CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS is not set.
Falling back to sequential subagent mode.
```

If flag is present (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`):

Check oversight setting for this workflow:
```bash
OVERSIGHT_ENABLED=$(python3 -c "import json; c=json.load(open('.planning/config.json')); print(str(c.get('teams',{}).get('oversight',{}).get('per_workflow',{}).get('execute-phase',True)).lower())" 2>/dev/null || echo "true")
```

Spawn the execute-phase-team using the template at `get-stuff-done/teams/execute-phase-team.md`:
- **Lead role:** execute-phase orchestrator (delegate mode)
- **Teammates:** 1 `gsd-executor` per plan in current wave (max 6 — soft cap of 8 minus lead and oversight)
- **Observer:** 1 `gsd-oversight-execution` (if `OVERSIGHT_ENABLED=true`)
- **Flag routing:** CRITICAL flags through lead; WARNING/INFO flags direct to executor
- **Wave-based execution:** all executors in wave run simultaneously, oversight monitors continuously, all must complete before next wave begins
- When team is active, the team lead handles spawning, monitoring, and result aggregation for this wave; skip to step 3 (Wait for all agents) after team completes

**If soft cap exceeded (more than 6 plans in wave):** Team lead splits wave into batches of 6 and executes sequentially within the team.
</teams_integration>

2. **Read files and spawn all autonomous agents in wave simultaneously:**

   Before spawning, read file contents. The `@` syntax does not work across Task() boundaries - content must be inlined.

   ```bash
   # Read each plan in the wave
   PLAN_CONTENT=$(cat "{plan_path}")
   STATE_CONTENT=$(cat .planning/STATE.md)
   CONFIG_CONTENT=$(cat .planning/config.json 2>/dev/null)
   ```

   Use Task tool with multiple parallel calls. Each agent gets prompt with inlined content:

   ```
   <objective>
   Execute plan {plan_number} of phase {phase_number}-{phase_name}.

   Commit each task atomically. Create SUMMARY.md. Update STATE.md.
   </objective>

   <execution_context>
   @~/.claude/get-stuff-done/workflows/execute-plan.md
   @~/.claude/get-stuff-done/templates/summary.md
   @~/.claude/get-stuff-done/references/checkpoints.md
   @~/.claude/get-stuff-done/references/tdd.md
   </execution_context>

   <context>
   Plan:
   {plan_content}

   Project state:
   {state_content}

   Config (if exists):
   {config_content}
   </context>

   <success_criteria>
   - [ ] All tasks executed
   - [ ] Each task committed individually
   - [ ] SUMMARY.md created in plan directory
   - [ ] STATE.md updated with position and decisions
   </success_criteria>
   ```

2. **Wait for all agents in wave to complete:**

   Task tool blocks until each agent finishes. All parallel agents return together.

3. **Report completion and what was built:**

   For each completed agent:
   - Verify SUMMARY.md exists at expected path
   - Read SUMMARY.md to extract what was built
   - Note any issues or deviations

   **Output:**
   ```
   ---

   ## Wave {N} Complete

   **{Plan ID}: {Plan Name}**
   {What was built — from SUMMARY.md deliverables}
   {Notable deviations or discoveries, if any}

   **{Plan ID}: {Plan Name}** (if parallel)
   {same format}

   {If more waves: brief note on what this enables for next wave}

   ---
   ```

   **Examples:**
   - Bad: "Wave 2 complete. Proceeding to Wave 3."
   - Good: "Terrain system complete — 3 biome types, height-based texturing, physics collision meshes. Vehicle physics (Wave 3) can now reference ground surfaces."

4. **Handle failures:**

   If any agent in wave fails:
   - Report which plan failed and why
   - Ask user: "Continue with remaining waves?" or "Stop execution?"
   - If continue: proceed to next wave (dependent plans may also fail)
   - If stop: exit with partial completion report

5. **Execute checkpoint plans between waves:**

   See `<checkpoint_handling>` for details.

6. **After wave completes, use AskUserQuestion for next wave:**

   If more waves remain:
   - header: "Next Wave"
   - question: "Wave {N} complete. Proceed to wave {N+1}?"
   - multiSelect: false
   - options:
     - label: "Continue (Recommended)"
       description: "Proceed to next wave"
     - label: "Review first"
       description: "Review wave {N} outputs before continuing"
     - label: "Stop here"
       description: "Pause execution, resume later with /gsd:execute-phase"

   If "Continue" → proceed to next wave
   If "Review first" → display wave summary, then offer continue/stop
   If "Stop here" → exit with partial completion report

7. **Proceed to next wave if continuing**

</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` require user interaction.

**Detection:** Check `autonomous` field in frontmatter.

**Execution flow for checkpoint plans:**

1. **Spawn agent for checkpoint plan:**
   ```
   Task(prompt="{subagent-task-prompt}", subagent_type="gsd-executor", model="{executor_model}")
   ```

2. **Agent runs until checkpoint:**
   - Executes auto tasks normally
   - Reaches checkpoint task (e.g., `type="checkpoint:human-verify"` or `type="checkpoint:decision"`) or auth gate
   - Agent returns with structured checkpoint (see checkpoint-return.md template)

3. **Agent return includes (structured format):**
   - Completed Tasks table with commit hashes and files
   - Current task name and blocker
   - Checkpoint type and details for user
   - What's awaited from user

4. **Orchestrator presents checkpoint to user:**

   Extract and display the "Checkpoint Details" and "Awaiting" sections from agent return.

   **For checkpoint:decision tasks:**
   Use AskUserQuestion:
   - header: "Decision"
   - question: [from checkpoint's decision element]
   - multiSelect: false
   - options: Build from checkpoint's options element (max 4):
     - label: "[Option name]"
       description: "[What this choice means]"

   **For checkpoint:human-verify tasks:**
   Present verification steps, then use AskUserQuestion:
   - header: "Verify"
   - question: "Does the verification pass?"
   - multiSelect: false
   - options:
     - label: "Approved"
       description: "Everything works as expected, continue execution"
     - label: "Issues found"
       description: "Describe issues, executor will address them"

   **For checkpoint:human-action tasks:**
   Present manual action needed, wait for confirmation (plain text, not AskUserQuestion)

5. **User responds via AskUserQuestion or plain text**

6. **Spawn continuation agent (NOT resume):**

   Use the continuation-prompt.md template:
   ```
   Task(
     prompt=filled_continuation_template,
     subagent_type="gsd-executor",
     model="{executor_model}"
   )
   ```

   Fill template with:
   - `{completed_tasks_table}`: From agent's checkpoint return
   - `{resume_task_number}`: Current task from checkpoint
   - `{resume_task_name}`: Current task name from checkpoint
   - `{user_response}`: What user provided (from AskUserQuestion or plain text)
   - `{resume_instructions}`: Based on checkpoint type (see continuation-prompt.md)

7. **Continuation agent executes:**
   - Verifies previous commits exist
   - Continues from resume point
   - May hit another checkpoint (repeat from step 4)
   - Or completes plan

8. **Repeat until plan completes or user stops**

**Why fresh agent instead of resume:**
Resume relies on Claude Code's internal serialization which breaks with parallel tool calls.
Fresh agents with explicit state are more reliable and maintain full context.

**Checkpoint in parallel context:**
If a plan in a parallel wave has a checkpoint:
- Spawn as normal
- Agent pauses at checkpoint and returns with structured state
- Other parallel agents may complete while waiting
- Present checkpoint to user using AskUserQuestion
- Spawn continuation agent with user response
- Wait for all agents to finish before next wave

**Tool limitation note:**
AskUserQuestion is only available in foreground (orchestrator) context.
Subagents (gsd-executor) CANNOT use AskUserQuestion.
All checkpoint interactions must be handled by the orchestrator.
</step>

<step name="aggregate_results">
After all waves complete, aggregate results:

```markdown
## Phase {X}: {Name} Execution Complete

**Waves executed:** {N}
**Plans completed:** {M} of {total}

### Wave Summary

| Wave | Plans | Status |
|------|-------|--------|
| 1 | plan-01, plan-02 | ✓ Complete |
| CP | plan-03 | ✓ Verified |
| 2 | plan-04 | ✓ Complete |
| 3 | plan-05 | ✓ Complete |

### Plan Details

1. **03-01**: [one-liner from SUMMARY.md]
2. **03-02**: [one-liner from SUMMARY.md]
...

### Issues Encountered
[Aggregate from all SUMMARYs, or "None"]
```
</step>

<step name="verify_phase_goal">
Verify phase achieved its GOAL, not just completed its TASKS.

**Spawn verifier:**

```
Task(
  prompt="Verify phase {phase_number} goal achievement.

Phase directory: {phase_dir}
Phase goal: {goal from ROADMAP.md}

Check must_haves against actual codebase. Create VERIFICATION.md.
Verify what actually exists in the code.",
  subagent_type="gsd-verifier",
  model="{verifier_model}"
)
```

**Read verification status:**

```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

**Route by status:**

| Status | Action |
|--------|--------|
| `passed` | Continue to update_roadmap |
| `human_needed` | Present items to user, get approval or feedback |
| `gaps_found` | Present gap summary, offer `/gsd:plan-phase {phase} --gaps` |

**If passed:**

Phase goal verified. Proceed to update_roadmap.

**If human_needed:**

```markdown
## ✓ Phase {X}: {Name} — Human Verification Required

All automated checks passed. {N} items need human testing:

### Human Verification Checklist

{Extract from VERIFICATION.md human_verification section}

---

**After testing:**
- "approved" → continue to update_roadmap
- Report issues → will route to gap closure planning
```

If user approves → continue to update_roadmap.
If user reports issues → treat as gaps_found.

**If gaps_found:**

Present gaps and offer next command:

```markdown
## ⚠ Phase {X}: {Name} — Gaps Found

**Score:** {N}/{M} must-haves verified
**Report:** {phase_dir}/{phase}-VERIFICATION.md

### What's Missing

{Extract gap summaries from VERIFICATION.md gaps section}

---

## ▶ Next Up

**Plan gap closure** — create additional plans to complete the phase

`/gsd:plan-phase {X} --gaps`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `cat {phase_dir}/{phase}-VERIFICATION.md` — see full report
- `/gsd:verify-work {X}` — manual testing before planning
```

User runs `/gsd:plan-phase {X} --gaps` which:
1. Reads VERIFICATION.md gaps
2. Creates additional plans (04, 05, etc.) with `gap_closure: true` to close gaps
3. User then runs `/gsd:execute-phase {X} --gaps-only`
4. Execute-phase runs only gap closure plans (04-05)
5. Verifier runs again after new plans complete

User stays in control at each decision point.
</step>

<step name="update_roadmap">
**Mark phase complete and update all tracking files:**

```bash
COMPLETION=$(node ~/.claude/get-stuff-done/bin/gsd-tools.cjs phase complete "${PHASE_NUMBER}")
```

The CLI handles:
- Marking phase checkbox `[x]` with completion date
- Updating Progress table (Status → Complete, date)
- Updating plan count to final
- Advancing STATE.md to next phase
- Updating REQUIREMENTS.md traceability

Extract from result: `next_phase`, `next_phase_name`, `is_last_phase`.

```bash
node ~/.claude/get-stuff-done/bin/gsd-tools.cjs commit "docs(phase-{X}): complete phase execution" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md .planning/phases/{phase_dir}/*-VERIFICATION.md
```
</step>

<step name="offer_next">
**Exception:** If `gaps_found`, the `verify_phase_goal` step already presents the gap-closure path (`/gsd:plan-phase {X} --gaps`). No additional routing needed — skip auto-advance.

**Auto-advance detection:**

1. Parse `--auto` flag from $ARGUMENTS
2. Read `workflow.auto_advance` from config:
   ```bash
   AUTO_CFG=$(node ~/.claude/get-stuff-done/bin/gsd-tools.cjs config-get workflow.auto_advance 2>/dev/null || echo "false")
   ```

**If `--auto` flag present OR `AUTO_CFG` is true (AND verification passed with no gaps):**

```
╔══════════════════════════════════════════╗
║  AUTO-ADVANCING → TRANSITION             ║
║  Phase {X} verified, continuing chain    ║
╚══════════════════════════════════════════╝
```

Execute the transition workflow inline (do NOT use Task — orchestrator context is ~10-15%, transition needs phase completion data already in context):

Read and follow `~/.claude/get-stuff-done/workflows/transition.md`, passing through the `--auto` flag so it propagates to the next phase invocation.

**If neither `--auto` nor `AUTO_CFG` is true:**

The workflow ends. The user runs `/gsd:progress` or invokes the transition workflow manually.
</step>

</process>

<context_efficiency>
Orchestrator: ~10-15% context (frontmatter, spawning, results).
Subagents: Fresh 200k each (full workflow + execution).
No polling (Task blocks). No context bleed.
</context_efficiency>

<failure_handling>
**Subagent fails mid-plan:**
- SUMMARY.md won't exist
- Orchestrator detects missing SUMMARY
- Reports failure, asks user how to proceed

**Dependency chain breaks:**
- Wave 1 plan fails
- Wave 2 plans depending on it will likely fail
- Orchestrator can still attempt them (user choice)
- Or skip dependent plans entirely

**All agents in wave fail:**
- Something systemic (git issues, permissions, etc.)
- Stop execution
- Report for manual investigation

**Checkpoint fails to resolve:**
- User can't approve or provides repeated issues
- Ask: "Skip this plan?" or "Abort phase execution?"
- Record partial progress in STATE.md
</failure_handling>

<resumption>
**Resuming interrupted execution:**

If phase execution was interrupted (context limit, user exit, error):

1. Run `/gsd:execute-phase {phase}` again
2. discover_plans finds completed SUMMARYs
3. Skips completed plans
4. Resumes from first incomplete plan
5. Continues wave-based execution

**STATE.md tracks:**
- Last completed plan
- Current wave
- Any pending checkpoints
</resumption>

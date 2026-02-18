<purpose>
Display the complete GSD command reference. Output ONLY the reference content — no project-specific analysis, git status, or next-step suggestions.
</purpose>

<process>

<step name="output_reference">
Display the following command reference:

## GSD Commands

### Project Lifecycle

| Command | Description | Arguments |
|---------|-------------|-----------|
| `/gsd:new-project` | Initialize new project with deep context | `[--auto]` |
| `/gsd:new-milestone` | Start new milestone cycle | `"[milestone name]"` |
| `/gsd:complete-milestone` | Archive completed milestone | `[version]` |
| `/gsd:audit-milestone` | Audit milestone completion against intent | `[version]` |
| `/gsd:plan-milestone-gaps` | Create phases for audit gaps | |

### Phase Management

| Command | Description | Arguments |
|---------|-------------|-----------|
| `/gsd:plan-phase` | Create execution plans with verification | `[phase] [--research] [--skip-research] [--gaps] [--skip-verify]` |
| `/gsd:execute-phase` | Execute phase plans with wave parallelization | `[phase] [--gaps-only]` |
| `/gsd:discuss-phase` | Gather context through adaptive questioning | `[phase]` |
| `/gsd:list-phase-assumptions` | Surface assumptions before planning | `[phase]` |
| `/gsd:research-phase` | Standalone research for a phase | `[phase]` |
| `/gsd:verify-work` | Conversational UAT testing | `[phase]` |

### Roadmap Operations

| Command | Description | Arguments |
|---------|-------------|-----------|
| `/gsd:add-phase` | Add phase to end of milestone | `<description>` |
| `/gsd:insert-phase` | Insert decimal phase for urgent work | `<after> <description>` |
| `/gsd:remove-phase` | Remove future phase and renumber | `<phase-number>` |
| `/gsd:progress` | Check progress and route to next action | |

### Quick Operations

| Command | Description | Arguments |
|---------|-------------|-----------|
| `/gsd:quick` | Quick task with GSD guarantees | |
| `/gsd:debug` | Systematic debugging with persistent state | |

### Session Management

| Command | Description | Arguments |
|---------|-------------|-----------|
| `/gsd:pause-work` | Create handoff for pausing mid-phase | |
| `/gsd:resume-work` | Resume from previous session | |

### Configuration

| Command | Description | Arguments |
|---------|-------------|-----------|
| `/gsd:settings` | Configure workflow toggles and profile | |
| `/gsd:set-profile` | Switch model profile | `<quality\|balanced\|budget>` |

### Utilities

| Command | Description | Arguments |
|---------|-------------|-----------|
| `/gsd:map-codebase` | Analyze codebase with parallel agents | |
| `/gsd:add-todo` | Capture idea as structured todo | `[description]` |
| `/gsd:check-todos` | List and work on pending todos | `[area]` |
| `/gsd:upstream` | Sync from upstream GSD repository | |
| `/gsd:help` | Show this reference | |
| `/gsd:join-discord` | Join the GSD Discord community | |

### Typical Workflow

```
/gsd:new-project          # Initialize
/gsd:plan-phase 1         # Plan first phase
/gsd:execute-phase 1      # Execute plans
/gsd:verify-work 1        # Test results
/gsd:plan-phase 2         # Continue...
/gsd:complete-milestone    # Ship it
```

### Model Profiles

| Profile | Planning | Checking | Execution | Verification |
|---------|----------|----------|-----------|--------------|
| quality | opus | sonnet | opus | sonnet |
| balanced | opus | sonnet | sonnet | sonnet |
| budget | sonnet | haiku | sonnet | haiku |

Set with: `/gsd:set-profile <quality|balanced|budget>`

</step>

</process>

<success_criteria>
- [ ] Complete command reference displayed
- [ ] No project-specific content added
- [ ] No commentary beyond the reference
</success_criteria>

<purpose>
List all pending todos, allow selection, load full context for the selected todo, and route to appropriate action. Bridge between captured ideas and planned work.
</purpose>

<process>

<step name="scan_todos">
```bash
ls .planning/todos/*.md 2>/dev/null
```

**If no todos:**
```
No pending todos.

To capture ideas: /gsd:add-todo
```
Exit workflow.

Read each todo file's frontmatter to extract: title, area, priority, status, created date.
Filter to status: pending only (skip completed/cancelled).
</step>

<step name="apply_filter">
**If $ARGUMENTS provided:**
Use as area filter. Show only todos matching the area.

```bash
# Filter todos where area matches argument
```

If no matches:
```
No pending todos in area "[filter]".

Available areas: [list unique areas]
All pending todos: /gsd:check-todos
```
</step>

<step name="present_list">
Display todos grouped by area:

```
## Pending Todos ([count])

### [Area 1]
| # | Title | Priority | Created |
|---|-------|----------|---------|
| 1 | [title] | normal | [date] |
| 2 | [title] | high | [date] |

### [Area 2]
| # | Title | Priority | Created |
|---|-------|----------|---------|
| 3 | [title] | normal | [date] |
```

Use AskUserQuestion:
- header: "Todo"
- question: "Which todo to work on?"
- multiSelect: false
- options: (build from list, max 4 -- pick highest priority first)
  - label: "[#]. [Title]"
    description: "[Area] - created [date]"
</step>

<step name="load_context">
Read the selected todo file fully:

```bash
cat ".planning/todos/[selected-file]"
```

Display the full description and context sections.

Check if this todo maps to any existing roadmap phase:

```bash
grep -i "[relevant keywords from todo]" .planning/ROADMAP.md
```

If match found:
```
This may relate to Phase [N]: [Name]
```
</step>

<step name="offer_actions">
Use AskUserQuestion:
- header: "Action"
- question: "What to do with this todo?"
- multiSelect: false
- options:
  - label: "Work on it now"
    description: "Start a /gsd:quick task for this todo"
  - label: "Add to roadmap"
    description: "Create or add to a roadmap phase"
  - label: "Discuss it"
    description: "Brainstorm approach before acting"
  - label: "Dismiss"
    description: "Mark as cancelled -- not needed"

**If "Work on it now":**
```
Starting quick task...

/gsd:quick [todo description]
```
Update todo status to "in_progress".

**If "Add to roadmap":**
Use AskUserQuestion:
- header: "Phase"
- question: "Add to existing phase or create new?"
- multiSelect: false
- options:
  - label: "Existing phase"
    description: "Append to an existing phase's scope"
  - label: "New phase"
    description: "Create a new phase for this work"

If new phase: Route to `/gsd:add-phase [description]`
If existing: Ask which phase, then note in roadmap.
Update todo status to "planned".

**If "Discuss it":**
Present the todo context and wait for conversation.

**If "Dismiss":**
Update todo frontmatter: `status: cancelled`
```
Todo dismissed: [title]
```
</step>

<step name="commit">
If any todo status changed:

Check planning config and commit if enabled:
```bash
git add ".planning/todos/[file]" .planning/STATE.md
git commit -m "docs: update todo - [title] ([new status])"
```
</step>

</process>

<success_criteria>
- [ ] Todos scanned and filtered
- [ ] List presented grouped by area
- [ ] Selected todo loaded with full context
- [ ] Roadmap correlation checked
- [ ] Action offered and executed
- [ ] Todo status updated
- [ ] Git commit if status changed
</success_criteria>

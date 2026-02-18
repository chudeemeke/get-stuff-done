<purpose>
Capture an idea, task, or issue that surfaces during a GSD session as a structured todo for later work. Creates a markdown file in .planning/todos/ with frontmatter metadata.
</purpose>

<process>

<step name="ensure_directory">
```bash
mkdir -p .planning/todos
```
</step>

<step name="extract_content">
**If $ARGUMENTS provided:**
Use arguments as the todo description.

**If no arguments:**
Analyze the current conversation context to extract the idea/task being discussed.

If unclear, use AskUserQuestion:
- header: "Todo"
- question: "What should the todo capture?"
- multiSelect: false
- options:
  - label: "From discussion"
    description: "Extract from what we just discussed"
  - label: "Let me describe"
    description: "I'll type the todo description"

If "Let me describe": Wait for user input.
If "From discussion": Synthesize from recent conversation context.
</step>

<step name="infer_area">
Determine the area/category for the todo:

Check if file paths were recently discussed:
- If paths in `src/domain/` -> area: "domain"
- If paths in `src/infrastructure/` -> area: "infrastructure"
- If paths in `tests/` -> area: "testing"
- If discussion about UI -> area: "ui"
- If discussion about performance -> area: "performance"
- If discussion about docs -> area: "documentation"
- Default: "general"

Check existing areas:
```bash
ls .planning/todos/ 2>/dev/null | grep -v "^$" | sed 's/-.*//' | sort -u
```

If a matching area exists, use it for consistency.
</step>

<step name="check_duplicates">
Scan existing todos for similar content:

```bash
ls .planning/todos/*.md 2>/dev/null
```

Read each file's title/description. If a similar todo exists, warn:

```
Similar todo already exists:
  [filename]: [title]

Still create a new one? (yes/no)
```

If no, exit. If yes, continue.
</step>

<step name="generate_slug">
Create filename from description:
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Prefix with area
- Truncate to 50 chars

Format: `[area]-[slug].md`
Example: `testing-add-e2e-auth-flow.md`
</step>

<step name="create_file">
Write todo file:

```markdown
---
title: [Concise title]
area: [inferred area]
priority: normal
status: pending
created: [ISO date]
source: conversation
---

## Description

[Full description of the todo]

## Context

[Where this came from -- what was being discussed, what triggered the idea]

## Acceptance Criteria

- [ ] [What "done" looks like]
```
</step>

<step name="update_state">
Update STATE.md with note:
```
- Todo captured: [title] ([area]) -- [date]
```
</step>

<step name="commit">
Check planning config:

```bash
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false
```

If commit_docs is true:
```bash
git add ".planning/todos/${FILENAME}" .planning/STATE.md
git commit -m "docs: add todo - ${TITLE}"
```
</step>

<step name="confirm">
```
Todo captured: [title]
Area: [area]
File: .planning/todos/[filename]

To review todos: /gsd:check-todos
```
</step>

</process>

<success_criteria>
- [ ] Directory created if missing
- [ ] Content extracted from arguments or conversation
- [ ] Area inferred from context
- [ ] Duplicates checked
- [ ] Todo file created with frontmatter
- [ ] STATE.md updated
- [ ] Git commit (if commit_docs enabled)
- [ ] Confirmation displayed
</success_criteria>

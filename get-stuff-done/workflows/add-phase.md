<purpose>
Add a new integer phase to the end of the current milestone in the roadmap. Handles phase number calculation, directory creation, slug generation, and roadmap updates.
</purpose>

<process>

<step name="validate_input">
Parse $ARGUMENTS as phase description.

**If no argument:**
```
Error: Description required.

Usage: /gsd:add-phase <description>
Example: /gsd:add-phase "API rate limiting"
```
Exit workflow.
</step>

<step name="load_roadmap">
Read roadmap:

```bash
cat .planning/ROADMAP.md 2>/dev/null
```

**If no roadmap:**
```
Error: No roadmap found. Run /gsd:new-project or /gsd:new-milestone first.
```
Exit workflow.

Parse:
- Current milestone name and version
- All existing phase numbers (integers and decimals)
- Last integer phase number
</step>

<step name="calculate_phase_number">
Find the next sequential integer phase number:

```bash
# Extract all integer phase numbers from roadmap
# Ignore decimal phases (e.g., 72.1)
# Next = max integer + 1
```

Example: If phases 1-11 exist (with 7.1 decimal), next = 12.
</step>

<step name="generate_slug">
Convert description to directory slug:
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Truncate to reasonable length (30 chars)

Example: "API rate limiting" -> "api-rate-limiting"

Phase directory: `.planning/phases/[NN]-[slug]/`
(Zero-pad to 2 digits: 01, 02, ..., 12)
</step>

<step name="create_directory">
Create phase directory:

```bash
PADDED=$(printf "%02d" $NEXT_PHASE)
PHASE_DIR=".planning/phases/${PADDED}-${SLUG}"
mkdir -p "$PHASE_DIR"
```
</step>

<step name="update_roadmap">
Add new phase entry to roadmap under current milestone:

Insert after the last phase entry:
```markdown
- [ ] Phase [N]: [Description] (0 plans)
```

Update the Progress table if one exists.
</step>

<step name="update_state">
Update STATE.md to note the roadmap change:

Add to Accumulated Context / Roadmap Evolution:
```
- Added Phase [N]: [Description] ([date])
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
git add "$PHASE_DIR" .planning/ROADMAP.md .planning/STATE.md
git commit -m "docs: add Phase ${NEXT_PHASE} - ${DESCRIPTION}"
```
</step>

<step name="confirm">
```
Added Phase [N]: [Description]
Directory: .planning/phases/[NN]-[slug]/

Next: /gsd:plan-phase [N]
```
</step>

</process>

<success_criteria>
- [ ] Description parsed from arguments
- [ ] Next integer phase number calculated correctly
- [ ] Phase directory created with slug
- [ ] Roadmap updated with new entry
- [ ] STATE.md updated with roadmap evolution note
- [ ] Git commit (if commit_docs enabled)
- [ ] Confirmation with next step displayed
</success_criteria>

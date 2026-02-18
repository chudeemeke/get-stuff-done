<purpose>
Insert a decimal phase for urgent work discovered mid-milestone. Uses decimal numbering (7.1, 7.2) to preserve logical sequence without renumbering the entire roadmap.
</purpose>

<process>

<step name="validate_input">
Parse $ARGUMENTS as: <after-phase-number> <description>

**If missing arguments:**
```
Error: Requires phase number and description.

Usage: /gsd:insert-phase <after> <description>
Example: /gsd:insert-phase 7 "Security hotfix for auth bypass"
```
Exit workflow.

Validate:
- after-phase-number exists in roadmap
- description is non-empty
</step>

<step name="load_roadmap">
Read roadmap:

```bash
cat .planning/ROADMAP.md
```

Parse all phase entries including existing decimals after the target phase.
</step>

<step name="calculate_decimal">
Find next available decimal for the target phase:

```bash
# Check for existing decimals: 7.1, 7.2, etc.
# Next decimal = max existing decimal + 0.1
# If no decimals exist, use [phase].1
```

Example:
- Phase 7 exists, no decimals -> 7.1
- Phase 7 and 7.1 exist -> 7.2
- Phase 7, 7.1, 7.2 exist -> 7.3
</step>

<step name="generate_slug">
Convert description to directory slug:
- Lowercase, hyphens for spaces, remove special chars
- Truncate to 30 chars

Directory format uses the decimal with hyphen: `.planning/phases/07.1-security-hotfix/`
</step>

<step name="create_directory">
```bash
PHASE_DIR=".planning/phases/${DECIMAL_PHASE}-${SLUG}"
mkdir -p "$PHASE_DIR"
```
</step>

<step name="update_roadmap">
Insert the decimal phase entry in roadmap AFTER its parent integer phase and any existing decimals:

```markdown
- [ ] Phase [N]: [Original name] (X plans)
- [ ] Phase [N.1]: [Existing decimal if any]
- [ ] Phase [N.2]: [New description] (0 plans)    <-- inserted here
- [ ] Phase [N+1]: [Next integer phase]
```

Mark as urgent/inserted if the roadmap supports that notation.
</step>

<step name="update_state">
Update STATE.md:
- Add to Accumulated Context / Roadmap Evolution:
  ```
  - Inserted Phase [N.X]: [Description] (urgent) ([date])
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
git commit -m "docs: insert Phase ${DECIMAL_PHASE} - ${DESCRIPTION}"
```
</step>

<step name="confirm">
```
Inserted Phase [N.X]: [Description]
Directory: .planning/phases/[dir]/

This phase should be planned and executed before Phase [N+1].

Next: /gsd:plan-phase [N.X]
```
</step>

</process>

<success_criteria>
- [ ] Arguments parsed (after-phase + description)
- [ ] Parent phase validated in roadmap
- [ ] Next decimal calculated correctly
- [ ] Phase directory created
- [ ] Roadmap updated with insertion in correct position
- [ ] STATE.md updated with evolution note
- [ ] Git commit (if commit_docs enabled)
- [ ] Confirmation with next step displayed
</success_criteria>

<purpose>
Remove an unstarted future phase from the roadmap and renumber all subsequent phases to maintain a clean, linear sequence. Creates a git commit as historical record of the removal.
</purpose>

<process>

<step name="validate_input">
Parse $ARGUMENTS as phase number.

**If no argument:**
```
Error: Phase number required.

Usage: /gsd:remove-phase <phase-number>
Example: /gsd:remove-phase 8
```
Exit workflow.
</step>

<step name="load_roadmap">
Read roadmap and state:

```bash
cat .planning/ROADMAP.md
cat .planning/STATE.md
```

Parse all phase entries with their numbers, names, and completion status.
</step>

<step name="validate_phase">
**Check phase exists:**
If phase number not found in roadmap:
```
Error: Phase [N] not found in roadmap.

Available phases:
[list from roadmap]
```

**Check phase is removable:**
Check that the phase has no completed plans (no SUMMARY.md files in its directory).

```bash
PADDED=$(printf "%02d" $PHASE_NUM)
PHASE_DIR=$(ls -d .planning/phases/${PADDED}-* 2>/dev/null | head -1)
SUMMARY_COUNT=$(ls "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null | wc -l | tr -d ' ')
```

If SUMMARY_COUNT > 0:
```
Error: Phase [N] has completed work ([X] plans executed).

Only unstarted phases can be removed. To handle completed phases, use /gsd:complete-milestone.
```
Exit workflow.

**Check phase is future:**
If phase is current or past (based on STATE.md current position):
```
Error: Phase [N] is current or already completed.

Only future phases can be removed.
```
Exit workflow.
</step>

<step name="confirm_removal">
Present what will be removed and renumbered:

```
Removing Phase [N]: [Name]

Renumbering:
  Phase [N+1]: [Name] -> Phase [N]
  Phase [N+2]: [Name] -> Phase [N+1]
  ...

Proceed? (yes/no)
```

Wait for user confirmation. If no confirmation, exit.
</step>

<step name="remove_directory">
Remove the phase directory:

```bash
rm -rf "$PHASE_DIR"
```
</step>

<step name="renumber_phases">
Renumber all subsequent integer phases:

For each phase after the removed one:
1. Rename directory: `.planning/phases/[OLD_NN]-[slug]` -> `.planning/phases/[NEW_NN]-[slug]`
2. Update any internal references in plan files if they reference phase numbers

```bash
# For each subsequent phase directory, rename with decremented number
```

**Skip decimal phases** -- they keep their base number reference.
</step>

<step name="update_roadmap">
Rewrite the roadmap with:
- Removed phase entry deleted
- All subsequent phases renumbered
- Progress table updated
</step>

<step name="update_state">
Update STATE.md:
- Adjust current position if needed
- Add to Accumulated Context / Roadmap Evolution:
  ```
  - Removed Phase [N]: [Name] and renumbered [M] phases ([date])
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
git add .planning/
git commit -m "docs: remove Phase [N] ([Name]) and renumber"
```
</step>

<step name="confirm">
```
Removed Phase [N]: [Name]
Renumbered [M] subsequent phases.

Updated: ROADMAP.md, STATE.md
```
</step>

</process>

<success_criteria>
- [ ] Phase number validated
- [ ] Phase confirmed as future and unstarted
- [ ] User confirmed removal
- [ ] Phase directory removed
- [ ] Subsequent phases renumbered (directories and roadmap)
- [ ] ROADMAP.md updated
- [ ] STATE.md updated with evolution note
- [ ] Git commit as historical record
</success_criteria>

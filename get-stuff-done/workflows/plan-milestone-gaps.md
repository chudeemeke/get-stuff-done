<purpose>
Create all phases necessary to close gaps identified by /gsd:audit-milestone. Reads MILESTONE-AUDIT.md, groups gaps into logical phases, creates phase entries in ROADMAP.md, and offers to plan each phase. One command creates all fix phases.
</purpose>

<process>

<step name="load_audit">
Find and read the most recent milestone audit:

```bash
ls -t .planning/v*-MILESTONE-AUDIT.md 2>/dev/null | head -1
```

**If no audit file:**
```
Error: No milestone audit found.

Run /gsd:audit-milestone first to identify gaps.
```
Exit workflow.

Read the audit file and extract:
- All gaps (critical and non-critical)
- Requirements coverage gaps
- Integration issues
- Tech debt items
</step>

<step name="categorize_gaps">
Group gaps into logical categories:

1. **By area:** Group related gaps that can be fixed together
   - Example: All auth-related gaps -> one phase
   - Example: All UI gaps -> one phase

2. **By priority:** Critical gaps before non-critical

3. **By dependency:** Gaps that must be fixed before others

Present proposed grouping:

```
## Gap Closure Plan

Based on audit, [N] gaps need resolution.

### Proposed Phases

| # | Phase | Gaps Covered | Priority |
|---|-------|-------------|----------|
| 1 | [Name] | [gap list] | Critical |
| 2 | [Name] | [gap list] | Critical |
| 3 | [Name] | [gap list] | Non-critical |
```
</step>

<step name="confirm_grouping">
Use AskUserQuestion:
- header: "Phases"
- question: "Accept proposed gap closure phases?"
- multiSelect: false
- options:
  - label: "Accept (Recommended)"
    description: "Create [N] phases as proposed"
  - label: "Adjust"
    description: "Modify grouping before creating"
  - label: "Critical only"
    description: "Only create phases for critical gaps"

If "Adjust": Discuss changes, rebuild grouping.
If "Critical only": Filter to critical gaps only.
</step>

<step name="calculate_phase_numbers">
Find next available phase numbers:

```bash
# Get last phase number from roadmap
cat .planning/ROADMAP.md
```

New phases continue from the last existing phase number.
</step>

<step name="create_phases">
For each gap closure phase:

1. Generate slug from phase name
2. Create directory:
```bash
PADDED=$(printf "%02d" $PHASE_NUM)
mkdir -p ".planning/phases/${PADDED}-${SLUG}"
```

3. Add to ROADMAP.md under current milestone
4. Mark as gap closure in any metadata
</step>

<step name="update_roadmap">
Update ROADMAP.md with all new gap closure phases:

```markdown
### Gap Closure

- [ ] Phase [N]: [Name] (gap closure - [X] gaps)
- [ ] Phase [N+1]: [Name] (gap closure - [Y] gaps)
```

Update Progress table.
</step>

<step name="update_state">
Update STATE.md:
- Position updated to first gap closure phase
- Roadmap Evolution note:
  ```
  - Added [N] gap closure phases ([date]) from milestone audit
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
git add .planning/phases/ .planning/ROADMAP.md .planning/STATE.md
git commit -m "docs: add [N] gap closure phases from milestone audit"
```
</step>

<step name="offer_planning">
```
Created [N] gap closure phases.

| Phase | Name | Gaps |
|-------|------|------|
| [N] | [Name] | [count] |
| [N+1] | [Name] | [count] |

---

## Next Up

**Plan first gap closure phase**

`/gsd:plan-phase [N] --gaps`

---
```
</step>

</process>

<success_criteria>
- [ ] Milestone audit loaded
- [ ] Gaps extracted and categorized
- [ ] Gaps grouped into logical phases
- [ ] User approved phase grouping
- [ ] Phase directories created
- [ ] ROADMAP.md updated with gap closure phases
- [ ] STATE.md updated
- [ ] Git commit (if commit_docs enabled)
- [ ] Next step displayed (/gsd:plan-phase --gaps)
</success_criteria>

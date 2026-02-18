<purpose>
Verify milestone achieved its definition of done. Reads existing VERIFICATION.md files (phases already verified during execute-phase), aggregates tech debt and deferred gaps, then spawns integration checker for cross-phase wiring. Produces MILESTONE-AUDIT.md with pass/fail and gap list.
</purpose>

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
| gsd-integration-checker | sonnet | sonnet | haiku |
</step>

<step name="determine_scope">
Parse $ARGUMENTS for version (optional).

**If version provided:** Use that milestone.
**If no version:** Detect current milestone from ROADMAP.md.

```bash
cat .planning/ROADMAP.md
cat .planning/REQUIREMENTS.md
cat .planning/PROJECT.md
```

Determine which phases belong to this milestone.

Display scope:
```
## Milestone Audit: [version] [name]

Phases in scope: [start]-[end]
```
</step>

<step name="read_verifications">
Read all existing VERIFICATION.md files for milestone phases:

```bash
for dir in .planning/phases/*/; do
  PHASE_NUM=$(basename "$dir" | grep -o '^[0-9]*')
  if [ "$PHASE_NUM" -ge "$START" ] && [ "$PHASE_NUM" -le "$END" ]; then
    cat "$dir"/*-VERIFICATION.md 2>/dev/null
  fi
done
```

For each phase, extract:
- Verification status (passed/gaps_found/human_needed)
- Must-have results
- Gaps found
- Tech debt noted

Also check for phases WITHOUT verification:
```bash
# Phases that were executed but never verified
```
</step>

<step name="aggregate_phase_results">
Build aggregate view:

```
### Phase Results

| Phase | Name | Verified | Must-Haves | Gaps | Tech Debt |
|-------|------|----------|------------|------|-----------|
| 1 | [name] | passed | 5/5 | 0 | 1 |
| 2 | [name] | gaps | 3/4 | 1 | 0 |
| 3 | [name] | not verified | - | - | - |
```

Collect all gaps across phases into a unified list.
Collect all tech debt items.
</step>

<step name="check_requirements_coverage">
Cross-reference REQUIREMENTS.md against completed work:

```bash
cat .planning/REQUIREMENTS.md
```

For each requirement:
- Find which phase(s) address it
- Check if those phases passed verification
- Mark: Covered / Partial / Missing

```
### Requirements Coverage

| ID | Requirement | Phase(s) | Status |
|----|-------------|----------|--------|
| REQ-001 | [desc] | 1, 2 | Covered |
| REQ-002 | [desc] | 3 | Partial |
| REQ-003 | [desc] | - | Missing |

Coverage: [X]/[Y] requirements fully covered ([Z]%)
```
</step>

<step name="run_integration_check">
Spawn integration checker for cross-phase wiring:

```bash
SUMMARIES=""
for dir in .planning/phases/*/; do
  for f in "$dir"/*-SUMMARY.md; do
    [ -f "$f" ] && SUMMARIES="$SUMMARIES\n\n--- $(basename $f) ---\n$(cat $f)"
  done
done
```

```
Task(
  prompt="""
<integration_context>

**Milestone:** {version} {name}
**Phases:** {start}-{end}

**Phase Summaries:**
{summaries}

**Requirements:**
{requirements_content}

</integration_context>

Check cross-phase integration:
1. Do phases connect properly? (outputs of phase N used by phase N+1)
2. Are there orphaned features? (built but not wired)
3. Do end-to-end user flows complete?
4. Are there interface mismatches between phases?

Return structured findings.
""",
  subagent_type="gsd-integration-checker",
  model="{checker_model}",
  description="Integration check for milestone"
)
```
</step>

<step name="create_audit_report">
Write MILESTONE-AUDIT.md:

```markdown
# Milestone Audit: [version] [name]

**Date:** [date]
**Phases:** [start]-[end]
**Status:** [PASS / GAPS FOUND]

## Phase Results

[phase results table from aggregate step]

## Requirements Coverage

[requirements coverage table]

Coverage: [X]/[Y] ([Z]%)

## Integration Check

[results from integration checker]

## Gaps

### Critical (blocks ship)
[list critical gaps if any]

### Non-Critical (can ship with known issues)
[list non-critical gaps if any]

## Tech Debt

[aggregated tech debt from all phases]

## Recommendation

[SHIP / FIX GAPS FIRST / NEEDS MORE WORK]

[If gaps exist:]
Run `/gsd:plan-milestone-gaps` to create fix phases.
```

Write to `.planning/[version]-MILESTONE-AUDIT.md`.
</step>

<step name="commit">
Check planning config:

```bash
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false
```

If commit_docs is true:
```bash
git add ".planning/[version]-MILESTONE-AUDIT.md" .planning/STATE.md
git commit -m "docs: milestone audit for [version]"
```
</step>

<step name="present_results">
Display audit summary:

```
## Milestone Audit: [version] [name]

**Status:** [PASS / GAPS FOUND]
**Requirements:** [X]/[Y] covered ([Z]%)
**Integration:** [pass/issues found]
**Gaps:** [N critical, M non-critical]

Report: .planning/[version]-MILESTONE-AUDIT.md
```

**If PASS:**
```
Milestone ready to ship.

Next: /gsd:complete-milestone
```

**If GAPS FOUND:**
```
Gaps need resolution before shipping.

Next: /gsd:plan-milestone-gaps
```
</step>

</process>

<success_criteria>
- [ ] Milestone scope determined (which phases)
- [ ] All phase VERIFICATION.md files read
- [ ] Phase results aggregated
- [ ] Requirements coverage calculated
- [ ] Integration checker spawned and results collected
- [ ] MILESTONE-AUDIT.md written
- [ ] Git commit (if commit_docs enabled)
- [ ] Clear pass/fail status with next steps
</success_criteria>

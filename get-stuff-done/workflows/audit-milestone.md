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
MUST cross-reference three independent sources for each requirement:

### 5a. Parse REQUIREMENTS.md Traceability Table

Extract all REQ-IDs mapped to milestone phases from the traceability table:
- Requirement ID, description, assigned phase, current status, checked-off state (`[x]` vs `[ ]`)

### 5b. Parse Phase VERIFICATION.md Requirements Tables

For each phase's VERIFICATION.md, extract the expanded requirements table:
- Requirement | Source Plan | Description | Status | Evidence
- Map each entry back to its REQ-ID

### 5c. Extract SUMMARY.md Frontmatter Cross-Check

For each phase's SUMMARY.md, extract `requirements-completed` from YAML frontmatter:
```bash
for summary in .planning/phases/*-*/*-SUMMARY.md; do
  node ~/.claude/get-stuff-done/bin/gsd-tools.cjs summary-extract "$summary" --fields requirements_completed | jq -r '.requirements_completed'
done
```

### 5d. Status Determination Matrix

For each REQ-ID, determine status using all three sources:

| VERIFICATION.md Status | SUMMARY Frontmatter | REQUIREMENTS.md | → Final Status |
|------------------------|---------------------|-----------------|----------------|
| passed                 | listed              | `[x]`           | **satisfied**  |
| passed                 | listed              | `[ ]`           | **satisfied** (update checkbox) |
| passed                 | missing             | any             | **partial** (verify manually) |
| gaps_found             | any                 | any             | **unsatisfied** |
| missing                | listed              | any             | **partial** (verification gap) |
| missing                | missing             | any             | **unsatisfied** |

### 5e. FAIL Gate and Orphan Detection

**REQUIRED:** Any `unsatisfied` requirement MUST force `gaps_found` status on the milestone audit.

**Orphan detection:** Requirements present in REQUIREMENTS.md traceability table but absent from ALL phase VERIFICATION.md files MUST be flagged as orphaned. Orphaned requirements are treated as `unsatisfied` — they were assigned but never verified by any phase.
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

Extract `MILESTONE_REQ_IDS` from REQUIREMENTS.md traceability table — all REQ-IDs assigned to phases in this milestone.

```
Task(
  prompt="""
<integration_context>

**Milestone:** {version} {name}
**Phases:** {start}-{end}

**Phase Summaries:**
{summaries}

**Milestone Requirements:**
{MILESTONE_REQ_IDS — list each REQ-ID with description and assigned phase}

MUST map each integration finding to affected requirement IDs where applicable.

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
- [ ] SUMMARY.md `requirements-completed` frontmatter extracted for each phase
- [ ] REQUIREMENTS.md traceability table parsed for all milestone REQ-IDs
- [ ] 3-source cross-reference completed (VERIFICATION + SUMMARY + traceability)
- [ ] Orphaned requirements detected (in traceability but absent from all VERIFICATIONs)
- [ ] Tech debt and deferred gaps aggregated
- [ ] Integration checker spawned with milestone requirement IDs
- [ ] MILESTONE-AUDIT.md created with structured requirement gap objects
- [ ] FAIL gate enforced — any unsatisfied requirement forces gaps_found status
- [ ] Git commit (if commit_docs enabled)
- [ ] Clear pass/fail status with next steps
</success_criteria>

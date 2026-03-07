---
name: gsd:upstream
description: Sync changes from upstream GSD repository (maintainer workflow)
argument-hint: "[--force-fetch] [--dry-run] [--force] [--category type,...] [--exclude type,...] [--include sha,...] [--exclude-sha sha,...]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Sync commits from glittercowboy/get-shit-done upstream repository, review and select commits to cherry-pick, verify changes don't break functionality, and publish updated package to npm with proper versioning and changelog.

This is a multi-stage workflow designed for fork maintainers to stay synchronized with upstream while preserving fork-specific changes.
</objective>

<process>

## Security Model

The upstream sync workflow enforces a security-first approach:
1. **SHA Validation:** All commit SHAs are validated against allowlist pattern before use
2. **Security Review:** User must review diff and explicitly approve before any cherry-pick executes
3. **Config Re-validation:** JSON/JSON5 config files are re-validated after cherry-picks are applied
4. **Conflict Marker Check:** Publish is blocked if unresolved conflict markers exist

No upstream code is applied to the working tree without explicit user approval.

## Pre-flight Checks

Before initiating sync workflow, verify all prerequisites:

**1. Git working directory clean:**
```bash
git status --short
```
If output is not empty: ERROR - "Working directory has uncommitted changes. Commit or stash changes before syncing."

**2. GitHub authentication:**
```bash
git ls-remote --exit-code git@github.com:chudeemeke/get-stuff-done.git HEAD 2>&1
```
If exit code != 0: Offer to authenticate with `gh auth login`

**3. npm authentication:**
```bash
bun pm whoami 2>/dev/null || npm whoami 2>/dev/null
```
If both fail: Offer to authenticate with `npm login`

**4. Upstream remote configured:**
```bash
git config --get remote.upstream.url
```
If empty: Add upstream remote:
```bash
git remote add upstream https://github.com/glittercowboy/get-shit-done.git
```

## Cache File Initialization

Check if cache file exists at `.planning/sync/cache.json`:
```bash
cat .planning/sync/cache.json 2>/dev/null
```

If missing, create with default structure:
```json
{
  "last_sync": {
    "sha": null,
    "date": null
  },
  "registry": "https://registry.npmjs.org/"
}
```

## Dry-Run Detection

Check if user provided `--dry-run` flag:
- If `--dry-run` appears in user input or `$ARGUMENTS`:
  Set `DRY_RUN=true` in sync_context
- Otherwise: `DRY_RUN=false` (default)

## Selective Sync Flag Detection

Parse category and SHA filter flags from user input or $ARGUMENTS:

- `--category <types>`: Comma-separated list of commit types to include (e.g., feat,fix)
- `--exclude <types>`: Comma-separated list of commit types to exclude (e.g., refactor,docs)
- `--include <shas>`: Comma-separated list of SHAs to force-include regardless of category
- `--exclude-sha <shas>`: Comma-separated list of SHAs to force-exclude
- `--force`: Suppress dependency auto-inclusion -- apply exactly the selected set regardless of detected dependencies. Dependency warnings still appear but are informational, not blocking.

Store as structured fields:
- SYNC_CATEGORIES (comma-separated string or empty)
- SYNC_EXCLUDE_CATEGORIES (comma-separated string or empty)
- SYNC_INCLUDE_SHAS (comma-separated string or empty)
- SYNC_EXCLUDE_SHAS (comma-separated string or empty)
- SYNC_FORCE (true/false -- whether --force was passed)

Examples:
```
/gsd:upstream --category feat,fix         # Only sync features and fixes
/gsd:upstream --exclude refactor,docs     # Sync everything except refactors and docs
/gsd:upstream --category feat --include abc1234  # Sync features + force-include abc1234
/gsd:upstream --exclude-sha def5678       # Sync everything except commit def5678
/gsd:upstream --category fix --force      # Only fixes, skip dependency auto-inclusion
```

## Spawn Workflow (Initial)

After pre-flight checks pass, read cache file and spawn workflow:

```bash
CACHE_CONTENT=$(cat .planning/sync/cache.json)
```

Spawn upstream-sync workflow with Task tool:

```
Task(
  prompt="First, read ~/.claude/get-stuff-done/workflows/upstream-sync.md for workflow instructions.

<sync_context>
resume_stage: 1
dry_run: ${DRY_RUN}
force: ${SYNC_FORCE}
categories: ${SYNC_CATEGORIES}
exclude_categories: ${SYNC_EXCLUDE_CATEGORIES}
include_shas: ${SYNC_INCLUDE_SHAS}
exclude_shas: ${SYNC_EXCLUDE_SHAS}
cache_json: ${CACHE_CONTENT}
</sync_context>",
  subagent_type="general-purpose",
  model="opus",
  description="Upstream sync workflow - Stage 1"
)
```

## Handle Workflow Returns

The workflow returns control via structured stdout output. Parse and handle each return type:

### 1. SYNC COMPLETE
```
## SYNC COMPLETE

**Synced:** {N} commits
**Published:** v{version} to {registry}
**Cache updated:** last_sync.sha = {sha}
```

**Action:** Display success message to user. No continuation needed.

### 2. CHECKPOINT: CHERRY_PICK_SELECTION
```
## CHECKPOINT: CHERRY_PICK_SELECTION

**Commits available since last sync:**
{commit table}

**Options:**
1. Enter commit SHAs (space-separated)
2. Enter "all" to apply all
3. Enter "abort" to cancel
```

**Action:**
1. Present checkpoint to user via AskUserQuestion
2. Collect user response
3. Spawn continuation:
```
Task(
  prompt="First, read ~/.claude/get-stuff-done/workflows/upstream-sync.md.

<sync_context>
resume_stage: 3
user_selection: {user_response}
commit_list: {commits_from_checkpoint}
force: ${SYNC_FORCE}
categories: ${SYNC_CATEGORIES}
exclude_categories: ${SYNC_EXCLUDE_CATEGORIES}
include_shas: ${SYNC_INCLUDE_SHAS}
exclude_shas: ${SYNC_EXCLUDE_SHAS}
cache_json: ${CACHE_CONTENT}
</sync_context>",
  subagent_type="general-purpose",
  model="opus",
  description="Upstream sync workflow - Stage 3 (after commit selection)"
)
```

### 2.5. CHECKPOINT: SECURITY_REVIEW
```
## CHECKPOINT: SECURITY_REVIEW

**Commits to apply:** {N}
**Files changed:** {count}
**Diff statistics:** {stats}
**Security analysis:** {findings}
```

**Action:**
1. Present security review to user via AskUserQuestion
2. If user responds "show-diff": Run `git diff {first_sha}^..{last_sha}` and display output, then re-present checkpoint
3. If user responds "approve": Spawn continuation at Stage 4
4. If user responds "abort": Display abort message, no continuation needed
5. Spawn continuation:
```
Task(
  prompt="First, read ~/.claude/get-stuff-done/workflows/upstream-sync.md.

<sync_context>
resume_stage: 4
security_approved: true
selected_commits: {commits_from_plan}
force: ${SYNC_FORCE}
categories: ${SYNC_CATEGORIES}
exclude_categories: ${SYNC_EXCLUDE_CATEGORIES}
include_shas: ${SYNC_INCLUDE_SHAS}
exclude_shas: ${SYNC_EXCLUDE_SHAS}
cache_json: ${CACHE_CONTENT}
</sync_context>",
  subagent_type="general-purpose",
  model="opus",
  description="Upstream sync workflow - Stage 4 (after security review approval)"
)
```

### 3. CHECKPOINT: VERSION_BUMP
```
## CHECKPOINT: VERSION_BUMP

**Recommended version bump:** {type}
**Current version:** {current}
**New version:** {proposed}
**Generated changelog entries:**
{changelog}

**Options:**
1. Accept recommended ("accept")
2. Custom version (e.g., "1.2.3")
3. Abort ("abort")
```

**Action:**
1. Present checkpoint to user via AskUserQuestion
2. Collect user response (accept, custom version, or abort)
3. Spawn continuation:
```
Task(
  prompt="First, read ~/.claude/get-stuff-done/workflows/upstream-sync.md.

<sync_context>
resume_stage: 6b
version_selection: {user_response}
changelog_entries: {entries_from_checkpoint}
cache_json: ${CACHE_CONTENT}
</sync_context>",
  subagent_type="general-purpose",
  model="opus",
  description="Upstream sync workflow - Stage 6b (after version selection)"
)
```

### 4. SYNC ABORTED
```
## SYNC ABORTED

**Reason:** {reason}
```

**Action:** Display abort reason to user. No continuation needed.

### 5. CONFLICT DETECTED
```
## CONFLICT DETECTED

**Conflicted files:**
{file list}

**Instructions:**
1. Resolve conflicts in files
2. Stage resolved files: `git add {file}`
3. Continue: `git cherry-pick --continue`
```

**Action:**
1. Display conflict information to user
2. Wait for user confirmation they've resolved conflicts
3. Spawn continuation:
```
Task(
  prompt="First, read ~/.claude/get-stuff-done/workflows/upstream-sync.md.

<sync_context>
resume_stage: 4
conflict_resolved: true
remaining_commits: {commits_not_yet_applied}
force: ${SYNC_FORCE}
categories: ${SYNC_CATEGORIES}
exclude_categories: ${SYNC_EXCLUDE_CATEGORIES}
include_shas: ${SYNC_INCLUDE_SHAS}
exclude_shas: ${SYNC_EXCLUDE_SHAS}
cache_json: ${CACHE_CONTENT}
</sync_context>",
  subagent_type="general-purpose",
  model="opus",
  description="Upstream sync workflow - Stage 4 (after conflict resolution)"
)
```

### 5b. CONFLICT ANALYSIS (AI-Assisted)

```
## CHECKPOINT: CONFLICT_ANALYSIS

**Commit:** {sha_short} - {summary}
**Conflicted files:** {count}

{For each conflicted file:}
### {filepath}
**What upstream changed:** {explanation}
**What fork has:** {explanation}
**Why they conflict:** {explanation}
**Suggested resolution:** {explanation}

```
{suggested file content}
```

**Options:**
1. "accept" - Apply suggested resolution for all files
2. "reject" - Skip this commit (git cherry-pick --abort)
3. "edit" - Manual resolution (open files, resolve, then respond "resolved")
```

**Action:**
1. Present conflict analysis to user via AskUserQuestion with the three options (accept/reject/edit)
2. If "accept": Spawn continuation at Stage 4 with conflict_action=accept and the suggested resolutions
3. If "reject": Spawn continuation at Stage 4 with conflict_action=reject
4. If "edit": Tell user to resolve manually, wait for "resolved", then spawn Stage 4 continuation with conflict_resolved=true

Spawn continuation:
```
Task(
  prompt="First, read ~/.claude/get-stuff-done/workflows/upstream-sync.md.

<sync_context>
resume_stage: 4
conflict_action: ${USER_CHOICE}
suggested_resolutions: ${RESOLUTION_DATA}
remaining_commits: {commits_not_yet_applied}
force: ${SYNC_FORCE}
categories: ${SYNC_CATEGORIES}
exclude_categories: ${SYNC_EXCLUDE_CATEGORIES}
include_shas: ${SYNC_INCLUDE_SHAS}
exclude_shas: ${SYNC_EXCLUDE_SHAS}
cache_json: ${CACHE_CONTENT}
</sync_context>",
  subagent_type="general-purpose",
  model="opus",
  description="Upstream sync workflow - Stage 4 (after AI conflict analysis)"
)
```

Note: The CONFLICT_ANALYSIS checkpoint coexists with the existing CONFLICT_DETECTED. The workflow emits CONFLICT_ANALYSIS when AI analysis is available (default behavior). The old CONFLICT_DETECTED handler remains for backward compatibility.

### 6. VERIFICATION FAILED
```
## VERIFICATION FAILED

**Failed checks:**
{validation errors}
**Report:** {path to verification report}
```

**Action:** Display validation failures. User must fix issues before continuing.

### 7. PUBLISH FAILED
```
## PUBLISH FAILED

**Error:** {npm error message}
**Recovery instructions:**
{manual recovery steps}
```

**Action:** Display error and recovery instructions. User can retry after following recovery steps.

### 8. DRY RUN COMPLETE
```
## DRY RUN COMPLETE

**Mode:** Dry run (no changes applied)
**Commits planned:** {N}
**Estimated conflicts:** {M}
```

**Action:** Display dry-run results to user. No continuation needed.

</process>

<success_criteria>
- Pre-flight checks all pass (git clean, GitHub auth, npm auth, upstream remote)
- Workflow spawned with current cache state
- Workflow returns parsed correctly
- Checkpoints presented to user with clear options
- Continuations spawned with correct resume_stage and user responses
- Cache file updated on successful completion
- Dry-run flag detected and passed through to workflow
</success_criteria>

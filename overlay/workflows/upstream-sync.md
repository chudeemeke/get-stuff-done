# Upstream Sync Workflow

<objective>
Orchestrate the 7-stage upstream sync process: fetch, present, plan, execute, verify, publish, finalize.

This workflow is spawned by /gsd:upstream with a sync_context containing:
- resume_stage: Which stage to start at (1 for fresh, 3/4/6b for continuations)
- user_selection: User's commit selection (for Stage 3 continuation)
- version_selection: User's version choice (for Stage 6b continuation)
- cache_json: Last sync state (SHA and timestamp)
- force: Whether --force was passed (suppresses dependency auto-inclusion)
- categories: Comma-separated commit types to include (e.g., "feat,fix")
- exclude_categories: Comma-separated commit types to exclude (e.g., "refactor,docs")
- include_shas: Comma-separated SHAs to force-include regardless of category
- exclude_shas: Comma-separated SHAs to force-exclude
- conflict_action: User's choice for AI conflict resolution (accept/reject/edit)
</objective>

<checkpoint_protocol>
**Return mechanism:** Output checkpoint section to stdout. Orchestrator parses output and handles.

**Format:**
```
## CHECKPOINT: {CHECKPOINT_NAME}

{structured content for user}

**Options:**
{numbered options}

Awaiting selection...
```

**Continuation:** Orchestrator spawns new Task with resume_stage and user response in sync_context.

**Checkpoint types:**
- CHERRY_PICK_SELECTION: User selects which commits to apply (category-grouped when filters active)
- VERSION_BUMP: User approves/modifies version and changelog
- CONFLICT_DETECTED: User must resolve merge conflicts manually (legacy -- replaced by CONFLICT_ANALYSIS)
- CONFLICT_ANALYSIS: AI-analyzed conflict with suggested resolution (accept/reject/edit)
- VERIFICATION_FAILED: Validation errors block publish
- PUBLISH_FAILED: npm publish failed after retries
</checkpoint_protocol>

<stages>

## Stage 1: FETCH

Fetch upstream commits since last sync.

**Entry:** resume_stage = 1 (or missing)

**Process:**

1. Parse sync_context to get last_sync.sha from cache_json
   - If null or missing: Use repository's initial commit as baseline
   - Otherwise: Use the SHA from cache

2. Fetch upstream commits:
   ```bash
   git fetch upstream main 2>&1
   ```
   Check exit code. If fails: Return error with fetch output.

3. Get new commits since last sync:
   ```bash
   git log --oneline --format="%H|%ad|%an|%s" --date=short ${LAST_SHA}..upstream/main
   ```

4. If no commits found:
   ```
   ## SYNC COMPLETE

   **Status:** Already up to date
   **Last sync:** {LAST_SHA}
   **Checked:** upstream/main

   No new commits to sync.
   ```
   Exit workflow.

5. For each commit, get files changed:
   ```bash
   git diff-tree --no-commit-id --name-status -r {SHA}
   ```
   Parse output: status (A/M/D) and file path

6. Build commit_list structure:
   ```
   [
     {
       "sha": "abc123...",
       "sha_short": "abc1234",
       "date": "2024-01-15",
       "author": "glittercowboy",
       "summary": "fix: typo in help text",
       "files_changed": 2,
       "files": ["path/to/file1.md", "path/to/file2.js"]
     },
     ...
   ]
   ```

**Output:** Continue to Stage 2 with commit_list

## Stage 2: PRESENT (Checkpoint)

Present commits to user for selection.

**Entry:** After Stage 1 completes with commits

**Process:**

1. Check if filter fields are present in sync_context (categories, exclude_categories, include_shas, exclude_shas). Determine if filters are active (any non-empty).

2. **If filters are NOT active** (no category/exclude flags): Format commit_list as markdown table (existing behavior):
   ```
   ## CHECKPOINT: CHERRY_PICK_SELECTION

   **Commits available since last sync ({last_sha_short}):**

   | SHA | Date | Author | Summary | Files |
   |-----|------|--------|---------|-------|
   | abc1234 | 2024-01-15 | glittercowboy | fix: typo in help text | 2 |
   | def5678 | 2024-01-14 | glittercowboy | feat: add new command | 5 |
   | ghi9012 | 2024-01-13 | contributor | docs: update README | 1 |

   **Total:** {N} commits available

   **Options:**
   1. Enter commit SHAs to cherry-pick (space-separated short SHAs, e.g., "abc1234 def5678")
   2. Enter "all" to apply all commits in chronological order
   3. Enter "abort" to cancel sync

   Awaiting selection...
   ```

3. **If filters ARE active** (any category/exclude/include/exclude-sha flags provided):

   a. Run sync-preview with filter flags to get categorized view:
      ```bash
      node ~/.claude/get-stuff-done/bin/sync-tools.cjs sync-preview "${LAST_SHA}..upstream/main" --json --category "${categories}" --exclude "${exclude_categories}" --include "${include_shas}" --exclude-sha "${exclude_shas}"
      ```

   b. **AI classification for non-conventional commits:** For any commit in the sync-preview output where `classification.confidence` is "low" or `classification.type` is "other", check sync-manifest.json for a cached classification:
      ```bash
      cat .planning/sync/sync-manifest.json
      ```
      Look for entries matching the commit SHA with non-null `category` and `categorySource` fields.

      If no cache hit: Read the commit's diff (`git show {sha}`) and determine the category by analyzing the actual code changes. Then update sync-manifest.json with the AI-inferred classification:
      ```json
      {
        "category": "{inferred_type}",
        "categoryConfidence": "ai-inferred",
        "categorySource": "ai-inferred"
      }
      ```
      On subsequent runs, the cached classification is reused without re-analysis.

   c. Format category-grouped output:
      ```
      ## CHECKPOINT: CHERRY_PICK_SELECTION

      **Commits available since last sync ({last_sha_short}):**

      **Category filter active:** --category {categories} --exclude {exclude_categories}

      [SELECTED] feat ({N} commits)
      | SHA | Date | Author | Summary |
      |-----|------|--------|---------|
      | abc1234 | 2024-01-15 | author | feat: add feature |
      ...

      [SELECTED] fix ({N} commits)
      | SHA | Date | Author | Summary |
      |-----|------|--------|---------|
      | def4567 | 2024-01-14 | author | fix: resolve bug |
      ...

      [EXCLUDED by filter] refactor ({N} commits)
      | SHA | Date | Author | Summary |
      |-----|------|--------|---------|
      | ghi7890 | 2024-01-13 | author | refactor: cleanup |
      ...

      **Dependencies detected:**
        bcd2345 depends on abc1234 (file-overlap: bin/lib/commands.cjs)

      **Selected:** {N} of {total} commits

      **Options:**
      1. Enter "filtered" to apply the {N} selected commits (default)
      2. Enter "all" to apply all commits regardless of filters
      3. Enter commit SHAs for manual selection (space-separated)
      4. Enter "abort" to cancel sync

      Awaiting selection...
      ```

4. Workflow pauses here. Orchestrator presents to user and spawns continuation at Stage 3.

**Output:** Workflow pauses. Orchestrator handles user input and continuation.

## Stage 3: PLAN

Generate execution plan for selected commits.

**Entry:** resume_stage = 3, user_selection in sync_context

**Process:**

1. Parse user_selection:
   - "abort" → Return `## SYNC ABORTED` with reason "User cancelled"
   - "all" → Use full commit_list from Stage 1
   - "filtered" → Use the filter-selected commits from sync_context. Re-run filterCommitsByCategory via sync-preview --json to get the exact selected set:
     ```bash
     node ~/.claude/get-stuff-done/bin/sync-tools.cjs sync-preview "${LAST_SHA}..upstream/main" --json --category "${categories}" --exclude "${exclude_categories}" --include "${include_shas}" --exclude-sha "${exclude_shas}"
     ```
     Parse the `selected` array from JSON output as the commit list.
   - Space-separated SHAs → Filter commit_list to selected commits only

2. Validate all selected commit SHAs:
   For each SHA provided by the user:
   - Must match `/^[0-9a-f]{7,40}$/i` (7-40 hex chars, allowlist)
   - If ANY SHA fails validation, return error:
     ```
     ## SYNC ABORTED

     **Reason:** Invalid commit SHA format: {invalid_sha}
     SHAs must be 7-40 hexadecimal characters only.
     ```
   - After format validation, verify each SHA exists in the commit_list from Stage 1
   - If SHA not in commit_list: Return error with "SHA {sha} not found in available upstream commits"

   Note: This validation follows the allowlist pattern from src/validation/index.js.
   The executor should use the same regex pattern: /^[0-9a-f]{7,40}$/i

3. Validate selected commits exist in commit_list

3. Sort selected commits chronologically (oldest first for cherry-pick order)

3.5. **AI Semantic Dependency Analysis and Auto-Include (when filters active):**

   Skip this step if no filter fields are present in sync_context (all empty/missing).

   **Step A: Gather deterministic file-overlap dependencies**

   These are already available from the sync-preview --json output (computed in Stage 2). Extract the `dependencies.fileOverlap` array.

   **Step B: AI Semantic Dependency Analysis**

   After the deterministic file-overlap dependencies are computed, perform AI semantic dependency analysis. This detects dependencies that file-overlap cannot catch (e.g., commit B calls a function defined in commit A, but they touch different files).

   For each selected commit, read its diff:
   ```bash
   git show {sha} --stat     # Summary of changes
   git diff {sha}~1 {sha}    # Full diff content
   ```

   For each excluded commit that has file-overlap proximity to selected commits (or touches the same bin/lib/*.cjs modules), also read its diff.

   Analyze the diffs together. For each pair of commits (selected + excluded), determine: does commit B use anything defined, modified, or restructured by commit A? Look for:
   - Function/variable definitions in A that are called/referenced in B
   - Import/require changes in A that B depends on
   - Configuration changes in A that affect B's behavior

   Record semantic dependencies:
   ```
   {
     commit: 'abc1234',
     dependsOn: 'def5678',
     reason: 'abc1234 calls newHelper() which is defined in def5678',
     type: 'semantic',
     crossModule: true  // if commits touch different bin/lib/*.cjs modules
   }
   ```

   Label AI-inferred dependencies clearly as "semantic (AI-inferred)" in output. Keep the analysis focused: "does commit B use anything defined or modified by commit A?" -- not "what are all possible relationships?"

   **Step C: Auto-Include Logic**

   After combining file-overlap and semantic dependencies:

   a. For each selected commit, check if it depends on any excluded commit (from either fileOverlap or semantic analysis).

   b. If a dependency on an excluded commit is found AND `sync_context.force` is NOT true:
      - Auto-include the excluded commit into the selected set
      - Add a warning: `"Auto-including {dep_sha} ({dep_subject}) -- required by {commit_sha}. Use --force to override."`
      - Track auto-included commits separately for display

   c. If `sync_context.force` IS true:
      - Do NOT auto-include the excluded commit
      - Still show the warning but as informational: `"WARNING: {commit_sha} depends on {dep_sha} [EXCLUDED] -- --force active, skipping auto-include"`

   d. After auto-inclusion, re-sort the entire selected set chronologically (oldest first for cherry-pick order). Auto-included commits must be in correct cherry-pick order.

   e. If a large proportion of excluded commits would be auto-included (>50%), show a summary warning:
      `"X of Y excluded commits would be auto-included due to dependencies. Consider including the {category} category."`

   **Step D: Add dependency analysis to plan file**

   If filters were active, include dependency analysis section in the plan file:
   ```markdown
   ## Dependency Analysis

   **File-overlap dependencies:**
   {list from sync-preview --json output}

   **Semantic dependencies (AI-inferred):**
   {list from AI analysis}

   **Auto-included commits:** {count}
   {list of auto-included commits with reasons}

   **Warnings:**
   {any remaining dependency concerns after auto-inclusion}
   ```

4. Create plan directory if missing:
   ```bash
   mkdir -p .planning/sync/plans
   ```

5. Generate plan file at `.planning/sync/plans/{YYYY-MM-DD}-{first_sha_short}.md`:
   ```markdown
   # Upstream Sync Plan

   **Generated:** {ISO timestamp}
   **Commits:** {N} selected
   **From:** upstream/main

   ## Commits to Apply

   | Order | SHA | Date | Author | Summary |
   |-------|-----|------|--------|---------|
   | 1 | abc1234 | 2024-01-13 | glittercowboy | feat: add feature X |
   | 2 | def5678 | 2024-01-14 | glittercowboy | fix: resolve bug Y |
   ...

   ## Expected File Changes

   **Total files affected:** {count}

   {aggregated list of unique files from all selected commits with change types}

   ## Cherry-pick Sequence

   ```bash
   git cherry-pick -x abc1234
   git cherry-pick -x def5678
   ...
   ```
   ```

6. Write plan file to disk

7. Display plan summary to console (not checkpoint, just info):
   ```
   Created sync plan: .planning/sync/plans/{filename}
   {N} commits selected for cherry-pick

   Proceeding to Stage 3.5: SECURITY REVIEW
   ```

8. **Dry-run gate:** If `DRY_RUN` is set to `true` in sync_context (passed from orchestrator when user provides `--dry-run` flag):

   Run sync-preview for the full plan output (pass filter flags through when active):
   ```bash
   # Without filters:
   node ~/.claude/get-stuff-done/bin/sync-tools.cjs sync-preview "${FIRST_SHA}..${LAST_SHA}"

   # With filters active:
   node ~/.claude/get-stuff-done/bin/sync-tools.cjs sync-preview "${FIRST_SHA}..${LAST_SHA}" --category "${categories}" --exclude "${exclude_categories}" --include "${include_shas}" --exclude-sha "${exclude_shas}"
   ```

   Then output dry-run completion notice:
   ```
   ## DRY RUN COMPLETE

   **Mode:** Dry run (no changes applied)
   **Commits planned:** {N}
   **Conflict prediction:** Based on {dataPoints} historical data points, {historicalConflictRate}% conflict rate
   **Estimated conflicts:** {estimatedConflicts} of {N} commits

   No files were modified. No git state changed.
   Re-run without --dry-run to execute the sync.
   ```

   Exit workflow (do NOT continue to Stage 3.5 or beyond).

   If `DRY_RUN` is not set or is `false`, continue to Stage 3.5.

**Output:** Continue to Stage 3.5 with selected_commits list

<teams_integration workflow="upstream-sync">
**Config-driven team routing (check before Stage 3.5 inline analysis):**

```bash
TEAMS_ENABLED=$(python3 -c "import json; c=json.load(open('.planning/config.json')); print(str(c.get('teams',{}).get('enabled',False)).lower())" 2>/dev/null || echo "false")
```

**If `TEAMS_ENABLED=false` (default):** Continue to Stage 3.5 inline analysis below. No behavior change.

**If `TEAMS_ENABLED=true`:**

Check for the experimental env flag:
```bash
echo "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-missing}"
```

If flag is missing or not set to `1`: Warn and fall through to inline analysis:
```
Warning: teams.enabled=true but CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS is not set.
Falling back to inline sequential analysis mode.
```

If flag is present (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`):

Check oversight setting for this workflow:
```bash
OVERSIGHT_ENABLED=$(python3 -c "import json; c=json.load(open('.planning/config.json')); print(str(c.get('teams',{}).get('oversight',{}).get('per_workflow',{}).get('upstream-sync',True)).lower())" 2>/dev/null || echo "true")
```

Spawn the upstream-sync-team using the template at `get-stuff-done/teams/upstream-sync-team.md`:
- **Lead role:** upstream-sync orchestrator (delegate mode)
- **Teammate 1:** `commit-analyzer` (analyzes upstream commits for integration feasibility)
- **Teammate 2:** `conflict-detector` (identifies fork-specific conflicts and protected path violations)
- **Teammate 3:** `identity-checker` (checks branding and naming preservation in cherry-picks)
- **Observer:** `gsd-oversight-sync` (security watcher, if `OVERSIGHT_ENABLED=true`)
- **Flag routing:** ALL flags through lead (HIGH-STAKES workflow per decision FLAG-ROUTING-001)
- **Task flow:** parallel analysis by 3 teammates -> security review by oversight -> lead decides proceed/skip/stop -> continue to Stage 3.5 with team findings as richer input
- In team mode, the parallel analysis replaces what the orchestrator does inline. Stage 3.5 still runs as the formal checkpoint but receives the team's combined analysis rather than performing it inline.
</teams_integration>

## Stage 3.5: SECURITY REVIEW (Checkpoint)

Review diffs of selected commits before executing cherry-picks.

**Entry:** After Stage 3 generates the plan with validated commits

**Filter context:** When filters are active, include filter metadata in the security review checkpoint output:
```
**Filter applied:** {categories} (excluding {excludeCategories})
**Commits to apply:** {N} of {total} (filtered, {M} auto-included)
```

**Process:**

1. Run sync-preview for enhanced diff analysis:
   ```bash
   node ~/.claude/get-stuff-done/bin/sync-tools.cjs sync-preview "${FIRST_SHA}..${LAST_SHA}" --json
   ```

   Parse the JSON output. This provides per-commit:
   - File change stats with [!] markers on sensitive paths (matching branding-map.json protectedPaths)
   - Conflict risk assessment per commit ('none', 'overlap', or 'confirmed')
   - Historical effort estimate

   Also generate the colorized human-readable preview:
   ```bash
   node ~/.claude/get-stuff-done/bin/sync-tools.cjs sync-preview "${FIRST_SHA}..${LAST_SHA}"
   ```

   Include this output in the checkpoint display.

2. Generate the full diff for review:
   ```bash
   git diff {first_selected_sha}^..{last_selected_sha}
   ```

3. Analyze the diff for security concerns:
   - New exec/execSync/spawn calls
   - Changes to package.json dependencies
   - New file operations (fs.write, fs.unlink, fs.rmSync)
   - Changes to hooks or installer code
   - New environment variable reads
   - eval() or Function() usage

4. Output security review checkpoint:
   ```
   ## CHECKPOINT: SECURITY_REVIEW

   **Commits to apply:** {N}
   **Files changed:** {count}
   **Sensitive paths flagged:** {sensitivePathCount} (matching branding-map.json protectedPaths)
   **Conflict risk:** {overlapRiskCount} commits with file overlap, {highRiskCount} confirmed conflicts

   **Effort estimate:** Based on {dataPoints} historical syncs, {historicalConflictRate}% conflict rate
   Estimated {estimatedConflicts} conflicts out of {N} commits

   **Diff statistics (with sensitive path markers):**
   {colorized sync-preview output}

   **Security analysis:**
   {existing security analysis -- exec/spawn/eval/fs patterns}

   **Flagged patterns (if any):**
   - {file}: {description of flagged pattern}

   **Full diff available at:** Run `git diff {first_sha}^..{last_sha}` to view

   **Options:**
   1. Approve and proceed with cherry-pick ("approve")
   2. View full diff for a specific commit ("show-diff {sha}")
   3. Drill down on a sensitive path commit ("detail {sha}")
   4. Abort sync ("abort")

   Awaiting approval...
   ```

5. Workflow pauses. Orchestrator presents to user and spawns continuation at Stage 4.

   Handle interactive options while paused:
   - "show-diff {sha}": Run `git diff --color=always {first_sha}^..{last_sha}` for the full range, display it, then re-present the checkpoint.
   - "detail {sha}": Run `git diff --color=always {sha}^..{sha}` for the specific commit, display it, then re-present the checkpoint.
   - "approve": Continue to Stage 4.
   - "abort": Return `## SYNC ABORTED` with reason "User cancelled at security review".

**Output:** Workflow pauses for user approval. Only proceeds to Stage 4 after explicit "approve" response.

## Stage 4: EXECUTE

Apply cherry-picks sequentially.

**Entry:** After Stage 3.5 approval, or resume_stage = 4 (after conflict resolution)

**Process:**

0. Create rollback checkpoint before executing cherry-picks:
   ```bash
   BATCH_ID=$(date +%Y%m%d-%H%M%S)
   node ~/.claude/get-stuff-done/bin/sync-tools.cjs sync-checkpoint create "${BATCH_ID}"
   ```
   Store BATCH_ID for rollback reference. Skip this step if resume_stage = 4 with conflict_resolved = true (checkpoint already created for this batch).

For each selected commit in chronological order:

1. Attempt cherry-pick:
   ```bash
   git cherry-pick -x {sha} 2>&1
   ```

2. Check exit code:
   - **0 (success):** Continue to step 3
   - **1 (conflict):** Handle conflict (see below)
   - **Other:** Return error with git output

3. Verify no conflict markers in staged files:
   ```bash
   git diff --check HEAD~1 2>&1
   ```
   If conflict markers found: Treat as conflict

4. Display progress:
   ```
   ✓ Cherry-picked {sha_short}: {summary}
   ```

5. Continue to next commit

**Conflict handling (AI-Assisted):**

When cherry-pick exits with status 1:

1. Get list of conflicted files:
   ```bash
   git status --short | grep '^UU\|^AA\|^DD'
   ```

2. **AI Conflict Analysis:** For each conflicted file, gather context:

   ```bash
   # Fork base version (HEAD before conflict)
   git show HEAD:{filepath}

   # Upstream version (what the cherry-picked commit introduces)
   git show {sha}:{filepath}

   # Current file with conflict markers
   cat {filepath}
   ```

3. Read branding-map.json to identify fork identity patterns:
   ```bash
   cat .planning/sync/branding-map.json
   ```

4. Analyze the conflict using Claude's reasoning. For each conflicted file, produce analysis:
   - What upstream changed and why (from upstream diff context)
   - What fork has and why (from fork version)
   - Where they conflict (specific sections)
   - Suggested resolution following the fork identity rule: fork branding (get-stuff-done vs get-shit-done), custom features, and fork config always win. Upstream logic/behavior changes are accepted.

5. Generate suggested resolved file content:
   - Start from upstream's changes (accept their logic/behavior)
   - Replace any upstream branding strings with fork equivalents using branding-map.json patterns
   - Preserve any fork-specific code blocks that upstream doesn't have
   - The suggested content must be CLEAN -- no conflict markers (<<<<<<<, =======, >>>>>>>)

6. Return AI conflict analysis checkpoint:
   ```
   ## CHECKPOINT: CONFLICT_ANALYSIS

   **Commit:** {sha_short} - {summary}
   **Conflicted files:** {count}

   ### {filepath}
   **What upstream changed:** {explanation}
   **What fork has:** {explanation}
   **Why they conflict:** {explanation}
   **Suggested resolution:**
   ```{ext}
   {clean resolved content -- NO conflict markers}
   ```

   **Options:**
   1. "accept" - Apply all suggested resolutions, stage files, and continue
   2. "reject" - Skip this commit entirely (git cherry-pick --abort)
   3. "edit" - Keep conflict markers for manual resolution, respond "resolved" when done

   **Rollback:** `git reset --hard sync-checkpoint-${BATCH_ID}` to restore pre-sync state

   Awaiting resolution...
   ```

7. Handle continuation from orchestrator:
   - `conflict_action = "accept"`:
     a. Write suggested content to each conflicted file
     b. Stage each resolved file: `git add {file}`
     c. Verify no conflict markers remain:
        ```bash
        grep -c '^<<<<<<<' {file}
        ```
        Must return 0 for each file. If markers found, abort accept and fall back to manual edit checkpoint (re-emit CONFLICT_ANALYSIS with error note).
     d. Continue cherry-pick: `git cherry-pick --continue`
     e. Continue with remaining commits

   - `conflict_action = "reject"`:
     a. Run `git cherry-pick --abort`
     b. Skip this commit, continue with remaining commits

   - `conflict_resolved = true` (manual edit from "edit" option):
     a. Continue with remaining commits (same as current behavior)

**Legacy fallback:** If AI analysis cannot be performed for any reason (e.g., file too large, binary file), fall back to the original CONFLICT_DETECTED checkpoint format with manual-only resolution instructions.

**Output:** After all commits successfully applied, continue to Stage 5

## Stage 5: VERIFY

Run verification on changed files.

**Entry:** After Stage 4 completes successfully

**Process:**

1. Count number of actually applied cherry-picked commits:
   ```bash
   # Use actual applied count, not planned count (selective sync may skip commits via reject)
   APPLIED_COUNT=$(git rev-list sync-checkpoint-${BATCH_ID}..HEAD --count)
   N_COMMITS=${APPLIED_COUNT}
   ```
   Note: When selective sync applies fewer commits than planned (e.g., user rejected a conflicted commit), use the actual applied count for HEAD~N calculations, not selected_commits.length.

2. Get list of changed files from cherry-picks:
   ```bash
   git diff --name-only HEAD~${N_COMMITS}..HEAD
   ```

3. Syntax validation by file type:
   - **JSON files:**
     ```bash
     python3 -m json.tool {file} > /dev/null 2>&1
     ```
   - **YAML files:**
     ```bash
     python3 -c "import yaml; yaml.safe_load(open('{file}'))" 2>&1
     ```
   - **JS/TS files:**
     ```bash
     node --check {file} 2>&1
     ```
   - **Markdown files:** Skip (no syntax check needed)

4. If project has tests and they were passing before sync:
   ```bash
   bun test 2>&1 || npm test 2>&1
   ```
   Compare exit code to pre-sync state. If tests now fail: Document in report.

5. Check for conflict markers in all text files:
   ```bash
   grep -rn '^<<<<<<<\|^=======\|^>>>>>>>' . --include='*.md' --include='*.js' --include='*.ts' --include='*.json' --include='*.yaml' --include='*.yml'
   ```
   If found: Return `## VERIFICATION FAILED` with file list

6. Re-validate configuration files if any were modified:
   ```bash
   # Check if any config files were in the changed files
   git diff --name-only HEAD~${N_COMMITS}..HEAD | grep -E '\.json$|\.json5$|config'
   ```

   If config files were changed:
   - For each JSON/JSON5 config file changed:
     ```bash
     node -e "
       const fs = require('fs');
       const JSON5 = require('json5');
       const { validateConfig } = require('./src/config/ConfigSchema');
       try {
         const content = fs.readFileSync('{config_file}', 'utf8');
         const parsed = JSON5.parse(content);
         // Only validate GSD config files (those matching our schema)
         if (parsed.version !== undefined) {
           validateConfig(parsed);
           console.log('PASS: {config_file}');
         } else {
           console.log('SKIP: {config_file} (not a GSD config)');
         }
       } catch (e) {
         console.error('FAIL: {config_file}: ' + e.message);
         process.exit(1);
       }
     "
     ```
   - If any GSD config validation fails: Include in verification report as a failure
   - Add config validation results to the verification report table

7. Create verification report at `.planning/sync/reports/{YYYY-MM-DD}-{first_sha_short}.md`:
   ```markdown
   # Sync Verification Report

   **Generated:** {ISO timestamp}
   **Commits applied:** {N}
   **Files validated:** {count}

   ## Validation Results

   | File | Type | Status | Notes |
   |------|------|--------|-------|
   | package.json | JSON | PASS | Valid JSON syntax |
   | src/file.ts | TypeScript | PASS | Syntax check passed |
   | README.md | Markdown | SKIP | No validation needed |
   ...

   ## Config Re-validation

   | File | Status | Notes |
   |------|--------|-------|
   | .planning/config.json | PASS | Valid GSD config schema |
   | other-config.json | SKIP | Not a GSD config file |

   ## Test Results

   {test output if tests were run, or "No tests configured"}

   ## Skipped Files

   {list of files with unknown types that were not validated}

   ## Summary

   **Passed:** {count}
   **Failed:** {count}
   **Skipped:** {count}
   ```

7. Write report to disk

8. If any validation failures:
   ```
   ## VERIFICATION FAILED

   **Failed checks:** {count}

   **Details:**
   {list of failed validations with error messages}

   **Report:** .planning/sync/reports/{filename}

   Fix the validation errors before publish can proceed.
   ```
   Workflow stops. User must fix errors.

**Output:** If all validations pass, continue to Stage 6

## Stage 6: PUBLISH (Checkpoint)

Version bump, changelog, commit, push, publish.

**Entry:** After Stage 5 completes, or resume_stage = 6b (after version selection)

### Stage 6a - Version Analysis and Checkpoint

**Only run if resume_stage != 6b**

1. Analyze commits to suggest version bump type:
   ```bash
   # Check for BREAKING CHANGE or ! in commit messages
   git log --oneline HEAD~${N_COMMITS}..HEAD | grep -i "BREAKING\|!" && echo "major"

   # Check for feat: prefix
   git log --oneline HEAD~${N_COMMITS}..HEAD | grep -i "^feat\|feat:" && echo "minor"

   # Default to patch
   echo "patch"
   ```

2. Get current version from package.json:
   ```bash
   cat package.json | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/'
   ```

3. Calculate new version based on bump type:
   - major: 1.2.3 → 2.0.0
   - minor: 1.2.3 → 1.3.0
   - patch: 1.2.3 → 1.2.4

4. Generate changelog entries (Keep A Changelog format):
   Parse commit messages by conventional commit prefix:
   ```markdown
   ## [{new_version}] - {YYYY-MM-DD}

   ### Added
   - {list of feat: commits}

   ### Changed
   - {list of refactor:/chore: commits}

   ### Fixed
   - {list of fix: commits}

   ### Other
   - {commits without conventional prefix}
   ```

5. Read registry from cache_json (default: "https://registry.npmjs.org/")

6. Output checkpoint:
   ```
   ## CHECKPOINT: VERSION_BUMP

   **Commits to publish:** {N}
   **Files changed:** {count}

   **Recommended version bump:** {major|minor|patch}
   **Analysis:** {brief explanation of why - e.g., "3 feat commits found"}

   **Current version:** {from package.json}
   **New version:** {calculated}

   **Generated changelog entries:**
   ```
   {Keep A Changelog format entries}
   ```

   **Registry:** {registry URL from cache}

   **Options:**
   1. Accept recommended version (enter "accept")
   2. Enter custom version (e.g., "1.2.3")
   3. Abort publish (enter "abort")

   Awaiting selection...
   ```

7. Workflow pauses. Orchestrator presents to user and spawns continuation at Stage 6b.

### Stage 6b - Execute Publish

**Entry:** resume_stage = 6b, version_selection in sync_context

1. Parse version_selection:
   - "abort" → Return `## SYNC ABORTED` with reason "User cancelled publish"
   - "accept" → Use calculated version from Stage 6a
   - Custom version (e.g., "1.2.3") → Validate semver format, use if valid

2. If custom version provided, validate format:
   ```bash
   echo "{version}" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$'
   ```
   If invalid: Return error and request valid semver

**Execute publish sequence with specific commands:**

3. Update package.json version:
   ```bash
   # Use bun (preferred) or npm
   bun version {new_version} --no-git-tag-version 2>/dev/null || \
   npm version {new_version} --no-git-tag-version 2>&1
   ```

4. Update CHANGELOG.md:
   - Read existing CHANGELOG.md content
   - Find "## [Unreleased]" heading (or insert at top after title if missing)
   - Insert generated changelog entries after Unreleased section
   - Write updated CHANGELOG.md

5. Commit version bump and changelog:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore(release): v{new_version}

   Synced {N} commits from upstream:
   {list first 3 commit summaries, truncated at 50 chars each}"
   ```

6. Push to remote with retry:
   ```bash
   # Attempt 1
   git push origin main 2>&1

   # If fails with network error, retry
   if [ $? -ne 0 ]; then
     sleep 2
     git push origin main 2>&1
   fi

   # If still fails, check error type
   if [ $? -ne 0 ]; then
     # Check if auth error or rejection
     # Return to orchestrator with specific error
   fi
   ```

   On push failure:
   - **Auth error:** Return `## PUBLISH FAILED` - "GitHub push failed: authentication required"
   - **Rejection:** Return `## PUBLISH FAILED` - "Push rejected - remote has changes. Pull and retry."
   - **Network:** Retry up to 3 times with 2s delay

7. Read registry from cache_json and publish with retry logic:
   ```bash
   # Read registry preference from cache (honors user's registry config)
   REGISTRY=$(cat .planning/sync/cache.json 2>/dev/null | grep -o '"last_used"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
   REGISTRY=${REGISTRY:-https://registry.npmjs.org}

   echo "Publishing to registry: $REGISTRY"

   # Attempt 1
   bun publish --access public --registry "$REGISTRY" 2>&1 || npm publish --access public --registry "$REGISTRY" 2>&1
   EXIT_CODE=$?

   if [ $EXIT_CODE -ne 0 ]; then
     echo "Publish attempt 1 failed, retrying in 1s..."
     sleep 1

     # Attempt 2
     bun publish --access public --registry "$REGISTRY" 2>&1 || npm publish --access public --registry "$REGISTRY" 2>&1
     EXIT_CODE=$?

     if [ $EXIT_CODE -ne 0 ]; then
       echo "Publish attempt 2 failed, retrying in 3s..."
       sleep 3

       # Attempt 3
       bun publish --access public --registry "$REGISTRY" 2>&1 || npm publish --access public --registry "$REGISTRY" 2>&1
       EXIT_CODE=$?
     fi
   fi
   ```

   On all attempts failed:
   ```
   ## PUBLISH FAILED

   **Error:** {last error message from npm/bun}

   **State:**
   - Git commit succeeded: v{version}
   - Git push succeeded: main branch updated
   - npm publish FAILED: Package not published

   **Recovery instructions:**
   1. Check npm auth status: `npm whoami`
   2. If not authenticated or expired: `npm login`
   3. Verify registry access: Check https://status.npmjs.org
   4. Retry publish manually: `bun publish --access public`
   5. If manual publish succeeds, tag and push: `git tag v{version} && git push origin v{version}`

   **Note:** Version {version} is committed to git but not published to npm.
   Running `/gsd:upstream` again will detect unpublished version and offer to retry publish only.
   ```

8. Create and push git tag:
   ```bash
   git tag v{new_version}
   git push origin v{new_version} 2>&1
   ```

   If tag push fails: Log warning but don't fail workflow (can be fixed manually)

**Output:** If all succeed, continue to Stage 7

## Stage 7: FINALIZE

Update cache and show summary.

**Entry:** After Stage 6 completes successfully

**Process:**

1. Get the latest cherry-picked commit SHA:
   ```bash
   git log -1 --format="%H" HEAD~${N_COMMITS - 1}
   ```

2. Update .planning/sync/cache.json:
   ```bash
   # Create directory if missing
   mkdir -p .planning/sync

   # Read current cache
   CACHE=$(cat .planning/sync/cache.json 2>/dev/null || echo '{"last_sync":{"sha":null,"date":null},"registry":"https://registry.npmjs.org/"}')

   # Update last_sync fields
   echo "$CACHE" | \
     sed "s/\"sha\": \"[^\"]*\"/\"sha\": \"{latest_cherry_picked_sha}\"/" | \
     sed "s/\"date\": \"[^\"]*\"/\"date\": \"$(date -Iseconds)\"/" > \
     .planning/sync/cache.json.tmp && \
     mv .planning/sync/cache.json.tmp .planning/sync/cache.json
   ```

3. Extract registry from cache for success message

3.5. Clean up checkpoint tags (sync completed successfully):
   ```bash
   node ~/.claude/get-stuff-done/bin/sync-tools.cjs sync-checkpoint cleanup
   ```
   This removes all sync-checkpoint-* tags since the sync succeeded.

4. Build summary of changes:
   - Count commits by type (feat, fix, docs, etc.)
   - List most significant changes (first 5 commits)

5. Return completion:
   ```
   ## SYNC COMPLETE

   **Synced:** {N} commits from upstream (open-gsd/gsd-core)
   **Published:** v{version} to {registry}
   **Cache updated:** last_sync.sha = {sha_short}

   **Summary:**
   - {count} features added
   - {count} bugs fixed
   - {count} docs updated
   - {count} other changes

   **Notable changes:**
   1. {commit1_summary}
   2. {commit2_summary}
   3. {commit3_summary}
   ...

   **Next steps:**
   - Run `/gsd:update` to install v{version} locally
   - Verify the new version works as expected
   - Users will get the update on their next `/gsd:update`
   ```

</stages>

<error_handling>

**Network errors:**
- Auto-retry with exponential backoff (1s, 3s, 5s)
- Max 3 attempts
- If all fail: Return error with recovery instructions

**Authentication errors:**
- Return to orchestrator for user intervention
- No auto-retry (user must authenticate)
- Provide specific command to fix (gh auth login, npm login)

**Conflict errors:**
- Pause workflow immediately
- Perform AI conflict analysis: read both sides, analyze context, generate suggested resolution
- Return `## CHECKPOINT: CONFLICT_ANALYSIS` with analysis, explanation, and suggested resolution
- User chooses: accept (apply AI suggestion), reject (skip commit), or edit (manual resolution)
- If AI analysis fails, fall back to `## CONFLICT DETECTED` with manual-only instructions
- Resume after user response

**Validation failures:**
- Block publish (do not proceed to Stage 6)
- Show validation report path
- User must fix validation errors

**Publish failures:**
- 3 retries with exponential backoff (1s, 3s delays)
- If all fail: Return `## PUBLISH FAILED` with recovery instructions
- Note that git commit/push succeeded (package is ready, just not published)
- User can retry manually or re-run /gsd:upstream

</error_handling>

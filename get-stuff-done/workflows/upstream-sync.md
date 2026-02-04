# Upstream Sync Workflow

<objective>
Orchestrate the 7-stage upstream sync process: fetch, present, plan, execute, verify, publish, finalize.

This workflow is spawned by /gsd:upstream with a sync_context containing:
- resume_stage: Which stage to start at (1 for fresh, 3/4/6b for continuations)
- user_selection: User's commit selection (for Stage 3 continuation)
- version_selection: User's version choice (for Stage 6b continuation)
- cache_json: Last sync state (SHA and timestamp)
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
- CHERRY_PICK_SELECTION: User selects which commits to apply
- VERSION_BUMP: User approves/modifies version and changelog
- CONFLICT_DETECTED: User must resolve merge conflicts manually
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

1. Format commit_list as markdown table

2. Output checkpoint to stdout:
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

3. Workflow pauses here. Orchestrator presents to user and spawns continuation at Stage 3.

**Output:** Workflow pauses. Orchestrator handles user input and continuation.

## Stage 3: PLAN

Generate execution plan for selected commits.

**Entry:** resume_stage = 3, user_selection in sync_context

**Process:**

1. Parse user_selection:
   - "abort" → Return `## SYNC ABORTED` with reason "User cancelled"
   - "all" → Use full commit_list from Stage 1
   - Space-separated SHAs → Filter commit_list to selected commits only

2. Validate selected commits exist in commit_list

3. Sort selected commits chronologically (oldest first for cherry-pick order)

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

   Proceeding to Stage 4: EXECUTE
   ```

**Output:** Continue to Stage 4 with selected_commits list

## Stage 4: EXECUTE

Apply cherry-picks sequentially.

**Entry:** After Stage 3, or resume_stage = 4 (after conflict resolution)

**Process:**

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

**Conflict handling:**

When cherry-pick exits with status 1:

1. Get list of conflicted files:
   ```bash
   git status --short | grep '^UU\|^AA\|^DD'
   ```

2. Return conflict checkpoint:
   ```
   ## CONFLICT DETECTED

   **Commit:** {sha_short} - {summary}

   **Conflicted files:**
   {file list with conflict markers}

   **Instructions:**
   1. Open the conflicted files and resolve the conflicts
   2. Remove conflict markers: <<<<<<<, =======, >>>>>>>
   3. Stage resolved files: `git add {file}`
   4. Continue cherry-pick: `git cherry-pick --continue`
   5. Return to workflow and respond with "resolved"

   Or respond with "abort" to cancel sync (will run `git cherry-pick --abort`)

   Awaiting resolution...
   ```

3. Workflow pauses. After user resolves:
   - If user_response = "resolved": Continue with remaining commits
   - If user_response = "abort": Run `git cherry-pick --abort`, return `## SYNC ABORTED`

**Output:** After all commits successfully applied, continue to Stage 5

</stages>

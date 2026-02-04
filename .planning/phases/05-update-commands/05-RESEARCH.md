# Phase 5: Update Commands - Research

**Researched:** 2026-02-04
**Domain:** Git operations (cherry-pick, remotes), npm publishing, GSD workflow orchestration
**Confidence:** HIGH

## Summary

This phase implements two complementary workflows for maintaining a fork: `/gsd:upstream` (maintainer sync from original GSD) and `/gsd:update` (consumer install of latest fork release). The research reveals that both are established patterns with well-documented tooling, but require careful attention to conflict handling, retry logic, and authentication flows.

**Key technical challenges:**
1. Git cherry-pick workflows have well-known pitfalls around commit duplication and dependency tracking
2. npm publish retry logic needs smart detection for network vs auth vs rate-limit errors
3. Version bump automation from conventional commits is mature but requires fallback for non-conforming commits
4. GSD skill + workflow pattern is already established in the codebase

**Primary recommendation:** Follow established GSD orchestrator pattern (skill file spawns workflow which coordinates existing agents), use git cherry-pick with explicit conflict pausing, implement 3-retry publish with exponential backoff, and leverage conventional commits tooling for version/changelog automation where possible.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| git CLI | 2.x+ | Cherry-pick, remote management, conflict detection | Native git operations, universally available |
| npm CLI | 9.x+ | Package publishing, registry authentication | Industry standard package manager for Node.js |
| bun | 1.x+ | Package publishing (preferred over npm) | Project standard per WoW, faster than npm |
| gh CLI | 2.x+ | GitHub authentication, API operations | Official GitHub CLI, better than manual API calls |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| conventional-changelog | 5.x+ | Changelog generation from commits | If commits follow conventional format |
| semver | 7.x+ | Version parsing and comparison | For version bump logic and comparison |
| AskUserQuestion | built-in | User prompts in Claude Code | All interactive prompts (GSD standard) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| git cherry-pick | git merge | Cherry-pick preserves history, merge creates single commit (loses granularity) |
| npm publish | GitHub Packages | npm is public standard, GitHub Packages requires more setup |
| bun publish | npm publish | bun is project standard (WoW), npm is fallback if bun unavailable |

**Installation:**

No additional npm packages required. All core tools (git, npm/bun, gh) are expected to be installed on developer systems.

## Architecture Patterns

### Recommended Project Structure

```
commands/gsd/
├── upstream.md           # Skill file for /gsd:upstream (orchestrator)
└── update.md             # Skill file for /gsd:update (already exists, needs update)

workflows/
└── upstream-sync.md      # Workflow for upstream sync (coordinates stages)

.planning/sync/
├── cache.json            # Last sync SHA, date, registry preference
├── plans/                # Generated PLAN.md files per sync
│   └── {date}-{sha}.md
├── reports/              # Sync execution reports
│   └── {date}-{sha}.md
└── conflicts/            # Conflict markers and resolution notes (if any)
```

### Pattern 1: GSD Orchestrator + Workflow Pattern

**What:** Skill file in `commands/gsd/` acts as entry point, spawns workflow from `workflows/` which coordinates existing agents.

**When to use:** All GSD commands that require multi-step execution with agent coordination.

**Example:**
```markdown
# commands/gsd/upstream.md
---
name: gsd:upstream
description: Sync changes from upstream GSD repository
---

<objective>
Sync commits from glittercowboy/get-shit-done, allow cherry-pick selection,
verify changes, and publish to npm.
</objective>

<execution_context>
@~/.claude/get-stuff-done/workflows/upstream-sync.md
</execution_context>

<process>
1. Validate environment (git status clean, auth verified)
2. Spawn workflow orchestrator
3. Handle workflow returns (checkpoints, completion, errors)
4. Present results to user
</process>
```

Source: Existing pattern from `/gsd:plan-phase` (commands/gsd/plan-phase.md lines 1-30)

### Pattern 2: Multi-Stage Workflow with Checkpoints

**What:** Workflow breaks complex operation into stages with user checkpoints between stages.

**When to use:** Operations requiring user decisions mid-flow (cherry-pick selection, version bump confirmation, publish approval).

**Example:**
```markdown
# workflows/upstream-sync.md

<process>

<step name="stage_1_fetch">
Fetch upstream commits since last sync.
Present commit summary.
Return checkpoint for user selection.
</step>

<step name="stage_2_plan">
Generate PLAN.md with selected commits.
User reviews plan.
</step>

<step name="stage_3_execute">
Apply cherry-picks via gsd-executor.
Pause on conflicts.
</step>

<step name="stage_4_verify">
Run gsd-verifier on changed files.
Block publish if validation fails.
</step>

<step name="stage_5_publish">
Version bump, changelog, commit, push, publish, tag.
</step>

</process>
```

Source: Workflow pattern from execute-phase.md (lines 286-368, checkpoint_handling)

### Pattern 3: State Persistence in Cache Files

**What:** Store workflow state in `.planning/sync/cache.json` for cross-session resumption and preference memory.

**When to use:** Workflows that need to remember last execution state or user preferences.

**Example:**
```json
{
  "last_sync": {
    "sha": "a1b2c3d4",
    "date": "2026-02-03T21:30:00Z",
    "upstream_url": "https://github.com/glittercowboy/get-shit-done.git"
  },
  "registry": {
    "last_used": "https://registry.npmjs.org",
    "type": "npm"
  }
}
```

Source: Existing pattern from update.md (lines 18-32, VERSION file usage)

### Anti-Patterns to Avoid

- **Don't use git merge for upstream sync:** Cherry-pick preserves individual commit history, merge creates single commit losing granularity (breaks ability to select specific upstream commits)
- **Don't auto-stash dirty working directory:** Requires explicit clean state to prevent silent loss of uncommitted work
- **Don't squash cherry-picked commits:** Preserving upstream commit history aids future syncs and conflict resolution
- **Don't skip conflict detection:** Always check for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) after cherry-pick before continuing
- **Don't use npm/bun programmatically:** Shell out to CLI commands, don't import npm API (version instability, auth complexity)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version bump from commits | Custom commit parser | conventional-changelog or manual analysis with fallback | Conventional commits spec has edge cases (scopes, breaking changes, multi-line) |
| Changelog generation | Custom commit formatter | conventional-changelog or Keep A Changelog template | Standard formats have specific section ordering, version linking |
| Conflict marker detection | Regex search | git diff --check or grep -n '^<<<<<<<' | Git's conflict markers have specific format, git knows how to find them |
| npm retry logic | Custom backoff | Native process retry with sleep | Network errors vs auth errors vs rate limiting need different handling |
| Git remote verification | String parsing git remote -v | git config --get remote.upstream.url | Git config handles edge cases (multiple remotes, fetch vs push URLs) |
| Registry URL validation | URL regex | npm config get registry + URL parsing | Registry URLs have specific format, npm knows valid patterns |

**Key insight:** Git and npm have years of edge case handling. Use their CLIs for complex operations rather than reimplementing logic that seems "simple enough to write ourselves."

## Common Pitfalls

### Pitfall 1: Cherry-Pick Commit Duplication

**What goes wrong:** When cherry-picking commits from upstream, if the same change is later merged, Git sees duplicate commits (different SHAs but same content), leading to confusing history and potential merge conflicts.

**Why it happens:** Cherry-pick creates new commit with new SHA, even though content is identical to original. Later merge brings original commit, causing duplication.

**How to avoid:**
- Document cherry-picked commits with `git cherry-pick -x` flag (adds "cherry picked from commit..." to message)
- Track sync state in cache.json to know what's already been pulled
- Use `git log --cherry-pick --oneline` to detect duplicates before syncing

**Warning signs:**
- Merge conflicts on files that haven't been modified locally
- Identical commit messages with different SHAs in `git log`
- "Already up to date" message when you know upstream has changes

Source: [Git Cherry Pick | Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials/cherry-pick), [Mastering Git Cherry-Pick: Advanced Guide](https://medium.com/@314rate/mastering-git-cherry-pick-advanced-guide-with-real-world-examples-3df3d9f284f5)

### Pitfall 2: Silent Cherry-Pick Dependency Failures

**What goes wrong:** Cherry-picking commit B that depends on earlier commit A (which wasn't cherry-picked) succeeds without conflict but breaks functionality silently.

**Why it happens:** Git only checks file-level conflicts, not logical dependencies between commits. If commit A added a function and commit B calls it, cherry-picking only B will compile but fail at runtime.

**How to avoid:**
- Present commits in chronological order with file change summary (user sees if commit touches new files)
- Show commit graph with dependencies: `git log --graph --oneline`
- Offer "Apply all" option for safe bulk selection
- Verification step after apply (gsd-verifier) catches broken functionality

**Warning signs:**
- Tests pass before cherry-pick, fail after
- Reference errors at runtime for "undefined" functions/variables
- Import statements for modules that don't exist locally

Source: [Git Cherry-Pick Best Practices for Error Resolution](https://binitmishra.medium.com/git-cherry-pick-best-practices-for-error-resolution-aadfcefd8d1b)

### Pitfall 3: npm Publish Rate Limiting vs Auth Failures

**What goes wrong:** npm publish fails with 403 error. Retry logic assumes auth failure and prompts user to login, but real cause was rate limiting (too many publish requests too quickly).

**Why it happens:** 403 is used for both "unauthorized" and "rate limited" by npm registry. Naive retry logic can't distinguish.

**How to avoid:**
- Parse npm publish error message for specific text ("rate limit" vs "authentication")
- Implement exponential backoff (1s, 3s, 5s delays) for retries
- Max 3 retry attempts before requiring user intervention
- Different handling: network errors (auto-retry), auth errors (prompt), rate limiting (backoff)

**Warning signs:**
- 403 errors when you know npm login was successful
- Errors appear when publishing multiple packages in quick succession
- Error message contains "too many requests" or "rate limit"

Source: [lerna publish should handle retry 403s better](https://github.com/lerna/lerna/issues/2259), [Node.js Advanced Patterns: Implementing Robust Retry Logic](https://v-checha.medium.com/advanced-node-js-patterns-implementing-robust-retry-logic-656cf70f8ee9)

### Pitfall 4: Merge Conflict Markers Left in Published Code

**What goes wrong:** Cherry-pick creates conflict, user manually resolves but misses removing conflict markers, code with `<<<<<<<` markers gets committed and published.

**Why it happens:** Manual conflict resolution is error-prone. Easy to remove markers in one file but miss them in another file with conflicts.

**How to avoid:**
- After manual resolution, run `git diff --check` (detects conflict markers and whitespace errors)
- Alternative: `grep -rn '^<<<<<<<' .` to find all conflict markers in repo
- Block commit if markers found: pre-commit hook or manual verification step
- Verification step (gsd-verifier) checks for conflict markers before publish

**Warning signs:**
- Syntax errors in files that were manually edited during conflict resolution
- Linter errors about unexpected symbols
- grep finds `<<<<<<<`, `=======`, or `>>>>>>>` in tracked files

Source: [How to Resolve Merge Conflicts in Git?](https://www.atlassian.com/git/tutorials/using-branches/merge-conflicts), [Detect git Conflict Markers](https://ardalis.com/detect-git-conflict-markers/)

### Pitfall 5: Authentication State Mismatch (GitHub vs npm)

**What goes wrong:** User is authenticated to GitHub (can push) but not to npm (can't publish), or vice versa. Workflow fails mid-publish after successful git operations.

**Why it happens:** GitHub and npm use separate auth systems (SSH key or gh CLI for GitHub, npm login token for npm). User may have configured one but not the other.

**How to avoid:**
- Verify BOTH auth states at workflow start (fail early, not after git push)
- GitHub: `git ls-remote --exit-code <url>` OR `gh auth status`
- npm: `npm whoami` OR `bun pm whoami` (for bun publish)
- If either missing: prompt user to authenticate, wait, verify again
- Log which auth method detected (SSH vs HTTPS for GitHub, registry URL for npm)

**Warning signs:**
- `git push` succeeds but `npm publish` fails with 401/403
- `npm whoami` returns error but GitHub operations work fine
- Error: "authentication required" after earlier operations succeeded

Source: [npm package registry authentication token management](https://docs.npmjs.com/about-access-tokens/), [Working with the npm registry - GitHub Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

## Code Examples

Verified patterns from official sources and existing GSD codebase:

### Cherry-Pick with Conflict Detection

```bash
# Source: Git official docs + GSD context (cherry-pick workflow)
# https://git-scm.com/docs/git-cherry-pick

# Add upstream remote if missing
if ! git config --get remote.upstream.url >/dev/null 2>&1; then
  git remote add upstream https://github.com/glittercowboy/get-shit-done.git
fi

# Fetch upstream commits
git fetch upstream main

# Get commits since last sync
LAST_SYNC_SHA=$(cat .planning/sync/cache.json 2>/dev/null | grep -o '"sha"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
git log --oneline "${LAST_SYNC_SHA}..upstream/main"

# Cherry-pick with history preservation
git cherry-pick -x <commit-sha>

# Check for conflicts
if [ $? -ne 0 ]; then
  echo "Conflict detected. Showing conflicted files:"
  git status --short | grep '^UU'

  # Pause workflow, return to user for manual resolution
  echo "## CHECKPOINT: CONFLICT"
  echo "Resolve conflicts, then run: git cherry-pick --continue"
  exit 1
fi

# Verify no conflict markers left behind
if git diff --check HEAD~1; then
  echo "No conflict markers found. Safe to continue."
else
  echo "ERROR: Conflict markers detected in:"
  git diff --check HEAD~1
  exit 1
fi
```

### npm Publish with Smart Retry Logic

```bash
# Source: Node.js retry patterns + npm auth best practices
# https://v-checha.medium.com/advanced-node-js-patterns-implementing-robust-retry-logic-656cf70f8ee9
# https://docs.npmjs.com/creating-and-viewing-access-tokens/

# Verify npm authentication before attempting publish
if ! bun pm whoami >/dev/null 2>&1; then
  echo "ERROR: Not authenticated to npm registry"
  echo "Run: npm login"
  exit 1
fi

# Publish with retry logic
publish_with_retry() {
  local max_attempts=3
  local attempt=1
  local backoff_delays=(1 3 5)  # seconds

  while [ $attempt -le $max_attempts ]; do
    echo "Publish attempt $attempt of $max_attempts..."

    # Try publish (prefer bun, fallback to npm)
    if command -v bun >/dev/null 2>&1; then
      output=$(bun publish 2>&1)
    else
      output=$(npm publish 2>&1)
    fi

    if [ $? -eq 0 ]; then
      echo "Publish successful"
      return 0
    fi

    # Parse error type
    if echo "$output" | grep -qi "rate limit\|too many requests"; then
      echo "Rate limited. Waiting before retry..."
      sleep ${backoff_delays[$((attempt-1))]}
    elif echo "$output" | grep -qi "authentication\|unauthorized\|401\|403"; then
      echo "ERROR: Authentication failure"
      echo "$output"
      return 1  # Don't retry auth errors
    else
      # Network or other transient error
      echo "Network error. Retrying..."
      sleep ${backoff_delays[$((attempt-1))]}
    fi

    attempt=$((attempt + 1))
  done

  echo "ERROR: Publish failed after $max_attempts attempts"
  return 1
}

publish_with_retry
```

### Version Bump from Conventional Commits

```bash
# Source: Conventional Commits spec + semantic versioning automation
# https://www.conventionalcommits.org/en/v1.0.0/
# https://oneuptime.com/blog/post/2026-01-25-semantic-versioning-automation/view

# Get commits since last publish
LAST_VERSION=$(cat package.json | grep '"version"' | cut -d'"' -f4)
LAST_TAG="v${LAST_VERSION}"

# Analyze commits for version bump
analyze_version_bump() {
  local commits=$(git log --oneline "${LAST_TAG}..HEAD")

  # Check for BREAKING CHANGE (major bump)
  if echo "$commits" | grep -qi "BREAKING CHANGE\|!:"; then
    echo "major"
    return
  fi

  # Check for feat: (minor bump)
  if echo "$commits" | grep -q "^[a-f0-9]\\+ feat"; then
    echo "minor"
    return
  fi

  # Check for fix: (patch bump)
  if echo "$commits" | grep -q "^[a-f0-9]\\+ fix"; then
    echo "patch"
    return
  fi

  # No conventional commits found
  echo "unknown"
}

BUMP_TYPE=$(analyze_version_bump)

if [ "$BUMP_TYPE" = "unknown" ]; then
  echo "WARNING: Commits don't follow conventional format"
  echo "Commits since ${LAST_TAG}:"
  git log --oneline "${LAST_TAG}..HEAD"
  echo ""
  echo "Suggested version bump (choose one):"
  echo "  major - Breaking changes"
  echo "  minor - New features"
  echo "  patch - Bug fixes"
  # Use AskUserQuestion tool here for user selection
else
  echo "Recommended version bump: ${BUMP_TYPE}"
  echo "Based on conventional commit analysis"
  # Show for user confirmation via AskUserQuestion
fi
```

### Git Remote Management

```bash
# Source: Git official docs + GitHub fork workflow best practices
# https://git-scm.com/docs/git-remote
# https://www.atlassian.com/git/tutorials/git-forks-and-upstreams

# Check if upstream remote exists
check_upstream_remote() {
  local upstream_url=$(git config --get remote.upstream.url 2>/dev/null)

  if [ -n "$upstream_url" ]; then
    echo "Upstream remote exists: $upstream_url"
    return 0
  else
    echo "No upstream remote configured"
    return 1
  fi
}

# Add upstream remote if missing
if ! check_upstream_remote; then
  echo "Adding upstream remote..."
  git remote add upstream https://github.com/glittercowboy/get-shit-done.git
  echo "Upstream remote added"
fi

# Verify remote URLs (origin vs upstream)
echo "Git remotes:"
echo "  origin: $(git config --get remote.origin.url)"
echo "  upstream: $(git config --get remote.upstream.url)"

# Fetch from upstream
git fetch upstream main --dry-run  # Verify connectivity first
git fetch upstream main
```

### Checkpoint Return Format (GSD Pattern)

```markdown
<!-- Source: GSD workflow pattern from execute-phase.md lines 301-313 -->

## CHECKPOINT: CHERRY_PICK_SELECTION

**Workflow:** upstream-sync
**Stage:** 2 of 7 (Commit Selection)

### Commits Available

Found 5 new commits since last sync (a1b2c3d):

| SHA | Date | Author | Summary | Files Changed |
|-----|------|--------|---------|---------------|
| e5f6g7h | 2026-02-01 | TACHES | feat: add new skill template | 2 files (+45, -0) |
| d4e5f6g | 2026-01-28 | TACHES | fix: correct statusline padding | 1 file (+3, -2) |
| c3d4e5f | 2026-01-25 | TACHES | docs: update README examples | 1 file (+12, -5) |

### Awaiting User Selection

Select commits to cherry-pick:
1. Enter commit SHAs (space-separated)
2. Enter "all" to apply all commits
3. Enter "abort" to cancel sync

**Recommendation:** Review each commit's file changes. Apply "all" if no conflicts expected.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm access tokens (legacy) | Granular access tokens with scopes | Nov 2025 | Must use granular tokens, legacy removed |
| Manual changelog editing | Auto-generation from conventional commits | Ongoing (2020+) | Requires commit discipline or manual fallback |
| git merge for upstream sync | git cherry-pick for selective sync | Industry standard | Preserves history, enables commit selection |
| Hardcoded retry delays | Exponential backoff with jitter | 2023+ | Better handling of rate limiting and network issues |
| Shell aliases for git workflows | gh CLI for GitHub operations | 2020+ | Better auth handling, API access |

**Deprecated/outdated:**
- `npm access tokens (legacy)`: Removed Nov 2025, must use granular tokens with package/scope limits
- `git rebase -i` for cherry-pick workflows: Still works but more complex than `git cherry-pick` for fork sync use case
- Manual .npmrc token management: Prefer `npm login` or trusted publishing (OIDC) for CI/CD

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal sync frequency**
   - What we know: Can sync on-demand via `/gsd:upstream`, no automation
   - What's unclear: Should there be a recommended cadence (weekly, monthly, on-release)?
   - Recommendation: Start with on-demand only. Add statusline indicator if upstream is >30 days ahead.

2. **Handling non-conventional commits from upstream**
   - What we know: conventional-changelog requires `feat:`, `fix:`, `BREAKING:` format
   - What's unclear: glittercowboy/get-shit-done may not follow conventional commits consistently
   - Recommendation: Implement fallback to manual version selection if commit analysis returns "unknown"

3. **Multiple registry support priority**
   - What we know: Can publish to npm, GitHub Packages, or custom registry
   - What's unclear: Is GitHub Packages likely to be used, or is this theoretical?
   - Recommendation: Implement registry selection with default to public npm. Test GitHub Packages if user requests it.

4. **Conflict resolution UX**
   - What we know: Pause workflow, show conflicted files, wait for manual resolution
   - What's unclear: Should workflow show diff output inline, or expect user to use `git diff`?
   - Recommendation: Show file list only. Power users prefer their own diff tools. Provide command suggestions.

## Sources

### Primary (HIGH confidence)

- [Git Cherry Pick | Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials/cherry-pick)
- [Git - git-cherry-pick Documentation](https://git-scm.com/docs/git-cherry-pick)
- [Git - Working with Remotes](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [About access tokens | npm Docs](https://docs.npmjs.com/about-access-tokens/)
- [Working with the npm registry - GitHub Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [How to Resolve Merge Conflicts in Git? | Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials/using-branches/merge-conflicts)

### Secondary (MEDIUM confidence)

- [Mastering Git Cherry-Pick: Advanced Guide with Real-World Examples](https://medium.com/@314rate/mastering-git-cherry-pick-advanced-guide-with-real-world-examples-3df3d9f284f5)
- [Node.js Advanced Patterns: Implementing Robust Retry Logic](https://v-checha.medium.com/advanced-node-js-patterns-implementing-robust-retry-logic-656cf70f8ee9)
- [How to Implement Semantic Versioning Automation](https://oneuptime.com/blog/post/2026-01-25-semantic-versioning-automation/view)
- [Git Upstreams and Forks: A Complete How-To | Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials/git-forks-and-upstreams)
- [conventional-changelog/conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)

### Tertiary (GSD codebase patterns - HIGH confidence for internal patterns)

- GSD skill pattern: `commands/gsd/plan-phase.md` (lines 1-30)
- GSD workflow pattern: `~/.claude/get-stuff-done/workflows/execute-phase.md` (lines 1-597)
- GSD checkpoint pattern: `~/.claude/get-stuff-done/workflows/execute-phase.md` (lines 286-368)
- Existing update.md: `commands/gsd/update.md` (lines 1-173)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are industry standard with official documentation
- Architecture: HIGH - GSD patterns verified from existing codebase
- Pitfalls: HIGH - All pitfalls sourced from official docs or well-documented community issues
- Code examples: HIGH - Patterns verified against official git/npm docs and existing GSD code

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain, git/npm fundamentals don't change rapidly)

**Key assumptions:**
- User has git 2.x+, npm 9.x+ or bun 1.x+, gh CLI installed
- User will manually resolve merge conflicts (no automated merge strategies)
- Conventional commits are aspirational (implement with fallback for non-conforming)
- Single maintainer workflow (no multi-user sync coordination needed)

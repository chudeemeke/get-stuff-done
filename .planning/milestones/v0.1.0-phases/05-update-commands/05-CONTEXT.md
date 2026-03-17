# Phase 5: Update Commands - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Two commands for maintaining the GSD fork:
- `/gsd:upstream` — Maintainer workflow: sync from original GSD, cherry-pick changes, verify, publish
- `/gsd:update` — Consumer workflow: check for new fork version, install it

The commands use existing GSD agents (gsd-executor, gsd-verifier) with a new workflow orchestrator. No new agents needed.

</domain>

<decisions>
## Implementation Decisions

### Change Application Method

**Cherry-pick workflow:**
- Use git cherry-pick for applying upstream changes (preserves commit history)
- On merge conflict: pause workflow, show conflicting files, user resolves manually
- Generate PLAN.md before execution (audit trail of commits + expected file changes)
- Keep separate commits (don't squash) to preserve upstream history

**Pre-sync checks:**
- Block sync if working directory is dirty (uncommitted changes)
- Require clean state — no auto-stash
- Auto-add upstream remote if missing (name: `upstream`, URL: glittercowboy/get-shit-done)

**Commit display:**
- Show summary + files changed per commit (not full diff)
- Allow "Apply all" option alongside individual selection

**State storage:**
- Sync cache at `.planning/sync/cache.json`
- Plans at `.planning/sync/plans/{date}-{sha}.md`
- Reports at `.planning/sync/reports/{date}-{sha}.md`
- Conflicts at `.planning/sync/conflicts/` (if any)

### Verification Scope

**Layered validation:**
- Always: syntax validation (JSON, YAML, JS)
- If tests exist and were passing: run tests, compare before/after
- Unknown file types: log but don't reject

**Validation behavior:**
- Show 15 items per group before truncating
- Truncation format: `... and N more (see report)`
- Block publish if syntax fails or new test failures introduced
- Store before/after test results in sync report

**Report output:**
- Console shows summary (validated count, skipped count)
- Full report written to `.planning/sync/reports/`
- Report includes: files checked, validation results, test comparison, skipped files with reasons

### Publish Failure Handling

**Publish order:** Bump → Commit → Push → Publish → Tag
- Version bump happens before publish
- Git tag created only after successful npm publish

**Failure recovery:**
- If npm publish fails after git push: leave push, offer retry
- npm publish: 3 retries with backoff (1s, 3s, 5s)
- git push: smart detection — auto-retry network errors, prompt for auth/rejection errors
- On complete failure: write recovery instructions to sync report

**Version management:**
- Analyze commits to suggest version bump (BREAKING → major, feat → minor, fix → patch)
- If commits don't follow conventional format: warn, require explicit user choice
- Prompt user with recommendation, user confirms or overrides

**Changelog:**
- Auto-generate CHANGELOG.md entries from commits
- Show generated entries for user review before committing
- Format: Keep A Changelog standard (Added/Changed/Fixed sections)

**Registry selection:**
- Prompt every time with options: Public npm, GitHub Packages, Other (manual URL)
- Default: last used registry (saved in cache), or public npm if first time
- Validate custom registry URLs

### Authentication Flow

**Upfront verification:**
- Check GitHub and npm auth at workflow start (fail early)
- GitHub: SSH key OR gh CLI authenticated
- npm: prefer bun, fallback to npm publish
- Session-only caching (no persisted auth state)

**Auth setup:**
- If credentials missing: offer to run `gh auth login` / `npm login`
- Wait for completion, then retry verification
- Log auth method used (e.g., "GitHub: SSH key") but never log credentials

**Security:**
- Verify .npmrc is in .gitignore if it exists (warn if not)
- Check both project and global .npmrc for auth
- Support both HTTPS and SSH for GitHub (don't force either)
- Rely on git credential helper for 2FA

**Consumer update (/gsd:update):**
- No auth check needed for public npm install
- Check only if private registry

### Interactivity

- All prompts via AskUserQuestion tool (works in Claude Code and terminal)
- No batch mode flags — full interactive workflow
- Show changelog preview as separate step before version bump prompt

### Claude's Discretion

- Exact format of generated PLAN.md for cherry-picks
- Implementation of commit message analysis for version suggestion
- Specific backoff timing between retries
- Console output formatting and colors

</decisions>

<specifics>
## Specific Ideas

- Keep A Changelog format for auto-generated changelog entries
- Show 15 items before truncating in verification output
- "... and N more (see report)" truncation format
- Bump → Commit → Push → Publish → Tag order for releases
- Smart retry: auto-retry network, prompt for auth errors

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-update-commands*
*Context gathered: 2026-02-03*

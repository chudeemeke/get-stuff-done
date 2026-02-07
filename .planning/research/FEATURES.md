# Feature Landscape

**Domain:** Meta-prompting CLI tool with upstream sync and cross-platform support
**Researched:** 2026-02-07

## Table Stakes

Features users expect from professional CLI tools. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Cross-platform path handling | Node.js CLIs must work on Windows/macOS/Linux without manual fixes | Medium | Existing config system | Use path.join(), avoid string concatenation; path separators differ (\ vs /) |
| Diff preview before sync | Users expect to see what will change before applying updates | Medium | Existing 7-stage sync | Industry standard: terraform plan, kubectl diff, git diff; prevents destructive mistakes |
| Dry-run mode | CLI tools must support non-destructive preview operations | Low | Existing commands | --dry-run flag builds user confidence and AI agent compatibility |
| Auto-update notifications | Users expect to know when upstream has new changes | Medium | Git upstream tracking | Check on command invocation, notify when upstream ahead; don't auto-apply |
| Rollback capability | Failed updates must be reversible without data loss | High | Installation system, metadata persistence | Git reflog-style; store snapshots before applying changes |
| Signed commit verification | Security-critical for cherry-pick workflows from external repos | High | 7-stage sync workflow | Verify GPG signatures before applying upstream commits |
| Error recovery with state preservation | Partial failures must not corrupt system state | High | Hybrid installer, config validation | Transaction-like: validate before apply, rollback on failure |
| Platform detection | Auto-detect OS, shell, environment without user configuration | Low | None | process.platform, os.type(); inform path handling and shell script generation |
| Permission validation | Check filesystem permissions before operations | Low | Installer | Prevent mid-operation failures; validate write access to install directories |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Agent teams integration (Opus 4.6) | Leverage Claude's new parallel agent capabilities for complex tasks | Very High | None (API feature) | Opus 4.6 supports agent teams that split tasks; could parallelize research/execution phases |
| Extended thinking with effort controls | Use adaptive reasoning for complex sync decisions | Medium | None (API feature) | Opus 4.6 adaptive thinking picks up contextual clues; useful for conflict resolution |
| 1M token context window | Process entire large repos or documentation sets in single context | Low | None (API feature) | Opus 4.6 beta feature; enables whole-codebase reasoning for upstream analysis |
| Compaction for long-running workflows | Auto-summarize context to sustain multi-stage operations | Medium | None (API feature) | Opus 4.6 compaction prevents context limit issues during 7-stage sync |
| Interactive diff viewer | GitHub-like diff UI in terminal or browser | High | Diff generation | Tools like difit launch local web UI; superior to plain text diff |
| Upstream change categorization | Auto-classify upstream commits (breaking/feature/fix/chore) | High | 7-stage sync, AI analysis | Use Claude to analyze commit messages and diffs, classify by impact |
| Selective sync by category | Cherry-pick only certain types of changes (e.g., security fixes only) | Medium | Change categorization | Useful for conservative updates; avoid feature bloat |
| Multi-upstream support | Sync from multiple source repos (original GSD + other forks) | Very High | 7-stage sync refactor | Complex merge conflict resolution required |
| Sync conflict auto-resolution | AI-powered conflict resolution with user approval | Very High | Claude API, diff generation | Present resolution with explanation, require confirmation |
| Visual progress with ETA | Show detailed progress with time estimates for long operations | Low | Existing statusline | Build on 3-color progress bar; calculate ETA from operation stages |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-apply upstream updates | Destroys user control, breaks production systems unexpectedly | Always require explicit user confirmation after preview |
| Silent failures | Users don't know what went wrong or how to recover | Comprehensive error messages with recovery steps, state logging |
| Platform-specific installation scripts | Breaks cross-platform promise, doubles maintenance burden | Use Node.js APIs (path, fs, os) for platform detection; single codebase |
| Hardcoded absolute paths | Breaks portability across different user environments | Use path.join(__dirname, ...) and environment variables |
| Storing secrets in config | Security vulnerability for git-based config | Document external secrets management; never template credentials |
| Automatic dependency updates | Breaks stability; dependency changes need testing | Pin versions, provide upgrade command with changelog |
| GUI-only configuration | CLI tools must be scriptable and automation-friendly | Support both interactive prompts and flag-based config |
| Merge-based upstream sync | Creates tangled history, hard to selectively apply changes | Stick with cherry-pick approach for surgical updates |
| Unauthenticated upstream fetches | Vulnerable to MITM attacks, supply chain compromise | Verify GPG signatures on commits, use HTTPS with certificate validation |
| Rollback by re-running installer | Loses customizations, destroys user data | Snapshot-based rollback preserving user state |

## Feature Dependencies

```
Platform Foundation:
  - Platform detection → Path handling → Installation
  - Platform detection → Shell detection → Hook generation

Security Layer:
  - Signed commit verification → Cherry-pick sync → Upstream updates
  - Permission validation → Installation → Hook deployment

Sync Workflow:
  - Auto-update notifications → Diff preview → User approval → Cherry-pick → Rollback (if failed)
  - Change categorization → Selective sync
  - Conflict detection → Auto-resolution (optional) → User confirmation

UI/UX:
  - Dry-run mode → Diff preview → Interactive approval
  - Visual progress → ETA calculation
  - Error recovery → State logging → Rollback

Claude Opus 4.6 Integration:
  - Agent teams → Parallel research/execution
  - Extended thinking → Conflict resolution, change analysis
  - 1M context → Whole-codebase upstream analysis
  - Compaction → Long-running 7-stage sync
```

## MVP Recommendation

For v0.2.0 milestone, prioritize:

### Must Have (Table Stakes)
1. Cross-platform path handling - Foundation for macOS/Linux support
2. Diff preview before sync - Critical safety feature
3. Dry-run mode - Industry standard, low complexity
4. Platform detection - Enables other cross-platform features
5. Permission validation - Prevents mid-operation failures

### Should Have (High Value, Medium Complexity)
6. Auto-update notifications - User expectation for git-based tools
7. Signed commit verification - Security critical for upstream sync
8. Rollback capability - Safety net for failed syncs
9. Visual progress with ETA - Builds on existing statusline

### Could Have (Differentiators, Defer if Time-Constrained)
10. Upstream change categorization - High value but AI-dependent
11. Extended thinking integration - Leverage Opus 4.6 for conflict resolution

Defer to post-v0.2.0:
- Agent teams integration: Very high complexity, requires workflow redesign
- Interactive diff viewer: High complexity, lower priority than text diff
- Multi-upstream support: Out of scope for hardening milestone
- Sync conflict auto-resolution: Requires change categorization first
- Selective sync by category: Requires change categorization first
- 1M context window: API feature available but no immediate use case
- Compaction: Only needed if 7-stage sync exceeds context limits

## Implementation Sequencing

**Phase 1: Platform Foundation (Week 1)**
- Platform detection
- Cross-platform path handling
- Permission validation
- Update installation logic for macOS/Linux

**Phase 2: Security Hardening (Week 2)**
- Signed commit verification
- Add GPG signature checks to 7-stage sync
- Document security model

**Phase 3: Sync Safety (Week 3)**
- Diff preview generation
- Dry-run mode for all commands
- Rollback capability with state snapshots

**Phase 4: User Experience (Week 4)**
- Auto-update notifications
- Visual progress with ETA
- Error recovery improvements

**Phase 5: AI Integration (Optional)**
- Upstream change categorization
- Extended thinking for conflict analysis
- Document Claude Opus 4.6 feature adoption

## Cross-Platform Implementation Notes

### Path Handling Specifics
**Current state:** Windows-only with hardcoded paths likely present
**Target state:** Platform-agnostic using Node.js path module

Key changes required:
- Replace all string concatenation with `path.join()`
- Use `path.sep` for separators, not hardcoded `\` or `/`
- Use `os.homedir()` for user directory, not `~` expansion
- Test shebang handling: `#!/usr/bin/env node` works cross-platform
- Handle Windows junction vs Unix symlink differences in hybrid installer

### Shell Detection
- Windows: PowerShell, CMD, Git Bash (MINGW64)
- macOS: zsh (default since Catalina), bash
- Linux: bash, zsh, fish

Hook deployment must detect shell and generate appropriate syntax.

### Permission Models
- Windows: ACLs, no execute bit
- Unix: chmod 755 for executables, 644 for configs
- Use `fs.access()` with `fs.constants.W_OK` for cross-platform permission checks

## Security Audit Specifics

### Cherry-Pick Security Model

Based on industry best practices for git workflows in 2026:

**Threat model:**
1. Malicious commits in upstream repo
2. MITM attacks during fetch
3. Compromised upstream maintainer account
4. Supply chain attacks via dependencies

**Mitigations:**

| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Malicious commits | GPG signature verification | Verify `git verify-commit` before cherry-pick |
| MITM during fetch | HTTPS with cert validation | Use git default HTTPS transport |
| Compromised account | Multi-reviewer approval | Show commit author, GPG signer, require user approval |
| Supply chain | Dependency scanning | Out of scope for v0.2.0 (no npm deps changing) |

**Verification workflow:**
```bash
# For each commit to cherry-pick:
1. git verify-commit <hash>  # Check GPG signature
2. Show commit author, signer, message, diff
3. Require explicit user approval (Y/n)
4. If signature invalid, BLOCK with warning
5. Log all verification results
```

**Configuration:**
- Allow user to configure trusted GPG keys
- Default: require ANY valid signature
- Strict mode: require signature from specific key IDs
- Audit log: Record all verification attempts

### Access Control
- Hooks run in user context (no privilege escalation)
- Config files must be user-writable only (chmod 600 on Unix)
- No automatic downloads of executable code
- All git operations use user's configured credentials

## Rollback Architecture

### State Management

**Snapshot strategy:**
- Snapshot before each destructive operation
- Store in `.gsd/snapshots/<timestamp>/`
- Include: hooks/, config files, metadata.json
- Exclude: Large generated files, caches

**Snapshot format:**
```
.gsd/snapshots/
  2026-02-07T14-30-00Z/
    manifest.json         # What was changed
    hooks/               # Backup of hooks directory
    gsd.config.json5     # Backup of config
    metadata.json        # Backup of installer metadata
    operation.log        # What operation created this snapshot
```

**Rollback types:**

| Type | Scope | Trigger | Strategy |
|------|-------|---------|----------|
| Installation failure | Full system | Install crashed mid-operation | Restore from pre-install snapshot |
| Sync failure | Hooks only | Cherry-pick failed/conflicts | Restore hooks, preserve config |
| Config validation failure | Config only | Invalid JSON5 after manual edit | Restore last valid config |
| User-initiated | User choice | Explicit /gsd:rollback command | List snapshots, user selects |

**Transaction model:**
```bash
# Pseudo-code for sync operation
1. Create snapshot
2. Validate upstream commits (GPG, etc.)
3. Preview diff → user approval
4. Apply changes with --dry-run first
5. If dry-run succeeds:
     Apply for real
     Verify result
     If success: commit snapshot, cleanup old snapshots
     If failure: rollback from snapshot
6. If dry-run fails:
     Abort, show error, preserve snapshot for debugging
```

**Retention policy:**
- Keep last 5 snapshots
- Keep all snapshots from last 7 days
- Keep 1 snapshot per week for last month
- User can manually preserve important snapshots

## Diff Preview Implementation

### Diff Generation Strategies

| Strategy | Use Case | Pros | Cons |
|----------|---------|------|------|
| git diff | File changes | Built-in, accurate | Plain text only |
| Unified diff format | Terminal display | Universal format | Not visual |
| Side-by-side diff | Wide terminals | Easy comparison | Requires terminal width |
| HTML diff (difit-style) | Complex changes | Visual, syntax highlighting | Requires browser |
| JSON structured diff | Programmatic analysis | Machine-readable | Not human-friendly |

**Recommended approach for GSD:**
1. Generate unified diff with context (`git diff -U3`)
2. Syntax highlight in terminal using ANSI colors
3. Provide `--html` flag for browser-based review (future enhancement)
4. Include summary statistics: files changed, insertions, deletions

**Diff context levels:**
```bash
gsd:upstream --preview          # Show file list and summary
gsd:upstream --preview --diff   # Show full unified diff
gsd:upstream --preview --stat   # Show diffstat (files + line counts)
```

### Interactive Approval Flow

```
1. Fetch upstream changes
2. Identify commits to cherry-pick
3. For each commit:
     Show commit metadata (author, date, message, GPG status)
     Show diffstat
     Prompt: [V]iew diff  [A]pply  [S]kip  [Q]uit

4. If user selects "View diff":
     Display full unified diff
     Reprompt: [A]pply  [S]kip  [Q]uit

5. If user selects "Apply":
     Perform dry-run
     If conflicts: Show conflict markers, ask to resolve or skip
     If success: Apply for real

6. After all commits processed:
     Show summary: X applied, Y skipped, Z failed
     Create snapshot
```

## Auto-Update Checking

### Check Strategy

**When to check:**
- On any gsd command invocation (cached for 24h)
- Explicit `/gsd:check-updates` command
- During installation (one-time setup)

**What to check:**
```bash
1. git fetch upstream --dry-run  # Check if fetch needed
2. git rev-list HEAD..upstream/main --count  # How many commits behind
3. If count > 0:
     Notify: "N new commits available in upstream"
     Show latest commit summary
     Prompt: Run /gsd:upstream to sync
```

**Notification levels:**

| Commits Behind | Notification | Color |
|---------------|--------------|-------|
| 0 | None | - |
| 1-5 | Info message | Blue |
| 6-20 | Warning | Yellow |
| 21+ | Alert | Red |

**Caching strategy:**
- Store last check timestamp in metadata
- Cache result for 24 hours
- Force re-check with `--force` flag
- Respect offline mode (skip if network unavailable)

### Configuration

```json5
{
  "upstream": {
    "autoCheckUpdates": true,        // Enable auto-checking
    "checkIntervalHours": 24,        // How often to check
    "notifyThreshold": 1,            // Minimum commits to notify
    "remoteUrl": "https://github.com/original/gsd.git",
    "branch": "main"
  }
}
```

## Claude Opus 4.6 Feature Adoption

### Available Capabilities (February 2026)

Based on official Anthropic release:

**1M Token Context Window (Beta)**
- Enables processing entire large repos or documentation sets
- Use case for GSD: Analyze entire upstream repo history in one context
- Complexity: Low (API parameter change)
- Value: Medium (nice-to-have for deep analysis)

**128K Output Tokens**
- Doubled from 64K limit
- Use case for GSD: Generate comprehensive sync reports, detailed conflict analysis
- Complexity: Low (API capability)
- Value: Low (current outputs well under 64K)

**Agent Teams**
- Parallel agents splitting tasks into segmented jobs
- Use case for GSD: Parallelize research phase (stack, features, architecture, pitfalls)
- Complexity: Very High (requires orchestrator redesign)
- Value: High (faster roadmap generation)
- Recommendation: Defer to v0.3.0 or later

**Adaptive Thinking with Effort Controls**
- Model picks up contextual clues for reasoning depth
- Use case for GSD: Complex conflict resolution, breaking change detection
- Complexity: Medium (prompt engineering + API parameters)
- Value: High (improves sync decision quality)
- Recommendation: Implement for v0.2.0 conflict resolution

**Context Compaction**
- Auto-summarize context for long-running tasks
- Use case for GSD: Sustain 7-stage sync without context overflow
- Complexity: Low (API feature)
- Value: Medium (only needed if sync exceeds context)
- Recommendation: Monitor context usage, implement if needed

**Improved Agentic Coding**
- Better planning, sustained tasks, larger codebases
- Use case for GSD: More reliable code generation in orchestrator skills
- Complexity: Low (model improvement)
- Value: High (better execution quality)
- Recommendation: Automatic benefit, no code changes needed

### Recommended Adoption for v0.2.0

**Implement:**
1. Extended thinking for conflict resolution
   - Add effort controls to sync workflow
   - Use adaptive thinking for upstream change analysis
   - Low effort for simple changes, high effort for breaking changes

2. Improved agentic coding benefits
   - Update orchestrator prompts to leverage better planning
   - Test with complex sync scenarios

**Defer:**
1. Agent teams - Too complex for hardening milestone
2. 1M context - No immediate use case (7-stage sync fits in standard context)
3. Compaction - Implement only if context overflow occurs in testing

### Meta-Prompting System Enhancements

**Current meta-prompting architecture:**
- Orchestrator skills coordinate workflows
- Context engineering via SPECS.md, .planning/ structure
- Prompt templates in hooks/skills/

**Enhancements using 2026 best practices:**

1. **Inference-time scaling**
   - Allow users to control effort level for different operations
   - Fast mode: Quick syncs, skip deep analysis
   - Deep mode: Thorough conflict resolution, breaking change detection

2. **Structured meta-prompts**
   - Use Anthropic's metaprompt template for skill definitions
   - Ensure optimal prompt structure for orchestrator

3. **Memory and retrieval**
   - Extend context engineering with retrieved docs (upstream changelogs)
   - Use 1M context for whole-repo analysis when available

4. **Multi-shot examples in skills**
   - Add example sync scenarios to orchestrator prompts
   - Improve reliability with Claude 4's instruction-following

## Complexity Estimates

| Feature | LOC Estimate | Test Effort | Risk Level |
|---------|-------------|-------------|------------|
| Cross-platform path handling | 50-100 | Medium | Medium |
| Platform detection | 20-30 | Low | Low |
| Permission validation | 30-50 | Low | Low |
| Diff preview | 100-150 | Medium | Low |
| Dry-run mode | 50-100 | High | Medium |
| Auto-update checking | 100-150 | Medium | Low |
| Signed commit verification | 150-200 | High | High |
| Rollback capability | 300-400 | Very High | High |
| Visual progress with ETA | 50-100 | Low | Low |
| Extended thinking integration | 100-150 | Medium | Medium |
| Upstream change categorization | 200-300 | High | Medium |
| Agent teams integration | 500+ | Very High | Very High |

**Risk factors:**
- High: Security-critical (GPG verification), data loss potential (rollback)
- Medium: Cross-platform testing burden, conflict resolution edge cases
- Low: API-only features, UI enhancements

## Testing Strategy

### Cross-Platform Testing
- Test matrix: Windows 11, macOS (Intel + ARM), Ubuntu LTS, Debian
- Shell matrix: PowerShell, CMD, Git Bash, zsh, bash
- Node.js versions: LTS (20.x), Current (22.x)

### Security Testing
- GPG signature validation with valid/invalid/unsigned commits
- MITM simulation (reject invalid certs)
- Untrusted upstream repo simulation

### Rollback Testing
- Interrupted operations (kill process mid-sync)
- Disk full scenarios
- Permission denied mid-operation
- Corrupt snapshot recovery

### Integration Testing
- Full sync workflow end-to-end
- Config validation → diff preview → approval → apply → verify
- Failure injection at each stage

## Sources

### Security Audit & Git Workflows
- [DevOps Security Checklist 2026](https://lumenalta.com/insights/devops-security-checklist)
- [GitHub Actions Security Best Practices](https://arctiq.com/blog/top-10-github-actions-security-pitfalls-the-ultimate-guide-to-bulletproof-workflows?hs_amp=true)
- [GitOps Security Checklist](https://www.plural.sh/blog/gitops-security-checklist-tips/)
- [Git Cherry Pick Security Best Practices](https://nickjanetakis.com/blog/git-cherry-pick-examples-to-apply-hot-fixes-and-security-patches)
- [Mastering Git Cherry-Pick](https://medium.com/@314rate/mastering-git-cherry-pick-advanced-guide-with-real-world-examples-3df3d9f284f5)

### Cross-Platform Node.js
- [Writing Cross-Platform Node.js](https://shapeshed.com/writing-cross-platform-node/)
- [Awesome Cross-Platform Node.js](https://github.com/bcoe/awesome-cross-platform-nodejs)
- [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)
- [Tips on Developing Cross-Platform Node.js CLI](http://haoliangyu.github.io/blog/2019/05/13/Tips-on-developing-cross-platform-Node-js-application/)

### Auto-Update & Upstream Sync
- [git-repo-updater](https://github.com/earwig/git-repo-updater)
- [GitHub Upstream Sync Action](https://github.com/marketplace/actions/upstream-sync)
- [Syncing a Fork - GitHub Docs](https://docs.github.com/articles/syncing-a-fork)

### Diff Preview & Dry-Run
- [kubectl diff Preview Changes](https://oneuptime.com/blog/post/2026-01-25-kubectl-diff-preview-changes/view)
- [CLI Tools with Previews and Dry Runs](https://nickjanetakis.com/blog/cli-tools-that-support-previews-dry-runs-or-non-destructive-actions)
- [In Praise of --dry-run](https://henrikwarne.com/2026/01/31/in-praise-of-dry-run/)
- [Best File Comparison and Diff Tools in Linux 2026](https://thelinuxcode.com/10-best-file-comparison-and-diff-tools-in-linux-2026-developer-guide/)

### Rollback Capabilities
- [AWS CloudFormation Rollback](https://repost.aws/knowledge-center/cloudformation-update-rollback-failed)
- [Helm Upgrade Rollback](https://medium.com/nerd-for-tech/kubernetes-helm-error-upgrade-failed-another-operation-install-upgrade-rollback-is-in-progress-52ea2c6fcda9)
- [SQL Transaction Rollback](https://www.digitalocean.com/community/tutorials/sql-commit-sql-rollback)

### Claude Opus 4.6 Capabilities
- [Introducing Claude Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6)
- [What's New in Claude 4.6](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6)
- [Building a C Compiler with Agent Teams](https://www.anthropic.com/engineering/building-c-compiler)
- [Claude Opus 4.6 on GitHub Copilot](https://github.blog/changelog/2026-02-05-claude-opus-4-6-is-now-generally-available-for-github-copilot/)
- [Claude Opus 4.6 Features and Benchmarks](https://www.digitalapplied.com/blog/claude-opus-4-6-release-features-benchmarks-guide)

### Meta-Prompting & Prompt Engineering
- [Prompt Engineering Best Practices](https://claude.com/blog/best-practices-for-prompt-engineering)
- [Prompt Engineering Overview - Claude Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
- [Meta-Prompting: LLMs Crafting Their Own Prompts](https://intuitionlabs.ai/articles/meta-prompting-llm-self-optimization)
- [2026 Guide to Prompt Engineering](https://www.the-ai-corner.com/p/your-2026-guide-to-prompt-engineering)
- [Claude Prompt Engineering 2026](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026)

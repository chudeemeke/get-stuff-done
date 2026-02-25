# Phase 21: Sync Intelligence - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated intelligence for the sync workflow: monitoring for new upstream changes, classifying changes by type, and performing supply chain integrity analysis. The monitoring surfaces notifications passively (statusline) and on-demand (command). The classification categorizes commits by conventional type. The supply chain analysis replaces GPG verification with content-based checks targeting real attack vectors.

Scope: intelligence and analysis ONLY. Does not modify the sync execution workflow itself (Phase 20 handles that). Does not add selective sync (Phase 22).

</domain>

<decisions>
## Implementation Decisions

### Monitoring trigger
- Both passive (statusline hook) and active (manual command) detection
- Maintainer path: git-based upstream check (git fetch upstream, compare HEAD..upstream/main) replaces current npm-only check
- Consumer path: stays as-is (npm registry version check)
- Cache with 4-hour TTL: background worker writes result to cache file with timestamp; statusline reads cache on every render; background check only re-fetches if cache is stale
- Mid-session freshness via cache TTL -- when statusline reads stale cache, next session-start hook refreshes it
- Role detection: config-driven (`gsd.role` in JSON5 config), defaults to 'consumer'. Explicit, not inferred.
- Statusline notification format: "N upstream (M fixes) | /gsd:upstream" -- count + highest-severity type hint

### Commit classification
- Hybrid approach: deterministic in background hook, Claude-assisted in on-demand workflow
- Deterministic: conventional commit prefix parsing (feat:, fix:, refactor:, docs:, chore:, test:, perf:, style:) + file-path heuristics (docs/ = docs, test/ = test, bin/ = feat/fix based on subject)
- Ambiguous commits: deterministic classifier buckets as 'other'; Claude re-classifies in /gsd:upstream workflow context (zero additional API cost)
- Color-as-severity with self-describing type labels (no abstract tiers):
  - Red: security, breaking
  - Yellow: fix
  - Green: feat
  - Dim/gray: docs, chore, refactor, other

### Supply chain integrity (replaces GPG verification)
- GPG verification dropped -- wrong threat model for this scenario (can't verify upstream keys, identity != code safety)
- 6 content-based supply chain checks, each targeting a documented attack vector:

1. **Prompt Integrity Scanner** (ELEVATED -- primary check, highest prominence)
   - Targets: prompt injection supply chain attacks (novel vector specific to AI dev tools)
   - Triggers: commits modifying .md files in execution directories (workflows/, agents/, commands/, templates/)
   - Checks: tool list changes in agent definitions, permission/mode specification changes, guardrail removal (safety keyword deletion), file access expansion (references to ~/.ssh, ~/.aws, credentials), hidden Unicode content (zero-width chars, RTL override), instruction injection patterns ("ignore previous", "override", "new instructions")
   - Displayed FIRST in risk summary, red prominence

2. **Dependency Diff Guard**
   - Targets: event-stream, ua-parser-js style attacks
   - Triggers: commits modifying package.json, lockfiles, or adding new require()/import statements
   - Reports: exact packages added/removed/changed

3. **Execution Path Sentinel**
   - Targets: xz-utils, SolarWinds style attacks
   - Triggers: commits touching install scripts, hooks, bin/ executables, CI configs
   - Extends existing isSensitivePath() to security-focused path list

4. **Network Endpoint Audit**
   - Targets: data exfiltration, C2 channels
   - Triggers: commits adding/modifying URLs, fetch()/http.request() calls, new hostnames
   - Reports: specific endpoints added/changed

5. **Obfuscation Detector**
   - Targets: backdoors, payload injection
   - Triggers: eval(), new Function(), long base64 strings, hex-encoded payloads, minified blobs in source files
   - Pattern matching on diff content

6. **Author Anomaly Detection**
   - Targets: account compromise, social engineering (xz-utils pattern)
   - Tracks known upstream authors from historical commits
   - Flags commits from never-before-seen authors

- All checks are deterministic (regex/pattern matching on diff content and file paths)
- Checks run in sync-preview pipeline and /gsd:upstream workflow, NOT in background hook (need diff content, too heavy for session-start)
- Findings are surfaced, not blocking -- maintainer decides action

### Output presentation
- Two output surfaces: statusline (compact notification) and /gsd:upstream (detailed view)
- Detailed view organization: risk-first, then type-grouped
  - Top section: commits with supply chain flags (prompt changes first, then code risks)
  - Bottom section: clean commits grouped by type (feat/fix/docs/chore/other)
- 3-layer depth approach:
  - Layer 1 (always): Dashboard summary -- risk-first commit list with subject, type badge, risk flags, --stat file counts
  - Layer 2 (auto): Risk commits auto-expand their flagged diff portions (specific lines that triggered checks)
  - Layer 3 (on-demand): Clean commits stay as summary; full diff on request
- sync-preview CLI: --json output extended with supply chain risk flags per commit (enables scripting/CI integration)

### Claude's Discretion
- Exact regex patterns for obfuscation and injection detection
- Historical author tracking implementation (Set vs file-based cache)
- Threshold for "long base64 string" length
- Exact color/formatting of risk badges in terminal output
- How to handle commits that trigger multiple checks simultaneously

</decisions>

<specifics>
## Specific Ideas

- "I want it to work like Claude Code's own update detection -- mid-session freshness, not just session start"
- Supply chain checks inspired by real incidents: event-stream, ua-parser-js, xz-utils, SolarWinds, colors.js
- Prompt integrity elevated because GSD is fundamentally a prompt-execution system -- compromised .md files have larger blast radius than compromised .js files
- Color semantics match existing theme system (red/yellow/green/dim)
- Building on existing sync.cjs plumbing: getCommitsInRange(), getFilesForCommit(), isSensitivePath()

</specifics>

<deferred>
## Deferred Ideas

- New upstream commits available (Codex runtime support, debug flow changes, gsd-tools fixes, update safety improvements) -- sync via existing /gsd:upstream workflow, not Phase 21 scope
- Multi-runtime support (Codex, Gemini) -- separate milestone per earlier decision
- Blocking/auto-reject based on supply chain findings -- intentionally excluded; surface findings, let maintainer decide

</deferred>

---

*Phase: 21-sync-intelligence*
*Context gathered: 2026-02-25*

# Phase 31: Feature Flags & Override System - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement feature flag filtering in filter() and override replacement in override() -- the two pipeline stubs from Phase 30. Add check-overrides.js for staleness detection. features.json schema validation via AJV. Installer, fork code porting, and CI enforcement are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Exclusion naming
- Exclude entries use **basename only** (without extension): "upstream-sync" matches workflows/upstream-sync.md
- Each category (workflows, commands, agents, hooks) has its own exclude list -- entries only match within their category
- SDK exclusion is **all-or-nothing**: `sdk: true` includes entire sdk/ directory, `sdk: false` excludes it. No per-file granularity.
- Runtimes section is **ignored entirely** by filter() in v3.0 -- pure documentation, no validation, no warnings, no processing
- Exclude entry that matches no upstream file: **warning** (not error). Same pattern as branding zero-match. Compose succeeds.

### Override staleness detection
- check-overrides.js is a **standalone script** -- separate from compose. CI runs both independently. Developer can compose without being blocked by stale overrides during active work.
- Staleness detection uses **content hash** (SHA-256) stored in REASON.md. Compares hash of current upstream file against recorded hash. No git dependency. Only triggers when the specific overridden file changed, not on any upstream version bump.
- Output: **actionable report** -- names each stale override, shows version mismatch (recorded vs current), suggests actions (review/update/remove). Summary line with counts. Exit 1 if any stale or missing REASON.md.

### REASON.md convention
- **Companion file** next to override: `overrides/lib/config.cjs.REASON.md` paired with `overrides/lib/config.cjs`
- REASON.md includes: Why, Upstream snapshot (version + SHA-256 hash), What's different, Review trigger
- Missing REASON.md: **error with template hint** -- shows exact content to paste, but does NOT auto-create. Developer must write the "Why" section.

### Validation
- features.json validated via **AJV schema** (consistent with branding.json pattern)
- Schema: runtimes (object, boolean values), workflows/commands/agents/hooks (each with enabled enum + exclude string array), sdk boolean, additionalProperties: false
- Validation runs in resolve() stage before filter() processes exclude lists

### Claude's Discretion
- How filter() maps basename entries to upstream file paths (directory prefix per category)
- How override() discovers and applies replacement files
- check-overrides.js internal structure and hash computation
- Test organization for the new functionality

</decisions>

<specifics>
## Specific Ideas

- check-overrides.js output format matches the previews discussed: indented fields per override, summary counts at bottom
- Missing REASON.md error includes a paste-ready template with version and hash fields
- The staleness hash approach means bumping upstream version alone doesn't trigger false positives -- only actual file content changes matter

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 31-feature-flags-override-system*
*Context gathered: 2026-03-28*

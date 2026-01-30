# Phase 2: Statusline Redesign - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the statusline with GSD branding, dynamic color thresholds, and update notifications. This phase modifies visual presentation and behavior of the existing statusline — it does not add new commands or change core GSD functionality.

</domain>

<decisions>
## Implementation Decisions

### Branding Placement
- Position: Far left, first element
- Format: `⧉ [GSD]` (icon + text)
- Color: Cyan (#5FD7D7 / terminal cyan)
- Icon styling: Brighter/bolder than [GSD] text
- Separator: Pipe `|` after branding
- Dynamic behavior: Dim when idle, bright when model is processing
- Processing animation: Pulse/throb effect at 1-second cycle

### Progress Bar States
- Color transitions: Green → Yellow → Red (3 stages)
- Thresholds: 0-50% green, 50-75% yellow, 75%+ red
- Bar style: Color only changes (no pattern changes)
- Blink trigger: At 87.5% (critical threshold only)
- Blink scope: Bar, icon, and percentage all blink together

### Information Density
- Line 1 layout: `⧉ [GSD] | Opus 4.5 | ████░░░░░░ 45% | foo`
- Model format: Full name with version (e.g., "Opus 4.5")
- CWD format: Project folder name only (not full path)
- Visual hierarchy: Brand + Progress bright; Model + CWD dim
- Truncation order: CWD first, then model
- Progress bar width: Fixed 10 characters
- Bar characters: █ (filled), ░ (empty)
- Bar borders: None (no brackets)
- Percentage: Integer only (no decimals), positioned after bar
- Stage icons: None (green), ⚠️ (yellow), ⚡ (red) — icon matches bar color
- Line 2: Update notification + current task (if Claude Code not showing task)

### Update Notification
- Trigger: Follow original GSD pattern (periodic check during session)
- Role detection: Config setting (`role: maintainer` or `role: consumer`)
- Consumer text: `📦 v0.1.0 → v0.2.0 | /gsd:update`
- Maintainer text: `📦 upstream updates | /gsd:upstream`
- Color: Dim/gray (subtle, not urgent)
- Dismissal: None — shows until user updates
- Icon: 📦 prefix

### Claude's Discretion
- Exact blink speed/animation timing
- Handling edge cases (terminal without Unicode support)
- Pulse animation implementation details
- How to detect "model is processing" state

</decisions>

<specifics>
## Specific Ideas

- Branding should feel integrated but distinct — the `⧉` icon gives visual anchor
- Progress bar visual language: familiar (like download progress) but with urgency cues
- Update notification is informational, not alarming — dim color keeps it non-intrusive
- Separator color: WHITE (not DIM) for visibility per previous decision

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-statusline-redesign*
*Context gathered: 2026-01-30*

# Phase 38: Statusline Deployment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 38-statusline-deployment
**Areas discussed:** Composition pipeline, Global settings wiring, Timeout fix scope

---

## Composition Pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Move to overlay/ | Move hooks/gsd-statusline.js to overlay/hooks/. Pipeline walks overlay/. | Yes |
| Special case in compose.js | Add logic to include repo-root hooks/. Breaks convention. | |
| You decide | Claude picks based on overlay patterns | |

**User's choice:** Move to overlay/ (Recommended)
**Notes:** Clean architecture, no special cases. Composition pipeline already walks overlay/ recursively.

---

## Global Settings Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay post-install | After upstream installer, overlay step patches settings.json | Yes |
| Upstream delegation | Let upstream's installer handle it | |

**User's choice:** Overlay post-install (Recommended)
**Notes:** Keeps settings wiring in fork code, doesn't depend on upstream's settings.json manipulation.

---

## Timeout Fix Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Check-update hook only | Reduce git fetch from 15s to 3s. Statusline is cache-based. | |
| Fix both defensively | Reduce hook timeout AND add 3s statusline timeout | Yes |

**User's choice:** Fix both defensively
**Notes:** User asked about industry patterns. After learning that statuslines should never do blocking I/O (VS Code, Starship, tmux pattern), user agreed the architecture is correct but wanted belt-and-suspenders. Industry pattern: statusline reads cache, hooks write cache asynchronously.

---

## Claude's Discretion

- Whether gsd-check-update.js needs to move to overlay/
- Fallback output format on timeout
- setTimeout vs AbortController for statusline timeout

## Deferred Ideas

None

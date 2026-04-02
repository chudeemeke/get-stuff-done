# Phase 37: Installer Safety - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 37-installer-safety
**Areas discussed:** Test scenarios, Test isolation, Edge cases

---

## Test Scenarios

| Option | Description | Selected |
|--------|-------------|----------|
| All paths | Fresh install, re-install over v3, re-install over v2, uninstall, install with user content present | Yes |
| Incident path only | Focus on re-install with src/ triggering false v2 detection | |
| Install + uninstall | Fresh install and uninstall only, skip v2 migration | |

**User's choice:** All paths (Recommended)
**Notes:** Comprehensive coverage selected. The incident was a re-install scenario, but all paths need verification for confidence.

---

## Test Isolation

| Option | Description | Selected |
|--------|-------------|----------|
| Temp directories | Each test creates fresh temp dir, uses --config-dir, isolated | Yes |
| Fixture directory | Pre-built scenarios in tests/fixtures/installer/ | |
| You decide | Claude picks based on existing patterns | |

**User's choice:** Temp directories (Recommended)
**Notes:** Clean isolation, no repo pollution. Aligns with --config-dir approach identified in Phase 29 Prototype Gate.

---

## Edge Cases

| Option | Description | Selected |
|--------|-------------|----------|
| Test current fallbacks | Verify existing behavior. No manifest = known v2 dirs only. No new logic. | Yes |
| Harden fallbacks | Add backup-before-cleanup, verify-before-proceed, restore-on-failure | |
| Tighten to strict manifest | No manifest = no cleanup at all (refuse). Industry best practice but breaks v2 migration. | |

**User's choice:** Test current fallbacks (Recommended)
**Notes:** User asked about industry best practices first. After learning that manifest-is-truth is standard (npm, brew, apt, macOS .pkg all use this), user agreed the current v2 fallback is an acceptable migration bridge. No over-engineering for a transitional path.

---

## Claude's Discretion

- Test file organization
- Temp directory creation pattern
- Upstream subprocess mocking strategy

## Deferred Ideas

None

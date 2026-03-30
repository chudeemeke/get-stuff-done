# Phase 35: Migration & Ship v3.0.0 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 35-migration-ship-v3-0-0
**Areas discussed:** Git history strategy, package.json files array, v2.x upgrade experience, Release mechanics

---

## Git History Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Tag-and-continue | Tag current HEAD as v2.4.0-legacy. Keep full history on main. No branch gymnastics. | Y |
| Squash to clean slate | Squash overlay commits into single commit. Loses phase history. | |
| Create branch retroactively | Create overlay-architecture branch from HEAD, immediately merge (no-op). | |

**User's choice:** Tag-and-continue (Recommended)
**Notes:** Industry pattern from Homebrew, Node.js, Android OEMs. MIG-01/02 reinterpreted: legacy state is tagged, main already has overlay structure.

---

## package.json Files Array

| Option | Description | Selected |
|--------|-------------|----------|
| dist/ + bin/ + overlay meta | Ship composed output, installer entry point, and config files only. | Y |
| dist/ + full overlay/ | Ship composed output plus raw overlay source. | |
| Keep current files array | Ship src/, scripts/, etc. as-is. Doesn't match overlay architecture. | |

**User's choice:** dist/ + bin/ + overlay meta (Recommended)
**Notes:** Matches build-then-ship pattern (Next.js, Vite, esbuild).

### Follow-up: Prepublish

| Option | Description | Selected |
|--------|-------------|----------|
| prepublishOnly script | Add "prepublishOnly": "bun run compose" to package.json. | Y |
| Manual compose before publish | Rely on remembering to compose before publish. | |

**User's choice:** prepublishOnly script (Recommended)

---

## v2.x Upgrade Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Warn then auto-clean | Detect v2.x, print migration banner, clean old files, install v3.0. Non-interactive. | Y |
| Require explicit flag | Error with "Run with --upgrade to migrate". Safest but friction. | |
| Silent cleanup | Detect and clean without telling user. Risky. | |

**User's choice:** Warn then auto-clean (Recommended)
**Notes:** Matches npm 6->7 and Homebrew 2->3 upgrade patterns.

---

## Release Mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Direct to latest | aidev release major + aidev publish. No RC. Rollback via version pin. | Y |
| RC then promote | Publish v3.0.0-rc.1 on @next first, then promote. | |
| npm pack dry-run only | Verify package contents before publishing. Lighter than RC. | |

**User's choice:** Direct to latest (Recommended)
**Notes:** Private fork, single user. RC adds ceremony without test audience.

---

## Claude's Discretion

- Exact v2.x cleanup file list
- README/UPGRADING.md content
- Sync-snapshot tag cleanup

## Deferred Ideas

None

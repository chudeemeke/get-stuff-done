# Decision Record 003: Upstream Authority Migration

**Date:** 2026-06-22  
**Status:** Accepted for Phase 40.6 implementation  
**Context:** v1.2.0 ship-ready hardening; upstream authority drift discovered during Phase 40.5 follow-up

---

## Decision

Move the active upstream authority for `@chude/get-stuff-done` from the legacy
`get-shit-done-cc` package / `gsd-build/get-shit-done` repository to Open GSD:

- Active npm package: `@opengsd/gsd-core`
- Initial active pin: `1.5.0`
- Active repository: `https://github.com/open-gsd/gsd-core`
- Legacy npm package: `get-shit-done-cc`
- Legacy repository: `https://github.com/gsd-build/get-shit-done`

The fork remains an overlay. This is not a rewrite, not a migration to a separate
GSD-2 architecture, and not a change to the user-facing `@chude/get-stuff-done`
identity.

---

## Context

The project's core value is to get upstream improvements automatically while preserving
fork identity and additions. That value depends on the correct upstream authority.

Phase 40.5 originally treated `get-shit-done-cc` as the active authority and bumped the
fork from older legacy pins to `get-shit-done-cc@1.39.1`. Live review on 2026-06-22
showed this is no longer sufficient for a market-ready v1.2.0 foundation:

- `get-shit-done-cc` still exists and still publishes versions, but it remains tied to
  the legacy maintainer/account.
- The legacy repository resolves to `gsd-build/get-shit-done`.
- Open GSD is the active continuation at `open-gsd/gsd-core`.
- The active Open GSD npm package is `@opengsd/gsd-core`.
- `@opengsd/get-shit-done-redux` exists, but npm marks it deprecated in favor of
  `@opengsd/gsd-core`.
- The Open GSD package layout is not assumed to be drop-in compatible with
  `get-shit-done-cc`.

Phase 41 hardening must not build more supply-chain, override, and release automation
on top of the wrong authority.

---

## Invariants

These do not change:

- Publish target remains `@chude/get-stuff-done`.
- The fork keeps surface branding and fork-specific additions.
- Upstream is consumed as a build-time dependency.
- Composed output remains the published runtime surface.
- Upstream versions remain exact reviewed pins.
- Users do not receive unreviewed `latest`, `next`, canary, or dev updates.
- Override staleness checks continue to compare fork overrides against upstream source.
- Global installed GSD is not patched during migration debugging.

---

## Machine-Readable Contract

The build-time authority contract lives in:

- `.planning/upstream-authority.json`
- `.planning/upstream-authority.schema.json`

This contract is maintainer/build-time state. Published runtime code must not assume
`.planning/` exists. If package-shipped code needs authority metadata, implementation
must generate or include a package artifact explicitly and verify it through package
dry-run/pack and scratch consumer install.

This follows Decision Record 002's manifest-driven knowledge pattern: cross-cutting
authority metadata should have one source for build tooling instead of scattered
hardcoded strings.

---

## Pinning Rule

The initial migration target is `@opengsd/gsd-core@1.5.0`.

Do not use:

- `@opengsd/gsd-core@latest`
- `@opengsd/gsd-core@next`
- `@opengsd/gsd-core` canary tags
- `@opengsd/gsd-core` dev tags
- semver ranges for the active upstream package
- `get-shit-done-cc@latest` as a substitute migration target

Future Open GSD upgrades must remain deliberate reviewed version changes.

---

## Required Evidence Before Trusting Package Layout

Before implementation trusts the Open GSD package layout, Phase 40.6 must record:

- `dist.integrity`
- `dist.shasum`
- `dist.tarball`
- `license`
- `scripts`
- maintainer list
- release/tag correlation for `v1.5.0`
- current legacy package layout from the installed pinned dependency
- Open GSD package layout from isolated pack/install inspection

The required commands are recorded in the Phase 40.6 plan and validation files. Missing
or inconsistent evidence is a migration risk and must be recorded before code changes
continue.

---

## Consequences

Positive:

- Phase 41 hardening starts from the active upstream authority.
- Future bump tooling can reason about upstream identity from a contract instead of
  scattered hardcodes.
- The fork avoids silently building market-ready gates around an abandoned or unsafe
  authority assumption.

Costs:

- Phase 40.5 Wave 5 cannot be executed as originally written.
- Compose, override, boundary, update-preview, branding, and tests must adapt to the
  Open GSD package layout.
- Verification must include package artifact behavior, not only source tests.

Risks:

- Open GSD package layout may differ enough to require broader compose changes.
- Existing published-package assumptions may already be brittle because `bin/` is
  included while `scripts/` is not.
- Historical docs contain many legacy references and must not be mass-edited without
  distinguishing active authority from archival evidence.

---

## Reconsideration Criteria

Reconsider this decision only if one of these becomes true:

- Open GSD stops publishing stable packages.
- Open GSD maintainers explicitly abandon `@opengsd/gsd-core`.
- Package integrity, source correlation, or layout inspection reveals an unacceptable
  supply-chain risk.
- A better active Open GSD package is officially designated by the maintainers.
- The fork's overlay architecture can no longer compose against Open GSD without a
  project-level redesign.

---

## Immediate Follow-Up

Phase 40.6 executes in four waves:

1. Record this ADR and authority manifest.
2. Inspect Open GSD package layout and package integrity in isolation.
3. Migrate active tooling through an upstream identity helper.
4. Verify source, dist, package artifact, scratch consumer install, and Phase 41
   readiness.


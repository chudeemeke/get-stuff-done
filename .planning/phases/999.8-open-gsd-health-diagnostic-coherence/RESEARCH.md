---
phase: 999.8
topic: open-gsd-health-w002
status: preserved-research
researched: 2026-07-14
---

# Backlog 999.8 Research: Open GSD Health W002

## Authority Correction

The first probe used `get-stuff-done/bin/gsd-tools.cjs`, the repository's
deprecated legacy compatibility mirror. That file is tracked but is not the
active composition authority after Phase 40.6.

The authoritative paths are:

| Surface | SHA-256 | Role |
|---|---|---|
| `node_modules/@opengsd/gsd-core/gsd-core/bin/lib/verify.cjs` | `495c7a5a09593127c36573d7075ac2533fc7b805f0c826c4d96eccdcdf2e991d` | exact-pinned Open GSD 1.6.1 source |
| `dist/gsd-core/bin/lib/verify.cjs` | `495c7a5a09593127c36573d7075ac2533fc7b805f0c826c4d96eccdcdf2e991d` | composed shipped runtime |
| `get-stuff-done/bin/lib/verify.cjs` | `939eb2c4e58648cee7b34917bb1f10ed889473bac188552893ceec0a9e309db8` | deprecated legacy mirror; not acceptance evidence |

The active upstream and composed bytes match exactly because no `verify.cjs`
override exists yet.

## Authoritative Reproduction

Running composed `dist/gsd-core/bin/gsd-tools.cjs validate health` read-only in
`C:\Projects\memory-nexus` reports:

- status `degraded`;
- seven `W002` warnings: Phase 32.5 four times and Phase 38 three times;
- every `W002` has `repairable: false`;
- no `W006` or `W007` warnings;
- one unrelated repairable `W016`, so total `repairable_count` is one.

The other current warnings are project hygiene (`W005`, `W009`, `W017`, and
`W019`) and are not part of this parser defect.

## Confirmed Root Cause

Open GSD 1.6.1 `verify.cjs` Check 4:

1. extracts every numeric STATE narrative occurrence with
   `[Pp]hase\s+(\d+[A-Z]?(?:\.\d+)*)`;
2. builds valid phases from disk and archived directory tokens;
3. adds ROADMAP headings with a separate heading-only regular expression;
4. normalizes only zero-padding; and
5. emits one warning per occurrence.

The same release's shared `buildRoadmapPhaseVariants()` already recognizes:

- `##` through `####` phase headings;
- checked and unchecked checklist declarations;
- decimals;
- milestone-prefixed IDs;
- project-code-compatible token forms; and
- padded/unpadded variants through `phaseVariants()`.

W002 does not reuse that shared declaration read model. W006/W007 do, which is
why those earlier false warnings no longer reproduce on the active runtime.

## Upstream State

Open GSD issue #1697 described the checklist-only W002/W007 family. A
maintainer confirmed the W002 path persisted on 1.6.0, then closed the issue for
missing reporter follow-up. The issue was not closed by a fix.

The fetched Open GSD `next` branch at
`2cbf18642005d235a14a877a24107ba6650cdf7b` still has the same semantic gap in
`src/verify.cts`: W002 scans every numeric `Phase N` occurrence in STATE,
collects ROADMAP declarations from `##` through `####` headings only, and
normalizes exact tokens only for zero-padding. The newer archive regression test
fixes historical directory discovery, but there is no checklist-only declaration
fixture, duplicate-warning canonicalization, or `N` to exact `N.0` contract.
This is source-level confirmation that the planned override is not already
obsolete on the active development line; exact-pin fixtures remain the removal
authority.

The exact 1.6.1 confirmation is posted at:

https://github.com/open-gsd/gsd-core/issues/1697#issuecomment-4965209848

## Semantic Options

### Option A: Confirmed Minimal Fix

- Reuse full-roadmap `buildRoadmapPhaseVariants()` in W002.
- Union those variants with disk and archive variants.
- Deduplicate unresolved references by canonical identity.
- Keep current numeric STATE extraction and non-repairable behavior.

Outcome on memory-nexus: all Phase 32.5 false positives disappear; the three
Phase 38 rows become one warning. This resolves the confirmed upstream defect
and signal amplification without redefining phase identity.

### Option B: Narrow `N` To `N.0` Shorthand

Apply Option A, then accept integer reference `N` only when exact declared
`N.0` exists. Do not accept `N` merely because `N.1` or another child exists.

Outcome on memory-nexus: all seven W002 rows disappear because Phase 38.0 is
declared. This may fit natural historical prose, but Open GSD's current
`phaseVariants()` does not define `N` and `N.0` as equivalent. It therefore
needs explicit architectural approval and upstream-facing tests.

### Option C: Validate Authoritative STATE Fields Only

Stop scanning historical narrative and validate only current phase/frontmatter
fields. This removes stale-history noise but materially changes W002's purpose,
misses broken historical/deferred links, and diverges most from upstream.

## Research Recommendation

Default to Option A. It is the shortest evidence-backed correction, uses the
shared read model, preserves real warnings, and is most likely to upstream.

Adopt Option B only if Fable concludes that `N` to exact `N.0` is an explicit
product-level phase identity rule rather than a one-project noise suppression.
Reject Option C in this plan unless evidence proves narrative link validation
has no product value.

## Test Boundary

Extend existing `tests/runtime-overrides.test.cjs`; do not add a new root suite
that would require test-authority and compatibility-registry expansion.

Required RED fixtures before implementation:

1. checklist-only Phase 32.5 referenced repeatedly produces no W002;
2. a genuinely missing Phase 99 referenced repeatedly produces exactly one
   non-repairable W002;
3. padded/unpadded forms resolve through shared phase variants;
4. existing modern roadmap IDs do not regress;
5. Option B, if accepted, resolves `38` only through exact `38.0` and rejects a
   parent when only `38.1` exists;
6. range punctuation such as `Phase 38+` is explicitly classified rather than
   accepted accidentally.

The current STATE extractor does not recognize project-code or
milestone-prefixed references. Expanding reference extraction is a separate
behavioral change unless Fable identifies it as inseparable from a coherent
W002 contract.

## Override Cost And Controls

Composition supports whole-file replacement, so a surgical W002 source change
still requires a full `overrides/gsd-core/bin/lib/verify.cjs` snapshot. Required
controls are:

- exact upstream package version and SHA-256 in `verify.cjs.REASON.md`;
- a line-local diff limited to W002 and existing imports;
- issue #1697 and public evidence link;
- focused composed-runtime tests;
- candidate-root execution through the existing N=3 matrix;
- `check-overrides.js` staleness enforcement on every pin bump; and
- immediate removal when an exact upstream pin passes the same fixtures.

## Independence From Hosted CI

The defect and tests are local deterministic runtime behavior. They neither
consume hosted evidence nor weaken hosted policy. Completing the source change
before Plan 11D ensures the new override enters the canonical source
denominator rather than appearing after it freezes.

The plan is independent only if it stays within this boundary. It must not add
coverage-foundation machinery, change hosted workflows, treat local tests as
hosted evidence, or advance Plan 11D while Plan 11N is unavailable.

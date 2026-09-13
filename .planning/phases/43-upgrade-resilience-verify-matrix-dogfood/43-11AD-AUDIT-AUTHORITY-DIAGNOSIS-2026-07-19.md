---
phase: 43
plan: 11AD
status: evidence-only
captured: 2026-07-19
subject: package-manager audit authority
---

# Plan 11AD Audit Authority Diagnosis

## Scope

This is pre-execution evidence for pending Plan 11AD. It changes no dependency,
lockfile, suppression, audit threshold, workflow, or plan status.

## Current Contract

- The repository tracks `bun.lock` and does not track `package-lock.json`.
- `scripts/audit-check.js` delegates to `audit-ci` with npm package-manager
  semantics and fails before execution when `package-lock.json` is absent.
- Pending Plan 11AD names both locks as authorities and proposes adding the npm
  lock while upgrading CycloneDX.
- Project WoW is Bun-first, so a second dependency graph requires explicit
  justification, regeneration ownership, and parity proof.

## Bun-Native Probe

Installed Bun `1.3.5` supports `audit --json`, `--audit-level`, and `--ignore`.
The current structured run:

- exited with status 1;
- returned eight advisories across seven packages;
- exposed advisory ID, URL, title, severity, affected range, CWE, and CVSS;
- identified the CycloneDX high through the canonical URL
  `https://github.com/advisories/GHSA-v75r-vx73-82pj`.

The CycloneDX advisory's Bun ID is numeric `1121296`. Bounded probes using
`--ignore=GHSA-v75r-vx73-82pj` and `--ignore=1121296` did not remove the finding.
A Bun-native migration therefore cannot delegate expiry-bounded suppression
semantics to that flag without additional proof.

## Decision Boundary

Two viable directions remain:

1. Keep `bun.lock` as the single graph authority. Replace the `audit-ci` adapter
   with a fail-closed Bun JSON adapter that validates schema, derives canonical
   GHSA/CVE identifiers from trusted fields, applies the existing reviewed and
   expiring suppression policy, and fails on unsuppressed high/critical results.
2. Keep `audit-ci` and deliberately add `package-lock.json`. Define one source
   of truth, deterministic no-script regeneration, exact dependency-graph
   parity checks, drift failure, and ownership for every dependency update.

OSV may remain an independent security signal but does not by itself resolve
package-manager graph authority or the existing suppression contract.

## Invariants

- High and critical findings remain blocking after reviewed suppressions.
- Tool, network, parse, schema, and lock drift failures fail closed.
- No raw ignore bypasses review dates or the maximum suppression lifetime.
- The CycloneDX upgrade remains exact-pinned and compatibility-proven.
- The chosen design owns local and hosted evidence without warning-only paths.

Fable D7 must choose the authority model and exact plan ownership before Plan
11AD implementation begins.

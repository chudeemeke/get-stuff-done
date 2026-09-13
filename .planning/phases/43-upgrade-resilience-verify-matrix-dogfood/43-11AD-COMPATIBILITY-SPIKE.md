---
phase: 43
plan: 11AD
status: evidence-only
captured: 2026-07-19
subject: "@cyclonedx/cyclonedx-npm@6.0.0"
---

# Plan 11AD CycloneDX 6 Compatibility Spike

## Scope

This is pre-execution evidence for pending Plan 11AD. It does not satisfy the
plan dependency on 11AC, change repository dependencies, or complete a task.

The spike installed exact `@cyclonedx/cyclonedx-npm@6.0.0` with lifecycle
scripts disabled in a unique system-temporary root. It then invoked that exact
CLI twice against the current worktree using the existing generator arguments:

```text
package.json
--ignore-npm-errors
--output-format JSON
--output-reproducible
--validate
--mc-type application
--output-file <isolated-output>
```

The verified-contained temporary root and both generated BOMs were deleted
after the probe.

## Registry Evidence

- npm `latest`: `6.0.0`
- registry metadata modified: `2026-07-07T12:06:26.978Z`
- Node engine: `>=20.18.0`
- npm engine: `>=9`
- local probe runtime: Node `v22.17.1`
- installed CLI self-report: `6.0.0`

The target is compatible with the project's declared Node 20/22 policy, but
Plan 11AD must re-resolve registry authority immediately before installation.

## Result

Both invocations exited zero and CLI validation passed.

| Evidence | Observed value |
| --- | --- |
| BOM format | `CycloneDX` |
| Specification | `1.6` |
| Root component | `get-stuff-done@3.0.2` |
| Root type | `application` |
| Components | 594 |
| Output size | 1,033,692 bytes |
| Repeated-output identity | byte-identical |
| SHA-256 | `D9FBB54285B800AD7A99DEE635C26E08FF87BC94D454B301C6825228E194D098` |

## Execution Implications

1. No CLI-argument migration is indicated by this spike; the current explicit
   generator boundary works with 6.0.0.
2. Plan 11AD still requires RED tests for the exact dependency pin, executable
   selection, argument identity, failure propagation, schema and package
   identity, and reproducibility before changing package state.
3. `tests/generate-sbom.test.js` and `package-lock.json` do not currently exist;
   the plan must create both rather than claim they were upgraded in place.
4. The worktree still pins vulnerable 4.2.1. Audit closure is unproven until the
   exact direct upgrade, both locks, audit/OSV gates, `sbom`, and `dist` pass on
   the final Plan 11AD subject.

## Supersession

Items 3 and 4 record the pre-Fable dual-lock assumption and are not current
direction. Fable D7 supersedes that assumption: `bun.lock` is the sole lock
authority, `package-lock.json` must not be created, and Plan 11AD must replace
the npm-lock-dependent audit adapter with a tested Bun-native adapter. The
CycloneDX 6 CLI compatibility result remains valid evidence.

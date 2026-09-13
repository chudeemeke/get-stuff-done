# Phase 43 Four-Metric Coverage Spike

**Date:** 2026-07-13
**Status:** Runner and source-contract direction proven; bounded assurance closure remains Plans 43-11D through 43-11K by wave order

## Decision

Keep Bun `1.3.5` as the primary functional authority. Use exact-pinned Jest
`30.4.2` to execute the unchanged root CommonJS suite in Node, set
`NODE_V8_COVERAGE` for Jest and every Node subprocess, and use exact-pinned c8
`11.0.0` to merge native process records into statements, branches, functions,
and lines. The blocking command runs Bun first, Jest second, required
`node:test` suites third, and c8 only after all functional commands are green.
This command is SHIP-08A's canonical fork-authored coverage gate. SHIP-08B is
the distinct blocking assurance gate for shipped upstream snapshot source;
umbrella SHIP-08 is green only when both children are green.

Vitest V8 was rejected. A temporary adapter made all 48 files and all 1,223
tests pass, but Vitest reported 0% because native CommonJS `require()` paths
were outside its transform coverage pipeline. A green test result paired with
zero executed-source coverage is not an acceptable gate.

## Runtime Evidence

- `bun test --coverage --coverage-reporter=lcov` passed 1,837 tests but its
  LCOV contained line records only: no function, branch, or statement records.
- The Bun coverage run also exposed the SBOM integration red at its 90-second
  child timeout. A focused diagnostic proved the actual cause: Bunx supplies
  uppercase `NPM_CONFIG_USER_AGENT`, `NPM_EXECPATH`, and
  `NPM_NODE_EXECPATH`, while `buildCycloneDxEnv()` removes lowercase keys from
  a case-sensitive copied object. CycloneDX therefore reads Bun `1.3.5` as npm.
- A disposable Vitest module-load adapter improved parity from 33/48 files and
  1,090/1,223 tests to 48/48 and 1,223/1,223. This proved the test surface is
  portable but not that Vitest can measure it.
- A disposable Jest adapter handled Bun timeout option objects, `test.skipIf`,
  the `toStartWith` matcher, and Bun's optional second `expect` argument. The
  final parity run passed 48/48 suites and 1,223/1,223 tests without editing a
  test file.
- `node --test tests/sync.test.cjs` added 153/153 passing tests and native
  subprocess coverage for the fork sync module.
- c8 required `--allowExternal` plus `--src` set from
  `fs.realpathSync(PROJECT_ROOT)` because `C:\Projects` is a junction. The
  runner still starts from the symlink path and canonicalizes evidence back to
  repository-relative POSIX paths.

All disposable configs, adapters, raw V8 records, reports, and the historical
sync test junction were containment-checked and removed after measurement.
`dist/` and dependencies were retained.

## Test API Contract

All 48 tracked root `tests/*.test.js` files import `bun:test` through CommonJS.
The adapter exports `describe`, `test`, `expect`, `beforeAll`, `beforeEach`,
`afterAll`, and `afterEach`; it also preserves the observed Bun call shapes:

- timeout option objects on `test` and `describe`;
- `test.skipIf(condition)`;
- `expect(value, diagnosticMessage)`;
- `expect(...).toStartWith(...)`.

The final adapter must be selected only by Jest's `moduleNameMapper`; Bun keeps
resolving `bun:test` directly. `./helpers` is mapped to `tests/helpers.cjs` for
Node/Jest because Bun and Node otherwise choose different existing helper
paths. No root test source is mechanically rewritten.

## Source Ownership Contract

`config/production-source-contract.json` must classify every tracked
`.js`, `.cjs`, and `.mjs` path exactly once. Coverage is computed over logical
fork-owned source, not over duplicate filesystem copies. Every canonical
`fork-source` path must also belong to exactly one coverage group. Group sets
must be exhaustive and disjoint over the resolved canonical fork set; a new
executable path, gap, or overlap fails every scoped and aggregate command.

| Classification | Contract | Coverage treatment |
|----------------|----------|--------------------|
| `fork-source` | 52 canonical executable files in the planning-time baseline across `bin/`, `hooks/`, `scripts/`, `overlay/`, `overrides/hooks/`, and `eslint.config.js`; Plan 11C's new adapter and every later tracked executable must be discovered and added at execution | Included; no ignore directives or threshold exemptions; live resolved count is evidence, not a hard-coded invariant |
| `byte-identical-runtime-mirror` | `src/**` to `overlay/src/**`, root `bin/validate-configs.js` to `overlay/bin/validate-configs.js`, and root `hooks/pre-compact.js` to `overlay/hooks/pre-compact.js` | Count canonical overlay bytes once; fail on path or SHA-256 drift |
| `upstream-snapshot-override` | `overrides/bin/install.js` and four `overrides/gsd-core/bin/lib/*.cjs` files | Outside SHIP-08A only because SHIP-08B independently blocks on exact upstream provenance, semantic/byte drift checks, named fork-delta tests, owner/removal trigger, and passing N=3 composed-package compatibility |
| `upstream-derived-repository` | tracked `get-stuff-done/**` executable paths | Excluded from fork-authored aggregate; covered by exact-pin provenance and compatibility contract |
| `test` | `tests/**` | Functional/test-support code, outside production aggregate |
| `generated` | package/build output such as `dist/**`, `hooks/dist/**`, and `overlay/get-stuff-done/**` | Never source authority; package parity and digest gates prove generated output |

Executable configuration is not a blanket exclusion: `eslint.config.js` is in
the measured fork source set. The resolver fails on an unclassified tracked
script, duplicate classification, missing path, unknown class, mirror drift,
an ungrouped or multiply grouped canonical fork path, or an upstream snapshot
without all required provenance and delta-test fields.

The five upstream snapshots are shipped production source, but their whole-file
coverage would measure upstream ownership rather than this fork's test design.
They therefore cannot disappear from assurance: SHIP-08A covers canonical
fork-authored source, while SHIP-08B blocks independently on named fork-delta
tests, exact provenance and drift, owner/removal triggers, and the common N=3
composed-package contract. The validator rejects umbrella SHIP-08 and any
"production-code coverage" claim unless both children are green. Plan 43-11C
should remove any snapshot that can be replaced by the narrower private
adapter.

## Baseline

The full disposable Jest + Node + native subprocess run measured 52 canonical
fork-authored files for the SHIP-08A baseline:

| Metric | Covered / Total | Baseline | Required |
|--------|-----------------|----------|----------|
| Statements | 10,209 / 14,403 | 70.88% | >=95% |
| Branches | 2,189 / 2,900 | 75.48% | >=95% |
| Functions | 493 / 662 | 74.47% | >=95% |
| Lines | 10,209 / 14,403 | 70.88% | >=95% |

Files below threshold: 40 statements, 42 branches, 28 functions, and 40 lines.
The count is a dated baseline, not the source contract. Plan 11D resolves the
live tracked set after Plan 11C, so the new roadmap persistence adapter and any
other intervening executable path must be classified and grouped or the gate
fails.
The largest bounded clusters are:

- launch/runtime: `bin/install.js`, `bin/gsd.js`, both `overlay/bin` entries,
  `hooks/index.js`, `hooks/gsd-context-monitor.js`, platform paths, and the
  theme barrel;
- distribution/build: compose, build, finalize, SBOM, parity, dist hygiene,
  package provenance, semantic JS, and docs lint;
- quality/performance: audit, benchmarks, debt ratchet, override check,
  performance check, cousin smoke, flake triage, OSV, and oversight probes;
- upgrade tooling: preview update, override churn, compatibility runners,
  upgrade verifier, vetted versions, and upstream-source adapter;
- hooks/sync: three hook overrides, pre-compact, and sync branch closure.

This evidence requires separate Plans 43-11E through 43-11I. A single
"fix coverage" task would be unbounded and is prohibited.

## Canonical Digests

Repository-relative POSIX paths are sorted by UTF-8 byte order. For each
canonical fork source file, hash raw bytes and append:

`<path>\0<lowercase-sha256>\n`

The source-set digest is SHA-256 over the UTF-8 concatenation. Evidence records
the source-contract and closeout-policy SHA-256 values separately. Runtime
realpaths are never persisted as source identity.

## Evidence Identity

Evidence cannot require its own commit to equal current `HEAD`; committing the
evidence necessarily creates a later commit. Each document instead carries a
role-specific commit (`measuredCodeCommit`, `checkedCommit`, or
`dogfoodCommit`), plus source-set, source-contract, and policy digests where
relevant. The validator requires that commit to be an ancestor of current
`HEAD` and recomputes current digests. Later evidence/docs-only commits are
valid only while all governed digests are unchanged.

Strict schemas use `additionalProperties: false`, constant schema versions,
required fields, bounded arrays/strings, RFC 3339 timestamps, lowercase
40-character commit SHAs, and lowercase 64-character SHA-256 values.

- Coverage: commands/exit codes, 48/1,223 Jest counts, required Node-suite
  counts, Bun counts, source identity, raw-report digest, and integer
  covered/total/pct for all four metrics.
- Compatibility: durable exact report bytes at
  `.planning/evidence/phase43-compat.json`, manifest/report digests,
  `requireAll: true`, and exactly three passing version rows with per-suite
  results. The validator consumes this Plan 11C artifact directly; no later
  plan may reconstruct it from a digest or prose.
- CI: repository, PR, `gh` version, `checkedCommit`, required checks, and
  machine-captured conclusions.
- D-7: dogfood commit/version pair, times, duration, gates, catches, friction,
  follow-ups, human confirmation, and maintenance anchor digest.
- Blocker: original/resolution/compatibility evidence digests and a provisional
  compatibility-resolved state; final resolved status is valid only after the
  Plan 11J validator accepts the durable compatibility bytes and both SHIP-08
  child contracts.
- SBOM: repository and tarball paths/digests plus byte identity.
- Closeout: policy digest, evidence digests, gate results, and `ok`.

## Cleanup Contract

The coverage launcher owns one marker-bearing OS-temp root. It sets
`NODE_V8_COVERAGE` for Jest and required Node suites, invokes c8 against the
resolved real source root, writes durable evidence only after functional and
threshold success, and removes raw/report data in `finally` on success,
functional failure, threshold failure, spawn failure, and interrupt. Cleanup
uses the marker-owned containment port from Plan 43-11A; direct recursive
deletion is forbidden.

The permanent fixture suite includes a Windows junction repository path whose
child Node process writes native V8 records while c8 resolves the real source
root. It must prove one canonical repository-relative path, non-zero execution
for the target file, no junction alias, and no duplicate source entry. A
portable symlink equivalent runs where supported, but Windows CI is required
for the junction case.

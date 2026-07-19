---
phase: 43
plan: "11AD"
type: execute
gap_closure: true
wave: 19
depends_on: ["43-11AC"]
status: pending
requirements: ["SHIP-03A", "SHIP-08"]
files_modified:
  - package.json
  - bun.lock
  - scripts/audit-check.js
  - scripts/generate-sbom.js
  - tests/audit-check.test.js
  - tests/generate-sbom.test.js
  - .planning/audits/suppressions.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AD-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "GHSA-v75r-vx73-82pj is removed by a tested direct dependency upgrade rather than suppression"
    - "the CycloneDX major upgrade preserves a valid reproducible package SBOM"
    - "bun.lock remains the sole dependency-graph authority and no package-lock.json is generated"
    - "the audit gate parses pinned-Bun JSON fail-closed and preserves blocking HIGH/CRITICAL semantics"
  artifacts:
    - "tests/generate-sbom.test.js"
    - "tests/audit-check.test.js"
    - "dist/bom.json"
    - "43-11AD-SUMMARY.md"
  key_links:
    - "CycloneDX executable contract -> generate-sbom adapter -> validated dist/bom.json"
    - "bun.lock -> Bun-native audit adapter -> expiry-bounded suppression policy"
---

<objective>
Remove the release-blocking CycloneDX advisory through a compatibility-proven
major upgrade while preserving the fork's SBOM and distribution contracts.
</objective>

<context>
@package.json
@scripts/generate-sbom.js
@tests/generate-sbom.test.js
@.planning/evidence/hosted/first-real-run-failure.json
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AD-COMPATIBILITY-SPIKE.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AD-AUDIT-AUTHORITY-DIAGNOSIS-2026-07-19.md
</context>

<tasks>

<task id="11AD-01" type="auto">
  <name>Prove and land the CycloneDX 6 compatibility boundary</name>
  <files>package.json; bun.lock; scripts/generate-sbom.js; tests/generate-sbom.test.js; .planning/audits/suppressions.json</files>
  <action>
    RED: assert the direct dependency is exact-pinned at the reviewed fixed
    major, executable discovery and arguments are explicit, child failure
    propagates, generated JSON validates as CycloneDX, required package identity
    is present, and repeated generation on identical inputs is byte-stable where
    the tool supports deterministic metadata control. Reproduce the current
    HIGH audit failure before the bump.

    GREEN: exact-pin `@cyclonedx/cyclonedx-npm@6.0.0`, regenerate `bun.lock`,
    and adapt only the narrow generator port if CLI
    or output defaults changed. Keep the direct local executable path and
    environment sanitization. Do not add an audit suppression, lower severity,
    or bypass OSV.

    REFACTOR: isolate version-sensitive flags/output normalization behind the
    generator adapter so Plan 11K can add environment portability without
    coupling to the old CLI.
  </action>
  <acceptance_criteria>
    - local audit no longer reports GHSA-v75r-vx73-82pj.
    - `bun run sbom` and `bun run dist` produce a schema-valid `dist/bom.json`.
    - package.json and bun.lock identify the same exact CycloneDX version.
    - suppressions contain no entry for the advisory or upgraded package.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/generate-sbom.test.js</automated>
    <automated>bun run audit:ci</automated>
    <automated>bun run sbom</automated>
    <automated>bun run dist</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AD-02" type="auto">
  <name>Replace dual-lock audit delegation with one Bun-native authority</name>
  <files>package.json; bun.lock; scripts/audit-check.js; tests/audit-check.test.js; .planning/audits/suppressions.json</files>
  <action>
    RED: add pinned Bun 1.3.5 JSON fixtures where HIGH or CRITICAL advisories
    fail; a valid unexpired suppression passes while reporting the suppressed
    finding; an expired suppression, malformed JSON, schema drift, network or
    tool failure, missing advisory URL, and a URL without one strict canonical
    GHSA identifier all fail closed. Prove the live CycloneDX advisory can
    disappear only through Task 11AD-01's dependency upgrade, never suppression.

    GREEN: replace `audit-ci` delegation with a structured no-shell adapter over
    `bun audit --json`. Validate the observed Bun 1.3.5 schema, derive canonical
    GHSA IDs only from strictly validated advisory URLs, apply the existing
    expiry-bounded suppression policy in-process, and retain blocking
    HIGH/CRITICAL semantics. Remove `audit-ci` if no consumer remains. Never
    create or track `package-lock.json`; OSV remains an independent signal, not
    a substitute for package-manager graph authority.

    REFACTOR: keep command execution, JSON decoding, schema validation,
    canonical-ID extraction, suppression policy, and verdict calculation behind
    injected ports. If pinned-Bun output cannot be validated fail-closed, stop
    and obtain a new architecture decision before considering dual locks.
  </action>
  <acceptance_criteria>
    - Bun audit failures, malformed output, schema drift, and URL-less advisories fail closed.
    - only valid, unexpired, reviewed suppressions affect the verdict and remain visible in output.
    - HIGH and CRITICAL findings remain blocking.
    - bun.lock is the sole dependency graph and package-lock.json is absent.
    - audit-ci is absent unless a separately proven consumer still requires it.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/audit-check.test.js tests/generate-sbom.test.js</automated>
    <automated>bun run audit:ci</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A suppression would make CI green while leaving a shell-injection advisory in
the supply-chain attestation path. A blind major bump could silently alter SBOM
shape or contents, while an untested second lock would create permanent graph
drift. One Bun graph authority, strict JSON validation, RED-GREEN adapter tests,
and output validation make those failure modes visible.
</threat_model>

<verification>
- `bun run test -- tests/audit-check.test.js tests/generate-sbom.test.js`
- `bun run audit:ci`
- `bun run dist`
- focused four-metric coverage at or above 95% for changed generator code
- `git diff --check`
</verification>

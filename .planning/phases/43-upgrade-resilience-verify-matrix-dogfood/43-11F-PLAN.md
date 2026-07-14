---
phase: 43
plan: "11F"
type: execute
gap_closure: true
wave: 20
depends_on: ["11E"]
status: pending
requirements: ["SHIP-03A", "SHIP-08A"]
files_modified:
  - scripts/build.js
  - scripts/check-no-test-files-in-dist.js
  - scripts/check-parity.js
  - scripts/compose.js
  - scripts/finalize-dist.js
  - scripts/generate-sbom.js
  - scripts/lib/package-provenance.js
  - scripts/lib/semantic-js.js
  - scripts/lint-docs.js
  - tests/*.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11F-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "distribution/build tooling reaches 95% in every metric"
    - "composed output, SBOM, and package provenance remain deterministic"
    - "generated artifacts are validated but never become source authority"
  artifacts:
    - "43-11F-SUMMARY.md"
  key_links:
    - "compose/build/finalize -> dist package -> parity and hygiene gates"
    - "SBOM source environment -> dist/bom.json -> SHIP-03A"
---

<objective>
Close coverage for the bounded distribution and build pipeline while preserving
deterministic composed-package behavior.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@scripts/compose.js
@scripts/build.js
@scripts/finalize-dist.js
@scripts/generate-sbom.js
</context>

<tasks>

<task id="11F-01" type="auto">
  <name>Close compose, build, and finalize coverage</name>
  <files>scripts/compose.js; scripts/build.js; scripts/finalize-dist.js; scripts/check-no-test-files-in-dist.js; scripts/check-parity.js; tests/compose.test.js; tests/branding.test.js; tests/test-path-validation.test.js</files>
  <action>
    Drive RED tests from uncovered branch evidence for invalid manifests,
    missing tools/inputs, collision and cleanup errors, child bundler failure,
    parity mismatches, dist test leakage, CLI parsing, and exit propagation.
    Inject filesystem/process adapters only where needed to make error behavior
    deterministic. Keep resolve/filter/override/brand/merge stage ownership
    separate and preserve clean rebuild semantics.
  </action>
  <acceptance_criteria>
    - compose, build, finalize, parity, and dist-hygiene files are each >=95% in all metrics.
    - two identical input runs retain deterministic logical output.
    - no test file can enter `dist/` undetected.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/compose.test.js tests/branding.test.js tests/test-path-validation.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope distribution-core</automated>
  </verify>
  <done>false</done>
</task>

<task id="11F-02" type="auto">
  <name>Close provenance, semantic, SBOM, and docs-tool coverage</name>
  <files>scripts/generate-sbom.js; scripts/lib/package-provenance.js; scripts/lib/semantic-js.js; scripts/lint-docs.js; tests/generate-sbom.test.js; tests/version-provenance.test.js; tests/check-overrides.test.js; tests/docs-gates.test.js</files>
  <action>
    Add RED tests for malformed/missing package metadata, hash/parser errors,
    CycloneDX child failures and invalid output, git tracked-file discovery
    failure, and documentation tool exit propagation. Preserve structured APIs
    and inject child execution instead of patching globals. Verify SBOM bytes in
    `dist` and the package tarball remain identical after all refactors.
  </action>
  <acceptance_criteria>
    - the `distribution-support` group is >=95% in all four metrics.
    - semantic hash fallback behavior and package provenance schemas remain green.
    - `bun run dist` produces a valid CycloneDX SBOM.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/generate-sbom.test.js tests/version-provenance.test.js tests/check-overrides.test.js tests/docs-gates.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope distribution-support</automated>
    <automated>bun run dist</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Tests that only call CLI entry blocks can miss corrupted output. Assert package
bytes, manifests, digests, exit codes, and cleanup state. Never retain generated
coverage or build trees as source, and never make a failed external tool look
successful.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope distribution-core`
- `bun run test:coverage:four-metric -- --scope distribution-support`
- `bun run dist`
- `git diff --check`
</verification>

---
phase: 43
plan: "11U"
type: execute
gap_closure: true
wave: 27
depends_on: ["43-11F"]
status: pending
requirements: ["SHIP-03A"]
files_modified:
  - scripts/generate-sbom.js
  - scripts/lib/package-provenance.js
  - scripts/lib/semantic-js.js
  - scripts/lint-docs.js
  - tests/generate-sbom.test.js
  - tests/version-provenance.test.js
  - tests/check-overrides.test.js
  - tests/docs-gates.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11U-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "distribution-support tooling reaches 95% in every metric"
    - "SBOM, package provenance, semantic hashing, and documentation gates remain fail closed"
    - "generated SBOM and package bytes remain deterministic"
  artifacts:
    - "43-11U-SUMMARY.md"
  key_links:
    - "package metadata and semantic source -> deterministic provenance"
    - "SBOM source environment -> dist/bom.json -> package tarball -> SHIP-03A"
---

<objective>
Close the bounded provenance, semantic-hash, SBOM, and documentation-tool
coverage group without coupling it to compose/build internals.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11F-SUMMARY.md
@scripts/generate-sbom.js
@scripts/lib/package-provenance.js
@scripts/lib/semantic-js.js
@scripts/lint-docs.js
</context>

<tasks>

<task id="11U-01" type="auto">
  <name>Close provenance, semantic, SBOM, and docs-tool coverage</name>
  <files>scripts/generate-sbom.js; scripts/lib/package-provenance.js; scripts/lib/semantic-js.js; scripts/lint-docs.js; tests/generate-sbom.test.js; tests/version-provenance.test.js; tests/check-overrides.test.js; tests/docs-gates.test.js</files>
  <action>
    Add RED tests for malformed or missing package metadata, hash/parser errors,
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
External tools and metadata parsers can return partial output while exiting
successfully. Exact schemas, child-process injection, byte-level package checks,
and independent coverage keep support tooling fail closed.
</threat_model>

<verification>
- `bun run test:coverage:four-metric -- --scope distribution-support`
- `bun run dist`
- `git diff --check`
</verification>

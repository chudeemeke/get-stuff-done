---
phase: 43
plan: "11K"
type: execute
gap_closure: true
wave: 18
depends_on: ["11D"]
status: pending
requirements: ["UPGRADE-05", "SHIP-03A", "SHIP-08A"]
files_modified:
  - config/production-source-contract.json
  - config/phase43-closeout-policy.json
  - scripts/generate-sbom.js
  - scripts/check-phase43-toolchain.js
  - tests/generate-sbom.test.js
  - tests/phase43-toolchain.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11K-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "the SBOM generator removes npm identity keys case-insensitively on Windows"
    - "toolchain preflight verifies the exact runtime and coverage-tool contract"
    - "the new executable preflight path is classified and grouped before any later coverage command"
  artifacts:
    - "scripts/check-phase43-toolchain.js"
    - "tests/generate-sbom.test.js"
    - "tests/phase43-toolchain.test.js"
    - "43-11K-SUMMARY.md"
  key_links:
    - "Bunx uppercase npm keys -> buildCycloneDxEnv -> CycloneDX success"
    - "closeout policy -> toolchain probe -> bounded JSON diagnostics"
    - "new toolchain executable -> production source contract -> later SHIP-08A aggregate"
---

<objective>
Fix cross-platform SBOM environment handling and establish the Phase 43
toolchain preflight in a bounded plan after the coverage/source foundation.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
@docs/decisions/004-DUAL-TEST-AUTHORITY.md
@scripts/generate-sbom.js
@tests/compose.test.js
@package.json
@.github/workflows/upgrade-verifier.yml
</context>

<tasks>

<task id="11K-01" type="auto">
  <name>Fix SBOM environment portability and prove toolchain parity</name>
  <files>config/production-source-contract.json; config/phase43-closeout-policy.json; scripts/generate-sbom.js; scripts/check-phase43-toolchain.js; tests/generate-sbom.test.js; tests/phase43-toolchain.test.js</files>
  <read_first>
    - scripts/generate-sbom.js
    - tests/compose.test.js
    - package.json
    - config/production-source-contract.json
    - config/phase43-closeout-policy.json
    - .github/workflows/upgrade-verifier.yml
  </read_first>
  <action>
    RED: add injected environment tests using lowercase, uppercase, and mixed-case
    npm identity keys, proving the copied CycloneDX environment contains none.
    Reproduce the Bunx-shaped `NPM_CONFIG_USER_AGENT=bun/1.3.5` failure before
    changing production code. Add toolchain tests for unsupported Node/Bun,
    wrong or missing exact Jest/c8 pins, Git Bash, `gh pr checks --json`, and
    Verdaccio local-versus-CI classification. Add a source-contract fixture that
    fails while the new `scripts/check-phase43-toolchain.js` path is unclassified
    or ungrouped.

    GREEN: make `buildCycloneDxEnv()` remove npm identity keys by
    case-insensitive key comparison without mutating its input. Keep the direct
    local CycloneDX executable path and existing argument contract. Add a pure,
    injectable toolchain probe plus bounded JSON CLI output. The policy owns
    minimum versions, exact runner pins, and required command capabilities.
    Use Plan 11M hosted evidence to adjudicate the existing floating-latest Bun
    policy against an exact CI pin. Record the decision and re-verification
    trigger explicitly; do not alter the machine-global Bun installation while
    other project sessions are live.
    Classify and group the new executable in the live source contract before
    running any coverage command; do not change SHIP-08A thresholds.

    Run `bun run dist` from an environment containing the uppercase Bunx keys,
    then run the complete Bun, Jest, and required Node parity commands. Do not
    retain the temporary environment workaround from research.
  </action>
  <acceptance_criteria>
    - uppercase, lowercase, and mixed-case npm identity keys are absent from the child environment.
    - `bun run dist` exits 0 under the reproduced Bunx environment.
    - every live Jest and Bun authority suite passes without authority-crossing test edits.
    - toolchain preflight reports exact Jest/c8 pins and actionable failures.
    - the Bun local/CI version policy is machine-readable, evidence-backed, and has a bump trigger.
    - the new executable is classified exactly once and assigned to exactly one coverage group.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/generate-sbom.test.js tests/phase43-toolchain.test.js tests/production-source-contract.test.js tests/compose.test.js</automated>
    <automated>bun run phase43:preflight</automated>
    <automated>bun run dist</automated>
    <automated>bun run test:coverage:four-metric -- --functional-only</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Case-sensitive environment scrubbing can pass on Unix and fail under Bunx on
Windows. A new preflight executable can also bypass SHIP-08A if it is added
after the source contract and left unclassified. Injected environment tests,
live source reconciliation, and bounded diagnostics make both failures visible.
</threat_model>

<verification>
- `bun run test -- tests/generate-sbom.test.js tests/phase43-toolchain.test.js tests/production-source-contract.test.js tests/compose.test.js`
- `bun run phase43:preflight`
- `bun run dist`
- `bun run test:coverage:four-metric -- --functional-only`
- `git diff --check`
</verification>

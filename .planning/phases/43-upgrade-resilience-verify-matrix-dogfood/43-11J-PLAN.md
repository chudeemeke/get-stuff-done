---
phase: 43
plan: "11J"
type: execute
gap_closure: true
wave: 34
depends_on: ["43-11Y"]
status: pending
requirements: ["SHIP-03A"]
files_modified:
  - config/production-source-contract.json
  - config/phase43-closeout-policy.json
  - config/schemas/phase43/source-contract.schema.json
  - config/schemas/phase43/coverage.schema.json
  - config/schemas/phase43/compatibility.schema.json
  - config/schemas/phase43/ci.schema.json
  - config/schemas/phase43/d7.schema.json
  - config/schemas/phase43/blocker-state.schema.json
  - config/schemas/phase43/sbom-package.schema.json
  - config/schemas/phase43/closeout.schema.json
  - scripts/validate-phase43-evidence.js
  - tests/validate-phase43-evidence.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11J-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "strict schemas reject extra, malformed, stale, or semantically contradictory evidence"
    - "the validator core is pure and consumes the committed 11D/11W contracts without semantic drift"
    - "SHIP-08 cannot pass unless SHIP-08A and SHIP-08B pass independently"
    - "candidate D-7 evidence validates a canonical candidate-facts digest while human confirmation remains pending"
    - "final closeout accepts only an explicit confirmed transition bound to the corrected candidate digest and correction ledger"
  artifacts:
    - "config/schemas/phase43/source-contract.schema.json"
    - "config/schemas/phase43/coverage.schema.json"
    - "config/schemas/phase43/compatibility.schema.json"
    - "config/schemas/phase43/ci.schema.json"
    - "config/schemas/phase43/d7.schema.json"
    - "config/schemas/phase43/blocker-state.schema.json"
    - "config/schemas/phase43/sbom-package.schema.json"
    - "config/schemas/phase43/closeout.schema.json"
    - "scripts/validate-phase43-evidence.js"
    - "43-11J-SUMMARY.md"
  key_links:
    - "strict schemas plus policy -> pure validator decisions"
    - "source, policy, and evidence digests -> non-self-referential lineage"
    - "D-7 candidate mode -> human confirmation -> strict closeout mode"
---

<objective>
Implement and test the strict schema and pure-validation contract for Phase 43
evidence without wiring CI or performing final measurement and transition.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11Y-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11W-SUMMARY.md
@config/phase43-closeout-policy.json
</context>

<tasks>

<task id="11J-01" type="auto">
  <name>Define strict source, coverage, compatibility, and CI schemas</name>
  <files>config/schemas/phase43/source-contract.schema.json; config/schemas/phase43/coverage.schema.json; config/schemas/phase43/compatibility.schema.json; config/schemas/phase43/ci.schema.json; tests/validate-phase43-evidence.test.js</files>
  <action>
    RED: add strict negative fixtures for source contract, coverage,
    compatibility, and CI. Reject schema extras, malformed timestamps, SHAs or
    digests, anything other than exactly three passing `requireAll` rows, report
    digest mismatch, any metric below 95, missing/non-success required CI, an
    SHIP-08A artifact labeled whole-production coverage, unclassified shipped
    snapshots, missing SHIP-08B provenance/drift/delta/owner/removal/N=3 fields,
    and coverage-group gaps or overlaps.

    GREEN: add four `additionalProperties: false` schemas with shared canonical
    SHA, digest, timestamp, metric, and path definitions. Keep SHIP-08A and
    SHIP-08B separate in shape and meaning.

    REFACTOR: remove fixture duplication without weakening exact field sets.
  </action>
  <acceptance_criteria>
    - every schema negative fixture fails on its exact field or invariant.
    - SHIP-08A cannot be labeled whole-production coverage.
    - compatibility requires exactly three complete passing rows.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/validate-phase43-evidence.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11J-02" type="auto">
  <name>Define strict D-7, blocker, package, and closeout schemas</name>
  <files>config/phase43-closeout-policy.json; config/schemas/phase43/d7.schema.json; config/schemas/phase43/blocker-state.schema.json; config/schemas/phase43/sbom-package.schema.json; config/schemas/phase43/closeout.schema.json; tests/validate-phase43-evidence.test.js</files>
  <action>
    RED: add strict negative fixtures for D-7, blocker, SBOM/tarball, and closeout
    results. Reject schema extras, tarball/SBOM mismatch, a SHIP-08 umbrella pass
    when either child is red, premature Plan 11 state, and any Phase 43 SHIP-03B
    completion claim.

    Add paired D-7 fixtures. Define `candidateFactsSha256` as lowercase SHA-256
    over canonical JSON for all structured and rendered dogfood facts excluding
    the `humanConfirmation` object, with recursively sorted object keys,
    preserved array order, UTF-8 encoding, and one LF. Candidate validation
    accepts complete machine fields with
    `humanConfirmation: { status: pending, candidateFactsSha256,
    confirmedAt: null, corrections: [] }`. Closeout rejects that record and
    accepts only `status: confirmed`, the exact recomputed candidate-facts
    digest, an RFC 3339 `confirmedAt`, and a strict correction ledger whose
    field/before/after/reason entries agree with the corrected structured and
    rendered values. No user identity is invented.

    GREEN: add the remaining four `additionalProperties: false` schemas and the
    declarative closeout policy. Evidence uses role-specific
    `measuredCodeCommit`, `checkedCommit`, or `dogfoodCommit`; generic `headSha`
    is forbidden. Preserve separate candidate D-7 and final closeout shapes.

    REFACTOR: centralize cross-schema constants while retaining strict
    additional-property rejection.
  </action>
  <acceptance_criteria>
    - candidate D-7 validation and strict closeout differ only at the explicit digest-bound human-confirmation boundary.
    - SHIP-08 remains red unless SHIP-08A and SHIP-08B are independently green.
    - package evidence cannot claim SHIP-03B or pass on a digest mismatch.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/validate-phase43-evidence.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11J-03" type="auto">
  <name>Implement the pure evidence validator core</name>
  <files>config/production-source-contract.json; scripts/validate-phase43-evidence.js; tests/validate-phase43-evidence.test.js</files>
  <action>
    RED: add cross-artifact fixtures for non-ancestor subject commits, changed
    governed digests, schema-valid but semantically contradictory evidence,
    keyword-rich prose over red machine fields, and every distinct core
    decision boundary.

    GREEN: implement a pure validator core with injected filesystem, git, CI,
    and package-evidence ports. Later evidence/docs-only commits pass only while
    recomputed source-set, source-contract, and policy digests are unchanged and
    the measured subject is an ancestor. Define distinct decisions for
    candidate D-7, production assurance, Plan 11 transition, and final closeout
    without performing I/O.

    Add the validator executable to the live production source contract and
    exactly one `closeout-evidence` group. Preserve the committed 11D/11W
    semantic contract and fail if its digests or ownership rules drift.

    REFACTOR: keep schemas/policy, pure validation, and port interfaces separate.
    This plan must not edit CI, write final evidence, or change Plan 11 status.
  </action>
  <acceptance_criteria>
    - every cross-artifact negative fixture exits non-zero with its exact failed gate.
    - keyword-rich prose cannot override red machine fields.
    - the validator executable is classified and grouped exactly once.
    - Plan 43-11 remains blocked and its summary remains absent.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/validate-phase43-evidence.test.js tests/production-source-contract.test.js</automated>
    <automated>node scripts/validate-phase43-evidence.js --help</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Loose schemas and combined I/O make semantic drift, stale lineage, and prose
overrides hard to detect. Explicit schemas and a pure core make every evidence
decision deterministic before CI and live artifacts enter the boundary.
</threat_model>

<verification>
- `bun run test -- tests/validate-phase43-evidence.test.js tests/production-source-contract.test.js`
- `node scripts/validate-phase43-evidence.js --help`
- `git diff --check`
</verification>

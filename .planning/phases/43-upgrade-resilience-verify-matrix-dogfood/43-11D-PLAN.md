---
phase: 43
plan: "11D"
type: execute
gap_closure: true
wave: 19
depends_on: ["43-11R"]
status: pending
requirements: []
files_modified:
  - .planning/evidence/hosted/plan11d-entry.json
  - package.json
  - bun.lock
  - config/production-source-contract.json
  - jest.coverage.config.cjs
  - scripts/lib/production-source-contract.js
  - tests/helpers/jest-bun-test-adapter.cjs
  - tests/production-source-contract.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Bun remains the primary functional authority through the Plan 11M adapter"
    - "Jest executes the explicit live Bun-authority CommonJS suite set under Node"
    - "every tracked executable path has one explicit ownership classification"
    - "coverage groups are exhaustive and disjoint over the canonical fork source set"
    - "denominator changes are explicit reviewed diffs rather than silent reclassification"
    - "shipped upstream snapshots remain blocking through a separate assurance contract"
    - "the fully finalized Plan 11R head receives a second tracked exact-head hosted envelope before the first source edit"
  artifacts:
    - "config/production-source-contract.json"
    - "jest.coverage.config.cjs"
    - "scripts/lib/production-source-contract.js"
    - "tests/helpers/jest-bun-test-adapter.cjs"
    - "43-11D-SUMMARY.md"
  key_links:
    - "tracked executable paths -> production source contract -> exact ownership and group partition"
    - "bun:test imports -> Jest moduleNameMapper -> jest-bun-test-adapter.cjs"
    - "SHIP-08A fork source -> separate SHIP-08B snapshot assurance"
    - "finalized Plan 11R head -> second hosted recertification -> first Plan 11D source edit"
---

<objective>
Define the exact production-source ownership contract and prove unchanged
CommonJS functional parity under Jest without introducing coverage orchestration.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11C-PLAN.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11R-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md
@docs/decisions/004-DUAL-TEST-AUTHORITY.md
@package.json
@bunfig.toml
@tests/helpers.cjs
</context>

<tasks>

<task id="11D-00" type="auto">
  <name>Recertify the finalized Plan 11R head before source work</name>
  <files>.planning/evidence/hosted/plan11d-entry.json</files>
  <action>
    Require a clean tracked worktree and the committed standard GSD
    finalization of Plan 11R, including its summary and metadata. Publish that
    exact finalized head, rerun all five workflows once, and run
    `bun run phase43:hosted-verdict -- collect --pr 23 --receipt .planning/evidence/hosted/plan11d-entry.json --purpose "Plan 11D entry recertification"`
    to collect a passed hosted envelope whose PR
    head, pre/post collection head, local HEAD, and `checkedCommit` all equal
    that finalized commit. Preserve the tracked
    `.planning/evidence/hosted/post-11n.json` bytes and reverify its
    subject-bound Fable checkpoint. Run pending-envelope verification, then let
    normal GSD task completion commit the new envelope before any source edit.
    Preserve the finalized Plan 11R commit, hosted run IDs, observed time, and
    envelope digest for the Plan 11D summary.
  </action>
  <acceptance_criteria>
    - the second envelope contains a passed real-step verdict for the finalized Plan 11R checked commit.
    - the earlier post-11N envelope and Fable checkpoint remain unchanged and valid.
    - the new envelope is committed by task completion before Task 11D-01 edits source.
  </acceptance_criteria>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-pending --pr 23 --receipt .planning/evidence/hosted/plan11d-entry.json</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-hosted-CI checkpoint" --manifest .planning/evidence/fable/post-hosted-ci-input.json --receipt .planning/evidence/fable/post-hosted-ci-receipt.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="11D-01" type="auto">
  <name>Define the fail-closed production source and ownership contract</name>
  <files>config/production-source-contract.json; scripts/lib/production-source-contract.js; tests/production-source-contract.test.js</files>
  <read_first>
    - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
    - docs/decisions/004-DUAL-TEST-AUTHORITY.md
    - scripts/lib/owned-temp.js
  </read_first>
  <action>
    Before the first source edit, strictly verify the tracked
    `.planning/evidence/hosted/plan11d-entry.json` against current `HEAD`.
    Require its `checkedCommit` ancestry and unchanged governed digests. Fail
    without editing if it is absent, untracked, stale, unavailable, or invalid.
    Later TDD source commits intentionally invalidate its governed-digest
    continuity and do not purport to remain certified by this entry envelope;
    it remains tracked as durable authorization history.

    RED: add contract fixtures that reject an unclassified tracked JavaScript
    path, duplicate classification, missing path, unknown class, executable
    config exclusion, non-identical mirror, path escape, reparse escape, group
    gap, group overlap, and an upstream snapshot missing exact provenance,
    named delta tests, owner, removal trigger, drift gate, or N=3 evidence
    binding. Test the canonical UTF-8 path/file digest algorithm and require an
    explicit machine-readable diff for every denominator addition, removal, or
    reclassification.

    GREEN: implement a pure source resolver and declarative contract using the
    ownership classes from `43-COVERAGE-SPIKE.md`. Record 52 files only as the
    planning-time baseline; resolve the live tracked set after Plans 11C and
    11L, and fail closed for every future tracked executable path. Require
    coverage groups to form an exhaustive, disjoint partition of the canonical
    `fork-source` set before any scoped run. SHIP-08A owns that measured set;
    SHIP-08B owns every shipped upstream snapshot and cannot be inferred from
    SHIP-08A metrics. Count byte-identical mirrors once and reject mirror drift.
    Persist the canonical source-set, source-contract, group-partition, and
    SHIP-08B contract digests for later identity checks.

    REFACTOR: keep classification, canonicalization, digesting, and diffing as
    pure functions behind injected filesystem and git inventory ports.
  </action>
  <acceptance_criteria>
    - every tracked executable JavaScript path is classified exactly once.
    - every canonical fork path is assigned to exactly one coverage group.
    - a synthetic new executable path, group gap, group overlap, and mirror drift each fail closed.
    - denominator additions, removals, and reclassifications emit a reviewed machine-readable diff.
    - each shipped upstream snapshot carries the separate SHIP-08B contract fields.
    - canonical digests are stable across Windows and POSIX path separators.
    - the Plan 11D summary can identify the exact finalized Plan 11R commit and second hosted receipt that authorized the first edit.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/production-source-contract.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11D-02" type="auto">
  <name>Prove explicit Jest parity without changing functional authority</name>
  <files>package.json; bun.lock; jest.coverage.config.cjs; tests/helpers/jest-bun-test-adapter.cjs; tests/production-source-contract.test.js</files>
  <read_first>
    - docs/decisions/004-DUAL-TEST-AUTHORITY.md
    - package.json
    - bunfig.toml
    - tests/helpers.cjs
  </read_first>
  <action>
    RED: add adapter conformance fixtures for timeout option objects, `skipIf`,
    diagnostic `expect`, `toStartWith`, root `./helpers`, suite inventory drift,
    and accidental Node-contract leakage into the Jest partition. Prove the
    Jest input set is explicit and cannot be derived from Bun runtime discovery.

    GREEN: exact-pin `jest@30.4.2`. Add
    `tests/helpers/jest-bun-test-adapter.cjs` and map `bun:test` plus root
    `./helpers` only in `jest.coverage.config.cjs`. Derive the explicit live
    Jest input set from ADR 004's Bun-authority partition and execute those
    unchanged CommonJS tests under Node. Do not edit functional test files to
    make the secondary runner pass. Keep `bun run test` as the primary
    functional command and verify it remains green.

    REFACTOR: keep the adapter test-only; production code must not import Jest.
  </action>
  <acceptance_criteria>
    - every selected live Bun-authority CommonJS suite passes unchanged under Jest.
    - `bun run test` remains the primary functional authority and is green.
    - Jest and Node inputs are explicit, exhaustive, disjoint contracts.
    - production code has no Jest dependency.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/production-source-contract.test.js</automated>
    <automated>bunx jest --config jest.coverage.config.cjs --runInBand</automated>
    <automated>bun run test</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
An incomplete denominator or secondary runner that silently changes functional
semantics creates false assurance before measurement begins. Exact inventory,
disjoint ownership, stable digests, unchanged CommonJS inputs, and separate
snapshot assurance make those errors fail before coverage orchestration exists.
</threat_model>

<verification>
- `bun run test -- tests/production-source-contract.test.js`
- `bunx jest --config jest.coverage.config.cjs --runInBand`
- `bun run test`
- `git diff --check`
</verification>

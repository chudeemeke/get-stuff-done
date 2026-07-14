---
phase: 43
plan: "11J"
type: execute
gap_closure: true
wave: 22
depends_on: ["11I"]
status: pending
requirements: ["UPGRADE-05", "SHIP-03A", "SHIP-08", "SHIP-08A", "SHIP-08B"]
files_modified:
  - config/production-source-contract.json
  - config/phase43-closeout-policy.json
  - config/schemas/phase43/*.schema.json
  - scripts/validate-phase43-evidence.js
  - tests/validate-phase43-evidence.test.js
  - tests/ci-workflow.test.js
  - .github/workflows/ci.yml
  - .planning/evidence/phase43-coverage.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER-STATE.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-PLAN.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11J-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "the complete canonical fork-authored source set is at least 95% in all four metrics"
    - "every shipped upstream snapshot passes the separate blocking assurance contract"
    - "coverage groups are exhaustive and disjoint over the canonical fork set"
    - "later evidence-only commits cannot invalidate or self-reference measured code identity"
    - "Phase 43 closeout is decided from strict machine evidence, not prose"
    - "Plan 43-11 remains blocked until this validator accepts durable compatibility evidence and both SHIP-08 children"
    - "CI blocks on Bun functional parity and the four-metric aggregate"
  artifacts:
    - ".planning/evidence/phase43-coverage.json"
    - "config/schemas/phase43/*.schema.json"
    - "scripts/validate-phase43-evidence.js"
    - "43-11J-SUMMARY.md"
  key_links:
    - "all source groups -> c8 aggregate -> coverage evidence"
    - "measured commit plus source/policy digests -> validator -> evidence-only commit acceptance"
    - "strict schemas plus policy -> closeout gates -> CI"
---

<objective>
Prove aggregate fork-authored four-metric compliance, validate the separate
shipped-snapshot assurance contract, create non-self-referential structured
evidence, and make final production-assurance gates blocking in CI.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COVERAGE-SPIKE.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11I-SUMMARY.md
@config/phase43-closeout-policy.json
@.github/workflows/ci.yml
</context>

<tasks>

<task id="11J-01" type="auto">
  <name>Implement and cover strict evidence validation before final measurement</name>
  <files>config/production-source-contract.json; config/phase43-closeout-policy.json; config/schemas/phase43/*.schema.json; scripts/validate-phase43-evidence.js; tests/validate-phase43-evidence.test.js; tests/ci-workflow.test.js; .github/workflows/ci.yml</files>
  <action>
    RED: add strict negative fixtures for source contract, coverage,
    compatibility, CI, D-7, blocker, SBOM/tarball, and closeout result. Reject
    schema extras, malformed timestamps/SHAs/digests, anything other than
    exactly three passing `requireAll` rows, report digest mismatch, any metric
    below 95, non-ancestor subject commits, changed governed digests,
    missing/non-success required CI, incomplete D-7, tarball/SBOM mismatch, an
    SHIP-08 umbrella pass when either child is red, an SHIP-08A artifact labeled
    as whole-production coverage, any unclassified shipped snapshot, any
    missing SHIP-08B provenance/drift/delta/owner/removal/N=3 field, a
    coverage-group gap/overlap, premature Plan 11 pending state, and any Phase
    43 claim that SHIP-03B is complete.

    GREEN: add eight `additionalProperties: false` schemas and a pure validator
    core with filesystem/git/`gh`/packing adapters. Evidence uses role-specific
    `measuredCodeCommit`, `checkedCommit`, or `dogfoodCommit`; generic `headSha`
    is forbidden. Later evidence/docs-only commits pass only while recomputed
    source-set, source-contract, and policy digests are unchanged and the
    subject commit is an ancestor. Add distinct
    `--require-production-assurance`, `--require-plan11-unblocked`, and
    transactional `refresh-production-assurance` modes. The refresh mode
    validates new governed artifacts before atomically rebinding blocker-state
    digests and restores prior bytes if post-write validation fails.

    Add `scripts/validate-phase43-evidence.js` to the live production source
    contract and exactly one `closeout-evidence` group before invoking any
    scoped coverage. Add CI capture through `gh pr checks --json` without a
    shell and SBOM capture through marker-owned package temp storage. Add a
    blocking CI job that runs preflight, Bun, the complete four-metric command,
    and real production-assurance validation; reconcile required check names
    against workflow jobs.

    REFACTOR: keep schemas/policy, pure validation, git/CI capture, and package
    capture in separate boundaries. This task must not write final coverage
    evidence, resolve the blocker, or change Plan 11 status.
  </action>
  <acceptance_criteria>
    - every negative fixture exits non-zero with its exact failed gate.
    - keyword-rich prose cannot override red machine fields.
    - the validator executable is classified exactly once and grouped exactly once.
    - SHIP-08 remains red unless SHIP-08A and SHIP-08B are independently green.
    - CI has a blocking Bun plus four-metric plus production-assurance job whose name matches policy.
    - Plan 43-11 remains blocked and its summary remains absent.
    - the `closeout-evidence` source group is >=95% in all four metrics.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/validate-phase43-evidence.test.js tests/ci-workflow.test.js tests/production-source-contract.test.js</automated>
    <automated>bun run test:coverage:four-metric -- --scope closeout-evidence</automated>
    <automated>node scripts/validate-phase43-evidence.js --help</automated>
    <automated>bash scripts/lint-workflows.sh</automated>
  </verify>
  <done>false</done>
</task>

<task id="11J-02" type="auto">
  <name>Measure the final set, validate real assurance, and unblock Plan 11</name>
  <files>.planning/evidence/phase43-coverage.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER-STATE.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-PLAN.md</files>
  <action>
    Run the complete launcher only after Task 11J-01 has added and classified
    the validator. Global reconciliation must prove an exhaustive, disjoint
    partition of the live canonical fork source set. Require zero functional
    failures and at least 95% independently for statements, branches,
    functions, and lines. Write `.planning/evidence/phase43-coverage.json`
    atomically only after success with `measuredCodeCommit`, command argv/exit
    codes, Bun/Jest/Node counts, exact runner versions, raw report digest,
    source-set/contract/policy digests, live file count, and integer metrics.
    Label it `forkAuthoredCoverage`; whole-production synonyms are forbidden.

    Consume the exact durable Plan 11C bytes at
    `.planning/evidence/phase43-compat.json` without regeneration or
    normalization. Run `--require-production-assurance` against the real
    coverage, compatibility, source-contract, policy, and provisional blocker
    artifacts. It must bind every SHIP-08B snapshot to provenance, drift, named
    delta tests, ownership/removal, and the exact three-row N=3 evidence.

    Only after that command exits zero, atomically write resolved
    `43-11-BLOCKER-STATE.json`, append final validation evidence to
    `43-11-BLOCKER.md`, and change `43-11-PLAN.md` from blocked to pending while
    retaining blocker history. Run `--require-plan11-unblocked` immediately
    against the real artifacts and post-transition files. If it fails, restore
    the three pre-transition files from their captured bytes and leave Plan 11
    blocked. Raw/report temp directories are removed through the owned-temp
    port in every outcome.
  </action>
  <acceptance_criteria>
    - all four fork-authored aggregate metrics are >=95 with integer totals matching c8 JSON.
    - the final aggregate includes the classified validator and every other live executable path.
    - compatibility and blocker evidence bind to the exact durable Plan 11C report bytes and matching digest.
    - the real production-assurance command proves SHIP-08A and SHIP-08B independently before transition.
    - original Plan 43-11 becomes pending only after pre- and post-transition validation; its summary remains absent.
    - any post-transition validation failure restores blocked state without partial blocker files.
    - raw/report temp directories are absent after success and every failure path.
  </acceptance_criteria>
  <verify>
    <automated>bun run test:coverage:four-metric -- --report .planning/evidence/phase43-coverage.json</automated>
    <automated>node scripts/validate-phase43-evidence.js --require-production-assurance</automated>
    <automated>node scripts/validate-phase43-evidence.js --require-plan11-unblocked</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Evidence committed after measurement cannot truthfully point at its own commit.
Ancestor checks plus current governed digests prevent both self-reference and
stale evidence. CI names are policy-reconciled so renamed or removed jobs fail
closed. Phase 43 cannot claim the Phase 44 release attachment.
</threat_model>

<verification>
- `bun test tests/validate-phase43-evidence.test.js tests/ci-workflow.test.js`
- `bun run test:coverage:four-metric -- --scope closeout-evidence`
- `bun run test:coverage:four-metric -- --report .planning/evidence/phase43-coverage.json`
- `node scripts/validate-phase43-evidence.js --require-production-assurance`
- `node scripts/validate-phase43-evidence.js --require-plan11-unblocked`
- `bash scripts/lint-workflows.sh`
- `git diff --check`
</verification>

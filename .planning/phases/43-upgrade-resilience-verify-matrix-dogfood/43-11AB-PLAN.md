---
phase: 43
plan: "11AB"
type: execute
gap_closure: true
wave: 36
depends_on: ["43-11AA"]
status: pending
requirements: ["SHIP-03A"]
files_modified:
  - .planning/evidence/phase43-coverage.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER-STATE.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-PLAN.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AB-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "the complete canonical fork-authored source set is at least 95% in all four metrics"
    - "every shipped upstream snapshot passes the separate blocking assurance contract"
    - "coverage and compatibility evidence bind exact governed digests and non-self-referential commits"
    - "Plan 43-11 transitions only after real pre- and post-transition validation with rollback"
  artifacts:
    - ".planning/evidence/phase43-coverage.json"
    - "43-11-BLOCKER-STATE.json"
    - "43-11AB-SUMMARY.md"
  key_links:
    - "all source groups -> exact c8 counters -> aggregate coverage evidence"
    - "coverage plus latest compatibility -> production assurance -> transactional Plan 11 transition"
---

<objective>
Measure the final governed source set, validate both production-assurance
children, and transition original Plan 11 transactionally from blocked to pending.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AA-SUMMARY.md
@.planning/evidence/phase43-compat.json
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md
@config/phase43-closeout-policy.json
</context>

<tasks>

<task id="11AB-01" type="auto">
  <name>Measure and persist exact fork-authored aggregate coverage</name>
  <files>.planning/evidence/phase43-coverage.json</files>
  <action>
    Run the complete launcher after global reconciliation proves an exhaustive,
    disjoint partition of the live canonical fork set including the classified
    validator. Require zero functional failures and at least 95% independently
    for statements, branches, functions, and lines. Atomically write coverage
    evidence only after success with `measuredCodeCommit`, command argv and exit
    codes, Bun/Jest/Node counts, exact runner versions, raw-report digest,
    source-set/contract/policy digests, live file count, and integer counters.
    Label it `forkAuthoredCoverage`; whole-production synonyms are forbidden.
    Remove all raw/report temp directories through the owned-temp port.
  </action>
  <acceptance_criteria>
    - all four aggregate metrics are independently at least 95% and match c8 integer totals.
    - every live executable fork path, including the validator, is represented exactly once.
    - evidence is non-self-referential and bound to exact governed digests.
    - no raw or report temp directory remains.
  </acceptance_criteria>
  <verify>
    <automated>bun run test:coverage:four-metric -- --report .planning/evidence/phase43-coverage.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AB-02" type="auto">
  <name>Validate production assurance and transition Plan 11 transactionally</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER-STATE.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-PLAN.md</files>
  <action>
    Consume the latest authoritative durable compatibility report from the most
    recently completed compatibility-mutating plan, currently Plan 11L, without
    regeneration or normalization. Bind exact upstream pin, report subject,
    source-contract digest, override digest, report digest, and all three N=3
    rows. Run `--require-production-assurance` against real coverage,
    compatibility, source-contract, policy, and provisional blocker artifacts;
    require every SHIP-08B snapshot's provenance, drift, named delta tests,
    ownership/removal trigger, and N=3 evidence.

    Only after success, invoke the tested journaled mode:
    `node scripts/validate-phase43-evidence.js transition-plan11 --blocker
    .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md
    --state
    .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER-STATE.json
    --plan
    .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-PLAN.md`.
    The mode, not the executor, derives and stages all three after-images,
    writes/reconciles the transition journal, retains blocker history, changes
    original Plan 11 from blocked to pending, and runs post-transition
    validation. Any write, validation, crash-recovery, or rollback problem exits
    non-zero and cannot report an unblocked state. Do not hand-edit the three
    targets and do not create the original Plan 11 summary.
  </action>
  <acceptance_criteria>
    - SHIP-08A and SHIP-08B are independently green before umbrella SHIP-08.
    - compatibility binds the exact latest authoritative durable report bytes and digests.
    - original Plan 11 becomes pending only after pre- and post-transition validation.
    - any post-transition failure restores blocked state without partial bytes.
  </acceptance_criteria>
  <verify>
    <automated>node scripts/validate-phase43-evidence.js --require-production-assurance</automated>
    <automated>node scripts/validate-phase43-evidence.js --require-plan11-unblocked</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Final measurement can omit newly added validator code, and a partial blocker
write can create a false unblocked state. Live-set reconciliation, exact lineage,
pre/post validation, captured prior bytes, and rollback keep transition atomic.
</threat_model>

<verification>
- complete four-metric report command above
- production-assurance validator
- post-transition Plan 11 validator
- `git diff --check`
</verification>

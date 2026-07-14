---
phase: 43
plan: "11Q"
type: execute
gap_closure: true
wave: 38
depends_on: ["43-11"]
status: pending
requirements: ["SHIP-03A"]
files_modified:
  - config/phase43-hosted-ci-contract.json
  - tests/verify-hosted-ci.test.js
  - .planning/evidence/hosted/post-plan11-candidate.json
  - .planning/evidence/hosted/post-plan11-final.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
  - .planning/evidence/fable/post-plan-11-input.json
  - .planning/evidence/fable/post-plan-11-receipt.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11Q-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "hosted CI first supplies a tracked candidate envelope for Fable, then a distinct tracked final envelope evaluates the reviewed Plan 11Q head"
    - "Fable leads technical and design adjudication of current whole-product evidence after hosted execution"
    - "the Phase 43 product claim remains open until Fable and the post-review hosted verdict pass"
  artifacts:
    - "43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md"
    - "43-11Q-SUMMARY.md"
  key_links:
    - "candidate head -> hosted evidence -> Fable lead decision/corrections -> final hosted verdict -> product closure"
---

<objective>
Close the product-assurance claim only after the final Plan 11 mutations receive
fresh exact-head hosted execution and a dispositioned whole-project Fable review.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
</context>

<tasks>

<task id="11Q-01" type="auto">
  <name>Reconcile the final hosted-CI authority contract</name>
  <files>config/phase43-hosted-ci-contract.json; tests/verify-hosted-ci.test.js</files>
  <action>
    RED: extend hosted-verdict fixtures so the new blocking coverage/assurance
    job added by Plan 11J is required and its absence fails. GREEN: reconcile
    the versioned hosted CI contract to the final workflow topology and rerun
    focused verifier tests.

    Commit the reconciled contract and tests through normal task completion so
    the next task can publish and evaluate an exact committed candidate head.
  </action>
  <acceptance_criteria>
    - focused tests prove the final blocking CI job is part of the hosted contract.
    - contract/workflow drift fails focused fixtures before any hosted run.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/verify-hosted-ci.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11Q-02" type="auto">
  <name>Collect and commit the post-Plan-11 candidate hosted envelope</name>
  <files>.planning/evidence/hosted/post-plan11-candidate.json</files>
  <action>
    Publish the committed Task 11Q-01 candidate through the normal branch/PR
    workflow and run `bun run phase43:hosted-verdict -- collect --pr 23
    --receipt .planning/evidence/hosted/post-plan11-candidate.json --purpose
    "Plan 11Q candidate hosted authority"`. Require
    every workflow/job in the reconciled contract, real executed steps, and
    stable equality between local and PR HEAD. Do not reuse the pre-11D
    envelope or rerun while an account lock is known active. Run read-only
    pending verification and let normal task completion commit the envelope.
    This candidate verdict supplies Fable evidence but does not authorize final
    closure.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-pending --pr 23 --receipt .planning/evidence/hosted/post-plan11-candidate.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="11Q-03" type="auto">
  <name>Run the post-Plan-11 whole-project Fable checkpoint</name>
  <files>.planning/evidence/fable/post-plan-11-input.json; .planning/evidence/fable/post-plan-11-receipt.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md</files>
  <action>
    Strictly verify the now-tracked candidate envelope against current `HEAD`,
    including checked-commit ancestry and source, workflow, contract, and
    policy digest continuity. Create a checkpoint input manifest whose
    `subjectCommit` is the envelope-containing `HEAD` produced by Task 11Q-02,
    with exact tracked evidence digests and the hosted-envelope path/blob digest
    resolved from that subject tree. Preserve the envelope's `checkedCommit`
    separately as the ancestor CI authority and verify governed-digest
    continuity between it and `subjectCommit`. Run
    `node scripts/run-fable-checkpoint.js --manifest .planning/evidence/fable/post-plan-11-input.json --receipt .planning/evidence/fable/post-plan-11-receipt.json --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-Plan-11 checkpoint"`.
    The runner invokes exact `claude -p --model fable` with the standing
    whole-project review, final N=3 matrix, override provenance/churn,
    SBOM/tarball proof, SHIP-08A and SHIP-08B evidence, the fresh hosted
    envelope, cleanup result, and remaining Phase 43/44 path. Require strategic
    and implementation-level analysis of whether the product claim and release
    path are justified. Require Fable's explicit technical/design decision,
    implementation direction, prioritized corrections, and rationale; adopt it
    by default within verified project constraints.

    Record `### Post-Plan-11 checkpoint - dispositioned` and disposition every
    finding. This task may change only its listed manifest, execution receipt,
    and canonical review record. If Fable requests any product, workflow,
    contract, policy, executable-plan, roadmap, state, or validation correction
    outside that declared file set, record the required correction and halt
    before summary creation or plan completion; do not mutate the active indexed
    graph or its synchronized read models. Run the full GSD planner/plan-checker
    revision loop, add a reviewed TDD corrective plan when source work is
    required, then restart execute-phase so `phase-plan-index` is regenerated.
    The restarted run must repeat this candidate-hosted/Fable cycle with a new
    immutable hosted-envelope purpose. Continue to Task 11Q-04 only when no
    accepted direction remains outside this task's bounded files.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-receipt --pr 23 --receipt .planning/evidence/hosted/post-plan11-candidate.json --subject $(git rev-parse HEAD)</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-Plan-11 checkpoint" --manifest .planning/evidence/fable/post-plan-11-input.json --receipt .planning/evidence/fable/post-plan-11-receipt.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="11Q-04" type="auto">
  <name>Obtain post-review hosted authority and record product closure</name>
  <files>.planning/evidence/hosted/post-plan11-final.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11Q-SUMMARY.md</files>
  <action>
    After the Fable record and every accepted correction are committed, publish
    that reviewed head and run `bun run phase43:hosted-verdict -- collect --pr
    23 --receipt .planning/evidence/hosted/post-plan11-final.json --purpose
    "Plan 11Q final hosted authority"` to obtain a
    second canonical exact-head hosted envelope. The post-review
    verdict, not Task 11Q-02's candidate verdict, authorizes product closure. If
    Fable changed source, workflows, contracts, or policy, rerun all affected
    local gates before publishing.

    Run pending-envelope verification, then create the docs-only summary. The
    normal task commit tracks both files while leaving governed source,
    workflow, contract, and policy digests unchanged. Record the hosted checked
    commit, Fable digest/dispositions, corrections and rerun gates, exact
    SHIP-08A metrics, SHIP-08B/N=3 digest, SBOM/tarball digest, cleanup, and the
    decision that Plan 12 may begin. Do not claim Phase 43 closeout; D-7 and
    final goal-backward verification remain.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-pending --pr 23 --receipt .planning/evidence/hosted/post-plan11-final.json</automated>
    <automated>node scripts/validate-phase43-evidence.js --require-production-assurance</automated>
    <automated>rg -n "head SHA|hosted|Fable|SHIP-08A|SHIP-08B|N=3|SBOM|cleanup|Plan 12" .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11Q-SUMMARY.md</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Pre-implementation hosted evidence cannot authorize later CI and assurance
mutations, an untracked receipt cannot survive isolated worktree cleanup, and
an undeclared correction can bypass plan review. Rebind both hosted and Fable
authority to tracked ancestor-certifying envelopes at distinct paths, prove
governed-digest continuity, and route any out-of-scope correction through a
dedicated plan.
</threat_model>

<verification>
- exact-head `phase43:hosted-verdict`
- shared Fable checkpoint validator
- affected local and hosted gates
- `git diff --check`
</verification>

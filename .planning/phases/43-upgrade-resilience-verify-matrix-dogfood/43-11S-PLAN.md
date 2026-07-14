---
phase: 43
plan: "11S"
type: execute
gap_closure: true
wave: 25
depends_on: ["43-11T"]
status: pending
requirements: []
files_modified:
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
  - .planning/evidence/fable/post-initial-coverage-input.json
  - .planning/evidence/fable/post-initial-coverage-receipt.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11S-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Fable reassesses the whole project after toolchain and first coverage closures"
    - "later plan boundaries change only through a dispositioned full replanning cycle and execute-phase restart"
    - "accepted findings cannot weaken source ownership or four-metric gates"
  artifacts:
    - "43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md"
    - "43-11S-SUMMARY.md"
  key_links:
    - "11K/11E/11T evidence -> Fable lead decision -> 11F/11U/11G/11V/11H/11Z/11I boundaries"
---

<objective>
Use Fable's standing lead developer, architect, and designer role to decide the
architecture, test-quality, closure-velocity, sequencing, and residual-risk
direction before later coverage plans proceed.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11K-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11E-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11T-SUMMARY.md
</context>

<tasks>

<task id="11S-01" type="auto">
  <name>Run and disposition the post-11K, 11E, and 11T Fable checkpoint</name>
  <files>.planning/evidence/fable/post-initial-coverage-input.json; .planning/evidence/fable/post-initial-coverage-receipt.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md</files>
  <action>
    Create a checkpoint input manifest bound to the committed Plan 11T head and
    exact evidence digests. Run
    `node scripts/run-fable-checkpoint.js --manifest .planning/evidence/fable/post-initial-coverage-input.json --receipt .planning/evidence/fable/post-initial-coverage-receipt.json --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-11K, 11E, and 11T checkpoint"`.
    The runner invokes exact `claude -p --model fable` with the standing whole-project review, all
    current program decisions and blockers, Plan 11K portability/toolchain
    evidence, 11E and 11T behavioral-test samples and metrics, closure velocity,
    refactors, and the remaining 11F/11U/11G/11V/11H/11Z/11I source groups. Require strategic and
    implementation-level analysis of the end state, architecture, sequencing,
    test quality, release risk, and maintenance consequences. Require Fable's
    explicit technical/design decision, implementation direction, prioritized
    corrections, and rationale; adopt it by default within verified project
    constraints.

    Record the exact returned review under
    `### Post-11K, 11E, and 11T checkpoint - dispositioned`, disposition every
    finding. Do not edit any downstream executable plan in this already indexed
    run. If an accepted finding requires a plan boundary, dependency, wave,
    task-count, write-set, roadmap, state, validation, or governed-source
    correction, record the exact requirement and halt before Task 11S-02,
    summary creation, or plan completion. Run the full GSD planner/plan-checker
    revision loop, add a reviewed TDD corrective plan where needed, and restart
    execute-phase so `phase-plan-index` is regenerated. Continue only when no
    graph-affecting correction is accepted. Stop if Fable is unavailable or a
    finding leaves the next plan unsafe. Do not weaken source ownership,
    95%-per-metric gates, or SHIP-08B.
  </action>
  <verify>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-11K, 11E, and 11T checkpoint" --manifest .planning/evidence/fable/post-initial-coverage-input.json --receipt .planning/evidence/fable/post-initial-coverage-receipt.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="11S-02" type="auto">
  <name>Record the review-driven continuation decision</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11S-SUMMARY.md</files>
  <action>
    Run this task only when Task 11S-01 accepted no graph-affecting correction.
    Record the review digest, finding/disposition totals, accepted directions,
    rejected-finding evidence, deferred owner/triggers, and the exact next safe
    plan. Treat this as a whole-project checkpoint, not a local plan approval.
  </action>
  <verify>
    <automated>rg -n "review digest|finding|disposition|accepted|rejected|deferred|next safe plan|whole-project" .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11S-SUMMARY.md</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
The lead checkpoint becomes theater if findings are disconnected from the
remaining graph. Bind the exact response to exhaustive dispositions, but never
rewrite executable plans under a stale phase index. Halt for full replanning and
restart execution whenever a graph correction is required.
</threat_model>

<verification>
- shared Fable checkpoint validator
- explicit no-graph-edit or halt-and-restart disposition
- `git diff --check`
</verification>

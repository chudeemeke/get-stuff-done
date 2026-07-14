---
phase: 43
plan: "11Y"
type: execute
gap_closure: true
wave: 33
depends_on: ["43-11I"]
status: pending
requirements: ["SHIP-03A"]
files_modified:
  - .planning/evidence/fable/pre-11j-input.json
  - .planning/evidence/fable/pre-11j-receipt.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11Y-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Fable compares the final assurance plan to the committed source and coverage contracts before validator edits"
    - "the review tests whole-project release claims, evidence lineage, CI authority, and detailed validator semantics"
    - "accepted executable-plan corrections halt execution for full replanning before Plans 11J, 11AA, and 11AB start"
    - "a required governed-source correction is routed through a new reviewed TDD plan"
  artifacts:
    - ".planning/evidence/fable/pre-11j-input.json"
    - ".planning/evidence/fable/pre-11j-receipt.json"
    - "43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md"
    - "43-11Y-SUMMARY.md"
  key_links:
    - "committed 11I head and all closure evidence -> Fable packet -> captured receipt"
    - "reviewed contracts -> continue unchanged or planner/checker revision plus execute-phase restart -> validator implementation"
---

<objective>
Use Fable as the standing lead developer, architect, and designer to decide the
final assurance and blocker-transition design before any closeout validator
source is edited.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11I-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11W-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11J-PLAN.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AA-PLAN.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AB-PLAN.md
</context>

<tasks>

<task id="11Y-01" type="auto">
  <name>Run and disposition the pre-validator standing Fable checkpoint</name>
  <files>.planning/evidence/fable/pre-11j-input.json; .planning/evidence/fable/pre-11j-receipt.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md</files>
  <action>
    Create a checkpoint manifest bound to the committed Plan 11I head and exact
    source-set, source-contract, policy, denominator, coverage-group, closure,
    compatibility, hosted-CI, and prior-checkpoint digests. Run
    `node scripts/run-fable-checkpoint.js --manifest .planning/evidence/fable/pre-11j-input.json --receipt .planning/evidence/fable/pre-11j-receipt.json --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Pre-11J checkpoint"`.

    The exact `claude -p --model fable` packet must include the current desired
    end state, standing review and prior dispositions, committed Plan 11D/11W
    contracts, all closure summaries, current source manifest, proposed strict
    schemas, validator ports and modes, evidence lineage, CI authority, blocker
    transition, and downstream release claims. Require Fable to compare
    semantics rather than labels and identify architecture, contract drift,
    self-reference, stale-evidence, replay, transactional rollback,
    CI-authority, maintainability, and product-claim gaps at both program and
    code-contract levels. Require an explicit technical/design decision,
    implementation direction, prioritized corrections, and rationale; adopt
    that direction by default within verified project constraints.

    Verify repository-dependent claims and disposition every finding under
    exact heading `### Pre-11J checkpoint - dispositioned`. Do not edit Plans
    11J, 11AA, 11AB, synchronized graph read models, or governed production
    source in this already indexed run. If an accepted finding requires an
    executable-plan, dependency, wave, task-count, write-set, roadmap, state,
    validation, aggregate-validator, or governed-source correction, record the
    exact requirement and halt before summary creation or plan completion. Run
    the full GSD planner/plan-checker revision loop, insert a dedicated reviewed
    TDD corrective plan where source work is required, and restart execute-phase
    so `phase-plan-index` is regenerated. Continue only when no graph-affecting
    correction is accepted.
  </action>
  <acceptance_criteria>
    - the shared validator accepts the exact committed-subject review and rejects replay.
    - Fable assesses both whole-project outcomes and detailed validator semantics.
    - every finding has one verified disposition and no executable plan is edited under the active index.
    - any accepted graph correction blocks summary/completion until replanning, plan check, and execute-phase restart.
    - Plans 11J, 11AA, and 11AB remain source-edit free until this checkpoint passes.
    - required source corrections receive their own reviewed TDD plan.
  </acceptance_criteria>
  <verify>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Pre-11J checkpoint" --manifest .planning/evidence/fable/pre-11j-input.json --receipt .planning/evidence/fable/pre-11j-receipt.json</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
The final validator can preserve field names while weakening semantics, accept
self-referential evidence, or let CI and release claims drift from local truth.
A subject-bound independent review before source edits catches those failures
without mixing leadership adjudication and implementation ownership or
mutating an executable graph after it has been indexed.
</threat_model>

<verification>
- shared Fable checkpoint validator command above
- explicit no-graph-edit or halt-and-restart disposition
- `git diff --check`
</verification>

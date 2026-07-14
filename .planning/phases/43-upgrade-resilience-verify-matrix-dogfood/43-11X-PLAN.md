---
phase: 43
plan: "11X"
type: execute
gap_closure: true
wave: 21
depends_on: ["43-11W"]
status: pending
requirements: []
files_modified:
  - .planning/evidence/fable/post-coverage-foundation-input.json
  - .planning/evidence/fable/post-coverage-foundation-receipt.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11X-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Fable leads the technical and design adjudication of the committed coverage foundation"
    - "the review binds exact subject, input/evidence digests, nonce, subprocess receipt, returned body, and dispositions"
    - "any accepted executable-plan correction halts the run for full replanning and a fresh execute-phase index"
    - "a required governed-source correction creates a reviewed corrective GSD plan rather than hidden source edits"
  artifacts:
    - ".planning/evidence/fable/post-coverage-foundation-input.json"
    - ".planning/evidence/fable/post-coverage-foundation-receipt.json"
    - "43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md"
    - "43-11X-SUMMARY.md"
  key_links:
    - "committed 11W head and evidence -> shared Fable runner -> captured receipt"
    - "Fable findings -> verified dispositions -> continue unchanged or halt for planner/checker revision and execute-phase restart"
---

<objective>
Obtain Fable's lead technical/design decision on the implemented coverage
foundation before any broad source-group closure begins.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11W-SUMMARY.md
@.planning/evidence/phase43-coverage-feasibility.json
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task id="11X-01" type="auto">
  <name>Run and disposition the post-foundation standing Fable checkpoint</name>
  <files>.planning/evidence/fable/post-coverage-foundation-input.json; .planning/evidence/fable/post-coverage-foundation-receipt.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md</files>
  <action>
    Create a checkpoint manifest bound to the committed Plan 11W head and the
    exact source-contract, denominator, policy, feasibility, classified-diff,
    runner-sample, and test-evidence digests. Run
    `node scripts/run-fable-checkpoint.js --manifest .planning/evidence/fable/post-coverage-foundation-input.json --receipt .planning/evidence/fable/post-coverage-foundation-receipt.json --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-coverage-foundation checkpoint"`.

    The shared runner must invoke exact `claude -p --model fable` with a
    cold-readable packet containing the standing whole-project review, current
    end state and critical path, denominator manifest/diff, raw runner samples,
    feasibility verdicts, fallback outcome, junction/cleanup evidence,
    anti-gaming tests, and the downstream closure graph. Require strategic,
    architectural, maintainability, test-quality, sequencing, and detailed
    implementation analysis. Require Fable's explicit technical/design
    decision, implementation direction, prioritized corrections, and rationale;
    adopt it by default within the verified project constraints. Verify
    repository-dependent claims and append the
    exact `### Post-coverage-foundation checkpoint - dispositioned` record using
    the shared Checkpoint Record Contract.

    This plan records findings and dispositions but never edits an executable
    `PLAN.md`, ROADMAP, STATE, or VALIDATION read model after execute-phase has
    built its plan index. If any accepted finding requires an executable-plan,
    dependency, wave, task-count, write-set, roadmap, state, validation, or
    governed-source correction, record the exact required correction and halt
    before summary creation or plan completion. Run the full GSD
    planner/plan-checker revision loop in the governing worktree, add a reviewed
    TDD corrective plan where source work is required, then restart
    execute-phase so `phase-plan-index` is regenerated. Continue only when no
    graph-affecting correction is accepted and every source group remains
    truthfully feasible.
  </action>
  <acceptance_criteria>
    - the checkpoint validator accepts the exact subject-bound record and rejects replay fixtures.
    - every canonical Fable finding has exactly one evidence-backed disposition.
    - no executable plan or synchronized graph read model is edited in the active indexed run.
    - any accepted graph correction produces a recorded restart requirement and blocks summary/completion.
    - no production-source correction is hidden inside the checkpoint plan.
    - the downstream graph proceeds only when every source group is truthfully feasible.
  </acceptance_criteria>
  <verify>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-coverage-foundation checkpoint" --manifest .planning/evidence/fable/post-coverage-foundation-input.json --receipt .planning/evidence/fable/post-coverage-foundation-receipt.json</automated>
    <automated>bun run test:coverage:four-metric -- --feasibility</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A one-plan tool review can miss program-level sequencing, ownership, and product
risk, while a high-level review can miss false coverage mechanics. The packet
and dispositions require both scales. Applying plan changes inside an already
indexed execution would leave stale waves and dependencies. Record the
decision, halt, replan and recheck, then restart execution from a fresh index;
source changes still require TDD and GSD review.
</threat_model>

<verification>
- shared Fable checkpoint validator command above
- `bun run test:coverage:four-metric -- --feasibility`
- explicit no-graph-edit or halt-and-restart disposition
- `git diff --check`
</verification>

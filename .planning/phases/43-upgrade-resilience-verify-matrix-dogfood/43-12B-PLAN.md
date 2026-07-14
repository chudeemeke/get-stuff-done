---
phase: 43
plan: "12B"
type: execute
wave: 40
depends_on: ["43-12"]
status: pending
requirements: ["SHIP-03A"]
files_modified:
  - .planning/evidence/hosted/phase44-entry-candidate.json
  - .planning/evidence/hosted/phase44-entry-final.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-CI-EVIDENCE.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-PHASE44-ENTRY-READINESS.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
  - .planning/evidence/fable/phase44-entry-input.json
  - .planning/evidence/fable/phase44-entry-receipt.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12B-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Fable re-adjudicates the whole project and Phase 44 entry path"
    - "readiness-packet corrections are bounded to the declared files; broader corrections require a dedicated reviewed plan"
    - "every affected machine gate is rerun after correction"
  artifacts:
    - "43-PHASE44-ENTRY-READINESS.md"
    - "43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md"
    - "43-12B-SUMMARY.md"
  key_links:
    - "Phase 44 readiness evidence -> Fable lead technical/design decision -> corrections"
    - "accepted corrections -> affected gate reruns -> final verification"
---

<objective>
Apply Fable's lead technical/design decision to the evidence-bearing Phase 44
entry packet and reverify every accepted correction before final verification.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-PHASE44-ENTRY-READINESS.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
</context>

<tasks>

<task id="12B-01" type="auto">
  <name>Collect and commit the Phase 44 entry candidate envelope</name>
  <files>.planning/evidence/hosted/phase44-entry-candidate.json</files>
  <action>
    Publish the committed Plan 12 head and run `bun run phase43:hosted-verdict
    -- collect --pr 23 --receipt
    .planning/evidence/hosted/phase44-entry-candidate.json` to require a passed exact-head hosted envelope.
    Require every contract workflow/job and real executed steps. Run read-only
    pending-envelope verification, then let normal GSD task completion commit
    the envelope before Fable consumes it.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-pending --receipt .planning/evidence/hosted/phase44-entry-candidate.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="12B-02" type="auto">
  <name>Run and disposition the Phase 44 entry Fable checkpoint</name>
  <files>.planning/evidence/fable/phase44-entry-input.json; .planning/evidence/fable/phase44-entry-receipt.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-PHASE44-ENTRY-READINESS.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md</files>
  <action>
    Strictly verify the now-tracked candidate envelope against current `HEAD`,
    including checked-commit ancestry and unchanged source, workflow, contract,
    and policy digests. Create a checkpoint input manifest whose `subjectCommit`
    is the envelope-containing `HEAD` produced by Task 12B-01, with exact
    tracked evidence digests and the immutable candidate-envelope path/blob
    digest resolved from that subject tree. Preserve the envelope's
    `checkedCommit` separately as the ancestor CI authority, verify governed-
    digest continuity between it and `subjectCommit`, and include external D-7
    authority. Run
    `node scripts/run-fable-checkpoint.js --manifest .planning/evidence/fable/phase44-entry-input.json --receipt .planning/evidence/fable/phase44-entry-receipt.json --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Phase 44 entry checkpoint"`.
    The runner invokes exact `claude -p --model fable` with the standing whole-project review, final
    Phase 43 evidence, Phase 44 readiness packet, desired end state,
    architecture and critical path, hosted CI and D-7 evidence, release/support
    posture, and maintenance consequences. Require strategic and
    implementation-level analysis, including whether the current Phase 44
    boundary is sufficient. Require Fable's explicit technical/design decision,
    implementation direction, prioritized corrections, and rationale; adopt it
    by default within verified project constraints.

    Record `### Phase 44 entry checkpoint - dispositioned`, disposition every
    finding, and apply accepted corrections only to the listed Phase 44
    readiness packet and review-record files. If accepted direction requires a
    change to any other program artifact, record the required correction and
    halt before summary creation or plan completion; do not mutate an executable
    plan or synchronized graph read model in the active indexed run. Run the full
    GSD planner/plan-checker revision loop, add a reviewed TDD corrective plan
    when source work is required, rerun affected gates, and restart execute-phase
    so `phase-plan-index` is regenerated. The restarted run must repeat the
    candidate-hosted/Fable cycle with a new immutable hosted-envelope purpose.
    Stop if Fable is unavailable or a finding leaves Phase 44 entry unsafe. Do
    not convert a red Phase 43 gate into deferred debt.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-receipt --receipt .planning/evidence/hosted/phase44-entry-candidate.json --subject HEAD</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Phase 44 entry checkpoint" --manifest .planning/evidence/fable/phase44-entry-input.json --receipt .planning/evidence/fable/phase44-entry-receipt.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="12B-03" type="auto">
  <name>Reverify accepted corrections and record the final-verification handoff</name>
  <files>.planning/evidence/hosted/phase44-entry-final.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-CI-EVIDENCE.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12B-SUMMARY.md</files>
  <action>
    After Task 12B-02 commits its review record and accepted bounded corrections,
    publish that resulting committed head, rerun the full hosted workflow contract, and
    run `bun run phase43:hosted-verdict -- collect --pr 23 --receipt
    .planning/evidence/hosted/phase44-entry-final.json` to require a fresh
    exact-head passed envelope. Recapture tracked CI evidence
    from the same checked commit. Then rerun every local machine gate affected
    by the readiness classification or an accepted Fable correction, plus the
    deterministic closeout validator.

    Run pending-envelope verification. Record Fable digest/dispositions,
    corrections, exact rerun commands and
    results, hosted checked commit/receipt, unchanged governed digests after the
    docs-only summary write, cleanup, remaining owner/triggers, and the handoff
    to Plan 12C. Every Phase 43-owned gate must be green; SHIP-03B remains Phase
    44 work.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-pending --receipt .planning/evidence/hosted/phase44-entry-final.json</automated>
    <automated>node scripts/validate-phase43-evidence.js capture-ci --pr 23 --output .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-CI-EVIDENCE.json</automated>
    <automated>node scripts/validate-phase43-evidence.js --require-closeout</automated>
    <automated>rg -n "Fable|digest|disposition|correction|rerun|hosted|checked commit|cleanup|owner|trigger|Plan 12C|SHIP-03B" .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12B-SUMMARY.md</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Lead review becomes theater if corrections are not applied or remeasured, while
undeclared edits bypass review. Bind the exact response to dispositions,
immutable tracked candidate/final hosted envelopes, declared readiness files, and
post-correction machine evidence; route broader corrections through a dedicated
reviewed plan.
</threat_model>

<verification>
- shared Fable checkpoint validator
- every correction-affected gate
- deterministic Phase 43 closeout validator
- `git diff --check`
</verification>

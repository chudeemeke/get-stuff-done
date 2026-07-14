---
phase: 43
plan: "11R"
type: execute
gap_closure: true
wave: 18
depends_on: ["43-11N"]
status: pending
requirements: []
files_modified:
  - .planning/evidence/hosted/post-11n.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
  - .planning/evidence/fable/post-hosted-ci-input.json
  - .planning/evidence/fable/post-hosted-ci-receipt.json
  - .planning/STATE.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11R-SUMMARY.md
autonomous: false
must_haves:
  truths:
    - "external execution stops until the user confirms both GitHub billing recovery and a safe shared-Claude review window"
    - "the first hosted verdict is a tracked envelope bound to the committed post-11N PR/local checked commit and contains real executed steps"
    - "Fable leads the technical and design adjudication of hosted evidence at strategic and implementation scales"
    - "ordinary GSD finalization commits all tracked review, disposition, checkpoint, blocker-state, and summary bytes before recertification"
    - "Plan 11D recertifies the exact finalized Plan 11R head before its first source edit"
  artifacts:
    - ".planning/evidence/fable/post-hosted-ci-input.json"
    - ".planning/evidence/fable/post-hosted-ci-receipt.json"
    - "43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md"
    - "43-11R-SUMMARY.md"
  key_links:
    - "human external-state confirmation -> first exact-head hosted verdict -> tracked envelope commit -> Fable review"
    - "tracked Fable disposition plus GSD plan finalization -> Plan 11D entry recertification -> first source edit"
---

<objective>
Resume external Phase 43 execution through an explicit human gate, obtain real
hosted evidence, run the standing whole-project Fable review, and leave a fully
finalized tracked head for Plan 11D's pre-edit recertification.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11N-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
@config/phase43-hosted-ci-contract.json
</context>

<tasks>

<task id="11R-01" type="checkpoint:human-action" gate="blocking">
  <name>Authorize the external hosted and Fable review window</name>
  <files>None; this human checkpoint performs no tracked write.</files>
  <action>
    Confirm that the GitHub account billing lock is cleared and that the active
    shared Claude sessions can safely tolerate this project's exact
    `claude -p --model fable` review without logout, daemon restart, or token
    mutation. This confirmation is the only non-automatable action.
  </action>
  <instructions>
    Plan 11N has already implemented the hosted-verdict collector and persisted
    the zero-evidence blocker. Confirm both external-state conditions in one
    response. Do not run repository commands; the agent performs all probes,
    workflow reruns, review invocation, and evidence capture after confirmation.
  </instructions>
  <verify>
    The agent runs status-only GitHub and Claude authentication probes, then a
    non-mutating hosted-verdict probe. Any remaining billing or authentication
    failure keeps this checkpoint blocked.
  </verify>
  <resume-signal>Confirm billing is cleared and the shared Claude review window is safe.</resume-signal>
  <done>false</done>
</task>

<task id="11R-02" type="auto">
  <name>Collect and commit the first hosted evidence envelope</name>
  <files>.planning/evidence/hosted/post-11n.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md</files>
  <action>
    Verify status-only authentication without printing secrets. Publish the
    committed Plan 11N head, rerun all five workflows once, and run
    `bun run phase43:hosted-verdict -- collect --pr 23 --receipt .planning/evidence/hosted/post-11n.json`
    to require a passed hosted envelope for the exact
    PR/local checked commit with real steps. Run read-only pending-envelope
    verification before normal GSD task completion commits the envelope. The
    commit containing the envelope is intentionally later than its
    `checkedCommit`; the envelope's governed digests exclude evidence files.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-pending --receipt .planning/evidence/hosted/post-11n.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="11R-03" type="auto">
  <name>Disposition the standing Fable review from tracked hosted evidence</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md; .planning/evidence/fable/post-hosted-ci-input.json; .planning/evidence/fable/post-hosted-ci-receipt.json; .planning/STATE.md</files>
  <action>
    First run strict offline verification of the now-tracked
    `.planning/evidence/hosted/post-11n.json` envelope against current `HEAD`,
    proving its `checkedCommit` ancestry and unchanged source, workflow,
    contract, and policy digests. Bind that tracked path and blob digest from
    the committed subject into the subject-bound checkpoint manifest and run
    `node scripts/run-fable-checkpoint.js --manifest .planning/evidence/fable/post-hosted-ci-input.json --receipt .planning/evidence/fable/post-hosted-ci-receipt.json --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-hosted-CI checkpoint"`.

    The exact `claude -p --model fable` packet includes the standing review,
    hosted workflow/job/step evidence, runner-specific failures or variance,
    branch-protection drift, current end state and critical path, and the Plan
    11D entry decision. Require whole-project strategy, architecture,
    maintainability, test quality, sequencing, and detailed implementation
    analysis. Require Fable's explicit technical/design decision,
    implementation direction, prioritized corrections, and rationale. Adopt
    that direction by default unless it conflicts with verified repository
    facts, executable evidence, security/WoW, or a locked user decision. Verify
    repository-dependent claims and disposition every finding
    under exact heading `### Post-hosted-CI checkpoint - dispositioned`.

    Apply accepted corrections only to the listed canonical review record when
    governed source, workflow, contract, and policy digests remain unchanged.
    Normal task bookkeeping may update the listed blocker state, but it is not a
    path for Fable-requested graph or read-model corrections. If a governed,
    executable-plan, dependency, wave, roadmap, state, or validation correction
    is required, record it, keep the blocker, and halt before summary creation
    or plan completion;
    do not mutate the active indexed graph or synchronized read models. Run the
    full GSD planner/plan-checker revision loop, add a reviewed TDD corrective
    plan when source work is required, then restart execute-phase so
    `phase-plan-index` is regenerated and repeat the hosted/Fable cycle with a
    new immutable envelope purpose. Otherwise commit the tracked review,
    disposition, and bounded state changes. Let the standard GSD executor create and commit
    `43-11R-SUMMARY.md` during normal plan finalization; the summary must record
    run IDs, attempts, head SHA, review digest, dispositions, corrections, and
    conclusion. The fully finalized plan head, not this task commit, is the
    immutable subject that Plan 11D recertifies before editing source.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-receipt --receipt .planning/evidence/hosted/post-11n.json --subject HEAD</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-hosted-CI checkpoint" --manifest .planning/evidence/fable/post-hosted-ci-input.json --receipt .planning/evidence/fable/post-hosted-ci-receipt.json</automated>
    <automated>node dist/gsd-core/bin/gsd-tools.cjs validate consistency</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
User-owned account state and shared authentication cannot be inferred or safely
mutated. An untracked receipt would also disappear with an isolated plan
worktree. The explicit human-action gate, tracked ancestor-certifying envelope,
governed-digest continuity, and Plan 11D's recertification of the fully
finalized Plan 11R head make these boundaries machine-enforceable.
</threat_model>

<verification>
- blocking human-action gate above
- first exact-head hosted verdict and evidence-bearing Fable checkpoint
- ordinary GSD summary/state finalization committed after the disposition
- dependent Plan 11D recertification before its first source edit
</verification>

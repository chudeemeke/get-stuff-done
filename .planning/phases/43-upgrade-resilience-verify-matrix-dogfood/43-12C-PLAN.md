---
phase: 43
plan: "12C"
type: execute
wave: 41
depends_on: ["43-12B"]
status: pending
requirements: ["UPGRADE-05", "SHIP-03A", "SHIP-08", "SHIP-08A", "SHIP-08B"]
files_modified:
  - .planning/PROJECT.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-VERIFICATION.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12C-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "goal-backward verification runs only after Phase 44-entry corrections"
    - "every Phase 43 criterion is bound to current machine evidence"
    - "all six Phase 43 Fable checkpoint records are freshly revalidated by the shared authority before pass status"
    - "the latest tracked hosted envelope is strictly revalidated against the final subject before pass status"
    - "Phase 43 cannot pass while any owned gate is red"
    - "SHIP-03B remains an explicit Phase 44 handoff"
  artifacts:
    - "43-VERIFICATION.md"
    - "43-12C-SUMMARY.md"
  key_links:
    - "final evidence -> deterministic closeout validator -> goal-backward verification"
    - "Phase 43 verification -> Phase 44 entry contract"
---

<objective>
Perform final goal-backward verification after every Phase 44-entry review
correction and close Phase 43 only from current evidence.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12B-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-PHASE44-ENTRY-READINESS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
</context>

<tasks>

<task id="12C-01" type="auto">
  <name>Create the final goal-backward verification report</name>
  <files>.planning/PROJECT.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-VERIFICATION.md</files>
  <action>
    Before the closeout validator, strictly verify the tracked
    `.planning/evidence/hosted/phase44-entry-final.json` envelope against the
    final subject, including checked-commit ancestry and governed-digest
    continuity. Then rerun the shared validator against all six
    Phase 43 checkpoint manifest/receipt/record triples: Post-hosted-CI,
    Post-coverage-foundation, Post-11K/11E/11T, Pre-11J, Post-Plan-11, and Phase
    44 entry. Every invocation must recompute its subject, evidence, nonce,
    digests, lead fields, finding ledger, and dispositions successfully; a grep
    or heading check is not evidence. Then run the deterministic closeout
    validator and create `43-VERIFICATION.md`
    checking every Phase 43 success criterion against current artifacts:
    upgrade report/workflow schema, vetted N=3 evidence, semantic staleness,
    hook reconciliation, live dogfood bump and D-7, churn, SBOM/tarball,
    SHIP-08A four-metric fork coverage, SHIP-08B snapshot assurance, primary
    Bun evidence, the latest post-Fable exact-head hosted checked commit plus
    unchanged governed digests through later docs-only commits, and all
    dispositioned Fable checkpoints. Reconcile PROJECT.md active compatibility,
    blocker ownership, and current plan ownership against durable evidence and
    STATE before marking passed.
    Mark `status: passed` only when the validator returns `ok: true`. State that
    SHIP-03B remains Phase 44 work and umbrella SHIP-03 is incomplete.
  </action>
  <acceptance_criteria>
    - every Phase 43 requirement and success criterion has current evidence.
    - PROJECT.md active compatibility and ownership statements match durable evidence and STATE.
    - no `TBD`, stale digest, or red owned gate appears in a passed report.
    - SHIP-03B is not claimed as Phase 43 success or debt.
  </acceptance_criteria>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-receipt --pr 23 --receipt .planning/evidence/hosted/phase44-entry-final.json --subject $(git rev-parse HEAD)</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-hosted-CI checkpoint" --manifest .planning/evidence/fable/post-hosted-ci-input.json --receipt .planning/evidence/fable/post-hosted-ci-receipt.json</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-coverage-foundation checkpoint" --manifest .planning/evidence/fable/post-coverage-foundation-input.json --receipt .planning/evidence/fable/post-coverage-foundation-receipt.json</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-11K, 11E, and 11T checkpoint" --manifest .planning/evidence/fable/post-initial-coverage-input.json --receipt .planning/evidence/fable/post-initial-coverage-receipt.json</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Pre-11J checkpoint" --manifest .planning/evidence/fable/pre-11j-input.json --receipt .planning/evidence/fable/pre-11j-receipt.json</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-Plan-11 checkpoint" --manifest .planning/evidence/fable/post-plan-11-input.json --receipt .planning/evidence/fable/post-plan-11-receipt.json</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Phase 44 entry checkpoint" --manifest .planning/evidence/fable/phase44-entry-input.json --receipt .planning/evidence/fable/phase44-entry-receipt.json</automated>
    <automated>node scripts/validate-phase43-evidence.js --require-closeout</automated>
    <automated>rg -n "UPGRADE-01|UPGRADE-02|UPGRADE-04|UPGRADE-05|UPGRADE-07|UPGRADE-08|UPGRADE-09|SHIP-03A|SHIP-03B|SHIP-08|SHIP-08A|SHIP-08B" .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-VERIFICATION.md</automated>
  </verify>
  <done>false</done>
</task>

<task id="12C-02" type="auto">
  <name>Record Phase 43 closeout authority</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12C-SUMMARY.md</files>
  <action>
    Record validator result, verification status, exact evidence digests, PR and
    hosted CI authority, D-7 evidence, Fable checkpoint digest, cleanup, Phase
    43 requirement transitions, and the bounded SHIP-03B handoff. Update phase
    state only through normal GSD completion after this summary is valid.
  </action>
  <verify>
    <automated>rg -n "validator|verification|digest|PR|hosted CI|D-7|Fable|cleanup|SHIP-03B|Phase 44" .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12C-SUMMARY.md</automated>
    <automated>node scripts/validate-phase43-evidence.js --require-closeout</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Verification written before advisory corrections can certify stale bytes. Run
it last and require current deterministic evidence for every success claim.
</threat_model>

<verification>
- `node scripts/validate-phase43-evidence.js --require-closeout`
- six explicit `verify-fable-checkpoint.js` invocations above
- requirement references in `43-VERIFICATION.md`
- Phase 43 plan consistency
- `git diff --check`
</verification>

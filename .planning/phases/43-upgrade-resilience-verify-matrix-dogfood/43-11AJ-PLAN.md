---
phase: 43
plan: "11AJ"
type: execute
gap_closure: true
wave: 23
depends_on: ["43-11AK"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-04", "UPGRADE-05", "UPGRADE-08", "UPGRADE-09", "SHIP-03A", "SHIP-08"]
files_modified:
  - .planning/evidence/hosted/pre-public-authority.json
  - .planning/evidence/hosted/post-11n.json
  - .planning/evidence/fable/post-hosted-ci-input.json
  - .planning/evidence/fable/post-hosted-ci-receipt.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11R-SUMMARY.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md
  - scripts/setup-branch-protection.json
  - .planning/STATE.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AJ-SUMMARY.md
autonomous: false
must_haves:
  truths:
    - "no external cycle starts without explicit user authorization against the exact corrective head"
    - "every governed job proves exact event-subject execution and all five workflows pass"
    - "all governed jobs carry Tier A runner identity and all 21 runtime subjects carry valid Tier B receipts"
    - "paired performance evidence is dispositioned without silently changing the existing budget"
    - "the formal Fable checkpoint consumes a committed passed envelope through Plan 11P authority"
    - "Plan 11R is summarized only after its inherited envelope and Fable obligations are actually fulfilled"
  artifacts:
    - ".planning/evidence/hosted/post-11n.json"
    - ".planning/evidence/hosted/pre-public-authority.json"
    - ".planning/evidence/fable/post-hosted-ci-receipt.json"
    - "43-11R-SUMMARY.md"
    - "43-11AJ-SUMMARY.md"
  key_links:
    - "local corrective receipt -> user authorization -> exact-subject hosted envelope"
    - "tracked branch-protection intent -> separately approved live setting reconciliation"
    - "committed hosted envelope -> subject-bound Fable runner -> formal disposition"
    - "fulfilled inherited obligations -> truthful 11R supersession summary -> Plan 11D"
---

<objective>
Run one explicitly authorized corrected hosted cycle, obtain the first genuine
exact-subject passed envelope, execute the formal Fable checkpoint, and close the
blocked 11R branch only when its missing obligations are true.
</objective>

<context>
@.planning/evidence/hosted/pre-retry-local-authority.json
@.planning/evidence/hosted/first-real-run-failure.json
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11R-PLAN.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
@config/phase43-hosted-ci-contract.json
</context>

<tasks>

<task id="11AJ-00" type="auto">
  <name>Finalize tracked public-setting intent before requesting authorization</name>
  <files>scripts/setup-branch-protection.json; .planning/evidence/hosted/pre-public-authority.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md</files>
  <action>
    RED: prove the tracked branch-protection intent still requires the obsolete
    combined boundary context and omits the real blocking override context.
    GREEN: update only the tracked intent to the exact current workflow context
    names; do not mutate GitHub. Rerun the complete Plan 11AI local integration
    gate against this final local head and publish a new create-only
    `pre-public-authority.json` receipt. Preserve the earlier Plan 11AI receipt
    as predecessor evidence rather than replacing it.
  </action>
  <acceptance_criteria>
    - tracked protection intent names only emitted, reviewed required contexts.
    - no live repository setting changes before the human checkpoint.
    - the final local head has a create-only passed integration receipt.
  </acceptance_criteria>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-pending --pr 23 --receipt .planning/evidence/hosted/pre-public-authority.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AJ-01" type="checkpoint:human-action" gate="blocking">
  <name>Authorize the corrected external window</name>
  <files>None; this checkpoint performs no tracked write.</files>
  <action>
    Present the exact corrective commit, final local receipt digest, changed
    workflow permissions/topology, and planned single push-triggered
    five-workflow cycle. Separately present and record an approve/decline choice
    for: the phase-branch push and hosted cycle; live branch-protection context
    reconciliation; pushing the governance branch as its own PR; historical
    bot-comment cleanup; and filing the broader Open GSD classifier proposal.
    Confirm current PR/billing/auth state read-only. Do not infer approval from
    the earlier failed window or combine these public mutations into one consent.
  </action>
  <verify>
    Read-only checks confirm PR #23 is still draft at the presented local
    corrective head after publication planning, billing is clear, the local
    `pre-public-authority.json` receipt verifies strictly, and PR workflow permissions contain no diagnostic
    issue-write path. The user's explicit authorization is recorded separately
    from those technical checks.
  </verify>
  <resume-signal>Record separate decisions for the corrective PR-head cycle, protection contexts, governance PR, comment cleanup, and upstream proposal.</resume-signal>
  <done>false</done>
</task>

<task id="11AJ-02" type="auto">
  <name>Collect the exact-subject passed hosted envelope</name>
  <files>.planning/evidence/hosted/post-11n.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md</files>
  <action>
    Publish only the authorized corrective head when that item is approved. Let its PR update create the
    governed runs; do not manually multiply runs. Require all expected jobs,
    successful execution-subject steps, pinned authority, active compatibility,
    authenticated upgrade, paired performance, docs policy, and read-only PR
    permissions. Require Tier A runner metadata for every governed job and a
    valid Tier B receipt for all 18 Cousin and three performance subjects; this
    is the first permitted `hosted-runtime` consumption. Run the strict collector
    create-only. If separately approved, reconcile live branch-protection
    contexts to the already committed tracked intent and record the exact API
    response without weakening strictness or required reviews.

    If paired performance exceeds 1.25, any workflow fails, the PR head moves,
    a required receipt is absent, or an unapproved public mutation occurs,
    persist bounded failure evidence and stop. Do not
    change a budget, rerun, comment, or manufacture an envelope.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-pending --pr 23 --receipt .planning/evidence/hosted/post-11n.json</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AJ-03" type="checkpoint:human-action" gate="blocking">
  <name>Authorize the formal Fable window</name>
  <files>None; this checkpoint performs no tracked write.</files>
  <action>
    After the passed envelope is committed, verify Claude auth/quota status and
    obtain approval to consume the shared Fable window. Do not restart, log out,
    change credentials, or substitute another model.
  </action>
  <verify>
    `claude auth status` reports the expected first-party Max session without
    exposing credentials, the committed envelope verifies strictly, and the
    user explicitly confirms the quota/shared-session window. Do not consume a
    Fable call merely to probe availability.
  </verify>
  <resume-signal>Authorize the subject-bound formal Fable checkpoint against the committed passed envelope.</resume-signal>
  <done>false</done>
</task>

<task id="11AJ-04" type="auto">
  <name>Disposition Fable and close the inherited 11R obligations</name>
  <files>.planning/evidence/fable/post-hosted-ci-input.json; .planning/evidence/fable/post-hosted-ci-receipt.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11R-SUMMARY.md; .planning/STATE.md</files>
  <action>
    Verify the committed hosted envelope against the current subject, build the
    Plan 11P manifest, and run the exact subject-bound Fable checkpoint. Verify
    and disposition every finding. If source, workflow, graph, policy, or
    governed-digest corrections are requested, keep 11R blocked, author a new
    corrective plan, and restart the loop; do not mutate inside the checkpoint.

    Only after a valid approving disposition, create `43-11R-SUMMARY.md` as an
    explicit supersession closure: record Task 11R-02's failed first attempt,
    the corrective successor plans, the passed envelope, and the formal Fable
    receipt. This summary closes inherited obligations; it must not say the first
    attempt passed. Finalize 11AJ normally and leave Plan 11D to perform its
    separately authorized second exact-head recertification.

    Disposition the remaining individually gated public items without coupling
    them to Phase 43 evidence: if approved, open the governance branch as its
    own focused PR and verify its expected checks; perform only the specifically
    approved bounded bot-comment cleanup; and file the evidence-backed upstream
    classifier proposal in the user's voice. If declined or deferred, record
    the owner and trigger. None may be represented as completed implicitly.
  </action>
  <verify>
    <automated>node scripts/verify-hosted-ci.js verify-receipt --pr 23 --receipt .planning/evidence/hosted/post-11n.json --subject $(git rev-parse HEAD)</automated>
    <automated>node scripts/verify-fable-checkpoint.js --record .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md --checkpoint "Post-hosted-CI checkpoint" --manifest .planning/evidence/fable/post-hosted-ci-input.json --receipt .planning/evidence/fable/post-hosted-ci-receipt.json</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
An earlier authorization does not authorize a new public cycle, and a green run
without executed-subject proof still overclaims evidence. Separate user gates,
create-only receipts, unchanged budgets, and Plan 11P's replay-safe Fable
contract preserve authority across the external boundary.
</threat_model>

<verification>
- blocking user authorization checkpoints above
- one push-triggered five-workflow cycle only
- Tier A runner metadata for all governed jobs and Tier B receipts for all 21 runtime subjects
- strict exact-subject hosted receipt verification
- formal subject-bound Fable receipt verification
- truthful 11R supersession summary after, never before, both authorities pass
- separate recorded user decisions for protection settings, governance PR, comment cleanup, and upstream proposal
- `git diff --check`
</verification>

---
phase: 43
plan: "11AJ"
type: execute
gap_closure: true
wave: 22
depends_on: ["43-11AI"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-04", "UPGRADE-05", "UPGRADE-08", "UPGRADE-09", "SHIP-03A", "SHIP-08"]
files_modified:
  - .planning/evidence/hosted/post-11n.json
  - .planning/evidence/fable/post-hosted-ci-input.json
  - .planning/evidence/fable/post-hosted-ci-receipt.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11R-SUMMARY.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md
  - .planning/STATE.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AJ-SUMMARY.md
autonomous: false
must_haves:
  truths:
    - "no external cycle starts without explicit user authorization against the exact corrective head"
    - "every governed job proves exact event-subject execution and all five workflows pass"
    - "paired performance evidence is dispositioned without silently changing the existing budget"
    - "the formal Fable checkpoint consumes a committed passed envelope through Plan 11P authority"
    - "Plan 11R is summarized only after its inherited envelope and Fable obligations are actually fulfilled"
  artifacts:
    - ".planning/evidence/hosted/post-11n.json"
    - ".planning/evidence/fable/post-hosted-ci-receipt.json"
    - "43-11R-SUMMARY.md"
    - "43-11AJ-SUMMARY.md"
  key_links:
    - "local corrective receipt -> user authorization -> exact-subject hosted envelope"
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

<task id="11AJ-01" type="checkpoint:human-action" gate="blocking">
  <name>Authorize the corrected external window</name>
  <files>None; this checkpoint performs no tracked write.</files>
  <action>
    Present the exact corrective commit, local receipt digest, changed workflow
    permissions/topology, and planned single push-triggered five-workflow cycle.
    Confirm current PR/billing/auth state read-only and obtain explicit user
    authorization. Do not infer approval from the earlier failed window.
  </action>
  <verify>
    Read-only checks confirm PR #23 is still draft at the presented local
    corrective head after publication planning, billing is clear, the local
    receipt verifies strictly, and PR workflow permissions contain no diagnostic
    issue-write path. The user's explicit authorization is recorded separately
    from those technical checks.
  </verify>
  <resume-signal>Authorize one corrective PR-head update and its five governed workflow runs.</resume-signal>
  <done>false</done>
</task>

<task id="11AJ-02" type="auto">
  <name>Collect the exact-subject passed hosted envelope</name>
  <files>.planning/evidence/hosted/post-11n.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md</files>
  <action>
    Publish only the authorized corrective head. Let its PR update create the
    governed runs; do not manually multiply runs. Require all expected jobs,
    successful execution-subject steps, pinned authority, active compatibility,
    authenticated upgrade, paired performance, docs policy, and read-only PR
    permissions. Run the strict collector create-only.

    If paired performance exceeds 1.25, any workflow fails, the PR head moves,
    or public mutation occurs, persist bounded failure evidence and stop. Do not
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
- strict exact-subject hosted receipt verification
- formal subject-bound Fable receipt verification
- truthful 11R supersession summary after, never before, both authorities pass
- `git diff --check`
</verification>

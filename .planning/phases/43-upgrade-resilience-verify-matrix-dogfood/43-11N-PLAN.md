---
phase: 43
plan: "11N"
type: execute
gap_closure: true
wave: 16
depends_on: ["11M"]
status: in_progress
requirements: ["SHIP-08A"]
files_modified:
  - config/phase43-hosted-ci-contract.json
  - scripts/verify-hosted-ci.js
  - tests/verify-hosted-ci.test.js
  - tests/test-config-hygiene.test.js
  - package.json
  - bun.lock
  - .gitignore
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-HOSTED-CI-BLOCKER-REVIEW-2026-07-14.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11N-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "the hosted verdict is bound to the exact live PR head SHA"
    - "the PR head remains equal to local HEAD before and after evidence collection"
    - "all five expected pull-request workflows and every required job are present"
    - "a passed verdict requires completed successful jobs with real executed steps"
    - "zero-step billing-lock failures produce no hosted evidence and fail closed"
    - "the generated receipt is local and gitignored so it cannot invalidate its own SHA binding"
    - "Plan 11D cannot begin without a fresh passed receipt for the current head"
  artifacts:
    - "config/phase43-hosted-ci-contract.json"
    - "scripts/verify-hosted-ci.js"
    - "tests/verify-hosted-ci.test.js"
    - "43-HOSTED-CI-RESUME.md"
    - "43-11N-SUMMARY.md"
  key_links:
    - "GitHub PR head -> workflow runs -> required jobs/steps -> local verdict receipt"
    - "billing-lock annotations -> unavailable verdict -> Plan 11D blocker"
    - "gitignored receipt -> exact current SHA -> phase resumption preflight"
---

<objective>
Replace the ambient "hosted CI must be green" assumption with a
machine-checkable, exact-head verdict gate without weakening GitHub's authority
or creating a self-invalidating tracked evidence loop.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md
@.github/workflows/ci.yml
@.github/workflows/cousin-install.yml
@package.json
</context>

<tasks>

<task id="11N-01" type="auto">
  <name>Define and test the hosted workflow authority contract</name>
  <files>config/phase43-hosted-ci-contract.json; tests/verify-hosted-ci.test.js; tests/test-config-hygiene.test.js; package.json; bun.lock</files>
  <action>
    RED: add fixture-driven tests for exact-head success, PR-head mismatch,
    missing workflow, missing job, pending job, failed executed job, duplicate
    run attempts, and zero-step billing-lock annotations. Require five named
    workflows and the exact current CI/job matrix, including all cousin axes.

    GREEN: add a versioned JSON contract that describes expected pull-request
    workflows, exact jobs or structured counted job matrices, accepted conclusions, and
    the local receipt path. Parse the workflow YAML with a direct, exact-pinned
    YAML dependency and require its expanded job topology to match the contract.
    Keep GitHub run/job data as the authority; branch protection contexts alone
    are insufficient.

    REFACTOR: keep the evaluator pure and data-driven. Do not hard-code PR #23,
    a run ID, a head SHA, or billing text in the generic contract.
  </action>
  <acceptance_criteria>
    - every negative fixture fails before implementation and passes afterward.
    - the contract names all five current PR workflows and their required jobs.
    - duplicate historical attempts cannot override the latest attempt.
    - an absent workflow or required job fails closed.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/verify-hosted-ci.test.js tests/test-config-hygiene.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11N-02" type="auto">
  <name>Implement exact-head collection and local receipt publication</name>
  <files>scripts/verify-hosted-ci.js; package.json; .gitignore; tests/verify-hosted-ci.test.js</files>
  <action>
    Add an injectable `gh api` adapter that reads the PR head, Actions runs,
    latest jobs, and annotations only for zero-step failures. Read the PR head
    before and after collection and require both values to equal local `HEAD`.
    Evaluate the versioned contract and atomically write a schema-versioned
    receipt containing repository, PR, head SHA, run IDs, attempts, observed
    time, verdict, and diagnostics.

    The canonical `phase43:hosted-verdict` package command must exit zero only
    for a complete passed verdict. Classify the verified account billing-lock
    shape as `unavailable` with `hostedEvidenceExists: false`; do not call it a
    failed platform test. Ignore the generated receipt in Git because tracking
    it would change the certified SHA.
  </action>
  <acceptance_criteria>
    - shell execution is disabled and all GitHub arguments are positional.
    - a PR head change during collection fails closed.
    - report publication is atomic and failed collection cannot retain a stale passed receipt.
    - the live locked PR produces `unavailable`, zero hosted evidence, and exit 1.
    - no token, authorization header, or raw environment value is emitted.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/verify-hosted-ci.test.js</automated>
    <automated>bun run phase43:hosted-verdict -- --pr 23</automated>
  </verify>
  <done>false</done>
</task>

<task id="11N-03" type="auto">
  <name>Persist blocker ownership and exact resumption semantics</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-HOSTED-CI-BLOCKER-REVIEW-2026-07-14.md; .planning/STATE.md</files>
  <action>
    Record PR #23, the five zero-step runs, the exact billing annotation, local
    evidence labeled LOCAL ONLY, user ownership, and the no-evidence
    interpretation. Record Fable's safe/conditional/forbidden advice and the
    repository-truth disposition.

    Resume only after the user confirms the billing lock is cleared. Publish
    the final Plan 11N head, rerun all five workflows once, generate a passed
    receipt for the exact PR head, and only then remove the blocker and begin
    Plan 11D. Do not rerun while the account remains locked.
  </action>
  <acceptance_criteria>
    - STATE and the resume record identify `next_owner: user` in prose without inventing frontmatter.
    - locked-window runs are explicitly void as hosted evidence.
    - no remaining implementation plan is described as independent of 11D.
    - the exact resumption command and passed-receipt condition are durable.
  </acceptance_criteria>
  <verify>
    <automated>node get-stuff-done/bin/gsd-tools.cjs validate consistency</automated>
    <automated>bun run lint:docs</automated>
    <automated>git diff --check</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A green local run cannot expose hosted runner differences. A GitHub failure
with zero steps is not a product verdict, while a tracked receipt changes the
SHA it claims to certify. Bind the gate to live GitHub metadata for the exact
PR head, require the full workflow/job contract and real steps, write only a
gitignored local receipt, and fail closed on missing, pending, or unavailable
evidence.
</threat_model>

<verification>
- `bun run test -- tests/verify-hosted-ci.test.js tests/test-config-hygiene.test.js`
- `bun run phase43:hosted-verdict -- --pr 23`
- `node get-stuff-done/bin/gsd-tools.cjs validate consistency`
- `bun run lint`
- `bun run lint:docs`
- `git diff --check`
</verification>

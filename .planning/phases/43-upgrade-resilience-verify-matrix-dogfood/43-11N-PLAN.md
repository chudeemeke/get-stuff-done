---
phase: 43
plan: "11N"
type: execute
gap_closure: true
wave: 17
depends_on: ["43-11P"]
status: complete
requirements: []
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
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-PLAN.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11Q-PLAN.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11R-PLAN.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12B-PLAN.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12C-PLAN.md
  - .planning/STATE.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11N-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "the hosted verdict is bound to the exact live PR head SHA"
    - "the PR head remains equal to local HEAD before and after evidence collection"
    - "all five expected pull-request workflows and every required job are present"
    - "a passed verdict requires completed successful jobs with real executed steps"
    - "zero-step billing-lock failures produce no hosted evidence and fail closed"
    - "each hosted checkpoint writes a distinct caller-selected tracked evidence envelope beneath one repository-contained evidence directory"
    - "a later hosted verdict cannot overwrite bytes bound into an earlier Fable checkpoint"
    - "a tracked envelope certifies an ancestor checkedCommit without self-referencing its later evidence commit"
    - "later consumers require checkedCommit ancestry and unchanged source, workflow, contract, and policy digests"
    - "Plan 11R cannot start external execution until the implementation and blocker record are committed"
  artifacts:
    - "config/phase43-hosted-ci-contract.json"
    - "scripts/verify-hosted-ci.js"
    - "tests/verify-hosted-ci.test.js"
    - "43-HOSTED-CI-RESUME.md"
    - "43-11N-SUMMARY.md"
  key_links:
    - "GitHub PR head -> workflow runs -> required jobs/steps -> tracked verdict envelope"
    - "billing-lock annotations -> unavailable verdict -> Plan 11R human-action gate"
    - "immutable tracked checkpoint envelope -> ancestor checkedCommit plus governed-digest continuity -> hosted resumption preflight"
---

<objective>
Replace the ambient "hosted CI must be green" assumption with a
machine-checkable, exact-head verdict gate without weakening GitHub's authority
or creating a self-referential evidence loop.
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
    run attempts, zero-step billing-lock annotations, and `--help` returning
    concise usage with exit zero before any GitHub call. Require five named
    workflows and the exact current CI/job matrix, including all cousin axes.

    GREEN: add a versioned JSON contract that describes expected pull-request
    workflows, exact jobs or structured counted job matrices, accepted
    conclusions, the repository-relative hosted-envelope directory, and the
    canonical source, workflow, contract, and policy digest sets. Evidence files
    themselves are excluded from those governed sets so committing an envelope
    cannot change the claim it carries. Parse the
    workflow YAML with a direct, exact-pinned
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
  <done>true</done>
</task>

<task id="11N-02" type="auto">
  <name>Implement exact-head collection and tracked envelope verification</name>
  <files>scripts/verify-hosted-ci.js; package.json; .gitignore; tests/verify-hosted-ci.test.js</files>
  <action>
    Add an injectable `gh api` adapter that reads the PR head, Actions runs,
    latest jobs, and annotations only for zero-step failures. Read the PR head
    before and after collection and require both values to equal local `HEAD`.
    Require explicit `collect`, `verify-pending`, and `verify-receipt` modes and a positive
    `--receipt <path>` argument. Resolve it beneath the contract's
    repository-contained hosted-envelope directory and reject traversal,
    absolute paths, symlink/reparse escapes, or any existing destination.
    `collect` atomically writes a schema-versioned passed envelope containing
    repository, PR, `checkedCommit`, checkpoint purpose, run IDs, attempts,
    observed time, verdict, diagnostics, and canonical source, workflow,
    contract, and policy digests calculated at that checked commit. Failed,
    pending, unavailable, or interrupted collection leaves no envelope at the
    requested path. Every retry or authority event requires a new purpose and
    path; no existing envelope is ever replaced.

    Both verification modes perform no network or writes. `verify-pending`
    validates the newly created, not-yet-committed envelope against current
    `HEAD` so a GSD task can verify it before its atomic task commit.
    `verify-receipt` requires the envelope to
    be tracked in the supplied subject commit, proves `checkedCommit` is an
    ancestor of that subject, recomputes each governed digest at both commits,
    and fails if any governed byte changed. The standard GSD task commit that
    adds the new envelope is therefore later than the commit certified by CI,
    without invalidating or self-referencing the evidence. Fable manifests bind
    the tracked envelope path and digest from their committed subject, never
    ambient untracked bytes.

    The canonical `phase43:hosted-verdict` package command exposes `collect`
    and must exit zero only for a complete passed verdict. Classify the verified account billing-lock
    shape as `unavailable` with `hostedEvidenceExists: false`; do not call it a
    failed platform test. After `verify-pending` succeeds, let the normal GSD
    task commit track the immutable envelope; only the evidence paths are
    excluded from governed digests. A live locked-window probe may confirm
    `unavailable`; if billing is already clear, defer authoritative live
    collection to Plan 11R Task 11R-02 after this plan is fully committed.
    Implement `node scripts/verify-hosted-ci.js --help` as a no-network,
    side-effect-free CLI path that exits zero and documents the required
    positive `--pr` and `--receipt` arguments, all three modes, and immutable
    tracked-envelope behavior. Remove the obsolete hosted-evidence ignore entry from
    `.gitignore`; hosted envelopes are durable repository evidence.
  </action>
  <acceptance_criteria>
    - shell execution is disabled and all GitHub arguments are positional.
    - a PR head change during collection fails closed.
    - envelope publication is atomic and failed collection cannot retain a stale passed envelope.
    - distinct checkpoint purposes cannot overwrite one another's envelope bytes.
    - destinations outside the hosted-evidence directory, reparse escapes, and every existing destination fail closed.
    - pending verification is read-only and accepts only a new envelope bound to current HEAD before its GSD task commit.
    - strict offline verification succeeds only for a tracked envelope whose checked commit is an ancestor with unchanged governed digests.
    - changing a governed source, workflow, contract, or policy byte invalidates the envelope while evidence-only commits do not.
    - billing-lock fixtures produce `unavailable`, zero hosted evidence, and exit 1; a live locked probe agrees when the lock still exists.
    - no token, authorization header, or raw environment value is emitted.
    - `--help` exits zero without invoking GitHub or creating a receipt.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/verify-hosted-ci.test.js</automated>
    <automated>node scripts/verify-hosted-ci.js --help</automated>
  </verify>
  <done>true</done>
</task>

<task id="11N-03" type="auto">
  <name>Persist blocker ownership and exact resumption semantics</name>
  <files>.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-HOSTED-CI-RESUME.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-HOSTED-CI-BLOCKER-REVIEW-2026-07-14.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11D-PLAN.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11Q-PLAN.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11R-PLAN.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12B-PLAN.md; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-12C-PLAN.md; .planning/STATE.md</files>
  <action>
    Record PR #23, the five zero-step runs, the exact billing annotation, local
    evidence labeled LOCAL ONLY, user ownership, and the no-evidence
    interpretation. Record Fable's safe/conditional/forbidden advice and the
    repository-truth disposition.

    Record that normal completion of this task commits the final Plan 11N
    implementation, blocker bytes, and `43-11N-SUMMARY.md`. Plan 11R owns the
    explicit human-action gate, first hosted run, standing Fable lead checkpoint,
    and ordinary GSD finalization. Plan 11D Task 11D-01 owns post-review
    recertification of that finalized head before its first source edit. Remove
    the blocker only after that receipt passes. Do not rerun while the account
    remains locked.
  </action>
  <acceptance_criteria>
    - STATE and the resume record identify `next_owner: user` in prose without inventing frontmatter.
    - locked-window runs are explicitly void as hosted evidence.
    - no remaining implementation plan is described as independent of 11D.
    - the exact resumption command names its checkpoint-specific receipt, passed-receipt condition, and Fable gate durably.
  </acceptance_criteria>
  <verify>
    <automated>node get-stuff-done/bin/gsd-tools.cjs validate consistency</automated>
    <automated>bun run lint:docs</automated>
    <automated>git diff --check</automated>
  </verify>
  <done>true</done>
</task>

</tasks>

<threat_model>
A green local run cannot expose hosted runner differences. A GitHub failure
with zero steps is not a product verdict, while requiring a tracked envelope's
own commit to equal `checkedCommit` would create self-reference. Bind the gate
to live GitHub metadata for the exact checked commit, require the full
workflow/job contract and real steps, commit one immutable envelope per
authority event in a later evidence commit, and validate ancestry plus governed
digest continuity. Fail closed on missing, pending, unavailable, escaping,
untracked, stale, or overwrite-prone evidence.
</threat_model>

<verification>
- `bun run test -- tests/verify-hosted-ci.test.js tests/test-config-hygiene.test.js`
- `node scripts/verify-hosted-ci.js --help`
- `node get-stuff-done/bin/gsd-tools.cjs validate consistency`
- `bun run lint`
- `bun run lint:docs`
- `git diff --check`
</verification>

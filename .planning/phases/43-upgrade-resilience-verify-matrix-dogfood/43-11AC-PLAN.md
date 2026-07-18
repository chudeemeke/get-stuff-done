---
phase: 43
plan: "11AC"
type: execute
gap_closure: true
wave: 18
depends_on: ["43-11N"]
status: pending
requirements: ["UPGRADE-04", "UPGRADE-05", "UPGRADE-09", "SHIP-08"]
files_modified:
  - .bun-version
  - config/phase43-hosted-ci-contract.json
  - config/phase43-toolchain-authority.json
  - scripts/verify-hosted-ci.js
  - scripts/verify-toolchain-authority.js
  - tests/verify-hosted-ci.test.js
  - tests/toolchain-authority.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AC-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "a hosted envelope cannot pass unless every governed job proves it executed the expected event subject"
    - "PR-head metadata is not treated as proof of the commit checked out by a job"
    - "Bun and mutable hosted dependencies are governed repository inputs rather than ambient latest values"
    - "the authority checker distinguishes deliberately ranged Node compatibility from forbidden floating execution dependencies"
  artifacts:
    - "config/phase43-toolchain-authority.json"
    - "scripts/verify-toolchain-authority.js"
    - "tests/verify-hosted-ci.test.js"
    - "tests/toolchain-authority.test.js"
  key_links:
    - "governed workflow subject step -> job step conclusion -> passed hosted envelope"
    - "repository version manifest -> workflow wiring -> recorded runtime provenance"
---

<objective>
Repair the hosted authority abstraction before corrective implementation relies
on it: prove the commit each job executes and define deterministic toolchain
inputs that later workflow wiring must consume.
</objective>

<context>
@.planning/evidence/hosted/first-real-run-failure.json
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-INTERIM-REVIEW-SYNTHESIS-2026-07-18.md
@config/phase43-hosted-ci-contract.json
@scripts/verify-hosted-ci.js
@tests/verify-hosted-ci.test.js
</context>

<tasks>

<task id="11AC-01" type="auto">
  <name>Require successful per-job execution-subject evidence</name>
  <files>config/phase43-hosted-ci-contract.json; scripts/verify-hosted-ci.js; tests/verify-hosted-ci.test.js</files>
  <action>
    RED: add fixtures modelled on hosted merge `e2139a78...` that keep
    `workflow_run.head_sha` equal to the PR head while omitting, failing, or
    skipping the governed execution-subject step. Add negatives for a step with
    the right name but wrong order/status and for one required job lacking it.

    GREEN: version the hosted contract and add one required successful subject
    step for every governed source-executing job. The step's workflow
    implementation will explicitly checkout the event PR head and fail unless
    `git rev-parse HEAD` equals the expected event head. Make the collector
    require the governed step to have completed successfully before a passed
    envelope can be built. Preserve the existing PR/local head, topology,
    real-step, ancestry, and governed-digest checks.

    REFACTOR: keep job/step classification pure and inject all GitHub payloads.
    Do not scrape logs or certify an ephemeral merge commit by implication.
  </action>
  <acceptance_criteria>
    - synthetic-merge metadata without a successful governed subject step fails closed.
    - every required job is checked for the subject step, including expanded matrix jobs.
    - billing-lock, stale-head, replay, topology, and digest negatives remain green.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/verify-hosted-ci.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AC-02" type="auto">
  <name>Define repository-owned toolchain authority</name>
  <files>.bun-version; config/phase43-toolchain-authority.json; scripts/verify-toolchain-authority.js; tests/toolchain-authority.test.js; config/phase43-hosted-ci-contract.json</files>
  <action>
    RED: test rejection of `bun-version: latest`, movable GitHub Action tags in
    the five governed workflows, mutable container tags where a digest is
    required, an unrecorded performance tool, and a resolved Node major outside
    the declared 20/22 compatibility dimensions. Prove that an exact Bun pin,
    full action SHA, container digest, and recorded resolved runtime pass.

    GREEN: add `.bun-version` with the currently locally certified Bun `1.3.5`,
    a small machine-readable authority manifest, and an injectable checker.
    Distinguish exact execution dependencies from deliberate compatibility
    ranges: Bun/actions/container identity are exact; Node 20/22 remain support
    dimensions whose resolved patch is recorded. Add all authority files to the
    hosted governed digests. Plan 11AH owns live workflow conformance; this plan
    proves the checker against fixtures and intentionally does not claim current
    `latest` workflows are compliant.

    REFACTOR: expose bounded JSON diagnostics and one update trigger per pin.
    Do not change the machine-global Bun installation.
  </action>
  <acceptance_criteria>
    - the authority manifest has one unambiguous Bun SSOT and explicit ranged-versus-exact semantics.
    - fixture workflows reject floating execution dependencies and accept governed pins.
    - hosted governed digests include the authority manifest and checker.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/toolchain-authority.test.js tests/verify-hosted-ci.test.js</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
GitHub's PR metadata can identify the head while default checkout executes a
different synthetic merge. Mutable action tags and floating runtimes can also
change executed behavior without changing a governed workflow digest. A
governed fail-fast subject step plus explicit dependency authority closes both
claim gaps without parsing unstructured logs.
</threat_model>

<verification>
- `bun run test -- tests/verify-hosted-ci.test.js tests/toolchain-authority.test.js`
- focused four-metric coverage at or above 95% for both changed executable paths
- `git diff --check`
</verification>

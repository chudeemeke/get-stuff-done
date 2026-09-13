---
phase: 43
plan: "11AC"
type: execute
gap_closure: true
wave: 18
depends_on: ["43-11N"]
status: complete
requirements: ["UPGRADE-04", "UPGRADE-05", "UPGRADE-09", "SHIP-08"]
files_modified:
  - .bun-version
  - package.json
  - bun.lock
  - config/phase43-hosted-ci-contract.json
  - config/phase43-toolchain-authority.json
  - scripts/verify-hosted-ci.js
  - scripts/verify-toolchain-authority.js
  - tests/helpers/portable-test-api.js
  - tests/test-config-hygiene.test.js
  - tests/verify-hosted-ci.test.js
  - tests/toolchain-authority.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-PLAN11AC-ADJUDICATION-PACKET-2026-07-19.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-PLAN11AC-WHOLE-PROJECT-REVIEW-2026-07-19.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-PLAN11AC-AUTHORITATIVE-ADJUDICATION-2026-07-19.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AC-D6-EXTRACTION-DISPOSITION-2026-07-19.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AC-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "a hosted envelope cannot pass unless every governed job proves it started from the expected event subject before payload execution"
    - "PR-head metadata is not treated as proof of the commit checked out by a job"
    - "Bun and mutable hosted dependencies are governed repository inputs rather than ambient latest values"
    - "the authority checker distinguishes deliberately ranged Node compatibility from forbidden floating execution dependencies"
    - "byte-exact control steps do not create false runtime requirements, while every payload job declares and consumes exactly its required runtimes"
    - "an allowlisted security prelude preserves harden-runner coverage without weakening exact checkout and adjacent subject verification"
    - "hosted runtime receipts have one closed schema before workflow emission or consumption is implemented"
  artifacts:
    - "config/phase43-toolchain-authority.json"
    - ".planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AC-D6-EXTRACTION-DISPOSITION-2026-07-19.md"
    - "scripts/verify-toolchain-authority.js"
    - "tests/verify-hosted-ci.test.js"
    - "tests/toolchain-authority.test.js"
  key_links:
    - "governed workflow subject step -> pre-payload event-subject claim -> passed hosted envelope"
    - "hosted contract control-step bytes -> toolchain evaluator exemption -> exact runtime-requirement set"
    - "repository version manifest -> workflow wiring -> recorded runtime provenance"
---

<objective>
Repair the hosted authority abstraction before corrective implementation relies
on it: prove each governed job starts from the exact event subject before
payload execution, bind that proof to the byte-pinned governed step program,
and define deterministic toolchain inputs that later workflow wiring consumes.
</objective>

<context>
@.planning/evidence/hosted/first-real-run-failure.json
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-INTERIM-REVIEW-SYNTHESIS-2026-07-18.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-PLAN11AC-AUTHORITATIVE-ADJUDICATION-2026-07-19.md
@config/phase43-hosted-ci-contract.json
@scripts/verify-hosted-ci.js
@tests/verify-hosted-ci.test.js
@package.json
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
    Require run-attempt-bound job collection. Add closed-topology fixtures for
    an exact pinned harden-runner prelude before checkout, an unpinned,
    duplicated, misplaced, or unknown prelude, and `fetch-depth: 0` accepted
    only for the Secret Scan checkout allowlist. Add fail-closed hosted receipt
    schema fixtures for missing or unsafe run, attempt, job, runner, runtime,
    tool, and container identity fields.

    GREEN: version the hosted contract and add one required successful subject
    step for every governed source-executing job. The step's workflow
    implementation will explicitly checkout the event PR head and fail unless
    `git rev-parse HEAD` equals the expected event head. Make the collector
    require the governed step to have completed successfully before a passed
    envelope can be built. Require jobs from the run-attempt endpoint and bind
    every subject record to that attempt. Permit at most one exact pinned
    harden-runner prelude with contract-allowlisted literal inputs, then require
    checkout and adjacent verification. Make checkout inputs a closed per-job
    contract whose sole current exception is Secret Scan `fetch-depth: 0`.
    Define Tier A runner metadata and Tier B in-job runtime receipt schemas;
    Plan 11AH owns emission/collection and Plan 11AJ owns first consumption.
    Preserve the existing PR/local head, topology, real-step, ancestry, and
    governed-digest checks.

    REFACTOR: keep job/step classification pure and inject all GitHub payloads.
    Do not scrape logs or certify an ephemeral merge commit by implication.
  </action>
  <acceptance_criteria>
    - synthetic-merge metadata without a successful governed subject step fails closed.
    - every required job is checked for the subject step, including expanded matrix jobs.
    - every collected job and subject record is bound to the selected run attempt.
    - only the exact allowlisted security-prelude, checkout, adjacent-verification topology passes.
    - checkout inputs are closed per job and only Secret Scan permits `fetch-depth: 0`.
    - Tier A and Tier B receipt records reject incomplete, unsafe, or unbound identity.
    - claims state pre-payload event-subject proof plus a byte-pinned governed step program, never whole-job worktree immutability.
    - billing-lock, stale-head, replay, topology, and digest negatives remain green.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/verify-hosted-ci.test.js</automated>
  </verify>
  <done>true</done>
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
    Add a byte-exact hosted-contract control-step fixture that passes without
    runtime setup, then fail one-byte name, shell, environment, command, and
    position deviations. Reject a non-control run-step job absent from the
    closed `runtimeRequirements` map, a missing declared setup, and an
    extraneous undeclared setup. Reject legacy `--mode full` with actionable
    migration text and accept `local-runtime` only with caller-supplied evidence.

    GREEN: add `.bun-version` with the currently locally certified Bun `1.3.5`,
    a small machine-readable authority manifest, and an injectable checker.
    Distinguish exact execution dependencies from deliberate compatibility
    ranges: Bun/actions/container identity are exact; Node 20/22 remain support
    dimensions whose resolved patch is recorded. Inject the hosted contract's
    exact verification-step authority into evaluation and exempt only that
    control step at its mandated position. Replace blanket dual-runtime setup
    with a closed per-workflow/per-job `runtimeRequirements` exact-set map using
    `bun`, `node`, or `both`; never infer requirements from executable names.
    Rename `full` to `local-runtime` and reserve `hosted-runtime` until Plan
    11AJ consumes trusted receipts. Add all authority files to the
    hosted governed digests. Plan 11AH owns live workflow conformance; this plan
    proves the checker against fixtures and intentionally does not claim current
    `latest` workflows are compliant.

    REFACTOR: expose bounded JSON diagnostics and one update trigger per pin.
    Do not change the machine-global Bun installation.
  </action>
  <acceptance_criteria>
    - the authority manifest has one unambiguous Bun SSOT and explicit ranged-versus-exact semantics.
    - only a byte-exact, correctly positioned contract control step is exempt from runtime classification.
    - every non-control run-step job declares and consumes exactly its runtime set.
    - `full` is rejected, `local-runtime` is truthful, and `hosted-runtime` is unavailable before trusted receipt consumption.
    - fixture workflows reject floating execution dependencies and accept governed pins.
    - hosted governed digests include the authority manifest and checker.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/toolchain-authority.test.js tests/verify-hosted-ci.test.js</automated>
  </verify>
  <done>true</done>
</task>

<task id="11AC-03" type="auto">
  <name>Prove the verifier coverage contract under Node</name>
  <files>package.json; bun.lock; tests/helpers/portable-test-api.js; tests/verify-hosted-ci.test.js; tests/toolchain-authority.test.js</files>
  <action>
    RED: demonstrate that Bun's coverage output cannot independently prove all
    four required metrics and that c8 11 is incompatible with the repository's
    deliberate minimatch 3 security override on Windows. Prove that full Jest
    would duplicate the existing Node test-runner authority.

    GREEN: retain `node:test`, exact-pin the standalone Jest `expect` library
    and c8 9.1.0, and route only the two verifier suites through a portable test
    API. Run c8 with junction-aware external-path handling and per-file 95%
    thresholds for statements, branches, functions, and lines. Keep Bun as the
    primary functional runner and do not trust dependency lifecycle scripts.

    REFACTOR: keep this a Plan 11AC verifier seam. Do not turn it into the
    canonical Plan 11D/11W runner migration or weaken the repository's exact
    dependency/security overrides.
  </action>
  <acceptance_criteria>
    - the same verifier tests pass under Bun and Node without duplicated suites.
    - both verifier scripts independently exceed 95% statements, branches, functions, and lines.
    - c8 includes only the two verifier entry scripts and the exact modules mechanically extracted by Task 11AC-04.
    - adding any other production source to this lane requires an explicit Plan 11D/11W decision.
    - package and lockfile pins are exact and add no unresolved dependency advisory on the new coverage path.
  </acceptance_criteria>
  <verify>
    <automated>bun run test:coverage:phase43-verifiers</automated>
  </verify>
  <done>true</done>
</task>

<task id="11AC-04" type="auto">
  <name>Evaluate mechanical CLI and hosted-adapter extraction</name>
  <files>scripts/lib/hosted-ci-adapters.js; scripts/lib/hosted-ci-cli.js; scripts/lib/toolchain-authority-cli.js; scripts/verify-hosted-ci.js; scripts/verify-toolchain-authority.js; tests/test-config-hygiene.test.js; tests/verify-hosted-ci.test.js; tests/toolchain-authority.test.js; package.json</files>
  <action>
    Run only after Tasks 11AC-01 through 11AC-03 are green. RED: require the
    original entry modules to re-export every current public symbol and add a
    static require-graph fixture proving evaluator regions do not import
    `child_process` and infrastructure adapters are reachable only through
    injected dependency objects.

    GREEN: mechanically move hosted CLI composition (`parseArgs`, `main`) and
    infrastructure adapters (`createDefaultDependencies`, `runJsonCommand`,
    `runTextCommand`, `writeReceiptAtomic`, `resolveReceiptPath`) into at most
    two `scripts/lib/` modules. Move only toolchain `runCli` into its own
    `scripts/lib/` module. Preserve behavior and original-path re-exports. Add
    the extracted production modules to the frozen c8 include list and keep all
    four per-file thresholds at 95%.

    REFACTOR: abort this extraction if a pure move cannot retain public imports,
    focused behavior, and coverage without semantic shims. In that case retain
    the current files and record the Phase 44 trigger: complete the policy/I/O
    split before any post-v1.2 feature touches either verifier. Cosmetic file
    slicing is not an acceptable completion claim.
  </action>
  <acceptance_criteria>
    - original verifier entry paths retain their public import surface.
    - evaluator regions have no direct process-execution dependency.
    - hosted filesystem, Git, GitHub, and receipt publication remain injected adapters.
    - extraction either passes unchanged behavior and per-file coverage or is explicitly aborted to the named Phase 44 trigger.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/toolchain-authority.test.js tests/verify-hosted-ci.test.js tests/test-config-hygiene.test.js</automated>
    <automated>bun run test:coverage:phase43-verifiers</automated>
  </verify>
  <done>true</done>
</task>

</tasks>

<threat_model>
GitHub's PR metadata can identify the head while default checkout executes a
different synthetic merge. Mutable action tags, false blanket runtime claims,
unsafe checkout preludes, and floating runtimes can also change executed
behavior without changing a governed workflow digest. A governed fail-fast
subject step, closed topology, exact runtime requirements, and explicit
dependency authority close those claim gaps without parsing unstructured logs
or claiming whole-job worktree immutability.
</threat_model>

<verification>
- `bun run test -- tests/verify-hosted-ci.test.js tests/toolchain-authority.test.js tests/test-config-hygiene.test.js`
- `bun run test:coverage:phase43-verifiers`
- `node --check scripts/verify-hosted-ci.js`
- `node --check scripts/verify-toolchain-authority.js`
- `git diff --check`
</verification>

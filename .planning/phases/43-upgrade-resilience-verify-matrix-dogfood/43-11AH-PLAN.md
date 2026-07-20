---
phase: 43
plan: "11AH"
type: execute
gap_closure: true
wave: 20
depends_on: ["43-11AD", "43-11AE", "43-11AF", "43-11AG"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-04", "UPGRADE-05", "UPGRADE-08", "UPGRADE-09", "SHIP-08"]
files_modified:
  - .github/dependabot.yml
  - .github/workflows/ci.yml
  - .github/workflows/compat-matrix.yml
  - .github/workflows/cousin-install.yml
  - .github/workflows/oversight-probes.yml
  - .github/workflows/upgrade-verifier.yml
  - .github/workflows/perf-baseline.yml
  - .github/workflows/flake-issue-maintenance.yml
  - .github/workflows/issue-proposal-maintenance.yml
  - config/phase43-hosted-ci-contract.json
  - config/phase43-toolchain-authority.json
  - lychee.toml
  - scripts/emit-hosted-runtime-receipt.js
  - scripts/install-hyperfine.js
  - scripts/lib/hosted-evidence-binding.js
  - scripts/run-compat-matrix.js
  - scripts/verify-hosted-ci.js
  - scripts/verify-toolchain-authority.js
  - tests/ci-workflow.test.js
  - tests/docs-gates.test.js
  - tests/hosted-evidence-binding.test.js
  - tests/hosted-runtime-receipt.test.js
  - tests/install-hyperfine.test.js
  - tests/toolchain-authority.test.js
  - tests/verify-hosted-ci.test.js
  - tests/vetted-upstream-versions.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AH-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "diagnostic pull-request workflows are read-only and cannot create or append issue comments"
    - "every governed job checks out and verifies its exact event subject; each PR performance job separately verifies the governed harness, base reference, and head candidate"
    - "paired capture followed by check-perf --comparison is the sole blocking PR performance path on Linux, macOS, and Windows"
    - "fork pull requests execute without secrets, write permissions, persisted credentials, cache publication, privileged triggers, or self-hosted runners"
    - "governed workflows consume the exact Bun pin, reviewed action/container identities, Node 22 for performance, and checksum-verified Hyperfine 1.20.0 assets"
    - "the current PR topology expects contract-derived authority equivalent to 39 Tier A jobs, 21 Tier B runtime subjects, and three paired bundles for one run attempt"
    - "Tier A API authority, Tier B runtime observation, paired raw evidence, and artifact metadata remain separate until Plan 11AJ performs their validated join"
    - "the active pinned compatibility row fails closed while historical vetted rows remain informational"
    - "volatile decorative third-party availability is separated from blocking project-owned documentation correctness"
  artifacts:
    - "config/phase43-hosted-ci-contract.json"
    - "scripts/lib/hosted-evidence-binding.js"
    - "scripts/install-hyperfine.js"
    - ".github/workflows/issue-proposal-maintenance.yml"
    - "tests/ci-workflow.test.js"
    - "tests/hosted-evidence-binding.test.js"
    - "43-11AH-SUMMARY.md"
  key_links:
    - "event policy -> exact single or paired checkout profile -> adjacent commit verification"
    - "trusted harness plus base/candidate subjects -> paired raw artifact -> check-perf --comparison"
    - "Jobs API Tier A plus runner Tier B plus paired bundle plus Artifacts API metadata -> Plan 11AJ hosted envelope"
    - "PR diagnostics -> normalized proposal artifact -> explicit idempotent mutation workflow"
    - "active upstream pin -> compat report row -> blocking workflow conclusion"
---

<objective>
Wire the corrective primitives into deterministic, fork-safe, read-only PR
workflows; make paired evidence the only blocking performance authority; and
separate public mutation, third-party availability, and historical
compatibility from blocking product authority.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AC-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AD-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AE-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AF-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AG-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-GPT-5.6-SOL-PLAN11AH-READINESS-REVIEW-2026-07-20.md
@.github/workflows/ci.yml
@config/phase43-hosted-ci-contract.json
</context>

<tasks>

<task id="11AH-01" type="auto">
  <name>Define event-specific execution and hosted-evidence authority</name>
  <files>config/phase43-hosted-ci-contract.json; config/phase43-toolchain-authority.json; scripts/emit-hosted-runtime-receipt.js; scripts/lib/hosted-evidence-binding.js; scripts/verify-hosted-ci.js; scripts/verify-toolchain-authority.js; tests/hosted-evidence-binding.test.js; tests/hosted-runtime-receipt.test.js; tests/toolchain-authority.test.js; tests/verify-hosted-ci.test.js</files>
  <action>
    RED: reject an event-agnostic PR-head expression used on push, a synthetic
    merge or branch ref, an absent repository/ref/path, persisted checkout
    credentials, and a single-checkout profile applied to paired performance.
    Reject any paired profile missing a separately governed harness, immutable
    base reference, immutable head candidate, or adjacent verification for all
    three checkouts. Reject Tier B data that duplicates API-owned numeric job
    ID, runner name, group, or labels as authority. Reject missing, duplicate,
    extraneous, cross-attempt, or mismatched Tier A, Tier B, paired-bundle, and
    artifact identities. Prove the current PR topology derives exactly 39 Tier
    A jobs, 21 unique Tier B subjects, and three paired bundles without treating
    those numbers as timeless constants.

    GREEN: version the hosted contract for explicit event and per-job checkout
    profiles. Single-subject PR jobs use head repository plus head SHA; push,
    schedule, and dispatch jobs use their exact governed event SHA. Each PR
    performance subject uses three shallow, side-by-side checkouts: a canonical
    repository at the immutable Fable-accepted 11AG harness commit, the PR base
    repository at base SHA, and the PR head repository at head SHA. Require
    `persist-credentials: false`, explicit paths, and immediate HEAD checks.
    Performance has no blocking authority outside `pull_request`; non-PR skips
    are explicit contract outcomes rather than green performance claims.

    Make Tier A the Jobs API authority for job ID/name, runner name/group,
    labels, run ID, and attempt. Make Tier B a bounded runner observation for
    logical runtime subject, event, run/attempt claims, OS fingerprint,
    architecture, nullable hosted-image name/version, and resolved
    Node/Bun/tool/container versions. Define a closed paired-binding manifest
    that binds harness/reference/candidate repositories and SHAs plus SHA-256
    digests of the Tier B receipt and 11AG comparison file. Artifact ID, archive
    digest, workflow-run binding, and Tier A identity remain collector-owned.

    Add one pure `hosted-evidence-binding` domain boundary over supplied event,
    contract, job, artifact, receipt, and paired evidence. Keep GitHub API,
    archive, and filesystem operations in injected `verify-hosted-ci` adapters.
    This bounded extraction must not perform the broader policy/I/O refactor
    deferred to Phase 44. Plan 11AJ remains the first live collector.
  </action>
  <verify>
    <automated>bun run test -- tests/hosted-evidence-binding.test.js tests/hosted-runtime-receipt.test.js tests/toolchain-authority.test.js tests/verify-hosted-ci.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AH-02" type="auto">
  <name>Wire reproducible fork-safe paired workflow evidence</name>
  <files>.github/dependabot.yml; .github/workflows/ci.yml; .github/workflows/compat-matrix.yml; .github/workflows/cousin-install.yml; .github/workflows/oversight-probes.yml; .github/workflows/upgrade-verifier.yml; .github/workflows/perf-baseline.yml; config/phase43-hosted-ci-contract.json; config/phase43-toolchain-authority.json; scripts/emit-hosted-runtime-receipt.js; scripts/install-hyperfine.js; scripts/verify-hosted-ci.js; scripts/verify-toolchain-authority.js; tests/ci-workflow.test.js; tests/hosted-runtime-receipt.test.js; tests/install-hyperfine.test.js; tests/toolchain-authority.test.js; tests/verify-hosted-ci.test.js</files>
  <action>
    RED: add structural workflow tests that reject default synthetic-merge
    checkout, absent or late subject verification, candidate-owned benchmark
    harness code, `pull_request_target`, self-hosted runners, secrets or write
    permissions, persisted credentials, performance cache publication, Bun
    `latest`, movable action tags, mutable Verdaccio, floating package-manager
    Hyperfine installation, missing checksum or resolved version, and a
    performance job without Node 22 plus exact Bun. Reject legacy
    `--baseline`/`--current`, threshold overrides, missing `--paired`, missing
    `--comparison`, fewer than ten measured pairs, or a missing/duplicate paired
    bundle upload. Reject an unpinned, duplicated, misplaced, or unknown
    security prelude; checkout inputs outside the per-job allowlist; a
    non-control run-step job missing from the exact runtime map; missing or
    extraneous runtime setup; and malformed runtime receipts.

    GREEN: in every governed source-executing job, use its contracted exact
    checkout profile and injection-safe environment wiring. Preserve an exact
    pinned harden-runner prelude before checkout where already present and
    permit `fetch-depth: 0` only for Secret Scan. Consume `.bun-version` and
    conform every run-step job to the exact runtime requirements map so Bun-only
    jobs never gain setup-node. Pin governed actions to reviewed full SHAs with
    tag comments and Verdaccio by digest. Add GitHub Actions update automation
    that proposes pin changes rather than silently floating them.

    For each PR performance subject, install Hyperfine 1.20.0 from the exact
    OS/architecture release asset recorded with its reviewed SHA-256 in the
    authority manifest; verify bytes before extraction and verify the resolved
    executable version. Set up Node 22 and exact Bun. Execute `bench.js --paired`
    from the governed harness against the verified base and head checkouts with
    at least ten measured pairs, then execute `check-perf.js --comparison` as the
    sole blocking performance step. Upload exactly one immutable, uniquely named
    paired bundle containing the comparison, Tier B receipt, and closed binding
    manifest. No non-PR event may claim a blocking performance verdict.

    Emit one sanitized Tier B receipt for each of the 18 Cousin matrix subjects
    and three performance subjects. Other jobs remain closed Tier A-only
    exemptions. Publish bundles create-only and bind names and contents to run
    ID, attempt, and logical subject. Co-update workflow topology, receipt and
    paired cardinality, governed paths, toolchain authority, and verifier tests
    in the same task. A workflow digest without matching step authority fails.
  </action>
  <verify>
    <automated>bun run test -- tests/ci-workflow.test.js tests/hosted-runtime-receipt.test.js tests/install-hyperfine.test.js tests/toolchain-authority.test.js tests/verify-hosted-ci.test.js</automated>
    <automated>bash scripts/lint-workflows.sh</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AH-03" type="auto">
  <name>Separate diagnostics from public issue mutation</name>
  <files>.github/workflows/ci.yml; .github/workflows/flake-issue-maintenance.yml; .github/workflows/issue-proposal-maintenance.yml; tests/ci-workflow.test.js</files>
  <action>
    RED: assert top-level PR CI defaults to `contents: read`, no PR job grants
    `issues: write`, and neither OSV nor Windows flake diagnostics call issue
    mutation APIs. Add fixtures that reject append-on-every-run behavior,
    mutation without explicit apply input, missing dry-run, and absent stable
    idempotency marker.

    GREEN: keep OSV/flake detection in PR CI but publish normalized proposal
    artifacts and job summaries only. Move optional mutation to a separate
    `workflow_dispatch` maintenance workflow with dry-run default, explicit
    apply confirmation, least-privilege job permission, and one stable marker
    per advisory/package/version or flake identity. Update one bot-owned record
    rather than append each run. Make scheduled flake maintenance report-only;
    mutation requires the explicit apply path.

    Leave the 266 historical comments untouched. No workflow is run in this
    plan; source changes remain local until separately authorized publication.
  </action>
  <verify>
    <automated>bun run test -- tests/ci-workflow.test.js</automated>
    <automated>bash scripts/lint-workflows.sh</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AH-04" type="auto">
  <name>Make compatibility and documentation conclusions truthful</name>
  <files>.github/workflows/ci.yml; .github/workflows/compat-matrix.yml; lychee.toml; scripts/run-compat-matrix.js; tests/ci-workflow.test.js; tests/docs-gates.test.js; tests/vetted-upstream-versions.test.js</files>
  <action>
    RED: prove a failing active pinned upstream row makes the workflow fail while
    a historical vetted-row difference remains informational and
    artifact-backed. Add docs fixtures for project-owned 404/500 failure,
    persistent third-party 404/410 ownership, and a single decorative
    third-party 5xx availability event that cannot block product CI or disappear
    silently.

    GREEN: emit row-level compatibility classification and return nonzero for
    the active pin only. Keep historical rows in the report. Keep internal
    links, anchors, install commands, and project-owned endpoints blocking.
    Move `api.star-history.com` and equivalent decorative availability to a
    scheduled read-only report with bounded retry and recurrence evidence; do
    not add HTTP 500 to the global accept list.
  </action>
  <verify>
    <automated>bun run test -- tests/ci-workflow.test.js tests/docs-gates.test.js tests/vetted-upstream-versions.test.js</automated>
    <automated>bun run lint:docs</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A green workflow can hide the wrong checkout, untrusted fork code, mutable
dependencies, a self-attested runtime, stale absolute performance authority,
blocking compatibility drift, or recurring public comments. Event-specific
subjects, a governed harness, separate evidence sources, immutable toolchains,
read-only PR permissions, and an owner-gated collector prevent another
expensive hosted cycle from repeating those governance failures.
</threat_model>

<verification>
- focused workflow, event-contract, pure binding, runtime-receipt, installer,
  compatibility, docs, and authority tests
- `bash scripts/lint-workflows.sh`
- `bun run lint:docs`
- live local `node scripts/verify-toolchain-authority.js` against all governed
  workflow bytes; no hosted workflow execution
- focused four-metric coverage at or above 95% for every changed executable
  script
- local fixture proof of current PR cardinality: 39 Tier A, 21 Tier B, and
  three paired bundles, derived from the contract
- `git diff --check`
</verification>

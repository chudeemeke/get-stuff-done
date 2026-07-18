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
  - scripts/run-compat-matrix.js
  - tests/ci-workflow.test.js
  - tests/docs-gates.test.js
  - tests/toolchain-authority.test.js
  - tests/verify-hosted-ci.test.js
  - tests/vetted-upstream-versions.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AH-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "diagnostic pull-request workflows are read-only and cannot create or append issue comments"
    - "all governed jobs explicitly checkout and verify the exact event subject"
    - "governed workflows consume the exact Bun pin and immutable action/container identities"
    - "the active pinned compatibility row fails closed while historical vetted rows remain informational"
    - "volatile decorative third-party availability is separated from blocking project-owned documentation correctness"
  artifacts:
    - ".github/workflows/issue-proposal-maintenance.yml"
    - "tests/ci-workflow.test.js"
    - "tests/docs-gates.test.js"
    - "43-11AH-SUMMARY.md"
  key_links:
    - "PR diagnostics -> normalized proposal artifact -> explicit idempotent mutation workflow"
    - "exact checkout -> subject verification step -> hosted collector contract"
    - "active upstream pin -> compat report row -> blocking workflow conclusion"
---

<objective>
Wire the corrective primitives into deterministic, read-only PR workflows and
separate public mutation, third-party availability, and historical compatibility
from blocking product authority.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AC-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AD-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AE-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AF-SUMMARY.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AG-SUMMARY.md
@.github/workflows/ci.yml
@config/phase43-hosted-ci-contract.json
</context>

<tasks>

<task id="11AH-01" type="auto">
  <name>Make governed workflow execution reproducible and subject-bound</name>
  <files>.github/dependabot.yml; .github/workflows/ci.yml; .github/workflows/compat-matrix.yml; .github/workflows/cousin-install.yml; .github/workflows/oversight-probes.yml; .github/workflows/upgrade-verifier.yml; .github/workflows/perf-baseline.yml; config/phase43-hosted-ci-contract.json; config/phase43-toolchain-authority.json; tests/ci-workflow.test.js; tests/toolchain-authority.test.js; tests/verify-hosted-ci.test.js</files>
  <action>
    RED: add structural workflow tests that reject default synthetic-merge
    checkout, absent/late subject verification, Bun `latest`, movable action
    tags, a mutable Verdaccio image, missing resolved-runtime provenance, or
    contract topology that omits the subject step.

    GREEN: in every governed source-executing job, explicitly checkout the event
    PR head (or `github.sha` for non-PR events) and immediately verify
    `git rev-parse HEAD` against the expected event subject using injection-safe
    environment wiring. Consume `.bun-version`. Pin governed actions to full
    reviewed SHAs with tag comments and pin Verdaccio by digest. Record resolved
    Node patch and performance-tool versions while retaining Node 20/22 support
    dimensions. Add GitHub Actions update automation that proposes reviewed pin
    changes rather than silently floating them.

    Co-update the hosted contract job/step topology and governed paths in the
    same task. A workflow digest without matching step authority must fail.
  </action>
  <verify>
    <automated>bun run test -- tests/ci-workflow.test.js tests/toolchain-authority.test.js tests/verify-hosted-ci.test.js</automated>
    <automated>bash scripts/lint-workflows.sh</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AH-02" type="auto">
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
    apply confirmation, least-privilege job permission, and one stable marker per
    advisory/package/version or flake identity. Update one bot-owned record
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

<task id="11AH-03" type="auto">
  <name>Make compatibility and documentation conclusions truthful</name>
  <files>.github/workflows/ci.yml; .github/workflows/compat-matrix.yml; lychee.toml; scripts/run-compat-matrix.js; tests/ci-workflow.test.js; tests/docs-gates.test.js; tests/vetted-upstream-versions.test.js</files>
  <action>
    RED: prove a failing active pinned upstream row makes the workflow fail while
    a historical vetted-row difference remains informational and artifact-backed.
    Add docs fixtures for project-owned 404/500 failure, persistent third-party
    404/410 ownership, and a single decorative third-party 5xx availability
    event that cannot block product CI or disappear silently.

    GREEN: emit row-level compatibility classification and return nonzero for the
    active pin only. Keep historical rows in the report. Keep internal links,
    anchors, install commands, and project-owned endpoints blocking. Move
    `api.star-history.com` and equivalent decorative availability to a scheduled
    read-only report with bounded retry and recurrence evidence; do not add HTTP
    500 to the global accept list.
  </action>
  <verify>
    <automated>bun run test -- tests/ci-workflow.test.js tests/docs-gates.test.js tests/vetted-upstream-versions.test.js</automated>
    <automated>bun run lint:docs</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A green workflow can currently hide the wrong checkout, mutable dependencies,
blocking compatibility drift, or recurring public comments. Separating
read-only diagnostics from explicit mutation and binding workflow topology to
the exact execution contract prevents a second expensive hosted cycle from
repeating those governance failures.
</threat_model>

<verification>
- focused workflow, hosted-contract, compatibility, docs, and authority tests
- `bash scripts/lint-workflows.sh`
- `bun run lint:docs`
- live `node scripts/verify-toolchain-authority.js` against all governed workflows
- focused four-metric coverage at or above 95% for changed executable scripts
- `git diff --check`
</verification>

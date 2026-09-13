---
phase: 43
plan: "11AK"
type: execute
gap_closure: true
wave: 22
depends_on: ["43-11AI"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-04", "UPGRADE-05", "UPGRADE-09", "SHIP-03A", "SHIP-08"]
files_modified:
  - package.json
  - bun.lock
  - .planning/upstream-authority.json
  - .planning/vetted-upstream-versions.json
  - .planning/evidence/phase43-compat.json
  - bin/install.js
  - perf-baseline.json
  - scripts/lib/upstream-source.js
  - scripts/run-upstream-compat.js
  - tests/upstream-compat-contract.json
  - .github/workflows/upgrade-verifier.yml
  - overrides/bin/install.js
  - overrides/bin/install.js.REASON.md
  - overrides/gsd-core/bin/lib/init.cjs
  - overrides/gsd-core/bin/lib/init.cjs.REASON.md
  - overrides/gsd-core/bin/lib/plan-scan.cjs
  - overrides/gsd-core/bin/lib/plan-scan.cjs.REASON.md
  - overrides/gsd-core/bin/lib/roadmap-parser.cjs
  - overrides/gsd-core/bin/lib/roadmap-parser.cjs.REASON.md
  - overrides/gsd-core/bin/lib/roadmap.cjs
  - overrides/gsd-core/bin/lib/roadmap.cjs.REASON.md
  - overrides/gsd-core/bin/lib/state.cjs
  - overrides/gsd-core/bin/lib/state.cjs.REASON.md
  - overrides/hooks/gsd-check-update-worker.js
  - overrides/hooks/gsd-check-update-worker.js.REASON.md
  - overrides/hooks/gsd-check-update.js
  - overrides/hooks/gsd-check-update.js.REASON.md
  - overrides/hooks/gsd-statusline.js
  - overrides/hooks/gsd-statusline.js.REASON.md
  - tests/check-overrides.test.js
  - tests/ci-workflow.test.js
  - tests/installer-safety.test.js
  - tests/roadmap.test.cjs
  - tests/run-upstream-compat-ci.test.js
  - tests/run-upstream-compat.test.js
  - tests/upstream-source.test.js
  - tests/verify-upgrade.test.js
  - tests/vetted-upstream-versions.test.js
  - tests/version-provenance.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AK-UPSTREAM-PROPOSAL-DRAFT.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AK-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "the active exact Open GSD pin advances from 1.6.1 to stable 1.7.0 before any new hosted cycle"
    - "the vetted N=3 authority rotates atomically to 1.6.0, 1.6.1, and 1.7.0 with real matrix evidence"
    - "every override is re-adjudicated against the exact 1.7.0 snapshot and retained only with current evidence"
    - "the real local 1.6.1 to 1.7.0 upgrade, compose, reinstall, smoke, and override-churn contracts pass"
    - "the broader embedded PLAN classifier proposal remains a local draft until separately authorized"
  artifacts:
    - ".planning/upstream-authority.json"
    - ".planning/vetted-upstream-versions.json"
    - ".planning/evidence/phase43-compat.json"
    - "43-11AK-UPSTREAM-PROPOSAL-DRAFT.md"
    - "43-11AK-SUMMARY.md"
  key_links:
    - "stable npm 1.7.0 -> exact package and authority pin -> composed source snapshot"
    - "pin change -> all override removal triggers -> explicit retain, update, or remove decisions"
    - "N=3 rotation -> real compatibility report -> current 1.7.0 blocking authority"
    - "local embedded-PLAN evidence -> issue-ready proposal -> Plan 11AJ owner gate"
---

<objective>
Advance the overlay to stable Open GSD 1.7.0 and prove the bump, N=3 rotation,
and every override disposition locally before asking for a new public hosted
cycle.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-UPSTREAM-1.7.0-REFRESH-2026-07-19.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-PLAN11AC-AUTHORITATIVE-ADJUDICATION-2026-07-19.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AI-SUMMARY.md
@.planning/upstream-authority.json
@.planning/vetted-upstream-versions.json
@overrides/gsd-core/bin/lib/plan-scan.cjs.REASON.md
</context>

<tasks>

<task id="11AK-01" type="auto">
  <name>Rotate exact upstream and N=3 authority to stable 1.7.0</name>
  <files>package.json; bun.lock; .planning/upstream-authority.json; .planning/vetted-upstream-versions.json; bin/install.js; perf-baseline.json; scripts/lib/upstream-source.js; scripts/run-upstream-compat.js; tests/upstream-compat-contract.json; .github/workflows/upgrade-verifier.yml; tests/ci-workflow.test.js; tests/installer-safety.test.js; tests/run-upstream-compat-ci.test.js; tests/run-upstream-compat.test.js; tests/upstream-source.test.js; tests/verify-upgrade.test.js; tests/vetted-upstream-versions.test.js; tests/version-provenance.test.js</files>
  <action>
    RED: require exact stable `1.7.0` package and authority pins, N=3 order
    `1.6.0/1.6.1/1.7.0`, a blocking current row equal to authority, compatibility
    contract parity, and upgrade workflow arguments `--from 1.6.1 --to 1.7.0`.
    Add provenance negatives for any stale executable fallback. Require the
    existing performance baseline to be explicitly classified as historical
    trend evidence rather than silently relabeled as a 1.7.0 measurement.

    GREEN: exact-pin stable `@opengsd/gsd-core@1.7.0`, regenerate `bun.lock`,
    update authority and source fallbacks together, and use the vetted-version
    library's pure prune result to rotate N=3 without invoking its in-place CLI
    helper before evidence exists. Update the shared compatibility contract and
    real upgrade workflow. Retain the 1.5.0 performance baseline only as dated,
    non-blocking historical trend data under Plan 11AG's paired authority; do
    not rewrite its measured version.

    REFACTOR: keep package, authority, source fallback, compatibility, workflow,
    and provenance identities derived from explicit exact-version inputs. Do
    not use `latest`, `next`, prereleases, global installs, or ambient npm config.
  </action>
  <acceptance_criteria>
    - every active package, authority, source, and workflow target is exactly 1.7.0.
    - N=3 is exactly 1.6.0, 1.6.1, and 1.7.0 with one blocking current row.
    - installer fallback cannot silently report 1.5.0 after helper absence.
    - the 1.5.0 performance baseline remains honestly historical and non-blocking.
    - no manifest row is marked vetted before current matrix evidence exists.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/ci-workflow.test.js tests/installer-safety.test.js tests/run-upstream-compat-ci.test.js tests/run-upstream-compat.test.js tests/upstream-source.test.js tests/verify-upgrade.test.js tests/vetted-upstream-versions.test.js tests/version-provenance.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AK-02" type="auto">
  <name>Re-adjudicate every override and execute the real bump contracts</name>
  <files>overrides/bin/install.js; overrides/bin/install.js.REASON.md; overrides/gsd-core/bin/lib/init.cjs; overrides/gsd-core/bin/lib/init.cjs.REASON.md; overrides/gsd-core/bin/lib/plan-scan.cjs; overrides/gsd-core/bin/lib/plan-scan.cjs.REASON.md; overrides/gsd-core/bin/lib/roadmap-parser.cjs; overrides/gsd-core/bin/lib/roadmap-parser.cjs.REASON.md; overrides/gsd-core/bin/lib/roadmap.cjs; overrides/gsd-core/bin/lib/roadmap.cjs.REASON.md; overrides/gsd-core/bin/lib/state.cjs; overrides/gsd-core/bin/lib/state.cjs.REASON.md; overrides/hooks/gsd-check-update-worker.js; overrides/hooks/gsd-check-update-worker.js.REASON.md; overrides/hooks/gsd-check-update.js; overrides/hooks/gsd-check-update.js.REASON.md; overrides/hooks/gsd-statusline.js; overrides/hooks/gsd-statusline.js.REASON.md; tests/check-overrides.test.js; tests/roadmap.test.cjs; .planning/evidence/phase43-compat.json; .planning/vetted-upstream-versions.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AK-UPSTREAM-PROPOSAL-DRAFT.md</files>
  <action>
    RED: fixture the exact 1.7.0 upstream plan classifier: canonical
    `42-PLAN-REVIEW.md` is excluded upstream, embedded `PLAN11AC` review
    filenames remain misclassified upstream, and the local delimiter-bounded
    override rejects them while preserving genuine legacy plan drafts. Require
    every override and REASON pair to produce an explicit 1.7.0 retain, update,
    or remove decision with current byte and semantic hashes where applicable.

    GREEN: compose the exact 1.7.0 snapshot and re-adjudicate all ten override
    pairs. Remove overrides whose delta is upstream, update those whose source
    moved, and retain only evidenced fork behavior with refreshed 1.7.0 reasons
    and removal triggers. Run repository compatibility, the real N=3 matrix,
    apply its exact durable report hash to the vetted manifest, run the
    authenticated local 1.6.1 to 1.7.0 Verdaccio upgrade sequence, and generate
    override churn. Create an issue-ready broader-classifier proposal in the
    user's factual voice; do not publish it.

    REFACTOR: make all temporary registries, packages, credentials, reports, and
    install roots marker-owned and remove them on every exit. Assert external
    npm configuration bytes are unchanged.
  </action>
  <acceptance_criteria>
    - every override has a current explicit decision against exact 1.7.0 source.
    - plan-scan fixtures distinguish the fixed suffix case from the retained embedded-token delta.
    - repository compatibility and all three N=3 candidates pass, with 1.7.0 blocking.
    - the vetted manifest cites the exact durable matrix report hash and date.
    - the authenticated 1.6.1 to 1.7.0 upgrade and override-churn reports pass.
    - the upstream proposal exists only as a local draft pending Plan 11AJ approval.
    - no marker-owned temp data, service, credential, or host npm-config mutation remains.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/check-overrides.test.js tests/roadmap.test.cjs</automated>
    <automated>bun run test:repository-compat</automated>
    <automated>bun run compat:matrix</automated>
    <automated>bun run vetted-upstream:validate</automated>
    <automated>bun run verify-upgrade --from 1.6.1 --to 1.7.0 --json --report upgrade-report.json</automated>
    <automated>bun run override:churn</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A stale stable pin, unvetted manifest mutation, or override carried by habit can
make a green hosted cycle certify the wrong upstream product. Exact coordinated
authority, TDD rotation, all-override adjudication, real local upgrade evidence,
and a separately gated upstream proposal keep the bump truthful and reversible.
</threat_model>

<verification>
- focused authority, compatibility, installer, workflow, override, and roadmap tests
- `bun run test:repository-compat`
- real N=3 compatibility report and vetted-manifest validation
- authenticated local 1.6.1 to 1.7.0 upgrade report
- override-churn report
- `bun run lint:docs`
- `git diff --check`
</verification>

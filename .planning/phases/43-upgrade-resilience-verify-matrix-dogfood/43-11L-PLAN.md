---
phase: 43
plan: "11L"
type: execute
gap_closure: true
wave: 14
depends_on: ["43-11C"]
status: complete
requirements: []
files_modified:
  - overrides/gsd-core/bin/lib/plan-scan.cjs
  - overrides/gsd-core/bin/lib/plan-scan.cjs.REASON.md
  - tests/roadmap.test.cjs
  - tests/upstream-compat-contract.json
  - .planning/vetted-upstream-versions.json
  - .planning/evidence/phase43-compat.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11L-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "derivative PLAN-REVIEW documents are never counted as executable plans"
    - "PLAN.md, phase PLAN files, and supported nested/legacy plan names retain their existing behavior"
    - "all Open GSD consumers receive the correction through the shared plan-scan module"
    - "the override is removable when open-gsd/gsd-core#2252 ships upstream"
    - "N=3 composed compatibility remains green after the new override"
  artifacts:
    - "overrides/gsd-core/bin/lib/plan-scan.cjs"
    - "overrides/gsd-core/bin/lib/plan-scan.cjs.REASON.md"
    - "tests/roadmap.test.cjs"
    - "43-11L-SUMMARY.md"
  key_links:
    - "Open GSD issue #2252 -> temporary override -> removal trigger"
    - "plan-scan classifier -> roadmap/init/state/phase/verification consumers -> truthful plan totals"
    - "new override -> compose -> N=3 candidate matrix"
---

<objective>
Correct the active Open GSD plan-scan read-model defect before coverage-source
and milestone denominators are certified, while preserving legacy filename
compatibility and a clear path back to upstream ownership.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
@node_modules/@opengsd/gsd-core/gsd-core/bin/lib/plan-scan.cjs
@overrides/gsd-core/bin/lib/roadmap.cjs
@tests/roadmap.test.cjs
@tests/upstream-compat-contract.json
</context>

<tasks>

<task id="11L-01" type="auto">
  <name>Add the minimal shared plan-scan correction</name>
  <files>overrides/gsd-core/bin/lib/plan-scan.cjs; overrides/gsd-core/bin/lib/plan-scan.cjs.REASON.md; tests/roadmap.test.cjs</files>
  <action>
    RED: add direct classifier and directory-scan tests proving that
    `42-PLAN-REVIEW.md` and case variants are excluded while `PLAN.md`,
    `42-01-PLAN.md`, the loose legacy root-plan form, and supported nested plan
    forms remain accepted. Add an integration fixture proving `roadmap analyze`
    does not inflate a phase containing both a real plan and its PLAN-REVIEW
    artifact.

    GREEN: copy the exact pinned Open GSD `plan-scan.cjs` into the reviewed
    override path and add only an explicit PLAN-REVIEW derivative exclusion
    before the loose legacy fallback. Record upstream version `1.6.1`, source
    SHA-256 `07cadb766a55c6d018f10da4d4a487e21190361dc3f2b71a7c5225121b292a9d`,
    issue `open-gsd/gsd-core#2252`, ownership, semantic difference, and removal
    trigger in the reason file.

    REFACTOR: retain `plan-scan` as the single shared classifier used by all
    existing consumers. Do not add caller-specific filtering or broaden the
    fix into document writers.
  </action>
  <acceptance_criteria>
    - the new focused tests fail before the override change and pass afterward.
    - derivative PLAN-REVIEW artifacts are absent from `planFiles` and `planCount`.
    - supported strict, nested, and loose legacy plan filenames retain behavior.
    - override staleness and reason-contract checks pass.
    - composed `roadmap analyze` reports the authoritative portfolio plan total.
  </acceptance_criteria>
  <verify>
    <automated>node --test tests/roadmap.test.cjs</automated>
    <automated>bun run compose</automated>
    <automated>node scripts/check-overrides.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11L-02" type="auto">
  <name>Revalidate compatibility and denominator evidence</name>
  <files>.planning/vetted-upstream-versions.json; .planning/evidence/phase43-compat.json</files>
  <action>
    Run the permanent repository compatibility gate and the N=3 composed matrix
    with `--require-all`. Apply the resulting report through the strict manifest
    evidence path and independently re-read version, suite, exclusion, aggregate,
    path, and digest fields. Do not retain transition-only tests or disposable
    matrix directories.
  </action>
  <acceptance_criteria>
    - repository compatibility remains fully green.
    - all three vetted Open GSD rows pass without version-specific skips.
    - the durable report and manifest contain exact matching counts and SHA-256 evidence.
    - no owned temporary matrix artifact remains.
  </acceptance_criteria>
  <verify>
    <automated>bun run test:repository-compat</automated>
    <automated>node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --require-all --json --report .planning/evidence/phase43-compat.json</automated>
    <automated>node scripts/vetted-upstream-versions.js --apply-matrix-evidence .planning/evidence/phase43-compat.json</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A local filename workaround would leave other plan-scan consumers inconsistent;
a broad replacement would inherit unnecessary upstream ownership. Override the
shared classifier with one tested derivative exclusion, retain the loose legacy
fallback, bind it to upstream issue #2252, and rerun composed compatibility.
</threat_model>

<verification>
- `node --test tests/roadmap.test.cjs`
- `bun run compose`
- `node scripts/check-overrides.js`
- `bun run test:repository-compat`
- N=3 matrix with strict evidence application
- `git diff --check`
</verification>

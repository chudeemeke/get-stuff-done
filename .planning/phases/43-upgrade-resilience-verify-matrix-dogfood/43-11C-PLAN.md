---
phase: 43
plan: "11C"
type: execute
gap_closure: true
wave: 13
depends_on: ["11B"]
status: pending
requirements: ["UPGRADE-04", "UPGRADE-05", "SHIP-08B"]
files_modified:
  - overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs
  - overrides/gsd-core/bin/lib/roadmap.cjs
  - overrides/gsd-core/bin/lib/roadmap.cjs.REASON.md
  - tests/fork-roadmap-persistence.test.js
  - tests/roadmap.test.cjs
  - tests/run-compat-transition.test.js
  - .planning/vetted-upstream-versions.json
  - .planning/evidence/phase43-compat.json
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11C-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "roadmap progress updates preserve the original EOL convention and unrelated formatting"
    - "the preservation port is narrow to fork-owned roadmap persistence"
    - "document publication remains atomic with bounded Windows lock retries"
    - "all three reviewed stable Open GSD candidates pass the classified compatibility contract"
    - "compatibility resolution is recorded durably while Plan 43-11 remains blocked pending strict closeout validation"
  artifacts:
    - "overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs"
    - "overrides/gsd-core/bin/lib/roadmap.cjs"
    - ".planning/vetted-upstream-versions.json"
    - ".planning/evidence/phase43-compat.json"
    - "43-11C-SUMMARY.md"
  key_links:
    - "overrides/gsd-core/bin/lib/roadmap.cjs -> fork-roadmap-persistence.cjs -> atomic byte-preserving publication"
    - "tests/roadmap.test.cjs -> composed roadmap command -> authkey-derived preservation contract"
    - "durable compat report bytes -> vetted-upstream-versions.json -> Plan 43-11J unblock decision"
---

<objective>
Port the proven roadmap document-preservation guarantee through a narrow
adapter, then prove the complete N=3 compatibility matrix and record a durable
compatibility resolution without unblocking the original post-bump plan before
strict closeout validation exists.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-COMPATIBILITY-RESEARCH.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11B-PLAN.md
@tests/roadmap.test.cjs
@overrides/gsd-core/bin/lib/roadmap.cjs
@overrides/gsd-core/bin/lib/roadmap.cjs.REASON.md
@node_modules/@opengsd/gsd-core/gsd-core/bin/lib/shell-command-projection.cjs
@scripts/run-compat-matrix.js
@scripts/vetted-upstream-versions.js
</context>

<tasks>

<task id="11C-01" type="auto">
  <name>Specify the document-preserving persistence port</name>
  <files>tests/fork-roadmap-persistence.test.js; overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs</files>
  <read_first>
    - tests/roadmap.test.cjs
    - node_modules/@opengsd/gsd-core/gsd-core/bin/lib/shell-command-projection.cjs
    - overlay/src/platform
  </read_first>
  <action>
    RED: add one test at a time for: LF preservation, CRLF preservation, mixed-input policy, no-op writes, sibling-temp atomic publication, bounded retry for `EPERM`/`EBUSY`/`EACCES`, cleanup after final failure, and non-retryable fallback behavior. Inject filesystem, sleep, and process-id dependencies so tests do not use timing or live file locks.

    GREEN: add an explicitly fork-private `fork-roadmap-persistence.cjs` adapter under the composed `gsd-core/bin/lib` path. Its narrow internal surface accepts file path, original content, updated content, and optional dependencies. It restores the original dominant EOL convention without reformatting markdown, writes a sibling temp file, retries transient Windows rename errors a bounded number of times, removes failed temp files, and never replaces an unchanged document.

    REFACTOR: keep EOL projection separate from atomic publication. Reuse constants and policy names from upstream where appropriate, but do not copy unrelated shell-command projection behavior or override the global writer.
  </action>
  <acceptance_criteria>
    - CRLF input remains CRLF and LF input remains LF.
    - unrelated whitespace is byte-stable after EOL projection.
    - unchanged content performs no publish operation.
    - transient lock retries are bounded and failed temp files are removed.
    - Plan 43-11D's SHIP-08A fork-authored gate includes the adapter and cannot close below 95% on any metric.
  </acceptance_criteria>
  <verify>
    <automated>bun test tests/fork-roadmap-persistence.test.js</automated>
    <automated>bun test --coverage tests/fork-roadmap-persistence.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11C-02" type="auto">
  <name>Integrate preservation only at roadmap persistence</name>
  <files>overrides/gsd-core/bin/lib/roadmap.cjs; overrides/gsd-core/bin/lib/roadmap.cjs.REASON.md; tests/roadmap.test.cjs; tests/fork-roadmap-persistence.test.js</files>
  <read_first>
    - overrides/gsd-core/bin/lib/roadmap.cjs
    - overrides/gsd-core/bin/lib/roadmap.cjs.REASON.md
    - tests/roadmap.test.cjs
    - overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs
  </read_first>
  <action>
    RED: retain the existing wrong-checkbox/CRLF regression as the public behavioral test and strengthen it to prove only the requested phase/count/checklist bytes change. Add an LF fixture, an exact unrelated-byte preservation assertion, a publish-failure propagation fixture, and a boundary assertion that fails if any production file other than the roadmap override imports `fork-roadmap-persistence.cjs`.

    GREEN: have `cmdRoadmapUpdatePlanProgress` retain the original roadmap content and delegate only its final document publication to the fork adapter. Preserve the current exact-phase selection and lock boundary. Update the roadmap override REASON file to document the added preservation responsibility and review trigger; do not change its reviewed upstream snapshot merely because local override code changed.

    REFACTOR: use the adapter at the smallest persistence call site that satisfies the proven behavior. Leave Open GSD's global `platformWriteSync` untouched so other documents retain upstream canonicalization policy.
  </action>
  <acceptance_criteria>
    - the authkey-derived multi-phase CRLF fixture passes by exact content comparison outside intended edits.
    - LF roadmap behavior remains correct.
    - `roadmap.cjs` is the only production importer of the explicitly fork-private adapter.
    - no override of `shell-command-projection.cjs` is added.
    - `node scripts/check-overrides.js` still passes.
  </acceptance_criteria>
  <verify>
    <automated>bun run compose</automated>
    <automated>node --test tests/roadmap.test.cjs</automated>
    <automated>bun test tests/fork-roadmap-persistence.test.js</automated>
    <automated>node scripts/check-overrides.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11C-03" type="auto">
  <name>Prove N=3 and persist provisional compatibility resolution</name>
  <files>tests/run-compat-transition.test.js; .planning/vetted-upstream-versions.json; .planning/evidence/phase43-compat.json; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md</files>
  <read_first>
    - .planning/vetted-upstream-versions.json
    - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-BLOCKER.md
    - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11-PLAN.md
    - scripts/run-compat-matrix.js
    - scripts/vetted-upstream-versions.js
    - scripts/lib/owned-temp.js
  </read_first>
  <action>
    Run `bun run dist`, then the active `1.6.1` row into marker-owned temporary storage. Only after it passes, run the full `1.5.0`, `1.6.0`, `1.6.1` matrix with `--require-all` against the shared minimum product contract and atomically publish the exact successful report bytes to `.planning/evidence/phase43-compat.json`. Inspect every per-suite row and require all three candidates to pass; normal CI may retain current-pin-only exit policy, but closeout mode cannot return zero for a red historical row, and no version metadata may skip a candidate suite. Apply that durable report directly to `.planning/vetted-upstream-versions.json` with the execution date and report digest, then record bounded counts and suite evidence in the historical blocker. Never manufacture or reconstruct the report from its digest.

    After durable evidence is written and re-read successfully, remove the transitional
    `tests/run-compat-transition.test.js`; its expected-red contract is no
    longer true once the active matrix exits zero. Append
    `compatibility-resolved-pending-closeout-validation` to
    `43-11-BLOCKER.md` while preserving the original failure. Do not change the
    original `43-11-PLAN.md`: it remains blocked until Plan 11J validates the
    durable bytes and both SHIP-08 child contracts. This provisional transition
    is the final operation and must not occur if either matrix command,
    manifest validation, durable evidence write, or digest re-read is red.
    Root `compat-matrix-report.json` and `upgrade-report.json` must remain
    absent; the compatibility report is durable evidence, not a regenerable
    root report. Runner-created recursive temp roots must be removed only through
    the marker-based `owned-temp` helper from Plan 11A. The consumed Open GSD
    research clone was already identity-checked and removed during planning;
    no cleanup step touches `dist/`, `node_modules/`, repositories, worktrees,
    or the live `authkey`, `remotely`, and `conversations` sessions.
  </action>
  <acceptance_criteria>
    - active `1.6.1` row exits 0 with no failed candidate suite.
    - full N=3 matrix exits 0 and reports all three reviewed pins passed.
    - all manifest entries have current passing matrix evidence and `vettedAt` dates.
    - `.planning/evidence/phase43-compat.json` contains the exact successful `--require-all` report bytes and its digest matches the manifest and blocker record.
    - `43-11-BLOCKER.md` preserves original failure evidence and adds dated `compatibility-resolved-pending-closeout-validation` evidence.
    - original `43-11-PLAN.md` remains blocked and `43-11-SUMMARY.md` remains absent until Plan 11J validates the durable report and final blocker state.
    - the transitional expected-red test is removed only after active and N=3 matrix commands exit 0.
    - regenerable root reports and all marker-owned runner temp roots are absent after evidence capture.
  </acceptance_criteria>
  <verify>
    <automated>bun run dist</automated>
    <automated>node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --version 1.6.1 --json</automated>
    <automated>node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --require-all --json --report .planning/evidence/phase43-compat.json</automated>
    <automated>node scripts/vetted-upstream-versions.js --apply-matrix-evidence .planning/evidence/phase43-compat.json</automated>
    <automated>node scripts/vetted-upstream-versions.js --validate</automated>
    <automated>node -e "const fs=require('node:fs'); for(const p of ['compat-matrix-report.json','upgrade-report.json']) if(fs.existsSync(p)){console.error(p);process.exitCode=1}"</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A broad markdown writer change could alter every planning document, so the port
is scoped to roadmap persistence. Atomic publication can still corrupt or lose
data if fallback behavior truncates a live reader; transient Windows lock
errors must surface after bounded retries rather than direct-write fallback.
Matrix greenness can be manufactured by exclusions or a digest-only recreation,
so registry reconciliation, exact durable report bytes, and per-suite records
remain prerequisites. Cleanup targets must be resolved
and verified before deletion and must never include live session roots.
</threat_model>

<verification>
Run:
- `bun test tests/fork-roadmap-persistence.test.js`
- `node --test tests/roadmap.test.cjs`
- `node scripts/check-overrides.js`
- `bun run dist`
- active-pin and full N=3 compatibility matrix commands
- `node scripts/vetted-upstream-versions.js --validate`
- `bun run lint`
- `bun run lint:docs`
- `git diff --check`
</verification>

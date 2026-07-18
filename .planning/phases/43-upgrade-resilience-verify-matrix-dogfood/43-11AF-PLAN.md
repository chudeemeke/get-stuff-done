---
phase: 43
plan: "11AF"
type: execute
gap_closure: true
wave: 19
depends_on: ["43-11AC"]
status: pending
requirements: ["UPGRADE-01", "UPGRADE-02", "UPGRADE-09", "SHIP-08"]
files_modified:
  - scripts/verify-upgrade.js
  - tests/verify-upgrade.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AF-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "upgrade verification uses an ephemeral authenticated local-registry identity"
    - "credentials never appear in argv, stdout, stderr, JSON reports, or committed configuration"
    - "pack, publish, install, bump, reinstall, and smoke verification remain real operations"
    - "all credential material is scoped to and deleted with the verifier temporary root"
  artifacts:
    - "tests/verify-upgrade.test.js"
    - "43-11AF-SUMMARY.md"
  key_links:
    - "disposable registry identity -> isolated npmrc token -> genuine publish and install"
    - "child output -> centralized sanitizer -> bounded report"
---

<objective>
Restore realistic upgrade verification with least-privilege ephemeral Verdaccio
authentication and fail-closed secret handling.
</objective>

<context>
@scripts/verify-upgrade.js
@tests/verify-upgrade.test.js
@.github/workflows/upgrade-verifier.yml
@.planning/evidence/hosted/first-real-run-failure.json
</context>

<tasks>

<task id="11AF-01" type="auto">
  <name>Prove authentication lifecycle and redaction before adding credentials</name>
  <files>tests/verify-upgrade.test.js</files>
  <action>
    RED: reproduce `ENEEDAUTH`; add injected registry fixtures for successful
    identity bootstrap, rejected signup, malformed token response, publish auth
    failure, cleanup failure, and child output containing token/password/npmrc
    auth-line patterns. Assert no secret reaches argv, logs, thrown messages, or
    the structured report.
  </action>
  <verify>
    <automated>bun run test -- tests/verify-upgrade.test.js</automated>
  </verify>
  <done>false</done>
</task>

<task id="11AF-02" type="auto">
  <name>Implement disposable least-privilege registry identity</name>
  <files>scripts/verify-upgrade.js; tests/verify-upgrade.test.js</files>
  <action>
    GREEN: after registry health succeeds, create a per-run crypto-random local
    user through Verdaccio's supported non-interactive endpoint, capture only the
    returned token, and write it to the verifier's isolated temporary `.npmrc`.
    Pass secrets through process environment or private file descriptors, never
    command arguments. Centralize redaction before output/report persistence and
    delete all material with the owned temporary root.

    Keep the existing pack -> publish-current -> install -> bump -> compose ->
    publish-bumped -> reinstall -> smoke sequence. Do not enable anonymous
    publication or reduce the verifier to pack-only simulation.

    REFACTOR: inject HTTP/process/filesystem/entropy ports so lifecycle and
    failure behavior remain unit-testable without a live registry.
  </action>
  <acceptance_criteria>
    - a disposable local Verdaccio integration completes the full upgrade sequence.
    - malformed or rejected identity bootstrap fails before publication.
    - secret canaries are absent from every observable output and retained artifact.
    - cleanup is attempted on every success and failure path.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/verify-upgrade.test.js</automated>
    <automated>bun run verify-upgrade -- --help</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Adding a token to the existing raw child-output report would turn a CI fix into
a credential leak. Anonymous publication would make the scenario pass by
removing the security property real registries enforce. Injected lifecycle
ports, centralized redaction, and a disposable identity preserve both realism
and secrecy.
</threat_model>

<verification>
- `bun run test -- tests/verify-upgrade.test.js`
- local pinned-Verdaccio integration with secret-canary scan
- focused four-metric coverage at or above 95% for changed verifier code
- `git diff --check`
</verification>

---
phase: 43
plan: "11M"
type: execute
gap_closure: true
wave: 15
depends_on: ["11L"]
status: in_progress
requirements: ["SHIP-08A"]
files_modified:
  - bunfig.toml
  - package.json
  - .husky/pre-push
  - .github/workflows/ci.yml
  - .github/workflows/10x-validation.yml
  - scripts/check-no-test-files-in-dist.js
  - scripts/compose.js
  - scripts/run-bun-tests.js
  - scripts/verify-oversight-probes.js
  - scripts/preview-update.js
  - agents/gsd-oversight-verification.md
  - overlay/agents/gsd-oversight-verification.md
  - overlay/workflows/upstream-sync.md
  - get-stuff-done/workflows/upstream-sync.md
  - tests/helpers/enforce-bun-test-authority.js
  - tests/bun-test-authority.test.js
  - tests/run-bun-tests.test.js
  - tests/test-config-hygiene.test.js
  - tests/fork-roadmap-persistence.test.js
  - tests/pre-push-hook.test.js
  - tests/ci-workflow.test.js
  - tests/preview-update-coverage.test.js
  - tests/verify-oversight-probes.test.js
  - docs/decisions/004-DUAL-TEST-AUTHORITY.md
  - .planning/debug/pre-push-test-discovery.md
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11M-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "the canonical Bun adapter selects only fork-owned .test.js functional suites"
    - "Node-native .test.cjs contracts execute only through their Node authority"
    - "bare bun test fails once with routing guidance before suite execution"
    - "every repository test file has one explicit runner classification"
    - "Bun-only coverage is named separately from the four-metric authority"
    - "negative boundary assertions are not misclassified as stale production paths"
    - "the complete pre-push parity gate passes before branch publication"
  artifacts:
    - "bunfig.toml"
    - "scripts/run-bun-tests.js"
    - "docs/decisions/004-DUAL-TEST-AUTHORITY.md"
    - "tests/test-config-hygiene.test.js"
    - "43-11M-SUMMARY.md"
  key_links:
    - "package script -> Bun adapter -> preload capability -> fork-owned .test.js suites"
    - "repository compatibility contract -> native Node -> .test.cjs suites"
    - "pre-push hook -> local CI parity -> draft branch publication"
---

<objective>
Restore truthful local and hosted test-runner boundaries before publishing the
Phase 43 draft branch, without weakening either the Bun functional authority or
the native Node compatibility authority.
</objective>

<context>
@bunfig.toml
@.husky/pre-push
@tests/test-config-hygiene.test.js
@tests/test-path-validation.test.js
@tests/upstream-compat-contract.json
</context>

<tasks>

<task id="11M-01" type="auto">
  <name>Make Bun discovery explicit and fail closed</name>
  <files>bunfig.toml; package.json; scripts/run-bun-tests.js; tests/helpers/enforce-bun-test-authority.js; tests/run-bun-tests.test.js; tests/bun-test-authority.test.js; tests/test-config-hygiene.test.js</files>
  <action>
    RED: replace the legacy-key meta-tests with structured TOML assertions that
    require `test.root = "tests"`, require `.test.cjs` in
    `test.pathIgnorePatterns`, and reject the unsupported `include` and
    `exclude` keys. Prove those assertions fail against the current config.

    GREEN: retain the supported Bun configuration as defense in depth, but use
    one canonical adapter to apply the documented `.test.js` positional filter
    on local Bun 1.3.5 and hosted Bun. Pass a process-scoped capability to a
    preload guard so bare `bun test` exits once with routing guidance. Reject
    `.test.cjs`, unsupported test forms, and `--pass-with-no-tests`; keep native
    Node execution under the compatibility registry.

    REFACTOR: parse TOML structurally, assert the exact package-script port, and
    prove every repository test file belongs to the Bun extension convention or
    the Node registry. Record the dual authority and Bun-version policy in ADR
    004. Do not increase timeouts or suppress failed tests.
  </action>
  <acceptance_criteria>
    - the new config meta-tests fail before the production config changes.
    - `bun run test` executes no `.test.cjs` file.
    - bare `bun test` exits non-zero in under five seconds with one routing message.
    - every `.test.cjs` file is registered and every other test file is `.test.js`.
    - focused native Node phase and roadmap suites remain green.
    - invalid legacy discovery keys are absent.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- ./tests/run-bun-tests.test.js ./tests/bun-test-authority.test.js ./tests/test-config-hygiene.test.js</automated>
    <automated>node --test tests/phase.test.cjs tests/roadmap.test.cjs</automated>
  </verify>
  <done>false</done>
</task>

<task id="11M-02" type="auto">
  <name>Correct the negative-path meta-test and rerun local CI parity</name>
  <files>.husky/pre-push; .github/workflows/ci.yml; .github/workflows/10x-validation.yml; scripts/preview-update.js; scripts/verify-oversight-probes.js; overlay/workflows/upstream-sync.md; get-stuff-done/workflows/upstream-sync.md; tests/fork-roadmap-persistence.test.js; tests/pre-push-hook.test.js; tests/ci-workflow.test.js; tests/preview-update-coverage.test.js; tests/verify-oversight-probes.test.js; .planning/debug/pre-push-test-discovery.md</files>
  <action>
    Use the existing `meta-test:skip` contract only on the exact negative
    assertion whose target must not exist. Keep the production boundary test
    itself intact. Route pre-push, hosted functional CI, 10x validation, update
    guidance, oversight evidence, and shipped sync guidance through the package
    adapter. Keep `test:coverage:bun` explicitly non-authoritative for SHIP-08A.
    Run focused Bun, native Node, repository compatibility, composition, lint,
    and the full pre-push sequence. Resolve the debug session only after the
    branch push succeeds without `--no-verify`.
  </action>
  <acceptance_criteria>
    - the path-validation suite passes without removing the negative assertion.
    - full Bun functional tests pass with no `.test.cjs` execution trace.
    - repository compatibility remains green.
    - pre-push succeeds without bypass and the remote ref equals local HEAD.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- ./tests/test-path-validation.test.js ./tests/ci-workflow.test.js ./tests/pre-push-hook.test.js</automated>
    <automated>bun run test:repository-compat</automated>
    <automated>bun run compose &amp;&amp; bun run lint &amp;&amp; bun run test</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
Running Node-native compatibility contracts through Bun creates false product
failures and leaves child processes holding temporary directories. Broad test
exclusions can also hide real functional coverage. Configuration behavior varies
between local and hosted Bun versions, so a canonical adapter, preload guard,
extension/registry partition, separately blocking Node registry, and recurrence
meta-tests preserve both authorities without test suppression.
</threat_model>

<verification>
- `bun run test -- ./tests/test-config-hygiene.test.js ./tests/test-path-validation.test.js`
- `node --test tests/phase.test.cjs tests/roadmap.test.cjs`
- `bun run test:repository-compat`
- full pre-push hook through ordinary `git push`
- `git diff --check`
</verification>

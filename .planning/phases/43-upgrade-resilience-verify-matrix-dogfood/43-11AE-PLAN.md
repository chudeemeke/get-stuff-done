---
phase: 43
plan: "11AE"
type: execute
gap_closure: true
wave: 19
depends_on: ["43-11AC"]
status: complete
requirements: ["UPGRADE-04", "SHIP-08"]
files_modified:
  - package.json
  - overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs
  - tests/fork-roadmap-persistence.test.js
  - tests/verify-hosted-ci.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AE-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "Windows target executables use Windows path semantics independently of the host running a test"
    - "receipt containment keeps native realpath canonicalization and tests compare canonical identities"
    - "Windows ACL fixture setup imports its dependency explicitly before exercising product behavior"
  artifacts:
    - "tests/fork-roadmap-persistence.test.js"
    - "tests/verify-hosted-ci.test.js"
    - "43-11AE-SUMMARY.md"
  key_links:
    - "win32 publication branch -> path.win32 executable construction -> PowerShell spawn"
    - "native realpath containment -> canonical expected root -> alias-safe receipt test"
---

<objective>
Correct the three cross-platform failure owners without weakening product
containment or misclassifying runner setup as product behavior.
</objective>

<context>
@overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs
@tests/fork-roadmap-persistence.test.js
@scripts/verify-hosted-ci.js
@tests/verify-hosted-ci.test.js
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AE-WINDOWS-ACL-DIAGNOSIS-2026-07-19.md
</context>

<tasks>

<task id="11AE-01" type="auto">
  <name>Use target-platform semantics and deterministic ACL setup</name>
  <files>overlay/gsd-core/bin/lib/fork-roadmap-persistence.cjs; tests/fork-roadmap-persistence.test.js</files>
  <action>
    RED: preserve a POSIX-hosted fixture that selects the injected `win32`
    product branch and proves the executable is a fully Windows-normalized path.
    Add a harness negative showing ACL setup fails before product execution when
    the Windows PowerShell-owned `Microsoft.PowerShell.Security` manifest is
    unavailable.

    GREEN: construct the Windows PowerShell executable with `path.win32.join`.
    Make the test harness import the exact Windows PowerShell inbox manifest at
    `$PSHOME/Modules/Microsoft.PowerShell.Security/` with `-ErrorAction Stop`, or
    use the equivalent .NET ACL API, before invoking product behavior. Do not
    import by module name: this host resolves a PowerShell 7 WindowsApps module
    before the compatible inbox module. Keep roadmap target/replacement paths in
    the child environment and preserve existing recovery semantics.

    REFACTOR: keep target-platform selection injectable and avoid global path
    normalization that would alter real POSIX filesystem paths.
  </action>
  <verify>
    <automated>bun run test -- tests/fork-roadmap-persistence.test.js</automated>
  </verify>
  <done>true</done>
</task>

<task id="11AE-02" type="auto">
  <name>Make receipt oracles assert canonical identity</name>
  <files>tests/verify-hosted-ci.test.js</files>
  <action>
    RED: add deterministic alias fixtures for `/var` versus `/private/var`,
    Windows short versus long paths, and a symlinked temporary root where the
    platform permits it. Prove non-canonical expectations fail before the test
    correction.

    GREEN: canonicalize expected roots with `fs.realpathSync.native` using the
    same identity contract as production. Keep escape, reparse, and out-of-root
    negatives unchanged. Do not remove or bypass production canonicalization.
  </action>
  <verify>
    <automated>bun run test -- tests/verify-hosted-ci.test.js</automated>
  </verify>
  <done>true</done>
</task>

</tasks>

<threat_model>
Changing production containment to satisfy an alias-sensitive test would reopen
path-escape risk. Conversely, treating ambient host separators as target Windows
semantics hides a real boundary coupling. Separate product, oracle, and harness
ownership keeps each correction narrow and testable.
</threat_model>

<verification>
- `bun run test -- tests/fork-roadmap-persistence.test.js tests/verify-hosted-ci.test.js`
- focused four-metric coverage at or above 95% for changed product code
- `git diff --check`
</verification>

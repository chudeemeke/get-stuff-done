---
schema_version: "1.3"
source_project: memory-nexus
created: 2026-06-22
type: bug
severity: high
fix_status: tested
affects_scope: all-consumers
priority_rationale: GSD update/install is shared workflow infrastructure; a failed Codex global install can leave sessions with a partial toolchain while reporting copied files and a written VERSION file.
issue_id: memory-nexus:2026-06-22:gsd-codex-install-frontmatter-crash
thread_id: gsd-codex-install-frontmatter-crash-2026-06-22
related_issue: C:\Projects\memory-nexus
next_owner: get-stuff-done
status: merged
triaged_at: 2026-07-03
resolved_at: 2026-08-29
pr_url: https://github.com/chudeemeke/get-stuff-done/pull/23
---

# Codex GSD installer crashes after partial global install

## Resolution Update -- 2026-07-19

Read-only GitHub verification confirms draft PR #23 remains open at remote head
`2c9ba08745cf3bc13cec42b0c05feb2ae5f02233`. GitHub classifies the branch as
mergeable, but its merge state is blocked by the real failed 2026-07-14 CI and
Upgrade Verifier jobs. Billing is no longer the current blocker.

The installer closure contract remains locally green:

- `bun run test -- tests/codex-installer.test.js tests/installer-safety.test.js tests/version-provenance.test.js`
  passes 59/59 with 243 expectations.
- The local Phase 43 branch is ahead of the remote PR head and Plan 11AC remains
  uncommitted pending Fable adjudication. This local state is not represented as
  published, merged, or released.
- Plans 11AC-11AI own the local corrective path for the failed hosted cycle.
  Non-autonomous Plan 11AJ requires explicit user authorization before one new
  PR-head update and governed hosted cycle.

This inbox item therefore remains `in-progress`, with `get-stuff-done` as next
owner. Its closure trigger is unchanged: PR #23 must merge with the installer
regressions and transaction/provenance behavior intact. No GitHub mutation was
performed during this reconciliation.

## Resolution Update -- 2026-07-14

The implementation scope from the original high-severity installer report is
complete and tested on branch `phase43-upgrade-resilience-20260703`, now in
draft PR #23.

Current evidence:

- Plan 43-02 added staged preflight, transaction-scoped mutation, rollback of
  prior settings/metadata/manifests, and removal of only newly copied overlay
  files when upstream installation fails.
- Installer provenance now separates fork package/version from upstream
  package/version while retaining backward-compatible aliases.
- The no-frontmatter crash remains covered by the Codex installer regression.
- `bun run test -- tests/codex-installer.test.js tests/installer-safety.test.js tests/version-provenance.test.js`
  passes 59/59 with zero failures.

The `teams` warning is separate config-schema/extension-namespace debt owned by
backlog Phase 999.2; it is no longer part of the installer-crash closure
contract. This inbox item remains `in-progress` until PR #23 merges. Hosted CI
cannot currently execute because the GitHub account billing lock starts zero
job steps, so tested implementation must not be represented as merged or
released.

## Resolution Update -- 2026-07-03

The specific Codex no-frontmatter crash is fixed and locally verified on branch `worktree-agent-a1c0cd52236103329`.

Implemented evidence:

- Added an installer override for `bin/install.js` that makes `extractFrontmatterField()` return `null` for missing or empty frontmatter instead of calling `.match()` on `null`.
- Added `tests/codex-installer.test.js` covering a Codex agent markdown file with no YAML frontmatter.
- Verified composed runtime smoke with `node bin\install.js --codex --global --config-dir <temp>`; it exited 0 and wrote Codex config plus 38 agent TOML files.
- Ran full serial suite once: 1731/1733 passed; the two failures were Bun 5s default timeout ceilings in hook/platform tests, not assertion failures.
- Hardened those timeout-sensitive tests and reran `bun test ./tests/hooks.test.js ./tests/platform.test.js`: 191 passed, 0 failed.

Still open:

- Transactional install / preflight / rollback behavior for partial installs.
- VERSION mapping clarity between npm package version and installed tool version.
- `teams` config warning/schema reconciliation.

## Resolution Update -- 2026-07-01

Partially fixed in get-stuff-done PR #3 / branch `worktree-agent-a1c0cd52236103329`.

The stale milestone metadata symptom is fixed: this branch's composed runtime now reports memory-nexus Phase 42 under `v5.0 Market-Leader Memory Platform` instead of stale `v4.0 Intelligence Layer` metadata.

Still open:

- Transactional install / preflight / rollback behavior.
- VERSION mapping clarity between npm package version and installed tool version.
- `teams` config warning/schema reconciliation.

## Summary

During a memory-nexus session, the user asked to update and use the GSD framework. The Codex global update path failed after copying files and writing a new VERSION file.

The install command was:

```powershell
npx -y @chude/get-stuff-done@latest --codex --global
```

The command printed successful copy steps, including:

```text
Installed 61 skills to skills/
Installed get-shit-done
Installed agents
Wrote VERSION (1.32.0)
Wrote file manifest (gsd-file-manifest.json)
```

It then crashed:

```text
TypeError: Cannot read properties of null (reading 'match')
    at extractFrontmatterField (...\@chude\get-stuff-done\dist\bin\install.js:1004:29)
    at installCodexConfig (...\@chude\get-stuff-done\dist\bin\install.js:2829:18)
```

The wrapper reported:

```text
Upstream installer exited with code 1.
The installation may be in a partial state.
```

## Additional Evidence

Immediately before the update:

```text
C:\Users\Destiny\.codex\get-shit-done\VERSION = 1.30.0
npm view @chude/get-stuff-done version = 3.0.2
```

Immediately after the failed update:

```text
C:\Users\Destiny\.codex\get-shit-done\VERSION = 1.32.0
npm view @chude/get-stuff-done@latest version dist-tags = {"version":"3.0.2","dist-tags":{"latest":"3.0.2"}}
node C:\Users\Destiny\.codex\get-shit-done\bin\gsd-tools.cjs validate health = exits 0
```

The partial install is therefore usable for at least `gsd-tools.cjs validate health`, but the update workflow did not complete.

Additional symptom while using the partially updated GSD CLI from `C:\Projects\memory-nexus`:

```text
node C:\Users\Destiny\.codex\get-shit-done\bin\gsd-tools.cjs init execute-phase 41.1
```

The command correctly detected:

```text
phase_number = 41.1
phase_req_ids = EMBED-RES-01, EMBED-RES-02, EMBED-RES-03, EMBED-RES-04, EMBED-RES-05
plan_count = 1
incomplete_count = 1
```

But it still reported:

```text
milestone_version = v4.0
milestone_name = Intelligence Layer
```

The repository state frontmatter says `milestone: v5.0` and the active phase is under the v5 roadmap section. This is non-blocking only because memory-nexus currently uses `branching_strategy: none`; it could affect projects that derive branch names or reports from milestone metadata.

Second additional symptom while using the same partially updated GSD CLI:

```text
node C:\Users\Destiny\.codex\get-shit-done\bin\gsd-tools.cjs init execute-phase 41.1
```

The command reports this warning repeatedly:

```text
gsd-tools: warning: unknown config key(s) in .planning/config.json: teams — these will be ignored
```

But the same CLI can still read the key:

```text
node C:\Users\Destiny\.codex\get-shit-done\bin\gsd-tools.cjs config-get teams
```

returns the configured `teams` object. The key appears intentional project configuration, not junk metadata, so memory-nexus did not delete it. This looks like either a schema/validator mismatch or a stale config convention that needs a migration path.

## Expected Behavior

- The installer should not crash when a Codex config/skill/frontmatter input lacks parseable frontmatter.
- If an input is invalid, the installer should report the file path and continue or fail before mutating the target install.
- The displayed/written VERSION should be explainable relative to the npm package version and dist-tag.
- A failed install should leave an explicit rollback or partial-state recovery instruction.

## Impact

This affects GSD as shared workflow infrastructure. A partial install can cause future sessions to believe GSD is updated while some runtime config work did not complete.

## Suggested Fix

- Harden `extractFrontmatterField` against `null` frontmatter and include the offending file path in diagnostics.
- Make the installer transactional where practical: stage, validate, then swap/copy into the runtime directory.
- Add a post-install self-check that verifies required Codex config files, skill frontmatter, agents, manifest, and VERSION agree.
- Clarify whether npm package version `3.0.2` intentionally writes tool VERSION `1.32.0`; if intentional, document the mapping in update output.
- Make `init execute-phase` prefer `.planning/STATE.md` frontmatter or the active phase's roadmap section over older historical milestone headings when deriving milestone metadata.
- Reconcile `teams` config handling: either accept it in the GSD config schema, migrate it to the supported key path, or emit a targeted migration warning instead of saying intentional config will be ignored.

## Event Log
<!-- inbox-events:v1 -->
- 2026-06-22T00:00:00.000Z | memory-nexus | filed | Captured from a failed Codex global GSD update during Phase 41.1 pre-goal work.
- 2026-06-22T02:16:24.582Z | memory-nexus | in_progress | Added observed config schema mismatch: init warns that teams is ignored while config-get can still read the key.
- 2026-07-01T19:20:41.000Z | get-stuff-done | in_progress | Stale milestone metadata symptom fixed in runtime parser; installer crash and config-schema reconciliation remain open.
- 2026-07-03T01:21:54.000Z | get-stuff-done | in_progress | Specific no-frontmatter Codex installer crash fixed and locally tested; transaction, VERSION, and teams schema follow-ups remain open.
- 2026-07-14T04:55:00.000Z | get-stuff-done | in_progress | Plan 43-02 completes installer transaction, rollback, and version provenance; focused installer tests pass 59/59. PR 23 remains draft and hosted execution is billing-blocked.
- 2026-07-19T04:56:00.000Z | get-stuff-done | in_progress | Reverified 59/59 installer tests and PR #23 read-only. Billing is cleared; real CI/Upgrade Verifier failures and the user-gated corrective graph now block merge and closure.
- 2026-08-29T11:54:01.000Z | get-stuff-done | merged | Closure trigger fired: PR #23 squash-merged to main as ece379db with 21/21 hosted checks green at head a788ca94, including all three Test legs (installer/transaction/provenance suites) and Upgrade Verifier exitClassification success 9/9. The teams config-schema warning remains separate backlog Phase 999.2 debt as recorded above.

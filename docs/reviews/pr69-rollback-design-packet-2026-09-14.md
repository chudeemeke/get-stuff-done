# Bounded installer recovery design review

Review only; do not edit, run installation, change Git state, or spawn agents.
Give an implementation-ready recommendation in at most 1600 words. You may read
the listed source files. Do not restart the strategic audit or expand into CI.

## End state and constraints

This repository is a thin skin over pinned Open GSD. The user ratified the
September 5 contract: walk 1.9.1 through fixed 1.12.0; preserve customizations;
working ordinary Windows Claude/Codex and supported Linux installation; staged
updates, interruption/recovery, rollback and local-conflict preservation.
CI is separately owned. No approval, merge or readiness changes are authorized.
Do not silently reduce support or substitute refusal of all ordinary installs.

The user explicitly asked us to reconsider PR4's strict security assumptions
and even whether its standalone arbitrary-settings repair is the right product.
The proposed successor is managed-hook recovery through vetted install/update,
but that scope decision remains pending. Do not assume it accepted. Do not
assume every security goal requires universal ACL/SACL observability; distinguish
preserving a property from measuring it. No TxF or privilege requirement adopted.

## Verified current implementation

Candidate at 46e5f9057165583f83bba30dcd5de77bb1e37e39; application fix b6743baf.
`bin/install.js` is the fork-owned wrapper. It snapshots old manifest files,
old/new overlay files, settings, three metadata files and local patch/pristine
trees, then invokes `dist/bin/install.js` in the live target. It restores these
paths on failure and deletes the snapshot. `main()` performs legacy cleanup
before this transaction. Some supported runtime artifacts are in shared homes
outside the selected target. Codex has additional upstream-specific rollback.

Actual CLI acceptance at `tests/acceptance/installer-recovery.cjs` injects an
error at the first upstream manifest publication. The real wrapper exits1 and
prints `Rollback applied`, but 622 new files remain, including `.gsd-source`,
agents, core files and helpers. Original fixture settings and owner.txt survive.
Receipt: `.planning/evidence/pr69-installer-recovery-red-2026-09-14.json`.
The test fixture is small and project-local and is cleaned after each run.

The latest application fix removes recursive cleanup of shared script helper
directories, and changes upstream manifest creation to enumerate regular package
source files instead of claiming every destination .cjs file. 135 installer
tests pass. Previously contaminated manifests remain an ownership problem.

## Existing seams and known gaps

Read `node_modules/@opengsd/gsd-core/gsd-core/bin/lib/` as needed:

- runtime-artifact-layout.cjs: resolveRuntimeArtifactLayout(runtime, configDir,
  scope, capabilityRegistry) returns kinds with staging functions and home/dest.
- runtime-artifact-install-plan.cjs: stages command/skill/agent copy inputs;
  its contract explicitly excludes pruning, migrations, copying and final cleanup.
- install-engine.cjs: materialization and USER_OWNED_ARTIFACTS preservation.
- installer-migrations.cjs: rollback for its own migrations, not the whole install.
- `--dry-run` in the upstream CLI previews legacy cleanup, not the full write set.

Upstream is read-only. Existing fork override is `overrides/bin/install.js` with
`install.js.REASON.md`. Read its install body and dispatch as needed, especially
saveLocalPatches, shared hooks and root package.json, shared defaults, runtime
layouts, source/profile markers, settings writers and pre-install legacy cleanup.
`docs/reviews/pr69-application-2026-09-13.md` records the remaining review findings.

Do not solve this by copying/restoring the entire configuration directory:
it contains unrelated instructions, projects, credentials and concurrent owner
changes. Likewise a manifest emitted only after success cannot recover a partial
failure, and filenames alone do not establish ownership. Directory rollback in
the current wrapper can overwrite newer owner changes. Full source presence or
a single passing fixture is not proof of complete inventory or crash recovery.

## Review questions

Derive what must be true before any destructive write, then choose the smallest
design that can meet the end state with this upstream. Do we need a source-derived
preflight plan, an operation journal integrated at upstream mutation seams,
staged generation publication, or another proven structure? Avoid being anchored
by this list. Compare the chosen design against existing upstream seams and
explain precisely what must change in fork-owned files.

Identify which properties can be proven now and which require an explicit
support/architecture decision. Specify a bounded implementation sequence and
discriminating acceptance tests, including partial failure, complete new-file
accounting, owner edits during rollback, symlink/ownership handling and restart.
Reject a design that passes only the 622-file fixture or claims portability
without evidence. Also avoid a generic filesystem framework or a duplicated
upstream installer unless you can justify why the narrower solution cannot work.

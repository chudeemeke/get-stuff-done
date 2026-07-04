---
phase: 43
plan: 10
wave: 10
status: complete
date: 2026-07-03
requirements:
  - UPGRADE-05
---

# Phase 43 Plan 10 Summary - Live Target Reverify And Authority Bump

## Live Target Evidence

Captured before authority/package edits on 2026-07-03.

`npm view @opengsd/gsd-core version dist-tags versions --json`

- `version`: `1.6.1`
- `dist-tags.latest`: `1.6.1`
- `dist-tags.next`: `1.7.0-rc.2`
- stable versions include `1.5.0`, `1.6.0`, and `1.6.1`
- prerelease versions include `1.7.0-rc.1` and `1.7.0-rc.2`

`gh repo view open-gsd/gsd-core --json nameWithOwner,defaultBranchRef,isArchived,pushedAt,updatedAt`

- `nameWithOwner`: `open-gsd/gsd-core`
- `defaultBranchRef.name`: `next`
- `isArchived`: `false`
- `pushedAt`: `2026-07-03T23:37:40Z`
- `updatedAt`: `2026-07-03T23:37:43Z`

`git ls-remote --tags https://github.com/open-gsd/gsd-core.git`

- `refs/tags/v1.6.1` exists at `1c352d1ea37b010e99b8353905eb5def4f784100`
- prerelease `refs/tags/v1.7.0-rc.2` also exists but remains excluded by exact stable policy

Decision: proceed with exact stable target `1.6.1`. The prerelease `next` tag is not eligible.

## Authority Bump

- `.planning/upstream-authority.json` active pin changed from `1.5.0` to exact stable `1.6.1`.
- `scripts/lib/upstream-source.js` embedded fallback authority changed from `1.5.0` to exact stable `1.6.1`.
- `package.json` devDependency `@opengsd/gsd-core` changed from `1.5.0` to exact stable `1.6.1`.
- `bun.lock` updated for `@opengsd/gsd-core@1.6.1`.
- `node_modules/@opengsd/gsd-core/package.json` verified as `1.6.1`.

## Vetted Manifest Prune

- `.planning/vetted-upstream-versions.json` still contains exactly three stable versions: `1.5.0`, `1.6.0`, and `1.6.1`.
- blocking/current entry is now `1.6.1`.
- historical entries `1.5.0` and `1.6.0` retain existing matrix evidence from `compat-matrix-report.json`.
- current `1.6.1` has `vettedAt: null` until Plan 11 refreshes post-bump evidence.

## Verification

- `npm view @opengsd/gsd-core version dist-tags versions --json` passed and confirmed latest stable `1.6.1`.
- `gh repo view open-gsd/gsd-core --json nameWithOwner,defaultBranchRef,isArchived,pushedAt,updatedAt` passed and confirmed the repo is active.
- `git ls-remote --tags https://github.com/open-gsd/gsd-core.git` passed and confirmed `refs/tags/v1.6.1`.
- `node scripts/vetted-upstream-versions.js --prune-for-bump 1.6.1` passed before authority edit.
- `bun install --frozen-lockfile --ignore-scripts --cache-dir="$env:TEMP\gsd-bun-cache-plan10"` passed after install state matched the lockfile.
- `node scripts/vetted-upstream-versions.js --validate` passed.
- `bun test tests/upstream-source.test.js tests/vetted-upstream-versions.test.js` passed: 21 tests, 49 assertions.
- `node --check scripts\lib\upstream-source.js` passed.

## Observed Friction

- Direct `bun install --ignore-scripts` after changing `package.json` crashed Bun 1.3.5 on Windows with `panic(main thread): invalid enum value`.
- `bun install --ignore-scripts --lockfile-only` succeeded and wrote the correct lockfile.
- `bun add -d @opengsd/gsd-core@1.6.1 --ignore-scripts` updated `node_modules` to the target package.
- The required frozen install then passed with no changes.
- Mid-session correction: an intended temp isolation command used unsupported `New-Item -LiteralPath` on this shell, so `bun add` executed in the worktree. The resulting diff was verified and was exactly the intended target package update.

## Boundary

Override snapshots are not refreshed in Plan 10. Snapshot refresh, churn generation against the bumped pin, and post-bump package evidence belong to Plan 11.

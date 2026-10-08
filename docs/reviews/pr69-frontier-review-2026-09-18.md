# PR 69 installer work and PR 4 supersession: frontier review

Date: 2026-09-18. Reviewer: Claude Code session (Fable 5.1, effort high), read-only.
Subject: the unpushed range `origin/chore/upstream-bump-1.9.1..1e359c61` in the
`skin-campaign` worktree plus the uncommitted `bin/install.js` change, authored in
Codex sessions 2026-09-05 to 2026-09-14; and the PR 4 successor proposal in the
`pr4-application` worktree at `62f281c0`.

Method: full read of `bin/install.js` (1,166 lines), the Codex delta to
`overrides/bin/install.js`, `tests/acceptance/installer-recovery.cjs`,
`docs/reviews/pr69-application-2026-09-13.md`, and the PR 4 successor and
first-principles documents. Structure-only sampling of `tests/installer-safety.test.js`
(1,662 lines, 80 tests, 5 shared helpers); it was not read line by line.
**No tests, gates or coverage were run for this review.** Status: untracked file,
not committed; nothing else in the tree was touched.

## Verdict

The work is disciplined and honest: RED then GREEN receipts, explicit non-claims,
no relaxed timeouts, failures retained as evidence. The small pieces are correct.
It is not ready, and continuing in the same mode will not make it ready, because
six of the ten open blockers in the application report are symptoms of one design
choice that has not been revisited.

## Findings

| # | Severity | Finding | Codex aware? |
|---|---|---|---|
| F1 | High, design | Rollback restores an enumerated path list (old manifests, dist overlay list, six fixed names). The upstream child is a black box that writes elsewhere, so the list can never be complete. The real CLI leaves 622 candidate files after an injected failure while printing `Rollback applied`. The message is false today. | Yes, blocker 1, with a failing acceptance test |
| F2 | High | `main()` runs `cleanupV2` before `install()` creates the transaction, so legacy cleanup is outside any rollback. The legacy fallback recursively deletes `get-stuff-done`, `get-shit-done` and `gsd-core` by name when no manifest exists. The file header still says the installer "NEVER performs a recursive wipe" and that deleting user content is "structurally impossible". The header overclaims. | Partly, blockers 2 and 3; the header is not mentioned |
| F3 | Medium | The "always clean metadata" loop deletes `package.json` and `CREDITS.md` at the target root by name alone, using `path.join` rather than the containment helper every other deletion uses. | Partly, blocker 4 |
| F4 | Medium | `preserveLocalPatchHistory` (merged in PR 68) writes a new `before-update-<random>` generation into the user's config directory on every install. Nothing prunes it and the random suffix carries no order. Separately every install copies the whole managed tree into the OS temp directory. Both matter on a host that ran out of disk twice. | No |
| F5 | Medium, process | `tests/acceptance/installer-recovery.cjs` is referenced by no package script and no workflow. A failing acceptance test that nothing runs gates nothing. No coverage gate names `bin/install.js` either; the Tier S numbers come from manual runs. | No |
| F6 | Medium, hygiene | The range adds about 1,500 lines of code and 6,600 lines of planning and evidence, including a 4,475-line write trace. `HANDOFF.json` is 30 KB of narrative. A cold reader cannot find the position quickly, which is the file's only job. | No |
| F7 | Low | The uncommitted fix inserts `assertSupportedInstallMode` between `install()`'s JSDoc and `install()`, so the JSDoc now documents the wrong function. `main()` also now rejects `--all` together with `--uninstall`, which is reasonable and untested. | Yes, first half |
| F8 | Low | `readOwnershipManifest` ends its error with "no cleanup was started". True at both call sites today; it is a claim about the caller that the function cannot guarantee. | No |
| F9 | Low, older code | `patchStatusLine` on corrupt JSON writes a near-empty settings object over the file after one backup to a fixed `.backup` name, and stages through a fixed `.tmp` name. | Yes, blocker 7 |

What is good and should be kept as is: the `overrides/bin/install.js` change. It
is a 17-line delta that enumerates package source files instead of destination
files, so owner `.cjs` scripts are no longer claimed in the manifest. The reasoning
is right, `REASON.md` is updated, and it is a clean upstream contribution candidate
under D10's pre-filing audit. The ownership-manifest validation and the
uninstall target guard are also sound.

## Opinion: the category, not the sites

Blockers 1 to 6 share one cause. Ownership and rollback are **predicted** from
lists, and the lists are wrong at the edges. Patching each edge is what the last
two days did. The alternative is to **observe**: take a names-only listing of the
target before the child runs, and on failure remove what is new and restore what
the snapshot holds. Moving legacy cleanup inside the transaction closes F2 in the
same change. The cost is that a file an owner creates during the install window
would be removed on rollback; that window is seconds and can be narrowed by
intersecting with the new manifest when the child got far enough to write one.
This is a design decision for the owner and the frontier session, not something
to delegate as another patch.

## PR 4 supersession: claims checked

| Claim in the proposal | Checked against | Result |
|---|---|---|
| Upstream already migrates the stale managed hook and the installer calls it | `gsd-core/bin/lib/runtime-hooks-surface.cjs`, `bin/install.js:12119` at 1.9.1 | True |
| Upstream's migration ignores `shell` and hook `type` | The function body skips only on non-empty `args` | True; a real gap, and an upstream PR candidate |
| The doctor would not ship | `package.json` `files` and `bin` in the PR 4 worktree | True; `scripts/gsd-doctor.cjs` is not listed |

Assessment: supersession is the right call as a scope choice. Two things the
proposal understates. First, H1 to H8 do not shrink the work; they move PR 4's
hard problems (access-control preservation, concurrent writers, rollback) onto the
installer, which already carries ten open blockers. Second, no census of affected
installs exists, so "one reproduced case reopens this" is the only safety net and
should be kept exactly as written.

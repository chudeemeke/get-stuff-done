---
schema_version: "1.3"
source_project: conversations
created: 2026-08-18
type: refactor
severity: high
fix_status: tested
affects_scope: this-project-only
issue_id: conversations:2026-08-18:get-stuff-done-desktop-clone-dirt-classification
thread_id: conversations:2026-08-18:phase20-desktop-dirt
next_owner: conversations
status: merged
triaged_at: 2026-08-23
resolved_at: 2026-08-23
closure_notify_to: conversations
closure_notify_reason: "Phase 20's cutover eligibility ledger holds this project's target-dirt-dispositioned axis open until the classification is recorded"
---

# Classify the desktop clone's uncommitted state before the Phase 20 cutover

## Symptom

`conversations` Phase 20 migrates project authority from the laptop
(`C:\Projects`) to the desktop WSL tree (`~/Projects`). The `get-stuff-done`
desktop clone carries the largest uncommitted surface of any project in the
phase, and its nature is unknown to `conversations`. A count is not a
classification, and no attempt was made to classify it — that judgment belongs to
this project.

**Desktop clone** (the migration *target*), measured 2026-08-16 and
**not re-measured since**:

| Field | Value |
|---|---|
| Branch | `main` |
| HEAD | `265e365` |
| Dirty entries | `488` |
| Origin | `https://github.com/chudeemeke/get-stuff-done.git` |

**Laptop clone** (the migration *source*), measured 2026-08-17:

| Field | Value |
|---|---|
| Branch | `main` |
| HEAD | `4ff6945e33d62ad885647b905cd1980408ef043e` (`4ff6945`) |
| Dirty entries | 13 |
| Unpushed | **13 commits** |
| Origin | `https://github.com/chudeemeke/get-stuff-done.git` |

Origins byte-match, so the engine's origin comparison would pass today. Both
sides are on `main` but the HEADs differ, so the two trees have diverged on the
same branch name.

## Repro

From the desktop: `git -C ~/Projects/get-stuff-done status --short | wc -l`
returned 488 on 2026-08-16. Refresh before acting; these are point-in-time values.

## Root cause

Two engine behaviours make the desktop dirt blocking rather than cosmetic:

- `convergeRemoteProjectGit` requires the target `origin` URL to byte-match the
  source's, fetches the reviewed ref, and **refuses target-unique commits**. Any
  commit that exists only on the desktop clone fails the phase closed.
- Phase `E` excludes `node_modules/***` deliberately, so a dirty entry under
  `node_modules` is not what is being asked about here — but everything else is.

And one phase rule, quoted verbatim from `20-01-PLAN.md` Stage 1:

> Do not overwrite dirty targets without an explicit project-level decision.

That decision is this project's to make.

## Proposed fix

Classify **every** dirty path on the **desktop** clone into exactly one of:

1. generated or regenerable artifact,
2. unpushed work,
3. agent worktree residue,
4. local config or secret,
5. real source change.

Then preserve anything non-regenerable — a commit, a branch, a `git bundle`, or a
documented backup — and record the outcome.

**Why 488 is not automatically dismissible.** A number that large is consistent
with build output or agent worktree residue, and triaging it by eye is
impractical. But `get-stuff-done` is the GSD tooling itself: agent worktrees are
a *normal* artifact of running it, which makes category 3 the likely bulk — and
also makes category 5 easy to lose inside the noise. Prefer a mechanical split
(path-prefix grouping, `.gitignore` cross-check) over a visual scan.

**Both sides hold unique work.** The laptop additionally has **13 unpushed
commits**, so `origin` is behind the laptop, and the desktop is diverged from
both. No single tree is a superset. Reconciliation, not selection.

## Test plan

Whatever this project normally requires to trust its own tree: its test or
verification gate should pass on the tree that is declared authoritative, before
that tree is declared authoritative. `conversations` does not prescribe the gate.

## Suggested commit message

```
chore: classify and preserve desktop clone working-tree state

- Classify 488 uncommitted desktop entries as artifact/unpushed/worktree/config/source
- Preserve non-regenerable paths before Phase 20 authority cutover
```

## Risks / things to verify before merging

- The 2026-08-16 desktop figures are stale by construction. Re-measure first.
- Treating the whole 488 as disposable because most of it looks generated is the
  specific failure mode to avoid. Prove the residual is empty; do not assume it.

## A known laptop-side anomaly — referenced, not reassigned

The **laptop** `get-stuff-done` repo carries `core.bare = true` while possessing a
full working tree, so plain `git status` fails there with
`fatal: this operation must be run in a work tree`. The laptop dirty count above
(13) was obtained read-only through an explicit `--git-dir`/`--work-tree`
override, and the same override was used to measure this filing's own status
delta.

This is recorded and owned in `conversations` at
`.planning/phases/20-wsl-linux-workspace-migration/deferred-items.md`, **item 4**,
with a user disposition already taken on 2026-08-17: *investigate and fix during
`get-stuff-done` cutover preparation*.

**Do not act on it now, and do not treat it as part of this filing's ask.** It is
mentioned only so that a session hitting the `git status` failure recognises it as
a known, dispositioned anomaly rather than a new discovery. `conversations` did
not change that config and this filing does not ask this project to change it
either.

## Where this work happens, and what this filing does not authorise

In **this project's own CWD**, per the boundary rule
(`conversations` orchestrates; target projects execute). This filing explicitly
does **not** authorise `conversations` to clean, stash, reset, commit, or check
out anything in this repository. Nothing in this repository was modified to
create this filing except the addition of this file.

## Why this filing is in the laptop tree and not the desktop clone

The desktop clone is the migration **target**, and `convergeRemoteProjectGit`
**refuses target-unique commits** — so a filing committed on the desktop would
itself become a cutover blocker. Do not mirror this file to the desktop.

## Trigger

Act on this **before this project enters a 20-02 cutover queue**. Until the
classification is recorded, this project's `target-dirt-dispositioned` axis stays
blocked and no cutover can proceed.

## Related

- `conversations` `.planning/phases/20-wsl-linux-workspace-migration/20-INVENTORY.md`
  (both measured-state tables, and non-claim 12 on the `core.bare` measurement)
- `conversations` `.planning/phases/20-wsl-linux-workspace-migration/deferred-items.md`
  item 4 (the `core.bare` anomaly, owned there)
- `conversations` `.planning/phases/20-wsl-linux-workspace-migration/20-HANDOFFS.md`
  (the register row this filing backs)
- Cross-project inbox protocol: `~/.claude/rules/cross-project-issues.md`

## Classification (recorded 2026-08-23, get-stuff-done CWD)

Re-measured on the desktop (`~/Projects/get-stuff-done`, WSL Ubuntu) via
`remotely run` on 2026-08-23. All desktop operations were read-only except a
`git fetch origin` and the backup copy described below. Nothing in the desktop
working tree was cleaned, stashed, reset, committed, or checked out.

**Measured state:** branch `main`, HEAD `265e365`, `core.bare=false`,
**494** porcelain entries (475 ` M`, 6 ` D`, 13 `??`), 0 stashes.
After `git fetch origin`: desktop `main` is **11 ahead / 94 behind** `origin/main`.

| Category | Count | Paths | Evidence | Disposition |
|---|---|---|---|---|
| 1. generated / regenerable | 475 ` M` | every modified tracked file (`.planning/milestones/` 142, `.upstream/` 95, `get-stuff-done/` 101, `commands/gsd/` 26, `overlay/` 21, `tests/` etc.) | `git diff --ignore-cr-at-eol --numstat` leaves **0** files with any change. Pure CRLF-vs-LF: checkout at `265e365` predates the fork's `.gitattributes` eol policy and `core.autocrlf` is unset. | Discard. A fresh checkout reproduces the index content exactly. |
| 1. generated / regenerable (path-encoding artifact) | 6 ` D` + 6 `??` | `~/.ai-dev-env<U+F00D>/metadata/*` (tracked, shows deleted) and `~/.ai-dev-env/metadata/*` (untracked twin) | Directory literally named `~/.ai-dev-env` is **tracked on origin/main** (7 files; introduced in `c9a4a4c4`). WSL renders the illegal NTFS `` as U+F00D, so git sees the tracked name missing and an untracked twin. Content is aidev metadata junk, not this project's source. | Discard on desktop. Separate follow-up: remove the junk directory from the repo in a normal PR (see Residual below). |
| 3. agent worktree residue (regenerable) | 5 `??` | `40.5-CI-DIAGNOSIS.md`, `get-stuff-done/memory/gsd-executor.md`, `get-stuff-done/memory/gsd-plan-checker.md`, `overlay/hooks/gsd-check-update.js`, `overlay/hooks/gsd-statusline.js` | `git log --all --find-object=<blob>` finds each file's exact content in an existing commit (`e612d821`, `94ed5a26` x2, `3bceef99`, `0c693c7c`). | Discard; byte-identical copies live in history. |
| 3. agent worktree residue (non-regenerable text) | 2 `??` | `.planning/HANDOFF.json`, `.planning/phases/40.5-.../.continue-here.md` | `gsd-pause-work` handoff from 2026-05-06 for Phase 40.5 (long since merged via PR #3, 2026-07-03). Exact content exists in no commit; laptop copies at the same paths differ (6180 vs 7188 B, 6280 vs 12101 B). Historical, superseded, but narrative. | **Preserved** (see below), then discardable on desktop. |
| 2. unpushed work | 11 commits | `origin/main..main` on desktop | All 11 are ancestors of the laptop's `main` (`4ff6945e`), verified with `git merge-base --is-ancestor 265e365 4ff6945e` on the laptop. The laptop holds the same 11 plus 2 more (`ba83b99e`, `4ff6945e`). | Not desktop-unique. Reconciliation of this line against `origin/main` happens on the laptop (the source) as the next step; the desktop then receives the result through the Phase 20 convergence. |
| 4. local config / secret | 0 | — | No `.env*`, key, or credential paths among the 494 entries; no untracked files outside the groups above. | Nothing to do. |
| 5. real source change | **0** | — | Proven empty by the CR-at-EOL test (475 files) plus the blob-in-history test (5 files); the 2 handoff files are planning narrative, not source. | — |

**Preservation record:** desktop path
`~/Projects/_preserve/get-stuff-done-2026-08-23-predesktop-cutover/` holds
`.planning/HANDOFF.json`, the `.continue-here.md`, the full porcelain listing
(`git-status-porcelain-2026-08-23.txt`), `HEAD.txt`, and `SHA256SUMS`
(`0f9f5a51...` for HANDOFF.json, `c43408f6...` for .continue-here.md).

**Verdict for Phase 20:** the desktop working tree contains **no unique,
non-regenerable work** once the two handoff files are preserved. The desktop's
11 local commits are a strict subset of the laptop's 13 and are not
target-unique relative to the laptop. `target-dirt-dispositioned` can be marked
satisfied for this project. Overwriting the desktop tree from the reconciled
laptop line is acceptable.

**Residual (not part of this ask, surfaced per no-hidden-debt):**
- The tracked junk directory `~/.ai-dev-env/metadata/` on `origin/main`
  should be removed from the repo in its own PR; it will re-manifest as
  dirt on any WSL checkout until then.
- The laptop's 13-commit divergence from `origin/main` (94 behind) is the
  actual reconciliation work and is being handled next in this project's CWD.
- The laptop `core.bare=true` anomaly remains owned by `conversations`
  Phase 20 deferred item 4, untouched here.

## Event Log
<!-- inbox-events:v1 -->
- 2026-08-18T02:43:45.000Z | conversations | filed | Phase 20 plan 20-06 Task 2: desktop clone carries 488 uncommitted entries and the laptop holds 13 unpushed commits; requesting per-path classification before cutover.
- 2026-08-23T02:35:28.215Z | get-stuff-done | triaged | Re-measured desktop: 494 entries = 475 CRLF-only + 12 WSL path-encoding artifact + 5 blobs already in history + 2 handoff files (preserved at ~/Projects/_preserve/...). Zero real source changes; 11 desktop commits are a subset of laptop's 13.
- 2026-08-23T02:35:28.409Z | get-stuff-done | merged | Classification recorded; target-dirt-dispositioned satisfied. Residual: junk ~/.ai-dev-env dir tracked on origin/main needs its own PR.

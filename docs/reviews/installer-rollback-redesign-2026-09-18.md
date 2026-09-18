# Installer rollback redesign: observe, do not predict

Status: PROPOSED, awaiting owner approval. No installer code changes until approved.
Date: 2026-09-18. Author: Claude Code frontier session. Subject: `bin/install.js`
on `chore/upstream-bump-1.9.1` (draft PR 69). Supersedes the "Opinion" section of
`docs/reviews/pr69-frontier-review-2026-09-18.md` where the two differ.

## Problem

`createInstallTransaction` snapshots a predicted path list (old manifests, the dist
overlay list, six fixed names). The upstream child writes elsewhere, so a failed
install leaves 622 files behind while the wrapper prints `Rollback applied`
(blocker 1, `.planning/evidence/pr69-installer-recovery-red-2026-09-14.json`).
`main()` also runs `cleanupV2` before the transaction exists, so the only recursive
deletion in the file is the one step with no rollback (blocker 3, finding F2).

## Truths

1. The upstream child is a black box and its write set moves every release
   (`bin/install.js` grew about 800 lines from 1.9.1 to 1.14.0). No list stays complete.
2. The target is shared. `~/.claude` holds owner settings, owner agents and hooks, and
   transcripts that other live sessions write continuously. Its `projects/` directory
   alone is 843 MB on a disk at 96%, so neither a full snapshot nor a whole-target
   listing is acceptable.
3. Owner bytes are never deleted or overwritten by a rollback, including bytes that
   appeared during the install window.
4. A rollback message is a claim. It may say "applied" only after verification.
5. Every destructive step happens inside the transaction, or does not happen.

## Derived structure

1. **Open first.** `install()` creates the transaction before any mutation; the v2
   detection and cleanup move inside it as the first step.
2. **Observation roots, not the target.** Roots are the top-level entries of `dist/`
   plus roots named by the existing manifests. `projects/`, `todos/` and everything
   else outside the roots is never listed, never touched.
3. **Pre-image.** For the roots: a listing of path, type, size and mtime (no content).
   Content snapshots stay as today (old manifests, overlay list, `settings.json`,
   patch trees) plus the legacy roots that cleanup is about to remove.
4. **On failure:** (a) entries absent from the pre-image are *quarantined*, moved to
   one `gsd-rollback-quarantine/` directory, never deleted; (b) if the child got far
   enough to write a new manifest, new entries named in it are GSD-owned and are
   deleted instead; (c) snapshots are restored with the existing leaf logic.
5. **Verify, then speak.** Re-list the roots and compare with the pre-image. Equal:
   `Rollback applied`. Otherwise: `Rollback incomplete`, naming each path that was
   modified but not snapshotted, and the recovery directory. Exit code is non-zero
   in both cases; only the claim differs.
6. **Bounded disk.** One quarantine and one `before-update` generation are kept;
   the next successful install prunes older ones (finding F4).

Correction to the 09-18 review: it proposed a names-only listing of the *target* and
*removing* what is new. On this machine that would delete other sessions' new
transcripts. Items 2 and 4(a) are the fix.

## Against what exists

Kept unchanged: `targetRelativePath` containment, `copySnapshotPath` and
`restoreSnapshotPath`, ownership-manifest validation, the injectable seams and result
shape of `install()`, the 17-line `overrides/bin/install.js` ownership fix. Changed:
`createInstallTransaction` (adds the listing), `rollbackInstallTransaction` (quarantine,
verify, truthful result), `main()` (cleanup moves inside), the "always clean metadata"
loop (uses the containment helper, F3), the file header (stops overclaiming, F2).
Upstream's `runtime-artifact-install-plan.cjs` is a partial plan and is not adopted
as authority; Codex's own runtime rollback is not claimed for other runtimes.

## Alternative considered: stage, then publish (spiked, not adopted)

Run the child against a staging directory via `--config-dir`, diff it, and publish
the delta with the wrapper's own verified writer; a child failure then costs
`rm staging`. It is the stronger design only if the child's output is relocatable.

Spike, 2026-09-18, owner-approved, temp directories and a fake HOME only (the real
`~/.claude` fingerprint was identical before and after): the composed 1.9.1 child
exited 0 and wrote 632 files, none outside the config dir. **204 of the 632 (32%)
embed the absolute config-dir path**, 703 occurrences: 110 files under `gsd-core/`,
62 skills, 31 agents, and `settings.json`. All 703 use one encoding (`C:/...`,
forward slashes), so a token rewrite is mechanically possible, but it is a second
writer over 204 files that needs the same proof as the first; 18 files also carry
`~/` or `$HOME` forms, so the output shape may depend on where the config dir sits
relative to HOME, which one run does not settle; and the child reads live state
(settings merge, local-patch detection), so staging must be seeded faithfully.
Verdict: not clean, does not supersede. Revisit only if upstream stops baking
paths (#3662 moved the hook runner that way; the generated content has not followed).

## Blockers from `pr69-application-2026-09-13.md`

Closed by design: 1, 3. Narrowed: 2 and 4 (rollback no longer needs an ownership
verdict; cleanup still does), 5 (all publication through the containment helper).
Not addressed here: 6 patch-tree residue, 7 settings backup and staging names,
8 multi-destination modes, 9 fresh matrix and Tier S evidence.

## Proof

`tests/acceptance/installer-recovery.cjs` becomes a gate: a package script and a CI
step run it (F5). Transaction functions are Tier S: 100% branches, plus adversarial
cases for an owner write inside a root during the window, a junction inside a root,
a locked file on Windows, a child killed mid-write, and disk-full during snapshot.
Each case asserts the message as well as the bytes.

## Decisions requested

1. Approve the observe model with scoped roots and quarantine.
2. Confirm the roots authority: `dist/` top-level entries plus existing manifests.
3. Confirm quarantine retention: one directory, pruned by the next successful install.

# 1.9.1 override port and acceptance

Source: `@opengsd/gsd-core@1.9.1`; release tag commit
`957ebd8e6c62201ce7a44d49bfa92a1c0807cc25` verified through GitHub.
The npm integrity is recorded in bun.lock and the retained pack receipt.

After PR64 and PR63 merged, the campaign integrated main `b1f10321`.
PR65's exact TAP fix was approved and merged as `f77b38d8`. Main is integrated.

No-override candidate run:302pass,14fail,0skip,11suites,exit1. Same failing
assertions as the corrected 1.8.0 experiment, so no adoption-test changes were
needed. Full suite TAP and failure dispositions are retained in
`bump-1.9.1-drop-experiment.json`. Counts alone do not prove individual necessity.

| Override | Disposition and retained behavior | Adoption / retirement trigger |
|---|---|---|
| bin/install.js | Retain null-frontmatter guard, source-marker cleanup, shared-default rollback and correct Kimi Code help | New installer base adopted; retire each patch when candidate installer fixtures pass without it |
| init.cjs | Retain STATE current-phase preference and roadmap-only next phase | Adopt upstream shared verification router; helper insertion moved after upstream refactor; negative init assertions remain red without skin |
| plan-scan.cjs | Retain derivative exclusion and bounded PLAN token matching | Fresh base plus two narrow regex changes; negative roadmap classification assertions |
| roadmap-parser.cjs | Retain body/active milestone authority and scoped shared details | Keep new unreadable-roadmap diagnostic path; selection is inserted inside existing guarded read; negative stale-frontmatter assertion |
| roadmap.cjs | Retain declared-plan counts, STATE phase choice, exact checklist edits and byte-preserving publisher | Adopt new base; negative eight roadmap assertions cover these behaviors |
| state.cjs | Retain declared future plan accounting | New state-transition changes adopted intact; negative state accounting assertions |
| gsd-check-update.js | Retain package-lineage cache/update contract | Upstream bytes unchanged; existing hook fixtures; retire when native package-lineage seam covers fork package |
| gsd-check-update-worker.js | Retain nonblocking package-lineage update worker | Upstream bytes unchanged; existing hook fixtures; same retirement trigger |
| gsd-statusline.js | Retain branding, theme, lineage updates and todo/state display | Adopt native1.9.1 CRLF parser instead of reapplying equivalent fork parser; retain null-input normalization; hook tests required |

Owner for all retained deltas: get-stuff-done. The internal CJS files have no
verified supported seam for these specific output/publication semantics at this
candidate. They remain explicitly reviewed full-file overrides, not a claim that
all full-file copies have been eliminated. Final1.12.0 review must reassess them.

Port method: stripped only whole-line eslint directives, rebuilt from pure new
base, applied reviewed fork patches with zero fuzz, resolved three rejects
against new functions, then verified base and semantic hashes. Generated patch
.orig/.rej files were moved outside the overlay tree into the evidence archive.
The actual composed candidate passed316/316 compatibility tests,0skip,exit0.
The formal matrix report subsequently passed; final-head gates remain pending.

The separate pure1.12.0 state/commit acceptance suite also ran under native Linux
Node24.20.0 (download checksum verified), with the same9pass/3fail result as
Windows. See `skin-1.12.0-state-linux-pure.tap`; this is not installed evidence.

Matrix attempt 1 (2026-09-05T05:34:05Z) failed: roadmap18pass/2fail due to
PowerShell ETIMEDOUT; other candidate suites passed. Full failed envelope:
`bump-1.9.1-compat-timing-failure.json`. It has not been applied to the vetted
manifest. The prior direct candidate run passed316/316. Rerun the matrix without
concurrent installer suites, retaining the original timeout and both results.

The serial retry at 2026-09-05T05:43:02Z passed 316 tests, zero failures or
skips across 11 suites, exit 0. `bump-1.9.1-compat.json` was applied to the
vetted manifest and its contained report hash verified by `--validate`.
The original timeout is unchanged and the failed report remains available.

An additional focused statusline regression passes for CRLF STATE input with
block-list frontmatter, milestone progress and next-command selection.
Independent bounded review of commit 060f5b1a against both pure packages and
the five authoritative 1.9.1 TypeScript source files found no actionable
findings (local-confidence-high). The review specifically verified the three
manual resolutions and did not rerun tests or independently validate receipts.

Pure1.12 installed-effort diagnostic now exercises actual repair followed by
no-op sync in isolated Windows Claude and Codex homes. Claude checker returns
to high effort; Codex removes stale Anthropic model/effort pins and inherits
native host configuration. All three native plan/execute/namespace routes
exist, including Codex's `.agents/skills` location. Installed helper hashes
match the prior pure-release receipt. See
`skin-1.12-pure-effort-write-probe.json`. The temporary agent/config bytes were
restored after the probe. This does not close final composed-skin or fresh
session acceptance; installedSkinAcceptance remains false.

The post-review1.9.1 matrix report
`bump-1.9.1-compat-installer-review.json` records315 passes and one Windows
PowerShell ETIMEDOUT in roadmap preservation. It is retained as failed evidence
and was not applied to the vetted manifest. Fresh complete evidence is required.

Recovery after interruption verified the complete retry report
`bump-1.9.1-compat-installer-review-retry.json`: 316 passed, zero failed or
skipped, exit 0, generated 2026-09-05T09:31:15Z. This report is now applied to
the vetted manifest and `--validate` passes. Full candidate pre-push and hosted
checks still need refreshing after the installer corrections.

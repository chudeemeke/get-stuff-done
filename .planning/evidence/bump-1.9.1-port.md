# 1.9.1 override port and acceptance

Source: `@opengsd/gsd-core@1.9.1`; release tag commit
`957ebd8e6c62201ce7a44d49bfa92a1c0807cc25` verified through GitHub.
The npm integrity is recorded in bun.lock and the retained pack receipt.

After PR64 and PR63 merged, the campaign integrated main `b1f10321`.
PR65's exact TAP fix is staged by cherry-pick `e29b75c6`; its merge approval
is pending separately. The bump does not bypass that owner gate.

No-override candidate run:302pass,14fail,0skip,11suites,exit1. Same failing
assertions as the corrected 1.8.0 experiment, so no adoption-test changes were
needed. Full suite TAP and failure dispositions are retained in
`bump-1.9.1-drop-experiment.json`. Counts alone do not prove individual necessity.

| Override | Disposition and retained behavior | Adoption / retirement trigger |
|---|---|---|
| bin/install.js | Retain null-frontmatter guard and uninstall source-marker cleanup | New installer base adopted; retire each patch when candidate installer fixtures pass without it |
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
The formal matrix report and remaining final-head gates are pending.

The separate pure1.12.0 state/commit acceptance suite also ran under native Linux
Node24.20.0 (download checksum verified), with the same9pass/3fail result as
Windows. See `skin-1.12.0-state-linux-pure.tap`; this is not installed evidence.

Matrix attempt 1 (2026-09-05T05:34:05Z) failed: roadmap18pass/2fail due to
PowerShell ETIMEDOUT; other candidate suites passed. Full failed envelope:
`bump-1.9.1-compat-timing-failure.json`. It has not been applied to the vetted
manifest. The prior direct candidate run passed316/316. Rerun the matrix without
concurrent installer suites, retaining the original timeout and both results.

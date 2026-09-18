# PR 4 supersession: do newer upstream releases remove the need?

Date: 2026-09-18. By: Claude Code frontier session, read-only against upstream.
Question from the owner: before answering the supersession decision in
`pr4-successor-acceptance-2026-09-14.md`, check whether `@opengsd/gsd-core` releases
newer than the pinned 1.9.1 already resolve the gap.

Answer: **no.** Through 1.14.0 (npm `latest` on this date) the reproduced gap is
unchanged, and nothing on the upstream tracker addresses it.

## Method

`npm pack` of 1.12.0 (the decided bump endpoint) and 1.14.0 into a scratch
directory, no install scripts run. `rewriteLegacyManagedNodeHookCommands` in
`gsd-core/bin/lib/runtime-hooks-surface.cjs` and `isManagedHookBasename` in
`gsd-core/bin/lib/shell-command-projection.cjs` extracted and diffed against the
installed 1.9.1. Zero-match searches were validated with a known-positive control
(`h.command`, 8 hits). Tracker search: `gh search issues --repo open-gsd/gsd-core`.

## Findings

| Claim in the successor proposal | 1.9.1 | 1.12.0 | 1.14.0 |
| --- | --- | --- | --- |
| Upstream migrates the stale managed hook and the installer calls it | `bin/install.js:12119` | `:12622` | `:12931` |
| Migration ignores the hook's `shell` | true | true | true |
| Migration ignores the hook's `type` | true | true | true |
| `args: []` is treated as shell form (skip is on non-empty `args` only) | true | true | true |
| Ownership is decided by basename alone | true | true, function identical | true, function identical |

The migration function is byte-identical between 1.12.0 and 1.14.0. Its one change
since 1.9.1 is upstream #3662 (PR #3790): the runner is now resolved at hook-fire
time, entries already in chain or resolver form are skipped, and the old rule that
skipped a two-token entry whose runner path was already stable is gone, so every
two-token managed entry is now re-projected. Inference, not tested here: that widens
the set of entries the migration rewrites, so a valid explicit-PowerShell or
exec-form entry with a managed basename is more exposed at 1.12.0 than at 1.9.1,
not less. The H2 matrix fixtures would confirm or refute this at the endpoint.

Tracker: every related item is closed or merged and concerns the runner path
(#3329, #3460, #2185, #3662, #3790, #4375). No open issue or PR mentions `shell`,
`type` or empty `args` in the legacy migration. The upstream contribution candidate
named in the frontier review is still unfiled and still needed.

## Effect on the decision

The supersession proposal's premises hold at the endpoint and at `latest`, so the
recommendation is unchanged: accept as a scope choice, keep the "one reproduced
case reopens this" trigger verbatim. What a newer pin does not buy: rows 2, 3 and
the `args: []` row of the disposition matrix still need a fork-side seam or an
upstream fix before H2 can pass. Separate observation: the decided endpoint 1.12.0
is already two minor releases behind `latest`; whether to move it is a D-series
decision and is not reopened here.

# Override: gsd-core/bin/lib/plan-scan.cjs

## Why

Open GSD's loose legacy root-plan fallback classifies derivative review
artifacts such as `42-PLAN-REVIEW.md` and documents that merely reference a
plan ID, such as `43-FABLE-PLAN11AC-ADJUDICATION-PACKET.md`, as executable
plans. Every consumer of the shared plan-scan module then receives inflated
plan counts, including roadmap analysis, progress, phase, and verification
read models.

The original `PLAN-REVIEW` defect was tracked by
[`open-gsd/gsd-core#2252`](https://github.com/open-gsd/gsd-core/issues/2252).
PR 2263 closed that issue and stable `1.7.0` ships its exact review-suffix
exclusion. Stable `1.7.0` still classifies embedded plan references such as
`PLAN11AC` through the broad `/PLAN/i` fallback. This shared override therefore
retains a broader local semantic delta after the original issue closure.

## Upstream snapshot

- Version: 1.8.0
- SHA-256: b5885c315a3de5ea72b504b87faa51ed7baca5330b966cf6bfdec9079a8a1f1c

## What's different

- Rejects case-insensitive `PLAN-REVIEW.md` and `*-PLAN-REVIEW.md` derivative
  artifacts before the loose legacy fallback.
- Requires `PLAN` to be a delimiter-bounded filename token in the legacy
  fallback, preserving names such as `legacy-plan-draft.md` while excluding
  embedded references such as `PLAN11AC`.
- Preserves strict `PLAN.md` and `*-PLAN.md` recognition, documented nested
  plan forms, loose legacy root-plan names, and all summary behavior.
- Makes no writer or caller-specific change; existing consumers continue to
  depend on the one shared classifier.

## Review trigger

On every Open GSD pin change, inspect `src/plan-scan.cts` and the disposition of
issue #2252. Remove this override only when the pinned upstream also excludes
embedded non-plan references such as `PLAN11AC`, or the fork deliberately
renames every such derivative artifact, and the direct, roadmap, repository,
and N=3 compatibility gates remain green without it. No new upstream issue or
comment for the broader delta is claimed.

## Bump review 2026-08-30 (1.6.1 -> 1.7.0)

Reviewed 2026-08-30 for 1.6.1 -> 1.7.0: upstream 1.7.0 ships its own PLAN_REVIEW_RE (from #2263) but it is a strict subset of the fork constant, and the LOOSE_PLAN_TOKEN_RE embedded-reference exclusion (PLAN11AC class) is still fork-only. Override rebased onto the 1.7.0 base; residual delta is 2 constants + the loose-token test line.

Port recipe note: upstream inline `// eslint-disable-next-line @typescript-eslint/...` comments are stripped from the ported file as a standing part of every forward-port (the fork does not load that eslint plugin; behavior-neutral). Expect them to reappear in raw diffs against the pure upstream file.

## Bump review 2026-08-30 (1.7.0 -> 1.8.0)

Reviewed 2026-08-30 for 1.7.0 -> 1.8.0: upstream added #2349 superseded-plan
exclusion (frontmatter `status: superseded` drops a plan from both counts, with
a hardened bounded read) — adopted intact via the pure-1.8.0 base. The fork
delta is unchanged and still required (drop-experiment: roadmap.test.cjs
plan-reference exclusions fail on pure 1.8.0): PLAN_REVIEW_RE superset +
LOOSE_PLAN_TOKEN_RE embedded-reference exclusion.

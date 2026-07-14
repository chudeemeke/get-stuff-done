# Override: gsd-core/bin/lib/plan-scan.cjs

## Why

Open GSD's loose legacy root-plan fallback classifies derivative review
artifacts such as `42-PLAN-REVIEW.md` as executable plans. Every consumer of
the shared plan-scan module then receives inflated plan counts, including
roadmap analysis, progress, phase, and verification read models.

The upstream defect is tracked by
[`open-gsd/gsd-core#2252`](https://github.com/open-gsd/gsd-core/issues/2252).
This shared override keeps all consumers consistent while the exact pin remains
affected.

## Upstream snapshot

- Version: 1.6.1
- SHA-256: 07cadb766a55c6d018f10da4d4a487e21190361dc3f2b71a7c5225121b292a9d

## What's different

- Rejects case-insensitive `PLAN-REVIEW.md` and `*-PLAN-REVIEW.md` derivative
  artifacts before the loose `/PLAN/i` legacy fallback.
- Preserves strict `PLAN.md` and `*-PLAN.md` recognition, documented nested
  plan forms, loose legacy root-plan names, and all summary behavior.
- Makes no writer or caller-specific change; existing consumers continue to
  depend on the one shared classifier.

## Review trigger

On every Open GSD pin change, inspect `src/plan-scan.cts` and issue #2252. Remove
this override when the pinned upstream excludes PLAN-REVIEW derivatives and the
fork's direct, roadmap, repository, and N=3 compatibility gates remain green
without it.

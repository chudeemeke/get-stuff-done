---
phase: 43
status: evidence-only
captured: 2026-07-19
subject: "@opengsd/gsd-core@1.7.0"
---

# Open GSD 1.7.0 Stable Refresh

## Scope

This is read-only upstream and package evidence. It does not change the active
`1.6.1` pin, the vetted matrix, an override, a lockfile, GitHub state, or plan
completion.

## Stable Release Evidence

Live npm metadata reports:

- `latest`: `1.7.0`
- `next`: `1.7.0-rc.6`
- stable publication: `2026-07-15T01:43:20.678Z`
- package `gitHead`: `b1c9381b7abbf443f16c197118236b45cdd0486a`
- package integrity:
  `sha512-pWQTelxXYMBtsWNCHO9zNxUB+uWVmljjQvWB6Nyb9mk38GKfRxa+IZt5woS1gJwWQjEsiNjlgDyh6qXEaxxxhw==`

The stable release occurred after the 2026-07-13 check that established `1.6.1`
as latest. The active exact pin is therefore now behind current stable authority
but remains unchanged pending a reviewed bump.

## Issue 2252 Disposition

`open-gsd/gsd-core#2252` is closed as completed. Maintainer `trek-e` closed it
after PR 2263, `fix(#2252): exclude PLAN-REVIEW artifacts from plan count`,
merged commit `70a34d0eb0ae455a5c187052e1885e085b9322e1` into `next` on
2026-07-14.

The exact stable registry tarball contains `PLAN_REVIEW_RE` and excludes
`42-PLAN-REVIEW.md`. A bounded runtime probe of the released classifier returned:

| Filename | Stable 1.7.0 classification |
| --- | --- |
| `42-PLAN-REVIEW.md` | not a plan |
| `43-FABLE-PLAN11AC-ADJUDICATION-PACKET-2026-07-19.md` | plan |
| `legacy-plan-draft.md` | plan |
| `42-01-PLAN.md` | plan |

The probe stubbed only unrelated `countMatchedSummaries` loading and invoked the
released `isRootPlanFile()` implementation directly. The package tarball and
empty probe directory were removed afterward.

## Consequences

- Issue 2252's original suffix bug is fixed in stable upstream.
- The local override is not redundant because it also requires a
  delimiter-bounded legacy `PLAN` token and excludes embedded references such as
  `PLAN11AC`.
- The override reason and removal trigger must distinguish the closed upstream
  issue from this broader local semantic delta.
- The exact-three matrix should rotate to `1.6.0`, `1.6.1`, and `1.7.0` only as
  part of a successful reviewed bump; the helper already defines that result.
- Package, authority, snapshot, upgrade, matrix, override-churn, and N=3 evidence
  must move together before the next hosted authority cycle.

## Proposed Planning Boundary

Do not fold 1.7.0 into the in-review Plan 11AC diff. Ask Fable whether to insert
a dedicated corrective plan after local Plans 11AD-11AI and before the
non-autonomous 11AJ hosted cycle, or to split bump and override reconciliation
into separate plans. The selected plan must be TDD-first, exact-pinned, and
rerun every affected local gate before public authorization is requested.

No upstream comment, issue, pull request, branch, package install, or public
mutation occurred during this refresh.

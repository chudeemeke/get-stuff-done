---
project: get-stuff-done
reviewer: Claude Fable 5
reviewed: 2026-07-14
scope: whole-project strategy, architecture, sequencing, and implementation risk
source_brief: 43-FABLE-WHOLE-PROJECT-BRIEF.md
session_id: 12b9b3d9-ed7f-4a7f-ba0c-ec517db521fb
status: dispositioned
---

# Fable Whole-Project Review And Disposition

## Provenance

The review was produced by `claude -p --model fable` from the prepared
whole-project brief. The successful retry was tool-free, so Fable reasoned from
the brief and its supplied evidence anchors rather than independently reading
the repository. Repository claims below were rechecked after recovery.

Fable's response included prose describing project-memory tool calls. The
tools-disabled process did not perform those calls and the claimed advisory
note does not exist. That preamble is excluded from the review record. The
review content and standing checkpoints are retained here.

## Executive Verdict

Fable judged the desired end state coherent and reachable through incremental
correction. It recommended keeping exact-pinned Open GSD authority and the
overlay/override composition model. The authority migration and the bounded
1.6.1 recovery provide practical evidence that the architecture can absorb an
upstream change without a rewrite.

The strongest remaining risks are execution risks:

1. the Jest/native-Node/c8 coverage merge must be proven truthful before the
   coverage-closure plans rely on it;
2. the branch needs hosted CI evidence before more work accumulates;
3. expired macOS performance exceptions need a variance-aware replacement or
   a current empirical rebaseline;
4. the plan-scan denominator defect must be corrected before coverage and
   progress closeout; and
5. release readiness must prove composed-product scenarios, particularly
   cross-platform reproducibility, rollback, install, and uninstall, in
   addition to fork-source coverage.

## Findings And Disposition

### F1 - Coverage-toolchain feasibility is the dominant technical risk

**Fable finding:** Plans 11E-11J depend on the coverage foundation producing truthful merged V8
coverage. Source-map, realpath, line-ending, and runner-counter differences can
make a green aggregate untrustworthy.

**Disposition: ACCEPT.** Plan 11W now requires a machine-readable feasibility
verdict per source group, fixed fallback rules, and a no-go result when neither
merged nor disjoint runner evidence can be proven. Thresholds cannot be
averaged, lowered, or waived.

### F2 - Release-relevant debt was not fully slotted

**Fable finding:** macOS performance exceptions, INST-04, and the changelog
checker could arrive at Phase 44 without ownership.

**Disposition: PARTIAL.** The performance and changelog risks are verified.
INST-04 was stale input: `.planning/PROJECT.md` records it resolved in Phase
40.6, and focused tests on 2026-07-14 passed 10/10 for overlay-manifest removal,
user-file preservation, and idempotent uninstall. No duplicate installer work
will be scheduled. Phase 44 already owns reproducibility and the README value
proposition; those criteria will be strengthened rather than duplicated.

### F3 - Corrective work lacks hosted-CI validation

**Fable finding:** local evidence cannot expose hosted runner differences, and
the branch had no remote branch or PR.

**Disposition: ACCEPT.** Push a draft PR and obtain a hosted CI verdict before
Plan 11D. Resolve any blocking failures through GSD before the coverage wave.

### F4 - The coverage denominator needs mechanical anti-gaming controls

**Fable finding:** classification intent alone does not prevent source removal,
reclassification, weak tests, or validator drift.

**Disposition: ACCEPT WITH STRICTER POLICY.** Plan 11D defines the denominator
digest, classified diff, and exactly-once ownership contract; Plan 11W proves
runner feasibility against that contract for reuse by 11J. Unlike Fable's proposed
line-ignore release valve, this project retains its no-ignore rule: unreachable
production branches must be tested through ports, refactored, removed as dead
code, or reclassified only through an explicit reviewed source-contract change.

### F5 - The product is broader than the phrase "narrow overlay"

**Fable finding:** the fork owns a distribution platform around an upstream
core, and the 41 root-mirror violations expose ownership ambiguity.

**Disposition: ACCEPT TERMINOLOGY; INVESTIGATE DEBT.** Keep overlay/override
composition, but describe the product as a managed GSD distribution with an
upstream core. Phase 44 entry must classify the 41 violations by plausible
upstream collision risk. The blocking no-regression ratchet remains in force.

### F6 - Product and maintenance economics need explicit release evidence

**Fable finding:** release mechanics alone do not explain why a user installs
the distribution or what upstream-support cadence is sustainable.

**Disposition: PARTIAL.** Phase 44 already requires a README value proposition.
Add an explicit support/bump-cadence statement and measure the first
post-release upstream bump as a maintenance fire drill.

### F7 - Upstream defect inheritance needs a repeatable response

**Fable finding:** the plan-scan defect demonstrates that exact-pin adoption
can immediately import upstream read-model defects.

**Disposition: ACCEPT.** Open GSD `1.6.1` and `next` remain affected. Upstream
issue `open-gsd/gsd-core#2252` records the defect. Plan 43-11L owns a minimal
reviewed override, N=3 revalidation, and an explicit removal trigger. Plan 11H
will add this class to bump preflight evidence.

### F8 - Calendar-expiring performance exceptions are process debt

**Fable finding:** repeated dated exceptions encourage renewal instead of
measuring runner variance.

**Disposition: ACCEPT.** Do not add another exception. Use the next hosted run
to choose between a real baseline refresh and a variance-aware policy with
machine-tested bounds.

## First-Principles Architecture Assessment

The irreducible product truths are:

1. upstream changes independently and may ship defects;
2. every fork-owned replacement needs provenance, ownership, staleness, and a
   removal trigger;
3. the distribution must be reproducible from an exact pin plus declarative
   overlays and overrides;
4. product behavior is judged through install, upgrade, rollback, uninstall,
   and support scenarios; and
5. a single-maintainer system needs machine-enforced continuity and gates.

The existing exact pin, composer, override contracts, compatibility matrix,
upgrade simulator, rollback boundary, provenance, and SBOM match the minimum
architecture implied by those truths. No rewrite or authority reversal is
justified. Remaining work is to prove the guarantees consistently across
runners and platforms.

## Accepted Critical Path

0. Persist this review, execute Plan 11L, push a draft PR, obtain hosted CI,
   and resolve the macOS performance policy from current evidence.
1. Execute 11D for source ownership/Jest parity, then 11W for per-group
   feasibility, denominator ratchet, fixed fallback policy, and no-ignore policy.
2. Run Plan 11X's whole-project Fable checkpoint, then execute 11K and use 11E
   as the first closure-quality and velocity sample.
3. Reassess the seven bounded 11F/11U/11G/11V/11H/11Z/11I source groups from
   evidence without weakening their source ownership or acceptance gates.
4. In Plan 11Y before 11J/11AA/11AB, prove the validator contract is
   semantically identical to the contracts established by 11D and 11W.
5. Rerun original Plan 11, then Plan 12, after all corrective mutations.
6. Enter Phase 44 only with the blocker table re-adjudicated and hosted CI
   green.

## Release Blocker Table

| Item | Disposition |
|---|---|
| 95% for each canonical fork-source metric | Blocking |
| SHIP-08B shipped-snapshot assurance | Blocking |
| Hosted CI on current corrective branch | Blocking before 11D |
| Plan-scan denominator defect | Blocking before 11D via 43-11L |
| Expired macOS exception policy | Blocking before 11D if hosted CI exercises it; otherwise resolve before 11G |
| Changelog checker scope/behavior | Decide or remove before Phase 44 wiring |
| Two-platform reproducibility evidence | Blocking in Phase 44 |
| Install/upgrade/rollback/uninstall scenario evidence | Blocking in Phase 44; INST-04 itself is resolved |
| 41 boundary violations | Audit-block at Phase 44 entry; fix collision-possible subset |
| 999.2 legacy config keys | Deferred unless install/upgrade behavior depends on one |

## Standing Fable Lead Checkpoints

Fable is the project's standing lead developer, architect, and designer, not a
one-plan reviewer. Its reviewed technical and design direction is adopted by
default. Future briefs must be delta-based, include machine evidence plus
changed decisions, and request an explicit decision, implementation direction,
prioritized corrections, and rationale. Repository facts, executable evidence,
security, WoW, and locked user decisions remain constraints; conflicts with
those constraints require evidence and user adjudication.

1. **After the first real hosted CI run and before 11D:** tracked exact-head
   envelope with ancestor checked-commit and governed-digest continuity,
   full workflow/job/step evidence, runner-specific failures, performance
   observations, and branch-protection drift.
2. **After the coverage foundation:** denominator manifest/diff, per-runner samples, feasibility
   verdict, fallback result, and anti-gaming checks.
3. **After 11K, 11E, and 11T:** coverage deltas, representative test-quality
   samples, closure velocity, and plan-granularity decision for the seven
   remaining source groups.
4. **Before 11J/11AA/11AB:** proof that the aggregate validator uses the 11D/11W
   contracts without semantic drift.
5. **After original Plan 11:** regenerated N=3 matrix, snapshots, churn, SBOM,
   assurance evidence, and hosted CI.
6. **At Phase 44 entry:** re-adjudicated blocker table, boundary collision
   classification, performance policy, and changelog-checker disposition.
7. **Pre-publish:** cross-platform reproducibility comparison, install through
   uninstall/reinstall proof, product statement, support policy, and docs gates.
8. **First post-release bump:** elapsed time, corrective plan count, failure
   classes, and resulting maintenance-cadence decision.

## Checkpoint Record Contract

Every checkpoint is evidence-bearing. An exact heading alone is insufficient.
The checkpoint section must contain:

- `Status: dispositioned`;
- the exact invocation `claude -p --model fable`;
- the full subject commit plus checkpoint-specific input-manifest, deterministic
  input-packet, and captured execution-receipt SHA-256 values;
- the fresh execution nonce echoed exactly once by the returned review;
- SHA-256 recomputed from the uniquely marked returned-review body using the
  canonical LF-normalized byte contract in Plan 11P;
- finding total plus accepted, accepted-with-revision, rejected-with-evidence,
  and deferred counts whose sum equals the total;
- non-empty `Lead Decision`, `Implementation Direction`, `Returned Review`,
  `Findings`, and `Disposition` subsections;
- exact equality between the lead decision and implementation direction sections
  and their uniquely marked counterparts inside the hashed returned-review body;
- `revision=` for every accepted-with-revision finding, `evidence=` for every
  rejected-with-evidence finding, plus `basis=` limited to verified repository
  fact, executable evidence, security/WoW, or locked user decision; a product
  judgment conflict remains deferred to the user rather than rejected; and
  non-empty `owner=` plus `trigger=` for every deferred finding; and
- exact equality between canonical finding IDs and disposition IDs.

Plan 11P's shared runner and validator are the only checkpoint-record authority.
The runner must build the input from subject-bound evidence, execute exact
`claude -p --model fable` without a shell, and capture the receipt before the
dependent plan invokes the validator for its exact section. An earlier review,
self-reported invocation, generic `dispositioned` text, copied/rehashed body, or
manually inserted heading cannot satisfy a later gate.

## Checkpoint Enforcement Map

These are project leadership checkpoints, even when execution is hosted by a
specific GSD plan. Each invocation receives the prior whole-project review and
current program delta, requests Fable's technical/design decision, and may
revise broader roadmap artifacts through its disposition.

| Standing checkpoint | GSD enforcement |
|---|---|
| After first real hosted CI, before 11D | Plan 11R Task 11R-02 collects and commits the first tracked envelope; Task 11R-03 records the lead decision; Plan 11D Task 11D-00 recertifies and commits the fully finalized Plan 11R envelope before Task 11D-01's first source edit |
| After coverage foundation | Plan 11X Task 11X-01 after committed Plan 11W evidence and before coverage closure begins |
| After 11K, 11E, and 11T | Plan 11S Task 11S-01 before 11F/11U/11G/11V/11H/11Z/11I continue |
| Before 11J/11AA/11AB | Plan 11Y Task 11Y-01 before validator source edits |
| After original Plan 11 | Plan 11Q Task 11Q-02 after fresh exact-head hosted CI and before product closure |
| Phase 44 entry | Plan 12B Task 12B-01 after readiness evidence and before Plan 12C verification |
| Pre-publish | Phase 44 planning owner; activation trigger is creation of the release plan, which must include a blocking evidence-bearing checkpoint task |
| First post-release bump | Phase 44 MAINTENANCE owner; activation trigger is release-plan authoring, which must install the fire-drill evidence and cadence gate before publish |

## Decisions

**KEEP:** exact-pin Open GSD authority; overlay/override composition; centralized
compose authority; N=3 no-skip compatibility; fail-closed correction; 95% per
metric; evidence-backed GSD continuity.

**CHANGE:** add Step 0; separate 11D source ownership, 11W feasibility, and 11X review;
use managed-distribution terminology; add support-cadence and cross-platform
reproducibility evidence to Phase 44; replace expired perf exceptions with
measured policy.

**STOP:** calendar-waiver renewal; treating the changelog checker as a full-file
gate while normal content fails; accumulating unpushed corrective work; treating
Fable prose or memory claims as repository facts without verification.

**INVESTIGATE:** truthful merged coverage; possible runner consolidation;
boundary collision risk; config-key install/upgrade impact; coverage-closure
velocity; first-bump maintenance cost.

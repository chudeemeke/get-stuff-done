---
phase: 43-upgrade-resilience-verify-matrix-dogfood
kind: lead-review-synthesis
date: 2026-07-18
subject_commit: f2d50b29ce567145f264d4a7d047184b999a69fc
hosted_commit: 2c9ba08745cf3bc13cec42b0c05feb2ae5f02233
status: dispositioned
---

# Phase 43 Interim Review Synthesis

## Provenance

Three independent read-only reviews consumed the same amended packet:

- Claude Fable 5 at `xhigh`, session `c45d42e8-61c4-4894-8284-5e980b4245d7`;
- Claude Opus 4.8 at `xhigh`, session `7be9bc14-fcaf-4d23-aff3-b661dcc55d1c`;
- GPT-5.6-Sol at `xhigh`, session
  `019f775e-cca0-7c82-9cd3-15f7d6504c3e`.

Their verbatim artifacts are stored beside this synthesis. All three returned
`proceed-with-corrections`. A later Fable delta adjudication attempted to consume
new primary findings but exhausted the Claude session after 17 minutes and
returned no judgment. No delta approval is claimed.

## Lead Verdict

Proceed with a corrective GSD branch before Plan 11D. The Phase 43 fail-closed
architecture is retained, but its hosted authority and public-automation
contracts need correction before another external cycle can be trusted.

Plan 11R remains `blocked`; it is not summarized as complete merely because it
captured a useful failure. Corrective plans branch from completed Plan 11N and
consume 11R's immutable failed-run observation. The final successor gate may
close 11R only after it has produced the missing passed envelope and formal
Fable disposition.

## Primary-Evidence Corrections

The lead independently verified the material findings that changed the initial
Fable/Opus graph:

1. CI job `87201829510` fetched and executed synthetic merge commit
   `e2139a78cdba1d5bf5130431d2bd8e8e6f7bdd52`, not PR head
   `2c9ba08745cf3bc13cec42b0c05feb2ae5f02233`. The collector currently validates
   `workflow_run.head_sha`, job names, conclusions, and nonzero steps, but not
   each job's executed commit.
2. Issues `#5` through `#11` each contain 38 `github-actions[bot]` comments
   beginning `Observed again in `: 266 comments total. The latest run added seven
   of those comments; the design has accumulated non-idempotent public mutations
   across many prior runs.
3. PR CI has two issue-writing surfaces: medium/low OSV upsert and Windows flake
   upsert. Both must leave diagnostic PR CI.
4. `compat-matrix.yml` explicitly converts matrix failure to `exit 0`. The
   2026-07-14 run was genuinely 315/315, but future active-pinned drift can be
   hidden behind a successful workflow conclusion.
5. The Windows executable path is a product-boundary coupling defect: ambient
   host `path.join` constructs a Windows target path. Use `path.win32.join`.
   Receipt alias failures remain test-oracle defects; DACL setup remains a test
   harness dependency defect.

## Adjudicated Architecture

### Executed subject

Preserve the existing exact-PR-head contract. Every governed source-executing
job must explicitly checkout the event's PR head and run a governed subject
step that fails unless `git rev-parse HEAD` equals that expected head. The
collector contract must require the named step with successful conclusion for
every expected job. This is smaller and less ambiguous than certifying an
ephemeral merge commit while preserving the contract's current meaning.

Merge-result compatibility remains valuable but is not silently substituted for
exact-head authority. If it becomes a required release claim, it receives a
separate explicit contract later.

### Toolchain authority

Pin Bun exactly and consume one repository-owned version manifest locally and in
all governed workflows. Pin action implementations by full commit SHA in the five
governed workflows and pin the Verdaccio image by immutable digest. Record actual
Node patch and performance-tool versions in evidence; retain deliberate Node
20/22 major compatibility dimensions rather than pretending one patch is the
product support boundary. Paired performance measurements use the same tool
instance, so exact Hyperfine pinning is desirable maintenance hardening but not a
precondition to interpret their ratio.

### Performance authority

Replace blocking cross-run baseline ratios with paired reference/candidate
measurement on the same runner. Preserve raw samples, execution order, commits,
workload and lock digests, runner identity, architecture, and resolved toolchain.
Keep the already-approved 1.10 warning and 1.25 failure budgets; do not renew
calendar exceptions or accept a new regression. If paired evidence exceeds the
budget, the gate fails and the user decides whether to optimize or explicitly
change the SLO. Historical absolute baselines remain non-blocking trend data.

### Public automation

PR diagnostics become read-only at workflow level. OSV and flake detection emit
normalized proposal artifacts. Any issue mutation moves to an explicit manual
or approved scheduled surface with dry-run output, one stable idempotency key,
and update-in-place behavior for a bot-owned record. The 266 historical comments
remain untouched unless the user separately authorizes cleanup.

### Documentation and compatibility

Internal links, anchors, project-owned endpoints, and installation references
remain blocking. Decorative third-party availability is monitored separately
and read-only; one HTTP 500 does not determine project correctness. The active
pinned Open GSD compatibility row becomes blocking while historical vetted rows
remain informational and artifact-backed.

## Corrective Graph

| Plan | Wave | Depends on | Ownership | Exit evidence |
|---|---:|---|---|---|
| `43-11AC` | 18 | `43-11N` | executed-subject, hosted contract, toolchain authority primitives | negative/positive contract tests and four-metric coverage |
| `43-11AD` | 19 | `43-11AC` | CycloneDX 6 and SBOM compatibility | audit, OSV, SBOM schema and dist green |
| `43-11AE` | 19 | `43-11AC` | Windows path semantics, canonical receipt oracle, DACL harness | focused platform tests green without weakening containment |
| `43-11AF` | 19 | `43-11AC` | authenticated Verdaccio verifier and redaction | local container integration and leakage negatives green |
| `43-11AG` | 19 | `43-11AC` | paired performance measurement and policy | deterministic fixtures, raw-sample schema, budget tests green |
| `43-11AH` | 20 | `43-11AD`-`43-11AG` | five workflows, public-mutation separation, docs policy, active compat blocking | workflow/contract/security tests green |
| `43-11AI` | 21 | `43-11AH` | full local corrective integration receipt | frozen full suites and each four-metric threshold green |
| `43-11AJ` | 22 | `43-11AI` | human gate, one hosted cycle, passed envelope, formal Fable checkpoint, truthful 11R closure | committed exact-subject envelope and valid Fable receipt |
| `43-11D` | 23 | `43-11AJ` | existing coverage-foundation entry | existing second recertification remains intact |

Plans `43-11AD` through `43-11AG` are parallel because their write sets are
disjoint. `43-11AH` owns workflow YAML so no parallel plan edits a shared
workflow. Blocked 11R and corrective 11AC share Wave 18 as sibling branches from
completed 11N; the successor chain shifts later work by four waves and ends at
Wave 45. Downstream source ownership and review gates otherwise remain
unchanged.

## Consultation Boundary

The project lead may author and execute `43-11AC` through `43-11AI` locally,
including disposable local Verdaccio credentials that are never printed or
persisted. The user must approve any push, PR-head update, Actions run, Fable
quota-consuming formal checkpoint, issue mutation or cleanup, branch-protection
change, merge, release, publication, credential/session change, performance SLO
change, or accepted regression.

Consequential discoveries are reported after local action when they do not
require prior approval: major-upgrade incompatibility, product behavior changes,
new public-automation surfaces, security-relevant output, or evidence that the
existing performance budget is exceeded.

## Rejected Directions

- Do not expand 11R into a mixed corrective implementation plan.
- Do not mark 11R complete before its inherited success obligations are met.
- Do not pull Plan 11D or coverage plans forward to create circular authority.
- Do not suppress the HIGH advisory or reduce audit severity.
- Do not weaken canonical path containment.
- Do not permit anonymous Verdaccio publication.
- Do not renew calendar performance waivers or rebaseline from the failed run.
- Do not keep `issues: write` in diagnostic PR CI.
- Do not rerun hosted workflows before exact-subject and local corrective gates
  are green.

## Confidence

High confidence covers the current PR/run state, all failure families, synthetic
merge execution, 266-comment history, two PR mutation surfaces, fail-open compat
workflow, and missing passed envelope. CycloneDX 6 CLI compatibility,
non-interactive Verdaccio identity bootstrap, cross-platform runner behavior, and
paired performance outcome remain implementation or hosted evidence to obtain.

This synthesis is planning authority, not the formal Fable checkpoint. Only a
passed exact-subject hosted envelope consumed through Plan 11P's validator can
support that later claim.

---
phase: 43-upgrade-resilience-verify-matrix-dogfood
kind: fable-lead-delta-adjudication
date: 2026-07-18
subject_commit: f2d50b29ce567145f264d4a7d047184b999a69fc
hosted_commit: 2c9ba08745cf3bc13cec42b0c05feb2ae5f02233
status: ready
---

# Phase 43 Fable Delta Adjudication Packet

## Mandate

Act as the standing lead architect and adjudicate verified evidence discovered
after your independent corrective review. Do not edit files or perform any
state-changing action. This is a planning delta, not the formal passed-envelope
checkpoint.

Use the primary facts below and, where needed, inspect only primary repository
files and hosted logs. Do not defer merely because another reviewer found a
fact. State whether each delta changes your prior graph, plan ownership, or
implementation direction.

## Previously Agreed Core

All three independent reviewers returned `proceed-with-corrections`. They agree:

- no passed hosted envelope exists;
- Plan 11D must not begin;
- the HIGH CycloneDX advisory requires a tested major upgrade, not suppression;
- CI must become read-only before another hosted run;
- path canonicalization must not be weakened;
- Verdaccio needs ephemeral authenticated publication with redaction;
- Bun and hosted inputs require deterministic authority;
- calendar performance waivers are rejected;
- corrective work needs bounded GSD ownership and local gates;
- any push, hosted cycle, issue mutation, merge, release, or branch-protection
  change remains prior-approval work.

## Delta 1: Executed Subject Does Not Match Claimed Subject

Primary hosted log evidence from CI job `87201829510`:

```text
fetch ... +e2139a78cdba1d5bf5130431d2bd8e8e6f7bdd52:refs/remotes/pull/23/merge
git checkout --progress --force refs/remotes/pull/23/merge
HEAD is now at e2139a7 Merge 2c9ba08745cf3bc13cec42b0c05feb2ae5f02233 into e913f6a64dd8a69b7562019dd859169d088fb61a
```

The collector records and validates Actions `workflow_run.head_sha` as
`checkedCommit`, which is the PR head `2c9ba087...`. It verifies job topology and
nonzero steps but has no per-job executed-commit attestation. A future envelope
could therefore claim exact PR-head execution while jobs actually tested a
synthetic merge commit.

Adjudicate the minimum sound contract:

- force every governed workflow to checkout the PR head and include a governed
  step that fails unless `git rev-parse HEAD` equals the expected PR head; or
- retain synthetic-merge execution and extend the envelope to attest executed
  merge SHA, base SHA, parent relation to PR head, and per-job consistency; or
- define another design that proves the bytes actually executed.

The project's existing contract repeatedly says exact PR/local checked commit.
Do not preserve that wording if the actual authority should be merge-result
execution instead.

## Delta 2: Public Mutation Is Recurring Non-Idempotent Debt

Read-only GitHub API checks on 2026-07-18 show issues `#5` through `#11` each
contain exactly 38 comments, all authored by `github-actions[bot]` with body
prefix `Observed again in `. Total: 266 comments. The 2026-07-14 cycle added the
latest seven; it did not create the historical accumulation.

Primary workflow inspection also confirms two PR-triggered mutation surfaces:

- `osv-scanner` has `issues: write` and appends medium/low advisory comments;
- matrix `test` has `issues: write` and appends Windows flake comments.

The workflow lacks a top-level read-only default. Existing scheduled issue
maintenance also mutates issues.

Adjudicate whether the corrective plan must own a proposal-artifact boundary
plus a separate idempotent manual/scheduled mutation workflow, and whether the
266 historical comments should remain untouched pending an explicit user
cleanup decision.

## Delta 3: Compat Matrix Can Report Success Despite Blocking Drift

`.github/workflows/compat-matrix.yml` runs the matrix under `set +e`, records a
nonzero status, prints that blocking drift remains informational, and ends with
`exit 0`. The 2026-07-14 run was genuinely green at 315/315 for each vetted
version, but a future failed active-pinned row can still leave the workflow
green and satisfy the hosted contract.

Adjudicate whether current active pinned authority must fail closed while older
vetted rows remain informational, and where that correction belongs.

## Delta 4: Path Classification Disagreement

The product constructs the Windows PowerShell executable with ambient host
`path.join` after dependency injection selects `platform: 'win32'`. On POSIX,
the result is mixed-separator `C:\Windows/System32/...`. The test expects a
Windows target path.

Adjudication proposal: this is a small product-boundary coupling defect; use
`path.win32.join` for a Windows executable. This is distinct from the receipt
tests, where product `realpathSync.native` canonicalization is intentional and
the expected values must be canonicalized. The DACL fixture remains a harness
dependency issue requiring explicit module import or the .NET API.

Accept or reject that classification and explain the architectural reason.

## Delta 5: Reproducibility Scope

Beyond `bun-version: latest`, governed workflows use mutable action major tags,
Verdaccio image `:6`, Node major selectors, and floating platform installers for
performance tooling. Workflow digests do not freeze those external identities.

Adjudicate the minimum market-ready pinning surface now versus deferred
maintenance debt. Consider action full-SHA pins, exact Bun, exact Node patch,
container version plus digest, performance-tool versions, and machine-readable
drift/update policy. Avoid creating a maintenance system larger than the product.

## Delta 6: Performance Authority

Three approaches emerged:

1. Fable initial direction: implement variance-aware policy locally, then
   capture fresh upstream-1.6.1 baseline data in the authorized hosted window.
2. Opus direction: leave rebaseline versus variance-aware as a user/Fable
   decision because current hosted variance evidence is insufficient.
3. Sol direction: replace cross-run absolute comparison with paired same-run
   reference/candidate measurements, preferably randomized/interleaved with
   enough samples and complete environment provenance; only then decide whether
   to accept a new baseline or budget.

Derive the minimum statistically and operationally credible design. Separate a
technical measurement-method decision the lead can make from acceptance of a
performance regression/SLO, which requires user authority.

## Delta 7: Truthful Plan 11R State

Your initial review proposed a truthful `43-11R-SUMMARY.md` that closes 11R with
deviation and reassigns its passed-envelope obligation. Sol objects that the
plan's declared must-haves require success, so it should remain explicitly
blocked/in-progress and be superseded by a failure-intake/corrective branch,
without a completion summary.

Adjudicate the state transition that Open GSD can represent without lying. The
result must preserve the attempt history, keep the missing passed envelope
machine-visible, and avoid leaving downstream dependency resolution ambiguous.

## Required Output

Return exactly:

1. `DELTA VERDICT`
2. `ADJUDICATIONS D1-D7`
3. `FINAL CORRECTIVE GRAPH`
4. `AUTONOMY AND CONSULTATION BOUNDARY`
5. `IMMEDIATE LOCAL ACTIONS`
6. `REMAINING USER DECISIONS`
7. `CONFIDENCE AND REQUIRED EVIDENCE`

For each plan boundary, state dependencies, write ownership, and exit evidence.
Identify what changed from your prior review. Do not claim the formal Fable
checkpoint passed.

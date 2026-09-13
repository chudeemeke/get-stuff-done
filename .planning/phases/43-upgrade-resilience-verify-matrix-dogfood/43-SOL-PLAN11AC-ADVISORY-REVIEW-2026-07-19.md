---
project: get-stuff-done
reviewer: GPT-5.6-Sol
reviewed: 2026-07-19
scope: uncommitted Phase 43 Plan 11AC implementation and proposed authority deltas
session_id: 019f7878-9e58-70f1-bc08-ad2ac99bc2df
role: advisory-under-fable-lead-authority
status: returned
verdict: proceed-with-corrections
---

# Plan 11AC Sol Advisory Review

## Provenance

The review ran read-only through `codex exec --model gpt-5.6-sol` with
`model_reasoning_effort="xhigh"`. It completed after 1,325 seconds in persisted
session `019f7878-9e58-70f1-bc08-ad2ac99bc2df`. The reviewed worktree remained
unchanged during execution.

The reviewer was explicitly briefed as an advisory defect finder under Fable's
lead authority. Its implementation findings require disposition, but its
architecture recommendations do not supersede Fable.

## Verdict

**Proceed with corrections.** No P0 finding. Do not close Plan 11AC until the
P1 defects are corrected and Fable adjudicates the proposed scope changes.

## P1 Findings

### SOL-AC-01 - Run-attempt and executed-workflow binding are incomplete

Job inspection uses the latest-attempt endpoint even though the selected run has
an explicit attempt. A rerun beginning between selection and job retrieval can
cross-bind evidence. Execution-subject records omit the attempt, and governed
source digests do not prove which workflow revision GitHub executed.

Minimum correction: use the attempt-specific jobs endpoint; carry attempt in
every job/subject record; bind job-emitted `GITHUB_WORKFLOW_SHA` and
`GITHUB_WORKFLOW_REF` plus canonical workflow bytes into the receipt/envelope.

### SOL-AC-02 - Subject proof is momentary and ambient execution is spoofable

The verifier proves `HEAD` immediately after checkout but does not prove later
governed execution retained that subject. Workflow/job environment checks block
`PATH` and `GIT_*` but permit shell initialization variables such as `BASH_ENV`.
Collector `git`/`gh` executable provenance is also ambient.

Minimum factual correction: close shell-initialization/injection environment
paths. Fable must define whether the authority claim is pre-execution identity
or immutable whole-job execution before a wrapper/post-payload design is chosen.

### SOL-AC-03 - Checkout closure conflicts with existing security topology

The current contract requires checkout at absolute step zero, verification at
step one, and only `with.ref`. This rejects the exact-pinned harden-runner
prelude and the secret-scan job's required `fetch-depth: 0`. Current test
fixtures hide that conflict by rewriting the original topology.

Minimum correction: preserve checkout/verification adjacency while supporting a
closed exact-pinned hardening prelude and explicitly governed per-job checkout
inputs. Fable must confirm the intended security/subject ordering contract.

### SOL-AC-04 - Runtime setup authority is order-open and source-open

`setup-node` and `setup-bun` may appear after repository commands. Their `with`
maps are not closed, so alternate download sources such as setup-node
`mirror`/`mirror-token` and setup-bun `bun-download-url` can bypass the declared
toolchain authority.

Minimum correction: require authoritative setup before runtime-consuming steps
and close every allowed setup input.

### SOL-AC-05 - Hosted verification does not consume full toolchain authority

The hosted verifier reads the manifest primarily for the checkout pin. It does
not require the same workflow bytes to pass the complete toolchain evaluator or
prove exact workflow-set equality between hosted and toolchain contracts. Hosted
topology can therefore pass while mutable action tags or `latest` remain.

Minimum correction: run the full toolchain evaluator over the same parsed
workflow bytes and require closed set equality across authority manifests.

### SOL-AC-06 - Local `full` evidence is self-authored and incomplete

Caller-supplied JSON asserts its own subject and versions. Only Cousin and
performance jobs are runtime subjects; there is no closed rule requiring every
runtime-consuming governed job to be classified or explicitly exempted.

Minimum correction: rename the mode to `local-runtime`, classify every governed
runtime job or a closed exemption, and reserve hosted authority for exact
run-attempt-bound receipts. Fable must place receipt ownership in 11AC, 11AH, or
11AJ.

### SOL-AC-07 - Cross-platform claims do not bind actual runners

Matrix expansion proves display names but not `runs-on`, resolved runner OS,
architecture, or image. A job named Windows can execute on Linux without the
current topology detecting it.

Minimum correction: govern exact `runs-on` expressions and bind resolved runner
identity in hosted receipts. Fable must decide receipt coverage/exemptions.

## P2 Findings

### SOL-AC-08 - Scalar closure is incomplete

Timestamps, purpose strings, matrix values, numeric identifiers, and the
`.bun-version` read require deterministic formats, type/range bounds, and fatal
encoding/size limits.

### SOL-AC-09 - Resume subject is stale

The WIP checkpoint names `d8233183` as the committed base, while current `HEAD`
is `9402163951e76bc7c75af8d500da1749af93bdd4` after the source-backed Phase
40.5 routing repair.

## Proposed Delta Assessment

The exact-pinned Jest `30.4.2` and c8 `11.0.0` seam is technically reasonable
only as a narrow verifier-coverage seam. It must not silently become the 11D
canonical runner migration. Exact dependency/lockfile pins and independent 95%
statements, branches, functions, and lines thresholds remain mandatory.

Deterministic hosted receipts plus the local-mode rename are directionally
necessary. Receipt JSON is not authoritative merely because it asserts a job
ID; authority requires exact run/attempt retrieval, workflow SHA/ref, runner
identity, governed emission topology, and canonical receipt bytes/digests bound
into the envelope.

## Reserved For Fable

Fable must adjudicate:

1. whether to move the narrow Jest/c8 seam forward and amend 11AC/11D/11W file
   and responsibility ownership;
2. whether execution-subject authority means pre-execution verification or
   immutable whole-job execution;
3. which jobs require hosted runtime receipts and what closed exemptions are
   legitimate; and
4. whether receipt design belongs to 11AC, 11AH, or 11AJ.

The 2026-07-18 interim Fable review remains corrective direction, not the formal
post-passed-envelope checkpoint. Sol cannot satisfy that checkpoint.

## Reviewer Verification Limits

The reviewer confirmed `git diff --check`, both script syntax checks, matrix
cardinality/bounds, and the declared action tag/SHA resolutions. Its read-only
sandbox returned `EPERM` for the targeted Bun tests, so the existing local
103/103 result remains the executable test authority; Sol did not independently
rerun it.

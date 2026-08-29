---
phase: 43
plan: 11AG
status: evidence-only
captured: 2026-07-19
subject: hyperfine-v1.20.0-paired-authority
---

# Plan 11AG Paired Performance Spike

## Scope

This is a tool-semantics and evidence-contract spike for pending Plan 11AG. It
does not satisfy the plan dependency on 11AC, change either performance budget,
or provide a benchmark verdict.

No timing run was performed: Hyperfine is not installed locally and the current
candidate is an uncommitted worktree. Measuring it would not provide immutable
reference/candidate authority.

## Tool Authority

- Hyperfine's latest stable release is `v1.20.0`, published 2025-11-18.
- Hyperfine 1.20 supports warmups, exact run counts, per-run preparation, and
  JSON export with raw `times` and `exit_codes`.
- Hyperfine 1.20 executes multiple benchmark commands in grouped runs. Native
  interleaved benchmark execution remains proposed Hyperfine 2.0 work rather
  than a current primitive.
- The existing Phase 43 toolchain contract correctly requires a resolved
  Hyperfine SemVer in each performance receipt. Exact repository pinning is not
  required for ratio validity when both sides of each pair use the same binary,
  but the resolved version must be identical within the artifact.

Primary references:

- <https://github.com/sharkdp/hyperfine>
- <https://github.com/sharkdp/hyperfine/issues/788>

## Minimum Measurement Algorithm

1. Resolve immutable reference and candidate commits into separate worktrees.
2. Derive and record a deterministic seed from the two commits plus the
   workload and lock digests.
3. Warm both subjects under the same runner/toolchain policy before measured
   pairs. Warmup output never enters the measured sample arrays.
4. Execute at least ten measured pairs. Derive the first side from the seed and
   alternate `AB`, `BA`, `AB`, `BA` thereafter.
5. Use Hyperfine as the timing/export engine for one subject measurement at a
   time. The outer scheduler owns interleaving because Hyperfine 1.20 does not.
6. Run the same preparation/reset contract before every timed sample. A reset
   failure invalidates the complete artifact rather than dropping one sample.
7. Retain every raw duration, exit code, pair index, order, command identity,
   and preparation result. Reject non-zero/null exit codes and non-finite or
   non-positive durations before comparison.
8. Compute the blocking ratio as candidate arithmetic mean divided by reference
   arithmetic mean. This preserves the approved 1.10 warning and 1.25 failure
   semantics while controlling runner/toolchain drift.
9. Report per-pair ratios, median ratio, order-stratified means, dispersion, and
   absolute-noise diagnostics. These are inspectable diagnostics and cannot
   silently override the blocking mean ratio.
10. Keep `perf-baseline.json` and its expired accepted-regression entries as
    historical trend data only. Calendar exceptions do not participate in the
    paired blocking verdict.

## Required Artifact Identity

The paired artifact must bind:

- reference and candidate commits;
- runner OS, architecture, image, and CPU identity;
- exact Node, Bun, and Hyperfine versions;
- workload, package, lock, upstream-authority, and benchmark-policy digests;
- deterministic seed, pair count, warmup policy, and complete order sequence;
- raw samples and exit codes for install and compose;
- unchanged warning/failure ratios and the resulting verdict.

## RED Boundaries

Before implementation, tests must reject grouped/non-alternating execution,
different toolchain identities, mismatched workload or lock digests, fewer than
ten complete pairs, missing raw samples, duplicate/missing pair indices,
non-zero exit codes, non-finite durations, unrecorded preparation, seed/order
disagreement, stale-baseline authority, and any accepted-regression override of
the paired result.

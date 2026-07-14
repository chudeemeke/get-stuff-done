---
phase: 43
plan: "11P"
wave: 16
status: complete
date: 2026-07-14
requirements: []
---

# Phase 43 Plan 11P Summary - Fable Checkpoint Authority

## Outcome

Implemented one reusable, fail-closed authority for evidence-bearing Fable
checkpoints. A versioned manifest binds the checkpoint to an exact subject
commit and raw evidence bytes; a deterministic nonce-bound packet invokes exact
argv `claude -p --model fable` without a shell; and an immutable execution
receipt binds the returned review, lead decision, implementation direction,
record location, and evidence metadata.

The record is always published as `pending-disposition`. A separate read-only
verifier reconstructs the manifest, evidence, packet, and review digests before
requiring every finding to have one metadata-complete disposition.

## Architecture

- `fable-checkpoint-input.schema.json` defines tracked and external evidence.
- `fable-checkpoint-receipt.schema.json` fixes exact argv, nonce, subject,
  timestamps, paths, evidence metadata, and all review digests.
- `run-fable-checkpoint.js` owns canonicalization, evidence resolution, packet
  construction, subprocess capture, pending-record rendering, and filesystem
  adapters behind injected ports.
- `verify-fable-checkpoint.js` owns pure record evaluation plus read-only replay
  verification; it performs no network calls and no writes.
- Receipt publication uses create-only temp-file plus hard-link semantics, so a
  concurrent or prior receipt cannot be replaced.
- Manifest, evidence, record, HEAD, and receipt absence are checked again after
  the subprocess returns. A mid-run change publishes neither output.

## Schemas And Evidence Rules

Tracked evidence is read as raw bytes from `<subjectCommit>:<path>`. External
evidence must be repository-contained, declare a non-empty authority, bind
`checkedCommit` to the manifest subject, and match its current raw-byte digest.
Evidence IDs are unique and all paths are normalized repository-relative POSIX
paths with traversal, drive, backslash, empty-segment, and symlink/junction
escape rejection.

Any `.planning/evidence/hosted/**` artifact is admissible only as tracked
evidence from the subject tree. Ambient or external hosted bytes fail closed.

## Packet And Hash Contract

Canonical JSON recursively sorts object keys, preserves array order, encodes
UTF-8, and ends with one LF. The receipt records SHA-256 for the raw manifest,
canonical input, deterministic packet, every raw evidence item, the normalized
returned review, the exact lead decision, and the exact implementation
direction.

The packet separates authority instructions from JSON-encoded untrusted
evidence and uses a fresh 128-bit hexadecimal nonce. Response, lead-decision,
and implementation-direction markers must each occur exactly once and in the
required order. Review hashing removes only structural marker lines, normalizes
CRLF and CR to LF, and removes only the newline immediately before the response
end marker.

## Record Template

Each run appends one unique section with this shape:

```text
### <checkpoint> - pending-disposition
<!-- fable-checkpoint-metadata:start -->
<canonical receipt-linked JSON metadata>
<!-- fable-checkpoint-metadata:end -->
<!-- fable-lead-decision:start -->
<exact captured lead decision>
<!-- fable-lead-decision:end -->
<!-- fable-implementation-direction:start -->
<exact captured implementation direction>
<!-- fable-implementation-direction:end -->
<!-- fable-returned-review:start -->
<exact normalized returned review>
<!-- fable-returned-review:end -->
#### Disposition
- Pending.
#### Classification Counts
- findings=<n> accepted=0 accepted-with-revision=0 rejected=0 deferred=0
```

Zero findings require exact `- None.` sentinels after disposition. Mixed reviews
require unique `F-NNN` findings and dispositions. Rejections require an allowed
basis plus evidence; revisions require `revision=`; deferrals require `owner=`
and `trigger=`. Fable direction is default-adopted, with rejection limited to a
verified repository fact, locked user decision, security/WoW constraint, or
contradictory executable evidence.

## Replay And Failure Negatives

Fixtures reject stale subjects or digests, old nonces, missing/duplicate/empty/
misordered markers, self-reported argv, marker-like evidence, invalid UTF-8,
path escapes, external hosted evidence, rewritten lead or review bytes,
disconnected IDs, count mismatches, incomplete dispositions, duplicate record
sections, output aliases, unsafe write paths, process failure, and concurrent
manifest/evidence/record/receipt changes. CLI diagnostics redact authentication
material and never print the returned review body on failure.

## Caller Commands

```powershell
node scripts/run-fable-checkpoint.js --manifest <manifest> --receipt <receipt> --record <record> --checkpoint "<checkpoint>"
node scripts/verify-fable-checkpoint.js --manifest <manifest> --receipt <receipt> --record <record> --checkpoint "<checkpoint>"
```

Both `--help` paths are side-effect free. Run requires the exact Fable command;
verify is deterministic and offline.

## TDD And Validation

- RED commit: `22cd3af5` (`test(phase-43): specify Fable checkpoint contract`).
- GREEN commit: `d60358df` (`feat(phase-43): capture Fable checkpoint authority`).
- Focused suite: 28/28 passed, 80 expectations.
- CLI help: both run and verify passed without file, Git, or Claude access.
- ESLint: passed with zero errors and 213 warnings across the repository. The
  new adapters contribute analyzer warnings for validated dynamic-path/object
  lookups; no warning is represented as a security clearance.
- `git diff --check`: passed.

Focused Bun coverage reports `run-fable-checkpoint.js` at 88.37% lines and
69.12% functions, and `verify-fable-checkpoint.js` at 92.06% lines and 93.75%
functions. Bun does not provide the required statement and branch authority.
Plan 11W owns the blocking coverage-foundation gate and must reach at least 95%
for statements, branches, functions, and lines before this source can ship.

## Fable Boundary

No live Fable process was invoked during Plan 11P because the shared Claude
authentication window remains explicitly blocked while other sessions are
live. The implementation follows the standing whole-project Fable review and
the converged Plan 11P contract. Subprocess behavior was exercised through the
injected execution port only; no live-review evidence is claimed.

## Cleanup And Boundaries

Tests removed their exact temporary directories. No shared temp directory,
build output, dependency tree, live process, authentication state, or source
file in `authkey`, `remotely`, or `conversations` was changed.

## Next

Re-index Phase 43, run the GSD structure/consistency gates, and continue at the
next dependency-ready plan. Preserve the safe-auth and hosted-billing blockers;
Plan 11W remains responsible for four-metric coverage closure.

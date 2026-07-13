# Override: gsd-core/bin/lib/roadmap.cjs

## Why
Fork GSD project recovery exposed a routing bug where `roadmap analyze` selected the first older partial phase instead of the current phase recorded in STATE.md. It also counted only disk PLAN files, which can make roadmap progress appear complete while ROADMAP-declared future plans remain.

Cross-project use also proved that roadmap progress updates must preserve the
document's original EOL convention and unrelated bytes. Open GSD's global
writer intentionally canonicalizes markdown, so the fork needs a narrower
roadmap-only persistence boundary rather than changing global document policy.

## Upstream snapshot
- Version: 1.6.1
- SHA-256: c09affdb8c9d745efc5a52b853aa59d1716e24b6bacb7753407aed5d6f54225d

## What's different
- Reads current phase from STATE.md formats used by this fork and prefers it when it maps to an active roadmap phase.
- Counts effective plan totals as the max of disk PLAN files and ROADMAP `**Plans**` declarations.
- Adds disk/declared plan counts to analysis output for diagnostics.
- Anchors phase checkbox matching to the checklist prefix to avoid mutating a different phase that mentions the target phase later in the line.
- Delegates only `roadmap update-plan-progress` publication to the fork-private
  `fork-roadmap-persistence.cjs` adapter.
- Preserves the original dominant LF/CRLF convention and unrelated whitespace,
  detects exact no-ops before EOL projection, and reports whether publication
  changed the roadmap.
- Publishes through a collision-resistant sibling copy created exclusively
  from the target. POSIX publication uses an atomic rename and retains copied
  mode bits; Windows publication calls `ReplaceFileW` so the destination DACL,
  including protected inheritance state, survives atomic replacement. File
  paths cross the fixed PowerShell bridge only through child-process
  environment variables.
- Reserves an exclusive same-volume Windows recovery directory and hardlinks
  its backup path to the original before child startup. The child protects the
  recovery directory from other principals, and reconciliation validates the
  backup's regular-file type, file identity, and exact original bytes before
  and after restoration. Documented partial failures 1175, 1176, and 1177 are
  distinguished; substitution or failed restoration preserves every surviving
  copy and surfaces an aggregate error.
- Retries transient Windows `EPERM`/`EBUSY`/`EACCES` replacement failures three
  times with bounded backoff, then cleans the temp file and surfaces both the
  publication and cleanup failures when cleanup also fails.

## Review trigger
When upstream `gsd-core/bin/lib/roadmap.cjs` or its document-write policy
changes, check whether Open GSD has native STATE-aware current-phase selection,
declared-plan progress accounting, and byte-preserving atomic roadmap
publication. Remove this override and the fork-private adapter once upstream
behavior covers all three responsibilities.

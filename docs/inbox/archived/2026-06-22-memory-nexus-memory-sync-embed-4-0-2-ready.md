---
resolved_at: 2026-07-03
triaged_at: 2026-07-03
schema_version: "1.3"
source_project: memory-nexus
created: 2026-06-22
type: docs
severity: medium
fix_status: merged
affects_scope: all-consumers
workaround_applied: "Install @chude/memory@4.0.2 from npm; do not rely on stale global 4.0.0 or local hotfix installs."
priority_rationale: "memory is first-party shared infrastructure; projects blocked on memory sync --embed need to know the Ollama 413 resume wedge is fixed in the published package."
issue_id: memory-nexus:2026-06-22:memory-sync-embed-4-0-2-ready
thread_id: memory-nexus:2026-06-22:memory-sync-embed-4-0-2-ready
related_issue: C:/Projects/memory-nexus/docs/inbox/2026-06-22-kanbanflow-embed-413-oversized-batch-stalls-reembed.md
next_owner: get-stuff-done
status: merged
---

# Adopt memory 4.0.2 for `memory sync --embed`

## What changed

`@chude/memory@4.0.2` is now the registry-published fix for the shared `memory sync --embed` blocker discovered from Kanbanflow.

Older affected behavior: an Ollama embedding batch could exceed the sidecar/proxy request limit, return HTTP 413, abort the embedding pass, and then resume would select the same oversized batch again. That made semantic embedding refresh wedge at a fixed offset.

New behavior in 4.0.2:

- Ollama 413 on multi-item batches is split and retried while preserving order.
- Embedding requests are bounded by `embedding.maxBatchBytes`.
- A single still-oversized message is skipped with safe metadata instead of wedging the whole corpus.
- Skips are model-scoped, so future model changes can retry.
- Provider egress still requires explicit consent and host allowlisting.

## Action

Update or verify the installed shared CLI:

```bash
bun add -g @chude/memory@4.0.2
memory --version
```

Expected version: `4.0.2`.

Then normal use is:

```bash
memory sync --embed
```

If the project uses the tailnet Ollama sidecar, verify readiness with:

```bash
memory status --embedding --json
```

## Operational guarantee and boundaries

If `memory --version` resolves to `4.0.2`, `memory sync --embed` will run past the known deterministic Kanbanflow/Ollama 413 resume wedge. That is the specific guarantee from this release.

This does not prove that every future embedding run must complete regardless of unrelated issues such as endpoint outage, missing provider-egress consent, database locks, disk pressure, or a newly discovered provider error. Treat any new failure after 4.0.2 as a fresh memory-nexus issue with the current error text.

Projects on the same machine do not need a per-project install unless their shell path, package script, or local dependency pins an older `memory` binary. The quick test is `memory --version` from the project CWD.

## Verification from memory-nexus

Published package checks passed for `@chude/memory@4.0.2`: registry latest, npm global install, Bun global install, published package smoke test, gitleaks scan, and unpacked npm artifact scan for local paths, private host strings, TODO/FIXME/HACK/debugger markers, and common token patterns.

## Receiver Verification -- 2026-07-03

Verified from the get-stuff-done CWD that the installed shared memory CLI resolves to version 4.0.2. The project has no repo-local dependency or script pinning an older memory binary.

Verification command:

```text
memory --version
# 4.0.2
```

Note: `memory status --json` timed out locally and is not used as evidence for this closure; this item's specific guarantee is the published 4.0.2 fix for the known embedding 413 resume wedge.

## Event Log
<!-- inbox-events:v1 -->
- 2026-07-03T17:19:30.000Z | get-stuff-done | merged | Verified installed memory CLI is 4.0.2 and no repo-local older pin exists.
- 2026-06-22T22:20:00.000Z | memory-nexus | filed | Broadcast that @chude/memory@4.0.2 is the published fix for the shared memory sync --embed Ollama 413 resume wedge.

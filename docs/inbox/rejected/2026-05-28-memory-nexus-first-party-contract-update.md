---
resolved_at: 2026-07-03
triaged_at: 2026-07-03
schema_version: "1.2"
source_project: memory-nexus
created: 2026-05-28
type: docs
severity: low
fix_status: none
affects_scope: all-consumers
status: rejected
next_owner: get-stuff-done
priority_rationale: memory-nexus is now explicitly treated as first-party portfolio infrastructure; GSD workflows frequently interact with project state and session persistence.
---

# memory-nexus first-party contract update

memory-nexus / `@chude/memory` is now explicitly treated as first-class first-party infrastructure used across the portfolio.

Recent compatibility-sensitive memory-nexus changes:
- Provider secrets should come from environment injection or secret references, not plaintext `embedding.apiKey`.
- `apiKeyEnv` and opaque `apiKeyRef` are supported; `apiKeyRef` is not resolved by memory-nexus.
- authkey interop is optional and should use `authkey run --env memory -- ...`, not raw secret retrieval.
- Export and status surfaces are redacted by default; sensitive export requires explicit `--include-sensitive`.
- Provider support is registry-backed and includes `openai-compatible`; unsupported providers fail explicitly.
- Phase 37 publish remains blocked until coverage proves all four required metrics.

Action required now:
- None unless GSD commands or tests parse memory CLI output or rely on memory export/status containing raw provider values.

Suggested verification:

```bash
memory status --json
memory context get-stuff-done
```

Future GSD memory integrations should treat memory-nexus contract changes as cross-project compatibility events.

## Receiver Decision -- 2026-07-03

Rejected as no local get-stuff-done change required after receiver verification.

Search evidence found get-stuff-done does not currently parse `memory status`, `memory context`, memory exports, provider secrets, `apiKeyEnv`, or `apiKeyRef`. Current memory references are project-local `.planning/memory/` agent memory docs and backlog notes, not memory-nexus CLI integration. Future memory-nexus integrations should follow this contract when introduced.

## Event Log
<!-- inbox-events:v1 -->
- 2026-07-03T17:19:30.000Z | get-stuff-done | rejected | Receiver verification found no current get-stuff-done change required; rationale recorded in Receiver Decision section.
- 2026-06-26T22:36:19.153Z | conversations | correction | Added next_owner for coordination-audit ownership routing; receiver project still owns lifecycle/content triage.

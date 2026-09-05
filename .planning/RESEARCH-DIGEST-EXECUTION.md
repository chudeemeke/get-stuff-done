# Ratified D4 research digest implementation

Continuation of the September5 skin contract, not a new strategic plan.
The subagent planner stays. The planner reads phase research once and selects
the sections each plan needs; each executor reads that plan's cited digest.

## Minimal implementation

1. Add overlay/gsd-core/bin/research-digest.cjs. Reuse the pinned engine's
   markdown-sectionizer; do not create another Markdown parser. Select exact
   headings, include their child sections, and reject ambiguity/overlap.
2. Emit deterministic Markdown with source path, exact source-byte SHA-256,
   selected line ranges and excerpts. Enforce a caller-visible line budget;
   never truncate silently. Optional expected hash refuses stale research.
3. Prove the composed helper through tests/research-digest.test.js, including
   fenced pseudo-headings, duplicate headings, CRLF, stale hashes, oversized
   selections, filesystem-link escape, unchanged source and CLI exit/output.
4. Document per-plan read_first use in an additive reference. Final lean
   planner/workflow integration and D11 comparison remain explicit gates.

The helper reads only a research Markdown file inside the calling project.
It writes results to stdout; callers publish the selected digest with their
normal file-writing tool. No dependencies or state-transition changes.
No global installation or activation is authorized by passing these tests.

Risk classification: Tier S for source confinement and provenance validation.
Coverage target: at least95% statements/functions/lines and100% branches for
the composed helper, including unloaded files. Seven decision mutants must
fail behavioral assertions. The existing required CI Test job runs this
scoped coverage and mutation gate on all three operating systems. This does
not claim that pre-existing package-wide coverage debt is resolved. Review the
new public command before merge. This branch can be developed during the
fixed walk but must not replace or skip any of its separate merged steps.

---
agent: gsd-executor
updated: 2026-03-25
entries: 3
---

- finding: "conversations project STATE.md uses non-standard format for 'Plan: X of Y' line -- gsd-tools state advance-plan could not parse it. Manually updated the position line instead."
  source: "Phase 6, Plan 1, Task post-execution"
  confidence: HIGH
  phase: "06-historical-data"
  date: "2026-03-25"

- finding: "conversations repo is not itself tracked in portfolio.json (active/protected/parked). post-commit-snapshot.js correctly exits silently when run from the conversations directory. Testing must be done from a portfolio project directory (e.g., medesine-rx)."
  source: "Phase 6, Plan 1, Task 2 verification"
  confidence: HIGH
  phase: "06-historical-data"
  date: "2026-03-25"

- finding: "global git core.hooksPath on Windows Git Bash uses forward-slash C:/Projects/... paths consistently with the rest of the hook infrastructure in this project."
  source: "Phase 6, Plan 1, Task 2"
  confidence: HIGH
  phase: "06-historical-data"
  date: "2026-03-25"

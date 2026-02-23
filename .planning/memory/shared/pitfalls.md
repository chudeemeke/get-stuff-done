# Known Pitfalls (Shared Memory)

---
type: shared
topic: pitfalls
updated: 2026-02-23
entries: 2
---

## Known Pitfalls

This file contains known gotchas and their fixes, discovered by GSD agents during execution. Any agent can write to this file when encountering issues that other agents should be aware of.

**Entry format:**
```yaml
- pitfall: "Description of what goes wrong"
  fix: "How to resolve or work around it"
  discovered_by: "{agent-name}"
  source: "Phase X, Plan Y, Task Z"
  confidence: HIGH|MEDIUM|LOW
  phase: "XX-phase-name"
  date: "YYYY-MM-DD"
```

---

- pitfall: "bun 1.3.5 coverage: `delete require.cache[path] + require(path)` does NOT accumulate coverage into the original source file. The re-loaded module runs as a separate V8 Script and its coverage is never merged back."
  fix: "Export the internal helper functions from the source module. Tests call those helpers directly without re-requiring. Use mockPlatform() + mockEnv() to control test conditions. Coverage accumulates correctly across multiple direct calls."
  discovered_by: "gsd-phase-researcher"
  source: "Phase 16, Platform Quality Research"
  confidence: HIGH
  phase: "16-platform-quality"
  date: "2026-02-20"

- pitfall: "execGit() in core.cjs builds a shell command string and single-quotes args containing %, |, ^, *, or spaces. On Windows MINGW64, single-quoted arguments are treated as literals causing: git log '--format=%H' to fail with 'ambiguous argument', git tag -a with multi-word -m message to fail with 'too many arguments', and git tag -l 'glob*' to not match any tags."
  fix: "Use spawnSync with array args form (no shell) for any git command with special characters. Create a spawnGit(cwd, args) helper using child_process.spawnSync. Use this for: git log --format=, git tag -a -m, git tag -l 'pattern*', git diff sha^..sha, git rev-parse sha^."
  discovered_by: "gsd-executor"
  source: "Phase 20, Plan 01, Task 2"
  confidence: HIGH
  phase: "20-sync-safety-transparency"
  date: "2026-02-23"

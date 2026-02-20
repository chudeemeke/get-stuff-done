# Known Pitfalls (Shared Memory)

---
type: shared
topic: pitfalls
updated: 2026-02-20
entries: 1
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

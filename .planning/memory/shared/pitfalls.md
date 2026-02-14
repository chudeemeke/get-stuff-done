# Known Pitfalls (Shared Memory)

---
type: shared
topic: pitfalls
updated: 2026-02-14
entries: 0
---

## Known Pitfalls

This file contains known gotchas and their fixes, discovered by GSD agents during execution. Any agent can write to this file when encountering issues that other agents should be aware of.

**Examples of pitfalls worth recording:**
- Authentication gate patterns
- Platform-specific quirks (Windows vs Linux)
- Tool limitations and workarounds
- Common failure modes and fixes
- Edge cases in workflows
- Permission issues

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

Agents will populate this file during Phase 10+ execution as pitfalls are encountered and resolved.

# Project Patterns (Shared Memory)

---
type: shared
topic: project-patterns
updated: 2026-02-14
entries: 0
---

## Discovered Patterns

This file contains project-specific conventions discovered by GSD agents during execution. Any agent can write to this file when discovering patterns that would benefit other agents.

**Examples of patterns worth recording:**
- Build commands with required flags
- Test suite patterns and frameworks
- Configuration file structures
- Path conventions and symlink usage
- Git workflow patterns
- Tool-specific invocations

**Entry format:**
```yaml
- pattern: "Description of the pattern"
  discovered_by: "{agent-name}"
  source: "Phase X, Plan Y, Task Z"
  confidence: HIGH|MEDIUM|LOW
  phase: "XX-phase-name"
  date: "YYYY-MM-DD"
```

Agents will populate this file during Phase 10+ execution as patterns are discovered.

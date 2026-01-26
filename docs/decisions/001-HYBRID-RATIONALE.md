# Decision Record 001: Hybrid Approach Rationale

**Date:** 2026-01-23
**Status:** Accepted
**Context:** Choosing methodology for Get Stuff Done project

---

## Decision

Create a hybrid methodology combining GSD (GlitterCowboy) and Manus.im approaches rather than adopting either one wholesale.

---

## User's Vision

> "I like taking the best of multiple things and mashing them together as long as I understand them. I don't mind the maintenance required because architecting is part of what I like."

> "I intend to actually work on that project really well and then dogfood it - use it to build out everything else."

---

## Context

The user evaluated two leading approaches:

### GSD (Get Stuff Done by GlitterCowboy)
- Spec-driven development for Claude Code
- Four-phase cycle: Discuss → Plan → Execute → Verify
- Fresh context per task to prevent degradation
- No enterprise ceremony (sprints, story points, Jira)
- Tailored for solo developers

### Manus.im
- Context engineering for autonomous agents
- Six principles: Cache optimization, masking over removal, file system as memory, attention manipulation, error preservation, avoiding pattern collapse
- Heavy infrastructure (sandbox, browser automation)
- High autonomy, minimal user interaction

### Problem with Either Alone

| GSD Alone | Manus Alone |
|-----------|-------------|
| Lacks cache optimization | Lacks user preference capture |
| No attention manipulation | Black box decision making |
| Less sophisticated context engineering | Overkill infrastructure |
| Good for coding, less for general tasks | Less coding-workflow focus |

---

## Rationale

### Why Hybrid?

1. **Best of Both Worlds**
   - GSD's user-centric planning + Manus's context engineering
   - GSD's atomic commits + Manus's error preservation
   - GSD's verification + Manus's observation loop

2. **Alignment with User's Style**
   - User enjoys architecting and combining approaches
   - User values understanding over black-box solutions
   - User willing to maintain custom system

3. **Dogfooding Strategy**
   - Build the tool using the tool
   - Proves methodology while developing it
   - Identifies friction points through experience

4. **Future Flexibility**
   - Can lean GSD-heavy or Manus-heavy per task
   - Not locked into either framework
   - Can evolve as both sources evolve

---

## Trade-offs Accepted

| Trade-off | Accepted Because |
|-----------|------------------|
| More complex than either alone | User values understanding complexity |
| Maintenance burden | User explicitly accepts this |
| Not battle-tested | Dogfooding provides testing |
| May diverge from upstream | Custom needs justify divergence |

---

## Key Synthesis Decisions

### From GSD (Keep)
- Discuss phase (user preferences first)
- Atomic task decomposition
- Fresh context per task
- Explicit verification phase
- Clean git history

### From Manus (Adopt)
- KV-cache optimization strategy
- File system as extended memory
- Error preservation in context
- Attention manipulation via todo.md
- State machine for tool availability

### Novel Combinations
- Cached stable prefix + fresh task suffix
- Error traces in commit messages
- UAT + continuous observation
- Configurable autonomy level

---

## Success Criteria

The hybrid approach is successful if:

1. **Quality Maintained**
   - No context rot observed
   - Commits are atomic and reversible
   - Errors are learned from

2. **Efficiency Achieved**
   - Cache hit rate >70%
   - Minimal user interruption during execute
   - Fast iteration cycles

3. **User Satisfaction**
   - Preferences respected
   - Decisions documented
   - Audit trail available

4. **Dogfooding Works**
   - Can build the tool using the tool
   - Each iteration improves quality
   - Friction points identified and resolved

---

## Open Questions (Deferred)

1. How deeply to integrate with WoW System?
2. Multi-agent coordination protocols?
3. Cross-session context handoff?
4. Pattern learning from errors?

---

## References

- `GSD-METHODOLOGY.md` - GSD documentation
- `MANUS-METHODOLOGY.md` - Manus documentation
- `COMPARISON-MATRIX.md` - Side-by-side analysis
- `HYBRID-APPROACH.md` - Full hybrid specification

# GSD vs Manus.im: Comparison Matrix

Side-by-side comparison of the two approaches to inform hybrid design.

---

## Philosophy Comparison

| Dimension | GSD (GlitterCowboy) | Manus.im |
|-----------|---------------------|----------|
| **Target User** | Solo developer using Claude Code | General users, any task |
| **Core Problem** | Context rot / quality degradation | Task completion in complex domains |
| **Solution** | Spec-driven development + fresh contexts | Context engineering + tool orchestration |
| **Complexity Location** | "In the system, not your workflow" | "In the context engineering, not model training" |
| **Autonomy Level** | High (but user-approved plans) | Very high (minimal user interaction) |
| **Iteration Speed** | Fast (atomic tasks, immediate commits) | Fast (code-as-action, sandbox execution) |

---

## Planning Approach

| Aspect | GSD | Manus |
|--------|-----|-------|
| **Planning Depth** | Deep (Discuss → Plan → Execute → Verify) | Moderate (Plan event injected to context) |
| **User Involvement** | High in Discuss phase, low in Execute | Low throughout (autonomous) |
| **Task Granularity** | 2-3 atomic tasks per phase | Variable (decomposed by Planner module) |
| **Documentation** | Heavy (CONTEXT.md, PLAN.md, etc.) | Light (todo.md, scratch files) |
| **Decision Capture** | Explicit in STATE.md | Implicit in context |

---

## Context Management

| Aspect | GSD | Manus |
|--------|-----|-------|
| **Context Strategy** | Fresh context per task (200k clean) | KV-cache optimization (append-only) |
| **Memory Persistence** | File-based (STATE.md, ROADMAP.md) | File system as extended memory |
| **Context Utilization Target** | 30-40% main session | Maximize cache hits |
| **Degradation Prevention** | Isolate tasks to subagents | Stable prefix, attention manipulation |
| **State Tracking** | Explicit documents | todo.md + event stream |

---

## Execution Model

| Aspect | GSD | Manus |
|--------|-----|-------|
| **Execution Unit** | Atomic task (one commit) | Single tool action per loop |
| **Parallelism** | Waves of parallel tasks where possible | Sequential (one action, observe, repeat) |
| **Error Handling** | Fix plans generated, retry with fresh context | Preserve error, diagnose, retry/alternate |
| **Verification** | Explicit UAT phase with user | Implicit via observation loop |
| **Commit Strategy** | Atomic commits per task | N/A (general agent, not code-focused) |

---

## Tool Philosophy

| Aspect | GSD | Manus |
|--------|-----|-------|
| **Tool Access** | Claude Code native tools | Sandboxed Linux + browser automation |
| **Action Format** | Natural language + Claude Code | CodeAct (Python as action format) |
| **Tool Availability** | Fixed (Claude Code tools) | State machine managed |
| **Tool Composition** | Through multi-step plans | Through code composition |

---

## Strengths & Weaknesses

### GSD Strengths
- User-centric (captures preferences before planning)
- Clean context per task (prevents degradation)
- Explicit decision documentation (audit trail)
- Tailored for coding workflows (commits, verification)
- Lightweight infrastructure (just Claude Code)

### GSD Weaknesses
- More ceremony than pure autonomous agents
- Requires user engagement in Discuss phase
- Less sophisticated context optimization
- No cache optimization strategies

### Manus Strengths
- Advanced context engineering (cache, attention)
- True autonomous execution
- Sophisticated error recovery
- File system as unlimited memory
- CodeAct flexibility

### Manus Weaknesses
- Heavy infrastructure requirements
- Less user control/visibility
- Black box decision making
- Requires powerful models for CodeAct
- Enterprise-scale (may be overkill for solo dev)

---

## Compatibility Analysis

### Where They Align

| Shared Principle | GSD Implementation | Manus Implementation |
|-----------------|-------------------|---------------------|
| **Persistence** | STATE.md, ROADMAP.md | File system as memory |
| **Task Decomposition** | Atomic task plans | Planner module |
| **Error Learning** | Fix plans from failures | Error preservation in context |
| **Progress Tracking** | Verification phase | todo.md recitation |
| **Structured Output** | PLAN.md templates | Tagged system prompt sections |

### Where They Diverge

| Divergence Point | GSD Approach | Manus Approach | Reconciliation |
|-----------------|--------------|----------------|----------------|
| **User Involvement** | High in planning | Minimal | Configurable per task type |
| **Context Strategy** | Fresh per task | Append-only, cached | Use both depending on task length |
| **Execution Granularity** | Atomic commits | Single tool actions | Commits wrap multiple actions |
| **Verification** | Explicit UAT | Implicit observation | Keep explicit UAT, add observation |

---

## Synthesis Opportunities

### From GSD, Take:
1. **Discuss Phase** - User preferences before autonomous execution
2. **Atomic Commits** - Clean git history, reversible changes
3. **Explicit Verification** - User acceptance testing
4. **Decision Documentation** - STATE.md for audit trail
5. **Fresh Context Strategy** - For long/complex tasks

### From Manus, Take:
1. **KV-Cache Optimization** - For repetitive/batch tasks
2. **File System as Memory** - Unlimited context extension
3. **Error Preservation** - Keep failures visible for learning
4. **Attention Manipulation** - todo.md recitation technique
5. **State Machine Tool Management** - When tool availability varies

### Novel Combinations:
1. **Cached Discuss, Fresh Execute** - Stable user preferences, clean task contexts
2. **Atomic Commits with Error Traces** - Preserve errors in commit messages
3. **UAT + Observation Loop** - Formal verification with continuous monitoring
4. **CodeAct for Complex, Natural for Simple** - Action format by complexity

---

## Decision Framework

**Use GSD-heavy approach when:**
- Building software with git
- User preferences matter
- Clean history required
- Audit trail needed
- Solo developer workflow

**Use Manus-heavy approach when:**
- Research/information gathering
- Batch processing
- High autonomy desired
- Complex tool orchestration needed
- Cost optimization critical (cache)

**Use Hybrid when:**
- Multi-session projects
- Mixed task types
- Need both user control and autonomy
- Building tools for others to use

---

## Next Steps

See `HYBRID-APPROACH.md` for the synthesized methodology that takes the best of both worlds.

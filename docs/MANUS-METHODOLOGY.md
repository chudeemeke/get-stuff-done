# Manus.im Methodology

Comprehensive documentation of the Manus AI agent approach, architecture, and context engineering principles.

**Sources:**
- [Context Engineering for AI Agents: Lessons from Building Manus](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
- [Technical Investigation into Manus AI Agent](https://gist.github.com/renschni/4fbc70b31bad8dd57f3370239dccd58f)

---

## Core Philosophy

Manus chose **in-context learning over fine-tuning**, enabling:
- Rapid iteration (hours instead of weeks)
- Product independence from underlying model improvements
- Flexibility to adapt to any foundation model

> "The complexity is in the context engineering, not the model training."

---

## The Six Principles of Context Engineering

**VERIFICATION STATUS KEY:**
- ✅ VERIFIED: Documented with evidence and/or replicated in open-source implementations
- ⚠️ PARTIAL: Documented but no implementation code, unclear feasibility
- ❌ UNVERIFIED: No substantial evidence found

---

### Principle 1: KV-Cache Hit Rate Optimization ✅ VERIFIED

**The single most important metric for production agents.**

| Aspect | Detail |
|--------|--------|
| Strategy | Keep prompt prefix stable to prevent cache invalidation |
| Implementation | Append-only context with deterministic serialization |
| Cost Impact | 10x reduction (Claude: $0.30 vs $3.00 per MTok) |
| Anti-Pattern | Timestamp at beginning of system prompt (breaks cache) |

**Technical Requirements:**
- Deterministic JSON serialization (key ordering matters)
- Session IDs for consistent routing in distributed systems
- Append-only modifications to context

### Principle 2: Masking Over Removal (Action Space Management) ⚠️ PARTIAL

**Never dynamically remove tools mid-iteration** - this breaks KV-cache and confuses the model.

⚠️ **WARNING:** Requires logit masking API access (not available in Claude API). No open-source replications implement this feature.

**Solution: Context-Aware State Machine**
```
State: BROWSING
  Available: browser_click, browser_type, browser_navigate
  Masked: shell_exec, file_write

State: CODING
  Available: shell_exec, file_write, file_read
  Masked: browser_*
```

**Implementation Techniques:**
- Logit masking during decoding (constrain actions by state)
- Response prefill modes: Auto, Required, Specified
- Consistent action name prefixes (`browser_`, `shell_`, `file_`)

### Principle 3: File System as Extended Memory ✅ VERIFIED

**Treat persistent file storage as unlimited context.**

✅ **VERIFIED:** Standard industry practice, confirmed in multiple open-source replications.

| Memory Type | Location | Purpose |
|-------------|----------|---------|
| Immediate | Context window | Current task state |
| Working | `todo.md`, scratch files | Active task tracking |
| Persistent | File system | Long-term memory, artifacts |

**Compression Strategy:**
- Drop content but preserve restoration paths (URLs, file paths)
- Write intermediate results to files, not chat context
- Design for restoration capability, not just compression

**Speculation:** State Space Models (SSMs) could excel in agentic roles by mastering file-based memory rather than in-context state.

### Principle 4: Attention Manipulation Through Recitation ⚠️ PARTIAL

**Combat "lost-in-the-middle" effects in long inference chains.**

⚠️ **WARNING:** Limited implementation detail. No code examples or clear triggers for recitation. Unclear value proposition.

Problem: ~50 tool calls typical in complex tasks, objectives drift from attention.

Solution: Dynamic task files (`todo.md`) updated step-by-step:
```markdown
# Current Task: Build authentication system

## Completed
- [x] Create user model
- [x] Implement password hashing

## In Progress
- [ ] JWT token generation  <-- CURRENT FOCUS

## Pending
- [ ] Login endpoint
- [ ] Middleware
```

This naturally biases model focus toward task objectives without architectural modifications.

### Principle 5: Preserving Error Evidence ⚠️ PARTIAL

**Keep failed actions and error traces in context.**

⚠️ **WARNING:** Counter-intuitive approach with no A/B test data. May increase costs with unclear benefits.

| Approach | Outcome |
|----------|---------|
| Clean up errors | Model repeats same mistakes |
| Preserve errors | Model implicitly updates beliefs, reduces repetition |
| Silent retry | Model learns nothing |
| Visible failure | Model adapts strategy |

**Key Insight:** Error recovery is a key indicator of true agentic behavior - currently underrepresented in benchmarks.

### Principle 6: Avoiding Few-Shot Pattern Collapse ⚠️ PARTIAL

**Uniform examples lock agents into brittle behaviors.**

⚠️ **WARNING:** Apparent conflict with Principle 1 (stable prompts for KV-cache). No technical detail on "controlled variation". May be overstated or incompatible with cache optimization.

> "The more uniform your context, the more brittle your agent becomes."

**Mitigation Strategies:**
- Controlled variation in serialization templates
- Varied phrasing and ordering in examples
- Diverse few-shot demonstrations

**Critical in:**
- Batch processing (e.g., reviewing 100 resumes)
- Repetitive tasks where drift into hallucination is common

---

## System Architecture

### Core Loop

```
┌─────────────────────────────────────────────────────────────┐
│                     MANUS AGENT LOOP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. ANALYZE current state and user request                 │
│          ↓                                                  │
│   2. PLAN / SELECT action                                   │
│          ↓                                                  │
│   3. EXECUTE in sandbox (ONE action only)                   │
│          ↓                                                  │
│   4. OBSERVE results                                        │
│          ↓                                                  │
│   5. REPEAT until task complete                             │
│                                                             │
│   Rule: Always respond with action unless delivering final  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Critical Constraint:** One tool action per loop cycle. Must observe result before proceeding.

### CodeAct Approach

Rather than fixed tool calls, Manus generates **executable Python code** as its action format.

| Traditional Tool Use | CodeAct Approach |
|---------------------|------------------|
| Rigid JSON schema | Flexible Python code |
| One tool per call | Multiple tools, conditional logic |
| Limited composition | Rich composition |

**Result:** Significantly higher success rates on complex tool-using tasks.

### Tool Categories

| Category | Tools | Access Level |
|----------|-------|--------------|
| Web | Search, Playwright browser | Internet |
| Shell | Commands with sudo | Sandboxed Linux |
| Code | Python, Node.js execution | Full runtime |
| Files | Read, write, manage | Persistent storage |
| APIs | External integrations | Configured services |

### Memory Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY HIERARCHY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   LEVEL 1: Event Stream (Immediate)                         │
│   - Chronological logs of messages, actions, observations   │
│   - Current working memory                                  │
│                                                             │
│   LEVEL 2: Persistent Scratchpad (Working)                  │
│   - todo.md for live checklists                             │
│   - Intermediate results in files                           │
│   - Updated as steps complete                               │
│                                                             │
│   LEVEL 3: Knowledge Store (Long-term)                      │
│   - RAG integration                                         │
│   - Vector databases                                        │
│   - Authoritative API prioritization                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## System Prompt Structure

Manus organizes governance through **tagged sections**:

```xml
<system>
  <identity>
    You are Manus, an AI agent created by the Manus team.
    You excel at: Information gathering, Data processing,
    Writing multi-chapter articles...
  </identity>

  <tool_use_rules>
    - Enforcement of function-call format
    - One action per iteration
    - Mandatory result observation
  </tool_use_rules>

  <browser_rules>
    - Click-through verification for authoritative sources
    - Screenshot validation
  </browser_rules>

  <error_handling>
    - Retry logic with diagnosis
    - Alternative method selection
    - Error preservation in context
  </error_handling>

  <writing_rules>
    - Detailed outputs with source citations
    - Multi-step verification
  </writing_rules>

  <todo_rules>
    - Plan tracking procedures
    - Step status updates
    - Completion verification
  </todo_rules>
</system>
```

---

## Planning Module

Tasks decompose into ordered step lists with status tracking:

```markdown
# Plan: [Task Name]

## Status: IN_PROGRESS

## Steps
1. [x] Research existing solutions
2. [x] Design architecture
3. [ ] Implement core logic  <-- CURRENT
4. [ ] Write tests
5. [ ] Documentation

## Notes
- Decision: Using approach X because Y
- Blocker: None currently
```

The Planner generates sequences **injected into agent context as a Plan event**, providing:
- Lookahead for decision-making
- Structured task decomposition
- Progress tracking

---

## Error Handling Protocol

```
Error Detected
     │
     v
┌─────────────┐
│ Diagnose    │ ← Analyze error type and cause
└──────┬──────┘
       │
       v
┌─────────────┐
│ Can Retry?  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
  Yes      No
   │       │
   v       v
┌──────┐ ┌──────────────┐
│Retry │ │ Alternative  │
│      │ │ Method       │
└──────┘ └──────────────┘
```

**Key Rule:** Never silently retry. Always preserve error evidence in context.

---

## Implementation Metrics

| Metric | Value | Note |
|--------|-------|------|
| Token Ratio | 100:1 input:output | Prefill-heavy workloads |
| Typical Tool Calls | ~50 per complex task | Long inference chains |
| Cache Hit Target | >80% | Critical for cost control |
| Framework Rebuilds | 4 times | "Stochastic Graduate Descent" |

---

## Open Source Replication Stack

For building Manus-like systems:

| Component | Technology |
|-----------|------------|
| Code Agent | CodeActAgent (fine-tuned Mistral 7B) |
| Sandbox | Docker with Python, Node.js, browsers |
| Orchestration | LangChain |
| Vector DB | FAISS |
| Multi-Agent | CrewAI |

---

## Key Takeaways for Hybrid Approach

**What Manus Does Well:**
1. Context engineering over model training
2. KV-cache optimization for cost
3. File system as extended memory
4. State machine for tool availability
5. Error preservation for learning
6. Structured planning with todo tracking

**Potential Gaps:**
1. Heavy infrastructure (sandbox, browser automation)
2. Requires sophisticated cache management
3. CodeAct approach needs capable models
4. Less emphasis on user collaboration (more autonomous)

---

---

## Critical Design Tensions

### 🚨 Variation vs. Stability Paradox

**The Fundamental Conflict:**
- **Principle 1** (KV-Cache): Demands stable, predictable prompt structure
- **Principle 6** (Don't Get Few-Shotted): Demands variation to prevent repetition

**Manus's Claimed Resolution:**
- "Controlled variation" in serialization without breaking cache
- Different templates that maintain prefix stability

**Verification Status:** ❌ **UNVERIFIED**
- No public code shows how they balance these
- No technical detail on what "controlled" means
- Could be marketing spin to hide fundamental limitation

**Our Assessment:**
This tension is real and significant. Either:
1. Manus has proprietary techniques we cannot replicate, OR
2. The variation is minimal and "don't get few-shotted" is overstated, OR
3. They accept some cache invalidation for necessary variation

**Implication for Get Stuff Done:**
- Prioritize cache stability (Principle 1) over variation (Principle 6)
- Only introduce variation if empirical evidence shows repetition is a problem
- Measure cache hit rate impact of any variation introduced

---

## Feasibility Assessment for Get Stuff Done

### HIGH-VALUE PRINCIPLES (Adopt Immediately)

**✅ Principle 3: File System as Extended Memory**
- **Feasibility:** 100% - Industry standard
- **Implementation:** Create workspace directory per session, save intermediate results to files
- **Expected Benefit:** Significant token savings, persistence across sessions
- **Timeline:** 1-2 days

**✅ Principle 1: KV-Cache Optimization (Partial)**
- **Feasible aspects:**
  - ✅ Stable system prompt prefix
  - ✅ Append-only context (no retroactive edits)
  - ✅ Deterministic JSON serialization
  - ✅ Avoid timestamps in prompt prefix
- **Infeasible aspects:**
  - ❌ Explicit cache breakpoints (requires API support)
  - ❌ Measuring actual cache hit rate (no visibility)
- **Expected Benefit:** Cost reduction if using Claude with prompt caching
- **Timeline:** 2-3 days for prompt architecture

**✅ Principle 5: Keep the Wrong Stuff In (with caution)**
- **Feasibility:** 90% - Architecturally simple
- **Implementation:** Append-only event log, don't delete failed commands
- **Expected Benefit:** Model learns from mistakes, debugging easier
- **Risk:** Context window fills faster, costs increase
- **Timeline:** Built-in if using append-only architecture

---

### MEDIUM-VALUE PRINCIPLES (Consider with Workarounds)

**⚠️ Principle 2: Mask, Don't Remove**
- **Feasibility:** 30% - Requires low-level model access
- **Blocker:** Logits masking not available via Claude API
- **Workaround:** Constrain via system prompt ("only use these tools in this state")
- **Alternative Implementation:**
  1. Conditional tool definitions in prompt
  2. "Available tools: [list]" in system message
  3. Post-processing to validate tool selection
- **Timeline:** N/A unless switching to self-hosted model

---

### LOW-CONFIDENCE PRINCIPLES (Skip or Defer)

**❌ Principle 4: Attention Manipulation Through Recitation**
- **Feasibility:** 60% - Implementable but unclear value
- **Questions Unanswered:**
  - How often to recite?
  - What triggers recitation?
  - Does it actually improve performance?
- **Expected Benefit:** Unknown - no benchmarks provided
- **Risk:** Token waste if done too frequently
- **Recommendation:** **SKIP** until evidence emerges

**❌ Principle 6: Don't Get Few-Shotted**
- **Feasibility:** 40% - Conflicts with KV-cache optimization
- **Blocker:** Tension with Principle 1 (stable prompts)
- **Questions Unanswered:**
  - How much variation before cache breaks?
  - What kind of variation is "controlled"?
  - Is repetition actually a problem with modern models?
- **Expected Benefit:** Unknown - could be solving non-issue
- **Risk:** Breaks KV-cache benefits
- **Recommendation:** **SKIP** - appears contradictory

---

## Proprietary Infrastructure Requirements

**⚠️ CRITICAL LIMITATIONS:**

The Manus implementation relies on infrastructure **not available in standard Claude API:**

| Requirement | Manus Uses | Available in Claude API? | Workaround |
|-------------|------------|-------------------------|------------|
| Logit masking | Tool selection constraints | ❌ NO | Prompt-based constraints |
| Cache breakpoints | Explicit cache control | ❌ NO | Design stable prefixes |
| Cache hit metrics | Performance monitoring | ❌ NO | Proxy via cost analysis |
| Docker sandbox | Isolated execution | ❌ NO | Use local execution (risks apply) |
| Browser automation | Playwright integration | ⚠️ PARTIAL | Claude Computer Use (limited) |

**None of the open-source replications implement the advanced context engineering features** - they only replicate the basic agent loop.

---

## Meta Acquisition Context

**Manus Code Availability:** ❌ **NOT AVAILABLE**

- **Acquisition Date:** December 2025
- **Purchase Price:** >$2 billion
- **Founder:** Yichao 'Peak' Ji (born 1993) → Meta Vice President
- **Current Status:** Operates as subscription service under Meta
- **Open Source Likelihood:** Zero - remains proprietary trade secret
- **China Investigation:** Potential export control issues under review

**What This Means:**
- Core implementation likely remains Meta trade secret
- Blog posts are directional guidance, not full disclosure
- The "6 principles" are high-level concepts, not blueprints
- Community must reverse-engineer from behavior and documentation
- Most advanced features (logits masking, variation strategies) remain inaccessible

**Community Replications Status:**
- MetaGPT team built basic prototype in 3 hours
- Multiple implementations emerged quickly
- **NONE implement the "6 principles" advanced features**
- Shows: Basic agent loop is simple, context engineering is the secret sauce

---

## Implementation Roadmap for Get Stuff Done

### Phase 1: High-Value, Low-Risk (Week 1)
1. ✅ File system as context (workspace per session)
2. ✅ Append-only event log (never delete actions)
3. ✅ Stable prompt prefix (no timestamps, cacheable)
4. ✅ Deterministic serialization

**Expected Impact:** 60% of Manus benefits with 20% of complexity

### Phase 2: Medium-Value, Medium-Risk (Week 2-3)
5. ⚠️ Prompt-based tool constraints (workaround for logits masking)
6. ⚠️ Context truncation strategy (manage window limits)

**Expected Impact:** Additional 20% benefits, moderate complexity

### Phase 3: Experimental (Week 4+)
7. ❓ Recitation experiments (A/B test value)
8. ❓ Controlled variation (test if needed)

**Expected Impact:** Unknown - data-driven decision

---

## Version Info

- Documentation Date: January 2026
- Verification Date: January 25, 2026
- Based on: Manus blog posts, technical gists, open-source replications
- Verification Sources: 12 sources reviewed (official docs, community implementations, news coverage)
- Note: Manus acquired by Meta (December 2025, >$2B), remains proprietary

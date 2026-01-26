# GSD-Lite: Manual Application Guide

> **Verified against GSD 1.9.11 research - 2026-01-25**
>
> This is a simplified manual approximation of the Get Stuff Done (GSD) methodology. The full GSD framework uses 11 custom agents, file-based state management, and automated orchestration. This guide extracts core principles for manual application.

A lightweight manual approach to applying GSD principles without the full framework overhead.

---

## When to Use This

- One-off tasks that don't warrant full GSD setup
- Quick fixes where you still want structured thinking
- Learning the methodology before adopting full GSD
- Working without access to Claude Code or file system tools
- Lightweight projects with simple linear dependencies

## What This Is NOT

This manual guide is NOT:
- A replacement for the full GSD framework (which uses automated agents)
- A comprehensive implementation (lacks verification agents, research agents, parallel execution)
- File-based (no STATE.md, SUMMARY.md, or persistence across sessions)
- Automated (requires manual application of each step)

Think of this as "GSD principles applied manually" rather than "the GSD system."

---

## The Manual Process

### Step 1: Discuss (Capture Preferences)

Before ANY planning, ask yourself (or the user):

**Goal Clarity:**
- What exactly are we trying to achieve?
- What does "done" look like?
- Who is this for?

**Gray Areas:**
- What decisions haven't been made yet?
- What could go multiple ways?
- What are the user's preferences (not assumptions)?

**Constraints:**
- What must NOT change?
- What are the boundaries?
- What's out of scope?

**Write down the answers.** Don't skip this.

### Step 2: Plan (Atomic Task Breakdown)

Once preferences are clear:

1. **List all conditions that must be true** for the goal to be achieved
2. **Break each condition into atomic tasks** (one commit each)
3. **Order tasks** by dependency (what must happen first?)
4. **Verify** the plan covers ALL conditions

**Template:**
```
Goal: [Clear statement]

Conditions for success:
1. [Condition A]
2. [Condition B]
3. [Condition C]

Atomic tasks:
- [ ] Task 1 (achieves Condition A)
- [ ] Task 2 (achieves Condition B part 1)
- [ ] Task 3 (achieves Condition B part 2)
- [ ] Task 4 (achieves Condition C)
```

### Step 3: Execute (Fresh Context Per Task)

For each atomic task:

1. **Focus on ONE task** at a time
2. **Complete it fully** before moving to next
3. **Commit immediately** after completion
4. **Verify it works** before proceeding

If context is getting long, summarize and continue in fresh context.

### Step 4: Verify (User Acceptance)

After all tasks complete:

1. **List testable deliverables** (what can be checked?)
2. **Test each one** with the user
3. **Create fix plans** for any failures
4. **Loop until acceptance**

---

## Integration with Goal-Backward Methodology

**Source:** GSD's "goal-backward methodology" is a 5-step derivation process used by the gsd-planner agent.

This enhancement bridges Discuss and Plan phases using GSD's systematic approach:

### The 5-Step Process:

After capturing the goal (Discuss), work backward through these steps:

#### 1. State Goal (Observable Result, Not Work)
> "What will be observably true when complete?" (User perspective, not implementation)

#### 2. Derive Truths (3-7 User Behaviors)
> "What must users be able to observe/experience?" (Testable behaviors)

#### 3. Derive Artifacts (Required Files)
> "What files must exist to enable these truths?" (Components, configs, scripts)

#### 4. Derive Wiring (Critical Connections)
> "How do these artifacts connect?" (Component→API, API→DB, Form→Handler)

#### 5. Identify Key Links (Fragile Points)
> "Which connections are critical/fragile?" (Integration points, external dependencies)

Then proceed forward with planning atomic tasks to produce artifacts and wiring.

---

### **Improved Example:**

```
Goal: Professional installer that's never confusing

Step 1: Observable Result
→ User completes installation without confusion or uncertainty

Step 2: Truths (User Behaviors)
1. User can see installation progress at any moment
2. User knows what operation is currently running
3. User is offered optional features (not hidden)
4. User understands what failed and why
5. User has clear recovery path on failure

Step 3: Artifacts (Required Files)
- install.sh (main installer script)
- src/ui/progress-bar.sh (visual progress indicator)
- src/ui/prompts.sh (feature selection prompts)
- src/core/error-handler.sh (friendly error messages)
- README.md (installation documentation)

Step 4: Wiring (Connections)
- install.sh → progress-bar.sh (displays current phase)
- install.sh → prompts.sh (offers optional features)
- install.sh → error-handler.sh (translates errors to user-friendly messages)
- error-handler.sh → recovery options (retry/skip/abort)

Step 5: Key Links (Fragile Points)
- ⚠️ Progress bar must update before long-running operations
- ⚠️ Error handler must catch all failure modes
- ⚠️ Prompts must default to safe choices (don't require user input)

Forward planning - Atomic tasks:
- [ ] Create progress-bar.sh with phase tracking (Truth 1, Artifact 2)
- [ ] Add elapsed time display for operations >5s (Truth 2, Artifact 2)
- [ ] Create prompts.sh with default values (Truth 3, Artifact 3)
- [ ] Build error-handler.sh with actionable messages (Truth 4, Artifact 4)
- [ ] Add retry/skip logic to error-handler.sh (Truth 5, Wiring 4)
- [ ] Wire progress updates into install.sh phases (Wiring 1, Key Link 1)
- [ ] Test all error paths trigger handler (Key Link 2)
```

**Key Insight:** The 5-step process ensures you identify not just WHAT to build (artifacts) but HOW it connects (wiring) and WHERE it might break (key links). This prevents "all components exist but system doesn't work" failures.

---

## Tips

- **Don't skip Discuss.** Most failures come from wrong assumptions.
- **Atomic means atomic.** One task = one commit = one thing.
- **Write things down.** Memory is unreliable, context rots.
- **Verify with the user.** Your "done" may not match their "done".

---

## When to Graduate to Full GSD

Consider adopting the full GSD framework (v1.9.11+) when:

- Projects span multiple sessions
- Multiple people need to understand the plan
- You need audit trail for decisions
- Context rot is causing quality issues
- You want automated verification (plan-checker, verifier, integration-checker)
- Parallel execution would speed up delivery (wave-based task execution)
- You need systematic debugging support (gsd-debugger agent)

**What Full GSD Adds:**
- **11 Custom Agents:** Specialized agents for planning, execution, verification, research, debugging, etc.
- **File-Based State:** STATE.md, SUMMARY.md, VERIFICATION.md persist decisions and progress
- **Wave-Based Execution:** Parallel task execution with automatic dependency management
- **Goal-Backward Verification:** Automated checking before (plan-checker) and after (verifier) execution
- **Checkpoint System:** 90% human-verify, 9% decision, 1% human-action
- **Research Agents:** Systematic investigation of tech stacks and patterns before planning
- **Adaptive Model Selection:** Cost optimization through task-complexity-based model assignment

**Full framework requires:** Claude Code, file system access, git repository

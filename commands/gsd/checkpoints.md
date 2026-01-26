---
name: gsd:checkpoints
description: Review and approve pending checkpoints from autopilot execution
argument-hint: "[approve <id>] [reject <id>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Manage the checkpoint queue created during autopilot execution.

Checkpoints are created when plans with `autonomous: false` need human input (API keys, design decisions, verification). Review pending checkpoints and provide approvals so autopilot can continue.
</objective>

<context>
Arguments: $ARGUMENTS

**Subcommands:**
- (no args) — List all pending checkpoints
- `approve <id>` — Approve checkpoint with response
- `reject <id>` — Reject checkpoint (plan will be skipped)
- `clear` — Clear all approved checkpoints (after autopilot processes them)
</context>

<process>

## List Pending Checkpoints (default)

```bash
PENDING=$(ls .planning/checkpoints/pending/*.json 2>/dev/null)
APPROVED=$(ls .planning/checkpoints/approved/*.json 2>/dev/null)
```

**If no checkpoints:**
```
No pending checkpoints.

Checkpoints are created when autopilot encounters plans that need human input.
```

**If checkpoints exist:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CHECKPOINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Pending ({count})

| ID | Phase | Plan | Type | Awaiting |
|----|-------|------|------|----------|
| 1 | 03 | OAuth Integration | auth-gate | OAuth credentials |
| 2 | 05 | Payment Setup | auth-gate | Stripe API keys |

## Approved ({count})

| ID | Phase | Plan | Approved At |
|----|-------|------|-------------|
| - | 02 | Email Config | 2026-01-26 14:30 |

───────────────────────────────────────────────────────────────

**Commands:**
- `/gsd:checkpoints approve 1` — Approve checkpoint 1
- `/gsd:checkpoints reject 2` — Reject checkpoint 2
- `/gsd:checkpoints clear` — Clear processed approvals

───────────────────────────────────────────────────────────────
```

## Approve Checkpoint

Parse `approve <id>` from arguments.

Read the pending checkpoint file:
```bash
CHECKPOINT_FILE=$(ls .planning/checkpoints/pending/*.json | sed -n "${ID}p")
```

Display checkpoint details:
```
## Checkpoint: Phase 03, Plan 02 (OAuth Integration)

**Type:** auth-gate
**Created:** 2026-01-26 14:00

**Context:**
Plan paused after task 2. Tasks 3-4 require OAuth setup.

**Completed tasks:**
1. ✓ Create OAuth service skeleton (abc123)
2. ✓ Add Google OAuth config structure (def456)

**Awaiting:**
OAuth client credentials for Google

───────────────────────────────────────────────────────────────
```

Use AskUserQuestion:
- header: "Approve"
- question: "Provide the requested information or approve to continue"
- options:
  - "Approve with response" — I'll provide what's needed
  - "Approve (no response needed)" — Continue without additional info
  - "Cancel" — Don't approve yet

**If "Approve with response":**
Ask inline: "What response should be passed to the continuation agent?"

**Create approval file:**
```json
{
  "phase": "03",
  "plan": "02",
  "approved": true,
  "response": "[user's response]",
  "approved_at": "2026-01-26T15:00:00Z"
}
```

Write to `.planning/checkpoints/approved/phase-03-plan-02.json`

Remove from pending:
```bash
rm .planning/checkpoints/pending/phase-03-plan-02.json
```

```
✓ Checkpoint approved

Autopilot will pick up this approval on next run or when it revisits phase 03.
```

## Reject Checkpoint

Create rejection file:
```json
{
  "phase": "03",
  "plan": "02",
  "approved": false,
  "reason": "[user's reason]",
  "rejected_at": "2026-01-26T15:00:00Z"
}
```

```
✗ Checkpoint rejected

Plan 02 in phase 03 will be skipped during autopilot execution.
```

## Clear Approved

```bash
rm .planning/checkpoints/approved/*.json 2>/dev/null
```

```
✓ Cleared {count} processed approvals
```

</process>

<success_criteria>
- [ ] Pending checkpoints listed with details
- [ ] Approved checkpoints shown separately
- [ ] Approve creates approval file, removes from pending
- [ ] Reject creates rejection file, removes from pending
- [ ] Clear removes processed approvals
</success_criteria>

---
schema_version: "1.3"
source_project: get-stuff-done
created: 2026-07-14
type: docs
severity: high
fix_status: merged
affects_scope: all-consumers
priority_rationale: Shared Claude credential-state drift blocked the required standing Fable checkpoint while active Claude processes made global reauthentication unsafe.
issue_id: get-stuff-done:2026-07-14:claude-auth-refresh-window
thread_id: get-stuff-done:2026-07-14:claude-auth-refresh-window
next_owner: get-stuff-done
status: merged
triaged_at: 2026-07-14
resolved_at: 2026-07-18
---

# Open a safe Claude reauthentication window

## Symptom

After the documented Fable quota reset, the exact
`claude -p --model fable` review returned `401 Invalid authentication
credentials`. A one-line probe reproduced the same result.

## Verified state at diagnosis

- Claude Code version: `2.1.208`.
- `claude auth status`: logged in through first-party `claude.ai` with a Max
  subscription.
- `C:\Users\Destiny\.claude\daemon-auth-status.json`: `auth_required`.
- Anthropic's status page: Claude Code and API operational at diagnosis time.
- Four Claude processes were active, including long-lived shared project
  sessions.

This was local CLI/daemon authentication-state drift, not a Fable review result
and not a current Anthropic service incident.

## Resolution

No disruptive global reauthentication was performed. By 2026-07-18,
status-only authentication checks were valid and fresh non-interactive Fable
and Opus `xhigh` reviews completed successfully. This removed the credential
blocker while preserving the user's live Claude sessions.

The later Fable delta-adjudication attempt ended on a normal subscription
session limit, not an authentication error. Its ratification remains deferred;
the completed Fable review and independent Opus and GPT-5.6-Sol reviews are
preserved in the Phase 43 corrective evidence set.

## Resumption

No user reauthentication action is pending. Fable remains the standing design
authority, and a formal post-hosted checkpoint remains part of user-gated Plan
`43-11AJ`.

## Event Log
<!-- inbox-events:v1 -->
- 2026-07-18T23:26:16.400Z | get-stuff-done | merged | Archived after status-only checks and fresh Fable and Opus reviews succeeded without global reauthentication or live-session disruption.
- 2026-07-14T05:52:00.000Z | get-stuff-done | blocked | The post-reset Fable review and one-line probe both returned 401 while shared Claude sessions remained active.

---
resolved_at: 2026-07-03
triaged_at: 2026-07-03
schema_version: "1.3"
source_project: conversations
created: 2026-07-02
type: bug
severity: medium
fix_status: merged
affects_scope: unknown
priority_rationale: Conversations coordination audit fails while active get-stuff-done inbox items use non-v1.3 fields and non-UTC Event Log timestamps.
closure_notify_to: conversations
closure_notify_reason: Conversations coordination audit should return to schema-clean state once get-stuff-done repairs its own active inbox items.
issue_id: conversations:2026-07-02:active-inbox-schema-drift-blocks-coordination-audit
thread_id: get-stuff-done-active-inbox-schema-drift-2026-07-02
related_issue: C:/Projects/conversations/.planning/HANDOFF.json
next_owner: get-stuff-done
status: merged
---

# Repair active inbox schema drift blocking coordination audit

## Symptom

`C:/Projects/conversations` coordination audit currently fails on active
`get-stuff-done` inbox diagnostics. Closure routing is clean; the remaining
message-artifact and event-log failures are from active files under
`C:/Projects/get-stuff-done/docs/inbox/`.

Observed from `C:/Projects/conversations` on 2026-07-02:

```text
node scripts/user-actions.cjs --json --root C:\Projects
```

The scan reports 12 diagnostics in `get-stuff-done`:

- `fix_status: fixed` should become a valid v1.3 value, likely `merged` or `tested`, with richer detail moved into the body.
- `status: resolved` should become `merged` or another valid lifecycle value.
- `resolution_pr` and `resolution_commit` are unknown frontmatter fields; use `pr_url`, `resolved_at`, and body sections instead.
- `fix_status: partial` is not valid; use `none`, `drafted`, `tested`, or `merged`, then explain partial rollout in the body.
- Event Log timestamps with `+01:00` are invalid; Event Log rows require UTC timestamps ending in `Z`.

## Repro

From `C:/Projects/conversations`:

```text
node scripts/coordination-audit.cjs --root C:\Projects --authkey-proof --authkey-proof-timeout-ms 10000 --json
node scripts/user-actions.cjs --json --root C:\Projects
```

From the `get-stuff-done` receiver CWD, use the filtered handoff projection
without relying on the `conversations` package scripts:

```text
node C:/Projects/conversations/scripts/coordination-audit.cjs --root C:/Projects --authkey-proof --authkey-proof-timeout-ms 10000 --target-actions-json --target-project get-stuff-done
```

Expected: active inbox schema diagnostics are zero.

Actual: coordination audit fails with 12 schema/event diagnostics, all under
`C:/Projects/get-stuff-done/docs/inbox/`.

## Root cause

Several active inbox files in `get-stuff-done` use lifecycle/resolution fields
that are meaningful in prose but invalid under Cross-Project Inbox Protocol
schema v1.3:

- `docs/inbox/2026-04-27-authkey-roadmap-update-plan-progress-mangles-wrong-checkbox-and-mass-rewrites-file.md`
- `docs/inbox/2026-04-27-medesine-rx-percent-100-misleading-when-roadmap-has-undeclared-plans.md`
- `docs/inbox/2026-06-22-memory-nexus-gsd-codex-install-crash.md`
- `docs/inbox/2026-06-22-memory-nexus-gsd-health-v5-decimal-roadmap-drift.md`

This is target-owned because the affected artifacts live in
`get-stuff-done/docs/inbox/`. `conversations` should not normalize them from
outside the get-stuff-done CWD while get-stuff-done has a live session and dirty
worktree state.

## Proposed fix

From the get-stuff-done CWD after the live session checkpoints:

1. Normalize active inbox frontmatter to valid v1.3 fields only.
2. Preserve any richer resolution/partial-rollout details in Markdown body sections.
3. Convert Event Log timestamps to ISO UTC `Z` form.
4. Re-run the conversations active-project lint and coordination audit.
5. If this item is resolved, set this filing to `merged`, add `resolved_at`, move it to `archived/`, and run the closure counter-notification back to `conversations`.

Do not widen schema v1.3 just for these fields unless repeated valid use cases
remain after rule/linter guidance has been followed.

## Test plan

From `C:/Projects/conversations`:

```text
node scripts/inbox-lint.cjs --active-projects --root C:\Projects --quiet
node scripts/user-actions.cjs --json --root C:\Projects
node scripts/coordination-audit.cjs --root C:\Projects --authkey-proof --authkey-proof-timeout-ms 10000 --json
```

Acceptance for this item:

- Active schema diagnostics from get-stuff-done drop to zero.
- Event Log diagnostics from get-stuff-done drop to zero.
- Coordination audit no longer fails on `message_artifact` or `event_log` because of get-stuff-done.

Authkey delivery may still be blocked separately; do not treat that as a
get-stuff-done failure.

## Suggested commit message

```text
docs(inbox): normalize active coordination filings
```

## Risks / things to verify before merging

- Preserve the substantive resolution history currently stored in non-schema fields.
- Do not move still-active implementation items to `archived/` merely to make the audit green.
- Respect get-stuff-done skin/overlay discipline; these are `docs/inbox/` files, but the project still owns the final edit and commit.

## Related

- `C:/Projects/conversations/.planning/HANDOFF.json`
- `C:/Projects/conversations/scripts/inbox-lint.cjs`
- `C:/Projects/conversations/scripts/coordination-audit.cjs`
- Cross-Project Inbox Protocol: `C:/Users/Destiny/.claude/rules/cross-project-issues.md`

## Receiver Verification -- 2026-07-03

Verified the active get-stuff-done inbox schema/event-log diagnostics are clear from the conversations audit surfaces.

Commands run from the get-stuff-done worktree:

```text
node C:/Projects/conversations/scripts/inbox-lint.cjs --active-projects --root C:/Projects --quiet
node C:/Projects/conversations/scripts/coordination-audit.cjs --root C:/Projects --authkey-proof --authkey-proof-timeout-ms 10000 --target-actions-json --target-project get-stuff-done
node C:/Projects/conversations/scripts/user-actions.cjs --json --root C:/Projects
```

The first two commands exited 0 with no output. The user-actions projection returned no get-stuff-done actions.

## Event Log
<!-- inbox-events:v1 -->
- 2026-07-03T17:19:30.000Z | get-stuff-done | merged | Verified conversations active inbox lint and get-stuff-done coordination projection are clean.
- 2026-07-02T11:35:00.000Z | conversations | filed | Filed target-owned schema drift handoff after coordination audit isolated all active diagnostics to get-stuff-done inbox files.
- 2026-07-02T19:54:33.480Z | conversations | triaged | Reverified target-action projection from get-stuff-done receiver CWD using the direct conversations script path; output is filtered to get-stuff-done and reports execution.cwdUsable=false with reason git-reports-not-inside-work-tree.
- 2026-07-02T22:50:10.023Z | conversations | triaged | Structured targetActions[].handoff is now available from the filtered get-stuff-done row; use handoff.runFromCwd plus handoff.command/args/examples, then address execution.cwdUsable=false by choosing a listed worktree or repairing Git shape before inbox schema/Event Log edits.

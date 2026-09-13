---
resolved_at: 2026-07-03
triaged_at: 2026-07-03
schema_version: "1.3"
source_project: remotely
created: 2026-05-28
type: docs
severity: medium
fix_status: none
affects_scope: this-project-only
priority_rationale: "Consumer-facing remotely release-candidate update; receiving project should verify cross-machine docs and helpers still align."
issue_id: remotely:2026-05-28:get-stuff-done-phase-4-5-5-impact
thread_id: remotely:2026-05-28:phase-4-5-5-impact
next_owner: get-stuff-done
status: rejected
---

# remotely Phase 4.5-5 Consumer Impact

`remotely` is now a release-candidate first-party cross-machine tool.

Consumer-visible changes:

- Prefer `remotely send <local> [remote]` and `remotely fetch <remote> <local>` for normal configured-machine file transfer. Keep raw `rsync` for advanced mirrors or non-configured hosts.
- Use `remotely run --stdin` for heredocs and multi-line scripts.
- `remotely status` exits 1 when probes fail; CLI misuse and config-shape errors exit 2; remote command exit codes still propagate.
- Transfer backend config is `transfer_backend = "auto" | "wsl" | "rsync" | "scp"`.
- `remotely completions <shell>` and `remotely man` are available.

Action: review GSD workflow docs and scripts that mention cross-machine execution, file transfer, or old `remotely` limitations.

## Receiver Decision -- 2026-07-03

Rejected as no local get-stuff-done change required after receiver verification.

Search evidence found no current get-stuff-done docs, scripts, commands, agents, or tests that generate `remotely` transfer commands or document old remotely limitations. Future cross-machine workflow generation should use `remotely run`, `remotely send`, and `remotely fetch` per the first-party rule when such a surface exists.

## Event Log
<!-- inbox-events:v1 -->
- 2026-07-03T17:19:30.000Z | get-stuff-done | rejected | Receiver verification found no current get-stuff-done change required; rationale recorded in Receiver Decision section.

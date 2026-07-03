---
resolved_at: 2026-07-03
triaged_at: 2026-07-03
schema_version: "1.3"
source_project: remotely
created: 2026-05-30
type: docs
severity: medium
fix_status: none
affects_scope: this-project-only
priority_rationale: "Consumer-facing remotely market-ready baseline update; receiving project should verify cross-machine docs and helpers still align."
issue_id: remotely:2026-05-30:get-stuff-done-phase6-impact
thread_id: remotely:2026-05-30:phase6-impact
next_owner: get-stuff-done
status: rejected
---

# Inbox: remotely Phase 6 impact

Source: `C:\Projects\remotely`, commit `5b1f654bb2b98598ec799551d9b5066b0ad58267`.

`remotely` is now the market-ready first-party cross-machine execution baseline for scripted SSH/WSL/tunnel/transfer workflows.

Impact for this project:

- Use `remotely run "<bash>"` for scripted remote commands and `remotely run --stdin` for heredocs or multi-line WSL bash scripts.
- Use `remotely send`, `remotely fetch`, and `remotely transfer prune` for normal configured-machine transfer. Keep raw `rsync` for advanced mirrors or non-configured hosts.
- Before relying on newly added behavior, run `remotely doctor` from `C:\Projects\remotely`; reinstall with `cargo install --path . --force --locked` if it reports drift.
- Tunnel startup now reports local-bind and SSH stderr failures more directly.
- On Unix/macOS, tunnel cleanup no longer trusts any live PID. It requires SSH tunnel identity evidence before signaling; stale non-tunnel state should be cleaned or ignored, not killed.
- Support tiers: Windows local -> Windows OpenSSH -> WSL remote is Tier 1; Linux POSIX SSH is Tier 2; macOS is Tier 3 until runtime smoke exists.

Release evidence: local coverage regions 95.33%, functions 96.22%, lines 97.03%; GitHub CI run `26688546331`; GitHub Security run `26688546339`.

## Receiver Decision -- 2026-07-03

Rejected as no local get-stuff-done change required after receiver verification.

Search evidence found no current get-stuff-done cross-machine execution helper or generated prompt surface that needs the remotely Phase 6 baseline. Existing Tailscale references are flake-collector planning notes, not active remotely command generation.

## Event Log
<!-- inbox-events:v1 -->
- 2026-07-03T17:19:30.000Z | get-stuff-done | rejected | Receiver verification found no current get-stuff-done change required; rationale recorded in Receiver Decision section.

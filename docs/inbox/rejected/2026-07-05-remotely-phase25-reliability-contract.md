---
schema_version: "1.3"
resolved_at: 2026-07-14
source_project: remotely
created: 2026-07-05
type: docs
severity: low
fix_status: none
affects_scope: this-project-only
priority_rationale: "Remotely Phase 25 changes expected install, doctor, explain, evidence, and transfer-readiness assumptions; get-stuff-done should update stale cross-machine guidance the next time it touches remotely-backed automation."
related_issue: "C:\\Projects\\remotely Phase 25 cohesive reliability platform deepening"
issue_id: remotely:2026-07-05:phase25-reliability-contract-get-stuff-done
thread_id: remotely:2026-07-05:phase25-reliability-contract
next_owner: get-stuff-done
status: rejected
triaged_at: 2026-07-05
---

# remotely Phase 25 Reliability Contract Update

## Receiver Decision -- 2026-07-14

Rejected as no current get-stuff-done change required after receiver
verification.

A current-source search found no get-stuff-done docs, commands, agents, scripts,
or tests that invoke remotely, document its install path, use raw SSH as a
remotely substitute, claim MCP transfer is globally unavailable, or consume
`support-evidence`. The SSH matches that do exist are Git remote URL validation
or historical security examples, not cross-machine execution guidance.

Future cross-machine work remains governed by the global `remotely run` and
transfer-authority rules. Reopen only when get-stuff-done adds an actual
remotely-backed automation surface or consumer contract.

## Event Log

<!-- inbox-events:v1 -->
- 2026-07-05T22:35:00.000Z | conversations | triaged | Normalized malformed broadcast metadata to inbox schema v1.3; receiver project still owns whether any local guidance changes are needed.
- 2026-07-14T05:05:00.000Z | get-stuff-done | rejected | Current-source search found no remotely-specific consumer guidance or automation to update; reopen when an actual remotely-backed surface is added.

## Source Phase

`25-cohesive-reliability-platform-deepening`

`remotely` Phase 25 is pending PR/merge. After it lands and the installed binary
is refreshed, consuming sessions should update any stale assumptions:

- Source-checkout reinstall path is now
  `cargo install --path crates\remotely-cli --force --locked`.
- `remotely doctor --fix --yes` can repair a safe stale install when the
  remediation plan authorizes it.
- `remotely run --explain` and `--explain --json` expose the resolved operation
  plan without executing.
- `remotely support-evidence --json` emits durable readiness evidence. Generate
  it to a temp path first, then copy into repo docs.
- MCP `remotely_send` and `remotely_fetch` are no longer globally disabled, but
  they require explicit named transfer roots, canonical local/remote proof,
  approval, audit, and recheck. Recursive transfer and native Windows remote
  proof remain out of scope.

Action: when this project next touches cross-machine automation, check for stale
`cargo install --path .` guidance, raw SSH workarounds, or MCP assumptions that
still treat transfer as globally unavailable.

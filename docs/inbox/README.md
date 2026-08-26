# Inbox - Cross-Project Protocol
<!-- cross-project-inbox:managed-stub:v1 -->

This directory accepts issue reports, blockers, handoffs, user actions, and
closure notices from other agent or project sessions per the Cross-Project
Inbox Protocol documented in `~/.claude/rules/cross-project-issues.md`.

## What lives here

Structured inbox files (one per item) following the format defined in the rule
linked above. Each file represents one durable cross-project coordination item,
such as:

- A bug or improvement opportunity found while another project was using this tool
- A blocker, closure notice, handoff, or user action that belongs to this
  project boundary
- Substantive enough to warrant a patch or detailed analysis (lightweight
  friction goes to `memory friction` per `tool-friction.md`; JSONL is fallback
  only)

## Triage

When opening this project's CWD session, check this directory for untriaged items:

```bash
ls docs/inbox/*.md 2>/dev/null
```

Triage steps for each open file (frontmatter `status: open` or unset):
1. Read `severity`, `type`, `source_project`, `next_owner`,
   `closure_notify_to`, and the body rationale/scope.
2. Validate proposed fix against current code
3. Update frontmatter `status: triaged`, `triaged_at: <today>`, and
   `next_owner` if the item remains active. Use this project slug when this
   project owns the next step, another project/person slug when waiting on that
   owner, or `user` only for genuine human decisions/actions.
4. Either apply per project standards or document rejection

After merge: `status: merged`, `resolved_at`, `pr_url` -> move to `archived/`.
After reject: `status: rejected`, append rationale -> move to `rejected/`.

## Conventions

- Filename: `YYYY-MM-DD-<reporting-project>-<slug>.md`
- One durable item per file
- Frontmatter schema: see `~/.claude/rules/cross-project-issues.md` (currently v1.3)

## Human Action Handoffs

Use `next_owner: user` when the next step genuinely needs the human to decide
or act. Examples: approval, account setup, credential action, product decision,
scope choice, or sequencing decision.

Do not use `next_owner: user` just to keep the user informed. Use normal
briefing summaries, event logs, or `closure_notify_to` for awareness and
round-trip closure.

`conversations` projects active `next_owner: user` items into generated
read-model views and future notification surfaces:

- `docs/user-inbox/pending.md` for compact Markdown.
- `docs/user-inbox/pending.html` for a richer HTML view.

The canonical action still lives in the owning project's inbox item. Close or
advance it there, not in a generated view.

Regenerate the current projection from `conversations` with one of:

```text
# Windows PowerShell
node C:/Projects/conversations/scripts/user-actions.cjs --write
node C:/Projects/conversations/scripts/user-actions.cjs --write --format html

# WSL/Linux
node ~/Projects/conversations/scripts/user-actions.cjs --write
node ~/Projects/conversations/scripts/user-actions.cjs --write --format html
```

Validate active project inbox files from `conversations` with one of:

```text
# Windows PowerShell
node C:/Projects/conversations/scripts/inbox-lint.cjs --active-projects --root C:/Projects

# WSL/Linux
node ~/Projects/conversations/scripts/inbox-lint.cjs --active-projects --root ~/Projects
```

## Project-Local Coordination Handoff Feed

When a `conversations` coordination audit says this project owns follow-up
work, consume only this project's filtered handoff row instead of asking the
user to relay context from another project.

From this project CWD, run one of:

```text
# Windows PowerShell
node C:/Projects/conversations/scripts/coordination-audit.cjs --root C:/Projects --target-actions-json

# WSL/Linux
node ~/Projects/conversations/scripts/coordination-audit.cjs --root ~/Projects --target-actions-json
```

The receiver project is inferred from the current directory when the command is
run under the supplied projects root. Use `--target-project <this-project-slug>`
only as an explicit override or when running from the `conversations` CWD.
Use `targetScope.status` as this receiver's local status; `auditStatus` is
global and can remain blocked because another project has work. Treat
`targetScope.status: clear` as no local coordination action and
`targetScope.status: accepted-deferred` as visible but not currently actionable.
If the returned row needs authkey delivery proof, use the generated
`targetActions[].handoff` command/args/examples; routine receiver handoffs do
not run authkey proof probes.

If a Windows PowerShell receiver needs to parse the JSON, write it directly as
UTF-8 from Node instead of relying on shell piping/redirection:

```powershell
node C:/Projects/conversations/scripts/coordination-audit.cjs --root C:/Projects --target-actions-json --json-output $env:TEMP\<this-project-slug>-target-actions.json
```

The compact JSON feed is a projection over the existing coordination audit. It
is not a second task store. Use it to find target-owned diagnostics, delivery
blockers, and worktree guidance, then perform the actual repair from this
project's own CWD under this project's local rules.

## Why this directory exists (not a rule restatement)

This stub references the global rule rather than restating it. If the rule's
schema or workflow changes, only the rule file is updated - this stub stays
correct because it has no spec content. If the convention is ever migrated to
a different mechanism (hook, MCP server, etc.), this README documents the
historical pattern for projects that haven't migrated yet.

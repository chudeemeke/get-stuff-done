# Project: get-stuff-done

This file is loaded by Claude Code at the start of every session in this CWD.
**It overrides default behavior. Read it fully before any edit.**

## Skin architecture (MANDATORY — non-negotiable)

This repository is a **skin/overlay over an upstream codebase**, not a fork
that edits upstream files in place. The upstream authority is Open GSD,
consumed as the npm devDependency `@opengsd/gsd-core` pinned in
`package.json` (the pin is read through the authority contract in
`scripts/lib/upstream-source.js`; never use a dynamic `latest`/`next` pin).
Composition happens at build time via `scripts/compose.js`, producing
`dist/` for the npm package `@chude/get-stuff-done`.

The legacy upstream `get-shit-done-cc` and the tracked `.upstream/` mirror are
deprecation evidence only. They are not the bump target and must not be
treated as `latest` authority.

**The rule:** edits MUST land on fork-owned paths only. Files sourced from
`node_modules/@opengsd/gsd-core/` and any path that mirrors upstream's tree
under composition are **read-only** for fork sessions.

### Pre-edit verification protocol (DO THIS BEFORE ANY EDIT)

When you are about to modify, create, or delete a file in this repository,
run this check first:

```bash
# 1. Is the file under .planning/, .github/, docs/, tests/, overrides/,
#    overlay/, scripts/, or a root config/doc (package.json, bun.lock,
#    bunfig.toml, eslint.config.js, .gitattributes, .gitignore,
#    .gitleaks.toml, .husky/, MAINTENANCE.md, CHANGELOG.md, README.md,
#    INSTALL.md, UPGRADING.md, SECURITY.md, CLAUDE.md)? -> fork-owned.
# 2. Otherwise, run the upstream-shadow check:
TARGET=path/relative/to/repo/root
UPSTREAM=node_modules/@opengsd/gsd-core

# Fail closed: without upstream on disk the shadow check cannot answer, and a
# bare `ls` miss would read as "safe to edit" for EVERY path in the repo.
if [ ! -f "$UPSTREAM/package.json" ]; then
  echo "FAIL-CLOSED - upstream is not installed ($UPSTREAM). Run bun install"
  echo "               and re-run this check. Do NOT edit until it answers."
elif [ -e "$UPSTREAM/$TARGET" ]; then
  echo "STOP - upstream has this path. Editing it violates skin discipline."
else
  echo "OK - upstream does not have this path; safe to edit fork-side."
fi
```

If step 2 says STOP, **do not edit**. The right action is one of:
- Add a sibling fork-side file (different filename) — additive, skin-clean.
- Place the change in `overrides/<same-relative-path>/<basename>` with a
  `REASON.md` alongside recording the reviewed upstream version and SHA-256 —
  the canonical override mechanism, gated by `scripts/check-overrides.js`
  (the BLOCKING "Override Staleness Check" CI job).
- Place the change in `overlay/<path>` if it is a fork-only addition — the
  canonical overlay mechanism.

### File-classification reference

| Path | Status | Notes |
|---|---|---|
| `.github/` | fork-only | Upstream package ships no `.github/`. All CI/workflows are the fork's responsibility. |
| `.planning/` | fork-only | This project's GSD planning artifacts. `STATE.md` is the canonical position. |
| `docs/` | fork-only | ADRs (`docs/decisions/`), cross-project inbox (`docs/inbox/`), reviews. |
| `tests/` | fork-only | Upstream ships no `tests/` to the consumer. All meta-tests and suites are fork additions. |
| `scripts/` | fork-only | Fork tooling (compose, parity, boundary, overrides, ratchet, perf, audit, flake/OSV triage, cousin smoke, branch protection). Before adding a script, grep `node_modules/@opengsd/gsd-core/` for a filename collision. |
| `hooks/index.js` | fork-only | SSOT manifest (ADR-002). Hook source lives in `overrides/hooks/` (replacements) and `overlay/hooks/` (additions). |
| `overrides/` | fork-only | Replacements of upstream paths. Each needs a `REASON.md`. |
| `overlay/` | fork-only | Fork-only additions to the composed tree (agents, commands, hooks, lib, memory, src, teams, workflows, `branding.json`, `features.json`). |
| Root configs and docs | fork-owned | `package.json` (bumping the upstream pin here is correct), `bun.lock`, `bunfig.toml`, `eslint.config.js`, `.gitattributes`, `.gitignore`, `.gitleaks.toml`, `.husky/`, `MAINTENANCE.md`, `CHANGELOG.md`, `README.md`, `INSTALL.md`, `UPGRADING.md`, `SECURITY.md`, `QUICKSTART.md`. |
| `.upstream/` | legacy mirror | Tracked historical snapshot of the pre-Open-GSD upstream. Not authority; do not edit or bump. |
| `.claude/` | local harness state (gitignored) | **Not repo content and not backed up.** Holds the project-local GSD install (`.claude/get-shit-done/`), 58 slash commands (`.claude/commands/gsd/`), and orphaned worktrees. Untracked and single-copy — a mistake here is unrecoverable. 55 of the 58 commands currently `@`-import a deleted iCloud path, so `/gsd:resume-work` is broken (issue #54), and a second GSD copy at `~/.claude/gsd-core/` diverges from the project-local one. Do not edit either copy without deciding which is authoritative. |
| `dist/` | build output (gitignored) | Generated by `bun run compose`. Never commit. |
| `node_modules/` | upstream (do not edit) | Source of truth for upstream content. |

### The empirical gates

- **Source Parity Check** (`scripts/check-parity.js`) — every `package.json#files`
  entry exists in source and hook source paths resolve. Green on every push is
  the proof that no upstream contamination has crept in.
- **Override Staleness Check** (`scripts/check-overrides.js`) — BLOCKING;
  every override's `REASON.md` matches the pinned upstream content hash.
- **Boundary Check** — informational; boundary debt is tracked by the ratchet in
  `.planning/audits/debt-baseline.json` via `scripts/check-debt-ratchet.cjs`.
  Never silently bump the baseline; threshold changes are recorded in
  `ratchet_history` with rationale, in the same PR as the regression.
- **Secret Scan** (gitleaks with `.gitleaks.toml` allowlist) — BLOCKING; never
  echo a found value, read the redacted report artifact.

If a push turns any of these red, **stop and audit** before continuing.
Branch protection on `main` requires the binding-gate jobs; see
`scripts/setup-branch-protection.json` for the live required-check set.

### When the user reminds you of skin discipline mid-session

Treat the reminder as a directive to **audit all recent commits before
proceeding**, not just to "remember the rule going forward":

```bash
git log --name-only --pretty=format:"%h %s" $(git merge-base HEAD main)..HEAD
```

Classify each touched file against the table above; run the upstream-shadow
check for anything uncertain; surface violations to the user before continuing
— do not silently revert. Confidence comes from the gates, not from memory.

## Operating the project

- **Position and resume:** read `.planning/HANDOFF.json` first, then the active phase's
  `.continue-here.md`. Both are self-contained and tracked in git.
  `.planning/STATE.md` is canonical for **plan-execution** position (which plan is next)
  and carries its own READ FIRST block explaining that distinction — its progress block
  can be many weeks behind the session position when non-plan work has happened.
  `/gsd:resume-work` is the intended entry point but is **currently broken** (issue #54);
  you do not need it. Re-verify PR state and the latest CI run rather than trusting the
  last session's report — and check `git worktree list` for `prunable` entries plus
  `git rev-list --left-right --count origin/<branch>...<branch>`, because work has been
  stranded in an orphaned worktree before.
- **Bump, security, and oversight runbooks:** `MAINTENANCE.md`. Use
  `bun install --ignore-scripts` for dependency updates; generate
  `package-lock.json` only as an audit input and never commit it.
- **Quality gate before a PR is ready:** `bun run lint`, `bun run lint:docs`,
  `bun run compose`, `bun test`, `node scripts/check-overrides.js`, and the
  `bun run audit:ci` / `bun run perf:check` jobs the CI matrix runs.
- **Git workflow:** branch -> PR -> review -> CI green -> squash merge, per
  `~/.claude/rules/git-workflow.md`. No direct commits to `main`.

## Composing global rules

The global rules at `~/.claude/rules/` apply here in addition to this file.
The most load-bearing for this project:

- `no-hidden-debt.md` — surface findings before continuing, even if small or
  not from this session.
- `honor-directives.md` — when corrected mid-execution, explain the prior
  choice before reverting; never silently change a directive.
- `actions-not-promises.md` — when corrected, build the forcing-function
  artifact in this exchange, not a future-tense promise.
- `restate-before-act.md` — for non-trivial multi-step requests, restate
  intent in concrete enumerated steps before executing.
- `cross-project-issues.md` — bug found in a first-party tool (aidev, memory,
  remotely, etc.)? Route to that tool's `docs/inbox/`. Triage this project's
  `docs/inbox/` at session start and before handoff.

## Memory layout

Project memory lives at
`~/.claude/projects/C--Projects-get-stuff-done/memory/` (keyed by the
`C:\Projects\get-stuff-done` path — always open sessions from that path, never
from an alias, or the memory key splits).

`MEMORY.md` is the index; read it before assuming a topic is fresh.
`SESSION_LOG.md` is the rolling per-session narrative.

## What this file is NOT

This file does not duplicate `.planning/STATE.md`, `.planning/PROJECT.md`,
`.planning/ROADMAP.md`, `MAINTENANCE.md`, or any phase plan. Those are the
canonical sources for project state, roadmap, and runbooks. This file is the
behavioral contract for sessions in this CWD.

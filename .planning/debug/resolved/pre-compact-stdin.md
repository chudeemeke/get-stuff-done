---
status: resolved
trigger: "Pre-Compact Hook 'stdin is not a tty' on Git Bash"
created: 2026-02-10T05:30:00.000Z
updated: 2026-02-10T06:45:00.000Z
---

## Current Focus

hypothesis: CONFIRMED -- "stdin is not a tty" is produced by winpty, not by the hook itself
test: N/A -- root cause confirmed
expecting: N/A
next_action: Archive session

## Symptoms

expected: Hook silently processes JSON from stdin, creates/updates CONTINUE.md and events.log, exits 0
actual: Message "stdin is not a tty" appears; unclear if hook completed
errors: "stdin is not a tty" on Git Bash when piping JSON to pre-compact.js
reproduction: echo '{"trigger":"test"}' | node hooks/pre-compact.js (in interactive Git Bash / mintty)
started: Observed during cross-platform testing (Phase 09-04)

## Eliminated

- hypothesis: The hook's Node.js code has a stdin handling bug
  evidence: Direct invocation (without winpty) succeeds every time. Hook code uses correct module-level stdin listener pattern identical to gsd-statusline.js. The 09-04 fix (moving listeners from async main() to module level) is in place and working.
  timestamp: 2026-02-10T05:40:00Z

- hypothesis: "stdin is not a tty" is a harmless warning and the hook still works
  evidence: When winpty intercepts the call, the hook NEVER executes -- events.log is NOT updated. The message is NOT harmless when winpty is the intermediary; it prevents the hook from running entirely.
  timestamp: 2026-02-10T06:30:00Z

## Evidence

- timestamp: 2026-02-10T05:35:00Z
  checked: .planning/CONTINUE.md
  found: File exists, last compacted at 2026-02-09T21:17:07.852Z with trigger=test
  implication: Hook has successfully written CONTINUE.md in past invocations (from Claude Code, not interactive Git Bash)

- timestamp: 2026-02-10T05:35:00Z
  checked: .planning/events.log
  found: 4 entries total, 3 with trigger=test (20:17, 20:33, 21:17), 1 manual (20:01)
  implication: Hook has successfully appended to events.log multiple times

- timestamp: 2026-02-10T05:36:00Z
  checked: hooks/pre-compact.js vs hooks/gsd-statusline.js stdin patterns
  found: Both use identical pattern -- module-level stdin listeners with process.stdin.setEncoding + on('data') + on('end')
  implication: The stdin reading code is correct and consistent

- timestamp: 2026-02-10T05:39:00Z
  checked: Direct pipe to hook WITHOUT winpty (Claude Code Bash tool)
  found: echo '{"trigger":"debug-test"}' | node hooks/pre-compact.js succeeds, events.log updated, CONTINUE.md updated, exit 0
  implication: Hook code itself is correct; the problem is in the invocation environment

- timestamp: 2026-02-10T06:20:00Z
  checked: /etc/profile.d/aliases.sh (Git Bash default profile)
  found: Contains auto-alias logic that creates `alias node="winpty node.exe"` when TERM matches xterm* and node.exe is at a non-MSYS path
  implication: In interactive Git Bash (mintty), `node` resolves to `winpty node.exe`, which intercepts piped stdin

- timestamp: 2026-02-10T06:25:00Z
  checked: Direct winpty invocation: echo '{"trigger":"..."}' | winpty node.exe hooks/pre-compact.js
  found: Produces "stdin is not a tty" message, exit code 1, hook never executes (events.log NOT updated)
  implication: winpty rejects piped stdin and prevents node from starting

- timestamp: 2026-02-10T06:30:00Z
  checked: Interactive bash with aliases.sh sourced via --rcfile
  found: alias node='winpty node.exe' active; piping to `node hooks/pre-compact.js` produces "stdin is not a tty"; events.log NOT updated
  implication: Reproduces the exact user-reported symptom -- winpty alias causes the failure

- timestamp: 2026-02-10T06:35:00Z
  checked: Claude Code settings.json hook configuration
  found: Hook command is `node "C:/Users/Destiny/.claude/hooks/pre-compact.js"` -- invoked via Node.js child_process, NOT through shell aliases
  implication: Claude Code's hook invocation bypasses the winpty alias entirely; the hook works in production use

## Resolution

root_cause: |
  The "stdin is not a tty" message is produced by winpty, NOT by the pre-compact hook itself.

  Git Bash ships /etc/profile.d/aliases.sh which auto-creates `alias node="winpty node.exe"`
  in interactive terminals where TERM matches xterm* (i.e., mintty). When a user manually runs
  `echo '{"trigger":"test"}' | node hooks/pre-compact.js` in an interactive Git Bash window,
  the `node` alias resolves to `winpty node.exe`. winpty is designed for interactive terminal
  emulation and rejects piped stdin with "stdin is not a tty", exit code 1. The node process
  never starts, so the hook never executes.

  However, this does NOT affect production use. Claude Code invokes hooks via Node.js
  child_process.spawn(), which calls the node executable directly -- no shell, no aliases,
  no winpty. The hook works correctly in this context.

  For manual testing in Git Bash, the workaround is to bypass the alias:
  - Use `command node` instead of `node`: echo '...' | command node hooks/pre-compact.js
  - Or use the full path: echo '...' | node.exe hooks/pre-compact.js
  - Or unalias node: unalias node && echo '...' | node hooks/pre-compact.js

fix: No code fix needed. The hook code is correct. The issue is environmental (winpty alias in Git Bash).
verification: |
  1. Direct invocation (no winpty): hook succeeds, events.log updated, CONTINUE.md created -- PASS
  2. Via winpty: "stdin is not a tty" reproduced -- confirms root cause
  3. Via interactive bash with alias: same "stdin is not a tty" -- confirms mechanism
  4. Claude Code production path (child_process): works correctly, no alias interference
files_changed: []

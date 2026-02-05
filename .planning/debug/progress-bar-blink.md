---
status: diagnosed
trigger: "When it was red it DIDN'T blink even though I can't confirm that the threshold was 87.5%+. Don't know if blink functionality is missing or if threshold logic is wrong."
created: 2026-02-02T00:00:00Z
updated: 2026-02-02T00:00:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: CONFIRMED - supportsBlinking() has incorrect check order
test: Traced function with TERM_PROGRAM=vscode and TERM=xterm-256color
expecting: Should return false for VS Code
next_action: Root cause documented - ready for fix

## Symptoms

expected: Progress bar and lightning icon should blink when context exceeds 87.5% of autocompact threshold (or show bright/bold in VS Code as fallback)
actual: Red stage does NOT blink even in xterm-compatible terminals; VS Code fallback to bright not triggered
errors: None (logic error)
reproduction: Run statusline at 45%+ used with default 50% threshold
started: Phase 02 statusline redesign implementation

## Eliminated

- hypothesis: Threshold logic is wrong
  evidence: Tested threshold calculation - orangeMax=43.75% correctly calculated. At used=45%, code correctly enters the blink branch (line 115-118).
  timestamp: 2026-02-02T00:00:00Z

- hypothesis: Blink ANSI code is wrong
  evidence: Code uses \x1b[5m which is correct ANSI blink code. Verified in cat -v output that the code is being emitted.
  timestamp: 2026-02-02T00:00:00Z

## Evidence

- timestamp: 2026-02-02T00:00:00Z
  checked: supportsBlinking() function at lines 37-49
  found: |
    The function has incorrect check order:
    1. First checks: if (term.includes('xterm') || termProgram === 'iTerm.app') return true
    2. Then checks: if (termProgram === 'vscode') return false

    VS Code terminal sets TERM=xterm-256color AND TERM_PROGRAM=vscode.
    The xterm check matches first and returns true, so the VS Code check is never reached.
  implication: VS Code users never get the bright fallback - they always get blink code which VS Code ignores

- timestamp: 2026-02-02T00:00:00Z
  checked: Actual ANSI output at 45% used
  found: Output contains ^[[5m^[[31m (blink + red codes) proving the blink code IS being emitted
  implication: The blink code is sent, but VS Code silently ignores it. Without the bright fallback, users see non-blinking red.

- timestamp: 2026-02-02T00:00:00Z
  checked: Claude Code terminal environment
  found: Claude Code runs in VS Code integrated terminal which sets TERM_PROGRAM=vscode
  implication: All users running Claude Code in VS Code will hit this bug

## Resolution

root_cause: |
  supportsBlinking() function at hooks/gsd-statusline.js:37-49 has incorrect check order.
  The xterm check (line 42) returns true before the VS Code check (line 45) can execute.
  Since VS Code sets TERM=xterm-256color, the xterm check always matches first.

  Result: VS Code users get blink ANSI code (\x1b[5m) instead of bright fallback (\x1b[1m).
  VS Code terminal silently ignores blink codes, so users see non-blinking red.

fix: |
  Reorder the checks in supportsBlinking() to check for VS Code FIRST:

  function supportsBlinking() {
    const term = process.env.TERM || '';
    const termProgram = process.env.TERM_PROGRAM || '';

    // Check for non-supporting terminals FIRST (VS Code, GNOME Terminal)
    if (termProgram === 'vscode') return false;

    // Known to support: xterm variants, iTerm, konsole
    if (term.includes('xterm') || termProgram === 'iTerm.app') return true;

    // Default: optimistically try blink
    return true;
  }

verification: []
files_changed: []

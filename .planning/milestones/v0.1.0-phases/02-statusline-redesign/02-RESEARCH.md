# Phase 02: Statusline Redesign - Research

**Researched:** 2026-01-31
**Domain:** Terminal UI with ANSI escape codes, Node.js statusline implementation
**Confidence:** HIGH

## Summary

This phase redesigns the GSD statusline to add branding, dynamic color thresholds, stage icons, and update notifications. The implementation is constrained by user decisions in 02-CONTEXT.md: use cyan `⧉ [GSD]` branding at far left, 3-color progress bar (green/yellow/red), blink at 87.5% threshold, and update notifications on a second line.

The technical domain is well-established: ANSI escape codes for colors and blinking, Node.js for stdin JSON parsing, and Unicode symbols with fallback strategies. The current statusline (hooks/gsd-statusline.js) already implements dynamic thresholds and context window display, providing a solid foundation.

Key challenges: blink support varies across terminals (works in iTerm2, XTerm, konsole; disabled in VS Code, GNOME Terminal), Unicode fallback for icons, and detecting "model is processing" state (currently not provided in Claude Code's statusline JSON).

**Primary recommendation:** Build on existing gsd-statusline.js using raw ANSI escape codes (no dependencies). Implement graceful degradation for blink and Unicode. Use visual cues (color intensity) as fallback for unsupported terminals.

## Standard Stack

The established libraries/tools for Node.js terminal statuslines:

### Core (What We'll Use)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Raw ANSI codes | N/A | Colors, blinking, formatting | Zero dependencies, maximum compatibility, what current code uses |
| Node.js fs/path | Built-in | File operations, JSON parsing | Native, already in use |
| stdin/stdout | Built-in | JSON input, text output | Claude Code statusline protocol |

**Rationale for no external libraries:**
- Current statusline (hooks/gsd-statusline.js) uses raw ANSI codes successfully
- Package has minimal dependencies (ajv, json5) - adding color libraries conflicts with minimalist approach
- Bundled hooks (hooks/dist) are esbuild-compiled, external deps complicate build
- ANSI codes are simple for this use case (basic colors, blink)

### Supporting (If Needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| figures | ^6.0.0 | Unicode symbols with fallback | Only if icons cause issues; current code uses raw Unicode successfully |
| chalk | ^5.3.0 | ANSI color helpers | Only if raw codes become unwieldy (unlikely for this scope) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw ANSI codes | chalk | Cleaner API but adds dependency; current code doesn't use it |
| Raw Unicode | figures | Auto-fallback but adds dependency; test first without |
| Manual icon mapping | is-unicode-supported | Detects capability but manual map is simpler |

**Installation (if supporting libraries needed):**
```bash
# Only add if needed after testing
bun add figures  # For Unicode fallback
```

## Architecture Patterns

### Current Statusline Structure (hooks/gsd-statusline.js)

```
hooks/gsd-statusline.js
├── Config loading (ConfigLoader)
├── Dynamic threshold calculation (0.5, 0.75, 0.875 of autocompact)
├── stdin JSON parsing
├── Progress bar rendering (█ / ░)
├── Color logic (green/yellow/orange/red based on thresholds)
├── Task detection (from ~/.claude/todos)
├── Update check (from ~/.claude/cache/gsd-update-check.json)
└── Output formatting (model | task | dir | context)
```

### Recommended Modifications for Phase 02

```
hooks/gsd-statusline.js (enhanced)
├── Branding rendering (⧉ [GSD] with cyan color, dim/bright states)
├── Icon selection (none/⚠️/⚡ based on threshold stage)
├── Blink detection & fallback (check TERM, apply \x1b[5m or fallback)
├── Unicode fallback (test terminal support, use ASCII alternatives)
├── Two-line output (line 1: statusline, line 2: update notification if available)
├── Processing state detection (if data available; currently missing from Claude Code JSON)
└── White separators (|\x1b[0m instead of \x1b[2m)
```

### Pattern 1: ANSI Color and Blinking

**What:** Use ANSI escape sequences for colors and text effects
**When to use:** Always for terminal statuslines

**Example:**
```javascript
// Source: https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
// Colors
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const ORANGE = '\x1b[38;5;208m';  // 256-color mode
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BRIGHT = '\x1b[1m';
const RESET = '\x1b[0m';

// Effects
const BLINK = '\x1b[5m';  // Not supported in all terminals
const BLINK_OFF = '\x1b[25m';

// Usage
const branding = `${CYAN}⧉ [GSD]${RESET}`;
const blinkText = `${BLINK}${RED}critical${RESET}`;
```

**Compatibility notes:**
- Basic 16 colors: Universal support
- 256 colors (`\x1b[38;5;Nm`): Supported in most modern terminals
- Truecolor/RGB: Not needed for this phase
- Blink: Works in iTerm2, XTerm, konsole; disabled in VS Code, GNOME Terminal

### Pattern 2: Unicode Symbol Fallback

**What:** Detect terminal Unicode support and provide ASCII alternatives
**When to use:** When using Unicode symbols like ⧉, ⚠️, ⚡

**Example:**
```javascript
// Source: https://github.com/sindresorhus/is-unicode-supported pattern
// Manual detection (figures package does this)
function supportsUnicode() {
  // Windows Console Host has limited Unicode
  if (process.platform === 'win32') {
    return Boolean(process.env.WT_SESSION) || // Windows Terminal
           Boolean(process.env.ConEmuTask) ||  // ConEmu
           process.env.TERM_PROGRAM === 'vscode'; // VS Code
  }
  // Unix-like: check TERM or LC_ALL
  return process.env.TERM !== 'linux' && !process.env.LANG?.includes('ASCII');
}

const icons = supportsUnicode()
  ? { brand: '⧉', warning: '⚠️', lightning: '⚡' }
  : { brand: '*', warning: '!', lightning: '>' };

const branding = `${icons.brand} [GSD]`;
```

**Alternative:** Test with raw Unicode first; only add fallback if users report issues.

### Pattern 3: Multi-Line Statusline Output

**What:** Output multiple lines for statusline content
**When to use:** When you need more than one line of status information

**Example:**
```javascript
// Source: Claude Code statusline docs - https://code.claude.com/docs/en/statusline
// Claude Code uses first line of stdout
// For multi-line: output with newlines

let line1 = `${branding} | ${model} | ${progressBar} | ${dir}`;
let line2 = updateNotification ? `${updateNotification}` : '';

// Output both if line2 exists, otherwise just line1
if (line2) {
  process.stdout.write(`${line1}\n${line2}`);
} else {
  process.stdout.write(line1);
}
```

**Note:** Verify Claude Code supports multi-line statuslines; docs show "first line" but may accept more.

### Pattern 4: Conditional Blink with Fallback

**What:** Apply blink effect with graceful degradation
**When to use:** For critical states (87.5%+ threshold) when terminal may not support blink

**Example:**
```javascript
// Check if terminal likely supports blink
function supportsBlinking() {
  const term = process.env.TERM || '';
  const termProgram = process.env.TERM_PROGRAM || '';

  // Known to support: xterm, konsole, iTerm
  if (term.includes('xterm') || termProgram === 'iTerm.app') return true;

  // Known NOT to support: VS Code integrated terminal
  if (termProgram === 'vscode') return false;

  // Default: try it
  return true;
}

function formatCritical(text) {
  if (supportsBlinking()) {
    return `\x1b[5;31m${text}\x1b[0m`;  // Blinking red
  } else {
    return `\x1b[1;31m${text}\x1b[0m`;  // Bright red (no blink)
  }
}
```

**Sources:**
- [ANSI Escape Codes](https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797)
- [Terminal ANSI blink support](https://github.com/microsoft/vscode/issues/173011)

### Anti-Patterns to Avoid

- **Outputting to stderr:** Claude Code statusline reads stdout only; stderr breaks display
- **Unbounded output:** Keep statusline concise; long text truncates or wraps poorly
- **Blocking operations:** Statusline updates every 300ms; slow operations (network, disk) cause lag
- **Color codes without reset:** Always use `\x1b[0m` to reset; leaking colors breaks terminal
- **Assuming Unicode/blink support:** Test for capabilities or provide fallback

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unicode detection | Custom platform checks | `is-unicode-supported` or manual checks (pattern above) | Edge cases: SSH, tmux, screen, exotic terminals |
| Color library | Custom ANSI builder | Raw codes (for simple use) OR chalk/ansis | Color downsampling, truecolor vs 256 vs 16 |
| Terminal capability detection | Parse TERM variable | Established heuristics (shown in patterns) | Terminal database is complex (terminfo) |
| Progress bar math | Manual percentage calculation | Reuse existing logic in gsd-statusline.js | Already implements filled/empty segments correctly |

**Key insight:** For this phase, raw ANSI codes suffice. Only add dependencies (chalk, figures) if complexity grows. The current statusline uses raw codes successfully.

## Common Pitfalls

### Pitfall 1: Blink Unsupported in Popular Terminals

**What goes wrong:** Code uses `\x1b[5m` for blink, but VS Code integrated terminal and GNOME Terminal don't support it; text appears normal (no blink).

**Why it happens:** ANSI blink (SGR 5) is optional; many terminals disable it or never implemented it. Terminal emulator diversity means feature support varies.

**How to avoid:**
1. Detect terminal type (TERM_PROGRAM, TERM variables)
2. Provide fallback: bright red instead of blinking red
3. Test in multiple terminals (iTerm2, VS Code, Windows Terminal)

**Warning signs:**
- User reports "not blinking" in certain terminals
- Blink works locally but not in CI/SSH

**Sources:**
- [VS Code terminal ANSI blink not supported](https://github.com/microsoft/vscode/issues/173011)
- [Terminal ANSI blink compatibility](https://misc.flogisoft.com/bash/tip_colors_and_formatting)

### Pitfall 2: Unicode Icons Break in Windows Console Host

**What goes wrong:** Unicode icons (⧉, ⚠️, ⚡) display as `?` or boxes in older Windows terminals (cmd.exe, PowerShell without Windows Terminal).

**Why it happens:** Windows Console Host uses code pages (CP437, CP850) that lack many Unicode characters. Only Windows Terminal, ConEmu, or VS Code integrated terminal have full Unicode support.

**How to avoid:**
1. Detect Windows platform and terminal type
2. Use ASCII fallback: `*`, `!`, `>` instead of Unicode
3. Test on actual Windows (not just WSL)

**Warning signs:**
- Reports from Windows users about "weird characters"
- Icons work in WSL but not native Windows

**Sources:**
- [figures npm package - Unicode with fallbacks](https://www.npmjs.com/package/figures)
- [cross-platform terminal characters](https://www.npmjs.com/package/cross-platform-terminal-characters)

### Pitfall 3: Multi-Line Statusline Not Supported

**What goes wrong:** Outputting `line1\nline2` to stdout; Claude Code only shows first line or displays raw newline.

**Why it happens:** Claude Code statusline docs say "first line of stdout becomes the status line text." Multi-line support unclear.

**How to avoid:**
1. Test multi-line output in actual Claude Code
2. If unsupported, merge line 2 into line 1 with separator: `line1 | line2`
3. Truncate intelligently to fit terminal width

**Warning signs:**
- Second line never appears
- Newline renders as `\n` literally

**Verification needed:** Test `echo -e "line1\nline2"` as statusline to confirm behavior.

**Sources:**
- [Claude Code statusline docs](https://code.claude.com/docs/en/statusline)

### Pitfall 4: Color Codes Contaminating Output

**What goes wrong:** PowerLevel10k or complex prompts inject ANSI codes that Claude Code misparses, causing timeout/parsing failures.

**Why it happens:** Some terminals/prompts output additional ANSI sequences (cursor positioning, decorations) that interfere with Claude Code's parsing.

**How to avoid:**
1. Keep statusline output clean: only text and supported ANSI color codes
2. Avoid cursor movement codes (`\x1b[H`, `\x1b[A`)
3. Always reset colors before output ends (`\x1b[0m`)

**Warning signs:**
- Statusline works standalone but fails in Claude Code
- Timeout errors when statusline runs

**Sources:**
- [Claude Code ANSI escape contamination issue](https://github.com/anthropics/claude-code/issues/5428)
- [Statusline ANSI codes not rendering](https://github.com/anthropics/claude-code/issues/6635)

### Pitfall 5: Expensive Operations in Statusline

**What goes wrong:** Statusline calls slow operations (git status, network requests, file searches); updates lag, timeout, or block Claude Code.

**Why it happens:** Claude Code runs statusline every 300ms; blocking calls accumulate, causing UI freezes.

**How to avoid:**
1. Cache expensive results (git branch, update check)
2. Use async patterns or background processes
3. Current code caches update check in ~/.claude/cache/gsd-update-check.json — follow this pattern

**Warning signs:**
- Statusline updates visibly lag
- High CPU usage from node processes
- Git operations run constantly

**Current implementation:** gsd-statusline.js already caches update check; maintain this pattern for new features.

### Pitfall 6: Missing Processing State Detection

**What goes wrong:** CONTEXT.md specifies "dim when idle, bright when model is processing" but Claude Code JSON doesn't provide processing state.

**Why it happens:** Statusline JSON (as of docs review) includes model, workspace, cost, context_window, but no explicit "is_processing" or "status" field.

**How to avoid:**
1. Check for undocumented fields in actual JSON (test during Claude Code session)
2. Heuristic: rapid context_window updates might indicate processing
3. Fallback: always show bright branding (drop dynamic behavior)

**Warning signs:**
- Branding never changes brightness
- No state field found in JSON

**Sources:**
- [Claude Code statusline JSON structure](https://code.claude.com/docs/en/statusline)

## Code Examples

Verified patterns from official sources and current implementation:

### Reading Claude Code JSON Input

```javascript
// Source: https://code.claude.com/docs/en/statusline (Node.js example)
// Current implementation: hooks/gsd-statusline.js lines 28-32

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const model = data.model?.display_name || 'Claude';
    const remaining = data.context_window?.remaining_percentage;
    // ... process data
  } catch (e) {
    // Silent fail - don't break statusline
  }
});
```

### Calculating Dynamic Color Thresholds

```javascript
// Source: Current implementation (hooks/gsd-statusline.js lines 9-25)
// Load config for dynamic thresholds
let autocompactThreshold = 50;  // Default
try {
  const { loadConfig, getConfigValue } = require('../src/config/ConfigLoader');
  const config = loadConfig();
  autocompactThreshold = getConfigValue(config, 'context_management.autocompact_threshold', 50);
} catch (e) {
  // Silent fail - use default
}

// Calculate color thresholds as fractions of autocompact threshold
const greenMax = autocompactThreshold * 0.5;   // 50% of threshold
const yellowMax = autocompactThreshold * 0.75;  // 75% of threshold
const orangeMax = autocompactThreshold * 0.875; // 87.5% of threshold
```

### Progress Bar with Icons and Colors

```javascript
// Enhanced version based on current implementation (lines 39-59)
const used = 100 - remaining;  // Convert remaining % to used %
const filled = Math.floor(used / 10);
const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

// Select icon based on threshold stage
let icon = '';
let color;
if (used < greenMax) {
  icon = '';  // No icon for green
  color = '\x1b[32m';  // Green
} else if (used < yellowMax) {
  icon = '⚠️ ';  // Warning for yellow
  color = '\x1b[33m';  // Yellow
} else if (used < orangeMax) {
  icon = '⚡';  // Lightning for orange
  color = '\x1b[38;5;208m';  // Orange (256-color)
} else {
  icon = '⚡';  // Lightning for red
  color = '\x1b[5;31m';  // Red blinking
}

const ctx = ` ${color}${icon}${bar} ${used}%\x1b[0m`;
```

### Branding with Dim/Bright States

```javascript
// New for Phase 02 (based on CONTEXT.md decisions)
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BRIGHT = '\x1b[1m';
const RESET = '\x1b[0m';

function getBranding(isProcessing) {
  const iconStyle = BRIGHT;  // Icon always bright per CONTEXT.md
  const textStyle = isProcessing ? BRIGHT : DIM;

  return `${CYAN}${iconStyle}⧉${RESET} ${CYAN}${textStyle}[GSD]${RESET}`;
}

// Note: isProcessing detection TBD - not in current JSON
const branding = getBranding(false);  // Default to idle
```

### White Separators

```javascript
// Per CONTEXT.md: separators WHITE not DIM
const SEP = ' \x1b[37m|\x1b[0m ';  // White pipe with spaces

const statusline = `${branding}${SEP}${model}${SEP}${ctx}${SEP}${dir}`;
```

### Update Notification (Second Line)

```javascript
// Source: Current implementation (lines 81-90) + CONTEXT.md
let updateLine = '';
const cacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-update-check.json');

if (fs.existsSync(cacheFile)) {
  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (cache.update_available) {
      // Check role from config (maintainer vs consumer)
      const role = getConfigValue(config, 'gsd.role', 'consumer');

      if (role === 'maintainer') {
        updateLine = '\x1b[2m📦 upstream updates | /gsd:upstream\x1b[0m';
      } else {
        const current = cache.current_version || 'v0.1.0';
        const latest = cache.latest_version || 'v0.2.0';
        updateLine = `\x1b[2m📦 ${current} → ${latest} | /gsd:update\x1b[0m`;
      }
    }
  } catch (e) {}
}

// Output: line1 or line1\nline2
if (updateLine) {
  process.stdout.write(`${statusline}\n${updateLine}`);
} else {
  process.stdout.write(statusline);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External color libraries (chalk) | Raw ANSI codes for simple cases | 2024-2025 | Minimal statuslines avoid dependencies; picocolors/ansis preferred when library needed |
| Hardcoded Unicode symbols | Automatic fallback detection (figures, is-unicode-supported) | 2023+ | Better Windows compatibility; detect vs assume |
| 16-color only | 256-color and truecolor | Widely supported since 2020 | More expressive colors; use 256-color for orange |
| jq for JSON parsing | Native Node.js JSON.parse | Always | jq is external dependency; Node.js built-in faster |
| Single-line statuslines | Multi-line/multi-segment | 2025+ (community tools) | More info density; verify Claude Code support |

**Deprecated/outdated:**
- **chalk v4 (CommonJS):** Replaced by chalk v5 (ESM-only). Since gsd uses CommonJS, stick with raw codes or use ansi-colors/picocolors if needed.
- **Windows ConPTY before Windows 10:** Old Console Host lacks features; assume Windows Terminal (2019+) or VS Code.
- **TERM=linux limitation:** Rare today; most Linux terminals support 256-color.

## Open Questions

Things that couldn't be fully resolved:

1. **Does Claude Code support multi-line statuslines?**
   - What we know: Docs say "first line of stdout becomes the status line text"
   - What's unclear: Does it support newlines for multiple lines, or truncate/ignore?
   - Recommendation: Test with `echo -e "line1\nline2"` in settings.json; if unsupported, merge lines with separator

2. **How to detect "model is processing" state?**
   - What we know: JSON includes model, workspace, cost, context_window
   - What's unclear: No documented "status" or "is_processing" field
   - Recommendation: Inspect actual JSON during Claude Code session; if absent, drop dynamic dim/bright branding or always show bright

3. **What is the current GSD role detection mechanism?**
   - What we know: CONTEXT.md specifies role: maintainer vs consumer
   - What's unclear: How is role configured? config.json field? Heuristic?
   - Recommendation: Check existing config schema; if missing, add gsd.role to config or detect from git remote (has upstream -> maintainer)

4. **How does update check notification work currently?**
   - What we know: Code reads ~/.claude/cache/gsd-update-check.json
   - What's unclear: What creates this file? When? What triggers the check?
   - Recommendation: Search codebase for gsd-update-check.json writer; likely bin/gsd or a periodic background task

## Sources

### Primary (HIGH confidence)

- [Claude Code statusline docs](https://code.claude.com/docs/en/statusline) - Official JSON structure, usage examples
- [ANSI Escape Codes Gist](https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797) - Comprehensive ANSI code reference
- Current implementation: `hooks/gsd-statusline.js` - Working code for dynamic thresholds, progress bars
- Current config: Phase 01 ConfigLoader - Nested config structure, getConfigValue pattern

### Secondary (MEDIUM confidence)

- [figures npm package](https://www.npmjs.com/package/figures) - Unicode symbols with fallbacks for older terminals
- [Terminal ANSI blink support discussion](https://github.com/microsoft/vscode/issues/173011) - VS Code doesn't support blink
- [Claude Code ANSI contamination issue](https://github.com/anthropics/claude-code/issues/5428) - PowerLevel10k parsing failures
- [Node.js color library comparison](https://npm-compare.com/ansi-colors,chalk,colors,kleur) - Chalk vs alternatives 2026

### Tertiary (LOW confidence)

- [Build CLI with ANSI codes](https://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html) - Tutorial (2018, still relevant)
- [Terminal progress bars with Unicode](https://mike42.me/blog/2018-06-make-better-cli-progress-bars-with-unicode-block-characters) - Best practices
- Community statusline projects (ccstatusline, Claude HUD) - Advanced features; not applicable to minimal approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Current code uses raw ANSI codes successfully; no-dependency approach validated
- Architecture: HIGH - Existing gsd-statusline.js provides working patterns; CONTEXT.md constrains design
- Unicode/blink support: MEDIUM - Terminal diversity well-documented, but fallback testing needed
- Multi-line support: LOW - Claude Code behavior undocumented; requires testing
- Processing state detection: LOW - JSON structure documented but no processing field found; may be undocumented

**Research date:** 2026-01-31
**Valid until:** ~2026-03-01 (30 days; stable domain, slow-moving ANSI standards)

**Open questions requiring investigation:**
1. Multi-line statusline support (test in Claude Code)
2. Processing state detection (inspect live JSON)
3. Role detection mechanism (check config schema)
4. Update check writer (search codebase)

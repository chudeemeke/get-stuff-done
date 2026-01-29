# Phase 1: Configuration System - Research

**Researched:** 2026-01-29
**Domain:** Configuration management, JSON5 parsing, file watching, Claude Code CLI integration
**Confidence:** HIGH

## Summary

Phase 1 implements a configuration file system (`~/.gsd/config.json`) to control GSD runtime behavior. The research reveals three technical domains: (1) Claude Code CLI flags and context management, (2) JSON5 parsing with validation for human-friendly config files, and (3) file watching for hot reload functionality.

**Key findings:**
- Claude Code CLI supports `--chrome` and `--dangerously-skip-permissions` flags, but NO native `--autocompact` flag exists (as of 2026)
- JSON5 is the standard for human-friendly config files (65M+ downloads/week) with comment and trailing comma support
- Chokidar is the industry standard for file watching (30M+ repos), with `fs.watch` as a lightweight alternative
- Config should represent user mental model ("100k usable context") with GSD handling internal buffer calculations

**Primary recommendation:** Use JSON5 for config parsing, implement custom autocompact pass-through via env vars or wrapper logic, use native `fs.watch` for hot reload (avoid chokidar dependency for this simple use case), and validate config with a lightweight schema validator.

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| json5 | 2.x | Parse JSON5 config files | 65M+ weekly downloads, industry standard for config files with comments. Top 0.1% of npm packages. Adopted by Chromium, Next.js, Babel, WebStorm. |
| Node.js fs.watch | Native | File watching for hot reload | Built-in, zero dependencies. Sufficient for single-file watching. Modern Node.js (v19.1+) has improved fs.watch reliability. |
| ajv OR zod | Latest | JSON schema validation | AJV is fastest (high-performance apps), Zod best for TypeScript. Both production-proven. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| chokidar | 5.x | Advanced file watching | Only if multiple file watching or network filesystem support needed. 30M+ repos use it. Avoid for single-file config watching. |
| joi | Latest | Schema validation (alternative) | Feature-rich, flexible. Good for complex validation rules. Less performant than AJV. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON5 | Plain JSON | Lose comments, trailing commas. Less human-friendly. No real advantage. |
| fs.watch | chokidar | Chokidar more robust but adds dependency. fs.watch sufficient for single config file. |
| ajv/zod | Manual validation | Error-prone, lacks standard error messages. No advantage except zero deps. |
| Schema validation | No validation | Config typos silently ignored. User confusion. MUST have validation. |

**Installation:**
```bash
bun add json5 ajv  # or: bun add json5 zod
```

## Architecture Patterns

### Recommended Project Structure
```
bin/
├── gsd                    # Launcher script (reads config, launches Claude)
src/
├── config/
│   ├── ConfigLoader.js    # Load, parse, validate config
│   ├── ConfigSchema.js    # JSON schema definition
│   └── ConfigWatcher.js   # Hot reload implementation
└── launcher/
    └── ClaudeLauncher.js  # Construct Claude CLI command
```

### Pattern 1: Config Loading with Fallback Hierarchy
**What:** Load config from multiple sources with precedence
**When to use:** Always - supports project overrides and env vars
**Example:**
```javascript
// Source: Node.js best practices
class ConfigLoader {
  static load() {
    // Precedence: ENV > project > global > defaults
    const configPath =
      process.env.GSD_CONFIG_PATH ||
      this.findProjectConfig() ||
      path.join(os.homedir(), '.gsd', 'config.json');

    if (!fs.existsSync(configPath)) {
      return this.createDefaults(configPath);
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON5.parse(raw);
    return this.validate(parsed);
  }
}
```

### Pattern 2: Tilde Expansion (Cross-Platform)
**What:** Expand `~/.gsd/config.json` to actual home directory
**When to use:** ANY time user provides paths with `~`
**Example:**
```javascript
// Source: https://github.com/nodejs/node/issues/684
// Node.js does NOT natively support tilde expansion
function expandTilde(filePath) {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}
```

### Pattern 3: Hot Reload with Debouncing
**What:** Detect config changes and reload without restart
**When to use:** Improves UX - user edits config, sees immediate effect
**Example:**
```javascript
// Source: https://github.com/paulmillr/chokidar
const fs = require('fs');

class ConfigWatcher {
  watch(configPath, onReload) {
    let timeout;

    fs.watch(configPath, (eventType) => {
      if (eventType !== 'change') return;

      // Debounce: wait 100ms after last change
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        try {
          const newConfig = ConfigLoader.load();
          onReload(newConfig);
        } catch (err) {
          console.error('Config reload failed:', err.message);
          // Keep old config on error
        }
      }, 100);
    });
  }
}
```

### Pattern 4: Schema Validation with Clear Errors
**What:** Validate config structure and types, provide helpful error messages
**When to use:** ALWAYS - catches typos like `autcompact` instead of `autocompact`
**Example:**
```javascript
// Source: https://betterstack.com/community/guides/scaling-nodejs/ajv-validation/
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

const schema = {
  type: 'object',
  properties: {
    version: { type: 'number', const: 1 },
    working_context: { type: 'number', minimum: 10000, maximum: 180000 },
    chrome: { type: 'boolean' },
    dangerous_skip_permissions: { type: 'boolean' }
  },
  required: ['version', 'working_context'],
  additionalProperties: false  // Reject unknown keys
};

const validate = ajv.compile(schema);

function validateConfig(config) {
  if (!validate(config)) {
    const errors = validate.errors.map(e =>
      `${e.instancePath}: ${e.message}`
    ).join(', ');
    throw new Error(`Invalid config: ${errors}`);
  }
  return config;
}
```

### Anti-Patterns to Avoid

- **Silently ignoring unknown config keys:** User typos go unnoticed. MUST reject with error.
- **Using environment variables for complex config:** Env vars don't support structured data well. Use config file.
- **Hardcoding paths instead of os.homedir():** Breaks cross-platform. Always use `os.homedir()`.
- **Polling for file changes:** Wastes CPU. Use `fs.watch` event-based watching.
- **Allowing JSON comments in regular JSON:** Use JSON5 parser. Native `JSON.parse()` fails on comments.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON with comments | Custom comment stripper | json5 library | Edge cases (nested comments, strings containing //, etc.). Battle-tested. |
| Schema validation | Manual if/else checks | ajv or zod | Standard error messages, type coercion, nested validation. |
| File watching | setInterval() polling | fs.watch or chokidar | Events beat polling. Handle rename, move, delete properly. |
| Path expansion | String replace for ~ | os.homedir() + path.join() | Cross-platform (Windows has no ~). Handles edge cases. |
| Config defaults | Object.assign() | Structured merge with precedence | Deep merge, array handling, type preservation. |

**Key insight:** Configuration management has many edge cases (cross-platform paths, validation error messages, file watching race conditions, JSON parsing edge cases). Use mature libraries that have solved these problems over years in production.

## Common Pitfalls

### Pitfall 1: Assuming Claude Code Has --autocompact Flag
**What goes wrong:** Attempting to pass `--autocompact 100000` to Claude Code fails silently or with error
**Why it happens:** As of 2026, Claude Code has NO `--autocompact` CLI flag ([GitHub Issue #18085](https://github.com/anthropics/claude-code/issues/18085))
**How to avoid:**
- Option 1: Use environment variable `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` (if supported - needs verification)
- Option 2: Use `--settings` flag with JSON containing autocompact config
- Option 3: Modify settings.json before launch (invasive, not recommended)
- **Current GSD approach:** Sets `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` env var (see bin/gsd line 114)
**Warning signs:** User reports "autocompact not working" or "context fills up despite config"

### Pitfall 2: JSON5.parse() on Invalid JSON5
**What goes wrong:** Config file with syntax error crashes the entire launcher
**Why it happens:** JSON5.parse() throws on invalid syntax, no graceful handling
**How to avoid:**
```javascript
try {
  const config = JSON5.parse(raw);
  return validateConfig(config);
} catch (err) {
  if (err.message.includes('JSON5')) {
    throw new Error(`Config syntax error in ${configPath}: ${err.message}`);
  }
  throw new Error(`Config validation failed: ${err.message}`);
}
```
**Warning signs:** Error messages like "Unexpected token" without context of which file

### Pitfall 3: Race Condition on Config Hot Reload
**What goes wrong:** File watcher fires multiple times for single save, config reloads multiple times
**Why it happens:** Some editors trigger multiple fs events (write, chmod, rename)
**How to avoid:** Debounce with 100-200ms timeout (see Pattern 3 above)
**Warning signs:** Console shows "Config reloaded" 3+ times for single save

### Pitfall 4: Forgetting additionalProperties: false in Schema
**What goes wrong:** User typos `autcompact` instead of `autocompact`, no error, silently ignored
**Why it happens:** JSON schema allows unknown properties by default
**How to avoid:** Set `additionalProperties: false` in root schema object
**Warning signs:** User reports "config not working" but file looks correct (has typo in key name)

### Pitfall 5: Not Validating Numeric Ranges
**What goes wrong:** User sets `working_context: 1000000` (1 million tokens), exceeds Claude's 200k limit
**Why it happens:** No bounds checking on numeric values
**How to avoid:** Define `minimum` and `maximum` in schema for all numeric fields
**Warning signs:** Unexpected behavior at extreme values, launcher passes nonsensical values to Claude

## Code Examples

Verified patterns from official sources:

### Loading JSON5 Config
```javascript
// Source: https://www.npmjs.com/package/json5
const JSON5 = require('json5');
const fs = require('fs');
const path = require('path');
const os = require('os');

function loadConfig() {
  const configPath = path.join(os.homedir(), '.gsd', 'config.json');

  // Auto-create with defaults if missing
  if (!fs.existsSync(configPath)) {
    const defaults = {
      version: 1,
      working_context: 100000,  // User's usable context
      chrome: false,
      dangerous_skip_permissions: false
    };

    fs.mkdirSync(path.dirname(configPath), { recursive: true });

    // Write with inline comments (JSON5 format)
    const content = `{
  // Config version (for future migrations)
  version: 1,

  // Your usable context in tokens (GSD adds buffer internally)
  working_context: 100000,

  // Enable Chrome browser integration
  chrome: false,

  // Skip permission prompts (dangerous - use with caution)
  dangerous_skip_permissions: false,
}`;
    fs.writeFileSync(configPath, content, 'utf8');
    console.log(`Created default config: ${configPath}`);

    return defaults;
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON5.parse(raw);
}
```

### File Watching with fs.watch
```javascript
// Source: https://nodejs.org/api/fs.html#fswatchfilename-options-listener
const fs = require('fs');

function watchConfig(configPath, onChange) {
  let debounceTimer;

  const watcher = fs.watch(configPath, (eventType, filename) => {
    if (eventType !== 'change') return;

    // Debounce: wait 200ms after last change
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        const newConfig = loadConfig();
        onChange(newConfig);
        console.log('Config reloaded:', configPath);
      } catch (err) {
        console.error('Failed to reload config:', err.message);
        // Don't crash - keep using old config
      }
    }, 200);
  });

  return () => watcher.close();  // Cleanup function
}
```

### Schema Validation with Ajv
```javascript
// Source: https://betterstack.com/community/guides/scaling-nodejs/ajv-validation/
const Ajv = require('ajv');
const ajv = new Ajv({
  allErrors: true,      // Show all errors, not just first
  useDefaults: true,    // Apply default values from schema
  coerceTypes: false    // Don't auto-convert types (strict)
});

const configSchema = {
  type: 'object',
  properties: {
    version: {
      type: 'number',
      const: 1,
      description: 'Config format version'
    },
    working_context: {
      type: 'number',
      minimum: 10000,   // Minimum 10k tokens
      maximum: 180000,  // Maximum 180k (leave room for 20k buffer)
      description: 'User usable context in tokens'
    },
    chrome: {
      type: 'boolean',
      default: false,
      description: 'Enable Chrome browser integration'
    },
    dangerous_skip_permissions: {
      type: 'boolean',
      default: false,
      description: 'Skip all permission prompts'
    }
  },
  required: ['version', 'working_context'],
  additionalProperties: false  // CRITICAL: reject unknown keys
};

const validate = ajv.compile(configSchema);

function validateConfig(config) {
  if (!validate(config)) {
    const errors = validate.errors.map(err => {
      if (err.keyword === 'additionalProperties') {
        return `Unknown config key: "${err.params.additionalProperty}"`;
      }
      return `${err.instancePath || 'config'}: ${err.message}`;
    }).join('\n  ');

    throw new Error(`Invalid config:\n  ${errors}`);
  }

  return config;
}
```

### Building Claude CLI Command
```javascript
// Source: Current GSD bin/gsd script (line 88-120)
function buildClaudeCommand(config, args) {
  const flags = [];

  // Context management (no native --autocompact flag exists)
  // Instead, set environment variable (if Claude respects it)
  const autocompactBuffer = 20000;  // Reserve 20k for compaction process
  const autocompactThreshold = config.working_context + autocompactBuffer;
  process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE =
    Math.round((autocompactThreshold / 200000) * 100);  // As percentage

  // Browser integration
  if (config.chrome) {
    flags.push('--chrome');
  }

  // Permission handling
  if (config.dangerous_skip_permissions) {
    flags.push('--dangerously-skip-permissions');
  }

  // Construct command
  return ['claude', ...flags, ...args];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded autocompact threshold | Configurable threshold | 2024-2025 | Users can optimize for their workflow (smaller for chat, larger for code gen) |
| JSON config files | JSON5 config files | 2020-present | Comments in config files improve maintainability |
| fs.watchFile (polling) | fs.watch (event-based) | Node.js v19.1+ (2022) | Better performance, lower CPU usage |
| Manual config validation | Schema validation (ajv/zod) | Industry standard | Catches errors earlier, better error messages |

**Deprecated/outdated:**
- `fs.watchFile` with polling: Use `fs.watch` instead (event-based, more efficient)
- Plain JSON for config: Use JSON5 for human-friendly config files
- Environment variables for structured config: Use config files (better for complex structures)

## Open Questions

Things that couldn't be fully resolved:

1. **Claude Code Autocompact Environment Variable**
   - What we know: Current bin/gsd sets `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` (line 114)
   - What's unclear: Is this variable actually respected by Claude Code? Official docs don't mention it.
   - Recommendation: Test empirically OR investigate Claude Code source OR use `--settings` flag with autocompact config

2. **Autocompact Buffer Calculation**
   - What we know: Claude reserves ~20-45k tokens for compaction process ([Issue #10266](https://github.com/anthropics/claude-code/issues/10266))
   - What's unclear: Exact formula. Is it 20k fixed, 22.5% of window, or dynamic?
   - Recommendation: Use conservative 20k buffer. Document as "subject to Claude Code internals"

3. **Config Change Notification Format**
   - What we know: Should notify user when config reloads
   - What's unclear: Show changed values ("working_context 100000 -> 80000") or just confirmation?
   - Recommendation: Show what changed (better UX). Keep previous config for comparison.

4. **Project-Level Config Override Behavior**
   - What we know: Should support `.gsd/config.json` in project root (per CONTEXT.md decision)
   - What's unclear: Full override or merge with global config? Which fields mergeable?
   - Recommendation: Simple override (project config completely replaces global). Simpler mental model.

## Sources

### Primary (HIGH confidence)
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference) - Official documentation of all CLI flags
- [json5 npm package](https://www.npmjs.com/package/json5) - 65M+ weekly downloads, JSON5 standard implementation
- [Node.js fs.watch API](https://nodejs.org/api/fs.html#fswatchfilename-options-listener) - Official Node.js file watching documentation
- [Ajv JSON Schema Validator](https://betterstack.com/community/guides/scaling-nodejs/ajv-validation/) - Best practices for JSON schema validation

### Secondary (MEDIUM confidence)
- [GitHub Issue #18085](https://github.com/anthropics/claude-code/issues/18085) - Feature request for --autocompact CLI flag (confirms it doesn't exist)
- [GitHub Issue #10266](https://github.com/anthropics/claude-code/issues/10266) - Context window autocompact buffer behavior
- [Chokidar npm package](https://www.npmjs.com/package/chokidar) - File watching library comparison
- [AJV vs Joi vs Zod comparison](https://www.bitovi.com/blog/comparing-schema-validation-libraries-ajv-joi-yup-and-zod) - Schema validation library comparison

### Tertiary (LOW confidence)
- WebSearch results for "Claude Code autocompact 2026" - Community reports on autocompact trigger thresholds (78% usage)
- Node.js tilde expansion discussions - No native support, must use os.homedir()

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - json5, fs.watch, ajv/zod are all production-proven, widely used
- Architecture: HIGH - Patterns verified against official docs and current GSD implementation
- Pitfalls: MEDIUM - Based on common config management issues, but Claude-specific autocompact behavior needs empirical testing

**Research date:** 2026-01-29
**Valid until:** 2026-03-31 (60 days - stable domain, but Claude Code may add native --autocompact flag)

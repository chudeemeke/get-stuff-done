# Overlay Architecture Design

**Date:** 2026-03-28
**Status:** Draft
**Author:** Chude Emeke
**Project:** @chude/get-stuff-done (fork of get-shit-done-cc by TACHES)

## Problem Statement

The fork has diverged 569 commits and 10 minor versions behind upstream (v1.20.5 -> v1.30.0). Direct-edit fork architecture makes syncing progressively harder: each update requires cherry-picking hundreds of commits through merge conflicts in files both sides have modified. The fork's unique value (~2,150 lines of additive code) is entangled with upstream code that has been simplified, stripped, or modified in place.

The fork needs upstream's ongoing improvements (new runtimes, security hardening, workflow features, bug fixes) without the maintenance treadmill of manual sync operations.

## Solution

An overlay/skin architecture inspired by Android OEM customisation (Samsung One UI, OnePlus OxygenOS). Upstream becomes an untouched npm dependency. Fork-specific code layers on top through a composition pipeline. The composed output is what gets installed.

**Key principle:** Upstream files never exist in the fork's repository. They live in `node_modules/` only. Fork code lives in `overlay/`. The installer composes both into the final output.

## Architecture Overview

### Dependency Model

Upstream is consumed as an npm dependency:

```json
{
  "name": "@chude/get-stuff-done",
  "dependencies": {
    "get-shit-done-cc": "^1.30.0"
  }
}
```

- Installed via `bun add get-shit-done-cc@1.30.0`
- Updated via `bun update get-shit-done-cc`
- Pinned in `bun.lock`
- Upstream files available at `node_modules/get-shit-done-cc/`

End users install via `bunx @chude/get-stuff-done --claude --global`. The upstream dependency is internal -- users never interact with it directly.

### Package Structure

```
@chude/get-stuff-done/
  package.json                    # declares get-shit-done-cc dependency
  bun.lock
  bunfig.toml

  bin/
    install.js                    # overlay-aware installer (the composer)
    gsd.js                        # cross-platform launcher

  overlay/
    branding.json                 # name/URL substitution rules
    features.json                 # enable/disable upstream features
    lib/
      sync.cjs                    # upstream sync safety tooling
    src/
      config/                     # config enhancements (wraps upstream)
        ConfigLoader.js
        ConfigSchema.js
        schema.js
      platform/                   # cross-platform detection
        detect.js
        paths.js
        terminal.js
      theme/                      # ANSI design token system
        index.js
        tokens.js
      validation/                 # git-ops input validation
        index.js
    hooks/
      pre-compact.js
      pre-compact.sh
    workflows/                    # fork-specific workflows
      upstream-sync.md
    commands/                     # fork-specific commands
      gsd/
        upstream.md
    agents/                       # fork-specific agents (if any)

  overrides/                      # explicit upstream module replacements
    .gitkeep                      # empty by default

  assets/                         # branded SVGs, PNGs, favicons

  config/
    default-config.json
    gsd-config.schema.json

  scripts/
    compose.js                    # dev-time composition: upstream + overlay -> dist/
    check-boundary.js             # CI: verify no upstream files in repo
    check-overrides.js            # CI: verify override reasons exist, flag stale overrides

  tests/                          # fork-specific tests only
    sync.test.cjs
    platform.test.js
    theme.test.js
    validation.test.js
    launcher.test.js
    hooks.test.js
    installer.test.js
    branding.test.js
    features.test.js
    overrides.test.js
    compose.test.js
    update-preview.test.js
    integration/
      upstream-compat.test.js

  dist/                           # composed output (gitignored)
    get-stuff-done/

  .planning/                      # GSD planning state
```

### Structural Rules

1. `overlay/` contains fork-specific code only. Everything here is additive or wraps upstream modules.
2. `overrides/` contains explicit upstream module replacements. Each file requires a companion REASON.md.
3. `dist/` is the composed output. Gitignored. Built by `compose.js`. This is what ships in the npm package.
4. Upstream files never exist in the repository outside of `node_modules/`.
5. `node_modules/` is gitignored and regenerated via `bun install`.

## Composition Pipeline

The core mechanism. Runs in two contexts:

- **Dev-time** (`bun run compose`): Builds `dist/` for inspection and testing.
- **Install-time** (`bunx @chude/get-stuff-done`): Same logic, writes to user's config directory.

### Five Stages

**Stage 1: RESOLVE**
- Read upstream file manifest from `node_modules/get-shit-done-cc/`
- Validate upstream directory structure matches expected layout [automated]
- Load `overlay/branding.json`
- Load `overlay/features.json`
- Scan `overrides/` directory

**Stage 2: FILTER**
- For each upstream file, check `features.json`
- Disabled features are excluded from the composition queue
- New upstream files not mentioned in features.json are included by default (opt-out model)

**Stage 3: OVERRIDE**
- For each file in the composition queue, check `overrides/`
- If an override exists, use it instead of the upstream file
- If no override, use upstream file as-is

**Stage 4: BRAND**
- Apply `branding.json` substitutions to all text files in the queue
- Use word-boundary matching to prevent partial-word replacements
- Binary files (images, etc.) are skipped
- Files in `overlay/` are skipped (already fork-branded)
- Files in `overrides/` are skipped (already fork-owned)

**Stage 5: MERGE**
- Write branded upstream files to output directory
- Copy `overlay/` files to output directory (additive)
- Copy `assets/` to output directory
- Write `.install-meta.json` audit trail

### Conflict Resolution

| Situation | Resolution |
|---|---|
| File in upstream AND overlay (same path) | Error: "collision detected -- move to overrides/ if intentional" |
| File in upstream AND overrides | Override wins (explicit replacement) |
| File in overlay AND overrides | Error: should not happen (overlay is new files, overrides replace upstream) |
| File in upstream but disabled in features.json | Excluded from output |
| New upstream file not in features.json | Included by default |

### Audit Trail

Every composition writes `.install-meta.json`:

```json
{
  "upstream_version": "1.30.0",
  "overlay_version": "3.0.0",
  "composed_at": "2026-03-28T14:00:00Z",
  "features_disabled": [],
  "overrides_applied": [],
  "branding_rules_applied": 4
}
```

## Branding System

`overlay/branding.json` defines all name/URL substitutions as data.

```json
{
  "substitutions": [
    {
      "from": "get-shit-done",
      "to": "get-stuff-done",
      "scope": "all",
      "note": "Directory names, package references, path strings"
    },
    {
      "from": "get-shit-done-cc",
      "to": "@chude/get-stuff-done",
      "scope": "text",
      "note": "npm package name in docs, help text, install examples"
    },
    {
      "from": "glittercowboy/get-shit-done",
      "to": "chudeemeke/get-stuff-done",
      "scope": "text",
      "note": "GitHub repo references"
    },
    {
      "from": "TACHES",
      "to": "Chude Emeke",
      "scope": "text",
      "note": "Author attribution in visible surfaces"
    }
  ],
  "preserveUpstreamCredit": true,
  "scope_rules": {
    "all": "Apply to file paths, directory names, and file contents",
    "text": "Apply to file contents only, not paths or filenames",
    "filename": "Apply to filenames only, not contents"
  }
}
```

### Scope Behaviour

- `"all"`: Directory rename (`get-shit-done/` -> `get-stuff-done/`) in paths AND text content.
- `"text"`: Package name, repo URL, author. File contents only.
- `"filename"`: File rename only. (Unused currently but available.)

### What Branding Does Not Touch

- Binary files (PNGs, etc.)
- Files in `overlay/` (already fork-owned)
- Files in `overrides/` (already fork-owned)
- LICENSE file when `preserveUpstreamCredit: true`
- `.git/` internals

### Substitution Safety

Substitutions use word-boundary matching, not naive string.replace(). This prevents:
- `"get-shit-done"` matching inside longer strings like `"forget-shit-done-callback"`
- Partial matches corrupting code identifiers

Branding tests (`tests/branding.test.js`) verify composed output runs correctly after substitution. [automated]

## Feature Flags System

`overlay/features.json` controls what upstream features make it into the composed output.

```json
{
  "runtimes": {
    "claude": true,
    "opencode": true,
    "gemini": true,
    "codex": true,
    "copilot": true,
    "antigravity": true,
    "cursor": true,
    "windsurf": true
  },
  "workflows": {
    "enabled": "all",
    "exclude": []
  },
  "commands": {
    "enabled": "all",
    "exclude": []
  },
  "agents": {
    "enabled": "all",
    "exclude": []
  },
  "hooks": {
    "enabled": "all",
    "exclude": []
  },
  "sdk": true
}
```

### Filtering by File Type

| Type | Mechanism | Effect of disabling |
|---|---|---|
| Runtimes | `runtimes.<name>: false` | Conversion functions excluded, CLI flag removed from help, interactive prompt hides option |
| Workflows | `workflows.exclude: ["name"]` | Workflow .md file excluded from output |
| Commands | `commands.exclude: ["name"]` | Command .md file excluded from output |
| Agents | `agents.exclude: ["name"]` | Agent .md file excluded from output |
| Hooks | `hooks.exclude: ["name"]` | Hook .js file excluded from output |
| SDK | `sdk: false` | Entire sdk/ directory excluded |

### Runtime Filtering

Disabling a runtime is more than excluding a file. Runtime support is woven through `install.js`:
- Conversion functions (e.g., `convertGeminiToolName`)
- CLI flag parsing and help text
- Interactive prompt options
- Config directory resolution

The compose step processes `install.js` with conditional blocks keyed by runtime flags.

### Default Philosophy

Everything enabled by default. New upstream additions appear automatically. Disable explicitly when unwanted. This minimises maintenance: you only act when something is wrong, not for every upstream addition.

### New Feature Detection

When upstream adds a new workflow, command, agent, or hook, it appears in the composed output automatically because it's not in any `exclude` list. The `preview-update` command (Section: Update Workflow) flags new additions so you can review and exclude if desired before upgrading.

## Override System

`overrides/` is the escape hatch for replacing upstream modules with fork-specific versions.

### Rules

1. **Every override requires a companion REASON.md.** CI check (`scripts/check-overrides.js`) fails without it. [automated]

2. **REASON.md format:**
```markdown
# Override: lib/config.cjs

## Why
[Specific technical reason this upstream module needs replacement]

## Upstream version at time of override
v1.30.0 (commit abc1234)

## What's different
[Bullet list of changes]

## Review trigger
When upstream config.cjs changes, review whether their changes
make this override unnecessary.
```

3. **Stale override detection.** On upstream update, `scripts/check-overrides.js` compares the upstream version recorded in REASON.md against the current upstream version. If the underlying upstream file changed, it reports: [automated]
```
Override review needed:
  lib/config.cjs -- upstream changed since override was written
    Override based on: v1.30.0
    Upstream now: v1.32.0 (config.cjs modified in v1.31.0)
    Action: review upstream changes, update or remove override
```

4. **Goal is zero overrides.** Each is technical debt. Prefer wrappers in `overlay/` that extend upstream modules over full replacements.

### Day-One State

No overrides. Config enhancements and validation additions are implemented as wrappers in `overlay/src/` that import and extend upstream modules, not replace them.

## Installer Architecture

`bin/install.js` is the most important component. It replaces the current installer entirely.

### Two Modes

**Compose mode** (dev-time):
```bash
bun run compose                    # builds dist/
bun run compose --dry-run          # preview without writing
bun run compose --diff             # show changes since last composition
```

**Install mode** (user-facing):
```bash
bunx @chude/get-stuff-done --claude --global
```

### Structure (five sections in a single file)

**Section 1: RESOLVE** -- Locate upstream files, load branding/features/overrides config.

**Section 2: COMPOSE** -- Execute the five-stage pipeline (filter, override, brand, merge).

**Section 3: INSTALL** -- Parse CLI flags. Delegate to upstream's install logic operating on composed files. Write `.install-meta.json`.

**Section 4: UNINSTALL** -- Same as upstream's uninstall, aware of overlay additions.

**Section 5: UPDATE CHECK** -- Compare installed `.install-meta.json` against current package version.

### Critical Design Decision: Delegate to Upstream Install Logic

The installer does NOT reimplement runtime-specific installation. Upstream's `install.js` handles:
- Claude Code settings.json manipulation
- Gemini hook event conversion
- Codex TOML config management
- Copilot instructions injection
- Windsurf/Cursor/Antigravity config
- Permission grants and hook registration

This logic is 5,000+ lines and growing. The overlay installer:
1. Composes the file set (branding + features + overrides + additions)
2. Delegates actual installation to upstream's logic operating on composed files

When upstream adds runtime support or fixes install bugs, the overlay gets those fixes automatically.

### What the Installer Does NOT Do

- Parse Codex TOML configs
- Manipulate Claude Code settings.json directly
- Handle Gemini hook event conversion
- Register Copilot instructions
- Any runtime-specific installation detail

All of that remains in upstream's code.

## Update Workflow

### Standard Update Process

```bash
# 1. Check what's available
bun outdated

# 2. Preview changes (uses sync.cjs)
bun run preview-update

# 3. Upgrade
bun update get-shit-done-cc

# 4. Recompose
bun run compose

# 5. Test
bun test                           # fork-specific tests
bun run test:upstream-compat       # upstream tests against composed output

# 6. Publish
aidev release patch
aidev publish
```

### Preview-Update Output

`bun run preview-update` uses `sync.cjs` to diff current vs latest upstream:

```
Upstream update: get-shit-done-cc 1.30.0 -> 1.32.0

New files (12):
  + workflows/forensics.md
  + agents/gsd-advisor-researcher.md
  ...

Changed files (8):
  ~ bin/lib/core.cjs          (+45 -12)
  ~ bin/install.js            (+180 -40)
  ...

Removed files (0):
  (none)

Override impact:
  No overrides affected.

Supply chain scan:
  No suspicious patterns detected.
```

### Override Review on Update

When upstream changes a file that has an override in `overrides/`:
1. `preview-update` flags it [automated]
2. Developer diffs override against new upstream version [manual]
3. Three choices: update override, drop override, keep as-is [manual]

### Rollback

```bash
bun add get-shit-done-cc@1.30.0    # pin to previous version
bun run compose                     # recompose with old upstream
```

## Testing Strategy

### Suite 1: Fork Tests (maintained by fork)

~12 test files covering fork-specific code:

| Test file | Coverage target |
|---|---|
| `sync.test.cjs` | sync.cjs: diff preview, checkpoints, supply chain scanning |
| `platform.test.js` | detect.js: OS, shell, terminal detection |
| `theme.test.js` | theme system: tokens, composition, dark/light |
| `validation.test.js` | git-ops validation: SHA, branch, remote URL |
| `launcher.test.js` | gsd.js: banner, state display, arg passthrough |
| `hooks.test.js` | pre-compact hook: context preservation |
| `installer.test.js` | composition logic: end-to-end pipeline |
| `branding.test.js` | branding substitutions produce correct output |
| `features.test.js` | feature flag filtering works correctly |
| `overrides.test.js` | override replacement and REASON.md enforcement |
| `compose.test.js` | full composition pipeline with real upstream |
| `update-preview.test.js` | sync.cjs integration with version diffing |

### Suite 2: Upstream Compatibility (maintained by upstream, run by fork)

```bash
bun run test:upstream-compat
```

Runs upstream's own test files against the composed `dist/` output. A branding-aware test adapter normalises package names before assertions to handle the `get-shit-done` -> `get-stuff-done` rename.

**What this catches:** Branding breaking code. Feature filtering removing dependencies. Overrides incompatible with upstream expectations.

**Initial setup note:** Upstream tests assert against `get-shit-done` paths. The test adapter must normalise these. Expect a setup phase to get the compat runner green on first integration.

### CI Pipeline

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    steps:
      - bun test                        # Suite 1: fork tests
      - bun run test:upstream-compat    # Suite 2: upstream compat
      - bun run check-boundary          # no upstream files in repo
      - bun run check-overrides         # override reasons exist, no stale
```

All four checks must pass on all three platforms.

## Migration Plan

### Branch Strategy

```
main (current)  -->  tag as v0.4.0-legacy
                -->  new branch: overlay-architecture
                -->  when tested and validated: becomes new main
```

### Phase 1: Scaffold

On `overlay-architecture` branch:
- Create directory structure
- Add `get-shit-done-cc@1.30.0` as dependency
- Create `branding.json`, `features.json`
- Create empty `overrides/`
- Write `scripts/compose.js`
- Write `scripts/check-boundary.js`, `scripts/check-overrides.js`

### Phase 2: Port Fork-Specific Code

Cherry-pick or copy unique code into `overlay/`:
- `sync.cjs` -> `overlay/lib/sync.cjs`
- `src/platform/*` -> `overlay/src/platform/`
- `src/theme/*` -> `overlay/src/theme/`
- `src/validation/*` -> `overlay/src/validation/`
- `hooks/pre-compact.*` -> `overlay/hooks/`
- `bin/gsd.js` -> `bin/gsd.js`
- `assets/*` -> `assets/`
- Fork-specific workflows and commands -> `overlay/workflows/`, `overlay/commands/`

Config and validation enhancements reimplemented as wrappers extending upstream modules. No overrides on day one.

### Phase 3: Build the Installer

New `bin/install.js` implementing composition + delegation architecture. This is the most significant new code.

### Phase 4: Port and Write Tests

- Copy fork-specific test files, update imports
- Write new composition tests (branding, features, overrides, pipeline)
- Set up upstream compatibility test runner with branding adapter
- Remove test files that tested upstream modules directly

### Phase 5: CI and Enforcement

- Update GitHub Actions for new test suites
- Add boundary check and override check
- Cross-platform matrix (macOS, Linux, Windows)

### Phase 6: Validate and Ship

- Full test suites pass on all platforms
- Manual UAT: install composed output, verify identical behaviour
- Tag current `main` as `v0.4.0-legacy`
- Merge `overlay-architecture` to `main`
- `aidev release major` (ships as v3.0.0)
- `aidev publish`

### What Carries Over

- Git history (same repo, same branch lineage)
- `.planning/` and all milestone history
- GitHub issues, stars, URL
- npm package name `@chude/get-stuff-done`

### What Does Not Carry Over

- Direct copies of upstream files (replaced by npm dependency)
- Tests for upstream modules (replaced by upstream compat runner)
- Stripped/modified upstream code (upstream's full versions restored via dependency)

### Version Numbering

Current npm version: 2.4.0. Overlay architecture ships as **v3.0.0** (semver major: internal architecture change, even though user-facing install experience is unchanged).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation | Enforcement |
|---|---|---|---|---|
| Upstream restructures directory layout | Low | High -- compose breaks | `compose.js` validates expected structure, fails fast with descriptive error | [automated] |
| Upstream renames exported functions | Medium | Medium -- wrappers break | Upstream compat tests catch immediately | [automated] |
| Branding substitution corrupts code | Medium | High -- silent breakage | Word-boundary matching + branding tests verify output runs | [automated] |
| Upstream drops a runtime | Very low | Low -- orphaned flag | `compose.js` warns about enabled runtimes not found in upstream | [automated] |
| Overlay file collides with new upstream file | Low | Medium -- ambiguous | Compose pipeline detects collision, errors with guidance | [automated] |
| Upstream tests incompatible with composed output | Medium | Medium -- compat fails | Branding-aware test adapter normalises names | [automated] |
| npm dependency disappears | Very low | Critical -- can't compose | `bun.lock` pins exact version; manual vendor as last resort | [manual] |

## Boundary Enforcement

The system prevents regression to a direct-edit fork through structural constraints:

1. **No upstream files to edit.** Upstream files exist only in `node_modules/`. Cannot accidentally modify them.
2. **Composition is the only path.** The installer reads from `node_modules/` and `overlay/`, composes output. Files placed elsewhere are ignored.
3. **CI boundary check.** `scripts/check-boundary.js` scans the repo for any file that also exists in `node_modules/get-shit-done-cc/` outside of `overrides/`. Fails the build if found. [automated]
4. **Overrides are explicit.** Creating an override requires a REASON.md. Stale overrides are flagged on upstream update. [automated]

## Fork-Specific Code Inventory

Code that lives in `overlay/` -- the fork's unique value:

| Module | Lines | Purpose | Upstream equivalent |
|---|---|---|---|
| `sync.cjs` | ~1,420 | Diff preview, checkpoints, supply chain scanning, conflict detection | None |
| `src/platform/detect.js` | ~200 | OS, shell, terminal, Node.js, git detection | `toPosixPath()` only |
| `src/platform/paths.js` | -- | Cross-platform path resolution | None |
| `src/platform/terminal.js` | -- | Terminal capability detection | None |
| `src/theme/index.js` | ~200 | ANSI style composition (Charm.sh pattern) | Hardcoded ANSI in install.js |
| `src/theme/tokens.js` | ~100 | Semantic design tokens, dark/light | None |
| `src/config/ConfigLoader.js` | ~150 | JSON5 loading, env overrides (wraps upstream) | Basic JSON in config.cjs |
| `src/validation/index.js` | ~150 | Git SHA, branch, remote URL validation | Path/shell/prompt validation in security.cjs |
| `bin/gsd.js` | ~210 | Cross-platform launcher with state display | None |
| `hooks/pre-compact.js` | ~80 | Context preservation on compaction | None |
| `workflows/upstream-sync.md` | -- | /gsd:upstream workflow | None |
| `commands/gsd/upstream.md` | -- | /gsd:upstream command | None |

**Total fork-specific code: ~2,510 lines**

All other code comes from upstream via the composition pipeline.

## Sync.cjs Role in Overlay Architecture

`sync.cjs` was originally built for cherry-pick sync operations. In the overlay model, its role shifts:

| Original purpose | New purpose |
|---|---|
| Cherry-pick commits from upstream remote | Preview upstream npm package updates |
| Git merge conflict detection | Override staleness detection |
| Supply chain scanning of git commits | Supply chain scanning of npm package contents |
| Checkpoint management for sync operations | Checkpoint management before upstream updates |

The module's capabilities (diff preview, supply chain scanning, checkpointing) remain valuable. The target changes from a git remote to `node_modules/`.

## Open Questions

1. **Upstream test adapter complexity.** The branding-aware adapter for running upstream tests against composed output is unproven. Complexity depends on how deeply upstream tests assert against package names and paths. Estimated: moderate effort, may require iterative refinement.

2. **Runtime filtering in install.js.** Disabling a runtime requires processing install.js as a template with conditional blocks. The implementation approach (AST manipulation vs. marker comments vs. runtime feature checks) needs to be determined during Phase 3.

3. **Upstream install.js delegation.** The exact mechanism for "run upstream's install logic on composed files" needs prototyping. Options: import upstream's install functions, monkey-patch file paths, or preprocess and eval. Each has trade-offs in maintainability and fragility.

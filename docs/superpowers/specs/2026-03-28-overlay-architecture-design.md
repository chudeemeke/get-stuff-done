# Overlay Architecture Design

**Date:** 2026-03-28
**Status:** Draft (post-QA review)
**Author:** Chude Emeke
**Project:** @chude/get-stuff-done (fork of get-shit-done-cc by TACHES)

## Problem Statement

The fork has diverged 569 commits and 10 minor versions behind upstream (v1.20.5 -> v1.30.0). Direct-edit fork architecture makes syncing progressively harder: each update requires cherry-picking hundreds of commits through merge conflicts in files both sides have modified. The fork's unique value (~2,510 lines of additive code) is entangled with upstream code that has been simplified, stripped, or modified in place.

The fork needs upstream's ongoing improvements (new runtimes, security hardening, workflow features, bug fixes) without the maintenance treadmill of manual sync operations.

## Solution

An overlay/skin architecture inspired by Android OEM customisation (Samsung One UI, OnePlus OxygenOS). Upstream becomes an untouched npm dependency. Fork-specific code layers on top through a composition pipeline. The composed output is what gets installed.

**Key principle:** Upstream files never exist in the fork's repository. They live in `node_modules/` only. Fork code lives in `overlay/`. The installer composes both into the final output.

**Branding principle:** Internal directory names and code paths remain unchanged from upstream (`get-shit-done/`). Only user-visible surfaces are branded (help text, docs, prompts, package name, repo URL). This matches how Android OEMs work: AOSP's internal package names are preserved, resources and surfaces are overlaid.

## Architecture Overview

### Dependency Model

Upstream is consumed as an npm **dev** dependency. Composition happens at publish time, not install time. The npm package ships pre-composed output.

```json
{
  "name": "@chude/get-stuff-done",
  "version": "3.0.0",
  "devDependencies": {
    "get-shit-done-cc": "1.30.0"
  }
}
```

- Exact version pinning (no caret) to prevent unreviewed updates
- Installed via `bun add -d get-shit-done-cc@1.30.0`
- Updated deliberately via `bun run preview-update` then `bun update get-shit-done-cc`
- Upstream files available at `node_modules/get-shit-done-cc/` during development
- Published npm package contains pre-composed output; end users never download upstream

End users install via `bunx @chude/get-stuff-done --claude --global`.

### Composition Timing

**Composition happens at publish time, not install time.**

```
Development:   node_modules/get-shit-done-cc/ + overlay/ --> compose --> dist/
Publishing:    dist/ is included in npm package files[]
User install:  bunx @chude/get-stuff-done runs dist/bin/install.js directly
```

This means:
- `get-shit-done-cc` is a devDependency (not needed by end users)
- `dist/` is gitignored but included in the npm package `files` array
- Users get a self-contained package with no transitive upstream dependency
- Composition bugs are caught before publishing, not on user machines

### Package Structure

```
@chude/get-stuff-done/
  package.json                    # devDependencies: { "get-shit-done-cc": "1.30.0" }
  bun.lock
  bunfig.toml

  bin/
    gsd.js                        # cross-platform launcher

  overlay/
    branding.json                 # name/URL substitution rules (user-visible surfaces only)
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

  dist/                           # composed output (gitignored, but in npm files[])
    get-shit-done/                # upstream internal name PRESERVED
    bin/
      install.js                  # upstream's install.js with surface branding applied
    overlay/                      # fork additions merged in

  .planning/                      # GSD planning state
```

### Structural Rules

1. `overlay/` contains fork-specific code only. Everything here is additive or wraps upstream modules.
2. `overrides/` contains explicit upstream module replacements. Each file requires a companion REASON.md.
3. `dist/` is the composed output. Gitignored but included in npm package `files[]`. Built by `scripts/compose.js` at publish time.
4. Upstream files never exist in the repository outside of `node_modules/`.
5. `node_modules/` is gitignored and regenerated via `bun install`.
6. Internal directory names from upstream (`get-shit-done/`) are preserved. Only user-visible text is branded.

## Composition Pipeline

The core mechanism. Runs at dev/publish time only (not on user machines).

```bash
bun run compose              # builds dist/
bun run compose --dry-run    # preview without writing
bun run compose --diff       # show changes since last composition
```

### Pipeline Stages

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
- **Runtime filtering is file-level only** (workflow/command/agent/hook exclusion). Runtime code within `install.js` is not filtered; all runtimes ship. See "Runtime Filtering" section.

**Stage 3: OVERRIDE**
- For each file in the composition queue, check `overrides/`
- If an override exists, use it instead of the upstream file
- If no override, use upstream file as-is

**Stage 4: BRAND**
- Apply `branding.json` substitutions to user-visible text surfaces only
- Target files: help text strings, README, docs, CLI output messages, comments
- **Do NOT brand**: code paths, directory names, import statements, config keys, regex patterns
- Binary files skipped
- Files in `overlay/` skipped (already fork-owned)
- Files in `overrides/` skipped (already fork-owned)

**Stage 5: MERGE**
- Write processed upstream files to `dist/`
- Copy `overlay/` files to `dist/` (additive)
- Copy `assets/` to `dist/`
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
  "branding_rules_applied": 3
}
```

## Branding System

`overlay/branding.json` defines user-visible substitutions as data. Internal code paths are NOT branded.

```json
{
  "substitutions": [
    {
      "from": "get-shit-done-cc",
      "to": "@chude/get-stuff-done",
      "scope": "text",
      "note": "npm package name in help text, install examples, docs"
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
  "preserveUpstreamCredit": true
}
```

### What Changed from Original Design

The original design had `"scope": "all"` which renamed internal directories (`get-shit-done/` -> `get-stuff-done/`). **This was removed.** Internal directory names match upstream exactly. Only user-facing text (`"scope": "text"`) is branded.

**Why:** Renaming internal paths requires rewriting every path reference in upstream's 5,000-line install.js, breaks upstream test compatibility, and contradicts how successful overlay systems work (Android preserves AOSP package names, overlays resources).

### What Branding Does Touch

- Help text and CLI output messages
- Documentation files (README, CONTRIBUTING, etc.)
- npm package name references in user-visible strings
- GitHub repo URL references
- Author attribution in visible surfaces

### What Branding Does NOT Touch

- Internal directory names (`get-shit-done/` preserved)
- Code paths and import statements
- Config keys and data structures
- Regex patterns in code
- Binary files
- Files in `overlay/` (already fork-owned)
- Files in `overrides/` (already fork-owned)
- LICENSE file (upstream credit preserved)

### preserveUpstreamCredit Behaviour

When `true` (default):
- LICENSE file is copied unmodified from upstream
- A `CREDITS.md` is added to the composed output attributing upstream: "Based on GSD by TACHES (https://github.com/glittercowboy/get-shit-done)"
- Author field in user-visible help text is branded to fork author

When `false`:
- LICENSE still copied (MIT requires it)
- No CREDITS.md added
- All visible attribution branded

### Substitution Safety

Substitutions use word-boundary matching and apply only to `"scope": "text"` targets. Since internal paths are not branded, the risk of corrupting code identifiers is eliminated.

Branding tests (`tests/branding.test.js`) verify:
- Correct strings are substituted in user-visible surfaces
- Internal code paths remain unchanged
- Composed output runs correctly after substitution
[automated]

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
| Workflows | `workflows.exclude: ["name"]` | Workflow .md file excluded from output |
| Commands | `commands.exclude: ["name"]` | Command .md file excluded from output |
| Agents | `agents.exclude: ["name"]` | Agent .md file excluded from output |
| Hooks | `hooks.exclude: ["name"]` | Hook .js file excluded from output |
| SDK | `sdk: false` | Entire sdk/ directory excluded |

### Runtime Filtering

**Runtime flags in features.json are NOT used for code filtering in v3.0.** All runtimes ship in the composed output. The runtime flags exist for documentation purposes and future use.

**Why:** Runtime support is woven through upstream's `install.js` (conversion functions, CLI flags, interactive prompts, config directory resolution). Filtering runtimes from a 5,000-line monolithic file requires AST manipulation or templating that upstream was not designed for. The cost of maintaining this filtering exceeds the benefit of excluding unused runtimes.

**User-facing effect:** Users choose runtimes at install time via flags (`--claude --global`). Unused runtimes are never installed -- they're just available as options. This matches upstream's behaviour exactly.

**Future:** If upstream modularises their installer (separate files per runtime), runtime filtering becomes file-level exclusion and can be enabled trivially.

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

### Delegation Mechanism

With surface-only branding, upstream's `install.js` runs nearly unmodified. The mechanism:

1. `scripts/compose.js` copies upstream's `install.js` to `dist/bin/install.js`
2. Applies text-only branding (package name in help strings, repo URLs in comments)
3. Internal paths (`get-shit-done/`, `__dirname` resolution, config paths) are untouched
4. The composed `install.js` operates on the composed file set in `dist/`

**This works because:** The composed output preserves upstream's expected directory layout (`get-shit-done/bin/`, `get-shit-done/workflows/`, etc.). The install.js uses `__dirname` and relative paths to find these files. Since the structure is identical, all path resolution works.

The overlay installer (`bin/install.js` in the package) is a thin wrapper:
1. Resolves the composed `dist/` directory
2. Invokes upstream's install.js (now in `dist/bin/install.js`) via `require()` or subprocess
3. After upstream install completes, copies overlay additions (fork hooks, fork commands, fork workflows) to the target directory
4. Writes `.install-meta.json`

### Compose Script

`scripts/compose.js` is the dev-time orchestrator. It is a separate file from the installer.

```bash
bun run compose              # compose upstream + overlay -> dist/
bun run compose --dry-run    # preview
bun run compose --diff       # delta since last compose
```

The installer imports shared utilities from compose.js but does NOT reimplement the pipeline. One implementation, two entry points.

### Installer Sections

**Section 1: PRE-INSTALL** -- Resolve dist/ directory, validate structure.

**Section 2: DELEGATE** -- Run upstream's install.js from dist/ with user's CLI flags.

**Section 3: OVERLAY** -- Copy fork-specific additions (overlay hooks, commands, workflows) to target.

**Section 4: META** -- Write `.install-meta.json`.

**Section 5: UNINSTALL** -- Remove both upstream and overlay files from target. Aware of overlay additions.

**Section 6: UPDATE CHECK** -- Compare installed `.install-meta.json` against current package version.

## Update Workflow

### Standard Update Process

```bash
# 1. Preview changes FIRST (includes supply chain scan)
bun run preview-update

# 2. Review the preview output, decide to proceed

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

**Important:** `preview-update` runs BEFORE `bun update`, not after. This ensures the supply chain scan happens before new upstream code enters your environment.

### Preview-Update Output

`bun run preview-update` uses `sync.cjs` to diff current pinned version vs latest upstream on npm:

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
bun add -d get-shit-done-cc@1.30.0    # pin to previous version
bun run compose                         # recompose with old upstream
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
| `branding.test.js` | branding substitutions: correct surfaces branded, internals untouched |
| `features.test.js` | feature flag filtering works correctly |
| `overrides.test.js` | override replacement and REASON.md enforcement |
| `compose.test.js` | full composition pipeline with real upstream |
| `update-preview.test.js` | sync.cjs integration with version diffing |

### Suite 2: Upstream Compatibility (maintained by upstream, run by fork)

```bash
bun run test:upstream-compat
```

Runs upstream's own test files against the composed `dist/` output. Since internal directory names are preserved (`get-shit-done/`), upstream tests should run with minimal adaptation. No branding adapter needed for path assertions.

**Remaining adaptation needed:** Upstream tests that assert against the npm package name (`get-shit-done-cc`) in user-visible output will need a thin adapter for the `@chude/get-stuff-done` substitution in those strings.

**Feasibility gate:** Before Phase 4 begins, categorise upstream's test assertions into: (a) path-based (no adaptation needed -- internal paths preserved), (b) package-name-based (adapter needed), (c) behavioural (no adaptation needed). If >30% of assertions need adaptation, reassess the approach.

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

### Phase 0: Prototype Installer Delegation

**Before any migration work begins**, validate the delegation mechanism:
1. Install `get-shit-done-cc@1.30.0` in a scratch directory
2. Copy its files preserving internal structure
3. Apply text-only branding to install.js (package name, URLs)
4. Run the branded install.js and verify it installs correctly
5. Verify overlay files can be copied to the target after upstream install completes

**This phase is a go/no-go gate.** If delegation doesn't work cleanly, the architecture needs revision before proceeding.

### Phase 1: Scaffold

On `overlay-architecture` branch:
- Create directory structure
- Add `get-shit-done-cc@1.30.0` as devDependency (exact version, no caret)
- Create `branding.json` (text-only), `features.json`
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

New `bin/install.js` implementing delegation architecture. Compose script as the shared pipeline.

### Phase 4: Port and Write Tests

- Copy fork-specific test files, update imports
- Write new composition tests (branding, features, overrides, pipeline)
- Categorise upstream test assertions (feasibility gate for compat runner)
- Set up upstream compatibility test runner
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

### Existing User Upgrade Path

Users upgrading from v2.x to v3.0:

1. **v3.0 installer detects v2.x artifacts.** Checks for `.install-meta.json` with overlay_version < 3.0 or missing overlay_version field. If found, runs cleanup of v2.x-specific files before installing v3.0.
2. **Uninstall covers both versions.** `bunx @chude/get-stuff-done --uninstall` removes both v2.x and v3.0 artifacts.
3. **Documentation.** CHANGELOG and README note the architecture change and any manual steps needed.
4. **Rollback path.** If v3.0 has issues, users can install the legacy version: `bunx @chude/get-stuff-done@2.4.0 --claude --global`. The `v0.4.0-legacy` tag preserves the old codebase.

### What Carries Over

- Git history (same repo, same branch lineage)
- `.planning/` and all milestone history
- GitHub issues, stars, URL
- npm package name `@chude/get-stuff-done`

### What Does Not Carry Over

- Direct copies of upstream files (replaced by npm devDependency)
- Tests for upstream modules (replaced by upstream compat runner)
- Stripped/modified upstream code (upstream's full versions restored via dependency)

### Version Numbering

Current npm version: 2.4.0. Overlay architecture ships as **v3.0.0** (semver major: internal architecture change, even though user-facing install experience is unchanged).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation | Enforcement |
|---|---|---|---|---|
| Upstream restructures directory layout | Low | High -- compose breaks | `compose.js` validates expected structure, fails fast with descriptive error | [automated] |
| Upstream renames exported functions | Medium | Medium -- wrappers break | Upstream compat tests catch immediately | [automated] |
| Branding substitution corrupts code | Low (text-only scope) | Medium | Branding limited to user-visible text; branding tests verify internals untouched | [automated] |
| Upstream drops a runtime | Very low | Low -- orphaned flag | `compose.js` warns about enabled runtimes not found in upstream | [automated] |
| Overlay file collides with new upstream file | Low | Medium -- ambiguous | Compose pipeline detects collision, errors with guidance | [automated] |
| Upstream tests incompatible with composed output | Low (internal paths preserved) | Medium -- compat fails | Thin adapter for package-name strings only; feasibility gate in Phase 4 | [automated] |
| npm dependency disappears | Very low | Critical -- can't compose | Exact version pinning in devDependencies; manual vendor as last resort | [manual] |
| Upstream renames npm package | Very low | High -- dependency breaks | Pin exact version; lockfile preserves; vendor last known good | [manual] |
| v3.0 ships broken for end users | Low | High -- trust damage | Phase 0 prototype gate, full CI, manual UAT, legacy version available at v2.4.0 | [manual] |
| Existing v2.x users upgrade and break | Medium | Medium -- orphaned files | v3.0 installer detects and cleans v2.x artifacts; documented rollback path | [automated] |

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

## Resolved Design Decisions

Decisions made during design review that shaped the final architecture:

1. **Surface-only branding.** Internal paths preserve upstream naming. Eliminates install.js path rewriting, simplifies test compatibility, matches Android OEM overlay patterns.

2. **Publish-time composition.** `dist/` is pre-composed and shipped. Users never download upstream. `get-shit-done-cc` is a devDependency only.

3. **Exact version pinning.** No caret (`"1.30.0"` not `"^1.30.0"`). Updates are deliberate, reviewed via preview-update with supply chain scanning before upgrade.

4. **No runtime filtering in v3.0.** All runtimes ship. Users choose at install time. File-level filtering (workflows, commands, agents, hooks, SDK) works normally.

5. **Phase 0 prototype gate.** Installer delegation must be validated before migration begins.

6. **Upstream test feasibility gate.** Assertion categorisation in Phase 4 determines compat runner approach.

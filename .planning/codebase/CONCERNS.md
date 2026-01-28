# Codebase Concerns

**Analysis Date:** 2026-01-28

## Tech Debt

**Branding Inconsistency - Pervasive:**
- Issue: Fork renamed from "Get Shit Done" to "Get Stuff Done" but many references remain unchanged
- Files:
  - `package.json` (lines 27-32): Repository, homepage, bugs URLs point to `glittercowboy/get-shit-done`
  - `CHANGELOG.md` (lines 1058-1137): All version comparison URLs point to upstream
  - `CONTRIBUTING.md` (lines 174, 305): Clone/release instructions reference upstream repo
  - `README.md` (line 178): Development installation references upstream
  - `commands/gsd/update.md`: Update command references upstream
- Impact: Confusion for users; `npm publish` would claim wrong repo; contributors directed to wrong repository
- Fix approach: Create branding configuration file, run find-replace across all files, update package.json metadata

**Fork Synchronization Complexity:**
- Issue: The `.upstream/` directory contains a snapshot of the original repo, but there's no documented sync process
- Files: `.upstream/` (entire directory)
- Impact: As upstream evolves (v1.9.13+), fork will diverge without a clear merge strategy
- Fix approach: Document sync workflow in CONTRIBUTING.md; consider using git subtree or submodule; create sync script

**Dual Directory Confusion (get-shit-done vs get-stuff-done):**
- Issue: Core content lives in `get-stuff-done/` but upstream uses `get-shit-done/`; installer references `get-stuff-done`
- Files:
  - `get-stuff-done/` (renamed from upstream's `get-shit-done/`)
  - `bin/install.js` (line 895-903): References `get-stuff-done` folder
  - `.upstream/get-shit-done/` (original folder)
- Impact: Merging upstream changes requires renaming every sync; file path references break
- Fix approach: Either keep the rename consistent or find-replace all internal references

**package-lock.json Should Not Be Committed (with bun):**
- Issue: Project uses npm for publishing (`npm run build:hooks`), creating `package-lock.json`, but user prefers bun
- Files: `package-lock.json`, `package.json` (line 44)
- Impact: Lockfile mismatch if contributors use different package managers
- Fix approach: Convert build scripts to bun, remove package-lock.json, add to .gitignore

## Known Bugs

**Windows gsd Launcher (Bash Script):**
- Symptoms: `bin/gsd` is a bash script that won't execute natively on Windows CMD/PowerShell
- Files: `bin/gsd`
- Trigger: Running `gsd` on Windows without WSL or Git Bash
- Workaround: Use WSL or Git Bash; alternatively run `claude` directly with manual env setup

**Version Mismatch in Launcher:**
- Symptoms: `bin/gsd` displays "v2.0" (line 97) but `package.json` shows version "1.9.13"
- Files: `bin/gsd` (line 97), `package.json` (line 3)
- Trigger: Running `gsd` launcher shows incorrect version
- Workaround: None; cosmetic issue

## Security Considerations

**No Input Validation in Installer:**
- Risk: `bin/install.js` accepts `--config-dir` argument with minimal validation (only checks for empty/flag)
- Files: `bin/install.js` (lines 105-127)
- Current mitigation: User runs installer manually
- Recommendations: Add path sanitization; validate directory exists and is writable before operations

**Dangerous Permissions Mode Encouraged:**
- Risk: README strongly encourages `claude --dangerously-skip-permissions`
- Files: `README.md` (lines 188-196)
- Current mitigation: Warning tip provided; alternative documented
- Recommendations: Document risks more prominently; consider per-command permission grants

## Performance Bottlenecks

**Large Upstream Directory:**
- Problem: `.upstream/` contains full copy of original repo (~100+ files)
- Files: `.upstream/` (entire directory)
- Cause: Preserved for reference/comparison rather than using git history
- Improvement path: Replace with git subtree or document comparison via git remotes

## Fragile Areas

**OpenCode Compatibility Layer:**
- Files: `bin/install.js` (lines 229-428)
- Why fragile: Complex frontmatter conversion between Claude Code and OpenCode formats; color mappings, tool name translations
- Safe modification: Test thoroughly with both runtimes; consider adding unit tests for conversion functions
- Test coverage: None - pure functions could be tested

**Hook Registration:**
- Files: `bin/install.js` (lines 993-1028)
- Why fragile: Manual JSON manipulation of settings.json; orphan cleanup patterns hardcoded
- Safe modification: Add integration tests that install/uninstall and verify settings.json structure
- Test coverage: None

## Scaling Limits

**Single-User Design:**
- Current capacity: One user per project installation
- Limit: No multi-user conflict resolution in `.planning/` files
- Scaling path: Not a concern for intended solo-developer use case

## Dependencies at Risk

**esbuild as devDependency:**
- Risk: Low - stable, well-maintained bundler
- Impact: Build would fail without it
- Migration plan: N/A - appropriate choice

**Claude Code API Stability:**
- Risk: GSD depends heavily on Claude Code's slash command system, Task tool, and settings.json format
- Impact: Claude Code updates could break commands/agents/hooks
- Migration plan: Monitor Claude Code changelog; maintain `.upstream/` as fallback reference

## Missing Critical Features

**No Automated Testing:**
- Problem: Zero test files found in repository
- Blocks: Confident refactoring; CI/CD automation; contribution quality gates
- Priority: High - should add before significant changes

**No CI/CD Pipeline:**
- Problem: No `.github/workflows/` in fork (exists in `.upstream/.github/` but not adopted)
- Blocks: Automated testing on PR; version tagging automation
- Priority: Medium - add basic lint/test workflow

**No CLAUDE.md File:**
- Problem: Project lacks project-level CLAUDE.md for GSD-specific instructions
- Blocks: Claude Code users don't get GSD context when working on GSD itself
- Priority: Medium - add to enable dogfooding

**Incomplete Documentation for Fork:**
- Problem: Fork-specific changes not documented
- Files: No dedicated fork changelog or migration notes
- Blocks: Users understanding what changed from upstream
- Priority: Medium - create FORK-CHANGES.md or add section to README

## Test Coverage Gaps

**Entire Codebase Untested:**
- What's not tested: All JavaScript files (`bin/install.js`, `hooks/*.js`, `scripts/build-hooks.js`)
- Files: `bin/install.js`, `hooks/gsd-statusline.js`, `hooks/gsd-check-update.js`
- Risk: Installer bugs could corrupt user configurations; hook failures silent
- Priority: High - critical path code with no coverage

**No Markdown Lint:**
- What's not tested: 100+ markdown files with complex formatting
- Files: All `.md` files in `commands/`, `agents/`, `get-stuff-done/`
- Risk: Broken frontmatter, invalid YAML, link rot
- Priority: Low - markdown is fault-tolerant

## Documentation Gaps

**Installation Path Confusion:**
- README documents `npx get-stuff-done` but package is named `get-stuff-done` - npm may resolve to wrong package
- Files: `README.md` (lines 152-169)
- Risk: Users install wrong package or get confused by discrepancy

**Launcher Not in PATH:**
- README says to add `bin/` to PATH but `npx install` doesn't do this automatically
- Files: `README.md` (lines 119-128)
- Risk: Users expect `gsd` to work after npm install but it requires manual PATH modification

---

*Concerns audit: 2026-01-28*

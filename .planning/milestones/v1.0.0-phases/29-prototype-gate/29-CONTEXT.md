# Phase 29: Prototype Gate - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate that upstream's install.js can run from a composed directory with surface-only branding, and that overlay additions can layer on top -- before committing to the full overlay architecture. This is a go/no-go gate. No production code is written; this is a proof-of-concept.

</domain>

<decisions>
## Implementation Decisions

### Delegation mechanism
- Subprocess invocation, not require(). Run upstream's install.js via `child_process.execSync` with `stdio: 'inherit'` for TTY passthrough
- Upstream's install.js is copied into dist/bin/ with text-only branding applied
- Internal directory structure (get-shit-done/) preserved exactly -- upstream's __dirname resolution works because the relative layout is identical
- After upstream install completes, wrapper copies overlay additions (hooks, commands, workflows) to the target directory
- If upstream exits non-zero, fail fast -- do not copy overlay additions

### Interactive prompt handling
- TTY passthrough (`stdio: 'inherit'`) lets upstream's interactive menus work exactly as designed
- No interception or wrapping of upstream's readline prompts
- User sees upstream's UI directly; your wrapper is invisible during install

### Target directory resolution
- Infer target from flags + platform, using the same logic upstream uses (--global + --claude = ~/.claude/, etc.)
- Do not parse upstream's stdout to find the target path
- Each runtime maps to a known config directory; your wrapper maintains this mapping

### Prototype test environment
- Install to a temporary directory using HOME override: `{ env: { ...process.env, HOME: tmpDir } }`
- Must work cross-platform (Windows, macOS, Linux) -- not deferred to Phase 33
- On Windows, verify os.homedir() respects the HOME override; if not, use upstream's --config-dir flag as alternative
- Claude runtime only for prototype (proves the mechanism; other runtimes use the same codepath)
- Full content verification of installed files, not just existence checks
- Verify branding appears in user-visible text AND does not break installation

### Claude's Discretion
- Exact test script implementation (Node.js test runner, shell script, or manual)
- How to handle Windows os.homedir() if HOME override doesn't work (--config-dir is the suggested fallback)
- Whether to run the prototype as an automated test or a manual verification script

</decisions>

<specifics>
## Specific Ideas

- The prototype script should be reusable as the basis for installer.test.js in Phase 33
- Verification checklist should include: get-shit-done/ directory, workflows, agents, hooks, bin/lib/gsd-tools.cjs, settings.json hooks registered, overlay hook present, overlay command present
- Branding check: installed help text contains "@chude/get-stuff-done", not "get-shit-done-cc"

</specifics>

<go_no_go>
## Go/No-Go Criteria

### Hard no-go (kills the architecture):
1. Upstream install.js cannot run from composed dist/bin/ directory (__dirname resolution fails)
2. Surface-only text branding in install.js causes runtime errors during installation

### Acceptable:
- Cosmetic differences in interactive prompts (ANSI colors, menu rendering) as long as user can complete installation
- Minor shim needed in install.js (<50 lines) to fix path resolution -- this is standard overlay infrastructure
- Single documented override of install.js if needed, with REASON.md

### Threshold for "too much modification":
- <50 lines changed in install.js: healthy shim, proceed
- 50-200 lines: judgment call based on stability of changed code
- >200 lines: delegation model doesn't fit, architecture needs revision

### Functional correctness gate:
Can a user who has never seen upstream's installer successfully complete installation using the composed version? If yes, pass. If UX prevents completion, fail.

</go_no_go>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 29-prototype-gate*
*Context gathered: 2026-03-28*

# Pitfalls Research: v1.2.0 Ship-Ready Hardening

**Domain:** Ship-readiness hardening of a long-lived overlay fork (npm CLI tool, composition pipeline over upstream)
**Researched:** 2026-04-20
**Confidence:** HIGH for categories 1, 3, 4, 5, 8 (direct precedents in project memory + external sources); MEDIUM for 2, 6, 7 (external patterns, project-specific application is novel)

Focus: mistakes that would degrade the v1.2.0 milestone's "professional-grade market-ready" bar, prioritizing overlay/fork-specific failure modes over generic software pitfalls. Each pitfall is tagged with phase-to-address guidance for PLAN.md authors. Prior v0.2.0 hardening pitfalls (arbitrary code execution in cherry-pick, MINGW detection, non-interactive shell, symlink permissions) are already addressed in shipped code and are not re-listed here; this document covers pitfalls specific to the v1.2.0 hardening surface.

---

## Critical Pitfalls

### Pitfall 1: Upstream-scope misattribution ("upstream bug" when fork is the source)

**What goes wrong:**
Fork-specific behaviour is filed upstream as if it were upstream's responsibility. Time is spent waiting for an upstream fix that is never coming, the ticket is closed "not planned," and the fork looks amateurish to upstream maintainers. In this project's own history, three items in tech debt (including #1851 and two `_auto_chain_active` / `extractFrontmatterField` items) were labeled "upstream bug, awaiting fix" but all three turned out to be fork-specific -- documented in project memory as `feedback_verify_upstream_scope.md`.

**Why it happens:**
When the composed artifact misbehaves, the symptom is indistinguishable from an upstream symptom. The overlay layer is invisible at runtime, so "happens in Claude Code with upstream's file" feels like "happens in upstream." The feedback loop on upstream is cheap if the report is real, so there's a bias toward filing before fully verifying.

**How to avoid:**
Encode a "scope verification protocol" before ANY upstream issue is filed:
1. Reproduce against unmodified upstream (clone `get-shit-done-cc` directly, install it standalone, run the failing scenario).
2. Diff the composed file against the upstream source for the affected path. If `overrides/` or branding touches the file, scope is fork-first by default.
3. Grep the fork-specific overlay/ tree for the symptom's keyword before filing.
4. Require a "verified in upstream-only" checkbox in any oversight agent that proposes upstream-issue filing.

**Warning signs:**
- "I'll file it upstream and we can fix it later if they don't" -- the later half rarely happens; embarrassment lasts longer.
- Symptom only reproduces after `bun run install` (composition step) -- that's a fork-layer signal.
- Stack trace references paths inside `overlay/` or `overrides/` -- definitively fork.
- User's reaction to drafted issue text includes "wait, is this really upstream?" -- listen to that instinct.

**Phase to address:**
Process hardening phase (PROCESS-01..04). The `gsd-oversight-execution` agent must refuse to propose upstream issue filing without scope verification evidence in the proposal.

**Reference:** Project memory `feedback_verify_upstream_scope.md`; prior closed-not-planned upstream ticket #1851.

---

### Pitfall 2: Override staleness goes undetected until runtime break

**What goes wrong:**
Upstream renames, splits, or semantically changes a file we override. Our override's SHA-snapshot no longer matches anything upstream, but because the override already exists in `overrides/` the composition pipeline keeps applying our stale version. Users run code that has been silently diverging from upstream for months. The first signal is a runtime failure or a security alert that upstream fixed three versions ago but we're still shipping the old vulnerable version.

**Why it happens:**
SHA-snapshot systems (Debian quilt patches, Chromium patches, vcpkg portfiles) all share this failure mode: a patch/override is built against a specific source version, and "still applies cleanly" is only a proxy for "still semantically correct." When the upstream file is renamed or split, the override silently becomes orphaned -- it no longer overlays anything, but if the composition pipeline is permissive, it keeps shipping. Debian quilt's known issue with file renames producing huge, unnecessary patches is documented at debian-mentors.

**How to avoid:**
Make staleness a **blocking CI gate**, not informational. Three checks:
1. **Orphan check**: every file in `overrides/` must map to a real path in the current upstream snapshot. If upstream renames, CI fails until someone explicitly re-snapshots or deletes.
2. **SHA-drift check**: compute the upstream file's SHA, compare to the snapshot recorded in REASON.md. If drift > 0, CI fails with a diff summary.
3. **Semantic-drift sampling**: for overrides older than N upstream versions, emit a warning asking for review (not blocking, but visible). Chromium's `UPSTREAM:`/`BACKPORT:` tagging documents this practice.

Also: if an override's intent is "fix bug X," track upstream's issue for X. When upstream closes X, the override should be flagged for removal.

**Warning signs:**
- `overrides/` accumulates without anything ever being removed (overrides should have a lifecycle: add → maintain → remove when upstream adopts).
- REASON.md files are copy-pasted with only the filename changed.
- An override's "last verified against upstream" date is older than the last 3 upstream bumps.
- Grep check: `rg --files overrides/` returns entries that no longer exist at corresponding upstream paths.

**Phase to address:**
Upgrade resilience phase. This is explicitly the "Override staleness enforcement -- blocking CI gate" feature in PROJECT.md. Encode the three checks as separate CI jobs so failure reason is obvious.

**Reference:** [Debian quilt file rename issue](https://lists.debian.org/debian-mentors/2012/10/msg00145.html); [Chromium Upstream First doc](https://www.chromium.org/chromium-os/chromiumos-design-docs/upstream-first/); [opam overlay CI (tunbury.org)](https://www.tunbury.org/2026/04/02/opam-overlay-ci/); project memory `project_overlay_architecture.md`.

---

### Pitfall 3: Compat matrix combinatorial explosion

**What goes wrong:**
"Test last N upstream versions × 3 platforms × 2 node versions" starts as 18 jobs and grows. Every new upstream bump adds a new version to test, CI time creeps past 30 minutes, flakiness compounds (1 flaky test at 1% failure rate × 18 jobs = ~17% red-build rate), and the team learns to retry-until-green rather than treat red builds as real. The CI gate stops working as a gate.

**Why it happens:**
Combinatorial explosion in matrix testing is a well-documented pattern -- 10 microservices × 1 new version each = 1024 permutations. Forks especially want to "test against every upstream we've shipped with" as a safety net, but the set grows monotonically because there's no forcing function to prune it.

**How to avoid:**
- **Historical-version compat matrix with explicit N**: per PROJECT.md, "last N vetted upstream versions, not arbitrary future ones." N=3 is a reasonable start; revisit quarterly.
- **Tier the matrix**: full matrix only on release branch; PR CI tests current upstream + latest known-good upstream on one platform.
- **Prune on upstream-bump**: when bumping upstream, drop the oldest entry from the matrix. Encode this in the bump runbook, not as informal practice.
- **Retry-until-green is a gate failure**, not a workaround. If flake rate > 1%, root-cause before expanding matrix.

**Warning signs:**
- CI takes > 15 minutes on PRs.
- Developers say "just rerun it" more than once a week.
- Matrix entries count increases but never decreases.
- Test skips/xfails proliferate to keep the matrix green.

**Phase to address:**
Upgrade resilience phase (compat matrix feature) + Reliability SLO phase (the "retry-until-green is a failure" rule is part of flake elimination).

**Reference:** [Combinatorial explosion in microservices versioning](https://worklifenotes.com/2020/03/04/microservices-combinatorial-explosion-of-versions/); [Handling Combinatorial Explosion in Software Testing (DiVA paper)](http://www.diva-portal.org/smash/get/diva2:17568/FULLTEXT01.pdf).

---

### Pitfall 4: Security audit ignored because false positives dominate

**What goes wrong:**
`npm audit` flags 40 vulnerabilities. 38 are transitive, unreachable, or apply to features we don't use. The team starts running `npm audit --audit-level=critical` to suppress noise. One day a real critical arrives; it's ignored because "audit is always noisy." Or, the other failure mode: every audit finding becomes a blocker, release gets gated behind upstream maintainers fixing their deps, ship velocity collapses, and people start bypassing the gate with `--force`.

**Why it happens:**
Transitive dependency CVEs are often unfixable at our level -- we depend on A which depends on B which depends on vulnerable C. npm audit reports all of them with no context about reachability. The tension between "fail fast on security" and "don't cry wolf" is real and unresolved by most tooling.

**How to avoid:**
Adopt a **triage rule** (PROJECT.md already calls for this):
- **Critical + reachable**: fix in v1.2.0. Block release.
- **Critical + unreachable** (transitive, dev-only, feature not used): document in `.nsprc` or `audit-suppressions.json` with reason, re-review quarterly.
- **Major**: plan for v1.3.0. Not blocking but tracked with a deadline.
- **Minor**: backlog with 90-day review.

Encode the audit-suppressions file as **data, not a flag**. Every suppression has: CVE ID, package, reason, reviewer, review-date, re-review-date. CI fails if any suppression is older than its re-review-date. This is the key forcing function: suppressions are first-class, not hidden.

Also: `npm audit --exclude <pkg>` and `.nsprc` are documented escape hatches, but they must be tracked in a reviewable file, not a CI-yaml config.

**Warning signs:**
- `npm audit` command in CI includes `|| true` or `--audit-level=critical` without a data file explaining suppressions.
- Suppressions file has entries with no `re-review-date`.
- Audit findings count goes up over time but suppression count stays flat (findings being ignored rather than triaged).
- The word "reachable" does not appear in any audit-related documentation.

**Phase to address:**
Ship-readiness phase (security audit). Encode `.nsprc` or `audit-suppressions.json` format as part of the security audit deliverable, not as a follow-up.

**Reference:** [OWASP NPM Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html); [npm audit docs](https://docs.npmjs.com/cli/v11/commands/npm-audit/); [Gecko Security: Transitive Dependencies Guide](https://www.gecko.security/blog/transitive-dependencies-explained-complete-guide).

---

### Pitfall 5: Rule inflation dilutes core prompt (CLAUDE.md bloat)

**What goes wrong:**
Every process mistake triggers a new rule. CLAUDE.md balloons to 2000 lines with style guides, architectural decisions, and war stories. Claude starts ignoring rules because important ones are buried in noise. v1.2.0 adds four PROCESS-0X oversight patterns -- that's new rule surface area on top of an already extensive rules tree (the user's `~/.claude/rules/` already has 20+ files referenced from CLAUDE.md).

**Why it happens:**
Alexop.dev documents this anti-pattern directly: "When Claude makes a mistake, the instinct is to add a rule, then another mistake leads to another rule, then another." MindStudio calls it "context rot" -- attention dilution as skill files compete for context. Fixing a specific failure with a specific rule feels progressive but the sum is regressive.

**How to avoid:**
- **Forcing function test** for every new rule: "Could this be a hook, a CI check, or a deleted alternative pattern instead of a rule?" Rules are the last resort, not the first.
- **Rule budget**: CLAUDE.md has a token budget (Alexop recommends < 2000–3000 tokens). New rule in = old rule out, merged, or promoted to a skill/hook.
- **Consolidation review**: when adding the 4th PROCESS rule, pause and check if they share a pattern that could be one rule instead. In this project: PROCESS-01..04 all concern "oversight agents verify evidence before claiming." Consider one rule with four triggers, not four rules.
- **Rules that require absent tools are worse than no rule**.

**Warning signs:**
- A new rule added this week repeats a concept from an existing rule.
- Rules reference tools or scripts that don't exist yet.
- Claude's behaviour doesn't change after rule addition -- the rule was redundant to an existing pattern.
- CLAUDE.md grows but no rule is ever deleted or consolidated.

**Phase to address:**
Process hardening phase. Before implementing PROCESS-01..04, pass them through the consolidation review. After implementation, measure: does oversight agent flag rate actually change?

**Reference:** [Stop Bloating Your CLAUDE.md (alexop.dev)](https://alexop.dev/posts/stop-bloating-your-claude-md-progressive-disclosure-ai-coding-tools/); [Context Rot in Claude Code Skills (MindStudio)](https://www.mindstudio.ai/blog/context-rot-claude-code-skills-bloated-files); [Anthropic Claude Code Best Practices](https://code.claude.com/docs/en/best-practices); [System prompt token bloat issue #46339](https://github.com/anthropics/claude-code/issues/46339).

---

### Pitfall 6: Ship-readiness theater — looks professional, doesn't reduce bugs

**What goes wrong:**
Project ships with: 100% coverage badge, "security audit passed" label, "100% tests passing" README section, CI status badges, CHANGELOG with 50 entries, a beautiful MAINTENANCE.md. All true. All theater. Coverage was hit with smoke tests that don't assert behaviour. Audit passed because suppressions muted the findings. Tests pass because the flaky ones are retried. CHANGELOG has broken links. MAINTENANCE.md describes v1.0 architecture.

**Why it happens:**
Martin Fowler on test coverage and StickyMinds' "100% unit test coverage is not enough" both document the same pattern: metrics are easy to game, behaviour is hard to verify. Smoke tests that import-and-don't-crash contribute to coverage without asserting anything. Theater is a natural consequence of incentivising numbers instead of user outcomes.

Specific to this milestone: the authkey sibling-project incident is the exact warning. SUMMARY claims (374 tests) trusted without verification; test approach (`assert_cmd` subprocess) approved without checking it hits the coverage metric; CI gate raised before local measurement passed. Three separate theater failures in one workflow.

**How to avoid:**
- **Metric-target-compatibility check** (PROCESS-04). Before approving a test approach, verify the tool being used actually contributes to the metric. Example: `assert_cmd` subprocess tests do not contribute to Rust source coverage because the binary is a separate compilation unit. This is exactly what PROCESS-04 prevents.
- **Behaviour-first coverage**: every test must have at least one assertion beyond "did not throw." Can be enforced by lint rule or by a CI check that parses the test AST.
- **Link-check CI** for all docs: README, CHANGELOG, MAINTENANCE.md. `lychee` or `linkinator` or `mdbook-linkcheck`. Broken links in docs fail the build.
- **Executable README examples**: any code block marked `ts` or `bash` with a `# runnable` comment is extracted and run in CI. Broken example = red build.
- **Retry is a gate failure**: if a test needs retry to pass, it's flaky; flake is a bug, not an environment issue. No silent retries in CI.
- **Audit suppressions in a reviewable file** (see Pitfall 4) so "passed" has teeth.

**Warning signs:**
- Coverage report: line coverage high, branch coverage low. Classic smoke-test shape.
- Grep check: count of `expect(` / `assert` per test file should be > 1 on average. If many files have 0–1 assertions, that's import-and-don't-crash theater.
- CHANGELOG links to issues/PRs that 404.
- README has `$ npm install @chude/get-stuff-done` followed by a command that doesn't exist on latest version.
- "X% coverage" but the project has Y known flaky tests currently skipped.

**Phase to address:**
Ship-readiness phase (all four deliverables: security audit, reliability SLO, documentation, performance baseline). This is the pitfall the entire phase exists to prevent; if we fail it we fail the milestone.

**Reference:** [Martin Fowler on Test Coverage](https://martinfowler.com/bliki/TestCoverage.html); [100% Unit Test Coverage Is Not Enough (StickyMinds)](https://www.stickyminds.com/article/100-percent-unit-test-coverage-not-enough); [Codecov: Case Against 100% Code Coverage](https://about.codecov.io/blog/the-case-against-100-code-coverage/); authkey-incident PROCESS-01..04 references in PROJECT.md.

---

### Pitfall 7: Windows subprocess flake masked as "OS-level timing"

**What goes wrong:**
Windows CI has ~1–5% flake rate on subprocess tests. Story becomes "Windows is just flaky, we can't fix it." The Reliability SLO ("100% test pass on all 3 platforms") is quietly relaxed. Users on Windows hit the same failures at install time, file issues, we can't reproduce because our CI is intermittently green. Root cause has been deferred twice already (documented in `project_todo_windows_flakiness.md`).

**Why it happens:**
Node.js child_process on Windows has known pathologies: spawn can be tremendously slower, pipes have platform-specific buffer limits, the timeout option doesn't exist for `spawn()` (only `exec()`), and spawn EPERM is frequent on locked-down Windows. These are real. "OS-level timing" is a comfortable explanation because it's half-true. But the real root cause is usually specific: buffer overflow when subprocess writes > 8KB to stdout before parent reads; missing `shell: true` on npm scripts; race between spawn and write; timeout not propagating because it's on the wrong API.

**How to avoid:**
- **Timebox the root-cause effort**: per PROJECT.md, "requires root-causing Windows subprocess flakiness with decided escape hatch if genuinely unfixable." Make the timebox explicit (e.g., 2 working days). If root cause not found, the escape hatch is documented with specific affected tests and explicit reason, not a blanket "Windows is flaky" skip.
- **Measure before fixing**: count flake rate per test name, not overall. Likely 2–3 tests produce most of the noise. Fix those first.
- **Replace `exec` timeout with explicit race**: `Promise.race([childDone, setTimeout(...)])` with explicit kill. Don't rely on the `timeout` option that doesn't work on spawn.
- **Pipe buffer check**: any test that captures subprocess stdout must handle backpressure. If output > 64KB, use `pipe()` not buffering.
- **Central timeout constants**: project already has `SUBPROCESS_TIMEOUT` / `HEAVY_SUBPROCESS_TIMEOUT` (v1.1.0 TEST-02). Use them, don't override with hardcoded values.

**Warning signs:**
- Same test fails on Windows CI but not Linux or macOS, consistently.
- Failure message is a timeout, not an assertion failure.
- Local Windows run (WSL2 or native) produces different results than CI Windows.
- Retry makes it pass — this is a gate failure.
- "Known flaky on Windows" comment in code, with no issue link.

**Phase to address:**
Reliability SLO phase (explicit feature in v1.2.0). The TODO memory already scheduled this; milestone is forcing function to actually do it.

**Reference:** [nodejs/node #21632 — Windows child_process slowness](https://github.com/nodejs/node/issues/21632); [nodejs/node #43704 — spawn timeout ignored](https://github.com/nodejs/node/issues/43704); [Matt Summers on Node subprocess timeouts](https://mattsumme.rs/2015/nodejs-child-process-timeouts/); [microsoft/WSL #4255 — EPERM for spawn](https://github.com/microsoft/WSL/issues/4255); project memory `project_windows_test_flakiness.md`, `project_todo_windows_flakiness.md`.

---

### Pitfall 8: Private-repo install fails for cousin-test scenario

**What goes wrong:**
A user's cousin / friend / colleague tries to install `@chude/get-stuff-done` cleanly for the first time. Fails. Possible failures: wrong Node version with cryptic error; install script asks for a permission that was never mentioned; GitHub Packages auth required but undocumented; npmrc needs a registry setting; post-install script fails on Windows because of path separators; peer-dependency conflict; the install does work but the binary isn't in PATH because bun vs npm install in different places. The project is private, so they can't easily share their failure and we don't hear about it.

**Why it happens:**
Scoped npm packages (`@chude/...`) default to requiring `npm login` even for public packages. If the package is published privately, the user needs a token with the right scope. Cross-org access requires `read:packages` scope and many personal access tokens don't have it. Node version mismatch is silent on install but breaks at first run. Post-install scripts that assume bash are common in Unix-only projects and break on Windows native.

**How to avoid:**
- **Third-party cold-install test in CI**: a job that simulates a first-time install from scratch. No local repo, no dev setup. Run as a matrix over: fresh Ubuntu, fresh macOS, fresh Windows; Node 20 + Node 22; bun + npm + pnpm. Use a token with minimal scope.
- **Document auth setup explicitly**: MAINTENANCE.md (or a separate INSTALL.md) must say: required token scope, registry configuration, common error messages and fixes.
- **Clear error on Node version mismatch**: `engines` field in package.json + runtime check at CLI entry that prints "Node 20+ required, detected <version>" before any other code runs.
- **Post-install scripts are optional**: any post-install logic must survive skipping. Package works on a cold install even if post-install is blocked by the user.
- **Cousin-test before ship**: literally get someone who has never touched this repo to do a fresh install on their machine and document every friction point. Feedback is encoded in install docs.
- **PATH verification in install test**: after install, verify `gsd` (or equivalent bin) is actually on PATH and runs `--version` successfully.

**Warning signs:**
- Only the maintainer has ever done a fresh install on this machine.
- Install docs say "just run `bun install`" with no preconditions.
- Post-install script has uncaught exceptions or `|| true` in critical paths.
- No CI job simulates a non-contributor install.
- Most "getting started" docs are implicit ("you already have a GitHub token with X scope, right?").

**Phase to address:**
Ship-readiness phase (documentation completeness + reliability SLO). The cousin-test is a verification for documentation completeness AND for install reliability; arguably this is the single most important ship-readiness check because it exercises everything else.

**Reference:** [npm community #111172 — private package in private package](https://github.com/orgs/community/discussions/111172); [npm about access tokens](https://docs.npmjs.com/about-access-tokens/); [pnpm #2687 — 401 on private GitHub registry](https://github.com/pnpm/pnpm/issues/2687); [npm ci vs npm install for reproducible builds](https://www.boxpiper.com/posts/npm-ci-vs-npm-install).

---

### Pitfall 9: Blanket merge conflict resolution silently drops code

**What goes wrong:**
During an upstream bump, a file has merge conflicts. Operator runs `git checkout --theirs path/` or `git checkout --ours path/` to resolve fast. The resolution takes the whole file from one side, silently dropping code from the other. Commits that should have been preserved are lost. Tests still pass because the dropped code was new (not yet tested) or the tests pass against either version. This is exactly the authkey incident failure #1.

**Why it happens:**
`--theirs` and `--ours` are file-level operations; they discard the other side entirely. Atlassian docs note this is fast but risky. Under time pressure during a bump, "just take theirs" feels safer than a proper 3-way merge, especially when the branding/overlay pipeline will overlay our stuff anyway. The false sense of safety is that the overlay pipeline will re-apply our changes — but it only does that for files in `overlay/`, not arbitrary code in the working tree.

**How to avoid:**
- **Ban `--theirs` / `--ours` wholesale in bump runbook**. Use 3-way merge (`git mergetool`, or manually resolve each conflict marker) unless the file is explicitly in a list of "always take upstream" (e.g., `.upstream/` mirror files — but even these should be re-verified).
- **Per-conflict review discipline**: each conflict chunk gets a decision recorded. The PROCESS-02 "SUMMARY claims lacking verification" rule covers this: merge summary must enumerate conflicts, per-conflict decision, and how the decision was verified.
- **Post-merge diff check**: `git diff HEAD~ HEAD -- $(list of overlay files)` must be reviewed before push. If a bump touched overlay files, that's a yellow flag.
- **Atomic coupling reminder**: the statusline + hook coupling documented in PROJECT.md ("Upstream hook merge... with atomic coupling to statusline") is exactly the class of dependency that a blanket checkout destroys.

**Warning signs:**
- Git log shows `Merge branch` commits where the merge message contains no conflict list.
- Bump PR has no reviewer checklist for per-conflict decisions.
- Reflog entries include `checkout --theirs` or `checkout --ours` during a bump.
- Tests pass but line count decreases significantly after a bump (code was dropped).

**Phase to address:**
Process hardening phase. Encode in the upstream bump runbook. Consider a CI check that fails if a merge commit is pushed without a `CONFLICTS_RESOLVED.md` artifact listing each conflict.

**Reference:** [Atlassian: Resolving Merge Conflicts](https://www.atlassian.com/git/tutorials/using-branches/merge-conflicts); [Git Advanced Merging docs](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging); [Howchoo: ours and theirs](https://howchoo.com/git/git-merge-conflicts-rebase-ours-theirs); authkey incident failure #1.

---

### Pitfall 10: Documentation rot — MAINTENANCE.md describes last version's reality

**What goes wrong:**
MAINTENANCE.md was true at write-time. A phase later, override policy changes, a new CI check is added, the upgrade procedure gains a step. Docs don't update. Six months later someone follows MAINTENANCE.md and it fails because step 3 references a script that was renamed. Users stop trusting the doc. The fix becomes delete-and-rewrite rather than incrementally fix, which creates churn and demotivates updates.

**Why it happens:**
Documentation has no runtime failure. Code with bugs produces test failures; docs with drift produce silent frustration. The forcing function to update docs exists in theory (PR reviewer says "update docs too") but slips in practice, especially for non-user-visible changes like CI additions.

**How to avoid:**
- **Docs-in-same-PR rule**: if the change touches `overrides/`, `overlay/`, or CI, MAINTENANCE.md must be reviewed in the same PR. Lightweight CI check: detect changes to these dirs, require MAINTENANCE.md touched OR a `docs-not-affected` label.
- **Executable docs**: wherever MAINTENANCE.md shows a command, that command is extracted and run in a nightly CI job. Drift = red build. Tools: `mdbook-linkcheck` for links, a shell-block runner for commands.
- **Ownership field**: each doc section has an "owner" comment. When work happens in that area, the owner is pinged for doc review.
- **Version the doc with the code**: MAINTENANCE.md references `v1.2.0` explicitly at the top. When the version bumps, the review prompt is "is this still true for v1.3.0?"
- **Staleness threshold**: doc file hasn't been touched in 90 days + code in its subject area has changed → auto-issue filed. GitHub Actions can do this cheaply.

**Warning signs:**
- Steps in MAINTENANCE.md reference scripts that don't exist or have different names.
- The doc mentions versions that are older than the current milestone.
- No commits to docs in the last quarter despite multiple feature PRs.
- The doc's "Last updated" line is stale.
- README's install command doesn't match the actual package on npm.

**Phase to address:**
Ship-readiness phase (documentation completeness). Encode the four enforcement mechanisms (in-PR rule, executable docs, ownership, version link) as part of the MAINTENANCE.md deliverable.

**Reference:** [mdbook-linkcheck (crates.io)](https://crates.io/crates/mdbook-linkcheck); general doc-as-code pattern (see also v0.2.0-era GSD documentation rules in project memory).

---

### Pitfall 11: Performance regression "doesn't count" because it's untracked

**What goes wrong:**
A security-hardening PR adds input validation to every CLI command. Legitimate, intentional. But it also adds 200ms to CLI startup, and nobody noticed because there's no performance baseline. Three months later, cumulative hardening has added 2s to every command. Users notice. Or the reverse failure: debug logging left in, a profile flag that's always on, a sync I/O call that should be lazy. Same symptom, different cause, but without a baseline there's no signal.

**Why it happens:**
Performance is only tracked when someone is watching. Performance budgets in CI exist but are rarely added at milestone-1; they're added after a regression lands. Lighthouse CI is the canonical browser example; equivalent tooling for CLIs is thinner, so it's tempting to skip.

**How to avoid:**
- **Baseline + budget** (PROJECT.md explicit feature): measure CLI startup, install time, composition pipeline time. Set a budget per metric. CI fails PR if budget exceeded.
- **Warning band** under hard fail: fail on > X, warn on > X−10%. Surfaces drift before it's a blocker.
- **Distinguish intentional from accidental**: any PR that exceeds budget must include a commit-message tag or PR label explaining why (e.g., `perf:accepted` for security hardening). Blanket exceedance without tag = red.
- **Measure on representative workload**: CLI startup measured on cold cache, not warm. Composition measured on realistic overlay size, not a toy test.
- **Platform-specific budgets**: Windows will be slower than Linux for subprocess ops. Don't set a single budget that Windows can never meet; set per-platform.

**Warning signs:**
- No `perf/` directory, no benchmark tests, no baseline numbers anywhere in repo.
- PR descriptions never mention performance impact.
- Users complain about "slow" without us having objective numbers to check.
- CI time drifts upward without an investigation.
- `time gsd --version` output varies wildly across runs.

**Phase to address:**
Ship-readiness phase (performance baseline with budget enforcement in CI). This is an explicit v1.2.0 feature; do it real or not at all.

**Reference:** [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci); [Performance Budgets in CI/CD (dev.to)](https://dev.to/apogeewatcher/how-to-set-up-performance-budgets-in-cicd-pipelines-lj); [CodeWithSeb: Frontend Performance Budgets](https://www.codewithseb.com/blog/performance-budgets-frontend-engineers-guide).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `continue-on-error: true` on informational CI jobs (existing pattern per PROJECT.md) | Prevents false-red builds on boundary/compat jobs | Masks real regressions if informational becomes blocking and nobody notices | Acceptable while category is genuinely informational; must be re-audited every milestone (does this job still belong in informational tier?) |
| Skipping a flaky Windows test with `.skip` instead of root-causing | Unblocks release | Hidden Windows user impact; flake accumulates | Never acceptable without an issue link, a deadline, and a cousin-test verification that the skip doesn't affect user-facing scenarios |
| `npm audit --audit-level=critical` in CI | Fewer CI failures | A critical arrives, looks like all the others, gets ignored | Never; use suppressions file with reasons instead |
| Copy-pasting REASON.md content between overrides | Faster onboarding of new override | Every override looks important but none actually justify themselves; review fatigue | Never; if REASON.md can't be written uniquely, the override doesn't belong in overrides/ |
| 100% coverage achieved by import-and-don't-crash smoke tests | Coverage number looks good | Zero behaviour verification; refactors break silently | Never — coverage without assertions is theater (Pitfall 6) |
| Filing upstream without scope-verification because "it's probably upstream" | Immediate reduction in todo list | Embarrassment; time wasted waiting; user's "contribute a lot to OSS" goal damaged | Never; see Pitfall 1 |
| CLAUDE.md rule for every mistake | Fast response to each failure | Rule inflation, attention dilution (Pitfall 5) | Only after forcing-function check: could this be a CI check, hook, or consolidation instead? |
| Retry-until-green CI culture | Faster PR merges | Normalizes flake; real failures indistinguishable from noise | Never in production CI; acceptable only in explicitly-quarantined "known-flaky" jobs that are re-reviewed weekly |
| Accepting upstream boundary violations as "always informational" | No red builds from structural drift | 48 boundary violations accrete into a separate migration later (project already has this exact debt) | Acceptable while violation count is flat or decreasing; unacceptable if growing milestone-over-milestone |

---

## Integration Gotchas

Common mistakes when connecting to external services or tooling.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| npm registry (private `@chude/` scope) | Assume users have `read:packages` token scope | Document minimum token scope in MAINTENANCE.md; cold-install CI job verifies from scratch |
| GitHub Packages | Use personal token with too-broad scope in CI | Fine-grained token with `read:packages` only, one per purpose |
| Upstream `get-shit-done-cc` npm dependency | Assume `bun install` just works after version bump | Bump runbook includes compose-reinstall-verify sequence; CI job simulates full cycle |
| Claude Code (settings.json) | Overwrite user's custom statusline on patchStatusLine | Preserve custom statusline (v1.1.0 STAT-02 already does this); atomic write prevents TOCTOU |
| Upstream hook files | Assume rename = replace | Collision detection in compose pipeline triggers move to `overrides/` with new REASON.md snapshot; never silent |
| Node.js child_process on Windows | Use `exec` timeout option expecting it to work on `spawn` | Explicit `Promise.race([child, timer])` with explicit kill; use central timeout constants |
| GitHub Actions matrix | Add every new upstream version to matrix forever | N-last vetted versions; prune oldest on new bump |
| `.nsprc` / audit suppressions | Hide findings with `--audit-level` flag | Data file with CVE, reason, reviewer, re-review-date; CI fails on stale review-date |
| npm publish in CI | NPM_TOKEN env var alongside OIDC credentials | OIDC-only; the [axios supply chain incident](https://github.com/axios/axios/issues/10636) exploited exactly this pattern |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous composition pipeline for every CLI invocation | CLI startup slow on cold cache | Cache composed output; invalidate on upstream version change | Noticeable at first; degrading as overlay grows past ~3000 lines |
| CLAUDE.md loaded every session with unbounded rule growth | Agent response slower, rules "ignored" | Rule budget enforcement; skills for on-demand context (Pitfall 5) | Observable at ~2000+ tokens; severe at 3000+ |
| Test matrix grows monotonically | CI time creeps; flake-rate compounds | Historical compat with explicit N (Pitfall 3) | ~15 min CI time; ~2% flake rate |
| Subprocess test without backpressure handling | Hangs on Windows when stdout > buffer | Pipe streams with explicit backpressure | > 8KB subprocess stdout on Windows |
| Full upstream git clone for every sync check | Network traffic; rate limits | Shallow clone + tag-list check (7-day throttle already in CI-01) | Multiple daily checks across many dev machines |
| Linear scan of `overrides/` tree at install | Install time scales with override count | Manifest-driven approach (already used for uninstall per INST-01) | ~100+ override files |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Long-lived npm publish token in CI env var (axios-style) | Token theft → supply chain compromise | OIDC Trusted Publishing; no NPM_TOKEN alongside OIDC credentials |
| Composition pipeline pulls upstream without SHA verification | Malicious upstream tag push → compromised ship | Exact version pinning (already a decision); lockfile integrity; optionally GPG verify (SYNC-07 shipped) |
| Post-install script runs privileged operation | User runs `bun install`, grants implicit privilege | Post-install scripts must be optional; project works when post-install is skipped; no sudo in scripts |
| Override files contain security-sensitive patches that leak info | "Why we overrode this" REASON.md reveals attack surface | Review REASON.md phrasing: describe intent, not vulnerability specifics; link to private issue tracker |
| Audit suppressions lack re-review | Suppressed CVE becomes reachable due to refactor; nobody notices | Suppressions have explicit re-review-date; CI fails on expiry (Pitfall 4) |
| Telemetry / analytics in a CLI tool | User surprise; PII leak | Opt-in only; document what's sent; default off |
| Statusline or hook executing untrusted upstream code | Code injection via compromised upstream | Upstream version bumps reviewed; compose pipeline can refuse suspicious patterns (already has supply-chain-scan.cjs) |
| README examples copy-pasted by users contain production-unsafe commands | e.g., `rm -rf` that works in demo context but not user's | Example commands dry-run-first, or use clearly-scoped directories |

---

## UX Pitfalls

Common user experience mistakes specific to this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Upgrade destroys user customizations | User rage; support burden | Preview-update workflow (already shipped); diff user's modifications before overlay |
| Statusline breaks silently on composed-output reinstall | User thinks tool is broken | Custom statusline preservation (v1.1.0); atomic write for settings.json |
| Error message references internal paths (`.upstream/`, `overrides/`) | Confusing; user doesn't know which repo owns the bug | Error messages say "upstream GSD" or "fork extension" in user terms, not repo paths |
| Install succeeds but bin not in PATH | User runs `gsd`, gets "command not found" | Install verifies bin is on PATH; prints fix command if not |
| Windows install fails at a subprocess step with opaque error | User abandons | Pre-flight Windows check (Git Bash detected? Node version? permissions?) with actionable errors |
| CLI version command doesn't show composition details | User can't report precise state to maintainer | `--version` includes: fork version, upstream version, overlay manifest hash |
| Release notes describe composition internals users don't care about | Noise | User-facing changelog separate from engineering changelog |
| Node version mismatch surfaces only at first command run | User installs, moves on, hits error hours later | Engines field in package.json; explicit runtime check; install-time warning |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces. Before declaring v1.2.0 shipped, verify each:

- [ ] **Automated upgrade test**: Not just "bumps upstream successfully" — also verifies composed output passes, reinstalls cleanly, runs a representative command, and restores on rollback. Grep check: `test -f .github/workflows/upgrade-test.yml && grep -q reinstall .github/workflows/upgrade-test.yml`.
- [ ] **Compat matrix**: Has an explicit N defined in config, not "all historical versions." Pruning policy documented (when bumping upstream, drop oldest).
- [ ] **Override staleness gate**: Blocking, not informational. Check: does the gate's failure exit the CI job non-zero? Is it in `needs:` of the release job?
- [ ] **Security audit**: Has `.nsprc` or `audit-suppressions.json` with re-review-date per entry. Not just `npm audit --audit-level=critical`. Check: grep suppressions file for entries without `reviewedDate` — must be zero.
- [ ] **Reliability SLO (100% on 3 platforms)**: Not achieved via `.skip` on Windows. Check: `rg -n '\.skip\(' test/ | grep -i windows` — must be zero OR each has a linked issue with deadline.
- [ ] **Documentation completeness**: MAINTENANCE.md, upgrade guide, override policy. Each has an "executable examples" CI check. Links pass `lychee` or equivalent.
- [ ] **Performance baseline**: Actual numbers committed (e.g., `perf/baseline.json`). Budget enforced in CI. A PR that violates budget fails, not warns.
- [ ] **Oversight agents (PROCESS-01..04)**: Actually flag things — has each one been tested against a synthetic violation? Is there a record of at least one real-world flag?
- [ ] **Cousin-test complete**: Someone who has never touched this repo did a fresh install on their machine, and feedback is encoded in docs. Not just "it works on my machine."
- [ ] **Live upgrade dogfood**: Upstream was actually bumped during this milestone using the new resilience features, and the event is recorded (PR number, duration, any issues encountered).
- [ ] **Rule consolidation**: PROCESS-01..04 were passed through the "could this be one rule or a hook instead of four rules" review before implementation.
- [ ] **Scope verification documented**: Any upstream issue filed during v1.2.0 includes evidence of reproduction against unmodified upstream.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 1 (upstream-scope misattribution) | LOW | Comment on upstream issue: "apologies, this is fork-specific, closing." Add scope-verification to the relevant oversight agent. Log in memory as precedent. |
| 2 (override staleness) | MEDIUM | Audit all overrides against current upstream. Delete orphans. Re-snapshot REASON.md for drifted ones. Encode blocking CI gate so it doesn't recur. |
| 3 (matrix explosion) | MEDIUM | Prune matrix to N-last. Extract flaky tests to quarantined suite. Root-cause remaining flakes. |
| 4 (audit ignored) | LOW-MEDIUM | Create suppressions file with re-review-dates. Re-run audit; each new finding triaged per severity rule. Document rule in MAINTENANCE.md. |
| 5 (rule bloat) | MEDIUM | Consolidation review: for each rule, does it still apply? Could it be a hook, CI check, or merged into another rule? Delete aggressively. |
| 6 (ship-readiness theater) | HIGH | Hardest to recover from because trust is broken. Switch metrics from coverage% to assertions/test ratio + mutation-testing score. Re-audit all claims in README. Announce the reset to users if applicable. |
| 7 (Windows flake) | MEDIUM | Follow the Windows flakiness session playbook (memory `project_todo_windows_flakiness.md`). Per-test flake-rate measurement. Root-cause top offenders. |
| 8 (private install fail) | LOW | Cousin-test immediately; encode findings in INSTALL.md; add cold-install CI job. |
| 9 (blanket --theirs) | HIGH | `git reflog` → recover dropped commits → re-apply manually with per-conflict review. Add bump-runbook rule prohibiting `--theirs`. |
| 10 (doc rot) | MEDIUM | Batch doc review at next milestone boundary; add in-PR rule; add executable-example CI. |
| 11 (perf regression) | MEDIUM | Bisect to find regression commit; add baseline + budget retroactively; document the regression and tag `perf:accepted` if intentional. |

---

## Pitfall-to-Phase Mapping

How v1.2.0 roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Upstream-scope misattribution | Process hardening (PROCESS-01..04) | Oversight agent refuses upstream-issue proposals without reproduction evidence. Test: synthetic proposal missing evidence fails agent review. |
| 2. Override staleness | Upgrade resilience | Blocking CI gate fails build when: orphan override, SHA drift, or stale review. Test: mutate an override to drift from upstream → CI fails. |
| 3. Compat matrix explosion | Upgrade resilience | Matrix configured with explicit N; pruning rule documented in bump runbook. Test: CI time stays under 15 min after 3 upstream bumps. |
| 4. Audit false positives | Ship-readiness (security audit) | Suppressions file format enforced; re-review-date validated in CI. Test: expire a date → CI fails with actionable message. |
| 5. Rule inflation | Process hardening (consolidation review) | PROCESS-01..04 count = 4 stays at 4 or drops (no inflation during milestone). Test: CLAUDE.md token count tracked; ratchet not exceeded. |
| 6. Ship-readiness theater | Ship-readiness (all four deliverables) | Each deliverable has a verification test that fails on the theater version. Assertions/test ratio measured; link-check CI; executable-examples; audit-reachability gate. |
| 7. Windows flake | Reliability SLO | 100% pass on Windows in 10 consecutive CI runs; per-test flake-rate < 0.5%. Test: run full suite ×10 on Windows, zero retries permitted. |
| 8. Private install fail | Ship-readiness (docs + SLO) | Cold-install CI job passes on fresh OS matrix. Cousin-test documented. Test: rotate installer token scope; CI uses minimal-scope token. |
| 9. Blanket merge resolution | Process hardening | Bump runbook prohibits `--theirs`; CI check fails merge commits without `CONFLICTS_RESOLVED.md`. Test: simulate a merge with `--theirs` → CI fails. |
| 10. Documentation rot | Ship-readiness (documentation) | In-PR rule; executable-examples CI; linkcheck CI; ownership fields. Test: break a MAINTENANCE.md example → CI fails. |
| 11. Performance regression | Ship-readiness (performance baseline) | Budget enforced; warning band active; per-platform budgets. Test: introduce 50ms slowdown → CI warns; 500ms → CI fails. |

---

## Sources

**Project-internal:**
- `.planning/PROJECT.md` (v1.2.0 milestone definition)
- Memory `feedback_verify_upstream_scope.md` (Pitfall 1 precedent)
- Memory `project_overlay_architecture.md` (overlay composition model)
- Memory `project_windows_test_flakiness.md`, `project_todo_windows_flakiness.md` (Pitfall 7 precedent)
- Memory `feedback_oss_contribution_goals.md` (user's stakes; embarrassment cost)
- Authkey incident (cited in milestone_context): failures 1–4 inform Pitfalls 6, 9

**External references (HIGH confidence — Claude Code / rules):**
- [Stop Bloating Your CLAUDE.md (alexop.dev)](https://alexop.dev/posts/stop-bloating-your-claude-md-progressive-disclosure-ai-coding-tools/) — Pitfall 5
- [Context Rot in Claude Code Skills (MindStudio)](https://www.mindstudio.ai/blog/context-rot-claude-code-skills-bloated-files) — Pitfall 5
- [Anthropic Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) — Pitfall 5
- [System prompt token bloat issue #46339](https://github.com/anthropics/claude-code/issues/46339) — Pitfall 5

**External references (HIGH confidence — testing/quality):**
- [Martin Fowler on Test Coverage](https://martinfowler.com/bliki/TestCoverage.html) — Pitfall 6
- [100% Unit Test Coverage Is Not Enough (StickyMinds)](https://www.stickyminds.com/article/100-percent-unit-test-coverage-not-enough) — Pitfall 6
- [Codecov: Case Against 100% Code Coverage](https://about.codecov.io/blog/the-case-against-100-code-coverage/) — Pitfall 6

**External references (HIGH confidence — security/audit):**
- [OWASP NPM Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html) — Pitfall 4
- [npm audit docs](https://docs.npmjs.com/cli/v11/commands/npm-audit/) — Pitfall 4
- [Gecko Security: Transitive Dependencies Guide](https://www.gecko.security/blog/transitive-dependencies-explained-complete-guide) — Pitfall 4
- [axios npm supply chain compromise #10636](https://github.com/axios/axios/issues/10636) — Security mistakes table (OIDC/token pattern)

**External references (HIGH confidence — overlay/fork):**
- [Debian quilt file rename issue (debian-mentors 2012)](https://lists.debian.org/debian-mentors/2012/10/msg00145.html) — Pitfall 2
- [Chromium Upstream First design doc](https://www.chromium.org/chromium-os/chromiumos-design-docs/upstream-first/) — Pitfall 2
- [opam overlay CI (tunbury.org)](https://www.tunbury.org/2026/04/02/opam-overlay-ci/) — Pitfall 2
- [Combinatorial explosion in microservices versioning](https://worklifenotes.com/2020/03/04/microservices-combinatorial-explosion-of-versions/) — Pitfall 3
- [Handling Combinatorial Explosion in Software Testing (DiVA)](http://www.diva-portal.org/smash/get/diva2:17568/FULLTEXT01.pdf) — Pitfall 3

**External references (HIGH confidence — Node/Windows):**
- [nodejs/node #21632 — Windows child_process slowness](https://github.com/nodejs/node/issues/21632) — Pitfall 7
- [nodejs/node #43704 — spawn timeout ignored](https://github.com/nodejs/node/issues/43704) — Pitfall 7
- [Matt Summers on Node subprocess timeouts](https://mattsumme.rs/2015/nodejs-child-process-timeouts/) — Pitfall 7
- [microsoft/WSL #4255 — EPERM for spawn](https://github.com/microsoft/WSL/issues/4255) — Pitfall 7

**External references (MEDIUM confidence — install/packages):**
- [npm community #111172 — cross-org private packages](https://github.com/orgs/community/discussions/111172) — Pitfall 8
- [pnpm #2687 — 401 on private GitHub registry](https://github.com/pnpm/pnpm/issues/2687) — Pitfall 8
- [npm ci vs npm install](https://www.boxpiper.com/posts/npm-ci-vs-npm-install) — Pitfall 8

**External references (HIGH confidence — git):**
- [Atlassian: Resolving Merge Conflicts](https://www.atlassian.com/git/tutorials/using-branches/merge-conflicts) — Pitfall 9
- [Git Advanced Merging (git-scm)](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging) — Pitfall 9
- [Howchoo: ours and theirs](https://howchoo.com/git/git-merge-conflicts-rebase-ours-theirs) — Pitfall 9

**External references (MEDIUM confidence — docs/perf):**
- [mdbook-linkcheck (crates.io)](https://crates.io/crates/mdbook-linkcheck) — Pitfall 10
- [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci) — Pitfall 11
- [Performance Budgets in CI/CD (dev.to)](https://dev.to/apogeewatcher/how-to-set-up-performance-budgets-in-cicd-pipelines-lj) — Pitfall 11
- [CodeWithSeb: Frontend Performance Budgets](https://www.codewithseb.com/blog/performance-budgets-frontend-engineers-guide) — Pitfall 11

---
*Pitfalls research for: v1.2.0 Ship-Ready Hardening milestone, GetStuffDone overlay fork*
*Researched: 2026-04-20*

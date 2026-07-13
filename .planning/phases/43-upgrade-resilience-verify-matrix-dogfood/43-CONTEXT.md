# Phase 43: Upgrade Resilience - Verify, Matrix, Dogfood - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Auto-selected infrastructure defaults

<domain>
## Phase Boundary

Phase 43 proves the overlay can survive a real reviewed Open GSD upstream bump.
It delivers upgrade verification, a three-version vetted compatibility matrix,
semantic override-staleness handling for JavaScript overrides, hook override
reconciliation, a live dogfood bump, override-churn reporting, and SBOM output.

This phase does not broaden the product methodology, switch to dynamic upstream
`latest`, reintroduce legacy `get-shit-done-cc` authority, or complete the
Phase 44 publish/documentation polish gates.

</domain>

<decisions>
## Implementation Decisions

### Upgrade Verification Surface

- **D-01:** Build `verify-upgrade` as a maintainer-grade, temp-isolated orchestration surface. It must not mutate the operator's global Claude/Codex/GSD install while proving install, bump, compose, reinstall, and smoke verification.
- **D-02:** Use a Linux Verdaccio-backed local registry for the full cycle because the requirement explicitly names Verdaccio and CI schedule/on-change coverage. Cross-platform smoke can reuse smaller install/provenance checks, but the full registry simulation is Linux-first unless research finds a repo-local blocker.
- **D-03:** Emit structured JSON with enough fields for CI, summaries, and MAINTENANCE evidence: from version, target version, registry URL, package tarball or packed artifact, compose result, reinstall target, smoke commands, duration, changed overrides, warnings, and exit classification.
- **D-04:** Treat partial-install safety as part of this phase's upgrade proof. The memory-nexus Codex installer crash is fixed, but transactional install/preflight/rollback behavior remains open and should be either implemented in the relevant upgrade/install plan or explicitly deferred with a concrete reason.

### Upstream Version Policy

- **D-05:** Preserve exact stable version pins. `latest` may be queried to discover a candidate, but the implementation must write an explicit reviewed version such as `1.6.1`, never a semver range, tag, or prerelease.
- **D-06:** Current live upstream evidence from 2026-07-03: `@opengsd/gsd-core` has `latest = 1.6.1`, `next = 1.7.0-rc.2`; this fork is pinned to `1.5.0`. The dogfood target should be reverified at execution time, and prerelease `next` is excluded unless a future phase explicitly changes the rule.
- **D-07:** The initial N=3 vetted set should be derived from stable Open GSD versions that are actually verified by this phase. Candidate set as of context capture: `1.5.0` current pin, `1.6.0` previous stable, and `1.6.1` latest stable. Do not mark a version vetted until the planned gate runs against it.
- **D-08:** `.planning/vetted-upstream-versions.json` is the source of truth for the compat matrix. It should include enough metadata to explain why each version is present, what is blocking vs informational, and when pruning occurs.

### Override Staleness and Churn

- **D-09:** Refactor staleness detection by adding a semantic comparison port beside the current SHA-256 byte-hash path. Keep `scripts/check-overrides.js` as the CLI facade and policy reporter; do not bury parser-specific behavior inside unrelated reporting code.
- **D-10:** Scope semantic staleness to `.js` overrides first. Comment-only and whitespace-only upstream changes must not mark a JavaScript override stale; semantic AST/content changes must still fail the blocking override gate.
- **D-11:** For non-JavaScript overrides, preserve the current byte-hash behavior and document `.md` semantic diff as v1.3.0 deferred work. Do not silently weaken staleness for markdown or other text files.
- **D-12:** Override churn reporting should be generated from the reviewed upstream delta and override metadata, then inserted into CHANGELOG as a current-state release-note section. It must list carried, changed, added, removed, and orphaned override decisions without hand-curated drift.

### Hook Override Reconciliation

- **D-13:** Reconcile `overrides/hooks/gsd-check-update.js` against Open GSD hook improvements in one atomic plan with the related `gsd-statusline.js` override. The update check and statusline are coupled user-facing runtime surfaces.
- **D-14:** Preserve fork-specific behavior while reviewing upstream hook improvements: package identity, role routing, commit classification, two-layer throttle behavior, and any existing fork guardrails documented in the REASON files.

### Dogfood and Evidence

- **D-15:** The live dogfood bump should run only after the verifier, matrix, semantic staleness, and hook reconciliation gates exist locally. It is proof of the system, not the first time the system is exercised.
- **D-16:** Record dogfood evidence in MAINTENANCE.md as a D-7 evidence record only. Full MAINTENANCE completeness remains Phase 44, but Phase 43 owns the concrete upgrade record: PR number, duration, target, gates run, what was caught, friction, and follow-up.
- **D-17:** If the dogfood bump surfaces more work than fits Phase 43, fail closed into a documented follow-up instead of force-merging a brittle upgrade.

### SBOM and Release Artifacts

- **D-18:** SHIP-03 is an umbrella split into SHIP-03A and SHIP-03B. Phase 43 owns SHIP-03A: generate CycloneDX SBOM output as `dist/bom.json` between compose and finalize-dist and include it in the npm tarball.
- **D-19:** Phase 44 owns SHIP-03B: attach `dist/bom.json` to the GitHub release and verify its digest against the tarball copy. Phase 43 must not claim that release-flow obligation complete.
- **D-19A:** Phase 43 owns umbrella SHIP-08 only when both children pass: SHIP-08A reports and enforces at least 95% statements, branches, functions, and lines independently over canonical fork-authored executable source while Bun remains green; SHIP-08B separately blocks on provenance, drift, named fork-delta, owner/removal, and N=3 composed-package assurance for every shipped upstream snapshot. The fork-only metric must never be labeled whole-production coverage.

### Folded Inbox Constraints

- **D-20:** Fold memory-nexus install crash leftovers that directly affect upgrade trust: transactional install/preflight/rollback and VERSION/package-version clarity. These are upgrade-path safety issues.
- **D-21:** Do not fold unrelated `teams` config-schema drift into Phase 43. Keep it with backlog 999.2/config-schema work unless a Phase 43 task directly touches that schema.
- **D-22:** Treat memory-nexus health warning grouping as out of scope unless a Phase 43 smoke verifier depends on `validate health` output. If it does, the planner must separate project hygiene diagnostics from upgrade-verifier pass/fail policy.
- **D-23:** Defer the authkey portable market-ready gate inbox item to Phase 44 or a dedicated methodology phase. It is broader than upgrade resilience and should not be hidden inside Phase 43.

### the agent's Discretion

- The planner may choose exact file names, helper module boundaries, report schemas, and CI job layout when they preserve the decisions above and follow the repo's existing CommonJS/script patterns.
- The planner may split Phase 43 into multiple PR-sized plans, but each plan must have a clear verification boundary and avoid a monolithic "upgrade everything" task.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope

- `.planning/ROADMAP.md` - Phase 43 goal, success criteria, and requirement mapping.
- `.planning/REQUIREMENTS.md` - UPGRADE-01, UPGRADE-02, UPGRADE-04, UPGRADE-05, UPGRADE-07, UPGRADE-08, UPGRADE-09, SHIP-03A, SHIP-08, SHIP-08A, and SHIP-08B definitions.
- `.planning/PROJECT.md` - Overlay architecture, exact pin policy, out-of-scope rules, and active upstream authority.
- `.planning/STATE.md` - Current milestone state, carried-forward debt, and Phase 42 completion context.

### Upstream Authority

- `.planning/upstream-authority.json` - Active Open GSD authority contract and exact pinned version.
- `.planning/upstream-authority.schema.json` - Authority manifest schema.
- `scripts/lib/upstream-source.js` - Runtime helper for active package, version, source root, and path resolution.
- `scripts/lib/package-provenance.js` - Existing non-interactive runtime package provenance surface.

### Upgrade and Composition

- `scripts/compose.js` - Overlay resolve/filter/override/brand/merge pipeline and metadata outputs.
- `scripts/check-overrides.js` - Current byte-hash override staleness detector and CLI reporter.
- `bin/install.js` - Fork installer wrapper and global/local install behavior.
- `overrides/bin/install.js` - Current installer override; relevant to transactional install and Codex config safety.
- `overrides/bin/install.js.REASON.md` - Review trigger and upstream snapshot for installer override.

### Hook Overrides

- `overrides/hooks/gsd-check-update.js` - Fork update-check hook override.
- `overrides/hooks/gsd-check-update.js.REASON.md` - Upstream hook improvements to reconcile and fork behavior to preserve.
- `overrides/hooks/gsd-statusline.js` - Coupled statusline override.
- `overrides/hooks/gsd-statusline.js.REASON.md` - Review trigger for statusline override.

### CI and Gates

- `.github/workflows/ci.yml` - Current blocking docs, lint, audit, test, perf, boundary-ratchet, override, upstream-compat, and security jobs.
- `.github/workflows/cousin-install.yml` - Existing cold-install matrix and provenance smoke pattern.
- `.github/workflows/perf-baseline.yml` - Real artifact merge pattern for baseline updates.
- `perf-baseline.json` - Current perf budgets and temporary macOS accepted-regression expiry policy.

### Tests

- `tests/check-overrides.test.js` - Existing override staleness coverage and helper fixture style.
- `tests/check-overrides-integration.test.js` - Current integration coverage for staleness gate.
- `tests/compose.test.js` - Composition pipeline coverage and temp-dir fixture style.
- `tests/upstream-source.test.js` - Authority helper coverage.
- `tests/cousin-smoke.test.js` - Non-interactive install/provenance smoke pattern.

### External Evidence Captured

- `npm view @opengsd/gsd-core version dist-tags versions --json` on 2026-07-03 returned latest stable `1.6.1`, next `1.7.0-rc.2`, and stable versions including `1.5.0`, `1.6.0`, and `1.6.1`.
- `gh repo view open-gsd/gsd-core` on 2026-07-03 showed repo `open-gsd/gsd-core`, default branch `next`, non-archived, updated `2026-07-03T17:50:24Z`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `scripts/lib/upstream-source.js` centralizes upstream package identity and path resolution. Use it instead of hardcoded package paths.
- `scripts/compose.js` already exposes importable SRP stages and writes `.install-meta.json` / `.overlay-manifest.json`; SBOM generation should fit between composition and finalize-dist without weakening clean rebuild behavior.
- `scripts/check-overrides.js` already exports `checkOverrides()`, hash helpers, report formatting, and CLI parsing; semantic staleness should extend this surface with testable helpers rather than fork a second gate.
- `tests/*` already use temp directories and explicit cleanup. New upgrade/registry tests should follow that pattern and avoid global install mutation.
- CI already has blocking override, perf, docs, audit, lint, and test jobs. Phase 43 should add targeted jobs rather than overload existing ones with unrelated responsibilities.

### Established Patterns

- Pure Node.js CommonJS for scripts, no TypeScript.
- Bun is the test runner and package manager for repo verification, but scripts should be Node-compatible where they run under CI or npm lifecycle.
- Exact reviewed upstream pins are mandatory; prerelease and tag-based consumption are disallowed.
- Boundary and upstream-compat remain informational with ratchets; override staleness is blocking.
- `dist/` is composed truth and must not be casually deleted outside compose/finalize flows.

### Integration Points

- `package.json` scripts will need new commands for `verify-upgrade`, compatibility matrix support, SBOM generation, and possibly override churn generation.
- `.github/workflows/ci.yml` will need CI wiring for upgrade verification and compat matrix according to Phase 43 criteria.
- `.planning/vetted-upstream-versions.json` must be introduced as tracked planning/config truth for the matrix.
- CHANGELOG.md needs a generated override-churn insertion point or deterministic update command.
- MAINTENANCE.md needs at least the Phase 43 D-7 evidence record, without pretending Phase 44 documentation completeness is done.

</code_context>

<specifics>
## Specific Ideas

- Treat Phase 43 as proof that upstream bumps are routine reviewed version changes, not sync projects.
- Prefer small, independently verifiable plans: verifier/matrix, semantic staleness, hook reconciliation, dogfood bump, churn/SBOM.
- Current upstream bump candidate is `@opengsd/gsd-core@1.6.1`, but this must be rechecked during execution because upstream is active.
- If a temporary registry or install target is needed, create it under a temp directory and remove it after verification.

</specifics>

<deferred>
## Deferred Ideas

- Dynamic Open GSD `latest` or `next` consumption remains out of scope.
- Semantic override staleness for Markdown files is deferred to v1.3.0 unless Phase 43 research proves a deterministic low-risk implementation.
- Full market-ready gate methodology from the authkey inbox item belongs in Phase 44 or a dedicated methodology phase.
- `teams` config-schema reconciliation remains backlog 999.2 unless a Phase 43 task directly touches config schema.
- Full MAINTENANCE.md completeness, publish provenance, publint, reproducible-build verification, and README polish remain Phase 44.

</deferred>

---

*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
*Context gathered: 2026-07-03*

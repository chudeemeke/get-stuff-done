---
phase: 35
reviewers: [codex, claude]
reviewed_at: 2026-03-30T12:00:00Z
plans_reviewed: [35-01-PLAN.md, 35-02-PLAN.md, 35-03-PLAN.md]
---

# Cross-AI Plan Review -- Phase 35

## Codex Review (OpenAI)

### 35-01-PLAN.md

**Summary:** Strongest of the three plans. Correctly targets the real migration blockers for shipping v3.0.0: package contents, launcher import paths, and non-interactive v2 cleanup. The sequencing is mostly right, but the plan is still under-testing the most dangerous change: automatic recursive deletion during upgrade.

**Strengths**
- Directly addresses the known bin/gsd.js packaging failure
- Correctly normalizes package.json toward composed dist/ shipping
- Explicitly resolves the overlay/.overlay-manifest.json confusion
- Keeps scope contained to the files that actually matter for migration
- Updates tests alongside behavior changes

**Concerns**
- HIGH: cleanupV2() becomes non-interactive and destructive, but the plan only tests positive detection paths. No false-positive protection tests or safety guards around fs.rmSync(...)
- HIGH: Changing bin/gsd.js to ../dist/src/... may fix the published package while breaking local/dev launcher usage when dist/ has not been composed yet
- MEDIUM: The plan removes --force entirely. Unnecessary churn for a CLI flag and may break existing scripts. A deprecated no-op is safer
- MEDIUM: Verification is mostly string matching, not runtime validation from a packed artifact

**Suggestions**
- Add negative tests for v2 detection
- Add a guard in cleanupV2() that refuses to delete clearly unsafe targets
- Keep --force accepted but deprecated instead of removing it
- Add a smoke test from an extracted npm pack tarball
- Add a fallback in bin/gsd.js from dist/src to overlay/src, or document that local use requires compose

**Risk Assessment:** MEDIUM-HIGH

### 35-02-PLAN.md

**Summary:** Conceptually simple and mostly appropriate. Cleanly separates legacy tagging and migration docs from code changes.

**Concerns**
- HIGH: Plan is marked autonomous: true even though git push origin v2.4.0-legacy is a remote, credentials-bearing action
- MEDIUM: Hardcodes commit 681dab8 instead of deriving it from v2.4.0 tag
- MEDIUM: UPGRADING.md alone may not be sufficiently discoverable

**Suggestions**
- Make tag creation local-only, move remote push into human-gated lane
- Resolve target commit from git rev-list -n 1 v2.4.0 instead of hardcoding
- Put rollback instructions in README.md or add a prominent link

**Risk Assessment:** MEDIUM

### 35-03-PLAN.md

**Summary:** Has the right broad release flow, but weakest relative to the phase success criteria. Validates the repo state more than the publishable artifact.

**Concerns**
- HIGH: Does not actually verify the package in an isolated packaged environment before release
- HIGH: Phase success criteria require clean-machine install success, but plan only makes post-publish bunx optional
- MEDIUM: npm pack --dry-run conflicts with locked decision D-08 unless explicitly treated as extra safeguard

**Suggestions**
- Replace repo-local smoke checks with artifact-level checks from extracted npm pack tarball
- Make clean-environment install smoke test mandatory
- Add post-publish verification that mirrors the actual user install path

**Risk Assessment:** MEDIUM-HIGH

### Codex Overall
Three things to fix: (1) artifact-level smoke tests from packed package, (2) false-positive and safety-boundary tests for v2 auto-clean, (3) remote tag push and publish mutations into human-gated steps.

---

## Claude Review (Separate Session)

### 35-01-PLAN.md

**Summary:** Addresses the core package reconfiguration needed for v3.0 shipping. Research correctly identified the critical launcher import issue.

**Strengths**
- Correctly identified bin/gsd.js import problem before it became publish-breaking
- Clear mapping between decisions and tasks
- TDD approach with specific test criteria
- Verification commands are concrete and automatable

**Concerns**
- HIGH: Removing --force eliminates ability for users to suppress the auto-clean banner for scripted installs. Keep as "quiet mode"
- HIGH: Auto-clean deletes entire target directory without backup. npm 6->7 and Homebrew don't delete user config dirs wholesale -- they upgrade in place. Consider selective artifact cleanup or backup tarball
- MEDIUM: No rollback procedure if launcher import changes break something
- LOW: Removes git diff --check from prepublishOnly silently

**Suggestions**
- Keep --force but repurpose for silent cleanup in CI/scripts
- Selective v2.x artifact cleanup instead of directory wipe
- Add test verifying node bin/gsd.js --help works after import changes
- Add explicit test that require('../dist/src/platform/paths') exports expected interface

**Risk Assessment:** MEDIUM

### 35-02-PLAN.md

**Concerns**
- MEDIUM: depends_on should clarify execution order vs git history dependency
- LOW: No verification that tag push succeeded

**Suggestions**
- Add git ls-remote --tags origin verification
- Consider adding UPGRADING.md to npm files array
- Verification should grep for full hash not prefix

**Risk Assessment:** LOW

### 35-03-PLAN.md

**Concerns**
- HIGH: No verification that compose succeeded before proceeding (could check stale dist/)
- HIGH: No verification that aidev release major created v3.0.0 tag before proceeding to publish
- MEDIUM: npm pack --dry-run head -30 might not show enough output
- MEDIUM: Post-publish smoke test should be mandatory, not optional

**Suggestions**
- Add compose output validation (check dist/.install-meta.json exists)
- Make post-publish smoke test mandatory
- Add checklist for human operator
- Consider full npm pack (not dry-run) with tarball inspection

**Risk Assessment:** MEDIUM

### Claude Overall
Main risks: (1) aggressive v2.x cleanup potentially deleting user customizations, (2) insufficient verification gates between release and publish, (3) no explicit commit strategy in Plan 01.

---

## Consensus Summary

### Agreed Strengths
- Correct identification and fix of the bin/gsd.js import packaging issue (both reviewers)
- Sound wave structure and dependency ordering (both reviewers)
- TDD approach with concrete acceptance criteria (both reviewers)
- Appropriate scope containment -- no scope creep (both reviewers)

### Agreed Concerns

**HIGH PRIORITY (both reviewers flagged):**
1. **v2.x cleanup is too aggressive** -- cleanupV2() does recursive deletion without false-positive guards, negative tests, or backup. Both reviewers note this is the highest-blast-radius change in the phase. Need: safety guards, negative tests, selective cleanup instead of directory wipe.
2. **--force removal is wrong** -- Both say keep it. Codex says deprecated no-op, Claude says repurpose for silent/quiet mode. Either is better than removal.
3. **Artifact-level verification missing** -- Both reviewers flag that validation is repo-local (string matching, grep) rather than from a packed/extracted npm tarball. The plans validate source state better than packaged-artifact behavior.
4. **Post-publish smoke test should be mandatory** -- Both say the optional bunx install check should be required, not optional.

**MEDIUM PRIORITY (both reviewers flagged):**
5. **Remote tag push should be human-gated** -- Codex flags autonomous: true on a remote push. Claude flags missing verification of push success. Both agree remote mutations need more care.
6. **Hardcoded commit hash is brittle** -- Codex says derive from v2.4.0 tag. Claude also notes this concern.
7. **bin/gsd.js import may break local dev** -- Both note the change fixes npm but could break local launcher when dist/ hasn't been composed.

### Divergent Views

| Topic | Codex | Claude |
|-------|-------|--------|
| --force handling | Deprecated no-op | Repurpose as quiet mode for scripted installs |
| v2.x cleanup fix | Add safety guards (refuse unsafe targets like home dir) | Selective artifact deletion or backup tarball |
| UPGRADING.md discoverability | Link from README | Add to npm files array |
| Plan 01 overall risk | MEDIUM-HIGH | MEDIUM |

### Actionable Items for Replanning

1. Add false-positive tests and safety guards to cleanupV2() -- prevent recursive deletion of non-v2 directories
2. Keep --force flag (deprecated no-op or quiet mode -- user decision)
3. Add artifact-level smoke test: npm pack, extract tarball, verify bin/gsd.js runs
4. Make post-publish bunx install test mandatory
5. Derive tag commit from git rev-list -n 1 v2.4.0 instead of hardcoding
6. Move remote tag push to human-gated step (or add push verification)
7. Add local dev fallback or document that bin/gsd.js requires compose for local use
8. Verify compose success (check dist/.install-meta.json) before proceeding in Plan 03

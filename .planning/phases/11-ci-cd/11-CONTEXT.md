# Phase 11: CI/CD - Discussion Context

**Phase Goal:** Automate cross-platform testing via GitHub Actions to catch compatibility regressions before they reach users

**Discussion Date:** 2026-02-16
**Status:** Complete (all areas discussed, ready for planning)

---

## Decision Summary

### 1. Test Scope & Coverage

| Decision | Choice |
|----------|--------|
| Test level | Functional tests (installation, config loading, platform detection, statusline rendering, hook execution, source-to-installed parity) |
| Test targets | Both npm package (install from registry) AND source code (run from repo) |
| Coverage threshold | 95%+ at each metric individually (statements, branches, functions, lines) per WoW standard |
| Testable surface | JavaScript codebase only (installer, platform module, hooks, launcher, gsd-tools). Agent .md files are not code-coverable. |

### 2. Test Infrastructure

| Decision | Choice |
|----------|--------|
| Framework | Bun test (consistent with WoW tooling preferences) |
| Test location | `tests/` at project root |
| Test helpers | Shared fixtures directory at `tests/fixtures/` for mock configs, sample .planning dirs |
| Mocking strategy | Mock everything external (Claude API, git). Fast, deterministic, no secrets needed in CI. |
| Test artifacts | No artifact uploads. Console output is sufficient for GSD's focused test surface (~20-50 tests). |

### 3. Pipeline Structure

| Decision | Choice |
|----------|--------|
| Triggers | PR + push to main |
| OS matrix | All 3 OSes every time (macOS, Linux, Windows). No tiered approach. |
| Pipeline jobs | Lint (ESLint) + Test (bun test) + Source-to-installed parity check |
| Caching | Cache bun dependencies across runs for speed |
| Time target | Under 5 minutes completion (from roadmap) |
| Release validation | No. Release stays manual via aidev release/publish. |

### 4. Failure Policy

| Decision | Choice |
|----------|--------|
| CI enforcement | Signal only (no branch protection). CI runs and reports pass/fail. Failures are fixed reactively. |
| Failure handling | Any OS failure = overall failure. Cross-platform regressions are visible immediately across all 3 OS runs. |
| Branch protection | None. Direct push to main allowed. No PR requirement. Solo developer workflow. |
| PR requirement | Not required. PRs optional for documentation but not enforced. |

**Note:** The "signal only" approach means CI results are informational. The quality gate is the developer's discipline, not automated blocking. This avoids branch/PR ceremony overhead for a solo developer while still providing cross-platform regression visibility.

### 5. Upstream Sync Validation

| Decision | Choice |
|----------|--------|
| Upstream CI | Standard pipeline validates upstream sync commits. No special workflow needed. |
| How it works | When /gsd:upstream pushes cherry-picks, the same CI pipeline runs on push. If a cherry-pick breaks cross-platform compat, CI catches it immediately. |

---

## Updated Success Criteria

From ROADMAP.md with discussion refinements:

1. **GitHub Actions workflow with matrix testing** -- macOS, Linux, Windows. Triggered on PR + push to main. All OSes every run.
2. **Test suite covering functional areas** -- Installation, config loading, statusline rendering, hook execution, source-to-installed parity. Bun test framework. 95%+ coverage at each metric.
3. **CI reports pass/fail as signal** -- No branch protection or merge blocking. CI runs and reports. Developer fixes reactively.
4. **ESLint integration** -- Lint job alongside tests. Violations reported in CI output.
5. **Under 5 minutes completion** -- Bun dependency caching. Parallel OS matrix.
6. **Source-to-installed parity check** -- Automated CI step that verifies project source matches installed distribution.

---

## Constraints & Risks

- **No existing test infrastructure** -- Building from scratch. Test surface is focused (JS files only), but the initial effort to create fixtures, mocks, and test helpers is non-trivial.
- **Bun in CI matrix** -- Bun needs to be installed on all 3 OS runners. Official `oven-sh/setup-bun` action handles this, but macOS/Windows support should be verified.
- **Coverage on limited JS surface** -- GSD is mostly .md files (agents, workflows, commands). The testable JavaScript is ~10-15 files. 95%+ coverage on this surface is achievable but requires thorough testing of edge cases and platform branches.
- **Signal-only enforcement** -- Without automated blocking, regressions can land on main. Mitigated by developer discipline and visible CI status on every push.
- **Mock fidelity** -- Mocking git and Claude API means CI tests don't catch real integration failures. Mitigated by Phase 9's manual test matrix for real-environment validation.

---

## Implementation Notes

- GitHub Actions workflow file at `.github/workflows/ci.yml`
- Bun test with `--coverage` flag for coverage reporting
- ESLint config needed (or verify existing config works)
- Test fixtures should include: sample config.json variants, mock .planning directory, platform-specific path fixtures
- Source-to-installed parity check can reuse logic from Phase 10's parity sync work
- No secrets needed in CI (all externals mocked)

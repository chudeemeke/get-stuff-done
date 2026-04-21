# Phase 41: Foundation — Flip Gate, Install Audit Surface, Windows SLO - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 41-foundation-flip-gate-install-audit-surface-windows-slo
**Areas discussed:** CI structure & flip-gate wiring, Security surface tuning, Windows root-cause approach, Perf baseline shape & scope, Phase completion semantics, Flip-gate self-test

---

## Gray Area Selection

**Question:** Which areas do you want to discuss for Phase 41?

| Option | Description | Selected |
|--------|-------------|----------|
| CI structure & flip-gate wiring | UPGRADE-03 job split + UPGRADE-06 script/fixture/runbook home | ✓ |
| Security surface tuning | SECURITY-01..06 suppression TTL, triage doc, scanners, harden-runner | ✓ |
| Windows root-cause approach | REL-01..03 migration scope, flake tracker, time budget, flag-on-use | ✓ |
| Perf baseline shape & scope | PERF-01..02 ops, runs, file structure, wrapper shape | ✓ |

**User's choice:** All four. Added free-text note "All other gray areas" signaling comprehensive coverage desired.

---

## CI Structure & Flip-Gate Wiring

### Q1: Flip-gate CI split strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Split into two jobs | New `override-check` (blocking), existing `boundary-check` (informational, retains continue-on-error) | ✓ |
| One job, step-level continue-on-error | Smaller YAML diff, boundary step failures get less visibility | |
| One job, soft-exit wrapper on boundary | Wrap `check-boundary.js` in shell wrapper that prints but exits 0 | |

**User's choice:** Split into two jobs (Recommended).
**Notes:** None beyond selection.

### Q2: `.changelog-conflict-check.sh` detection strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Awk/sed state machine | Pure shell, tracks in_published / in_unreleased state, no deps | ✓ |
| Grep heuristic with post-match context | Simpler but more false positives | |
| Markdown AST parser (node) | Most precise, but adds dev dep for a pre-push hook | |

**User's choice:** Awk/sed state machine (Recommended).
**Notes:** None.

### Q3: Changelog-conflict fixture location

| Option | Description | Selected |
|--------|-------------|----------|
| `tests/fixtures/changelog-conflict/` directory | Mirrors existing fixture convention, easy to extend | ✓ |
| Inline heredoc in script (`--self-test`) | Co-locates logic+fixture but bloats script | |
| `tests/changelog-conflict-check.test.js` | Fully test-driven, but markdown fixtures as JS strings are hard to eyeball | |

**User's choice:** `tests/fixtures/changelog-conflict/` (Recommended).
**Notes:** None.

### Q4: Bump runbook location given DOCS-01 is Phase 44

| Option | Description | Selected |
|--------|-------------|----------|
| Stub MAINTENANCE.md now, Phase 44 completes | Single-file path, no later migration | ✓ |
| Standalone `docs/BUMP.md` in Phase 41, fold later | Cleaner boundary but needs move+link updates | |
| Wire script, defer all docs to Phase 44 | Risks script shipping without documented home | |

**User's choice:** Stub MAINTENANCE.md now (Recommended).
**Notes:** None.

---

## Security Surface Tuning

### Q1: Suppression TTL default + CI behavior on expiry

| Option | Description | Selected |
|--------|-------------|----------|
| 60 days, hard-fail on expiry | Quarterly cadence, forces attention | ✓ |
| 30 days, warn-then-fail with grace period | Shorter cycle, softer but more complex state | |
| 90 days, hard-fail on expiry | Longer window, quarterly-plus cadence | |

**User's choice:** 60 days, hard-fail (Recommended).
**Notes:** None.

### Q2: Security triage policy document location

| Option | Description | Selected |
|--------|-------------|----------|
| `SECURITY.md` at repo root | GitHub convention, auto-surfaced | ✓ |
| Section inside `.planning/audits/POLICY.md` | Co-located with suppressions.json | |
| Section inside MAINTENANCE.md (Phase 44) | Defers commitment until Phase 44 | |

**User's choice:** `SECURITY.md` at repo root (Recommended).
**Notes:** None.

### Q3: Gitleaks + osv-scanner scoping

| Option | Description | Selected |
|--------|-------------|----------|
| Gitleaks + .gitleaks.toml allowlist, osv-scanner direct+transitive HIGH+ | Right-sized signal, catches Axios-style transitives | ✓ |
| Stock gitleaks, osv-scanner direct only | Less noise but misses transitive CVEs | |
| Custom gitleaks ruleset, osv-scanner everything (LOW+) | Maximum paranoia, noisy CI | |

**User's choice:** Allowlist + direct+transitive HIGH+ (Recommended).
**Notes:** None.

### Q4: Harden-runner audit log location + review cadence

| Option | Description | Selected |
|--------|-------------|----------|
| GHA artifact + weekly MAINTENANCE.md log entry | Durable written record, 2-weeks-clean gates block-mode | ✓ |
| External collector (commit summaries to repo) | CI write-back complexity, commit noise | |
| GHA artifact only, no written log | 7-day retention, informal review | |

**User's choice:** GHA artifact + weekly MAINTENANCE.md log (Recommended).
**Notes:** None.

---

## Windows Root-Cause Approach

### Q1: Promise.race migration scope

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted: known-flaky sites first | Apply to observed-flaky tests only, measure before/after | |
| Blanket: all test-file subprocess sites | Uniform code, single-PR review, prevents drift | ✓ |
| Targeted + helper in tests/helpers/ | Same targeted scope + reusable helper | |

**User's choice:** Blanket — all test-file subprocess sites.
**Notes:** Deviation from Recommended (Targeted). Claude flagged concern: larger diff, some sites may not need it. User's choice stands: uniform code is easier to review and prevents drift.

### Q2: Per-test flake tracking mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| CI summary + local JSONL log | Right-sized for solo dev, durable record | |
| GHA annotations only (ephemeral) | No new files, 90-day retention | |
| Full observability: external collector | Claude flagged "too much infrastructure for single-maintainer" | ✓ (with clarification) |

**User's choice (initial):** Full observability / external collector.
**Claude's follow-up:** Pushed back — no existing collector; clarified with 4-option disambiguation.
**User's choice (clarified):** "Let's use GitHub Issues for now but my goal is to build towards my own external collector that's exposed via Tailscale."

**Notes (critical, saved to global memory):** User explicitly rejected "single-maintainer scope-cutting" framing: *"I've chosen not to build it with the mindset as it'll make me cut corners and limit the standards of the project."* Recorded as feedback memory; affects ALL future tradeoff recommendations on this project.

### Q3: Time budget for root-cause before REL-03 fallback

| Option | Description | Selected |
|--------|-------------|----------|
| 2 days focused effort, then REL-03 for residual | Hard boundary, finishable phase | ✓ |
| 1 day effort, aggressive REL-03 use | Ships sooner but larger REL-03 surface | |
| No time cap | Risks indefinite stall on one stubborn test | |

**User's choice:** 2 days + REL-03 for residual (Recommended).
**Notes:** None.

### Q4: REL-03 "flagged-on-use" meaning

| Option | Description | Selected |
|--------|-------------|----------|
| GHA job summary + skip wrapper + MAINTENANCE.md table | Three friction surfaces, maintainer sees every run | ✓ |
| Only in test output (`SKIPPED: REL-03-N`) | Lower friction, easier to forget | |
| Fail CI on expired deadline (hard) | Strongest forcing function, but can block unrelated work | |

**User's choice:** GHA summary + wrapper + MAINTENANCE.md table (Recommended).
**Notes:** None.

---

## Perf Baseline Shape & Scope

### Q1: What each bench operation measures

| Option | Description | Selected |
|--------|-------------|----------|
| `bun install` cold + `bun run compose` + full test suite | Realistic end-to-end numbers | ✓ |
| Tarball cold-install + compose + test | More like cousin-test UX, but overlaps Phase 42 SHIP-07 | |
| bun install + compose + smoke subset | Cheaper CI but signal-negative for Windows concern | |

**User's choice:** bun install + compose + full suite (Recommended).
**Notes:** None.

### Q2: hyperfine runs/warmups

| Option | Description | Selected |
|--------|-------------|----------|
| 3 warmups, 5 runs per op | Halved from hyperfine default, usable signal | ✓ |
| 3 warmups, 10 runs (hyperfine default) | Maximum stability, doubles CI cost | |
| 1 warmup, 3 runs | Cheapest but noisy baseline | |

**User's choice:** 3 warmups, 5 runs (Recommended).
**Notes:** None.

### Q3: perf-baseline.json file structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single file at repo root, keyed by platform | Matches PERF-02 wording, easy git-diff | ✓ |
| Three files in `.planning/perf/{os}-baseline.json` | Per-platform isolation, but contradicts "repo root" | |
| Single file in `.planning/perf/baseline.json` | Scoped under .planning/, contradicts "repo root" | |

**User's choice:** Single file at repo root, platform-keyed (Recommended).
**Notes:** None.

### Q4: bench.js wrapper vs raw hyperfine output

| Option | Description | Selected |
|--------|-------------|----------|
| bench.js normalizes into stable AJV-validatable schema | Decoupled from hyperfine version, PERF-03 consumer-ready | ✓ |
| Raw `--export-json` committed verbatim | Zero transformation but schema drift risk | |
| Minimal (mean_ms only) | Tiny diffs, loses stddev needed for PERF-04 | |

**User's choice:** Normalized wrapper with AJV schema (Recommended).
**Notes:** None.

---

## Phase Completion & Self-Test (Follow-ups)

### Q1: REL-01 "phase completion criterion" semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Mechanism ships in execute-phase; 10-run validation is gated post-execute step | Verifiable bar, phase finishable | ✓ |
| Phase done only after 10 green runs on phase's own PR | Enforcement built-in, but multiplies PR CI cost | |
| 10-run validation deferred to Phase 42 entry gate | Looser, trades accountability for velocity | |

**User's choice:** Mechanism ships + gated post-execute 10-run validation (Recommended).
**Notes:** None.

### Q2: Flip-gate self-test scope

| Option | Description | Selected |
|--------|-------------|----------|
| Unit test in check-overrides.test.js + integration test with temp overlay fixture | Proves gate works before relying on it | ✓ |
| Weekly cron workflow asserting gate failure on stale fixture branch | Covers CI-level behavior, adds cron maintenance | |
| No self-test, rely on first real stale-override event | Cheapest, risks silent gate failure | |

**User's choice:** Unit + integration test (Recommended).
**Notes:** None.

---

## Wrap-up

**Question:** We've discussed [all four areas + completion semantics + self-test]. Remaining gray areas?

| Option | Description | Selected |
|--------|-------------|----------|
| Ready for context | Write CONTEXT.md with 18 decisions captured | ✓ |
| Explore more gray areas | SECURITY-05 rule set details, interdependency ordering, etc. | |

**User's choice:** Ready for context (Recommended).

---

## Claude's Discretion

User deferred the following implementation details to Claude (documented in CONTEXT.md `<decisions> ### Claude's Discretion`):

- Exact AJV schema shapes for suppressions.json and perf-baseline.json (follow Phase 39 precedent)
- File/function organization within scripts/bench.js, .changelog-conflict-check.sh, GHA Script for flake-report
- Exact error message strings (cli-standards rule applies)
- Which specific eslint-plugin-security rules to audit (SECURITY-05)
- Test fixture layout inside tests/fixtures/changelog-conflict/
- GHA Script dedup logic for flake-report issue filing
- hyperfine invocation details (spawn vs Node wrapper — spawn recommended)

## Deferred Ideas (Noted for Future Phases)

- **Own Tailscale-exposed flake collector** (user's stated future direction, replaces GitHub Issues interim from D-10)
- Phase 44 completes MAINTENANCE.md (DOCS-01)
- Phase 44 promotes harden-runner to block-mode (SECURITY-04 conditional)
- Phase 42 PERF-03/04/05 (regression gate + accepted regressions)
- Phase 42 PROCESS-01..07 (oversight triggers)
- Phase 43 UPGRADE-07..09 (upstream hook merge, semantic staleness, CHANGELOG churn)

## Critical Feedback Captured to Global Memory

During Q2 of the Windows area, the user surfaced a standing preference that had been implicit:

> "Yes, this project is a single maintainer but I've chosen not to build it with the mindset as it'll make me cut corners and limit the standards of the project, so keep that in memory."

Saved to `~/.claude/projects/<get-stuff-done>/memory/feedback_project_standards_over_single_maintainer.md` and indexed in `MEMORY.md`. All future tradeoff recommendations on this project must evaluate as if team-scale standards apply, not solo-dev corner-cutting standards.

---

## Post-Discussion Architectural Review (2026-04-21)

After decisions D-01..D-18 were initially captured, the user explicitly requested a critique against the skin-fork principle and industry best practice before proceeding to planning:

> "actually before we go further I'd like you to critique this approach and point out the issues and potential issues using the industry best practice and my choices so far in this project since I decided to go with the 'skin' fork approach, I'd like to ensure that I'm not making terrible choices or not longer adhering to my own 'skin' only no changes to the upstream's codebase before I jump to planning."

The user also surfaced a timing meta-question ("Is this the best stage to do this review of after planning?"). Answer captured: **two distinct reviews** exist — architectural/skin-fork (cheapest pre-planning) and plan-quality (post-planning, handled by gsd-plan-checker + /gsd:review). They are not substitutes.

### Skin-fork boundary check — clean pass

Reviewed all 18 decisions against PROJECT.md's overlay principle. No decision modifies upstream code or `.upstream/`. New fork-scoped artifacts (`suppressions.json`, `perf-baseline.json`, `test-timing.json`, `SECURITY.md`, `MAINTENANCE.md`, `.changelog-conflict-check.sh`) are net-additions to fork surface, not upstream edits.

**One latent skin-fork risk surfaced:** D-09's blanket timeout migration could silently patch upstream bugs if flaky subprocess call sites exercise composed `dist/` rather than fork-only code. Amendment A-04 adds mandatory research triangulation (classify every flaky call-site as fork-only / upstream-code / CI-plumbing) before committing to blanket migration as the cure. Upstream-code flakes must be filed as upstream issues, not patched fork-side.

### Six amendments applied in place (decisions retain D-numbers)

| Amendment | Target | Severity | Summary |
|-----------|--------|----------|---------|
| A-01 | D-02 | 🟡 | Added planned migration to markdownlint/remark once Phase 42 DOCS-06 lands; scope-cap on awk script (no 2nd pattern before migration). Awk markdown parsers don't scale. |
| A-02 | D-04 | 🟢 | Replaced "stub" with "scope-partial, quality-full." Sections that exist in Phase 41 MUST meet DOCS-01 acceptance (15+ lines, executable example). No half-quality artifacts. |
| A-03 | D-07 | 🟡 | Reversed scanner-level severity pre-filter. All severities scanned; HIGH+ blocks; MEDIUM/LOW flow through the D-05 suppression workflow (single pane of glass). |
| A-04 | D-09 | 🟡 | Softened "`Promise.race([child, timer])`" (error-prone ~2016 pattern) to "built-in Node ≥18 timeout with guaranteed child cleanup" (execSync timeout / AbortSignal.timeout / spawn signal). Rejected hand-rolled Promise.race without explicit kill. Added mandatory skin-fork triangulation. |
| A-05 | D-10 | 🟢 | Added dedup key (`test-file::test-name::platform`), structured label taxonomy (`flake-platform-*`, `flake-file-*`, `rel-03-candidate`), 30-day auto-close, scope-cap threshold (>5 flakes/week expedites Tailscale collector). |
| A-06 | D-13 / D-15 / D-16 | 🟡 | Split bench output. `perf-baseline.json` at repo root keeps ONLY install + compose (scope-stable, budget-enforceable). Test-suite timing moves to `.planning/perf/test-timing.json` with per-file tracking and suite-growth-tolerant semantics. Avoids perverse incentive where adding tests fails Phase 42's 1.25x budget gate. |

### Industry-best-practice issues that did NOT require changes

Re-reviewed for completeness; the following decisions held up and were NOT amended:
- D-01 (job split) — textbook CI separation
- D-05 (suppression TTL + AJV strict) — matches Snyk/Dependabot norms
- D-06 (SECURITY.md at root) — GitHub convention
- D-08 (harden-runner audit→block with observation period) — step-security's recommended rollout
- D-11 / D-12 / D-17 — time-box + triple-surface visibility + gated closure is mature SLO practice
- D-14 (3 warmups × 5 runs) — defensible hyperfine parameters
- D-18 (test-the-tester) — standard

### User response

> "Yes, I'd happily accept all your recommendations"

All six amendments applied. The CONTEXT.md Amendments Log documents the delta; downstream agents treat the amended decisions as canonical.

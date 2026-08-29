---
context: phase
phase: 40.5-upstream-bump-reverify-phase-41-decisions
task: 04-01
total_tasks: 5
status: ready_to_start
last_updated: 2026-05-15T18:00:00Z
---

# BLOCKING CONSTRAINTS — Read Before Anything Else

- [ ] CONSTRAINT: **Skin discipline** — fork-owned paths only; pre-edit verification protocol in project root `CLAUDE.md`. Source Parity Check job in CI is the empirical gate.
- [ ] CONSTRAINT: **A-06+A-10 binding-gate set defines "CI clean"** — Workflow Lint + Lint + Source Parity Check + Boundary & Override Check + Secret Scan all success. Test/Upstream Compat allowlisted chronic; net regression vs main excluding allowlisted = 0.
- [ ] CONSTRAINT: **Branch protection ENFORCED on main** — 5 required status checks. Linear history required.
- [ ] CONSTRAINT: **DO NOT bump upstream past v1.39.1** — v1.41.x re-introduces bash-breaking `&` prefix (PR #3368). v1.39.1 is LAST CLEAN. Subscribed to gsd-build/get-shit-done#3413 via eyes-reaction.
- [ ] CONSTRAINT: **PR #3 push HELD per user direction** until end-of-Wave-5 batch. 5 commits on worktree-agent-a1c0cd52236103329 awaiting push (`53312eb`, `cd5ea78`, `db8de74`, `0b7b434`, `0abd5b5`).
- [ ] CONSTRAINT: **Settings.json edits via gsd-doctor or Prong-1 script only.** `.bak.2026-05-14T12-18-09-234Z` is the rollback path.

**Do not proceed until all boxes are checked.**

## Session-state context for resume

**What just shipped (Wave 3 + post-Wave-2 Path A extension):**

- `0abd5b5` Wave 3: compose-collision audit + 40.5-COLLISIONS.md
  - bun run compose exit 0 (928 files, 18 branding rules, no COMP-08)
  - Static cross-check 33 overlay paths vs v1.39.1 = 0 collisions
  - PR #1859 NO FORK DIVERGENCE (verbatim composition)
- `0b7b434` Path A extension: 71 substitutions of `1.38.5` → `1.39.1` across Waves 3/4/5 plans
  - Wave 3 plan: 34 subs
  - Wave 4 plan: 20 subs
  - Wave 5 plan: 17 subs

**Where we are in Phase 40.5:** Waves 1, 1.5, 1.6, 1.7-A, 1.7-01, 1.8, 2, 3 all complete. **Wave 4 next** (~150 min — 24-decision matrix verification → DECISION-VERIFY.md).

## Critical findings to carry forward (from Wave 3)

| Finding | Implication for Wave 4/5 |
|---|---|
| 1.38.2..1.39.1 upstream delta is **631 files** (much larger than RESEARCH.md §1's "5 commits / 2 files" reconciliation note scoped — that note covered overrides only, not full upstream churn) | Wave 4 verifying D-XX/A-XX decisions: when a prediction's reasoning scope is narrower than reality scope, check the prediction's CONCLUSION held, not just whether the reasoning was complete. |
| Fork has 33 overlay paths (21 RESEARCH.md §1 baseline + 12 new under `overlay/src/*`) — all non-colliding | Wave 5 override REWRITE doesn't add overlay files; both targets are in `overrides/hooks/`. |
| PR #1859 review.md = NO FORK DIVERGENCE — verbatim composition | D-09 (40.5 methodology audit) resolved without action. |
| `gsd-statusline.js` override is NON-ROUTINE drift — upstream #2219 evolved exact override concern (env-var-based autocompact scaling). Wave 5 disposition = REWRITE per A-12 (not DELETE). | Wave 5 task spec should include cherry-picking #2219 + #1990 + #2884 from upstream while preserving fork's `gsd.role` routing + branding. See DRIFT-LOG.md "Note for Phase 43 UPGRADE-07" for the rich fold guidance — Wave 5 can lift those notes into its own plan. |

## Anti-patterns observed this session

| Pattern | Severity | Mitigation |
|---|---|---|
| Append-after-placeholder structural slip — initialized file with `## Section\n(Populated in Task ZZ)` placeholders, then appended sections later that landed AFTER the placeholders, creating duplicate H2s. | medium | Full file rewrite at completion is safer than incremental append; OR skip placeholder skeleton and compose final file at end of wave. |
| Earlier RESEARCH.md baseline scoped reasoning narrowly (1.38.2..1.39.1 = "5 commits / 2 files" for overrides) — surface read suggested whole-delta was small. | low | Wave 3 caught this empirically; carry forward to Wave 4 as awareness, not as RESEARCH.md correction. |

## Required reading before proceeding

| File | Why |
|---|---|
| `<repo-root>/CLAUDE.md` | Skin-discipline contract, A-06+A-10 reference |
| `.planning/HANDOFF.json` | Machine-readable state (this session's second update) |
| `.planning/phases/40.5-.../40.5-CONTEXT.md` | 23 decisions D-01..D-23 + amendments A-01..A-12 |
| `.planning/phases/40.5-.../40.5-04-PLAN.md` | Wave 4 plan (already retargeted to v1.39.1 in `0b7b434`) |
| `.planning/phases/40.5-.../40.5-COLLISIONS.md` | Wave 3 evidence; Wave 5 will cite |
| `.planning/phases/40.5-.../40.5-DRIFT-LOG.md` | Wave 2 evidence; Wave 5 will cite + lift UPGRADE-07 fold guidance |
| `~/.claude/projects/.../memory/SESSION_LOG.md` | 2026-05-14/15 section now covers all 6 tracks |
| `~/.claude/projects/.../memory/project_state.md` | Updated for Wave 3 done |

## First action when resuming

1. Run `/gsd:resume-work`.
2. Verify worktree HEAD: `git -C .claude/worktrees/agent-a1c0cd52236103329 log -1 --oneline` should show `0abd5b5`.
3. Verify PR #4 still OPEN.
4. Verify branch protection still live.
5. **No version-substitution needed** — Wave 4 plan was already retargeted to v1.39.1 in commit `0b7b434`.
6. Proceed to Wave 4 Task 04-01. Plan file: 40.5-04-PLAN.md.

## Note for future-me

Wave 4 is the heaviest remaining (~150 min). It verifies all 24 D-XX/A-XX decisions from CONTEXT.md against current state. Per the Wave 3 lesson: when a decision's reasoning scope is narrower than reality scope, focus on whether the CONCLUSION held, not whether the reasoning is exhaustive. Surface mismatches as enrichment opportunities, not as decision invalidation, unless the conclusion itself is wrong.

Wave 5 (after Wave 4) is the override REWRITE. DRIFT-LOG.md per-override "Note for Phase 43 UPGRADE-07" sections contain rich fold guidance — Wave 5 should lift those notes into its task spec. Specifically:
- `gsd-statusline.js`: cherry-pick #2219 (env-var autocompact) + #1990 (GSD state surfacing) + #2884 (phase-lifecycle scenes); preserve `gsd.role` consumer/maintainer routing + branding.
- `gsd-check-update.js`: adopt worker-script architecture (`gsd-check-update-worker.js`); reconcile MANAGED_HOOKS list with #2224 + #2141 improvements.

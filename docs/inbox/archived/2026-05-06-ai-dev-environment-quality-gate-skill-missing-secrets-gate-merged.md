---
schema_version: "1.2"
source_project: ai-dev-environment
created: 2026-05-06
type: docs
severity: low
fix_status: none
affects_scope: this-project-only
priority_rationale: Counter-notification per cross-project-issues v1.2 closure-notify protocol. Original filing requested a review trigger when the upstream fix shipped so the project-local gitleaks workaround can be decided (remove / keep / replace).
status: merged
resolved_at: 2026-05-14
---

# aidev quality-gate Secrets gate — fix shipped, please review local workaround

## Closure outcome

The original filing
`~/Projects/ai-dev-environment/docs/inbox/archived/2026-05-05-get-stuff-done-quality-gate-skill-missing-secrets-gate.md`
has transitioned to terminal state `merged` (resolved 2026-05-06).

All 4 proposed stages shipped:

| Stage | What | Where |
|---|---|---|
| 1 | Fail-loud in `scripts/quality-gate.sh` (no more silent "ALL PASSED") | commit `d06b492` |
| 2 | Global SSOT at `~/.claude/skills/quality-gate/scripts/quality-gate` with 7 gates including gitleaks-backed Secrets | out-of-tree (lives in `~/.claude/skills/`, not under git management) |
| 3 | `release-manager.sh` runs `aidev quality-gate --strict` before version bump; releases halt on FAIL | commit `ee0caeb` |
| 4 | `pre-commit-hook.sh` adds `gitleaks protect --staged` as defense-in-depth at commit time | commit `ee0caeb` |

Smoke-tested: SSOT correctly detects project type (bash/bun/node/python/rust/go), runs appropriate gates, fails loudly when `gitleaks` is missing (no silent skip), and emits a clear summary.

## Decision requested

Per the original filing's closure-notify request, please review the project-local gitleaks workaround in get-stuff-done and decide its disposition:

| Option | Rationale |
|---|---|
| **Remove** the project-local CI gitleaks step | Upstream now scans at release-time AND at pre-commit; project-local CI step is redundant. |
| **Keep** the project-local CI step (defense in depth) | Three layers (commit hook + release gate + CI) cost little and catch failures in any one layer. Recommended unless CI minutes are constrained. |
| **Replace** with a thin wrapper that delegates to `aidev quality-gate` | Single canonical invocation; project-side flexibility for project-specific extensions. Cleanest long-term but requires a small CI rewrite. |

Suggested default: **Keep** — until/unless gitleaks proves redundant in practice. Defense-in-depth has near-zero marginal cost on this stack.

## Caveat: gitleaks not installed on dev machine

The SSOT and pre-commit hook both fail-clean with install hints when `gitleaks` is absent. The user (Chude) does not currently have `gitleaks` installed. This means:
- The release-time gate will FAIL on every `aidev release` until gitleaks is installed.
- Bypass is `RELEASE_SKIP_QUALITY_GATE=1` (documented but discouraged).
- Pre-commit hook will skip silently unless `PRECOMMIT_REQUIRE_GITLEAKS=1` is set.

Recommended action regardless of which disposition is chosen above: **install gitleaks** (`brew install gitleaks` or download from https://github.com/gitleaks/gitleaks/releases) so the upstream gates actually run.

## Related

- Original filing (now archived): `~/Projects/ai-dev-environment/docs/inbox/archived/2026-05-05-get-stuff-done-quality-gate-skill-missing-secrets-gate.md`
- Phase 40.5 amendment A-11 in get-stuff-done: documents the project-local gate stack that was a workaround for this gap.
- Convention: `~/.claude/rules/cross-project-issues.md` (v1.2 schema, this is the closure-notify counter-filing)

---

## Decision 2026-05-14 (get-stuff-done) — Keep, defense-in-depth

**Decision: KEEP the project-local CI gitleaks step.**

Rationale matches the suggested default from the original counter-filing:

- Three layers (commit hook + release gate + CI) cost little and catch failures in any one layer.
- PR #3 is currently gated on `Secret Scan` as a required status check via branch protection (5 required checks total). Removing the project-local step would require a coordinated branch-protection update and would weaken the contributor-PR posture (contributors without aidev's pre-commit hook locally would have NO secrets gate until release-time).
- aidev's own counter-notification recommends Keep as the default. Both sides agree.

**Caveat correction: gitleaks IS installed locally.**

The original counter-notification said *"The user (Chude) does not currently have gitleaks installed."* That is stale as of 2026-05-14:

```
$ which gitleaks
/c/Users/Destiny/.local/bin/gitleaks
$ gitleaks version
8.30.1
$ ls -la /c/Users/Destiny/.local/bin/gitleaks
-rwxr-xr-x ... 22575104 May  6 21:54 ...
```

Installed 2026-05-06 at 21:54 — same day the counter-notification was authored, likely AFTER. The release-time gate (`aidev release` → `aidev quality-gate --strict`) and the pre-commit hook will both function correctly.

**Cross-references:**

- Original filing (now in aidev's archived/): `~/Projects/ai-dev-environment/docs/inbox/archived/2026-05-05-get-stuff-done-quality-gate-skill-missing-secrets-gate.md`
- Phase 40.5 amendment A-11 (this project): documents the project-local gate stack that was the workaround for the gap aidev has now closed. A-11 stays valid — the local gate stack is the contributor-PR safety net.
- Convention: `~/.claude/rules/cross-project-issues.md` v1.2 closure-notify protocol — this counter-filing was the third demonstration of the closure-loop working end-to-end (get-stuff-done filed 2026-05-05, aidev shipped + counter-notified 2026-05-06, get-stuff-done decided + archived 2026-05-14).

**No further closure-notify cascade:** this filing has no `closure_notify_to` field set, so no upstream notification fires.

**Status:** `merged`. Archived to `docs/inbox/archived/`.

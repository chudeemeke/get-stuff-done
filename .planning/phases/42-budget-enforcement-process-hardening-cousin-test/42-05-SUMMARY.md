---
phase: 42-budget-enforcement-process-hardening-cousin-test
plan: 05
subsystem: docs
tags: [markdownlint, lychee, ci, docs-gates, tdd]

requires: ["42-03"]
provides:
  - tracked markdown lint command
  - tracked markdown link checker CI gate
  - markdownlint-cli2 configuration
  - lychee configuration
  - repaired tracked documentation links
affects: [phase-42, docs, ci, requirements]

key-files:
  created:
    - scripts/lint-docs.js
    - .markdownlint-cli2.yaml
    - lychee.toml
    - tests/docs-gates.test.js
  modified:
    - .github/workflows/ci.yml
    - package.json
    - bun.lock
    - tests/ci-workflow.test.js
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md

requirements-completed: ["DOCS-05", "DOCS-06"]
requirements-advanced: []

completed: 2026-07-03
---

# Phase 42 Plan 05: Markdown And Link Docs Gates Summary

## Accomplishments

- Added `markdownlint-cli2@0.23.0` and package script `lint:docs`.
- Added `scripts/lint-docs.js`, which discovers tracked markdown through `git ls-files "*.md"` and passes explicit literal paths to markdownlint-cli2.
- Added `.markdownlint-cli2.yaml` with deliberately narrow rules that catch deterministic markdown structure/spacing issues without rewriting historical planning evidence wholesale.
- Added `lychee.toml` and a `docs-gates` job in `.github/workflows/ci.yml`.
- Extended `tests/ci-workflow.test.js` and added `tests/docs-gates.test.js` to lock the docs gate contract.
- Repaired tracked markdown/link issues surfaced by the new gates:
  - removed the dead `uberfuzzy/gsd-gemini` README community-port link.
  - updated historical upstream links from stale `glittercowboy/get-stuff-done` references to verified `gsd-build/get-shit-done` targets where a current canonical target exists.
  - converted placeholder/template links and unavailable historical third-party source links to plain text.
  - corrected missing changelog release-reference targets for versions without corresponding GitHub releases/tags.
  - fixed markdown whitespace/heading issues found by markdownlint.

## Gate Scope

Docs gates apply to tracked markdown, not generated/vendor/dependency markdown copies.

Excluded path prefixes:

- `node_modules/`
- `dist/`
- `.upstream/`
- `overlay/get-shit-done/`

URL policy:

- `http://localhost...` URLs are excluded as command-template examples, not public documentation links.
- HTTP `403` is accepted for bot-protected public sites that are reachable for browsers but reject automated link checkers.
- HTTP `429` remains accepted for rate-limited public endpoints.

No broad ignore excludes `.planning/`, `docs/`, or root markdown.

## Verification

- `npm view markdownlint-cli2 version bin` - confirmed current `0.23.0`.
- `gh release list --repo lycheeverse/lychee --limit 5` - confirmed current lychee v2 action line remains available; local binary verification used official `lychee-v0.24.2`.
- `bun install --frozen-lockfile --ignore-scripts` - passed with no lockfile changes.
- `bun run lint:docs` - passed; markdownlint reported 0 errors.
- Local lychee equivalent - passed with official `lychee-v0.24.2`: 602 total links, 431 unique, 593 OK, 0 errors, 7 expected exclusions, 2 unsupported `git+https` URLs, 22 redirects.
- `bun test tests/docs-gates.test.js tests/ci-workflow.test.js` - 17 pass, 0 fail.
- `bash scripts/lint-workflows.sh` - passed.
- `bun run lint` - passed with existing repository baseline: 135 warnings, 0 errors.
- `git diff --check` - passed.

## Verification Caveat

`bun test` was attempted as a full-suite local check, but the invocation timed out after 5 minutes without useful progress output. The orphaned `bun.exe` process that started with the timed-out run was stopped by PID after verifying it was the only Bun process and was started at the full-test launch time. This branch did not change runtime logic; targeted docs/CI tests and docs gates passed locally. Remote CI remains the authoritative full-suite gate for this PR.

## Deviations

- Added `.upstream/` to the generated/vendor/dependency exclusion set. It is a tracked upstream snapshot, not fork-owned documentation, so making it drive docs-gate failures would be a false ownership signal.
- Fixed live broken user-facing links instead of adding broad lychee exclusions.

## Next Phase Readiness

Phase 42 is complete after this PR merges. Phase 43 can start upgrade-resilience work against the Phase 41/42 enforcement surface: override staleness, perf budgets, cousin install, oversight probes, and docs gates.
